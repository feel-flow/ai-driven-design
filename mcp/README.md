# AI Spec-Driven Development MCP Server

This MCP server exposes the repository's AI spec-driven development documentation as:

- Resources: each Markdown file and a combined search index
- Tools: search, section extraction, glossary lookup, and docs listing
- Prompts: ADR drafting and design review

## Install

From this folder:

```bash
# macOS / zsh
npm install
```

## MCPサーバーの起動方法（日本語）

前提:
- macOS + zsh／Node.js がインストール済み
- この `mcp/` ディレクトリで操作します

1) 依存関係のインストール

```bash
npm install
```

2) 動作確認（インデックス構築のみ）

```bash
npm run check
# または
node dist/index.js --check
```

3) MCPクライアントから起動（推奨）
- このサーバーは標準入出力（stdio）で動作し、MCP対応クライアントから起動されます。
- 設定例（外部MCPサーバーの登録）:
  - Command: `node`
  - Args: `/absolute/path/to/ai-spec-driven-development/mcp/dist/index.js`
  - Working Directory: `/absolute/path/to/ai-spec-driven-development/mcp`
- 例: Claude Code (VS Code) / Claude Desktop / MCP対応クライアントで上記を登録してください。

4) 直接起動（デバッグ用途）

```bash
npm start
# または
node dist/index.js
```

- 標準入出力で待機します（HTTPサーバーではありません）。停止は Ctrl+C。
- 提供されるリソース/ツール/プロンプトの詳細は本README内の英語セクションを参照してください。

## Run (standalone check)

This server is intended to run as an MCP over stdio, launched by an MCP-capable client (e.g., Claude Desktop, VS Code MCP clients). To validate locally:

```bash
node dist/index.js --check
```

This will parse and build the in-memory index without opening stdio.

Alternatively:

```bash
npm run check
```

## Configure in an MCP client

- Command: `node /absolute/path/to/ai-spec-driven-development/mcp/dist/index.js`
- Working directory: repository root or `mcp/`

The server will expose:

- Resources: `file://...` markdown files and `mcp://ai-spec-driven-development/index`
- Tools:
  - `search({ query, limit })`
  - `extract_section({ file, heading })`
  - `glossary_lookup({ term })`
  - `list_docs({ prefix? })`
- Prompts: `adr`, `design_review`

### Claude Code (VS Code)

- Add an external MCP server in the extension settings:
  - Command: `node`
  - Args: `/absolute/path/to/ai-spec-driven-development/mcp/dist/index.js`
  - Working Directory: `/absolute/path/to/ai-spec-driven-development/mcp`
- Open this repository and verify Prompts/Tools/Resources are listed.

### GitHub Copilot

- If your Copilot environment supports MCP directly or via a bridge, register the same command.
- Example interactions:
  - Use `search` tool to find relevant design docs.
  - Use `extract_section` to pull a specific `##` section from a markdown file.

### OpenAI Codex

- Codex VS Code拡張でもMCPサーバーを利用できます
- 設定方法の詳細は [Codex MCP連携ガイド](../docs/CODEX_MCP_GUIDE.md) を参照してください
- Codexの設定は `~/.codex/config.toml` で管理されます

## Notes

- Glossary is parsed from `docs-template/06-reference/GLOSSARY.md` if present.
- Section extraction matches exact level-2 headings (`## Heading`).
- Search is a basic keyword match with simple scoring.
