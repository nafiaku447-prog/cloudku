/**
 * DNS Controller - Advanced DNS Management
 * Provides API endpoints for PowerDNS operations
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DNSService from '../services/dnsService';
import pool from '../db/pool';

/**
 * Get DNS statistics
 */
export const getDNSStats = async (req: AuthRequest, res: Response) => {
    try {
        const stats = await DNSService.getStats();

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get DNS stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch DNS statistics'
        });
    }
};

/**
 * Export zone to BIND format
 */
export const exportZone = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT domain_name FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = domain.rows[0].domain_name;
        const zoneFile = await DNSService.exportZoneToBIND(domainName);

        // Send as downloadable file
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${domainName}.zone"`);
        res.send(zoneFile);
    } catch (error) {
        console.error('Export zone error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export zone file'
        });
    }
};

/**
 * Get PowerDNS server status
 */
export const getPowerDNSStatus = async (req: AuthRequest, res: Response) => {
    try {
        const status = await DNSService.checkPowerDNSStatus();

        res.json({
            success: true,
            powerdns: status
        });
    } catch (error) {
        console.error('Get PowerDNS status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check PowerDNS status'
        });
    }
};

/**
 * Reload PowerDNS server
 */
export const reloadPowerDNS = async (req: AuthRequest, res: Response) => {
    try {
        const reloaded = await DNSService.reloadPowerDNS();

        res.json({
            success: true,
            reloaded,
            message: reloaded ? 'PowerDNS reloaded successfully' : 'PowerDNS reload skipped'
        });
    } catch (error) {
        console.error('Reload PowerDNS error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reload PowerDNS'
        });
    }
};

/**
 * Get all PowerDNS records for a domain
 */
export const getPowerDNSRecords = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT domain_name FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = domain.rows[0].domain_name;
        const records = await DNSService.getZoneRecords(domainName);

        res.json({
            success: true,
            records
        });
    } catch (error) {
        console.error('Get PowerDNS records error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch PowerDNS records'
        });
    }
};

/**
 * Increment SOA serial (for manual zone updates)
 */
export const incrementSOASerial = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { domainId } = req.params;

        // Verify ownership
        const domain = await pool.query(
            'SELECT domain_name FROM domains WHERE id = $1 AND user_id = $2',
            [domainId, userId]
        );

        if (domain.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Domain not found'
            });
        }

        const domainName = domain.rows[0].domain_name;
        await DNSService.incrementSOASerial(domainName);

        res.json({
            success: true,
            message: 'SOA serial incremented'
        });
    } catch (error) {
        console.error('Increment SOA serial error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to increment SOA serial'
        });
    }
};
