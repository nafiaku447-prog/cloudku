/**
 * SSL Routes - SSL Certificate Management
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as sslController from '../controllers/sslController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// SSL Statistics
router.get('/stats', sslController.getSSLStats);
router.get('/expiring', sslController.getExpiringCertificates);

// Domain-specific SSL operations
router.post('/:domainId/enable', sslController.enableSSL);
router.post('/:domainId/disable', sslController.disableSSL);
router.post('/:domainId/renew', sslController.renewSSL);
router.get('/:domainId/info', sslController.getSSLInfo);

export default router;
