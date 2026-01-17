import { getToken } from './authApi';
import { getApiUrl } from './api';

interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    size: string;
    modified: string;
    permissions: string;
}

interface FileStats {
    totalFiles: number;
    totalFolders: number;
    storageUsed: string;
    storageQuota: string;
}

interface ListFilesResponse {
    files: FileItem[];
    stats: FileStats;
    currentPath: string;
}

/**
 * List files in directory
 */
export const listFiles = async (path: string = '/public_html'): Promise<ListFilesResponse> => {
    const token = getToken();

    const response = await fetch(getApiUrl(`/files/list?path=${encodeURIComponent(path)}`), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to list files');
    }

    return response.json();
};

/**
 * Upload file
 */
export const uploadFile = async (file: File, path: string = '/public_html'): Promise<void> => {
    const token = getToken();

    console.log('Upload Debug:', {
        fileName: file.name,
        fileSize: file.size,
        path,
        hasToken: !!token
    });

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    try {
        const response = await fetch(getApiUrl('/files/upload'), {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        console.log('Upload Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            console.error('Upload Error Response:', error);
            throw new Error(error.message || 'Failed to upload file');
        }

        const result = await response.json();
        console.log('Upload Success:', result);
        return result;
    } catch (error) {
        console.error('Upload Exception:', error);
        throw error;
    }
};

/**
 * Download file
 */
export const downloadFile = async (filePath: string): Promise<Blob> => {
    const token = getToken();

    const response = await fetch(getApiUrl(`/files/download?path=${encodeURIComponent(filePath)}`), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to download file');
    }

    return response.blob();
};

/**
 * Delete file or folder
 */
export const deleteFile = async (filePath: string): Promise<void> => {
    const token = getToken();

    const response = await fetch(getApiUrl('/files/delete'), {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete file');
    }

    return response.json();
};

/**
 * Create folder
 */
export const createFolder = async (folderName: string, path: string = '/public_html'): Promise<void> => {
    const token = getToken();

    const response = await fetch(getApiUrl('/files/folder'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: folderName, path }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create folder');
    }

    return response.json();
};

/**
 * Read file content
 */
export const readFileContent = async (filePath: string): Promise<string> => {
    const token = getToken();

    const response = await fetch(getApiUrl(`/files/read?path=${encodeURIComponent(filePath)}`), {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to read file');
    }

    const data = await response.json();
    return data.content;
};

/**
 * Update file content
 */
export const updateFileContent = async (filePath: string, content: string): Promise<void> => {
    const token = getToken();

    const response = await fetch(getApiUrl('/files/update'), {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: filePath, content }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update file');
    }

    return response.json();
};

/**
 * Extract ZIP file
 */
export const extractZipFile = async (zipPath: string, deleteAfter: boolean = true): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(getApiUrl('/files/extract'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zipPath, deleteAfter }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to extract ZIP' }));
        throw new Error(error.message || 'Failed to extract ZIP');
    }

    return response.json();
};

/**
 * Git Clone Repository
 */
export const gitClone = async (repoUrl: string, targetPath: string): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(getApiUrl('/files/git-clone'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl, targetPath }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to clone repository' }));
        throw new Error(error.message || 'Failed to clone repository');
    }

    return response.json();
};

/**
 * Rename file or folder
 */
export const renameFile = async (oldPath: string, newName: string): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(getApiUrl('/files/rename'), {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPath, newName }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to rename' }));
        throw new Error(error.message || 'Failed to rename');
    }

    return response.json();
};

/**
 * Copy files or folders
 */
export const copyFiles = async (sourcePaths: string[], targetPath: string): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(getApiUrl('/files/copy'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourcePaths, targetPath }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to copy files' }));
        throw new Error(error.message || 'Failed to copy files');
    }

    return response.json();
};

/**
 * Move files or folders
 */
export const moveFiles = async (sourcePaths: string[], targetPath: string): Promise<any> => {
    const token = getToken();

    if (!token) {
        throw new Error('Not authenticated. Please login first.');
    }

    const response = await fetch(getApiUrl('/files/move'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourcePaths, targetPath }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to move files' }));
        throw new Error(error.message || 'Failed to move files');
    }

    return response.json();
};

export const changePermissions = async (path: string, mode: string) => {
    const token = getToken();
    const response = await fetch(getApiUrl('/files/permissions'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path, mode }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change permissions');
    }

    return response.json();
};

export const compressFiles = async (paths: string[], archiveName: string) => {
    const token = getToken();
    const response = await fetch(getApiUrl('/files/compress'), {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths, archiveName }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to compress files');
    }

    return response.json();
};
