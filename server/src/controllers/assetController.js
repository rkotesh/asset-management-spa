import Asset from '../models/Asset.js';
import { getPresignedDownloadUrl, uploadFile, UPLOADS_DIR, getPresignedUploadUrl, uploadBuffer, deleteFile } from '../utils/s3.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { triggerWorkflow } from '../utils/workflowEngine.js';
import { classifyAsset } from '../utils/classificationPipeline.js';
import { mimeToFileType } from '../utils/mimeToFileType.js';
import { optimizeAsset } from '../utils/backgroundProcessor.js';
import DownloadLog from '../models/DownloadLog.js';

// @desc    Get all assets with optional filtering and search
// @route   GET /api/assets
// @access  Private
export const getAssets = async (req, res) => {
  const { type, search, category } = req.query;
  const filter = {};

  if (type && ['pdf', 'image', 'word', 'ppt', 'video'].includes(type)) {
    filter.fileType = type;
  }

  if (category) {
    filter.categories = category;
  }

  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { title: searchRegex },
      { description: searchRegex }
    ];
  }

  try {
    const assets = await Asset.find(filter).sort({ uploadedAt: -1 });
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Get Assets Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving assets',
      code: 500
    });
  }
};

// @desc    Get all unique categories
// @route   GET /api/assets/categories
// @access  Private
export const getCategories = async (req, res) => {
  try {
    const categories = await Asset.distinct('categories');
    const sortedCategories = categories.filter(Boolean).sort();
    res.status(200).json({ categories: sortedCategories });
  } catch (error) {
    console.error('Get Categories Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving categories',
      code: 500
    });
  }
};

// @desc    Get single asset details
// @route   GET /api/assets/:id
// @access  Private
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found',
        code: 404
      });
    }
    res.status(200).json({ asset });
  } catch (error) {
    console.error('Get Asset Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error retrieving asset',
      code: 500
    });
  }
};

// @desc    Get presigned download URL for an asset
// @route   GET /api/assets/:id/download
// @access  Private
export const getAssetDownloadUrl = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found',
        code: 404
      });
    }

    let filename = asset.title;
    if (!filename.includes('.')) {
      if (asset.fileType === 'pdf') filename += '.pdf';
      else if (asset.fileType === 'image') filename += '.svg';
      else if (asset.fileType === 'word') filename += '.docx';
      else if (asset.fileType === 'ppt') filename += '.pptx';
      else if (asset.fileType === 'video') filename += '.mp4';
    }

    const isInline = req.query.inline === 'true';
    const downloadUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, filename, isInline);

    // Create secure audit log record for Phase 4.3
    try {
      await DownloadLog.create({
        assetId: asset._id,
        userId: req.user._id,
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    } catch (logErr) {
      console.error('[Audit Log] Failed to write download log:', logErr.message);
    }

    res.status(200).json({ downloadUrl });
  } catch (error) {
    console.error('Get Download URL Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error generating download link',
      code: 500
    });
  }
};

// @desc    Upload new asset (Admin only)
// @route   POST /api/assets/upload
// @access  Private/Admin
export const uploadAsset = async (req, res) => {
  const { title, description, contentHash } = req.body;

  if (!title) {
    // If upload file exists, cleanup temp file first
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({
      error: true,
      message: 'Asset title is required',
      code: 400
    });
  }

  if (!req.file) {
    return res.status(400).json({
      error: true,
      message: 'No file was uploaded',
      code: 400
    });
  }

  try {
    // Check for duplicates using client-side computed contentHash
    if (contentHash) {
      const existing = await Asset.findOne({ contentHash });
      if (existing) {
        console.log(`[Deduplication] Match found for hash ${contentHash} in uploadAsset. Skipping upload.`);
        // Cleanup temp uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(201).json({
          success: true,
          duplicate: true,
          asset: existing
        });
      }
    }
    // Determine fileType and mimeType using MIME utility
    const rawMime = req.file.mimetype || 'application/octet-stream';
    const mimeType = rawMime.split(';')[0].trim().toLowerCase();
    const fileType = mimeToFileType(mimeType);

    const s3Key = `assets/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    const size = req.file.size;

    // Run content-based classification pipeline
    const categories = classifyAsset(req.file.path, title, description);

    // Perform upload to S3 or local directory passing the MIME type
    await uploadFile(req.file.path, s3Key, mimeType);

    // Save record to DB
    const asset = await Asset.create({
      title,
      description,
      fileType,
      mimeType,
      s3Key,
      size,
      uploadedBy: req.user._id,
      categories,
      contentHash: req.body.contentHash || null
    });

    // Run post-upload optimizations in the background asynchronously
    setImmediate(() => {
      optimizeAsset(asset._id.toString()).catch((err) => {
        console.error('[Background Processor] Error running optimization:', err.message);
      });
    });

    // Resolve filenames for URL creation
    let filename = asset.title;
    if (!filename.includes('.')) {
      if (asset.fileType === 'pdf') filename += '.pdf';
      else if (asset.fileType === 'image') filename += '.svg';
      else if (asset.fileType === 'word') filename += '.docx';
      else if (asset.fileType === 'ppt') filename += '.pptx';
      else if (asset.fileType === 'video') filename += '.mp4';
    }

    const assetUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, filename);

    // Trigger workflow event
    const workflowPayload = {
      asset_id: asset._id.toString(),
      asset_name: asset.title,
      asset_type: asset.fileType,
      asset_url: assetUrl,
      thumbnail_url: null,
      uploaded_by: req.user.name,
      uploaded_at: asset.uploadedAt.toISOString(),
      file_size_mb: parseFloat((asset.size / (1024 * 1024)).toFixed(2)),
      description: asset.description || null
    };

    triggerWorkflow('asset.uploaded', workflowPayload).catch(err => {
      console.error('[Workflow Engine] Failed to trigger asset.uploaded workflow:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      asset
    });
  } catch (error) {
    console.error('Upload Asset Error:', error.message);
    // Cleanup temp file if it still exists
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({
      error: true,
      message: 'Server error during asset upload',
      code: 500
    });
  }
};

// @desc    Mock file streaming endpoint (used when AWS S3 credentials are mock)
// @route   GET /api/assets/mock-download/:id
// @access  Public (so the browser redirect opens it directly)
export const streamMockAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).send('Asset not found');
    }

    let contentType = (asset.mimeType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    let filename = asset.title;
    let extension = '';

    if (asset.s3Key) {
      extension = path.extname(asset.s3Key);
    }

    if (!extension) {
      if (asset.fileType === 'pdf') extension = '.pdf';
      else if (asset.fileType === 'image') extension = '.png';
      else if (asset.fileType === 'word') extension = '.docx';
      else if (asset.fileType === 'excel') extension = '.xlsx';
      else if (asset.fileType === 'ppt') extension = '.pptx';
      else if (asset.fileType === 'video') extension = '.mp4';
      else if (asset.fileType === 'audio') extension = '.mp3';
    }

    if (!filename.includes('.')) {
      filename += extension;
    }

    // CHECK IF LOCAL UPLOAD EXISTS IN THE DIRECTORY
    const destPath = path.join(UPLOADS_DIR, asset.s3Key.replace(/\//g, '_'));
    if (fs.existsSync(destPath)) {
      console.log(`Streaming real uploaded local file from: ${destPath}`);
      res.setHeader('Content-Type', contentType);
      const isInline = req.query.inline === 'true';
      res.setHeader('Content-Disposition', `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`);
      const fileStream = fs.createReadStream(destPath);
      return fileStream.pipe(res);
    }

    // FALLBACK TO GENERATING MOCK CONTENT (for seeded database assets)
    let fileContent;
    if (asset.fileType === 'pdf') {
      fileContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [ 3 0 R ] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [ 0 0 595 842 ] /Contents 4 0 R >> endobj
4 0 obj << /Length 75 >> stream
BT
/F1 24 Tf
70 700 Td
(Mock Asset: ${asset.title}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000220 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
345
%%EOF`;
    } else if (asset.fileType === 'image') {
      fileContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
        <rect width="100%" height="100%" fill="#1e1b4b"/>
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
          </linearGradient>
        </defs>
        <circle cx="200" cy="200" r="100" fill="url(#g)"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">
          ${asset.title}
        </text>
        <text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#94a3b8">
          Size: ${Math.round(asset.size / 1024)} KB
        </text>
      </svg>`;
    } else if (asset.fileType === 'word') {
      fileContent = `Mock Word Document: ${asset.title}\nDescription: ${asset.description || ''}\nSize: ${asset.size} bytes`;
    } else if (asset.fileType === 'ppt') {
      fileContent = `Mock PowerPoint Presentation: ${asset.title}\nDescription: ${asset.description || ''}\nSize: ${asset.size} bytes`;
    } else {
      fileContent = `Mock Video Stream: ${asset.title}\nDescription: ${asset.description || ''}\nSize: ${asset.size} bytes`;
    }

    res.setHeader('Content-Type', contentType);
    const isInline = req.query.inline === 'true';
    res.setHeader('Content-Disposition', `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`);
    res.send(Buffer.from(fileContent));
  } catch (error) {
    console.error('Stream Mock Asset Error:', error.message);
    res.status(500).send('Server error downloading mock asset');
  }
};

// @desc    Get presigned upload URL (PUT) for direct S3 uploads
// @route   POST /api/assets/presign
// @access  Private/Admin
export const presignUpload = async (req, res) => {
  const { filename, mimeType, sizeBytes, contentHash } = req.body;

  if (!filename || !mimeType) {
    return res.status(400).json({
      error: true,
      message: 'Filename and MIME type are required',
      code: 400
    });
  }

  try {
    // 1. Check for duplicates using client-side computed contentHash (Phase 3.1)
    if (contentHash) {
      const existing = await Asset.findOne({ contentHash });
      if (existing) {
        console.log(`[Deduplication] Match found for hash ${contentHash}. Skipping upload.`);
        return res.status(200).json({
          duplicate: true,
          existingAsset: existing
        });
      }
    }

    // 2. Generate S3 objectKey and sign PUT URL
    const sanitizedFilename = filename.replace(/\s+/g, '_');
    const objectKey = `assets/${Date.now()}_${sanitizedFilename}`;
    const uploadUrl = await getPresignedUploadUrl(objectKey, mimeType);

    res.status(200).json({
      duplicate: false,
      uploadUrl,
      objectKey
    });
  } catch (error) {
    console.error('Presign Upload Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error generating upload URL',
      code: 500
    });
  }
};

// @desc    Confirm successful browser upload and register asset metadata
// @route   POST /api/assets/confirm-upload
// @access  Private/Admin
export const confirmUpload = async (req, res) => {
  const { objectKey, originalFilename, mimeType, sizeBytes, contentHash, title, description } = req.body;

  if (!objectKey || !title || !mimeType) {
    return res.status(400).json({
      error: true,
      message: 'Asset title, key, and MIME type are required',
      code: 400
    });
  }

  try {
    // 1. Check for duplicates using contentHash
    if (contentHash) {
      const existing = await Asset.findOne({ contentHash });
      if (existing) {
        console.log(`[Deduplication] Match found for hash ${contentHash} in confirmUpload. Skipping duplicate.`);
        return res.status(200).json({
          success: true,
          duplicate: true,
          asset: existing
        });
      }
    }

    const cleanedMimeType = (mimeType || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    const fileType = mimeToFileType(cleanedMimeType);

    // Initial asset creation with basic metadata (before background optimization runs)
    const asset = await Asset.create({
      title,
      description,
      fileType,
      mimeType: cleanedMimeType,
      s3Key: objectKey,
      size: sizeBytes || 0,
      uploadedBy: req.user._id,
      contentHash,
      categories: ['General'] // temporary, classification will optimize this
    });

    // Run post-upload optimizations (compression, keywords, thumbnail) in background
    setImmediate(() => {
      optimizeAsset(asset._id.toString()).catch((err) => {
        console.error('[Background Processor] Error running optimization:', err.message);
      });
    });

    // Resolve filenames for URL creation
    let filename = asset.title;
    if (!filename.includes('.')) {
      if (asset.fileType === 'pdf') filename += '.pdf';
      else if (asset.fileType === 'image') filename += '.svg';
      else if (asset.fileType === 'word') filename += '.docx';
      else if (asset.fileType === 'ppt') filename += '.pptx';
      else if (asset.fileType === 'video') filename += '.mp4';
    }

    const assetUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, filename);

    // Trigger workflow event
    const workflowPayload = {
      asset_id: asset._id.toString(),
      asset_name: asset.title,
      asset_type: asset.fileType,
      asset_url: assetUrl,
      thumbnail_url: null,
      uploaded_by: req.user.name,
      uploaded_at: asset.uploadedAt.toISOString(),
      file_size_mb: parseFloat((asset.size / (1024 * 1024)).toFixed(2)),
      description: asset.description || null
    };

    triggerWorkflow('asset.uploaded', workflowPayload).catch(err => {
      console.error('[Workflow Engine] Failed to trigger asset.uploaded workflow:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Asset confirmed and queued for optimization',
      asset
    });
  } catch (error) {
    console.error('Confirm Upload Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error registering uploaded asset',
      code: 500
    });
  }
};

// @desc    Get secure asset thumbnail (streams local mock thumbnail or redirects to presigned S3 url)
// @route   GET /api/assets/:id/thumbnail
// @access  Private
export const getAssetThumbnail = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset || !asset.thumbnailUrl) {
      return res.status(404).send('Thumbnail not found');
    }

    const isMockMode = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'mock';

    if (isMockMode) {
      const destPath = path.join(UPLOADS_DIR, asset.thumbnailUrl.replace(/\//g, '_'));
      if (fs.existsSync(destPath)) {
        res.setHeader('Content-Type', 'image/webp');
        return fs.createReadStream(destPath).pipe(res);
      }
      return res.status(404).send('Thumbnail file not found');
    }

    // Redirect to secure signed URL for S3 key
    const downloadUrl = await getPresignedDownloadUrl(asset.thumbnailUrl, asset._id, `${asset._id}_thumb.webp`);
    return res.redirect(downloadUrl);
  } catch (error) {
    console.error('Get Asset Thumbnail Error:', error.message);
    res.status(500).send('Server error retrieving thumbnail');
  }
};

// Resolve Google Drive links to direct download links
const resolveDirectDownloadUrl = (url) => {
  if (!url) return '';
  const driveRegExp = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveMatch = url.match(driveRegExp);
  if (driveMatch && driveMatch[1]) {
    return `https://docs.google.com/uc?export=download&id=${driveMatch[1]}`;
  }
  const driveDownloadRegExp = /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/;
  const driveDownloadMatch = url.match(driveDownloadRegExp);
  if (driveDownloadMatch && driveDownloadMatch[1]) {
    return `https://docs.google.com/uc?export=download&id=${driveDownloadMatch[1]}`;
  }
  return url;
};

// @desc    Upload link-based asset (downloads content, uploads to S3/mock, and registers metadata)
// @route   POST /api/assets/upload-link
// @access  Private/Admin
export const uploadLinkAsset = async (req, res) => {
  const { url, title, description } = req.body;

  if (!url || !title) {
    return res.status(400).json({
      error: true,
      message: 'Asset title and URL are required',
      code: 400
    });
  }

  try {
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    const isVimeo = url.includes('vimeo.com');
    
    if (isYouTube || isVimeo) {
      // 1. YouTube/Vimeo links bypass downloading (stored as direct remote video link)
      const linkHash = crypto.createHash('sha256').update(url.trim()).digest('hex');
      const contentHash = `url-${linkHash}`;

      const existing = await Asset.findOne({ contentHash });
      if (existing) {
        return res.status(200).json({
          success: true,
          duplicate: true,
          asset: existing
        });
      }

      const asset = await Asset.create({
        title,
        description,
        fileType: 'video',
        mimeType: 'video/mp4',
        s3Key: url.trim(),
        size: 0,
        uploadedBy: req.user._id,
        contentHash,
        categories: ['General']
      });

      // Run post-upload optimizations in background (categorizes from title/description)
      setImmediate(() => {
        optimizeAsset(asset._id.toString()).catch((err) => {
          console.error('[Background Processor] Error running optimization:', err.message);
        });
      });

      const assetUrl = url.trim();

      // Trigger workflow event
      const workflowPayload = {
        asset_id: asset._id.toString(),
        asset_name: asset.title,
        asset_type: asset.fileType,
        asset_url: assetUrl,
        thumbnail_url: null,
        uploaded_by: req.user.name,
        uploaded_at: asset.uploadedAt.toISOString(),
        file_size_mb: 0,
        description: asset.description || null
      };

      triggerWorkflow('asset.uploaded', workflowPayload).catch(err => {
        console.error('[Workflow Engine] Failed to trigger asset.uploaded workflow:', err.message);
      });

      return res.status(201).json({
        success: true,
        message: 'Video URL asset registered successfully',
        asset
      });
    }

    // 2. Standard document/image links: download and store in cloud
    const resolvedUrl = resolveDirectDownloadUrl(url.trim());
    console.log(`[Upload Link] Resolving URL: ${resolvedUrl}`);

    const fetchRes = await fetch(resolvedUrl);
    if (!fetchRes.ok) {
      return res.status(400).json({
        error: true,
        message: `Failed to download file from link (HTTP Status: ${fetchRes.status})`,
        code: 400
      });
    }

    const rawMime = fetchRes.headers.get('content-type') || 'application/octet-stream';
    const mimeType = rawMime.split(';')[0].trim().toLowerCase();
    const fileType = mimeToFileType(mimeType);

    // Extract filename from headers or URL
    let filename = 'downloaded_file';
    const cd = fetchRes.headers.get('content-disposition');
    if (cd && cd.includes('filename=')) {
      const match = cd.match(/filename="?([^";]+)"?/);
      if (match && match[1]) filename = match[1];
    } else {
      try {
        const parsedUrl = new URL(resolvedUrl);
        const lastSegment = parsedUrl.pathname.substring(parsedUrl.pathname.lastIndexOf('/') + 1);
        if (lastSegment && lastSegment.includes('.')) {
          filename = lastSegment;
        }
      } catch (e) {}
    }

    // Read bytes
    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const size = buffer.length;

    // Deduplication check using file contentHash
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    const existing = await Asset.findOne({ contentHash });
    if (existing) {
      console.log(`[Deduplication] Match found for download hash ${contentHash}. Skipping upload.`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        asset: existing
      });
    }

    // Upload file buffer to S3 or local mock directory
    const sanitizedFilename = filename.replace(/\s+/g, '_');
    const s3Key = `assets/${Date.now()}_${sanitizedFilename}`;
    await uploadBuffer(buffer, s3Key, mimeType);

    // Create DB entry
    const asset = await Asset.create({
      title,
      description,
      fileType,
      mimeType,
      s3Key,
      size,
      uploadedBy: req.user._id,
      contentHash,
      categories: ['General']
    });

    // Run post-upload optimizations (compression, keywords, thumbnail) in background
    setImmediate(() => {
      optimizeAsset(asset._id.toString()).catch((err) => {
        console.error('[Background Processor] Error running optimization:', err.message);
      });
    });

    let previewFilename = asset.title;
    if (!previewFilename.includes('.')) {
      if (asset.fileType === 'pdf') previewFilename += '.pdf';
      else if (asset.fileType === 'image') previewFilename += '.png';
      else if (asset.fileType === 'word') previewFilename += '.docx';
      else if (asset.fileType === 'ppt') previewFilename += '.pptx';
      else if (asset.fileType === 'video') previewFilename += '.mp4';
    }

    const assetUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, previewFilename);

    // Trigger workflow event
    const workflowPayload = {
      asset_id: asset._id.toString(),
      asset_name: asset.title,
      asset_type: asset.fileType,
      asset_url: assetUrl,
      thumbnail_url: null,
      uploaded_by: req.user.name,
      uploaded_at: asset.uploadedAt.toISOString(),
      file_size_mb: parseFloat((asset.size / (1024 * 1024)).toFixed(2)),
      description: asset.description || null
    };

    triggerWorkflow('asset.uploaded', workflowPayload).catch(err => {
      console.error('[Workflow Engine] Failed to trigger asset.uploaded workflow:', err.message);
    });

    res.status(201).json({
      success: true,
      message: 'Asset link downloaded and stored successfully',
      asset
    });
  } catch (err) {
    console.error('[Upload Link Error]:', err.message);
    res.status(501).json({
      error: true,
      message: 'Server error processing link upload',
      code: 500
    });
  }
};

// @desc    Update asset metadata (Admin only)
// @route   PUT /api/assets/:id
// @access  Private/Admin
export const updateAsset = async (req, res) => {
  const { title, description, categories } = req.body;

  if (!title) {
    return res.status(400).json({
      error: true,
      message: 'Asset title is required',
      code: 400
    });
  }

  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found',
        code: 404
      });
    }

    asset.title = title;
    asset.description = description;

    if (categories && Array.isArray(categories)) {
      asset.categories = categories.map(c => c.trim()).filter(Boolean);
    } else if (typeof categories === 'string') {
      asset.categories = categories.split(',').map(c => c.trim()).filter(Boolean);
    }

    await asset.save();

    // Trigger workflow event
    let previewFilename = asset.title;
    if (!previewFilename.includes('.')) {
      if (asset.fileType === 'pdf') previewFilename += '.pdf';
      else if (asset.fileType === 'image') previewFilename += '.png';
      else if (asset.fileType === 'word') previewFilename += '.docx';
      else if (asset.fileType === 'ppt') previewFilename += '.pptx';
      else if (asset.fileType === 'video') previewFilename += '.mp4';
    }
    const assetUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, previewFilename);

    const workflowPayload = {
      asset_id: asset._id.toString(),
      asset_name: asset.title,
      asset_type: asset.fileType,
      asset_url: assetUrl,
      thumbnail_url: asset.thumbnailUrl ? await getPresignedDownloadUrl(asset.thumbnailUrl, asset._id, `${asset._id}_thumb.webp`) : null,
      uploaded_by: req.user.name,
      uploaded_at: asset.uploadedAt.toISOString(),
      file_size_mb: parseFloat((asset.size / (1024 * 1024)).toFixed(2)),
      description: asset.description || null
    };

    triggerWorkflow('asset.updated', workflowPayload).catch(err => {
      console.error('[Workflow Engine] Failed to trigger asset.updated workflow:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    console.error('Update Asset Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error updating asset details',
      code: 500
    });
  }
};

// @desc    Delete asset and physical files (Admin only)
// @route   DELETE /api/assets/:id
// @access  Private/Admin
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        error: true,
        message: 'Asset not found',
        code: 404
      });
    }

    // 1. Delete original asset file from storage
    if (asset.s3Key) {
      await deleteFile(asset.s3Key);
    }

    // 2. Delete thumbnail file from storage if present
    if (asset.thumbnailUrl) {
      await deleteFile(asset.thumbnailUrl);
    }

    // 3. Delete database record
    await Asset.findByIdAndDelete(req.params.id);

    // Trigger workflow event
    const workflowPayload = {
      asset_id: asset._id.toString(),
      asset_name: asset.title,
      asset_type: asset.fileType,
      deleted_by: req.user.name,
      deleted_at: new Date().toISOString()
    };

    triggerWorkflow('asset.deleted', workflowPayload).catch(err => {
      console.error('[Workflow Engine] Failed to trigger asset.deleted workflow:', err.message);
    });

    res.status(200).json({
      success: true,
      message: 'Asset and associated files deleted successfully'
    });
  } catch (error) {
    console.error('Delete Asset Error:', error.message);
    res.status(500).json({
      error: true,
      message: 'Server error deleting asset',
      code: 500
    });
  }
};
