/**
 * Database Controller - Database Management API
 */

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DatabaseService from '../services/databaseService';

/**
 * Get user's databases
 */
export const getDatabases = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const databases = await DatabaseService.getUserDatabases(userId!);
        const stats = await DatabaseService.getStats(userId!);

        res.json({
            success: true,
            databases,
            stats
        });
    } catch (error) {
        console.error('Get databases error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch databases'
        });
    }
};

/**
 * Create new database
 */
export const createDatabase = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { databaseName, databaseUser, databasePassword, databaseType, charset, collation } = req.body;

        if (!databaseName || !databaseUser || !databasePassword || !databaseType) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const database = await DatabaseService.createDatabase(userId!, {
            databaseName,
            databaseUser,
            databasePassword,
            databaseType,
            charset,
            collation
        });

        res.status(201).json({
            success: true,
            message: 'Database created successfully',
            database
        });
    } catch (error) {
        console.error('Create database error:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
};

/**
 * Delete database
 */
export const deleteDatabase = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        await DatabaseService.deleteDatabase(parseInt(id), userId!);

        res.json({
            success: true,
            message: 'Database deleted successfully'
        });
    } catch (error) {
        console.error('Delete database error:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
};

/**
 * Change database password
 */
export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password is required'
            });
        }

        await DatabaseService.changePassword(parseInt(id), userId!, newPassword);

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
};

/**
 * Update database size
 */
export const updateSize = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const sizeMB = await DatabaseService.updateDatabaseSize(parseInt(id));

        res.json({
            success: true,
            sizeMB
        });
    } catch (error) {
        console.error('Update size error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update database size'
        });
    }
};

/**
 * Get database statistics
 */
export const getStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const stats = await DatabaseService.getStats(userId!);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics'
        });
    }
};
