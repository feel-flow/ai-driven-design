/**
 * SKELETON — do not import directly.
 * Copy to: infrastructure/storage/（DECISION_TREE Q1 — ファイルストレージ）
 *
 * TODO: バケット名・リージョン・署名付き URL の有効期限を設定化。
 *
 * 既知の注意:
 * - アップロードは MIME とサイズ上限をサーバ側でも検証（クライアントのみに依存しない）。
 * - 公開 URL と非公開オブジェクトの混同に注意。
 */

/** アップロード可能な最大サイズ（バイト）。プロダクト要件に合わせる。 */
const STORAGE_MAX_OBJECT_BYTES = 10 * 1024 * 1024;

export async function putObject(_key: string, _bytes: Uint8Array): Promise<void> {
  void STORAGE_MAX_OBJECT_BYTES;
  // TODO: S3 / GCS / Blob 等の実装
}
