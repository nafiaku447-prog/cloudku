import React, { useState } from 'react';

interface CompressModalProps {
    show: boolean;
    fileCount: number;
    defaultName: string;
    onConfirm: (archiveName: string) => Promise<void>;
    onCancel: () => void;
}

const CompressModal: React.FC<CompressModalProps> = ({
    show,
    fileCount,
    defaultName,
    onConfirm,
    onCancel
}) => {
    const [archiveName, setArchiveName] = useState(defaultName);
    const [compressing, setCompressing] = useState(false);

    const handleConfirm = async () => {
        if (!archiveName.trim()) return;

        setCompressing(true);
        try {
            await onConfirm(archiveName);
        } finally {
            setCompressing(false);
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={onCancel}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                        <h3 className="text-lg font-semibold">Compress to ZIP</h3>
                        <p className="text-blue-100 text-xs">{fileCount} item(s) selected</p>
                    </div>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Archive Name
                    </label>
                    <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="my-archive.zip"
                        value={archiveName}
                        onChange={(e) => setArchiveName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-500">
                        💡 Extension .zip will be added automatically if not present
                    </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onCancel}
                        disabled={compressing}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!archiveName.trim() || compressing}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {compressing ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Compressing...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                Create Archive
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompressModal;
