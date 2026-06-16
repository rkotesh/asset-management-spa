import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { pageVariant } from '../animations/variants';
import { ArrowLeft, Download, Calendar, HardDrive, ShieldCheck, FileText, Image as ImageIcon, FileCode, Loader2 } from 'lucide-react';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  
  const [asset, setAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(-1); // -1 means idle

  useEffect(() => {
    const fetchAsset = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/assets/${id}`);
        setAsset(res.data.asset);
      } catch (err) {
        addToast(err.message || 'Failed to load asset details.', 'error');
        navigate('/assets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAsset();
  }, [id, navigate, addToast]);

  const handleDownload = async () => {
    if (downloadProgress !== -1) return;

    setDownloadProgress(0);
    addToast(`Retrieving secure download token...`, 'info');

    const duration = 1500; // 1.5s
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);
    
    let currentProgress = 0;
    
    const timer = setInterval(async () => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setDownloadProgress(100);

        try {
          const res = await apiClient.get(`/assets/${id}/download`);
          window.open(res.data.downloadUrl, '_blank');
          addToast('File downloaded successfully!', 'success');
        } catch (err) {
          addToast(err.message || 'Failed to download file.', 'error');
        } finally {
          setTimeout(() => setDownloadProgress(-1), 600);
        }
      } else {
        setDownloadProgress(Math.min(Math.round(currentProgress), 99));
      }
    }, intervalTime);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText size={48} className="text-rose-400" />;
      case 'image':
        return <ImageIcon size={48} className="text-emerald-400" />;
      case 'text':
        return <FileCode size={48} className="text-sky-400" />;
      default:
        return <FileText size={48} className="text-neutral-400" />;
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formattedDate = asset?.uploadedAt
    ? new Date(asset.uploadedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (!asset) return null;

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-4xl mx-auto py-8 px-4"
    >
      {/* Back Button */}
      <Link
        to="/assets"
        className="inline-flex items-center text-sm font-semibold text-neutral-400 hover:text-white transition-colors mb-6 group"
      >
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Asset Library
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left/Top: Preview Card */}
        <div className="md:col-span-2">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[300px] text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
            
            {/* Conditional Preview */}
            {asset.fileType === 'image' ? (
              // S3 Mock images are SVGs served directly from the mock download route!
              // Since the mock download route is public, we can just point the <img> src to it!
              // This is a brilliant integration feature!
              <div className="w-full aspect-square bg-neutral-900/50 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800">
                <img
                  src={`http://localhost:5000/api/assets/mock-download/${asset._id}`}
                  alt={asset.title}
                  className="w-full h-full object-contain p-2 hover:scale-105 transition-transform duration-300"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner mb-4 group-hover:scale-105 transition-transform duration-300">
                  {getFileIcon(asset.fileType)}
                </div>
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                  Secure {asset.fileType} File
                </span>
                <span className="text-sm font-semibold text-white truncate max-w-[200px]">
                  {asset.s3Key.split('/').pop()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right/Bottom: Metadata Details & Download */}
        <div className="md:col-span-3 space-y-6">
          <div className="glass-card p-6 rounded-2xl space-y-5 relative">
            <div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 capitalize mb-3">
                {asset.fileType} file
              </div>
              <h2 className="text-2xl font-bold text-white leading-snug">{asset.title}</h2>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-950/40 p-4 rounded-xl border border-neutral-900">
              {asset.description || 'No description provided for this asset.'}
            </p>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4 py-2 border-t border-b border-neutral-800">
              <div className="flex items-center space-x-2.5">
                <HardDrive size={16} className="text-neutral-500" />
                <div>
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">File Size</span>
                  <span className="text-sm text-white font-medium">{formatSize(asset.size)}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Calendar size={16} className="text-neutral-500" />
                <div>
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Uploaded On</span>
                  <span className="text-sm text-white font-medium">{formattedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-neutral-400">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Signed URL expires in 60 seconds after request.</span>
            </div>

            {/* Download Button with Progress bar */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={downloadProgress !== -1}
                className="w-full relative overflow-hidden py-3.5 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {downloadProgress !== -1 ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Preparing Secure File ({downloadProgress}%)</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Retrieve & Download from S3</span>
                  </>
                )}

                {/* Animated Inner Progress Background */}
                {downloadProgress !== -1 && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: `${downloadProgress - 100}%` }}
                    transition={{ duration: 0.1 }}
                    className="absolute inset-0 bg-neutral-900/10 pointer-events-none"
                  />
                )}
              </motion.button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default AssetDetailPage;
