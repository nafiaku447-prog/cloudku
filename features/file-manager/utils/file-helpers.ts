/**
 * File Helper Utilities
 * Pure functions for file operations and icon retrieval
 */

import { FILE_ICON_MAP, FOLDER_ICON, DEFAULT_FILE_ICON, FileIconConfig } from '../constants/file-icons';
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS, EDITABLE_EXTENSIONS } from '../constants/file-types';

/**
 * Get file icon configuration based on file name and type
 * @param fileName - Name of the file
 * @param type - Type of the file ('file' or 'folder')
 * @returns FileIconConfig object with icon class and colors
 */
export const getFileIcon = (fileName: string, type: string): FileIconConfig => {
    if (type === 'folder') {
        return FOLDER_ICON;
    }

    const ext = getFileExtension(fileName);
    return FILE_ICON_MAP[ext] || DEFAULT_FILE_ICON;
};

/**
 * Extract file extension from filename
 * @param fileName - Name of the file
 * @returns File extension in lowercase
 */
export const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if file is an image
 * @param fileName - Name of the file
 * @returns true if file is an image
 */
export const isImageFile = (fileName: string): boolean => {
    const ext = getFileExtension(fileName);
    return IMAGE_EXTENSIONS.includes(ext as any);
};

/**
 * Check if file is a video
 * @param fileName - Name of the file
 * @returns true if file is a video
 */
export const isVideoFile = (fileName: string): boolean => {
    const ext = getFileExtension(fileName);
    return VIDEO_EXTENSIONS.includes(ext as any);
};

/**
 * Check if file is editable (text-based)
 * @param fileName - Name of the file
 * @returns true if file can be edited
 */
export const isEditableFile = (fileName: string): boolean => {
    const ext = getFileExtension(fileName);
    return EDITABLE_EXTENSIONS.includes(ext as any);
};

/**
 * Check if file is a ZIP archive
 * @param fileName - Name of the file
 * @returns true if file is a ZIP archive
 */
export const isZipFile = (fileName: string): boolean => {
    return fileName.toLowerCase().endsWith('.zip');
};

/**
 * Format file size to human readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate file name
 * @param fileName - Name to validate
 * @returns Error message if invalid, null if valid
 */
export const validateFileName = (fileName: string): string | null => {
    if (!fileName.trim()) {
        return 'File name cannot be empty';
    }

    if (fileName.includes('/') || fileName.includes('\\')) {
        return 'File name cannot contain / or \\';
    }

    // Check for invalid characters
    const invalidChars = ['<', '>', ':', '"', '|', '?', '*'];
    for (const char of invalidChars) {
        if (fileName.includes(char)) {
            return `File name cannot contain ${char}`;
        }
    }

    return null;
};
