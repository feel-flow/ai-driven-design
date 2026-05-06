---
title: "Monthly Documentation Health Check"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-05-06"
updated: "2026-05-06"
---

# 月次ドキュメントヘルスチェック (Monthly Health Check)

> **適用範囲**: Phase 3 以降のチームが、毎月 1 日（または直近営業日）に実施するドキュメント品質の点検作業。所要時間は通常 30〜60 分。

## なぜ月次チェックが必要か

- ドキュメントは **書いた瞬間から陳腐化が始まる**。放置するとリンク切れ・参照消失・過大化が雪だるま式に増える。
- AI ツールは **古い情報を区別できない**。チームが定期的に整備しないと AI の応答品質が緩やかに劣化する。
- 月次の小さい点検で防げる問題は、四半期・年次にまとめると **大規模リファクタになり負債化** する。

## 4 つのチェック項目

書籍 第14章「ドキュメント増加の管理戦略」で定義された **4 項目** を毎月確認する。

| #   | 項目                     | 検出対象                         | 検出 | 判定        |
| --- | ------------------------ | -------------------------------- | ---- | ----------- |
| 1   | MASTER.md からの参照確認 | 新規文書が中央索引から到達可能か | ○    | △（要目視） |
| 2   | ファイルサイズ確認       | 500 行超の文書                   | ○    | ○           |
| 3   | 鮮度確認                 | 6 ヶ月以上更新なしの文書         | ○    | △（要分類） |
| 4   | 孤立文書の確認           | どこからも参照されていない文書   | ○    | △（要目視） |

## 1. MASTER.md からの参照確認

### 何を見るか

- 直近 1 ヶ月で追加された文書が、`MASTER.md` の索引またはコア 7 文書のいずれかから **2 ホップ以内** で到達できるか。
- 到達できない文書は **AI ツールから事実上見えない** ため、参照リンクの追加が必要。

### 手順

```bash
# 直近 1 ヶ月に追加された .md ファイルを抽出し、MASTER.md からの参照を確認
git log --since="1 month ago" --diff-filter=A --name-only \
  --pretty=format: -- 'docs-template/**/*.md' 'docs/**/*.md' \
  | sort -u | while read f; do
  basename=$(basename "$f")
  grep -q "$basename" docs-template/MASTER.md || echo "MISSING: $f"
done
```

### 判定

- **MISSING が出た文書** → 適切な節に参照リンクを追加するか、`MASTER.md` の「拡張ドキュメント」表に登録する。
- ただし、サブドキュメント（`organizational-rollout/health-check.md` 等）は **親索引から参照されていれば OK**。

## 2. ファイルサイズ確認

### 何を見るか

- 500 行を超えた文書（要分割検討）を一覧化する。
- 800 行・1200 行の閾値超えはリリース前に対処する優先度が高い。詳細は [document-splitting.md](./document-splitting.md) 参照。

### 手順

```bash
# 行数の多い順に並べる（上位 20 件）
find docs-template docs -name '*.md' -type f \
  ! -path '*/archive/*' ! -path '*/node_modules/*' \
  -exec wc -l {} + | sort -rn | head -20
```

### 判定

| 行数      | 対応                                                             |
| --------- | ---------------------------------------------------------------- |
| 〜 500    | 何もしない                                                       |
| 500〜800  | 棚卸しを翌月までに実施（バックログ化）                           |
| 800〜1200 | 当月内に分割計画を立てる                                         |
| 1200 超   | **当月内に分割を必須**。1 PR で 1 文書を分割（詳細は分割ガイド） |

## 3. 鮮度確認（最終更新から 6 ヶ月）

### 何を見るか

- 6 ヶ月以上 **本文の変更がない** 文書 = 内容が現状と乖離している可能性が高い。
- 「変更がない = 安定している」のか「**忘れ去られている**」のかを切り分ける。

### 手順

```bash
# 6 ヶ月以上更新がない .md を抽出
# date: macOS は `-v-6m`、GNU coreutils は `-d '6 months ago'`
SIX_MO_AGO=$(date -v-6m +%Y-%m-%d 2>/dev/null || date -d '6 months ago' +%Y-%m-%d)
find docs-template docs -name '*.md' -type f \
  ! -path '*/archive/*' \
  | while read f; do
      last=$(git log -1 --format=%ad --date=short -- "$f")
      [ -n "$last" ] && [ "$last" \< "$SIX_MO_AGO" ] && echo "$last $f"
    done | sort
```

> macOS と Linux で `date` のフラグが異なるため、上記は両方に対応した条件式を使用。

### 判定

各ヒット文書を以下のいずれかに分類:

| 分類                    | 対応                                                                  |
| ----------------------- | --------------------------------------------------------------------- |
| **a) まだ正しい**       | フロントマター `updated` だけ更新（内容は保持）                       |
| **b) 一部古い**         | 該当箇所だけ修正 PR を起こす                                          |
| **c) 全面的に陳腐化**   | [archive-strategy.md](./archive-strategy.md) に従い `archive/` へ退避 |
| **d) 既に他文書へ統合** | アーカイブ + リダイレクト                                             |

## 4. 孤立文書の確認

### 何を見るか

- どこからも参照されていない文書 = AI も人間もそこに辿り着けない。
- 新規追加直後の数日は孤立して見えることがあるため、**作成から 1 週間経過した文書** に絞る。

### 手順

```bash
# 全 .md ファイル（作成から 1 週間経過したものに絞る）
ONE_WEEK_AGO=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)
find docs-template docs -name '*.md' -type f \
  ! -path '*/archive/*' \
  | while read f; do
      added=$(git log --diff-filter=A --follow --format=%ad --date=short -- "$f" | tail -1)
      [ -n "$added" ] && [ "$added" \< "$ONE_WEEK_AGO" ] && echo "$f"
    done | sort > /tmp/all-md.txt

# どこかからリンクされている .md
grep -rho '\[.*\]([^)]*\.md[^)]*)' docs-template docs \
  | grep -oE '[^()]+\.md' | sort -u > /tmp/linked-md.txt

# 差分 = 孤立候補
# 注: comm は両入力がソート済みであることを要求する。
# `sed 's|.*/||'` で basename 抽出（xargs より高速）し、`sort -u` で並びと重複を整える。
comm -23 \
  <(sed 's|.*/||' /tmp/all-md.txt | sort -u) \
  <(sed 's|.*/||' /tmp/linked-md.txt | sort -u)
```

> 上記は簡易判定（basename ベース）。同名異パスがある場合は誤検出するため、結果は目視確認する。`git log --diff-filter=A` で初回追加日を取り、1 週間以内の新規文書はノイズになりやすいため除外する。

### 判定

| 状況                             | 対応                                                                |
| -------------------------------- | ------------------------------------------------------------------- |
| **意図的に孤立**（ADR の旧版等） | フロントマターに `status: deprecated` を明記                        |
| **参照漏れ**                     | 適切な親文書に参照リンクを追加                                      |
| **役目を終えている**             | アーカイブ対象（[archive-strategy.md](./archive-strategy.md) 参照） |
| **そもそも要らない文書**         | レビュー後に削除（履歴は git に残るため安全）                       |

## 月次レポートテンプレート

毎月の点検結果は GitHub Issue または Discussion に記録する:

```markdown
## ドキュメントヘルスチェック - YYYY-MM

### 1. MASTER.md 参照

- 新規文書: N 件 / 全件参照済み: ○ / MISSING: ○

### 2. ファイルサイズ

- 500 行超: N 件
- 800 行超: N 件 → 翌月分割予定: ○○.md
- 1200 行超: N 件 → 今月対応: ○○.md

### 3. 鮮度

- 6 ヶ月以上更新なし: N 件
  - そのまま: N 件 / 修正 PR 起票: N 件 / アーカイブ: N 件

### 4. 孤立文書

- 検出: N 件 → 参照追加: N 件 / アーカイブ: N 件 / 削除: N 件

### Action Items

- [ ] ○○.md を分割（feature/#NNN-split-OO で対応）
- [ ] △△.md をアーカイブ
```

## 自動化のヒント

- 上記 4 項目はすべて **シェルスクリプトで自動化可能**。`scripts/doc-health-check.mjs` 等を作成し、毎月 1 日に手動実行 or CI で定期実行する。
- 結果を Slack / GitHub Discussion に投稿すれば、点検の負荷が大幅に下がる。
- 完全自動化を急がず、まずは **手順を 1 回手で回してから** 自動化する（運用が固まる前のスクリプトは陳腐化が早い）。

## 月次チェックを **省略してよい** ケース

| 状況                                   | 判断                                                         |
| -------------------------------------- | ------------------------------------------------------------ |
| Phase 1〜2 中（コア文書未整備）        | チェック対象自体が少ない。Phase 3 完了後から開始             |
| 同月にメジャーリファクタが完了している | リファクタ作業時に同等のチェックを実施済みなら省略可         |
| プロジェクト凍結中                     | 凍結期間中は不要。再開時に「過去 N ヶ月分まとめ」を 1 回実施 |

## 次に読む

- [document-splitting.md](./document-splitting.md) — サイズ超過文書の分割手順
- [archive-strategy.md](./archive-strategy.md) — 鮮度・孤立で検出された文書の退避手順
- [phased-rollout.md](./phased-rollout.md) — 月次チェックを Phase 4 で運用に組み込む
- [../ORGANIZATIONAL_ROLLOUT.md](../ORGANIZATIONAL_ROLLOUT.md) — 組織展開ガイドの索引（親）
