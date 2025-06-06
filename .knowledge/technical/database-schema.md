# データベース設計

## 概要

MaterCMSは、PostgreSQLをメインデータベースとして使用し、正規化されたリレーショナルデータモデルを採用しています。

## データベース設計原則

1. **第3正規形の維持**
2. **適切なインデックスの設定**
3. **外部キー制約の活用**
4. **論理削除の採用**
5. **監査ログの記録**

## スキーマ構成

### users テーブル
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at);
```

### workspaces テーブル
```sql
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_slug CHECK (slug ~* '^[a-z0-9-]+$')
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug) WHERE deleted_at IS NULL;
```

### workspace_memberships テーブル
```sql
CREATE TABLE workspace_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(workspace_id, user_id),
    CONSTRAINT chk_role CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    CONSTRAINT chk_status CHECK (status IN ('active', 'suspended', 'revoked'))
);

CREATE INDEX idx_memberships_workspace_user ON workspace_memberships(workspace_id, user_id);
CREATE INDEX idx_memberships_user ON workspace_memberships(user_id) WHERE status = 'active';
```

### notion_integrations テーブル
```sql
CREATE TABLE notion_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    token_encrypted TEXT NOT NULL,
    bot_info JSONB,
    connection_status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_connection_status CHECK (connection_status IN ('connected', 'disconnected', 'error'))
);

CREATE INDEX idx_integrations_workspace ON notion_integrations(workspace_id);
```

### database_configurations テーブル
```sql
CREATE TABLE database_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL REFERENCES notion_integrations(id) ON DELETE CASCADE,
    notion_database_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sync_enabled BOOLEAN DEFAULT true,
    sync_frequency_minutes INTEGER DEFAULT 60,
    property_mappings JSONB DEFAULT '{}',
    filters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(integration_id, notion_database_id),
    CONSTRAINT chk_sync_frequency CHECK (sync_frequency_minutes >= 5)
);

CREATE INDEX idx_db_configs_integration ON database_configurations(integration_id);
CREATE INDEX idx_db_configs_sync_enabled ON database_configurations(sync_enabled) WHERE sync_enabled = true;
```

### sync_jobs テーブル
```sql
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    database_config_id UUID NOT NULL REFERENCES database_configurations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    pages_synced INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX idx_sync_jobs_config_status ON sync_jobs(database_config_id, status);
CREATE INDEX idx_sync_jobs_created_at ON sync_jobs(created_at DESC);
```

### api_credentials テーブル
```sql
CREATE TABLE api_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(10) NOT NULL,
    last_four VARCHAR(4) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(key_hash)
);

CREATE INDEX idx_api_creds_workspace ON api_credentials(workspace_id);
CREATE INDEX idx_api_creds_key_prefix ON api_credentials(key_prefix);
CREATE INDEX idx_api_creds_expires ON api_credentials(expires_at) WHERE revoked_at IS NULL;
```

### api_usage テーブル
```sql
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credential_id UUID NOT NULL REFERENCES api_credentials(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_usage_credential_created ON api_usage(credential_id, created_at DESC);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at DESC);
```

### notion_data_traces テーブル
```sql
CREATE TABLE notion_data_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
    notion_page_id VARCHAR(255) NOT NULL,
    data_hash VARCHAR(64) NOT NULL,
    page_snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_data_traces_job ON notion_data_traces(sync_job_id);
CREATE INDEX idx_data_traces_page ON notion_data_traces(notion_page_id);
```

## パーティショニング戦略

### api_usage テーブルのパーティショニング
```sql
-- 月次パーティション
CREATE TABLE api_usage_2024_01 PARTITION OF api_usage
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE api_usage_2024_02 PARTITION OF api_usage
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

## インデックス戦略

### 複合インデックス
```sql
-- 頻繁なクエリパターンに基づく
CREATE INDEX idx_sync_jobs_config_status_created 
    ON sync_jobs(database_config_id, status, created_at DESC);

CREATE INDEX idx_api_usage_credential_endpoint_created 
    ON api_usage(credential_id, endpoint, created_at DESC);
```

### 部分インデックス
```sql
-- アクティブなレコードのみインデックス
CREATE INDEX idx_workspaces_active 
    ON workspaces(id) WHERE deleted_at IS NULL;

CREATE INDEX idx_sync_jobs_running 
    ON sync_jobs(database_config_id) WHERE status = 'running';
```

## マイグレーション管理

### マイグレーションファイル命名規則
```
migrations/
├── 001_create_users_table.sql
├── 002_create_workspaces_table.sql
├── 003_create_workspace_memberships_table.sql
└── ...
```

### マイグレーション記録
```sql
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## バックアップ・リカバリ戦略

1. **定期バックアップ**
   - 日次フルバックアップ
   - 1時間ごとの増分バックアップ

2. **ポイントインタイムリカバリ**
   - WALアーカイブの有効化
   - 最大30日間の保持

3. **レプリケーション**
   - 同期レプリケーション（1台）
   - 非同期レプリケーション（2台）