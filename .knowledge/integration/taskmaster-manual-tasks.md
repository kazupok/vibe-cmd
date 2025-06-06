# Task Master AI 手動タスク作成ガイド

## タスクの手動作成

Task Master AIのAPIキーが設定されていない場合、以下の方法でタスクを手動で作成できます。

### 方法1: 直接JSONファイルを作成

`.taskmaster/tasks/tasks.json`ファイルを以下の形式で作成：

```json
{
  "tasks": [
    {
      "id": "1",
      "title": "プロジェクト基盤のセットアップ",
      "description": "Turborepoとpnpmを使用したモノレポ構造の初期設定",
      "priority": "high",
      "status": "pending",
      "complexity": 3,
      "testStrategy": "integration",
      "dependencies": [],
      "details": "- Turborepoの設定ファイル確認\n- パッケージ構造の最適化\n- ビルドパイプラインの設定",
      "acceptanceCriteria": "- すべてのパッケージが正しくビルドされる\n- 開発環境が正しく動作する\n- CIパイプラインが通る"
    },
    {
      "id": "2",
      "title": "認証システムの実装",
      "description": "JWT認証とロールベースアクセス制御の実装",
      "priority": "high",
      "status": "pending",
      "complexity": 8,
      "testStrategy": "unit,integration",
      "dependencies": ["1"],
      "details": "- JWTトークン生成・検証\n- ユーザーモデルの作成\n- 認証ミドルウェアの実装\n- RBACの実装",
      "acceptanceCriteria": "- ユーザー登録・ログインが動作する\n- トークンベースの認証が機能する\n- 権限に基づいたアクセス制御が動作する"
    },
    {
      "id": "3",
      "title": "Notion API統合の基盤構築",
      "description": "Notion APIとの接続とレート制限管理の実装",
      "priority": "high",
      "status": "pending",
      "complexity": 7,
      "testStrategy": "integration",
      "dependencies": ["1"],
      "details": "- Notion APIクライアントの実装\n- レート制限ハンドリング（3req/sec）\n- エラーハンドリングとリトライロジック\n- トークン暗号化",
      "acceptanceCriteria": "- Notion APIに接続できる\n- レート制限を超えない\n- エラー時に適切にリトライする"
    },
    {
      "id": "4",
      "title": "ワークスペースエンティティの実装",
      "description": "DDDパターンに従ったWorkspaceエンティティの作成",
      "priority": "medium",
      "status": "pending",
      "complexity": 5,
      "testStrategy": "unit",
      "dependencies": ["1"],
      "details": "- BaseEntityを継承したWorkspaceクラス\n- create()とreconstitute()ファクトリメソッド\n- WorkspaceNameとWorkspaceSlugのValue Object\n- ソフトデリート対応",
      "acceptanceCriteria": "- エンティティが正しく作成される\n- バリデーションが動作する\n- 単体テストのカバレッジ80%以上"
    },
    {
      "id": "5",
      "title": "ワークスペースリポジトリの実装",
      "description": "ワークスペースデータの永続化層の実装",
      "priority": "medium",
      "status": "pending",
      "complexity": 6,
      "testStrategy": "integration",
      "dependencies": ["4"],
      "details": "- リポジトリインターフェースの定義\n- PostgreSQL実装\n- トランザクション対応\n- キャッシング層の実装",
      "acceptanceCriteria": "- CRUD操作が正しく動作する\n- トランザクションが機能する\n- キャッシュが適切に動作する"
    },
    {
      "id": "6",
      "title": "ワークスペースREST APIの実装",
      "description": "ワークスペース管理のためのRESTful APIエンドポイント",
      "priority": "medium",
      "status": "pending",
      "complexity": 6,
      "testStrategy": "integration,e2e",
      "dependencies": ["2", "5"],
      "details": "- GET, POST, PATCH, DELETE エンドポイント\n- 入力バリデーション（Zod）\n- エラーハンドリング（Resultパターン）\n- OpenAPIドキュメント生成",
      "acceptanceCriteria": "- すべてのHTTPメソッドが動作する\n- 適切なステータスコードを返す\n- APIドキュメントが生成される"
    },
    {
      "id": "7",
      "title": "Notion同期ジョブの実装",
      "description": "Notionデータベースとの同期バックグラウンドジョブ",
      "priority": "high",
      "status": "pending",
      "complexity": 9,
      "testStrategy": "integration",
      "dependencies": ["3", "5"],
      "details": "- ページネーション処理（100件/ページ）\n- レート制限管理\n- 差分同期の実装\n- エラーハンドリングとリトライ",
      "acceptanceCriteria": "- データが正しく同期される\n- レート制限を守る\n- エラー時に適切にリカバリする"
    },
    {
      "id": "8",
      "title": "GraphQL APIの基盤構築",
      "description": "GraphQLスキーマとリゾルバの基本実装",
      "priority": "medium",
      "status": "pending",
      "complexity": 7,
      "testStrategy": "integration",
      "dependencies": ["6"],
      "details": "- スキーマファーストアプローチ\n- DataLoaderでN+1問題対策\n- Relay仕様準拠\n- サブスクリプション対応",
      "acceptanceCriteria": "- GraphQLクエリが動作する\n- N+1問題が発生しない\n- リアルタイム更新が動作する"
    },
    {
      "id": "9",
      "title": "メディア管理システムの実装",
      "description": "画像・動画・ドキュメントの統合管理機能",
      "priority": "low",
      "status": "pending",
      "complexity": 8,
      "testStrategy": "integration",
      "dependencies": ["6"],
      "details": "- S3互換ストレージ接続\n- ファイルアップロードAPI\n- サムネイル生成\n- メタデータ管理",
      "acceptanceCriteria": "- ファイルがアップロードできる\n- メタデータが保存される\n- サムネイルが生成される"
    },
    {
      "id": "10",
      "title": "監視・ロギングシステムの構築",
      "description": "OpenTelemetryを使用した包括的な監視システム",
      "priority": "medium",
      "status": "pending",
      "complexity": 6,
      "testStrategy": "integration",
      "dependencies": ["1"],
      "details": "- メトリクス収集\n- 分散トレーシング\n- ログ集約\n- アラート設定",
      "acceptanceCriteria": "- メトリクスが収集される\n- トレースが記録される\n- ログが集約される"
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "createdAt": "2025-06-06T00:00:00Z",
    "projectName": "MaterCMS",
    "totalTasks": 10
  }
}
```

### 方法2: add_taskコマンドで一つずつ追加

```bash
# 例：認証システムのタスクを追加
mcp__taskmaster-ai__add_task \
  --title "JWT認証システムの実装" \
  --description "JWTトークンベースの認証システムを実装" \
  --details "- JWTトークンの生成と検証\n- リフレッシュトークンの実装\n- 認証ミドルウェアの作成" \
  --priority high \
  --testStrategy "unit,integration"
```

### 方法3: タスクテンプレートの使用

以下のテンプレートを参考に、プロジェクト固有のタスクを作成：

#### エンティティ作成タスク
```json
{
  "title": "[エンティティ名]エンティティの実装",
  "description": "DDDパターンに従った[エンティティ名]の作成",
  "priority": "medium",
  "complexity": 5,
  "testStrategy": "unit",
  "details": "- BaseEntityを継承\n- ファクトリメソッド実装\n- Value Objectの作成\n- ビジネスロジックの実装",
  "acceptanceCriteria": "- エンティティが正しく動作\n- バリデーション機能\n- テストカバレッジ80%以上"
}
```

#### API実装タスク
```json
{
  "title": "[リソース名] REST APIの実装",
  "description": "[リソース名]のCRUD APIエンドポイント",
  "priority": "medium",
  "complexity": 6,
  "testStrategy": "integration,e2e",
  "details": "- RESTfulエンドポイント\n- 入力バリデーション\n- エラーハンドリング\n- APIドキュメント",
  "acceptanceCriteria": "- CRUD操作が動作\n- 適切なHTTPステータス\n- OpenAPI仕様準拠"
}
```

#### 統合タスク
```json
{
  "title": "[サービス名]統合の実装",
  "description": "外部サービス[サービス名]との統合",
  "priority": "high",
  "complexity": 8,
  "testStrategy": "integration",
  "details": "- APIクライアント実装\n- レート制限管理\n- エラーハンドリング\n- データ変換",
  "acceptanceCriteria": "- 接続が確立される\n- データが正しく同期\n- エラー時の復旧"
}
```

## タスクの優先順位設定ガイド

### High Priority
- 基盤となる機能（認証、データベース接続）
- ブロッカーとなるタスク
- セキュリティ関連機能

### Medium Priority
- 通常の機能実装
- APIエンドポイント
- ビジネスロジック

### Low Priority
- 改善・最適化
- ドキュメント作成
- リファクタリング

## 複雑性スコアの目安

- 1-3: 簡単なタスク（1日以内）
- 4-6: 中程度のタスク（2-3日）
- 7-9: 複雑なタスク（1週間程度）
- 10: 非常に複雑（要分解）

## 依存関係の設定

依存関係は以下の順序で設定：

1. 基盤設定 → すべてのタスク
2. 認証 → API関連タスク
3. エンティティ → リポジトリ → API
4. 外部統合 → それを使用する機能

## タスクファイル生成

tasks.jsonを作成したら、以下のコマンドで個別のタスクファイルを生成：

```bash
mcp__taskmaster-ai__generate
```

これにより、`.taskmaster/tasks/`ディレクトリに各タスクのMarkdownファイルが生成されます。