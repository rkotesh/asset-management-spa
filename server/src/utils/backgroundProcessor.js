import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { tmpdir } from 'os';
import sharp from 'sharp';
import Asset from '../models/Asset.js';
import { getFileBuffer, uploadBuffer } from './s3.js';
import { compressImage, compressPdf } from './compress.js';
import { classifyAsset } from './classificationPipeline.js';

/**
 * Runs asynchronously in the background to optimize file (compress, classify, thumbnail).
 * Does not block the main HTTP upload/confirmation thread.
 * @param {string} assetId - Database ID of the Asset
 */
export async function optimizeAsset(assetId) {
  console.log(`[Background Processor] Starting optimization for asset: ${assetId}`);
  
  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      console.error(`[Background Processor] Asset not found: ${assetId}`);
      return;
    }

    // If it's a remote URL, skip download/compression and classify purely on title/description
    if (asset.s3Key && (asset.s3Key.startsWith('http://') || asset.s3Key.startsWith('https://'))) {
      console.log(`[Background Processor] Remote URL detected. Skipping file download for: ${assetId}`);
      
      if (!asset.contentHash) {
        asset.contentHash = `link-${assetId}-${Date.now()}`;
      }

      try {
        const categories = classifyAsset(null, asset.title, asset.description);
        asset.categories = categories;
      } catch (e) {
        console.error('[Background Processor] Remote asset classification failed:', e.message);
      }

      await asset.save();
      return;
    }

    // 1. Download original file buffer
    let buffer;
    try {
      buffer = await getFileBuffer(asset.s3Key);
    } catch (err) {
      console.error(`[Background Processor] Failed to download file buffer:`, err.message);
      return;
    }

    // 2. Compute contentHash if missing
    if (!asset.contentHash) {
      const shaHash = crypto.createHash('sha256').update(buffer).digest('hex');
      asset.contentHash = shaHash;
    }

    // 3. Classify file content dynamically
    // Write buffer to a temp file so classifyAsset can read it via fs
    const tempPath = path.join(tmpdir(), `classify-${assetId}-${Date.now()}`);
    fs.writeFileSync(tempPath, buffer);
    try {
      const categories = classifyAsset(tempPath, asset.title, asset.description);
      asset.categories = categories;
    } catch (e) {
      console.error('[Background Processor] Classification failed:', e.message);
    } finally {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (err) {}
      }
    }

    // 4. Perform compression based on file type
    let finalBuffer = buffer;
    let finalMimeType = asset.mimeType;

    if (asset.fileType === 'image') {
      const result = await compressImage(buffer, asset.mimeType);
      finalBuffer = result.buffer;
      finalMimeType = result.mimeType;
      
      // Upload optimized image
      const optimizedKey = `optimized/${assetId}.webp`;
      await uploadBuffer(finalBuffer, optimizedKey, finalMimeType);
      
      asset.s3Key = optimizedKey;
      asset.mimeType = finalMimeType;
      asset.size = finalBuffer.length;
    } else if (asset.fileType === 'pdf') {
      finalBuffer = await compressPdf(buffer);
      if (finalBuffer.length < buffer.length) {
        // Upload compressed PDF
        const optimizedKey = `optimized/${assetId}.pdf`;
        await uploadBuffer(finalBuffer, optimizedKey, asset.mimeType);
        asset.s3Key = optimizedKey;
        asset.size = finalBuffer.length;
      }
    }

    // 5. Generate Thumbnail WebP (400x400)
    let thumbnailBuffer = null;
    if (asset.fileType === 'image') {
      try {
        thumbnailBuffer = await sharp(buffer)
          .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (err) {
        console.error('[Background Processor] Failed to generate image thumbnail:', err.message);
      }
    } else if (asset.fileType === 'pdf') {
      try {
        // Render first page of PDF using sharp
        thumbnailBuffer = await sharp(buffer, { page: 0 })
          .resize(400, 400, { fit: 'cover', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } catch (err) {
        console.log('[Background Processor] Sharp PDF rasterization not supported by environment libvips.');
      }
    }

    if (thumbnailBuffer) {
      const thumbnailKey = `thumbs/${assetId}.webp`;
      await uploadBuffer(thumbnailBuffer, thumbnailKey, 'image/webp');
      asset.thumbnailUrl = `thumbs/${assetId}.webp`;
    }

    await asset.save();
    console.log(`[Background Processor] Finished optimization for asset: ${assetId}`);
  } catch (err) {
    console.error(`[Background Processor] Unexpected error optimizing asset ${assetId}:`, err.message);
  }
}
