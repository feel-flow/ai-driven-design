# GitHub Actions を使わない運用への移行設計

> **移行実装**: `quality:local`、Husky `pre-push`、PR テンプレ、ドキュメント更新、**`.github/workflows/` 内の `ci.yml` / `release.yml` / `release-drafter.yml` の削除**を Issue #377 系の作業で反映済み。`.github/release-drafter.yml`（設定）は手動リリース時のカテゴリ参考として保持。
>
> **関連**: [Issue #377](https://github.com/feel-flow/ai-spec-driven-development/issues/377)

---

## 1. 目的

リモートでの GitHub Actions 実行に依存せず、**ローカル品質ゲート**と**手動リリース手順**で同等の品質と透明性を確保する運用へ移行するための、現状整理と方針を定義する。

---

## 2. 現行 workflow 棚卸し

以下は**移行以前**に本リポジトリで用いられていた定義の記録です（実装反映後、該当ワークフロー YAML はリポジトリから**削除**されています。復元は古いコミットを参照）。

### 2.1 `/.github/workflows/ci.yml`（name: `CI`）

| 項目         | 内容                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| **役割**     | ビルド・MCP チェック・テスト・文書検証・Markdown リントを一括実行し、PR／`develop` 向けの品質ゲートとする。 |
| **トリガー** | `pull_request` → ブランチ `develop`, `main` へのPR。`push` → ブランチ `develop` へのプッシュ。              |
| **補足**     | Node マトリクス: **20, 22, 24**（`markdownlint-cli2` 等の Node 20 以上要件に沿った検証）。                  |

### 2.2 `/.github/workflows/release.yml`（name: `Release`）

| 項目         | 内容                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **役割**     | タグ `v*.*.*` プッシュ時に Release Drafter でノート生成し、`softprops/action-gh-release` で **GitHub Release** を作成する。 |
| **トリガー** | `push` → タグ `v*.*.*`                                                                                                      |

### 2.3 `/.github/workflows/release-drafter.yml`（name: `Release Drafter`）

| 項目         | 内容                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **役割**     | リリース下書き（ドラフト）の更新。通常は `develop` 上の累積PRを反映。                              |
| **トリガー** | `push` → ブランチ `develop`。`pull_request` → 種別 `opened`, `reopened`, `synchronize`, `closed`。 |
| **補足**     | `Release` ワークフロー内でも `release-drafter@v6` が同アプリとして利用される。                     |

### 2.4 `/.github/release-drafter.yml`（Release Drafter 設定）

<!-- prettier-ignore -->
| 項目         | 内容                                                                                                                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **役割**     | リリースノートの**見出しグルーピング**、バージョン解釈、変更行テンプレートを定義する。                                                                                                                                                                       |
| **主な定義** | カテゴリ: `🚀 Features`（`enhancement`）、`🛠 Fixes`（`bug`, `hotfix`）、`📚 Documentation`（`documentation`）。`version-resolver` で `major` / `minor` / `patch` ラベルに応じたバンプ方針。`name-template` / `tag-template` は `v$RESOLVED_VERSION` 形式。   |

---

## 3. ローカル品質ゲート（CI 同等の順序）

移行前の `ci.yml` ジョブ `build-and-test` と**同じ意図**の作業を、**単一の順序付きコマンド列**としてローカルで再現する。

### 3.1 前提

- **Node.js**: `package.json` の `engines.node` は **`>=20.0.0`**。ローカルも 20 以上を推奨（CI の最小マトリクスは 20 に相当）。
- 作業ディレクトリ: **リポジトリルート**。

### 3.2 推奨コマンド（CI と揃えた順）

以下は **現行 `ci.yml` のステップ順**に合わせています（`root package.json` / `mcp/package.json` に基づく表記）。

```bash
npm ci
npm --prefix mcp ci
npm run build:mcp
npm run check
npm --prefix mcp test
npm run test:ace-scripts
npm run validate -- docs-template
npm run build:spec-index
npm run lint:md
```

| 手順                                | 根拠（スクリプト定義先）                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                            | ルート。ロックファイルに従いルート依存を再現。                                                                                                             |
| `npm --prefix mcp ci`               | `mcp/package.json`。MCP サーバー側の `npm ci`。                                                                                                            |
| `npm run build:mcp`                 | ルート → `npm --prefix mcp run build`（MCP ビルド）。                                                                                                      |
| `npm run check`                     | ルート → `mcp` の `check`（ビルド＋`--check`）。                                                                                                           |
| `npm --prefix mcp test`             | `mcp` の Vitest。                                                                                                                                          |
| `npm run test:ace-scripts`          | ルート、ルート `vitest run`（ACE スクリプト用テスト）。                                                                                                    |
| `npm run validate -- docs-template` | ルート `validate` に `docs-template` 引数。                                                                                                                |
| `npm run build:spec-index`          | ルート → `node scripts/build-spec-index.mjs`。`docs/specs/**` 検証＋索引生成（不在時は specs=0 で `dist/spec-index.json` を空索引として書き出し exit 0）。 |
| `npm run lint:md`                   | ルート、`markdownlint-cli2` 対象パスを指定。                                                                                                               |

**注**: ルートの `package.json` には `format:md`（Prettier 書き込み）/ `format:md:check`（Prettier 検査）が存在するが、本 §3.2 は **旧 `ci.yml` のステップ順** を再現するセクションのため列挙していない（旧 `ci.yml` には Prettier ステップが含まれていなかった）。**`quality:local` の実体には `format:md:check` が含まれる**（§3.3 参照）。

<a id="quality-local-detail"></a>

### 3.3 `quality:local` npm スクリプト（実装済み）

- **ルート `package.json`**: `quality:local` は **3.2 と同順**だが、**`npm ci` および `npm --prefix mcp ci` を含まない**（日々の実行時間を抑える。ロックファイル厳密再現が必要なときは手動で 3.2 冒頭の 2 ステップを先に実行する）。
- **中身の順序**: `build:mcp` → `check` → `mcp test` → `test:ace-scripts` → `validate -- docs-template` → `build:spec-index` → `format:md:check` → `lint:md`。
- **合意事項**: 3.2 の意図を破壊的に変えない（意図的な手順変更を除く）。

### 3.4 markdownlint（補足）

日本語を含む表で **MD060**（列パイプの画一スタイル）が誤検知しやすいため、本リポジトリの `.markdownlint.json` では **MD060 をオフ**にしている（`lint:md` は他ルールのまま）。

---

## 4. Husky

### 4.1 現行: `.husky/pre-commit`

- **範囲**: **ステージ済み**のうち、変更のあった **`.md` ファイルのみ** `markdownlint-cli2`（`npx` 経由）。
- **意図**: コミット前にドキュメントの明らかな違反を素早く抑止。フル品質ゲートは実行しない。

### 4.2 設計: `pre-push` での拡張（任意）

| 方針                                          | 内容                                                                        | トレードオフ                                                                                         |
| --------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **A. pre-push なし（現状維持＋文書化）**      | フル品質は PR 前の手動（または `quality:local` 実装後の明示実行）に委ねる。 | 誤プッシュの検知はリモートCI（移行後は**ローカル習慣**）に依存。                                     |
| **B. pre-push で `quality:local` 相当を実行** | プッシュ直前に CI 同等のゲート。                                            | プッシュが遅くなる・大きな差分で毎回全テスト。オプトアウトの約束（`HUSKY=0` 等）のガバナンスが必要。 |
| **C. pre-push は「高速サブセット」のみ**      | 例: `lint:md` + `npm run check` 程度。完全一致は週次やPR前にフル実行。      | CI 相当との**完全一致**は保証されない。                                                              |

**推奨（設計段階）**: 移行直後は **A または C** を推奨し、チーム合意のうえ **B** へ拡張する。フル一致が必要なタイミング（リリース前・大規模 doc 変更）は 3.2 または `quality:local` を**明示実行**する運用をドキュメントに明記する。

**実装**: `.husky/pre-push` で **方針 C**（`lint:md` → `check`）を採用。フル相当は PR 前の `npm run quality:local` に委ねる。

---

## 5. PR テンプレート更新方針

現行 [`.github/pull_request_template.md`](../.github/pull_request_template.md) は「MCP チェック・テスト」を **ローカルコマンド**前提で列挙しているが、併せて**リモート CI への暗黙依存**を前提とする読みが残る場合、**「ローカルで 3.2（または `quality:local`）相当を実施し結果を自己申告」**に寄せる。

**本文の具体的な改稿案**は[付録 A](#付録-a-pr-テンプレート改稿案)に記す（本PRでは**テンプレートファイルの実変更は行わない**想定。実装は別PR）。

---

## 6. リリース手動フロー（Release Drafter + タグ駆動 `release.yml` の置き換え）

移行後は、**GitHub Actions** 上の Release Drafter／タグ連携ジョブに代わり、**メンテナが手元で**以下を実行する方針とする。グルーピングの考え方は [`.github/release-drafter.yml`](../.github/release-drafter.yml) を**手動要約**の靈感元とする。

### 6.1 方針概要

1. `develop`（または合意のブランチ）上で次リリースに含めた **マージ済みPR / Issue** を、ラベル（`enhancement` / `bug` / `hotfix` / `documentation` 等）に従い **3カテゴリ**（Features / Fixes / Docs）程度に**手で**または**補助スクリプト**で整理。
2. **セマンティックバージョン**は従来どおりラベル規約（`major` / `minor` / `patch`）に基づき決定（チーム合意の単一真実として `DECISIONS.md` 等に残すのが望ましい）。
3. 必要なら **git tag** `vX.Y.Z` を作成しプッシュ。あるいは **`gh release create` に `--target` やノート付き**で一括（タグ有無の運用はリポジトリ方針で固定）。
4. `gh release create` の例（**説明用**。バージョン・リポは読み替え）:

   ```bash
   gh release create "v1.5.0" --title "v1.5.0" --notes-file RELEASE_NOTES.md
   ```

5. `RELEASE_NOTES.md` 本文は、Release Drafter の `change-template` に近い行形式（例: `- タイトル (#番号) @作者`）を**手作業または小スクリプト**で揃える。

### 6.2 Release Drafter から継承する「意味」

<!-- prettier-ignore -->
| カテゴリタイトル | 主なラベル（既存設定）  |
| ---------------- | ----------------------- |
| 🚀 Features      | `enhancement`           |
| 🛠 Fixes          | `bug`, `hotfix`         |
| 📚 Documentation | `documentation`         |

`version-resolver` の**ラベル→バンプ種別**の思想は、リリース作業手順（チェックリスト）に**表形式**で残し、人間の判断を助ける。

---

## 7. 既存 workflow の扱い（オプション表と推奨）

**本設計段階ではファイルを削除しません。**

| 手段                                 | 内容                            | 長所                         | 短所                                                                     |
| ------------------------------------ | ------------------------------- | ---------------------------- | ------------------------------------------------------------------------ |
| **リポジトリの Actions を無効化**    | 設定でワークフローを止める      | 履歴は残る、再開が比較的容易 | 組織方針で一括禁止が難しい場合あり                                       |
| **該当 YAML の削除**                 | `ci.yml` 等をリポジトリから除く | 意図が明確                   | 巻き戻しは Git で追跡が必要                                              |
| **アーカイブとして `docs` 等へ退避** | 旧定義を参照用に保存            | 監査・新人説明向き           | 本物と**二重管理**のリスク。`.github/workflows` に重複定義を置かないこと |

**推奨**: 移行**実装**フェーズでは、まず **「無効化または削除方針をIssueで合意」** → 本リポジトリでは**削除**で揃え、必要なら **タグ付き古いコミット**や設計本文（本書のセクション2）に**定義の写し**を残す。組織が**fork テンプレ利用**の場合、利用者向けに「CI なし版」の説明を README へ出す（後述の更新文書）。

---

## 8. 更新が必要なドキュメント一覧（想定）

本移行の**文書上の**追従先です。実装は各ドキュメントの責任範囲のIssue／PRに分割してよい。

| 文書                                                         | 主な更新内容の方向性                                                                                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ルート `README.md`**                                       | 品質保証（ローカルコマンド一覧／将来 `quality:local`）。**`package.json` に存在しない `format:md` 等**の表記の是正。                                           |
| **`docs-template/05-operations/DEPLOYMENT.md`**              | 索引テーブル**直後**の本リポジトリ向け補足（本設計へのリンク1行。既存表は列幅不整合のため行追加せず）。                                                        |
| **`docs-template/05-operations/deployment/github-setup.md`** | Release Drafter 前提の箇所へ**手動リリース**（`gh release create` 等）の併記。                                                                                 |
| **`docs-template/05-operations/deployment/ci-cd.md`**        | テンプレート的な Docker／汎用パイプライン記述と、本リポの**実体ワークフロー**の差の整理。                                                                      |
| **`docs/AI_GIT_WORKFLOW.md`**                                | 「テスト自動実行がリモートCI」と読める箇所の言い換え。本設計への**最小リンク**（「関連ドキュメント」節。なお本PRで相互リンクを追加する場合は該当箇所を更新）。 |

**注**: 本リポの `ci-cd.md` は汎用テンプレートの**サンプル**性が強いため、**本リポの実体（`ci.yml` 等）と矛盾する段落**の整理方針を issue で決めるのが望ましい。

---

## 9. 受け入れ基準

設計段階の受け入れ基準（§2〜8、付録）に加え、移行実装では次を満たす。

1. **棚卸し**: 旧 `ci.yml` / `release.yml` / `release-drafter`（workflow + 設定）の**役割とトリガー**が本文 §2 で追跡可能。
2. **ローカル品質ゲート**: `quality:local` および 3.2 全文で **Node >= 20** を前提化。
3. **`quality:local`**: ルート `package.json` に実装（`npm ci` 抜きの同順チェーン）。
4. **Husky**: pre-commit 維持。pre-push は方針 **C** で実装。
5. **PR テンプレ**: 付録 A に沿った**ローカル検証**文言へ更新。
6. **リリース手順**: 手動 `gh` フローとラベル／`.github/release-drafter.yml` の参考利用を文書化。
7. **ワークフロー YAML**: 推奨どおり **3 ファイル削除**（`ci.yml`, `release.yml`, `release-drafter.yml`）。設定ファイル `release-drafter.yml` は方針に従い保持可。
8. **導線**: `DEPLOYMENT` 索引・`AI_GIT_WORKFLOW`・`README` から本書へ到達可能。

## 10. ブランチ保護と必須ステータス

リモートで **「CI」ワークフローを必須**にしている場合、ワークフロー削除後は**該当ステータスチェックが得られない**。リポジトリ**管理者**が GitHub のブランチ保護ルールで、必須チェック名の変更または削除（チーム方針に従う）を検討する。本リポジトリの設定操作は本ドキュメントのスコープ外。

---

## 付録 A: PR テンプレート改稿案

`.github/pull_request_template.md` には**反映済み**。以下は採用時点の**参照用コピー**。

```markdown
## Summary

<!-- 変更の概要を1〜3行で記述してください -->

## Changes

<!-- 変更内容をファイルごとに記載してください -->

## Self-Review Results

- [ ] **ローカル品質ゲート**: `npm run quality:local` を **PR 提出前** に実行し、**失敗がない** ことを確認した（依存ロック厳密再現が必要な場合は事前に `npm ci` / `npm --prefix mcp ci`。実体チェーンは [§3.3](#quality-local-detail)）
- [ ] `markdownlint`: 該当 Markdown に問題なし（Husky pre-commit と整合）
- [ ] MCP: `npm run check` 相当でエラーなし（該当する場合）
- [ ] テスト: `npm --prefix mcp test` および `npm run test:ace-scripts`（該当する場合）がパス

> **注**: リモート **GitHub Actions** に依存しない方針のため、**マージ前の品質はローカル実行＋本チェックリスト**を前提とする。

### Cross-Model Review Results

- [ ] PR Review Toolkit: 実施済み
- [ ] Codex CLI (`bash scripts/codex-review.sh --branch`): 実施済み
- [ ] [Review Response Policy](docs-template/05-operations/deployment/review-response-policy.md) に従い対応済み

## Test plan

<!-- 手動で確認した手順を記載 -->

## Checklist

- [ ] MASTER.md のコード生成ルールに準拠
- [ ] マジックナンバー禁止ルールを遵守（該当する場合）
- [ ] 型安全性を確保（該当する場合）
- [ ] リンク切れがない

## HIGH Impact Changes

（既存の HIGH セクションと同様。省略可能）

## Related Issue

<!-- Closes #XX -->
```

---

## 付録 B: 用語

| 用語       | 本書での扱い                                                                       |
| ---------- | ---------------------------------------------------------------------------------- |
| 品質ゲート | 上記 3.2 の一連のコマンド。                                                        |
| CI 相当    | 現行 `ci.yml` の手順に揃えた**ローカル再現**。                                     |
| 移行実装   | ワークフロー削除、Husky、PR テンプレ、`quality:local` 追加、関連ドキュメント更新。 |

---

_最終更新: 移行実装（Issue #377 系）_
