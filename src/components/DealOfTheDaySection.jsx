import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, ChevronLeft, ChevronRight, ShoppingBag, Star, ShoppingCart, Heart } from 'lucide-react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import VideoAdSection from './VideoAdSection';
import { useStore } from '../contexts/StoreContext';
import { SectionBanner, SectionHeader, MiniSectionHeader } from './ProductSection';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';

const DealOfTheDaySection = ({ products, onProductClick, bannerImage, headerStyle, videoAdId, onCartClick, title, subtitle, sectionType = 'deal', scrollDirection = 'left' }) => {
  const navigate = useNavigate();
  const { cartCount, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { videoAds, settings, showToast } = useStore();
  const { t, lang, t_smart } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const isNewSection = title && (title.toUpperCase().includes('ARRIVED') || title.toUpperCase().includes('NEW') || title.toUpperCase().includes('NOUVEAU'));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const mobileScrollRef = React.useRef(null);
  const desktopScrollRef = React.useRef(null);

  // Triple products for infinite looping
  const duplicatedProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products, ...products, ...products];
  }, [products]);

  // Handle scroll boundary wrapping for mobile
  const handleMobileScroll = () => {
    const container = mobileScrollRef.current;
    if (!container || products.length === 0) return;
    
    const singleSetWidth = container.scrollWidth / 3;
    
    if (container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft -= singleSetWidth;
    } else if (container.scrollLeft <= singleSetWidth - container.clientWidth) {
      container.scrollLeft += singleSetWidth;
    }
  };

  // Handle scroll boundary wrapping for desktop
  const handleDesktopScroll = () => {
    const container = desktopScrollRef.current;
    if (!container || products.length === 0) return;
    
    const singleSetWidth = container.scrollWidth / 3;
    
    if (container.scrollLeft >= singleSetWidth * 2) {
      container.scrollLeft -= singleSetWidth;
    } else if (container.scrollLeft <= singleSetWidth - container.clientWidth) {
      container.scrollLeft += singleSetWidth;
    }
  };

  // Initialize scroll position to the middle (1x width) on load/update
  useEffect(() => {
    if (products.length > 0) {
      const initScroll = () => {
        if (mobileScrollRef.current) {
          const container = mobileScrollRef.current;
          container.scrollLeft = container.scrollWidth / 3;
        }
        if (desktopScrollRef.current) {
          const container = desktopScrollRef.current;
          container.scrollLeft = container.scrollWidth / 3;
        }
      };
      
      const timer = setTimeout(initScroll, 100);
      return () => clearTimeout(timer);
    }
  }, [products]);

  // Auto-slide interval for both Mobile and Desktop
  useEffect(() => {
    if (!products || products.length === 0 || isHovered || isExpanded) return;

    const interval = setInterval(() => {
      // Mobile scroll
      const mContainer = mobileScrollRef.current;
      if (mContainer && !isExpanded) {
        const firstChild = mContainer.firstElementChild;
        const cardWidth = firstChild ? firstChild.offsetWidth + 12 : 220; // card width + gap
        const singleSetWidth = mContainer.scrollWidth / 3;

        if (scrollDirection === 'right') {
          if (mContainer.scrollLeft <= singleSetWidth - mContainer.clientWidth) {
            mContainer.scrollLeft += singleSetWidth;
          }
          mContainer.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        } else {
          if (mContainer.scrollLeft >= singleSetWidth * 2) {
            mContainer.scrollLeft -= singleSetWidth;
          }
          mContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }

      // Desktop scroll
      const dContainer = desktopScrollRef.current;
      if (dContainer) {
        const firstChild = dContainer.firstElementChild;
        const cardWidth = firstChild ? firstChild.offsetWidth + 24 : 260; // card width + gap
        const singleSetWidth = dContainer.scrollWidth / 3;

        if (scrollDirection === 'right') {
          if (dContainer.scrollLeft <= singleSetWidth - dContainer.clientWidth) {
            dContainer.scrollLeft += singleSetWidth;
          }
          dContainer.scrollBy({ left: -cardWidth, behavior: 'smooth' });
        } else {
          if (dContainer.scrollLeft >= singleSetWidth * 2) {
            dContainer.scrollLeft -= singleSetWidth;
          }
          dContainer.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3000); // Slides every 3 seconds

    return () => clearInterval(interval);
  }, [products, isHovered, isExpanded, scrollDirection]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Time remaining countdown for Deal of the Day
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 22, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 }; // reset loop
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedAd = videoAdId && videoAdId !== 'All' && videoAdId !== 'none'
    ? videoAds.find(ad => String(ad.id) === String(videoAdId))
    : null;

  const activeAds = videoAds.filter(ad => ad.isActive);
  
  // Rotate ads every 15 seconds ONLY if we are not showing a specific pinned ad
  useEffect(() => {
    if (selectedAd || activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [activeAds.length, selectedAd]);

  // Get current active video ad
  const activeAd = selectedAd || activeAds[currentAdIndex] || {
    title: "EXCLUSIVE TECH DEALS",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80"
  };

  const showVideo = videoAdId !== 'none';
  const isSimple = true;

  return (
    <>
      {/* MOBILE/TABLET VIEW (Untouched original mobile version) */}
      <div className="block md:hidden">
        <section className="pt-2 pb-0 px-4 select-none">
          <div className="grid grid-cols-1 flex flex-col relative group/deals">
            <div className="flex items-center justify-center gap-3 w-full select-none mb-5 mt-3 px-2">
              {/* Left Line */}
              <div 
                className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-blue-500 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.3)]"
              />
              {/* Title */}
              <h2 className="animate-title-shining text-[14px] uppercase tracking-wider whitespace-nowrap shrink-0">
                {title ? title : (lang === 'fr' ? "OFFRES D'AUJOURD'HUI" : "TODAY'S OFFER")}
              </h2>
              {/* Right Line */}
              <div 
                className="h-[2px] flex-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full shadow-[0_0_6px_rgba(59,130,246,0.3)]"
              />
            </div>
            
              <div 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={() => setIsHovered(true)}
                onTouchEnd={() => setIsHovered(false)}
                onTouchCancel={() => setIsHovered(false)}
                className="relative mt-2 flex-1 flex flex-col justify-center"
              >
                <div 
                  ref={mobileScrollRef}
                  onScroll={handleMobileScroll}
                  id="deals-carousel-mobile"
                  className={isExpanded 
                    ? "grid grid-cols-2 gap-3 px-1 pb-2 animate-fadeIn"
                    : "flex overflow-x-auto gap-3 no-scrollbar pb-2"
                  }
                >
                {(isExpanded ? products.slice(0, 4) : duplicatedProducts).map((product, idx) => {
                  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : (product.discount || 25);
                  const soldCount = product.sold_count || 0;
                  const stock = product.stock || 5;
                  
                  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
                  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;

                  const widthClass = isExpanded ? "w-full" : "min-w-[calc(60%-8px)]";
                  const isWished = isInWishlist(product.id);

                  const handleToggleWishlist = (e) => {
                    e.stopPropagation();
                    if (!isWished) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = (rect.left + rect.width / 2) / window.innerWidth;
                      const y = (rect.top + rect.height / 2) / window.innerHeight;

                      confetti({
                        particleCount: 120,
                        spread: 100,
                        origin: { x, y },
                        startVelocity: 35,
                        gravity: 0.7,
                        ticks: 250,
                        colors: ['#ff0055', '#ff4081', '#ffea00', '#ffffff'],
                        shapes: ['star', 'circle']
                      });
                    }
                    toggleWishlist(product);
                  };

                  return (
                    <div 
                      key={`${product.id}-${idx}`} 
                      className={`${widthClass} snap-start relative h-full animate-fadeIn text-left`}
                    >
                      <div 
                        onClick={() => {
                          if (onProductClick) {
                            onProductClick(product);
                          } else {
                            navigate(`/product/${product.id}`);
                          }
                          window.scrollTo(0, 0);
                        }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 flex flex-col justify-between relative group cursor-pointer select-none h-full shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Image Area */}
                        <div className="w-full aspect-square bg-[#f8fafc] dark:bg-slate-950 rounded-2xl flex items-center justify-center p-2 relative overflow-hidden transition-transform mb-3">
                          {/* Badge */}
                          {sectionType === 'bestseller' ? (
                            <span className="absolute top-2.5 left-2.5 bg-[#e61e25] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm select-none">
                              {lang === 'fr' ? 'SOLDES' : 'SALE'}
                            </span>
                          ) : (
                            <span className="absolute top-2.5 left-2.5 bg-[#1e5cff] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full z-10 shadow-sm select-none">
                              {isNewSection ? (lang === 'fr' ? 'NOUVEAU' : 'NEW') : 'DEAL'}
                            </span>
                          )}

                          {/* Discount Badge */}
                          {discount > 0 && (
                            <span className="absolute bottom-2.5 left-2.5 bg-[#00b050] text-white text-[10px] font-black px-2 py-0.5 rounded-full z-10">
                              -{discount}%
                            </span>
                          )}

                          {/* Wishlist Button */}
                          <div className="absolute top-2.5 right-2.5 z-20">
                            <button 
                              onClick={handleToggleWishlist}
                              className={`w-7.5 h-7.5 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border ${
                                isWished 
                                  ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                                  : 'bg-white/85 dark:bg-slate-800/85 border-slate-100 dark:border-slate-700/50 text-slate-800 dark:text-white'
                              }`}
                            >
                              <Heart size={14} fill={isWished ? "currentColor" : "none"} />
                            </button>
                          </div>

                          <img 
                            src={product.image_url || product.image || '/hero-banner.png'} 
                            alt={product.name} 
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = '/hero-banner.png';
                            }}
                            className="w-full h-full object-contain p-1 rounded-lg"
                          />
                        </div>

                        {/* Info details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            {/* Brand & Category */}
                            <div className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest text-left mb-1">
                              {product.brand || 'SWEETO'} · {product.category || 'Deals'}
                            </div>

                            {/* Title */}
                            <h3 className="line-clamp-2 text-xs font-bold text-slate-855 dark:text-white text-left leading-snug mb-1.5 min-h-[32px]">
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
                                {averageRating || '4.2'} ({soldCount})
                              </span>
                            </div>
                          </div>

                          <div>
                            {/* Price block */}
                            <div className="flex items-baseline gap-1.5 text-left mb-3">
                              <span className="text-base font-black text-slate-900 dark:text-white">
                                {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <span className="text-xs text-slate-400 line-through font-bold">
                                  {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                                </span>
                              )}
                            </div>

                            {/* Add to Cart button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                              }}
                              className="w-full text-white font-black text-[11px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer select-none border-none bg-[#1e5cff] hover:bg-[#1554C0]"
                            >
                              <ShoppingCart size={12} fill="currentColor" />
                              <span>{lang === 'fr' ? 'Ajouter' : 'Add to Cart'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* DESKTOP VIEW (New 6-column static grid matching the Today's Offers screenshot) */}
      <div className="hidden md:block">
        <section className="w-full px-4 md:px-10 py-4 select-none">
          {/* Centered Heading */}
          <div className="flex items-center justify-center gap-4 max-w-xl mx-auto mb-6 mt-4 select-none">
            {/* Left Line */}
            <div 
              className="h-[3px] flex-1 bg-gradient-to-r from-transparent to-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            />
            {/* Title */}
            <h2 className="animate-title-shining text-2xl uppercase tracking-wider whitespace-nowrap shrink-0">
              {title ? title : (lang === 'fr' ? "OFFRES D'AUJOURD'HUI" : "TODAY'S OFFER")}
            </h2>
            {/* Right Line */}
            <div 
              className="h-[3px] flex-1 bg-gradient-to-r from-blue-500 to-transparent rounded-full shadow-[0_0_8px_rgba(59,130,246,0.4)]"
            />
          </div>

          {/* Slider of products with Infinite Carousel Wrap */}
          <div className="relative group/slider-container">
            {/* Prev Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (desktopScrollRef.current) {
                  const firstChild = desktopScrollRef.current.firstElementChild;
                  if (firstChild) {
                    const cardWidth = firstChild.offsetWidth + 24; // card width + gap-6
                    desktopScrollRef.current.scrollBy({ left: -cardWidth, behavior: 'smooth' });
                  }
                }
              }}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg rounded-full text-slate-800 dark:text-white hover:bg-slate-900 dark:hover:bg-eas-blue hover:text-white transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center w-12 h-12 rounded-2xl shadow-black/10 opacity-0 group-hover/slider-container:opacity-100 p-4 cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            
            {/* Next Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (desktopScrollRef.current) {
                  const firstChild = desktopScrollRef.current.firstElementChild;
                  if (firstChild) {
                    const cardWidth = firstChild.offsetWidth + 24; // card width + gap-6
                    desktopScrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
                  }
                }
              }}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg rounded-full text-slate-800 dark:text-white hover:bg-slate-900 dark:hover:bg-eas-blue hover:text-white transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center w-12 h-12 rounded-2xl shadow-black/10 opacity-0 group-hover/slider-container:opacity-100 p-4 cursor-pointer"
            >
              <ChevronRight size={20} />
            </button>

            <div 
              ref={desktopScrollRef}
              onScroll={handleDesktopScroll}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="flex overflow-x-auto gap-4 sm:gap-6 px-1 w-full pb-4 no-scrollbar"
            >
              {duplicatedProducts.map((product, idx) => {
                const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : (product.discount || 25);
                const soldCount = product.sold_count || 0;
                const stock = product.stock || 5;
                
                const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
                const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;
                
                const isWished = isInWishlist(product.id);

                const handleToggleWishlist = (e) => {
                  e.stopPropagation();
                  if (!isWished) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) / window.innerWidth;
                    const y = (rect.top + rect.height / 2) / window.innerHeight;

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

                return (
                  <div 
                    key={`${product.id}-${idx}`} 
                    onClick={() => {
                      if (onProductClick) {
                        onProductClick(product);
                      } else {
                        navigate(`/product/${product.id}`);
                      }
                      window.scrollTo(0, 0);
                    }}
                    className="w-[calc(50%-8px)] min-w-[calc(50%-8px)] sm:w-[calc(33.333%-11px)] sm:min-w-[calc(33.333%-11px)] md:w-[calc(25%-18px)] md:min-w-[calc(25%-18px)] xl:w-[calc(20%-18px)] xl:min-w-[calc(20%-18px)] shrink-0 snap-start bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 flex flex-col justify-between relative group cursor-pointer select-none h-full shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    {/* Image Area */}
                    <div className="w-full aspect-square bg-[#f8fafc] dark:bg-slate-950 rounded-2xl flex items-center justify-center p-2 relative overflow-hidden group-hover:scale-[1.01] transition-transform mb-3.5">
                      {/* Badge */}
                      {sectionType === 'bestseller' ? (
                        <span className="absolute top-3 left-3 bg-[#e61e25] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full z-10 shadow-sm select-none">
                          {lang === 'fr' ? 'SOLDES' : 'SALE'}
                        </span>
                      ) : (
                        <span className="absolute top-3 left-3 bg-[#1e5cff] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full z-10 shadow-sm select-none">
                          {isNewSection ? (lang === 'fr' ? 'NOUVEAU' : 'NEW') : 'DEAL'}
                        </span>
                      )}

                      {/* Discount Badge */}
                      {discount > 0 && (
                        <span className="absolute bottom-3 left-3 bg-[#00b050] text-white text-[11px] font-black px-2.5 py-1 rounded-full z-10">
                          -{discount}%
                        </span>
                      )}

                      {/* Wishlist Button (Floating overlay top-right) */}
                      <div className="absolute top-3 right-3 z-20">
                        <button 
                          onClick={handleToggleWishlist}
                          className={`w-8.5 h-8.5 rounded-full shadow-sm flex items-center justify-center transition-all border ${
                            isWished 
                              ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/20' 
                              : 'bg-white border-slate-100 text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <Heart size={15} fill={isWished ? "currentColor" : "none"} />
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

                    {/* Info details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        {/* Brand & Category */}
                        <div className="text-[10px] font-black text-slate-455 dark:text-slate-500 uppercase tracking-widest text-left mb-1.5">
                          {product.brand || 'SWEETO'} · {product.category || 'Deals'}
                        </div>

                        {/* Title */}
                        <h3 className="line-clamp-2 text-sm font-bold text-slate-855 dark:text-white text-left leading-snug mb-2 min-h-[40px]">
                          {t_smart(product.name)}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 text-xs text-left mb-3">
                          <div className="flex text-amber-500 gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={13} fill={i < Math.round(Number(averageRating || 4.2)) ? "currentColor" : "none"} strokeWidth={2.5} />
                            ))}
                          </div>
                          <span className="font-bold text-slate-500">
                            {averageRating || '4.2'} ({soldCount})
                          </span>
                        </div>
                      </div>

                      <div>
                        {/* Price block */}
                        <div className="flex items-baseline gap-2 text-left mb-4">
                          <span className="text-xl font-black text-slate-900 dark:text-white">
                            {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
                          </span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-sm text-slate-400 line-through font-bold">
                              {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                            </span>
                          )}
                        </div>

                        {/* Add to Cart button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product);
                            showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                          }}
                          className="w-full text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer select-none border-none bg-[#1e5cff] hover:bg-[#1554C0]"
                        >
                          <ShoppingCart size={14} fill="currentColor" />
                          <span>{lang === 'fr' ? 'Ajouter au panier' : 'Add to Cart'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default DealOfTheDaySection;
