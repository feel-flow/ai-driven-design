---
title: "PLAYBOOK"
version: "1.26.0"
status: "approved"
created: "2026-03-10"
updated: "2026-05-30"
owner: "@fffokazaki"
ace_entry_count: 49
tags: [ace, playbook, knowledge-management]
references:
  - docs/ACE_FRAMEWORK.md
  - docs-template/05-operations/deployment/ace-cycle.md
---

# ACE Playbook

> **Parent**: [BEST_PRACTICES.md](./BEST_PRACTICES.md) | **関連**: [ACE サイクル運用手順](../05-operations/deployment/ace-cycle.md) | [ACE フレームワーク概念](../../docs/ACE_FRAMEWORK.md)

## 概要

### 目的

ACE (Agentic Context Engineering) Playbook は、開発プロセスで得た知見を **AIツールが直接参照できる構造化形式** で蓄積するファイルです。

GitHub Discussions が「人間が読むためのナラティブ（物語的記録）」であるのに対し、Playbook は「AIが参照するための構造化知見（delta方式: 差分のみを末尾追記する更新方式）」として機能します。

### 運用ルール

| ルール                             | 説明                                                                                                                           |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **末尾追記のみ**                   | エントリは常にファイル末尾に追記。既存エントリの本文（Insight/Context/Action）書き換えは禁止。カウンター更新・Status変更は許可 |
| **カウンターはインクリメントのみ** | Helpful/Harmful は +1 のみ。減算・リセットはしない                                                                             |
| **削除禁止**                       | エントリを物理的に削除しない。不要な場合は `Status: deprecated` に変更                                                         |
| **800行超過時は分割**              | `playbook/` サブディレクトリにカテゴリ別ファイルとして分割                                                                     |
| **Frontmatter更新**                | エントリ追加時に `version`, `updated`, `ace_entry_count` を更新                                                                |
| **コミット規則**                   | `knowledge: ACE-XXX [category] [summary]` 形式で記録                                                                           |

### エントリID規則

ACE エントリ ID は **PRスコープ式** を採用する（このセクションが ID 規則の SSOT）。複数人・複数AIが並行で `/ace-curate` を回しても番号が衝突しないための構造である。

- **形式**: `ACE-<PR番号>-<連番>`（例: `ACE-438-1`, `ACE-438-2`）
- **非PR由来の fallback**: `ACE-i<Issue番号>-<連番>`（例: `ACE-i425-1`）
- **採番**: 同一 PR の既存 `ACE-<PR番号>-*` の最大連番 +1 を連番とする（既存が無ければ連番 `1`、すなわち最初のエントリは `ACE-<PR番号>-1`）。**全体の最新 ID を読む必要がない**ため並行採番でも衝突しない（PR 番号は GitHub が全体一意に採番するため、別 PR = 別 namespace）。
- **連番の範囲**: 1 回の `/ace-curate` で同一 PR から 1〜3 件追記する想定。同一 PR を再 curate する場合は既存の最大連番から継続。
- **既存 ID の扱い**: 旧 `ACE-{連番3桁}` 形式（`ACE-001`〜）のエントリは **改名しない**。旧 3 桁形式と新 PRスコープ式は恒久的に共存する（参照・anchor 互換の維持）。ID にファイル位置の情報は持たせないため、分割後も ID はそのまま維持する。

---

## カテゴリ一覧

| カテゴリ       | 説明                                               | 例                                |
| -------------- | -------------------------------------------------- | --------------------------------- |
| `coding`       | コーディングパターン、言語固有のベストプラクティス | 型安全性、エラーハンドリング      |
| `architecture` | 設計判断、構造上の決定事項                         | レイヤー設計、モジュール分割      |
| `testing`      | テスト戦略、テストパターン                         | モック設計、テストデータ管理      |
| `security`     | セキュリティ対策、脆弱性防止                       | 認証、暗号化、入力検証            |
| `performance`  | パフォーマンス最適化                               | キャッシュ、クエリ最適化          |
| `devops`       | CI/CD、デプロイ、環境構築                          | パイプライン、インフラ設定        |
| `process`      | 開発プロセス、ワークフロー改善                     | レビュー手法、タスク管理          |
| `tooling`      | ツール設定、開発環境                               | IDE設定、リンター、フォーマッター |

---

## ステータス定義

| ステータス   | 説明                                   | 遷移条件                                                |
| ------------ | -------------------------------------- | ------------------------------------------------------- |
| `active`     | 有効な知見                             | 新規作成時のデフォルト                                  |
| `deprecated` | 非推奨（古い情報、矛盾が発見された等） | Harmful >= 3 かつ Helpful < Harmful、または明示的な判断 |

---

## エントリテンプレート

新しいエントリを追記する際は、以下のテンプレートを使用してください：

```markdown
<a id="ace-XXX"></a>

### ACE-XXX: [タイトル（簡潔で検索しやすい表現）]

| フィールド | 値                                                                                    |
| ---------- | ------------------------------------------------------------------------------------- |
| Category   | coding / architecture / testing / security / performance / devops / process / tooling |
| Origin     | PR #XXX / Issue #YYY                                                                  |
| Date       | YYYY-MM-DD                                                                            |
| Helpful    | 0                                                                                     |
| Harmful    | 0                                                                                     |
| Status     | active                                                                                |

**Insight**: [知見の本質を1-2文で記述]

**Context**: [この知見が発見された状況・条件を記述]

**Action**: [推奨する具体的なアクション。可能であればコード例も含める]
```

### 記述ガイドライン

- **anchor**: 各エントリは見出し直前に `<a id="ace-XXX"></a>` を 1 行付与する。`XXX` は **エントリ ID を小文字化したもの**（新規は `ace-438-1` / `ace-i425-1`、旧エントリは `ace-001`。anchor 部分は常に小文字英数字＋ハイフン）。ファイルレベル参照（`PLAYBOOK.md` 単体）は常にファイル先頭に着地するため、anchor がなければ個別エントリへの誘導が成立しない。anchor 付与により他ドキュメントから `[ACE-438-1](path/to/PLAYBOOK.md#ace-438-1)` 形式で**特定エントリに直接ジャンプ可能**になる。
- **参照リンク形式**: 他ドキュメントから ACE エントリを参照する場合は `[ACE-XXX](path/to/PLAYBOOK.md#ace-XXX)` 形式に統一する（`XXX` はエントリ ID の接頭辞 `ACE-` / `ace-` を除いた部分。新規は `438-1`、旧は 3 桁 `040`。label は `ACE-438-1`、anchor は `#ace-438-1`）。`[PLAYBOOK ACE-XXX]` / `[PLAYBOOK.md ACE-XXX]` 等の異なる label は使わない（[ACE-040](#ace-040) 語彙統一 / [ACE-024](#ace-024) 用語衝突防止 の系。Origin: Issue [#425](https://github.com/feel-flow/ai-spec-driven-development/issues/425)）。
- **Insight**: 「何を学んだか」を簡潔に。1-2文。
- **Context**: 「どんな状況で発見したか」を記述。再現条件が明確であるほど価値が高い。
- **Action**: 「次回何をすべきか」を具体的に。コード例があると AIツールが直接適用しやすい。

---

## Helpful / Harmful カウンター運用

### カウンター更新タイミング

| タイミング                                     | 更新内容            |
| ---------------------------------------------- | ------------------- |
| ACE サイクルで既存エントリと重複する知見を発見 | Helpful +1          |
| 既存エントリの知見に従って問題を回避できた     | Helpful +1          |
| 既存エントリの知見に従ったが問題が発生した     | Harmful +1          |
| 既存エントリの内容が古くなっていると判明       | 検討の上 deprecated |

### エントリ品質の目安

| カウンター状態                           | 解釈                                       |
| ---------------------------------------- | ------------------------------------------ |
| `Helpful >= 5`                           | 高品質エントリ。PATTERNS.md への昇格を検討 |
| `Helpful >= 3, Harmful == 0`             | 良質なエントリ                             |
| `Harmful >= 3, Helpful < Harmful`        | deprecated 候補                            |
| `Helpful == 0, Harmful == 0`（90日以上） | 有効性未検証。次回関連タスクで意識的に検証 |

---

## ファイル分割ルール

Playbook が 800 行を超えた場合、以下のように分割する：

```
08-knowledge/
├── PLAYBOOK.md           ← 索引 + 運用ルール（200行程度）
└── playbook/
    ├── coding.md         ← Category: coding のエントリ群
    ├── architecture.md   ← Category: architecture のエントリ群
    ├── testing.md        ← Category: testing のエントリ群
    ├── security.md       ← Category: security のエントリ群
    ├── performance.md    ← Category: performance のエントリ群
    ├── devops.md         ← Category: devops のエントリ群
    ├── process.md        ← Category: process のエントリ群
    └── tooling.md        ← Category: tooling のエントリ群
```

分割時の手順：

1. カテゴリ別にエントリをサブファイルに移動
2. PLAYBOOK.md に索引テーブルを残す（エントリID + タイトル + 参照先）
3. 以降の新規追記は該当カテゴリのサブファイルに行う
4. Frontmatter の `ace_entry_count` は全エントリの合計を維持

---

## エントリ一覧

<!-- ここから下にエントリを追記してください。最新のエントリが末尾になるように追記します。 -->
<!-- 追記例:
<a id="ace-XXX"></a>

### ACE-XXX: N+1クエリの発生パターンと防止策

| フィールド | 値 |
|-----------|---|
| Category | performance |
| Origin | PR #42 |
| Date | 2026-03-15 |
| Helpful | 0 |
| Harmful | 0 |
| Status | active |

**Insight**: User モデルの関連を eager loading せずに一覧取得すると N+1 クエリが発生する。

**Context**: PR #42 のレビューで、ユーザー一覧APIのレスポンスタイムが3秒超になっていた。原因は各ユーザーの所属組織を個別クエリで取得していたこと。

**Action**: 一覧取得時は `include` オプションで関連を一括取得する。`findMany({ include: { organization: true } })`
-->

<a id="ace-001"></a>

### ACE-001: クロスモデルレビューは単一AIモデルでは検出できない問題を発見する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #316 / PR #319 |
| Date       | 2026-03-10        |
| Helpful    | 6                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 異なるAIモデル（Claude/Codex/Gemini/CodeRabbit）は異なるカテゴリの問題を検出する。単一モデルのレビューでは見落とされる問題が、クロスモデルレビューで発見される。

**Context**: PR #316（ドキュメント）では Claude がnpmパッケージ名の間違いと壊れたリンク、Codex がスクリプト未実装注記の不足、Gemini Bot がパッケージスコープの間違いと無料枠数値の不一致、CodeRabbit が未実装スクリプトの注記不足を検出。PR #319（スクリプト）では Codex が CRITICAL_BLOCK 誤検出バグを発見し、Claude の pr-review-toolkit（code-reviewer + silent-failure-hunter）が stderr 握りつぶし・サイレントフォールバック・空結果の偽成功を検出。いずれも単一モデルでは検出されなかった。

**Action**: PR作成前のセルフレビューでは、`pr-review-toolkit`（Claude系サブエージェント）と `codex review --base develop`（GPT系クロスモデル）の両方を実行する。Bot系レビュー（Gemini Code Assist, CodeRabbit）がある場合はその指摘も確認する。

---

<a id="ace-002"></a>

### ACE-002: CLIフラグは実機の --help 出力と照合が必須

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #316 / Issue #315 |
| Date       | 2026-03-10           |
| Helpful    | 2                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Web検索やAI生成の情報だけでは CLI フラグの正確性は保証されない。`codex -p` は存在せず `codex exec` が正解、Copilot `-s` は sandbox ではなく `--silent`、Cursor `-p` は boolean フラグでプロンプトは positional 引数など、実機確認しなければ分からない差異が多い。

**Context**: Multi-CLI Review ドキュメント作成時に5つのAI CLIのフラグを調査。Web検索とAI生成の情報を信じてドキュメント化したが、セルフレビューと実機テストで複数の誤りが発覚。特に Codex CLI は `-p` フラグが存在しないにもかかわらず、Web上の古い情報では `-p` が使われていた。

**Action**: CLI ツールのフラグを記述する際は、(1) `command --help` で実機確認、(2) 公式リポジトリの README/docs と照合、(3) 可能なら `--dry-run` 等で動作確認、の3ステップを必ず実施する。

---

<a id="ace-003"></a>

### ACE-003: bash スクリプトは macOS デフォルト環境（bash 3.2）でテストする

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | devops               |
| Origin     | PR #319 / Issue #317 |
| Date       | 2026-03-10           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: macOS のデフォルト bash は 3.2（bash 4.0+ が GPLv3 に移行したため Apple が更新を停止）であり、`declare -A`（連想配列）、`head -n -1`（GNU拡張）、`timeout` コマンドなどが使えない。CI環境（Linux, bash 5.x）では動くが macOS では動かないスクリプトが生まれやすい。

**Context**: `multi-review.sh` を連想配列ベースで実装したところ、macOS の bash 3.2 で `declare -A: invalid option` エラーが発生。関数ベースのルックアップに書き直し、`head -n -1` を `sed` に変更、`timeout` を kill ベースフォールバックに変更して解決。

**Action**: bash スクリプトの移植性を確保するには、(1) 連想配列の代わりに case 文/関数ルックアップを使用、(2) GNU 拡張コマンドには POSIX 互換フォールバックを用意、(3) macOS のデフォルト環境で `--dry-run` テストを実施する。shebang は `#!/usr/bin/env bash` のまま、bash 3.2+ 互換コードを書く。

---

<a id="ace-004"></a>

### ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

| フィールド | 値         |
| ---------- | ---------- |
| Category   | process    |
| Origin     | PR #350    |
| Date       | 2026-03-18 |
| Helpful    | 1          |
| Harmful    | 0          |
| Status     | active     |

**Insight**: ドキュメントに「自動実行」と記載したが、実際にはCLAUDE.mdの指示に基づいてAIツールが順次実行する仕組みだった。「自動」「手動」「並列」「順次」等の動作表現が実装メカニズムと乖離すると、読者（人間・AI両方）が誤った前提で行動し、トラブルシューティング時に混乱する。

**Context**: PR #350 のレビューでCodeRabbitが「自動実行」表現と`execute_tasks()`の実装（事前計画の一括/順次実行）の不一致を指摘。また`npm run code-review:codex`が`package.json`に未定義であることも発覚。ドキュメント作成時に「こうなるべき」を「こうなっている」として記述してしまうパターン。

**Action**: ドキュメントに動作説明を書く際は、(1) 実装コード/設定ファイルで実際の動作を確認、(2) 記載するコマンドは実在を検証（`package.json`のscripts、`--help`出力等）、(3) 「自動」「手動」等の表現は実装メカニズムに基づいて正確に選択する。

---

<a id="ace-005"></a>

### ACE-005: 索引と実体を分離する委譲パターンでAIコンテキスト消費を抑える

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | architecture         |
| Origin     | PR #369 / Issue #368 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: AI が常時参照する中心文書（MASTER.md / PATTERNS.md 等）には **索引（概要 + リンク）のみ** を置き、実体は専用ファイルに分離する委譲パターンを採用すると、AI は必要なときだけ実体ファイルをロードできるためコンテキスト消費が抑えられる。文書側の認知負荷も下がり、レビューしやすい diff になる。

**Context**: PR #369 で Decision Tree（配置判断ガイド）を docs-template に追加する際、既存の `FALLBACK.md`（PATTERNS.md 3.3 節から委譲）と同じ構造を採用。MASTER.md には 1 行リンクのみ、PATTERNS.md には「概要表 + 詳細リンク」の索引セクション（11節）、実体は新規 `DECISION_TREE.md` に集約。pr-review-toolkit / Codex の 5/5 レビューでも整合的な階層として APPROVED。

**Action**: docs-template に大型ガイド（100行超）を追加する際は、(1) MASTER.md など最上位文書には**1〜2行のリンクのみ** 追加、(2) PATTERNS.md など中間文書には「概要表 + 詳細リンク」の索引セクションを置く、(3) 実体は専用ファイルに集約。既存の参照実装: `FALLBACK.md`, `DECISION_TREE.md`。

---

<a id="ace-006"></a>

### ACE-006: サンプル付きテンプレファイルには⚠️SAMPLEバナーと固有化手順を必ず併設する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #369 / Issue #368 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: docs-template/ 配下のテンプレで具体例（特定ドメインのパス・名前）を含める場合、採用プロジェクトが固有化を忘れて「サンプルのまま運用される」失敗モードが発生する。冒頭の **⚠️ SAMPLE バナー** と末尾の **「プロジェクト固有化の手順」** セクションをセットで配置することで、採用時の見落としを構造的に防げる。

**Context**: PR #369 の `DECISION_TREE.md` は Web API バックエンドをサンプルドメインとして `infrastructure/clients/` 等の具体的パスを含む構成にした。設計時の失敗モード分析で「Web API サンプルのパスが消えないまま使われる（F1）」「自プロジェクトと合わない分岐が残る（F2）」を識別し、防御策として SAMPLE バナーとプロジェクト固有化手順（コピー → 書き換え → バナー削除 → frontmatter 更新）を明文化。

**Action**: docs-template に具体例（コードパス、ドメイン名、実装名）を含む新規テンプレファイルを追加する際は: (1) ファイル冒頭に `> ⚠️ **SAMPLE — テンプレートです**` 引用ブロックと書き換え案内を配置、(2) 末尾に「プロジェクト固有化の手順」セクション（番号付き手順 + frontmatter の `created/updated/owner` 置換まで含める）を配置、(3) 該当しない分岐・セクションは「**該当セクションごと削除してよい**」と明記、(4) 該当する失敗モード（採用後にサンプルのまま残る等）を仕様書側にリストアップしておく。

---

<a id="ace-007"></a>

### ACE-007: Claude Code skill 内のツール参照は名称・subagent_type を実機 / system prompt で照合する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Claude Code の skill 定義（`.claude/commands/*.md`）に SubAgent 起動を書く際、ツール名は **`Task`** であり `Agent` ではない。subagent_type も Claude Code 公式の組み込み（`Explore` / `general-purpose` 等）と照合する必要がある。誤った名称を skill に書くと、実行時にモデルが対応するツールを引けず失敗する。

**Context**: PR #374 の `/refine-issue` skill で `Agent ツール（subagent_type: Explore）` と記述したところ、4 つのレビュアー（Toolkit code-reviewer / comment-analyzer、Copilot、Gemini）のうち 3 つが「`Agent` ツールは Claude Code に存在しない、`Task` が正解」と独立して指摘。設計プラン側でも `Task tool` と `Agent(...)` の表記揺れがあった。Claude Code の system prompt で公式 tool 一覧と Available agent types を確認すれば防げる。

**Action**: skill 内で SubAgent / Tool 呼び出しを書く際は、(1) Claude Code の公式 system prompt 内 "Tools available" / "Available agent types" を確認、(2) ツール名 `Task` / `Edit` / `Read` 等を正確に書く、(3) `subagent_type` は組み込み（`general-purpose`, `Explore`, `output-style-setup`, `statusline-setup` 等）+ プロジェクトの `.claude/agents/` 定義を確認、(4) 環境依存の subagent_type（`Explore` 等）は `general-purpose` を fallback として併記する。

---

<a id="ace-008"></a>

### ACE-008: クロスリポジトリ操作する skill は全 gh コマンドに `--repo` 必須・mention は `@<assignee>` を使う

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: skill が「クロスリポジトリ対応」を謳う場合、`gh issue view` だけでなく **`gh issue edit` / `gh issue comment` / `gh label create` / `gh issue edit --add-label` の全てに `--repo <owner/repo>` を渡す**必要がある。1 つでも欠けると、別 repo の Issue を更新できないか、現在の repo の同番号 Issue を誤更新する。さらに mention placeholder は `@<owner>` だと GitHub が repo 所有者（organization）と解釈して**組織全体に通知が飛ぶ事故**が起きるため、`@<assignee>` を使う。

**Context**: PR #374 の `/refine-issue` skill 初版で、`gh issue view` には `--repo` を付けていたが後続の edit / comment / label create には付け忘れていた。Copilot と Gemini の両方が「全 gh コマンドに `--repo` を渡せ」を独立して指摘。さらに Gemini が `@<owner>` プレースホルダの誤メンション問題を指摘し、`@<assignee>` への変更を提案。

**Action**: クロスリポジトリ対応 skill を書く際は、(1) skill 冒頭の入力パースで `repo` を確定したら以降の **全** gh サブコマンドに `--repo <owner/repo>` を必須で渡す規約を明示、(2) skill 末尾に「使用する gh CLI コマンド一覧」テーブルを置いて保守者が一覧確認できるようにする、(3) mention placeholder は `@<assignee>` を使い、bot suffix（`[bot]`）は skip する fallback 規則を書く、(4) `gh label create` は `--force` で「不在時 create / 存在時 update」の冪等にする。

---

<a id="ace-009"></a>

### ACE-009: 長時間 Orchestrator の失敗の真因は upstream Issue spec 曖昧さ — 探索型 refine が必要

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #374 / Issue #373 |
| Date       | 2026-04-26           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: AI Orchestrator (完遂型 / A 型) で Issue を自動完遂する仕組みが「結構できないものが多い」と感じたとき、真因は **Orchestrator の賢さ不足ではなく、入力 Issue の spec 曖昧さ**であることが多い。曖昧な spec を渡された Orchestrator は推測で穴埋めするしかなく、ハズす。必要なのは「曖昧な Issue → 実行可能な Issue」に研ぎ澄ます探索型 (B 型) skill を upstream に置くこと。

**Context**: 当初は「長時間駆動 Orchestrator + compact 耐性」のアーキテクチャをブレストしていたが、「A 型 Orchestrator の失敗パターン」を深掘りした結果、根本原因が Issue spec 自体の曖昧さに移動。`/create-issue`（新規 Issue ゲート）は既存だったが、既に立った曖昧 Issue を refine する手段がなかった。`/refine-issue` MVP を先に作ってから Orchestrator ループ・司令ファイルを後付けする路線にスコープ変更し、6 観点ブレストで設計を確定。

**Action**: 「AI agent が信頼できない / 完遂率が低い」と感じたら、(1) agent 自体の改善より先に、与えている入力データ (Issue / spec / プロンプト) の品質を疑う、(2) upstream に「入力を磨く skill」を置けないか検討する、(3) ブレストで「真因が一段下のレイヤーにある」可能性を必ず一度は検証する、(4) MVP は upstream の単一 skill に絞り、Orchestrator ループ等は動作確認後に後付けする路線が安全（空回りを高速化するリスクを避ける）。

---

<a id="ace-010"></a>

### ACE-010: Issue クローズ前は commit log でなく現在のファイル実体を grep 照合する — silent regression を検出する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #387 / Issue #360 |
| Date       | 2026-04-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Issue が PR で完了したと判断する際、関連 PR の commit message・diff・タイトルだけを根拠に「完了」と決めるのは危険。同じファイルを触る後続 PR が stale-base merge / 衝突解決ミスで silent revert を起こしている可能性があり、commit log を遡るだけでは「現在の develop の実体」を保証できない。今回 Issue #360（MD060 lint 有効化）は PR #384 で完了したと判断して一旦クローズしたが、46 分後にマージされた PR #377（chore: no GitHub Actions）が `.markdownlint.json` に `"MD060": false` を再追加する形で silent revert していた。develop の実体は未達成のまま、再 open と修正 PR #387 が必要になった。

**Context**: Issue #360 / PR #383 / PR #384 / PR #377 が 2026-04-27 数時間以内に同じ config と表整形を並行で触り、AI エージェントが PR #384 の commit メッセージ「MD060 再有効化」を根拠に「Issue #360 は完了」と判断してクローズを実行。Issue #386（後継 Prettier 導入）に着手する直前に develop の `.markdownlint.json` を実際に開いたところ `"MD060": false` が残存していて regression が発覚。`git log -p .markdownlint.json` で追跡すると PR #384 → PR #377 の順で「有効化 → 再無効化」になっていた。

**Action**: AI エージェントが Issue / PR を「完了」として閉じる前に必ず:

1. **受け入れ基準を develop の最新実体に対して検証する** — `git switch develop && git pull --ff-only` の後で `cat path/to/config` または `grep -n target path/to/config` で受け入れ基準が満たされているかを直接確認する。Closes #N が含まれる commit が積まれていることは「実体が達成されている」ことを意味しない。
2. **受け入れ基準が config / lint / format / CI 設定系なら、当該ファイルの直近 N コミットを必ず追う** — `git log -p -10 path/to/config` で関連時期に silent revert がないかチェックする。1 行追加 / 1 行削除の往復は git log で時系列を見ないと発見しにくい。
3. **同領域を触る PR が並行している時期は特に警戒する** — 24h 以内に同 path を触る PR が 2 件以上あり、片方が古い base から派生している場合 stale-base merge による silent regression のリスクが高い。merge 後に必ず実体検証を挟む。
4. **AI エージェントが「クローズ判断」のような shared state 操作を行う前に advisor / 別 agent に検証させる** — 大規模リポジトリで commit メッセージだけで判断するのはハイリスク。

---

<a id="ace-011"></a>

### ACE-011: Prettier × markdownlint MD060 衝突は当該テーブルだけに `<!-- prettier-ignore -->` を付与する局所抑制で解く

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #388 / Issue #386 |
| Date       | 2026-04-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: Prettier と markdownlint は GFM テーブル整列の判定基準が異なる（Prettier は `string-width` / Unicode 11 emoji 幅、markdownlint MD060 は東アジア幅基準）。絵文字（🛠 など）混在テーブルでは、Prettier が「整列している」と判断する状態で markdownlint MD060 が「整列していない」と判断する、両者を同時に満たす整列が存在しない衝突状態が生じる。設定レベル（`proseWrap` / `printWidth`）で解決しようとしても無理（両者の幅算定アルゴリズム自体の差なので config では合わせられない）。最小スコープの解は当該テーブル直前に `<!-- prettier-ignore -->` を 1 行付与し、markdownlint 側に整列を合わせること。Prettier はその 1 ブロックだけスキップし、他のテーブル / 本文整形は通常通り効く。

**Context**: PR #388 で `prettier@^3.8.3` を Markdown 整形ツールとして導入する際、`docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` の `🛠 Fixes` を含む 2 つのテーブル（行 47 / 行 151）で Prettier 整形後に MD060 が 3 件 fail する状態を確認。`format:md:check` と `lint:md` を同時に通したいが、`prettier --write` を当てると markdownlint が落ち、markdownlint に合わせると `format:md:check` が落ちる、というデッドロック。`<!-- prettier-ignore -->` を当該テーブルの直前に置き、markdownlint が要求する trailing-space 整列を保持する形で両立を実現。

**Action**: AI エージェントが Markdown lint と Markdown formatter を同居させるリポジトリで作業する際:

1. **Prettier 導入 PR では必ず先に `npm run format:md && npm run lint:md` を順に実行**してデッドロック箇所を洗い出す。後から個別 fix するより、衝突候補を最初に列挙する方が局所抑制スコープを正確に定義できる。
2. **衝突は「絵文字 / 全角記号 / 半角・全角混在」のテーブルセルに集中する**ことを前提に視覚検査する。string-width の Unicode 幅テーブルと markdownlint の幅判定の差は予測不能なので、empirical に当該行を見つけるしかない。
3. **`<!-- prettier-ignore -->` は当該テーブル / コードブロックの直前に 1 行置くだけ**。範囲指定（end コメントなど）は不要で、Prettier は次の単一ノードだけをスキップする。グローバル `.prettierignore` で対象ファイル全体を除外するのは過剰（他の整形が利かなくなる）なので避ける。
4. **PR 本文に「Prettier (string-width 基準) と markdownlint MD060 (異なる幅算定) で衝突する」理由を明記する**。再発時に他の作業者が同じ調査を 0 から繰り返さないため。
5. **`format:md:check` を `quality:local` に組み込む順序は `validate → format:md:check → lint:md`**。整形検査を構文検査の前に置くことで「整形漏れ」と「文法違反」が同時に出ても切り分けやすくなる。

---

<a id="ace-012"></a>

### ACE-012: PR マージ・push 前は必ず `git status` でブランチを確認する（develop 直 push 事故防止）

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | process                        |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Date       | 2026-05-06                     |
| Helpful    | 0                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: バックグラウンドでブランチが切り替わる事象は外部プロセス（他作業者の `gh pr merge`、IDE 拡張、自動化フック等）で発生しうる。**自分のターン内で `git checkout` していないことは、現在のブランチが想定通りである保証にならない**。`git push` の直前には必ず `git branch --show-current` または `git status` の出力を確認する。同様に Issue 着手時は、同 Issue 用の他ブランチや未追跡ファイルが既に存在しないか `git branch | grep -w <issue-number>` および `git status -uall` で確認する習慣を入れる。

**Context**: Issue #295 の作業中、PR #391 がユーザーまたは他プロセスにより突然マージされ、ローカル HEAD が feature branch から develop に自動切り替わった。この切り替わりに気づかず `git push` した結果、レビュー対応コミット（ba391fa）が develop に直接乗り、`Never commit directly to develop` ルールに違反。`git revert ba391fa` + 新 PR #393 で正規化が必要となった。さらに同 Issue の作業着手時にも、別ブランチ `feature/#295-organization-rollout-guide` と未追跡ファイル `06-reference/ORGANIZATION_ROLLOUT.md` が既に存在することに気づかず、無自覚に重複作業を作りかけた。

**Action**: AI エージェントが Git 操作を行う際:

1. **Issue 着手前の確認**: `git branch | grep -w <issue-number>`、`git status -uall` で同 Issue の他ブランチ・未追跡ファイル・進行中の作業がないかチェック。並列作業の発見時はユーザーに統合方針を相談する。
2. **`git push` の直前**: `git branch --show-current` を必ず実行し、想定ブランチと一致するか確認。一致しない場合は push を中止して原因調査。
3. **PR 操作前の状態確認**: `gh pr view <PR>` で他者によるマージ・close を事前確認。マージ済みなら作業内容を新ブランチに分離。
4. **develop / main に直 push してしまった場合**: `git revert <SHA>` で revert commit（変更を打ち消す新規 commit）を作成 → push して直 push 分を無効化、同内容を新ブランチに cherry-pick して正規 PR で再投入する。`git reset --hard` + force push は履歴削除を伴い他協働者に影響するため避ける。
5. **PR ready / merge 操作前**: 直前にもう一度 `git status` でローカルが想定状態か確認。push 済 commit と PR head が一致しているかも `gh pr view <PR> --json headRefOid` で照合する。

---

<a id="ace-013"></a>

### ACE-013: 並列 reviewer の指摘は古い snapshot 由来の誤検知を含む — 実態 grep で双方向検証する

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | process                        |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Date       | 2026-05-06                     |
| Helpful    | 0                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: Toolkit / Copilot / Gemini Code Assist 等の並列レビューでは、**reviewer が PR の特定 commit（多くは初回 push 時点）を見ている都合で、すでに修正済みの内容を Critical として再指摘するノイズ**が混入する。逆に reviewer が実態を正しく見抜いて指摘した場合、**こちらが「修正済み」と思い込んで grep 確認を怠ると本物の Critical を見逃す**。指摘を受け取った瞬間に `grep -n` で実態確認し、**両方向**（false positive / true positive）を切り分ける。これを怠ると、誤検知に基づいて再修正してファイルを破壊するか、本物のバグを残してマージしてしまう。

**Context**: PR #391 で 1500 行残存（C1 / C2）と bash 「上記出力」プレースホルダ（S1）を Toolkit / Copilot / Gemini が並列 Critical として指摘したが、`grep -n "1500" <該当ファイル>` で確認したところすでに修正済みだった（reviewer 側の snapshot が古かった）。スキップ判断で正解。逆に PR #393 では archive-strategy.md に追記した「`archive/README.md` は提供されていない、初回作成する」記述に対し、Toolkit が「実態は PR #391 で雛形として既に追加済み」と Critical 指摘。`ls docs-template/archive/` で確認したところ事実だったため、即修正した。**両ケースとも、grep / ls による実態確認なしで判断していたら誤った PR 状態でマージされていた**。

**Action**: PR レビューを受け取った AI エージェントは:

1. **指摘の真偽は常に grep で検証**: Critical / Important / Suggestion の区別なく、指摘箇所を `grep -n "<キーワード>" <該当ファイル>` で検索。検出されなければ false positive、検出されれば true positive。
2. **false positive の対応**: 修正をスキップし、PR コメントに「該当箇所は commit XXXX で修正済み（reviewer の snapshot が古い可能性）」と返す。**勝手にスキップせず明示する**ことで、後続 reviewer が同じ指摘を繰り返すのを防ぐ。
3. **true positive の対応**: 通常通り fix commit。PR 本文に「実態確認の結果、X は確かに〜」と記録する。
4. **複数 reviewer が同じ箇所を指摘した場合**: snapshot 時刻を `gh pr view --json reviews --jq '.reviews[].submittedAt'` で確認。すべて同時刻に近いなら共通の古い snapshot 由来、ばらついているなら真正のバグの可能性が高い。
5. **逆方向の罠も警戒**: 「Toolkit が指摘していないから OK」と思い込まず、自分の追記内容（特にテンプレート実態に関する主張）は `ls` / `cat` で実物を確認してから書く。**書きながら一度実物を見る**を習慣にする。

---

<a id="ace-014"></a>

### ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | architecture                   |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Related    | ACE-005（補強）                |
| Date       | 2026-05-06                     |
| Helpful    | 4                              |
| Harmful    | 0                              |
| Status     | active                         |

**Insight**: ACE-005 で「索引と実体を分離する委譲パターン」を導入したが、**索引側に「概要だから」と数値表をミラー掲載すると DRY 違反となり、子の閾値変更時に索引が同期漏れる事故が起きる**。索引には「子へのリンク + キーワードレベルの 1 行サマリ」のみを置く。閾値などの具体値は表ではなくテキスト中に「**500 / 800 / 1200 行** の三段階（検討 / 推奨 / 必須）」のように 1 行で要約する。これにより、子で閾値を変えても索引側は「リンク先で SSOT を確認すればよい」状態を保てる。

**Context**: PR #391 で `ORGANIZATIONAL_ROLLOUT.md`（索引）に 4 子ガイドへのリンクと並べて「文書分割の閾値」表（500/800/1200 を 3 行）を併記した。これが子文書 `document-splitting.md` の閾値表と完全に重複し、Toolkit / Gemini Code Assist が「索引が SSOT」「子が SSOT」「MASTER.md は子が SSOT として参照」の三重宣言になっていると指摘。PR #393 で索引の閾値表・アーカイブ判定表・月次ヘルスチェック項目セクションを削除し、サマリ表 1 つに集約（「**500 / 800 / 1200 行** の三段階（検討 / 推奨 / 必須）」など 1 行ずつ）。さらに索引運用ルールに「子の数値・手順を索引にコピペしない（DRY 違反）」を明記して、SSOT を子側に一本化した。

**Action**: 索引 + 子の構造を採用する際:

1. **索引冒頭に SSOT マッピング表を置く**: 各カテゴリ（閾値 / 判定基準 / 項目リスト等）について「正本はどの子ガイドか」「索引は誘導のみか SSOT か」を表で宣言。読者は「数値の正本」を 1 ホップで見つけられる。
2. **索引には数値表を置かない**: 表を作る場合は「サマリ」列のみ（具体値は 1 行のキーワードに留める）にする。「行数 / 判断 / 詳細リンク」のような 3 列以上の表は子に委譲。
3. **索引の運用ルールに「子の内容をコピペしない」を明記**: 将来の作業者（人 / AI）が「親にも書きたい」誘惑を抑止する保険文。
4. **数値変更時のチェックリスト**: 子の閾値を変えたら `grep -rn "<旧数値>" docs-template/ docs/` で他文書の散らばりを確認 → 索引のサマリ行のキーワードが依然正確か（「500/800/1200」を「200/400/800」に変えたら索引も）を確認。
5. **書籍 / 仕様書からの引用は子側で「準拠出典」として明記**: 「書籍 第14章準拠」「RFC ZZZZ 準拠」を子の SSOT 行に書き、索引には「（詳細は子）」のリンクのみ。一次出典が書かれていない索引数値は孤立しやすく、別 SSOT が割り込みやすい。

---

<a id="ace-015"></a>

### ACE-015: 表を導入したら散文の主張を表に対して再読する — 「N 段階」「太字の領域」型の自己矛盾は人手レビューで見落とされる

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #395 / Issue #296  |
| Date       | 2026-05-06            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 「以下の **二段階の目安** で…」と散文で書きながら直後の table が **3 行**、「**AI に丸投げすると事故る領域は太字** : 要件定義と設計」と書きながら table の 領域 列が **5 行すべて太字** ── このような「散文の主張 vs 表の実体」の自己矛盾は、人間が書いた直後の自己レビューでは catch しにくく、Cross-Model Review で初めて検出される。原因は、表を作りながら散文を書くと「思い描いている表」と「最終的に書いた表」がずれていることに気付かないため。**表を書いたら散文に戻って read-aloud し、表を実際に数えてから断定的な数値・形式の言及をすること**。

**Context**: PR #395 で書籍ギャップ補強として 5 章分のガイドラインを追記した際、`AI_GIT_WORKFLOW.md` step 6 PR サイズ章で「**二段階の目安**」と書きつつ table が 3 行（推奨 / 警告 / 要分割）、`AI_SPEC_DRIVEN_DEVELOPMENT.md` 3.1.3「読み解き方」 bullet で「**太字の領域は**要件定義と設計」と書きつつ table の領域列が **要件定義 / 設計 / コード生成 / テスト / ナレッジ** すべて太字（GFM では強調用途で領域名を一律太字にしていた）── どちらも筆者の自己レビュー / `npm run quality:local` (markdownlint / prettier / MCP check) では検出されず、Toolkit `comment-analyzer` が Critical として両方を独立検出。さらに同じ章では「**実装層は**コード生成・テスト生成・パターン検出」と書きながら table 上「パターン検出」は「ナレッジ」行の AI 役割であり実装層ではないという、**3 つ目の散文-table 不一致**まで検出された。

**Action**: 表を含むドキュメントを書く際に:

1. **table を確定させてから散文を書く**: 順序を「散文 → table」ではなく「table → 散文」にする。table 完成後、表のセル内容を「N 行ある」「X 列が太字」「Y 行は Z 列に属する」という事実から散文を書き起こす。
2. **「N 段階」「N 通り」「太字の」「上の表で」のような数値・形式言及は最後にチェック**: PR 提出前の自己レビューで、これらのキーワードに hit する箇所を全部 grep し、表の現状と一致しているか目視確認。`grep -nE "(段階|通り|太字|上の表|N 行)" <ファイル>` を新ガイド作成のチェックリスト項目として常用する。
3. **散文が table を「要約」する場合は要約の事実性を二重チェック**: 「実装層は X / Y / Z」のような分類言及は、その X / Y / Z すべてが table の対応行にあるか確認。matrix を散文で言い換える際は、行・列のラベルからコピペするのが安全。
4. **Cross-Model Review を必ず通す**: 散文-table 矛盾は人間の単独レビューで通り抜ける典型。Toolkit / Copilot / Gemini のいずれかは概ね catch するため、ガイド系 PR では並列レビューを省略しない。
5. **数値境界は排他的整数で書く**: 「200 行以下 / 200〜400 / 400 超」のような両端重複ではなく「200 行以下 / 201〜400 / 401 行以上」のように境界が排他になる書き方を使う（boundary inclusivity の曖昧さも自己矛盾の一種）。

---

<a id="ace-016"></a>

### ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `\[text#anchor\]\(url\)` 形式は無効

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #395 / Issue #296  |
| Related    | ACE-013（補強）       |
| Date       | 2026-05-06            |
| Helpful    | 4                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: `\[docs/X.md#section\]\(../docs/X.md\)` のように **anchor をラベル文字列にだけ書き、URL に書き忘れる**形式は GitHub Markdown / GFM で anchor として機能せず、リンク先のファイル冒頭にしか飛ばない。執筆時にはラベルに `#section` が含まれているのを見て「anchor 設定済み」と錯覚しやすいが、リンクとして機能するのは **URL 側の `#section` だけ**。**anchor を含む cross-doc link を書いたら、必ず URL 部分に `#anchor` がコピーされているか目視で確認する**。両方の AI reviewer（Copilot + Gemini Code Assist）が独立に同じ指摘を出した場合は高確度の anchor バグなので、即時 fix commit にまとめる。

**Context**: PR #395 で `.github/pull_request_template.md` line 15 に `詳細: \[docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成\]\(../docs/AI_GIT_WORKFLOW.md\)` と書いた（ラベルに `#ステップ6-pr作成` あり、URL に欠落）。`npm run quality:local` の markdownlint / prettier / MCP check は **anchor の存在検査をしないため** sliently 通過し、PR ready 後に Copilot review と Gemini Code Assist が**独立に同じ Critical 指摘**を返した。両者とも fix suggestion で `(../docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成)` を提案しており、自分でも C1 として既に Toolkit comment-analyzer 経由で検出していたため、3 経路一致で confidence 100。同 PR の `AI_SPEC_DRIVEN_DEVELOPMENT.md` 内 link `docs/AI_GIT_WORKFLOW.md` は anchor を持たない普通の cross-doc link で問題なし、つまりラベルに anchor を書いた場合だけ起きるエラーパターン。

**Action**: cross-doc link を書く際:

1. **anchor を含む場合の必ず通る形式**: `\[label\]\(path#anchor\)` または `\[label#anchor\]\(path#anchor\)`（label と URL の両方に書くか、URL のみに書くか。**ラベルのみに書くのは禁止**）。
2. **PR 提出前の grep チェック**: `grep -nE "\]\(\.\./[^)]+\)" <変更ファイル>` で cross-doc link を抜き出し、ラベル側に `#` があるなら URL 側にも `#` があるか視認。CI で完全自動検出は難しいが、PR 提出前のセルフレビューで意識的に行うと catch できる。
3. **GitHub の anchor 生成規則**: `### ステップ6: PR作成` → `#ステップ6-pr作成`（ASCII を lowercase、コロン削除、空白を `-`、Unicode 文字は保持）。Japanese 見出しでも anchor は機能するが、英数字記号の正規化規則を覚えておく。
4. **複数 AI reviewer の同一指摘は最優先で fix**: Copilot + Gemini + Toolkit が独立に同じ箇所を Critical 指摘した場合、誤検知の確率は極めて低い。ACE-013 では「逆に false positive を疑う」習慣を推奨したが、**3 経路一致は true positive と判定**してよい。
5. **anchor 自動チェックの将来拡張余地**: lint レベルでは markdown-link-check や remark-validate-links のような外部ツールで cross-doc anchor を validate できる。本リポジトリの quality:local には未組込（PR #395 時点）。導入する場合は別 issue で議論。

---

<a id="ace-017"></a>

### ACE-017: 並列 review agent は worktree を巻き戻す副作用を持ち得る — `git status` 監視と `git restore --source=HEAD` で復旧する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #395 / Issue #296 |
| Date       | 2026-05-06           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: main worktree で **複数の review agent を並列起動**した場合、agent が分析過程で `git restore` / `git checkout` 系のコマンドを実行（典型的には「PR 前の状態と diff を見るため」「base branch の内容を確認するため」）し、staged + working tree が **base コミットの状態に巻き戻る**事故が発生し得る。HEAD ポインタと remote push 済みの commit は無事のため、被害はあくまで「working tree が一時的に古くなる」レベルだが、**気付かずに次の編集を始めるとマージ事故**になる。`git restore --source=HEAD --staged --worktree <files>` で即時復旧可能。**並列 review agent 起動直後は必ず `git status --short` で working tree が clean かを確認する**。worktree を別に切る `--worktree` モードで起動できるなら、それが最も安全。

**Context**: PR #395 で Toolkit `code-reviewer` と `comment-analyzer` を並列起動（Agent tool の単一メッセージ複数 tool*use）して review report を受け取った直後、5 ファイル全てが「Modified」かつ index にも staged で **pre-PR 状態（追加した 150 行が消えた状態）**になっていることを system reminder 経由で発見。`git log` 上の HEAD は `6a80bc4`（自分の commit）のままで remote も同じ位置だったため、どこかの agent が `git restore --source=develop --staged --worktree <files>` 相当を実行したと推定。`git restore --source=HEAD --staged --worktree .github/ISSUE_TEMPLATE/feature.md .github/pull_request_template.md docs/AI*\*.md`で即時復旧、その後の review-fix と merge は問題なく進行。**この事故は HEAD/remote が無事だから復旧できたが、もし agent が`git reset --hard` 相当を実行していれば commit ごと失っていた\*\*ため、防止策の優先度は高い。

**Action**: 並列 review agent を起動する際:

1. **起動前に commit + push を完了させる**: HEAD と remote が無事なら最悪 working tree 巻き戻りでも復旧可能。「未コミットのまま review 起動」は避ける。
2. **起動直後の `git status` 監視を習慣化**: 並列 agent の report 受取後は、内容を読む前に **必ず `git status --short` を実行**。staged 修正 (左カラム `M`)・unstaged 修正 (右カラム `M`)・両方 (`MM`) のいずれかが出たら巻き戻しの可能性。
3. **巻き戻りに気付いたら即復旧**: HEAD が無事なら `git restore --source=HEAD --staged --worktree <files>` で working tree と index を HEAD 状態に戻す。`grep` で追加内容（例: 「PR Size Check」「6 観点」）が file に残っているか復旧後検証。
4. **`isolation: "worktree"` モードで起動**: Agent tool 側に `isolation` パラメタがある場合、`worktree` を指定すると agent は隔離された一時 worktree で作業するため、main worktree の状態に副作用を与えない。本 PR の review agent は `isolation` を指定せず main worktree で動かしたが、これは将来的に標準 isolation 化を検討すべき。
5. **`git reset --hard` を含む destructive 操作の禁止周知**: agent prompt に「**`git reset --hard` / `git restore --source=<base>` / `git checkout <base> -- .` は実行禁止。read-only 操作（`git diff`, `git show`, `git log`）に限定する**」と明記する。レビュー目的ならどの操作も destructive 不要。

---

<a id="ace-018"></a>

### ACE-018: 横断的な番号・順序変更は着手前に grep で全 SSOT を列挙する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #397 / Issue #396  |
| Related    | ACE-014 / ACE-015     |
| Date       | 2026-05-06            |
| Helpful    | 4                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 「ステップ 8 を 10 に動かす」「順序を A→B→C から A→C→B に変える」のような **番号・順序変更は、想定の 2〜3 倍のファイルに散らばっている** ことが多い。本リポジトリでも当初想定 6 ファイルが、実際には 8 ファイル（CLAUDE.md / AI_GIT_WORKFLOW.md / PRACTICAL_GUIDE.md / MASTER.md / DEPLOYMENT.md / git-workflow.md / ace-cycle.md / ace-curate.md）+ レビュー指摘で取り残し 2 ファイル（knowledge-management.md / DEPLOYMENT.md 別箇所）の計 10 ファイルに及んだ。**着手前に複数のキーワードで grep を仕掛けて SSOT chain を全部列挙し、TodoWrite に登録してから編集を始める**。

**Context**: PR #396/#397 で 10 ステップ Workflow の順序を「ACE 8 → Merge 9 → Cleanup 10」から「Merge 8 → Cleanup 9 → ACE 10」に変更。最初に Issue 起票時には 6 ファイルしか想定しておらず、実装中に追加 2 ファイル（ace-cycle.md / ace-curate.md）を発見。さらに Toolkit comment-analyzer のレビューで **既存リスト・ナビゲーション表など別 2 ファイルの取り残し**が検出され、fix commit で対応。grep キーワードは 1 種類（`"ステップ8: ACE"` だけ）では不十分で、`"マージ前"`、`"Merge\s*→.*Cleanup"`、`"Workflow Step:\s*8"` など **意味的に等価な複数表現を網羅的に**走査する必要があった。

**Action**: 番号・順序変更タスクに着手する前に:

1. **意味的に等価な grep パターンを 5 種類以上用意する**:
   - 番号への直接参照（`grep -rn "ステップ8\|Step 8\|step\s*8"`）
   - 順序の散文表現（`grep -rn "ACE → Merge\|Implement.*Test.*Self-Review"`）
   - 状態説明文（`grep -rn "マージ前\|マージ後\|レビュー完了後"`）
   - 関連メタデータ（`grep -rn "Workflow Step:"`）
   - 散文中の段階数言及（`grep -rn "9 ステップ\|10 ステップ\|N 項目"`）
2. **検出された全ファイルを TodoWrite に登録**: 着手前に「修正対象 N ファイル」を可視化することで、レビューで取り残しが見つかったときに「想定外」ではなく「予定外」として扱える（議論が早い）。
3. **取り残しチェックを PR の受け入れ条件に含める**: 「grep `"<旧表現>"` でヒットなし」という客観的な完了基準を Issue 本文に書く。Toolkit / Copilot review はこの種の網羅性を catch しやすい。
4. **ナビゲーション表・対応マトリクス・チェックリストを意識的に探す**: 「ステップ詳細」だけ更新して「ナビゲーション表」を忘れる事故が多い（PR #397 で発生）。表の説明文・列ラベルもキーワード検索の対象にする。
5. **「歴史的経緯」 callout は意図的な残存として grep 対象から除外**: 「書籍ギャップとの関係」「PR #XXX で順序見直し」のような callout は意図的に古い表現を保持するため、grep 結果から人手で除外する。callout の存在自体を別 grep で確認する（`grep -rn "書籍ギャップとの関係"`）。

---

<a id="ace-019"></a>

### ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #397 / Issue #396 |
| Related    | ACE-012（修正対象）  |
| Date       | 2026-05-06           |
| Helpful    | 1                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 新しい運用パターンが既存 PLAYBOOK エントリ・グローバルルールに違反する場合、**「これは X の例外として扱う」と該当箇所に明示的に書く**。書かないと暗黙の policy split が生じ、(a) 後続 AI が古いルールを参照して新パターンを「違反」として扱う、(b) Toolkit / Copilot が Critical として指摘する、(c) チームメンバーがどちらを優先するか迷う。Comment-analyzer は「実装は妥当だが既存の禁則と衝突しているのに carve-out が無い」を Critical 指摘として独立検出する精度を持つため、PR レビュー前に自分で見つけて潰すべき。

**Context**: PR #397 で「個人開発（簡易）」パターン（マージ後に develop へ ACE エントリを直接 commit + push）を導入。これは PLAYBOOK ACE-012「Never commit directly to develop」と直接衝突するため、Toolkit comment-analyzer が「ACE-012 を名指しで違反、carve-out が必要」と Critical 指摘。fix commit b75f86d で 5 サイト（CLAUDE.md / AI_GIT_WORKFLOW.md / git-workflow.md / ace-cycle.md / ace-curate.md）に「**ACE-012 の例外として明示**: 通常 develop への直接 commit は禁止だが、(1) PLAYBOOK.md は append-only、(2) 1 サイクル分の知見追加は履歴上独立 commit として読める、(3) `knowledge:` プレフィックスで識別可能 — の 3 条件を満たすため、個人開発（簡易）パターンに限り許容する。3 人以上のリポジトリでは適用しない。」と注記して解消。実装の正当性自体は問題なく、欠けていたのは **「これは違反ではなく例外である」という明示的な naming** だけだった。

**Action**: 新運用パターン・新コーディング規約を導入するときに:

1. **既存 PLAYBOOK / CLAUDE.md / 規約と衝突するか chec先**: 着手前に `grep -rn "<該当キーワード>" docs-template/08-knowledge/ CLAUDE.md ~/.claude/CLAUDE.md` で対立するルールを列挙する。特に "Never X" / "禁止" / "MUST NOT" 表現は要注意。
2. **対立が見つかった場合の選択肢は 3 つ**:
   - **(a) 例外として明示**: 違反箇所に「これは ACE-XXX / CLAUDE.md L<行> の例外である。理由: ...」と明記。最も一般的で安全。
   - **(b) 旧ルールを deprecated 化**: 旧 ACE エントリの Status を `deprecated` にし、新パターンを正規ルールとして昇格。旧コミッタへの周知が必要。
   - **(c) 新パターンを撤回**: 違反コストが exception 注記を上回ると判断したら、新パターンを採用しない。
3. **「明示」のレベルは 3 点セット**: 例外であることの宣言 + 例外を許す**条件**（最低 3 つ）+ 例外が**適用されないケース**（チーム規模・リポ性質などの境界）。3 点揃わないと「言い訳」に見えて信頼されない。
4. **複数サイトに展開する場合は文言を verbatim に揃える**: 例外の説明が文書ごとに微妙に違うと「結局どれが正？」になる。canonical な 1 文を決めて全サイトに同じ文言で貼る（ACE-014 の SSOT 原則を例外説明にも適用）。
5. **Cross-Model Review で取りこぼしを catch する**: 例外を書いたつもりでも文言が弱い・条件が抜けている場合、Toolkit comment-analyzer / Copilot が指摘する。彼らに任せて自分は「全サイトに書いたか」「文言が揃ったか」のチェックに集中する。

---

<a id="ace-020"></a>

### ACE-020: 自動コンテンツ生成ツールは自身のマーカー文字列を本文に含むドキュメントを破壊する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | tooling              |
| Origin     | PR #403 / Issue #402 |
| Related    | -                    |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: セクションヘッダーを目印にしてファイル末尾を書き換える自動生成ツール（backlinks 自動更新、TOC 自動生成、auto-changelog 等）は、**そのマーカー文字列を本文中に説明として書いているドキュメントを破壊する**。マーカーが「セクション開始位置」と「本文の説明文」の両方の意味で出現するため、ツールは説明文の途中をセクション開始と誤認し、それ以降を全削除する。`tsc` や `npm test` では検出できない（ファイルは valid な markdown のまま）。問題はランタイムにのみ顕在化し、被害は破壊されたファイルが PR に紛れ込んだ後に気づく。

**Context**: 2026-02-12 commit `6ea43f8` (PR #311) で導入された `scripts/obsidian-sync.mjs` は各 markdown 末尾に `## Linked from` セクションを自動生成する設計だった。しかし `docs-template/08-knowledge/OBSIDIAN_GUIDE.md` 自身が「`## Linked from` セクションを自動生成する」と本文で説明しており、自動生成スクリプトはその文字列を section header と誤認して **OBSIDIAN_GUIDE.md を 379 行 → 26 行に破壊**（"各ドキュメント末尾に「" の途中で文章切断）。バグは 2026-05-07 の PR #400 マージ時に post-merge hook 経由で実行されて発覚し、Obsidian 統合全体の撤退判断（PR #403）の決定打となった。約 3 ヶ月間 silent に存在していた。

**Action**: 自動コンテンツ生成ツールを設計する際:

1. **マーカーは本文に出現しえない記法を選ぶ**: HTML コメント形式の sentinel（`<!-- BEGIN_BACKLINKS -->` ... `<!-- END_BACKLINKS -->`）など、説明文として地の文に書くのが不自然な形式を使う。`## Linked from` のような Markdown ヘッダーは本文の説明にも自然に登場するため不適。
2. **mutation 範囲を明示する begin/end ペアを必須にする**: 単一マーカーから「ファイル末尾まで全部置換」型は再帰汚染と相性が悪い。begin/end の両方が揃わないファイルはスキップする。
3. **自分自身の README/GUIDE を exclusion list に入れる**: ツールの動作を説明するドキュメントはそのツールの mutation 対象から外す。ツール側で `OBSIDIAN_GUIDE.md` のような既知ファイルを skip する allowlist/denylist を持つ。
4. **mutating tool は最低限の snapshot test を必ず添える**: 「マーカーを本文中に含むファイル」の golden file を input にして、出力が破壊されないことを assert するテストを最低 1 件入れる。tsc を通っただけでは ship してはいけない。
5. **post-merge / pre-commit など強制実行系に ship する前に dry-run モードを通す**: 自動化に組み込む前に、`--dry-run` で全対象ファイルへの想定変更を出力して目視レビューする。lint フックや husky に直接組み込んだ後はバグの被害が回復しにくい。

---

<a id="ace-021"></a>

### ACE-021: テンプレ配布リポでは「リポ自身が使うインフラ」と「テンプレ利用者が受け取る成果物」を物理的に分離する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | architecture         |
| Origin     | PR #403 / Issue #402 |
| Related    | ACE-005              |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 「リポジトリ自身が動くプロジェクトでもあり、かつ他者がコピーするテンプレートでもある」二重用途のリポでは、**配布対象ディレクトリ（例: `docs-template/`）にリポ自身の運用インフラを置くと、テンプレ利用者にもノイズが伝播する**。リポメンテナの利便（自分のドキュメント管理を Obsidian でやりたい等）と、テンプレ利用者の最小構成（URL 参照だけで使い始めたい）は本質的に競合する。物理的な分離（別ディレクトリ）でしか解決できず、`.gitignore` や条件分岐では足りない（テンプレを clone する人は `.gitignore` 込みで受け取る）。

**Context**: 本リポは AI 仕様駆動開発の **テンプレートを配布する** ことが第一目的で、利用者は `docs-template/` をコピーして 7 文書ベースで使い始めることを想定している。しかし PR #311 で Obsidian 統合を `docs-template/.obsidian/`、`docs-template/08-knowledge/OBSIDIAN_GUIDE.md`、`docs-template/08-knowledge/OBSIDIAN_EVALUATION.md` 等に配置したことで、**テンプレ利用者にも Obsidian 前提のインフラが付随**するようになった。さらに自動 backlinks 生成が `docs-template/` 配下の全 .md に `## Linked from` セクションを付与する設計だったため、利用者がコピーした瞬間「Obsidian で開く前提のテンプレ」になる。利用者が Obsidian を使わない場合これらは全部ノイズで、AI に読ませた際のトークン消費にも直結する。PR #403 で全削除に至った最大の構造的理由がこれ。

**Action**: 二重用途リポを設計する際:

1. **「テンプレ利用者がコピーするか？」を各ディレクトリに対して明示する**: README に「`docs-template/` は配布対象、`docs/` はリポ解説、`scripts/` はリポ運用」のような **配布境界マップ** を 1 表で書く。新規ファイル追加時にどちらかを選ばせる強制力にする。
2. **リポ自身の運用インフラは配布ディレクトリ外に置く**: Obsidian/Notion/Hugo など特定ツールに依存する設定・スクリプト・ドキュメントは `docs-template/` の外（リポルート直下や `.repo/`、`tools/` 等）に置く。配布対象に入れるのはツール非依存の素の Markdown だけにする。
3. **配布物の Markdown には自動生成セクションを書き込まない**: backlinks/TOC/メタ情報は配布物本体の中ではなく、別ファイル（`backlinks.json` など）として生成し、それを使いたい利用者が opt-in で参照する形にする。利用者の本文を mutate しない。
4. **PR レビュー時に「これは配布されるファイルか？」を必ず問う**: `docs-template/` 配下の変更は **テンプレ利用者の受け取りに影響する変更** である。コードレビューチェックリストに「テンプレ利用者は Obsidian/特定ツールがなくても使えるか？」を含める。
5. **撤退コストの試算を導入時に行う**: 「もし採用しないことになったら何ファイル消すことになるか？」を導入 PR の段階で試算する（PR #403 では 13 ファイル削除 + 7 ファイル編集、+7/-1842 行）。撤退コストが大きすぎる導入は、配布境界外でまず試行するか、採用判断を先延ばしにする。

---

<a id="ace-022"></a>

### ACE-022: 機能削除時は consumer だけでなく定数・型・ユーティリティも grep して取り残しを防ぐ

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #403 / Issue #402 |
| Related    | ACE-018              |
| Date       | 2026-05-07           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 機能を削除する PR では、**機能本体ディレクトリ削除 → consumer 編集 → ビルド OK** で完了したように見えるが、**TypeScript の `tsc` は未使用 export を warning しない**ため、その機能のためだけに作られた定数・型・ユーティリティが他モジュールに孤立して残る。`npm run build` も `npm run check` も pass するので CI では検出されない。手動 grep を「機能名 / 機能専用識別子」で実行しないと dead code として静かに残り続ける。

**Context**: PR #403 で `mcp/src/obsidian/` 配下 5 ソース + `scripts/obsidian-sync.mjs` 等 13 ファイル削除 + 7 ファイル編集を実施。`git grep -i obsidian` で「Obsidian」文字列の取り残しはゼロを確認、`mcp build`/`mcp check`/`quality:local` も全 pass。しかし Toolkit code-reviewer が `mcp/src/constants.ts:21-36` の `BACKLINKS_SECTION_HEADER` と `BACKLINKS_SECTION_TEMPLATE` を **dead code として検出**。これらは削除済み `mcp/src/obsidian/backlinks.ts` でだけ使われていた定数で、ビルドは通るが「完全排除」を謳う PR タイトル・CHANGELOG と矛盾する状態だった。fix commit `8628140` で対応。レビューが無ければ silent regression として残った。

**Action**: 機能削除 PR を作る際:

1. **機能名でなく機能の語彙すべてで grep する**: 「Obsidian」だけでなく、その機能専用の識別子（`BACKLINKS_SECTION_*`、`buildBacklinksMap`、`validateAllLinks` など）も全部 grep キーワードに含める。`git grep -i "<feature_name>\|<feature_specific_constants>\|<feature_function_names>"` を 1 コマンドにする。
2. **削除候補を「本体 / 設定 / 定数 / 型 / 関数 / テスト / ドキュメント」の 7 カテゴリで網羅する**: 機能本体ディレクトリだけ消して終わりにせず、Issue 本文の「削除対象」リストにこの 7 カテゴリを明示し、TodoWrite で 1 つずつ確認する。
3. **「未使用 export 検出」ツールを CI に入れる**: `ts-prune`、`knip`、`unimported` など TypeScript 用の dead code 検出ツールを quality:local に組み込む。一度入れれば類似の取り残しを継続的に防げる。
4. **削除 PR の self-review に「孤立 export チェック」を含める**: PR Review チェックリストに「削除した機能の専用 constants/types/utilities が他モジュールに残っていないか？ `git grep` で確認」項目を追加。Toolkit code-reviewer はこの種の検出が得意なので、必ず通す。
5. **同じモジュール内に定数を置く設計を選ぶ**: 機能専用の定数は `mcp/src/<feature>/constants.ts` のように **機能ディレクトリ配下に閉じ込める**。削除時に親ディレクトリごと消せば取り残しが構造的に発生しなくなる。共通 constants ファイルへの追加は「本当に他機能でも使うか？」を着手前に問う。

---

<a id="ace-023"></a>

### ACE-023: ドキュメント中の事実主張（PR/Issue 番号・ハッシュ・数値）は執筆時に 1 次情報で照合する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #405 / Issue #404  |
| Related    | ACE-002 / ACE-018     |
| Date       | 2026-05-07            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ドキュメント中で具体的な PR 番号・コミットハッシュ・数値を書くとき、**記憶や類推で書いた値は高確率で誤りを含む**。執筆中に `gh` / `git` で照合する習慣を持つ。`#N` 表記は Issue 番号・PR 番号の両方で commit メッセージに登場し混同しやすい。

**Context**: PR #405 で「PR #311 (2026-02-12)」を 4 箇所に書いたが `gh pr view 311` → 404、実態は **Issue #311 を参照する commit `6ea43f8`（PR を経ず develop へ直 commit）**。撤退コスト数値「13 削除 + 7 編集、+7/-1842 行」も実態は「13 削除 + 8 編集、+7/-1859 行」（`gh pr view 403 --json additions,deletions,changedFiles` で取得可能）。Toolkit code-reviewer が両方 Critical 検出 → fix commit `b4b5191`。ACE-002（CLI フラグ実機照合）を事実関係全般に拡張した位置付け。

**Action**:

1. **PR / Issue 番号**: `gh pr view <N>` / `gh issue view <N>` で実在性と所属を確認。`#N` が両方ありうるため不明なら両方照会
2. **コミットハッシュ**: `git log --first-parent` で merge commit 経由か直 commit かを判定（直 commit はガードレール全部スキップしている）
3. **数値**: `gh pr view <N> --json additions,deletions,changedFiles` で 1 次情報取得、または `git show --stat <merge-commit>`

---

<a id="ace-024"></a>

### ACE-024: SSOT で確立した用語を再利用する前に既存定義との衝突を確認する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #409 / Issue #408  |
| Related    | ACE-014 / ACE-018     |
| Date       | 2026-05-07            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: SSOT として新設するドキュメントで「コア 7 文書」のような **フレームワーク内で確立された用語** を再利用するときは、**個数や名称が偶然一致しても意味が同じとは限らない**。新ドキュメントが既存用語を別の意味で使うと読者は誤った mental model を獲得する。Toolkit + Copilot の独立 reviewer が両方 Critical として検出する典型パターン。

**Context**: PR #409 で `docs-template/README.md` を SSOT 新設した際、ルート直下のセットアップ系 7 ファイル（`MASTER.md` + `GETTING_STARTED_*` 3 種 + `SETUP_*` 3 種）を **「コア 7 文書 + ルート直下」** という見出しで列挙した。しかしフレームワーク既定の「コア 7 文書」は `MASTER.md` / `PROJECT.md` / `ARCHITECTURE.md` / `DOMAIN.md` / `PATTERNS.md` / `TESTING.md` / `DEPLOYMENT.md` の 7 ファイル（番号付きフォルダ配下に分散）を指す（`CLAUDE.md` L123-131 等で定義）。個数が偶然 7 で一致したことが衝突を見えにくくした。Toolkit comment-analyzer が C2 として検出、Copilot review も SSOT としての用語整合性を独立検出。fix commit `ab9c968` で見出しを「ルート直下のセットアップ系ドキュメント」に変更し、冒頭で正しい「コア 7 文書」定義を明示した。

**Action**:

1. **SSOT 新設前に固有名詞・カテゴリ名を列挙する**: 新ドキュメントで使う用語（数値、ラベル、見出し）を着手前にピックアップ
2. **各語について grep で既存定義を探す**: `grep -rn "<用語>" docs-template/ CLAUDE.md ai_spec_driven_development.md README.md` で既存利用箇所を全て確認
3. **既存定義があり別の意味で使う場合は別の語を採用**: 衝突するなら命名を変える（例: 「ルート直下のセットアップ系ファイル」のように修飾を加える）
4. **同じ意味で使うなら既存定義へリンク**: SSOT 内で再定義せず、既存ドキュメントへの参照に留める
5. **数や種別の偶然の一致は危険シグナル**: 「7」「コア」「メイン」「標準」のような汎用語が個数まで一致するときは、用語衝突の確率が高いと意識する

---

<a id="ace-025"></a>

### ACE-025: スクリプトの「対象範囲」を文書化するときは glob 表現ではなく実装上の対象列挙方式まで踏み込む

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-023 / ACE-043     |
| Date       | 2026-05-19            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: スクリプトの検証対象を「`docs-template/**/*.md`」のような glob 表現で説明されると、読者は「該当パターンに合致する全ファイルが対象」と誤解する。実装が「固定リスト配列で列挙された 7 ファイルのみ存在チェック」のような **glob ではない対象列挙方式** だった場合、glob 表現は嘘になり、読者は「拡張文書を追加すれば CI で守られる」と誤期待する。

**Context**: PR #411 で frontmatter ガイド §2/§4.1 に「`validate-docs.mjs` は `docs-template/**/*.md` のコア 7 文書を検証」と書いたが、実装は `scripts/validate-docs.mjs:16-59` の `CORE_DOCS` 配列で 7 ファイルを列挙し、`scripts/validate-docs.mjs:153-172` で `fs.existsSync` で逐次チェックする形だった。**glob walk は一度も行っていない**。Toolkit code-reviewer W1 と Copilot review が独立検出。実害として、拡張文書（GLOSSARY/DECISIONS/FAQ 等）や PLAYBOOK は frontmatter を持っていても CI 検証されないが、ガイドの記述からはそれが分からない。fix commit で表組みの「入力」列を「`docs-template/` 配下の **固定 7 ファイル**（CORE_DOCS 配列で列挙）」に変更し、§4.1 の検証スクリプト列を「✅ CI 検証 / ❌ CI 対象外」の 2 値表に整理した。

**Action**:

1. **glob 表現を使う前にスクリプト本体を読む**: `walkMarkdown(dir)` 型の glob walk か、`CORE_DOCS`/`KNOWN_FILES` 型の固定リストか、`if (path.match(filter))` 型の条件フィルタかを確認
2. **対象列挙方式を 1 行で明示**: 「固定 N ファイル（X 配列で列挙）」「`docs/specs/**/*.md` を glob 走査」「`*.md` のうち frontmatter 持ちのみ」のように方式名を含めて書く
3. **CI 対象外との対比表を作る**: 「✅ CI 検証」と「❌ CI 対象外」を同じ表で並べる。読者は「自分が書こうとしているファイルがどちらか」を即判定したい
4. **拡張手順を併記**: 固定リスト方式の場合は「拡張対象にしたい場合は X 配列に追加 or 別スクリプト化」と書いておく
5. **glob と固定リストの混在に注意**: 「対象は `docs/**/*.md` だが、一部除外あり」のようなパターンは特に誤解されやすいので除外ルールも明記

---

<a id="ace-026"></a>

### ACE-026: 同名関数が複数ファイルに併存する場合は機能対応表で並列説明する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-023               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: リポジトリ内に同名（例: `parseFrontMatter`）で実装が異なる関数が複数存在するとき、「パーサーは ... という制約がある」のように **単数形・一括化** で説明すると、ある実装で通る書き方を別実装で書いて壊れる。**機能 × 実装の対応表** で並列化するのが安全。

**Context**: PR #411 で frontmatter ガイド §5.4.2 に「`mcp/src/utils.ts:33` と `scripts/validate-docs.mjs:74` の `parseFrontMatter` は (...) `>-` / `|` を空文字に丸める、配列は `[a,b,c]` 形式か `- item` 行のみ対応」と単数形で一括説明した。実態は 3 実装で対応機能が異なる:

- `mcp/src/utils.ts`: `>-` のみ flatten、`|` は literal、配列は `[a,b]` と `- item` 両対応
- `scripts/validate-docs.mjs`: `>-`/`|` どちらも特別扱いなし、配列構文 (`[a,b]`/`- item`) は warning
- `scripts/build-spec-index.mjs`: `>-`/`|` 両方 flatten、配列両対応、ネスト map は明示的 skip

Toolkit comment-analyzer が Critical C1/C2 として独立検出、Copilot review、gemini-code-assist も指摘。fix commit で **3 実装 × 5 機能** のチェック対応表に書き直し、「実用上の指針」（どのテンプレが安全か）を併記した。

**Action**:

1. **同名関数を grep で全列挙**: `grep -rn "function parseFrontMatter\|parseFrontMatter\s*=\|parseFrontMatter\s*:" --include='*.{ts,js,mjs,py}'` で実装を全部見つける
2. **サポート機能の集合を縦軸に**: 各実装で扱う YAML/データ機能を全部列挙（配列、ネスト、複数行文字列、コメント、エスケープ等）
3. **`✅ / ❌ / ⚠` の 3 値で対応表を作る**: 機能 × 実装の表で対応状況を一目化
4. **「実用上の指針」を併記**: 「テンプレからずらすときは X 実装を通るか確認」「どの書き方が全実装で安全か」を具体的に書く
5. **複数実装併存自体を解消すべきかも検討**: 対応表が複雑になったら、共通ライブラリ化や 1 実装への統一を別 Issue で提起する

---

<a id="ace-027"></a>

### ACE-027: 配布対象ファイル内の行番号 hard-coded 参照は採用後に即陳腐化するため heading anchor 化する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #411 / Issue #410  |
| Related    | ACE-016               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: `docs-template/MASTER.md:147` のような **行番号 hard-coded 参照** は二重に脆い: (a) 元ファイルの編集で即ズレる、(b) 配布対象 (`docs-template/`) の場合はテンプレ採用者がコピー後に編集するため**確実に**ズレる。**heading anchor / セクションタイトル文字列参照**に置き換えると編集に強い。

**Context**: PR #411 で frontmatter ガイドが `docs-template/MASTER.md:147` (Frontmatter version 参照)、`:363-365` (Spec Kit 拡張宣言)、`:404-413` (spec 6 ステータス表)、`:623-637` (ステータスワークフロー)、`README.md:121`、`PLAYBOOK.md:35,146,280-282` 等、行番号参照を 6 箇所以上で使用。Toolkit code-reviewer S1 が「`docs-template/` は配布対象 (DESIGN_PRINCIPLES.md P2) なので採用者のコピー先で即ズレる」と指摘。検証時点では参照行は全て正確だったが、すぐ陳腐化するリスクが高い。fix commit で全て見出しテキスト形式 (`docs-template/MASTER.md「ステータスワークフロー」`) に置換した。

**Action**:

1. **配布対象 (`docs-template/`) 内ファイルへの参照は heading anchor を強制**: `MASTER.md:147` → `MASTER.md「プロジェクト識別情報」セクション` or GitHub Markdown の slug anchor `MASTER.md#プロジェクト識別情報`
2. **頻繁に編集される SSOT ファイル（MASTER.md / PLAYBOOK.md / 各種運用ガイド）への参照も heading anchor 推奨**
3. **行番号 hard-code は「コード行で論証が必要」な場合のみ**: スクリプト実装の根拠を示す時など。その場合も commit hash を併記して「時点」を明示する（例: `validate-docs.mjs:108-135 (4e59e7c 時点)`）
4. **PR 提出前に grep で棚卸し**: `grep -rnE '\.md:\d+|\.ts:\d+|\.mjs:\d+' docs/ docs-template/` で行番号参照を全列挙し、配布対象 / SSOT への参照を heading anchor 化
5. **GitHub Markdown の anchor slug ルールを把握**: 日本語見出しは小文字化されず空白は `-` に変換、特殊文字は除去される。`#プロジェクト識別情報` のように見出し文字列そのままで動く

---

<a id="ace-028"></a>

### ACE-028: 外部ツールの「現状」仕様を書くときは公式ドキュメントを WebFetch / WebSearch で必ず照合する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-023               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: SaaS / IDE / CLI ツール（GitHub Copilot, Cursor, Codex CLI 等）の対応状況・設定方法・推奨ファイル名は **数ヶ月単位で変化** し、LLM の training cutoff より新しい場合は **「古い知識のまま断定する」事故** が起きる。「最新仕様を整理する」型のドキュメントを書く場合、各事実主張ごとに **公式ドキュメント URL を WebFetch / WebSearch で必ず照合** し、出典 URL も併記する。

**Context**: PR #414 で `docs/FRONTMATTER_GUIDE.md` §7.1「AI ツール別 frontmatter 対応状況」を執筆した際、「Copilot は MCP 非対応 ❌」「Codex CLI は MCP 非対応 ❌」「Cursor の指示ファイルは `.cursorrules`」「Cursor の MCP は一部対応」と一般論で書いた。Toolkit comment-analyzer と code-reviewer が独立に公式ドキュメントを照合し、すべて事実誤認と判明: (a) Copilot は VS Code Agent mode 等で MCP GA 済み (2025-04)、(b) Codex CLI も `codex mcp add` で MCP 対応済み、(c) Cursor の `.cursorrules` は 0.43+ で deprecated → `.cursor/rules/*.mdc` 推奨、(d) Cursor の MCP は tools/resources/dynamic context すべて完全実装。本ガイドの中核セクションで「Copilot ユーザーは MCP 経由で `spec_lookup` を使えない」という誤った技術判断を導くリスクがあった。fix commit で対応表を「全 4 ツール ✅、自動呼出 vs 明示設定」軸に再構築し、4 ツールの公式ドキュメント URL を表下に併記した。

**Action**:

1. **「現状仕様」を含む対応表は WebFetch/WebSearch を fact-check の前提に組み込む**: 「GitHub Copilot の MCP 対応状況は？」「Cursor の最新 rules ファイル形式は？」のような問いには **必ず公式ドキュメント URL を取得して照合** してから書く
2. **LLM training cutoff より新しい変化が起きやすい領域を意識**: IDE 拡張機能 (`docs.github.com`, `cursor.com/docs`, `developers.openai.com`)、CLI tool 仕様 (`cli.github.com`)、SaaS API 変更、ライブラリの API stable/deprecated は特に rot しやすい
3. **出典 URL を本文に併記**: 「参考一次情報: [GitHub Copilot MCP](URL) / [Cursor MCP](URL)」のように本文に書き残すと、後で読者・レビュアーが照合しやすく、自分の knowledge cutoff 起因の事故を防げる
4. **執筆時点でわからない場合は明示**: 「2026-05 時点では...」のような時点明示か、「最新仕様は公式ドキュメントを参照」とエスケープする
5. **レビュアー（特に並列レビュー）に WebFetch を期待**: Toolkit comment-analyzer は WebFetch を使って公式情報と照合してくれる。仕様系の主張があるドキュメントは並列レビューを必ず通す

---

<a id="ace-029"></a>

### ACE-029: 外部ツール依存物（shell script の依存コマンド、shebang、インストーラオプション）を文書化するときは実体を読んで列挙する

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-025               |
| Date       | 2026-05-19            |
| Helpful    | 1                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: shell スクリプトや hook の「実行要件」を文書化するときは、**shebang だけで判断せず、ファイル本体を読んで使用コマンド（`grep`, `xargs`, `awk`, `find` 等）を列挙する** こと。インストーラ依存の「PATH に通す方法」を書くときは **インストーラの具体オプション名を引用する**。どちらも実体を見ずに一般論で書くと、Windows 等の追加要件のある環境で詰む。

**Context**: PR #414 で frontmatter ガイド §7.2「実行環境別」表に「`.husky/pre-commit` (`#!/bin/sh`) → Windows native では sh.exe 必要」と書いたが、GitHub Copilot review が「`.husky/pre-commit` の実体は `grep -E ... | xargs npx ...` で coreutils も使うため、sh.exe だけでは不足。**`sh + coreutils (grep/xargs)`** が要件」と指摘。また「Git for Windows をインストールすれば `sh.exe` が PATH に通る」と書いたが、Git for Windows のインストーラオプション（「Use Git from Git Bash only」「Use Git from the Windows Command Prompt」「Use Git and optional Unix tools from the Command Prompt」の 3 択）によって `Git\usr\bin` が PATH に追加されるかが変わるため断定できない。さらに gemini-code-assist が「`scripts/*.sh` は `bash` ではなく `sh` で起動を」と suggest したが、`head -1 scripts/*.sh` で確認すると全部 `#!/bin/bash` or `#!/usr/bin/env bash` shebang のため `bash` 実行が整合（gemini の suggest は誤り）。fix commit で (a) `.husky/pre-commit` 要件を「sh + coreutils」に詳細化、(b) Git for Windows の具体オプション名 "Use Git and optional Unix tools from the Command Prompt" を案内、(c) 落とし穴に「`scripts/*.sh` は `#!/bin/bash` shebang のため bash 起動」を明記した。

**Action**:

1. **shell hook / script の「実行要件」を書く前に本体を grep**: `grep -oE '\b(grep|xargs|awk|find|sed|sort|uniq|cut|tr|tee|jq)\b' .husky/* scripts/*.sh` のように依存コマンドを抽出
2. **shebang を一覧で確認**: `head -1 scripts/*.sh` で全 shebang を出す。`#!/bin/sh` か `#!/bin/bash` で起動方法が変わる
3. **インストーラ依存の「PATH」記述はオプション名を引用**: Git for Windows なら「インストーラの "Use Git and optional Unix tools from the Command Prompt" オプション」のように具体的に。「インストールすれば OK」は事故の元
4. **「PATH 通っていなければ手動追加」のフォールバックを併記**: `C:\Program Files\Git\usr\bin` 等の具体パスを書いておくと、ユーザーが詰んだときに自力解決できる
5. **未検証の主張は弱める**: 「Windows + Git Bash で `/merge-cleanup` も動く」のような実機検証していない主張は、「⚠️ 大半は動作（未検証）」のように記号と注釈で正直に表現

---

<a id="ace-030"></a>

### ACE-030: 対応表で `⚠️` を多用したら判定軸自体が間違っているサイン

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #414 / Issue #413  |
| Related    | ACE-026               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ツール対応表で `✅ / ❌` で判定できず **`⚠️ 一部対応` のような曖昧記号を使う** と、読者は「一部って何？」を想像で埋めて誤った技術判断につながる。`⚠️` が出てきたら **判定軸自体を見直し**、具体的な条件（「✅ 要設定」「✅ Agent mode のみ」等）に切り替えるのが正解。

**Context**: PR #414 で frontmatter ガイド §7.1「AI ツール別」表で Cursor の MCP 列に「⚠️ 一部対応（要設定）」と書いたが、Toolkit comment-analyzer が「Cursor は MCP の初期採用者で、tools/resources/dynamic context すべて完全実装。`一部` というニュアンスは実態と乖離。さらに `要設定` という caveat は Claude Code を除く全ツール（Cursor/Copilot/Codex）に等しく適用される条件のため、Cursor だけにこの注記を付けるのは inconsistent」と指摘。本質的には「MCP 対応の有無」軸自体が崩壊しており、正しい判定軸は「**自動呼出 vs 明示設定**」だった。fix commit で表の判定軸を再構築し、4 ツール全部 `✅` にしたうえで Claude Code は「✅ 自動呼出」、他 3 ツールは「✅ 要設定（.cursor/mcp.json / mcp.json / codex mcp add）」のように具体的な設定方法を併記した。

**Action**:

1. **対応表で `⚠️` を使いたくなったら判定軸を疑う**: `⚠️` は「✅ でも ❌ でもない曖昧領域」を表すが、これは判定軸が現実に合っていないサイン
2. **判定軸を「対応有無」から「対応方法・条件」に切り替える**: 「MCP 対応 ✅/❌」ではなく「MCP の組み込み方（自動 / 設定ファイル / インストール時オプション）」のように具体化
3. **`⚠️` を残す場合は具体的な条件を併記**: 「⚠️ Agent mode のみ」「⚠️ 大半動作（未検証）」のように **何が条件なのか** を即座に分かる形で記述
4. **複数ツール／環境を比較する表は「全 ✅ + 違い列」の形を優先**: 「全部対応している、違いは設定方法だけ」とわかる方が、対応状況の意思決定が容易
5. **レビュー時に `⚠️` をカウント**: PR で対応表を追加するときは `⚠️` 出現数を数え、3 つ以上あれば判定軸の見直しを必ず検討

---

<a id="ace-031"></a>

### ACE-031: ドキュメントを書くときは配布境界に基づいて「想定読者」を意識する（採用者向け / コントリビューター向け / リポメンテナ向け）

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-021               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: 配布対象テンプレリポジトリでは、各ドキュメントが **「採用者（テンプレを自プロジェクトに取り込む人）向け」「コントリビューター向け」「リポメンテナ向け」のいずれを想定読者にしているか** を意識して書く。これが曖昧だと「採用者には届かないインフラ機能（MCP サーバー等）」を「採用者向け value」として紹介してしまい、読者を混乱させる。

**Context**: PR #411 / #414 で frontmatter ガイドを「テンプレ採用者向けの導入ガイド」として執筆したが、本リポジトリ自身が運用する MCP サーバー (`mcp/` ディレクトリ、`docs/DESIGN_PRINCIPLES.md` P2 で配布境界外 ❌ No) を「採用者が `spec_lookup` / `spec_search` で minimal context を得る」型の value 主張として記述してしまった。ユーザーから「mcp を入れると（採用者環境で）起動するのか？」と直接質問が出て、ガイドが配布境界を踏み外していたことが判明。PR #416 で MCP value 主張を全撤去し、§1.2 を「CI / 別ツールへの索引提供」視点に書き直して採用者にとっての value を実態に合わせた。

**Action**:

1. **ドキュメント執筆前に想定読者を 1 文で書き出す**: 「このガイドは X を Y するための Z 向け」（採用者 / コントリビューター / リポメンテナ）
2. **配布境界 (`docs/DESIGN_PRINCIPLES.md` P2) と読者を突き合わせる**: 採用者向けガイドで参照するのは「✅ Yes」のディレクトリだけ（`docs-template/` 等）。「❌ No」のディレクトリ（`mcp/` / `scripts/` / `.claude/` 等）は採用者には届かない
3. **「リポ自身が運用するインフラ」を value 主張として書かない**: 配布境界外のものは「コントリビューター向けの実装メタ情報」として注釈付きで残すか、別ドキュメントに切り出す
4. **想定読者と配布境界のズレを PR 説明に明記**: 「このガイドは X 向けで、Y は配布境界外なので除外」と書くと、レビュアーが整合性をチェックしやすい
5. **採用者向けドキュメントは「採用後にも参照される運用ガイド」「採用前に読む手順書（frontmatter なし）」に分ける**: 後者は `docs-template/README.md:121` で「frontmatter を持たないテンプレ」として明示されている

---

<a id="ace-032"></a>

### ACE-032: 機能撤去型の改稿後は、残った value 主張・周辺記述・論理連鎖が全て成立しているか改めて読み直す

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-022               |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ドキュメントから機能・主張を撤去するとき、(a) **残った value 主張の実現メカニズムが消えていないか**、(b) **周辺記述（表のセル、別セクションの言及、参考リンク等）に取り残しがないか**、(c) **撤去で論理連鎖が宙に浮いていないか** を改めて読み直す。撤去は追加より見落としが起きやすい。

**Context**: PR #416 で frontmatter ガイドから MCP 関連の value 主張を撤去した際、(a) §1.2「AI ツールに索引で絞り込ませる」という value 主張は残したが、それを実現するメカニズム（MCP `spec_lookup` / `spec_search`）を消したため **実現手段の無い value 主張** が宙に浮いた。Toolkit comment-analyzer W2 が「`dist/spec-index.json` を読む AI 経路が MCP 経由しかなく、MCP 撤去後は実現手段なし」と検出。(b) §2 表の「`npm run quality:local` ... `MCP test`」記述も周辺記述として取り残し（gemini-code-assist が指摘）。(c) §5.4.2 line 299「AI 提供用なら `mcp/src/utils.ts`」が §2.1 の新フレーミング（採用者には配布されない）と矛盾（code-reviewer W1）。fix commit で 3 件まとめて修正。

**Action**:

1. **撤去 PR では各 value 主張をリストアップして「メカニズムは残っているか」をチェック**: 「X できる」と書いてあるなら「X を実現するのは何で、それは残ったか」を確認
2. **`grep` で撤去対象キーワードの残存を全文走査**: `grep -nE "(MCP|spec_lookup|spec_search)" docs/FRONTMATTER_GUIDE.md` のような形で周辺記述の取り残しを検出
3. **撤去後にガイド全体を頭から通し読みする**: セクション内の整合だけでなく、セクション間の論理連鎖（§1.2 で言った話を §5.4.2 で違うこと言っていないか）を確認
4. **撤去で「全行 uniform」になった表がないか確認**: 1 列・1 行を抜いた結果、表の情報量がゼロに近づくケースは表自体の再構成が必要（ACE-033 と関連）
5. **レビュアーへの依頼に「撤去で論理穴が生じていないか」を明示**: 「§X 改稿で論理的整合性が保てているか確認してほしい」と PR 説明に書くと、レビュアーが意識して検証する

---

<a id="ace-033"></a>

### ACE-033: 対応表で全行 / 全 cell が uniform になったら、表自体が情報を持っていないサイン

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #416 / Issue #415  |
| Related    | ACE-026 / ACE-030     |
| Date       | 2026-05-19            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: ツール / 環境 / 実装の比較表で **全行 / 全 cell が同じ値（全 `✅` 等）になっているなら、その軸は表として情報を持っていない**。差別化情報のある軸だけを残し、共通部分は 1 文の散文に集約するのが正解。表は「違いがある」前提のデータ表現形式であって、共通項を述べる手段ではない。

**Context**: PR #416 で frontmatter ガイド §7.1「AI ツール別」表から MCP 行を撤去した結果、5 行中 4 行が `✅ ✅ ✅ ✅` の uniform になり、Toolkit code-reviewer S2 が「表として情報量が薄い、4 ✅ 行は 1 文に集約すべき」と指摘。差別化情報は「プロジェクト指示ファイル名」1 行のみだった。fix commit で共通機能を「4 ツール共通で機能する: (a) frontmatter テキストを context として読む、(b) スクリプト実行、(c) 規律遵守」のように 1 文に集約し、表は「プロジェクト指示ファイル」1 列だけの小型表に縮小した。

**Action**:

1. **対応表を書いたら全 cell の値を見て判定**: 全行 / 全列が同じ値になっていないか確認
2. **uniform 行は散文に降格**: 「全 X で ✅」型の行は「X 全部で機能する: (a)/(b)/(c)...」のように 1 文に集約
3. **差別化情報が 1 行以下になったら表を 1 列にする**: 「行ヘッダ + 1 列の値」の小型表は読みやすく、表として機能する
4. **「対応有無の表 vs 対応方法の表」を意識**: 対応有無は ✅/❌ で十分だが、対応方法（設定ファイル名、コマンド、URL 等）の差を見せたいなら別の表として組み直す
5. **撤去 PR で特に発生しやすい**: 機能撤去で表の行・列が減ったら、残った表が uniform になっていないか必ず確認（ACE-032 と連動）

---

<a id="ace-034"></a>

### ACE-034: 実装中は implementation-notes.md を作業ブランチに並走させて spec 乖離・トレードオフ・判断理由を捕捉する

| フィールド | 値                                                 |
| ---------- | -------------------------------------------------- |
| Category   | process                                            |
| Origin     | 外部知見（Anthropic エンジニア公開実装プロンプト） |
| Related    | ACE-009 / ACE-023 / ACE-032                        |
| Date       | 2026-05-19                                         |
| Helpful    | 0                                                  |
| Harmful    | 0                                                  |
| Status     | active                                             |

**Insight**: 実装着手から PR 作成までの間、作業ブランチ直下に `implementation-notes.md` を 1 枚並走させ、(1) spec に書かれていなかった判断、(2) spec から変更した点、(3) 取った/捨てた選択肢とその理由（トレードオフ）、(4) レビュアー・ユーザーが知るべきその他情報を逐次記録する。コミット diff とレビューコメントには「why / 捨てた選択肢 / spec との差分」が残らず、ACE Phase 1 Generate の raw material の品質に上限が生じるため、in-flight でしか書けない情報を能動的に残す。

**Context**: Anthropic エンジニアが SNS で公開した実装プロンプト（"implement \<SPEC\> and while you do keep a running implementation-notes.html file (or markdown) with decisions you had to make weren't in the spec, things you had to change, tradeoffs you had to make or anything else I should know"）を契機に、本リポの ACE Playbook (ACE-001 〜 033) と grep 照合し未抽出と確認。本リポの既存 ACE サイクル ([ace-cycle.md](../05-operations/deployment/ace-cycle.md)) は post-merge に `gh pr diff` + レビューコメントを raw material として Generate するが、コミットに残らない判断理由・捨てた選択肢・spec 乖離の文脈は diff には現れない。実際 ACE-032（PR #416 で MCP value 撤去後に §5.4.2 が宙に浮いた）のような「気付いた瞬間に書いておけば反映漏れがなかった」ケースが頻発しており、in-flight な判断ログの欠落が構造的に存在する。

**Action**:

1. **実装着手と同時に作業ブランチ直下に `implementation-notes.md` を作成**: 最低限 4 つの見出しを持つ
   - `## Decisions not in spec`（spec にない判断）
   - `## Changes from spec`（spec から変えた点）
   - `## Tradeoffs`（採った/捨てた選択肢と理由）
   - `## Open questions / TODO`（未決事項）
2. **コミットと一緒に追記**: 「なぜこの選択をしたか」を 1〜3 行で残す。後で書こうとすると確実に忘れる
3. **PR 作成時に PR description に転記または同梱**: レビュアーが「なぜ」を読みやすくなり、レビュー指摘の精度が上がる
4. **ACE Phase 1 Generate の raw material は「PR description（implementation-notes 転記済み）」**: Action 5 でマージ前にファイル自体は削除されるため、ファイル本体ではなく PR description（転記済みの判断ログ）を `gh pr view --json body` で取得して Generate プロンプトに渡す。`gh pr diff` / `gh issue view` / レビューコメントと併せて入力にする（[ace-cycle.md §Phase 1](../05-operations/deployment/ace-cycle.md)）
5. **マージ前にファイルを削除し PR description に統合（推奨）**: squash merge を標準とするリポでは「PR に同梱したまま残す」と squash 後にルート直下に前 PR のファイルが残り、次の feature branch が衝突・上書きする構造問題が起きる（ACE-021 と同型）。pr-ready 直前に (a) 中身を PR description に転記、(b) `git rm implementation-notes.md` で削除、(c) `git commit -m "chore: integrate implementation-notes into PR description"` の 3 ステップで処理する。長期保存したい場合は `notes/<issue-num>.md` 形式で per-PR ファイル化する代替案もあるが（並行 PR で衝突しない）、リポに notes/ が累積するトレードオフがある
6. **スコープ外発見は引き続き Issue 化（[workflow-principles.md 原則2](../05-operations/deployment/workflow-principles.md)）**: implementation-notes は「現 PR の判断ログ」、Issue は「別タスクへの分岐」と役割を分ける（排他ではなく補完）

---

<a id="ace-035"></a>

### ACE-035: 新規 process パターンを Playbook に追加するときは「ドッグフード + advisor / second opinion」で運用上の構造問題を検出する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #420           |
| Related    | ACE-021 / ACE-034 |
| Date       | 2026-05-19        |
| Helpful    | 2                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 新しい process パターン（特に「マージ後の振る舞い」を伴うもの）を Playbook に追加する PR では、(1) その PR 自身で当該パターンを実行（ドッグフード）し、(2) advisor / second opinion に「この推奨を本リポで運用したら何が起きるか」を確認させる。初稿の机上判断だけだと、自リポの merge strategy（squash か否か）と矛盾する構造問題を見逃す。

**Context**: PR #420 で ACE-034 Action 5「マージ時の扱い」初稿に「(a) PR に同梱したまま残す」を推奨に設定。advisor がこれを「squash merge 標準のリポでは ACE-021 と同型の構造問題（次 feature branch がルート直下で衝突）を起こす」と指摘し、「(b) マージ前削除 + PR description 統合」に pivot。advisor を呼ばずにマージしていたら、自分の PR でドッグフードした implementation-notes.md が develop ルートに残り、次 PR が確実に衝突した。机上では見落とす運用問題が「ドッグフード + advisor」の組み合わせで検出された具体例。

**Action**:

1. **Playbook 新規エントリの Action / 推奨パターンには「自リポでの運用シミュレーション」段落を必ず通す**: 特に squash merge / rebase merge / merge commit の選択がエントリの推奨と矛盾しないか確認
2. **PR 自身でドッグフード可能なパターンは必ずドッグフードする**: implementation-notes.md / 命名規則 / コミットメッセージ規則など、PR 内で実行できるものは PR 内で 1 回回す
3. **advisor / second opinion を「初稿完成 → quality:local 通過 → commit 前」のタイミングで必ず呼ぶ**: post-commit に呼ぶと修正コストが上がる
4. **構造問題が見つかったら pivot 経緯を implementation-notes.md に記録**: pivot 自体が ACE Phase 1 の raw material になる（ACE-034 と組み合わせる）

---

<a id="ace-036"></a>

### ACE-036: 外部知見（SNS / ブログ / 社内 wiki）を Playbook に取り込む前に既存 ACE エントリ全件と grep 照合する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | knowledge-management |
| Origin     | PR #420              |
| Related    | ACE-018 / ACE-023    |
| Date       | 2026-05-19           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: 外部の SNS / ブログ / 公式ドキュメント等で見つけた「実装パターン」を Playbook に取り込む前に、既存 ACE エントリのタイトル + Insight 行を全件 grep 照合する。これがないと (a) 既存知見の細分化（同じ insight を別エントリで再記述）、(b) 矛盾する推奨の併存、(c) Related フィールドへの相互リンク漏れ が起きる。

**Context**: PR #420 で Anthropic エンジニアが SNS で公開した implementation-notes.md 並走パターンを取り込む際、ACE-001〜033 を `grep -niE "implementation|notes|decision|tradeoff"` で照合し未抽出と確認。さらに「気付いた瞬間に書く」観点で ACE-032（撤去後の論理連鎖切れ）と類似性があり、Related フィールドに ACE-032 を追加。grep 照合せずに新規追加だけしていたら、ACE-009（Issue spec 曖昧さ）や ACE-023（事実主張は 1 次情報照合）との関連付けも漏れた可能性がある。ACE-018 が「自リポ内の横断的番号変更時の事前 grep」を扱うのに対し、本 Insight は「外部知見取り込み時の事前 grep」を扱う相補的知見。

**Action**:

1. **取り込み前に grep キーワードを決めて全件照合**: 外部パターンの中心概念を 3〜5 個のキーワードに分解 → `grep -niE "kw1|kw2|kw3" docs-template/08-knowledge/PLAYBOOK.md`
2. **照合結果は「重複 / 類似 / 関連 / 新規」の 4 段階で分類**: 「類似」「関連」は Related フィールドへの相互リンクで処理、「重複」は Helpful +1、「新規」のみ新エントリ作成
3. **Issue 起票時点で grep 照合結果を本文に書く**: 「既存 ACE-XXX と類似だが観点が違う」など根拠を明示 → レビュアーが「これは別エントリで正しいか」を判断できる
4. **Related フィールドへの相互リンクは執筆過程で発見した類似性も含める**: ACE-034 で執筆中に気付いた ACE-032 との類似は当初の Issue 本文には無く、執筆中に発覚 → Related に追加した実例

---

<a id="ace-037"></a>

### ACE-037: ACE エントリの新規追加は対応する運用手順（workflow / self-review / ace-cycle）への組み込みを同 PR で済ませる

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | knowledge-management        |
| Origin     | PR #420                     |
| Related    | ACE-014 / ACE-031 / ACE-034 |
| Date       | 2026-05-19                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: ACE Playbook に新規エントリを追加する PR では、対応する運用手順（`git-workflow.md` / `self-review.md` / `ace-cycle.md` / `workflow-principles.md` 等）への組み込みも同 PR で済ませる。Playbook に書いてあるだけで運用フックに組み込まれない ACE は「死蔵知見」になり、Helpful カウンターが永久にゼロのまま蓄積する。

**Context**: PR #420 で ACE-034 を追加する際、当初は「Playbook 追加のみ」のスコープも検討したが、概念知見と運用手順はセットで効くため 1 PR で `docs-template/05-operations/deployment/git-workflow.md`（ステップ3 Implement）/ `docs/AI_GIT_WORKFLOW.md`（同）/ `ace-cycle.md`（Phase 1 対象データ）の 3 ドキュメントに組み込んだ。Copilot レビューで Action 4 が指す raw material 取得経路の整合性が指摘されたが、これは「組み込みが片手落ち（ace-cycle.md に PR description が無かった）」ためで、本 Insight の重要性を裏付ける具体例になった。組み込みを全て同 PR で済ませると Copilot のような cross-model reviewer が「整合性チェック」を一気に通せる。

**Action**:

1. **新規 ACE 起票時に「組み込み先候補」を Issue 本文にリストする**: `git-workflow.md` / `self-review.md` / `ace-cycle.md` / `workflow-principles.md` / `PATTERNS.md` / `TESTING.md` のどれに組み込むか or 組み込み不要か を着手前に判定
2. **「組み込み不要」と判断した場合はその理由を Issue に明記**: 後から見た人が「なぜ Playbook だけに残されたのか」を理解できる
3. **組み込みが多数のドキュメントにまたがる場合は ACE-014 の SSOT 原則を遵守**: 1 箇所に詳細、他は誘導リンクのみ
4. **PR レビューで「運用手順との整合性」指摘が出たら本 Insight の発動サイン**: 「組み込み忘れ」ではなく「組み込み計画段階の漏れ」として再発防止を考える（実装後の追記ではなく Issue 段階で判定する）

---

<a id="ace-038"></a>

### ACE-038: 「データ収集待ち」を要求する受入基準でも、ロールバック容易な変更は先行実装 + 試行中ステータス明記でフィードバックループを早める

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-034 / ACE-035 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 受入基準が「N サンプル運用後に判断」を要求する Issue では、(a) 変更が 1〜3 行で revert 容易 / (b) 待たずに動かす方が学習機会が増える、を満たす場合に「先行実装 + 試行中ステータス明示 + ロールバック条件明記」のパターンで前進できる。データを溜める時間も「観点なしで運用したら何が拾えないか」を観察できる時間として活用すべきで、観点ありで運用しながら評価する方が情報密度が高い。

**Context**: Issue #421 の受入基準は「ACE-034 を 5 PR 以上で運用してから判断」だったが、観点追加は 1 行 diff で revert コスト極小、かつ「観点なしで運用すると implementation-notes 由来の raw material が構造的に拾われない」リスクの方が大きいと判断。PR #423 で先に観点 7 を追加 + L57 / Changelog に「試行中: 5 PR で評価」を明記して、ロールバック条件を本文に残した状態でマージ。「待つ間に何が拾えなかったか」のデータも、観点 7 ありで運用しないと取れない構造になっていた。

**Action**:

1. **「データ収集待ち」受入基準を見たら 3 軸で判定する**: (a) 変更の revert コスト（行数・依存）、(b) 「待つ間に何ができないか」のコスト、(c) 試行中ステータスを文書化できるか
2. **revert コスト極小（1〜3 行）+ 試行中明示できる場合は先行実装**: ただし「試行中」「N PR で評価」「ロールバック条件」を**テンプレ本文に書く**（PR description だけだとマージ後にアクセスしづらい）
3. **試行中ステータスは目立つ場所に書く**: 観点 / ルールの末尾括弧（例: `（試行中: [Issue #XXX](...)、5 PR で評価）`）、または独立した「## 試行中」セクション
4. **評価期間後のロールバック判定 Issue を着手時に起票**: 「5 PR 後に評価」follow-up Issue を最初に作っておくと、評価忘れによる定着リスクが下がる（PR #423 では follow-up #424 #425 を同時起票）

---

<a id="ace-039"></a>

### ACE-039: AI プロンプトテンプレに「分析観点リスト」と「分類カテゴリリスト」が並存する場合、新観点追加時はカテゴリ対応を観点側に明記する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | tooling           |
| Origin     | PR #423           |
| Related    | ACE-014 / ACE-024 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: AI プロンプトテンプレで「観点 N 項目 / カテゴリ M 種類」のように 2 つの列挙が並存する場合、新観点を追加するときに対応カテゴリを明記しないと AI が分類に迷う。観点リスト側に「カテゴリは X または Y を推奨」を 1 句書くだけで AI 出力の一貫性が大きく上がる。Gemini Code Assist のような副レビュアーが detect しやすい欠陥でもある。

**Context**: PR #423 で ACE Phase 1 Generate プロンプトに観点 7「判断ログ」を追加したが、L62 のカテゴリリスト（coding/architecture/testing/security/performance/devops/process/tooling）には観点 7 に対応する明示語がなく、Gemini Code Assist が medium priority で「観点 7 をどのカテゴリに分類すべきか不明確 → 推奨カテゴリを観点側に追記せよ」と指摘。fix commit で観点 7 に「カテゴリは `process` または `architecture` を推奨」を追記して解消。

**Action**:

1. **観点リストとカテゴリリストが並存するプロンプトで新観点を追加するときは、観点側に推奨カテゴリを明記する**: 「**観点名**: 説明（カテゴリは X または Y を推奨）」の形式で 1 句
2. **カテゴリリスト自体を観点と 1:1 にできる場合は構造化を優先**: 観点 N 項目とカテゴリ M 種類が異なる軸を持つ場合のみ (1) のパターンを使う
3. **副レビュアー（Gemini Code Assist 等の auto-bot）の medium priority 指摘は無視しない**: Toolkit 一次レビューで見逃すパターンを independent detect する役割を持つ。Critical でなくても「カテゴリ整合」「対応欠落」系の medium は対応すべき

---

<a id="ace-040"></a>

### ACE-040: AI プロンプトテンプレ内で同概念を複数の語で表現すると AI 出力品質が下がる — 一次定義（SSOT）の語彙に統一する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-014 / ACE-024 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: AI プロンプトテンプレや知見エントリで同概念を 2〜3 の異なる語（例: 「spec 乖離」「spec から逸脱」「spec から変更した点」）で表現すると、AI が「これらは別概念か？」と誤解する余地が生まれ、冗長な分類や category mismatch を引き起こす。**一次定義（最初に登場する場所）を SSOT として扱い、他は同じ語彙を使う**。ACE-024（SSOT 用語の既存定義との衝突確認）の dual: 一度確立した用語が**自リポ内で**徐々に変質するパターン。

**Context**: PR #423 のレビューで comment-analyzer S3 が指摘。元々 PLAYBOOK ACE-034 エントリは「spec から変更した点」「spec にない判断」を正準形として使っていたが、観点 7 ドラフトでは「逸脱」、L35 対象データ表セルでは「乖離」と表記揺れが発生していた。3 箇所で異なる語を使うと AI prompt として渡された時に AI が冗長分類するリスクあり。fix commit で全箇所を ACE-034 の正準語「spec にない判断 / spec から変更した点 / 捨てた選択肢」に統一。

**Action**:

1. **AI プロンプトテンプレ / 知見エントリで複数箇所が同概念に言及する場合、一次定義（SSOT）を grep で特定し、他箇所は同じ語彙を使う**: `grep -rn "<概念名>" docs-template/` で散らばりを確認
2. **新エントリ・新観点を起草するときは既存 SSOT 用語を最初に確認**: 既存 PLAYBOOK エントリの Insight 文 / Action ステップで使われている語彙をピックアップして草稿の語彙を合わせる
3. **レビュー段階で表記揺れが検出されたら、変更箇所だけでなくファイル全体を grep で確認して同 commit で統一する**: 部分修正だとレビュー後に新たな揺れが入る

---

<a id="ace-041"></a>

### ACE-041: マージ後 cleanup の未追跡ファイルガードに引っかかったら、独立した chore PR で .gitignore 追加して cleanup を継続する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #423           |
| Related    | ACE-009 / ACE-012 |
| Date       | 2026-05-20        |
| Helpful    | 0                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: マージ後 cleanup の `git status --porcelain` ガードでツール設定ファイル（`.codex/`、`.vscode/local.json` 等）に止まった場合、その場で削除や restore せず、独立した chore PR で `.gitignore` 追加するパターンが安全。CLAUDE.md「勝手に git restore / git clean しない」原則を守りつつ cleanup を継続できる。短命の chore PR は Draft + 並列セルフレビューをスキップ可能な「真に trivial な変更」の典型例。

**Context**: PR #423 マージ後の `/merge-cleanup 423` で `.codex/config.toml`（Codex CLI ローカル MCP 設定、`.claude/settings.local.json` と同型）が未追跡で検出され Step 1 ガードに引っかかった。中身を確認しユーザーに 3 択提示 → `.gitignore` 追加を選択 → chore branch `chore/#426-gitignore-codex` 作成 → 3 行追加 commit → 非 Draft PR #427 で直接 ready + merge → PR #423 + #427 の 2 本まとめて cleanup 完遂。

**Action**:

1. **cleanup ガードで未追跡ファイルに止まったら、中身を確認して 3 分類する**: (a) 作業中の commit し損ね → 元ブランチに戻して commit、(b) ツール / 個人設定 → chore PR + .gitignore、(c) ビルド成果物 → .gitignore
2. **ツール設定の chore PR は短命で済ませる**: 1 ファイル 1〜3 行の .gitignore 追加なら Toolkit/Copilot 並列レビューはスキップ可能（PR description に "trivial な .gitignore" と理由を明記）
3. **cleanup 中の chore PR は元 PR と同じ run で merge + cleanup する**: PR 番号を 2 つ持つ cleanup（`gh pr view A` + `gh pr view B` を順番に処理）で 1 cycle 完結
4. **`.gitignore` への追加は既存セクションの末尾**: `# <Tool name>` 見出し + パターン 1 行で、既存パターン（`.claude/settings.local.json` 等）と同じスタイルに合わせる

---

<a id="ace-042"></a>

### ACE-042: テンプレファイル内の同一概念 placeholder は同一シンボル + 大文字で統一する — `XXX`/`NNN`/`xxx` 混在は AI/人のコピペ後置換漏れによる silent rot を誘発する

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation               |
| Origin     | PR #428 / Issue #425        |
| Related    | ACE-014 / ACE-024 / ACE-040 |
| Date       | 2026-05-20                  |
| Helpful    | 1                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: テンプレファイル内で同一概念の placeholder を `XXX`（heading 大文字）/ `xxx`（anchor 小文字）/ `NNN`（guideline 別シンボル）と書き分けると、AI / 人がコピペ後に片方の置換だけ忘れて anchor が壊れる silent rot を誘発する。anchor は ID 文字列の見た目が本物と区別しにくく、`ace-xxx` のまま残っても見落とされやすい。同一概念は **1 文書内で 1 シンボル + 大文字（`XXX` / `NNN` 等「明らかに置換しろ」と読める形）に統一** する。

**Context**: PR #428（Issue #425 anchor 化）で PLAYBOOK.md エントリテンプレに `<a id="ace-xxx"></a>`（lowercase）+ heading `### ACE-XXX:`（uppercase）+ guideline `<a id="ace-NNN"></a>`（uppercase N）の 3 種類の placeholder symbol を混在させた。Copilot review が「コピペ時に `ace-xxx` のまま残り `#ace-001` 等の参照と不一致になる silent rot リスク」を検出。post-merge で Gemini code-assist も別観点（「`NNN` の主語が不明確で `ace-001` 全体を指すかのように読める」）から独立に同じ placeholder 曖昧さを指摘。複数 AI が異なる切り口から同種の構造問題を検出した（[ACE-001](#ace-001) 系の補強）。

**Action**:

1. **同一概念は 1 文書内で同じシンボルに統一**: 「3 桁置換ターゲット」を `XXX` か `NNN` か 1 つに揃える。3 種類混ぜない
2. **シンボルは大文字 + 連続 (`XXX` / `NNN` / `YYY`)**: 小文字 `xxx` は実在の anchor `ace-xxx` と見た目が区別できず誤コピペを誘発する。大文字連続は「明らかに置換せよ」のシグナルとして強い
3. **置換ルールを placeholder の直近に明記**: 「`XXX` は 3 桁数字に置換」と動詞形で書く。「`XXX` は 3 桁ゼロパディング」だけだと、`XXX` が完全形 `ace-001` を指すかと曲解される（Gemini が独立指摘した構造）
4. **複数文書に同じ placeholder 規則を書くなら 1 箇所を SSOT 化、他はポインタ**: 重複させると 1 箇所だけ更新する drift 事故が起きる（[ACE-014](#ace-014) の系。PR #428 では 4 文書重複を Toolkit comment-analyzer が検出）

---

<a id="ace-043"></a>

### ACE-043: 品質ゲート script の chain と文書の「統括内容」記述は drift する — 自然文サマリではなく実体 script 名で列挙する

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #429 / Issue #417        |
| Related    | ACE-023 / ACE-025 / ACE-018 |
| Date       | 2026-05-20                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 品質ゲート script（`quality:local` のような複数 npm script を `&&` で連結したもの）の中身を文書で「validate / lint / prettier を統括」のような **自然文サマリ** で要約すると、`package.json:scripts.*` の実体が変わったときに文書側が drift する。drift は同じ周辺を編集する別 PR の review (Toolkit / Copilot 等) が偶発的に検出するパターンが多く、検出までのラグが長い (PR #414 → PR #416 review → Issue #417 → PR #429 で 1 ヶ月以上)。自然文サマリの代わりに **実体 script 名を順序通り列挙する** 形式で書けば、`package.json` を変更する PR で grep にヒットし、同 PR 内で文書側も同期できる。

**Context**: PR #414 で `quality:local` に `format:md:check` を追加した際、`docs/FRONTMATTER_GUIDE.md §2` 表の「`quality:local`: 上記の validate / lint / prettier を統括」記述は更新されなかった。さらに後の PR で `build:spec-index` が定義 (`package.json:14`) されたが `quality:local` chain には組み込まれず、`docs/FRONTMATTER_GUIDE.md §2` 表が「`build:spec-index` も統括しているかのように読める」記述のまま放置された。PR #416 で Toolkit code-reviewer が **pre-existing 誤記** として検出 → Issue #417 起票 → PR #429 で `package.json` に `build:spec-index` を追加するとともに `FRONTMATTER_GUIDE.md §2` と `NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` の bash ブロック / 表 / 「中身の順序」記述を実体と整合。修正中、Toolkit comment-analyzer がさらに §3.2 line 89 の「`format:md` は存在しません」（実態は存在する）と §3.3 line 94 の「中身の順序」での `format:md:check` 欠落を追加検出し、同 PR の fix commit で潰した。

**Action**:

1. **品質ゲート script を変更する PR では `package.json:scripts.*` と文書の chain 記述を双方向 grep**: `grep -rn 'quality:local' docs/` で言及箇所を全列挙し、自然文サマリではなく実体 script 名を列挙形式で書き直す
2. **「統括」「相当」「同等」のような曖昧語を避ける**: 「上記の validate / lint / prettier を統括」より「`build:mcp → check → mcp test → test:ace-scripts → validate -- docs-template → build:spec-index → format:md:check → lint:md` を順に実行」のような **実体列挙** が drift しにくい
3. **スクリプト挙動の説明では慣用語 (no-op / safe / handles gracefully) を避ける**: 「不在で no-op」のような表現は読み手の前提次第で「何もしない」「失敗しない」「副作用なし」の解釈が分かれる。`scripts/build-spec-index.mjs` の不在時挙動は厳密には「specs=0 で `dist/spec-index.json` を空索引として書き出し exit 0」であり、出力先・出力内容・exit code・副作用を字面で書く方が retrievable で誤読されにくい（ACE-025 を補強）
4. **「pre-existing な誤記」を起票するときは検出元 PR と原典 PR を明示**: Issue #417 のように「PR #416 review で発見、PR #414 起源」と書けば、修正 PR (#429) でも history を辿りやすい
5. **drift 修正 PR では同セクション内の隣接記述も再走査**: 触ったセクション (= heading 配下) の他の事実主張も Toolkit / Copilot に再読させる（[ACE-044](#ace-044) と組み合わせる）

---

<a id="ace-044"></a>

### ACE-044: review 指摘を取り込むスコープは「編集セクション境界」で判定する — 触ったセクション内の隣接 stale は同 PR、別ファイル / 別セクションは別 issue

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | process                     |
| Origin     | PR #429 / Issue #417        |
| Related    | ACE-032 / ACE-037 / ACE-043 |
| Date       | 2026-05-20                  |
| Helpful    | 2                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: Toolkit / Copilot review は編集差分から離れた行も検査するため、本 PR で触っていない pre-existing stale を発見することがある。これを「同 PR で潰す」か「別 issue にする」かは「touch ファイル外 vs ファイル内」だけでは粒度が粗く、**「同セクション (= heading 配下) vs 別セクション」の境界** を判定軸に加えると読み手にとって自然な PR diff になる。同セクション内の隣接 stale を放置すると、`build:spec-index` を追加した PR が「半端な最新化（隣の行は古いまま）」と読まれ、レビュー時の文脈分断を招く。

**Context**: PR #429 で `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` を編集（`build:spec-index` 追加）。Toolkit comment-analyzer が以下を検出:

- **W1**: 同 §3.2 内 line 89 注記「`package.json` に `format:md` は存在しません」が事実誤認（実態は `format:md` / `format:md:check` の両方が存在）。本 PR では line 89 を触っていなかったが、隣接行（line 86 表の `build:spec-index` 追加）を編集したため「半端な最新化」と読まれる risk。**同 PR で整合**。
- **W2**: 同 §3.3 内 line 94「中身の順序」で `format:md:check` 欠落（pre-existing）。本 PR で同行に `build:spec-index` を**挿入したことで** 「この行を最新版に整えた」と読まれる risk が高まった。**同 PR で 1 トークン追加して整合**。
- **S2/S3**: `README.md:74` / `.github/pull_request_template.md:28` の stale 記述（`quality:local` の chain 列挙）。本 PR では触っていないファイル。**別 issue 化 (#430)**。

3 段階の判定基準が機能した: (1) touch ファイル外 = 別 issue、(2) touch ファイル内かつ別セクション = 状況次第（W1/W2 は同セクションだったので同 PR）、(3) touch セクション内 = 機械的に同 PR で整合。

**Action**:

1. **review 指摘を分類するとき 3 段階で判定**: (a) touch ファイル外 → 別 issue を即起票（CLAUDE.md「『別 Issue』と言ったら即 `gh issue create`」ルール）、(b) touch ファイル内 / 別セクション → 影響範囲と PR スコープを天秤にかける、(c) touch セクション内 → 1 fix commit に束ねて同 PR で機械的に整合
2. **「半端な最新化」を意識的に回避する**: PR で同行や隣接行に変更を加えたら、その行が含まれる説明全体が一致しているかを再走査。`grep -n <ファイル>` で section の境界を確認してから fix commit を切る
3. **別 issue 化したものは fix commit のコメントで明示**: PR コメントで「W1/W2 は本 PR で対応、S2/S3 は #430 で別対応」のように issue 番号を引いてレビュアーの脳内マップを補助する
4. **pre-existing と本 PR 起因を区別する**: コミットメッセージで「W1 (comment-analyzer): pre-existing で本 PR で隣接行を編集したため整合対応」のように **来歴を残す**。これにより後続の review が「なぜこの 1 行も直したのか」を辿れる
5. **本 PR スコープ判定で迷ったら軽量側 (= 範囲内) に倒す**: CLAUDE.md ルール「過剰な issue 分割は PR の流れを止める」と整合。ただし「触っていないファイル」だけは別 issue を例外なく適用する

---

<a id="ace-045"></a>

### ACE-045: 設計文書内の「mirror 付録（実体の参照用コピー）」は本体改稿で silent drift する — mirror を持つなら本体改稿で同期、または mirror を削って外部参照に置換

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #431 / Issue #430        |
| Related    | ACE-014 / ACE-043 / ACE-044 |
| Date       | 2026-05-20                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 設計文書（design doc / 仕様書）の付録に「実体ファイルの参照用コピー」を載せると、実体ファイルを改稿した瞬間 mirror が silent に drift する。`format:md:check` / markdownlint は内容の一致を検査しないため自動検出されず、後から読んだ人は「mirror = 実体」と誤認したまま古い snapshot を信じる。chain drift（ACE-043）/ 索引の数値重複（ACE-014）と源流を共有するが、本件は「同一文書内に実体のコピーを抱える」mirror パターン特有の落とし穴で、`grep` で気付かなければ次の chain 変更まで silent rot する。

**Context**: PR #431 で `.github/pull_request_template.md` の Self-Review Results を簡略化（旧 chain 列挙 → `npm run quality:local` 1 行）した際、Toolkit code-reviewer I1 (88%) が `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` 付録 A (L211-258) を検出。付録 A 冒頭の「`.github/pull_request_template.md` には**反映済み**。以下は採用時点の**参照用コピー**。」という注記が本 PR で本体を改稿した瞬間「反映済み」が嘘になり、付録 A の参照用コピーが本体と乖離。Toolkit は同 PR 内 fix commit でテンプレ本体と付録 A を同時更新するよう推奨し、mirror を持つ場合の同期責任を明示した。同型の bug は ACE-014（索引文書の数値重複）/ ACE-043（chain の自然文サマリ drift）と源流を共有するが、本件は「同一文書内に実体のコピーを抱える」mirror パターンに特化。

**Action**:

1. **設計文書内に mirror 付録を作らない**: 外部ファイル（PR テンプレ / 設定ファイル等）の現行スナップショットが必要なら、(a) 付録ではなく `[該当ファイル](path)` への参照 URL のみ置く、(b) 「採用時点」のような時系列情報が重要なら git tag / commit SHA への永続リンクを使う
2. **mirror を持つ判断をした場合は本体改稿 PR で同期**: ACE-044 の「touch ファイル外 = 別 issue」原則の **carve-out 例外**として、mirror であることが文書内に明示されている付録は同 PR で同期する（mirror 注記自体が「本体と整合させる」契約として機能する）
3. **mirror 注記には「自動同期されません」を明記**: 「以下は採用時点の参照用コピーで、自動同期されません。一次情報は `path/to/source`」のように一次情報の場所を明示し、本体と mirror どちらを信じるかを読者が判断できるようにする
4. **mirror の存在を grep で発見可能にする**: コードフェンス内の特徴的なヘッダや mirror 注記の定型句（「参照用コピー」「採用時点」「反映済み」等）で着手前に grep し、本体改稿時に未認識の mirror を見落とさない仕組みにする

---

<a id="ace-046"></a>

### ACE-046: PR/Issue body 内の相対リンクは `pull/N/` または `issues/N/` 起点で展開される — リポローカルテンプレでは `blob/HEAD/` 絶対 URL を使い、配布版は plain text にする

| フィールド | 値                                                                    |
| ---------- | --------------------------------------------------------------------- |
| Category   | documentation-quality                                                 |
| Origin     | PR #437 / Issue #433-#436                                             |
| Date       | 2026-05-20                                                            |
| Helpful    | 1                                                                     |
| Harmful    | 0                                                                     |
| Status     | active                                                                |
| Related    | [ACE-016](#ace-016)（anchor URL 欠落）/ [ACE-044](#ace-044) carve-out |

**Insight**: GitHub の PR/Issue body はファイル単体閲覧時と **異なる base URL** でレンダリングされる。`.github/pull_request_template.md` を新規 PR で展開した場合、相対リンク `../docs/X.md` は repo ルートに届かず `repo/docs/X.md` という存在しない URL（HTTP 404）に解決される。先頭 `../` が無い `docs-template/X.md` のような形も同様に `pull/N/docs-template/X.md` 起点で展開され 404。テンプレファイル内では「ファイル単体閲覧」と「PR/Issue body 展開」で互換性のない 2 モードがあり、相対リンクは両方を満たせない。

**Context**: PR #431 で Gemini Code Assist が `[docs/...](../docs/...)` を「PR body 展開時にリンク切れ」と指摘 → ACE-044 carve-out 判定で別 Issue 化 → PR #437 で実証 + 修正。HEAD リクエストで確認: `repo/docs/AI_GIT_WORKFLOW.md` は **404**、`blob/HEAD/docs/AI_GIT_WORKFLOW.md` は **200**、`pull/N/docs/AI_GIT_WORKFLOW.md` は 302 → `pull/new/...`（事実上 404）。仕様根拠は [github/markup#576](https://github.com/github/markup/issues/576)。PR #437 で `.github/pull_request_template.md` の 3 箇所（L15/L28/L54）を `blob/HEAD/` 絶対 URL 化した直後、Gemini が L39 `[Review Response Policy](docs-template/...)` の絶対 URL 化漏れを指摘 — 当方 grep が `\.\./` 前提だったため先頭 `../` の無い形を見逃した。fix commit `38f12e1` で対応。同問題はリポローカル PR テンプレ 4 箇所 + ISSUE_TEMPLATE 16 箇所 + 配布版 15 箇所の計 35 箇所に存在（子 Issue #434/#436/#435 で段階対応）。

**Action**:

1. **リポローカル PR/Issue テンプレ**: `https://github.com/<owner>/<repo>/blob/HEAD/<path>` 形式の絶対 URL を使う。`HEAD` は GitHub が default branch に自動解決するため `develop`/`main` ハードコードを避けられる（default branch リネーム耐性あり）。
2. **配布版テンプレ** (`docs-template/.github/`): 採用先リポの URL が不明なので絶対 URL 不可。リンクを外し inline code (`` `docs-template/X.md` ``) に変更し、採用者向けに「リンク化する場合は自リポの `blob/HEAD/` URL に置換」と注釈を付ける。
3. **相対リンク検出 grep の拡張**: [ACE-016](#ace-016) Action 2 の `grep -nE "\]\(\.\./[^)]+\)"` は先頭 `../` のみ catch する。テンプレファイル内では `\]\([^h)#][^)]*\.md` （http/`#` で始まらない URL 部分を持つリンク全般）まで広げる。実証: PR #437 で `../` 前提 grep を信じて 3 箇所修正 → Gemini が L39 `docs-template/...` の絶対 URL 化漏れを指摘 → 拡張 grep で hit する形。
4. **検証手順**: (1) `gh pr view <N> --json body --jq .body` で PR body の生テキストを確認、(2) `curl -sI <絶対 URL>` で各リンクが HTTP 200 を返すか確認、(3) ファイル単体閲覧でも開けるか確認（`blob/HEAD/` なら両モード OK）。

---

<a id="ace-441-1"></a>

### ACE-441-1: ドキュメントを走査するツールの正規表現を緩めるときは実ファイルで件数検証し、パターンを「実 ID の形」に制約する

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | testing              |
| Origin     | PR #441 / Issue #440 |
| Related    | ACE-042 / ACE-028    |
| Date       | 2026-05-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: ドキュメント（PLAYBOOK 等）を走査するスクリプトの見出し検出正規表現を緩めると、その doc 自身が含む **テンプレート/例の placeholder 見出し**（code fence 内の `### ACE-XXX:` 等）まで誤検出しうる。合成 fixture のユニットテストは green でも、実ファイルに対して走らせて初めて件数ズレが露見する。パターンは「拾いたい実体の形」（ID なら数字始まり / `i`＋数字始まり）に制約してテンプレ placeholder を構造的に除外し、緩和後は必ず**本物のファイル**に対して件数を検証する。

**Context**: PR #441 で ACE エントリ ID を PR スコープ式に変える際、`check-category-size.ts` の検出正規表現を `/^### ACE-\d{3,}:/m` → `/^### ACE-[\w-]+:/m` に緩めた。ユニットテスト（合成 fixture）は通ったが、実 PLAYBOOK に `ace:check-playbook-categories` を走らせると総エントリ数が 46→47 になり `coding / architecture / testing / ...` という不自然なカテゴリが出現。原因は緩めた `[\w-]+` がエントリテンプレート（code fence 内）の `### ACE-XXX:` を実エントリとして拾ったこと。旧 `\d{3,}` は `XXX`（非数字）を弾いていたため顕在化していなかった。実装プランの正規表現案が緩すぎた欠陥を、プランの「実ファイル検証」ステップが捕捉した。

**Action**:

1. doc を parse するツールの正規表現を緩めたら、**合成 fixture だけでなく本物のファイルに対して走らせ、件数・カテゴリの妥当性を目視確認する**（プランに「実ファイル検証」ステップを必ず入れる）。
2. パターンは拾いたい実体の形に制約する。ID 検出なら `/^### ACE-(?:\d[\w-]*|i\d[\w-]*):/m`（数字始まり / `i`＋数字始まり）で doc 内のテンプレ placeholder（`ACE-XXX`/`NNN`）を除外。
3. placeholder 除外を回帰テストで固定する（`ACE-XXX` / `ACE-NNN` / `i`＋非数字 `ACE-iabc` を含めて「集計されない」ことを assert）。

---

<a id="ace-441-2"></a>

### ACE-441-2: pre-commit hook は正式品質ゲート（quality:local）の軽量サブセット — pr-ready 前に必ず full ゲートを回す

| フィールド | 値                   |
| ---------- | -------------------- |
| Category   | process              |
| Origin     | PR #441 / Issue #440 |
| Related    | ACE-043              |
| Date       | 2026-05-30           |
| Helpful    | 0                    |
| Harmful    | 0                    |
| Status     | active               |

**Insight**: pre-commit hook が通っても、正式品質ゲート（`npm run quality:local`）が落ちうる。hook は速度優先で軽量サブセット（このリポジトリでは markdownlint のみ）しか実行しないため、prettier `--check`・MCP build/check・各テスト・docs 検証・spec-index などの追加チェックは hook を素通りする。**commit が通った＝ゲート通過、と錯覚しない。**

**Context**: PR #441 で、commit 時の pre-commit hook（markdownlint のみ）は全 commit で 0 error だったが、`quality:local` を回すと `format:md:check`（prettier `--check`）が 3 ファイルで未整形を検出して落ちた。markdownlint は通すが prettier 整形は別ルールのため、hook だけを信じて pr-ready にすると CI 相当の `quality:local` で初めて落ちる。

**Action**:

1. **pr-ready の前に必ず `npm run quality:local` を通しで回す**（10 ステップ workflow の Step4）。hook 通過をゲート通過と同一視しない。
2. doc/設定変更を含む PR では特に prettier 整形漏れに注意。`npx prettier --write <変更ファイル>` を pre-ready で一度かける。
3. hook と full ゲートの差分（何が hook に無く full にあるか）を把握しておく。

---

<a id="ace-443-1"></a>

### ACE-443-1: framework リポは自テンプレをドッグフードするため知見ベースは `docs-template/` 配下 — AI レビュアーの「docs-template→docs」パス提案は実在確認してから採否を決める

| フィールド | 値                          |
| ---------- | --------------------------- |
| Category   | documentation-quality       |
| Origin     | PR #443 / Issue #442        |
| Related    | ACE-027 / ACE-031 / ACE-001 |
| Date       | 2026-05-30                  |
| Helpful    | 0                           |
| Harmful    | 0                           |
| Status     | active                      |

**Insight**: 本フレームワークは自分のドキュメントテンプレート（`docs-template/`）を**自リポでもドッグフード**しているため、アクティブな ACE 知見ベース（PLAYBOOK.md 等）は `docs-template/08-knowledge/` に存在し、`docs/08-knowledge/` は**存在しない**。AI レビュアー（特に Gemini Code Assist）は「採用先プロジェクトでは `docs-template/` は削除され `docs/` がアクティブ」という一般則から、リポ自身の設定ファイル（`.cursorrules` / `AGENTS.md`）の `docs-template/...` 参照を `docs/...` に変えるよう提案するが、framework リポ自身ではこれを適用すると**リンク切れになる**。レビュー提案のパス変更は、提案先パスが実在するか（`ls`）を確認してから採否を決める。

**Context**: PR #443 で `.cursorrules` / `AGENTS.md` に ACE 採番 SSOT へのポインタ（`docs-template/08-knowledge/PLAYBOOK.md#エントリid規則`）を追加したところ、Gemini が medium 2 件で「採用先で `docs-template/` 削除時にリンク切れ → `docs/08-knowledge/PLAYBOOK.md` に変更」を提案。だが本リポには `docs/08-knowledge/` が無く（実 PLAYBOOK は `docs-template/` 側）、提案適用は逆にリンク切れを生むため不採用とし、根拠を PR にコメントで残した。一方、配布対象の `SETUP_*.md`（`docs-template/` 配下）はテンプレ相対パス `./08-knowledge/...` を使っており採用先コピー後も解決するため、Gemini の懸念は配布側では既に回避済みだった。

**Action**:

1. AI レビュアーがパス変更（特に `docs-template/` ↔ `docs/`）を提案したら、**提案先パスの実在を `ls` で確認**してから採否を決める。framework リポ自身では `docs-template/` がアクティブ知見ベース。
2. リポ自身の設定ファイル（root の `.cursorrules` / `AGENTS.md` / `.github/copilot-instructions.md`）は `docs-template/...` を指す。配布対象テンプレ（`docs-template/SETUP_*.md` 等）はテンプレ相対パス `./...` を使い、採用先コピー後も解決するようにする。
3. 不採用のレビュー提案は根拠（実在確認結果）を PR コメントに残す。

---

## Changelog

### [1.26.0] - 2026-05-30

#### 追加

- ACE-443-1: framework リポは自テンプレをドッグフードするため知見ベースは `docs-template/` 配下 — AI レビュアーの「docs-template→docs」パス提案は実在確認してから採否を決める — PR #443 で Gemini が `.cursorrules`/`AGENTS.md` の `docs-template/...` 参照を `docs/...` に変更提案したが、本リポに `docs/08-knowledge/` が不在でリンク切れになるため `ls` 確認の上で不採用とした経験から抽出

#### 更新

- ACE-018（横断変更は着手前に grep で全 SSOT を列挙）Helpful: 3 → 4 — PR #443 で ACE 採番ポインタを `.cursorrules`/`AGENTS.md` に追加したが repo 自身の `.github/copilot-instructions.md` を取りこぼし、Toolkit code-reviewer が Warning 検出。同セッション内で advisor（#441 で AI_GIT_WORKFLOW/CLAUDE.md）・user（Codex/AGENTS.md）に続く 3 度目の「全サーフェス列挙漏れ」で、着手前 grep 列挙の運用徹底の重要性を再確認
- ACE-016（anchor link は label と URL の両方に書く / explicit anchor で slug 変更耐性）Helpful: 3 → 4 — PR #443 で §4 見出しリネームに伴う inbound link 切れを explicit anchor `<a id="ace-ops-template">` 付与で予防（全角括弧で auto-slug が脆いケース、explicit anchor 適用の 3 例目）。advisor が編集前に予防的指摘
- ACE-014（索引文書は SSOT を子に集約）Helpful: 3 → 4 — PR #443 で採番メカニクスを ACE_SETUP §4 + PLAYBOOK §エントリID規則 の SSOT のみに置き、AGENTS.md/.cursorrules/SETUP\_\* はポインタに統一。grep で新規ポインタファイルへの非重複（DRY）を検証

### [1.25.0] - 2026-05-30

#### 追加

- ACE-441-1: ドキュメントを走査するツールの正規表現を緩めるときは実ファイルで件数検証し、パターンを「実 ID の形」に制約する — PR #441 で ACE 検出正規表現を緩めた際、code fence 内のエントリテンプレ `### ACE-XXX:` を誤検出して実 PLAYBOOK 集計が 46→47 になり、実ファイル検証ステップで捕捉した経験から抽出（PR スコープ式 ID の初適用エントリ）
- ACE-441-2: pre-commit hook は正式品質ゲート（quality:local）の軽量サブセット — pr-ready 前に必ず full ゲートを回す — PR #441 で markdownlint hook は全 commit 0 error だったが `quality:local` の `format:md:check`（prettier）が 3 ファイルで落ちた経験から抽出

#### 更新

- ACE-016（anchor link は label と URL の両方に書く）Helpful: 2 → 3 — PR #441 でマージ方針 SSOT リンク（ace-cycle.md / ace-curate.md / AI_GIT_WORKFLOW.md の「§運用パターン（マージ方針）」）が `#` フラグメント無しのファイルリンクで先頭着地する欠陥を Toolkit comment-analyzer と Copilot が独立検出。全角括弧で auto-slug が脆いため explicit anchor `<a id="ace-merge-policy">` を付与して解消（ACE-016 の explicit anchor 適用の 2 例目）
- ACE-018（横断 grep で SSOT 列挙）Helpful: 2 → 3 — PR #441 でマージ方針反転の残骸スイープを「編集した 5 ファイル」に限定したところ、advisor が AI_GIT_WORKFLOW.md / CLAUDE.md の取りこぼしを検出。元の ACE-012 carve-out が適用された 5 サイトと同じ全集合をリポジトリ全体 grep で列挙すべきだった事例（ACE-018 の指摘構造と完全一致）
- ACE-042（テンプレ placeholder の符号統一）Helpful: 0 → 1 — PR #441 で参照リンク形式の「`XXX` はエントリ ID をそのまま使用。新規は `ace-438-1`」記述が `[ACE-ace-438-1](#ace-ace-438-1)` の接頭辞重複を招くと Gemini が指摘。placeholder `XXX` の置換対象（接頭辞 `ACE-`/`ace-` を除いた部分）を明示して解消

### [1.24.0] - 2026-05-20

#### 更新

- ACE-016（anchor link は label と URL の両方に書く）Helpful: 1 → 2 — PR #438 で `.github/ISSUE_TEMPLATE/bug.md` L32（`[PATTERNS.md#エラーハンドリング](.../PATTERNS.md)`）と `infra.md` L26（`[ARCHITECTURE.md#インフラ](.../ARCHITECTURE.md)`）の「ラベルに `#anchor` を含むのに URL 側にフラグメント欠落」パターンを **Copilot review が「ACE-016 で言及されているパターン」と PLAYBOOK エントリ名を明示引用して指摘** した事例。Gemini Code Assist も独立に同じ 2 箇所 + `feature.md` L22/L23 の placeholder 形 `#該当セクション` を medium 指摘し、AI レビューワー（Copilot/Gemini）が PLAYBOOK を内化して同パターンを継続検出する運用が確立
- ACE-046（PR/Issue body 内の相対リンクは絶対 URL 化）Helpful: 0 → 1 — PR #437（PR テンプレ 4 箇所）と同一の `blob/HEAD/` 絶対 URL 化方針を PR #438 で `.github/ISSUE_TEMPLATE/` 配下 16 箇所に **機械的に再適用** した事例。`grep -rn '\.\./\.\./docs' .github/ISSUE_TEMPLATE/` → 0 件 / `grep -rn 'blob/HEAD/' .github/ISSUE_TEMPLATE/` → 16 件で受け入れ条件を実証ベースで確認し、子 Issue #436 を一発でクローズ。同一知見が複数 PR（#437 と #438）で再利用された事例として補強

### [1.23.0] - 2026-05-20

#### 追加

- ACE-046: PR/Issue body 内の相対リンクは `pull/N/` または `issues/N/` 起点で展開される — リポローカルテンプレでは `blob/HEAD/` 絶対 URL を使い、配布版は plain text にする — PR #437 で `.github/pull_request_template.md` の 4 箇所を絶対 URL 化した経験 + HEAD リクエスト実証データ（`repo/docs/X.md` は 404、`blob/HEAD/docs/X.md` は 200）から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 5 → 6 — PR #437 で Toolkit code-reviewer は「Critical/Important なし、承認推奨」だったが Gemini Code Assist が medium 2 件（L39 絶対 URL 化漏れ + L54 リンクテキスト一貫性）を独立検出。Toolkit 単独では catch できない漏れを Gemini が補完した事例で、auto-attach 経路の費用対効果を再確認
- ACE-044（review 指摘スコープを編集セクション境界で判定）Helpful: 1 → 2 — PR #431 で `../docs/` 指摘を「pre-existing で L15/L54 を巻き込む」として別 Issue #430 / #433 系に分割した判定が PR #437 で本格対応として完遂。「別 Issue 化判定 → 後続 PR で纏めて対応」のサイクルが機能した事例として補強

### [1.22.0] - 2026-05-20

#### 追加

- ACE-045: 設計文書内の「mirror 付録（実体の参照用コピー）」は本体改稿で silent drift する — mirror を持つなら本体改稿で同期、または mirror を削って外部参照に置換 — PR #431 で `docs/NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md` 付録 A が本体 PR テンプレ簡略化と drift し Toolkit code-reviewer I1 (88%) が検出した経験から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 4 → 5 — PR #431 で Toolkit comment-analyzer (Suggestion 4 件) + Toolkit code-reviewer (Critical C1 + Important I1) + Copilot (3 inline comments) + Gemini Code Assist (org 設定で auto-attach、2 inline comments) の **4 系統が独立検出**。Gemini auto-attach により追加コストなしでレビュースタックが拡張された事例
- ACE-014（索引文書 SSOT 集約）Helpful: 2 → 3 — PR #431 で `quality:local` の chain 列挙を **README + PR テンプレ + 付録 A の 3 箇所**に持っていた SSOT 違反を、`§3.3` 1 箇所に集約 + 他 2 箇所を参照型に整理した事例。Related に [ACE-045](#ace-045) を追加
- ACE-016（anchor link は label と URL の両方に書く）Helpful: 0 → 1 — PR #431 で `[\`docs/...\` §3.3](../docs/...)`が label に`§3.3`を含むが URL に`#anchor`欠落のパターンを Toolkit code-reviewer C1 (95%) が再検出。fix は`<a id="quality-local-detail"></a>`を §3.3 見出し直前に付与し、参照側を`#quality-local-detail` で固定（PLAYBOOK 外で初適用）。explicit anchor 採用で heading slug 変更（日本語 / コードフェンス / コロン混在）への耐性も獲得
- ACE-044（review 指摘スコープを編集セクション境界で判定）Helpful: 0 → 1 — PR #431 で 2 種類のスコープ判定をドッグフード: (a) Gemini の `../docs/` 相対パス指摘は touched ファイル内 (L28) だが pre-existing で L15/L54 を巻き込むため **spawn task で別 Issue 化**、(b) Appendix A drift は別ファイルだが **「mirror であることが明示」carve-out** で同 PR 内 fix commit に統合（[ACE-045](#ace-045) Action 2 として運用ルール化）

### [1.21.0] - 2026-05-20

#### 追加

- ACE-043: 品質ゲート script の chain と文書の「統括内容」記述は drift する — 自然文サマリではなく実体 script 名で列挙する — PR #429 で `quality:local` の chain に `build:spec-index` を追加した際、`FRONTMATTER_GUIDE.md §2` 表 / `NO_GITHUB_ACTIONS_MIGRATION_DESIGN.md §3.2-3.3` の自然文サマリ記述が drift しており PR #416 review が pre-existing 誤記として検出 (Issue #417) した経験から抽出
- ACE-044: review 指摘を取り込むスコープは「編集セクション境界」で判定する — 触ったセクション内の隣接 stale は同 PR、別ファイル / 別セクションは別 issue — PR #429 で Toolkit comment-analyzer が同 §3.2-3.3 内の W1 / W2（pre-existing）と README.md:74 / PR テンプレ:28（S2/S3）を検出し、3 段階のスコープ判定で前者を同 PR fix commit、後者を #430 で別対応とした経験から抽出

#### 更新

- ACE-025（スクリプトの対象範囲を実装列挙で書く）Helpful: 0 → 1 — PR #429 で「不在で no-op」のような慣用語ではなく「specs=0 で `dist/spec-index.json` を空索引として書き出し exit 0」と実装挙動を字面で書く事例として補強。Related に [ACE-043](#ace-043) を追加

### [1.20.0] - 2026-05-20

#### 追加

- ACE-042: テンプレファイル内の同一概念 placeholder は同一シンボル + 大文字で統一する — PR #428 で `<a id="ace-xxx">` / `### ACE-XXX:` / `<a id="ace-NNN">` の 3 種混在を Copilot + Gemini が独立に placeholder rot リスク / 主語曖昧さの異なる切り口で検出した経験から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 3 → 4 — PR #428 で Toolkit code-reviewer（Changelog 同期違反 + 表セル幅）/ Toolkit comment-analyzer（SSOT 違反 4 ファイル）/ Copilot（placeholder 符号統一）/ Gemini（主語曖昧さ）の 4 モデルが互いに重ならない構造問題を独立検出
- ACE-014（索引と実体の SSOT 集約）Helpful: 1 → 2 — PR #428 で 2 種類の SSOT 違反を同時検出（(a) 同じ anchor 命名規則を 4 文書に重複、(b) frontmatter `version` を bump して Changelog 項目を追加し忘れた索引-実体の同期漏れ）
- ACE-018（横断 grep で SSOT 列挙）Helpful: 1 → 2 — PR #428 で受入基準 2 文書だけ列挙したが advisor が「実 mutation point である `.claude/commands/ace-curate.md` の anchor テンプレも更新しないと silent rot」と指摘 → enforcement 点列挙が不足していた事例
- ACE-035（ドッグフード + advisor）Helpful: 1 → 2 — PR #428 で着手後 advisor を呼び、(a) ace-curate.md の mutation point ギャップ、(b) implementation-notes 取り扱い、(c) anchor の手動 navigation 検証必要性 の 3 件を pre-substantive で発見

### [1.19.0] - 2026-05-20

#### 追加

- ACE-001〜041 の各エントリ直前に explicit anchor (`<a id="ace-NNN"></a>`) を 41 件付与（Issue #425）
- エントリテンプレート / 記述ガイドラインに anchor 命名規則を追加（小文字 + ハイフン + 3 桁ゼロパディング）
- 他ドキュメントからの ACE 参照を `[ACE-NNN](path/to/PLAYBOOK.md#ace-nnn)` 形式に統一（旧 3 形式を撤去）

### [1.18.0] - 2026-05-20

#### 追加

- ACE-038: 「データ収集待ち」を要求する受入基準でも、ロールバック容易な変更は先行実装 + 試行中ステータス明記でフィードバックループを早める — PR #423 で Issue #421 受入基準（5 PR 運用待ち）を 1 行 diff + 試行中明記の組み合わせで先行実装した経験から抽出
- ACE-039: AI プロンプトテンプレに「分析観点リスト」と「分類カテゴリリスト」が並存する場合、新観点追加時はカテゴリ対応を観点側に明記する — PR #423 で Gemini Code Assist が「観点 7 のカテゴリ対応が L62 リストに無い」と検出した medium 指摘から抽出
- ACE-040: AI プロンプトテンプレ内で同概念を複数の語で表現すると AI 出力品質が下がる — 一次定義（SSOT）の語彙に統一する — PR #423 で「spec 乖離 / 逸脱 / 変更した点」の 3 表記揺れが comment-analyzer S3 で検出された経験から抽出。ACE-024 の dual
- ACE-041: マージ後 cleanup の未追跡ファイルガードに引っかかったら、独立した chore PR で .gitignore 追加して cleanup を継続する — PR #423 cleanup 中に `.codex/config.toml` 未追跡で止まり chore PR #427 で解消した経験から抽出

#### 更新

- ACE-035（ドッグフード + advisor）Helpful: 0 → 1 — PR #423 description で「採用しなかった選択肢（5 PR 待ち）」「ロールバック条件」を明記したことが観点 7 用 raw material のドッグフードとして機能した実例

### [1.17.0] - 2026-05-19

#### 追加

- ACE-035: 新規 process パターンを Playbook に追加するときは「ドッグフード + advisor / second opinion」で運用上の構造問題を検出する — PR #420 でドッグフードした implementation-notes.md の扱い (a) → (b) pivot 経験から抽出。advisor を呼ばずにマージしていたら develop ルートで構造的衝突が起きていた具体例
- ACE-036: 外部知見（SNS / ブログ / 社内 wiki）を Playbook に取り込む前に既存 ACE エントリ全件と grep 照合する — Anthropic エンジニア公開プロンプトを ACE-034 として取り込む際の照合手順から抽出。ACE-018（自リポ横断 grep）と相補的
- ACE-037: ACE エントリの新規追加は対応する運用手順（workflow / self-review / ace-cycle）への組み込みを同 PR で済ませる — PR #420 で Playbook + git-workflow + ace-cycle を同時改稿した経験と Copilot 整合性指摘から抽出

#### 更新

- ACE-001（クロスモデルレビュー）Helpful: 2 → 3 — PR #420 で Copilot（semantic 矛盾検出） + Gemini Code Assist（SSOT 同期検出）の役割分担を観察、別カテゴリ問題が並列レビューで発見された

### [1.16.0] - 2026-05-19

#### 追加

- ACE-034: 実装中は implementation-notes.md を作業ブランチに並走させて spec 乖離・トレードオフ・判断理由を捕捉する — Anthropic エンジニア公開実装プロンプト（"keep a running implementation-notes file with decisions / changes / tradeoffs"）と本リポ Playbook (ACE-001〜033) を grep 照合した結果未抽出と判明。コミット diff に残らない in-flight な判断ログを並走させることで ACE Phase 1 Generate の入力品質を底上げする（ACE-009 / ACE-023 / ACE-032 を補強）

### [1.15.0] - 2026-05-19

#### 追加

- ACE-031: ドキュメントを書くときは配布境界に基づいて「想定読者」を意識する — PR #416 で frontmatter ガイドが「採用者向け」を謳いつつ配布境界 P2 外の MCP サーバーを value 主張として紹介していた事例。配布境界と想定読者の不一致が判明（ACE-021 を補強）
- ACE-032: 機能撤去型の改稿後は、残った value 主張・周辺記述・論理連鎖が全て成立しているか改めて読み直す — PR #416 で MCP value 撤去後に「AI ツールが索引で絞り込む」value 主張だけが宙に浮き、`MCP test` 記述が周辺取り残しになり、`§5.4.2` 「AI 提供用」表現が `§2.1` と矛盾した事例（ACE-022 を補強）
- ACE-033: 対応表で全行 / 全 cell が uniform になったら、表自体が情報を持っていないサイン — PR #416 の §7.1 表が MCP 行撤去後に 5 行中 4 行 ✅ uniform になり情報量が薄くなった事例。共通項を 1 文に集約し差別化情報のみ表にする（ACE-026 / ACE-030 を補強）

#### 更新

- ACE-023: Helpful +1（PR #416 で MCP 関連の事実主張を撤去する際、`mcp/package.json` の依存宣言まで一次情報照合したことで unused `js-yaml` 依存を発見、Issue #418 を起票）
- ACE-029: Helpful +1（PR #416 で MCP value 撤去時に `mcp/src/index.ts` の import 文を実体確認することで `js-yaml` が宣言済みなのに未使用という乖離を検出、Issue #418 として別 Issue 化）

### [1.14.0] - 2026-05-19

#### 追加

- ACE-028: 外部ツールの「現状」仕様を書くときは公式ドキュメントを WebFetch / WebSearch で必ず照合する — PR #414 で Copilot / Codex CLI が MCP 非対応と書いたが、両者とも 2026 年現在対応済み（VS Code Agent mode GA 2025-04 / `codex mcp add`）、Cursor の `.cursorrules` も deprecated と判明。LLM training cutoff 起因の事実誤認を防ぐ（ACE-023 を補強）
- ACE-029: 外部ツール依存物（shell script の依存コマンド、shebang、インストーラオプション）を文書化するときは実体を読んで列挙する — PR #414 で `.husky/pre-commit` の要件を「sh.exe 必要」と書いたが、実体は `grep`/`xargs` も使用しており「sh + coreutils」が正解。Git for Windows のインストーラオプションも「インストールすれば OK」では不十分（ACE-025 を補強）
- ACE-030: 対応表で `⚠️` を多用したら判定軸自体が間違っているサイン — PR #414 で Cursor の MCP を「⚠️ 一部対応」と書いたが、実態は完全実装で判定軸自体が崩壊。判定軸を「対応有無」から「対応方法・条件」に切り替えるのが正解（ACE-026 を補強）

### [1.13.0] - 2026-05-19

#### 追加

- ACE-025: スクリプトの「対象範囲」を文書化するときは glob 表現ではなく実装上の対象列挙方式まで踏み込む — PR #411 で `validate-docs.mjs` の検証対象を「`docs-template/**/*.md`」と glob 表現で書いたが、実装は `CORE_DOCS` 配列で固定 7 ファイル列挙方式だった。Toolkit code-reviewer W1 + Copilot review が独立検出（ACE-023 を補強）
- ACE-026: 同名関数が複数ファイルに併存する場合は機能対応表で並列説明する — PR #411 で `parseFrontMatter` 3 実装（utils.ts / validate-docs.mjs / build-spec-index.mjs）を単数形で一括説明したが、`>-`/`|` 処理・配列構文・ネスト map 等で挙動差があった。Toolkit comment-analyzer が Critical C1/C2 検出、Copilot/gemini も独立指摘
- ACE-027: 配布対象ファイル内の行番号 hard-coded 参照は採用後に即陳腐化するため heading anchor 化する — PR #411 で `docs-template/MASTER.md:147` 等 6 箇所以上の行番号参照を使用。配布対象は採用者のコピー先で確実にズレるため、heading anchor 形式に置換（ACE-016 を補強）

### [1.12.0] - 2026-05-07

#### 追加

- ACE-024: SSOT で確立した用語を再利用する前に既存定義との衝突を確認する — PR #409 で「コア 7 文書 + ルート直下」見出しがフレームワーク既定の「コア 7 文書」（MASTER/PROJECT/ARCHITECTURE/DOMAIN/PATTERNS/TESTING/DEPLOYMENT）と意味衝突。Toolkit comment-analyzer + Copilot が独立に Critical 検出（ACE-014 / ACE-018 を補強）

#### 更新

- ACE-014: Helpful +1（PR #409 で MASTER.md 内 2 箇所の表が drift リスクを生んだため、SSOT を README に集約し片方を pointer 化。索引集約パターンの再確認）
- ACE-018: Helpful +1（PR #409 で「サブフォルダ内ファイルに番号プレフィックスを付けない」ルールを書く際、既存 6 件の違反（best-practices/0X-_, github-copilot/0X-_）を grep で検出すべきだった反省。ルール導入前の SSOT 列挙の重要性が再確認）
- ACE-019: Helpful +1（PR #409 で best-practices/0X-_, github-copilot/0X-_ を「読み順を強く示したい複数パートの分割文書」例外として明示。暗黙の policy split を Toolkit + Copilot が両方 Critical 検出）

### [1.11.0] - 2026-05-07

#### 追加

- ACE-023: ドキュメント中の事実主張（PR/Issue 番号・ハッシュ・数値）は執筆時に 1 次情報で照合する — PR #405 で「PR #311」「-1842 行」と書いた値が実態と乖離（実態: Issue #311 / commit 6ea43f8 直 commit、-1859 行）し Toolkit が Critical 検出。ACE-002 を「事実関係全般」に拡張

### [1.10.0] - 2026-05-07

#### 追加

- ACE-020: 自動コンテンツ生成ツールは自身のマーカー文字列を本文に含むドキュメントを破壊する — `obsidian-sync.mjs` が `## Linked from` を section header と誤認し OBSIDIAN_GUIDE.md を 379→26 行に破壊した再帰汚染バグから抽出
- ACE-021: テンプレ配布リポでは「リポ自身が使うインフラ」と「テンプレ利用者が受け取る成果物」を物理的に分離する — Obsidian インフラを `docs-template/` 配下に置いたことで配布物が Obsidian 前提になった構造的問題から抽出（ACE-005 を補強）
- ACE-022: 機能削除時は consumer だけでなく定数・型・ユーティリティも grep して取り残しを防ぐ — PR #403 で `BACKLINKS_SECTION_*` 定数が dead code として残存、Toolkit code-reviewer が検出（ACE-018 を補強）

### [1.9.0] - 2026-05-06

#### 追加

- ACE-018: 横断的な番号・順序変更は着手前に grep で全 SSOT を列挙する — 想定の 2〜3 倍のファイルに散らばっている
- ACE-019: 既存ルール違反になる新パターンは「例外」として明示的に名乗らせる — 暗黙の policy split は Toolkit/Copilot が Critical として検出する（ACE-012 への carve-out 整備）

### [1.8.0] - 2026-05-06

#### 追加

- ACE-015: 表を導入したら散文の主張を表に対して再読する — 「N 段階」「太字の領域」型の自己矛盾は人手レビューで見落とされる
- ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `\[text#anchor\]\(url\)` 形式は無効（ACE-013 を補強）
- ACE-017: 並列 review agent は worktree を巻き戻す副作用を持ち得る — `git status` 監視と `git restore --source=HEAD` で復旧する

### [1.7.0] - 2026-05-06

#### 追加

- ACE-012: PR マージ・push 前は必ず `git status` でブランチを確認する（develop 直 push 事故防止）
- ACE-013: 並列 reviewer の指摘は古い snapshot 由来の誤検知を含む — 実態 grep で双方向検証する
- ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない（ACE-005 を補強）

### [1.6.0] - 2026-04-30

#### 追加

- ACE-011: Prettier × markdownlint MD060 衝突は当該テーブルだけに `<!-- prettier-ignore -->` を付与する局所抑制で解く

### [1.5.0] - 2026-04-30

#### 追加

- ACE-010: Issue クローズ前は commit log でなく現在のファイル実体を grep 照合する — silent regression を検出する

### [1.4.0] - 2026-04-26

#### 追加

- ACE-007: Claude Code skill 内のツール参照は名称・subagent_type を実機 / system prompt で照合する
- ACE-008: クロスリポジトリ操作する skill は全 gh コマンドに `--repo` 必須・mention は `@<assignee>` を使う
- ACE-009: 長時間 Orchestrator の失敗の真因は upstream Issue spec 曖昧さ — 探索型 refine が必要

#### 更新

- ACE-001: Helpful +1（PR #374 で 4 reviewer が独立に Critical 検出、クロスモデルレビューの価値再確認）
- ACE-002: Helpful +1（PR #374 で `Task` ツール名 / `gh state` UPPERCASE / `gh` フラグなど実機照合の重要性が再確認）
- ACE-004: Helpful +1（PR #374 で「同じ 4 観点」主張と実装の乖離・Architectural 継続動作と Out-of-Scope の矛盾を検出）

### [1.3.0] - 2026-04-26

#### 追加

- ACE-005: 索引と実体を分離する委譲パターンでAIコンテキスト消費を抑える
- ACE-006: サンプル付きテンプレファイルには⚠️SAMPLEバナーと固有化手順を必ず併設する

### [1.2.0] - 2026-03-18

#### 追加

- ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

#### 更新

- ACE-001: Helpful +1（PR #350 でクロスモデルレビューの有効性が再確認）
- ACE-002: Helpful +1（コマンド実在確認の重要性が再確認）

### [1.1.0] - 2026-03-10

#### 追加

- ACE-001: クロスモデルレビューの検出パターン差異
- ACE-002: CLIフラグの実機確認必須ルール
- ACE-003: bash 3.2 macOS互換性の知見
- GitHub Discussion #320 にナラティブ版を投稿

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成：Playbook テンプレート、運用ルール、エントリテンプレートを定義
