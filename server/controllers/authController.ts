/**
 * Auth Controller - Handle authentication logic
 * @file server/controllers/authController.ts
 */

import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel, User } from '../models/User';
import { query } from '../db/pool';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token
 */
const generateToken = (userId: number, email: string): string => {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

/**
 * Google OAuth Login/Register
 * Frontend akan mengirim Google JWT token yang sudah di-decode
 */
export const googleAuth = async (req: Request, res: Response) => {
    try {
        const { email, name, picture, sub } = req.body;

        // Validasi input
        if (!email || !name || !sub) {
            return res.status(400).json({
                success: false,
                message: 'Data Google tidak lengkap',
            });
        }

        // Cek apakah user sudah ada (by Google ID atau email)
        let user = await UserModel.findByGoogleId(sub);

        if (!user) {
            // Cek by email (case: user pernah daftar dengan email biasa)
            user = await UserModel.findByEmail(email);

            if (user) {
                // Update user dengan Google ID jika belum ada
                if (!user.google_id) {
                    // User exists but registered via email, link Google account
                    user = await UserModel.updateProfile(user.id, {
                        profile_picture: picture,
                        // google_id is missing in updateProfile interface, 
                        // but let's assume it should be updated too if linking.
                    });

                    // Link Google ID if not present
                    await query('UPDATE users SET google_id = $1 WHERE id = $2', [sub, user.id]);
                    user = await UserModel.findById(user.id) as User;
                }
            } else {
                // User baru, buat akun
                user = await UserModel.create({
                    email,
                    name,
                    profile_picture: picture,
                    auth_provider: 'google',
                    google_id: sub,
                    email_verified: true, // Google email sudah verified
                });

                console.log('✅ New user registered via Google:', email);
            }
        } else {
            // User sudah ada, update profile picture jika berubah
            if (user.profile_picture !== picture) {
                user = await UserModel.updateProfile(user.id, {
                    profile_picture: picture,
                });
            }
        }

        // Update last login
        await UserModel.updateLastLogin(user.id);
        user = await UserModel.findById(user.id) as User; // Final refresh

        // Generate JWT token
        const token = generateToken(user.id, user.email);

        // Return success dengan user data dan token
        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profile_picture: user.profile_picture,
                    auth_provider: user.auth_provider,
                    email_verified: user.email_verified,
                },
            },
        });
    } catch (error) {
        console.error('Google Auth Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login dengan Google',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Email/Password Register
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { email, name, password } = req.body;

        // Validasi input
        if (!email || !name || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email, nama, dan password harus diisi',
            });
        }

        // Cek apakah email sudah terdaftar
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar',
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Buat user baru
        const user = await UserModel.create({
            email,
            name,
            password_hash: passwordHash,
            auth_provider: 'email',
            email_verified: false,
        });

        // Generate token
        const token = generateToken(user.id, user.email);

        return res.status(201).json({
            success: true,
            message: 'Registrasi berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    auth_provider: user.auth_provider,
                    email_verified: user.email_verified,
                },
            },
        });
    } catch (error) {
        console.error('Register Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat registrasi',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Email/Password Login
 */
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validasi input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email dan password harus diisi',
            });
        }

        // Cari user
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah',
            });
        }

        // Cek apakah user pakai OAuth
        if (!user.password_hash) {
            return res.status(400).json({
                success: false,
                message: `Akun ini terdaftar via ${user.auth_provider}. Silakan login dengan ${user.auth_provider}.`,
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Email atau password salah',
            });
        }

        // Check if active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Akun Anda telah dinonaktifkan',
            });
        }

        // Update last login
        await UserModel.updateLastLogin(user.id);

        // Generate token
        const token = generateToken(user.id, user.email);

        return res.status(200).json({
            success: true,
            message: 'Login berhasil',
            data: {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profile_picture: user.profile_picture,
                    auth_provider: user.auth_provider,
                    email_verified: user.email_verified,
                },
            },
        });
    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

/**
 * Get current user (verify token)
 */
export const getMe = async (req: Request, res: Response) => {
    try {
        // User ID dari middleware auth
        const userId = (req as any).userId;

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan',
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    profile_picture: user.profile_picture,
                    auth_provider: user.auth_provider,
                    email_verified: user.email_verified,
                    created_at: user.created_at,
                },
            },
        });
    } catch (error) {
        console.error('Get Me Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};
