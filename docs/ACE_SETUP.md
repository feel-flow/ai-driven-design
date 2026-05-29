---
id: ace-setup
title: ACE セットアップガイド
version: 1.1.0
status: active
created: 2026-03-13
updated: 2026-05-30
owner: feel-flow
tags: [ace, setup, knowledge-management, playbook]
references:
  - docs/ACE_FRAMEWORK.md
  - docs-template/08-knowledge/PLAYBOOK.md
  - docs-template/05-operations/deployment/ace-cycle.md
changeImpact: medium
---

# ACE セットアップガイド

> このドキュメントは **AIツール（Claude Code, GitHub Copilot 等）が読んで、ユーザーと対話しながら ACE フレームワークをセットアップする** ためのガイドです。
>
> **概念説明**: [ACE_FRAMEWORK.md](./ACE_FRAMEWORK.md) を参照
>
> **クイックスタート**:
>
> - Claude Code: `/ace-setup` コマンドを実行
> - その他のAIツール: このドキュメントの URL を渡して「ACEをセットアップしてください」と指示

## 目次

1. [前提条件](#1-前提条件)
2. [対話型セットアップフロー](#2-対話型セットアップフロー)
3. [テンプレート参照情報](#3-テンプレート参照情報)
4. [AIツール向け ACE 運用ルール テンプレート（Copilot / Cursor / Codex 等共通）](#ace-ops-template)
5. [トラブルシューティング](#5-トラブルシューティング)

---

## 1. 前提条件

- `/init-docs` またはそれに相当するセットアップが完了していること
- プロジェクトルートに `docs/` ディレクトリが存在すること
- `docs/MASTER.md` が存在すること

---

## 2. 対話型セットアップフロー

以下の 5 ステップをユーザーと対話しながら順に実行してください。

### Step 1: 前提確認

以下を自動チェックしてください:

1. **`docs/` ディレクトリの存在確認**
   - 存在しない場合: 「`docs/` が見つかりません。先に `/init-docs` を実行してドキュメント構造を初期化してください。セットアップを中止します。」と表示し、**セットアップを中止**する
2. **`docs/MASTER.md` の存在確認**
   - 存在しない場合: 同様に `/init-docs` の実行を推奨し、**セットアップを中止**する
3. **PLAYBOOK.md の既存チェック**
   - `docs/08-knowledge/PLAYBOOK.md` が既に存在する場合、ユーザーに以下の選択肢を提示:
     - **(a) セットアップを中止** — 既存の PLAYBOOK.md を維持する
     - **(b) バックアップして続行** — 既存ファイルを `PLAYBOOK.md.bak` にリネームして新規作成する

### Step 2: 配置先の確認

ユーザーに以下のデフォルトパスを提示し、変更するか質問してください:

| ファイル     | デフォルトパス                               |
| ------------ | -------------------------------------------- |
| PLAYBOOK.md  | `docs/08-knowledge/PLAYBOOK.md`              |
| ace-cycle.md | `docs/05-operations/deployment/ace-cycle.md` |

質問例: 「以下のパスにファイルを配置します。変更が必要な場合はお知らせください。そのままでよければ Enter（または「OK」）で進みます。」

### Step 3: ファイル配置

以下の手順でファイルを配置してください:

1. **ディレクトリの自動作成** — 配置先ディレクトリが存在しない場合は自動的に作成する
2. **PLAYBOOK.md の配置**
   - テンプレートリポジトリの `docs-template/08-knowledge/PLAYBOOK.md` の内容をコピーする
   - **重要**: エントリ一覧セクション内のサンプルエントリ（`ACE-001` 等）は削除し、空の状態にする
   - Frontmatter の `owner` をユーザーのプロジェクト情報で置換する
   - Frontmatter の `created` と `updated` を今日の日付で置換する
   - Frontmatter の `ace_entry_count` を `0` にする
   - Frontmatter の `version` を `1.0.0` にする
   - Changelog セクションは `[1.0.0]` の初版のみ残す
3. **ace-cycle.md の配置**
   - テンプレートリポジトリの `docs-template/05-operations/deployment/ace-cycle.md` の内容をコピーする

テンプレートの取得先については [3. テンプレート参照情報](#3-テンプレート参照情報) を参照してください。

### Step 4: AIツール固有の設定

ユーザーに対象 AI ツールを確認してください（複数選択可）:

- **(a) Claude Code** — `/ace-curate` コマンドを使う
- **(b) GitHub Copilot** — `.github/copilot-instructions.md` に追記
- **(c) Cursor** — `.cursorrules` に追記
- **(d) Codex / その他の AI エージェント** — `AGENTS.md` に追記

#### Claude Code の設定

`.claude/commands/ace-curate.md` をテンプレートリポジトリからコピーします。

- **パス置換**: ファイル内の `docs-template/08-knowledge/PLAYBOOK.md` を、Step 2 で確認した PLAYBOOK.md のパスに置換する
- **既存チェック**: `.claude/commands/ace-curate.md` が既に存在する場合は、ユーザーに確認する:
  - **(a) スキップ** — 既存ファイルを維持する
  - **(b) 上書き** — テンプレートで上書きする

#### 指示ファイルへの ACE 運用ルール追記（GitHub Copilot / Cursor / Codex / その他）

利用する AI ツールの指示ファイルに [§4 AIツール向け ACE 運用ルール テンプレート](#ace-ops-template) を追記します。配置先:

- GitHub Copilot → `.github/copilot-instructions.md`
- Cursor → `.cursorrules`
- Codex / その他の AI エージェント（Gemini 等）→ `AGENTS.md`

- **ファイルが存在しない場合**: 対象の指示ファイルを新規作成する
- **既存ファイルの場合**: 追記前に既存内容を確認し、`## ACE` や `## ACE (Agentic Context Engineering) 運用ルール` といった ACE 関連セクションが既に存在する場合は**スキップ**する
- 採番は **PRスコープ式**（`ACE-<PR番号>-<連番>`）。ルールの SSOT はテンプレート §4 と PLAYBOOK.md の §エントリID規則

### Step 5: 完了確認

以下の形式で配置結果を表示してください:

```markdown
## ACE セットアップ完了

以下のファイルを配置しました:

| ファイル                   | パス                                                       | 状態     |
| -------------------------- | ---------------------------------------------------------- | -------- |
| PLAYBOOK.md                | docs/08-knowledge/PLAYBOOK.md                              | 新規作成 |
| ace-cycle.md               | docs/05-operations/deployment/ace-cycle.md                 | 新規作成 |
| ace-curate.md              | .claude/commands/ace-curate.md                             | 新規作成 |
| 指示ファイル（選択ツール） | .github/copilot-instructions.md / .cursorrules / AGENTS.md | 追記     |

## 次のステップ

1. PRマージ・cleanup 後に ACE サイクルを実行してみましょう:
   - Claude Code: `/ace-curate` コマンドを実行
   - Copilot / Cursor / Codex 等: 指示ファイルの ACE 運用ルールに従い「ACEサイクルを実行してください」と指示
2. ACE フレームワークの詳細は [ACE_FRAMEWORK.md](./ACE_FRAMEWORK.md) を参照
```

実際に配置した/スキップしたファイルに応じて「状態」列を調整してください（新規作成 / スキップ / バックアップ後作成 / 上書き / 追記 など）。

---

## 3. テンプレート参照情報

テンプレートファイルは以下のリポジトリから取得してください:

| ファイル      | リポジトリ内パス                                      | GitHub URL                                                                                                                         |
| ------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| PLAYBOOK.md   | `docs-template/08-knowledge/PLAYBOOK.md`              | [GitHub](https://github.com/feel-flow/ai-spec-driven-development/blob/develop/docs-template/08-knowledge/PLAYBOOK.md)              |
| ace-cycle.md  | `docs-template/05-operations/deployment/ace-cycle.md` | [GitHub](https://github.com/feel-flow/ai-spec-driven-development/blob/develop/docs-template/05-operations/deployment/ace-cycle.md) |
| ace-curate.md | `.claude/commands/ace-curate.md`                      | [GitHub](https://github.com/feel-flow/ai-spec-driven-development/blob/develop/.claude/commands/ace-curate.md)                      |

**リポジトリ**: `feel-flow/ai-spec-driven-development`

---

<a id="ace-ops-template"></a>

## 4. AIツール向け ACE 運用ルール テンプレート（Copilot / Cursor / Codex 等共通）

以下のテンプレートを、利用する AI ツールの指示ファイルに追記してください（GitHub Copilot → `.github/copilot-instructions.md`、Cursor → `.cursorrules`、Codex / その他の AI エージェント → `AGENTS.md`）。テンプレート本文はツール非依存です。
`{{PLAYBOOK_PATH}}` は Step 2 で確認した PLAYBOOK.md のパスに置換してください。

````markdown
## ACE (Agentic Context Engineering) 運用ルール

### PLAYBOOK.md の配置場所

- パス: `{{PLAYBOOK_PATH}}`

### ACEサイクル手順（PRマージ後に実行）

PRマージ後に以下の3フェーズを実行してください:

#### Phase 1: Generate（知見抽出）

対象PRの diff、Issue内容、レビューコメントを分析し、将来の開発で役立つ知見候補を抽出する。

分析観点:

1. コーディングパターン: 採用した設計判断とその理由
2. テスト戦略: テストの書き方で得た教訓
3. セキュリティ: 脆弱性対策の知見
4. パフォーマンス: 最適化のヒント
5. アーキテクチャ: 構造上の決定事項
6. プロセス: ワークフロー・ツール活用の改善点

#### Phase 2: Reflect（評価・分類）

各知見候補について以下を評価する:

- 再現性が「中」以上か（低ならスキップ）
- 影響度が「中」以上か（低ならスキップ）
- 既存 Playbook エントリと重複しないか（重複なら Helpful +1）
- 既存エントリと矛盾しないか（矛盾なら既存を deprecated にして新規作成）

評価マトリクス:

| 基準   | 判定                      |
| ------ | ------------------------- |
| 汎用性 | 汎用的 / プロジェクト固有 |
| 再現性 | 高 / 中 / 低              |
| 影響度 | 高 / 中 / 低              |
| 新規性 | 新規 / 重複 / 矛盾        |

#### Phase 3: Curate（増分更新）

PLAYBOOK.md のエントリ一覧セクション末尾に新エントリを追記する。

### エントリフォーマット

`ACE-XXX` の `XXX` は **PRスコープ式 ID** に置換する: `ACE-<PR番号>-<連番>`（例 `ACE-438-1`、非PR由来は `ACE-i<Issue番号>-<連番>` 例 `ACE-i425-1`）。採番は対象 PR の既存 `ACE-<PR番号>-*` の最大連番 +1（既存が無ければ連番 `1`、すなわち `ACE-438-1`）で、全体の最新 ID を読む必要がない（並行採番でも衝突しない）。anchor は ID を小文字化した `<a id="ace-438-1"></a>` を見出し直前に付与する。

```
### ACE-XXX: [タイトル]

| フィールド | 値 |
|-----------|---|
| Category | coding / architecture / testing / security / performance / devops / process / tooling |
| Origin | PR #XXX / Issue #YYY |
| Date | YYYY-MM-DD |
| Helpful | 0 |
| Harmful | 0 |
| Status | active |

**Insight**: [知見の本質を1-2文で記述]

**Context**: [この知見が発見された状況・条件を記述]

**Action**: [推奨する具体的なアクション]
```

### 運用ルール

#### 末尾追記ルール

- エントリは常にファイル末尾（Changelog セクションの直前）に追記する
- 既存エントリの本文（Insight/Context/Action）の書き換えは禁止
- カウンター更新と Status 変更のみ許可

#### カウンター運用ルール

- Helpful/Harmful は **+1（インクリメント）のみ**。減算・リセットはしない
- `Harmful >= 3` かつ `Helpful < Harmful` の場合、`deprecated` を検討する
- `Helpful >= 5` は高品質エントリ（PATTERNS.md への昇格を検討）

#### Frontmatter 更新ルール

エントリ追加時に以下を更新する:

- `version`: マイナーバージョンをインクリメント
- `updated`: 今日の日付
- `ace_entry_count`: 全エントリ数（deprecated 含む）

#### コミットメッセージ規則

- 形式: `knowledge: ACE-<PR番号>-<連番> [category] [summary]`（例 `knowledge: ACE-441-1 [testing] ...`）
- 複数エントリ: `knowledge: ACE-441-1,ACE-441-2 [category1,category2] [summary]`
- カウンター更新のみ: `knowledge: ACE-016 [category] helpful+1`

### 既存エントリ照合手順

新規知見を追記する前に、PLAYBOOK.md の既存エントリを確認し:

1. 同じテーマのエントリが存在するか検索する
2. 重複する場合は既存エントリの `Helpful` を +1 する
3. 矛盾する場合は既存エントリの `Status` を `deprecated` に変更し、新エントリを作成する
4. 新規の場合のみ末尾に追記する
````

---

## 5. トラブルシューティング

### `docs/` ディレクトリが存在しない

**原因**: `/init-docs` が未実行

**対応**: 先に `/init-docs`（または相当するセットアップ）を実行してから、再度 ACE セットアップを実行してください。

### PLAYBOOK.md が既に存在する

**原因**: 過去に ACE セットアップを実行済み、または手動で配置済み

**対応**: Step 1 の選択肢に従い、中止またはバックアップ後に続行してください。既存の PLAYBOOK.md にエントリが蓄積されている場合は、中止を推奨します。

### 指示ファイル（copilot-instructions.md / .cursorrules / AGENTS.md）が存在しない

**原因**: 対象 AI ツールの指示ファイルが未作成

**対応**: Step 4 で対象の指示ファイル（Copilot → `.github/copilot-instructions.md` / Cursor → `.cursorrules` / Codex 他 → `AGENTS.md`）が自動的に新規作成されます。特別な対応は不要です。

### ace-curate.md が既に存在する

**原因**: 過去にコピー済み、またはテンプレートリポジトリから直接導入済み

**対応**: Step 4 の選択肢に従い、スキップまたは上書きを選択してください。パスの置換状態が最新であるか確認したい場合は上書きを選択してください。

### テンプレートファイルの取得に失敗する

**原因**: ネットワーク接続の問題、またはリポジトリのアクセス権限

**対応**: [テンプレート参照情報](#3-テンプレート参照情報) の GitHub URL に直接アクセスして内容を確認してください。ローカルにテンプレートリポジトリをクローンしている場合は、ローカルパスから取得することもできます。

---

## Changelog

### [1.1.0] - 2026-05-30

#### 変更

- §4 を tool-agnostic な「AIツール向け ACE 運用ルール テンプレート（Copilot / Cursor / Codex 等共通）」に一般化（explicit anchor `#ace-ops-template` 付与）。Step 4・Step 5・トラブルシューティングを全ツール対応に。エントリ ID の採番例・コミットメッセージ例を **PRスコープ式**（`ACE-<PR番号>-<連番>`）に更新（Issue #442 / PR #443）

### [1.0.0] - 2026-03-13

#### 追加

- 初版作成: ACE 対話型セットアップガイド（5ステップフロー、Copilot用テンプレート内包）
