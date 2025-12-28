/**
 * Auth Middleware - Verify JWT token
 * @file server/middleware/auth.ts
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

interface JwtPayload {
    userId: number;
    email: string;
}

/**
 * Middleware untuk verifikasi JWT token
 */
export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak ditemukan. Silakan login.',
            });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        // Attach user info to request
        (req as any).userId = decoded.userId;
        (req as any).userEmail = decoded.email;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                success: false,
                message: 'Token tidak valid',
            });
        }

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: 'Token sudah expired. Silakan login kembali.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat verifikasi token',
        });
    }
};

/**
 * Optional auth - jika ada token, verify, jika tidak ada, lanjut
 */
export const optionalAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token, continue without auth
            return next();
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        (req as any).userId = decoded.userId;
        (req as any).userEmail = decoded.email;

        next();
    } catch (error) {
        // Token invalid, continue without auth
        next();
    }
};
