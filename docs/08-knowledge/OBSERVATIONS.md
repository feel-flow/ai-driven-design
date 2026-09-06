# 振り返り観測台帳（Retrospective Observations）

> **運用の正本**: ff-dev-toolkit プラグインの `skills/retrospective/SKILL.md` の「観測の記録 — 観測台帳（起票の前段バッファ）」。本ファイルは `/retrospective` が記録する Problem / Keep 観測の蓄積バッファであり、手順・閾値・承認境界はスキル側だけが定義する（ここへ複製しない）。
>
> - 記録・畳み込み（同一性の判定）・昇格閾値・特急レーン・archived の条件・コミット規約は、すべてスキル側の規定に従う。**数値や判定基準を本ファイルへ複製しない** — 契約ゲートが固定しているのはスキル側の規定と、下の `Status` 値域行（本体と配布テンプレの一致・所在の接頭辞）だけで、それ以外にここへ写した規則は古くなっても検出されない
> - Frontmatter は付与しない（機械管理の蓄積ファイルで、ACE Playbook の分割ファイルと同じ扱い。`docs/MASTER.md` §Frontmatter の例外注記を参照）
> - 台帳はリポジトリごとに持つ。このファイルが無い場合、`/retrospective` がプラグインの `docs-template/08-knowledge/OBSERVATIONS.md` から作成する

## エントリ形式

新規エントリは次の形式で「エントリ一覧」の末尾へ追記する（ID は `OBS-<3 桁連番>`。既存の最大連番 +1）:

```markdown
<a id="obs-XXX"></a>

### OBS-XXX: [検索可能な主張 1 文のタイトル]

| Kind | problem または keep | Count | 1 |
| First | YYYY-MM-DD | Last | YYYY-MM-DD |
| Status | active | Issue | なし |

[本文 1〜3 文。1 文目 = 主張。problem / keep の文形と Count の意味論はスキル側「記録手順」が正本 — ここへ複製しない]

- YYYY-MM-DD: [1 行の実測メモ]（初回）

---
```

- メタ 3 行は行頭のパイプ区切りで書く（ACE Playbook のコンパクト正準フォーマットと同じ機械可読性の担保）
- `Status` の値域: `active`（蓄積中）/ `promoted`（Issue 昇格済み。`Issue` にリポジトリ修飾の発行番号 `owner/repo#N` を書く）/ `mitigated`（対策済み。対策が別の場所に定義済みのため昇格を見送った。`Issue` に対策の所在を `owner/repo#N` / `skill:<スキル名>` / `doc:<path>#<アンカー>` の書式で書く。条件の正本はスキル側）/ `archived`（休眠。条件の正本はスキル側。再発したら `active` へ戻す）
- 観測メモは再発のたびに 1 行追記する（セッション固有の長い叙述は書かない — 詳細が必要になるのは昇格時で、その時点の Issue 本文に書けばよい）

## エントリ一覧

<a id="obs-001"></a>

### OBS-001: Issue 棚卸しは、クローズ判定の前に全 Issue の主張を統合ブランチの実ファイル・設定へ一括照合すると解消済み・重複が機械的に見つかる

| Kind | keep | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Issue の本文を読むだけで判断せず、各 Issue が指す grep パターン・行数・設定値・関連 PR の state を 1 つの Bash で develop に対して照合してからクローズ判定に入る。本文の記述が古いまま残る Issue（行数・件数・前提の CI）は照合で初めて解消済みと分かる。

- 2026-09-06: open 37 件の棚卸しで、照合により 7 件（解消済み 4 / 重複 2 / 前提消失 1）をクローズ判定できた。照合なしでは #372（lint 緑化済み）と #288（GitHub Actions 廃止）は本文どおり有効に見えた（初回）

---

<a id="obs-002"></a>

### OBS-002: 30 件超の Issue 本文を 1 つの Bash ループで取得すると出力が persisted-output へ退避され、読み直しに複数ターンを要する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

多数の Issue 本文を一括取得すると出力上限を超えて別ファイルに落ち、Read を分割して読み直す往復が発生する → 本文はスクラッチパッドのファイルへ直接書き出し、最初の出力はタイトル・ラベル・日付の一覧に絞る。

- 2026-09-06: 33 件の `gh issue view` 出力（約 80KB）が退避され、Read 2 回で読み直した（初回）

---

<a id="obs-003"></a>

### OBS-003: 作業対象と無関係なプラグインの SessionStart hook が大容量コンテキストを注入し、セッション冒頭のコンテキストを消費する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Vercel を使わないリポジトリでも Vercel プラグインの SessionStart hook が約 53KB の知識グラフを注入する → プラグインの hook 発火条件をプロジェクトの依存（`vercel` / `next` の有無）で絞れるかを、再発が続いたらプラグイン側へ提案する。

- 2026-09-06: ai-spec-driven-development（Vercel 依存なし）のセッション開始で 53.2KB の注入が persisted-output に退避された（初回）

---

<a id="obs-004"></a>

### OBS-004: PLAYBOOK を文字列パッチで更新するとき、エントリ境界を終端 `---` で切ると終端欠落エントリで隣のエントリまで範囲が伸びる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

旧形式エントリには終端 `---` を持たないものが混在するため、`---` を境界にした Helpful カウンター更新は次エントリの同名行まで巻き込んで一致数が合わなくなる → 境界は次の `<a id="ace-` アンカーで切り、書き換え前に一致行数が 1 であることを assert する。

- 2026-09-06: ACE-484-3 の Helpful +1 で assert が 2 回失敗し、境界をアンカーに変えて 3 回目で通った（初回）

---

<a id="obs-005"></a>

### OBS-005: ゲート通過を記録する仕組みが無いリポジトリでは、/close-issue の鮮度照合が毎回「判定不能」になる

| Kind | problem | Count | 3 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#515 |

`quality:local` がゲート記録（`record-gate-head.sh` 相当）を書かないため、`check-merge-freshness.sh` は実測対象を特定できず exit 2 を返し、実測とマージの窓は人手の再実行で埋めることになる → 再発が続けば、`quality:local` の末尾でゲート記録を書くか、pre-push hook に記録を組み込むことを本リポジトリの Issue として検討する。

- 2026-09-06: PR #498 の /close-issue で `REASON=実測対象の記録がありません`。直前に HEAD で quality:local を手動再実行して代替した（初回）
- 2026-09-06: PR #500 の /close-issue でも同じ REASON。fix commit 直前に quality:local を手動実行して代替（再発）
- 2026-09-06: PR #502 の /close-issue でも同じ REASON（3 回目・閾値到達）。マージ直前の HEAD で quality:local を手動再実行して代替
- 2026-09-06: 閾値到達により #515 へ昇格起票

---

<a id="obs-006"></a>

### OBS-006: Issue の AC に書く検証コマンドは、起票時に実行して「拾うべきものを拾う」ことを確かめてから書く

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

AC の grep を頭で組んで起票すると、検出式の穴（表記の必須化・境界の欠落）がそのまま「残存なし」の緑になり、レビューで検出器ごと差し戻される → 起票前に既知の残存 1 件を含む状態でコマンドを実行し、その 1 件が検出されることを見てから AC に書く。

- 2026-09-06: Issue #499 の AC grep が `node.js` 表記を必須にしていて「Node 20+」を拾えず、Toolkit が Warning として検出器の是正を要求した（初回）

---

<a id="obs-007"></a>

### OBS-007: レビューシムのサイドカー不在を setup-multi-agent.sh で復旧すると、シム本体の上書きと `.bak` が作業ブランチの作業ツリーへ混入する

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

`scripts/codex-review.sh` が「multi-agent.sh が見つかりません」で落ちたとき、作業ブランチ上で setup を実行すると同梱シムの更新（数百行）と `codex-review.sh.bak` が現 PR と無関係な差分として作業ツリーに載る → setup の前後で `git status` を取り、生成差分は stash で退避して別 Issue へ切る（現 PR のレビュー対象は stash 後の差分で取り直す）。setup 側が既存シムを上書きせず差分だけ提示する形なら混入自体が起きない。

- 2026-09-06: PR #502 のセルフレビューで発生。stash 退避 + follow-up #503 起票で 1 往復（初回）

---

<a id="obs-008"></a>

### OBS-008: 旧形式エントリを抱えた PLAYBOOK に形式ゲートを allowlist 未初期化で当てると、既存分が全件赤になり新規追記の判定が埋もれる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#504 |

`/ace-curate` 4-f の `check-entry-format.ts` は allowlist 不在を strict として扱うため、初回導入（`/ace-setup` Step 3-b の `--init-allowlist`）を済ませていないリポジトリでは curate のたびに既存旧形式が全件列挙される → 新規 ID が検出一覧に無いことを確認して進め、allowlist 初期化を別 Issue で行う。

- 2026-09-06: PR #502 の curate で 71 件が列挙、新規 ACE-502-1 は非検出。#504 を起票（初回）

---

<a id="obs-009"></a>

### OBS-009: PLAYBOOK frontmatter の `changeImpact` は ACE 同期検証が小文字を要求し、テンプレ MASTER.md の規約（LOW / MEDIUM / HIGH）と食い違う

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

テンプレ規約に合わせて大文字で書くと `sync-playbook-frontmatter.ts --check` が exit 1 になる → PLAYBOOK では小文字 `medium` を書く。再発が続けば、値域の正本をどちらかに揃える提案をツールキット側へ出す。

- 2026-09-06: PR #502 の curate で `"MEDIUM"` を書いて 1 回赤、小文字へ直して通過（初回）

---

<a id="obs-010"></a>

### OBS-010: ACE 系スキルは PLAYBOOK を `docs/08-knowledge/` 固定で参照するが、テンプレ配布リポジトリでは実体が `docs-template/08-knowledge/` にある

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

既定パスで grep・frontmatter 読みを組むと全コマンドが not found で空振りし、パスを直して再実行する往復が出る → 着手時に `package.json` の `ace:*` スクリプトが指すパスで実配置を確定してからコマンドを組む（`/retrospective` の「知見ストアの実配置を確定する」と同じ手順を curate 側にも置く余地）。

- 2026-09-06: PR #502 の curate で最初の情報収集 1 ターンが全件 not found（初回）

---

<a id="obs-011"></a>

### OBS-011: Codex レビューシム（`codex-review.sh`）の実行中に commit / push すると、保存済みの観点ファイルがあっても残りの観点が「worktree 変更検出」で破棄され 1 巡が無駄になる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

シムはバックグラウンドで 3 観点を並列に回し、完了前に HEAD が動くと未完了分を破棄して exit 1 になる。code-review / test-analysis が先に保存されたのを見て次の fix commit を作ると、acceptance-criteria が失われて再実行が必要になる → 完了通知（exit code）が来るまで commit しない。個別ファイルの保存ログを「完了」と読まない。

- 2026-09-06: PR #505 の 2 巡目で acceptance-criteria 完了前に fix commit を作り、3 巡目の再実行で 1 回分を空費（初回）

---

<a id="obs-012"></a>

### OBS-012: Markdown 内 TypeScript コード例の構文・型欠陥（`try` の無い `catch`、基底の署名変更に追随しないサブクラス）が品質ゲートを素通りし、レビュアーの目視でしか見つからない

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#512 |

`quality:local` は fenced TypeScript を検査しない。写経される文書で同じ欠陥クラスが同一 PR 内で 2 回（1 巡目 SKILL.md §5、2 巡目 §6）再発した → fenced TS を抽出して構文チェック（少なくとも）するゲートを追加する（#512）。

- 2026-09-06: PR #510 の 1 巡目で SKILL.md §5 の `} catch` 断片、2 巡目で §6 の同型を Toolkit code-reviewer が検出（初回・2 回目）

---

<a id="obs-013"></a>

### OBS-013: 設計判断を含む文書 PR では、Toolkit の type-design-analyzer を含めて 4 観点を並列に回すと、個別パッチでは閉じない根本原因（分類の再導出）が 1 巡目で指摘される

| Kind | keep | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

code-reviewer / silent-failure-hunter が挙げた「`InternalError` が再試行される」「`SecurityError` のステータス変更で禁止から外れる」「`isRetryable` が既定判定を置換できる」は、type-design-analyzer の「`abstract readonly category` で宣言させる」1 案で同時に消えた。個別に直していたら 3 パッチと 2 巡目の再指摘になっていた。

- 2026-09-06: PR #510 の 1 巡目（初回）

---
