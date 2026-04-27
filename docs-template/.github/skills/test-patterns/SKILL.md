---
name: test-patterns
description: >-
  Guides test implementation following the test pyramid (75% unit, 20%
  integration, 5% E2E), Arrange-Act-Assert pattern, and project coverage
  thresholds (branches 70%, functions 80%, lines 80%, statements 80%).
  Covers test naming conventions, test independence, mock and stub patterns,
  test data management with fixtures and builders, and CI integration.
  Use when writing tests, reviewing test code, or setting up test infrastructure.
metadata:
  version: "1.0.0"
  author: feel-flow
  tags: "testing, unit-test, integration-test, e2e, coverage, aaa-pattern"
  references: "docs-template/04-quality/TESTING.md"
---

# テストパターンガイド

プロジェクトのテスト戦略に基づいてテストを実装・レビューするためのスキル。
TESTING.md で定義されたパターンと基準を適用する。

## 1. テストピラミッド

```
         /\
        /E2E\        (5%)  - クリティカルパス100%
       /------\
      /統合テスト\    (20%) - 60%以上カバレッジ
     /----------\
    /ユニットテスト\  (75%) - 80%以上カバレッジ
   /--------------\
```

| テスト種別     | 比率 | カバレッジ目標       | 優先度 |
| -------------- | ---- | -------------------- | ------ |
| ユニットテスト | 75%  | 80%以上              | 高     |
| 統合テスト     | 20%  | 60%以上              | 中     |
| E2Eテスト      | 5%   | クリティカルパス100% | 高     |

## 2. カバレッジ閾値

プロジェクトの最低カバレッジ基準：

| メトリクス | 閾値 |
| ---------- | ---- |
| branches   | 70%  |
| functions  | 80%  |
| lines      | 80%  |
| statements | 80%  |

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 70,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## 3. テスト構造（AAA Pattern）

すべてのテストは Arrange-Act-Assert パターンに従うこと：

```typescript
describe("UserService", () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    // Arrange: テスト準備（各テストで新しいインスタンス）
    mockRepository = mock<IUserRepository>();
    service = new UserService(mockRepository);
  });

  describe("createUser", () => {
    it("should create user successfully with valid data", async () => {
      // Arrange
      const userData = { email: "test@example.com", name: "Test User" };
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
      const invalidData = { email: "invalid-email", name: "Test User" };

      // Act & Assert
      await expect(service.createUser(invalidData)).rejects.toThrow(
        ValidationError,
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
```

## 4. テスト命名規則

テスト名は**具体的で、何をテストしているか**が明確であること：

```typescript
// ✅ 良い例: 具体的で理解しやすい
it("should return 404 when user does not exist", () => {});
it("should validate email format before saving", () => {});
it("should retry 3 times on network failure", () => {});

// ❌ 悪い例: 曖昧で情報が不足
it("works", () => {});
it("test user", () => {});
it("error case", () => {});
```

## 5. テストの独立性

各テストは他のテストに依存しないこと：

```typescript
// ✅ 良い例: 各テストが独立
describe("UserService", () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService(); // 各テストで新しいインスタンス
  });

  test("test1", () => {
    /* 他のテストに依存しない */
  });
  test("test2", () => {
    /* 他のテストに依存しない */
  });
});

// ❌ 悪い例: テスト間で状態を共有
let globalUser;
test("create user", () => {
  globalUser = createUser();
});
test("update user", () => {
  updateUser(globalUser);
}); // 前のテストに依存
```

**ルール:**

- `beforeEach` でインスタンスを再作成
- テスト間でグローバル変数を共有しない
- テストの実行順序に依存しない

## 6. モック・テストデータ管理

### モック作成

型安全なモック生成には `jest-mock-extended` などのライブラリを使用する：

```typescript
// jest-mock-extended の使用を推奨
import { mock } from "jest-mock-extended";

const mockRepository = mock<IUserRepository>();
```

### データビルダーパターン

テストデータの構築には Builder パターンを使用する：

```typescript
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

### フィクスチャ

固定のテストデータはフィクスチャファイルで管理する：

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
```

## 7. テスト種別ガイドライン

### ユニットテスト

- 依存関係はすべてモック化
- 成功パスと失敗パスの両方をテスト
- `describe` ブロックで論理的にグループ化
- 1テストにつき1アサーション（原則）

### 統合テスト

- テスト用データベースを使用（本番DBは使わない）
- `beforeAll` でアプリ・DB セットアップ
- `afterAll` でリソースクリーンアップ
- `beforeEach` でデータベース状態をリセット
- レスポンスとデータベース状態の両方を検証

### E2Eテスト

- Playwright でUI テスト、API クライアントで API テスト
- クリティカルパス（ユーザー登録、ログイン、主要フロー）を優先
- バリデーションエラーの表示も検証
- テストデータは各テストで独立して作成

## 8. CI/CD 統合

テストは以下の順序で CI パイプラインに組み込む：

1. Lint チェック
2. ユニットテスト
3. 統合テスト
4. E2E テスト
5. カバレッジレポートアップロード

テストが失敗した場合、後続のステップは実行しない。
