#!/bin/bash

# ============================================================================
# AI CLI 自動コードレビュー セットアップスクリプト
# ============================================================================
#
# 概要:
#   レビューフレームワーク（共通基盤 + 各 CLI アダプタ + Codex toolkit シム）
#   を使った自動コードレビュー環境を設定します。
#   pre-commit hookでAI CLIがコードをレビューし、問題があればコミットをブロックします。
#
# 対応AI CLI:
#   - Claude Code (claude)       — Premium tier
#   - Codex CLI (codex)          — Standard tier
#   - Copilot CLI (copilot)      — Metered（従量課金。pre-commit 自動選択からは除外、オプトインのみ）
#   - Gemini CLI (gemini)        — Free tier
#   - Cursor Agent (cursor-agent) — Flat-rate tier
#
# 対応環境:
#   - macOS
#   - Linux
#   - Windows (Git Bash / WSL)
#
# 前提条件:
#   - Git リポジトリ内で実行
#   - Node.js >= 18.0.0 (npm使用時)
#   - 1つ以上のAI CLIがインストール済み
#
# 使い方:
#   bash setup-automated-review.sh [オプション]
#
# オプション:
#   --no-npm      npmを使用せず、手動でHuskyをセットアップする場合
#   --help        ヘルプを表示
#
# ============================================================================

set -euo pipefail

# Inform user on unexpected failure (script is idempotent, safe to re-run)
trap 'echo ""; echo -e "\033[0;31m  ✗ セットアップが途中で失敗しました\033[0m"; echo "    エラーを修正してからスクリプトを再実行してください（冪等なので安全に再実行可能）"' ERR

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors (ANSI escape codes - 主要な端末で動作)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

# Configuration
NO_NPM=false
TOTAL_STEPS=6

# Review framework files (relative to scripts/)
REVIEW_FRAMEWORK_FILES=(
    "review-common.sh"
    "review-prompts.sh"
)

REVIEW_CLI_ADAPTERS=(
    "claude-review.sh"
    "codex-review.sh"
    "copilot-review.sh"
    "gemini-review.sh"
    "cursor-review.sh"
)

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "  AI CLI 自動コードレビュー セットアップ"
    echo "  (Claude / Codex / Copilot / Gemini / Cursor)"
    echo "============================================================"
    echo -e "${NC}"
}

print_step() {
    local step=$1
    local message=$2
    echo ""
    echo -e "${BLUE}[${step}/${TOTAL_STEPS}] ${message}${NC}"
}

print_success() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

print_info() {
    echo -e "  $1"
}

show_help() {
    cat << 'EOF'
使い方: bash setup-automated-review.sh [オプション]

AI CLI を使った自動コードレビューをセットアップします。
5つのAI CLI（Claude/Codex/Copilot/Gemini/Cursor）に対応した
新レビューフレームワーク（Strategy パターン）を導入します。

オプション:
  --no-npm      npmを使用しない（手動セットアップ）
  --help        このヘルプを表示

前提条件:
  - Git リポジトリ内で実行すること
  - 1つ以上のAI CLIがインストールされていること
  - Node.js >= 18.0.0 (--no-npm を指定しない場合)

配置されるファイル:
  scripts/review-common.sh       共通レビュー基盤（並列実行・結果表示）
  scripts/review-prompts.sh      5種レビュワーのプロンプト定義
  scripts/claude-review.sh       Claude Code アダプタ
  scripts/codex-review.sh        ff-dev-toolkit の Codex レビューシム
  scripts/copilot-review.sh      Copilot CLI アダプタ
  scripts/gemini-review.sh       Gemini CLI アダプタ
  scripts/cursor-review.sh       Cursor Agent アダプタ
  .husky/pre-commit              Git pre-commit hook
  .claude/commands/code-review.md  スラッシュコマンド定義

詳細: docs-template/05-operations/deployment/automated-code-review.md
EOF
}

# ── Step 1: Prerequisites ──

check_prerequisites() {
    print_step 1 "前提条件を確認中..."

    # Check if in git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Git リポジトリ内で実行してください"
        exit 1
    fi
    print_success "Git リポジトリ: OK"

    # Check Node.js (if npm mode)
    if [ "$NO_NPM" = false ]; then
        if command -v node > /dev/null 2>&1; then
            local node_version
            node_version=$(node -v | sed 's/v//' | cut -d. -f1)
            if [ "$node_version" -ge 18 ]; then
                print_success "Node.js: $(node -v)"
            else
                print_warning "Node.js バージョンが古い (>= 18推奨): $(node -v)"
            fi
        else
            print_warning "Node.js が見つかりません（手動セットアップが必要）"
            NO_NPM=true
        fi

        if command -v npm > /dev/null 2>&1; then
            print_success "npm: $(npm -v)"
        else
            print_warning "npm が見つかりません"
            NO_NPM=true
        fi
    fi

    # Check AI CLIs
    local found=0
    local clis="Claude Code:claude
Codex CLI:codex
Copilot CLI:copilot
Gemini CLI:gemini
Cursor Agent:cursor-agent"

    while IFS=: read -r name cmd; do
        if command -v "$cmd" > /dev/null 2>&1; then
            print_success "$name ($cmd): インストール済み"
            found=$((found + 1))
        fi
    done <<< "$clis"

    if [ "$found" -eq 0 ]; then
        print_error "AI CLI が1つもインストールされていません。セットアップを中止します。"
        echo -e "    ${RED}→ 以下のいずれかをインストールしてから再実行してください:${NC}"
        echo "      Claude Code:  npm install -g @anthropic-ai/claude-code"
        echo "      Codex CLI:    npm install -g @openai/codex"
        echo "      Copilot CLI:  gh extension install github/gh-copilot"
        echo "      Gemini CLI:   npm install -g @google/gemini-cli"
        echo "      Cursor Agent: https://docs.cursor.com/cli"
        exit 1
    else
        print_success "${found}/5 の AI CLI が利用可能です"
    fi
}

# ── Step 2: Verify Review Framework ──

verify_review_framework() {
    print_step 2 "レビューフレームワークを確認中..."

    local missing=false

    # Check shared framework files
    for file in "${REVIEW_FRAMEWORK_FILES[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            print_success "$file: OK"
        else
            print_error "$file が見つかりません"
            missing=true
        fi
    done

    # Check CLI adapter scripts
    for file in "${REVIEW_CLI_ADAPTERS[@]}"; do
        if [ -f "$SCRIPT_DIR/$file" ]; then
            print_success "$file: OK"
        else
            print_error "$file が見つかりません"
            missing=true
        fi
    done

    if [ "$missing" = true ]; then
        print_error "レビューフレームワークのファイルが不足しています"
        echo ""
        print_info "このスクリプトは以下のファイルが scripts/ に配置されていることを前提としています:"
        print_info "  review-common.sh, review-prompts.sh"
        print_info "  claude-review.sh, codex-review.sh, copilot-review.sh"
        print_info "  gemini-review.sh, cursor-review.sh"
        echo ""
        print_info "テンプレートリポジトリからコピーしてください:"
        print_info "  https://github.com/feel-flow/ai-spec-driven-development/tree/develop/scripts"
        exit 1
    fi

    # Set execution permissions
    for file in "${REVIEW_FRAMEWORK_FILES[@]}" "${REVIEW_CLI_ADAPTERS[@]}"; do
        chmod +x "$SCRIPT_DIR/$file"
    done
    print_success "実行権限: 付与完了"
}

# ── Step 3: Create Directories ──

create_directories() {
    print_step 3 "ディレクトリを作成中..."

    mkdir -p "$REPO_ROOT/.husky"
    mkdir -p "$REPO_ROOT/.claude/commands"

    print_success "ディレクトリ作成完了"
}

# ── Step 4: Create Pre-Commit Hook ──

create_pre_commit_hook() {
    print_step 4 "pre-commit hookを作成中..."

    if [ -f "$REPO_ROOT/.husky/pre-commit" ]; then
        cp "$REPO_ROOT/.husky/pre-commit" "$REPO_ROOT/.husky/pre-commit.backup"
        print_warning "既存の .husky/pre-commit をバックアップしました → .husky/pre-commit.backup"
    fi

    cat > "$REPO_ROOT/.husky/pre-commit" << 'PRE_COMMIT'
#!/bin/sh

# ============================================================================
# Husky Pre-Commit Hook
# AI CLI による自動コードレビューを実行
# ============================================================================

# Skip if environment variable is set (legacy name preserved for backward compatibility)
if [ "${SKIP_CLAUDE_REVIEW:-0}" = "1" ] || [ "${SKIP_AI_REVIEW:-0}" = "1" ]; then
    echo "Skipping AI review (SKIP_CLAUDE_REVIEW or SKIP_AI_REVIEW is set)"
    exit 0
fi

# Skip for merge commits
if [ -f ".git/MERGE_HEAD" ]; then
    echo "Merge commit detected - skipping AI review"
    exit 0
fi

# Skip during rebase
if [ -d ".git/rebase-merge" ] || [ -d ".git/rebase-apply" ]; then
    echo "Rebase in progress - skipping AI review"
    exit 0
fi

# Get project root
PROJECT_ROOT="$(git rev-parse --show-toplevel)"

# Run the first available AI CLI review script (check CLI binary, not just file)
# Priority: Claude > Codex > Gemini > Cursor
# (Copilot CLI is metered — excluded from auto-selection. Opt in: bash scripts/copilot-review.sh)
CLI_ENTRIES="claude:claude-review.sh codex:codex-review.sh gemini:gemini-review.sh cursor-agent:cursor-review.sh"

for entry in $CLI_ENTRIES; do
    cmd="${entry%%:*}"
    script="${entry##*:}"

    if command -v "$cmd" >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/scripts/$script" ]; then
        "$PROJECT_ROOT/scripts/$script" --staged
        exit_code=$?

        if [ $exit_code -ne 0 ]; then
            echo ""
            echo "Commit blocked by AI code review."
            echo "Fix the issues above or use 'git commit --no-verify' to skip."
            exit 1
        fi
        exit 0
    fi
done

echo "Warning: No AI CLI found. Install one of: claude, codex, gemini, cursor-agent (copilot is metered - opt in: bash scripts/copilot-review.sh)"
echo "To skip review: git commit --no-verify"
exit 0
PRE_COMMIT

    chmod +x "$REPO_ROOT/.husky/pre-commit"
    print_success ".husky/pre-commit 作成完了"
}

# ── Step 5: Create Claude Code Command ──

create_claude_command() {
    print_step 5 "Claude Code コマンドを作成中..."

    cat > "$REPO_ROOT/.claude/commands/code-review.md" << 'COMMAND'
# Code Review

Perform a comprehensive code review using 5 specialized AI reviewers in parallel.

## Instructions

You are a code review orchestrator. Execute the review script and analyze results.

### Step 1: Run Review

Run the automated review script:
```bash
bash scripts/claude-review.sh --branch
```

This executes 5 specialized reviewers in parallel:
- **code-reviewer**: Security, bugs, logic errors, resource leaks
- **silent-failure-hunter**: Empty catch blocks, swallowed errors, dangerous fallbacks
- **type-design-analyzer**: Type safety, any usage, missing return types
- **comment-analyzer**: Outdated comments, documentation drift
- **pr-test-analyzer**: Missing tests, weakened assertions, edge cases

### Step 2: Analyze Results

Review the output table and detailed findings:
- **PASS**: No critical or important issues found
- **FAIL**: Issues require attention before proceeding
- **TIMEOUT**: Reviewer timed out (consider reducing diff size)
- **ERROR**: Reviewer encountered an error

### Step 3: Recommend Action

Based on results:
- If all PASS: Confirm ready to commit/create PR
- If any FAIL: List specific fixes needed with file:line references
- If TIMEOUT/ERROR: Suggest re-running with `REVIEW_TIMEOUT_SEC=900`

### Alternative CLI Options

```bash
# Review staged changes only (pre-commit mode)
bash scripts/claude-review.sh --staged

# Use a different AI CLI
bash scripts/codex-review.sh --base develop
bash scripts/gemini-review.sh --branch

# Copilot CLI is metered — opt in only if you accept the cost
bash scripts/copilot-review.sh --branch
```
COMMAND

    print_success ".claude/commands/code-review.md 作成完了"
}

# ── Step 6: Setup npm Scripts ──

setup_npm_scripts() {
    print_step 6 "npm設定を更新中..."

    if [ "$NO_NPM" = true ]; then
        print_warning "npm セットアップをスキップ"
        echo ""
        echo -e "${YELLOW}手動で以下を実行してください:${NC}"
        echo ""
        echo "  1. package.json に scripts を追加:"
        echo '     "prepare": "husky"'
        echo '     "code-review": "bash scripts/claude-review.sh --staged"'
        echo '     "code-review:branch": "bash scripts/claude-review.sh --branch"'
        echo ""
        echo "  2. Husky をインストール:"
        echo "     npm install --save-dev husky"
        echo ""
        return
    fi

    # Check if package.json exists
    if [ ! -f "$REPO_ROOT/package.json" ]; then
        echo '{"name": "project", "private": true}' > "$REPO_ROOT/package.json"
    fi

    # Try to update package.json with jq if available
    if command -v jq > /dev/null 2>&1; then
        if jq '.scripts = (.scripts // {}) + {
            "prepare": "husky",
            "code-review": "bash scripts/claude-review.sh --staged",
            "code-review:branch": "bash scripts/claude-review.sh --branch",
            "code-review:codex": "bash scripts/codex-review.sh --base develop",
            "code-review:copilot": "bash scripts/copilot-review.sh --branch",
            "code-review:gemini": "bash scripts/gemini-review.sh --branch",
            "code-review:cursor": "bash scripts/cursor-review.sh --branch"
        } | .devDependencies = (.devDependencies // {}) + {
            "husky": "^9.1.7"
        }' "$REPO_ROOT/package.json" > "$REPO_ROOT/package.json.tmp"; then
            mv "$REPO_ROOT/package.json.tmp" "$REPO_ROOT/package.json"
            print_success "package.json 更新完了"
        else
            rm -f "$REPO_ROOT/package.json.tmp"
            print_warning "package.json の自動更新に失敗しました（JSONが不正な可能性）"
            echo -e "${YELLOW}  手動で以下を追加してください:${NC}"
            echo '    "code-review": "bash scripts/claude-review.sh --staged"'
            echo '    "code-review:branch": "bash scripts/claude-review.sh --branch"'
        fi
    else
        print_warning "jq が見つかりません。package.json を手動で更新してください"
        echo ""
        echo -e "${YELLOW}  追加する scripts:${NC}"
        echo '    "prepare": "husky"'
        echo '    "code-review": "bash scripts/claude-review.sh --staged"'
        echo '    "code-review:branch": "bash scripts/claude-review.sh --branch"'
        echo ""
    fi

    # Install husky
    if command -v npm > /dev/null 2>&1; then
        echo ""
        echo -e "${BLUE}  Installing husky...${NC}"
        (cd "$REPO_ROOT" && npm install --save-dev husky@^9.1.7) || {
            print_warning "npm install 失敗。手動で実行: npm install"
        }
    fi

    print_success "セットアップ完了"
}

# ── Summary ──

print_summary() {
    echo ""
    echo -e "${CYAN}${BOLD}"
    echo "============================================================"
    echo "                 セットアップ完了!"
    echo "============================================================"
    echo -e "${NC}"
    echo ""
    echo -e "${GREEN}レビューフレームワーク:${NC}"
    echo "  scripts/review-common.sh       共通基盤（並列実行・結果表示）"
    echo "  scripts/review-prompts.sh      5種レビュワーのプロンプト定義"
    echo ""
    echo -e "${GREEN}CLIアダプタ:${NC}"
    echo "  scripts/claude-review.sh       Claude Code"
    echo "  scripts/codex-review.sh        Codex CLI（ff-dev-toolkit へ委譲）"
    echo "  scripts/copilot-review.sh      Copilot CLI（従量課金・オプトイン）"
    echo "  scripts/gemini-review.sh       Gemini CLI"
    echo "  scripts/cursor-review.sh       Cursor Agent"
    echo ""
    echo -e "${GREEN}フック・コマンド:${NC}"
    echo "  .husky/pre-commit              自動レビュー実行"
    echo "  .claude/commands/code-review.md  /code-review コマンド"
    echo ""
    echo -e "${GREEN}使い方:${NC}"
    echo "  git commit                     # pre-commit で自動レビュー"
    echo "  /code-review                   # Claude Code 内で手動レビュー"
    echo "  npm run code-review            # ステージ済み変更をレビュー"
    echo "  npm run code-review:branch     # ブランチ全体をレビュー"
    echo "  npm run code-review:codex      # Codex CLI でレビュー"
    echo "  npm run code-review:copilot    # Copilot CLI でレビュー（従量課金・オプトイン）"
    echo "  npm run code-review:gemini     # Gemini CLI でレビュー"
    echo ""
    echo -e "${YELLOW}スキップ方法:${NC}"
    echo "  git commit --no-verify"
    echo "  SKIP_CLAUDE_REVIEW=1 git commit"
    echo ""
    echo -e "${CYAN}レビュワー（5種並列実行）:${NC}"
    echo "  code-reviewer           コード品質・セキュリティ・バグ"
    echo "  silent-failure-hunter   エラーハンドリング漏れ"
    echo "  type-design-analyzer    型設計の妥当性"
    echo "  comment-analyzer        コメント・ドキュメント品質"
    echo "  pr-test-analyzer        テストカバレッジ"
    echo ""
}

# ============================================================================
# Main
# ============================================================================

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-npm)
            NO_NPM=true
            shift
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run setup
print_header
check_prerequisites
verify_review_framework
create_directories
create_pre_commit_hook
create_claude_command
setup_npm_scripts
print_summary
