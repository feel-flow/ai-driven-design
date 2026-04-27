# CI/CDパイプライン

> **Parent**: [DEPLOYMENT.md](../DEPLOYMENT.md)

## 概要

このドキュメントでは、プロジェクトのCI/CDパイプライン設定について説明します。GitHub ActionsとDockerを使用した自動化されたビルド・テスト・デプロイメントフローを定義します。

## 目次

1. [パイプライン概要](#1-パイプライン概要)
2. [GitHub Actions設定](#2-github-actions設定)
3. [Dockerコンテナ設定](#3-dockerコンテナ設定)
4. [環境別デプロイメント戦略](#4-環境別デプロイメント戦略)

---

## 1. パイプライン概要

### パイプラインフロー

```
コード push
  ↓
[Test Job]
  - 依存関係インストール
  - ユニットテスト実行
  - ビルド実行
  - 成果物アップロード
  ↓
[Deploy Staging] (developブランチ)
  - 成果物ダウンロード
  - Dockerイメージビルド
  - ECRへpush
  - ECSサービス更新
  ↓
[Deploy Production] (releaseイベント)
  - Blue-Greenデプロイメント実行
```

### トリガー条件

- **mainブランチpush**: テストのみ実行
- **developブランチpush**: テスト + Stagingデプロイ
- **releaseイベント**: テスト + Productionデプロイ

---

## 2. GitHub Actions設定

### ワークフロー構造

**ファイル**: `.github/workflows/deploy.yml`

#### Job 1: Test

**目的**: コード品質保証とビルド検証

**主要ステップ**:

1. リポジトリチェックアウト
2. Node.js環境セットアップ (v18)
3. 依存関係インストール (`npm ci`)
4. テスト実行 (`npm test`)
5. ビルド実行 (`npm run build`)
6. ビルド成果物をアーティファクトとしてアップロード

**実行条件**: すべてのトリガーで実行

#### Job 2: Deploy-Staging

**目的**: Staging環境への自動デプロイ

**主要ステップ**:

1. ビルド成果物ダウンロード
2. AWS認証情報設定
3. Amazon ECRログイン
4. Dockerイメージビルド & ECRへpush
5. ECSサービス強制再デプロイ

**実行条件**:

- `needs: test` (テストジョブ成功後)
- `if: github.ref == 'refs/heads/develop'` (developブランチのみ)
- `environment: staging` (承認不要)

#### Job 3: Deploy-Production

**目的**: Production環境への制御されたデプロイ

**主要ステップ**:

1. Blue-Greenデプロイスクリプト実行
2. リリースタグをバージョンとして使用

**実行条件**:

- `needs: test` (テストジョブ成功後)
- `if: github.event_name == 'release'` (releaseイベントのみ)
- `environment: production` (手動承認推奨)

### 環境変数とシークレット

**必須シークレット**:

- `AWS_ACCESS_KEY_ID`: AWSアクセスキー
- `AWS_SECRET_ACCESS_KEY`: AWSシークレットキー

**環境固有設定**:

- ECRリポジトリ名 (staging/production)
- ECSクラスター名
- AWSリージョン (`ap-northeast-1`)

### ワークフロー最適化ポイント

1. **キャッシュ活用**: `cache: 'npm'` でnode_modulesキャッシュ
2. **並列実行**: テストとビルドは同一ジョブで直列実行（成果物再利用）
3. **アーティファクト管理**: ビルド成果物を後続ジョブで再利用
4. **条件分岐**: ブランチとイベントで適切な環境へルーティング

---

## 3. Dockerコンテナ設定

### Multi-Stage Build構造

**目的**: イメージサイズ削減とセキュリティ向上

#### Stage 1: Builder

**ベースイメージ**: `node:18-alpine`

**役割**:

- 依存関係インストール (production-only)
- アプリケーションビルド実行
- ビルド成果物生成

**主要処理**:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
```

#### Stage 2: Runtime

**ベースイメージ**: `node:18-alpine`

**役割**:

- 最小限のランタイム環境構築
- ビルド済み成果物のみコピー
- セキュリティ強化設定

**主要処理**:

```dockerfile
FROM node:18-alpine
WORKDIR /app

# 非rootユーザー作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# ビルド成果物コピー（所有権変更）
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs
EXPOSE 3000

# ヘルスチェック設定
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/index.js"]
```

### セキュリティ対策

1. **非rootユーザー実行**: `USER nodejs` (UID 1001)
2. **最小限の依存関係**: production依存関係のみ
3. **Alpine Linux**: 軽量で脆弱性の少ないベースイメージ
4. **ヘルスチェック**: コンテナ稼働状態監視

### イメージ最適化

- **レイヤーキャッシュ活用**: `package*.json` を先にコピー
- **不要ファイル除外**: `.dockerignore` で除外
- **Multi-Stage Build**: 開発依存関係を最終イメージに含めない

---

## 4. 環境別デプロイメント戦略

### Staging環境

**デプロイ戦略**: Rolling Update

**特徴**:

- 自動デプロイ (developブランチpush時)
- 手動承認不要
- ECS force-new-deployment でローリング更新
- ダウンタイム最小限

**リスク許容度**: 高（開発検証環境）

### Production環境

**デプロイ戦略**: Blue-Green Deployment

**特徴**:

- 手動トリガー (releaseイベント)
- 環境承認必須 (`environment: production`)
- 専用デプロイスクリプト実行
- 即座ロールバック可能

**リスク許容度**: 低（本番環境）

### Blue-Greenデプロイメントフロー

```
1. Green環境（新バージョン）をデプロイ
2. ヘルスチェック実行
3. 成功時: トラフィックをGreenへ切替
4. 失敗時: Blue環境（旧バージョン）維持
5. 問題発生時: 即座にBlueへロールバック
```

**実装**: `./scripts/deploy-production.sh`

---

## ベストプラクティス

### パイプライン設計

1. **Fail Fast原則**: テストを最初に実行
2. **並列化**: 独立したジョブは並列実行
3. **環境分離**: 環境ごとに異なるデプロイ戦略
4. **承認フロー**: 本番環境は手動承認

### Docker設計

1. **Multi-Stage Build**: イメージサイズ削減
2. **非rootユーザー**: セキュリティ強化
3. **ヘルスチェック**: コンテナ監視
4. **軽量イメージ**: Alpine Linux使用

### セキュリティ

1. **シークレット管理**: GitHub Secretsで機密情報管理
2. **最小権限原則**: IAMロールで必要最小限の権限
3. **イメージスキャン**: 脆弱性検査
4. **タグ付け**: コミットSHAでイメージバージョン管理

---

## トラブルシューティング

### よくある問題

**問題**: デプロイジョブがスキップされる

- **原因**: ブランチ条件不一致
- **解決**: `github.ref` の値を確認

**問題**: Dockerビルド失敗

- **原因**: ビルド成果物が不足
- **解決**: テストジョブのアーティファクト設定確認

**問題**: ECSデプロイがタイムアウト

- **原因**: ヘルスチェック失敻
- **解決**: アプリケーションログとヘルスチェックエンドポイント確認

### デバッグ方法

1. **GitHub Actions**: Workflow実行ログ確認
2. **Docker**: `docker logs` でコンテナログ確認
3. **ECS**: CloudWatch Logsでサービスログ確認
4. **ローカルテスト**: `docker build` と `docker run` でローカル検証

---

## 参考情報

### 関連ドキュメント

- [DEPLOYMENT.md](../DEPLOYMENT.md) - デプロイメント全体戦略
- [git-workflow.md](./git-workflow.md) - AI駆動Git Workflow

### 外部リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [AWS ECS Deployment](https://docs.aws.amazon.com/ecs/latest/developerguide/deployment-types.html)

---

**最終更新**: 2025-11-05
**メンテナー**: Development Team
