---
title: "DECISION_TREE"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

> ⚠️ **SAMPLE — テンプレートです**
> 本ファイルの Q1〜Q6 の分岐内容（Web API バックエンドの例）と追加先チェックリストは **あなたのプロジェクトに合わせて書き換え** てください。
> 書き換え手順は本ファイル「4. プロジェクト固有化の手順」を参照。

# 配置判断ガイド（Decision Tree）

> **Origin**: [PATTERNS.md](./PATTERNS.md) セクション 11（配置判断）
> **Related**: [ARCHITECTURE.md](../02-design/ARCHITECTURE.md) | [DOMAIN.md](../02-design/DOMAIN.md)

## 1. 適用シーン

新機能・新モジュール追加時の「どこに書くか」の判断に迷った場合、本ファイルを最初に参照する。

- **新規ファイル作成前**: 下記「優先順位ルール」に従って Q0 から評価
- **既存ファイル拡張時**: 既存ファイルがあればそれを優先、なければ Q0 から判断
- **レビュー時**: 配置妥当性の確認にも使用

### 優先順位ルール

AI は **Q0 から順に評価し、最初にヒットした分岐を採用** する。テンプレを自プロジェクト向けに書き換える際、新しい分岐が複数のカテゴリに跨がる場合は番号の若い Q に寄せる。

## 2. Decision Tree（Q0〜Q6）

```
Q0. 変更対象はコード？ドキュメント？
├─ ドキュメント → docs-template/ 配下の該当文書を更新
└─ コード → Q1 へ

Q1. 外部システムと通信する？（境界モジュール）
├─ HTTP API クライアント → infrastructure/clients/
├─ DB アクセス → infrastructure/repositories/
├─ メッセージキュー → infrastructure/queues/
├─ ファイルストレージ → infrastructure/storage/
└─ いずれでもない → Q2 へ

Q2. リクエスト入口？（HTTP エンドポイント）
├─ REST ルート → interfaces/controllers/
├─ GraphQL リゾルバ → interfaces/resolvers/
├─ WebSocket → interfaces/websockets/
└─ いずれでもない → Q3 へ

Q3. 複数コンポーネントを束ねる？（オーケストレーション）
├─ 業務フロー（複数ドメイン + リポジトリ組合せ）→ application/use-cases/
├─ バックグラウンドジョブ → application/jobs/
└─ いずれでもない → Q4 へ

Q4. 永続化・状態保持？
├─ DB スキーマ変更 → migrations/ + infrastructure/repositories/
├─ セッション / キャッシュ → infrastructure/cache/
└─ いずれでもない → Q5 へ

Q5. 単一責務のドメインモデル？
├─ エンティティ → domain/entities/
├─ 値オブジェクト → domain/value-objects/
├─ ドメインサービス → domain/services/
└─ いずれでもない → Q6 へ

Q6. 横断的関心事？（Cross-cutting）
├─ 認証・認可 → shared/auth/
├─ ロギング・監視 → shared/logging/
├─ エラーハンドリング → shared/errors/
└─ ユーティリティ → shared/utils/
```

> Q0 で「ドキュメント」分岐に該当した場合、Section 3 の追加先チェックリストは適用しない（ドキュメント変更は該当文書を直接編集し、本ファイルの Changelog に記録）。

### 該当しない分岐の扱い

自プロジェクトに該当しない分岐（例: WebSocket を使わない場合の Q2、CLI のみで HTTP を持たない場合の Q2 全体）は、「4. プロジェクト固有化の手順」に従い **該当セクションごと削除** してよい。新しい分岐（例: CLI コマンド、Lambda ハンドラ）は同じ手順で追加可能。

## 3. 追加先チェックリスト

> 下表は Q1〜Q6 の代表的な追加種別を例示する。自プロジェクト固有化時は、すべての分岐を網羅するよう行を追加・削除する。
> Q1〜Q6 を書き換えた場合は本表も同じ分類で更新する。

| 追加種別 (Q番号) | 実装先 | テスト追加先 | 必須ドキュメント更新 |
| --- | --- | --- | --- |
| 外部 API クライアント (Q1) | `infrastructure/clients/` | `tests/infrastructure/` | ARCHITECTURE.md |
| DB アクセス (Q1) | `infrastructure/repositories/` | `tests/infrastructure/` | ARCHITECTURE.md |
| REST ルート (Q2) | `interfaces/controllers/` | `tests/interfaces/` | ARCHITECTURE.md |
| ユースケース (Q3) | `application/use-cases/` | `tests/application/` | ARCHITECTURE.md |
| DB スキーマ (Q4) | `migrations/` | `tests/migrations/` | ARCHITECTURE.md, DOMAIN.md |
| エンティティ (Q5) | `domain/entities/` | `tests/domain/` | DOMAIN.md |
| 値オブジェクト (Q5) | `domain/value-objects/` | `tests/domain/` | DOMAIN.md |
| 認証ミドルウェア (Q6) | `shared/auth/` | `tests/shared/` | ARCHITECTURE.md |

> 📝 注: 「雛形」列は Layer 2（templates/ 導入）Issue で追加予定。

## 4. プロジェクト固有化の手順

本ファイルはあくまで **Web API バックエンドのサンプル** です。以下の手順で自プロジェクト向けに書き換えてください。

1. 本ファイルをコピーして自プロジェクトの `docs-template/03-implementation/DECISION_TREE.md` に配置
2. Q1〜Q6 の分岐内容（例: `infrastructure/clients/`）を自プロジェクトの実構成に書き換え
3. 該当しない分岐（例: WebSocket を使わない場合の Q2）は削除
4. 新しい分岐（例: CLI コマンド、Lambda ハンドラ）を追加
5. 「3. 追加先チェックリスト」表も Q1〜Q6 と 1:1 対応させて更新
6. 冒頭の `⚠️ SAMPLE` バナーを削除し、自プロジェクト固有のコンテキストに書き換え
7. Frontmatter の `owner` / `created` / `updated` および Changelog の `YYYY-MM-DD` を実値に置き換える

## 5. 参考実装

- [claude-trader PR #55](https://github.com/ai-zamurai/claude-trader/pull/55) — Python / 金融ドメインでの Decision Tree 適用例（パイロット）
- [claude-trader Issue #54](https://github.com/ai-zamurai/claude-trader/issues/54) — パイロット元議論

## Changelog

### 更新ルール

- `infrastructure/` `domain/` `application/` などの配置パスを変更した際は、必ず本ファイルの Q1〜Q6 とチェックリストを同時更新する
- 変更は Changelog に記録する

### [1.0.0] - YYYY-MM-DD

- 初版作成（feel-flow/ai-spec-driven-development#368）
