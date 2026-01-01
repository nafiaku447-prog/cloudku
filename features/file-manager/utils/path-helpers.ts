/**
 * Path Helper Utilities
 * Functions for path manipulation and breadcrumb generation
 */

import { DEFAULT_PATH } from '../constants/default-config';

export interface Breadcrumb {
    name: string;
    path: string;
    index: number;
}

/**
 * Build breadcrumb trail from current path
 * @param currentPath - Current directory path
 * @returns Array of breadcrumb objects
 */
export const buildBreadcrumbs = (currentPath: string): Breadcrumb[] => {
    const parts = currentPath.split('/').filter(p => p);

    return parts.map((part, index) => ({
        name: part,
        path: '/' + parts.slice(0, index + 1).join('/'),
        index
    }));
};

/**
 * Navigate to breadcrumb path
 * @param index - Breadcrumb index (-1 for home)
 * @param currentPath - Current directory path
 * @returns New path
 */
export const navigateToBreadcrumb = (index: number, currentPath: string): string => {
    if (index === -1) {
        return DEFAULT_PATH;
    }

    const pathParts = currentPath.split('/').filter(p => p);
    return '/' + pathParts.slice(0, index + 1).join('/');
};

/**
 * Navigate to parent directory
 * @param currentPath - Current directory path
 * @returns Parent directory path
 */
export const navigateToParent = (currentPath: string): string => {
    const pathParts = currentPath.split('/').filter(p => p);

    if (pathParts.length <= 1) {
        return DEFAULT_PATH;
    }

    pathParts.pop();
    return '/' + pathParts.join('/');
};

/**
 * Navigate into a folder
 * @param currentPath - Current directory path
 * @param folderName - Name of folder to enter
 * @returns New path
 */
export const navigateToFolder = (currentPath: string, folderName: string): string => {
    if (currentPath === '/') {
        return `/${folderName}`;
    }
    return `${currentPath}/${folderName}`;
};

/**
 * Build full file path
 * @param currentPath - Current directory path
 * @param fileName - Name of the file
 * @returns Full file path
 */
export const buildFilePath = (currentPath: string, fileName: string): string => {
    return `${currentPath}/${fileName}`.replace(/\/+/g, '/');
};

/**
 * Normalize path (remove duplicate slashes)
 * @param path - Path to normalize
 * @returns Normalized path
 */
export const normalizePath = (path: string): string => {
    return path.replace(/\/+/g, '/');
};
