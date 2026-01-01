/**
 * TypeScript Type Definitions for File Manager
 */

import { SortBy, SortOrder, ClipboardMode, ViewMode } from '../constants/default-config';

/**
 * File or folder object
 */
export interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    size: string;
    modified: string;
    permissions: string;
    fullPath?: string; // Used for clipboard operations
}

/**
 * File statistics
 */
export interface FileStats {
    totalFiles: number;
    totalFolders: number;
    storageUsed: string;
    storageQuota: string;
}

/**
 * Context menu state
 */
export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    file: FileItem | null;
}

/**
 * Clipboard state
 */
export interface ClipboardState {
    files: FileItem[];
    mode: ClipboardMode;
}

/**
 * Media preview state
 */
export interface MediaPreviewState {
    url: string;
    name: string;
    type: 'image' | 'video';
    index: number;
}

/**
 * Upload progress state
 */
export interface UploadProgressState {
    fileName: string;
    progress: number;
}

/**
 * Editing file state
 */
export interface EditingFileState {
    name: string;
    path: string;
    content: string;
}

// Export types from constants
export type { SortBy, SortOrder, ClipboardMode, ViewMode };
