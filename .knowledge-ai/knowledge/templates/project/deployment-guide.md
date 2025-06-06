# デプロイメントガイド

## 概要
プロジェクトの各環境へのデプロイ手順とインフラ構成

## 環境構成

### 環境一覧
```markdown
## Development（開発環境）
- **用途**: 開発者の個別開発・動作確認
- **更新頻度**: 随時
- **データ**: モックデータ・テストデータ

## Staging（ステージング環境）
- **用途**: 統合テスト・受け入れテスト
- **更新頻度**: PR マージ時
- **データ**: 本番類似データ（匿名化）

## Production（本番環境）
- **用途**: エンドユーザー向けサービス提供
- **更新頻度**: リリース時
- **データ**: 実際のユーザーデータ
```

### インフラ構成図
```mermaid
graph TB
    subgraph "Production"
        A[Load Balancer] --> B[Web Server 1]
        A --> C[Web Server 2]
        B --> D[App Server 1]
        C --> E[App Server 2]
        D --> F[Database Primary]
        E --> F
        F --> G[Database Replica]
        D --> H[Redis Cache]
        E --> H
    end
    
    subgraph "Staging"
        I[Web Server] --> J[App Server]
        J --> K[Database]
        J --> L[Redis]
    end
    
    subgraph "Development"
        M[Local Server] --> N[Local DB]
    end
```

## デプロイ戦略

### CI/CD パイプライン
```yaml
# GitHub Actions ワークフロー例
name: Deploy Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run security audit
        run: npm audit --audit-level moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build application
        run: npm run build
      
      - name: Build Docker image
        run: |
          docker build -t ${{ secrets.DOCKER_REGISTRY }}/app:${{ github.sha }} .
          docker push ${{ secrets.DOCKER_REGISTRY }}/app:${{ github.sha }}

  deploy-staging:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploy to staging environment"
          # デプロイスクリプト実行

  deploy-production:
    needs: [test, build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploy to production environment"
          # 本番デプロイスクリプト実行
```

### デプロイ手法

#### Blue-Green デプロイメント
```bash
#!/bin/bash
# Blue-Green デプロイスクリプト

CURRENT_ENV=$(kubectl get service app-service -o jsonpath='{.spec.selector.version}')
NEW_ENV=$([ "$CURRENT_ENV" = "blue" ] && echo "green" || echo "blue")

echo "Current environment: $CURRENT_ENV"
echo "Deploying to: $NEW_ENV"

# 新環境にデプロイ
kubectl set image deployment/app-$NEW_ENV app=myapp:$IMAGE_TAG

# ヘルスチェック待機
kubectl wait --for=condition=available --timeout=300s deployment/app-$NEW_ENV

# トラフィック切り替え
kubectl patch service app-service -p '{"spec":{"selector":{"version":"'$NEW_ENV'"}}}'

echo "Deployment completed. Traffic switched to $NEW_ENV"
```

#### カナリアデプロイメント
```yaml
# Kubernetes Canary Deployment
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: app-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
      - setWeight: 10    # 10%のトラフィックを新バージョンに
      - pause: {duration: 30s}
      - setWeight: 50    # 50%のトラフィックを新バージョンに
      - pause: {duration: 30s}
      - setWeight: 100   # 100%のトラフィックを新バージョンに
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
```

## 環境別設定

### Development環境
```bash
# 環境変数設定
NODE_ENV=development
DATABASE_URL=postgresql://dev:password@localhost:5432/myapp_dev
REDIS_URL=redis://localhost:6379
API_BASE_URL=http://localhost:3000
LOG_LEVEL=debug

# 起動コマンド
npm run dev
```

### Staging環境
```bash
# 環境変数設定
NODE_ENV=staging
DATABASE_URL=postgresql://staging:password@staging-db:5432/myapp_staging
REDIS_URL=redis://staging-redis:6379
API_BASE_URL=https://staging-api.example.com
LOG_LEVEL=info

# Docker Compose
docker-compose -f docker-compose.staging.yml up -d
```

### Production環境
```bash
# 環境変数設定（Kubernetes Secrets）
NODE_ENV=production
DATABASE_URL=postgresql://prod:secure_password@prod-db-cluster:5432/myapp_prod
REDIS_URL=redis://prod-redis-cluster:6379
API_BASE_URL=https://api.example.com
LOG_LEVEL=warn

# Kubernetes デプロイ
kubectl apply -f k8s/production/
```

## インフラ設定

### Docker設定
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
USER node

CMD ["npm", "start"]
```

### Kubernetes設定
```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: myapp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### データベース設定
```yaml
# k8s/postgres.yml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: myapp_prod
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secrets
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 20Gi
```

## セキュリティ設定

### SSL/TLS証明書
```yaml
# k8s/tls-certificate.yml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: app-tls
spec:
  secretName: app-tls-secret
  dnsNames:
  - api.example.com
  - www.example.com
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
```

### Network Policies
```yaml
# k8s/network-policy.yml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

### Secrets管理
```bash
# Kubernetes Secrets作成
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://user:pass@host:5432/db" \
  --from-literal=jwt-secret="your-super-secret-key" \
  --from-literal=api-key="your-api-key"

# AWS Secrets Manager（本番環境）
aws secretsmanager create-secret \
  --name "myapp/prod/database" \
  --description "Production database credentials" \
  --secret-string '{"username":"produser","password":"securepassword"}'
```

## 監視・ログ設定

### Prometheus監視
```yaml
# k8s/monitoring.yml
apiVersion: v1
kind: Service
metadata:
  name: app-metrics
  labels:
    app: myapp
spec:
  ports:
  - port: 9090
    name: metrics
  selector:
    app: myapp

---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: app-monitor
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### ログ設定（Fluentd）
```yaml
# k8s/fluentd-configmap.yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/myapp-*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name kubernetes
    </match>
```

## デプロイ手順

### 事前準備チェックリスト
```markdown
## デプロイ前確認
- [ ] テストが全て通過している
- [ ] セキュリティスキャンを実施済み
- [ ] データベースマイグレーションの準備
- [ ] 設定ファイルの更新
- [ ] ロールバック手順の確認
- [ ] 監視設定の確認
- [ ] 関係者への通知
```

### 本番デプロイ手順
```bash
#!/bin/bash
# 本番デプロイスクリプト

set -e

echo "Starting production deployment..."

# 1. 事前バックアップ
echo "Creating database backup..."
kubectl exec -it postgres-0 -- pg_dump myapp_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. メンテナンスモード開始
echo "Enabling maintenance mode..."
kubectl patch configmap app-config -p '{"data":{"maintenance_mode":"true"}}'

# 3. 新バージョンデプロイ
echo "Deploying new version..."
kubectl set image deployment/app-deployment app=myapp:$NEW_VERSION

# 4. ヘルスチェック
echo "Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/app-deployment

# 5. データベースマイグレーション
echo "Running database migrations..."
kubectl exec -it $(kubectl get pods -l app=myapp -o jsonpath='{.items[0].metadata.name}') -- npm run migrate

# 6. スモークテスト
echo "Running smoke tests..."
./scripts/smoke-tests.sh

# 7. メンテナンスモード解除
echo "Disabling maintenance mode..."
kubectl patch configmap app-config -p '{"data":{"maintenance_mode":"false"}}'

echo "Deployment completed successfully!"
```

### ロールバック手順
```bash
#!/bin/bash
# ロールバックスクリプト

set -e

echo "Starting rollback..."

# 1. メンテナンスモード開始
kubectl patch configmap app-config -p '{"data":{"maintenance_mode":"true"}}'

# 2. 前バージョンに戻す
kubectl rollout undo deployment/app-deployment

# 3. ヘルスチェック
kubectl wait --for=condition=available --timeout=300s deployment/app-deployment

# 4. データベースロールバック（必要に応じて）
# kubectl exec -it postgres-0 -- psql -d myapp_prod -f rollback.sql

# 5. メンテナンスモード解除
kubectl patch configmap app-config -p '{"data":{"maintenance_mode":"false"}}'

echo "Rollback completed!"
```

## 運用手順

### ヘルスチェック
```bash
#!/bin/bash
# ヘルスチェックスクリプト

# アプリケーションヘルスチェック
curl -f http://api.example.com/health || exit 1

# データベース接続確認
kubectl exec -it postgres-0 -- pg_isready

# Redis接続確認
kubectl exec -it redis-0 -- redis-cli ping

echo "All health checks passed!"
```

### ログ確認
```bash
# アプリケーションログ
kubectl logs -f deployment/app-deployment

# データベースログ
kubectl logs -f statefulset/postgres

# 特定エラーの検索
kubectl logs deployment/app-deployment | grep -i error

# 複数Podのログを同時表示
kubectl logs -f -l app=myapp --max-log-requests=10
```

### パフォーマンス監視
```bash
# リソース使用状況
kubectl top pods
kubectl top nodes

# アプリケーションメトリクス
curl http://api.example.com/metrics

# データベースパフォーマンス
kubectl exec -it postgres-0 -- psql -d myapp_prod -c "SELECT * FROM pg_stat_activity;"
```

## トラブルシューティング

### よくある問題と対処法
```markdown
## Pod起動失敗
**症状**: Podが`CrashLoopBackOff`状態
**確認**: `kubectl describe pod <pod-name>`
**対処**: 
- 環境変数の設定確認
- イメージの存在確認
- リソース制限の確認

## データベース接続エラー
**症状**: アプリケーションがDBに接続できない
**確認**: 
- Secretsの設定確認
- ネットワークポリシーの確認
- データベースPodの状態確認
**対処**:
- 接続文字列の確認
- ネットワーク設定の見直し

## 外部API接続エラー
**症状**: 外部サービスとの通信が失敗
**確認**:
- DNS解決の確認
- ファイアウォール設定
- APIキーの有効性
**対処**:
- ネットワークポリシーの更新
- プロキシ設定の確認
```

### 緊急時対応
```markdown
## 緊急時連絡先
- **技術責任者**: [連絡先]
- **インフラ担当**: [連絡先]
- **オンコール**: [連絡先]

## エスカレーション手順
1. 初期対応（30分以内）
2. 技術リード召集（1時間以内）
3. 事業責任者報告（2時間以内）
4. 外部ベンダー連携（必要に応じて）
```