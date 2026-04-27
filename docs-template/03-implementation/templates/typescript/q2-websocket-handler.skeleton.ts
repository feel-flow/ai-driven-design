/**
 * SKELETON — do not import directly.
 * Copy to: interfaces/websockets/（DECISION_TREE Q2 — WebSocket）
 *
 * TODO: 認証（接続時トークン検証）と部屋 / テナント単位の ACL。
 *
 * 既知の注意:
 * - メッセージレート制限と最大同時接続を設計に含める。
 * - サーバ送信イベントと REST の状態の整合（再送・冪等）。
 */

/** クライアントからの最大メッセージサイズ（バイト）。 */
const WS_MAX_MESSAGE_BYTES = 65_536;

export function attachWebSocketHandlers(_socket: unknown): void {
  void WS_MAX_MESSAGE_BYTES;
  // TODO: on('message') → validate → domain/application
}
