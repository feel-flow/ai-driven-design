#!/usr/bin/env bash
# ============================================================================
# codex-review.sh — Codex cross-model レビューの薄いシム
# ============================================================================
#
# 本体は何もしない。`multi-agent.sh --task review --cli codex-cli` へ委譲する。
#
# ## なぜシムなのか
#
# 以前このファイルは各プロジェクトが自前で持つ 80〜390 行のラッパーで、
# `review-common.sh` / `review-prompts.sh` と合わせて 3 本 1 組だった。同じ仕事を
# オーケストレータと二重に持っていたため、消費プロジェクトごとにコピーが分岐し、
# 依存欠落で起動できないコピーや、下記の stdin の罠を踏むコピーが生まれた
# （Issue #406）。実装をオーケストレータ 1 本へ寄せ、この入口は名前と
# コマンドラインの互換だけを担う。
#
# ## 直接 `codex exec` を叩かない理由（重要）
#
# codex は stdin が TTY でないと「追加入力」として読みに行き、EOF が来るまで
# ブロックする。stdout には何も出ないので、外からはハングと区別がつかない。
# 実測（codex-cli 0.144.5）:
#
#   codex exec -s read-only "..." </dev/null  → rc=0 で完走
#   同上・stdin を開いたまま同期実行          → EOF が来るまで戻らない
#
# 見分け方に注意: "Reading additional input from stdin..." は**成功時にも出る**ので、
# その行の有無では判別できない。ハングを示すのは **stdout が 0 バイトのまま**という
# 事実の方。所要時間はモデル側の待ち時間で変動するので基準にしない。
#
# multi-agent.sh は `run_with_timeout` 経由で CLI を起動し、そこは
# `"$@" >"$out_file" &` と**非同期**なので、POSIX により非対話シェルの非同期
# リストの stdin は /dev/null に割り当てられる。委譲している限りこの罠は
# 構造的に起きない。`tests/review-wrapper-shim/` がこのファイルに
# 「AI CLI を直接起動しないこと」を機械的に課している。
#
# ## 受け付けないものは黙って捨てない
#
# シムは薄いので、旧ラッパーが持っていた機能の大半を持たない。渡されたものを
# 黙って無視すると、利用者は指定したつもりのまま既定設定でレビューが走り、
# 成果物からもログからも判別できない（ACE-70-2 が記録した実害と同じ形）。
# 未対応のオプションは非 0 で拒否し、正規の経路を案内する。旧ラッパーの環境変数は、
# 写せるものは写して 1 行通知し、写せないものだけ拒否する（下記）。
#
# ## 使い方
#
#   bash scripts/codex-review.sh [--base <branch> | --staged] [--reviewers a,b,c]
#                                [--exclude-reviewers a,b,c] [--list-reviewers]
#                                [--timeout <秒>] [--dry-run]
#
#   SKIP_CODEX_REVIEW=1  レビューを実行せず成功終了する（pre-commit の逃がし弁）
#
#   終了コード: 0 = 完走 or 意図的なスキップ（小 diff / SKIP_CODEX_REVIEW）
#               2 = 入力の誤り（未対応オプション・不正な env）
#               3 = diff が大きすぎてレビューできない（成功と区別する）
#               その他 = 委譲先の終了コードをそのまま返す
#     **リテラル `1` のみ**を見る。`true` / `yes` では走る。既存の各プロジェクト実装と
#     同じ挙動で、値の解釈を広げると「どの値なら効くのか」が実装ごとに分かれるため、
#     互換のまま狭く保つ。判断の記録であって、うっかりではない。
#     skip はこのファイルの最初の分岐で短絡するので、skip したときは旧 env
#     （CODEX_MODEL 等）の写像・拒否の通知も出ない。走らせない実行について
#     設定の話をしても行動につながらないため、意図的にこの順序にしている。
#
#   同じオプションを 2 回渡した場合（`--base a --base b`）は両方そのまま委譲し、
#   オーケストレータ側の last-wins に従う。一般的な CLI 慣習どおりだが、最初の指定は
#   黙って捨てられる。ここで重複を検出して拒否すると、`--base` を既定で足す
#   ラッパーの上からもう一度指定する、という実在の使い方を壊すのでそのままにする。
#
#   モデル / reasoning effort の指定は toolkit の正規経路を使う:
#     MULTI_AGENT_MODEL_CODEX_CLI=<model>     モデルを明示する
#     MULTI_AGENT_CODEX_PROFILE=<profile>     ~/.codex/<name>.config.toml を層に重ねる
#     MULTI_AGENT_CODEX_REASONING_EFFORT=<effort>  effort だけを明示する
#   （両者は同時指定できない。詳細は skills/multi-review/SKILL.md の「モデル選択」）
#
#   旧ラッパーの env は写す（黙殺しない。1 行通知する）:
#     CODEX_MODEL             → MULTI_AGENT_MODEL_CODEX_CLI
#     CODEX_DEFAULT_REVIEWERS → 既定の観点（--reviewers 明示時はそちらが優先）
#     CODEX_REASONING_EFFORT  → MULTI_AGENT_CODEX_REASONING_EFFORT
# ============================================================================

set -euo pipefail

SCRIPT_NAME="$(basename "$0")"

# ── オーケストレータの解決 ──────────────────────────────────────────────────────
#
# 探索順は FF_DEV_TOOLKIT_ROOT（環境変数）→ 同じディレクトリのサイドカー
# `.ff-dev-toolkit-root`（setup が書く）。どちらも解決できなければ推測で走らずに
# 落とす — 「オーケストレータが無い」を「レビュー結果が空」に化けさせない。
#
# **このファイルへパスを焼き込まない**理由が 3 つある:
#   1. 焼き込むと配置後のファイルがマシン固有になる。配置先の scripts/ は通常
#      git 管理下なので、開発者ごとに違う行がコミットされ、他人の環境や CI で壊れる。
#   2. 焼き込み値は toolkit のバージョン付きインストール先を含むため、更新のたびに
#      内容が変わる。冪等配置の比較が毎回不一致になり、利用者の .bak が上書きされ続ける。
#   3. 置換で生成するのはシェルコードなので、パスに含まれる & や $ や " が
#      構文を壊す（実測で `/a&b/` が代入行を破壊した）。
# サイドカーは**素のデータ 1 行**なので、どれも起こらない。読み取りも read -r だけで
# eval を通さない。
#
# 固定パスの当て推量もしない。実インストール先は
# ~/.claude/plugins/cache/<marketplace>/ff-dev-toolkit/<version>/scripts/ の形で
# **複数バージョンが同居する**（実測で 0.9.0 / 0.14.0 / 0.19.0 が並存）。glob で
# 拾うと古い版を静かに選びうる。
FF_ROOT_SIDECAR_NAME=".ff-dev-toolkit-root"

# 候補が「本当に multi-agent.sh か」まで見る。存在だけを見ると、0 バイトのファイルや
# 無関係なスクリプトを掴んで **rc=0・出力ゼロ** で終わる — 元のバグと同じ signature に
# なる（実測: 0 バイトの multi-agent.sh を指すと、シムは何も出さず成功した）。
usable_orchestrator() {
  local f="$1"
  [ -f "$f" ] && [ -r "$f" ] && [ -s "$f" ] || return 1
  # オーケストレータであることの印。--task の 3 値は multi-agent.sh の中核契約で、
  # 別スクリプトに偶然含まれることは考えにくい。
  grep -q -- "--task" "$f" && grep -q -- "implement" "$f"
}

resolve_orchestrator() {
  local candidate sidecar sidecar_value
  local -a env_candidates=() candidates=()
  if [ -n "${FF_DEV_TOOLKIT_ROOT:-}" ]; then
    # skill 群は FF_DEV_TOOLKIT_ROOT を**プラグインルート**として定義し
    # ${FF_DEV_TOOLKIT_ROOT}/scripts/multi-agent.sh を叩く。scripts/ を直接指す
    # 使い方も許すため両方を候補にする（前者が正規形）。
    env_candidates=("${FF_DEV_TOOLKIT_ROOT}/scripts/multi-agent.sh"
                    "${FF_DEV_TOOLKIT_ROOT}/multi-agent.sh")
    candidates+=("${env_candidates[@]}")
  fi
  sidecar="$(dirname "$0")/${FF_ROOT_SIDECAR_NAME}"
  if [ -f "$sidecar" ]; then
    IFS= read -r sidecar_value < "$sidecar" || sidecar_value=""
    if [ -n "$sidecar_value" ]; then
      candidates+=("${sidecar_value}/multi-agent.sh")
    fi
  fi

  # 明示指定が使えないときに黙ってサイドカーへ落ちない。利用者が
  # FF_DEV_TOOLKIT_ROOT でローカルの改造版を指したのにパスを間違えた場合、
  # 落ちた先は**インストール済みの toolkit** で、出力は正常に見える。指定が
  # 効かなかったことに気づけないまま「改造が効かない」と結論することになる。
  if [ "${#env_candidates[@]}" -gt 0 ]; then
    local env_ok=false
    for candidate in "${env_candidates[@]}"; do
      if usable_orchestrator "$candidate"; then env_ok=true; break; fi
    done
    if [ "$env_ok" != "true" ]; then
      echo "ERROR: FF_DEV_TOOLKIT_ROOT が設定されていますが、使える multi-agent.sh がありません。" >&2
      for candidate in "${env_candidates[@]}"; do
        echo "       試したパス: ${candidate}" >&2
      done
      echo "       明示指定を黙って無視して別の toolkit で走ることはしません。" >&2
      return 2
    fi
  fi

  # bash 3.2 は set -u 下で空配列を "${a[@]}" と展開すると unbound variable で落ちる
  for candidate in ${candidates[@]+"${candidates[@]}"}; do
    if usable_orchestrator "$candidate"; then printf '%s\n' "$candidate"; return 0; fi
  done
  return 1
}

usage() {
  cat >&2 <<USAGE
${SCRIPT_NAME} — Codex cross-model レビュー（multi-agent.sh への薄いシム）

  --base <branch>       差分の基準ブランチ
  --staged             staged index だけをレビュー（--base と排他）
  --reviewers a,b,c     観点をカンマ区切りで指定（--perspective へ展開される）
  --exclude-reviewers a,b,c
                        観点をカンマ区切りで除外（--exclude-perspective へ展開される）
  --list-reviewers      利用できる review 観点を一覧表示する

    ⚠ --reviewers / --exclude-reviewers の観点名は toolkit の perspective 名であり、旧ラッパーが使っていた
      Claude エージェント名とは**別体系**。存在しない名前は multi-agent.sh が
      非 0 で拒否する（黙って既定へ落ちることはない）。
        旧 code-reviewer          → code-review
        旧 silent-failure-hunter  → error-handler-hunt
        旧 type-design-analyzer   → type-design-analysis
        旧 comment-analyzer       → comment-analysis
        旧 pr-test-analyzer       → test-analysis
        旧 code-simplifier        → code-simplification
      実在する review 観点: code-review / code-simplification / comment-analysis /
      comprehensive-review / error-handler-hunt / security-analysis /
      test-analysis / type-design-analysis

  --timeout <秒>        CLI ごとの制限時間

  上記は --opt=value 形式でも渡せる。パッケージマネージャが挟む --
  （pnpm は透過、npm は除去）は位置を問わず読み飛ばす。
  --dry-run             実行せずプランだけ表示する
  --help                このヘルプ

  SKIP_CODEX_REVIEW=1   レビューを実行せず成功終了する

旧ラッパーの env は写して 1 行通知する（黙って無視しない）:
  CODEX_MODEL             → MULTI_AGENT_MODEL_CODEX_CLI（新が設定済みなら新を優先）
  CODEX_DEFAULT_REVIEWERS → 既定の観点（--reviewers を明示した場合はそちらが優先）
  CODEX_REASONING_EFFORT  → MULTI_AGENT_CODEX_REASONING_EFFORT
                            （新が設定済みなら新を優先）

モデル指定は MULTI_AGENT_MODEL_CODEX_CLI / MULTI_AGENT_CODEX_PROFILE、
effort 単体指定は MULTI_AGENT_CODEX_REASONING_EFFORT を使う。
ここに無いオプションは、直接 multi-agent.sh を呼んで指定する:
  bash <toolkit>/scripts/multi-agent.sh --task review --cli codex-cli ...
USAGE
}

# ── 引数の解釈 ──────────────────────────────────────────────────────────────────
ORCH_ARGS=(--task review --cli codex-cli)
REVIEWERS_GIVEN=0
TIMEOUT_GIVEN=0
LIST_ONLY=0
# diff サイズの歯止めを測るための基準。--base が明示されたときだけ埋まる。
BASE_FOR_SIZE=""
STAGED_GIVEN=0

# 観点リスト（カンマ区切り）を --perspective の繰り返しへ展開する。
# --reviewers と CODEX_DEFAULT_REVIEWERS の**両方**から呼ぶため関数にしてある。
# 片方にしか写像を掛けないと、env 経由の指定だけが旧名のまま委譲されて
# 「perspective が存在しない」で 1 件も走らない。
# 第 2 引数はエラーメッセージ用の呼び出し元表示。
# $3 は付けるフラグ（--perspective / --exclude-perspective）。包含と除外で写像表を
# 共有する。別々に持つと、片方だけ改称に追従しない形が生まれる。
append_perspectives() {
  # `a, b, c` を許容する。除去しないと 2 件目以降が ' b' となり、写像表の case を
  # 1 つも通らないまま**通知も出ずに**委譲され、オーケストレータ側で
  # 「perspective ' comment-analyzer' does not exist」で全滅する（写像すると
  # 約束した名前が、写像されずに存在しない名前として拒否される形）。
  _list="${1//[[:space:]]/}"
  _origin="$2"
  case "$_list" in
    ""|*,,*|,*|*,)
      echo "ERROR: ${_origin} の値が空、または空の要素を含んでいます: '${_list}'" >&2
      echo "       観点を 1 つ以上、カンマ区切りで指定してください（例: code-review）。" >&2
      exit 2 ;;
  esac
  while [ -n "$_list" ]; do
    _item="${_list%%,*}"
    if [ "$_item" = "$_list" ]; then _list=""; else _list="${_list#*,}"; fi
    [ -n "$_item" ] || continue
    # 旧ラッパーが使っていた Claude エージェント名を、toolkit の perspective 名へ
    # 写す。ヘルプに対応表を載せただけでは足りない — 既存の運用手順やコピペされた
    # コマンドはそのまま旧名を渡してくるので、変換しないと「対応表は示すのに
    # 実際には拒否される」形になる。**黙って読み替えず 1 行通知する**（利用者の
    # 指定と実際に走った観点が食い違ったまま気づけない状態にしない）。
    # toolkit が文書化している改称は 6 件。3 件だけ写すと、文書どおりの
    # 6 件指定コマンドが未対応の 1 件目で拒否され**レビューが 1 件も走らない**
    # （実測: `perspective 'comment-analyzer' does not exist` で rc=1）。
    # 対応表は COPILOT_AGENTS.md / REVIEW_AGENT_CREATION_GUIDE.md と同じ 6 件。
    case "$_item" in
      code-reviewer)         _mapped="code-review" ;;
      silent-failure-hunter) _mapped="error-handler-hunt" ;;
      type-design-analyzer)  _mapped="type-design-analysis" ;;
      comment-analyzer)      _mapped="comment-analysis" ;;
      pr-test-analyzer)      _mapped="test-analysis" ;;
      code-simplifier)       _mapped="code-simplification" ;;
      *)                     _mapped="$_item" ;;
    esac
    if [ "$_mapped" != "$_item" ]; then
      echo "ℹ️  旧観点名 '${_item}' を '${_mapped}' として解釈しました（perspective 名へ改称済み）。" >&2
    fi
    ORCH_ARGS+=("${3:---perspective}" "$_mapped")
  done
}

while [ $# -gt 0 ]; do
  case "$1" in
    --)
      # pnpm は版によって `pnpm run x -- --opt` の `--` をスクリプトへ**透過する**
      # （実測: pnpm 9.15.9 で argv[1] が '--'。npm は除去する）。各リポジトリの手順書は
      # `pnpm code-review:codex -- --base develop` の形なので、これを不明な引数として
      # 拒否すると**文書どおりのコマンドが動かない**。`--` は利用者が渡した引数ではなく
      # パッケージマネージャが挟むものなので、「黙って捨てない」の対象として不適切。
      # 位置は pnpm の版や呼び出し方で変わりうるので、先頭に限定せず読み飛ばす。
      shift
      ;;
    --base=*|--timeout=*)
      # GNU 慣用の `--opt=value`。旧ラッパーが受けていたので手順書やスクリプトに残りうる。
      _opt="${1%%=*}"
      _val="${1#*=}"
      if [ -z "$_val" ]; then
        # 空値を読み飛ばすと黙って既定（自動検出の base / 既定 timeout）で走る。
        echo "ERROR: ${_opt} には値が必要です。" >&2
        usage
        exit 2
      fi
      [ "$_opt" = "--base" ] && BASE_FOR_SIZE="$_val"
      [ "$_opt" = "--timeout" ] && TIMEOUT_GIVEN=1
      ORCH_ARGS+=("$_opt" "$_val")
      shift
      ;;
    --reviewers=*)
      # 空値・空要素は append_perspectives が拒否する（空白区切り側と同じ経路）。
      append_perspectives "${1#*=}" "--reviewers"
      REVIEWERS_GIVEN=1
      shift
      ;;
    --base|--timeout)
      if [ $# -lt 2 ]; then
        echo "ERROR: ${1} には値が必要です。" >&2
        usage
        exit 2
      fi
      [ "$1" = "--base" ] && BASE_FOR_SIZE="$2"
      [ "$1" = "--timeout" ] && TIMEOUT_GIVEN=1
      ORCH_ARGS+=("$1" "$2")
      shift 2
      ;;
    --staged)
      STAGED_GIVEN=1
      ORCH_ARGS+=(--staged)
      shift
      ;;
    --dry-run)
      ORCH_ARGS+=(--dry-run)
      shift
      ;;
    --list-reviewers)
      # 一覧はレジストリ（perspectives/<task>/*.md）が持つ。シムが独自の表を持つと、
      # 観点ファイルを足したときにシムだけ古くなる。委譲して出させる。
      # フラグにしておき、後段（skip / 旧 env / diff 閾値）を通さない。一覧を見たいだけ
      # なのに「--base が無い」で落ちたり、閾値次第で一覧が出ないまま成功終了したりする
      # のを避ける。
      LIST_ONLY=1
      shift
      ;;
    --exclude-reviewers)
      if [ $# -lt 2 ]; then
        echo "ERROR: --exclude-reviewers には値が必要です（例: --exclude-reviewers comment-analyzer）。" >&2
        exit 2
      fi
      append_perspectives "$2" "--exclude-reviewers" "--exclude-perspective"
      shift 2
      ;;
    --exclude-reviewers=*)
      append_perspectives "${1#*=}" "--exclude-reviewers" "--exclude-perspective"
      shift
      ;;
    --workdir|--workdir=*)
      # 委譲先に対応する概念が無い。黙って無視すると、指定したディレクトリとは別の
      # リポジトリの diff がレビューされる — 成果物を見ても取り違えに気づけない。
      echo "ERROR: ${SCRIPT_NAME} は --workdir を受け付けません。" >&2
      echo "       レビュー対象のリポジトリへ cd してから実行してください。" >&2
      exit 2
      ;;
    --reviewers)
      if [ $# -lt 2 ]; then
        echo "ERROR: --reviewers には値が必要です（例: --reviewers code-reviewer,silent-failure-hunter）。" >&2
        exit 2
      fi
      # カンマ区切りを 1 件ずつ --perspective へ展開する。multi-agent.sh 側は
      # --perspective の繰り返しで観点を絞る仕様なので、カンマのまま渡すと
      # 「そんな観点は無い」ではなく**観点名として 1 件**に見えてしまう。
      #
      # 分解は**パラメータ展開だけ**で行い、位置パラメータには触らない。初版は
      # IFS=',' にして `set -- $2 "${@:3}"` で並べ直していたが、これは後続の引数を
      # 連結してしまい（実測: `--reviewers a --timeout 420` が `--timeout 420` という
      # 1 引数になった）、対応しているはずの --timeout が「受け付けません」と
      # 拒否された。実 CLI 実行で初めて露見した — 単体で --reviewers を渡す
      # テストしか無かったため、他オプションと併用する形が検査されていなかった。
      # 空値・空要素を読み飛ばすと --perspective が 1 件も付かず、**既定の観点セットが
      # 黙って走る**。指定したつもりの利用者は、意図しない観点に課金される
      # （このファイルの冒頭が「黙って捨てない」と宣言している当のクラス）。
      append_perspectives "$2" "--reviewers"
      REVIEWERS_GIVEN=1
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "ERROR: ${SCRIPT_NAME} は '${1}' を受け付けません。" >&2
      echo "       対応オプションは --help で確認してください。" >&2
      echo "       それ以外は multi-agent.sh を直接呼んで指定してください:" >&2
      echo "         bash <toolkit>/scripts/multi-agent.sh --task review --cli codex-cli ${1} ..." >&2
      exit 2
      ;;
  esac
done

if [ "$STAGED_GIVEN" -eq 1 ] && [ -n "$BASE_FOR_SIZE" ]; then
  echo "ERROR: --staged と --base は同時に指定できません。レビュー範囲をどちらか一方にしてください。" >&2
  exit 2
fi

# ── 逃がし弁 ────────────────────────────────────────────────────────────────────
# pre-commit 構成が使う実在のつまみ。尊重しないと「skip したはずのレビューが走る」。
# 一覧だけの経路。skip / 旧 env / diff 閾値のいずれも通さずに委譲して終わる。
if [ "$LIST_ONLY" -eq 1 ]; then
  _resolve_rc=0
  ORCHESTRATOR="$(resolve_orchestrator)" || _resolve_rc=$?
  if [ "$_resolve_rc" -ne 0 ]; then
    echo "ERROR: multi-agent.sh が見つかりません。" >&2
    exit "$_resolve_rc"
  fi
  exec bash "$ORCHESTRATOR" --task review --list-perspectives
fi

if [ "${SKIP_CODEX_REVIEW:-}" = "1" ]; then
  echo "ℹ️  SKIP_CODEX_REVIEW=1 のため Codex レビューをスキップします。" >&2
  exit 0
fi

# ── 旧ラッパーの env を写す ────────────────────────────────────────────────────
# 旧ラッパーは CODEX_* を解釈していた。シムはこれらを直接は使わないので、設定された
# まま黙って走ると「指定したつもりの設定が効いていない」状態になる（ユーザー設定を
# 黙って上書きしていた ACE-70-2 と同じ形の実害）。
#
# 当初は一律 exit 2 で拒否していた。しかし移行にあたって消費リポジトリを実測したら
# **7 本すべてがこれらを設定しており**、拒否はそのまま「移行できない」を意味した。
# そこで黙殺と拒否の間に**写像 + 1 行通知**を置く。写せないものだけ拒否を残す。
#
# Issue #419 で effort 単体の正規入口を追加したため、旧 CODEX_REASONING_EFFORT も
# 1:1 で写せる。新旧が併存するときは新しい名前を優先し、どちらを使ったか通知する。
if [ -n "${CODEX_MODEL:-}" ]; then
  # 「新しい設定」は MULTI_AGENT_MODEL_CODEX_CLI **だけではない**。codex-cli の
  # モデル指定は (model | profile) の 2 つが排他で、アダプタは両方が立っていると
  # 非 0 で落ちる（codex-cli-adapter.sh の排他検査）。
  # profile を見ずに model を写すと、**最も正しく移行した人**——モデルと effort を
  # プロファイルへ束ねた人——だけが、自分では
  # 設定していない MULTI_AGENT_MODEL_CODEX_CLI との衝突で落ちる。
  # レジストリ（multi-agent.sh の get_cli_model_env_vars codex-cli）が宣言するうち、
  # モデルを選ぶ 2 つをまとめて「新しいモデル設定」として扱う。
  _new_model_setting=""
  if [ -n "${MULTI_AGENT_MODEL_CODEX_CLI:-}" ]; then
    _new_model_setting="MULTI_AGENT_MODEL_CODEX_CLI='${MULTI_AGENT_MODEL_CODEX_CLI}'"
  elif [ -n "${MULTI_AGENT_CODEX_PROFILE:-}" ]; then
    _new_model_setting="MULTI_AGENT_CODEX_PROFILE='${MULTI_AGENT_CODEX_PROFILE}'"
  fi
  if [ -n "$_new_model_setting" ]; then
    # 黙って旧が勝つと、移行途中の環境で古い設定が生き残る。
    echo "ℹ️  CODEX_MODEL と新しいモデル設定が両方あります。" >&2
    echo "    新しい ${_new_model_setting} を使い、CODEX_MODEL は無視します。" >&2
  else
    export MULTI_AGENT_MODEL_CODEX_CLI="$CODEX_MODEL"
    echo "ℹ️  CODEX_MODEL='${CODEX_MODEL}' を MULTI_AGENT_MODEL_CODEX_CLI として解釈しました（env 名を改称済み）。" >&2
  fi
fi

# 未設定と「設定済みだが空」を区別する（`${VAR+x}`）。モデルの空値は「指定なし」と
# 読むのが自然だが、**リストの空値は「計算結果が 0 件」**であり、読み飛ばすと既定の
# 観点セットが黙って走って課金される。同じ値をコマンドラインから渡した
# `--reviewers ""` は拒否しているので、env だけ通すのは同一コミット内での不整合でもある。
if [ "${CODEX_DEFAULT_REVIEWERS+x}" = x ]; then
  if [ "$REVIEWERS_GIVEN" -eq 1 ]; then
    # 明示指定が env の既定に負けると、--reviewers を渡した意味が消える。
    echo "ℹ️  --reviewers が明示されているため、CODEX_DEFAULT_REVIEWERS は無視します。" >&2
  else
    # 通知は**検証を通ってから**出す。先に出すと「解釈しました」の直後に
    # 「値が空です」で落ち、解釈されたのかされていないのかが読み手に分からない。
    append_perspectives "$CODEX_DEFAULT_REVIEWERS" "CODEX_DEFAULT_REVIEWERS"
    echo "ℹ️  CODEX_DEFAULT_REVIEWERS='${CODEX_DEFAULT_REVIEWERS}' を既定の観点として解釈しました。" >&2
  fi
fi

# effort は新しい単独入口へ 1:1 で写す。新旧が同時指定された場合は新を優先する。
if [ -n "${CODEX_REASONING_EFFORT:-}" ]; then
  if [ "${MULTI_AGENT_CODEX_REASONING_EFFORT+x}" = x ]; then
    echo "ℹ️  CODEX_REASONING_EFFORT と MULTI_AGENT_CODEX_REASONING_EFFORT が両方あります。" >&2
    echo "    新しい MULTI_AGENT_CODEX_REASONING_EFFORT='${MULTI_AGENT_CODEX_REASONING_EFFORT}' を使い、CODEX_REASONING_EFFORT は無視します。" >&2
  else
    export MULTI_AGENT_CODEX_REASONING_EFFORT="$CODEX_REASONING_EFFORT"
    echo "ℹ️  CODEX_REASONING_EFFORT='${CODEX_REASONING_EFFORT}' を MULTI_AGENT_CODEX_REASONING_EFFORT として解釈しました（env 名を改称済み）。" >&2
  fi
fi

# 旧ラッパーの timeout env。--timeout と同義なので写す。
# **明示指定が env に負けないこと**。委譲先は last-wins なので、後から足すと
# `--timeout 999` を渡しても env の値で走る（実測: 999 を指定して 321 秒になった）。
_num_or_die() { # $1: 値, $2: env 名 → 正規化した値を stdout へ
  case "$1" in
    ''|*[!0-9]*)
      echo "ERROR: ${2} は 0 以上の整数で指定してください（受け取った値: '${1}'）。" >&2
      echo "       黙って既定へ落とすと、歯止めを設定したつもりで全件走ります。" >&2
      exit 2 ;;
  esac
  # 数字だけでも大きすぎると shell の整数比較が壊れる。`[ 30 -lt 999…9 ]` は
  # 「integer expression expected」を出して rc=2 を返し、if の条件としては**偽**に
  # なる — つまり歯止めが黙って効かなくなる（実測でレビューが全件走った）。
  if [ "${#1}" -gt 18 ]; then
    echo "ERROR: ${2} が大きすぎます（${#1} 桁）。18 桁以内で指定してください。" >&2
    echo "       この範囲を超えると整数比較が成立せず、歯止めが黙って効かなくなります。" >&2
    exit 2
  fi
  # "00" のような先頭ゼロを 10 進として正規化する。文字列比較で "0" と区別すると、
  # 実効値 0 の歯止めが有効化され、あらゆる diff がスキップされる。
  # **`printf '%d'` は使えない** — bash は先頭ゼロを 8 進として解釈するため、
  # `010` が 8 になり、`008` は `invalid number` で落ちる（実測）。`10#` を付ける。
  echo "$((10#$1))"
}

# 閾値 env と同じく「未設定」と「設定済みだが空」を区別する。`-n` だけだと空値が
# 無言で捨てられ、設定したのに効かない状態になる（同じファイル内で扱いが割れる）。
if [ "${CODEX_REVIEW_TIMEOUT_S+x}" = x ]; then
  if [ "$TIMEOUT_GIVEN" -eq 1 ]; then
    echo "ℹ️  --timeout が明示されているため、CODEX_REVIEW_TIMEOUT_S は無視します。" >&2
  else
    _timeout_val="$(_num_or_die "$CODEX_REVIEW_TIMEOUT_S" CODEX_REVIEW_TIMEOUT_S)"
    echo "ℹ️  CODEX_REVIEW_TIMEOUT_S='${CODEX_REVIEW_TIMEOUT_S}' を --timeout として解釈しました。" >&2
    ORCH_ARGS+=(--timeout "$_timeout_val")
  fi
fi

# ── diff サイズの歯止め ──────────────────────────────────────────────────────────
# 旧ラッパーが持っていたコスト制御。**既定は無効**にしてある。既定で有効にすると、
# これまで走っていたレビューが黙ってスキップされる側へ倒れ、しかも「走らなかった」
# ことに気づく手がかりが無い。歯止めは明示的に入れてもらう。
# 未設定と「設定済みだが空」を区別する。`${VAR:-0}` は両方を 0 にするため、
# `CODEX_REVIEW_MIN_LINES=` が非数値として拒否されず**歯止めが黙って無効になる**。
# 設定したのに効かない、が最も気づきにくい形なので、設定済みなら空でも検証へ渡す。
_min_lines=0
_max_bytes=0
if [ "${CODEX_REVIEW_MIN_LINES+x}" = x ]; then
  _min_lines="$(_num_or_die "$CODEX_REVIEW_MIN_LINES" CODEX_REVIEW_MIN_LINES)"
fi
if [ "${CODEX_REVIEW_MAX_DIFF_BYTES+x}" = x ]; then
  _max_bytes="$(_num_or_die "$CODEX_REVIEW_MAX_DIFF_BYTES" CODEX_REVIEW_MAX_DIFF_BYTES)"
fi

if [ "$_min_lines" != "0" ] || [ "$_max_bytes" != "0" ]; then
  # 閾値を測るには基準が要る。--base が無いときの既定推論をここに持つと
  # オーケストレータと同じ推論の 2 つ目のコピーになるので、**解決できなければ拒否**する。
  # 利用者は歯止めを要求したのだから、守れないまま課金される実行を始めるより良い。
  if [ -z "$BASE_FOR_SIZE" ] && [ "$STAGED_GIVEN" -ne 1 ]; then
    echo "ERROR: diff サイズの歯止めが設定されていますが、比較の基準が分かりません。" >&2
    echo "       --base <branch> を明示してください（歯止めを外す場合は env を 0 にする）。" >&2
    exit 2
  fi
  # 測る範囲は**委譲先がレビューする範囲と同じ**にする。オーケストレータは
  # BASE...HEAD に加えて作業ツリーの変更もレビュー対象として扱う。BASE...HEAD だけを
  # 測ると、pre-commit（staged 未コミット）で「0 行」と判定してスキップし、
  # レビューされるはずの変更が静かに飛ぶ — このファイル冒頭が pre-commit を想定利用先
  # として挙げている以上、現実的な経路。
  _errf="$(mktemp "${TMPDIR:-/tmp}/codex-review-git.XXXXXX")" || { echo "ERROR: 一時ファイルを作成できませんでした。" >&2; exit 2; }
  if [ "$STAGED_GIVEN" -eq 1 ]; then
    _diff_label="staged index"
    _numstat="$(git diff --cached --numstat 2>"$_errf")" || {
      echo "ERROR: staged diff を測れませんでした。" >&2
      sed 's/^/       git: /' "$_errf" >&2
      rm -f "$_errf"
      exit 2
    }
  else
    _diff_label="base ${BASE_FOR_SIZE}"
    _numstat="$( { git diff --numstat "${BASE_FOR_SIZE}...HEAD" && git diff --numstat HEAD; } 2>"$_errf" )" || {
      echo "ERROR: diff を測れませんでした（基準: ${BASE_FOR_SIZE}）。" >&2
      sed 's/^/       git: /' "$_errf" >&2
      rm -f "$_errf"
      exit 2
    }
  fi
  # バイナリファイルは numstat が `-` を出す。awk の加算では 0 に化けるので、**行数では
  # 測れない**と判断する。測れないものを「小さい」と読んでスキップすると、200KB の
  # バイナリ追加が無言で飛ぶ。
  _unmeasurable=0
  case "$_numstat" in
    *"-	-	"*) _unmeasurable=1 ;;
  esac
  _lines="$(printf '%s\n' "$_numstat" | awk '{ a += $1; d += $2 } END { printf "%d", a + d }')"
  if [ "$STAGED_GIVEN" -eq 1 ]; then
    _bytes="$(git diff --cached 2>>"$_errf" | wc -c | tr -d ' ')"
  else
    _bytes="$( { git diff "${BASE_FOR_SIZE}...HEAD"; git diff HEAD; } 2>>"$_errf" | wc -c | tr -d ' ')"
  fi
  rm -f "$_errf"
  if [ -z "$_lines" ] || [ -z "$_bytes" ]; then
    echo "ERROR: diff を測れませんでした（範囲: ${_diff_label}）。" >&2
    exit 2
  fi
  if [ "$_min_lines" != "0" ] && [ "$_unmeasurable" -eq 1 ]; then
    echo "ℹ️  diff にバイナリ変更が含まれ行数で測れないため、CODEX_REVIEW_MIN_LINES によるスキップは行いません。" >&2
  elif [ "$_min_lines" != "0" ] && [ "$_lines" -lt "$_min_lines" ]; then
    echo "ℹ️  diff が ${_lines} 行で CODEX_REVIEW_MIN_LINES=${_min_lines} 未満のため、レビューをスキップします。" >&2
    exit 0
  fi
  if [ "$_max_bytes" != "0" ] && [ "$_bytes" -gt "$_max_bytes" ]; then
    # **上限超過は非 0 で終わる。** 「小さすぎるからスキップ」（MIN_LINES、exit 0）と
    # 「大きすぎてレビューできない」は別物で、後者を 0 で返すと呼び出し側から
    # 「レビュー成功」と区別できない。**最もレビューが要る大きな差分ほどゲートを
    # 素通りする**形になる（置き換え対象だった自前ラッパーは失敗扱いにしていた）。
    # 通したいなら閾値を上げるか 0 で無効化するという明示的な操作を要求する。
    echo "ERROR: diff が ${_bytes} バイトで CODEX_REVIEW_MAX_DIFF_BYTES=${_max_bytes} を超えるため、レビューを実行できません。" >&2
    echo "       レビューせずに通すのは危険なので非 0 で終了します（意図的なスキップとは区別する）。" >&2
    echo "       閾値を上げるか、CODEX_REVIEW_MAX_DIFF_BYTES=0 で無効化してください。" >&2
    exit 3
  fi
fi

# ── 委譲 ────────────────────────────────────────────────────────────────────────
_resolve_rc=0
ORCHESTRATOR="$(resolve_orchestrator)" || _resolve_rc=$?
if [ "$_resolve_rc" -ne 0 ]; then
  echo "ERROR: multi-agent.sh が見つかりません。" >&2
  echo "       探索順: FF_DEV_TOOLKIT_ROOT → $(dirname "$0")/${FF_ROOT_SIDECAR_NAME}" >&2
  if [ -f "$(dirname "$0")/${FF_ROOT_SIDECAR_NAME}" ]; then
    echo "       サイドカーは在りますが、指す先に multi-agent.sh がありません" >&2
    echo "       （toolkit を更新・移動した場合は setup-multi-agent.sh を再実行してください）。" >&2
  else
    echo "       サイドカーがありません。setup-multi-agent.sh を実行して配置し直すか、" >&2
    echo "       FF_DEV_TOOLKIT_ROOT を toolkit のプラグインルートへ向けてください。" >&2
  fi
  exit "$_resolve_rc"
fi

exec bash "$ORCHESTRATOR" "${ORCH_ARGS[@]}"
