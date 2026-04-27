# VALIDATION.md - 検証・品質保証ガイド

## 1. 検証戦略

### 検証レベル

| レベル             | 対象             | 検証方法             | タイミング   |
| ------------------ | ---------------- | -------------------- | ------------ |
| L1: 入力検証       | ユーザー入力     | バリデーションルール | リアルタイム |
| L2: ビジネスルール | ドメインロジック | ドメイン検証         | 処理前       |
| L3: データ整合性   | データベース     | 制約・トリガー       | 永続化時     |
| L4: システム検証   | システム全体     | 監視・アラート       | 常時         |

## 2. 入力検証

### バリデーションスキーマ（Zod）

```typescript
import { z } from "zod";

// ユーザー登録スキーマ
const userRegistrationSchema = z.object({
  email: z
    .string()
    .email("有効なメールアドレスを入力してください")
    .max(255, "メールアドレスは255文字以内で入力してください"),

  password: z
    .string()
    .min(8, "パスワードは8文字以上必要です")
    .max(100, "パスワードは100文字以内で入力してください")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "パスワードは大文字、小文字、数字、特殊文字を含む必要があります",
    ),

  name: z
    .string()
    .min(1, "名前は必須です")
    .max(100, "名前は100文字以内で入力してください")
    .regex(
      /^[a-zA-Z\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/,
      "不正な文字が含まれています",
    ),

  age: z
    .number()
    .int("年齢は整数で入力してください")
    .min(0, "年齢は0以上である必要があります")
    .max(150, "有効な年齢を入力してください"),

  terms: z
    .boolean()
    .refine((val) => val === true, "利用規約への同意が必要です"),
});

// 使用例
function validateUserRegistration(data: unknown) {
  try {
    const validatedData = userRegistrationSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}
```

### カスタムバリデーター

```typescript
// 複合バリデーション
class ValidationRules {
  // メールアドレスの重複チェック
  static async isUniqueEmail(email: string): Promise<boolean> {
    const existing = await userRepository.findByEmail(email);
    return !existing;
  }

  // パスワード強度チェック
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push("パスワードは8文字以上にしてください");

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push("小文字を含めてください");

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push("大文字を含めてください");

    if (/\d/.test(password)) score += 1;
    else feedback.push("数字を含めてください");

    if (/[@$!%*?&]/.test(password)) score += 1;
    else feedback.push("特殊文字を含めてください");

    return { score: Math.min(score, 5), feedback };
  }

  // 日付範囲チェック
  static isValidDateRange(startDate: Date, endDate: Date): boolean {
    return startDate <= endDate;
  }

  // クレジットカード番号検証（Luhnアルゴリズム）
  static isValidCreditCard(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, "");

    if (digits.length < 13 || digits.length > 19) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }
}
```

## 3. ビジネスルール検証

### ドメイン検証

```typescript
// ドメインエンティティでの検証
class Order {
  private items: OrderItem[] = [];
  private status: OrderStatus;

  addItem(product: Product, quantity: number): void {
    // ビジネスルール検証
    this.validateCanAddItem(product, quantity);

    const item = new OrderItem(product, quantity);
    this.items.push(item);
  }

  private validateCanAddItem(product: Product, quantity: number): void {
    // 在庫チェック
    if (product.stock < quantity) {
      throw new InsufficientStockError(
        `在庫不足: ${product.name}（在庫: ${product.stock}）`,
      );
    }

    // 最小注文数チェック
    if (quantity < product.minimumOrder) {
      throw new MinimumOrderError(`最小注文数は${product.minimumOrder}です`);
    }

    // 最大注文数チェック
    const currentQuantity = this.getItemQuantity(product.id);
    if (currentQuantity + quantity > product.maximumOrder) {
      throw new MaximumOrderError(`最大注文数は${product.maximumOrder}です`);
    }

    // ステータスチェック
    if (this.status !== OrderStatus.DRAFT) {
      throw new InvalidOrderStateError("確定済みの注文は変更できません");
    }
  }

  submit(): void {
    // 提出前の検証
    this.validateCanSubmit();

    this.status = OrderStatus.SUBMITTED;
    // イベント発行
    this.addEvent(new OrderSubmittedEvent(this));
  }

  private validateCanSubmit(): void {
    if (this.items.length === 0) {
      throw new EmptyOrderError("注文に商品が含まれていません");
    }

    if (this.getTotalAmount() < MIN_ORDER_AMOUNT) {
      throw new MinimumAmountError(`最小注文金額は${MIN_ORDER_AMOUNT}円です`);
    }
  }
}
```

### 仕様検証

```typescript
// 仕様パターン
interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// 具体的な仕様
class PremiumCustomerSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    return (
      customer.totalPurchases > 100000 && customer.membershipLevel === "premium"
    );
  }
}

class ActiveCustomerSpecification implements Specification<Customer> {
  isSatisfiedBy(customer: Customer): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return customer.lastPurchaseDate > thirtyDaysAgo;
  }
}

// 複合仕様
const eligibleForDiscount = new PremiumCustomerSpecification().and(
  new ActiveCustomerSpecification(),
);

if (eligibleForDiscount.isSatisfiedBy(customer)) {
  // 割引適用
}
```

## 4. データ整合性検証

### データベース制約

```sql
-- プライマリキー制約
ALTER TABLE users ADD CONSTRAINT pk_users PRIMARY KEY (id);

-- ユニーク制約
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- 外部キー制約
ALTER TABLE orders ADD CONSTRAINT fk_orders_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- チェック制約
ALTER TABLE products ADD CONSTRAINT chk_products_price
  CHECK (price >= 0);

ALTER TABLE orders ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('draft', 'submitted', 'processing', 'completed', 'cancelled'));

-- 複合制約
ALTER TABLE order_items ADD CONSTRAINT chk_order_items_quantity
  CHECK (quantity > 0 AND quantity <= 100);
```

### トランザクション整合性

```typescript
// トランザクション管理
class OrderService {
  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    return await this.db.transaction(async (trx) => {
      // 1. 在庫確認と予約
      for (const item of orderData.items) {
        const product = await trx.query(
          "SELECT * FROM products WHERE id = $1 FOR UPDATE",
          [item.productId],
        );

        if (product.stock < item.quantity) {
          throw new InsufficientStockError();
        }

        await trx.query(
          "UPDATE products SET stock = stock - $1 WHERE id = $2",
          [item.quantity, item.productId],
        );
      }

      // 2. 注文作成
      const order = await trx.query(
        "INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *",
        [orderData.userId, orderData.total],
      );

      // 3. 注文明細作成
      for (const item of orderData.items) {
        await trx.query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
          [order.id, item.productId, item.quantity, item.price],
        );
      }

      return order;
    });
  }
}
```

## 5. 実行時検証

### 契約プログラミング

```typescript
// 事前条件・事後条件・不変条件
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    // 事前条件
    this.require(initialBalance >= 0, "Initial balance must be non-negative");

    this.balance = initialBalance;

    // 不変条件
    this.invariant();
  }

  withdraw(amount: number): void {
    // 事前条件
    this.require(amount > 0, "Withdrawal amount must be positive");
    this.require(amount <= this.balance, "Insufficient funds");

    const oldBalance = this.balance;

    // 処理
    this.balance -= amount;

    // 事後条件
    this.ensure(
      this.balance === oldBalance - amount,
      "Balance calculation error",
    );

    // 不変条件
    this.invariant();
  }

  private require(condition: boolean, message: string): void {
    if (!condition) {
      throw new PreconditionError(message);
    }
  }

  private ensure(condition: boolean, message: string): void {
    if (!condition) {
      throw new PostconditionError(message);
    }
  }

  private invariant(): void {
    if (this.balance < 0) {
      throw new InvariantError("Balance cannot be negative");
    }
  }
}
```

## 6. 監視と検証

### ヘルスチェック

```typescript
// ヘルスチェックエンドポイント
class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);

    const results = checks.map((check, index) => {
      const serviceName = [
        "database",
        "redis",
        "external_apis",
        "disk",
        "memory",
      ][index];
      return {
        service: serviceName,
        status: check.status === "fulfilled" ? "healthy" : "unhealthy",
        details: check.status === "fulfilled" ? check.value : check.reason,
      };
    });

    const overallStatus = results.every((r) => r.status === "healthy")
      ? "healthy"
      : "degraded";

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
    };
  }

  private async checkDatabase(): Promise<any> {
    const result = await this.db.query("SELECT 1");
    return { connected: true, latency: result.latency };
  }

  private async checkDiskSpace(): Promise<any> {
    const stats = await checkDiskSpace("/");
    const percentUsed = (stats.used / stats.total) * 100;

    if (percentUsed > 90) {
      throw new Error(`Disk space critical: ${percentUsed.toFixed(2)}% used`);
    }

    return {
      total: stats.total,
      used: stats.used,
      percentUsed: percentUsed.toFixed(2),
    };
  }
}
```

### データ品質監視

```typescript
// データ品質チェック
class DataQualityMonitor {
  async runQualityChecks(): Promise<QualityReport> {
    const checks = [
      this.checkDataCompleteness(),
      this.checkDataConsistency(),
      this.checkDataTimeliness(),
      this.checkDataAccuracy(),
    ];

    const results = await Promise.all(checks);

    return {
      timestamp: new Date(),
      score: this.calculateQualityScore(results),
      details: results,
    };
  }

  private async checkDataCompleteness(): Promise<QualityCheck> {
    // NULL値の割合をチェック
    const nullCounts = await this.db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE email IS NULL) as null_emails,
        COUNT(*) FILTER (WHERE name IS NULL) as null_names,
        COUNT(*) as total
      FROM users
    `);

    const nullPercentage =
      ((nullCounts.null_emails + nullCounts.null_names) /
        (nullCounts.total * 2)) *
      100;

    return {
      metric: "completeness",
      score: 100 - nullPercentage,
      issues: nullPercentage > 5 ? ["High null value rate detected"] : [],
    };
  }

  private async checkDataConsistency(): Promise<QualityCheck> {
    // 参照整合性チェック
    const orphanRecords = await this.db.query(`
      SELECT COUNT(*) as count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE u.id IS NULL
    `);

    return {
      metric: "consistency",
      score: orphanRecords.count === 0 ? 100 : 0,
      issues:
        orphanRecords.count > 0
          ? [`Found ${orphanRecords.count} orphan orders`]
          : [],
    };
  }
}
```

## 7. 検証レポート

### 検証結果レポート

```typescript
interface ValidationReport {
  timestamp: Date;
  environment: string;
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  details: ValidationDetail[];
}

class ValidationReporter {
  generateReport(results: ValidationResult[]): ValidationReport {
    const summary = {
      totalChecks: results.length,
      passed: results.filter((r) => r.status === "passed").length,
      failed: results.filter((r) => r.status === "failed").length,
      warnings: results.filter((r) => r.status === "warning").length,
    };

    return {
      timestamp: new Date(),
      environment: process.env.NODE_ENV,
      summary,
      details: results.map((r) => ({
        check: r.checkName,
        status: r.status,
        message: r.message,
        metadata: r.metadata,
      })),
    };
  }

  async saveReport(report: ValidationReport): Promise<void> {
    // データベースに保存
    await this.db.query(
      "INSERT INTO validation_reports (report_data) VALUES ($1)",
      [JSON.stringify(report)],
    );

    // 失敗があれば通知
    if (report.summary.failed > 0) {
      await this.notificationService.sendAlert({
        level: "error",
        message: `Validation failed: ${report.summary.failed} checks failed`,
        details: report,
      });
    }
  }
}
```
