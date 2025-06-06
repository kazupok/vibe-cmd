# コーディング規約

## 概要
会社全体で適用するコーディング規約とベストプラクティス

## TypeScript/JavaScript

### 基本ルール
- セミコロンは必須
- シングルクォートを使用
- インデントは2スペース
- 行末の空白は削除

### 型安全性
```typescript
// Good: 明示的な型定義
interface User {
  id: string;
  name: string;
  email: string;
}

// Good: 型ガード
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// Avoid: any型の使用
const data: any = fetchData(); // ❌
```

### エラーハンドリング
```typescript
// Good: Result型パターン
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function fetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await userRepository.findById(id);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
```

## Git規約

### コミットメッセージ
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type
- feat: 新機能
- fix: バグ修正
- docs: ドキュメント
- style: コードスタイル
- refactor: リファクタリング
- test: テスト
- chore: その他

#### 例
```
feat(auth): add OAuth2 login functionality

Implement Google OAuth2 integration for user authentication.
Includes redirect handling and token validation.

Closes #123
```