/**
 * SKELETON — do not import directly.
 * Copy to: application/use-cases/（DECISION_TREE Q3 — 業務フロー）
 *
 * TODO: 入力 DTO・出力 DTO・ポート（repository / clock / id generator）を明示。
 *
 * 既知の注意:
 * - ユースケースはトランザクション境界を宣言するが、ORM の詳細は infrastructure へ閉じる。
 * - 複数集約の整合性はドメインイベント / サガ要件と照合する。
 */

export type UseCaseResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

export async function exampleUseCase(_input: unknown): Promise<UseCaseResult<null>> {
  // TODO: orchestrate repositories + domain services
  return { ok: true, value: null };
}
