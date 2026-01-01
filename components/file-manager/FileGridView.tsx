import React from 'react';
import { getFileIcon, isImageFile, isVideoFile } from '../../features/file-manager/utils/file-helpers';

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

interface FileGridViewProps {
    files: FileItem[];
    selectedFiles: number[];
    clipboard: ClipboardState;
    onRowClick: (fileId: number, e: React.MouseEvent) => void;
    onCheckboxChange: (fileId: number, e: React.ChangeEvent<HTMLInputElement>) => void;
    onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
    onFolderDoubleClick: (folderName: string) => void;
    onMediaDoubleClick: (file: FileItem) => void;
    onMediaClick: (file: FileItem) => void;
    onDownload: (file: FileItem) => void;
    onRename: (file: FileItem) => void;
    onDelete: (file: FileItem) => void;
}

const FileGridView: React.FC<FileGridViewProps> = ({
    files,
    selectedFiles,
    clipboard,
    onRowClick,
    onCheckboxChange,
    onContextMenu,
    onFolderDoubleClick,
    onMediaDoubleClick,
    onMediaClick,
    onDownload,
    onRename,
    onDelete
}) => {
    return (
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-fade-in">
            {files.map((file) => {
                const fileIcon = getFileIcon(file.name, file.type);
                const isInCutClipboard = clipboard.mode === 'cut' && clipboard.files.some(f => f.id === file.id);

                return (
                    <div
                        key={file.id}
                        className={`group relative bg-white rounded-2xl p-6 pb-16 cursor-pointer transition-all duration-300 hover:shadow-xl min-h-[220px] flex flex-col ${isInCutClipboard ? 'opacity-50' : 'opacity-100'
                            } ${selectedFiles.includes(file.id)
                                ? 'ring-2 ring-blue-500 bg-blue-50 shadow-lg'
                                : 'border border-gray-200 hover:border-blue-400 hover:-translate-y-1'
                            }`}
                        onClick={(e) => onRowClick(file.id, e)}
                        onContextMenu={(e) => onContextMenu(e, file)}
                        onDoubleClick={() => {
                            if (file.type === 'folder') {
                                onFolderDoubleClick(file.name);
                            } else if (isImageFile(file.name) || isVideoFile(file.name)) {
                                onMediaDoubleClick(file);
                            }
                        }}
                    >
                        {/* Checkbox */}
                        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 w-4 h-4 transition-all"
                                checked={selectedFiles.includes(file.id)}
                                onChange={(e) => onCheckboxChange(file.id, e)}
                            />
                        </div>

                        {/* File Content */}
                        <div className="flex-1 flex flex-col items-center text-center gap-3 mb-2">
                            {/* File Icon */}
                            <div className="w-20 h-20 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                <i className={`${fileIcon.iconClass} ${fileIcon.textColor} text-6xl`}></i>
                            </div>

                            {/* File Name */}
                            <p className="text-sm font-semibold text-gray-900 truncate w-full px-2" title={file.name}>
                                {file.name}
                            </p>

                            {/* File Size */}
                            <p className="text-xs text-gray-500 font-medium">
                                {file.size}
                            </p>
                        </div>

                        {/* Action Buttons - Always visible at bottom */}
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 bg-gray-50 rounded-xl p-2 shadow-inner">
                            {/* Preview Button - For Images & Videos */}
                            {file.type === 'file' && (isImageFile(file.name) || isVideoFile(file.name)) && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMediaClick(file);
                                    }}
                                    className="p-1.5 bg-white hover:bg-purple-50 rounded-lg shadow-sm transition-colors"
                                    title={isVideoFile(file.name) ? "Preview Video" : "Preview Image"}
                                >
                                    {isVideoFile(file.name) ? (
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            )}

                            {/* Download Button */}
                            {file.type === 'file' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDownload(file);
                                    }}
                                    className="p-1.5 bg-white hover:bg-gray-100 rounded-lg shadow-sm transition-colors"
                                    title="Download"
                                >
                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}

                            {/* Rename Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRename(file);
                                }}
                                className="p-1.5 bg-white hover:bg-yellow-50 rounded-lg shadow-sm transition-colors"
                                title="Rename"
                            >
                                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(file);
                                }}
                                className="p-1.5 bg-white hover:bg-red-50 rounded-lg shadow-sm transition-colors"
                                title="Delete"
                            >
                                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default FileGridView;
