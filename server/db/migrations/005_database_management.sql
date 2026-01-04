-- Database Management Schema
-- Tracks user databases and their configurations

-- Table: databases
CREATE TABLE IF NOT EXISTS user_databases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    database_name VARCHAR(64) NOT NULL,
    database_type VARCHAR(20) NOT NULL DEFAULT 'mysql', -- 'mysql' or 'postgresql'
    database_user VARCHAR(64) NOT NULL,
    database_password VARCHAR(255) NOT NULL, -- Encrypted
    max_size_mb INTEGER DEFAULT 1024, -- Max size in MB
    current_size_mb DECIMAL(10,2) DEFAULT 0,
    charset VARCHAR(20) DEFAULT 'utf8mb4',
    collation VARCHAR(50) DEFAULT 'utf8mb4_unicode_ci',
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'deleted'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(database_name),
    UNIQUE(database_user)
);

-- Table: database_backups
CREATE TABLE IF NOT EXISTS database_backups (
    id SERIAL PRIMARY KEY,
    database_id INTEGER NOT NULL REFERENCES user_databases(id) ON DELETE CASCADE,
    backup_file VARCHAR(255) NOT NULL,
    backup_size_mb DECIMAL(10,2) NOT NULL,
    backup_type VARCHAR(20) DEFAULT 'manual', -- 'manual', 'scheduled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_databases_user_id ON user_databases(user_id);
CREATE INDEX idx_user_databases_status ON user_databases(status);
CREATE INDEX idx_database_backups_database_id ON database_backups(database_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_database_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS user_databases_updated_at ON user_databases;
CREATE TRIGGER user_databases_updated_at
    BEFORE UPDATE ON user_databases
    FOR EACH ROW
    EXECUTE FUNCTION update_database_timestamp();

-- Comments
COMMENT ON TABLE user_databases IS 'Stores information about user-created databases';
COMMENT ON TABLE database_backups IS 'Tracks database backup files';
COMMENT ON COLUMN user_databases.database_password IS 'Encrypted database password';
COMMENT ON COLUMN user_databases.max_size_mb IS 'Maximum allowed database size in MB';
