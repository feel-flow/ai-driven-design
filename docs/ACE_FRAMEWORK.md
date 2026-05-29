---
id: ace-framework
title: ACE (Agentic Context Engineering) フレームワーク
version: 1.1.0
status: active
created: 2026-03-02
updated: 2026-03-13
owner: feel-flow
tags: [ace, knowledge-management, playbook, ai-driven, context-engineering]
references:
  - docs-template/08-knowledge/PLAYBOOK.md
  - docs-template/05-operations/deployment/ace-cycle.md
  - docs-template/05-operations/deployment/ace-autonomous.md
  - docs-template/05-operations/deployment/knowledge-management.md
  - docs/ACE_SETUP.md
changeImpact: high
---

# ACE (Agentic Context Engineering) フレームワーク

> **関連文書**:
>
> - [Playbook テンプレート](../docs-template/08-knowledge/PLAYBOOK.md) - ACE Playbook のテンプレートファイル
> - [ACE サイクル運用手順](../docs-template/05-operations/deployment/ace-cycle.md) - Generate → Reflect → Curate の具体手順
> - [ナレッジ管理](../docs-template/05-operations/deployment/knowledge-management.md) - GitHub Discussions ベースのナレッジ管理
> - [ACE autonomous](../docs-template/05-operations/deployment/ace-autonomous.md) - マージ後キャプチャの subagent + worktree（任意）

## 目次

1. [背景と動機](#1-背景と動機)
2. [仕様が消える2つの罠](#2-仕様が消える2つの罠)
3. [ACE の3フェーズ](#3-ace-の3フェーズ)
4. [Playbook の概念](#4-playbook-の概念)
5. [増分更新の原則](#5-増分更新の原則)
6. [AI仕様駆動開発との統合](#6-ai仕様駆動開発との統合)
7. [セットアップ](#7-セットアップ)
8. [参考文献](#8-参考文献)

---

## 1. 背景と動機

### なぜ「レポート型」ナレッジは腐るのか

従来のナレッジ管理（GitHub Discussions、Wiki、Confluence等）は **人間が読むための記録** として設計されている。この「レポート型」アプローチには構造的な限界がある：

| 問題               | 症状                           | 根本原因                                   |
| ------------------ | ------------------------------ | ------------------------------------------ |
| **書いたら終わり** | 知見が蓄積されても参照されない | AIツールが自動参照する仕組みがない         |
| **非構造化**       | 似た知見が重複・散在する       | フリーテキスト形式で機械可読性が低い       |
| **鮮度劣化**       | 古い情報が淘汰されない         | 有効性を評価するフィードバックループがない |
| **検索困難**       | 「あの知見どこだっけ？」       | タグ付け・分類が属人的で一貫性がない       |

### ACE が解決すること

ACE (Agentic Context Engineering) は、**AIエージェントが自律的にナレッジを生成・評価・更新する** フレームワークである。核心は以下の3点：

1. **構造化**: 知見を機械可読なエントリ（Playbook）として記録する
2. **フィードバックループ**: 各知見の有効性を helpful/harmful カウンターで追跡する
3. **増分更新**: 全文書き換えではなく、差分（delta）のみを追記する

これにより「書いたらAIが次回タスクで自動参照する」サイクルが成立する。

---

## 2. 仕様が消える2つの罠

### 罠1: 簡潔性バイアス（Conciseness Bias）

AIモデルは出力トークンを節約しようとする傾向がある。その結果：

- 重要な文脈や制約条件が省略される
- 「なぜそうすべきか」の理由が失われる
- 具体的なコード例やエッジケースが削られる

**例**: 「N+1クエリに注意」という知見 → AIは知っているが、**プロジェクト固有の発生パターン**（どのモデルで、どの関連で起きやすいか）を伝えなければ効果が薄い。

### 罠2: 文脈崩壊（Context Collapse）

長い会話やセッション切り替えで、それまで蓄積した文脈が失われる：

- 新しいセッションでは過去の議論を知らない
- CLAUDE.md 等に書かれていない知見は消える
- 同じ失敗を繰り返す（学習しない）

**解決策**: 知見を **セッション外に永続化** し、AIツールが参照可能なファイル（Playbook）に構造化して保存する。

---

## 3. ACE の3フェーズ

ACE サイクルは以下の3フェーズで構成される：

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Generate   │────→│   Reflect   │────→│   Curate    │
│  (知見抽出)  │     │  (評価・分類) │     │ (増分更新)   │
└─────────────┘     └─────────────┘     └─────────────┘
       ↑                                        │
       └────────────────────────────────────────┘
                   次のタスクで参照
```

### Phase 1: Generate（知見抽出）

**タイミング**: PR マージ後

**対象データ**:

- マージ済み PR の diff（コード変更の内容）
- Issue の記述（何を解決しようとしたか）
- レビューコメント（どんな指摘があったか）
- CI/CD のログ（ビルドやテストの結果）

**AIへの指示例**:

```
今回のPR #XXX のdiff、Issue内容、レビューコメントを分析し、
将来の開発で役立つ知見を抽出してください。

以下の観点で分析してください:
1. コーディングパターン: 採用した設計判断とその理由
2. テスト戦略: テストの書き方で得た教訓
3. セキュリティ: 脆弱性対策の知見
4. パフォーマンス: 最適化のヒント
5. アーキテクチャ: 構造上の決定事項
6. プロセス: ワークフロー・ツール活用の改善点
```

**出力**: 候補となる知見のリスト（まだ Playbook には書かない）

### Phase 2: Reflect（評価・分類）

生成された知見候補を、以下の基準で評価する：

#### 評価マトリクス

| 基準       | 質問                                 | 判定                      |
| ---------- | ------------------------------------ | ------------------------- |
| **汎用性** | このプロジェクト以外でも使えるか？   | 汎用的 / プロジェクト固有 |
| **再現性** | 同じ状況が再び発生する可能性は？     | 高 / 中 / 低              |
| **影響度** | 知らないとどの程度の問題が起きるか？ | 高 / 中 / 低              |
| **新規性** | 既存 Playbook にない情報か？         | 新規 / 重複 / 矛盾        |

#### 既存エントリとの照合

| 照合結果   | アクション                                   |
| ---------- | -------------------------------------------- |
| **重複**   | 既存エントリの `Helpful` カウンターを +1     |
| **矛盾**   | 既存エントリを `deprecated` → 新エントリ作成 |
| **新規**   | Phase 3 へ進む（Playbook に追記）            |
| **低価値** | 記録しない（再現性・影響度が低い）           |

### Phase 3: Curate（増分更新）

**原則**: Playbook は **末尾追記のみ**。既存エントリの書き換えは行わない。

**実行手順**:

1. エントリID を PRスコープ式（`ACE-<PR番号>-<連番>`、例 `ACE-438-1`）で採番（採番ルールは [PLAYBOOK.md §エントリID規則](../docs-template/08-knowledge/PLAYBOOK.md#エントリid規則)）
2. Playbook のエントリ一覧セクション末尾にエントリを追記
3. Frontmatter を更新（`version`, `updated`, `ace_entry_count`）
4. コミット: `knowledge: ACE-XXX [category] [summary]`

**更新の粒度**:

- 1回の ACE サイクルで追記するエントリは通常 1〜3 件
- カウンター更新（Helpful +1 等）もこのフェーズで実行

---

## 4. Playbook の概念

### Playbook とは

Playbook は **AIツールが直接参照できる構造化ナレッジベース** である。GitHub Discussions のような人間向けナラティブとは異なり、以下の特徴を持つ：

| 特徴           | Playbook                   | GitHub Discussions       |
| -------------- | -------------------------- | ------------------------ |
| **対象読者**   | AIツール（+ 人間）         | 人間                     |
| **形式**       | 構造化テーブル + 短文      | 自由記述                 |
| **更新方式**   | 末尾追記（delta）          | 自由編集                 |
| **有効性追跡** | helpful/harmful カウンター | リアクション（非構造化） |
| **検索性**     | エントリID + カテゴリ      | テキスト検索             |
| **配置**       | リポジトリ内ファイル       | GitHub プラットフォーム  |

### エントリの構造

各エントリは以下のフィールドで構成される：

```markdown
### ACE-001: [タイトル]

| フィールド | 値                                                                                    |
| ---------- | ------------------------------------------------------------------------------------- |
| Category   | coding / architecture / testing / security / performance / devops / process / tooling |
| Origin     | PR #XXX / Issue #YYY                                                                  |
| Date       | YYYY-MM-DD                                                                            |
| Helpful    | 0                                                                                     |
| Harmful    | 0                                                                                     |
| Status     | active / deprecated                                                                   |

**Insight**: [知見の本質を1-2文で]
**Context**: [発見した状況・条件]
**Action**: [推奨する具体的なアクション]
```

### helpful / harmful カウンター

- **Helpful +1**: この知見を参照した結果、問題を回避できた / 効率が上がった
- **Harmful +1**: この知見に従った結果、問題が発生した / 状況が悪化した

**運用ルール**:

- カウンターは **インクリメントのみ**（減算しない）
- `Harmful >= 3` かつ `Helpful < Harmful` の場合 → `deprecated` を検討
- `Helpful >= 5` は高品質エントリとしてマーク

---

## 5. 増分更新の原則

### なぜ「全書き換え」を禁止するのか

1. **差分の追跡性**: Git diff で「何が追加されたか」が一目でわかる
2. **コンフリクト回避**: 複数人/AIが同時に更新してもコンフリクトが起きにくい
3. **履歴の保全**: 過去のエントリが意図せず改変されるリスクを排除
4. **AI の安全性**: AIに「既存エントリを書き換えて」と指示するのは危険（意図しない改変が起きやすい）

### delta 方式のルール

| 操作                                             | 許可 | 方法                                 |
| ------------------------------------------------ | ---- | ------------------------------------ |
| エントリ追加                                     | Yes  | 末尾に追記                           |
| カウンター更新                                   | Yes  | 既存エントリの Helpful/Harmful を +1 |
| ステータス変更                                   | Yes  | active → deprecated                  |
| エントリ削除                                     | No   | deprecated にするのみ                |
| エントリ本文の書き換え（Insight/Context/Action） | No   | 新エントリとして追記                 |
| Frontmatter 更新                                 | Yes  | version, updated, ace_entry_count    |

### ファイルサイズ管理

Playbook が 800 行を超えた場合：

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

分割時の移行ルール：

1. PLAYBOOK.md から該当カテゴリのエントリをサブファイルに移動
2. PLAYBOOK.md に索引（エントリID + タイトル + 参照先）を残す
3. 新規追記は該当カテゴリのサブファイルに行う

---

## 6. AI仕様駆動開発との統合

### ワークフロー上の位置づけ

```
Issue → Branch → Commit → Self-Review → PR → Review → Merge
                                                         ↓
                                          ┌──────────────────────┐
                                          │  Knowledge Phase     │
                                          │  ┌────────────────┐  │
                                          │  │ ACE Cycle      │  │
                                          │  │ (Playbook更新)  │  │
                                          │  └────────────────┘  │
                                          │  ┌────────────────┐  │
                                          │  │ Discussions    │  │
                                          │  │ (ナラティブ記録) │  │
                                          │  └────────────────┘  │
                                          └──────────────────────┘
                                                         ↓
                                          Cleanup → Next Task
```

### 既存ナレッジ管理との使い分け

| 用途                     | ACE Playbook            | GitHub Discussions |
| ------------------------ | ----------------------- | ------------------ |
| **AIツールへの知見供給** | Primary                 | -                  |
| **人間向け詳細解説**     | -                       | Primary            |
| **検索・参照**           | エントリID検索          | テキスト検索       |
| **パターン認識**         | カテゴリ + カウンター   | タグ               |
| **新人オンボーディング** | 高Helpfulエントリの一覧 | キュレーション記事 |

### 相互参照の方法

```markdown
# Playbook → Discussions

**Context**: 詳細は GitHub Discussion #45 を参照

# Discussions → Playbook

> この知見は ACE Playbook (ACE-012) にも構造化記録済み
```

### CLAUDE.md / MASTER.md との関係

- **CLAUDE.md**: プロジェクト固有の恒久的ルール（変わりにくい）
- **MASTER.md**: 技術スタック・コーディング規約（比較的安定）
- **Playbook**: 開発プロセスで蓄積される知見（頻繁に追記）

Playbook のエントリが十分に成熟し（Helpful >= 5）、汎用的なルールとして定着した場合は、CLAUDE.md や PATTERNS.md への昇格を検討する。

---

## 7. セットアップ

ACE フレームワークをプロジェクトに導入する手順は [ACE_SETUP.md](./ACE_SETUP.md) を参照してください。

### クイックスタート

- **Claude Code**: `/ace-setup` コマンドを実行
- **GitHub Copilot / その他のAIツール**: このドキュメントの URL を渡して「ACEをセットアップしてください」と指示
- **手動**: [ACE_SETUP.md](./ACE_SETUP.md) の手順に従う

### セットアップで配置されるファイル

| ファイル                                     | 説明                                  |
| -------------------------------------------- | ------------------------------------- |
| `docs/08-knowledge/PLAYBOOK.md`              | ACE Playbook（知見の蓄積先）          |
| `docs/05-operations/deployment/ace-cycle.md` | ACEサイクル運用手順                   |
| `.claude/commands/ace-curate.md`             | Claude Code用 ACEサイクル実行コマンド |

---

## 8. 参考文献

- **Agentic Context Engineering**: AI エージェントが自律的に文脈を管理・更新する手法の総称
- **Delta Update Pattern**: データの差分のみを追記する更新パターン。ログ構造と類似
- **Playbook Pattern**: 構造化されたナレッジエントリの集合体。helpful/harmful カウンターによるフィードバックループを持つ

---

## Changelog

### [1.1.0] - 2026-03-13

#### 追加

- セクション7「セットアップ」を追加（ACE_SETUP.md へのリンクとクイックスタート）
- 参考文献をセクション8に移動

### [1.0.0] - 2026-03-02

#### 追加

- 初版作成：ACE フレームワークの概念・背景・統合ポイントを文書化
