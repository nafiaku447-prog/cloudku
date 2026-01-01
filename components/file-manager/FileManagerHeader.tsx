import React from 'react';

interface FileManagerHeaderProps {
    uploading: boolean;
    selectedFilesCount: number;
    fileInputRef: React.RefObject<HTMLInputElement>;
    folderInputRef: React.RefObject<HTMLInputElement>;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFolderSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUploadClick: () => void;
    onFolderUploadClick: () => void;
    onCreateFolder: () => void;
    onBulkDelete: () => void;
}

const FileManagerHeader: React.FC<FileManagerHeaderProps> = ({
    uploading,
    selectedFilesCount,
    fileInputRef,
    folderInputRef,
    onFileSelect,
    onFolderSelect,
    onUploadClick,
    onFolderUploadClick,
    onCreateFolder,
    onBulkDelete
}) => {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
                <p className="text-gray-600 mt-1">Browse and manage your website files</p>
            </div>
            <div className="flex items-center gap-3">
                {/* File Upload Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileSelect}
                    multiple
                    className="hidden"
                />
                {/* Folder Upload Input */}
                <input
                    type="file"
                    ref={folderInputRef}
                    onChange={onFolderSelect}
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    className="hidden"
                />

                <button
                    onClick={onUploadClick}
                    disabled={uploading}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? 'Uploading...' : 'Upload Files'}
                </button>
                <button
                    onClick={onFolderUploadClick}
                    disabled={uploading}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    Upload Folder
                </button>
                <button
                    onClick={onCreateFolder}
                    className="px-4 py-2 bg-gradient-to-r from-[#5865F2] to-[#4F46E5] text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    New Folder
                </button>
                {/* Bulk Delete Button - Only show when files are selected */}
                {selectedFilesCount > 0 && (
                    <button
                        onClick={onBulkDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Selected ({selectedFilesCount})
                    </button>
                )}
            </div>
        </div>
    );
};

export default FileManagerHeader;
