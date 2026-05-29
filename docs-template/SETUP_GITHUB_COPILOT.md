# GitHub Copilot セットアップガイド（索引版）

## 概要

このガイドでは、GitHub CopilotをAI仕様駆動開発で使うための初期設定を説明します。

**推奨所要時間**: 合計30分

**対象者**:

- GitHub Copilotを初めて使う開発者
- AI仕様駆動開発に興味がある開発者
- プロジェクト固有のAI指示を設定したい開発者

---

## 前提条件

- GitHubアカウント（必須）
- Visual Studio Code（必須）
- GitHub Copilotサブスクリプション（個人: $10/月、Business: $19/月）
- プロジェクトの`docs-template/MASTER.md`を作成済み（推奨）

---

## クイックスタート（6ステップ）

### STEP 1: インストール

**所要時間**: 15分

GitHub Copilotのサブスクリプション購入とVS Code拡張機能のインストール

**実施内容**:

- GitHub Copilotサブスクリプション購入
- VS Code拡張機能インストール
- GitHubアカウント連携

**詳細ガイド**: [setup-guides/github-copilot/installation.md](./setup-guides/github-copilot/installation.md)

---

### STEP 2: copilot-instructions.md設定

**所要時間**: 5-10分

`.github/copilot-instructions.md`の作成 - AIプロンプトで自動生成（推奨）

**実施内容**:

- `.github`ディレクトリ作成
- AIプロンプトでcopilot-instructions.md生成
- MASTER.mdの内容統合

**詳細ガイド**: [setup-guides/github-copilot/copilot-instructions.md](./setup-guides/github-copilot/copilot-instructions.md)

---

### STEP 3: VS Code設定

**所要時間**: 5分

エディタ設定のカスタマイズ

**実施内容**:

- `.vscode/settings.json`の作成・編集
- 言語別の有効/無効設定
- Copilot Chat設定

**詳細ガイド**: [setup-guides/github-copilot/configuration.md](./setup-guides/github-copilot/configuration.md)

---

### STEP 4: 動作確認

**所要時間**: 5分

基本的なコード補完とCopilot Chatのテスト

**実施内容**:

- コード補完の動作確認
- Copilot Chatの動作確認
- MASTER.mdルール反映確認

**詳細ガイド**: [setup-guides/github-copilot/03-usage-and-troubleshooting.md#step-4-動作確認5分](./setup-guides/github-copilot/03-usage-and-troubleshooting.md#step-4-動作確認5分)

---

### STEP 5: 効果的な使い方

**所要時間**: 5分（学習）

ベストプラクティスの確認

**実施内容**:

- コメント駆動開発の理解
- Copilot Chatの活用法
- 効果的なプロンプトの書き方

**詳細ガイド**: [setup-guides/github-copilot/03-usage-and-troubleshooting.md](./setup-guides/github-copilot/03-usage-and-troubleshooting.md)

---

### STEP 6: チーム共有

**所要時間**: 5分

設定ファイルのリポジトリへのコミット

**実施内容**:

- `.github/copilot-instructions.md`をコミット
- `.vscode/settings.json`をチーム共有（オプション）
- チームメンバーへの展開

**詳細ガイド**: [setup-guides/github-copilot/03-usage-and-troubleshooting.md#step-6-チーム共有5分](./setup-guides/github-copilot/03-usage-and-troubleshooting.md#step-6-チーム共有5分)

---

## セットアップ完了チェックリスト

- [ ] **STEP 1**: GitHub Copilotをインストール
- [ ] **STEP 2**: `.github/copilot-instructions.md`を作成
- [ ] **STEP 3**: VS Code設定を完了
- [ ] **STEP 4**: 動作確認とテスト
- [ ] **STEP 5**: ベストプラクティスを確認
- [ ] **STEP 6**: チームメンバーと共有

---

## クイックリファレンス

### 主要なショートカット

| 操作           | macOS             | Windows/Linux      |
| -------------- | ----------------- | ------------------ |
| Copilot Chat   | `Cmd + I`         | `Ctrl + I`         |
| 拡張機能       | `Cmd + Shift + X` | `Ctrl + Shift + X` |
| 候補を受け入れ | `Tab`             | `Tab`              |
| 次の候補       | `Option + ]`      | `Alt + ]`          |
| 前の候補       | `Option + [`      | `Alt + [`          |

### 主要なコマンド

```bash
# プロジェクトディレクトリの作成
mkdir -p .github

# AIで生成したcopilot-instructions.mdを保存
# (生成方法は setup-guides/github-copilot/copilot-instructions.md を参照)

# チーム共有のためのコミット
git add .github/copilot-instructions.md
git commit -m "chore: Add GitHub Copilot instructions"
git push
```

---

## トラブルシューティング

### よくある問題

| 問題                          | 原因候補                      | 解決方法                              |
| ----------------------------- | ----------------------------- | ------------------------------------- |
| Copilotが提案しない           | 連携エラー                    | GitHubアカウント連携を確認            |
|                               | サブスクリプション切れ        | サブスクリプション状態を確認          |
|                               | 拡張機能エラー                | VS Code再起動、拡張機能再インストール |
| MASTER.mdルールが反映されない | copilot-instructions.md未作成 | STEP 2を実施                          |
|                               | プロンプト不足                | Copilot Chatで明示的に指示            |
|                               | キャッシュ問題                | VS Code再起動                         |

**詳細ガイド**: [setup-guides/github-copilot/03-usage-and-troubleshooting.md#トラブルシューティング](./setup-guides/github-copilot/03-usage-and-troubleshooting.md#トラブルシューティング)

---

## 主要ファイル構成

セットアップ後のファイル構成：

```
your-project/
├── .github/
│   ├── copilot-instructions.md     # GitHub Copilot用の指示ファイル（必須）
│   └── .copilotignore              # (オプション) 学習除外ファイル
├── .vscode/
│   └── settings.json               # VS Code設定（推奨）
└── docs-template/
    └── MASTER.md                   # プロジェクト全体のルール（参照元）
```

---

## 詳細ガイド一覧

各ステップの詳細は以下のドキュメントを参照してください：

### 1. インストール

**ファイル**: [setup-guides/github-copilot/installation.md](./setup-guides/github-copilot/installation.md)

**内容**:

- サブスクリプション購入手順
- VS Code拡張機能のインストール
- GitHubアカウントとの連携

---

### 2. Copilot Instructions設定

**ファイル**: [setup-guides/github-copilot/copilot-instructions.md](./setup-guides/github-copilot/copilot-instructions.md)

**内容**:

- `.github/copilot-instructions.md`の作成方法
- AIプロンプトでの自動生成（推奨）
- MASTER.md統合
- プロジェクト固有のカスタマイズ
- テンプレート例

---

### 3. VS Code設定

**ファイル**: [setup-guides/github-copilot/configuration.md](./setup-guides/github-copilot/configuration.md)

**内容**:

- VS Code設定のカスタマイズ
- 言語ごとの有効/無効設定
- 動作確認とテスト
- 設定ファイル例

---

### 4. ベストプラクティス

**ファイル**: [setup-guides/github-copilot/03-usage-and-troubleshooting.md](./setup-guides/github-copilot/03-usage-and-troubleshooting.md)

**内容**:

- 効果的な使い方
- コメント駆動開発
- Copilot Chatの活用
- チーム開発での共有
- トラブルシューティング詳細

---

## 参考リンク

### 公式ドキュメント

- [GitHub Copilot公式ドキュメント](https://docs.github.com/ja/copilot)
- [GitHub Copilot Chat](https://docs.github.com/ja/copilot/github-copilot-chat)
- [VS Code拡張機能](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)

### 関連ドキュメント（本プロジェクト）

- [MASTER.md](./MASTER.md) - プロジェクト全体のルール
- [PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン
- [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) - プロジェクト開始ガイド

---

## 次のステップ

セットアップ完了後は、以下のドキュメントも参照してください：

### 他のAIツールのセットアップ

- [SETUP_CLAUDE_CODE.md](./SETUP_CLAUDE_CODE.md) - Claude Code セットアップ
- [SETUP_CURSOR.md](./SETUP_CURSOR.md) - Cursor セットアップ

### プロジェクト開発開始

- [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) - プロジェクト開始ガイド
- [05-operations/DEPLOYMENT.md](./05-operations/DEPLOYMENT.md) - AI駆動Git Workflow
- [ACE サイクル運用手順](./05-operations/deployment/ace-cycle.md) - マージ後の知見体系化。エントリ ID は **PRスコープ式** `ACE-<PR番号>-<連番>`（採番ルールの SSOT は [エントリID規則](./08-knowledge/PLAYBOOK.md#エントリid規則)）

---

**セットアップ完了おめでとうございます！**

GitHub Copilotを使って、効率的なAI駆動開発を楽しんでください！

---

## 更新履歴

| 日付       | バージョン | 変更内容                                     |
| ---------- | ---------- | -------------------------------------------- |
| 2025-11-05 | 2.0.0      | 索引版として簡潔化、詳細ガイドへのリンク追加 |
