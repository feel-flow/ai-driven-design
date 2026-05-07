---
name: error-handling-standards
description: >-
  Enforces error handling standards: silent error prohibition, custom error
  class hierarchy (AppError base with ValidationError, NotFoundError,
  InternalError), Result pattern (Result.ok/Result.fail), proper try-catch
  with error type checking, structured error logging with context metadata,
  and HTTP status code mapping. Use when implementing error handling,
  reviewing catch blocks, or designing error responses.
metadata:
  version: "1.0.0"
  author: feel-flow
  tags: "error-handling, result-pattern, custom-errors, logging, silent-error"
  references: "docs-template/03-implementation/PATTERNS.md, docs-template/03-implementation/FALLBACK.md, docs-template/MASTER.md"
---

# エラーハンドリング基準

サイレントエラーゼロトレランスを原則とし、すべてのエラーを適切に分類・処理・記録するためのスキル。
PATTERNS.md のセクション 3, 9 および FALLBACK.md で定義されたパターンを適用する。

## 1. サイレントエラーの禁止

以下のパターンはすべて**禁止**：

```typescript
// ❌ 空の catch ブロック
try {
  doSomething();
} catch (e) {}

// ❌ console.log のみでエラーを握りつぶし
try {
  doSomething();
} catch (e) {
  console.log(e);
}

// ❌ エラーを無視して null/undefined を返す
try {
  return fetchData();
} catch (e) {
  return null;
}

// ❌ 汎用的すぎるエラーメッセージ
throw new Error("Something went wrong");
```

すべての catch ブロックは、エラーの**記録**、**再スロー**、または**Result.fail での返却**のいずれかを行うこと。

> **例外**: 環境分岐付きフォールバック（セクション8参照）は本番環境のみで許容される。無条件のフォールバックは禁止。

## 2. カスタムエラークラス階層

プロジェクトでは AppError を基底クラスとしたエラー階層を使用する：

```typescript
// エラー基底クラス
abstract class AppError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// バリデーションエラー
class ValidationError extends AppError {
  constructor(
    message: string,
    public details: any[],
  ) {
    super(message, "VALIDATION_ERROR", 400);
  }
}

// リソース未検出エラー
class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, "NOT_FOUND", 404);
  }
}

// 内部エラー
class InternalError extends AppError {
  constructor(message: string) {
    super(message, "INTERNAL_ERROR", 500);
  }
}
```

## 3. エラーコードと HTTP ステータスコード

| エラークラス    | エラーコード       | HTTP ステータス | 用途                   |
| --------------- | ------------------ | --------------- | ---------------------- |
| ValidationError | `VALIDATION_ERROR` | 400             | 入力バリデーション失敗 |
| NotFoundError   | `NOT_FOUND`        | 404             | リソース未検出         |
| ForbiddenError  | `FORBIDDEN`        | 403             | 権限不足               |
| ConflictError   | `CONFLICT`         | 409             | 重複・競合             |
| InternalError   | `INTERNAL_ERROR`   | 500             | 予期しない内部エラー   |

ForbiddenError と ConflictError は PATTERNS.md の基本階層には未定義だが、一般的な HTTP エラーとして推奨される拡張。
新しいエラー種別が必要な場合は、必ず AppError を継承して作成する。

## 4. Result パターン

ビジネスロジックでは例外スローではなく Result パターンを優先する：

```typescript
// Result 型
type Result<T> = { ok: true; value: T } | { ok: false; error: AppError };

const Result = {
  ok: <T>(value: T): Result<T> => ({ ok: true, value }),
  fail: <T>(error: AppError): Result<T> => ({ ok: false, error }),
};

// 使用例
async function processUser(userId: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      return Result.fail(new NotFoundError("User not found"));
    }

    const processed = await processUserData(user);
    return Result.ok(processed);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to process user", err, { userId });

    if (error instanceof AppError) {
      return Result.fail(error);
    }

    return Result.fail(new InternalError("Processing failed"));
  }
}
```

**Result パターンのメリット:**

- 呼び出し側がエラーハンドリングを忘れない（型で強制）
- 正常系と異常系が型レベルで明確に区別される
- try-catch のネストが減りコードが読みやすくなる

## 5. Try-Catch のベストプラクティス

```typescript
// ✅ 良い例: エラー型に応じた具体的な処理
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof ValidationError) {
    return Result.fail(error); // そのまま返却
  }
  if (error instanceof NotFoundError) {
    logger.warn("Resource not found", { error });
    return Result.fail(error);
  }
  // 未知のエラーは InternalError でラップ
  logger.error("Unexpected error", { error });
  return Result.fail(new InternalError("Unexpected error occurred"));
}

// ❌ 悪い例: 汎用的な catch のみ
try {
  await riskyOperation();
} catch (error) {
  throw new Error("Failed"); // 元のエラー情報が失われる
}
```

**ルール:**

- `instanceof` でエラー型をチェック
- 具体的なエラーから順に処理
- 未知のエラーは `InternalError` でラップして再スロー
- 元のエラー情報は必ずログに記録

## 6. 構造化エラーログ

エラーログは JSON 形式で構造化し、必要なコンテキストを含めること：

```typescript
class Logger {
  error(message: string, error: Error, meta?: Record<string, any>): void {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        timestamp: new Date().toISOString(),
        ...meta,
      }),
    );
  }
}

// 使用例
logger.error("Failed to process user", error, {
  userId: "123",
  operation: "processUser",
  requestId: req.headers["x-request-id"],
});
```

**ログの必須フィールド:**

- `level`: エラーレベル（error / warn / info）
- `message`: 人間が読めるエラー説明
- `error.name`: エラークラス名
- `error.message`: エラーメッセージ
- `error.stack`: スタックトレース
- `timestamp`: ISO 8601 形式

**禁止事項:**

- 個人情報（パスワード、メールアドレス等）をログに含めない
- スタックトレースをユーザー向けレスポンスに含めない

## 7. チェックリスト

エラーハンドリングのコードレビュー時に確認する項目：

- [ ] 空の catch ブロックがないか
- [ ] すべてのエラーが適切にログ記録されているか
- [ ] カスタムエラークラス（AppError 継承）を使用しているか
- [ ] エラーコードと HTTP ステータスが正しくマッピングされているか
- [ ] Result パターンが適切に使用されているか
- [ ] `instanceof` でエラー型をチェックしているか
- [ ] 未知のエラーが `InternalError` でラップされているか
- [ ] ログに個人情報が含まれていないか
- [ ] ユーザー向けレスポンスにスタックトレースが露出していないか
- [ ] フォールバック処理が環境分岐されているか（開発時スロー / 本番時フォールバック）
- [ ] AI生成のtry-catch + デフォルト値返却パターンが残っていないか

## 8. AI生成コードのフォールバックアンチパターン

> 包括的なフォールバック戦略（階層モデル・レイヤー別パターン含む）は [FALLBACK.md](../../../03-implementation/FALLBACK.md) を参照。

AI（Claude Code, Copilot, Cursor等）は `try-catch` + デフォルト値返却を自動挿入する傾向がある。
このパターンは開発中のバグを隠蔽し、本番で初めて問題が発覚するリスクを生む。

### 検出すべきアンチパターン

```typescript
// ❌ パターン1: 空 catch + デフォルト値
try {
  return await fetchData();
} catch {
  return defaultValue;
}

// ❌ パターン2: エラー無視 + 空配列/空文字
try {
  return await getItems();
} catch {
  return [];
}

// ❌ パターン3: catch 内で console.log のみ + フォールバック
try {
  return await getData();
} catch (e) {
  console.log(e);
  return fallbackData;
}

// ❌ パターン4: Promise.catch() でサイレントフォールバック
const data = await fetchData().catch(() => defaultValue);
```

### 修正パターン

フォールバックが必要な場合は、`fallbackInProdOnly()` ユーティリティ（推奨）または環境分岐を使用する：

```typescript
// ✅ 環境別フォールバック（FALLBACK.md 準拠）
try {
  return await fetchData();
} catch (error) {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));
  logger.error("Failed to fetch data", normalizedError, {
    operation: "fetchData",
  });

  const env = process.env.NODE_ENV;
  if (env === "development" || env === "test") {
    throw normalizedError; // 開発時: バグを即座に検出
  }

  return defaultValue; // 本番時のみ: UX保護
}
```

### レビュー時の判断基準

| 状況                                                        | 対応                               |
| ----------------------------------------------------------- | ---------------------------------- |
| catch 内でデフォルト値を返している                          | 環境分岐を追加するよう指摘         |
| `.catch(() => default)` パターン                            | try-catch + 環境分岐に書き換え     |
| 認証/認可/バリデーション/データ整合性エラーにフォールバック | 環境問わずスローに修正             |
| 既に `fallbackInProdOnly()` または環境分岐あり              | OK（ログ記録・エラー正規化を確認） |
| フォールバックが明示的にビジネス要件                        | コメントで理由を明記させる         |
