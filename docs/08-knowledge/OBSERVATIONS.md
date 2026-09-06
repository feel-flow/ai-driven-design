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

| Kind | problem | Count | 1 |
| First | 2026-09-06 | Last | 2026-09-06 |
| Status | active | Issue | なし |

`quality:local` がゲート記録（`record-gate-head.sh` 相当）を書かないため、`check-merge-freshness.sh` は実測対象を特定できず exit 2 を返し、実測とマージの窓は人手の再実行で埋めることになる → 再発が続けば、`quality:local` の末尾でゲート記録を書くか、pre-push hook に記録を組み込むことを本リポジトリの Issue として検討する。

- 2026-09-06: PR #498 の /close-issue で `REASON=実測対象の記録がありません`。直前に HEAD で quality:local を手動再実行して代替した（初回）

---
