# /multi-review — 複数AIによるクロスモデルレビュー実行

複数のAI CLI（Claude Code / Codex / Gemini / Cursor）を並列実行し、異なる観点からコードレビューを実行します。Copilot CLI は従量課金のため既定ラインナップ外です（`--cli copilot-cli` でオプトイン）。

## 前提

- git リポジトリで作業中であること
- `scripts/multi-review.sh` が存在すること
- 少なくとも1つのAI CLIがインストールされていること（`claude`, `codex`, `copilot`, `gemini`, `cursor-agent` のいずれか）
- `yq` がインストールされていること（`brew install yq`）
- 未コミットまたはブランチ上の変更が存在すること

## 引数

- `$ARGUMENTS` — multi-review.sh に渡すオプション（省略時はデフォルト設定で実行）
  - 例: `--cli claude-code --cli codex-cli`（特定CLIのみ）
  - 例: `--strategy minimize_cost`（コスト最小化）
  - 例: `--perspective code-review`（特定パースペクティブのみ）
  - 例: `--mode cross-model --perspective code-review`（クロスモデル比較）
  - 全オプションは `bash scripts/multi-review.sh --help` で確認できます

## 手順

### 1. プラン確認（--dry-run）

まず実行プランを表示し、ユーザーに確認を求めます:

```bash
bash scripts/multi-review.sh --dry-run $ARGUMENTS
```

出力を確認し、以下をユーザーに報告:
- 検出されたCLI一覧（✅/❌）
- 各CLIに割り当てられたパースペクティブ
- モード・戦略・タイムアウト設定

ユーザーに「このプランで実行してよいか」を確認してください。

### 2. レビュー実行

ユーザーが承認したら、実際のレビューを実行します:

```bash
bash scripts/multi-review.sh $ARGUMENTS
```

**注意**: 実行には各CLIの利用コストが発生します（特に premium/standard ティアのCLI）。`--strategy minimize_cost` で固定料金/無料CLIを優先できます。タイムアウトはデフォルト300秒/CLIです。

実行中は進捗状況を監視し、完了を待ちます。

### 3. 結果分析と修正提案

レビュー結果は `.review-results/` ディレクトリに出力されます。

#### 3-1. 結果ファイルの読み込み

スクリプトが自動生成する統合レポートをまず読み込みます:

```bash
# スクリプト生成の統合レポートを確認
cat .review-results/integrated-report.md

# 各CLIの個別結果も必要に応じて確認
ls -la .review-results/
```

個別結果ファイルのパス: `.review-results/{cli-name}/{perspective}.md`

#### 3-2. 重大度別の分類

スクリプト生成レポートを基に、PR Review Response Policy に従って分類します:

| 重大度 | 対応 |
| ------ | ---- |
| **Critical** | 必ず修正（確認不要で即対応） |
| **Warning** | 必ず修正（確認不要で即対応） |
| **Suggestion** | 実装が妥当なものは対応（確認不要） |
| **Info/Good Practices** | 確認のみ（対応不要） |

#### 3-3. 重複排除（デデュプリケーション）

複数のCLIが同じ問題を指摘している場合、重複を排除してまとめます。
同じファイル・同じ行番号・同じ種類の指摘は1つにまとめ、検出したCLI名を併記します。

#### 3-4. 統合レポートの出力

以下の形式でユーザーに報告します:

```markdown
## Multi-CLI Review 統合レポート

### Critical Issues (X件)
- [CLI名] ファイル:行番号 — 問題の説明

### Warning Issues (X件)
- [CLI名] ファイル:行番号 — 問題の説明

### Suggestions (X件)
- [CLI名] ファイル:行番号 — 提案内容

### クロスモデル検出（複数CLIが指摘）
- [CLI-A, CLI-B] ファイル:行番号 — 問題の説明（信頼度: 高）

### Summary
| CLI | Critical | Warning | Suggestion | Info |
|-----|----------|---------|------------|------|
| claude-code | X | X | X | X |
| codex-cli | X | X | X | X |
| ... | ... | ... | ... | ... |
```

#### 3-5. 自動修正の実行

PR Review Response Policy に従い、Critical/Warning/妥当な Suggestion を自動修正します:

1. Critical/Warning の修正対象をリストアップ
2. 各問題に対して修正を実施
3. Suggestion は実装が妥当なものを対応（確認不要）
4. 修正内容をユーザーに報告

修正完了後:

```bash
git diff  # 修正内容の確認
```

## 重要ルール

- ステップ1の dry-run 確認なしにステップ2を実行しないこと
- Critical/Warning の自動修正はユーザー確認不要で実行すること（PR Review Response Policy準拠）
- 妥当な Suggestion も確認不要で対応すること
- Info は報告のみで修正しないこと
- CLI未インストールの場合は fallback 設定に従って自動再分配されます
- 結果は `.review-results/` に保存され、後から参照できます
- `scripts/agent-config.yaml` で設定をカスタマイズできます
