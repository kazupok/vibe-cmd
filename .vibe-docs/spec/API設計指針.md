# API設計ガイドライン

## 概要

MaterCMSのAPIは、RESTfulとGraphQLの両方を提供し、一貫性のある直感的なインターフェースを目指しています。

## RESTful API設計原則

### URLパターン

```
/api/v1/workspaces                    # コレクション
/api/v1/workspaces/:id                # 単一リソース
/api/v1/workspaces/:id/members        # ネストされたリソース
/api/v1/workspaces/:id/members/:memberId  # ネストされた単一リソース
```

### HTTPメソッド

- `GET` - リソースの取得
- `POST` - リソースの作成
- `PUT` - リソースの完全な更新
- `PATCH` - リソースの部分的な更新
- `DELETE` - リソースの削除

### ステータスコード

```typescript
// 成功
200 OK              // 正常な取得・更新
201 Created         // リソース作成成功
204 No Content      // 削除成功

// クライアントエラー
400 Bad Request     // 不正なリクエスト
401 Unauthorized    // 認証が必要
403 Forbidden       // アクセス権限なし
404 Not Found       // リソースが見つからない
409 Conflict        // 競合（重複など）
422 Unprocessable Entity  // バリデーションエラー
429 Too Many Requests     // レート制限

// サーバーエラー
500 Internal Server Error  // サーバーエラー
503 Service Unavailable    // メンテナンス中
```

### レスポンス形式

#### 成功レスポンス

```json
{
  "data": {
    "id": "workspace-uuid",
    "type": "workspace",
    "attributes": {
      "name": "My Workspace",
      "slug": "my-workspace",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "relationships": {
      "owner": {
        "data": { "type": "user", "id": "user-uuid" }
      }
    }
  }
}
```

#### エラーレスポンス

```json
{
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "status": 422,
      "title": "Validation Failed",
      "detail": "The workspace name is required",
      "source": { "pointer": "/data/attributes/name" }
    }
  ]
}
```

### ページネーション

```json
{
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "links": {
    "self": "/api/v1/workspaces?page=1",
    "first": "/api/v1/workspaces?page=1",
    "last": "/api/v1/workspaces?page=5",
    "next": "/api/v1/workspaces?page=2",
    "prev": null
  }
}
```

### フィルタリング・ソート

```
GET /api/v1/workspaces?filter[status]=active&sort=-createdAt
GET /api/v1/sync-jobs?filter[status]=running&filter[workspace]=uuid
```

## GraphQL API設計

### スキーマ設計

```graphql
type Query {
  # 単一リソース取得
  workspace(id: ID!): Workspace
  user(id: ID!): User

  # リスト取得
  workspaces(
    first: Int
    after: String
    filter: WorkspaceFilter
    orderBy: WorkspaceOrderBy
  ): WorkspaceConnection!
}

type Mutation {
  # ワークスペース操作
  createWorkspace(input: CreateWorkspaceInput!): CreateWorkspacePayload!
  updateWorkspace(input: UpdateWorkspaceInput!): UpdateWorkspacePayload!
  deleteWorkspace(input: DeleteWorkspaceInput!): DeleteWorkspacePayload!
}

type Subscription {
  # リアルタイム更新
  syncJobUpdated(workspaceId: ID!): SyncJob!
}
```

### ペイロード設計

```graphql
type CreateWorkspacePayload {
  workspace: Workspace
  errors: [Error!]
  userErrors: [UserError!]
}

type UserError {
  field: [String!]
  message: String!
}
```

### Relay仕様準拠

```graphql
interface Node {
  id: ID!
}

type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}
```

## 認証・認可

### 認証ヘッダー

```http
# Bearer Token (JWT)
Authorization: Bearer <jwt-token>

# API Key
X-API-Key: mtr_1234567890abcdef
```

### JWT構造

```json
{
  "sub": "user-uuid",
  "workspaceId": "workspace-uuid",
  "role": "admin",
  "iat": 1704067200,
  "exp": 1704070800
}
```

## バージョニング

### URLベース（REST）

```
/api/v1/workspaces
/api/v2/workspaces  # 新バージョン
```

### ヘッダーベース（GraphQL）

```http
X-API-Version: 2024-01-01
```

## レート制限

### ヘッダー情報

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1704070800
X-RateLimit-Window: 3600
```

### レート制限の種類

- **ユーザー認証**: 1000リクエスト/時間
- **APIキー認証**: 10000リクエスト/時間
- **匿名アクセス**: 100リクエスト/時間
- **Notion API**: 3リクエスト/秒（内部制御）

### レート制限超過時

```json
{
  "errors": [
    {
      "code": "RATE_LIMIT_EXCEEDED",
      "status": 429,
      "title": "Too Many Requests",
      "detail": "Rate limit exceeded. Please retry after 1704070800"
    }
  ]
}
```

## エラーコード一覧

| コード                     | 説明                   |
| -------------------------- | ---------------------- |
| `VALIDATION_ERROR`         | 入力値検証エラー       |
| `AUTHENTICATION_REQUIRED`  | 認証が必要             |
| `INSUFFICIENT_PERMISSIONS` | 権限不足               |
| `RESOURCE_NOT_FOUND`       | リソースが見つからない |
| `DUPLICATE_RESOURCE`       | リソースの重複         |
| `RATE_LIMIT_EXCEEDED`      | レート制限超過         |
| `INTERNAL_ERROR`           | 内部エラー             |

## API設計のベストプラクティス

### 1. 一貫性

- 命名規則の統一（camelCase）
- 日付形式の統一（ISO 8601）
- IDの形式統一（UUID v4）

### 2. 拡張性

- フィールドの追加は後方互換性を保つ
- 非推奨フィールドは`deprecated`マーク
- 新機能はフィーチャーフラグで制御

### 3. パフォーマンス

- N+1問題の回避（DataLoader使用）
- 適切なキャッシュヘッダー
- 圧縮の有効化（gzip）

### 4. セキュリティ

- HTTPS必須
- CORS設定の適切な管理
- SQLインジェクション対策
- レート制限の実装

## OpenAPI仕様

```yaml
openapi: 3.0.0
info:
  title: MaterCMS API
  version: 1.0.0
  description: Notion integration content management system

servers:
  - url: https://api.matercms.com/v1
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKey:
      type: apiKey
      in: header
      name: X-API-Key

paths:
  /workspaces:
    get:
      summary: List workspaces
      security:
        - bearerAuth: []
        - apiKey: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
      responses:
        "200":
          description: Successful response
```
