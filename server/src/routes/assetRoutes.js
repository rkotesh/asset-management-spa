import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAssets, getCategories, getAssetById, getAssetDownloadUrl, streamMockAsset, uploadAsset, presignUpload, confirmUpload, getAssetThumbnail, uploadLinkAsset, updateAsset, deleteAsset } from '../controllers/assetController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

// Ensure temporary upload directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const maxUploadBytes = parseInt(process.env.MAX_UPLOAD_BYTES, 10) || 50 * 1024 * 1024;

// Multer middleware setup
const upload = multer({ 
  dest: TEMP_DIR,
  limits: { fileSize: maxUploadBytes }
});

const router = express.Router();

// Public download streaming route (used for browser download trigger)
router.get('/mock-download/:id', streamMockAsset);

// Protected metadata and URL generation routes
router.get('/', protect, getAssets);
router.get('/categories', protect, getCategories);
router.get('/:id', protect, getAssetById);
router.get('/:id/download', protect, getAssetDownloadUrl);
router.get('/:id/thumbnail', getAssetThumbnail);

// Admin only: Upload new asset route
router.post('/upload', protect, adminOnly, upload.single('file'), uploadAsset);
router.post('/presign', protect, adminOnly, presignUpload);
router.post('/confirm-upload', protect, adminOnly, confirmUpload);
router.post('/upload-link', protect, adminOnly, uploadLinkAsset);
router.put('/:id', protect, adminOnly, updateAsset);
router.delete('/:id', protect, adminOnly, deleteAsset);

export default router;
