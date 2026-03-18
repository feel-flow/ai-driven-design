## Summary

<!-- 変更の概要を1〜3行で記述してください -->

## Changes

<!-- 変更内容をファイルごとに記載してください -->
<!-- 例: -->
<!-- ### New: `src/services/auth.ts` -->
<!-- - JWT認証サービスを追加 -->
<!-- ### Updated: `src/routes/api.ts` -->
<!-- - 認証ミドルウェアを適用 (src/routes/api.ts:12-45) -->

## Self-Review Results

<!-- セルフレビューの結果を記載してください -->

- [ ] Lint: エラーなし
- [ ] テスト: パス
- [ ] ビルド: 成功

### Cross-Model Review Results

- [ ] PR Review Toolkit: 実施済み
- [ ] Codex CLI (`bash scripts/codex-review.sh --branch`): 実施済み
- [ ] [Review Response Policy](../05-operations/deployment/review-response-policy.md) に従い対応済み

## Test plan

<!-- テスト手順を記載してください -->

- [ ] （テスト手順を記載）

## Checklist

<!-- MASTER.md のルールに基づくチェックリスト -->

- [ ] MASTER.md のコード生成ルールに準拠
- [ ] マジックナンバー禁止ルールを遵守
- [ ] 型安全性を確保（any 禁止）
- [ ] テストカバレッジ 80% 以上を達成
- [ ] リンク切れがない

## HIGH Impact Changes

<!-- 影響度 HIGH の場合のみ記入してください（/assess-impact で判定可能） -->
<!-- HIGH判定基準: 後方互換性のない変更、アーキテクチャ変更、DBスキーマ変更、認証方式変更 -->

- [ ] 影響を受ける文書のリストを作成した
- [ ] 後方互換性を確認した
- [ ] 移行計画を策定した（Phase 1/2/3）
- [ ] ロールバック計画を策定した（トリガー条件＋手順）
- [ ] ADR を作成した（DECISIONS.md に追記）

## Related Issue

<!-- Closes #XX -->
