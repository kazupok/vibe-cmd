# プロジェクトセットアップガイド

## 概要
新規プロジェクト開始時の初期設定とセットアップ手順

## プロジェクト基本情報

### プロジェクト名
[プロジェクト名を記入]

### 目的・背景
- **ビジネス目的**: [なぜこのプロジェクトが必要か]
- **技術的目的**: [解決したい技術課題]
- **対象ユーザー**: [想定ユーザー]

### スコープ
- **含まれるもの**: 
  - [機能1]
  - [機能2]
  - [機能3]

- **含まれないもの**: 
  - [除外する機能・要件]

## 技術スタック

### フロントエンド
```json
{
  "framework": "React 18.x",
  "language": "TypeScript 5.x",
  "bundler": "Vite",
  "styling": "Tailwind CSS",
  "stateManagement": "Zustand",
  "testing": "Vitest + React Testing Library"
}
```

### バックエンド
```json
{
  "runtime": "Node.js 18.x",
  "framework": "Express.js",
  "language": "TypeScript 5.x", 
  "database": "PostgreSQL",
  "orm": "Prisma",
  "authentication": "JWT",
  "testing": "Jest + Supertest"
}
```

### インフラ・DevOps
```json
{
  "containerization": "Docker",
  "cicd": "GitHub Actions",
  "monitoring": "Winston + Sentry",
  "deployment": "AWS/Vercel",
  "documentation": "TypeDoc + Storybook"
}
```

## 開発環境セットアップ

### 必要なツール
```bash
# Node.js バージョン管理
nvm install 18.17.0
nvm use 18.17.0

# パッケージマネージャー
npm install -g pnpm

# 開発ツール
npm install -g typescript
npm install -g @typescript-eslint/eslint-plugin
```

### リポジトリセットアップ
```bash
# プロジェクト初期化
git init
git remote add origin [リポジトリURL]

# 依存関係インストール
pnpm install

# 環境変数設定
cp .env.example .env.local
# 必要な環境変数を設定

# データベース初期化
docker-compose up -d postgres
pnpm prisma migrate dev
pnpm prisma generate
```

### IDEセットアップ（VSCode）
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### 推奨拡張機能
```json
// .vscode/extensions.json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "prisma.prisma",
    "ms-vscode.vscode-jest"
  ]
}
```

## プロジェクト構造

### ディレクトリ構成
```
project-root/
├── .vscode/                 # VSCode設定
├── .github/                 # GitHub Actions
├── docs/                    # プロジェクトドキュメント
├── src/
│   ├── components/          # 再利用可能コンポーネント
│   ├── pages/              # ページコンポーネント
│   ├── hooks/              # カスタムフック
│   ├── services/           # APIサービス
│   ├── stores/             # 状態管理
│   ├── types/              # 型定義
│   ├── utils/              # ユーティリティ
│   └── styles/             # スタイルファイル
├── server/
│   ├── controllers/        # APIコントローラー
│   ├── services/           # ビジネスロジック
│   ├── repositories/       # データアクセス
│   ├── middleware/         # ミドルウェア
│   ├── types/              # 型定義
│   └── utils/              # サーバーユーティリティ
├── tests/                  # テストファイル
├── docker/                 # Docker設定
└── scripts/                # ビルド・デプロイスクリプト
```

### 命名規則
```markdown
## ファイル・フォルダ
- **kebab-case**: ファイル名、フォルダ名
- **PascalCase**: コンポーネントファイル名

## コード
- **camelCase**: 変数名、関数名
- **PascalCase**: クラス名、インターフェース名、型名
- **SCREAMING_SNAKE_CASE**: 定数名
- **kebab-case**: CSS クラス名
```

## 品質管理設定

### ESLint設定
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### Prettier設定
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### package.json スクリプト
```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "server:dev": "tsx watch server/index.ts",
    "server:build": "tsc --project server/tsconfig.json",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  }
}
```

## CI/CD設定

### GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Type check
        run: pnpm type-check
      
      - name: Lint
        run: pnpm lint
      
      - name: Test
        run: pnpm test:coverage
      
      - name: Build
        run: pnpm build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploy logic here"
```

## 監視・ログ設定

### エラー監視（Sentry）
```typescript
// src/utils/sentry.ts
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### ログ設定（Winston）
```typescript
// server/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

## ドキュメント生成

### API文書（OpenAPI）
```yaml
# docs/api.yml
openapi: 3.0.0
info:
  title: "[プロジェクト名] API"
  version: 1.0.0
  description: "[プロジェクトの説明]"

paths:
  /api/health:
    get:
      summary: ヘルスチェック
      responses:
        '200':
          description: 正常
```

### コンポーネント文書（Storybook）
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-docs',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
```

## セキュリティ設定

### 環境変数管理
```bash
# .env.example
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# 認証
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# 外部API
API_BASE_URL="https://api.example.com"
API_KEY="your-api-key"

# 監視
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
```

### セキュリティヘッダー
```typescript
// server/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  }),
];
```

## チェックリスト

### セットアップ完了確認
- [ ] リポジトリの作成・クローン
- [ ] 環境変数の設定
- [ ] データベースの初期化
- [ ] 依存関係のインストール
- [ ] 開発サーバーの起動確認
- [ ] テストの実行確認
- [ ] ビルドの実行確認
- [ ] CI/CDパイプラインの設定
- [ ] 監視・ログ設定の確認
- [ ] ドキュメントの初期作成