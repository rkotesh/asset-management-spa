import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/apiClient';
import { pageVariant } from '../animations/variants';
import { ArrowLeft, Download, Calendar, HardDrive, ShieldCheck, FileText, Image as ImageIcon, Loader2, Video as VideoIcon, Presentation, Edit, Trash2 } from 'lucide-react';
import FileViewer from '../components/FileViewer';
import EditAssetModal from '../components/EditAssetModal';

const AssetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://secure-vault.com';
  const canonicalUrl = `${siteUrl}/assets/${id}`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      {
        '@type': 'ListItem',
        'position': 1,
        'name': 'Home',
        'item': siteUrl
      },
      {
        '@type': 'ListItem',
        'position': 2,
        'name': 'Assets',
        'item': `${siteUrl}/assets`
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': 'Asset Detail',
        'item': canonicalUrl
      }
    ]
  };
  
  const [asset, setAsset] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(-1); // -1 means idle
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete this asset and all associated optimized files? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    addToast('Deleting asset...', 'info');

    try {
      await apiClient.delete(`/assets/${id}`);
      addToast('Asset deleted successfully.', 'success');
      navigate('/assets');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Failed to delete asset.', 'error');
    }
  };

  useEffect(() => {
    const fetchAssetAndUrl = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/assets/${id}`);
        setAsset(res.data.asset);

        // Fetch download/preview URL with inline=true to prevent browser auto-download
        const dlRes = await apiClient.get(`/assets/${id}/download?inline=true`);
        setDownloadUrl(dlRes.data.downloadUrl);
      } catch (err) {
        addToast(err.message || 'Failed to load asset details.', 'error');
        navigate('/assets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssetAndUrl();
  }, [id, navigate, addToast]);

  const handleDownload = async () => {
    if (downloadProgress !== -1) return;

    setDownloadProgress(0);
    addToast(`Retrieving secure download token...`, 'info');

    const duration = 1200; // 1.2s
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);
    
    let currentProgress = 0;
    
    const timer = setInterval(async () => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setDownloadProgress(100);

        try {
          // Always fetch a fresh attachment download URL (inline=false) to ensure correct headers and logging
          const res = await apiClient.get(`/assets/${id}/download`);
          const targetUrl = res.data.downloadUrl;
          window.open(targetUrl, '_blank');
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
      case 'word':
        return <FileText size={48} className="text-blue-400" />;
      case 'ppt':
      case 'powerpoint':
        return <Presentation size={48} className="text-amber-400" />;
      case 'video':
        return <VideoIcon size={48} className="text-purple-400" />;
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

  const productSchema = asset ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': asset.title,
    'description': asset.description || 'Secure presentation, document, video, or image file stored in vault.',
    'image': asset.thumbnailUrl || `${siteUrl}/default-thumbnail.png`,
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
      'availability': 'https://schema.org/InStock'
    }
  } : null;

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-5xl mx-auto py-8 px-4 space-y-8"
    >
      <Helmet>
        <title>{asset ? `${asset.title} - Secure Vault` : 'Asset Details - Secure Vault'}</title>
        <meta name="description" content={asset ? (asset.description || `View details of the secure asset ${asset.title}.`) : 'View details of the secure asset.'} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        {productSchema && (
          <script type="application/ld+json">
            {JSON.stringify(productSchema)}
          </script>
        )}
      </Helmet>
      {/* Back Button */}
      <Link
        to="/assets"
        className="inline-flex items-center text-sm font-semibold text-neutral-400 hover:text-white transition-colors mb-2 group"
      >
        <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Asset Library
      </Link>

      {/* Top Section: Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Left/Top: General File Info Card */}
        <div className="md:col-span-2">
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center min-h-[260px] text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
            
            <div className="flex flex-col items-center">
              <div className="p-6 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-inner mb-4 group-hover:scale-105 transition-transform duration-300">
                {getFileIcon(asset.fileType)}
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
                Secure {asset.fileType} File
              </span>
              <span className="text-sm font-semibold text-white truncate max-w-[200px]" title={asset.title}>
                {asset.s3Key.split('/').pop()}
              </span>
            </div>
          </div>
        </div>

        {/* Right/Bottom: Metadata Details & Download */}
        <div className="md:col-span-3">
          <div className="glass-card p-6 rounded-2xl space-y-5 relative h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 capitalize">
                      {asset.fileType} file
                    </span>
                    {asset.categories && asset.categories.map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-xs font-semibold text-accent-400 capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-snug">{asset.title}</h2>
                </div>
                
                {/* Admin CRUD options */}
                {user?.role === 'admin' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setIsEditOpen(true)}
                      className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors border border-neutral-700"
                      title="Edit Asset"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 transition-colors border border-red-900/30"
                      title="Delete Asset"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-sm text-neutral-300 leading-relaxed bg-neutral-950/40 p-4 rounded-xl border border-neutral-900 max-h-[120px] overflow-y-auto">
                {asset.description || 'No description provided for this asset.'}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-neutral-900">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
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
                <span>Secure access authorized. URL expires shortly.</span>
              </div>

              {/* Download Button with Progress bar */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownload}
                  disabled={downloadProgress !== -1}
                  className="w-full relative overflow-hidden py-3 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
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

      </div>

      {/* Bottom Section: Inline Document Preview Panel */}
      {downloadUrl && (
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
          <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
            <ShieldCheck size={18} className="text-primary-400" />
            <span>Secure Inline Preview</span>
          </h3>
          <FileViewer
            fileType={asset.fileType}
            fileUrl={downloadUrl}
            mimeType={asset.mimeType}
            filename={asset.title}
          />
        </div>
      )}

      {/* Edit Asset Modal */}
      <EditAssetModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        asset={asset}
        onUpdateSuccess={(updatedAsset) => {
          setAsset(updatedAsset);
          // Refresh download url to get current metadata in presigned URL signatures
          apiClient.get(`/assets/${id}/download?inline=true`).then(dlRes => {
            setDownloadUrl(dlRes.data.downloadUrl);
          });
        }}
      />
    </motion.div>
  );
};

export default AssetDetailPage;
