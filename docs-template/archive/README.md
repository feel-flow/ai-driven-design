# Archive Index

このディレクトリは、`docs-template/` 配下から退避した文書のアーカイブ先です。退避判定・手順・リダイレクト管理ルールは [`../05-operations/organizational-rollout/archive-strategy.md`](../05-operations/organizational-rollout/archive-strategy.md) を SSOT とします。

## ディレクトリ構成

年単位サブディレクトリで整理してください。

```text
archive/
├── README.md          # 本ファイル（索引）
├── 2025/
│   └── OLD_AUTH_DESIGN.md
└── 2026/
    └── OLD_DEPLOYMENT.md
```

## アーカイブ済み文書一覧

退避時に **1 行 = 1 文書 + アーカイブ理由 + 後継文書リンク** で追記してください。

| 退避日     | 退避先                    | 元ファイル                     | 退避理由         | 後継文書                                          |
| ---------- | ------------------------- | ------------------------------ | ---------------- | ------------------------------------------------- |
| YYYY-MM-DD | `2026/OLD_AUTH_DESIGN.md` | `02-design/OLD_AUTH_DESIGN.md` | JWT へ移行のため | [`PATTERNS.md`](../03-implementation/PATTERNS.md) |

> 上記の表は雛形です。実際にアーカイブ運用を始める際に、ヘッダー行はそのままで雛形行を実エントリで置き換えてください。アーカイブ前に `archive-strategy.md` の判定フロー（6 ヶ月参照なし／陳腐化／統合済み／PoC 完了）に該当することを確認してください。
