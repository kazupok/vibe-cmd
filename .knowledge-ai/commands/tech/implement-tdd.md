# TDD実装コマンド

## コマンド: `implement_tdd`

### 目的
テスト駆動開発（TDD）のRed-Green-Refactorサイクルを実践し、高品質なコードを効率的に実装する

### 実行内容
1. 要件からテストケース生成
2. 失敗するテストコード作成（Red）
3. 最小実装コード生成（Green）
4. リファクタリング提案（Refactor）
5. 次のテストケース提案

### 使用タイミング
- 新機能実装時
- バグ修正時
- リファクタリング時

### TDDサイクル

#### Phase 1: Red（失敗するテスト作成）
```typescript
// 例: ユーザー作成機能のテスト
describe('User', () => {
  it('should create user with valid email and password', () => {
    const email = 'test@example.com';
    const password = 'securePassword123!';
    
    const user = User.create(email, password);
    
    expect(user.getEmail()).toBe(email);
    expect(user.isActive()).toBe(true);
  });
  
  it('should throw error for invalid email', () => {
    const invalidEmail = 'invalid-email';
    const password = 'securePassword123!';
    
    expect(() => User.create(invalidEmail, password))
      .toThrow(InvalidEmailError);
  });
  
  it('should throw error for weak password', () => {
    const email = 'test@example.com';
    const weakPassword = '123';
    
    expect(() => User.create(email, weakPassword))
      .toThrow(WeakPasswordError);
  });
});
```

#### Phase 2: Green（最小実装）
```typescript
export class User {
  constructor(
    private email: string,
    private password: string,
    private active: boolean = true
  ) {
    if (!this.isValidEmail(email)) {
      throw new InvalidEmailError(email);
    }
    if (!this.isValidPassword(password)) {
      throw new WeakPasswordError();
    }
  }

  static create(email: string, password: string): User {
    return new User(email, password);
  }

  getEmail(): string {
    return this.email;
  }

  isActive(): boolean {
    return this.active;
  }

  private isValidEmail(email: string): boolean {
    return email.includes('@') && email.includes('.');
  }

  private isValidPassword(password: string): boolean {
    return password.length >= 8;
  }
}

export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super('Password must be at least 8 characters');
  }
}
```

#### Phase 3: Refactor（改善）
```typescript
// 改善提案
// 1. Email値オブジェクトの分離
export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValid(value)) {
      throw new InvalidEmailError(value);
    }
  }

  static create(value: string): Email {
    return new Email(value);
  }

  getValue(): string {
    return this.value;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 2. Password値オブジェクトの分離
export class Password {
  private constructor(private readonly hashedValue: string) {}

  static create(plainPassword: string): Password {
    if (!this.isValid(plainPassword)) {
      throw new WeakPasswordError();
    }
    const hashedValue = this.hash(plainPassword);
    return new Password(hashedValue);
  }

  private static isValid(password: string): boolean {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password) &&
           /[^A-Za-z0-9]/.test(password);
  }

  private static hash(password: string): string {
    // 実際にはbcryptなどを使用
    return `hashed_${password}`;
  }

  getHashedValue(): string {
    return this.hashedValue;
  }
}

// 3. 改善されたUserクラス
export class User {
  private constructor(
    private readonly id: UserId,
    private email: Email,
    private password: Password,
    private active: boolean = true
  ) {}

  static create(email: string, password: string): User {
    return new User(
      UserId.generate(),
      Email.create(email),
      Password.create(password)
    );
  }

  getEmail(): string {
    return this.email.getValue();
  }

  isActive(): boolean {
    return this.active;
  }

  changeEmail(newEmail: string): void {
    this.email = Email.create(newEmail);
  }
}
```

### テストケース生成パターン

#### 正常系テスト
- ハッピーパス
- 境界値
- 典型的な使用例

#### 異常系テスト
- 無効な入力値
- null/undefined
- 空文字列・空配列
- 範囲外の値

#### エッジケース
- 最小値・最大値
- 特殊文字
- 異常なサイズのデータ
- 並行処理

### TDDベストプラクティス

#### テスト作成指針
```markdown
## FIRST原則
- **Fast**: 高速に実行される
- **Independent**: 独立している
- **Repeatable**: 再実行可能
- **Self-Validating**: 自己検証できる
- **Timely**: タイムリーに作成される
```

#### 実装指針
```markdown
## Red Phase
- 最初は必ず失敗させる
- 1つのテストに1つのアサーション
- テストの意図を明確にする

## Green Phase
- 最小限の実装で通す
- 重複を恐れない
- とにかく通すことを優先

## Refactor Phase
- 重複を除去
- 意図を明確にする
- パフォーマンスを考慮
- すべてのテストが通ることを確認
```

### 注意点
- テストファーストで考える
- 1サイクルは短時間（5-10分）で完了
- リファクタリング時はテストを通し続ける
- テストコード自体も保守対象
- 過度なテストは避ける（適切な粒度）

### 生産性指標
- テストカバレッジ: 80%以上
- テスト実行時間: 数秒以内
- Red-Green-Refactorサイクル: 10分以内
- バグ検出率: 早期発見90%以上