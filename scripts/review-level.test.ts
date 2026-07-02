import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";

// review-level.sh（Risk-Based Workflow のレベル判定、Issue #454）の境界値テスト。
// フィクスチャ git は sanitizedGitEnv で GIT_* を遮断する（PR #459 の教訓:
// git hook 経由の実行時に GIT_DIR を継承すると実リポジトリを破壊する）。

const REPO_ROOT = resolve(__dirname, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "review-level.sh");

function sanitizedGitEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) {
      env[key] = value;
    }
  }
  env.GIT_CONFIG_GLOBAL = "/dev/null";
  env.GIT_CONFIG_SYSTEM = "/dev/null";
  return env;
}

/**
 * develop + feature ブランチを持つ使い捨てリポジトリ。
 * baseFiles は develop 側、files は feature 側にコミットする。
 * files の値: string | Buffer = 書き込み / null = 削除（rename は削除+追加で表現）
 */
function makeRepoWithChanges(
  files: Record<string, string | Buffer | null>,
  baseFiles: Record<string, string> = {},
): string {
  const dir = mkdtempSync(join(tmpdir(), "review-level-"));
  const git = (...args: string[]) => {
    const r = spawnSync("git", args, { cwd: dir, encoding: "utf8", env: sanitizedGitEnv() });
    if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
  };
  git("init", "-b", "develop");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "README.md"), "# base\n");
  for (const [path, content] of Object.entries(baseFiles)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  git("add", ".");
  git("commit", "-m", "init");
  git("checkout", "-b", "feature/x");
  for (const [path, content] of Object.entries(files)) {
    if (content === null) {
      git("rm", "-q", path);
    } else {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), content);
    }
  }
  git("add", ".");
  git("commit", "-m", "feat: changes");
  return dir;
}

function runLevel(cwd: string, args: string[] = [], env: Record<string, string> = {}) {
  const r = spawnSync("bash", [SCRIPT, "--base", "develop", ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30_000,
    env: { ...sanitizedGitEnv(), ...env },
  });
  return { ...r, output: `${r.stdout}\n${r.stderr}` };
}

const repos: string[] = [];

function fixture(
  files: Record<string, string | Buffer | null>,
  baseFiles: Record<string, string> = {},
): string {
  const dir = makeRepoWithChanges(files, baseFiles);
  repos.push(dir);
  return dir;
}

function lines(n: number): string {
  return Array.from({ length: n }, (_, i) => `line ${i}`).join("\n") + "\n";
}

afterAll(() => {
  for (const dir of repos) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("review-level.sh のレベル判定", () => {
  it("Level 1: ドキュメントのみ・小規模", () => {
    const dir = fixture({ "docs/note.md": lines(10) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 1");
  });

  it("Level 2: ドキュメントのみでも LIGHT_MAX 超過なら標準", () => {
    const dir = fixture({ "docs/big.md": lines(60) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("Level 2: 小規模でもコード変更を含むなら標準", () => {
    const dir = fixture({ "src/app.ts": lines(5) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("Level 3: STANDARD_MAX 超過", () => {
    const dir = fixture({ "src/huge.ts": lines(500) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
    expect(r.stdout).toMatch(/> 400 行/);
  });

  it("Level 3: 行数が少なくてもセンシティブパス（scripts/）なら重点", () => {
    const dir = fixture({ "scripts/deploy.sh": lines(3) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
    expect(r.stdout).toContain("センシティブパス");
  });

  it("Level 3: .husky/ の変更も重点", () => {
    const dir = fixture({ ".husky/pre-push": "#!/bin/sh\nexit 0\n" });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
  });

  it("Level 3: 実行系ディレクトリ外でも *.sh は重点（実行リスク）", () => {
    const dir = fixture({ "tools/helper.sh": "#!/bin/sh\nexit 0\n" });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
  });

  it("Level 3: ルート直下の設定ファイル（vitest.config.ts）は重点", () => {
    const dir = fixture({ "vitest.config.ts": "export default {};\n" });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
  });

  it("Level 2: 実行系ディレクトリ外・非ルートの YAML はセンシティブ扱いしない", () => {
    const dir = fixture({ "docs-template/sample/config.yaml": "key: value\n" });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("境界値: ドキュメントのみ LIGHT_MAX ちょうど（50行）は Level 1（≤ 判定）", () => {
    const dir = fixture({ "docs/exact.md": lines(50) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 1");
  });

  it("境界値: コード STANDARD_MAX ちょうど（400行）は Level 2（≤ 判定）", () => {
    const dir = fixture({ "src/exact.ts": lines(400) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("境界値: 401行は Level 3（> 判定）", () => {
    const dir = fixture({ "src/over.ts": lines(401) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
  });

  it("STANDARD_MAX も環境変数で上書きできる（100 で 200 行コードが Level 3 に）", () => {
    const dir = fixture({ "src/mid.ts": lines(200) });
    const r = runLevel(dir, [], { REVIEW_LEVEL_STANDARD_MAX_LINES: "100" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
  });

  it("バイナリファイル（numstat の \"-\"）は行数 0 として扱われクラッシュしない", () => {
    const dir = fixture({ "assets/img.png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x00, 0x01]) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("docs のリネームは rename 表記にならず docs として分類される（--no-renames）", () => {
    const dir = fixture(
      { "docs/old.md": null, "docs/new.md": lines(3) },
      { "docs/old.md": lines(3) },
    );
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 1");
    expect(r.stdout).toContain("docs: 2 / code: 0");
  });

  it("センシティブディレクトリを跨ぐ移動は Level 3 をすり抜けない（--no-renames）", () => {
    const dir = fixture(
      { "lib/util.ts": null, "mcp/src/util.ts": lines(3) },
      { "lib/util.ts": lines(3) },
    );
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 3");
    expect(r.stdout).toContain("センシティブパス");
  });

  it("lockfile のみの変更は規模から除外され差分なし扱い（Level 1）", () => {
    const dir = fixture({ "package-lock.json": lines(1000) });
    const r = runLevel(dir);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 1");
    expect(r.stdout).toContain("差分なし");
  });

  it("--quiet はレベル番号のみを出力する", () => {
    const dir = fixture({ "docs/tiny.md": lines(3) });
    const r = runLevel(dir, ["--quiet"]);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("1");
  });

  it("閾値は環境変数で上書きできる（LIGHT_MAX=5 で 10 行 docs が Level 2 に）", () => {
    const dir = fixture({ "docs/ten.md": lines(10) });
    const r = runLevel(dir, [], { REVIEW_LEVEL_LIGHT_MAX_LINES: "5" });
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("Review Level: 2");
  });

  it("不正な環境変数値は警告して既定値にフォールバックする", () => {
    const dir = fixture({ "docs/small.md": lines(10) });
    const r = runLevel(dir, [], { REVIEW_LEVEL_LIGHT_MAX_LINES: "50abc" });
    expect(r.status).toBe(0);
    expect(r.stderr).toContain("無効");
    expect(r.stdout).toContain("Review Level: 1");
  });

  it("存在しない base ブランチは exit 2 で明示エラー", () => {
    const dir = fixture({ "docs/x.md": lines(3) });
    const r = spawnSync("bash", [SCRIPT, "--base", "no-such-branch"], {
      cwd: dir,
      encoding: "utf8",
      timeout: 30_000,
      env: sanitizedGitEnv(),
    });
    expect(r.status).toBe(2);
    expect(`${r.stdout}\n${r.stderr}`).toContain("ERROR");
  });

  it("git リポジトリ外では exit 2", () => {
    const dir = mkdtempSync(join(tmpdir(), "review-level-nogit-"));
    repos.push(dir);
    const r = runLevel(dir);
    expect(r.status).toBe(2);
    expect(r.output).toContain("git リポジトリ内で実行");
  });
});
