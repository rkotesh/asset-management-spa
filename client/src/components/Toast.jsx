import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../store/toastStore';
import { slideInFromRight } from '../animations/variants';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-rose-400" />;
      case 'info':
        return <Info size={16} className="text-sky-400" />;
      default:
        return <Info size={16} className="text-neutral-400" />;
    }
  };

  const getColorClasses = (type) => {
    switch (type) {
      case 'success':
        return 'bg-neutral-900/90 border-emerald-500/20 shadow-emerald-500/5 text-emerald-100';
      case 'error':
        return 'bg-neutral-900/90 border-rose-500/20 shadow-rose-500/5 text-rose-100';
      case 'info':
        return 'bg-neutral-900/90 border-sky-500/20 shadow-sky-500/5 text-sky-100';
      default:
        return 'bg-neutral-900/90 border-neutral-800 shadow-neutral-500/5 text-neutral-100';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col space-y-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            variants={slideInFromRight}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            className={`pointer-events-auto flex items-start space-x-3 p-4 rounded-xl border backdrop-blur-md shadow-lg ${getColorClasses(
              toast.type
            )}`}
          >
            <div className="mt-0.5 flex-shrink-0">{getIcon(toast.type)}</div>
            
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-500 hover:text-white transition-colors flex-shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
