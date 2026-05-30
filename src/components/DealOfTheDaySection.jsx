import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Play, ChevronRight, ShoppingBag } from 'lucide-react';
import ProductCard from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import VideoAdSection from './VideoAdSection';
import { useStore } from '../contexts/StoreContext';
import { SectionBanner, SectionHeader } from './ProductSection';
import { useLanguage } from '../contexts/LanguageContext';

const DealOfTheDaySection = ({ products, onProductClick, bannerImage, headerStyle }) => {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { videoAds } = useStore();
  const { t } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const activeAds = videoAds.filter(ad => ad.isActive);
  
  // Rotate ads every 15 seconds
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
    }, 15000); // 15 seconds
    return () => clearInterval(interval);
  }, [activeAds.length]);

  // Get current active video ad
  const activeAd = activeAds[currentAdIndex] || {
    title: "EXCLUSIVE TECH DEALS",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80"
  };

  return (
    <section className="pt-2 pb-12 px-6 md:px-12">
      <SectionHeader 
        title={t('daily_deals')} 
        subtitle={t('exclusive_daily_discounts') || "Exclusive Daily Discounts"} 
        style={headerStyle || 'gradient'}
        viewAllLink="/deals"
        bannerImage={bannerImage || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80"}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {/* Products Grid (3/5 on XL) */}
        <div className="md:col-span-2 lg:col-span-3 xl:col-span-3 relative group/deals">
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
            className="flex overflow-x-auto gap-3 md:gap-6 no-scrollbar snap-x snap-mandatory scroll-smooth"
          >
            {products.map((product, idx) => (
              <div key={product.id} className="min-w-[calc(50%-6px)] md:min-w-[calc(50%-12px)] lg:min-w-[calc(33.333%-16px)] snap-start relative">
                <div className="absolute top-2.5 left-2.5 sm:top-5 sm:left-5 z-20 pointer-events-none">
                  <div className="bg-[#0056b3] text-white shadow-lg flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-sm">
                    <Zap size={10} strokeWidth={3} className="fill-white sm:w-3.5 sm:h-3.5" />
                    <span className="text-[8px] sm:text-[11px] font-black uppercase tracking-wider">{t('elite_offer')}</span>
                  </div>
                </div>
                <ProductCard 
                  product={product} 
                  index={idx} 
                  onProductClick={onProductClick} 
                />
              </div>
            ))}
          </div>
        </div>

        {/* Video Promo Card (2/5 on XL) */}
        <div className="xl:col-span-2 relative rounded-[2.5rem] overflow-hidden group shadow-2xl min-h-[450px]">
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
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

          {/* Content */}
          <div className="absolute inset-0 p-8 flex flex-col justify-end">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                className="bg-eas-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 self-start shadow-lg shadow-eas-blue/30"
              >
                <Zap size={14} className="fill-white" />
                {t('video_promo')}
              </motion.div>

              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
                {activeAd.title}
              </h2>

              <button 
                onClick={() => navigate('/deals')}
                className="bg-white text-slate-900 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-eas-blue hover:text-white transition-all shadow-xl flex items-center gap-3 w-full justify-center"
              >
                {t('explore_all')} <Play size={16} className="fill-current" />
              </button>
            </div>
          </div>

          {/* Floating Cart (Bottom Right) */}
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="absolute bottom-4 right-4 z-20 md:hidden" // Only show on mobile as a float, or hide if we want it like the screenshot
          >
             <div className="bg-[#007aff] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl">
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
    </section>
  );
};

export default DealOfTheDaySection;
