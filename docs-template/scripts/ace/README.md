# scripts/ace — ACE autonomous キャプチャ用テンプレート

Issue [#367](https://github.com/feel-flow/ai-spec-driven-development/issues/367) で追加された **推奨パターン** のファイル群です。プロジェクトルートを基準にコピーして利用してください。

## 含まれるファイル

| ファイル                                      | 説明                                                              |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `run-subagent.sh`                             | ロック取得、`git worktree` 作成、`claude -p` 起動、後片付けの骨子 |
| `check-category-size.ts`                      | Playbook 内の Category ごとの件数を数え、閾値超過で非ゼロ終了     |
| `docs-template/.claude/agents/ace-capture.md` | Subagent 用プロンプト（コピー先は `.claude/agents/`）             |

post-merge からの呼び出し例は `docs-template/.claude/hooks/post-merge.ace.sample.sh` を参照してください。

## インストール手順（概要）

1. `scripts/ace/` をプロジェクトにコピーする。
2. `.claude/agents/ace-capture.md` をコピーする。
3. `chmod +x scripts/ace/run-subagent.sh`
4. `.claude/settings.local.json`（または CI の環境変数）に **デフォルト無効** の feature flag を設定する（`ace-autonomous.md` 参照）。
5. `ACE_GARDEN_WALL_PATHS` を **必ず** プロジェクト用に設定する（未設定時は `run-subagent.sh` が起動を拒否する）。

## check-category-size.ts の実行

Node 20+ を前提とします。TypeScript をそのまま実行する例:

```bash
npx --yes tsx scripts/ace/check-category-size.ts docs/08-knowledge/PLAYBOOK.md
```

環境変数 `ACE_MAX_ENTRIES_PER_CATEGORY`（省略時は `130`）で閾値を変更できます。値が **非数値または 1 未満**のときは既定値 `130` にフォールバックし、標準エラーに警告を出します。

### post-merge 用の環境変数ファイル

Git GUI 等では hook に環境変数が渡らないことがあります。`.ace-capture/hook-env.sh` に `export ACE_GARDEN_WALL_PATHS=...` を書き、`post-merge.ace.sample.sh` が自動で `source` する流れを推奨します（詳細は [ace-autonomous.md](../../05-operations/deployment/ace-autonomous.md)）。
