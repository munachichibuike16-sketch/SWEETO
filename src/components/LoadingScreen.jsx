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
          setTimeout(() => setShow(false), 400);
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
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-[#030712] flex flex-col items-center justify-center overflow-hidden px-6 select-none"
        >
          {/* Futuristic subtle tech-grid background pattern */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
            }}
          ></div>

          {/* Drifting Chilling Ambient Nebula Orbs */}
          <motion.div 
            animate={{
              x: [-40, 40, -40],
              y: [-30, 30, -30],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-10 left-10 w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"
          />
          <motion.div 
            animate={{
              x: [40, -40, 40],
              y: [30, -30, 30],
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/5 rounded-full blur-[130px] pointer-events-none"></div>

          {/* Central content cluster */}
          <div className="relative flex flex-col items-center w-full max-w-[480px] text-center space-y-10">
            
            {/* Logo Container with Ambient Glow and Floating Effect */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative flex flex-col items-center justify-center w-full"
            >
              {/* Pulsing Backlight behind the logo */}
              <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[40px] scale-125 animate-pulse"></div>

              {/* Logo element with letter pop-and-bounce */}
              <SweetoLogo size={240} animate={true} className="relative z-10 drop-shadow-[0_0_20px_rgba(96,165,250,0.25)]" />
              
              {/* Delicately spaced divider line and EST. Tag */}
              <div className="w-full flex items-center justify-between mt-6 px-4 relative z-10 opacity-70">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800/80 to-transparent"></div>
                <span className="text-[10px] font-mono tracking-[0.3em] text-[#00ffcc] font-black uppercase mx-4">
                  EST. 2026
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800/80 to-transparent"></div>
              </div>
            </motion.div>

            {/* Glowing neon stream progress bar */}
            <div className="w-full space-y-5">
              {/* Text row: Status message and Percentage */}
              <div className="flex justify-between items-end px-2">
                {/* Status text with subtle pulsing opacity */}
                <span className="text-[10px] sm:text-xs font-mono tracking-[0.18em] text-[#00ffcc]/90 font-black text-start uppercase drop-shadow-[0_0_8px_rgba(0,255,204,0.3)] animate-pulse">
                  {getStatusText()}
                </span>
                
                {/* Glossy gradient percentage */}
                <span className="text-xl sm:text-2xl font-mono font-black tracking-tighter bg-gradient-to-r from-[#00ffcc] via-cyan-400 to-[#ff00cc] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,0,204,0.2)]">
                  {Math.floor(progress)}%
                </span>
              </div>
              
              {/* Glassmorphic progress bar track */}
              <div className="h-5 w-full bg-white/5 backdrop-blur-xl rounded-full relative border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.05),0_4px_12px_rgba(0,0,0,0.5)] flex items-center px-1">
                {/* Shiny Gradient Progress Fill */}
                <div 
                  className="h-2.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 rounded-full shadow-[0_0_12px_rgba(168,85,247,0.6)] relative overflow-hidden"
                  style={{ width: `${Math.max(3, progress)}%`, transition: 'width 30ms linear' }}
                >
                  {/* Internal Shimmer effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full animate-[shimmer_1.8s_infinite]"></div>
                </div>
                
                {/* Sliding Cyber Cart Indicator Badge */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#020617] border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.8),inset_0_1px_2px_rgba(255,255,255,0.1)] transition-all duration-300"
                  style={{ left: `${Math.max(3, Math.min(97, progress))}%`, transition: 'left 30ms linear' }}
                >
                  {/* Glowing core dot */}
                  <div className="absolute inset-0.5 rounded-full bg-[#070b19] border border-cyan-400/25 flex items-center justify-center">
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]"
                    >
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <style>{`
            @keyframes shimmer {
              100% {
                transform: translateX(100%);
              }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
