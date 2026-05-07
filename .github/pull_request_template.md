## Summary

<!-- 変更の概要を1〜3行で記述してください -->

## PR Size Check

<!-- PR の差分行数（追加 + 削除）を記載し、該当する区分にチェック -->

- 差分: **\_\_\_** 行（追加 + 削除、生成物・lockfile を除く）

- [ ] 200 行以下 — 推奨レンジ（即レビュー可能）
- [ ] 201〜400 行 — ⚠️ レビュー見落としリスク増加（理由を Summary に記載）
- [ ] 401 行以上 — 🚨 原則として分割推奨（分割不可の理由 / レビュー観点ガイドを以下に記載）

> **目安**: 1 機能あたり 200 行以下を推奨。400 行を超える場合はマージ前に分割を検討するか、分割困難な場合は **レビュー観点ガイド**（読む順序・前提コンテキスト・重点確認箇所）を Summary に明記する。詳細: [docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成](../docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成)。

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

## 配布境界チェック（[DESIGN_PRINCIPLES.md](../docs/DESIGN_PRINCIPLES.md) P2/P3）

> `docs-template/` 配下を変更している PR では必ず確認。それ以外は該当なしで OK。

- [ ] **該当なし**（`docs-template/` 配下を変更していない）/ 以下を確認した:
- [ ] **配布境界違反なし**: `docs-template/` 配下に配置したファイルは、テンプレ利用者が特定ツール（Obsidian / Notion / Hugo 等）なしでも読める素の Markdown / 一般的な設定（git, prettier, markdownlint 等）に限られる
- [ ] **特定ツール依存物なし**: Obsidian Vault 設定 (`.obsidian/`)・Notion 連携・Hugo/Jekyll テーマ等、特定アプリのインストールを前提とするファイルを `docs-template/` 配下に置いていない
- [ ] **配布版テンプレ同期**: `.github/ISSUE_TEMPLATE/`・`.github/pull_request_template.md` を変更した場合、`docs-template/.github/` 配下の対応ファイルも更新した（または、リポ固有内容のため同期不要と判断した理由を記載）

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
