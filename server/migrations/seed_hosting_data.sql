-- Seed data for testing dashboard
-- Replace user_id = 1 dengan ID user yang sebenarnya setelah register

-- Sample Websites
INSERT INTO websites (user_id, domain, status, plan, visitors_count, storage_used, bandwidth_used, uptime_percentage, ssl_enabled) VALUES
(1, 'example.com', 'active', 'Premium', 12500, 2516582400, 48318382080, 99.9, true),
(1, 'mywebsite.com', 'active', 'Business', 8200, 1932735283, 38654705664, 100.0, true),
(1, 'testsite.com', 'maintenance', 'Premium', 3100, 943718400, 20401094656, 98.5, false);

-- Sample Domains  
INSERT INTO domains (user_id, domain_name, status, registrar, expires_at, auto_renew, dns_status, ssl_enabled) VALUES
(1, 'example.com', 'active', 'HostModern', CURRENT_TIMESTAMP + INTERVAL '90 days', true, 'active', true),
(1, 'mywebsite.com', 'active', 'HostModern', CURRENT_TIMESTAMP + INTERVAL '120 days', true, 'active', true),
(1, 'testsite.com', 'expiring', 'External', CURRENT_TIMESTAMP + INTERVAL '8 days', false, 'pending', false),
(1, 'newdomain.com', 'active', 'HostModern', CURRENT_TIMESTAMP + INTERVAL '365 days', true, 'active', true),
(1, 'blog.example.com', 'active', 'HostModern', CURRENT_TIMESTAMP + INTERVAL '90 days', true, 'active', false);

-- Sample Email Accounts
INSERT INTO email_accounts (user_id, email, quota_mb, used_mb, status, forwarders_count, autoresponder_enabled) VALUES
(1, 'admin@example.com', 5120, 1228, 'active', 2, false),
(1, 'support@example.com', 10240, 4608, 'active', 0, true),
(1, 'info@mywebsite.com', 5120, 819, 'active', 1, false),
(1, 'contact@example.com', 5120, 512, 'active', 0, false),
(1, 'sales@example.com', 10240, 2048, 'active', 3, false);

-- Sample Databases
INSERT INTO user_databases (user_id, database_name, database_type, size_mb, tables_count, users_count, status) VALUES
(1, 'example_wp', 'mysql', 45, 12, 2, 'active'),
(1, 'mywebsite_db', 'mysql', 128, 28, 1, 'active'),
(1, 'test_database', 'postgresql', 12, 5, 1, 'active');

-- Sample SSL Certificates
INSERT INTO ssl_certificates (user_id, domain, certificate_type, issuer, expires_at, auto_renew, status) VALUES
(1, 'example.com', 'letsencrypt', 'Let''s Encrypt Authority X3', CURRENT_TIMESTAMP + INTERVAL '60 days', true, 'active'),
(1, 'mywebsite.com', 'letsencrypt', 'Let''s Encrypt Authority X3', CURRENT_TIMESTAMP + INTERVAL '50 days', true, 'active'),
(1, 'testsite.com', 'self-signed', 'HostModern', CURRENT_TIMESTAMP + INTERVAL '5 days', false, 'expiring'),
(1, 'newdomain.com', 'letsencrypt', 'Let''s Encrypt Authority X3', CURRENT_TIMESTAMP + INTERVAL '80 days', true, 'active');

-- Sample Invoices
INSERT INTO invoices (user_id, invoice_number, description, amount, status, payment_method, invoice_date, paid_at) VALUES
(1, 'INV-2024-001', 'Premium Plan - Monthly', 29.99, 'paid', 'Visa ending in 4242', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(1, 'INV-2023-012', 'Premium Plan - Monthly', 29.99, 'paid', 'Visa ending in 4242', CURRENT_TIMESTAMP - INTERVAL '45 days', CURRENT_TIMESTAMP - INTERVAL '45 days'),
(1, 'INV-2023-011', 'Premium Plan - Monthly', 29.99, 'paid', 'Visa ending in 4242', CURRENT_TIMESTAMP - INTERVAL '75 days', CURRENT_TIMESTAMP - INTERVAL '75 days');

-- Sample Support Tickets
INSERT INTO support_tickets (user_id, ticket_number, subject, message, status, priority, assigned_to, last_update) VALUES
(1, 'TK-2024-001', 'Unable to upload files via FTP', 'I am getting permission denied errors when trying to upload files via FTP to /public_html directory.', 'open', 'high', 'Support Team', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
(1, 'TK-2024-002', 'SSL certificate installation help', 'Need assistance installing SSL certificate for my domain.', 'in-progress', 'medium', 'Technical Support', CURRENT_TIMESTAMP - INTERVAL '1 day'),
(1, 'TK-2023-125', 'Domain transfer assistance', 'Want to transfer my domain from another registrar. What are the steps?', 'resolved', 'low', 'Domain Support', CURRENT_TIMESTAMP - INTERVAL '5 days');

-- Sample Payment Methods
INSERT INTO payment_methods (user_id, card_type, last_four, expiry_month, expiry_year, is_default) VALUES
(1, 'visa', '4242', 12, 2025, true),
(1, 'mastercard', '8888', 6, 2026, false);

-- Verify data
SELECT 'Websites' as table_name, COUNT(*) as count FROM websites WHERE user_id = 1
UNION ALL
SELECT 'Domains', COUNT(*) FROM domains WHERE user_id = 1
UNION ALL
SELECT 'Email Accounts', COUNT(*) FROM email_accounts WHERE user_id = 1
UNION ALL
SELECT 'Databases', COUNT(*) FROM user_databases WHERE user_id = 1
UNION ALL
SELECT 'SSL Certificates', COUNT(*) FROM ssl_certificates WHERE user_id = 1
UNION ALL
SELECT 'Invoices', COUNT(*) FROM invoices WHERE user_id = 1
UNION ALL
SELECT 'Support Tickets', COUNT(*) FROM support_tickets WHERE user_id = 1
UNION ALL
SELECT 'Payment Methods', COUNT(*) FROM payment_methods WHERE user_id = 1;
