import React, { useState, useCallback } from 'react';

interface UseDragDropUploadProps {
    currentPath: string;
    onUploadComplete: () => void;
    uploadFile: (file: File, path: string) => Promise<any>;
}

interface UseDragDropUploadReturn {
    isDragging: boolean;
    uploading: boolean;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => Promise<void>;
}

/**
 * Custom hook untuk menangani drag & drop file upload
 * Handles visual feedback (isDragging) dan upload process
 * Supports folder uploads via webkitGetAsEntry API
 */
export const useDragDropUpload = ({
    currentPath,
    onUploadComplete,
    uploadFile
}: UseDragDropUploadProps): UseDragDropUploadReturn => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set false if leaving the main container
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        try {
            setUploading(true);

            // Collect all files (including from folders)
            const allFiles: File[] = [];

            // Use DataTransferItemList for folder support
            if (e.dataTransfer.items) {
                const items = Array.from(e.dataTransfer.items);

                for (const item of items) {
                    if ((item as DataTransferItem).kind === 'file') {
                        const entry = (item as any).webkitGetAsEntry?.();
                        if (entry) {
                            await traverseFileTree(entry, allFiles);
                        }
                    }
                }
            } else {
                // Fallback to files (no folder support)
                const files = Array.from(e.dataTransfer.files) as File[];
                allFiles.push(...files);
            }

            if (allFiles.length === 0) {
                setUploading(false);
                return;
            }

            console.log(`Drag & drop: Uploading ${allFiles.length} file(s)`);

            for (const file of allFiles) {
                await uploadFile(file, currentPath);
            }

            onUploadComplete();
            alert(`Successfully uploaded ${allFiles.length} file(s)!`);
        } catch (err) {
            console.error('Drag & drop upload error:', err);
            alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setUploading(false);
        }
    }, [currentPath, uploadFile, onUploadComplete]);

    return {
        isDragging,
        uploading,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDrop
    };
};

/**
 * Helper function to recursively traverse file tree for folder uploads
 * Uses FileSystem API (webkitGetAsEntry) to read folder contents
 */
async function traverseFileTree(entry: any, files: File[]): Promise<void> {
    if (entry.isFile) {
        return new Promise((resolve, reject) => {
            entry.file(
                (file: File) => {
                    files.push(file);
                    resolve();
                },
                (error: Error) => {
                    console.error('Error reading file:', error);
                    reject(error);
                }
            );
        });
    } else if (entry.isDirectory) {
        const dirReader = entry.createReader();
        return new Promise((resolve, reject) => {
            dirReader.readEntries(
                async (entries: any[]) => {
                    for (const childEntry of entries) {
                        await traverseFileTree(childEntry, files);
                    }
                    resolve();
                },
                (error: Error) => {
                    console.error('Error reading directory:', error);
                    reject(error);
                }
            );
        });
    }
}
