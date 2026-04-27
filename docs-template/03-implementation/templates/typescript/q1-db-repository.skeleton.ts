/**
 * SKELETON — do not import directly.
 * Copy to: infrastructure/repositories/（DECISION_TREE Q1 — DB アクセス）
 *
 * TODO: ドメインのポート（インターフェース）を application 層で定義し、ここで実装する。
 * TODO: SQL はパラメータバインドのみ使用（文字列連結でクエリを組まない）。
 *
 * 既知の注意:
 * - N+1 クエリ、長時間ロック、コネクションプール枯渇に注意。
 * - マイグレーションとリポジトリの責務を混ぜない（Q4 参照）。
 */

// TODO: import type { OrderRepository } from '../../application/ports/order-repository';

/** ページサイズ上限（件）。DoS 防止のため API 層と整合させる。 */
const REPOSITORY_MAX_PAGE_SIZE = 100;

export function createOrderRepository(/* deps: { pool: DbPool } */): unknown {
  void REPOSITORY_MAX_PAGE_SIZE;
  // TODO: OrderRepository の具象実装
  return {};
}
