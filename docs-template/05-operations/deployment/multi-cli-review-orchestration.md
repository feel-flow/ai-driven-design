# Multi-CLI Review Orchestration

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | [ai-tools-integration.md](./ai-tools-integration.md)

## 概要

5つのAI CLI（Claude Code、Codex、Copilot、Gemini、Cursor）をレビュワーとしてオーケストレーションし、設定駆動で統一的に管理する運用ガイドです。

**目的**: 各CLIの得意分野とコスト特性を活かし、高品質かつコスト効率の良いコードレビューを実現する

---

## 目次

- [アーキテクチャ](#アーキテクチャ)
- [前提条件](#前提条件)
- [セットアップ](#セットアップ)
- [設定カスタマイズ](#設定カスタマイズ)
- [ワークフロー統合](#ワークフロー統合)
- [運用コマンド](#運用コマンド)
- [トラブルシューティング](#トラブルシューティング)

---

## クロスモデルレビュー（推奨パターン）

Multi-CLI の全体オーケストレーションとは別に、**Claude系 + GPT系のデュアルモデルレビュー**を軽量に実行するパターンです。異なるAIモデルの観点でレビュー品質を向上させます。

### Codex CLI 3パターン

| パターン                     | 実行タイミング       | 自動/提案        | 説明                                          |
| ---------------------------- | -------------------- | ---------------- | --------------------------------------------- |
| **Cross-Model Review**       | セルフレビュー時     | 必須（順次実行） | Claude Toolkit + Codex CLI でデュアルレビュー |
| **Parallel Task Suggestion** | 独立サブタスク発見時 | ユーザーに提案   | 並列実行による効率化                          |
| **Second Opinion**           | 設計判断の分岐点     | ユーザーに提案   | アーキテクチャ決定の第二意見                  |

#### Pattern 1: Cross-Model Review（必須・順次実行）

PR Review Toolkit（Claude系）でのセルフレビュー後に続けて実行します。CLAUDE.md のワークフロー指示に基づき、AIツールが Toolkit → Codex CLI の順で実行します。

```bash
# Toolkit レビュー後に実行（codex exec ベース）
bash scripts/codex-review.sh --branch
```

レビュー結果は [PRレビュー対応ポリシー](./review-response-policy.md) に従って対応します。

#### Pattern 2: Parallel Task Suggestion（ユーザーに提案）

独立したサブタスクが複数ある場合、ユーザーに並列実行を提案します。

- 提案例：「テスト追加はCodex CLIに任せて、私はメインロジックを進めますか？」
- AIツールは提案のみ、実行はユーザー判断

#### Pattern 3: Second Opinion（ユーザーに提案）

アーキテクチャ判断や設計の分岐点で、Codex CLIの意見を参考にすることを提案します。

- 提案例：「この設計判断、Codex CLIでもセカンドオピニオン取ってみますか？」
- AIツールは提案のみ、実行はユーザー判断

---

## アーキテクチャ

### 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                   Entry Points                           │
│  Terminal │ Claude Code │ Copilot │ CI/CD │ Husky Hook  │
└─────┬───────────┬──────────┬────────┬────────┬──────────┘
      │           │          │        │        │
      └───────────┴──────────┴────┬───┴────────┘
                                  │
                    ┌─────────────▼──────────────┐
                    │   multi-review.sh           │
                    │   (Orchestrator)            │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │  review-config.yaml   │  │
                    │  │  (設定)               │  │
                    │  └───────────────────────┘  │
                    └──────────┬──────────────────┘
                               │
              ┌────────┬───────┼───────┬────────┐
              │        │       │       │        │
        ┌─────▼──┐ ┌──▼───┐ ┌▼────┐ ┌▼─────┐ ┌▼──────┐
        │Claude  │ │Codex │ │Copi-│ │Gemini│ │Cursor │
        │Adapter │ │Adapt.│ │lot  │ │Adapt.│ │Adapt. │
        └───┬────┘ └──┬───┘ │Adapt│ └──┬───┘ └──┬────┘
            │         │     └─┬───┘    │        │
            ▼         ▼       ▼        ▼        ▼
        ┌────────────────────────────────────────────┐
        │          perspectives/*.md                  │
        │  (ツール非依存プロンプト)                     │
        └────────────────────────────────────────────┘
                               │
                    ┌──────────▼──────────────┐
                    │  .review-results/       │
                    │  ├── claude-code/       │
                    │  ├── codex-cli/         │
                    │  ├── copilot-cli/       │
                    │  ├── gemini-cli/        │
                    │  ├── cursor-cli/        │
                    │  └── integrated-report.md│
                    └─────────────────────────┘
```

### データフロー

1. **エントリーポイント** → `multi-review.sh` を呼び出し
2. **設定読み込み** → `review-config.yaml` からCLI設定・戦略を取得
3. **CLI検出** → `command -v` で利用可能なCLIを検出
4. **フォールバック** → 未インストールCLIのパースペクティブを再分配
5. **並列実行** → 各CLIアダプターを並列で実行
6. **結果収集** → `.review-results/{cli-name}/{perspective}.md` に出力
7. **統合レポート** → 重複除去・統合してレポート生成

---

## 前提条件

### 必須

- Bash 4.0以上
- Git（diffの取得に使用）
- 1つ以上のAI CLI

### 推奨

- `yq`（YAMLパーサー、設定ファイル読み込みに使用）
- 3つ以上のAI CLIインストール（分散レビューの効果を最大化）

### CLI別インストール状態の確認

```bash
# インストール確認コマンド
command -v claude  && echo "✅ Claude Code" || echo "❌ Claude Code"
command -v codex   && echo "✅ Codex CLI"   || echo "❌ Codex CLI"
command -v copilot && echo "✅ Copilot CLI"  || echo "❌ Copilot CLI"
command -v gemini  && echo "✅ Gemini CLI"   || echo "❌ Gemini CLI"
command -v cursor-agent && echo "✅ Cursor CLI" || echo "❌ Cursor CLI"
```

---

## セットアップ

### Step 1: スクリプト配置

```bash
# リポジトリルートから
chmod +x scripts/multi-review.sh
chmod +x scripts/adapters/*.sh
```

### Step 2: 設定ファイルのカスタマイズ

`scripts/review-config.yaml` を環境に合わせて編集します。

```yaml
version: "1.0"
mode: distributed
parallel: true
cost_strategy: balanced

agents:
  claude-code:
    command: claude
    cost_tier: premium
    default_perspectives: [type-design-analysis]

  codex-cli:
    command: codex
    cost_tier: standard
    default_perspectives: [code-review, error-handler-hunt]

  copilot-cli:
    command: copilot
    cost_tier: flat-rate
    default_perspectives: [test-analysis, comment-analysis]

  gemini-cli:
    command: gemini
    cost_tier: free-tier
    default_perspectives: [security-analysis]

  cursor-cli:
    command: cursor-agent
    cost_tier: flat-rate
    default_perspectives: [code-simplification]

fallback:
  claude-code: codex-cli
  codex-cli: copilot-cli
  copilot-cli: codex-cli
  gemini-cli: copilot-cli
  cursor-cli: copilot-cli

toolkit_delegation:
  code-reviewer: codex-cli
  silent-failure-hunter: codex-cli
  type-design-analyzer: claude-code
  pr-test-analyzer: copilot-cli
  comment-analyzer: copilot-cli
  code-simplifier: cursor-cli
```

### Step 3: 動作確認

```bash
# 利用可能なCLIと設定を表示
bash scripts/multi-review.sh --dry-run

# 特定のCLIだけでテスト
bash scripts/multi-review.sh --cli copilot-cli --perspective test-analysis
```

---

## 設定カスタマイズ

### コスト戦略

| 戦略               | 説明                       | 推奨場面                 |
| ------------------ | -------------------------- | ------------------------ |
| `balanced`         | コストと品質のバランス     | 通常の開発（デフォルト） |
| `minimize_cost`    | 固定料金/無料CLIを優先使用 | 予算制約がある場合       |
| `maximize_quality` | 高品質CLIに多く割当        | リリース前の最終レビュー |

### モード

| モード        | 説明                                              |
| ------------- | ------------------------------------------------- |
| `distributed` | 各CLIが異なるパースペクティブを担当（デフォルト） |
| `cross-model` | 全CLIで同じパースペクティブを実行して比較         |

### よくあるカスタマイズ例

#### 例1: Copilot + Gemini のみで運用（完全無料/固定料金）

```yaml
cost_strategy: minimize_cost
agents:
  copilot-cli:
    command: copilot
    cost_tier: flat-rate
    default_perspectives:
      [code-review, test-analysis, comment-analysis, error-handler-hunt]
  gemini-cli:
    command: gemini
    cost_tier: free-tier
    default_perspectives:
      [security-analysis, code-simplification, type-design-analysis]
```

#### 例2: Claude + Codex のクロスモデル比較

```yaml
mode: cross-model
agents:
  claude-code:
    command: claude
    cost_tier: premium
    default_perspectives: [code-review]
  codex-cli:
    command: codex
    cost_tier: standard
    default_perspectives: [code-review]
```

---

## ワークフロー統合

### Git Workflow への組み込み

[AI駆動Git Workflow](./git-workflow.md) のステップ5（セルフレビュー）に統合します：

```
ステップ3: 実装 & コミット（Implement）
    ↓
ステップ4: テスト・検証（Test）
    ↓
ステップ5: セルフレビュー（Self-Review）
    ├── multi-review.sh（Multi-CLI分散レビュー）
    ├── pr-review-toolkit（Claude Code サブエージェント）
    └── codex review --base develop（Codex クロスモデルレビュー）
    ↓
ステップ6: PR作成
```

### Husky pre-push フックとの統合

> **Note**: 以下は設定例です。`.husky/pre-push` ファイルを手動で作成してください。`scripts/multi-review.sh` の実装後に利用可能です。

```bash
# .husky/pre-push（手動作成が必要）
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Multi-CLI レビュー（固定料金CLIのみ、高速）
bash scripts/multi-review.sh \
  --strategy minimize_cost \
  --cli copilot-cli \
  --cli gemini-cli \
  --sequential

# Critical があればプッシュをブロック
if grep -q "CRITICAL_BLOCK" .review-results/integrated-report.md 2>/dev/null; then
  echo "❌ Critical issues found. Fix before pushing."
  exit 1
fi
```

### CI/CD（GitHub Actions）での実行

```yaml
# .github/workflows/multi-cli-review.yml
name: Multi-CLI Review
on:
  pull_request:
    branches: [develop, main]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install CLI tools
        run: |
          # 必要なCLIをインストール（各CLI公式ドキュメントで最新手順を確認）
          # Claude Code: https://docs.anthropic.com/en/docs/claude-code
          npm install -g @anthropic-ai/claude-code
          # Codex CLI: https://github.com/openai/codex
          npm install -g @openai/codex
          # Gemini CLI: https://github.com/google-gemini/gemini-cli
          npm install -g @google/gemini-cli
      - name: Run Multi-CLI Review
        run: bash scripts/multi-review.sh --strategy minimize_cost
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: review-results
          path: .review-results/
```

---

## 運用コマンド

### 基本操作

```bash
# デフォルト実行（全CLI、分散モード）
bash scripts/multi-review.sh

# コスト最小化
bash scripts/multi-review.sh --strategy minimize_cost

# 品質最大化（リリース前）
bash scripts/multi-review.sh --strategy maximize_quality

# クロスモデル比較
bash scripts/multi-review.sh --mode cross-model --perspective code-review
```

### 特定CLI/パースペクティブのみ

```bash
# Codex + Copilot だけ
bash scripts/multi-review.sh --cli codex-cli --cli copilot-cli

# セキュリティ分析だけ
bash scripts/multi-review.sh --perspective security-analysis

# pr-review-toolkit 移譲モード
bash scripts/multi-review.sh --delegate-toolkit
```

### 結果の確認

```bash
# 統合レポートを表示
cat .review-results/integrated-report.md

# 特定CLIの結果を表示
cat .review-results/codex-cli/code-review.md

# Criticalのみフィルタ
grep -A 5 "Critical" .review-results/integrated-report.md
```

---

## トラブルシューティング

### CLIが見つからない

```
ERROR: codex is not installed
```

**対応**: フォールバック設定に従い、自動的に別のCLIに再分配されます。手動で特定CLIをスキップするには：

```bash
bash scripts/multi-review.sh --cli copilot-cli --cli gemini-cli
```

### タイムアウト

特定のCLIが長時間応答しない場合：

```bash
# タイムアウトを設定（デフォルト: 300秒）
export REVIEW_TIMEOUT=120
bash scripts/multi-review.sh
```

### Cursor CLI のハング問題

Cursor CLI (`cursor-agent -p`) は非インタラクティブモードでハングする既知の問題があります。

**回避策**:

- `timeout` コマンドでラップ: `timeout 120 cursor-agent -p "..."`
- Cursor CLIをスキップ: `--cli copilot-cli` で代替

### 結果の不整合

Cross-Modelモードで異なるCLIが矛盾する結果を返した場合：

- 信頼度スコアが高い方を優先
- Critical/Warning は両方報告（安全側に倒す）
- Suggestion/Info は重複除去

---

## 関連ドキュメント

- [REVIEW_AGENT_CREATION_GUIDE.md](../../06-reference/REVIEW_AGENT_CREATION_GUIDE.md) — 汎用レビューエージェント作成ガイド
- [ai-tools-integration.md](./ai-tools-integration.md) — AIツール統合・コスト比較
- [git-workflow.md](./git-workflow.md) — AI駆動Git Workflow
- [gemini-cli-reviewer.md](./gemini-cli-reviewer.md) — Gemini CLI セットアップ
- [cursor-cli-reviewer.md](./cursor-cli-reviewer.md) — Cursor CLI セットアップ
- [COPILOT_AGENTS.md](../../06-reference/COPILOT_AGENTS.md) — Copilot エージェント定義
