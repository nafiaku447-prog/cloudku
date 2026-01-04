-- Backup System Schema
-- Tracks backup jobs, schedules, and restore points

-- Table: backups
CREATE TABLE IF NOT EXISTS backups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_name VARCHAR(255) NOT NULL,
    backup_type VARCHAR(20) NOT NULL, -- 'full', 'files', 'database'
    backup_path VARCHAR(500) NOT NULL,
    backup_size_mb DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    schedule_type VARCHAR(20), -- 'manual', 'daily', 'weekly', 'monthly'
    includes_files BOOLEAN DEFAULT true,
    includes_databases BOOLEAN DEFAULT true,
    database_ids INTEGER[], -- Array of database IDs included
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, backup_name)
);

-- Table: backup_schedules
CREATE TABLE IF NOT EXISTS backup_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    schedule_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    schedule_time TIME DEFAULT '02:00:00', -- Time to run backup
    schedule_day INTEGER, -- Day of week (0-6) for weekly, day of month (1-31) for monthly
    backup_type VARCHAR(20) NOT NULL, -- 'full', 'files', 'database'
    includes_files BOOLEAN DEFAULT true,
    includes_databases BOOLEAN DEFAULT true,
    database_ids INTEGER[],
    retention_days INTEGER DEFAULT 30, -- Keep backups for N days
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: restore_points
CREATE TABLE IF NOT EXISTS restore_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_id INTEGER NOT NULL REFERENCES backups(id) ON DELETE CASCADE,
    restore_type VARCHAR(20) NOT NULL, -- 'full', 'files', 'database'
    restore_path VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_backups_user_id ON backups(user_id);
CREATE INDEX idx_backups_status ON backups(status);
CREATE INDEX idx_backups_created_at ON backups(created_at);
CREATE INDEX idx_backup_schedules_user_id ON backup_schedules(user_id);
CREATE INDEX idx_backup_schedules_next_run ON backup_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_restore_points_backup_id ON restore_points(backup_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_backup_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS backup_schedules_updated_at ON backup_schedules;
CREATE TRIGGER backup_schedules_updated_at
    BEFORE UPDATE ON backup_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_backup_schedule_timestamp();

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_backup_run(
    schedule_type VARCHAR,
    schedule_time TIME,
    schedule_day INTEGER
) RETURNS TIMESTAMP AS $$
DECLARE
    next_run TIMESTAMP;
    current_time TIMESTAMP := CURRENT_TIMESTAMP;
BEGIN
    IF schedule_type = 'daily' THEN
        next_run := DATE_TRUNC('day', current_time) + schedule_time;
        IF next_run <= current_time THEN
            next_run := next_run + INTERVAL '1 day';
        END IF;
    ELSIF schedule_type = 'weekly' THEN
        next_run := DATE_TRUNC('week', current_time) + (schedule_day || ' days')::INTERVAL + schedule_time;
        IF next_run <= current_time THEN
            next_run := next_run + INTERVAL '1 week';
        END IF;
    ELSIF schedule_type = 'monthly' THEN
        next_run := DATE_TRUNC('month', current_time) + ((schedule_day - 1) || ' days')::INTERVAL + schedule_time;
        IF next_run <= current_time THEN
            next_run := next_run + INTERVAL '1 month';
        END IF;
    END IF;
    
    RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE backups IS 'Stores backup job information and metadata';
COMMENT ON TABLE backup_schedules IS 'Defines automatic backup schedules';
COMMENT ON TABLE restore_points IS 'Tracks restore operations';
COMMENT ON COLUMN backups.backup_path IS 'Path to backup file on server';
COMMENT ON COLUMN backup_schedules.retention_days IS 'Number of days to keep backups before auto-deletion';
