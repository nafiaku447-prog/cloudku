import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
    editorOpen: boolean;
    selectedFiles: number[];
    filteredFiles: any[];
    files: any[];
    clipboard: { files: any[]; mode: 'copy' | 'cut' | null };
    onSelectAll: (fileIds: number[]) => void;
    onDelete: () => void;
    onRename: (file: any) => void;
    onCopy: () => void;
    onCut: () => void;
    onPaste: () => void;
    onClearSelection: () => void;
    onCloseContextMenu: () => void;
}

/**
 * Custom hook untuk menangani keyboard shortcuts di File Manager
 * Mendukung: Ctrl+A, Delete, F2, Ctrl+C, Ctrl+X, Ctrl+V, Escape
 */
export const useKeyboardShortcuts = ({
    editorOpen,
    selectedFiles,
    filteredFiles,
    files,
    clipboard,
    onSelectAll,
    onDelete,
    onRename,
    onCopy,
    onCut,
    onPaste,
    onClearSelection,
    onCloseContextMenu
}: UseKeyboardShortcutsProps) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Target:', e.target);

            // Ignore if typing in input or editor is open
            if (editorOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                console.log('Ignored - editorOpen:', editorOpen, 'isInput:', e.target instanceof HTMLInputElement);
                return;
            }

            // Ctrl+A - Select All
            if (e.ctrlKey && e.key.toLowerCase() === 'a') {
                e.preventDefault();
                const allFileIds = filteredFiles.map(f => f.id);
                onSelectAll(allFileIds);
                console.log('✅ Select all:', allFileIds.length, 'files');
            }

            // Delete - Delete selected files
            if (e.key === 'Delete' && selectedFiles.length > 0) {
                e.preventDefault();
                console.log('✅ Delete pressed');
                onDelete();
            }

            // F2 - Rename (first selected file)
            if (e.key === 'F2' && selectedFiles.length === 1) {
                e.preventDefault();
                const file = files.find(f => f.id === selectedFiles[0]);
                if (file) {
                    console.log('✅ F2 - Rename:', file.name);
                    onRename(file);
                }
            }

            // Ctrl+C - Copy
            if (e.ctrlKey && e.key.toLowerCase() === 'c' && selectedFiles.length > 0) {
                e.preventDefault();
                console.log('✅ Ctrl+C pressed, calling onCopy');
                onCopy();
            }

            // Ctrl+X - Cut
            if (e.ctrlKey && e.key.toLowerCase() === 'x' && selectedFiles.length > 0) {
                e.preventDefault();
                console.log('✅ Ctrl+X pressed, calling onCut');
                onCut();
            }

            // Ctrl+V - Paste
            if (e.ctrlKey && e.key.toLowerCase() === 'v' && clipboard.files.length > 0) {
                e.preventDefault();
                console.log('✅ Ctrl+V pressed, calling onPaste');
                onPaste();
            }

            // Escape - Clear selection and close context menu
            if (e.key === 'Escape') {
                console.log('✅ Escape - Clear selection');
                onClearSelection();
                onCloseContextMenu();
            }
        };

        const handleClick = () => {
            onCloseContextMenu();
        };

        console.log('🔌 Keyboard shortcuts listener attached');
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('click', handleClick);

        return () => {
            console.log('🔌 Keyboard shortcuts listener removed');
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('click', handleClick);
        };
    }, [
        editorOpen,
        selectedFiles,
        filteredFiles,
        files,
        clipboard,
        onSelectAll,
        onDelete,
        onRename,
        onCopy,
        onCut,
        onPaste,
        onClearSelection,
        onCloseContextMenu
    ]);
};
