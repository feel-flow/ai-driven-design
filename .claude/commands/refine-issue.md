# /refine-issue — 既存 Issue の仕様曖昧さを検出・refine

既存の GitHub Issue を入力として、`/create-issue` の 4 観点バリデーションをベースに refine 用途向けへ項目構成を再編した観点で受け入れ条件を検証し、コードベース探索によって「Issue が触れていない論点」を洗い出します。検出した曖昧さは trivial / architectural / critical の 3 階層に分類し、階層に応じて Issue body 更新・コメント投稿・ラベル付与のいずれかを実行します。

`/create-issue` が「新規 Issue を作る前のゲート」なのに対し、`/refine-issue` は「既に立った曖昧 Issue を事後に磨く」役割を担います。

## 前提

- プロジェクトに `docs/` または `docs-template/` 配下のコア 7 文書が存在すること
- GitHub リポジトリが設定され、`gh` CLI で対象 Issue にアクセスできること
- 入力として既存 Issue 番号（または URL）が与えられること

## 引数

```text
/refine-issue <issue-number-or-url>
```

例:

- `/refine-issue 123`
- `/refine-issue https://github.com/owner/repo/issues/123`
- `/refine-issue feel-flow/feelflow-id-platform#2615`（クロスリポジトリ）

## 手順

### 1. 入力パース

引数を 3 形式のいずれかとして正規化し、`num`（issue 番号）と `repo`（`owner/name` 形式）を確定します:

```text
# 形式 1: 数字のみ
  → num=$1, repo=$(gh repo view --json nameWithOwner --jq .nameWithOwner)

# 形式 2: URL
  → 正規表現 ".*github\.com/(?<owner>[^/]+)/(?<repo>[^/]+)/issues/(?<num>\d+)" でパース
  → repo="${owner}/${repo}"

# 形式 3: owner/repo#N
  → "#" で split: repo=$(前半), num=$(後半)
```

GitHub Enterprise Server (`*.ghe.com` 等) のサポートは MVP では対象外。

引数なし・無効な形式の場合はエラー表示して停止。

### 2. Issue 取得

確定した `num` と `repo` で Issue を取得します:

```bash
gh issue view <num> --repo <owner/repo> --json number,title,body,labels,comments,state,url,assignees,author
```

`state` は `"OPEN"` / `"CLOSED"` の大文字で返ります。`state == "CLOSED"` の場合は `AskUserQuestion` ツールで「closed Issue を refine しますか？」を確認し、ユーザーが Yes と答えた場合のみ続行。No または応答なしの場合は警告のみ出して終了。

### 3. 参照文書の自動提案

Issue body の内容から、関連しそうな参照文書を提案します（`/create-issue` 同様）:

| 内容のキーワード | 必須参照 | 推奨参照 |
| ---- | -------- | -------- |
| 機能追加・新規 API | MASTER, ARCHITECTURE, DOMAIN | PATTERNS, TESTING |
| バグ・不具合 | 関連 Issue, PATTERNS | TESTING |
| リファクタリング | ARCHITECTURE, PATTERNS | TESTING |
| インフラ・デプロイ | MASTER, DEPLOYMENT | ARCHITECTURE |
| ドキュメント | MASTER | 更新対象文書 |

判定が難しい場合は `AskUserQuestion` ツールで確認します。

### 4. 4 観点バリデーション（refine 用途向け、`/create-issue` ベース）

取得した Issue body を以下 4 観点で検証します。`/create-issue` の 4 観点（具体的・検証可能・単一責務・曖昧表現排除）をベースに、項目 1 で「曖昧表現」を吸収し、項目 4 で受け入れ条件の構造チェックを追加した構成です:

- [ ] **具体性**（曖昧語排除を含む）: 「適切に」「正しく」「きちんと」「いい感じに」等の曖昧語が含まれていないか
- [ ] **検証可能性**: 受け入れ条件が「テストで確認できる表現」になっているか（例:「動くこと」ではなく「〜の場合に〜が返ること」）
- [ ] **単一責務**: 1 つの Issue に複数の独立した機能が混在していないか
- [ ] **受け入れ条件の明示**: チェックボックス形式 `- [ ]` で具体的・検証可能な条件が列挙されているか

違反箇所はリストアップして、改善案を併記します:

```text
⚠️ 4 観点バリデーション結果

具体性違反 (2 件):
- 「正しくバリデーションされること」
  → 改善案: 「メールアドレスが RFC 5322 に準拠していない場合、422 エラーを返すこと」
- 「適切にエラーハンドリングすること」
  → 改善案: 「DB 接続エラー時に 503 ステータスとリトライ可能なレスポンスを返すこと」

単一責務違反 (1 件):
- 認証機能の追加とログ出力強化が同居 → 2 Issue に分割を推奨
```

### 5. コードベース探索 SubAgent

`Task` ツール（`subagent_type: "Explore"`、Claude Code 組み込み）を使い、Issue が触れていない論点を洗い出します。SubAgent を使うことで親 context のコンテキストウィンドウに探索の生ログを取り込まず、要約のみを返すことで compact 圧迫を防ぎます。`Explore` が利用できない環境では `subagent_type: "general-purpose"` をフォールバックとして使用。

SubAgent への指示テンプレート:

```text
このリポジトリの Issue #<num> を refine しています。Issue 本文は以下:

<Issue title>
<Issue body 全文>

このリポジトリのコードベースを探索し、この Issue が「触れるべきだが現状言及されていない論点」を洗い出してください。観点:

1. 既存の類似実装はあるか（あれば踏襲すべきパターン）
2. この変更が影響する既存ファイル・モジュール
3. 依存関係（ライブラリ、他の機能）
4. データ構造の選択肢（複数の妥当な道がある場合）
5. 認証・認可の取り扱い
6. エラーハンドリング戦略
7. テスト戦略（既存テストの location、追加すべきテスト）
8. ドキュメント整合（更新が必要な docs ファイル）

各論点について、以下を返してください:
- 観点名
- Issue が言及していない理由（spec の穴 / 推測で進められる / 不要）
- 重要度（high / medium / low）
- 推奨アクション（自動補完できる / 質問が必要 / 仕様策定が必要）
```

目安として 3〜5 件返ることを期待しますが、根拠の薄い論点を水増ししない方針。論点 0 件（refine の必要なし）の場合は手順 6・7 を skip して手順 8 の完了報告に直行します。

### 6. 階層化判定

4 観点違反 + SubAgent 発見の論点を統合し、以下の対応規則で 3 階層に分類します:

| SubAgent 推奨アクション | 階層 |
| --- | --- |
| 自動補完できる | trivial |
| 質問が必要 | architectural |
| 仕様策定が必要 | critical |

加えて、以下の階層判定基準で SubAgent の推奨を上書き / 補正:

#### Trivial（自動決定可）

- このリポジトリ内に確立された慣例・パターンがある
- 業界標準の常識的な選択（例: テストファイルは `*.test.ts` 規約）
- 決定が後から低コストで覆せる
- ドキュメント参照リンクの追加など、判断不要な補完

#### Architectural（非同期確認）

- 複数の妥当な技術選択肢があり、判断が後の設計に影響する
- 決定がコードの広範囲に波及する
- 既存パターンが複数あり、どれを踏襲すべきか曖昧

#### Critical（ブロック）

- ビジネスルール・ドメイン知識が必要で、コードからは推測不能
- セキュリティ・コンプライアンス要件が未定義
- 外部仕様（API、データ形式）が未確定
- 決定を間違えると後戻りコストが致命的

判定が曖昧な論点は、**安全側（より重い階層）に倒す**。Trivial だと思って自動決定したが実は critical だった、という事故を防ぐため。

### 7. 階層別アクション実行（ゲート制御）

実行順は以下のゲート構造に従います:

```text
if critical 検出件数 > 0:
    → Critical アクションのみ実行して停止
    → Trivial / Architectural はスキップ
else:
    → Trivial アクション実行（body 更新 + 注記コメント）
    → Architectural アクション実行（質問コメント）
```

#### Critical → `needs-spec` ラベル付与 + 停止

- `needs-spec` ラベルが対象 repo に存在しなければ作成（冪等化のため `--force` 推奨）:

  ```bash
  gh label create needs-spec --repo <owner/repo> \
    --description "Issue 仕様策定が必要 (refine-issue 検出)" \
    --color FBCA04 --force
  ```

  `--force` は既存ラベル update / 不在時 create の両対応で、存在チェックが不要になります。
- `gh issue edit <num> --repo <owner/repo> --add-label needs-spec` で付与
- ブロッキング論点をコメントで明示:

  ```text
  🛑 /refine-issue: 仕様策定が必要 (`needs-spec` 付与)

  以下、決まらないと実装に進めない論点を検出しました。仕様策定後、本ラベルを外して再 refine してください:

  - ビジネスルール: <具体>
  - 外部仕様: <具体>
  - セキュリティ要件: <具体>
  ```

  `gh issue comment <num> --repo <owner/repo> --body-file <tempfile>` で投稿。
- skill はここで停止（Issue body 更新・他の階層処理はスキップ）

#### Trivial → Issue body 自動補完 + 注記コメント

Issue body 全体を破壊しないよう、以下の手順で更新します:

1. 手順 2 で取得済みの `body` をベースとする
2. 補完すべき箇所のテキストを置換または追記して新しい body 文字列を構築する
   - **原則は追記**。既存の曖昧文をそのまま残すと矛盾する場合のみ置換する
   - 既存の見出し（`## 概要` `## 受け入れ条件` 等）と順序は維持する
3. `Write` ツールで `/tmp/refine-issue-<num>.md` に新 body を書き出す
4. `gh issue edit <num> --repo <owner/repo> --body-file /tmp/refine-issue-<num>.md` で本文更新

補完内容を注記コメントで通知:

```text
🤖 /refine-issue による自動補完

以下の論点を trivial 判定で自動補完しました:

- 受け入れ条件「正しくバリデーション」→ 「RFC 5322 準拠チェック失敗時に 422 を返す」に具体化
- 参照文書 ARCHITECTURE.md へのリンクを追加
- テストファイル配置を `*.test.ts` 規約で記載

補完内容が原文意図とズレている場合は修正してください。
```

`gh issue comment <num> --repo <owner/repo> --body "<上記コメント>"` で投稿。

#### Architectural → 非同期質問コメント

Issue body は更新せず、未解決論点をコメントで投稿:

```text
❓ /refine-issue が判断つかない論点（@<assignee>）

以下、複数の妥当な選択肢があります。意図を教えてください:

1. 認証方式
   - A) JWT（既存 `lib/auth/jwt.ts` 踏襲）
   - B) Session ベース（新規実装）

2. エラーレスポンス形式
   - A) RFC 7807 problem+json
   - B) 既存の `{ error, message }` 形式

決定が出たら Issue body に追記し、再度 `/refine-issue <num>` を走らせて他の論点について refine を続けてください（注: 現状、過去コメントの自動取り込みはサポートしていません）。
```

`gh issue comment <num> --repo <owner/repo> --body-file <tempfile>` で投稿。

`@<assignee>` の解決規則:

- Issue の `assignees` フィールドを優先（複数いる場合は全員 mention）
- assignees が空なら Issue の `author` を mention
- assignee / author の login が `[bot]` で終わる場合（例: `dependabot[bot]`、`copilot-pull-request-reviewer[bot]`）はスキップして次の人間ユーザーへフォールバック
- 該当する人間ユーザーがいない場合は mention なしでコメント投稿し、stdout に警告を出す

### 8. Issue body 更新

Trivial の自動補完がある場合のみ、`gh issue edit <num> --repo <owner/repo> --body-file <tempfile>` で本文を更新（手順 7 の Trivial サブセクションで実行済み）。

**critical 検出時は body 更新しない**: 仕様未策定の状態で部分補完を残すと、refine 済みと誤認されるリスクを避けるため（手順 7 のゲート制御で保証）。

### 9. 完了報告

stdout に以下のサマリを表示:

```text
✅ /refine-issue 完了 (Issue #<num>)

- 4 観点違反検出: <件数>
- SubAgent 探索論点: <件数>
- 階層化:
  - Trivial: <件数> 件 → Issue body 自動補完 + 注記コメント投稿
  - Architectural: <件数> 件 → 非同期質問コメント投稿
  - Critical: <件数> 件 → `needs-spec` ラベル付与 + 停止

URL: <Issue URL>
```

論点 0 件の場合（手順 5 で skip 済み）:

```text
✅ /refine-issue 完了 (Issue #<num>) — refine の必要なし

- 4 観点違反検出: 0 件
- SubAgent 探索論点: 0 件

URL: <Issue URL>
```

## 重要ルール

- **判断が曖昧な論点は重い階層に倒す**: Trivial vs Architectural で迷ったら Architectural、Architectural vs Critical で迷ったら Critical。事故防止優先
- **Critical を検出したら他の階層処理を実行しない**: 手順 7 のゲート制御で保証。仕様未策定状態で部分補完を残すと「refine 済み」と誤解される
- **既存 Issue body を破壊しない**: 自動補完は原則追記、矛盾解消が必要な場合のみ置換。原文の構造（見出し・順序）は保持
- **`needs-spec` ラベルが存在しなければ作成する**: skill 内で `gh label create --repo <owner/repo> ... --force` を実行（冪等化のため `--force` 必須）
- **closed Issue は AskUserQuestion で続行確認する**: ユーザーが明示的に Yes と答えた場合のみ続行
- **クロスリポジトリ対応**: 全 `gh` コマンド（`issue view`, `issue edit`, `issue comment`, `label create`）に必ず `--repo <owner/repo>` を渡す
- **コメント投稿時は必ず Bot 識別を含める**: 「🤖 /refine-issue による...」「❓ /refine-issue が判断つかない論点（...）」「🛑 /refine-issue: 仕様策定が必要...」のようにプレフィックスを付け、人間のコメントと区別
- **mention 対象が bot の場合は skip**: assignee / author が `[bot]` suffix の場合はフォールバック規則に従う

## 使用する gh CLI コマンド一覧

保守時に CLI 仕様変更があった場合の更新ポイントを集約:

| 用途 | コマンド |
| ---- | -------- |
| Issue 取得 | `gh issue view <num> --repo <owner/repo> --json number,title,body,labels,comments,state,url,assignees,author` |
| Issue body 更新 | `gh issue edit <num> --repo <owner/repo> --body-file <tempfile>` |
| ラベル付与 | `gh issue edit <num> --repo <owner/repo> --add-label <label>` |
| ラベル作成（冪等） | `gh label create <label> --repo <owner/repo> --description "..." --color <hex> --force` |
| コメント投稿 | `gh issue comment <num> --repo <owner/repo> --body-file <tempfile>` |
| repo 確定 | `gh repo view --json nameWithOwner --jq .nameWithOwner` |

## Out of Scope（このコマンドの範囲外）

以下は別コマンド・別 issue で扱います:

- Orchestrator ループ（複数 Issue を順次 refine する `/loop` 連携）
- 司令ファイル（`.claude/orchestrator/mission.md`）+ PreCompact hook 連携
- 複数 Issue を一括 refine する batch モード
- `gh issue list --label needs-refinement` での自動対象抽出
- Architectural 質問への返信を picking up して continuation する機能（過去コメントを自動で読んで反映する機能。現状は再度 `/refine-issue` を手動実行）
- GitHub Enterprise Server (`*.ghe.com`) サポート

## 関連

- `.claude/commands/create-issue.md`: 4 観点バリデーションのベース（refine-issue は「曖昧表現排除」を「具体性」に統合し、「受け入れ条件の明示」を新規追加）
- `docs-template/MASTER.md`: 4 観点バリデーション基準の根拠
- `docs-template/PATTERNS.md`: 既存パターンとの整合
- 設計プラン: `.claude/plans/subagent-compact-compact-ethereal-tiger.md`（設計時のスナップショット。現行仕様は本ファイルが正、プランとの差異が出た場合は本ファイルを優先）
