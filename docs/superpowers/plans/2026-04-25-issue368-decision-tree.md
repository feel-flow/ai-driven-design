# Issue #368 Layer 1 — Decision Tree テンプレ追加 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AI-SDD フレームワーク採用プロジェクトの開発者・AI エージェントが「新機能をどこに配置するか」で迷わないように、配置判断の決定木テンプレ（Decision Tree）を `docs-template/` に追加する。

**Architecture:** `docs-template/03-implementation/DECISION_TREE.md` を新規追加し、既存 `PATTERNS.md` に索引セクション「11. 配置判断」を、`MASTER.md` の「コード生成ルール > 必須事項」に 7 番目の箇条書きを追加する。3 ファイルから同一の `DECISION_TREE.md` に収束する委譲パターン（既存 `FALLBACK.md` 前例踏襲）。

**Tech Stack:** Markdown（markdownlint-cli2 v0.17.2）、Node.js 検証スクリプト（`scripts/validate-docs.mjs`）、MCP TypeScript サーバー（`mcp/dist/index.js --check`、vitest）

**Spec:** `docs/superpowers/specs/2026-04-24-issue368-decision-tree-design.md`

**Branch:** `feature/#368-decision-tree`（作成済み、spec コミットが既に 2 件存在）

---

## File Structure

| ファイル | 種別 | 責務 |
|---------|------|------|
| `docs-template/03-implementation/DECISION_TREE.md` | 新規 | Decision Tree 本体、チェックリスト、プロジェクト固有化手順、参考実装リンク |
| `docs-template/03-implementation/PATTERNS.md` | 変更 | 新セクション「11. 配置判断（Decision Tree）」を Changelog 前に挿入 |
| `docs-template/MASTER.md` | 変更 | 「コード生成ルール > 必須事項」に 7 番目「配置判断」を追加 |

---

## Task 1: DECISION_TREE.md の新規作成

**Files:**
- Create: `docs-template/03-implementation/DECISION_TREE.md`

- [ ] **Step 1: 作成前のファイル不在を確認（baseline 確認）**

Run: `ls docs-template/03-implementation/DECISION_TREE.md 2>&1`
Expected: `ls: docs-template/03-implementation/DECISION_TREE.md: No such file or directory`

- [ ] **Step 2: ファイルを新規作成（完全版）**

Create `docs-template/03-implementation/DECISION_TREE.md` with exactly the following content:

````markdown
---
title: "DECISION_TREE"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

> ⚠️ **SAMPLE — テンプレートです**
> 本ファイルの Q1〜Q6 の分岐内容（Web API バックエンドの例）と追加先チェックリストは **あなたのプロジェクトに合わせて書き換え** てください。
> 書き換え手順は本ファイル「4. プロジェクト固有化の手順」を参照。

# 配置判断ガイド（Decision Tree）

> **Origin**: [PATTERNS.md](./PATTERNS.md) セクション 11（配置判断）
> **Related**: [ARCHITECTURE.md](../02-design/ARCHITECTURE.md) | [DOMAIN.md](../02-design/DOMAIN.md)

## 1. 適用シーン

新機能・新モジュール追加時の「どこに書くか」の判断に迷った場合、本ファイルを最初に参照する。

- **新規ファイル作成前**: Q0 から順に評価し、最初にヒットした分岐を採用
- **既存ファイル拡張時**: 既存ファイルがあればそれを優先、なければ Q0 から判断
- **レビュー時**: 配置妥当性の確認にも使用

### 優先順位ルール

AI は **Q0 から順に評価し、最初にヒットした分岐を採用** する。複数該当時は番号の若い方を優先。

## 2. Decision Tree（Q0〜Q6）

```
Q0. 変更対象はコード？ドキュメント？
├─ ドキュメント → docs-template/ 配下の該当文書を更新
└─ コード → Q1 へ

Q1. 外部システムと通信する？（境界モジュール）
├─ HTTP API クライアント → infrastructure/clients/
├─ DB アクセス → infrastructure/repositories/
├─ メッセージキュー → infrastructure/queues/
├─ ファイルストレージ → infrastructure/storage/
└─ いずれでもない → Q2 へ

Q2. リクエスト入口？（HTTP エンドポイント）
├─ REST ルート → interfaces/controllers/
├─ GraphQL リゾルバ → interfaces/resolvers/
├─ WebSocket → interfaces/websockets/
└─ いずれでもない → Q3 へ

Q3. 複数コンポーネントを束ねる？（オーケストレーション）
├─ 業務フロー（複数ドメイン + リポジトリ組合せ）→ application/use-cases/
├─ バックグラウンドジョブ → application/jobs/
└─ いずれでもない → Q4 へ

Q4. 永続化・状態保持？
├─ DB スキーマ変更 → migrations/ + infrastructure/repositories/
├─ セッション / キャッシュ → infrastructure/cache/
└─ いずれでもない → Q5 へ

Q5. 単一責務のドメインモデル？
├─ エンティティ → domain/entities/
├─ 値オブジェクト → domain/value-objects/
├─ ドメインサービス → domain/services/
└─ いずれでもない → Q6 へ

Q6. 横断的関心事？（Cross-cutting）
├─ 認証・認可 → shared/auth/
├─ ロギング・監視 → shared/logging/
├─ エラーハンドリング → shared/errors/
└─ ユーティリティ → shared/utils/
```

### 該当しない分岐の扱い

自プロジェクトに該当しない分岐（例: WebSocket を使わない場合の Q2、CLI のみで HTTP を持たない場合の Q2 全体）は、「4. プロジェクト固有化の手順」に従い **該当セクションごと削除** してよい。新しい分岐（例: CLI コマンド、Lambda ハンドラ）は同じ手順で追加可能。

## 3. 追加先チェックリスト

> Q1〜Q6 の各分岐の回答と、下表の「追加種別」は **1:1 対応** させる。
> Q1〜Q6 を書き換えた場合は本表も同じ分類で更新する。

| 追加種別 (Q番号) | 実装先 | テスト追加先 | 必須ドキュメント更新 |
|------------------|--------|--------------|---------------------|
| 外部 API クライアント (Q1) | `infrastructure/clients/` | `tests/infrastructure/` | ARCHITECTURE.md |
| DB アクセス (Q1) | `infrastructure/repositories/` | `tests/infrastructure/` | ARCHITECTURE.md |
| REST ルート (Q2) | `interfaces/controllers/` | `tests/interfaces/` | ARCHITECTURE.md |
| ユースケース (Q3) | `application/use-cases/` | `tests/application/` | ARCHITECTURE.md |
| DB スキーマ (Q4) | `migrations/` | `tests/migrations/` | ARCHITECTURE.md, DOMAIN.md |
| エンティティ (Q5) | `domain/entities/` | `tests/domain/` | DOMAIN.md |
| 値オブジェクト (Q5) | `domain/value-objects/` | `tests/domain/` | DOMAIN.md |
| 認証ミドルウェア (Q6) | `shared/auth/` | `tests/shared/` | ARCHITECTURE.md |

> 📝 注: 「雛形」列は Layer 2（templates/ 導入）Issue で追加予定。

## 4. プロジェクト固有化の手順

本ファイルはあくまで **Web API バックエンドのサンプル** です。以下の手順で自プロジェクト向けに書き換えてください。

1. 本ファイルをコピーして自プロジェクトの `docs-template/03-implementation/DECISION_TREE.md` に配置
2. Q1〜Q6 の分岐内容（例: `infrastructure/clients/`）を自プロジェクトの実構成に書き換え
3. 該当しない分岐（例: WebSocket を使わない場合の Q2）は削除
4. 新しい分岐（例: CLI コマンド、Lambda ハンドラ）を追加
5. 「3. 追加先チェックリスト」表も Q1〜Q6 と 1:1 対応させて更新
6. 冒頭の `⚠️ SAMPLE` バナーを削除し、自プロジェクト固有のコンテキストに書き換え

## 5. 参考実装

- [claude-trader PR #55](https://github.com/ai-zamurai/claude-trader/pull/55) — Python / 金融ドメインでの Decision Tree 適用例（パイロット）
- [claude-trader Issue #54](https://github.com/ai-zamurai/claude-trader/issues/54) — パイロット元議論

## Changelog

### 更新ルール

- `infrastructure/` `domain/` `application/` などの配置パスを変更した際は、必ず本ファイルの Q1〜Q6 とチェックリストを同時更新する
- 変更は Changelog に記録する

### [1.0.0] - YYYY-MM-DD

- 初版作成（feel-flow/ai-spec-driven-development#368）
````

- [ ] **Step 3: Markdown lint を実行**

Run: `npm run lint:md`
Expected: `Summary: 0 error(s)`（既存ファイルに影響を与えていないことも確認）

エラーが出た場合の対処: エラーメッセージを読み、該当行を修正。主な注意点: 見出しレベルの連続性（H2 → H3 は OK、H2 → H4 は警告）、長すぎる行、末尾の空白。

- [ ] **Step 4: 必須コンテンツの存在を grep で確認**

Run:

```bash
grep -c "Q0\. 変更対象はコード" docs-template/03-implementation/DECISION_TREE.md
grep -c "Q6\. 横断的関心事" docs-template/03-implementation/DECISION_TREE.md
grep -c "claude-trader PR #55" docs-template/03-implementation/DECISION_TREE.md
grep -c "追加先チェックリスト" docs-template/03-implementation/DECISION_TREE.md
grep -c "プロジェクト固有化の手順" docs-template/03-implementation/DECISION_TREE.md
grep -c "⚠️ \*\*SAMPLE" docs-template/03-implementation/DECISION_TREE.md
```

Expected: 全コマンドで 1 以上が出力される

- [ ] **Step 5: コミット**

```bash
git add docs-template/03-implementation/DECISION_TREE.md
git commit -m "$(cat <<'EOF'
docs: #368 add DECISION_TREE.md — 配置判断ガイド（Layer 1）

新機能の配置判断を AI が迷わず下せるよう、Q0〜Q6 の 7 分岐決定木と
追加先チェックリストをテンプレとして追加。Web API バックエンドを
サンプルドメインとし、ユーザーは「プロジェクト固有化の手順」に従い
自プロジェクトの構成に書き換えて使用する想定。

Issue #368 の 3 層ガードレールのうち Layer 1 のみに限定。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: lint-staged hook (markdownlint-cli2) が通り、コミットが成功。

---

## Task 2: PATTERNS.md に「11. 配置判断」セクションを追加

**Files:**
- Modify: `docs-template/03-implementation/PATTERNS.md`（現状 586 行、Changelog は 580 行目から）

- [ ] **Step 1: 挿入位置の確認**

Run: `grep -n "## Changelog" docs-template/03-implementation/PATTERNS.md`
Expected: `580:## Changelog`

新セクションは **580 行目の直前**（既存「## 10. マジックナンバー禁止」の最後と「## Changelog」の間）に挿入する。

- [ ] **Step 2: Edit tool で 11 節を挿入**

Edit `docs-template/03-implementation/PATTERNS.md`:

**old_string:**

````
}
```

## Changelog
````

**new_string:**

````
}
```

## 11. 配置判断（Decision Tree）

新機能・新モジュール追加時の「どこに書くか」の判断は [DECISION_TREE.md](./DECISION_TREE.md) に委ねる。

本セクションは索引であり、実体は DECISION_TREE.md 側で維持する。

### 使い所

- 新規ファイル作成前の配置判断
- レビュー時の配置妥当性確認
- AI（Claude Code / Cursor / Copilot）が新規コード生成する際の参照元

### 概要

Decision Tree は 7 分岐（Q0〜Q6）で構成される：

| 分岐 | 判定観点 |
|------|---------|
| Q0 | コード変更 or ドキュメント |
| Q1 | 外部システム通信（境界モジュール） |
| Q2 | リクエスト入口（HTTP エンドポイント） |
| Q3 | オーケストレーション（ユースケース） |
| Q4 | 永続化・状態保持 |
| Q5 | ドメインモデル |
| Q6 | 横断的関心事 |

詳細な分岐内容とチェックリストは [DECISION_TREE.md](./DECISION_TREE.md) を参照。

## Changelog
````

注意: `old_string` / `new_string` の先頭「}」「```」は直前のセクション 10（マジックナンバー禁止の最後の code block 閉じ）の一部。**PATTERNS.md:575-580 を事前に Read して `}\n\`\`\`\n\n## Changelog` が一意に存在することを確認してから Edit する**。

- [ ] **Step 3: 変更結果の確認**

Run:

```bash
grep -n "^## 11\. 配置判断" docs-template/03-implementation/PATTERNS.md
grep -n "^## Changelog" docs-template/03-implementation/PATTERNS.md
wc -l docs-template/03-implementation/PATTERNS.md
```

Expected:

- `## 11\. 配置判断` が存在（行番号は 580 付近）
- `## Changelog` が存在（挿入後はより下に移動）
- 行数は 616 前後（元 586 + 新規 30 行）

- [ ] **Step 4: Markdown lint を実行**

Run: `npm run lint:md`
Expected: `Summary: 0 error(s)`

- [ ] **Step 5: コミット**

```bash
git add docs-template/03-implementation/PATTERNS.md
git commit -m "$(cat <<'EOF'
docs: #368 add PATTERNS.md section 11 — DECISION_TREE.md への委譲索引

既存 FALLBACK.md の委譲パターン（PATTERNS.md 3.3 節で概要
＋委譲 → FALLBACK.md に実体）と同じ構造で、新セクション「11. 配置判断」
を追加。7 分岐の概要表を掲載し、詳細は DECISION_TREE.md に委譲。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: コミット成功。

---

## Task 3: MASTER.md の「必須事項」に 7 番目を追加

**Files:**
- Modify: `docs-template/MASTER.md`（現状 `### 必須事項` は 212 行目付近、6 番目「マジックナンバー禁止」は 218 行目）

- [ ] **Step 1: 挿入位置の確認**

Run: `grep -n "マジックナンバー禁止" docs-template/MASTER.md`
Expected: `218:6. **マジックナンバー禁止**: ...`

新項目は 218 行の直後に挿入する。

- [ ] **Step 2: Edit tool で 7 番目を挿入**

Edit `docs-template/MASTER.md`:

**old_string:**

```
6. **マジックナンバー禁止**: 意味のある数値/文字列の直接埋め込みを禁止。必ず名前付き定数または設定から注入し、単位・範囲を明示（詳細は `PATTERNS.md` を参照）

### 命名規則
```

**new_string:**

```
6. **マジックナンバー禁止**: 意味のある数値/文字列の直接埋め込みを禁止。必ず名前付き定数または設定から注入し、単位・範囲を明示（詳細は `PATTERNS.md` を参照）
7. **配置判断**: 新機能追加時の「どこに書くか」は決定木で判断（詳細: [DECISION_TREE.md](./03-implementation/DECISION_TREE.md)）

### 命名規則
```

- [ ] **Step 3: 変更結果の確認**

Run:

```bash
grep -n "^7\. \*\*配置判断" docs-template/MASTER.md
grep -c "DECISION_TREE.md" docs-template/MASTER.md
```

Expected:

- `7. **配置判断**` が見つかる（行番号は 219 付近）
- `DECISION_TREE.md` への参照が 1 件以上存在

- [ ] **Step 4: Markdown lint を実行**

Run: `npm run lint:md`
Expected: `Summary: 0 error(s)`

- [ ] **Step 5: コミット**

```bash
git add docs-template/MASTER.md
git commit -m "$(cat <<'EOF'
docs: #368 add MASTER.md item 7 — 配置判断ルール追加

コード生成ルール > 必須事項に 7 番目として「配置判断」を追加。
「マジックナンバー禁止」（6 番目）と同じ粒度・同じ文体で、AI が
コード生成時に守るべきルールとして DECISION_TREE.md への参照を配置。

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: コミット成功。

---

## Task 4: 統合検証（Lint / Validate / MCP Check）

**Files:** 変更なし（既存スクリプトでの検証のみ）

- [ ] **Step 1: Markdown 全体 lint**

Run: `npm run lint:md`
Expected: `Summary: 0 error(s)`

失敗時の対処: 該当ファイルのエラー箇所を確認し、Edit で修正 → 再実行。

- [ ] **Step 2: docs-template 構造検証**

Run: `node scripts/validate-docs.mjs docs-template`
Expected:
- 全 7 コア文書が検出される（MASTER.md、PROJECT.md、ARCHITECTURE.md、DOMAIN.md、PATTERNS.md、TESTING.md、DEPLOYMENT.md）
- exit code 0
- エラーなし

注: このスクリプトは「コア7文書の存在確認」が主眼で、新規追加の DECISION_TREE.md はコア7文書に含まれないため検出対象外。本検証では既存 7 文書が引き続き正しく存在することを確認する。

- [ ] **Step 3: MCP サーバービルド + スキャン検証**

Run: `npm run check`（これは `npm --prefix mcp run check` を実行 = `npm run build && node dist/index.js --check`）
Expected:
- TypeScript ビルド成功
- MCP サーバーが `docs-template/` を再帰スキャン
- exit code 0、警告なし

失敗時の対処: `mcp/dist/index.js` のログを読み、DECISION_TREE.md のパースエラーがないか確認。

- [ ] **Step 4: MCP ユニットテスト**

Run: `npm test`（= `npm --prefix mcp test` = vitest run）
Expected: 全テストパス

失敗時の対処: 既存テストのスナップショットに依存している場合、`docs-template/` のファイル一覧が変わったことでスナップショットが古くなっている可能性がある。テスト内容を確認し、DECISION_TREE.md の追加が期待値に正しく反映されているか検証（必要ならスナップショット更新）。

- [ ] **Step 5: 変更ファイル一覧の最終確認**

Run: `git log --oneline develop..feature/#368-decision-tree`
Expected: 最低 5 コミット（spec 初版・spec セルフレビュー修正・DECISION_TREE.md・PATTERNS.md・MASTER.md）

Run: `git diff --stat develop..feature/#368-decision-tree -- docs-template/`
Expected:
- `docs-template/03-implementation/DECISION_TREE.md | XXX ++++++++++++` (新規、約 100-150 行)
- `docs-template/03-implementation/PATTERNS.md     | XX ++++++++++++` (30 行追加)
- `docs-template/MASTER.md                          | 1 +` (1 行追加)

- [ ] **Step 6: 統合検証の完了コミット（空コミット、もしくは検証不要）**

検証スクリプトが失敗せず、かつ修正も不要だった場合、追加コミットは不要。スキップしてよい。

スナップショット等の自動更新が発生した場合のみ:

```bash
git add <modified files>
git commit -m "$(cat <<'EOF'
docs: #368 update test snapshots for DECISION_TREE.md addition

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: セルフレビュー（Toolkit + Codex）

**Files:** 変更なし（レビュー実行のみ）

- [ ] **Step 1: PR Review Toolkit によるセルフレビュー**

`/pr-review-toolkit:review-pr` を実行し、複数のサブエージェント（code-reviewer、silent-failure-hunter、type-design-analyzer 等）による並列レビューを受ける。

Expected: Critical / Warnings / Suggestions のカテゴリ別に指摘が列挙される。

- [ ] **Step 2: Codex CLI によるクロスモデルレビュー**

Run: `npm run code-review:codex -- --base develop`
Expected: GPT 系モデルから別観点のレビューが得られる。

- [ ] **Step 3: レビュー指摘への対応**

PR Review Response Policy に従う:
- Critical Issues → 必ず修正
- Warnings → 必ず修正
- Suggestions → 実装が妥当なものは対応

修正が生じた場合:

```bash
git add <modified files>
git commit -m "fix: #368 address review findings — <summary>"
```

---

## Task 6: PR 作成

**Files:** 変更なし（PR 作成のみ）

- [ ] **Step 1: リモートにプッシュ**

```bash
git push -u origin feature/#368-decision-tree
```

- [ ] **Step 2: PR 作成**

```bash
gh pr create --base develop --title "docs: #368 AI向けスパゲッティ防止ガードレール Layer 1 (Decision Tree)" --body "$(cat <<'EOF'
Closes #368（Layer 1 のみ、Layer 2/3 は別 Issue 化予定）

## Summary

- `docs-template/03-implementation/DECISION_TREE.md` を新規追加（Q0〜Q6 の 7 分岐、Web API バックエンドをサンプルドメインとする配置判断テンプレ）
- `docs-template/03-implementation/PATTERNS.md` に新セクション「11. 配置判断（Decision Tree）」を追加（FALLBACK.md と同じ委譲パターン）
- `docs-template/MASTER.md` の「コード生成ルール > 必須事項」に 7 番目「配置判断」を追加

## Test Plan

- [x] `npm run lint:md` — 0 error
- [x] `node scripts/validate-docs.mjs docs-template` — コア7文書整合性 OK
- [x] `npm run check` — MCP サーバースキャン OK
- [x] `npm test` — MCP ユニットテスト OK
- [ ] 手動検証（L5）: 別セッションで以下 3 シナリオを実行
  - Scenario 1: 「OpenAI API を呼ぶクライアントを追加」→ `infrastructure/clients/` 選択
  - Scenario 2: 「User エンティティを追加」→ `domain/entities/` 選択
  - Scenario 3: 「多言語対応のミドルウェアを追加」→ Q6 で `shared/i18n/` 提案

## 関連

- Spec: `docs/superpowers/specs/2026-04-24-issue368-decision-tree-design.md`
- Plan: `docs/superpowers/plans/2026-04-25-issue368-decision-tree.md`
- Issue: #368
- パイロット PR: [ai-zamurai/claude-trader#55](https://github.com/ai-zamurai/claude-trader/pull/55)

## スコープ外（別 Issue 化予定）

- Layer 2: templates/ ディレクトリ導入（Skeleton テンプレ）
- Layer 3: 依存方向 lint 言語別ツール選定ガイド
EOF
)"
```

- [ ] **Step 3: GitHub Copilot レビュー自動化**

```bash
PR_NUMBER=$(gh pr view --json number -q .number)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
gh api --method POST "repos/${REPO}/pulls/${PR_NUMBER}/requested_reviewers" \
  -f "reviewers[]=copilot-pull-request-reviewer"
```

Expected: Copilot がレビュアーに追加され、自動レビューが発火。失敗時は MCP 経由でリクエスト（`mcp__plugin_github_github__request_copilot_review`）にフォールバック。

- [ ] **Step 4: PR URL をユーザーに報告**

Run: `gh pr view --json url -q .url`
Expected: PR URL を取得。報告後、レビュー対応フェーズに入る。

---

## 手動検証（PR マージ前、別セッション推奨）

本プランは Claude Code で実装するが、Decision Tree が実際に AI に読まれて機能するかは **別の AI セッション** で検証するのが最も信頼できる。

### 検証手順

1. 新規セッションを起動
2. このリポジトリ（feature/#368-decision-tree ブランチ）を開く
3. 以下 3 プロンプトを順に投入し、AI の回答を PR 本文に添付

```
Scenario 1: 外部 API クライアント追加
Prompt: 「OpenAI API を呼ぶクライアントを追加して」
期待: AI が DECISION_TREE.md Q1 を辿り infrastructure/clients/ を選択

Scenario 2: ドメインエンティティ追加
Prompt: 「User エンティティを追加して」
期待: AI が DECISION_TREE.md Q5 を辿り domain/entities/ を選択

Scenario 3: 該当分岐なし
Prompt: 「多言語対応のミドルウェアを追加して」
期待: AI が Q6（横断的関心事）で shared/i18n/ 配下 または ARCHITECTURE.md 参照を提案
```

4. 各シナリオの応答を PR コメントに添付（スクショまたはテキスト）

---

## Remember

- 全ての変更は既存の委譲パターン（FALLBACK.md 前例）を踏襲
- 破壊的変更なし、既存ファイル 4 本は無変更、PATTERNS.md は末尾追記のみ、MASTER.md は 1 行追加のみ
- MCP サーバーのコード変更不要（自動スキャン対象に DECISION_TREE.md が追加されるだけ）
- Layer 2 / Layer 3 は別 Issue、本 PR には含めない
