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

export const ERROR_CODE_EXAMPLE = 'EXAMPLE_ERROR' as const;

export class AppError extends Error {
  public readonly code: string;

  public constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}
