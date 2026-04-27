---
id: maxfiles-setup-guide
title: OS ファイルディスクリプタ上限の設定ガイド
version: 1.0.0
status: active
created: 2026-03-18
updated: 2026-03-18
owner: feel-flow
phase: mvp
tags: [docs, operations, macos, windows, vscode, worktree]
references:
  - docs/OPERATIONAL_GUIDE.md
  - docs/AI_GIT_WORKFLOW.md
changeImpact: medium
---

# OS ファイルディスクリプタ上限の設定ガイド

> **対象**: 開発チーム全員
> **最終更新**: 2026-03-18
> **ステータス**: 推奨設定（全開発マシンに適用してください）

---

## 1. これは何か？

OS が 1 つのプロセスに対して同時に開くことを許可する **ファイルディスクリプタ（fd）の上限値** を引き上げる設定です。

ファイルディスクリプタとは、OS がファイル・ソケット・パイプなどの I/O リソースを管理するための識別子です。エディタやビルドツールがファイルを開くたびに 1 つ消費されます。

---

## 2. なぜ必要なのか？

### macOS のデフォルト値が低すぎる

| 設定                         | macOS デフォルト | 推奨値     |
| ---------------------------- | ---------------- | ---------- |
| ソフトリミット（`maxfiles`） | **256**          | **65,536** |
| ハードリミット（`maxfiles`） | unlimited        | 524,288    |

**256 は現代の開発環境には著しく不足しています。**

### fd を大量消費するツール

| ツール                               | 消費するfd の目安            |
| ------------------------------------ | ---------------------------- |
| VS Code（ファイルウォッチャー）      | 数百〜数千                   |
| TypeScript Language Server           | 数百                         |
| Next.js dev server（HMR）            | 数百                         |
| git worktree（追加ワークツリーごと） | 上記すべてが倍増             |
| node_modules のファイル数            | このプロジェクトで約 50,000+ |

特に **VS Code + git worktree** の組み合わせでは、ワークツリーごとに VS Code のファイルウォッチャーと Language Server が起動するため、fd 消費量が急増します。

---

## 3. 設定しないとどうなるか（症状）

- **VS Code がクラッシュ**する（特に worktree を別ウィンドウで開いた時）
- `EMFILE: too many open files` エラーが発生する
- `npm install` や `npm run dev` が途中で失敗する
- ファイルウォッチャーが停止し、HMR（ホットリロード）が効かなくなる
- git 操作が `unable to create file` で失敗する

---

## 4. どんな効果があるか

- VS Code のクラッシュが解消される
- git worktree を複数使っても安定動作する
- ビルド・開発サーバーの安定性が向上する
- `EMFILE` エラーが発生しなくなる

---

## 5. どういう時に必要か

以下のいずれかに該当する場合は **必ず設定してください**：

- [x] VS Code を使っている
- [x] git worktree を使う（または使う予定がある）
- [x] Next.js / Node.js の開発をしている
- [x] node_modules が大きいプロジェクトを扱っている
- [x] Claude Code の Agent（worktree モード）を使っている

---

## 6. 設定方法

### macOS の場合

#### Step 1: 現在の値を確認

```bash
launchctl limit maxfiles
```

出力例（デフォルト）:

```
maxfiles    256            unlimited
```

`256` と表示されたら、設定が必要です。

#### Step 2: LaunchDaemon plist ファイルを作成

```bash
sudo tee /Library/LaunchDaemons/limit.maxfiles.plist > /dev/null << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>524288</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
PLIST
```

#### Step 3: パーミッション設定とロード

```bash
sudo chown root:wheel /Library/LaunchDaemons/limit.maxfiles.plist
sudo chmod 644 /Library/LaunchDaemons/limit.maxfiles.plist
sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist
```

#### Step 4: 確認

```bash
launchctl limit maxfiles
```

期待される出力:

```
maxfiles    65536          524288
```

> **注意**: 設定は再起動後も永続します。`sudo` のパスワード入力が必要です。

#### 補足: VS Code のファイルウォッチャー除外設定（推奨）

VS Code の `settings.json`（ユーザー設定）に以下を追加すると、さらに安定します：

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/.turbo/**": true
  }
}
```

---

### Windows の場合

Windows はデフォルトの fd 上限が **16,384** と macOS より大幅に高いため、通常は追加設定不要です。

ただし、問題が発生した場合は以下の手順で対応できます。

#### 方法 1: レジストリで上限を変更

1. レジストリエディタ（`regedit`）を開く
2. 以下のキーに移動:

   ```
   HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Configuration Manager
   ```

3. `MaximumHandles` の DWORD 値を作成または編集
4. 値を `65536`（10進数）に設定
5. PC を再起動

#### 方法 2: PowerShell で確認

```powershell
# 現在のハンドル数を確認
(Get-Process -Id $PID).HandleCount

# システム全体のハンドル数を確認
Get-Counter '\Process(_Total)\Handle Count'
```

#### 補足: VS Code のファイルウォッチャー除外設定（推奨）

macOS と同様に、VS Code の `settings.json` に以下を追加：

```json
{
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/**": true,
    "**/.next/**": true,
    "**/dist/**": true,
    "**/.turbo/**": true
  }
}
```

---

## 7. 設定値の根拠

| 値                       | 理由                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| ソフトリミット `65,536`  | VS Code 公式 Wiki、Neo4j、各種開発ツールの推奨値。開発用途で十分な値 |
| ハードリミット `524,288` | カーネル上限（`kern.maxfiles: 184,320`）以内で余裕を持たせた値       |

### 参考資料

- [VS Code Wiki: File Watcher Issues](https://github.com/microsoft/vscode/wiki/File-Watcher-Issues)
- [Increasing File Descriptor Ulimit on MacOS](https://hiltmon.com/blog/2023/01/01/increasing-file-descriptor-ulimit-on-macos/)
- [Neo4j: Setting Max Open File Limits on Mac OSX](https://neo4j.com/developer/kb/setting-max-open-file-limits-on-osx/)
- [Apple Developer Forums: maxfile limits](https://developer.apple.com/forums/thread/735798)

---

## 8. トラブルシューティング

### Q: `sudo launchctl load` で "Operation not permitted" と出る

**A**: macOS の SIP（System Integrity Protection）が原因の可能性があります。plist ファイル方式（本ガイドの方法）であれば通常は問題ありませんが、解決しない場合は macOS を再起動してください。

### Q: 再起動後に値が戻ってしまう

**A**: plist ファイルのパーミッションを確認してください：

```bash
ls -la /Library/LaunchDaemons/limit.maxfiles.plist
# 期待される出力: -rw-r--r--  root  wheel
```

所有者が `root:wheel`、パーミッションが `644` であることを確認してください。

### Q: `ulimit -n` で unlimited と表示されるのに VS Code がクラッシュする

**A**: `ulimit` はシェルセッションの設定であり、VS Code はアプリケーションとして起動するため `launchctl` の値を引き継ぎます。`launchctl limit maxfiles` の値を確認してください。

### Q: Windows で同様の問題が起きるか？

**A**: Windows のデフォルト上限は 16,384 と高いため、通常は発生しません。ただし、非常に大きなモノレポを扱う場合は発生する可能性があります。
