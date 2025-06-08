# コンフリクト解消ワークフロー

## 概要

GitHubでプルリクエスト作成時やマージ時に発生するコンフリクトを安全かつ効率的に解消するためのワークフローです。データ損失を防ぎ、コードの整合性を維持しながら、チーム開発を円滑に進めます。

## 前提条件

- コンフリクトが発生したプルリクエストまたはブランチが存在
- 解消に必要な権限と知識を保有
- 変更内容の影響範囲を理解している
- **特に指定がない場合は、最新のdevelopブランチとの統合を前提とする**

## 必要な参考資料

### 🛠️ Git操作・ベストプラクティス（必須）

- [`knowledge/guidelines/Git競合解決.md`](../knowledge/guidelines/Git競合解決.md) - Git コンフリクト解消ベストプラクティス
- [`knowledge/guidelines/バージョン管理指針.md`](../knowledge/guidelines/バージョン管理指針.md) - バージョン管理ワークフロー
- [`knowledge/guidelines/開発フロー指針.md`](../knowledge/guidelines/開発フロー指針.md) - 開発プロセス・実装フロー

### 📋 ビジネス仕様（該当する場合）

- [`domain/business-rules.md`](../domain/business-rules.md) - ビジネスルール制約
- [`domain/terminology.md`](../domain/terminology.md) - 用語定義・ドメイン概念

### 🏗️ 技術仕様（該当する場合）

- [`spec/アーキテクチャ.md`](../spec/アーキテクチャ.md) - システムアーキテクチャ
- [`spec/API設計指針.md`](../spec/API設計指針.md) - API設計方針
- [`spec/セキュリティ要件.md`](../spec/セキュリティ要件.md) - セキュリティ要件

### 💡 実装パターン（該当する場合）

- [`knowledge/examples/エンティティ実装例.md`](../knowledge/examples/エンティティ実装例.md) - DDDエンティティ実装
- [`knowledge/examples/リポジトリ実装例.md`](../knowledge/examples/リポジトリ実装例.md) - リポジトリパターン
- [`knowledge/guidelines/エラーハンドリング.md`](../knowledge/guidelines/エラーハンドリング.md) - エラーハンドリング戦略

### 📏 品質基準（必須）

- [`knowledge/guidelines/テスト指針.md`](../knowledge/guidelines/テスト指針.md) - テスト戦略
- [`knowledge/guidelines/レビューガイドライン.md`](../knowledge/guidelines/レビューガイドライン.md) - コードレビュー基準

## 事前確認

### 📋 必須: 参考資料の読み込み確認

**コンフリクト解消開始前に、以下の参考資料をすべて読み込み、リスト表示してください：**

```markdown
読み込み完了した参考資料:

- [ ] knowledge/guidelines/Git競合解決.md
- [ ] knowledge/guidelines/バージョン管理指針.md
- [ ] knowledge/guidelines/開発フロー指針.md
- [ ] domain/business-rules.md（ビジネスロジック関連のコンフリクトの場合）
- [ ] domain/terminology.md（用語・概念関連のコンフリクトの場合）
- [ ] spec/アーキテクチャ.md（アーキテクチャ関連のコンフリクトの場合）
- [ ] spec/API設計指針.md（API関連のコンフリクトの場合）
- [ ] spec/セキュリティ要件.md（セキュリティ関連のコンフリクトの場合）
- [ ] knowledge/examples/[該当パターン].md（実装パターン関連のコンフリクトの場合）
- [ ] knowledge/guidelines/エラーハンドリング.md（エラーハンドリング関連のコンフリクトの場合）
- [ ] knowledge/guidelines/テスト指針.md
- [ ] knowledge/guidelines/レビューガイドライン.md

合計 [X] ファイルの読み込みが完了しました。
```

**重要**: このチェックリストを提示してからコンフリクト解消を開始してください。読み込めなかったファイルがある場合は明記してください。

## ワークフロー手順

### Phase 1: 状況分析・準備 🔍

#### 1.1 コンフリクト状況の把握

```bash
# 現在の状況確認
git status
git log --oneline --graph --decorate -10

# コンフリクトファイルの特定
git diff --name-only --diff-filter=U

# 詳細なコンフリクト内容確認
git diff HEAD~1
```

**確認項目:**

- [ ] コンフリクトが発生したファイル数・種類の把握
- [ ] 変更内容の影響範囲の理解
- [ ] 関係者（他の開発者）の変更意図の確認
- [ ] ビジネスロジック・技術的制約の確認

#### 1.2 安全な作業環境の構築

```bash
# 現在の作業を安全に保存
git stash push -m "コンフリクト解消前の作業内容保存"

# 最新の状態を取得
git fetch origin

# バックアップブランチ作成（安全策）
git branch backup-$(date +%Y%m%d-%H%M%S)
```

**参考資料:** `git-conflict-resolution.md` - Phase 1: 事前準備

#### 1.3 解消戦略の決定

```markdown
コンフリクト解消戦略:

- [ ] 自動解消可能（フォーマット・改行の差異など）
- [ ] 手動解消必要（ロジック・機能の競合）
- [ ] 段階的解消必要（大規模なリファクタリング競合）
- [ ] チーム相談必要（ビジネスロジックの判断が必要）
```

### Phase 2: コンフリクト解消実行 🛠️

#### 2.1 自動解消の実行

```bash
# 単純な差異の自動解消
git checkout --theirs package-lock.json  # 依存関係ファイル
git checkout --ours .env.local           # 環境設定ファイル

# 特定戦略での自動解消
git merge -X ours origin/develop         # 自分の変更を優先
git merge -X theirs origin/develop       # 相手の変更を優先
```

#### 2.2 手動解消の実行

```typescript
// コンフリクト解消の判断基準（優先順位順）

// 1. セキュリティ要件の維持
// spec/セキュリティ要件.md に従った解消

// 2. ビジネスルールの整合性確保
// domain/business-rules.md と domain/terminology.md に従った解消

// 3. アーキテクチャ原則の遵守
// spec/アーキテクチャ.md に従った解消

// 4. API設計指針の維持
// spec/API設計指針.md に従った解消

// 5. 実装パターンの統一
// knowledge/examples/*.md に従った解消
```

**解消原則:**

- [ ] **両方の機能を統合**：可能な限り両方の変更を活かす
- [ ] **後方互換性の維持**：既存のAPIインターフェースを破壊しない
- [ ] **データの整合性確保**：データ構造の一貫性を保つ
- [ ] **セキュリティの優先**：セキュリティ関連の変更を最優先

#### 2.3 複雑なケースの段階的解消

```bash
# 大規模コンフリクトの場合
git rebase -i HEAD~5  # コミットを細分化

# 各コミットごとに個別解消
git cherry-pick commit1
# コンフリクト解消・テスト実行
git cherry-pick commit2
# コンフリクト解消・テスト実行...
```

**参考資料:** `git-conflict-resolution.md` - 複雑なコンフリクトの対処戦略

### Phase 3: 品質検証 🧪

#### 3.1 コンパイル・構文チェック

```bash
# 基本的な構文チェック
pnpm check-types
pnpm lint

# ビルド確認
pnpm build
```

#### 3.2 テスト実行

```bash
# 段階的テスト実行
pnpm test                    # ユニットテスト
pnpm test:integration        # 統合テスト
pnpm test:e2e               # E2Eテスト（重要な変更の場合）
```

**テスト観点:**

- [ ] コンフリクト解消により新たなテストエラーが発生していない
- [ ] 両ブランチの機能が正常に動作している
- [ ] 統合後の機能に論理的矛盾がない
- [ ] パフォーマンスが劣化していない

#### 3.3 論理的整合性の確認

```typescript
// ビジネスロジックの整合性チェック項目

// 1. 用語・概念の統一性
// domain/terminology.md で定義された用語が統一されているか

// 2. ビジネスルールの遵守
// domain/business-rules.md で定義されたルールに違反していないか

// 3. データフローの整合性
// spec/アーキテクチャ.md で定義された層分離が保たれているか

// 4. API仕様の一貫性
// spec/API設計指針.md で定義された設計原則に従っているか
```

### Phase 4: 最終確認・コミット 📝

#### 4.1 解消内容の文書化

```bash
# コンフリクト解消のコミットメッセージ例
git add .
git commit -m "resolve: merge conflicts with develop

- Integrated authentication improvements from both branches
- Maintained API backward compatibility
- Applied consistent error handling patterns
- Updated tests to cover merged functionality

Resolved conflicts:
- src/auth/auth-service.ts: Combined new MFA with improved session handling
- src/api/workspace-controller.ts: Merged new endpoints with validation updates
- tests/: Updated tests to cover integrated functionality

Refs: #123, #456"
```

#### 4.2 コンフリクトマーカーの完全除去確認

```bash
# コンフリクトマーカーの残存チェック
grep -r "<<<<<<< HEAD" src/
grep -r ">>>>>>> " src/
grep -r "=======" src/

# 結果が空であることを確認
```

#### 4.3 最終品質チェック

```bash
# 全体的な品質確認
pnpm test && pnpm build && pnpm check-types && pnpm lint

# セキュリティチェック（該当する場合）
pnpm audit
pnpm lint:security
```

## チェックポイント

### ✅ Phase 1 完了チェック

- [ ] コンフリクトの原因と影響範囲を理解
- [ ] 解消戦略が`git-conflict-resolution.md`の原則に従っている
- [ ] 必要な参考資料を全て確認済み
- [ ] 安全なバックアップを作成済み

### ✅ Phase 2 完了チェック

- [ ] 全てのコンフリクトファイルが解消済み
- [ ] 解消方針が技術仕様・ビジネス要件に準拠
- [ ] セキュリティ要件が維持されている
- [ ] API仕様に破壊的変更がない

### ✅ Phase 3 完了チェック

- [ ] 全てのテストが成功
- [ ] コンパイルエラーが発生していない
- [ ] リンターエラーがない
- [ ] 論理的矛盾がない

### ✅ Phase 4 完了チェック

- [ ] コンフリクトマーカーが完全に除去されている
- [ ] 解消内容が適切に文書化されている
- [ ] 品質基準を全て満たしている
- [ ] レビューの準備が完了している

## 緊急時対応

### 🚨 解消が困難な場合

```bash
# 作業の中断・リセット
git merge --abort
git rebase --abort
git reset --hard HEAD

# バックアップからの復旧
git checkout backup-[timestamp]
git branch -D feature/problematic-branch
git checkout -b feature/problematic-branch
```

### 🆘 エスカレーション基準

**以下の場合は即座にユーザーに確認・チームに相談:**

- [ ] 想定していない・理解できないコンフリクトが発生
- [ ] ビジネスロジックの判断が必要
- [ ] セキュリティ要件への影響が不明
- [ ] データベーススキーマの破壊的変更を含む
- [ ] API の後方互換性に影響する
- [ ] 解消により新たな重大なバグが発生

## 完了条件

### ✅ 技術的完了条件

- [ ] 全コンフリクトの解消完了
- [ ] 全テストの成功
- [ ] 品質ゲートの通過
- [ ] セキュリティチェックの通過

### ✅ プロセス完了条件

- [ ] 解消内容の適切な文書化
- [ ] 必要に応じたチーム共有
- [ ] レビュー依頼の準備完了
- [ ] 継続的統合（CI）の通過

### ✅ 品質完了条件

- [ ] ビジネス要件の維持
- [ ] 技術仕様の遵守
- [ ] パフォーマンスの非劣化
- [ ] 可読性・保守性の確保

## 学習・改善

### 🔄 継続的改善

```markdown
コンフリクト解消完了後の振り返り:

1. **コンフリクト発生の原因分析**

   - なぜコンフリクトが発生したか？
   - 事前に防げた要因はあったか？

2. **解消プロセスの評価**

   - ワークフローは効果的だったか？
   - より効率的な手法はあったか？

3. **チーム共有事項**

   - 他メンバーに共有すべき知見は？
   - 類似ケースの予防策は？

4. **ドキュメント改善**
   - 参考資料の不足はなかったか？
   - ガイドラインの改善点は？
```

## トラブルシューティング

### よくある問題と対処法

**参考:** `git-conflict-resolution.md` - トラブルシューティング

```bash
# 1. "Cannot merge binary files" エラー
git checkout --ours path/to/binary/file
git checkout --theirs path/to/binary/file

# 2. コンフリクトマーカーの見落とし
grep -r "<<<<<<< HEAD" src/
grep -r ">>>>>>> " src/

# 3. マージ状態のリセット
git merge --abort
git reset --hard HEAD
```

## 次のステップ

コンフリクト解消完了後は以下のワークフローに移行：

- **プルリクエストレビュー**: [`レビューガイドライン.md`](../knowledge/guidelines/レビューガイドライン.md)
- **マージ後の確認**: [`バージョン管理指針.md`](../knowledge/guidelines/バージョン管理指針.md)
- **デプロイメント**: [`開発フロー指針.md`](../knowledge/guidelines/開発フロー指針.md)

---

**更新日**: 2024-12-06  
**バージョン**: 1.0.0  
**管理者**: 開発チーム
