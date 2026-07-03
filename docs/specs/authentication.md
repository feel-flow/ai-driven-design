---
specId: ASDD-AUTH-001
title: 認証基盤MVP
owners:
  - github: your-handle
status: draft
version: 0.1.0
lastUpdated: 2025-10-22
tags: [mvp, security, auth]
links:
  issues: []
  prs: []
  docs:
    - docs/02-design/ARCHITECTURE.md
summary: >-
  初期段階で必要最小限のJWTベース認証とロール管理を提供し、他仕様の拡張余地を確保する。
riskLevel: medium
impact: >-
  プロジェクト内の保護対象リソースへ統一的・拡張可能な認証/認可基盤を提供。
metrics:
  success:
    - login_success_rate >= 98%
  guardrails:
    - auth_latency_p95 < 150ms
visibility: public
---

## 背景 / Context

現状ドキュメントのみでアプリ実装は未着手。今後の機能仕様（ユーザ管理、監査ログ、権限制御）の前提となる基盤が必要。

## 目的 / Goals

- JWT署名と検証の標準化
- シンプルなRBAC最小ロール: `viewer`, `editor`, `admin`
- リフレッシュトークンによる再認証負荷軽減（MVPではDB保持せず署名+失効時間）

## 非ゴール / Non-Goals

- SSO (OIDC / SAML)
- 多要素認証 (MFA)
- 組織・テナント分離

## スコープ / Scope

- アクセストークン(短寿命)発行/検証
- リフレッシュトークン(中寿命)更新フロー
- ロール含むクレーム定義

## 要件 / Requirements

### 機能要件

| ID        | 要件                                     | 優先度 |
| --------- | ---------------------------------------- | ------ |
| FR-AUTH-1 | アクセストークンをHS256で署名            | Must   |
| FR-AUTH-2 | リフレッシュトークン再発行エンドポイント | Must   |
| FR-AUTH-3 | 3種ロール付与と検証                      | Must   |
| FR-AUTH-4 | 署名鍵を環境変数から安全に読み込む       | Must   |
| FR-AUTH-5 | 失効後のアクセス拒否                     | Must   |

### 非機能要件

| 区分         | 要件        | 指標           |
| ------------ | ----------- | -------------- |
| 性能         | 認証API p95 | <150ms         |
| 可観測性     | 失敗率計測  | error rate <1% |
| セキュリティ | 鍵露出防止  | envのみ        |

## 設計概要 / Design Overview

API層でヘッダ `Authorization: Bearer <token>` を検証。ロールはクレーム `roles`。失効時間(例: access 900s, refresh 7d) は今後定数化。鍵ローテ計画は後続spec。

## 詳細仕様 / Detailed Spec

### データモデル

クレーム例:

```
{
  "sub": "user-uuid",
  "roles": ["viewer"],
  "iat": 1730000000,
  "exp": 1730000900
}
```

### フロー

1. 認証リクエスト（資格情報 or 後続仕様）
2. アクセス+リフレッシュトークン発行
3. アクセス失効→リフレッシュ送信→新規発行

## セキュリティ / Security

- HS256署名鍵は最低32バイト
- ブルートフォース防止: レート制限（別spec予定）
- JWTヘッダ alg 混在検知 (none攻撃阻止)

## リスク / Risks

| リスク               | 影響           | 緩和策                    |
| -------------------- | -------------- | ------------------------- |
| 鍵漏洩               | 全トークン偽造 | 環境分離 + ローテspec追加 |
| リフレッシュ長期盗難 | 不正継続利用   | 失効短縮 / 失効リスト後続 |

## 代替案 / Alternatives

- RSA署名: 将来のキーローテ/公開検証容易性で検討余地

## 移行 / Migration Plan

MVP後: 失効リスト + ローテ追加 → OIDC対応spec派生。

## 計測 / Observability

メトリクス: `auth_login_success_total`, `auth_login_failure_total`, `auth_token_refresh_total`。

## 状態遷移 / Lifecycle

初稿(draft) → レビュー(review)後に暗号強度補足 → approved。

## 依存関係 / Dependencies

- 追補予定: rate limiting spec

## Open Questions

- リフレッシュ無効化戦略（ブラックリスト or ローテ）
- ロール階層化要否

## 変更履歴 / Changelog

| 日付       | 版    | 変更 | 担当        |
| ---------- | ----- | ---- | ----------- |
| 2025-10-22 | 0.1.0 | 初稿 | your-handle |
