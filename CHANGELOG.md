# Changelog

このプロジェクトの変更履歴。フォーマットは Keep a Changelog に準拠し、SemVer でバージョニングします。

## [Unreleased]

### Added
- **設計原則ドキュメントの体系化**（2026-05-07、Issue #404）
  - 新規: `docs/DESIGN_PRINCIPLES.md` — 5 原則（P1: URL 参照を一級市民とする / P2: 配布境界マップ / P3: 特定ツール依存物を配布対象に入れない / P4: ミニマル起点 + 段階拡張 / P5: 撤退コスト試算）と Obsidian 撤退ケーススタディを明文化
  - 編集: `README.md` に「設計原則」セクション追加（5 原則の概要表 + DESIGN_PRINCIPLES.md ポインタ）
  - 編集: `docs-template/MASTER.md` の関連ドキュメント一覧に DESIGN_PRINCIPLES.md を追加
  - ガードレール: `.github/pull_request_template.md` に「配布境界チェック」項目、`.github/ISSUE_TEMPLATE/feature.md` と `infra.md` に「撤退コスト試算」項目を追加
  - 配布版同期: `docs-template/.github/pull_request_template.md` と `docs-template/.github/ISSUE_TEMPLATE/feature.md`、`infra.md` にも一般化された相当チェック項目を追加
  - **背景**: PR #403 で Obsidian 統合を撤退したが、再発防止の構造的ガードレールが欠落していた。本変更により着手前・PR 提出前・新機能 Issue 起票時の 3 タイミングで違反を catch する仕組みを導入

### Removed
- **Obsidian 統合の完全排除**（2026-05-07、Issue #402）
  - 削除: `docs-template/.obsidian/`（4 設定ファイル）、`docs-template/08-knowledge/OBSIDIAN_GUIDE.md`、`docs-template/08-knowledge/OBSIDIAN_EVALUATION.md`、`mcp/src/obsidian/`（5 ソース）、`scripts/obsidian-sync.mjs`、`scripts/setup-obsidian-hook.sh`
  - 編集: `mcp/src/index.ts`（4 ツール `backlinks`/`validate_links`/`update_backlinks`/`orphaned_files` 削除）、`mcp/src/types.ts`（Obsidian 型定義削除）、`mcp/README.md`（Obsidian統合ツールセクション削除）、`package.json`（`obsidian:sync`/`obsidian:setup` scripts 削除）、`docs-template/MASTER.md`（OBSIDIAN_EVALUATION.md 参照削除）、`docs-template/05-operations/deployment/git-workflow.md`（Obsidian統合セクション削除）
  - **撤退理由**: `obsidian-sync.mjs` の自己破壊バグ（`OBSIDIAN_GUIDE.md` を 379 → 26 行に破壊）、post-merge フックの暴走（Issue #401）、Obsidian アプリ側のゴミファイル生成、テンプレート配布趣旨（URL 参照だけでミニマルに使える）とのミスマッチ

### Changed
- **書籍コンテンツを別リポジトリに分離**（2026-02-06）
  - `books/` ディレクトリおよび書籍関連ツール（校正スキル、イラスト生成、ビルドスクリプト等）を [feel-flow/ai-books](https://github.com/feel-flow/ai-books) に移動
  - 本リポジトリはAI仕様駆動開発のフレームワーク・テンプレートに専念

### Added
- **maxfiles 設定ガイドを運用ドキュメントとして追加**（2026-03-18）
  - `docs/MAXFILES_SETUP_GUIDE.md` を新規追加
    - macOS / Windows 向けのファイルディスクリプタ上限設定手順を整理
    - VS Code、`git worktree`、大規模 `node_modules` を扱う際の前提設定を明記
    - `EMFILE` やファイルウォッチャー停止に対するトラブルシューティングを追加
  - `README.md` にセットアップ時の参照導線を追加
  - `docs/OPERATIONAL_GUIDE.md` に関連ガイドとして参照を追加
  - ルート直下の `MAXFILES_SETUP_GUIDE.md` を削除して docs 配下へ整理

- **Issue起点のドキュメント管理戦略を書籍・テンプレートに追加**（2026-01-06）
  - **核心的な考え方**: `Issue = AIへのコンテキスト選択`
    - すべてのタスクで全7文書を読む必要はない
    - Issueの「参照ドキュメント」セクションで、AIに読ませる文書を選択
  - **書籍への追加**
    - `books/.../part3_practice/07_daily-workflow.md`: 「Issue = AIへのコンテキスト選択」セクション追加
      - タスク種別ごとの推奨参照文書一覧（新機能/バグ/リファクタ/インフラ/ドキュメント）
      - 関連Issueの参照方法
      - スコープ外の明示方法
      - 章末チェックリストに3項目追加
    - `books/.../part5_organization/14_roadmap-knowledge.md`: 「ドキュメント増加の管理戦略」セクション追加
      - 成長フェーズ（Phase 1〜3）の定義
      - ファイルサイズ制限と分割トリガー
      - アーカイブ戦略（基準・手順）
      - 月次参照チェックリスト
      - リンク切れチェックの自動化（GitHub Actions例）
      - 章末チェックリストに3項目追加
  - **テンプレートの追加・更新**
    - `docs-template/.github/ISSUE_TEMPLATE/` に5種類のテンプレートを追加
      - feature.md（新機能追加）
      - bug.md（バグ修正）
      - refactor.md（リファクタリング）
      - infra.md（インフラ変更）
      - docs.md（ドキュメント更新）
    - `docs-template/MASTER.md`: 「月次ドキュメント参照チェック」セクション追加
    - `docs-template/archive/.gitkeep`: アーカイブディレクトリ作成
  - **効果**: Issue作成時に必要な文書だけを選択し、AIのコンテキスト効率を向上。ドキュメント増加を管理し、陳腐化を防止

- **技術選定・バージョン管理・ADRの重要性を書籍・テンプレートに追加**（2026-01-06）
  - **書籍への追加**
    - `books/ai-spec-driven-development-90percent/part1_why-ai-fails/02_ai-weakness.md`: 「技術バージョン：もう一つの未記述要件」セクションを追加
      - AIのカットオフ（学習データの締め切り日）問題の解説
      - バージョンを明記しないとAIが古い書き方をするリスク
      - Next.js Pages Router vs App Router、React 18 vs 19の具体例
      - 技術スタックにバージョンを明記する解決策
      - ADR（Architecture Decision Record）の重要性の導入
      - 章末チェックリストに3項目追加
    - `books/ai-spec-driven-development-90percent/part2_spec-is-90percent/04_seven-documents.md`: ARCHITECTURE.mdセクションを大幅拡充
      - 技術スタックのバージョン明記の重要性（良い例/悪い例）
      - ADRの重要性と効果
      - ADRテンプレート（AI向け最適化版）：バージョン選定理由・AIカットオフ対策・非推奨API回避・AIへの指示セクション追加
      - ADR記述例：Next.js 15.0.xの選定（完全な実例）
      - ADRの管理方法（3つの選択肢と推奨）
      - 章末チェックリストに3項目追加
  - **テンプレートの更新**
    - `docs-template/MASTER.md`: 技術スタックセクションを拡充
      - バージョン付き概要テーブル追加（カテゴリ/技術/バージョン/AIへの注意点）
      - 「AIへの補足（カットオフ対策）」セクション追加
      - ARCHITECTURE.mdへのADR参照リンク追加
    - `docs-template/02-design/ARCHITECTURE.md`: ADRセクションを新設
      - 技術選定一覧テーブル（ADR番号列追加）
      - バージョン管理方針
      - ADR一覧テーブル
      - ADRテンプレート（AI向け最適化版）
      - ADR記述例（PostgreSQL 16.x）
  - **効果**: AIが技術バージョンを正しく理解し、非推奨APIを避けた最新の書き方でコードを生成できるようになる。ADRにより技術選定の背景をAIも人間も理解可能に

- **開発準備ガイド（DEVELOPMENT_PREPARATION.md）の追加**（2025-12-27）
  - `docs-template/06-reference/DEVELOPMENT_PREPARATION.md` を新規作成
    - 5つのPhaseで構成された体系的な開発準備プロセスを定義
      - Phase 1: Issue-First Development（要件をIssueで定義）
      - Phase 2: Document-Driven Design（技術をドキュメントで確定）
      - Phase 3: MECE検証（漏れなくダブりなく検証）
      - Phase 4: AI Spec-Driven Development（仕様をドキュメントで駆動）
      - Phase 5: Git Workflow（コードを管理）
    - 対象読者とステークホルダーの定義テンプレート
    - Issue作成のベストプラクティス（構成要素、ラベル、依存関係）
    - MECE検証チェックリスト（5つの視点: 機能・データフロー・ライフサイクル・関係者・非機能）
    - 開発準備完了チェックリスト
    - アンチパターン集
  - `docs-template/MASTER.md` に「開発プロセスガイド」セクションを追加
  - **効果**: 新規プロジェクト開始時に「何を決める必要があるか」を体系的に把握可能。FFIDプロジェクトで実践したベストプラクティスを汎用テンプレート化

- **AI駆動 Git Workflow ドキュメントの追加**（2025-12-27）
  - `docs/AI_GIT_WORKFLOW.md` を新規作成
    - AI開発ツールに最適化されたGit Flowベースのワークフロー解説
    - コアサイクル（9ステップ）の概要と図解（Mermaid記法）
    - セルフレビュー（5観点チェック）とナレッジ体系化の説明
    - ブランチ戦略、マージ戦略、クリーンアップ手順
    - ベストプラクティスと関連ドキュメントへのリンク
  - `README.md` の主要ドキュメントセクションにリンクを追加
  - **効果**: ワークフロー全体の概要を把握できるハブドキュメントとして機能し、詳細テンプレートへの導線を提供

## [v2.2.0] - 2025-12-09
### Added
- **GitHubラベル体系の標準化**（2025-12-09）
  - **標準準拠のラベル構成**
    - GitHubデフォルトラベルを最大限活用（`bug`, `enhancement`, `documentation`など）
    - 必要最小限のカスタムラベルのみ追加（`major`, `minor`, `patch`, `hotfix`, `urgent`）
    - 重複ラベル（`feature`, `fix`, `docs`, `chore`）を削除し、標準ラベルに統合
    - **効果**: セットアップ不要、GitHub標準に準拠、学習コスト削減、ツール連携の向上
  - **自動セットアップスクリプト**
    - `scripts/setup-github-labels.sh`: 必要なカスタムラベルを一括作成
    - 既存ラベルはスキップ（エラーなし）
    - インタラクティブな確認プロンプト
  - **包括的なドキュメント**
    - `docs-template/05-operations/deployment/github-setup.md`: GitHub初期設定ガイド（新規）
    - ラベルの使い分け、Release Drafterの設定、ワークフロースクリプトの使用方法を詳説
    - トラブルシューティングセクションを含む
  - **既存ファイルの更新**
    - `.github/release-drafter.yml`: 標準ラベルに対応（`enhancement`, `bug`, `documentation`使用）
    - `scripts/ai-workflow.sh`: `feature` → `enhancement` に更新
    - `docs-template/05-operations/deployment/git-workflow.md`: ラベル参照を標準化
    - `docs-template/05-operations/DEPLOYMENT.md`: 目次に `github-setup.md` を追加

- **ドキュメント構造の明確化**（2025-11-05）
  - **番号付きフォルダ構造の文書化**
    - README.mdに7文書のフォルダパス表記を追加（例: `01-business/PROJECT.md`）
    - README.mdに番号付きフォルダ構造図と採用理由を追加
    - GETTING_STARTED.mdにフォルダ構造図を配置し、全パス参照を修正
    - AGENTS.mdにフォルダ構造ガイドを追加（新規ドキュメント作成ルール含む）
    - **効果**: AIツールがプロジェクトURLやREADME参照時に、`docs/`直下に平らにファイルを作成するのを防止。正しいフォルダ構造を自動認識し、適切な場所にドキュメントを配置可能に

- **AI駆動Git Workflowの大幅強化**（2025-11-05）
  - **ステップ2.5: セルフレビュー（PR作成前）** の追加
    - AIツールを活用した5つの観点でのチェックリスト（コーディング規約、仕様整合性、テスト充実度、パフォーマンス・セキュリティ、ドキュメント更新）
    - 3つの実行方法：対話的レビュー（推奨）、自動化スクリプト、Git Hooks
    - セルフレビュー結果の記録テンプレート（PR本文への添付用）
    - ベストプラクティス（15-30分で完了、小さい単位で頻繁に実施）
    - **効果**: PRレビュー時の単純な指摘を事前に防ぎ、本質的な議論に集中可能

  - **ステップ5.5: ナレッジ体系化（マージ後）** の追加
    - GitHub Discussionsへの知見の体系的記録手順
    - 8カテゴリでのナレッジ分類体系（トラブルシューティング、ベストプラクティス、技術選定、パフォーマンス、セキュリティ、開発環境、テスト戦略、CI/CD）
    - ナレッジ記録の3つの方法：AIツールによる自動生成（推奨）、テンプレート使用、自動化スクリプト
    - 既存Discussionの検索・更新手順（GitHub CLI、GraphQL API活用）
    - 新規メンバーオンボーディングへの活用例
    - **効果**: 開発知見をチーム資産として蓄積、類似問題の解決時間を短縮

  - **ワークフロー全体の更新**
    - 変更前: `Issue → Branch → Commit → PR → Review → Merge → Cleanup → Next Task`
    - 変更後: `Issue → Branch → Commit → Self-Review → PR → Review → Merge → Knowledge → Cleanup → Next Task`
    - MASTER.mdとDEPLOYMENT.mdで一貫性を確保

## [v2.1.0] - 2025-10-28
### Added
- **ドキュメント構造の大幅改善**
  - `docs/` を `docs-template/` にリネーム（テンプレートとして明確化）
  - 企画フェーズのサポート追加
    - `docs-template/00-planning/PLANNING_TEMPLATE.md`: アイデア→要件定義の企画書テンプレート（9セクション構成）

- **完全初心者向けオンボーディング体系**
  - `docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md`: 何も決まっていない状態からの完全ガイド（4.5時間）
    - 環境準備（1時間）
    - アイデア発想（30分）
    - AIツールへの相談（1時間）
    - 技術選定（1時間）
    - 実装準備（1時間）
  - `docs-template/GETTING_STARTED_NEW_PROJECT.md`: 新規プロジェクト完全ガイド（8-12時間）
    - Phase 0: 企画（2-3時間）
    - Phase 1: 要件定義（2-3時間）
    - Phase 2: 技術選定（1-2時間）
    - Phase 3: システム設計（2-3時間）
    - Phase 4: 実装準備（1時間）

- **AIツールセットアップガイド3種**
  - `docs-template/SETUP_GITHUB_COPILOT.md`: GitHub Copilot完全セットアップ（30分）
    - **AIプロンプトで自動生成機能**: copilot-instructions.md を5-10分で自動生成
    - プロジェクト固有のカスタマイズ例（React、Node.js、Next.js）
    - 高度なプロンプトテンプレート集（既存コードベース学習、チーム規約変換等）
  - `docs-template/SETUP_CLAUDE_CODE.md`: Claude Code完全セットアップ（40分）
    - CLAUDE.md 設定ガイド
    - マルチターン対話、大規模コンテキスト活用法
    - プロンプトテンプレート集
  - `docs-template/SETUP_CURSOR.md`: Cursor完全セットアップ（60分）
    - .cursorrules 設定ガイド
    - AI Chat、Command K、Composer モード活用法
    - VS Code互換設定

- **情報不足時の必須確認プロトコル**（🚨 重要な追加機能）
  - `docs-template/MASTER.md`: 「AIツール向け重要ルール」セクション新設
    - 情報不足時の必須確認プロトコル定義
    - 必須確認事項チェックリスト（プロジェクト基本、技術的詳細、ビジネス要件）
    - 確認の出力形式テンプレート
    - 推論が許容される範囲の明示
    - 段階的確認の推奨フロー
    - 人間の検証タイミング（MASTER.md生成後、ARCHITECTURE.md生成後、コード生成後、デプロイ前）
  - すべてのAIツールセットアップガイドに確認ルール追加
    - AGENTS.md、CLAUDE.md、SETUP_*.md に統一フォーマットで実装
    - AIが推論で埋めず、必ず確認を求める仕組み
  - 実践例とプロンプトテンプレート追加
    - 良い例・悪い例の具体的な比較
    - データベース選択、認証方式選択等の実例

- **ドキュメントファイル命名規則の明確化**
  - `docs-template/MASTER.md`: コード命名規則とドキュメント命名規則を分離
    - ディレクトリ: `数字-英語小文字（ハイフン区切り）` (例: `01-context`, `02-design`)
    - ファイル: `英語大文字.md`（AI識別性優先）(例: `MASTER.md`, `ARCHITECTURE.md`)
    - 禁止事項: 日本語、スペース、アンダースコア、ファイル名への番号プレフィックス
  - `docs-template/03-implementation/CONVENTIONS.md`: 「0. ドキュメント命名規則」セクション新設
    - ディレクトリ構造の実例
    - 正しい例・間違い例の詳細ガイド
    - 命名ガイドライン（いつディレクトリを作るか、いつ大文字を使うか）
    - プロジェクト全体の構造例
  - 全AIツールガイドに命名規則参照を追加

- **Claude Skills統合ガイド**
  - `ai_spec_driven_development.md`: 新セクション「12. Claude Skillsによる実践的活用」
    - スキルの概要と特徴（モデル起動型、再利用可能性、拡張性）
    - 5分で完了する自動生成手順
    - 4つの自動化機能（プロジェクト初期化、新規ドキュメント追加、影響度評価、コミット前検証）
    - プロジェクトライフサイクル全体での実践例（Week 1-4）
    - チーム導入のベストプラクティス（スキル共有、標準プロンプト集、トラブルシューティング）
    - 測定可能な成果（92-90%の時間削減、100%の一貫性向上）
  - `docs-template/03-implementation/INTEGRATIONS.md`: AI開発ツール統合セクションを新設
    - 1.1 Claude Skills統合（インストール、機能、使用例、トラブルシューティング）
    - 1.2 GitHub Copilot統合（.github/copilot-instructions.md の設定例）
    - 1.3 Cursor統合（.cursorrules ファイルの設定例）

### Changed
- **ドキュメント構造の再編成**
  - 24ファイルをリネーム: `docs/` → `docs-template/`
  - すべてのドキュメント参照パスを更新（README.md、AGENTS.md、CLAUDE.md、MCP等）
  - `docs-template/GETTING_STARTED.md`: テンプレート使用に関する注記追加

- **README.md の Quick Start セクション強化**
  - 完全初心者向けガイドを最上位に配置
  - 新規プロジェクト、既存プロジェクト、AIツール設定の3つのパスを明確化
  - 所要時間を明記（完全初心者: 4.5時間、新規プロジェクト: 8-12時間、AIツール設定: 30-60分）

- **MASTER.md の関連ドキュメントセクション再構成**
  - 初心者・新規プロジェクト向け（3ガイド）
  - AIツール初期設定ガイド（3ガイド）
  - 既存プロジェクト向け（1ガイド）
  - コア7文書（6文書）
  - ナレッジベース（4文書）
  - 合計17文書への明確な導線

- **AIツール向けガイドの統一**
  - AGENTS.md に情報確認ルール追加
  - CLAUDE.md に Information Verification Protocol 追加
  - すべてのセットアップガイドに確認ルールを統合

- **MCP サーバー設定の更新**
  - `mcp/index.mjs`: docsRoot を "docs" から "docs-template" に変更
  - `mcp/README.md`: Glossary パス更新
  - 説明文の例を最新のディレクトリ構造に合わせて更新

- 既存のセクション「12. まとめ：パラダイムシフトの必要性」をセクション13に変更（Claude Skillsセクション追加に伴う構造調整）
- 目次を更新し、新セクション12とサブセクション（12.1-12.5）を追加

### Impact
- **High Impact**: プロジェクト全体の構造変更
  - すべてのドキュメントパスが変更（`docs/` → `docs-template/`）
  - 外部からのリンクは引き続き機能（GitHubが自動リダイレクト）
  - AIツールの動作に影響（確認プロトコルの追加により、より慎重な動作）
- **Medium Impact**: 
  - 新規ユーザーのオンボーディング体験が大幅に向上
  - AIツールの設定が明確化され、チーム展開が容易に
  - 情報不足による手戻りが大幅削減

### Migration Notes
- 既存プロジェクトで `docs/` フォルダを参照している場合、`docs-template/` に変更
- AIツール設定ファイル（.github/copilot-instructions.md、CLAUDE.md、.cursorrules）の更新推奨
- MASTER.md の情報不足時確認プロトコルに従って、AIとの対話を見直すことを推奨

### Breaking Changes
- `docs/` ディレクトリが `docs-template/` に変更
  - Git履歴は保持（git mv使用）
  - 既存の参照は更新が必要

### Performance
- AIツールの判断精度向上により、手戻り時間が推定60-80%削減
- ドキュメント生成時間: 5-10分に短縮（AIプロンプト自動生成機能使用時）

### Files Changed
- 37ファイルの変更
  - 24ファイルのリネーム
  - 6ファイルの新規作成
  - 7ファイルの内容更新

## [v2.0.0] - 2025-10-16
### Added
- 新ドキュメント運用仕様書 `ai_spec_driven_development.md` (再構築後版): フロントマター標準・分類マトリクス・更新ポリシー・AIエージェント操作チェックリストを追加
- 変更インパクトレベル (low/medium/high) と差分分類ルール
- MUSTコマンド群によるAI自動化前提の運用フロー定義

### Changed
- 旧 `ai_spec_driven_development.md` の長文ナラティブ構成を撤廃し、< 1画面単位で把握可能なセクション化された運用仕様へ再編 (High Impact)
- 文書間参照の正規化 (MASTER.md / ARCHITECTURE.md / DOMAIN.md との明示的 References)
- バージョンを 0.x 系から 2.0.0 へメジャーアップ (構造的破壊的変更)

### Removed
- 冗長な歴史的説明・概念重複ブロック (>2000行) を削除し検索ノイズを解消

### Security
- ドキュメント変更時の補助チェックリストに「機密情報/シークレット流出防止」項目を追加 (セキュリティゲート強化)

### Performance
- AIエージェントのドキュメント読込ステップ短縮 (推定: 初期解析時間 ~60% 削減) に寄与する構造化 (定量計測予定)

### Migration Notes
- 旧構造参照している README 内リンクは自動/手動検証後に更新が必要 (Unreleased タスク)
- 追加された差分分類 (HIGH/MEDIUM/LOW) を以後のドキュメントPRテンプレートへ反映予定

### Impact
- High Impact: 他AIエージェント文書参照順序/自動化フローに影響。CHANGELOG/ADR/LESSONS_LEARNED 更新必須。

### Follow-up (Unreleased)
- [ ] PRテンプレートへ Impact Level / 文書分類チェック項目を追加
- [ ] docs/04-quality/VALIDATION.md にドキュメント構造検証手順を統合

## [v0.3.0] - 2025-09-25

## [v0.3.0] - 2025-09-25
### Added
- ナレッジ蓄積システム（08-knowledge/フォルダ）の追加
  - `LESSONS_LEARNED.md`: 開発過程で得た知見・解決策の記録
  - `TROUBLESHOOTING.md`: よくある問題と解決策の集約
  - `BEST_PRACTICES.md`: プロジェクト固有のベストプラクティス集
  - `FAQ.md`: よくある質問と回答
- AIエージェント向けガイドシステムの構築
  - `AGENTS.md`: 全AIエージェント向け統一ガイド
  - `CLAUDE.md`: Claude Code専用ガイド（MASTER.md参照必須化）
  - `.cursorrules`: Cursor用設定ファイル
  - `.github/copilot-instructions.md`: GitHub Copilot用設定ファイル
- 初期・成長フェーズでのナレッジ管理の重要性を文書化
- AI駆動開発におけるナレッジ活用の説明を追加

### Changed
- `docs/MASTER.md`: 関連ドキュメントのパスを正しい階層構造に修正
- `ai_spec_driven_development.md`: ナレッジ蓄積の重要性とフォルダ構造を追加
- `README.md`: AIエージェント向けガイドセクションを追加
- 実装ロードマップにナレッジ管理の要素を組み込み

### Fixed
- ドキュメント間のリンクの整合性を向上
- AIエージェントがMASTER.mdを必ず参照する仕組みを構築

## [v0.2.0] - 2025-09-14
### Added
- Quickstart への導線整備（README・MASTERのリンク）
- リリース自動化（Release Drafter + タグでGitHub Release作成のActions）
- CHANGELOG 初版

### Changed
- README の「始め方」を Quickstart 起点に更新
- README.md を DRY原則に基づき簡潔化（68行→45行、33%削減）
  - 7文書構造の詳細説明を ai_spec_driven_development.md へ集約
  - エントリーポイント機能に特化（ナビゲーション中心）
  - 重複情報を排除し、完全ガイドへの参照を強化

## [v0.1.0] - 2025-08-29
### Added
- `docs/GETTING_STARTED.md`: AI駆動（ドキュメント基準）開発 Quickstart
- Quickstart 前提（AI優先・一次情報での検証・時間は目安）

[Unreleased]: https://github.com/feel-flow/ai-spec-driven-development/compare/v2.1.0...HEAD
[v2.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v2.1.0
[v2.0.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v2.0.0
[v0.3.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.3.0
[v0.2.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.2.0
[v0.1.0]: https://github.com/feel-flow/ai-spec-driven-development/releases/tag/v0.1.0