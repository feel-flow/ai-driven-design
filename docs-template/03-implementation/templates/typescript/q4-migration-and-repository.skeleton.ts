/**
 * SKELETON — do not import directly.
 * Copy to: migrations/ の SQL と infrastructure/repositories/ の TS を別ファイルに分割して配置（DECISION_TREE Q4 — DB スキーマ変更）
 *
 * TODO: マイグレーションは前進のみ（ロールバック方針は運用ドキュメントに記載）。
 *
 * 既知の注意:
 * - 大テーブルへのロック回避（オンライン DDL / 段階的移行）。
 * - リポジトリのマッピング層にビジネスルールを置かない。
 */

// 本ファイルは「リポジトリ側の変更着手点」のメモ用。実際の DDL は migrations/*.sql へ。

export const MIGRATION_CHECKLIST = [
  'Add forward migration SQL under migrations/',
  'Update repository mapping only in infrastructure/repositories/',
] as const;
