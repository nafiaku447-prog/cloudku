-- Migration: Create hosting-related tables
-- Run this in your PostgreSQL database
-- Safe to run multiple times with IF NOT EXISTS

-- Ensure we're in transaction mode for safety
BEGIN;

-- 1. Websites/Hosting Table
CREATE TABLE IF NOT EXISTS websites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    plan VARCHAR(100) DEFAULT 'premium',
    visitors_count INTEGER DEFAULT 0,
    storage_used BIGINT DEFAULT 0, -- in bytes
    bandwidth_used BIGINT DEFAULT 0, -- in bytes
    uptime_percentage DECIMAL(5,2) DEFAULT 99.9,
    ssl_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Domains Table  
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    registrar VARCHAR(100) DEFAULT 'HostModern',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    dns_status VARCHAR(50) DEFAULT 'active',
    ssl_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Email Accounts Table
CREATE TABLE IF NOT EXISTS email_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    quota_mb INTEGER DEFAULT 5120, -- 5GB default
    used_mb INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active',
    forwarders_count INTEGER DEFAULT 0,
    autoresponder_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Databases Table
CREATE TABLE IF NOT EXISTS user_databases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    database_name VARCHAR(255) NOT NULL,
    database_type VARCHAR(50) DEFAULT 'mysql', -- mysql or postgresql
    size_mb INTEGER DEFAULT 0,
    tables_count INTEGER DEFAULT 0,
    users_count INTEGER DEFAULT 1,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, database_name)
);

-- 5. SSL Certificates Table
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    certificate_type VARCHAR(50) DEFAULT 'letsencrypt', -- letsencrypt, custom, self-signed
    issuer VARCHAR(255) DEFAULT 'Let''s Encrypt Authority X3',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'paid', -- paid, pending, failed
    payment_method VARCHAR(100),
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Support Tickets Table
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_number VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'open', -- open, in-progress, resolved, closed
    priority VARCHAR(50) DEFAULT 'medium', -- low, medium, high, urgent
    assigned_to VARCHAR(255),
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_type VARCHAR(50), -- visa, mastercard, amex
    last_four VARCHAR(4) NOT NULL,
    expiry_month INTEGER NOT NULL,
    expiry_year INTEGER NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance (safe with IF NOT EXISTS in newer PostgreSQL)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_websites_user_id') THEN
        CREATE INDEX idx_websites_user_id ON websites(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_domains_user_id') THEN
        CREATE INDEX idx_domains_user_id ON domains(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_email_accounts_user_id') THEN
        CREATE INDEX idx_email_accounts_user_id ON email_accounts(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_databases_user_id') THEN
        CREATE INDEX idx_user_databases_user_id ON user_databases(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ssl_certificates_user_id') THEN
        CREATE INDEX idx_ssl_certificates_user_id ON ssl_certificates(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_invoices_user_id') THEN
        CREATE INDEX idx_invoices_user_id ON invoices(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_support_tickets_user_id') THEN
        CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payment_methods_user_id') THEN
        CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
    END IF;
END $$;

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then recreate
DROP TRIGGER IF EXISTS update_websites_updated_at ON websites;
CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON websites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON email_accounts;
CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON email_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_databases_updated_at ON user_databases;
CREATE TRIGGER update_user_databases_updated_at BEFORE UPDATE ON user_databases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ssl_certificates_updated_at ON ssl_certificates;
CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON ssl_certificates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets;
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;

-- Verify tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('websites', 'domains', 'email_accounts', 'user_databases', 
                  'ssl_certificates', 'invoices', 'support_tickets', 'payment_methods')
ORDER BY tablename;

-- Show table count
SELECT 'Tables created successfully!' as status, COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('websites', 'domains', 'email_accounts', 'user_databases', 
                  'ssl_certificates', 'invoices', 'support_tickets', 'payment_methods');
