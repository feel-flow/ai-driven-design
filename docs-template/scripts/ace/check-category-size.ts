/**
 * ACE Playbook の健全性チェック（Issue #367, #444）。
 * - Category ごとのエントリ件数を数え、閾値超過で終了コード 1 を返す（ゲート）。
 * - Playbook の総行数を報告し、閾値（ACE_MAX_PLAYBOOK_LINES、既定 800）超過時は
 *   警告のみ出力する（終了コードは変えない）。
 * 実行例: npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md
 */
import * as fs from "node:fs";
import * as path from "node:path";

const EXIT_OK = 0;
const EXIT_THRESHOLD_EXCEEDED = 1;
const EXIT_USAGE_ERROR = 2;

const DEFAULT_MAX_ENTRIES_PER_CATEGORY = 130;
const DEFAULT_MAX_PLAYBOOK_LINES = 800;
/**
 * PLAYBOOK の ID 規則。旧 3 桁形式（ACE-001）と新 PRスコープ式（ACE-438-1 / ACE-i425-1）の両方に対応する。
 * 実 ID は必ず数字始まり（旧 3 桁・PR 番号）か `i` ＋数字（Issue 由来）で始まるため、
 * テンプレートのプレースホルダ見出し（### ACE-XXX: 等）はマッチさせず集計から除外する。
 */
const ACE_ENTRY_HEADER_PATTERN = /^### ACE-(?:\d[\w-]*|i\d[\w-]*):/m;
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

/**
 * Playbook の総行数を数える。wc -l 準拠で改行文字（\n）の出現回数を返す。
 * 末尾に改行が無い最終行は数えない（wc -l と同じ挙動）。
 */
export function countPlaybookLines(content: string): number {
  const matches = content.match(/\n/gu);
  return matches ? matches.length : 0;
}

/**
 * 行数が閾値を超過しているか。境界（ちょうど）は超過扱いしない。
 */
export function isOverLineThreshold(lineCount: number, max: number): boolean {
  return lineCount > max;
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

/**
 * 正の整数を表す環境変数を厳密に解釈する。`"800abc"` や `"1e3"` のような
 * 曖昧な値・0 以下・空値は無効として既定値にフォールバックし、stderr に警告を出す。
 * rawValue を引数で受け取り、副作用なくユニットテストできるようにしている。
 */
export function parsePositiveIntEnv(
  rawValue: string | undefined,
  defaultValue: number,
  envName: string,
): number {
  if (rawValue === undefined || rawValue.trim() === "") {
    return defaultValue;
  }
  const trimmed = rawValue.trim();
  if (!/^[0-9]+$/u.test(trimmed) || Number.parseInt(trimmed, 10) < 1) {
    console.warn(
      `ace-check: ${envName}="${trimmed}" は無効のため、既定値 ${String(defaultValue)} を使います。`,
    );
    return defaultValue;
  }
  return Number.parseInt(trimmed, 10);
}

function parseMaxPerCategory(): number {
  return parsePositiveIntEnv(
    process.env.ACE_MAX_ENTRIES_PER_CATEGORY,
    DEFAULT_MAX_ENTRIES_PER_CATEGORY,
    "ACE_MAX_ENTRIES_PER_CATEGORY",
  );
}

function parseMaxPlaybookLines(): number {
  return parsePositiveIntEnv(
    process.env.ACE_MAX_PLAYBOOK_LINES,
    DEFAULT_MAX_PLAYBOOK_LINES,
    "ACE_MAX_PLAYBOOK_LINES",
  );
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

export function main(): number {
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

  const lineCount = countPlaybookLines(content);
  const maxLines = parseMaxPlaybookLines();

  console.log(`Playbook: ${playbookPath}`);
  console.log(`総エントリ数: ${String(analyzed.totalEntries)}`);
  console.log(`総行数: ${String(lineCount)} (閾値 ${String(maxLines)})`);
  if (isOverLineThreshold(lineCount, maxLines)) {
    console.error(
      `⚠ 行数が閾値を超過しています（${String(lineCount)} > ${String(maxLines)}）。分割・アーカイブを検討してください（別 Issue 起票を推奨）。`,
    );
  }
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

// 直接実行（tsx 経由の CLI）のときのみ自動実行する。テストから import した
// ときは副作用なく関数だけを取り込めるようにする。
if ((process.argv[1] ?? "").includes("check-category-size")) {
  process.exitCode = main();
}
