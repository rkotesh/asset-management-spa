import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAssets, getAssetById, getAssetDownloadUrl, streamMockAsset, uploadAsset } from '../controllers/assetController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

// Ensure temporary upload directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Multer middleware setup
const upload = multer({ 
  dest: TEMP_DIR,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB file size limit
});

const router = express.Router();

// Public download streaming route (used for browser download trigger)
router.get('/mock-download/:id', streamMockAsset);

// Protected metadata and URL generation routes
router.get('/', protect, getAssets);
router.get('/:id', protect, getAssetById);
router.get('/:id/download', protect, getAssetDownloadUrl);

// Admin only: Upload new asset route
router.post('/upload', protect, adminOnly, upload.single('file'), uploadAsset);

export default router;
