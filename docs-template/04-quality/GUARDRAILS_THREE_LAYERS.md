---
title: "GUARDRAILS_THREE_LAYERS"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# ガードレール3層構造（品質・仕様の統合ガイド）

本書は、仕様・自動化・人間レビューを組み合わせた**3層ガードレール**の役割分担を1文書にまとめる。AIツールと人間が同じ前提で「どこで何を止めるか」を共有するためのSSOTとする。

## 3層の概要

| 層    | 役割                                                                        | 主な実装・参照先                                                                                                                                                                          |
| ----- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 第1層 | **仕様による制約** — 設計・実装ルールを文書化し、生成・変更の前提を固定する | [ARCHITECTURE.md](../02-design/ARCHITECTURE.md)、[PATTERNS.md](../03-implementation/PATTERNS.md)、[DOMAIN.md](../02-design/DOMAIN.md)                                                     |
| 第2層 | **自動チェック** — 仕様違反やリグレッションをマージ前に機械的に検知する     | CI/CD（lint、型検査、単体・統合・E2E、セキュリティスキャン等）。詳細は [DEPLOYMENT.md](../05-operations/DEPLOYMENT.md) および [deployment/ci-cd.md](../05-operations/deployment/ci-cd.md) |
| 第3層 | **人間によるレビュー** — 文書化しきれない文脈・悪意・運用判断をカバーする   | PR レビュー、[セキュリティレビューチェックリスト](./SECURITY_REVIEW_CHECKLIST.md)、チーム合意事項                                                                                         |

## 層ごとの期待動作

### 第1層: 仕様による制約

- アーキテクチャ上の境界（モジュール、データフロー、信頼境界）を [ARCHITECTURE.md](../02-design/ARCHITECTURE.md) に書く。
- コーディング規約・禁止事項・パターンは [PATTERNS.md](../03-implementation/PATTERNS.md) に集約する。
- ビジネス不変条件は [DOMAIN.md](../02-design/DOMAIN.md) に残し、テスト観点と突き合わせる。

AIはコード生成前に MASTER → 上記の順で読み、**推測で埋めない**（不明点は確認プロトコルに従う）。

### 第2層: 自動チェック

- 最低限: 静的解析、テスト（方針は [TESTING.md](./TESTING.md)）、依存関係の脆弱性スキャン。
- セキュリティ観点の網羅はチェックリスト（第3層と併用）で補完し、可能な項目はCIに落とし込む。

### 第3層: 人間によるレビュー

- PRでは「仕様に書かれているか」「自動チェックの死角がないか」を確認する。
- セキュリティに触れる変更では [SECURITY_REVIEW_CHECKLIST.md](./SECURITY_REVIEW_CHECKLIST.md) を必須にする運用を推奨する。

## 関連ドキュメント

- [TESTING.md](./TESTING.md) — テストピラミッドと比率の目安
- [VALIDATION.md](./VALIDATION.md) — 検証・品質ゲート（プロジェクトで利用している場合）

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成（書籍第14章「品質・セキュリティ・責任の所在」に基づく3層の統合記述）
