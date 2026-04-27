# 削除防止ハーネス設計

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Related**: [ai-tools-integration.md](./ai-tools-integration.md) | [workflow-principles.md](./workflow-principles.md)

## 概要

AIエージェントによる削除事故を防ぐための多層防御ハーネスを定義します。

この文書の主対象は **Windows 環境** です。macOS は一部ツールで terminal sandbox による補強が可能ですが、sandbox は削除禁止ではなく境界制御であるため、本書では補足扱いに留めます。

本ハーネスは、テンポラリファイルの作成位置を直接指定できない場合でも、cleanup を含む破壊的操作を安全側に倒すことを目的とします。

## ツール別の適用範囲

この文書は **OS 前提** と **ツール前提** を分けて読む必要があります。

- Windows / macOS の記述は、まず OS レベルで使える防御手段の差を説明している
- `chat.tools.terminal.autoApprove` や `PreToolUse` hook などの設定名は、主に **GitHub Copilot in VS Code / Agent Mode** の具体例である
- Claude Code と Cursor にも同じ設計原則は適用できるが、機能名や設定面は同一とは限らない

### GitHub Copilot

本書で最も具体的に想定しているのは GitHub Copilot の Agent Mode / VS Code 統合です。

特に以下は Copilot / VS Code 側の具体的な制御例です。

- `chat.tools.terminal.autoApprove`
- `chat.tools.terminal.blockDetectedFileWrites`
- `PreToolUse` hook
- terminal sandbox

したがって、本書の後半に出てくる設定キーや hook 名は、まず Copilot の具体実装例として読んでください。

### Claude Code

Claude Code でも「workspace 外削除を許さない」「cleanup 対象を専用領域に限定する」「approval を最終防衛線にしない」という原則自体は同じです。

ただし、Copilot / VS Code の設定キーをそのまま Claude Code に適用できるとは限りません。
Claude Code では、その時点で利用できる sandbox、approval、hook、worktree、実行環境分離の仕組みに読み替えて適用する必要があります。

### Cursor

Cursor でも原則は同じです。
ただし、Copilot のような VS Code 固有の設定名や Claude Code 固有の実行モデルをそのまま前提にはできません。

そのため Cursor では、利用可能な approval、rules、workspace 制限、OS 側の隔離、外部スクリプトや hook などを組み合わせて、同等の防御を構成する前提で読むべきです。

### 重要な読み替えルール

本書では、ツールごとの差異があっても以下は共通原則とします。

1. 削除系コマンドを自動承認しない
2. cleanup 対象を workspace 内の専用ディレクトリに閉じ込める
3. 相対削除、ワイルドカード削除、root 削除を禁止する
4. sandbox があっても、それだけで安全とはみなさない
5. ツール固有機能が弱い場合は、OS・コンテナ・worktree・wrapper script 側で補う

---

## 問題設定

削除事故は、以下のような経路で発生します。

1. エージェントが terminal 経由で一時ファイルまたは一時ディレクトリを作成する
2. cleanup のために削除コマンドを組み立てる
3. 削除対象が相対パス、ワイルドカード、または cwd 依存で評価される
4. 想定と異なるディレクトリでコマンドが実行される
5. 自動承認により確認なしで実行される

**重要な前提**:

- built-in file tools は workspace 境界を持つ
- terminal commands は shell の cwd と構文解釈の影響を受ける
- したがって、削除事故の主要リスクは file tool よりも terminal cleanup 側にある

### 典型的な危険パターン

以下のような skill / prompt / runbook は危険である。

```powershell
$tempDir = "d:\Git\cogniphotobase\_temp_pptx_extract"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
Expand-Archive -Path "<対象pptxファイルパス>" -DestinationPath $tempDir -Force

Remove-Item -Recurse -Force "d:\Git\cogniphotobase\_temp_pptx_extract" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "d:\Git\cogniphotobase\_temp_xlsx_extract" -ErrorAction SilentlyContinue
Remove-Item -Force "d:\Git\cogniphotobase\_temp_*_output.md" -ErrorAction SilentlyContinue
```

**危険な理由**:

- 固定ドライブ、固定絶対パスを前提にしている
- 実行対象プロジェクトと無関係なディレクトリを削除対象にしている
- 実行前 cleanup を無条件に行っている
- ワイルドカード cleanup を含んでいる
- cleanup 対象が workspace 内の専用ディレクトリに限定されていない

この種の記述は、別プロジェクトにスキルを持ち込んだときに誤削除へ直結する。

---

## 設計原則

### 原則1: temp 配置先指定より cleanup 制御を優先する

テンポラリファイルの作成位置を常に制御できるとは限らない。
そのため、防御の主眼は「どこに作るか」ではなく「どこを削除できるか」に置く。

### 原則2: 相対削除を禁止する

以下は原則禁止:

- `rm -rf .`
- `rm -rf ./*`
- `del /s *`
- `Remove-Item -Recurse .`
- `find ... -delete`
- ワイルドカードを含む一括削除

削除対象は、検証済みの絶対パスまたは workspace 内の専用 cleanup ディレクトリ配下に限定する。

### 原則3: 破壊的操作は terminal auto-approve の allowlist に入れない

破壊的コマンドは「便利だから許可する」対象ではない。
削除系コマンドは deny または ask を基本とする。

### 原則4: Bypass Approvals / Autopilot を最終防衛線にしない

自動承認モードは確認を飛ばすため、削除防止は hooks などの強制ガードで実装する。

### 原則5: cleanup 専用領域を分離する

一時ファイルの cleanup が必要な場合は、workspace 配下の専用ディレクトリを使用する。

例:

- `.tmp/agent/`
- `.artifacts/agent/`
- `tmp/agent-sandbox/`

cleanup 対象を専用領域に閉じ込めることで、削除対象の検証を単純化する。

### 原則6: OS のテンポラリをそのまま信用しない

Windows の `$env:TEMP` や macOS の一時領域そのものを自由削除領域とみなしてはならない。
AI エージェントが削除できるのは、workspace 内で明示的に許可した専用ディレクトリ配下に限定する。

---

## 安全な PowerShell パターン

PowerShell を使う skill では、以下のように workspace 内の専用ディレクトリを作成し、その配下だけを cleanup 対象にする。

```powershell
function New-ScopedTempDirectory($sourceFilePath, $toolName) {
    $resolvedSourcePath = [System.IO.Path]::GetFullPath($sourceFilePath)
    $sourceDirectory = Split-Path -Parent $resolvedSourcePath
    $sandboxRoot = Join-Path $sourceDirectory (".tmp_" + $toolName)
    $runId = [guid]::NewGuid().ToString("N")
    $extractRoot = Join-Path $sandboxRoot $runId

    if (-not (Test-Path -LiteralPath $sandboxRoot)) {
        New-Item -ItemType Directory -Path $sandboxRoot | Out-Null
    }

    New-Item -ItemType Directory -Path $extractRoot | Out-Null

    return @{
        SandboxRoot = $sandboxRoot
        ExtractRoot = $extractRoot
    }
}

function Remove-TempPathSafely($path, $sandboxRoot) {
    $resolvedPath = [System.IO.Path]::GetFullPath($path)
    $resolvedRoot = [System.IO.Path]::GetFullPath($sandboxRoot)
    $pathRoot = [System.IO.Path]::GetPathRoot($resolvedPath)
    $normalizedRoot = $resolvedRoot.TrimEnd('\\', '/')
    $rootWithSeparator = $normalizedRoot + [System.IO.Path]::DirectorySeparatorChar

    if ($resolvedPath -eq $pathRoot) {
        throw "Refusing to delete a drive root: $resolvedPath"
    }

    if ($resolvedPath -eq $normalizedRoot) {
        throw "Refusing to delete the sandbox root itself: $resolvedPath"
    }

    if (-not $resolvedPath.StartsWith($rootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete a path outside sandbox root: $resolvedPath"
    }

    if (Test-Path -LiteralPath $resolvedPath) {
        Remove-Item -LiteralPath $resolvedPath -Recurse -Force
    }
}

$tempContext = New-ScopedTempDirectory "<対象ファイルパス>" "openxml-reader"
$sandboxRoot = $tempContext.SandboxRoot
$extractRoot = $tempContext.ExtractRoot
Expand-Archive -Path "<対象ファイルパス>" -DestinationPath $extractRoot -Force

# 作業完了後は sandboxRoot 配下のみ cleanup する
Remove-TempPathSafely $extractRoot $sandboxRoot
```

**このパターンの要点**:

- `Get-Location` ではなく対象ファイル基準で temp を作る
- 対象ファイルの近傍に専用 sandbox を閉じ込める
- 削除対象を 1 つの検証済みディレクトリに限定する
- sandbox root 自体の削除を禁止する
- 文字列 prefix ではなくディレクトリ境界つきで配下判定する
- ワイルドカード削除を使わない
- プロジェクト外の絶対パスを使わない
- cleanup 前に許可済みルート配下か検証する

---

## OS 差分

| 項目             | Windows                       | macOS                                          |
| ---------------- | ----------------------------- | ---------------------------------------------- |
| terminal sandbox | 基本的に前提にしにくい        | 一部ツールで利用可能                           |
| 削除防止の主手段 | approval + hook + deny ルール | approval + hook + deny ルール + sandbox        |
| 推奨方針         | terminal cleanup を強く制限   | sandbox で境界制御しつつ削除自体は hook で制限 |

### Windows

Windows では sandbox を前提にしにくいため、削除防止は以下の多層防御で成立させる。

### macOS

macOS では、対応ツールに限れば sandbox で許可範囲外へのアクセスを抑制できる。
ただし、sandbox 内では削除も可能であるため、sandbox は削除禁止機能ではない。

---

## ハーネス構成

| レイヤー                                      | 役割                       | 防げること                       | 防げないこと                 |
| --------------------------------------------- | -------------------------- | -------------------------------- | ---------------------------- |
| Instructions / Skills                         | AIへの行動規範を与える     | 誤った cleanup 方針の提案        | 悪いコマンドの実行そのもの   |
| Custom Agent の tool 制限                     | 不要な tools を外す        | terminal 利用の頻度低減          | 許可済み terminal 内の誤削除 |
| `chat.tools.terminal.autoApprove`             | 危険コマンドを deny/ask    | 削除系自動承認                   | シェル構文の回避技法         |
| `chat.tools.terminal.blockDetectedFileWrites` | workspace 外書き込みの検知 | 外側への明白な write             | 検知漏れする複雑構文         |
| `PreToolUse` hook                             | 実行前に強制ブロック       | 危険コマンド、危険パス、相対削除 | hook 自体の不備              |
| Agent Debug Logs / Chat Debug View            | 監査と原因分析             | 事故原因の特定                   | 実行済みの削除               |

※ 上記の設定キーは Copilot / VS Code の具体例であり、Claude Code や Cursor では同等機能へ読み替える。

**結論**: hook が最終防衛線であり、instructions だけでは不十分。

---

## Windows 向け最小構成

### 1. terminal auto-approve で削除系を deny

最低限、以下を deny する:

- `rm`
- `rmdir`
- `del`
- `erase`
- `Remove-Item`
- `find`（削除用途を含む場合）
- `powershell` / `pwsh` のうち削除系サブコマンドを含むもの

### 2. workspace 外 write の検知を有効化

`chat.tools.terminal.blockDetectedFileWrites` は `outsideWorkspace` を維持する。

### 3. `PreToolUse` hook で削除コマンドを強制審査

以下の条件では `deny` または `ask` を返す:

- 相対パス削除
- ワイルドカード削除
- ドライブ直下の削除
- ルート相当の削除
- cleanup 専用ディレクトリ外の削除
- `Bypass Approvals` 中の削除系 terminal 実行

### 4. cleanup 対象を専用ディレクトリ配下に固定

削除可能なのは次に限定する:

- `<workspace>/.tmp/agent/**`
- `<workspace>/.artifacts/agent/**`

PowerShell 系 skill では、用途別にさらに細分化してよい。

例:

- `<workspace>/.tmp/agent/openxml-reader/extract/**`
- `<workspace>/.tmp/agent/openxml-reader/output/**`

### 5. 絶対パス検証を必須化

cleanup 前に以下を満たすこと:

- 絶対パスである
- workspace 配下である
- 許可済み cleanup ルート配下である
- ルートディレクトリ自身ではなく、その配下のみを対象にしている

### 6. skill 内の記述で禁止すべき例

以下は skill 文面として禁止:

- 特定ドライブ直下を temp として決め打ちする
- project 名を含む固定絶対パスを削除対象にする
- `_temp_*` のようなワイルドカード cleanup を推奨する
- `ErrorAction SilentlyContinue` で cleanup 失敗を握りつぶす

---

## macOS 向け補強構成

macOS では、対応ツールを使う場合に限り、Windows 向け最小構成に加えて terminal sandbox を有効化する。

### sandbox の使い方

- `allowWrite` は workspace 内の cleanup 専用ディレクトリを中心に絞る
- `denyWrite` で `.git/`, `.vscode/`, `secrets/`, `docs-template/` など重要領域を保護する
- `denyRead` で機密ファイルを遮断する

### 注意

sandbox は「その中なら自由に削除してよい」という意味ではない。
許可範囲内でも削除自体は可能なので、削除防止は引き続き hook と approval で担保する。

---

## 禁止ルール

以下は OS を問わず禁止:

1. cwd 前提の cleanup
2. ワイルドカードによる一括削除
3. terminal でのドライブ直下またはルート直下操作
4. ユーザー確認なしの cleanup 例外化
5. hook 無効化を前提とした運用
6. `--no-verify`, `SKIP_*=1` 相当の未承認バイパス

---

## 承認ルール

| 操作                              | 既定動作         | 条件                           |
| --------------------------------- | ---------------- | ------------------------------ |
| file tool による workspace 内編集 | 通常運用         | review 前提                    |
| terminal での非破壊コマンド       | allow または ask | 明示的な安全コマンドのみ       |
| cleanup 専用ディレクトリ内の削除  | ask              | 絶対パスかつ許可済みルート配下 |
| cleanup 専用ディレクトリ外の削除  | deny             | 例外なし                       |
| workspace 外の write / delete     | deny             | 例外なし                       |

---

## 監査と事故解析

事故またはヒヤリハット発生時は、以下を確認する。

1. Agent Debug Logs で `execute/runInTerminal` の呼び出し有無を確認する
2. 実行されたコマンド全文を確認する
3. 削除対象が相対パスか絶対パスかを確認する
4. 直前に作成された temp ディレクトリや移動処理を確認する
5. approval モードが `Default Approvals`, `Bypass Approvals`, `Autopilot` のどれだったかを確認する
6. hook が loaded されていたか、deny/ask が発火したかを確認する

---

## 導入チェックリスト

- [ ] Windows を主対象とした deny ルールを設定した
- [ ] 削除系コマンドを terminal auto-approve から除外した
- [ ] `blockDetectedFileWrites` の設定を確認した
- [ ] `PreToolUse` hook で相対削除と workspace 外削除をブロックした
- [ ] cleanup 専用ディレクトリを workspace 内に定義した
- [ ] Bypass Approvals / Autopilot の利用条件を定義した
- [ ] Agent Debug Logs で事故解析できる体制を用意した

---

## 関連ドキュメント

- [ai-tools-integration.md](./ai-tools-integration.md) -- AIツール別の安全性制御
- [workflow-principles.md](./workflow-principles.md) -- 運用原則
- [../../.github/skills/skill-authoring-safety/SKILL.md](../../.github/skills/skill-authoring-safety/SKILL.md) -- スキル作成時の安全ガード
- [../DEPLOYMENT.md](../DEPLOYMENT.md) -- 運用ハブ
