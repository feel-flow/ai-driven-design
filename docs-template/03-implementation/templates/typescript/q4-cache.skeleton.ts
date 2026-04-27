/**
 * SKELETON — do not import directly.
 * Copy to: infrastructure/cache/（DECISION_TREE Q4 — セッション / キャッシュ）
 *
 * TODO: TTL・キー接頭辞（テナント ID）・シリアライズ形式を統一。
 *
 * 既知の注意:
 * - キャッシュは「あってもよい」データのみ。決済残高などの SSOT にしない。
 * - スタンプede / 同時リビルド対策（singleflight 等）。
 */

/** 既定 TTL（秒）。キャッシュヒット率と鮮度のトレードオフで調整。 */
const CACHE_DEFAULT_TTL_SEC = 300;

export async function cacheGet(_key: string): Promise<string | null> {
  void CACHE_DEFAULT_TTL_SEC;
  // TODO: Redis / Memcached 等
  return null;
}
