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

let passStubDir: string;
let failStubDir: string;
let fixtureRepo: string;

function makeStubDir(verdict: "PASS" | "FAIL"): string {
  const dir = mkdtempSync(join(tmpdir(), `review-stub-${verdict.toLowerCase()}-`));
  for (const { cli } of SCRIPTS) {
    const stub = join(dir, cli);
    // stdin（diff）を読み捨てて verdict 行のみ出力する偽 CLI
    writeFileSync(stub, `#!/bin/sh\ncat >/dev/null 2>&1 || true\necho "Verdict: ${verdict}"\n`);
    chmodSync(stub, 0o755);
  }
  // cursor-review.sh は timeout コマンド必須（ハング対策）なので、
  // 第1引数（秒数）を捨てて残りを実行するだけの偽 timeout も用意する
  const timeoutStub = join(dir, "timeout");
  writeFileSync(timeoutStub, `#!/bin/sh\nshift\nexec "$@"\n`);
  chmodSync(timeoutStub, 0o755);
  return dir;
}

/** develop ブランチ + 差分ありの feature ブランチを持つ使い捨て git リポジトリ */
function makeFixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "review-fixture-"));
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  };
  git("init", "-b", "develop");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "base.txt"), "base\n");
  git("add", ".");
  git("commit", "-m", "init");
  git("checkout", "-b", "feature/test");
  mkdirSync(join(dir, "src"), { recursive: true });
  writeFileSync(join(dir, "src", "change.ts"), "export const x = 1;\n");
  git("add", ".");
  git("commit", "-m", "feat: change");
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
});

afterAll(() => {
  for (const dir of [passStubDir, failStubDir, fixtureRepo]) {
    rmSync(dir, { recursive: true, force: true });
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

  it(`変更なし（develop 上）では ${cli} を呼ばず exit 0`, () => {
    const r = spawnSync("bash", ["-c", `cd "$1" && git checkout -q develop && bash "$2" --branch`, "--", fixtureRepo, join(REPO_ROOT, "scripts", script)], {
      encoding: "utf8",
      timeout: 60_000,
      env: {
        HOME: process.env.HOME,
        PATH: `${passStubDir}:${BASE_PATH}`,
        CLAUDECODE: "",
        REVIEW_BASE_BRANCH: "develop",
      },
    });
    expect(r.status).toBe(0);
    const output = `${r.stdout}\n${r.stderr}`;
    expect(output).toMatch(/No changes found/i);
    // 後続テストのため feature ブランチへ戻す
    spawnSync("git", ["checkout", "-q", "feature/test"], { cwd: fixtureRepo });
  });
});
