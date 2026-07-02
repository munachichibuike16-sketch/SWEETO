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
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#ffffff] via-[#f0f9ff] to-[#e0f2fe] flex flex-col items-center justify-center overflow-hidden px-6 select-none"
        >
          {/* Futuristic subtle tech-grid background pattern (soft blue) */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.025) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
            }}
          ></div>

          {/* Drifting Chilling Ambient Nebula Orbs (blue and ice sky colors) */}
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
            className="absolute top-10 left-10 w-[350px] h-[350px] bg-blue-400/15 rounded-full blur-[100px] pointer-events-none"
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
            className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-sky-400/20 rounded-full blur-[120px] pointer-events-none"
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
              <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[40px] scale-125 animate-pulse"></div>

              {/* Logo element with letter pop-and-bounce */}
              <SweetoLogo size={240} animate={true} className="relative z-10 drop-shadow-[0_4px_20px_rgba(59,130,246,0.18)]" />
              
              {/* Delicately spaced divider line and EST. Tag */}
              <div className="w-full flex items-center justify-between mt-6 px-4 relative z-10 opacity-70">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent"></div>
                <span className="text-[10px] font-mono tracking-[0.3em] text-blue-600 font-black uppercase mx-4">
                  EST. 2026
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-200/60 to-transparent"></div>
              </div>
            </motion.div>

            {/* Glowing neon stream progress bar */}
            <div className="w-full space-y-5">
              {/* Text row: Status message and Percentage */}
              <div className="flex justify-between items-end px-2">
                {/* Status text with subtle pulsing opacity */}
                <span className="text-[10px] sm:text-xs font-mono tracking-[0.18em] text-blue-600 font-black text-start uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.15)] animate-pulse">
                  {getStatusText()}
                </span>
                
                {/* Glossy gradient percentage */}
                <span className="text-xl sm:text-2xl font-mono font-black tracking-tighter bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent">
                  {Math.floor(progress)}%
                </span>
              </div>
              
              {/* Glassmorphic progress bar track */}
              <div className="h-5 w-full bg-white/80 backdrop-blur-xl rounded-full relative border border-blue-200/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_4px_12px_rgba(59,130,246,0.06)] flex items-center px-1">
                {/* Shiny Gradient Progress Fill */}
                <div 
                  className="h-2.5 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-800 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.25)] relative overflow-hidden"
                  style={{ width: `${Math.max(3, progress)}%`, transition: 'width 30ms linear' }}
                >
                  {/* Internal Shimmer effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full animate-[shimmer_1.8s_infinite]"></div>
                </div>
                
                {/* Sliding Cyber Cart Indicator Badge */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow-[0_4px_10px_rgba(37,99,235,0.25)] transition-all duration-300"
                  style={{ left: `${Math.max(3, Math.min(97, progress))}%`, transition: 'left 30ms linear' }}
                >
                  {/* Glowing core dot */}
                  <div className="absolute inset-0.5 rounded-full bg-blue-50/50 flex items-center justify-center">
                    <svg 
                      viewBox="0 0 32 32" 
                      className="w-5 h-5 drop-shadow-[0_0_4px_rgba(37,99,235,0.4)]"
                    >
                      {/* 1. Mini Credit Card (tilted, in the background) */}
                      <g transform="translate(18, 6) rotate(22)">
                        <rect 
                          x="0" 
                          y="0" 
                          width="11" 
                          height="7.5" 
                          rx="1.2" 
                          fill="#3b82f6" 
                          stroke="#2563eb"
                          strokeWidth="0.5"
                        />
                        <line x1="1.5" y1="5.5" x2="5.5" y2="5.5" stroke="#ffffff" strokeWidth="0.8" strokeLinecap="round" />
                        <rect x="1.5" y="2" width="2" height="1.5" rx="0.3" fill="#ffffff" />
                      </g>

                      {/* 2. Mini Shopping Bag (overlapping, in front of card) */}
                      <g transform="translate(9, 7) rotate(-8)">
                        <path 
                          d="M 2.5 3 C 2.5 0.5, 6.5 0.5, 6.5 3" 
                          stroke="#1d4ed8" 
                          strokeWidth="0.9" 
                          fill="none" 
                        />
                        <rect 
                          x="0" 
                          y="3" 
                          width="9" 
                          height="9" 
                          rx="1" 
                          fill="#60a5fa" 
                          stroke="#3b82f6"
                          strokeWidth="0.5"
                        />
                      </g>

                      {/* 3. The Shopping Cart (in the very front) */}
                      <path 
                        d="M 3 5 H 6 L 10 20 H 22" 
                        stroke="#1e3a8a" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                      />
                      <path 
                        d="M 6 8 H 25 L 22.5 17 H 9.5 Z" 
                        stroke="#1e3a8a" 
                        strokeWidth="1.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        fill="none"
                      />
                      <circle cx="11.5" cy="24" r="2" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.2" />
                      <circle cx="20.5" cy="24" r="2" fill="#ffffff" stroke="#1e3a8a" strokeWidth="1.2" />
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
