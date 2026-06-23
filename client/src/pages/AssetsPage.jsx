import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/apiClient';
import { pageVariant, staggerContainer, cardVariant, fadeIn } from '../animations/variants';
import { Search, FileText, Image as ImageIcon, Download, FolderOpen, Loader2, ArrowRight, Upload, Video as VideoIcon, Presentation } from 'lucide-react';
import UploadAssetModal from '../components/UploadAssetModal';

const AssetsPage = () => {
  const [assets, setAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getThumbnailUrl = (assetId) => {
    const baseURL = apiClient.defaults.baseURL || '';
    const apiBase = baseURL.endsWith('/api') ? baseURL.slice(0, -4) : baseURL;
    return `${apiBase}/api/assets/${assetId}/thumbnail`;
  };
  
  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or category name

  // Downloading progress state: { [assetId]: percentage }
  const [downloadsInProgress, setDownloadsInProgress] = useState({});

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Debounce search value by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  // Fetch unique categories list
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get('/assets/categories');
        setCategories(res.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err.message);
      }
    };
    fetchCategories();
  }, [refreshTrigger]);

  // Fetch assets whenever search, tab, or refresh trigger changes
  useEffect(() => {
    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const categoryQuery = activeTab !== 'all' ? `category=${encodeURIComponent(activeTab)}` : '';
        const searchQuery = searchTerm ? `search=${encodeURIComponent(searchTerm)}` : '';
        const params = [categoryQuery, searchQuery].filter(Boolean).join('&');
        const url = `/assets${params ? `?${params}` : ''}`;
        
        const res = await apiClient.get(url);
        setAssets(res.data.assets);
      } catch (err) {
        addToast(err.message || 'Failed to fetch assets.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssets();
  }, [searchTerm, activeTab, refreshTrigger, addToast]);

  const handleDownload = async (e, asset) => {
    e.stopPropagation(); // Avoid triggering card navigation click
    
    const assetId = asset._id;
    if (downloadsInProgress[assetId] !== undefined) return; // Already downloading

    // Start simulated download progress
    setDownloadsInProgress(prev => ({ ...prev, [assetId]: 0 }));
    addToast(`Starting download for ${asset.title}...`, 'info');

    const duration = 1500; // 1.5 seconds
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);
    
    let currentProgress = 0;
    
    const timer = setInterval(async () => {
      currentProgress += increment;
      if (currentProgress >= 100) {
        clearInterval(timer);
        
        // Finalize progress
        setDownloadsInProgress(prev => ({ ...prev, [assetId]: 100 }));
        
        try {
          // Fetch the real/mock presigned URL from backend
          const res = await apiClient.get(`/assets/${assetId}/download`);
          const downloadUrl = res.data.downloadUrl;
          
          // Open presigned URL in a new window/tab to trigger download
          window.open(downloadUrl, '_blank');
          addToast(`${asset.title} downloaded successfully!`, 'success');
        } catch (err) {
          addToast(err.message || 'Download failed.', 'error');
        } finally {
          // Clear progress bar after a short delay
          setTimeout(() => {
            setDownloadsInProgress(prev => {
              const updated = { ...prev };
              delete updated[assetId];
              return updated;
            });
          }, 600);
        }
      } else {
        setDownloadsInProgress(prev => ({ ...prev, [assetId]: Math.min(Math.round(currentProgress), 99) }));
      }
    }, intervalTime);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText size={24} className="text-rose-400" />;
      case 'image':
        return <ImageIcon size={24} className="text-emerald-400" />;
      case 'word':
        return <FileText size={24} className="text-blue-400" />;
      case 'ppt':
        return <Presentation size={24} className="text-amber-400" />;
      case 'video':
        return <VideoIcon size={24} className="text-purple-400" />;
      default:
        return <FileText size={24} className="text-neutral-400" />;
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tabList = [
    { id: 'all', label: 'All Files' },
    ...categories.map(cat => ({ id: cat, label: cat }))
  ];

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto py-8 px-4"
    >
      {/* Top Bar: Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Secure Asset Browser</h1>
          <p className="text-sm text-neutral-400 mt-1">Search, preview, and download encrypted cloud stored files</p>
        </div>

        {/* Search Input & Admin Upload */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search by title or keyword..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
            />
          </div>

          {user?.role === 'admin' && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsUploadOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all text-sm flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Upload size={16} />
              <span>Upload Asset</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* Tabs with Sliding Indicator */}
      <div className="flex border-b border-neutral-800 mb-8 overflow-x-auto scrollbar-none gap-2">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative py-3 px-4 text-sm font-semibold transition-colors duration-200 whitespace-nowrap focus:outline-none ${
              activeTab === tab.id ? 'text-primary-400' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid Display */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Shimmer loading skeletons
          <motion.div
            key="skeletonGrid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="glass-card p-6 rounded-2xl h-48 flex flex-col justify-between animate-pulse">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800" />
                    <div className="h-5 w-2/3 bg-neutral-800 rounded" />
                  </div>
                  <div className="h-3 w-full bg-neutral-800 rounded mb-2" />
                  <div className="h-3 w-4/5 bg-neutral-800 rounded" />
                </div>
                <div className="flex justify-between items-center mt-4">
                  <div className="h-4 w-16 bg-neutral-800 rounded" />
                  <div className="h-9 w-28 bg-neutral-800 rounded-lg" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : assets.length === 0 ? (
          // Empty State
          <motion.div
            key="emptyState"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="text-center py-20 flex flex-col items-center justify-center glass-card rounded-3xl p-8"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="p-4 rounded-full bg-neutral-800 text-neutral-500 mb-4"
            >
              <FolderOpen size={48} />
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">No matching assets found</h3>
            <p className="text-sm text-neutral-400 max-w-sm mb-6">
              Try adjusting your search query or switching categories.
            </p>
          </motion.div>
        ) : (
          // Real Assets Grid
          <motion.div
            key="realGrid"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {assets.map((asset, index) => {
              const isDownloading = downloadsInProgress[asset._id] !== undefined;
              const progressVal = downloadsInProgress[asset._id] || 0;

              return (
                <motion.div
                  key={asset._id}
                  variants={cardVariant}
                  onClick={() => navigate(`/assets/${asset._id}`)}
                  className="glass-card p-6 rounded-2xl hover:border-neutral-700 transition-all duration-300 flex flex-col justify-between min-h-[15rem] h-auto cursor-pointer relative overflow-hidden group hover:shadow-xl hover:shadow-primary-500/5"
                >
                  <div>
                    {/* Header: Icon & Title */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-900 group-hover:bg-neutral-800 transition-colors overflow-hidden flex items-center justify-center border border-neutral-850 flex-shrink-0">
                          {asset.thumbnailUrl ? (
                            <img
                              src={getThumbnailUrl(asset._id)}
                              alt={asset.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getFileIcon(asset.fileType)
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-primary-400 transition-colors">
                          {asset.title}
                        </h3>
                      </div>
                    </div>
 
                    {/* Body: Description */}
                    <p className="text-xs text-neutral-400 line-clamp-2 mb-3 leading-relaxed">
                      {asset.description || 'No description provided.'}
                    </p>

                    {/* Category Tags */}
                    {asset.categories && asset.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {asset.categories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 text-[10px] font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-md whitespace-nowrap"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer: Size & Action */}
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-neutral-900 relative">
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatSize(asset.size)}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleDownload(e, asset)}
                      disabled={isDownloading}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 shadow ${
                        isDownloading
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/10'
                      }`}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>{progressVal}%</span>
                        </>
                      ) : (
                        <>
                          <Download size={13} />
                          <span>Download</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* Animated Progress Bar */}
                  {isDownloading && (
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-neutral-800">
                      <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: `${progressVal}%` }}
                        transition={{ duration: 0.1 }}
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500"
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Asset Modal */}
      <UploadAssetModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
      />
    </motion.div>
  );
};

export default AssetsPage;
