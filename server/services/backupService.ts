/**
 * Backup Service - Backup and Restore Operations
 * Handles file and database backups with compression and scheduling
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

interface BackupConfig {
    userId: number;
    backupName: string;
    backupType: 'full' | 'files' | 'database';
    includesFiles?: boolean;
    includesDatabases?: boolean;
    databaseIds?: number[];
}

interface BackupInfo {
    id: number;
    backup_name: string;
    backup_type: string;
    backup_path: string;
    backup_size_mb: number;
    status: string;
    created_at: Date;
}

export class BackupService {
    private static BACKUP_DIR = '/var/backups/cloudku';
    private static BACKUP_DIR_DEV = path.join(__dirname, '../../.backups');

    /**
     * Create a new backup
     */
    static async createBackup(config: BackupConfig): Promise<BackupInfo> {
        try {
            const backupDir = process.platform === 'win32' ? this.BACKUP_DIR_DEV : this.BACKUP_DIR;

            // Ensure backup directory exists
            await fs.mkdir(backupDir, { recursive: true });

            // Generate backup filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `${config.backupName}_${timestamp}.tar.gz`;
            const backupPath = path.join(backupDir, backupFileName);

            // Create backup record
            const result = await pool.query(
                `INSERT INTO backups 
                (user_id, backup_name, backup_type, backup_path, status, includes_files, includes_databases, database_ids, started_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
                RETURNING *`,
                [
                    config.userId,
                    config.backupName,
                    config.backupType,
                    backupPath,
                    'running',
                    config.includesFiles ?? true,
                    config.includesDatabases ?? true,
                    config.databaseIds || []
                ]
            );

            const backupId = result.rows[0].id;

            // Perform backup asynchronously
            this.performBackup(backupId, config, backupPath).catch(error => {
                console.error('Backup error:', error);
                this.updateBackupStatus(backupId, 'failed', error.message);
            });

            return result.rows[0];
        } catch (error) {
            console.error('Create backup error:', error);
            throw new Error(`Failed to create backup: ${(error as Error).message}`);
        }
    }

    /**
     * Perform actual backup operation
     */
    private static async performBackup(
        backupId: number,
        config: BackupConfig,
        backupPath: string
    ): Promise<void> {
        try {
            const tempDir = path.join(path.dirname(backupPath), `temp_${backupId}`);
            await fs.mkdir(tempDir, { recursive: true });

            // Backup files
            if (config.includesFiles) {
                await this.backupFiles(config.userId, tempDir);
            }

            // Backup databases
            if (config.includesDatabases && config.databaseIds && config.databaseIds.length > 0) {
                await this.backupDatabases(config.databaseIds, tempDir);
            }

            // Compress to tar.gz
            if (process.platform !== 'win32') {
                await execAsync(`tar -czf ${backupPath} -C ${tempDir} .`);
            } else {
                // On Windows, just create a marker file
                await fs.writeFile(backupPath, `Backup created at ${new Date().toISOString()}`);
            }

            // Get backup size
            const stats = await fs.stat(backupPath);
            const sizeMB = stats.size / (1024 * 1024);

            // Cleanup temp directory
            await fs.rm(tempDir, { recursive: true, force: true });

            // Update backup status
            await pool.query(
                `UPDATE backups 
                 SET status = $1, backup_size_mb = $2, completed_at = CURRENT_TIMESTAMP 
                 WHERE id = $3`,
                ['completed', sizeMB, backupId]
            );

            console.log(`✅ Backup completed: ${backupPath} (${sizeMB.toFixed(2)} MB)`);
        } catch (error) {
            console.error('Perform backup error:', error);
            throw error;
        }
    }

    /**
     * Backup user files
     */
    private static async backupFiles(userId: number, targetDir: string): Promise<void> {
        const filesDir = path.join(targetDir, 'files');
        await fs.mkdir(filesDir, { recursive: true });

        if (process.platform === 'win32') {
            // Development mode - create placeholder
            await fs.writeFile(
                path.join(filesDir, 'files_backup.txt'),
                `Files backup for user ${userId}`
            );
            return;
        }

        // Production - copy actual files
        const userFilesPath = `/home/user_${userId}/public_html`;
        try {
            await execAsync(`cp -r ${userFilesPath}/* ${filesDir}/`);
        } catch (error) {
            console.warn('No files to backup or path does not exist');
        }
    }

    /**
     * Backup databases
     */
    private static async backupDatabases(databaseIds: number[], targetDir: string): Promise<void> {
        const dbDir = path.join(targetDir, 'databases');
        await fs.mkdir(dbDir, { recursive: true });

        for (const dbId of databaseIds) {
            const dbInfo = await pool.query(
                'SELECT * FROM user_databases WHERE id = $1',
                [dbId]
            );

            if (dbInfo.rows.length === 0) continue;

            const db = dbInfo.rows[0];
            const dumpFile = path.join(dbDir, `${db.database_name}.sql`);

            if (process.platform === 'win32') {
                // Development mode - create placeholder
                await fs.writeFile(dumpFile, `-- Database dump for ${db.database_name}`);
                continue;
            }

            // Production - actual dump
            try {
                if (db.database_type === 'mysql') {
                    await execAsync(
                        `mysqldump -u root ${db.database_name} > ${dumpFile}`
                    );
                } else {
                    await execAsync(
                        `sudo -u postgres pg_dump ${db.database_name} > ${dumpFile}`
                    );
                }
            } catch (error) {
                console.error(`Failed to backup database ${db.database_name}:`, error);
            }
        }
    }

    /**
     * Get user's backups
     */
    static async getUserBackups(userId: number): Promise<BackupInfo[]> {
        const result = await pool.query(
            'SELECT * FROM backups WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return result.rows;
    }

    /**
     * Delete backup
     */
    static async deleteBackup(backupId: number, userId: number): Promise<void> {
        try {
            const backup = await pool.query(
                'SELECT * FROM backups WHERE id = $1 AND user_id = $2',
                [backupId, userId]
            );

            if (backup.rows.length === 0) {
                throw new Error('Backup not found');
            }

            const backupPath = backup.rows[0].backup_path;

            // Delete file
            try {
                await fs.unlink(backupPath);
            } catch (error) {
                console.warn('Backup file not found or already deleted');
            }

            // Delete record
            await pool.query('DELETE FROM backups WHERE id = $1', [backupId]);

            console.log(`✅ Backup deleted: ${backupPath}`);
        } catch (error) {
            console.error('Delete backup error:', error);
            throw new Error(`Failed to delete backup: ${(error as Error).message}`);
        }
    }

    /**
     * Restore from backup
     */
    static async restoreBackup(backupId: number, userId: number): Promise<void> {
        try {
            const backup = await pool.query(
                'SELECT * FROM backups WHERE id = $1 AND user_id = $2',
                [backupId, userId]
            );

            if (backup.rows.length === 0) {
                throw new Error('Backup not found');
            }

            const backupData = backup.rows[0];

            // Create restore point record
            const restorePoint = await pool.query(
                `INSERT INTO restore_points 
                (user_id, backup_id, restore_type, status, started_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                RETURNING id`,
                [userId, backupId, backupData.backup_type, 'running']
            );

            const restoreId = restorePoint.rows[0].id;

            // Perform restore asynchronously
            this.performRestore(restoreId, backupData, userId).catch(error => {
                console.error('Restore error:', error);
                this.updateRestoreStatus(restoreId, 'failed', error.message);
            });

        } catch (error) {
            console.error('Restore backup error:', error);
            throw new Error(`Failed to restore backup: ${(error as Error).message}`);
        }
    }

    /**
     * Perform actual restore operation
     */
    private static async performRestore(
        restoreId: number,
        backupData: any,
        userId: number
    ): Promise<void> {
        try {
            if (process.platform === 'win32') {
                // Development mode - simulate restore
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.updateRestoreStatus(restoreId, 'completed');
                return;
            }

            const tempDir = `/tmp/restore_${restoreId}`;
            await fs.mkdir(tempDir, { recursive: true });

            // Extract backup
            await execAsync(`tar -xzf ${backupData.backup_path} -C ${tempDir}`);

            // Restore files
            if (backupData.includes_files) {
                const filesDir = path.join(tempDir, 'files');
                const userFilesPath = `/home/user_${userId}/public_html`;
                await execAsync(`cp -r ${filesDir}/* ${userFilesPath}/`);
            }

            // Restore databases
            if (backupData.includes_databases) {
                const dbDir = path.join(tempDir, 'databases');
                const sqlFiles = await fs.readdir(dbDir);

                for (const sqlFile of sqlFiles) {
                    const dbName = path.basename(sqlFile, '.sql');
                    const sqlPath = path.join(dbDir, sqlFile);

                    // Determine database type and restore
                    const dbInfo = await pool.query(
                        'SELECT database_type FROM user_databases WHERE database_name = $1',
                        [dbName]
                    );

                    if (dbInfo.rows.length > 0) {
                        const dbType = dbInfo.rows[0].database_type;
                        if (dbType === 'mysql') {
                            await execAsync(`mysql -u root ${dbName} < ${sqlPath}`);
                        } else {
                            await execAsync(`sudo -u postgres psql ${dbName} < ${sqlPath}`);
                        }
                    }
                }
            }

            // Cleanup
            await fs.rm(tempDir, { recursive: true, force: true });

            await this.updateRestoreStatus(restoreId, 'completed');
            console.log(`✅ Restore completed from backup ${backupData.id}`);
        } catch (error) {
            console.error('Perform restore error:', error);
            throw error;
        }
    }

    /**
     * Update backup status
     */
    private static async updateBackupStatus(
        backupId: number,
        status: string,
        errorMessage?: string
    ): Promise<void> {
        await pool.query(
            `UPDATE backups 
             SET status = $1, error_message = $2, completed_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [status, errorMessage || null, backupId]
        );
    }

    /**
     * Update restore status
     */
    private static async updateRestoreStatus(
        restoreId: number,
        status: string,
        errorMessage?: string
    ): Promise<void> {
        await pool.query(
            `UPDATE restore_points 
             SET status = $1, error_message = $2, completed_at = CURRENT_TIMESTAMP 
             WHERE id = $3`,
            [status, errorMessage || null, restoreId]
        );
    }

    /**
     * Get backup statistics
     */
    static async getStats(userId: number): Promise<{
        total: number;
        totalSizeMB: number;
        completed: number;
        failed: number;
    }> {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COALESCE(SUM(backup_size_mb), 0) as total_size_mb,
                COUNT(*) FILTER (WHERE status = 'completed') as completed,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
             FROM backups 
             WHERE user_id = $1`,
            [userId]
        );

        return {
            total: parseInt(result.rows[0].total),
            totalSizeMB: parseFloat(result.rows[0].total_size_mb),
            completed: parseInt(result.rows[0].completed),
            failed: parseInt(result.rows[0].failed)
        };
    }

    /**
     * Download backup file
     */
    static async getBackupPath(backupId: number, userId: number): Promise<string> {
        const result = await pool.query(
            'SELECT backup_path FROM backups WHERE id = $1 AND user_id = $2',
            [backupId, userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Backup not found');
        }

        return result.rows[0].backup_path;
    }
}

export default BackupService;
