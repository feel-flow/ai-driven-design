# ACE Playbook 行数サイズチェックの追加（警告のみ） — 設計仕様

## 概要

ACE (Agentic Context Engineering) の Playbook (`docs-template/08-knowledge/PLAYBOOK.md`) は知見が累積するため肥大化する。本変更は、既存の `check-category-size.ts` を拡張し、Playbook の**総行数**を自動で可視化する。閾値（既定 800 行）を超えた場合は**警告のみ（非ブロック）**で分割・アーカイブを促し、ACE の追記処理は止めない。

関連 Issue: [#444](https://github.com/feel-flow/ai-spec-driven-development/issues/444)

## 対象ユーザー

`ai-spec-driven-development` フレームワークで ACE を運用する開発者。特に、ACE を継続運用して Playbook が育っていくプロジェクトの保守者。

## 背景・課題

### 課題1: 行数チェックが手動の注記のみ

`ace-curate.md:159` に「PLAYBOOK.md が 800 行を超えている場合は分割を提案」という**手動の注意書き**があるが、自動化されていない。実行のたびに人間（または LLM）が気づいて判断する必要があり、見落とされやすい。

### 課題2: 既存チェックは「件数」軸で「行数」を見ていない

既存の `check-category-size.ts` は「カテゴリ別の**エントリ件数**」（既定 130 件）を数えて閾値超過で `exit 1` を返すゲート。これは「行数」とは別軸であり、Playbook 全体のボリューム（行数）は監視対象外。

### 現状

PLAYBOOK.md は本設計時点で **1745 行** であり、手動注記の 800 行ラインを既に大幅超過している。「肥大化」は将来の懸念ではなく、既に発生している現実。

## 要件

1. `check-category-size.ts` が Playbook の**総行数を常に報告**する
2. 総行数が閾値（既定 **800**、環境変数 `ACE_MAX_PLAYBOOK_LINES` で上書き可）を超えたら**警告を出す**
3. 行数超過は**警告のみ**で、プロセスの exit code を変えない（既存の件数ゲートとは独立）
4. 環境変数の無効値（非数値・0 以下）は既定値にフォールバックし stderr に警告（既存 `parseMaxPerCategory` と同じ流儀）
5. 行数解析ロジックは**純関数**として切り出し、ユニットテストで保証する
6. 関連ドキュメント（`ace-curate.md` / `ace-autonomous.md` / `ace/README.md`）が整合する

## 詳細設計

### A. 実装場所と責務

既存 `docs-template/scripts/ace/check-category-size.ts` を拡張し、責務を「**カテゴリ件数チェック**（既存・ゲート）」＋「**総行数チェック**（新規・警告のみ）」の 2 軸に広げる。

- **ファイル名は維持**する。rename は `package.json`（`ace:check-playbook-categories`）・`README.md`・`ace-autonomous.md` 等への波及が大きいため。代わりに**ファイル冒頭の doc コメントと README 説明文を「件数＋行数」へ更新**して責務拡張を明示する。

### B. 振る舞い（2 軸の共存）

| 軸                   | 閾値（既定 / 環境変数）              | 超過時の挙動                          |
| -------------------- | ------------------------------------ | ------------------------------------- |
| カテゴリ件数（既存） | 130 / `ACE_MAX_ENTRIES_PER_CATEGORY` | **exit 1（ゲート）**                  |
| 総行数（新規）       | 800 / `ACE_MAX_PLAYBOOK_LINES`       | **警告を出力するが exit code は不変** |

- 総行数は閾値の超過/非超過に関わらず**常に報告**する。
- 行数の定義: `wc -l` 準拠（`content` 中の改行文字 `\n` の**出現回数**。`split` の要素数ではない。末尾に改行が無い最終行は数えない）。
- exit code の整理:
  - `0` … 両軸 OK、または**行数のみ超過**（行数は警告のみのため）
  - `1` … カテゴリ件数が超過（既存ゲート）
  - `2` … usage error（パス未指定・読み込み失敗）

### C. 環境変数 `ACE_MAX_PLAYBOOK_LINES`

- 既定値 `800`（定数 `DEFAULT_MAX_PLAYBOOK_LINES`）。
- パース関数は既存の `parseMaxPerCategory` を踏襲した `parseMaxPlaybookLines` を新設:
  - 未設定・空文字 → 既定値
  - 非数値・0 以下・非有限 → 既定値へフォールバックし stderr に警告
- 既存 `ACE_MAX_ENTRIES_PER_CATEGORY` の検証ロジックと UX を揃える。
- 解釈は共有ヘルパー `parsePositiveIntEnv` に集約し、`ACE_MAX_ENTRIES_PER_CATEGORY` と共用。`/^[0-9]+$/` で**厳密な正の整数のみ**受理し、`800abc` や `1e3` のような曖昧な値も無効として弾く。

### D. 出力イメージ

```text
Playbook: /path/to/PLAYBOOK.md
総エントリ数: 47
総行数: 1745 (閾値 800)
⚠ 行数が閾値を超過しています。分割・アーカイブを検討してください（別 Issue 起票を推奨）。
カテゴリ別件数:
process: 12
coding: 9
...
```

- 行数行は常に出力。超過時のみ警告行（`⚠ …`）を追加。警告は stderr、件数/行数の通常レポートは stdout に出す（既存の出力先方針に合わせる）。

### E. 関数分割（純関数化）

- 既存 `analyzePlaybookMarkdown(content)` はそのまま。
- 行数は副作用のない小関数 `countPlaybookLines(content): number` として切り出し、`main()` から呼ぶ。閾値判定は純関数 `isOverLineThreshold(count, max)` に切り出し（`main()` から呼ぶ）、テストは「行数カウントの正確性」と「閾値判定の真偽」を別々に検証できるようにする。

## 作成・変更ファイル一覧

| ファイル                                                   | 種別 | 説明                                                                                |
| ---------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------- |
| `docs-template/scripts/ace/check-category-size.ts`         | 変更 | 総行数の報告・`ACE_MAX_PLAYBOOK_LINES` による警告（警告のみ）・doc コメント更新     |
| `docs-template/scripts/ace/check-category-size.test.ts`    | 変更 | `countPlaybookLines` のカウント正確性・境界値テストを追加                           |
| `.claude/commands/ace-curate.md`                           | 変更 | 注意事項の手動「800 行」注記を自動チェック参照へ更新                                |
| `docs-template/05-operations/deployment/ace-autonomous.md` | 変更 | 「Playbook 肥大化」節と Feature flags 表に行数検知・`ACE_MAX_PLAYBOOK_LINES` を追記 |
| `docs-template/scripts/ace/README.md`                      | 変更 | スクリプト説明文を「件数＋行数」に更新                                              |

## エラーハンドリング・互換性

- **後方互換**: 既存のカテゴリ件数ゲート（exit 1）の挙動は不変。`ace:check-playbook-categories` の既存利用者に破壊的変更はない（出力に行数行と警告が増えるのみ）。
- **無効な環境変数**: `ACE_MAX_PLAYBOOK_LINES` の非数値/0 以下/非有限は既定値 800 にフォールバックし stderr に警告（`ACE_MAX_ENTRIES_PER_CATEGORY` と同一の UX）。
- **空ファイル・読み込み失敗**: 既存の usage error（exit 2）パスを踏襲。

## テスト

- `check-category-size.test.ts` に追加:
  - `countPlaybookLines`: 通常テキスト・末尾改行あり/なし・空文字でのカウントが期待どおり。
  - 閾値判定の境界値: 閾値ちょうど（超過しない）と閾値+1（超過する）の真偽。
- 既存のカテゴリ集計テストは不変のまま green を維持。
- `npm run test:ace-scripts`（vitest）が green。
- `npm run quality:local` が通る。

## スコープ外（YAGNI）

- `quality:local` への行数チェック組み込みはしない（既存のカテゴリ件数チェックも組み込まれておらず、整合を保つ）。
- 行数超過での**ブロック**（exit 1 化）はしない。必要になれば別 Issue で 2 段階閾値（soft/hard）化を検討。
- PLAYBOOK.md **以外**のファイルへの一般化はしない（対象は Playbook 1 ファイル）。
- スクリプトの**リネーム**はしない（責務拡張は doc コメント/README で明示）。
- 個人グローバル設定 `~/.claude/CLAUDE.md`（本リポジトリ外のため触らない）。

## 受け入れ条件

- [ ] `check-category-size.ts` が総行数を常に報告する
- [ ] 総行数 > `ACE_MAX_PLAYBOOK_LINES`（既定 800）で警告を出すが exit code を変えない
- [ ] `ACE_MAX_PLAYBOOK_LINES` の無効値は既定値フォールバック＋stderr 警告
- [ ] `countPlaybookLines` のユニットテスト（カウント正確性・境界値）が green
- [ ] カテゴリ件数ゲート（exit 1）の既存挙動が不変
- [ ] `ace-curate.md` / `ace-autonomous.md` / `ace/README.md` が行数チェックと整合
- [ ] `npm run quality:local` が pass
