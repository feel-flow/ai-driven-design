# Multi-CLI Agent Orchestration

## 概要

5つのAI CLI（Claude Code / Codex / Copilot / Gemini / Cursor）を統一オーケストレーターで並列実行し、**Review（レビュー）** / **Explore（探索）** / **Implement（実装）** の3タスクタイプを実行する仕組み。

> **Note**: GitHub Copilot CLI は従量課金へ移行したため、**Review タスクの既定ラインナップから除外**しています（`--cli copilot-cli` でオプトイン）。Explore / Implement では引き続き既定で使用します。

## アーキテクチャ

```
multi-agent.sh --task review|explore|implement [options]
  ↓
  adapter-common.sh (タスクタイプ対応の prompt 構築)
  ↓
  各 CLI adapter (タスクタイプ対応の sandbox/permissions)
  ↓
  perspectives/{task}/*.md (タスク別プロンプトテンプレート)
```

### コンポーネント

| コンポーネント      | 説明                                                 |
| ------------------- | ---------------------------------------------------- |
| `multi-agent.sh`    | 統一オーケストレーター                               |
| `multi-review.sh`   | 後方互換ラッパー（→ multi-agent.sh --task review）   |
| `adapter-common.sh` | 共通ユーティリティ（prompt構築、出力、タイムアウト） |
| `*-adapter.sh`      | CLI固有の薄いラッパー（5つ）                         |
| `perspectives/`     | タスクタイプ別プロンプトテンプレート                 |
| `agent-config.yaml` | 設定ファイル（v2.0）                                 |

## タスクタイプ

### Review（レビュー）

コード変更を分析し、問題を検出する read-only タスク。

| Perspective          | デフォルトCLI | 内容                   |
| -------------------- | ------------- | ---------------------- |
| type-design-analysis | claude-code   | 型設計分析             |
| code-review          | codex-cli     | コードレビュー         |
| error-handler-hunt   | codex-cli     | エラーハンドリング検出 |
| test-analysis        | codex-cli     | テスト分析             |
| comment-analysis     | gemini-cli    | コメント分析           |
| security-analysis    | gemini-cli    | セキュリティ分析       |
| code-simplification  | cursor-cli    | コード簡素化           |

### Explore（探索）

コードベースを分析し、構造やパターンを可視化する read-only タスク。

| Perspective           | デフォルトCLI | 内容                   |
| --------------------- | ------------- | ---------------------- |
| architecture-analysis | claude-code   | アーキテクチャ構造分析 |
| dependency-mapping    | codex-cli     | 依存関係マッピング     |
| api-surface-analysis  | copilot-cli   | API サーフェス分析     |
| tech-debt-assessment  | gemini-cli    | 技術的負債評価         |
| pattern-discovery     | cursor-cli    | パターン検出           |

### Implement（実装）

コード生成・変更をステージングディレクトリに出力するタスク。

| Perspective            | デフォルトCLI | 内容             |
| ---------------------- | ------------- | ---------------- |
| feature-implementation | claude-code   | コア実装         |
| refactoring            | codex-cli     | リファクタリング |
| test-writing           | copilot-cli   | テスト生成       |
| documentation          | gemini-cli    | ドキュメント生成 |
| migration              | cursor-cli    | マイグレーション |

## 使い方

### CLI から

```bash
# Review
bash scripts/multi-agent.sh --task review --dry-run
bash scripts/multi-agent.sh --task review

# Explore
bash scripts/multi-agent.sh --task explore --description "認証フローの調査" --dry-run
bash scripts/multi-agent.sh --task explore --description "認証フローの調査"

# Implement
bash scripts/multi-agent.sh --task implement --description "バリデーション追加" --dry-run
bash scripts/multi-agent.sh --task implement --description "バリデーション追加"

# 後方互換
bash scripts/multi-review.sh --dry-run
```

### Claude Code スラッシュコマンド

```
/multi-review
/multi-explore 認証フローの調査
/multi-implement バリデーション関数の追加
```

### オプション

| オプション                | 説明                                    | デフォルト                |
| ------------------------- | --------------------------------------- | ------------------------- |
| `--task`                  | タスクタイプ                            | review                    |
| `--description`           | タスク説明                              | (explore/implementで必須) |
| `--cli <name>`            | 特定CLIのみ実行                         | 全CLI                     |
| `--perspective <name>`    | 特定perspectiveのみ                     | 全perspective             |
| `--strategy`              | balanced/minimize_cost/maximize_quality | タスク別                  |
| `--mode`                  | distributed/cross-model                 | distributed               |
| `--parallel/--sequential` | 実行方式                                | parallel                  |
| `--include-diff`          | implementにdiffを含める                 | false                     |
| `--dry-run`               | プラン確認のみ                          | false                     |
| `--timeout`               | タイムアウト(秒)                        | タスク別                  |

## タスク別デフォルト設定

| 項目       | Review           | Explore           | Implement           |
| ---------- | ---------------- | ----------------- | ------------------- |
| Strategy   | balanced         | minimize_cost     | maximize_quality    |
| Output Dir | .review-results/ | .explore-results/ | .implement-results/ |
| Timeout    | 300s             | 600s              | 900s                |
| Diff 含む  | Yes              | No                | Optional            |

## 設定 (agent-config.yaml)

v2.0 形式で、タスクタイプ別・エージェント別に設定可能。
v1.0 (review-config.yaml) との後方互換あり。

## 安全策

- **Review/Explore**: read-only（コード変更なし）
- **Implement**: ステージングディレクトリ出力（ワーキングツリー直接書き込み禁止）
- **Fallback**: CLI未インストール時は自動的に代替CLIへ再分配
- **Cost Strategy**: minimize_cost で premium CLI を flat-rate CLI に自動振り替え

## Perspective 作成ガイド

### 新しい Perspective を追加するには

1. `scripts/perspectives/{task_type}/` に `.md` ファイルを作成
2. 以下のセクション構造に従う:
   - `# Perspective: [名前]`
   - `## Role` — エージェントの役割定義
   - `## Analysis Focus` / `## Implementation Focus` — 分析・実装の焦点
   - `## Output Template` — 出力フォーマット
   - `## Notes` — 注意事項
3. `agent-config.yaml` の該当 agent に perspective を追加
4. `multi-agent.sh` の `get_cli_perspectives_{task_type}()` にマッピング追加

### Perspective 設計原則

- **タスクタイプを意識**: review は read-only、implement はステージング出力
- **出力フォーマット統一**: 統合レポート生成のため、Output Template を標準化
- **CLI 非依存**: 特定 CLI の機能に依存しないプロンプト設計
- **スコープ明確化**: 1 perspective = 1 観点（複数の責務を混ぜない）
