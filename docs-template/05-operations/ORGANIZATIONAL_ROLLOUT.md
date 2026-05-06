---
title: "ORGANIZATIONAL_ROLLOUT"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-05-06"
updated: "2026-05-06"
---

# ORGANIZATIONAL_ROLLOUT.md - 組織展開ガイド

> **📏 ドキュメント最適化**: このファイルは索引です（200〜300 行を目標）。詳細は `organizational-rollout/` 配下の各ファイルを参照してください。

## 📖 この索引の対象範囲

書籍 第15章「チーム標準化」・第16章「ロードマップとナレッジ蓄積」で示されている、AI 仕様駆動開発フレームワークを **既存組織・チームに展開するための 4 つの運用ガイド** を扱います。

| ガイド                                                                  | 対象                                                | 推奨読み順     |
| ----------------------------------------------------------------------- | --------------------------------------------------- | -------------- |
| [phased-rollout.md](./organizational-rollout/phased-rollout.md)         | 段階導入のフェーズ定義（Phase 1〜4）                | ⭐⭐⭐⭐⭐ 1st |
| [document-splitting.md](./organizational-rollout/document-splitting.md) | 文書分割の閾値（500/800/1200 行）と手順             | ⭐⭐⭐⭐ 2nd   |
| [archive-strategy.md](./organizational-rollout/archive-strategy.md)     | 古い文書の退避（`archive/` への移動・リダイレクト） | ⭐⭐⭐ 3rd     |
| [health-check.md](./organizational-rollout/health-check.md)             | 月次ヘルスチェック（4 項目・所要 30〜60 分）        | ⭐⭐⭐⭐ 4th   |

## 🚀 30 秒で全体像

```text
[Phase 1: MASTER.md のみ]      ← 1 週間
       ↓
[Phase 2: + Issue テンプレート] ← 2 週間
       ↓
[Phase 3: + 残り 6 文書]        ← 1 ヶ月
       ↓
[Phase 4: + 自動チェック]       ← 1 ヶ月
       ↓
[毎月: ヘルスチェック]          ← 30〜60 分/月
       ↓
   ┌── サイズ超過 → 分割（document-splitting.md）
   ├── 6 ヶ月参照なし → アーカイブ（archive-strategy.md）
   └── 孤立検出 → リンク追加 or アーカイブ
```

## 🎯 主要数値（書籍 第14章準拠）

各ガイドで参照する閾値を、ここで一元管理します。**新規文書および分割判断は本値を SSOT** とし、他文書（MASTER.md 等）に異なる値の記述があれば順次同期してください。

### 文書分割の閾値

| 行数      | 判断           | 詳細リンク                                                              |
| --------- | -------------- | ----------------------------------------------------------------------- |
| 〜 500 行 | 適正           | -                                                                       |
| 500 行超  | 分割を検討     | [document-splitting.md](./organizational-rollout/document-splitting.md) |
| 800 行超  | 分割を推奨     | [document-splitting.md](./organizational-rollout/document-splitting.md) |
| 1200 行超 | **分割を必須** | [document-splitting.md](./organizational-rollout/document-splitting.md) |

### アーカイブ判定

| 条件             | 詳細リンク                                                          |
| ---------------- | ------------------------------------------------------------------- |
| 6 ヶ月参照なし   | [archive-strategy.md](./organizational-rollout/archive-strategy.md) |
| 技術的陳腐化     | [archive-strategy.md](./organizational-rollout/archive-strategy.md) |
| 別文書に統合済み | [archive-strategy.md](./organizational-rollout/archive-strategy.md) |

### 月次ヘルスチェック 4 項目

1. MASTER.md からの参照確認
2. ファイルサイズ確認（上記閾値）
3. 鮮度確認（6 ヶ月以上更新なし）
4. 孤立文書の確認

詳細手順: [health-check.md](./organizational-rollout/health-check.md)

## ⚠️ 段階導入で **やってはいけない** こと

| アンチパターン                        | 影響                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| Phase 1〜4 を同時並行で進める         | チームが疲弊し、運用が頓挫する                            |
| ドキュメントを「完璧にしてから」公開  | 80% で公開し運用しながら直す。未完非公開は最大の負債      |
| Phase 4 の自動化を Phase 1 から始める | lint 対象がない状態で導入してもノイズしか出ない           |
| サイズ超過を見て見ぬふり              | 1500 行超になると AI も人間もレビュー困難。早期分割が安価 |
| 古い文書を削除する                    | 履歴と決定根拠を失う。**アーカイブして残す**              |

## 🔗 関連ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 運用全体の索引（PR・CI/CD・モニタリング等）
- [GETTING_STARTED_NEW_PROJECT.md](../GETTING_STARTED_NEW_PROJECT.md) - 新規プロジェクト立ち上げ時のガイド
- [MASTER.md](../MASTER.md) - プロジェクト中央索引（本ガイドの上位）
- [DECISION_MATRIX.md](../06-reference/DECISION_MATRIX.md) - どの文書に書くかの判断マトリクス

## 📝 この索引の運用ルール

- 子ガイドの数値・手順を **この索引にコピペしない**（DRY 違反）。
- 子で章追加・閾値変更があった場合、本索引の **「主要数値」表のみ** 同期する。
- 子の追加・削除時は本索引の表に反映する。
- 索引の総行数は **300 行以内** を維持する（[document-splitting.md](./organizational-rollout/document-splitting.md) 親文書ガイドラインに準拠）。
