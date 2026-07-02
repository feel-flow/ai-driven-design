import { afterEach, describe, expect, it, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  computeReuseStats,
  findArchiveCandidates,
  formatReport,
  main,
  parseGitLog,
  parsePlaybookEntries,
  type ReuseStats,
} from "./ace-reuse-report";

const RS = "\x1e";
const FS = "\x1f";

const PLAYBOOK_FIXTURE = `
# ACE Playbook

<!-- 追記例:
### ACE-001: コメント内の偽エントリ
-->

<a id="ace-005"></a>

### ACE-005: 異なる AI モデルは異なるカテゴリの問題を検出

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Date       | 2026-03-15 |
| Helpful    | 7          |
| Status     | active     |

本文。

<a id="ace-449-1"></a>

### ACE-449-1: set -e 関数末尾の &&-list

| フィールド | 値         |
| ---------- | ---------- |
| Category   | tooling    |
| Date       | 2026-07-02 |
| Helpful    | 0          |
| Status     | active     |

[ACE-005](#ace-005) を参照する本文。

<a id="ace-i425-1"></a>

### ACE-i425-1: Issue 由来のエントリ

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Date       | 2026-02-01 |
| Helpful    | 1          |
| Status     | active     |

本文。

<a id="ace-100"></a>

### ACE-100: 廃止済みエントリ

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Date       | 2026-01-01 |
| Helpful    | 2          |
| Status     | deprecated |

本文。
`;

function gitLogFixture(): string {
  // 新しい順（git log と同じ）
  return [
    `${RS}2026-07-01${FS}fix: ACE-005 の教訓を適用${FS}本文で ACE-005 に再度言及`,
    `${RS}2026-06-20${FS}knowledge: ACE-449-1 追加（キュレーション）${FS}ACE-449-1 と ACE-005 を含むが除外されるべき`,
    `${RS}2026-04-01${FS}feat: 通常コミット${FS}ACE-005 参照と ACE-i425-1 参照`,
    `${RS}2026-03-01${FS}docs: 無関係${FS}ACE-XXX プレースホルダは数えない`,
  ].join("\n");
}

function statsFor(content: string, log: string): Map<string, ReuseStats> {
  const entries = parsePlaybookEntries(content, () => {});
  return computeReuseStats(entries, parseGitLog(log).commits, content);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("parsePlaybookEntries", () => {
  it("実エントリのみ抽出し、HTMLコメント内の偽エントリを除外する（ACE-i 系 ID 含む）", () => {
    const entries = parsePlaybookEntries(PLAYBOOK_FIXTURE, () => {});
    expect(entries.map((e) => e.id)).toEqual(["ACE-005", "ACE-449-1", "ACE-i425-1", "ACE-100"]);
  });

  it("Date / Helpful / Status をテーブルから読み取る", () => {
    const entries = parsePlaybookEntries(PLAYBOOK_FIXTURE, () => {});
    const ace005 = entries.find((e) => e.id === "ACE-005");
    expect(ace005).toMatchObject({ date: "2026-03-15", helpful: 7, status: "active" });
  });

  it("Helpful が数値でない場合は警告して 0 に落とす（黙殺しない）", () => {
    const warnings: string[] = [];
    const broken = PLAYBOOK_FIXTURE.replace("| Helpful    | 7          |", "| Helpful    | 7 (要確認) |");
    const entries = parsePlaybookEntries(broken, (m) => warnings.push(m));
    expect(entries.find((e) => e.id === "ACE-005")?.helpful).toBe(0);
    expect(warnings.some((w) => w.includes("ACE-005") && w.includes("Helpful"))).toBe(true);
  });

  it("Status 欠落は警告して unknown に落とす", () => {
    const warnings: string[] = [];
    const broken = PLAYBOOK_FIXTURE.replace("| Status     | deprecated |", "");
    const entries = parsePlaybookEntries(broken, (m) => warnings.push(m));
    expect(entries.find((e) => e.id === "ACE-100")?.status).toBe("unknown");
    expect(warnings.some((w) => w.includes("ACE-100") && w.includes("Status"))).toBe(true);
  });
});

describe("parseGitLog", () => {
  it("レコード区切り・フィールド区切りで日時/件名/本文に分解する", () => {
    const result = parseGitLog(gitLogFixture());
    expect(result.commits).toHaveLength(4);
    expect(result.malformedCount).toBe(0);
    expect(result.commits[0]).toMatchObject({ date: "2026-07-01", subject: "fix: ACE-005 の教訓を適用" });
  });

  it("date を持たない壊れたレコードは除外して malformedCount で報告する", () => {
    const result = parseGitLog(`${RS}not-a-date${FS}subject${FS}body\n${gitLogFixture()}`);
    expect(result.commits).toHaveLength(4);
    expect(result.malformedCount).toBe(1);
  });
});

describe("computeReuseStats", () => {
  const stats = statsFor(PLAYBOOK_FIXTURE, gitLogFixture());

  it("knowledge: コミットを除外して git 参照を数える（コミット単位で1カウント）", () => {
    expect(stats.get("ACE-005")).toMatchObject({ gitRefCount: 2, lastGitRefDate: "2026-07-01" });
  });

  it("ACE-i 系 ID の参照も数える", () => {
    expect(stats.get("ACE-i425-1")).toMatchObject({ gitRefCount: 1, lastGitRefDate: "2026-04-01" });
  });

  it("キュレーションコミットしかないエントリの git 参照は 0（lastGitRefDate は null）", () => {
    expect(stats.get("ACE-449-1")).toMatchObject({ gitRefCount: 0, lastGitRefDate: null });
  });

  it("PLAYBOOK 内の相互参照を数える（自己参照は除外）", () => {
    expect(stats.get("ACE-005")?.crossRefCount).toBe(1);
    expect(stats.get("ACE-449-1")?.crossRefCount).toBe(0);
  });
});

describe("findArchiveCandidates", () => {
  const entries = parsePlaybookEntries(PLAYBOOK_FIXTURE, () => {});
  const stats = statsFor(PLAYBOOK_FIXTURE, gitLogFixture());
  const STALE_DAYS = 90;

  it("作成から閾値経過 + git 参照なしのアクティブエントリを候補にする", () => {
    // ACE-449-1: 2026-07-02 作成・git 参照 0 → 2026-10-01 時点（91日後）で候補
    const candidates = findArchiveCandidates(entries, stats, new Date("2026-10-01T00:00:00Z"), STALE_DAYS);
    expect(candidates.map((e) => e.id)).toContain("ACE-449-1");
  });

  it("境界値: 作成からちょうど staleDays 経過は候補になる（>= 判定）", () => {
    // ACE-449-1 は 2026-07-02 作成 → 2026-09-30 でちょうど 90 日
    const candidates = findArchiveCandidates(entries, stats, new Date("2026-09-30T00:00:00Z"), STALE_DAYS);
    expect(candidates.map((e) => e.id)).toContain("ACE-449-1");
  });

  it("境界値: 最終参照からちょうど staleDays 経過は候補になる（>= 判定）", () => {
    // ACE-005 の最終参照 2026-07-01 → 2026-09-29 でちょうど 90 日
    const candidates = findArchiveCandidates(entries, stats, new Date("2026-09-29T00:00:00Z"), STALE_DAYS);
    expect(candidates.map((e) => e.id)).toContain("ACE-005");
  });

  it("最終参照が閾値以内のエントリは候補にしない", () => {
    const recent = findArchiveCandidates(entries, stats, new Date("2026-08-01T00:00:00Z"), STALE_DAYS);
    expect(recent.map((e) => e.id)).not.toContain("ACE-005");
  });

  it("deprecated エントリは候補にしない", () => {
    const candidates = findArchiveCandidates(entries, stats, new Date("2026-10-01T00:00:00Z"), STALE_DAYS);
    expect(candidates.map((e) => e.id)).not.toContain("ACE-100");
  });

  it("作成から閾値未満の若いエントリは参照ゼロでも候補にしない", () => {
    const young = findArchiveCandidates(entries, stats, new Date("2026-07-10T00:00:00Z"), STALE_DAYS);
    expect(young.map((e) => e.id)).not.toContain("ACE-449-1");
  });

  it("参照実績があるのに日付が解釈不能なエントリは候補にしない（安全側）", () => {
    const brokenStats = new Map<string, ReuseStats>([
      ["ACE-005", { gitRefCount: 3, lastGitRefDate: "invalid-date", crossRefCount: 0 }],
    ]);
    const candidates = findArchiveCandidates(entries, brokenStats, new Date("2026-10-01T00:00:00Z"), STALE_DAYS);
    expect(candidates.map((e) => e.id)).not.toContain("ACE-005");
  });
});

describe("formatReport", () => {
  it("参照合計の降順で表を出力し、乖離 =（git参照 + 相互参照）− Helpful を含む", () => {
    const entries = parsePlaybookEntries(PLAYBOOK_FIXTURE, () => {});
    const stats = statsFor(PLAYBOOK_FIXTURE, gitLogFixture());
    const report = formatReport(entries, stats, [], new Date("2026-10-01T00:00:00Z"), 90);

    expect(report).toContain("# ACE 再利用計測レポート");
    const ace005Pos = report.indexOf("| ACE-005 |");
    const ace449Pos = report.indexOf("| ACE-449-1 |");
    expect(ace005Pos).toBeGreaterThan(-1);
    expect(ace449Pos).toBeGreaterThan(-1);
    expect(ace005Pos).toBeLessThan(ace449Pos);
    // ACE-005: git 2 + cross 1 - Helpful 7 = -4
    expect(report).toContain("| ACE-005 | 2 | 2026-07-01 | 1 | 7 | -4 | active |");
  });

  it("候補ゼロのときは「なし」と出力する", () => {
    const report = formatReport([], new Map<string, ReuseStats>(), [], new Date("2026-10-01T00:00:00Z"), 90);
    expect(report).toContain("## Archive 候補（0 件）");
    expect(report).toContain("なし");
  });
});

describe("main（CLI エントリポイント）", () => {
  it("引数なしは usage を出して exit 2", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(main([])).toBe(2);
    expect(errSpy.mock.calls.flat().join("\n")).toContain("Usage:");
  });

  it("存在しないファイルは exit 2", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(main(["/no/such/playbook.md"])).toBe(2);
    expect(errSpy.mock.calls.flat().join("\n")).toContain("見つかりません");
  });

  it("正常系: 注入した git log でレポートを stdout に出力して exit 0", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ace-reuse-main-"));
    const playbook = path.join(tmp, "PLAYBOOK.md");
    fs.writeFileSync(playbook, PLAYBOOK_FIXTURE);
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      const code = main([playbook], {
        readLog: () => parseGitLog(gitLogFixture()),
        now: () => new Date("2026-10-01T00:00:00Z"),
      });
      expect(code).toBe(0);
      const out = logSpy.mock.calls.flat().join("\n");
      expect(out).toContain("# ACE 再利用計測レポート");
      expect(out).toContain("| ACE-005 |");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("readLog が失敗したら整形エラーで exit 1（生 stack trace にしない）", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ace-reuse-err-"));
    const playbook = path.join(tmp, "PLAYBOOK.md");
    fs.writeFileSync(playbook, PLAYBOOK_FIXTURE);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const code = main([playbook], {
        readLog: () => {
          throw new Error("fatal: not a git repository (or any of the parent directories)");
        },
        now: () => new Date("2026-10-01T00:00:00Z"),
      });
      expect(code).toBe(1);
      expect(errSpy.mock.calls.flat().join("\n")).toContain("git リポジトリ内にありません");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
