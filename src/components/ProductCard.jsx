import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Eye, ShoppingCart, Zap, TrendingUp, Share2, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import QuickViewModal from './QuickViewModal';
import { logVisitorEvent } from '../utils/analytics';
import { API_BASE_URL } from '../utils/api';

const trackVisit = (page_path, event_type, product_name = '') => {
  logVisitorEvent(page_path, event_type, product_name);
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
  const { settings, openGlobalLightbox, productViewsMap, productLikesMap, toggleProductLike, incrementProductView, showToast } = useStore();
  const { isDarkMode } = useTheme();
  const { lang, t, t_smart } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  React.useEffect(() => {
    const checkCompared = () => {
      try {
        const list = JSON.parse(localStorage.getItem('sweetohub_compare_list') || '[]');
        setIsCompared(list.includes(product.id));
      } catch (e) {
        setIsCompared(false);
      }
    };
    checkCompared();
    window.addEventListener('sweetohub-compare-change', checkCompared);
    return () => window.removeEventListener('sweetohub-compare-change', checkCompared);
  }, [product.id]);

  const handleToggleCompare = (e) => {
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem('sweetohub_compare_list') || '[]');
      let newList;
      if (list.includes(product.id)) {
        newList = list.filter(id => id !== product.id);
      } else {
        newList = [...list, product.id];
      }
      localStorage.setItem('sweetohub_compare_list', JSON.stringify(newList));
      window.dispatchEvent(new Event('sweetohub-compare-change'));
    } catch (err) {
      console.error(err);
    }
  };

  const isNewArrivalProduct = (() => {
    if (product.created_at) {
      const createdDate = new Date(product.created_at);
      const ageInDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
      return ageInDays <= 5;
    }
    return Number(product.is_new_arrival) === 1 || product.is_new_arrival === true || String(product.is_new_arrival) === '1' || String(product.is_new_arrival) === 'true';
  })();

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
    incrementProductView(product.id);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
  };

  const handleViewDetails = (prod) => {
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
    toggleProductLike(product.id, !isWished);
  };

  const handleShareProduct = (e) => {
    e.stopPropagation();
    
    // Construct the crawler-friendly share link pointing to the backend metadata route
    const baseShareUrl = (API_BASE_URL && !API_BASE_URL.includes('your-backend-service.onrender.com'))
      ? API_BASE_URL 
      : window.location.origin;
    const shareUrl = `${baseShareUrl}/share/product/${product.id}?redirect=${encodeURIComponent(window.location.origin)}`;
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
          if (showToast) {
            showToast(lang === 'fr' ? 'Lien de partage copié dans le presse-papiers ! 🔗' : 'Share link copied to clipboard! 🔗', 'success');
          } else {
            alert(lang === 'fr' ? 'Lien de partage copié dans le presse-papiers !' : 'Share link copied to clipboard!');
          }
        })
        .catch((err) => {
          console.error('Failed to copy: ', err);
        });
    }
  };

  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const discountPercent = product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);

  if (layout === 'new_arrivals') {
    const isEarlyBird = index < 3;
    const isFr = lang === 'fr';

    return (
      <>
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={handleCardClick}
          className="group relative flex flex-col h-full cursor-pointer w-full bg-transparent border-0 p-0 shadow-none hover:shadow-none select-none text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden mb-2.5 rounded-2xl bg-[#f4f4f4] dark:bg-slate-905 p-1">
            {/* Top-left Badges Container */}
            <div className="absolute top-2.5 left-2.5 z-20 flex flex-col sm:flex-row gap-1.5">
              {isNewArrivalProduct && (
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-md uppercase tracking-wider leading-none select-none">
                  {lang === 'fr' ? 'NOUVEAU' : 'NEW'}
                </span>
              )}
              {(product.is_daily_deal === 1 || product.is_daily_deal === true || String(product.is_daily_deal) === '1' || String(product.is_daily_deal) === 'true') && (
                <span className="bg-[#2563eb] text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-md uppercase tracking-wider leading-none select-none">
                  {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE OFFER'}
                </span>
              )}
            </div>
            {/* Action Buttons (Floating overlay top-right) */}
            <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
              <button 
                onClick={handleToggleWishlist}
                className={`w-8.5 h-8.5 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                  isWished 
                    ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                    : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-[#ff3b30]'
                }`}
              >
                <Heart size={15} fill={isWished ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={handleToggleCompare}
                className={`w-8.5 h-8.5 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                  isCompared 
                    ? 'bg-orange-500 border-orange-500 text-white shadow-orange-500/30' 
                    : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-orange-500'
                }`}
                title={lang === 'fr' ? 'Comparer ce produit' : 'Compare this product'}
              >
                <Scale size={15} />
              </button>
            </div>

            {/* Cart Button (Floating overlay bottom-right) */}
            <div className="absolute bottom-2.5 right-2.5 z-20">
              <button 
                onClick={handleAddToCart}
                className="w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all text-slate-900 dark:text-white cursor-pointer"
              >
                <ShoppingCart size={15} className="text-slate-900 dark:text-white" />
              </button>
            </div>

            <img 
              src={product.image_url || product.image || '/hero-banner.png'} 
              alt={product.name} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/hero-banner.png';
              }}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
          </div>

          {/* Title & Badges */}
          <div className="flex flex-col flex-1 py-0.5 text-start">
            <div className="flex items-start gap-1.5 mt-1.5 w-full leading-tight text-left">
              {index % 2 === 0 ? (
                <span className="bg-[#fff000] text-black text-[9.5px] font-black px-2 py-0.5 rounded leading-none shrink-0 uppercase">Choice</span>
              ) : (
                <span className="bg-[#1e5cff] text-white text-[9.5px] font-black px-2 py-0.5 rounded leading-none shrink-0 uppercase">Marque+</span>
              )}
              <span className="line-clamp-2 text-[13px] font-bold text-slate-700 dark:text-slate-350">
                {t_smart(product.name)}
              </span>
            </div>

            {/* Deal tag and Stats */}
            <div className="mt-2.5 text-[12px] font-medium leading-normal">
              {isEarlyBird ? (
                <>
                  <div className="text-[#ff0a24] font-black">
                    {isFr ? "Offre de lancement" : "Early bird deal"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {getSoldCount(product)} {isFr ? 'vendus' : 'sold'}
                  </div>
                </>
              ) : (
                <div className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5">
                  <span>{getSoldCount(product)} {isFr ? 'vendus' : 'sold'}</span>
                  {reviews.length > 0 && reviews.length !== "0.0" && (
                    <span className="flex items-center gap-0.5 text-amber-500">
                      <span>⭐</span>
                      <span>{averageRating}</span>
                    </span>
                  )}
                </div>
              )}
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
  }

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
          {/* Top-left Badges Container */}
          <div className="absolute top-2.5 left-2.5 z-20 flex flex-col sm:flex-row gap-1.5">
            {isNewArrivalProduct && (
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-md uppercase tracking-wider leading-none select-none">
                {lang === 'fr' ? 'NOUVEAU' : 'NEW'}
              </span>
            )}
            {(product.is_daily_deal === 1 || product.is_daily_deal === true || String(product.is_daily_deal) === '1' || String(product.is_daily_deal) === 'true') && (
              <span className="bg-[#2563eb] text-white font-black text-[9px] sm:text-[10px] px-2.5 py-1 rounded-[6px] shadow-md uppercase tracking-wider leading-none select-none">
                {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE OFFER'}
              </span>
            )}
          </div>

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
              onClick={handleToggleCompare}
              className={`w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border ${
                isCompared 
                  ? 'bg-orange-500 border-orange-500 text-white shadow-orange-500/30' 
                  : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-orange-500 dark:hover:text-orange-400'
              }`}
              title={lang === 'fr' ? 'Comparer ce produit' : 'Compare this product'}
            >
              <Scale size={13} />
            </button>
            <button 
              onClick={handleShareProduct}
              className="w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white hover:text-[#2563eb] dark:hover:text-[#3b82f6] cursor-pointer"
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
            {/* Pricing row with Slanted Red Discount Ribbon */}
            <div className="flex items-stretch justify-between w-full mt-1 overflow-hidden">
              <div className="flex flex-col text-left justify-center pl-0.5">
                <span className="text-[14px] sm:text-base font-black text-slate-900 dark:text-white leading-none">
                  {settings?.currency || 'FCFA'} {product.price?.toLocaleString()}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-[10px] sm:text-[12px] font-bold text-slate-450 dark:text-slate-500 line-through mt-1.5 font-mono leading-none">
                    {settings?.currency || 'FCFA'} {product.original_price.toLocaleString()}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <div 
                  className="bg-[#ff0a24] text-white font-black text-[10px] sm:text-[13px] pl-3.5 sm:pl-5.5 pr-2 sm:pr-3 py-1 sm:py-2 flex items-center justify-center italic shrink-0"
                  style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}
                >
                  -{discountPercent}%
                </div>
              )}
            </div>

            {/* Title with Choice/Marque+ Badge */}
            <div className="flex items-center gap-1.5 mt-2 w-full leading-tight text-left">
              {product.id % 2 === 0 ? (
                <span className="bg-[#fff000] text-black text-[8px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">Choice</span>
              ) : (
                <span className="bg-[#1e5cff] text-white text-[8px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">Marque+</span>
              )}
              <span className="line-clamp-1 text-[11px] sm:text-[13px] font-bold text-slate-700 dark:text-slate-350">
                {t_smart(product.name)}
              </span>
            </div>

            {/* Stock urgency / sales ratings */}
            <div className="mt-2 text-[10px] sm:text-[12px] font-medium leading-normal text-left">
              {/* Urgency Stock (Line 1) */}
              <div className="text-red-500 font-bold flex items-center gap-0.5">
                <span>🔥</span>
                <span>
                  {product.stock <= 1 
                    ? (lang === 'fr' ? '0 restant' : '0 remaining') 
                    : product.stock <= 3 
                      ? (lang === 'fr' ? 'Stock faible' : 'Low stock') 
                      : (lang === 'fr' ? `${product.stock || 5} restants` : `${product.stock || 5} remaining`)}
                </span>
              </div>
              {/* Sales & Rating (Line 2) */}
              <div className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                <span>{product.sold_count || 0} {lang === 'fr' ? 'vendus' : 'sold'}</span>
                {reviews.length > 0 && (
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <span>⭐</span>
                    <span>{averageRating}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 py-0.5 text-start">
            {/* Sold Count with Red Flame and Views Count */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs sm:text-[13px] font-extrabold mb-1">
              <span className="text-[#ff3b30] flex items-center gap-1">
                <span>🔥</span>
                <span>
                  {getSoldCount(product) > 0 ? `${getSoldCount(product)}` : `0`} {lang === 'fr' ? 'vendus' : 'sold'}
                </span>
              </span>
              <span className="text-slate-350 dark:text-slate-700">•</span>
              <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1 font-black">
                <span>👁️</span>
                <span>
                  {productViewsMap[product.id] || 0} {lang === 'fr' ? 'vues' : 'views'}
                </span>
              </span>
              <span className="text-slate-350 dark:text-slate-700">•</span>
              <span className="text-rose-550 dark:text-rose-450 flex items-center gap-1 font-black">
                <span>❤️</span>
                <span>
                  {productLikesMap[product.id] || 0} {lang === 'fr' ? 'likes' : 'likes'}
                </span>
              </span>
              {reviews.length > 0 && (
                <>
                  <span className="text-slate-350 dark:text-slate-700">•</span>
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

