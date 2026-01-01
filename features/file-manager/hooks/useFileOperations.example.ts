/**
 * Custom Hook Example: useFileOperations
 * 
 * Hook ini adalah contoh untuk future enhancement.
 * Bisa digunakan untuk encapsulate file operations logic.
 */

import { useState } from 'react';
import { uploadFile, downloadFile, deleteFile } from '../../../utils/fileApi';

interface UseFileOperationsReturn {
    uploading: boolean;
    uploadFiles: (files: File[], path: string) => Promise<void>;
    downloadFile: (filePath: string, fileName: string) => Promise<void>;
    deleteFile: (filePath: string) => Promise<void>;
}

/**
 * Custom hook untuk file operations
 * Encapsulates common file operations dengan loading states
 */
export const useFileOperations = (): UseFileOperationsReturn => {
    const [uploading, setUploading] = useState(false);

    const uploadFiles = async (files: File[], path: string) => {
        setUploading(true);
        try {
            for (const file of files) {
                await uploadFile(file, path);
            }
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (filePath: string, fileName: string) => {
        const blob = await downloadFile(filePath);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    const handleDelete = async (filePath: string) => {
        await deleteFile(filePath);
    };

    return {
        uploading,
        uploadFiles,
        downloadFile: handleDownload,
        deleteFile: handleDelete
    };
};

/**
 * USAGE EXAMPLE:
 * 
 * const FileManager = () => {
 *   const { uploading, uploadFiles, downloadFile } = useFileOperations();
 * 
 *   const handleUpload = async (files: File[]) => {
 *     await uploadFiles(files, currentPath);
 *     await loadFiles();
 *   };
 * 
 *   return (
 *     <div>
 *       {uploading && <p>Uploading...</p>}
 *       <button onClick={() => handleUpload(selectedFiles)}>Upload</button>
 *     </div>
 *   );
 * };
 */
