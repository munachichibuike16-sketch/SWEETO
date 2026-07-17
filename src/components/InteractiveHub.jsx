import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, BrainCircuit, Rotate3d, X, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function InteractiveHub() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const hubRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (hubRef.current && !hubRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const triggerEvent = (eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
    setIsOpen(false);
  };

  return (
    <motion.div
      ref={hubRef}
      drag
      dragMomentum={false}
      className="fixed bottom-36 left-6 sm:bottom-6 sm:left-22 z-40 font-sans"
    >
      {/* Expanded Menu Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute bottom-16 left-0 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4.5 w-64 shadow-2xl flex flex-col gap-2.5 z-50 text-left"
          >
            {/* Header Title */}
            <div className="flex items-center justify-between px-1.5 pb-1 border-b border-white/5">
              <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
                {lang === 'fr' ? 'Sweeto Cadeaux 🎁' : 'Sweeto Fun Center 🎁'}
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer p-0 bg-transparent border-none"
              >
                <X size={12} />
              </button>
            </div>

            {/* Menu Options */}
            <div className="flex flex-col gap-1.5">
              
              {/* Option 1: Spin Wheel */}
              <button
                onClick={() => triggerEvent('open-spin-wheel')}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/25 shrink-0 group-hover:scale-105 transition-all">
                  <Rotate3d size={16} className="animate-spin-slow" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {lang === 'fr' ? 'Roue de Fortune' : 'Spin the Wheel'}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate">
                    {lang === 'fr' ? 'Gagnez des remises instantanées' : 'Win instant checkout discounts'}
                  </p>
                </div>
              </button>

              {/* Option 2: Scratch Card */}
              <button
                onClick={() => triggerEvent('open-scratch-card')}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/25 shrink-0 group-hover:scale-105 transition-all">
                  <Sparkles size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {lang === 'fr' ? 'Carte à Gratter' : 'Scratch & Win'}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate">
                    {lang === 'fr' ? 'Révélez la livraison gratuite' : 'Reveal free shipping coupons'}
                  </p>
                </div>
              </button>

              {/* Option 3: AI Finder Quiz */}
              <button
                onClick={() => triggerEvent('open-shopping-quiz')}
                className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/25 shrink-0 group-hover:scale-105 transition-all">
                  <BrainCircuit size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">
                    {lang === 'fr' ? 'AI Guide d\'Achat' : 'AI Shopping Quiz'}
                  </h4>
                  <p className="text-[9px] text-slate-400 truncate">
                    {lang === 'fr' ? 'Trouvez l\'appareil idéal' : 'Find your perfect device matches'}
                  </p>
                </div>
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Hub Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-rose-500/25 cursor-pointer relative"
        title={lang === 'fr' ? 'Sweeto Cadeaux' : 'Sweeto Gift Center'}
      >
        <Gift size={20} className="animate-pulse" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border border-white dark:border-slate-900 rounded-full animate-ping" />
      </motion.button>
    </motion.div>
  );
}
