---
title: "Obsidian有効性評価"
version: "1.0.0"
status: "draft"
owner: "Development Team"
created: "2026-05-07"
updated: "2026-05-07"
changeImpact: "MEDIUM"
---

# Obsidian有効性評価

この文書は、Issue #311 の実装完了確認と、Obsidianをナレッジベースとして継続採用する価値を評価するための運用基準を定義します。

## 目的

- Obsidian統合が「導入済み」だけでなく「実際に有効」かを判断可能にする
- 継続運用・改善・停止の意思決定を定量/定性データで行う
- 週次で同じ方法で測定し、時系列で比較可能にする

## スコープ

- 対象ディレクトリ: `docs-template/`
- 対象運用: `obsidian:sync` CLI、MCP Obsidianツール、Husky post-mergeフック
- 評価期間: 2週間（1サイクル）

## Issue #311 実装差分チェック

| 要件                                                                      | 実装状況             | 根拠                                             |
| ------------------------------------------------------------------------- | -------------------- | ------------------------------------------------ |
| Obsidian Vault設定（標準Markdownリンク）                                  | 実装済み             | `docs-template/.obsidian/app.json`               |
| 推奨プラグイン設定                                                        | 実装済み             | `docs-template/.obsidian/community-plugins.json` |
| MCP Obsidian拡張                                                          | 実装済み             | `mcp/src/obsidian/`                              |
| MCPツール公開（backlinks/validate_links/update_backlinks/orphaned_files） | 実装済み             | `mcp/src/index.ts`                               |
| CLIスクリプト（backlinks/validate/report）                                | 実装済み             | `scripts/obsidian-sync.mjs`                      |
| Husky post-mergeフック設定                                                | 実装済み             | `scripts/setup-obsidian-hook.sh`                 |
| 運用ドキュメント（ガイド）                                                | 実装済み             | `docs-template/08-knowledge/OBSIDIAN_GUIDE.md`   |
| 有効性評価基準                                                            | 未整備 -> 本書で整備 | 本ドキュメント                                   |

## 評価指標（4軸）

### 1. 構造品質（Structure Quality）

- `壊れたリンク率` = `brokenLinks / totalLinks`
- `孤立ファイル率` = `orphanedFiles / totalFiles`

判定基準:

- 壊れたリンク率: `0.00%`（常時ゼロを維持）
- 孤立ファイル率: `5.00%` 以下

### 2. 探索性（Discoverability）

- `ドキュメント到達時間`: 代表5タスクで目的情報まで到達する時間（秒）
- `関連情報発見率`: 到達時に関連文書まで辿れた割合

判定基準:

- 平均到達時間: `90` 秒以下
- 関連情報発見率: `80.00%` 以上

### 3. 保守効率（Maintenance Efficiency）

- `手作業削減時間` = （導入前想定作業時間 - 現行作業時間）
- `自動更新成功率` = `成功した更新回数 / 更新実行回数`

判定基準:

- 週あたり削減時間: `30` 分以上
- 自動更新成功率: `95.00%` 以上

### 4. 利用定着（Adoption）

- `Obsidian経由更新回数/週`
- `Obsidian未使用週の有無`

判定基準:

- 更新回数: 週 `3` 回以上
- 連続未使用: `0` 週

## 測定手順（週次）

1. リンク品質を測定する

```bash
npm run obsidian:sync -- validate
npm run obsidian:sync -- report
npm run obsidian:sync -- orphaned
```

2. 探索性テストを実施する

- 固定した5タスクで到達時間を計測
- 関連文書に到達できたかを記録

3. 保守効率を記録する

- バックリンク更新前後の手作業時間を記録
- Husky post-merge 実行時の成功/失敗を記録

4. 利用定着を記録する

- 週内のObsidian経由更新回数を記録
- 使わなかった理由（任意）をメモ

## 週次ログテンプレート

以下をコピーして `08-knowledge/OBSIDIAN_EVALUATION_LOG.md` 等に追記します。

```markdown
## YYYY-MM-DD 週次評価

### 1) 構造品質

- totalFiles:
- totalLinks:
- brokenLinks:
- orphanedFiles:
- 壊れたリンク率:
- 孤立ファイル率:

### 2) 探索性（5タスク平均）

- 平均到達時間（秒）:
- 関連情報発見率:
- 詰まったポイント:

### 3) 保守効率

- backlink更新作業時間（分）:
- 手作業削減時間（分）:
- 自動更新成功率:

### 4) 利用定着

- Obsidian経由更新回数:
- 未使用日数:
- コメント:

### 判定

- 継続 / 改善 / 停止:
- 根拠:
- 次アクション:
```

## 最終判定テンプレート（2週間サイクル終了時）

```markdown
# Obsidian有効性判定（YYYY-MM-DD）

## 結論

- 判定: 継続 / 改善 / 停止

## 指標サマリー

- 構造品質:
- 探索性:
- 保守効率:
- 利用定着:

## 根拠

- 達成できた基準:
- 未達の基準:
- 主要な阻害要因:

## 次アクション

- 継続の場合: 現行運用を維持
- 改善の場合: 改善Issueを起票して実施
- 停止の場合: 自動化運用を終了し、代替運用へ移行
```

## 改善Issueの起票ルール

- 評価結果が「改善」の場合は、現在Issueにスコープを追加しない
- 必ず新規Issueを起票し、改善内容を分離する
- 本文書にはIssue番号のみ追記し、実装詳細はIssue側に持つ

## 更新履歴

| 日付       | バージョン | 変更内容                                                       |
| ---------- | ---------- | -------------------------------------------------------------- |
| 2026-05-07 | 1.0.0      | 初版作成（Issue #311 実装差分チェック + 有効性評価基準を定義） |
