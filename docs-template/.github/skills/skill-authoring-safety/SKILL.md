---
name: skill-authoring-safety
description: >-
  Creates and reviews agent skills safely by enforcing deletion-prevention
  harness rules: no fixed absolute temp paths, no cwd-dependent cleanup, no
  wildcard deletes, no workspace-external file operations, no silent cleanup
  failures, and mandatory temp-root validation before any destructive command.
  Use when creating a new skill, updating an existing SKILL.md, or reviewing
  prompts/runbooks that include temp files, extraction, cleanup, PowerShell,
  bash, rm, del, Remove-Item, or archive expansion.
metadata:
  version: "1.0.0"
  author: feel-flow
  tags: "skill-authoring, safety, deletion-prevention, hooks, powershell, temp-files"
  references: "docs-template/05-operations/deployment/agent-deletion-prevention-harness.md, docs-template/MASTER.md"
---

# スキル作成安全ガード

SKILL.md や関連 runbook を作成・更新するときに、削除事故や workspace 外操作を招く危険な記述を防ぐためのスキル。

このスキルの目的は、「スキルを作るスキル」を安全側に倒し、テンポラリ作成・展開・cleanup を含む記述でも削除防止ハーネスを最初から組み込むことです。

## 1. 基本原則

1. 固定絶対パスを temp として決め打ちしない
2. `Get-Location` を workspace root の代わりに使わない
3. cleanup は相対パス、ワイルドカード、ドライブ直下を禁止する
4. 削除対象は workspace 配下の専用 temp root に限定する
5. cleanup 失敗を `SilentlyContinue` で握りつぶさない
6. 削除前に temp root 配下かどうかを必ず検証する

## 2. 生成時の必須チェックリスト

新しいスキルや runbook を作るときは、以下を満たしているか確認する。

- [ ] temp パスが対象ファイルまたは workspace 配下から導出されている
- [ ] 固定ドライブ名、固定プロジェクト名、ユーザー固有パスが入っていない
- [ ] cleanup が実行ごとの一意な temp ディレクトリ単位になっている
- [ ] `rm`, `del`, `Remove-Item`, `find -delete` に wildcard が含まれていない
- [ ] cleanup 前のパス検証関数がある
- [ ] 削除対象が temp root 自体ではなく、その配下の subdirectory になっている
- [ ] Windows を主対象にする場合、sandbox 前提の説明になっていない

## 3. 禁止パターン

以下のパターンを含むスキル文面は生成しない。

```powershell
# ❌ 固定絶対パス
$tempDir = "d:\Git\project\_temp_extract"

# ❌ cwd 依存
$workspaceRoot = (Get-Location).Path

# ❌ wildcard cleanup
Remove-Item -Force "d:\Git\project\_temp_*_output.md"

# ❌ temp root 丸ごと削除
Remove-Item -Recurse -Force $tempRoot

# ❌ cleanup 失敗の握りつぶし
Remove-Item -Recurse -Force $tempDir -ErrorAction SilentlyContinue
```

```bash
# ❌ 相対削除
rm -rf ./*

# ❌ workspace 外の固定パス
rm -rf /tmp/project-extract

# ❌ find -delete
find . -name '*temp*' -delete
```

## 4. 推奨パターン

### PowerShell

```powershell
function New-ScopedTempDirectory($sourceFilePath, $toolName) {
    $resolvedSourcePath = [System.IO.Path]::GetFullPath($sourceFilePath)
    $sourceDirectory = Split-Path -Parent $resolvedSourcePath
    $tempRoot = Join-Path $sourceDirectory (".tmp_" + $toolName)
    $runId = [guid]::NewGuid().ToString("N")
    $tempDir = Join-Path $tempRoot $runId

    if (-not (Test-Path -LiteralPath $tempRoot)) {
        New-Item -ItemType Directory -Path $tempRoot | Out-Null
    }

    New-Item -ItemType Directory -Path $tempDir | Out-Null

    return @{ TempRoot = $tempRoot; TempDir = $tempDir }
}

function Remove-TempPathSafely($path, $tempRoot) {
    $resolvedPath = [System.IO.Path]::GetFullPath($path)
    $resolvedRoot = [System.IO.Path]::GetFullPath($tempRoot)
    $pathRoot = [System.IO.Path]::GetPathRoot($resolvedPath)
  $normalizedRoot = $resolvedRoot.TrimEnd('\\', '/')
  $rootWithSeparator = $normalizedRoot + [System.IO.Path]::DirectorySeparatorChar

    if ($resolvedPath -eq $pathRoot) {
        throw "Refusing to delete a drive root: $resolvedPath"
    }

    if ($resolvedPath -eq $normalizedRoot) {
        throw "Refusing to delete the temp root itself: $resolvedPath"
    }

    if (-not $resolvedPath.StartsWith($rootWithSeparator, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to delete a path outside temp root: $resolvedPath"
    }

    if (Test-Path -LiteralPath $resolvedPath) {
        Remove-Item -LiteralPath $resolvedPath -Recurse -Force
    }
}
```

### bash / zsh

```bash
source_file="<target-file>"
source_dir="$(cd "$(dirname "$source_file")" && pwd)"
temp_root="$source_dir/.tmp_toolname"
run_id="$(uuidgen | tr '[:upper:]' '[:lower:]')"
temp_dir="$temp_root/$run_id"

mkdir -p "$temp_dir"

case "$temp_dir" in
  "$temp_root"/*) rm -rf -- "$temp_dir" ;;
  *) echo "Refusing to delete outside temp root: $temp_dir" >&2; exit 1 ;;
esac
```

## 5. Windows 主体の注意事項

- Windows では terminal sandbox を前提にしない
- 削除防止は approval、deny ルール、hook を主手段とする
- PowerShell 記述では `Remove-Item -LiteralPath` を優先する
- ドライブレター付きの固定パス例をテンプレートに入れない

## 6. スキル生成時の出力方針

スキルを生成するときは、以下の順序で書く。

1. 目的
2. 適用対象
3. 安全上の必須ルール
4. 危険パターンを避けた実行例
5. cleanup の安全条件
6. 既知の制限事項

temp や cleanup を扱うスキルでは、必ず「安全上の必須ルール」を本文前半に置くこと。

## 7. レビュー観点

既存スキルをレビューするときは、以下を重点的に確認する。

- temp path が他プロジェクトへ持ち越せない固定値になっていないか
- cleanup が一意な temp subdirectory ではなく root 全体を消していないか
- wildcard cleanup がないか
- `ErrorAction SilentlyContinue` や `2>/dev/null` で事故兆候を隠していないか
- instructions と cleanup サンプルが矛盾していないか

## 8. 関連ドキュメント

- [../../../05-operations/deployment/agent-deletion-prevention-harness.md](../../../05-operations/deployment/agent-deletion-prevention-harness.md)
- [../../../MASTER.md](../../../MASTER.md)
