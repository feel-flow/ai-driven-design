---
title: "PATTERNS"
version: "1.2.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-09-06"
changeImpact: "MEDIUM"
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
// 前提: tsconfig の lib に ES2022 を含める（Error.cause / new Error(message, { cause })）。
// options.cause で元エラー（外部 SDK のエラー等）を保持する。元エラーの status / code /
// レスポンス本文が消えると、呼び出し元は「利用者が対処できる失敗（カード拒否）」と
// 「再試行すべき障害（API 障害）」を区別できない。ラップするときは必ず cause を渡す。
type AppErrorOptions = { cause?: unknown };

// エラー分類。フォールバック可否・再試行可否は statusCode から推測せず、各サブクラスが
// 宣言する（抽象メンバなので、サブクラスを追加した瞬間にコンパイルが宣言を要求する）。
//   never-fallback: 認証・認可・バリデーション・データ整合性・セキュリティ
//                   — 環境を問わずスロー、再試行しない（FALLBACK.md Section 1）
//   transient:      外部サービスの一時障害 — 再試行可、本番ではフォールバック可
//   permanent:      再試行しても結果が変わらない失敗（未検出・自コードのバグ・上流の恒久拒否）
//                   — 再試行しない、本番ではフォールバック可
type ErrorCategory = "never-fallback" | "transient" | "permanent";

// エラー基底クラス。code / statusCode は readonly（分類の判定入力を後から書き換えさせない）
abstract class AppError extends Error {
  abstract readonly category: ErrorCategory;

  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// HTTP ステータス（マジックナンバー禁止 / MASTER.md）。エラー階層と正規化で共用する
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

// バリデーション詳細の型定義（any[] の代わりに明示的な型を使用し型安全性を確保）
interface ValidationDetail {
  field: string;
  message: string;
  constraint?: string;
}

// 具体的なエラークラス
class ValidationError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(
    message: string,
    // readonly: 呼び出し元へ返した配列を書き換えられないようにする
    public readonly details: readonly ValidationDetail[],
    options?: AppErrorOptions,
  ) {
    super(message, "VALIDATION_ERROR", HTTP_STATUS.BAD_REQUEST, options);
  }
}

class NotFoundError extends AppError {
  readonly category: ErrorCategory = "permanent";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "NOT_FOUND", HTTP_STATUS.NOT_FOUND, options);
  }
}

class ForbiddenError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "FORBIDDEN", HTTP_STATUS.FORBIDDEN, options);
  }
}

class ConflictError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "CONFLICT", HTTP_STATUS.CONFLICT, options);
  }
}

// 認証エラー（未認証）。認可エラー(ForbiddenError)と合わせて
// FALLBACK.md のフォールバック禁止カテゴリを構成する
class UnauthorizedError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "UNAUTHORIZED", HTTP_STATUS.UNAUTHORIZED, options);
  }
}

// セキュリティ違反（改ざん検知・署名不一致・レート制限違反など）
class SecurityError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "SECURITY_VIOLATION", HTTP_STATUS.FORBIDDEN, options);
  }
}

// 予期しない内部エラー（詳細はログに残し、利用者には露出しない）。自コードのバグは
// 再試行しても直らないので permanent
class InternalError extends AppError {
  readonly category: ErrorCategory = "permanent";
  constructor(message: string, options?: AppErrorOptions) {
    super(
      message,
      "INTERNAL_ERROR",
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      options,
    );
  }
}

// 外部サービス（決済・メール・API）の一時的な障害。transient を宣言する既定の型で、
// サービス固有の型（INTEGRATIONS.md の PaymentError 等）も transient を宣言すれば再試行対象になる
class UpstreamError extends AppError {
  readonly category: ErrorCategory = "transient";
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "UPSTREAM_UNAVAILABLE", HTTP_STATUS.BAD_GATEWAY, options);
  }
}

// 外部サービスがこちらの要求を恒久的に拒否した（4xx）。利用者の入力検証エラー
// （ValidationError）とは別物として扱う — 上流の拒否をローカルの入力エラーとして
// 名乗ると、details をフィールドエラーとして描画するハンドラが誤動作し、
// 上流の失敗理由（cause）も details からは辿れなくなる
class UpstreamRejectedError extends AppError {
  readonly category: ErrorCategory = "permanent";
  constructor(
    message: string,
    public readonly upstreamStatus: number,
    options?: AppErrorOptions,
  ) {
    super(message, "UPSTREAM_REJECTED", HTTP_STATUS.BAD_GATEWAY, options);
  }
}
```

### 外部境界のエラー正規化

```typescript
// SDK ごとに status の置き場所が違う（axios: response.status / Stripe: statusCode / fetch: status）
function readHttpStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const e = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
  };
  const candidate = e.statusCode ?? e.status ?? e.response?.status;
  return typeof candidate === "number" ? candidate : undefined;
}

// Node のシステムエラーコード（ECONNREFUSED / ENOTFOUND / ETIMEDOUT 等）を cause に持つか
function hasSystemErrorCode(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error.cause as { code?: unknown } | undefined)?.code;
  return typeof code === "string" && /^E[A-Z]+$/.test(code);
}

// 自コードのバグ。HTTP ステータスを持たないので、放置すると「ステータス無し = 一時障害」
// と誤分類され、本番でフォールバック・再試行される。
// 例外: WHATWG fetch / undici はネットワーク障害を `TypeError: fetch failed`
// （cause に ECONNREFUSED 等）で reject する。これはバグではなく一時障害
function isProgrammingError(error: unknown): boolean {
  if (error instanceof TypeError && hasSystemErrorCode(error)) return false;
  return (
    error instanceof TypeError ||
    error instanceof RangeError ||
    error instanceof ReferenceError ||
    error instanceof SyntaxError
  );
}

/**
 * HTTP クライアント / 外部 SDK の境界で、生のエラーを AppError に正規化する。
 *
 * 汎用 Error / AxiosError のままだと category の判定がすべて素通りし、外部 API の
 * 401/403 がフォールバックや再試行の対象になる（FALLBACK.md §4）。
 * cause には元の値をそのまま保持する（Error でない値も String() に潰さない —
 * 上流のステータスやレスポンス本文は cause からしか辿れない）。
 *
 * 対象は HTTP ステータスを持つ境界のみ。DB ドライバ・キュー・ファイル I/O のエラーは
 * ステータスを持たないため、リポジトリ層に専用のマッパー（driver code →
 * ConflictError / NotFoundError / UpstreamError）を置き、この関数には通さない。
 * `fetch` の `!res.ok` を `throw new Error(...)` で表す書き方も status を失う —
 * 境界では `{ status: res.status }` を持つエラーを投げるか、この関数に
 * `{ status: res.status, body }` を直接渡す。
 */
function normalizeExternalError(
  error: unknown,
  message = "External service call failed",
): AppError {
  if (error instanceof AppError) return error;
  if (isProgrammingError(error)) {
    return new InternalError(message, { cause: error });
  }
  const cause = error;
  const status = readHttpStatus(error);

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return new UnauthorizedError(message, { cause });
    case HTTP_STATUS.FORBIDDEN:
      return new ForbiddenError(message, { cause });
    case HTTP_STATUS.NOT_FOUND:
      return new NotFoundError(message, { cause });
    case HTTP_STATUS.CONFLICT:
      return new ConflictError(message, { cause });
    case undefined:
    case HTTP_STATUS.TOO_MANY_REQUESTS:
      // ステータスを取り出せなかった（接続断・タイムアウト、または status を添えない
      // HTTP ラッパ）。429 とともに一時障害として扱う
      return new UpstreamError(message, { cause });
    default:
      return status >= HTTP_STATUS.INTERNAL_SERVER_ERROR
        ? new UpstreamError(message, { cause })
        : new UpstreamRejectedError(message, status, { cause });
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

    // AppError はそのまま返す。ValidationError だけ通して残りを InternalError に
    // 降格させると、UnauthorizedError 等の never-fallback が permanent に化け、
    // 上位の fallbackInProdOnly が本番で握りつぶす
    if (normalizedError instanceof AppError) {
      return Result.fail(normalizedError);
    }

    return Result.fail(
      new InternalError("Processing failed", { cause: normalizedError }),
    );
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
// Logger の呼び出し規約（テンプレート全体の正典。他文書のコード例もこの署名に従う）:
//   error(message, error, meta?) — 第 2 引数は Error 型。catch 変数（unknown）は
//     `error instanceof Error ? error : new Error(String(error))` で正規化してから渡す
//   warn / info(message, meta?) — meta は構造化コンテキスト。Error 実体は入れない
//     （JSON.stringify で message / stack が落ちる）。必要なら name / code だけ載せる
// 2 引数版 error(message, error) のみだと構造化コンテキストを渡す口が無く、
// FALLBACK.md「フォールバック発動時は必ず構造化ログ」を満たせない。
interface Logger {
  error(message: string, error: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
}

// メトリクスクライアントの最小契約（実装は MONITORING.md の監視基盤に接続する）。
// エラー処理経路から呼ぶため、実装は例外を投げない — 送信失敗は内部で記録して黙って戻る
interface Metrics {
  increment(name: string, tags?: Record<string, string>): void;
}

// cause 鎖の展開深さの上限（マジックナンバー禁止）。無限の cause ループを防ぐ
const ERROR_CAUSE_MAX_DEPTH = 5;

// Error を構造化する。cause を保持する規約（§3）と対で、cause をログに出す実装が要る —
// name / message / stack しか出さないと、ラップ時に保持した上流の失敗理由が
// どこにも現れない
// ログに載せる上流レスポンス本文の上限（マジックナンバー禁止）。巨大な本文で行を潰さない
const ERROR_LOG_BODY_MAX_CHARS = 2000;

// HTTP 由来のエラー（AxiosError / fetch のレスポンス / { status, body }）から
// 診断に要るフィールドだけを抜く。cause に保持した上流のステータス・本文は
// ここで出さないとどこにも現れない
function pickHttpDiagnostics(value: object): Record<string, unknown> {
  const v = value as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
    body?: unknown;
    response?: { status?: unknown; data?: unknown };
  };
  const body = v.body ?? v.response?.data;
  const diagnostics: Record<string, unknown> = {};
  const status = v.statusCode ?? v.status ?? v.response?.status;
  if (status !== undefined) diagnostics.status = status;
  if (v.code !== undefined) diagnostics.code = v.code;
  if (body !== undefined) {
    const text = typeof body === "string" ? body : JSON.stringify(body);
    diagnostics.body = text?.slice(0, ERROR_LOG_BODY_MAX_CHARS);
  }
  return diagnostics;
}

function serializeError(error: unknown, depth = 0): Record<string, unknown> {
  if (!(error instanceof Error)) {
    // Error でない cause（{ status, body } 等）は String() に潰さず構造化する
    return typeof error === "object" && error !== null
      ? pickHttpDiagnostics(error)
      : { value: String(error) };
  }
  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...pickHttpDiagnostics(error), // AxiosError 等の status / response.data
  };
  if (error instanceof AppError) {
    serialized.code = error.code;
    serialized.statusCode = error.statusCode;
    serialized.category = error.category;
  }
  if (error instanceof UpstreamRejectedError) {
    serialized.upstreamStatus = error.upstreamStatus;
  }
  if (error.cause !== undefined && depth < ERROR_CAUSE_MAX_DEPTH) {
    serialized.cause = serializeError(error.cause, depth + 1);
  }
  return serialized;
}

// 構造化ログパターン（Logger の実装例）
class JsonLogger implements Logger {
  private context: Record<string, unknown> = {};

  setContext(context: Record<string, unknown>): void {
    this.context = { ...this.context, ...context };
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  private write(
    level: "info" | "warn",
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    console.log(
      JSON.stringify({
        level,
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
        error: serializeError(error),
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

新規ファイルの雛形（SKELETON テンプレ）は `docs/03-implementation/templates/README.md`（初期セット外。必要になった時点でテンプレート配布元からコピーする）に集約する。言語非依存の運用ルールと、TypeScript 等のコピー元パスを必ず確認すること。

## 12. 依存方向 lint（Layer 3）

Layer 1（[DECISION_TREE.md](./DECISION_TREE.md)）で決めた配置を、言語別 lint ツールで自動検証する。

- 目的: 境界違反の import を CI / pre-commit で機械的に検知する
- 注意: Layer 3 は **言語依存**（Python/TypeScript/Go/Rust など）
- 運用: `ignore_imports` などを使って既知負債を可視化し、削除ではなく追跡する

詳細は `docs/03-implementation/DEPENDENCY_LINT.md`（初期セット外。必要になった時点でテンプレート配布元からコピーする）を参照。

## Changelog

### [1.2.0] - 2026-09-06

#### 変更

- AppError 階層に `cause` と分類 `category`（never-fallback / transient / permanent）を追加し、`UpstreamError` / `UpstreamRejectedError`、`HTTP_STATUS`、外部境界のエラー正規化 `normalizeExternalError()` を追加（Issue #486）
- Logger の呼び出し規約を `interface Logger` として明文化（error は `(message, error, meta?)`、warn / info は `(message, meta?)`）。`JsonLogger` が `cause` 鎖を出力するよう `serializeError()` を追加。`Metrics` の最小契約を追加

### [1.1.0] - 2026-04-27

#### 追加

- Layer 3（依存方向 lint）ガイドへの委譲リンクを追加

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成
