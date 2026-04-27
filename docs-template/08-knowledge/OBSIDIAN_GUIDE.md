---
title: "Obsidian統合ガイド"
version: "1.0.0"
status: "approved"
owner: "Development Team"
created: "2026-02-12"
updated: "2026-02-12"
---

# Obsidian統合ガイド

このガイドでは、AI Spec-Driven DevelopmentプロジェクトでObsidianを使用してナレッジベースを管理する方法を説明します。

## 概要

`docs-template/` ディレクトリをObsidian Vaultとして使用し、以下の機能を提供します：

- **バックリンク自動生成**: 各ドキュメント末尾に「## Linked from」セクションを自動生成
- **リンク検証**: 壊れたリンクや無効なアンカーを検出
- **孤立ファイル検出**: どこからもリンクされていないファイルを発見
- **Git統合**: developブランチへのマージ時に自動的にバックリンクを更新

## セットアップ

### 1. Obsidianのインストール

[Obsidian公式サイト](https://obsidian.md/)からアプリケーションをダウンロードしてインストールします。

### 2. Vaultの設定

1. Obsidianを起動
2. 「Open folder as vault」を選択
3. `docs-template/` ディレクトリを開く

### 3. Huskyフックの設定

プロジェクトルートで以下を実行：

```bash
npm run obsidian:setup
```

これにより、developブランチへのマージ時に自動的にバックリンクが更新されるようになります。

## 使い方

### Obsidianでの閲覧

Obsidianで `docs-template/` を開くと、以下の機能が使えます：

- **グラフビュー**: ドキュメント間の関連性を可視化
- **バックリンクパネル**: 各ドキュメントへのリンク元を表示
- **クイックスイッチ**: `Cmd+O` でファイルを素早く検索
- **リンクオートコンプリート**: `[[` を入力するとファイル名が補完される（標準Markdownリンクも使用可）

### CLIコマンド

プロジェクトルートで以下のコマンドが使えます：

#### バックリンク更新

```bash
npm run obsidian:sync -- backlinks
```

全ドキュメントの「## Linked from」セクションを更新します。

**オプション**:

- `--dry-run`: 実際の更新を行わず、検証のみ実施
- `--silent`: ログ出力を抑制（エラーのみ表示）

#### リンク検証

```bash
npm run obsidian:sync -- validate
```

すべてのMarkdownリンクを検証し、壊れたリンクや無効なアンカーを報告します。

#### ナレッジベースレポート

```bash
npm run obsidian:sync -- report
```

以下の統計情報を表示：

- ドキュメント数
- 総リンク数
- 壊れたリンク数
- 孤立ファイル数

#### 孤立ファイル検出

```bash
npm run obsidian:sync -- orphaned
```

どこからもリンクされていないファイルのリストを表示します。

## Git Workflow との統合

### 自動バックリンク更新

developブランチへのマージ時、Husky post-mergeフックが自動的に：

1. バックリンクを更新
2. 変更があれば自動コミット（`docs: Update backlinks [skip ci]`）

### ワークフロー例

```bash
# 1. featureブランチで作業
git checkout -b feature/#123-new-doc
# ドキュメントを編集...

# 2. セルフレビュー
npm run obsidian:sync -- validate

# 3. コミット & PR
git add .
git commit -m "docs: Add new documentation"
git push origin feature/#123-new-doc

# 4. PRマージ後、developにチェックアウト
git checkout develop
git pull origin develop

# ⚡ post-mergeフックが自動実行され、バックリンクが更新される
```

## リンク形式

### 標準Markdownリンク（推奨）

```markdown
[テキスト](path/to/file.md)
[セクションへのリンク](path/to/file.md#section)
```

**メリット**:

- Git diff が読みやすい
- GitHub、VS Code、その他のツールで正しく動作
- 相対パスでプロジェクト構造が明確

### Wikiリンク（非推奨）

```markdown
[[file]]
[[file#section]]
```

**注意**: このプロジェクトでは標準Markdownリンクを使用しています。Wikiリンクは `.obsidian/app.json` で無効化されています。

## バックリンクセクション

### 自動生成される形式

各Markdownファイルの末尾に以下のようなセクションが自動生成されます：

```markdown
## Linked from

<!-- このセクションは自動生成されます。手動で編集しないでください。 -->

- [ARCHITECTURE](../02-design/ARCHITECTURE.md)
- [PATTERNS](../03-implementation/PATTERNS.md)
- [TESTING](../07-quality/TESTING.md)
```

### 注意事項

- このセクションは自動生成されるため、**手動で編集しないでください**
- マージ時に自動的に更新されます
- 既存のセクションがある場合は置換されます

## 推奨プラグイン

### Dataview

複雑なクエリでドキュメントを検索・集計できます。

**インストール**:

1. Settings → Community plugins → Browse
2. "Dataview" を検索してインストール

**使用例**:

```dataview
table status, owner, updated
from ""
where status = "review"
sort updated desc
```

### Obsidian Git

Obsidian内でGit操作ができます（オプション）。

**注意**: このプロジェクトではHuskyフックで自動化しているため、必須ではありません。

## トラブルシューティング

### バックリンクが更新されない

**原因**: MCPサーバーがビルドされていない

**解決策**:

```bash
cd mcp
npm install
npm run build
```

### リンク検証でエラーが出る

**原因**: 相対パスが間違っている、またはファイルが存在しない

**解決策**:

```bash
npm run obsidian:sync -- validate
```

エラーメッセージを確認し、リンクを修正してください。

### post-mergeフックが実行されない

**原因**: Huskyが正しく設定されていない

**解決策**:

```bash
npm run obsidian:setup
chmod +x .husky/post-merge
```

### Obsidianでリンクが機能しない

**原因**: Wikiリンク形式を使用している

**解決策**: 標準Markdownリンク形式（`[text](path.md)`）を使用してください。

## ベストプラクティス

### 1. 定期的なリンク検証

PRを作成する前に必ずリンク検証を実行：

```bash
npm run obsidian:sync -- validate
```

### 2. 孤立ファイルの確認

月に1回、孤立ファイルをチェック：

```bash
npm run obsidian:sync -- orphaned
```

孤立ファイルが見つかったら：

- 適切な場所からリンクする
- 不要な場合は削除を検討

### 3. バックリンクの活用

- バックリンクセクションで影響範囲を把握
- ドキュメント削除前にバックリンクを確認
- グラフビューで全体構造を理解

### 4. 意味のあるリンクテキスト

❌ 悪い例:

```markdown
詳細は[こちら](ARCHITECTURE.md)を参照
```

✅ 良い例:

```markdown
詳細は[アーキテクチャ設計](ARCHITECTURE.md)を参照
```

### 5. セクションアンカーの活用

長いドキュメントでは、セクションへの直接リンクを使用：

```markdown
[エラーハンドリング戦略](PATTERNS.md#error-handling)を参照
```

## MCP ツールの使用

AIエージェント（Claude, GitHub Copilot）からMCPツールを使用できます：

### `backlinks` ツール

指定ファイルへのバックリンクを取得：

```json
{
  "tool": "backlinks",
  "arguments": {
    "file": "docs-template/02-design/ARCHITECTURE.md"
  }
}
```

### `validate_links` ツール

全ドキュメントのリンク検証：

```json
{
  "tool": "validate_links",
  "arguments": {}
}
```

### `orphaned_files` ツール

孤立ファイルの検出：

```json
{
  "tool": "orphaned_files",
  "arguments": {}
}
```

## 参考リンク

- [Obsidian公式ドキュメント](https://help.obsidian.md/)
- [Markdown記法ガイド](https://www.markdownguide.org/)
- [Git Workflow](../05-operations/deployment/git-workflow.md)

---

## 更新履歴

| 日付       | バージョン | 変更内容 |
| ---------- | ---------- | -------- |
| 2026-02-12 | 1.0.0      | 初版作成 |
