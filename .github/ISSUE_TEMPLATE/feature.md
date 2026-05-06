---
name: 新機能追加
about: 新しい機能を追加する
title: 'feat: '
labels: enhancement
assignees: ''
---

## 概要

[この機能が何を実現するか、1〜2文で説明]

## 背景

[なぜこの機能が必要か、ビジネス上の理由]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: MASTER, ARCHITECTURE, DOMAIN

- [ ] [MASTER.md](../../docs-template/MASTER.md)
- [ ] [ARCHITECTURE.md#該当セクション](../../docs-template/02-design/ARCHITECTURE.md)
- [ ] [DOMAIN.md#該当セクション](../../docs-template/02-design/DOMAIN.md)

> **推奨参照**: PATTERNS, TESTING

- [ ] [PATTERNS.md](../../docs-template/03-implementation/PATTERNS.md)
- [ ] [TESTING.md](../../docs-template/04-quality/TESTING.md)

## 関連Issue

- #XX [関連機能の説明]

## 6 観点フレームワーク（仮定を排除する）

> 書籍 第2章「AIが苦手なのは"コーディング"ではなく"心を読むこと"」より。AI 実装に着手する前に、この 6 観点が **すべて言語化されている**ことを確認する。1 つでも空欄のまま渡すと AI は「もっともらしい仮定」で穴埋めしてしまい、後工程で手戻りが発生する。

- [ ] **What（何を作る）**: 実現する機能の対象範囲
- [ ] **How（どう実現する）**: 採用するアプローチ／アルゴリズム／既存パターン
- [ ] **Where（どこに配置する）**: ファイル・モジュール・レイヤー
- [ ] **Constraint（制約は何か）**: 性能・互換性・依存関係・禁止事項
- [ ] **Format（入出力の形式は）**: 引数・戻り値・スキーマ・エラー型
- [ ] **Test（どう検証する）**: ユニット／統合／手動の判定基準

## 受け入れ基準

- [ ] [具体的な動作1]
- [ ] [具体的な動作2]
- [ ] [具体的な動作3]

## 技術的制約

- [使用すべきライブラリ/パターン]
- [既存コードとの接続点]
- [パフォーマンス要件]

## スコープ外（今回は対象外）

> **通常不要**: DEPLOYMENT

- DEPLOYMENT.md（インフラ変更なし）
- [その他、今回やらないこと]

## その他

[補足情報があれば]
