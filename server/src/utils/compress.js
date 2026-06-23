import sharp from 'sharp';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

const execFileAsync = promisify(execFile);

/**
 * Compresses an image buffer using sharp, resizing and converting to WebP.
 * @param {Buffer} buffer - Raw file buffer
 * @param {string} mimeType - MIME type of the original file
 * @returns {Promise<{ buffer: Buffer, mimeType: string }>} Compressed buffer and new MIME type
 */
export async function compressImage(buffer, mimeType) {
  try {
    let pipeline = sharp(buffer)
      .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
      .rotate(); // auto-rotate from EXIF metadata

    // We convert everything to high-performance WebP
    if (mimeType === 'image/png') {
      pipeline = pipeline.webp({ quality: 85 });
      return { buffer: await pipeline.toBuffer(), mimeType: 'image/webp' };
    }

    pipeline = pipeline.webp({ quality: 82 });
    return { buffer: await pipeline.toBuffer(), mimeType: 'image/webp' };
  } catch (error) {
    console.error('[Compression Utility] Image compression failed, returning raw buffer:', error.message);
    return { buffer, mimeType };
  }
}

/**
 * Compresses a PDF buffer using Ghostscript.
 * Gracefully falls back to the original buffer if Ghostscript is missing or fails.
 * @param {Buffer} inputBuffer - Original PDF buffer
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
export async function compressPdf(inputBuffer) {
  const inPath = path.join(tmpdir(), `in-${Date.now()}.pdf`);
  const outPath = path.join(tmpdir(), `out-${Date.now()}.pdf`);
  
  try {
    await writeFile(inPath, inputBuffer);
    await execFileAsync('gs', [
      '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4',
      '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dBATCH',
      `-sOutputFile=${outPath}`, inPath,
    ]);
    const compressed = await readFile(outPath);
    await unlink(inPath);
    await unlink(outPath);
    return compressed;
  } catch (err) {
    // Graceful fallback to original PDF
    try { await unlink(inPath); } catch (e) {}
    try { await unlink(outPath); } catch (e) {}
    console.log('[Compression Utility] Ghostscript PDF compression not available or failed. Storing original.');
    return inputBuffer;
  }
}
