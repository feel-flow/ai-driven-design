/**
 * SKELETON — do not import directly.
 * Copy to: shared/logging/（DECISION_TREE Q6 — ロギング・監視）
 *
 * TODO: 構造化ログのスキーマ（requestId / tenantId）を運用と一致させる。
 *
 * 既知の注意:
 * - PII / credential をマスクするフィルタを必ず通す。
 * - ログレベルとサンプリング（高トラフィック時）を決める。
 */

export function logInfo(_event: string, _context: Record<string, string>): void {
  // TODO: delegate to logger implementation
}
