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

| Kind | problem | Count | 4 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#515 |

`quality:local` がゲート記録（`record-gate-head.sh` 相当）を書かないため、`check-merge-freshness.sh` は実測対象を特定できず exit 2 を返し、実測とマージの窓は人手の再実行で埋めることになる → 再発が続けば、`quality:local` の末尾でゲート記録を書くか、pre-push hook に記録を組み込むことを本リポジトリの Issue として検討する。

- 2026-09-06: PR #498 の /close-issue で `REASON=実測対象の記録がありません`。直前に HEAD で quality:local を手動再実行して代替した（初回）
- 2026-09-06: PR #500 の /close-issue でも同じ REASON。fix commit 直前に quality:local を手動実行して代替（再発）
- 2026-09-06: PR #502 の /close-issue でも同じ REASON（3 回目・閾値到達）。マージ直前の HEAD で quality:local を手動再実行して代替
- 2026-09-06: 閾値到達により #515 へ昇格起票
- 2026-09-07: PR #519 の /close-issue でも同じ REASON（4 回目）。#515 は open。HEAD == リモート先端・作業ツリー clean・未 push 0 件を手動照合して代替した（再発）

---

<a id="obs-006"></a>

### OBS-006: Issue の AC に書く検証コマンドは、起票時に実行して「拾うべきものを拾う」ことを確かめてから書く

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | active | Issue | なし |

AC の grep を頭で組んで起票すると、検出式の穴（表記の必須化・境界の欠落）がそのまま「残存なし」の緑になり、レビューで検出器ごと差し戻される → 起票前に既知の残存 1 件を含む状態でコマンドを実行し、その 1 件が検出されることを見てから AC に書く。

- 2026-09-06: Issue #499 の AC grep が `node.js` 表記を必須にしていて「Node 20+」を拾えず、Toolkit が Warning として検出器の是正を要求した（初回）
- 2026-09-07: Issue #517 の AC grep がファイル引数で 2 ファイルに限定されており、同じ無条件主張を持つ `.cursorrules` と `docs/FRONTMATTER_GUIDE.md` を拾えなかった。起票時に引数なしで実行していれば 4 ファイル出ていた（再発。ACE-519-1 として知見化）

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

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | promoted | Issue | feel-flow/ai-spec-driven-development#504 |

`/ace-curate` 4-f の `check-entry-format.ts` は allowlist 不在を strict として扱うため、初回導入（`/ace-setup` Step 3-b の `--init-allowlist`）を済ませていないリポジトリでは curate のたびに既存旧形式が全件列挙される → 新規 ID が検出一覧に無いことを確認して進め、allowlist 初期化を別 Issue で行う。

- 2026-09-06: PR #502 の curate で 71 件が列挙、新規 ACE-502-1 は非検出。#504 を起票（初回）
- 2026-09-07: PR #519 の curate でも 71 件が全件赤（allowlist 不在 = strict）。新規 ACE-519-1〜3 は非検出だったが、rc=1 の原因切り分けに追加 1 コマンドを要した。#504 は open（再発）

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

| Kind | problem | Count | 2 |
| First | 2026-09-06 | Last | 2026-09-07 |
| Status | active | Issue | なし |

既定パスで grep・frontmatter 読みを組むと全コマンドが not found で空振りし、パスを直して再実行する往復が出る → 着手時に `package.json` の `ace:*` スクリプトが指すパスで実配置を確定してからコマンドを組む（`/retrospective` の「知見ストアの実配置を確定する」と同じ手順を curate 側にも置く余地）。

- 2026-09-06: PR #502 の curate で最初の情報収集 1 ターンが全件 not found（初回）
- 2026-09-07: PR #519 の curate で `docs/08-knowledge/` に OBSERVATIONS.md だけがあり PLAYBOOK は `docs-template/` 側という配置差を、実在確認 1 ターンで特定した（再発）

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

<a id="obs-014"></a>

### OBS-014: 厳密一致の置換スクリプトと prettier --write を同じブランチで交互に走らせると、再整形された表・折り返し行で後続の置換が空振りし、失敗検出と commit を 1 コマンドに連結していると部分コミットになる

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

Markdown 内コード例の編集を Python の厳密一致置換で当て、その後 prettier --write で整形すると、次の巡回では三項演算子の折り返しや表セルの余白が変わっていて同じ書き方の置換が 0 件になる。置換の assert 失敗を commit と同じシェル呼び出しに並べていたため、3 件中 1 件だけがコミットされ追加コミットが要った。

- 2026-09-06: PR #516 で 2 回発生（1 巡目 fix の readHttpStatus 折り返し、2 巡目 fix の FALLBACK.md 表セル余白）。置換 → prettier → 検証 → commit を別コマンドに分けるか、置換を正規表現で余白非依存にすると回避できる（初回）

---

<a id="obs-015"></a>

### OBS-015: 品質ゲートをバックグラウンド実行中にその対象ファイルを編集すると、実行結果が最終ツリーと一致する保証を失い無効になる

| Kind | problem | Count | 1 |
| First | 2026-08-28 | Last | 2026-08-28 |
| Status | mitigated | Issue | doc:docs/AI_GIT_WORKFLOW.md#ステップ4-テスト検証test |

`pnpm check` / `npm run quality:local` 等のゲートをバックグラウンドで回している間にソースを編集すると、ゲートは開始時に作業ツリーをスナップショットせず各ステージが逐次ファイルを読むため、完了した実行は旧内容と新内容が混在し得る「最終ツリーと一致する保証がない結果」でありコミット前ゲートとして使えない → ゲート実行中は対象ファイルを編集せず、待ち時間には**読み取りだけ**の作業（docs 読み・既存 Issue 検索・ADR や修正案の下書きはゲート対象外のスクラッチ領域で）を充てる。編集したらその実行を無効と見なして測り直す（レビューシムが HEAD 移動で明示的に abort する OBS-011 と異なり、ゲートは無言で結果を返す）。

- 2026-08-28: feel-flow/youtube-plan PR #409 で `pnpm check`（約 2 分）の待ち時間にレビュー指摘の修正を入れ、完了した実行が無効になり 1 回分を空費（ゲートは計 3 回、必要だったのは 2 回）（初回）

---

<a id="obs-016"></a>

### OBS-016: zsh では終了コード取得の bash イディオムがそのまま動かない — `PIPESTATUS` は小文字 1 始まり、`status` は読み取り専用のため、パイプ越しのゲート判定が黙って空振りする

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

長時間ゲートの結果をパイプで `tail` に流すと `${PIPESTATUS[0]}` が空になり（zsh は `pipestatus` で 1 始まり）、続けて `status=$?` で受けようとすると `read-only variable: status` で代入行から落ちる → ゲートはログファイルへリダイレクトし、次行で `rc=$?` を受けてから `grep` で中身を読む。

- 2026-09-07: PR #519 で `npm run quality:local` の終了コードを 2 回取り損ね、確証のためゲートを 2 回追加実行した（1 回 40 秒前後）。3 回目にログ経由 + `rc=$?` で確定（初回）

---

<a id="obs-017"></a>

### OBS-017: 依存バージョンの指摘を「失敗シナリオなし」で Suggestion に落とす前に、その依存が既に CI の annotation で警告を出していないか確認する

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

Review Response Policy の「失敗シナリオのない指摘は Suggestion」は、失敗シナリオを差分だけから探すと成立していないように見える。依存の非推奨警告は実行ログ側にしか現れないため、見送り判断の前に `gh run view` の annotation を読む → 根拠が既に存在していれば Warning として現 PR で対応できる。

- 2026-09-07: PR #519 で actions のバージョンピン留め指摘を「失敗シナリオなし」として見送った直後、マージ後の CI annotation に `actions/checkout@v4` / `actions/setup-node@v4` が Node.js 20 を対象としており Node 24 へ強制されている旨の非推奨警告が出ていた。見送り前に annotation を読めば現 PR 内で閉じられた（初回）

---

<a id="obs-018"></a>

### OBS-018: read-only レビューエージェントの実行中はブランチを checkout せず `git show <ref>:<path>` で読む — checkout は実行中エージェントの足元のファイルを差し替える

| Kind | keep | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

並列エージェントの禁止事項は「エージェント側がビルドしないこと」だけでなく、オーケストレータ側が作業ツリーを動かさないことも含む。先に返ってきた観点の指摘を検証したくなっても checkout せず、`git show <branch>:<path>` で PR ブランチの内容を読めば、待ち時間を事実確認に使いながら実行中のエージェントを壊さない。

- 2026-09-07: PR #519 で comment-analysis が先に完了し code-review が実行中だったため、`git show origin/<branch>:<path>` で Critical / Warning 6 件を全件実測（すべて正確と確認）。checkout は code-review 完了後まで待ち、競合ゼロで 1 fix commit に束ねられた（初回）

---

<a id="obs-019"></a>

### OBS-019: 観測台帳の OBS ID は最大連番 +1 で採番するため、未マージの open PR が同じ ID を先取りしていても push が fast-forward で通り、衝突が無警告で成立する

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

スキルが持つ衝突対策は「push が non-fast-forward で拒否されたら再採番する」だけで、先取り側がまだマージされていない場合は拒否が起きず素通りする（ACE の PR スコープ式 ID にはこの穴がない） → 採番の前に `gh pr list --state open --json number,headRefName` の各 PR で `gh pr diff <N> | grep 'OBS-0'` を掃き、未マージの先取りを確認する。衝突に気づけるのは相手 PR のマージ時で、そこでは他文書からのアンカー参照まで壊れる。

- 2026-09-07: PR #519 の振り返りで OBS-015〜017 を採番して push（fast-forward で成功）したが、open PR #518 が別内容の OBS-015 を定義済みで `docs/AI_GIT_WORKFLOW.md` からアンカー参照も持っていた。自分の 3 件を OBS-016〜018 へ繰り下げる追加コミットを要した（初回）

---

<a id="obs-020"></a>

### OBS-020: `multi-review.sh --base <branch>` はローカルの ref を解決するため、fetch 済みでもローカル追跡ブランチが古いとレビュー範囲が黙って上位集合へ広がる

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

`--base develop` はリモート追跡ではなくローカルの `develop` を解決するため、`git fetch` だけしてローカル ref を更新していないと、既にマージ済みの他 PR の差分まで含めてレビューさせる。エラーにならず結果も返るので、レビュー観点が PR 外の差分へ分散していることに気づけない → 起動前に `git rev-parse --short develop origin/develop` の一致を確認する（または `--base origin/develop` を渡す）。

- 2026-09-07: PR #522 のレビューでローカル `develop` が #519 マージ前で止まっており、PR 実差分 1 ファイル 7+46 行に対し 7 ファイル 114+82 行を対象にレビューさせた。出力に「`ci.yml` の新設」（#519 で既にマージ済み）が含まれていたことで気づき、ref を更新して再実行した（初回）

---

<a id="obs-021"></a>

### OBS-021: スクリプト末尾に条件分岐の報告行を置くと全体の終了コードが分岐の成否になり、本体の失敗が exit 0 に化ける — バックグラウンド実行では完了通知の exit code しか見えないため誤報になる

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

`git push` の rc を変数へ取っても、最後の行が `[ "$rc" -eq 0 ] && echo 成功 || tail ログ` だとスクリプトの終了コードは `tail` の成功（0）になる。バックグラウンドへ回った実行では完了通知の exit code しか見えないため、失敗した push を成功として報告してしまう（`echo "PUSH_RC=$?"` を末尾に置く形も同じく 0 を返す） → 本体の rc は末尾で `exit "$rc"` として明示的に伝播させ、人間向けの報告行はその前に置く。完了通知の exit code は「最後のコマンドの成否」であって本体の成否ではない。[OBS-016](#obs-016) の zsh 変数由来とは機構が別で、対処も別（あちらはログ経由で受ける、こちらは伝播させる）。

- 2026-09-07: PR #519 のセッションで 2 回発生。1 回目は non-fast-forward で失敗した push を「✓ push 成功」と誤報してユーザーへの報告を訂正、2 回目はログの `PUSH_RC=1` を読んで初めて pre-push ゲート失敗と判明した（初回）

---

<a id="obs-022"></a>

### OBS-022: `mcp` の spawnSync 系テストは `testTimeout` 未設定（既定 5 秒）で境界に張り付いており、pre-push ゲートが非決定的に赤くなって push を止める

| Kind | problem | Count | 1 |
| First | 2026-09-07 | Last | 2026-09-07 |
| Status | active | Issue | なし |

`mcp/vitest.config.ts` は `include` だけを指定し `testTimeout` を持たないため既定 5000ms。`tests/validate-frontmatter.test.ts` は各ケースで `spawnSync` により `validate-docs.mjs` を起動するので 1 ケースが数秒に達し、実行ごとに落ちるケースが入れ替わる → 赤を見たら落ちたケース名を 2 回の実行で比較し、変わるなら flaky と判定して回帰と切り分ける（同じケースが落ちるなら回帰）。恒久対策は `testTimeout` の引き上げか spawn 回数の削減で、`SKIP_QUALITY_GATE=1` での迂回は #517 が Actions を第二のゲートに据えた前提そのものを崩すので使わない。同型の症状は internal リポジトリの Issue でも追跡されている。

- 2026-09-07: PR #519 後続の `ci.yml` コメント 1 行追加で push が 2 回中止。1 回目 2 件・2 回目 1 件と落ちるケースが変わり flaky と確定（いずれも `Test timed out in 5000ms`）。コメント 1 行のためにゲートを迂回する価値がないと判断し、当該コミットを取り下げた（初回）

---
