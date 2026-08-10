# AI Spec-Driven Development

AI開発ツール（Claude Code、GitHub Copilot、Cursor）に最適化された**7文書構造**を起点とするドキュメント戦略フレームワーク。

従来の60+文書から**最小7文書**で始動 ── AIが迷わず理解できる高品質ドキュメントでプロジェクトを駆動し、成長に応じて拡張します。

## 導入方法

3つの方法でプロジェクトに導入できます。

### 方法A: テンプレートをコピー（最もシンプル）

[`docs-template/`](./docs-template/) からコア7文書とフォルダ構造をプロジェクトにコピー:

```bash
# テンプレートをコピー
cp -r docs-template/MASTER.md your-project/docs/
cp -r docs-template/01-context/ your-project/docs/
cp -r docs-template/02-design/ your-project/docs/
cp -r docs-template/03-implementation/ your-project/docs/
cp -r docs-template/04-quality/ your-project/docs/
cp -r docs-template/05-operations/ your-project/docs/
cp -r docs-template/06-reference/ your-project/docs/
```

### 方法B: Claude Code Skills で初期化

Claude Code でこのリポジトリを参照し、スラッシュコマンドで自動セットアップ:

```
/init-docs          # コア7文書 + 拡張フォルダ構造を初期化
/validate-docs      # ドキュメント要件を検証
/setup-ai-config    # CLAUDE.md / .cursorrules / copilot-instructions.md を生成
```

### 方法C: MCP Server で AI ツール連携

MCP対応クライアント（Claude Code, Claude Desktop等）にサーバーを登録:

```json
{
  "command": "node",
  "args": ["/path/to/ai-spec-driven-development/mcp/dist/index.js"]
}
```

詳細: [`mcp/README.md`](./mcp/README.md)

## セットアップ

```bash
git clone https://github.com/feel-flow/ai-spec-driven-development.git
cd ai-spec-driven-development
npm install && npm run setup
```

大規模な `node_modules` や `git worktree` を併用する開発環境では、macOS のファイルディスクリプタ上限設定も推奨です。詳細は [docs/MAXFILES_SETUP_GUIDE.md](./docs/MAXFILES_SETUP_GUIDE.md) を参照してください。

### ACE ナレッジキャプチャの autonomous 化（任意）

PR マージ後の `/ace-curate` 手動実行を、**別プロセスの subagent + git worktree** に任せる推奨パターンがあります（feature flag でデフォルト無効）。テンプレートと運用手順は次を参照してください。

- [ace-autonomous.md](./docs-template/05-operations/deployment/ace-autonomous.md)（概要・4 ガード・shadow 運用）
- [docs-template/scripts/ace/README.md](./docs-template/scripts/ace/README.md)（配置ファイル一覧）

### 利用可能なコマンド

| コマンド                             | 説明                                                                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run setup`                      | 依存関係インストール + MCP サーバービルド                                                                                                                                                                            |
| `npm run validate`                   | コア7文書の存在と構造の検証                                                                                                                                                                                          |
| `npm run check`                      | MCP サーバーの動作確認                                                                                                                                                                                               |
| `npm run build:mcp`                  | MCP サーバーのビルド                                                                                                                                                                                                 |
| `npm run quality:local`              | PR 前のローカル品質ゲート（`npm ci` / `npm --prefix mcp ci` は含まない。実体チェーンは [`docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` §3.3](./docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md#quality-local-detail) 参照） |
| `npm run lint:md`                    | markdownlint（従来 CI と同条件のパス指定）                                                                                                                                                                           |
| `npm run format:md`                  | Markdown を Prettier で整形（`docs/`、`docs-template/`、ルート `*.md`）                                                                                                                                              |
| `npm run format:md:check`            | Markdown が Prettier 整形済みかを検査（CI / pre-commit 用）                                                                                                                                                          |
| `npm run setup:labels`               | GitHub ラベルの自動セットアップ                                                                                                                                                                                      |
| `bash scripts/setup-multi-review.sh` | Multi-CLI Review Agent のセットアップ                                                                                                                                                                                |

品質ゲートの全体像・リリース手動フローは [docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md](./docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md) を参照してください。

**ブランチ保護で「CI」必須ステータスを要求している場合**: ワークフロー削除後は該当チェックが付かなくなるため、リポジトリ管理者が保護ルールの**必須ステータス**を更新する必要がある場合があります。

### Multi-CLI Review Agent

複数のAI CLI を並列実行し、異なるモデルの観点からコードレビューを行うオーケストレーションシステム。標準レビュー体制は **Claude Code（一次）+ Codex CLI（クロスモデル）** の2本柱で、GitHub Copilot は従量課金化に伴い既定ラインナップから除外（オプトイン）。

```bash
# セットアップ（yq インストール、CLI検出、動作確認）
bash scripts/setup-multi-review.sh

# レビュー実行
bash scripts/multi-review.sh              # 全CLI並列（デフォルト）
bash scripts/multi-review.sh --dry-run    # 実行プランのみ確認
bash scripts/multi-review.sh --strategy minimize_cost  # コスト最小化モード
```

Claude Code からはスラッシュコマンドで実行できます:

```
/multi-review                              # デフォルト（全CLI並列）
/multi-review --strategy minimize_cost     # コスト最小化
/multi-review --cli codex-cli              # 特定CLIのみ
```

| CLI          | コスト    | デフォルト観点                                              |
| ------------ | --------- | ----------------------------------------------------------- |
| Claude Code  | Premium   | 型設計分析                                                  |
| Codex CLI    | Standard  | コードレビュー、エラーハンドリング、テスト分析              |
| Gemini CLI   | Free-tier | セキュリティ分析、コメント分析                              |
| Cursor Agent | Flat-rate | コード簡素化                                                |
| Copilot CLI  | Metered   | —（従量課金のため既定外。`--cli copilot-cli` でオプトイン） |

設定: [`scripts/review-config.yaml`](./scripts/review-config.yaml) | 詳細: [`multi-cli-review-orchestration.md`](./docs-template/05-operations/deployment/multi-cli-review-orchestration.md)

## 7文書構造（起点）

```
docs/
├── MASTER.md                    # 中央管理ハブ（必須・最初に読む）
├── 01-context/
│   ├── PROJECT.md               # ビジョンと要件
│   └── CONSTRAINTS.md           # 制約条件
├── 02-design/
│   ├── ARCHITECTURE.md          # システム設計
│   └── DOMAIN.md                # ビジネスロジック
├── 03-implementation/
│   └── PATTERNS.md              # 実装パターン
├── 04-quality/
│   └── TESTING.md               # テスト戦略
├── 05-operations/
│   └── DEPLOYMENT.md            # 運用手順
└── 06-reference/
    ├── GLOSSARY.md              # 用語集
    └── DECISIONS.md             # 設計判断記録
```

**なぜ7文書から始めるか**: AIツールは情報の散在に弱い。まず7文書に集約してコンテキスト理解の精度を確保し、プロジェクトの成長に応じて各フォルダ内に文書を追加していく。全文書が揃わなくてもAIと対話しながら段階的に仕様を策定できる。詳細は [AI Spec Driven Development 概念と実践](./docs/AI_SPEC_DRIVEN_DEVELOPMENT.md) を参照。

## 設計原則

本リポジトリは **AI 仕様駆動開発のテンプレート配布リポ** として、以下の 5 原則に従います。新機能の導入・PR レビュー時に違反していないか確認してください。

| #   | 原則                                 | 概要                                                                                                                         |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| P1  | URL 参照を一級市民とする             | `git clone` せずに GitHub URL を AI ツールに読ませる使い方を一級市民として扱う                                               |
| P2  | 配布境界マップ                       | `docs-template/`・`docs-template/.github/` = 配布物 / `docs/`・`scripts/`・`mcp/`・`.claude/`・`.github/` = リポ運用インフラ |
| P3  | 特定ツール依存物を配布対象に入れない | Obsidian / Notion / Hugo 等の特定アプリ依存設定は `docs-template/` 外に置く                                                  |
| P4  | ミニマル起点 + 段階拡張              | コア 7 文書から始め、必要に応じて拡張する                                                                                    |
| P5  | 撤退コスト試算                       | 新機能導入 Issue で「採用しないことになったら何ファイル消すか」を着手前に見積もる                                            |

詳細・違反ケーススタディ（Obsidian 統合の撤退、PR #403）・ガードレール: [docs/DESIGN_PRINCIPLES.md](./docs/DESIGN_PRINCIPLES.md)

## 関連書籍

<table>
  <tr>
    <td width="200" valign="top" align="center">
      <a href="https://www.amazon.co.jp/dp/B0H8NZM4BH">
        <img src="./images/book-ai-sdd-official-guide.png" width="180" alt="AI仕様駆動開発 公式ガイド">
      </a>
    </td>
    <td valign="top">
      <h3>AI仕様駆動開発 公式ガイド</h3>
      <p><em>標準仕様と公式実装リファレンス</em></p>
      <p>株式会社フィールフロウが公開する、AI仕様駆動開発の公式ガイドです。AI仕様駆動開発の全体像、標準仕様、公式実装、導入手順、適合性評価を一冊にまとめています。</p>
      <p><strong>Kindle</strong>: <a href="https://www.amazon.co.jp/dp/B0H8NZM4BH">Kindleストアで見る</a></p>
    </td>
  </tr>
</table>

## ドキュメント

### 概念・ガイド

- [AI Spec-Driven Development 概念と実践](./docs/AI_SPEC_DRIVEN_DEVELOPMENT.md) — 7文書から始めて段階的に拡張する戦略
- [AI駆動 Git Workflow](./docs/AI_GIT_WORKFLOW.md) — AIに最適化された10ステップのワークフロー
- [運用ガイド (AIエージェント向け)](./docs/OPERATIONAL_GUIDE.md) — AIエージェントの操作仕様書
- [OS ファイルディスクリプタ上限の設定ガイド](./docs/MAXFILES_SETUP_GUIDE.md) — macOS / Windows の fd 上限設定と VS Code 安定化手順

### Quick Start

| 対象             | ガイド                                                                                       | 所要時間  |
| ---------------- | -------------------------------------------------------------------------------------------- | --------- |
| 完全初心者       | [GETTING_STARTED_ABSOLUTE_BEGINNER.md](./docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md) | 約4.5時間 |
| 新規プロジェクト | [GETTING_STARTED_NEW_PROJECT.md](./docs-template/GETTING_STARTED_NEW_PROJECT.md)             | 8-12時間  |
| 既存プロジェクト | [GETTING_STARTED.md](./docs-template/GETTING_STARTED.md)                                     | 約2時間   |

### AIツール設定ガイド

| ツール         | ガイド                                                             | 設定ファイル                      |
| -------------- | ------------------------------------------------------------------ | --------------------------------- |
| Claude Code    | [SETUP_CLAUDE_CODE.md](./docs-template/SETUP_CLAUDE_CODE.md)       | `CLAUDE.md`                       |
| GitHub Copilot | [SETUP_GITHUB_COPILOT.md](./docs-template/SETUP_GITHUB_COPILOT.md) | `.github/copilot-instructions.md` |
| Cursor         | [SETUP_CURSOR.md](./docs-template/SETUP_CURSOR.md)                 | `.cursorrules`                    |

## AIエージェント向け

すべてのAIエージェントは作業開始前に [`docs-template/MASTER.md`](./docs-template/MASTER.md) を必ず読んでください。

- **Claude Code**: [`CLAUDE.md`](./CLAUDE.md)
- **GitHub Copilot**: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)
- **Cursor**: [`.cursorrules`](./.cursorrules)
- **その他**: [`AGENTS.md`](./AGENTS.md)

## ライセンス

[MIT License](./LICENSE)

## リリース

- [CHANGELOG.md](./CHANGELOG.md)
- [Releases](https://github.com/feel-flow/ai-spec-driven-development/releases)

---

**FEEL-FLOW** | [https://feelflow.co.jp](https://feelflow.co.jp) | 最終更新: 2026年2月
