import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SweetoLogo from './SweetoLogo';

export default function LoadingScreen({ isVisible }) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setShow(true);
    setProgress(0);

    // Smoothly animate progress bar to 100% over exactly 2500ms (2.5 seconds)
    const intervalTime = 20; // 20ms steps
    const totalDuration = 2500; // 2.5 seconds
    const step = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // Complete load and fade out smoothly
          setTimeout(() => setShow(false), 300);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Determine status message based on current progress
  const getStatusText = () => {
    if (progress < 20) return 'INITIALIZING SYSTEM CORES...';
    if (progress < 45) return 'CONNECTING SECURE PROTOCOLS...';
    if (progress < 70) return 'LOADING INTERFACE METRICS...';
    if (progress < 95) return 'OPTIMIZING SWEETO HUBS...';
    return 'CORE MATRIX DEPLOYED SUCCESSFULLY!';
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden px-6"
        >
          {/* Subtle tech ambient grid background or radial flow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.08),rgba(255,255,255,0))]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

          {/* Central content cluster */}
          <div className="relative flex flex-col items-center w-full max-w-[500px] text-center">
            
            {/* Logo panel card */}
            <div className="relative w-full bg-[#030712] border border-slate-900/60 rounded-3xl p-12 sm:p-16 flex flex-col items-center justify-center shadow-2xl overflow-hidden mb-8">
              {/* Ambient background glow inside the card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-blue-500/5 rounded-full blur-[60px] pointer-events-none"></div>
              
              {/* Logo with pop-and-bounce letter animation */}
              <SweetoLogo size={230} animate={true} className="relative z-10 drop-shadow-[0_0_15px_rgba(96,165,250,0.18)]" />
              
              {/* EST. 2026 tag */}
              <div className="w-full flex justify-end mt-4 pr-2 relative z-10">
                <span className="text-[10px] font-mono tracking-[0.25em] text-[#00ffcc]/70">
                  EST. 2026
                </span>
              </div>
            </div>

            {/* Glowing neon stream progress bar */}
            <div className="w-full max-w-[480px] space-y-4 pt-2">
              {/* Text row: Status message and Percentage */}
              <div className="flex justify-between items-center px-1 text-[10px] sm:text-xs font-mono tracking-widest">
                <span className="text-[#00ffcc] uppercase text-start font-bold">{getStatusText()}</span>
                <span className="text-[#ff00cc] font-black">{Math.floor(progress)}%</span>
              </div>
              
              {/* Bar container with glowing borders */}
              <div className="h-4 w-full bg-slate-950/80 rounded-full relative border border-fuchsia-500/30 shadow-[0_0_15px_rgba(244,63,94,0.15)] flex items-center px-1">
                {/* Gradient Progress Fill */}
                <div 
                  className="h-2 bg-gradient-to-r from-blue-600 via-purple-500 to-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                  style={{ width: `${Math.max(2, progress)}%`, transition: 'width 30ms linear' }}
                ></div>
                
                {/* Sliding Shopping Cart Icon */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-black border-2 border-fuchsia-500 flex items-center justify-center shadow-[0_0_12px_rgba(244,63,94,0.8)]"
                  style={{ left: `${Math.max(2, Math.min(98, progress))}%`, transition: 'left 30ms linear' }}
                >
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="w-4 h-4 text-white"
                  >
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
