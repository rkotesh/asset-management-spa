import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { scaleUp } from '../animations/variants';
import { Edit, X, Loader2, Save } from 'lucide-react';

const EditAssetModal = ({ isOpen, onClose, asset, onUpdateSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState('');
  const [errors, setErrors] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);

  const { addToast } = useToastStore();

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setDescription(asset.description || '');
      setCategories(asset.categories ? asset.categories.join(', ') : '');
      setErrors({});
    }
  }, [asset, isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = 'Asset title is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsUpdating(true);

    try {
      const parsedCategories = categories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await apiClient.put(`/assets/${asset._id}`, {
        title: title.trim(),
        description: description.trim(),
        categories: parsedCategories
      });

      addToast('Asset details updated successfully!', 'success');
      onUpdateSuccess(res.data.asset);
      onClose();
    } catch (err) {
      setErrors({ api: err.response?.data?.message || err.message || 'Failed to update asset details.' });
      addToast(err.response?.data?.message || err.message || 'Failed to update asset.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && asset && (
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
                <Edit size={20} className="text-primary-400" />
                <span>Edit Asset Details</span>
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors"
                disabled={isUpdating}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="edit-title">
                  Asset Title
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q1 Sales Deck"
                  className={`w-full px-3 py-2 rounded-lg glass-input text-sm ${
                    errors.title ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  disabled={isUpdating}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-400">{errors.title}</p>
                )}
              </div>

              {/* Description input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="edit-desc">
                  Description
                </label>
                <textarea
                  id="edit-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the contents of this file..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm resize-none"
                  disabled={isUpdating}
                />
              </div>

              {/* Categories input */}
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5" htmlFor="edit-categories">
                  Categories (comma-separated)
                </label>
                <input
                  id="edit-categories"
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  placeholder="e.g. Sales, Marketing, Q1"
                  className="w-full px-3 py-2 rounded-lg glass-input text-sm"
                  disabled={isUpdating}
                />
                <p className="mt-1 text-[10px] text-neutral-500">
                  Separate multiple categories with commas.
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
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white rounded-lg transition-colors inline-flex items-center space-x-1.5 shadow-lg shadow-indigo-500/10"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={13} />
                      <span>Save Changes</span>
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

export default EditAssetModal;
