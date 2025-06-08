# Git コンフリクト解消ベストプラクティス

## 概要

GitHubでのプルリクエスト作成時やマージ時に発生するコンフリクトを安全かつ効率的に解消するためのガイドラインです。データ損失を防ぎ、コードの整合性を維持しながらチーム開発を円滑に進めるためのベストプラクティスを定義します。

## コンフリクトの種類と対処法

### 1. マージコンフリクト

```bash
# 典型的なマージコンフリクト表示
<<<<<<< HEAD
// 自分の変更
const apiEndpoint = 'https://api.matercms.com/v2';
=======
// 他の人の変更
const apiEndpoint = 'https://api.matercms.com/v1';
>>>>>>> feature/api-update
```

### 2. ファイル削除・移動コンフリクト

```bash
# ファイルが移動または削除された場合
CONFLICT (rename/delete): src/utils/helper.ts deleted in HEAD and renamed
to src/shared/helper.ts in feature/refactor-utils.
```

### 3. バイナリファイルコンフリクト

```bash
# 画像ファイルなどのバイナリコンフリクト
warning: Cannot merge binary files: assets/logo.png (HEAD vs. feature/design)
```

## 安全なコンフリクト解消手順

### Phase 1: 事前準備

```bash
# 1. 現在の作業を安全に保存
git stash push -m "作業中の変更を一時保存"

# 2. 最新のdevelopブランチを取得
git checkout develop
git pull origin develop

# 3. 作業ブランチに戻って最新の状態を確認
git checkout feature/your-branch
git status
```

### Phase 2: コンフリクト発生の確認

```bash
# rebaseまたはmergeでコンフリクトを発生させる
git rebase develop
# または
git merge develop

# コンフリクトファイルの一覧確認
git status
git diff --name-only --diff-filter=U
```

### Phase 3: コンフリクトファイルの解析

```bash
# 各ファイルの詳細なコンフリクト内容を確認
git diff HEAD~1 src/conflicted-file.ts
git log --oneline --graph develop..HEAD
```

### Phase 4: 段階的なコンフリクト解消

#### 4.1 自動解消可能なケース

```bash
# 単純な改行・フォーマットの差異
git checkout --theirs package-lock.json
git checkout --ours .env.local

# 特定の戦略で自動解消
git merge -X ours develop          # 自分の変更を優先
git merge -X theirs develop        # 相手の変更を優先
```

#### 4.2 手動解消が必要なケース

```typescript
// ✅ 良い解消例: 両方の機能を統合
// 元のコンフリクト:
// <<<<<<< HEAD
// function calculatePrice(base: number): number {
//   return base * 1.1; // 10%税込み
// }
// =======
// function calculatePrice(base: number, tax: number = 0.08): number {
//   return base * (1 + tax);
// }
// >>>>>>> feature/tax-configurable

// 解消後:
function calculatePrice(base: number, tax: number = 0.1): number {
  return base * (1 + tax); // デフォルト10%、設定可能
}
```

### Phase 5: 解消後の検証

```bash
# 1. 解消完了をGitに通知
git add src/conflicted-file.ts
git add .

# 2. コンパイル・テストで動作確認
pnpm build
pnpm test
pnpm check-types
pnpm lint

# 3. 論理的整合性の確認
pnpm test:integration
pnpm test:e2e
```

## コンフリクト解消の判断基準

### 1. 機能の優先順位

```typescript
// 優先順位の考え方
enum ConflictResolutionPriority {
  SECURITY = 1, // セキュリティ関連は最優先
  BREAKING_CHANGE = 2, // 破壊的変更の回避
  BUSINESS_LOGIC = 3, // ビジネスロジックの整合性
  PERFORMANCE = 4, // パフォーマンス最適化
  REFACTORING = 5, // リファクタリング・整理
  STYLE = 6, // スタイル・フォーマット
}
```

### 2. データの整合性確保

```typescript
// ❌ 悪い例: データ構造の不整合
interface User {
  id: string; // ブランチA
  uuid: string; // ブランチB - 同じ意味だが名前が違う
  name: string;
}

// ✅ 良い例: 統一された構造
interface User {
  id: string; // 統一: idに決定
  name: string;
  // 移行期間中は両方をサポート
  get uuid(): string;
}
```

### 3. APIの後方互換性

```typescript
// コンフリクト解消時のAPI設計
class WorkspaceService {
  // ✅ 良い例: 両方の変更を受け入れる
  async getWorkspace(
    // ブランチAの変更: ID指定
    id?: string,
    // ブランチBの変更: slug指定
    slug?: string,
  ): Promise<Workspace> {
    if (id) return this.findById(id);
    if (slug) return this.findBySlug(slug);
    throw new Error("ID or slug is required");
  }
}
```

## 複雑なコンフリクトの対処戦略

### 1. 大規模なリファクタリングコンフリクト

```bash
# 段階的なマージ戦略
git checkout feature/large-refactor
git rebase -i develop~10  # 細かいコミットに分割

# 各コミットごとに個別マージ
git cherry-pick commit1
# コンフリクト解消
git cherry-pick commit2
# コンフリクト解消...
```

### 2. データベーススキーマの競合

```typescript
// マイグレーションの競合解消
// ブランチA: カラム追加
// ブランチB: カラム名変更

// 解消方針: 段階的移行
// 1. まず新カラムを追加（ブランチA）
// 2. データ移行
// 3. 古いカラムを削除（ブランチB）

// 統合マイグレーション
export async function up(schema: Schema) {
  // Phase 1: 新カラム追加
  await schema.table("workspaces", (table) => {
    table.string("workspace_slug").nullable();
  });

  // Phase 2: データ移行
  await schema.raw(`
    UPDATE workspaces 
    SET workspace_slug = slug 
    WHERE workspace_slug IS NULL
  `);

  // Phase 3: 制約追加・古いカラム削除
  await schema.table("workspaces", (table) => {
    table.string("workspace_slug").notNullable().alter();
    table.dropColumn("slug");
  });
}
```

### 3. 設定ファイルの競合

```bash
# package.jsonなどの設定ファイル
# 手動マージではなくツールを活用

# 1. 自動マージツール使用
npx json-merge package.json.HEAD package.json.MERGE_HEAD

# 2. 依存関係の整合性確認
pnpm install
pnpm audit fix

# 3. lockファイルの再生成
rm pnpm-lock.yaml
pnpm install
```

## チーム協働でのコンフリクト予防

### 1. プルリクエスト作成時の事前チェック

```bash
# PRを作成する前の必須確認
#!/bin/bash
# scripts/pre-pr-check.sh

echo "🔍 プルリクエスト事前チェック開始..."

# 1. 最新のdevelopとの差分確認
git fetch origin develop
CONFLICTS=$(git merge-tree $(git merge-base HEAD origin/develop) HEAD origin/develop)

if [ -n "$CONFLICTS" ]; then
  echo "⚠️  潜在的なコンフリクトが検出されました"
  echo "$CONFLICTS"
  echo "💡 git rebase origin/develop を実行してコンフリクトを解消してください"
  exit 1
fi

# 2. 品質チェック
pnpm lint && pnpm test && pnpm build

echo "✅ 事前チェック完了。プルリクエストを作成できます"
```

### 2. コンフリクト回避のコミット戦略

```bash
# 小さく頻繁なコミット
git add src/components/
git commit -m "feat: WorkspaceCard コンポーネント追加"

git add src/hooks/
git commit -m "feat: useWorkspace カスタムフック追加"

git add src/pages/
git commit -m "feat: ワークスペース一覧ページ実装"

# 定期的なrebase
git rebase origin/develop
```

### 3. ファイル変更の調整

```typescript
// 大きなファイルの同時編集を避ける工夫

// ❌ 悪い例: 1つのファイルに全機能
// src/services/workspace-service.ts (500行)

// ✅ 良い例: 機能別ファイル分割
// src/services/workspace/
//   ├── workspace-creator.ts
//   ├── workspace-updater.ts
//   ├── workspace-deleter.ts
//   └── index.ts
```

## 緊急時のコンフリクト対応

### 1. ホットフィックスでのコンフリクト

```bash
# 本番緊急修正時のコンフリクト対応
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 修正実装...

# developとのコンフリクト最小化
git fetch origin develop
git rebase origin/develop

# 両ブランチに反映
git checkout main
git merge hotfix/critical-security-fix
git push origin main

git checkout develop
git merge hotfix/critical-security-fix
git push origin develop
```

### 2. ロールバック時の対応

```bash
# 問題のあるマージをロールバック
git revert -m 1 abc123def  # マージコミットのロールバック

# または、より安全なリセット（チーム合意後）
git reset --hard HEAD~1
git push --force-with-lease origin feature/branch
```

## 自動化ツールの活用

### 1. VS Code拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "eamodio.gitlens", // Git履歴・blame表示
    "mhutchie.git-graph", // ブランチ可視化
    "ms-vscode.vscode-merge-conflict", // コンフリクト解消支援
    "github.vscode-pull-request-github" // GitHub統合
  ]
}
```

### 2. Git設定の最適化

```bash
# ~/.gitconfig
[merge]
  tool = vscode
  conflictstyle = diff3

[mergetool "vscode"]
  cmd = code --wait $MERGED

[pull]
  rebase = true

[rebase]
  autosquash = true

[rerere]
  enabled = true  # 同じコンフリクトの解消を記憶
```

### 3. CI/CDでのコンフリクト検出

```yaml
# .github/workflows/conflict-detection.yml
name: Conflict Detection
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  check-conflicts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Check for merge conflicts
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"

          # developとのマージテスト
          git merge origin/develop --no-commit --no-ff || {
            echo "❌ Merge conflicts detected"
            git merge --abort
            exit 1
          }

          echo "✅ No conflicts detected"
```

## トラブルシューティング

### よくある問題と解決法

```bash
# 1. "Cannot merge binary files" エラー
# 解決: 適切なファイルを選択
git checkout --ours path/to/binary/file
git checkout --theirs path/to/binary/file

# 2. "Unrelated histories" エラー
# 解決: 強制的な統合を許可
git merge --allow-unrelated-histories

# 3. コンフリクトマーカーの見落とし
# 解決: 自動検出スクリプト
grep -r "<<<<<<< HEAD" src/
grep -r ">>>>>>> " src/

# 4. マージ状態のリセット
# 解決: マージを中断して最初からやり直し
git merge --abort
git reset --hard HEAD
```

### 復旧手順

```bash
# 最悪の場合の復旧パターン

# 1. ローカルブランチの復旧
git reflog                    # 操作履歴確認
git reset --hard HEAD@{2}     # 特定時点に戻る

# 2. リモートブランチとの同期
git fetch origin
git reset --hard origin/feature/branch

# 3. 作業内容の復元
git stash list               # 保存した作業確認
git stash pop               # 作業を復元
```

## 品質保証チェックリスト

### コンフリクト解消後の必須確認

- [ ] 全てのコンフリクトマーカー(`<<<<<<<`, `=======`, `>>>>>>>`)が除去されている
- [ ] コンパイルエラーが発生していない（`pnpm build`）
- [ ] 型チェックがパスしている（`pnpm check-types`）
- [ ] 全てのテストが成功している（`pnpm test`）
- [ ] リンターエラーがない（`pnpm lint`）
- [ ] 統合テストが正常動作している（`pnpm test:integration`）
- [ ] 論理的に矛盾する実装がない
- [ ] API仕様に破壊的変更がない
- [ ] データベーススキーマの整合性が保たれている
- [ ] セキュリティ要件が満たされている

### レビュー観点

- [ ] ビジネスロジックの整合性
- [ ] パフォーマンスへの影響
- [ ] セキュリティリスクの有無
- [ ] 可読性・保守性の確保
- [ ] テストカバレッジの維持
- [ ] ドキュメントの更新必要性

---

**関連ドキュメント:**

- [開発ガイドライン](../organization/development-guidelines.md)
- [バージョン管理ガイドライン](../organization/versioning-guidelines.md)
- [コードレビューガイドライン](../organization/review-guidelines.md)
