import Asset from '../models/Asset.js';
import { getPresignedDownloadUrl, uploadFile, UPLOADS_DIR } from '../utils/s3.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all assets with optional filtering and search
// @route   GET /api/assets
// @access  Private
export const getAssets = async (req, res) => {
  const { type, search } = req.query;
  const filter = {};

  if (type && ['pdf', 'image', 'text'].includes(type)) {
    filter.fileType = type;
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
      else if (asset.fileType === 'text') filename += '.txt';
    }

    const downloadUrl = await getPresignedDownloadUrl(asset.s3Key, asset._id, filename);
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
  const { title, description } = req.body;

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
    // Determine fileType
    const mime = req.file.mimetype;
    let fileType = 'text';

    if (mime.includes('pdf')) {
      fileType = 'pdf';
    } else if (mime.includes('image')) {
      fileType = 'image';
    } else if (mime.includes('text') || req.file.originalname.match(/\.(txt|json|js|html|css|md|sql)$/i)) {
      fileType = 'text';
    }

    const s3Key = `assets/${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
    const size = req.file.size;

    // Perform upload to S3 or local directory
    await uploadFile(req.file.path, s3Key);

    // Save record to DB
    const asset = await Asset.create({
      title,
      description,
      fileType,
      s3Key,
      size
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

    let filename = asset.title;
    let extension = '';
    let contentType = 'text/plain';

    if (asset.fileType === 'pdf') {
      contentType = 'application/pdf';
      extension = '.pdf';
    } else if (asset.fileType === 'image') {
      // Mock images are SVG, but uploaded images can be PNG, JPEG, SVG etc.
      // We will look at S3 key extension to determine correct mimetype if it is a real local upload
      const ext = path.extname(asset.s3Key).toLowerCase();
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else contentType = 'image/svg+xml';
      extension = ext || '.svg';
    } else {
      contentType = 'text/plain';
      extension = '.txt';
    }

    if (!filename.includes('.')) {
      filename += extension;
    }

    // CHECK IF LOCAL UPLOAD EXISTS IN THE DIRECTORY
    const destPath = path.join(UPLOADS_DIR, asset.s3Key.replace(/\//g, '_'));
    if (fs.existsSync(destPath)) {
      console.log(`Streaming real uploaded local file from: ${destPath}`);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
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
    } else {
      fileContent = `Asset Name: ${asset.title}\nDescription: ${asset.description || 'No description provided'}\nSize: ${asset.size} bytes\nUploaded At: ${asset.uploadedAt}\n\nThis is a mock text file contents generated by the server.`;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(fileContent));
  } catch (error) {
    console.error('Stream Mock Asset Error:', error.message);
    res.status(500).send('Server error downloading mock asset');
  }
};
