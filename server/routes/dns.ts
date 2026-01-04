/**
 * DNS Routes - Advanced DNS Management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as dnsController from '../controllers/dnsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// DNS Statistics
router.get('/stats', dnsController.getDNSStats);

// PowerDNS Server Status
router.get('/powerdns/status', dnsController.getPowerDNSStatus);
router.post('/powerdns/reload', dnsController.reloadPowerDNS);

// Domain-specific operations
router.get('/:domainId/powerdns-records', dnsController.getPowerDNSRecords);
router.get('/:domainId/export', dnsController.exportZone);
router.post('/:domainId/increment-serial', dnsController.incrementSOASerial);

export default router;
