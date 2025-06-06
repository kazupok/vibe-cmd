# API文書生成コマンド

## コマンド: `generate_api_docs`

### 目的
APIエンドポイントの仕様書を自動生成し、開発者とユーザーが理解しやすいドキュメントを作成する

### 実行内容
1. コードからAPIエンドポイントを抽出
2. パラメータ・レスポンス形式を分析
3. OpenAPI/Swagger形式で仕様書生成
4. 使用例とサンプルレスポンス追加
5. 既存ドキュメントとの統合

### 使用タイミング
- 新しいAPIエンドポイント追加時
- API仕様変更時
- リリース前のドキュメント更新時
- 外部連携のため

### 生成形式

#### OpenAPI 3.0 仕様書
```yaml
openapi: 3.0.0
info:
  title: User Management API
  version: 1.0.0
  description: ユーザー管理システムのAPI仕様書
  contact:
    name: Development Team
    email: dev@example.com

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

paths:
  /users:
    get:
      summary: ユーザー一覧取得
      description: 登録されているユーザーの一覧を取得します
      tags:
        - Users
      parameters:
        - name: page
          in: query
          description: ページ番号
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          description: 1ページあたりの件数
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 10
        - name: search
          in: query
          description: 検索キーワード
          required: false
          schema:
            type: string
      responses:
        '200':
          description: 取得成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/User'
                  pagination:
                    $ref: '#/components/schemas/Pagination'
              examples:
                success:
                  summary: 正常レスポンス例
                  value:
                    data:
                      - id: "1"
                        email: "user1@example.com"
                        name: "山田太郎"
                        createdAt: "2024-01-01T00:00:00Z"
                      - id: "2"
                        email: "user2@example.com"
                        name: "田中花子"
                        createdAt: "2024-01-02T00:00:00Z"
                    pagination:
                      page: 1
                      limit: 10
                      total: 25
                      totalPages: 3
        '400':
          description: リクエストエラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '500':
          description: サーバーエラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    post:
      summary: ユーザー作成
      description: 新しいユーザーを作成します
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            examples:
              example1:
                summary: 一般的な例
                value:
                  email: "newuser@example.com"
                  password: "securePassword123!"
                  name: "新規太郎"
      responses:
        '201':
          description: 作成成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: バリデーションエラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ValidationError'
        '409':
          description: メールアドレス重複エラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /users/{id}:
    get:
      summary: ユーザー詳細取得
      description: 指定されたIDのユーザー詳細情報を取得します
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          description: ユーザーID
          schema:
            type: string
      responses:
        '200':
          description: 取得成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          description: ユーザーが見つからない
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

    put:
      summary: ユーザー情報更新
      description: 指定されたIDのユーザー情報を更新します
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          description: ユーザーID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateUserRequest'
      responses:
        '200':
          description: 更新成功
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: バリデーションエラー
        '404':
          description: ユーザーが見つからない

    delete:
      summary: ユーザー削除
      description: 指定されたIDのユーザーを削除します
      tags:
        - Users
      parameters:
        - name: id
          in: path
          required: true
          description: ユーザーID
          schema:
            type: string
      responses:
        '204':
          description: 削除成功
        '404':
          description: ユーザーが見つからない

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          description: ユーザーID
          example: "1"
        email:
          type: string
          format: email
          description: メールアドレス
          example: "user@example.com"
        name:
          type: string
          description: ユーザー名
          example: "山田太郎"
        active:
          type: boolean
          description: アクティブ状態
          example: true
        createdAt:
          type: string
          format: date-time
          description: 作成日時
          example: "2024-01-01T00:00:00Z"
        updatedAt:
          type: string
          format: date-time
          description: 更新日時
          example: "2024-01-01T00:00:00Z"
      required:
        - id
        - email
        - name
        - active
        - createdAt
        - updatedAt

    CreateUserRequest:
      type: object
      properties:
        email:
          type: string
          format: email
          description: メールアドレス
          example: "newuser@example.com"
        password:
          type: string
          minLength: 8
          description: パスワード（8文字以上）
          example: "securePassword123!"
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: ユーザー名
          example: "新規太郎"
      required:
        - email
        - password
        - name

    UpdateUserRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: ユーザー名
          example: "更新太郎"
        active:
          type: boolean
          description: アクティブ状態
          example: true

    Pagination:
      type: object
      properties:
        page:
          type: integer
          description: 現在のページ番号
          example: 1
        limit:
          type: integer
          description: 1ページあたりの件数
          example: 10
        total:
          type: integer
          description: 総件数
          example: 25
        totalPages:
          type: integer
          description: 総ページ数
          example: 3
      required:
        - page
        - limit
        - total
        - totalPages

    Error:
      type: object
      properties:
        error:
          type: string
          description: エラーメッセージ
          example: "リクエストが不正です"
        code:
          type: string
          description: エラーコード
          example: "INVALID_REQUEST"
      required:
        - error
        - code

    ValidationError:
      type: object
      properties:
        error:
          type: string
          description: エラーメッセージ
          example: "バリデーションエラーが発生しました"
        code:
          type: string
          description: エラーコード
          example: "VALIDATION_ERROR"
        details:
          type: array
          items:
            type: object
            properties:
              field:
                type: string
                description: エラーフィールド
                example: "email"
              message:
                type: string
                description: フィールド固有のエラーメッセージ
                example: "有効なメールアドレスを入力してください"
      required:
        - error
        - code
        - details

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []
```

### 使用例とコードサンプル

#### JavaScript/TypeScript例
```typescript
// ユーザー一覧取得
const getUsers = async (page = 1, limit = 10, search = '') => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search })
  });

  const response = await fetch(`/api/users?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// ユーザー作成
const createUser = async (userData) => {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
};
```

#### curl例
```bash
# ユーザー一覧取得
curl -X GET "https://api.example.com/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# ユーザー作成
curl -X POST "https://api.example.com/v1/users" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "securePassword123!",
    "name": "新規太郎"
  }'
```

### 生成ルール

#### 必須要素
- [ ] エンドポイント一覧
- [ ] HTTPメソッド
- [ ] パラメータ仕様
- [ ] レスポンス形式
- [ ] エラーレスポンス
- [ ] 認証方法
- [ ] 使用例

#### 品質要件
- [ ] 実装と仕様の一致
- [ ] 分かりやすい説明
- [ ] 実用的な例
- [ ] 最新の情報
- [ ] 一貫した記述形式

### 自動化設定

#### CI/CDでの自動生成
```yaml
# .github/workflows/api-docs.yml
name: Generate API Documentation

on:
  push:
    branches: [main]
    paths: ['src/controllers/**', 'src/routes/**']

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Generate OpenAPI spec
        run: npm run generate:api-docs
      
      - name: Deploy to docs site
        run: npm run deploy:docs
```

### 注意点
- 実装とドキュメントの同期を保つ
- セキュリティ情報の適切な扱い
- バージョン管理の考慮
- ユーザーフレンドリーな説明
- 継続的な更新・メンテナンス