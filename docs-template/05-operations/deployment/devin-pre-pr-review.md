# Devin Pre-PR Review System

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md) | **Workflow Step**: 5 (Self-Review) | **Related**: [セルフレビュー](./self-review.md)

## 概要

Devinの全タスクにおいて、PR作成前に自動で5つの観点からコードレビューを実行し、問題が見つかった場合は自動修復を行うシステムです。

**重要**: このシステムはDevinのネイティブAI機能を使用します。外部API（OpenAI、Anthropic等）は不要です。

### 特徴

- **5つのレビュー観点**: Security, Performance, Testing, Documentation, Business Logic
- **Devin内蔵AI使用**: 外部APIキー不要
- **自動修復ループ**: 問題が見つかった場合、自動修復を試み、再レビューを繰り返す（最大5回）
- **全タスク適用**: Devinの全タスクでPR作成前に自動実行

---

## Devin向け必須ワークフロー

### PR作成前の自動レビュー手順

**Devinは以下の手順をPR作成前に必ず実行すること:**

```
1. 変更ファイルを特定（git diff --name-only）
2. 5つの観点で各ファイルをレビュー
3. 問題があれば自動修復
4. 再レビュー（最大5回繰り返し）
5. 全パスしたらPR作成
6. レビュー結果をPR本文に含める
```

### 変更ファイルの特定

```bash
# ステージングされたファイルを確認
git diff --cached --name-only --diff-filter=ACMR

# 未ステージングの変更ファイルを確認
git diff --name-only --diff-filter=ACMR
```

---

## 5つのレビュー観点

### 1. Security Agent

セキュリティ脆弱性を検出：

- SQLインジェクション
- XSS（クロスサイトスクリプティング）
- CSRF（クロスサイトリクエストフォージェリ）
- 認証・認可の脆弱性
- 機密情報の露出（APIキー、パスワードのハードコード等）
- 安全でない暗号化（MD5、SHA1等）
- パストラバーサル
- コマンドインジェクション

### 2. Performance Agent

パフォーマンス問題を検出：

- N+1クエリ問題
- 不要なループ処理
- メモリリーク
- 非効率なアルゴリズム（O(n^2)以上の計算量）
- 不要な再レンダリング（React等）
- 大きなバンドルサイズ
- 同期処理のブロッキング
- キャッシュの未使用

### 3. Testing Agent

テスト品質を検出：

- テストカバレッジの不足
- エッジケースのテスト漏れ
- エラーハンドリングのテスト漏れ
- モックの不適切な使用
- テストの可読性
- テストの独立性
- アサーションの品質

### 4. Documentation Agent

ドキュメント品質を検出：

- 関数・クラスのdocstringの不足
- 複雑なロジックへのコメント不足
- 型ヒントの不足（Python）/ 型定義の不足（TypeScript）
- README更新の必要性
- API仕様書の更新必要性
- 変数名・関数名の明確さ

### 5. Business Logic Agent

ビジネスロジックの問題を検出：

- マジックナンバー・ハードコードされた値
- DRY原則違反（重複コード）
- 単一責任原則違反
- エラーハンドリングの不備
- 境界値チェックの不足
- 状態管理の問題
- 命名規則違反

---

## レビュー実行例

### 各観点のチェック例

**Security観点**:

```python
# NG: SQLインジェクションリスク
query = f"SELECT * FROM users WHERE id = {user_id}"

# OK: パラメータ化クエリ
query = "SELECT * FROM users WHERE id = %s"
cursor.execute(query, (user_id,))
```

**Performance観点**:

```python
# NG: N+1クエリ
for user in users:
    orders = db.query(Order).filter(Order.user_id == user.id).all()

# OK: Eager Loading
users = db.query(User).options(joinedload(User.orders)).all()
```

**Testing観点**:

```python
# NG: エッジケース未テスト
def test_divide():
    assert divide(10, 2) == 5

# OK: エッジケースを含む
def test_divide():
    assert divide(10, 2) == 5
    assert divide(0, 5) == 0
    with pytest.raises(ZeroDivisionError):
        divide(10, 0)
```

**Documentation観点**:

```python
# NG: docstring/型ヒントなし
def process(data):
    return data * 2

# OK: docstring/型ヒントあり
def process(data: int) -> int:
    """データを2倍にして返す。

    Args:
        data: 処理対象の整数値

    Returns:
        入力値の2倍
    """
    return data * 2
```

**Business Logic観点**:

```python
# NG: マジックナンバー
if user.age > 18:
    allow_access()

# OK: 名前付き定数
MINIMUM_AGE_FOR_ACCESS = 18
if user.age > MINIMUM_AGE_FOR_ACCESS:
    allow_access()
```

---

## 自動修復の仕組み

### 修復ループ

Devinは以下のループを実行:

```
iteration = 0
max_iterations = 5
issues = []

while iteration < max_iterations:
    # 1. 各ファイルを5観点でレビュー
    issues = review_all_files_from_5_perspectives()

    # 2. 問題がなければ終了
    if len(issues) == 0:
        print("全レビュー観点をパス")
        break

    # 3. 問題があれば修復
    for issue in issues:
        apply_fix(issue)

    iteration += 1

# 4. 最終確認とPR作成
if len(issues) == 0:
    create_pr_with_review_results()
else:
    print("最大反復回数に達しましたが、問題が残っています")
    report_remaining_issues_to_user(issues)
```

### 修復可能な問題の例

| 問題タイプ          | 自動修復 | 例                            |
| ------------------- | -------- | ----------------------------- |
| SQLインジェクション | 可能     | f-string → パラメータ化クエリ |
| マジックナンバー    | 可能     | 数値 → 名前付き定数           |
| 弱いハッシュ        | 可能     | MD5 → bcrypt                  |
| 未使用import        | 可能     | 削除                          |
| docstring不足       | 可能     | 自動生成                      |
| 型ヒント不足        | 可能     | 自動追加                      |

---

## Devin向け統合ガイド

### 推奨ワークフロー

Devinの全タスクで以下のワークフローを適用：

```
1. Issue確認 → Branch作成
2. コード実装
3. Lint/Type Check実行
4. **5観点レビュー実行** ← Devin内蔵AIで実行
5. 問題があれば自動修復
6. 再レビュー（最大5回繰り返し）
7. 全パスしたらPR作成
8. レビュー結果をPR本文に含める
9. CI待機
10. マージ
```

### PR本文に含めるレビュー結果テンプレート

```markdown
## セルフレビュー結果

### 実施日時

{date}

### レビュー観点

| 観点           | 結果 | 検出数 | 修正数 |
| -------------- | ---- | ------ | ------ |
| Security       | PASS | 0      | 0      |
| Performance    | PASS | 0      | 0      |
| Testing        | PASS | 0      | 0      |
| Documentation  | PASS | 1      | 1      |
| Business Logic | PASS | 2      | 2      |

### 修正内容

- docstring追加: src/utils.py:45
- マジックナンバー定数化: src/auth.py:23, src/config.py:12

### 結論

全レビュー観点をパス。PR作成準備完了。
```

---

## 注意事項

- このシステムはDevinのネイティブAI機能を使用します
- 外部API（OpenAI、Anthropic等）は不要です
- Devinが自身のAI能力でコードを分析し、問題を検出・修復します
- 最大5回の修復ループ後も問題が残る場合は、ユーザーに報告してください

---

## 関連ドキュメント

- [セルフレビュー（PR作成前）](./self-review.md)
- [自動コードレビュー](./automated-code-review.md)
- [AI駆動 Git Workflow](./git-workflow.md)
