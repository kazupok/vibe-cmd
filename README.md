# vibe-cmd

AI駆動開発向けコマンドラインツール。プロジェクト内のドキュメントとコマンドを効率的に管理し、Claude CodeやCursorと連携してAI開発を支援します。

## インストール

```bash
npm install -g vibe-cmd
```

## 使い方

### 1. 初期化

```bash
vcmd init
```

プロジェクトに設定ファイル（`vibe-cmd.config.json`）と必要なディレクトリ（`.vibe-cmd/`）を作成します。

### 2. メインコマンド実行

```bash
npx vcmd cmd
```

または

```bash
vcmd cmd
```

このコマンドを実行すると：

1. **コマンド選択** - 設定されたコマンドから実行したいものを選択
2. **サブコマンド入力** - 設定されている場合、順番に質問に回答
3. **アシスタント選択** - Claude CodeまたはCursorを選択
4. **自動実行** - 選択したAIツールで@ファイル参照付きでコマンドが実行される

## 設定ファイル（vibe-cmd.config.json）

```json
{
  "commands": [
    {
      "コマンド名": {
        "description": "コマンドの説明",
        "docs": [
          ".vibe-cmd/commands/コマンド名.md",
          ".vibe-cmd/domain/**/*.md",
          ".vibe-cmd/spec/**/*.md"
        ],
        "sub-commands": [
          {
            "name": "サブコマンド名",
            "question": "質問文",
            "answers": ["選択肢1", "選択肢2"]
          },
          {
            "name": "別のサブコマンド",
            "question": "入力式の質問文"
          }
        ]
      }
    }
  ]
}
```

### 設定項目

- **description**: コマンドの説明
- **docs**: 参照するドキュメントファイルのパス（glob形式対応）
- **sub-commands**: サブコマンドの配列（オプション）
  - **name**: サブコマンド名
  - **question**: 質問文
  - **answers**: 選択肢の配列（指定すると選択式、未指定で入力式）

### ドキュメント管理

```bash
# 全コマンドの一覧表示
vcmd docs list

# 特定のコマンドのドキュメント表示
vcmd docs list --command <コマンド名>
```

## 使用例

```bash
# 1. プロジェクトを初期化
vcmd init

# 2. メインコマンドを実行
npx vcmd cmd

# 3. 対話式でコマンドとサブコマンドを選択
# 4. Claude CodeまたはCursorが自動起動
```

AI開発環境との連携により、プロジェクトのドキュメントを自動参照しながら効率的な開発が可能になります。