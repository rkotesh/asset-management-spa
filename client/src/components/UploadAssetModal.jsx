import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { scaleUp } from '../animations/variants';
import { Upload, X, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const UploadAssetModal = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const { addToast } = useToastStore();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrors(prev => ({ ...prev, file: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Asset title is required';
    }
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    } else {
      // Validate file extension matches allowed fileTypes (PDF, Image, Text)
      const allowedExtensions = /\.(pdf|png|jpg|jpeg|svg|txt|json|js|html|css|md|sql)$/i;
      if (!allowedExtensions.test(file.name)) {
        newErrors.file = 'Unsupported file type. Allowed: PDF, PNG, JPG, JPEG, SVG, TXT, JSON, JS, SQL, MD';
      }
      // Max size: 15MB
      if (file.size > 15 * 1024 * 1024) {
        newErrors.file = 'File size exceeds the 15MB limit';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUploading(true);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('file', file);

    try {
      await apiClient.post('/assets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      addToast('Asset uploaded successfully!', 'success');
      onSuccess(); // Reload asset library grid
      
      // Reset state and close modal
      setTitle('');
      setDescription('');
      setFile(null);
      onClose();
    } catch (err) {
      setErrors({ api: err.message || 'File upload failed.' });
      addToast(err.message || 'File upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
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

              {/* File upload drag-and-drop selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
                  File Upload
                </label>
                <div className={`relative border border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-200 ${
                  errors.file
                    ? 'border-red-500/50 bg-red-500/5'
                    : file
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/20'
                }`}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={isUploading}
                  />
                  
                  {file ? (
                    <div className="flex flex-col items-center space-y-1">
                      <CheckCircle size={32} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white truncate max-w-[250px]">{file.name}</span>
                      <span className="text-[10px] text-neutral-400">
                        {parseFloat((file.size / (1024 * 1024)).toFixed(2))} MB
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <Upload size={32} className="text-neutral-500" />
                      <span className="text-xs text-neutral-300 font-semibold">Click to select files</span>
                      <span className="text-[9px] text-neutral-500">
                        Max size: 15MB. Supported: PDF, Image, Code & Text
                      </span>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-1 text-xs text-red-400">{errors.file}</p>
                )}
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
                      <span>Uploading...</span>
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
