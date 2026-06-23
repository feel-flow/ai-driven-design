# ストーリーベース Issue テンプレート（2軸）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Issue テンプレートをストーリーベース（2軸: ユーザーストーリー / ジョブストーリー）に刷新し、受け入れ条件を Given-When-Then + DoD のハイブリッドに統一。従来型は参考パターンとして集約する。

**Architecture:** GitHub Issue chooser に出る「ライブ」テンプレ（`.github/` ドッグフード + `docs-template/.github/` 配布）をストーリー型に統一し、従来型は `docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md` に解説付きで保存。create-issue / refine-issue スキルをストーリー＋GWT 検証に連動更新する。コードではなく Markdown テンプレ・スキル定義の編集が中心で、検証は markdownlint（commit hook）・`mcp npm run check`・grep アサーションで行う。

**Tech Stack:** Markdown（GitHub Issue Forms 形式ではなく従来の `.md` テンプレ）、Bash（gh CLI / grep 検証）、Node.js（mcp の index チェック）。

## Global Constraints

- 対象は 2 セット: `.github/ISSUE_TEMPLATE/`（ドッグフード）と `docs-template/.github/ISSUE_TEMPLATE/`（配布）。**構造は同一、URL 形式のみ差分**。
- リンク形式は各セットの現行慣習を維持: **ドッグフード = `https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/...` 絶対 URL（ACE-046）**、**配布 = `../../...` 相対パス**。
- アンカー付きリンクはラベルと URL の両方に `#fragment` を含める（ACE-016）。新規追加するリンクで違反しないこと。
- 2 軸の定義:
  - ユーザーストーリー（feature / docs）: 「**[ペルソナ]** として、**[実現したいこと]** をしたい。なぜなら **[価値/理由]** だから。」
  - ジョブストーリー（bug / refactor / infra / chore）: 「**[状況/トリガー]** のとき、**[どうしたい]** したい。その結果 **[得たい結果]** が得られる。」
- AC は全テンプレ共通で「### 振る舞い（Given-When-Then）」+「### Definition of Done」の 2 ブロック。bug のみ GWT 見出しを「### 回帰シナリオ（Given-When-Then）」とする。
- タイトルは conventional-commit プレフィックス（`feat:` 等）を温存し、記述部をストーリー化。
- 既存の「参照ドキュメント」「6観点」「撤退コスト試算」の各セクションとリンクは**現行のまま温存**（本計画で新リンクを増やさない）。
- general_task.md はドッグフード専用（配布側には作らない）。
- 設計の正は `docs/superpowers/specs/2026-06-23-story-based-issue-templates-design.md`。

---

## Task 1: 従来型を参考パターン化する `ISSUE_TEMPLATE_PATTERNS.md` を作成

**Files:**
- Create: `docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md`

**Interfaces:**
- Produces: `06-reference/ISSUE_TEMPLATE_PATTERNS.md`（Task 7 の索引・MASTER 参照網が参照する）

**Why first:** 従来型テンプレ全文を先に保存しておくことで、Task 2〜4 でライブテンプレを上書きしても参考形が失われない。

- [ ] **Step 1: 参考ドキュメントを作成する**

`docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md` を以下の内容で作成（従来型は配布版＝相対リンク形を正とする）:

````markdown
# Issue テンプレート設計パターン

本リポジトリの Issue テンプレートは **ストーリーベース（推奨）** をデフォルトとし、
従来の conventional 型を **代替パターン** として本ドキュメントに保存している。

## なぜストーリーベースを推奨するか

本リポジトリの思想は「AI が苦手なのは "コーディング" ではなく "心を読むこと"」。
ストーリー形式は「誰のために・なぜ」という *意図* を起票者に強制的に言語化させる。
これは AI が推測で穴埋めしがちな部分を着手前に埋める装置であり、
このプロジェクトの思想の実装そのものである。

## 2 軸の使い分け

| 軸 | 対象種別 | 形式 |
| --- | --- | --- |
| ユーザーストーリー | feature, docs | 「**[ペルソナ]** として、**[実現したいこと]** をしたい。なぜなら **[価値]** だから。」 |
| ジョブストーリー | bug, refactor, infra, chore | 「**[状況]** のとき、**[どうしたい]** したい。その結果 **[得たい結果]** が得られる。」 |

技術系（bug/refactor/infra）は人格を立てにくい。状況（トリガー）で語る
ジョブストーリーのほうが嘘になりにくい。

## ストーリー型 vs 従来型 — 選択ガイド

| 状況 | 推奨 |
| --- | --- |
| エンドユーザー価値がある機能 | ユーザーストーリー型（feature） |
| 技術的負債・内部改善 | ジョブストーリー型（refactor 等） |
| 意図より手順が本質（定型作業・依存更新） | 従来型でも可 |
| 教材・サンプルとして conventional 型を見せたい | 従来型（本ドキュメントの全文を参照） |

## 従来型テンプレート（代替パターン・全文）

> 以下は conventional 型の従来テンプレ。ストーリー型に馴染まないプロジェクトは
> これらをコピーして `.github/ISSUE_TEMPLATE/` に配置してよい。

### feature.md（従来型）

```markdown
---
name: 新機能追加
about: 新しい機能を追加する
title: "feat: "
labels: enhancement
assignees: ""
---

## 概要

[この機能が何を実現するか、1〜2文で説明]

## 背景

[なぜこの機能が必要か、ビジネス上の理由]

## 受け入れ基準

- [ ] [具体的な動作1]
- [ ] [具体的な動作2]

## スコープ外（今回は対象外）

- [今回やらないこと]
```

### bug.md（従来型）

```markdown
---
name: バグ修正
about: バグを報告・修正する
title: "fix: "
labels: bug
assignees: ""
---

## 概要

[バグの概要を1〜2文で説明]

## 再現手順

1. [手順1]
2. [手順2]

## 期待される動作 / 実際の動作

- 期待: [本来どう動作すべきか]
- 実際: [現在どう動作しているか]

## 受け入れ基準

- [ ] [修正の確認項目]
```

### その他の従来型

refactor / infra / docs の従来型は git 履歴（本 PR 以前の
`docs-template/.github/ISSUE_TEMPLATE/`）に保存されている。必要に応じて
`git show <旧commit>:docs-template/.github/ISSUE_TEMPLATE/<name>.md` で参照すること。

## ライブテンプレート（ストーリー型・推奨）

実際に GitHub の Issue chooser に表示されるのはストーリー型のみ。
配置は `.github/ISSUE_TEMPLATE/`（本リポジトリ）/
`docs-template/.github/ISSUE_TEMPLATE/`（配布用）を参照。
````

- [ ] **Step 2: markdownlint を通す（コミットで自動実行）**

Run: `cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development && git add docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md && git commit -m "docs: #446 従来型Issueテンプレを参考パターンとして集約"`
Expected: `Linting: ... Summary: 0 error(s)` と表示されコミット成功

> markdownlint がネストしたコードフェンス（``` 内に ```）でエラーを出す場合、外側を 4 連バッククォート（````）に変更して再コミット。

---

## Task 2: ドッグフード — ユーザーストーリー型テンプレ（feature / docs）

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/feature.md`（全面書き換え）
- Modify: `.github/ISSUE_TEMPLATE/docs.md`（全面書き換え）

**Interfaces:**
- Consumes: なし（独立）
- Produces: ストーリー型 feature.md / docs.md（Task 5・6 のスキルが生成する body の手本）

- [ ] **Step 1: `.github/ISSUE_TEMPLATE/feature.md` を以下で全置換**

```markdown
---
name: 新機能追加
about: ユーザー価値のある新機能を追加する
title: "feat: "
labels: enhancement
assignees: ""
---

## ユーザーストーリー

> **[ペルソナ]** として、
> **[実現したいこと]** をしたい。
> なぜなら **[得られる価値／理由]** だから。

## 背景

[なぜこの機能が必要か、ビジネス上の理由]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: MASTER, ARCHITECTURE, DOMAIN

- [ ] [MASTER.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/MASTER.md)
- [ ] [ARCHITECTURE.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/02-design/ARCHITECTURE.md)
- [ ] [DOMAIN.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/02-design/DOMAIN.md)

> **推奨参照**: PATTERNS, TESTING

- [ ] [PATTERNS.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/03-implementation/PATTERNS.md)
- [ ] [TESTING.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/04-quality/TESTING.md)

## 関連Issue

- #XX [関連機能の説明]

## 6 観点フレームワーク（仮定を排除する）

> 書籍 第2章「AIが苦手なのは"コーディング"ではなく"心を読むこと"」より。AI 実装に着手する前に、この 6 観点が **すべて言語化されている**ことを確認する。1 つでも空欄のまま渡すと AI は「もっともらしい仮定」で穴埋めしてしまい、後工程で手戻りが発生する。

- [ ] **What**（何を作る）: 実現する機能の対象範囲
- [ ] **How**（どう実現する）: 採用するアプローチ／アルゴリズム／既存パターン
- [ ] **Where**（どこに配置する）: ファイル・モジュール・レイヤー
- [ ] **Constraint**（制約は何か）: 性能・互換性・依存関係・禁止事項
- [ ] **Format**（入出力の形式は）: 引数・戻り値・スキーマ・エラー型
- [ ] **Test**（どう検証する）: ユニット／統合／手動の判定基準

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [前提状態] **When** [操作] **Then** [期待結果]
- [ ] **Given** [前提状態] **When** [操作] **Then** [期待結果]

### Definition of Done

- [ ] ユニット／統合テストを追加し、既存テストもパスする
- [ ] markdownlint / lint エラーなし
- [ ] 関連ドキュメント更新（該当時）

## スコープ外（今回は対象外）

> **通常不要**: DEPLOYMENT

- DEPLOYMENT.md（インフラ変更なし）
- [その他、今回やらないこと]

## 撤退コスト試算（[docs/DESIGN_PRINCIPLES.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/DESIGN_PRINCIPLES.md) P5）

> 新機能・新ツール・新インフラを導入する Issue では、**「採用しないことになった場合に削除対象となる範囲」を着手前に見積もる**。撤退コスト > 採用メリット × 期待値 なら採用しない判断が正しい。

<!-- prettier-ignore -->
| 項目                      | 試算値                                      |
| ------------------------- | ------------------------------------------- |
| 新規ファイル数            | [N ファイル予定]                            |
| 編集ファイル数            | [N ファイル予定]                            |
| 専用 constants/types      | [あり / なし — 機能名: ...]                 |
| `docs-template/` への影響 | [N ファイル混入 / 影響なし]                 |
| 撤退判断のしきい値        | [例: 2 週間以内に重大バグが N 件出たら撤退] |

## その他

[補足情報があれば]
```

- [ ] **Step 2: `.github/ISSUE_TEMPLATE/docs.md` を以下で全置換**

```markdown
---
name: ドキュメント更新
about: ドキュメントの追加・更新
title: "docs: "
labels: documentation
assignees: ""
---

## ユーザーストーリー

> **[ドキュメントの読者ペルソナ]** として、
> **[何を理解／参照できるようにしたい]** をしたい。
> なぜなら **[得られる価値／理由]** だから。

## 背景

[なぜこの更新が必要か]

- [ ] 新機能のドキュメント化
- [ ] 既存ドキュメントの修正
- [ ] ドキュメントの再構成
- [ ] 古い情報の更新
- [ ] その他: [理由]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: MASTER

- [ ] [MASTER.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/MASTER.md)

> **対象文書**

- [ ] [更新対象のドキュメント]

## 関連Issue

- #XX [このドキュメントに関連する機能Issue]

## 対象ファイル

- `docs-template/xxx/YYY.md`

## 変更内容

### 追加する内容

- [追加項目1]

### 削除・修正する内容

- [削除・修正項目1]

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [読者の状況] **When** [この文書を参照すると] **Then** [得られる理解／到達できる手順]

### Definition of Done

- [ ] MASTER.md から参照されている（新規文書の場合）
- [ ] リンク切れがない
- [ ] markdownlint エラーなし
- [ ] フォーマットがプロジェクト規約に準拠している

## スコープ外（今回は参照不要）

- [更新対象以外のドキュメント]

## 備考

[特記事項があれば]
```

- [ ] **Step 3: ストーリー見出しと AC 構造を検証**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -c "## ユーザーストーリー" .github/ISSUE_TEMPLATE/feature.md .github/ISSUE_TEMPLATE/docs.md
grep -c "### 振る舞い（Given-When-Then）" .github/ISSUE_TEMPLATE/feature.md .github/ISSUE_TEMPLATE/docs.md
grep -rn "\.\./\.\./" .github/ISSUE_TEMPLATE/feature.md .github/ISSUE_TEMPLATE/docs.md || echo "相対リンクなし OK"
```

Expected: 各ファイルで「## ユーザーストーリー」=1、「### 振る舞い…」=1、相対リンク `../../` は 0 件（"相対リンクなし OK" 表示）

- [ ] **Step 4: コミット**

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
git add .github/ISSUE_TEMPLATE/feature.md .github/ISSUE_TEMPLATE/docs.md
git commit -m "feat: #446 feature/docsテンプレをユーザーストーリー型に刷新（ドッグフード）"
```

Expected: `Summary: 0 error(s)` でコミット成功

---

## Task 3: ドッグフード — ジョブストーリー型テンプレ（bug / refactor / infra / general_task）

**Files:**
- Modify: `.github/ISSUE_TEMPLATE/bug.md`
- Modify: `.github/ISSUE_TEMPLATE/refactor.md`
- Modify: `.github/ISSUE_TEMPLATE/infra.md`
- Modify: `.github/ISSUE_TEMPLATE/general_task.md`

**Interfaces:**
- Produces: ジョブストーリー型の 4 テンプレ

- [ ] **Step 1: `.github/ISSUE_TEMPLATE/bug.md` を以下で全置換**

````markdown
---
name: バグ修正
about: バグを報告・修正する
title: "fix: "
labels: bug
assignees: ""
---

## ジョブストーリー

> **[どんな状況・操作の]** とき、
> **[どう動いてほしい]** したい。
> その結果 **[得たい結果]** が得られる。

## 再現手順

1. [手順1]
2. [手順2]
3. [手順3]

## 期待される動作

[本来どう動作すべきか]

## 実際の動作

[現在どう動作しているか]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: 関連Issue, PATTERNS

- [ ] #XX [関連する過去のIssue]
- [ ] [PATTERNS.md#エラーハンドリング](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/03-implementation/PATTERNS.md#エラーハンドリング)

> **推奨参照**: TESTING

- [ ] [TESTING.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/04-quality/TESTING.md)

## 関連Issue

- #XX [このバグが発生した機能の元Issue]
- #XX [類似のバグ報告]

## スコープ外（今回は参照不要）

> **通常不要**: DOMAIN全体（バグ修正のため仕様変更なし）

- DOMAIN.md（仕様変更なし）
- PROJECT.md（ビジネス要件に変更なし）

## 環境

- OS: [例: macOS 14.0]
- ブラウザ: [例: Chrome 120]
- Node.js: [例: 20.x]

## エラーログ

```
[エラーメッセージがあれば貼り付け]
```

## 受け入れ条件（AC）

### 回帰シナリオ（Given-When-Then）

- [ ] **Given** [バグ発生条件] **When** [操作] **Then** [修正後の正しい挙動]

### Definition of Done

- [ ] このバグを再現する回帰テストを追加し、修正後にパスする
- [ ] lint エラーなし

## その他

[スクリーンショットや追加情報があれば]
````

- [ ] **Step 2: `.github/ISSUE_TEMPLATE/refactor.md` を以下で全置換**

````markdown
---
name: リファクタリング
about: コードの改善・リファクタリング
title: "refactor: "
labels: refactor
assignees: ""
---

## ジョブストーリー

> **[このコードを保守・拡張する]** とき、
> **[どういう構造にしたい]** したい。
> その結果 **[得たい結果（保守性・テスト容易性など）]** が得られる。

## 背景

[なぜこのリファクタリングが必要か]

- [ ] コードの可読性向上
- [ ] パフォーマンス改善
- [ ] 技術的負債の解消
- [ ] テスタビリティの向上
- [ ] その他: [理由]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: ARCHITECTURE, PATTERNS

- [ ] [ARCHITECTURE.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/02-design/ARCHITECTURE.md)
- [ ] [PATTERNS.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/03-implementation/PATTERNS.md)

> **推奨参照**: TESTING

- [ ] [TESTING.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/04-quality/TESTING.md)

## 関連Issue

- #XX [このコードが作成された元Issue]

## 対象ファイル

- `src/path/to/file.ts`
- `src/path/to/another.ts`

## 変更方針

### Before

```typescript
// 現在のコード（問題点をコメントで明示）
```

### After

```typescript
// 改善後のイメージ
```

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [既存の入力] **When** [リファクタ後の同一操作] **Then** [挙動が変わらない（既存テストがパス）]

### Definition of Done

- [ ] 既存のテストがすべてパスする（振る舞い不変）
- [ ] 新しいコードが PATTERNS.md に準拠している
- [ ] lint エラーなし

## スコープ外（今回は参照不要）

> **通常不要**: DOMAIN（機能変更なし）

- DOMAIN.md（ビジネスロジックの変更なし）
- DEPLOYMENT.md（デプロイ設定の変更なし）

## リスク

[リファクタリングによる影響範囲・リスクがあれば]
````

- [ ] **Step 3: `.github/ISSUE_TEMPLATE/infra.md` を以下で全置換**

```markdown
---
name: インフラ変更
about: インフラ・デプロイ設定の変更
title: "infra: "
labels: infrastructure
assignees: ""
---

## ジョブストーリー

> **[どんな運用・デプロイの]** とき、
> **[どうしたい]** したい。
> その結果 **[得たい結果（自動化・安定化など）]** が得られる。

## 背景

[なぜこの変更が必要か]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: MASTER, DEPLOYMENT

- [ ] [MASTER.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/MASTER.md)
- [ ] [DEPLOYMENT.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/05-operations/DEPLOYMENT.md)

> **推奨参照**: ARCHITECTURE

- [ ] [ARCHITECTURE.md#インフラ](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/02-design/ARCHITECTURE.md#インフラ)

## 関連Issue

- #XX [関連する過去のインフラ変更]

## 変更内容

- [ ] CI/CD パイプライン
- [ ] 環境変数
- [ ] Docker設定
- [ ] Kubernetes設定
- [ ] クラウドリソース
- [ ] 監視・アラート設定
- [ ] その他: [内容]

## 対象環境

- [ ] 開発環境
- [ ] ステージング環境
- [ ] 本番環境

## 対象ファイル

- `.github/workflows/xxx.yml`
- `docker-compose.yml`
- [その他]

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [トリガー条件] **When** [パイプライン／設定が走ると] **Then** [期待される結果状態]

### Definition of Done

- [ ] 対象環境で動作確認済み
- [ ] ロールバック手順が記載されている
- [ ] lint エラーなし

## スコープ外（今回は参照不要）

> **通常不要**: DOMAIN

- DOMAIN.md（ビジネスロジックの変更なし）
- PATTERNS.md（アプリケーションコードの変更なし）

## ロールバック手順

[問題が発生した場合の切り戻し方法]

## 撤退コスト試算（[docs/DESIGN_PRINCIPLES.md](https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs/DESIGN_PRINCIPLES.md) P5）

> 新ツール・新インフラを導入する場合、**「採用しないことになった場合に削除対象となる範囲」を着手前に見積もる**。インフラ系は依存が広がりやすく、撤退コストが大きくなりがち。

| 項目                          | 試算値                                     |
| ----------------------------- | ------------------------------------------ |
| 新規設定・スクリプト数        | [N ファイル予定]                           |
| 編集ファイル数                | [N ファイル予定]                           |
| 特定ツール依存物の有無        | [あり: ツール名 ... / なし]                |
| `docs-template/` への影響     | [N ファイル混入 / 影響なし]                |
| 撤退判断のしきい値            | [例: 月次運用コストが N 円超過したら撤退]  |

## リスク

- [想定されるリスク]
- [影響範囲]
```

- [ ] **Step 4: `.github/ISSUE_TEMPLATE/general_task.md` を以下で全置換**

```markdown
---
name: 汎用タスク (General Task)
about: プロジェクト全般のタスク（テンプレート改善、CI、ドキュメント整備など）
title: "【タスク】[タスクの概要]"
labels: "enhancement"
---

## ジョブストーリー（軽量）

> **[このタスクに着手する]** とき、
> **[何をしたい]** したい。
> その結果 **[得たい結果]** が得られる。

## 📌 スコープ確認

> **大きなタスクは分割してください。** 1 Issue = 1つの成果物が原則です。
> 「このIssueが完了した」と判断できる明確なゴールを設定してください。

- [ ] このIssueのスコープは1つの成果物に絞られている

## 概要

何をするタスクかを簡潔に記述してください。

## 目的

なぜこのタスクが必要かを記述してください。

## 対象ファイル

変更対象のファイルやディレクトリを記載してください。

## 参照ファイル

作業時に参照が必要なプロジェクト内のファイルを記載してください（対象ファイルとは別に）。

- （例: `CLAUDE.md`）
- （例: `docs-template/MASTER.md`）

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [前提] **When** [操作/確認] **Then** [期待結果]

### Definition of Done

- [ ] （具体的な完了条件を記載）
- [ ] lint エラーなし（該当時）
```

- [ ] **Step 5: ジョブストーリー見出しと AC 構造を検証**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -l "## ジョブストーリー" .github/ISSUE_TEMPLATE/bug.md .github/ISSUE_TEMPLATE/refactor.md .github/ISSUE_TEMPLATE/infra.md
grep -c "## ジョブストーリー（軽量）" .github/ISSUE_TEMPLATE/general_task.md
grep -c "### 回帰シナリオ（Given-When-Then）" .github/ISSUE_TEMPLATE/bug.md
grep -rn "\.\./\.\./" .github/ISSUE_TEMPLATE/bug.md .github/ISSUE_TEMPLATE/refactor.md .github/ISSUE_TEMPLATE/infra.md .github/ISSUE_TEMPLATE/general_task.md || echo "相対リンクなし OK"
```

Expected: bug/refactor/infra の 3 ファイルがリストされ、general_task の軽量見出し=1、bug の回帰シナリオ=1、相対リンク 0 件

- [ ] **Step 6: コミット**

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
git add .github/ISSUE_TEMPLATE/bug.md .github/ISSUE_TEMPLATE/refactor.md .github/ISSUE_TEMPLATE/infra.md .github/ISSUE_TEMPLATE/general_task.md
git commit -m "feat: #446 bug/refactor/infra/taskテンプレをジョブストーリー型に刷新（ドッグフード）"
```

Expected: `Summary: 0 error(s)` でコミット成功

---

## Task 4: 配布テンプレ（`docs-template/.github/ISSUE_TEMPLATE/`）をストーリー型に同期

**Files:**
- Modify: `docs-template/.github/ISSUE_TEMPLATE/feature.md`
- Modify: `docs-template/.github/ISSUE_TEMPLATE/docs.md`
- Modify: `docs-template/.github/ISSUE_TEMPLATE/bug.md`
- Modify: `docs-template/.github/ISSUE_TEMPLATE/refactor.md`
- Modify: `docs-template/.github/ISSUE_TEMPLATE/infra.md`

**Interfaces:**
- Consumes: Task 2/3 のドッグフード版（構造を一致させる）
- Produces: 配布版ストーリー型テンプレ（**相対リンク `../../` を使用**、general_task は作らない）

**変換ルール（ドッグフード版との唯一の差分）:** 本文の絶対 URL
`https://github.com/feel-flow/ai-spec-driven-development/blob/HEAD/docs-template/<path>`
を相対パス `../../<path>` に置換する。
（例: `.../blob/HEAD/docs-template/MASTER.md` → `../../MASTER.md`、
`.../blob/HEAD/docs-template/02-design/ARCHITECTURE.md#インフラ` → `../../02-design/ARCHITECTURE.md#インフラ`、
`.../blob/HEAD/docs/DESIGN_PRINCIPLES.md` → `../../../docs/DESIGN_PRINCIPLES.md`）

- [ ] **Step 1: `docs-template/.github/ISSUE_TEMPLATE/feature.md` を全置換**

Task 2 Step 1 の feature.md と同一。ただし参照リンクを相対形に:
- `[MASTER.md](../../MASTER.md)`
- `[ARCHITECTURE.md](../../02-design/ARCHITECTURE.md)`
- `[DOMAIN.md](../../02-design/DOMAIN.md)`
- `[PATTERNS.md](../../03-implementation/PATTERNS.md)`
- `[TESTING.md](../../04-quality/TESTING.md)`
- 撤退コスト見出し: `## 撤退コスト試算（[docs/DESIGN_PRINCIPLES.md](../../../docs/DESIGN_PRINCIPLES.md) P5）`

その他のセクション（ユーザーストーリー / 6観点 / AC / スコープ外 / 撤退コスト表 / その他）は Task 2 Step 1 と完全一致。

- [ ] **Step 2: `docs-template/.github/ISSUE_TEMPLATE/docs.md` を全置換**

Task 2 Step 2 の docs.md と同一。リンクのみ相対形:
- `[MASTER.md](../../MASTER.md)`

- [ ] **Step 3: `docs-template/.github/ISSUE_TEMPLATE/bug.md` を全置換**

Task 3 Step 1 の bug.md と同一。リンクのみ相対形:
- `[PATTERNS.md#エラーハンドリング](../../03-implementation/PATTERNS.md#エラーハンドリング)`
- `[TESTING.md](../../04-quality/TESTING.md)`

- [ ] **Step 4: `docs-template/.github/ISSUE_TEMPLATE/refactor.md` を全置換**

Task 3 Step 2 の refactor.md と同一。リンクのみ相対形:
- `[ARCHITECTURE.md](../../02-design/ARCHITECTURE.md)`
- `[PATTERNS.md](../../03-implementation/PATTERNS.md)`
- `[TESTING.md](../../04-quality/TESTING.md)`

- [ ] **Step 5: `docs-template/.github/ISSUE_TEMPLATE/infra.md` を全置換**

Task 3 Step 3 の infra.md と同一。リンクのみ相対形:
- `[MASTER.md](../../MASTER.md)`
- `[DEPLOYMENT.md](../../05-operations/DEPLOYMENT.md)`
- `[ARCHITECTURE.md#インフラ](../../02-design/ARCHITECTURE.md#インフラ)`
- 撤退コスト見出し: `## 撤退コスト試算（[docs/DESIGN_PRINCIPLES.md](../../../docs/DESIGN_PRINCIPLES.md) P5）`

- [ ] **Step 6: 配布版の構造・リンクを検証**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -l "ストーリー" docs-template/.github/ISSUE_TEMPLATE/*.md
grep -c "受け入れ条件（AC）" docs-template/.github/ISSUE_TEMPLATE/*.md
grep -rn "blob/HEAD" docs-template/.github/ISSUE_TEMPLATE/ || echo "絶対URLなし OK（配布は相対）"
```

Expected: 5 ファイルがストーリー見出しを持ち、各ファイルに「受け入れ条件（AC）」=1、`blob/HEAD` は 0 件（"絶対URLなし OK" 表示）

- [ ] **Step 7: コミット**

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
git add docs-template/.github/ISSUE_TEMPLATE/
git commit -m "feat: #446 配布版Issueテンプレをストーリー型に同期"
```

Expected: `Summary: 0 error(s)` でコミット成功

---

## Task 5: create-issue スキルをストーリー＋GWT 検証に更新

**Files:**
- Modify: `.claude/commands/create-issue.md`

**Interfaces:**
- Consumes: Task 2〜4 のテンプレ構造（生成 body の手本）

- [ ] **Step 1: 手順 1（種別確認）に chore を追加し、手順 3 をストーリー収集に書き換え**

`.claude/commands/create-issue.md` の「### 3. Issue 内容のヒアリング」セクションを以下で置換:

```markdown
### 3. Issue 内容のヒアリング（ストーリー収集）

種別に応じてストーリー要素を収集します:

- **ユーザー向け（新機能 / ドキュメント）= ユーザーストーリー**
  - ペルソナ（誰が）
  - 実現したいこと（何を）
  - 得られる価値／理由（なぜ）
- **技術系（バグ / リファクタ / インフラ / chore）= ジョブストーリー**
  - 状況・トリガー（どんなとき）
  - どうしたい（動機）
  - 得たい結果（その結果）

加えて以下を収集します:

- **タイトル**: conventional-commit プレフィックス（`feat:`/`fix:` 等）+ ストーリー要約
- **受け入れ条件**: 振る舞い（Given-When-Then）+ Definition of Done
```

- [ ] **Step 2: 手順 4（粒度チェック）にストーリー有無と GWT 形式の検証を追加**

「### 4. 受け入れ基準の粒度チェック」の検証リスト（4 項目のチェックボックス）の直後に以下を追記:

```markdown
- [ ] **ストーリーが埋まっているか**: ペルソナ/状況・動機・価値/結果のいずれも空欄でない
- [ ] **AC が GWT+DoD 形式か**: 「振る舞い（Given-When-Then）」と「Definition of Done」の 2 ブロックで記述されている
```

- [ ] **Step 3: 手順 5（生成 body 構造）をストーリー型に更新**

「### 5. Issue の作成」内の ```markdown ブロック（生成する body 構造）を以下で置換:

```markdown
## ユーザーストーリー / ジョブストーリー

[種別に応じたストーリー]

## 背景

[なぜ必要か]

## 参照文書

- [タスク種別に応じた参照文書リスト]

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** ... **When** ... **Then** ...

### Definition of Done

- [ ] [機械的完了条件]
- [ ] markdownlint エラーなし（該当する場合）
```

- [ ] **Step 4: 検証＆コミット**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -c "ジョブストーリー" .claude/commands/create-issue.md
grep -c "Given-When-Then" .claude/commands/create-issue.md
git add .claude/commands/create-issue.md
git commit -m "feat: #446 create-issueスキルをストーリー＋GWT検証に対応"
```

Expected: 両 grep が 1 以上、`Summary: 0 error(s)` でコミット成功

---

## Task 6: refine-issue スキルに第5観点「ストーリー有無」と GWT チェックを追加

**Files:**
- Modify: `.claude/commands/refine-issue.md`

- [ ] **Step 1: 手順 4 のバリデーション 4 観点に第 5 観点を追加**

`.claude/commands/refine-issue.md` の「### 4. 4 観点バリデーション」内のチェックリスト末尾（「受け入れ条件の明示」の次）に追記:

```markdown
- [ ] **ストーリー有無**: ユーザーストーリー（ペルソナ/価値）またはジョブストーリー（状況/結果）が言語化されているか
- [ ] **AC の GWT 形式**: 受け入れ条件が「振る舞い（Given-When-Then）」+「Definition of Done」で記述されているか
```

あわせて、同セクション見出しの「4 観点」表記を「5 観点」に更新し、冒頭説明文の「以下 4 観点」を「以下 5 観点」に修正する。

- [ ] **Step 2: Trivial 自動補完が書き出す body スケルトンをストーリー型に更新**

「#### Trivial → Issue body 自動補完」の例示で、AC を補完する際は GWT+DoD 形式（「振る舞い（Given-When-Then）」「Definition of Done」の 2 ブロック）で追記する旨を、注記コメント例の箇条書きに 1 行追加:

```markdown
- AC を「振る舞い（Given-When-Then）＋ Definition of Done」形式に再構成
```

- [ ] **Step 3: 検証＆コミット**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -c "ストーリー有無" .claude/commands/refine-issue.md
grep -c "5 観点" .claude/commands/refine-issue.md
git add .claude/commands/refine-issue.md
git commit -m "feat: #446 refine-issueに第5観点ストーリー有無とGWTチェックを追加"
```

Expected: 両 grep が 1 以上、コミット成功

---

## Task 7: ドキュメント整合と最終検証

**Files:**
- Modify: `docs/AI_GIT_WORKFLOW.md`（L123 付近）
- Modify: `docs-template/MASTER.md`（参照網に `ISSUE_TEMPLATE_PATTERNS.md` を追加）
- Modify: `docs-template/06-reference/` の索引（README 相当があれば。無ければ skip）

**Interfaces:**
- Consumes: Task 1 の `ISSUE_TEMPLATE_PATTERNS.md`

- [ ] **Step 1: `docs/AI_GIT_WORKFLOW.md` の 6観点運用記述にストーリー層を追記**

L123 付近の「> **運用**: 本リポジトリでは ... 6 観点チェックリストを組み込んでいます。」の段落直後に 1 文追加:

```markdown
> なお feature/docs はユーザーストーリー、bug/refactor/infra はジョブストーリーを最上位に置き、6 観点（how）の上位に「誰のために・なぜ」（why/what）を明示する構成にしています。従来型テンプレは [`docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md`](../docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md) に集約しています。
```

- [ ] **Step 2: `docs-template/MASTER.md` の参照網に追記**

MASTER.md 内で 06-reference 配下の文書を列挙している箇所（`GLOSSARY.md` や `DECISION_MATRIX.md` が並ぶリスト）を grep で特定し、同じ形式で `ISSUE_TEMPLATE_PATTERNS.md` の行を追加する。

Run（場所特定）:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
grep -n "DECISION_MATRIX\|GLOSSARY" docs-template/MASTER.md
```

特定した箇所に、既存行と同じ Markdown リスト形式で次を追加:
`- [ISSUE_TEMPLATE_PATTERNS.md](06-reference/ISSUE_TEMPLATE_PATTERNS.md) — Issue テンプレ設計パターン（ストーリー型=推奨 / 従来型=代替）`

> grep で該当が無い場合は、MASTER.md の参照構造を読み、06-reference を参照している最寄りのセクションに追記する。

- [ ] **Step 3: mcp index チェック**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development/mcp && npm run check
```

Expected: index チェックがパス（エラーなし）。新規 `ISSUE_TEMPLATE_PATTERNS.md` が index に未登録で警告が出る場合は、index 生成 `node scripts/build-spec-index.mjs` を実行してから再チェック。

- [ ] **Step 4: 品質ゲート全体**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development && npm run quality:local
```

Expected: 全チェックパス（`0 error(s)`）。markdownlint で新規・編集ファイルにエラーがあれば修正して再実行。

- [ ] **Step 5: リンク健全性の最終アサーション**

Run:

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
echo "=== ドッグフード: blob/HEAD であるべき / 相対 ../../docs は無いべき ==="
grep -rn "blob/HEAD/" .github/ISSUE_TEMPLATE/ | wc -l
grep -rn "\.\./\.\./" .github/ISSUE_TEMPLATE/ || echo "ドッグフードに相対リンクなし OK"
echo "=== 配布: 相対であるべき / blob/HEAD は無いべき ==="
grep -rn "blob/HEAD" docs-template/.github/ISSUE_TEMPLATE/ || echo "配布に絶対URLなし OK"
```

Expected: ドッグフードは `blob/HEAD/` が 1 件以上かつ相対リンク 0 件、配布は `blob/HEAD` 0 件

- [ ] **Step 6: コミット**

```bash
cd /Users/futoshi/GitHub/FEEL-FLOW/ai-spec-driven-development
git add docs/AI_GIT_WORKFLOW.md docs-template/MASTER.md
git commit -m "docs: #446 ストーリー型テンプレの運用説明とMASTER参照網を整合"
```

Expected: コミット成功

---

## 完了後フロー（参考）

実装完了後はユーザーのグローバル Git Workflow に従う:

1. `git push -u origin feature/#446-story-based-issue-templates`
2. `gh pr create --draft --base develop`（Closes #446）
3. Toolkit 一次レビュー（`/pr-review-toolkit:review-pr`）+ Codex cross-model（`pnpm code-review:codex -- --base develop`）
4. 指摘を 1 fix commit に束ねて対応
5. `gh pr ready` → `gh pr merge --squash`
6. `/merge-cleanup <PR番号>` → `/ace <PR番号>`
