import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, ChevronRight, ShoppingBag } from 'lucide-react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import VideoAdSection from './VideoAdSection';
import { useStore } from '../contexts/StoreContext';
import { SectionBanner, SectionHeader, MiniSectionHeader } from './ProductSection';
import { useLanguage } from '../contexts/LanguageContext';

const DealOfTheDaySection = ({ products, onProductClick, bannerImage, headerStyle, videoAdId }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { videoAds } = useStore();
  const { t } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  
  const selectedAd = videoAdId && videoAdId !== 'All'
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

  return (
    <section className="pt-2 pb-12 px-6 md:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Left Column: Products Grid (3/5 on LG/XL) */}
        <div className="lg:col-span-3 bg-slate-50/50 dark:bg-slate-900/10 backdrop-blur-sm p-4 sm:p-8 rounded-xl sm:rounded-[3rem] border border-slate-100 dark:border-slate-800/40 shadow-sm flex flex-col relative group/deals">
          <MiniSectionHeader 
            title={t('daily_deals')} 
            subtitle={t('exclusive_daily_discounts') || "Exclusive Daily Discounts"} 
            style={headerStyle || 'gradient'}
            onViewAll={() => navigate('/deals')}
          />
          
          <div className="relative mt-2 flex-1 flex flex-col justify-center">
            {/* Slide Buttons */}
            {products.length > 2 && (
              <>
                <button 
                  onClick={() => {
                    const el = document.getElementById('deals-carousel');
                    el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -left-2 sm:-left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg text-slate-700 dark:text-slate-300 hover:bg-eas-blue hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 cursor-pointer shadow-black/5"
                >
                  <ChevronRight className="rotate-180 w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('deals-carousel');
                    el.scrollBy({ left: el.clientWidth, behavior: 'smooth' });
                  }}
                  className="absolute -right-2 sm:-right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-lg text-slate-700 dark:text-slate-300 hover:bg-eas-blue hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-200/50 dark:border-slate-800/50 cursor-pointer shadow-black/5"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                </button>
              </>
            )}

            <div 
              id="deals-carousel"
              className="flex overflow-x-auto gap-3 md:gap-6 no-scrollbar snap-x snap-mandatory scroll-smooth pb-2"
            >
              {products.map((product, idx) => (
                <div 
                  key={product.id} 
                  className="min-w-[calc(50%-6px)] md:min-w-[calc(50%-12px)] lg:min-w-[calc(50%-12px)] xl:min-w-[calc(33.333%-16px)] snap-start relative"
                >
                  <ProductCard 
                    product={product} 
                    index={idx} 
                    onProductClick={onProductClick} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Video Promo Card (2/5 on LG/XL) */}
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
              onClick={() => navigate('/checkout')}
              whileTap={{ scale: 0.95 }}
            >
               <div className="bg-[#007aff] hover:bg-[#0062cc] active:scale-95 transition-all text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
                  <div className="relative">
                     <ShoppingBag size={24} />
                     {cartCount > 0 && (
                       <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black ring-4 ring-[#007aff]">
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
      </div>
    </section>
  );
};

export default DealOfTheDaySection;
