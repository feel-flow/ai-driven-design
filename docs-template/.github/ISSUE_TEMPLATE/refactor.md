---
name: リファクタリング
about: コードの改善・リファクタリング
title: "refactor: "
labels: refactor
assignees: ""
---

## ジョブストーリー

> **[このコードを保守・拡張する]** とき、
> **[実現したいこと]** をしたい。
> その結果 **[得たい結果（保守性・テスト容易性など）]** が得られる。

## 背景

[なぜこのリファクタリングが必要か]

- [ ] コードの可読性向上
- [ ] パフォーマンス改善
- [ ] 技術的負債の解消
- [ ] テスタビリティの向上
- [ ] その他: [理由]

## 参照ドキュメント（AIへ：必ず読んでください）

> **必須参照**: ARCHITECTURE, PATTERNS

- [ ] [ARCHITECTURE.md](../../02-design/ARCHITECTURE.md)
- [ ] [PATTERNS.md](../../03-implementation/PATTERNS.md)

> **推奨参照**: TESTING

- [ ] [TESTING.md](../../04-quality/TESTING.md)

## 関連Issue

- #XX [このコードが作成された元Issue]

## 対象ファイル

- `src/path/to/file.ts`
- `src/path/to/another.ts`

## 変更方針

### Before

```typescript
// 現在のコード（問題点をコメントで明示）
```

### After

```typescript
// 改善後のイメージ
```

## 受け入れ条件（AC）

### 振る舞い（Given-When-Then）

- [ ] **Given** [既存の入力] **When** [リファクタ後の同一操作] **Then** [挙動が変わらない（既存テストがパス）]

### Definition of Done

- [ ] 既存のテストがすべてパスする（振る舞い不変）
- [ ] 新しいコードが PATTERNS.md に準拠している
- [ ] lint エラーなし

## スコープ外（今回は参照不要）

> **通常不要**: DOMAIN（機能変更なし）

- DOMAIN.md（ビジネスロジックの変更なし）
- DEPLOYMENT.md（デプロイ設定の変更なし）

## リスク

[リファクタリングによる影響範囲・リスクがあれば]
