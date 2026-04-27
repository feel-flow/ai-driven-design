---
name: code-review-standards
description: >-
  Enforces project coding standards during code review: naming conventions
  (PascalCase for classes, camelCase for methods/variables, UPPER_SNAKE_CASE
  for constants, kebab-case for files), standard file structure, anti-magic-number
  policy, file size limits (500/800 lines), security patterns, and design patterns.
  Use when reviewing code, writing new code, or checking adherence to project conventions.
metadata:
  version: "1.0.0"
  author: feel-flow
  tags: "coding-standards, naming-conventions, anti-magic-number, security, design-patterns"
  references: "docs-template/03-implementation/PATTERNS.md, docs-template/MASTER.md"
---

# コードレビュー基準

プロジェクトのコーディング規約に基づいてコードレビューを実施するためのスキル。
PATTERNS.md および MASTER.md で定義された基準を適用する。

## 1. 命名規則

| 要素             | パターン              | 例                |
| ---------------- | --------------------- | ----------------- |
| クラス           | PascalCase            | `UserService`     |
| インターフェース | PascalCase + I prefix | `IUserRepository` |
| メソッド         | camelCase             | `getUserById()`   |
| 変数             | camelCase             | `userName`        |
| 定数             | UPPER_SNAKE_CASE      | `MAX_RETRY_COUNT` |
| ファイル         | kebab-case            | `user-service.ts` |

## 2. ファイル構造の標準パターン

すべてのファイルは以下の順序で構成すること：

```typescript
// 1. imports
import { Injectable } from "@nestjs/common";

// 2. constants
const MAX_RETRY_COUNT = 3;

// 3. types/interfaces
interface UserData {
  id: string;
  name: string;
}

// 4. main class/function
@Injectable()
export class UserService {
  // implementation
}

// 5. exports
export { UserService, UserData };
```

## 3. マジックナンバー禁止（必須）

すべての意味のある数値・文字列は名前付き定数に抽出すること。これはプロジェクトの**必須ルール**。

```typescript
// ❌ 禁止: マジックナンバー
if (retryCount > 3) {
  throw new Error("Max retries exceeded");
}
setTimeout(callback, 30000);

// ✅ 正しい: 名前付き定数
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) {
  throw new Error("Max retries exceeded");
}

const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: 100,
} as const;
setTimeout(callback, API_CONFIG.TIMEOUT_MS);
```

定数は用途別にグループ化し、`as const` で型安全性を確保する。

## 4. ファイルサイズ制限

| 基準           | 行数  | アクション                               |
| -------------- | ----- | ---------------------------------------- |
| ソフトリミット | 500行 | 分割を検討                               |
| ハードリミット | 800行 | 分割を実施（生成コード・スキーマは例外） |

800行を超えるファイルは、責務の分離を基準に複数ファイルに分割する。

## 5. セキュリティパターン

レビュー時に以下を確認すること：

- **入力サニタイゼーション**: ユーザー入力は必ずサニタイズ（HTML エスケープ、特殊文字除去）
- **パラメタライズドクエリ**: SQL は文字列結合ではなくプレースホルダーを使用
- **認証ミドルウェア**: JWT トークンの検証は専用ミドルウェアで実施
- **認可チェック**: ロールベースのアクセス制御をデコレーターまたはガードで実装

```typescript
// ✅ パラメタライズドクエリ
const data = await db.query("SELECT * FROM users WHERE id = ?", [id]);

// ❌ 文字列結合（SQLインジェクション脆弱性）
const data = await db.query(`SELECT * FROM users WHERE id = '${id}'`);
```

## 6. デザインパターン

プロジェクトで推奨されるデザインパターン：

| パターン   | 用途                                           |
| ---------- | ---------------------------------------------- |
| Repository | データアクセスの抽象化（インターフェース経由） |
| Factory    | 型に基づくオブジェクト生成の一元化             |
| Singleton  | 設定マネージャー等の単一インスタンス管理       |
| Decorator  | キャッシング、認証、ロール検証の横断的関心事   |

## 7. 禁止事項チェックリスト

コードレビュー時に以下が含まれていないか確認する：

- [ ] `any` 型の使用（型安全性の喪失）
- [ ] `console.log` の本番コードへの残存（構造化ログを使用）
- [ ] マジックナンバー・ハードコード値
- [ ] 未使用の import 文
- [ ] サイレントなエラー握りつぶし（空の catch ブロック）
- [ ] 文字列結合による SQL クエリ構築
- [ ] 非 null アサーション（`!`）の無条件使用
- [ ] テストのない新規ビジネスロジック
