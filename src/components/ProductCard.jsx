import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Heart, Eye, ShoppingCart, Zap, TrendingUp, Share2, Scale } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import QuickViewModal from './QuickViewModal';
import ShareModal from './ShareModal';
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

const ProductCard = ({ product, index = 0, onProductClick, isDailyDeal = false, layout = 'default', hideDiscountAndOriginalPrice = false }) => {
  const navigate = useNavigate();
  const { settings, openGlobalLightbox, productViewsMap, productLikesMap, toggleProductLike, incrementProductView, showToast } = useStore();
  const { isDarkMode } = useTheme();
  const { lang, t, t_smart } = useLanguage();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const images = getImagesList(product);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageFade, setImageFade] = useState(true);

  React.useEffect(() => {
    if (images.length <= 1) return;
    const initialDelay = 1000 + Math.random() * 4000;
    let intervalId;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        setImageFade(false);
        setTimeout(() => {
          setCurrentImageIndex(prev => (prev + 1) % images.length);
          setImageFade(true);
        }, 300);
      }, 4000 + Math.random() * 2000);
    }, initialDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images.length]);

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



  const handleCardClick = (e) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(`/product/${product.id}`);
      window.scrollTo(0, 0);
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
    setIsShareOpen(true);
  };

  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0";
  const discountPercent = hideDiscountAndOriginalPrice ? 0 : (product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null));

  if (layout === 'unending') {
    const finalPrice = product.price || 0;
    const currSymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency || 'FCFA');
    const isWished = isInWishlist(product.id);
    const ratingVal = product.rating || 4.3;
    const reviewsCountVal = reviews.length > 0 ? reviews.length : 761;

    return (
      <>
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleCardClick}
          className="group relative flex flex-col justify-between h-full cursor-pointer w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-shadow select-none text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden mb-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-950 p-2">
            {/* Wishlist Button (Floating overlay top-right) */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button 
                onClick={handleToggleWishlist}
                className={`w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all border ${
                  isWished 
                    ? 'bg-red-500 border-red-500 text-white shadow-red-500/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart size={14} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            <img 
              src={images[currentImageIndex] || '/hero-banner.png'} 
              alt={product.name} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/hero-banner.png';
              }}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
          </div>

          {/* Info Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Brand & Category */}
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left mb-1.5">
                {product.brand || 'SWEETO'} · {product.category || 'Gear'}
              </div>

              {/* Title */}
              <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white text-left leading-snug mb-2 min-h-[40px]">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1 text-xs text-left mb-3">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(ratingVal) ? "currentColor" : "none"} strokeWidth={2.5} />
                  ))}
                </div>
                <span className="font-bold text-slate-500">
                  {ratingVal} ({reviewsCountVal})
                </span>
              </div>
            </div>

            <div>
              {/* Price */}
              <div className="text-xl font-black text-[#111322] dark:text-white text-left mb-4">
                {finalPrice.toLocaleString()} {currSymbol}
              </div>

              {/* Add to Cart button */}
              <button 
                onClick={handleAddToCart}
                className="w-full bg-[#111322] hover:bg-slate-900 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer select-none border-none outline-none"
              >
                <ShoppingCart size={14} fill="currentColor" />
                <span>{lang === 'fr' ? 'Ajouter' : 'Add to Cart'}</span>
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
  }

  if (layout === 'deal' || layout === 'bestseller') {
    const isFr = lang === 'fr';
    const finalPrice = product.price || 0;
    const oldPrice = product.original_price || (product.price * 1.25);
    const currSymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency || 'FCFA');
    const isWished = isInWishlist(product.id);
    const ratingVal = product.rating || 4.2;
    const reviewsCountVal = reviews.length > 0 ? reviews.length : 430;

    return (
      <>
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleCardClick}
          className="group relative flex flex-col justify-between h-full cursor-pointer w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-shadow select-none text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden mb-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-950 p-2">
            {/* Top-left Badge */}
            {layout === 'bestseller' ? (
              <span className="absolute top-2.5 left-2.5 bg-[#e61e25] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm select-none">
                {isFr ? 'SOLDES' : 'SALE'}
              </span>
            ) : (
              <span className="absolute top-2.5 left-2.5 bg-[#1e5cff] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm select-none">
                DEAL
              </span>
            )}

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute bottom-2.5 left-2.5 bg-[#00b050] text-white text-[10px] font-black px-2.5 py-1 rounded-full z-10">
                -{discountPercent}%
              </span>
            )}

            {/* Wishlist Button */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button 
                onClick={handleToggleWishlist}
                className={`w-7.5 h-7.5 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                  isWished 
                    ? 'bg-red-500 border-red-500 text-white shadow-red-500/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart size={14} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            <img 
              src={images[currentImageIndex] || '/hero-banner.png'} 
              alt={product.name} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/hero-banner.png';
              }}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
          </div>

          {/* Info Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Brand & Category */}
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-left mb-1.5">
                {product.brand || 'SWEETO'} · {product.category || (layout === 'bestseller' ? 'Bestseller' : 'Deals')}
              </div>

              {/* Title */}
              <h3 className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white text-left leading-snug mb-2 min-h-[40px]">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1.5 text-xs text-left mb-3">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} fill={i < Math.round(ratingVal) ? "currentColor" : "none"} strokeWidth={2.5} />
                  ))}
                </div>
                <span className="font-bold text-slate-500">
                  {ratingVal} ({reviewsCountVal})
                </span>
              </div>
            </div>

            <div>
              {/* Price block */}
              <div className="flex items-baseline gap-2 text-left mb-4">
                <span className="text-xl font-black text-[#111322] dark:text-white">
                  {finalPrice.toLocaleString()} {currSymbol}
                </span>
                {oldPrice && oldPrice > finalPrice && !hideDiscountAndOriginalPrice && (
                  <span className="text-sm text-slate-400 line-through font-bold">
                    {oldPrice.toLocaleString()} {currSymbol}
                  </span>
                )}
              </div>

              {/* Add to Cart button */}
              {layout === 'bestseller' ? (
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-[#1e5cff] hover:bg-[#1554c0] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer select-none border-none outline-none"
                >
                  <ShoppingCart size={14} fill="currentColor" />
                  <span>{isFr ? 'Ajouter' : 'Add to Cart'}</span>
                </button>
              ) : (
                <button 
                  onClick={handleAddToCart}
                  className="w-full bg-[#1e5cff] hover:bg-[#1554c0] text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer select-none border-none outline-none"
                >
                  <ShoppingCart size={14} fill="currentColor" />
                  <span>{isFr ? 'Ajouter' : 'Add to Cart'}</span>
                </button>
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

  if (layout === 'new_arrivals') {
    const isFr = lang === 'fr';

    return (
      <>
        <motion.div 
          whileHover={{ y: -6 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleCardClick}
          className="group relative flex flex-col h-full cursor-pointer w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-shadow select-none text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden mb-3.5 rounded-2xl bg-[#f8fafc] dark:bg-slate-950 p-2">
            {/* Top-left Badge */}
            <span className="absolute top-2.5 left-2.5 bg-[#1e5cff] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm select-none">
              {isFr ? 'NOUVEAU' : 'NEW'}
            </span>

            {/* Discount Badge */}
            {discountPercent > 0 && (
              <span className="absolute bottom-2.5 left-2.5 bg-[#00b050] text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
                -{discountPercent}%
              </span>
            )}

            {/* Wishlist Button (Floating overlay top-right) */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button 
                onClick={handleToggleWishlist}
                className={`w-7.5 h-7.5 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                  isWished 
                    ? 'bg-red-500 border-red-500 text-white shadow-red-500/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:text-red-500'
                }`}
              >
                <Heart size={14} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            <img 
              src={images[currentImageIndex] || '/hero-banner.png'} 
              alt={product.name} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/hero-banner.png';
              }}
              className={`w-full h-full object-contain p-1 group-hover:scale-105 transition-all duration-300 rounded-lg ${
                imageFade ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>

          {/* Info Details */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Category / Brand */}
              <div className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest text-left mb-1.5">
                {product.brand || 'SWEETO'} · {product.category || 'New'}
              </div>

              {/* Title */}
              <h3 className="line-clamp-2 text-xs font-bold text-slate-850 dark:text-white text-left leading-snug mb-1.5 min-h-[32px]">
                {t_smart(product.name)}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1 text-[11px] text-left mb-2">
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={11} fill={i < Math.round(Number(averageRating || 4.2)) ? "currentColor" : "none"} strokeWidth={2.5} />
                  ))}
                </div>
                <span className="font-bold text-slate-500">
                  {averageRating || '4.2'} ({getSoldCount(product)})
                </span>
              </div>
            </div>

            <div>
              {/* Price Row */}
              <div className="flex items-baseline gap-1.5 text-left mb-3.5">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
                </span>
                {product.original_price && product.original_price > product.price && !hideDiscountAndOriginalPrice && (
                  <span className="text-xs text-slate-400 line-through font-bold">
                    {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                  </span>
                )}
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                className="w-full bg-[#1e5cff] hover:bg-[#1554C0] text-white font-black text-[11px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <ShoppingCart size={12} fill="currentColor" />
                <span>{isFr ? 'Ajouter' : 'Add to Cart'}</span>
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
  }

  if (layout === 'clean') {
    const finalPrice = product.price || 0;
    const currSymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency || 'FCFA');
    const isWished = isInWishlist(product.id);
    const ratingVal = product.rating || 4.3;
    const reviewsCountVal = reviews.length > 0 ? reviews.length : 761;

    return (
      <>
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleCardClick}
          className="group relative flex flex-col h-full cursor-pointer w-full bg-transparent border-0 p-0 shadow-none hover:shadow-none text-left"
        >
          {/* Image Container */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden mb-3 rounded-2xl bg-slate-50 dark:bg-[#020617] p-3">
            {/* Wishlist Button Overlay on top-right */}
            <div className="absolute top-2.5 right-2.5 z-20">
              <button 
                onClick={handleToggleWishlist}
                className={`w-7.5 h-7.5 rounded-full shadow-md flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${
                  isWished 
                    ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                    : 'bg-white/75 dark:bg-slate-900/75 border-slate-200/40 dark:border-slate-800/40 text-slate-700 dark:text-slate-350 hover:bg-[#ff3b30] hover:text-white'
                }`}
              >
                <Heart size={13} fill={isWished ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Cart Button Overlay on bottom-right */}
            <div className="absolute bottom-2.5 right-2.5 z-20">
              <button 
                onClick={handleAddToCart}
                className="w-7.5 h-7.5 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center hover:bg-[#1e5cff] hover:text-white active:scale-95 transition-all text-slate-800 dark:text-white cursor-pointer"
              >
                <ShoppingCart size={13} />
              </button>
            </div>

            <img 
              src={images[currentImageIndex] || '/hero-banner.png'} 
              alt={product.name} 
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = '/hero-banner.png';
              }}
              className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300 rounded-lg"
            />
          </div>

          {/* Info Details in correct order: Category, Title, Rating, Price */}
          <div className="flex flex-col flex-1 py-0.5 text-left space-y-1.5">
            {/* Category / Brand */}
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              {product.brand || 'SWEETO'} · {product.category || 'LUXEOPTIK'}
            </div>

            {/* Title */}
            <h3 className="line-clamp-2 text-[13px] sm:text-sm font-black text-slate-905 dark:text-white leading-tight uppercase">
              {t_smart(product.name)}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <div className="flex text-[#ffc200]">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={10} 
                    className={i < Math.floor(Number(ratingVal)) ? 'text-[#ffc200] fill-[#ffc200]' : 'text-slate-200 dark:text-slate-700'} 
                  />
                ))}
              </div>
              <span className="text-[8px] font-extrabold text-slate-400">({reviewsCountVal})</span>
            </div>

            {/* Price */}
            <div className="text-[14px] sm:text-base font-black text-slate-955 dark:text-white font-mono mt-auto leading-none">
              {finalPrice.toLocaleString()} <span className="text-[9px]">{currSymbol}</span>
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
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                className={`w-7.5 h-7.5 rounded-full shadow-md flex items-center justify-center transition-all duration-300 backdrop-blur-md border ${
                  isWished 
                    ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30 shadow-sm scale-105' 
                    : 'bg-white/75 dark:bg-slate-900/75 border-slate-200/40 dark:border-slate-800/40 text-slate-700 dark:text-slate-350 hover:bg-[#ff3b30] hover:text-white hover:border-[#ff3b30] hover:scale-105'
                }`}
              >
                <Heart size={13} fill={isWished ? "currentColor" : "none"} />
              </button>
            )}

          </div>

          {/* Cart Button (Floating overlay inside image container bottom-right, AliExpress style) */}
          <div className="absolute bottom-2.5 right-2.5 z-20">
            <button 
              onClick={handleAddToCart}
              className="w-7.5 h-7.5 rounded-full bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-md flex items-center justify-center border border-slate-200/40 dark:border-slate-800/40 hover:bg-[#2563EB] hover:text-white hover:border-[#2563EB] hover:scale-105 active:scale-95 transition-all text-slate-750 dark:text-white cursor-pointer group"
            >
              <ShoppingCart size={13} className="text-slate-750 dark:text-white group-hover:text-white" />
            </button>
          </div>

          <img 
            src={images[currentImageIndex] || '/hero-banner.png'} 
            alt={product.name} 
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = '/hero-banner.png';
            }}
            className={`w-full h-full group-hover:scale-105 transition-all duration-500 ${
              layout === 'aliexpress' ? 'object-cover' : 'object-contain'
            } ${imageFade ? 'opacity-100' : 'opacity-0'}`} 
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
                {product.original_price && product.original_price > product.price && !hideDiscountAndOriginalPrice && (
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

            {product.original_price && !hideDiscountAndOriginalPrice && (
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

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        product={product}
        showToast={showToast}
      />
    </>
  );
};

export default ProductCard;

