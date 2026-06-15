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

const getSoldCount = (product) => {
  return product.sold_count || 0;
};

const ProductCard = ({ product, index = 0, onProductClick, isDailyDeal = false }) => {
  const { settings, openGlobalLightbox } = useStore();
  const { isDarkMode } = useTheme();
  const { lang, t, t_smart } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const getImagesList = (prod) => {
    if (!prod) return [];
    const list = [];
    const mainImg = prod.image_url || prod.image;
    if (mainImg) list.push(mainImg);
    if (prod.images) {
      try {
        const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
        if (Array.isArray(imgs)) {
          imgs.forEach(img => {
            if (img && !list.includes(img)) list.push(img);
          });
        }
      } catch (e) {}
    }
    if (list.length === 0) list.push('/hero-banner.png');
    return list;
  };

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

  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const discountPercent = product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);

  return (
    <>
      <motion.div 
        whileHover={{ y: -4 }}
        onClick={handleCardClick}
        className="group relative flex flex-col h-full cursor-pointer w-full bg-transparent border-0 p-0 hover:shadow-none"
      >
        {/* Image Container */}
        <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900/20 mb-2.5 p-1.5">
          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <span className="bg-blue-600 text-white font-extrabold text-[8px] sm:text-[9.5px] px-2 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider">
              {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE DEAL'}
            </span>
          </div>

          {discountPercent > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <span className="bg-[#ff3b30] text-white font-extrabold text-[8px] sm:text-[9.5px] px-2 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider">
                -{discountPercent}%
              </span>
            </div>
          )}

          {/* Wishlist Button (Floating overlay inside image container bottom-right) */}
          <div className="absolute bottom-2.5 right-2.5 z-20">
            <button 
              onClick={handleToggleWishlist}
              className={`w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border ${
                isWished 
                  ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                  : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-[#ff3b30]'
              }`}
            >
              <Heart size={13} fill={isWished ? "currentColor" : "none"} />
            </button>
          </div>

          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/hero-banner.png';
            }}
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 rounded-2xl" 
          />
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 py-1">
          {/* Price Section */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-baseline flex-wrap gap-1">
              <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
                {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
              </span>
              {product.original_price && (
                <span className="text-slate-400 dark:text-slate-500 line-through text-xs font-semibold font-mono">
                  {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                </span>
              )}
            </div>
            {/* Quick Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer shrink-0"
            >
              <ShoppingCart size={13} />
            </button>
          </div>

          {/* Badges / Choice */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
              Choice
            </span>
          </div>

          {/* Sold Count & Rating */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mb-1.5">
            <span className="font-medium">
              {getSoldCount(product) > 0 ? `+${getSoldCount(product)}` : `0`} {lang === 'fr' ? 'vendus' : 'sold'}
            </span>
            {reviews.length > 0 && (
              <>
                <span>•</span>
                <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                  <Star size={11} fill="currentColor" />
                  <span>{averageRating}</span>
                </div>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2 uppercase">
            {t_smart(product.name)}
          </h3>

          {/* Shipping Badge */}
          <div className="flex items-center gap-1 text-[11px] text-[#e61e25] font-semibold mt-1.5">
            <span>🚚</span>
            <span>{lang === 'fr' ? `Livraison: ${settings?.currency || 'XOF'} 1 500` : `Shipping: ${settings?.currency || 'XOF'} 1,500`}</span>
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

