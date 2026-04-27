# ACE ナレッジキャプチャの autonomous 化（subagent + worktree）

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **関連**: [ace-cycle.md](./ace-cycle.md) | [knowledge-management.md](./knowledge-management.md) | [ACE フレームワーク概念](../../../docs/ACE_FRAMEWORK.md)

## 概要

従来は PR マージ後に開発者が `/ace-curate` 等を手動実行し、セッション内で LLM が Playbook を直接編集する運用でした。Playbook が肥大化するほど **ユーザー拘束** と **編集 drift リスク** が増えます。

**autonomous パターン**では、マージ完了後に **別プロセス**（例: `claude -p` + `nohup` + `disown`）で **専用 subagent** を起動し、**独立した git worktree** 上で Generate → Reflect → Curate → draft PR までを完結させます。条件を満たす場合のみ **squash マージを自動化** し、親の Claude Code セッションから切り離します。

## 推奨セットアップ（テンプレート）

以下をプロジェクトにコピーし、パス・環境変数を調整してください。

| 種別                        | テンプレートパス（本リポジトリ）                                                                       | 配置先の例                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| Subagent 定義               | [`docs-template/.claude/agents/ace-capture.md`](../../.claude/agents/ace-capture.md)                   | `.claude/agents/ace-capture.md`        |
| 起動オーケストレータ        | [`docs-template/scripts/ace/run-subagent.sh`](../../scripts/ace/run-subagent.sh)                       | `scripts/ace/run-subagent.sh`          |
| カテゴリ肥大化検知          | [`docs-template/scripts/ace/check-category-size.ts`](../../scripts/ace/check-category-size.ts)         | `scripts/ace/check-category-size.ts`   |
| post-merge からの呼び出し例 | [`docs-template/.claude/hooks/post-merge.ace.sample.sh`](../../.claude/hooks/post-merge.ace.sample.sh) | 既存の post-merge に追記または参考実装 |
| 導入手順                    | [`docs-template/scripts/ace/README.md`](../../scripts/ace/README.md)                                   | （参照のみ）                           |

詳細なインストール手順は [scripts/ace/README.md](../../scripts/ace/README.md) を参照してください。

## 実行モデル（全体像）

```text
post-merge hook（任意）
  → feature flag ON のときのみ
  → scripts/ace/run-subagent.sh
       → 排他ロック（mkdir ベース等）
       → git worktree add（専用ディレクトリ）
       → claude -p --agent ace-capture --permission-mode bypassPermissions（例）
       → draft PR / 条件付き squash merge
       → worktree 削除・ロック解放
```

- **親セッションからの分離**: `nohup` / `disown` 等でシェルジョブを切り離し、マージ直後にターミナルを閉じても継続可能にします。
- **`ACE_CLAUDE_CMD`**: 信頼できる固定コマンドのみを設定し、未検証の外部入力を連結しないこと（シェルインジェクション対策）。
- **garden wall**: 変更を許可するパスを **環境変数 `ACE_GARDEN_WALL_PATHS`**（カンマ区切り）でホワイトリスト化し、自動マージ時の blast radius を限定します（プロジェクトごとに必ず設定）。
- **Git の使い分け**: リポジトリルートや ref の解決には `git rev-parse` 等の **スクリプト向けコマンド** を使い、worktree のライフサイクルは `git worktree` に任せます（低レベル API での再実装は非推奨）。

### Git hook と環境変数

GUI の Git クライアントや一部の CI では、マージ実行時に **`ACE_GARDEN_WALL_PATHS` が空のまま** `post-merge` が動き、`run-subagent.sh` が exit 2 になることがあります。対策として次を推奨します。

1. リポジトリに **`.ace-capture/hook-env.sh`**（git 管理するかしないかはチーム方針で決定）を置き、`export ACE_GARDEN_WALL_PATHS=...` など必要な変数を記述する。
2. `post-merge.ace.sample.sh` と同様に、hook の先頭で `source "${REPO_ROOT}/.ace-capture/hook-env.sh"` を実行する（サンプルは既にこの source を含む）。

### 排他ロックの腐敗（mkdir ロック）

異常終了で `.ace-capture/instance.lock` が残ると、以降の実行が常にスキップされます。手動で **`rmdir .ace-capture/instance.lock`**（空ディレクトリであることを確認）して解除してください。長期運用では mtime に基づく stale 解除を独自に足す選択肢もあります。

## 4 ガード（自動マージ前の最低限）

1. **Path whitelist**: `ACE_GARDEN_WALL_PATHS` 外への変更がないこと（PR diff で検証）。
2. **検証コマンド通過**: プロジェクトで定めた `ace:check` / `ace:verify` 等が成功すること。
3. **ブランチ・PR タイトル規約**: 自動 PR がチームの命名規則に従うこと。
4. **削除・追加比**: 意図しない大規模削除がないこと（閾値はプロジェクトで定数化）。

## Feature flags（デフォルト無効）

**デフォルトは無効**とし、`.claude/settings.local.json` の env や CI のシークレットで **明示 opt-in** してください。

| 変数                           | 意味                                              | 推奨初期値                                                                                   |
| ------------------------------ | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ACE_SUBAGENT_ENABLED`         | post-merge 等から subagent 起動を行うか           | `0`（無効）                                                                                  |
| `ACE_SUBAGENT_AUTO_MERGE`      | ガード通過後に squash マージまで自動で行うか      | `0`（無効）                                                                                  |
| `ACE_GARDEN_WALL_PATHS`        | 編集を許可するパス（カンマ区切り）                | プロジェクト固有（必須で設定）                                                               |
| `ACE_PLAYBOOK_PATH`            | `check-category-size.ts` が読む Playbook ファイル | 例: `docs/08-knowledge/PLAYBOOK.md`                                                          |
| `ACE_MAX_ENTRIES_PER_CATEGORY` | カテゴリあたりの最大エントリ件数                  | 省略時は `130`。**非数値や 0 以下は無効**として既定値にフォールバックし、stderr に警告を出す |

## Shadow 運用（段階導入）

1. `ACE_SUBAGENT_ENABLED=1` かつ `ACE_SUBAGENT_AUTO_MERGE=0` で **draft PR のみ**自動生成し、人間がレビュー。
2. 3〜5 PR 程度で成功率・ロールバック有無を記録（[CASE_STUDIES.md](../../../docs/CASE_STUDIES.md) へ追記可能）。
3. 問題なければ `ACE_SUBAGENT_AUTO_MERGE=1` を限定メンバーまたは特定ブランチのみで有効化。

## Playbook 肥大化と別 Issue 起票

カテゴリあたりのエントリ数が閾値を超えた場合、**subagent 内で分割作業を続けない**方針を推奨します。`check-category-size.ts` が検知し、**別 Issue の起票**（手動または `gh issue create`）に委ねることで責務を分離します。

実行例:

```bash
npx --yes tsx scripts/ace/check-category-size.ts path/to/PLAYBOOK.md
```

## レビュー戦略（任意）

docs-only の自動 PR で、構造検証（例: `ace:verify`）が CI で保証できる場合、**Copilot 等の API クォータを人間の PR に温存**する目的で、自動 PR のレビューをスキップする判断をチームで取ることがあります。セキュリティ・コンプライアンス要件に合わせて必ず合意してください。

## 関連 Issue・実装参照

- 本フレームワークへのテンプレ追加: [GitHub #367](https://github.com/feel-flow/ai-spec-driven-development/issues/367)
- 実装元（別プロダクト）: FeelFlow ID Platform 等での運用検証後、[CASE_STUDIES.md](../../../docs/CASE_STUDIES.md) にメトリクスを追記する（プレースホルダー済み）

## Changelog

### [1.0.1] - 2026-04-27

#### 変更

- PR レビュー反映: hook 用 `hook-env.sh`、`ACE_MAX_ENTRIES_PER_CATEGORY` 無効時の警告、ロック腐敗の手順、エントリ ID 正規表現を 3 桁以上に拡張

### [1.0.0] - 2026-04-27

#### 追加

- autonomous 化パターンの推奨ドキュメントとテンプレート一式（Issue #367）
