---
id: template-export
title: ff-dev-toolkit正本からのテンプレート直接配布
version: 1.0.0
status: active
created: 2026-09-08
updated: 2026-09-08
owner: feel-flow
tags: [asdd, templates, distribution]
references:
  - docs/DESIGN_PRINCIPLES.md
changeImpact: high
visibility: public
---

# ff-dev-toolkit正本からのテンプレート直接配布

スキル・生成処理・配布テンプレートの正本は `feelflow-plugins` の `plugins/ff-dev-toolkit` とする。このリポジトリの直接利用用テンプレートは、**レビューした固定コミットから対象を限定して一方向に出力する。** `docs-template/` 全体のコピーや利用先へのSKILL.mdの複製は行わない。

本書と同期ツールの追加は、2.0テンプレートの出力・公開完了を意味しない。実際の出力は [Issue #525](https://github.com/feel-flow/ai-spec-driven-development/issues/525) で追跡し、正本のリリース確定後に実施する。

## 出力するものと残すもの

初回の対象はMASTER、PROJECT、DOMAIN、ARCHITECTURE、PATTERNS、TESTING、DEPLOYMENTの7文書に限定する。対象パスは `scripts/export-toolkit-templates.mjs` の `FILES` が持つ。7文書を利用先ですべて必須にする意味ではない。

- 対象ファイルはGitオブジェクトのバイト列のまま出力し、同じ相対パスと既存URLを維持する。
- `docs-template/.template-source.json` に出力元リポジトリ、ref、完全なコミットSHA、プラグイン版、ライセンス名、各ファイルのSHA-256を記録する。
- `docs-template/SOURCE_LICENSE.txt` に正本のLICENSEを同梱する。プラグイン由来の出力を、本リポジトリ全体のMIT表記で上書きしない。ファイル中の著作権・帰属表記も保持する。
- 対象外の既存ファイルは削除・上書きしない。個別に差分を検討してから、次の同期対象追加を決める。
- `.template-source.json` は由来と一致確認の証拠であり、GitHub Releaseが公開済みであることの証明ではない。

## 初回比較で確認した独自内容

2026-09-08時点の方法論側とプラグイン側を比較した。方法論側126ファイル、プラグイン側150ファイル、共通123ファイルのうち53が一致・70が相違した。これは初回棚卸しの記録であり、リリース時には対象コミットで再確認する。

| 対象                                                                                              | 差分と扱い                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `03-implementation/PATTERNS.md`                                                                   | 方法論側の9月6日の修正が先行していた。numeric codeにHTTP response形状を要求、1xx〜3xxの分類、SendGridのresponse.body取得、非HTTP causeを値でなく形状だけ記録する改善を、出力前に正本へ統合する |
| MASTER・TESTING・DEPLOYMENT                                                                       | 方法論側はプラグインなしで読める配布元表記を持つ。正本にも直接利用用URLを追加し、出力時の文字列置換に依存しない                                                                                |
| DOMAIN・ARCHITECTURE                                                                              | 正本の状態遷移の追加、ADRの例示番号と実採番の区別を確認する。既存内容を失わず取り込む                                                                                                          |
| `01-context/PROJECT.md`                                                                           | 初回比較で同一。対象に含めて由来を統一する                                                                                                                                                     |
| `SETUP_CURSOR.md`、`05-operations/deployment/cursor-cli-reviewer.md`、同 `gemini-cli-reviewer.md` | 方法論側のみに存在。既存URLを維持し、出力対象外のまま保持する                                                                                                                                  |
| その他の共通差分・プラグイン側のみの27ファイル                                                    | 初回対象外。ACE運用スクリプト、知識台帳、SKILL.mdなどを一括コピーしない                                                                                                                        |

PATTERNSの改善や直接利用用URLが、**選んだ正本コミットに含まれていること**を差分レビューで確認する。版番号が大きいという理由だけで、独自修正が取り込まれたと判断しない。

## リリース時の実行手順

メンテナは `feelflow-plugins` のローカルcheckoutと、このリポジトリの作業ブランチを使用する。出力ツールはコミットやpushを行わない。

1. 正本のリリースと公開プラグインの同期結果を確認し、対応するソースのrefまたはタグと、完全なコミットSHAを記録する。未公開の候補を使用した場合は「候補の検証」と報告する。
2. 初回比較の独自改善がソースに含まれるか確認する。旧ファイルが持つ必要な内容を失う場合は、先に正本へ反映する。
3. 次のコマンドの `SOURCE_CHECKOUT`・`SOURCE_REF`・`SOURCE_COMMIT` を確認した値に置き換え、計画を保存する。計画は対象の現在ハッシュと出力予定ハッシュを含む。

```bash
node scripts/export-toolkit-templates.mjs \
  --source SOURCE_CHECKOUT --ref SOURCE_REF --commit SOURCE_COMMIT \
  > /tmp/asdd-template-review.json
```

4. 各対象の差分を、指定コミットの `plugins/ff-dev-toolkit/docs-template/<相対パス>` とこのリポジトリの `docs-template/<相対パス>` で確認する。正本の作業中ファイルは使わない。出力対象とライセンスも確認する。
5. レビューした計画を指定して出力する。ソースrefが移動した場合や対象の手編集が入った場合は拒否される。新しい計画を取得し、変更理由を確認してから進める。

```bash
node scripts/export-toolkit-templates.mjs \
  --source SOURCE_CHECKOUT --ref SOURCE_REF --commit SOURCE_COMMIT \
  --apply --review-plan /tmp/asdd-template-review.json
node scripts/export-toolkit-templates.mjs \
  --source SOURCE_CHECKOUT --ref SOURCE_REF --commit SOURCE_COMMIT --check
```

6. 出力後に `npm run quality:local` を実行し、直接利用の導入案内と参照先を確認する。対象版の `asdd-init` やMCPとの適合も別に評価する。マージ後には配布先のファイルと由来情報を確認して、出力済み・公開済みを記録する。

`--check` はファイル・外部状態を変更せず、対象7文書・ライセンス・由来情報を指定コミットから再計算して照合する。任意の文書を追加しただけでは不一致にしない。対象ファイル・親ディレクトリがsymlinkの場合は出力前に拒否する。

途中で書き込みが止まった場合は、`--check` とGit差分から保存された範囲を確認する。前の計画を無理に再適用せず、現在のハッシュを含む新しい計画をレビューして再実行する。利用者の後続編集を消すような一括リセットをしない。

## 直接利用者の読み方

プラグインを使わずファイルを参照・コピーする場合、本文中の `${CLAUDE_PLUGIN_ROOT}` をシェルで展開する必要はない。文書にある公開配布元の同じ相対パスから、利用する配布版に対応するファイルを参照する。必要な拡張文書だけを追加し、既存の手編集や合意を残す。

スキルの導入、Hookの対応、文書検索、書籍の改訂・公開は、静的テンプレートの出力だけでは完了しない。それぞれの配布版と実際の動作・公開状態を確認する。

## Changelog

### [1.0.0] - 2026-09-08

- 追加: 初回差分監査、対象限定・固定SHA・レビュー計画による出力、ライセンス・一致検証、公開境界を定義。
