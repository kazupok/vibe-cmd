# エラーハンドリングのベストプラクティス

## 概要

エラーハンドリングは、堅牢で保守性の高いアプリケーションを構築する上で重要な要素です。本プロジェクトでは、Resultパターンを中心としたエラーハンドリング戦略を採用しています。

## Resultパターン

### 基本的な使い方

```typescript
// 成功と失敗を明示的に扱う
function divide(a: number, b: number): Result<number> {
  if (b === 0) {
    return Result.fail<number>('Division by zero');
  }
  return Result.ok<number>(a / b);
}

// 使用例
const result = divide(10, 2);
if (result.isSuccess()) {
  console.log(result.getValue()); // 5
} else {
  console.error(result.getErrorValue());
}
```

### チェーンとコンビネーション

```typescript
// 複数のResultを組み合わせる
function createUserWorkspace(
  email: string,
  workspaceName: string,
  workspaceSlug: string
): Result<{ user: User; workspace: Workspace }> {
  const emailResult = Email.create(email);
  if (emailResult.isFailure()) {
    return Result.fail(emailResult.getErrorValue());
  }

  const userResult = User.create({
    email: emailResult.getValue(),
    name: 'New User'
  });
  if (userResult.isFailure()) {
    return Result.fail(userResult.getErrorValue());
  }

  const workspaceResult = Workspace.create({
    name: workspaceName,
    slug: workspaceSlug
  });
  if (workspaceResult.isFailure()) {
    return Result.fail(workspaceResult.getErrorValue());
  }

  return Result.ok({
    user: userResult.getValue(),
    workspace: workspaceResult.getValue()
  });
}
```

### Result.combine の使用

```typescript
// 複数のResultを一度に検証
const results = Result.combine([
  Email.create(email),
  WorkspaceName.create(name),
  WorkspaceSlug.create(slug)
]);

if (results.isFailure()) {
  return Result.fail(results.getErrorValue());
}

const [emailVO, nameVO, slugVO] = results.getValue();
```

## カスタムエラークラス

### ドメインエラーの定義

```typescript
export abstract class DomainError extends Error {
  protected constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UserNotFoundError extends DomainError {
  constructor(public readonly userId: string) {
    super(`User with id ${userId} not found`);
  }
}

export class InsufficientPermissionsError extends DomainError {
  constructor(
    public readonly userId: string,
    public readonly action: string,
    public readonly resource: string
  ) {
    super(`User ${userId} lacks permission to ${action} on ${resource}`);
  }
}

export class BusinessRuleViolationError extends DomainError {
  constructor(
    public readonly rule: string,
    public readonly details?: any
  ) {
    super(`Business rule violation: ${rule}`);
  }
}
```

### アプリケーションエラー

```typescript
export class ValidationError extends Error {
  constructor(
    public readonly errors: Array<{
      field: string;
      message: string;
      code?: string;
    }>
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends Error {
  constructor(
    public readonly resource: string,
    public readonly conflictingField: string,
    public readonly value: any
  ) {
    super(`${resource} with ${conflictingField}="${value}" already exists`);
    this.name = 'ConflictError';
  }
}
```

## エラーハンドリングのレイヤー

### ドメイン層

```typescript
export class WorkspaceService {
  async inviteMember(
    workspaceId: string,
    inviterUserId: string,
    inviteeEmail: string,
    role: string
  ): Promise<Result<void>> {
    // 早期リターンでエラーを処理
    const workspace = await this.workspaceRepo.findById(workspaceId);
    if (!workspace) {
      return Result.fail(`Workspace ${workspaceId} not found`);
    }

    const inviter = await this.membershipRepo.findByWorkspaceAndUser(
      workspaceId,
      inviterUserId
    );
    if (!inviter) {
      return Result.fail('You are not a member of this workspace');
    }

    // ビジネスルールの検証
    if (!inviter.canInviteWithRole(role)) {
      return Result.fail(
        `You don't have permission to invite users with role: ${role}`
      );
    }

    // 処理を続行...
    return Result.ok();
  }
}
```

### アプリケーション層

```typescript
export class WorkspaceController {
  async inviteMember(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.workspaceService.inviteMember(
        req.params.workspaceId,
        req.userId, // 認証ミドルウェアから
        req.body.email,
        req.body.role
      );

      if (result.isFailure()) {
        // エラーメッセージに基づいて適切なHTTPステータスを返す
        const error = result.getErrorValue();
        if (error.includes('not found')) {
          res.status(404).json({ error });
        } else if (error.includes('permission')) {
          res.status(403).json({ error });
        } else {
          res.status(400).json({ error });
        }
        return;
      }

      res.status(200).json({ message: 'Invitation sent successfully' });
    } catch (error) {
      // 予期しないエラー
      logger.error('Unexpected error in inviteMember', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
```

### グローバルエラーハンドラー

```typescript
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({
    error: err,
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      userId: req.userId
    }
  });

  if (err instanceof ValidationError) {
    res.status(422).json({
      error: 'Validation failed',
      details: err.errors
    });
    return;
  }

  if (err instanceof UserNotFoundError) {
    res.status(404).json({
      error: 'User not found',
      userId: err.userId
    });
    return;
  }

  if (err instanceof InsufficientPermissionsError) {
    res.status(403).json({
      error: 'Insufficient permissions',
      details: {
        action: err.action,
        resource: err.resource
      }
    });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({
      error: 'Resource conflict',
      details: {
        resource: err.resource,
        field: err.conflictingField
      }
    });
    return;
  }

  // デフォルトのエラーレスポンス
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}
```

## 非同期エラーハンドリング

### Promise の適切な処理

```typescript
// 悪い例
async function badExample() {
  doSomethingAsync(); // Promiseが処理されない
}

// 良い例
async function goodExample() {
  try {
    await doSomethingAsync();
  } catch (error) {
    logger.error('Failed to do something async', error);
    // エラーを適切に処理
  }
}
```

### AsyncWrapper パターン

```typescript
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 使用例
router.post(
  '/workspaces',
  asyncHandler(async (req, res) => {
    const result = await createWorkspace(req.body);
    res.json(result);
  })
);
```

## ログとモニタリング

### 構造化ログ

```typescript
interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: {
    userId?: string;
    workspaceId?: string;
    requestId?: string;
    [key: string]: any;
  };
}

export class Logger {
  error(message: string, error?: Error, context?: any): void {
    const log: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context
    };

    console.error(JSON.stringify(log));
    // 外部ログサービスに送信
  }
}
```

## エラーリカバリー戦略

### リトライメカニズム

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts: number;
    backoff: 'exponential' | 'linear';
    initialDelay: number;
    maxDelay: number;
  }
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < options.maxAttempts - 1) {
        const delay = calculateDelay(attempt, options);
        await sleep(delay);
      }
    }
  }
  
  throw lastError!;
}

// 使用例
const result = await withRetry(
  () => notionClient.databases.query({ database_id: dbId }),
  {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000
  }
);
```

### サーキットブレーカー

```typescript
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number,
    private timeout: number
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private shouldAttemptReset(): boolean {
    return this.lastFailureTime && 
      (Date.now() - this.lastFailureTime.getTime()) > this.timeout;
  }
}
```

## ベストプラクティスまとめ

1. **早期リターン**: エラー条件を早期にチェックして返す
2. **明示的なエラー型**: Resultパターンまたはカスタムエラークラスを使用
3. **エラーの文脈**: エラーに十分な情報を含める
4. **適切なログ**: 構造化ログでデバッグを容易に
5. **優雅な劣化**: 部分的な失敗でもサービスを継続
6. **ユーザーフレンドリー**: 技術的な詳細を隠蔽したメッセージ
7. **監視とアラート**: 重要なエラーを即座に検知