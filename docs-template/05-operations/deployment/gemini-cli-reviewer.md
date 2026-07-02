# Gemini CLI Reviewer Setup

> **Parent**: [ai-tools-integration.md](./ai-tools-integration.md) | [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md)

## 概要

Google Gemini CLIをコードレビューエージェントとして利用するためのセットアップガイドです。Gemini CLIは大きな無料枠と長いコンテキストウィンドウを持ち、セキュリティ分析やドキュメント分析に特に適しています。

**推奨パースペクティブ**: Security Analysis（無料枠を活用した広範囲セキュリティスキャン）

---

## 前提条件

- Node.js 18以上
- Google アカウント（Gemini API キー取得用）

---

## インストール

### インストール

```bash
# npm でグローバルインストール
npm install -g @google/gemini-cli

# npx で直接実行（インストール不要）
npx @google/gemini-cli
```

> **Note**: パッケージ名は変更される可能性があります。最新のインストール方法は [Gemini CLI 公式リポジトリ](https://github.com/google-gemini/gemini-cli) を参照してください。

### 動作確認

```bash
gemini --version
gemini -p "Hello, this is a test."
```

### API キー設定

```bash
# Google AI Studio でAPIキーを取得
# https://aistudio.google.com/apikey

# 環境変数に設定
export GEMINI_API_KEY="your-api-key-here"

# またはログインベースの認証
gemini auth login
```

---

## CLI フラグリファレンス

### レビューに必要なフラグ

| フラグ                   | 説明                                              | 用途                      |
| ------------------------ | ------------------------------------------------- | ------------------------- |
| `-p` / `--prompt`        | 非インタラクティブモード（ヘッドレス）            | プロンプト直接渡し        |
| `--sandbox` / `-s`       | サンドボックスモード                              | ファイルシステム保護      |
| `--output-format json`   | JSON出力                                          | 構造化結果のパース        |
| `--output-format text`   | テキスト出力（デフォルト）                        | 人間可読な結果            |
| `--yolo`                 | 全アクション自動承認                              | 非インタラクティブ実行時  |
| `--approval-mode <mode>` | 承認モード（`default`/`auto_edit`/`yolo`/`plan`） | `plan`でread-onlyレビュー |
| `--debug` / `-d`         | デバッグモード                                    | トラブルシューティング    |
| `--resume <latest\|N>`   | 前回セッション再開（`latest`または番号指定）      | 継続レビュー              |

### レビュー実行コマンド例

```bash
# 基本的なコードレビュー
gemini -p "以下のdiffをセキュリティ観点でレビューしてください:
$(git diff --cached)" --sandbox --output-format text

# JSON出力でスクリプト連携
gemini -p "Review the following code changes for security vulnerabilities:
$(git diff --cached)" --sandbox --output-format json

# パイプ入力
git diff --cached | gemini -p "Analyze this diff for security issues:" --sandbox

# ファイル入力
gemini -p "Review this file for security vulnerabilities:" < src/auth/handler.ts --sandbox
```

---

## Multi-CLI Orchestration での役割

### デフォルト設定

```yaml
# review-config.yaml
agents:
  gemini-cli:
    command: gemini
    cost_tier: free-tier
    default_perspectives: [security-analysis, comment-analysis]
```

### 推奨パースペクティブ

| パースペクティブ      | 適合度     | 理由                                             |
| --------------------- | ---------- | ------------------------------------------------ |
| **Security Analysis** | ⭐⭐⭐⭐⭐ | 無料枠で広範囲スキャン、長コンテキストで全体把握 |
| Comment Analysis      | ⭐⭐⭐⭐   | ドキュメント理解力が高い                         |
| Code Review           | ⭐⭐⭐     | 汎用レビューも可能                               |

### フォールバック時の動作

Gemini CLIが利用不可の場合、担当パースペクティブ（`security-analysis`、`comment-analysis`）は `codex-cli` にフォールバックします。

---

## セキュリティ分析の設定

### プロンプトテンプレート（perspectives/security-analysis.md）

セキュリティ分析は以下の5観点をカバーします：

1. **インジェクション攻撃** — SQL、XSS、コマンドインジェクション
2. **認証・認可** — 認証バイパス、権限昇格
3. **データ漏洩** — 機密情報のハードコーディング、ログへの出力
4. **依存関係** — 既知の脆弱性を持つパッケージ
5. **設定ミス** — CORS、CSP、セキュリティヘッダー

### サンドボックスの重要性

セキュリティ分析時は必ず `--sandbox` フラグを使用してください。レビュー対象のコードに悪意のあるコードが含まれている可能性があるため、ファイルシステムへの書き込みを防止します。

---

## コスト管理

### 無料枠

Gemini CLI の無料枠（認証方式により異なる、[公式ドキュメント](https://google-gemini.github.io/gemini-cli/docs/quota-and-pricing.html) で最新値を確認）：

| 認証方式               | リクエスト/分 | リクエスト/日 | 備考                               |
| ---------------------- | ------------- | ------------- | ---------------------------------- |
| **個人Googleログイン** | 60            | 1,000         | Gemini Code Assist for individuals |
| **無料APIキー**        | 10            | 250           | Flash モデルのみ                   |

### レビューでの消費目安

| 操作                               | 推定トークン | 無料枠での回数/日 |
| ---------------------------------- | ------------ | ----------------- |
| セキュリティ分析（小PR）           | ~5,000       | 100+              |
| セキュリティ分析（大PR）           | ~20,000      | 50+               |
| フルレビュー（全パースペクティブ） | ~50,000      | 20+               |

**推奨**: セキュリティ分析に特化し、無料枠内で頻繁に実行

---

## トラブルシューティング

### API キーエラー

```
Error: GEMINI_API_KEY is not set
```

**対応**: 環境変数を設定するか、`gemini auth login` で認証

### レート制限

```
Error: 429 Too Many Requests
```

**対応**: 無料枠の制限に達した場合、数分待つか、`minimize_cost` 戦略で他のCLIにフォールバック

### 長いレスポンス時間

大きなdiffを分析する場合、レスポンスに時間がかかることがあります。

**対応**: `--changed-files` フラグで分析対象を絞る、またはタイムアウトを設定

---

## 関連ドキュメント

- [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md) — オーケストレーション運用ガイド
- [REVIEW_AGENT_CREATION_GUIDE.md](../../06-reference/REVIEW_AGENT_CREATION_GUIDE.md) — 汎用レビューエージェント作成ガイド
- [ai-tools-integration.md](./ai-tools-integration.md) — AIツール統合・コスト比較
- [cursor-cli-reviewer.md](./cursor-cli-reviewer.md) — Cursor CLI セットアップ
