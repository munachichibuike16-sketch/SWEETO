import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, ChevronRight, ShoppingBag, Star, ShoppingCart, Heart } from 'lucide-react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import VideoAdSection from './VideoAdSection';
import { useStore } from '../contexts/StoreContext';
import { SectionBanner, SectionHeader, MiniSectionHeader } from './ProductSection';
import { useLanguage } from '../contexts/LanguageContext';
import confetti from 'canvas-confetti';

const DealOfTheDaySection = ({ products, onProductClick, bannerImage, headerStyle, videoAdId, onCartClick, title, subtitle }) => {
  const navigate = useNavigate();
  const { cartCount, addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { videoAds, settings, showToast } = useStore();
  const { t, lang, t_smart } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
  const isSimple = headerStyle === 'simple' || headerStyle === 'bright_simple';

  return (
    <section className="py-2 px-6 md:px-12">
      <div className={`grid grid-cols-1 ${showVideo ? 'lg:grid-cols-5 gap-8 lg:gap-12' : 'grid-cols-1'}`}>
        <div className={`lg:col-span-${showVideo ? '3' : '5'} ${
          isSimple 
            ? 'bg-transparent border-0 p-0 shadow-none' 
            : 'bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm p-4 sm:p-8 rounded-xl sm:rounded-[3rem] border border-slate-100 dark:border-slate-800/40 shadow-sm'
        } flex flex-col relative group/deals`}>
          {isSimple ? (
            <div className="mb-4 pl-2">
              <SectionHeader 
                title={title && title !== 'New Section' ? title : (lang === 'fr' ? 'Offres du Jour' : 'Daily Deals')} 
                style="simple" 
                viewAllLink="/deals"
                onViewAllClick={isMobile ? () => setIsExpanded(!isExpanded) : () => navigate('/deals')} 
                isExpanded={isExpanded}
                isMobile={isMobile}
              />
            </div>
          ) : (
            /* AliExpress Style Super Deals Header Banner */
            <div className="bg-gradient-to-r from-[#e61e25] via-[#ff2a3b] to-[#ff5238] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-white/10 mb-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1 rounded-xl border border-white/10 shadow-sm animate-pulse">
                  <Zap size={13} className="text-yellow-300 fill-yellow-300" />
                  <span className="font-extrabold text-[10px] sm:text-xs uppercase tracking-widest text-white italic">SuperDeals</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-xs font-black text-white/90 uppercase tracking-widest leading-none">Ends in:</span>
                  <div className="flex items-center gap-1">
                    <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-[10px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-white font-bold text-xs">:</span>
                    <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-[10px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <span className="text-white font-bold text-xs">:</span>
                    <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-[10px] sm:text-xs font-mono font-black px-1.5 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/deals')}
                className="text-white hover:opacity-85 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-0.5 cursor-pointer self-start sm:self-auto transition-opacity"
              >
                View more <ChevronRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
          
          <div className="relative mt-2 flex-1 flex flex-col justify-center">
            {/* Slide Buttons */}
            {products.length > 2 && !(isMobile && isExpanded) && (
              <>
                <button 
                  onClick={() => {
                    const el = document.getElementById('deals-carousel');
                    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg text-slate-700 dark:text-slate-300 hover:bg-[#e61e25] hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 cursor-pointer shadow-black/5"
                >
                  <ChevronRight className="rotate-180 w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('deals-carousel');
                    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg text-slate-700 dark:text-slate-300 hover:bg-[#e61e25] hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 cursor-pointer shadow-black/5"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                </button>
              </>
            )}

            <div 
              id="deals-carousel"
              className={isMobile && isExpanded 
                ? "grid grid-cols-2 gap-3 px-1 pb-2 animate-fadeIn"
                : "flex overflow-x-auto gap-3 md:gap-6 no-scrollbar snap-x snap-mandatory scroll-smooth pb-2"
              }
            >
              {(isMobile && isExpanded ? products.slice(0, 4) : products).map((product, idx) => {
                const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : (product.discount || 25);
                const soldCount = product.sold_count || 0;
                const stock = product.stock || 5;
                const totalLimit = soldCount + stock;
                const progressPercent = totalLimit > 0 ? Math.min(100, Math.round((soldCount / totalLimit) * 100)) : 0;
                
                const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
                const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;

                const widthClass = isMobile && isExpanded
                  ? "w-full"
                  : (showVideo
                    ? "min-w-[calc(50%-6px)] md:min-w-[calc(50%-12px)] lg:min-w-[calc(50%-12px)] xl:min-w-[calc(33.333%-16px)]"
                    : "min-w-[calc(50%-6px)] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-12px)] xl:min-w-[calc(20%-18px)]");

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
                    key={product.id} 
                    className={`${widthClass} snap-start relative h-full animate-fadeIn`}
                  >
                    {isSimple ? (
                      /* Clean white/transparent card matching the user's screenshot exactly */
                      <div 
                        onClick={() => onProductClick(product)}
                        className="bg-transparent border-0 p-0 flex flex-col justify-between relative group cursor-pointer select-none h-full"
                      >
                        {/* Image Area */}
                        <div className="w-full aspect-square bg-[#f4f4f4] dark:bg-slate-900/50 rounded-2xl flex items-center justify-center p-3 mb-3 relative overflow-hidden group-hover:scale-[1.01] transition-transform">
                          {/* Top-Left Elite Badge */}
                          <span className="absolute top-2.5 left-2.5 bg-[#1e5cff] text-white text-[8px] sm:text-[9.5px] font-black px-2 py-0.5 rounded-[4px] shadow-sm uppercase tracking-wider">
                            {lang === 'fr' ? 'OFFRE ÉLITE' : 'ELITE DEAL'}
                          </span>
                          
                          {/* Wishlist Button (Floating overlay top-right) */}
                          <div className="absolute top-2.5 right-2.5 z-20">
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

                          {/* Cart Button (Floating overlay bottom-right) */}
                          <div className="absolute bottom-2.5 right-2.5 z-20">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                              }}
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
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-xl"
                          />
                        </div>

                        {/* Info & Details */}
                        <div className="flex flex-col text-start space-y-1">
                          {/* Sold Count with Red Flame */}
                          <div className="flex items-center gap-1 text-[11px] text-[#ff3b30] font-bold">
                            <span>🔥</span>
                            <span>
                              {soldCount} {lang === 'fr' ? 'vendus' : 'sold'}
                            </span>
                          </div>

                          {/* Price */}
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                            {product.price?.toLocaleString()} <span className="text-[10px] sm:text-[11px] uppercase font-black">{settings?.currency || 'FCFA'}</span>
                          </div>

                          {/* Discount Tag */}
                          {discount > 0 && (
                            <div>
                              <span className="bg-[#ff0055] text-white font-black text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-[4px] uppercase tracking-wider leading-none">
                                -{discount}%
                              </span>
                            </div>
                          )}

                          {/* Original Price */}
                          {product.original_price && product.original_price > product.price && (
                            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 line-through font-mono leading-none">
                              {product.original_price.toLocaleString()} {settings?.currency || 'FCFA'}
                            </div>
                          )}

                          {/* Product Name in Uppercase */}
                          <h4 className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-400 uppercase tracking-tight leading-tight line-clamp-1">
                            {t_smart(product.name)}
                          </h4>
                        </div>
                      </div>
                    ) : (
                      /* Classic red AliExpress timer banner card style with Buy Now button */
                      <div 
                        onClick={() => onProductClick(product)}
                        className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-4 flex flex-col justify-between relative group cursor-pointer shadow-sm hover:shadow-md hover:border-[#e61e25]/30 dark:hover:border-[#e61e25]/30 transition-all duration-300 select-none h-full"
                      >
                        {/* Image Area */}
                        <div className="w-full aspect-square bg-slate-50 dark:bg-slate-900/40 rounded-2xl flex items-center justify-center p-3 mb-4 relative overflow-hidden border border-slate-100/50 dark:border-slate-800/20 group-hover:scale-[1.01] transition-transform">
                          {discount > 0 && (
                            <span className="absolute top-2.5 left-2.5 bg-[#e61e25] text-white text-[9px] font-black px-2 py-0.5 rounded-lg z-10 shadow-sm uppercase tracking-wider scale-90 sm:scale-100">
                              -{discount}%
                            </span>
                          )}
                          
                          <img 
                            src={product.image_url || product.image || '/hero-banner.png'} 
                            alt={product.name} 
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = '/hero-banner.png';
                            }}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-xl"
                          />
                        </div>

                        {/* Info & Details */}
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h4 className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1 uppercase tracking-tight leading-tight">
                              {product.name}
                            </h4>

                            {/* Rating if any */}
                            {averageRating && (
                              <div className="flex items-center gap-1 text-[9px] text-amber-500 font-bold">
                                <Star size={10} fill="currentColor" />
                                <span>{averageRating}</span>
                              </div>
                            )}

                            {/* Prices */}
                            <div className="flex items-baseline flex-wrap gap-1.5">
                              <span className="text-sm sm:text-base font-mono font-black text-[#e61e25] tracking-tight leading-none">
                                {product.price?.toLocaleString()} <span className="text-[8px] sm:text-[9px] uppercase font-black italic">{settings?.currency || 'FCFA'}</span>
                              </span>
                              {product.original_price && product.original_price > product.price && (
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through font-mono leading-none">
                                  {product.original_price.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Urgency Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-500 to-[#e61e25] rounded-full" 
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                              <div className="flex justify-between items-center text-[8px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none">
                                <span>{progressPercent}% claimed</span>
                                <span className="text-[#e61e25] font-black">{stock} left</span>
                              </div>
                            </div>

                            {/* AliExpress Style Buy now button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                              }}
                              className="w-full py-2 bg-gradient-to-r from-[#e61e25] to-[#ff4f56] hover:brightness-110 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95 cursor-pointer mt-1"
                            >
                              {lang === 'fr' ? 'Acheter' : 'Buy now'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Video Promo Card (2/5 on LG/XL) */}
        {showVideo && (
          <div className="lg:col-span-2 bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm p-4 sm:p-8 rounded-xl sm:rounded-[3rem] border border-slate-100 dark:border-slate-800/40 shadow-sm flex flex-col relative">
            <MiniSectionHeader 
              title={t('video_promo')} 
              subtitle={t('exclusive_tech_deals') || "Live Tech Demo"} 
              style="bold"
              onViewAll={() => navigate('/deals')}
            />
            <div className="relative rounded-[2rem] overflow-hidden group shadow-2xl flex-1 min-h-[320px] sm:min-h-[400px]">
              {/* Background */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAd.id || 'default'}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {activeAd.type === 'video' ? (
                    <video 
                      src={activeAd.videoUrl ? `${activeAd.videoUrl}?v=1` : ''} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
                    />
                  ) : (
                    <img 
                      src={activeAd.imageUrl} 
                      alt={activeAd.title} 
                      className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Overlays */}
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent"></div>

              {/* Content */}
              <div className="absolute inset-0 p-5 sm:p-8 flex flex-col justify-end">
                <div className="space-y-4 sm:space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    className="bg-eas-blue text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 self-start shadow-lg shadow-eas-blue/30"
                  >
                    <Zap size={12} className="fill-white" />
                    {t('video_promo')}
                  </motion.div>

                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                    {activeAd.title}
                  </h2>

                  <button 
                    onClick={() => navigate('/deals')}
                    className="bg-white text-slate-900 px-4 py-3.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-eas-blue hover:text-white transition-all shadow-xl flex items-center gap-2 sm:gap-3 w-full justify-center"
                  >
                    {t('explore_all')} <Play size={14} className="fill-current" />
                  </button>
                </div>
              </div>

              {/* Floating Cart (Bottom Right) */}
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                className="absolute bottom-4 right-4 z-20 md:hidden cursor-pointer" // Only show on mobile as a float, or hide if we want it like the screenshot
                onClick={onCartClick || (() => navigate('/checkout'))}
                whileTap={{ scale: 0.95 }}
              >
                 <div className="bg-[#007aff] hover:bg-[#0062cc] active:scale-95 transition-all text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
                    <div className="relative">
                       <ShoppingBag size={24} />
                       {cartCount > 0 && (
                         <span className="absolute -top-2 -right-2 bg-eas-blue text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black ring-4 ring-[#007aff]">
                           {cartCount}
                         </span>
                       )}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black opacity-60 uppercase tracking-widest leading-none">{t('view_cart')}</span>
                       <span className="text-sm font-black flex items-center gap-1">{t('checkout_now')} <ChevronRight size={14} /></span>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DealOfTheDaySection;
