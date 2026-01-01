/**
 * Default Configuration for File Manager
 */

/**
 * Default path for file manager
 */
export const DEFAULT_PATH = '/public_html';

/**
 * Default stats
 */
export const DEFAULT_STATS = {
    totalFiles: 0,
    totalFolders: 0,
    storageUsed: '0 B',
    storageQuota: '10 GB'
};

/**
 * File manager view modes
 */
export type ViewMode = 'list' | 'grid';

/**
 * Sort options
 */
export type SortBy = 'name' | 'size' | 'modified' | 'type';
export type SortOrder = 'asc' | 'desc';

/**
 * Clipboard mode
 */
export type ClipboardMode = 'copy' | 'cut' | null;
