# STEP 2: copilot-instructions.md の設定

**所要時間**: 5-30分（方法による）

このドキュメントでは、`.github/copilot-instructions.md`の作成方法を説明します。

---

## 2-1: .githubフォルダの作成

プロジェクトのルートディレクトリで以下を実行：

```bash
# プロジェクトルートで実行
mkdir -p .github
```

---

## 2-2: copilot-instructions.mdの作成方法を選択

あなたのプロジェクトに合わせて、以下から選択してください：

### 方法の比較

| 方法                | 所要時間   | 適している場合                |
| ------------------- | ---------- | ----------------------------- |
| **A: AIプロンプト** | **5-10分** | MASTER.md作成済み、AI利用可能 |
| B: テンプレート     | 15分       | 既存プロジェクトから流用      |
| C: 手動作成         | 30分       | フルカスタマイズしたい        |

---

## 方法A: AIプロンプトで自動生成（推奨・最速）

**所要時間**: 5-10分

### この方法が最適な場合

- プロジェクトの `docs-template/MASTER.md` がすでに作成済み
- AIツール（Claude Code、GitHub Copilot Chat、Cursor）が使える
- プロジェクト固有のルールを確実に反映したい

### 手順

#### 1. AIツールを開く

- **GitHub Copilot Chat**: VS Codeで `Cmd+I` (macOS) または `Ctrl+I` (Windows/Linux)
- **Claude Code**: <https://claude.ai/code>
- **Cursor**: `Cmd+L` (macOS) または `Ctrl+L` (Windows/Linux)

#### 2. プロンプトを使用

以下のプロンプトをコピーして貼り付け：

```
以下のプロジェクト情報に基づいて、GitHub Copilot用の .github/copilot-instructions.md を生成してください。

# プロジェクト情報
- プロジェクト名: [あなたのプロジェクト名]
- 技術スタック: [例: TypeScript, React, Node.js, PostgreSQL]
- アーキテクチャ: [例: Clean Architecture, Microservices]

# 必須制約（docs-template/MASTER.mdより）
[ここに MASTER.md の「コード生成ルール」セクションをコピペ]

# プロジェクト固有のルール
[あなたのプロジェクト固有のルールがあれば記入]
例:
- React: 関数コンポーネントのみ使用
- 状態管理: Zustand使用
- スタイリング: Tailwind CSS使用

# 出力形式
- Markdown形式で出力
- セクション構成:
  1. プロジェクト概要
  2. 技術スタック
  3. コード生成ルール
  4. 命名規則
  5. 禁止事項
  6. アーキテクチャパターン
  7. セキュリティ要件
  8. パフォーマンス目標
  9. ドキュメント参照
  10. コードレビューチェックリスト

# 制約
- MASTER.mdの内容を必ず反映すること
- マジックナンバー禁止を明記
- any型禁止を明記
- エラーハンドリング（Result pattern）を明記
- テストカバレッジ80%以上を明記

# 🚨 重要: 情報不足時の確認ルール
情報が不足している場合、推論で埋めずに必ず確認を求めること。

必須確認事項:
- プロジェクト名、ターゲットユーザー、主要機能
- 技術スタック（データベース種別、認証方式、API形式等）
- パフォーマンス・セキュリティ要件

確認の出力形式:
```

⚠️ 情報不足により確認が必要です

【必須確認事項】

1. [項目名]: [何が不明か]
   - 理由: [なぜ確認が必要か]
   - 推奨: [推奨される選択肢]

【次のステップ】
上記を確認後、「[確認された情報]で進めてください」と指示してください。

```

詳細は docs-template/MASTER.md の「情報不足時の必須確認プロトコル」を参照。
```

#### 3. 生成された内容を保存

```bash
# AIが生成した内容をコピーして以下を実行
cat > .github/copilot-instructions.md << 'EOF'
[ここにAIが生成した内容を貼り付け]
EOF
```

#### 4. 内容を確認・微調整

- プロジェクト名が正しいか確認
- 技術スタックが最新か確認
- プロジェクト固有のルールが含まれているか確認

### プロンプトのカスタマイズ例

#### Reactプロジェクトの場合

```
# プロジェクト固有のルール
- React 18使用
- 関数コンポーネントのみ（クラスコンポーネント禁止）
- Hooks優先（useState, useEffect, useContext等）
- PropTypesではなくTypeScriptの型を使用
- styled-componentsでスタイリング
- 状態管理: Zustand
- ルーティング: React Router v6
```

#### Node.js APIプロジェクトの場合

```
# プロジェクト固有のルール
- Node.js 24 LTS使用
- Express.js使用
- RESTful API設計
- OpenAPI 3.0仕様必須
- JWT認証
- Prisma ORM使用
- バージョニング: /api/v1/...
- エラーハンドリング: Result pattern必須
```

#### Next.jsプロジェクトの場合

```
# プロジェクト固有のルール
- Next.js 14 App Router使用
- Server Components優先
- Client Componentsは'use client'明記
- データフェッチ: fetch with cache
- 認証: NextAuth.js
- スタイリング: Tailwind CSS
- 状態管理: Zustand（クライアント側）
```

### 利点

- 最速（5-10分）
- MASTER.mdの内容を確実に反映
- プロジェクト固有のルールを自動的に統合
- 一貫性のある記述

---

## 方法B: このリポジトリからコピー

**所要時間**: 15分

```bash
# このリポジトリをクローン済みの場合
cp path/to/ai-spec-driven-development/.github/copilot-instructions.md \
   .github/copilot-instructions.md
```

その後、プロジェクト固有の内容に書き換えてください。

---

## 方法C: 手動で作成

**所要時間**: 30分

以下の内容で `.github/copilot-instructions.md` を新規作成：

```markdown
# GitHub Copilot Instructions

## 🚨 MANDATORY: Read MASTER.md First

Before generating any code suggestions, you MUST read and understand `docs-template/MASTER.md`.

## Project Context

[ここにプロジェクトの概要を記入]

## Key Constraints from MASTER.md

### Type Safety

- Use TypeScript with strict type safety
- No `any` types (use `unknown` or proper types)
- Explicit type definitions for all variables, functions, and API responses

### Code Quality

- No magic numbers/hardcoded values (use named constants)
- No `console.log` in production code
- No unused imports or variables
- No error swallowing (always handle errors properly)
- Functions should be under 30 lines

### Naming Conventions

#### Code

- Variables: camelCase (e.g., `userName`, `isActive`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Types/Interfaces: PascalCase (e.g., `UserProfile`, `ApiResponse`)
- Files: kebab-case (e.g., `user-service.ts`)

#### Documentation Files

- Directories: `number-lowercase-hyphen` (e.g., `01-context`, `02-design`)
- Files: `UPPERCASE.md` (e.g., `MASTER.md`, `ARCHITECTURE.md`)

### Error Handling

- Use Result pattern for error handling
- Implement try-catch blocks with proper error messages
- Log errors with structured logging

### Testing

- Generate unit tests for all functions (80%+ coverage target)
- Use AAA pattern (Arrange-Act-Assert)
- Mock dependencies appropriately

## Architecture Patterns

[プロジェクトで使用するアーキテクチャパターンを記入]

- Clean Architecture
- Repository Pattern
- etc.

## Document References

- `docs-template/MASTER.md` - Project overview and rules
- `docs-template/01-context/PROJECT.md` - Business requirements
- `docs-template/02-design/ARCHITECTURE.md` - Technical architecture
- `docs-template/03-implementation/PATTERNS.md` - Implementation patterns
- `docs-template/04-quality/TESTING.md` - Testing strategies

## Code Review Checklist

- [ ] MASTER.md rules followed
- [ ] No magic numbers/hardcoded values
- [ ] Type safety ensured
- [ ] Error handling implemented
- [ ] Tests generated
- [ ] Security requirements met
- [ ] Naming conventions followed
```

---

## 2-3: MASTER.md統合（重要）

### MASTER.mdからコピーすべき内容

1. **Project Context**
   - `docs-template/MASTER.md` の「プロジェクト概要」セクション

2. **Architecture Patterns**
   - `docs-template/MASTER.md` の「アーキテクチャパターン」セクション

3. **コード生成ルール**
   - 型安全性のルール
   - マジックナンバー禁止
   - エラーハンドリングパターン
   - テストカバレッジ目標

### 統合例

```markdown
## Key Constraints from MASTER.md

### Type Safety (from MASTER.md)

- TypeScript strict mode必須
- any型禁止（unknownまたは適切な型を使用）
- 全ての変数・関数・APIレスポンスに明示的な型定義

### Magic Number Prohibition (from MASTER.md)

- マジックナンバー・ハードコード値禁止
- 全ての意味のある値は名前付き定数に抽出
- 単位（ms, KB等）と有効範囲を文書化
- 定数はアーキテクチャ層ごとに整理
```

---

## AIプロンプトを使った高度なカスタマイズ

### 1. 既存コードベースから学習させる

```
以下の既存コードベースの特徴を分析して、
.github/copilot-instructions.md に追加すべきプロジェクト固有のルールを提案してください。

# 分析対象
[ここに主要なファイルのコードを貼り付け]

# 分析観点
- 使用しているライブラリとそのバージョン
- コーディングスタイル（関数の長さ、命名規則等）
- エラーハンドリングのパターン
- テストの書き方
- ファイル構造の規則

# 出力形式
Markdown形式で、copilot-instructions.mdに追加すべきルールとして出力してください。
```

### 2. チーム規約を自動変換

```
以下のチームコーディング規約を、
GitHub Copilot用の.github/copilot-instructions.mdに変換してください。

# チームコーディング規約
[ここにチームの既存のコーディング規約を貼り付け]

# 要件
- GitHub Copilotが理解しやすい形式に変換
- 具体的なコード例を追加
- 禁止事項は明確に❌マークで示す
- 推奨事項は✅マークで示す
```

### 3. 特定の技術スタック向けに最適化

```
以下の技術スタックに最適化された、
.github/copilot-instructions.mdの「プロジェクト固有のルール」セクションを生成してください。

# 技術スタック
- フロントエンド: [例: React 18, TypeScript, Tailwind CSS]
- バックエンド: [例: Node.js, Express, Prisma]
- データベース: [例: PostgreSQL]
- 認証: [例: NextAuth.js]
- デプロイ: [例: Vercel]

# 含めるべき内容
- フレームワーク固有のベストプラクティス
- パフォーマンス最適化のルール
- セキュリティ要件
- 禁止パターン
- コード例
```

---

## よくある質問

### Q: AIが生成した内容をそのまま使っても大丈夫？

A: 必ず以下を確認してください：

- プロジェクト名が正しいか
- 技術スタックのバージョンが最新か
- MASTER.mdの内容と矛盾がないか
- チーム独自のルールが含まれているか

### Q: 既存のcopilot-instructions.mdを更新したい場合は？

A: 以下のプロンプトを使用：

```
以下の既存の.github/copilot-instructions.mdを、
新しい要件に基づいて更新してください。

# 既存の内容
[現在のcopilot-instructions.mdの内容]

# 追加・変更する要件
[新しい要件や変更内容]

# 更新方針
- 既存のルールは維持
- 矛盾する部分は新しい要件を優先
- 重複を避ける
```

### Q: 複数のAIツールでプロンプトを試したい場合は？

A: 各ツールで試して、最も良い結果を選択：

1. GitHub Copilot Chat で生成
2. Claude Code で生成
3. Cursor で生成
4. 結果を比較して最適なものを選択

---

## STEP 2 完了チェック

以下をすべて確認してください：

- [ ] `.github/copilot-instructions.md` を作成完了
- [ ] プロジェクト固有の情報を記入完了
- [ ] MASTER.mdの内容が反映されているか確認完了
- [ ] 技術スタックのルールが含まれている
- [ ] コード生成ルールが明記されている

---

## 次のステップ

copilot-instructions.mdの設定が完了したら、次はVS Code設定のカスタマイズです：

[STEP 3: VS Code設定のカスタマイズ](./configuration.md)
