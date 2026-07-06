import React, { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, FileArchive, HelpCircle, AlertCircle, Download, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  
  // 1. Try to check for playlist parameter first
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      const listId = parsed.searchParams.get('list');
      if (listId) {
        return `https://www.youtube.com/embed/videoseries?list=${listId}`;
      }
    }
  } catch (e) {}

  // 2. Fallback to standard video ID match
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

const getVimeoEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
  const match = url.match(regExp);
  if (match && match[3]) {
    return `https://player.vimeo.com/video/${match[3]}`;
  }
  return null;
};

const FileViewer = ({ fileType, fileUrl, mimeType, filename }) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Standardize and clean mimeType
  const cleanMime = (mimeType || '').split(';')[0].trim().toLowerCase();

  // Get extension from filename
  const getExtension = (name) => {
    if (!name) return '';
    const parts = name.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };
  const ext = getExtension(filename);

  let effectiveFileType = fileType;

  // If fileType is 'other' or empty, run fallback classifier
  if (!effectiveFileType || effectiveFileType === 'other') {
    if (cleanMime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      effectiveFileType = 'image';
    } else if (cleanMime === 'application/pdf' || ext === 'pdf') {
      effectiveFileType = 'pdf';
    } else if (
      cleanMime === 'application/msword' ||
      cleanMime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      ['doc', 'docx'].includes(ext)
    ) {
      effectiveFileType = 'word';
    } else if (
      cleanMime === 'application/vnd.ms-excel' ||
      cleanMime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      ['xls', 'xlsx'].includes(ext)
    ) {
      effectiveFileType = 'excel';
    } else if (
      cleanMime === 'application/vnd.ms-powerpoint' ||
      cleanMime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      ['ppt', 'pptx'].includes(ext)
    ) {
      effectiveFileType = 'powerpoint';
    } else if (cleanMime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)) {
      effectiveFileType = 'video';
    } else if (cleanMime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'ogg'].includes(ext)) {
      effectiveFileType = 'audio';
    } else if (cleanMime === 'text/plain' || cleanMime === 'text/csv' || ['txt', 'csv'].includes(ext)) {
      effectiveFileType = 'text';
    } else if (cleanMime.includes('zip') || cleanMime.includes('tar') || cleanMime.includes('7z') || ['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      effectiveFileType = 'archive';
    }
  }

  useEffect(() => {
    setError(null);
    setContent('');

    if (effectiveFileType === 'text') {
      setIsLoading(true);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch text content');
          return res.text();
        })
        .then((text) => {
          setContent(text);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    } else if (effectiveFileType === 'word') {
      setIsLoading(true);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch Word document');
          return res.arrayBuffer();
        })
        .then(async (buffer) => {
          try {
            const mammoth = await import('mammoth');
            const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
            setContent(result.value || '<p className="text-neutral-400">Empty document</p>');
          } catch (err) {
            setError('Error parsing Word document metadata.');
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    } else if (effectiveFileType === 'excel') {
      setIsLoading(true);
      fetch(fileUrl)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch Excel sheet');
          return res.arrayBuffer();
        })
        .then(async (buffer) => {
          try {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet, {
              editable: false,
              header: '',
              footer: ''
            });
            setContent(html);
          } catch (err) {
            setError('Error parsing Excel spreadsheet.');
          }
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setIsLoading(false);
        });
    }
  }, [fileUrl, effectiveFileType]);

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-neutral-950/40 rounded-xl border border-neutral-900">
      <Loader2 size={32} className="animate-spin text-primary-500 mb-2" />
      <span className="text-xs text-neutral-400">Loading document preview...</span>
    </div>
  );

  const renderError = (customMsg) => (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-neutral-950/40 rounded-xl border border-red-500/10">
      <AlertCircle size={32} className="text-red-500 mb-2" />
      <span className="text-sm font-semibold text-white mb-1">Preview Generation Failed</span>
      <span className="text-xs text-neutral-400 max-w-xs mb-4">{customMsg || error || 'Failed to render document preview.'}</span>
      <a
        href={fileUrl}
        download
        className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 rounded-lg transition-colors inline-flex items-center space-x-1.5"
      >
        <Download size={13} />
        <span>Download to View</span>
      </a>
    </div>
  );

  if (isLoading) return renderLoading();
  if (error) return renderError();

  switch (effectiveFileType) {
    case 'image':
      return (
        <div className="w-full bg-neutral-950/20 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-850 p-2">
          <img
            src={fileUrl}
            alt={filename}
            loading="lazy"
            className="max-h-[70vh] object-contain rounded hover:scale-[1.01] transition-transform duration-300"
          />
        </div>
      );

    case 'pdf':
      return (
        <div className="w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-850 shadow-inner">
          <iframe
            src={`${fileUrl}#toolbar=0`}
            title="PDF Preview"
            className="w-full h-[70vh] border-0"
          />
        </div>
      );

    case 'video': {
      const ytEmbedUrl = getYouTubeEmbedUrl(fileUrl);
      if (ytEmbedUrl) {
        return (
          <div className="w-full bg-black rounded-xl overflow-hidden border border-neutral-850 flex items-center justify-center aspect-video">
            <iframe
              src={ytEmbedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full min-h-[400px] aspect-video"
            />
          </div>
        );
      }

      const vimeoEmbedUrl = getVimeoEmbedUrl(fileUrl);
      if (vimeoEmbedUrl) {
        return (
          <div className="w-full bg-black rounded-xl overflow-hidden border border-neutral-850 flex items-center justify-center aspect-video">
            <iframe
              src={vimeoEmbedUrl}
              title="Vimeo video player"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full min-h-[400px] aspect-video"
            />
          </div>
        );
      }

      return (
        <div className="w-full bg-black rounded-xl overflow-hidden border border-neutral-850 flex items-center justify-center">
          <video src={fileUrl} controls className="w-full max-h-[70vh] object-contain" />
        </div>
      );
    }

    case 'audio':
      return (
        <div className="w-full bg-neutral-950 p-6 rounded-xl border border-neutral-850 flex items-center justify-center shadow-inner">
          <audio src={fileUrl} controls className="w-full max-w-lg" />
        </div>
      );

    case 'text':
      return (
        <div className="w-full bg-neutral-950/80 p-4 rounded-xl border border-neutral-850 shadow-inner overflow-auto max-h-[60vh]">
          <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        </div>
      );

    case 'word':
      return (
        <div className="w-full bg-white text-neutral-900 p-6 sm:p-8 rounded-xl border border-neutral-200 shadow-xl overflow-auto max-h-[70vh] prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      );

    case 'excel':
      return (
        <div className="w-full bg-white text-neutral-900 p-4 rounded-xl border border-neutral-200 shadow-xl overflow-auto max-h-[70vh]">
          <div 
            className="excel-table-container overflow-x-auto text-xs" 
            dangerouslySetInnerHTML={{ __html: content }} 
          />
          {/* Custom scoped styling to format standard table tags generated by xlsx parser */}
          <style>{`
            .excel-table-container table { border-collapse: collapse; width: 100%; }
            .excel-table-container th, .excel-table-container td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
            .excel-table-container tr:nth-child(even) { background-color: #f8fafc; }
          `}</style>
        </div>
      );

    case 'powerpoint':
      // PowerPoint requires a publicly reachable S3 URL to render inside the Office embed preview.
      // If mock url or local network ip, fall back immediately.
      const isLocal = fileUrl.includes('localhost') || fileUrl.includes('127.0.0.1') || fileUrl.startsWith('mock://');
      if (isLocal) {
        return renderError('PowerPoint previews require a public, cloud-accessible S3 file. Please download to view locally.');
      }
      return (
        <div className="w-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-850">
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            title="PowerPoint Preview"
            className="w-full h-[70vh] border-0"
          />
        </div>
      );

    case 'archive':
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-neutral-950/40 rounded-xl border border-neutral-900">
          <FileArchive size={48} className="text-primary-400 mb-3" />
          <span className="text-sm font-semibold text-white mb-1">Archive File (ZIP/TAR/7z)</span>
          <span className="text-xs text-neutral-400 max-w-xs mb-4">Inline previews are not supported for compressed archive files.</span>
          <a
            href={fileUrl}
            download
            className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/10 transition-all text-xs inline-flex items-center space-x-1.5"
          >
            <Download size={13} />
            <span>Download Archive</span>
          </a>
        </div>
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-neutral-950/40 rounded-xl border border-neutral-900">
          <HelpCircle size={48} className="text-neutral-500 mb-3" />
          <span className="text-sm font-semibold text-white mb-1">Preview Unavailable</span>
          <span className="text-xs text-neutral-400 max-w-xs mb-4">This file type is not supported for inline rendering.</span>
          <a
            href={fileUrl}
            download
            className="px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/10 transition-all text-xs inline-flex items-center space-x-1.5"
          >
            <Download size={13} />
            <span>Download File</span>
          </a>
        </div>
      );
  }
};

export default FileViewer;
