# ドキュメント生成・管理コマンド

## 概要
プロジェクトの各種ドキュメントを自動生成・更新・管理するためのAIアシスタント向けコマンド定義

## コマンド一覧

### 1. API仕様書生成

#### `generate_api_docs`
APIエンドポイントの仕様書を自動生成する

**使用例:**
```
$generate_api_docs$
```

**実行内容:**
1. コードからAPIエンドポイントを抽出
2. パラメータ・レスポンス形式を分析
3. OpenAPI/Swagger形式で仕様書生成
4. 使用例とサンプルレスポンス追加
5. 既存ドキュメントとの統合

**生成形式:**
```
OpenAPI 3.0形式
- エンドポイント一覧
- リクエスト/レスポンススキーマ
- エラーコード定義
- 認証方法
- 使用例
```

### 2. README生成

#### `generate_readme`
プロジェクトのREADME.mdを生成・更新する

**使用例:**
```
$generate_readme$
```

**実行内容:**
1. プロジェクト構造の分析
2. package.jsonからメタデータ抽出
3. 実行可能なスクリプトの確認
4. 依存関係の整理
5. セットアップ手順の生成

**含まれる内容:**
```
- プロジェクト概要
- 機能一覧
- インストール手順
- 使用方法
- API仕様（概要）
- 開発環境構築
- 貢献ガイド
- ライセンス情報
```

### 3. 技術仕様書生成

#### `generate_tech_specs`
システムの技術仕様書を生成する

**使用例:**
```
$generate_tech_specs$
```

**実行内容:**
1. アーキテクチャ構造の分析
2. データベーススキーマの抽出
3. 外部連携仕様の整理
4. セキュリティ仕様の文書化
5. 運用手順の作成

**仕様書構成:**
```
1. システム概要
2. アーキテクチャ設計
3. データベース設計
4. API設計
5. セキュリティ設計
6. インフラ構成
7. 運用手順
8. 障害対応手順
```

### 4. ユーザーマニュアル生成

#### `generate_user_manual`
エンドユーザー向けの操作マニュアルを生成する

**使用例:**
```
$generate_user_manual$
```

**実行内容:**
1. UI/UX要素の分析
2. ユーザーフローの抽出
3. 画面キャプチャの自動生成
4. 操作手順の文書化
5. トラブルシューティング追加

**マニュアル構成:**
```
1. 概要・目的
2. 初期設定
3. 基本操作
4. 高度な機能
5. トラブルシューティング
6. FAQ
7. 用語集
8. サポート情報
```

### 5. コードドキュメント生成

#### `generate_code_docs`
コード内のコメントからドキュメントを生成する

**使用例:**
```
$generate_code_docs$
```

**実行内容:**
1. JSDoc/TSDocコメントの解析
2. 関数・クラスの依存関係分析
3. 使用例の抽出
4. HTML/Markdown形式での出力
5. 検索機能付きサイト生成

**ドキュメント内容:**
```
- モジュール一覧
- クラス・インターフェース定義
- 関数・メソッド仕様
- 型定義
- 使用例
- 依存関係図
```

### 6. 変更履歴生成

#### `generate_changelog`
Gitコミット履歴からCHANGELOG.mdを生成する

**使用例:**
```
$generate_changelog$
```

**実行内容:**
1. Gitコミットメッセージの解析
2. Conventional Commits形式の認識
3. バージョン別の変更内容整理
4. リリースノート形式での出力
5. 破壊的変更の強調表示

**CHANGELOG形式:**
```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- 新機能の追加

### Changed
- 既存機能の変更

### Fixed
- バグ修正

### Removed
- 削除された機能

### Security
- セキュリティ関連の変更
```

## テンプレート管理

### ドキュメントテンプレート

#### README.mdテンプレート
```markdown
# [プロジェクト名]

## 概要
[プロジェクトの簡潔な説明]

## 機能
- [主要機能1]
- [主要機能2]
- [主要機能3]

## インストール
\`\`\`bash
npm install
\`\`\`

## 使用方法
\`\`\`bash
npm start
\`\`\`

## 開発
\`\`\`bash
npm run dev
\`\`\`

## テスト
\`\`\`bash
npm test
\`\`\`

## 貢献
プルリクエストを歓迎します。

## ライセンス
[ライセンス名]
```

#### API仕様書テンプレート
```yaml
openapi: 3.0.0
info:
  title: [API名]
  version: 1.0.0
  description: [API説明]

servers:
  - url: https://api.example.com/v1

paths:
  /users:
    get:
      summary: ユーザー一覧取得
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        email:
          type: string
```

## 自動化設定

### CI/CDでの自動生成
```yaml
# .github/workflows/docs.yml
name: Generate Documentation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate API Docs
        run: npm run generate:api-docs
      - name: Generate Code Docs
        run: npm run generate:code-docs
      - name: Update README
        run: npm run generate:readme
```

### 更新トリガー
1. **コードプッシュ時**: API仕様書、コードドキュメント
2. **リリース時**: CHANGELOG、ユーザーマニュアル
3. **定期実行**: 技術仕様書、README
4. **手動実行**: 全ドキュメントの再生成

## 品質管理

### ドキュメント品質チェック
```
1. 内容の正確性
   - コードとの整合性
   - リンクの有効性
   - 画像の表示確認

2. 可読性
   - 文章の明確さ
   - 構造の論理性
   - 視覚的な見やすさ

3. 完全性
   - 必要な情報の網羅
   - 更新の最新性
   - 例の充実度
```

### メンテナンス
- **週次**: リンク切れチェック
- **月次**: 内容の最新性確認
- **四半期**: 構造とフォーマットの見直し
- **年次**: ドキュメント戦略の評価