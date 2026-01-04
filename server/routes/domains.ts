import express from 'express';
import { authenticate } from '../middleware/auth';
import {
    getDomains,
    getDomain,
    createDomain,
    updateDomain,
    deleteDomain,
    getDNSRecords,
    createDNSRecord,
    deleteDNSRecord,
    verifyDomain
} from '../controllers/domainController';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Domain routes
router.get('/', getDomains);
router.get('/:id', getDomain);
router.post('/', createDomain);
router.put('/:id', updateDomain);
router.delete('/:id', deleteDomain);
router.post('/:id/verify', verifyDomain);

// DNS Records routes
router.get('/:domainId/dns', getDNSRecords);
router.post('/:domainId/dns', createDNSRecord);
router.delete('/:domainId/dns/:recordId', deleteDNSRecord);

export default router;
