import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const StoreContent = () => {
  const { lang } = useLanguage();

  return (
    <div className="relative min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 md:py-24 max-w-4xl mx-auto overflow-hidden">
      {/* Background Decorative Accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full" />

      {/* Styled Centered Pill */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="inline-flex items-center gap-3 bg-slate-950/10 dark:bg-slate-900/10 border border-blue-500/30 px-8 py-4 rounded-full shadow-lg select-none"
      >
        <ShoppingBag size={20} className="text-blue-500 dark:text-blue-400 stroke-[2.5]" />
        <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-500 dark:text-blue-400">
          {lang === 'fr' ? 'ESPACE BOUTIQUE' : 'STORE HUB'}
        </span>
      </motion.div>
    </div>
  );
};

export default StoreContent;
