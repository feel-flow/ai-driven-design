/**
 * SKELETON — do not import directly.
 * Copy to: interfaces/resolvers/（DECISION_TREE Q2 — GraphQL リゾルバ）
 *
 * TODO: N+1 対策（DataLoader 等）をスキーマ設計と同時に決める。
 *
 * 既知の注意:
 * - リゾルバに集約不変条件を書かない（ドメインサービス / ユースケースへ）。
 * - introspection やエラーメッセージからの情報漏えいに注意。
 */

export const exampleResolvers = {
  Query: {
    // TODO: フィールドごとに thin resolver → use case
    example: async (): Promise<null> => null,
  },
};
