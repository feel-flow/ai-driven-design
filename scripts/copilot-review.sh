#!/bin/bash
# GitHub Copilot CLI Automated Review Script
# Runs specialized reviewers in parallel using copilot -p
#
# NOTE: Copilot is metered (premium requests) — excluded from the default
# review lineup (standard: Claude Code + Codex cross-model review).
# Run this script directly only when you accept the metered cost.
#
# Env:
#   SKIP_COPILOT_REVIEW=1            Skip review
#   REQUIRE_COPILOT_REVIEW=1         Hard fail if copilot CLI not found (default: soft skip)
#   COPILOT_MODEL                    Override model (default: Copilot CLI config default)
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

if [ "$SKIP_COPILOT_REVIEW" = "1" ] && [ "${REQUIRE_COPILOT_REVIEW:-0}" = "1" ]; then
    echo -e "${RED}ERROR: SKIP_COPILOT_REVIEW and REQUIRE_COPILOT_REVIEW cannot both be set${NC}" >&2
    exit 2
fi

if [ "$SKIP_COPILOT_REVIEW" = "1" ]; then
    echo -e "${YELLOW}Skipping Copilot review (SKIP_COPILOT_REVIEW=1)${NC}"
    exit 0
fi

if ! command -v copilot &> /dev/null; then
    if [ "${REQUIRE_COPILOT_REVIEW:-0}" = "1" ]; then
        echo -e "${RED}ERROR: REQUIRE_COPILOT_REVIEW=1 but copilot not found${NC}" >&2
        exit 2
    fi
    echo -e "${YELLOW}Warning: copilot CLI not found, skipping review${NC}" >&2
    echo -e "${YELLOW}Install: https://docs.github.com/en/copilot/how-tos/use-copilot-agents/use-copilot-cli${NC}" >&2
    exit 0
fi


# Configuration
REVIEW_TIMEOUT_SEC="${REVIEW_TIMEOUT_SEC:-600}"

# モデルは既定では指定せず、Copilot CLI の設定／既定へ委譲する（ACE-70-2）。
# env が明示された場合だけ --model を追加する。安全展開は macOS bash 3.2 + set -u 対応。
COPILOT_MODEL_ARGS=()
if [ -n "${COPILOT_MODEL:-}" ]; then
    COPILOT_MODEL_ARGS=("--model" "$COPILOT_MODEL")
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
        "$TIMEOUT_CMD" "$REVIEW_TIMEOUT_SEC" copilot -p "$prompt" ${COPILOT_MODEL_ARGS[@]+"${COPILOT_MODEL_ARGS[@]}"} \
            < "$DIFF_FILE" > "$output"
    else
        echo -e "${YELLOW}Warning: 'timeout' command not found. No timeout protection.${NC}" >&2
        copilot -p "$prompt" ${COPILOT_MODEL_ARGS[@]+"${COPILOT_MODEL_ARGS[@]}"} \
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

MODEL_DISPLAY="${COPILOT_MODEL:-copilot config default}"
run_all_reviewers "Copilot Code Review (model: ${MODEL_DISPLAY})"
exit $?
