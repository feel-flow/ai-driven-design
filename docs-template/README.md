# docs-template/

AI 仕様駆動開発フレームワークの **テンプレート集**。本ドキュメントは **テンプレ内の規約** に焦点を絞った SSOT です。

> **使い方の概観**: ルート [README.md](../README.md) の「導入方法」セクションを参照。
>
> **「コア 7 文書」の正しい定義**: 本フレームワークの「コア 7 文書」は `MASTER.md` / `PROJECT.md` / `ARCHITECTURE.md` / `DOMAIN.md` / `PATTERNS.md` / `TESTING.md` / `DEPLOYMENT.md` の 7 ファイルを指し、番号付きフォルダ（`01-context/` 等）配下に分散配置されています。詳細はルートの [CLAUDE.md](../CLAUDE.md) と [MASTER.md](./MASTER.md) を参照。

---

## 📂 構成

### ルート直下のセットアップ系ドキュメント

```
docs-template/
├── MASTER.md                            # 中央ハブ（コア 7 文書のひとつ）
├── README.md                            # 本ファイル（テンプレ規約 SSOT）
├── GETTING_STARTED.md                   # 標準セットアップ手順
├── GETTING_STARTED_NEW_PROJECT.md       # 新規プロジェクト向け
├── GETTING_STARTED_ABSOLUTE_BEGINNER.md # 初学者向け
├── SETUP_CLAUDE_CODE.md                 # Claude Code 詳細設定
├── SETUP_CURSOR.md                      # Cursor 詳細設定
└── SETUP_GITHUB_COPILOT.md              # GitHub Copilot 詳細設定
```

> **注**: 上記ブロックは「ルート直下に置くセットアップ系」のみを示します。コア 7 文書の他の 6 つ（`PROJECT.md`, `ARCHITECTURE.md` 等）と拡張ドキュメントは下表の番号付きフォルダ配下にあります。

### 拡張フォルダ

| フォルダ                 | 役割                                                                           |
| ------------------------ | ------------------------------------------------------------------------------ |
| `00-planning/`           | 企画・PoC・インセプションデッキ                                                |
| `01-context/`            | プロジェクト背景・制約（コア: `PROJECT.md`）                                   |
| `02-design/`             | アーキテクチャ・ドメイン・API・DB（コア: `ARCHITECTURE.md`, `DOMAIN.md`）      |
| `03-implementation/`     | 実装パターン・規約・依存ガイド・サンプルテンプレ（コア: `PATTERNS.md`）        |
| `04-quality/`            | テスト戦略・バリデーション・ガードレール・セキュリティ（コア: `TESTING.md`）   |
| `05-operations/`         | デプロイ・運用・組織展開（コア: `DEPLOYMENT.md`、索引 + 詳細サブフォルダ構造） |
| `06-reference/`          | 用語集・意思決定ログ・エージェント定義                                         |
| `07-project-management/` | ロードマップ・タスク・リスク                                                   |
| `08-knowledge/`          | プレイブック・FAQ・ベストプラクティス・トラブルシューティング                  |
| `archive/`               | 廃止文書の退避先                                                               |
| `setup-guides/`          | ツール別セットアップ詳細ガイド（GitHub Copilot 等の分割文書）                  |
| `scripts/`               | ACE 等の運用スクリプト雛形                                                     |
| `.claude/`               | Claude Code 用 hooks/skills 雛形                                               |
| `.github/`               | エージェント定義・GitHub 設定雛形                                              |

> **`05-operations/` の特殊構造**: 運用系は文書量が多いため、トップレベルの `DEPLOYMENT.md` / `ORGANIZATIONAL_ROLLOUT.md` を **索引** とし、`deployment/` / `organizational-rollout/` サブフォルダに詳細を配置するパターンを採用しています。詳細は [05-operations/organizational-rollout/document-splitting.md](./05-operations/organizational-rollout/document-splitting.md) の分割閾値（500/800/1200 行）を参照。

---

## 📝 ファイル名命名規則

テンプレ内のファイル名は **2 系統** を使い分けます。新規ファイル追加時はこの規則に従ってください。

### 規則表

| 階層                                       | ルール                      | 例                                                               |
| ------------------------------------------ | --------------------------- | ---------------------------------------------------------------- |
| **ルート直下 / 番号付きフォルダ直下の MD** | `UPPER_SNAKE_CASE.md`       | `MASTER.md`, `PROJECT.md`, `DEPLOYMENT.md`, `LESSONS_LEARNED.md` |
| **サブフォルダ名**                         | `lowercase-with-hyphens/`   | `deployment/`, `organizational-rollout/`, `best-practices/`      |
| **サブフォルダ内 MD**                      | `lowercase-with-hyphens.md` | `git-workflow.md`, `phased-rollout.md`, `ace-cycle.md`           |

### 適用条件

- **ハイフン (`-`) は使わない（メインドキュメント）**: トップレベル MD はアンダースコア区切りで統一する（例: `REVIEW_AGENT_CREATION_GUIDE.md` であって `REVIEW-AGENT-CREATION-GUIDE.md` ではない）
- **拡張子**: Markdown は `.md`（`.markdown` は使わない）
- **数字プレフィックス**: 番号付きフォルダ自体（`00-planning/` 等）には付与する。サブフォルダ内ファイルでは **原則付けない**（読み順は親索引の表で示す）が、**読み順を強く示したい複数パートの分割文書** では `0N-` プレフィックスを許容する（既存例: `08-knowledge/best-practices/0X-*.md`, `setup-guides/github-copilot/0X-*.md`）
- **大文字小文字**: ルート直下 / 番号付きフォルダ直下の MD はファイル名全体を大文字、サブフォルダ名およびサブフォルダ内 MD は全て小文字（後述「例外」を除く）

### 例外（規則に従わない既知のファイル）

以下は **慣習・ツール都合** で規則と異なる命名を許容します。新規追加時にこのリストを拡張する場合は PR 説明欄で理由を明記してください。

- `README.md` — Markdown プロジェクトの標準的慣習
- `CLAUDE.md`, `AGENTS.md`, `GEMINI.md` — AI ツール向けの特殊ファイル（ファイル名がツール側で固定されている）
- `.github/copilot-instructions.md` — GitHub Copilot が固定ファイル名を要求
- `.cursorrules` — Cursor が固定ファイル名を要求

### 命名規則を逸脱したい場合

逸脱には常に **トレードオフ** があります。次のいずれかに該当する場合のみ、PR 説明欄で理由を明記して逸脱を許容してください。

- **公式 API/プロダクト名がハイフン区切りで広く認知されている場合**
  - 例: `next.config.js`, `tsconfig.json` のような確立した命名はそのまま使用する（本テンプレ内では現状該当なし）
- **既存のリンク互換性を維持する必要がある（外部からの参照が多い）**
  - 例: 外部公開済みの URL（ブログ記事・プレゼン資料・他リポジトリの README）から直接リンクされており、リネームによって 404 が発生するファイル
- **自動生成ファイル（テンプレ展開 / lint 出力）**
  - 例: `mcp/dist/` 配下のビルド成果物、`scripts/` の lint 出力など、人手で命名しない成果物

### 新規ファイル追加時のチェックリスト

- [ ] 配置場所はルート直下 / 番号付きフォルダ直下 / サブフォルダ内のいずれか
- [ ] 命名規則の適用階層に従っているか（規則表 を参照）
- [ ] 例外（`README.md` 等）に該当しないことを確認したか
- [ ] 逸脱する場合は PR 説明欄に該当条件と理由を記載したか

---

## 🚀 利用フロー

### 1. テンプレートをコピー

```bash
# 例: 自プロジェクトの docs/ にコア 7 文書を含む基本構造をコピー
cp docs-template/MASTER.md your-project/docs/
cp -r docs-template/01-context/ your-project/docs/        # PROJECT.md を含む
cp -r docs-template/02-design/ your-project/docs/         # ARCHITECTURE.md, DOMAIN.md を含む
cp -r docs-template/03-implementation/ your-project/docs/ # PATTERNS.md を含む
cp -r docs-template/04-quality/ your-project/docs/        # TESTING.md を含む
cp -r docs-template/05-operations/ your-project/docs/     # DEPLOYMENT.md を含む
cp -r docs-template/06-reference/ your-project/docs/

# セットアップ系ガイドは必要に応じて選択コピー
# cp docs-template/GETTING_STARTED.md your-project/docs/
# cp docs-template/SETUP_*.md your-project/docs/
```

### 2. プレースホルダを埋める

frontmatter を持つテンプレ（`MASTER.md` 等）の冒頭 YAML（`title`, `version`, `status`, `owner`, `created`, `updated`）と、本文中の `{{プロジェクト名}}` 等を自プロジェクトの値に置換します。frontmatter を持たないテンプレ（`GETTING_STARTED.md`, `SETUP_*.md` 等）は本文の置換のみ行ってください。

### 3. MCP サーバーで整合性チェック

```bash
cd mcp && npm run check
```

詳細は ルート [README.md](../README.md) の「導入方法」を参照。

---

## 🔗 関連

- [MASTER.md](./MASTER.md) - 中央ハブ。AI ルール・ツール統合の SSOT
- [GETTING_STARTED.md](./GETTING_STARTED.md) - 標準セットアップ手順
- [05-operations/organizational-rollout/document-splitting.md](./05-operations/organizational-rollout/document-splitting.md) - 文書分割の閾値（500/800/1200 行）
- [06-reference/DECISION_MATRIX.md](./06-reference/DECISION_MATRIX.md) - 「どの文書に書く？」判断ガイド
