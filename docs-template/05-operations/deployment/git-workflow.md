# AI駆動Git Workflow

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md)

## 概要

AI開発ツールに最適化されたGit Flowベースのワークフローです。Issue作成からマージ、ナレッジ体系化までをAIツールと協働で効率的に進めます。

**コアサイクル（10ステップ）**: Issue → Branch → Implement → Test → Self-Review → PR → Review → Merge → Cleanup → ACE

> **運用原則**: 本ワークフローは [ワークフロー運用原則](./workflow-principles.md)（ノンストップフロー・スコープ外Issue化・曖昧仕様確認タイミング）に従って運用します。

## 日々の開発フロー（AIにタスクを渡す前）

Issue起点の作業に入る前、書籍第10章「日々の開発フロー」で推奨される**着手前の確認**と、タスクに応じた**参照文書**、**レビュー学習のルール化**を揃えます。ここに書かれた内容を満たしてから「ステップ1: Issue作成」以降（または既存Issueへの実装着手）に進みます。

### AIに渡す前の3確認ポイント

1. **仕様の粒度**  
   受け入れ基準が、検証可能な表現で具体的に書けているか。曖昧なままなら、Issue 本文・コメントで切り分け、必要に応じて [DOMAIN.md](../../02-design/DOMAIN.md) や [PROJECT.md](../../01-context/PROJECT.md) を更新する。

2. **設計の粒度**  
   採用アーキテクチャ・禁止事項・データの流れなど、実装者（人間・AI）と共有できる制約が [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md) / [MASTER.md](../../MASTER.md) レベルで示されているか。分岐点が複数あれば **ADR（設計判断）が必要**かを判定し、必要なら [DECISIONS.md](../../06-reference/DECISIONS.md) へ記録してから手を付ける。

3. **テストの粒度**  
   テストは仕様の「証明」ではなく、受け入れ基準の「確認手段」に留まっているか。テストだけを読むと仕様が補完されてしまっていないか、仕様文書（Issue・DOMAIN 等）と [TESTING.md](../../04-quality/TESTING.md) の役割が混線していないかを見直す。

### タスク種別×参照文書

コア7文書を前提に、タスクの種類ごとに「最初に開く文書」の優先度を揃えます。パスはテンプレート内の本リポジトリ相対表記（プロジェクト展開時は自プロジェクトの `docs/` 配下に置き換え）です。

| タスク種別       | 必須参照                                                                                                                                                                          | 推奨参照                                                                                      | 通常不要                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 新機能           | [MASTER.md](../../MASTER.md), [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md), [DOMAIN.md](../../02-design/DOMAIN.md)                                                          | [PATTERNS.md](../../03-implementation/PATTERNS.md), [TESTING.md](../../04-quality/TESTING.md) | [DEPLOYMENT.md](../DEPLOYMENT.md)                                                     |
| バグ修正         | 該当 **バグチケット**（[GitHub Issue](https://docs.github.com/ja/issues) や Jira 等。Issue 相当でよい。再現手順・期待値必須）, [PATTERNS.md](../../03-implementation/PATTERNS.md) | [TESTING.md](../../04-quality/TESTING.md)                                                     | [DOMAIN.md](../../02-design/DOMAIN.md) 全体（修正箇所に紐づく節のみを読む方が効率的） |
| リファクタリング | [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md), [PATTERNS.md](../../03-implementation/PATTERNS.md)                                                                            | [TESTING.md](../../04-quality/TESTING.md)                                                     | [DOMAIN.md](../../02-design/DOMAIN.md)（挙動を変えない作業の場合）                    |
| インフラ         | [MASTER.md](../../MASTER.md), [DEPLOYMENT.md](../DEPLOYMENT.md)                                                                                                                   | [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md)                                            | [DOMAIN.md](../../02-design/DOMAIN.md)（業務ルール非関連の範囲）                      |
| ドキュメント     | [MASTER.md](../../MASTER.md)（構造・表記のSSOT）                                                                                                                                  | 今回更新する対象文書のみ                                                                      | 他のコア7文書の全文精読（今回の編集範囲外なら不要）                                   |

> **表の読み方**: 「必須」は実装前に目を通すこと。「通常不要」は、タスクがその領域に手を入れない限り、最初から全文を読まなくてよいという意味合いです。ドキュメント作業では「必須」に [MASTER.md](../../MASTER.md) を入れているため、**更新しないコア7文書を上から下まで読む**ことは原則不要（必要な章だけ差分でよい）です。

### レビュー指摘から PATTERNS.md へのルール化

同じ指摘・同テーマの学びが繰り返されたとき、段階的に文書化の深さを上げます。閾値は目安（チームで [PATTERNS.md](../../03-implementation/PATTERNS.md) の方針に合わせて調整可）。

1. **1回目**  
   レビュー指摘内容と対応方針を、該当 **Issue / PR コメント**にメモとして残す（次の実装者が検索できる形で）。

2. **2回目**  
   同種の学びが再発したら、[LESSONS_LEARNED.md](../../08-knowledge/LESSONS_LEARNED.md) に**再現条件・正しい扱い・例**を追記する（ナラティブな教訓として保持）。

3. **3回目**  
   同じ系統の指摘が3回目に到達したら、再発防止の**ルール**として [PATTERNS.md](../../03-implementation/PATTERNS.md) に追記する。ここまで来たら **Lint ルール、テンプレート、チェックリストへの組み込み**（＝可能な限りの自動化）を検討するタイミングとする。

## ブランチ戦略

### ブランチ構造（Git Flow準拠）

```
main/master    ← 本番リリース用（常時デプロイ可能な状態）
  ↑
develop       ← 開発統合ブランチ（次期リリース候補）
  ↑
feature/*     ← 機能開発ブランチ（Issueベース）
hotfix/*      ← 緊急修正ブランチ（mainから分岐）
release/*     ← リリース準備ブランチ（developから分岐）
```

### ブランチ命名規則

- `feature/{issue-number}-{short-description}` 例: `feature/123-user-auth`
- `hotfix/{issue-number}-{short-description}` 例: `hotfix/456-security-patch`
- `release/{version}` 例: `release/1.2.0`

## ワークフローステップ

### ステップ1: Issue作成

**原則**: 全ての作業は必ずIssueから開始する

```bash
# GitHub CLIでIssueを作成
ISSUE_URL=$(gh issue create \
  --title "feat: ユーザー認証機能を実装" \
  --body "## 概要
[実装内容の説明]

## 受入基準
- [ ] [基準1]
- [ ] [基準2]" \
  --label "enhancement" \
  --assignee "@me")

# Issue番号を抽出
ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oE '[0-9]+$')
```

**ポイント**:

- Issue番号は自動抽出（競合回避）
- 受入基準を明確にする

### ステップ2: ブランチ作成

**原則**: 必ずdevelopの最新から分岐する

```bash
# ブランチ作成
git checkout develop
git pull origin develop
git checkout -b "feature/${ISSUE_NUM}-user-auth"
```

**ポイント**:

- ブランチ名にIssue番号を含める
- 必ずdevelopの最新から分岐

### ステップ3: AI駆動実装とコミット（Implement）

**原則**: MASTER.md、PATTERNS.md、TESTING.mdの仕様に従いAIツールで実装

#### 作業中の判断ログ: `implementation-notes.md` を並走させる

実装着手と同時に **作業ブランチ直下** に `implementation-notes.md` を作成し、コミットと一緒に追記する。コミット diff には残らない「なぜこの選択をしたか / spec から変えた点 / 捨てた選択肢」を保持することで、ステップ5（Self-Review）の精度とステップ10（ACE Generate）の入力品質が上がる。詳細根拠は [ACE-034](../../08-knowledge/PLAYBOOK.md#ace-034)。

最小ひな形（コピペして使う）:

```markdown
# Implementation Notes - #<ISSUE_NUM>

## Decisions not in spec

-

## Changes from spec

-

## Tradeoffs

-

## Open questions / TODO

-
```

**運用ルール**:

- **書くタイミングは「気付いた瞬間」**: 後で書こうとすると確実に忘れる（[ACE-032](../../08-knowledge/PLAYBOOK.md#ace-032) の発見経緯と同じ構造）
- **粒度は 1〜3 行**: 「なぜ A ではなく B を選んだか」を短文で残す
- **スコープ外発見は本ファイルではなく Issue 化**: implementation-notes は「現 PR の判断ログ」、Issue は「別タスクへの分岐」と役割を分ける（[ワークフロー運用原則 原則2](./workflow-principles.md)）
- **PR 作成時に PR description に転記**: ステップ6 でレビュアーが「なぜ」を読みやすくなる
- **マージ前にファイルを削除する（推奨）**: squash merge を標準とするチームでは、ファイルを残すと次 PR がルート直下で衝突する。pr-ready 直前に PR description へ転記 → `git rm implementation-notes.md` → 1 commit で削除。長期保存したい場合は `notes/<issue-num>.md` 形式で per-PR ファイル化する代替案あり（並行 PR で衝突しないが notes/ が累積するトレードオフ）

#### コミット

```bash
# AIツール（Claude Code等）で実装後、コミット
git add .
git commit -m "feat: ユーザー認証機能を実装

- JWTベースの認証ミドルウェアを追加
- ログイン/ログアウトエンドポイントを実装
- 認証関連の単体テストを追加（カバレッジ85%）

参照:
- docs/MASTER.md:29 (認証方式)
- docs/PATTERNS.md:145 (エラーハンドリング)

Closes #${ISSUE_NUM}

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**コミットメッセージの原則**:

- 変更内容を簡潔に記載
- 参照したドキュメントの場所を明記
- Issue番号を含める（`Closes #123`）
- AIツールの記載を含める

### ステップ4: テスト・検証（Test）

**目的**: 実装の品質を客観的な指標で確認する

#### 自動テストの実行

```bash
# Linter（静的解析）
npm run lint

# 型チェック
npm run type-check

# テスト実行+カバレッジ
npm run test -- --coverage

# セキュリティスキャン
npm audit --audit-level=moderate
```

#### 合格基準

| 項目             | 基準                    |
| ---------------- | ----------------------- |
| Linter           | エラー0件               |
| 型チェック       | エラー0件               |
| テストカバレッジ | 80%以上                 |
| セキュリティ     | moderate以上の脆弱性0件 |

**ポイント**: 全テスト通過後にセルフレビュー（ステップ5）へ進む

### ステップ5: セルフレビュー（PR作成前）【重要】

**目的**: PRレビュー時の単純な指摘を事前に防ぎ、レビュー品質を向上させる

#### セルフレビューの5つの観点

**1. コーディング規約の遵守**

- マジックナンバーが存在しないか
- 型安全性が確保されているか（any型の不適切な使用）
- エラーハンドリングが適切か
- 命名規則に従っているか
- 未使用のインポート/変数がないか

**2. 仕様との整合性確認**

- 要件定義通りに実装されているか（PROJECT.md）
- アーキテクチャパターンに従っているか（ARCHITECTURE.md）
- ビジネスロジックが仕様通りか（DOMAIN.md）
- セキュリティ要件を満たしているか（MASTER.md）

**3. テストの充実度確認**

- 単体テストのカバレッジが80%以上
- エッジケースのテストが含まれているか
- エラーハンドリングのテストがあるか
- テストの可読性は十分か

**4. パフォーマンスとセキュリティの確認**

- N+1クエリ問題がないか
- 不要なループ処理がないか
- 入力値のサニタイゼーションが適切か
- SQLインジェクション/XSS対策が施されているか
- 機密情報のハードコーディングがないか

**5. ドキュメントの更新確認**

- README.mdの更新が必要か
- API仕様書の更新が必要か
- ARCHITECTURE.mdの更新が必要か
- 関連する技術文書の更新が必要か

#### セルフレビューの実行方法

**AIツールによる対話的レビュー（推奨）**:

```
プロンプト例:
「以下の観点で、今回のコミット内容をレビューしてください：

1. コーディング規約（docs/MASTER.md、docs/PATTERNS.md）
2. 仕様との整合性（docs/PROJECT.md、docs/ARCHITECTURE.md、docs/DOMAIN.md）
3. テスト充実度（docs/TESTING.md）
4. パフォーマンスとセキュリティ
5. ドキュメント更新の必要性

各観点について、問題点と改善提案を具体的に指摘してください。」
```

#### Review Toolkit（Claude Code サブエージェント）

Claude Codeのpr-review-toolkitサブエージェントを活用した包括的なセルフレビューが可能です：

| サブエージェント        | 役割                       | 主な検出対象                       |
| ----------------------- | -------------------------- | ---------------------------------- |
| `code-reviewer`         | コード品質の包括的レビュー | 設計問題、命名規則違反、コード重複 |
| `silent-failure-hunter` | エラーハンドリング漏れ検出 | 未処理例外、空catch、暗黙的失敗    |
| `type-design-analyzer`  | 型設計の妥当性分析         | any型使用、型の粒度不足            |
| `pr-test-analyzer`      | テスト品質の分析           | カバレッジ不足、エッジケース欠落   |
| `comment-analyzer`      | コメント・ドキュメント品質 | 不正確なコメント、JSDoc欠落        |
| `code-simplifier`       | 複雑度の削減提案           | 長関数、深いネスト                 |

**Codex CLI クロスモデルレビュー（推奨）**:

Claude系（Toolkit）とGPT系（Codex CLI）で異なるモデルの観点からレビューし、品質を向上させます。
詳細は [Multi-CLI Review Orchestration](./multi-cli-review-orchestration.md#クロスモデルレビュー推奨パターン) を参照してください。

```bash
# Toolkit セルフレビュー後に実行
bash scripts/codex-review.sh --branch
```

> **レビュー結果の対応**: 全てのレビュー結果は [PRレビュー対応ポリシー](./review-response-policy.md) に従って対応します。Critical/Warning は確認不要で即対応。

**Claude Code + Husky 自動レビュー**:

コミット時に自動でAIレビューを実行するシステムを導入できます。
詳細は [自動コードレビュー](./automated-code-review.md) を参照してください。

**Multi-CLI 分散レビュー（5 CLI統合）**:

5つのAI CLIを統一的にオーケストレーションする包括的レビューも利用可能です。
詳細は [Multi-CLI Review Orchestration](./multi-cli-review-orchestration.md) を参照してください。

**ベストプラクティス**:

- セルフレビューは15-30分程度で完了させる
- 指摘事項は [Review Response Policy](./review-response-policy.md) に従い即座に修正
- 問題点は全て記録（ナレッジ蓄積のため）

#### セルフレビュー結果の記録

PR本文にセルフレビュー結果を含めることで、レビュワーに品質保証の証跡を提供します。

```markdown
## セルフレビュー結果

### チェック項目

#### 1. コーディング規約

- ✅ マジックナンバー: 問題なし（全て定数化済み）
- ✅ 型安全性: 問題なし（any型使用なし）
- ✅ エラーハンドリング: 問題なし（Result patternで統一）

#### 2. 仕様との整合性

- ✅ 要件定義: PROJECT.md#3.2の要件を全て実装
- ✅ アーキテクチャ: Clean Architectureに準拠

#### 3. テスト充実度

- ✅ カバレッジ: 85.3%（目標80%を達成）
- ✅ エッジケース: 境界値テスト実装済み

#### 4. パフォーマンス・セキュリティ

- ✅ N+1クエリ: 問題なし
- ✅ 認証・認可: JWT検証を実装

#### 5. ドキュメント更新

- ✅ README.md: 認証セクションを追加
- ✅ API仕様書: 新規エンドポイントを記載

### 結論

すべての必須項目をクリアしています。PR作成準備完了。
```

### ステップ6: Pull Request作成

**原則**: PRは自己完結型（レビュワーが全体像を把握できる情報を含める）

```bash
# ブランチをプッシュ
git push -u origin "feature/${ISSUE_NUM}-user-auth"

# PRを作成
gh pr create \
  --base develop \
  --title "feat: ユーザー認証機能を実装" \
  --body "## 概要
ユーザー認証機能をJWTベースで実装しました。

## 変更内容
- 認証ミドルウェアの追加 (src/middleware/auth.ts:1-85)
- ログイン/ログアウトAPI実装 (src/routes/auth.ts:12-156)
- リフレッシュトークン機構 (src/services/token.ts:45-120)

## テスト結果
- 単体テスト: 42件 全てパス
- カバレッジ: 85.3%

## セルフレビュー結果
[上記のセルフレビュー結果を記載]

## チェックリスト
- [x] MASTER.mdのコード生成ルールに準拠
- [x] マジックナンバー禁止ルールを遵守
- [x] 型安全性を確保
- [x] テストカバレッジ80%以上達成

## 関連Issue
Closes #${ISSUE_NUM}

🤖 Generated with [Claude Code](https://claude.com/claude-code)" \
  --label "enhancement" \
  --reviewer "team-lead"
```

**PRの原則**:

- タイトルは変更内容を端的に表現
- 変更ファイルと行番号を明記
- テスト結果を含める
- セルフレビュー結果を含める

### ステップ7: レビュー対応（Review）

#### 7a. AIレビュールーターによるレビュー（PR作成後）

**原則**: PR作成後、マージ前に `@review-router` エージェントで包括的なレビューを実施する

> **動作**: `@review-router` は変更内容を分析し、[`.github/agents/`](../../../.github/agents/) 配下に定義された個別レビューエージェント（`code-reviewer`、`error-handler-hunter` 等）に処理を振り分けます。各エージェントの定義は同ディレクトリ内の `*.agent.md` ファイルを参照してください。

#### 実行方法

VS Code の Copilot Chat で以下を入力：

```text
@review-router このPRをレビューして
```

#### ルーターの動作

`@review-router` は変更内容を自動分析し、以下のスキルを判定・実行します：

| スキル               | 実行条件                               |
| -------------------- | -------------------------------------- |
| Code Review          | 常に実行（必須）                       |
| Error Handler Hunt   | 常に実行（必須）                       |
| Test Analysis        | テストファイルの追加・変更がある場合   |
| Type Design Analysis | 型定義の追加・変更がある場合           |
| Comment Analysis     | ドキュメント・コメントの変更がある場合 |
| Code Simplification  | 30行超の関数、深いネストがある場合     |

#### 統合レポートの確認

ルーターは1つの統合レポートを出力します。以下の判定結果に従って対応してください：

| 判定             | 意味               | 対応               |
| ---------------- | ------------------ | ------------------ |
| `PASS`           | 問題なし           | マージ可能         |
| `NEEDS_WORK`     | 改善推奨の問題あり | 修正後に再レビュー |
| `CRITICAL_BLOCK` | 重大な問題あり     | 必ず修正が必要     |

#### 特定スキルのみ実行する場合

```text
@review-router テスト分析だけ
@review-router 型設計を分析して
@review-router エラーハンドリングを検査して
```

#### 7b. AI支援レビュー対応

**原則**: レビュー指摘には**必ずスレッド形式で返信**し、修正内容を明確にする

#### 重要：レビュワーへのコメント必須

**レビュー指摘を修正したら、必ずレビュワーに対してコメントを残すこと**

レビュワーへのコメントには以下を含める：

1. **感謝の言葉** - 指摘してくれたことへの感謝
2. **修正内容の説明** - 何をどう修正したか
3. **変更箇所の明示** - ファイル名と行番号
4. **再レビュー依頼** - AIレビューツールの場合はコマンドを含める

#### レビュー指摘への対応フロー

```bash
# 1. PR上の指摘コメントを確認
gh pr view ${PR_NUMBER} --comments

# 2. 未解決スレッドを取得
gh api graphql -f query='
query {
  repository(owner: "OWNER", name: "REPO") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 20) {
        nodes {
          id
          isResolved
          comments(first: 3) {
            nodes {
              author { login }
              body
            }
          }
        }
      }
    }
  }
}'

# 3. 修正実装
# (AIツールで修正)

# 4. コミット＆Push
git add .
git commit -m "fix: レビュー指摘対応 - [具体的な修正内容]

レビュワー: @[reviewer-name]
指摘内容: [指摘の要約]

参照: [ファイル名:行番号]"
git push

# 5. 【重要】スレッドに返信（レビュワー向けコメント）
THREAD_ID="PRRT_xxxxx"
gh api graphql -F body="@[reviewer-name] 様

ご指摘ありがとうございます。修正いたしました。

## 修正内容
- [具体的な修正内容を詳しく説明]
- [なぜその修正方法を選んだかの理由]

## 変更箇所
- [ファイル名:行番号]

## 確認方法
\`\`\`bash
# 修正内容を確認するコマンド（あれば）
\`\`\`

ご確認のほど、よろしくお願いいたします。

/gemini review

🤖 Claude Code" -f query='
mutation($body: String!) {
  addPullRequestReviewThreadReply(input: {
    pullRequestReviewThreadId: "'"$THREAD_ID"'"
    body: $body
  }) {
    comment { id }
  }
}'
```

**AIツール別の再レビューコマンド**:

| AIツール           | コマンド                | 場所             |
| ------------------ | ----------------------- | ---------------- |
| Gemini Code Assist | `/gemini review`        | 返信の最後に記載 |
| GitHub Copilot     | `@githubcopilot review` | 返信の最後に記載 |

**レビュー対応の原則**:

- 必ずスレッド形式で返信（一般コメントではない）
- 修正内容を明確に記載
- ファイル名・行番号を含める
- 再レビューコマンドを忘れずに

#### レビュー対応のベストプラクティス

**良いコメントの例**:

```markdown
@reviewer-name 様

ご指摘ありがとうございます。以下の通り修正いたしました。

## 修正内容

- `validateToken` 関数のエラーハンドリングを改善
- 期限切れトークンと不正トークンを明示的に区別
- カスタムエラークラス `TokenExpiredError` を導入

## 変更箇所

- src/middleware/auth.ts:45-67

## 修正の理由

期限切れと不正トークンを区別することで、クライアント側で適切なエラーメッセージを表示できるようにしました。

## テスト

- 期限切れトークンのテストケースを追加 (tests/auth.test.ts:123-145)
- 不正トークンのテストケースを追加 (tests/auth.test.ts:147-169)

ご確認のほど、よろしくお願いいたします。

/gemini review
```

**悪いコメントの例**: 「修正しました。」「指摘された箇所を直しました。」→ 具体性がなく、レビュワーが再度コードを読む必要がある

**コメント作成のチェックリスト**:

- [ ] 修正内容を具体的に説明
- [ ] 変更ファイルと行番号を明記
- [ ] 修正理由を説明
- [ ] 再レビュー依頼のコマンドを含める

### ステップ8: マージ（Merge）

**原則**: Squash mergeでコミット履歴を整理

```bash
# レビュー承認後、Squash mergeでマージ
gh pr merge ${PR_NUMBER} \
  --squash \
  --delete-branch \
  --body "All checks passed. Merging to develop."
```

**マージの原則**:

- Squash merge推奨（履歴を整理）
- `--delete-branch` でリモートブランチを自動削除

### ステップ9: クリーンアップ（Cleanup）

**原則**: ブランチは速やかに削除し、developを最新に更新

```bash
# developブランチに戻る
git checkout develop
git pull origin develop

# ローカルブランチ削除（リモートは自動削除済み）
git branch -d "feature/${ISSUE_NUM}-user-auth"

# リモートで削除済みの追跡ブランチをローカルから一括削除
git fetch --prune
```

**ポイント**:

- ブランチは必ず削除（リモート・ローカル両方）
- developを最新に更新してから次の作業へ

### ステップ10: ACE ナレッジ体系化（マージ後）【重要】

**目的**: 開発プロセスで得た知見を体系的に整理し、チーム全体で共有可能な資産として蓄積する

**実行タイミング**: マージ後・cleanup 後（develop ブランチで実行）

> **書籍ギャップとの関係**: 当初は「ステップ 8: ACE（マージ前、feature branch で実行）」としていたが、PR レビュー指摘の修正サイクルが完了してから知見が確定するパターンが多く、マージ後 develop で実行する方が自然なフローになる（PR #395 ・PR #396 で順序見直し）。

#### ナレッジ体系化の対象

以下のいずれかに該当する場合、ナレッジとして記録する価値があります：

1. **レビュー指摘があり、対応した場合**
   - 指摘内容と対応方法
   - なぜその問題が発生したかの分析
   - 再発防止策

2. **技術的な困難に直面し、解決した場合**
   - 問題の詳細と原因
   - 試行錯誤のプロセス
   - 最終的な解決方法

3. **新しい技術・ライブラリを導入した場合**
   - 選定理由と比較検討内容
   - 導入手順とハマりポイント
   - ベストプラクティス

4. **パフォーマンス改善を実施した場合**
   - 改善前後の指標
   - 改善手法の詳細
   - 効果測定結果

5. **セキュリティ対策を実装した場合**
   - 脅威の内容
   - 対策の詳細
   - 検証方法

#### ナレッジ分類体系（GitHub Discussions）

| カテゴリ               | 説明                               | タグ例                                 |
| ---------------------- | ---------------------------------- | -------------------------------------- |
| トラブルシューティング | エラー解決方法、デバッグ手法       | `troubleshooting`, `debugging`         |
| ベストプラクティス     | コーディング規約、設計パターン     | `best-practice`, `design-pattern`      |
| 技術選定               | ライブラリ・フレームワーク選定理由 | `tech-selection`, `library-comparison` |
| パフォーマンス         | 最適化手法、チューニング方法       | `performance`, `optimization`          |
| セキュリティ           | 脆弱性対策、セキュアコーディング   | `security`, `vulnerability`            |
| 開発環境               | 環境構築、ツール設定               | `development-env`, `tooling`           |
| テスト戦略             | テスト手法、自動化                 | `testing`, `test-automation`           |
| CI/CD                  | パイプライン、デプロイ             | `ci-cd`, `deployment`                  |

#### ナレッジ記録の実行方法

**AIツールによる自動生成（推奨）**:

```
プロンプト例:
「今回のIssue #${ISSUE_NUM}とPR #${PR_NUMBER}の内容を分析し、
GitHub Discussionsに登録すべきナレッジを抽出してください。

以下の情報を含めて、Discussion投稿用のMarkdownを生成してください：

1. タイトル: 問題を端的に表現
2. カテゴリ: 適切なカテゴリを選択
3. タグ: 関連するタグを3-5個
4. 問題の概要: 何が問題だったか
5. 原因分析: なぜ問題が発生したか
6. 解決方法: どのように解決したか（コード例含む）
7. 学んだこと: 今後に活かせる知見
8. 関連リソース: Issue、PR、ドキュメントへのリンク」
```

**ナレッジテンプレート**:

````markdown
# [タイトル]: 簡潔で検索しやすい表現

## メタ情報

- カテゴリ: [カテゴリ名]
- タグ: `tag1`, `tag2`, `tag3`
- 関連Issue: #${ISSUE_NUM}
- 関連PR: #${PR_NUMBER}
- 記録日: YYYY-MM-DD

## 問題の概要

[何が問題だったか、何を実現したかったか]

## 原因分析

[問題の根本原因は何か]

## 解決方法

### 実装内容

```[language]
// コード例
```

### 手順

1. [ステップ1]
2. [ステップ2]

### 注意点

- [注意すべきポイント]

## 効果・結果

- [改善された指標やフィードバック]

## 学んだこと

[今後に活かせる知見、一般化できる教訓]

## 関連リソース

- Issue: #${ISSUE_NUM}
- PR: #${PR_NUMBER}
- ドキュメント: docs/XXX.md:行番号

## 検証方法

[この解決方法が正しく機能することを確認する方法]
````

#### GitHub Discussionsへの登録手順

```bash
# 1. 類似のDiscussionが存在するか検索
gh search discussions --repo OWNER/REPO "[キーワード]"

# 2. 新規Discussionを作成
gh discussion create \
  --repo OWNER/REPO \
  --category "ベストプラクティス" \
  --title "[JWT認証] トークンリフレッシュ時のエラーハンドリング" \
  --body-file /tmp/knowledge-${ISSUE_NUM}.md

# 3. Discussion URLを記録（Issueにコメント）
gh issue comment ${ISSUE_NUM} --body "ナレッジをDiscussionsに登録しました: [URL]"
```

**ナレッジ体系化の原則**:

- 類似Discussionが存在する場合は更新（新規作成しない）
- タイトルは検索しやすい表現にする
- コード例は最小限かつ実用的に
- 記録したナレッジはIssueにリンクを残す

#### ACE Playbook 更新（推奨）

GitHub Discussions への記録に加え、ACE Playbook への構造化記録を推奨します。

**ACE サイクル** (Generate → Reflect → Curate):

1. **Generate**: PR diff・レビューコメントから知見を抽出
2. **Reflect**: 既存 Playbook エントリとの重複・矛盾を照合
3. **Curate**: PLAYBOOK.md 末尾にエントリを追記

詳細手順: [ace-cycle.md](./ace-cycle.md)

**ナレッジ記録の使い分け**:

- **GitHub Discussions**: 人間向けナラティブ（物語的記録）
- **ACE Playbook**: AIツール向け構造化知見（delta方式）

<a id="ace-merge-policy"></a>

#### 運用パターン（マージ方針）

> このセクションが ACE 知見コミットのマージ方針の **SSOT**。ace-cycle.md / ace-curate.md はここを参照する。

**既定（推奨）— develop 直マージ**: マージ・cleanup 後の develop で `/ace-curate <PR番号>` を実行し、PLAYBOOK.md 追記を **develop に直接 commit + push** する。PLAYBOOK.md は append-only で構造化されており、ID も PRスコープ式（[エントリID規則](../../08-knowledge/PLAYBOOK.md#エントリid規則)）で衝突しないため、ACE 1 サイクル分の小さな知見追加を毎回 PR 化するのは過剰なオーバーヘッド。

**任意エスカレーション — chore PR**: 大人数チーム、または知見内容自体をレビューに残したい場合のみ、develop から `chore/ace-from-pr-<PR番号>` ブランチを切り、PLAYBOOK.md 追記を小さい chore PR として PR レビュー → squash merge する。

> **ACE-012 との関係（混同しないこと）**: [ACE-012](../../08-knowledge/PLAYBOOK.md#ace-012) は _うっかり_ feature 作業を develop に直接 push してしまう事故（ブランチ切り替わりの見落とし）を防ぐルール。一方、本セクションの「develop 直マージ」は `knowledge:` プレフィックス付きの **PLAYBOOK 単独コミット** に限定した _意図的・承認済み_ のフローであり、両者は別物。ACE-012 は引き続き有効（deprecated にしない）。

## タスク管理（Task Tracking）

ワークフローの進捗は TodoWrite で管理します。詳細は [ワークフロー運用原則](./workflow-principles.md#タスク管理-todowrite) を参照してください。

**標準チェックリスト**:

```
1. [ ] GitHub Issue 作成
2. [ ] feature ブランチ作成
3. [ ] 実装
4. [ ] テスト実行・合格確認
5. [ ] セルフレビュー: PR Review Toolkit
6. [ ] セルフレビュー: Codex CLI クロスモデルレビュー
7. [ ] レビュー指摘修正・コミット
8. [ ] Push + PR 作成
```

## ワークフロー全体のベストプラクティス

### 1. Issue駆動開発の徹底

- 全ての作業はIssueから開始
- Issue番号を必ずブランチ名・コミットメッセージに含める
- Issueテンプレートを活用して情報を標準化

### 2. 小さく頻繁なコミット

- 機能単位で小さくコミット
- コミットメッセージは変更理由を明確に
- セルフレビューはコミット毎に実施

### 3. AIツールの積極的活用

- コード生成だけでなくレビューにも活用
- MASTER.md等のドキュメントを常に参照させる
- セルフレビューとナレッジ抽出を自動化

### 4. PRサイズの適切な管理

- 1つのPRは1つの機能に集中
- 変更ファイル数は10ファイル以内推奨
- 大きな変更は複数のIssue/PRに分割

### 5. ナレッジの継続的蓄積

- マージ後 cleanup を済ませた develop で ACE ナレッジ体系化を実施
- GitHub Discussionsを積極的に活用
- 定期的にナレッジを見直し・更新

### 6. ブランチの清潔性維持

- マージ後は速やかにブランチ削除
- 長期間放置されたブランチは定期的にクリーンアップ
- developは常に最新かつデプロイ可能な状態に保つ

## トラブルシューティング

### マージコンフリクトが発生した場合

```bash
# developの最新を取得
git checkout develop
git pull origin develop

# featureブランチにマージ
git checkout feature/${ISSUE_NUM}-xxx
git merge develop

# コンフリクト解決後
git add .
git commit -m "chore: マージコンフリクトを解決"
git push
```

### PRレビューが長期化した場合

developの変更を定期的に取り込み（`git merge develop`）、PRコメントで状況を報告します。

### セルフレビューで重大な問題を発見した場合

軽微な問題は修正してコミット追加。重大な問題はPRをクローズし、新しいIssueで再設計します。

## まとめ

このAI駆動Git Workflowは、以下を実現します：

1. **効率的な開発**: AIツールを活用して開発速度を向上
2. **高品質なコード**: セルフレビューで品質を事前確保
3. **組織的な知見蓄積**: ナレッジ体系化でチーム全体のスキルアップ
4. **透明性の高いプロセス**: Issue駆動でトレーサビリティを確保
5. **継続的改善**: フィードバックループを通じてプロセスを進化

ワークフローは形式ではなく、チームの生産性向上と品質確保のための手段です。状況に応じて柔軟に調整してください。
