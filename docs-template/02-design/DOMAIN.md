---
title: "DOMAIN"
version: "1.0.0"
status: "draft"
owner: "@your-github-handle"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
---

# DOMAIN.md - ドメインモデル設計書

## 1. ドメイン概要

### ビジネスドメイン

[ビジネスドメインの説明]

### コアドメイン

[最も重要な価値を提供するドメイン領域]

### サブドメイン

- **[サブドメイン1]**: [説明]
- **[サブドメイン2]**: [説明]
- **[サブドメイン3]**: [説明]

## 2. 境界づけられたコンテキスト

### コンテキストマップ

```
[コンテキスト間の関係を図示]
```

### 各コンテキストの定義

| コンテキスト名  | 責務   | チーム   | 統合方式 |
| --------------- | ------ | -------- | -------- |
| [コンテキスト1] | [責務] | [チーム] | [方式]   |
| [コンテキスト2] | [責務] | [チーム] | [方式]   |

## 3. エンティティ定義

### コアエンティティ

```typescript
// 例: ユーザーエンティティ
interface User {
  id: UserId;
  email: Email;
  profile: UserProfile;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

### エンティティ一覧

| エンティティ名  | 識別子 | ライフサイクル | 不変条件 |
| --------------- | ------ | -------------- | -------- |
| [エンティティ1] | [ID型] | [説明]         | [条件]   |
| [エンティティ2] | [ID型] | [説明]         | [条件]   |

## 4. 値オブジェクト

### 主要な値オブジェクト

```typescript
// 例: メールアドレス値オブジェクト
class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new InvalidEmailError(value);
    }
    this.value = value;
  }

  private isValid(value: string): boolean {
    // バリデーションロジック
  }
}
```

### 値オブジェクト一覧

| 名前              | 型   | 制約   | 使用箇所       |
| ----------------- | ---- | ------ | -------------- |
| [値オブジェクト1] | [型] | [制約] | [エンティティ] |
| [値オブジェクト2] | [型] | [制約] | [エンティティ] |

## 5. 集約

### 集約の境界

```
[集約の境界を図示]
```

### 集約ルート

| 集約ルート    | 含まれるエンティティ | トランザクション境界 |
| ------------- | -------------------- | -------------------- |
| [集約ルート1] | [エンティティリスト] | [説明]               |
| [集約ルート2] | [エンティティリスト] | [説明]               |

## 6. ドメインサービス

### サービス定義

```typescript
// 例: 価格計算サービス
interface PricingService {
  calculatePrice(items: Item[], discounts: Discount[]): Price;
  applyTax(price: Price, location: Location): Price;
}
```

### サービス一覧

| サービス名  | 責務   | 依存関係 |
| ----------- | ------ | -------- |
| [サービス1] | [責務] | [依存]   |
| [サービス2] | [責務] | [依存]   |

## 7. ドメインイベント

### イベント定義

```typescript
// 例: 注文確定イベント
interface OrderConfirmed {
  orderId: OrderId;
  customerId: CustomerId;
  totalAmount: Money;
  confirmedAt: Date;
}
```

### イベント一覧

| イベント名  | トリガー       | ハンドラー   | データ   |
| ----------- | -------------- | ------------ | -------- |
| [イベント1] | [トリガー条件] | [ハンドラー] | [データ] |
| [イベント2] | [トリガー条件] | [ハンドラー] | [データ] |

## 8. ビジネスルール

### 不変条件

1. **[ルール名1]**: [ルールの説明]
2. **[ルール名2]**: [ルールの説明]
3. **[ルール名3]**: [ルールの説明]

### ビジネス制約

```typescript
// 例: 在庫管理ルール
class InventoryRule {
  static canReserve(item: Item, quantity: number): boolean {
    return item.availableStock >= quantity;
  }

  static minimumStock(category: Category): number {
    // カテゴリ別の最小在庫数
  }
}
```

## 9. リポジトリインターフェース

### リポジトリ定義

```typescript
// 例: ユーザーリポジトリ
interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}
```

### リポジトリ一覧

| リポジトリ名  | 対象集約 | 主要メソッド |
| ------------- | -------- | ------------ |
| [リポジトリ1] | [集約]   | [メソッド]   |
| [リポジトリ2] | [集約]   | [メソッド]   |

## 10. ユビキタス言語

### 用語集

| 用語    | 定義   | 文脈       | 例   |
| ------- | ------ | ---------- | ---- |
| [用語1] | [定義] | [使用文脈] | [例] |
| [用語2] | [定義] | [使用文脈] | [例] |
| [用語3] | [定義] | [使用文脈] | [例] |

### 命名規則

- **エンティティ**: [命名パターン]
- **値オブジェクト**: [命名パターン]
- **イベント**: [命名パターン]
- **サービス**: [命名パターン]

## 11. ドメインの進化

### 将来の拡張点

- [拡張可能性1]
- [拡張可能性2]

### リファクタリング計画

| 対象    | 現状の問題 | 改善案   | 優先度   |
| ------- | ---------- | -------- | -------- |
| [対象1] | [問題]     | [改善案] | 高/中/低 |

## Changelog

### [1.0.0] - YYYY-MM-DD

#### 追加

- 初版作成
