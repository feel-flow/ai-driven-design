---
title: "DECISION_TREE"
version: "1.1.0"
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

### 分岐と雛形ファイル（Layer 2）

新規コードの配置が決まったら、[templates/README.md](./templates/README.md) の方針に従い **雛形をコピーしてから** 実装する。各末端分岐と雛形（現状は TypeScript / SQL 例）の対応は次のとおり。

| ツリー上の分岐                       | 雛形ファイル                                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Q1 — HTTP API クライアント           | [templates/typescript/q1-http-api-client.skeleton.ts](./templates/typescript/q1-http-api-client.skeleton.ts)                   |
| Q1 — DB アクセス                     | [templates/typescript/q1-db-repository.skeleton.ts](./templates/typescript/q1-db-repository.skeleton.ts)                       |
| Q1 — メッセージキュー                | [templates/typescript/q1-message-queue.skeleton.ts](./templates/typescript/q1-message-queue.skeleton.ts)                       |
| Q1 — ファイルストレージ              | [templates/typescript/q1-file-storage.skeleton.ts](./templates/typescript/q1-file-storage.skeleton.ts)                         |
| Q2 — REST ルート                     | [templates/typescript/q2-rest-controller.skeleton.ts](./templates/typescript/q2-rest-controller.skeleton.ts)                   |
| Q2 — GraphQL リゾルバ                | [templates/typescript/q2-graphql-resolver.skeleton.ts](./templates/typescript/q2-graphql-resolver.skeleton.ts)                 |
| Q2 — WebSocket                       | [templates/typescript/q2-websocket-handler.skeleton.ts](./templates/typescript/q2-websocket-handler.skeleton.ts)               |
| Q3 — 業務フロー（ユースケース）      | [templates/typescript/q3-use-case.skeleton.ts](./templates/typescript/q3-use-case.skeleton.ts)                                 |
| Q3 — バックグラウンドジョブ          | [templates/typescript/q3-background-job.skeleton.ts](./templates/typescript/q3-background-job.skeleton.ts)                     |
| Q4 — DB スキーマ変更（DDL）          | [templates/typescript/q4-forward-migration.skeleton.sql](./templates/typescript/q4-forward-migration.skeleton.sql)             |
| Q4 — DB スキーマ変更（リポジトリ側） | [templates/typescript/q4-migration-and-repository.skeleton.ts](./templates/typescript/q4-migration-and-repository.skeleton.ts) |
| Q4 — セッション / キャッシュ         | [templates/typescript/q4-cache.skeleton.ts](./templates/typescript/q4-cache.skeleton.ts)                                       |
| Q5 — エンティティ                    | [templates/typescript/q5-entity.skeleton.ts](./templates/typescript/q5-entity.skeleton.ts)                                     |
| Q5 — 値オブジェクト                  | [templates/typescript/q5-value-object.skeleton.ts](./templates/typescript/q5-value-object.skeleton.ts)                         |
| Q5 — ドメインサービス                | [templates/typescript/q5-domain-service.skeleton.ts](./templates/typescript/q5-domain-service.skeleton.ts)                     |
| Q6 — 認証・認可                      | [templates/typescript/q6-auth.skeleton.ts](./templates/typescript/q6-auth.skeleton.ts)                                         |
| Q6 — ロギング・監視                  | [templates/typescript/q6-logging.skeleton.ts](./templates/typescript/q6-logging.skeleton.ts)                                   |
| Q6 — エラーハンドリング              | [templates/typescript/q6-errors.skeleton.ts](./templates/typescript/q6-errors.skeleton.ts)                                     |
| Q6 — ユーティリティ                  | [templates/typescript/q6-utils.skeleton.ts](./templates/typescript/q6-utils.skeleton.ts)                                       |

> Q0 で「ドキュメント」分岐に該当した場合、Section 3 の追加先チェックリストは適用しない（ドキュメント変更は該当文書を直接編集し、本ファイルの Changelog に記録）。

### 該当しない分岐の扱い

自プロジェクトに該当しない分岐（例: WebSocket を使わない場合の Q2、CLI のみで HTTP を持たない場合の Q2 全体）は、「4. プロジェクト固有化の手順」に従い **該当セクションごと削除** してよい。新しい分岐（例: CLI コマンド、Lambda ハンドラ）は同じ手順で追加可能。

## 3. 追加先チェックリスト

> 下表は本サンプル（Web API バックエンド）における Q1〜Q6 の末端分岐を例示する。自プロジェクト固有化時は、実際に残した分岐を網羅するよう行を追加・削除する。
> Q1〜Q6 を書き換えた場合は本表も同じ分類で更新する。

| 追加種別 (Q番号)             | 実装先                                         | 雛形（コピー元）                                                                                                                                                                                          | テスト追加先            | 必須ドキュメント更新       |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------- |
| 外部 API クライアント (Q1)   | `infrastructure/clients/`                      | [q1-http-api-client.skeleton.ts](./templates/typescript/q1-http-api-client.skeleton.ts)                                                                                                                   | `tests/infrastructure/` | ARCHITECTURE.md            |
| DB アクセス (Q1)             | `infrastructure/repositories/`                 | [q1-db-repository.skeleton.ts](./templates/typescript/q1-db-repository.skeleton.ts)                                                                                                                       | `tests/infrastructure/` | ARCHITECTURE.md            |
| メッセージキュー (Q1)        | `infrastructure/queues/`                       | [q1-message-queue.skeleton.ts](./templates/typescript/q1-message-queue.skeleton.ts)                                                                                                                       | `tests/infrastructure/` | ARCHITECTURE.md            |
| ファイルストレージ (Q1)      | `infrastructure/storage/`                      | [q1-file-storage.skeleton.ts](./templates/typescript/q1-file-storage.skeleton.ts)                                                                                                                         | `tests/infrastructure/` | ARCHITECTURE.md            |
| REST ルート (Q2)             | `interfaces/controllers/`                      | [q2-rest-controller.skeleton.ts](./templates/typescript/q2-rest-controller.skeleton.ts)                                                                                                                   | `tests/interfaces/`     | ARCHITECTURE.md            |
| GraphQL リゾルバ (Q2)        | `interfaces/resolvers/`                        | [q2-graphql-resolver.skeleton.ts](./templates/typescript/q2-graphql-resolver.skeleton.ts)                                                                                                                 | `tests/interfaces/`     | ARCHITECTURE.md            |
| WebSocket (Q2)               | `interfaces/websockets/`                       | [q2-websocket-handler.skeleton.ts](./templates/typescript/q2-websocket-handler.skeleton.ts)                                                                                                               | `tests/interfaces/`     | ARCHITECTURE.md            |
| ユースケース (Q3)            | `application/use-cases/`                       | [q3-use-case.skeleton.ts](./templates/typescript/q3-use-case.skeleton.ts)                                                                                                                                 | `tests/application/`    | ARCHITECTURE.md            |
| バックグラウンドジョブ (Q3)  | `application/jobs/`                            | [q3-background-job.skeleton.ts](./templates/typescript/q3-background-job.skeleton.ts)                                                                                                                     | `tests/application/`    | ARCHITECTURE.md            |
| DB スキーマ (Q4)             | `migrations/` + `infrastructure/repositories/` | [q4-forward-migration.skeleton.sql](./templates/typescript/q4-forward-migration.skeleton.sql) / [q4-migration-and-repository.skeleton.ts](./templates/typescript/q4-migration-and-repository.skeleton.ts) | `tests/migrations/`     | ARCHITECTURE.md, DOMAIN.md |
| セッション / キャッシュ (Q4) | `infrastructure/cache/`                        | [q4-cache.skeleton.ts](./templates/typescript/q4-cache.skeleton.ts)                                                                                                                                       | `tests/infrastructure/` | ARCHITECTURE.md            |
| エンティティ (Q5)            | `domain/entities/`                             | [q5-entity.skeleton.ts](./templates/typescript/q5-entity.skeleton.ts)                                                                                                                                     | `tests/domain/`         | DOMAIN.md                  |
| 値オブジェクト (Q5)          | `domain/value-objects/`                        | [q5-value-object.skeleton.ts](./templates/typescript/q5-value-object.skeleton.ts)                                                                                                                         | `tests/domain/`         | DOMAIN.md                  |
| ドメインサービス (Q5)        | `domain/services/`                             | [q5-domain-service.skeleton.ts](./templates/typescript/q5-domain-service.skeleton.ts)                                                                                                                     | `tests/domain/`         | DOMAIN.md                  |
| 認証・認可 (Q6)              | `shared/auth/`                                 | [q6-auth.skeleton.ts](./templates/typescript/q6-auth.skeleton.ts)                                                                                                                                         | `tests/shared/`         | ARCHITECTURE.md            |
| ロギング・監視 (Q6)          | `shared/logging/`                              | [q6-logging.skeleton.ts](./templates/typescript/q6-logging.skeleton.ts)                                                                                                                                   | `tests/shared/`         | ARCHITECTURE.md            |
| エラーハンドリング (Q6)      | `shared/errors/`                               | [q6-errors.skeleton.ts](./templates/typescript/q6-errors.skeleton.ts)                                                                                                                                     | `tests/shared/`         | ARCHITECTURE.md            |
| ユーティリティ (Q6)          | `shared/utils/`                                | [q6-utils.skeleton.ts](./templates/typescript/q6-utils.skeleton.ts)                                                                                                                                       | `tests/shared/`         | ARCHITECTURE.md            |

## 4. プロジェクト固有化の手順

本ファイルはあくまで **Web API バックエンドのサンプル** です。以下の手順で自プロジェクト向けに書き換えてください。

1. 本ファイルをコピーして自プロジェクトの `docs-template/03-implementation/DECISION_TREE.md` に配置
2. Q1〜Q6 の分岐内容（例: `infrastructure/clients/`）を自プロジェクトの実構成に書き換え
3. 該当しない分岐（例: WebSocket を使わない場合の Q2）は削除
4. 新しい分岐（例: CLI コマンド、Lambda ハンドラ）を追加
5. 「3. 追加先チェックリスト」表および [templates/README.md](./templates/README.md) の索引表も Q1〜Q6 と 1:1 対応させて更新
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

### [1.1.0] - YYYY-MM-DD

- Layer 2: `templates/` 雛形と分岐対応表を追加（feel-flow/ai-spec-driven-development#370）
- 追加先チェックリストに「雛形」列を追加し、Q1〜Q6 の末端分岐を網羅
