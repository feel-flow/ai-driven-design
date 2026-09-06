---
title: "DEPENDENCY_LINT"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "2026-04-27"
updated: "2026-04-27"
---

# Layer 3: 依存方向 lint ガイド（言語依存）

> **Layer 3 は言語依存です。**
> Layer 1（Decision Tree）/ Layer 2（雛形コピー運用）は言語非依存だが、本ガイドは言語ごとの lint ツール設定に踏み込む。

## 1. 目的と適用方針

- 目的は「教条的に完全分離を強制すること」ではなく、**境界違反だけを機械的に止めること**
- 境界違反を CI / pre-commit で自動検知し、レビュー前に早期フィードバックする
- 既知の負債は削除せず `ignore_imports` などで明示し、改善進捗を可視化する

## 2. Layer 1（Decision Tree）との対応

Layer 1 の Q1〜Q6 は「配置判断」、Layer 3 は「依存方向の検証」である。運用上は次のように対応付ける。

| Decision Tree 分岐      | 典型ディレクトリ   | 推奨レイヤー名（lint 設定で使用） | 依存許可の原則                                  |
| ----------------------- | ------------------ | --------------------------------- | ----------------------------------------------- |
| Q1 外部システム通信     | `infrastructure/*` | `adapters`                        | `application` / `domain` に依存可。逆方向は禁止 |
| Q2 リクエスト入口       | `interfaces/*`     | `interfaces`                      | `application` 呼び出しのみ許可                  |
| Q3 オーケストレーション | `application/*`    | `application`                     | `domain` とポート（抽象）に依存可               |
| Q4 永続化・状態保持     | `infrastructure/*` | `adapters`                        | Q1 と同様。実装詳細は内向き禁止                 |
| Q5 ドメインモデル       | `domain/*`         | `domain`                          | 内部完結（他レイヤー参照禁止）                  |
| Q6 横断関心事           | `shared/*`         | `shared`                          | 最小限の共通依存のみ許可                        |

> 例: Q1 で「外部 API クライアント」と判定したモジュールは `layer="adapters"` として扱い、`domain -> adapters` の import を禁止する。

## 3. 言語別ツール選定基準

| 言語                    | 第一候補                          | 代替候補                   | 選定基準                                                      |
| ----------------------- | --------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Python                  | `import-linter`                   | `ruff` + custom rule       | 契約ベースで依存方向を定義しやすい。`ignore_imports` が明示的 |
| TypeScript / JavaScript | `dependency-cruiser`              | `eslint-plugin-boundaries` | 依存グラフ可視化とルール化を両立。モノレポでも扱いやすい      |
| Go                      | `depguard`（golangci-lint）       | `go-cleanarch`             | CI への統合が容易。パッケージ境界の禁止ルールを定義可能       |
| Rust                    | `cargo-deps` + custom clippy lint | `cargo-deny` + script      | 依存グラフ可視化と境界違反検知を分離して実装しやすい          |

選定時は以下を比較する:

- ルールをコードレビューで読めるか（宣言的設定であるか）
- 例外（技術的負債）を明示記録できるか
- ローカル pre-commit と CI の両方に同じ設定を流用できるか

## 4. 技術的負債ホワイトリスト化（削除ではなく可視化）

### 原則

- 既知違反を `ignore_*` 設定に記録し、**理由・期限・Issue 番号**をコメントで残す
- 例外件数をメトリクス化し、減少を改善指標とする
- 例外を増やす PR では「なぜ必要か」を明記する

### 例: import-linter（Python）

```ini
[importlinter:contract:domain-does-not-import-adapters]
name = Domain must not import adapters
type = forbidden
source_modules =
    myapp.domain
forbidden_modules =
    myapp.infrastructure
ignore_imports =
    myapp.domain.legacy -> myapp.infrastructure.payment_gateway  # TODO(#999): 2026-Q3 までに除去
```

### 例: dependency-cruiser（TypeScript）

```json
{
  "forbidden": [
    {
      "name": "domain-cannot-import-adapters",
      "from": { "path": "^src/domain" },
      "to": { "path": "^src/infrastructure" }
    }
  ],
  "options": {
    "allowedSeverity": "warn"
  }
}
```

> 導入初期は `warn` でもよいが、CI で確実に止める段階では `error` に昇格する。
> 既知違反は `forbidden` を消すのではなく、`allowed` 例外（TS）や `ignore_imports`（Python）で管理し、コメントで追跡する。

## 5. CI / pre-commit への組み込み例

> 以下はサンプル。ブランチ名、ランタイムバージョン、パッケージマネージャは各プロジェクト標準に置き換えること。

### 5.1 GitHub Actions 例（言語別ジョブ）

```yaml
name: dependency-direction-lint

on:
  pull_request:
  push:
    branches: [main, develop]

jobs:
  lint-python-imports:
    if: ${{ hashFiles('**/pyproject.toml') != '' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install import-linter
      - run: lint-imports

  lint-ts-imports:
    if: ${{ hashFiles('**/package.json') != '' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - run: npm ci
      - run: npx depcruise --config .dependency-cruiser.cjs src
```

### 5.2 pre-commit 例

```yaml
repos:
  - repo: local
    hooks:
      - id: lint-imports-python
        name: lint-imports-python
        entry: lint-imports
        language: system
        pass_filenames: false
      - id: lint-imports-ts
        name: lint-imports-ts
        entry: npx depcruise --config .dependency-cruiser.cjs src
        language: system
        pass_filenames: false
```

## 6. 導入手順（最小）

1. Decision Tree の末端分岐（Q1〜Q6）を自プロジェクトの実ディレクトリへ確定
2. 上記対応表に沿って lint レイヤー名を定義
3. 言語別ツールを 1 つ選び、依存方向の禁止ルールを 2〜3 本から開始
4. 既知違反は `ignore_*` にコメント付きで登録
5. pre-commit と CI に同じコマンドを接続

## 7. 運用ルール

- ルール追加時: まず `warn` で導入し、違反解消後に `error` へ昇格
- 例外追加時: 期限と削除条件を必ず付与
- 月次レビュー: `ignore_*` 行数と違反件数を確認し、減少目標を更新

## Changelog

### [1.0.0] - 2026-04-27

#### 追加

- Layer 3（依存方向 lint）の言語別ガイドを追加
- Decision Tree 分岐と lint レイヤー対応を定義
- 技術的負債ホワイトリスト運用と CI / pre-commit 例を追加
