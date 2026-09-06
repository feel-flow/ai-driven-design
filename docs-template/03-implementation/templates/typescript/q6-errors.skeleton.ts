/**
 * SKELETON — do not import directly.
 * Copy to: shared/errors/（DECISION_TREE Q6 — エラーハンドリング）
 *
 * TODO: ユーザー向けメッセージと内部コードのマッピング表を維持。
 *
 * 既知の注意:
 * - 外部レスポンスにスタックトレースや SQL を含めない。
 * - エラーコードは定数化しマジック文字列を避ける。
 */

export const ERROR_CODE_EXAMPLE = "EXAMPLE_ERROR" as const;
export const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;

// 正典は docs/03-implementation/PATTERNS.md「エラーハンドリング」。署名を揃えること
// （引数順は message, code, statusCode, options）。
export type AppErrorOptions = { cause?: unknown };
export type ErrorCategory = "never-fallback" | "transient" | "permanent";

export abstract class AppError extends Error {
  /** フォールバック可否・再試行可否。statusCode から推測せず各サブクラスが宣言する */
  public abstract readonly category: ErrorCategory;

  public constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    options?: AppErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class ExampleError extends AppError {
  public readonly category: ErrorCategory = "permanent";

  public constructor(message: string, options?: AppErrorOptions) {
    super(
      message,
      ERROR_CODE_EXAMPLE,
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      options,
    );
  }
}
