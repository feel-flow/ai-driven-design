---
title: "FALLBACK"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# フォールバック戦略（Fail-Fast in Dev, Graceful in Prod）

> **Origin**: [PATTERNS.md](./PATTERNS.md) セクション 3（エラーハンドリング） | **Related**: [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md)

## 1. 基本原則

### 環境別の基本方針（全レイヤー共通）

| 環境         | 方針                                                   | 理由                               |
| ------------ | ------------------------------------------------------ | ---------------------------------- |
| 開発・テスト | **Fail-Fast** — エラーを即座にスローし、バグを早期検出 | AI生成コードのサイレントエラー防止 |
| 本番         | **Graceful Degradation** — フォールバックで UX を保護  | ユーザー体験の維持                 |

**背景**: AI（Claude Code, Copilot, Cursor等）は「安全側」に倒す傾向があり、try-catch + フォールバック値を自動挿入しがち。これにより開発中にバグが隠蔽され、本番で初めて問題が発覚するリスクが高い。

### フォールバック禁止カテゴリ

以下のエラーは**環境に関係なく常にスロー**する。フォールバックが安全性やデータの正確性を損なうため：

- **認証・認可エラー** — セキュリティ侵害のリスク
- **バリデーションエラー** — 不正データの伝播防止
- **データ整合性エラー** — トランザクション一貫性の維持
- **セキュリティ関連エラー** — 脆弱性の露出防止

### 可観測性の原則

- フォールバック発動時は必ず **構造化ログ**（error レベル）を出力する
- 一定閾値を超えるフォールバック発動は **アラート** を発行する
- フォールバック状態は **メトリクス** として記録する（発動回数、復旧時間）

### 劣化の明示

ユーザーにフォールバック状態であることを通知する：

- 「一部機能が制限されています」等のバナー表示
- キャッシュデータ表示時は「最終更新: X分前」を明示
- 縮退モード中は視覚的インジケータ（例: ヘッダーの色変更）で表示

---

## 2. フォールバック階層モデル

フォールバックは複数のレイヤーで段階的に処理する。**下位レイヤーで吸収できれば上位への影響を最小化できる**。

```
[UI/UX レイヤー]     ← ユーザー影響: 最大（Error Boundary, Skeleton UI）
       ↑
[サービスレイヤー]    ← Circuit Breaker, リトライ, タイムアウト
       ↑
[フィーチャーレイヤー] ← Feature Flag, 縮退モード
       ↑
[データレイヤー]      ← キャッシュ階層, Read Replica
       ↑
[コードレイヤー]      ← try-catch, fallbackInProdOnly()（ユーザー影響: 最小）
```

**設計方針**: 可能な限り下位レイヤーで障害を吸収し、上位レイヤーのフォールバックは最終手段とする。

---

## 3. レイヤー別フォールバック戦略

### 3.1 UI/UX レイヤー

| パターン             | 開発時                                    | 本番時                                | 用途                         |
| -------------------- | ----------------------------------------- | ------------------------------------- | ---------------------------- |
| Error Boundary       | エラーを re-throw（スタックトレース表示） | フォールバック UI を表示              | コンポーネント単位の障害隔離 |
| Skeleton UI          | 無限ローディングでタイムアウト検出        | Skeleton + タイムアウト後にエラー表示 | データ取得中の UX            |
| キャッシュデータ表示 | 使用しない（常に最新データを要求）        | stale indicator 付きで表示            | オフライン・低速回線対応     |
| 段階的劣化           | 非重要機能もエラー表示                    | 非重要機能を非表示化                  | 部分障害時の UX 維持         |

### 3.2 サービスレイヤー

| パターン           | 説明                                                      | 設定定数の例                                                            |
| ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| Circuit Breaker    | 連続障害時にリクエストを遮断（Closed → Open → Half-Open） | `CIRCUIT_BREAKER_FAILURE_THRESHOLD`, `CIRCUIT_BREAKER_OPEN_DURATION_MS` |
| リトライ           | Exponential Backoff + Jitter で再試行                     | `MAX_RETRY_COUNT`, `RETRY_INITIAL_DELAY_MS`, `RETRY_MAX_DELAY_MS`       |
| セカンダリサービス | プライマリ障害時にバックアップサービスへ切替              | `HEALTH_CHECK_INTERVAL_MS`                                              |
| タイムアウト       | レスポンス待ち上限を設定                                  | `API_TIMEOUT_MS`, `BATCH_TIMEOUT_MS`                                    |

> これらの値は名前付き定数として定義すること（マジックナンバー禁止。詳細は [PATTERNS.md](./PATTERNS.md) Section 10 参照）。

### 3.3 フィーチャーレイヤー

| パターン                     | 説明                             | 用途                             |
| ---------------------------- | -------------------------------- | -------------------------------- |
| Feature Flag                 | 障害発生時に機能を動的に無効化   | 新機能のロールバック不要な無効化 |
| 縮退モード                   | 一部機能を制限して中核機能を維持 | 高負荷時・部分障害時             |
| フォールバック機能マッピング | 機能A障害時に代替機能Bを提供     | 重要度の高い機能の可用性維持     |

### 3.4 データレイヤー

| パターン               | 説明                                       | 用途                           |
| ---------------------- | ------------------------------------------ | ------------------------------ |
| Stale-While-Revalidate | キャッシュ返却 + バックグラウンド更新      | 読み取り頻度の高いデータ       |
| Read Replica Fallback  | プライマリDB障害時にレプリカから読み取り   | DB可用性の向上                 |
| オフラインファースト   | ローカルストレージ → 同期キュー → サーバー | モバイル・不安定なネットワーク |
| キャッシュ階層         | Memory → Redis → DB の順にフォールバック   | レスポンス速度の最適化         |

---

## 4. コードレベル: 環境別フォールバック

### ユーティリティ関数

```typescript
/**
 * 本番環境でのみフォールバック値を返し、開発・テスト環境ではエラーをスローする。
 * AI生成コードのサイレントエラー防止に使用する。
 *
 * @throws {Error} development/test環境では元のエラーを再スローする。
 */
function fallbackInProdOnly<T>(
  fallbackValue: T,
  error: unknown,
  context?: Record<string, unknown>,
): T {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));

  // フォールバック禁止カテゴリ（Section 1 参照）は環境に関係なく常にスロー
  // ※ プロジェクトで定義した AppError サブクラスに合わせて追加すること:
  //    認証: UnauthorizedError, 認可: ForbiddenError,
  //    バリデーション: ValidationError, データ整合性: ConflictError
  //    セキュリティ: SecurityError 等
  if (
    normalizedError instanceof ValidationError ||
    normalizedError instanceof ForbiddenError ||
    normalizedError instanceof ConflictError
  ) {
    throw normalizedError;
  }

  logger.error("Fallback activated", normalizedError, context);

  const env = process.env.NODE_ENV;
  // ホワイトリスト方式: dev/testのみスロー。未定義・staging等は安全にフォールバック
  if (env === "development" || env === "test") {
    throw normalizedError;
  }

  return fallbackValue;
}
```

> **NODE_ENV未設定時の挙動**: ホワイトリスト方式を採用しているため、`NODE_ENV` が未定義やその他の値の場合はフォールバックが動作する（本番環境の安全性を優先）。staging環境でもfail-fastを有効にしたい場合は、`APP_ENV` 等の独立した環境変数で制御すること（`NODE_ENV=development` への変更はアプリ全体の挙動を変えるため非推奨）。

### ❌ NG: AI生成コードによくあるパターン

```typescript
// AI が自動生成しがちなパターン — 開発でもバグが隠れる
async function getUser(id: string): Promise<User> {
  try {
    // ※ findById は User | null を返すが、null処理は省略（フォールバック問題に焦点）
    return (await userRepository.findById(id)) as User;
  } catch {
    return DEFAULT_USER; // バグがあっても気づけない
  }
}

async function getConfig(key: string): Promise<string> {
  try {
    return await configService.get(key);
  } catch {
    return ""; // 設定ミスが本番まで検出されない
  }
}
```

### ✅ OK: 環境別フォールバック戦略

```typescript
// 方法1（推奨）: ユーティリティ関数を使用
async function getUser(id: string): Promise<User> {
  try {
    // ※ null処理は省略（フォールバック問題に焦点）
    return (await userRepository.findById(id)) as User;
  } catch (error) {
    return fallbackInProdOnly(DEFAULT_USER, error, { id });
  }
}

// 方法2: インラインで環境分岐（カスタムログが必要な場合）
async function getConfig(key: string): Promise<string> {
  try {
    return await configService.get(key);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to fetch config", normalizedError, { key });

    const env = process.env.NODE_ENV;
    if (env === "development" || env === "test") {
      throw normalizedError;
    }

    return ""; // 本番時のみ: デフォルト値で継続
  }
}
```

### 適用判断ガイド

| シナリオ               | 開発時                 | 本番時                  |
| ---------------------- | ---------------------- | ----------------------- |
| DB/API通信エラー       | スロー（即座に検出）   | フォールバック + ログ   |
| 設定値の取得失敗       | スロー（設定ミス検出） | デフォルト値 + アラート |
| データ変換エラー       | スロー（型不整合検出） | 安全なデフォルト + ログ |
| 認証/認可エラー        | スロー                 | スロー（環境問わず）    |
| バリデーションエラー   | スロー                 | スロー（環境問わず）    |
| データ整合性エラー     | スロー                 | スロー（環境問わず）    |
| セキュリティ関連エラー | スロー                 | スロー（環境問わず）    |

### Result patternとの使い分け

[PATTERNS.md](./PATTERNS.md) Section 3 の Result pattern（`Result.ok` / `Result.fail`）とフォールバック戦略は併用できる。

- **Result pattern**: ビジネスロジック層で使用。呼び出し元がエラーの種類に応じて処理を分岐する場合に適する
- **`fallbackInProdOnly`**: UI境界層・APIレスポンス整形など、最終消費者にフォールバック値を返す場面で使用

---

## 5. プロジェクト固有フォールバック設計（テンプレート）

### 重要機能のフォールバックマッピング

| 機能    | 重要度   | フォールバック戦略           | フォールバック先   |
| ------- | -------- | ---------------------------- | ------------------ |
| [機能A] | Critical | Circuit Breaker + セカンダリ | [代替サービス]     |
| [機能B] | High     | キャッシュ + 縮退モード      | [キャッシュデータ] |
| [機能C] | Medium   | Feature Flag で無効化        | [機能非表示]       |
| [機能D] | Low      | エラー表示のみ               | -                  |

### フォールバック発動条件テーブル

| トリガー            | 検出方法               | フォールバック動作            | 復旧条件             |
| ------------------- | ---------------------- | ----------------------------- | -------------------- |
| API応答タイムアウト | [X]秒超過              | キャッシュデータ返却          | 正常応答の連続[Y]回  |
| 外部サービス障害    | ヘルスチェック失敗     | セカンダリサービス切替        | プライマリ復旧確認   |
| DB接続エラー        | コネクションプール枯渇 | Read Replica へフォールバック | プライマリ接続回復   |
| 高負荷              | CPU/メモリ閾値超過     | 縮退モード移行                | リソース使用量正常化 |

---

## 6. セルフレビューチェックリスト

### コードレベル

- [ ] try-catch ブロックでエラーを握りつぶしていないか
- [ ] フォールバック値（空配列、デフォルトオブジェクト等）を返す箇所に環境分岐があるか
- [ ] AI生成コードのcatch句が `fallbackInProdOnly()` または `NODE_ENV` 分岐を使用しているか
- [ ] 認証/認可/バリデーションエラーにフォールバックが入っていないか

### アプリケーションレベル

- [ ] Error Boundary が適切に配置されているか（開発時 re-throw / 本番時 fallback UI）
- [ ] Circuit Breaker の閾値が名前付き定数で定義されているか
- [ ] フォールバック発動時にログ・アラートが出力されるか
- [ ] フォールバック状態がユーザーに通知されるか（stale indicator 等）
- [ ] Feature Flag による機能無効化が可能な構成か

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成（PATTERNS.md のフォールバックセクションを独立ファイル化し、アプリケーションレベルに拡充）
