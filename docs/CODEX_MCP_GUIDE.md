---
id: codex-mcp-guide
title: VS Code Codex拡張とMCPツール連携ガイド
version: 1.0.0
status: active
created: 2025-01-16
updated: 2025-01-16
owner: feel-flow
phase: mvp
tags: [ai, mcp, codex, vs-code, integration, openai]
references:
  - mcp/README.md
  - docs/AI_SPEC_DRIVEN_DEVELOPMENT.md
changeImpact: medium
---

# VS Code Codex拡張とMCPツール連携ガイド

> **関連文書**:
>
> - [MCPサーバーセットアップ](../mcp/README.md) - このリポジトリのMCPサーバー
> - [AI Spec Driven Development](AI_SPEC_DRIVEN_DEVELOPMENT.md) - 仕様駆動開発の概要
>
> **注意**: この情報は2025年1月時点の調査結果です。Codexは急速に進化しているため、最新情報は[公式ドキュメント](https://developers.openai.com/codex/)を参照してください。

## 目次

- [1. 概要](#1-概要)
  - [1.1 このガイドの目的](#11-このガイドの目的)
  - [1.2 対象読者](#12-対象読者)
  - [1.3 前提条件](#13-前提条件)
- [2. VS Code Codex拡張の基礎](#2-vs-code-codex拡張の基礎)
  - [2.1 Codex拡張とは](#21-codex拡張とは)
  - [2.2 インストール方法](#22-インストール方法)
  - [2.3 基本的なUI操作](#23-基本的なui操作)
  - [2.4 Auto context機能](#24-auto-context機能)
- [3. Codex MCPの設定](#3-codex-mcpの設定)
  - [3.1 MCPサーバーとは](#31-mcpサーバーとは)
  - [3.2 設定方法](#32-設定方法)
  - [3.3 config.tomlの構成](#33-configtomlの構成)
  - [3.4 推奨MCPサーバー](#34-推奨mcpサーバー)
- [4. ユースケース別デモ](#4-ユースケース別デモ)
  - [4.1 基本的なコード生成](#41-基本的なコード生成)
  - [4.2 ドキュメント検索との連携](#42-ドキュメント検索との連携)
  - [4.3 マルチツール活用パターン](#43-マルチツール活用パターン)
- [5. 実践パターン](#5-実践パターン)
  - [5.1 Claude Code vs Codex の使い分け](#51-claude-code-vs-codex-の使い分け)
  - [5.2 タスク委譲のベストプラクティス](#52-タスク委譲のベストプラクティス)
  - [5.3 セキュリティ考慮事項](#53-セキュリティ考慮事項)
- [6. トラブルシューティング](#6-トラブルシューティング)
- [7. 関連リソース](#7-関連リソース)

---

## 1. 概要

### 1.1 このガイドの目的

本ガイドでは、OpenAIが提供するVS Code Codex拡張とModel Context Protocol（MCP）の連携方法を解説します。特に以下を習得できます：

- VS Code Codex拡張の基本操作
- MCPサーバーの設定方法
- 複数AIツールを組み合わせた開発ワークフロー

### 1.2 対象読者

- VS CodeでAI支援開発を行いたい開発者
- 複数のAIツール（Claude Code、Codexなど）を使い分けたい方
- MCPを活用して開発効率を向上させたい方

### 1.3 前提条件

- VS Code がインストール済み
- Node.js v18以上がインストール済み
- OpenAIアカウントを持っている

---

## 2. VS Code Codex拡張の基礎

### 2.1 Codex拡張とは

OpenAI Codex VS Code拡張は、VS Code内でCodex CLIの機能を利用できる公式拡張機能です。

**主な特徴**:

- サイドバーに専用「Codex」パネル
- 自然言語でコード生成・編集を指示
- **Auto context**機能でコードコンテキストを自動取得
- タスク履歴の保存・再利用
- ローカル環境での安全な実行

### 2.2 インストール方法

1. VS Codeの拡張機能マーケットプレイスを開く
2. 「OpenAI Codex」を検索
3. インストールボタンをクリック
4. VS Codeを再起動
5. サイドバーにCodexアイコンが表示される

**CLIも併用する場合**:

```bash
# Codex CLIのインストール
npm install -g @openai/codex

# バージョン確認
codex --version
```

### 2.3 基本的なUI操作

Codex拡張のUIは以下の要素で構成されています：

| 要素                 | 説明                                              |
| -------------------- | ------------------------------------------------- |
| **Tasks**            | 過去に実行したタスクの履歴                        |
| **プロンプト入力欄** | 「Ask Codex to do anything」                      |
| **Auto context**     | 現在のファイル/選択範囲を自動でコンテキストに追加 |
| **Local / Cloud**    | 実行環境の選択                                    |
| **設定アイコン**     | MCP設定、config.tomlへのアクセス                  |

### 2.4 Auto context機能

Auto context機能は、Codexが適切なコンテキストを自動で収集します：

- **現在開いているファイル**: エディタでアクティブなファイル
- **選択範囲**: ハイライトしているコード
- **プロジェクト構造**: ディレクトリ構成、package.jsonなど
- **Git履歴**: 最近の変更履歴

```
[+] ボタン: 手動でファイルを追加
[/] ボタン: コマンドパレット
[Auto context] トグル: 自動コンテキスト収集のON/OFF
```

---

## 3. Codex MCPの設定

### 3.1 MCPサーバーとは

Model Context Protocol（MCP）は、AIツールに外部ツールやコンテキストへのアクセスを提供する標準プロトコルです。

**対応するサーバータイプ**:

| タイプ              | 説明                         | 例                   |
| ------------------- | ---------------------------- | -------------------- |
| **STDIO**           | ローカルプロセスとして起動   | Context7, Playwright |
| **Streamable HTTP** | HTTPエンドポイントにアクセス | リモートAPIサーバー  |

### 3.2 設定方法

Codexでは2つの方法でMCPサーバーを設定できます：

**方法1: CLIコマンド（推奨）**

```bash
# MCPサーバーを追加
codex mcp add <サーバー名> -- <コマンド>

# 例: Context7を追加
codex mcp add context7 -- npx -y @upstash/context7-mcp

# 例: Playwrightを追加
codex mcp add playwright -- npx -y @anthropic/mcp-playwright

# 追加済みサーバーの一覧
codex mcp list

# サーバーを削除
codex mcp remove <サーバー名>
```

**方法2: config.tomlを直接編集**

1. VS Code Codex拡張の設定アイコン（歯車）をクリック
2. 「MCP settings > Open config.toml」を選択
3. 設定ファイルを編集

### 3.3 config.tomlの構成

設定ファイルは `~/.codex/config.toml` に保存されます（CLIと拡張で共有）。

**基本構造**:

```toml
# STDIOサーバーの例
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]

[mcp_servers.playwright]
command = "npx"
args = ["-y", "@anthropic/mcp-playwright"]

# 環境変数を使用する例
[mcp_servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxx" }

# HTTPサーバーの例
[mcp_servers.remote_api]
url = "https://api.example.com/mcp"
bearer_token_env_var = "API_TOKEN"

# サーバーを一時的に無効化
[mcp_servers.disabled_server]
command = "npx"
args = ["-y", "some-mcp-server"]
enabled = false
```

**設定項目リファレンス**:

| 項目                   | 説明                             | 必須 |
| ---------------------- | -------------------------------- | ---- |
| `command`              | 起動コマンド（STDIOサーバー）    | ○    |
| `args`                 | コマンド引数                     | -    |
| `env`                  | 環境変数                         | -    |
| `url`                  | サーバーアドレス（HTTPサーバー） | ○    |
| `bearer_token_env_var` | 認証トークンの環境変数名         | -    |
| `enabled`              | サーバーの有効/無効              | -    |
| `tool_timeout_sec`     | ツール実行タイムアウト           | -    |

### 3.4 推奨MCPサーバー

| サーバー       | 用途                     | コマンド                                     |
| -------------- | ------------------------ | -------------------------------------------- |
| **Context7**   | 開発者ドキュメント検索   | `npx -y @upstash/context7-mcp`               |
| **Playwright** | ブラウザ自動操作         | `npx -y @anthropic/mcp-playwright`           |
| **GitHub**     | PR・Issue管理            | `npx -y @modelcontextprotocol/server-github` |
| **Figma**      | デザインファイルアクセス | `npx -y @anthropic/mcp-figma`                |
| **Sentry**     | エラーログ分析           | （要設定）                                   |

---

## 4. ユースケース別デモ

### 4.1 基本的なコード生成

**シナリオ**: TypeScriptでユーザー認証Middlewareを作成

1. Codexパネルを開く
2. プロンプトを入力：

```
Express.js用のJWT認証Middlewareを作成してください。
- リクエストヘッダーからBearerトークンを取得
- トークンの検証とデコード
- 無効なトークンの場合は401エラー
- TypeScriptで型安全に実装
```

3. Auto contextがプロジェクトの既存コードを自動で参照
4. 生成されたコードを確認・適用

### 4.2 ドキュメント検索との連携

**シナリオ**: Context7 MCPを使ってライブラリドキュメントを検索

1. Context7 MCPを設定済みであることを確認
2. プロンプトを入力：

```
Context7を使ってNext.js 14のApp Routerのドキュメントを検索し、
動的ルーティングの実装方法を教えてください。
```

3. Codexが自動でContext7 MCPを呼び出し
4. 最新のドキュメントに基づいた回答を生成

### 4.3 マルチツール活用パターン

**シナリオ**: Claude CodeとCodexの連携

このリポジトリでは、Claude Code内からCodex MCPを呼び出すことができます：

```
# Claude Code内での呼び出し例
mcp__codex__codex({
  prompt: "現在のブランチの変更をレビューしてください",
  cwd: "/path/to/project",
  sandbox: "read-only",
  "approval-policy": "never"
})
```

**活用パターン**:

| パターン                  | Claude Code    | Codex              |
| ------------------------- | -------------- | ------------------ |
| **コード生成 → レビュー** | 実装を生成     | レビュー・改善提案 |
| **レビュー → 修正**       | 修正を実行     | 変更点をレビュー   |
| **ドキュメント → 実装**   | 仕様を読み取り | コードを生成       |

---

## 5. 実践パターン

### 5.1 Claude Code vs Codex の使い分け

| 観点             | Claude Code            | Codex                  |
| ---------------- | ---------------------- | ---------------------- |
| **提供元**       | Anthropic              | OpenAI                 |
| **実行環境**     | CLI / VS Code拡張      | CLI / VS Code拡張      |
| **設定ファイル** | CLAUDE.md, plugin.json | AGENTS.md, config.toml |
| **MCP設定場所**  | .mcp.json              | ~/.codex/config.toml   |
| **強み**         | 長文コンテキスト処理   | コード生成・補完       |
| **課金体系**     | サブスクリプション     | 従量課金               |

**使い分けの指針**:

- **設計・レビュー**: Claude Codeが得意（長文理解、複雑な分析）
- **コード生成・補完**: Codexが得意（GPT系の強み）
- **両方を組み合わせ**: MCPで連携して相互補完

### 5.2 タスク委譲のベストプラクティス

1. **明確なプロンプト設計**
   - 期待する出力形式を明示
   - 制約条件を具体的に記述

2. **コンテキストの適切な提供**
   - Auto contextを活用
   - 必要に応じて手動でファイルを追加

3. **段階的な実行**
   - 大きなタスクは小さく分割
   - 各ステップで結果を確認

### 5.3 セキュリティ考慮事項

**注意すべきポイント**:

| リスク           | 対策                            |
| ---------------- | ------------------------------- |
| APIキーの漏洩    | 環境変数で管理、.envをgitignore |
| 機密コードの送信 | sandbox設定でread-onlyを使用    |
| 不正なコード実行 | approval-policyを適切に設定     |

**sandbox設定**:

```toml
# 読み取り専用（最も安全）
sandbox = "read-only"

# ワークスペースへの書き込み許可
sandbox = "workspace-write"

# 完全なアクセス（注意が必要）
sandbox = "danger-full-access"
```

**approval-policy設定**:

```toml
# すべてのコマンドに承認を要求
approval-policy = "untrusted"

# 失敗時のみ承認を要求
approval-policy = "on-failure"

# リクエスト時のみ承認を要求
approval-policy = "on-request"

# 承認不要（自動実行）
approval-policy = "never"
```

---

## 6. トラブルシューティング

### MCPサーバーが検出されない

**症状**: VS Code拡張でMCPサーバーが表示されない

**対処法**:

1. `~/.codex/config.toml` の構文エラーを確認
2. VS Codeを再起動
3. CLIで動作確認: `codex mcp list`

```bash
# CLIで直接テスト
codex mcp test <サーバー名>
```

### 認証エラー

**症状**: MCPサーバー接続時に認証エラー

**対処法**:

1. 環境変数が正しく設定されているか確認
2. トークンの有効期限を確認

```bash
# 環境変数の確認
echo $GITHUB_PERSONAL_ACCESS_TOKEN
```

### タイムアウトエラー

**症状**: MCPツールの実行がタイムアウト

**対処法**:

1. `tool_timeout_sec` を増やす
2. ネットワーク接続を確認

```toml
[mcp_servers.slow_server]
command = "npx"
args = ["-y", "some-slow-mcp-server"]
tool_timeout_sec = 120  # 2分に延長
```

---

## 7. 関連リソース

### 公式ドキュメント

- [OpenAI Codex公式ドキュメント](https://developers.openai.com/codex/)
- [Codex IDE拡張機能](https://developers.openai.com/codex/ide/)
- [Codex MCP設定ガイド](https://developers.openai.com/codex/mcp/)
- [Codex Changelog](https://developers.openai.com/codex/changelog/)

### このリポジトリの関連ドキュメント

- [MCPサーバーセットアップ](../mcp/README.md) - AI Spec-Driven Development MCPサーバー

### コミュニティリソース

- [OpenAI Codex GitHub Issues](https://github.com/openai/codex/issues)
- [OpenAI Developer Community](https://community.openai.com/)

---

## 更新履歴

| 日付       | バージョン | 変更内容 |
| ---------- | ---------- | -------- |
| 2025-01-16 | 1.0.0      | 初版作成 |
