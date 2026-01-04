import { Response } from 'express';
import pool from '../db/pool';
import { AuthRequest } from '../middleware/auth';

// Get all domains for user
export const getDomains = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const result = await pool.query(
            `SELECT * FROM domains WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );

        // Add counts manually
        const domainsWithCounts = await Promise.all(result.rows.map(async (domain) => {
            const dnsCount = await pool.query(
                'SELECT COUNT(*) as count FROM dns_records WHERE domain_id = $1',
                [domain.id]
            );
            return {
                ...domain,
                dns_records_count: parseInt(dnsCount.rows[0].count),
                aliases_count: 0
            };
        }));

        res.json({
            success: true,
            domains: domainsWithCounts
        });
    } catch (error) {
        console.error('Get domains error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch domains',
            error: (error as Error).message
        });
    }
};

// Get single domain details
export const getDomain = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const result = await pool.query(
            `SELECT * FROM domains WHERE id = $1 AND user_id = $2`,
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        res.json({
            success: true,
            domain: result.rows[0]
        });
    } catch (error) {
        console.error('Get domain error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch domain',
            error: (error as Error).message
        });
    }
};

// Create new domain
export const createDomain = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domain_name, document_root } = req.body;

        if (!domain_name) {
            return res.status(400).json({
                success: false,
                message: 'Domain name is required'
            });
        }

        // Validate domain name format
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        if (!domainRegex.test(domain_name.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid domain name format'
            });
        }

        // Check if domain already exists
        const existingDomain = await pool.query(
            'SELECT id FROM domains WHERE domain_name = $1',
            [domain_name.toLowerCase()]
        );

        if (existingDomain.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Domain already exists'
            });
        }

        const result = await pool.query(
            `INSERT INTO domains (user_id, domain_name, document_root, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [userId, domain_name.toLowerCase(), document_root || '/public_html', 'pending']
        );

        // Create default DNS records
        const domainId = result.rows[0].id;
        await createDefaultDNSRecords(domainId, domain_name);

        // Auto-create Nginx virtual host
        try {
            const NginxService = (await import('../services/nginxService')).default;
            const userName = `user_${userId}`;
            const fullDocumentRoot = `/home/${userName}${document_root || '/public_html'}`;

            await NginxService.createVirtualHost({
                domainName: domain_name.toLowerCase(),
                userName,
                documentRoot: fullDocumentRoot,
                phpVersion: '8.1',
                sslEnabled: false
            });
        } catch (nginxError) {
            console.error('Nginx vhost creation error:', nginxError);
            // Don't fail domain creation if Nginx config fails (e.g., in development)
            // Just log the error
        }

        res.status(201).json({
            success: true,
            message: 'Domain created successfully',
            domain: result.rows[0]
        });
    } catch (error) {
        console.error('Create domain error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create domain',
            error: (error as Error).message
        });
    }
};

// Update domain
export const updateDomain = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { document_root, status, ssl_enabled, auto_renew_ssl } = req.body;

        // Verify ownership
        const domain = await pool.query(
            'SELECT id FROM domains WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (document_root !== undefined) {
            updates.push(`document_root = $${paramCount++}`);
            values.push(document_root);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }
        if (ssl_enabled !== undefined) {
            updates.push(`ssl_enabled = $${paramCount++}`);
            values.push(ssl_enabled);
        }
        if (auto_renew_ssl !== undefined) {
            updates.push(`auto_renew_ssl = $${paramCount++}`);
            values.push(auto_renew_ssl);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);
        const result = await pool.query(
            `UPDATE domains SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            success: true,
            message: 'Domain updated successfully',
            domain: result.rows[0]
        });
    } catch (error) {
        console.error('Update domain error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update domain',
            error: (error as Error).message
        });
    }
};

// Delete domain
export const deleteDomain = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM domains WHERE id = $1 AND user_id = $2 RETURNING domain_name',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = result.rows[0].domain_name;

        // Cleanup Nginx virtual host
        try {
            const NginxService = (await import('../services/nginxService')).default;
            await NginxService.deleteVHost(domainName);
            await NginxService.reload();
        } catch (nginxError) {
            console.error('Nginx cleanup error:', nginxError);
            // Don't fail deletion if Nginx cleanup fails
        }

        res.json({
            success: true,
            message: `Domain ${domainName} deleted successfully`
        });
    } catch (error) {
        console.error('Delete domain error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete domain',
            error: (error as Error).message
        });
    }
};

// DNS Records Management
export const getDNSRecords = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT id FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const result = await pool.query(
            'SELECT * FROM dns_records WHERE domain_id = $1 ORDER BY record_type, name',
            [domainId]
        );

        res.json({
            success: true,
            records: result.rows
        });
    } catch (error) {
        console.error('Get DNS records error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch DNS records',
            error: (error as Error).message
        });
    }
};

export const createDNSRecord = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;
        const { record_type, name, value, ttl, priority } = req.body;

        // Verify ownership
        const domain = await pool.query(
            'SELECT id FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        if (!record_type || !name || !value) {
            return res.status(400).json({
                success: false,
                message: 'Record type, name, and value are required'
            });
        }

        const result = await pool.query(
            `INSERT INTO dns_records (domain_id, record_type, name, value, ttl, priority)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [domainId, record_type, name, value, ttl || 3600, priority]
        );

        res.status(201).json({
            success: true,
            message: 'DNS record created successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error('Create DNS record error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create DNS record',
            error: (error as Error).message
        });
    }
};

export const deleteDNSRecord = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId, recordId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT id FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const result = await pool.query(
            'DELETE FROM dns_records WHERE id = $1 AND domain_id = $2 RETURNING *',
            [recordId, domainId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'DNS record not found'
            });
        }

        res.json({
            success: true,
            message: 'DNS record deleted successfully'
        });
    } catch (error) {
        console.error('Delete DNS record error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete DNS record',
            error: (error as Error).message
        });
    }
};

// Helper function to create default DNS records
async function createDefaultDNSRecords(domainId: number, domainName: string) {
    const serverIP = process.env.SERVER_IP || '0.0.0.0';

    const defaultRecords = [
        { type: 'A', name: '@', value: serverIP },
        { type: 'A', name: 'www', value: serverIP },
        { type: 'CNAME', name: 'ftp', value: domainName },
        { type: 'MX', name: '@', value: `mail.${domainName}`, priority: 10 }
    ];

    for (const record of defaultRecords) {
        await pool.query(
            'INSERT INTO dns_records (domain_id, record_type, name, value, priority) VALUES ($1, $2, $3, $4, $5)',
            [domainId, record.type, record.name, record.value, record.priority || null]
        );
    }
}

// Verify domain ownership (check if DNS is pointing to our server)
export const verifyDomain = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        const domainResult = await pool.query(
            'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (domainResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = domainResult.rows[0].domain_name;
        // In production, this should be the public IP of the server
        const expectedIP = process.env.SERVER_IP || '127.0.0.1';

        console.log(`🔍 Verifying '${domainName}'... Expecting IP: ${expectedIP}`);

        try {
            // Import dns module dynamically to avoid top-level issues if needed, 
            // or we could add it to top imports. Let's use dynamic import for cleaner isolation here or just standard requires if possible, 
            // but standard 'import' at top is better. Since I cannot easily add top import without reading whole file, 
            // I will use `import { promises as dns } from 'dns'` inside function or just require.
            // TypeScript might complain about require if not configured, so I'll try dynamic import.
            // Actually, best to add import at top. But since I can't see top easily and want to be safe:

            const dns = await import('dns');
            const resolver = dns.promises;

            const addresses = await resolver.resolve4(domainName);
            console.log(`📋 Resolved IPs for ${domainName}:`, addresses);

            // Check if any of the resolved IPs match our server IP
            // Special case for development: if SERVER_IP is 127.0.0.1, we might accept it, 
            // but real public domains won't point to 127.0.0.1 globally.
            // For testing purposes, if we are in Windows Dev mode, we might want to simulate success 
            // providing a query param or just skip real check if env says so.
            // But user asked for REAL verification.

            const isVerified = addresses.includes(expectedIP);

            if (isVerified) {
                await pool.query(
                    'UPDATE domains SET status = $1, verified_at = CURRENT_TIMESTAMP WHERE id = $2',
                    ['active', id]
                );

                return res.json({
                    success: true,
                    message: `Domain verified successfully! Pointing to ${expectedIP}`
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Verification failed. Domain points to: ${addresses.join(', ')}. Please update your DNS A Record to point to: ${expectedIP}`
                });
            }

        } catch (dnsError: any) {
            console.error('DNS Resolution error:', dnsError);

            // If domain doesn't exist or has no A record
            if (dnsError.code === 'ENOTFOUND') {
                return res.status(400).json({
                    success: false,
                    message: `Domain '${domainName}' could not be resolved. Please ensure DNS records are propagated.`
                });
            }

            return res.status(400).json({
                success: false,
                message: `DNS Lookup failed: ${dnsError.message}`
            });
        }

    } catch (error) {
        console.error('Verify domain error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify domain',
            error: (error as Error).message
        });
    }
};
