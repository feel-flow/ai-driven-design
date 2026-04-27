/**
 * SKELETON — do not import directly.
 * Copy to: application/jobs/（DECISION_TREE Q3 — バックグラウンドジョブ）
 *
 * TODO: ジョブ ID・再試行ポリシー・デッドレター連携をインフラ設定と一致させる。
 *
 * 既知の注意:
 * - 少なく一度実行される前提で冪等性を担保する。
 * - 長時間処理はチェックポイントまたは分割を検討。
 */

/** ジョブのタイムアウト（ミリ秒）。ワーカー設定と揃える。 */
const JOB_TIMEOUT_MS = 120_000;

export async function runExampleJob(_payload: unknown): Promise<void> {
  void JOB_TIMEOUT_MS;
  // TODO: load → use case / domain → acknowledge
}
