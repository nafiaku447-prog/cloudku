/**
 * DNS Service - PowerDNS Integration
 * Handles all DNS operations and syncs with PowerDNS backend
 */

import pool from '../db/pool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DNSRecord {
    id?: number;
    domain_id: number;
    record_type: string;
    name: string;
    value: string;
    ttl: number;
    priority?: number | null;
}

interface PowerDNSZone {
    name: string;
    type: 'NATIVE' | 'MASTER' | 'SLAVE';
    account: string;
}

export class DNSService {
    /**
     * Create a new DNS zone in PowerDNS
     */
    static async createZone(domainName: string, userId: number): Promise<number> {
        try {
            // Zone will be auto-created by trigger when domain is added
            // This method is for manual zone creation if needed
            const result = await pool.query(
                `INSERT INTO pdns_domains (name, type, account)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
                 RETURNING id`,
                [domainName, 'NATIVE', `user_${userId}`]
            );

            const zoneId = result.rows[0].id;

            // Create SOA record
            await this.createSOARecord(zoneId, domainName);

            // Create NS records
            await this.createNSRecords(zoneId, domainName);

            return zoneId;
        } catch (error) {
            console.error('Create zone error:', error);
            throw new Error('Failed to create DNS zone');
        }
    }

    /**
     * Create SOA (Start of Authority) record
     */
    private static async createSOARecord(zoneId: number, domainName: string): Promise<void> {
        const serial = Math.floor(Date.now() / 1000); // Unix timestamp as serial
        const soaContent = `ns1.cloudku.com hostmaster.${domainName} ${serial} 10800 3600 604800 3600`;

        await pool.query(
            `INSERT INTO pdns_records (domain_id, name, type, content, ttl, auth)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT DO NOTHING`,
            [zoneId, domainName, 'SOA', soaContent, 3600, true]
        );
    }

    /**
     * Create NS (Name Server) records
     */
    private static async createNSRecords(zoneId: number, domainName: string): Promise<void> {
        const nameservers = ['ns1.cloudku.com', 'ns2.cloudku.com'];

        for (const ns of nameservers) {
            await pool.query(
                `INSERT INTO pdns_records (domain_id, name, type, content, ttl, auth)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT DO NOTHING`,
                [zoneId, domainName, 'NS', ns, 3600, true]
            );
        }
    }

    /**
     * Get all DNS records for a domain from PowerDNS
     */
    static async getZoneRecords(domainName: string): Promise<any[]> {
        try {
            const result = await pool.query(
                `SELECT pr.id, pr.name, pr.type, pr.content, pr.ttl, pr.prio, pr.disabled
                 FROM pdns_records pr
                 JOIN pdns_domains pd ON pr.domain_id = pd.id
                 WHERE pd.name = $1
                 ORDER BY pr.type, pr.name`,
                [domainName]
            );

            return result.rows;
        } catch (error) {
            console.error('Get zone records error:', error);
            throw new Error('Failed to fetch DNS records');
        }
    }

    /**
     * Update SOA serial number (increment for zone changes)
     */
    static async incrementSOASerial(domainName: string): Promise<void> {
        try {
            const result = await pool.query(
                `SELECT pr.id, pr.content
                 FROM pdns_records pr
                 JOIN pdns_domains pd ON pr.domain_id = pd.id
                 WHERE pd.name = $1 AND pr.type = 'SOA'`,
                [domainName]
            );

            if (result.rows.length === 0) return;

            const soaRecord = result.rows[0];
            const soaParts = soaRecord.content.split(' ');

            // Increment serial (part index 2)
            const currentSerial = parseInt(soaParts[2]);
            const newSerial = currentSerial + 1;
            soaParts[2] = newSerial.toString();

            const newSOA = soaParts.join(' ');

            await pool.query(
                'UPDATE pdns_records SET content = $1 WHERE id = $2',
                [newSOA, soaRecord.id]
            );
        } catch (error) {
            console.error('Increment SOA serial error:', error);
        }
    }

    /**
     * Delete all DNS records for a domain
     */
    static async deleteZone(domainName: string): Promise<void> {
        try {
            await pool.query(
                `DELETE FROM pdns_domains WHERE name = $1`,
                [domainName]
            );
            // Cascade will delete all related records
        } catch (error) {
            console.error('Delete zone error:', error);
            throw new Error('Failed to delete DNS zone');
        }
    }

    /**
     * Reload PowerDNS server (if running locally)
     * This forces PowerDNS to re-read database
     */
    static async reloadPowerDNS(): Promise<boolean> {
        try {
            // Check if we're on Linux/Unix system
            if (process.platform !== 'win32') {
                // Try to reload PowerDNS
                await execAsync('pdns_control reload || systemctl reload pdns');
                console.log('✅ PowerDNS reloaded');
                return true;
            } else {
                // Windows - PowerDNS not applicable
                console.log('ℹ️  PowerDNS reload skipped (Windows environment)');
                return false;
            }
        } catch (error) {
            console.warn('⚠️  PowerDNS reload failed (server might not be installed):', error);
            return false;
        }
    }

    /**
     * Validate DNS record before adding
     */
    static validateRecord(record: DNSRecord): { valid: boolean; error?: string } {
        // Validate record type
        const validTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA', 'PTR'];
        if (!validTypes.includes(record.record_type)) {
            return { valid: false, error: `Invalid record type: ${record.record_type}` };
        }

        // Validate TTL
        if (record.ttl < 60 || record.ttl > 86400) {
            return { valid: false, error: 'TTL must be between 60 and 86400 seconds' };
        }

        // Validate A record (IPv4)
        if (record.record_type === 'A') {
            const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipv4Regex.test(record.value)) {
                return { valid: false, error: 'Invalid IPv4 address' };
            }
        }

        // Validate AAAA record (IPv6)
        if (record.record_type === 'AAAA') {
            const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
            if (!ipv6Regex.test(record.value)) {
                return { valid: false, error: 'Invalid IPv6 address' };
            }
        }

        // Validate MX record priority
        if (record.record_type === 'MX' && !record.priority) {
            return { valid: false, error: 'MX record requires priority' };
        }

        return { valid: true };
    }

    /**
     * Get DNS statistics
     */
    static async getStats(): Promise<{
        totalZones: number;
        totalRecords: number;
        recordsByType: Record<string, number>;
    }> {
        try {
            const zonesResult = await pool.query('SELECT COUNT(*) as count FROM pdns_domains');
            const recordsResult = await pool.query('SELECT COUNT(*) as count FROM pdns_records');
            const typeStatsResult = await pool.query(`
                SELECT type, COUNT(*) as count
                FROM pdns_records
                GROUP BY type
                ORDER BY count DESC
            `);

            const recordsByType: Record<string, number> = {};
            typeStatsResult.rows.forEach(row => {
                recordsByType[row.type] = parseInt(row.count);
            });

            return {
                totalZones: parseInt(zonesResult.rows[0].count),
                totalRecords: parseInt(recordsResult.rows[0].count),
                recordsByType
            };
        } catch (error) {
            console.error('Get DNS stats error:', error);
            return {
                totalZones: 0,
                totalRecords: 0,
                recordsByType: {}
            };
        }
    }

    /**
     * Export zone to BIND format (standard DNS zone file)
     */
    static async exportZoneToBIND(domainName: string): Promise<string> {
        const records = await this.getZoneRecords(domainName);

        let zoneFile = `; Zone file for ${domainName}\n`;
        zoneFile += `; Generated by CloudKu on ${new Date().toISOString()}\n\n`;

        records.forEach(record => {
            const name = record.name.replace(`.${domainName}`, '').replace(domainName, '@');
            const prio = record.prio ? `${record.prio} ` : '';
            zoneFile += `${name}\t${record.ttl}\tIN\t${record.type}\t${prio}${record.content}\n`;
        });

        return zoneFile;
    }

    /**
     * Check if PowerDNS is installed and running
     */
    static async checkPowerDNSStatus(): Promise<{
        installed: boolean;
        running: boolean;
        version?: string;
    }> {
        try {
            if (process.platform === 'win32') {
                return { installed: false, running: false };
            }

            // Check if PowerDNS is installed
            const { stdout: versionOutput } = await execAsync('pdns_server --version 2>&1 || echo "not installed"');
            const installed = !versionOutput.includes('not installed');

            if (!installed) {
                return { installed: false, running: false };
            }

            // Check if PowerDNS is running
            const { stdout: statusOutput } = await execAsync('systemctl is-active pdns 2>&1 || echo "inactive"');
            const running = statusOutput.trim() === 'active';

            // Extract version
            const versionMatch = versionOutput.match(/(\d+\.\d+\.\d+)/);
            const version = versionMatch ? versionMatch[1] : undefined;

            return { installed, running, version };
        } catch (error) {
            return { installed: false, running: false };
        }
    }
}

export default DNSService;
