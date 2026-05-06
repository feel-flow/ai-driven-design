---
id: ai-config-best-practices
title: AIツール設定ファイルのベストプラクティス
version: 1.0.0
status: active
created: 2026-02-08
updated: 2026-05-06
owner: feel-flow
phase: mvp
tags: [ai, configuration, best-practices, claude-code, copilot, cursor]
references:
  - docs/PRACTICAL_GUIDE.md
  - docs-template/SETUP_CLAUDE_CODE.md
  - docs-template/SETUP_CURSOR.md
  - docs-template/SETUP_GITHUB_COPILOT.md
changeImpact: medium
---

# AIツール設定ファイルのベストプラクティス

> **関連文書**:
>
> - [実践ガイド](PRACTICAL_GUIDE.md) - AI Spec Driven Developmentの全体ガイド
> - [Claude Code セットアップ](../docs-template/SETUP_CLAUDE_CODE.md) - CLAUDE.md テンプレート付き
> - [Cursor セットアップ](../docs-template/SETUP_CURSOR.md) - .cursorrules テンプレート付き
> - [GitHub Copilot セットアップ](../docs-template/SETUP_GITHUB_COPILOT.md) - copilot-instructions.md テンプレート付き

## はじめに

AIツール設定ファイル（CLAUDE.md, AGENTS.md, copilot-instructions.md, .cursorrules）は、AIに「コーディングルール」を伝えるだけの存在ではありません。

**AIの作業プロセス全体** — 報告の仕方、Git運用、レビュー対応、問題発見時の行動 — を設定ファイルに記載することで、AIが "チームメンバー" として一貫した行動を取れるようになります。

### 各ファイルの役割と対応ツール

| ファイル                          | 対応ツール                             | 読み込みタイミング             | 配置場所           |
| --------------------------------- | -------------------------------------- | ------------------------------ | ------------------ |
| `CLAUDE.md`                       | Claude Code                            | セッション開始時に自動読み込み | プロジェクトルート |
| `AGENTS.md`                       | Gemini Code Assist, 汎用AIエージェント | セッション開始時に自動読み込み | プロジェクトルート |
| `.github/copilot-instructions.md` | GitHub Copilot                         | コード補完・チャット時に参照   | `.github/`         |
| `.cursorrules`                    | Cursor                                 | エディタ起動時に自動読み込み   | プロジェクトルート |

### このガイドで紹介するベストプラクティス

多くのプロジェクトでは、設定ファイルにコーディング規約とアーキテクチャパターンのみを記載しています。しかし、実プロダクト開発の経験から、以下の**運用プロセス系の記載**が品質向上に大きく貢献することがわかっています。

| #   | ベストプラクティス                                                                        | 効果                                     |
| --- | ----------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | [作業スタイルの定義](#1-作業スタイルの定義work-style-guidelines)                          | AIの報告が統一され、進捗が追いやすくなる |
| 2   | [Key Constraintsのテーブル形式記載](#2-key-constraintsのテーブル形式記載)                 | AIがルールを見落としにくくなる           |
| 3   | [Git Workflowの設定ファイル内記載](#3-git-workflowの設定ファイル内記載)                   | AIが正しいブランチ・コミット運用を行う   |
| 4   | [Self-Review Checklistの設定ファイル内記載](#4-self-review-checklistの設定ファイル内記載) | PR前の品質チェックが自動化される         |
| 5   | [スコープ外問題の取り扱い](#5-スコープ外問題の取り扱い)                                   | 発見した問題が見逃されなくなる           |
| 6   | [Review Feedback Responseパターン](#6-review-feedback-responseパターン)                   | レビュー対応が統一される                 |
| 7   | [Automated Checks & Hooksの文書化](#7-automated-checks--hooksの文書化)                    | AIがhookを理解し、適切に対応できる       |
| 8   | [Common Issuesテーブル](#8-common-issuesテーブル)                                         | よくある問題の自己解決率が上がる         |
| 9   | [モノレポでの設定ファイル配置](#9-モノレポでの設定ファイル配置)                           | パッケージごとの最適化と重複排除         |

---

## 1. 作業スタイルの定義（Work Style Guidelines）

### なぜ設定ファイルに作業スタイルを記載すべきか

AIはデフォルトでは「コードを書いて終わり」の振る舞いになりがちです。しかし、チーム開発では **進捗の可視化** と **分かりやすい説明** が不可欠です。設定ファイルに作業スタイルを明記することで、AIが一貫した報告パターンで作業を進めます。

### テンプレート

```markdown
## 作業スタイル

### 進め方

1. 複雑な作業はバックグラウンドで効率的に実行する
2. 定期的に進捗を報告する
3. 専門用語を避け、分かりやすい言葉で説明する
4. エラー発生時は次にやるべきことを具体的に案内する

### 報告テンプレート

✅ 完了しました

- [完了した作業の説明]
- 変更内容は自動でチェック済みです

⏳ 作業中...

- [現在の作業内容]
- あと少しで完了します

❌ 問題が見つかりました

- [問題の説明]
- 次のステップ: [具体的な解決手順]
```

### 各ツールでの適用

- **CLAUDE.md**: Claude Codeはマルチターン対話が得意。Taskツールの活用指示も記載するとよい
- **AGENTS.md**: 全エージェント共通のため、ツール固有の指示は省略し汎用的に記載
- **copilot-instructions.md**: コード補完が主用途のため、このセクションは省略してもよい
- **.cursorrules**: 補完用途に加えComposer/AgentでGit操作も発生するため、最低限の作業スタイルとGit Workflowを含める

---

## 2. Key Constraintsのテーブル形式記載

### なぜテーブル形式が有効か

AIの読み取り精度は、情報の構造化度合いに大きく依存します。散文やリスト形式よりも **テーブル形式** のほうが、AIがルールを見落としにくくなります。

### テンプレート

```markdown
## コード品質ルール（厳格適用）

| ルール                   | 適用方法                                                    |
| ------------------------ | ----------------------------------------------------------- |
| **マジックナンバー禁止** | 名前付き定数を使用。単位・有効範囲をコメントに記載          |
| **型安全性**             | TypeScript strict: true, any型禁止                          |
| **ファイルサイズ**       | ソフトリミット: 500行, ハードリミット: 800行                |
| **関数サイズ**           | 30行以下を目標（プロジェクトに合わせて調整）                |
| **テストカバレッジ**     | 80%以上                                                     |
| **エラーハンドリング**   | プロジェクトの方針に従う（例: Result pattern, try-catch等） |
```

### 命名規則のテーブル例

```markdown
## 命名規則

| 言語       | 変数・関数 | クラス・型 | 定数             | ファイル      |
| ---------- | ---------- | ---------- | ---------------- | ------------- |
| TypeScript | camelCase  | PascalCase | UPPER_SNAKE_CASE | kebab-case.ts |
| Python     | snake_case | PascalCase | UPPER_SNAKE_CASE | snake_case.py |
```

### 参考: 実プロジェクトでの使用例

以下は実際のプロダクト開発プロジェクトで使用されているテーブルです:

```markdown
| ルール                   | 適用方法                                                  |
| ------------------------ | --------------------------------------------------------- |
| **マジックナンバー禁止** | 名前付き定数を使用。単位・有効範囲をコメントに記載        |
| **型安全性**             | Python: Type Hints必須。TypeScript: strict: true, any禁止 |
| **ファイルサイズ**       | ソフト: 500行, ハード: 800行                              |
| **関数サイズ**           | 50行以下を目標                                            |
| **テストカバレッジ**     | 80%以上                                                   |
| **エラーハンドリング**   | try-catch + ユーザー向け日本語メッセージ                  |

> **注**: 上記は実プロジェクトの例です。関数サイズやエラーハンドリング方針はプロジェクトごとに異なります。
> 自プロジェクトの MASTER.md に定義された値を使用してください。
```

---

## 3. Git Workflowの設定ファイル内記載

### なぜ設定ファイルにGit Workflowを記載すべきか

AIはGit操作を自律的に行うことが増えています。しかし、ブランチ命名やコミットメッセージのフォーマットはプロジェクトごとに異なります。設定ファイルに明記しないと、AIが独自のフォーマットでコミットしてしまいます。

### テンプレート

```markdown
## Git Workflow（必須）

**常にIssue作成から始める。PRにはセルフレビュー結果を記載すること。**

### ワークフロー

1. **Issue作成** → `gh issue create --title "タイトル" --body "説明"`
2. **Branch作成** → `git checkout -b feature/#123-description`（developから）
3. **実装** → MASTER.md の規約に従う
4. **セルフレビュー** → 後述のチェックリストを確認
5. **テスト実行** → `npm test`（全テスト合格必須）
6. **Commit** → `git commit -m "feat: #123 説明"`
7. **PR作成** → `gh pr create --base develop`（セルフレビューセクション付き）
8. **マージ後** → developに戻り、featureブランチを削除

### ブランチ命名

- `feature/#{issue}-{description}` — 新機能
- `fix/#{issue}-{description}` — バグ修正
- `chore/#{issue}-{description}` — メンテナンス

### コミットメッセージ形式

`<type>: #<issue> <subject>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### PR要件

- "Self-Review Results" セクションを含めること
- "Test Results" セクションを含めること
- Issueとリンク: `Closes #XXX`
```

### 既存テンプレートとの連携

詳細なGit Workflowは [git-workflow.md](../docs-template/05-operations/deployment/git-workflow.md) に用意されています。設定ファイルには要約を記載し、詳細はテンプレートを参照する構成が推奨です。

---

## 4. Self-Review Checklistの設定ファイル内記載

### なぜ設定ファイルに含めるべきか

セルフレビューのチェックリストを設定ファイルに含めることで、AIがPR作成前に **自動的にチェックを実行** し、問題を事前に検出できます。別ファイル（self-review.md）に記載するだけでは、AIがそのファイルを参照しない可能性があります。

### テンプレート

```markdown
## セルフレビューチェックリスト（PR前に必須）

PR作成前に以下を確認すること:

1. **DRY原則**: 重複コード・インポート・マジックナンバーなし
2. **コード品質**: 型注釈、エラーハンドリング、命名規則、デバッグログなし
3. **Import整理**: stdlib → サードパーティ → ローカル（未使用なし）
4. **ドキュメント**: Docstring更新済み、複雑なロジックにコメント
5. **テスト**: 新規テスト追加、既存テスト更新、全テスト合格
6. **自動チェック**: lint通過、ビルド成功、hook成功
```

### プロジェクト固有の項目追加例

```markdown
## セルフレビューチェックリスト（PR前に必須）

1. **DRY原則**: 重複コード・マジックナンバーなし
2. **コード品質**: 型注釈、エラーハンドリング、命名規則
3. **テスト**: 新規テスト追加、全テスト合格
4. **自動チェック**: `npm run type-check && npm run test:unit -- --run && npm run build`
5. **フロントエンドスタイル**: PrimeVue → TailwindCSS → Custom CSS（ハードコードされた色なし）
```

### 既存テンプレートとの連携

5つの観点による詳細なセルフレビューは [self-review.md](../docs-template/05-operations/deployment/self-review.md) に用意されています。

---

## 5. スコープ外問題の取り扱い

### なぜこのルールが必要か

AIが作業中にスコープ外の問題を発見することはよくあります。しかし、ルールがないと以下のいずれかになりがちです:

- **問題を無視する** → 技術的負債が蓄積
- **スコープを拡大して対応する** → 元のタスクが遅延

「即座にIssueを作成して、現在のタスクに集中する」というルールを設定ファイルに明記することで、問題の記録と作業の集中を両立できます。

### テンプレート

```markdown
## スコープ外問題の取り扱い

作業中にスコープ外の問題を発見した場合、**即座にGitHub Issueを作成**し、
現在のタスクに集中すること。

### 手順

1. **スコープを拡大しない** — 現在のIssueに集中
2. **GitHub Issueを即座に作成**:
   `gh issue create --title "fix: 問題の説明" --body "詳細..." --label "bug"`
3. **PRに関連Issueを記載**（ブロッキングでない場合）
4. **現在の作業を続行**

### 報告形式

📋 スコープ外の問題を発見しました
Issue #XXX を作成しました: [タイトル]
優先度: Critical / High / Medium / Low
```

---

## 6. Review Feedback Responseパターン

### なぜ統一すべきか

レビュー指摘への対応形式を統一することで、レビュワーが変更内容を追いやすくなります。特に、どのコミットで修正したかを明記することが重要です。

### テンプレート

```markdown
## レビュー指摘への対応

レビュー指摘を修正した際は、以下の形式でコメントすること:

> @reviewer-username ご指摘ありがとうございました！
> 変更内容は commit abc1234 に反映されています。

### 必須要素

- レビュワーへの@メンション
- 修正を含むcommit SHA の参照
- 変更内容の簡潔な説明（必要に応じて）
```

---

## 7. Automated Checks & Hooksの文書化

### なぜ設定ファイルに記載すべきか

AIがGit hookの存在を知らないと、hook失敗時に混乱したり、`--no-verify` で強引にスキップしたりします。設定ファイルにhookの情報を記載することで、AIが適切に対応できます。

### テンプレート

```markdown
## 自動チェック

### Git Hooks（Husky）

#### Pre-Commit

- 変更されたファイルに対してlintを自動実行
- 実行: `git commit` 時に自動
- スキップ: `git commit --no-verify`（**AIは許可なくスキップ禁止**）

#### Pre-Push

- TypeScript型チェック、セキュリティスキャン
- 実行: `git push` 時に自動

### CI（GitHub Actions）

| ワークフロー | トリガー             | 内容                   |
| ------------ | -------------------- | ---------------------- |
| CI           | PR / push to develop | ビルド + テスト + lint |
| Code Review  | PR open              | AIコードレビュー       |

**AI向けルール**: hookは絶対にユーザーの許可なくスキップしないこと（`--no-verify`, `SKIP_*=1`）
```

### 削除防止ハーネスの追加

hooks を導入する場合、lint や format だけではなく **削除事故防止** を最優先で含めることを推奨します。

特に GitHub Copilot Agent のように terminal を使うAIでは、workspace 内編集と terminal cleanup を分けて扱う必要があります。file edit は workspace 境界の中で扱えても、terminal cleanup は cwd やシェル構文の影響を受けるためです。

最低限、設定ファイルまたは hook で以下を明文化してください。

- 削除系コマンドは auto-approve に入れない
- 相対パス削除を禁止する
- ワイルドカード削除を禁止する
- cleanup 対象は workspace 配下の専用ディレクトリに限定する
- `Bypass Approvals` や `Autopilot` を使う場合も `PreToolUse` hook を最終防衛線にする

Windows を主対象とする場合は、sandbox を前提にせず approval と hook で防御する設計が必要です。macOS では sandbox による補強が可能ですが、sandbox は削除禁止ではなく境界制御です。

詳細な設計標準は [agent-deletion-prevention-harness.md](../docs-template/05-operations/deployment/agent-deletion-prevention-harness.md) を参照してください。

---

## 8. Common Issuesテーブル

### なぜテーブル形式が有効か

よくある問題をテーブル形式でまとめておくと、AIが自己解決できる範囲が広がります。トラブルシューティングの情報は、設定ファイルの末尾に配置するのが定番です。

### テンプレート

```markdown
## よくある問題

| 問題                    | 解決方法                                 |
| ----------------------- | ---------------------------------------- |
| ポート競合（8000/8080） | 実行中のプロセスを確認                   |
| CORS エラー             | バックエンドのCORS設定を確認             |
| 型エラー                | `npm run type-check` でエラー箇所を特定  |
| テスト失敗              | `npm test` でローカル実行し、差分を確認  |
| ブランチが乖離          | `git reset --hard origin/develop` で同期 |
```

---

## 9. モノレポでの設定ファイル配置

書籍 付録「AIエージェント設定ファイル一覧」では、モノレポ（複数パッケージを 1 リポジトリで管理する構成）における AI 設定ファイルの配置原則として「**最も近いファイルが優先される**」というルールが整理されています。これは Claude Code / Cursor / GitHub Copilot いずれも共通の挙動です。

### 配置原則

- **ルート**: 全パッケージ共通の設定（プロジェクト全体のコーディング規約、Git Workflow、必須参照ドキュメント）
- **パッケージごと**: パッケージ固有の設定（依存ライブラリ、命名規則の例外、テスト戦略の差異）
- **解決順序**: AI ツールは編集対象ファイルから上方向にディレクトリを辿り、**最初に見つかった設定ファイルを優先**する（より近い＝より具体的な指示が勝つ）

### ディレクトリ構造例

```text
my-monorepo/
├── AGENTS.md                       # 共通: 全 AI エージェント向け
├── CLAUDE.md                       # 共通: Claude Code 向け
├── .github/
│   └── copilot-instructions.md     # 共通: GitHub Copilot 向け
├── docs-template/
│   └── MASTER.md                   # 共通: プロジェクト全体の参照
├── packages/
│   ├── api/                        # バックエンド（Node.js + Hono）
│   │   ├── CLAUDE.md               # API 固有: 認証パターン、DB 接続規約
│   │   └── src/
│   ├── web/                        # フロントエンド（Next.js）
│   │   ├── CLAUDE.md               # Web 固有: コンポーネント設計、SSR/CSR 切り分け
│   │   └── src/
│   └── shared/                     # 共有ユーティリティ（TS）
│       ├── CLAUDE.md               # shared 固有: 型エクスポート規約
│       └── src/
└── apps/
    ├── admin/                      # 管理画面（Vite）
    │   └── CLAUDE.md
    └── mobile/                     # モバイル（React Native）
        └── CLAUDE.md
```

### 各レベルでの記載内容（推奨）

| レベル                   | 記載すべき内容                                                 | 記載しない方がよい内容                        |
| ------------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| **ルート CLAUDE.md**     | 共通コーディング規約、Git Workflow、必須参照、命名規則の基本   | パッケージ固有の依存ライブラリ、特定 API 仕様 |
| **パッケージ CLAUDE.md** | そのパッケージで使うフレームワーク、ライブラリ、テストパターン | プロジェクト全体に適用すべきルール（重複）    |
| **AGENTS.md**            | ツール非依存の共通指示（ルートのみ）                           | ツール固有の機能（Task ツール等）             |

### 運用ルール

- **ルートで定義したルールはパッケージで重複させない** — 重複は更新漏れの温床になり、AI が古い指示を参照するリスクが高まる（Single Source of Truth 原則）
- **パッケージ固有のルールはそのパッケージの `CLAUDE.md` だけに書く** — ルートに混ぜると他パッケージにも誤って適用される
- **更新時は影響範囲をチェック** — ルートの変更は全パッケージに波及する。`/assess-impact` 相当のレビューを行う

> **参考**: 本リポジトリ自体は単一パッケージ構成のため上記例は採用していませんが、`ai-spec-driven-development` の docs-template を実プロジェクトに適用する際の参考として整理しています。

---

## まとめ: 設定ファイル別チェックリスト

各設定ファイルに含めるべき項目の推奨チェックリストです。プロジェクトの規模や運用に合わせて取捨選択してください。

### CLAUDE.md

CLAUDE.mdはClaude Codeが自動的に読み込む設定ファイルです。マルチターン対話やTaskツールなど、Claude Code固有の機能を活かした記載が可能です。

- [x] MASTER.md必須参照ルール
- [x] 情報確認プロトコル
- [x] **作業スタイル**（進捗報告）
- [ ] Taskツール活用（Claude Code固有、推奨）
- [x] Key Constraints テーブル
- [x] 命名規則テーブル
- [x] **Git Workflow**（ブランチ、コミット、PR）
- [x] **セルフレビューチェックリスト**
- [x] **スコープ外問題の取り扱い**
- [x] **Review Feedback Responseパターン**
- [x] **Automated Hooks 情報**
- [x] **削除防止ハーネス情報**
- [x] **Common Issues テーブル**
- [x] 参照ドキュメント一覧

### AGENTS.md

AGENTS.mdは全AIエージェント共通のガイドです。ツール固有の機能には依存せず、汎用的な記載にします。

- [x] MASTER.md必須参照ルール
- [x] 情報確認プロトコル
- [x] **作業スタイル**（進捗報告）
- [x] Key Constraints テーブル
- [x] 命名規則テーブル
- [x] **スコープ外問題の取り扱い**
- [x] 作業フロー（コード生成時、レビュー時）
- [x] 各AIエージェント別の設定
- [x] 参照ドキュメント一覧

### copilot-instructions.md

GitHub Copilotはコード補完とPRレビューが主用途です。作業スタイルやGit Workflowは省略し、コーディングルールに集中します。

- [x] MASTER.md / AGENTS.md 必須参照ルール
- [x] Key Constraints テーブル
- [x] 命名規則テーブル
- [x] コード生成ルール（Before / During / After）
- [x] PRレビューのポリシー
- [x] 参照ドキュメント一覧

### .cursorrules

Cursorはエディタ内でのコード補完とチャットが主用途ですが、Composer/Agent実行時はGit操作まで自律的に行うため、Git Workflowとセルフレビュー要件も必ず含めます。

- [x] MASTER.md必須参照ルール
- [x] 情報確認プロトコル
- [x] Key Constraints テーブル
- [x] 命名規則テーブル
- [x] **Git Workflow**（Issue/Branch/PR）
- [x] **セルフレビューチェックリスト**
- [x] **スコープ外問題の取り扱い**
- [x] コード生成ルール
- [x] 参照ドキュメント一覧

---

## 参考資料

- [Claude Code セットアップ](../docs-template/SETUP_CLAUDE_CODE.md) — CLAUDE.md テンプレート
- [Commands vs Skills ガイド](CLAUDE_CODE_COMMANDS_SKILLS.md) — コンテキスト管理の最適化戦略
- [Cursor セットアップ](../docs-template/SETUP_CURSOR.md) — .cursorrules テンプレート
- [GitHub Copilot セットアップ](../docs-template/SETUP_GITHUB_COPILOT.md) — copilot-instructions.md テンプレート
- [Git Workflow 詳細](../docs-template/05-operations/deployment/git-workflow.md) — 7ステップワークフロー
- [セルフレビュー 詳細](../docs-template/05-operations/deployment/self-review.md) — 5観点チェックリスト
- [自動コードレビュー](../docs-template/05-operations/deployment/automated-code-review.md) — Claude Code + Husky
