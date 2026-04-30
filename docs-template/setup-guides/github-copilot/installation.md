# STEP 1: GitHub Copilotのインストール

**所要時間**: 15分

このドキュメントでは、GitHub Copilotのインストール手順を説明します。

---

## 1-1: GitHub Copilotサブスクリプション

### サブスクリプションの購入

1. **GitHub Copilotのページにアクセス**
   - <https://github.com/features/copilot>

2. **「Start a free trial」または「Subscribe」をクリック**
   - 個人プラン: $10/月
   - ビジネスプラン: $19/ユーザー/月
   - 初月無料トライアルあり

3. **GitHubアカウントでログイン**
   - まだアカウントがない場合は、新規作成が必要

4. **支払い情報を入力**
   - 無料トライアル中でも必要
   - トライアル期間終了前にキャンセル可能

### サブスクリプションの確認

購入後、以下のURLで確認：

- <https://github.com/settings/copilot>

アクティブな状態になっていることを確認してください。

---

## 1-2: VS Code拡張機能のインストール

### 拡張機能のインストール

1. **VS Codeを開く**

2. **拡張機能マーケットプレイスを開く**
   - macOS: `Cmd + Shift + X`
   - Windows/Linux: `Ctrl + Shift + X`

3. **「GitHub Copilot」を検索**

4. **以下の拡張機能をインストール**:
   - **GitHub Copilot** （必須）
     - ID: `GitHub.copilot`
     - コード補完機能を提供

   - **GitHub Copilot Chat** （推奨）
     - ID: `GitHub.copilot-chat`
     - 対話型AIアシスタント機能を提供

5. **VS Codeを再起動**
   - 拡張機能を有効にするために再起動が推奨されます

### インストールの確認

インストール後、VS Codeで以下を確認：

- 拡張機能パネルに「GitHub Copilot」が表示される
- ステータスバーにCopilotアイコンが表示される

---

## 1-3: GitHubアカウントと連携

### アカウント連携の手順

1. **VS Code左下の「Sign in to GitHub」をクリック**
   - または、Copilotアイコンから「Sign in」を選択

2. **ブラウザが開くので、GitHubアカウントでログイン**
   - GitHub Copilotのサブスクリプションがあるアカウントでログイン

3. **VS Codeへのアクセスを許可**
   - 「Authorize Visual Studio Code」をクリック

4. **確認**:
   - VS Code右下に「GitHub Copilot」のアイコンが表示されればOK
   - アイコンをクリックすると状態が確認できます

### 連携が成功したか確認

以下の状態であれば連携成功：

- ステータスバーのCopilotアイコンが緑色
- アイコンのツールチップに「Ready」と表示

---

## JetBrains IDEsでのインストール（参考）

JetBrains製品（IntelliJ IDEA、PyCharm、WebStormなど）を使用する場合：

### 手順

1. **プラグインマーケットプレイスを開く**
   - macOS: `Cmd + ,` → Plugins
   - Windows/Linux: `Ctrl + Alt + S` → Plugins

2. **「GitHub Copilot」を検索**

3. **インストールをクリック**

4. **IDEを再起動**

5. **GitHubアカウントと連携**
   - Tools → GitHub Copilot → Sign in

詳細は公式ドキュメントを参照：

- <https://docs.github.com/ja/copilot/getting-started-with-github-copilot>

---

## STEP 1 完了チェック

以下をすべて確認してください：

- [ ] GitHub Copilotのサブスクリプションを購入
- [ ] サブスクリプションがアクティブになっている
- [ ] VS Code（またはJetBrains IDE）に拡張機能をインストール
- [ ] GitHubアカウントと連携完了
- [ ] Copilotアイコンが「Ready」状態

---

## トラブルシューティング

### サブスクリプションが反映されない

**症状**: 連携しても「No subscription」と表示される

**対処法**:

1. GitHubアカウントを確認（サブスクリプションのあるアカウントか）
2. <https://github.com/settings/copilot> でアクティブか確認
3. VS Codeを再起動
4. 一度サインアウトして再サインイン

### 拡張機能がインストールできない

**症状**: インストールボタンが押せない、エラーが出る

**対処法**:

1. VS Codeのバージョンを確認（最新版に更新）
2. 必要システム要件を確認
3. VS Codeを管理者権限で実行
4. 拡張機能のキャッシュをクリア

### 連携が完了しない

**症状**: ブラウザ認証後、VS Codeに戻らない

**対処法**:

1. ブラウザで手動で認証コードをコピー
2. VS Codeのコマンドパレット（`Cmd/Ctrl + Shift + P`）
3. 「GitHub: Sign in with Device Code」を実行
4. 認証コードを貼り付け

---

## 次のステップ

インストールが完了したら、次は`.github/copilot-instructions.md`の設定です：

[STEP 2: copilot-instructions.md設定](./copilot-instructions.md)
