/**
 * SKELETON — do not import directly.
 * Copy to: infrastructure/clients/（DECISION_TREE.md Q1 — HTTP API クライアント）
 *
 * TODO: ベース URL・認証ヘッダ・API キーは環境変数または設定モジュールから注入する。
 * TODO: レスポンス型（Zod / io-ts 等）でランタイム検証する。
 *
 * 既知の注意:
 * - ログにトークン・API キー・生の Authorization を出さない（マスキングまたは省略）。
 * - 429 / 503 などは API ごとにリトライ方針が異なる。仕様書で確認してから実装する。
 */

/** HTTP リクエストのタイムアウト（ミリ秒）。インフラ SLA に合わせて調整。 */
const HTTP_CLIENT_TIMEOUT_MS = 10_000;

/** 一時的障害時の最大リトライ回数（回）。バックオフは別定数で制御。 */
const HTTP_CLIENT_MAX_RETRIES = 3;

/** リトライ間の待機（ミリ秒）。指数バックオフに置き換え可。 */
const HTTP_CLIENT_RETRY_BASE_DELAY_MS = 200;

/** HTTP 429 Too Many Requests。API ごとのレート制限仕様に合わせて扱う。 */
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

export type HttpClientResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorCode: string; message: string };

export interface ExternalApiClientConfig {
  readonly baseUrl: string;
  readonly getAuthHeader: () => Promise<string | undefined>;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function buildMaskedLogContext(url: string): { url: string } {
  // TODO: クエリにトークンが含まれる場合は strip する
  return { url };
}

export function createExternalApiClient(
  config: ExternalApiClientConfig,
): {
  fetchJson: <T>(path: string) => Promise<HttpClientResult<T>>;
} {
  return {
    fetchJson: async <T>(path: string) => {
      const target = `${config.baseUrl}${path}`;
      let lastError: HttpClientResult<T> | undefined;
      for (let attempt = 0; attempt <= HTTP_CLIENT_MAX_RETRIES; attempt += 1) {
        const auth = await config.getAuthHeader();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, HTTP_CLIENT_TIMEOUT_MS);
        try {
          const res = await fetch(target, {
            method: 'GET',
            headers: auth ? { Authorization: auth } : {},
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!res.ok) {
            // TODO: res.status に応じたエラーコードマッピング（API 固有）
            lastError = {
              ok: false,
              errorCode: `HTTP_${String(res.status)}`,
              message: 'Upstream API error',
            };
            if (res.status === HTTP_STATUS_TOO_MANY_REQUESTS && attempt < HTTP_CLIENT_MAX_RETRIES) {
              await delay(HTTP_CLIENT_RETRY_BASE_DELAY_MS * (attempt + 1));
              continue;
            }
            return lastError;
          }
          const data = (await res.json()) as T;
          return { ok: true, data };
        } catch (cause: unknown) {
          clearTimeout(timeoutId);
          const logContext = buildMaskedLogContext(target);
          // TODO: 実装時は structuredLogger.warn('HTTP client failed', logContext) 等へ渡す。
          void logContext;
          const message = cause instanceof Error ? cause.message : 'Unknown error';
          lastError = { ok: false, errorCode: 'HTTP_CLIENT_FAILED', message };
          if (attempt < HTTP_CLIENT_MAX_RETRIES) {
            await delay(HTTP_CLIENT_RETRY_BASE_DELAY_MS * (attempt + 1));
            continue;
          }
        }
      }
      return lastError ?? { ok: false, errorCode: 'HTTP_CLIENT_FAILED', message: 'Unknown error' };
    },
  };
}
