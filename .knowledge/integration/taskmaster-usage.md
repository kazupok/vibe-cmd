# Task Master AI 使用ガイド

## 基本的な使い方

### 1. 初期化
```bash
# プロジェクトディレクトリで実行
mcp__taskmaster-ai__initialize_project
```

### 2. PRDからタスク生成
```bash
# .knowledge/integration/taskmaster-prd.mdを使用してタスク生成
mcp__taskmaster-ai__parse_prd \
  --input .knowledge/integration/taskmaster-prd.md \
  --output .taskmaster/tasks/tasks.json \
  --numTasks 20
```

### 3. タスク管理

#### タスク一覧表示
```bash
mcp__taskmaster-ai__get_tasks
```

#### 次のタスクを取得
```bash
mcp__taskmaster-ai__next_task
```

#### タスクステータス更新
```bash
mcp__taskmaster-ai__set_task_status --id <task-id> --status <status>
```

ステータスの種類：
- `pending`: 未着手
- `in-progress`: 進行中
- `review`: レビュー中
- `done`: 完了
- `deferred`: 延期
- `cancelled`: キャンセル

### 4. タスクの追加・更新

#### 新規タスク追加
```bash
mcp__taskmaster-ai__add_task --prompt "新しい機能の実装"
```

#### サブタスク追加
```bash
mcp__taskmaster-ai__add_subtask --id <parent-task-id> --title "サブタスクのタイトル"
```

#### タスク更新
```bash
mcp__taskmaster-ai__update_task --id <task-id> --prompt "追加情報や変更内容"
```

### 5. タスクの展開

#### 単一タスクの展開
```bash
mcp__taskmaster-ai__expand_task --id <task-id> --num 5
```

#### 全ペンディングタスクの展開
```bash
mcp__taskmaster-ai__expand_all
```

### 6. 依存関係管理

#### 依存関係追加
```bash
mcp__taskmaster-ai__add_dependency --id <task-id> --dependsOn <dependency-task-id>
```

#### 依存関係検証
```bash
mcp__taskmaster-ai__validate_dependencies
```

### 7. 複雑性分析
```bash
mcp__taskmaster-ai__analyze_project_complexity --threshold 7
```

## MaterCMS特有の使用方法

### Notion統合タスクの生成
```bash
mcp__taskmaster-ai__add_task \
  --prompt "Notion データベースとの同期ジョブを実装" \
  --priority high \
  --research true
```

### API開発タスクの生成
```bash
mcp__taskmaster-ai__add_task \
  --prompt "Workspace CRUD REST APIエンドポイントの実装" \
  --dependencies "entity-creation-task-id"
```

### テストタスクの生成
```bash
mcp__taskmaster-ai__add_task \
  --prompt "Workspace エンティティの単体テストを80%カバレッジで実装" \
  --testStrategy "unit"
```

## ベストプラクティス

### 1. タスクの粒度
- 1タスクは1-2日で完了できる規模に
- 明確な受け入れ基準を持つ
- 単一の責任を持つ

### 2. 依存関係の設定
- エンティティ作成 → リポジトリ実装 → API実装の順序
- テストは実装と並行して作成
- ドキュメントは実装完了後

### 3. 優先度の設定
- `high`: ブロッカーとなるタスク、基盤となる機能
- `medium`: 通常の機能実装
- `low`: 改善、リファクタリング、ドキュメント

### 4. リサーチ機能の活用
- 新技術の調査が必要なタスク
- ベストプラクティスの調査
- パフォーマンス最適化の検討

## 注意事項

1. **レート制限**: Notion APIのレート制限を考慮したタスク設計
2. **コード規約**: プロジェクトのコーディング規約に従う
3. **テストカバレッジ**: 80%以上を維持
4. **セキュリティ**: 機密情報を含むタスクは慎重に扱う

## トラブルシューティング

### タスクが見つからない
```bash
# タスクファイルのパスを確認
mcp__taskmaster-ai__get_tasks --file .taskmaster/tasks/tasks.json
```

### 依存関係エラー
```bash
# 依存関係の検証と修正
mcp__taskmaster-ai__validate_dependencies
mcp__taskmaster-ai__fix_dependencies
```

### 複雑性が高すぎる
```bash
# タスクを展開してサブタスクに分解
mcp__taskmaster-ai__expand_task --id <complex-task-id> --num 5
```