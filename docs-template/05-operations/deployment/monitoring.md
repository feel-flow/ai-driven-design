# モニタリング・運用

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md)

## 概要

本ドキュメントは、システムのモニタリング設定、デプロイメントチェックリスト、および運用手順を定義します。

---

## 1. モニタリング設定

### CloudWatch Alarms

システムの健全性を監視するための主要なアラーム設定:

```typescript
// monitoring/alarms.ts
const alarms = [
  {
    name: "HighCPUUtilization",
    metric: "CPUUtilization",
    threshold: 80,
    evaluationPeriods: 2,
    action: "scale-up",
  },
  {
    name: "HighErrorRate",
    metric: "HTTPCode_Target_5XX_Count",
    threshold: 10,
    evaluationPeriods: 1,
    action: "alert",
  },
  {
    name: "LowHealthyHosts",
    metric: "HealthyHostCount",
    threshold: 1,
    comparisonOperator: "LessThanThreshold",
    action: "critical-alert",
  },
];
```

### 主要メトリクス

| メトリクス       | 閾値     | アクション     |
| ---------------- | -------- | -------------- |
| CPU使用率        | 80%      | スケールアップ |
| エラー率         | 10件/分  | アラート通知   |
| ヘルシーホスト数 | < 1      | 緊急アラート   |
| レスポンスタイム | > 1000ms | 警告通知       |
| メモリ使用率     | 85%      | スケールアップ |

---

## 2. デプロイメントチェックリスト

### Pre-Deployment

デプロイ前に必ず確認する項目:

- [ ] すべてのテストが成功している
- [ ] コードレビューが完了している
- [ ] セキュリティスキャンが完了している
- [ ] データベースマイグレーションの準備ができている
- [ ] ロールバック計画が準備されている
- [ ] 関係者への通知が完了している

### During Deployment

デプロイ中に監視する項目:

- [ ] デプロイメントログを監視
- [ ] エラー率を監視
- [ ] レスポンスタイムを監視
- [ ] リソース使用率を監視

### Post-Deployment

デプロイ後に確認する項目:

- [ ] スモークテストの実行
- [ ] 主要機能の動作確認
- [ ] パフォーマンスメトリクスの確認
- [ ] エラーログの確認
- [ ] ユーザーフィードバックの監視
- [ ] デプロイメント記録の更新

---

## 3. 災害復旧

### バックアップ戦略

```yaml
# backup-policy.yml
backup_policy:
  database:
    frequency: daily
    retention: 30_days
    point_in_time_recovery: enabled

  application_data:
    frequency: hourly
    retention: 7_days

  configurations:
    frequency: on_change
    retention: 90_days
```

### 復旧手順

```bash
#!/bin/bash
# disaster-recovery.sh

# 1. 最新のバックアップを特定
LATEST_BACKUP=$(aws rds describe-db-snapshots \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

# 2. バックアップから復元
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "restored-db" \
  --db-snapshot-identifier ${LATEST_BACKUP}

# 3. アプリケーションを再デプロイ
./scripts/deploy-production.sh disaster-recovery

# 4. DNSを切り替え
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456 \
  --change-batch file://dns-failover.json
```

---

## 4. 運用手順書

### 定期メンテナンス

| タスク             | 頻度  | 手順             | 担当   |
| ------------------ | ----- | ---------------- | ------ |
| セキュリティパッチ | 月次  | patch-update.sh  | DevOps |
| 証明書更新         | 3ヶ月 | cert-renewal.sh  | DevOps |
| ログローテーション | 週次  | 自動             | -      |
| バックアップ検証   | 月次  | backup-verify.sh | DevOps |

### トラブルシューティング

よくある問題の診断と対処方法:

```bash
# 一般的な問題の対処

# 1. サービスが起動しない
aws ecs describe-tasks --cluster production --tasks <task-arn>
aws logs get-log-events --log-group-name /ecs/app

# 2. メモリリーク
aws ecs update-service --cluster production --service app --force-new-deployment

# 3. データベース接続エラー
aws rds describe-db-instances --db-instance-identifier production-db
telnet <db-host> 5432

# 4. ログの確認
aws logs tail /ecs/app --follow

# 5. メトリクスの確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=app \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average
```

### エスカレーションフロー

1. **Level 1**: 自動アラート → オンコールエンジニア
2. **Level 2**: 30分以内に解決しない → チームリード
3. **Level 3**: 1時間以内に解決しない → システムアーキテクト
4. **Level 4**: クリティカル障害 → CTO/経営層

### 緊急連絡先

| 役割          | 連絡方法               | 対応時間       |
| ------------- | ---------------------- | -------------- |
| オンコール    | PagerDuty              | 24/7           |
| DevOps Team   | Slack #incidents       | 24/7           |
| Security Team | <security@example.com> | 24/7           |
| Management    | emergency-contact-list | Business Hours |

---

## 5. 運用KPI

### 目標値

| KPI                 | 目標      | 測定方法          |
| ------------------- | --------- | ----------------- |
| システム稼働率      | 99.9%     | CloudWatch Uptime |
| MTTR (平均復旧時間) | < 30分    | インシデント記録  |
| MTBF (平均故障間隔) | > 720時間 | インシデント記録  |
| デプロイ頻度        | 週2回以上 | CI/CDログ         |
| デプロイ成功率      | > 95%     | CI/CDログ         |

### レポーティング

- **日次**: システム稼働状況、エラーログサマリー
- **週次**: デプロイメント状況、パフォーマンストレンド
- **月次**: KPIレポート、インシデントレビュー
- **四半期**: キャパシティプランニング、改善提案

---

## 参照

- [DEPLOYMENT.md](../DEPLOYMENT.md) - デプロイメント全体の詳細
- [infrastructure.md](./infrastructure.md) - インフラ構成
