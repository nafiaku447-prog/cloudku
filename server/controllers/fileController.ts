import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { AuthRequest } from '../middleware/auth';
import AdmZip from 'adm-zip';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Base directory untuk user files (dalam production, setiap user punya folder sendiri)
const getUserFilesPath = (userId: string) => {
    const basePath = path.join(process.cwd(), 'user_files', userId);
    return basePath;
};

// Ensure user directory exists
const ensureUserDirectory = async (userId: string) => {
    const userPath = getUserFilesPath(userId);
    try {
        await fs.access(userPath);
    } catch {
        await fs.mkdir(userPath, { recursive: true });
        // Create default public_html folder
        await fs.mkdir(path.join(userPath, 'public_html'), { recursive: true });
    }
    return userPath;
};

// List files in directory
export const listFiles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const requestedPath = req.query.path as string || '/public_html';

        await ensureUserDirectory(userId);
        const fullPath = path.join(getUserFilesPath(userId), requestedPath);

        // Security check: prevent path traversal
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const items = await fs.readdir(fullPath, { withFileTypes: true });

        const files = await Promise.all(
            items.map(async (item, index) => {
                const itemPath = path.join(fullPath, item.name);
                const stats = await fs.stat(itemPath);

                return {
                    id: index + 1,
                    name: item.name,
                    type: item.isDirectory() ? 'folder' : 'file',
                    size: item.isDirectory() ? '-' : formatBytes(stats.size),
                    modified: formatDate(stats.mtime),
                    permissions: (stats.mode & 0o777).toString(8)
                };
            })
        );

        // Calculate stats
        const stats = await getDirectoryStats(getUserFilesPath(userId));

        res.json({
            files,
            stats: {
                totalFiles: stats.fileCount,
                totalFolders: stats.folderCount,
                storageUsed: formatBytes(stats.totalSize),
                storageQuota: '10 GB'
            },
            currentPath: requestedPath
        });
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ message: 'Failed to list files' });
    }
};

// Upload file
export const uploadFile = async (req: AuthRequest, res: Response) => {


    try {
        const userId = req.user?.id?.toString() || 'default';
        const targetPath = req.body.path || '/public_html';

        console.log('User ID:', userId);
        console.log('Target path:', targetPath);

        if (!req.file) {
            console.log('ERROR: No file in request');
            return res.status(400).json({ message: 'No file provided' });
        }

        console.log('File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            bufferLength: req.file.buffer?.length
        });

        await ensureUserDirectory(userId);
        console.log('User directory ensured');

        // Get directory path and ensure it exists
        const dirPath = path.join(getUserFilesPath(userId), targetPath);
        const fullPath = path.join(dirPath, req.file.originalname);

        console.log('Dir path:', dirPath);
        console.log('Full file path:', fullPath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            console.log('ERROR: Security check failed - path traversal attempt');
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create directory structure if it doesn't exist
        console.log('Creating directory:', dirPath);
        await fs.mkdir(dirPath, { recursive: true });
        console.log('Directory created/verified');

        // Write file
        console.log('Writing file to:', fullPath);
        await fs.writeFile(fullPath, req.file.buffer);
        console.log('File written successfully');

        const response = {
            message: 'File uploaded successfully',
            file: {
                name: req.file.originalname,
                size: formatBytes(req.file.size),
                path: fullPath
            }
        };

        console.log('=== UPLOAD SUCCESS ===');
        console.log('Response:', response);

        res.json(response);
    } catch (error) {
        console.error('=== UPLOAD ERROR ===');
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        console.error('Error message:', error instanceof Error ? error.message : String(error));
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        res.status(500).json({
            message: 'Failed to upload file',
            error: error instanceof Error ? error.message : 'Unknown error',
            errorType: error instanceof Error ? error.constructor.name : typeof error
        });
    }
};

// Download file
export const downloadFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const filePath = req.query.path as string;

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        const fullPath = path.join(getUserFilesPath(userId), filePath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const file = await fs.readFile(fullPath);
        const fileName = path.basename(fullPath);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(file);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Failed to download file' });
    }
};

// Delete file
export const deleteFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const filePath = req.body.path as string;

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        const fullPath = path.join(getUserFilesPath(userId), filePath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }

        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: 'Failed to delete file' });
    }
};

// Create folder
export const createFolder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { path: folderPath, name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Folder name required' });
        }

        const fullPath = path.join(getUserFilesPath(userId), folderPath || '/public_html', name);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await fs.mkdir(fullPath, { recursive: true });

        res.json({ message: 'Folder created successfully' });
    } catch (error) {
        console.error('Create folder error:', error);
        res.status(500).json({ message: 'Failed to create folder' });
    }
};

// Read file content (for editor)
export const readFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const filePath = req.query.path as string;

        if (!filePath) {
            return res.status(400).json({ message: 'File path required' });
        }

        const fullPath = path.join(getUserFilesPath(userId), filePath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const content = await fs.readFile(fullPath, 'utf-8');

        res.json({
            content,
            path: filePath
        });
    } catch (error) {
        console.error('Read file error:', error);
        res.status(500).json({ message: 'Failed to read file' });
    }
};

// Update file content (for editor)
export const updateFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { path: filePath, content } = req.body;

        if (!filePath || content === undefined) {
            return res.status(400).json({ message: 'File path and content required' });
        }

        const fullPath = path.join(getUserFilesPath(userId), filePath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await fs.writeFile(fullPath, content, 'utf-8');

        res.json({ message: 'File updated successfully' });
    } catch (error) {
        console.error('Update file error:', error);
        res.status(500).json({ message: 'Failed to update file' });
    }
};

// Rename file or folder
export const renameFile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { oldPath, newName } = req.body;

        if (!oldPath || !newName) {
            return res.status(400).json({ message: 'Old path and new name required' });
        }

        // Validate new name (no path traversal, no special chars)
        if (newName.includes('/') || newName.includes('\\') || newName.includes('..')) {
            return res.status(400).json({ message: 'Invalid file name' });
        }

        const fullOldPath = path.join(getUserFilesPath(userId), oldPath);
        const directory = path.dirname(fullOldPath);
        const fullNewPath = path.join(directory, newName);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullOldPath.startsWith(userBasePath) || !fullNewPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if old file exists
        try {
            await fs.access(fullOldPath);
        } catch {
            return res.status(404).json({ message: 'File not found' });
        }

        // Check if new name already exists
        try {
            await fs.access(fullNewPath);
            return res.status(409).json({ message: 'A file with this name already exists' });
        } catch {
            // Good, file doesn't exist
        }

        // Rename
        await fs.rename(fullOldPath, fullNewPath);

        res.json({ message: 'Renamed successfully', newPath: fullNewPath });
    } catch (error) {
        console.error('Rename error:', error);
        res.status(500).json({ message: 'Failed to rename file' });
    }
};

// Extract ZIP file
export const extractZip = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { zipPath, deleteAfter = true } = req.body;

        if (!zipPath) {
            return res.status(400).json({ message: 'ZIP file path required' });
        }

        const fullZipPath = path.join(getUserFilesPath(userId), zipPath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullZipPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if file is ZIP
        if (!zipPath.toLowerCase().endsWith('.zip')) {
            return res.status(400).json({ message: 'File is not a ZIP archive' });
        }

        // Get extraction directory (same folder as ZIP)
        const extractDir = path.dirname(fullZipPath);

        console.log('Extracting ZIP:', fullZipPath);
        console.log('Extract to:', extractDir);

        // Extract ZIP
        const zip = new AdmZip(fullZipPath);
        zip.extractAllTo(extractDir, true); // true = overwrite

        // Count extracted files
        const zipEntries = zip.getEntries();
        const fileCount = zipEntries.filter(entry => !entry.isDirectory).length;

        // Delete ZIP file if requested
        if (deleteAfter) {
            await fs.unlink(fullZipPath);
            console.log('Deleted ZIP file:', fullZipPath);
        }

        res.json({
            message: 'ZIP extracted successfully',
            filesExtracted: fileCount,
            zipDeleted: deleteAfter
        });
    } catch (error) {
        console.error('Extract ZIP error:', error);
        res.status(500).json({ message: 'Failed to extract ZIP', error: (error as Error).message });
    }
};

// Copy files or folders
export const copyFiles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { sourcePaths, targetPath } = req.body;

        if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
            return res.status(400).json({ message: 'Source paths required' });
        }

        if (!targetPath) {
            return res.status(400).json({ message: 'Target path required' });
        }

        const userBasePath = getUserFilesPath(userId);
        const fullTargetPath = path.join(userBasePath, targetPath);

        // Security check for target
        if (!fullTargetPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Ensure target directory exists
        await fs.mkdir(fullTargetPath, { recursive: true });

        let copiedCount = 0;
        const errors: string[] = [];

        for (const sourcePath of sourcePaths) {
            try {
                const fullSourcePath = path.join(userBasePath, sourcePath);

                // Security check for source
                if (!fullSourcePath.startsWith(userBasePath)) {
                    errors.push(`Access denied: ${sourcePath}`);
                    continue;
                }

                const fileName = path.basename(fullSourcePath);
                const fullDestPath = path.join(fullTargetPath, fileName);

                // Check if source exists
                try {
                    await fs.access(fullSourcePath);
                } catch {
                    errors.push(`Source not found: ${sourcePath}`);
                    continue;
                }

                // Copy file or directory
                const stats = await fs.stat(fullSourcePath);
                if (stats.isDirectory()) {
                    await copyDirectory(fullSourcePath, fullDestPath);
                } else {
                    await fs.copyFile(fullSourcePath, fullDestPath);
                }
                copiedCount++;
            } catch (err) {
                errors.push(`Failed to copy ${sourcePath}: ${(err as Error).message}`);
            }
        }

        res.json({
            message: `Copied ${copiedCount} of ${sourcePaths.length} item(s)`,
            copiedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Copy files error:', error);
        res.status(500).json({ message: 'Failed to copy files', error: (error as Error).message });
    }
};

// Move files or folders
export const moveFiles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { sourcePaths, targetPath } = req.body;

        if (!sourcePaths || !Array.isArray(sourcePaths) || sourcePaths.length === 0) {
            return res.status(400).json({ message: 'Source paths required' });
        }

        if (!targetPath) {
            return res.status(400).json({ message: 'Target path required' });
        }

        const userBasePath = getUserFilesPath(userId);
        const fullTargetPath = path.join(userBasePath, targetPath);

        // Security check for target
        if (!fullTargetPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Ensure target directory exists
        await fs.mkdir(fullTargetPath, { recursive: true });

        let movedCount = 0;
        const errors: string[] = [];

        for (const sourcePath of sourcePaths) {
            try {
                const fullSourcePath = path.join(userBasePath, sourcePath);

                // Security check for source
                if (!fullSourcePath.startsWith(userBasePath)) {
                    errors.push(`Access denied: ${sourcePath}`);
                    continue;
                }

                const fileName = path.basename(fullSourcePath);
                const fullDestPath = path.join(fullTargetPath, fileName);

                // Check if source exists
                try {
                    await fs.access(fullSourcePath);
                } catch {
                    errors.push(`Source not found: ${sourcePath}`);
                    continue;
                }

                // Move (rename) file or directory
                await fs.rename(fullSourcePath, fullDestPath);
                movedCount++;
            } catch (err) {
                errors.push(`Failed to move ${sourcePath}: ${(err as Error).message}`);
            }
        }

        res.json({
            message: `Moved ${movedCount} of ${sourcePaths.length} item(s)`,
            movedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Move files error:', error);
        res.status(500).json({ message: 'Failed to move files', error: (error as Error).message });
    }
};

// Helper: Copy directory recursively
const copyDirectory = async (source: string, destination: string): Promise<void> => {
    await fs.mkdir(destination, { recursive: true });
    const items = await fs.readdir(source, { withFileTypes: true });

    for (const item of items) {
        const srcPath = path.join(source, item.name);
        const destPath = path.join(destination, item.name);

        if (item.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
};

// Helper functions
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
};

const getDirectoryStats = async (dirPath: string): Promise<{ fileCount: number, folderCount: number, totalSize: number }> => {
    let fileCount = 0;
    let folderCount = 0;
    let totalSize = 0;

    const scan = async (currentPath: string) => {
        try {
            const items = await fs.readdir(currentPath, { withFileTypes: true });

            for (const item of items) {
                const itemPath = path.join(currentPath, item.name);

                if (item.isDirectory()) {
                    folderCount++;
                    await scan(itemPath);
                } else {
                    fileCount++;
                    const stats = await fs.stat(itemPath);
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            // Ignore errors (permission issues, etc)
        }
    };

    await scan(dirPath);

    return { fileCount, folderCount, totalSize };
};

// Git Clone
export const gitClone = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { repoUrl, targetPath = '/public_html' } = req.body;

        if (!repoUrl) {
            return res.status(400).json({ message: 'Repository URL is required' });
        }

        // Validate Git URL
        const gitUrlPattern = /^(https?:\/\/)?([\w\-]+@)?[\w\-]+(\.[\w\-]+)+(:\d+)?(\/[\w\-\.~%!$&'()*+,;=:@\/]*)?\.git$/i;
        const isValidGitUrl = gitUrlPattern.test(repoUrl) ||
            repoUrl.includes('github.com') ||
            repoUrl.includes('gitlab.com') ||
            repoUrl.includes('bitbucket.org');

        if (!isValidGitUrl) {
            return res.status(400).json({ message: 'Invalid Git repository URL' });
        }

        await ensureUserDirectory(userId);
        const fullPath = path.join(getUserFilesPath(userId), targetPath);

        // Security check
        const userBasePath = getUserFilesPath(userId);
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Ensure target directory exists
        await fs.mkdir(fullPath, { recursive: true });

        // Extract repo name from URL for folder name
        const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
        const clonePath = path.join(fullPath, repoName);

        // Check if folder already exists
        try {
            await fs.access(clonePath);
            return res.status(400).json({ message: `Folder "${repoName}" already exists` });
        } catch {
            // Folder doesn't exist, proceed
        }

        // Execute git clone
        console.log(`Cloning ${repoUrl} to ${clonePath}...`);

        const { stdout, stderr } = await execAsync(`git clone "${repoUrl}" "${clonePath}"`, {
            cwd: fullPath,
            timeout: 300000 // 5 minutes timeout
        });

        console.log('Git clone output:', stdout);
        if (stderr && !stderr.includes('Cloning into')) {
            console.error('Git clone stderr:', stderr);
        }

        res.json({
            message: 'Repository cloned successfully',
            repoName,
            path: path.join(targetPath, repoName)
        });
    } catch (error: any) {
        console.error('Git clone error:', error);

        let errorMessage = 'Failed to clone repository';
        if (error.message.includes('not found') || error.message.includes('404')) {
            errorMessage = 'Repository not found or is private';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Clone operation timed out';
        } else if (error.message.includes('git')) {
            errorMessage = 'Git is not installed on the server';
        }

        res.status(500).json({ message: errorMessage, error: error.message });
    }
};

// Change File Permissions
export const changePermissions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { path: filePath, mode } = req.body;

        if (!filePath || !mode) {
            return res.status(400).json({ message: 'Path and mode are required' });
        }

        const userBasePath = getUserFilesPath(userId);
        const fullPath = path.join(userBasePath, filePath);

        // Security check
        if (!fullPath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const modeNum = parseInt(mode, 8);
        if (isNaN(modeNum)) {
            return res.status(400).json({ message: 'Invalid mode format' });
        }

        await fs.chmod(fullPath, modeNum);

        res.json({ message: `Permissions changed to ${mode}` });
    } catch (error) {
        console.error('CHMOD error:', error);
        res.status(500).json({ message: 'Failed to change permissions', error: (error as Error).message });
    }
};

// Compress Files to ZIP
export const compressFiles = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id?.toString() || 'default';
        const { paths, archiveName } = req.body;

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return res.status(400).json({ message: 'Paths array is required' });
        }

        if (!archiveName || typeof archiveName !== 'string') {
            return res.status(400).json({ message: 'Archive name is required' });
        }

        const userBasePath = getUserFilesPath(userId);

        // Ensure archive name ends with .zip
        const finalArchiveName = archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`;
        const archivePath = path.join(userBasePath, finalArchiveName);

        // Security check for archive path
        if (!archivePath.startsWith(userBasePath)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const zip = new AdmZip();

        // Add each path to zip
        for (const filePath of paths) {
            const fullPath = path.join(userBasePath, filePath);

            // Security check
            if (!fullPath.startsWith(userBasePath)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const stats = await fs.stat(fullPath);

            if (stats.isDirectory()) {
                // Add folder recursively
                zip.addLocalFolder(fullPath, path.basename(fullPath));
            } else {
                // Add file
                zip.addLocalFile(fullPath);
            }
        }

        // Write ZIP file
        zip.writeZip(archivePath);

        res.json({
            message: `Successfully compressed ${paths.length} item(s) to ${finalArchiveName}`,
            archiveName: finalArchiveName
        });
    } catch (error) {
        console.error('Compress error:', error);
        res.status(500).json({
            message: 'Failed to compress files',
            error: (error as Error).message
        });
    }
};
