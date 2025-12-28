-- HostModern Database Schema untuk PostgreSQL
-- File: database/schema.sql

-- Drop tables if exists (untuk development)
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enum untuk auth provider
CREATE TYPE auth_provider AS ENUM ('google', 'facebook', 'github', 'email');

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255), -- NULL jika login via OAuth
    profile_picture TEXT,
    auth_provider auth_provider NOT NULL DEFAULT 'email',
    google_id VARCHAR(255) UNIQUE, -- Google User ID (sub)
    facebook_id VARCHAR(255) UNIQUE, -- Facebook User ID
    github_id VARCHAR(255) UNIQUE, -- GitHub User ID
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Table: sessions (untuk JWT refresh tokens)
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45), -- Support IPv6
    user_agent TEXT
);

-- Indexes untuk performa
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_facebook_id ON users(facebook_id);
CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Function untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data untuk testing (optional)
-- INSERT INTO users (email, name, auth_provider, email_verified) 
-- VALUES ('test@example.com', 'Test User', 'email', TRUE);

-- View untuk user statistics
CREATE VIEW user_stats AS
SELECT 
    auth_provider,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
    COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified_users
FROM users
GROUP BY auth_provider;

-- Cleanup expired sessions (jalankan via cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments untuk dokumentasi
COMMENT ON TABLE users IS 'Tabel untuk menyimpan data pengguna dari berbagai auth provider';
COMMENT ON TABLE sessions IS 'Tabel untuk menyimpan refresh tokens dan session management';
COMMENT ON COLUMN users.google_id IS 'Google User ID (sub) dari JWT token Google OAuth';
COMMENT ON COLUMN users.github_id IS 'GitHub User ID dari GitHub OAuth';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hash, NULL untuk OAuth users';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Hapus expired sessions, jalankan via cron';

-- Grant permissions (sesuaikan dengan database user Anda)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hostmodern_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hostmodern_user;
