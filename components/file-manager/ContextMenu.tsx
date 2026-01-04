import React, { useEffect, useRef } from 'react';
import { isImageFile, isVideoFile } from '../../features/file-manager/utils/file-helpers';
import type { FileItem, ContextMenuState, ClipboardState } from '../../features/file-manager/types';

interface ContextMenuProps {
    contextMenu: ContextMenuState;
    clipboard: ClipboardState;
    onClose: () => void;
    onDownload: (file: FileItem) => void;
    onMediaClick: (file: FileItem) => void;
    onEdit: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onExtract: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
    onCopy: () => void;
    onCut: () => void;
    onPaste: () => void;
    onRefresh: () => void;
    onUpload: () => void;
    onPermissions: (file: FileItem) => void;
    onCompress: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
    contextMenu,
    clipboard,
    onClose,
    onDownload,
    onMediaClick,
    onEdit,
    onRename,
    onExtract,
    onDelete,
    onCopy,
    onCut,
    onPaste,
    onRefresh,
    onUpload,
    onPermissions,
    onCompress
}) => {

    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (contextMenu.visible) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [contextMenu.visible, onClose]);

    if (!contextMenu.visible) return null;

    return (
        <div
            ref={menuRef}
            className="fixed bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50 min-w-[220px]"
            style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.file ? (
                <>
                    {/* Download */}
                    {contextMenu.file.type === 'file' && (
                        <button
                            onClick={() => {
                                onDownload(contextMenu.file!);
                                onClose();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Download</span>
                        </button>
                    )}

                    {/* Preview - For Images & Videos */}
                    {contextMenu.file.type === 'file' && (isImageFile(contextMenu.file.name) || isVideoFile(contextMenu.file.name)) && (
                        <button
                            onClick={() => {
                                onMediaClick(contextMenu.file!);
                                onClose();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Preview</span>
                        </button>
                    )}

                    {/* Edit - For Code Files */}
                    {contextMenu.file.type === 'file' && (() => {
                        const editableExts = ['html', 'htm', 'css', 'scss', 'less', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'php', 'py', 'rb', 'java', 'cpp', 'c', 'go', 'rs', 'sh', 'bash', 'yaml', 'yml', 'toml', 'ini', 'conf', 'md', 'sql', 'txt', 'log', 'env'];
                        const ext = contextMenu.file.name.split('.').pop()?.toLowerCase();
                        return ext && editableExts.includes(ext);
                    })() && (
                            <button
                                onClick={() => {
                                    onEdit(contextMenu.file!);
                                    onClose();
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                            >
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">Edit</span>
                            </button>
                        )}

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Compress to ZIP */}
                    <button
                        onClick={() => {
                            onCompress();
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Compress to ZIP</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Copy */}
                    <button
                        onClick={() => {
                            onCopy();
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Copy</span>
                        <span className="ml-auto text-xs text-gray-400">Ctrl+C</span>
                    </button>

                    {/* Cut */}
                    <button
                        onClick={() => {
                            onCut();
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Cut</span>
                        <span className="ml-auto text-xs text-gray-400">Ctrl+X</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Rename */}
                    <button
                        onClick={() => {
                            onRename(contextMenu.file!);
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Rename</span>
                        <span className="ml-auto text-xs text-gray-400">F2</span>
                    </button>

                    {/* Extract ZIP */}
                    {contextMenu.file.type === 'file' && contextMenu.file.name.toLowerCase().endsWith('.zip') && (
                        <button
                            onClick={() => {
                                onExtract(contextMenu.file!);
                                onClose();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Extract ZIP</span>
                        </button>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Permissions */}
                    <button
                        onClick={() => {
                            onPermissions(contextMenu.file!);
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Permissions</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    {/* Delete */}
                    <button
                        onClick={() => {
                            onDelete(contextMenu.file!);
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 transition-colors group"
                    >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm font-medium text-red-600">Delete</span>
                        <span className="ml-auto text-xs text-gray-400">Del</span>
                    </button>
                </>
            ) : (
                <>
                    {/* General Folder Actions */}
                    <button
                        onClick={() => {
                            onPaste();
                            onClose();
                        }}
                        disabled={clipboard.files.length === 0}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Paste {clipboard.files.length > 0 && `(${clipboard.files.length})`}</span>
                        <span className="ml-auto text-xs text-gray-400">Ctrl+V</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                        onClick={() => {
                            onRefresh();
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Refresh</span>
                    </button>

                    <button
                        onClick={() => {
                            onUpload();
                            onClose();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 transition-colors"
                    >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Upload Files</span>
                    </button>
                </>
            )}
        </div>
    );
};

export default ContextMenu;
