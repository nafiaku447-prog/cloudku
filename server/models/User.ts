/**
 * User Model - Database operations untuk users table
 * @file server/models/User.ts
 */

import { query } from '../db/pool';

export interface User {
    id: number;
    email: string;
    name: string;
    password_hash?: string | null;
    profile_picture?: string | null;
    auth_provider: 'google' | 'facebook' | 'github' | 'email';
    google_id?: string | null;
    facebook_id?: string | null;
    github_id?: string | null;
    email_verified: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
    last_login?: Date | null;
}

export interface CreateUserData {
    email: string;
    name: string;
    password_hash?: string;
    profile_picture?: string;
    auth_provider: 'google' | 'facebook' | 'github' | 'email';
    google_id?: string;
    facebook_id?: string;
    github_id?: string;
    email_verified?: boolean;
}

export class UserModel {
    /**
     * Buat user baru
     */
    static async create(userData: CreateUserData): Promise<User> {
        const {
            email,
            name,
            password_hash,
            profile_picture,
            auth_provider,
            google_id,
            facebook_id,
            github_id,
            email_verified = false,
        } = userData;

        const result = await query(
            `INSERT INTO users (
        email, name, password_hash, profile_picture, 
        auth_provider, google_id, facebook_id, github_id, email_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
            [
                email,
                name,
                password_hash || null,
                profile_picture || null,
                auth_provider,
                google_id || null,
                facebook_id || null,
                github_id || null,
                email_verified,
            ]
        );

        return result.rows[0];
    }

    /**
     * Cari user by email
     */
    static async findByEmail(email: string): Promise<User | null> {
        const result = await query('SELECT * FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    }

    /**
     * Cari user by Google ID
     */
    static async findByGoogleId(googleId: string): Promise<User | null> {
        const result = await query('SELECT * FROM users WHERE google_id = $1', [
            googleId,
        ]);
        return result.rows[0] || null;
    }

    /**
     * Cari user by Facebook ID
     */
    static async findByFacebookId(facebookId: string): Promise<User | null> {
        const result = await query('SELECT * FROM users WHERE facebook_id = $1', [
            facebookId,
        ]);
        return result.rows[0] || null;
    }

    /**
     * Cari user by GitHub ID
     */
    static async findByGithubId(githubId: string): Promise<User | null> {
        const result = await query('SELECT * FROM users WHERE github_id = $1', [
            githubId,
        ]);
        return result.rows[0] || null;
    }

    /**
     * Cari user by ID
     */
    static async findById(id: number): Promise<User | null> {
        const result = await query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0] || null;
    }

    /**
     * Update last login time
     */
    static async updateLastLogin(id: number): Promise<void> {
        await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [
            id,
        ]);
    }

    /**
     * Update user profile
     */
    static async updateProfile(
        id: number,
        data: { name?: string; profile_picture?: string }
    ): Promise<User> {
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;

        if (data.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }

        if (data.profile_picture !== undefined) {
            updates.push(`profile_picture = $${paramCount++}`);
            values.push(data.profile_picture);
        }

        values.push(id);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        return result.rows[0];
    }

    /**
     * Verify email
     */
    static async verifyEmail(id: number): Promise<void> {
        await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [id]);
    }

    /**
     * Deactivate user
     */
    static async deactivate(id: number): Promise<void> {
        await query('UPDATE users SET is_active = FALSE WHERE id = $1', [id]);
    }

    /**
     * Get all users (admin only)
     */
    static async getAll(limit = 100, offset = 0): Promise<User[]> {
        const result = await query(
            'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        return result.rows;
    }

    /**
     * Count total users
     */
    static async count(): Promise<number> {
        const result = await query('SELECT COUNT(*) as count FROM users');
        return parseInt(result.rows[0].count);
    }

    /**
     * Get user statistics
     */
    static async getStats(): Promise<any> {
        const result = await query('SELECT * FROM user_stats');
        return result.rows;
    }
}
