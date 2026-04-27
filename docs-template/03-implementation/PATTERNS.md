---
title: "PATTERNS"
version: "1.1.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-04-27"
---

# PATTERNS.md - 実装パターンガイド

## 1. コーディング規約

### 命名規則

| 要素             | パターン              | 例              |
| ---------------- | --------------------- | --------------- |
| クラス           | PascalCase            | UserService     |
| インターフェース | PascalCase + I prefix | IUserRepository |
| メソッド         | camelCase             | getUserById()   |
| 変数             | camelCase             | userName        |
| 定数             | UPPER_SNAKE_CASE      | MAX_RETRY_COUNT |
| ファイル         | kebab-case            | user-service.ts |

### コード構造

```typescript
// ファイル構造の標準パターン
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

## 2. デザインパターン

### Repository Pattern

```typescript
// リポジトリインターフェース
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

// 実装
class UserRepository implements IUserRepository {
  constructor(private db: Database) {}

  async findById(id: string): Promise<User | null> {
    const data = await this.db.query("SELECT * FROM users WHERE id = ?", [id]);
    return data ? User.fromData(data) : null;
  }
}
```

### Factory Pattern

```typescript
// ファクトリーパターン
class NotificationFactory {
  static create(type: NotificationType): INotification {
    switch (type) {
      case NotificationType.EMAIL:
        return new EmailNotification();
      case NotificationType.SMS:
        return new SmsNotification();
      case NotificationType.PUSH:
        return new PushNotification();
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }
  }
}
```

### Singleton Pattern

```typescript
// シングルトンパターン
class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
}
```

## 3. エラーハンドリング

### カスタムエラークラス

```typescript
// エラー基底クラス
abstract class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// バリデーション詳細の型定義（any[] の代わりに明示的な型を使用し型安全性を確保）
interface ValidationDetail {
  field: string;
  message: string;
  constraint?: string;
}

// 具体的なエラークラス
class ValidationError extends AppError {
  constructor(
    message: string,
    public details: ValidationDetail[],
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, "FORBIDDEN", 403);
  }
}

class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

### エラーハンドリングパターン

```typescript
// Try-Catch with proper error handling
async function processUser(userId: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundError("User not found"));
    }

    const processed = await processUserData(user);
    return Result.ok(processed);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to process user", normalizedError, { userId });

    if (normalizedError instanceof ValidationError) {
      return Result.fail(normalizedError);
    }

    return Result.fail(new InternalError("Processing failed"));
  }
}
```

### 環境別フォールバック戦略

フォールバック処理はtry-catchレベルだけでなく、UI/サービス/機能/データの各レイヤーにまたがるアプリケーション横断的な関心事である。

**基本原則**: 開発環境ではFail-Fast、本番環境でのみGraceful Degradation。この原則は全レイヤーに適用する。

詳細な戦略・パターン・テンプレートは [FALLBACK.md](./FALLBACK.md) を参照。

## 4. 非同期処理パターン

### Promise Chain

```typescript
// Promise チェーンパターン
function fetchUserWithPosts(userId: string): Promise<UserWithPosts> {
  return fetchUser(userId)
    .then((user) => fetchPosts(user.id).then((posts) => ({ ...user, posts })))
    .catch((error: unknown) => {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error));
      logger.error("Failed to fetch user with posts", normalizedError);
      throw new DataFetchError("Could not load user data");
    });
}
```

### Async/Await

```typescript
// Async/Awaitパターン
async function fetchUserWithPosts(userId: string): Promise<UserWithPosts> {
  try {
    const user = await fetchUser(userId);
    const posts = await fetchPosts(user.id);
    return { ...user, posts };
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to fetch user with posts", normalizedError);
    throw new DataFetchError("Could not load user data");
  }
}
```

### 並列処理

```typescript
// 並列処理パターン
async function fetchDashboardData(userId: string): Promise<Dashboard> {
  const [user, stats, notifications] = await Promise.all([
    fetchUser(userId),
    fetchUserStats(userId),
    fetchNotifications(userId),
  ]);

  return {
    user,
    stats,
    notifications,
  };
}
```

## 5. バリデーションパターン

### DTOバリデーション

```typescript
// DTOバリデーション using class-validator
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

class CreateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
```

### カスタムバリデーター

```typescript
// カスタムバリデーター
class Validator {
  static isValidEmail(email: string): boolean {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  static isValidPassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

## 6. テストパターン

### Unit Test

```typescript
// ユニットテストパターン
describe("UserService", () => {
  let service: UserService;
  let repository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repository = createMock<IUserRepository>();
    service = new UserService(repository);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      const mockUser = { id: "1", name: "John" };
      repository.findById.mockResolvedValue(mockUser);

      const result = await service.findById("1");

      expect(result).toEqual(mockUser);
      expect(repository.findById).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundError when user not found", async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById("1")).rejects.toThrow(NotFoundError);
    });
  });
});
```

### Integration Test

```typescript
// 統合テストパターン
describe("User API", () => {
  let app: Application;
  let db: Database;

  beforeAll(async () => {
    app = await createTestApp();
    db = await createTestDatabase();
  });

  afterAll(async () => {
    await db.close();
    await app.close();
  });

  describe("POST /users", () => {
    it("should create user successfully", async () => {
      const response = await request(app)
        .post("/users")
        .send({
          email: "test@example.com",
          password: "SecurePass123",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("test@example.com");
    });
  });
});
```

## 7. セキュリティパターン

### 入力サニタイゼーション

```typescript
// 入力のサニタイゼーション
class Sanitizer {
  static sanitizeHtml(input: string): string {
    return input
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  }

  static sanitizeSql(input: string): string {
    // Use parameterized queries instead
    return input.replace(/['";\\]/g, "");
  }
}
```

### 認証・認可

```typescript
// 認証ミドルウェア
function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// 認可デコレーター
function RequireRole(role: Role) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;

    descriptor.value = async function (...args: unknown[]) {
      const user = getCurrentUser();
      if (!user.hasRole(role)) {
        throw new ForbiddenError("Insufficient permissions");
      }
      return originalMethod.apply(this, args);
    };
  };
}
```

## 8. パフォーマンス最適化

### キャッシングパターン

```typescript
// キャッシングデコレーター
function Cacheable(ttl: number = 3600) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value as (
      ...args: unknown[]
    ) => Promise<unknown>;
    const cache = new Map<string, { value: unknown; timestamp: number }>();

    descriptor.value = async function (...args: unknown[]) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        const cached = cache.get(key);
        if (Date.now() - cached.timestamp < ttl * 1000) {
          return cached.value;
        }
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, { value: result, timestamp: Date.now() });
      return result;
    };
  };
}
```

### バッチ処理

```typescript
// バッチ処理パターン
class BatchProcessor<T> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchSize: number,
    private batchDelay: number,
    private processFn: (items: T[]) => Promise<void>,
  ) {}

  add(item: T): void {
    this.queue.push(item);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);
    await this.processFn(batch);
  }
}
```

## 9. ログパターン

### 構造化ログ

```typescript
// 構造化ログパターン
class Logger {
  private context: Record<string, unknown> = {};

  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...this.context,
        ...meta,
      }),
    );
  }

  error(message: string, error: Error, meta?: Record<string, unknown>): void {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
        ...this.context,
        ...meta,
      }),
    );
  }
}
```

## 10. マジックナンバー禁止

### 定数の定義

```typescript
// ❌ 悪い例
if (retryCount > 3) {
  throw new Error("Max retries exceeded");
}

// ✅ 良い例
const MAX_RETRY_COUNT = 3;
if (retryCount > MAX_RETRY_COUNT) {
  throw new Error("Max retries exceeded");
}
```

### 設定の外部化

```typescript
// config/constants.ts
export const API_CONFIG = {
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RATE_LIMIT: 100,
} as const;

// 使用例
import { API_CONFIG } from "./config/constants";

async function fetchWithRetry(url: string) {
  let retries = 0;
  while (retries < API_CONFIG.MAX_RETRIES) {
    // implementation
  }
}
```

## 11. 配置判断（Decision Tree）

新機能・新モジュール追加時の「どこに書くか」の判断は [DECISION_TREE.md](./DECISION_TREE.md) に委ねる。

本セクションは索引であり、実体は DECISION_TREE.md 側で維持する。

### 使い所

- 新規ファイル作成前の配置判断
- レビュー時の配置妥当性確認
- AI（Claude Code / Cursor / Copilot）が新規コード生成する際の参照元

### 概要

Decision Tree は 7 分岐（Q0〜Q6）で構成される：

| 分岐 | 判定観点                              |
| ---- | ------------------------------------- |
| Q0   | コード変更 or ドキュメント            |
| Q1   | 外部システム通信（境界モジュール）    |
| Q2   | リクエスト入口（HTTP エンドポイント） |
| Q3   | オーケストレーション（ユースケース）  |
| Q4   | 永続化・状態保持                      |
| Q5   | ドメインモデル                        |
| Q6   | 横断的関心事                          |

詳細な分岐内容とチェックリストは [DECISION_TREE.md](./DECISION_TREE.md) を参照。

新規ファイルの雛形（SKELETON テンプレ）は [templates/README.md](./templates/README.md) に集約する。言語非依存の運用ルールと、TypeScript 等のコピー元パスを必ず確認すること。

## 12. 依存方向 lint（Layer 3）

Layer 1（[DECISION_TREE.md](./DECISION_TREE.md)）で決めた配置を、言語別 lint ツールで自動検証する。

- 目的: 境界違反の import を CI / pre-commit で機械的に検知する
- 注意: Layer 3 は **言語依存**（Python/TypeScript/Go/Rust など）
- 運用: `ignore_imports` などを使って既知負債を可視化し、削除ではなく追跡する

詳細は [DEPENDENCY_LINT.md](./DEPENDENCY_LINT.md) を参照。

## Changelog

### [1.1.0] - 2026-04-27

#### 追加

- Layer 3（依存方向 lint）ガイドへの委譲リンクを追加

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成
