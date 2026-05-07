# ベストプラクティス集（索引版）

この文書は、プロジェクトで採用しているベストプラクティスの索引です。各カテゴリの詳細は `best-practices/` ディレクトリ内の個別ファイルを参照してください。

## 概要

ベストプラクティス集は、AIが一貫性のある高品質なコードを生成するための指針をまとめたものです。以下のカテゴリに分類し、それぞれ詳細ガイドとして独立したファイルで管理しています。

## クイックリファレンス

| カテゴリ       | ファイル                                                                            | 主要トピック                                            | いつ使うか              |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------- |
| TypeScript規約 | [01-coding-standards.md](best-practices/01-coding-standards.md)                     | 型安全性、エラーハンドリング、ジェネリクス              | TypeScript実装時        |
| データベース   | [01-coding-standards.md](best-practices/01-coding-standards.md)                     | クエリ最適化、トランザクション、インデックス            | DB設計・実装時          |
| API設計        | [01-coding-standards.md](best-practices/01-coding-standards.md)                     | RESTful API、バリデーション、エラーレスポンス           | APIエンドポイント作成時 |
| セキュリティ   | [02-security-and-testing.md](best-practices/02-security-and-testing.md)             | 認証・認可、暗号化、データ保護                          | セキュリティ実装時      |
| テスト         | [02-security-and-testing.md](best-practices/02-security-and-testing.md)             | 単体テスト、統合テスト、AAAパターン                     | テスト作成時            |
| パフォーマンス | [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) | キャッシュ、非同期処理、並行制御                        | 性能最適化時            |
| ログ・監視     | [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) | 構造化ログ、エラー追跡、監視                            | ロギング実装時          |
| アーキテクチャ | [01-coding-standards.md](best-practices/01-coding-standards.md)                     | レイヤー設計、依存性注入、SOLID原則                     | アーキテクチャ設計時    |
| Git Workflow   | [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) | ブランチ戦略、SessionStart Hook、PR運用                 | Git操作時               |
| ACE Playbook   | [PLAYBOOK.md](./PLAYBOOK.md)                                                        | 構造化エントリ追記ルール、helpful/harmfulカウンター管理 | PR/Issueマージ後        |

## 各カテゴリの概要

### 1. TypeScript規約

**ファイル**: [best-practices/01-coding-standards.md](best-practices/01-coding-standards.md)

**主要内容**:

- 厳密な型定義とany型の回避
- 型ガードとジェネリクスの活用
- Resultパターンによるエラーハンドリング
- カスタムエラークラスの設計

**適用場面**: TypeScriptコード実装全般

### 2. データベース設計

**ファイル**: [best-practices/01-coding-standards.md](best-practices/01-coding-standards.md)

**主要内容**:

- インデックス設計とクエリ最適化
- N+1問題の回避
- トランザクション管理
- パラメータ化クエリの使用

**適用場面**: データベーススキーマ設計、クエリ実装

### 3. API設計

**ファイル**: [best-practices/01-coding-standards.md](best-practices/01-coding-standards.md)

**主要内容**:

- RESTful原則の遵守
- 適切なHTTPメソッドとステータスコード
- スキーマベースバリデーション（Joi等）
- 一貫性のあるエラーレスポンス

**適用場面**: APIエンドポイント設計・実装

### 4. セキュリティ

**ファイル**: [best-practices/02-security-and-testing.md](best-practices/02-security-and-testing.md)

**主要内容**:

- JWT認証の実装
- ロールベース認可
- bcryptによるパスワードハッシュ化
- 機密データの暗号化（AES-256-GCM）

**適用場面**: 認証・認可実装、機密データ処理

### 5. テスト戦略

**ファイル**: [best-practices/02-security-and-testing.md](best-practices/02-security-and-testing.md)

**主要内容**:

- AAAパターン（Arrange-Act-Assert）
- モックとスタブの使い分け
- 統合テストのセットアップ
- テストデータの管理

**適用場面**: ユニットテスト・統合テスト作成

### 6. パフォーマンス最適化

**ファイル**: [best-practices/03-performance-and-operations.md](best-practices/03-performance-and-operations.md)

**主要内容**:

- Redisキャッシュ戦略
- Promise.allによる並列処理
- セマフォによる並行制御
- キャッシュ無効化パターン

**適用場面**: パフォーマンス改善、スケーラビリティ向上

### 7. ログ・監視

**ファイル**: [best-practices/03-performance-and-operations.md](best-practices/03-performance-and-operations.md)

**主要内容**:

- Winston構造化ログ
- リクエストIDトレーシング
- エラースタック記録
- 機密情報のマスキング

**適用場面**: ロギング実装、監視設定

### 8. アーキテクチャパターン

**ファイル**: [best-practices/01-coding-standards.md](best-practices/01-coding-standards.md)

**主要内容**:

- レイヤーアーキテクチャ（Controllers/Services/Repositories/Entities）
- 依存性注入（DI）
- インターフェース駆動設計
- 各層の責務分離

**適用場面**: プロジェクト構造設計、リファクタリング

### 9. Git Workflow

**ファイル**: [best-practices/03-performance-and-operations.md](best-practices/03-performance-and-operations.md)

**主要内容**:

- SessionStart Hookによるブランチ状態チェック
- Issue駆動開発フロー
- ブランチ命名規則（feature/#123-description）
- PRマージ後の自動クリーンアップ

**適用場面**: 開発開始時、PRマージ後

### 10. ACE Playbook運用

**ファイル**: [PLAYBOOK.md](./PLAYBOOK.md)

**主要内容**:

- 構造化エントリの追記ルール（delta方式・末尾追記のみ）
- helpful/harmful カウンターによる知見の有効性追跡
- エントリのライフサイクル管理（active → deprecated）
- 800行超過時のファイル分割ルール

**適用場面**: PR/Issueマージ後のナレッジ記録、AIツール向け知見供給

## 使用ガイド

### AI開発時の参照順序

1. **実装開始前**: [01-coding-standards.md](best-practices/01-coding-standards.md) でプロジェクト構造を確認
2. **コード実装**: [01-coding-standards.md](best-practices/01-coding-standards.md) で型安全性を確保
3. **DB操作**: [01-coding-standards.md](best-practices/01-coding-standards.md) でクエリ最適化を適用
4. **API作成**: [01-coding-standards.md](best-practices/01-coding-standards.md) でRESTful原則に従う
5. **セキュリティ**: [02-security-and-testing.md](best-practices/02-security-and-testing.md) で認証・暗号化を実装
6. **テスト**: [02-security-and-testing.md](best-practices/02-security-and-testing.md) でテストケースを作成
7. **最適化**: [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) でキャッシュ等を適用
8. **監視**: [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) で構造化ログを実装

### 特定の問題に対するガイド選択

**問題**: N+1クエリが発生している
→ [01-coding-standards.md](best-practices/01-coding-standards.md) 「クエリ最適化」セクション

**問題**: 型エラーが頻発する
→ [01-coding-standards.md](best-practices/01-coding-standards.md) 「型安全性の確保」セクション

**問題**: 認証が脆弱
→ [02-security-and-testing.md](best-practices/02-security-and-testing.md) 「認証・認可」セクション

**問題**: テストが不安定
→ [02-security-and-testing.md](best-practices/02-security-and-testing.md) 「モックの適切な使用」セクション

**問題**: レスポンスが遅い
→ [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) 「キャッシュ戦略」セクション

**問題**: エラー原因が特定できない
→ [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) 「構造化ログ」セクション

**問題**: PRマージ後にブランチが混乱
→ [03-performance-and-operations.md](best-practices/03-performance-and-operations.md) 「SessionStart Hook」セクション

## 推奨と禁止の原則

各詳細ファイルは以下の構造で記述されています:

- **推奨 (Recommended)**: ベストプラクティスに従った実装例（コード付き）
- **避けるべき (Avoid)**: アンチパターンの具体例（コード付き）
- **理由 (Rationale)**: なぜ推奨・禁止されるのかの説明

## ファイル一覧

```
docs-template/08-knowledge/best-practices/
├── 01-coding-standards.md          # コーディング規約（型安全性、DB/API設計）
├── 02-security-and-testing.md      # セキュリティ・テスト戦略
└── 03-performance-and-operations.md # パフォーマンス・運用
```

See also: [PLAYBOOK.md](./PLAYBOOK.md) — ACE Playbook（構造化知見、delta方式）

## 更新履歴

| 日付       | 更新者   | 更新内容                                                       |
| ---------- | -------- | -------------------------------------------------------------- |
| 2025-11-05 | システム | ベストプラクティス集を索引版に簡潔化、詳細は個別ファイルに分割 |

## 関連ドキュメント

- [PATTERNS.md](../03-implementation/PATTERNS.md) - 設計パターンと実装パターン
- [TESTING.md](../04-quality/TESTING.md) - テスト戦略の詳細
- [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) - デプロイメントと運用
- [DOMAIN.md](../02-design/DOMAIN.md) - ドメインモデルとビジネスルール

---

**重要**: この索引ファイルは250行未満に保ち、詳細な実装例やコードサンプルは各カテゴリの詳細ファイルに記載してください。
