import React, { useState, useEffect } from 'react';
import { getToken } from '../utils/authApi';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaUrl: string;
    mediaName: string;
    mediaType: 'image' | 'video';
    medias: Array<{ name: string; url: string; type: 'image' | 'video' }>;
    currentIndex: number;
    onNavigate: (direction: 'prev' | 'next') => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
    isOpen,
    onClose,
    mediaUrl: initialMediaUrl,
    mediaName,
    mediaType,
    medias,
    currentIndex,
    onNavigate
}) => {
    const [zoom, setZoom] = useState(1);
    const [mediaUrl, setMediaUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);

    // Load media with auth
    useEffect(() => {
        if (!isOpen || !initialMediaUrl) return;

        const loadMedia = async () => {
            setLoading(true);

            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.error('Media load timeout after 10 seconds');
            }, 10000); // 10 second timeout

            try {
                const token = getToken();

                console.log('Loading media:', initialMediaUrl);
                console.log('Token available:', !!token);

                if (!token) {
                    throw new Error('No authentication token found');
                }

                const cleanUrl = initialMediaUrl.split('&token=')[0];
                console.log('Clean URL:', cleanUrl);

                const response = await fetch(cleanUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    signal: controller.signal
                });

                console.log('Response status:', response.status);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();
                console.log('Blob size:', blob.size, 'Type:', blob.type);

                if (blob.size === 0) {
                    throw new Error('Received empty file');
                }

                const url = URL.createObjectURL(blob);
                setMediaUrl(url);
                console.log('Media loaded successfully');
            } catch (error) {
                console.error('Media load error:', error);

                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        console.error('Request timeout - taking too long to load');
                    }
                    alert(`Failed to load media: ${error.message}`);
                }

                setMediaUrl('');
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
                console.log('Loading finished');
            }
        };

        loadMedia();

        return () => {
            if (mediaUrl && mediaUrl.startsWith('blob:')) {
                URL.revokeObjectURL(mediaUrl);
            }
        };
    }, [initialMediaUrl, isOpen]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    if (currentIndex > 0) onNavigate('prev');
                    break;
                case 'ArrowRight':
                    if (currentIndex < (medias?.length || 0) - 1) onNavigate('next');
                    break;
                case '+':
                case '=':
                    if (mediaType === 'image') setZoom(prev => Math.min(prev + 0.25, 3));
                    break;
                case '-':
                    if (mediaType === 'image') setZoom(prev => Math.max(prev - 0.25, 0.5));
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, currentIndex, medias?.length, onClose, onNavigate, mediaType]);

    useEffect(() => {
        setZoom(1);
    }, [mediaUrl]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-black bg-opacity-90 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative h-full flex flex-col">
                {/* Header */}
                <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-black bg-opacity-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-[#5865F2] to-[#4F46E5] rounded-lg flex items-center justify-center">
                            {mediaType === 'video' ? (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{mediaName}</h2>
                            <p className="text-sm text-gray-300">
                                {mediaType === 'video' ? 'Video' : 'Image'} · {currentIndex + 1} of {medias?.length || 0}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Zoom Controls - Only for images */}
                        {mediaType === 'image' && (
                            <div className="flex items-center gap-2 bg-black bg-opacity-50 px-3 py-2 rounded-lg">
                                <button
                                    onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                    title="Zoom Out (-)"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                    </svg>
                                </button>
                                <span className="text-white text-sm font-mono w-12 text-center">
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                                    title="Zoom In (+)"
                                >
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setZoom(1)}
                                    className="ml-1 px-2 py-1 text-xs bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded transition-colors"
                                    title="Reset Zoom"
                                >
                                    Reset
                                </button>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                            title="Close (ESC)"
                        >
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Media Container */}
                <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
                    {currentIndex > 0 && (
                        <button
                            onClick={() => onNavigate('prev')}
                            className="absolute left-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all transform hover:scale-110"
                            title="Previous (←)"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    <div className="relative max-w-full max-h-full overflow-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-12">
                                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mb-4"></div>
                                <p className="text-white text-lg">Loading {mediaType}...</p>
                            </div>
                        ) : mediaUrl ? (
                            mediaType === 'video' ? (
                                <video
                                    src={mediaUrl}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[calc(100vh-200px)] rounded-lg"
                                    style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)' }}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <img
                                    src={mediaUrl}
                                    alt={mediaName}
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transformOrigin: 'center',
                                        transition: 'transform 0.2s ease-out'
                                    }}
                                    className="max-w-full max-h-[calc(100vh-200px)] object-contain"
                                />
                            )
                        ) : (
                            <div className="flex flex-col items-center justify-center p-12">
                                <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-white text-lg">Failed to load {mediaType}</p>
                            </div>
                        )}
                    </div>

                    {currentIndex < (medias?.length || 0) - 1 && (
                        <button
                            onClick={() => onNavigate('next')}
                            className="absolute right-4 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all transform hover:scale-110"
                            title="Next (→)"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="relative z-10 px-6 py-3 bg-black bg-opacity-50">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">←</kbd>
                            <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">→</kbd>
                            <span>Navigate</span>
                        </div>
                        {mediaType === 'image' && (
                            <div className="flex items-center gap-2">
                                <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">+</kbd>
                                <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">-</kbd>
                                <span>Zoom</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <kbd className="px-2 py-1 bg-white bg-opacity-10 rounded">ESC</kbd>
                            <span>Close</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MediaPreviewModal;
