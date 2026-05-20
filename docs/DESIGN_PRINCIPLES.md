---
id: design-principles
title: 本リポジトリの設計原則
version: 1.0.0
status: active
created: 2026-05-07
updated: 2026-05-07
owner: feel-flow
phase: extension
references:
  - docs/AI_SPEC_DRIVEN_DEVELOPMENT.md
  - docs-template/MASTER.md
  - docs-template/08-knowledge/PLAYBOOK.md
tags: [design, principles, governance]
changeImpact: high
---

# 本リポジトリの設計原則

## 目的

本ドキュメントは、本リポジトリ（`feel-flow/ai-spec-driven-development`）が **AI 仕様駆動開発のテンプレート配布リポ** として備えるべき設計上の制約を 5 原則で明文化する。

新規機能の導入・PR レビュー・リファクタリング判断のたびに参照し、**「配布境界違反」「特定ツール依存物の混入」を着手前・PR 提出前・新機能 Issue 起票時の 3 タイミングで catch する** ことを目的とする。

### 想定読者

- **リポメンテナ**: 新機能導入・撤退判断のときに本書を参照する
- **コントリビューター**: PR を出す前にチェックリストとして使う
- **AI ツール**: Issue・PR を扱うときの制約として読み込む
- **テンプレ利用者**: 自分のプロジェクトに本テンプレを取り込んだ後の運用判断にも転用できる

### 関連

- 概念解説: [AI Spec Driven Development](./AI_SPEC_DRIVEN_DEVELOPMENT.md)
- AI 向け構造化知見: [ACE-021](../docs-template/08-knowledge/PLAYBOOK.md#ace-021)
- ケーススタディの根拠: Issue #311 / commit `6ea43f8`（Obsidian 導入、PR を経ずに develop へ直 commit）/ PR #403（Obsidian 撤退）

---

## P1: URL 参照を一級市民とする

### 原則

本リポジトリは、利用者が **`git clone` せずに、GitHub の URL を AI ツール（Claude Code / GitHub Copilot / Cursor 等）に読ませる** 使い方を一級市民として扱う。

### 含意

- ドキュメントは URL 参照単独で完結する必要がある（ローカルファイルの存在を前提にしない）
- 「コピーして使う」「`/init-docs` skill で初期化」「MCP サーバーで連携」の 3 つの導入方法（README 参照）はすべて URL 参照可能性の上に成り立つ
- 配布物（`docs-template/` 配下）は静的 Markdown だけで読めること。動的生成（Obsidian backlinks、Hugo build 等）が前提のドキュメントは禁止

### 違反シグナル

- 「このファイルは XX ツールで開いてください」と書かれている
- 自動生成セクション（`<!-- AUTO-GENERATED -->` 等）が配布物に含まれる
- セットアップのために特定アプリのインストールが前提とされている

---

## P2: 配布境界マップ

### 原則

各ディレクトリは「配布対象（テンプレ利用者がコピー / 参照する成果物）」と「配布対象外（リポ自身の運用インフラ）」のいずれかに明確に属する。**両者を物理的に分離し、配布対象に運用インフラを混入させない**。

### 配布境界

| ディレクトリ             | 役割                                             | 配布対象                  |
| ------------------------ | ------------------------------------------------ | ------------------------- |
| `docs-template/`         | コア 7 文書 + 拡張構造（テンプレート本体）       | ✅ Yes                    |
| `docs-template/.github/` | 配布版 GitHub テンプレート（Issue / PR）         | ✅ Yes                    |
| `docs/`                  | 本リポ自身の解説・概念・ケーススタディ           | ❌ No                     |
| `scripts/`               | 本リポ運用ツール（spec index / レビュー連携 等） | ❌ No                     |
| `mcp/`                   | MCP サーバー実装                                 | ❌ No（外部から参照のみ） |
| `.claude/`               | 本リポの Claude Code hooks / skills              | ❌ No                     |
| `.github/`               | 本リポの GitHub 機能（Issue / PR / Actions）     | ❌ No                     |

### 含意

- `docs-template/` への変更は **テンプレ利用者の受け取り物に直接影響する**。レビューでは「テンプレ利用者は特定ツールなしでも使えるか？」を必ず問う
- リポ自身の運用に必要なインフラ（Obsidian / Notion / 特殊な lint 設定 等）は配布境界の **外** に置く
- `docs/` は本リポのメンテナンスや発信のための文書置き場であり、配布されない（テンプレ利用者には届かない）

---

## P3: 特定ツール依存物を配布対象に入れない

### 原則

Obsidian / Notion / Hugo / Jekyll 等、**特定のアプリケーションがインストール・実行されていることを前提とする設定・スクリプト・ガイド** を、配布対象（`docs-template/` 配下）に置かない。

### 例外として OK なツール

- **業界標準で十分に普及しているツール**: git, prettier, markdownlint, EditorConfig, husky 等
- **本リポが採用している AI ツール**: Claude Code（`/init-docs` などの skill）、GitHub Copilot、Cursor — ただし設定ファイルは「サンプル」として位置付け、必須ではないことを明記

### 違反シグナル

- 配布対象配下に特定アプリの設定ファイル（`.obsidian/`、`.notion/`、`hugo.toml` 等）がある
- 配布対象 Markdown が特定ツールの記法に依存している（Obsidian の `[[wikilink]]` 等）
- README やセットアップガイドで特定アプリのインストールを必須要件として記載している

### 過去の違反

- **Issue #311 / commit `6ea43f8`（2026-02-12、develop 直 commit）**: `docs-template/.obsidian/`、`docs-template/08-knowledge/OBSIDIAN_GUIDE.md`、99 ファイルへの自動 backlinks 付与等を導入 → PR #403 (2026-05-07) で撤退（コスト: 13 ファイル削除 + 8 ファイル編集、+7/-1859 行）

---

## P4: ミニマル起点 + 段階拡張

### 原則

新規プロジェクトは **コア 7 文書から始め、必要に応じて拡張する**。テンプレ利用者には最初から大量のドキュメントを押し付けない。

### コア 7 文書

`MASTER.md`、`PROJECT.md`、`ARCHITECTURE.md`、`DOMAIN.md`、`PATTERNS.md`、`TESTING.md`、`DEPLOYMENT.md`

詳細は [README.md](../README.md) と [AI_SPEC_DRIVEN_DEVELOPMENT.md](./AI_SPEC_DRIVEN_DEVELOPMENT.md) を参照。

### 含意

- 拡張ドキュメントの追加は **必要が顕在化してから** 行う。「将来必要になりそう」では追加しない
- ファイルサイズ・ファイル数の増加は AI のコンテキスト消費に直結する。文書追加 PR では「なぜいま必要か」を Issue 本文で説明する

---

## P5: 撤退コスト試算

### 原則

新機能・新ツール・新インフラの導入 Issue では、**「採用しないことになった場合に削除対象となるファイル・コード・ドキュメントの概数」を着手前に見積もる**。

### 試算項目

| 項目                 | 内容                                             |
| -------------------- | ------------------------------------------------ |
| 新規ファイル数       | この機能のためだけに作る予定のファイル数         |
| 編集ファイル数       | 既存ファイルへの追記・参照追加が必要なファイル数 |
| 専用 constants/types | 機能専用に作る予定の定数・型定義の有無           |
| 配布対象への影響     | `docs-template/` 配下に何ファイル混入する想定か  |
| 撤退判断の閾値       | どの観測値が出たら撤退するか（事前に決める）     |

### 含意

- 撤退コスト > 採用メリット × 期待値 と判断したら **採用しない**
- 撤退コストが大きすぎる導入は、配布境界の **外** で先に試行する（メンテナの個人運用としてのみ採用）
- 採用後も撤退判断のしきい値（例: 「2 週間以内に重大バグが N 件出たら撤退」）を Issue に書いておく

### 過去のケース

- **Obsidian 統合（Issue #311 / commit `6ea43f8` → PR #403）**: 試算なしで導入（さらに PR を経ずに develop 直 commit でガードレールが効かなかった）→ 3 ヶ月後に 13 ファイル削除 + 8 ファイル編集の撤退コストが顕在化。導入時に試算 + PR 経由のレビューがあれば、`docs-template/` 外でメンテナ個人運用にとどめる選択肢を取れた可能性がある

---

## ケーススタディ: Obsidian 統合の撤退（PR #403）

### 何が起きたか

- 2026-02-12: Issue #311 / commit `6ea43f8` で Obsidian 統合を `docs-template/.obsidian/`、`OBSIDIAN_GUIDE.md`、`mcp/src/obsidian/`、`scripts/obsidian-sync.mjs`、99 ファイルへの自動 backlinks セクション付与等として導入（**PR を経ずに develop へ直 commit**、レビューゲートが効かない経路で入った）
- 2026-05-07: `obsidian-sync.mjs` の自己破壊バグ（自身のマーカー文字列を本文に書いたドキュメントを破壊する再帰汚染、ACE-020 参照）と post-merge フックの暴走（Issue #401）が顕在化
- 2026-05-07: PR #403 で完全撤退（コスト: 13 ファイル削除 + 8 ファイル編集、+7/-1859 行）

### どの原則に違反したか

- **P2 違反**: Obsidian インフラを配布対象（`docs-template/`）に置いた
- **P3 違反**: 特定アプリ（Obsidian）依存の設定・スクリプト・ガイドを配布対象に入れた
- **P5 違反**: 撤退コスト試算なしで導入した

### 学び

- 配布境界マップが文書化されていなかったことが構造的な原因（本書はこの欠落を埋める目的で作成された）
- 自動生成ツールは「特定ツール依存物」の典型例である（P3）
- 撤退コスト試算は「導入してから 2 週間評価」より早期に撤退判断を可能にする（P5）

詳細な再発防止知見: [ACE-020](../docs-template/08-knowledge/PLAYBOOK.md#ace-020) / [ACE-021](../docs-template/08-knowledge/PLAYBOOK.md#ace-021) / [ACE-022](../docs-template/08-knowledge/PLAYBOOK.md#ace-022)

---

## ガードレール

3 タイミングで設計原則違反を catch する仕組みを持つ:

| タイミング          | ガードレール                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 新機能 Issue 起票時 | [Issue テンプレ feature.md](../.github/ISSUE_TEMPLATE/feature.md) / [infra.md](../.github/ISSUE_TEMPLATE/infra.md) の「撤退コスト試算」項目 |
| PR 提出時           | [PR テンプレ](../.github/pull_request_template.md) の「配布境界チェック」項目                                                               |
| マージ後の知見蓄積  | [ACE-020][] / [ACE-021][] / [ACE-022][]（順に: 自動生成ツールの自己破壊 / テンプレ配布リポ分離 / 削除時の取り残しチェック）                 |

[ACE-020]: ../docs-template/08-knowledge/PLAYBOOK.md#ace-020
[ACE-021]: ../docs-template/08-knowledge/PLAYBOOK.md#ace-021
[ACE-022]: ../docs-template/08-knowledge/PLAYBOOK.md#ace-022

## 改訂履歴

### 1.0.0 - 2026-05-07

- 初版作成。Obsidian 撤退（PR #403）の構造的原因分析から 5 原則を抽出（Issue #404）
