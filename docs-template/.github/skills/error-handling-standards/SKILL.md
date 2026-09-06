---
name: error-handling-standards
description: >-
  Enforces error handling standards: silent error prohibition, custom error
  class hierarchy (AppError base with category never-fallback / transient /
  permanent, cause preservation, ValidationError / UnauthorizedError /
  UpstreamError etc. — canonical definitions in PATTERNS.md), external-boundary
  normalization (normalizeExternalError), Result pattern (Result.ok/Result.fail),
  proper try-catch with error type checking, structured error logging with a
  single Logger contract, fallback prohibition categories (isNeverFallback),
  and HTTP status code mapping. Use when implementing error handling,
  reviewing catch blocks, or designing error responses.
metadata:
  version: "1.1.0"
  author: feel-flow
  tags: "error-handling, result-pattern, custom-errors, logging, silent-error"
  references: "docs/03-implementation/PATTERNS.md, docs/03-implementation/FALLBACK.md, docs/MASTER.md"
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

プロジェクトでは AppError を基底クラスとしたエラー階層を使用する。**定義の正典は PATTERNS.md「エラーハンドリング」**（本ファイルには基底クラスと 1 例だけを載せ、サブクラスの全一覧は複製しない — 複製は必ずドリフトする）：

```typescript
// options.cause で元エラーを保持する（ES2022 Error.cause。tsconfig の lib に ES2022 が必要）
type AppErrorOptions = { cause?: unknown };

// 分類。フォールバック可否・再試行可否は statusCode から推測せず、各サブクラスが宣言する
type ErrorCategory = "never-fallback" | "transient" | "permanent";

abstract class AppError extends Error {
  abstract readonly category: ErrorCategory;
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// バリデーション詳細（any を使わない / MASTER.md）。PATTERNS.md と同じ形状
interface ValidationDetail {
  field: string;
  message: string;
  constraint?: string;
}

// サブクラスの例（他の NotFoundError / ForbiddenError / ConflictError / UnauthorizedError /
// SecurityError / InternalError / UpstreamError / UpstreamRejectedError は PATTERNS.md）
// HTTP_STATUS は PATTERNS.md「エラーハンドリング」で定義（`./errors` から import）
class ValidationError extends AppError {
  readonly category: ErrorCategory = "never-fallback";
  constructor(
    message: string,
    public readonly details: readonly ValidationDetail[],
    options?: AppErrorOptions,
  ) {
    super(message, "VALIDATION_ERROR", HTTP_STATUS.BAD_REQUEST, options);
  }
}
```

## 3. エラーコードと HTTP ステータスコード

| エラークラス          | エラーコード           | HTTP ステータス | 分類           | 用途                                                                             |
| --------------------- | ---------------------- | --------------- | -------------- | -------------------------------------------------------------------------------- |
| ValidationError       | `VALIDATION_ERROR`     | 400             | never-fallback | 入力バリデーション失敗                                                           |
| UnauthorizedError     | `UNAUTHORIZED`         | 401             | never-fallback | 未認証                                                                           |
| ForbiddenError        | `FORBIDDEN`            | 403             | never-fallback | 権限不足                                                                         |
| SecurityError         | `SECURITY_VIOLATION`   | 403             | never-fallback | 署名不一致・改ざん検知                                                           |
| NotFoundError         | `NOT_FOUND`            | 404             | permanent      | リソース未検出                                                                   |
| ConflictError         | `CONFLICT`             | 409             | never-fallback | 重複・競合                                                                       |
| InternalError         | `INTERNAL_ERROR`       | 500             | permanent      | 予期しない内部エラー                                                             |
| UpstreamError         | `UPSTREAM_UNAVAILABLE` | 502             | transient      | 外部サービスの一時障害（再試行可）                                               |
| UpstreamRejectedError | `UPSTREAM_REJECTED`    | 502             | never-fallback | 外部サービスによる恒久的な拒否（自コードの要求誤り。本番でフォールバックしない） |

すべて PATTERNS.md「エラーハンドリング」で定義済み。新しいエラー種別が必要な場合は、必ず AppError を継承し `category` を宣言して作成する（宣言しないとコンパイルエラーになる）。

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

    return Result.fail(new InternalError("Processing failed", { cause: err }));
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
    // warn の meta に Error 実体は入れない（Logger 規約 / PATTERNS.md §9）
    logger.warn("Resource not found", { code: error.code });
    return Result.fail(error);
  }
  // 未知のエラーは InternalError でラップし、cause で元エラーを保持する
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error("Unexpected error", err);
  return Result.fail(
    new InternalError("Unexpected error occurred", { cause: err }),
  );
}

// ❌ 悪い例: 汎用的な catch のみ
try {
  await riskyOperation();
} catch (error) {
  throw new Error("Failed"); // 元のエラー情報が失われる
}

// ✅ ラップするなら cause で元エラーを保持する
try {
  await riskyOperation();
} catch (error) {
  throw new InternalError("Failed", { cause: error });
}
```

**ルール:**

- `instanceof` でエラー型をチェック
- 具体的なエラーから順に処理
- 未知のエラーは `InternalError` でラップして再スロー（`{ cause }` で元エラーを保持）
- 元のエラー情報は必ずログに記録
- 外部 SDK / HTTP クライアントのエラーは境界で `normalizeExternalError()`（PATTERNS.md）により AppError へ正規化する

## 6. 構造化エラーログ

エラーログは JSON 形式で構造化し、必要なコンテキストを含めること。呼び出し規約はテンプレート全体で 1 つで、**正典（`interface Logger`）と実装例（`JsonLogger`）は PATTERNS.md §9「ログパターン」**にある。ここには複製せず、規約だけを示す：

- `error(message, error, meta?)` — 第 2 引数は Error 型。catch 変数（unknown）は正規化してから渡す
- `warn(message, meta?)` / `info(message, meta?)` — meta は構造化コンテキスト。Error 実体は入れない（name / code だけ載せる）

```typescript
// 使用例
try {
  await riskyOperation(userId);
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error("Failed to process user", err, {
    userId,
    operation: "riskyOperation",
    requestId: req.headers["x-request-id"],
  });
}
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

> 包括的なフォールバック戦略（階層モデル・レイヤー別パターン含む）は [FALLBACK.md](../../../docs/03-implementation/FALLBACK.md) を参照。

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
// ✅ 推奨: ユーティリティを使う（禁止カテゴリの判定を内蔵している）。
// 引数は AppError に限定されるので、HTTP 境界の生エラーは normalizeExternalError() を通す
try {
  return await fetchData();
} catch (error) {
  return fallbackInProdOnly(defaultValue, normalizeExternalError(error), {
    operation: "fetchData",
  });
}

// △ インライン環境分岐（カスタムログが必要な場合のみ）
// 素の環境分岐は「フォールバック禁止カテゴリ」の判定を持たないため、
// 認証・認可・バリデーション・データ整合性・セキュリティ・上流の恒久的な拒否のエラーが
// 本番で握りつぶされる。この形を使うなら禁止カテゴリの判定を必ず添える。
try {
  return await fetchData();
} catch (error) {
  const normalizedError = normalizeExternalError(error);
  logger.error("Failed to fetch data", normalizedError, {
    operation: "fetchData",
  });

  // 禁止カテゴリは環境に関係なく常にスロー（FALLBACK.md Section 1 / §4 の isNeverFallback）。
  // 判定を自前で再実装しない — 禁止カテゴリの定義が変わったときに取り残される
  if (isNeverFallback(normalizedError)) {
    throw normalizedError;
  }

  const env = process.env.NODE_ENV;
  if (env === "development" || env === "test") {
    throw normalizedError; // 開発時: バグを即座に検出
  }

  return defaultValue; // 本番時のみ: UX保護
}
```

### レビュー時の判断基準

| 状況                                                                                          | 対応                                 |
| --------------------------------------------------------------------------------------------- | ------------------------------------ |
| catch 内でデフォルト値を返している                                                            | 環境分岐を追加するよう指摘           |
| `.catch(() => default)` パターン                                                              | try-catch + 環境分岐に書き換え       |
| 認証/認可/バリデーション/データ整合性/セキュリティ/上流の恒久的な拒否のエラーにフォールバック | 環境問わずスローに修正               |
| 既に `fallbackInProdOnly()` を使用                                                            | OK（ログ記録・エラー正規化を確認）   |
| 環境分岐のみ（禁止カテゴリの判定なし）                                                        | 禁止カテゴリの判定を追加するよう指摘 |
| フォールバックが明示的にビジネス要件                                                          | コメントで理由を明記させる           |
