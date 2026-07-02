import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// レビュースクリプト群（claude/codex/copilot/gemini/cursor-review.sh + review-common.sh）の
// 決定論的 smoke test（Issue #452）。
// PR #449 で multi-agent.sh の長期潜伏バグが発覚した教訓（ACE-449-1）に基づき、
// レビューインフラ自体の分岐を実 CLI なしで回帰テストする。
//
// 検証する分岐:
// - SKIP_<X>_REVIEW=1 → exit 0（スキップ）
// - SKIP と REQUIRE の同時指定 → exit 2（設定エラー）
// - CLI 不在（soft skip）→ exit 0 / REQUIRE=1 なら exit 2
// - スタブ CLI + 実 diff → Verdict PASS で exit 0 / FAIL で exit 1
// - 変更なし → exit 0（Nothing to review）

const REPO_ROOT = resolve(__dirname, "..");

interface ReviewScript {
  script: string;
  cli: string;
  envPrefix: string;
}

const SCRIPTS: ReviewScript[] = [
  { script: "claude-review.sh", cli: "claude", envPrefix: "CLAUDE" },
  { script: "codex-review.sh", cli: "codex", envPrefix: "CODEX" },
  { script: "copilot-review.sh", cli: "copilot", envPrefix: "COPILOT" },
  { script: "gemini-review.sh", cli: "gemini", envPrefix: "GEMINI" },
  { script: "cursor-review.sh", cli: "cursor-agent", envPrefix: "CURSOR" },
];

// git 等の基本コマンドだけを含む最小 PATH（実 CLI を確実に見えなくする）
const BASE_PATH = "/usr/bin:/bin";

let passStubDir: string | undefined;
let failStubDir: string | undefined;
let fixtureRepo: string | undefined;
let cleanRepo: string | undefined;

function makeStubDir(verdict: "PASS" | "FAIL"): string {
  const dir = mkdtempSync(join(tmpdir(), `review-stub-${verdict.toLowerCase()}-`));
  for (const { cli } of SCRIPTS) {
    const stub = join(dir, cli);
    // stdin（diff）のバイト数を検証してから verdict を出す偽 CLI。
    // diff の受け渡しが壊れている（空 stdin）のに PASS するサイレント成功を防ぐ。
    writeFileSync(
      stub,
      [
        "#!/bin/sh",
        'bytes=$(cat | wc -c)',
        'if [ "$bytes" -eq 0 ]; then',
        '  echo "stub: no diff received on stdin" >&2',
        "  exit 1",
        "fi",
        `echo "Verdict: ${verdict}"`,
        "",
      ].join("\n"),
    );
    chmodSync(stub, 0o755);
  }
  // cursor-review.sh は timeout コマンド必須（ハング対策）なので、
  // 第1引数（秒数）を捨てて残りを実行するだけの偽 timeout も用意する
  const timeoutStub = join(dir, "timeout");
  writeFileSync(timeoutStub, `#!/bin/sh\nshift\nexec "$@"\n`);
  chmodSync(timeoutStub, 0o755);
  return dir;
}

function initGitRepo(dir: string): (...args: string[]) => void {
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      // ユーザーのグローバル設定（gpgsign / hooksPath 等）を遮断して決定論化
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" },
    });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  };
  git("init", "-b", "develop");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "base.txt"), "base\n");
  git("add", ".");
  git("commit", "-m", "init");
  return git;
}

/** develop ブランチ + 差分ありの feature ブランチを持つ使い捨て git リポジトリ */
function makeFixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "review-fixture-"));
  const git = initGitRepo(dir);
  git("checkout", "-b", "feature/test");
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "change.ts"), "export const x = 1;\n");
  git("add", ".");
  git("commit", "-m", "feat: change");
  return dir;
}

/** develop のみ（差分なし）の使い捨て git リポジトリ — 「変更なし」テスト専用（共有状態を持たない） */
function makeCleanRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "review-clean-"));
  initGitRepo(dir);
  return dir;
}

function runReview(
  script: string,
  args: string[],
  opts: { cwd?: string; path?: string; env?: Record<string, string> } = {},
) {
  const result = spawnSync("bash", [join(REPO_ROOT, "scripts", script), ...args], {
    cwd: opts.cwd ?? REPO_ROOT,
    encoding: "utf8",
    timeout: 60_000,
    env: {
      HOME: process.env.HOME,
      // TMPDIR を落とすと macOS の git が confstr 警告を stderr に出し、
      // review-common.sh の `git diff ... 2>&1` に混入して誤判定するため引き継ぐ
      TMPDIR: process.env.TMPDIR,
      PATH: opts.path ?? BASE_PATH,
      // Claude Code セッション検出による early-skip を無効化（明示テスト以外）
      CLAUDECODE: "",
      ...opts.env,
    },
  });
  return { ...result, output: `${result.stdout}\n${result.stderr}` };
}

beforeAll(() => {
  passStubDir = makeStubDir("PASS");
  failStubDir = makeStubDir("FAIL");
  fixtureRepo = makeFixtureRepo();
  cleanRepo = makeCleanRepo();
});

afterAll(() => {
  for (const dir of [passStubDir, failStubDir, fixtureRepo, cleanRepo]) {
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe.each(SCRIPTS)("$script の環境変数ガード", ({ script, envPrefix }) => {
  it(`SKIP_${envPrefix}_REVIEW=1 で exit 0（スキップ）`, () => {
    const r = runReview(script, [], { env: { [`SKIP_${envPrefix}_REVIEW`]: "1" } });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/Skipping/i);
  });

  it("SKIP と REQUIRE の同時指定は exit 2（設定エラー）", () => {
    const r = runReview(script, [], {
      env: {
        [`SKIP_${envPrefix}_REVIEW`]: "1",
        [`REQUIRE_${envPrefix}_REVIEW`]: "1",
      },
    });
    expect(r.status).toBe(2);
    expect(r.output).toMatch(/cannot both be set/i);
  });

  it("CLI 不在時は soft skip（exit 0）", () => {
    const r = runReview(script, []);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/not found, skipping/i);
  });

  it(`CLI 不在 + REQUIRE_${envPrefix}_REVIEW=1 は exit 2`, () => {
    const r = runReview(script, [], { env: { [`REQUIRE_${envPrefix}_REVIEW`]: "1" } });
    expect(r.status).toBe(2);
    expect(r.output).toMatch(/not found/i);
  });
});

describe("claude-review.sh の Claude Code セッション検出", () => {
  it("CLAUDECODE 設定時は CLI review を skip（exit 0）", () => {
    const r = runReview("claude-review.sh", [], { env: { CLAUDECODE: "1" } });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/Claude Code session detected/i);
  });
});

describe.each(SCRIPTS)("$script のレビュー実行（スタブ CLI）", ({ script, cli }) => {
  it("Verdict: PASS ×5 で Overall APPROVED（exit 0）", () => {
    const r = runReview(script, ["--branch"], {
      cwd: fixtureRepo,
      path: `${passStubDir}:${BASE_PATH}`,
      env: { REVIEW_BASE_BRANCH: "develop" },
    });
    expect(r.status).toBe(0);
    expect(r.output).toContain("Overall: APPROVED");
  });

  it("Verdict: FAIL で Overall REJECTED（exit 1）", () => {
    const r = runReview(script, ["--branch"], {
      cwd: fixtureRepo,
      path: `${failStubDir}:${BASE_PATH}`,
      env: { REVIEW_BASE_BRANCH: "develop" },
    });
    expect(r.status).toBe(1);
    expect(r.output).toContain("Overall: REJECTED");
  });

  it(`変更なし（差分ゼロの専用リポジトリ）では ${cli} を呼ばず exit 0`, () => {
    const r = runReview(script, ["--branch"], {
      cwd: cleanRepo,
      path: `${passStubDir}:${BASE_PATH}`,
      env: { REVIEW_BASE_BRANCH: "develop" },
    });
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/No changes found/i);
  });
});

// review-common.sh のフェイルセーフ分岐は全スクリプト共通なので代表1本（claude）で検証する
describe("review-common.sh のフェイルセーフ（代表: claude-review.sh）", () => {
  function makeBrokenStubDir(body: string): string {
    const dir = mkdtempSync(join(tmpdir(), "review-stub-broken-"));
    writeFileSync(join(dir, "claude"), `#!/bin/sh\n${body}\n`);
    chmodSync(join(dir, "claude"), 0o755);
    const timeoutStub = join(dir, "timeout");
    writeFileSync(timeoutStub, `#!/bin/sh\nshift\nexec "$@"\n`);
    chmodSync(timeoutStub, 0o755);
    return dir;
  }

  it("Verdict 行のない出力は ERROR 扱いで REJECTED（exit 1）— 誤 APPROVED を出さない", () => {
    const dir = makeBrokenStubDir('cat >/dev/null\necho "I could not review this."');
    try {
      const r = runReview("claude-review.sh", ["--branch"], {
        cwd: fixtureRepo,
        path: `${dir}:${BASE_PATH}`,
        env: { REVIEW_BASE_BRANCH: "develop" },
      });
      expect(r.status).toBe(1);
      expect(r.output).toContain("Overall: REJECTED");
      expect(r.output).toMatch(/ERROR/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("CLI が非ゼロ終了したら ERROR 扱いで REJECTED（exit 1）", () => {
    const dir = makeBrokenStubDir("cat >/dev/null\nexit 3");
    try {
      const r = runReview("claude-review.sh", ["--branch"], {
        cwd: fixtureRepo,
        path: `${dir}:${BASE_PATH}`,
        env: { REVIEW_BASE_BRANCH: "develop" },
      });
      expect(r.status).toBe(1);
      expect(r.output).toContain("Overall: REJECTED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("timeout（exit 124）は TIMEOUT 扱いで REJECTED（exit 1）", () => {
    const dir = makeBrokenStubDir("cat >/dev/null\nexit 124");
    try {
      const r = runReview("claude-review.sh", ["--branch"], {
        cwd: fixtureRepo,
        path: `${dir}:${BASE_PATH}`,
        env: { REVIEW_BASE_BRANCH: "develop" },
      });
      expect(r.status).toBe(1);
      expect(r.output).toContain("TIMEOUT");
      expect(r.output).toContain("Overall: REJECTED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("--staged: ステージ済み変更をレビューして APPROVED（pre-commit の本番経路）", () => {
    const dir = mkdtempSync(join(tmpdir(), "review-staged-"));
    try {
      const git = initGitRepo(dir);
      writeFileSync(join(dir, "staged.ts"), "export const staged = true;\n");
      git("add", "staged.ts");
      const r = runReview("claude-review.sh", ["--staged"], {
        cwd: dir,
        path: `${passStubDir}:${BASE_PATH}`,
      });
      expect(r.status).toBe(0);
      expect(r.output).toContain("Overall: APPROVED");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("引数なし（auto）: ステージなしならブランチ diff に fallback して APPROVED", () => {
    const r = runReview("claude-review.sh", [], {
      cwd: fixtureRepo,
      path: `${passStubDir}:${BASE_PATH}`,
      env: { REVIEW_BASE_BRANCH: "develop" },
    });
    expect(r.status).toBe(0);
    expect(r.output).toContain("Overall: APPROVED");
  });

  it("lockfile のみの変更はレビュー対象外としてスキップ（exit 0）", () => {
    const dir = mkdtempSync(join(tmpdir(), "review-lockfile-"));
    try {
      const git = initGitRepo(dir);
      git("checkout", "-b", "feature/lockfile");
      writeFileSync(join(dir, "package-lock.json"), "{}\n");
      git("add", ".");
      git("commit", "-m", "chore: lockfile update");
      const r = runReview("claude-review.sh", ["--branch"], {
        cwd: dir,
        path: `${passStubDir}:${BASE_PATH}`,
        env: { REVIEW_BASE_BRANCH: "develop" },
      });
      expect(r.status).toBe(0);
      expect(r.output).toMatch(/Only auto-generated files/i);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe(".husky/pre-push の品質ゲート分岐（スタブ npm）", () => {
  function runPrePush(npmExitCode: number | null, env: Record<string, string> = {}) {
    const dir = mkdtempSync(join(tmpdir(), "prepush-stub-"));
    try {
      if (npmExitCode !== null) {
        const npmStub = join(dir, "npm");
        writeFileSync(npmStub, `#!/bin/sh\necho "stub npm $*"\nexit ${npmExitCode}\n`);
        chmodSync(npmStub, 0o755);
      }
      const r = spawnSync("sh", [join(REPO_ROOT, ".husky", "pre-push")], {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 30_000,
        env: { PATH: `${dir}:${BASE_PATH}`, ...env },
      });
      return { ...r, output: `${r.stdout}\n${r.stderr}` };
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }

  it("SKIP_QUALITY_GATE=1 は警告を表示して exit 0（quality:local を実行しない）", () => {
    const r = runPrePush(null, { SKIP_QUALITY_GATE: "1" });
    expect(r.status).toBe(0);
    expect(r.output).toContain("スキップ");
  });

  it("quality:local 成功で exit 0（push 続行）", () => {
    const r = runPrePush(0);
    expect(r.status).toBe(0);
  });

  it("quality:local 失敗で exit 1（push ブロック）", () => {
    const r = runPrePush(1);
    expect(r.status).toBe(1);
    expect(r.output).toContain("品質ゲート失敗");
  });
});
