import React from 'react';
import { getFileIcon, isImageFile, isVideoFile, isEditableFile } from '../../features/file-manager/utils/file-helpers';

interface FileItem {
    id: number;
    name: string;
    type: 'file' | 'folder';
    size: string;
    modified: string;
    permissions: string;
}

interface ClipboardState {
    files: FileItem[];
    mode: 'copy' | 'cut' | null;
}

interface FileListViewProps {
    files: FileItem[];
    selectedFiles: number[];
    clipboard: ClipboardState;
    sortBy: 'name' | 'size' | 'modified' | 'type';
    sortOrder: 'asc' | 'desc';
    onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSort: (column: 'name' | 'size' | 'modified' | 'type') => void;
    onRowClick: (fileId: number, e: React.MouseEvent) => void;
    onCheckboxChange: (fileId: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem | null) => void;
    onFolderDoubleClick: (folderName: string) => void;
    onDownload: (file: FileItem) => void;
    onMediaClick: (file: FileItem) => void;
    onEdit: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onExtract: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
}

const FileListView: React.FC<FileListViewProps> = ({
    files,
    selectedFiles,
    clipboard,
    sortBy,
    sortOrder,
    onSelectAll,
    onSort,
    onRowClick,
    onCheckboxChange,
    onContextMenu,
    onFolderDoubleClick,
    onDownload,
    onMediaClick,
    onEdit,
    onRename,
    onExtract,
    onDelete
}) => {
    return (
        <table className="w-full animate-fade-in">
            <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 text-left">
                        <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={files.length > 0 && selectedFiles.length === files.length}
                            onChange={onSelectAll}
                        />
                    </th>
                    <th
                        onClick={() => onSort('name')}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                        onClick={() => onSort('size')}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        Size {sortBy === 'size' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th
                        onClick={() => onSort('modified')}
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        Modified {sortBy === 'modified' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Permissions</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {files.map((file) => {
                    const isInCutClipboard = clipboard.mode === 'cut' && clipboard.files.some(f => f.id === file.id);
                    const fileIcon = getFileIcon(file.name, file.type);

                    return (
                        <tr
                            key={file.id}
                            className={`transition-all cursor-pointer ${isInCutClipboard ? 'opacity-50' : 'opacity-100'} ${selectedFiles.includes(file.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                            onClick={(e) => onRowClick(file.id, e)}
                            onContextMenu={(e) => onContextMenu(e, file)}
                            onDoubleClick={() => {
                                if (file.type === 'folder') {
                                    onFolderDoubleClick(file.name);
                                }
                            }}
                        >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={(e) => onCheckboxChange(file.id, e)}
                                />
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center">
                                        <i className={`${fileIcon.iconClass} ${fileIcon.textColor} text-4xl`}></i>
                                    </div>
                                    <span className="font-medium text-gray-900">
                                        {file.name}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{file.modified}</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-gray-100 text-gray-700 text-xs font-mono">
                                    {file.permissions}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {/* Download Button */}
                                    {file.type === 'file' && (
                                        <button
                                            onClick={() => onDownload(file)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Download"
                                        >
                                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Media Preview Button */}
                                    {file.type === 'file' && (isImageFile(file.name) || isVideoFile(file.name)) && (
                                        <button
                                            onClick={() => onMediaClick(file)}
                                            className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                            title={isVideoFile(file.name) ? "Preview Video" : "Preview Image"}
                                        >
                                            {isVideoFile(file.name) ? (
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            )}
                                        </button>
                                    )}

                                    {/* Edit Button */}
                                    {file.type === 'file' && isEditableFile(file.name) && (
                                        <button
                                            onClick={() => onEdit(file)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit File"
                                        >
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Rename Button */}
                                    <button
                                        onClick={() => onRename(file)}
                                        className="p-2 hover:bg-yellow-50 rounded-lg transition-colors"
                                        title="Rename"
                                    >
                                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>

                                    {/* Extract ZIP Button */}
                                    {file.type === 'file' && file.name.toLowerCase().endsWith('.zip') && (
                                        <button
                                            onClick={() => onExtract(file)}
                                            className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Extract ZIP"
                                        >
                                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                        </button>
                                    )}

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => onDelete(file)}
                                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
};

export default FileListView;
