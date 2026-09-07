# AIエージェント向けガイド

この文書は、このプロジェクトで作業するすべてのAIエージェント（Gemini Code Assist、Claude Code、GitHub Copilot、Cursor、その他）に向けた統一ガイドです。

## 🌐 言語設定 (Language Settings)

**すべての応答、解説、コード内のコメントは必ず「日本語」で行ってください。**
(All responses, explanations, and comments must be in Japanese.)

## 🚨 必須: 作業開始前にMASTER.mdを必ず参照

**このプロジェクトで作業を開始する前に、必ず `docs-template/MASTER.md` を読み、内容を理解してください。**

### 📁 重要: 番号付きフォルダ構造を使用

**このプロジェクトでは、コア7文書を起点に番号付きフォルダへ配置し、成長に応じて各フォルダ内に文書を追加します。AIツールは必ずこの構造に従ってください。**

```
docs/
├── MASTER.md                           # 中央管理文書（必須）
├── 01-business/
│   ├── PROJECT.md                      # ビジョンと要件
│   └── DOMAIN.md                       # ビジネスロジック
├── 02-design/
│   └── ARCHITECTURE.md                 # システム設計
├── 03-implementation/
│   └── PATTERNS.md                     # 実装パターン
├── 05-operations/
│   └── DEPLOYMENT.md                   # 運用手順
├── 06-reference/
│   ├── GLOSSARY.md                     # 用語集
│   └── DECISIONS.md                    # 設計判断記録
└── 07-quality/
    └── TESTING.md                      # テスト戦略
```

**重要ポイント**:

- コア7文書は最小構成です。プロジェクトに応じて各フォルダ内に文書を追加してください（例: `02-design/API.md`, `06-reference/GLOSSARY.md`）
- 新しいドキュメントを作成する際は、適切な番号付きフォルダ内に配置してください
- ドキュメント参照時は必ずフォルダパスを含めてください（例: `01-business/PROJECT.md`）
- フラットな `docs/` 直下には MASTER.md のみを配置してください

### なぜMASTER.mdが重要なのか

MASTER.mdには以下の重要な情報が含まれています：

- **プロジェクト識別情報**: プロジェクト名、バージョン、使用AIツール
- **技術スタック**: フロントエンド、バックエンド、データベース、インフラの詳細
- **アーキテクチャパターン**: 採用している設計パターンとその理由
- **コード生成ルール**: 必須事項、命名規則、禁止事項
- **実装優先順位**: Phase 1（MVP）、Phase 2（拡張）、Phase 3（最適化）
- **エラーハンドリング方針**: 統一されたエラー処理の方法
- **セキュリティ要件**: 必須のセキュリティ対策
- **パフォーマンス目標**: 具体的な数値目標
- **AIへのプロンプト補助**: マジックナンバー回避のための制約
- **ドキュメント構造**: 番号付きフォルダの使い方と読み込み順序

### MASTER.mdを参照しない場合のリスク

- プロジェクトの技術スタックと異なる実装を生成
- 禁止されているパターン（any型、マジックナンバー等）を使用
- セキュリティ要件を満たさないコードを生成
- パフォーマンス目標を無視した非効率な実装
- チームのコーディング規約に反するコード
- 誤ったフォルダ構造でドキュメントを作成

## 🚨 重要: 情報不足時の確認ルール

**すべてのAIエージェントは、情報が不足している場合、推論で埋めずに必ず確認を求めること。**

### 必須確認が必要な情報

以下の情報が不明な場合は、**推論せずに必ず確認**してください：

**プロジェクト基本情報**:

- プロジェクト名（具体的な名称）
- ターゲットユーザー（誰のために作るか）
- 主要機能（何を実現するか）
- 技術スタック（使用する言語・フレームワーク）

**技術的詳細**:

- データベース種別（PostgreSQL? MongoDB? MySQL?）
- 認証方式（JWT? OAuth? Session?）
- デプロイ環境（AWS? GCP? Azure? Vercel?）
- API形式（REST? GraphQL? gRPC?）

**ビジネス要件**:

- パフォーマンス要件（具体的な数値）
- セキュリティ要件（必須の対策）
- スケーラビリティ要件（同時接続数等）

### 確認の出力形式（テンプレート）

```markdown
⚠️ 情報不足により確認が必要です

以下の情報が不足しているため、推論では進められません。
確認をお願いします：

【必須確認事項】

1. [項目名]: [何が不明か]
   - 例: データベース種別
   - 理由: PostgreSQLとMongoDBで設計が大きく異なるため
   - 推奨: PostgreSQL（リレーショナルデータの場合）/ MongoDB（ドキュメント指向の場合）

2. [項目名]: [何が不明か]
   ...

【オプション確認事項（推論で進める場合の前提）】

1. [項目名]: [推論内容]
   - 前提: [この前提で進めます]
   - リスク: [後で変更が必要になる可能性]
   - 確認推奨: はい/いいえ

【次のステップ】
上記を確認後、以下のように指示してください：
「[確認された情報]で進めてください」
```

### 推論が許容される範囲（明記が必須）

以下は**明示的な指示がない場合のデフォルト値**として使用可（ただし必ず明記すること）：

- ✅ TypeScript strict mode: 常に有効
- ✅ テストカバレッジ目標: 80%以上
- ✅ マジックナンバー禁止: 常に適用
- ✅ エラーハンドリング: Result pattern使用
- ✅ 命名規則: MASTER.mdの規則に従う

**❌ 推論禁止の例**:

```
悪い例:
「データベースは一般的なので、PostgreSQLで進めます」
→ ユーザーがMySQLを想定していた場合、全て作り直し

良い例:
「データベース種別が指定されていません。
以下から選択してください：
1. PostgreSQL（推奨: リレーショナル、高機能）
2. MySQL（推奨: シンプル、広く普及）
3. MongoDB（推奨: ドキュメント指向、柔軟）
4. その他（具体的に指定してください）」
```

詳細は `docs-template/MASTER.md` の「情報不足時の必須確認プロトコル」を参照。

---

## 各AIエージェント別の設定

### Gemini Code Assist

**設定ファイル**: `AGENTS.md` (本ファイル)

**必須手順**:

1. **常に日本語で応答する** (Always respond in Japanese)
2. プロジェクト開始時に `AGENTS.md` と `docs-template/MASTER.md` を確認
3. コード生成前にMASTER.mdの内容を参照

**プロンプト例**:
`このプロジェクトのAGENTS.mdとMASTER.mdに従い、日本語で[タスク]を行ってください。`

### Claude Code (claude.ai/code)

**設定ファイル**: `CLAUDE.md`

**必須手順**:

1. プロジェクト開始時に `CLAUDE.md` を確認
2. `docs-template/MASTER.md` を必ず読み込む
3. コード生成前にMASTER.mdの内容を参照

**利用可能なスラッシュコマンド**:

| コマンド           | 用途                                                      |
| ------------------ | --------------------------------------------------------- |
| `/init-docs`       | コア7文書 + 拡張フォルダ構造を初期化                      |
| `/validate-docs`   | コア7文書の存在と構造要件を検証                           |
| `/setup-ai-config` | CLAUDE.md / .cursorrules / copilot-instructions.md を生成 |

**プロンプト例**:

```
このプロジェクトで作業を開始する前に、docs-template/MASTER.mdの内容を確認し、以下の点を理解してください：
- 技術スタック（TypeScript、React、Node.js等）
- コード生成ルール（型安全性、エラーハンドリング等）
- 禁止事項（any型、マジックナンバー等）
- 実装優先順位（Phase 1のMVP機能等）

その後、[具体的なタスク]を実装してください。
```

### GitHub Copilot

**設定ファイル**: `.github/copilot-instructions.md` または `AGENTS.md`

**必須手順**:

1. リポジトリのルートに `AGENTS.md` を配置
2. コード補完前にMASTER.mdの内容を確認
3. コメントでMASTER.mdの参照を明記

**コメント例（コード補完時）**:

```typescript
// MASTER.md参照: TypeScript、型安全性必須、マジックナンバー禁止
// Phase 1 MVP機能: ユーザー認証システム
interface User {
  id: string;
  name: string;
  email: string;
}
```

### Cursor

**設定ファイル**: `.cursorrules` または `AGENTS.md`

**必須手順**:

1. `.cursorrules` ファイルにMASTER.md参照を記載
2. チャット機能でMASTER.mdの内容を確認
3. コード生成時にMASTER.mdの制約を適用

**`.cursorrules` の例**:

```
# Cursor Rules for AI Spec-Driven Development

## MANDATORY: Read MASTER.md First
Before generating any code, you MUST read and understand docs-template/MASTER.md.

## Key Constraints from MASTER.md
- TypeScript with strict type safety
- No any types (use unknown or proper types)
- No magic numbers (use named constants)
- Error handling with Result pattern
- Test coverage 80%+
- Follow naming conventions (camelCase, PascalCase, etc.)

## Architecture Patterns
- Clean Architecture
- Repository Pattern
- CQRS (if applicable)
- Event-Driven Architecture

## Security Requirements
- Input sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Proper authentication/authorization
- HTTPS usage
- Environment variable management

## Performance Goals
- Page load time: < 3 seconds
- API response time: < 200ms (95th percentile)
- Concurrent users: 1000

## Implementation Priority
1. Phase 1: MVP features (check MASTER.md for details)
2. Phase 2: Extension features
3. Phase 3: Optimization

Always reference MASTER.md for project-specific requirements.
```

### その他のAIエージェント

**設定ファイル**: `AGENTS.md` または エージェント固有の設定ファイル

**必須手順**:

1. この `AGENTS.md` ファイルを確認
2. `docs-template/MASTER.md` を必ず読み込む
3. プロジェクト固有の要件を理解してから作業開始

## 🤖 作業スタイル（全AIエージェント共通）

すべてのAIエージェントは、以下の作業スタイルに従ってください。

### 進め方

1. **効率的に作業を進める** — 複雑な作業はバックグラウンドで並列処理（品質ゲートの実行中は、その対象ファイルを編集しない。編集したら測り直す）
2. **定期的に進捗を報告する** — 何をしているか、短く分かりやすく伝える
3. **分かりやすい言葉で説明する** — 専門用語を避け、日常的な言葉を使う
4. **エラー時は次にやることを案内する** — 問題の説明 + 具体的な解決手順

### 報告テンプレート

```text
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

---

## 作業フロー

### 1. プロジェクト開始時

1. AGENTS.md を確認
2. docs-template/MASTER.md を読み込む
3. プロジェクトの技術スタックと要件を理解
4. 実装優先順位を確認
5. コーディング規約を理解

### 2. コード生成時

1. MASTER.mdのコード生成ルールを適用
2. 禁止事項を回避
3. セキュリティ要件を満たす
4. パフォーマンス目標を考慮
5. テストコードも同時生成

### 3. コードレビュー時

1. MASTER.mdのチェックリストを確認
2. マジックナンバー/ハードコードがないか確認
3. 型安全性が確保されているか確認
4. エラーハンドリングが適切か確認
5. セキュリティ要件を満たしているか確認

### 4. Git Workflow・セルフレビュー

**基本フロー**: Issue作成 → Branch作成 → 実装 → セルフレビュー → テスト → Commit → PR作成 → **Claude Code + Codex クロスモデルレビュー** → マージ → cleanup → **ACE 知見体系化**

**ACE（知見体系化）**: マージ・cleanup 後に PR から知見を抽出し PLAYBOOK.md に追記する。エントリ ID は **PRスコープ式** `ACE-<PR番号>-<連番>`（並行採番でも衝突しない）。採番ルールの SSOT は [PLAYBOOK.md §エントリID規則](docs-template/08-knowledge/PLAYBOOK.md#エントリid規則)、運用ルール本体は [ACE_SETUP.md §4 テンプレート](docs/ACE_SETUP.md#ace-ops-template)。

**ブランチ命名**: `feature/#{issue}-{description}` / `fix/#{issue}-{description}` / `chore/#{issue}-{description}`

**コミット形式**: `<type>: #<issue> <subject>`（types: feat, fix, docs, style, refactor, test, chore）

**セルフレビュー必須項目**: DRY原則、コード品質、Import整理、テスト、自動チェック通過

詳細は以下のテンプレートを参照:

- [Git Workflow 詳細](docs-template/05-operations/deployment/git-workflow.md)
- [セルフレビュー チェックリスト](docs-template/05-operations/deployment/self-review.md)
- [自動コードレビュー（Claude Code + Husky）](docs-template/05-operations/deployment/automated-code-review.md)

## よくある間違いと回避方法

### ❌ よくある間違い

1. **MASTER.mdを参照せずにコード生成**
   - 結果: プロジェクトの技術スタックと異なる実装
   - 回避: 必ずMASTER.mdを最初に読み込む

2. **マジックナンバーの使用**

   ```typescript
   // ❌ 間違い
   if (user.age > 18) { ... }

   // ✅ 正しい
   const MINIMUM_AGE = 18; // 成人年齢（歳）
   if (user.age > MINIMUM_AGE) { ... }
   ```

3. **any型の使用**

   ```typescript
   // ❌ 間違い
   const data: any = response.data;

   // ✅ 正しい
   interface ApiResponse {
     data: unknown;
   }
   const data: ApiResponse = response.data;
   ```

4. **エラーハンドリングの不備**

   ```typescript
   // ❌ 間違い
   try {
     await riskyOperation();
   } catch (error) {
     // 何もしない
   }

   // ✅ 正しい
   try {
     await riskyOperation();
   } catch (error) {
     logger.error("Operation failed", { error: error.message });
     return { success: false, error: error as Error };
   }
   ```

### ✅ 正しいアプローチ

1. **MASTER.mdの内容を常に参照**
2. **型安全性を確保**
3. **適切なエラーハンドリング**
4. **セキュリティ要件の遵守**
5. **パフォーマンス目標の考慮**

## スコープ外問題の取り扱い

作業中にスコープ外の問題を発見した場合、**即座にGitHub Issueを作成**し、現在のタスクに集中すること。

### 手順

1. **スコープを拡大しない** — 現在のIssueに集中
2. **GitHub Issueを即座に作成**:

   ```bash
   gh issue create --title "fix: 問題の説明" --body "詳細..." --label "bug"
   ```

3. **PRに関連Issueを記載**（ブロッキングでない場合）
4. **現在の作業を続行**

### 報告形式

```text
📋 スコープ外の問題を発見しました
Issue #XXX を作成しました: [タイトル]
優先度: Critical / High / Medium / Low
```

---

## 緊急時の対応

### 問題が発生した場合

1. **MASTER.mdの内容を再確認**
2. **関連するドキュメントを参照**
   - `docs-template/08-knowledge/TROUBLESHOOTING.md`
   - `docs-template/08-knowledge/LESSONS_LEARNED.md`
   - `docs-template/08-knowledge/BEST_PRACTICES.md`
3. **チームメンバーに相談**
4. **問題をLESSONS_LEARNED.mdに記録**

## 更新履歴

| 日付       | 更新者 | 更新内容                                                 |
| ---------- | ------ | -------------------------------------------------------- |
| 2026-01-25 | Gemini | 言語設定（日本語固定）およびGemini Code Assist設定の追加 |

---

## 📚 Related Repositories

- [ai-books](https://github.com/feel-flow/ai-books) - AI技術書の執筆リポジトリ（書籍コンテンツ・校正ツール・ビルドスクリプト）

---

**重要**: この文書は、すべてのAIエージェントが一貫性のある高品質なコードを生成するためのガイドです。必ずMASTER.mdと併せて参照してください。
