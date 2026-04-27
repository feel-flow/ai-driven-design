# セキュリティ・テストのベストプラクティス

> **Parent**: [BEST_PRACTICES.md](../BEST_PRACTICES.md)

この文書は、セキュリティとテストに関する実装パターンと推奨事項をまとめています。

---

## セキュリティ

### 認証・認可

#### JWT認証の実装

**推奨**:

```typescript
import jwt from "jsonwebtoken";

class AuthService {
  generateToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "24h",
        algorithm: "HS256",
      },
    );
  }

  verifyToken(token: string): UserPayload {
    return jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as UserPayload;
  }
}
```

#### 認可ミドルウェア

**推奨**:

```typescript
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// 使用例
app.get("/api/admin/users", authenticateJWT, requireRole("admin"), getUsers);
```

**避けるべき**:

```typescript
// 脆弱な認証
const token = jwt.sign({ userId: user.id }, "weak-secret");

// 認可の不備
app.get("/api/admin/users", (req, res) => {
  // 認可チェックなし
  res.json(users);
});
```

---

### データ保護

#### パスワードのハッシュ化

**推奨**:

```typescript
import bcrypt from "bcrypt";

class PasswordService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

**避けるべき**:

```typescript
// 平文でのパスワード保存
const user = {
  email: "user@example.com",
  password: "plaintext-password", // 危険
};

// 弱い暗号化
const encrypted = Buffer.from(data).toString("base64");
```

#### 機密データの暗号化

**推奨**:

```typescript
import crypto from "crypto";

class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly key: Buffer;

  constructor(key: string) {
    this.key = Buffer.from(key, "base64");
  }

  encrypt(data: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  }

  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

---

### 入力検証・サニタイゼーション

#### スキーマベースのバリデーション

**推奨**:

```typescript
import Joi from "joi";

const createUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150).optional(),
});

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
```

**避けるべき**:

```typescript
// 手動バリデーション
if (!req.body.name || req.body.name.length < 1) {
  return res.status(400).json({ error: "Name is required" });
}

// 不十分なバリデーション
if (req.body.email) {
  // メール形式のチェックなし
}
```

---

### セキュリティヘッダー

**推奨**:

```typescript
import helmet from "helmet";

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);
```

---

## テスト

### 単体テスト

#### AAAパターン（Arrange-Act-Assert）

**推奨**:

```typescript
describe("UserService", () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    userService = new UserService(mockRepository);
  });

  describe("createUser", () => {
    it("should create a user with valid data", async () => {
      // Arrange
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      const expectedUser = { id: "1", ...userData };
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });

    it("should return error for invalid email", async () => {
      // Arrange
      const userData = {
        name: "John Doe",
        email: "invalid-email",
        age: 30,
      };

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(ValidationError);
    });
  });
});
```

**避けるべき**:

```typescript
// テストの不備
it("should work", async () => {
  const result = await userService.createUser({});
  expect(result).toBeDefined();
});

// モックの不適切な使用
it("should create user", async () => {
  const result = await userService.createUser(userData);
  expect(result).toBeTruthy();
  // 実際のデータベースに接続している
});
```

---

### 統合テスト

#### データベース統合テスト

**推奨**:

```typescript
describe("User API Integration", () => {
  let app: Express;
  let testDb: Database;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
    app = createApp(testDb);
  });

  afterAll(async () => {
    await cleanupTestDatabase(testDb);
  });

  beforeEach(async () => {
    await testDb.query("DELETE FROM users");
  });

  describe("POST /api/users", () => {
    it("should create a user and return 201", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        name: userData.name,
        email: userData.email,
        age: userData.age,
      });

      // データベースに保存されていることを確認
      const user = await testDb.query("SELECT * FROM users WHERE id = $1", [
        response.body.id,
      ]);
      expect(user.rows).toHaveLength(1);
    });

    it("should return 400 for invalid data", async () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
      };

      await request(app).post("/api/users").send(invalidData).expect(400);
    });
  });
});
```

---

### テストカバレッジ

#### カバレッジ目標

**推奨**:

- 全体カバレッジ: 80%以上
- 重要な機能: 90%以上
- ユーティリティ関数: 100%

#### カバレッジ設定

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    "src/**/*.{js,ts}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{js,ts}",
    "!src/index.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "./src/services/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

---

### E2Eテスト

#### Playwrightを使用したE2Eテスト

**推奨**:

```typescript
import { test, expect } from "@playwright/test";

test.describe("User Registration Flow", () => {
  test("should allow user to register successfully", async ({ page }) => {
    // ページに移動
    await page.goto("http://localhost:3000/register");

    // フォーム入力
    await page.fill('input[name="name"]', "John Doe");
    await page.fill('input[name="email"]', "john@example.com");
    await page.fill('input[name="password"]', "SecurePassword123!");

    // 送信
    await page.click('button[type="submit"]');

    // リダイレクトと成功メッセージを確認
    await expect(page).toHaveURL("http://localhost:3000/dashboard");
    await expect(page.locator(".success-message")).toContainText(
      "Welcome, John Doe",
    );
  });

  test("should show validation errors", async ({ page }) => {
    await page.goto("http://localhost:3000/register");

    // 空のフォーム送信
    await page.click('button[type="submit"]');

    // エラーメッセージを確認
    await expect(page.locator(".error-message")).toContainText(
      "Name is required",
    );
  });
});
```

---

## 更新履歴

| 日付       | 更新者   | 更新内容                                       |
| ---------- | -------- | ---------------------------------------------- |
| 2024-02-01 | 田中     | セキュリティとテストのベストプラクティスを抽出 |
| 2025-01-15 | システム | 階層化ドキュメント構造に対応                   |
