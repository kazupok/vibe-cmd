# コマンド管理コマンド

## 概要
knowledge-ai.jsonファイルの管理とコマンドの追加・更新・削除を効率的に行うためのAIアシスタント向けコマンド定義

## コマンド一覧

### 1. 新規コマンド追加

#### `add_new_command`
新しいコマンドをknowledge-ai.jsonに追加する

**使用例:**
```
$add_new_command$
```

**実行内容:**
1. 新規コマンド名とdocsパスの確認
2. 既存コマンドとの重複チェック
3. パスの妥当性確認
4. knowledge-ai.jsonへの追加
5. 設定の検証

**追加手順:**
```json
{
  "commands": [
    {
      "[新しいコマンド名]": {
        "description": "[コマンドの説明]",
        "docs": [
          "[ドキュメントファイルのパス]"
        ]
      }
    }
  ]
}
```

**チェック項目:**
- [ ] コマンド名の一意性
- [ ] 説明文の明確性
- [ ] ファイルパスの存在確認
- [ ] グロブパターンの妥当性
- [ ] JSON構文の正確性

### 2. 既存コマンド更新

#### `update_command`
既存コマンドの設定を更新する

**使用例:**
```
$update_command$
```

**実行内容:**
1. 更新対象コマンドの特定
2. 現在の設定確認
3. 新しい設定の適用
4. 整合性チェック
5. バックアップとロールバック準備

**更新可能項目:**
```markdown
## 更新対象
- **description**: コマンドの説明文
- **docs**: 参照ドキュメントのパス
- **docs配列**: 複数ファイルの追加・削除
```

### 3. コマンド削除

#### `remove_command`
不要になったコマンドを削除する

**使用例:**
```
$remove_command$
```

**実行内容:**
1. 削除対象コマンドの確認
2. 依存関係のチェック
3. バックアップの作成
4. コマンドの削除
5. 設定ファイルの整理

**削除前チェック:**
- [ ] 削除対象の確認
- [ ] 他コマンドからの参照なし
- [ ] バックアップの作成
- [ ] 削除理由の記録

### 4. コマンド一覧表示

#### `list_all_commands`
現在利用可能な全コマンドを表示する

**使用例:**
```
$list_all_commands$
```

**実行内容:**
1. knowledge-ai.jsonの読み込み
2. 全コマンドの抽出
3. カテゴリ別の整理
4. 利用状況の確認
5. 分かりやすい一覧表示

**表示形式:**
```markdown
# Available Commands

## テンプレート関連
- **init_project_knowledge**: プロジェクトの知識を初期化する
- **get_all_templates**: すべてのテンプレートを読み込む
- **get_team_templates**: チーム固有のテンプレートを読み込む

## コマンド関連
- **domain_knowledge_commands**: ドメイン知識のコマンドを読み込む
- **task_implementation_commands**: タスク実装のコマンドを読み込む
- **code_analysis_commands**: コード分析のコマンドを読み込む
- **documentation_commands**: ドキュメントのコマンドを読み込む
- **code_review_commands**: コードレビューのコマンドを読み込む

## 管理コマンド
- **all_ai_commands**: すべてのコマンドを読み込む
```

### 5. コマンド検証

#### `validate_commands`
knowledge-ai.jsonの設定とファイルの整合性を検証する

**使用例:**
```
$validate_commands$
```

**実行内容:**
1. JSON構文の検証
2. ファイルパスの存在確認
3. グロブパターンの妥当性チェック
4. 重複コマンドの検出
5. 問題点のレポート生成

**検証項目:**
```markdown
## 構文チェック
- [ ] JSON構文が正しい
- [ ] 必須フィールドが存在
- [ ] データ型が適切

## パスチェック
- [ ] 指定されたファイルが存在
- [ ] グロブパターンがマッチ
- [ ] 相対パスが正しい

## 整合性チェック
- [ ] コマンド名に重複なし
- [ ] 循環参照なし
- [ ] 説明文が適切
```

### 6. バックアップ・復元

#### `backup_commands`
現在の設定をバックアップする

**使用例:**
```
$backup_commands$
```

**実行内容:**
1. 現在のknowledge-ai.jsonをコピー
2. タイムスタンプ付きファイル名で保存
3. バックアップ履歴の管理
4. 古いバックアップの整理

**バックアップ形式:**
```
knowledge-ai.json.backup.YYYY-MM-DD-HH-mm-ss
```

#### `restore_commands`
バックアップから設定を復元する

**使用例:**
```
$restore_commands$
```

**実行内容:**
1. 利用可能なバックアップ一覧表示
2. 復元対象の選択
3. 現在設定のバックアップ
4. 指定バックアップからの復元
5. 復元後の検証

## 設定テンプレート

### 基本コマンド構造
```json
{
  "commands": [
    {
      "[コマンド名]": {
        "description": "[説明文]",
        "docs": [
          "[ファイルパス1]",
          "[ファイルパス2]"
        ]
      }
    }
  ]
}
```

### グロブパターン例
```json
{
  "all_markdown_files": {
    "description": "全Markdownファイルを読み込む",
    "docs": [".knowledge-ai/**/*.md"]
  },
  "specific_category": {
    "description": "特定カテゴリのファイルを読み込む",
    "docs": [".knowledge-ai/knowledge/templates/company/*.md"]
  },
  "multiple_patterns": {
    "description": "複数パターンのファイルを読み込む",
    "docs": [
      ".knowledge-ai/knowledge/templates/**/*.md",
      ".knowledge-ai/knowledge/commands/**/*.md"
    ]
  }
}
```

## 運用ガイドライン

### コマンド命名規則
1. **動詞_対象**: `get_templates`, `add_command`
2. **分かりやすい名前**: 略語は避ける
3. **一貫性**: 既存コマンドとの統一性
4. **スネークケース**: アンダースコア区切り

### 説明文のベストプラクティス
- **簡潔**: 1行で目的が分かる
- **具体的**: 何をするかが明確
- **統一**: 他の説明文と形式を合わせる
- **日本語**: チーム内の標準言語

### ファイルパス管理
```markdown
## パス指定ルール
1. **相対パス**: プロジェクトルートからの相対パス
2. **先頭スラッシュなし**: `.knowledge-ai/...`
3. **グロブパターン**: `**/*.md` で再帰的検索
4. **存在確認**: 追加前にファイルの存在を確認
```

### バージョン管理
```bash
# 設定変更時の推奨フロー
1. git add knowledge-ai.json
2. git commit -m "feat: add new command for [目的]"
3. git push

# 大きな変更の場合
1. ブランチ作成: git checkout -b feature/update-commands
2. 設定変更とテスト
3. プルリクエスト作成
4. レビュー後マージ
```

## 自動化スクリプト

### 検証スクリプト例
```bash
#!/bin/bash
# validate-commands.sh

echo "コマンド設定の検証を開始..."

# JSON構文チェック
if ! jq . knowledge-ai.json > /dev/null; then
    echo "❌ JSON構文エラー"
    exit 1
fi

# ファイル存在チェック
echo "ファイル存在確認..."
while IFS= read -r file; do
    if [[ ! -f "$file" ]]; then
        echo "❌ ファイルが見つかりません: $file"
    fi
done < <(jq -r '.commands[].docs[]' knowledge-ai.json)

echo "✅ 検証完了"
```

### バックアップスクリプト例
```bash
#!/bin/bash
# backup-commands.sh

BACKUP_DIR=".knowledge-ai/backups"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/knowledge-ai.json.backup.$TIMESTAMP"

mkdir -p "$BACKUP_DIR"
cp knowledge-ai.json "$BACKUP_FILE"

echo "バックアップ作成: $BACKUP_FILE"

# 古いバックアップの削除（30日以上）
find "$BACKUP_DIR" -name "*.backup.*" -mtime +30 -delete
```