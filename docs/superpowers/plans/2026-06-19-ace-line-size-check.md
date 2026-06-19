# ACE Playbook 行数サイズチェック 実装プラン

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ACE の Playbook (`PLAYBOOK.md`) の総行数を `check-category-size.ts` が報告し、閾値（既定 800 行）超過時に警告のみ（非ブロック）で分割を促す。

**Architecture:** 既存 `docs-template/scripts/ace/check-category-size.ts` を拡張し、責務を「カテゴリ件数ゲート（exit 1・既存）」＋「総行数チェック（警告のみ・新規）」の 2 軸にする。行数カウントと閾値判定は純関数として切り出し vitest で検証。ファイル名はリネームせず、doc コメント/README で責務拡張を明示。

**Tech Stack:** TypeScript (tsx 実行), vitest, Node 20+, markdownlint-cli2 + prettier（doc 整形）。

## Global Constraints

- 行数チェックは **警告のみ**。プロセスの exit code を変えない（exit 1 は既存のカテゴリ件数ゲート専用）。
- exit code: `0`＝両軸 OK or 行数のみ超過 / `1`＝カテゴリ件数超過 / `2`＝usage error。
- 行数閾値の既定値は **800**、環境変数 `ACE_MAX_PLAYBOOK_LINES` で上書き可。非数値・0 以下・非有限は既定値へフォールバックし stderr に警告。
- 行数の定義は `wc -l` 準拠（改行文字 `\n` の出現回数）。
- 既存のカテゴリ件数チェックの挙動・出力・exit 1 は不変。
- コミットは Issue 番号 `#444` を含め、末尾に `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` を付ける。
- `.md` 変更コミットは pre-commit hook（markdownlint）を通す。事前に `npx prettier --write <file>` でテーブル整形する。

---

### Task 1: `check-category-size.ts` に行数チェックを追加（純関数 + テスト）

**Files:**

- Modify: `docs-template/scripts/ace/check-category-size.ts`
- Test: `docs-template/scripts/ace/check-category-size.test.ts`

**Interfaces:**

- Consumes: 既存 `analyzePlaybookMarkdown(content: string): AnalyzeResult`（変更しない）。
- Produces:
  - `export function countPlaybookLines(content: string): number` — `content` 中の改行文字 `\n` の出現回数（`wc -l` 準拠。末尾に改行のない最終行は数えない）。
  - `export function isOverLineThreshold(lineCount: number, max: number): boolean` — `lineCount > max` を返す（境界は `>`、ちょうどは超過扱いしない）。
  - 非 export: `DEFAULT_MAX_PLAYBOOK_LINES = 800`、`parseMaxPlaybookLines(): number`。

- [ ] **Step 1: 行数カウントの失敗テストを書く**

`docs-template/scripts/ace/check-category-size.test.ts` の先頭 import を更新し、ファイル末尾に新しい `describe` を追記する。

import 行を以下に置換:

```typescript
import { describe, expect, it } from "vitest";
import {
  analyzePlaybookMarkdown,
  countPlaybookLines,
  isOverLineThreshold,
} from "./check-category-size";
```

ファイル末尾（最後の `});` の後）に追記:

```typescript
describe("countPlaybookLines", () => {
  it("末尾に改行がある場合は改行数を数える（wc -l 準拠）", () => {
    expect(countPlaybookLines("a\nb\nc\n")).toBe(3);
  });

  it("末尾に改行が無い最終行は数えない（wc -l 準拠）", () => {
    expect(countPlaybookLines("a\nb\nc")).toBe(2);
  });

  it("空文字は 0 行", () => {
    expect(countPlaybookLines("")).toBe(0);
  });

  it("改行のみは 1 行", () => {
    expect(countPlaybookLines("\n")).toBe(1);
  });
});

describe("isOverLineThreshold", () => {
  it("閾値ちょうどは超過しない（境界は > 判定）", () => {
    expect(isOverLineThreshold(800, 800)).toBe(false);
  });

  it("閾値+1 は超過する", () => {
    expect(isOverLineThreshold(801, 800)).toBe(true);
  });

  it("閾値未満は超過しない", () => {
    expect(isOverLineThreshold(10, 800)).toBe(false);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npm run test:ace-scripts`
Expected: FAIL — `countPlaybookLines` / `isOverLineThreshold` が `check-category-size` から export されていないため import エラー（または `is not a function`）。

- [ ] **Step 3: 純関数を実装**

`docs-template/scripts/ace/check-category-size.ts` の定数 `DEFAULT_MAX_ENTRIES_PER_CATEGORY` の直後に、行数チェック用の定数を追加:

```typescript
const DEFAULT_MAX_ENTRIES_PER_CATEGORY = 130;
const DEFAULT_MAX_PLAYBOOK_LINES = 800;
```

`incrementHistogram` 関数の直後（`stripHtmlBlockComments` の前あたり、純関数群と同じ並び）に追加:

```typescript
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
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npm run test:ace-scripts`
Expected: PASS — `countPlaybookLines` と `isOverLineThreshold` の全テストが green。既存テストも green のまま。

- [ ] **Step 5: 環境変数パーサと main() の統合を実装**

`parseMaxPerCategory` 関数の直後に `parseMaxPlaybookLines` を追加（既存パーサと同じ流儀）:

```typescript
function parseMaxPlaybookLines(): number {
  const raw = process.env.ACE_MAX_PLAYBOOK_LINES;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_MAX_PLAYBOOK_LINES;
  }
  const trimmed = raw.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    console.warn(
      `ace-check: ACE_MAX_PLAYBOOK_LINES="${trimmed}" は無効のため、既定値 ${String(DEFAULT_MAX_PLAYBOOK_LINES)} を使います。`,
    );
    return DEFAULT_MAX_PLAYBOOK_LINES;
  }
  return parsed;
}
```

`main()` 内、`console.log("カテゴリ別件数:\n" + formatHistogram(analyzed.histogram));` の **直前** に行数の報告と警告を挿入する。具体的には、現在の以下のブロック:

```typescript
console.log(`Playbook: ${playbookPath}`);
console.log(`総エントリ数: ${String(analyzed.totalEntries)}`);
console.log("カテゴリ別件数:\n" + formatHistogram(analyzed.histogram));
```

を次へ置換:

```typescript
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
```

> 注意: 行数警告は `console.error`（stderr）に出すのみで、`return` しない。exit code は既存の `overCategories.length > 0` 判定（exit 1）だけが決める。

- [ ] **Step 6: ファイル先頭の doc コメントを更新**

ファイル冒頭の doc コメントを次へ置換:

```typescript
/**
 * ACE Playbook の健全性チェック（Issue #367, #444）。
 * - Category ごとのエントリ件数を数え、閾値超過で終了コード 1 を返す（ゲート）。
 * - Playbook の総行数を報告し、閾値（ACE_MAX_PLAYBOOK_LINES、既定 800）超過時は
 *   警告のみ出力する（終了コードは変えない）。
 * 実行例: npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md
 */
```

- [ ] **Step 7: 実 PLAYBOOK で挙動を手動検証（行数超過 → exit 0）**

Run:

```bash
npx --yes tsx docs-template/scripts/ace/check-category-size.ts docs-template/08-knowledge/PLAYBOOK.md; echo "exit=$?"
```

Expected:

- stdout に `総行数: 1745 (閾値 800)`（実際の行数）が出る。
- stderr に `⚠ 行数が閾値を超過しています…` の警告が出る。
- `exit=0`（カテゴリ件数は閾値内のため。行数超過は exit に影響しない）。

- [ ] **Step 8: 環境変数の上書きとフォールバックを手動検証**

Run:

```bash
ACE_MAX_PLAYBOOK_LINES=5000 npx --yes tsx docs-template/scripts/ace/check-category-size.ts docs-template/08-knowledge/PLAYBOOK.md; echo "exit=$?"
ACE_MAX_PLAYBOOK_LINES=abc npx --yes tsx docs-template/scripts/ace/check-category-size.ts docs-template/08-knowledge/PLAYBOOK.md; echo "exit=$?"
```

Expected:

- 1 回目: 閾値 5000 で `総行数: 1745 (閾値 5000)`、警告は出ない、`exit=0`。
- 2 回目: `ace-check: ACE_MAX_PLAYBOOK_LINES="abc" は無効のため、既定値 800 を使います。` の警告後、閾値 800 で行数超過警告、`exit=0`。

- [ ] **Step 9: ace-scripts テスト再実行**

Run: `npm run test:ace-scripts`
Expected: PASS（新規 + 既存すべて green）。

- [ ] **Step 10: コミット**

```bash
git add docs-template/scripts/ace/check-category-size.ts docs-template/scripts/ace/check-category-size.test.ts
git commit -m "$(cat <<'EOF'
feat: #444 check-category-size.ts に Playbook 行数チェックを追加（警告のみ）

countPlaybookLines / isOverLineThreshold を追加し総行数を報告。
ACE_MAX_PLAYBOOK_LINES（既定 800）超過時は警告のみ・exit code 不変。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 関連ドキュメントの整合更新

**Files:**

- Modify: `.claude/commands/ace-curate.md`
- Modify: `docs-template/05-operations/deployment/ace-autonomous.md`
- Modify: `docs-template/scripts/ace/README.md`

**Interfaces:**

- Consumes: Task 1 で実装した `ACE_MAX_PLAYBOOK_LINES`（既定 800）と行数報告の挙動。
- Produces: ドキュメントのみ（後続タスクなし）。

- [ ] **Step 1: ace-curate.md の手動注記を自動チェック参照へ更新**

`.claude/commands/ace-curate.md` の「注意事項」末尾の行:

```markdown
- PLAYBOOK.md が 800 行を超えている場合は分割を提案
```

を次へ置換:

```markdown
- PLAYBOOK.md の総行数は `npm run ace:check-playbook-categories`（`check-category-size.ts`）が報告する。`ACE_MAX_PLAYBOOK_LINES`（既定 800）を超えると警告が出る（**警告のみ・追記はブロックしない**）。超過時は分割・アーカイブを別 Issue で検討する
```

- [ ] **Step 2: ace-autonomous.md の Feature flags 表に行数変数を追記**

`docs-template/05-operations/deployment/ace-autonomous.md` の Feature flags 表、`ACE_MAX_ENTRIES_PER_CATEGORY` の行の直後に次の行を追加:

```markdown
| `ACE_MAX_PLAYBOOK_LINES` | Playbook 総行数の警告閾値（**警告のみ・非ブロック**） | 省略時は `800`。**非数値や 0 以下は無効**として既定値にフォールバックし、stderr に警告を出す |
```

- [ ] **Step 3: ace-autonomous.md「Playbook 肥大化」節に行数検知を追記**

同ファイルの「## Playbook 肥大化と別 Issue 起票」節、本文の段落の直後（実行例 code block の前）に次の段落を追加:

```markdown
あわせて `check-category-size.ts` は Playbook の**総行数**も報告し、`ACE_MAX_PLAYBOOK_LINES`（既定 800）を超えると**警告のみ**（exit code は変えない）を出す。件数ゲート（exit 1）とは独立しており、行数超過は ACE の追記を止めず、分割・アーカイブの判断を別 Issue に委ねる。
```

- [ ] **Step 4: README.md のスクリプト説明と実行節を更新**

`docs-template/scripts/ace/README.md` の含まれるファイル表の該当行:

```markdown
| `check-category-size.ts` | Playbook 内の Category ごとの件数を数え、閾値超過で非ゼロ終了 |
```

を次へ置換:

```markdown
| `check-category-size.ts` | Playbook の Category 件数（閾値超過で非ゼロ終了）と総行数（閾値超過で警告のみ）をチェック |
```

さらに「## check-category-size.ts の実行」節の `ACE_MAX_ENTRIES_PER_CATEGORY` を説明している段落の直後に次を追加:

```markdown
環境変数 `ACE_MAX_PLAYBOOK_LINES`（省略時は `800`）で総行数の警告閾値を変更できます。総行数が閾値を超えると標準エラーに警告を出しますが、**終了コードは変えません（警告のみ・非ブロック）**。値が **非数値または 1 未満**のときは既定値 `800` にフォールバックし警告します。
```

- [ ] **Step 5: 変更 md を prettier で整形し lint 確認**

Run:

```bash
npx prettier --write .claude/commands/ace-curate.md docs-template/05-operations/deployment/ace-autonomous.md docs-template/scripts/ace/README.md
npx markdownlint-cli2 .claude/commands/ace-curate.md docs-template/05-operations/deployment/ace-autonomous.md docs-template/scripts/ace/README.md
```

Expected: prettier がテーブルを整形、markdownlint が `0 error(s)`。

- [ ] **Step 6: コミット**

```bash
git add .claude/commands/ace-curate.md docs-template/05-operations/deployment/ace-autonomous.md docs-template/scripts/ace/README.md
git commit -m "$(cat <<'EOF'
docs: #444 行数チェックを ACE 運用ドキュメントに反映

ace-curate.md の手動注記を自動チェック参照へ更新。
ace-autonomous.md の Feature flags 表・肥大化節と README に
ACE_MAX_PLAYBOOK_LINES と行数検知を追記。

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: 品質ゲートと PR

**Files:** なし（検証とリリース）

- [ ] **Step 1: 品質ゲートを通す**

Run: `npm run quality:local`
Expected: 全ステップ pass（`test:ace-scripts` の新規テスト含む、`format:md:check`・`lint:md` 含む）。失敗時は該当箇所を修正して再実行。

- [ ] **Step 2: push して Draft PR を作成**

```bash
git push -u origin feature/#444-ace-line-size-check
gh pr create --draft --base develop \
  --title "feat: #444 ACE Playbook 行数サイズチェックを追加（警告のみ）" \
  --body "Closes #444"
```

- [ ] **Step 3: セルフレビュー（Toolkit + Codex）→ 指摘を 1 fix commit → ready → squash merge → /merge-cleanup → /ace-curate**

CLAUDE.md の Git Workflow に従う（Toolkit `/pr-review-toolkit:review-pr` + Codex `pnpm code-review:codex -- --base develop`）。

## Self-Review（プラン作成者によるチェック）

**1. Spec coverage:**

- 総行数を常に報告 → Task 1 Step 5（`総行数: …` の出力）✓
- 閾値超過で警告・exit code 不変 → Task 1 Step 5（`console.error` のみ・`return` しない）+ Step 7 検証 ✓
- 環境変数の無効値フォールバック＋警告 → Task 1 Step 5（`parseMaxPlaybookLines`）+ Step 8 検証 ✓
- 純関数化＋ユニットテスト（カウント正確性・境界値）→ Task 1 Step 1,3（`countPlaybookLines` / `isOverLineThreshold`）✓
- カテゴリ件数ゲート不変 → Task 1 は既存 `overCategories` 判定に手を入れない ✓
- ドキュメント整合（ace-curate / ace-autonomous / README）→ Task 2 ✓
- `quality:local` pass → Task 3 Step 1 ✓

**2. Placeholder scan:** TBD/TODO/「適切に」等なし。全コード step に実コードあり ✓

**3. Type consistency:** `countPlaybookLines(content: string): number` / `isOverLineThreshold(lineCount: number, max: number): boolean` は定義（Task 1 Step 3）と利用（Task 1 Step 5, テスト Step 1）で一致 ✓
