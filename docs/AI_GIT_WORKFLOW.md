# AI駆動 Git Workflow

AI開発ツール（Claude Code、GitHub Copilot、Cursor）に最適化されたGit Flowベースのワークフローです。

> **このドキュメントについて**: 本ドキュメントはワークフロー全体の概要と流れを説明するハブドキュメントです。各ステップの詳細な手順やテンプレートは[関連ドキュメント](#関連ドキュメント)を参照してください。

## なぜAI駆動Git Workflowか

従来のGit Workflowに **テスト・セルフレビュー（PR作成前）** と **ACEナレッジ体系化（マージ前）** を組み込むことで、AIツールの力を最大限に活用します。

**従来のワークフロー**:

```
Issue → Branch → Commit → PR → Review → Merge
```

**AI駆動Git Workflow**:

```
Issue → Branch → Implement → Test → Self-Review → PR → Review → ACE → Merge → Cleanup
```

### 3つの革新ポイント

| ポイント                   | 従来              | AI駆動                                        |
| -------------------------- | ----------------- | --------------------------------------------- |
| **テスト＋セルフレビュー** | 手動/省略されがち | テスト自動実行＋AIツールが5観点で自動チェック |
| **ACEナレッジ体系化**      | 属人的なメモ      | ACE Playbook + GitHub Discussionsに体系的蓄積 |
| **ドキュメント参照**       | 開発者依存        | コミットメッセージにdoc参照を含める           |

---

## コアサイクル（10ステップ）

```mermaid
graph LR
    subgraph "コアサイクル"
        A[1. Issue] --> B[2. Branch]
        B --> C[3. Implement]
        C --> D[4. Test]
        D --> E[5. Self-Review]
        E --> F[6. PR]
        F --> G[7. Review]
        G --> H[8. ACE]
        H --> I[9. Merge]
        I --> J[10. Cleanup]
    end
```

### 各ステップの概要

| #   | ステップ        | 目的                       | AIツール活用                        |
| --- | --------------- | -------------------------- | ----------------------------------- |
| 1   | **Issue作成**   | 作業の起点を明確化         | Issue本文の自動生成                 |
| 2   | **Branch作成**  | 作業を分離                 | -                                   |
| 3   | **Implement**   | AI駆動で実装・コミット     | コード生成、doc参照の自動挿入       |
| 4   | **Test**        | テスト・型チェック・Lint   | 自動テスト実行・品質ゲート          |
| 5   | **Self-Review** | 品質を事前確保             | 5観点の自動チェック＋Review Toolkit |
| 6   | **PR作成**      | レビュー依頼               | PR本文の自動生成                    |
| 7   | **Review**      | レビュー対応（修正ループ） | Review Router＋修正提案の自動生成   |
| 8   | **ACE**         | ナレッジ体系化（マージ前） | 知見の自動抽出・Playbook更新        |
| 9   | **Merge**       | Squash merge               | -                                   |
| 10  | **Cleanup**     | ブランチ同期・削除         | 次タスクの提案                      |

---

## ブランチ戦略（Git Flow準拠）

```
main/master    ← 本番リリース（常時デプロイ可能）
  ↑
develop       ← 開発統合（次期リリース候補）
  ↑
feature/*     ← 機能開発（Issueベース）
hotfix/*      ← 緊急修正（mainから分岐）
release/*     ← リリース準備（developから分岐）
```

**注**: この図は主なコードの流れを示しています。`release`ブランチや`hotfix`ブランチは`main`と`develop`の両方にマージされるなど、実際のフローはより複雑になる場合があります。

### ブランチ命名規則

| タイプ   | パターン                            | 例                          |
| -------- | ----------------------------------- | --------------------------- |
| 機能開発 | `feature/{issue-num}-{description}` | `feature/123-user-auth`     |
| 緊急修正 | `hotfix/{issue-num}-{description}`  | `hotfix/456-security-patch` |
| リリース | `release/{version}`                 | `release/1.2.0`             |

---

## 運用原則

本ワークフローは以下の原則に従って運用します。詳細は [workflow-principles.md](../docs-template/05-operations/deployment/workflow-principles.md) を参照してください。

| 原則                         | 概要                                        |
| ---------------------------- | ------------------------------------------- |
| **ノンストップフロー**       | Issue作成〜PR作成まで不要確認なしで一気通貫 |
| **スコープ外発見のIssue化**  | その場で修正せず新規Issue作成               |
| **曖昧仕様の確認タイミング** | Issue着手前に確認、作業開始後は別Issue化    |
| **TodoWrite タスク管理**     | 標準チェックリストで進捗を可視化            |

---

## 詳細ステップ

### ステップ1: Issue作成

**原則**: 全ての作業は必ずIssueから開始

```bash
# GitHub CLIでIssue作成
gh issue create \
  --title "feat: ユーザー認証機能を実装" \
  --body "## 概要
[実装内容の説明]

## 受入基準
- [ ] 基準1
- [ ] 基準2" \
  --label "enhancement"
```

**AIツールへのプロンプト例**:

```
「ユーザー認証機能のIssueを作成してください。
受入基準、技術的な考慮事項、関連ドキュメントへの参照を含めてください。」
```

### ステップ2: Branch作成

```bash
git checkout develop
git pull origin develop
git checkout -b "feature/123-user-auth"
```

### ステップ3: Implement（AI駆動実装・コミット）

**重要**: コミットメッセージに参照したドキュメントを含める

```bash
git commit -m "feat: ユーザー認証機能を実装

- JWTベースの認証ミドルウェアを追加
- ログイン/ログアウトAPIを実装

参照:
- docs-template/MASTER.md#技術スタック (認証方式)
- docs-template/03-implementation/PATTERNS.md#3-エラーハンドリング (エラーハンドリング)

Closes #123"
```

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

### ステップ5: Self-Review（セルフレビュー）

**目的**: PRレビュー時の単純な指摘を事前に防ぐ

#### 5つの観点

| 観点                            | チェック内容                                        |
| ------------------------------- | --------------------------------------------------- |
| 1. コーディング規約             | マジックナンバー、型安全性、命名規則                |
| 2. 仕様との整合性               | PROJECT.md、ARCHITECTURE.md、DOMAIN.mdとの整合      |
| 3. テスト充実度                 | カバレッジ80%以上、エッジケース、エラーハンドリング |
| 4. パフォーマンス・セキュリティ | N+1問題、入力サニタイズ、認証・認可                 |
| 5. ドキュメント更新             | README、API仕様書の更新要否                         |

#### AIツールへのプロンプト例

```
「以下の観点で、今回のコミット内容をレビューしてください：

1. コーディング規約（docs-template/MASTER.md、docs-template/03-implementation/PATTERNS.md）
2. 仕様との整合性（docs-template/01-context/PROJECT.md、docs-template/02-design/ARCHITECTURE.md、docs-template/02-design/DOMAIN.md）
3. テスト充実度（docs-template/04-quality/TESTING.md）
4. パフォーマンスとセキュリティ
5. ドキュメント更新の必要性

各観点について、問題点と改善提案を具体的に指摘してください。」
```

#### セルフレビュー結果のPR記載例

```markdown
## セルフレビュー結果

### 1. コーディング規約

- ✅ マジックナンバー: 全て定数化済み
- ✅ 型安全性: any型使用なし

### 2. 仕様との整合性

- ✅ PROJECT.md#3.2の要件を全て実装

### 3. テスト充実度

- ✅ カバレッジ: 85.3%

### 4. パフォーマンス・セキュリティ

- ✅ N+1クエリ: 問題なし

### 5. ドキュメント更新

- ✅ README.md: 認証セクションを追加
```

#### Review Toolkit（Claude Code サブエージェント）

セルフレビューではClaude Codeのpr-review-toolkitサブエージェントも活用できます：

| サブエージェント        | 役割                       | 主な検出対象                       |
| ----------------------- | -------------------------- | ---------------------------------- |
| `code-reviewer`         | コード品質の包括的レビュー | 設計問題、命名規則違反、コード重複 |
| `silent-failure-hunter` | エラーハンドリング漏れ検出 | 未処理例外、空catch、暗黙的失敗    |
| `type-design-analyzer`  | 型設計の妥当性分析         | any型使用、型の粒度不足            |
| `pr-test-analyzer`      | テスト品質の分析           | カバレッジ不足、エッジケース欠落   |
| `comment-analyzer`      | コメント・ドキュメント品質 | 不正確なコメント、JSDoc欠落        |
| `code-simplifier`       | 複雑度の削減提案           | 長関数、深いネスト                 |

#### デュアルモデルレビュー（Claude + Codex）

Toolkit レビュー後、Codex CLI でクロスモデルレビューを実行し、異なるAIモデルの観点でレビュー品質を向上させます：

```bash
bash scripts/codex-review.sh --branch
```

レビュー結果は [Review Response Policy](../docs-template/05-operations/deployment/review-response-policy.md) に従って対応（Critical/Warning は確認不要で即対応）。TodoWrite で対応項目を管理します。

### ステップ6: PR作成

```bash
gh pr create \
  --base develop \
  --title "feat: ユーザー認証機能を実装" \
  --body "## 概要
...

## セルフレビュー結果
[上記の結果を記載]

Closes #123"
```

### ステップ7: Review（レビュー対応）

**重要**: レビュー指摘には**必ずスレッド形式で返信**

#### 良いコメントの例

```markdown
@reviewer-name 様

ご指摘ありがとうございます。修正いたしました。

## 修正内容

- `validateToken` 関数のエラーハンドリングを改善
- カスタムエラークラス `TokenExpiredError` を導入

## 変更箇所

- src/middleware/auth.ts:45-67

## 修正の理由

期限切れと不正トークンを区別することで、クライアント側で
適切なエラーメッセージを表示できるようにしました。

ご確認のほど、よろしくお願いいたします。
```

### ステップ8: ACE（ナレッジ体系化）

**目的**: 開発で得た知見をチーム資産として蓄積

**実行タイミング**: レビュー完了後・マージ前（feature branchで実行）

#### 記録対象

- レビュー指摘と対応方法
- 技術的困難の解決策
- 新技術・ライブラリの導入知見
- パフォーマンス改善の手法
- セキュリティ対策の実装

#### AIツールへのプロンプト例

```
「今回のIssue #123とPR #456の内容を分析し、
GitHub Discussionsに登録すべきナレッジを抽出してください。

以下を含めてMarkdownを生成してください：
1. タイトル: 問題を端的に表現
2. カテゴリ: トラブルシューティング/ベストプラクティス/技術選定 など
3. 問題の概要
4. 解決方法（コード例含む）
5. 学んだこと」
```

#### GitHub Discussionsへの登録

```bash
gh discussion create \
  --category "ベストプラクティス" \
  --title "[JWT認証] トークンリフレッシュのエラーハンドリング" \
  --body-file knowledge.md
```

#### 運用パターン

**個人開発（推奨）**: レビュー完了後、feature branchでACEを実行 → PLAYBOOK.md更新もPRに含める → まとめてマージ

**チーム開発（参考）**: PLAYBOOK.mdのコンフリクトリスクがあるため、ACE更新は別ブランチ/別PRで対応することも検討

### ステップ9: Merge

```bash
# developブランチに切り替えてからマージ
git checkout develop
gh pr merge <PR番号> --squash --delete-branch
```

**注**: `feature`ブランチにはSquash mergeが適していますが、`release`や`hotfix`ブランチを`main`にマージする際は、コミット履歴を保持するために通常のmerge (`--merge`) を検討してください。

### ステップ10: Cleanup

PRのマージ後、ローカル環境を同期します。

```bash
git pull origin develop

# リモートで削除済みの追跡ブランチをローカルから一括削除
git fetch --prune
```

**注**: ステップ9で `gh pr merge --delete-branch` を実行したため、リモートのフィーチャーブランチは自動的に削除されています。ローカルのフィーチャーブランチは、マージ前に `develop` へ切り替えているため、手動で `git branch -d feature/123-user-auth` を実行するか、`gh` コマンドのインタラクティブなプロンプトに従って削除する必要があります。`git fetch --prune` は、他の開発者がマージして削除したブランチなど、リモートで削除済みの追跡ブランチをローカルから一括で削除するために役立ちます。

---

## ベストプラクティス

### Issue駆動開発

- 全ての作業はIssueから開始
- Issue番号をブランチ名・コミットメッセージに含める
- Issueテンプレートで情報を標準化

### 小さく頻繁なコミット

- 機能単位で小さくコミット
- 変更理由を明確に記載
- 参照ドキュメントを含める

### AIツールの積極活用

- コード生成だけでなくレビューにも活用
- MASTER.md等のドキュメントを常に参照させる
- セルフレビューとナレッジ抽出を自動化

### PRサイズの管理

- 1つのPRは1つの機能に集中
- 変更ファイル数は10ファイル以内推奨
- 大きな変更は複数Issue/PRに分割

---

## 関連ドキュメント

### テンプレート（実際のプロジェクトで使用）

- [git-workflow.md](../docs-template/05-operations/deployment/git-workflow.md) - 詳細ワークフロー
- [self-review.md](../docs-template/05-operations/deployment/self-review.md) - セルフレビュー詳細
- [review-response-policy.md](../docs-template/05-operations/deployment/review-response-policy.md) - PRレビュー対応ポリシー
- [workflow-principles.md](../docs-template/05-operations/deployment/workflow-principles.md) - ワークフロー運用原則
- [multi-cli-review-orchestration.md](../docs-template/05-operations/deployment/multi-cli-review-orchestration.md) - Multi-CLI分散レビュー・クロスモデルレビュー
- [knowledge-management.md](../docs-template/05-operations/deployment/knowledge-management.md) - ナレッジ体系化詳細
- [automated-code-review.md](../docs-template/05-operations/deployment/automated-code-review.md) - 自動コードレビュー

### 関連概念

- [AI Spec Driven Development](./AI_SPEC_DRIVEN_DEVELOPMENT.md) - 7文書構造の概念
- [Operational Guide](./OPERATIONAL_GUIDE.md) - AIエージェント向け運用ガイド

---

## まとめ

AI駆動Git Workflowは以下を実現します：

1. **効率的な開発** - AIツールで開発速度を向上
2. **高品質なコード** - セルフレビューで品質を事前確保
3. **組織的な知見蓄積** - ナレッジ体系化でチーム全体のスキルアップ
4. **透明性の高いプロセス** - Issue駆動でトレーサビリティを確保
5. **継続的改善** - フィードバックループでプロセスを進化

ワークフローは形式ではなく、チームの生産性向上と品質確保のための手段です。状況に応じて柔軟に調整してください。
