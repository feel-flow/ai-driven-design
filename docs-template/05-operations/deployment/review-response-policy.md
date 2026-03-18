# PRレビュー対応ポリシー（Review Response Policy）

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Related**: [git-workflow.md](./git-workflow.md) | [self-review.md](./self-review.md)

## 概要

PRレビュー結果に対する対応ルールを定義します。本ポリシーは全てのレビューソースに共通で適用されます。

**適用対象**:
- PR Review Toolkit（Claude Code サブエージェント）
- Codex CLI クロスモデルレビュー
- Multi-CLI 分散レビュー
- pre-commit / pre-push hook
- 人間によるレビュー

---

## 重要度別対応ルール

| 重要度 | 対応 | 確認要否 | 説明 |
|--------|------|---------|------|
| **Critical** | 必ず修正 | 不要（即対応） | セキュリティ脆弱性、データ損失リスク、本番障害の可能性 |
| **Warning** | 必ず修正 | 不要（即対応） | バグの可能性、パフォーマンス問題、規約違反 |
| **Suggestion** | 妥当なものは修正 | 不要 | コード改善提案、リファクタリング候補 |
| **Info / Good Practice** | 確認のみ | 不要（対応不要） | 参考情報、称賛、学習ポイント |

---

## 対応フロー

```
レビュー結果を受信
    │
    ├─ Critical / Warning → 即座に修正開始（ユーザー確認不要）
    │
    ├─ Suggestion → 実装が妥当か判断
    │   ├─ 妥当 → 修正
    │   └─ 不適切 → スキップ（理由を記録）
    │
    └─ Info / Good Practice → 確認のみ（対応不要）

--- 以下は全ケース共通の後続フロー ---

TodoWrite で対応項目をリスト化（進捗可視化）
    ↓
すべての対応完了後、変更をコミット・プッシュ
    ↓
対応内容のサマリーをユーザーに報告
```

### 対応手順

1. レビュー結果を受け取ったら、ユーザーに確認を求めずに上記ポリシーに従って自動的に対応を開始
2. TodoWrite で対応項目をリスト化して進捗を可視化
3. すべての対応完了後、変更をコミット・プッシュ
4. 対応内容のサマリーをユーザーに報告

---

## ESLint Warnings の扱い

| 対象 | 対応 |
|------|------|
| 今回変更したファイルの Warning | 必ず修正 |
| 既存ファイル（変更対象外）の Warning | 報告のみ（修正不要） |

**理由**: 変更対象外のファイルまで修正すると、PRのスコープが拡大し、レビューの焦点がぼやけるため。既存ファイルの改善は別Issueで対応する。

---

## 適用場面

### セルフレビュー時（PR作成前）

```
ステップ5: セルフレビュー
    ├── PR Review Toolkit 実行 → 本ポリシーで対応
    ├── Codex CLI クロスモデルレビュー → 本ポリシーで対応
    └── Multi-CLI 分散レビュー → 本ポリシーで対応
```

### PR作成後のレビュー

```
ステップ7: レビュー対応
    ├── @review-router → 本ポリシーで対応
    ├── 人間レビュワー → 本ポリシーで対応 + スレッド返信必須
    └── CI/CD チェック → 本ポリシーで対応
```

**注意**: 人間レビュワーからの指摘には、本ポリシーに加えて[レビュー対応のコメント規約](./git-workflow.md#ステップ7-レビュー対応review)に従ったスレッド返信が必須。

---

## 関連ドキュメント

- [git-workflow.md](./git-workflow.md) -- AI駆動Git Workflow全体
- [self-review.md](./self-review.md) -- セルフレビュー詳細
- [multi-cli-review-orchestration.md](./multi-cli-review-orchestration.md) -- Multi-CLI分散レビュー
- [workflow-principles.md](./workflow-principles.md) -- ワークフロー運用原則
