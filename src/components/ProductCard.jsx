import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Eye, ShoppingCart, Zap, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import QuickViewModal from './QuickViewModal';
import { supabase } from '../lib/supabase';

const trackVisit = (page_path, event_type) => {
  Promise.resolve(
    supabase.from('visitor_log').insert([{
      page_path,
      event_type,
      country: window.localStorage.getItem('user_country') || 'Unknown'
    }])
  ).then(() => {}).catch(() => {});
};

const ProductCard = ({ product, index = 0, onProductClick }) => {
  const { settings } = useStore();
  const { isDarkMode } = useTheme();
  const { t, t_smart } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleCardClick = (e) => {
    trackVisit(`/product/${product.id}`, 'product clicked');
    if (onProductClick) {
      onProductClick(product);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
  };

  const openQuickView = (e) => {
    e.stopPropagation();
    trackVisit(`/product/${product.id}`, 'product viewed');
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
  };

  const handleViewDetails = (prod) => {
    // Track view event
    trackVisit(`/product/${prod.id}`, 'product viewed');

    setIsQuickViewOpen(false);
    if (onProductClick) {
      onProductClick(prod);
    }
  };

  const isWished = isInWishlist(product.id);

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    
    if (!isWished) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      // "Rocket shot into the sky like stars" effect
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { x, y },
        startVelocity: 35,
        gravity: 0.7,
        ticks: 250,
        colors: ['#ff0000', '#ff4081', '#ffea00', '#ffffff'],
        shapes: ['star', 'circle']
      });
    }

    toggleWishlist(product);
  };

  const discountPercent = product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);

  return (
    <>
      <motion.div 
        whileHover={{ y: -10 }}
        onClick={handleCardClick}
        className={`group relative rounded-[1.6rem] sm:rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-white/5 hover:border-blue-500/50 dark:hover:border-blue-500/5 transition-all duration-500 hover:shadow-[0_20px_40px_rgba(59,130,246,0.18)] dark:hover:shadow-[0_20px_40px_rgba(59,130,246,0.35)] flex flex-col h-full cursor-pointer w-full ${
          (product.is_featured || discountPercent > 20)
            ? 'bg-transparent'
            : 'bg-white dark:bg-slate-900/60 dark:backdrop-blur-xl'
        }`}
      >
        {/* Animated Gradient Border & Background for Premium / High-discount / Featured Items */}
        {(product.is_featured || discountPercent > 20) && (
          <div className="absolute inset-0 p-[1.5px] rounded-[1.6rem] sm:rounded-[2.5rem] bg-gradient-to-r from-eas-blue via-indigo-500 to-eas-accent bg-[length:200%_auto] animate-gradient-shift -z-20">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[1.55rem] sm:rounded-[2.45rem]"></div>
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 flex flex-col items-start gap-1">
          {discountPercent > 0 && (
            <div className="bg-red-600 text-white text-[9px] sm:text-[11px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm shadow-lg">
              -{discountPercent}%
            </div>
          )}
        </div>

        {/* Floating Icons */}
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex flex-col gap-2 sm:gap-3">
          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleWishlist}
            className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-2xl flex items-center justify-center transition-all backdrop-blur-xl border ${
              isWished 
                ? 'bg-red-500 border-red-400 text-white shadow-red-500/40' 
                : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-red-500'
            }`}
          >
            <Heart size={16} className="sm:w-5 sm:h-5" fill={isWished ? "currentColor" : "none"} />
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.1, x: -5 }}
            onClick={openQuickView}
            className="hidden sm:flex w-12 h-12 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-slate-100 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-slate-800 dark:text-white hover:text-eas-blue transition-all duration-300 rounded-2xl items-center justify-center opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
          >
            <Eye size={20} />
          </motion.button>
        </div>

        {/* Image Container - Professional "Light Well" for dark mode */}
        <div className="relative aspect-square bg-slate-50 dark:bg-[#0f172a] p-4 sm:p-10 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-[#0f172a]/60 transition-all duration-700 overflow-hidden">
          {/* Subtle Inner Shadow for Depth */}
          <div className="absolute inset-0 shadow-inner opacity-50 pointer-events-none"></div>
          
          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/hero-banner.png';
            }}
            className={`w-4/5 h-4/5 sm:w-full sm:h-full object-contain transition-transform duration-700 group-hover:scale-110 ${
              !isDarkMode ? 'mix-blend-multiply' : ''
            }`} 
          />
          
          {/* Action Overlay */}
          <div className="absolute inset-0 bg-eas-blue/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={handleAddToCart}
              className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-eas-blue rounded-full shadow-2xl flex items-center justify-center text-eas-blue dark:text-white scale-75 group-hover:scale-100 transition-all duration-500"
            >
              <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-8 flex flex-col flex-1 bg-white dark:bg-transparent">
          <div className="mb-2 sm:mb-4">
            <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
              <span className="text-[8px] sm:text-[10px] font-black text-eas-blue uppercase tracking-[0.2em]">{t_smart(product.brand) || t('premium_edition')}</span>
              <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
              <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t_smart(product.category)}</span>
            </div>
            <h3 className="text-xs sm:text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tighter uppercase italic line-clamp-2 min-h-[2rem] sm:min-h-[3.5rem]">
              {t_smart(product.name)}
            </h3>
            
            {/* Stars & Sold Count row - fully visible and never cut off! */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-white/5">
              <div className="flex text-amber-400 gap-0.5">
                {(() => {
                  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
                  const avg = reviews.length > 0 ? Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
                  return (
                    <>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          fill={i < avg ? "currentColor" : "none"} 
                          className={`${i < avg ? "text-amber-400" : "text-slate-200 dark:text-slate-700"}`} 
                        />
                      ))}
                    </>
                  );
                })()}
              </div>
              <span className="text-[8px] sm:text-[9.5px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{product.sold || 0} {t('sold')}</span>
            </div>
          </div>

          <div className="mt-auto pt-3 sm:pt-4 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              {product.original_price && (
                <span className="text-slate-400 line-through text-[9px] sm:text-xs font-bold mb-0.5 sm:mb-1">
                  {settings?.currency || 'FCFA'} {product.original_price.toLocaleString()}
                </span>
              )}
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                  {product.price?.toLocaleString()}
                </span>
                <span className="text-[8px] sm:text-[10px] font-black text-eas-blue uppercase tracking-widest mb-0.5 sm:mb-1">{settings?.currency || 'FCFA'}</span>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:bg-eas-blue hover:text-white dark:hover:bg-eas-blue dark:hover:text-white transition-all border border-slate-100 dark:border-white/10 shrink-0"
            >
              <ShoppingCart size={14} />
            </button>
          </div>
        </div>

        {/* Hover Slide-up for Quick Actions */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-white dark:from-slate-900 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1] z-30">
          <button 
            onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
            className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] sm:text-[10px] py-3 sm:py-4 rounded-xl sm:rounded-2xl uppercase tracking-[0.2em] shadow-2xl"
          >
            {t('discover_product')}
          </button>
        </div>
      </motion.div>

      <QuickViewModal 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={closeQuickView}
        onViewDetails={handleViewDetails}
      />
    </>
  );
};

export default ProductCard;

