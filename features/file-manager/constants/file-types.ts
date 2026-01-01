/**
 * File Type Configurations
 * Contains arrays of file extensions categorized by type
 */

/**
 * Image file extensions
 */
export const IMAGE_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'bmp',
    'webp',
    'svg'
] as const;

/**
 * Video file extensions
 */
export const VIDEO_EXTENSIONS = [
    'mp4',
    'avi',
    'mov',
    'wmv',
    'flv',
    'webm',
    'mkv'
] as const;

/**
 * Audio file extensions
 */
export const AUDIO_EXTENSIONS = [
    'mp3',
    'wav',
    'ogg',
    'flac',
    'aac',
    'm4a'
] as const;

/**
 * Editable text file extensions
 * Files that can be opened in the code editor
 */
export const EDITABLE_EXTENSIONS = [
    // Web
    'html',
    'htm',
    'css',
    'scss',
    'less',
    'js',
    'jsx',
    'ts',
    'tsx',

    // Data
    'json',
    'xml',
    'yaml',
    'yml',
    'toml',
    'ini',
    'conf',

    // Backend
    'php',
    'py',
    'rb',
    'java',
    'cpp',
    'c',
    'go',
    'rs',

    // Scripts
    'sh',
    'bash',

    // Markdown & Docs
    'md',
    'txt',

    // Database
    'sql',

    // Logs & Config
    'log',
    'env',
    'htaccess'
] as const;

/**
 * Archive file extensions
 */
export const ARCHIVE_EXTENSIONS = [
    'zip',
    'rar',
    'tar',
    'gz',
    '7z',
    'bz2'
] as const;

/**
 * Document file extensions
 */
export const DOCUMENT_EXTENSIONS = [
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx'
] as const;
