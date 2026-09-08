---
title: "MASTER"
version: "1.8.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "2026-09-08"
changeImpact: "medium"
---

# AI駆動開発マスタードキュメント

> **テンプレート直接利用**: `${CLAUDE_PLUGIN_ROOT}` がない環境では、この変数をシェルで展開しません。本文でプラグイン配下のテンプレートを参照する箇所は、同じ相対パスを [公開テンプレート配布元](https://github.com/feel-flow/ff-dev-toolkit/tree/HEAD/plugins/ff-dev-toolkit/docs-template) から参照・取得してください。利用する配布版に合わせたタグのファイルを選び、ローカルにある同名ファイルを無条件で上書きしないでください。

## 前提（重要・短文）

- ドキュメントは利用者とAIが判断・現在地を理解できるよう、目的に合う量と言葉で記載する。
- AI生成の推測/補完が混入し得るため、エンジニアは必ず一次情報（ソース/設定/設計資料/実行結果/テスト）で検証し、乖離はSSOTへ即時反映（重複は参照化）。
- 本ガイドの時間表記は目安。チーム/AIの習熟で短縮される。

## 🚨 AIツール向け重要ルール

### 情報不足時の必須確認プロトコル

AIツールは、ドキュメント生成やコード生成時に**情報が不足している場合、推論で埋めずに必ず確認を求めること**。

#### 必須確認が必要な情報

**プロジェクト基本情報**:

- [ ] プロジェクト名（具体的な名称）
- [ ] ターゲットユーザー（誰のために作るか）
- [ ] 主要機能（何を実現するか）
- [ ] 技術スタック（使用する言語・フレームワーク）

**技術的詳細**:

- [ ] データベース種別（PostgreSQL? MongoDB? MySQL?）
- [ ] 認証方式（JWT? OAuth? Session?）
- [ ] デプロイ環境（AWS? GCP? Azure? Vercel?）
- [ ] API形式（REST? GraphQL? gRPC?）

**ビジネス要件**:

- [ ] パフォーマンス要件（具体的な数値）
- [ ] セキュリティ要件（必須の対策）
- [ ] スケーラビリティ要件（同時接続数等）
- [ ] 予算・期間制約

#### 確認の出力形式

情報不足を検出した場合、以下の形式で出力すること：

```markdown
⚠️ 情報不足により確認が必要です

以下の情報が不足しているため、推論では進められません。
確認をお願いします：

【必須確認事項】

1. [項目名]: [何が不明か]
   - 例: データベース種別
   - 理由: PostgreSQLとMongoDBで設計が大きく異なるため
   - 推奨: PostgreSQL（リレーショナルデータの場合）/ MongoDB（ドキュメント指向の場合）

2. [項目名]: [何が不明か]
   ...

【オプション確認事項（推論で進める場合の前提）】

1. [項目名]: [推論内容]
   - 前提: [この前提で進めます]
   - リスク: [後で変更が必要になる可能性]
   - 確認推奨: はい/いいえ

【次のステップ】
上記を確認後、以下のコマンドで続行してください：
「[確認された情報]で進めてください」
```

#### 推奨候補と合意した方針

重要な選択は推奨理由と代替案を示し、合意後に採用する。既存回答や委任は引き継ぎ、細かな設定を逐一再質問しない。「確認済みの事実」「合意済みの決定」「提案中」「未決」を区別し、提案を必須ゲートへ変換しない。

| 項目                       | 推奨候補と適用条件                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| TypeScript strict mode     | 新規TypeScriptでは推奨。既存では影響を確認して段階導入も比較する                               |
| ランタイム・依存バージョン | 最新LTSまたは公式の本番推奨安定版を候補にし、公式情報と互換性を確認する                        |
| テストカバレッジ           | 重要な業務と失敗時の影響から対象を決める。80%などの数値目標は必要な場合に合意する              |
| 定数化                     | 業務上の意味がある値・変更される値を名前付き定数や設定にする。自明な数値まで機械的に禁止しない |
| エラーハンドリング         | 言語・フレームワーク・既存コードから例外／Result型などを比較し、一貫した扱いを選ぶ             |
| 命名規則                   | 言語・フレームワーク・既存の合意に合わせる。下記は候補例                                       |

**❌ 推論禁止の例**:

```
悪い例:
「データベースは一般的なので、PostgreSQLで進めます」
→ ユーザーがMySQLを想定していた場合、全て作り直し

良い例:
「データベース種別が指定されていません。
以下から選択してください：
1. PostgreSQL（推奨: リレーショナル、高機能）
2. MySQL（推奨: シンプル、広く普及）
3. MongoDB（推奨: ドキュメント指向、柔軟）
4. その他（具体的に指定してください）」
```

#### 段階的確認の推奨

大きな決定事項は段階的に確認：

```markdown
✅ 推奨フロー:

ステップ1: 大枠の確認
「このプロジェクトは、Webアプリケーションですか？
それともモバイルアプリですか？API専用ですか？」

↓

ステップ2: 技術スタックの確認
「Webアプリケーションの場合、
フロントエンド: React? Vue? Next.js?
バックエンド: Node.js? Python? Go?」

↓

ステップ3: 詳細仕様の確認
「Next.js採用の場合、

- App Router? Pages Router?
- 認証: NextAuth.js? Auth0? 独自実装?」
```

#### 人間の検証タイミング

AIが生成したドキュメント・コードは、以下のタイミングで**必ず人間が検証**：

1. **MASTER.md生成後** - プロジェクト全体の方向性確認
2. **ARCHITECTURE.md生成後** - 技術的決定事項の妥当性確認
3. **コード生成後** - ビジネスロジックとセキュリティの確認
4. **デプロイ前** - 本番環境設定の確認

---

## プロジェクト識別情報

- **プロジェクト名**: [プロジェクト名を入力]
- **バージョン**: Frontmatter の `version` を参照
- **使用AIツール**: Claude Code, GitHub Copilot, Cursor
- **最終更新日**: Frontmatter の `updated` を参照

## プロジェクト概要

[30秒で理解できるプロジェクトの説明を記載]

- **何を作るか**:
- **なぜ作るか**:
- **誰のためか**:

## 技術スタック

### バージョン選定ポリシー（LTSデフォルト）

AIツールがランタイム・依存のバージョンを選定する際は、以下のルールに従うこと。

1. **最新の本番利用に適した版を推奨する** — 指定がなければ最新LTS、または公式に本番利用が推奨されるサポート中の安定版を候補にする。LTS制度と本番推奨方針は各技術の公式情報で確認する。採用系列では最新修正版を基本とする。
2. **互換性とサポートを確認する** — サポート期限、依存ライブラリと実行基盤の対応、既知の問題を確認する。新メジャー版の採用を見送る場合は理由と再評価条件を記録する。一律の待機日数は設けない。EOL版を新規採用のデフォルトにしない。
3. **選定時に公式情報を検証する** — 学習データだけで版を決めない。公式リリース・セキュリティ情報のURLと確認日を記録する。確認できない場合は「最新確認済み」と記載せず、確認待ちとして残す。
4. **既存構成と移行案を分ける** — 更新費用や互換性を含めて合意し、決定理由と例外を記録する。更新担当・頻度・緊急対応・ロールバック方法は運用方針へつなげる。

> **なぜ必要か**: AIには学習データのカットオフがあるため、AIが「最新」と認識しているバージョンは古い可能性があります。ルールなしで選定を任せると、学習データ中の頻出バージョン（EOL済みを含む）に引っ張られます。

### 概要（バージョン付き）

> **重要**: AIには学習データのカットオフがあるため、バージョンを明記することで正しい書き方を指示できます。

| カテゴリ | 技術        | バージョン | 確認日・情報源     | AIへの注意点         |
| -------- | ----------- | ---------- | ------------------ | -------------------- |
| Language | TypeScript  | [x.x.x]    | [YYYY-MM-DD / URL] | strict採用方針を記録 |
| Frontend | [Framework] | [x.x.x]    | [YYYY-MM-DD / URL] | [注意点]             |
| State    | [Library]   | [x.x.x]    | [YYYY-MM-DD / URL] | -                    |
| Backend  | [Framework] | [x.x.x]    | [YYYY-MM-DD / URL] | [注意点]             |
| Database | [DB]        | [x.x]      | [YYYY-MM-DD / URL] | -                    |
| ORM      | [Library]   | [x.x.x]    | [YYYY-MM-DD / URL] | -                    |

### AIへの補足（カットオフ対策）

> 以下の技術はAIのカットオフ後にリリースされた可能性があります。
> 使用時は仕様書で書き方を明示してください。

- [技術名 x.x]: [リリース日]。[注意点、非推奨APIなど]

**例**:

- [採用技術・版]: [公式URLと確認日]。採用理由・互換性・既知の問題・再評価条件を記録する。

### 詳細

#### フロントエンド

- フレームワーク:
- 状態管理:
- スタイリング:

#### バックエンド

- 言語/フレームワーク:
- API形式:
- 認証方式:

#### データベース

- 種別:
- ORM/ODM:

#### インフラ/ホスティング

- クラウドプロバイダー:
- コンテナ/オーケストレーション:

#### 開発ツール

- パッケージマネージャー:
- ビルドツール:
- リンター/フォーマッター:
- AI駆動デバッグ: Playwright MCP（推奨）

※ 詳細な技術スタックと選定理由（ADR）は [ARCHITECTURE.md](./02-design/ARCHITECTURE.md) を参照

## アーキテクチャパターン

- [ ] Clean Architecture
- [ ] Repository Pattern
- [ ] CQRS (Command Query Responsibility Segregation)
- [ ] Event-Driven Architecture
- [ ] Microservices
- [ ] Monolithic
- [ ] その他:

## ディレクトリ構造

リポジトリのトップレベル構造と各ディレクトリの責務。AIツールはコードの配置判断・探索の起点としてここを参照する。

```text
[プロジェクトルート]/
├── docs/                 # AI仕様駆動開発ドキュメント（詳細は「ドキュメント構造ガイド（AIツール向け）」を参照）
├── src/                  # [アプリケーションコード]
│   ├── [domain/]         # [ドメイン層: エンティティ・値オブジェクト・ドメインサービス]
│   ├── [application/]    # [アプリケーション層: ユースケース]
│   ├── [infrastructure/] # [インフラストラクチャ層: DB・外部API・永続化]
│   └── [presentation/]   # [プレゼンテーション層: UI・コントローラー]
├── tests/                # [テストコード]
├── scripts/              # [開発・運用スクリプト]
└── [その他]              # [プロジェクト固有のディレクトリと責務]
```

- 実際の構成に合わせて書き換えること（上記の `src/` 配下はClean Architectureの例）
- 層構成の詳細は [ARCHITECTURE.md](./02-design/ARCHITECTURE.md)、テスト戦略は [TESTING.md](./04-quality/TESTING.md) を参照
- 新規コードの配置判断は決定木で行う（詳細: [DECISION_TREE.md](./03-implementation/DECISION_TREE.md)）
- `docs/` 配下の詳細構造は本書の「ドキュメント構造ガイド（AIツール向け）」を参照（重複記載しない）

## コード生成ルール

### 合意して採用する方針

以下は候補であり、必要な項目を目的・言語・リスクに応じて選ぶ。採用済みの規約と組織の必須ルールを守る。

1. **型安全性**: 言語の型推論と明示的な型を使い分け、外部入力を検証する。
2. **エラーハンドリング**: 例外／Result型などを比較し、期待する失敗と予期しない障害を扱う。
3. **テスト**: 重要な業務・主要動作・失敗時の影響から確認対象を決める。数値目標は採用合意がある場合だけゲートにする。
4. **可読性**: 説明が必要な判断をコメントに残す。言語や関数行数を一律に固定しない。
5. **定数化**: 業務上の意味・変更理由がある値を名前付き定数や設定で管理する。自明な数値の抽出は強制しない。
6. **配置**: 既存構成と合意した設計を使う。必要なら [DECISION_TREE.md](./03-implementation/DECISION_TREE.md) の候補を参照する。雛形は採用した言語・設計に合うものだけを利用する。

### 命名規則

#### コード

- **変数名**: camelCase（例: userName, isActive）
- **定数名**: UPPER_SNAKE_CASE（例: MAX_RETRY_COUNT）
- **型名/インターフェース**: PascalCase（例: UserProfile, ApiResponse）
- **ファイル名**:
  - コンポーネント: PascalCase（例: UserCard.tsx）
  - ユーティリティ: camelCase（例: dateHelpers.ts）
  - 設定ファイル: kebab-case（例: eslint-config.js）

#### ドキュメントファイル

- **ディレクトリ**:
  - 形式: `数字-英語小文字（ハイフン区切り）`
  - 例: `01-context`, `02-design`, `03-implementation`
- **ファイル名**:
  - メインドキュメント: `UPPER_SNAKE_CASE.md`（AI識別性優先・複数語はアンダースコア `_` 区切り）
  - 例: `MASTER.md`, `ARCHITECTURE.md`, `LESSONS_LEARNED.md`, `DEVELOPMENT_PREPARATION.md`
  - サブフォルダ内ファイル: `lowercase-with-hyphens.md`（例: `git-workflow.md`, `phased-rollout.md`）
  - 詳細・適用条件・逸脱判断は README.md（ff-dev-toolkit プラグイン同梱、`${CLAUDE_PLUGIN_ROOT}/docs-template/README.md` の「ファイル名命名規則」章、初期セット外）を SSOT とする
- **禁止事項**:
  - ❌ 日本語ファイル名
  - ❌ スペースを含むファイル名
  - ❌ メインドキュメントでのハイフン区切り（複数語は `UPPER_SNAKE_CASE.md` を使用）
  - ❌ ファイル名への番号プレフィックス（ディレクトリのみ使用）

- **例外**:
  - `README.md`（標準的な慣習）
  - `CLAUDE.md`, `AGENTS.md`（AIツール向け特殊ファイル）
  - `.github/copilot-instructions.md`, `.cursor/rules/*.mdc`（ツール固有の命名・配置。Legacy `.cursorrules` は後方互換）

### 禁止事項

- ❌ any型の使用（やむを得ない場合はコメントで理由を明記）
- ❌ console.logの本番コードへの残留
- 合意した定数化の対象と、その値の意味・単位を確認する
- ❌ 未使用のインポートや変数の放置
- ❌ エラーの握りつぶし（catch節で何もしない）

## 実装優先順位

### Phase 1: MVP（必須機能）

1.
2.
3.

### Phase 2: 拡張機能

1.
2.
3.

### Phase 3: 最適化

1.
2.
3.

## エラーハンドリング方針

- **API通信エラー**: リトライ機構とフォールバック表示（本番のみ。開発時はエラーを伝播）
- **バリデーションエラー**: フィールド単位でのリアルタイム表示
- **予期しないエラー**: エラーバウンダリーでキャッチし、エラー画面表示
- **ログ記録**: 構造化ログで詳細を記録（個人情報は除外）
- **フォールバック戦略**: 開発環境ではFail-Fast、本番環境でのみGraceful Degradation（詳細: [FALLBACK.md](./03-implementation/FALLBACK.md)）

## セキュリティ要件

- [ ] 入力値のサニタイゼーション
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] CSRF対策
- [ ] 適切な認証・認可
- [ ] HTTPSの使用
- [ ] 環境変数での機密情報管理

## パフォーマンス目標

- **ページロード時間**: 3秒以内
- **API応答時間**: 200ms以内（95パーセンタイル）
- **同時接続数**: 1000ユーザー

## 開発フロー

1. 要件確認（PROJECT.md参照）
2. 設計確認（ARCHITECTURE.md参照）
3. 実装（PATTERNS.md参照）
4. テスト（TESTING.md参照）
5. デプロイ（DEPLOYMENT.md参照）
6. 開発環境最適化（DEPLOYMENT.md「開発環境の最適化」参照）

## AI仕様駆動Git Workflow

本プロジェクトでは、Git FlowをベースとしたAI開発ツール最適化ワークフローを採用しています。

**段の正本は [DEPLOYMENT.md](./05-operations/DEPLOYMENT.md#主要ステップ) §主要ステップ である。** 段の一覧と、変更規模による tier（フル / 軽量 / 標準）の判定はそこにあり、本節は書き写さない。tier 判定は `${CLAUDE_PLUGIN_ROOT}/scripts/workflow-tier.sh` が差分から導出する（自己申告ではない）。

**重要なポイント**:

- すべての作業はIssueから開始
- ブランチ名: `feature/{issue-number}-{description}`
- コミットメッセージにドキュメント参照を含める（例: `docs/MASTER.md:29`）
- **【重要】PR作成前にセルフレビューを実施** - AIツールを活用してコーディング規約・仕様整合性・テスト充実度を事前確認
- AIがPRレビュー指摘を自動読み取り・対応
- **【重要】マージ後にナレッジを体系化** - ACE Playbook に構造化知見を追記（AIツール向け）し、重要な知見は GitHub Discussions にも記録（人間向け）
- ロードマップ更新と次タスク提案

## AIへのプロンプト補助（貼り付け用）

定数化を採用した場合、必要な対象を次のように伝える。

```
合意した方針: 業務上の意味がある値や変更される値を定数・設定へ抽出し、必要に応じて単位や範囲を示す。自明な値の抽出は強制しない。

推奨ツール: Playwright MCP統合によりAI駆動のビジュアルデバッグ・自動テスト修復を活用すること。E2Eテストの失敗時は自動的にスクリーンショット分析と修正提案を生成する。
```

## Spec Kit 運用ガイド（AI Spec Driven 拡張）

本リポジトリは AI Spec Driven Development を GitHub Spec Kit 風の粒度管理で拡張し、仕様ライフサイクルとLLM利活用を統合する。

### 目的

- 仕様を小さく明確な単位 (spec) に分割し、変更追跡・レビュー・検索性を高める。
- Front Matter メタデータでステータス/責任者/リンクを明示し、CI検証を自動化。
- MCPツール (`spec_lookup`, `spec_search`) を通じて LLM に最小コンテキストを供給。

### 仕様配置

- ディレクトリ: `docs/specs/`
- テンプレート: `docs/specs/spec-template.md`
- サンプル: `docs/specs/authentication.md`

### Front Matter スキーマ（必須フィールド）

```
specId: ASDD-DOMAIN-###   # 一意。例: ASDD-AUTH-001
title: <短く的確>
owners:                   # 配列（将来GitHubハンドルやチームID）
  - github: your-handle
status: draft|review|approved|implementing|done|deprecated
version: semver
lastUpdated: YYYY-MM-DD
tags: [mvp, security, ...]
links:                    # 任意。Issue/PR/関連doc参照
  issues: []
  prs: []
  docs: []
summary: >- 1〜2文要約
riskLevel: low|medium|high
impact: >- 影響領域要約
metrics:
  success:
    - 指標例: login_success_rate >= 98%
  guardrails:
    - 指標例: auth_latency_p95 < 150ms
```

### ライフサイクル

| 状態         | 目的     | 代表アクション     | 出口条件           |
| ------------ | -------- | ------------------ | ------------------ |
| draft        | 初稿作成 | 草案コミット       | レビューワ割当     |
| review       | 内容検証 | フィードバック反映 | 全必須コメント解消 |
| approved     | 合意済   | 実装Issue紐付      | 実装着手           |
| implementing | 実装中   | PRリンク追加       | 全PRマージ         |
| done         | 運用     | メトリクス監視     | 非推奨決定         |
| deprecated   | 廃止準備 | 代替spec参照       | 削除 or 置換       |

### 命名規約（specId）

`ASDD-<DOMAIN>-<連番3桁>` 例: `ASDD-AUTH-001`, `ASDD-OBS-002`

- DOMAIN: AUTH, USER, OBS(Observability), DATA など領域識別
- 連番は領域内でインクリメント（欠番許容）

### バリデーション

- スクリプト: `node scripts/build-spec-index.mjs`
- 失敗条件: specId欠落 / 重複 / status不正 / title欠落 / version欠落
- 出力: `dist/spec-index.json`（MCPおよびCI用）

### MCP連携

| ツール        | 目的                  | 入力         | 出力                |
| ------------- | --------------------- | ------------ | ------------------- |
| `spec_lookup` | spec詳細取得          | specId       | front matter + 本文 |
| `spec_search` | タイトル/タグ簡易検索 | query, limit | specId/score一覧    |

### 開発フロー統合

1. Issue起票（新仕様 or 変更）
2. テンプレコピー→ `specId` 割当 → draftコミット
3. PRでレビュー（reviewステータス）
4. Merge後 `approved` に更新 & 実装Issue作成
5. 実装ブランチ / PRリンク (`links.prs`) 追記 → 全マージで `done`
6. 古い仕様再編時は新spec参照付与後 `deprecated`

### 追跡と自動化（将来拡張）

- CI: spec-index再生成 → エラーでPR失敗
- Bot: 未リンク `approved` spec に自動Issue起票
- 差分ハイライト: 直前バージョン比較で変更要約生成

### ベストプラクティス

- 1仕様 = 1つの「判断 + 境界 + 目的」単位。過剰分割は避ける。
- 仕様本文は「Why → What → Constraints → Risks → Metrics」の順で簡潔。
- 実装詳細が複雑化した場合は派生specを分けて依存リンク明示。

### レビューチェック項目（追加）

- [ ] specIdユニーク / パターン適合
- [ ] Goals と Non-Goals 明確
- [ ] Metrics に成功指標とガードレール両方が定義
- [ ] リスクに少なくとも1件の緩和策
- [ ] links.docs / issues / prs の更新整合

### LLM利用時推奨プロンプト追記例

```
必要spec: ASDD-AUTH-001 を `spec_lookup` で取得し、未定義領域が他specに依存する場合は spec_search で補集合を提案せよ。
```

---

## 関連ドキュメント

### 初心者・新規プロジェクト向け（初期セット外・必要時にコピー）

- GETTING_STARTED_ABSOLUTE_BEGINNER.md — 完全初心者ガイド（何も決まっていない状態から始める、約4.5時間）。`${CLAUDE_PLUGIN_ROOT}/docs-template/GETTING_STARTED_ABSOLUTE_BEGINNER.md` からコピー
- GETTING_STARTED_NEW_PROJECT.md — 新規プロジェクト完全ガイド（企画から実装準備まで、8-12時間）。`${CLAUDE_PLUGIN_ROOT}/docs-template/GETTING_STARTED_NEW_PROJECT.md` からコピー
- 00-planning/PLANNING_TEMPLATE.md — プロジェクト企画書テンプレート。`${CLAUDE_PLUGIN_ROOT}/docs-template/00-planning/PLANNING_TEMPLATE.md` からコピー

### AIツール初期設定ガイド（初期セット外・必要時にコピー）

- SETUP_GITHUB_COPILOT.md — GitHub Copilot設定（約30分）。`${CLAUDE_PLUGIN_ROOT}/docs-template/SETUP_GITHUB_COPILOT.md` からコピー
- SETUP_CLAUDE_CODE.md — Claude Code設定（約40分）。`${CLAUDE_PLUGIN_ROOT}/docs-template/SETUP_CLAUDE_CODE.md` からコピー

### 既存プロジェクト向け（初期セット外・必要時にコピー）

- GETTING_STARTED.md — Quickstart（既存プロジェクトへの導入・AI駆動・読み順・プロンプト）。`${CLAUDE_PLUGIN_ROOT}/docs-template/GETTING_STARTED.md` からコピー

### コア7文書（起点）

本リポジトリのテンプレートでは、中央の **MASTER.md** と以下6文書をコア7と位置づける。

- [01-context/PROJECT.md](./01-context/PROJECT.md) - ビジョンと要件
- [02-design/ARCHITECTURE.md](./02-design/ARCHITECTURE.md) - システム設計
- [02-design/DOMAIN.md](./02-design/DOMAIN.md) - ビジネスロジック
- [03-implementation/PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン
- [04-quality/TESTING.md](./04-quality/TESTING.md) - テスト戦略
- [05-operations/DEPLOYMENT.md](./05-operations/DEPLOYMENT.md) - デプロイ戦略

> コア7文書はプロジェクトの最小構成です。成長に応じて各フォルダ内に文書を追加してください。全文書が揃わなくてもAIと対話しながら段階的に仕様を策定できます。

### 品質・セキュリティ（推奨拡張・初期セット外）

コア7以外に、次を参照すると品質ゲートとレビュー観点が揃いやすい。必要時に `${CLAUDE_PLUGIN_ROOT}/docs-template/` の同一相対パスからコピーする。

- 04-quality/GUARDRAILS_THREE_LAYERS.md — ガードレール3層（仕様・自動チェック・人間レビュー）
- 04-quality/SECURITY_REVIEW_CHECKLIST.md — セキュリティレビューチェックリスト（PR用）

### ナレッジベース（初期セット外・`/ace-setup` が作成）

- 08-knowledge/LESSONS_LEARNED.md — 開発過程で得た知見・解決策
- 08-knowledge/TROUBLESHOOTING.md — トラブルシューティング集
- 08-knowledge/BEST_PRACTICES.md — ベストプラクティス集
- 08-knowledge/FAQ.md — よくある質問と回答
- 08-knowledge/PLAYBOOK.md — ACE Playbook（AIツール向け構造化知見）
- 08-knowledge/OBSERVATIONS.md — `/retrospective` の観測台帳（機械管理の蓄積バッファ。無ければ振り返り時にテンプレートから自動作成。Frontmatter は付与しない）

### 開発プロセスガイド（初期セット外・必要時にコピー）

- 06-reference/DEVELOPMENT_PREPARATION.md — 開発準備ガイド（5 Phases: Issue-First → Document-Driven → MECE検証 → AI Spec-Driven → Git Workflow）。`${CLAUDE_PLUGIN_ROOT}/docs-template/06-reference/DEVELOPMENT_PREPARATION.md` からコピー
- 00-planning/POC_WORKFLOW.md — PoCワークフロー・結果記録テンプレート・仕様マッピングガイド。`${CLAUDE_PLUGIN_ROOT}/docs-template/00-planning/POC_WORKFLOW.md` からコピー
- 06-reference/DECISION_MATRIX.md — 「どの文書に書く？」判断ガイド（Decision Matrix・曖昧ケース例・機能×文書マトリクス）。`${CLAUDE_PLUGIN_ROOT}/docs-template/06-reference/DECISION_MATRIX.md` からコピー
- 06-reference/COPILOT_AGENTS.md — GitHub Copilot Agents設定リファレンス（6種のレビューエージェントテンプレート）。`${CLAUDE_PLUGIN_ROOT}/docs-template/06-reference/COPILOT_AGENTS.md` からコピー
- 06-reference/ISSUE_TEMPLATE_PATTERNS.md — Issue テンプレ設計パターン（ストーリー型=推奨 / 従来型=代替）。`${CLAUDE_PLUGIN_ROOT}/docs-template/06-reference/ISSUE_TEMPLATE_PATTERNS.md` からコピー
- 05-operations/ORGANIZATIONAL_ROLLOUT.md — 組織展開ガイド索引（段階的導入の Phase 1〜4・文書分割・アーカイブ・月次ヘルスチェック）。`${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/ORGANIZATIONAL_ROLLOUT.md` からコピー

## ドキュメント構造ガイド（AIツール向け）

> **詳細ガイドは 05-operations/ORGANIZATIONAL_ROLLOUT.md（初期セット外・必要時に `${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/ORGANIZATIONAL_ROLLOUT.md` からコピー）を参照**。本節はサマリーのみを掲載する（SSOT は新ガイド）。

### AIツールの読み込み戦略

**ステップ1**: 索引ドキュメントを読み、必要なトピックを特定
**ステップ2**: 該当する詳細ドキュメントのみを読み込み
**ステップ3**: 必要に応じて関連ドキュメントを追加読み込み

**例**:

```
ユーザー: 「セルフレビューの方法を教えて」
AI: DEPLOYMENT.md（索引）→ deployment/self-review.md を読み込み
```

### ファイル名命名規則

ファイル名命名規則の SSOT は ff-dev-toolkit プラグイン同梱の README.md（`${CLAUDE_PLUGIN_ROOT}/docs-template/README.md` の「ファイル名命名規則」章、初期セット外）です。短縮版:

- ルート直下 / 番号付きフォルダ直下の MD: `UPPER_SNAKE_CASE.md`（例: `MASTER.md`, `DEPLOYMENT.md`）
- サブフォルダ名・サブフォルダ内 MD: `lowercase-with-hyphens(.md)`（例: `deployment/git-workflow.md`）
- 例外（`README.md`, `CLAUDE.md` 等）・逸脱判断・新規追加チェックリストは SSOT を参照

### ファイルサイズの閾値（書籍 第14章準拠）

| 行数      | 判断           |
| --------- | -------------- |
| 〜 500 行 | 適正           |
| 500 行超  | 分割を検討     |
| 800 行超  | 分割を推奨     |
| 1200 行超 | **分割を必須** |

> 親（索引）+ 子（詳細）への分割手順・分割しない判断・実例は organizational-rollout/document-splitting.md（初期セット外・`${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/organizational-rollout/document-splitting.md` からコピー）を SSOT とする。

### 簡潔化の原則

**削除すべきもの**:

- 一般的なコマンド例（AIは既知）
- 公式ドキュメントに詳細がある内容（URLのみで十分）
- 汎用的なコード例（プロジェクト固有でない）

**残すべきもの**:

- プロジェクト固有の規約・パターン
- 複数ツールの組み合わせ例
- ハマりポイントの回避策
- AIツールへのプロンプトテンプレート

## 月次ドキュメント参照チェック

毎月1日に以下4項目を確認する。手順・自動化スクリプト・レポートテンプレートは organizational-rollout/health-check.md（初期セット外・`${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/organizational-rollout/health-check.md` からコピー）を参照。

1. **MASTER.md からの参照確認** — 新規文書が索引から到達可能か
2. **ファイルサイズ確認** — 上記閾値（500/800/1200）超過の検出
3. **鮮度確認** — 6 ヶ月以上更新なしの文書を分類（保持／修正／アーカイブ）
4. **孤立文書の確認** — どこからも参照されていない文書の検出

### アーカイブ対象（要約）

以下に該当する文書は `archive/` への退避を **検討**。判定フロー・手順・リダイレクト管理ルールは organizational-rollout/archive-strategy.md（初期セット外・`${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/organizational-rollout/archive-strategy.md` からコピー）を参照。

- 6 ヶ月参照なし
- 技術的に陳腐化
- 別文書に統合された
- PoC・実験用途で完了

## 文書運用ルール

### Frontmatter

コア7文書（MASTER/PROJECT/ARCHITECTURE/DOMAIN/PATTERNS/TESTING/DEPLOYMENT）およびプロジェクトで追加した文書に以下の YAML Frontmatter を付与する。Frontmatter が文書のメタデータの正式なソースとなる。

> **注**: `docs/specs/` 配下の仕様ファイルには Spec Kit 運用ガイドの Front Matter スキーマ（6ステータス: draft/review/approved/implementing/done/deprecated）を適用すること。上記 Frontmatter ルールはコア7文書および拡張文書に適用される。
>
> **例外**: `08-knowledge/OBSERVATIONS.md`（`/retrospective` の観測台帳）と `08-knowledge/playbook/**`（ACE Playbook の分割ファイル）は機械管理の蓄積ファイルであり、Frontmatter を付与しない（文書レベルのメタデータは索引側または運用スキル側が持つ）。

必須フィールド:

| フィールド | 説明                                                              | 例           |
| ---------- | ----------------------------------------------------------------- | ------------ |
| title      | 文書タイトル                                                      | ARCHITECTURE |
| version    | セマンティックバージョン                                          | 1.2.0        |
| status     | 文書の状態（有効値: `draft`, `review`, `approved`, `deprecated`） | draft        |
| owner      | 責任者                                                            | @username    |
| created    | 作成日                                                            | 2026-01-01   |
| updated    | 最終更新日                                                        | 2026-01-15   |

任意フィールド:

| フィールド   | 説明             | 用途                |
| ------------ | ---------------- | ------------------- |
| reviewers    | レビュワー一覧   | 承認フロー管理      |
| tags         | タグ             | 検索・分類          |
| related      | 関連文書         | 相互参照            |
| changeImpact | 最新変更の影響度 | low / medium / high |

### ステータスワークフロー

```text
draft → review → approved
  ↑__________________|
     （修正が必要な場合）

任意の状態 → deprecated（終端: 廃止準備・アーカイブ。復活時は draft/approved へ戻す）
```

| status     | 意味                     | AIへの扱い                   |
| ---------- | ------------------------ | ---------------------------- |
| draft      | 作成中・未確定           | 参考情報として扱う           |
| review     | レビュー中               | ほぼ確定だが変更の可能性あり |
| approved   | 承認済み                 | 正式な仕様として遵守         |
| deprecated | 廃止準備・アーカイブ済み | 新規実装の参照元に使用しない |

> `deprecated` はコア/拡張文書の終端状態。役目を終えた文書のアーカイブ（organizational-rollout/archive-strategy.md — 初期セット外・必要時に `${CLAUDE_PLUGIN_ROOT}/docs-template/05-operations/organizational-rollout/archive-strategy.md` からコピー）や、移動しない ADR の in-place 陳腐化に用いる。`docs/specs/` の 6 ステータス（中間 `implementing`/`done` を含む）とは異なり、コアは終端 1 つのみを持つ。

`review` ステータスの文書に対し1週間レビューコメントがなければ、ドキュメントオーナーが `approved` に昇格する。

### バージョニングルール

文書の変更時は影響度に応じてバージョンを更新する。

| 影響度 | 基準                         | バージョン更新    |
| ------ | ---------------------------- | ----------------- |
| low    | 誤字修正、文言調整           | パッチ（0.0.x）   |
| medium | 項目追加、既存概念の拡張     | マイナー（0.x.0） |
| high   | 構造変更、概念の再定義・削除 | メジャー（x.0.0） |

変更時は Frontmatter の `version`、`updated`、`changeImpact` を同時に更新し、末尾の Changelog セクションにエントリを追加すること。`changeImpact` は小文字（`low` / `medium` / `high`）で記録する。`changeImpact` は初版では省略可。初回変更時に Frontmatter へ追加する。

`.version-claims` contract を持つプロジェクト（リポジトリルートに `.version-claims/` ディレクトリがある場合）では、`version` を変更する文書の claim（`.version-claims/<document>.claim`）も**同じ commit で**更新すること（リポジトリ固有ルールが claim を要求する文書は version 不変の更新でも同様）。claim を落とすと `shared-version-convergence` 系のゲートが赤くなり、provisional commit → claim 生成 → amend の復旧を後追いで行うことになる。生成手順の正本は `.version-claims/README.md` — 手順はそちらを参照し、ここへ複製しない。contract を持たないプロジェクトではこの手順は不要。

### Changelog カテゴリ

Changelog エントリには以下のカテゴリを使用する（[Keep a Changelog](https://keepachangelog.com/) 準拠）。

| カテゴリ     | 用途                   |
| ------------ | ---------------------- |
| 追加         | 新機能・新項目         |
| 変更         | 既存機能の変更         |
| 非推奨       | 将来削除予定の機能     |
| 削除         | 削除された機能         |
| 修正         | バグ修正               |
| セキュリティ | セキュリティ関連の修正 |

## コードレビュー チェックリスト（追補）

- [ ] 合意した定数化の対象と値の意味・単位を確認した
- [ ] 定数の配置が層責務に沿っている（Domain/Application/Infrastructure）

## Changelog

- 2026-09-08 追記: プラグイン変数がない直接利用でも取得できる公開配布元を明記（ai-spec-driven-development#525）。

### [1.8.0] - 2026-09-08

- ASDD 2.0: project-specific recommendations and explicitly agreed optional features (Issues #1372 / #1374).

### [1.7.0] - 2026-09-02

#### 追加

- §ナレッジベース へ `08-knowledge/OBSERVATIONS.md`（`/retrospective` の観測台帳。無ければ振り返り時に自動作成）を追加し、§Frontmatter へ機械管理の蓄積ファイル（観測台帳・Playbook 分割ファイル）は Frontmatter を付与しない例外注記を追加（Issue #1146）

### [1.6.0] - 2026-08-31

#### 追加

- §バージョニングルール の Frontmatter 更新規則へ、`.version-claims` contract を持つプロジェクトでは対象文書の claim も同じ commit で更新する旨を追記（条件付き・生成手順は `.version-claims/README.md` を参照。Issue #997）

### [1.5.0] - 2026-08-24

#### 変更

- §AI仕様駆動Git Workflow の「基本フロー」（段の写し）を削除し、段の正本 [DEPLOYMENT.md §主要ステップ](./05-operations/DEPLOYMENT.md#主要ステップ) への参照へ統一

### [1.4.1] - 2026-07-22

#### 変更

- ファイル名例外の Cursor 表記を現行 Project Rules（`.cursor/rules/*.mdc`）へ更新。Legacy `.cursorrules` は後方互換として併記

### [1.4.0] - 2026-07-18

#### 変更

- コア7文書・拡張文書の status enum に終端状態 `deprecated` を追加（上流 AI-SDD リポジトリの同項目のハンク反映）。必須フィールド表・ステータスワークフロー図・ステータス表を 4 値へ更新。アーカイブ運用（archive-strategy.md）および移動しない ADR の in-place 陳腐化と整合。中間ライフサイクル（`implementing`/`done`）は追加せず終端 1 つのみ

### [1.3.0] - 2026-07-17

#### 追加

- 「技術スタック」に「バージョン選定ポリシー（LTSデフォルト）」節を新設（Issue #102。上流 AI-SDD リポジトリのバージョン選定ポリシー部分のみ取り込み）。フルサポート中の最新 LTS デフォルト（LTS 制度がない技術・フルサポート中の LTS が無い時期は最新安定版） / EOL 版のデフォルト選定禁止（例外はルール4で承認 + 記録） / 選定時の公式リリーススケジュール Web 検証義務（集約サイトは補助） / 例外時のユーザー承認 + DECISIONS.md 記録の 4 ルールを定義。「概要（バージョン付き）」表に「確認日・情報源」列を追加し、「推論が許容される範囲」のデフォルト値リストにランタイム/依存バージョンを追加

### [1.2.0] - 2026-07-15

#### 追加

- 「ディレクトリ構造」セクションを追加（標準の必須セクション適合。Issue #82）

### [1.1.1] - 2026-07-07

#### 修正

- 初期セット外ファイルへの Markdown リンクを、コピー元パス付きの案内テキストに変更（初期セット展開直後のリンク切れ解消。Issue #31）

### [1.1.0] - 2026-04-27

#### 追加

- PoCワークフロー・結果記録テンプレート・仕様マッピングガイドへの参照を追加

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成

#### 変更

- 「関連ドキュメント」のコア7列挙を MASTER+6文書に限定し、品質・セキュリティ拡張を別見出しへ分離
