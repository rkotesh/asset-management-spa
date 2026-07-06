import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import { useAuthStore } from '../store/authStore';
import apiClient from '../api/apiClient';
import { pageVariant, fadeIn, slideUp } from '../animations/variants';
import { Send, FileQuestion, Check, Loader2, ArrowRight, CornerDownRight } from 'lucide-react';

const QueryPage = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // History states
  const [myQueries, setMyQueries] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Redirect if admin (Admins cannot submit queries)
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.get('/queries/my-queries');
      setMyQueries(res.data.queries || []);
    } catch (err) {
      console.error('Failed to load support history:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user && user.role !== 'admin') {
      fetchHistory();
    }
  }, [user]);

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
      
      // Trigger success animation
      setIsSuccess(true);
      addToast('Support query submitted!', 'success');
      
      // Fetch fresh history
      fetchHistory();

      // Delay showing the success card
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
      className="max-w-6xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-serif">Support & Assistance</h1>
        <p className="text-sm text-neutral-400 mt-1">Submit assistance requests or view past admin responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-3">
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
        </div>

        {/* Right Column: Ticket History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-neutral-900" />
            <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider mb-4">Your Support Tickets</h3>
            {isLoadingHistory ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-primary-500" />
              </div>
            ) : myQueries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xs text-neutral-500 italic">No tickets filed yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {myQueries.map((q) => (
                  <div key={q._id} className="p-4 rounded-xl bg-neutral-950/40 border border-neutral-900 space-y-2.5 text-xs">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-white line-clamp-1" title={q.subject}>
                        {q.subject}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize flex-shrink-0 ${
                        q.status === 'resolved'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-neutral-400 bg-neutral-950/60 p-3 rounded-lg border border-neutral-900/60 leading-relaxed font-sans">
                      {q.message}
                    </p>
                    {q.status === 'resolved' && q.response && (
                      <div className="bg-emerald-950/15 border border-emerald-900/40 p-3 rounded-lg space-y-1.5">
                        <span className="block font-bold text-emerald-400 text-[10px] uppercase tracking-wider">Admin Response</span>
                        <p className="text-neutral-200 font-sans italic">
                          "{q.response}"
                        </p>
                        <span className="block text-[8px] text-neutral-500 text-right">
                          Responded on {new Date(q.respondedAt || q.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default QueryPage;
