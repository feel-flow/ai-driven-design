# AI Tools Integration

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md)

このドキュメントでは、AI仕様駆動開発をサポートするAIツールの統合方法と選択ガイドを提供します。

## 目次

- [AIツール比較](#aiツール比較)
- [推奨構成](#推奨構成)
- [AIツール別設定概要](#aiツール別設定概要)
- [SessionStart Hook](#sessionstart-hook)
- [完全無料構成](#完全無料構成)
- [コスト比較](#コスト比較)

---

## AIツール比較

### 主要AIツールの特徴比較（5 CLI）

| 特徴                      | Claude Code                     | Codex CLI                  | GitHub Copilot               | Gemini CLI                 | Cursor                 |
| ------------------------- | ------------------------------- | -------------------------- | ---------------------------- | -------------------------- | ---------------------- |
| **Git統合度**             | ⭐⭐⭐⭐⭐                      | ⭐⭐⭐⭐                   | ⭐⭐⭐                       | ⭐⭐⭐                     | ⭐⭐⭐⭐               |
| **カスタム設定**          | CLAUDE.md, .claude/             | codex.md, AGENTS.md        | .vscode/settings.json        | settings.json              | .cursorrules           |
| **CLI非インタラクティブ** | `claude -p`                     | `codex exec`               | `copilot -p`                 | `gemini -p`                | `cursor-agent --print` |
| **安全性制御**            | `--allowed-tools`（ツール制限） | `--sandbox read-only`      | `--allow-tool`/`--deny-tool` | `--sandbox`                | N/A                    |
| **PR自動化**              | ネイティブサポート              | ネイティブサポート         | VS Code Tasks必要            | 手動スクリプト実行         | 手動スクリプト実行     |
| **ドキュメント参照**      | 自動読み込み                    | 自動読み込み               | 手動指定                     | 自動読み込み               | contextFiles設定       |
| **無料版の充実度**        | ⭐⭐⭐⭐                        | ⭐⭐⭐                     | ❌                           | ⭐⭐⭐⭐⭐                 | ⭐⭐⭐⭐               |
| **コスト**                | 無料/Pro $20                    | トークン課金               | $10/月＋従量課金             | 無料枠大                   | 無料/Pro $20           |
| **コストティア**          | Premium                         | Standard                   | Metered（従量課金）          | Free-tier                  | Flat-rate              |
| **推奨レビュー用途**      | 型設計・アーキテクチャ          | コードレビュー・テスト分析 | レビュー既定外（オプトイン） | セキュリティ・コメント分析 | コード簡素化           |

### AI消費分散（Multi-CLI Orchestration）

複数のAI CLI（レビュー既定は Claude / Codex / Gemini / Cursor の4 CLI）をオーケストレーションし、各CLIの得意分野とコスト特性を活かした包括的レビューを実現します。
詳細は [Multi-CLI Review Orchestration](./multi-cli-review-orchestration.md) を参照してください。

```
高コスト（Premium）                          低コスト（Free/Flat-rate）
  ←───────────────────────────────────────────→
  Claude        Codex          Gemini        Cursor
  型設計        コード/テスト   セキュリティ   コード
  アーキテクチャ レビュー       コメント       簡素化
```

**分散戦略の使い分け**:

- `balanced`: コストと品質のバランス（デフォルト）
- `minimize_cost`: Claude の担当観点を Cursor に振り替え（予算制約時）
- `maximize_quality`: Claude/Codexに多く割当（リリース前）

> **Note**: GitHub Copilot（Copilot CLI）は従量課金へ移行したため、レビューの既定ラインナップから除外（オプトイン）。

### AI自動化の主要機能

AIツールは以下を自動的に実行:

- PR上の最新コメントをモニタリング
- 指摘内容の意図を解析
- 修正箇所と修正方針を提案
- 可能な場合は自動修正を実施
- 修正内容をレビュワーにコメント

---

## 推奨構成

### 予算別推奨構成

- **完全無料**: Claude Code（無料版） + scripts/ai-workflow.sh + Husky
- **月$10予算**: Claude Code（無料版） + GitHub Copilot
- **月$20予算**: Claude Code Pro または Cursor Pro
- **月$30予算**: Claude Code Pro + GitHub Copilot

### 最もコスパが良い構成

**Claude Code（無料版）+ 手動スクリプト**

- 追加コスト: $0
- 機能性: ⭐⭐⭐⭐（十分実用的）

---

## AIツール別設定概要

### Claude Code

Claude Codeは標準でGitワークフローをサポートしています。

#### 基本設定

**1. プロジェクトルートにCLAUDE.md配置**

```markdown
# CLAUDE.md

## Git Workflow自動化ルール

このプロジェクトでは「AI仕様駆動Git Workflow」を採用しています。

### 必須動作

1. **コミット時**: 必ず `docs/MASTER.md` の仕様に準拠
2. **PR作成時**: 構造化されたPR本文を生成
3. **レビュー対応時**: 自動的に修正提案を行う
4. **マージ後**: 次のタスクを提案

### 参照ドキュメント

- Git Workflow詳細: docs/05-operations/DEPLOYMENT.md (セクション1)
- コーディング規約: docs/MASTER.md
- 自動化スクリプト: scripts/ai-workflow.sh
```

**2. コミットメッセージテンプレート**

```
形式: <type>: <subject>

<body>

参照:
- <file>:<line> (<reason>)

Closes #<issue>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**type**: feat, fix, docs, style, refactor, test, chore, hotfix, release

**詳細な設定方法**: [SETUP_CLAUDE_CODE.md](../../SETUP_CLAUDE_CODE.md)

---

### GitHub Copilot

GitHub Copilotは直接的なGitワークフロー自動化機能は限定的ですが、VS Code設定で補完できます。

#### 基本設定

**VS Code設定（.vscode/settings.json）**

```json
{
  "github.copilot.enable": {
    "*": true
  },
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "このプロジェクトでは「AI仕様駆動Git Workflow」を採用しています。",
      "file": "docs/MASTER.md"
    },
    {
      "text": "コミットメッセージは必ずConventional Commits形式で、ドキュメント参照を含めること。",
      "file": "docs/05-operations/DEPLOYMENT.md"
    }
  ],
  "git.inputValidation": "always",
  "git.inputValidationLength": 72,
  "git.inputValidationSubjectLength": 50
}
```

**詳細な設定方法**: [SETUP_GITHUB_COPILOT.md](../../SETUP_GITHUB_COPILOT.md)

---

### Cursor

Cursorは `.cursorrules` ファイルでプロジェクト固有のルールを設定できます。

#### 基本設定

**.cursorrulesファイル**

```
# AI仕様駆動Git Workflow

## プロジェクト概要
このプロジェクトは「AI Spec Driven Development」のドキュメント戦略テンプレートです。

## Git Workflow
- すべての作業はIssueから開始
- ブランチ名: feature/{issue-number}-{description}
- コミットメッセージ形式: <type>: <subject>
  必ずドキュメント参照を含める（例: docs/MASTER.md:29）
- PR作成時はscripts/ai-workflow.sh create-prを使用

## 必須参照ドキュメント
1. docs/MASTER.md - コーディング規約とプロジェクト識別情報
2. docs/05-operations/DEPLOYMENT.md - Git Workflowの詳細
3. docs/PATTERNS.md - 実装パターン

## 禁止事項
- マジックナンバーの使用
- any型の使用（理由なき場合）
- ドキュメント参照のないコミット
```

**詳細な設定方法**: [SETUP_CURSOR.md](../../SETUP_CURSOR.md)

---

## SessionStart Hook

### 目的

PRマージ後のブランチ切り替え忘れを防止するため、Claude Codeのセッション開始時に自動的にブランチ状態をチェックし、必要に応じて警告を表示します。

### 主な機能

1. **リモートブランチ存在チェック**: PRマージ済みの可能性を警告
2. **コミット遅延チェック**: mainブランチより大幅に遅れている場合に警告

### スクリプト配置場所

`.claude/hooks/check-branch-status.sh`

### 設定方法

**1. スクリプト作成と実行権限付与**

```bash
# スクリプトに実行権限を付与
chmod +x .claude/hooks/check-branch-status.sh
```

**2. Claude Code設定ファイルへの追加**

`.claude/settings.json` または `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/check-branch-status.sh",
        "description": "Check git branch status and warn if needed"
      }
    ]
  }
}
```

**3. 環境変数でのカスタマイズ（オプション）**

```bash
# シェル設定ファイル（~/.bashrc, ~/.zshrc など）に追加

# メインブランチ名を変更（デフォルト: develop）
export MAIN_BRANCH="main"

# 警告を出すコミット数の閾値を変更（デフォルト: 10）
export BEHIND_THRESHOLD="20"
```

### 動作例

Claude Codeセッション開始時に以下のような警告が表示されます：

```
⚠️  WARNING: 現在のブランチ 'feature/#123-add-feature' はリモートに存在しません。
   PRがマージ済みの可能性があります。
   以下のコマンドで develop ブランチに戻ることを推奨します：

   git checkout develop
   git pull origin develop
   git branch -d feature/#123-add-feature
```

### スクリプト詳細

完全なスクリプトとカスタマイズ例については、[DEPLOYMENT.md](../DEPLOYMENT.md#8-開発環境の最適化) のセクション8を参照してください。

---

## 完全無料構成

以下の構成であれば、**追加コストなし**でAI仕様駆動Git Workflowを実現できます。

### 推奨無料構成

1. **AIツール**: Claude Code（無料版）またはCursor（無料版）
2. **自動化**:
   - `scripts/ai-workflow.sh` による手動スクリプト実行
   - Git Hooks（Husky）によるローカル検証
3. **GitHub機能**:
   - Issue/PR（無料）
   - GitHub CLI（無料）
   - ブランチ保護ルール（無料）

### 無料版での制限事項と対応策

| 制限                       | 対応策                                     |
| -------------------------- | ------------------------------------------ |
| GitHub Actions実行時間制限 | ローカルスクリプト（ai-workflow.sh）を使用 |
| AI応答回数制限（無料版）   | 重要なタスクに絞って使用                   |
| 高度な自動化機能           | 手動スクリプト実行で補完                   |

### 最小構成セットアップ手順（5分）

```bash
# 1. GitHub CLIインストール（Macの場合）
brew install gh
gh auth login

# 2. 自動化スクリプトに実行権限付与
chmod +x scripts/ai-workflow.sh

# 3. Git Hooks設定（オプション、推奨）
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional
npx husky init

# 4. 動作確認
./scripts/ai-workflow.sh status
```

これだけで、AI仕様駆動Git Workflowが利用可能になります。

---

## コスト比較

### 機能別コスト

| 機能               | 無料プラン            | 有料プラン       | コストティア                         | 推奨                         |
| ------------------ | --------------------- | ---------------- | ------------------------------------ | ---------------------------- |
| **Claude Code**    | 基本機能利用可        | Pro: $20/月      | Premium（トークン課金）              | 型設計・アーキテクチャ       |
| **Codex CLI**      | —                     | トークン課金     | Standard（トークン課金）             | コードレビュー・エラー検出   |
| **GitHub Copilot** | ❌                    | $10/月＋従量課金 | Metered（premium requests 従量課金） | レビュー既定外（オプトイン） |
| **Gemini CLI**     | 大きな無料枠          | 従量課金         | Free-tier（無料枠大）                | セキュリティスキャン         |
| **Cursor**         | 基本機能利用可        | Pro: $20/月      | Flat-rate（月額固定）                | コード簡素化                 |
| **GitHub Actions** | 2,000分/月（Private） | 超過分課金       | —                                    | Huskyで代替                  |
| **GitHub CLI**     | ✅ 完全無料           | -                | —                                    | 必須                         |
| **Git Hooks**      | ✅ 完全無料           | -                | —                                    | 必須                         |

### Multi-CLI レビューのコスト最適化

| 戦略             | 月額目安 | 使用CLI                          | 適用場面             |
| ---------------- | -------- | -------------------------------- | -------------------- |
| **完全無料**     | $0       | Gemini（無料枠）                 | 個人開発・学習       |
| **固定料金のみ** | $20-$40  | Cursor + Gemini                  | 予算固定の開発       |
| **バランス**     | $30-$50  | Claude + Codex + Gemini + Cursor | 通常のチーム開発     |
| **品質最大化**   | $50+     | Claude中心 + 全CLI               | リリース前の品質保証 |

詳細: [Multi-CLI Review Orchestration](./multi-cli-review-orchestration.md)

### GitHub Actionsの利用制限

GitHub Actionsの無料枠：

- **パブリックリポジトリ**: 無制限（無料）
- **プライベートリポジトリ**:
  - Free/Pro: 2,000分/月まで無料
  - Team: 3,000分/月まで無料
  - Enterprise: 50,000分/月まで無料

無料枠を超えると課金されるため、プライベートリポジトリで使用する場合は以下の対策を推奨：

1. **必要最小限のワークフロー**のみ有効化
2. **手動トリガー**（workflow_dispatch）を活用
3. **Huskyなどローカルフック**を優先使用
4. 無料枠の範囲内で運用計画を立てる

詳細: <https://docs.github.com/ja/billing/managing-billing-for-github-actions/about-billing-for-github-actions>

### 代替案（完全無料）

- Git Hooks（Husky）のみで運用
- ローカルスクリプト（scripts/ai-workflow.sh）による手動実行
- AIツール（Claude Code等）のビルトイン機能を活用

---

## 共通設定: Git Hooks（全AIツール対応）

### Huskyのインストールとセットアップ

```bash
npm install --save-dev husky @commitlint/cli @commitlint/config-conventional

# Huskyの初期化
npx husky init
```

### コミットメッセージ検証

`.husky/commit-msg`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Conventional Commits形式チェック
npx --no-install commitlint --edit "$1"

# ドキュメント参照チェック
if ! grep -iqE "参照:" "$1"; then
  echo "エラー: コミットメッセージにドキュメント参照が含まれていません"
  echo "例: 参照: docs/MASTER.md:29"
  exit 1
fi
```

### commitlint設定

`commitlint.config.js`:

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "test",
        "chore",
        "hotfix",
        "release",
      ],
    ],
    "subject-case": [2, "never", ["upper-case"]],
    "header-max-length": [2, "always", 100],
    "body-max-line-length": [0, "always", Infinity],
  },
};
```

---

## ブランチ保護ルール

```yaml
# .github/branch-protection.yml
branches:
  main:
    required_reviews: 2
    require_codeowner_review: true
    dismiss_stale_reviews: true
    required_status_checks:
      - "test"
      - "lint"
      - "build"
    enforce_admins: true

  develop:
    required_reviews: 1
    required_status_checks:
      - "test"
      - "lint"
```

---

## 関連ドキュメント

- [DEPLOYMENT.md](../DEPLOYMENT.md) - デプロイメント戦略全体
- [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md) - Multi-CLI レビューオーケストレーション
- [REVIEW_AGENT_CREATION_GUIDE.md](../../06-reference/REVIEW_AGENT_CREATION_GUIDE.md) - 汎用レビューエージェント作成ガイド
- [SETUP_CLAUDE_CODE.md](../../SETUP_CLAUDE_CODE.md) - Claude Code詳細設定
- [SETUP_GITHUB_COPILOT.md](../../SETUP_GITHUB_COPILOT.md) - GitHub Copilot詳細設定
- [SETUP_CURSOR.md](../../SETUP_CURSOR.md) - Cursor詳細設定
- [gemini-cli-reviewer.md](./gemini-cli-reviewer.md) - Gemini CLI レビュワーセットアップ
- [cursor-cli-reviewer.md](./cursor-cli-reviewer.md) - Cursor CLI レビュワーセットアップ
- [../MASTER.md](../../MASTER.md) - プロジェクトマスター仕様
