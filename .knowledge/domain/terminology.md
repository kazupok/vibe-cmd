# 用語集

## 基本用語

### システム関連

- **MaterCMS**: 本システムの名称。Notion統合機能を持つコンテンツ管理システム
- **ワークスペース (Workspace)**: 組織やチームの作業単位。複数のユーザーとリソースを含む
- **ユーザー (User)**: システムを利用する個人アカウント
- **メンバーシップ (Membership)**: ユーザーとワークスペースの関連付け

### Notion統合関連

- **内部統合 (Internal Integration)**: Notion APIを使用するためのプライベートな統合方式
- **統合トークン (Integration Token)**: Notion APIへのアクセスに必要な認証トークン
- **データベース (Database)**: Notionのデータベースオブジェクト
- **ページ (Page)**: Notionのページオブジェクト
- **プロパティ (Property)**: Notionデータベースの列定義

### 同期関連

- **同期ジョブ (Sync Job)**: Notionからデータを取得・変換するタスク
- **同期スケジュール (Sync Schedule)**: 同期を実行するタイミングの定義
- **同期頻度 (Sync Frequency)**: 同期を実行する間隔（例：5分、1時間、1日）
- **データトレース (Data Trace)**: 同期されたデータの履歴追跡情報
- **変更検知 (Change Detection)**: データの更新を検出する仕組み

### API管理関連

- **APIキー (API Key)**: 外部アプリケーションがAPIにアクセスするための認証キー
- **APIクレデンシャル (API Credential)**: APIキーと関連する認証情報
- **権限セット (Permission Set)**: APIキーに付与される操作権限の集合
- **レート制限 (Rate Limit)**: API使用量の制限
- **使用量クォータ (Usage Quota)**: 期間内のAPI使用上限

### データ変換関連

- **変換ルール (Transformation Rule)**: Notionデータを内部形式に変換する規則
- **プロパティマッピング (Property Mapping)**: Notionプロパティと内部フィールドの対応関係
- **スナップショット (Snapshot)**: ある時点でのデータの状態
- **データハッシュ (Data Hash)**: データの整合性確認用ハッシュ値

### セキュリティ関連

- **ロール (Role)**: ユーザーの権限レベル（Owner, Admin, Editor, Viewer）
- **RBAC**: Role-Based Access Control（ロールベースアクセス制御）
- **JWT**: JSON Web Token（ユーザー認証用トークン）
- **暗号化 (Encryption)**: データの保護手法

## ドメイン固有の概念

### ステータス値

- **ConnectionStatus**: 統合の接続状態
  - Connected: 接続済み
  - Disconnected: 切断
  - Error: エラー状態
  
- **SyncStatus**: 同期ジョブの状態
  - Pending: 待機中
  - Running: 実行中
  - Completed: 完了
  - Failed: 失敗
  - Cancelled: キャンセル

- **MembershipStatus**: メンバーシップの状態
  - Active: アクティブ
  - Suspended: 一時停止
  - Revoked: 取り消し

### 値オブジェクト

- **WorkspaceSlug**: ワークスペースの一意識別子（URL用）
- **NotionDatabaseId**: NotionデータベースのID
- **NotionPageId**: NotionページのID
- **ApiKeyPrefix**: APIキーのプレフィックス（例：mtr_）

## 略語

- **CMS**: Content Management System
- **DDD**: Domain-Driven Design
- **API**: Application Programming Interface
- **UUID**: Universally Unique Identifier
- **UTC**: Coordinated Universal Time