import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

let s3Client = null;
const isMockMode = !process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID === 'mock';

if (!isMockMode) {
  try {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    console.log('AWS S3: Client initialized in cloud mode.');
  } catch (err) {
    console.error('AWS S3: Initialization failed, falling back to mock mode.', err.message);
  }
} else {
  console.log('AWS S3: Running in local mock mode.');
}

/**
 * Generates a presigned download URL for an asset
 * @param {string} key - S3 Key or identifier of the asset
 * @param {string} assetId - Database ID of the asset (used for mock streaming URL fallback)
 * @param {string} filename - Filename of the asset
 * @returns {Promise<string>} - The presigned or mock download URL
 */
export const getPresignedDownloadUrl = async (key, assetId, filename, isInline) => {
  if (key && (key.startsWith('http://') || key.startsWith('https://'))) {
    return key;
  }

  if (isMockMode || !s3Client) {
    // Return a mock download URL pointing to our Express server
    const serverUrl = `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/api/assets/mock-download/${assetId}${isInline ? '?inline=true' : ''}`;
  }

  try {
    const dispositionType = isInline ? 'inline' : 'attachment';
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key,
      ResponseContentDisposition: `${dispositionType}; filename="${filename}"`
    });

    // Generate signed URL expiring in 60s
    return await getSignedUrl(s3Client, command, { expiresIn: 60 });
  } catch (error) {
    console.error('S3 signed URL generation failed:', error.message);
    throw new Error('Failed to generate secure download URL');
  }
};

/**
 * Uploads a file to AWS S3 or saves it locally in mock mode
 * @param {string} tempFilePath - Temporary path where multer saved the file
 * @param {string} key - S3 Key path under which to save the file
 * @returns {Promise<boolean>}
 */
export const uploadFile = async (tempFilePath, key, mimeType) => {
  if (isMockMode || !s3Client) {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      
      const destPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
      fs.copyFileSync(tempFilePath, destPath);
      fs.unlinkSync(tempFilePath); // Remove temp file
      console.log(`Mock S3 Upload: Saved file locally at ${destPath}`);
      return true;
    } catch (err) {
      console.error('Mock upload file copy failed:', err.message);
      throw new Error('Failed to copy file locally in mock mode');
    }
  }

  try {
    const fileBuffer = fs.readFileSync(tempFilePath);
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType || 'application/octet-stream'
    }));
    fs.unlinkSync(tempFilePath); // Remove temp file
    console.log(`AWS S3 Upload: Saved file in bucket at key ${key}`);
    return true;
  } catch (err) {
    console.error('S3 upload file failed:', err.message);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Generates a presigned upload URL (PUT) for browser-to-S3 direct upload.
 * Falls back to 'mock://local' when in mock mode.
 * @param {string} objectKey - Destination S3 key
 * @param {string} mimeType - MIME type of the file
 * @returns {Promise<string>} Upload URL
 */
export const getPresignedUploadUrl = async (objectKey, mimeType) => {
  if (isMockMode || !s3Client) {
    return 'mock://local';
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: objectKey,
      ContentType: mimeType
    });

    return await getSignedUrl(s3Client, command, { expiresIn: 300 });
  } catch (error) {
    console.error('S3 signed PUT URL generation failed:', error.message);
    throw new Error('Failed to generate secure upload URL');
  }
};

/**
 * Downloads a file buffer from S3.
 * @param {string} key - S3 object key
 * @returns {Promise<Buffer>} File buffer
 */
export const getFileBuffer = async (key) => {
  if (isMockMode || !s3Client) {
    const destPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
    if (fs.existsSync(destPath)) {
      return fs.readFileSync(destPath);
    }
    throw new Error('Local mock file not found');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key
    });
    const response = await s3Client.send(command);
    
    return new Promise((resolve, reject) => {
      const chunks = [];
      response.Body.on('data', (chunk) => chunks.push(chunk));
      response.Body.on('error', reject);
      response.Body.on('end', () => resolve(Buffer.concat(chunks)));
    });
  } catch (err) {
    console.error('S3 download to buffer failed:', err.message);
    throw new Error('Failed to download S3 file');
  }
};

/**
 * Uploads an in-memory buffer to S3 or saves locally in mock mode.
 * @param {Buffer} buffer - Buffer content to upload
 * @param {string} key - Target S3 key
 * @param {string} mimeType - MIME type of the content
 * @returns {Promise<boolean>}
 */
export const uploadBuffer = async (buffer, key, mimeType) => {
  if (isMockMode || !s3Client) {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const destPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
      fs.writeFileSync(destPath, buffer);
      console.log(`Mock S3 Upload Buffer: Saved buffer locally at ${destPath}`);
      return true;
    } catch (err) {
      console.error('Mock upload buffer write failed:', err.message);
      throw new Error('Failed to save buffer locally in mock mode');
    }
  }

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key,
      Body: buffer,
      ContentType: mimeType || 'application/octet-stream'
    }));
    console.log(`AWS S3 Upload Buffer: Saved buffer in bucket at key ${key}`);
    return true;
  } catch (err) {
    console.error('S3 upload buffer failed:', err.message);
    throw new Error('Failed to upload buffer to S3');
  }
};

/**
 * Deletes a file from AWS S3 or the local mock directory
 * @param {string} key - S3 key or local file key
 * @returns {Promise<boolean>}
 */
export const deleteFile = async (key) => {
  if (!key) return false;

  // If key is a remote URL (like YouTube/Vimeo), nothing to delete physically
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return true;
  }

  if (isMockMode || !s3Client) {
    try {
      const destPath = path.join(UPLOADS_DIR, key.replace(/\//g, '_'));
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        console.log(`Mock S3 Delete: Deleted file locally at ${destPath}`);
      }
      return true;
    } catch (err) {
      console.error('Mock delete file failed:', err.message);
      throw new Error('Failed to delete file locally in mock mode');
    }
  }

  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key
    }));
    console.log(`AWS S3 Delete: Deleted file in bucket at key ${key}`);
    return true;
  } catch (err) {
    console.error('S3 delete file failed:', err.message);
    throw new Error('Failed to delete file from S3');
  }
};

