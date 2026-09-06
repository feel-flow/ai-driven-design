---
title: "DEPLOYMENT"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# DEPLOYMENT.md - デプロイメント・運用ガイド

> **📏 ドキュメント最適化**: このファイルは索引として300-500行に抑えています。詳細は deployment/ ディレクトリ配下の個別ファイルを参照してください（配置については次節の「配置について」を参照）。

## 📖 構成

> **配置について**: `deployment/` 配下の各ファイルは `/init-docs` の初期セット外で、展開直後のプロジェクトには配置されていない。必要になった時点でテンプレート配布元（GitHub の `feel-flow/ai-spec-driven-development` リポジトリの docs-template ディレクトリ、または ff-dev-toolkit プラグインの同梱版）の同一相対パスからコピーする（コピー後は `docs/05-operations/deployment/<ファイル名>` で参照できる）。未コピーの状態では、本文書内の `deployment/*.md` を参照させるプロンプト例も成立しない。

| ドキュメント                                                         | 内容                                              | 推奨読み順     |
| -------------------------------------------------------------------- | ------------------------------------------------- | -------------- |
| `docs/05-operations/deployment/github-setup.md`                      | GitHub初期設定（ラベル・Release Drafter）         | ⭐⭐⭐⭐⭐ 0th |
| `docs/05-operations/deployment/git-workflow.md`                      | AI駆動Git Workflow全体                            | ⭐⭐⭐⭐⭐ 1st |
| `docs/05-operations/deployment/self-review.md`                       | セルフレビュー詳細（PR作成前）                    | ⭐⭐⭐⭐ 2nd   |
| `docs/05-operations/deployment/devin-pre-pr-review.md`               | Devin Pre-PRレビューシステム（5エージェント並列） | ⭐⭐⭐⭐ 2.5th |
| `docs/05-operations/deployment/automated-code-review.md`             | 自動コードレビュー（Claude Code + Husky）         | ⭐⭐⭐⭐ -     |
| `docs/05-operations/deployment/agent-deletion-prevention-harness.md` | 削除事故防止ハーネス設計                          | ⭐⭐⭐⭐ -     |
| `docs/05-operations/deployment/knowledge-management.md`              | ナレッジ体系化（マージ後・cleanup後）             | ⭐⭐⭐⭐ 3rd   |
| `docs/05-operations/deployment/ace-cycle.md`                         | ACEサイクル（Playbook増分更新）                   | ⭐⭐⭐⭐ 3.5th |
| `docs/05-operations/deployment/ace-autonomous.md`                    | ACE autonomous（subagent + worktree、任意）       | ⭐⭐⭐ 3.6th   |
| `docs/05-operations/deployment/ai-tools-integration.md`              | AIツール統合設定                                  | ⭐⭐⭐ -       |
| `docs/05-operations/deployment/ci-cd.md`                             | CI/CDパイプライン                                 | ⭐⭐⭐ 4th     |
| `docs/05-operations/deployment/infrastructure.md`                    | インフラ構成                                      | ⭐⭐⭐ -       |
| `docs/05-operations/deployment/multi-cli-review-orchestration.md`    | Multi-CLI分散レビュー                             | ⭐⭐⭐ -       |
| `docs/05-operations/deployment/review-response-policy.md`            | PRレビュー対応ポリシー                            | ⭐⭐⭐⭐ -     |
| `docs/05-operations/deployment/workflow-principles.md`               | ワークフロー運用原則（3原則＋TodoWrite）          | ⭐⭐⭐⭐ -     |
| `docs/05-operations/deployment/monitoring.md`                        | モニタリング                                      | ⭐⭐ -         |

**本テンプレートのソースリポジトリでの運用例（移行設計）**: [NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md)（GitHub Actions を使わない運用。ルートで `npm run quality:local`、Release Drafter **用ワークフロー**は不要でよい。Issue #377）

## 🚀 クイックスタート（30秒で理解）

### AI駆動開発の基本フロー

```
Issue → Branch → Implement → Test → Self-Review → PR → Review → Merge → Cleanup → ACE → Next Task
```

**詳細**: `docs/05-operations/deployment/git-workflow.md`

### よく使うコマンド

```bash
# 1. Issue作成
gh issue create --title "feat: ..." --body "..."

# 2. ブランチ作成
git checkout -b "feature/123-feature-name"

# 3. セルフレビュー（AIツールに依頼）
「MASTER.mdとPATTERNS.mdに基づいて、今回の変更をレビューしてください」

# 4. PR作成
gh pr create --base develop --title "..." --body "..."

# 5. ナレッジ記録（マージ後）
gh discussion create --category "..." --title "..." --body-file knowledge.md
```

## 1. AI仕様駆動Git Workflow

### 概要

Git Flowベースで、**テスト・セルフレビュー（PR前）** と **ACEナレッジ体系化（マージ後・cleanup後）** を組み込んだワークフロー。

### 主要ステップ（10 ステップ）

1. **Issue作成** - 作業の起点
2. **ブランチ作成** - `feature/{issue-num}-{name}`
3. **実装・コミット** - AI駆動開発
4. **テスト・検証** - `npm run quality:local` 等
5. **セルフレビュー** ← 詳細は `docs/05-operations/deployment/self-review.md`
6. **PR作成** - 構造化されたPR本文
7. **レビュー対応** - **レビュワーへのコメント必須**（修正内容・理由・変更箇所を明記）← 詳細は `docs/05-operations/deployment/git-workflow.md`
8. **マージ** - Squash推奨
9. **クリーンアップ** - ブランチ削除、`git fetch --prune`
10. **ナレッジ体系化** - マージ後・cleanup 後 ← 詳細は `docs/05-operations/deployment/knowledge-management.md` | ACE Playbook は `docs/05-operations/deployment/ace-cycle.md`

### 詳細ドキュメント

- **全体フロー**: `docs/05-operations/deployment/git-workflow.md`
- **セルフレビュー**: `docs/05-operations/deployment/self-review.md`
- **ナレッジ管理**: `docs/05-operations/deployment/knowledge-management.md`
- **AIツール統合**: `docs/05-operations/deployment/ai-tools-integration.md`
- **削除事故防止**: `docs/05-operations/deployment/agent-deletion-prevention-harness.md`

### ブランチ戦略（Git Flow準拠）

```
main/master    ← 本番リリース（常時デプロイ可能）
  ↑
develop       ← 開発統合（次期リリース）
  ↑
feature/*     ← 機能開発（Issueベース）
hotfix/*      ← 緊急修正
release/*     ← リリース準備
```

**命名規則**:

- `feature/{issue-number}-{description}` 例: `feature/123-user-auth`
- `hotfix/{issue-number}-{description}` 例: `hotfix/456-security-patch`
- `release/{version}` 例: `release/1.2.0`

## 2. CI/CDパイプライン

### 概要

GitHub Actions/GitLab CI/Jenkinsによる自動化パイプライン。

### 主要構成

- **テスト**: 単体テスト、統合テスト、E2Eテスト
- **ビルド**: アプリケーションのコンパイル・バンドル
- **デプロイ**: 環境別デプロイ（develop → staging → production）
- **通知**: Slack/Teams通知

### 詳細ドキュメント

`docs/05-operations/deployment/ci-cd.md`

## 3. インフラストラクチャ

### 環境構成

| 環境        | 用途         | URL例               | インフラ |
| ----------- | ------------ | ------------------- | -------- |
| Development | 開発環境     | dev.example.com     | 軽量構成 |
| Staging     | ステージング | staging.example.com | 本番同等 |
| Production  | 本番環境     | app.example.com     | 高可用性 |

### デプロイメント方式

- **Blue-Green Deployment**: 本番環境
- **Rolling Update**: ステージング環境
- **Direct Deployment**: 開発環境

### 詳細ドキュメント

`docs/05-operations/deployment/infrastructure.md`

## 4. モニタリング

### 監視項目

- **アプリケーションメトリクス**: CPU、メモリ、レスポンスタイム
- **ビジネスメトリクス**: ユーザー数、エラー率、トランザクション
- **インフラメトリクス**: サーバー稼働率、ネットワーク

### アラート設定

- CPU使用率 > 80%
- エラー率 > 5%
- レスポンスタイム > 1秒（P95）

### 詳細ドキュメント

`docs/05-operations/deployment/monitoring.md`

## 5. ロールバック戦略

### 自動ロールバック条件

- エラー率が5%を超える
- P99レスポンスタイムが1秒を超える
- メモリ使用率が90%を超える

### 手動ロールバック

```bash
# 前バージョンにロールバック
./scripts/rollback.sh [deployment-id]
```

### 詳細ドキュメント

`docs/05-operations/deployment/infrastructure.md` の「4. ロールバック戦略」節

## 6. 災害復旧

### バックアップ戦略

- **データベース**: 日次バックアップ、30日保持
- **アプリケーションデータ**: 時間次バックアップ、7日保持
- **設定ファイル**: 変更時バックアップ、90日保持

### 復旧手順

```bash
# 最新バックアップから復元
./scripts/disaster-recovery.sh
```

### 詳細ドキュメント

`docs/05-operations/deployment/infrastructure.md` の「5. 災害復旧 (DR)」節

## 7. 運用手順

### 定期メンテナンス

| タスク             | 頻度  | 手順             | 担当   |
| ------------------ | ----- | ---------------- | ------ |
| セキュリティパッチ | 月次  | patch-update.sh  | DevOps |
| 証明書更新         | 3ヶ月 | cert-renewal.sh  | DevOps |
| ログローテーション | 週次  | 自動             | -      |
| バックアップ検証   | 月次  | backup-verify.sh | DevOps |

### トラブルシューティング

一般的な問題の対処方法は `docs/05-operations/deployment/monitoring.md` の「トラブルシューティング」節を参照。

## 8. 開発環境の最適化

### Claude Code SessionStart Hook

PRマージ後のブランチ切り替え忘れを防ぐため、セッション開始時に自動チェック。

### 設定方法

`.claude/hooks/check-branch-status.sh` を配置。

### 詳細ドキュメント

`docs/05-operations/deployment/ai-tools-integration.md` の SessionStart hook 節

---

## 📚 AIツール向けナビゲーション

### 検索クエリマッピング

| 知りたいこと             | 参照ドキュメント                                                     | セクション           |
| ------------------------ | -------------------------------------------------------------------- | -------------------- |
| Gitワークフロー全体      | `docs/05-operations/deployment/git-workflow.md`                      | 全体                 |
| セルフレビュー方法       | `docs/05-operations/deployment/self-review.md`                       | 全体                 |
| ナレッジ記録方法         | `docs/05-operations/deployment/knowledge-management.md`              | 全体                 |
| ACE Playbook更新         | `docs/05-operations/deployment/ace-cycle.md`                         | 全体                 |
| PRレビュー対応           | `docs/05-operations/deployment/git-workflow.md`                      | ステップ7            |
| レビュー結果の対応ルール | `docs/05-operations/deployment/review-response-policy.md`            | 全体                 |
| ワークフロー運用原則     | `docs/05-operations/deployment/workflow-principles.md`               | 全体                 |
| 削除事故防止ハーネス     | `docs/05-operations/deployment/agent-deletion-prevention-harness.md` | 全体                 |
| クロスモデルレビュー     | `docs/05-operations/deployment/multi-cli-review-orchestration.md`    | クロスモデルレビュー |
| CI/CD設定                | `docs/05-operations/deployment/ci-cd.md`                             | GitHub Actions       |
| インフラ構成             | `docs/05-operations/deployment/infrastructure.md`                    | Terraform            |
| モニタリング             | `docs/05-operations/deployment/monitoring.md`                        | CloudWatch           |

### AIツール向けプロンプトテンプレート

```
「[トピック]について、deployment/[ファイル名]を参照して説明してください」
```

例:

- 「セルフレビューについて、deployment/self-review.mdを参照して説明してください」
- 「CI/CDパイプラインについて、deployment/ci-cd.mdを参照して説明してください」

---

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成（旧「ドキュメント更新履歴」セクションを Changelog 形式に移行）
