---
id: frontmatter-guide
title: Frontmatter ガイド - なぜ・どこで・何を書くか
version: 1.2.0
status: draft
created: 2026-05-19
updated: 2026-05-19
owner: feel-flow
phase: mvp
tags: [documentation, frontmatter, metadata, spec-kit, governance]
references:
  - docs/AI_SPEC_DRIVEN_DEVELOPMENT.md
  - docs/OPERATIONAL_GUIDE.md
  - docs-template/MASTER.md
  - scripts/validate-docs.mjs
  - scripts/build-spec-index.mjs
  - mcp/src/utils.ts
changeImpact: medium
---

# Frontmatter ガイド - なぜ・どこで・何を書くか

> **対象読者**: 本テンプレ（AI Spec Driven Development）を自プロジェクトに採用する人、新規にドキュメントを追加するコントリビューター。
>
> **このガイドの位置づけ**: frontmatter に関するルールは複数ドキュメントに分散している（[OPERATIONAL_GUIDE §7](OPERATIONAL_GUIDE.md)、[MASTER.md 文書運用ルール](../docs-template/MASTER.md)、[Spec Kit 運用ガイド](../docs-template/MASTER.md) 等）。本ガイドは **Why / What / Where(rule) / Where(target) / How** の5観点で横断的に集約する入口ドキュメント。

## TL;DR

- **Why**: frontmatter は AI / MCP / CI / 検索の **メタデータ唯一の正式ソース (SSOT)** にするため。本文に書くと参照が散らばり、機械的に処理できなくなる。
- **2 系統スキーマがある**:
  1. **コア7文書・拡張文書スキーマ** （本リポジトリ独自、3 ステータス `draft|review|approved`、`changeImpact`、SemVer）
  2. **`docs/specs/` 配下スキーマ** （GitHub Spec Kit 由来、6 ステータスライフサイクル、`specId`、メトリクス）
- **付ける場所**: コア 7 文書、拡張文書（GLOSSARY, DECISIONS, FAQ 等）、`docs/specs/**`、PLAYBOOK 等の運用文書。
- **付けないテンプレ**: `GETTING_STARTED*.md`、`SETUP_*.md` のような「採用前に読む手順書」は本文置換のみで OK（[docs-template/README.md](../docs-template/README.md) の「frontmatter を持たないテンプレ」節）。
- **検証**: `node scripts/validate-docs.mjs` でコア 7 文書（CORE_DOCS 固定）、`node scripts/build-spec-index.mjs` で spec を CI 検証。MCP サーバーは `parseFrontMatter` で読み取って `spec_lookup` / `spec_search` に供給。
- **SSOT 注意**: コア 7 文書スキーマの正本は本ガイド §5.1 と `scripts/validate-docs.mjs:62-63`。`docs/OPERATIONAL_GUIDE.md §7` の status enum (`draft|active|deprecated`) は stale なため、矛盾時は validate-docs.mjs を優先（解消は [Issue #412](https://github.com/feel-flow/ai-spec-driven-development/issues/412)）。
- **ツール / 環境**: frontmatter スキーマと検証 Node スクリプトは **AI ツール非依存・OS 非依存**（Claude Code / Cursor / Copilot / Codex CLI どれでも、macOS / Linux / Windows どれでも使える）。MCP サーバーは全 4 ツールで利用可だが、Claude Code 以外は **明示的な MCP 設定** が必要。`*.sh` スクリプトと `.husky/pre-commit` は Windows native では Git Bash か WSL2 が必要（sh + coreutils）。詳細は §7。

---

## 1. Why - なぜ frontmatter を付けるのか

### 1.1 ドキュメントを「機械可読な SSOT」にするため

人間向け Markdown は自由度が高く、メタデータ（バージョン、ステータス、所有者）を本文に書くと:

- 同じ情報が複数箇所に散らばる（重複違反）
- 表記揺れが起きる（`v1.0` / `1.0.0` / `Version 1`）
- AI ツール・スクリプトが安定して抽出できない

frontmatter は **YAML というスキーマ言語** にメタデータを閉じ込めることで、これを 1 箇所に集約する。本リポジトリでは `docs-template/MASTER.md`「プロジェクト識別情報」セクション等で「**バージョン: Frontmatter の `version` を参照**」と本文側からも明示し、SSOT を担保している。

### 1.2 AI ツールに「最小コンテキスト」を渡すため

役割分担は以下のとおり:

- `scripts/build-spec-index.mjs` が `docs/specs/**/*.md` の frontmatter を読み取り **`dist/spec-index.json` を生成**する（CI 時に走らせる）。
- `mcp/src/index.ts` の MCP サーバーは spec ファイルを **メモリ上で索引化**し、以下のツールとして AI に公開する:
  - `spec_lookup(specId)` で spec の frontmatter + 本文を返す
  - `spec_search(query)` でタイトル・タグから絞り込み

→ AI は「全文 grep せずにメタデータだけで候補を絞れる」状態になり、コンテキスト最小化 → ハルシネーション減につながる。

### 1.3 CI で品質ゲートを回すため

`npm run quality:local` で実行される `scripts/validate-docs.mjs` は:

- frontmatter の有無
- 必須フィールド (`title`, `version`, `status`, `owner`, `created`, `updated`) の存在
- `status` 値が enum（`draft|review|approved`）に収まっているか
- `version` が SemVer に従っているか

を検証し、エラー検出時は `exitCode = 1` をセット（[validate-docs.mjs:108-135 でエラー組み立て、243/257 で代入](../scripts/validate-docs.mjs)）、最終的に `process.exit(exitCode)` で CI を落とす（line 275）。

### 1.4 変更影響と Changelog を連動させるため

`changeImpact` フィールド（`low|medium|high`）が `version` の bump 規則と Changelog 追記を制御する（[OPERATIONAL_GUIDE §7, §8](OPERATIONAL_GUIDE.md)）:

- `high` → メジャー bump + Changelog 必須
- `medium` → マイナー bump
- `low` → パッチ bump

→ ドキュメントを **コードと同じ規律でバージョン管理**する仕掛け。

---

## 2. What - 付けると何が起きるのか

| パイプライン                    | 入力                                                                   | frontmatter から拾うフィールド                                        | 出力 / 効果                                                      |
| ------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `scripts/validate-docs.mjs`     | `docs-template/` 配下の **固定 7 ファイル**（CORE_DOCS 配列で列挙）    | `title`, `version`, `status`, `owner`, `created`, `updated`           | 必須フィールド・enum・SemVer 検証。失敗で exit 1                 |
| `scripts/build-spec-index.mjs`  | `docs/specs/**/*.md`                                                   | `specId`, `title`, `status`, `version`, `tags`, `links`, `metrics` 他 | `dist/spec-index.json` を生成。`specId` 重複・enum 違反で exit 1 |
| `mcp/src/index.ts` MCP サーバー | 上記 2 系統（メモリ上で索引化、`dist/spec-index.json` 書き出しは別）   | `parseFrontMatter` で全フィールド                                     | `spec_lookup` / `spec_search` ツールが AI に最小コンテキスト供給 |
| `npm run quality:local`         | 上記の validate / build-spec-index / MCP test / lint / prettier を統括 | 上記すべて                                                            | 旧 GitHub Actions CI 相当の品質ゲート（PR 前に手動実行）         |

> **重要**: `validate-docs.mjs` は **CORE_DOCS 配列で列挙された 7 ファイルだけ**を検証する。拡張文書（GLOSSARY, DECISIONS 等）や `PLAYBOOK.md`、`docs/` 配下の方法論ガイド類は **CI で frontmatter 検証されない**。拡張対象にしたい場合は `CORE_DOCS` 配列への追加か別スクリプト化が必要。

### 2.1 スクリプトの実装場所

- パーサー: `mcp/src/utils.ts` `parseFrontMatter` （リポジトリで最も整備されている実装）
- 簡易パーサー: `scripts/validate-docs.mjs` / `scripts/build-spec-index.mjs`（外部依存なしの自前実装、挙動差は §5.4.2 参照）

---

## 3. Where (rule) - どこに指示が書いてあるか

frontmatter に関するルールは以下に**分散**している。本ガイドはその索引でもある。

| 文書                                                                                   | 役割                                                                                                                                            | 主な内容                                                                                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [docs/OPERATIONAL_GUIDE.md §7 FRONTMATTER TEMPLATE](OPERATIONAL_GUIDE.md)              | **AI Agent 向け運用仕様**（フィールド説明の項目数が最も多い）。ただし status enum (`draft\|active\|deprecated`) が stale (→ [Issue #412][i412]) | 全フィールド一覧表、必須/任意区分、`changeImpact` 判断基準                                                             |
| [docs/OPERATIONAL_GUIDE.md §8 UPDATE / CHANGE POLICY](OPERATIONAL_GUIDE.md)            | 更新フロー                                                                                                                                      | `changeImpact` → version bump → Changelog 連動の手順                                                                   |
| [docs-template/MASTER.md 「文書運用ルール / Frontmatter」](../docs-template/MASTER.md) | **コア 7 文書・拡張文書のスキーマ定義**（validate-docs.mjs の実装と整合）                                                                       | 必須/任意フィールド、ステータスワークフロー（`draft\|review\|approved`）、バージョニング                               |
| [docs-template/MASTER.md 「Spec Kit 運用ガイド」](../docs-template/MASTER.md)          | **`docs/specs/` 配下のスキーマ定義**                                                                                                            | `specId` 命名規約、6 ステータスライフサイクル、メトリクス                                                              |
| [docs/specs/spec-template.md](specs/spec-template.md)                                  | spec の雛形ファイル                                                                                                                             | コピーして使う実物                                                                                                     |
| [docs-template/README.md](../docs-template/README.md)                                  | テンプレ採用時の置換手順                                                                                                                        | 「frontmatter を持つ/持たないテンプレ」の区別                                                                          |
| [docs-template/08-knowledge/PLAYBOOK.md](../docs-template/08-knowledge/PLAYBOOK.md)    | PLAYBOOK 固有ルール                                                                                                                             | `ace_entry_count` 等の追加フィールド管理、SAMPLE バナー付きテンプレファイルの取り扱い（採用時に frontmatter 書き換え） |

[i412]: https://github.com/feel-flow/ai-spec-driven-development/issues/412

> **SSOT 注意**: コア 7 文書スキーマの正本は本ガイド §5.1 と `scripts/validate-docs.mjs:62-63`（必須 6 フィールド + 3 値 enum）。OPERATIONAL_GUIDE.md §7 とは status 値が異なるため、矛盾時は validate-docs.mjs の実装を正とする。

---

## 4. Where (target) - どのファイルに付けるか

### 4.1 付ける対象

`validate-docs.mjs` が CI で検証するのは **CORE_DOCS 配列で列挙された固定 7 ファイルのみ**。それ以外は frontmatter を付けても CI 対象外（手動 `node scripts/validate-docs.mjs` でも検査されない）。

| 対象                                                   | スキーマ                             | CI 検証                                    |
| ------------------------------------------------------ | ------------------------------------ | ------------------------------------------ |
| `docs-template/MASTER.md`                              | コア 7 文書スキーマ                  | ✅ `validate-docs.mjs`                     |
| `docs-template/01-context/PROJECT.md`                  | 同上                                 | ✅ 同上                                    |
| `docs-template/02-design/ARCHITECTURE.md`              | 同上                                 | ✅ 同上                                    |
| `docs-template/02-design/DOMAIN.md`                    | 同上                                 | ✅ 同上                                    |
| `docs-template/03-implementation/PATTERNS.md`          | 同上                                 | ✅ 同上                                    |
| `docs-template/04-quality/TESTING.md`                  | 同上                                 | ✅ 同上                                    |
| `docs-template/05-operations/DEPLOYMENT.md`            | 同上                                 | ✅ 同上                                    |
| 拡張文書（GLOSSARY, DECISIONS, FAQ, API, DATABASE 等） | コア 7 文書スキーマ                  | ❌ CI 対象外（手動チェック推奨）           |
| `docs/specs/**/*.md`                                   | **Spec Kit スキーマ**（別系統）      | ✅ `build-spec-index.mjs`                  |
| `docs/*.md`（本ガイド含む方法論文書）                  | コア 7 文書スキーマに準拠            | ❌ CI 対象外（リポジトリ自身の方法論文書） |
| `docs-template/08-knowledge/PLAYBOOK.md`               | コア 7 文書 + `ace_entry_count` 拡張 | ❌ CI 対象外                               |

> **拡張対象にしたい場合**: `scripts/validate-docs.mjs` の `CORE_DOCS` 配列に追加するか、別スクリプトを用意する。

### 4.2 付けないテンプレ（[docs-template/README.md](../docs-template/README.md) の「frontmatter を持たないテンプレ」節）

| 対象                                                 | 理由                                                   |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `docs-template/GETTING_STARTED.md`                   | 採用手順ガイドで、採用後の継続的更新対象ではないため   |
| `docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md` | 同上                                                   |
| `docs-template/GETTING_STARTED_NEW_PROJECT.md`       | 同上                                                   |
| `docs-template/SETUP_CLAUDE_CODE.md`                 | ツール固有のセットアップ手順（採用後にメタ管理しない） |
| `docs-template/SETUP_CURSOR.md`                      | 同上                                                   |
| `docs-template/SETUP_GITHUB_COPILOT.md`              | 同上                                                   |
| `docs-template/README.md`                            | ナビゲーション用                                       |

→ これらは frontmatter を持たず、**本文中の `{{プロジェクト名}}` 等プレースホルダーの置換のみ**で採用する。

---

## 5. How - どう書くか

### 5.1 コア 7 文書・拡張文書スキーマ（本リポジトリ独自）

**最小雛形**（validate-docs.mjs が warning なしで通る最小構成、実テンプレ `docs-template/MASTER.md:1-9` と同形）:

```yaml
---
title: My Document Title
version: 0.1.0 # SemVer 必須
status: draft # draft | review | approved の 3 値
owner: "@your-github-handle" # team-name または @username
created: 2026-05-19 # YYYY-MM-DD
updated: 2026-05-19 # YYYY-MM-DD
changeImpact: medium # low | medium | high（初版は省略可、初回変更時に追加）
---
```

**拡張雛形**（`tags` / `references` 等を追加。`validate-docs.mjs` の簡易パーサーは `- item` 行・`[a, b]` 配列を「パース不能な行」warning として出すが exit はしない。`mcp/src/utils.ts` は配列としてパースする）:

```yaml
---
id: my-document-id # kebab-case の一意識別子（任意）
title: My Document Title
version: 0.1.0
status: draft
owner: feel-flow
created: 2026-05-19
updated: 2026-05-19
phase: mvp # planning | mvp | extension | optimization（任意）
tags: [topic-a, topic-b] # 任意（検索・分類用）
references: # 任意（関連ドキュメント）
  - docs-template/MASTER.md
changeImpact: medium
---
```

**ステータスワークフロー** ([docs-template/MASTER.md「ステータスワークフロー」](../docs-template/MASTER.md)):

```text
draft → review → approved
  ↑__________________|
     （修正が必要な場合）
```

| status     | 意味           | AI への扱い                  |
| ---------- | -------------- | ---------------------------- |
| `draft`    | 作成中・未確定 | 参考情報として扱う           |
| `review`   | レビュー中     | ほぼ確定だが変更の可能性あり |
| `approved` | 承認済み       | 正式な仕様として遵守         |

### 5.2 `docs/specs/` 配下スキーマ（GitHub Spec Kit 由来）

**最小コピペ雛形**（`docs/specs/spec-template.md` をコピーするのが最短）:

```yaml
---
specId: ASDD-AUTH-001 # ASDD-<DOMAIN>-<連番3桁>、リポジトリ全体で一意
title: 認証フロー
owners:
  - github: your-handle
status: draft # draft|review|approved|implementing|done|deprecated の6値
version: 0.1.0 # SemVer
lastUpdated: 2026-05-19 # ← `updated` ではなく `lastUpdated`（コア7と命名が違う点に注意）
tags: [auth, security]
links:
  issues: []
  prs: []
  docs: []
summary: >-
  1〜2文で仕様の意図
riskLevel: low # low|medium|high
impact: >-
  ビジネス/開発/運用への影響サマリ
metrics:
  success:
    - login_success_rate >= 98%
  guardrails:
    - auth_latency_p95 < 150ms
---
```

**6 ステータスライフサイクル** ([docs-template/MASTER.md「ライフサイクル」](../docs-template/MASTER.md)):

| 状態           | 目的     | 出口条件           |
| -------------- | -------- | ------------------ |
| `draft`        | 初稿作成 | レビューワ割当     |
| `review`       | 内容検証 | 全必須コメント解消 |
| `approved`     | 合意済   | 実装着手           |
| `implementing` | 実装中   | 全 PR マージ       |
| `done`         | 運用     | 非推奨決定         |
| `deprecated`   | 廃止準備 | 削除 or 置換       |

> **MCP 上の挙動**: `links:` / `metrics:` のような **ネスト構造は MCP の `parseFrontMatter` では string に丸めて格納**される（`build-spec-index.mjs` 経由でも `metrics.success` がサブグループのまま読まれず flat array 化）。そのため `spec_search` で `metrics.success.login_success_rate` のような階層検索はできない。階層情報を残したい場合は本文側にテーブルで記述する。

### 5.3 更新時のチェックリスト

`changeImpact` を判定して `version` を bump、必要なら Changelog を更新する（[OPERATIONAL_GUIDE §8](OPERATIONAL_GUIDE.md)）:

- [ ] `changeImpact` を判定（`low` / `medium` / `high`）
- [ ] `version` を bump（`low` → patch、`medium` → minor、`high` → major）
- [ ] `updated` を今日の日付に更新
- [ ] `status` を変えたか確認（`draft` → `review` 等）
- [ ] `changeImpact: high` の場合は本文末尾の **Changelog セクションにエントリ追記**
- [ ] 参照（`references`）が増えたら追加
- [ ] `npm run quality:local` を実行して `validate-docs.mjs` が通ることを確認

### 5.4 注意点・つまずきポイント

#### 5.4.1 コア7と spec で命名が違うフィールドがある

| 概念         | コア7文書        | `docs/specs/`                        |
| ------------ | ---------------- | ------------------------------------ |
| 最終更新日   | `updated`        | `lastUpdated`                        |
| 一意 ID      | `id`             | `specId`                             |
| 所有者       | `owner` (文字列) | `owners` (配列、GitHub ハンドル付き) |
| ステータス値 | 3値              | 6値                                  |

→ **同じ感覚でコピペすると検証で落ちる**。spec を書くときは必ず `docs/specs/spec-template.md` をコピーする。

#### 5.4.2 パーサーは「自前 YAML サブセット」で 3 実装に挙動差がある

リポジトリ内には外部ライブラリを使わない `parseFrontMatter` 実装が **3 つ** あり、対応している YAML 構文が異なる。テンプレからずれた書き方をすると、ある実装では通り別の実装では落ちる、ということが起きる。

| YAML 機能                                | `mcp/src/utils.ts`           | `scripts/validate-docs.mjs`                  | `scripts/build-spec-index.mjs`   |
| ---------------------------------------- | ---------------------------- | -------------------------------------------- | -------------------------------- |
| インライン配列 `tags: [a, b]`            | ✅ 配列にパース              | ❌ literal string `'[a, b]'`                 | ✅ 配列にパース                  |
| ブロック配列 `- item` 行                 | ✅ string 配列化             | ❌「パース不能な行」warning（exit はしない） | ✅ string 配列化                 |
| `>-` で複数行文字列を空文字に丸める      | ✅                           | ❌ 特別扱いなし（literal `'>-'` が値になる） | ✅                               |
| `\|` で複数行文字列を空文字に丸める      | ❌ literal `'\|'` が値になる | ❌ 同上                                      | ✅                               |
| ネストした map（`owners: - github: id`） | ❌ リスト要素は string 扱い  | ❌ 「パース不能な行」warning                 | ❌ 明示的に skip（line 40 参照） |

**実用上の指針**:

- spec を書くときは必ず `docs/specs/spec-template.md` をコピーする（実テンプレが通る形になっている）。
- コア 7 文書は `tags` / `references` を使わない最小構成（§5.1 の最小雛形）から始めると warning が出ない。
- 凝った YAML を書きたいときは、**当該フィールドを読む実装はどれか**（CI 用なら `validate-docs.mjs`、AI 提供用なら `mcp/src/utils.ts` または `build-spec-index.mjs`）を確認してから書く。

#### 5.4.3 frontmatter 開始は **ファイル冒頭**

最初の行が `---` でないとパーサーは frontmatter として認識しない（[validate-docs.mjs:77](../scripts/validate-docs.mjs)、[utils.ts:35](../mcp/src/utils.ts)）。

挙動差:

- **BOM (U+FEFF)**: 3 実装すべてで失敗する（`trim()` も `startsWith()` も BOM は除去しない）。
- **先頭空行**: 3 実装すべてで失敗する（空文字列 `!== '---'`）。
- **先頭行内の前後 whitespace（半角空白/タブ）**: `validate-docs.mjs:77` は `lines[0].trim()` で許容、`utils.ts:35` は `raw.startsWith('---')` で **不許容**。

→ エディタ設定で BOM を出さないよう注意。1 行目に `---` を直書きするのが安全。

#### 5.4.4 SAMPLE バナー付きテンプレファイル

[PLAYBOOK.md](../docs-template/08-knowledge/PLAYBOOK.md) の「サンプルテンプレ汚染回避」エントリで導入された**「SAMPLE — テンプレートです」バナー付き**のファイル（`DECISION_TREE.md` 等）は、採用時にバナーを削除すると同時に frontmatter の `created` / `updated` / `owner` を自プロジェクト値に書き換える運用。コピペしたまま放置しないこと。

---

## 6. 出自と歴史的経緯

frontmatter スキーマが 2 系統あるのは **歴史的経緯** による。

### 6.1 `docs/specs/` 配下 - Spec Kit 由来 (2025-10-22)

コミット `ef0f697` "feat(mcp): implement low-level custom MCP server with resources/tools and spec/glossary indexing" で MCP サーバーと同時に導入された。[docs-template/MASTER.md「Spec Kit 運用ガイド」](../docs-template/MASTER.md) に:

> 本リポジトリは AI Spec Driven Development を **GitHub Spec Kit 風の粒度管理で拡張** し、仕様ライフサイクルとLLM利活用を統合する。

と明示されており、フィールド構造（`specId`, owners 配列, 6ステータス, success/guardrails メトリクス, riskLevel 等）は [GitHub Spec Kit](https://github.com/github/spec-kit) のスタイルを踏襲。

### 6.2 コア 7 文書・拡張文書 - 本リポジトリ独自 (2026-02-08)

コミット `802416f` (#298, Issue #284) "feat: 7文書テンプレートに Frontmatter・Changelog・バージョニングルールを追加" で、specs/ 導入の **約 3.5 ヶ月後** (2025-10-22 → 2026-02-08、3 ヶ月 17 日) に追加された。コミット本文に:

> MASTER.md: **コア7文書と Spec Kit のスキーマスコープを明確に分離**

と明記されており、**最初から Spec Kit とは別系統だと意識して導入された**独自スキーマ。3 ステータス・`changeImpact`・SemVer + Changelog 連動は Spec Kit には対応物がなく、SSOT + AI 可読性を主目的にした独自設計。

### 6.3 なぜ統合しなかったか

- **粒度が違う**: コア7文書は「長寿命の知識ベース」、spec は「個別仕様のライフサイクル」。前者に 6 ステータスは過剰、後者に `changeImpact` は粒度不一致。
- **検証スクリプトを分けたい**: validate-docs（コア文書）と build-spec-index（spec）はチェック内容が違う。
- **MCP ツールが spec 側だけを索引化する設計**: `spec_lookup` / `spec_search` は spec 専用、コア文書は full-text で扱う。

---

## 7. ツール・環境別の対応状況

frontmatter スキーマと検証 Node スクリプトは **AI ツール非依存・OS 非依存** に設計されている。例外は MCP ツール群と `*.sh` スクリプト群の 2 点のみ。

### 7.1 AI ツール別

2026 年現在、Claude Code / Cursor / GitHub Copilot / OpenAI Codex CLI **すべて MCP 対応済み**。違いは「本リポジトリの MCP サーバーを自動で組み込むか / ユーザーが明示設定するか」の運用面のみ。frontmatter スキーマ自体は全ツールで共通に機能する。

| 項目                                                 | Claude Code | Cursor                                                      | GitHub Copilot                                        | Codex CLI / OpenAI Codex                              |
| ---------------------------------------------------- | ----------- | ----------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| frontmatter テキストを context として読む            | ✅          | ✅                                                          | ✅                                                    | ✅                                                    |
| `scripts/validate-docs.mjs` / `build-spec-index.mjs` | ✅          | ✅                                                          | ✅                                                    | ✅                                                    |
| MCP `spec_lookup` / `spec_search`                    | ✅ 自動呼出 | ✅ 要設定（`.cursor/mcp.json`）                             | ✅ 要設定（IDE / CLI / Cloud Agent の `mcp.json` 等） | ✅ 要設定（`codex mcp add` / `~/.codex/config.toml`） |
| プロジェクト指示ファイルから MASTER.md 強制参照      | `CLAUDE.md` | `.cursor/rules/*.mdc`（旧 `.cursorrules` も可、deprecated） | `.github/copilot-instructions.md`                     | `AGENTS.md`                                           |
| `changeImpact` / version bump 規律                   | ✅          | ✅                                                          | ✅                                                    | ✅                                                    |
| SSOT 原則                                            | ✅          | ✅                                                          | ✅                                                    | ✅                                                    |

**実用上の差**: 4 ツールいずれも MCP に対応しているが、**Claude Code は本リポジトリの MCP サーバーを `CLAUDE.md` / 設定経由で自動的に context へ組み込める**のに対し、他 3 ツールは `.cursor/mcp.json` / IDE Agent mode の `mcp.json` / `codex mcp add` での **明示的な MCP server 登録**が必要。MCP を設定せずに使う場合でも、spec ファイルは普通の Markdown としてそのまま読める（context window の消費量がやや増えるだけ）。frontmatter スキーマと本ガイドの内容はどのツールでもそのまま適用できる。

**参考一次情報**: [GitHub Copilot MCP](https://docs.github.com/en/copilot/concepts/context/mcp) / [OpenAI Codex MCP](https://developers.openai.com/codex/mcp) / [Cursor MCP](https://cursor.com/docs/mcp) / [Cursor Rules](https://cursor.com/docs/context/rules)。

### 7.2 実行環境別

frontmatter 管理（編集・検証・MCP）は Node スクリプトと標準ツール（git/gh/npm/markdownlint/prettier）だけで完結するため、**OS 非依存**。PR review 自動化や cleanup 系の `*.sh` スクリプトを使う場合のみ shell 環境の準備が必要。

| 項目                                                       | macOS / Linux | Windows native           | Windows + Git Bash      | Windows + WSL2 |
| ---------------------------------------------------------- | ------------- | ------------------------ | ----------------------- | -------------- |
| Node スクリプト（`validate-docs.mjs` 等）                  | ✅            | ✅                       | ✅                      | ✅             |
| frontmatter パーサー（`/\r?\n/` で CRLF 対応済み）         | ✅            | ✅                       | ✅                      | ✅             |
| `npm run quality:local`（`&&` 連結を含む）                 | ✅            | ✅                       | ✅                      | ✅             |
| `markdownlint-cli2` / `prettier` / `vitest` / `tsx`        | ✅            | ✅                       | ✅                      | ✅             |
| `git` / `gh` / `node` / `npm`                              | ✅            | ✅                       | ✅                      | ✅             |
| `.husky/pre-commit`（`#!/bin/sh` + `grep` / `xargs` 使用） | ✅            | ⚠️ sh + coreutils が必要 | ✅                      | ✅             |
| `scripts/*.sh`（`#!/bin/bash` の review wrapper / setup）  | ✅            | ❌                       | ✅                      | ✅             |
| Claude Code の `/merge-cleanup` / `/ace-curate` 等         | ✅            | ❌                       | ⚠️ 大半は動作（未検証） | ✅             |

**PowerShell について**: PowerShell をユーザーシェルにしていることは**問題にならない**。`npm` は Windows ではデフォルトで `cmd.exe` を **script-shell** として使うため（`npm config get script-shell` で確認可）、`&&` 連結を含む `npm run quality:local` も PowerShell 5.1 から呼んで動く（`&&` 自体が cmd.exe で動くため）。`git commit` の husky hook も Git 側が `sh.exe` で hook を実行するため、ユーザーシェルに依存しない。**本当に問題なのは「システムに `sh` / `bash` + coreutils (grep / xargs / awk 等) が存在し PATH に通っているか」**であり、Git for Windows をインストールすれば同梱される（インストーラのオプションは下記）。

**推奨セットアップ**:

- **frontmatter 管理だけしたい Windows ユーザー**: Node.js 20+ をインストールすれば OK。`*.sh` / husky hook を使わない範囲では追加準備不要。
- **PR review / merge-cleanup / ACE 等の自動化も使う Windows ユーザー**: **Git for Windows をインストール**。**インストーラの "Use Git and optional Unix tools from the Command Prompt"** を選ぶと `Git\usr\bin` まで PATH に追加され `sh.exe` / `bash.exe` / `grep` / `xargs` 等の coreutils が cmd.exe / PowerShell から使える。他のオプション（`Git\cmd` のみ）を選んだ場合は手動で `C:\Program Files\Git\usr\bin` を PATH に追加する。Claude Code の `/merge-cleanup` 等は bash の高度機能（process substitution 等）を使うため、**Git Bash で全機能が動く保証はなく実機検証推奨**。
- **より確実 / 快適に使いたい Windows ユーザー**: **WSL2 + Ubuntu** を導入。Linux 環境がそのまま使え、`*.sh` / husky / `/merge-cleanup` 等全て動作確認できている前提のシェル環境になる。VS Code Remote-WSL でファイル系の編集もシームレス。

### 7.3 既知の落とし穴

- **改行コード**: Windows でファイルを編集すると CRLF になることがある。frontmatter パーサーは全実装 `/\r?\n/` で正規化済みなので問題ないが、`.gitattributes` で `*.md text eol=lf` を強制しておくと差分ノイズが減る（本リポジトリは現状 `.gitattributes` 未配置のため、Windows 開発者を受け入れる際は `git add --renormalize .` も併せて実施するのが安全）。
- **`scripts/*.sh` を `./script.sh` で直接実行**: PowerShell / cmd.exe では `.sh` 拡張子の関連付けがないため、`bash ./scripts/multi-review.sh` のように明示する（本リポジトリの `scripts/*.sh` は shebang が `#!/bin/bash` か `#!/usr/bin/env bash` のため `sh` ではなく `bash` で起動するのが安全）。
- **MCP サーバーのパス**: Windows では `C:\Users\...\` 形式になるが、Claude Code の MCP 設定 JSON 内では `/` 区切りでも `\\` エスケープでも動作確認済み。他の MCP クライアント（Cursor / Codex / Copilot）はパス正規化処理の実装が異なる可能性があるため、各クライアントのドキュメントで `pathSeparator` 仕様を確認すること。

---

## 8. 関連ドキュメント

- [AI_SPEC_DRIVEN_DEVELOPMENT.md](AI_SPEC_DRIVEN_DEVELOPMENT.md) - 方法論の全体像
- [OPERATIONAL_GUIDE.md](OPERATIONAL_GUIDE.md) - AI Agent 向け運用仕様（frontmatter 詳細はここ）
- [PRACTICAL_GUIDE.md](PRACTICAL_GUIDE.md) - 各文書の詳細と実践的な活用法
- [docs-template/MASTER.md](../docs-template/MASTER.md) - スキーマ定義の正本（コア7 + Spec Kit 両方）
- [docs/specs/spec-template.md](specs/spec-template.md) - spec の雛形
- [scripts/validate-docs.mjs](../scripts/validate-docs.mjs) - コア文書検証スクリプト
- [scripts/build-spec-index.mjs](../scripts/build-spec-index.mjs) - spec 索引生成スクリプト
- [mcp/src/utils.ts](../mcp/src/utils.ts) - frontmatter パーサー実装

---

## Changelog

### [1.2.0] - 2026-05-19

#### 追加

- §7「ツール・環境別の対応状況」を新設（Issue #413）
  - §7.1 AI ツール別の対応状況（Claude Code / Cursor / GitHub Copilot / Codex CLI）— 4 ツール **全て MCP 対応済み**、差別化軸は「自動呼出（Claude Code）vs 明示設定（他 3 ツール）」。各ツールのプロジェクト指示ファイル名と MCP 設定方法を表で対比
  - §7.2 実行環境別の対応状況（macOS / Linux / Windows native / Windows + Git Bash / WSL2）— Node スクリプトは OS 非依存、`.husky/pre-commit` は **sh + coreutils (grep/xargs)** 要、`scripts/*.sh` は bash shebang のため Git Bash か WSL2 が必要
  - §7.2 に **PowerShell** 単独セクションを追加（npm の `script-shell` がデフォルト `cmd.exe` であり `&&` が cmd.exe で動く根拠、husky hook が Git 側 sh.exe 実行のためユーザーシェル非依存である根拠を明記）
  - §7.2 推奨セットアップで **Git for Windows のインストーラオプション "Use Git and optional Unix tools from the Command Prompt"** を案内（`Git\usr\bin` を PATH に通すため）
  - §7.3 既知の落とし穴（CRLF + `.gitattributes` 再正規化、`.sh` は `bash` で起動、MCP パスは Claude Code 動作確認済み他は実装依存）
- TL;DR にツール / 環境互換性の 1 行サマリーを追加
- 既存 §7「関連ドキュメント」を §8 にリナンバー

#### 訂正（PR #414 レビュー指摘反映）

- §7.1 MCP 列の「Copilot/Codex 非対応 ❌」→ 「全 4 ツール対応 ✅、明示設定が必要」に訂正（2026 年現在の公式仕様）
- §7.1 Cursor の指示ファイル `.cursorrules` → `.cursor/rules/*.mdc` を推奨（旧形式は deprecated）
- §7.1 Cursor の MCP「⚠️ 一部対応」→ 「✅ 要設定」に訂正（完全実装）
- §7.2 PowerShell 説明の「npm が内部で cmd.exe を spawn」→ 「npm の `script-shell` 設定が Windows でデフォルト `cmd.exe`」に正確化
- §7.2 表 `.husky/pre-commit` 要件を「sh.exe 必要」→ 「sh + coreutils (grep/xargs)」に詳細化（実 hook 内容に整合）
- §7.2 `/merge-cleanup` Windows + Git Bash セル: 「✅」→ 「⚠️ 大半は動作（未検証）」に弱める（bash の高度機能依存のため）

### [1.1.0] - 2026-05-19

#### 変更

- §2 / §4.1: `validate-docs.mjs` の検証対象を「CORE_DOCS 固定 7 ファイルのみ」と正確化（拡張文書・PLAYBOOK は CI 対象外であることを明示）
- §1.2: `dist/spec-index.json` の生成は MCP サーバーではなく `build-spec-index.mjs` であることを訂正
- §1.3: 行番号参照を `108-135 / 243 / 257 / 275` に細分化（`process.exit` の実体行）
- §3 / TL;DR: `docs/OPERATIONAL_GUIDE.md §7` の status enum (`active`) が stale な点を注記し、解消 Issue (#412) へリンク
- §5.1: 「最小雛形」を実テンプレと同形に変更（warning なしで通る 6 必須 + `changeImpact`）、拡張雛形を別建て
- §5.2: ネスト構造 (`links` / `metrics`) が MCP 上で string に丸められる点を注記
- §5.4.2: パーサー挙動差を 3 実装×5 機能の対応表に書き直し（C1/C2 fix）
- §5.4.3: BOM / 先頭空行 / 先頭 whitespace の 3 実装挙動差を明記
- §6.2: 「約 4 ヶ月後」を「約 3.5 ヶ月後 (3 ヶ月 17 日)」に正確化
- 行番号 hard-coded 参照（`MASTER.md:147` 等）を heading anchor 形式に置換

### [1.0.0] - 2026-05-19

#### 追加

- 初版作成（Issue #410）
