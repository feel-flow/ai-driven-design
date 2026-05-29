# ACE サイクル運用手順（Generate → Reflect → Curate）

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Workflow Step**: 10
> **関連**: [knowledge-management.md](./knowledge-management.md) | [PLAYBOOK.md](../../08-knowledge/PLAYBOOK.md) | [ACE フレームワーク概念](../../../docs/ACE_FRAMEWORK.md)

## 概要

ACE (Agentic Context Engineering) サイクルは、マージ後・cleanup 後に AIツールと協力して知見を抽出・評価・記録する運用手順です。

**目的**: 開発で得た知見を構造化し、AIツールが次回タスクで自動参照できる Playbook エントリとして永続化する

**実行タイミング**: マージ後・cleanup 後（develop ブランチで実行）

### 運用パターン

ACE 知見コミットのマージ方針は **[git-workflow.md ステップ10 §運用パターン（マージ方針）](./git-workflow.md#ace-merge-policy)** を SSOT とする。要約：

- **既定（推奨）**: develop に直接 commit + push（PLAYBOOK.md は append-only ＋ PRスコープ式 ID で衝突しない）。
- **任意エスカレーション**: 大人数チーム / 知見レビューを残したい場合のみ `chore/ace-from-pr-<PR番号>` の小 PR。
- ここでの develop 直 push は `knowledge:` 付き PLAYBOOK 単独コミットに限った意図的フローであり、[ACE-012](../../08-knowledge/PLAYBOOK.md#ace-012)（うっかり develop 直 push の事故防止）とは別物。

**autonomous（任意）**: subagent と専用 worktree で ACE キャプチャを非同期化するパターン。導入は [ace-autonomous.md](./ace-autonomous.md) と `docs-template/scripts/ace/` のテンプレートを参照（Issue [#367](https://github.com/feel-flow/ai-spec-driven-development/issues/367)）。

**所要時間**: 5〜15分（AIツール支援あり）

---

## Phase 1: Generate（知見抽出）

### 対象データ

| データソース     | 取得方法                                              | 主な知見                                                                                                                                 |
| ---------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| PR diff          | `gh pr diff ${PR_NUMBER}`                             | コード変更のパターン、設計判断                                                                                                           |
| PR description   | `gh pr view ${PR_NUMBER} --json body`                 | spec にない判断 / spec から変更した点 / 捨てた選択肢（implementation-notes 転記済み、[ACE-034](../../08-knowledge/PLAYBOOK.md#ace-034)） |
| Issue 内容       | `gh issue view ${ISSUE_NUM}`                          | 元々の課題、要件                                                                                                                         |
| レビューコメント | `gh api repos/OWNER/REPO/pulls/${PR_NUMBER}/comments` | 指摘事項、改善点                                                                                                                         |
| CI/CD ログ       | GitHub Actions の結果                                 | ビルド・テストの教訓                                                                                                                     |

### AIプロンプトテンプレート

```
以下のPR情報を分析し、将来の開発で役立つ知見を抽出してください。

## PR情報
- PR: #${PR_NUMBER}
- Issue: #${ISSUE_NUM}
- タイトル: ${PR_TITLE}

## 分析観点
1. **コーディングパターン**: 採用した設計判断とその理由
2. **テスト戦略**: テストの書き方で得た教訓
3. **セキュリティ**: 脆弱性対策の知見
4. **パフォーマンス**: 最適化のヒント
5. **アーキテクチャ**: 構造上の決定事項
6. **プロセス**: ワークフロー・ツール活用の改善点
7. **判断ログ**: spec にない判断 / spec から変更した点 / 捨てた選択肢（#1「採用した判断」を補完するレイヤ。データソースは上記表「PR description」行、[ACE-034](../../08-knowledge/PLAYBOOK.md#ace-034)。カテゴリは `process` または `architecture` を推奨。試行中: [Issue #421](https://github.com/feel-flow/ai-spec-driven-development/issues/421)、5 PR で評価）

## 出力形式
各知見について以下を出力してください:
- タイトル（簡潔で検索しやすい）
- カテゴリ（coding/architecture/testing/security/performance/devops/process/tooling）
- Insight（知見の本質 1-2文）
- Context（発見した状況）
- Action（推奨アクション）
- 汎用性（汎用的 / プロジェクト固有）
- 再現性（高 / 中 / 低）
- 影響度（高 / 中 / 低）
```

### 出力例

```
## 知見候補 1
- タイトル: Prisma の findMany で関連を eager loading しないと N+1 になる
- カテゴリ: performance
- Insight: ユーザー一覧取得時に関連テーブルを include しないと N+1 クエリが発生
- Context: PR #42 でユーザー一覧APIのレスポンスが3秒超に
- Action: findMany 使用時は include オプションを必ず検討する
- 汎用性: プロジェクト固有（Prisma使用時）
- 再現性: 高
- 影響度: 高
```

---

## Phase 2: Reflect（評価・分類）

### 評価チェックリスト

各知見候補について、以下を確認する：

```
□ 再現性が「中」以上か？
  → 「低」の場合は記録しない（一度きりの事象）

□ 影響度が「中」以上か？
  → 「低」の場合は記録しない（些末な知見）

□ 既存 Playbook エントリと重複しないか？
  → 重複する場合は既存エントリの Helpful +1

□ 既存 Playbook エントリと矛盾しないか？
  → 矛盾する場合は既存エントリを deprecated → 新エントリ作成

□ プロジェクト固有の文脈が十分に記述されているか？
  → 汎用的すぎる知見（「テストを書こう」等）は価値が低い
```

### 既存エントリとの照合

```bash
# Playbook 内の既存エントリを確認
# PLAYBOOK.md のエントリ一覧セクションを参照

# AIツールに照合を依頼する場合:
「PLAYBOOK.md の既存エントリを読み、以下の知見候補と重複・矛盾がないか確認してください:
[知見候補のリスト]」
```

### 照合結果と対応アクション

| 照合結果   | アクション                         | 例                                                            |
| ---------- | ---------------------------------- | ------------------------------------------------------------- |
| **重複**   | 既存エントリの Helpful +1          | 「ACE-003 と同じ内容 → Helpful を 2 → 3 に更新」              |
| **矛盾**   | 既存を deprecated → 新エントリ作成 | 「ACE-005 の推奨が古い → deprecated、ACE-012 として新規追記」 |
| **新規**   | Phase 3 へ進む                     | 「既存に該当なし → PLAYBOOK.md に追記」                       |
| **低価値** | 記録しない                         | 「再現性低・影響度低 → スキップ」                             |

---

## Phase 3: Curate（増分更新）

### 手順

#### 1. エントリID の採番

ID は **PRスコープ式**（`ACE-<PR番号>-<連番>`）。採番ルールの SSOT は [PLAYBOOK.md §エントリID規則](../../08-knowledge/PLAYBOOK.md#エントリid規則)。

```bash
# 対象 PR の既存エントリ ACE-<PR番号>-* を確認し、最大連番 +1（既存が無ければ連番 1 = ACE-<PR番号>-1）
# 例: PR #438 で初回 → ACE-438-1、2 件目 → ACE-438-2
# 非PR由来は ACE-i<Issue番号>-<連番>（例: ACE-i425-1）
```

#### 2. PLAYBOOK.md への追記

エントリ一覧セクションの末尾に追記：

```markdown
<a id="ace-438-1"></a>

### ACE-438-1: [タイトル]

| フィールド | 値               |
| ---------- | ---------------- |
| Category   | [カテゴリ]       |
| Origin     | PR #${PR_NUMBER} |
| Date       | YYYY-MM-DD       |
| Helpful    | 0                |
| Harmful    | 0                |
| Status     | active           |

**Insight**: [知見の本質]

**Context**: [発見した状況]

**Action**: [推奨アクション]
```

**anchor 命名規則**: 見出し直前に `<a id="ace-XXX"></a>` を 1 行付与（エントリ ID を小文字化、例 `ace-438-1`）。詳細・根拠は SSOT である [PLAYBOOK.md 記述ガイドライン](../../08-knowledge/PLAYBOOK.md#記述ガイドライン) を参照。

#### 3. Frontmatter の更新

```yaml
version: "1.X.0" # マイナーバージョンをインクリメント
updated: "YYYY-MM-DD"
ace_entry_count: N # 全エントリ数（deprecated含む）
```

#### 4. コミット

```bash
# コミットメッセージ規則
git commit -m "knowledge: ACE-438-1 [performance] Prisma findMany の N+1 防止"

# 複数エントリの場合
git commit -m "knowledge: ACE-438-1,ACE-438-2 [performance,testing] Prisma N+1防止, モックの分離原則"
```

---

## 手動実行チェックリスト

マージ後・cleanup 後に以下のチェックリストで ACE サイクルを実行：

```
## ACE サイクル チェックリスト（PR #___ / Issue #___）

### Phase 1: Generate
- [ ] PR diff を確認
- [ ] レビューコメントを確認
- [ ] AIツールで知見候補を抽出

### Phase 2: Reflect
- [ ] 各候補の再現性・影響度を評価
- [ ] 既存 Playbook エントリとの照合
- [ ] 重複エントリの Helpful カウンター更新
- [ ] 矛盾エントリの deprecated 処理

### Phase 3: Curate
- [ ] 新規エントリを PLAYBOOK.md 末尾に追記
- [ ] Frontmatter 更新（version, updated, ace_entry_count）
- [ ] コミット（knowledge: ACE-XXX [category] [summary]）

### 並行作業（任意）
- [ ] 重要な知見は GitHub Discussions にも投稿
- [ ] Discussion 内に ACE-XXX ID を記載
```

---

## GitHub Discussions との併用ガイド

### 使い分け表

| 観点             | ACE Playbook                | GitHub Discussions         |
| ---------------- | --------------------------- | -------------------------- |
| **いつ使う**     | 毎回のマージ後・cleanup 後  | 重要な知見のみ（選択的）   |
| **何を書く**     | 構造化された短い知見        | 詳細な解説・コード例・議論 |
| **誰が読む**     | AIツール（+ 人間）          | チームメンバー（人間）     |
| **更新頻度**     | 高（マージごと）            | 低（重要な知見のみ）       |
| **フォーマット** | テーブル + 短文（固定形式） | 自由記述                   |

### 推奨フロー（マージ後・cleanup 後）

```
1. ACE サイクルを実行 → Playbook にエントリ追記
2. 重要な知見は GitHub Discussions にも投稿（任意）
3. 相互参照を記録:
   - Playbook エントリの Context に「詳細は Discussion #XX を参照」
   - Discussion 本文に「ACE Playbook (ACE-XXX) にも構造化記録済み」
```

### 両方に記録すべきケース

- レビューで大きな設計変更があった場合
- チーム全体に共有すべき重要な教訓
- 新技術・ライブラリの導入判断
- セキュリティに関する知見

### Playbook のみで十分なケース

- 小さなコーディングパターン
- テストの書き方のコツ
- ツール設定の微調整
- 軽微なパフォーマンス改善

---

## トラブルシューティング

### 知見が抽出されない

**原因**: PR の変更が軽微（typo修正、依存関係更新等）
**対応**: 全ての PR で ACE サイクルを実行する必要はない。以下に該当する場合はスキップ可能：

- typo 修正のみ
- 依存関係のバージョン更新のみ
- ドキュメント修正のみ（内容変更なし）
- 自動生成ファイルの更新のみ

### 既存エントリとの照合が難しい

**原因**: Playbook のエントリ数が増えて全体把握が困難
**対応**: AIツールに照合を依頼する。カテゴリでフィルタリングすると効率的：

```
「PLAYBOOK.md の Category: performance のエントリを列挙し、
以下の知見候補と重複がないか確認してください」
```

### Playbook が 800 行を超えた

**対応**: [PLAYBOOK.md のファイル分割ルール](../../08-knowledge/PLAYBOOK.md#ファイル分割ルール) に従ってカテゴリ別に分割

### コミットメッセージの規則を忘れた

**形式**: `knowledge: ACE-XXX [category] [summary]`
**例**:

- `knowledge: ACE-001 [coding] TypeScript strict mode の例外パターン`
- `knowledge: ACE-002,ACE-003 [testing,security] モック分離、JWT検証`
- `knowledge: ACE-004 [performance] helpful+1 (既存エントリ更新)`

---

## 関連リソース

- **概念説明**: [ACE フレームワーク](../../../docs/ACE_FRAMEWORK.md) - ACE の理論的背景
- **Playbook テンプレート**: [PLAYBOOK.md](../../08-knowledge/PLAYBOOK.md) - エントリの追記先
- **ナレッジ管理**: [knowledge-management.md](./knowledge-management.md) - GitHub Discussions ベースの管理
- **autonomous 化**: [ace-autonomous.md](./ace-autonomous.md) - subagent + worktree（任意）
- **Git ワークフロー**: [git-workflow.md](./git-workflow.md) - ワークフロー全体の中での位置づけ
- **親ドキュメント**: [DEPLOYMENT.md](../DEPLOYMENT.md) - 運用ガイド索引

---

## Changelog

### [1.1.0] - 2026-05-20

#### 追加

- Phase 1 分析観点に「7. 判断ログ」を追加（試行中、5 PR で評価）。詳細は §Phase 1 観点 7（Issue [#421](https://github.com/feel-flow/ai-spec-driven-development/issues/421)、[ACE-034](../../08-knowledge/PLAYBOOK.md#ace-034) 連動）

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成：ACE サイクル（Generate → Reflect → Curate）の運用手順を文書化
