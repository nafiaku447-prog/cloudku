/**
 * SSL Controller - SSL Certificate Management
 * Provides API endpoints for SSL operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SSLService from '../services/sslService';
import NginxService from '../services/nginxService';
import pool from '../db/pool';

/**
 * Enable SSL for a domain
 */
export const enableSSL = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainData = domain.rows[0];
        const domainName = domainData.domain_name;
        const userName = `user_${userId}`;
        const documentRoot = `/home/${userName}${domainData.document_root}`;

        // Check if already enabled
        if (domainData.ssl_enabled) {
            return res.status(400).json({
                success: false,
                message: 'SSL is already enabled for this domain'
            });
        }

        // Install SSL certificate
        const certInfo = await SSLService.installCertificate(domainName, documentRoot);

        // Update domain SSL settings
        await pool.query(
            `UPDATE domains 
             SET ssl_enabled = true, 
                 ssl_provider = 'letsencrypt',
                 ssl_expires_at = $1
             WHERE id = $2`,
            [certInfo.expiresAt, domainId]
        );

        // Update Nginx config to SSL version
        await NginxService.updateVirtualHost({
            domainName,
            userName,
            documentRoot,
            phpVersion: '8.1',
            sslEnabled: true,
            sslCertPath: certInfo.certPath,
            sslKeyPath: certInfo.keyPath,
            sslChainPath: certInfo.chainPath
        });

        res.json({
            success: true,
            message: 'SSL enabled successfully',
            certificate: {
                domain: certInfo.domain,
                expiresAt: certInfo.expiresAt
            }
        });
    } catch (error) {
        console.error('Enable SSL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enable SSL',
            error: (error as Error).message
        });
    }
};

/**
 * Disable SSL for a domain
 */
export const disableSSL = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainData = domain.rows[0];
        const domainName = domainData.domain_name;
        const userName = `user_${userId}`;
        const documentRoot = `/home/${userName}${domainData.document_root}`;

        // Update domain settings
        await pool.query(
            `UPDATE domains 
             SET ssl_enabled = false, 
                 ssl_provider = NULL,
                 ssl_expires_at = NULL
             WHERE id = $1`,
            [domainId]
        );

        // Update Nginx config to non-SSL version
        await NginxService.updateVirtualHost({
            domainName,
            userName,
            documentRoot,
            phpVersion: '8.1',
            sslEnabled: false
        });

        // Note: We don't revoke the certificate, just disable it
        // User might want to re-enable later

        res.json({
            success: true,
            message: 'SSL disabled successfully'
        });
    } catch (error) {
        console.error('Disable SSL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to disable SSL',
            error: (error as Error).message
        });
    }
};

/**
 * Renew SSL certificate for a domain
 */
export const renewSSL = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = domain.rows[0].domain_name;

        // Renew certificate
        const renewed = await SSLService.renewCertificate(domainName);

        if (!renewed) {
            throw new Error('Certificate renewal failed');
        }

        // Get updated certificate info
        const certInfo = await SSLService.getCertificateInfo(domainName);

        if (certInfo) {
            // Update expiry date
            await pool.query(
                'UPDATE domains SET ssl_expires_at = $1 WHERE id = $2',
                [certInfo.expiresAt, domainId]
            );
        }

        res.json({
            success: true,
            message: 'SSL certificate renewed successfully',
            expiresAt: certInfo?.expiresAt
        });
    } catch (error) {
        console.error('Renew SSL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to renew SSL certificate',
            error: (error as Error).message
        });
    }
};

/**
 * Get SSL certificate info
 */
export const getSSLInfo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT * FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainData = domain.rows[0];

        if (!domainData.ssl_enabled) {
            return res.status(400).json({
                success: false,
                message: 'SSL is not enabled for this domain'
            });
        }

        // Get certificate info
        const certInfo = await SSLService.getCertificateInfo(domainData.domain_name);

        res.json({
            success: true,
            ssl: {
                enabled: domainData.ssl_enabled,
                provider: domainData.ssl_provider,
                expiresAt: certInfo?.expiresAt || domainData.ssl_expires_at,
                daysUntilExpiry: certInfo
                    ? Math.ceil((certInfo.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null
            }
        });
    } catch (error) {
        console.error('Get SSL info error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SSL information',
            error: (error as Error).message
        });
    }
};

/**
 * Get SSL statistics
 */
export const getSSLStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await SSLService.getStats();
        const certbotStatus = await SSLService.checkCertbotInstalled();

        res.json({
            success: true,
            stats,
            certbot: certbotStatus
        });
    } catch (error) {
        console.error('Get SSL stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get SSL statistics'
        });
    }
};

/**
 * Get expiring certificates
 */
export const getExpiringCertificates = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const days = parseInt(req.query.days as string) || 30;

        // Get user's expiring certificates
        const result = await pool.query(
            `SELECT id, domain_name, ssl_expires_at
             FROM domains
             WHERE user_id = $1
             AND ssl_enabled = true
             AND ssl_expires_at < NOW() + INTERVAL '${days} days'
             AND ssl_expires_at > NOW()
             ORDER BY ssl_expires_at ASC`,
            [userId]
        );

        res.json({
            success: true,
            expiring: result.rows
        });
    } catch (error) {
        console.error('Get expiring certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get expiring certificates'
        });
    }
};
