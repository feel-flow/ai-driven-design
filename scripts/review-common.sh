#!/bin/bash
# Shared Review Functions
# Sourced by claude-review.sh, copilot-review.sh, gemini-review.sh, cursor-review.sh
#
# Provides: prepare_diff, run_all_reviewers, display_results, parse_verdict
# Also sets globals: DIFF_FILE, REVIEW_FILES, TEMP_DIR, REVIEWERS
# Requires: invoke_cli() defined by caller before calling run_all_reviewers
#
# Uses REVIEW_BASE_BRANCH (default: develop) for --branch mode

# Configuration
MAX_DIFF_LINES=2000
REVIEWERS=("code-reviewer" "silent-failure-hunter" "type-design-analyzer" "comment-analyzer" "pr-test-analyzer")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Guard against double-init when sourced multiple times
if [ -z "${_REVIEW_COMMON_LOADED:-}" ]; then
    _REVIEW_COMMON_LOADED=1

    TEMP_DIR=$(mktemp -d "/tmp/ai-review-XXXXXX") || {
        echo -e "${RED}ERROR: Failed to create temp directory${NC}" >&2
        exit 1
    }

    cleanup() {
        [ -n "$TEMP_DIR" ] && rm -rf "$TEMP_DIR"
    }
    trap cleanup EXIT INT TERM
fi

# Prepare diff for review
# Supports two modes:
#   --staged   : review staged changes (git diff --cached) — for pre-commit
#   --branch   : review branch changes (git diff $REVIEW_BASE_BRANCH...HEAD) — for PR self-review
#   (default)  : try staged first, fall back to branch diff
#
# Sets: DIFF_FILE, REVIEW_FILES
# Returns: 0 on success, 1 if nothing to review, 2 on error
prepare_diff() {
    local mode="${1:-auto}"

    if ! git rev-parse --is-inside-work-tree &>/dev/null; then
        echo -e "${RED}ERROR: Not inside a git repository${NC}" >&2
        return 2
    fi

    DIFF_FILE="$TEMP_DIR/diff.txt"

    case "$mode" in
        --staged)
            _prepare_staged_diff
            ;;
        --branch)
            _prepare_branch_diff
            ;;
        *)
            # Auto: try staged first, fall back to branch
            local staged_rc=0
            _prepare_staged_diff || staged_rc=$?
            if [ "$staged_rc" -eq 1 ]; then
                _prepare_branch_diff
            elif [ "$staged_rc" -ne 0 ]; then
                return "$staged_rc"
            fi
            ;;
    esac
}

# Exclude auto-generated/lock files from review scope.
# lock ファイルはどの階層でも除外（ルート直下だけでなく mcp/package-lock.json 等も）。
_filter_review_files() {
    echo "$1" | grep -vE '(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.generated\.' || true
}

_prepare_staged_diff() {
    local staged_files
    staged_files=$(git diff --cached --name-only) || {
        echo -e "${RED}ERROR: git diff --cached --name-only failed${NC}" >&2
        return 2
    }

    if [ -z "$staged_files" ]; then
        return 1
    fi

    REVIEW_FILES=$(_filter_review_files "$staged_files")

    if [ -z "$REVIEW_FILES" ]; then
        echo "Only auto-generated files staged - skipping review"
        return 1
    fi

    if ! git diff --cached > "$DIFF_FILE"; then
        echo -e "${RED}ERROR: git diff --cached failed${NC}" >&2
        return 2
    fi
    _check_diff_size || return $?
    return 0
}

_prepare_branch_diff() {
    local base_branch="${REVIEW_BASE_BRANCH:-develop}"
    local branch_files

    if ! branch_files=$(git diff --name-only "${base_branch}...HEAD" 2>&1); then
        echo -e "${RED}ERROR: Failed to compute diff against ${base_branch}: ${branch_files}${NC}" >&2
        return 2
    fi

    if [ -z "$branch_files" ]; then
        echo "No changes found against ${base_branch}"
        return 1
    fi

    REVIEW_FILES=$(_filter_review_files "$branch_files")

    if [ -z "$REVIEW_FILES" ]; then
        echo "Only auto-generated files changed - skipping review"
        return 1
    fi

    if ! git diff "${base_branch}...HEAD" > "$DIFF_FILE"; then
        echo -e "${RED}ERROR: git diff against ${base_branch} failed${NC}" >&2
        return 2
    fi
    _check_diff_size || return $?
    return 0
}

_check_diff_size() {
    if [ ! -s "$DIFF_FILE" ]; then
        echo -e "${RED}ERROR: Diff file is empty or missing${NC}" >&2
        return 1
    fi

    local diff_lines
    diff_lines=$(wc -l < "$DIFF_FILE")

    if [ "$diff_lines" -gt "$MAX_DIFF_LINES" ]; then
        echo ""
        echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ⚠  LARGE DIFF WARNING: ${diff_lines} lines (max: ${MAX_DIFF_LINES})${NC}"
        echo -e "${RED}║  Diff truncated to ${MAX_DIFF_LINES} lines for review.${NC}"
        echo -e "${RED}║  Consider breaking into smaller commits for full coverage.${NC}"
        echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        # Truncate diff to MAX_DIFF_LINES (use tmp file to avoid $() stripping trailing newlines)
        head -n "$MAX_DIFF_LINES" "$DIFF_FILE" > "${DIFF_FILE}.tmp" && mv "${DIFF_FILE}.tmp" "$DIFF_FILE"
    fi
}

# Run all reviewers in parallel and display results
# Requires: invoke_cli() function defined by caller
# Usage: run_all_reviewers "Tool Name"
# Returns: 0 if all reviewers pass, 1 if any reviewer fails or errors
run_all_reviewers() {
    local tool_name="$1"

    echo -e "${BOLD}Running ${tool_name} (${#REVIEWERS[@]} specialized reviewers in parallel)...${NC}"
    echo "Files to review:"
    echo "$REVIEW_FILES" | sed 's/^/  - /'
    echo ""

    echo -e "${CYAN}Starting parallel review...${NC}"
    local start_time
    start_time=$(date +%s)

    local pids=()
    for reviewer in "${REVIEWERS[@]}"; do
        _run_single_reviewer "$reviewer" &
        pids+=($!)
    done

    for i in "${!pids[@]}"; do
        local pid="${pids[$i]}"
        local reviewer="${REVIEWERS[$i]}"
        local ws=0
        wait "$pid" || ws=$?
        if [ "$ws" -ne 0 ] && [ ! -f "$TEMP_DIR/${reviewer}.verdict" ]; then
            echo -e "${RED}WARNING: Reviewer '${reviewer}' process exited with status ${ws}${NC}" >&2
            echo "ERROR" > "$TEMP_DIR/${reviewer}.verdict"
            echo "Process terminated abnormally (exit code ${ws})" > "$TEMP_DIR/${reviewer}.md"
        fi
    done

    local elapsed=$(( $(date +%s) - start_time ))
    echo -e "${CYAN}Review completed in ${elapsed}s${NC}"

    display_results "$tool_name"
    return $?
}

_run_single_reviewer() {
    local name=$1
    local output="$TEMP_DIR/${name}.md"
    local stderr_file="$TEMP_DIR/${name}.stderr"
    local verdict_file="$TEMP_DIR/${name}.verdict"
    local prompt

    if ! prompt=$(get_prompt "$name"); then
        echo "ERROR" > "$verdict_file"
        echo "Unknown reviewer: $name" > "$output"
        return
    fi

    local exit_status=0
    invoke_cli "$prompt" "$output" 2>"$stderr_file" || exit_status=$?

    # Detect timeout (exit code 124 from `timeout` command)
    if [ "$exit_status" -eq 124 ]; then
        echo "TIMEOUT" > "$verdict_file"
        echo "Reviewer timed out after ${REVIEW_TIMEOUT_SEC:-600}s. Consider increasing REVIEW_TIMEOUT_SEC or reducing the diff." > "$output"
        if [ -s "$stderr_file" ]; then
            echo "" >> "$output"
            echo "--- stderr ---" >> "$output"
            cat "$stderr_file" >> "$output"
        fi
        return
    fi

    # Append stderr to output on failure for debugging
    if [ "$exit_status" -ne 0 ] && [ -s "$stderr_file" ]; then
        echo "" >> "$output"
        echo "--- stderr ---" >> "$output"
        cat "$stderr_file" >> "$output"
    fi

    parse_verdict "$exit_status" "$output" "$verdict_file" || true
}

# Display results table and return overall verdict
# Returns: 0 if all pass, 1 if any fail
display_results() {
    local tool_name="${1:-AI Code Review}"
    local overall_pass=true

    echo ""
    echo "┌────────────────────────────────────────────────────────────┐"
    printf "│ %56s │\n" "${tool_name} Results"
    echo "├────────────────────────────────────────────────────────────┤"

    for reviewer in "${REVIEWERS[@]}"; do
        local verdict_file="$TEMP_DIR/${reviewer}.verdict"
        local verdict

        if [ -f "$verdict_file" ]; then
            verdict=$(<"$verdict_file")
        else
            verdict="ERROR"
        fi

        local padded_name
        padded_name=$(printf "%-25s" "$reviewer")

        local verdict_text verdict_color
        if [ "$verdict" = "PASS" ]; then
            verdict_text="✓ PASS"; verdict_color="$GREEN"
        elif [ "$verdict" = "FAIL" ]; then
            verdict_text="✗ FAIL"; verdict_color="$RED"; overall_pass=false
        elif [ "$verdict" = "TIMEOUT" ]; then
            verdict_text="⏱ TIMEOUT"; verdict_color="$YELLOW"; overall_pass=false
        else
            verdict_text="? ERROR"; verdict_color="$YELLOW"; overall_pass=false
        fi

        local colored_verdict=" ${verdict_color}${verdict_text}${NC}"
        local padding_len=$((28 - 1 - ${#verdict_text}))
        local padding
        padding=$(printf '%*s' "$padding_len" '')

        echo -e "│ ${padded_name}${colored_verdict}${padding}│"
    done

    echo "├────────────────────────────────────────────────────────────┤"

    if [ "$overall_pass" = true ]; then
        echo -e "│                  ${GREEN}${BOLD}Overall: APPROVED${NC}                       │"
    else
        echo -e "│                  ${RED}${BOLD}Overall: REJECTED${NC}                       │"
    fi

    echo "└────────────────────────────────────────────────────────────┘"
    echo ""

    # Show details for failed and errored reviewers
    for reviewer in "${REVIEWERS[@]}"; do
        local verdict_file="$TEMP_DIR/${reviewer}.verdict"
        local output_file="$TEMP_DIR/${reviewer}.md"

        if [ -f "$verdict_file" ]; then
            local v=$(<"$verdict_file")
            if [ "$v" = "FAIL" ] || [ "$v" = "ERROR" ] || [ "$v" = "TIMEOUT" ]; then
                echo -e "${RED}━━━ ${reviewer} Details ━━━${NC}"
                if [ -f "$output_file" ]; then
                    cat "$output_file"
                fi
                echo ""
            fi
        fi
    done

    if [ "$overall_pass" = false ]; then
        echo -e "${RED}Code review REJECTED. Please fix the issues before proceeding.${NC}"
        return 1
    fi

    echo -e "${GREEN}Code review APPROVED${NC}"
    return 0
}

# Parse verdict from reviewer output
# Expects output to contain "Verdict: PASS" or "Verdict: FAIL" (case-insensitive).
# Output without a recognized verdict line is treated as ERROR.
parse_verdict() {
    local exit_status=$1
    local output_file=$2
    local verdict_file=$3

    if [ "$exit_status" -ne 0 ]; then
        echo "ERROR" > "$verdict_file"
        echo "Reviewer command failed with exit code $exit_status" >> "$output_file"
    elif [ ! -s "$output_file" ]; then
        echo "ERROR" > "$verdict_file"
        echo "Reviewer produced no output" > "$output_file"
    elif grep -qi "Verdict:.*PASS" "$output_file"; then
        echo "PASS" > "$verdict_file"
    elif grep -qi "Verdict:.*FAIL" "$output_file"; then
        echo "FAIL" > "$verdict_file"
    else
        echo "ERROR" > "$verdict_file"
        echo "WARNING: Could not parse verdict from reviewer output" >> "$output_file"
    fi
}
