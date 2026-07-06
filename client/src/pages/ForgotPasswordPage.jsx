import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import apiClient from '../api/apiClient';
import { useToastStore } from '../store/toastStore';
import { pageVariant, shake, fadeIn } from '../animations/variants';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://secure-vault.com';
  const canonicalUrl = `${siteUrl}/forgot-password`;
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const { addToast } = useToastStore();

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSent(true);
      addToast('Password reset email sent!', 'success');
    } catch (err) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      setError(err.message || 'Something went wrong. Please check your email and try again.');
      addToast(err.message || 'Email request failed.', 'error');
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
        <title>Reset Password - Secure Vault Asset Management</title>
        <meta name="description" content="Request a password reset link to securely regain access to your Secure Vault asset management account." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content="Reset Password - Secure Vault Asset Management" />
        <meta property="og:description" content="Request a password reset link to securely regain access to your Secure Vault asset management account." />
        <meta property="og:image" content={`${siteUrl}/og-image.svg`} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:title" content="Reset Password - Secure Vault Asset Management" />
        <meta property="twitter:description" content="Request a password reset link to securely regain access to your Secure Vault asset management account." />
        <meta property="twitter:image" content={`${siteUrl}/og-image.svg`} />
      </Helmet>

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
            Antigravity Assets
          </h1>
          <p className="mt-2 text-neutral-400">Password Recovery Portal</p>
        </div>

        <motion.div 
          animate={shakeTrigger ? 'shake' : 'default'}
          variants={shake}
          className="glass-card p-8 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500" />
          
          <AnimatePresence mode="wait">
            {!isSent ? (
              <motion.div
                key="form"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <h2 className="text-2xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-sm text-neutral-400 mb-6">
                  No worries! Enter your email below and we will send you a secure link to reset your password.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                        <Mail size={18} />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 rounded-xl glass-input ${
                          error ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                        }`}
                        placeholder="name@company.com"
                      />
                    </div>
                    {error && (
                      <p className="mt-1.5 text-xs text-red-400">{error}</p>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <span>Request Reset Link</span>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center py-4"
              >
                <div className="flex justify-center mb-4 text-emerald-400">
                  <CheckCircle2 size={64} className="animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-sm text-neutral-400 mb-6">
                  We have sent a secure password reset link to <strong className="text-white">{email}</strong>. 
                  The link will expire in 15 minutes.
                </p>
                <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl text-xs text-emerald-300 mb-6">
                  If you don't receive the email, please check your spam folder, or try requesting another link.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 border-t border-neutral-800 pt-4 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ForgotPasswordPage;
