import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import apiClient from '../api/apiClient';
import { pageVariant, staggerContainer, cardVariant, fadeIn } from '../animations/variants';
import { ShieldAlert, CheckCircle, Clock, Calendar, User, Mail, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';

const AdminPage = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  
  const [queries, setQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);

  // Additional security check: redirect if not admin
  if (user?.role !== 'admin') {
    return <Navigate to="/assets" replace />;
  }

  useEffect(() => {
    const fetchQueries = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/queries');
        setQueries(res.data.queries);
      } catch (err) {
        addToast(err.message || 'Failed to fetch support queries.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQueries();
  }, [addToast]);

  const handleResolve = async (queryId) => {
    setResolvingId(queryId);
    try {
      const res = await apiClient.put(`/queries/${queryId}`);
      
      // Update query in local list
      setQueries(prev => prev.map(q => q._id === queryId ? res.data.query : q));
      addToast('Query marked as resolved successfully!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to resolve query.', 'error');
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="max-w-6xl mx-auto py-8 px-4"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-white font-serif">Admin Control Panel</h1>
            <span className="px-2 py-0.5 rounded-md bg-accent-500/10 border border-accent-500/20 text-[10px] font-bold text-accent-400 uppercase tracking-widest mt-1">
              restricted
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">Review and manage user-submitted support tickets</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <Loader2 size={36} className="animate-spin text-primary-500" />
          </div>
        ) : queries.length === 0 ? (
          <motion.div
            key="emptyQueries"
            variants={fadeIn}
            className="text-center py-20 glass-card rounded-3xl p-8"
          >
            <div className="p-4 rounded-full bg-neutral-900 text-neutral-600 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No support tickets found</h3>
            <p className="text-sm text-neutral-400">All users are currently operating without reported issues.</p>
          </motion.div>
        ) : (
          <motion.div
            key="queriesTable"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Table structure (Desktop & Tablet) or Card lists (Mobile fallback) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-neutral-800 glass">
              <table className="min-w-full divide-y divide-neutral-900 text-left">
                <thead className="bg-neutral-950/80">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">User Details</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Subject</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Message</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Date Submitted</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900 bg-transparent">
                  {queries.map((q) => (
                    <motion.tr
                      key={q._id}
                      variants={cardVariant}
                      className="hover:bg-neutral-900/30 transition-colors"
                    >
                      {/* User Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                            {q.userId?.name ? q.userId.name[0].toUpperCase() : '?'}
                          </div>
                          <div>
                            <span className="block text-sm font-semibold text-white">{q.userId?.name || 'Unknown User'}</span>
                            <span className="block text-xs text-neutral-500">{q.userId?.email || 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Subject Column */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-neutral-200 line-clamp-1 max-w-[150px]">{q.subject}</span>
                      </td>

                      {/* Message Column */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-neutral-400 line-clamp-2 max-w-[250px]" title={q.message}>
                          {q.message}
                        </span>
                      </td>

                      {/* Date Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400">
                        {formatDate(q.createdAt)}
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                          q.status === 'resolved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                        }`}>
                          {q.status === 'resolved' ? (
                            <>
                              <CheckCircle size={12} className="mr-1.5" />
                              <span>Resolved</span>
                            </>
                          ) : (
                            <>
                              <Clock size={12} className="mr-1.5 animate-pulse" />
                              <span>Open</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {q.status === 'open' ? (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleResolve(q._id)}
                            disabled={resolvingId === q._id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow shadow-emerald-500/10 transition-colors inline-flex items-center space-x-1"
                          >
                            {resolvingId === q._id ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <span>Mark Resolved</span>
                            )}
                          </motion.button>
                        ) : (
                          <span className="text-neutral-500 font-semibold italic">Complete</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile query card list */}
            <div className="md:hidden space-y-4">
              {queries.map((q) => (
                <motion.div
                  key={q._id}
                  variants={cardVariant}
                  className="glass-card p-5 rounded-2xl space-y-4 relative overflow-hidden"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300">
                        {q.userId?.name ? q.userId.name[0].toUpperCase() : '?'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{q.userId?.name || 'Unknown'}</h4>
                        <span className="text-[10px] text-neutral-500">{q.userId?.email}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      q.status === 'resolved'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {q.status === 'resolved' ? 'Resolved' : 'Open'}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-xs font-bold text-white truncate">{q.subject}</span>
                    <p className="text-xs text-neutral-400 leading-relaxed bg-neutral-950/30 p-3 rounded-lg border border-neutral-900">
                      {q.message}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-900">
                    <span className="text-[10px] text-neutral-500">{formatDate(q.createdAt)}</span>
                    {q.status === 'open' && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleResolve(q._id)}
                        disabled={resolvingId === q._id}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Resolve
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminPage;
