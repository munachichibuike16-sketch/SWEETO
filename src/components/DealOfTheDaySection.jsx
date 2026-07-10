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
  const isSimple = true;

  return (
    <>
      {/* MOBILE/TABLET VIEW (Untouched original mobile version) */}
      <div className="block md:hidden">
        <section className="pt-2 pb-0 px-4 select-none">
          <div className="grid grid-cols-1 flex flex-col relative group/deals">
            <div className="flex items-center justify-center gap-3 w-full select-none mb-5 mt-3 px-2">
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes hueRotateAnimation {
                  0% { filter: hue-rotate(0deg); }
                  100% { filter: hue-rotate(360deg); }
                }
              `}} />
              {/* Left Line */}
              <div 
                className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#ff0055] to-[#ff3b30] rounded-full shadow-[0_0_6px_rgba(255,0,85,0.3)]"
                style={{ animation: 'hueRotateAnimation 4s linear infinite' }}
              />
              {/* Title */}
              <h2 className="animate-title-shining text-[14px] uppercase tracking-wider whitespace-nowrap shrink-0">
                {lang === 'fr' ? "OFFRES D'AUJOURD'HUI" : "TODAY'S OFFER"}
              </h2>
              {/* Right Line */}
              <div 
                className="h-[2px] flex-1 bg-gradient-to-r from-[#ff3b30] via-[#ff0055] to-transparent rounded-full shadow-[0_0_6px_rgba(255,0,85,0.3)]"
                style={{ animation: 'hueRotateAnimation 4s linear infinite' }}
              />
            </div>
            
            <div className="relative mt-2 flex-1 flex flex-col justify-center">
              <div 
                id="deals-carousel-mobile"
                className={isExpanded 
                  ? "grid grid-cols-2 gap-3 px-1 pb-2 animate-fadeIn"
                  : "flex overflow-x-auto gap-3 no-scrollbar snap-x snap-mandatory scroll-smooth pb-2"
                }
              >
                {(isExpanded ? products.slice(0, 4) : products).map((product, idx) => {
                  const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : (product.discount || 25);
                  const soldCount = product.sold_count || 0;
                  const stock = product.stock || 5;
                  
                  const reviews = typeof product.reviews === 'string' ? JSON.parse(product.reviews || '[]') : (product.reviews || []);
                  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : null;

                  const widthClass = isExpanded ? "w-full" : "min-w-[calc(33.333%-8px)]";
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
                      key={product.id} 
                      className={`${widthClass} snap-start relative h-full animate-fadeIn text-left`}
                    >
                      <div 
                        onClick={() => {
                          navigate('/deals');
                          window.scrollTo(0, 0);
                        }}
                        className="bg-transparent border-0 p-0 flex flex-col justify-between relative group cursor-pointer select-none h-full"
                      >
                        {/* Image Area */}
                        <div className="w-full aspect-square bg-[#f4f4f4] dark:bg-slate-900/50 rounded-2xl flex items-center justify-center p-1 relative overflow-hidden transition-transform mb-2.5">
                          {/* Wishlist Button */}
                          <div className="absolute top-2.5 right-2.5 z-20">
                            <button 
                              onClick={handleToggleWishlist}
                              className={`w-7 h-7 rounded-full shadow-sm flex items-center justify-center transition-all backdrop-blur-md border ${
                                isWished 
                                  ? 'bg-[#ff3b30] border-[#ff3b30] text-white shadow-red-500/30' 
                                  : 'bg-white/80 dark:bg-slate-800/80 border-white/20 dark:border-slate-700/50 text-slate-800 dark:text-white'
                              }`}
                            >
                              <Heart size={13} fill={isWished ? "currentColor" : "none"} />
                            </button>
                          </div>

                          {/* Cart Button */}
                          <div className="absolute bottom-2.5 right-2.5 z-20">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product);
                                showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                              }}
                              className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer"
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
                            className="w-full h-full object-contain p-1 rounded-lg"
                          />
                        </div>

                        {/* Pricing row with Slanted Red Discount Ribbon */}
                        <div className="flex items-stretch justify-between w-full mt-1 overflow-hidden">
                          <div className="flex flex-col text-left justify-center pl-0.5">
                            <span className="text-[14px] font-black text-slate-900 dark:text-white leading-none">
                              {settings?.currency || 'FCFA'} {product.price?.toLocaleString()}
                            </span>
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 line-through mt-1.5 font-mono leading-none">
                                {settings?.currency || 'FCFA'} {product.original_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                          {discount > 0 && (
                            <div 
                              className="bg-[#ff0a24] text-white font-black text-[10px] pl-3.5 pr-2 py-1 flex items-center justify-center italic shrink-0"
                              style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}
                            >
                              -{discount}%
                            </div>
                          )}
                        </div>

                        {/* Title with Choice/Marque+ Badge */}
                        <div className="flex items-center gap-1.5 mt-2 w-full leading-tight text-left">
                          {idx % 2 === 0 ? (
                            <span className="bg-[#fff000] text-black text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">Choice</span>
                          ) : (
                            <span className="bg-[#1e5cff] text-white text-[8px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 uppercase">Marque+</span>
                          )}
                          <span className="line-clamp-1 text-[11px] font-bold text-slate-700 dark:text-slate-350">
                            {t_smart(product.name)}
                          </span>
                        </div>

                        {/* Stock urgency / sales ratings */}
                        <div className="mt-2 text-[10px] font-medium leading-normal text-left">
                          {/* Urgency Stock (Line 1) */}
                          <div className="text-red-500 font-bold flex items-center gap-0.5">
                            <span>🔥</span>
                            <span>
                              {stock <= 1 
                                ? (lang === 'fr' ? '0 restant' : '0 remaining') 
                                : stock <= 3 
                                  ? (lang === 'fr' ? 'Stock faible' : 'Low stock') 
                                  : (lang === 'fr' ? `${stock} restants` : `${stock} remaining`)}
                            </span>
                          </div>
                          {/* Sales & Rating (Line 2) */}
                          <div className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <span>{soldCount} {lang === 'fr' ? 'vendus' : 'sold'}</span>
                            {averageRating && (
                              <span className="flex items-center gap-0.5 text-amber-500">
                                <span>⭐</span>
                                <span>{averageRating}</span>
                              </span>
                            )}
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
              className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-[#ff0055] to-[#ff3b30] rounded-full shadow-[0_0_8px_rgba(255,0,85,0.4)]"
              style={{ animation: 'hueRotateAnimation 4s linear infinite' }}
            />
            {/* Title */}
            <h2 className="animate-title-shining text-2xl uppercase tracking-wider whitespace-nowrap shrink-0">
              {lang === 'fr' ? "OFFRES D'AUJOURD'HUI" : "TODAY'S OFFER"}
            </h2>
            {/* Right Line */}
            <div 
              className="h-[3px] flex-1 bg-gradient-to-r from-[#ff3b30] via-[#ff0055] to-transparent rounded-full shadow-[0_0_8px_rgba(255,0,85,0.4)]"
              style={{ animation: 'hueRotateAnimation 4s linear infinite' }}
            />
          </div>

          {/* Grid of 6 products */}
          <div className="grid grid-cols-6 gap-4 sm:gap-6 px-1 w-full pb-4">
            {products.slice(0, 6).map((product, idx) => {
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
              };

              return (
                <div 
                  key={product.id} 
                  onClick={() => {
                    navigate('/deals');
                    window.scrollTo(0, 0);
                  }}
                  className="bg-transparent border-0 flex flex-col justify-between relative group cursor-pointer select-none h-full text-left"
                >
                  {/* Image Area */}
                  <div className="w-full aspect-square bg-[#f4f4f4] dark:bg-slate-905 rounded-2xl flex items-center justify-center p-1 relative overflow-hidden group-hover:scale-[1.01] transition-transform mb-2.5">
                    {/* Wishlist Button (Floating overlay top-right) */}
                    <div className="absolute top-2.5 right-2.5 z-20">
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
                    </div>

                    {/* Cart Button (Floating overlay bottom-right) */}
                    <div className="absolute bottom-2.5 right-2.5 z-20">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product);
                          showToast(lang === 'fr' ? 'Ajouté au panier ! 🛒' : 'Added to cart! 🛒', 'success');
                        }}
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

                  {/* Pricing row with Slanted Red Discount Ribbon */}
                  <div className="flex items-stretch justify-between w-full mt-2 overflow-hidden">
                    <div className="flex flex-col text-left justify-center pl-0.5">
                      <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                        {settings?.currency || 'FCFA'} {product.price?.toLocaleString()}
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[12px] font-bold text-slate-450 dark:text-slate-500 line-through mt-1.5 font-mono leading-none">
                          {settings?.currency || 'FCFA'} {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {discount > 0 && (
                      <div 
                        className="bg-[#ff0a24] text-white font-black text-[13px] pl-5.5 pr-3 py-2 flex items-center justify-center italic shrink-0"
                        style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)' }}
                      >
                        -{discount}%
                      </div>
                    )}
                  </div>

                  {/* Title with Choice/Marque+ Badge */}
                  <div className="flex items-start gap-1.5 mt-3 w-full leading-tight text-left">
                    {idx % 2 === 0 ? (
                      <span className="bg-[#fff000] text-black text-[9.5px] font-black px-2 py-0.5 rounded leading-none shrink-0 uppercase">Choice</span>
                    ) : (
                      <span className="bg-[#1e5cff] text-white text-[9.5px] font-black px-2 py-0.5 rounded leading-none shrink-0 uppercase">Marque+</span>
                    )}
                    <span className="line-clamp-2 text-[13px] font-bold text-slate-700 dark:text-slate-350">
                      {t_smart(product.name)}
                    </span>
                  </div>

                  {/* Stock urgency / sales ratings */}
                  <div className="mt-2.5 text-[12px] font-medium leading-normal">
                    {/* Urgency Stock (Line 1) */}
                    <div className="text-red-500 font-bold flex items-center gap-0.5">
                      <span>🔥</span>
                      <span>
                        {stock <= 1 
                          ? (lang === 'fr' ? '0 restant' : '0 remaining') 
                          : stock <= 3 
                            ? (lang === 'fr' ? 'Stock faible' : 'Low stock') 
                            : (lang === 'fr' ? `${stock} restants` : `${stock} remaining`)}
                      </span>
                    </div>
                    {/* Sales & Rating (Line 2) */}
                    <div className="text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <span>{soldCount} {lang === 'fr' ? 'vendus' : 'sold'}</span>
                      {averageRating && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <span>⭐</span>
                          <span>{averageRating}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
};

export default DealOfTheDaySection;
