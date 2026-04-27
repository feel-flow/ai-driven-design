# /init-docs — AI仕様駆動開発ドキュメント初期化

プロジェクトに AI仕様駆動開発のコア7文書 + 拡張フォルダ構造をセットアップします。

## 前提

- このコマンドはターゲットプロジェクトのルートで実行してください
- `docs/` ディレクトリが既に存在する場合は上書きしません（確認を求めます）

## 手順

### 1. ユーザー情報の確認

以下の情報をユーザーに確認してください（AskUserQuestion を使用）:

- **プロジェクト名**: 具体的な名称
- **技術スタック**: FE/BE/DB/Infra
- **プロジェクト概要**: 1-2文の説明

### 2. ディレクトリ構造の作成

以下の構造を作成します:

```
docs/
├── MASTER.md
├── 01-context/
│   ├── PROJECT.md
│   └── CONSTRAINTS.md
├── 02-design/
│   ├── ARCHITECTURE.md
│   ├── DOMAIN.md
│   ├── API.md
│   └── DATABASE.md
├── 03-implementation/
│   ├── PATTERNS.md
│   ├── CONVENTIONS.md
│   └── INTEGRATIONS.md
├── 04-quality/
│   ├── TESTING.md
│   └── VALIDATION.md
├── 05-operations/
│   └── DEPLOYMENT.md
├── 06-reference/
│   ├── GLOSSARY.md
│   └── DECISIONS.md
└── 07-project-management/
    ├── ROADMAP.md
    ├── TASKS.md
    └── RISKS.md
```

### 3. テンプレートの適用

各ファイルの内容は、以下のリポジトリのテンプレートを参照してコピーしてください:

- **リポジトリ**: `feel-flow/ai-spec-driven-development`
- **テンプレートパス**: `docs-template/` 配下の対応するファイル

テンプレート内のプレースホルダー（`{{プロジェクト名}}`、`{{技術スタック}}` など）はステップ1で確認した情報で置換してください。

### 4. MASTER.md のカスタマイズ

MASTER.md は特に重要です。以下を必ず反映してください:

- **プロジェクト識別**: プロジェクト名、バージョン、最終更新日
- **技術スタック要約**: FE/BE/DB/Infra
- **守るべきルール**: 命名規則、エラーハンドリング方針、テスト方針
- **情報不足時の確認プロトコル**: そのまま含める
- **ドキュメント索引リンク**: 作成した各ドキュメントへの相対パス

### 5. 完了報告

作成したファイル一覧を表示し、次のステップとして `/validate-docs` の実行を推奨してください。

### 6. （任意）ACE autonomous テンプレートの案内

ユーザーが **マージ後の ACE を subagent + worktree で自動化**したい場合のみ、AskUserQuestion で希望を確認する。

- **オプション例**: 「はい（テンプレートの場所を案内）」/「いいえ（スキップ）」
- **はい**の場合: `docs-template/05-operations/deployment/ace-autonomous.md` と `docs-template/scripts/ace/` をコピー先の目安とともに説明する。feature flag（`ACE_SUBAGENT_ENABLED` 等）は **デフォルト無効** で開始することを必ず伝える。
- **いいえ**の場合: 既存の手動 `/ace-curate` 運用で問題ない旨を一言添える。

## 重要ルール

- テンプレートの構造と必須セクションは変更しないこと
- プレースホルダーは必ず実際の値で置換すること
- `MASTER.md` の「情報不足時の確認プロトコル」セクションは必ず含めること
- 既存ファイルがある場合は上書きせず、ユーザーに確認すること
