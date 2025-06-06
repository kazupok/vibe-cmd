# システムアーキテクチャ

## 概要

MaterCMSは、ドメイン駆動設計（DDD）の原則に基づいて構築された、モジュラーなマイクロサービスアーキテクチャを採用しています。

## パッケージ

- turborepo
- pnpm

## アーキテクチャ層

### 1. プレゼンテーション層

- **Web Application** (Next.js)

  - サーバーサイドレンダリング
  - React Server Components
  - Tailwind CSS

- **API Gateway**
  - 認証・認可
  - レート制限
  - リクエストルーティング

### 2. アプリケーション層

- **GraphQL API**

  - Apollo Server
  - スキーマファースト開発
  - DataLoader for N+1問題解決

- **REST API**
  - Express.js
  - OpenAPI仕様
  - バージョニング対応

### 3. ドメイン層

- **Core Domain** (`packages/core`)
  - ユーザー管理
  - ワークスペース管理
  - Notion統合
  - データ同期
  - API管理

### 4. インフラストラクチャ層

- **データベース**

  - PostgreSQL (メインデータ)
  - Redis (キャッシュ・セッション)
  - S3互換ストレージ (ファイル)

- **メッセージング**
  - RabbitMQ/AWS SQS
  - イベント駆動アーキテクチャ

## モジュール構成

```
packages/
├── core/                    # ドメインロジック
│   ├── user-management/    # ユーザー管理
│   ├── integration/        # Notion統合
│   ├── data-synchronization/ # データ同期
│   ├── api-management/     # API管理
│   └── shared/            # 共有コンポーネント
├── api/                    # APIサーバー
├── web/                    # Webアプリケーション
├── sdk/                    # TypeScript SDK
└── cli/                    # CLIツール
```

## DDDパターンの実装

### エンティティ

```typescript
export abstract class Entity<T> {
  protected readonly _id: T;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;

  equals(entity: Entity<T>): boolean {
    return this._id === entity._id;
  }
}
```

### 値オブジェクト

```typescript
export abstract class ValueObject<T> {
  protected readonly value: T;

  equals(vo: ValueObject<T>): boolean {
    return JSON.stringify(this.value) === JSON.stringify(vo.value);
  }
}
```

### リポジトリパターン

```typescript
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### ドメインサービス

- ビジネスロジックのカプセル化
- 複数のエンティティにまたがる処理
- 外部サービスとの統合

## 非同期処理アーキテクチャ

### ジョブキュー

```typescript
interface Job {
  id: string;
  type: JobType;
  payload: unknown;
  attempts: number;
  createdAt: Date;
}
```

### イベント駆動

```typescript
interface DomainEvent {
  aggregateId: string;
  eventType: string;
  eventData: unknown;
  occurredAt: Date;
}
```

## セキュリティアーキテクチャ

### 認証フロー

1. JWT for ユーザー認証
2. API Key for サービス認証
3. OAuth2 for 外部サービス連携

### 暗号化

- AES-256-GCM for データ暗号化
- Argon2 for パスワードハッシュ
- TLS 1.3 for 通信暗号化

## スケーラビリティ

### 水平スケーリング

- ステートレスなアプリケーションサーバー
- データベースレプリケーション
- キャッシュクラスター

### パフォーマンス最適化

- CDN for 静的アセット
- データベースインデックス最適化
- クエリ結果のキャッシング

## モニタリング・可観測性

### ロギング

- 構造化ログ (JSON)
- ログレベル管理
- 集中ログ管理

### メトリクス

- アプリケーションメトリクス
- インフラメトリクス
- ビジネスメトリクス

### トレーシング

- 分散トレーシング
- リクエストの追跡
- パフォーマンスボトルネックの特定
