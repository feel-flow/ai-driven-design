# よくある質問と回答

この文書は、プロジェクト開発・運用中によくある質問とその回答をまとめた文書です。新規メンバーのオンボーディングや、日常的な疑問解決に活用してください。

## 目次

- [開発環境](#開発環境)
- [コーディング](#コーディング)
- [データベース](#データベース)
- [API](#api)
- [テスト](#テスト)
- [デプロイメント](#デプロイメント)
- [トラブルシューティング](#トラブルシューティング)
- [プロジェクト管理](#プロジェクト管理)

---

## 開発環境

### Q: 開発環境のセットアップはどうすればよいですか？

**A**: 以下の手順でセットアップしてください：

1. **リポジトリのクローン**

   ```bash
   git clone https://github.com/your-org/your-project.git
   cd your-project
   ```

2. **依存関係のインストール**

   ```bash
   npm install
   # または
   yarn install
   ```

3. **環境変数の設定**

   ```bash
   cp .env.example .env
   # .envファイルを編集して必要な値を設定
   ```

4. **データベースのセットアップ**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **アプリケーションの起動**

   ```bash
   npm run dev
   ```

詳細は [GETTING_STARTED.md](../GETTING_STARTED.md) を参照してください。

---

### Q: 新しいブランチを作成する際の命名規則は？

**A**: 以下の命名規則に従ってください：

- **機能開発**: `feature/機能名` (例: `feature/user-authentication`)
- **バグ修正**: `fix/バグの説明` (例: `fix/login-validation-error`)
- **ホットフィックス**: `hotfix/緊急修正の説明` (例: `hotfix/security-patch`)
- **リファクタリング**: `refactor/リファクタリングの説明` (例: `refactor/database-query-optimization`)

---

### Q: コードレビューの依頼はどのタイミングで行えばよいですか？

**A**: 以下の条件を満たした時点でプルリクエストを作成してください：

- [ ] 機能が完全に実装されている
- [ ] 単体テストが作成され、すべて通っている
- [ ] リンターエラーがない
- [ ] コミットメッセージが適切に書かれている
- [ ] 自己レビューを完了している

---

## コーディング

### Q: TypeScriptでany型を使いたい場合はどうすればよいですか？

**A**: 基本的にany型の使用は禁止ですが、やむを得ない場合は以下の手順を踏んでください：

1. **代替手段を検討**

   ```typescript
   // ❌ 避けるべき
   const data: any = response.data;

   // ✅ 推奨
   interface ApiResponse {
     data: unknown;
   }
   const data: ApiResponse = response.data;
   ```

2. **やむを得ない場合はコメントで理由を明記**

   ```typescript
   // 外部ライブラリの型定義が不完全なため、一時的にany型を使用
   // TODO: 適切な型定義を作成する
   const externalData: any = externalLibrary.getData();
   ```

3. **型アサーションを使用**

   ```typescript
   const data = response.data as User;
   ```

---

### Q: エラーハンドリングはどのように実装すればよいですか？

**A**: Resultパターンを使用してエラーハンドリングを実装してください：

```typescript
// エラーハンドリングの実装例
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

// 使用例
const result = await createUser(userData);
if (result.success) {
  console.log("User created:", result.data);
} else {
  console.error("Error:", result.error.message);
}
```

詳細は [BEST_PRACTICES.md](./BEST_PRACTICES.md) を参照してください。

---

### Q: マジックナンバーを避けるにはどうすればよいですか？

**A**: 意味のある数値は定数として定義し、設定から注入してください：

```typescript
// ❌ 避けるべき
if (user.age > 18) {
  // 処理
}

// ✅ 推奨
const MINIMUM_AGE = 18; // 成人年齢（歳）
if (user.age > MINIMUM_AGE) {
  // 処理
}

// 設定から注入
const config = {
  user: {
    minimumAge: parseInt(process.env.MINIMUM_AGE || "18"),
    maxRetryCount: parseInt(process.env.MAX_RETRY_COUNT || "3"),
  },
};
```

---

## データベース

### Q: データベースマイグレーションはどのように実行すればよいですか？

**A**: 以下の手順でマイグレーションを実行してください：

1. **マイグレーションファイルの作成**

   ```bash
   npm run db:migrate:create add_user_table
   ```

2. **マイグレーションの実行**

   ```bash
   # 開発環境
   npm run db:migrate

   # 本番環境
   npm run db:migrate:prod
   ```

3. **ロールバック**

   ```bash
   npm run db:rollback
   ```

**注意事項**:

- 本番環境では必ずバックアップを取得してから実行
- マイグレーションは段階的に実行
- ロールバック手順を事前に確認

---

### Q: データベースクエリのパフォーマンスを改善するには？

**A**: 以下の方法でパフォーマンスを改善できます：

1. **インデックスの追加**

   ```sql
   CREATE INDEX CONCURRENTLY idx_users_email_active
   ON users(email) WHERE active = true;
   ```

2. **クエリの最適化**

   ```sql
   -- ❌ 避けるべき
   SELECT * FROM users WHERE LOWER(email) = LOWER($1);

   -- ✅ 推奨
   SELECT id, name, email FROM users WHERE email = $1;
   ```

3. **N+1クエリ問題の回避**

   ```typescript
   // ❌ 避けるべき
   const users = await userRepository.findAll();
   for (const user of users) {
     user.posts = await postRepository.findByUserId(user.id);
   }

   // ✅ 推奨
   const users = await userRepository.findAllWithPosts();
   ```

---

### Q: データベース接続エラーが発生した場合は？

**A**: 以下の手順で対処してください：

1. **接続状態の確認**

   ```bash
   psql -c "SELECT 1;"
   ```

2. **接続プールの確認**

   ```bash
   psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **アプリケーションの再起動**

   ```bash
   sudo systemctl restart your-app-service
   ```

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。

---

## API

### Q: APIエンドポイントの設計で注意すべき点は？

**A**: 以下の点に注意してAPIを設計してください：

1. **RESTfulな設計**

   ```typescript
   // ✅ 推奨
   GET    /api/users          // ユーザー一覧取得
   GET    /api/users/:id      // 特定ユーザー取得
   POST   /api/users          // ユーザー作成
   PUT    /api/users/:id      // ユーザー更新
   DELETE /api/users/:id      // ユーザー削除
   ```

2. **適切なHTTPステータスコード**

   ```typescript
   // 200: 成功
   res.status(200).json(data);

   // 201: 作成成功
   res.status(201).json(createdData);

   // 400: バリデーションエラー
   res.status(400).json({ error: "Validation failed" });

   // 404: リソースが見つからない
   res.status(404).json({ error: "User not found" });
   ```

3. **一貫性のあるレスポンス形式**

   ```typescript
   // 成功レスポンス
   {
     "success": true,
     "data": { ... },
     "message": "User created successfully"
   }

   // エラーレスポンス
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid email format",
       "details": { ... }
     }
   }
   ```

---

### Q: APIのレート制限はどのように実装すればよいですか？

**A**: Redisを使用してレート制限を実装してください：

```typescript
import Redis from "ioredis";

class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });
  }

  async checkLimit(
    key: string,
    limit: number,
    window: number,
  ): Promise<boolean> {
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, window);
    }

    return current <= limit;
  }
}

// ミドルウェアでの使用
const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const key = `rate_limit:${req.ip}`;
  const limit = 100; // 1時間あたり100リクエスト
  const window = 3600; // 1時間（秒）

  const allowed = await rateLimiter.checkLimit(key, limit, window);

  if (!allowed) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  next();
};
```

---

## テスト

### Q: テストの書き方は？

**A**: AAAパターン（Arrange-Act-Assert）に従ってテストを書いてください：

```typescript
describe("UserService", () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Arrange: テストの準備
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
    };
    userService = new UserService(mockRepository);
  });

  describe("createUser", () => {
    it("should create a user with valid data", async () => {
      // Arrange: テストデータの準備
      const userData = {
        name: "John Doe",
        email: "john@example.com",
      };
      const expectedUser = { id: "1", ...userData };
      mockRepository.create.mockResolvedValue(expectedUser);

      // Act: テスト対象の実行
      const result = await userService.createUser(userData);

      // Assert: 結果の検証
      expect(result.success).toBe(true);
      expect(result.data).toEqual(expectedUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
    });
  });
});
```

詳細は [TESTING.md](../04-quality/TESTING.md) を参照してください。

---

### Q: テストカバレッジはどの程度を目標にすればよいですか？

**A**: 以下のカバレッジを目標にしてください：

- **単体テスト**: 80%以上
- **統合テスト**: 60%以上
- **E2Eテスト**: 主要なユーザージャーニーをカバー

カバレッジの確認方法：

```bash
npm run test:coverage
```

---

## デプロイメント

### Q: 本番環境へのデプロイ手順は？

**A**: 以下の手順でデプロイしてください：

1. **事前準備**

   ```bash
   # テストの実行
   npm run test
   npm run test:e2e

   # ビルドの確認
   npm run build
   ```

2. **デプロイの実行**

   ```bash
   # ステージング環境
   npm run deploy:staging

   # 本番環境
   npm run deploy:production
   ```

3. **デプロイ後の確認**

   ```bash
   # ヘルスチェック
   curl https://your-app.com/health

   # ログの確認
   kubectl logs deployment/your-app
   ```

詳細は [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) を参照してください。

---

### Q: ロールバックはどのように実行すればよいですか？

**A**: 以下の手順でロールバックを実行してください：

1. **現在のバージョンの確認**

   ```bash
   kubectl get deployment your-app -o jsonpath='{.spec.template.spec.containers[0].image}'
   ```

2. **ロールバックの実行**

   ```bash
   # 前のバージョンにロールバック
   kubectl rollout undo deployment/your-app

   # 特定のバージョンにロールバック
   kubectl rollout undo deployment/your-app --to-revision=2
   ```

3. **ロールバックの確認**

   ```bash
   kubectl rollout status deployment/your-app
   ```

---

## トラブルシューティング

### Q: アプリケーションが起動しない場合は？

**A**: 以下の手順で問題を特定してください：

1. **ログの確認**

   ```bash
   # アプリケーションログ
   kubectl logs deployment/your-app

   # システムログ
   journalctl -u your-app-service
   ```

2. **リソースの確認**

   ```bash
   # メモリ使用量
   kubectl top pods

   # ディスク使用量
   df -h
   ```

3. **設定の確認**

   ```bash
   # 環境変数
   kubectl describe pod your-app-pod

   # 設定ファイル
   kubectl get configmap your-app-config -o yaml
   ```

詳細は [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) を参照してください。

---

### Q: データベース接続が不安定な場合は？

**A**: 以下の手順で対処してください：

1. **接続プールの確認**

   ```sql
   SELECT count(*) FROM pg_stat_activity;
   SELECT * FROM pg_stat_activity WHERE state = 'active';
   ```

2. **接続設定の調整**

   ```typescript
   const poolConfig = {
     max: 20,
     min: 5,
     acquireTimeoutMillis: 30000,
     idleTimeoutMillis: 30000,
   };
   ```

3. **監視の設定**

   ```typescript
   // 接続プールの監視
   pool.on("connect", () => {
     console.log("New client connected");
   });

   pool.on("error", (err) => {
     console.error("Unexpected error on idle client", err);
   });
   ```

---

## プロジェクト管理

### Q: タスクの優先順位はどのように決めればよいですか？

**A**: 以下の基準で優先順位を決定してください：

1. **緊急度**
   - 🔴 高: セキュリティ問題、本番障害
   - 🟡 中: 機能改善、パフォーマンス向上
   - 🟢 低: リファクタリング、ドキュメント整備

2. **重要度**
   - ビジネス価値の高い機能
   - ユーザーエクスペリエンスの向上
   - 技術的負債の解消

3. **依存関係**
   - 他のタスクに影響するもの
   - リリースに必要なもの

詳細は [TASKS.md](../07-project-management/TASKS.md) を参照してください。

---

### Q: コードレビューの時間はどの程度かければよいですか？

**A**: 以下の時間を目安にしてください：

- **小規模な変更**: 15-30分
- **中規模な変更**: 30-60分
- **大規模な変更**: 60-120分

**効率的なレビューのコツ**:

- 変更内容を事前に把握
- 自動化できる部分は自動化
- レビューの観点を明確化
- フィードバックは具体的に

---

## その他

### Q: 新しい技術を導入する際の手順は？

**A**: 以下の手順で技術導入を進めてください：

1. **技術調査**
   - 公式ドキュメントの確認
   - コミュニティの評価
   - 既存システムとの互換性

2. **プロトタイプの作成**
   - 小規模な実装
   - パフォーマンステスト
   - セキュリティ評価

3. **チームでの検討**
   - 技術選定会議
   - 学習コストの評価
   - メンテナンス性の検討

4. **段階的な導入**
   - 非本番環境での検証
   - 本番環境での部分導入
   - 全体的な移行

---

### Q: ドキュメントの更新はどのタイミングで行えばよいですか？

**A**: 以下のタイミングでドキュメントを更新してください：

- **機能追加時**: 関連するドキュメントを即座に更新
- **バグ修正時**: 修正内容をLESSONS_LEARNED.mdに記録
- **週次**: ナレッジ文書の整理と更新
- **月次**: 全体のドキュメントの見直し

---

## 更新履歴

| 日付       | 更新者 | 更新内容                              |
| ---------- | ------ | ------------------------------------- |
| 2024-01-15 | 田中   | 初版作成                              |
| 2024-01-20 | 佐藤   | 開発環境関連のQ&Aを追加               |
| 2024-01-25 | 山田   | コーディング関連のQ&Aを追加           |
| 2024-02-01 | 田中   | データベース関連のQ&Aを追加           |
| 2024-02-05 | 佐藤   | API関連のQ&Aを追加                    |
| 2024-02-10 | 山田   | テスト関連のQ&Aを追加                 |
| 2024-02-15 | 田中   | デプロイメント関連のQ&Aを追加         |
| 2024-02-20 | 佐藤   | トラブルシューティング関連のQ&Aを追加 |
| 2024-02-25 | 山田   | プロジェクト管理関連のQ&Aを追加       |
