import express, { Request, Response } from 'express';
import pool from '../db/pool';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Middleware: Apply authentication to all routes
router.use(authenticate);

// ==================== WEB SITES ====================

// GET /api/hosting/websites - Get all websites for logged-in user
router.get('/websites', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, domain, status, plan, visitors_count as visitors, 
                    storage_used, bandwidth_used, uptime_percentage as uptime, 
                    ssl_enabled as ssl, created_at, updated_at
             FROM websites 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        // Format data for frontend
        const websites = result.rows.map(row => ({
            id: row.id,
            name: row.domain,
            status: row.status,
            plan: row.plan,
            visitors: formatNumber(row.visitors),
            uptime: `${row.uptime}%`,
            storage: formatBytes(row.storage_used),
            ssl: row.ssl,
            createdAt: row.created_at,
        }));

        res.json({ success: true, data: websites });
    } catch (error) {
        console.error('Error fetching websites:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch websites' });
    }
});

// POST /api/hosting/websites - Create new website
router.post('/websites', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { domain, plan } = req.body;

        const result = await pool.query(
            `INSERT INTO websites (user_id, domain, plan, status) 
             VALUES ($1, $2, $3, 'active') 
             RETURNING *`,
            [userId, domain, plan || 'premium']
        );

        res.json({ success: true, data: result.rows[0], message: 'Website created successfully' });
    } catch (error) {
        console.error('Error creating website:', error);
        res.status(500).json({ success: false, message: 'Failed to create website' });
    }
});

// DELETE /api/hosting/websites/:id - Delete website
router.delete('/websites/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;

        await pool.query(
            'DELETE FROM websites WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({ success: true, message: 'Website deleted successfully' });
    } catch (error) {
        console.error('Error deleting website:', error);
        res.status(500).json({ success: false, message: 'Failed to delete website' });
    }
});

// ==================== DOMAINS ====================

// GET /api/hosting/domains - Get all domains
router.get('/domains', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, domain_name, status, registrar, 
                    expires_at, auto_renew, dns_status, ssl_enabled,
                    created_at, updated_at
             FROM domains 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        const domains = result.rows.map(row => ({
            id: row.id,
            name: row.domain_name,
            status: row.status,
            registrar: row.registrar,
            expires: formatDate(row.expires_at),
            autoRenew: row.auto_renew,
            dns: row.dns_status,
            ssl: row.ssl_enabled,
        }));

        res.json({ success: true, data: domains });
    } catch (error) {
        console.error('Error fetching domains:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch domains' });
    }
});

// POST /api/hosting/domains - Register new domain
router.post('/domains', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { domainName } = req.body;

        // Set expiry to 1 year from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        const result = await pool.query(
            `INSERT INTO domains (user_id, domain_name, expires_at) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [userId, domainName, expiryDate]
        );

        res.json({ success: true, data: result.rows[0], message: 'Domain registered successfully' });
    } catch (error) {
        console.error('Error registering domain:', error);
        res.status(500).json({ success: false, message: 'Failed to register domain' });
    }
});

// PATCH /api/hosting/domains/:id/auto-renew - Toggle auto-renew
router.patch('/domains/:id/auto-renew', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { id } = req.params;
        const { autoRenew } = req.body;

        await pool.query(
            'UPDATE domains SET auto_renew = $1 WHERE id = $2 AND user_id = $3',
            [autoRenew, id, userId]
        );

        res.json({ success: true, message: 'Auto-renew updated' });
    } catch (error) {
        console.error('Error updating auto-renew:', error);
        res.status(500).json({ success: false, message: 'Failed to update auto-renew' });
    }
});

// ==================== EMAIL ACCOUNTS ====================

// GET /api/hosting/emails - Get all email accounts
router.get('/emails', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, email, quota_mb, used_mb, status, 
                    forwarders_count, autoresponder_enabled,
                    created_at
             FROM email_accounts 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        const emails = result.rows.map(row => ({
            id: row.id,
            email: row.email,
            quota: `${(row.quota_mb / 1024).toFixed(1)} GB`,
            used: `${(row.used_mb / 1024).toFixed(1)} GB`,
            usagePercent: Math.round((row.used_mb / row.quota_mb) * 100),
            status: row.status,
            forwarders: row.forwarders_count,
            autoresponder: row.autoresponder_enabled,
        }));

        res.json({ success: true, data: emails });
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch email accounts' });
    }
});

// POST /api/hosting/emails - Create email account
router.post('/emails', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { email, quotaMb } = req.body;

        const result = await pool.query(
            `INSERT INTO email_accounts (user_id, email, quota_mb) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [userId, email, quotaMb || 5120]
        );

        res.json({ success: true, data: result.rows[0], message: 'Email account created' });
    } catch (error) {
        console.error('Error creating email:', error);
        res.status(500).json({ success: false, message: 'Failed to create email account' });
    }
});

// ==================== DATABASES ====================

// GET /api/hosting/databases - Get all databases
router.get('/databases', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, database_name, database_type, size_mb, 
                    tables_count, users_count, status, created_at
             FROM user_databases 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        const databases = result.rows.map(row => ({
            id: row.id,
            name: row.database_name,
            type: row.database_type === 'mysql' ? 'MySQL 8.0' : 'PostgreSQL 14',
            size: `${row.size_mb} MB`,
            tables: row.tables_count,
            users: row.users_count,
            status: row.status,
        }));

        res.json({ success: true, data: databases });
    } catch (error) {
        console.error('Error fetching databases:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch databases' });
    }
});

//POST /api/hosting/databases - Create database
router.post('/databases', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { databaseName, databaseType } = req.body;

        const result = await pool.query(
            `INSERT INTO user_databases (user_id, database_name, database_type) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [userId, databaseName, databaseType || 'mysql']
        );

        res.json({ success: true, data: result.rows[0], message: 'Database created' });
    } catch (error) {
        console.error('Error creating database:', error);
        res.status(500).json({ success: false, message: 'Failed to create database' });
    }
});

// ==================== SSL CERTIFICATES ====================

// GET /api/hosting/ssl - Get all SSL certificates
router.get('/ssl', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, domain, certificate_type, issuer, 
                    issued_at, expires_at, auto_renew, status
             FROM ssl_certificates 
             WHERE user_id = $1 
             ORDER BY expires_at ASC`,
            [userId]
        );

        const certificates = result.rows.map(row => ({
            id: row.id,
            domain: row.domain,
            type: row.certificate_type === 'letsencrypt' ? "Let's Encrypt" :
                row.certificate_type === 'custom' ? 'Custom' : 'Self-Signed',
            issuer: row.issuer,
            issued: formatDate(row.issued_at),
            expires: formatDate(row.expires_at),
            autoRenew: row.auto_renew,
            status: row.status,
        }));

        res.json({ success: true, data: certificates });
    } catch (error) {
        console.error('Error fetching SSL certificates:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch SSL certificates' });
    }
});

// ==================== INVOICES ====================

// GET /api/hosting/invoices - Get all invoices
router.get('/invoices', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, invoice_number, description, amount, 
                    status, payment_method, invoice_date, paid_at
             FROM invoices 
             WHERE user_id = $1 
             ORDER BY invoice_date DESC
             LIMIT 50`,
            [userId]
        );

        const invoices = result.rows.map(row => ({
            id: row.id,
            invoiceNumber: row.invoice_number,
            date: formatDate(row.invoice_date),
            description: row.description,
            amount: `$${row.amount}`,
            status: row.status,
            paymentMethod: row.payment_method,
            paidAt: row.paid_at ? formatDate(row.paid_at) : null,
        }));

        res.json({ success: true, data: invoices });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
});

// ==================== SUPPORT TICKETS ====================

// GET /api/hosting/tickets - Get all support tickets
router.get('/tickets', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, ticket_number, subject, status, priority, 
                    assigned_to, last_update, created_at
             FROM support_tickets 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );

        const tickets = result.rows.map(row => ({
            id: row.id,
            ticketNumber: row.ticket_number,
            subject: row.subject,
            status: row.status,
            priority: row.priority,
            assignedTo: row.assigned_to,
            lastUpdate: formatTimeAgo(row.last_update),
            createdAt: row.created_at,
        }));

        res.json({ success: true, data: tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
});

// POST /api/hosting/tickets - Create support ticket
router.post('/tickets', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { subject, message, priority } = req.body;

        // Generate ticket number
        const ticketNumber = `TK-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

        const result = await pool.query(
            `INSERT INTO support_tickets (user_id, ticket_number, subject, message, priority) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, ticketNumber, subject, message, priority || 'medium']
        );

        res.json({ success: true, data: result.rows[0], message: 'Ticket created successfully' });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ success: false, message: 'Failed to create ticket' });
    }
});

// ==================== PAYMENT METHODS ====================

// GET /api/hosting/payment-methods - Get payment methods
router.get('/payment-methods', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const result = await pool.query(
            `SELECT id, card_type, last_four, expiry_month, expiry_year, is_default
             FROM payment_methods 
             WHERE user_id = $1 
             ORDER BY is_default DESC, created_at DESC`,
            [userId]
        );

        const paymentMethods = result.rows.map(row => ({
            id: row.id,
            type: row.card_type.charAt(0).toUpperCase() + row.card_type.slice(1),
            last4: row.last_four,
            expiry: `${String(row.expiry_month).padStart(2, '0')}/${row.expiry_year}`,
            isDefault: row.is_default,
        }));

        res.json({ success: true, data: paymentMethods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
    }
});

// ==================== HELPER FUNCTIONS ====================

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatNumber(num: number): string {
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(date: Date | string): string {
    const d = new Date(date);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(date);
}

export default router;
