/**
 * SKELETON — do not import directly.
 * Copy to: interfaces/controllers/（DECISION_TREE Q2 — REST ルート）
 *
 * TODO: ルーティングフレームワークに合わせたハンドラ署名に置換。
 * TODO: 入力検証（スキーマ）とユースケース呼び出しのみを置く。ビジネスルールは application へ。
 *
 * 既知の注意:
 * - コントローラに DB クライアントを直注入しない。
 * - エラーレスポンスで内部スタックや SQL を返さない。
 */

/** リクエストボディの最大長（バイト）。JSON bomb 対策。 */
const REST_MAX_BODY_BYTES = 1_048_576;

export async function handleExample(_req: unknown, _res: unknown): Promise<void> {
  void REST_MAX_BODY_BYTES;
  // TODO: parse → validate → useCase.execute → map status
}
