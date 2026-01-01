import React from 'react';

interface UploadProgressBarProps {
    fileName: string;
    progress: number;
}

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({ fileName, progress }) => {
    return (
        <div className="fixed bottom-6 right-6 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-white font-bold text-sm">Uploading File</p>
                    <p className="text-white/80 text-xs truncate">{fileName}</p>
                </div>
            </div>

            {/* Progress Content */}
            <div className="p-4">
                {/* Progress Bar */}
                <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-600">Progress</span>
                        <span className="text-xs font-bold text-blue-600">{progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Animated Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                        </div>
                    </div>
                </div>

                {/* Status Text */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {progress < 100 ? (
                        <>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-green-600 font-medium">Upload Complete!</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadProgressBar;
