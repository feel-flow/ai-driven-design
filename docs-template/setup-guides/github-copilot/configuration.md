# STEP 3 & 4: VS Code設定と動作確認

**所要時間**: STEP 3 (5分) + STEP 4 (5分) = 10分

このドキュメントでは、VS Code設定のカスタマイズと動作確認の方法を説明します。

---

## STEP 3: VS Code設定のカスタマイズ

### 3-1: VS Code設定ファイルの作成

プロジェクトルートに `.vscode/settings.json` を作成：

```bash
mkdir -p .vscode
```

### 3-2: 基本設定

`.vscode/settings.json` に以下を追加：

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

### 3-3: 言語ごとの有効/無効設定

特定のファイルタイプでCopilotを無効にしたい場合：

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": false, // YAMLファイルで無効
    "markdown": true, // Markdownで有効
    "plaintext": false, // プレーンテキストで無効
    "json": true, // JSONで有効
    "typescript": true, // TypeScriptで有効
    "javascript": true // JavaScriptで有効
  }
}
```

### 3-4: 詳細設定（オプション）

より詳細な設定が必要な場合：

```json
{
  "github.copilot.advanced": {
    "debug.overrideEngine": "",
    "debug.testOverrideProxyUrl": "",
    "debug.overrideProxyUrl": ""
  }
}
```

### STEP 3 完了チェック

- [ ] `.vscode/settings.json` を作成
- [ ] Copilot設定をカスタマイズ
- [ ] プロジェクト固有の言語設定を追加

---

## STEP 4: 動作確認

### 4-1: 基本的なコード補完テスト

#### テスト手順

1. **新しいファイルを作成**
   - 例: `test.ts` または `test.js`

2. **コメントを書く**

   ```typescript
   // ユーザー情報を持つインターフェースを定義
   ```

3. **Enterキーを押す**
   - Copilotが自動的にコードを提案するはず

4. **`Tab`キーで受け入れ**

#### 期待される結果

```typescript
// ユーザー情報を持つインターフェースを定義
interface User {
  id: string;
  name: string;
  email: string;
}
```

#### 確認ポイント

- コード補完が表示される
- 灰色のテキストで提案が表示される
- `Tab`キーで受け入れることができる

### 4-2: Copilot Chatのテスト

#### テスト手順

1. **Copilot Chatを開く**
   - macOS: `Cmd + I`
   - Windows/Linux: `Ctrl + I`

2. **質問してみる**

   ```
   このプロジェクトのMASTER.mdのルールに従って、
   ユーザー登録機能のコードを生成してください。
   ```

3. **Copilotが`docs-template/MASTER.md`を参照して回答するか確認**

#### 期待される結果

- Copilot Chatが開く
- MASTER.mdの内容を参照した回答が得られる
- プロジェクト固有のルールが反映されている

#### 確認ポイント

- MASTER.mdが参照されている
- プロジェクトのコード生成ルールが適用されている
- マジックナンバー禁止などのルールが守られている

### 4-3: プロジェクト固有ルールの確認

#### テスト手順

1. **簡単な関数をCopilotに生成させる**

2. **以下をチェック**:
   - マジックナンバーが使われていないか
   - `any`型が使われていないか
   - エラーハンドリングが適切か
   - 命名規則が守られているか

#### 例: メールバリデーション関数

```typescript
// メールアドレスの形式をチェックする関数を作成
```

期待される生成コード：

```typescript
// メールアドレスの形式をチェックする関数を作成
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
```

NG例（マジックナンバー/パターン）:

```typescript
// ❌ 正規表現が直接埋め込まれている（マジックパターン）
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### 4-4: .copilotignoreの設定（オプション）

Copilotに学習させたくないファイルがある場合、`.copilotignore`を作成：

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
- [ ] マジックナンバー禁止が守られている
- [ ] 型安全性が確保されている

---

## トラブルシューティング

### コード補完が表示されない

**対処法**:

1. VS Codeを再起動
2. GitHubアカウント連携を確認
3. `.github/copilot-instructions.md`の存在を確認
4. ファイルタイプが有効になっているか確認（settings.json）

### MASTER.mdのルールが反映されない

**対処法**:

1. `.github/copilot-instructions.md`の内容を確認
   - MASTER.mdへの参照が明記されているか
   - パスが正しいか
2. Copilot Chatで明示的に指示

   ```
   必ず docs-template/MASTER.md のルールに従ってください。
   ```

3. VS Codeを再起動

### 提案される速度が遅い

**対処法**:

1. ネットワーク接続を確認
2. Copilotのステータスを確認（右下のアイコン）
3. VS Codeの拡張機能を最小限に
4. プロジェクトサイズが大きい場合は`.copilotignore`で除外

### 提案される内容が期待と違う

**対処法**:

1. コメントをより具体的に書く
   - 関数名、引数、戻り値、処理内容を明記
2. Copilot Chatを使用（より詳細な指示が可能）
3. `.copilotignore`で不要なファイルを除外
4. `.github/copilot-instructions.md`を更新

---

## 設定ファイル例

### プロジェクト用の完全な.vscode/settings.json例

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
  "github.copilot.chat.localeOverride": "ja",

  // TypeScript設定（推奨）
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // エディタ設定（推奨）
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },

  // ファイル除外設定
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

---

## 次のステップ

VS Code設定と動作確認が完了したら、次はベストプラクティスを確認しましょう：

[STEP 3-6: 設定・確認・活用・共有](./03-usage-and-troubleshooting.md)
