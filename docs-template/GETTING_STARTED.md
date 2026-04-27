# AI駆動（ドキュメント基準）開発 Quickstart

前提（重要）

- ドキュメントは「AIが確実に理解できること」を第一基準にします。人間の読みやすさは副次。まずAIが迷わない構造と明確さを優先します。
- エンジニアは理解しづらい箇所があれば、当該ドキュメントを根拠にAI（Claude Code / GitHub Copilot）と対話して理解を深めてください。
- ドキュメントにはAI生成の推測・補完が含まれる場合があります（元のソースコードや一次資料に未記載の内容が混入し得る）。エンジニアは必ず一次情報（ソース/設定/設計資料/実行結果/テスト）で検証し、乖離があればSSOTへ即時反映（重複は参照化）してください。
- 初期の文書整備フェーズが最重要です。ここでの明確さが以後の速度・品質・コストを大きく左右します。
- 所要時間（ ~60分 / ~90分 など）は目安です。チーム/AIが慣れるほど短縮されます。

AI（Claude Code / GitHub Copilot）で迷わず実装できる「最小限の高品質ドキュメント」を素早く整えるための実務ガイドです。新規開始と既存プロジェクトの途中参加の双方に対応します。

---

## ゴール（2時間で到達したい状態）

- MASTER.md が最新で、AIが最初に読むべき統合ハブになっている
- Single Source of Truth（SSOT）が決まり、重複/矛盾がない
- 直近の1機能について、要件→設計→テストの最短ループが回せる

---

## まずやることチェックリスト（共通 15分）

### 📁 番号付きフォルダ構造を使用

**重要**: AIツールは以下の番号付きフォルダ構造を使用してください。

```
docs/
├── MASTER.md                           # 中央管理文書
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

### チェックリスト

- [ ] docs/MASTER.md を開き、以下4点を最新化
  - [ ] プロジェクト識別（名前/バージョン/最終更新日/使用AIツール）
  - [ ] 技術スタック要約（FE/BE/DB/Infra）
  - [ ] 守るべきルール（命名/エラーハンドリング/テスト方針/マジックナンバー禁止）
  - [ ] 詳細ドキュメントの索引リンク（PROJECT/ARCHITECTURE/DOMAIN/TESTING/DEPLOYMENT）
- [ ] 06-reference/GLOSSARY.md に用語を1画面分で定義（同義語は排除）
- [ ] 06-reference/DECISIONS.md に最新の重要決定を1行要約で追記
- [ ] （推奨）Claude Code SessionStart Hook を設定（詳細は 05-operations/DEPLOYMENT.md 参照）
  - PRマージ後のブランチ切り替え忘れを防止
  - `.claude/hooks/check-branch-status.sh` を実行可能に設定

---

## 新規で始める（~60分）

1. 最小ドキュメント3点だけを埋める（30分）

- docs/MASTER.md… 上記4点＋「読ませる順序」を明記
- docs/01-business/PROJECT.md… Why/Who/What/Success＋MVPの受け入れ基準
- docs/02-design/ARCHITECTURE.md… レイヤ構成/依存方向/データフロー/例外方針/テスト層割合
  （余力があれば docs/01-business/DOMAIN.md にユビキタス言語と主要エンティティを箇条書き）

2. 最初の1機能を要件化（15分）

- PROJECT.md にユーザーストーリー1件＋受け入れ基準（Given/When/Then）
- TESTING.md にその機能のテスト観点（Unit/Integration/E2Eのどれをどこまで）

3. AI初回同期（15分）

- 下記「AIに読ませる順序と粒度」に従い、MASTER→PROJECT→ARCHITECTURE→（必要なら DOMAIN）だけを参照させて実装指示

---

## 途中から参加/既存をAI駆動に寄せる（~90分）

1. ドキュメント棚卸し（20分）

- 情報の所在表を作る：要件/設計/用語/決定/テスト/運用のSSOTを1ファイルずつ決める
- 重複と矛盾をマーキング（後続で統合）

2. 統合と整流化（40分）

- 重複をSSOTへ集約し、他ファイルは参照に置換
- MASTER.md に「読ませる順序」「参照禁止/推奨ファイル」を明記
- GLOSSARY で用語統一（コードの命名と一致）

3. AIスモークテスト（30分）

- 小さなタスクをAIに実装させ、生成物で不足ドキュメントを逆引きして補完
- 受け入れ基準→テスト→実装→レビューの1ループを回す

---

## AIに読ませる順序と粒度（トークン最適化）

1. MASTER.md（必須）
2. 01-business/PROJECT.md（機能のWhy/受け入れ基準）
3. 02-design/ARCHITECTURE.md（層/依存/エラー/データフロー）
4. 01-business/DOMAIN.md（必要時のみ：用語/ルール/主要エンティティ）
5. 07-quality/TESTING.md（書き方/層の割合/命名）
6. 05-operations/DEPLOYMENT.md（必要時のみ：CI/CDや設定）
7. 06-reference/[GLOSSARY/DECISIONS]（曖昧さ解消）

ポイント

- まず要約→必要に応じ詳細へ。全読みは避ける
- 情報が無い箇所はAIに「明示的に質問」させるルールを提示

---

## Claude Code / GitHub Copilot 用プロンプト（貼って使える）

新規機能の実装指示（最小ドキュメント参照のみ）

```
目的: リポジトリのAI駆動ルールに従い、<機能名> を実装する。
参照順序（この順で読み、他は見ない）:
- docs/MASTER.md
- docs/01-business/PROJECT.md
- docs/02-design/ARCHITECTURE.md
- （必要時）docs/01-business/DOMAIN.md

要件: PROJECT.md の受け入れ基準を満たすこと。テストは 07-quality/TESTING.md のパターン・命名に従い同時生成。
制約: マジックナンバー/ハードコード禁止（定数or設定から注入）。型安全/エラーパターンは 03-implementation/PATTERNS.md に準拠。
出力: 変更ファイル一覧→実装→テスト→要点サマリ。疑義は実装前に質問。
```

ドキュメント逆引き（不足点の抽出）

```
目的: 生成物から不足ドキュメントを特定し、追記案を作る。
入力: 直近の変更差分/テスト失敗内容
出力: 追記が必要なファイルと具体追記案（箇条書き）。SSOT原則に従い、重複は参照化する提案も含める。
```

用語統一チェック（コードと用語の整合）

```
目的: コード中の命名と GLOSSARY.md の用語を整合させる。
出力: 不一致一覧（コード名 → 推奨名）と、最小変更案（影響範囲/リネーム手順）。
```

---

## 最低限のDefinition of Done（AI駆動用）

- 受け入れ基準がテストで裏付けられている（Unit中心、必要に応じIntegration/E2E）
- マジックナンバー禁止・定数/設定化済み（単位/範囲の明示）
- 例外/エラーがResultパターン等で一貫処理・ログ指針に準拠
- 変更点が MASTER.md の優先度/方針と矛盾しない

---

## 1スプリント導入ロードマップ（例）

- Day 1: MASTER/PROJECT/ARCHITECTURE の最小充足、GLOSSARY 着手
- Day 2: 代表機能をAI実装→テスト同時生成→不足ドキュメントを逆引きで補完
- Day 3: SSOT徹底（重複排除/参照化）→AIスモーク→CIで自動テスト常時化

---

## よくある落とし穴と対策

- 量＞質のドキュメント… 要約1枚→詳細は参照の多層化
- ファイル横断の矛盾… SSOT決定＋DECISIONSで履歴化
- 用語ブレ… GLOSSARYをコード命名と同時に維持

---

## Claude Skillsでさらに生産性を向上（推奨）

Claude Code ユーザーは、AI仕様駆動開発専用のスキルを導入することで、ドキュメント管理を自動化できます。

### Claude Skillsとは

Claude Skillsは、特定のワークフローに特化した再利用可能な機能パッケージです。AI仕様駆動開発スキルをインストールすると、Claude Codeが自動的に以下を実行します：

- プロジェクト初期化（フォルダ構造の自動生成）
- ドキュメント構造の検証と自動補修
- 新規ドキュメントの適切な配置支援
- ドキュメント更新時の影響度評価
- MASTER.md索引の自動更新
- Frontmatterメタデータの自動挿入
- コミット前の検証チェックリスト実行

### クイックインストール（5分）

Claude Codeで以下のプロンプトを実行するだけで、スキルが自動生成されます：

```
Claude Code用のスキルを作成したいです。

【目的】
AI仕様駆動開発の方法論に基づいて、プロジェクトのドキュメント構造を自動管理するスキルを作成

【参考資料】
- 公式リポジトリ: https://github.com/feel-flow/ai-spec-driven-development
- 方法論ドキュメント: https://github.com/feel-flow/ai-spec-driven-development/blob/develop/ai_spec_driven_development.md

【実装してほしい機能】
1. プロジェクト初期化（フォルダ構造の自動生成）
2. ドキュメント構造の検証と自動補修
3. 新規ドキュメントの適切な配置支援
4. ドキュメント更新時の影響度評価
5. MASTER.md索引の自動更新
6. Frontmatterメタデータの自動挿入
7. 用語集・決定記録の管理
8. コミット前の検証チェックリスト実行

【スキルが起動する条件】
- 「AI仕様駆動開発を導入したい」
- 「ドキュメント構造を検証したい」
- 「新しいドキュメントを追加したい」
- 「コミット前にチェックしたい」

お願いします！
```

### 使用例

スキルインストール後は、以下のような指示だけでAI仕様駆動開発のドキュメント構造が自動生成・管理されます：

```
# プロジェクト初期化
「このプロジェクトにAI仕様駆動開発を導入したい」

# 新規ドキュメント追加
「データベース設計のドキュメントを追加したい」

# コミット前検証
「コミット前にドキュメントをチェックしたい」
```

### 詳細ガイド

Claude Skillsの詳細な使い方、トラブルシューティング、ベストプラクティスについては、以下のリソースを参照してください：

- [Claude Skills完全ガイド（日本語）](https://github.com/feel-flow/flow-note-ai/blob/main/CLAUDE_SKILLS_SETUP_GUIDE.md)
- [Claude Code公式ドキュメント](https://docs.claude.com/en/docs/claude-code)
- [Skills公式リポジトリ](https://github.com/anthropics/skills)

---

## このリポジトリでの位置づけ

本ガイドは `MASTER.md` を起点に、`01-context`/`02-design`/`03-implementation`/`04-quality`/`05-operations`/`06-reference`/`07-project-management` の7構成でAIが迷わない導線を作るための実務補助です。

**注意**: このテンプレートを実際のプロジェクトで使用する際は、`docs-template/` フォルダの内容を `docs/` フォルダにコピーして使用してください。
