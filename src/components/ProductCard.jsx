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
  if (supabase) {
    Promise.resolve(
      supabase.from('visitor_log').insert([{
        page_path,
        event_type,
        country: window.localStorage.getItem('user_country') || 'Unknown'
      }])
    ).then(() => {}).catch(() => {});
  }
};

const getSocialProof = (product, lang) => {
  const isFr = lang === 'fr';
  const idStr = String(product.id || '');
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash += idStr.charCodeAt(i);
  }
  
  // Deterministic count between 12 and 48
  const count = 12 + (hash % 37);
  const type = hash % 3; // 0, 1, 2
  
  if (type === 0) {
    return isFr ? "✨ Stock Limité" : "✨ Limited Stock";
  } else if (type === 1) {
    return isFr ? `🔥 ${count} vendus cette semaine` : `🔥 ${count} sold this week`;
  } else {
    return isFr ? `⚡ Seulement ${5 + (hash % 5)} restants` : `⚡ Only ${5 + (hash % 5)} left`;
  }
};

const ProductCard = ({ product, index = 0, onProductClick, isDailyDeal = false }) => {
  const { settings } = useStore();
  const { isDarkMode } = useTheme();
  const { lang, t, t_smart } = useLanguage();
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


  const handleDetailsClick = (e) => {
    e.stopPropagation();
    handleCardClick(e);
  };

  return (
    <>
      <motion.div 
        whileHover={{ y: -6 }}
        onClick={handleCardClick}
        className="group relative rounded-[20px] overflow-hidden border border-slate-100 dark:border-[#1f2430] hover:border-blue-500/50 dark:hover:border-blue-500/40 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col h-full cursor-pointer w-full bg-white dark:bg-[#0b0d14] p-3"
      >
        {/* Image Container */}
        <div className="relative aspect-square bg-[#f8f9fa] dark:bg-white p-4 flex items-center justify-center rounded-[16px] overflow-hidden mb-3">
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-blue-600 text-white font-extrabold text-[8px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-sm uppercase tracking-wider">
              {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE DEAL'}
            </span>
          </div>

          {discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="bg-[#ff3b30] text-white font-extrabold text-[8px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-sm uppercase tracking-wider">
                -{discountPercent}%
              </span>
            </div>
          )}

          {/* Wishlist Button (Floating/Subtle overlay inside image container) */}
          <div className="absolute bottom-2.5 right-2.5 z-20 flex flex-col gap-1.5">
            <button 
              onClick={handleToggleWishlist}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-md flex items-center justify-center transition-all backdrop-blur-md border ${
                isWished 
                  ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                  : 'bg-white/80 dark:bg-white/90 border-white/20 text-slate-800 hover:text-[#ff3b30]'
              }`}
            >
              <Heart size={14} className="sm:w-4 sm:h-4" fill={isWished ? "currentColor" : "none"} />
            </button>
          </div>

          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/hero-banner.png';
            }}
            className="w-4/5 h-4/5 object-contain transition-transform duration-700 group-hover:scale-110" 
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 px-1">
          {/* Category */}
          <span className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider uppercase mb-1">
            {t_smart(product.category)}
          </span>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug tracking-normal line-clamp-1 mb-1.5 uppercase">
            {t_smart(product.name)}
          </h3>

          {/* Description */}
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {product.description || (lang === 'fr' ? "Protégez vos yeux avec style sous le soleil avec nos produits de qualité supérieure." : "Protect your eyes in style under the sun with our premium products.")}
          </p>

          {/* Price Section */}
          <div className="mt-auto">
            {/* Row 1: Today label + Original price */}
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider">
                {lang === 'fr' ? "AUJOURD'HUI" : "TODAY"}
              </span>
              {product.original_price && (
                <span className="text-slate-400 dark:text-slate-500 line-through text-[11px] sm:text-xs font-semibold font-mono">
                  {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                </span>
              )}
            </div>

            {/* Row 2: Current price */}
            <div className="flex items-baseline mb-4">
              <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {product.price?.toLocaleString()}
              </span>
              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-900 dark:text-white font-mono uppercase tracking-wider ml-1">
                {settings?.currency || 'FCFA'}
              </span>
            </div>
          </div>

          {/* Buttons Row */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button 
              onClick={handleDetailsClick}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold transition-all active:scale-95 duration-200"
            >
              <Eye size={14} />
              <span>{lang === 'fr' ? 'Détails' : 'Details'}</span>
            </button>
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all active:scale-95 duration-200 shadow-md shadow-blue-500/10 dark:shadow-none"
            >
              <ShoppingCart size={14} />
              <span>{lang === 'fr' ? 'Ajouter' : 'Add'}</span>
            </button>
          </div>
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

