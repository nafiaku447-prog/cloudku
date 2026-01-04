import React from 'react';
import type { Breadcrumb } from '../../features/file-manager/utils/path-helpers';
import type { ClipboardState, ViewMode } from '../../features/file-manager/types';
import AdvancedFilterPanel from '../AdvancedFilterPanel';

interface FileManagerToolbarProps {
    currentPath: string;
    breadcrumbs: Breadcrumb[];
    clipboard: ClipboardState;
    viewMode: ViewMode;
    searchQuery: string;
    filterType: string;
    filterSize: string;
    filterDate: string;
    showFilterPanel: boolean;
    onBack: () => void;
    onBreadcrumbClick: (index: number) => void;
    onClearClipboard: () => void;
    onViewModeChange: (mode: ViewMode) => void;
    onSearchChange: (query: string) => void;
    onFilterTypeChange: (value: string) => void;
    onFilterSizeChange: (value: string) => void;
    onFilterDateChange: (value: string) => void;
    onClearFilters: () => void;
    onToggleFilterPanel: () => void;
}

const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
    currentPath,
    breadcrumbs,
    clipboard,
    viewMode,
    searchQuery,
    filterType,
    filterSize,
    filterDate,
    showFilterPanel,
    onBack,
    onBreadcrumbClick,
    onClearClipboard,
    onViewModeChange,
    onSearchChange,
    onFilterTypeChange,
    onFilterSizeChange,
    onFilterDateChange,
    onClearFilters,
    onToggleFilterPanel
}) => {
    const hasActiveFilters = filterType !== 'all' || filterSize !== 'all' || filterDate !== 'all';
    const activeFilterCount = [filterType !== 'all', filterSize !== 'all', filterDate !== 'all'].filter(Boolean).length;

    return (
        <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
                {/* Breadcrumb Navigation */}
                <div className="flex items-center gap-2">
                    {/* Back Button */}
                    {currentPath !== '/public_html' && (
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-2"
                            title="Back"
                        >
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Breadcrumb Links */}
                    <div className="flex items-center gap-2 text-sm">
                        <button
                            onClick={() => onBreadcrumbClick(-1)}
                            className="text-[#5865F2] hover:underline font-medium transition-colors"
                        >
                            <i className="fas fa-home mr-1"></i>
                            Home
                        </button>

                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={idx}>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                                {idx === breadcrumbs.length - 1 ? (
                                    <span className="text-gray-900 font-medium">{crumb.name}</span>
                                ) : (
                                    <button
                                        onClick={() => onBreadcrumbClick(crumb.index)}
                                        className="text-[#5865F2] hover:underline font-medium transition-colors"
                                    >
                                        {crumb.name}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Clipboard Indicator */}
                {clipboard.files.length > 0 && (
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 ${clipboard.mode === 'cut' ? 'bg-orange-50 border-orange-300' : 'bg-blue-50 border-blue-300'}`}>
                        <svg className={`w-4 h-4 ${clipboard.mode === 'cut' ? 'text-orange-600' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {clipboard.mode === 'cut' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            )}
                        </svg>
                        <span className={`text-sm font-semibold ${clipboard.mode === 'cut' ? 'text-orange-700' : 'text-blue-700'}`}>
                            {clipboard.files.length} {clipboard.mode === 'cut' ? 'Cut' : 'Copied'}
                        </span>
                        <button
                            onClick={onClearClipboard}
                            className={`ml-1 hover:bg-white/50 rounded p-0.5 transition-colors ${clipboard.mode === 'cut' ? 'text-orange-600' : 'text-blue-600'}`}
                            title="Clear clipboard"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`p-2 rounded-md transition-all duration-300 transform hover:scale-110 active:scale-95 ${viewMode === 'list'
                            ? 'bg-white shadow-sm text-[#5865F2] scale-105'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        title="List View"
                    >
                        <svg className={`w-5 h-5 transition-transform duration-300 ${viewMode === 'list' ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onViewModeChange('grid')}
                        className={`p-2 rounded-md transition-all duration-300 transform hover:scale-110 active:scale-95 ${viewMode === 'grid'
                            ? 'bg-white shadow-sm text-[#5865F2] scale-105'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                            }`}
                        title="Grid View"
                    >
                        <svg className={`w-5 h-5 transition-transform duration-300 ${viewMode === 'grid' ? 'scale-110' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Advanced Filter Button */}
                <div className="relative">
                    <button
                        onClick={onToggleFilterPanel}
                        className={`px-4 py-2 border text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${showFilterPanel || hasActiveFilters
                            ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        Filter
                        {hasActiveFilters && (
                            <span className="ml-1 bg-white text-blue-600 rounded-full px-2 py-0.5 text-xs font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Advanced Filter Panel */}
                    <AdvancedFilterPanel
                        show={showFilterPanel}
                        onClose={() => onToggleFilterPanel()}
                        filterType={filterType}
                        filterSize={filterSize}
                        filterDate={filterDate}
                        onFilterTypeChange={onFilterTypeChange}
                        onFilterSizeChange={onFilterSizeChange}
                        onFilterDateChange={onFilterDateChange}
                        onClearFilters={onClearFilters}
                    />
                </div>
            </div>
        </div>
    );
};

export default FileManagerToolbar;
