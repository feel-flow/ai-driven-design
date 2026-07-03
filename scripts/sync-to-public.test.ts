import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";

// sync-to-public.mjs（internal → public の一方向抽出同期、Issue #467）のテスト。
// 設計原則:
//   - fail-safe: visibility が public 以外（internal / 未指定 / frontmatter なし）は絶対に同期しない
//   - fail-loud: 不正な visibility 値を1つでも検出したら exit 1 で全体を中断し、一切書き込まない
//   - guard: target は origin が public リポジトリ (feel-flow/ai-spec-driven-development) の git repo のみ許可
//   - 非破壊: target の既存ファイルを削除しない

const REPO_ROOT = resolve(__dirname, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "sync-to-public.mjs");
const PUBLIC_URL = "https://github.com/feel-flow/ai-spec-driven-development.git";
const INTERNAL_URL = "https://github.com/feel-flow/ai-spec-driven-development-internal.git";

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

function git(cwd: string, ...args: string[]): void {
  const r = spawnSync("git", args, { cwd, encoding: "utf8", env: sanitizedGitEnv() });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr}`);
}

/** docs/ 配下にファイル群を持つ source ディレクトリを作る */
function makeSource(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "sync-src-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** origin リモート URL を持つ git repo（target 役）を作る */
function makeTarget(originUrl?: string, files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "sync-dst-"));
  git(dir, "init", "-b", "develop");
  if (originUrl) {
    git(dir, "remote", "add", "origin", originUrl);
  }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function runSync(
  source: string,
  target: string,
  ...extraArgs: string[]
): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(
    "node",
    [SCRIPT, "--source", source, "--target", target, ...extraArgs],
    { encoding: "utf8", env: sanitizedGitEnv() },
  );
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

const fm = (visibility?: string) =>
  `---\ntitle: t\nversion: 1.0.0\n${visibility ? `visibility: ${visibility}\n` : ""}---\n\n# body\n`;

describe("sync-to-public: 同期対象の選別（fail-safe）", () => {
  it("visibility: public のファイルが target へコピーされる（ネスト含む）", () => {
    const source = makeSource({
      "docs/GUIDE.md": fm("public"),
      "docs/specs/sample.md": fm("public"),
    });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(readFileSync(join(target, "docs/GUIDE.md"), "utf8")).toBe(fm("public"));
    expect(readFileSync(join(target, "docs/specs/sample.md"), "utf8")).toBe(fm("public"));
  });

  it("visibility: internal のファイルは同期されない", () => {
    const source = makeSource({ "docs/SECRET.md": fm("internal") });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/SECRET.md"))).toBe(false);
  });

  it("visibility 未指定（frontmatter はあるがキーなし）は同期されない", () => {
    const source = makeSource({ "docs/NO_KEY.md": fm(undefined) });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/NO_KEY.md"))).toBe(false);
  });

  it("frontmatter なしのファイルは同期されない", () => {
    const source = makeSource({ "docs/superpowers/plans/memo.md": "# raw memo\n" });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/superpowers/plans/memo.md"))).toBe(false);
  });

  it("docs/ 以外のファイルは visibility: public でも対象外", () => {
    const source = makeSource({
      "notes/OTHER.md": fm("public"),
      "docs/GUIDE.md": fm("public"),
    });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "notes/OTHER.md"))).toBe(false);
    expect(existsSync(join(target, "docs/GUIDE.md"))).toBe(true);
  });
});

describe("sync-to-public: 不正値・壊れた frontmatter は fail-loud", () => {
  it("不正な visibility 値があると exit 1 になり、valid なファイルも含めて一切書き込まれない", () => {
    const source = makeSource({
      "docs/OK.md": fm("public"),
      "docs/BROKEN.md": fm("pubilc"), // typo
    });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("docs/BROKEN.md");
    expect(r.stderr).toContain("pubilc");
    // 全体中断: valid 側も書き込まれていないこと
    expect(existsSync(join(target, "docs/OK.md"))).toBe(false);
  });

  it("閉じデリミタ欠落 + visibility: public は fail-loud で exit 1、一切書き込まれない", () => {
    // 壊れた frontmatter の本文走査で public 判定されると internal 文書が漏洩するため、
    // 「壊れている」こと自体をエラーにする（silent skip でも公開でもなく中断）
    const source = makeSource({
      "docs/OK.md": fm("public"),
      "docs/UNCLOSED.md": "---\ntitle: t\nvisibility: public\n\n# 本文（閉じデリミタなし）\n",
    });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("docs/UNCLOSED.md");
    expect(existsSync(join(target, "docs/UNCLOSED.md"))).toBe(false);
    expect(existsSync(join(target, "docs/OK.md"))).toBe(false);
  });

  it("visibility: の値が空でも fail-loud で exit 1", () => {
    const source = makeSource({ "docs/EMPTY.md": "---\ntitle: t\nvisibility:\n---\n\n# body\n" });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("docs/EMPTY.md");
  });

  it("--dry-run でも不正値検出は exit 1 になる（fail-loud が dry-run に優先）", () => {
    const source = makeSource({ "docs/BROKEN.md": fm("pubilc") });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target, "--dry-run");
    expect(r.status).toBe(1);
  });
});

describe("sync-to-public: frontmatter パースの堅牢性", () => {
  it("インラインコメント付きの値（public # コメント）は public として同期される", () => {
    // FRONTMATTER_GUIDE §5.5 が案内する記法。コメントを値に含めて fail-loud しないこと
    const content = "---\ntitle: t\nvisibility: public # public | internal\n---\n\n# body\n";
    const source = makeSource({ "docs/COMMENTED.md": content });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/COMMENTED.md"))).toBe(true);
  });

  it('引用符付きの値（"public"）は public として同期される', () => {
    const content = '---\ntitle: t\nvisibility: "public"\n---\n\n# body\n';
    const source = makeSource({ "docs/QUOTED.md": content });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/QUOTED.md"))).toBe(true);
  });

  it("CRLF 改行でも visibility を正しく判定できる（internal は skip / public は同期）", () => {
    const crlf = (s: string) => s.replace(/\n/g, "\r\n");
    const source = makeSource({
      "docs/CRLF_INTERNAL.md": crlf(fm("internal")),
      "docs/CRLF_PUBLIC.md": crlf(fm("public")),
    });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/CRLF_INTERNAL.md"))).toBe(false);
    expect(existsSync(join(target, "docs/CRLF_PUBLIC.md"))).toBe(true);
  });

  it("本文中に visibility: public の例文があっても frontmatter が internal なら同期されない", () => {
    // FRONTMATTER_GUIDE のように記法例を本文に含む文書での誤検出防止（走査は frontmatter 内のみ）
    const content = "---\ntitle: t\nvisibility: internal\n---\n\n例:\n\nvisibility: public\n";
    const source = makeSource({ "docs/HAS_EXAMPLE.md": content });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/HAS_EXAMPLE.md"))).toBe(false);
  });
});

describe("sync-to-public: 引数バリデーション", () => {
  it("--source の値が欠けているとスタックトレースではなく明示エラーで exit 1", () => {
    const target = makeTarget(PUBLIC_URL);
    const r = spawnSync("node", [SCRIPT, "--target", target, "--source"], {
      encoding: "utf8",
      env: sanitizedGitEnv(),
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("--source");
    expect(r.stderr).not.toContain("TypeError");
  });

  it("--source が存在しないディレクトリなら明示エラーで exit 1", () => {
    const target = makeTarget(PUBLIC_URL);
    const r = runSync("/nonexistent/sync-src", target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("source");
    expect(r.stderr).not.toContain("Error: ENOENT");
  });

  it("source と target が同一ディレクトリなら exit 1", () => {
    const dir = makeTarget(PUBLIC_URL, { "docs/GUIDE.md": fm("public") });
    const r = runSync(dir, dir);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("同一");
  });

  it("source に docs/ 配下の .md が 1 件もなければ exit 1", () => {
    const source = mkdtempSync(join(tmpdir(), "sync-empty-"));
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("docs");
  });
});

describe("sync-to-public: target ガード", () => {
  it("origin が internal リポジトリの target は拒否される（逆方向同期の防止）", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(INTERNAL_URL);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(existsSync(join(target, "docs/GUIDE.md"))).toBe(false);
  });

  it("origin が無関係な URL の target は拒否される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget("https://github.com/example/other-repo.git");
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("origin が public リポジトリではありません");
  });

  it("public リポジトリ URL を末尾に含むだけの無関係ホストは拒否される（先頭アンカー）", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(
      "https://evil.example/github.com/feel-flow/ai-spec-driven-development.git",
    );
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(existsSync(join(target, "docs/GUIDE.md"))).toBe(false);
  });

  it("SSH 形式の public origin（git@github.com:feel-flow/...）は受理される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget("git@github.com:feel-flow/ai-spec-driven-development.git");
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/GUIDE.md"))).toBe(true);
  });

  it("origin リモートを持たない target は拒否される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(undefined);
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("origin リモートがありません");
  });

  it("git repo ですらない target は拒否される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = mkdtempSync(join(tmpdir(), "sync-notgit-"));
    const r = runSync(source, target);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("git リポジトリではありません");
  });
});

describe("sync-to-public: 非破壊性と冪等性", () => {
  it("target の既存ファイルは削除されない（凍結ファイルは orphan として報告のみ）", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(PUBLIC_URL, {
      "docs/FROZEN.md": "# frozen: public では凍結された旧ドキュメント\n",
      "README.md": "# readme\n",
    });
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(existsSync(join(target, "docs/FROZEN.md"))).toBe(true);
    expect(existsSync(join(target, "README.md"))).toBe(true);
    expect(r.stdout).toContain("docs/FROZEN.md"); // orphan 報告
  });

  it("内容が同一のファイルは unchanged として報告される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(PUBLIC_URL, { "docs/GUIDE.md": fm("public") });
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(r.stdout).toMatch(/unchanged/i);
  });

  it("target に旧内容が存在する場合、新内容で上書き更新される", () => {
    const newContent = fm("public") + "\n更新後の本文\n";
    const source = makeSource({ "docs/GUIDE.md": newContent });
    const target = makeTarget(PUBLIC_URL, { "docs/GUIDE.md": fm("public") + "\n旧本文\n" });
    const r = runSync(source, target);
    expect(r.status).toBe(0);
    expect(readFileSync(join(target, "docs/GUIDE.md"), "utf8")).toBe(newContent);
  });
});

describe("sync-to-public: --dry-run", () => {
  it("--dry-run では書き込まれず、コピー予定が出力される", () => {
    const source = makeSource({ "docs/GUIDE.md": fm("public") });
    const target = makeTarget(PUBLIC_URL);
    const r = runSync(source, target, "--dry-run");
    expect(r.status).toBe(0);
    expect(r.stdout).toContain("docs/GUIDE.md");
    expect(existsSync(join(target, "docs/GUIDE.md"))).toBe(false);
  });
});
