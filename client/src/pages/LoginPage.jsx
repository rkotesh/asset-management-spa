import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { pageVariant, shake } from '../animations/variants';
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [shakeTrigger, setShakeTrigger] = useState(false);
  
  const { login, token, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const location = useLocation();

  // If already logged in, redirect away from auth pages
  useEffect(() => {
    if (token) {
      const from = location.state?.from?.pathname || '/assets';
      navigate(from, { replace: true });
    }
  }, [token, navigate, location]);

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast('Please correct the validation errors.', 'error');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      addToast(`Welcome back, ${result.user.name}!`, 'success');
      const from = location.state?.from?.pathname || '/assets';
      navigate(from, { replace: true });
    } else {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast(result.message || 'Login failed.', 'error');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword, roleName) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrors({});
    
    addToast(`Logging in as Demo ${roleName}...`, 'info');
    
    const result = await login(demoEmail, demoPassword);
    if (result.success) {
      addToast(`Welcome back, ${result.user.name}!`, 'success');
      const from = location.state?.from?.pathname || '/assets';
      navigate(from, { replace: true });
    } else {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      addToast(result.message || 'Login failed.', 'error');
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
      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-400 via-indigo-300 to-accent-400 bg-clip-text text-transparent">
            Assets
          </h1>
          <p className="mt-2 text-neutral-400">Manage, share, and access files securely</p>
        </div>

        <motion.div 
          animate={shakeTrigger ? 'shake' : 'default'}
          variants={shake}
          className="glass-card p-8 rounded-2xl shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-indigo-500 to-accent-500" />
          
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>
          
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
                    errors.email ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400 transition-all duration-200">{errors.email}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-neutral-300" htmlFor="password">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-500">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl glass-input ${
                    errors.password ? 'border-red-500/50 ring-2 ring-red-500/10' : ''
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 transition-all duration-200">{errors.password}</p>
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
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-5 border-t border-neutral-900/60 text-center">
            <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
              Quick Demo Login
            </span>
            <div className="flex justify-center space-x-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleQuickLogin('user@example.com', 'user123', 'User')}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-primary-500/30 hover:bg-primary-500/5 transition-all text-xs text-neutral-300 font-bold flex items-center space-x-1 shadow"
              >
                <span>Demo User</span>
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => handleQuickLogin('admin@example.com', 'admin123', 'Admin')}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-accent-500/30 hover:bg-accent-500/5 transition-all text-xs text-neutral-300 font-bold flex items-center space-x-1 shadow"
              >
                <span>Demo Admin</span>
              </motion.button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-400">Don't have an account? </span>
            <Link
              to="/register"
              className="font-bold text-accent-400 hover:text-accent-300 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoginPage;
