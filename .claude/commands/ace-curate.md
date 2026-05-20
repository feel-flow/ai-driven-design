# /ace-curate — ACE サイクル実行（Playbook 増分更新）

マージ後・cleanup 後に PR から知見を抽出し、ACE Playbook に構造化エントリとして追記します。

## 前提

- git リポジトリで作業中であること
- マージ済み（cleanup 済み）の PR が存在すること（直近マージの PR が対象）
- `docs-template/08-knowledge/PLAYBOOK.md` が存在すること
- 現在のブランチが `develop` であること（または ACE 専用 `chore/ace-from-pr-<PR番号>` ブランチ）
- **実行タイミング**: マージ後・cleanup 後（develop ブランチで実行）

## 引数

- `$ARGUMENTS` — 対象のPR番号（省略時は直近マージのPRを自動検出）

## 手順

### 1. 対象PRの特定

引数でPR番号が指定されていない場合、最近マージされた PR を自動検出します:

```bash
# 直近マージされた merged 状態の PR を取得（マージ後なので state=merged）
gh pr list --state merged --limit 1 --json number,title,body,url,mergedAt
```

指定されている場合:

```bash
gh pr view $ARGUMENTS --json number,title,body,url,comments,reviews
```

### 2. Phase 1: Generate（知見抽出）

対象PRの以下の情報を収集します:

- `gh pr diff $PR_NUMBER` でコード変更を確認
- `gh pr view $PR_NUMBER --json comments,reviews` でレビューコメントを確認
- 関連 Issue の内容を確認

収集した情報から、以下の観点で知見候補を抽出:

1. **コーディングパターン**: 採用した設計判断とその理由
2. **テスト戦略**: テストの書き方で得た教訓
3. **セキュリティ**: 脆弱性対策の知見
4. **パフォーマンス**: 最適化のヒント
5. **アーキテクチャ**: 構造上の決定事項
6. **プロセス**: ワークフロー・ツール活用の改善点

### 3. Phase 2: Reflect（評価・分類）

各知見候補について評価します:

- [ ] 再現性が「中」以上か？（低→スキップ）
- [ ] 影響度が「中」以上か？（低→スキップ）
- [ ] 汎用的すぎないか？（プロジェクト固有の文脈が含まれているか？）

次に、既存 Playbook エントリとの照合を行います:

- `docs-template/08-knowledge/PLAYBOOK.md` のエントリ一覧を読み込み
- 各知見候補と既存エントリの重複・矛盾を確認

照合結果に応じたアクション:

- **重複**: 既存エントリの `Helpful` カウンターを +1
- **矛盾**: 既存エントリの Status を `deprecated` に変更 → 新エントリ作成
- **新規**: Phase 3 へ進む
- **低価値**: 記録しない

### 4. Phase 3: Curate（増分更新）

#### 4-a. エントリIDの採番

PLAYBOOK.md の既存エントリから最新のIDを確認し、次の連番を使用

#### 4-b. PLAYBOOK.md への追記

エントリ一覧セクションの末尾（`## Changelog` の直前）に新エントリを追記:

```markdown
<a id="ace-xxx"></a>

### ACE-XXX: [タイトル]

| フィールド | 値           |
| ---------- | ------------ |
| Category   | [カテゴリ]   |
| Origin     | PR #[PR番号] |
| Date       | [今日の日付] |
| Helpful    | 0            |
| Harmful    | 0            |
| Status     | active       |

**Insight**: [知見の本質]

**Context**: [発見した状況]

**Action**: [推奨アクション]
```

**anchor 規則**: 見出し直前に `<a id="ace-NNN"></a>` を 1 行付与（`NNN` は小文字 + ハイフン + 3 桁ゼロパディング、例: `ace-042`）。他ドキュメントから `[ACE-NNN](path/to/PLAYBOOK.md#ace-nnn)` 形式で直接ジャンプ可能にする（PLAYBOOK.md 1000 行超対応、Issue [#425](https://github.com/feel-flow/ai-spec-driven-development/issues/425)）。

#### 4-c. Frontmatter の更新

- `version` のマイナーバージョンをインクリメント
- `updated` を今日の日付に更新
- `ace_entry_count` をインクリメント（新規エントリ追加時のみ。カウンター更新のみの場合は変更しない）

### 5. コミット

変更をコミットします（develop ブランチで実行している前提）:

**個人開発（簡易、コミッタ 1〜2 人）**: 直接 develop に commit + push する（ACE-012 の例外として許容、根拠は下記参照）。

```bash
git add docs-template/08-knowledge/PLAYBOOK.md
git commit -m "knowledge: ACE-XXX [category] [summary]"
git push origin develop
```

**チーム開発（推奨、コミッタ 3 人以上または ACE 内容のレビューを残したい）**: `chore/ace-from-pr-<PR番号>` ブランチを切って小さい PR を作成。

```bash
git checkout -b chore/ace-from-pr-<PR番号>
git add docs-template/08-knowledge/PLAYBOOK.md
git commit -m "knowledge: ACE-XXX [category] [summary]"
git push -u origin chore/ace-from-pr-<PR番号>
gh pr create --base develop --title "knowledge: ACE-XXX [category]" --body "PR #<PR番号> から知見抽出"
# レビュー後 squash merge → /merge-cleanup
```

判断基準と ACE-012 例外の根拠は [git-workflow.md ステップ10 ACE](../../docs-template/05-operations/deployment/git-workflow.md) を参照。

### 6. 結果レポート

以下の形式で結果を報告します:

```
## ACE サイクル完了レポート

**対象PR**: #[PR番号] [タイトル]
**抽出知見数**: X 件
**新規エントリ**: ACE-XXX, ACE-YYY
**カウンター更新**: ACE-ZZZ (Helpful +1)
**スキップ**: X 件（低価値）

### 追加エントリ
- ACE-XXX: [タイトル] ([カテゴリ])
- ACE-YYY: [タイトル] ([カテゴリ])
```

## 注意事項

- エントリの追記は **末尾のみ**。既存エントリの本文（Insight/Context/Action）の書き換えは禁止
- 既存エントリの Helpful/Harmful カウンター更新と Status 変更（active → deprecated）は許可
- カウンターの更新は **インクリメントのみ**（減算しない）
- 知見が抽出されない場合（typo修正のみ等）は「知見なし」と報告して終了
- PLAYBOOK.md が 800 行を超えている場合は分割を提案
