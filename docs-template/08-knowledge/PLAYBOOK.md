---
title: "PLAYBOOK"
version: "1.8.0"
status: "approved"
created: "2026-03-10"
updated: "2026-05-06"
owner: "@fffokazaki"
ace_entry_count: 17
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

- 形式: `ACE-{連番3桁}` （例: `ACE-001`, `ACE-042`）
- 連番はファイル内でインクリメント（欠番許容）
- 分割後も通し番号を維持

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
### ACE-001: N+1クエリの発生パターンと防止策

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

### ACE-001: クロスモデルレビューは単一AIモデルでは検出できない問題を発見する

| フィールド | 値                |
| ---------- | ----------------- |
| Category   | process           |
| Origin     | PR #316 / PR #319 |
| Date       | 2026-03-10        |
| Helpful    | 2                 |
| Harmful    | 0                 |
| Status     | active            |

**Insight**: 異なるAIモデル（Claude/Codex/Gemini/CodeRabbit）は異なるカテゴリの問題を検出する。単一モデルのレビューでは見落とされる問題が、クロスモデルレビューで発見される。

**Context**: PR #316（ドキュメント）では Claude がnpmパッケージ名の間違いと壊れたリンク、Codex がスクリプト未実装注記の不足、Gemini Bot がパッケージスコープの間違いと無料枠数値の不一致、CodeRabbit が未実装スクリプトの注記不足を検出。PR #319（スクリプト）では Codex が CRITICAL_BLOCK 誤検出バグを発見し、Claude の pr-review-toolkit（code-reviewer + silent-failure-hunter）が stderr 握りつぶし・サイレントフォールバック・空結果の偽成功を検出。いずれも単一モデルでは検出されなかった。

**Action**: PR作成前のセルフレビューでは、`pr-review-toolkit`（Claude系サブエージェント）と `codex review --base develop`（GPT系クロスモデル）の両方を実行する。Bot系レビュー（Gemini Code Assist, CodeRabbit）がある場合はその指摘も確認する。

---

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

### ACE-014: 索引文書は SSOT を子に集約し、自身は誘導と 1 行サマリのみ — 数値の重複は持たない

| フィールド | 値                             |
| ---------- | ------------------------------ |
| Category   | architecture                   |
| Origin     | PR #391 / PR #393 / Issue #295 |
| Related    | ACE-005（補強）                |
| Date       | 2026-05-06                     |
| Helpful    | 0                              |
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

### ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `[text#anchor](url)` 形式は無効

| フィールド | 値                    |
| ---------- | --------------------- |
| Category   | documentation-quality |
| Origin     | PR #395 / Issue #296  |
| Related    | ACE-013（補強）       |
| Date       | 2026-05-06            |
| Helpful    | 0                     |
| Harmful    | 0                     |
| Status     | active                |

**Insight**: `[docs/X.md#section](../docs/X.md)` のように **anchor をラベル文字列にだけ書き、URL に書き忘れる**形式は GitHub Markdown / GFM で anchor として機能せず、リンク先のファイル冒頭にしか飛ばない。執筆時にはラベルに `#section` が含まれているのを見て「anchor 設定済み」と錯覚しやすいが、リンクとして機能するのは **URL 側の `#section` だけ**。**anchor を含む cross-doc link を書いたら、必ず URL 部分に `#anchor` がコピーされているか目視で確認する**。両方の AI reviewer（Copilot + Gemini Code Assist）が独立に同じ指摘を出した場合は高確度の anchor バグなので、即時 fix commit にまとめる。

**Context**: PR #395 で `.github/pull_request_template.md` line 15 に `詳細: [docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成](../docs/AI_GIT_WORKFLOW.md)` と書いた（ラベルに `#ステップ6-pr作成` あり、URL に欠落）。`npm run quality:local` の markdownlint / prettier / MCP check は **anchor の存在検査をしないため** sliently 通過し、PR ready 後に Copilot review と Gemini Code Assist が**独立に同じ Critical 指摘**を返した。両者とも fix suggestion で `(../docs/AI_GIT_WORKFLOW.md#ステップ6-pr作成)` を提案しており、自分でも C1 として既に Toolkit comment-analyzer 経由で検出していたため、3 経路一致で confidence 100。同 PR の `AI_SPEC_DRIVEN_DEVELOPMENT.md` 内 link `[`docs/AI_GIT_WORKFLOW.md`](AI_GIT_WORKFLOW.md)` は anchor を持たない普通の cross-doc link で問題なし、つまりラベルに anchor を書いた場合だけ起きるエラーパターン。

**Action**: cross-doc link を書く際:

1. **anchor を含む場合の必ず通る形式**: `[label](path#anchor)` または `[label#anchor](path#anchor)`（label と URL の両方に書くか、URL のみに書くか。**ラベルのみに書くのは禁止**）。
2. **PR 提出前の grep チェック**: `grep -nE "\]\(\.\./[^)]+\)" <変更ファイル>` で cross-doc link を抜き出し、ラベル側に `#` があるなら URL 側にも `#` があるか視認。CI で完全自動検出は難しいが、PR 提出前のセルフレビューで意識的に行うと catch できる。
3. **GitHub の anchor 生成規則**: `### ステップ6: PR作成` → `#ステップ6-pr作成`（ASCII を lowercase、コロン削除、空白を `-`、Unicode 文字は保持）。Japanese 見出しでも anchor は機能するが、英数字記号の正規化規則を覚えておく。
4. **複数 AI reviewer の同一指摘は最優先で fix**: Copilot + Gemini + Toolkit が独立に同じ箇所を Critical 指摘した場合、誤検知の確率は極めて低い。ACE-013 では「逆に false positive を疑う」習慣を推奨したが、**3 経路一致は true positive と判定**してよい。
5. **anchor 自動チェックの将来拡張余地**: lint レベルでは markdown-link-check や remark-validate-links のような外部ツールで cross-doc anchor を validate できる。本リポジトリの quality:local には未組込（PR #395 時点）。導入する場合は別 issue で議論。

---

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

## Changelog

### [1.8.0] - 2026-05-06

#### 追加

- ACE-015: 表を導入したら散文の主張を表に対して再読する — 「N 段階」「太字の領域」型の自己矛盾は人手レビューで見落とされる
- ACE-016: Markdown の anchor link は label と URL の両方にフラグメントを書く — `[text#anchor](url)` 形式は無効（ACE-013 を補強）
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
