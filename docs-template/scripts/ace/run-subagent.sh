#!/usr/bin/env bash
# ACE autonomous キャプチャ — worktree 上で subagent を起動するテンプレート（Issue #367）
# 使用法: リポジトリルートから scripts/ace/run-subagent.sh（コピー先に合わせて調整）
# 前提: ACE_GARDEN_WALL_PATHS が設定されていること（未設定なら即終了）
#
# ロックの腐敗: 異常終了で instance.lock が残った場合は手動で
#   rmdir .ace-capture/instance.lock
# を実行してから再試行する（中にファイルが無い空ディレクトリであること）。

set -euo pipefail

readonly ACE_SUBAGENT_LOCK_DIR_RELATIVE='.ace-capture'
readonly ACE_LOCK_INSTANCE_DIR_NAME='instance.lock'
readonly ACE_WORKTREE_PARENT_RELATIVE='.ace-capture/worktrees'
readonly ACE_WORKTREE_DIR_PREFIX='ace-capture-'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo 'ace-capture: git リポジトリ内で実行してください。' >&2
  exit 2
fi

readonly REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if [[ -z "${ACE_GARDEN_WALL_PATHS:-}" ]]; then
  echo 'ace-capture: ACE_GARDEN_WALL_PATHS が未設定です。ホワイトリストを設定してから再実行してください。' >&2
  exit 2
fi

readonly LOCK_DIR="${REPO_ROOT}/${ACE_SUBAGENT_LOCK_DIR_RELATIVE}"
readonly LOCK_INSTANCE="${LOCK_DIR}/${ACE_LOCK_INSTANCE_DIR_NAME}"
mkdir -p "$LOCK_DIR"

if ! mkdir "$LOCK_INSTANCE" 2>/dev/null; then
  echo 'ace-capture: 別プロセスが実行中のためスキップします。' >&2
  exit 0
fi

release_lock() {
  rmdir "$LOCK_INSTANCE" 2>/dev/null || true
}
trap release_lock EXIT

readonly WT_PARENT="${REPO_ROOT}/${ACE_WORKTREE_PARENT_RELATIVE}"
mkdir -p "$WT_PARENT"
readonly WT_NAME="${ACE_WORKTREE_DIR_PREFIX}$(date +%s)"
readonly WT_PATH="${WT_PARENT}/${WT_NAME}"
readonly BRANCH_BASE="${ACE_CAPTURE_BASE_BRANCH:-develop}"

git worktree add -b "$WT_NAME" "$WT_PATH" "$BRANCH_BASE"

remove_worktree() {
  git worktree remove --force "$WT_PATH" >/dev/null 2>&1 || true
}

if [[ "${ACE_KEEP_WORKTREE:-0}" == "1" ]]; then
  trap release_lock EXIT
else
  trap 'remove_worktree; release_lock' EXIT
fi

echo "ace-capture: worktree を作成しました: $WT_PATH"

if [[ -n "${ACE_CLAUDE_CMD:-}" ]]; then
  echo 'ace-capture: ACE_CLAUDE_CMD を実行します（同期）。実運用では nohup … disown への置換を推奨します。'
  (
    cd "$WT_PATH"
    export ACE_CAPTURE_WORKTREE="$WT_PATH"
    export ACE_GARDEN_WALL_PATHS
    bash -c "$ACE_CLAUDE_CMD"
  )
else
  echo 'ace-capture: ACE_CLAUDE_CMD が未設定のため、コマンドはスキップされました。'
  echo '  例: export ACE_CLAUDE_CMD='\''claude -p --agent ace-capture --permission-mode bypassPermissions "..."'\'''
fi

if [[ "${ACE_KEEP_WORKTREE:-0}" == "1" ]]; then
  echo "ace-capture: ACE_KEEP_WORKTREE=1 のため worktree を残します: $WT_PATH"
fi
