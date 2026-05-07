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

## 配布境界・特定ツール依存チェック

<!--
プロジェクトに「配布物（他者がコピー / 参照する成果物）」と「自分用インフラ（運用ツール）」の二重用途がある場合に確認。
配布物に特定ツール（Obsidian / Notion / Hugo 等）依存の設定・スクリプトを混入させると、利用者の最小構成が壊れる。
本テンプレートのソースリポでも同じ理由で Obsidian 統合を撤退した実績あり（参考事例）。
-->

- [ ] **該当なし**（配布物 / 自分用インフラの二重用途がない）/ 以下を確認した:
- [ ] **配布境界違反なし**: 配布対象ディレクトリに置いたファイルは、利用者が特定ツールなしでも読める素の Markdown / 一般的な設定（git, prettier, markdownlint 等）に限られる
- [ ] **特定ツール依存物なし**: 特定アプリのインストールを前提とするファイルを配布対象に置いていない

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
