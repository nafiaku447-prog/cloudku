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
 * GitHub OAuth Login/Register
 */
export const githubAuth = async (req: Request, res: Response) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code GitHub tidak ditemukan',
            });
        }

        // Debug: Pastikan secret terisi (jangan tampilkan full secret di log production)
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;

        console.log('GitHub Auth Attempt - Client ID present:', !!clientId);
        console.log('GitHub Auth Attempt - Client Secret present:', !!clientSecret);

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                success: false,
                message: 'Konfigurasi GitHub (Client ID/Secret) di server belum lengkap. Cek .env.local',
            });
        }

        // 1. Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
            }),
        });

        const tokenData = await tokenResponse.json();
        console.log('GitHub Token Data:', tokenData);

        if (tokenData.error) {
            return res.status(400).json({
                success: false,
                message: `GitHub Error: ${tokenData.error} - ${tokenData.error_description || 'Gagal menukar code GitHub'}`,
            });
        }

        const accessToken = tokenData.access_token;

        // 2. Get GitHub user profile
        const userProfileResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'User-Agent': 'HostModern-App',
            },
        });

        const githubUser = await userProfileResponse.json();

        if (!githubUser.id) {
            return res.status(400).json({
                success: false,
                message: 'Gagal mengambil profil GitHub',
            });
        }

        const sub = String(githubUser.id);
        const name = githubUser.name || githubUser.login;
        let email = githubUser.email;
        const picture = githubUser.avatar_url;

        // 3. GitHub email might be null if private, fetch emails
        if (!email) {
            const emailsResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'User-Agent': 'HostModern-App',
                },
            });
            const emails = await emailsResponse.json();
            const primaryEmail = emails.find((e: any) => e.primary && e.verified) || emails[0];
            email = primaryEmail?.email;
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email GitHub tidak ditemukan atau belum diverifikasi',
            });
        }

        // 4. Handle DB logic (similar to Google)
        let user = await UserModel.findByGithubId(sub);

        if (!user) {
            user = await UserModel.findByEmail(email);

            if (user) {
                // Link GitHub ID
                await query('UPDATE users SET github_id = $1, auth_provider = $2 WHERE id = $3', [sub, 'github', user.id]);
                user = await UserModel.findById(user.id) as User;
            } else {
                // New user
                user = await UserModel.create({
                    email,
                    name,
                    profile_picture: picture,
                    auth_provider: 'github',
                    github_id: sub,
                    email_verified: true,
                });
            }
        } else {
            // Update profile info if changed
            if (user.profile_picture !== picture || user.name !== name) {
                user = await UserModel.updateProfile(user.id, {
                    profile_picture: picture,
                    name: name
                });
            }
        }

        await UserModel.updateLastLogin(user.id);
        user = await UserModel.findById(user.id) as User;

        const token = generateToken(user.id, user.email);

        return res.status(200).json({
            success: true,
            message: 'Login GitHub berhasil',
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
        console.error('GitHub Auth Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan saat login dengan GitHub',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
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
