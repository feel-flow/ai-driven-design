# Claude Code Hooks

このディレクトリには、Claude Codeのセッション開始時に実行されるhookスクリプトが含まれています。

## 利用可能なHook

### check-branch-status.sh

PRマージ後のブランチ切り替え忘れを防ぐためのスクリプトです。

**機能:**
- リモートにブランチが存在しない場合、PRマージ済みの可能性を警告
- mainブランチより大幅に遅れている場合、rebaseを推奨

**設定方法:**

1. `.claude/settings.json` または `.claude/settings.local.json` に以下を追加：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "type": "command",
        "command": ".claude/hooks/check-branch-status.sh",
        "description": "Check git branch status and warn if needed"
      }
    ]
  }
}
```

2. 環境変数でカスタマイズ（オプション）：

```bash
# メインブランチ名を変更（デフォルト: develop）
export MAIN_BRANCH="main"

# 警告を出すコミット数の閾値を変更（デフォルト: 10）
export BEHIND_THRESHOLD="20"
```

**使用例:**

Claude Codeセッション開始時に自動的に実行され、以下のような警告が表示されます：

```
⚠️  WARNING: 現在のブランチ 'feature/#123-add-feature' はリモートに存在しません。
   PRがマージ済みの可能性があります。
   以下のコマンドで develop ブランチに戻ることを推奨します：

   git checkout develop
   git pull origin develop
   git branch -d feature/#123-add-feature
```

## カスタムHookの追加

独自のhookを追加する場合：

1. このディレクトリに実行可能なスクリプトを配置
2. `.claude/settings.json` のhooks設定に追加
3. スクリプトに実行権限を付与: `chmod +x .claude/hooks/your-script.sh`

詳細は [docs/05-operations/DEPLOYMENT.md](../../docs/05-operations/DEPLOYMENT.md) の「開発環境の最適化」セクションを参照してください。

### post-merge.ace.sample.sh（参考）

ACE autonomous 化のテンプレートとして、`docs-template/.claude/hooks/post-merge.ace.sample.sh` を用意しています（Issue [#367](https://github.com/feel-flow/ai-spec-driven-development/issues/367)）。`ACE_SUBAGENT_ENABLED=1` のときだけ `scripts/ace/run-subagent.sh` をバックグラウンド起動する例です。詳細は [ace-autonomous.md](../../docs-template/05-operations/deployment/ace-autonomous.md) を参照してください。
