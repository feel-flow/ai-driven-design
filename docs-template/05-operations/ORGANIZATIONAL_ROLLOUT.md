---
title: "ORGANIZATIONAL_ROLLOUT"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-05-06"
updated: "2026-05-06"
---

# ORGANIZATIONAL_ROLLOUT.md - 組織展開ガイド

> **📏 ドキュメント最適化**: このファイルは索引です。300 行以内を維持してください（[document-splitting.md](./organizational-rollout/document-splitting.md) の親文書ガイドラインに準拠）。

## 📖 この索引の対象範囲

書籍 第14章「ドキュメント増加の管理戦略」および第15章「チーム標準化」を中心に、AI 仕様駆動開発フレームワークを **既存組織・チームに展開するための 4 つの運用ガイド** を扱います。第16章「ロードマップとナレッジ蓄積」のうちナレッジ管理の継続運用は、既存の [deployment/knowledge-management.md](./deployment/knowledge-management.md) に集約されています。

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

> **合計目安**: Phase 1〜4 で **9〜11 週（約 2.5 ヶ月）**。Phase 1=1 週・Phase 2=2 週・Phase 3=4 週・Phase 4=4 週の合算で、チーム規模や既存ドキュメント量により 1.5〜2 倍まで揺れる前提で計画してください（詳細: [phased-rollout.md](./organizational-rollout/phased-rollout.md)）。

## 🎯 主要数値（書籍 第14章準拠）

各カテゴリの **正本（SSOT）は子ガイド** に置きます。本索引は子ガイドへの誘導と 1 行サマリのみを掲載し、閾値の重複は持ちません。最新値・例外条件・判定フローは各リンク先を参照してください。

| 数値カテゴリ           | SSOT（子ガイド）                                                                                 | サマリ                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 文書分割の閾値         | [document-splitting.md](./organizational-rollout/document-splitting.md)                          | **500 / 800 / 1200 行** の三段階（検討 / 推奨 / 必須）              |
| アーカイブ判定         | [archive-strategy.md](./organizational-rollout/archive-strategy.md)                              | 6 ヶ月参照なし・陳腐化・統合済み・PoC 完了 のいずれか               |
| 月次ヘルスチェック項目 | [health-check.md](./organizational-rollout/health-check.md)                                      | 参照確認・サイズ確認・鮮度確認・孤立検出 の 4 項目（30〜60 分／月） |
| 段階導入のフェーズ定義 | [phased-rollout.md](./organizational-rollout/phased-rollout.md)（このカテゴリのみ本索引が SSOT） | 定義の正本（Phase 1〜4 の運用詳細は子で定義）                       |

## ⚠️ 段階導入で **やってはいけない** こと

| アンチパターン                        | 影響                                                      |
| ------------------------------------- | --------------------------------------------------------- |
| Phase 1〜4 を同時並行で進める         | チームが疲弊し、運用が頓挫する                            |
| ドキュメントを「完璧にしてから」公開  | 80% で公開し運用しながら直す。未完非公開は最大の負債      |
| Phase 4 の自動化を Phase 1 から始める | lint 対象がない状態で導入してもノイズしか出ない           |
| サイズ超過を見て見ぬふり              | 1200 行超になると AI も人間もレビュー困難。早期分割が安価 |
| 古い文書を削除する                    | 履歴と決定根拠を失う。**アーカイブして残す**              |

## 🔗 関連ドキュメント

- [DEPLOYMENT.md](./DEPLOYMENT.md) - **個別プロジェクトの運用フロー**（PR・CI/CD・モニタリング）。本ガイドは **組織横断のドキュメント運用** を扱い、住み分けは「コード・デプロイの運用＝DEPLOYMENT、ドキュメントの運用＝ORGANIZATIONAL_ROLLOUT」。
- [GETTING_STARTED_NEW_PROJECT.md](../GETTING_STARTED_NEW_PROJECT.md) - 新規プロジェクト立ち上げ時のガイド（**注**: 同名の Phase 0〜4 を扱うが、本ガイドの組織展開 Phase 1〜4 とは別概念）。
- [MASTER.md](../MASTER.md) - プロジェクト中央索引（本ガイドの上位）
- [DECISION_MATRIX.md](../06-reference/DECISION_MATRIX.md) - どの文書に書くかの判断マトリクス

## 📝 この索引の運用ルール

- 子ガイドの数値・手順を **この索引にコピペしない**（DRY 違反）。
- 子で章追加・閾値変更があった場合、本索引の **「主要数値」表のみ** 同期する。
- 子の追加・削除時は本索引の表に反映する。
- 索引の総行数は **300 行以内** を維持する（[document-splitting.md](./organizational-rollout/document-splitting.md) 親文書ガイドラインに準拠）。
