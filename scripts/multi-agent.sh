#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# multi-agent.sh — Multi-CLI Agent Orchestrator
# ────────────────────────────────────────────────────────────
# Orchestrates 5 AI CLIs (Claude Code, Codex, Copilot, Gemini, Cursor)
# for review, explore, and implement tasks using tool-agnostic perspectives.
#
# NOTE: Copilot CLI is metered (premium requests) — excluded from the
# default review lineup. Opt in explicitly with --cli copilot-cli.
#
# Compatible with bash 3.2+ (macOS default).
#
# Usage:
#   bash scripts/multi-agent.sh --task <type> [options]
#
# Options:
#   --task <type>           review | explore | implement (default: review)
#   --description <text>    Task description (required for explore/implement)
#   --config <path>         Config file (default: scripts/agent-config.yaml)
#   --mode <mode>           distributed | cross-model
#   --strategy <strategy>   balanced | minimize_cost | maximize_quality
#   --cli <name>            Run only this CLI (repeatable)
#   --perspective <name>    Run only this perspective (repeatable)
#   --parallel              Parallel execution (default)
#   --sequential            Sequential execution
#   --output-dir <dir>      Output directory (auto-detected by task type)
#   --base <branch>         Base branch for diff (default: develop)
#   --include-diff          Include diff in implement prompts
#   --delegate-toolkit      Delegate pr-review-toolkit perspectives
#   --dry-run               Show plan without executing
#   --timeout <seconds>     Timeout per CLI (auto-detected by task type)
#   --help                  Show this help
#
# Entry Points:
#   Terminal:     bash scripts/multi-agent.sh --task review
#   Claude Code:  /multi-review, /multi-explore, /multi-implement
#   CI/CD:        See docs-template/05-operations/deployment/multi-cli-review-orchestration.md
#
# See: docs-template/05-operations/deployment/multi-cli-review-orchestration.md
# ────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── All known CLI names ──
ALL_CLIS="claude-code codex-cli copilot-cli gemini-cli cursor-cli"

# ── Lookup Functions (bash 3.2 compatible — no associative arrays) ──

get_cli_command() {
  case "$1" in
    claude-code) echo "claude" ;;
    codex-cli)   echo "codex" ;;
    copilot-cli) echo "copilot" ;;
    gemini-cli)  echo "gemini" ;;
    cursor-cli)  echo "cursor-agent" ;;
    *) echo "" ;;
  esac
}

get_cli_adapter() {
  case "$1" in
    claude-code) echo "${SCRIPT_DIR}/adapters/claude-code-adapter.sh" ;;
    codex-cli)   echo "${SCRIPT_DIR}/adapters/codex-cli-adapter.sh" ;;
    copilot-cli) echo "${SCRIPT_DIR}/adapters/copilot-cli-adapter.sh" ;;
    gemini-cli)  echo "${SCRIPT_DIR}/adapters/gemini-cli-adapter.sh" ;;
    cursor-cli)  echo "${SCRIPT_DIR}/adapters/cursor-cli-adapter.sh" ;;
    *) echo "" ;;
  esac
}

# ── Task-type aware perspective mappings ──

get_cli_perspectives_review() {
  case "$1" in
    claude-code) echo "type-design-analysis" ;;
    codex-cli)   echo "code-review error-handler-hunt test-analysis" ;;
    copilot-cli) echo "test-analysis comment-analysis" ;;  # metered — runs ONLY with explicit --cli copilot-cli (see build_distributed_plan)
    gemini-cli)  echo "security-analysis comment-analysis" ;;
    cursor-cli)  echo "code-simplification" ;;
    *) echo "" ;;
  esac
}

get_cli_perspectives_explore() {
  case "$1" in
    claude-code) echo "architecture-analysis" ;;
    codex-cli)   echo "dependency-mapping" ;;
    copilot-cli) echo "api-surface-analysis" ;;
    gemini-cli)  echo "tech-debt-assessment" ;;
    cursor-cli)  echo "pattern-discovery" ;;
    *) echo "" ;;
  esac
}

get_cli_perspectives_implement() {
  case "$1" in
    claude-code) echo "feature-implementation" ;;
    codex-cli)   echo "refactoring" ;;
    copilot-cli) echo "test-writing" ;;
    gemini-cli)  echo "documentation" ;;
    cursor-cli)  echo "migration" ;;
    *) echo "" ;;
  esac
}

get_cli_perspectives() {
  local cli_name="$1"
  case "$TASK_TYPE" in
    review)    get_cli_perspectives_review "$cli_name" ;;
    explore)   get_cli_perspectives_explore "$cli_name" ;;
    implement) get_cli_perspectives_implement "$cli_name" ;;
    *)         get_cli_perspectives_review "$cli_name" ;;
  esac
}

get_cli_fallback() {
  case "$1" in
    claude-code) echo "codex-cli" ;;
    codex-cli)   echo "claude-code" ;;
    copilot-cli) echo "codex-cli" ;;
    gemini-cli)  echo "codex-cli" ;;
    cursor-cli)  echo "codex-cli" ;;
    *) echo "" ;;
  esac
}

get_cli_cost_tier() {
  case "$1" in
    claude-code) echo "premium" ;;
    codex-cli)   echo "standard" ;;
    copilot-cli) echo "metered" ;;
    gemini-cli)  echo "free-tier" ;;
    cursor-cli)  echo "flat-rate" ;;
    *) echo "unknown" ;;
  esac
}

# ── Task-type defaults ──

get_default_output_dir() {
  case "$1" in
    review)    echo "${REPO_ROOT}/.review-results" ;;
    explore)   echo "${REPO_ROOT}/.explore-results" ;;
    implement) echo "${REPO_ROOT}/.implement-results" ;;
    *)         echo "${REPO_ROOT}/.review-results" ;;
  esac
}

get_default_timeout() {
  case "$1" in
    review)    echo "300" ;;
    explore)   echo "600" ;;
    implement) echo "900" ;;
    *)         echo "300" ;;
  esac
}

get_default_strategy() {
  case "$1" in
    review)    echo "balanced" ;;
    explore)   echo "minimize_cost" ;;
    implement) echo "maximize_quality" ;;
    *)         echo "balanced" ;;
  esac
}

get_task_emoji() {
  case "$1" in
    review)    echo "🔍" ;;
    explore)   echo "🔭" ;;
    implement) echo "🛠️" ;;
    *)         echo "🔍" ;;
  esac
}

# ── Defaults ──
TASK_TYPE="review"
DESCRIPTION=""
INCLUDE_DIFF=false
CONFIG_FILE="${SCRIPT_DIR}/agent-config.yaml"
MODE="distributed"
STRATEGY=""
PARALLEL=true
OUTPUT_DIR=""
BASE_BRANCH="develop"
DELEGATE_TOOLKIT=false
DRY_RUN=false
TIMEOUT=""

# Space-separated filter lists (bash 3.2 compatible)
CLI_FILTER=""
PERSPECTIVE_FILTER=""

# Detected available CLIs (space-separated)
AVAILABLE_CLIS=""

# Execution plan: CLI_NAME:PERSPECTIVE pairs (newline-separated)
EXECUTION_PLAN=""

# ── Utility ──

list_contains() {
  local list="$1" item="$2"
  for i in $list; do
    [[ "$i" == "$item" ]] && return 0
  done
  return 1
}

# ── Usage ──
show_help() {
  sed -n '/^# Usage:/,/^# See:/{/^# See:/d; s/^# \{0,1\}//; p;}' "$0"
  exit 0
}

# ── Argument Parsing ──
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --task)        TASK_TYPE="$2"; shift 2 ;;
      --description) DESCRIPTION="$2"; shift 2 ;;
      --include-diff) INCLUDE_DIFF=true; shift ;;
      --config)      CONFIG_FILE="$2"; shift 2 ;;
      --mode)        MODE="$2"; shift 2 ;;
      --strategy)    STRATEGY="$2"; shift 2 ;;
      --cli)         CLI_FILTER="${CLI_FILTER:+$CLI_FILTER }$2"; shift 2 ;;
      --perspective) PERSPECTIVE_FILTER="${PERSPECTIVE_FILTER:+$PERSPECTIVE_FILTER }$2"; shift 2 ;;
      --parallel)    PARALLEL=true; shift ;;
      --sequential)  PARALLEL=false; shift ;;
      --output-dir)  OUTPUT_DIR="$2"; shift 2 ;;
      --base)        BASE_BRANCH="$2"; shift 2 ;;
      --delegate-toolkit) DELEGATE_TOOLKIT=true; shift ;;
      --dry-run)     DRY_RUN=true; shift ;;
      --timeout)     TIMEOUT="$2"; shift 2 ;;
      --help|-h)     show_help ;;
      *)
        echo "Unknown option: $1" >&2
        echo "Run with --help for usage" >&2
        exit 1
        ;;
    esac
  done

  # Validate task type
  case "$TASK_TYPE" in
    review|explore|implement) ;;
    *)
      echo "ERROR: Invalid task type: '${TASK_TYPE}'. Must be review, explore, or implement." >&2
      exit 1
      ;;
  esac

  # Validate description for explore/implement
  if [[ "$TASK_TYPE" != "review" && -z "$DESCRIPTION" && "$DRY_RUN" == "false" ]]; then
    echo "ERROR: --description is required for ${TASK_TYPE} tasks." >&2
    exit 1
  fi
}

# ── Config Loading (v1/v2 compatible) ──
load_config() {
  # Fall back to review-config.yaml if agent-config.yaml doesn't exist
  if [[ ! -f "$CONFIG_FILE" ]]; then
    local fallback_config="${SCRIPT_DIR}/review-config.yaml"
    if [[ -f "$fallback_config" ]]; then
      CONFIG_FILE="$fallback_config"
    else
      echo "⚠️  Config file not found: $CONFIG_FILE (using defaults)" >&2
      return 0
    fi
  fi

  if command -v yq &>/dev/null; then
    if ! yq '.' "$CONFIG_FILE" >/dev/null 2>&1; then
      echo "⚠️  Config file could not be parsed by yq. Using defaults." >&2
      return 0
    fi

    local cfg_val
    cfg_val=$(yq -r '.mode // ""' "$CONFIG_FILE" 2>/dev/null || true)
    [[ -n "$cfg_val" ]] && MODE="$cfg_val"

    cfg_val=$(yq -r '.parallel // ""' "$CONFIG_FILE" 2>/dev/null || true)
    [[ "$cfg_val" == "true" ]] && PARALLEL=true
    [[ "$cfg_val" == "false" ]] && PARALLEL=false

    # v2: task-specific config
    local version
    version=$(yq -r '.version // "1.0"' "$CONFIG_FILE" 2>/dev/null || true)

    if [[ "$version" == "2.0" ]]; then
      # Read task-specific settings
      cfg_val=$(yq -r ".tasks.${TASK_TYPE}.cost_strategy // \"\"" "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$STRATEGY" ]] && STRATEGY="$cfg_val"

      cfg_val=$(yq -r ".tasks.${TASK_TYPE}.timeout // \"\"" "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$TIMEOUT" ]] && TIMEOUT="$cfg_val"

      cfg_val=$(yq -r ".tasks.${TASK_TYPE}.output_dir // \"\"" "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$OUTPUT_DIR" ]] && OUTPUT_DIR="${REPO_ROOT}/${cfg_val}"
    else
      # v1 compatibility
      cfg_val=$(yq -r '.cost_strategy // ""' "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$STRATEGY" ]] && STRATEGY="$cfg_val"

      cfg_val=$(yq -r '.timeout // ""' "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$TIMEOUT" ]] && TIMEOUT="$cfg_val"

      cfg_val=$(yq -r '.output_dir // ""' "$CONFIG_FILE" 2>/dev/null || true)
      [[ -n "$cfg_val" && -z "$OUTPUT_DIR" ]] && OUTPUT_DIR="${REPO_ROOT}/${cfg_val}"
    fi
  else
    echo "ℹ️  yq not found — using defaults. Install yq for config file support." >&2
  fi
  return 0  # last &&-list may legitimately be false — don't let set -e kill the script
}

# ── Apply task-type defaults (after config + CLI args) ──
apply_task_defaults() {
  [[ -z "$OUTPUT_DIR" ]] && OUTPUT_DIR="$(get_default_output_dir "$TASK_TYPE")"
  [[ -z "$TIMEOUT" ]] && TIMEOUT="$(get_default_timeout "$TASK_TYPE")"
  [[ -z "$STRATEGY" ]] && STRATEGY="$(get_default_strategy "$TASK_TYPE")"
  return 0  # last &&-list may legitimately be false — don't let set -e kill the script
}

# ── CLI Detection ──
detect_available_clis() {
  AVAILABLE_CLIS=""
  local cli_name cmd

  for cli_name in $ALL_CLIS; do
    cmd="$(get_cli_command "$cli_name")"
    if command -v "$cmd" &>/dev/null; then
      AVAILABLE_CLIS="${AVAILABLE_CLIS:+$AVAILABLE_CLIS }$cli_name"
      echo "  ✅ ${cli_name} (${cmd})" >&2
    else
      echo "  ❌ ${cli_name} (${cmd}) — not installed" >&2
    fi
  done

  if [[ -z "$AVAILABLE_CLIS" ]]; then
    echo "" >&2
    echo "ERROR: No AI CLIs are installed. Install at least one:" >&2
    echo "  npm install -g @anthropic-ai/claude-code" >&2
    echo "  npm install -g @openai/codex" >&2
    echo "  npm install -g @google/gemini-cli" >&2
    exit 1
  fi
}

# ── Add to Execution Plan ──
add_to_plan() {
  local cli_name="$1" perspective="$2"
  EXECUTION_PLAN="${EXECUTION_PLAN:+$EXECUTION_PLAN
}${cli_name}:${perspective}"
}

# ── Build Execution Plan (distributed mode) ──
build_distributed_plan() {
  EXECUTION_PLAN=""
  local cli_name perspectives fallback_target

  for cli_name in $ALL_CLIS; do
    perspectives="$(get_cli_perspectives "$cli_name")"
    [[ -z "$perspectives" ]] && continue

    # Copilot CLI is metered — include in review plans only when explicitly requested via --cli
    if [[ "$cli_name" == "copilot-cli" && "$TASK_TYPE" == "review" && -z "$CLI_FILTER" ]]; then
      echo "  ⏭  copilot-cli skipped (metered). Opt in with --cli copilot-cli." >&2
      continue
    fi

    if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$cli_name"; then
      continue
    fi

    if list_contains "$AVAILABLE_CLIS" "$cli_name"; then
      for p in $perspectives; do
        if [[ -n "$PERSPECTIVE_FILTER" ]] && ! list_contains "$PERSPECTIVE_FILTER" "$p"; then
          continue
        fi
        add_to_plan "$cli_name" "$p"
      done
    else
      fallback_target="$(get_cli_fallback "$cli_name")"
      if [[ -n "$fallback_target" ]] && list_contains "$AVAILABLE_CLIS" "$fallback_target"; then
        if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$fallback_target"; then
          echo "  ⚠️  ${cli_name}: fallback ${fallback_target} excluded by --cli filter. Skipping." >&2
          continue
        fi
        echo "  ↪ ${cli_name} → ${fallback_target} (fallback)" >&2
        for p in $perspectives; do
          if [[ -n "$PERSPECTIVE_FILTER" ]] && ! list_contains "$PERSPECTIVE_FILTER" "$p"; then
            continue
          fi
          add_to_plan "$fallback_target" "$p"
        done
      else
        echo "  ⚠️  ${cli_name}: No fallback available. Skipping: ${perspectives}" >&2
      fi
    fi
  done

  # Apply cost strategy: minimize_cost moves premium → flat-rate
  if [[ "$STRATEGY" == "minimize_cost" ]]; then
    local new_plan=""
    while IFS= read -r entry; do
      [[ -z "$entry" ]] && continue
      local cli="${entry%%:*}"
      local persp="${entry#*:}"
      if [[ "$cli" == "claude-code" ]] && list_contains "$AVAILABLE_CLIS" "cursor-cli"; then
        echo "  💰 minimize_cost: ${persp}: claude-code → cursor-cli" >&2
        new_plan="${new_plan:+$new_plan
}cursor-cli:${persp}"
      else
        new_plan="${new_plan:+$new_plan
}${entry}"
      fi
    done <<< "$EXECUTION_PLAN"
    EXECUTION_PLAN="$new_plan"
  fi
}

# ── Build Execution Plan (cross-model mode) ──
build_cross_model_plan() {
  EXECUTION_PLAN=""
  local perspective="${PERSPECTIVE_FILTER:-code-review}"
  perspective="${perspective%% *}"

  echo "  🔄 Cross-model mode: all CLIs run '${perspective}'" >&2

  for cli_name in $AVAILABLE_CLIS; do
    if [[ -n "$CLI_FILTER" ]] && ! list_contains "$CLI_FILTER" "$cli_name"; then
      continue
    fi
    # Copilot CLI is metered — include only when explicitly requested via --cli
    if [[ "$cli_name" == "copilot-cli" && -z "$CLI_FILTER" ]]; then
      echo "  ⏭  copilot-cli skipped (metered). Opt in with --cli copilot-cli." >&2
      continue
    fi
    add_to_plan "$cli_name" "$perspective"
  done
}

# ── Show Execution Plan ──
show_plan() {
  local emoji
  emoji="$(get_task_emoji "$TASK_TYPE")"

  echo "" >&2
  echo "📋 Execution Plan:" >&2
  echo "   Task: ${TASK_TYPE} ${emoji}" >&2
  echo "   Mode: ${MODE}" >&2
  echo "   Strategy: ${STRATEGY}" >&2
  echo "   Parallel: ${PARALLEL}" >&2
  echo "   Output: ${OUTPUT_DIR}" >&2
  echo "   Base branch: ${BASE_BRANCH}" >&2
  echo "   Timeout: ${TIMEOUT}s" >&2
  if [[ -n "$DESCRIPTION" ]]; then
    echo "   Description: ${DESCRIPTION}" >&2
  fi
  echo "" >&2

  if [[ -z "$EXECUTION_PLAN" ]]; then
    echo "   ⚠️  No CLIs/perspectives to execute." >&2
    return
  fi

  local current_cli=""
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli="${entry%%:*}"
    local persp="${entry#*:}"
    if [[ "$cli" != "$current_cli" ]]; then
      current_cli="$cli"
      local tier
      tier="$(get_cli_cost_tier "$cli")"
      echo "   ${cli} [${tier}]:" >&2
    fi
    echo "     - ${persp}" >&2
  done <<< "$EXECUTION_PLAN"
  echo "" >&2
}

# ── Resolve perspective file path (task-type aware) ──
resolve_perspective_file() {
  local perspective="$1"

  # Try task-type subdirectory first
  local subdir_file="${SCRIPT_DIR}/perspectives/${TASK_TYPE}/${perspective}.md"
  if [[ -f "$subdir_file" ]]; then
    echo "$subdir_file"
    return
  fi

  # Fall back to root perspectives (backward compat)
  local root_file="${SCRIPT_DIR}/perspectives/${perspective}.md"
  if [[ -f "$root_file" ]]; then
    echo "$root_file"
    return
  fi

  echo ""
}

# ── Execute Single Task ──
run_single_task() {
  local cli_name="$1"
  local perspective="$2"

  local adapter
  adapter="$(get_cli_adapter "$cli_name")"

  local perspective_file
  perspective_file="$(resolve_perspective_file "$perspective")"
  local output_file="${OUTPUT_DIR}/${cli_name}/${perspective}.md"

  if [[ -z "$perspective_file" ]]; then
    echo "  ⚠️  Perspective file not found: ${TASK_TYPE}/${perspective}.md" >&2
    return 1
  fi

  if [[ ! -f "$adapter" ]]; then
    echo "  ⚠️  Adapter not found: ${adapter}" >&2
    return 1
  fi

  local extra_args=()
  extra_args+=(--task-type "$TASK_TYPE")
  if [[ -n "$DESCRIPTION" ]]; then
    extra_args+=(--description "$DESCRIPTION")
  fi
  if [[ "$INCLUDE_DIFF" == "true" ]]; then
    extra_args+=(--include-diff)
  fi

  bash "$adapter" "$perspective_file" "$output_file" \
    --base "$BASE_BRANCH" \
    --timeout "$TIMEOUT" \
    "${extra_args[@]}"
}

# ── Path-Segment Safety ──
# A CLI / perspective name is used as a single path segment under OUTPUT_DIR.
# Reject anything that is not a plain identifier so a crafted --cli/--perspective
# value (e.g. "../../secret") cannot escape OUTPUT_DIR when we build result paths.
is_safe_token() {
  [[ "$1" =~ ^[A-Za-z0-9._-]+$ ]] && [[ "$1" != "." && "$1" != ".." ]]
}

# ── Clear This Run's Planned Outputs ──
# The report reads ${cli}/${perspective}.md for each plan entry; adapters only
# (over)write that file on success, leaving a prior run's file in place on
# failure/timeout. Deleting exactly this run's own targets up front means a task
# that produces no output leaves NO stale same-name file to be mis-reported as
# current (issue #450) — instead the report surfaces it as "no output". Scoped to
# the plan's own (cli, perspective) targets only; nothing else on disk (other
# CLIs, other perspectives, unrelated user files) is touched.
clear_planned_outputs() {
  [[ -n "${OUTPUT_DIR:-}" ]] || return 0
  local entry cli_name persp_name
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    cli_name="${entry%%:*}"
    persp_name="${entry#*:}"
    if ! is_safe_token "$cli_name" || ! is_safe_token "$persp_name"; then
      continue
    fi
    rm -f "${OUTPUT_DIR}/${cli_name}/${persp_name}.md"
  done <<< "$EXECUTION_PLAN"
}

# ── Execute All Tasks ──
execute_tasks() {
  if [[ -z "$EXECUTION_PLAN" ]]; then
    echo "Nothing to execute." >&2
    return 0
  fi

  mkdir -p "$OUTPUT_DIR"
  clear_planned_outputs

  local pids=""
  local tasks=""
  local failed=0
  local count=0

  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli="${entry%%:*}"
    local persp="${entry#*:}"

    if [[ "$PARALLEL" == "true" ]]; then
      run_single_task "$cli" "$persp" &
      pids="${pids:+$pids }$!"
      tasks="${tasks:+$tasks|}${cli}/${persp}"
      count=$((count + 1))
    else
      echo "▶ ${cli} → ${persp}" >&2
      if ! run_single_task "$cli" "$persp"; then
        failed=$((failed + 1))
        echo "  ❌ Failed: ${cli}/${persp}" >&2
      fi
    fi
  done <<< "$EXECUTION_PLAN"

  # Wait for parallel tasks
  if [[ "$PARALLEL" == "true" && -n "$pids" ]]; then
    echo "⏳ Waiting for ${count} parallel ${TASK_TYPE} tasks..." >&2
    local idx=0
    local exit_code
    set +e
    for pid in $pids; do
      idx=$((idx + 1))
      local task_name
      task_name="$(echo "$tasks" | cut -d'|' -f"$idx")"
      wait "$pid"
      exit_code=$?
      if [[ $exit_code -eq 0 ]]; then
        echo "  ✅ Done: ${task_name}" >&2
      else
        failed=$((failed + 1))
        echo "  ❌ Failed: ${task_name} (exit code: ${exit_code})" >&2
      fi
    done
    set -e
  fi

  echo "" >&2
  if [[ $failed -gt 0 ]]; then
    echo "⚠️  ${failed} ${TASK_TYPE} task(s) failed." >&2
    return 1
  else
    echo "✅ All ${TASK_TYPE} tasks completed successfully." >&2
  fi
}

# ── Generate Report (review) ──
generate_review_report() {
  local report_file="${OUTPUT_DIR}/integrated-report.md"

  echo "📝 Generating integrated review report..." >&2

  cat > "$report_file" <<HEADER
# Multi-CLI Review — Integrated Report

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Mode:** ${MODE}
**Strategy:** ${STRATEGY}
**Base Branch:** ${BASE_BRANCH}

---

HEADER

  local has_results=false

  # issue #450: report exactly THIS run's entries by iterating the execution plan
  # instead of globbing ${cli}/*.md. A perspective absent from this plan is never
  # read, and each entry's target file was cleared before execution
  # (clear_planned_outputs), so a prior run's result — whether a different
  # perspective or a same-named stale file left by a failed task — cannot appear
  # as current. The report only reads result files and writes report_file; no
  # result file is deleted or modified here, so a shared --output-dir re-run or a
  # partial --cli/--perspective run is non-destructive. A planned entry with no
  # output file (CLI failure) is surfaced, not silently dropped.
  local entry
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli_name="${entry%%:*}"
    local perspective_name="${entry#*:}"
    # Never build a path from an unsafe segment (guards report against a crafted
    # --cli/--perspective traversal such as "../../secret").
    if ! is_safe_token "$cli_name" || ! is_safe_token "$perspective_name"; then
      continue
    fi
    local result_file="${OUTPUT_DIR}/${cli_name}/${perspective_name}.md"
    has_results=true

    local tier
    tier="$(get_cli_cost_tier "$cli_name")"

    {
      echo ""
      echo "## ${cli_name} — ${perspective_name} [${tier}]"
      echo ""
      if [[ -f "$result_file" ]]; then
        cat "$result_file"
      else
        echo "⚠️ No output produced by this task (CLI failure or missing result file)."
      fi
      echo ""
      echo "---"
      echo ""
    } >> "$report_file"
  done <<< "$EXECUTION_PLAN"

  if [[ "$has_results" == "false" ]]; then
    echo "(No review results found.)" >> "$report_file"
  fi

  if grep -qE '^\s*-\s*\[.*:.*\]|^CRITICAL:|Critical:\s*[1-9]' "$report_file" 2>/dev/null; then
    echo "" >> "$report_file"
    echo "<!-- CRITICAL_BLOCK -->" >> "$report_file"
    echo "Critical issues detected. Review before proceeding." >> "$report_file"
  fi

  echo "📄 Report: ${report_file}" >&2
}

# ── Generate Report (explore) ──
generate_explore_report() {
  local report_file="${OUTPUT_DIR}/integrated-report.md"

  echo "📝 Generating integrated explore report..." >&2

  cat > "$report_file" <<HEADER
# Multi-CLI Explore — Integrated Report

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Description:** ${DESCRIPTION}
**Mode:** ${MODE}
**Strategy:** ${STRATEGY}

---

HEADER

  local has_results=false

  # issue #450: report exactly THIS run's entries by iterating the execution plan
  # instead of globbing ${cli}/*.md. A perspective absent from this plan is never
  # read, and each entry's target file was cleared before execution
  # (clear_planned_outputs), so a prior run's result — whether a different
  # perspective or a same-named stale file left by a failed task — cannot appear
  # as current. The report only reads result files and writes report_file; no
  # result file is deleted or modified here, so a shared --output-dir re-run or a
  # partial --cli/--perspective run is non-destructive. A planned entry with no
  # output file (CLI failure) is surfaced, not silently dropped.
  local entry
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli_name="${entry%%:*}"
    local perspective_name="${entry#*:}"
    # Never build a path from an unsafe segment (guards report against a crafted
    # --cli/--perspective traversal such as "../../secret").
    if ! is_safe_token "$cli_name" || ! is_safe_token "$perspective_name"; then
      continue
    fi
    local result_file="${OUTPUT_DIR}/${cli_name}/${perspective_name}.md"
    has_results=true

    local tier
    tier="$(get_cli_cost_tier "$cli_name")"

    {
      echo ""
      echo "## ${cli_name} — ${perspective_name} [${tier}]"
      echo ""
      if [[ -f "$result_file" ]]; then
        cat "$result_file"
      else
        echo "⚠️ No output produced by this task (CLI failure or missing result file)."
      fi
      echo ""
      echo "---"
      echo ""
    } >> "$report_file"
  done <<< "$EXECUTION_PLAN"

  if [[ "$has_results" == "false" ]]; then
    echo "(No explore results found.)" >> "$report_file"
  fi

  echo "📄 Report: ${report_file}" >&2
}

# ── Generate Report (implement) ──
generate_implement_report() {
  local report_file="${OUTPUT_DIR}/integrated-report.md"

  echo "📝 Generating integrated implement report..." >&2

  cat > "$report_file" <<HEADER
# Multi-CLI Implement — Integrated Report

**Generated:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Description:** ${DESCRIPTION}
**Mode:** ${MODE}
**Strategy:** ${STRATEGY}

---

⚠️ **Implementation results are in staging directory.** Review before applying to working tree.

---

HEADER

  local has_results=false

  # issue #450: report exactly THIS run's entries by iterating the execution plan
  # instead of globbing ${cli}/*.md. A perspective absent from this plan is never
  # read, and each entry's target file was cleared before execution
  # (clear_planned_outputs), so a prior run's result — whether a different
  # perspective or a same-named stale file left by a failed task — cannot appear
  # as current. The report only reads result files and writes report_file; no
  # result file is deleted or modified here, so a shared --output-dir re-run or a
  # partial --cli/--perspective run is non-destructive. A planned entry with no
  # output file (CLI failure) is surfaced, not silently dropped.
  local entry
  while IFS= read -r entry; do
    [[ -z "$entry" ]] && continue
    local cli_name="${entry%%:*}"
    local perspective_name="${entry#*:}"
    # Never build a path from an unsafe segment (guards report against a crafted
    # --cli/--perspective traversal such as "../../secret").
    if ! is_safe_token "$cli_name" || ! is_safe_token "$perspective_name"; then
      continue
    fi
    local result_file="${OUTPUT_DIR}/${cli_name}/${perspective_name}.md"
    has_results=true

    local tier
    tier="$(get_cli_cost_tier "$cli_name")"

    {
      echo ""
      echo "## ${cli_name} — ${perspective_name} [${tier}]"
      echo ""
      if [[ -f "$result_file" ]]; then
        cat "$result_file"
      else
        echo "⚠️ No output produced by this task (CLI failure or missing result file)."
      fi
      echo ""
      echo "---"
      echo ""
    } >> "$report_file"
  done <<< "$EXECUTION_PLAN"

  if [[ "$has_results" == "false" ]]; then
    echo "(No implement results found.)" >> "$report_file"
  fi

  echo "📄 Report: ${report_file}" >&2
}

# ── Generate Report (dispatcher) ──
generate_report() {
  case "$TASK_TYPE" in
    review)    generate_review_report ;;
    explore)   generate_explore_report ;;
    implement) generate_implement_report ;;
  esac
}

# ── Main ──
main() {
  local emoji

  # Two-pass parsing: extract --config and --task first
  local prev_flag=""
  for arg in "$@"; do
    if [[ "$prev_flag" == "--config" ]]; then
      CONFIG_FILE="$arg"
      prev_flag=""
      continue
    fi
    if [[ "$prev_flag" == "--task" ]]; then
      TASK_TYPE="$arg"
      prev_flag=""
      continue
    fi
    if [[ "$arg" == "--config" || "$arg" == "--task" ]]; then
      prev_flag="$arg"
    else
      prev_flag=""
    fi
  done

  load_config
  parse_args "$@"
  apply_task_defaults

  emoji="$(get_task_emoji "$TASK_TYPE")"

  echo "${emoji} Multi-CLI Agent Orchestrator — ${TASK_TYPE}" >&2
  echo "================================================" >&2
  echo "" >&2

  echo "🔎 Detecting available CLIs..." >&2
  detect_available_clis

  echo "" >&2
  echo "📊 Building execution plan..." >&2

  if [[ "$MODE" == "cross-model" ]]; then
    build_cross_model_plan
  else
    build_distributed_plan
  fi

  show_plan

  # Validate TIMEOUT
  if ! echo "$TIMEOUT" | grep -qE '^[0-9]+$' || [[ "$TIMEOUT" -eq 0 ]]; then
    echo "ERROR: --timeout must be a positive integer, got: '${TIMEOUT}'" >&2
    exit 1
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "🏁 Dry run complete. No tasks executed." >&2
    exit 0
  fi

  # Fail loudly on an empty plan — never report success when nothing ran
  if [[ -z "$EXECUTION_PLAN" ]]; then
    echo "ERROR: Execution plan is empty — no CLI/perspective matched the given filters." >&2
    echo "       Check --cli / --perspective / --mode combinations." >&2
    exit 1
  fi

  local task_failed=false
  execute_tasks || task_failed=true
  generate_report

  echo "" >&2
  echo "🏁 Done! View results:" >&2
  echo "   cat ${OUTPUT_DIR}/integrated-report.md" >&2

  if [[ "$task_failed" == "true" ]]; then
    exit 1
  fi
}

main "$@"
