/**
 * ACE Playbook の Category ごとのエントリ件数を数え、閾値超過で終了コード 1 を返すテンプレート（Issue #367）。
 * 実行例: npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md
 */
import * as fs from "node:fs";
import * as path from "node:path";

const EXIT_OK = 0;
const EXIT_THRESHOLD_EXCEEDED = 1;
const EXIT_USAGE_ERROR = 2;

const DEFAULT_MAX_ENTRIES_PER_CATEGORY = 130;
/** PLAYBOOK の ID 規則（ACE-001 形式）。3 桁以上の連番にも対応する。 */
const ACE_ENTRY_HEADER_PATTERN = /^### ACE-\d{3,}:/m;
const CATEGORY_TABLE_LINE_PATTERN = /^\|\s*Category\s*\|\s*([^|]+)\|/im;

export type CategoryHistogram = Readonly<Record<string, number>>;

export type AnalyzeSuccess = Readonly<{
  readonly kind: "ok";
  readonly histogram: CategoryHistogram;
  readonly totalEntries: number;
}>;

export type AnalyzeFailure = Readonly<{
  readonly kind: "error";
  readonly message: string;
}>;

export type AnalyzeResult = AnalyzeSuccess | AnalyzeFailure;

function trimCategoryValue(raw: string): string {
  return raw.replace(/\s+/gu, " ").trim();
}

function incrementHistogram(
  histogram: Record<string, number>,
  categoryKey: string,
): void {
  const next = (histogram[categoryKey] ?? 0) + 1;
  histogram[categoryKey] = next;
}

function stripHtmlBlockComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/gu, "");
}

/**
 * PLAYBOOK.md 本文から ACE エントリブロックを走査し、Category 行を集計する。
 * HTML コメント内の追記例（### ACE-001 など）を除外するため、先にコメントを除去する。
 */
export function analyzePlaybookMarkdown(content: string): AnalyzeResult {
  const cleaned = stripHtmlBlockComments(content);
  const segments = cleaned.split(ACE_ENTRY_HEADER_PATTERN).slice(1);
  if (segments.length === 0) {
    return {
      kind: "error",
      message: "ACE エントリ見出し（### ACE-数字:）が見つかりません。",
    };
  }
  const histogram: Record<string, number> = {};

  for (const segment of segments) {
    const match = segment.match(CATEGORY_TABLE_LINE_PATTERN);
    if (!match?.[1]) {
      return {
        kind: "error",
        message: "Category 行を解析できない ACE ブロックがあります。",
      };
    }
    const categoryKey = trimCategoryValue(match[1]);
    incrementHistogram(histogram, categoryKey);
  }

  return {
    kind: "ok",
    histogram,
    totalEntries: segments.length,
  };
}

function parseMaxPerCategory(): number {
  const raw = process.env.ACE_MAX_ENTRIES_PER_CATEGORY;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_MAX_ENTRIES_PER_CATEGORY;
  }
  const trimmed = raw.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.warn(
      `ace-check: ACE_MAX_ENTRIES_PER_CATEGORY="${trimmed}" は無効のため、既定値 ${String(DEFAULT_MAX_ENTRIES_PER_CATEGORY)} を使います。`,
    );
    return DEFAULT_MAX_ENTRIES_PER_CATEGORY;
  }
  return parsed;
}

function resolvePlaybookPath(argv: readonly string[]): string | undefined {
  const fromArg = argv[2];
  if (fromArg && fromArg.trim() !== "") {
    return path.resolve(fromArg);
  }
  const fromEnv = process.env.ACE_PLAYBOOK_PATH;
  if (fromEnv && fromEnv.trim() !== "") {
    return path.resolve(fromEnv);
  }
  return undefined;
}

function formatHistogram(histogram: CategoryHistogram): string {
  return Object.entries(histogram)
    .map(([key, count]) => `${key}: ${String(count)}`)
    .join("\n");
}

function main(): number {
  const playbookPath = resolvePlaybookPath(process.argv);
  if (!playbookPath) {
    console.error(
      "引数に PLAYBOOK.md のパスを渡すか、ACE_PLAYBOOK_PATH を設定してください。",
    );
    return EXIT_USAGE_ERROR;
  }

  let content: string;
  try {
    content = fs.readFileSync(playbookPath, "utf8");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`読み込み失敗: ${message}`);
    return EXIT_USAGE_ERROR;
  }

  const analyzed = analyzePlaybookMarkdown(content);
  if (analyzed.kind === "error") {
    console.error(analyzed.message);
    return EXIT_USAGE_ERROR;
  }

  const maxAllowed = parseMaxPerCategory();
  const overCategories: string[] = [];

  for (const [categoryKey, count] of Object.entries(analyzed.histogram)) {
    if (count > maxAllowed) {
      overCategories.push(`${categoryKey} (${String(count)} > ${String(maxAllowed)})`);
    }
  }

  console.log(`Playbook: ${playbookPath}`);
  console.log(`総エントリ数: ${String(analyzed.totalEntries)}`);
  console.log("カテゴリ別件数:\n" + formatHistogram(analyzed.histogram));

  if (overCategories.length > 0) {
    console.error(
      "閾値超過カテゴリがあります。別 Issue で分割方針を起票してください:\n- " +
        overCategories.join("\n- "),
    );
    return EXIT_THRESHOLD_EXCEEDED;
  }

  return EXIT_OK;
}

process.exitCode = main();
