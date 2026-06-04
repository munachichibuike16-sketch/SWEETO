import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const StoreContent = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 md:py-24 max-w-4xl mx-auto overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-96 h-96 bg-eas-blue/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute top-12 right-12 -z-10 w-48 h-48 bg-amber-500/5 blur-[80px] rounded-full" />

      {/* Main Glass Panel Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white/40 dark:bg-slate-900/30 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* Subtle top light reflection */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />

        {/* Animated Icon Container */}
        <motion.div
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 bg-eas-blue/10 dark:bg-eas-blue/20 rounded-3xl flex items-center justify-center text-eas-blue shadow-inner mb-8 border border-eas-blue/20"
        >
          <ShoppingBag size={36} className="stroke-[2]" />
        </motion.div>

        {/* Redefined Store Header Block */}
        <div className="mb-6 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-eas-blue dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 px-5 py-2 rounded-full mb-4 shadow-sm"
          >
            <ShoppingBag size={14} className="text-eas-blue animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{lang === 'fr' ? 'ESPACE BOUTIQUE' : 'STORE HUB'}</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
            MY <span className="text-eas-blue underline decoration-amber-500/30">{lang === 'fr' ? 'BOUTIQUE' : 'STORE'}</span>
          </h1>
        </div>

        {/* Status Line */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
          <span>{lang === 'fr' ? 'Bientôt disponible' : 'Coming Soon'}</span>
        </div>

        {/* Description */}
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mb-8">
          {lang === 'fr' 
            ? 'Notre boutique en ligne complète se refait une beauté. Revenez très bientôt pour découvrir nos offres exclusives.'
            : 'Our complete online catalog is being redesigned. Check back soon to discover our exclusive collections.'}
        </p>

        {/* Quick Action Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/')}
          className="w-full py-4 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl dark:shadow-white/5 hover:bg-eas-blue dark:hover:bg-eas-blue dark:hover:text-white transition-all flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>{lang === 'fr' ? 'Retour à l\'accueil' : 'Back to Home'}</span>
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Watermark Tagline */}
        <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-6 mt-8">
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-650 italic leading-none uppercase tracking-widest">
            « Elite Local Commerce • Managed by @sweeto »
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default StoreContent;
