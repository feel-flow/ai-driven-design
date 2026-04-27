# API.md - API設計書

## 1. API概要

### API基本情報

- **バージョン**: v1.0.0
- **ベースURL**: `https://api.example.com/v1`
- **プロトコル**: HTTPS
- **データ形式**: JSON
- **文字コード**: UTF-8

### API設計原則

- RESTfulアーキテクチャに準拠
- リソース指向設計
- ステートレス通信
- 統一されたインターフェース

## 2. 認証・認可

### 認証方式

```http
Authorization: Bearer {jwt_token}
```

### トークン仕様

```json
{
  "sub": "user_id",
  "iat": 1516239022,
  "exp": 1516242622,
  "scope": ["read", "write"],
  "roles": ["user", "admin"]
}
```

### スコープ定義

| スコープ | 権限     | 説明                       |
| -------- | -------- | -------------------------- |
| read     | 読み取り | リソースの参照のみ         |
| write    | 書き込み | リソースの作成・更新・削除 |
| admin    | 管理者   | システム管理操作           |

## 3. エンドポイント一覧

### ユーザー管理

#### GET /users

ユーザー一覧取得

**リクエスト**

```http
GET /users?page=1&limit=20&sort=created_at&order=desc
```

**パラメータ**

| 名前  | 型      | 必須 | 説明                                  |
| ----- | ------- | ---- | ------------------------------------- |
| page  | integer | No   | ページ番号（デフォルト: 1）           |
| limit | integer | No   | 取得件数（デフォルト: 20、最大: 100） |
| sort  | string  | No   | ソートキー                            |
| order | string  | No   | ソート順（asc/desc）                  |

**レスポンス**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "username": "john_doe",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

#### GET /users/{id}

ユーザー詳細取得

**レスポンス**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "john_doe",
  "profile": {
    "first_name": "John",
    "last_name": "Doe",
    "avatar_url": "https://example.com/avatar.jpg"
  },
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-15T00:00:00Z"
}
```

#### POST /users

ユーザー作成

**リクエスト**

```json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "SecurePassword123!",
  "profile": {
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**レスポンス**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "john_doe",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### PUT /users/{id}

ユーザー更新

#### DELETE /users/{id}

ユーザー削除

### 注文管理

#### POST /orders

注文作成

**リクエスト**

```json
{
  "items": [
    {
      "product_id": "prod_001",
      "quantity": 2,
      "price": 29.99
    }
  ],
  "shipping_address": {
    "street": "123 Main St",
    "city": "Tokyo",
    "postal_code": "100-0001"
  },
  "payment_method": "credit_card"
}
```

## 4. 共通仕様

### HTTPステータスコード

| コード | 意味                  | 使用場面             |
| ------ | --------------------- | -------------------- |
| 200    | OK                    | 正常処理完了         |
| 201    | Created               | リソース作成成功     |
| 204    | No Content            | 削除成功             |
| 400    | Bad Request           | リクエスト不正       |
| 401    | Unauthorized          | 認証エラー           |
| 403    | Forbidden             | 権限エラー           |
| 404    | Not Found             | リソース不存在       |
| 409    | Conflict              | 競合エラー           |
| 422    | Unprocessable Entity  | バリデーションエラー |
| 429    | Too Many Requests     | レート制限           |
| 500    | Internal Server Error | サーバーエラー       |

### エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ],
    "request_id": "req_abc123",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### ページネーション

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  },
  "links": {
    "first": "/users?page=1&limit=20",
    "prev": null,
    "next": "/users?page=2&limit=20",
    "last": "/users?page=5&limit=20"
  }
}
```

## 5. レート制限

### 制限ルール

| エンドポイント | 制限 | 期間  | ヘッダー              |
| -------------- | ---- | ----- | --------------------- |
| 全体           | 1000 | 1時間 | X-RateLimit-Limit     |
| POST /users    | 10   | 1時間 | X-RateLimit-Remaining |
| POST /orders   | 100  | 1時間 | X-RateLimit-Reset     |

### レート制限レスポンス

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995200
Retry-After: 3600
```

## 6. WebSocket API

### 接続エンドポイント

```
wss://api.example.com/ws
```

### イベント仕様

```json
{
  "event": "order.updated",
  "data": {
    "order_id": "ord_123",
    "status": "shipped"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 7. GraphQL API

### エンドポイント

```
POST /graphql
```

### スキーマ例

```graphql
type User {
  id: ID!
  email: String!
  username: String!
  orders: [Order!]!
}

type Query {
  user(id: ID!): User
  users(page: Int, limit: Int): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
}
```

## 8. バージョニング

### バージョン管理方針

- URLパスでのバージョン指定: `/v1/`, `/v2/`
- 後方互換性の維持: 最低6ヶ月
- 非推奨通知: ヘッダー `X-API-Deprecation-Date`

### バージョン間の差異

| バージョン | 変更内容           | リリース日 | サポート終了日 |
| ---------- | ------------------ | ---------- | -------------- |
| v1         | 初回リリース       | 2024-01-01 | 2025-01-01     |
| v2         | レスポンス構造変更 | 2024-07-01 | -              |

## 9. セキュリティ

### CORS設定

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

### セキュリティヘッダー

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## 10. 開発者向け情報

### SDKs

- JavaScript: `npm install @example/api-sdk`
- Python: `pip install example-api-sdk`
- Ruby: `gem install example-api-sdk`

### APIドキュメント

- Swagger UI: <https://api.example.com/docs>
- OpenAPI仕様: <https://api.example.com/openapi.json>

### サンドボックス環境

- URL: <https://sandbox.api.example.com/v1>
- 認証: APIキー（ダッシュボードで発行）
