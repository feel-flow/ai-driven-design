# GitHub Copilot Custom Agents

AI仕様駆動開発向けのカスタムエージェントテンプレート集。

## エージェント一覧

| Agent                | ファイル                        | 役割                     |
| -------------------- | ------------------------------- | ------------------------ |
| Code Reviewer        | `code-reviewer.agent.md`        | ガイドライン準拠チェック |
| Error Handler Hunter | `error-handler-hunter.agent.md` | サイレントエラー検出     |
| Test Analyzer        | `test-analyzer.agent.md`        | テスト品質分析           |
| Code Simplifier      | `code-simplifier.agent.md`      | 不要な複雑性の検出       |
| Comment Analyzer     | `comment-analyzer.agent.md`     | コメント正確性チェック   |
| Type Design Analyzer | `type-design-analyzer.agent.md` | 型設計品質分析           |

## 使い方

GitHub Copilot Chat で `@agent-name` を指定して呼び出す。
エージェント名は `<name>.agent.md` のファイル名から `<name>` 部分が `@<name>` として利用可能になる。

```text
@code-reviewer このPRのコードをレビューして
@error-handler-hunter catch ブロックのエラーハンドリングを確認して
@test-analyzer テストの網羅性を分析して
```

## Skills vs Agents 使い分けガイド

### Skills（`.github/skills/`）

| 特性       | 内容                                                                          |
| ---------- | ----------------------------------------------------------------------------- |
| トリガー   | description マッチングに基づいてコンテキストとして**自動**注入                |
| 対応ツール | GitHub Copilot ネイティブ（同等の内容を Claude Code / Cursor 向けに変換可能） |
| 適した用途 | 手続き的タスク、標準化されたパターンの適用                                    |
| 例         | コーディング規約の適用、エラーハンドリングパターンの適用                      |

### Agents（`.github/agents/`）

| 特性       | 内容                                         |
| ---------- | -------------------------------------------- |
| トリガー   | `@name` で**明示的**に呼び出し               |
| 対応ツール | GitHub Copilot **専用**                      |
| 適した用途 | 分析・判断系のタスク、複数観点からの総合評価 |
| 例         | コードレビュー、テスト品質分析、型設計評価   |

### 判断フローチャート

```text
タスクを実装したい
  │
  ├─ パターン適用・標準化系？ ──→ Skill で実装
  │   例: 命名規則の適用、テスト構造の標準化
  │
  ├─ 分析・判断・評価系？ ──→ Agent で実装
  │   例: コードレビュー、品質分析、設計評価
  │
  └─ 迷ったら？
      └─ まず Skill で実装を試みる
         → Skill では表現できない場合のみ Agent に昇格
```

### 原則

1. **まず Skill で実装** — Skill は自動注入されるため汎用性が高く、他ツール向けに変換もしやすい
2. **Skill で表現できない場合のみ Agent** — 明示的な呼び出しが必要な分析・判断タスクは Agent が適切
3. **Skill と Agent は補完関係** — 同じ領域で Skill（パターン適用）と Agent（品質分析）を組み合わせる

### 対応表: Skills ↔ Agents

| 領域         | Skill（パターン適用）      | Agent（品質分析）      |
| ------------ | -------------------------- | ---------------------- |
| コード品質   | `code-review-standards`    | `code-reviewer`        |
| エラー処理   | `error-handling-standards` | `error-handler-hunter` |
| テスト       | `test-patterns`            | `test-analyzer`        |
| コード簡素化 | —                          | `code-simplifier`      |
| コメント     | —                          | `comment-analyzer`     |
| 型設計       | —                          | `type-design-analyzer` |

## カスタマイズ

各 `.agent.md` はテンプレートです。プロジェクト固有の要件に合わせて以下をカスタマイズしてください:

- **チェック観点**: プロジェクト固有のルールを追加
- **出力フォーマット**: チームのレビュープロセスに合わせて調整
- **参照ドキュメント**: プロジェクトの実際のドキュメントパスに変更
- **評価基準**: プロジェクトの品質基準に合わせて閾値を調整
