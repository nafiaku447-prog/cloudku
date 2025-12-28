/**
 * PostgreSQL Database Connection Pool
 * @file server/db/pool.ts
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const poolConfig: PoolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'hostmodern',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum pool size
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return error after 2 seconds if no connection
};

// Create pool
const pool = new Pool(poolConfig);

// Error handler
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Connection test
pool.on('connect', () => {
    console.log('✅ Database connected to PostgreSQL');
});

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        console.log('✅ Database connection test successful:', result.rows[0].now);
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        return false;
    }
};

/**
 * Query helper function
 */
export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', { text, error });
        throw error;
    }
};

/**
 * Get a client from pool for transactions
 */
export const getClient = async () => {
    return await pool.connect();
};

/**
 * Close pool (for graceful shutdown)
 */
export const closePool = async (): Promise<void> => {
    await pool.end();
    console.log('Database pool closed');
};

export default pool;
