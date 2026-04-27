/**
 * SKELETON — do not import directly.
 * Copy to: infrastructure/queues/（DECISION_TREE Q1 — メッセージキュー）
 *
 * TODO: キュー名・DLQ 名・可視性タイムアウトを設定から注入。
 *
 * 既知の注意:
 * - 少なくとも一度 / ちょうど一度 の意味をプロダクト要件と照合する。
 * - メッセージ本文に秘密情報を載せない（参照 ID のみ等）。
 */

/** メッセージ可視性タイムアウト（秒）。プロバイダ上限内で調整。 */
const QUEUE_VISIBILITY_TIMEOUT_SEC = 30;

export interface QueuePublishInput {
  readonly body: string;
  readonly deduplicationId?: string;
}

export async function publishToQueue(_input: QueuePublishInput): Promise<void> {
  void QUEUE_VISIBILITY_TIMEOUT_SEC;
  // TODO: SQS / Rabbit / PubSub 等の実装
}
