--
-- PostgreSQL database dump
--

\restrict kaziS6TZvt18G9cUpJnpCX8NBsN2uYqriDPTA02IJ7jt2c4atisgUTohZ0EpXuA

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-04 10:05:28

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 895 (class 1247 OID 26119)
-- Name: auth_provider; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.auth_provider AS ENUM (
    'google',
    'facebook',
    'email'
);


ALTER TYPE public.auth_provider OWNER TO postgres;

--
-- TOC entry 258 (class 1255 OID 26182)
-- Name: cleanup_expired_sessions(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_sessions() OWNER TO postgres;

--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 258
-- Name: FUNCTION cleanup_expired_sessions(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Hapus expired sessions, jalankan via cron';


--
-- TOC entry 261 (class 1255 OID 26730)
-- Name: cleanup_powerdns_record(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_powerdns_record() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.cleanup_powerdns_record() OWNER TO postgres;

--
-- TOC entry 273 (class 1255 OID 26732)
-- Name: create_soa_record(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_soa_record() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.create_soa_record() OWNER TO postgres;

--
-- TOC entry 260 (class 1255 OID 26728)
-- Name: sync_dns_to_powerdns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_dns_to_powerdns() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.sync_dns_to_powerdns() OWNER TO postgres;

--
-- TOC entry 259 (class 1255 OID 26176)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 238 (class 1259 OID 26534)
-- Name: dns_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dns_records (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    record_type character varying(10) NOT NULL,
    name character varying(255) NOT NULL,
    value text NOT NULL,
    ttl integer DEFAULT 3600,
    priority integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dns_records OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 26533)
-- Name: dns_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dns_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dns_records_id_seq OWNER TO postgres;

--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 237
-- Name: dns_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dns_records_id_seq OWNED BY public.dns_records.id;


--
-- TOC entry 242 (class 1259 OID 26575)
-- Name: domain_aliases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domain_aliases (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    alias_name character varying(255) NOT NULL,
    document_root character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.domain_aliases OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 26574)
-- Name: domain_aliases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domain_aliases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domain_aliases_id_seq OWNER TO postgres;

--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 241
-- Name: domain_aliases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domain_aliases_id_seq OWNED BY public.domain_aliases.id;


--
-- TOC entry 236 (class 1259 OID 26509)
-- Name: domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domains (
    id integer NOT NULL,
    user_id integer NOT NULL,
    domain_name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    document_root character varying(500) DEFAULT '/public_html'::character varying,
    ssl_enabled boolean DEFAULT false,
    ssl_provider character varying(50),
    ssl_expires_at timestamp without time zone,
    auto_renew_ssl boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    verified_at timestamp without time zone,
    expires_at timestamp without time zone
);


ALTER TABLE public.domains OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 26508)
-- Name: domains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.domains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.domains_id_seq OWNER TO postgres;

--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 235
-- Name: domains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.domains_id_seq OWNED BY public.domains.id;


--
-- TOC entry 226 (class 1259 OID 26234)
-- Name: email_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_accounts (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email character varying(255) NOT NULL,
    quota_mb integer DEFAULT 5120,
    used_mb integer DEFAULT 0,
    status character varying(50) DEFAULT 'active'::character varying,
    forwarders_count integer DEFAULT 0,
    autoresponder_enabled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.email_accounts OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 26233)
-- Name: email_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.email_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.email_accounts_id_seq OWNER TO postgres;

--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 225
-- Name: email_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.email_accounts_id_seq OWNED BY public.email_accounts.id;


--
-- TOC entry 230 (class 1259 OID 26312)
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    user_id integer NOT NULL,
    invoice_number character varying(100) NOT NULL,
    description text,
    amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'paid'::character varying,
    payment_method character varying(100),
    invoice_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    due_date timestamp without time zone,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 26311)
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.invoices_id_seq OWNER TO postgres;

--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 229
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- TOC entry 234 (class 1259 OID 26361)
-- Name: payment_methods; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payment_methods (
    id integer NOT NULL,
    user_id integer NOT NULL,
    card_type character varying(50),
    last_four character varying(4) NOT NULL,
    expiry_month integer NOT NULL,
    expiry_year integer NOT NULL,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.payment_methods OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 26360)
-- Name: payment_methods_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payment_methods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_methods_id_seq OWNER TO postgres;

--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 233
-- Name: payment_methods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payment_methods_id_seq OWNED BY public.payment_methods.id;


--
-- TOC entry 249 (class 1259 OID 26655)
-- Name: pdns_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_comments (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(10) NOT NULL,
    modified_at integer NOT NULL,
    account character varying(40) DEFAULT NULL::character varying,
    comment text NOT NULL
);


ALTER TABLE public.pdns_comments OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 26654)
-- Name: pdns_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_comments_id_seq OWNER TO postgres;

--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 248
-- Name: pdns_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_comments_id_seq OWNED BY public.pdns_comments.id;


--
-- TOC entry 253 (class 1259 OID 26697)
-- Name: pdns_cryptokeys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_cryptokeys (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    flags integer NOT NULL,
    active boolean,
    published boolean DEFAULT true,
    content text
);


ALTER TABLE public.pdns_cryptokeys OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 26696)
-- Name: pdns_cryptokeys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_cryptokeys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_cryptokeys_id_seq OWNER TO postgres;

--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 252
-- Name: pdns_cryptokeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_cryptokeys_id_seq OWNED BY public.pdns_cryptokeys.id;


--
-- TOC entry 251 (class 1259 OID 26679)
-- Name: pdns_domainmetadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_domainmetadata (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    kind character varying(32) DEFAULT NULL::character varying,
    content text
);


ALTER TABLE public.pdns_domainmetadata OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 26678)
-- Name: pdns_domainmetadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_domainmetadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_domainmetadata_id_seq OWNER TO postgres;

--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 250
-- Name: pdns_domainmetadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_domainmetadata_id_seq OWNED BY public.pdns_domainmetadata.id;


--
-- TOC entry 244 (class 1259 OID 26602)
-- Name: pdns_domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_domains (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    master character varying(128) DEFAULT NULL::character varying,
    last_check integer,
    type character varying(8) NOT NULL,
    notified_serial bigint,
    account character varying(40) DEFAULT NULL::character varying,
    options text,
    catalog character varying(255) DEFAULT NULL::character varying
);


ALTER TABLE public.pdns_domains OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 26601)
-- Name: pdns_domains_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_domains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_domains_id_seq OWNER TO postgres;

--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 243
-- Name: pdns_domains_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_domains_id_seq OWNED BY public.pdns_domains.id;


--
-- TOC entry 246 (class 1259 OID 26621)
-- Name: pdns_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_records (
    id bigint NOT NULL,
    domain_id integer,
    name character varying(255) DEFAULT NULL::character varying,
    type character varying(10) DEFAULT NULL::character varying,
    content character varying(65535) DEFAULT NULL::character varying,
    ttl integer,
    prio integer,
    disabled boolean DEFAULT false,
    ordername character varying(255),
    auth boolean DEFAULT true
);


ALTER TABLE public.pdns_records OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 26620)
-- Name: pdns_records_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_records_id_seq OWNER TO postgres;

--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 245
-- Name: pdns_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_records_id_seq OWNED BY public.pdns_records.id;


--
-- TOC entry 247 (class 1259 OID 26644)
-- Name: pdns_supermasters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_supermasters (
    ip inet NOT NULL,
    nameserver character varying(255) NOT NULL,
    account character varying(40) NOT NULL
);


ALTER TABLE public.pdns_supermasters OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 26716)
-- Name: pdns_tsigkeys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pdns_tsigkeys (
    id integer NOT NULL,
    name character varying(255),
    algorithm character varying(50),
    secret character varying(255)
);


ALTER TABLE public.pdns_tsigkeys OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 26715)
-- Name: pdns_tsigkeys_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pdns_tsigkeys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pdns_tsigkeys_id_seq OWNER TO postgres;

--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 254
-- Name: pdns_tsigkeys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pdns_tsigkeys_id_seq OWNED BY public.pdns_tsigkeys.id;


--
-- TOC entry 222 (class 1259 OID 26150)
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    refresh_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip_address character varying(45),
    user_agent text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- TOC entry 5367 (class 0 OID 0)
-- Dependencies: 222
-- Name: TABLE sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sessions IS 'Tabel untuk menyimpan refresh tokens dan session management';


--
-- TOC entry 221 (class 1259 OID 26149)
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sessions_id_seq OWNER TO postgres;

--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- TOC entry 240 (class 1259 OID 26556)
-- Name: ssl_certificates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ssl_certificates (
    id integer NOT NULL,
    domain_id integer NOT NULL,
    certificate text,
    private_key text,
    issuer character varying(255),
    issued_at timestamp without time zone,
    expires_at timestamp without time zone,
    auto_renew boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ssl_certificates OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 26555)
-- Name: ssl_certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ssl_certificates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ssl_certificates_id_seq OWNER TO postgres;

--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 239
-- Name: ssl_certificates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ssl_certificates_id_seq OWNED BY public.ssl_certificates.id;


--
-- TOC entry 232 (class 1259 OID 26336)
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    ticket_number character varying(100) NOT NULL,
    subject character varying(500) NOT NULL,
    message text,
    status character varying(50) DEFAULT 'open'::character varying,
    priority character varying(50) DEFAULT 'medium'::character varying,
    assigned_to character varying(255),
    last_update timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 26335)
-- Name: support_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_tickets_id_seq OWNER TO postgres;

--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 231
-- Name: support_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_tickets_id_seq OWNED BY public.support_tickets.id;


--
-- TOC entry 228 (class 1259 OID 26258)
-- Name: user_databases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_databases (
    id integer NOT NULL,
    user_id integer NOT NULL,
    database_name character varying(255) NOT NULL,
    database_type character varying(50) DEFAULT 'mysql'::character varying,
    size_mb integer DEFAULT 0,
    tables_count integer DEFAULT 0,
    users_count integer DEFAULT 1,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_databases OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 26257)
-- Name: user_databases_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_databases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_databases_id_seq OWNER TO postgres;

--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 227
-- Name: user_databases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_databases_id_seq OWNED BY public.user_databases.id;


--
-- TOC entry 220 (class 1259 OID 26126)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    password_hash character varying(255),
    profile_picture text,
    auth_provider character varying(255) DEFAULT 'email'::public.auth_provider NOT NULL,
    google_id character varying(255),
    facebook_id character varying(255),
    email_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp without time zone,
    github_id character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 220
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.users IS 'Tabel untuk menyimpan data pengguna dari berbagai auth provider';


--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.password_hash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.password_hash IS 'bcrypt hash, NULL untuk OAuth users';


--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 220
-- Name: COLUMN users.google_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.google_id IS 'Google User ID (sub) dari JWT token Google OAuth';


--
-- TOC entry 219 (class 1259 OID 26125)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 256 (class 1259 OID 26734)
-- Name: v_dns_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_dns_records AS
 SELECT d.domain_name,
    dr.name AS record_name,
    dr.record_type,
    dr.value AS content,
    dr.ttl,
    dr.priority,
    dr.created_at
   FROM (public.dns_records dr
     JOIN public.domains d ON ((dr.domain_id = d.id)))
  ORDER BY d.domain_name, dr.record_type, dr.name;


ALTER VIEW public.v_dns_records OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 26739)
-- Name: v_powerdns_records; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.v_powerdns_records AS
 SELECT pd.name AS domain,
    pr.name AS fqdn,
    pr.type,
    pr.content,
    pr.ttl,
    pr.prio AS priority,
    pr.disabled
   FROM (public.pdns_records pr
     JOIN public.pdns_domains pd ON ((pr.domain_id = pd.id)))
  ORDER BY pd.name, pr.type, pr.name;


ALTER VIEW public.v_powerdns_records OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 26184)
-- Name: websites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.websites (
    id integer NOT NULL,
    user_id integer NOT NULL,
    domain character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying,
    plan character varying(100) DEFAULT 'premium'::character varying,
    visitors_count integer DEFAULT 0,
    storage_used bigint DEFAULT 0,
    bandwidth_used bigint DEFAULT 0,
    uptime_percentage numeric(5,2) DEFAULT 99.9,
    ssl_enabled boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.websites OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 26183)
-- Name: websites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.websites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.websites_id_seq OWNER TO postgres;

--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 223
-- Name: websites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.websites_id_seq OWNED BY public.websites.id;


--
-- TOC entry 5017 (class 2604 OID 26537)
-- Name: dns_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dns_records ALTER COLUMN id SET DEFAULT nextval('public.dns_records_id_seq'::regclass);


--
-- TOC entry 5025 (class 2604 OID 26578)
-- Name: domain_aliases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_aliases ALTER COLUMN id SET DEFAULT nextval('public.domain_aliases_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 26512)
-- Name: domains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains ALTER COLUMN id SET DEFAULT nextval('public.domains_id_seq'::regclass);


--
-- TOC entry 4979 (class 2604 OID 26237)
-- Name: email_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts ALTER COLUMN id SET DEFAULT nextval('public.email_accounts_id_seq'::regclass);


--
-- TOC entry 4995 (class 2604 OID 26315)
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- TOC entry 5006 (class 2604 OID 26364)
-- Name: payment_methods id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods ALTER COLUMN id SET DEFAULT nextval('public.payment_methods_id_seq'::regclass);


--
-- TOC entry 5037 (class 2604 OID 26658)
-- Name: pdns_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_comments ALTER COLUMN id SET DEFAULT nextval('public.pdns_comments_id_seq'::regclass);


--
-- TOC entry 5041 (class 2604 OID 26700)
-- Name: pdns_cryptokeys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_cryptokeys ALTER COLUMN id SET DEFAULT nextval('public.pdns_cryptokeys_id_seq'::regclass);


--
-- TOC entry 5039 (class 2604 OID 26682)
-- Name: pdns_domainmetadata id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domainmetadata ALTER COLUMN id SET DEFAULT nextval('public.pdns_domainmetadata_id_seq'::regclass);


--
-- TOC entry 5027 (class 2604 OID 26605)
-- Name: pdns_domains id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domains ALTER COLUMN id SET DEFAULT nextval('public.pdns_domains_id_seq'::regclass);


--
-- TOC entry 5031 (class 2604 OID 26624)
-- Name: pdns_records id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_records ALTER COLUMN id SET DEFAULT nextval('public.pdns_records_id_seq'::regclass);


--
-- TOC entry 5043 (class 2604 OID 26719)
-- Name: pdns_tsigkeys id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_tsigkeys ALTER COLUMN id SET DEFAULT nextval('public.pdns_tsigkeys_id_seq'::regclass);


--
-- TOC entry 4967 (class 2604 OID 26153)
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 26559)
-- Name: ssl_certificates id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ssl_certificates ALTER COLUMN id SET DEFAULT nextval('public.ssl_certificates_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 26339)
-- Name: support_tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets ALTER COLUMN id SET DEFAULT nextval('public.support_tickets_id_seq'::regclass);


--
-- TOC entry 4987 (class 2604 OID 26261)
-- Name: user_databases id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_databases ALTER COLUMN id SET DEFAULT nextval('public.user_databases_id_seq'::regclass);


--
-- TOC entry 4961 (class 2604 OID 26129)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4969 (class 2604 OID 26187)
-- Name: websites id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.websites ALTER COLUMN id SET DEFAULT nextval('public.websites_id_seq'::regclass);


--
-- TOC entry 5331 (class 0 OID 26534)
-- Dependencies: 238
-- Data for Name: dns_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dns_records (id, domain_id, record_type, name, value, ttl, priority, created_at, updated_at) FROM stdin;
1	1	A	@	127.0.0.1	3600	\N	2026-01-02 15:02:53.270073	2026-01-02 15:02:53.270073
2	1	A	www	127.0.0.1	3600	\N	2026-01-02 15:02:53.274076	2026-01-02 15:02:53.274076
3	1	CNAME	ftp	nazxf.my.id	3600	\N	2026-01-02 15:02:53.275134	2026-01-02 15:02:53.275134
4	1	MX	@	mail.nazxf.my.id	3600	10	2026-01-02 15:02:53.276252	2026-01-02 15:02:53.276252
\.


--
-- TOC entry 5335 (class 0 OID 26575)
-- Dependencies: 242
-- Data for Name: domain_aliases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domain_aliases (id, domain_id, alias_name, document_root, created_at) FROM stdin;
\.


--
-- TOC entry 5329 (class 0 OID 26509)
-- Dependencies: 236
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domains (id, user_id, domain_name, status, document_root, ssl_enabled, ssl_provider, ssl_expires_at, auto_renew_ssl, created_at, updated_at, verified_at, expires_at) FROM stdin;
1	1	nazxf.my.id	active	/public_html	t	letsencrypt	2026-04-02 15:33:41.195	t	2026-01-02 15:02:53.260741	2026-01-02 15:33:41.196553	2026-01-02 15:03:05.894275	\N
\.


--
-- TOC entry 5319 (class 0 OID 26234)
-- Dependencies: 226
-- Data for Name: email_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_accounts (id, user_id, email, quota_mb, used_mb, status, forwarders_count, autoresponder_enabled, created_at, updated_at) FROM stdin;
1	1	admin@example.com	5120	1228	active	2	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	support@example.com	10240	4608	active	0	t	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
3	1	info@mywebsite.com	5120	819	active	1	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
4	1	contact@example.com	5120	512	active	0	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
5	1	sales@example.com	10240	2048	active	3	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5323 (class 0 OID 26312)
-- Dependencies: 230
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, user_id, invoice_number, description, amount, status, payment_method, invoice_date, due_date, paid_at, created_at, updated_at) FROM stdin;
1	1	INV-2024-001	Premium Plan - Monthly	29.99	paid	Visa ending in 4242	2025-12-13 10:16:20.616823	\N	2025-12-13 10:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	INV-2023-012	Premium Plan - Monthly	29.99	paid	Visa ending in 4242	2025-11-13 10:16:20.616823	\N	2025-11-13 10:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
3	1	INV-2023-011	Premium Plan - Monthly	29.99	paid	Visa ending in 4242	2025-10-14 10:16:20.616823	\N	2025-10-14 10:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5327 (class 0 OID 26361)
-- Dependencies: 234
-- Data for Name: payment_methods; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payment_methods (id, user_id, card_type, last_four, expiry_month, expiry_year, is_default, created_at, updated_at) FROM stdin;
1	1	visa	4242	12	2025	t	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	mastercard	8888	6	2026	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5342 (class 0 OID 26655)
-- Dependencies: 249
-- Data for Name: pdns_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_comments (id, domain_id, name, type, modified_at, account, comment) FROM stdin;
\.


--
-- TOC entry 5346 (class 0 OID 26697)
-- Dependencies: 253
-- Data for Name: pdns_cryptokeys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_cryptokeys (id, domain_id, flags, active, published, content) FROM stdin;
\.


--
-- TOC entry 5344 (class 0 OID 26679)
-- Dependencies: 251
-- Data for Name: pdns_domainmetadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_domainmetadata (id, domain_id, kind, content) FROM stdin;
\.


--
-- TOC entry 5337 (class 0 OID 26602)
-- Dependencies: 244
-- Data for Name: pdns_domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_domains (id, name, master, last_check, type, notified_serial, account, options, catalog) FROM stdin;
\.


--
-- TOC entry 5339 (class 0 OID 26621)
-- Dependencies: 246
-- Data for Name: pdns_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_records (id, domain_id, name, type, content, ttl, prio, disabled, ordername, auth) FROM stdin;
\.


--
-- TOC entry 5340 (class 0 OID 26644)
-- Dependencies: 247
-- Data for Name: pdns_supermasters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_supermasters (ip, nameserver, account) FROM stdin;
\.


--
-- TOC entry 5348 (class 0 OID 26716)
-- Dependencies: 255
-- Data for Name: pdns_tsigkeys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pdns_tsigkeys (id, name, algorithm, secret) FROM stdin;
\.


--
-- TOC entry 5315 (class 0 OID 26150)
-- Dependencies: 222
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, refresh_token, expires_at, created_at, ip_address, user_agent) FROM stdin;
\.


--
-- TOC entry 5333 (class 0 OID 26556)
-- Dependencies: 240
-- Data for Name: ssl_certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ssl_certificates (id, domain_id, certificate, private_key, issuer, issued_at, expires_at, auto_renew, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5325 (class 0 OID 26336)
-- Dependencies: 232
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, user_id, ticket_number, subject, message, status, priority, assigned_to, last_update, created_at, updated_at) FROM stdin;
1	1	TK-2024-001	Unable to upload files via FTP	I am getting permission denied errors when trying to upload files via FTP to /public_html directory.	open	high	Support Team	2025-12-28 08:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	TK-2024-002	SSL certificate installation help	Need assistance installing SSL certificate for my domain.	in-progress	medium	Technical Support	2025-12-27 10:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
3	1	TK-2023-125	Domain transfer assistance	Want to transfer my domain from another registrar. What are the steps?	resolved	low	Domain Support	2025-12-23 10:16:20.616823	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5321 (class 0 OID 26258)
-- Dependencies: 228
-- Data for Name: user_databases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_databases (id, user_id, database_name, database_type, size_mb, tables_count, users_count, status, created_at, updated_at) FROM stdin;
1	1	example_wp	mysql	45	12	2	active	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	mywebsite_db	mysql	128	28	1	active	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
3	1	test_database	postgresql	12	5	1	active	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5313 (class 0 OID 26126)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, profile_picture, auth_provider, google_id, facebook_id, email_verified, is_active, created_at, updated_at, last_login, github_id) FROM stdin;
1	kuramanafi231@gmail.com	Nafixhutao	\N	https://avatars.githubusercontent.com/u/135522402?v=4	github	110393598260253187860	\N	t	t	2025-12-27 18:54:53.32401	2026-01-02 14:33:46.673384	2026-01-02 14:33:46.673384	135522402
3	test@example.com	Test User	$2b$10$1t2ufDNznixv/vH1cqEFsOt3QoQGEJ1AYrvWY0/kIuKuYanJmq/3u	\N	email	\N	\N	f	t	2025-12-30 07:47:47.890116	2025-12-30 07:47:47.890116	\N	\N
4	nayfaalfiyah@gmail.com	nafi432	\N	https://avatars.githubusercontent.com/u/252149135?v=4	github	\N	\N	t	t	2025-12-30 16:09:50.486509	2025-12-30 16:09:50.503651	2025-12-30 16:09:50.503651	252149135
2	nafiaku447@gmail.com	Nazxf	\N	https://avatars.githubusercontent.com/u/224392994?v=4	github	103514806101959329308	\N	t	t	2025-12-28 19:27:44.958456	2026-01-01 09:11:05.268738	2026-01-01 09:11:05.268738	224392994
\.


--
-- TOC entry 5317 (class 0 OID 26184)
-- Dependencies: 224
-- Data for Name: websites; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.websites (id, user_id, domain, status, plan, visitors_count, storage_used, bandwidth_used, uptime_percentage, ssl_enabled, created_at, updated_at) FROM stdin;
1	1	example.com	active	Premium	12500	2516582400	48318382080	99.90	t	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
2	1	mywebsite.com	active	Business	8200	1932735283	38654705664	100.00	t	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
3	1	testsite.com	maintenance	Premium	3100	943718400	20401094656	98.50	f	2025-12-28 10:16:20.616823	2025-12-28 10:16:20.616823
\.


--
-- TOC entry 5377 (class 0 OID 0)
-- Dependencies: 237
-- Name: dns_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dns_records_id_seq', 4, true);


--
-- TOC entry 5378 (class 0 OID 0)
-- Dependencies: 241
-- Name: domain_aliases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domain_aliases_id_seq', 1, false);


--
-- TOC entry 5379 (class 0 OID 0)
-- Dependencies: 235
-- Name: domains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.domains_id_seq', 1, true);


--
-- TOC entry 5380 (class 0 OID 0)
-- Dependencies: 225
-- Name: email_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.email_accounts_id_seq', 5, true);


--
-- TOC entry 5381 (class 0 OID 0)
-- Dependencies: 229
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.invoices_id_seq', 3, true);


--
-- TOC entry 5382 (class 0 OID 0)
-- Dependencies: 233
-- Name: payment_methods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payment_methods_id_seq', 2, true);


--
-- TOC entry 5383 (class 0 OID 0)
-- Dependencies: 248
-- Name: pdns_comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_comments_id_seq', 1, false);


--
-- TOC entry 5384 (class 0 OID 0)
-- Dependencies: 252
-- Name: pdns_cryptokeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_cryptokeys_id_seq', 1, false);


--
-- TOC entry 5385 (class 0 OID 0)
-- Dependencies: 250
-- Name: pdns_domainmetadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_domainmetadata_id_seq', 1, false);


--
-- TOC entry 5386 (class 0 OID 0)
-- Dependencies: 243
-- Name: pdns_domains_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_domains_id_seq', 1, false);


--
-- TOC entry 5387 (class 0 OID 0)
-- Dependencies: 245
-- Name: pdns_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_records_id_seq', 1, false);


--
-- TOC entry 5388 (class 0 OID 0)
-- Dependencies: 254
-- Name: pdns_tsigkeys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pdns_tsigkeys_id_seq', 1, false);


--
-- TOC entry 5389 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- TOC entry 5390 (class 0 OID 0)
-- Dependencies: 239
-- Name: ssl_certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ssl_certificates_id_seq', 1, false);


--
-- TOC entry 5391 (class 0 OID 0)
-- Dependencies: 231
-- Name: support_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_tickets_id_seq', 3, true);


--
-- TOC entry 5392 (class 0 OID 0)
-- Dependencies: 227
-- Name: user_databases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_databases_id_seq', 3, true);


--
-- TOC entry 5393 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- TOC entry 5394 (class 0 OID 0)
-- Dependencies: 223
-- Name: websites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.websites_id_seq', 3, true);


--
-- TOC entry 5097 (class 2606 OID 26549)
-- Name: dns_records dns_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dns_records
    ADD CONSTRAINT dns_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5103 (class 2606 OID 26586)
-- Name: domain_aliases domain_aliases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_aliases
    ADD CONSTRAINT domain_aliases_pkey PRIMARY KEY (id);


--
-- TOC entry 5091 (class 2606 OID 26527)
-- Name: domains domains_domain_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_domain_name_key UNIQUE (domain_name);


--
-- TOC entry 5093 (class 2606 OID 26525)
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);


--
-- TOC entry 5068 (class 2606 OID 26251)
-- Name: email_accounts email_accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_email_key UNIQUE (email);


--
-- TOC entry 5070 (class 2606 OID 26249)
-- Name: email_accounts email_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5079 (class 2606 OID 26329)
-- Name: invoices invoices_invoice_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number);


--
-- TOC entry 5081 (class 2606 OID 26327)
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- TOC entry 5089 (class 2606 OID 26374)
-- Name: payment_methods payment_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);


--
-- TOC entry 5123 (class 2606 OID 26669)
-- Name: pdns_comments pdns_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_comments
    ADD CONSTRAINT pdns_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5129 (class 2606 OID 26708)
-- Name: pdns_cryptokeys pdns_cryptokeys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_cryptokeys
    ADD CONSTRAINT pdns_cryptokeys_pkey PRIMARY KEY (id);


--
-- TOC entry 5126 (class 2606 OID 26689)
-- Name: pdns_domainmetadata pdns_domainmetadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domainmetadata
    ADD CONSTRAINT pdns_domainmetadata_pkey PRIMARY KEY (id);


--
-- TOC entry 5107 (class 2606 OID 26617)
-- Name: pdns_domains pdns_domains_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domains
    ADD CONSTRAINT pdns_domains_name_key UNIQUE (name);


--
-- TOC entry 5109 (class 2606 OID 26615)
-- Name: pdns_domains pdns_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domains
    ADD CONSTRAINT pdns_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 5116 (class 2606 OID 26634)
-- Name: pdns_records pdns_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_records
    ADD CONSTRAINT pdns_records_pkey PRIMARY KEY (id);


--
-- TOC entry 5118 (class 2606 OID 26653)
-- Name: pdns_supermasters pdns_supermasters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_supermasters
    ADD CONSTRAINT pdns_supermasters_pkey PRIMARY KEY (ip, nameserver);


--
-- TOC entry 5132 (class 2606 OID 26726)
-- Name: pdns_tsigkeys pdns_tsigkeys_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_tsigkeys
    ADD CONSTRAINT pdns_tsigkeys_name_key UNIQUE (name);


--
-- TOC entry 5134 (class 2606 OID 26724)
-- Name: pdns_tsigkeys pdns_tsigkeys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_tsigkeys
    ADD CONSTRAINT pdns_tsigkeys_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 26162)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 26164)
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- TOC entry 5101 (class 2606 OID 26568)
-- Name: ssl_certificates ssl_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ssl_certificates
    ADD CONSTRAINT ssl_certificates_pkey PRIMARY KEY (id);


--
-- TOC entry 5084 (class 2606 OID 26352)
-- Name: support_tickets support_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5086 (class 2606 OID 26354)
-- Name: support_tickets support_tickets_ticket_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_ticket_number_key UNIQUE (ticket_number);


--
-- TOC entry 5074 (class 2606 OID 26273)
-- Name: user_databases user_databases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_databases
    ADD CONSTRAINT user_databases_pkey PRIMARY KEY (id);


--
-- TOC entry 5076 (class 2606 OID 26275)
-- Name: user_databases user_databases_user_id_database_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_databases
    ADD CONSTRAINT user_databases_user_id_database_name_key UNIQUE (user_id, database_name);


--
-- TOC entry 5048 (class 2606 OID 26144)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 5050 (class 2606 OID 26148)
-- Name: users users_facebook_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_facebook_id_key UNIQUE (facebook_id);


--
-- TOC entry 5052 (class 2606 OID 26398)
-- Name: users users_github_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_github_id_key UNIQUE (github_id);


--
-- TOC entry 5054 (class 2606 OID 26146)
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- TOC entry 5056 (class 2606 OID 26142)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 26201)
-- Name: websites websites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.websites
    ADD CONSTRAINT websites_pkey PRIMARY KEY (id);


--
-- TOC entry 5098 (class 1259 OID 26594)
-- Name: idx_dns_records_domain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dns_records_domain_id ON public.dns_records USING btree (domain_id);


--
-- TOC entry 5104 (class 1259 OID 26596)
-- Name: idx_domain_aliases_domain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domain_aliases_domain_id ON public.domain_aliases USING btree (domain_id);


--
-- TOC entry 5094 (class 1259 OID 26593)
-- Name: idx_domains_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domains_status ON public.domains USING btree (status);


--
-- TOC entry 5095 (class 1259 OID 26592)
-- Name: idx_domains_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_domains_user_id ON public.domains USING btree (user_id);


--
-- TOC entry 5071 (class 1259 OID 26382)
-- Name: idx_email_accounts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_email_accounts_user_id ON public.email_accounts USING btree (user_id);


--
-- TOC entry 5077 (class 1259 OID 26385)
-- Name: idx_invoices_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);


--
-- TOC entry 5087 (class 1259 OID 26387)
-- Name: idx_payment_methods_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_payment_methods_user_id ON public.payment_methods USING btree (user_id);


--
-- TOC entry 5057 (class 1259 OID 26175)
-- Name: idx_sessions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at);


--
-- TOC entry 5058 (class 1259 OID 26174)
-- Name: idx_sessions_refresh_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_refresh_token ON public.sessions USING btree (refresh_token);


--
-- TOC entry 5059 (class 1259 OID 26173)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- TOC entry 5099 (class 1259 OID 26595)
-- Name: idx_ssl_certificates_domain_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ssl_certificates_domain_id ON public.ssl_certificates USING btree (domain_id);


--
-- TOC entry 5082 (class 1259 OID 26386)
-- Name: idx_support_tickets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id);


--
-- TOC entry 5072 (class 1259 OID 26383)
-- Name: idx_user_databases_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_databases_user_id ON public.user_databases USING btree (user_id);


--
-- TOC entry 5044 (class 1259 OID 26170)
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- TOC entry 5045 (class 1259 OID 26172)
-- Name: idx_users_facebook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_facebook_id ON public.users USING btree (facebook_id);


--
-- TOC entry 5046 (class 1259 OID 26171)
-- Name: idx_users_google_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_google_id ON public.users USING btree (google_id);


--
-- TOC entry 5064 (class 1259 OID 26380)
-- Name: idx_websites_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_websites_user_id ON public.websites USING btree (user_id);


--
-- TOC entry 5105 (class 1259 OID 26619)
-- Name: pdns_account_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_account_index ON public.pdns_domains USING btree (account);


--
-- TOC entry 5119 (class 1259 OID 26675)
-- Name: pdns_comments_domain_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_comments_domain_id_idx ON public.pdns_comments USING btree (domain_id);


--
-- TOC entry 5120 (class 1259 OID 26676)
-- Name: pdns_comments_name_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_comments_name_type_idx ON public.pdns_comments USING btree (name, type);


--
-- TOC entry 5121 (class 1259 OID 26677)
-- Name: pdns_comments_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_comments_order_idx ON public.pdns_comments USING btree (domain_id, modified_at);


--
-- TOC entry 5127 (class 1259 OID 26714)
-- Name: pdns_cryptokeys_domain_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_cryptokeys_domain_id_idx ON public.pdns_cryptokeys USING btree (domain_id);


--
-- TOC entry 5111 (class 1259 OID 26642)
-- Name: pdns_domain_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_domain_id_index ON public.pdns_records USING btree (domain_id);


--
-- TOC entry 5124 (class 1259 OID 26695)
-- Name: pdns_domainmetadata_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_domainmetadata_idx ON public.pdns_domainmetadata USING btree (domain_id, kind);


--
-- TOC entry 5110 (class 1259 OID 26618)
-- Name: pdns_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_name_index ON public.pdns_domains USING btree (name);


--
-- TOC entry 5112 (class 1259 OID 26641)
-- Name: pdns_nametype_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_nametype_index ON public.pdns_records USING btree (name, type);


--
-- TOC entry 5113 (class 1259 OID 26643)
-- Name: pdns_orderindex; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_orderindex ON public.pdns_records USING btree (ordername);


--
-- TOC entry 5114 (class 1259 OID 26640)
-- Name: pdns_rec_name_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_rec_name_index ON public.pdns_records USING btree (name);


--
-- TOC entry 5130 (class 1259 OID 26727)
-- Name: pdns_tsigkeys_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pdns_tsigkeys_name_idx ON public.pdns_tsigkeys USING btree (name);


--
-- TOC entry 5157 (class 2620 OID 26733)
-- Name: domains create_domain_soa; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER create_domain_soa AFTER INSERT ON public.domains FOR EACH ROW EXECUTE FUNCTION public.create_soa_record();


--
-- TOC entry 5159 (class 2620 OID 26731)
-- Name: dns_records dns_cleanup_powerdns; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER dns_cleanup_powerdns AFTER DELETE ON public.dns_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_powerdns_record();


--
-- TOC entry 5160 (class 2620 OID 26729)
-- Name: dns_records dns_to_powerdns_sync; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER dns_to_powerdns_sync AFTER INSERT OR UPDATE ON public.dns_records FOR EACH ROW EXECUTE FUNCTION public.sync_dns_to_powerdns();


--
-- TOC entry 5161 (class 2620 OID 26598)
-- Name: dns_records update_dns_records_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_dns_records_updated_at BEFORE UPDATE ON public.dns_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5158 (class 2620 OID 26597)
-- Name: domains update_domains_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON public.domains FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5152 (class 2620 OID 26390)
-- Name: email_accounts update_email_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_email_accounts_updated_at BEFORE UPDATE ON public.email_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5154 (class 2620 OID 26393)
-- Name: invoices update_invoices_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5156 (class 2620 OID 26395)
-- Name: payment_methods update_payment_methods_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5162 (class 2620 OID 26599)
-- Name: ssl_certificates update_ssl_certificates_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ssl_certificates_updated_at BEFORE UPDATE ON public.ssl_certificates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5155 (class 2620 OID 26394)
-- Name: support_tickets update_support_tickets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5153 (class 2620 OID 26391)
-- Name: user_databases update_user_databases_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_databases_updated_at BEFORE UPDATE ON public.user_databases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5150 (class 2620 OID 26177)
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5151 (class 2620 OID 26388)
-- Name: websites update_websites_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- TOC entry 5143 (class 2606 OID 26550)
-- Name: dns_records dns_records_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dns_records
    ADD CONSTRAINT dns_records_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE;


--
-- TOC entry 5145 (class 2606 OID 26587)
-- Name: domain_aliases domain_aliases_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domain_aliases
    ADD CONSTRAINT domain_aliases_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE;


--
-- TOC entry 5142 (class 2606 OID 26528)
-- Name: domains domains_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5137 (class 2606 OID 26252)
-- Name: email_accounts email_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_accounts
    ADD CONSTRAINT email_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5139 (class 2606 OID 26330)
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5141 (class 2606 OID 26375)
-- Name: payment_methods payment_methods_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payment_methods
    ADD CONSTRAINT payment_methods_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5147 (class 2606 OID 26670)
-- Name: pdns_comments pdns_comments_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_comments
    ADD CONSTRAINT pdns_comments_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.pdns_domains(id) ON DELETE CASCADE;


--
-- TOC entry 5149 (class 2606 OID 26709)
-- Name: pdns_cryptokeys pdns_cryptokeys_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_cryptokeys
    ADD CONSTRAINT pdns_cryptokeys_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.pdns_domains(id) ON DELETE CASCADE;


--
-- TOC entry 5148 (class 2606 OID 26690)
-- Name: pdns_domainmetadata pdns_domainmetadata_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_domainmetadata
    ADD CONSTRAINT pdns_domainmetadata_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.pdns_domains(id) ON DELETE CASCADE;


--
-- TOC entry 5146 (class 2606 OID 26635)
-- Name: pdns_records pdns_records_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pdns_records
    ADD CONSTRAINT pdns_records_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.pdns_domains(id) ON DELETE CASCADE;


--
-- TOC entry 5135 (class 2606 OID 26165)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5144 (class 2606 OID 26569)
-- Name: ssl_certificates ssl_certificates_domain_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ssl_certificates
    ADD CONSTRAINT ssl_certificates_domain_id_fkey FOREIGN KEY (domain_id) REFERENCES public.domains(id) ON DELETE CASCADE;


--
-- TOC entry 5140 (class 2606 OID 26355)
-- Name: support_tickets support_tickets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT support_tickets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5138 (class 2606 OID 26276)
-- Name: user_databases user_databases_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_databases
    ADD CONSTRAINT user_databases_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5136 (class 2606 OID 26202)
-- Name: websites websites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.websites
    ADD CONSTRAINT websites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-01-04 10:05:28

--
-- PostgreSQL database dump complete
--

\unrestrict kaziS6TZvt18G9cUpJnpCX8NBsN2uYqriDPTA02IJ7jt2c4atisgUTohZ0EpXuA

