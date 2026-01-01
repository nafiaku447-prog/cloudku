import React from 'react';

interface DragDropOverlayProps {
    isDragging: boolean;
}

const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ isDragging }) => {
    if (!isDragging) return null;

    return (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-4 border-dashed border-blue-500 rounded-xl flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white px-8 py-6 rounded-xl shadow-2xl">
                <svg className="w-16 h-16 text-blue-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-xl font-bold text-gray-900">Drop files here</p>
                <p className="text-sm text-gray-600 mt-2">Release to upload files</p>
            </div>
        </div>
    );
};

export default DragDropOverlay;
