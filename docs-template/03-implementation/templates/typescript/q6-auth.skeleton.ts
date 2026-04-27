/**
 * SKELETON — do not import directly.
 * Copy to: shared/auth/（DECISION_TREE Q6 — 認証・認可）
 *
 * TODO: 認証方式（JWT / Session / mTLS）とロールモデルを ARCHITECTURE に合わせる。
 *
 * 既知の注意:
 * - デフォルト拒否。権限チェックをコントローラだけに置かない（必要なら共通ガード）。
 * - トークン検証失敗時のログに生トークンを残さない。
 */

export async function assertAuthenticated(_principal: unknown): Promise<void> {
  // TODO: verify + attach context
}
