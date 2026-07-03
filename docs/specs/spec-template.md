---
specId: ASDD-REPLACE-000
title: タイトルを記入
owners:
  - github: your-handle
status: draft
version: 0.1.0
lastUpdated: 2025-10-22
tags: []
links:
  issues: []
  prs: []
  docs: []
summary: >-
  1〜2文で仕様の意図（解決したい問題 / 価値）
riskLevel: low
impact: >-
  ビジネス/開発/運用への影響サマリ
metrics:
  success:
    - 指標例: adoption rate >= 60%
  guardrails:
    - 指標例: error rate < 1%
visibility: public
---

## 背景 / Context

なぜこの仕様が必要か。現状課題、制約、前提、非ゴール。

## 目的 / Goals

- 達成したい具体目標
- …

## 非ゴール / Non-Goals

- 対象外領域を明確化

## スコープ / Scope

含まれる機能・コンポーネント・対象データ範囲。

## 要件 / Requirements

### 機能要件

| ID   | 要件 | 優先度 |
| ---- | ---- | ------ |
| FR-1 |      | Must   |

### 非機能要件

| 区分 | 要件 | 指標       |
| ---- | ---- | ---------- |
| 性能 |      | p95 <200ms |

## 設計概要 / Design Overview

高レベルアーキテクチャ、主要フロー、影響範囲。

## 詳細仕様 / Detailed Spec

### データモデル

### インターフェース

### 処理フロー

## セキュリティ / Security

脅威と対策（STRIDE簡易、入力検証、認証/認可、秘密管理）。

## リスク / Risks

| リスク | 影響 | 緩和策 |
| ------ | ---- | ------ |
|        |      |        |

## 代替案 / Alternatives

検討したが採用しなかった案と理由。

## 移行 / Migration Plan

段階的リリース、ロールバック方針、データ移行。

## 計測 / Observability

ログ、メトリクス、トレース、アラート条件。

## 状態遷移 / Lifecycle

| 状態         | 説明       | 次状態       |
| ------------ | ---------- | ------------ |
| draft        | 作成初期   | review       |
| review       | レビュー中 | approved     |
| approved     | 合意済     | implementing |
| implementing | 実装進行   | done         |
| done         | 完了運用中 | deprecated   |
| deprecated   | 廃止予定   | -            |

## 依存関係 / Dependencies

他仕様・外部サービス・ライブラリ。

## Open Questions

- 問題: 対応方針(期限)

## 変更履歴 / Changelog

| 日付       | 版    | 変更 | 担当        |
| ---------- | ----- | ---- | ----------- |
| 2025-10-22 | 0.1.0 | 初稿 | your-handle |
