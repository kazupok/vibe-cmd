# セキュリティガイドライン

## 概要
会社全体のセキュリティ要件と実装ガイドライン

## 認証・認可

### JWT実装
```typescript
// Good: セキュアなJWT設定
const jwtConfig = {
  algorithm: 'RS256' as const,
  expiresIn: '15m',
  issuer: 'your-company.com',
  audience: 'your-app.com'
};

// Good: リフレッシュトークンパターン
interface TokenPair {
  accessToken: string;  // 短期間（15分）
  refreshToken: string; // 長期間（7日）
}
```

### パスワード管理
```typescript
import bcrypt from 'bcrypt';

// Good: 適切なソルトラウンド
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Good: パスワード要件
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

## データ保護

### 入力検証
```typescript
import { z } from 'zod';

// Good: スキーマベース検証
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(0).max(150)
});

function validateUser(data: unknown) {
  return userSchema.safeParse(data);
}
```

### SQLインジェクション対策
```typescript
// Good: パラメータ化クエリ
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// Bad: 文字列結合
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'` // ❌
);
```

## 環境変数管理

### 必須設定
```typescript
// .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=your-super-secret-key
API_KEY=your-api-key
NODE_ENV=development
```

### 検証
```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'staging', 'production'])
});

export const env = envSchema.parse(process.env);
```

## セキュリティヘッダー
```typescript
// Express.js example
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```