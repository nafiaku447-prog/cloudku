/**
 * SSL Service - Let's Encrypt Integration
 * Automates SSL certificate installation, renewal, and management via Certbot
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import pool from '../db/pool';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

interface SSLCertificate {
    domain: string;
    certPath: string;
    keyPath: string;
    chainPath: string;
    expiresAt: Date;
}

export class SSLService {
    private static CERT_BASE_PATH = '/etc/letsencrypt/live';
    private static CERTBOT_EMAIL = process.env.SSL_ADMIN_EMAIL || 'admin@cloudku.com';

    /**
     * Install SSL certificate using Let's Encrypt (Certbot)
     */
    static async installCertificate(domain: string, webroot: string): Promise<SSLCertificate> {
        try {
            // Skip on Windows (development)
            if (process.platform === 'win32') {
                console.log('ℹ️  SSL installation skipped (Windows development mode)');
                return this.createMockCertificate(domain);
            }

            // Validate domain format
            if (!this.isValidDomain(domain)) {
                throw new Error('Invalid domain format');
            }

            // Check if certificate already exists
            const existingCert = await this.getCertificateInfo(domain);
            if (existingCert) {
                console.log(`ℹ️  Certificate already exists for ${domain}`);
                return existingCert;
            }

            // Run Certbot to obtain certificate
            const certbotCmd = `certbot certonly --webroot \
                -w ${webroot} \
                -d ${domain} -d www.${domain} \
                --email ${this.CERTBOT_EMAIL} \
                --agree-tos \
                --non-interactive \
                --expand \
                --keep-until-expiring`;

            console.log(`🔒 Installing SSL certificate for ${domain}...`);
            const { stdout, stderr } = await execAsync(certbotCmd);
            console.log('Certbot output:', stdout);

            if (stderr && !stderr.includes('successfully')) {
                throw new Error(`Certbot error: ${stderr}`);
            }

            // Get certificate info
            const certInfo = await this.getCertificateInfo(domain);
            if (!certInfo) {
                throw new Error('Certificate installation succeeded but certificate not found');
            }

            console.log(`✅ SSL certificate installed successfully for ${domain}`);
            return certInfo;
        } catch (error) {
            console.error('SSL installation error:', error);
            throw new Error(`Failed to install SSL certificate: ${(error as Error).message}`);
        }
    }

    /**
     * Get certificate information
     */
    static async getCertificateInfo(domain: string): Promise<SSLCertificate | null> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                return this.createMockCertificate(domain);
            }

            const certDir = path.join(this.CERT_BASE_PATH, domain);

            // Check if certificate directory exists
            try {
                await fs.access(certDir);
            } catch {
                return null;
            }

            const certPath = path.join(certDir, 'fullchain.pem');
            const keyPath = path.join(certDir, 'privkey.pem');
            const chainPath = path.join(certDir, 'chain.pem');

            // Get expiration date
            const { stdout } = await execAsync(`openssl x509 -enddate -noout -in ${certPath}`);
            const expiryMatch = stdout.match(/notAfter=(.+)/);
            const expiresAt = expiryMatch ? new Date(expiryMatch[1]) : new Date();

            return {
                domain,
                certPath,
                keyPath,
                chainPath,
                expiresAt
            };
        } catch (error) {
            console.error('Get certificate info error:', error);
            return null;
        }
    }

    /**
     * Renew SSL certificate
     */
    static async renewCertificate(domain: string): Promise<boolean> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                console.log('ℹ️  SSL renewal skipped (Windows development mode)');
                return true;
            }

            console.log(`🔄 Renewing SSL certificate for ${domain}...`);

            const renewCmd = `certbot renew --cert-name ${domain} --quiet`;
            await execAsync(renewCmd);

            console.log(`✅ SSL certificate renewed for ${domain}`);
            return true;
        } catch (error) {
            console.error('SSL renewal error:', error);
            return false;
        }
    }

    /**
     * Renew all certificates that are expiring soon
     */
    static async renewAllCertificates(): Promise<{ renewed: number; failed: number }> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                return { renewed: 0, failed: 0 };
            }

            console.log('🔄 Checking for certificates to renew...');

            const { stdout } = await execAsync('certbot renew --dry-run');

            // Parse output to count renewals
            const renewedMatch = stdout.match(/(\d+) certificate/);
            const renewed = renewedMatch ? parseInt(renewedMatch[1]) : 0;

            return { renewed, failed: 0 };
        } catch (error) {
            console.error('Renew all certificates error:', error);
            return { renewed: 0, failed: 1 };
        }
    }

    /**
     * Revoke SSL certificate
     */
    static async revokeCertificate(domain: string): Promise<boolean> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                console.log('ℹ️  SSL revocation skipped (Windows development mode)');
                return true;
            }

            console.log(`🗑️  Revoking SSL certificate for ${domain}...`);

            const revokeCmd = `certbot revoke --cert-name ${domain} --delete-after-revoke --non-interactive`;
            await execAsync(revokeCmd);

            console.log(`✅ SSL certificate revoked for ${domain}`);
            return true;
        } catch (error) {
            console.error('SSL revocation error:', error);
            return false;
        }
    }

    /**
     * Check if Certbot is installed
     */
    static async checkCertbotInstalled(): Promise<{
        installed: boolean;
        version?: string;
    }> {
        try {
            // Skip on Windows
            if (process.platform === 'win32') {
                return { installed: false };
            }

            const { stdout } = await execAsync('certbot --version 2>&1');
            const versionMatch = stdout.match(/certbot (\d+\.\d+\.\d+)/);

            return {
                installed: true,
                version: versionMatch ? versionMatch[1] : undefined
            };
        } catch (error) {
            return { installed: false };
        }
    }

    /**
     * Get expiring certificates (within 30 days)
     */
    static async getExpiringCertificates(days: number = 30): Promise<string[]> {
        try {
            const result = await pool.query(
                `SELECT domain_name 
                 FROM domains 
                 WHERE ssl_enabled = true 
                 AND ssl_expires_at < NOW() + INTERVAL '${days} days'
                 AND ssl_expires_at > NOW()`
            );

            return result.rows.map(row => row.domain_name);
        } catch (error) {
            console.error('Get expiring certificates error:', error);
            return [];
        }
    }

    /**
     * Update SSL expiry in database
     */
    static async updateSSLExpiry(domainId: number, expiresAt: Date): Promise<void> {
        try {
            await pool.query(
                `UPDATE domains 
                 SET ssl_expires_at = $1, 
                     ssl_enabled = true, 
                     ssl_provider = 'letsencrypt'
                 WHERE id = $2`,
                [expiresAt, domainId]
            );
        } catch (error) {
            console.error('Update SSL expiry error:', error);
        }
    }

    /**
     * Validate domain name format
     */
    private static isValidDomain(domain: string): boolean {
        const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/;
        return domainRegex.test(domain.toLowerCase());
    }

    /**
     * Create mock certificate for development (Windows)
     */
    private static createMockCertificate(domain: string): SSLCertificate {
        const mockPath = path.join(__dirname, '../../.ssl-mock');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now

        return {
            domain,
            certPath: path.join(mockPath, `${domain}-cert.pem`),
            keyPath: path.join(mockPath, `${domain}-key.pem`),
            chainPath: path.join(mockPath, `${domain}-chain.pem`),
            expiresAt
        };
    }

    /**
     * Get SSL statistics
     */
    static async getStats(): Promise<{
        totalEnabled: number;
        expiringSoon: number;
        expired: number;
    }> {
        try {
            const totalResult = await pool.query(
                'SELECT COUNT(*) as count FROM domains WHERE ssl_enabled = true'
            );

            const expiringSoonResult = await pool.query(
                `SELECT COUNT(*) as count FROM domains 
                 WHERE ssl_enabled = true 
                 AND ssl_expires_at < NOW() + INTERVAL '30 days'
                 AND ssl_expires_at > NOW()`
            );

            const expiredResult = await pool.query(
                `SELECT COUNT(*) as count FROM domains 
                 WHERE ssl_enabled = true 
                 AND ssl_expires_at < NOW()`
            );

            return {
                totalEnabled: parseInt(totalResult.rows[0].count),
                expiringSoon: parseInt(expiringSoonResult.rows[0].count),
                expired: parseInt(expiredResult.rows[0].count)
            };
        } catch (error) {
            console.error('Get SSL stats error:', error);
            return {
                totalEnabled: 0,
                expiringSoon: 0,
                expired: 0
            };
        }
    }
}

export default SSLService;
