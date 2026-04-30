---
id: operational-guide
title: AI Spec Driven Development Operational Guide
version: 2.0.0
status: active
created: 2025-10-17
updated: 2025-11-07
owner: feel-flow
phase: mvp
tags: [docs, structure, ai-agent, operations]
references:
  - docs-template/MASTER.md
  - docs-template/02-design/ARCHITECTURE.md
  - AI_SPEC_DRIVEN_DEVELOPMENT.md
changeImpact: high
---

# AI Spec Driven Development ドキュメント運用ガイド

この文書は「AIエージェントが迷わない最小・高精度なドキュメント構造」を保証するための操作仕様書です。`docs-template/MASTER.md` を上位規約 (Source of Truth) とし、本書はその実務ガイドライン層に位置します。フォルダ生成、ファイル分類、更新、監査をすべて自動化しやすくするための厳密なルールを定義します。

> **関連文書**:
>
> - [AI Spec Driven Development 概念と実践](AI_SPEC_DRIVEN_DEVELOPMENT.md) - AI駆動開発の理論と実践方法
> - [MASTER.md](../docs-template/MASTER.md) - プロジェクトの中央管理文書

## 目次

- [AI Spec Driven Development ドキュメント運用ガイド](#ai-spec-driven-development-ドキュメント運用ガイド)
  - [目次](#目次)
  - [1. PURPOSE / SCOPE](#1-purpose--scope)
  - [2. WORKFLOW (起動～更新ライフサイクル)](#2-workflow-起動更新ライフサイクル)
  - [3. FOLDER SPEC (必須構造と責務)](#3-folder-spec-必須構造と責務)
  - [4. REQUIRED MINIMUM FILE SET](#4-required-minimum-file-set)
  - [5. FILE CLASSIFICATION MATRIX](#5-file-classification-matrix)
  - [6. NAMING \& VERSIONING RULES](#6-naming--versioning-rules)
    - [ファイル命名規則](#ファイル命名規則)
    - [フォルダ命名規則](#フォルダ命名規則)
    - [バージョニング](#バージョニング)
  - [7. FRONTMATTER TEMPLATE（統一メタデータ）](#7-frontmatter-template統一メタデータ)
  - [8. UPDATE / CHANGE POLICY](#8-update--change-policy)
  - [9. EXTENSION \& SCALING POLICY](#9-extension--scaling-policy)
    - [Phase 1: MVP (コア7文書 — 最小構成)](#phase-1-mvp-コア7文書--最小構成)
    - [Phase 2: Extension (推奨追加)](#phase-2-extension-推奨追加)
    - [Phase 3: Optimization (必要に応じて)](#phase-3-optimization-必要に応じて)
  - [10. AI AGENT EXECUTION CHECKLIST](#10-ai-agent-execution-checklist)
    - [BEFORE (作業開始前)](#before-作業開始前)
    - [DURING (作業中)](#during-作業中)
    - [AFTER (作業完了後)](#after-作業完了後)
  - [11. DO / DO NOT LIST](#11-do--do-not-list)
    - [DO (推奨事項)](#do-推奨事項)
    - [DO NOT (禁止事項)](#do-not-禁止事項)
  - [12. ERROR HANDLING / RECOVERY](#12-error-handling--recovery)
  - [13. DECISION MATRIX 詳細](#13-decision-matrix-詳細)
  - [14. REVISION HISTORY ルール](#14-revision-history-ルール)
  - [15. GLOSSARY / LINKING 指針](#15-glossary--linking-指針)
    - [用語参照形式](#用語参照形式)
    - [新語追加条件](#新語追加条件)
    - [定義フォーマット](#定義フォーマット)
  - [16. DIFF IMPACT LEVELS \& CHANGELOG 連携](#16-diff-impact-levels--changelog-連携)
    - [Impact レベルの判断基準](#impact-レベルの判断基準)
    - [CHANGELOG 記載形式](#changelog-記載形式)
  - [17. ONBOARDING QUICK START (人間 + AI)](#17-onboarding-quick-start-人間--ai)
    - [📚 5分で理解](#-5分で理解)
    - [📚 15分で深堀り](#-15分で深堀り)
    - [📚 10分で実践準備](#-10分で実践準備)
    - [📚 5分で疑問解消](#-5分で疑問解消)
    - [AIエージェント向けの追加ステップ](#aiエージェント向けの追加ステップ)
  - [18. FUTURE EVOLUTION NOTES](#18-future-evolution-notes)
    - [コンテキストウィンドウ拡張時 (≥1M tokens)](#コンテキストウィンドウ拡張時-1m-tokens)
    - [AI能力向上時](#ai能力向上時)
    - [チーム規模拡大時](#チーム規模拡大時)
  - [19. 最終チェックリスト (Committed 前に PASS 必須)](#19-最終チェックリスト-committed-前に-pass-必須)
  - [MUST 命令 (AIエージェント向け抜粋)](#must-命令-aiエージェント向け抜粋)
  - [Revision History](#revision-history)
  - [付録: 参考ファイル索引 (Cross-Reference)](#付録-参考ファイル索引-cross-reference)

---

## 1. PURPOSE / SCOPE

AIモデル (Claude Code / GitHub Copilot / Cursor など) が以下を行う際の唯一の運用仕様:

1. 初回接続時のフォルダ完全性検証と自動補修
2. 新規コンテンツの正確な分類と重複排除
3. 最小文書セット維持と段階的拡張
4. 更新時の影響度評価と CHANGELOG 連携

本書は「構造と運用」に限定し、技術スタック/設計/ビジネス要件は `MASTER.md` / `PROJECT.md` / `ARCHITECTURE.md` / `DOMAIN.md` に委譲します。

---

## 2. WORKFLOW (起動～更新ライフサイクル)

起動時 → 分類時 → 変更時 → 終了時 の4ステージ。

**起動時**:

1. MASTER.md を読み込み
2. フォルダ構造を検証
3. 必須ファイルの存在確認

**分類時**:

1. DECISION MATRIX を適用
2. 重複コンテンツを検出
3. 適切なファイルに振り分け

**変更時**:

1. 差分を解析
2. impact レベルを決定
3. version を更新
4. CHANGELOG を更新 (impact=high の場合)

**終了時**:

1. 参照リンクを検証
2. Revision History を更新
3. 最終チェックリストを実行

<!-- Legacy narrative (v1.x article style) removed in v2.0.0 to keep file focused on operational specification. Full historical content remains in git history if needed. -->

---

## 3. FOLDER SPEC (必須構造と責務)

番号付きフォルダ構造:

```
docs-template/
├── MASTER.md                          # 中央管理文書
├── 01-context/                        # ビジネスコンテキスト
│   ├── PROJECT.md                     # プロジェクト概要
│   └── CONSTRAINTS.md                 # 制約事項
├── 02-design/                         # 設計文書
│   ├── ARCHITECTURE.md                # システム設計
│   ├── DOMAIN.md                      # ドメインモデル
│   ├── API.md                         # API仕様
│   └── DATABASE.md                    # データベース設計
├── 03-implementation/                 # 実装ガイド
│   ├── PATTERNS.md                    # 実装パターン
│   ├── CONVENTIONS.md                 # コーディング規約
│   └── INTEGRATIONS.md                # 外部連携
├── 04-quality/                        # 品質保証
│   ├── TESTING.md                     # テスト戦略
│   └── VALIDATION.md                  # 検証方法
├── 05-operations/                     # 運用
│   ├── DEPLOYMENT.md                  # デプロイ手順
│   └── MONITORING.md                  # 監視設定
├── 06-reference/                      # 参照情報
│   ├── GLOSSARY.md                    # 用語集
│   └── DECISIONS.md                   # 設計判断記録
├── 07-project-management/             # プロジェクト管理
│   ├── ROADMAP.md                     # ロードマップ
│   ├── TASKS.md                       # タスク管理
│   └── RISKS.md                       # リスク管理
└── 08-knowledge/                      # ナレッジベース
    ├── BEST_PRACTICES.md              # ベストプラクティス
    ├── FAQ.md                         # よくある質問
    ├── LESSONS_LEARNED.md             # 学んだ教訓
    └── TROUBLESHOOTING.md             # トラブルシューティング
```

**各フォルダの責務**:

| フォルダ              | 責務                         | 必須ファイル               |
| --------------------- | ---------------------------- | -------------------------- |
| 01-context            | ビジネス価値、要件、制約     | PROJECT.md                 |
| 02-design             | システム設計、ドメインモデル | ARCHITECTURE.md, DOMAIN.md |
| 03-implementation     | 実装パターン、規約           | PATTERNS.md                |
| 04-quality            | テスト戦略、品質基準         | TESTING.md                 |
| 05-operations         | デプロイ、監視、運用         | DEPLOYMENT.md              |
| 06-reference          | 用語集、設計判断記録         | GLOSSARY.md, DECISIONS.md  |
| 07-project-management | 計画、進捗、リスク           | ROADMAP.md, TASKS.md       |
| 08-knowledge          | ナレッジ、FAQ、教訓          | FAQ.md, BEST_PRACTICES.md  |

---

## 4. REQUIRED MINIMUM FILE SET

**コア7文書** (Phase 1: 最小構成):

- `MASTER.md` - 中央管理文書
- `01-context/PROJECT.md` - プロジェクト概要
- `02-design/ARCHITECTURE.md` - システム設計
- `02-design/DOMAIN.md` - ドメインモデル
- `03-implementation/PATTERNS.md` - 実装パターン
- `04-quality/TESTING.md` - テスト戦略
- `05-operations/DEPLOYMENT.md` - デプロイ手順

**推奨追加文書** (Phase 2以降):

- `06-reference/GLOSSARY.md` - 用語集
- `06-reference/DECISIONS.md` - 設計判断記録
- `08-knowledge/FAQ.md` - よくある質問
- `08-knowledge/BEST_PRACTICES.md` - ベストプラクティス

---

## 5. FILE CLASSIFICATION MATRIX

新規コンテンツの分類フローチャート:

```
質問: このコンテンツは何について記述していますか?

1. ビジネス価値/背景/要件か?
   YES → 01-context/PROJECT.md or CONSTRAINTS.md
   NO  → 次へ

2. システム設計/アーキテクチャか?
   YES → 02-design/ARCHITECTURE.md or DOMAIN.md or API.md
   NO  → 次へ

3. 実装方法/コーディング規約か?
   YES → 03-implementation/PATTERNS.md or CONVENTIONS.md
   NO  → 次へ

4. テスト/品質保証か?
   YES → 04-quality/TESTING.md or VALIDATION.md
   NO  → 次へ

5. デプロイ/運用/監視か?
   YES → 05-operations/DEPLOYMENT.md or MONITORING.md
   NO  → 次へ

6. 用語定義/設計判断記録か?
   YES → 06-reference/GLOSSARY.md or DECISIONS.md
   NO  → 次へ

7. 計画/進捗/リスク管理か?
   YES → 07-project-management/ROADMAP.md or TASKS.md or RISKS.md
   NO  → 次へ

8. ナレッジ共有/FAQ/教訓か?
   YES → 08-knowledge/FAQ.md or BEST_PRACTICES.md or LESSONS_LEARNED.md
   NO  → コンテンツを再評価、または新規カテゴリ検討
```

**重要**: すべての質問にNOの場合、コンテンツの再構造化または既存ファイルへの統合を検討してください。新規ファイル作成は最小限に抑えます。

---

## 6. NAMING & VERSIONING RULES

### ファイル命名規則

- **形式**: `UPPER_SNAKE_CASE.md`
- **例**: `PROJECT.md`, `BEST_PRACTICES.md`, `API.md`
- **禁止**: kebab-case, camelCase, PascalCase

### フォルダ命名規則

- **形式**: `NN-kebab-case/` (NNは2桁数字)
- **例**: `01-context/`, `08-knowledge/`
- **禁止**: 数字なしフォルダ、3桁以上の数字

### バージョニング

- **形式**: セマンティックバージョニング (major.minor.patch)
- **major**: 破壊的変更 (既存概念の再定義、削除)
- **minor**: 機能追加 (新セクション、新ファイル)
- **patch**: バグ修正、誤字修正、リファクタリング

**例**:

- `1.0.0` → `2.0.0`: ARCHITECTURE.md の設計思想を全面変更
- `1.0.0` → `1.1.0`: PATTERNS.md に新しいパターンを追加
- `1.0.0` → `1.0.1`: PROJECT.md の誤字を修正

---

## 7. FRONTMATTER TEMPLATE（統一メタデータ）

すべてのMarkdownファイルは、以下のFrontmatterを含む必要があります:

```yaml
---
id: unique-identifier # ファイルの一意識別子 (kebab-case)
title: Human-readable Title # 人間が読める形式のタイトル
version: 1.0.0 # セマンティックバージョニング
status: draft | active | deprecated # 文書の状態
created: YYYY-MM-DD # 作成日
updated: YYYY-MM-DD # 最終更新日
owner: team-name # 責任者/チーム名
phase: planning | mvp | extension | optimization # プロジェクトフェーズ
tags: [tag1, tag2, tag3] # タグ (カテゴリ、技術など)
references: # 参照先文書
  - docs-template/MASTER.md
  - path/to/related/file.md
changeImpact: low | medium | high # 変更の影響度
---
```

**各フィールドの説明**:

| フィールド   | 必須 | 説明                                      | 例                          |
| ------------ | ---- | ----------------------------------------- | --------------------------- |
| id           | ✅   | ファイルの一意識別子                      | `project-overview`          |
| title        | ✅   | 人間が読める形式のタイトル                | `Project Overview`          |
| version      | ✅   | セマンティックバージョニング              | `1.2.3`                     |
| status       | ✅   | draft / active / deprecated               | `active`                    |
| created      | ✅   | 作成日 (YYYY-MM-DD)                       | `2025-01-01`                |
| updated      | ✅   | 最終更新日 (YYYY-MM-DD)                   | `2025-11-07`                |
| owner        | ✅   | 責任者/チーム名                           | `platform-team`             |
| phase        | ✅   | planning / mvp / extension / optimization | `mvp`                       |
| tags         | ⭕   | タグのリスト                              | `[frontend, react, ui]`     |
| references   | ⭕   | 参照先文書のリスト                        | `- docs-template/MASTER.md` |
| changeImpact | ✅   | low / medium / high                       | `high`                      |

**changeImpact の判断基準**:

- `high`: 既存概念の再定義、削除、破壊的変更 → **CHANGELOG 記載必須**
- `medium`: 新セクション追加、非破壊的な機能追加
- `low`: 誤字修正、整形、コメント追加

---

## 8. UPDATE / CHANGE POLICY

文書更新時の手順:

1. **差分解析**:
   - 追加/変更/削除された行数を計測
   - 変更されたセクションの種別を特定

2. **impact レベル決定**:
   - `low`: 誤字修正、整形、コメント追加
   - `medium`: 新セクション追加、非破壊的な機能追加
   - `high`: 既存概念の再定義、削除、破壊的変更

3. **version bump**:
   - `low` → patch 更新 (1.0.0 → 1.0.1)
   - `medium` → minor 更新 (1.0.0 → 1.1.0)
   - `high` → major 更新 (1.0.0 → 2.0.0)

4. **CHANGELOG 更新** (`high` のみ必須):
   - `docs: <FileName> <summary>` の形式で記載
   - 例: `docs: ARCHITECTURE.md Migrated to microservices architecture`

5. **リンク整合性チェック**:
   - 参照先ファイルの存在確認
   - アンカーリンクの有効性確認

6. **Glossary 同期** (新語追加時):
   - 新しい用語を `06-reference/GLOSSARY.md` に追加
   - 用語の定義、英訳、使用例を記載

---

## 9. EXTENSION & SCALING POLICY

プロジェクトフェーズに応じた文書の拡張ポリシー:

### Phase 1: MVP (コア7文書 — 最小構成)

- MASTER.md
- PROJECT.md
- ARCHITECTURE.md
- DOMAIN.md
- PATTERNS.md
- TESTING.md
- DEPLOYMENT.md

### Phase 2: Extension (推奨追加)

- GLOSSARY.md - 用語が増えてきた場合
- DECISIONS.md - 重要な設計判断を記録
- FAQ.md - よくある質問が蓄積されてきた場合
- API.md - API仕様が複雑になった場合
- DATABASE.md - データベース設計が複雑化した場合

### Phase 3: Optimization (必要に応じて)

- VALIDATION.md - パフォーマンス計測詳細
- MONITORING.md - 監視/アラート仕様の強化
- CONVENTIONS.md - コーディング規約の詳細化
- INTEGRATIONS.md - 外部サービス連携の増加

**拡張の原則**:

1. **必要性の検証**: 既存ファイルへの追記で十分か検討
2. **2000行ルール**: 既存ファイルが2000行を超えた場合のみ分割を検討
3. **単一責務**: 新規ファイルは明確な単一責務を持つこと
4. **重複排除**: 同じ情報を複数箇所に記載しない

**Phase 移行時の例**:

- Optimization でパフォーマンス計測詳細 → `04-quality/VALIDATION.md` or 新 `PERFORMANCE.md` (条件を満たす場合のみ)
- 新規観測/アラート仕様強化 → `05-operations/MONITORING.md` 拡張
- 大幅なドメイン拡張 → `DOMAIN.md` Append (分割は 2000 行超え時に検討)

---

## 10. AI AGENT EXECUTION CHECKLIST

### BEFORE (作業開始前)

- [ ] MASTER.md 読了宣言
- [ ] フォルダ 01～08 完全性検証 / 自動補修
- [ ] 必須ファイル存在確認 (REQUIRED MINIMUM FILE SET)
- [ ] Frontmatter の構文チェック

### DURING (作業中)

- [ ] 分類マトリクス適用 (FILE CLASSIFICATION MATRIX)
- [ ] 重複語彙検出 (Glossary との照合)
- [ ] Frontmatter 挿入 / 更新
- [ ] changeImpact レベルの決定

### AFTER (作業完了後)

- [ ] 参照リンク検証 (リンク切れチェック)
- [ ] impact=high → CHANGELOG 更新
- [ ] Revision History 行追加
- [ ] version bump (セマンティックバージョニング)
- [ ] 最終チェックリスト実行

---

## 11. DO / DO NOT LIST

### DO (推奨事項)

- ✅ 数値プリフィックス維持 (01-, 02-, ...)
- ✅ 単一責務ファイル化 (1ファイル1テーマ)
- ✅ 冪等処理 (再実行で副作用なし)
- ✅ Glossary 統合による語彙一貫性
- ✅ MASTER.md を常に参照
- ✅ changeImpact=high の場合は CHANGELOG 更新
- ✅ Frontmatter の必須フィールドをすべて記入

### DO NOT (禁止事項)

- ❌ 無番号フォルダ新設
- ❌ 重複概念ファイル生成
- ❌ Draft 30日放置 (deprecated へ提案)
- ❌ 未分類コンテンツ直置き
- ❌ マジックナンバー/ハードコード値
- ❌ `any` 型の使用 (TypeScript)
- ❌ console.log の production コード使用
- ❌ 参照リンクの検証なしでコミット

---

## 12. ERROR HANDLING / RECOVERY

AIエージェントがエラーに遭遇した場合の対応方針:

| ケース           | アクション              | 結果コメント                 | 重要度    |
| ---------------- | ----------------------- | ---------------------------- | --------- |
| フォルダ欠損     | 自動生成                | "AUTO CREATED <timestamp>"   | ⚠️ Medium |
| 必須ファイル欠損 | 雛形作成                | "AUTO GENERATED <timestamp>" | ⚠️ Medium |
| 重複主題検出     | 統合提案/中断           | "DUPLICATE SUBJECT"          | 🚨 High   |
| 命名規約違反     | リネーム試行→失敗で中断 | "INVALID NAME"               | ⚠️ Medium |
| Frontmatter欠落  | 自動挿入                | "FRONTMATTER INJECTED"       | ⚠️ Medium |
| リンク切れ検出   | 警告表示/修正提案       | "BROKEN LINK DETECTED"       | ⚠️ Medium |
| 重複語彙検出     | Glossary への統合提案   | "DUPLICATE TERM"             | ℹ️ Low    |
| バージョン不整合 | version bump 提案       | "VERSION MISMATCH"           | ⚠️ Medium |

**重大失敗時の対応** (構造整合不可):

1. 詳細なエラーレポート出力
2. 処理を停止
3. 人間の介入を要求
4. ロールバック手順を提示

---

## 13. DECISION MATRIX 詳細

新規コンテンツの分類時に使用する意思決定マトリクス:

| 質問                 | YES →                    | NO →   |
| -------------------- | ------------------------ | ------ |
| ビジネス価値/背景か? | `01-context/`            | 次へ   |
| 設計/構造か?         | `02-design/`             | 次へ   |
| 実装規約/手法か?     | `03-implementation/`     | 次へ   |
| 品質保証か?          | `04-quality/`            | 次へ   |
| 運用/監視か?         | `05-operations/`         | 次へ   |
| 決定記録/用語か?     | `06-reference/`          | 次へ   |
| 計画/進捗/リスクか?  | `07-project-management/` | 次へ   |
| ナレッジ共有/FAQか?  | `08-knowledge/`          | 再評価 |

**最終行まで NO の場合**:

1. コンテンツの再構造化を要求
2. 既存ファイルへの統合を検討
3. 新規ファイル作成を拒否
4. 人間の判断を求める

**分類の優先順位**:

1. **ビジネス価値** (01-context) - なぜこれを作るのか?
2. **設計** (02-design) - どう作るのか?
3. **実装** (03-implementation) - どうコーディングするのか?
4. **品質** (04-quality) - どうテストするのか?
5. **運用** (05-operations) - どうデプロイ/監視するのか?
6. **参照** (06-reference) - 用語や決定の記録
7. **管理** (07-project-management) - 計画と進捗
8. **ナレッジ** (08-knowledge) - 学びと共有

---

## 14. REVISION HISTORY ルール

各ファイル末尾に `Revision History` セクションを配置し、更新ごとに1行追加します。

**形式**:

```markdown
## Revision History

| Date       | Author | Version | Impact | Summary        |
| ---------- | ------ | ------- | ------ | -------------- |
| YYYY-MM-DD | name   | x.y.z   | level  | 変更内容の要約 |
```

**例**:

```markdown
## Revision History

| Date       | Author  | Version | Impact | Summary                    |
| ---------- | ------- | ------- | ------ | -------------------------- |
| 2025-10-17 | agent   | 2.0.0   | high   | Rebuilt structure spec     |
| 2025-11-07 | futoshi | 2.1.0   | medium | Added new patterns section |
| 2025-11-08 | agent   | 2.1.1   | low    | Fixed typos in GLOSSARY    |
```

**ルール**:

- 新しい更新は表の**最後**に追加 (降順ソートしない)
- Impact レベルは changeImpact と一致させる
- Summary は簡潔に (50文字以内推奨)

---

## 15. GLOSSARY / LINKING 指針

### 用語参照形式

```markdown
[用語](../06-reference/GLOSSARY.md#term-kebab)
```

**例**:

```markdown
このシステムは[マイクロサービス](../06-reference/GLOSSARY.md#microservice)アーキテクチャを採用しています。
```

### 新語追加条件

新しい用語を GLOSSARY.md に追加する条件:

1. ドメインで**3回以上再利用**される
2. **曖昧性解消**が必要 (一般的な意味とプロジェクト固有の意味が異なる)
3. **新しい概念**である (既存の用語では表現できない)

### 定義フォーマット

```markdown
### <用語名> {#term-kebab}

**英語**: English Term

**定義**: この用語の明確な定義を記述します。

**使用例**:

- コード例や文脈例を記載

**関連用語**:

- [関連用語1](GLOSSARY.md#related-term-1)
- [関連用語2](GLOSSARY.md#related-term-2)

**逆概念** (optional):

- 対義語や補完的な概念
```

---

## 16. DIFF IMPACT LEVELS & CHANGELOG 連携

### Impact レベルの判断基準

| impact     | 例                                   | CHANGELOG 必須 | version bump          |
| ---------- | ------------------------------------ | -------------- | --------------------- |
| **low**    | 誤字修正、句読点、コメント追加       | いいえ         | patch (1.0.0 → 1.0.1) |
| **medium** | 新セクション追加、非破壊的な機能追加 | いいえ (任意)  | minor (1.0.0 → 1.1.0) |
| **high**   | 既存概念再定義、削除、破壊的変更     | **はい**       | major (1.0.0 → 2.0.0) |

### CHANGELOG 記載形式

**高影響度 (high) の変更のみ CHANGELOG に記載**:

```markdown
## [Unreleased]

### docs

- **ARCHITECTURE.md**: Migrated to microservices architecture
- **DOMAIN.md**: Redefined user authentication flow
- **PATTERNS.md**: Removed deprecated error handling pattern
```

**形式**: `docs: <FileName> <summary>`

**カテゴリ**:

- `docs`: ドキュメント変更
- `feat`: 新機能追加
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加/修正
- `chore`: その他の変更

---

## 17. ONBOARDING QUICK START (人間 + AI)

新しいチームメンバー(人間またはAI)が参画した際の推奨読み込み順序:

### 📚 5分で理解

1. **MASTER.md** → 全体把握、技術スタック、禁止事項

### 📚 15分で深堀り

2. **ARCHITECTURE.md** → システム設計、コンポーネント図
3. **DOMAIN.md** → ビジネスロジック、ドメインモデル

### 📚 10分で実践準備

4. **PATTERNS.md** → 実装パターン、コーディング規約
5. **TESTING.md** → テスト戦略、カバレッジ目標

### 📚 5分で疑問解消

6. **FAQ.md** → よくある質問と回答

**合計 35分以内で初回稼働可能**

### AIエージェント向けの追加ステップ

- **OPERATIONAL_GUIDE.md** (本書) → 運用ルール、分類方法
- **GLOSSARY.md** → プロジェクト固有の用語

---

## 18. FUTURE EVOLUTION NOTES

将来的な技術進化に応じた本ガイドの進化方向:

### コンテキストウィンドウ拡張時 (≥1M tokens)

- **分割よりもメタ付与**: ファイル分割よりもFrontmatterとタグによる動的抽出最適化へ移行
- **DECISIONS.md のストリーム化**: イベント時系列ストリーム化 (JSON Lines)
- **Glossary のグラフ化**: 階層タグ + 用語間関係グラフ化

### AI能力向上時

- **自動分類**: DECISION MATRIX の自動適用
- **自動リンク**: 用語の自動Glossaryリンク化
- **自動整合性チェック**: リンク切れ、バージョン不整合の自動検出・修正

### チーム規模拡大時

- **承認フロー**: 変更承認ワークフローの追加
- **ロール管理**: ファイルごとのオーナーシップ管理
- **変更通知**: 重要文書の変更時の自動通知

**重要**: これらの進化は、「最小限のドキュメントで最大の効果」という基本原則を維持しながら実施します。

---

## 19. 最終チェックリスト (Committed 前に PASS 必須)

コミット前に以下のチェックリストをすべてPASSする必要があります:

```
構造チェック:
[ ] 01～08 全フォルダ存在
[ ] REQUIRED MINIMUM FILE SET 全存在
[ ] フォルダ命名規則遵守 (NN-kebab-case)
[ ] ファイル命名規則遵守 (UPPER_SNAKE_CASE.md)

メタデータチェック:
[ ] すべて Frontmatter 構文 OK
[ ] 必須フィールドすべて記入
[ ] version 番号が正しい (セマンティックバージョニング)
[ ] changeImpact レベルが適切

コンテンツチェック:
[ ] 重複語彙なし (Glossary と照合)
[ ] リンク切れなし (参照先ファイル存在確認)
[ ] 命名規約違反なし
[ ] マジックナンバー/ハードコード値なし

変更管理チェック:
[ ] impact=high → CHANGELOG 追記済
[ ] Revision History 更新済
[ ] 相互参照リンク設定済

品質チェック:
[ ] 誤字脱字なし
[ ] コードブロックのシンタックスハイライト指定
[ ] 表形式の整合性
```

**すべてのチェックがPASSするまでコミットしないこと**

---

## MUST 命令 (AIエージェント向け抜粋)

AIエージェントは以下の MUST 命令を厳守してください:

```
MUST: 起動直後に下記フォルダ存在を検証し、欠損は即時生成すること:
docs-template/01-context
docs-template/02-design
docs-template/03-implementation
docs-template/04-quality
docs-template/05-operations
docs-template/06-reference
docs-template/07-project-management
docs-template/08-knowledge

MUST: REQUIRED MINIMUM FILE SET 不足時は空テンプレート＋Frontmatterを生成。

MUST: 新規文書分類時 DECISION MATRIX に従い、曖昧なら既存関連ファイルへ append し新規ファイル作成を避ける。

MUST: 重複主題検出時は統合提案し再生成を停止する。

MUST: changeImpact=high の場合、必ず CHANGELOG を更新する。

MUST: すべてのMarkdownファイルに適切なFrontmatterを配置する。

MUST: コミット前に最終チェックリストをすべてPASSさせる。
```

---

## Revision History

| Date       | Author  | Version | Impact | Summary                                                   |
| ---------- | ------- | ------- | ------ | --------------------------------------------------------- |
| 2025-10-17 | agent   | 2.0.0   | high   | Replaced prior narrative with structured operational spec |
| 2025-11-07 | futoshi | 2.1.0   | high   | Refactored from monolithic file, enhanced structure       |

---

## 付録: 参考ファイル索引 (Cross-Reference)

以下の文書と併せて参照してください:

**中核文書**:

- **MASTER.md**: 全体統合ルール / 技術スタック / 禁止事項
- **PROJECT.md**: ビジョン / 要件 / 非機能指標
- **ARCHITECTURE.md**: レイヤー構造 / コンポーネント図 / エラー設計
- **DOMAIN.md**: 集約 / エンティティ / ビジネスルール / ドメインイベント

**実装文書**:

- **PATTERNS.md**: 実装/エラー/バリデーション/セキュリティ/パフォーマンス パターン
- **TESTING.md**: テストピラミッド / カバレッジ目標 / AAA パターン
- **DEPLOYMENT.md**: CI/CD / 環境 / リリース / ロールバック

**参照文書**:

- **GLOSSARY.md**: 用語定義 / 英訳 / 関連語
- **DECISIONS.md**: 設計判断記録 / ADR (Architecture Decision Records)

**管理文書**:

- **ROADMAP.md**: フェーズ計画 / マイルストーン / 依存関係
- **FAQ.md**: よくある質問と回答

**関連ガイド**:

- **[AI_SPEC_DRIVEN_DEVELOPMENT.md](AI_SPEC_DRIVEN_DEVELOPMENT.md)**: AI駆動開発の概念と実践方法
- **[MAXFILES_SETUP_GUIDE.md](MAXFILES_SETUP_GUIDE.md)**: macOS / Windows のファイルディスクリプタ上限設定と VS Code 安定化手順

---

本書は構造運用専用です。ビジネス/設計/実装/品質の詳細は上記参照文書を確認してください。
