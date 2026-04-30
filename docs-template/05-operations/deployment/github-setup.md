# GitHub初期設定ガイド

AI Spec-Driven DevelopmentプロジェクトでGitHubリポジトリを初期設定する際の手順です。

## 概要

このガイドでは、以下を設定します：

1. **GitHubラベル** - Issue/PR管理用ラベル
2. **リリースノート** - 本リポジトリでは [NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](../../../docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) に従い **手動**（`gh release create` 等）を前提とする。Release Drafter **用の GitHub Actions ワークフロー**を使う場合は任意（テンプレ利用・fork 先では従来どおり有効化してもよい）。
3. **推奨ワークフロー** - 標準的な開発フロー

`.github/release-drafter.yml`（設定ファイル）は、**手動でリリースノートをまとめる際のカテゴリ分け**の参考として残すことがあります（ワークフローが無くても意味のあるラベル構造の説明として利用可能）。

## 1. GitHubラベルの設定

### 推奨ラベル構成

AI Spec-Driven Developmentでは、**GitHubデフォルトラベル + 必要最小限のカスタムラベル**の構成を推奨します。

#### GitHubデフォルトラベル（そのまま使用）

| ラベル             | 用途             | カラー  |
| ------------------ | ---------------- | ------- |
| `bug`              | バグ報告・修正   | #d73a4a |
| `enhancement`      | 新機能・改善     | #a2eeef |
| `documentation`    | ドキュメント更新 | #0075ca |
| `duplicate`        | 重複Issue/PR     | #cfd3d7 |
| `good first issue` | 初心者向けタスク | #7057ff |
| `help wanted`      | ヘルプ募集       | #008672 |
| `invalid`          | 無効なIssue      | #e4e669 |
| `question`         | 質問             | #d876e3 |
| `wontfix`          | 対応しない       | #ffffff |

#### カスタムラベル（追加が必要）

| ラベル   | 用途                                 | カラー  | バージョン影響  |
| -------- | ------------------------------------ | ------- | --------------- |
| `major`  | メジャーバージョン変更（破壊的変更） | #D93F0B | v1.0.0 → v2.0.0 |
| `minor`  | マイナーバージョン変更（新機能追加） | #FBCA04 | v1.0.0 → v1.1.0 |
| `patch`  | パッチバージョン変更（バグ修正）     | #5FBF4A | v1.0.0 → v1.0.1 |
| `hotfix` | 緊急修正（本番環境の重大な不具合）   | #E11D21 | -               |
| `urgent` | 緊急対応が必要                       | #FF6B00 | -               |

### 自動セットアップ（推奨）

セットアップスクリプトを使用して、必要なカスタムラベルを一括作成できます。

```bash
# リポジトリルートで実行
./scripts/setup-github-labels.sh
```

**スクリプトの動作**:

- カスタムラベル（major, minor, patch, hotfix, urgent）を作成
- 既存ラベルはスキップ（エラーなし）
- GitHubデフォルトラベルはそのまま使用

### 手動セットアップ

GitHub CLI（`gh`）を使って手動で作成することもできます。

```bash
# バージョニング用ラベル
gh label create "major" --description "メジャーバージョン変更（破壊的変更）" --color "D93F0B"
gh label create "minor" --description "マイナーバージョン変更（新機能追加）" --color "FBCA04"
gh label create "patch" --description "パッチバージョン変更（バグ修正）" --color "5FBF4A"

# 緊急度ラベル
gh label create "hotfix" --description "緊急修正（本番環境の重大な不具合）" --color "E11D21"
gh label create "urgent" --description "緊急対応が必要" --color "FF6B00"
```

### ラベルの使い分け

#### Issue作成時

```bash
# 新機能開発
gh issue create --title "feat: 新機能名" --label "enhancement"

# バグ修正
gh issue create --title "fix: バグの説明" --label "bug"

# ドキュメント更新
gh issue create --title "docs: ドキュメント名" --label "documentation"

# 緊急修正
gh issue create --title "hotfix: 緊急修正内容" --label "hotfix,urgent"
```

#### バージョニングラベルの追加

リリース時に、PRやIssueに対してバージョニングラベルを追加します。

```bash
# 破壊的変更を含むPR
gh pr edit 123 --add-label "major"

# 新機能追加のPR
gh pr edit 123 --add-label "minor"

# バグ修正のPR
gh pr edit 123 --add-label "patch"
```

**バージョン方針**（`major` / `minor` / `patch` ラベル）は、手動リリース時も同じ考え方で用いることができます。自動ドラフト用 Actions を使う場合は Release Drafter が次バージョンを解釈します（[移行設計](../../../docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) 参照）。

## 2. Release Drafterの設定（参考・任意の自動化）

> **本リポジトリ（feel-flow/ai-spec-driven-development）**: `.github/workflows/` 内の Release Drafter **ワークフロー**は使わない運用とした場合、以下の「自動生成」は**オフ**です。PR のラベル付けと、`.github/release-drafter.yml` の**カテゴリ定義**は、手動要約の整理に流用できます。

Release Drafter（Actions 利用時）は、PRのラベルに基づいて自動的にリリースノートを生成します。

### 設定ファイル

`.github/release-drafter.yml` が既に設定されています。

```yaml
categories:
  - title: "🚀 Features"
    labels: ["enhancement"]
  - title: "🛠 Fixes"
    labels: ["bug", "hotfix"]
  - title: "📚 Documentation"
    labels: ["documentation"]

version-resolver:
  major:
    labels: ["major"]
  minor:
    labels: ["minor", "enhancement"]
  patch:
    labels: ["patch", "bug", "documentation", "hotfix"]
  default: patch
```

### 動作確認（Release Drafter ワークフロー利用時）

1. PRを作成し、適切なラベルを付与
2. PRをマージ
3. ワークフローが有効であれば Release Draft が更新される
4. Releasesページで確認

## 3. ワークフロースクリプトの使用

`scripts/ai-workflow.sh` を使用すると、標準的なワークフローを簡単に実行できます。

### 新機能開発の開始

```bash
./scripts/ai-workflow.sh start-feature "ユーザー認証機能" "JWT認証を実装"
```

自動的に：

1. `enhancement` ラベル付きのIssueを作成
2. `feature/#123-user-auth` ブランチを作成
3. 開発を開始できる状態に

### PR作成

```bash
./scripts/ai-workflow.sh create-pr
```

自動的に：

1. 変更をプッシュ
2. PRを作成（適切なラベル付き）
3. 組織の方針で GitHub Actions を使う場合、Release Drafter が起動する

## 4. 標準化されたラベル体系のメリット

### GitHubデフォルトを活用する理由

1. **セットアップ不要** - 新規リポジトリで即利用可能
2. **GitHub標準に準拠** - エコシステムとの互換性
3. **学習コスト削減** - 他のプロジェクトとの一貫性
4. **ツール連携** - GitHub公式ツールとの親和性

### 最小限のカスタムラベル

必要最小限のカスタムラベル（バージョニングと緊急度のみ）を追加することで：

- **シンプルさ維持** - ラベルの乱立を防ぐ
- **明確な目的** - 各ラベルの役割が明確
- **運用負荷軽減** - 管理するラベルが少ない

## 5. トラブルシューティング

### ラベルが作成できない

```bash
# GitHub CLIの認証状態を確認
gh auth status

# 再認証
gh auth login
```

### 既存ラベルとの競合

古いカスタムラベル（`feature`, `fix`, `docs`, `chore`）が存在する場合は削除して統合してください。

```bash
# 重複ラベルの削除
gh label delete "feature" --yes  # → enhancement を使用
gh label delete "fix" --yes      # → bug を使用
gh label delete "docs" --yes     # → documentation を使用
gh label delete "chore" --yes    # → 下記の指針を参照
```

#### `chore` ラベル廃止に伴う運用指針

`chore` ラベルを廃止したことで、以下のような保守タスクの扱いについて明確な指針が必要です。

**`chore` タスクの分類と推奨ラベル**:

| タスクの種類                                   | 推奨ラベル    | バージョン影響 | リリースノート掲載    | 理由                       |
| ---------------------------------------------- | ------------- | -------------- | --------------------- | -------------------------- |
| **依存関係の更新**（セキュリティ修正なし）     | ラベルなし    | patch          | 掲載しない            | ユーザーに影響なし         |
| **依存関係の更新**（セキュリティ修正あり）     | `bug`         | patch          | Fixes セクションに    | セキュリティ改善として重要 |
| **ビルドプロセス改善**                         | ラベルなし    | patch          | 掲載しない            | 内部改善のみ               |
| **リファクタリング**（機能変更なし）           | ラベルなし    | patch          | 掲載しない            | 内部品質向上               |
| **リファクタリング**（パフォーマンス改善あり） | `enhancement` | minor          | Features セクションに | ユーザーメリットあり       |
| **CI/CDパイプライン改善**                      | ラベルなし    | patch          | 掲載しない            | 開発効率化のみ             |
| **開発ツール追加**                             | ラベルなし    | patch          | 掲載しない            | 開発者向け                 |

**運用ルール**:

1. **ユーザーに影響がない保守タスク** → ラベルなしでマージ
   - 手動リリースではチーム方針に従い `patch` 相当として扱う（自動ドラフト使用時は Release Drafter の解釈に従う）
   - リリースノートには掲載されない（`default: patch`設定による）

2. **ユーザーにメリットがある保守タスク** → 適切なラベルを付与
   - セキュリティ修正 → `bug` ラベル（Fixesセクションに掲載）
   - パフォーマンス改善 → `enhancement` ラベル（Featuresセクションに掲載）

3. **バージョニングの注意点**
   - `enhancement` ラベルはマイナーバージョンアップを引き起こします
   - 依存関係更新のような定型的な保守タスクには`enhancement`を使用しないでください
   - ユーザーに明確なメリットがある場合のみ`enhancement`を使用

**例**:

```bash
# ❌ 避けるべき（マイナーバージョンアップになる）
gh pr create --title "chore: Update dependencies" --label "enhancement"

# ✅ 推奨（patchバージョンアップ、リリースノート非掲載）
gh pr create --title "chore: Update dependencies"

# ✅ 推奨（セキュリティ修正の場合）
gh pr create --title "chore: Update dependencies (security fix)" --label "bug"

# ✅ 推奨（パフォーマンス改善の場合）
gh pr create --title "perf: Optimize build process" --label "enhancement"
```

### Release Drafterが動作しない

1. 自動ドラフト用の **ワークフロー YAML** をリポジトリで使う方針か確認（本リポ主軸は [移行設計](../../../docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) の手動フロー）
2. ワークフロー利用時は GitHub Actions が有効か確認
3. PRに適切なラベルが付いているか確認

## 6. 関連ドキュメント

- [NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](../../../docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) - 本リポのローカル品質ゲート・手動リリース（Actions 非依存の場合）
- [Git Workflow](./git-workflow.md) - 開発フローの詳細
- [Automated Code Review](./automated-code-review.md) - 自動レビューの設定
- [AI Tools Integration](./ai-tools-integration.md) - AIツールの統合

## まとめ

この設定により：

- ✅ **標準化されたラベル体系** - GitHubデフォルト + 最小限のカスタム
- ✅ **バージョニングの見通し** - ラベルに基づくセマンティック方針（手動 or Release Drafter 自動）
- ✅ **リリースノート** - 自動化する場合は Release Drafter。本リポ主軸は [移行設計](../../../docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) の手動フロー
- ✅ **効率的なワークフロー** - スクリプトによる補助（`gh` 等）

AI Spec-Driven Developmentの推奨設定が完了しました。
