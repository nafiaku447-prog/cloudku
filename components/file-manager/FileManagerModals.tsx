import React from 'react';
import CodeEditorModal from '../CodeEditorModal';
import MediaPreviewModal from '../MediaPreviewModal';

interface FileItem {
    id: number;
    name: string;
    path: string;
    content?: string;
}

interface MediaItem {
    url: string;
    name: string;
    type: 'image' | 'video';
    index: number;
}

interface MediaFileItem {
    name: string;
    url: string;
    type: 'image' | 'video';
}

interface FileManagerModalsProps {
    // Code Editor Modal Props
    editingFile: FileItem | null;
    editorOpen: boolean;
    onEditorClose: () => void;
    onEditorSave: (content: string) => void;

    // Media Preview Modal Props
    previewMedia: MediaItem | null;
    previewOpen: boolean;
    onPreviewClose: () => void;
    mediaFiles: MediaFileItem[];
    onMediaNavigate: (direction: 'prev' | 'next') => void;
}

const FileManagerModals: React.FC<FileManagerModalsProps> = ({
    editingFile,
    editorOpen,
    onEditorClose,
    onEditorSave,
    previewMedia,
    previewOpen,
    onPreviewClose,
    mediaFiles,
    onMediaNavigate
}) => {
    return (
        <>
            {/* Code Editor Modal */}
            {editingFile && (
                <CodeEditorModal
                    isOpen={editorOpen}
                    onClose={onEditorClose}
                    fileName={editingFile.name}
                    filePath={editingFile.path}
                    initialContent={editingFile.content || ''}
                    onSave={onEditorSave}
                />
            )}

            {/* Media Preview Modal */}
            {previewMedia && (
                <MediaPreviewModal
                    isOpen={previewOpen}
                    onClose={onPreviewClose}
                    mediaUrl={previewMedia.url || ''}
                    mediaName={previewMedia.name || ''}
                    mediaType={previewMedia.type || 'image'}
                    medias={mediaFiles}
                    currentIndex={previewMedia.index || 0}
                    onNavigate={onMediaNavigate}
                />
            )}
        </>
    );
};

export default FileManagerModals;
