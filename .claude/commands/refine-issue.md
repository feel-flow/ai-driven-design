# /refine-issue — 既存 Issue の仕様曖昧さを検出・refine

既存の GitHub Issue を入力として、`/create-issue` と同じ 4 観点で受け入れ条件をバリデーションし、コードベース探索によって「Issue が触れていない論点」を洗い出します。検出した曖昧さは trivial / architectural / critical の 3 階層に分類し、階層に応じて Issue body 更新・コメント投稿・ラベル付与のいずれかを実行します。

`/create-issue` が「新規 Issue を作る前のゲート」なのに対し、`/refine-issue` は「既に立った曖昧 Issue を事後に磨く」役割を担います。

## 前提

- プロジェクトに `docs/` または `docs-template/` 配下のコア 7 文書が存在すること
- GitHub リポジトリが設定され、`gh` CLI で対象 Issue にアクセスできること
- 入力として既存 Issue 番号（または URL）が与えられること

## 引数

```
/refine-issue <issue-number-or-url>
```

例:
- `/refine-issue 123`
- `/refine-issue https://github.com/owner/repo/issues/123`
- `/refine-issue feel-flow/feelflow-id-platform#2615`（クロスリポジトリ）

## 手順

### 1. 入力検証

引数から Issue 番号と repo を確定します。引数なし・無効な番号の場合はエラー表示して停止。

```bash
# 番号のみ → 現在の repo を使用
# URL / owner/repo#N 形式 → そこから repo を抽出
gh issue view <num> --repo <owner/repo> --json number,title,body,labels,comments,state,url
```

`state` が `closed` の場合は警告を出して続行確認（誤って closed Issue を refine してしまうのを防ぐ）。

### 2. 参照文書の自動提案

Issue body の内容から、関連しそうな参照文書を提案します（`/create-issue` 同様）:

| 内容のキーワード | 必須参照 | 推奨参照 |
| ---- | -------- | -------- |
| 機能追加・新規 API | MASTER, ARCHITECTURE, DOMAIN | PATTERNS, TESTING |
| バグ・不具合 | 関連 Issue, PATTERNS | TESTING |
| リファクタリング | ARCHITECTURE, PATTERNS | TESTING |
| インフラ・デプロイ | MASTER, DEPLOYMENT | ARCHITECTURE |
| ドキュメント | MASTER | 更新対象文書 |

判定が難しい場合はユーザーに確認します。

### 3. 4 観点バリデーション（`/create-issue` 由来の共通核）

取得した Issue body を以下 4 観点で検証します:

- [ ] **具体性**: 「適切に」「正しく」「きちんと」「いい感じに」等の曖昧語が含まれていないか
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

### 4. コードベース探索 SubAgent

`Agent` ツール（`subagent_type: Explore`）を使い、Issue が触れていない論点を洗い出します。SubAgent を使うことで親 context を保護し、長い探索結果が flood しても親が太らないようにします（compact 耐性向上）。

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

SubAgent は最低 1 件、可能なら 3〜5 件の論点を返します。

### 5. 階層化判定

4 観点違反 + SubAgent 発見の論点を統合し、以下の基準で 3 階層に分類します。

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

### 6. 階層別アクション実行

#### Trivial → Issue body 自動補完 + 注記コメント

- 受け入れ条件を具体化、参照文書リンク追加、曖昧語を改善案で置換
- `gh issue edit <num> --body-file <tempfile>` で本文更新
- 補完内容をコメントで通知:

  ```text
  🤖 /refine-issue による自動補完

  以下の論点を trivial 判定で自動補完しました:

  - 受け入れ条件「正しくバリデーション」→ 「RFC 5322 準拠チェック失敗時に 422 を返す」に具体化
  - 参照文書 ARCHITECTURE.md へのリンクを追加
  - テストファイル配置を `*.test.ts` 規約で記載

  問題があれば修正してください。
  ```

#### Architectural → 非同期質問コメント

- Issue body は更新せず、未解決論点をコメントで投稿:

  ```text
  ❓ /refine-issue が判断つかない論点（@<owner>）

  以下、複数の妥当な選択肢があります。意図を教えてください:

  1. 認証方式
     - A) JWT（既存 `lib/auth/jwt.ts` 踏襲）
     - B) Session ベース（新規実装）

  2. エラーレスポンス形式
     - A) RFC 7807 problem+json
     - B) 既存の `{ error, message }` 形式

  決定後、本コメントに返信してください。再度 `/refine-issue <num>` を走らせると、回答を踏まえて refine が進みます。
  ```

- `@<owner>` は Issue の assignee、なければ作成者を mention

#### Critical → `needs-spec` ラベル付与 + 停止

- `needs-spec` ラベルが repo に存在しなければ `gh label create needs-spec --description "Issue 仕様策定が必要 (refine-issue 検出)" --color FBCA04` で作成
- `gh issue edit <num> --add-label needs-spec` で付与
- ブロッキング論点をコメントで明示:

  ```text
  🛑 /refine-issue: 仕様策定が必要 (`needs-spec` 付与)

  以下、決まらないと実装に進めない論点を検出しました。仕様策定後、本ラベルを外して再 refine してください:

  - ビジネスルール: <具体>
  - 外部仕様: <具体>
  - セキュリティ要件: <具体>
  ```

- skill はここで停止（Issue body 更新・他の階層処理はスキップ）

### 7. Issue body 更新

Trivial の自動補完がある場合のみ、`gh issue edit` で本文を更新。**critical 検出時は body 更新しない**（仕様未策定の状態で部分補完を残すと、refine 済みと誤認されるリスクを避ける）。

### 8. 完了報告

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

## 重要ルール

- **判断が曖昧な論点は重い階層に倒す**: Trivial vs Architectural で迷ったら Architectural、Architectural vs Critical で迷ったら Critical。事故防止優先
- **Critical を検出したら他の階層処理を実行しない**: 仕様未策定状態で部分補完を残すと「refine 済み」と誤解される
- **既存 Issue body を破壊しない**: 自動補完は追記または既存テキストの「改善案による置換」に留め、原文の構造（見出し・順序）は保持
- **`needs-spec` ラベルが存在しなければ作成する**: skill 内で `gh label create` を実行
- **closed Issue は refine しない**: 状態確認で警告し、ユーザー確認なしには進めない
- **クロスリポジトリ対応**: `--repo owner/name` 指定で別 repo の Issue も refine 可能
- **コメント投稿時は必ず Bot 識別を含める**: 「🤖 /refine-issue による...」のようにプレフィックスを付け、人間のコメントと区別

## Out of Scope（このコマンドの範囲外）

以下は別コマンド・別 issue で扱います:

- Orchestrator ループ（複数 Issue を順次 refine する `/loop` 連携）
- 司令ファイル（`.claude/orchestrator/mission.md`）+ PreCompact hook 連携
- 複数 Issue を一括 refine する batch モード
- `gh issue list --label needs-refinement` での自動対象抽出
- Architectural 質問への返信を picking up して continuation する機能（現状は再度 `/refine-issue` を手動実行）

## 関連

- `.claude/commands/create-issue.md`: 4 観点バリデーションの再利用元
- `docs-template/MASTER.md`: 4 観点バリデーション基準の根拠
- `docs-template/PATTERNS.md`: 既存パターンとの整合
- 設計プラン: `.claude/plans/subagent-compact-compact-ethereal-tiger.md`
