-- PowerDNS Backend Schema for PostgreSQL
-- This schema is compatible with PowerDNS 4.x
-- Allows PowerDNS to read DNS records directly from this database

-- =================================================================
-- DOMAINS TABLE (PowerDNS format)
-- =================================================================
-- Note: This is DIFFERENT from our 'domains' table
-- PowerDNS uses 'domains' for zone management
-- We'll use 'pdns_domains' to avoid conflict

CREATE TABLE IF NOT EXISTS pdns_domains (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(255) NOT NULL UNIQUE,
    master                VARCHAR(128) DEFAULT NULL,
    last_check            INT DEFAULT NULL,
    type                  VARCHAR(8) NOT NULL,
    notified_serial       BIGINT DEFAULT NULL,
    account               VARCHAR(40) DEFAULT NULL,
    options               TEXT DEFAULT NULL,
    catalog               VARCHAR(255) DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS pdns_name_index ON pdns_domains(name);
CREATE INDEX IF NOT EXISTS pdns_account_index ON pdns_domains(account);


-- =================================================================
-- RECORDS TABLE (PowerDNS format)
-- =================================================================
-- This table stores actual DNS records that PowerDNS will serve
-- We'll sync from our 'dns_records' table to this table

CREATE TABLE IF NOT EXISTS pdns_records (
    id                    BIGSERIAL PRIMARY KEY,
    domain_id             INT DEFAULT NULL,
    name                  VARCHAR(255) DEFAULT NULL,
    type                  VARCHAR(10) DEFAULT NULL,
    content               VARCHAR(65535) DEFAULT NULL,
    ttl                   INT DEFAULT NULL,
    prio                  INT DEFAULT NULL,
    disabled              BOOLEAN DEFAULT FALSE,
    ordername             VARCHAR(255),
    auth                  BOOLEAN DEFAULT TRUE,
    CONSTRAINT pdns_records_domain_id_fkey 
        FOREIGN KEY (domain_id) 
        REFERENCES pdns_domains(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pdns_rec_name_index ON pdns_records(name);
CREATE INDEX IF NOT EXISTS pdns_nametype_index ON pdns_records(name,type);
CREATE INDEX IF NOT EXISTS pdns_domain_id_index ON pdns_records(domain_id);
CREATE INDEX IF NOT EXISTS pdns_orderindex ON pdns_records(ordername);


-- =================================================================
-- SUPERMASTERS TABLE (Optional - for secondary DNS)
-- =================================================================
CREATE TABLE IF NOT EXISTS pdns_supermasters (
    ip                    INET NOT NULL,
    nameserver            VARCHAR(255) NOT NULL,
    account               VARCHAR(40) NOT NULL,
    PRIMARY KEY(ip, nameserver)
);


-- =================================================================
-- COMMENTS TABLE (Optional - for record comments)
-- =================================================================
CREATE TABLE IF NOT EXISTS pdns_comments (
    id                    SERIAL PRIMARY KEY,
    domain_id             INT NOT NULL,
    name                  VARCHAR(255) NOT NULL,
    type                  VARCHAR(10) NOT NULL,
    modified_at           INT NOT NULL,
    account               VARCHAR(40) DEFAULT NULL,
    comment               TEXT NOT NULL,
    CONSTRAINT pdns_comments_domain_id_fkey 
        FOREIGN KEY (domain_id) 
        REFERENCES pdns_domains(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pdns_comments_domain_id_idx ON pdns_comments(domain_id);
CREATE INDEX IF NOT EXISTS pdns_comments_name_type_idx ON pdns_comments(name, type);
CREATE INDEX IF NOT EXISTS pdns_comments_order_idx ON pdns_comments(domain_id, modified_at);


-- =================================================================
-- DOMAINMETADATA TABLE (Optional - for DNSSEC and other metadata)
-- =================================================================
CREATE TABLE IF NOT EXISTS pdns_domainmetadata (
    id                    SERIAL PRIMARY KEY,
    domain_id             INT NOT NULL,
    kind                  VARCHAR(32) DEFAULT NULL,
    content               TEXT,
    CONSTRAINT pdns_domainmetadata_domain_id_fkey 
        FOREIGN KEY (domain_id) 
        REFERENCES pdns_domains(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pdns_domainmetadata_idx ON pdns_domainmetadata(domain_id, kind);


-- =================================================================
-- CRYPTOKEYS TABLE (For DNSSEC)
-- =================================================================
CREATE TABLE IF NOT EXISTS pdns_cryptokeys (
    id                    SERIAL PRIMARY KEY,
    domain_id             INT NOT NULL,
    flags                 INT NOT NULL,
    active                BOOLEAN,
    published             BOOLEAN DEFAULT TRUE,
    content               TEXT,
    CONSTRAINT pdns_cryptokeys_domain_id_fkey 
        FOREIGN KEY (domain_id) 
        REFERENCES pdns_domains(id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS pdns_cryptokeys_domain_id_idx ON pdns_cryptokeys(domain_id);


-- =================================================================
-- TSIGKEYS TABLE (For zone transfer authentication)
-- =================================================================
CREATE TABLE IF NOT EXISTS pdns_tsigkeys (
    id                    SERIAL PRIMARY KEY,
    name                  VARCHAR(255) UNIQUE,
    algorithm             VARCHAR(50),
    secret                VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS pdns_tsigkeys_name_idx ON pdns_tsigkeys(name);


-- =================================================================
-- SYNC FUNCTION: Our dns_records → PowerDNS pdns_records
-- =================================================================
-- This function syncs our application's DNS records to PowerDNS format

CREATE OR REPLACE FUNCTION sync_dns_to_powerdns()
RETURNS TRIGGER AS $$
DECLARE
    pdns_domain_id INT;
    domain_name_var VARCHAR(255);
BEGIN
    -- Get domain name from our domains table
    SELECT domain_name INTO domain_name_var
    FROM domains WHERE id = NEW.domain_id;
    
    -- Ensure PowerDNS domain exists
    INSERT INTO pdns_domains (name, type, account)
    VALUES (domain_name_var, 'NATIVE', 'cloudku')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO pdns_domain_id;
    
    -- Insert/Update record in PowerDNS format
    INSERT INTO pdns_records (domain_id, name, type, content, ttl, prio, auth)
    VALUES (
        pdns_domain_id,
        CASE 
            WHEN NEW.name = '@' THEN domain_name_var
            ELSE NEW.name || '.' || domain_name_var
        END,
        NEW.record_type,
        NEW.value,
        NEW.ttl,
        NEW.priority,
        TRUE
    )
    ON CONFLICT (name, type) DO UPDATE 
    SET content = EXCLUDED.content,
        ttl = EXCLUDED.ttl,
        prio = EXCLUDED.prio;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =================================================================
-- TRIGGER: Auto-sync on dns_records INSERT/UPDATE
-- =================================================================
DROP TRIGGER IF EXISTS dns_to_powerdns_sync ON dns_records;

CREATE TRIGGER dns_to_powerdns_sync
AFTER INSERT OR UPDATE ON dns_records
FOR EACH ROW
EXECUTE FUNCTION sync_dns_to_powerdns();


-- =================================================================
-- CLEANUP FUNCTION: Delete from PowerDNS when we delete dns_record
-- =================================================================
CREATE OR REPLACE FUNCTION cleanup_powerdns_record()
RETURNS TRIGGER AS $$
DECLARE
    domain_name_var VARCHAR(255);
    record_name_var VARCHAR(255);
BEGIN
    SELECT domain_name INTO domain_name_var
    FROM domains WHERE id = OLD.domain_id;
    
    record_name_var := CASE 
        WHEN OLD.name = '@' THEN domain_name_var
        ELSE OLD.name || '.' || domain_name_var
    END;
    
    DELETE FROM pdns_records 
    WHERE name = record_name_var 
    AND type = OLD.record_type;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dns_cleanup_powerdns ON dns_records;

CREATE TRIGGER dns_cleanup_powerdns
AFTER DELETE ON dns_records
FOR EACH ROW
EXECUTE FUNCTION cleanup_powerdns_record();


-- =================================================================
-- INITIAL SOA RECORDS
-- =================================================================
-- PowerDNS requires SOA record for each domain
-- We'll auto-create this when domain is added

CREATE OR REPLACE FUNCTION create_soa_record()
RETURNS TRIGGER AS $$
DECLARE
    pdns_domain_id INT;
    soa_content TEXT;
BEGIN
    -- Create PowerDNS domain entry
    INSERT INTO pdns_domains (name, type, account)
    VALUES (NEW.domain_name, 'NATIVE', 'user_' || NEW.user_id)
    RETURNING id INTO pdns_domain_id;
    
    -- Create SOA record (Start of Authority)
    soa_content := 'ns1.cloudku.com hostmaster.' || NEW.domain_name || ' ' ||
                   EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT || ' ' || -- Serial
                   '10800 3600 604800 3600'; -- Refresh, Retry, Expire, Minimum TTL
    
    INSERT INTO pdns_records (domain_id, name, type, content, ttl, prio, auth)
    VALUES (pdns_domain_id, NEW.domain_name, 'SOA', soa_content, 3600, NULL, TRUE);
    
    -- Create NS records (Name Servers)
    INSERT INTO pdns_records (domain_id, name, type, content, ttl, prio, auth)
    VALUES 
        (pdns_domain_id, NEW.domain_name, 'NS', 'ns1.cloudku.com', 3600, NULL, TRUE),
        (pdns_domain_id, NEW.domain_name, 'NS', 'ns2.cloudku.com', 3600, NULL, TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_domain_soa ON domains;

CREATE TRIGGER create_domain_soa
AFTER INSERT ON domains
FOR EACH ROW
EXECUTE FUNCTION create_soa_record();


-- =================================================================
-- UTILITY VIEWS
-- =================================================================

-- View: All DNS records in human-readable format
CREATE OR REPLACE VIEW v_dns_records AS
SELECT 
    d.domain_name,
    dr.name as record_name,
    dr.record_type,
    dr.value as content,
    dr.ttl,
    dr.priority,
    dr.created_at
FROM dns_records dr
JOIN domains d ON dr.domain_id = d.id
ORDER BY d.domain_name, dr.record_type, dr.name;

-- View: PowerDNS records (for debugging)
CREATE OR REPLACE VIEW v_powerdns_records AS
SELECT 
    pd.name as domain,
    pr.name as fqdn,
    pr.type,
    pr.content,
    pr.ttl,
    pr.prio as priority,
    pr.disabled
FROM pdns_records pr
JOIN pdns_domains pd ON pr.domain_id = pd.id
ORDER BY pd.name, pr.type, pr.name;


-- =================================================================
-- GRANT PERMISSIONS (for PowerDNS user)
-- =================================================================
-- Run this after creating a dedicated PowerDNS database user:
-- CREATE USER pdns WITH PASSWORD 'secure_password';

-- GRANT SELECT ON pdns_domains TO pdns;
-- GRANT SELECT ON pdns_records TO pdns;
-- GRANT SELECT ON pdns_supermasters TO pdns;
-- GRANT SELECT ON pdns_comments TO pdns;
-- GRANT SELECT ON pdns_domainmetadata TO pdns;
-- GRANT SELECT ON pdns_cryptokeys TO pdns;
-- GRANT SELECT ON pdns_tsigkeys TO pdns;
