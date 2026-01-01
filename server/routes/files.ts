import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import {
    listFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    readFile,
    updateFile,
    renameFile,
    extractZip,
    copyFiles,
    moveFiles
} from '../controllers/fileController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file size
    }
});

// All routes require authentication
router.use(authenticate);

// List files in directory
router.get('/list', listFiles);

// Upload file
router.post('/upload', upload.single('file'), uploadFile);

// Download file
router.get('/download', downloadFile);

// Read file content (for editor)
router.get('/read', readFile);

// Update file content (for editor)
router.put('/update', updateFile);

// Rename file/folder
router.put('/rename', renameFile);

// Delete file/folder
router.delete('/delete', deleteFile);

// Create folder
router.post('/folder', createFolder);

// Extract ZIP file
router.post('/extract', extractZip);

// Copy files/folders
router.post('/copy', copyFiles);

// Move files/folders
router.post('/move', moveFiles);

export default router;

