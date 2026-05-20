# Knowledge Management (ナレッジ体系化)

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Workflow Step**: 10

## 概要

**目的**: 開発プロセスで得た知見を体系的に整理し、チーム全体で共有可能な資産として蓄積する

マージ後・cleanup 後に、今回のIssue対応で得られた知見を分類・整理し、GitHub Discussionsに登録します。これにより、将来的な類似問題の解決時間を短縮し、チーム全体の開発効率を向上させます。

---

## ナレッジ体系化の対象

以下のいずれかに該当する場合、ナレッジとして記録する価値があります：

1. **レビュー指摘があり、対応した場合**
   - 指摘内容と対応方法を記録
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

---

## ACE Playbook 連携（推奨）

既存の GitHub Discussions によるナレッジ管理に加え、ACE (Agentic Context Engineering) Playbook への構造化記録を推奨します。

### なぜ Playbook が必要か

GitHub Discussions は **人間が読むためのナラティブ（物語的記録）** として優れていますが、AIツールが自動参照するには構造化が不足しています。Playbook は **AIツールが直接参照できる形式** で知見を蓄積し、次回タスクで自動的に活用されます。

### 推奨フロー（マージ後・cleanup 後）

1. **ACE サイクルを実行** → Playbook にエントリ追記
2. **重要な知見は GitHub Discussions にも投稿**（任意）
3. **相互参照を記録**:
   - Playbook エントリの Context に「詳細は Discussion #XX を参照」
   - Discussion 本文に「ACE Playbook (ACE-XXX) にも構造化記録済み」

### 使い分け

| 観点     | ACE Playbook               | GitHub Discussions     |
| -------- | -------------------------- | ---------------------- |
| 対象読者 | AIツール（+ 人間）         | チームメンバー（人間） |
| 形式     | 構造化テーブル + 短文      | 自由記述               |
| 更新頻度 | 毎回のマージ後・cleanup 後 | 重要な知見のみ         |

### Playbook エントリの anchor 規則

- 命名規則の SSOT は [PLAYBOOK.md 記述ガイドライン](../../08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照（フォーマット・参照リンク形式の正典）。
- 実装手順は [ace-cycle.md Phase 3](./ace-cycle.md) を参照。

詳細: [ace-cycle.md](./ace-cycle.md)

マージ後のキャプチャを **人手から切り離す** 場合は、[ace-autonomous.md](./ace-autonomous.md) の autonomous パターン（feature flag・garden wall・shadow 運用）を参照してください。

---

## ナレッジ分類体系

GitHub Discussionsでは、以下のカテゴリで分類します：

| カテゴリ                   | 説明                               | タグ例                                                |
| -------------------------- | ---------------------------------- | ----------------------------------------------------- |
| **トラブルシューティング** | エラー解決方法、デバッグ手法       | `troubleshooting`, `debugging`, `error-resolution`    |
| **ベストプラクティス**     | コーディング規約、設計パターン     | `best-practice`, `coding-standards`, `design-pattern` |
| **技術選定**               | ライブラリ・フレームワーク選定理由 | `tech-selection`, `library-comparison`, `framework`   |
| **パフォーマンス**         | 最適化手法、チューニング方法       | `performance`, `optimization`, `tuning`               |
| **セキュリティ**           | 脆弱性対策、セキュアコーディング   | `security`, `vulnerability`, `secure-coding`          |
| **開発環境**               | 環境構築、ツール設定               | `development-env`, `tooling`, `setup`                 |
| **テスト戦略**             | テスト手法、自動化                 | `testing`, `test-automation`, `qa`                    |
| **CI/CD**                  | パイプライン、デプロイ             | `ci-cd`, `deployment`, `automation`                   |

---

## ナレッジ記録の実行方法（推奨）

### AIツールによる自動生成

```bash
# AIツール（Claude Code等）に以下を指示
"""
今回のIssue #${ISSUE_NUM}（${ISSUE_TITLE}）とPR #${PR_NUMBER}の内容を分析し、
GitHub Discussionsに登録すべきナレッジを抽出してください。

以下の情報を含めて、Discussion投稿用のMarkdownを生成してください：

1. **タイトル**: 問題を端的に表現（例: 「JWT認証でトークンリフレッシュ時にエラーが発生する問題の解決」）
2. **カテゴリ**: 適切なカテゴリを選択
3. **タグ**: 関連するタグを3-5個
4. **問題の概要**: 何が問題だったか
5. **原因分析**: なぜ問題が発生したか
6. **解決方法**: どのように解決したか（コード例含む）
7. **学んだこと**: 今後に活かせる知見
8. **関連リソース**: Issue、PR、ドキュメントへのリンク
9. **再現手順**（該当する場合）
10. **検証方法**: 解決を確認した方法

また、既存のDiscussionに類似内容がある場合は、更新すべき箇所を指摘してください。
"""

# AIが生成したMarkdownを確認
# → /tmp/knowledge-${ISSUE_NUM}.md に保存
```

### テンプレート参照

手動作成が必要な場合は、親ドキュメント（DEPLOYMENT.md）のテンプレートを参照してください。

---

## GitHub Discussionsへの登録手順

### ステップ1: 既存Discussionの検索

```bash
# 類似のDiscussionが存在するか検索
gh search discussions --repo OWNER/REPO "[キーワード]"

# 例: JWT認証関連の既存Discussionを検索
gh search discussions --repo myorg/myrepo "JWT OR 認証 OR authentication"
```

### ステップ2: 新規Discussionの作成

```bash
# 新規Discussionを作成
gh discussion create \
  --repo OWNER/REPO \
  --category "ベストプラクティス" \
  --title "[JWT認証] トークンリフレッシュ時のエラーハンドリング" \
  --body-file /tmp/knowledge-${ISSUE_NUM}.md

# 成功時: Discussion URLが返される
# https://github.com/myorg/myrepo/discussions/45
```

### ステップ3: Issueへのリンク追加

```bash
# Issue本文にDiscussionへのリンクを追加
gh issue comment ${ISSUE_NUM} --body "ナレッジをGitHub Discussionsに記録しました: https://github.com/OWNER/REPO/discussions/XX"

# PRにもコメント追加
gh pr comment ${PR_NUMBER} --body "ナレッジをGitHub Discussionsに記録しました: https://github.com/OWNER/REPO/discussions/XX"
```

---

## ベストプラクティス

### 1. タイトルは検索可能に

- 具体的なキーワードを含める
- 「〜の問題」「〜の実装方法」など、検索意図が明確
- 例: ❌「認証の問題」 → ✅「JWT認証でトークンリフレッシュ時に401エラーが発生する問題」

### 2. コード例は最小限かつ実用的に

- 再現可能なコード片を提供
- 必要な依存関係やインポート文も含める
- コメントで説明を追加

### 3. 定期的なメンテナンス

- 古くなった情報は更新または非推奨マーク
- 新しい解決方法が見つかったら追記
- 四半期に一度、ナレッジベースをレビュー

### 4. タグ付けを徹底

- 最低3個、最大5個のタグを付与
- プロジェクト固有のタグと汎用的なタグを組み合わせる
- 例: `jwt`, `authentication`, `error-handling`, `backend`, `security`

### 5. 可視化とメトリクス

- どのナレッジが最も参照されているか追跡
- 新規メンバーのオンボーディング資料としてキュレーション
- 月次レポートで有用なナレッジを共有

---

## ナレッジ活用例

### 新規メンバーのオンボーディング

```bash
# 「はじめに」Discussionを作成し、重要なナレッジへのリンク集を作成
gh discussion create \
  --category "Getting Started" \
  --title "新規メンバー向け: 必読ナレッジ集" \
  --body "## 開発を始める前に読むべきナレッジ

### 環境構築
- [ローカル開発環境のセットアップ](link)
- [Docker環境でのデバッグ方法](link)

### コーディング規約
- [マジックナンバー禁止ルールの実践](link)
- [エラーハンドリングのパターン](link)

### よくある問題
- [JWT認証のトラブルシューティング](link)
- [データベース接続エラーの解決](link)
"
```

### 定期的な振り返り

```bash
# 月次で、今月追加されたナレッジをレビュー
gh search discussions \
  --repo OWNER/REPO \
  --created ">=2025-01-01" \
  --sort created \
  --order desc
```

---

## トラブルシューティング

### 問題: Discussionsが有効になっていない

```bash
# リポジトリ設定でDiscussionsを有効化
# Settings → Features → Discussions をチェック

# または、GitHub APIで確認
gh api repos/OWNER/REPO --jq '.has_discussions'
# false → 有効化が必要
```

### 問題: カテゴリが存在しない

```bash
# 既存のカテゴリを確認
gh api graphql -f query='
  query {
    repository(owner: "OWNER", name: "REPO") {
      discussionCategories(first: 10) {
        nodes { name, slug }
      }
    }
  }
' --jq '.data.repository.discussionCategories.nodes'

# カテゴリを作成（Web UIで実施）
# Discussions → Categories → New category
```

### 問題: タグが反映されない

GitHubのDiscussionsはタグ機能が制限的です。代わりに、本文内に「## タグ」セクションを作成し、ラベル風に記載することを推奨します：

```markdown
## タグ

`jwt` `authentication` `backend` `security`
```

---

## 関連リソース

- **親ドキュメント**: [DEPLOYMENT.md](../DEPLOYMENT.md) - 完全なテンプレートと詳細手順
- **ACE サイクル**: [ace-cycle.md](./ace-cycle.md) - ACE Playbook 更新の具体手順
- **Playbook テンプレート**: [PLAYBOOK.md](../../08-knowledge/PLAYBOOK.md) - 構造化ナレッジの追記先
- **ACE フレームワーク概念**: [ACE_FRAMEWORK.md](../../../docs/ACE_FRAMEWORK.md) - ACE の理論的背景
- **ワークフロー全体**: DEPLOYMENT.md「AI駆動Git Workflow」
- **GitHub CLI**: [gh discussion](https://cli.github.com/manual/gh_discussion)
