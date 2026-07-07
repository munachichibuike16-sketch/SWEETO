import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = (e) => {
      const scrollPos = window.scrollY 
        || window.pageYOffset 
        || document.documentElement.scrollTop 
        || document.body.scrollTop
        || (e && e.target && typeof e.target.scrollTop === 'number' ? e.target.scrollTop : 0);

      if (scrollPos > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    // Capture scroll events on inner containers as well
    document.addEventListener('scroll', toggleVisibility, { capture: true, passive: true });

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
      document.removeEventListener('scroll', toggleVisibility, { capture: true });
    };
  }, []);

  const scrollToTop = () => {
    // Scroll window
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

    // Scroll html & body
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });

    // Scroll any other scrollable containers on the page
    try {
      const scrollContainers = document.querySelectorAll('.overflow-y-auto, [style*="overflow-y: auto"], [style*="overflow-y: scroll"]');
      scrollContainers.forEach(container => {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } catch (e) {
      console.warn('Failed to scroll inner containers:', e);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-36 right-6 sm:bottom-24 sm:right-6 z-[9999] p-3.5 sm:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-full text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-500 cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group"
          aria-label="Back to Top"
        >
          {/* Glowing background halo */}
          <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
          <ArrowUp size={18} className="stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
