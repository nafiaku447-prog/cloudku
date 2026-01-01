/**
 * File Icon Configuration
 * Maps file extensions to their corresponding Font Awesome icons and colors
 */

export interface FileIconConfig {
    iconClass: string;
    bgColor: string;
    textColor: string;
}

export const FOLDER_ICON: FileIconConfig = {
    iconClass: 'fas fa-folder',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-600'
};

export const DEFAULT_FILE_ICON: FileIconConfig = {
    iconClass: 'fas fa-file',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-600'
};

export const FILE_ICON_MAP: Record<string, FileIconConfig> = {
    // Web Development
    'html': { iconClass: 'fab fa-html5', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    'htm': { iconClass: 'fab fa-html5', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    'css': { iconClass: 'fab fa-css3-alt', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    'scss': { iconClass: 'fab fa-sass', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    'less': { iconClass: 'fab fa-less', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    'js': { iconClass: 'fab fa-js', bgColor: 'bg-yellow-50', textColor: 'text-yellow-500' },
    'jsx': { iconClass: 'fab fa-react', bgColor: 'bg-cyan-50', textColor: 'text-cyan-500' },
    'ts': { iconClass: 'fas fa-file-code', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    'tsx': { iconClass: 'fab fa-react', bgColor: 'bg-cyan-50', textColor: 'text-cyan-500' },
    'json': { iconClass: 'fas fa-brackets-curly', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    'md': { iconClass: 'fab fa-markdown', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },

    // Backend Languages
    'php': { iconClass: 'fab fa-php', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
    'py': { iconClass: 'fab fa-python', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    'java': { iconClass: 'fab fa-java', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    'rb': { iconClass: 'fas fa-gem', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    'go': { iconClass: 'fab fa-golang', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600' },
    'rs': { iconClass: 'fas fa-file-code', bgColor: 'bg-orange-50', textColor: 'text-orange-700' },
    'cpp': { iconClass: 'fas fa-file-code', bgColor: 'bg-blue-50', textColor: 'text-blue-700' },
    'c': { iconClass: 'fas fa-file-code', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },

    // Configuration Files
    'yml': { iconClass: 'fas fa-file-code', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    'yaml': { iconClass: 'fas fa-file-code', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    'xml': { iconClass: 'fas fa-file-code', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'env': { iconClass: 'fas fa-gear', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    'toml': { iconClass: 'fas fa-file-code', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    'ini': { iconClass: 'fas fa-gear', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    'conf': { iconClass: 'fas fa-gear', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },

    // Database
    'sql': { iconClass: 'fas fa-database', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },

    // Images
    'png': { iconClass: 'fas fa-file-image', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'jpg': { iconClass: 'fas fa-file-image', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'jpeg': { iconClass: 'fas fa-file-image', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'gif': { iconClass: 'fas fa-file-image', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    'svg': { iconClass: 'fas fa-file-image', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    'webp': { iconClass: 'fas fa-file-image', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'bmp': { iconClass: 'fas fa-file-image', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },

    // Documents
    'pdf': { iconClass: 'fas fa-file-pdf', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    'doc': { iconClass: 'fas fa-file-word', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    'docx': { iconClass: 'fas fa-file-word', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
    'xls': { iconClass: 'fas fa-file-excel', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    'xlsx': { iconClass: 'fas fa-file-excel', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    'ppt': { iconClass: 'fas fa-file-powerpoint', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    'pptx': { iconClass: 'fas fa-file-powerpoint', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },

    // Archives
    'zip': { iconClass: 'fas fa-file-zipper', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    'rar': { iconClass: 'fas fa-file-zipper', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },
    'tar': { iconClass: 'fas fa-file-zipper', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    'gz': { iconClass: 'fas fa-file-zipper', bgColor: 'bg-orange-50', textColor: 'text-orange-600' },
    '7z': { iconClass: 'fas fa-file-zipper', bgColor: 'bg-yellow-50', textColor: 'text-yellow-600' },

    // Video
    'mp4': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'avi': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'mov': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'wmv': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'flv': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'webm': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
    'mkv': { iconClass: 'fas fa-file-video', bgColor: 'bg-purple-50', textColor: 'text-purple-600' },

    // Audio
    'mp3': { iconClass: 'fas fa-file-audio', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    'wav': { iconClass: 'fas fa-file-audio', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    'ogg': { iconClass: 'fas fa-file-audio', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },
    'flac': { iconClass: 'fas fa-file-audio', bgColor: 'bg-pink-50', textColor: 'text-pink-600' },

    // Text & Logs
    'txt': { iconClass: 'fas fa-file-lines', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },
    'log': { iconClass: 'fas fa-file-lines', bgColor: 'bg-gray-50', textColor: 'text-gray-600' },

    // Server Configuration
    'htaccess': { iconClass: 'fas fa-server', bgColor: 'bg-red-50', textColor: 'text-red-600' },
    'sh': { iconClass: 'fas fa-terminal', bgColor: 'bg-green-50', textColor: 'text-green-600' },
    'bash': { iconClass: 'fas fa-terminal', bgColor: 'bg-green-50', textColor: 'text-green-600' },
};
