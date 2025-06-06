# セキュリティ要件

## 概要

MaterCMSのセキュリティ要件は、OWASP Top 10に基づき、データの機密性、完全性、可用性を確保することを目的としています。

## 認証・認可

### 認証要件

1. **パスワード要件**
   - 最小12文字
   - 大文字・小文字・数字・特殊文字を含む
   - 過去5回のパスワードの再利用禁止
   - Argon2によるハッシュ化

2. **多要素認証（MFA）**
   - TOTP（Time-based One-Time Password）対応
   - バックアップコードの生成
   - デバイス記憶機能（30日間）

3. **セッション管理**
   - JWT有効期限：1時間（アクセストークン）
   - リフレッシュトークン：7日間
   - 同時セッション数制限：5デバイス

### 認可要件

1. **ロールベースアクセス制御（RBAC）**
```typescript
enum Permission {
  // ワークスペース
  WORKSPACE_VIEW = 'workspace:view',
  WORKSPACE_EDIT = 'workspace:edit',
  WORKSPACE_DELETE = 'workspace:delete',
  
  // メンバー管理
  MEMBER_INVITE = 'member:invite',
  MEMBER_REMOVE = 'member:remove',
  MEMBER_EDIT_ROLE = 'member:edit_role',
  
  // Notion統合
  INTEGRATION_VIEW = 'integration:view',
  INTEGRATION_MANAGE = 'integration:manage',
  
  // API管理
  API_KEY_CREATE = 'api_key:create',
  API_KEY_REVOKE = 'api_key:revoke'
}
```

2. **ロール権限マトリックス**
| ロール | 権限 |
|--------|------|
| Owner | 全権限 |
| Admin | 削除以外の全権限 |
| Editor | 表示・編集権限 |
| Viewer | 表示権限のみ |

## データ保護

### 暗号化

1. **保存時の暗号化**
   - AES-256-GCM for 機密データ
   - 暗号化対象：
     - Notion統合トークン
     - APIキー
     - 個人情報（PII）

```typescript
interface EncryptedField {
  algorithm: 'AES-256-GCM';
  iv: string;         // Base64
  authTag: string;    // Base64
  encrypted: string;  // Base64
}
```

2. **転送時の暗号化**
   - TLS 1.3必須
   - HSTS有効化
   - 証明書ピンニング（モバイルアプリ）

3. **キー管理**
   - AWS KMS / HashiCorp Vaultを使用
   - キーローテーション：90日ごと
   - キーの階層構造

### データマスキング

```typescript
// APIレスポンスでのマスキング
{
  "apiKey": "mtr_1234************efgh",
  "email": "u***@example.com",
  "creditCard": "****-****-****-1234"
}
```

## APIセキュリティ

### レート制限

```typescript
interface RateLimitConfig {
  anonymous: {
    requests: 100,
    window: '1h'
  },
  authenticated: {
    requests: 1000,
    window: '1h'
  },
  apiKey: {
    requests: 10000,
    window: '1h'
  },
  // Notion API用の別途制限
  notionApi: {
    requests: 3,
    window: '1s'
  }
}
```

### 入力検証

1. **スキーマ検証**
```typescript
import { z } from 'zod';

const WorkspaceSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  settings: z.record(z.unknown())
});
```

2. **SQLインジェクション対策**
   - パラメータ化クエリの使用
   - ORMによる自動エスケープ
   - 生SQLの禁止

3. **XSS対策**
   - Content Security Policy（CSP）
   - 出力エスケープ
   - React の自動エスケープ機能

### CORS設定

```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://app.matercms.com',
      'https://localhost:3000' // 開発環境
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 86400 // 24時間
};
```

## 監査・ログ

### 監査ログ要件

1. **記録対象イベント**
   - ログイン/ログアウト
   - 権限変更
   - データアクセス（機密データ）
   - 設定変更
   - APIキー操作

2. **ログ形式**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "userId": "user-uuid",
  "workspaceId": "workspace-uuid",
  "action": "MEMBER_ROLE_CHANGED",
  "resource": "workspace_membership",
  "resourceId": "membership-uuid",
  "details": {
    "oldRole": "editor",
    "newRole": "admin",
    "targetUserId": "target-user-uuid"
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

3. **ログ保持期間**
   - 監査ログ：3年間
   - アクセスログ：90日間
   - エラーログ：30日間

## 脆弱性管理

### 依存関係の管理

1. **自動スキャン**
   - npm audit（週次）
   - Dependabot有効化
   - Snyk統合

2. **パッチ適用**
   - Critical：24時間以内
   - High：72時間以内
   - Medium：1週間以内

### ペネトレーションテスト

- 年次実施
- 新機能リリース前
- 重大な変更後

## インシデント対応

### 対応フロー

1. **検知**
   - 自動アラート
   - ユーザー報告
   - 定期監査

2. **評価**
   - 影響範囲の特定
   - 重要度の判定
   - 対応優先度の決定

3. **対応**
   - 即時対応（隔離・遮断）
   - 根本原因の調査
   - 修正の実装

4. **報告**
   - 影響を受けたユーザーへの通知
   - 規制当局への報告（必要に応じて）
   - 事後レビュー

## コンプライアンス

### 準拠規格

1. **GDPR（EU一般データ保護規則）**
   - データポータビリティ
   - 忘れられる権利
   - 明示的な同意

2. **SOC 2 Type II**
   - セキュリティ
   - 可用性
   - 処理の完全性
   - 機密性

### データ保持・削除

```typescript
interface DataRetentionPolicy {
  userAccount: '削除後30日間保持',
  auditLogs: '3年間',
  backups: '90日間',
  tempFiles: '24時間'
}
```

## セキュリティチェックリスト

- [ ] HTTPS強制
- [ ] セキュリティヘッダー設定
- [ ] CSRF対策
- [ ] クリックジャッキング対策
- [ ] セッション固定攻撃対策
- [ ] ディレクトリトラバーサル対策
- [ ] XXE攻撃対策
- [ ] SSRF対策
- [ ] タイミング攻撃対策
- [ ] ブルートフォース対策