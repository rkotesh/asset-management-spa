import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { pageVariant, fadeIn, staggerContainer } from '../animations/variants';
import { Shield, Zap, Lock, ArrowRight, FolderDot, Terminal, HelpCircle } from 'lucide-react';

const LandingPage = () => {
  const { token } = useAuthStore();

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col relative overflow-hidden font-sans"
    >
      {/* Dynamic background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Header / Navbar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-neutral-900/60 z-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary-600 to-accent-600 text-white shadow-lg shadow-indigo-500/20">
            <FolderDot size={22} />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
            Secure Vault
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {token ? (
            <Link
              to="/assets"
              className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-semibold rounded-xl transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12 max-w-4xl mx-auto z-10">
        <motion.div
          variants={fadeIn}
          className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-medium text-primary-400 mb-6"
        >
          <Shield size={12} className="text-primary-400" />
          <span>Military-Grade Encrypted Repository</span>
        </motion.div>

        <motion.h1
          variants={fadeIn}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15] font-serif"
        >
          The Premium Hub for{' '}
          <span className="bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
            Secure Assets
          </span>
        </motion.h1>

        <motion.p
          variants={fadeIn}
          className="text-base md:text-lg text-neutral-400 mb-8 max-w-2xl leading-relaxed"
        >
          Deploying structured file storage, advanced access logs, and real-time event-driven notification pipelines. Log in as an administrator to upload and publish files, or register as a client to securely search and download authorized assets.
        </motion.p>

        <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4">
          {token ? (
            <Link
              to="/assets"
              className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center space-x-2 text-sm"
            >
              <span>Enter Asset Vault</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-8 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center space-x-2 text-sm"
              >
                <span>Get Started Now</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/register"
                className="px-8 py-3.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-bold rounded-xl hover:text-white transition-all text-sm"
              >
                Create Account
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl mx-auto px-6 py-12 z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <motion.div
            variants={fadeIn}
            className="glass-card p-6 rounded-2xl border border-neutral-900 relative overflow-hidden group hover:border-neutral-800 transition-all"
          >
            <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400 w-fit mb-4 group-hover:bg-primary-500/20 transition-all">
              <Lock size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Admin Controlled Uploads</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Restricted file upload functionality. Vault administrators publish verified PDFs, images, presentations, and videos directly to secure storage.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            variants={fadeIn}
            className="glass-card p-6 rounded-2xl border border-neutral-900 relative overflow-hidden group hover:border-neutral-800 transition-all"
          >
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 w-fit mb-4 group-hover:bg-indigo-500/20 transition-all">
              <Zap size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Real-time Notification Delivery</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Dynamic workflow automation execution on file upload triggers fetch-user and email action blocks, sending notifications instantly.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            variants={fadeIn}
            className="glass-card p-6 rounded-2xl border border-neutral-900 relative overflow-hidden group hover:border-neutral-800 transition-all"
          >
            <div className="p-3 bg-accent-500/10 rounded-xl text-accent-400 w-fit mb-4 group-hover:bg-accent-500/20 transition-all">
              <Terminal size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Detailed Execution Logs</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Full step-by-step transparency with log audits, interpolated properties representation, custom template previews, and rerun triggers.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-900/60 py-6 text-center text-xs text-neutral-600 mt-auto z-10">
        <p>&copy; {new Date().getFullYear()} Secure Vault. All rights reserved.</p>
      </footer>
    </motion.div>
  );
};

export default LandingPage;
