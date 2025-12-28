/**
 * API Service untuk authentication
 * @file utils/authApi.ts
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
 * Google OAuth Login handler
 */
export const googleLogin = async (userData: {
    email: string;
    name: string;
    picture?: string;
    sub: string;
}): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login dengan Google gagal');
    }

    return await response.json();
};

/**
 * Email/Password Register
 */
export const register = async (data: {
    email: string;
    name: string;
    password: string;
}): Promise<LoginResponse> => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
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
    const response = await fetch(`${API_URL}/api/auth/login`, {
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

    const response = await fetch(`${API_URL}/api/auth/me`, {
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
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!getToken();
};
