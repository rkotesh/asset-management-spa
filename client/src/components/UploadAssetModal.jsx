import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { scaleUp } from '../animations/variants';
import { Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const UploadAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { addToast } = useToastStore();

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Asset title is required';
    }

    if (!assetUrl.trim()) {
      newErrors.assetUrl = 'Asset URL/Link is required';
    } else {
      try {
        const parsedUrl = new URL(assetUrl.trim());
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          newErrors.assetUrl = 'Please enter a valid URL starting with http:// or https://';
        }
      } catch (e) {
        newErrors.assetUrl = 'Please enter a valid URL';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 450);

    try {
      const res = await apiClient.post('/assets/upload-link', {
        url: assetUrl.trim(),
        title: title.trim(),
        description: description.trim()
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (res.data.duplicate) {
        addToast('Duplicate file/link matched. Reference added instantly!', 'success');
      } else {
        addToast('Asset link processed and stored successfully!', 'success');
      }

      onSuccess();
      resetForm();
      onClose();
    } catch (err) {
      clearInterval(progressInterval);
      setErrors({ api: err.response?.data?.message || err.message || 'Link upload failed.' });
      addToast(err.response?.data?.message || err.message || 'Link upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAssetUrl('');
    setUploadProgress(0);
    setErrors({});
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur/Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            variants={scaleUp}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-card w-full max-w-md p-6 rounded-2xl shadow-2xl relative overflow-hidden z-10"
          >
            {/* Gradient Top Border Accent */}
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Upload size={20} className="text-primary-400" />
                <span>Upload New Asset</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
                disabled={isUploading}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="asset-title">
                  Asset Title
                </label>
                <input
                  id="asset-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Sales Deck"
                  className={`w-full px-3 py-2 rounded-lg glass-input text-sm ${
                    errors.title ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  disabled={isUploading}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Description input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="asset-desc">
                  Description
                </label>
                <textarea
                  id="asset-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the contents of this file..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none"
                  disabled={isUploading}
                />
              </div>

              {/* Asset URL / Link input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="asset-url">
                  Asset URL / Link
                </label>
                <input
                  id="asset-url"
                  type="text"
                  value={assetUrl}
                  onChange={(e) => setAssetUrl(e.target.value)}
                  placeholder="e.g. Google Drive link or raw document URL"
                  className={`w-full px-3 py-2 rounded-lg glass-input text-sm ${
                    errors.assetUrl ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  disabled={isUploading}
                />
                {errors.assetUrl && (
                  <p className="mt-1 text-xs text-red-400">{errors.assetUrl}</p>
                )}
                <p className="mt-1 text-[10px] text-neutral-500">
                  Provide a Google Drive link (file/folder) or a direct web URL. Folder links automatically analyze contents: identical types are saved as one archive; mixed contents are split and uploaded as separate assets.
                </p>
              </div>

              {errors.api && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2 border border-red-500/10 rounded-lg">{errors.api}</p>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 justify-end pt-3 border-t border-neutral-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 rounded-lg transition-colors"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10"
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Uploading ({uploadProgress}%)</span>
                    </>
                  ) : (
                    <>
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UploadAssetModal;
