import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
export const getPresignedDownloadUrl = async (key, assetId, filename) => {
  if (isMockMode || !s3Client) {
    // Return a mock download URL pointing to our Express server
    const serverUrl = `http://localhost:${process.env.PORT || 5000}`;
    return `${serverUrl}/api/assets/mock-download/${assetId}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME || 'asset-management-bucket',
      Key: key,
      ResponseContentDisposition: `attachment; filename="${filename}"`
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
export const uploadFile = async (tempFilePath, key) => {
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
      Body: fileBuffer
    }));
    fs.unlinkSync(tempFilePath); // Remove temp file
    console.log(`AWS S3 Upload: Saved file in bucket at key ${key}`);
    return true;
  } catch (err) {
    console.error('S3 upload file failed:', err.message);
    throw new Error('Failed to upload file to S3');
  }
};
