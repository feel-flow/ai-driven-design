---
title: "DEPLOYMENT"
version: "1.4.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-09-08"
changeImpact: "medium"
---

# DEPLOYMENT.md - デプロイメント・運用ガイド

> **テンプレート直接利用**: `${CLAUDE_PLUGIN_ROOT}` がない環境では、この変数をシェルで展開しません。本文でプラグイン配下のテンプレートを参照する箇所は、同じ相対パスを [公開テンプレート配布元](https://github.com/feel-flow/ff-dev-toolkit/tree/HEAD/plugins/ff-dev-toolkit/docs-template) から参照・取得してください。利用する配布版に合わせたタグのファイルを選び、ローカルにある同名ファイルを無条件で上書きしないでください。
>
> **ASDD 2.0**: `.asdd/config.json` がある場合は合意したworkflowとfeaturesを優先する。以下の標準チェーンは従来環境または採用済み機能に適用する。ACE・振り返り・複数AIレビューは無効なら実行・催促せず、Hook・CIも選択したものだけ使う。既存の組織ルールやブランチ保護は維持する。
>
> **📏 ドキュメント最適化**: このファイルは索引として300-500行に抑えています。詳細は `deployment/` サブディレクトリ配下の個別ファイルを参照してください。
>
> **📦 初期セット外（重要）**: `deployment/` サブディレクトリは `/init-docs` の初期セットに含まれません（索引であるこの DEPLOYMENT.md 自身はコア7文書として必ずコピーされます）。本文が参照する `deployment/*.md` は、必要になった時点で `${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/deployment/` 配下の同一ファイル名からコピーしてください。展開直後のリンク切れを避けるため、以下では角括弧リンクではなくファイル名（例: `deployment/git-workflow.md`）で参照を示します。

## 📖 構成

> 下表の各ファイルは初期セット外です。必要になった時点で `${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/deployment/<ファイル名>` からコピーしてください。

| ドキュメント                                      | 内容                                              | 推奨読み順     |
| ------------------------------------------------- | ------------------------------------------------- | -------------- |
| `deployment/github-setup.md`                      | GitHub初期設定（ラベル・Release Drafter）         | ⭐⭐⭐⭐⭐ 0th |
| `deployment/git-workflow.md`                      | AI駆動Git Workflow全体                            | ⭐⭐⭐⭐⭐ 1st |
| `deployment/self-review.md`                       | セルフレビュー詳細（PR作成前）                    | ⭐⭐⭐⭐ 2nd   |
| `deployment/devin-pre-pr-review.md`               | Devin Pre-PRレビューシステム（5エージェント並列） | ⭐⭐⭐⭐ 2.5th |
| `deployment/automated-code-review.md`             | 自動コードレビュー（Claude Code + Husky）         | ⭐⭐⭐⭐ -     |
| `deployment/agent-deletion-prevention-harness.md` | 削除事故防止ハーネス設計                          | ⭐⭐⭐⭐ -     |
| `deployment/knowledge-management.md`              | ナレッジ体系化（マージ後・cleanup後）             | ⭐⭐⭐⭐ 3rd   |
| `deployment/ace-cycle.md`                         | ACEサイクル（Playbook増分更新）                   | ⭐⭐⭐⭐ 3.5th |
| `deployment/ace-autonomous.md`                    | ACE autonomous（subagent + worktree、任意）       | ⭐⭐⭐ 3.6th   |
| `deployment/ai-tools-integration.md`              | AIツール統合設定                                  | ⭐⭐⭐ -       |
| `deployment/ci-cd.md`                             | CI/CDパイプライン                                 | ⭐⭐⭐ 4th     |
| `deployment/infrastructure.md`                    | インフラ構成                                      | ⭐⭐⭐ -       |
| `deployment/multi-cli-review-orchestration.md`    | Multi-CLI分散レビュー                             | ⭐⭐⭐ -       |
| `deployment/review-response-policy.md`            | PRレビュー対応ポリシー                            | ⭐⭐⭐⭐ -     |
| `deployment/workflow-principles.md`               | ワークフロー運用原則（3原則＋TodoWrite）          | ⭐⭐⭐⭐ -     |
| `deployment/monitoring.md`                        | モニタリング                                      | ⭐⭐ -         |

## 🚀 クイックスタート（30秒で理解）

### AI駆動開発の基本フロー

段の一覧は [§主要ステップ](#主要ステップ) が持つ（同じファイルの中で二重に書かない）。

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

### 主要ステップ

**本節がワークフローの段の正本である。** `MASTER.md` §AI仕様駆動Git Workflow・`07-project-management/TASKS.md`・`deployment/git-workflow.md` は本節を参照し、**段を書き写さない**（写した先はそれぞれ独立に腐り、同じワークフローが文書ごとに違う段で書かれる）。番号は `deployment/git-workflow.md` の「ステップN」と同じものを指す。

**段が減ることはない。** 変更規模で変わるのは各段の重さで、フルではさらに段が増える（下の tier を参照）。

1. **Issue作成** - 作業の起点
2. **ブランチ作成** - `feature/{issue-num}-{name}`
3. **実装・コミット** - AI駆動開発
4. **テスト・検証** - `npm run quality:local` 等
5. **セルフレビュー** ← 詳細: `deployment/self-review.md`
6. **PR作成** - 構造化されたPR本文
7. **レビュー対応** - **レビュワーへのコメント必須**（修正内容・理由・変更箇所を明記）← 詳細: `deployment/git-workflow.md`
8. **マージ** - Squash推奨
9. **クリーンアップ** - ブランチ削除、`git fetch --prune`
10. **ナレッジ体系化** - マージ後・cleanup 後 ← 詳細: `deployment/knowledge-management.md` | ACE Playbook: `deployment/ace-cycle.md`

ステップ 10 の後、チェーン末尾として `/retrospective`（セッション振り返り）を毎回実行する。実測した手戻り・無駄時間・Keep・過剰動作を観測台帳へ記録し、閾値到達の再発からプロセス/ツール改善を最大 3 件提案し、起票はユーザー承認後のみ（利用者の包括的な実行指示がある場合はその範囲内で確認を省く。特急レーンは除く） ← 詳細: `deployment/git-workflow.md` の「チェーン末尾: セッション振り返り」

対応ホストでは `UserPromptSubmit` hook が応答前に注入し、`Stop` hook は実行漏れ時だけ自動継続する。ただし Codex の非対話単発実行（codex exec — hook 入力に `model` があり `permission_mode` が `bypassPermissions`）には注入されない（レビュー等のツール的起動の stdout を振り返り出力が奪わないため。判別できない入力へは従来どおり注入する）。`RETROSPECTIVE_MODE=ask` で実施前確認、`off` で自動発火を無効にできる。

#### 変更規模による tier

段の**重さ**は変更規模で決まる。判定は文書ではなく機械側にあり、`${CLAUDE_PLUGIN_ROOT}/scripts/workflow-tier.sh`（`${CLAUDE_PLUGIN_ROOT}` はプラグインのインストールルート。未定義のまま端末へ貼ると存在しないパスを叩いて終了コード 127 になる）が `git diff --no-renames --name-only <base>...HEAD`（rename 検出で移動元 path が消えないよう `--no-renames` が必須）から導出する。**上から順に評価し、最初に一致した tier を採る**。

| tier     | 判定                                 | 基準との差                                                                                             |
| -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| **フル** | 配布・リリースへ影響する path を含む | 標準の段に**加えて**、CHANGELOG への記載・回帰ゲートの全件実行・リリース準備と公開反映が段として増える |
| **軽量** | 変更が `.md` のみ                    | `/spec-driven` が軽量モードで動く（G1〜G2 を簡略化）                                                   |
| **標準** | 上記以外（実装変更）                 | 上の段をそのまま通す（基準）                                                                           |

**tier は他の規則を免除しない。** 配布対象を変更した回の CHANGELOG 記載や、テストを触った回の全件実行のように、`07-project-management/TASKS.md` の完了の定義が tier と独立に課す要求はそのまま残る。フル行はそれらが**必ず**要る場合を示すもので、軽量・標準が免除されるという意味ではない。

**tier はレビューの本数も減らさない。** レビューの*深さ*（どのレビュアーを何本回すか）は別の判定軸で、プロジェクトが `scripts/review-level.sh`（レビュー深度）を持つならそちらが決める。2 つを同じ表に混ぜると、同じ変更に対してどちらが支配するのか読めなくなる。tier が決めるのは段の重さ（`/spec-driven` のモード・CHANGELOG・リリース系の段）だけである。

`workflow-tier.sh --list-rules` が判定パターンの実効値を出力する。**パターンそのものをここへ書き写さない**（禁止を宣言した文の中で第 2 の正本を作らない）。既定はツールキット同梱物の形に合わせてあり、導入先プロジェクトは `WORKFLOW_TIER_FULL_PATTERNS` に自プロジェクトの配布・リリース成果物の path を与えて置き換える。書き写した値は上書きされた環境で嘘になる。

判定は**ディレクトリの所属ではなく「配布・リリースへの影響」**で行う。「公開対象の配下なら フル」という素朴な規則は、配布物とソースが同じ木に同居するリポジトリでは全 PR がフルへ落ちて機能しない。

着手時点（`/spec-driven` のモード判定）はまだ差分が無いため、予定している変更対象を path として渡す**暫定判定**しかできない。暫定判定は自己申告と同じ弱さを持つ（申告漏れは軽い側へ倒れる）ので、**PR を出す前に引数なしで実行した確定判定が拘束する**。暫定が確定と食い違ったら、確定側へ合わせる（暫定を追認しない）。

> **スキル未解決時のフォールバック**: チェーンのスキルが `Unknown skill` で解決できない場合、まず名前を疑う — セッションの利用可能スキル一覧をキーワードで検索して実名を確認し、プレフィックス付き（`<プラグイン名>:<スキル名>`）と無しの両方を試す（両者は別名として共存しうる）。`ListSkills` が返すのは claude.ai 側の別レジストリであり、その空振りを不在の根拠にしない。一覧にも無い場合（インストール済みプラグインが該当スキルの追加より古い）は、プラグインを更新するか、インストール済みプラグインの `skills/<スキル名>/SKILL.md` を直接 Read して手順に従う。それでも解決しない場合は、リポジトリ内の実体（`plugins/<プラグイン名>/skills/<スキル名>/SKILL.md`）とインストール済みプラグインディレクトリの中身を突き合わせる — プラグインが複数ディレクトリへ分割インストールされ、一部スキルが当該セッションのレジストリに載っていないことがある。その場合はリポジトリ側の SKILL.md を読んで手順に従う（スキルが存在しないと結論しない）。

### 詳細ドキュメント

- **全体フロー**: `deployment/git-workflow.md`
- **セルフレビュー**: `deployment/self-review.md`
- **ナレッジ管理**: `deployment/knowledge-management.md`
- **AIツール統合**: `deployment/ai-tools-integration.md`
- **削除事故防止**: `deployment/agent-deletion-prevention-harness.md`

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

`deployment/ci-cd.md`

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

`deployment/infrastructure.md`

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

`deployment/monitoring.md`

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

`deployment/infrastructure.md` の「4. ロールバック戦略」節

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

`deployment/infrastructure.md` の「5. 災害復旧 (DR)」節

## 7. 運用手順

### 定期メンテナンス

| タスク             | 頻度  | 手順             | 担当   |
| ------------------ | ----- | ---------------- | ------ |
| セキュリティパッチ | 月次  | patch-update.sh  | DevOps |
| 証明書更新         | 3ヶ月 | cert-renewal.sh  | DevOps |
| ログローテーション | 週次  | 自動             | -      |
| バックアップ検証   | 月次  | backup-verify.sh | DevOps |

### トラブルシューティング

一般的な問題の対処方法は `deployment/monitoring.md` の「トラブルシューティング」節を参照。

## 8. 開発環境の最適化

### Claude Code SessionStart Hook

PRマージ後のブランチ切り替え忘れを防ぐため、セッション開始時に自動チェック。

### 設定方法

`.claude/hooks/check-branch-status.sh` を配置。

### 詳細ドキュメント

`deployment/ai-tools-integration.md` の「SessionStart Hook」節

---

## 📚 AIツール向けナビゲーション

### 検索クエリマッピング

> 参照ドキュメントはすべて初期セット外の `deployment/*.md`。未導入の場合は `${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/deployment/` からコピーしてください。

| 知りたいこと             | 参照ドキュメント                                  | セクション           |
| ------------------------ | ------------------------------------------------- | -------------------- |
| Gitワークフロー全体      | `deployment/git-workflow.md`                      | 全体                 |
| セルフレビュー方法       | `deployment/self-review.md`                       | 全体                 |
| ナレッジ記録方法         | `deployment/knowledge-management.md`              | 全体                 |
| ACE Playbook更新         | `deployment/ace-cycle.md`                         | 全体                 |
| PRレビュー対応           | `deployment/git-workflow.md`                      | ステップ7            |
| レビュー結果の対応ルール | `deployment/review-response-policy.md`            | 全体                 |
| ワークフロー運用原則     | `deployment/workflow-principles.md`               | 全体                 |
| 削除事故防止ハーネス     | `deployment/agent-deletion-prevention-harness.md` | 全体                 |
| クロスモデルレビュー     | `deployment/multi-cli-review-orchestration.md`    | クロスモデルレビュー |
| CI/CD設定                | `deployment/ci-cd.md`                             | GitHub Actions       |
| インフラ構成             | `deployment/infrastructure.md`                    | Terraform            |
| モニタリング             | `deployment/monitoring.md`                        | CloudWatch           |

### AIツール向けプロンプトテンプレート

```
「[トピック]について、deployment/[ファイル名]を参照して説明してください」
```

例:

- 「セルフレビューについて、deployment/self-review.mdを参照して説明してください」
- 「CI/CDパイプラインについて、deployment/ci-cd.mdを参照して説明してください」

---

## Changelog

- 2026-09-08 追記: プラグイン変数がない直接利用でも取得できる公開配布元を明記（ai-spec-driven-development#525）。

### [1.4.0] - 2026-09-08

- ASDD 2.0: project-specific recommendations and explicitly agreed optional features (Issues #1372 / #1374).

### [1.3.0] - 2026-08-24

#### 変更

- §主要ステップ を**ワークフローの段の単一正本**にした。`MASTER.md` / `07-project-management/TASKS.md` / `deployment/git-workflow.md` は本節を参照する形へ寄せ、段の写しを持たない
- §主要ステップ に **変更規模による tier**（フル / 軽量 / 標準）を追加。判定は `${CLAUDE_PLUGIN_ROOT}/scripts/workflow-tier.sh` が差分から導出し、上から順に評価して最初に一致した tier を採る。判定パターンは `WORKFLOW_TIER_FULL_PATTERNS` で導入先の配布・リリース成果物へ差し替えられる
- tier がレビューの本数を減らさないことを明記した（レビューの深さは `scripts/review-level.sh` の別軸）
- クイックスタートの「基本フロー」がチェーンを二重に書いていたのを §主要ステップ への参照へ置換
- tier が完了の定義（配布対象を変更した回の CHANGELOG 記載・テストを触った回の全件実行）を免除しないことを明記
- tier 判定の式へ `--no-renames` を明記（rename 検出で移動元 path が消え、配布物の移動が軽量へ化けるため必須）。`${CLAUDE_PLUGIN_ROOT}` が未定義のまま貼ると終了コード 127 になる注記も追加

### [1.2.2] - 2026-08-21

#### 変更

- スキル未解決時のフォールバックに、プラグインが複数ディレクトリへ分割インストールされ一部スキルが当該セッションのレジストリに載っていない場合の突き合わせ手順（リポジトリ内の実体との照合・リポジトリ側 SKILL.md での続行・不在と結論しない）を追加

### [1.2.1] - 2026-08-20

#### 変更

- スキル未解決時のフォールバックに、名前確認の手順（利用可能スキル一覧の検索とプレフィックス付き / 無しの両試行）と、`ListSkills`（claude.ai 側の別レジストリ）の空振りは不在の根拠にならない旨を追加

### [1.2.0] - 2026-08-20

#### 追加

- 対応ホストの Stop hook による自動振り返りと `RETROSPECTIVE_MODE=ask|off` の案内を追加
- ワークフローチェーンのスキルが `Unknown skill` で解決できない場合のフォールバック（プラグイン更新、または SKILL.md の直接 Read）を主要ステップの案内に追加

### [1.1.0] - 2026-08-19

#### 追加

- ワークフローチェーン末尾の「セッション振り返り（`/retrospective`）」を基本フローと主要ステップの案内に追加

### [1.0.2] - 2026-07-07

#### 修正

- 別リポジトリ固有の移行設計ドキュメントへの相対リンク参照をテンプレートから除去（初期セット展開後のリンク切れ解消。Issue #39）

### [1.0.1] - 2026-07-07

#### 修正

- `deployment/` 配下（初期セット外）への Markdown リンクを、コピー元パス付きの案内テキスト／ファイル名参照に変更（初期セット展開直後のリンク切れ解消。Issue #37）

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成（旧「ドキュメント更新履歴」セクションを Changelog 形式に移行）
