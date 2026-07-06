import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import apiClient from '../api/apiClient';
import { useToastStore } from '../store/toastStore';
import { pageVariant, shake, fadeIn } from '../animations/variants';
import { Lock, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ResetPasswordPage = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://secure-vault.com';
  const canonicalUrl = `${siteUrl}/reset-password`;
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const { addToast } = useToastStore();

  const validate = () => {
    const newErrors = {};
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      addToast('Reset token is missing from the URL.', 'error');
      return;
    }
    if (!validate()) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast('Please correct validation errors.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password });
      setIsDone(true);
      addToast('Password reset successful!', 'success');
    } catch (err) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast(err.message || 'Reset password failed.', 'error');
      setErrors({ api: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-neutral-950"
    >
      <Helmet>
        <title>Setup New Password - Secure Vault Asset Management</title>
        <meta name="description" content="Set up your new password securely in the Secure Vault Asset Management portal to regain access." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Setup New Password - Secure Vault Asset Management" />
        <meta property="og:description" content="Set up your new password securely in the Secure Vault Asset Management portal to regain access." />
        <meta property="og:image" content={`${siteUrl}/og-image.svg`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="Setup New Password - Secure Vault Asset Management" />
        <meta property="twitter:description" content="Set up your new password securely in the Secure Vault Asset Management portal to regain access." />
        <meta property="twitter:image" content={`${siteUrl}/og-image.svg`} />
      </Helmet>

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
            Assets
          </h1>
          <p className="mt-2 text-neutral-400">Secure Reset Portal</p>
        </div>

        <motion.div 
          animate={shakeTrigger ? 'shake' : 'default'}
          variants={shake}
          className="glass-card p-8 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500" />
          
          <AnimatePresence mode="wait">
            {!isDone ? (
              <motion.div
                key="resetForm"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Please enter your new password below.
                </p>

                {!token && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4">
                    Error: Reset token is missing. Please check your recovery email link.
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="password">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                        <Lock size={18} />
                      </span>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl glass-input ${
                          errors.password ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                        }`}
                        placeholder="••••••••"
                        disabled={!token}
                      />
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-400">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="confirmPassword">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                        <Lock size={18} />
                      </span>
                      <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl glass-input ${
                          errors.confirmPassword ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                        }`}
                        placeholder="••••••••"
                        disabled={!token}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {errors.api && (
                    <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/10">{errors.api}</p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isLoading || !token}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <span>Update Password</span>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="resetSuccess"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center py-4"
              >
                <div className="flex justify-center mb-4 text-emerald-400">
                  <CheckCircle2 size={64} className="animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Password Updated</h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Your password has been successfully updated. You can now use your new password to log in.
                </p>
                <Link
                  to="/login"
                  className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Go to Login</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {!isDone && (
            <div className="mt-6 border-t border-neutral-800 pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResetPasswordPage;
