# ACE エントリID の PRスコープ化＋ develop 直マージ既定化 — 設計仕様

## 概要

ACE (Agentic Context Engineering) の運用ルールを 2 点改善する。

1. **エントリ ID を連番から PRスコープ式へ** — 複数人が並行で `/ace-curate` を回したときの番号衝突を構造的に解消する。
2. **ACE 知見コミットのマージ方針を反転** — develop 直 commit + push を「既定の推奨」とし、chore PR 方式を任意エスカレーションに降格する。

関連 Issue: [#440](https://github.com/feel-flow/ai-spec-driven-development/issues/440)

## 対象ユーザー

`ai-spec-driven-development` フレームワークで ACE を運用する開発者。特に **複数人・複数AIが並行で ACE を回すチーム** が主たる受益者。

## 背景・課題

### 課題1: 連番 ID の衝突

現行 ID 形式は `ACE-{連番3桁}`（例 `ACE-046`）。`/ace-curate` は「PLAYBOOK の最新 ID ＋1」で次番号を採番する。この `next = max+1` 方式は **共有カウンタを読む** ため、複数人が並行でマージ後に ACE を回すと、各々が独立に同じ番号（例 `ACE-047`）を採番して衝突する。

連番が提供する唯一の機能はこの `next = max+1` ショートカットであり、それがそのまま衝突源になっている。番号の連続性に本質的な意味はない。

### 課題2: マージ方針

現行ドキュメントは **chore PR 方式（`chore/ace-from-pr-<PR番号>`）を「推奨」**、develop 直 push を「個人開発（簡易）の例外」と位置づけている。だが ACE 1 サイクル分の変更は PLAYBOOK.md への append-only な小追記であり、毎回 PR 化するのは過剰なオーバーヘッド。**develop 直マージを既定の推奨にしたい。**

## 要件

1. 新形式 ID は **採番時に全体の最新 ID を読む必要がない**（衝突源の除去）
2. 既存 `ACE-001`〜`ACE-046` を **改名しない**（参照・anchor 互換の維持）
3. ID 規則・マージ方針はそれぞれ **単一の正本（SSOT）** を持ち、他ファイルはリンク参照に統一する
4. ID 形式に依存するツール（`check-category-size.ts`）が **新旧両形式にマッチ** する
5. develop 直マージが既定の推奨として記述され、**ACE-012 との関係が明示** されている

## 詳細設計

### A. ID 体系（PRスコープ式）

| 項目 | 新ルール |
| --- | --- |
| 新形式 | `ACE-<PR番号>-<連番>`（例 `ACE-438-1`, `ACE-438-2`） |
| 非PR由来 fallback | `ACE-i<Issue番号>-<連番>`（例 `ACE-i425-1`） |
| anchor | `<a id="ace-438-1"></a>`（小文字・ハイフン） |
| 相互参照 | `[ACE-438-1](path/PLAYBOOK.md#ace-438-1)` |
| 採番方法 | 同一 PR の既存 `ACE-<PR>-*` を確認し max+1（無ければ 1）。**全体の最新 ID を読まない** |
| 既存 ID | `ACE-001`〜`ACE-046` は改名せず、旧 3 桁形式と新形式が恒久共存 |
| `ace_entry_count` | フィールドは維持（deprecated 含む総数）。「次 ID ＝ count+1」のショートカットは廃止 |
| コミット規則 | `knowledge: ACE-438-1 [category] [summary]`（形式は不変、ID 表記のみ更新） |

**衝突しない理由（確率論ではなく構造保証）**: PR 番号は GitHub が全体で一意に採番する。別の人は別 PR で作業するため、`ACE-<PR番号>-*` の名前空間が PR 単位で分離される。同一 PR を curate するのは通常 1 人なので、その PR 内の `-連番` も単一所有者が決められる。

**再 curate 時のエッジケース**: 同一 PR が後から再度 curate される場合、既存の `ACE-<PR>-*` の max+1 から連番を継続する。

### B. マージ方針（develop 直マージを既定の推奨に）

- **既定（推奨）**: マージ・cleanup 後の develop で `/ace-curate <PR番号>` を実行し、PLAYBOOK.md 追記を **develop に直接 commit + push**。
- **任意エスカレーション**: 大人数チーム / 知見内容自体をレビューに残したい場合のみ、`chore/ace-from-pr-<PR番号>` ブランチで小さい chore PR を作成。

**ACE-012 との整合（自己矛盾の回避）**:

- ACE-012 は **うっかり** feature 作業を develop に push する事故を防ぐルール（ブランチ切り替わりの検知）。
- `knowledge:` プレフィックス付き **PLAYBOOK 単独コミット** は **意図的・承認済み** の直 push フロー。
- 両者は別物として明示的に書き分ける。**ACE-012 は deprecated にしない。**

### C. SSOT 統合

| 対象ルール | 正本（SSOT） | 他ファイルの扱い |
| --- | --- | --- |
| ID 規則 | `PLAYBOOK.md §エントリID規則` | `ACE_FRAMEWORK.md` / `ace-cycle.md` / `ace-curate.md` は採番手順を簡潔化し SSOT へリンク |
| マージ方針 | `git-workflow.md ステップ10` | `ace-cycle.md` / `ace-curate.md` の運用パターン記述はここへリンク |

### D. ツール更新

- `docs-template/scripts/ace/check-category-size.ts:14` の正規表現
  `/^### ACE-\d{3,}:/m` → `/^### ACE-[\w-]+:/m`
  （旧 3 桁 `ACE-046`・新 PR 式 `ACE-438-1`・Issue 式 `ACE-i425-1` すべてにマッチ）
- `check-category-size.test.ts` に新形式エントリの fixture を追加し、両形式が集計対象になることを検証
- `build-spec-index.mjs` と MCP `npm run check` が ID 形式に依存しないことを実装時に確認（依存していれば追加対応）

## 作成・変更ファイル一覧

| ファイル | 種別 | 説明 |
| --- | --- | --- |
| `docs-template/08-knowledge/PLAYBOOK.md` | 変更 | §エントリID規則（SSOT 化）・anchor ガイドライン・エントリテンプレート |
| `docs-template/05-operations/deployment/git-workflow.md` | 変更 | ステップ10 運用パターンの反転（SSOT 化）・ACE-012 注記の書き換え |
| `docs-template/05-operations/deployment/ace-cycle.md` | 変更 | 採番手順・anchor・運用パターンを SSOT へリンク |
| `.claude/commands/ace-curate.md` | 変更 | 4-a 採番・anchor・運用パターンを SSOT へリンク |
| `docs/ACE_FRAMEWORK.md` | 変更 | Phase 3 の採番記述（`ACE-{連番3桁}` → PRスコープ式） |
| `docs-template/scripts/ace/check-category-size.ts` | 変更 | 正規表現を新旧両形式対応に緩和 |
| `docs-template/scripts/ace/check-category-size.test.ts` | 変更 | 新形式 fixture 追加 |

## エラーハンドリング・互換性

- **後方互換**: 旧 3 桁 ID は改名せず存続。既存の anchor・相互参照・Helpful カウンタ参照（例 "ACE-016/046 Helpful +1"）はすべて有効なまま。
- **混在検証**: `check-category-size.ts` のテストで新旧混在の PLAYBOOK を集計できることを保証。
- **MCP index**: `npm run check` が pass することを受け入れ条件に含める。

## テスト

- `check-category-size.test.ts`: 新形式・Issue 式・旧 3 桁が混在する fixture で Category 集計が正しく動くことを検証。
- `cd mcp && npm run check`: ドキュメント変更後の index 検証 pass。
- grep 残骸チェック: 編集後に `連番` / `3桁` / `\d{3}` / `次の連番` の残存を grep で確認（SSOT 化の自己点検）。

## スコープ外

- 個人グローバル設定 `~/.claude/CLAUDE.md`（本リポジトリ外のため触らない）
- 既存 `ACE-001`〜`ACE-046` の ID 形式統一（改名しない方針のため対象外）
- 本変更自体の知見抽出（マージ後に通常の `/ace-curate` で実施）

## 受け入れ条件

- [ ] 新形式 ID ルールが PLAYBOOK.md（SSOT）に明記され、他ファイルはリンク参照に統一されている
- [ ] develop 直マージが既定の推奨として記述され、ACE-012 との関係が明示されている
- [ ] `check-category-size.ts` が新旧両形式にマッチし、test が green
- [ ] `npm run check`（MCP index 検証）が pass
- [ ] 既存 ACE-001〜046 の参照・anchor が壊れていない
