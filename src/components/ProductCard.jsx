import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Eye, ShoppingCart, Zap, TrendingUp, Share2 } from 'lucide-react';
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

const ProductCard = ({ product, index = 0, onProductClick, isDailyDeal = false, layout = 'default' }) => {
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

  const handleShareProduct = (e) => {
    e.stopPropagation();
    
    // Construct the crawler-friendly share link
    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
    const shareTitle = product.name;
    const shareText = product.description || `Check out ${product.name} on SWEETO!`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      })
      .then(() => console.log('Successfully shared'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback: Copy link to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert(lang === 'fr' ? 'Lien de partage copié dans le presse-papiers !' : 'Share link copied to clipboard!');
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const discountPercent = product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);

  return (
    <>
      <motion.div 
        whileHover={{ y: -4 }}
        onClick={handleCardClick}
        className="group relative flex flex-col h-full cursor-pointer w-full bg-transparent border-0 p-0 shadow-none hover:shadow-none"
      >
        {/* Image Container */}
        <div className={`relative aspect-square w-full flex items-center justify-center overflow-hidden mb-2 rounded-2xl ${
          layout === 'aliexpress' ? 'bg-[#f4f4f4] dark:bg-slate-900/50' : 'bg-transparent'
        }`}>
          {/* Offre Élite Badge */}
          {(product.is_daily_deal === 1 || product.is_daily_deal === true || String(product.is_daily_deal) === '1' || String(product.is_daily_deal) === 'true') && (
            <div className="absolute top-2.5 left-2.5 z-20">
              <span className="bg-[#2563eb] text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-md uppercase tracking-wider leading-none select-none">
                {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE OFFER'}
              </span>
            </div>
          )}

          {/* Action Buttons (Floating overlay inside image container top-right) */}
          <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
            {layout !== 'aliexpress' && (
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
            )}
            <button 
              onClick={handleShareProduct}
              className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-[#2563eb] dark:hover:text-[#3b82f6]"
            >
              <Share2 size={13} />
            </button>
          </div>

          {/* Cart Button (Floating overlay inside image container bottom-right, AliExpress style) */}
          <div className="absolute bottom-2.5 right-2.5 z-20">
            <button 
              onClick={handleAddToCart}
              className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all text-slate-900 dark:text-white cursor-pointer"
            >
              <ShoppingCart size={13} className="text-slate-900 dark:text-white" />
            </button>
          </div>

          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/hero-banner.png';
            }}
            className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
              layout === 'aliexpress' ? 'object-cover' : 'object-contain'
            }`} 
          />
        </div>

        {/* Content */}
        {layout === 'aliexpress' ? (
          <div className="flex flex-col flex-1 py-0.5 text-start px-0.5">
            {/* Title at the top */}
            <h3 className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2 mb-1.5">
              {t_smart(product.name)}
            </h3>

            {/* Prices Row: Current Price & Original Price */}
            <div className="flex items-baseline flex-wrap gap-1.5 mb-1.5">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                {settings?.currency || 'XOF'}{product.price?.toLocaleString()}
              </span>
              {product.original_price && (
                <span className="text-[10.5px] sm:text-xs text-slate-400 dark:text-slate-500 line-through font-semibold font-mono">
                  {settings?.currency || 'XOF'}{product.original_price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Pink Discount Badge at the bottom */}
            {discountPercent > 0 && (
              <div className="mt-auto">
                <span className="bg-[#fff0f3] dark:bg-[#2b0811] text-[#ff007a] dark:text-[#ff4d94] font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider leading-none">
                  -{discountPercent}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 py-0.5 text-start">
            {/* Sold Count with Red Flame */}
            <div className="flex items-center gap-1 text-[11px] text-[#ff3b30] font-bold mb-1">
              <span>🔥</span>
              <span>
                {getSoldCount(product) > 0 ? `${getSoldCount(product)}` : `0`} {lang === 'fr' ? 'vendus' : 'sold'}
              </span>
              {reviews.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star size={11} fill="currentColor" />
                    <span>{averageRating}</span>
                  </div>
                </>
              )}
            </div>

            {/* Price & Discount Section */}
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none">
                {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
              </span>
              {discountPercent > 0 && (
                <span className="bg-[#ff007a] text-white font-extrabold text-[8px] sm:text-[9.5px] px-1.5 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider shrink-0 leading-none">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {product.original_price && (
              <div className="text-slate-400 dark:text-slate-500 line-through text-xs font-semibold font-mono mb-1">
                {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
              </div>
            )}

            {/* Title */}
            <h3 className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug line-clamp-2 uppercase mb-1">
              {t_smart(product.name)}
            </h3>
          </div>
        )}
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

