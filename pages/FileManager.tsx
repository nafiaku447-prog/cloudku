import React, { useState } from 'react';
import ProtectedDashboard from '../components/ProtectedDashboard';
import { listFiles, uploadFile, downloadFile, deleteFile, createFolder, extractZipFile, renameFile, copyFiles, moveFiles } from '../utils/fileApi';
import { readFileContent, updateFileContent } from '../utils/fileApi';
import CodeEditorModal from '../components/CodeEditorModal';
import MediaPreviewModal from '../components/MediaPreviewModal';
import toast, { Toaster } from 'react-hot-toast';
import AdvancedFilterPanel from '../components/AdvancedFilterPanel';
import UploadProgressBar from '../components/UploadProgressBar';
import { getFileIcon, isImageFile, isVideoFile, isEditableFile, isZipFile, validateFileName } from '../features/file-manager/utils/file-helpers';
import { buildMediaList, findMediaIndex } from '../features/file-manager/utils/media-helpers';
import { buildBreadcrumbs, navigateToBreadcrumb, navigateToParent, navigateToFolder, buildFilePath } from '../features/file-manager/utils/path-helpers';
import { DEFAULT_PATH, DEFAULT_STATS } from '../features/file-manager/constants/default-config';
import type { FileItem, FileStats, ContextMenuState, ClipboardState, MediaPreviewState, UploadProgressState, EditingFileState, SortBy, SortOrder, ViewMode } from '../features/file-manager/types';
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
            alert('Failed to read file: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
        const selectedFiles = e.target.files;
        console.log('Folder Select Event:', {
            filesCount: selectedFiles?.length,
            files: selectedFiles ? Array.from(selectedFiles).map((f: File) => ({
                name: f.name,
                path: (f as any).webkitRelativePath || f.name
            })) : null
        });

        if (!selectedFiles || selectedFiles.length === 0) {
            console.log('No files in folder, aborting');
            return;
        }

        try {
            setUploading(true);
            setError('');
            console.log('Starting folder upload for', selectedFiles.length, 'files');

            // Group files by directory structure
            const filesByPath = new Map<string, File[]>();

            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                // Get relative path from webkitRelativePath
                const relativePath = (file as any).webkitRelativePath || file.name;
                const pathParts = relativePath.split('/');

                // Skip root folder name, get subfolder path
                const folderPath = pathParts.slice(0, -1).join('/');
                const targetPath = folderPath ? `${currentPath}/${folderPath}` : currentPath;

                if (!filesByPath.has(targetPath)) {
                    filesByPath.set(targetPath, []);
                }
                filesByPath.get(targetPath)!.push(file);
            }

            // Upload files to their respective paths
            let uploadedCount = 0;
            for (const [path, files] of filesByPath.entries()) {
                console.log(`Uploading ${files.length} files to path: ${path}`);
                for (const file of files) {
                    await uploadFile(file, path);
                    uploadedCount++;
                }
            }

            // Reload files after upload
            console.log('Folder upload complete, reloading files...');
            await loadFiles();
            alert(`Folder uploaded successfully! ${uploadedCount} file(s) uploaded.`);
        } catch (err) {
            console.error('Folder upload error:', err);
            setError(err instanceof Error ? err.message : 'Folder upload failed');
            alert('Folder upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
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
            alert('Download failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleDelete = async (file: any) => {
        if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
            return;
        }

        try {
            const filePath = buildFilePath(currentPath, file.name);
            await deleteFile(filePath);
            await loadFiles();
            alert('Deleted successfully!');
        } catch (err) {
            alert('Delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleExtract = async (file: any) => {
        const deleteAfter = confirm(
            `Extract "${file.name}"?\n\n` +
            `Click OK to extract and DELETE the ZIP file.\n` +
            `Click Cancel to extract and KEEP the ZIP file.`
        );

        try {
            const filePath = buildFilePath(currentPath, file.name);
            console.log('Extracting ZIP:', filePath, 'Delete after:', deleteAfter);

            const result = await extractZipFile(filePath, deleteAfter);

            console.log('Extract result:', result);
            await loadFiles();

            alert(
                `ZIP extracted successfully!\n\n` +
                `Files extracted: ${result.filesExtracted}\n` +
                `ZIP deleted: ${result.zipDeleted ? 'Yes' : 'No'}`
            );
        } catch (err) {
            console.error('Extract error:', err);
            alert('Extract failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleRename = async (file: any) => {
        const newName = prompt(`Rename "${file.name}" to:`, file.name);
        if (!newName || newName === file.name) return;

        // Gunakan validateFileName helper
        const validationError = validateFileName(newName);
        if (validationError) {
            alert(validationError);
            return;
        }

        try {
            const filePath = buildFilePath(currentPath, file.name);
            await renameFile(filePath, newName);
            await loadFiles();
            alert(`Renamed successfully to "${newName}"`);
        } catch (err) {
            console.error('Rename error:', err);
            alert('Rename failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };
    const handleBulkDelete = async () => {
        if (selectedFiles.length === 0) return;

        // Get selected file names
        const selectedFileObjects = files.filter(f => selectedFiles.includes(f.id));
        const fileNames = selectedFileObjects.map(f => f.name).join('\n- ');

        const confirmed = confirm(
            `Delete ${selectedFiles.length} selected file(s)?\n\n- ${fileNames}\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

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
                alert(`Successfully deleted ${successCount} file(s)!`);
            } else {
                alert(`Deleted ${successCount} file(s).\nFailed to delete ${failCount} file(s).`);
            }
        } catch (err) {
            console.error('Bulk delete error:', err);
            alert('Bulk delete failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
    };

    const handleCreateFolder = async () => {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        const validationError = validateFileName(folderName);
        if (validationError) {
            alert(validationError);
            return;
        }

        try {
            await createFolder(folderName, currentPath);
            await loadFiles();
            alert('Folder created successfully!');
        } catch (err) {
            alert('Create folder failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
        }
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
    }, [files, searchQuery, sortBy, sortOrder]);

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
                        onBack={handleBackClick}
                        onBreadcrumbClick={handleBreadcrumbClick}
                        onClearClipboard={() => setClipboard({ files: [], mode: null })}
                        onViewModeChange={setViewMode}
                        onSearchChange={setSearchQuery}
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
                    setFiles([]);
                    loadFiles();
                }}
                onUpload={handleUploadClick}
            />

        </ProtectedDashboard >
    );
};

export default FileManagerPage;