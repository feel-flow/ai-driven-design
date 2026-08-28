import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, normalize, relative } from "node:path";

// 配布版 GitHub テンプレート (docs-template/.github/) の参照が、
// 「利用者側レイアウト」で解決することを検証する（Issue #483）。
//
// 利用者側レイアウト: リポジトリ直下に .github/ と docs/ が並ぶ。
//   docs-template/.github/**  →  <repo>/.github/**
//   docs-template/**（.github 以外） →  <repo>/docs/**
//
// 本リポジトリは docs-template/ を自身の docs としてもドッグフードするため、
// 「本リポでは解決するが利用者側では壊れる」参照が混入しやすい。
// 実際に ISSUE_TEMPLATE / PR テンプレ / agents / skills の約 30 箇所が
// 上流レイアウト前提になっていた（Issue #483-1）。
//
// 検出範囲の限界: 参照先が「配布ツリーに存在するか」までを見る。
// /init-docs が初期配置するのは 20 ファイルのみで、05-operations/deployment/ 配下などは
// 配置されない。そこへの参照はこのテストでは緑のまま通る（初期セット外への参照は
// リンクではなく所在の案内テキストにする、という規約側で担保する）。

const REPO_ROOT = resolve(__dirname, "..");
const TEMPLATE_ROOT = join(REPO_ROOT, "docs-template");
const DIST_GITHUB = join(TEMPLATE_ROOT, ".github");

/** 利用者側レイアウトのパス（.github/... または docs/...）を実ファイルへ写像する */
function toTemplatePath(deployedPath: string): string | null {
  const p = normalize(deployedPath);
  if (p.startsWith(".github/")) return join(TEMPLATE_ROOT, p);
  if (p.startsWith("docs/"))
    return join(TEMPLATE_ROOT, p.slice("docs/".length));
  return null;
}

function listMarkdown(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...listMarkdown(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

/** 配布ファイルの、利用者リポジトリ内での配置（例: .github/ISSUE_TEMPLATE/bug.md） */
function deployedLocation(absPath: string): string {
  return join(".github", relative(DIST_GITHUB, absPath));
}

const MD_FILES = listMarkdown(DIST_GITHUB);

// 相対リンク（http / アンカーで始まらない .md リンク）。ACE-046 の拡張 grep と同じ形。
const RELATIVE_LINK = /\]\(([^h)#][^)]*\.md)\)/g;
// inline code のパス表記。`docs/...` `.github/...` のみを対象にする
// （`src/services/auth.ts` のような架空の実装例は対象外）。
// 角括弧・山括弧を含むものはプレースホルダー（例: `docs/[フォルダ]/[ファイル名].md`）として除外する。
const INLINE_PATH = /`((?:docs|\.github)\/[^`\s\[\]<>]+\.md)`/g;
// frontmatter の references: "a, b" 形式（agents / skills が使う）
const FRONTMATTER_REFERENCES = /^\s*references:\s*"([^"]+)"\s*$/gm;

describe("配布版 GitHub テンプレートの参照解決", () => {
  it("検証対象の Markdown が存在する（glob 破綻で空振りしない）", () => {
    expect(MD_FILES.length).toBeGreaterThan(10);
  });

  it("相対リンクが利用者側レイアウトで解決する", () => {
    const broken: string[] = [];
    for (const file of MD_FILES) {
      const content = readFileSync(file, "utf8");
      const fromDir = dirname(deployedLocation(file));
      for (const match of content.matchAll(RELATIVE_LINK)) {
        const target = normalize(join(fromDir, match[1]));
        const templatePath = toTemplatePath(target);
        if (templatePath === null || !existsSync(templatePath)) {
          broken.push(
            `${relative(REPO_ROOT, file)} → ${match[1]} (展開先: ${target})`,
          );
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("inline code のパス表記が利用者側レイアウトで解決する", () => {
    const broken: string[] = [];
    for (const file of MD_FILES) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(INLINE_PATH)) {
        const templatePath = toTemplatePath(match[1]);
        if (templatePath === null || !existsSync(templatePath)) {
          broken.push(`${relative(REPO_ROOT, file)} → ${match[1]}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("frontmatter の references が配布ツリー内に存在する", () => {
    const broken: string[] = [];
    for (const file of MD_FILES) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(FRONTMATTER_REFERENCES)) {
        for (const ref of match[1].split(",").map((r: string) => r.trim())) {
          if (ref === "") continue;
          const templatePath = toTemplatePath(ref);
          if (templatePath === null || !existsSync(templatePath)) {
            broken.push(`${relative(REPO_ROOT, file)} → ${ref}`);
          }
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it("上流レイアウト固有のパス（docs-template/）を含まない", () => {
    const leaked: string[] = [];
    for (const file of MD_FILES) {
      if (readFileSync(file, "utf8").includes("docs-template/")) {
        leaked.push(relative(REPO_ROOT, file));
      }
    }
    expect(leaked).toEqual([]);
  });

  // ACE-046: Issue / PR テンプレートは body として展開され、相対リンクが
  // issues/N/ ・ pull/N/ 起点で解決されて 404 になる。採用先リポジトリの URL は
  // 不明で絶対 URL にもできないため、配布版ではリンクにせず inline code で書く。
  it("Issue / PR テンプレートに相対リンクを持たない（ACE-046）", () => {
    const templates = MD_FILES.filter(
      (f) =>
        f.startsWith(join(DIST_GITHUB, "ISSUE_TEMPLATE")) ||
        f === join(DIST_GITHUB, "pull_request_template.md"),
    );
    expect(templates.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of templates) {
      for (const match of readFileSync(file, "utf8").matchAll(RELATIVE_LINK)) {
        offenders.push(`${relative(REPO_ROOT, file)} → ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
