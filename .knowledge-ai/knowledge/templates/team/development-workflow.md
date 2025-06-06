# 開発ワークフロー

## 概要
チーム固有の開発プロセスとワークフロー定義

## ブランチ戦略

### Git Flow
```
main
  ├── develop
  │   ├── feature/user-auth
  │   ├── feature/payment-system
  │   └── feature/admin-panel
  ├── release/v1.2.0
  └── hotfix/critical-bug-fix
```

### ブランチ命名規則
- `feature/[機能名]` - 新機能開発
- `bugfix/[バグ名]` - バグ修正
- `hotfix/[緊急修正名]` - 緊急修正
- `release/v[バージョン]` - リリース準備

## 開発フロー

### 1. タスク開始
```bash
# 最新のdevelopブランチから分岐
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# 開発開始前のチェック
npm install
npm run test
npm run lint
```

### 2. 開発中
```bash
# 定期的なコミット
git add .
git commit -m "feat: add user authentication logic"

# 定期的なdevelopとの同期
git fetch origin develop
git merge origin/develop
```

### 3. プルリクエスト作成
- **タイトル**: `[種別] 簡潔な説明`
- **説明**: 変更内容、影響範囲、テスト方法
- **レビュアー**: 2名以上指定
- **ラベル**: 適切なラベル付与

### 4. コードレビュー
- **必須チェック項目**
  - 機能要件の実装確認
  - コード品質（可読性、保守性）
  - テストカバレッジ
  - セキュリティ観点
  - パフォーマンス影響

### 5. マージ・デプロイ
```bash
# developブランチへマージ後
git checkout develop
git pull origin develop

# staging環境へデプロイ
npm run deploy:staging

# 動作確認後、mainブランチへマージ
# 本番環境へデプロイ
npm run deploy:production
```

## レビュー基準

### コード品質
- [ ] 命名が明確で理解しやすい
- [ ] 関数・クラスが適切なサイズ
- [ ] コメントが必要な箇所に記載
- [ ] ESLint/Prettierルールに準拠

### 機能性
- [ ] 要件通りに動作する
- [ ] エラーハンドリングが適切
- [ ] エッジケースを考慮している
- [ ] パフォーマンスに問題がない

### テスト
- [ ] ユニットテストが追加されている
- [ ] テストケースが十分
- [ ] テストが通る
- [ ] 適切なモック/スタブを使用

## 定期イベント

### デイリースタンドアップ（毎日 10:00）
- 昨日の作業内容
- 今日の予定
- ブロッカー・課題

### スプリントプランニング（隔週月曜）
- スプリント目標設定
- タスク見積もり
- アサインメント決定

### スプリントレトロスペクティブ（隔週金曜）
- Good（良かった点）
- Bad（改善点）
- Try（次回試すこと）

## ツール・環境

### 必須ツール
- **IDE**: VSCode + 推奨拡張機能
- **Git GUI**: SourceTree または GitKraken
- **API テスト**: Postman または Insomnia
- **コミュニケーション**: Slack

### 開発環境
```bash
# Node.js バージョン管理
nvm use 18.17.0

# パッケージマネージャー
npm 

# 環境変数設定
cp .env.example .env.local
# 必要な値を設定

# データベース起動
docker-compose up -d postgres

# 開発サーバー起動
npm run dev
```

### 品質チェックツール
```bash
# コード品質
npm run lint        # ESLint
npm run type-check  # TypeScript

# テスト
npm run test        # ユニットテスト
npm run test:e2e    # E2Eテスト

# セキュリティ
npm audit           # 脆弱性チェック
npm run security    # セキュリティスキャン
```