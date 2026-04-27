---
title: "TESTING"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# TESTING.md - テスト戦略ガイド

## 1. テスト戦略概要

### テストピラミッド

```
         /\
        /E2E\        (10%) - エンドツーエンドテスト
       /------\
      /統合テスト\    (20%) - 結合テスト
     /----------\
    /ユニットテスト\  (70%) - 単体テスト
   /--------------\
```

### テスト比率の推奨値（テスト投資の配分）

テストスイート全体に対する**件数・工数の目安比率**（テストピラミッドに整合）。コードカバレッジ目標（次表）とは別概念である。

| テスト種別     | 推奨比率 | 役割の目安                                           |
| -------------- | -------- | ---------------------------------------------------- |
| ユニットテスト | **70%**  | ドメインロジック・ユーティリティの高速フィードバック |
| 統合テスト     | **20%**  | DB・メッセージ・外部API境界を含む結合の検証          |
| E2Eテスト      | **10%**  | クリティカルなユーザージャーニー・契約に近い経路     |

比率はプロジェクトの性質（レガシー比率、リリース頻度）で調整してよいが、E2Eのみに偏重しないこと。品質ゲート全体の枠組みは [GUARDRAILS_THREE_LAYERS.md](./GUARDRAILS_THREE_LAYERS.md) を参照。

### カバレッジ目標

| テスト種別     | カバレッジ目標       | 優先度 |
| -------------- | -------------------- | ------ |
| ユニットテスト | 80%以上              | 高     |
| 統合テスト     | 60%以上              | 中     |
| E2Eテスト      | クリティカルパス100% | 高     |

## 2. ユニットテスト

### テスト構造（AAA Pattern）

```typescript
describe("UserService", () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    // Arrange: テスト準備
    mockRepository = createMock<IUserRepository>();
    service = new UserService(mockRepository);
  });

  describe("createUser", () => {
    it("should create user successfully with valid data", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        name: "Test User",
      };
      const expectedUser = { id: "123", ...userData };
      mockRepository.save.mockResolvedValue(expectedUser);

      // Act
      const result = await service.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(userData),
      );
    });

    it("should throw ValidationError for invalid email", async () => {
      // Arrange
      const invalidData = {
        email: "invalid-email",
        name: "Test User",
      };

      // Act & Assert
      await expect(service.createUser(invalidData)).rejects.toThrow(
        ValidationError,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
```

### モックとスタブ

```typescript
// モック作成ヘルパー
function createMock<T>(partial?: Partial<T>): jest.Mocked<T> {
  return {
    ...partial,
  } as jest.Mocked<T>;
}

// データビルダーパターン
class UserBuilder {
  private user: Partial<User> = {
    id: "123",
    email: "default@example.com",
    name: "Default User",
  };

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  build(): User {
    return this.user as User;
  }
}

// 使用例
const user = new UserBuilder().withEmail("custom@example.com").build();
```

## 3. 統合テスト

### API統合テスト

```typescript
describe("User API Integration", () => {
  let app: Application;
  let db: Database;

  beforeAll(async () => {
    // テスト用データベース接続
    db = await createTestDatabase();
    app = await createApplication(db);
  });

  afterAll(async () => {
    await db.close();
    await app.close();
  });

  beforeEach(async () => {
    // データベースクリーンアップ
    await db.truncate(["users", "orders"]);
  });

  describe("POST /api/users", () => {
    it("should create user and return 201", async () => {
      const userData = {
        email: "test@example.com",
        password: "SecurePass123!",
        name: "Test User",
      };

      const response = await request(app)
        .post("/api/users")
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name,
      });

      // データベース検証
      const user = await db.query("SELECT * FROM users WHERE email = $1", [
        userData.email,
      ]);
      expect(user).toBeDefined();
    });

    it("should return 409 for duplicate email", async () => {
      // 既存ユーザー作成
      await db.query("INSERT INTO users (email, name) VALUES ($1, $2)", [
        "existing@example.com",
        "Existing User",
      ]);

      const response = await request(app)
        .post("/api/users")
        .send({
          email: "existing@example.com",
          password: "Password123!",
          name: "New User",
        })
        .expect(409);

      expect(response.body.error.code).toBe("DUPLICATE_EMAIL");
    });
  });
});
```

### データベース統合テスト

```typescript
describe("UserRepository Integration", () => {
  let repository: UserRepository;
  let db: Database;

  beforeAll(async () => {
    db = await createTestDatabase();
    repository = new UserRepository(db);
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      // テストデータ準備
      await db.query(
        "INSERT INTO users (id, email, name) VALUES ($1, $2, $3)",
        ["123", "test@example.com", "Test User"],
      );

      const user = await repository.findByEmail("test@example.com");

      expect(user).toMatchObject({
        id: "123",
        email: "test@example.com",
        name: "Test User",
      });
    });

    it("should return null for non-existent email", async () => {
      const user = await repository.findByEmail("notfound@example.com");
      expect(user).toBeNull();
    });
  });
});
```

## 4. E2Eテスト

### Playwright E2Eテスト

```typescript
import { test, expect } from "@playwright/test";

test.describe("User Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should complete registration successfully", async ({ page }) => {
    // ナビゲーション
    await page.click("text=Sign Up");

    // フォーム入力
    await page.fill('input[name="email"]', "newuser@example.com");
    await page.fill('input[name="password"]', "SecurePass123!");
    await page.fill('input[name="confirmPassword"]', "SecurePass123!");
    await page.fill('input[name="name"]', "New User");

    // 利用規約に同意
    await page.check('input[name="terms"]');

    // 送信
    await page.click('button[type="submit"]');

    // 成功確認
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome, New User");
  });

  test("should show validation errors", async ({ page }) => {
    await page.click("text=Sign Up");

    // 無効なメールアドレス
    await page.fill('input[name="email"]', "invalid-email");
    await page.fill('input[name="password"]', "123"); // 弱いパスワード

    await page.click('button[type="submit"]');

    // エラーメッセージ確認
    await expect(page.locator(".error-email")).toContainText(
      "Valid email required",
    );
    await expect(page.locator(".error-password")).toContainText(
      "Password must be at least 8 characters",
    );
  });
});
```

### API E2Eテスト

```typescript
describe("Order Processing E2E", () => {
  let apiClient: ApiClient;
  let testUser: User;

  beforeAll(async () => {
    apiClient = new ApiClient(process.env.TEST_API_URL);

    // テストユーザー作成
    testUser = await apiClient.createUser({
      email: `test-${Date.now()}@example.com`,
      password: "TestPass123!",
    });

    await apiClient.authenticate(testUser.email, "TestPass123!");
  });

  test("complete order flow", async () => {
    // 1. 商品検索
    const products = await apiClient.searchProducts("laptop");
    expect(products.length).toBeGreaterThan(0);

    // 2. カートに追加
    const cart = await apiClient.addToCart(products[0].id, 1);
    expect(cart.items).toHaveLength(1);

    // 3. チェックアウト
    const order = await apiClient.checkout({
      cartId: cart.id,
      paymentMethod: "test-card",
      shippingAddress: {
        street: "123 Test St",
        city: "Test City",
        postalCode: "12345",
      },
    });

    expect(order.status).toBe("confirmed");
    expect(order.items).toHaveLength(1);

    // 4. 注文確認
    const fetchedOrder = await apiClient.getOrder(order.id);
    expect(fetchedOrder.id).toBe(order.id);
  });
});
```

## 5. パフォーマンステスト

### 負荷テスト（k6）

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // ランプアップ
    { duration: "5m", target: 100 }, // 維持
    { duration: "2m", target: 0 }, // ランプダウン
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95%が500ms以内
    http_req_failed: ["rate<0.1"], // エラー率10%未満
  },
};

export default function () {
  const response = http.get("https://api.example.com/users");

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### ベンチマークテスト

```typescript
describe("Performance Benchmarks", () => {
  test("should process 1000 records within 1 second", async () => {
    const records = generateTestRecords(1000);

    const startTime = performance.now();
    await processor.processRecords(records);
    const endTime = performance.now();

    const duration = endTime - startTime;
    expect(duration).toBeLessThan(1000); // 1秒以内
  });

  test("memory usage should not exceed 100MB", async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    await processor.processLargeDataset();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

    expect(memoryIncrease).toBeLessThan(100); // 100MB以内
  });
});
```

## 6. セキュリティテスト

### 脆弱性テスト

```typescript
describe("Security Tests", () => {
  describe("SQL Injection Prevention", () => {
    test("should sanitize malicious SQL input", async () => {
      const maliciousInput = "'; DROP TABLE users; --";

      const response = await request(app)
        .get(`/api/users/search?q=${encodeURIComponent(maliciousInput)}`)
        .expect(200);

      // テーブルが削除されていないことを確認
      const tableExists = await db.query(
        "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')",
      );
      expect(tableExists.rows[0].exists).toBe(true);
    });
  });

  describe("XSS Prevention", () => {
    test("should escape HTML in user input", async () => {
      const xssPayload = '<script>alert("XSS")</script>';

      const response = await request(app)
        .post("/api/comments")
        .send({ content: xssPayload })
        .expect(201);

      expect(response.body.content).toBe(
        '&lt;script&gt;alert("XSS")&lt;/script&gt;',
      );
    });
  });

  describe("Authentication", () => {
    test("should prevent brute force attacks", async () => {
      const attempts = [];

      // 10回の失敗試行
      for (let i = 0; i < 10; i++) {
        attempts.push(
          request(app).post("/api/auth/login").send({
            email: "user@example.com",
            password: "wrong-password",
          }),
        );
      }

      const responses = await Promise.all(attempts);
      const lastResponse = responses[responses.length - 1];

      expect(lastResponse.status).toBe(429); // Too Many Requests
      expect(lastResponse.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
    });
  });
});
```

## 7. テストデータ管理

### フィクスチャ

```typescript
// fixtures/users.ts
export const fixtures = {
  validUser: {
    id: "123",
    email: "john@example.com",
    name: "John Doe",
    role: "user",
    createdAt: new Date("2024-01-01"),
  },

  adminUser: {
    id: "456",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  },
};

// テストでの使用
import { fixtures } from "./fixtures/users";

test("should authorize admin user", () => {
  const result = authorize(fixtures.adminUser, "admin:read");
  expect(result).toBe(true);
});
```

### シードデータ

```typescript
// seed.ts
export async function seedTestData(db: Database) {
  // ユーザー作成
  const users = await db.insert("users", [
    { email: "user1@test.com", name: "User 1" },
    { email: "user2@test.com", name: "User 2" },
  ]);

  // 関連データ作成
  await db.insert("orders", [
    { userId: users[0].id, total: 100 },
    { userId: users[1].id, total: 200 },
  ]);
}

// テストでの使用
beforeEach(async () => {
  await db.truncateAll();
  await seedTestData(db);
});
```

## 8. テスト自動化

### CI/CDパイプライン

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 9. テストレポート

### カバレッジレポート設定

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/*.interface.ts',
    '!src/**/index.ts'
  ]
};
```

## 10. テストベストプラクティス

### テスト命名規則

```typescript
// ✅ 良い例: 具体的で理解しやすい
it("should return 404 when user does not exist", () => {});
it("should validate email format before saving", () => {});
it("should retry 3 times on network failure", () => {});

// ❌ 悪い例: 曖昧
it("works", () => {});
it("test user", () => {});
it("error case", () => {});
```

### テストの独立性

```typescript
// ✅ 良い例: 各テストが独立
describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    // 各テストで新しいインスタンス
    service = new UserService();
  });

  test("test1", () => {
    // このテストは他のテストに依存しない
  });
});

// ❌ 悪い例: テスト間で状態を共有
let globalUser;
test("create user", () => {
  globalUser = createUser();
});
test("update user", () => {
  updateUser(globalUser); // 前のテストに依存
});
```

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成

#### 変更

- テストピラミッドの推奨比率を70/20/10に更新し、「テスト比率の推奨値（テスト投資の配分）」節とガードレール文書への参照を追加
- ピラミッド図の英語ラベルを日本語（単体・結合・E2E）に統一
