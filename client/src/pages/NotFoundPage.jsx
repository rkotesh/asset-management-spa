import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { pageVariant } from '../animations/variants';
import { HelpCircle, ArrowRight } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center"
    >
      <Helmet>
        <title>Page Not Found - Secure Vault</title>
        <meta name="description" content="The page you requested was not found. Please return to the Secure Vault Asset Management platform." />
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Animated Icon */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', repeatDelay: 2 }}
          className="w-24 h-24 rounded-full bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-400 mx-auto mb-4"
        >
          <HelpCircle size={48} />
        </motion.div>

        <h1 className="text-6xl font-extrabold tracking-wider bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
        
        <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/assets')}
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all duration-300 inline-flex items-center space-x-2"
          >
            <span>Return to Vault</span>
            <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
