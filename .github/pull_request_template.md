## Summary

<!-- 変更の概要を1〜3行で記述してください -->

## Changes

<!-- 変更内容をファイルごとに記載してください -->
<!-- 例: -->
<!-- ### New: `docs/guide/new-guide.md` -->
<!-- - ガイド文書を追加 -->
<!-- ### Updated: `mcp/src/index.ts` -->
<!-- - ○○機能を修正 (src/index.ts:42-58) -->

## Self-Review Results

- [ ] **ローカル品質ゲート**（旧 CI 相当: 依存を最新にしたうえで `npm ci` → `npm --prefix mcp ci` → `npm run build:mcp` → `npm run check` → `npm --prefix mcp test` → `npm run test:ace-scripts` → `npm run validate -- docs-template` → `npm run lint:md`）を **PR 提出前**に実行し、**失敗がない**ことを確認した
- [ ] または、ルートの **`npm run quality:local`**（上記と同順で、`npm ci` / `mcp ci` を除く）を実行し、**失敗がない**ことを確認した
- [ ] `markdownlint`: 該当 Markdown に問題なし（Husky pre-commit と整合）
- [ ] MCP: `npm run check` 相当でエラーなし（該当する場合）
- [ ] テスト: `npm --prefix mcp test` および `npm run test:ace-scripts`（該当する場合）がパス

> **注**: リモート **GitHub Actions** に依存しない方針のため、**マージ前の品質はローカル実行＋本チェックリスト**を前提とする。

### Cross-Model Review Results

- [ ] PR Review Toolkit: 実施済み
- [ ] Codex CLI (`bash scripts/codex-review.sh --branch`): 実施済み
- [ ] [Review Response Policy](docs-template/05-operations/deployment/review-response-policy.md) に従い対応済み

## Test plan

<!-- テスト手順を記載してください -->

- [ ] （テスト手順を記載）

## Checklist

- [ ] MASTER.md のコード生成ルールに準拠
- [ ] マジックナンバー禁止ルールを遵守（該当する場合）
- [ ] 型安全性を確保（該当する場合）
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
