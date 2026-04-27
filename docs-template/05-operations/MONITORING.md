# MONITORING.md - 監視・運用ガイド

## 1. 監視戦略

### 監視レイヤー

```
┌─────────────────────────────────┐
│     ビジネスメトリクス          │ <- KPI、売上、コンバージョン率
├─────────────────────────────────┤
│     アプリケーション監視        │ <- エラー率、レスポンスタイム
├─────────────────────────────────┤
│     インフラストラクチャ監視    │ <- CPU、メモリ、ディスク
├─────────────────────────────────┤
│     セキュリティ監視            │ <- 不正アクセス、脆弱性
└─────────────────────────────────┘
```

### 監視指標（SLI/SLO）

| 指標         | SLI                 | SLO     | 測定方法                       |
| ------------ | ------------------- | ------- | ------------------------------ |
| 可用性       | アップタイム        | 99.9%   | (稼働時間/総時間) × 100        |
| レイテンシ   | P95レスポンスタイム | < 200ms | 95パーセンタイル値             |
| エラー率     | HTTPエラー率        | < 0.1%  | (5xxエラー/総リクエスト) × 100 |
| スループット | RPS                 | > 1000  | リクエスト数/秒                |

## 2. アプリケーション監視

### APM設定（Datadog）

```typescript
// monitoring/apm.ts
import tracer from "dd-trace";

// Datadog APM初期化
tracer.init({
  service: "app-api",
  env: process.env.NODE_ENV,
  version: process.env.APP_VERSION,

  // サンプリング設定
  sampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // ログ相関
  logInjection: true,

  // プロファイリング
  profiling: true,

  // カスタムタグ
  tags: {
    team: "backend",
    component: "api",
  },
});

// エクスプレスミドルウェア
import express from "express";
const app = express();

// トレーシングミドルウェア
app.use((req, res, next) => {
  const span = tracer.scope().active();
  if (span) {
    span.setTag("http.url", req.url);
    span.setTag("user.id", req.user?.id);
  }
  next();
});

// カスタムメトリクス
export function recordMetric(
  name: string,
  value: number,
  tags?: Record<string, string>,
) {
  const dogstatsd = tracer.dogstatsd;
  dogstatsd.gauge(name, value, tags);
}

// ビジネスメトリクス記録
export function recordBusinessMetric(event: string, metadata: any) {
  recordMetric(`business.${event}`, 1, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}
```

### エラー監視（Sentry）

```typescript
// monitoring/error-tracking.ts
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

// Sentry初期化
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,

  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // プロファイリング
  profilesSampleRate: 1.0,
  integrations: [new ProfilingIntegration()],

  // エラーフィルタリング
  beforeSend(event, hint) {
    // 既知の無害なエラーを除外
    if (event.exception?.values?.[0]?.value?.includes("ResizeObserver")) {
      return null;
    }

    // 機密情報のサニタイズ
    if (event.request?.cookies) {
      delete event.request.cookies;
    }

    return event;
  },
});

// エラーキャプチャヘルパー
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext("additional", context);
    }

    // ユーザー情報を追加
    const user = getCurrentUser();
    if (user) {
      scope.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    }

    Sentry.captureException(error);
  });
}

// パフォーマンストランザクション
export function measureTransaction<T>(
  name: string,
  operation: () => Promise<T>,
): Promise<T> {
  const transaction = Sentry.startTransaction({
    op: "function",
    name,
  });

  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));

  return operation()
    .then((result) => {
      transaction.setStatus("ok");
      return result;
    })
    .catch((error) => {
      transaction.setStatus("internal_error");
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}
```

## 3. インフラストラクチャ監視

### CloudWatch設定

```typescript
// monitoring/cloudwatch.ts
import { CloudWatch } from "@aws-sdk/client-cloudwatch";

const cloudwatch = new CloudWatch({ region: "ap-northeast-1" });

// カスタムメトリクス送信
export async function putMetric(
  namespace: string,
  metricName: string,
  value: number,
  unit: string = "Count",
  dimensions?: Record<string, string>,
) {
  const params = {
    Namespace: namespace,
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: Object.entries(dimensions || {}).map(([Name, Value]) => ({
          Name,
          Value,
        })),
      },
    ],
  };

  await cloudwatch.putMetricData(params);
}

// アラーム作成
export async function createAlarm(config: AlarmConfig) {
  const params = {
    AlarmName: config.name,
    ComparisonOperator: config.comparisonOperator || "GreaterThanThreshold",
    EvaluationPeriods: config.evaluationPeriods || 1,
    MetricName: config.metricName,
    Namespace: config.namespace,
    Period: config.period || 300,
    Statistic: config.statistic || "Average",
    Threshold: config.threshold,
    ActionsEnabled: true,
    AlarmActions: [config.snsTopicArn],
    AlarmDescription: config.description,
    Dimensions: config.dimensions,
  };

  await cloudwatch.putMetricAlarm(params);
}
```

### Prometheus設定

```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: "node-exporter"
    static_configs:
      - targets: ["localhost:9100"]

  - job_name: "application"
    static_configs:
      - targets: ["app:3000"]
    metrics_path: "/metrics"

  - job_name: "postgres-exporter"
    static_configs:
      - targets: ["postgres-exporter:9187"]

alerting:
  alertmanagers:
    - static_configs:
        - targets: ["alertmanager:9093"]
```

### Grafanaダッシュボード

```json
{
  "dashboard": {
    "title": "Application Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "P95"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx Errors"
          }
        ],
        "type": "graph"
      },
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU %"
          }
        ],
        "type": "gauge"
      }
    ]
  }
}
```

## 4. ログ管理

### 構造化ログ設定

```typescript
// logging/logger.ts
import winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";

// ログフォーマット
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Elasticsearch トランスポート
const esTransport = new ElasticsearchTransport({
  level: "info",
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD,
    },
  },
  index: "logs",
  dataStream: true,
});

// Logger作成
export const logger = winston.createLogger({
  format: logFormat,
  defaultMeta: {
    service: "api",
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    esTransport,
  ],
});

// リクエストロギングミドルウェア
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;

    logger.info("HTTP Request", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      userId: req.user?.id,
      requestId: req.id,
    });
  });

  next();
}
```

### ログ集約（ELK Stack）

```yaml
# logstash.conf
input {
beats {
port => 5044
}
}

filter {
if [type] == "nginx" {
grok {
match => {
"message" => "%{COMBINEDAPACHELOG}"
}
}
}

if [type] == "application" {
json {
source => "message"
}
}

date {
match => [ "timestamp", "ISO8601" ]
}

geoip {
source => "client_ip"
}
}

output {
elasticsearch {
hosts => ["elasticsearch:9200"]
index => "logs-%{+YYYY.MM.dd}"
}
}
```

## 5. アラート設定

### アラートルール

```yaml
# alerts.yml
groups:
  - name: application
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (threshold: 0.05)"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "P95 response time is {{ $value }}s"

      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes < 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Only {{ $value | humanizePercentage }} disk space available"
```

### 通知設定

```typescript
// notifications/alerting.ts
interface AlertChannel {
  send(alert: Alert): Promise<void>;
}

class SlackNotifier implements AlertChannel {
  async send(alert: Alert) {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: `🚨 Alert: ${alert.name}`,
      attachments: [
        {
          color: alert.severity === "critical" ? "danger" : "warning",
          fields: [
            { title: "Severity", value: alert.severity, short: true },
            { title: "Environment", value: process.env.NODE_ENV, short: true },
            { title: "Description", value: alert.description },
            { title: "Time", value: new Date().toISOString() },
          ],
        },
      ],
    });
  }
}

class PagerDutyNotifier implements AlertChannel {
  async send(alert: Alert) {
    if (alert.severity !== "critical") return;

    await axios.post("https://events.pagerduty.com/v2/enqueue", {
      routing_key: process.env.PAGERDUTY_KEY,
      event_action: "trigger",
      payload: {
        summary: alert.name,
        severity: "critical",
        source: "monitoring",
        custom_details: alert,
      },
    });
  }
}

// アラートマネージャー
class AlertManager {
  private channels: AlertChannel[] = [
    new SlackNotifier(),
    new PagerDutyNotifier(),
  ];

  async processAlert(alert: Alert) {
    // デデュプリケーション
    if (await this.isDuplicate(alert)) {
      return;
    }

    // 通知送信
    await Promise.all(this.channels.map((channel) => channel.send(alert)));

    // 記録
    await this.recordAlert(alert);
  }
}
```

## 6. パフォーマンス監視

### リアルユーザー監視（RUM）

```javascript
// frontend/rum.js
// Web Vitals監視
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

function sendToAnalytics(metric) {
  // Google Analytics送信
  gtag("event", metric.name, {
    value: Math.round(metric.value),
    metric_id: metric.id,
    metric_value: metric.value,
    metric_delta: metric.delta,
  });

  // カスタムエンドポイントへ送信
  fetch("/api/metrics", {
    method: "POST",
    body: JSON.stringify({
      metric: metric.name,
      value: metric.value,
      page: window.location.pathname,
    }),
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);

// カスタムパフォーマンス測定
class PerformanceMonitor {
  measure(name, fn) {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;

    performance.mark(startMark);
    const result = fn();
    performance.mark(endMark);

    performance.measure(name, startMark, endMark);
    const measure = performance.getEntriesByName(name)[0];

    this.report({
      name,
      duration: measure.duration,
    });

    return result;
  }

  report(data) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/performance", JSON.stringify(data));
    }
  }
}
```

## 7. セキュリティ監視

### 侵入検知

```typescript
// security/intrusion-detection.ts
class IntrusionDetector {
  private readonly patterns = [
    { pattern: /(\.\.|\/\/)/g, type: "path_traversal" },
    { pattern: /<script/gi, type: "xss_attempt" },
    { pattern: /union.*select/gi, type: "sql_injection" },
    { pattern: /\${.*}/g, type: "template_injection" },
  ];

  async detectSuspiciousActivity(request: Request) {
    const suspiciousPatterns = [];

    // URLパスチェック
    for (const { pattern, type } of this.patterns) {
      if (pattern.test(request.url)) {
        suspiciousPatterns.push(type);
      }
    }

    // レート制限チェック
    const requestCount = await this.getRequestCount(request.ip);
    if (requestCount > 100) {
      suspiciousPatterns.push("rate_limit_exceeded");
    }

    // 不審なヘッダーチェック
    if (request.headers["x-forwarded-for"]?.includes("127.0.0.1")) {
      suspiciousPatterns.push("header_spoofing");
    }

    if (suspiciousPatterns.length > 0) {
      await this.reportSuspiciousActivity({
        ip: request.ip,
        url: request.url,
        patterns: suspiciousPatterns,
        timestamp: new Date(),
      });
    }

    return suspiciousPatterns;
  }
}
```

## 8. 合成監視

### Synthetic Monitoring

```typescript
// synthetic/monitoring.ts
import { chromium } from "playwright";

class SyntheticMonitor {
  async runHealthCheck() {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // ホームページチェック
      await page.goto("https://app.example.com");
      await page.waitForSelector("h1", { timeout: 5000 });

      // ログインフロー
      await page.click("text=Login");
      await page.fill("#email", "test@example.com");
      await page.fill("#password", "test-password");
      await page.click('button[type="submit"]');

      // ダッシュボード表示確認
      await page.waitForSelector(".dashboard", { timeout: 10000 });

      // API呼び出し確認
      const response = await page.evaluate(() =>
        fetch("/api/health").then((r) => r.json()),
      );

      if (response.status !== "healthy") {
        throw new Error("API health check failed");
      }

      return { success: true };
    } catch (error) {
      await page.screenshot({ path: "error-screenshot.png" });
      throw error;
    } finally {
      await browser.close();
    }
  }
}

// 定期実行
setInterval(
  async () => {
    try {
      await monitor.runHealthCheck();
      console.log("Health check passed");
    } catch (error) {
      console.error("Health check failed:", error);
      await alertManager.sendAlert({
        severity: "critical",
        message: "Synthetic monitoring failed",
        error: error.message,
      });
    }
  },
  5 * 60 * 1000,
); // 5分ごと
```

## 9. キャパシティプランニング

### リソース予測

```typescript
// capacity/planning.ts
class CapacityPlanner {
  async predictResourceNeeds(days: number = 30) {
    const historicalData = await this.getHistoricalMetrics(90);

    // トレンド分析
    const cpuTrend = this.calculateTrend(historicalData.cpu);
    const memoryTrend = this.calculateTrend(historicalData.memory);
    const storageTrend = this.calculateTrend(historicalData.storage);

    // 予測
    const predictions = {
      cpu: {
        current: historicalData.cpu[historicalData.cpu.length - 1],
        predicted: this.linearProjection(cpuTrend, days),
        threshold: 80,
      },
      memory: {
        current: historicalData.memory[historicalData.memory.length - 1],
        predicted: this.linearProjection(memoryTrend, days),
        threshold: 90,
      },
      storage: {
        current: historicalData.storage[historicalData.storage.length - 1],
        predicted: this.linearProjection(storageTrend, days),
        threshold: 85,
      },
    };

    // アラート判定
    const alerts = [];
    for (const [resource, data] of Object.entries(predictions)) {
      if (data.predicted > data.threshold) {
        const daysUntilThreshold = this.daysUntilThreshold(
          data.current,
          data.threshold,
          trend,
        );

        alerts.push({
          resource,
          message: `${resource} will exceed threshold in ${daysUntilThreshold} days`,
          current: data.current,
          predicted: data.predicted,
          threshold: data.threshold,
        });
      }
    }

    return { predictions, alerts };
  }
}
```

## 10. ダッシュボード

### 運用ダッシュボード構成

```yaml
dashboards:
  - name: "Executive Dashboard"
    refresh: "1m"
    panels:
      - revenue_metrics
      - user_growth
      - system_health
      - key_incidents

  - name: "Operations Dashboard"
    refresh: "30s"
    panels:
      - service_status
      - error_rates
      - response_times
      - resource_utilization
      - active_alerts

  - name: "Security Dashboard"
    refresh: "5m"
    panels:
      - failed_logins
      - suspicious_activities
      - vulnerability_scan_results
      - compliance_status
```
