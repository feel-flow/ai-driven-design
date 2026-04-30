# STEP 3-6: 設定・確認・活用・共有

> **Parent**: [SETUP_GITHUB_COPILOT.md](../../SETUP_GITHUB_COPILOT.md) | **Time**: 35 minutes

このドキュメントでは、VS Code設定、動作確認、効果的な使い方、チーム共有、トラブルシューティングを説明します。

---

## STEP 3: VS Code設定のカスタマイズ（5分）

### 3-1: 基本設定

`.vscode/settings.json` を作成：

```bash
mkdir -p .vscode
```

```json
{
  // GitHub Copilot設定
  "github.copilot.enable": {
    "*": true,
    "plaintext": false,
    "markdown": true,
    "scminput": false
  },

  // 自動補完の設定
  "editor.inlineSuggest.enabled": true,
  "editor.suggestSelection": "first",

  // Copilot Chat設定
  "github.copilot.chat.localeOverride": "ja"
}
```

### 3-2: 言語ごとの有効/無効設定（オプション）

特定のファイルタイプで無効化したい場合：

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false,
    "markdown": true,
    "typescript": true,
    "javascript": true
  }
}
```

### STEP 3 完了チェック

- [ ] `.vscode/settings.json` を作成
- [ ] Copilot設定をカスタマイズ

---

## STEP 4: 動作確認（5分）

### 4-1: 基本的なコード補完テスト

1. **新しいファイルを作成** (`test.ts`)
2. **コメントを書く**

   ```typescript
   // ユーザー情報を持つインターフェースを定義
   ```

3. **Enterキーを押す**
4. **`Tab`キーで受け入れ**

**期待される結果:**

```typescript
// ユーザー情報を持つインターフェースを定義
interface User {
  id: string;
  name: string;
  email: string;
}
```

### 4-2: Copilot Chatのテスト

1. **Copilot Chatを開く**
   - macOS: `Cmd + I`
   - Windows/Linux: `Ctrl + I`

2. **質問してみる**

   ```
   このプロジェクトのMASTER.mdのルールに従って、
   ユーザー登録機能のコードを生成してください。
   ```

3. **確認ポイント**:
   - MASTER.mdが参照されている
   - マジックナンバー禁止が守られている
   - 型安全性が確保されている

### 4-3: .copilotignoreの設定（オプション）

学習させたくないファイルがある場合、`.copilotignore`を作成：

```
# Copilotに学習させないファイル
*.log
*.env
node_modules/
dist/
.env*
secrets/
private/
```

### STEP 4 完了チェック

- [ ] コード補完が動作する
- [ ] Copilot Chatが動作する
- [ ] MASTER.mdのルールが反映されている

---

## STEP 5: 効果的な使い方（5分）

### 5-1: コメント駆動開発

**良い例（具体的）:**

```typescript
// 【関数名】validateEmail
// 【引数】email: string
// 【戻り値】boolean
// 【処理】メールアドレスの形式が正しいかチェック
// 【制約】RFC 5322に準拠
```

**悪い例（曖昧）:**

```typescript
// メールチェック
```

### 5-2: Copilot Chatの活用パターン

**パターン1: コード生成依頼**

```
【タスク】ユーザー登録APIエンドポイントを作成
【制約】MASTER.mdのルール、マジックナンバー禁止、TypeScript strict mode、単体テストも生成
【成果物】APIエンドポイント、バリデーション、エラーハンドリング、テスト
```

**パターン2: コードレビュー依頼**

```
以下のコードをレビューしてください。
【チェック項目】MASTER.mdのルール、マジックナンバー、エラーハンドリング、型安全性
[コードを貼り付け]
```

**パターン3: リファクタリング依頼**

```
以下のコードをリファクタリングしてください。
【目標】関数を30行以内、マジックナンバー定数化、型安全性向上
[コードを貼り付け]
```

### 5-3: ベストプラクティス（重要な7つ）

#### ✅ 推奨

1. **コメントは詳しく** - 処理内容、戻り値、制約を明記
2. **型定義を先に書く** - interfaceを定義してからコード生成
3. **Copilot Chatで設計を相談** - データ構造や実装方針を相談
4. **必ずレビューする** - MASTER.mdのルールに合致しているか確認

#### ❌ 禁止

5. **何も考えずに全て受け入れる** - 必ずコードレビュー実施
6. **セキュリティコードをそのまま使う** - 認証・認可は特に慎重に
7. **個人情報をコメントに書く** - APIキー、パスワード等は絶対に書かない

---

## STEP 6: チーム共有（5分）

### 6-1: リポジトリにコミット

```bash
# .githubフォルダをコミット
git add .github/ .vscode/
git commit -m "Add GitHub Copilot instructions and VS Code settings"
git push
```

### 6-2: README.mdに追加

プロジェクトの `README.md` に以下を追加：

```markdown
## GitHub Copilot設定

このプロジェクトでは、GitHub Copilotを使用する場合、
以下のルールに従ってください。

### 必須設定

1. `.github/copilot-instructions.md` を確認
2. `docs-template/MASTER.md` を必ず参照
3. コード生成時はプロジェクトのルールを遵守

### ドキュメント

- [GitHub Copilotセットアップガイド](./docs-template/SETUP_GITHUB_COPILOT.md)
```

### 6-3: チームメンバーへの共有ポイント

- `.github/copilot-instructions.md` の存在と役割
- `docs-template/MASTER.md` の重要性
- プロジェクト固有のコーディングルール
- Copilot Chatでの明示的な指示方法

### STEP 6 完了チェック

- [ ] 設定ファイルをリポジトリにコミット
- [ ] README.mdに設定ガイドを追加
- [ ] チームメンバーに共有完了

---

## トラブルシューティング

### よくある問題と対処法

| 問題                                | 原因                                     | 対処法                                                                                                                                 |
| ----------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **コード補完が表示されない**        | GitHubアカウント連携・サブスクリプション | 1. VS Code再起動<br>2. GitHubアカウント連携確認<br>3. サブスクリプションがアクティブか確認<br>4. 拡張機能を再インストール              |
| **MASTER.mdのルールが反映されない** | copilot-instructions.mdの設定不足        | 1. `.github/copilot-instructions.md`のパス確認<br>2. Copilot Chatで明示的に指示<br>3. VS Code再起動                                    |
| **提案される速度が遅い**            | ネットワーク・プロジェクトサイズ         | 1. ネットワーク接続確認<br>2. Copilotのステータス確認（右下アイコン）<br>3. `.copilotignore`で不要ファイル除外                         |
| **提案される内容が期待と違う**      | コメントの曖昧さ・コンテキスト不足       | 1. コメントをより具体的に書く<br>2. Copilot Chatを使用<br>3. `.copilotignore`で除外設定                                                |
| **マジックナンバーが生成される**    | ルールが反映されていない                 | 1. copilot-instructions.mdにマジックナンバー禁止を明記<br>2. Copilot Chatで「マジックナンバー禁止」を明示<br>3. 生成後に手動でレビュー |

### 詳細な対処法

#### Copilotが提案してくれない

**手順**:

1. **GitHubアカウント連携を確認**
   - VS Code左下のアカウントアイコンをクリック
   - 「Sign in to GitHub」が表示される場合は再ログイン

2. **サブスクリプションを確認**
   - <https://github.com/settings/copilot>
   - アクティブになっているか確認

3. **VS Codeを再起動**

4. **拡張機能を再インストール**
   - 拡張機能をアンインストール
   - VS Code再起動
   - 再度インストール

#### MASTER.mdのルールが反映されない

**手順**:

1. **`.github/copilot-instructions.md` の内容を確認**
   - パスが正しいか（`docs-template/MASTER.md`）
   - MASTER.mdへの参照が明記されているか

2. **Copilot Chatで明示的に指示**

   ```
   必ず docs-template/MASTER.md のルールに従ってください。
   特に以下を遵守：
   - マジックナンバー禁止
   - any型禁止
   - Result patternでのエラーハンドリング
   ```

3. **copilot-instructions.mdを更新後、VS Codeを再起動**

#### 提案される内容の質が低い

**対処法**:

1. **コメントをより具体的に書く**
   - 関数名、引数、戻り値、処理内容を明記
   - 制約条件を明記

2. **Copilot Chatを使用**
   - より詳細な指示が可能
   - プロジェクトコンテキストを参照可能

3. **`.copilotignore` で不要なファイルを除外**
   - 古いコードやサンプルコードを除外

---

## 主要なショートカット

| 操作           | macOS        | Windows/Linux |
| -------------- | ------------ | ------------- |
| Copilot Chat   | `Cmd + I`    | `Ctrl + I`    |
| 候補を受け入れ | `Tab`        | `Tab`         |
| 次の候補       | `Option + ]` | `Alt + ]`     |
| 前の候補       | `Option + [` | `Alt + [`     |

---

## さらに効率を上げるために

1. **PATTERNS.mdを充実させる**
   - プロジェクト固有のパターンを追加
   - Copilotがより良いコードを生成できるようになる

2. **TESTING.mdを参照させる**
   - テスト生成時のルールを明確化
   - `.github/copilot-instructions.md`にテスト要件を追記

3. **定期的にcopilot-instructions.mdを更新**
   - プロジェクトの進化に合わせて更新
   - AIプロンプトで更新作業を自動化

4. **チームで知見を共有**
   - 効果的だったプロンプトを共有
   - よくある失敗パターンをドキュメント化

---

## 次のステップ

セットアップ完了後は、以下のドキュメントも参照してください：

- [SETUP_CLAUDE_CODE.md](../../SETUP_CLAUDE_CODE.md) - Claude Code セットアップ
- [SETUP_CURSOR.md](../../SETUP_CURSOR.md) - Cursor セットアップ
- [MASTER.md](../../MASTER.md) - プロジェクト全体のルール
- [PATTERNS.md](../../03-implementation/PATTERNS.md) - 実装パターン

---

**セットアップ完了おめでとうございます！**

GitHub Copilotを使って、効率的なAI駆動開発を楽しんでください！
