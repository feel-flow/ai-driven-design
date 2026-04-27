---
title: "MASTER"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# AI駆動開発マスタードキュメント

## 前提（重要・短文）

- ドキュメントはAIが迷わず理解できることを第一基準とする（人間の可読性は副次）。
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

#### 推論が許容される範囲

以下は**明示的な指示がない場合のデフォルト値**として使用可（ただし明記すること）：

- **TypeScript strict mode**: 常に有効（明記）
- **テストカバレッジ目標**: 80%以上（明記）
- **マジックナンバー禁止**: 常に適用（明記）
- **エラーハンドリング**: Result pattern使用（明記）
- **命名規則**: MASTER.mdの規則に従う（明記）

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

### 概要（バージョン付き）

> **重要**: AIには学習データのカットオフがあるため、バージョンを明記することで正しい書き方を指示できます。

| カテゴリ | 技術        | バージョン | AIへの注意点    |
| -------- | ----------- | ---------- | --------------- |
| Language | TypeScript  | [x.x.x]    | strict mode必須 |
| Frontend | [Framework] | [x.x.x]    | [注意点]        |
| State    | [Library]   | [x.x.x]    | -               |
| Backend  | [Framework] | [x.x.x]    | [注意点]        |
| Database | [DB]        | [x.x]      | -               |
| ORM      | [Library]   | [x.x.x]    | -               |

### AIへの補足（カットオフ対策）

> 以下の技術はAIのカットオフ後にリリースされた可能性があります。
> 使用時は仕様書で書き方を明示してください。

- [技術名 x.x]: [リリース日]。[注意点、非推奨APIなど]

**例**:

- Next.js 16: 2025年10月リリース。App Router形式を使用（Pages Router禁止）
- React 19.2: Server Componentsがデフォルト（`"use client"`は明示時のみ）

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

## コード生成ルール

### 必須事項

1. **型安全性**: すべての変数、関数、APIレスポンスに明示的な型定義を付与
2. **エラーハンドリング**: try-catchブロックで適切にエラーを処理し、ユーザーフレンドリーなメッセージを表示
3. **テストコード**: 各機能に対して単体テストを作成（カバレッジ80%以上目標）
4. **コメント**: 複雑なロジックには日本語でコメントを追加
5. **リーダブルコード**: 単一責任の原則に従い、関数は30行以内に収める
6. **マジックナンバー禁止**: 意味のある数値/文字列の直接埋め込みを禁止。必ず名前付き定数または設定から注入し、単位・範囲を明示（詳細は `PATTERNS.md` を参照）
7. **配置判断**: 新機能追加時の「どこに書くか」は決定木で判断（詳細: [DECISION_TREE.md](./03-implementation/DECISION_TREE.md)）。新規コードファイルは [templates/README.md](./03-implementation/templates/README.md) の雛形をコピーしてから実装する（SKELETON を直接 import しない）。

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
  - メインドキュメント: `英語大文字.md`（AI識別性優先）
  - 例: `MASTER.md`, `ARCHITECTURE.md`, `TESTING.md`
- **禁止事項**:

  - ❌ 日本語ファイル名
  - ❌ スペースを含むファイル名
  - ❌ アンダースコア区切り（ハイフンを使用）
  - ❌ ファイル名への番号プレフィックス（ディレクトリのみ使用）

- **例外**:
  - `README.md`（標準的な慣習）
  - `CLAUDE.md`, `AGENTS.md`（AIツール向け特殊ファイル）
  - `.github/copilot-instructions.md`, `.cursorrules`（ツール固有の命名）

### 禁止事項

- ❌ any型の使用（やむを得ない場合はコメントで理由を明記）
- ❌ console.logの本番コードへの残留
- ❌ マジックナンバーの直接使用（定数として定義すること）
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

**基本フロー**: Issue → Branch → Commit → **Self-Review** → PR → Review → Merge → **Knowledge (ACE + Discussions)** → Cleanup → Next Task

詳細は [DEPLOYMENT.md](./05-operations/DEPLOYMENT.md#1-ai仕様駆動git-workflow) を参照してください。

**重要なポイント**:

- すべての作業はIssueから開始
- ブランチ名: `feature/{issue-number}-{description}`
- コミットメッセージにドキュメント参照を含める（例: `docs/MASTER.md:29`）
- **【重要】PR作成前にセルフレビューを実施** - AIツールを活用してコーディング規約・仕様整合性・テスト充実度を事前確認
- AIがPRレビュー指摘を自動読み取り・対応
- **【重要】マージ後にナレッジを体系化** - ACE Playbook に構造化知見を追記（AIツール向け）し、重要な知見は GitHub Discussions にも記録（人間向け）
- ロードマップ更新と次タスク提案

## AIへのプロンプト補助（貼り付け用）

以下をプロンプト末尾に追加し、マジックナンバー回避と設定注入を徹底してください。

```
制約: マジックナンバー／ハードコード禁止。意味のある値は名前付き定数へ抽出し、環境変数や設定モジュールから注入する。単位（ms, KB など）と有効範囲をコメント/型で明示すること。URL, パス, ヘッダ名, エラーコードは定数化する。

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

### 初心者・新規プロジェクト向け

- [GETTING_STARTED_ABSOLUTE_BEGINNER.md](./GETTING_STARTED_ABSOLUTE_BEGINNER.md) - 完全初心者ガイド（何も決まっていない状態から始める、約4.5時間）
- [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) - 新規プロジェクト完全ガイド（企画から実装準備まで、8-12時間）
- [00-planning/PLANNING_TEMPLATE.md](./00-planning/PLANNING_TEMPLATE.md) - プロジェクト企画書テンプレート

### AIツール初期設定ガイド

- [SETUP_GITHUB_COPILOT.md](./SETUP_GITHUB_COPILOT.md) - GitHub Copilot設定（約30分）
- [SETUP_CLAUDE_CODE.md](./SETUP_CLAUDE_CODE.md) - Claude Code設定（約40分）
- [SETUP_CURSOR.md](./SETUP_CURSOR.md) - Cursor設定（約60分）

### 既存プロジェクト向け

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Quickstart（既存プロジェクトへの導入・AI駆動・読み順・プロンプト）

### コア7文書（起点）

本リポジトリのテンプレートでは、中央の **MASTER.md** と以下6文書をコア7と位置づける。

- [01-context/PROJECT.md](./01-context/PROJECT.md) - ビジョンと要件
- [02-design/ARCHITECTURE.md](./02-design/ARCHITECTURE.md) - システム設計
- [02-design/DOMAIN.md](./02-design/DOMAIN.md) - ビジネスロジック
- [03-implementation/PATTERNS.md](./03-implementation/PATTERNS.md) - 実装パターン
- [04-quality/TESTING.md](./04-quality/TESTING.md) - テスト戦略
- [05-operations/DEPLOYMENT.md](./05-operations/DEPLOYMENT.md) - デプロイ戦略

> コア7文書はプロジェクトの最小構成です。成長に応じて各フォルダ内に文書を追加してください。全文書が揃わなくてもAIと対話しながら段階的に仕様を策定できます。

### 品質・セキュリティ（推奨拡張）

コア7以外に、次を参照すると品質ゲートとレビュー観点が揃いやすい。

- [04-quality/GUARDRAILS_THREE_LAYERS.md](./04-quality/GUARDRAILS_THREE_LAYERS.md) - ガードレール3層（仕様・自動チェック・人間レビュー）
- [04-quality/SECURITY_REVIEW_CHECKLIST.md](./04-quality/SECURITY_REVIEW_CHECKLIST.md) - セキュリティレビューチェックリスト（PR用）

### ナレッジベース

- [08-knowledge/LESSONS_LEARNED.md](./08-knowledge/LESSONS_LEARNED.md) - 開発過程で得た知見・解決策
- [08-knowledge/TROUBLESHOOTING.md](./08-knowledge/TROUBLESHOOTING.md) - トラブルシューティング集
- [08-knowledge/BEST_PRACTICES.md](./08-knowledge/BEST_PRACTICES.md) - ベストプラクティス集
- [08-knowledge/FAQ.md](./08-knowledge/FAQ.md) - よくある質問と回答
- [08-knowledge/PLAYBOOK.md](./08-knowledge/PLAYBOOK.md) - ACE Playbook（AIツール向け構造化知見）

### 開発プロセスガイド

- [06-reference/DEVELOPMENT_PREPARATION.md](./06-reference/DEVELOPMENT_PREPARATION.md) - 開発準備ガイド（5 Phases: Issue-First → Document-Driven → MECE検証 → AI Spec-Driven → Git Workflow）
- [06-reference/DECISION_MATRIX.md](./06-reference/DECISION_MATRIX.md) - 「どの文書に書く？」判断ガイド（Decision Matrix・曖昧ケース例・機能×文書マトリクス）
- [06-reference/COPILOT-AGENTS.md](./06-reference/COPILOT-AGENTS.md) - GitHub Copilot Agents設定リファレンス（6種のレビューエージェントテンプレート）

## ドキュメント構造ガイド（AIツール向け）

### 大規模ドキュメントの階層化

**原則**: ドキュメントが800行を超える場合、以下の構造を採用

**構造**:

```
親ドキュメント（索引）     # 200-500行
├── サブディレクトリ/
│   ├── トピック1.md      # 300-800行
│   ├── トピック2.md      # 300-800行
│   └── トピック3.md      # 300-800行
```

**例**: DEPLOYMENT.md（2379行 → 分割済み）

```
DEPLOYMENT.md（222行 - 索引）
├── deployment/
│   ├── git-workflow.md            # AI駆動Git Workflow
│   ├── self-review.md             # セルフレビュー詳細
│   ├── knowledge-management.md    # ナレッジ体系化
│   ├── ai-tools-integration.md    # AIツール統合
│   ├── ci-cd.md                   # CI/CDパイプライン
│   ├── infrastructure.md          # インフラ・ロールバック
│   └── monitoring.md              # モニタリング・運用
```

### AIツールの読み込み戦略

**ステップ1**: 索引ドキュメントを読み、必要なトピックを特定
**ステップ2**: 該当する詳細ドキュメントのみを読み込み
**ステップ3**: 必要に応じて関連ドキュメントを追加読み込み

**例**:

```
ユーザー: 「セルフレビューの方法を教えて」
AI: DEPLOYMENT.md（索引）→ deployment/self-review.md を読み込み
```

### ファイルサイズの目安

| ファイルタイプ                  | 推奨行数 | 上限 | 超えた場合   |
| ------------------------------- | -------- | ---- | ------------ |
| 索引ファイル                    | 200-300  | 500  | -            |
| コアドキュメント（MASTER.md等） | 300-500  | 800  | 階層化分割   |
| 詳細ドキュメント                | 300-800  | 1200 | トピック分割 |

### 分割タイミング

- **800行超**: 分割を検討開始
- **1200行超**: 分割を強く推奨
- **1500行超**: 分割必須

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

毎月1日に以下を確認してください。詳細は第14章「ドキュメント増加の管理戦略」を参照。

### チェックリスト

- [ ] **MASTER.mdからの参照確認**: 新規文書がMASTER.mdから参照されているか
- [ ] **リンク切れ確認**: 参照リンクが有効か
- [ ] **ファイルサイズ確認**: 800行を超えた文書はないか
- [ ] **鮮度確認**: 6ヶ月以上更新されていない文書の内容は現状と合っているか
- [ ] **孤立文書確認**: どこからも参照されていない文書はないか

### アーカイブ対象

以下の条件に該当する文書は `archive/` ディレクトリへ移動を検討：

- 6ヶ月間参照されていない
- 技術的に陳腐化（廃止されたライブラリのADR等）
- 別文書に統合された

## 文書運用ルール

### Frontmatter

コア7文書（MASTER/PROJECT/ARCHITECTURE/DOMAIN/PATTERNS/TESTING/DEPLOYMENT）およびプロジェクトで追加した文書に以下の YAML Frontmatter を付与する。Frontmatter が文書のメタデータの正式なソースとなる。

> **注**: `docs/specs/` 配下の仕様ファイルには Spec Kit 運用ガイドの Front Matter スキーマ（6ステータス: draft/review/approved/implementing/done/deprecated）を適用すること。上記 Frontmatter ルールはコア7文書および拡張文書に適用される。

必須フィールド:

| フィールド | 説明                                                | 例           |
| ---------- | --------------------------------------------------- | ------------ |
| title      | 文書タイトル                                        | ARCHITECTURE |
| version    | セマンティックバージョン                            | 1.2.0        |
| status     | 文書の状態（有効値: `draft`, `review`, `approved`） | draft        |
| owner      | 責任者                                              | @username    |
| created    | 作成日                                              | 2026-01-01   |
| updated    | 最終更新日                                          | 2026-01-15   |

任意フィールド:

| フィールド   | 説明             | 用途                |
| ------------ | ---------------- | ------------------- |
| reviewers    | レビュワー一覧   | 承認フロー管理      |
| tags         | タグ             | 検索・分類          |
| related      | 関連文書         | 相互参照            |
| changeImpact | 最新変更の影響度 | LOW / MEDIUM / HIGH |

### ステータスワークフロー

```text
draft → review → approved
  ↑__________________|
     （修正が必要な場合）
```

| status   | 意味           | AIへの扱い                   |
| -------- | -------------- | ---------------------------- |
| draft    | 作成中・未確定 | 参考情報として扱う           |
| review   | レビュー中     | ほぼ確定だが変更の可能性あり |
| approved | 承認済み       | 正式な仕様として遵守         |

`review` ステータスの文書に対し1週間レビューコメントがなければ、ドキュメントオーナーが `approved` に昇格する。

### バージョニングルール

文書の変更時は影響度に応じてバージョンを更新する。

| 影響度 | 基準                         | バージョン更新    |
| ------ | ---------------------------- | ----------------- |
| LOW    | 誤字修正、文言調整           | パッチ（0.0.x）   |
| MEDIUM | 項目追加、既存概念の拡張     | マイナー（0.x.0） |
| HIGH   | 構造変更、概念の再定義・削除 | メジャー（x.0.0） |

変更時は Frontmatter の `version`、`updated`、`changeImpact` を同時に更新し、末尾の Changelog セクションにエントリを追加すること。`changeImpact` は初版では省略可。初回変更時に Frontmatter へ追加する。

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

- [ ] マジックナンバー/ハードコードがない（定数/設定化、単位・範囲の明示）
- [ ] 定数の配置が層責務に沿っている（Domain/Application/Infrastructure）

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成

#### 変更

- 「関連ドキュメント」のコア7列挙を MASTER+6文書に限定し、品質・セキュリティ拡張を別見出しへ分離
