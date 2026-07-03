# Review Agent Creation Guide

> **Parent**: [COPILOT_AGENTS.md](./COPILOT_AGENTS.md) | [ai-tools-integration.md](../05-operations/deployment/ai-tools-integration.md)

## 概要

任意のAI CLIツールをレビューエージェントにラップするための汎用ガイドです。特定のCLIに依存しない「レビューエージェントの構成要素」を定義し、複数のAI CLI（Claude Code、Codex、Gemini、Cursor など）を統一的にオーケストレーションするための設計パターンを提供します。

> **Note**: GitHub Copilot CLI は従量課金へ移行したため、レビューの既定ラインナップから除外しています（アダプタは残置、オプトイン利用可）。

**対象読者**: AI CLIツールを活用してコードレビューを自動化・効率化したい開発者

---

## 目次

- [1. Review Agent Anatomy](#1-review-agent-anatomy)
- [2. Perspective Catalog](#2-perspective-catalog)
- [3. Adapter Pattern](#3-adapter-pattern)
- [4. Severity Classification Standard](#4-severity-classification-standard)
- [5. Output Format Standard](#5-output-format-standard)
- [6. Cross-Model Review Pattern](#6-cross-model-review-pattern)
- [7. AI消費分散戦略](#7-ai消費分散戦略)
- [8. Multi-Entry Point](#8-multi-entry-point)
- [9. Integration Checklist](#9-integration-checklist)

---

## 1. Review Agent Anatomy

レビューエージェントは以下の4要素で構成されます：

```
┌─────────────────────────────────────────┐
│           Review Agent                   │
├─────────────────────────────────────────┤
│  1. Perspective（観点）                   │
│     - 何を分析するか                      │
│     - 分析の深度とスコープ                 │
├─────────────────────────────────────────┤
│  2. Severity Model（重大度モデル）         │
│     - Critical / Warning / Suggestion    │
│     - PR Review Response Policy連携      │
├─────────────────────────────────────────┤
│  3. Output Format（出力形式）             │
│     - 統一Markdownテンプレート            │
│     - 機械可読セクション                   │
├─────────────────────────────────────────┤
│  4. CLI Adapter（CLIアダプター）          │
│     - CLI固有のフラグ・実行方法            │
│     - プロンプト注入・結果パース            │
└─────────────────────────────────────────┘
```

### 要素間の関係

1. **Perspective** がエージェントの「何を見るか」を定義
2. **Severity Model** が発見した問題の「重要度」を統一基準で分類
3. **Output Format** が結果の「どう報告するか」を標準化
4. **CLI Adapter** が「どのツールで実行するか」を抽象化

この分離により、同じPerspectiveを異なるCLIで実行でき、結果を統一的に比較・集約できます。

---

## 2. Perspective Catalog

7つの標準パースペクティブを定義します。各パースペクティブはツール非依存のプロンプトとして `scripts/perspectives/` に配置します。

### 一覧

| #   | Perspective              | 分析対象                               | 推奨CLI     | 理由                             |
| --- | ------------------------ | -------------------------------------- | ----------- | -------------------------------- |
| 1   | **Code Review**          | コード品質、ガイドライン準拠、バグ検出 | Codex       | 汎用レビューはGPT系で別視点      |
| 2   | **Error Handler Hunt**   | サイレント失敗、不適切なcatch          | Codex       | エラーパターン検出に強い         |
| 3   | **Security Analysis**    | 脆弱性、インジェクション、認証問題     | Gemini      | 無料枠＋長コンテキスト活用       |
| 4   | **Test Analysis**        | テストカバレッジ、エッジケース不足     | Codex       | クロスモデルでテスト網羅性を検証 |
| 5   | **Type Design Analysis** | 型設計、カプセル化、不変性             | Claude Code | 最も高度な判断力が必要           |
| 6   | **Comment Analysis**     | コメント正確性、ドキュメント品質       | Gemini      | 無料枠で繰り返し実行             |
| 7   | **Code Simplification**  | 複雑性削減、リファクタリング提案       | Cursor      | エディタ連携が強い               |

### パースペクティブファイル形式

各ファイルは以下の構造に従います（`scripts/perspectives/{name}.md`）：

```markdown
# Perspective: {Name}

## Role

[エージェントの役割と責任]

## Analysis Focus

[何を分析するか、具体的なチェック項目]

## Severity Classification

[このパースペクティブ固有の重大度基準]

## Output Template

[結果の出力テンプレート]
```

### Claude Code pr-review-toolkit との対応

| Perspective          | pr-review-toolkit サブエージェント | 担当CLI             |
| -------------------- | ---------------------------------- | ------------------- |
| Code Review          | code-reviewer                      | Codex CLI           |
| Error Handler Hunt   | silent-failure-hunter              | Codex CLI           |
| Security Analysis    | _(新規)_                           | Gemini CLI          |
| Test Analysis        | pr-test-analyzer                   | Codex CLI           |
| Type Design Analysis | type-design-analyzer               | Claude Code（据置） |
| Comment Analysis     | comment-analyzer                   | Gemini CLI          |
| Code Simplification  | code-simplifier                    | Cursor CLI          |

---

## 3. Adapter Pattern

任意のCLIをレビューエージェントにラップするアダプターパターンです。

### 共通インターフェース

```bash
# すべてのアダプターは同じインターフェースを持つ
adapter-{cli}.sh <perspective-file> <output-file> [--changed-files <file-list>]
```

### アダプターの責務

```
┌────────────────────────────────────────────────┐
│              Adapter Layer                      │
├────────────────────────────────────────────────┤
│  1. CLI存在確認    command -v {cli}             │
│  2. プロンプト構築  perspective + diff + context │
│  3. CLI実行        cli -p "..." [flags]         │
│  4. 出力パース     CLI固有の出力 → 統一形式      │
│  5. エラーハンドリング  タイムアウト、失敗時処理  │
└────────────────────────────────────────────────┘
```

### CLI別実行コマンド

| CLI         | コマンド       | 主要フラグ                                                  | 備考                                           |
| ----------- | -------------- | ----------------------------------------------------------- | ---------------------------------------------- |
| Claude Code | `claude`       | `-p "..." --allowed-tools "Read,Grep,Glob,Bash(git diff*)"` | ツール制限で安全性確保                         |
| Codex CLI   | `codex`        | `exec "..." --sandbox read-only`                            | 読み取り専用サンドボックス                     |
| Copilot CLI | `copilot`      | `-p "..." --silent --allow-all-tools`                       | `--silent`でstats出力抑制                      |
| Gemini CLI  | `gemini`       | `-p "..." --sandbox --output-format json`                   | サンドボックス＋JSON出力                       |
| Cursor CLI  | `cursor-agent` | `--print --model auto "prompt"`                             | ヘッドレスモード（プロンプトはpositional引数） |

### アダプター実装の骨格

```bash
#!/usr/bin/env bash
# adapter-{cli}.sh — {CLI Name} Review Adapter

set -euo pipefail

PERSPECTIVE_FILE="$1"
OUTPUT_FILE="$2"
CHANGED_FILES="${3:-}"

# 1. CLI存在確認
if ! command -v {cli} &>/dev/null; then
  echo "ERROR: {cli} is not installed" >&2
  exit 1
fi

# 2. プロンプト構築
PERSPECTIVE_CONTENT=$(cat "$PERSPECTIVE_FILE")
DIFF_CONTENT=$(git diff --cached --diff-filter=ACMR)
PROMPT="$PERSPECTIVE_CONTENT

## Changed Files
$DIFF_CONTENT

## Instructions
Analyze the above changes according to the perspective.
Output in the standard review format."

# 3. CLI実行（CLI別に分岐が必要）
# 多くのCLIは -p でプロンプトを渡すが、Cursor CLIは --print + positional引数
# 例: claude -p "$PROMPT" / codex -p "$PROMPT" / gemini -p "$PROMPT"
# 例: cursor-agent --print --model auto "$PROMPT"
{cli} -p "$PROMPT" {flags} > "$OUTPUT_FILE" 2>&1

# 4. 出力パース（CLI固有の後処理）
# ...
```

---

## 4. Severity Classification Standard

全アダプター共通の重大度分類です。プロジェクトルートの `CLAUDE.md` に定義された PR Review Response Policy と連携します。

### 重大度レベル

| レベル         | 説明                                                     | 対応ポリシー                       |
| -------------- | -------------------------------------------------------- | ---------------------------------- |
| **Critical**   | セキュリティ脆弱性、データ損失、本番障害の可能性         | 必ず修正（確認不要で即対応）       |
| **Warning**    | バグの可能性、パフォーマンス問題、ベストプラクティス違反 | 必ず修正（確認不要で即対応）       |
| **Suggestion** | コード品質改善、リファクタリング提案                     | 実装が妥当なものは対応（確認不要） |
| **Info**       | 良いプラクティスの確認、参考情報                         | 確認のみ（対応不要）               |

### 信頼度スコア

各問題には信頼度スコア（0-100）を付与：

| スコア範囲 | 意味         | 報告                 |
| ---------- | ------------ | -------------------- |
| 80-100     | 高確度の問題 | 報告する             |
| 50-79      | 中程度の確度 | Suggestion以下で報告 |
| 0-49       | 低確度       | 報告しない           |

---

## 5. Output Format Standard

全アダプターが準拠するMarkdownテンプレートです。

### 統一出力テンプレート

```markdown
## {Perspective Name} Review Results

**Reviewer**: {CLI Name} ({Model Name})
**Date**: {ISO 8601}
**Scope**: {analyzed file count} files

---

### Critical Issues

- [{file}:{line}] {description}
  - **Severity**: Critical
  - **Confidence**: {score}/100
  - **Reason**: {why this is a problem}
  - **Fix**: {recommended fix}

### Warnings

- [{file}:{line}] {description}
  - **Severity**: Warning
  - **Confidence**: {score}/100
  - **Reason**: {reason}
  - **Fix**: {fix}

### Suggestions

- [{file}:{line}] {description}
  - **Severity**: Suggestion
  - **Confidence**: {score}/100
  - **Reason**: {reason}
  - **Fix**: {fix}

### Info / Good Practices

- [{file}:{line}] {description}

---

### Summary

| Severity   | Count   |
| ---------- | ------- |
| Critical   | {n}     |
| Warning    | {n}     |
| Suggestion | {n}     |
| Info       | {n}     |
| **Total**  | **{n}** |

### Verdict

{PASS | NEEDS_WORK | CRITICAL_BLOCK}
```

### 統合レポート

オーケストレーターは各CLIの結果を統合し、以下の形式で出力します：

```markdown
# Multi-CLI Review Report

**Date**: {date}
**Mode**: {distributed | cross-model}
**Strategy**: {balanced | minimize_cost | maximize_quality}

## Reviewers

| CLI   | Perspective   | Verdict   | Issues  |
| ----- | ------------- | --------- | ------- |
| {cli} | {perspective} | {verdict} | {count} |

## Consolidated Issues (Deduplicated)

### Critical ({total})

...

### Warnings ({total})

...

## Final Verdict

{PASS | NEEDS_WORK | CRITICAL_BLOCK}
```

---

## 6. Cross-Model Review Pattern

複数のAIモデルで相互補完するパターンです。

### パターン1: Distributed Review（分散レビュー）

各CLIが異なるパースペクティブを担当し、結果を統合します。

```
┌──────────┐  type-design   ┌──────────────────────┐
│ Claude   │◄──────────────►│ 型設計分析            │
└──────────┘                └──────────────────────┘
┌──────────┐  code-review   ┌──────────────────────┐
│ Codex    │◄──────────────►│ コードレビュー＋テスト │
└──────────┘  +test         └──────────────────────┘
┌──────────┐  security      ┌──────────────────────┐
│ Gemini   │◄──────────────►│ セキュリティ＋コメント │
└──────────┘  +comment      └──────────────────────┘
┌──────────┐  simplify      ┌──────────────────────┐
│ Cursor   │◄──────────────►│ コード簡素化          │
└──────────┘                └──────────────────────┘
```

**利点**: 各CLIの得意分野を活かし、コストを最適化
**欠点**: 特定の観点が1つのモデルに依存

### パターン2: Cross-Model Review（クロスモデルレビュー）

全CLIで同じパースペクティブを実行し、結果を比較します。

```
                    code-review
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Claude   │  │ Codex    │  │ Gemini   │
│ 結果A    │  │ 結果B    │  │ 結果C    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     └──────┬──────┴──────┬──────┘
            │   比較・統合   │
            └──────────────┘
```

**利点**: モデル間の盲点を相互補完、高い網羅性
**欠点**: コストが高い（全CLIでトークン消費）

### 推奨使い方

| 場面             | 推奨パターン                  |
| ---------------- | ----------------------------- |
| 通常の開発       | Distributed（コスト効率優先） |
| 重要なリリース前 | Cross-Model（品質優先）       |
| 新しいCLI導入時  | Cross-Modelで精度検証         |

---

## 7. AI消費分散戦略

### コストティア別の最適配置

```
┌─────────────────────────────────────────────────────────┐
│              AI Provider Cost/Rate Tiers                 │
├───────────┬──────────┬───────────┬───────────────────────┤
│ Tier      │ Provider │ Cost Model│ 適切な用途            │
├───────────┼──────────┼───────────┼───────────────────────┤
│ Premium   │ Claude   │ トークン課金│ 高度な分析（型設計、 │
│           │          │ (高価)     │ アーキテクチャ判断）  │
├───────────┼──────────┼───────────┼───────────────────────┤
│ Standard  │ Codex    │ トークン課金│ コードレビュー、      │
│           │          │ (中程度)   │ エラーハンドリング    │
├───────────┼──────────┼───────────┼───────────────────────┤
│ Metered   │ Copilot  │ 従量課金   │ レビュー既定外        │
│           │          │(premium req)│（オプトインのみ）    │
├───────────┼──────────┼───────────┼───────────────────────┤
│ Free-tier │ Gemini   │ 無料枠大   │ セキュリティスキャン、│
│           │          │            │ ドキュメント分析      │
├───────────┼──────────┼───────────┼───────────────────────┤
│ Flat-rate │ Cursor   │ 月額固定   │ コード簡素化、        │
│           │          │ ($20/月)   │ リファクタリング提案  │
└───────────┴──────────┴───────────┴───────────────────────┘
```

### 分散戦略

| 戦略                 | 説明                                 | 適用場面                 |
| -------------------- | ------------------------------------ | ------------------------ |
| **balanced**         | コストと品質のバランス（デフォルト） | 通常の開発               |
| **minimize_cost**    | 固定料金/無料CLIを優先               | 予算制約がある場合       |
| **maximize_quality** | 最も高品質なCLIに多く割当            | リリース前の最終レビュー |

### Graceful Degradation（フォールバック）

CLIが未インストールの場合、パースペクティブを他のCLIに再分配します：

```yaml
fallback:
  claude-code: codex-cli # Claude不可 → Codexへ
  codex-cli: claude-code # Codex不可 → Claudeへ（クロスモデル維持）
  copilot-cli: codex-cli # Copilot不可 → Codexへ
  gemini-cli: codex-cli # Gemini不可 → Codexへ
  cursor-cli: codex-cli # Cursor不可 → Codexへ
```

**フォールバック優先順位の設計思想**:

- 標準の2本柱（Claude / Codex）は相互にフォールバックし、クロスモデル性を維持する
- その他のCLIが不可 → Codex に集約（従量課金の Copilot へはフォールバックしない）

---

## 8. Multi-Entry Point

オーケストレーターはスタンドアロンbashスクリプトとして実装し、どこからでも呼び出せる設計です。

### エントリーポイント一覧

| 呼び出し元      | 方法             | 例                                                             |
| --------------- | ---------------- | -------------------------------------------------------------- |
| **ターミナル**  | 直接実行         | `bash scripts/multi-review.sh`                                 |
| **Claude Code** | Bash tool / hook | `bash scripts/multi-review.sh`                                 |
| **Copilot CLI** | プロンプト経由   | `copilot -p "bash scripts/multi-review.sh を実行して"`         |
| **CI/CD**       | GitHub Actions   | `- run: bash scripts/multi-review.sh --strategy minimize_cost` |
| **Husky**       | pre-push hook    | `.husky/pre-push` から呼び出し                                 |

### CLI インターフェース

```bash
bash scripts/multi-review.sh [options]
  --config <path>         設定ファイル（デフォルト: scripts/review-config.yaml）
  --mode <distributed|cross-model>
  --strategy <balanced|minimize_cost|maximize_quality>
  --cli <name>            特定CLIのみ実行（複数指定可）
  --perspective <name>    特定パースペクティブのみ
  --parallel              並列実行（デフォルト）
  --sequential            順次実行
  --output-dir <dir>      出力先（デフォルト: .review-results/）
```

### 使用例

```bash
# デフォルト（全CLI、分散モード、balanced戦略）
bash scripts/multi-review.sh

# コスト最小化モード
bash scripts/multi-review.sh --strategy minimize_cost

# 特定CLIのみ（標準の2本柱）
bash scripts/multi-review.sh --cli claude-code --cli codex-cli

# クロスモデル比較
bash scripts/multi-review.sh --mode cross-model --perspective code-review
```

---

## 9. Integration Checklist

新しいAI CLIをレビューエージェントとして追加する手順です。

### Step 1: CLI調査

- [ ] CLIの非インタラクティブ実行フラグを確認（`-p` / `--prompt` 等）
- [ ] サンドボックス/読み取り専用モードの有無を確認
- [ ] 出力形式の制御方法を確認（`--output-format` 等）
- [ ] ツール承認の自動化方法を確認（`--yolo` / `--approval-policy` 等）
- [ ] 既知の制限・バグを確認

### Step 2: アダプター作成

- [ ] `scripts/adapters/adapter-{cli}.sh` を作成
- [ ] 共通インターフェース（`<perspective-file> <output-file> [--changed-files]`）に準拠
- [ ] CLI存在確認（`command -v`）を実装
- [ ] プロンプト構築ロジックを実装
- [ ] 出力パースを実装（CLI固有 → 統一形式）
- [ ] タイムアウト処理を実装

### Step 3: 設定追加

- [ ] `scripts/review-config.yaml` に新CLIエントリを追加
- [ ] `cost_tier` を設定
- [ ] `default_perspectives` を設定
- [ ] `fallback` マッピングを更新

### Step 4: ドキュメント更新

- [ ] `ai-tools-integration.md` の比較テーブルに追加
- [ ] CLI固有のセットアップガイドを作成（`{cli}-reviewer.md`）
- [ ] `COPILOT_AGENTS.md` の対応表を更新（該当する場合）

### Step 5: テスト

- [ ] 単体テスト: アダプターが正しく動作するか
- [ ] 統合テスト: オーケストレーターから呼び出せるか
- [ ] フォールバックテスト: CLI未インストール時に再分配されるか

---

## 関連ドキュメント

- [COPILOT_AGENTS.md](./COPILOT_AGENTS.md) — GitHub Copilot エージェント定義
- [ai-tools-integration.md](../05-operations/deployment/ai-tools-integration.md) — AIツール統合ガイド
- [multi-cli-review-orchestration.md](../05-operations/deployment/multi-cli-review-orchestration.md) — オーケストレーション運用ガイド
- [gemini-cli-reviewer.md](../05-operations/deployment/gemini-cli-reviewer.md) — Gemini CLI セットアップ
- [cursor-cli-reviewer.md](../05-operations/deployment/cursor-cli-reviewer.md) — Cursor CLI セットアップ
- [git-workflow.md](../05-operations/deployment/git-workflow.md) — AI駆動Git Workflow
