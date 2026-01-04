-- Domain Management Tables

-- Main domains table
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, expired
    document_root VARCHAR(500) DEFAULT '/public_html',
    ssl_enabled BOOLEAN DEFAULT FALSE,
    ssl_provider VARCHAR(50), -- letsencrypt, custom, none
    ssl_expires_at TIMESTAMP,
    auto_renew_ssl BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP
);

-- DNS records table
CREATE TABLE IF NOT EXISTS dns_records (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    record_type VARCHAR(10) NOT NULL, -- A, AAAA, CNAME, MX, TXT, SRV, NS
    name VARCHAR(255) NOT NULL, -- subdomain or @ for root
    value TEXT NOT NULL, -- IP address, domain, or text value
    ttl INTEGER DEFAULT 3600, -- Time to live in seconds
    priority INTEGER, -- For MX and SRV records
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SSL certificates table
CREATE TABLE IF NOT EXISTS ssl_certificates (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    certificate TEXT, -- Full certificate chain
    private_key TEXT, -- Private key (encrypted)
    issuer VARCHAR(255), -- Certificate authority
    issued_at TIMESTAMP,
    expires_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Domain aliases/subdomains
CREATE TABLE IF NOT EXISTS domain_aliases (
    id SERIAL PRIMARY KEY,
    domain_id INTEGER NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    alias_name VARCHAR(255) NOT NULL,
    document_root VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domains_user_id ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_dns_records_domain_id ON dns_records(domain_id);
CREATE INDEX IF NOT EXISTS idx_ssl_certificates_domain_id ON ssl_certificates(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_aliases_domain_id ON domain_aliases(domain_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_domains_updated_at ON domains;
CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dns_records_updated_at ON dns_records;
CREATE TRIGGER update_dns_records_updated_at BEFORE UPDATE ON dns_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ssl_certificates_updated_at ON ssl_certificates;
CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON ssl_certificates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
