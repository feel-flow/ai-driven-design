#!/bin/bash
# Codex CLI Automated Review Script
# Runs specialized reviewers in parallel using codex exec
#
# Uses codex exec (not codex review) to send individual prompts per reviewer,
# enabling parallel execution and avoiding timeouts on large diffs.
#
# Env:
#   SKIP_CODEX_REVIEW=1              Skip review
#   REQUIRE_CODEX_REVIEW=1           Hard fail if codex CLI not found (default: soft skip)
#   CODEX_MODEL                      Override model (default: Codex CLI config default)
#   REVIEW_BASE_BRANCH=main          Override base branch for --branch mode (default: develop)
#   REVIEW_TIMEOUT_SEC=600           Max seconds per reviewer (default: 600)

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
for f in "$SCRIPT_DIR/review-prompts.sh" "$SCRIPT_DIR/review-common.sh"; do
    if [ ! -f "$f" ]; then
        echo "ERROR: Required file not found: $f" >&2
        exit 1
    fi
done
source "$SCRIPT_DIR/review-prompts.sh"
source "$SCRIPT_DIR/review-common.sh"

if [ "$SKIP_CODEX_REVIEW" = "1" ] && [ "${REQUIRE_CODEX_REVIEW:-0}" = "1" ]; then
    echo -e "${RED}ERROR: SKIP_CODEX_REVIEW and REQUIRE_CODEX_REVIEW cannot both be set${NC}" >&2
    exit 2
fi

if [ "$SKIP_CODEX_REVIEW" = "1" ]; then
    echo -e "${YELLOW}Skipping Codex review (SKIP_CODEX_REVIEW=1)${NC}"
    exit 0
fi

if ! command -v codex &> /dev/null; then
    if [ "${REQUIRE_CODEX_REVIEW:-0}" = "1" ]; then
        echo -e "${RED}ERROR: REQUIRE_CODEX_REVIEW=1 but codex not found${NC}" >&2
        exit 2
    fi
    echo -e "${YELLOW}Warning: codex CLI not found, skipping review${NC}" >&2
    echo -e "${YELLOW}Install: https://developers.openai.com/codex/cli/${NC}" >&2
    exit 0
fi


# Configuration
REVIEW_TIMEOUT_SEC="${REVIEW_TIMEOUT_SEC:-600}"

# モデルは既定では指定せず、~/.codex/config.toml に委譲する（ACE-70-2）。
# env が明示された場合だけ -m を追加する。安全展開は macOS bash 3.2 + set -u 対応。
CODEX_MODEL_ARGS=()
if [ -n "${CODEX_MODEL:-}" ]; then
    CODEX_MODEL_ARGS=("-m" "$CODEX_MODEL")
fi

# Resolve timeout command (GNU timeout or macOS gtimeout)
TIMEOUT_CMD=""
if command -v timeout &>/dev/null; then
    TIMEOUT_CMD="timeout"
elif command -v gtimeout &>/dev/null; then
    TIMEOUT_CMD="gtimeout"
fi

# Define CLI invocation (called by run_all_reviewers)
invoke_cli() {
    local prompt=$1
    local output=$2

    if [ -n "$TIMEOUT_CMD" ]; then
        "$TIMEOUT_CMD" "$REVIEW_TIMEOUT_SEC" codex exec ${CODEX_MODEL_ARGS[@]+"${CODEX_MODEL_ARGS[@]}"} "$prompt" \
            < "$DIFF_FILE" > "$output"
    else
        echo -e "${YELLOW}Warning: 'timeout' command not found. No timeout protection.${NC}" >&2
        codex exec ${CODEX_MODEL_ARGS[@]+"${CODEX_MODEL_ARGS[@]}"} "$prompt" \
            < "$DIFF_FILE" > "$output"
    fi
}

# Prepare diff (pass through any mode argument: --staged, --branch)
rc=0
prepare_diff "$@" || rc=$?
if [ "$rc" -eq 1 ]; then
    exit 0  # Nothing to review
elif [ "$rc" -ne 0 ]; then
    exit 1  # Error
fi

MODEL_DISPLAY="${CODEX_MODEL:-codex config default}"
run_all_reviewers "Codex Code Review (model: ${MODEL_DISPLAY})"
exit $?
