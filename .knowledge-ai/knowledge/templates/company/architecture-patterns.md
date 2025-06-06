# アーキテクチャパターン

## 概要
会社全体で採用する基本的なアーキテクチャパターンと設計原則

## 設計原則
- 単一責任の原則（SRP）
- 開放閉鎖の原則（OCP）
- 依存性逆転の原則（DIP）

## アーキテクチャパターン

### レイヤードアーキテクチャ
```
┌─────────────────┐
│  Presentation   │ ← UI/API層
├─────────────────┤
│    Business     │ ← ビジネスロジック層
├─────────────────┤
│   Data Access   │ ← データアクセス層
├─────────────────┤
│   Infrastructure│ ← インフラ層
└─────────────────┘
```

### ディレクトリ構造
```
src/
├── controllers/    # API層
├── services/      # ビジネスロジック層
├── repositories/  # データアクセス層
├── models/        # ドメインモデル
├── utils/         # 共通ユーティリティ
└── types/         # 型定義
```

## 命名規則
- ファイル名: kebab-case
- クラス名: PascalCase
- 関数名: camelCase
- 定数名: SCREAMING_SNAKE_CASE