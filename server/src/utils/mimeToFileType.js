export function mimeToFileType(mimeType) {
  if (!mimeType) return 'other';
  const cleanMime = mimeType.split(';')[0].trim().toLowerCase();
  
  if (cleanMime.startsWith('image/')) return 'image';
  if (cleanMime.startsWith('video/')) return 'video';
  if (cleanMime.startsWith('audio/')) return 'audio';
  if (cleanMime === 'application/pdf') return 'pdf';
  if (
    cleanMime === 'application/msword' ||
    cleanMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) return 'word';
  if (
    cleanMime === 'application/vnd.ms-excel' ||
    cleanMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) return 'excel';
  if (
    cleanMime === 'application/vnd.ms-powerpoint' ||
    cleanMime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) return 'powerpoint';
  if (cleanMime === 'text/plain' || cleanMime === 'text/csv') return 'text';
  if (cleanMime.includes('zip') || cleanMime.includes('tar') || cleanMime.includes('7z')) return 'archive';
  return 'other';
}
