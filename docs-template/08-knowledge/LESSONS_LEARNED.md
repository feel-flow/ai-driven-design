# 開発過程で得た知見・解決策

この文書は、プロジェクトの開発過程で発生した問題とその解決策、学んだ教訓を記録する文書です。AIが過去の解決策を参照して類似問題を効率的に解決できるよう、具体的で実装可能な内容を記載します。

## 記録のルール

- **即座に記録**: 問題が発生したら解決と同時に記録
- **具体的に記述**: 抽象的な説明ではなく、具体的な手順とコード例を含める
- **検索しやすく**: キーワードを明確にし、カテゴリ分けする
- **定期的に整理**: 週次で内容を見直し、重複や古い情報を整理

---

## 技術的問題と解決策

### データベース関連

#### 問題: PostgreSQLの接続プールが枯渇する

**発生日**: 2024-01-15  
**解決日**: 2024-01-15  
**解決時間**: 2時間

**問題の詳細**:

- アプリケーションが高負荷時にPostgreSQLへの接続エラーが発生
- エラーメッセージ: "FATAL: sorry, too many clients already"
- 接続プールの設定が不適切だった

**試行した解決策**:

1. 接続プールサイズを増加 → 効果なし
2. 接続タイムアウトを調整 → 一時的な改善
3. 接続リークの調査 → 根本原因を発見

**最終的な解決策**:

```typescript
// 接続プールの適切な設定
const poolConfig = {
  max: 20, // 最大接続数
  min: 5, // 最小接続数
  acquireTimeoutMillis: 30000, // 接続取得タイムアウト
  idleTimeoutMillis: 30000, // アイドル接続タイムアウト
  connectionTimeoutMillis: 2000, // 接続確立タイムアウト
};

// 接続の適切な解放
try {
  const client = await pool.connect();
  // 処理実行
} finally {
  client.release(); // 必ず接続を解放
}
```

**学んだ教訓**:

- 接続プールの設定は負荷テストで検証する
- 接続リークの監視を実装する
- エラーハンドリングで必ず接続を解放する

**関連ファイル**:

- `src/database/connection.ts`
- `src/config/database.ts`

---

#### 問題: マイグレーション実行時のデッドロック

**発生日**: 2024-01-20  
**解決日**: 2024-01-20  
**解決時間**: 1時間

**問題の詳細**:

- 本番環境でのマイグレーション実行時にデッドロックが発生
- 複数のテーブルを同時に変更するマイグレーションで発生

**解決策**:

```sql
-- テーブルロックの順序を統一
BEGIN;
LOCK TABLE users IN SHARE MODE;
LOCK TABLE orders IN SHARE MODE;
-- マイグレーション実行
COMMIT;
```

**学んだ教訓**:

- マイグレーションは本番環境でテストする
- テーブルロックの順序を統一する
- ロールバック手順を事前に準備する

---

### API関連

#### 問題: レート制限の実装でメモリリークが発生

**発生日**: 2024-01-25  
**解決日**: 2024-01-25  
**解決時間**: 3時間

**問題の詳細**:

- レート制限用のメモリキャッシュが無制限に増加
- 長時間稼働後にメモリ不足でアプリケーションが停止

**解決策**:

```typescript
// Redisを使用したレート制限実装
import Redis from "ioredis";

class RateLimiter {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || "6379"),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
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
```

**学んだ教訓**:

- メモリベースのキャッシュは本番環境では危険
- Redisなどの外部ストレージを使用する
- キャッシュの有効期限を必ず設定する

---

## アーキテクチャ関連

### 問題: マイクロサービス間の通信でタイムアウトが頻発

**発生日**: 2024-02-01  
**解決日**: 2024-02-03  
**解決時間**: 8時間

**問題の詳細**:

- サービスAからサービスBへのHTTPリクエストでタイムアウトが頻発
- ネットワーク遅延とサービスBの処理時間が原因

**解決策**:

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
          timeout: 5000, // 5秒タイムアウト
        });

        if (response.ok) {
          return response;
        }

        // 4xxエラーはリトライしない
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`Client error: ${response.status}`);
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }

        // 指数バックオフでリトライ間隔を調整
        await this.sleep(Math.pow(2, i) * 1000);
      }
    }

    throw new Error("Max retries exceeded");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

**学んだ教訓**:

- マイクロサービス間通信にはリトライ機能が必須
- 指数バックオフでリトライ間隔を調整する
- 4xxエラーはリトライしない
- サーキットブレーカーパターンの導入を検討

---

## パフォーマンス関連

### 問題: 大量データの処理でメモリ不足が発生

**発生日**: 2024-02-10  
**解決日**: 2024-02-10  
**解決時間**: 4時間

**問題の詳細**:

- 10万件のデータを一度に処理してメモリ不足が発生
- Node.jsのメモリ制限（デフォルト1.4GB）を超過

**解決策**:

```typescript
// ストリーミング処理でメモリ使用量を抑制
import { createReadStream } from "fs";
import { parse } from "csv-parse";

async function processLargeDataset(filePath: string) {
  const stream = createReadStream(filePath)
    .pipe(parse({ headers: true }))
    .on("data", async (row) => {
      // 1行ずつ処理
      await processRow(row);
    })
    .on("end", () => {
      console.log("Processing completed");
    })
    .on("error", (error) => {
      console.error("Error:", error);
    });
}

// バッチ処理でメモリ使用量を制御
async function processInBatches(data: any[], batchSize: number = 1000) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await processBatch(batch);

    // ガベージコレクションを促す
    if (global.gc) {
      global.gc();
    }
  }
}
```

**学んだ教訓**:

- 大量データはストリーミング処理で処理する
- バッチサイズを適切に設定する
- メモリ使用量を監視する
- ガベージコレクションを適切に実行する

---

## セキュリティ関連

### 問題: JWTトークンの検証で脆弱性が発見

**発生日**: 2024-02-15  
**解決日**: 2024-02-15  
**解決時間**: 2時間

**問題の詳細**:

- JWTトークンの署名検証が不適切
- アルゴリズム指定なしでトークンを検証していた

**解決策**:

```typescript
// 安全なJWT検証実装
import jwt from "jsonwebtoken";

class SecureJWTValidator {
  private readonly secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  verifyToken(token: string): any {
    try {
      // アルゴリズムを明示的に指定
      const decoded = jwt.verify(token, this.secretKey, {
        algorithms: ["HS256"], // 使用するアルゴリズムを明示
        clockTolerance: 30, // 時刻の許容誤差（秒）
      });

      return decoded;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // トークンの有効性を追加チェック
  validateTokenPayload(payload: any): boolean {
    const now = Math.floor(Date.now() / 1000);

    // 有効期限チェック
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // 発行時刻チェック
    if (payload.iat && payload.iat > now) {
      return false;
    }

    return true;
  }
}
```

**学んだ教訓**:

- JWTのアルゴリズムは明示的に指定する
- トークンの有効期限を必ずチェックする
- セキュリティスキャンを定期的に実行する
- 秘密鍵の管理を適切に行う

---

## デプロイメント関連

### 問題: ブルーグリーンデプロイメントでデータベースマイグレーションが失敗

**発生日**: 2024-02-20  
**解決日**: 2024-02-20  
**解決時間**: 3時間

**問題の詳細**:

- 新バージョンのデプロイ時にデータベースマイグレーションが失敗
- ロールバック時にデータの整合性が保てない

**解決策**:

```yaml
# デプロイメント戦略の改善
deployment_strategy:
  pre_deployment:
    - backup_database
    - run_migration_dry_run
    - validate_migration_plan

  deployment:
    - run_migration
    - deploy_application
    - health_check

  post_deployment:
    - verify_data_integrity
    - update_monitoring_alerts

  rollback:
    - stop_application
    - restore_database_backup
    - deploy_previous_version
    - verify_rollback_success
```

**学んだ教訓**:

- マイグレーションは事前にドライランでテストする
- データベースのバックアップを必ず取得する
- ロールバック手順を事前に準備する
- 段階的なデプロイメントを検討する

---

## チーム協働関連

### 問題: コードレビューの品質が低下

**発生日**: 2024-02-25  
**解決日**: 2024-03-01  
**解決時間**: 1週間

**問題の詳細**:

- コードレビューの時間が短縮され、品質が低下
- レビュアーの負荷が集中している

**解決策**:

```markdown
# コードレビューガイドライン

## 必須チェック項目

- [ ] セキュリティ要件の遵守
- [ ] パフォーマンスへの影響
- [ ] テストカバレッジの確保
- [ ] ドキュメントの更新

## レビュープロセス

1. 自動テストの実行
2. 静的解析ツールの実行
3. セキュリティスキャンの実行
4. 人間によるコードレビュー
5. 承認後のマージ

## レビュアーの割り当て

- セキュリティ関連: セキュリティチーム
- パフォーマンス関連: インフラチーム
- ビジネスロジック: ドメインエキスパート
- 全般的な品質: シニア開発者
```

**学んだ教訓**:

- コードレビューのガイドラインを明確化する
- 自動化できる部分は自動化する
- レビュアーの負荷を分散する
- 定期的にプロセスを見直す

---

## 今後の改善点

### 短期（1ヶ月以内）

- [ ] エラーログの自動分析システムを構築
- [ ] パフォーマンス監視ダッシュボードを改善
- [ ] セキュリティスキャンの自動化

### 中期（3ヶ月以内）

- [ ] 障害対応の自動化を拡充
- [ ] 予測分析による問題の早期発見
- [ ] チーム間の知識共有システムの構築

### 長期（6ヶ月以内）

- [ ] AIを活用した問題解決支援システム
- [ ] 自動回復機能の実装
- [ ] 継続的学習システムの構築

---

## 更新履歴

| 日付       | 更新者             | 更新内容                                               |
| ---------- | ------------------ | ------------------------------------------------------ |
| 2024-01-15 | 田中               | データベース接続プール問題の記録                       |
| 2024-01-20 | 佐藤               | マイグレーションデッドロック問題の記録                 |
| 2024-01-25 | 山田               | レート制限メモリリーク問題の記録                       |
| 2024-02-01 | 田中               | マイクロサービス通信問題の記録                         |
| 2024-02-10 | 佐藤               | 大量データ処理問題の記録                               |
| 2024-02-15 | 山田               | JWTセキュリティ問題の記録                              |
| 2024-02-20 | 田中               | デプロイメント問題の記録                               |
| 2024-02-25 | 佐藤               | コードレビュー問題の記録                               |
| 2025-10-16 | ドキュメントチーム | ai_spec_driven_development.md 再構築 (v2.0.0) 学び追記 |

---

## ドキュメント再構築 (v2.0.0) による学び

### 背景

`ai_spec_driven_development.md` が長文化し (>2000 行) AIエージェントの初期解析コスト増 / レビュー難 / 重複情報増大 / パッチ衝突頻発 を招いていた。

### 目標

- 初期コンテキスト読込時間削減
- 差分レビューの焦点化 (重要度ラベル導入)
- 自動化 (MUST コマンド列挙) によるエージェント動作の決定性向上
- 文書間参照正規化 (DRY)

### 実施内容

1. フロントマター標準化 (id, version, changeImpact 等)
2. セクション切り出し (目的/分類マトリクス/更新ポリシー/チェックリスト)
3. 変更インパクトレベル (LOW/MEDIUM/HIGH) 導入
4. 冗長ナラティブ削除 + Revision History 簡潔化
5. CHANGELOG / ADR / Lessons 同期 (トレーサビリティ確保)

### 効果 (初期実測 / 推定値)

- 初期AI解析時間: 約 ~60% 削減 (長文再生成頻度低下)
- レビューコメント数: 冗長説明削除により不要指摘が減少 (定量化継続)
- 衝突率: 巨大単一パッチ→局所差分へ移行でマージコンフリクト低下 (観測中)

### 発見した課題

- Impact Level の判断が執筆者でばらつく可能性 (ガイドラインの定量指標整備必要)
- PR テンプレート未更新 (自動チェック未導入)
- 構造検証 (セクション順/必須フィールド) を手動で実施 → 自動化余地あり

### 次の改善案

- ドキュメント構造静的検証スクリプト (必須セクション/Frontmatter schema/Impact Level 妥当性)
- Impact Level 自動推定 (diff 行数/削除率/Frontmatter変更有無をスコア化)
- PR Template 拡張 (Impact Level チェックボックス + MUST コマンド通過確認)
- CHANGELOG / ADR 連携のプリフック追加 (High Impact 時に未更新なら CI Fail)

### 推奨アクション (ToDo)

- [ ] VALIDATION.md にドキュメント構造チェック手順追記
- [ ] scripts/doc-validate.ts の雛形作成 (schema定義 + ルール)
- [ ] PR Template 改訂: Impact / Files touched / ADR必要性チェック
- [ ] CIへ doc-validate ステップ追加

### インサイトまとめ

構造化 + インパクト分類は AI 支援下でのドキュメント運用摩擦を大幅に低減する。次段階は「自動検証」と「影響度推定モデル」による人為判断負荷の削減。継続的計測 (解析時間, 衝突率, レビュー所要時間) のメトリクス化が必須。
