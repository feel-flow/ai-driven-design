---
title: "Implementation skeleton templates"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# 実装雛形（Skeleton templates）

> **Origin**: [DECISION_TREE.md](../DECISION_TREE.md)（配置判断）と連動する **Layer 2** ガードレール（[feel-flow/ai-spec-driven-development#370](https://github.com/feel-flow/ai-spec-driven-development/issues/370)）

## 目的

- AI や人が **新規ファイルを追加するときのコピー元** を固定し、スパゲッティ化（境界の漏れ・責務の混在）を防ぐ。
- **言語非依存のルール**（宣言・TODO・注意コメントの書き方）は全言語で共通とし、**中身の文法**は言語別ディレクトリに分離する。

## 言語非依存ポリシー（必ず守る）

1. **SKELETON 宣言**  
   各雛形ファイルの先頭に `SKELETON — do not import directly.`（または同等の一文）を置く。リポジトリに置いたまま `import` しない。

2. **`TODO:` の明示**  
   プロジェクト固有の型名・環境変数・エンドポイント・認可ルールなどは `TODO:` で示し、コピー後に置換する。

3. **既知の注意事項をコメントで内包**  
   例: ログ・例外メッセージでの **credential / PII のマスキング**、**外部 API ごとのステータスコード・レート制限の差**、**トランザクション境界** など。推測で実装せず「確認が必要」と書く。

4. **コピー運用**  
   本ディレクトリのファイルを **そのまま参照 import せず**、表「コピー先」のパスへコピーし、ファイル名から `.skeleton` を除いて使う（プロジェクトの命名規則に合わせてリネーム可）。

5. **Decision Tree との 1:1**  
   [DECISION_TREE.md](../DECISION_TREE.md) の Q1〜Q6 の各末端分岐に、下表の雛形が対応する。プロジェクト固有化で分岐を削ったら、未使用の雛形行も README から削除する。

## ディレクトリ構成

```text
templates/
├── README.md          # 本ファイル（方針・索引・表）
└── typescript/        # TypeScript 向け雛形（他言語は例: python/ を追加）
    └── *.skeleton.ts
```

他言語を追加する場合は `templates/<言語>/` を切り、本 README の表に列を足す。SQL など実行言語と異なる補助雛形は、関連する実装言語ディレクトリに同居させてもよい（例: TypeScript のリポジトリ変更と一緒に使う DDL 雛形）。

## コピー先 / 参考実装 / テスト追加先

> パスは [DECISION_TREE.md](../DECISION_TREE.md) のサンプル（Clean Architecture 風）に合わせた例。自プロジェクトでは DECISION_TREE と同時に書き換える。

| 分類 (Q)                     | 雛形ファイル（コピー元）                                                                                   | コピー先（例）                 | 参考実装の深さ                                     | テスト追加先（例）      |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------- | ----------------------- |
| Q1 HTTP クライアント         | [typescript/q1-http-api-client.skeleton.ts](./typescript/q1-http-api-client.skeleton.ts)                   | `infrastructure/clients/`      | **代表サンプル**（定数・Result・注意コメントあり） | `tests/infrastructure/` |
| Q1 DB                        | [typescript/q1-db-repository.skeleton.ts](./typescript/q1-db-repository.skeleton.ts)                       | `infrastructure/repositories/` | 標準                                               | `tests/infrastructure/` |
| Q1 メッセージキュー          | [typescript/q1-message-queue.skeleton.ts](./typescript/q1-message-queue.skeleton.ts)                       | `infrastructure/queues/`       | 標準                                               | `tests/infrastructure/` |
| Q1 ファイルストレージ        | [typescript/q1-file-storage.skeleton.ts](./typescript/q1-file-storage.skeleton.ts)                         | `infrastructure/storage/`      | 標準                                               | `tests/infrastructure/` |
| Q2 REST                      | [typescript/q2-rest-controller.skeleton.ts](./typescript/q2-rest-controller.skeleton.ts)                   | `interfaces/controllers/`      | 標準                                               | `tests/interfaces/`     |
| Q2 GraphQL                   | [typescript/q2-graphql-resolver.skeleton.ts](./typescript/q2-graphql-resolver.skeleton.ts)                 | `interfaces/resolvers/`        | 標準                                               | `tests/interfaces/`     |
| Q2 WebSocket                 | [typescript/q2-websocket-handler.skeleton.ts](./typescript/q2-websocket-handler.skeleton.ts)               | `interfaces/websockets/`       | 標準                                               | `tests/interfaces/`     |
| Q3 ユースケース              | [typescript/q3-use-case.skeleton.ts](./typescript/q3-use-case.skeleton.ts)                                 | `application/use-cases/`       | 標準                                               | `tests/application/`    |
| Q3 ジョブ                    | [typescript/q3-background-job.skeleton.ts](./typescript/q3-background-job.skeleton.ts)                     | `application/jobs/`            | 標準                                               | `tests/application/`    |
| Q4 DB スキーマ（DDL）        | [typescript/q4-forward-migration.skeleton.sql](./typescript/q4-forward-migration.skeleton.sql)             | `migrations/*.sql`             | SQL の forward migration 用                        | `tests/migrations/`     |
| Q4 DB スキーマ（リポジトリ） | [typescript/q4-migration-and-repository.skeleton.ts](./typescript/q4-migration-and-repository.skeleton.ts) | `infrastructure/repositories/` | マッピング変更の着手メモ                           | `tests/infrastructure/` |
| Q4 キャッシュ                | [typescript/q4-cache.skeleton.ts](./typescript/q4-cache.skeleton.ts)                                       | `infrastructure/cache/`        | 標準                                               | `tests/infrastructure/` |
| Q5 エンティティ              | [typescript/q5-entity.skeleton.ts](./typescript/q5-entity.skeleton.ts)                                     | `domain/entities/`             | 標準                                               | `tests/domain/`         |
| Q5 値オブジェクト            | [typescript/q5-value-object.skeleton.ts](./typescript/q5-value-object.skeleton.ts)                         | `domain/value-objects/`        | 標準                                               | `tests/domain/`         |
| Q5 ドメインサービス          | [typescript/q5-domain-service.skeleton.ts](./typescript/q5-domain-service.skeleton.ts)                     | `domain/services/`             | 標準                                               | `tests/domain/`         |
| Q6 認証                      | [typescript/q6-auth.skeleton.ts](./typescript/q6-auth.skeleton.ts)                                         | `shared/auth/`                 | 標準                                               | `tests/shared/`         |
| Q6 ロギング                  | [typescript/q6-logging.skeleton.ts](./typescript/q6-logging.skeleton.ts)                                   | `shared/logging/`              | 標準                                               | `tests/shared/`         |
| Q6 エラー                    | [typescript/q6-errors.skeleton.ts](./typescript/q6-errors.skeleton.ts)                                     | `shared/errors/`               | 標準                                               | `tests/shared/`         |
| Q6 ユーティリティ            | [typescript/q6-utils.skeleton.ts](./typescript/q6-utils.skeleton.ts)                                       | `shared/utils/`                | 標準                                               | `tests/shared/`         |

## 関連ドキュメント

- [DECISION_TREE.md](../DECISION_TREE.md) — 配置判断の本体
- [PATTERNS.md](../PATTERNS.md) — 実装パターン（セクション 11 が索引）
- [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md) — レイヤー・コンポーネントの SSOT

## Changelog

### [1.0.0] - YYYY-MM-DD

- 初版（Layer 2: Skeleton テンプレ、`#370`）
