import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Bell, Sparkles } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

const RealtimeNotification = () => {
  const { realtimeNotification, setRealtimeNotification, settings } = useStore();

  if (!realtimeNotification) return null;

  // Handler for viewing the product
  const handleView = () => {
    // Navigate using React Router or update window.location. href to trigger route match
    // Since we handle URLs to open modals, changing hash or URL path works.
    window.location.href = `/#/product/${realtimeNotification.id}`;
    setRealtimeNotification(null);
  };

  return (
    <AnimatePresence>
      {realtimeNotification && (
        <div className="fixed top-24 right-4 z-[9999] w-full max-w-sm px-4 md:px-0">
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: -30, scale: 0.95, filter: 'blur(5px)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] rounded-[2rem] p-5 flex flex-col gap-4 overflow-hidden relative group"
          >
            {/* Visual ambient light accent */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-blue-500/10 dark:bg-eas-blue/20 blur-[30px] pointer-events-none group-hover:scale-125 transition-transform duration-500" />
            
            {/* Top header line */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-eas-blue dark:text-blue-400">
                <div className="w-7 h-7 bg-eas-blue/10 rounded-lg flex items-center justify-center animate-pulse">
                  <Bell size={14} className="text-eas-blue animate-bounce" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.25em]">WhatsApp Drop Alert</span>
              </div>
              <button
                onClick={() => setRealtimeNotification(null)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Notification content: product info */}
            <div className="flex gap-4 items-center">
              <div className="relative w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 shadow-inner">
                {realtimeNotification.image_url ? (
                  <img
                    src={realtimeNotification.image_url}
                    alt={realtimeNotification.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Sparkles size={24} />
                  </div>
                )}
                <div className="absolute top-1 right-1 p-1 bg-amber-500 text-white rounded-md">
                  <Sparkles size={8} />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate mb-1">
                  🆕 {realtimeNotification.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-1">
                  A premium {realtimeNotification.category || 'item'} has been added to our catalog.
                </p>
                <span className="text-xs font-black text-eas-blue">
                  {settings?.currency || 'FCFA'} {Number(realtimeNotification.price).toLocaleString()}
                </span>
              </div>
            </div>

            {/* View Details Action Trigger */}
            <button
              onClick={handleView}
              className="w-full py-3.5 bg-slate-950 dark:bg-eas-blue text-white hover:bg-slate-900 dark:hover:bg-blue-600 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/10"
            >
              <span>View Deal</span>
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RealtimeNotification;
