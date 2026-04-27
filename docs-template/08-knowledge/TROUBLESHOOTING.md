# トラブルシューティング集

この文書は、開発・運用中によく発生する問題とその解決策をまとめた文書です。問題が発生した際に迅速に解決策を見つけられるよう、エラーメッセージや症状から検索できるように整理しています。

## 検索方法

- **エラーメッセージで検索**: `Ctrl+F`でエラーメッセージの一部を検索
- **カテゴリで検索**: 問題の種類から該当セクションを確認
- **緊急度で検索**: 緊急度の高い問題から優先的に確認

---

## データベース関連

### PostgreSQL

#### エラー: "FATAL: sorry, too many clients already"

**緊急度**: 🔴 高  
**症状**: アプリケーションがPostgreSQLに接続できない

**原因**:

- 接続プールの設定が不適切
- 接続リークが発生している
- 同時接続数が上限を超過

**解決策**:

1. **即座の対応**:

   ```bash
   # 現在の接続数を確認
   psql -c "SELECT count(*) FROM pg_stat_activity;"

   # 接続プールを再起動
   sudo systemctl restart your-app-service
   ```

2. **根本的な解決**:

   ```typescript
   // 接続プールの設定を調整
   const poolConfig = {
     max: 20, // 最大接続数
     min: 5, // 最小接続数
     acquireTimeoutMillis: 30000,
     idleTimeoutMillis: 30000,
   };
   ```

3. **接続リークの確認**:

   ```typescript
   // 接続の適切な解放
   try {
     const client = await pool.connect();
     // 処理実行
   } finally {
     client.release(); // 必ず接続を解放
   }
   ```

**予防策**:

- 接続プールの監視を実装
- 定期的な接続リークチェック
- 負荷テストでの検証

---

#### エラー: "deadlock detected"

**緊急度**: 🟡 中  
**症状**: データベース操作でデッドロックが発生

**原因**:

- 複数のトランザクションが同じリソースを異なる順序でロック
- 長時間実行されるトランザクション

**解決策**:

1. **即座の対応**:

   ```sql
   -- デッドロックの詳細を確認
   SELECT * FROM pg_stat_activity WHERE state = 'active';

   -- 問題のあるトランザクションを終了
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active';
   ```

2. **根本的な解決**:

   ```sql
   -- テーブルロックの順序を統一
   BEGIN;
   LOCK TABLE users IN SHARE MODE;
   LOCK TABLE orders IN SHARE MODE;
   -- 処理実行
   COMMIT;
   ```

**予防策**:

- トランザクションの実行時間を短縮
- ロックの順序を統一
- インデックスの最適化

---

### Redis

#### エラー: "Connection refused"

**緊急度**: 🔴 高  
**症状**: Redisサーバーに接続できない

**原因**:

- Redisサーバーが停止している
- ネットワーク接続の問題
- 認証エラー

**解決策**:

1. **即座の対応**:

   ```bash
   # Redisサーバーの状態確認
   sudo systemctl status redis

   # Redisサーバーを起動
   sudo systemctl start redis

   # 接続テスト
   redis-cli ping
   ```

2. **設定確認**:

   ```bash
   # Redis設定ファイルの確認
   sudo nano /etc/redis/redis.conf

   # ポートとバインドアドレスの確認
   grep -E "^(port|bind)" /etc/redis/redis.conf
   ```

**予防策**:

- Redisサーバーの監視設定
- 自動復旧スクリプトの実装
- 接続プールの設定

---

## アプリケーション関連

### Node.js

#### エラー: "JavaScript heap out of memory"

**緊急度**: 🔴 高  
**症状**: アプリケーションがメモリ不足で停止

**原因**:

- 大量のデータを一度に処理
- メモリリークの発生
- ガベージコレクションの不足

**解決策**:

1. **即座の対応**:

   ```bash
   # メモリ制限を増加してアプリケーションを再起動
   node --max-old-space-size=4096 app.js
   ```

2. **根本的な解決**:

   ```typescript
   // ストリーミング処理でメモリ使用量を抑制
   import { createReadStream } from "fs";
   import { parse } from "csv-parse";

   async function processLargeDataset(filePath: string) {
     const stream = createReadStream(filePath)
       .pipe(parse({ headers: true }))
       .on("data", async (row) => {
         await processRow(row);
       });
   }

   // バッチ処理でメモリ使用量を制御
   async function processInBatches(data: any[], batchSize: number = 1000) {
     for (let i = 0; i < data.length; i += batchSize) {
       const batch = data.slice(i, i + batchSize);
       await processBatch(batch);

       if (global.gc) {
         global.gc();
       }
     }
   }
   ```

**予防策**:

- メモリ使用量の監視
- 定期的なガベージコレクション
- 大量データの分割処理

---

#### エラー: "ECONNREFUSED"

**緊急度**: 🟡 中  
**症状**: 外部APIへの接続が失敗

**原因**:

- 外部サービスが停止している
- ネットワーク接続の問題
- ファイアウォールの設定

**解決策**:

1. **即座の対応**:

   ```bash
   # ネットワーク接続の確認
   ping api.example.com
   telnet api.example.com 443

   # DNS解決の確認
   nslookup api.example.com
   ```

2. **アプリケーション側の対応**:

   ```typescript
   // リトライ機能付きHTTPクライアント
   class ResilientHttpClient {
     private async requestWithRetry(
       url: string,
       options: RequestInit,
       maxRetries: number = 3,
     ): Promise<Response> {
       for (let i = 0; i < maxRetries; i++) {
         try {
           const response = await fetch(url, {
             ...options,
             timeout: 5000,
           });

           if (response.ok) {
             return response;
           }
         } catch (error) {
           if (i === maxRetries - 1) {
             throw error;
           }

           await this.sleep(Math.pow(2, i) * 1000);
         }
       }
     }
   }
   ```

**予防策**:

- サーキットブレーカーパターンの実装
- ヘルスチェックの実装
- フォールバック機能の準備

---

### Docker

#### エラー: "Cannot connect to the Docker daemon"

**緊急度**: 🟡 中  
**症状**: Dockerコマンドが実行できない

**原因**:

- Dockerデーモンが停止している
- 権限の問題
- Dockerサービスの設定問題

**解決策**:

1. **即座の対応**:

   ```bash
   # Dockerサービスの状態確認
   sudo systemctl status docker

   # Dockerサービスを起動
   sudo systemctl start docker

   # ユーザーをdockerグループに追加
   sudo usermod -aG docker $USER
   ```

2. **権限の確認**:

   ```bash
   # Dockerソケットの権限確認
   ls -la /var/run/docker.sock

   # 権限を修正
   sudo chmod 666 /var/run/docker.sock
   ```

**予防策**:

- Dockerサービスの自動起動設定
- 適切な権限設定
- 定期的なDockerデーモンの監視

---

## デプロイメント関連

### CI/CD

#### エラー: "Build failed: npm install failed"

**緊急度**: 🟡 中  
**症状**: CI/CDパイプラインでビルドが失敗

**原因**:

- 依存関係の競合
- ネットワーク接続の問題
- パッケージのバージョン問題

**解決策**:

1. **即座の対応**:

   ```bash
   # キャッシュをクリアして再インストール
   rm -rf node_modules package-lock.json
   npm cache clean --force
   npm install
   ```

2. **CI/CD設定の確認**:

   ```yaml
   # .github/workflows/deploy.yml
   - name: Install dependencies
     run: |
       npm ci --cache .npm --prefer-offline
       npm audit fix --audit-level moderate
   ```

**予防策**:

- 依存関係の定期更新
- セキュリティスキャンの自動化
- ビルドキャッシュの活用

---

#### エラー: "Deployment failed: Health check failed"

**緊急度**: 🔴 高  
**症状**: デプロイメント後にヘルスチェックが失敗

**原因**:

- アプリケーションの起動に失敗
- データベース接続の問題
- 設定ファイルの問題

**解決策**:

1. **即座の対応**:

   ```bash
   # アプリケーションのログを確認
   kubectl logs deployment/your-app

   # ヘルスチェックエンドポイントを確認
   curl http://localhost:3000/health
   ```

2. **設定の確認**:

   ```yaml
   # Kubernetes deployment
   livenessProbe:
     httpGet:
       path: /health
       port: 3000
     initialDelaySeconds: 30
     periodSeconds: 10
     timeoutSeconds: 5
     failureThreshold: 3
   ```

**予防策**:

- 段階的なデプロイメント
- ロールバック機能の実装
- 事前のヘルスチェック

---

## セキュリティ関連

### 認証・認可

#### エラー: "JWT token verification failed"

**緊急度**: 🟡 中  
**症状**: JWTトークンの検証に失敗

**原因**:

- トークンの有効期限切れ
- 署名の検証失敗
- アルゴリズムの不一致

**解決策**:

1. **即座の対応**:

   ```bash
   # トークンの内容を確認
   echo "your-jwt-token" | base64 -d
   ```

2. **アプリケーション側の対応**:

   ```typescript
   // 安全なJWT検証
   import jwt from "jsonwebtoken";

   function verifyToken(token: string): any {
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET, {
         algorithms: ["HS256"],
         clockTolerance: 30,
       });

       return decoded;
     } catch (error) {
       throw new Error(`Token verification failed: ${error.message}`);
     }
   }
   ```

**予防策**:

- トークンの有効期限を適切に設定
- アルゴリズムを明示的に指定
- 定期的なセキュリティスキャン

---

### データ保護

#### エラー: "Data encryption failed"

**緊急度**: 🔴 高  
**症状**: 機密データの暗号化に失敗

**原因**:

- 暗号化キーの問題
- アルゴリズムの設定ミス
- データ形式の問題

**解決策**:

1. **即座の対応**:

   ```bash
   # 暗号化キーの確認
   echo $ENCRYPTION_KEY | base64 -d | hexdump -C
   ```

2. **アプリケーション側の対応**:

   ```typescript
   // 安全な暗号化実装
   import crypto from "crypto";

   class DataEncryption {
     private algorithm = "aes-256-gcm";
     private key: Buffer;

     constructor(key: string) {
       this.key = Buffer.from(key, "base64");
     }

     encrypt(data: string): string {
       const iv = crypto.randomBytes(16);
       const cipher = crypto.createCipher(this.algorithm, this.key);
       cipher.setAAD(Buffer.from("additional-data"));

       let encrypted = cipher.update(data, "utf8", "hex");
       encrypted += cipher.final("hex");

       const authTag = cipher.getAuthTag();

       return (
         iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted
       );
     }
   }
   ```

**予防策**:

- 暗号化キーの適切な管理
- 定期的なキーローテーション
- 暗号化アルゴリズムの検証

---

## パフォーマンス関連

### レスポンス時間の遅延

#### 症状: APIレスポンスが5秒以上

**緊急度**: 🟡 中  
**原因**:

- データベースクエリの最適化不足
- 外部APIの応答遅延
- アプリケーションの処理負荷

**解決策**:

1. **即座の対応**:

   ```bash
   # アプリケーションのリソース使用量を確認
   top -p $(pgrep node)

   # データベースの接続数を確認
   psql -c "SELECT count(*) FROM pg_stat_activity;"
   ```

2. **根本的な解決**:

   ```typescript
   // データベースクエリの最適化
   // インデックスの追加
   await db.query(`
     CREATE INDEX CONCURRENTLY idx_users_email 
     ON users(email) WHERE active = true;
   `);

   // クエリの最適化
   const users = await db.query(
     `
     SELECT id, name, email 
     FROM users 
     WHERE active = true 
     AND created_at > $1 
     ORDER BY created_at DESC 
     LIMIT 100
   `,
     [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)],
   );
   ```

**予防策**:

- 定期的なパフォーマンス監視
- データベースクエリの最適化
- キャッシュの活用

---

## 緊急時の連絡先

### 内部連絡先

- **開発チームリード**: 田中 (<tanaka@company.com>) - 090-1234-5678
- **インフラチーム**: 佐藤 (<sato@company.com>) - 090-2345-6789
- **セキュリティチーム**: 山田 (<yamada@company.com>) - 090-3456-7890

### 外部連絡先

- **クラウドプロバイダー**: AWS Support - 24時間対応
- **データベースプロバイダー**: PostgreSQL Support
- **監視サービス**: DataDog Support

### エスカレーション手順

1. **Level 1**: 開発チームでの対応（30分以内）
2. **Level 2**: インフラチームへのエスカレーション（1時間以内）
3. **Level 3**: 外部サポートへの連絡（2時間以内）

---

## 更新履歴

| 日付       | 更新者 | 更新内容                         |
| ---------- | ------ | -------------------------------- |
| 2024-01-15 | 田中   | データベース関連の問題を追加     |
| 2024-01-20 | 佐藤   | アプリケーション関連の問題を追加 |
| 2024-01-25 | 山田   | セキュリティ関連の問題を追加     |
| 2024-02-01 | 田中   | デプロイメント関連の問題を追加   |
| 2024-02-05 | 佐藤   | パフォーマンス関連の問題を追加   |
| 2024-02-10 | 山田   | 緊急時連絡先を追加               |
