# Issue #368 Layer 1 — Decision Tree テンプレ追加 設計仕様

## 概要

AI エージェント（Claude Code / Cursor / Copilot）が AI-SDD 採用プロジェクトで「どこに・何を書くか」を迷わないようにするため、**Decision Tree（配置判断の決定木）** を `docs-template/` に追加する。

本仕様は Issue [#368](https://github.com/feel-flow/ai-spec-driven-development/issues/368) が提案する 3 層ガードレール（Decision Tree / Skeleton テンプレ / 依存方向 lint）のうち **Layer 1 のみ** を対象とする。Layer 2（templates/ 導入）と Layer 3（言語別 lint）は別 Issue とする。

## 対象ユーザー

`ai-spec-driven-development` フレームワークを自プロジェクトに導入済みの開発者、および AI-SDD に対応した AI ツールで新機能を実装する AI エージェント。

## 要件

1. **配置判断の決定木を提供**: 新機能追加時の「どこに書くか」の判断を支援する Q0〜Q6 の 7 分岐決定木を `docs-template/03-implementation/` に追加する
2. **サンプル付きテンプレ**: 分岐内容は Web API バックエンドを例にした具体的な配置先（例: `infrastructure/clients/`）を記述し、ユーザーが自プロジェクトの構成に書き換えて使う
3. **追加先チェックリスト**: Decision Tree の結論を受けて「実装先 / テスト追加先 / 必須ドキュメント更新」を一覧化した表を提供する（3 列構成、雛形列は Layer 2 で補完）
4. **既存 7 文書構造の維持**: トップレベル 7 文書（MASTER/PROJECT/ARCHITECTURE/DOMAIN/PATTERNS/TESTING/DEPLOYMENT）を増やさず、既存の `03-implementation/FALLBACK.md` と同じ委譲パターンで新ファイルを追加する
5. **パイロット実装への参照**: 参考実装として claude-trader PR #55 をリンクで記載する

## 対象スコープ

| Issue 受け入れ基準 | スコープ | 本仕様での扱い |
|-------------------|---------|---------------|
| PATTERNS.md に Decision Tree セクション追加 | ✅ | 新セクション「11. 配置判断」として索引＋委譲 |
| PATTERNS.md に追加先チェックリスト追加 | ✅ | DECISION_TREE.md 側に 3 列表として実装 |
| templates/ ディレクトリ導入ガイド（Layer 2） | ❌ | 別 Issue |
| 依存方向 lint 言語別ガイド（Layer 3） | ❌ | 別 Issue |
| claude-trader PR #55 リファレンスリンク | ✅ | DECISION_TREE.md 末尾の「参考実装」節 |

## 作成・変更ファイル一覧

| ファイル | 種別 | 説明 |
|---------|------|------|
| `docs-template/03-implementation/DECISION_TREE.md` | 新規 | Decision Tree 本体・チェックリスト・プロジェクト固有化手順 |
| `docs-template/03-implementation/PATTERNS.md` | 変更 | 新セクション「11. 配置判断（Decision Tree）」を追加、DECISION_TREE.md へ委譲 |
| `docs-template/MASTER.md` | 変更 | コーディングルール節に Decision Tree への一文リンクを追加 |

## 詳細設計

### 1. アーキテクチャ

```
docs-template/
├── MASTER.md                                    [MODIFY: 一文リンク追加]
│
└── 03-implementation/
    ├── PATTERNS.md                              [MODIFY: 11 節追加（約 30 行）]
    ├── DECISION_TREE.md                         [NEW: 約 200 行]
    ├── CONVENTIONS.md                           （変更なし）
    ├── FALLBACK.md                              （変更なし、設計の前例）
    └── INTEGRATIONS.md                          （変更なし）
```

**変更ファイル数**: 3（追加 1、修正 2）

**設計の前例**: 既存の `FALLBACK.md` は「PATTERNS.md セクション 3.3 で概要＋委譲 → FALLBACK.md に実体」という構造を既に採用している。本仕様はこの委譲パターンを踏襲する。

### 2. `docs-template/03-implementation/DECISION_TREE.md`（新規）

#### 2.1 ファイル構造

```markdown
---
title: "DECISION_TREE"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

> ⚠️ **SAMPLE — テンプレートです**
> 本ファイルの Q1〜Q6 の分岐内容（Web API バックエンドの例）と
> 追加先チェックリストは **あなたのプロジェクトに合わせて書き換え** てください。
> 書き換え手順: 本ファイル「4. プロジェクト固有化の手順」参照。

# 配置判断ガイド（Decision Tree）

> **Origin**: [PATTERNS.md](./PATTERNS.md) セクション 11（配置判断）
> **Related**: [ARCHITECTURE.md](../02-design/ARCHITECTURE.md) | [DOMAIN.md](../02-design/DOMAIN.md)

## 1. 適用シーン
## 2. Decision Tree（Q0〜Q6）
## 3. 追加先チェックリスト
## 4. プロジェクト固有化の手順
## 5. 参考実装
## Changelog
```

#### 2.2 Decision Tree 本体（Q0〜Q6、Web API サンプル）

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

**Issue 原案との差分**:
- Q2（Issue 原案「ルールベース or Claude 任せ」）→ 汎用的な「HTTP エンドポイント入口」に置換
- Q6（Issue 原案「ダッシュボード/バックテスト/レポート」）→ 汎用的な「横断的関心事」に置換
- Q0, Q1, Q3, Q4, Q5 は Issue 原案を踏襲

**優先順位ルール**: AI は Q0 から順に評価し、**最初にヒットした分岐を採用** する。複数該当時は番号の若い方を優先。

#### 2.3 追加先チェックリスト（3 列構成）

```markdown
## 3. 追加先チェックリスト

> Q1〜Q6 の各分岐の回答と、下表の「追加種別」は **1:1 対応** させる。
> Q1〜Q6 を書き換えた場合は本表も同じ分類で更新する。

| 追加種別 (Q番号) | 実装先 | テスト追加先 | 必須ドキュメント更新 |
|------------------|--------|--------------|---------------------|
| 外部 API クライアント (Q1) | infrastructure/clients/ | tests/infrastructure/ | ARCHITECTURE.md |
| DB アクセス (Q1) | infrastructure/repositories/ | tests/infrastructure/ | ARCHITECTURE.md |
| REST ルート (Q2) | interfaces/controllers/ | tests/interfaces/ | ARCHITECTURE.md |
| ユースケース (Q3) | application/use-cases/ | tests/application/ | ARCHITECTURE.md |
| DB スキーマ (Q4) | migrations/ | tests/migrations/ | ARCHITECTURE.md, DOMAIN.md |
| エンティティ (Q5) | domain/entities/ | tests/domain/ | DOMAIN.md |
| 値オブジェクト (Q5) | domain/value-objects/ | tests/domain/ | DOMAIN.md |
| 認証ミドルウェア (Q6) | shared/auth/ | tests/shared/ | ARCHITECTURE.md |

> 📝 注: 「雛形」列は Layer 2（templates/ 導入）Issue で追加予定
```

#### 2.4 プロジェクト固有化の手順

```markdown
## 4. プロジェクト固有化の手順

本ファイルはあくまで **Web API バックエンドのサンプル** です。以下の手順で自プロジェクト向けに書き換えてください。

1. 本ファイルをコピーして自プロジェクトの `docs-template/03-implementation/DECISION_TREE.md` に配置
2. Q1〜Q6 の分岐内容（例: `infrastructure/clients/`）を自プロジェクトの実構成に書き換え
3. 該当しない分岐（例: WebSocket を使わない場合の Q2）は削除
4. 新しい分岐（例: CLI コマンド、Lambda ハンドラ）を追加
5. 「3. 追加先チェックリスト」表も Q1〜Q6 と 1:1 対応させて更新
6. 冒頭の `⚠️ SAMPLE` バナーを削除し、自プロジェクト固有のコンテキストに書き換え
```

#### 2.5 参考実装

```markdown
## 5. 参考実装

- [claude-trader PR #55](https://github.com/ai-zamurai/claude-trader/pull/55) — Python / 金融ドメインでの Decision Tree 適用例（パイロット）
- [claude-trader Issue #54](https://github.com/ai-zamurai/claude-trader/issues/54) — パイロット元議論
```

#### 2.6 Changelog

```markdown
## Changelog

### 更新ルール

- `infrastructure/` `domain/` `application/` などの配置パスを変更した際は
  必ず本ファイルの Q1〜Q6 とチェックリストを同時更新する
- 変更は Changelog に記録

### [1.0.0] - YYYY-MM-DD

- 初版作成（feel-flow/ai-spec-driven-development#368）
```

### 3. `docs-template/03-implementation/PATTERNS.md`（変更）

既存 10 セクションの直後、Changelog の前に新セクション「11. 配置判断（Decision Tree）」を追加する（約 30 行、PATTERNS.md 合計 約 616 行でハード制限 800 に対し余裕あり）。

```markdown
## 11. 配置判断（Decision Tree）

新機能・新モジュール追加時の「どこに書くか」の判断は
[DECISION_TREE.md](./DECISION_TREE.md) に委ねる。

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
```

### 4. `docs-template/MASTER.md`（変更）

既存の FALLBACK.md 参照行（現状 `MASTER.md:279` 付近）の近傍に、以下の一文を追加する（具体的な行位置は実装時に該当節の文脈を確認して決定）。

```markdown
- **配置判断**: 新機能追加時の「どこに書くか」は決定木で判断（詳細: [DECISION_TREE.md](./03-implementation/DECISION_TREE.md)）
```

### 5. データフロー

```
[新機能追加指示]
        │
        ▼
  AI (Claude/Cursor/Copilot)
        │
        ① MASTER.md 読込（コーディングルール節で DECISION_TREE.md を認知）
        ▼
  PATTERNS.md 11 節
        │
        ② 7 分岐の概要表で全体像を把握
        │
        ③ 詳細判断が必要なため DECISION_TREE.md へ
        ▼
  DECISION_TREE.md（Q0→Q1→...→Q6）
        │
        ④ 分岐決定（最初にヒットした分岐を採用）
        ▼
  追加先チェックリスト
        │
        ⑤ 実装先・テスト先・必須ドキュメント更新を確認
        ▼
  [コード生成・ファイル配置]
```

**到達経路の二重化**:
- MCP サーバー経由（Claude Desktop / MCP クライアント接続時）: 既存の `DOCS_TEMPLATE_ROOT` 再帰スキャンに DECISION_TREE.md も自動で含まれる（サーバー側コード変更不要）
- 直接ファイル読込（Claude Code CLI / Cursor / Copilot）: MASTER.md リンク、または PATTERNS.md 11 節の委譲リンクで到達

どちらの経路でも同一の `DECISION_TREE.md` に収束する single source of truth 設計。

### 6. エラーハンドリング（テンプレの失敗モードと防御策）

Decision Tree はドキュメントのため実行時例外はない。代わりに **テンプレ採用時・運用時の失敗モード** と防御策を定義する。

| # | 失敗モード | 発生タイミング | 防御策 |
|---|-----------|---------------|--------|
| F1 | Web API サンプルのパスが消えないまま使われる | 採用直後、「4. プロジェクト固有化」手順をスキップ | ファイル冒頭に `⚠️ SAMPLE` バナー |
| F2 | 自プロジェクトと合わない分岐が残る | CLI/バッチ/Lambda 等異なるドメイン | Q2 等の末尾に「該当しない → 該当 Q セクションごと削除可」明記 |
| F3 | Decision Tree とコード実態の乖離 | リファクタ後に更新忘れ | Changelog に「構造変更時は本ファイルも同時更新」注記 |
| F4 | チェックリストが Q1〜Q6 と矛盾 | Q を書き換えたがチェックリスト放置 | チェックリスト冒頭に「Q1〜Q6 と 1:1 対応」明記 |
| F5 | 複数 AI ツールで判断がブレる | MCP 経由 vs 直接読込で差異 | 同一ファイル参照のため構造上発生しない（データフローで担保済み） |

### 7. テスト

| レイヤー | 検証項目 | 実行コマンド | 合格基準 |
|---------|----------|--------------|---------|
| L1: Lint | Markdown 形式・リンク妥当性 | `npm run lint:md` | エラー 0 |
| L2: 文書整合性 | docs-template 全体の構造整合性 | `npm run validate` | 新規追加ファイルが警告を出さない |
| L3: MCP サーバー | 新 DECISION_TREE.md がスキャン対象に含まれる | `npm run check` | exit code 0、警告なし |
| L4: MCP ユニット | スキャン結果に DECISION_TREE.md が登場 | `npm test` | パス |
| L5: 手動検証 | AI ツールがツリーを実際に追従できるか | 別セッションで検証プロンプト実行 | 期待配置先を AI が選択 |

**手動検証シナリオ（L5）**:

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

**手動検証の位置づけ**: L1〜L4 は CI で自動化可能、L5 は PR 本文に実演ログを添付する運用。

## 破壊的変更の有無

なし。

- 既存ファイル（FALLBACK.md, CONVENTIONS.md, INTEGRATIONS.md）は無変更
- PATTERNS.md は末尾追記のみ（既存セクション 1〜10 に影響なし）
- MASTER.md は一文追加のみ
- MCP サーバーはコード変更不要（自動スキャン対象に DECISION_TREE.md が追加されるだけ）

## 次のステップ

本仕様承認後、`superpowers:writing-plans` スキルで実装プランを作成し、プラン承認後に実装を開始する。

## 関連

- Issue: [feel-flow/ai-spec-driven-development#368](https://github.com/feel-flow/ai-spec-driven-development/issues/368)
- パイロット PR: [ai-zamurai/claude-trader#55](https://github.com/ai-zamurai/claude-trader/pull/55)
- パイロット Issue: [ai-zamurai/claude-trader#54](https://github.com/ai-zamurai/claude-trader/issues/54)
- 過去の関連議論: [#353](https://github.com/feel-flow/ai-spec-driven-development/issues/353), [#355](https://github.com/feel-flow/ai-spec-driven-development/issues/355)
