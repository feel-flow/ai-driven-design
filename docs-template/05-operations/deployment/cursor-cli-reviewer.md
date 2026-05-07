# Cursor CLI Reviewer Setup

> **Parent**: [ai-tools-integration.md](./ai-tools-integration.md) | [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md)

## 概要

Cursor CLIをコードレビューエージェントとして利用するためのセットアップガイドです。Cursor CLIはエディタとの強い連携を持ち、コード簡素化やリファクタリング提案に特に適しています。

**推奨パースペクティブ**: Code Simplification（月額固定料金でコスト気にせず繰り返し実行）

---

## 前提条件

- Cursor エディタ インストール済み
- Cursor Pro サブスクリプション（$20/月、CLI機能利用に必要）

---

## インストール

### Cursor エディタからCLIを有効化

```bash
# Cursor エディタの Command Palette (Cmd+Shift+P) から:
# "Install 'cursor-agent' command in PATH" を実行

# 動作確認
cursor-agent --version
```

### CLI が PATH に通っていない場合

```bash
# macOS
export PATH="$PATH:/Applications/Cursor.app/Contents/Resources/app/bin"

# ~/.zshrc に追加して永続化
echo 'export PATH="$PATH:/Applications/Cursor.app/Contents/Resources/app/bin"' >> ~/.zshrc
```

---

## CLI フラグリファレンス

### レビューに必要なフラグ

| フラグ                 | 説明                                   | 用途                                 |
| ---------------------- | -------------------------------------- | ------------------------------------ |
| `-p` / `--print`       | ヘッドレスモード（非インタラクティブ） | プロンプトはpositional引数として渡す |
| `--model auto`         | モデル自動選択                         | 最適なモデルを自動選択               |
| `--model <name>`       | モデル指定                             | 特定モデルを使用                     |
| `--output-format text` | テキスト出力                           | 人間可読な結果                       |
| `--force`              | 確認なし実行                           | 自動化用                             |

### レビュー実行コマンド例

```bash
# 基本的なコード簡素化レビュー
cursor-agent --print --model auto \
  "以下のdiffをコード簡素化の観点でレビューしてください:
$(git diff --cached)"

# 特定ファイルのレビュー
cursor-agent --print --model auto \
  "Review the following file for simplification opportunities:" \
  < src/services/complex-handler.ts

# タイムアウト付き（ハング対策）
timeout 120 cursor-agent --print --model auto \
  "Analyze code complexity and suggest simplifications:
$(git diff --cached)"
```

---

## Multi-CLI Orchestration での役割

### デフォルト設定

```yaml
# review-config.yaml
agents:
  cursor-cli:
    command: cursor-agent
    cost_tier: flat-rate
    default_perspectives: [code-simplification]
```

### 推奨パースペクティブ

| パースペクティブ        | 適合度     | 理由                                   |
| ----------------------- | ---------- | -------------------------------------- |
| **Code Simplification** | ⭐⭐⭐⭐⭐ | エディタ連携の知見を活かした簡素化提案 |
| Code Review             | ⭐⭐⭐     | 汎用レビューも可能                     |
| Comment Analysis        | ⭐⭐⭐     | コメント品質分析                       |

### フォールバック時の動作

Cursor CLIが利用不可の場合、`code-simplification` パースペクティブは `copilot-cli` にフォールバックします（同じ固定料金ティア）。

---

## 既知の制限事項

### ヘッドレスモードの安定性

> **⚠️ 重要**: Cursor CLI の `--print` / `-p` モードには、プロセスがハングして終了しない既知の問題が報告されています。

**影響**: 非インタラクティブ実行時にプロセスが無期限にハングする可能性

**回避策**:

1. **timeout コマンドでラップ**（推奨）:

```bash
# Linux
timeout 120 cursor-agent --print --model auto "prompt here"

# macOS（coreutilsが必要: brew install coreutils）
gtimeout 120 cursor-agent --print --model auto "prompt here"
```

2. **アダプターでの対応**:

```bash
# adapter-cursor-cli.sh 内
TIMEOUT=${REVIEW_TIMEOUT:-120}
timeout "$TIMEOUT" cursor-agent --print --model auto "$PROMPT" > "$OUTPUT_FILE" 2>&1 || {
  if [ $? -eq 124 ]; then
    echo "WARNING: Cursor CLI timed out after ${TIMEOUT}s" >&2
    echo "## Code Simplification Review Results

**Reviewer**: Cursor CLI (timed out)
**Verdict**: SKIPPED — Timeout after ${TIMEOUT}s" > "$OUTPUT_FILE"
  fi
}
```

3. **Cursor CLIをスキップして代替CLIを使用**:

```bash
bash scripts/multi-review.sh --cli copilot-cli --perspective code-simplification
```

### 今後のアップデート

Cursor チームはCLIの安定性改善に継続的に取り組んでいます。最新の状態は以下で確認できます：

- Cursor Forum: Bug Reports カテゴリ
- Cursor CLI Changelog

---

## コスト管理

### 月額固定料金

| プラン   | 料金   | CLI利用           |
| -------- | ------ | ----------------- |
| Free     | $0     | 制限あり          |
| Pro      | $20/月 | 無制限            |
| Business | $40/月 | 無制限 + 管理機能 |

**推奨**: Pro プラン（$20/月）で無制限にレビュー実行

### レビューでの消費

月額固定料金のため、実行回数によるコスト増はありません。`minimize_cost` 戦略では、Cursor CLI（および Copilot CLI）が優先的に使用されます。

---

## トラブルシューティング

### cursor-agent コマンドが見つからない

```
command not found: cursor-agent
```

**対応**: Cursor エディタの Command Palette から CLI をインストール、または PATH を手動設定

### 認証エラー

```
Error: Not authenticated
```

**対応**: Cursor エディタでログイン済みであることを確認。CLI は エディタのセッションを共有します。

### プロセスがハングする

**対応**: 前述の「既知の制限事項」セクションを参照。`timeout` コマンドの利用を推奨。

---

## 関連ドキュメント

- [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md) — オーケストレーション運用ガイド
- [REVIEW_AGENT_CREATION_GUIDE.md](../../06-reference/REVIEW_AGENT_CREATION_GUIDE.md) — 汎用レビューエージェント作成ガイド
- [ai-tools-integration.md](./ai-tools-integration.md) — AIツール統合・コスト比較
- [gemini-cli-reviewer.md](./gemini-cli-reviewer.md) — Gemini CLI セットアップ
- [SETUP_CURSOR.md](../../SETUP_CURSOR.md) — Cursor エディタ詳細設定
