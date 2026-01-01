import React from 'react';

interface AdvancedFilterPanelProps {
    show: boolean;
    onClose: () => void;
    filterType: string;
    filterSize: string;
    filterDate: string;
    onFilterTypeChange: (value: string) => void;
    onFilterSizeChange: (value: string) => void;
    onFilterDateChange: (value: string) => void;
    onClearFilters: () => void;
}

const AdvancedFilterPanel: React.FC<AdvancedFilterPanelProps> = ({
    show,
    onClose,
    filterType,
    filterSize,
    filterDate,
    onFilterTypeChange,
    onFilterSizeChange,
    onFilterDateChange,
    onClearFilters
}) => {
    if (!show) return null;

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <h3 className="text-white font-bold">Advanced Filters</h3>
                </div>
                <button
                    onClick={onClose}
                    className="text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Filter Content */}
            <div className="p-4 space-y-4">
                {/* File Type Filter */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">File Type</label>
                    <select
                        value={filterType}
                        onChange={(e) => onFilterTypeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Types</option>
                        <option value="image">Images (jpg, png, gif, etc)</option>
                        <option value="video">Videos (mp4, avi, mov, etc)</option>
                        <option value="document">Documents (pdf, doc, txt, etc)</option>
                        <option value="code">Code Files (js, html, css, etc)</option>
                        <option value="archive">Archives (zip, rar, tar, etc)</option>
                        <option value="folder">Folders Only</option>
                    </select>
                </div>

                {/* File Size Filter */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">File Size</label>
                    <select
                        value={filterSize}
                        onChange={(e) => onFilterSizeChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Sizes</option>
                        <option value="tiny">&lt; 100 KB (Tiny)</option>
                        <option value="small">100 KB - 1 MB (Small)</option>
                        <option value="medium">1 MB - 10 MB (Medium)</option>
                        <option value="large">10 MB - 100 MB (Large)</option>
                        <option value="huge">&gt; 100 MB (Huge)</option>
                    </select>
                </div>

                {/* Date Modified Filter */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Modified</label>
                    <select
                        value={filterDate}
                        onChange={(e) => onFilterDateChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="year">This Year</option>
                    </select>
                </div>

                {/* Active Filters Count */}
                {(filterType !== 'all' || filterSize !== 'all' || filterDate !== 'all') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-700 font-medium">
                                {[filterType !== 'all', filterSize !== 'all', filterDate !== 'all'].filter(Boolean).length} filter(s) active
                            </span>
                            <button
                                onClick={onClearFilters}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <span className="text-xs text-gray-500">Filter your files efficiently</span>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                    Apply
                </button>
            </div>
        </div>
    );
};

export default AdvancedFilterPanel;
