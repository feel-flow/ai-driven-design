# パフォーマンスとオペレーション

> **Parent**: [BEST_PRACTICES.md](../BEST_PRACTICES.md)

この文書は、パフォーマンス最適化、ログ・監視設計、アーキテクチャパターン、Gitワークフロー最適化に関するベストプラクティスをまとめています。

---

## パフォーマンス最適化

### キャッシュ戦略

#### 推奨: Redis キャッシュの実装

```typescript
import Redis from "ioredis";

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

// キャッシュ付きサービス
class CachedUserService {
  constructor(
    private userRepository: UserRepository,
    private cache: CacheService,
  ) {}

  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;

    // キャッシュから取得を試行
    let user = await this.cache.get<User>(cacheKey);
    if (user) {
      return user;
    }

    // データベースから取得
    user = await this.userRepository.findById(id);
    if (user) {
      await this.cache.set(cacheKey, user, 3600); // 1時間キャッシュ
    }

    return user;
  }
}
```

#### 避けるべき: キャッシュの不適切な使用

```typescript
async function getUser(id: string) {
  // キャッシュの有効期限なし
  const cached = await redis.get(`user:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }

  const user = await db.query("SELECT * FROM users WHERE id = $1", [id]);
  await redis.set(`user:${id}`, JSON.stringify(user));
  return user;
}
```

**問題点**:

- TTL（有効期限）が設定されていない
- キャッシュ無効化戦略がない
- エラーハンドリングが不足

---

### 非同期処理の最適化

#### 推奨: Promise.all の適切な使用

```typescript
// 並列処理で効率化
async function processUsers(userIds: string[]): Promise<User[]> {
  const users = await Promise.all(
    userIds.map((id) => userRepository.findById(id)),
  );

  return users.filter((user) => user !== null) as User[];
}

// 並行処理の制御（過負荷防止）
async function processBatch<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  concurrency: number = 5,
): Promise<void> {
  const semaphore = new Semaphore(concurrency);

  await Promise.all(
    items.map((item) =>
      semaphore.acquire().then(async (release) => {
        try {
          await processor(item);
        } finally {
          release();
        }
      }),
    ),
  );
}
```

#### 避けるべき: 順次処理（非効率）

```typescript
async function processUsersSequentially(userIds: string[]): Promise<User[]> {
  const users: User[] = [];
  for (const id of userIds) {
    const user = await userRepository.findById(id);
    if (user) {
      users.push(user);
    }
  }
  return users;
}
```

**問題点**:

- 順次実行のため処理時間が線形増加
- I/O待機時間を有効活用できていない

---

## ログ・監視設計

### 構造化ログの実装

#### 推奨: Winston による構造化ログ

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// アプリケーションログ
class UserService {
  async createUser(userData: CreateUserRequest): Promise<Result<User>> {
    logger.info("Creating user", {
      email: userData.email,
      requestId: req.id,
    });

    try {
      const user = await this.userRepository.create(userData);

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
        requestId: req.id,
      });

      return { success: true, data: user };
    } catch (error) {
      logger.error("Failed to create user", {
        error: error.message,
        stack: error.stack,
        userData: { email: userData.email },
        requestId: req.id,
      });

      return { success: false, error };
    }
  }
}
```

**ログの原則**:

- **構造化**: JSON形式で検索可能
- **コンテキスト**: requestId などで追跡可能
- **セキュリティ**: パスワードなどの機密情報は記録しない
- **レベル分け**: info, warn, error を適切に使い分け

#### 避けるべき: 非構造化ログ

```typescript
console.log("User created"); // 構造化されていない
console.error(error); // スタックトレースなし
logger.info("Processing data", { password: userData.password }); // 機密情報のログ
```

**問題点**:

- 検索・分析が困難
- トレーサビリティがない
- セキュリティリスク

---

### メトリクス収集

#### 推奨: アプリケーションメトリクス

```typescript
import { Counter, Histogram } from "prom-client";

// リクエスト数カウンター
const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
});

// レスポンス時間ヒストグラム
const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "path"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// ミドルウェア
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;

    httpRequestsTotal.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      { method: req.method, path: req.route?.path || req.path },
      duration,
    );
  });

  next();
});
```

**メトリクスの種類**:

- **Counter**: 累積値（リクエスト数、エラー数）
- **Gauge**: 現在値（CPU使用率、メモリ使用量）
- **Histogram**: 分布（レスポンス時間、ペイロードサイズ）

---

## アーキテクチャパターン

### レイヤーアーキテクチャ

#### 推奨: 責務の明確な分離

```
src/
├── controllers/     # プレゼンテーション層
├── services/        # アプリケーション層
├── repositories/    # インフラストラクチャ層
├── entities/        # ドメイン層
└── types/          # 型定義
```

**各層の責務**:

| 層               | 責務                                             | 例                                  |
| ---------------- | ------------------------------------------------ | ----------------------------------- |
| **Controllers**  | HTTPリクエストの処理、バリデーション、レスポンス | ルーティング、リクエストパース      |
| **Services**     | ビジネスロジック、トランザクション管理           | ユーザー登録処理、注文処理          |
| **Repositories** | データアクセス、永続化                           | データベースクエリ、外部API呼び出し |
| **Entities**     | ドメインオブジェクト、ビジネスルール             | User, Product エンティティ          |

**原則**:

- 上位層は下位層に依存できるが、逆は禁止
- 各層は単一責任を持つ
- インターフェースで層間を疎結合に保つ

---

### 依存性注入（DI）パターン

#### 推奨: インターフェースベースの設計

```typescript
// インターフェースの定義
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}

// サービスの実装
class UserService {
  constructor(private userRepository: UserRepository) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

// 依存性の注入
const userRepository = new PostgresUserRepository(db);
const userService = new UserService(userRepository);
```

**利点**:

- テストが容易（モックに置き換え可能）
- 実装の切り替えが簡単
- 疎結合で保守性向上

#### 避けるべき: 直接的な依存

```typescript
class UserService {
  async findById(id: string): Promise<User | null> {
    // 直接データベースに依存
    return db.query("SELECT * FROM users WHERE id = $1", [id]);
  }
}
```

**問題点**:

- テストが困難（実データベースが必要）
- 実装変更が困難
- 密結合で保守性低下

---

## Gitワークフロー最適化

### Claude Code SessionStart Hook

#### 推奨: PRマージ後の自動チェック

PRマージ後のブランチ切り替え忘れを防ぐため、SessionStart hookを設定します。

```json
// .claude/settings.json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/check-branch-status.sh",
        "description": "Check git branch status and warn if needed"
      }
    ]
  }
}
```

**Hook スクリプト例**:

```bash
#!/bin/bash
# .claude/hooks/check-branch-status.sh

current_branch=$(git branch --show-current)
main_branch="develop"

# マージ済みブランチかチェック
if [ "$current_branch" != "$main_branch" ]; then
  merged=$(git branch --merged $main_branch | grep "^[* ]*$current_branch$")

  if [ -n "$merged" ]; then
    echo "⚠️ Warning: Current branch '$current_branch' has been merged to $main_branch"
    echo "Consider switching to $main_branch: git checkout $main_branch && git pull"
  fi
fi
```

**利点**:

- PRマージ済みブランチでの作業を防止
- 常に最新のdevelopブランチから作業開始
- マージ忘れやブランチ混乱を削減

詳細は [DEPLOYMENT.md](../../05-operations/DEPLOYMENT.md) の「開発環境の最適化」セクションを参照してください。

---

### ブランチ命名規則

#### 推奨: Issue番号を含む命名

```bash
# 機能開発
feature/#123-add-user-authentication

# バグ修正
fix/#124-correct-login-validation

# その他のタスク
chore/#125-update-dependencies
```

**命名規則の利点**:

- Issue とブランチの紐付けが明確
- PRの自動リンクが機能
- 作業内容が一目で分かる

#### 避けるべき: 曖昧な命名

```bash
# Issue番号なし
feature/add-user-auth

# 曖昧な命名
fix/bug
update/stuff
```

**問題点**:

- 作業内容が不明確
- Issue との紐付けができない
- ブランチ管理が困難

---

### コミットメッセージ規約

#### 推奨: Conventional Commits

```bash
# 形式
<type>(#<issue-number>): <subject>

# 例
feat(#123): ユーザー認証機能を追加
fix(#124): ログインバリデーションを修正
chore(#125): 依存パッケージを更新
```

**Type の種類**:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードフォーマット
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・ツール関連

---

## 更新履歴

| 日付       | 更新者   | 更新内容                         |
| ---------- | -------- | -------------------------------- |
| 2025-01-15 | システム | BEST_PRACTICES.md から分離・作成 |
