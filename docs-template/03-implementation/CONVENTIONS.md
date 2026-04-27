# CONVENTIONS.md - コーディング規約

## 0. ドキュメント命名規則

このプロジェクトでは、AIツールが効率的に理解できるよう、統一されたドキュメント命名規則を採用しています。

### ディレクトリ構造

```
docs-template/
├── 00-planning/              # 数字-英語小文字（ハイフン区切り）
│   └── PLANNING_TEMPLATE.md  # 英語大文字.md
├── 01-context/
│   ├── PROJECT.md
│   └── CONSTRAINTS.md
├── 02-design/
│   ├── ARCHITECTURE.md
│   ├── DOMAIN.md
│   ├── DATABASE.md
│   └── API.md
├── 03-implementation/
│   ├── PATTERNS.md
│   ├── CONVENTIONS.md
│   └── INTEGRATIONS.md
└── MASTER.md                  # トップレベルは大文字
```

### ディレクトリ命名規則

- **形式**: `数字-英語小文字（ハイフン区切り）`
- **目的**: AIツールが順序を理解しやすい
- **例**:

  ```
  ✅ 正しい例:
  - 01-context
  - 02-design
  - 03-implementation

  ❌ 間違い例:
  - 01_context        （アンダースコア）
  - 01-Context        （大文字含む）
  - context           （番号なし）
  - 1-context         （ゼロパディングなし）
  ```

### ファイル命名規則

#### メインドキュメント

- **形式**: `英語大文字.md`
- **理由**: AIツールが重要文書として優先的に認識
- **例**:

  ```
  ✅ 正しい例:
  - MASTER.md
  - ARCHITECTURE.md
  - TESTING.md
  - DEPLOYMENT.md

  ❌ 間違い例:
  - master.md         （小文字）
  - Architecture.md   （キャメルケース）
  - testing_guide.md  （アンダースコア、小文字）
  - 01-master.md      （番号プレフィックス）
  ```

#### 特殊ファイル（例外）

- **標準慣習**: `README.md`（GitHubの標準）
- **AIツール設定**:
  - `CLAUDE.md`（Claude Code用）
  - `AGENTS.md`（全AIエージェント共通）
  - `.github/copilot-instructions.md`（GitHub Copilot用）
  - `.cursorrules`（Cursor用）

### 禁止事項

```
❌ 日本語ファイル名
   - 仕様書.md
   - アーキテクチャ.md

❌ スペースを含むファイル名
   - project overview.md
   - test guide.md

❌ アンダースコア区切り
   - project_overview.md
   - test_guide.md
   → ハイフンを使用: project-overview.md

❌ ファイル名への番号プレフィックス
   - 01-architecture.md
   - 02-domain.md
   → ディレクトリで番号管理: 02-design/ARCHITECTURE.md
```

### 命名ガイドライン

#### いつディレクトリを作るか

```
✅ 作成する場合:
- 論理的なグループが3つ以上のファイルを持つ
- 階層的な構造が必要
- AIツールに明確な順序を示したい

例: 02-design/ に ARCHITECTURE.md, DOMAIN.md, DATABASE.md を配置
```

#### いつ大文字ファイル名を使うか

```
✅ 使用する場合:
- プロジェクトの中核文書
- AIツールが頻繁に参照する文書
- MASTER.md, ARCHITECTURE.md, TESTING.md など

❌ 使用しない場合:
- ソースコードファイル（TypeScript, JavaScript等）
- 設定ファイル（package.json, tsconfig.json等）
```

### 実例: プロジェクト全体の構造

```
my-project/
├── .github/
│   └── copilot-instructions.md  # ツール固有の命名
├── .cursorrules                  # ツール固有の命名
├── docs-template/                # ドキュメントテンプレート
│   ├── 00-planning/
│   │   └── PLANNING_TEMPLATE.md
│   ├── 01-context/
│   │   ├── PROJECT.md
│   │   └── CONSTRAINTS.md
│   ├── 02-design/
│   │   ├── ARCHITECTURE.md
│   │   ├── DOMAIN.md
│   │   └── DATABASE.md
│   ├── MASTER.md
│   ├── GETTING_STARTED.md
│   └── SETUP_GITHUB_COPILOT.md
├── src/                          # ソースコード（別の命名規則）
│   ├── domain/
│   ├── application/
│   └── infrastructure/
├── README.md                     # 標準慣習
├── CLAUDE.md                     # AIツール設定
└── AGENTS.md                     # AIツール設定
```

---

## 1. 一般原則

### 基本理念

- **可読性優先**: コードは書く時間より読む時間の方が長い
- **一貫性重視**: プロジェクト全体で統一されたスタイル
- **シンプルさ**: 複雑さより簡潔さを選ぶ
- **明示性**: 暗黙より明示的に

### マジックナンバー禁止

```typescript
// ❌ 悪い例
if (items.length > 100) {
  // 100が何を意味するか不明
}

// ✅ 良い例
const MAX_ITEMS_PER_PAGE = 100;
if (items.length > MAX_ITEMS_PER_PAGE) {
  // 意図が明確
}
```

## 2. ファイル構成

### ディレクトリ構造

```
src/
├── domain/           # ドメイン層
│   ├── entities/    # エンティティ
│   ├── values/      # 値オブジェクト
│   └── services/    # ドメインサービス
├── application/      # アプリケーション層
│   ├── usecases/    # ユースケース
│   └── dtos/        # データ転送オブジェクト
├── infrastructure/   # インフラ層
│   ├── repositories/# リポジトリ実装
│   ├── external/    # 外部サービス
│   └── persistence/ # 永続化
├── presentation/     # プレゼンテーション層
│   ├── controllers/ # コントローラ
│   ├── middleware/  # ミドルウェア
│   └── validators/  # バリデータ
└── shared/          # 共通
    ├── constants/   # 定数
    ├── errors/      # エラー定義
    └── utils/       # ユーティリティ
```

### ファイル命名規則

| 種類             | パターン                | 例                           |
| ---------------- | ----------------------- | ---------------------------- |
| TypeScript       | kebab-case.ts           | user-service.ts              |
| テスト           | kebab-case.spec.ts      | user-service.spec.ts         |
| インターフェース | kebab-case.interface.ts | user-repository.interface.ts |
| 型定義           | kebab-case.type.ts      | user.type.ts                 |
| 定数             | kebab-case.constants.ts | api.constants.ts             |

## 3. TypeScript/JavaScript規約

### 変数・関数命名

```typescript
// 変数: camelCase
const userName: string = "John";
const isActive: boolean = true;

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = "https://api.example.com";

// 関数: camelCase（動詞から始める）
function getUserById(id: string): User {
  // ...
}

// クラス: PascalCase
class UserService {
  // ...
}

// インターフェース: PascalCase（I prefix推奨）
interface IUserRepository {
  // ...
}

// 型: PascalCase
type UserRole = "admin" | "user" | "guest";

// Enum: PascalCase（値はUPPER_SNAKE_CASE）
enum Status {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}
```

### 型定義

```typescript
// 明示的な型定義を推奨
const count: number = 0;
const name: string = "John";
const items: string[] = [];

// 関数の戻り値型は必須
function calculate(a: number, b: number): number {
  return a + b;
}

// インターフェースの活用
interface User {
  id: string;
  email: string;
  profile?: UserProfile; // オプショナルプロパティ
}

// ユニオン型の活用
type Result<T> = { success: true; data: T } | { success: false; error: Error };

// ジェネリクスの活用
function identity<T>(value: T): T {
  return value;
}
```

### 非同期処理

```typescript
// async/awaitを優先
async function fetchUser(id: string): Promise<User> {
  try {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError(`User ${id} not found`);
    }
    return user;
  } catch (error) {
    logger.error("Failed to fetch user", { id, error });
    throw error;
  }
}

// Promise.allで並列処理
async function fetchDashboard(userId: string): Promise<Dashboard> {
  const [user, stats, notifications] = await Promise.all([
    fetchUser(userId),
    fetchStats(userId),
    fetchNotifications(userId),
  ]);

  return { user, stats, notifications };
}
```

### エラーハンドリング

```typescript
// カスタムエラークラス
class ValidationError extends Error {
  constructor(
    message: string,
    public details: any[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

// エラーハンドリング
try {
  await processData(data);
} catch (error) {
  if (error instanceof ValidationError) {
    // バリデーションエラーの処理
    return { success: false, errors: error.details };
  }

  // 予期しないエラー
  logger.error("Unexpected error", error);
  throw new InternalServerError("Processing failed");
}
```

## 4. React/Vue規約

### コンポーネント命名

```tsx
// React: PascalCase
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return <div>{user.name}</div>;
};

// ファイル名もPascalCase
// UserProfile.tsx
```

### Props定義

```tsx
// Props型定義
interface UserProfileProps {
  user: User;
  onEdit?: (user: User) => void;
  className?: string;
}

// デフォルトProps
const defaultProps: Partial<UserProfileProps> = {
  className: "",
};
```

### Hooks使用規則

```tsx
// カスタムHooksは'use'プレフィックス
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(id)
      .then(setUser)
      .finally(() => setLoading(false));
  }, [id]);

  return { user, loading };
}

// Hooks呼び出しは最上位のみ
function UserComponent({ id }: Props) {
  const { user, loading } = useUser(id); // ✅ OK

  if (condition) {
    // const data = useData(); // ❌ NG: 条件内でのHooks呼び出し
  }

  return <div>{user?.name}</div>;
}
```

## 5. CSS/スタイリング規約

### CSS Modules

```scss
// styles.module.scss
.container {
  padding: 16px;

  &__header {
    font-size: 24px;
    font-weight: bold;
  }

  &__content {
    margin-top: 16px;
  }

  &--active {
    background-color: #f0f0f0;
  }
}
```

### CSS-in-JS

```typescript
// styled-components
const Container = styled.div<{ isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.medium};
  background-color: ${({ isActive, theme }) =>
    isActive ? theme.colors.active : theme.colors.default};
`;

// emotion
const containerStyle = css`
  padding: 16px;
  display: flex;
  align-items: center;
`;
```

## 6. データベース規約

### テーブル・カラム命名

```sql
-- テーブル名: 複数形、snake_case
CREATE TABLE users (
  -- カラム名: snake_case
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス: idx_テーブル名_カラム名
CREATE INDEX idx_users_email ON users(email);

-- 外部キー: fk_テーブル名_参照テーブル名
ALTER TABLE orders
ADD CONSTRAINT fk_orders_users
FOREIGN KEY (user_id) REFERENCES users(id);
```

## 7. API規約

### RESTful URL設計

```
GET    /api/v1/users          # 一覧取得
GET    /api/v1/users/:id      # 詳細取得
POST   /api/v1/users          # 作成
PUT    /api/v1/users/:id      # 更新
PATCH  /api/v1/users/:id      # 部分更新
DELETE /api/v1/users/:id      # 削除

# ネストしたリソース
GET    /api/v1/users/:id/posts
POST   /api/v1/users/:id/posts
```

### レスポンス形式

```json
// 成功レスポンス
{
  "success": true,
  "data": {
    "id": "123",
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

## 8. Git規約

### コミットメッセージ

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:

- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- style: フォーマット
- refactor: リファクタリング
- test: テスト
- chore: ビルド・補助ツール

**例**:

```
feat(auth): add OAuth2.0 login support

- Implement Google OAuth integration
- Add login/logout endpoints
- Update user model with provider fields

Closes #123
```

### ブランチ命名

```
feature/user-authentication
bugfix/payment-calculation-error
hotfix/critical-security-patch
release/v1.2.0
```

## 9. テスト規約

### テストファイル構成

```typescript
describe("UserService", () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockRepository = createMock<IUserRepository>();
    service = new UserService(mockRepository);
  });

  describe("findById", () => {
    it("should return user when found", async () => {
      // Arrange
      const expectedUser = { id: "1", name: "John" };
      mockRepository.findById.mockResolvedValue(expectedUser);

      // Act
      const result = await service.findById("1");

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockRepository.findById).toHaveBeenCalledWith("1");
    });

    it("should throw NotFoundError when user not found", async () => {
      // Arrange
      mockRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findById("1")).rejects.toThrow(NotFoundError);
    });
  });
});
```

### テスト命名

```typescript
// テストケース名は具体的に
it("should return 401 when authorization header is missing", () => {});
it("should calculate tax correctly for Japanese residents", () => {});
it("should retry 3 times before failing", () => {});
```

## 10. ドキュメント規約

### JSDoc/TSDoc

````typescript
/**
 * ユーザー情報を取得する
 * @param id - ユーザーID
 * @returns ユーザー情報
 * @throws {NotFoundError} ユーザーが見つからない場合
 * @example
 * ```typescript
 * const user = await getUserById('123');
 * console.log(user.name);
 * ```
 */
async function getUserById(id: string): Promise<User> {
  // ...
}
````

### README構成

```markdown
# プロジェクト名

## 概要

プロジェクトの簡潔な説明

## 必要要件

- Node.js >= 18.0.0
- PostgreSQL >= 14

## セットアップ

\`\`\`bash
npm install
cp .env.example .env
npm run migrate
\`\`\`

## 使用方法

\`\`\`bash
npm run dev
\`\`\`

## テスト

\`\`\`bash
npm test
\`\`\`
```

## 11. セキュリティ規約

### 機密情報の取り扱い

```typescript
// ❌ 悪い例: ハードコーディング
const apiKey = "sk_live_abc123";

// ✅ 良い例: 環境変数
const apiKey = process.env.API_KEY;

// ❌ 悪い例: ログに機密情報
logger.info(`User login: ${email}, password: ${password}`);

// ✅ 良い例: 機密情報をマスク
logger.info(`User login: ${email}`);
```

### 入力検証

```typescript
// 必ず入力を検証
function processUserInput(input: unknown): void {
  // スキーマバリデーション
  const validated = userSchema.parse(input);

  // SQLインジェクション対策
  const user = await db.query(
    "SELECT * FROM users WHERE id = $1",
    [validated.id], // パラメータ化クエリ
  );
}
```
