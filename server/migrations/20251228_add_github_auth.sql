-- Migration: Add GitHub Authentication Support
-- Date: 2025-12-28

-- 1. Drop view that depends on auth_provider column
DROP VIEW IF EXISTS user_stats;

-- 2. Add 'github' to auth_provider enum if it exists, 
-- or convert column to VARCHAR for flexibility
DO $$ 
BEGIN
    -- Check if auth_provider is an enum/custom type
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auth_provider') THEN
        -- Add 'github' value to the enum
        BEGIN
            ALTER TYPE auth_provider ADD VALUE IF NOT EXISTS 'github';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    ELSE
        -- If it's not an enum or we want more flexibility, ensure it's at least VARCHAR
        ALTER TABLE users ALTER COLUMN auth_provider TYPE VARCHAR(255);
    END IF;
END $$;

-- 3. Add github_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(255) UNIQUE;

-- 4. Add index for github_id
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- 5. Recreate user_stats view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    auth_provider,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
    COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users
FROM users
GROUP BY auth_provider;

-- 6. Add Documentation
COMMENT ON COLUMN users.github_id IS 'GitHub User ID dari GitHub OAuth';
