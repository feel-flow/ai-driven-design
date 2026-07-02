#!/bin/bash
# ────────────────────────────────────────────────────────────
# review-level.sh — Risk-Based Workflow のレビューレベル判定（Issue #454）
# ────────────────────────────────────────────────────────────
# 変更の規模・種別からレビュー深度を 3 段階で判定する。
# 判定は「推奨」であり、push やマージを機械的にブロックしない
# （強制ゲートは .husky/pre-push の quality:local が担う）。
#
# レベル定義:
#   Level 1（軽量）: ドキュメント（Markdown）のみ かつ 合計 ≤ LIGHT_MAX 行
#                    → Toolkit セルフチェックのみ・Codex 省略可・ACE は知見があるときのみ
#   Level 2（標準）: 上記以外で 合計 ≤ STANDARD_MAX 行
#                    → 現行標準（Toolkit + Codex cross-model）
#   Level 3（重点）: 合計 > STANDARD_MAX 行、またはセンシティブパス
#                    （scripts/ .husky/ .github/ mcp/src/ package.json 等）に触れる変更
#                    → Toolkit + Codex 必須、multi-review 併用を推奨
#
# Usage:
#   bash scripts/review-level.sh [--base <branch>] [--quiet]
#     --base <branch>  比較基準ブランチ（default: develop、REVIEW_BASE_BRANCH でも上書き可）
#     --quiet          レベル番号（1|2|3）のみを stdout に出力（スクリプト連携用）
#
# Env:
#   REVIEW_LEVEL_LIGHT_MAX_LINES=50     Level 1 の行数上限（追加+削除）
#   REVIEW_LEVEL_STANDARD_MAX_LINES=400 Level 2 の行数上限（PR サイズ 400 行ルールと同値）
#
# Exit: 0（判定成功）/ 2（使用方法・git エラー）
# ────────────────────────────────────────────────────────────

set -euo pipefail

DEFAULT_LIGHT_MAX_LINES=50
DEFAULT_STANDARD_MAX_LINES=400

# センシティブパス: 行数によらず Level 3（PR #449 / #456 でこの領域の潜伏バグが実証されたため）
# 対象: (a) 実行系ディレクトリ（scripts/ .husky/ .github/ mcp/src/ docs-template/scripts/）、
#       (b) すべてのシェルスクリプト（*.sh — 配置場所を問わず実行リスクを持つ）、
#       (c) package.json（どの階層でも）、(d) ルート直下の設定・コードファイル
SENSITIVE_PATH_PATTERN='^(scripts/|\.husky/|\.github/|mcp/src/|docs-template/scripts/)|\.sh$|(^|/)package\.json$|^[^/]+\.(json|jsonc|yaml|yml|ts|mjs|cjs|js)$'

# 生成物・lockfile は規模判定から除外（review-common.sh と同基準）
GENERATED_PATH_PATTERN='(^|/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$|\.generated\.'

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
}

# 正の整数 env を厳密に解釈（不正値は既定値へフォールバックし警告）
parse_positive_int_env() {
  local raw="${1:-}" default_value="$2" env_name="$3"
  if [ -z "$raw" ]; then
    echo "$default_value"
    return 0
  fi
  if echo "$raw" | grep -qE '^[0-9]+$' && [ "$raw" -ge 1 ]; then
    echo "$raw"
  else
    echo "review-level: ${env_name}=\"${raw}\" は無効のため、既定値 ${default_value} を使います。" >&2
    echo "$default_value"
  fi
}

BASE_BRANCH="${REVIEW_BASE_BRANCH:-develop}"
QUIET=false

while [ $# -gt 0 ]; do
  case "$1" in
    --base)
      if [ $# -lt 2 ]; then
        echo "ERROR: --base にはブランチ名が必要です" >&2
        exit 2
      fi
      BASE_BRANCH="$2"
      shift 2
      ;;
    --quiet)
      QUIET=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: 不明なオプション: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: git リポジトリ内で実行してください" >&2
  exit 2
fi

LIGHT_MAX="$(parse_positive_int_env "${REVIEW_LEVEL_LIGHT_MAX_LINES:-}" "$DEFAULT_LIGHT_MAX_LINES" "REVIEW_LEVEL_LIGHT_MAX_LINES")"
STANDARD_MAX="$(parse_positive_int_env "${REVIEW_LEVEL_STANDARD_MAX_LINES:-}" "$DEFAULT_STANDARD_MAX_LINES" "REVIEW_LEVEL_STANDARD_MAX_LINES")"

# --no-renames: リネームを add+delete に分解する。リネーム表記（docs/{old.md => new.md}）は
# 拡張子分類とセンシティブパス前方一致の両方をすり抜けるため（行数は増えるが判定は安全側）
if ! NUMSTAT="$(git diff --numstat --no-renames "${BASE_BRANCH}...HEAD" 2>&1)"; then
  echo "ERROR: ${BASE_BRANCH} との diff 取得に失敗しました: ${NUMSTAT}" >&2
  exit 2
fi

TOTAL_LINES=0
DOC_FILES=0
CODE_FILES=0
SENSITIVE_FILES=""

while IFS="$(printf '\t')" read -r added deleted filepath; do
  [ -z "${filepath:-}" ] && continue
  # 生成物・lockfile は判定から除外
  if echo "$filepath" | grep -qE "$GENERATED_PATH_PATTERN"; then
    continue
  fi
  # バイナリは numstat が "-" を返す → 行数 0 としてファイル種別のみ判定
  [ "$added" = "-" ] && added=0
  [ "$deleted" = "-" ] && deleted=0
  TOTAL_LINES=$((TOTAL_LINES + added + deleted))

  case "$filepath" in
    *.md) DOC_FILES=$((DOC_FILES + 1)) ;;
    *)    CODE_FILES=$((CODE_FILES + 1)) ;;
  esac

  if echo "$filepath" | grep -qE "$SENSITIVE_PATH_PATTERN"; then
    SENSITIVE_FILES="${SENSITIVE_FILES}${SENSITIVE_FILES:+ }${filepath}"
  fi
done <<EOF
$NUMSTAT
EOF

TOTAL_FILES=$((DOC_FILES + CODE_FILES))

if [ "$TOTAL_FILES" -eq 0 ]; then
  if [ "$QUIET" = true ]; then
    echo "1"
  else
    echo "Review Level: 1（軽量）"
    echo "Reason: ${BASE_BRANCH} との差分なし（または生成物のみ）"
  fi
  exit 0
fi

LEVEL=2
REASON=""

if [ -n "$SENSITIVE_FILES" ]; then
  LEVEL=3
  REASON="センシティブパスに変更あり: $(echo "$SENSITIVE_FILES" | tr ' ' '\n' | head -3 | tr '\n' ' ')"
elif [ "$TOTAL_LINES" -gt "$STANDARD_MAX" ]; then
  LEVEL=3
  REASON="合計 ${TOTAL_LINES} 行 > ${STANDARD_MAX} 行"
elif [ "$CODE_FILES" -eq 0 ] && [ "$TOTAL_LINES" -le "$LIGHT_MAX" ]; then
  LEVEL=1
  REASON="ドキュメントのみ ${TOTAL_LINES} 行 ≤ ${LIGHT_MAX} 行"
else
  LEVEL=2
  REASON="合計 ${TOTAL_LINES} 行 ≤ ${STANDARD_MAX} 行、センシティブパスなし"
fi

if [ "$QUIET" = true ]; then
  echo "$LEVEL"
  exit 0
fi

case "$LEVEL" in
  1) LABEL="軽量"; RECOMMEND="Toolkit セルフチェックのみ（Codex 省略可）。ACE は知見があるときのみ" ;;
  2) LABEL="標準"; RECOMMEND="Toolkit + Codex cross-model（現行標準）" ;;
  3) LABEL="重点"; RECOMMEND="Toolkit + Codex 必須。multi-review（bash scripts/multi-review.sh）の併用を推奨" ;;
esac

echo "Review Level: ${LEVEL}（${LABEL}）"
echo "Reason: ${REASON}"
echo "Files: ${TOTAL_FILES}（docs: ${DOC_FILES} / code: ${CODE_FILES}）, Lines: ${TOTAL_LINES}（base: ${BASE_BRANCH}）"
echo "推奨レビュー: ${RECOMMEND}"
exit 0
