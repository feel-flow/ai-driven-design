---
id: frontmatter-guide
title: Frontmatter ガイド - なぜ・どこで・何を書くか
version: 1.0.0
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
- **2系統スキーマがある**:
  1. **コア7文書・拡張文書スキーマ** （本リポジトリ独自、3ステータス `draft|review|approved`、`changeImpact`、SemVer）
  2. **`docs/specs/` 配下スキーマ** （GitHub Spec Kit 由来、6ステータスライフサイクル、`specId`、メトリクス）
- **付ける場所**: コア7文書、拡張文書（GLOSSARY, DECISIONS, FAQ 等）、`docs/specs/**`、PLAYBOOK 等の運用文書。
- **付けないテンプレ**: `GETTING_STARTED*.md`、`SETUP_*.md` のような「採用前に読む手順書」は本文置換のみで OK（[docs-template/README.md:121](../docs-template/README.md)）。
- **検証**: `node scripts/validate-docs.mjs` でコア文書、`node scripts/build-spec-index.mjs` で spec を CI 検証。MCP サーバーは `parseFrontMatter` で読み取って `spec_lookup` / `spec_search` に供給。

---

## 1. Why - なぜ frontmatter を付けるのか

### 1.1 ドキュメントを「機械可読な SSOT」にするため

人間向け Markdown は自由度が高く、メタデータ（バージョン、ステータス、所有者）を本文に書くと:

- 同じ情報が複数箇所に散らばる（重複違反）
- 表記揺れが起きる（`v1.0` / `1.0.0` / `Version 1`）
- AI ツール・スクリプトが安定して抽出できない

frontmatter は **YAML というスキーマ言語** にメタデータを閉じ込めることで、これを 1 箇所に集約する。本リポジトリでは `docs-template/MASTER.md:147` 等で「**バージョン: Frontmatter の `version` を参照**」と本文側からも明示し、SSOT を担保している。

### 1.2 AI ツールに「最小コンテキスト」を渡すため

`mcp/src/index.ts` の MCP サーバーは frontmatter をパースして:

- `spec_lookup(specId)` で spec の frontmatter + 本文を返す
- `spec_search(query)` でタイトル・タグから絞り込み
- `dist/spec-index.json` を生成し、AI が「全文 grep せずにメタデータだけで候補を絞れる」状態を作る

→ LLM に与えるコンテキストを最小化し、ハルシネーションを減らす。

### 1.3 CI で品質ゲートを回すため

`npm run quality:local` で実行される `scripts/validate-docs.mjs` は:

- frontmatter の有無
- 必須フィールド (`title`, `version`, `status`, `owner`, `created`, `updated`) の存在
- `status` 値が enum（`draft|review|approved`）に収まっているか
- `version` が SemVer に従っているか

を検証し、不備があれば `process.exit(1)` で CI を落とす（[validate-docs.mjs:108-135](../scripts/validate-docs.mjs)）。

### 1.4 変更影響と Changelog を連動させるため

`changeImpact` フィールド（`low|medium|high`）が `version` の bump 規則と Changelog 追記を制御する（[OPERATIONAL_GUIDE §7, §8](OPERATIONAL_GUIDE.md)）:

- `high` → メジャー bump + Changelog 必須
- `medium` → マイナー bump
- `low` → パッチ bump

→ ドキュメントを **コードと同じ規律でバージョン管理**する仕掛け。

---

## 2. What - 付けると何が起きるのか

| パイプライン                    | 入力                                | frontmatter から拾うフィールド                                        | 出力 / 効果                                                      |
| ------------------------------- | ----------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `scripts/validate-docs.mjs`     | `docs-template/**/*.md` のコア7文書 | `title`, `version`, `status`, `owner`, `created`, `updated`           | 必須フィールド・enum・SemVer 検証。失敗で exit 1                 |
| `scripts/build-spec-index.mjs`  | `docs/specs/**/*.md`                | `specId`, `title`, `status`, `version`, `tags`, `links`, `metrics` 他 | `dist/spec-index.json` を生成。`specId` 重複・enum 違反で exit 1 |
| `mcp/src/index.ts` MCP サーバー | 上記2系統                           | `parseFrontMatter` で全フィールド                                     | `spec_lookup` / `spec_search` ツールが AI に最小コンテキスト供給 |
| `npm run quality:local`         | リポジトリ全体                      | 上記すべて                                                            | 旧 GitHub Actions CI 相当の品質ゲート（PR 前に手動実行）         |

### 2.1 スクリプトの実装場所

- パーサー: `mcp/src/utils.ts` `parseFrontMatter` （リポジトリで最も整備されている実装）
- 簡易パーサー: `scripts/validate-docs.mjs` / `scripts/build-spec-index.mjs`（外部依存なしの自前実装）

---

## 3. Where (rule) - どこに指示が書いてあるか

frontmatter に関するルールは以下に**分散**している。本ガイドはその索引でもある。

| 文書                                                                                        | 役割                                  | 主な内容                                                    |
| ------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------- |
| [docs/OPERATIONAL_GUIDE.md §7 FRONTMATTER TEMPLATE](OPERATIONAL_GUIDE.md)                   | **AI Agent 向け運用仕様**（最も詳細） | 全フィールド一覧表、必須/任意区分、`changeImpact` 判断基準  |
| [docs/OPERATIONAL_GUIDE.md §8 UPDATE / CHANGE POLICY](OPERATIONAL_GUIDE.md)                 | 更新フロー                            | `changeImpact` → version bump → Changelog 連動の手順        |
| [docs-template/MASTER.md 「文書運用ルール / Frontmatter」](../docs-template/MASTER.md)      | **コア7文書・拡張文書のスキーマ定義** | 必須/任意フィールド、ステータスワークフロー、バージョニング |
| [docs-template/MASTER.md 「Spec Kit 運用ガイド」](../docs-template/MASTER.md)               | **`docs/specs/` 配下のスキーマ定義**  | `specId` 命名規約、6ステータスライフサイクル、メトリクス    |
| [docs/specs/spec-template.md](specs/spec-template.md)                                       | spec の雛形ファイル                   | コピーして使う実物                                          |
| [docs-template/README.md:121](../docs-template/README.md)                                   | テンプレ採用時の置換手順              | 「frontmatter を持つ/持たないテンプレ」の区別               |
| [docs-template/08-knowledge/PLAYBOOK.md:35, 146](../docs-template/08-knowledge/PLAYBOOK.md) | PLAYBOOK 固有ルール                   | `ace_entry_count` 等の追加フィールド管理                    |

---

## 4. Where (target) - どのファイルに付けるか

### 4.1 付ける対象（必須）

| 対象                                                   | スキーマ                           | 検証スクリプト          |
| ------------------------------------------------------ | ---------------------------------- | ----------------------- |
| `docs-template/MASTER.md`                              | コア7文書スキーマ                  | `validate-docs.mjs`     |
| `docs-template/01-context/PROJECT.md`                  | 同上                               | 同上                    |
| `docs-template/02-design/ARCHITECTURE.md`              | 同上                               | 同上                    |
| `docs-template/02-design/DOMAIN.md`                    | 同上                               | 同上                    |
| `docs-template/03-implementation/PATTERNS.md`          | 同上                               | 同上                    |
| `docs-template/04-quality/TESTING.md`                  | 同上                               | 同上                    |
| `docs-template/05-operations/DEPLOYMENT.md`            | 同上                               | 同上                    |
| 拡張文書（GLOSSARY, DECISIONS, FAQ, API, DATABASE 等） | コア7文書スキーマ                  | 同上                    |
| `docs/specs/**/*.md`                                   | **Spec Kit スキーマ**（別系統）    | `build-spec-index.mjs`  |
| `docs/*.md`（本ガイド含む方法論文書）                  | コア7文書スキーマに準拠            | 任意（CI 必須ではない） |
| `docs-template/08-knowledge/PLAYBOOK.md`               | コア7文書 + `ace_entry_count` 拡張 | 任意                    |

### 4.2 付けないテンプレ（[docs-template/README.md:121](../docs-template/README.md) の明示ルール）

| 対象                                                 | 理由                                   |
| ---------------------------------------------------- | -------------------------------------- |
| `docs-template/GETTING_STARTED.md`                   | 採用前に読む手順書（ライフサイクル外） |
| `docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md` | 同上                                   |
| `docs-template/GETTING_STARTED_NEW_PROJECT.md`       | 同上                                   |
| `docs-template/SETUP_CLAUDE_CODE.md`                 | ツール固有のセットアップ手順           |
| `docs-template/SETUP_CURSOR.md`                      | 同上                                   |
| `docs-template/SETUP_GITHUB_COPILOT.md`              | 同上                                   |
| `docs-template/README.md`                            | ナビゲーション用                       |

→ これらは frontmatter を持たず、**本文中の `{{プロジェクト名}}` 等プレースホルダーの置換のみ**で採用する。

---

## 5. How - どう書くか

### 5.1 コア7文書・拡張文書スキーマ（本リポジトリ独自）

**最小コピペ雛形**:

```yaml
---
id: my-document-id # kebab-case の一意識別子
title: My Document Title
version: 0.1.0 # SemVer 必須
status: draft # draft | review | approved の3値
created: 2026-05-19 # YYYY-MM-DD
updated: 2026-05-19 # YYYY-MM-DD
owner: feel-flow # team-name または @username
phase: mvp # planning | mvp | extension | optimization
tags: [topic-a, topic-b] # 任意（検索・分類用）
references: # 任意（関連ドキュメント）
  - docs-template/MASTER.md
changeImpact: medium # low | medium | high（初版は省略可、初回変更時に追加）
---
```

**ステータスワークフロー** ([docs-template/MASTER.md:623-637](../docs-template/MASTER.md)):

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

**6ステータスライフサイクル** ([docs-template/MASTER.md:404-413](../docs-template/MASTER.md)):

| 状態           | 目的     | 出口条件           |
| -------------- | -------- | ------------------ |
| `draft`        | 初稿作成 | レビューワ割当     |
| `review`       | 内容検証 | 全必須コメント解消 |
| `approved`     | 合意済   | 実装着手           |
| `implementing` | 実装中   | 全 PR マージ       |
| `done`         | 運用     | 非推奨決定         |
| `deprecated`   | 廃止準備 | 削除 or 置換       |

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

#### 5.4.2 パーサーは「自前 YAML サブセット」

`mcp/src/utils.ts:33` と `scripts/validate-docs.mjs:74` の `parseFrontMatter` は外部ライブラリを使わない簡易実装で、以下の制約がある:

- **ネストした map は parse できない**（例: `owners: - github: id` の中の `github: id` まで深堀りしない）
- **複数行 YAML 文字列**は `>-` / `|` を空文字に丸める
- **配列は `[a, b, c]` 形式 か `- item` 行のみ**対応

→ 凝った YAML を書くとパースで落ちる。**テンプレからずらすときは必ず `validate-docs.mjs` を回す**。

#### 5.4.3 frontmatter 開始は **ファイル冒頭**

最初の行が `---` でないとパーサーは frontmatter として認識しない（[validate-docs.mjs:77](../scripts/validate-docs.mjs)、[utils.ts:35](../mcp/src/utils.ts)）。BOM や先頭空行があると検出失敗する。

#### 5.4.4 SAMPLE バナー付きテンプレファイル

[PLAYBOOK.md:280-282](../docs-template/08-knowledge/PLAYBOOK.md) で導入された**「SAMPLE — テンプレートです」バナー付き**のファイル（`DECISION_TREE.md` 等）は、採用時にバナーを削除すると同時に frontmatter の `created` / `updated` / `owner` を自プロジェクト値に書き換える運用。コピペしたまま放置しないこと。

---

## 6. 出自と歴史的経緯

frontmatter スキーマが 2 系統あるのは **歴史的経緯** による。

### 6.1 `docs/specs/` 配下 - Spec Kit 由来 (2025-10-22)

コミット `ef0f697` "feat(mcp): implement low-level custom MCP server with resources/tools and spec/glossary indexing" で MCP サーバーと同時に導入された。`docs-template/MASTER.md:363-365` に:

> 本リポジトリは AI Spec Driven Development を **GitHub Spec Kit 風の粒度管理で拡張** し、仕様ライフサイクルとLLM利活用を統合する。

と明示されており、フィールド構造（`specId`, owners 配列, 6ステータス, success/guardrails メトリクス, riskLevel 等）は [GitHub Spec Kit](https://github.com/github/spec-kit) のスタイルを踏襲。

### 6.2 コア7文書・拡張文書 - 本リポジトリ独自 (2026-02-08)

コミット `802416f` (#298, Issue #284) "feat: 7文書テンプレートに Frontmatter・Changelog・バージョニングルールを追加" で、specs/ 導入の **約 4 ヶ月後**に追加された。コミット本文に:

> MASTER.md: **コア7文書と Spec Kit のスキーマスコープを明確に分離**

と明記されており、**最初から Spec Kit とは別系統だと意識して導入された**独自スキーマ。3 ステータス・`changeImpact`・SemVer + Changelog 連動は Spec Kit には対応物がなく、SSOT + AI 可読性を主目的にした独自設計。

### 6.3 なぜ統合しなかったか

- **粒度が違う**: コア7文書は「長寿命の知識ベース」、spec は「個別仕様のライフサイクル」。前者に 6 ステータスは過剰、後者に `changeImpact` は粒度不一致。
- **検証スクリプトを分けたい**: validate-docs（コア文書）と build-spec-index（spec）はチェック内容が違う。
- **MCP ツールが spec 側だけを索引化する設計**: `spec_lookup` / `spec_search` は spec 専用、コア文書は full-text で扱う。

---

## 7. 関連ドキュメント

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

### [1.0.0] - 2026-05-19

#### 追加

- 初版作成（Issue #410）
