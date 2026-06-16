// Reusable motion variants that respect browser prefers-reduced-motion setting

const prefersReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export const pageVariant = prefersReducedMotion ? {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
} : {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } 
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { duration: 0.3, ease: 'easeIn' } 
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.05,
      delayChildren: 0.05
    }
  }
};

export const cardVariant = prefersReducedMotion ? {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
} : {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: 'easeOut' } 
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

export const slideUp = prefersReducedMotion ? {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
} : {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
};

export const scaleUp = prefersReducedMotion ? {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } }
} : {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', damping: 25, stiffness: 350 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

export const shake = {
  shake: {
    x: prefersReducedMotion ? 0 : [0, -10, 10, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

export const slideInFromRight = prefersReducedMotion ? {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } }
} : {
  hidden: { x: 300, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: 'spring', damping: 25, stiffness: 200 } },
  exit: { x: 300, opacity: 0, transition: { duration: 0.2 } }
};
