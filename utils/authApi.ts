/**
 * API Service untuk authentication
 * @file utils/authApi.ts
 */

import { getApiUrl } from './api';

export interface LoginResponse {
    success: boolean;
    message?: string;
    data?: {
        token: string;
        user: {
            id: number;
            email: string;
            name: string;
            profile_picture?: string;
            auth_provider: string;
            email_verified: boolean;
        };
    };
}

/**
 * Google OAuth Login handler (with JWT token from popup/One Tap)
 */
export const googleLogin = async (token: string): Promise<LoginResponse> => {
    const response = await fetch(getApiUrl('/auth/google'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || 'Login dengan Google gagal';
        const detailedError = error.error ? ` (${error.error})` : '';
        throw new Error(errorMessage + detailedError);
    }

    return await response.json();
};

/**
 * Google OAuth Login with Authorization Code (redirect flow)
 */
export const googleLoginWithCode = async (code: string): Promise<LoginResponse> => {
    const response = await fetch(getApiUrl('/auth/google/callback'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
    });

    if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.message || 'Login dengan Google gagal';
        const detailedError = error.error ? ` (${error.error})` : '';
        throw new Error(errorMessage + detailedError);
    }

    return await response.json();
};

/**
 * GitHub OAuth Login handler
 */
export const githubLogin = async (code: string): Promise<LoginResponse> => {
    try {
        const response = await fetch(getApiUrl('/auth/github'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login dengan GitHub gagal');
        }

        const data = await response.json();

        return data;
    } catch (error) {
        throw error;
    }
};

/**
 * Email/Password Register
 */
export const register = async (data: {
    email: string;
    name: string;
    password: string;
}): Promise<LoginResponse> => {
    const response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registrasi gagal');
    }

    return await response.json();
};

/**
 * Email/Password Login
 */
export const login = async (data: {
    email: string;
    password: string;
}): Promise<LoginResponse> => {
    const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login gagal');
    }

    return await response.json();
};

/**
 * Get current user
 */
export const getCurrentUser = async (): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(getApiUrl('/auth/me'), {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to get user data');
    }

    return await response.json();
};

/**
 * Save token to localStorage
 */
export const saveToken = (token: string): void => {
    localStorage.setItem('auth_token', token);
};

/**
 * Get token from localStorage
 */
export const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
};

/**
 * Remove token from localStorage
 */
export const removeToken = (): void => {
    localStorage.removeItem('auth_token');
};

/**
 * Delete current user account
 */
export const deleteAccount = async (): Promise<void> => {
    const token = getToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(getApiUrl('/auth/me'), {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
    }

    // Clear token after successful deletion
    removeToken();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};
