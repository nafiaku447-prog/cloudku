/**
 * Database Service - MySQL/PostgreSQL Management
 * Handles database creation, user management, and operations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import pool from '../db/pool';
import crypto from 'crypto';

const execAsync = promisify(exec);

interface DatabaseConfig {
    databaseName: string;
    databaseUser: string;
    databasePassword: string;
    databaseType: 'mysql' | 'postgresql';
    charset?: string;
    collation?: string;
}

interface DatabaseInfo {
    id: number;
    database_name: string;
    database_type: string;
    database_user: string;
    current_size_mb: number;
    max_size_mb: number;
    status: string;
    created_at: Date;
}

export class DatabaseService {
    /**
     * Create a new database and user
     */
    static async createDatabase(userId: number, config: DatabaseConfig): Promise<DatabaseInfo> {
        try {
            // Validate database name (alphanumeric + underscore only)
            if (!/^[a-zA-Z0-9_]+$/.test(config.databaseName)) {
                throw new Error('Database name must contain only letters, numbers, and underscores');
            }

            // Check if database name already exists
            const existing = await pool.query(
                'SELECT id FROM user_databases WHERE database_name = $1',
                [config.databaseName]
            );

            if (existing.rows.length > 0) {
                throw new Error('Database name already exists');
            }

            // Encrypt password for storage
            const encryptedPassword = this.encryptPassword(config.databasePassword);

            // Create database in MySQL/PostgreSQL
            if (config.databaseType === 'mysql') {
                await this.createMySQLDatabase(config);
            } else {
                await this.createPostgreSQLDatabase(config);
            }

            // Store in tracking table
            const result = await pool.query(
                `INSERT INTO user_databases 
                (user_id, database_name, database_type, database_user, database_password, charset, collation)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *`,
                [
                    userId,
                    config.databaseName,
                    config.databaseType,
                    config.databaseUser,
                    encryptedPassword,
                    config.charset || 'utf8mb4',
                    config.collation || 'utf8mb4_unicode_ci'
                ]
            );

            console.log(`✅ Database created: ${config.databaseName}`);
            return result.rows[0];
        } catch (error) {
            console.error('Create database error:', error);
            throw new Error(`Failed to create database: ${(error as Error).message}`);
        }
    }

    /**
     * Create MySQL database and user
     */
    private static async createMySQLDatabase(config: DatabaseConfig): Promise<void> {
        // Skip on Windows
        if (process.platform === 'win32') {
            console.log('ℹ️  MySQL database creation skipped (Windows development mode)');
            return;
        }

        const commands = [
            `CREATE DATABASE IF NOT EXISTS \`${config.databaseName}\` 
             CHARACTER SET ${config.charset || 'utf8mb4'} 
             COLLATE ${config.collation || 'utf8mb4_unicode_ci'}`,
            `CREATE USER IF NOT EXISTS '${config.databaseUser}'@'localhost' 
             IDENTIFIED BY '${config.databasePassword}'`,
            `GRANT ALL PRIVILEGES ON \`${config.databaseName}\`.* 
             TO '${config.databaseUser}'@'localhost'`,
            `FLUSH PRIVILEGES`
        ];

        for (const cmd of commands) {
            await execAsync(`mysql -u root -e "${cmd}"`);
        }
    }

    /**
     * Create PostgreSQL database and user
     */
    private static async createPostgreSQLDatabase(config: DatabaseConfig): Promise<void> {
        // Skip on Windows
        if (process.platform === 'win32') {
            console.log('ℹ️  PostgreSQL database creation skipped (Windows development mode)');
            return;
        }

        const commands = [
            `CREATE USER ${config.databaseUser} WITH ENCRYPTED PASSWORD '${config.databasePassword}'`,
            `CREATE DATABASE ${config.databaseName} OWNER ${config.databaseUser}`,
            `GRANT ALL PRIVILEGES ON DATABASE ${config.databaseName} TO ${config.databaseUser}`
        ];

        for (const cmd of commands) {
            try {
                await execAsync(`sudo -u postgres psql -c "${cmd}"`);
            } catch (error: any) {
                // Ignore if user/database already exists
                if (!error.message.includes('already exists')) {
                    throw error;
                }
            }
        }
    }

    /**
     * Delete database and user
     */
    static async deleteDatabase(databaseId: number, userId: number): Promise<void> {
        try {
            // Get database info
            const dbInfo = await pool.query(
                'SELECT * FROM user_databases WHERE id = $1 AND user_id = $2',
                [databaseId, userId]
            );

            if (dbInfo.rows.length === 0) {
                throw new Error('Database not found');
            }

            const db = dbInfo.rows[0];

            // Delete from MySQL/PostgreSQL
            if (db.database_type === 'mysql') {
                await this.deleteMySQLDatabase(db.database_name, db.database_user);
            } else {
                await this.deletePostgreSQLDatabase(db.database_name, db.database_user);
            }

            // Delete from tracking table
            await pool.query('DELETE FROM user_databases WHERE id = $1', [databaseId]);

            console.log(`✅ Database deleted: ${db.database_name}`);
        } catch (error) {
            console.error('Delete database error:', error);
            throw new Error(`Failed to delete database: ${(error as Error).message}`);
        }
    }

    /**
     * Delete MySQL database and user
     */
    private static async deleteMySQLDatabase(dbName: string, dbUser: string): Promise<void> {
        if (process.platform === 'win32') {
            console.log('ℹ️  MySQL database deletion skipped (Windows)');
            return;
        }

        const commands = [
            `DROP DATABASE IF EXISTS \`${dbName}\``,
            `DROP USER IF EXISTS '${dbUser}'@'localhost'`
        ];

        for (const cmd of commands) {
            await execAsync(`mysql -u root -e "${cmd}"`);
        }
    }

    /**
     * Delete PostgreSQL database and user
     */
    private static async deletePostgreSQLDatabase(dbName: string, dbUser: string): Promise<void> {
        if (process.platform === 'win32') {
            console.log('ℹ️  PostgreSQL database deletion skipped (Windows)');
            return;
        }

        const commands = [
            `DROP DATABASE IF EXISTS ${dbName}`,
            `DROP USER IF EXISTS ${dbUser}`
        ];

        for (const cmd of commands) {
            await execAsync(`sudo -u postgres psql -c "${cmd}"`);
        }
    }

    /**
     * Get user's databases
     */
    static async getUserDatabases(userId: number): Promise<DatabaseInfo[]> {
        const result = await pool.query(
            'SELECT * FROM user_databases WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return result.rows;
    }

    /**
     * Update database size (for monitoring)
     */
    static async updateDatabaseSize(databaseId: number): Promise<number> {
        try {
            const dbInfo = await pool.query(
                'SELECT database_name, database_type FROM user_databases WHERE id = $1',
                [databaseId]
            );

            if (dbInfo.rows.length === 0) {
                return 0;
            }

            const db = dbInfo.rows[0];
            let sizeMB = 0;

            if (process.platform !== 'win32') {
                if (db.database_type === 'mysql') {
                    const { stdout } = await execAsync(
                        `mysql -u root -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size FROM information_schema.TABLES WHERE table_schema = '${db.database_name}'"`
                    );
                    sizeMB = parseFloat(stdout.split('\n')[1] || '0');
                } else {
                    const { stdout } = await execAsync(
                        `sudo -u postgres psql -t -c "SELECT pg_database_size('${db.database_name}') / 1024 / 1024"`
                    );
                    sizeMB = parseFloat(stdout.trim());
                }

                // Update in database
                await pool.query(
                    'UPDATE user_databases SET current_size_mb = $1 WHERE id = $2',
                    [sizeMB, databaseId]
                );
            }

            return sizeMB;
        } catch (error) {
            console.error('Update database size error:', error);
            return 0;
        }
    }

    /**
     * Change database user password
     */
    static async changePassword(databaseId: number, userId: number, newPassword: string): Promise<void> {
        try {
            const dbInfo = await pool.query(
                'SELECT * FROM user_databases WHERE id = $1 AND user_id = $2',
                [databaseId, userId]
            );

            if (dbInfo.rows.length === 0) {
                throw new Error('Database not found');
            }

            const db = dbInfo.rows[0];

            // Update password in MySQL/PostgreSQL
            if (process.platform !== 'win32') {
                if (db.database_type === 'mysql') {
                    await execAsync(
                        `mysql -u root -e "ALTER USER '${db.database_user}'@'localhost' IDENTIFIED BY '${newPassword}'"`
                    );
                } else {
                    await execAsync(
                        `sudo -u postgres psql -c "ALTER USER ${db.database_user} WITH PASSWORD '${newPassword}'"`
                    );
                }
            }

            // Update encrypted password in tracking table
            const encryptedPassword = this.encryptPassword(newPassword);
            await pool.query(
                'UPDATE user_databases SET database_password = $1 WHERE id = $2',
                [encryptedPassword, databaseId]
            );

            console.log(`✅ Password changed for database user: ${db.database_user}`);
        } catch (error) {
            console.error('Change password error:', error);
            throw new Error(`Failed to change password: ${(error as Error).message}`);
        }
    }

    /**
     * Encrypt password for storage
     */
    private static encryptPassword(password: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        let encrypted = cipher.update(password, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt password from storage
     */
    static decryptPassword(encryptedPassword: string): string {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(process.env.JWT_SECRET || 'secret', 'salt', 32);
        const parts = encryptedPassword.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Get database statistics
     */
    static async getStats(userId: number): Promise<{
        total: number;
        mysql: number;
        postgresql: number;
        totalSizeMB: number;
    }> {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE database_type = 'mysql') as mysql,
                COUNT(*) FILTER (WHERE database_type = 'postgresql') as postgresql,
                COALESCE(SUM(current_size_mb), 0) as total_size_mb
             FROM user_databases 
             WHERE user_id = $1`,
            [userId]
        );

        return {
            total: parseInt(result.rows[0].total),
            mysql: parseInt(result.rows[0].mysql),
            postgresql: parseInt(result.rows[0].postgresql),
            totalSizeMB: parseFloat(result.rows[0].total_size_mb)
        };
    }
}

export default DatabaseService;
