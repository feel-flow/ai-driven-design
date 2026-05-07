# docs-template/

AI 仕様駆動開発フレームワークの **テンプレート集**。コア 7 文書を起点に、プロジェクト規模に応じて拡張フォルダを追加していく構成です。

> **使い方の概観**: ルート [README.md](../README.md) の「導入方法」セクションを参照。本 README は **テンプレ内の規約** に焦点を絞ります。

---

## 📂 構成

### コア 7 文書 + ルート直下

```
docs-template/
├── MASTER.md                          # 中央ハブ。全体方針・AI ルール・ツール統合
├── GETTING_STARTED.md                 # 標準セットアップ手順
├── GETTING_STARTED_NEW_PROJECT.md     # 新規プロジェクト向け
├── GETTING_STARTED_ABSOLUTE_BEGINNER.md # 初学者向け
├── SETUP_CLAUDE_CODE.md               # Claude Code 詳細設定
├── SETUP_CURSOR.md                    # Cursor 詳細設定
└── SETUP_GITHUB_COPILOT.md            # GitHub Copilot 詳細設定
```

### 番号付き拡張フォルダ

| フォルダ                 | 役割                                                          |
| ------------------------ | ------------------------------------------------------------- |
| `00-planning/`           | 企画・PoC・インセプションデッキ                               |
| `01-context/`            | プロジェクト背景・制約                                        |
| `02-design/`             | アーキテクチャ・ドメイン・API・データベース                   |
| `03-implementation/`     | 実装パターン・規約・依存ガイド・サンプルテンプレ              |
| `04-quality/`            | テスト戦略・バリデーション・ガードレール・セキュリティ        |
| `05-operations/`         | デプロイ・運用・組織展開（索引 + 詳細サブフォルダ構造）       |
| `06-reference/`          | 用語集・意思決定ログ・エージェント定義                        |
| `07-project-management/` | ロードマップ・タスク・リスク                                  |
| `08-knowledge/`          | プレイブック・FAQ・ベストプラクティス・トラブルシューティング |
| `archive/`               | 廃止文書の退避先                                              |

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

- **ハイフン (`-`) は使わない**: トップレベル MD はアンダースコア区切りで統一する（例: `REVIEW_AGENT_CREATION_GUIDE.md` であって `REVIEW-AGENT-CREATION-GUIDE.md` ではない）
- **拡張子**: Markdown は `.md`（`.markdown` は使わない）
- **数字プレフィックス**: 番号付きフォルダ自体（`00-planning/` 等）には付与するが、サブフォルダ内ファイルには付けない（読み順は親索引の表で示す）
- **大文字小文字**: トップレベル MD はファイル名全体を大文字、サブフォルダおよびその配下のファイルは全て小文字

### 命名規則を逸脱したい場合

逸脱には常に **トレードオフ** があります。次のいずれかに該当する場合のみ、PR 説明欄で理由を明記して逸脱を許容してください。

- 公式 API/プロダクト名がハイフン区切りで広く認知されている
- 既存のリンク互換性を維持する必要がある（外部からの参照が多い）
- 自動生成ファイル（テンプレ展開 / lint 出力）

---

## 🚀 利用フロー

### 1. テンプレートをコピー

```bash
# 例: 自プロジェクトの docs/ にコア 7 文書をコピー
cp docs-template/MASTER.md your-project/docs/
cp -r docs-template/01-context/ your-project/docs/
cp -r docs-template/02-design/ your-project/docs/
cp -r docs-template/03-implementation/ your-project/docs/
cp -r docs-template/04-quality/ your-project/docs/
cp -r docs-template/05-operations/ your-project/docs/
cp -r docs-template/06-reference/ your-project/docs/
```

### 2. プレースホルダを埋める

各テンプレ冒頭の YAML frontmatter（`title`, `version`, `status`, `owner`, `created`, `updated`）と、本文中の `{{プロジェクト名}}` 等を自プロジェクトの値に置換します。

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
