# ケーススタディ

本リポジトリのフレームワークや関連ツールを、実プロダクトでどのように運用したかを記録します。

## ACE autonomous（FeelFlow ID Platform ほか）

**ステータス**: データ収集中（shadow 運用完了後に追記予定）

FeelFlow ID Platform 等で、ACE Playbook の自動ナレッジキャプチャを subagent + 独立 worktree に委譲した事例について、次を追記予定です。

- shadow 運用期間と本番化の判断基準
- 成功率（draft PR 採択率、自動 squash マージまで至った割合）
- ロールバック発生件数と主因
- Copilot / レビュー API クォータへの影響（採用した場合）

参照テンプレート: [ace-autonomous.md](../docs-template/05-operations/deployment/ace-autonomous.md) · Issue [#367](https://github.com/feel-flow/ai-spec-driven-development/issues/367)
