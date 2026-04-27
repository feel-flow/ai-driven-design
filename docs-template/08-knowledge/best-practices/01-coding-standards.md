# コーディング規約

> **Parent**: [BEST_PRACTICES.md](../BEST_PRACTICES.md)

この文書は、TypeScript、Database、API設計に関する重要なコーディング規約をまとめています。AIが一貫性のある高品質なコードを生成できるよう、必須ルールと基本パターンを記載しています。

---

## 目次

- [TypeScript規約](#typescript規約)
- [データベース規約](#データベース規約)
- [API設計規約](#api設計規約)

---

## TypeScript規約

### 型安全性の確保

**推奨**:

```typescript
// 厳密な型定義
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// 型ガードの使用
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    "email" in obj
  );
}

// ジェネリクスの活用
class Repository<T> {
  async findById(id: string): Promise<T | null> {
    // 実装
  }
}
```

**避けるべき**:

- `any`型の使用
- 型アサーション (`as`) の乱用
- 型チェックの省略

### エラーハンドリング

**推奨: Resultパターン**

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function createUser(userData: CreateUserRequest): Promise<Result<User>> {
  try {
    const user = await userService.create(userData);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
```

**カスタムエラークラス**:

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

**避けるべき**:

- エラーの無視 (空の`catch`ブロック)
- 汎用的なエラーメッセージ (`'Something went wrong'`)
- エラー情報の損失

---

## データベース規約

### クエリの最適化

**推奨**:

```sql
-- インデックスの活用
CREATE INDEX CONCURRENTLY idx_users_email_active
ON users(email) WHERE active = true;

-- 適切なJOINの使用
SELECT u.id, u.name, p.title
FROM users u
INNER JOIN posts p ON u.id = p.user_id
WHERE u.active = true
  AND p.published_at > NOW() - INTERVAL '30 days';

-- パラメータ化クエリ（SQLインジェクション対策）
SELECT * FROM users WHERE email = $1 AND active = $2;
```

**避けるべき**:

- N+1クエリ問題（ループ内でのクエリ実行）
- `SELECT *` の使用（必要なカラムのみ指定する）
- インデックスを無視するクエリ（例: `WHERE LOWER(email) = ...`）

### トランザクション管理

**推奨**:

```typescript
async function transferMoney(
  fromUserId: string,
  toUserId: string,
  amount: number,
): Promise<Result<void>> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 送金元の残高確認（行ロック）
    const fromBalance = await client.query(
      "SELECT balance FROM accounts WHERE user_id = $1 FOR UPDATE",
      [fromUserId],
    );

    if (fromBalance.rows[0].balance < amount) {
      throw new Error("Insufficient funds");
    }

    // 送金処理
    await client.query(
      "UPDATE accounts SET balance = balance - $1 WHERE user_id = $2",
      [amount, fromUserId],
    );

    await client.query(
      "UPDATE accounts SET balance = balance + $1 WHERE user_id = $2",
      [amount, toUserId],
    );

    await client.query("COMMIT");
    return { success: true, data: undefined };
  } catch (error) {
    await client.query("ROLLBACK");
    return { success: false, error: error as Error };
  } finally {
    client.release();
  }
}
```

**重要ポイント**:

- データ整合性が必要な操作には必ずトランザクションを使用
- `FOR UPDATE` で競合状態を防止
- エラー時には必ず `ROLLBACK`
- `finally` でコネクションを確実に解放

**避けるべき**:

- 複数の更新操作をトランザクションなしで実行
- ロールバック処理の欠如
- コネクションリークの放置

---

## API設計規約

### RESTful API

**推奨: 適切なHTTPメソッドとステータスコード**

```typescript
// GET: リソース取得
app.get("/api/users/:id", async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST: リソース作成
app.post("/api/users", async (req, res) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user); // 201 Created
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT: リソース全体更新
app.put("/api/users/:id", async (req, res) => {
  // 実装
});

// PATCH: リソース部分更新
app.patch("/api/users/:id", async (req, res) => {
  // 実装
});

// DELETE: リソース削除
app.delete("/api/users/:id", async (req, res) => {
  // 実装
});
```

**HTTPステータスコード**:

- `200 OK`: 成功（GET、PUT、PATCH）
- `201 Created`: 作成成功（POST）
- `204 No Content`: 成功（DELETE、内容なし）
- `400 Bad Request`: バリデーションエラー
- `401 Unauthorized`: 認証エラー
- `403 Forbidden`: 認可エラー
- `404 Not Found`: リソースが存在しない
- `500 Internal Server Error`: サーバーエラー

**避けるべき**:

- 不適切なHTTPメソッド（例: `GET /api/users/delete/:id`）
- 一貫性のないレスポンス形式
- エラーハンドリングの欠如

### バリデーション

**推奨: スキーマベースのバリデーション**

```typescript
import Joi from "joi";

const createUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150).optional(),
});

// ミドルウェアでのバリデーション
const validateCreateUser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { error } = createUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details.map((d) => d.message),
    });
  }
  next();
};

app.post("/api/users", validateCreateUser, createUserHandler);
```

**バリデーションルール**:

- 入力値は全てバリデーション必須
- スキーマ定義を使用（Joi、Zod等）
- エラーメッセージは明確に
- バリデーションは早期に実施（ミドルウェア層）

**避けるべき**:

- 手動バリデーション（if文の連続）
- 不十分なバリデーション（例: メール形式チェックなし）
- バリデーションロジックの分散

### APIレスポンス形式

**推奨: 一貫したレスポンス構造**

```typescript
// 成功レスポンス
{
  "data": {
    "id": "123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}

// エラーレスポンス
{
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}

// リストレスポンス（ページネーション付き）
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 重要な原則

### 1. 型安全性

- TypeScriptの厳密な型定義を活用
- `any`型は原則使用禁止
- 型ガードで実行時の型安全性を確保

### 2. エラーハンドリング

- Resultパターンで明示的なエラー処理
- カスタムエラークラスで詳細な情報を提供
- エラーを無視しない

### 3. データベース

- トランザクションで整合性を保証
- パラメータ化クエリでSQLインジェクション対策
- インデックスでクエリを最適化

### 4. API設計

- RESTful原則に従う
- 適切なHTTPメソッドとステータスコードを使用
- スキーマベースのバリデーション

### 5. コードの可読性

- 明確な命名規則
- 適切なコメント
- 関数は単一責任に保つ

---

## チェックリスト

実装時に以下を確認してください:

**TypeScript**:

- [ ] 厳密な型定義を使用している
- [ ] `any`型を使用していない
- [ ] エラーハンドリングが適切（Resultパターン）
- [ ] カスタムエラークラスを定義している

**Database**:

- [ ] パラメータ化クエリを使用している
- [ ] 必要なカラムのみを指定している（`SELECT *`は避ける）
- [ ] データ整合性が必要な操作でトランザクションを使用している
- [ ] インデックスが適切に設定されている

**API**:

- [ ] 適切なHTTPメソッドを使用している
- [ ] 適切なHTTPステータスコードを返している
- [ ] スキーマベースのバリデーションを実装している
- [ ] 一貫したレスポンス形式を使用している
- [ ] エラーハンドリングが適切

---

## 更新履歴

| 日付       | 更新者 | 更新内容               |
| ---------- | ------ | ---------------------- |
| 2024-01-15 | 田中   | TypeScript規約を追加   |
| 2024-01-20 | 佐藤   | データベース規約を追加 |
| 2024-02-01 | 山田   | API設計規約を追加      |
