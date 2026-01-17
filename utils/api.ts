/**
 * API Configuration
 * Centralized API configuration with versioning support
 * @file utils/api.ts
 */

// API Base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API Version - Change this to update all endpoints
export const API_VERSION = 'v1';

// Full API URL with version
export const API_URL = API_BASE_URL;
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

/**
 * Get versioned API endpoint
 * @param endpoint - The endpoint path without /api/v1 prefix
 * @returns Full API URL with versioning
 * 
 * @example
 * getApiUrl('/auth/login') => 'http://localhost:3001/api/v1/auth/login'
 * getApiUrl('/files/list') => 'http://localhost:3001/api/v1/files/list'
 */
export const getApiUrl = (endpoint: string): string => {
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_V1_URL}${normalizedEndpoint}`;
};

/**
 * Get unversioned API endpoint (for health, /api info, etc)
 * @param endpoint - The endpoint path
 * @returns Full API URL without versioning
 */
export const getBaseApiUrl = (endpoint: string): string => {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${normalizedEndpoint}`;
};

/**
 * API Version Info
 */
export const getApiVersion = (): { version: string; baseUrl: string } => ({
    version: API_VERSION,
    baseUrl: API_V1_URL,
});

export default {
    API_URL,
    API_V1_URL,
    API_VERSION,
    getApiUrl,
    getBaseApiUrl,
    getApiVersion,
};
