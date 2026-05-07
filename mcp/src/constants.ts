// MASTER.md参照: マジックナンバー禁止。意味と単位をコメントで明示。

/**
 * 抜粋生成時の前後文字数（chars）
 * ユースケース: ドキュメント検索結果 excerpt。
 * 範囲: 40〜200 推奨。可変要件が出れば環境変数化。
 */
export const EXCERPT_PADDING_CHARS = 80 as const;

/** Specステータス列挙 */
export const SPEC_STATUS = [
  "draft",
  "review",
  "approved",
  "implementing",
  "done",
  "deprecated"
] as const;
export type SpecStatus = typeof SPEC_STATUS[number];
