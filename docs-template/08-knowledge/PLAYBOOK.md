---
title: "PLAYBOOK"
version: "1.2.0"
status: "approved"
created: "2026-03-10"
updated: "2026-03-18"
owner: "@fffokazaki"
ace_entry_count: 4
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

| ルール | 説明 |
|--------|------|
| **末尾追記のみ** | エントリは常にファイル末尾に追記。既存エントリの本文（Insight/Context/Action）書き換えは禁止。カウンター更新・Status変更は許可 |
| **カウンターはインクリメントのみ** | Helpful/Harmful は +1 のみ。減算・リセットはしない |
| **削除禁止** | エントリを物理的に削除しない。不要な場合は `Status: deprecated` に変更 |
| **800行超過時は分割** | `playbook/` サブディレクトリにカテゴリ別ファイルとして分割 |
| **Frontmatter更新** | エントリ追加時に `version`, `updated`, `ace_entry_count` を更新 |
| **コミット規則** | `knowledge: ACE-XXX [category] [summary]` 形式で記録 |

### エントリID規則

- 形式: `ACE-{連番3桁}` （例: `ACE-001`, `ACE-042`）
- 連番はファイル内でインクリメント（欠番許容）
- 分割後も通し番号を維持

---

## カテゴリ一覧

| カテゴリ | 説明 | 例 |
|---------|------|----|
| `coding` | コーディングパターン、言語固有のベストプラクティス | 型安全性、エラーハンドリング |
| `architecture` | 設計判断、構造上の決定事項 | レイヤー設計、モジュール分割 |
| `testing` | テスト戦略、テストパターン | モック設計、テストデータ管理 |
| `security` | セキュリティ対策、脆弱性防止 | 認証、暗号化、入力検証 |
| `performance` | パフォーマンス最適化 | キャッシュ、クエリ最適化 |
| `devops` | CI/CD、デプロイ、環境構築 | パイプライン、インフラ設定 |
| `process` | 開発プロセス、ワークフロー改善 | レビュー手法、タスク管理 |
| `tooling` | ツール設定、開発環境 | IDE設定、リンター、フォーマッター |

---

## ステータス定義

| ステータス | 説明 | 遷移条件 |
|-----------|------|----------|
| `active` | 有効な知見 | 新規作成時のデフォルト |
| `deprecated` | 非推奨（古い情報、矛盾が発見された等） | Harmful >= 3 かつ Helpful < Harmful、または明示的な判断 |

---

## エントリテンプレート

新しいエントリを追記する際は、以下のテンプレートを使用してください：

```markdown
### ACE-XXX: [タイトル（簡潔で検索しやすい表現）]

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

**Action**: [推奨する具体的なアクション。可能であればコード例も含める]
```

### 記述ガイドライン

- **Insight**: 「何を学んだか」を簡潔に。1-2文。
- **Context**: 「どんな状況で発見したか」を記述。再現条件が明確であるほど価値が高い。
- **Action**: 「次回何をすべきか」を具体的に。コード例があると AIツールが直接適用しやすい。

---

## Helpful / Harmful カウンター運用

### カウンター更新タイミング

| タイミング | 更新内容 |
|-----------|---------|
| ACE サイクルで既存エントリと重複する知見を発見 | Helpful +1 |
| 既存エントリの知見に従って問題を回避できた | Helpful +1 |
| 既存エントリの知見に従ったが問題が発生した | Harmful +1 |
| 既存エントリの内容が古くなっていると判明 | 検討の上 deprecated |

### エントリ品質の目安

| カウンター状態 | 解釈 |
|---------------|------|
| `Helpful >= 5` | 高品質エントリ。PATTERNS.md への昇格を検討 |
| `Helpful >= 3, Harmful == 0` | 良質なエントリ |
| `Harmful >= 3, Helpful < Harmful` | deprecated 候補 |
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

| フィールド | 値 |
|-----------|---|
| Category | process |
| Origin | PR #316 / PR #319 |
| Date | 2026-03-10 |
| Helpful | 1 |
| Harmful | 0 |
| Status | active |

**Insight**: 異なるAIモデル（Claude/Codex/Gemini/CodeRabbit）は異なるカテゴリの問題を検出する。単一モデルのレビューでは見落とされる問題が、クロスモデルレビューで発見される。

**Context**: PR #316（ドキュメント）では Claude がnpmパッケージ名の間違いと壊れたリンク、Codex がスクリプト未実装注記の不足、Gemini Bot がパッケージスコープの間違いと無料枠数値の不一致、CodeRabbit が未実装スクリプトの注記不足を検出。PR #319（スクリプト）では Codex が CRITICAL_BLOCK 誤検出バグを発見し、Claude の pr-review-toolkit（code-reviewer + silent-failure-hunter）が stderr 握りつぶし・サイレントフォールバック・空結果の偽成功を検出。いずれも単一モデルでは検出されなかった。

**Action**: PR作成前のセルフレビューでは、`pr-review-toolkit`（Claude系サブエージェント）と `codex review --base develop`（GPT系クロスモデル）の両方を実行する。Bot系レビュー（Gemini Code Assist, CodeRabbit）がある場合はその指摘も確認する。

---

### ACE-002: CLIフラグは実機の --help 出力と照合が必須

| フィールド | 値 |
|-----------|---|
| Category | tooling |
| Origin | PR #316 / Issue #315 |
| Date | 2026-03-10 |
| Helpful | 1 |
| Harmful | 0 |
| Status | active |

**Insight**: Web検索やAI生成の情報だけでは CLI フラグの正確性は保証されない。`codex -p` は存在せず `codex exec` が正解、Copilot `-s` は sandbox ではなく `--silent`、Cursor `-p` は boolean フラグでプロンプトは positional 引数など、実機確認しなければ分からない差異が多い。

**Context**: Multi-CLI Review ドキュメント作成時に5つのAI CLIのフラグを調査。Web検索とAI生成の情報を信じてドキュメント化したが、セルフレビューと実機テストで複数の誤りが発覚。特に Codex CLI は `-p` フラグが存在しないにもかかわらず、Web上の古い情報では `-p` が使われていた。

**Action**: CLI ツールのフラグを記述する際は、(1) `command --help` で実機確認、(2) 公式リポジトリの README/docs と照合、(3) 可能なら `--dry-run` 等で動作確認、の3ステップを必ず実施する。

---

### ACE-003: bash スクリプトは macOS デフォルト環境（bash 3.2）でテストする

| フィールド | 値 |
|-----------|---|
| Category | devops |
| Origin | PR #319 / Issue #317 |
| Date | 2026-03-10 |
| Helpful | 0 |
| Harmful | 0 |
| Status | active |

**Insight**: macOS のデフォルト bash は 3.2（bash 4.0+ が GPLv3 に移行したため Apple が更新を停止）であり、`declare -A`（連想配列）、`head -n -1`（GNU拡張）、`timeout` コマンドなどが使えない。CI環境（Linux, bash 5.x）では動くが macOS では動かないスクリプトが生まれやすい。

**Context**: `multi-review.sh` を連想配列ベースで実装したところ、macOS の bash 3.2 で `declare -A: invalid option` エラーが発生。関数ベースのルックアップに書き直し、`head -n -1` を `sed` に変更、`timeout` を kill ベースフォールバックに変更して解決。

**Action**: bash スクリプトの移植性を確保するには、(1) 連想配列の代わりに case 文/関数ルックアップを使用、(2) GNU 拡張コマンドには POSIX 互換フォールバックを用意、(3) macOS のデフォルト環境で `--dry-run` テストを実施する。shebang は `#!/usr/bin/env bash` のまま、bash 3.2+ 互換コードを書く。

---

### ACE-004: ドキュメントの動作説明は実装メカニズムと一致させる

| フィールド | 値 |
|-----------|---|
| Category | process |
| Origin | PR #350 |
| Date | 2026-03-18 |
| Helpful | 0 |
| Harmful | 0 |
| Status | active |

**Insight**: ドキュメントに「自動実行」と記載したが、実際にはCLAUDE.mdの指示に基づいてAIツールが順次実行する仕組みだった。「自動」「手動」「並列」「順次」等の動作表現が実装メカニズムと乖離すると、読者（人間・AI両方）が誤った前提で行動し、トラブルシューティング時に混乱する。

**Context**: PR #350 のレビューでCodeRabbitが「自動実行」表現と`execute_tasks()`の実装（事前計画の一括/順次実行）の不一致を指摘。また`npm run code-review:codex`が`package.json`に未定義であることも発覚。ドキュメント作成時に「こうなるべき」を「こうなっている」として記述してしまうパターン。

**Action**: ドキュメントに動作説明を書く際は、(1) 実装コード/設定ファイルで実際の動作を確認、(2) 記載するコマンドは実在を検証（`package.json`のscripts、`--help`出力等）、(3) 「自動」「手動」等の表現は実装メカニズムに基づいて正確に選択する。

---

## Changelog

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
