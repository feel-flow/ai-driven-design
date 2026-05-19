# Implementation Notes - #419

> 本 PR (#419) で導入する ACE-034 パターン自体のドッグフーディング。実装中の判断を逐次記録する。

## Decisions not in spec

- **配置場所はリポルート直下に固定**: `docs/notes/` や `08-knowledge/` 配下も検討したが、(a) 「作業ブランチ直下」と書いた方が AI ツールが書き出す場所を一意に決められる、(b) マージ時に削除/移動するかチーム判断と書いたので長期保存先は別議論、と切り分けた。複数ファイル化（`notes/<branch>.md` 等）は実装の選択肢として残すが ACE-034 の Action には書かない（早すぎる抽象化）
- **見出しは「最低限 4 つ」と緩く規定**: 厳密なテンプレ強制（全項目必須など）はせず、ひな形を提示する形にとどめた。AI 仕様駆動開発の「ガードレール」スタンスに合わせる
- **ACE-034 と Workflow ステップ3 を 1 PR で同時改稿**: 概念知見（Playbook）と運用手順（Workflow）はセットで効くので分割しない。ACE-021（テンプレ配布の境界）は守れている（implementation-notes.md は採用者の運用物で、リポ自身のテンプレ配布物ではない）
- **【advisor pivot】Action 5 の推奨を (a) 同梱→(b) マージ前削除 に変更**: 当初「(a) PR に同梱したまま残す」を推奨にしたが、advisor から「squash merge 標準のリポではルート直下のファイルが次 PR と構造的に衝突する（ACE-021 と同型）」と指摘され pivot。(b) マージ前に PR description へ転記 + `git rm` を primary、(c) `notes/<issue-num>.md` を alternative に変更。本 PR でもこの推奨に従い pr-ready 直前にこのファイル自体を削除予定

## Changes from spec

- 当初 Issue 本文の受入基準は 6 項目だったが、実装中に「ドッグフード版 `implementation-notes.md` をリポに同梱する」判断を追加（受入基準には含めず、PR description で言及する）
- ACE-034 の Related フィールドに `ACE-032` を追加（Issue 本文では ACE-009 / ACE-023 のみ列挙していたが、執筆中に ACE-032 の発見経緯がこのパターンで防げる典型例と気付いた）

## Tradeoffs

- **採った**: 既存 ACE エントリ（ACE-001〜033）と同じテーブル+Insight+Context+Action フォーマットを踏襲。形式整合性を優先し、新フォーマットの実験はしない
- **採らなかった**: implementation-notes.md を `.gitignore` する選択肢。**advisor pivot 後の Action 5（マージ前に PR description へ転記 + git rm）と矛盾する**ため不採用。コミットに含めることで (a) レビュアーが PR レビュー中に参照可能、(b) ACE Phase 1 Generate が PR description 経由で raw material として再利用可能、の 2 点を担保する
- **採らなかった**: ACE-034 のテンプレファイル（`docs-template/templates/implementation-notes.md` 等）を新規追加する選択肢。新規ファイル作成は最小限（CLAUDE.md 原則）に従い、ひな形は workflow 文書内に inline で提示
- **採らなかった**: ステップ5（Self-Review）・ステップ10（ACE）の文書まで横断改稿する選択肢。スコープを広げすぎるとレビュー負荷が増えるため、ステップ3 にとどめて他ステップは ACE-034 への参照リンクのみで自然に効くようにした

## Open questions / TODO

- マージ後に `/ace` を回すべきか？ → 本 PR 自体が ACE-034 を追加しているので、メタ知見（「外部知見を Playbook に取り込む際の照合手順」「advisor pivot で primary 推奨を反転した経緯」など）の二次抽出があり得る。判断はマージ後に決める
- `docs-template/05-operations/deployment/self-review.md` の 5 観点に「implementation-notes.md を確認したか」を追加するか？ → 別 Issue 候補。ACE-034 の浸透状況を見て判断
- ACE-034 が定着したら、ステップ10（ACE Generate）のプロンプトテンプレートに implementation-notes.md を raw material として追加する改修が要る → 別 Issue 候補
- ACE-034 推奨を (b) に切り替えたことを踏まえ、`notes/<issue-num>.md` 代替案を本テンプレで標準化するかは別議論（並行 PR が多いチーム向け）
