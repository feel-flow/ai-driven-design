# Claude Code セットアップガイド

このガイドでは、Claude Code (claude.ai/code) を AI仕様駆動開発プロジェクトで使用するための初期設定を説明します。

## 目次

1. [Claude Codeとは](#claude-codeとは)
2. [初期セットアップ](#初期セットアップ)
3. [CLAUDE.mdの設定](#claudemdの設定)
4. [プロジェクトコンテキストの提供](#プロジェクトコンテキストの提供)
5. [効果的な使い方](#効果的な使い方)
6. [トラブルシューティング](#トラブルシューティング)

## Claude Codeとは

Claude Code は、Anthropic社が提供するAI開発アシスタントで、以下の特徴があります：

- **大規模コンテキスト**: 200K+ トークンの長大なコンテキストウィンドウ
- **高度な推論能力**: 複雑な設計判断やアーキテクチャ提案に強い
- **日本語対応**: 日本語での自然な対話が可能
- **マルチターン対話**: 継続的な対話で段階的に開発を進められる

## 初期セットアップ

### ステップ1: Claude Pro アカウントの取得（5分）

1. **Claude.ai にアクセス**

   ```
   https://claude.ai
   ```

2. **アカウント作成**
   - メールアドレスで登録
   - または Google/GitHub アカウントで認証

3. **Claude Pro へアップグレード（推奨）**
   - 無料版でも使用可能ですが、Pro版推奨の理由：
     - より多くのメッセージ送信が可能
     - 優先的なアクセス
     - より高速な応答
   - 月額 $20

### ステップ2: Claude Code へアクセス（1分）

1. **Claude Code にアクセス**

   ```
   https://claude.ai/code
   ```

2. **機能確認**
   - コード補完機能が有効か確認
   - ファイルアップロード機能の確認
   - プロジェクト作成機能の確認

## CLAUDE.mdの設定

### ステップ1: CLAUDE.md ファイルの作成（10分）

プロジェクトルートに `CLAUDE.md` を作成します：

```bash
# プロジェクトルートで実行
cat > CLAUDE.md << 'EOF'
# Claude Code 向けガイド

## 🚨 必須: 作業開始前にMASTER.mdを必ず参照

**このプロジェクトで作業を開始する前に、必ず `docs-template/MASTER.md` を読み、内容を理解してください。**

## プロジェクトコンテキスト

このプロジェクトは、AI駆動開発のためのコア7文書を起点とする構造を採用しています（プロジェクトの成長に応じて拡張可能）：

1. **MASTER.md** - プロジェクト全体の概要とルール
2. **PROJECT.md** - ビジネス要件と目標
3. **ARCHITECTURE.md** - 技術アーキテクチャ
4. **DOMAIN.md** - ビジネスロジックとドメインモデル
5. **PATTERNS.md** - 実装パターンとコーディング規約
6. **TESTING.md** - テスト戦略と品質基準
7. **DEPLOYMENT.md** - デプロイメント手順

## 作業フロー

### 1. プロジェクト開始時
```

1. CLAUDE.md を確認（このファイル）
2. docs-template/MASTER.md を読み込む
3. プロジェクトの技術スタックと要件を理解
4. 実装優先順位を確認（Phase 1: MVP → Phase 2: 拡張 → Phase 3: 最適化）
5. コーディング規約を理解

```

### 2. コード生成時
```

1. MASTER.mdのコード生成ルールを適用
2. 禁止事項を回避（any型、マジックナンバー、console.log等）
3. セキュリティ要件を満たす
4. パフォーマンス目標を考慮
5. テストコードも同時生成
6. 🚨 情報不足時は推論せず必ず確認を求める

```

### 3. コードレビュー時
```

1. MASTER.mdのチェックリストを確認
2. 型安全性が確保されているか確認
3. エラーハンドリングが適切か確認
4. セキュリティ要件を満たしているか確認

````

## 🚨 情報不足時の確認ルール（必読）

Claude Codeは、ドキュメント生成やコード生成時に**情報が不足している場合、推論で埋めずに必ず確認を求めること**。

### 必須確認が必要な情報
- プロジェクト名、ターゲットユーザー、主要機能
- 技術スタック（データベース種別、認証方式、API形式等）
- パフォーマンス・セキュリティ・スケーラビリティ要件
- ビジネス要件（予算、期間制約等）

### 確認の出力形式
```markdown
⚠️ 情報不足により確認が必要です

【必須確認事項】
1. データベース種別
   - 理由: PostgreSQLとMongoDBで設計が大きく異なるため
   - 推奨: PostgreSQL（リレーショナル）/ MongoDB（ドキュメント指向）
   - 確認してください: どちらを使用しますか？

2. [その他の不足情報]
   ...

【次のステップ】
上記を確認後、「[確認された情報]で進めてください」と指示してください。
````

### 推論が許容される範囲（明記が必須）

- TypeScript strict mode: 常に有効（明記）
- テストカバレッジ: 80%以上（明記）
- マジックナンバー禁止: 常に適用（明記）
- エラーハンドリング: Result pattern（明記）

詳細は `docs-template/MASTER.md` の「情報不足時の必須確認プロトコル」を参照。

---

## コーディング規約（重要）

| ルール                   | 適用方法                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| **マジックナンバー禁止** | 名前付き定数を使用。単位・有効範囲をコメントに記載                |
| **型安全性**             | TypeScript strict: true, any型禁止（unknownまたは適切な型を使用） |
| **ファイルサイズ**       | ソフトリミット: 500行, ハードリミット: 800行                      |
| **関数サイズ**           | 30行以下を目標                                                    |
| **テストカバレッジ**     | 80%以上                                                           |
| **エラーハンドリング**   | Result pattern使用、console.logは本番環境で禁止                   |
| **未使用コード**         | 未使用のimport・変数は即座に削除                                  |

### 命名規則

| 対象                 | 規則             | 例                                 |
| -------------------- | ---------------- | ---------------------------------- |
| 変数・関数           | camelCase        | `userName`, `isActive`             |
| 定数                 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`                  |
| 型・インターフェース | PascalCase       | `UserProfile`, `ApiResponse`       |
| ファイル（コード）   | kebab-case       | `user-service.ts`, `api-client.ts` |
| ディレクトリ（docs） | 数字-英語小文字  | `01-context`, `02-design`          |
| ファイル（docs）     | 英語大文字.md    | `MASTER.md`, `ARCHITECTURE.md`     |

詳細は `docs-template/03-implementation/CONVENTIONS.md` を参照

## アーキテクチャパターン

- Clean Architecture
- Repository Pattern
- CQRS (Command Query Responsibility Segregation)
- Event-Driven Architecture
- Dependency Injection

## セキュリティ要件

- Input sanitization（入力サニタイゼーション）
- SQL injection prevention（SQLインジェクション対策）
- XSS protection（XSS対策）
- CSRF protection（CSRF対策）
- Proper authentication/authorization（認証・認可）
- HTTPS usage（HTTPS使用）
- Environment variable management（環境変数管理）

## パフォーマンス目標

- Page load time: < 3 seconds
- API response time: < 200ms (95th percentile)
- Concurrent users: 1000

## 実装優先順位

1. **Phase 1: MVP** - 必須機能のみ
2. **Phase 2: Extension** - 追加機能
3. **Phase 3: Optimization** - パフォーマンスとスケーラビリティ

## プロンプトの例

### コード生成時

```
このプロジェクトで作業を開始する前に、docs-template/MASTER.mdの内容を確認し、以下の点を理解してください：
- 技術スタック（TypeScript、React、Node.js等）
- コード生成ルール（型安全性、エラーハンドリング等）
- 禁止事項（any型、マジックナンバー等）
- 実装優先順位（Phase 1のMVP機能等）

その後、[具体的なタスク]を実装してください。
```

### 設計レビュー時

```
docs-template/ARCHITECTURE.mdの内容に基づいて、以下の設計案をレビューしてください：
- Clean Architectureの原則に従っているか
- レイヤー間の依存関係は適切か
- セキュリティ要件を満たしているか
- パフォーマンス目標を達成できるか

[設計案の詳細]
```

### テストコード生成時

```
docs-template/TESTING.mdのテスト戦略に従って、以下の機能のユニットテストを生成してください：
- AAA pattern (Arrange-Act-Assert) を使用
- モックを適切に設定
- エッジケースをカバー
- カバレッジ80%以上を目指す

[テスト対象の機能]
```

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

## 🤖 作業スタイル

### 進め方

1. 複雑な作業はバックグラウンドで効率的に実行する
2. 定期的に進捗を報告する
3. 専門用語を避け、分かりやすい言葉で説明する
4. エラー発生時は次にやるべきことを具体的に案内する

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

## 🚨 Git Workflow（必須）

**常にIssue作成から始める。PRにはセルフレビュー結果を記載すること。**

### ワークフロー

1. **Issue作成** → `gh issue create --title "タイトル" --body "説明"`
2. **Branch作成** → `git checkout -b feature/#123-description`（developから）
3. **実装** → MASTER.mdの規約に従う
4. **セルフレビュー** → 後述のチェックリストを確認
5. **テスト実行** → 全テスト合格必須
6. **Commit** → `git commit -m "feat: #123 説明"`
7. **PR作成** → `gh pr create --base develop`（セルフレビューセクション + `Closes #XXX` 付き）
8. **マージ後** → developに戻り、featureブランチを削除

### ブランチ命名

- `feature/#{issue}-{description}` — 新機能
- `fix/#{issue}-{description}` — バグ修正
- `chore/#{issue}-{description}` — メンテナンス

### コミットメッセージ形式

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

形式: `<type>: #<issue> <subject>`

### レビュー指摘への対応

レビュー指摘を修正した際は、以下の形式でコメントすること:

```
@reviewer-username ご指摘ありがとうございました！
変更内容は commit abc1234 に反映されています。
```

## 🚨 セルフレビューチェックリスト（PR前に必須）

PR作成前に以下を確認すること:

1. **DRY原則**: 重複コード・インポート・マジックナンバーなし
2. **コード品質**: 型注釈、エラーハンドリング、命名規則、デバッグログなし
3. **Import整理**: stdlib → サードパーティ → ローカル（未使用なし）
4. **テスト**: 新規テスト追加、既存テスト更新、全テスト合格
5. **自動チェック**: lint通過、ビルド成功、hook成功

## スコープ外問題の取り扱い

作業中にスコープ外の問題を発見した場合、**即座にGitHub Issueを作成**:

```bash
gh issue create --title "fix: 問題の説明" --body "詳細..." --label "bug"
```

報告形式:

```
📋 スコープ外の問題を発見しました
Issue #XXX を作成しました: [タイトル]
優先度: Critical / High / Medium / Low
```

## よくある問題

| 問題        | 解決方法                             |
| ----------- | ------------------------------------ |
| ポート競合  | 実行中のプロセスを確認               |
| CORS エラー | バックエンドのCORS設定を確認         |
| 型エラー    | 型チェックコマンドでエラー箇所を特定 |
| テスト失敗  | ローカルでテスト実行し、差分を確認   |

## 参照ドキュメント

- `docs-template/MASTER.md` - プロジェクト概要とルール
- `docs-template/01-context/PROJECT.md` - ビジネス要件
- `docs-template/02-design/ARCHITECTURE.md` - 技術アーキテクチャ
- `docs-template/02-design/DOMAIN.md` - ビジネスロジック
- `docs-template/03-implementation/PATTERNS.md` - 実装パターン
- `docs-template/04-quality/TESTING.md` - テスト戦略
- `docs-template/05-operations/DEPLOYMENT.md` - デプロイメント手順

---

**重要**: このガイドは、Claude Codeが一貫性のある高品質なコードを生成するためのものです。必ずMASTER.mdと併せて参照してください。
EOF

````

### ステップ2: プロジェクト固有のカスタマイズ（15分）

あなたのプロジェクトに合わせて `CLAUDE.md` をカスタマイズします。

> **他のAIツール設定ファイルにも同様の記載を推奨**:
> CLAUDE.md に記載した作業スタイル、Git Workflow、セルフレビューチェックリストなどは、
> `AGENTS.md`（Gemini等）や `.github/copilot-instructions.md`（GitHub Copilot）にも
> 同様に記載することで、どのAIツールでも統一された開発体験が得られます。
> 詳細は [AIツール設定ファイルのベストプラクティス](../docs/AI_CONFIG_BEST_PRACTICES.md) を参照してください。

**例1: Reactプロジェクトの場合**
```markdown
## プロジェクト固有のルール

### React コンポーネント
- 関数コンポーネントを使用
- Hooksを活用
- PropTypesではなくTypeScriptの型を使用
- styled-componentsでスタイリング

### 状態管理
- Zustandを使用
- グローバル状態は最小限に
- ローカル状態を優先
````

**例2: Node.js APIプロジェクトの場合**

```markdown
## プロジェクト固有のルール

### API設計

- RESTful API設計原則に従う
- OpenAPI 3.0仕様を使用
- バージョニング: /api/v1/...

### エラーハンドリング

- Result pattern を使用
- HTTP status codeを適切に設定
- エラーメッセージは構造化
```

## プロジェクトコンテキストの提供

### ステップ1: MASTER.mdをアップロード（2分）

1. **Claude Code で新しいプロジェクトを作成**
   - プロジェクト名を入力（例: "My AI-Driven Project"）

2. **MASTER.mdをアップロード**

   ```
   1. Claude Code の画面で「ファイルをアップロード」をクリック
   2. docs-template/MASTER.md を選択
   3. アップロード完了を待つ
   ```

3. **コンテキスト確認プロンプト**

   ```
   このMASTER.mdの内容を確認し、プロジェクトの技術スタック、
   コーディング規約、実装優先順位を理解してください。

   理解した内容を簡潔に要約してください。
   ```

### ステップ2: 関連ドキュメントの追加（5分）

必要に応じて他のドキュメントもアップロードします：

```
- docs-template/02-design/ARCHITECTURE.md（アーキテクチャ検討時）
- docs-template/02-design/DOMAIN.md（ビジネスロジック実装時）
- docs-template/03-implementation/PATTERNS.md（実装パターン確認時）
- docs-template/04-quality/TESTING.md（テスト作成時）
```

## 効果的な使い方

### 1. マルチターン対話の活用

Claude Codeは複数回の対話を通じて段階的に開発を進めるのが得意です：

```
あなた: ユーザー認証機能を実装したいです。MASTER.mdの要件に従って設計案を提案してください。

Claude: [設計案を提案]

あなた: 良いですね。では、まずUser entityから実装してください。

Claude: [User entity実装]

あなた: テストコードも追加してください。

Claude: [テストコード追加]
```

### 2. 大規模コンテキストの活用

Claude Codeは大量のコードを一度に処理できます：

```
プロンプト例：
以下のファイル全体をレビューし、MASTER.mdのコーディング規約に違反している箇所を指摘してください：
- src/services/user-service.ts
- src/repositories/user-repository.ts
- src/models/user.ts

[ファイル内容をペースト]
```

### 3. アーキテクチャ設計の相談

Claude Codeは複雑な設計判断に強いです：

```
プロンプト例：
このプロジェクトで以下の2つのアプローチを検討しています。
MASTER.mdのアーキテクチャパターン（Clean Architecture、Repository Pattern）
に照らし合わせて、どちらが適切か分析してください：

アプローチA: [詳細]
アプローチB: [詳細]

評価基準:
- 保守性
- テスタビリティ
- パフォーマンス
- スケーラビリティ
```

### 4. コードレビュー

既存コードのレビューを依頼：

```
プロンプト例：
以下のPull Requestをレビューしてください。
MASTER.mdの以下の観点でチェックしてください：
- 型安全性
- エラーハンドリング
- セキュリティ
- パフォーマンス
- コーディング規約

[コード diff をペースト]
```

## トラブルシューティング

### 問題1: Claude Codeがプロジェクトルールを無視する

**原因**: MASTER.mdの内容を忘れている、または認識していない

**解決策**:

```
プロンプト例：
もう一度 docs-template/MASTER.md の内容を確認してください。
特に以下の点に注意してコードを生成してください：
- マジックナンバー禁止
- any型禁止
- エラーハンドリング必須
```

### 問題2: 生成されたコードの品質が低い

**原因**: プロンプトが曖昧、またはコンテキスト不足

**解決策**:

1. **具体的な要件を明示**

   ```
   ❌ 悪い例:
   「ユーザー管理機能を作って」

   ✅ 良い例:
   「MASTER.mdのClean Architectureパターンに従って、
   以下の機能を持つユーザー管理機能を実装してください：
   - ユーザー登録（メールアドレス、パスワード）
   - ユーザー認証（JWT使用）
   - パスワードハッシュ化（bcrypt使用）
   - エラーハンドリング（Result pattern使用）
   - ユニットテスト（80%以上のカバレッジ）」
   ```

2. **参照ドキュメントを明示**

   ```
   「docs-template/PATTERNS.mdのRepository Patternに従って実装してください」
   ```

### 問題3: コンテキストウィンドウの制限

**原因**: アップロードしたファイルが多すぎる、または大きすぎる

**解決策**:

1. **必要なファイルのみアップロード**
   - MASTER.mdは必須
   - その他は必要に応じて

2. **重い処理はスキル（サブエージェント）で実行**
   - コードレビュー、全コードベーススキャンなど、10ファイル以上を読み込む処理はスキルとして実行
   - サブエージェントは独立コンテキストで動作し、メインセッションのトークン枠を消費しない
   - 詳細は [Commands vs Skills ガイド](../docs/CLAUDE_CODE_COMMANDS_SKILLS.md) を参照

3. **ファイルを分割してアップロード**
   - 大きなファイルは必要な部分のみ抽出

4. **要約を活用**

   ```
   「MASTER.mdの内容を要約して、今回の実装に必要な部分のみ教えてください」
   ```

### 問題4: Claude Codeの応答が遅い

**原因**: 大量のコードを一度に生成している、またはサーバーが混雑

**解決策**:

1. **段階的に実装**

   ```
   一度に全機能を実装するのではなく、以下の順で段階的に：
   1. インターフェース定義
   2. 基本実装
   3. エラーハンドリング
   4. テストコード
   ```

2. **Claude Pro を利用**
   - 優先アクセスで応答が速くなる

## ベストプラクティス

### 1. プロジェクト開始時のテンプレート

新しいプロジェクトを開始する際のプロンプトテンプレート：

```
# 新規プロジェクト開始

## プロジェクト情報
- プロジェクト名: [プロジェクト名]
- 技術スタック: [TypeScript, React, Node.js, etc.]
- アーキテクチャ: Clean Architecture
- データベース: [PostgreSQL, MongoDB, etc.]

## 実装する機能（Phase 1 MVP）
1. [機能1]
2. [機能2]
3. [機能3]

## 必須制約（docs-template/MASTER.mdより）
- TypeScript strict mode
- マジックナンバー禁止
- any型禁止
- エラーハンドリング必須（Result pattern）
- テストカバレッジ 80%+

## 今回のタスク
[具体的なタスク内容]

## 期待する成果物
- [ファイル1]
- [ファイル2]
- テストコード
```

### 2. コードレビューのテンプレート

```
# コードレビュー依頼

## レビュー対象
[ファイルパスまたはPR番号]

## チェック項目（docs-template/MASTER.mdより）
- [ ] 型安全性（any型なし）
- [ ] マジックナンバーなし
- [ ] エラーハンドリング適切
- [ ] セキュリティ要件満たす
- [ ] パフォーマンス目標考慮
- [ ] テストコード付き

## 特に注意すべき点
[プロジェクト固有の注意点]

## コード
[コードをペースト]
```

### 3. バグ修正のテンプレート

```
# バグ修正依頼

## 発生している問題
[問題の詳細]

## 再現手順
1. [手順1]
2. [手順2]
3. [手順3]

## 期待する動作
[期待する動作]

## 現在の動作
[現在の動作]

## 関連コード
[問題のあるコードをペースト]

## 制約（docs-template/MASTER.mdより）
- MASTER.mdのコーディング規約を遵守
- 既存のテストを壊さない
- 新しいテストを追加
```

## チームでの利用

### 共有設定

チームで Claude Code を使う場合、CLAUDE.md をリポジトリに含めることで設定を共有できます：

```bash
# リポジトリに追加
git add CLAUDE.md
git commit -m "Add Claude Code configuration"
git push origin main
```

### チームメンバー向けオンボーディング

新しいチームメンバーには以下を共有：

1. **この SETUP_CLAUDE_CODE.md**
2. **CLAUDE.md**（プロジェクト固有のルール）
3. **docs-template/MASTER.md**（プロジェクト全体のルール）

## まとめ

Claude Code のセットアップは以下の3ステップ：

1. **アカウント取得**（5分）
   - Claude Pro 推奨（月額 $20）

2. **CLAUDE.md 作成**（25分）
   - テンプレートをカスタマイズ
   - プロジェクト固有のルールを追加

3. **コンテキスト提供**（7分）
   - MASTER.md をアップロード
   - 関連ドキュメントを追加

**合計所要時間**: 約40分

### 次のステップ

1. ✅ Claude Code のセットアップ完了
2. → [GETTING_STARTED_NEW_PROJECT.md](./GETTING_STARTED_NEW_PROJECT.md) で実際のプロジェクト開始
3. → [docs-template/MASTER.md](./MASTER.md) で詳細なプロジェクトルール確認
4. → [ACE サイクル運用手順](./05-operations/deployment/ace-cycle.md) でマージ後の知見体系化を設定。エントリ ID は **PRスコープ式** `ACE-<PR番号>-<連番>`（採番ルールの SSOT は [エントリID規則](./08-knowledge/PLAYBOOK.md#エントリid規則)）

---

**参考リンク**:

- [Claude.ai](https://claude.ai)
- [Claude Code](https://claude.ai/code)
- [Anthropic Documentation](https://docs.anthropic.com/)
- [MASTER.md](./MASTER.md)
- [AGENTS.md](../AGENTS.md)
