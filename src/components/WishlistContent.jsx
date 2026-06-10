import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';

const WishlistContent = ({ onProductClick }) => {
  const { wishlistItems } = useWishlist();
  const { t } = useLanguage();

  if (wishlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 md:py-40 text-center relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-eas-blue/5 rounded-full blur-[120px] -z-10" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl flex items-center justify-center mb-10 relative group"
        >
          <Heart size={48} className="text-slate-200 dark:text-slate-800 group-hover:text-red-500 transition-colors duration-500" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-tr from-red-500 to-rose-400 rounded-2xl border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center shadow-lg">
            <span className="text-white text-[10px] font-black italic">0</span>
          </div>
        </motion.div>

        <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic mb-6 leading-tight max-w-2xl px-2">
          {t('wishlist_empty') || 'Your Wishlist is Empty'}
        </h2>
        <p className="text-slate-400 max-w-lg mx-auto mb-4 font-black text-sm uppercase tracking-[0.2em] leading-relaxed px-6">
          {t('wishlist_empty_desc') || "Your curated collection is waiting. Explore our premium inventory and save your favorites here."}
        </p>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic max-w-xs leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 mt-2 mb-12">
          « Elite Local Commerce • Managed by @sweeto »
        </p>
        
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/'}
          className="bg-[#00204a] text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-eas-blue transition-all flex items-center gap-4 shadow-xl shadow-eas-blue/20"
        >
          {t('explore_products') || 'Start Discovery'} <ArrowRight size={18} />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 md:px-12 py-6 sm:py-12 overflow-hidden">
      <div className="relative mb-10 sm:mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-8 pb-6 sm:pb-10 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="p-3 sm:p-6 bg-gradient-to-br from-red-600 to-rose-500 shadow-2xl shadow-red-500/20 rounded-2xl sm:rounded-[30px] shrink-0"
            >
              <Heart size={24} className="text-white sm:w-8 sm:h-8" fill="currentColor" />
            </motion.div>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-5xl md:text-7xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none truncate">{t('saved_gear') || 'Saved Gear'}</h2>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate">
                  {wishlistItems.length} {wishlistItems.length === 1 ? t('item') || 'Item' : t('items') || 'Items'} {t('ready_checkout') || 'Curated'}
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
             <div className="h-12 w-[1px] bg-slate-100 dark:bg-slate-900 hidden md:block" />
             <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest mb-1">{t('curation_status') || 'Curation Status'}</span>
                <span className="text-xs font-black text-eas-blue uppercase italic tracking-tighter bg-eas-blue/5 px-4 py-1.5 rounded-full border border-eas-blue/10">Premium Collection</span>
             </div>
          </div>
        </div>
        
        {/* Abstract Background Decoration */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -z-10" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-x-8 sm:gap-y-16">
        {wishlistItems.map((product, idx) => (
          <ProductCard 
            key={`${product.id}-${idx}`} 
            product={product} 
            index={idx} 
            onProductClick={onProductClick}
          />
        ))}
      </div>
    </div>
  );
};

export default WishlistContent;
