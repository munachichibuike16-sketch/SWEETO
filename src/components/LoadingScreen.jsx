import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SweetoLogo from './SweetoLogo';

export default function LoadingScreen({ isVisible }) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If the parent is not loading, start closing sequence
    if (!isVisible) {
      setShow(false);
      return;
    }

    setShow(true);
    setProgress(0);

    // Smoothly animate progress bar to 100% over exactly 2000ms (2 seconds)
    const intervalTime = 20; // 20ms steps
    const totalDuration = 2000; // 2 seconds
    const step = 100 / (totalDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          // Complete load and fade out smoothly
          setTimeout(() => setShow(false), 150);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: -25, scale: 0.98 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] bg-[#060a13] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Radiant tech-luxury ambient radial flows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Central content cluster */}
          <div className="relative flex flex-col items-center space-y-8 text-center px-6">
            
            {/* Elegant glassmorphic pulsing logo unit */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              {/* Outer pulsing cyber-glow ring */}
              <div className="absolute inset-0 rounded-3xl border border-blue-500/20 animate-pulse scale-110 blur-[2px]"></div>
              
              {/* Delicate orbital dashed rotation */}
              <div className="absolute inset-0 rounded-[2rem] border border-dashed border-blue-500/10 animate-[spin_12s_linear_infinite]"></div>
              
              {/* Frosted premium viewport container with our Sweeto logo inside */}
              <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl p-1.5">
                <SweetoLogo size={70} className="w-full h-full drop-shadow-[0_0_12px_rgba(0,242,254,0.4)]" />
              </div>
            </div>

            {/* Custom high-end text typography */}
            <div className="space-y-2">
              <h1 className="text-lg font-black tracking-[0.4em] uppercase text-white">
                SWEETO<span className="text-blue-500">HUB</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.6em] text-slate-500">
                TECH-LUXURY EXPERIENCES
              </p>
            </div>

            {/* Glowing neon stream progress bar */}
            <div className="w-52 space-y-3.5 pt-2">
              <div className="h-[3px] w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"
                  style={{ width: `${progress}%`, transition: 'width 30ms linear' }}
                ></div>
              </div>
              <div className="flex justify-between items-center px-1 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                <span>CONNECTING</span>
                <span className="text-blue-500 font-black">{Math.floor(progress)}%</span>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
