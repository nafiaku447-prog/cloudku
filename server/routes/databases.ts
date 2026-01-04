/**
 * Database Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as databaseController from '../controllers/databaseController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Database CRUD
router.get('/', databaseController.getDatabases);
router.post('/', databaseController.createDatabase);
router.delete('/:id', databaseController.deleteDatabase);

// Database operations
router.post('/:id/change-password', databaseController.changePassword);
router.post('/:id/update-size', databaseController.updateSize);

// Statistics
router.get('/stats', databaseController.getStats);

export default router;
