#!/usr/bin/env bash
# post-merge から ACE subagent を起動するサンプル（Issue #367）
# 実運用では既存の post-merge フローへ追記するか、git hook の post-merge に配置する。

set -euo pipefail

readonly ENABLED_VALUE='1'

if [[ "${ACE_SUBAGENT_ENABLED:-0}" != "$ENABLED_VALUE" ]]; then
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

readonly REPO_ROOT=$(git rev-parse --show-toplevel)

# Git GUI や CI の merge では環境変数が空のことがある。リポジトリ内の
# .ace-capture/hook-env.sh に export ACE_GARDEN_WALL_PATHS=... 等を書き、ここで source する。
readonly HOOK_ENV_FILE="${REPO_ROOT}/.ace-capture/hook-env.sh"
if [[ -f "$HOOK_ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$HOOK_ENV_FILE"
fi

readonly RUNNER="${REPO_ROOT}/scripts/ace/run-subagent.sh"

if [[ ! -x "$RUNNER" ]]; then
  echo "post-merge ace: 実行ファイルが見つかりません: $RUNNER" >&2
  exit 0
fi

mkdir -p "${REPO_ROOT}/.ace-capture"
# 実運用ではログローテーションや ACE_GARDEN_WALL_PATHS の継承を確認すること。
nohup "$RUNNER" >>"${REPO_ROOT}/.ace-capture/post-merge.log" 2>&1 &
