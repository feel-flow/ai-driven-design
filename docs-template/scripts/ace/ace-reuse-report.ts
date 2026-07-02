/**
 * ACE 知見の再利用計測レポート（Issue #453）。
 * - git log（`knowledge:` キュレーションコミットを除く）から各 ACE エントリへの参照を集計
 * - PLAYBOOK.md 内のエントリ間相互参照（Related / 本文リンク）を集計
 * - エントリごとに参照回数 / 最終参照日 / Helpful カウンターとの乖離を Markdown 表で出力
 * - 長期間参照のないエントリを「Archive 候補」として列挙（Issue #455 の入力データ）
 *
 * 読み取り専用 — PLAYBOOK もリポジトリ履歴も変更しない。gh API 非依存（オフライン動作）。
 * 実行例: npx --yes tsx docs-template/scripts/ace/ace-reuse-report.ts docs-template/08-knowledge/PLAYBOOK.md
 */
import * as fs from "node:fs";
import { execFileSync } from "node:child_process";
import { parsePositiveIntEnv } from "./check-category-size";

const EXIT_OK = 0;
const EXIT_USAGE_ERROR = 2;

/** これより長く git 参照がないエントリを Archive 候補とする（日数、ACE_REUSE_STALE_DAYS で上書き可） */
const DEFAULT_STALE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** git log のレコード / フィールド区切り（コミット本文に現れない制御文字） */
const RECORD_SEPARATOR = "\x1e";
const FIELD_SEPARATOR = "\x1f";

/**
 * 実 ID のみマッチ（旧 3 桁 ACE-001 / PRスコープ ACE-438-1 / Issue 由来 ACE-i425-1）。
 * テンプレートのプレースホルダ（ACE-XXX 等）は数字始まりでないため除外される。
 */
const ACE_ID_REFERENCE_PATTERN = /\bACE-(?:\d+(?:-\d+)?|i\d+(?:-\d+)?)\b/gu;

const ENTRY_HEADER_PATTERN = /^### (ACE-(?:\d+(?:-\d+)?|i\d+(?:-\d+)?)): (.+)$/gmu;

/** キュレーションコミット（エントリ追加・カウンター更新）は「再利用」に数えない */
const CURATION_COMMIT_PREFIX = "knowledge:";

export type PlaybookEntry = Readonly<{
  readonly id: string;
  readonly title: string;
  readonly date: string; // YYYY-MM-DD（不明時は ""）
  readonly helpful: number;
  readonly status: string;
}>;

export type GitCommitRecord = Readonly<{
  readonly date: string; // YYYY-MM-DD
  readonly subject: string;
  readonly body: string;
}>;

export type ReuseStats = Readonly<{
  readonly gitRefCount: number;
  readonly lastGitRefDate: string; // "" = 参照なし
  readonly crossRefCount: number;
}>;

function stripHtmlBlockComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/gu, "");
}

function extractTableField(segment: string, field: string): string {
  const pattern = new RegExp(`^\\|\\s*${field}\\s*\\|\\s*([^|]+)\\|`, "im");
  const match = segment.match(pattern);
  return match ? match[1].trim() : "";
}

/**
 * PLAYBOOK.md からエントリ（ID / タイトル / Date / Helpful / Status）を抽出する。
 * HTML コメント内の追記例は除外する。
 */
export function parsePlaybookEntries(content: string): PlaybookEntry[] {
  const cleaned = stripHtmlBlockComments(content);
  const entries: PlaybookEntry[] = [];
  const headers = [...cleaned.matchAll(ENTRY_HEADER_PATTERN)];

  headers.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < headers.length ? (headers[index + 1].index ?? cleaned.length) : cleaned.length;
    const segment = cleaned.slice(start, end);

    const helpfulRaw = extractTableField(segment, "Helpful");
    const helpful = /^\d+$/u.test(helpfulRaw) ? Number.parseInt(helpfulRaw, 10) : 0;

    entries.push({
      id: match[1],
      title: match[2].trim(),
      date: extractTableField(segment, "Date"),
      helpful,
      status: extractTableField(segment, "Status") || "unknown",
    });
  });

  return entries;
}

/** `git log` の RECORD/FIELD 区切り出力をパースする */
export function parseGitLog(raw: string): GitCommitRecord[] {
  return raw
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const [date = "", subject = "", ...bodyParts] = record.split(FIELD_SEPARATOR);
      return { date: date.trim(), subject: subject.trim(), body: bodyParts.join(FIELD_SEPARATOR) };
    });
}

/**
 * エントリごとの再利用実績を集計する。
 * - git 参照: `knowledge:` コミットを除くコミットの件名 + 本文中の ACE ID 出現（コミット単位で 1 カウント）
 * - 相互参照: PLAYBOOK 内で「他の」エントリのセグメントに現れる ACE ID 出現
 */
export function computeReuseStats(
  entries: readonly PlaybookEntry[],
  commits: readonly GitCommitRecord[],
  playbookContent: string,
): Map<string, ReuseStats> {
  const knownIds = new Set(entries.map((entry) => entry.id));
  const gitRefCount = new Map<string, number>();
  const lastGitRefDate = new Map<string, string>();

  for (const commit of commits) {
    if (commit.subject.startsWith(CURATION_COMMIT_PREFIX)) {
      continue;
    }
    const text = `${commit.subject}\n${commit.body}`;
    const idsInCommit = new Set(
      [...text.matchAll(ACE_ID_REFERENCE_PATTERN)].map((m) => m[0]).filter((id) => knownIds.has(id)),
    );
    for (const id of idsInCommit) {
      gitRefCount.set(id, (gitRefCount.get(id) ?? 0) + 1);
      // git log は新しい順なので、最初に見つかった日付が最終参照日
      if (!lastGitRefDate.has(id)) {
        lastGitRefDate.set(id, commit.date);
      }
    }
  }

  // 相互参照: 各エントリのセグメント内に現れる他エントリの ID
  const crossRefCount = new Map<string, number>();
  const cleaned = stripHtmlBlockComments(playbookContent);
  const headers = [...cleaned.matchAll(ENTRY_HEADER_PATTERN)];
  headers.forEach((match, index) => {
    const ownerId = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < headers.length ? (headers[index + 1].index ?? cleaned.length) : cleaned.length;
    const segment = cleaned.slice(start, end);
    const referenced = new Set(
      [...segment.matchAll(ACE_ID_REFERENCE_PATTERN)]
        .map((m) => m[0])
        .filter((id) => id !== ownerId && knownIds.has(id)),
    );
    for (const id of referenced) {
      crossRefCount.set(id, (crossRefCount.get(id) ?? 0) + 1);
    }
  });

  const stats = new Map<string, ReuseStats>();
  for (const entry of entries) {
    stats.set(entry.id, {
      gitRefCount: gitRefCount.get(entry.id) ?? 0,
      lastGitRefDate: lastGitRefDate.get(entry.id) ?? "",
      crossRefCount: crossRefCount.get(entry.id) ?? 0,
    });
  }
  return stats;
}

function daysBetween(fromIso: string, to: Date): number | null {
  const from = new Date(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) {
    return null;
  }
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Archive 候補 = Status が active、作成から staleDays 以上経過、
 * かつ git 参照が一度もない or 最終 git 参照が staleDays 以上前。
 * （判定は「候補の列挙」のみ。実際のアーカイブは Issue #455 で別途設計）
 */
export function findArchiveCandidates(
  entries: readonly PlaybookEntry[],
  stats: ReadonlyMap<string, ReuseStats>,
  now: Date,
  staleDays: number,
): PlaybookEntry[] {
  return entries.filter((entry) => {
    if (entry.status !== "active") {
      return false;
    }
    const ageDays = daysBetween(entry.date, now);
    if (ageDays === null || ageDays < staleDays) {
      return false;
    }
    const stat = stats.get(entry.id);
    if (!stat) {
      return true;
    }
    if (stat.gitRefCount === 0) {
      return true;
    }
    const sinceLastRef = daysBetween(stat.lastGitRefDate, now);
    return sinceLastRef === null || sinceLastRef >= staleDays;
  });
}

/** Markdown レポートを組み立てる */
export function formatReport(
  entries: readonly PlaybookEntry[],
  stats: ReadonlyMap<string, ReuseStats>,
  candidates: readonly PlaybookEntry[],
  now: Date,
  staleDays: number,
): string {
  const sorted = [...entries].sort((a, b) => {
    const sa = stats.get(a.id);
    const sb = stats.get(b.id);
    return (
      (sb?.gitRefCount ?? 0) + (sb?.crossRefCount ?? 0) - ((sa?.gitRefCount ?? 0) + (sa?.crossRefCount ?? 0))
    );
  });

  const lines: string[] = [];
  lines.push(`# ACE 再利用計測レポート`);
  lines.push("");
  lines.push(`- 実行日: ${now.toISOString().slice(0, 10)}`);
  lines.push(`- エントリ数: ${entries.length}`);
  lines.push(`- Archive 候補閾値: ${staleDays} 日（ACE_REUSE_STALE_DAYS で上書き可）`);
  lines.push("");
  lines.push("| ID | git参照 | 最終参照日 | 相互参照 | Helpful | 乖離 | Status |");
  lines.push("| --- | ---: | --- | ---: | ---: | ---: | --- |");
  for (const entry of sorted) {
    const stat = stats.get(entry.id);
    const gitRefs = stat?.gitRefCount ?? 0;
    const divergence = gitRefs - entry.helpful;
    lines.push(
      `| ${entry.id} | ${gitRefs} | ${stat?.lastGitRefDate || "—"} | ${stat?.crossRefCount ?? 0} | ${entry.helpful} | ${divergence >= 0 ? "+" : ""}${divergence} | ${entry.status} |`,
    );
  }
  lines.push("");
  lines.push(`## Archive 候補（${candidates.length} 件）`);
  lines.push("");
  if (candidates.length === 0) {
    lines.push("なし");
  } else {
    for (const entry of candidates) {
      lines.push(`- ${entry.id}: ${entry.title}（Date: ${entry.date || "不明"} / Helpful: ${entry.helpful}）`);
    }
    lines.push("");
    lines.push(
      "> 候補は機械判定です。アーカイブの実施基準・手順は Issue #455 で設計します（本レポートは読み取り専用）。",
    );
  }
  lines.push("");
  return lines.join("\n");
}

function readGitLog(): GitCommitRecord[] {
  const raw = execFileSync(
    "git",
    ["log", "--date=short", `--pretty=format:${RECORD_SEPARATOR}%ad${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%b`],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return parseGitLog(raw);
}

export function main(argv: readonly string[] = process.argv.slice(2)): number {
  const playbookPath = argv[0];
  if (!playbookPath) {
    console.error(
      "Usage: npx --yes tsx docs-template/scripts/ace/ace-reuse-report.ts <path/to/PLAYBOOK.md>",
    );
    return EXIT_USAGE_ERROR;
  }
  if (!fs.existsSync(playbookPath)) {
    console.error(`ERROR: PLAYBOOK が見つかりません: ${playbookPath}`);
    return EXIT_USAGE_ERROR;
  }

  const staleDays = parsePositiveIntEnv(
    process.env.ACE_REUSE_STALE_DAYS,
    DEFAULT_STALE_DAYS,
    "ACE_REUSE_STALE_DAYS",
  );

  const content = fs.readFileSync(playbookPath, "utf8");
  const entries = parsePlaybookEntries(content);
  const commits = readGitLog();
  const stats = computeReuseStats(entries, commits, content);
  const now = new Date();
  const candidates = findArchiveCandidates(entries, stats, now, staleDays);

  console.log(formatReport(entries, stats, candidates, now, staleDays));
  return EXIT_OK;
}

// 直接実行（tsx 経由の CLI）のときのみ自動実行する。テストから import した
// ときは副作用なく関数だけを取り込めるようにする。
if ((process.argv[1] ?? "").includes("ace-reuse-report")) {
  process.exitCode = main();
}
