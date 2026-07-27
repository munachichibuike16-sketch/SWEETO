import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SweetoLogo from './SweetoLogo';

export default function LoadingScreen({ isVisible }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      const exitTimer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(exitTimer);
    }
    setShow(true);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-white dark:bg-[#18191A] flex flex-col items-center justify-between py-12 select-none"
        >
          {/* Top spacer to push logo to center */}
          <div className="flex-1"></div>

          {/* Center Logo Area */}
          <div className="flex flex-col items-center justify-center">
            {/* Meta-style subtle scale-in animation */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <SweetoLogo size={90} animate={false} />
            </motion.div>
          </div>

          {/* Bottom Branding Section (from SWEETO) */}
          <div className="flex-1 flex flex-col justify-end items-center mb-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <span className="text-slate-500 dark:text-slate-400 text-sm mb-1 font-medium tracking-wide">
                from
              </span>
              {/* Meta-style gradient brand name */}
              <span className="text-xl font-black bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-widest uppercase">
                SWEETO
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
