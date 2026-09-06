# INTEGRATIONS.md - 統合・連携ガイド

## 1. AI開発ツール統合

### 1.1 Claude Skills統合

Claude Code を使用している場合、AI仕様駆動開発専用のスキルをインストールすることで、ドキュメント管理を自動化できます。

#### スキルのインストール

Claude Codeで以下のプロンプトを実行することで、AI仕様駆動開発スキルが自動生成されます：

```
Claude Code用のスキルを作成したいです。

【目的】
AI仕様駆動開発の方法論に基づいて、プロジェクトのドキュメント構造を自動管理するスキルを作成

【参考資料】
- 公式リポジトリ: https://github.com/feel-flow/ai-spec-driven-development
- 方法論ドキュメント: https://github.com/feel-flow/ai-spec-driven-development/blob/develop/ai_spec_driven_development.md

【実装してほしい機能】
1. プロジェクト初期化（フォルダ構造の自動生成）
2. ドキュメント構造の検証と自動補修
3. 新規ドキュメントの適切な配置支援
4. ドキュメント更新時の影響度評価
5. MASTER.md索引の自動更新
6. Frontmatterメタデータの自動挿入
7. 用語集・決定記録の管理
8. コミット前の検証チェックリスト実行
```

#### スキルの機能

インストール後、以下の機能が自動的に利用可能になります：

| 機能                 | トリガープロンプト                           | 実行内容                                                         |
| -------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| プロジェクト初期化   | 「AI仕様駆動開発を導入したい」               | docs/フォルダ構造とMASTER.mdなど必須ファイルを自動生成           |
| 新規ドキュメント追加 | 「[トピック]のドキュメントを追加したい」     | Decision Matrixに基づき適切なフォルダに配置、Frontmatter自動挿入 |
| ドキュメント更新     | 「[ファイル名]を変更したい」                 | 影響度評価、バージョン更新、CHANGELOG連携を自動実行              |
| 構造検証             | 「コミット前にドキュメントをチェックしたい」 | フォルダ完全性、命名規約、メタデータ、リンク整合性を検証         |
| 用語管理             | 「GLOSSARYに[用語]を追加したい」             | 統一フォーマットで用語定義を追加、重複チェック                   |
| 決定記録             | 「[決定内容]をDECISIONSに記録したい」        | ADRフォーマットで決定記録を追加                                  |

#### 導入メリット

- **手作業ゼロ**: フォルダ構造、Frontmatter、索引更新などを自動化
- **一貫性保証**: Decision Matrixと命名規約を常に適用
- **影響度評価**: 変更時の影響度を自動判定、CHANGELOG連携
- **検証自動化**: コミット前の構造検証をワンコマンドで実行
- **チーム標準化**: スキルを共有することでチーム全体の標準化を実現

#### 使用例

```bash
# プロジェクト初期化
Claude: 「このプロジェクトにAI仕様駆動開発を導入したい」

# 出力例:
# ✓ docs/フォルダ構造を生成
# ✓ docs/MASTER.md 作成
# ✓ docs/01-context/PROJECT.md 作成
# ✓ 必須8文書を生成
# ✓ Frontmatter挿入完了

# 新規ドキュメント追加
Claude: 「データベース設計のドキュメントを追加したい」

# 出力例:
# Decision Matrixを適用...
# → 「設計/構造」に該当: 02-design/
# ✓ docs/02-design/DATABASE.md 作成
# ✓ Frontmatter挿入（id: database-design, version: 1.0.0）
# ✓ MASTER.md索引を更新

# コミット前検証
Claude: 「コミット前にドキュメントをチェックしたい」

# 出力例:
# [完全性チェック] ✓ 8フォルダ存在
# [必須ファイル] ✓ 8文書存在
# [メタデータ] ✓ Frontmatter正常
# [命名規約] ✓ 違反なし
# [整合性] ⚠ GLOSSARY未定義用語: 3件
# 検証結果: ⚠ WARNING（コミット可能）
```

#### トラブルシューティング

| 問題                    | 解決方法                                       |
| ----------------------- | ---------------------------------------------- |
| スキルが起動しない      | プロンプトに「AI仕様駆動開発」を明示的に含める |
| Decision Matrixが不正確 | 「Decision Matrixで判断してください」と明示    |
| Frontmatter欠落         | Frontmatterの形式を明示的に指定                |
| 影響度評価が不正確      | 「changeImpact: high」など影響度を明示         |

詳細なガイドとトラブルシューティングについては、[Claude Skills完全ガイド](https://github.com/feel-flow/flow-note-ai/blob/main/CLAUDE_SKILLS_SETUP_GUIDE.md)を参照してください。

---

### 1.2 GitHub Copilot統合

GitHub Copilotを使用する場合は、MASTER.mdをワークスペースルートに配置し、以下の設定を `.github/copilot-instructions.md` に追加します：

```markdown
# Copilot Instructions

このプロジェクトはAI仕様駆動開発方法論に従っています。

## 必須参照ドキュメント

コード生成前に以下を参照してください：

1. docs/MASTER.md - プロジェクト全体のルールと技術スタック
2. docs/01-context/PROJECT.md - ビジョンと要件
3. docs/02-design/ARCHITECTURE.md - システム設計
4. docs/03-implementation/PATTERNS.md - 実装パターン

## コード生成ルール

- マジックナンバー禁止（定数化または設定注入）
- 型安全性の徹底
- エラーハンドリングパターンの適用
- テストコードの同時生成

詳細は docs/MASTER.md を参照してください。
```

---

### 1.3 Cursor統合

Cursorを使用する場合は、`.cursorrules` ファイルを作成し、以下を追加します：

```
# AI仕様駆動開発ルール

このプロジェクトはAI仕様駆動開発方法論に従っています。

## 必須読み込みドキュメント

@docs/MASTER.md
@docs/01-context/PROJECT.md
@docs/02-design/ARCHITECTURE.md
@docs/03-implementation/PATTERNS.md

## コード生成制約

- マジックナンバー/ハードコード禁止
- 型安全性の徹底
- PATTERNS.mdのエラーハンドリングパターンを適用
- テストコードを同時生成

## 命名規則

- 変数: camelCase
- 定数: UPPER_SNAKE_CASE
- 型/インターフェース: PascalCase
- ファイル: コンポーネントはPascalCase、それ以外はcamelCase
```

---

## 2. 外部サービス統合

### 統合サービス一覧

| サービス名       | 用途               | 統合方式       | 認証方式    | 環境        |
| ---------------- | ------------------ | -------------- | ----------- | ----------- |
| Stripe           | 決済処理           | REST API       | API Key     | 本番/テスト |
| SendGrid         | メール送信         | REST API       | API Key     | 本番/テスト |
| AWS S3           | ファイルストレージ | SDK            | IAM Role    | 本番/テスト |
| Slack            | 通知               | Webhook        | OAuth2      | 本番        |
| Google Analytics | 分析               | JavaScript SDK | Tracking ID | 本番        |

## 2. 決済システム統合

### Stripe統合

```typescript
// Stripe設定
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// 決済の上流障害（Stripe API 障害・接続断）。cause に Stripe のエラーを保持する
// （エラークラスは PATTERNS.md「エラーハンドリング」の AppError 階層を継承する）
class PaymentError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "PAYMENT_UPSTREAM", 502, options);
  }
}

// 決済処理の実装
class PaymentService {
  // idempotencyKey: 同じ決済の再送を Stripe 側で重複排除させる。これが無いと
  // retryWithBackoff（FALLBACK.md §4）の再試行で PaymentIntent が二重に作られる
  async createPaymentIntent(
    amount: number,
    currency: string,
    idempotencyKey: string,
  ): Promise<PaymentIntent> {
    try {
      return await retryWithBackoff(
        () =>
          stripe.paymentIntents.create(
            {
              amount: amount * 100, // cents
              currency,
              automatic_payment_methods: { enabled: true },
              metadata: { integration_check: "accept_a_payment" },
            },
            { idempotencyKey },
          ),
        { operation: "stripe.paymentIntents.create" },
      );
    } catch (error) {
      // retryWithBackoff は正規化済み AppError を投げ、cause に Stripe のエラーを持つ。
      // カード拒否（利用者が対処できる）と上流障害（再試行すべき）を区別して伝える
      const cause = error instanceof AppError ? error.cause : error;
      if (cause instanceof Stripe.errors.StripeCardError) {
        throw new ValidationError(
          cause.message,
          [{ field: "card", message: cause.message, constraint: cause.code }],
          { cause },
        );
      }
      const normalized = normalizeExternalError(error);
      logger.error("Stripe payment intent creation failed", normalized, {
        idempotencyKey,
      });
      throw new PaymentError("Failed to create payment intent", {
        cause: normalized,
      });
    }
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded":
        await this.handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await this.handlePaymentFailure(event.data.object);
        break;
      default:
        // Stripe のイベント種別は外部が定義する「開かれた集合」で、購読設定や
        // Stripe 側の追加で未知の種別が届くのは正常。throw すると 500 → Stripe が再送を
        // 繰り返すため、記録して継続する（自前定義の閉じたユニオンは §8 のように
        // never で網羅性チェックする — 判断基準は「集合を誰が定義しているか」）。
        logger.info("Unhandled Stripe event type", {
          eventType: event.type,
          eventId: event.id,
        });
    }
  }
}
```

### Webhook設定

```typescript
// Webhook エンドポイント
app.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    // 署名検証と業務処理は別々の try で囲む。一緒にすると DB 接続断・一意制約違反まで
    // 「署名検証失敗」として 400 で記録され、決済は Stripe 側で成立しているのに
    // 記録されない障害を「Webhook Secret の設定ミスか攻撃」と誤診する。
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      const securityError = new SecurityError(
        "Webhook signature verification failed",
        { cause: error },
      );
      logger.error("Webhook signature verification failed", securityError);
      // 400: Stripe は再送しない（署名が合わないものを何度受けても結果は同じ）
      res.status(400).send("Webhook Error: invalid signature");
      return;
    }

    try {
      await paymentService.handleWebhook(event);
      res.json({ received: true });
    } catch (error) {
      const normalized = normalizeExternalError(
        error,
        "Webhook processing failed",
      );
      logger.error("Webhook processing failed", normalized, {
        eventId: event.id,
        eventType: event.type,
      });
      // 500: Stripe の自動再送に載せる（処理側の一時障害は再送で回復しうる）
      res.status(500).send("Webhook processing failed");
    }
  },
);
```

## 3. メール送信統合

### SendGrid統合

```typescript
// SendGrid設定
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// マジックナンバー禁止: 意味のある値は名前付き定数に切り出す（MASTER.md）
const SENDGRID_MAX_MESSAGES_PER_BATCH = 1000; // 件。SendGrid の 1 リクエスト上限
const SENDGRID_BATCH_INTERVAL_MS = 1000; // ms。レート制限を避けるバッチ間の待機

// メール送信の上流障害。cause に SendGrid のレスポンス（status / body）を保持する
class EmailError extends AppError {
  constructor(message: string, options?: AppErrorOptions) {
    super(message, "EMAIL_UPSTREAM", 502, options);
  }
}

// 一括送信の結果。途中で失敗しても「どこまで送れたか」を呼び出し元へ返す
interface BulkEmailResult {
  sentCount: number;
  failedChunks: Array<{
    chunkIndex: number;
    recipients: string[];
    error: AppError;
  }>;
}

// メールサービス実装
class EmailService {
  private readonly FROM_EMAIL = "noreply@example.com";

  async sendWelcomeEmail(user: User): Promise<void> {
    const msg = {
      to: user.email,
      from: this.FROM_EMAIL,
      templateId: "d-f43daeeaef504760851f727007e0b5d0",
      dynamic_template_data: {
        user_name: user.name,
        verification_url: this.generateVerificationUrl(user.id),
      },
    };

    try {
      await sgMail.send(msg);
      logger.info("Welcome email sent", { userId: user.id });
    } catch (error) {
      // SendGrid のステータス・レスポンス本文を cause で保持する（呼び出し元が
      // 「宛先不正（再送しても無駄）」と「API 障害（再試行）」を区別できる）
      const normalized = normalizeExternalError(error, "Failed to send email");
      logger.error("Failed to send welcome email", normalized, {
        userId: user.id,
      });
      throw new EmailError("Failed to send email", { cause: normalized });
    }
  }

  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: string,
  ): Promise<BulkEmailResult> {
    const messages = recipients.map((email) => ({
      to: email,
      from: this.FROM_EMAIL,
      subject,
      html: content,
    }));

    // バッチ送信。チャンク単位で失敗を記録して続行する。
    // 途中で throw すると残りのチャンクは送られず、どこまで送れたかの記録も残らない。
    // 再実行すると送信済みの宛先に二重送信される（部分送信の記録が必要）。
    const chunks = this.chunkArray(messages, SENDGRID_MAX_MESSAGES_PER_BATCH);
    const result: BulkEmailResult = { sentCount: 0, failedChunks: [] };

    for (const [chunkIndex, chunk] of chunks.entries()) {
      try {
        await sgMail.send(chunk);
        result.sentCount += chunk.length;
      } catch (error) {
        const normalized = normalizeExternalError(
          error,
          "Bulk email chunk failed",
        );
        logger.error("Bulk email chunk failed", normalized, {
          chunkIndex,
          chunkSize: chunk.length,
          totalChunks: chunks.length,
        });
        result.failedChunks.push({
          chunkIndex,
          recipients: chunk.map((m) => m.to),
          error: normalized,
        });
      }
      await this.delay(SENDGRID_BATCH_INTERVAL_MS); // レート制限対策
    }

    // 失敗チャンクは呼び出し元が result.failedChunks の宛先だけを再送する
    logger.info("Bulk email finished", {
      sentCount: result.sentCount,
      failedChunkCount: result.failedChunks.length,
    });
    return result;
  }
}
```

## 4. ストレージ統合

### AWS S3統合

```typescript
// S3設定
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 署名付き URL の既定有効期限（秒）。短いほど漏洩時の影響が小さい
const PRESIGNED_URL_DEFAULT_TTL_SECONDS = 3600; // 1 時間

// ファイルストレージサービス
class StorageService {
  private readonly BUCKET_NAME = process.env.S3_BUCKET_NAME;

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
      },
    });

    await s3Client.send(command);
    return `https://${this.BUCKET_NAME}.s3.amazonaws.com/${key}`;
  }

  async getPresignedUrl(
    key: string,
    expiresIn: number = PRESIGNED_URL_DEFAULT_TTL_SECONDS,
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}
```

## 5. 通知システム統合

### Slack統合

```typescript
// Slack Webhook設定
import { IncomingWebhook } from "@slack/webhook";

const webhook = new IncomingWebhook(process.env.SLACK_WEBHOOK_URL);

// 循環参照を含む context でも JSON.stringify が TypeError を投げないようにする。
// エラー通知の経路で例外が出ると、通知しようとしていた元エラーを覆い隠す
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_key, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v)) return "[Circular]";
        seen.add(v);
      }
      return v;
    },
    2,
  );
}

// 通知サービス
class NotificationService {
  async sendSlackNotification(message: SlackMessage): Promise<void> {
    try {
      await webhook.send({
        text: message.text,
        blocks: message.blocks,
        attachments: message.attachments,
      });
      metrics.increment("notification.slack.sent");
    } catch (error) {
      // 通知パイプライン自身の失敗は再スローしない（呼び出し元はすでにエラー処理中で、
      // 通知失敗で本処理を止めるべきではない）が、無言では終わらせない。
      // Webhook URL 失効・レート制限で「本番エラーは出ているのに誰にも届かず、
      // 届いていないことにも気づけない」状態を、メトリクスとログで可視化する。
      const normalized = normalizeExternalError(
        error,
        "Slack notification failed",
      );
      logger.error("Failed to send Slack notification", normalized, {
        textPreview: message.text.slice(0, 80),
      });
      metrics.increment("notification.slack.failed", {
        reason: normalized.code,
      });
    }
  }

  // context は診断用の任意データ。any ではなく unknown を値に使い、利用前の
  // ナローイングを強制する。※ interface で宣言した型は暗黙のインデックス
  // シグネチャを持たず代入できない。type で宣言するか `{ ...ctx }` で展開する。
  async notifyError(
    error: Error,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.sendSlackNotification({
      text: "⚠️ エラーが発生しました",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*エラー:* ${error.message}`,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*環境:* ${process.env.NODE_ENV}`,
            },
            {
              type: "mrkdwn",
              text: `*時刻:* ${new Date().toISOString()}`,
            },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `\`\`\`${safeStringify(context)}\`\`\``,
            },
          ],
        },
      ],
    });
  }
}
```

## 6. 認証プロバイダー統合

### OAuth2.0統合

```typescript
// Google OAuth設定
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// 認証サービス
class AuthService {
  async authenticateWithGoogle(code: string): Promise<User> {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // getPayload() は TokenPayload | undefined。未検査だと認証失敗が TypeError として
    // 現れ、認証エラーとして扱われない（FALLBACK.md の禁止カテゴリに乗らない）
    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new UnauthorizedError("Google ID token has no verified payload");
    }

    // ユーザー情報の取得または作成
    let user = await this.userRepository.findByEmail(payload.email);

    if (!user) {
      user = await this.userRepository.create({
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: "google",
        providerId: payload.sub,
      });
    }

    return user;
  }
}
```

## 7. 分析ツール統合

### Google Analytics統合

```typescript
// GA4設定
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY,
  },
});

// 分析サービス
class AnalyticsService {
  private readonly GA_PROPERTY_ID = process.env.GA_PROPERTY_ID;

  async getActiveUsers(days: number = 7): Promise<number> {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${this.GA_PROPERTY_ID}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: "today",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
    });

    // rows は該当データが無いと空配列。添字アクセスの TypeError にすると
    // 「データなし」と「API 失敗」が同じ例外になる。API 失敗は runReport が投げる
    const value = response.rows?.[0]?.metricValues?.[0]?.value;
    if (value === undefined) {
      logger.info("No active user data for period", { days });
      return 0;
    }
    return parseInt(value, 10);
  }

  async trackEvent(event: AnalyticsEvent): Promise<void> {
    // クライアント側のgtag実装
    // またはMeasurement Protocol APIを使用
  }
}
```

## 8. キューシステム統合

### Redis/Bull統合

```typescript
// Bull Queue設定
import Bull from "bull";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

// ジョブ種別は判別可能ユニオンで列挙する（any を使わない / MASTER.md）。
// 注意: job.data は Redis から復元された JSON であり、型注釈は実行時の保証にならない
// （Date は string になり、旧デプロイが入れた未知種別も届く）。信頼境界では
// zod 等でパースすること。ペイロードには User 実体ではなく userId を載せる方が安全。
type EmailJob =
  | { type: "welcome"; data: { user: User } }
  | { type: "passwordReset"; data: { user: User; token: string } };

const EMAIL_JOB_MAX_ATTEMPTS = 3; // 回。失敗時の再試行上限
const EMAIL_JOB_BACKOFF_BASE_MS = 2000; // ms。指数バックオフの基準値

// キューサービス
class QueueService {
  private emailQueue: Bull.Queue<EmailJob>;

  constructor() {
    this.emailQueue = new Bull<EmailJob>("email", {
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    });

    this.setupProcessors();
  }

  private setupProcessors(): void {
    this.emailQueue.process(async (job) => {
      const payload = job.data;

      switch (payload.type) {
        case "welcome":
          await this.emailService.sendWelcomeEmail(payload.data.user);
          break;
        case "passwordReset":
          await this.emailService.sendPasswordResetEmail(
            payload.data.user,
            payload.data.token,
          );
          break;
        default: {
          // 網羅性チェック: ジョブ種別を追加したらここでコンパイルエラーになる
          // （default を握りつぶすと未知ジョブが無言で消える）。
          // §2 の Stripe イベント switch が default で継続するのと正反対だが、
          // 判断基準は「集合を誰が定義しているか」: EmailJob は自分が定義する閉じた
          // ユニオンなので未知種別はバグ、Stripe イベントは外部定義の開かれた集合。
          // 検出できるのはコンパイル時のみ。実データの検証は上記のとおり別途必要。
          const unhandled: never = payload;
          // ペイロード本体はエラーメッセージに載せない（token 等の機密が
          // failed job レコード・エラートラッカー・stderr に複製される）
          const unknownType = (unhandled as { type?: unknown }).type;
          throw new Error(
            `Unhandled email job type: ${String(unknownType)} (jobId=${job.id})`,
          );
        }
      }
    });
  }

  async queueEmail(job: EmailJob): Promise<void> {
    await this.emailQueue.add(job, {
      attempts: EMAIL_JOB_MAX_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: EMAIL_JOB_BACKOFF_BASE_MS,
      },
    });
  }
}
```

## 9. モニタリング統合

### Datadog統合

```typescript
// Datadog設定
import { StatsD } from "node-dogstatsd";

const dogstatsd = new StatsD({
  host: process.env.DATADOG_HOST,
  port: 8125,
  prefix: "app.",
});

// メトリクスサービス
class MetricsService {
  recordApiCall(endpoint: string, duration: number, status: number): void {
    dogstatsd.histogram("api.response_time", duration, [
      `endpoint:${endpoint}`,
    ]);
    dogstatsd.increment("api.requests", 1, [
      `endpoint:${endpoint}`,
      `status:${status}`,
    ]);
  }

  recordError(error: Error, context: string): void {
    dogstatsd.increment("errors", 1, [
      `type:${error.constructor.name}`,
      `context:${context}`,
    ]);
  }

  recordBusinessMetric(metric: string, value: number, tags?: string[]): void {
    dogstatsd.gauge(`business.${metric}`, value, tags);
  }
}
```

## 10. 統合テスト

### 統合テスト戦略

```typescript
// モックサービス
class MockPaymentService implements IPaymentService {
  async createPaymentIntent(amount: number): Promise<PaymentIntent> {
    return {
      id: "pi_test_123",
      amount,
      status: "succeeded",
    };
  }
}

// 統合テスト
describe("Payment Integration", () => {
  let app: Application;

  beforeAll(async () => {
    // テスト環境でモックサービスを注入
    container.register("PaymentService", {
      useClass:
        process.env.NODE_ENV === "test" ? MockPaymentService : PaymentService,
    });

    app = await createApp();
  });

  it("should process payment successfully", async () => {
    const response = await request(app)
      .post("/payments")
      .send({
        amount: 1000,
        currency: "usd",
      })
      .expect(200);

    expect(response.body).toHaveProperty("paymentIntentId");
  });
});
```

## 11. エラーハンドリングと再試行

外部サービス呼び出しのエラー処理は、次の正典に従う（本ファイル内で別実装を作らない）:

- **エラー型と正規化**: [PATTERNS.md](./PATTERNS.md)「エラーハンドリング」— `AppError` 階層（`cause` 付き）と `normalizeExternalError()`。外部 SDK の生エラーは境界で必ず正規化する
- **再試行**: [FALLBACK.md](./FALLBACK.md) §4「再試行ユーティリティ」— `retryWithBackoff(fn, { operation })`。再試行可否の判定（禁止カテゴリは再試行しない）・Jitter・試行ごとのログを内蔵する。副作用のある呼び出しは冪等キー付きでのみ再試行する（§2 の `createPaymentIntent`）
- **フォールバック**: [FALLBACK.md](./FALLBACK.md) §4 `fallbackInProdOnly()` — AppError 以外は deny-by-default でスロー
- **ログ**: [PATTERNS.md](./PATTERNS.md)「ログパターン」の `Logger` 規約 — `error(message, error, meta?)` / `warn|info(message, meta?)`
