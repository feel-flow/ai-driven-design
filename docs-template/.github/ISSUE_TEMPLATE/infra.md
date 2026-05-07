---
name: インフラ変更
about: インフラ・デプロイ設定の変更
title: "infra: "
labels: infrastructure
assignees: ""
---

## 概要

[インフラ変更の目的を1〜2文で説明]

## 背景

[なぜこの変更が必要か]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: MASTER, DEPLOYMENT

- [ ] [MASTER.md](../../MASTER.md)
- [ ] [DEPLOYMENT.md](../../05-operations/DEPLOYMENT.md)

> **推奨参照**: ARCHITECTURE

- [ ] [ARCHITECTURE.md#インフラ](../../02-design/ARCHITECTURE.md)

## 関連Issue

- #XX [関連する過去のインフラ変更]

## 変更内容

- [ ] CI/CD パイプライン
- [ ] 環境変数
- [ ] Docker設定
- [ ] Kubernetes設定
- [ ] クラウドリソース
- [ ] 監視・アラート設定
- [ ] その他: [内容]

## 対象環境

- [ ] 開発環境
- [ ] ステージング環境
- [ ] 本番環境

## 対象ファイル

- `.github/workflows/xxx.yml`
- `docker-compose.yml`
- [その他]

## 受け入れ基準

- [ ] [具体的な確認項目1]
- [ ] [具体的な確認項目2]

## スコープ外（今回は参照不要）

> **通常不要**: DOMAIN

- DOMAIN.md（ビジネスロジックの変更なし）
- PATTERNS.md（アプリケーションコードの変更なし）

## ロールバック手順

[問題が発生した場合の切り戻し方法]

## リスク

- [想定されるリスク]
- [影響範囲]
