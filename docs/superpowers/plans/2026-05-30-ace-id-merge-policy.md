# ACE エントリID PRスコープ化＋develop直マージ既定化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ACE エントリ ID を PRスコープ式（`ACE-<PR番号>-<連番>`）に変更して並行採番の衝突を構造的に解消し、develop 直マージを ACE 知見コミットの既定の推奨にする。

**Architecture:** ドキュメント中心の変更。ID 規則の SSOT を `PLAYBOOK.md §エントリID規則`、マージ方針の SSOT を `git-workflow.md ステップ10` に集約し、他ファイルはリンク参照に縮約する。ID 形式に依存する唯一のコード（`check-category-size.ts` の正規表現）を新旧両形式対応に緩和し、テストで保証する。既存 `ACE-001`〜`ACE-046` は改名せず恒久共存。

**Tech Stack:** Markdown ドキュメント, TypeScript（tsx/vitest）, markdownlint, MCP index check。

**設計仕様:** `docs/superpowers/specs/2026-05-30-ace-id-merge-policy-design.md` / 関連 Issue: #440

**ブランチ:** `chore/#440-ace-pr-scoped-id`（作成済み）

**保護対象（編集禁止）:** 既存 ACE エントリ本文（`PLAYBOOK.md` の各 `### ACE-NNN:` ブロック、特に L1284/L1286 付近の ACE-040 系）と Changelog（L1469 付近）は append-only 原則により書き換えない。

---

## Task 1: ツールの正規表現を新旧両形式対応に緩和（TDD）

**Files:**
- Modify: `docs-template/scripts/ace/check-category-size.ts:13-14`
- Test: `docs-template/scripts/ace/check-category-size.test.ts`

- [ ] **Step 1: 失敗するテストを追加**

`check-category-size.test.ts` の `describe` ブロック内、`"ACE-1000 のように…"` の `it` の直後に以下を追加する：

```typescript
  it("PRスコープ式 ID（ACE-438-1）と Issue 式（ACE-i425-1）もエントリとして扱う", () => {
    const md = `
### ACE-438-1: PRスコープ式エントリ

| フィールド | 値 |
| Category | coding |
| Origin | PR #438 |

### ACE-438-2: 同一PRの2件目

| フィールド | 値 |
| Category | testing |
| Origin | PR #438 |

### ACE-i425-1: Issue 由来エントリ

| フィールド | 値 |
| Category | process |
| Origin | Issue #425 |
`;

    const result = analyzePlaybookMarkdown(md);
    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.totalEntries).toBe(3);
      expect(result.histogram.coding).toBe(1);
      expect(result.histogram.testing).toBe(1);
      expect(result.histogram.process).toBe(1);
    }
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run docs-template/scripts/ace/check-category-size.test.ts`
Expected: FAIL（旧正規表現 `/^### ACE-\d{3,}:/m` は `ACE-438-1:` にマッチしないため、`result.kind` が `"error"`（ACE 見出しが見つからない）になり assertion が落ちる）

- [ ] **Step 3: 正規表現とコメントを緩和**

`check-category-size.ts:13-14` を以下に置換する：

```typescript
/** PLAYBOOK の ID 規則。旧 3 桁形式（ACE-001）と新 PRスコープ式（ACE-438-1 / ACE-i425-1）の両方に対応する。 */
const ACE_ENTRY_HEADER_PATTERN = /^### ACE-[\w-]+:/m;
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run docs-template/scripts/ace/check-category-size.test.ts`
Expected: PASS（既存 3 テスト＋新規 1 テストすべて green）

- [ ] **Step 5: 実 PLAYBOOK に対する集計が動くことを確認**

Run: `npm run ace:check-playbook-categories`
Expected: 終了コード 0、`総エントリ数: 46`（現行 PLAYBOOK の既存エントリがすべて旧形式でカウントされる）

- [ ] **Step 6: コミット**

```bash
git add docs-template/scripts/ace/check-category-size.ts docs-template/scripts/ace/check-category-size.test.ts
git commit -m "fix: #440 ACE category checker を新旧両ID形式対応に緩和"
```

---

## Task 2: PLAYBOOK.md を ID 規則の SSOT にする

**Files:**
- Modify: `docs-template/08-knowledge/PLAYBOOK.md`（§エントリID規則 L38-42, anchor ガイドライン L97, 参照リンク形式 L98）

- [ ] **Step 1: §エントリID規則を PRスコープ式に書き換え**

L38-42 の以下のブロック：

```markdown
### エントリID規則

- 形式: `ACE-{連番3桁}` （例: `ACE-001`, `ACE-042`）
- 連番はファイル内でインクリメント（欠番許容）
- 分割後も通し番号を維持
```

を次に置換する：

```markdown
### エントリID規則

ACE エントリ ID は **PRスコープ式** を採用する（このセクションが ID 規則の SSOT）。複数人・複数AIが並行で `/ace-curate` を回しても番号が衝突しないための構造である。

- **形式**: `ACE-<PR番号>-<連番>`（例: `ACE-438-1`, `ACE-438-2`）
- **非PR由来の fallback**: `ACE-i<Issue番号>-<連番>`（例: `ACE-i425-1`）
- **採番**: 同一 PR の既存 `ACE-<PR番号>-*` を確認し、その最大連番 +1（無ければ `-1`）。**全体の最新 ID を読む必要がない**ため並行採番でも衝突しない（PR 番号は GitHub が全体一意に採番するため、別 PR = 別 namespace）。
- **連番の範囲**: 1 回の `/ace-curate` で同一 PR から 1〜3 件追記する想定。同一 PR を再 curate する場合は既存の最大連番から継続。
- **既存 ID の扱い**: 旧 `ACE-{連番3桁}` 形式（`ACE-001`〜）のエントリは **改名しない**。旧 3 桁形式と新 PRスコープ式は恒久的に共存する（参照・anchor 互換の維持）。ID にファイル位置の情報は持たせないため、分割後も ID はそのまま維持する。
```

- [ ] **Step 2: anchor ガイドライン（L97）を書き換え**

L97 の行：

```markdown
- **anchor**: 各エントリは見出し直前に `<a id="ace-XXX"></a>` を 1 行付与する。`XXX` は **3 桁ゼロパディング数字に置換**（例: `ace-001`, `ace-034`、anchor 部分は常に小文字英数字）。ファイルレベル参照（`PLAYBOOK.md` 単体）は常にファイル先頭に着地するため、anchor がなければ個別エントリへの誘導が成立しない。anchor 付与により他ドキュメントから `[ACE-034](path/to/PLAYBOOK.md#ace-034)` 形式で**特定エントリに直接ジャンプ可能**になる。
```

を次に置換する：

```markdown
- **anchor**: 各エントリは見出し直前に `<a id="ace-XXX"></a>` を 1 行付与する。`XXX` は **エントリ ID を小文字化したもの**（新規は `ace-438-1` / `ace-i425-1`、旧エントリは `ace-001`。anchor 部分は常に小文字英数字＋ハイフン）。ファイルレベル参照（`PLAYBOOK.md` 単体）は常にファイル先頭に着地するため、anchor がなければ個別エントリへの誘導が成立しない。anchor 付与により他ドキュメントから `[ACE-438-1](path/to/PLAYBOOK.md#ace-438-1)` 形式で**特定エントリに直接ジャンプ可能**になる。
```

- [ ] **Step 3: 参照リンク形式（L98）の置換ルールを format-agnostic に**

L98 の置換ルール記述のみを差し替える（行頭〜`label は使わない`の前まで）。

旧（該当部分）:

```text
...形式に統一する（XXX を 3 桁数字に置換）。
```

新（該当部分）:

```text
...形式に統一する（XXX はエントリ ID をそのまま使用。新規は ace-438-1、旧は 3 桁 ace-040）。
```

（L98 のそれ以外（ACE-040 / ACE-024 への言及、Issue #425 の出典）は変更しない）

- [ ] **Step 4: コミット**

```bash
git add docs-template/08-knowledge/PLAYBOOK.md
git commit -m "docs: #440 PLAYBOOK の ID 規則を PRスコープ式に変更(SSOT)"
```

---

## Task 3: git-workflow.md をマージ方針の SSOT にする（ACE-012 再フレーム）

**Files:**
- Modify: `docs-template/05-operations/deployment/git-workflow.md`（#### 運用パターン L804-810）

- [ ] **Step 1: 運用パターンを反転（develop 直マージを既定の推奨に）**

L804-810 の以下のブロック：

```markdown
#### 運用パターン

**個人開発（簡易）**: マージ後 cleanup を済ませた develop で `/ace-curate <PR番号>` を実行し、PLAYBOOK.md 追記を直接 develop に commit + push する。PLAYBOOK.md は append-only で構造化されているためコンフリクトリスクが低く、ACE 1 サイクル分の小さい変更を毎回 PR 化するオーバーヘッドは過剰。

**チーム開発（推奨）**: マージ後 cleanup を済ませた develop から `chore/ace-from-pr-<PR番号>` ブランチを切り、PLAYBOOK.md 追記を小さい chore PR として PR レビュー → squash merge する。複数人が並行で ACE を回す環境では PLAYBOOK.md の append-only 順序競合を防げる。

> **ACE-012 の例外として明示**: 通常 develop への直接 commit は禁止（[ACE-012](../../08-knowledge/PLAYBOOK.md#ace-012)）だが、**「個人開発（簡易）」パターンに限り PLAYBOOK.md 単独追記の直接 push を例外として許容する**。理由: (1) PLAYBOOK.md は append-only で構造化されており他コミッタの追記と競合しにくい、(2) 1 サイクル分の知見追加は履歴上独立 commit として読める、(3) `knowledge:` プレフィックスで他のコミットと識別可能。コミッタ 3 人以上のリポジトリでは「チーム開発（推奨）」パターンを必須とし、この例外は適用しない。
```

を次に置換する：

```markdown
#### 運用パターン（マージ方針）

> このセクションが ACE 知見コミットのマージ方針の **SSOT**。ace-cycle.md / ace-curate.md はここを参照する。

**既定（推奨）— develop 直マージ**: マージ・cleanup 後の develop で `/ace-curate <PR番号>` を実行し、PLAYBOOK.md 追記を **develop に直接 commit + push** する。PLAYBOOK.md は append-only で構造化されており、ID も PRスコープ式（[エントリID規則](../../08-knowledge/PLAYBOOK.md#エントリid規則)）で衝突しないため、ACE 1 サイクル分の小さな知見追加を毎回 PR 化するのは過剰なオーバーヘッド。

**任意エスカレーション — chore PR**: 大人数チーム、または知見内容自体をレビューに残したい場合のみ、develop から `chore/ace-from-pr-<PR番号>` ブランチを切り、PLAYBOOK.md 追記を小さい chore PR として PR レビュー → squash merge する。

> **ACE-012 との関係（混同しないこと）**: [ACE-012](../../08-knowledge/PLAYBOOK.md#ace-012) は *うっかり* feature 作業を develop に直接 push してしまう事故（ブランチ切り替わりの見落とし）を防ぐルール。一方、本セクションの「develop 直マージ」は `knowledge:` プレフィックス付きの **PLAYBOOK 単独コミット** に限定した *意図的・承認済み* のフローであり、両者は別物。ACE-012 は引き続き有効（deprecated にしない）。
```

- [ ] **Step 2: コミット**

```bash
git add docs-template/05-operations/deployment/git-workflow.md
git commit -m "docs: #440 ACE マージ方針を develop 直マージ既定に反転(SSOT)"
```

---

## Task 4: ace-cycle.md を SSOT へリンク・採番手順を更新

**Files:**
- Modify: `docs-template/05-operations/deployment/ace-cycle.md`（運用パターン L14-22, 採番 L136-142, Phase3 例 L148-169, anchor L169）

- [ ] **Step 1: 運用パターン（L14-22）を git-workflow SSOT への要約リンクに**

L14-22 の「### 運用パターン」見出しから「**autonomous（任意）**」の直前までを、次に置換する（`**autonomous（任意）**` 行以降は残す）：

```markdown
### 運用パターン

ACE 知見コミットのマージ方針は **[git-workflow.md ステップ10 §運用パターン（マージ方針）](./git-workflow.md)** を SSOT とする。要約：

- **既定（推奨）**: develop に直接 commit + push（PLAYBOOK.md は append-only ＋ PRスコープ式 ID で衝突しない）。
- **任意エスカレーション**: 大人数チーム / 知見レビューを残したい場合のみ `chore/ace-from-pr-<PR番号>` の小 PR。
- ここでの develop 直 push は `knowledge:` 付き PLAYBOOK 単独コミットに限った意図的フローであり、[ACE-012](../../08-knowledge/PLAYBOOK.md#ace-012)（うっかり develop 直 push の事故防止）とは別物。

```

- [ ] **Step 2: 採番手順（L136-142）を PRスコープ式に**

L136-142 の以下のブロック：

````markdown
#### 1. エントリID の採番

```bash
# 現在の最新エントリIDを確認
# PLAYBOOK.md の末尾エントリのIDを確認し、次の連番を使用
# 例: 最新が ACE-005 → 次は ACE-006
```
````

を次に置換する：

````markdown
#### 1. エントリID の採番

ID は **PRスコープ式**（`ACE-<PR番号>-<連番>`）。採番ルールの SSOT は [PLAYBOOK.md §エントリID規則](../../08-knowledge/PLAYBOOK.md#エントリid規則)。

```bash
# 対象 PR の既存エントリ ACE-<PR番号>-* を確認し、最大連番 +1（無ければ -1）
# 例: PR #438 で初回 → ACE-438-1、2 件目 → ACE-438-2
# 非PR由来は ACE-i<Issue番号>-<連番>（例: ACE-i425-1）
```
````

- [ ] **Step 3: Phase3 追記例（L148-167）の ID を新形式に**

L149 と L151 の例を次に置換する：

- L149: `<a id="ace-006"></a>` → `<a id="ace-438-1"></a>`
- L151: `### ACE-006: [タイトル]` → `### ACE-438-1: [タイトル]`

- [ ] **Step 4: anchor 命名規則（L169）を書き換え**

L169 の行：

```markdown
**anchor 命名規則**: 見出し直前に `<a id="ace-NNN"></a>` を 1 行付与（小文字 + ハイフン + 3 桁ゼロパディング）。詳細・根拠は SSOT である [PLAYBOOK.md 記述ガイドライン](../../08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照。
```

を次に置換する：

```markdown
**anchor 命名規則**: 見出し直前に `<a id="ace-XXX"></a>` を 1 行付与（エントリ ID を小文字化、例 `ace-438-1`）。詳細・根拠は SSOT である [PLAYBOOK.md 記述ガイドライン](../../08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照。
```

- [ ] **Step 5: コミット**

```bash
git add docs-template/05-operations/deployment/ace-cycle.md
git commit -m "docs: #440 ace-cycle を SSOT 参照＋PRスコープ式採番に更新"
```

---

## Task 5: ace-curate.md を SSOT へリンク・採番手順を更新

**Files:**
- Modify: `.claude/commands/ace-curate.md`（4-a 採番 L73-76, anchor L102, 運用パターン L110-133）

- [ ] **Step 1: 4-a 採番（L73-76）を PRスコープ式に**

L73-76 の以下のブロック：

```markdown
#### 4-a. エントリIDの採番

PLAYBOOK.md の既存エントリから最新のIDを確認し、次の連番を使用
```

を次に置換する：

```markdown
#### 4-a. エントリIDの採番

ID は **PRスコープ式** `ACE-<PR番号>-<連番>`（例 `ACE-438-1`、非PR由来は `ACE-i<Issue番号>-<連番>`）。対象 PR の既存 `ACE-<PR番号>-*` を確認し最大連番 +1（無ければ `-1`）。全体の最新 ID は読まない。採番ルールの SSOT は [PLAYBOOK.md §エントリID規則](../../docs-template/08-knowledge/PLAYBOOK.md#エントリid規則)。
```

- [ ] **Step 2: anchor 命名規則（L102）を書き換え**

L102 の行：

```markdown
**anchor 命名規則**: 見出し直前に `<a id="ace-NNN"></a>` を 1 行付与（小文字 + ハイフン + 3 桁ゼロパディング）。詳細・根拠は SSOT である [PLAYBOOK.md 記述ガイドライン](../../docs-template/08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照。
```

を次に置換する：

```markdown
**anchor 命名規則**: 見出し直前に `<a id="ace-XXX"></a>` を 1 行付与（エントリ ID を小文字化、例 `ace-438-1`）。詳細・根拠は SSOT である [PLAYBOOK.md 記述ガイドライン](../../docs-template/08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照。
```

- [ ] **Step 3: テンプレート内の anchor 例（L82-84）を新形式に**

`### 4-b. PLAYBOOK.md への追記` のテンプレート（L82-84 付近）：

```markdown
<a id="ace-XXX"></a>

### ACE-XXX: [タイトル]
```

の `ace-XXX` / `ACE-XXX` はプレースホルダのため変更不要。ただし直前に 1 行補足を追加する（L81 の追記説明の直後）：

```markdown
（`XXX` は 4-a の PRスコープ式 ID に置換。例 `ace-438-1` / `ACE-438-1`）
```

- [ ] **Step 4: 運用パターン（コミット手順 L110-133）を git-workflow SSOT 準拠に反転**

L110-133 の「### 5. コミット」の本文（`**個人開発（簡易）**` 〜 判断基準リンクまで）を次に置換する。見出し `### 5. コミット` と末尾の `### 6. 結果レポート` は残す：

````markdown
### 5. コミット

マージ方針の SSOT は [git-workflow.md ステップ10 §運用パターン（マージ方針）](../../docs-template/05-operations/deployment/git-workflow.md)。

**既定（推奨）— develop 直マージ**: develop に直接 commit + push する。

```bash
git add docs-template/08-knowledge/PLAYBOOK.md
git commit -m "knowledge: ACE-<PR番号>-<連番> [category] [summary]"
git push origin develop
```

**任意エスカレーション — chore PR**: 大人数チーム / 知見レビューを残したい場合のみ `chore/ace-from-pr-<PR番号>` ブランチで小さい PR を作成。

```bash
git checkout -b chore/ace-from-pr-<PR番号>
git add docs-template/08-knowledge/PLAYBOOK.md
git commit -m "knowledge: ACE-<PR番号>-<連番> [category] [summary]"
git push -u origin chore/ace-from-pr-<PR番号>
gh pr create --base develop --title "knowledge: ACE-<PR番号>-<連番> [category]" --body "PR #<PR番号> から知見抽出"
# レビュー後 squash merge → /merge-cleanup
```

> `knowledge:` 付き PLAYBOOK 単独コミットの develop 直 push は意図的フローであり、[ACE-012](../../docs-template/08-knowledge/PLAYBOOK.md#ace-012)（うっかり develop 直 push の事故防止）とは別物。
````

- [ ] **Step 5: 結果レポート例（L143-150）の ID 表記を新形式に**

L144-150 付近の結果レポート例の `ACE-XXX, ACE-YYY` / `ACE-ZZZ` を新形式の例に置換する：

- `**新規エントリ**: ACE-XXX, ACE-YYY` → `**新規エントリ**: ACE-438-1, ACE-438-2`
- `**カウンター更新**: ACE-ZZZ (Helpful +1)` → `**カウンター更新**: ACE-016 (Helpful +1)`
- 追加エントリ箇条書きの `- ACE-XXX:` / `- ACE-YYY:` → `- ACE-438-1:` / `- ACE-438-2:`

- [ ] **Step 6: コミット**

```bash
git add .claude/commands/ace-curate.md
git commit -m "docs: #440 ace-curate を SSOT 参照＋PRスコープ式採番に更新"
```

---

## Task 6: ACE_FRAMEWORK.md の Phase 3 採番記述を更新

**Files:**
- Modify: `docs/ACE_FRAMEWORK.md:160`

- [ ] **Step 1: Phase 3 採番の行を書き換え**

L160 の行：

```markdown
1. 次のエントリID（`ACE-{連番3桁}`）を採番
```

を次に置換する：

```markdown
1. エントリID を PRスコープ式（`ACE-<PR番号>-<連番>`、例 `ACE-438-1`）で採番（採番ルールは [PLAYBOOK.md §エントリID規則](../docs-template/08-knowledge/PLAYBOOK.md#エントリid規則)）
```

- [ ] **Step 2: コミット**

```bash
git add docs/ACE_FRAMEWORK.md
git commit -m "docs: #440 ACE_FRAMEWORK Phase3 採番を PRスコープ式に更新"
```

---

## Task 7: 残骸スイープと品質ゲート検証

**Files:**
- 検証のみ（必要に応じて該当ファイルを修正）

- [ ] **Step 1: 連番・3桁の残骸を grep（保護対象＝既存エントリ本文/Changelog を除く）**

Run:

```bash
grep -rnE "連番|3 桁|3桁|次の連番|ACE-\{連番|ACE-\\\\d\{3\}" \
  docs-template/08-knowledge/PLAYBOOK.md \
  docs-template/05-operations/deployment/ace-cycle.md \
  docs-template/05-operations/deployment/git-workflow.md \
  .claude/commands/ace-curate.md \
  docs/ACE_FRAMEWORK.md
```

Expected: ヒットは **既存 ACE エントリ本文 / Changelog 内のみ**（`PLAYBOOK.md` L1284/L1286=ACE-040 系本文, L1469=Changelog）。これらは append-only 原則により編集禁止＝残ってよい。§エントリID規則・採番手順・anchor ガイドライン・運用パターンなど **normative セクションにヒットが残っていたら修正する**。

- [ ] **Step 2: anchor リンク整合の確認（新リンク `#エントリid規則` が着地するか）**

Run:

```bash
grep -n "^### エントリID規則" docs-template/08-knowledge/PLAYBOOK.md
```

Expected: 1 件ヒット（GitHub slug `エントリid規則` に解決される）。新規に追加した `#エントリid規則` リンクの参照先見出しが存在することを確認。

- [ ] **Step 3: ace-scripts テスト再実行**

Run: `npm run test:ace-scripts`
Expected: PASS（全テスト green）

- [ ] **Step 4: MCP index チェック**

Run: `npm run check`
Expected: PASS（ID 形式に依存しないため緑のまま）

- [ ] **Step 5: Markdown lint / format チェック**

Run: `npm run lint:md && npm run format:md:check`
Expected: 0 error（変更ファイルが lint・format を通過）

- [ ] **Step 6: 残った修正があればコミット**

```bash
git add -A
git commit -m "chore: #440 残骸スイープ・lint 修正"
```

（修正が無ければスキップ）

---

## Self-Review（プラン作成者による spec 照合）

- **Spec coverage**: 受け入れ条件 5 項目をタスクに対応付け — ①ID SSOT→Task2、②develop 直マージ＋ACE-012→Task3、③checker 新旧対応→Task1、④`npm run check`→Task7 Step4、⑤既存参照非破壊→Task2(改名しない方針)＋Task7 Step1(保護対象除外)。SSOT 統合（spec §C）→Task2/3 が正本、Task4/5/6 がリンク縮約。ツール（spec §D）→Task1＋Task7。
- **Placeholder scan**: 全コード/編集ステップに実テキストを記載。"適切に" 等の曖昧表現なし。
- **Type consistency**: 関数名 `analyzePlaybookMarkdown`、正規表現名 `ACE_ENTRY_HEADER_PATTERN` は既存コードと一致。ID 形式 `ACE-438-1` / `ACE-i425-1`、anchor `ace-438-1`、SSOT リンク `#エントリid規則` は全タスクで統一。
