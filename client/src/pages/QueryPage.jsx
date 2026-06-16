import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { pageVariant, fadeIn, slideUp } from '../animations/variants';
import { Send, FileQuestion, Check, Loader2, ArrowRight, CornerDownRight } from 'lucide-react';

const QueryPage = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  const { addToast } = useToastStore();

  const validate = () => {
    const newErrors = {};
    if (!subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (subject.length > 100) {
      newErrors.subject = 'Subject cannot exceed 100 characters';
    }
    if (!message.trim()) {
      newErrors.message = 'Message is required';
    } else if (message.length < 10) {
      newErrors.message = 'Please provide a more descriptive support message';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Please correct validation errors.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/queries', { subject, message });
      
      // Step 1: Trigger success checkmark in button
      setIsSuccess(true);
      addToast('Support query submitted!', 'success');
      
      // Step 2: Delay and slide the form away, showing the success card
      setTimeout(() => {
        setShowSuccessCard(true);
      }, 1000);
      
    } catch (err) {
      addToast(err.message || 'Failed to submit query.', 'error');
      setErrors({ api: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubject('');
    setMessage('');
    setErrors({});
    setIsSuccess(false);
    setShowSuccessCard(false);
  };

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-2xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Submit Support Ticket</h1>
        <p className="text-sm text-neutral-400 mt-1">Get assistance from our system administrators</p>
      </div>

      <AnimatePresence mode="wait">
        {!showSuccessCard ? (
          <motion.div
            key="queryForm"
            variants={fadeIn}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 sm:p-8 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-primary-500 to-accent-500" />
            
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400">
                <FileQuestion size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-medium">Describe your request</h3>
                <p className="text-xs text-neutral-400">Provide details so our administrators can help you quickly</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5" htmlFor="subject">
                  Subject Line
                </label>
                <input
                  id="subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Cannot download PDF files"
                  className={`w-full px-3.5 py-2.5 rounded-xl glass-input text-sm ${
                    errors.subject ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  disabled={isSuccess}
                />
                {errors.subject && (
                  <p className="mt-1 text-xs text-red-400">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5" htmlFor="message">
                  Support Message Details
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide step-by-step details of the issue, error messages seen, and what files are failing..."
                  rows={6}
                  className={`w-full px-3.5 py-2.5 rounded-xl glass-input text-sm resize-none ${
                    errors.message ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  disabled={isSuccess}
                />
                {errors.message && (
                  <p className="mt-1 text-xs text-red-400">{errors.message}</p>
                )}
              </div>

              {errors.api && (
                <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/15">{errors.api}</p>
              )}

              <div className="pt-2 border-t border-neutral-900 flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  disabled={isSubmitting || isSuccess}
                  className={`px-6 py-3 text-xs font-bold rounded-xl shadow transition-all duration-300 flex items-center space-x-2 ${
                    isSuccess
                      ? 'bg-emerald-600 text-white shadow-emerald-500/10'
                      : 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-500/10'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <Check size={15} className="scale-110" />
                      <span>Submitted!</span>
                    </>
                  ) : (
                    <>
                      <span>Send Support Ticket</span>
                      <Send size={14} />
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="successCard"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            className="glass-card p-8 rounded-3xl text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-emerald-500 to-teal-500" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto mb-6">
              <Check size={32} />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Ticket Submitted Successfully</h2>
            <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
              Thank you for reaching out. A confirmation email has been logged to the system administrators. 
              We will review your request and get back to you shortly.
            </p>

            <div className="bg-neutral-950/40 border border-neutral-900 rounded-2xl p-4 text-left max-w-md mx-auto mb-8 space-y-2.5">
              <span className="text-xs font-bold text-neutral-500 uppercase">Ticket details</span>
              <div className="flex items-start text-xs">
                <CornerDownRight size={14} className="text-primary-400 mr-2 mt-0.5" />
                <span className="text-neutral-300 font-semibold truncate"><strong className="text-neutral-400">Subject:</strong> {subject}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-white rounded-xl transition-colors inline-flex items-center space-x-1.5"
            >
              <span>Submit Another Query</span>
              <ArrowRight size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default QueryPage;
