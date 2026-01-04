import React, { useState } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import { listFiles, uploadFile, downloadFile, deleteFile, createFolder, extractZipFile, renameFile, copyFiles, moveFiles, gitClone, changePermissions, compressFiles } from '../utils/fileApi';
import { readFileContent, updateFileContent } from '../utils/fileApi';
import toast, { Toaster } from 'react-hot-toast';
import UploadProgressBar from '../components/UploadProgressBar';
import ConfirmationModal from '../components/ConfirmationModal';
import InputModal from '../components/InputModal';
import ExtractModal from '../components/ExtractModal';
import PermissionsModal from '../components/PermissionsModal';
import CompressModal from '../components/CompressModal';
import { isImageFile, isVideoFile, validateFileName } from '../features/file-manager/utils/file-helpers';
import { buildMediaList, findMediaIndex } from '../features/file-manager/utils/media-helpers';
import { buildBreadcrumbs, navigateToBreadcrumb, navigateToParent, navigateToFolder, buildFilePath } from '../features/file-manager/utils/path-helpers';
import { DEFAULT_PATH, DEFAULT_STATS } from '../features/file-manager/constants/default-config';
import type { SortBy, SortOrder, ViewMode } from '../features/file-manager/types';
import FileManagerHeader from '../components/file-manager/FileManagerHeader';
import FileManagerStats from '../components/file-manager/FileManagerStats';
import FileManagerToolbar from '../components/file-manager/FileManagerToolbar';
import FileListView from '../components/file-manager/FileListView';
import FileGridView from '../components/file-manager/FileGridView';
import DragDropOverlay from '../components/file-manager/DragDropOverlay';
import ContextMenu from '../components/file-manager/ContextMenu';
import QuickActions from '../components/file-manager/QuickActions';
import FileManagerModals from '../components/file-manager/FileManagerModals';
import EmptyState from '../components/file-manager/EmptyState';
import { useKeyboardShortcuts } from '../features/file-manager/hooks/useKeyboardShortcuts';
import { useDragDropUpload } from '../features/file-manager/hooks/useDragDropUpload';


const FileManagerPage: React.FC = () => {
    const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
    const [files, setFiles] = useState<any[]>([]);
    const [stats, setStats] = useState(DEFAULT_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingFile, setEditingFile] = useState<{ name: string, path: string, content: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [uploading, setUploading] = useState(false);  // For manual uploads (not drag-drop)
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<{ url: string, name: string, type: 'image' | 'video', index: number } | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    // Context Menu States
    const [contextMenu, setContextMenu] = useState<{ visible: boolean, x: number, y: number, file: any | null }>({
        visible: false,
        x: 0,
        y: 0,
        file: null
    });

    // Clipboard States for Copy/Cut/Paste
    const [clipboard, setClipboard] = useState<{ files: any[], mode: 'copy' | 'cut' | null }>({
        files: [],
        mode: null
    });

    // Advanced Filter States
    const [filterType, setFilterType] = useState<string>('all');
    const [filterSize, setFilterSize] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [showFilterPanel, setShowFilterPanel] = useState(false);



    // Upload Progress State
    const [uploadProgress, setUploadProgress] = useState<{ fileName: string, progress: number } | null>(null);

    // Don't Show Again Preference (persisted in localStorage)
    const [dontShowDeleteConfirm, setDontShowDeleteConfirm] = useState(() => {
        return localStorage.getItem('dontShowDeleteConfirm') === 'true';
    });

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type?: 'info' | 'warning' | 'danger' | 'success';
        onConfirm: () => void;
    }>({
        show: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Input Modal State
    const [inputModal, setInputModal] = useState<{
        show: boolean;
        title: string;
        placeholder?: string;
        defaultValue?: string;
        confirmText?: string;
        icon?: React.ReactNode;
        onConfirm: (value: string) => void;
    }>({
        show: false,
        title: '',
        onConfirm: () => { }
    });

    const [extractModal, setExtractModal] = useState<{
        show: boolean;
        fileName: string;
        filePath: string;
    }>({
        show: false,
        fileName: '',
        filePath: ''
    });

    const [permissionsModal, setPermissionsModal] = useState<{
        show: boolean;
        fileName: string;
        currentMode: string;
        path: string;
    }>({
        show: false,
        fileName: '',
        currentMode: '644',
        path: ''
    });

    const [compressModal, setCompressModal] = useState<{
        show: boolean;
        paths: string[];
        defaultName: string;
    }>({
        show: false,
        paths: [],
        defaultName: `archive_${new Date().toISOString().split('T')[0]}`
    });

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const folderInputRef = React.useRef<HTMLInputElement>(null);
    const fileContainerRef = React.useRef<HTMLDivElement>(null);

    // Fetch files on mount and when path changes
    React.useEffect(() => {
        loadFiles();
        setSelectedFiles([]); // Clear selection saat pindah folder
    }, [currentPath]);

    const loadFiles = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await listFiles(currentPath);
            setFiles(data.files);
            setStats(data.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load files');
            console.error('Load files error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (file: any) => {
        try {
            setLoading(true);
            const filePath = buildFilePath(currentPath, file.name);
            const content = await readFileContent(filePath);
            setEditingFile({
                name: file.name,
                path: filePath,
                content: content
            });
            setEditorOpen(true);
        } catch (err) {
            console.error('Edit error:', err);
            toast.error('Failed to read file: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []) as File[];
        console.log('File Select Event:', {
            filesCount: selectedFiles?.length,
            files: selectedFiles ? selectedFiles.map(f => ({ name: f.name, size: f.size })) : null
        });

        if (selectedFiles.length === 0) return;

        try {
            setUploading(true);
            setError('');
            console.log('Starting upload for', selectedFiles.length, 'files to path:', currentPath);

            const toastId = toast.loading(`Uploading ${selectedFiles.length} file(s)...`);

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                console.log(`Uploading file ${i + 1}/${selectedFiles.length}:`, file.name);

                // Update progress
                const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
                setUploadProgress({ fileName: file.name, progress });

                await uploadFile(file, currentPath);
            }

            // Reload files after upload
            console.log('Upload complete, reloading files...');
            await loadFiles();

            toast.success(`${selectedFiles.length} file(s) uploaded successfully!`, { id: toastId });
            setTimeout(() => setUploadProgress(null), 1000);
        } catch (err) {
            console.error('Upload Error in handleFileSelect:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
            toast.error('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setUploadProgress(null);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            console.log('Upload process finished');
        }
    };

    const handleFolderUploadClick = () => {
        folderInputRef.current?.click();
    };

    const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []) as File[];
        console.log('Folder Select Event:', {
            filesCount: selectedFiles?.length,
            files: selectedFiles ? selectedFiles.map((f: File) => ({
                name: f.name,
                path: (f as any).webkitRelativePath || f.name
            })) : null
        });

        if (!selectedFiles || selectedFiles.length === 0) {
            console.log('No files in folder, aborting');
            return;
        }

        // Upload directly after browser dialog
        try {
            setUploading(true);
            setError('');
            console.log('Starting folder upload for', selectedFiles.length, 'files');

            const toastId = toast.loading(`Uploading ${selectedFiles.length} file(s) from folder...`);

            // Group files by directory structure
            const filesByPath = new Map<string, File[]>();

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const relativePath = (file as any).webkitRelativePath || file.name;
                const pathParts = relativePath.split('/');
                const folderPath = pathParts.slice(0, -1).join('/');
                const targetPath = folderPath ? `${currentPath}/${folderPath}` : currentPath;

                if (!filesByPath.has(targetPath)) {
                    filesByPath.set(targetPath, []);
                }
                filesByPath.get(targetPath)!.push(file);
            }

            // Upload files
            let uploadedCount = 0;
            for (const [path, files] of filesByPath.entries()) {
                console.log(`Uploading ${files.length} files to path: ${path}`);
                for (const file of files) {
                    const progress = Math.round(((uploadedCount + 1) / selectedFiles.length) * 100);
                    setUploadProgress({ fileName: file.name, progress });
                    await uploadFile(file, path);
                    uploadedCount++;
                }
            }

            await loadFiles();
            toast.success(`Folder uploaded successfully! ${uploadedCount} file(s) uploaded. 📁`, { id: toastId });
            setTimeout(() => setUploadProgress(null), 1000);
        } catch (err) {
            console.error('Folder upload error:', err);
            setError(err instanceof Error ? err.message : 'Folder upload failed');
            toast.error('Folder upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setUploadProgress(null);
        } finally {
            setUploading(false);
            if (folderInputRef.current) {
                folderInputRef.current.value = '';
            }
            console.log('Folder upload process finished');
        }
    };

    const handleDownload = async (file: any) => {
        try {
            const filePath = buildFilePath(currentPath, file.name);
            const blob = await downloadFile(filePath);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            toast.error('Download failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleDelete = async (file: any) => {
        // Helper function to perform delete
        const performDelete = async () => {
            try {
                const filePath = buildFilePath(currentPath, file.name);
                await deleteFile(filePath);
                await loadFiles();
                toast.success('Deleted successfully! 🗑️');
            } catch (err) {
                toast.error('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        };

        // If user chose "don't show again", delete directly
        if (dontShowDeleteConfirm) {
            await performDelete();
            return;
        }

        // Otherwise, show confirmation modal
        setConfirmModal({
            show: true,
            title: `Delete "${file.name}"?`,
            message: 'This action cannot be undone.',
            type: 'danger',
            onConfirm: performDelete
        });
    };

    const handlePermissions = (file: any) => {
        setPermissionsModal({
            show: true,
            fileName: file.name,
            currentMode: file.permissions || '644',
            path: buildFilePath(currentPath, file.name)
        });
    };

    const handleCompress = () => {
        const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
        if (selectedFileObjects.length === 0) {
            toast.error('Please select files to compress');
            return;
        }

        const paths = selectedFileObjects.map(f => buildFilePath(currentPath, f.name));
        setCompressModal({
            show: true,
            paths,
            defaultName: `archive_${new Date().toISOString().split('T')[0]}`
        });
    };

    const handleExtract = (file: any) => {
        setExtractModal({
            show: true,
            fileName: file.name,
            filePath: buildFilePath(currentPath, file.name)
        });
    };

    const handleRename = async (file: any) => {
        setInputModal({
            show: true,
            title: `Rename "${file.name}"`,
            placeholder: file.name,
            defaultValue: file.name,
            confirmText: 'Rename',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            onConfirm: async (newName) => {
                if (newName === file.name) {
                    setInputModal({ ...inputModal, show: false });
                    return;
                }

                // Gunakan validateFileName helper
                const validationError = validateFileName(newName);
                if (validationError) {
                    toast.error(validationError);
                    // Keep modal open on error? Or re-open?
                    // Usually we might want to keep it open, but for now let's simple re-set it or just close.
                    // If we want to keep it open with error, we need error state in InputModal. 
                    // Since InputModal doesn't have error state, let's close and show toast.
                    setInputModal({ ...inputModal, show: false });
                    return;
                }

                try {
                    const filePath = buildFilePath(currentPath, file.name);
                    await renameFile(filePath, newName);
                    await loadFiles();
                    toast.success(`Renamed successfully to "${newName}" ✏️`);
                } catch (err) {
                    console.error('Rename error:', err);
                    toast.error('Rename failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }

                setInputModal({ ...inputModal, show: false });
            }
        });
    };
    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;

        // Get selected file names
        const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
        const fileNames = selectedFileObjects.map(f => f.name).join('\n• ');

        // Show confirmation modal
        setConfirmModal({
            show: true,
            title: `Delete ${selectedFiles.length} selected file(s)?`,
            message: `${fileNames}\n\nThis action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    let successCount = 0;
                    let failCount = 0;

                    for (const file of selectedFileObjects) {
                        try {
                            const filePath = buildFilePath(currentPath, file.name);
                            await deleteFile(filePath);
                            successCount++;
                        } catch (err) {
                            console.error(`Failed to delete ${file.name}:`, err);
                            failCount++;
                        }
                    }

                    // Clear selection
                    setSelectedFiles([]);

                    // Reload files
                    await loadFiles();

                    // Show result
                    if (failCount === 0) {
                        toast.success(`Successfully deleted ${successCount} file(s)! 🗑️`);
                    } else {
                        toast.error(`Deleted ${successCount} file(s).\nFailed to delete ${failCount} file(s).`);
                    }
                } catch (err) {
                    console.error('Bulk delete error:', err);
                    toast.error('Bulk delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }
            }
        });
    };

    const handleCreateFolder = async () => {
        setInputModal({
            show: true,
            title: 'Enter folder name:',
            placeholder: 'my-folder',
            onConfirm: async (folderName) => {
                const validationError = validateFileName(folderName);
                if (validationError) {
                    toast.error(validationError);
                    setInputModal({ ...inputModal, show: false });
                    return;
                }

                try {
                    await createFolder(folderName, currentPath);
                    await loadFiles();
                    toast.success('Folder created successfully! 📁');
                } catch (err) {
                    toast.error('Create folder failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }

                setInputModal({ ...inputModal, show: false });
            }
        });
    };

    const handleGitClone = async () => {
        setInputModal({
            show: true,
            title: 'Enter Git Repository URL:',
            placeholder: 'https://github.com/username/repo.git',
            onConfirm: async (repoUrl) => {
                // Basic validation
                if (!repoUrl.trim()) return;

                const toastId = toast.loading(
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">Cloning Repository</span>
                        <span className="text-xs text-gray-300">Syncing files from remote...</span>
                    </div>,
                    {
                        style: {
                            background: '#1F2937', // Gray-800
                            color: '#F3F4F6', // Gray-100
                            border: '1px solid #374151', // Gray-700
                            borderRadius: '12px',
                            minWidth: '240px',
                        }
                    }
                );

                try {
                    await gitClone(repoUrl, currentPath);
                    await loadFiles();
                    toast.success(
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-sm">Clone Successful</span>
                            <span className="text-xs text-gray-300">Repository has been added</span>
                        </div>,
                        {
                            id: toastId,
                            style: {
                                background: '#1F2937',
                                color: '#F3F4F6',
                                border: '1px solid #374151',
                                borderRadius: '12px',
                            }
                        }
                    );
                } catch (err) {
                    toast.error(
                        <div className="flex flex-col gap-1">
                            <span className="font-semibold text-sm">Clone Failed</span>
                            <span className="text-xs text-gray-300">{err instanceof Error ? err.message : 'Unknown error'}</span>
                        </div>,
                        {
                            id: toastId,
                            style: {
                                background: '#1F2937',
                                color: '#F3F4F6',
                                border: '1px solid #374151',
                                borderRadius: '12px',
                            }
                        }
                    );
                }

                setInputModal({ ...inputModal, show: false });
            }
        });
    };

    const handleEditorSave = async (content: string) => {
        if (!editingFile) return;

        try {
            await updateFileContent(editingFile.path, content);

            // Update editingFile content to prevent unsaved changes warning
            setEditingFile({
                ...editingFile,
                content
            });
        } catch (err) {
            throw err; // Let CodeEditorModal handle the error
        }
    };

    const handleEditorClose = () => {
        setEditorOpen(false);
        setEditingFile(null);
    };

    // ========== CLIPBOARD OPERATIONS ==========
    const handleCopy = () => {
        const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id)).map(f => ({
            ...f,
            fullPath: buildFilePath(currentPath, f.name)
        }));
        setClipboard({
            files: selectedFileObjects,
            mode: 'copy'
        });
        setContextMenu({ ...contextMenu, visible: false });
        console.log('Files copied to clipboard:', selectedFileObjects.map(f => f.name));
        toast.success(`📋 ${selectedFileObjects.length} file(s) copied!`);
    };

    const handleCut = () => {
        const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id)).map(f => ({
            ...f,
            fullPath: buildFilePath(currentPath, f.name)
        }));

        // ✅ FIX: Actually set clipboard!
        setClipboard({
            files: selectedFileObjects,
            mode: 'cut'
        });

        setContextMenu({ ...contextMenu, visible: false });
        console.log('Files cut to clipboard:', selectedFileObjects.map(f => f.name));
        toast.success(`✂️ ${selectedFileObjects.length} file(s) cut!`);
    };

    const handlePaste = async () => {
        if (clipboard.files.length === 0 || !clipboard.mode) {
            toast.error('Clipboard is empty');
            return;
        }

        try {
            setLoading(true);
            const sourceFilePaths = clipboard.files.map(f => f.fullPath);

            console.log(`Pasting ${clipboard.files.length} files (${clipboard.mode} mode) to ${currentPath}`);

            if (clipboard.mode === 'copy') {
                await copyFiles(sourceFilePaths, currentPath);
            } else { // mode === 'cut'
                await moveFiles(sourceFilePaths, currentPath);
            }

            // Clear clipboard after paste (for both copy and cut)
            setClipboard({ files: [], mode: null });
            setSelectedFiles([]);

            setContextMenu({ ...contextMenu, visible: false });
            await loadFiles();
            toast.success(`📁 Successfully ${clipboard.mode === 'copy' ? 'copied' : 'moved'} ${clipboard.files.length} file(s)!`);
        } catch (err) {
            console.error('Paste error:', err);
            toast.error(`❌ Failed to paste: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // ========== CONTEXT MENU HANDLERS ==========
    const handleContextMenu = (e: React.MouseEvent, file: any | null) => {
        e.preventDefault();
        e.stopPropagation();

        // Select the file if not already selected (only if file is not null)
        if (file && !selectedFiles.includes(file.id)) {
            setSelectedFiles([file.id]);
        }

        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            file: file
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ ...contextMenu, visible: false });
    };

    const handleFolderClick = (folderName: string) => {
        const newPath = navigateToFolder(currentPath, folderName);
        setCurrentPath(newPath);
    };

    const handleBreadcrumbClick = (index: number) => {
        const newPath = navigateToBreadcrumb(index, currentPath);
        setCurrentPath(newPath);
    };

    const handleBackClick = () => {
        const newPath = navigateToParent(currentPath);
        setCurrentPath(newPath);
    };

    // Build breadcrumb from current path
    const breadcrumbs = React.useMemo(() => buildBreadcrumbs(currentPath), [currentPath]);

    const handleRowClick = (fileId: number, e: React.MouseEvent) => {
        // Toggle selection saat click row (tapi bukan double click)
        setSelectedFiles(prev => {
            if (prev.includes(fileId)) {
                return prev.filter(id => id !== fileId);
            } else {
                return [...prev, fileId];
            }
        });

        // Focus container for keyboard shortcuts (without scrolling!)
        setTimeout(() => {
            fileContainerRef.current?.focus({ preventScroll: true });
        }, 0);
    };

    const handleCheckboxChange = (fileId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        setSelectedFiles(prev => {
            if (e.target.checked) {
                return [...prev, fileId];
            } else {
                return prev.filter(id => id !== fileId);
            }
        });

        // Focus container for keyboard shortcuts (without scrolling!)
        setTimeout(() => {
            e.target.blur(); // Blur checkbox first
            fileContainerRef.current?.focus({ preventScroll: true });
        }, 0);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            // Select all visible files
            const allFileIds = filteredFiles.map(f => f.id);
            setSelectedFiles(allFileIds);
        } else {
            // Deselect all
            setSelectedFiles([]);
        }

        // Focus container for keyboard shortcuts (without scrolling!)
        setTimeout(() => {
            e.target.blur(); // Blur checkbox first
            fileContainerRef.current?.focus({ preventScroll: true });
        }, 0);
    };


    // Filter and sort files
    const filteredFiles = React.useMemo(() => {
        let result = files;

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(file =>
                file.name.toLowerCase().includes(query)
            );
        }

        // Apply type filter
        if (filterType !== 'all') {
            result = result.filter(file => {
                if (filterType === 'folder') return file.type === 'folder';
                if (file.type === 'folder') return false;

                const ext = file.name.split('.').pop()?.toLowerCase() || '';

                switch (filterType) {
                    case 'image':
                        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext);
                    case 'video':
                        return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext);
                    case 'document':
                        return ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext);
                    case 'code':
                        return ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'php', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(ext);
                    case 'archive':
                        return ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext);
                    default:
                        return true;
                }
            });
        }

        // Apply size filter
        if (filterSize !== 'all') {
            result = result.filter(file => {
                if (file.type === 'folder' || file.size === '-') return filterSize === 'tiny';

                const sizeStr = file.size.toLowerCase();
                const sizeValue = parseFloat(sizeStr);
                const unit = sizeStr.replace(/[0-9.]/g, '').trim();

                let sizeInKB = 0;
                if (unit.startsWith('kb')) sizeInKB = sizeValue;
                else if (unit.startsWith('mb')) sizeInKB = sizeValue * 1024;
                else if (unit.startsWith('gb')) sizeInKB = sizeValue * 1024 * 1024;
                else if (unit.startsWith('b')) sizeInKB = sizeValue / 1024;

                switch (filterSize) {
                    case 'tiny': return sizeInKB < 100;
                    case 'small': return sizeInKB >= 100 && sizeInKB < 1024;
                    case 'medium': return sizeInKB >= 1024 && sizeInKB < 10240;
                    case 'large': return sizeInKB >= 10240 && sizeInKB < 102400;
                    case 'huge': return sizeInKB >= 102400;
                    default: return true;
                }
            });
        }

        // Apply date filter
        if (filterDate !== 'all') {
            result = result.filter(file => {
                const modified = file.modified.toLowerCase();

                if (filterDate === 'today') {
                    return modified.includes('hour') || modified.includes('minute') || modified === 'just now';
                } else if (filterDate === 'week') {
                    return modified.includes('day') && !modified.includes('week') || modified.includes('hour') || modified === 'just now';
                } else if (filterDate === 'month') {
                    const match = modified.match(/(\d+)\s+(week|day|hour)/);
                    if (!match) return modified === 'just now';
                    const [, num, unit] = match;
                    const days = unit === 'week' ? parseInt(num) * 7 : unit === 'day' ? parseInt(num) : 0;
                    return days <= 30;
                } else if (filterDate === 'year') {
                    return !modified.includes('year');
                }
                return true;
            });
        }

        // Apply sorting
        result = [...result].sort((a, b) => {
            // Always put folders first
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;

            let comparison = 0;

            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'size':
                    const sizeA = a.size === '-' ? 0 : parseFloat(a.size);
                    const sizeB = b.size === '-' ? 0 : parseFloat(b.size);
                    comparison = sizeA - sizeB;
                    break;
                case 'modified':
                    comparison = a.modified.localeCompare(b.modified);
                    break;
                case 'type':
                    const extA = a.name.split('.').pop() || '';
                    const extB = b.name.split('.').pop() || '';
                    comparison = extA.localeCompare(extB);
                    break;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [files, searchQuery, sortBy, sortOrder, filterType, filterSize, filterDate]);

    const handleSort = (column: 'name' | 'size' | 'modified' | 'type') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    // ========== KEYBOARD SHORTCUTS ==========
    useKeyboardShortcuts({
        editorOpen,
        selectedFiles,
        filteredFiles,
        files,
        clipboard,
        onSelectAll: (fileIds) => setSelectedFiles(fileIds),
        onDelete: handleBulkDelete,
        onRename: handleRename,
        onCopy: handleCopy,
        onCut: handleCut,
        onPaste: handlePaste,
        onClearSelection: () => setSelectedFiles([]),
        onCloseContextMenu: closeContextMenu
    });

    // Drag and Drop handlers
    const { isDragging, uploading: dragUploading, handleDragEnter, handleDragLeave, handleDragOver, handleDrop } = useDragDropUpload({
        currentPath,
        onUploadComplete: loadFiles,
        uploadFile
    });

    // Media Preview handlers (Images & Videos)


    const getMediaList = () => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        return buildMediaList(filteredFiles, currentPath, apiUrl);
    };

    const handleMediaClick = (file: any) => {
        if (!isImageFile(file.name) && !isVideoFile(file.name)) return;

        const mediaList = getMediaList();
        const index = findMediaIndex(mediaList, file.name);

        console.log('=== MEDIA CLICK DEBUG ===');
        console.log('File:', file.name);
        console.log('Current Path:', currentPath);
        console.log('Media List:', mediaList);
        console.log('Index:', index);
        if (index !== -1) {
            console.log('Selected Media:', mediaList[index]);
        }

        if (index !== -1) {
            setPreviewMedia({
                url: mediaList[index].url,
                name: file.name,
                type: mediaList[index].type,
                index
            });
            setPreviewOpen(true);
        }
    };

    const handleMediaNavigate = (direction: 'prev' | 'next') => {
        if (!previewMedia) return;

        const mediaList = getMediaList();
        const newIndex = direction === 'prev'
            ? Math.max(0, previewMedia.index - 1)
            : Math.min(mediaList.length - 1, previewMedia.index + 1);

        if (newIndex !== previewMedia.index) {
            setPreviewMedia({
                url: mediaList[newIndex].url,
                name: mediaList[newIndex].name,
                type: mediaList[newIndex].type,
                index: newIndex
            });
        }
    };

    return (
        <ProtectedDashboard>
            {/* Toast Notifications - Must be at top level */}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                        borderRadius: '12px',
                        padding: '16px',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 5000,
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                    loading: {
                        iconTheme: {
                            primary: '#3B82F6',
                            secondary: '#fff',
                        },
                    },
                }}
            />

            <div className="space-y-6">
                {/* Header */}
                <FileManagerHeader
                    uploading={uploading}
                    selectedFilesCount={selectedFiles.length}
                    fileInputRef={fileInputRef}
                    folderInputRef={folderInputRef}
                    onFileSelect={handleFileSelect}
                    onFolderSelect={handleFolderSelect}
                    onUploadClick={handleUploadClick}
                    onFolderUploadClick={handleFolderUploadClick}
                    onCreateFolder={handleCreateFolder}
                    onGitClone={handleGitClone}
                    onBulkDelete={handleBulkDelete}
                />

                {/* Stats */}
                <FileManagerStats stats={stats} />

                {/* File Browser */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Breadcrumb & Toolbar */}
                    <FileManagerToolbar
                        currentPath={currentPath}
                        breadcrumbs={breadcrumbs}
                        clipboard={clipboard}
                        viewMode={viewMode}
                        searchQuery={searchQuery}
                        filterType={filterType}
                        filterSize={filterSize}
                        filterDate={filterDate}
                        showFilterPanel={showFilterPanel}
                        onBack={handleBackClick}
                        onBreadcrumbClick={handleBreadcrumbClick}
                        onClearClipboard={() => setClipboard({ files: [], mode: null })}
                        onViewModeChange={setViewMode}
                        onSearchChange={setSearchQuery}
                        onFilterTypeChange={setFilterType}
                        onFilterSizeChange={setFilterSize}
                        onFilterDateChange={setFilterDate}
                        onClearFilters={() => {
                            setFilterType('all');
                            setFilterSize('all');
                            setFilterDate('all');
                        }}
                        onToggleFilterPanel={() => setShowFilterPanel(!showFilterPanel)}
                    />

                    {/* Files List */}
                    <div
                        ref={fileContainerRef}
                        tabIndex={0}
                        className="overflow-x-auto relative min-h-[400px] outline-none"
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onContextMenu={(e) => handleContextMenu(e, null)}
                    >
                        {/* Drag & Drop Overlay */}
                        <DragDropOverlay isDragging={isDragging} />

                        {/* Empty State - Show when no files */}
                        {filteredFiles.length === 0 ? (
                            <EmptyState
                                onUploadClick={handleUploadClick}
                                onCreateFile={() => {
                                    setEditingFile({ id: 0, name: '', path: currentPath, content: '' });
                                    setEditorOpen(true);
                                }}
                                onCreateFolder={handleCreateFolder}
                            />
                        ) : (
                            <>
                                {/* List View */}
                                {viewMode === 'list' && (
                                    <FileListView
                                        files={filteredFiles}
                                        selectedFiles={selectedFiles}
                                        clipboard={clipboard}
                                        sortBy={sortBy}
                                        sortOrder={sortOrder}
                                        onSelectAll={handleSelectAll}
                                        onSort={handleSort}
                                        onRowClick={handleRowClick}
                                        onCheckboxChange={handleCheckboxChange}
                                        onContextMenu={handleContextMenu}
                                        onFolderDoubleClick={handleFolderClick}
                                        onDownload={handleDownload}
                                        onMediaClick={handleMediaClick}
                                        onEdit={handleEdit}
                                        onRename={handleRename}
                                        onExtract={handleExtract}
                                        onDelete={handleDelete}
                                    />
                                )}


                                {/* Grid View */}
                                {viewMode === 'grid' && (
                                    <FileGridView
                                        files={filteredFiles}
                                        selectedFiles={selectedFiles}
                                        clipboard={clipboard}
                                        onRowClick={handleRowClick}
                                        onCheckboxChange={handleCheckboxChange}
                                        onContextMenu={handleContextMenu}
                                        onFolderDoubleClick={handleFolderClick}
                                        onMediaDoubleClick={handleMediaClick}
                                        onMediaClick={handleMediaClick}
                                        onDownload={handleDownload}
                                        onRename={handleRename}
                                        onDelete={handleDelete}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <QuickActions
                        onUploadClick={handleUploadClick}
                        onCreateFile={() => {
                            setEditingFile({ id: 0, name: '', path: currentPath, content: '' });
                            setEditorOpen(true);
                        }}
                        onCreateFolder={handleCreateFolder}
                    />
                </div>
            </div>

            {/* Modals */}
            <FileManagerModals
                editingFile={editingFile}
                editorOpen={editorOpen}
                onEditorClose={handleEditorClose}
                onEditorSave={handleEditorSave}
                previewMedia={previewMedia}
                previewOpen={previewOpen}
                onPreviewClose={() => {
                    setPreviewOpen(false);
                    setPreviewMedia(null);
                }}
                mediaFiles={getMediaList()}
                onMediaNavigate={handleMediaNavigate}
            />
            {/* Context Menu */}
            <ContextMenu
                contextMenu={contextMenu}
                clipboard={clipboard}
                onClose={closeContextMenu}
                onDownload={handleDownload}
                onMediaClick={handleMediaClick}
                onEdit={handleEdit}
                onRename={handleRename}
                onExtract={handleExtract}
                onDelete={handleDelete}
                onCopy={handleCopy}
                onCut={handleCut}
                onPaste={handlePaste}
                onRefresh={() => {
                    loadFiles();
                    setContextMenu({ ...contextMenu, visible: false });
                }}
                onUpload={handleUploadClick}
                onPermissions={handlePermissions}
                onCompress={handleCompress}
            />


            {/* Upload Progress Bar */}
            {uploadProgress && (
                <UploadProgressBar
                    fileName={uploadProgress.fileName}
                    progress={uploadProgress.progress}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                show={confirmModal.show}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                confirmText={confirmModal.type === 'danger' ? 'Delete' : 'Confirm'}
                cancelText="Cancel"
                showDontShowAgain={confirmModal.type === 'danger'}
                onDontShowAgainChange={(checked) => {
                    localStorage.setItem('dontShowDeleteConfirm', checked.toString());
                    setDontShowDeleteConfirm(checked);
                }}
                onConfirm={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                }}
                onCancel={() => setConfirmModal({ ...confirmModal, show: false })}
                icon={
                    confirmModal.type === 'danger' ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )
                }
            />

            {/* Input Modal (for create folder, rename, etc) */}
            <InputModal
                show={inputModal.show}
                title={inputModal.title}
                placeholder={inputModal.placeholder}
                defaultValue={inputModal.defaultValue}
                confirmText={inputModal.confirmText}
                onConfirm={inputModal.onConfirm}
                onCancel={() => setInputModal({ ...inputModal, show: false })}
                icon={inputModal.icon || (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                )}
            />

            {/* Extract Modal */}
            <ExtractModal
                show={extractModal.show}
                fileName={extractModal.fileName}
                onConfirm={async (deleteAfter) => {
                    const toastId = toast.loading('Extracting archive... 📦');
                    try {
                        const result = await extractZipFile(extractModal.filePath, deleteAfter);
                        await loadFiles();
                        toast.success(`Extracted successfully! (${result.filesExtracted} files)`, { id: toastId });
                    } catch (err) {
                        toast.error('Extract failed: ' + (err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
                    }
                    setExtractModal({ ...extractModal, show: false });
                }}
                onCancel={() => setExtractModal({ ...extractModal, show: false })}
            />

            {/* Permissions Modal */}
            <PermissionsModal
                show={permissionsModal.show}
                fileName={permissionsModal.fileName}
                currentMode={permissionsModal.currentMode}
                onConfirm={async (mode) => {
                    const toastId = toast.loading('Changing permissions...');
                    try {
                        await changePermissions(permissionsModal.path, mode);
                        await loadFiles();
                        toast.success(`Permissions changed to ${mode} 🔒`, { id: toastId });
                        setPermissionsModal({ ...permissionsModal, show: false });
                    } catch (err) {
                        toast.error('Failed to change permissions: ' + (err instanceof Error ? err.message : 'Unknown error'), { id: toastId });
                    }
                }}
                onCancel={() => setPermissionsModal({ ...permissionsModal, show: false })}
            />

            {/* Compress Modal */}
            <CompressModal
                show={compressModal.show}
                fileCount={compressModal.paths.length}
                defaultName={compressModal.defaultName}
                onConfirm={async (archiveName) => {
                    const toastId = toast.loading('Creating ZIP archive...', { position: 'bottom-right' });
                    try {
                        await compressFiles(compressModal.paths, archiveName);
                        await loadFiles();
                        toast.success(`Archive created successfully! 📦`, { id: toastId, position: 'bottom-right' });
                        setCompressModal({ ...compressModal, show: false });
                    } catch (err) {
                        toast.error('Failed to compress: ' + (err instanceof Error ? err.message : 'Unknown error'), { id: toastId, position: 'bottom-right' });
                    }
                }}
                onCancel={() => setCompressModal({ ...compressModal, show: false })}
            />

        </ProtectedDashboard >
    );
};

export default FileManagerPage;