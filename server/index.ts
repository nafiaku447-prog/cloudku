/**
 * Express Server untuk HostModern API
 * @file server/index.ts
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { testConnection } from './db/pool';
import authRoutes from './routes/auth';
import hostingRoutes from './routes/hosting';
import fileRoutes from './routes/files';
import domainRoutes from './routes/domains';
import dnsRoutes from './routes/dns';
import sslRoutes from './routes/ssl';
import databaseRoutes from './routes/databases';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));

// Security Headers
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'HostModern API is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/hosting', hostingRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/ssl', sslRoutes);
app.use('/api/databases', databaseRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
    });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('❌ Failed to connect to database. Please check your configuration.');
            console.error('Make sure PostgreSQL is running and .env.local is configured correctly.');
            process.exit(1);
        }

        // Start listening
        app.listen(PORT, async () => {
            console.log('');
            console.log('='.repeat(60));
            console.log('🚀 HostModern API Server');
            console.log('='.repeat(60));
            console.log(`📡 Server running on: http://localhost:${PORT}`);
            console.log(`🗄️  Database: Connected to PostgreSQL`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
            console.log('='.repeat(60));
            console.log('');
            console.log('Available endpoints:');
            console.log(`  GET    /health              - Health check`);
            console.log(`  POST   /api/auth/google     - Google OAuth login`);
            console.log(`  POST   /api/auth/register   - Email/password register`);
            console.log(`  POST   /api/auth/login      - Email/password login`);
            console.log(`  GET    /api/auth/me         - Get current user (auth required)`);
            console.log('='.repeat(60));
            console.log('');

            // Start Cron Jobs
            const { startSSLRenewalCron } = await import('./cron/sslRenewal');
            startSSLRenewalCron();
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server
startServer();

export default app;
