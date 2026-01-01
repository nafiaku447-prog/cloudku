import React from 'react';

interface EmptyStateProps {
    onUploadClick: () => void;
    onCreateFile: () => void;
    onCreateFolder: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    onUploadClick,
    onCreateFile,
    onCreateFolder
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            {/* Animated Folder Icon */}
            <div className="relative mb-8 animate-bounce-slow">
                <div className="absolute inset-0 bg-blue-400 opacity-20 blur-3xl rounded-full"></div>
                <svg
                    className="w-32 h-32 text-gray-300 relative z-10 transition-transform hover:scale-110 duration-300"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    <path opacity="0.3" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" fill="url(#gradient)" />
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                This folder is empty
            </h3>
            <p className="text-gray-500 text-center mb-8 max-w-md">
                Get started by uploading files, creating a new file, or organizing with folders
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
                <button
                    onClick={onUploadClick}
                    className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-xl"
                >
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="font-medium">Upload Files</span>
                </button>

                <button
                    onClick={onCreateFile}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">New File</span>
                </button>

                <button
                    onClick={onCreateFolder}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transform hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span className="font-medium">New Folder</span>
                </button>
            </div>

            {/* Drag and Drop Hint */}
            <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pro tip: You can also drag and drop files or folders here</span>
            </div>
        </div>
    );
};

export default EmptyState;
