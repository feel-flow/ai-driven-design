/**
 * ACE 知見の再利用計測レポート（Issue #453）。
 * - git log（`knowledge:` キュレーションコミットを除く）から各 ACE エントリへの参照を集計
 * - PLAYBOOK.md 内のエントリ間相互参照（Related / 本文リンク）を集計
 * - エントリごとに参照回数 / 最終参照日 / Helpful カウンターとの乖離を Markdown 表で出力
 * - 長期間参照のないエントリを「Archive 候補」として列挙（Issue #455 の入力データ）
 *
 * 読み取り専用 — PLAYBOOK もリポジトリ履歴も変更しない。gh API 非依存（オフライン動作）。
 * git log は PLAYBOOK が属するリポジトリ（`git -C <playbookのディレクトリ>`）に対して実行し、
 * カレントディレクトリや hook 由来の GIT_DIR に影響されない。
 * 実行例: npx --yes tsx docs-template/scripts/ace/ace-reuse-report.ts docs-template/08-knowledge/PLAYBOOK.md
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { execFileSync } from "node:child_process";
import { parsePositiveIntEnv } from "./check-category-size";

const EXIT_OK = 0;
const EXIT_RUNTIME_ERROR = 1;
const EXIT_USAGE_ERROR = 2;

const WARN_PREFIX = "ace-reuse-report";

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

const STATUS_ACTIVE = "active";

export type PlaybookEntry = Readonly<{
  readonly id: string;
  readonly title: string;
  /** YYYY-MM-DD。テーブル欠落・不正時は null */
  readonly date: string | null;
  readonly helpful: number;
  /** PLAYBOOK の Status 語彙は open（active / deprecated / 試行中 等）。欠落時は "unknown" */
  readonly status: string;
}>;

export type GitCommitRecord = Readonly<{
  readonly date: string; // YYYY-MM-DD
  readonly subject: string;
  readonly body: string;
}>;

export type GitLogParseResult = Readonly<{
  readonly commits: readonly GitCommitRecord[];
  /** date を持たない壊れたレコード数（呼び出し側が警告する） */
  readonly malformedCount: number;
}>;

export type ReuseStats = Readonly<{
  readonly gitRefCount: number;
  /** null = git 参照なし */
  readonly lastGitRefDate: string | null;
  readonly crossRefCount: number;
}>;

function stripHtmlBlockComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/gu, "");
}

function extractTableField(segment: string, field: string): string | null {
  const pattern = new RegExp(`^\\|\\s*${field}\\s*\\|\\s*([^|]+)\\|`, "im");
  const match = segment.match(pattern);
  return match ? match[1].trim() : null;
}

/**
 * PLAYBOOK.md からエントリ（ID / タイトル / Date / Helpful / Status）を抽出する。
 * HTML コメント内の追記例は除外する。フィールドが「存在するが不正」な場合は
 * onWarn（既定: console.warn）で表面化させたうえで安全なデフォルトに落とす。
 */
export function parsePlaybookEntries(
  content: string,
  onWarn: (message: string) => void = (m) => console.warn(m),
): PlaybookEntry[] {
  const cleaned = stripHtmlBlockComments(content);
  const entries: PlaybookEntry[] = [];
  const headers = [...cleaned.matchAll(ENTRY_HEADER_PATTERN)];

  headers.forEach((match, index) => {
    const id = match[1];
    const start = (match.index ?? 0) + match[0].length;
    const end =
      index + 1 < headers.length ? (headers[index + 1].index ?? cleaned.length) : cleaned.length;
    const segment = cleaned.slice(start, end);

    const helpfulRaw = extractTableField(segment, "Helpful");
    let helpful = 0;
    if (helpfulRaw === null) {
      onWarn(`${WARN_PREFIX}: ${id} の Helpful フィールドが見つかりません（0 として扱います）`);
    } else if (/^\d+$/u.test(helpfulRaw)) {
      helpful = Number.parseInt(helpfulRaw, 10);
    } else {
      onWarn(
        `${WARN_PREFIX}: ${id} の Helpful "${helpfulRaw}" は数値ではありません（0 として扱います）`,
      );
    }

    const status = extractTableField(segment, "Status");
    if (status === null) {
      onWarn(`${WARN_PREFIX}: ${id} の Status フィールドが見つかりません（unknown として扱います）`);
    }

    const dateRaw = extractTableField(segment, "Date");
    const date = dateRaw && /^\d{4}-\d{2}-\d{2}$/u.test(dateRaw) ? dateRaw : null;
    if (dateRaw !== null && date === null) {
      onWarn(`${WARN_PREFIX}: ${id} の Date "${dateRaw}" は YYYY-MM-DD ではありません（不明として扱います）`);
    }

    entries.push({
      id,
      title: match[2].trim(),
      date,
      helpful,
      status: status ?? "unknown",
    });
  });

  return entries;
}

/**
 * `git log` の RECORD/FIELD 区切り出力をパースする。
 * date を持たない壊れたレコードは commits に含めず malformedCount で報告する。
 */
export function parseGitLog(raw: string): GitLogParseResult {
  const commits: GitCommitRecord[] = [];
  let malformedCount = 0;

  for (const record of raw.split(RECORD_SEPARATOR)) {
    const trimmed = record.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const [date = "", subject = "", ...bodyParts] = trimmed.split(FIELD_SEPARATOR);
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(date.trim())) {
      malformedCount += 1;
      continue;
    }
    commits.push({
      date: date.trim(),
      subject: subject.trim(),
      body: bodyParts.join(FIELD_SEPARATOR),
    });
  }

  return { commits, malformedCount };
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
      lastGitRefDate: lastGitRefDate.get(entry.id) ?? null,
      crossRefCount: crossRefCount.get(entry.id) ?? 0,
    });
  }
  return stats;
}

function daysBetween(fromIso: string | null, to: Date): number | null {
  if (fromIso === null) {
    return null;
  }
  const from = new Date(`${fromIso}T00:00:00Z`);
  if (Number.isNaN(from.getTime())) {
    return null;
  }
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

/**
 * Archive 候補 = Status が active、作成から staleDays 以上経過、
 * かつ git 参照が一度もない or 最終 git 参照が staleDays 以上前。
 * 判定不能なデータ（日付欠損・stats 欠落）は**候補にしない**（安全側 = 誤アーカイブ推奨を避ける）。
 * （判定は「候補の列挙」のみ。実際のアーカイブは Issue #455 で別途設計）
 */
export function findArchiveCandidates(
  entries: readonly PlaybookEntry[],
  stats: ReadonlyMap<string, ReuseStats>,
  now: Date,
  staleDays: number,
): PlaybookEntry[] {
  return entries.filter((entry) => {
    if (entry.status !== STATUS_ACTIVE) {
      return false;
    }
    const ageDays = daysBetween(entry.date, now);
    if (ageDays === null || ageDays < staleDays) {
      return false;
    }
    const stat = stats.get(entry.id);
    if (!stat) {
      return false; // 判定材料なし → 安全側（候補にしない）
    }
    if (stat.gitRefCount === 0) {
      return true;
    }
    const sinceLastRef = daysBetween(stat.lastGitRefDate, now);
    if (sinceLastRef === null) {
      return false; // 参照実績はあるが日付が解釈不能 → 安全側（候補にしない）
    }
    return sinceLastRef >= staleDays;
  });
}

/** Markdown レポートを組み立てる。乖離 =（git参照 + 相互参照）− Helpful */
export function formatReport(
  entries: readonly PlaybookEntry[],
  stats: ReadonlyMap<string, ReuseStats>,
  candidates: readonly PlaybookEntry[],
  now: Date,
  staleDays: number,
): string {
  const totalRefs = (id: string): number => {
    const stat = stats.get(id);
    return (stat?.gitRefCount ?? 0) + (stat?.crossRefCount ?? 0);
  };
  const sorted = [...entries].sort((a, b) => totalRefs(b.id) - totalRefs(a.id));

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
    const crossRefs = stat?.crossRefCount ?? 0;
    const divergence = gitRefs + crossRefs - entry.helpful;
    lines.push(
      `| ${entry.id} | ${gitRefs} | ${stat?.lastGitRefDate ?? "—"} | ${crossRefs} | ${entry.helpful} | ${divergence >= 0 ? "+" : ""}${divergence} | ${entry.status} |`,
    );
  }
  lines.push("");
  lines.push(`## Archive 候補（${candidates.length} 件）`);
  lines.push("");
  if (candidates.length === 0) {
    lines.push("なし");
  } else {
    for (const entry of candidates) {
      lines.push(
        `- ${entry.id}: ${entry.title}（Date: ${entry.date ?? "不明"} / Helpful: ${entry.helpful}）`,
      );
    }
    lines.push("");
    lines.push(
      "> 候補は機械判定です。アーカイブの実施基準・手順は Issue #455 で設計します（本レポートは読み取り専用）。",
    );
  }
  lines.push("");
  return lines.join("\n");
}

/**
 * PLAYBOOK が属するリポジトリの git log を取得する。
 * - `git -C <repoDir>` で実行先を固定（カレントディレクトリ非依存）
 * - GIT_* 環境変数を除去（git hook 経由の実行で GIT_DIR を継承すると別リポジトリを集計する）
 */
function readGitLog(repoDir: string): GitLogParseResult {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && !key.startsWith("GIT_")) {
      env[key] = value;
    }
  }
  const raw = execFileSync(
    "git",
    [
      "-C",
      repoDir,
      "log",
      "--date=short",
      `--pretty=format:${RECORD_SEPARATOR}%ad${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%b`,
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env },
  );
  return parseGitLog(raw);
}

export type MainDeps = Readonly<{
  readonly readLog: (repoDir: string) => GitLogParseResult;
  readonly now: () => Date;
}>;

const DEFAULT_DEPS: MainDeps = {
  readLog: readGitLog,
  now: () => new Date(),
};

/**
 * CLI エントリポイント。
 * 引数: argv[0] = PLAYBOOK.md へのパス（必須）
 * 出力: stdout に Markdown レポート、警告は stderr
 * 終了コード: 0 = 成功 / 1 = 実行時エラー（git 失敗・読み込み失敗）/ 2 = 使用方法エラー
 * deps はテスト用の注入ポイント（既定は実 git log と現在時刻）。
 */
export function main(argv: readonly string[] = process.argv.slice(2), deps: MainDeps = DEFAULT_DEPS): number {
  const playbookPath = argv[0];
  if (!playbookPath) {
    console.error(
      "Usage: npx --yes tsx docs-template/scripts/ace/ace-reuse-report.ts <path/to/PLAYBOOK.md>",
    );
    return EXIT_USAGE_ERROR;
  }
  if (!fs.existsSync(playbookPath) || !fs.statSync(playbookPath).isFile()) {
    console.error(`ERROR: PLAYBOOK ファイルが見つかりません: ${playbookPath}`);
    return EXIT_USAGE_ERROR;
  }

  const staleDays = parsePositiveIntEnv(
    process.env.ACE_REUSE_STALE_DAYS,
    DEFAULT_STALE_DAYS,
    "ACE_REUSE_STALE_DAYS",
    WARN_PREFIX,
  );

  try {
    const content = fs.readFileSync(playbookPath, "utf8");
    const entries = parsePlaybookEntries(content);
    const logResult = deps.readLog(path.dirname(path.resolve(playbookPath)));
    if (logResult.malformedCount > 0) {
      console.warn(
        `${WARN_PREFIX}: git log に解釈できないレコードが ${logResult.malformedCount} 件ありました（集計から除外）`,
      );
    }
    const stats = computeReuseStats(entries, logResult.commits, content);
    const now = deps.now();
    const candidates = findArchiveCandidates(entries, stats, now, staleDays);
    console.log(formatReport(entries, stats, candidates, now, staleDays));
    return EXIT_OK;
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === "ENOENT") {
      console.error(`ERROR: git コマンドが見つかりません（git をインストールしてください）`);
    } else if (typeof err.message === "string" && /not a git repository/iu.test(err.message)) {
      console.error(
        `ERROR: PLAYBOOK が git リポジトリ内にありません（git log を取得できないため集計不能です）`,
      );
    } else {
      console.error(`ERROR: レポート生成に失敗しました: ${err.message ?? String(error)}`);
    }
    return EXIT_RUNTIME_ERROR;
  }
}

// 直接実行（tsx 経由の CLI）のときのみ自動実行する。テストから import した
// ときは副作用なく関数だけを取り込めるようにする。
if ((process.argv[1] ?? "").includes("ace-reuse-report") && !(process.argv[1] ?? "").includes(".test.")) {
  process.exitCode = main();
}
