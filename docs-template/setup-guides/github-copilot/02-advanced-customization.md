# GitHub Copilot 高度なカスタマイズ

> **Parent**: [SETUP_GITHUB_COPILOT.md](../../SETUP_GITHUB_COPILOT.md) | **Level**: Advanced

**所要時間**: 10-20分

---

## AI駆動によるcopilot-instructions.md生成

### 基本コンセプト

AIプロンプトを活用して、MASTER.mdの内容を基に自動生成・更新：

- ✅ MASTER.mdのルールを確実に反映
- ✅ プロジェクト固有のルールを統合
- ✅ 一貫性のある記述
- ✅ 更新作業も自動化可能

---

## 必須プロンプトテンプレート

### 1. 新規生成プロンプト（基本）

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

詳細は docs-template/MASTER.md の「情報不足時の必須確認プロトコル」を参照。
```

### 2. 既存ファイル更新プロンプト

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

---

## プロジェクト別カスタマイズ例

### React プロジェクト

```markdown
# プロジェクト固有のルール

- React 18使用
- 関数コンポーネントのみ（クラスコンポーネント禁止）
- Hooks優先（useState, useEffect, useContext等）
- PropTypesではなくTypeScriptの型を使用
- styled-componentsでスタイリング
- 状態管理: Zustand
```

### Node.js/Express バックエンド

```markdown
# プロジェクト固有のルール

- Node.js 20 LTS使用
- Express.js使用
- RESTful API設計
- OpenAPI 3.0仕様必須
- JWT認証
- Prisma ORM使用
- エラーハンドリング: Result pattern必須
```

---

## 高度なプロンプトテクニック

### テクニック1: 既存コードから学習

```
以下の既存コードベースを分析して、
.github/copilot-instructions.md に追加すべきルールを提案してください。

# 分析対象
[主要ファイルのコードを貼り付け]

# 分析観点
- ライブラリとバージョン
- コーディングスタイル
- エラーハンドリングパターン
- テストの書き方

# 出力形式
Markdown形式。禁止事項は❌、推奨事項は✅で明示。
```

### テクニック2: チーム規約の変換

```
以下のチームコーディング規約を、
GitHub Copilot用に変換してください。

# チーム規約
[既存の規約を貼り付け]

# 要件
- Copilotが理解しやすい形式に変換
- 具体的なコード例を追加
- 禁止事項は❌、推奨事項は✅で明示
```

---

## 実行手順

### 使用するAIツール

以下のいずれかを使用：

1. **GitHub Copilot Chat** - VS Code内: `Cmd+I` (macOS) / `Ctrl+I` (Windows/Linux)
2. **Claude Code** - <https://claude.ai/code>
3. **Cursor** - `Cmd+L` (macOS) / `Ctrl+L` (Windows/Linux)

### ステップバイステップ

1. AIツールを開く
2. プロンプトテンプレートをコピーして、プロジェクト情報を記入
3. MASTER.mdの内容を貼り付け
4. AIに生成依頼
5. 生成結果を `.github/copilot-instructions.md` に保存
6. 内容を確認・微調整

```bash
# 生成結果の保存
cat > .github/copilot-instructions.md << 'EOF'
[AIが生成した内容を貼り付け]
EOF
```

---

## よくある質問

### Q1: AIが生成した内容をそのまま使っても大丈夫？

**A:** 必ず以下を確認：

- ✅ プロジェクト名が正しいか
- ✅ 技術スタックのバージョンが最新か
- ✅ MASTER.mdの内容と矛盾がないか
- ✅ チーム独自のルールが含まれているか

### Q2: 複数のAIツールで試せますか？

**A:** はい。各ツールで生成して比較することを推奨します。

### Q3: 定期的な更新はどうすれば？

**A:** 「既存ファイル更新プロンプト」を使用してください。

---

## ベストプラクティス

1. **プロンプトの再利用** - `.ai-prompts/` に保存
2. **定期的な更新** - 月1回、技術スタック更新時
3. **チーム共有** - 効果的なプロンプトをチーム内で共有

---

## トラブルシューティング

### 生成されたルールが反映されない

1. `.github/copilot-instructions.md` のパスを確認
2. VS Codeを再起動
3. Copilot Chatで明示的に指示

### 情報不足でAIが生成できない

1. MASTER.mdの必須セクションを確認
2. プロジェクト情報をより詳しく記入
3. AIに段階的に質問

---

## 完了チェックリスト

- [ ] AIプロンプトで基本的な生成ができた
- [ ] プロジェクト固有のルールを追加した
- [ ] 生成結果を保存して内容を確認した
- [ ] VS Codeを再起動して反映確認した

---

## 次のステップ

- [configuration.md](./configuration.md) - VS Code設定
- [03-usage-and-troubleshooting.md](./03-usage-and-troubleshooting.md) - 効果的な使い方
- [../../MASTER.md](../../MASTER.md) - プロジェクトルール参照
