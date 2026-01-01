/**
 * Media Helper Utilities
 * Functions for handling images and videos
 */

import { isImageFile, isVideoFile } from './file-helpers';

export interface MediaFile {
    name: string;
    url: string;
    type: 'image' | 'video';
}

/**
 * Check if file is a media file (image or video)
 * @param fileName - Name of the file
 * @returns true if file is image or video
 */
export const isMediaFile = (fileName: string): boolean => {
    return isImageFile(fileName) || isVideoFile(fileName);
};

/**
 * Get media type from filename
 * @param fileName - Name of the file
 * @returns 'image' | 'video' | null
 */
export const getMediaType = (fileName: string): 'image' | 'video' | null => {
    if (isImageFile(fileName)) return 'image';
    if (isVideoFile(fileName)) return 'video';
    return null;
};

/**
 * Build media list from files
 * @param files - Array of files
 * @param currentPath - Current directory path
 * @param apiUrl - API base URL
 * @returns Array of MediaFile objects
 */
export const buildMediaList = (
    files: any[],
    currentPath: string,
    apiUrl: string
): MediaFile[] => {
    return files
        .filter(file => file.type === 'file' && isMediaFile(file.name))
        .map(file => {
            // Build proper file path - remove leading slash from currentPath if exists
            const cleanPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
            const filePath = `${cleanPath}/${file.name}`.replace(/\/+/g, '/');
            const mediaType = getMediaType(file.name);

            return {
                name: file.name,
                // Use proper path format for download endpoint
                url: `${apiUrl}/api/files/download?path=${encodeURIComponent(filePath)}`,
                type: mediaType as 'image' | 'video'
            };
        });
};

/**
 * Find media index in list by name
 * @param mediaList - List of media files
 * @param fileName - Name of the file to find
 * @returns Index of media file, -1 if not found
 */
export const findMediaIndex = (mediaList: MediaFile[], fileName: string): number => {
    return mediaList.findIndex(media => media.name === fileName);
};
