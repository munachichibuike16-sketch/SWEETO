import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const Hero = ({ banners, layout = 'slider' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gridMainSlide, setGridMainSlide] = useState(0);
  const { products, settings } = useStore();
  const { t, t_smart, isRTL } = useLanguage();

  const handleBannerClick = (link) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.location.href = link;
      return;
    }
    if (link.startsWith('/')) {
      if (link.startsWith('/#/')) {
        window.location.href = link;
      } else {
        window.location.href = '/#' + link;
      }
      return;
    }
    window.location.href = link;
  };


  // 1. Parse Settings Banners
  const parsedSettingsBanners = typeof banners === 'string' ? JSON.parse(banners) : (banners || []);
  
  // 2. Filter out empty slots if it's a slider
  const validSettingsBanners = parsedSettingsBanners.filter(b => b.image || b.title);

  // 3. Auto Showcase fallback (if no manual banners are set)
  const featuredProducts = products.filter(p => Number(p.is_featured) === 1).sort((a, b) => b.id - a.id).slice(0, 5);
  const productBanners = featuredProducts.map(p => ({
    id: p.id,
    title: t_smart(p.name),
    subtitle: t_smart(p.description) || t('big_performance_sleek_design'),
    image: p.image_url || p.image || '/hero-banner.png',
    link: `/product/${p.id}`,
    price: p.price
  }));

  // 4. Combine: Prioritize Manual Banners if they exist and are populated
  const displayBanners = validSettingsBanners.length > 0 
    ? validSettingsBanners 
    : (productBanners.length > 0 ? productBanners : [
      {
        id: 'default',
        title: t('premium_collection') || 'Premium Collection',
        subtitle: t('discover_latest_tech') || 'Discover the latest in high-end technology',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80',
        link: '/new-arrivals'
      }
    ]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % displayBanners.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + displayBanners.length) % displayBanners.length);

  useEffect(() => {
    if (layout === 'slider' && displayBanners.length > 1) {
      const timer = setInterval(nextSlide, 8000);
      return () => clearInterval(timer);
    }
  }, [layout, displayBanners.length]);

  // Grid mode: auto-cycle ALL active products in the Main panel every 4s
  useEffect(() => {
    if (layout === 'grid') {
      const activeProducts = products.filter(p => p.status !== 'draft');
      if (activeProducts.length > 1) {
        const timer = setInterval(() => {
          setGridMainSlide(prev => (prev + 1) % activeProducts.length);
        }, 4000);
        return () => clearInterval(timer);
      }
    }
  }, [layout, products.length]);

  if (layout === 'grid') {
    // Main: auto-cycles through ALL active products
    const activeProducts = products.filter(p => p.status !== 'draft');
    const mainProduct = activeProducts.length > 0
      ? activeProducts[gridMainSlide % activeProducts.length]
      : null;
    const mainSlot = mainProduct
      ? {
          title: t_smart(mainProduct.name),
          subtitle: t_smart(mainProduct.description) || mainProduct.category || '',
          image: mainProduct.image_url || mainProduct.image || '',
          link: `/product/${mainProduct.id}`,
          price: mainProduct.price,
          discount: mainProduct.discount
        }
      : (displayBanners[0] || {});

    // Side A and Side B are the 2 products the admin picked
    const sideA = parsedSettingsBanners[0] || null;
    const sideB = parsedSettingsBanners[1] || null;

    const gridStyle = settings?.hero_grid_style || 'cover';

    if (gridStyle === 'glass') {
      return (
        <section className="max-w-[1600px] mx-auto px-4 md:px-6 pt-3 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 lg:h-[600px]">
            {/* Main Large Banner — auto-cycles all products */}
            <div 
              onClick={() => handleBannerClick(mainSlot.link)}
              className="lg:col-span-8 h-[350px] sm:h-[400px] lg:h-full relative rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#0c162b] via-[#020617] to-[#080f20] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col md:flex-row items-center p-5 md:p-16 gap-6 md:gap-10 group cursor-pointer"
            >
              
              {/* Ambient Background Light Spot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

              {/* Left Content Area */}
              <div className="flex-1 flex flex-col justify-center relative z-10 w-full text-left">
                {/* Category Tag */}
                <div className="flex items-center gap-2 mb-4 md:mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-eas-blue animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-eas-blue">{mainSlot.subtitle || t('featured_selection')}</span>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`title-${gridMainSlide}`}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-2xl sm:text-4xl lg:text-6xl font-black text-white mb-3 md:mb-4 leading-tight tracking-tighter uppercase italic"
                  >
                    {mainSlot.title}
                  </motion.h2>
                </AnimatePresence>
                
                <p className="text-xs md:text-sm text-slate-400 mb-6 md:mb-8 font-medium max-w-sm line-clamp-3 leading-relaxed">{mainSlot.subtitle}</p>
                
                <div className="flex flex-wrap items-center gap-4 md:gap-5">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleBannerClick(mainSlot.link); }}
                    className="px-6 py-3.5 sm:px-8 sm:py-4 bg-gradient-to-r from-eas-blue to-blue-600 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all duration-300 shadow-[0_10px_35px_rgba(59,130,246,0.35)] hover:shadow-[0_15px_45px_rgba(59,130,246,0.5)] active:scale-95"
                  >
                    {t('explore_now')}
                  </button>
                  {mainSlot.price && (
                    <div className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t('starting_at')}</span>
                      <span className="text-sm sm:text-base font-black text-white italic tracking-tight">{settings?.currency || 'FCFA'} {Number(mainSlot.price).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Product Image Area — Structured Glass Showcase Frame */}
              <div className="flex-1 flex justify-center items-center relative h-[200px] md:h-full w-full z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={gridMainSlide}
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.94, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-full flex justify-center items-center"
                  >
                    {/* Glowing halo behind studio frame */}
                    <div className="absolute w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] bg-eas-blue/20 rounded-full blur-3xl opacity-60 group-hover:scale-110 transition-transform duration-700" />
                    
                    {mainSlot.image ? (
                      <div className="relative p-3 md:p-6 bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] group-hover:border-white/20 transition-all duration-500 overflow-hidden flex items-center justify-center max-w-[220px] sm:max-w-[280px] md:max-w-[340px] aspect-square w-full">
                        {/* Internal glossy highlight */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none" />
                        <img
                          src={mainSlot.image}
                          className="max-h-[130px] sm:max-h-[180px] md:max-h-[250px] w-auto object-contain rounded-2xl relative z-10 group-hover:scale-105 transition-transform duration-700 filter"
                          alt=""
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-900/80 backdrop-blur-md flex items-center justify-center border border-white/5 shadow-2xl">
                        <ImageIcon className="text-slate-600" size={24}/>
                      </div>
                    )}

                    {mainSlot.discount > 0 && (
                      <div className="absolute top-0 right-0 md:top-4 md:right-4 bg-[#ff3b30] text-white text-[9px] font-black px-3.5 py-1.5 rounded-full shadow-[0_8px_20px_rgba(255,59,48,0.3)] z-20">
                        -{mainSlot.discount}%
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slide Navigation Pill Capsule (Bottom Center) */}
              {activeProducts.length > 1 && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-black/30 backdrop-blur-xl border border-white/20 rounded-full px-3 py-1.5 z-20 shadow-2xl gap-3"
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setGridMainSlide(prev => (prev - 1 + activeProducts.length) % activeProducts.length); }} 
                    className="text-white hover:text-blue-400 transition-colors p-1"
                  >
                    <ChevronLeft size={14} sm:size={16} strokeWidth={3} />
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); setGridMainSlide(prev => (prev + 1) % activeProducts.length); }} 
                    className="text-white hover:text-blue-400 transition-colors p-1"
                  >
                    <ChevronRight size={14} sm:size={16} strokeWidth={3} />
                  </button>
                </div>
              )}
            </div>

            {/* Right Column — Side A & Side B Bento Panels */}
            <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-8 h-auto lg:h-full">
              
              {/* Side A Banner */}
              <div 
                onClick={() => sideA && handleBannerClick(sideA.link)}
                className="flex-1 bg-gradient-to-br from-[#0b1424] to-[#020617] rounded-3xl relative overflow-hidden group shadow-2xl border border-white/5 p-5 md:p-8 flex items-center gap-4 hover:border-white/10 transition-all duration-300 min-h-[140px] cursor-pointer"
              >
                {sideA ? (
                  <>
                    {/* Left Column Text */}
                    <div className="flex-[3] flex flex-col justify-center h-full relative z-10 text-left">
                      <span className="text-[8px] font-black text-eas-blue uppercase tracking-[0.2em] mb-1.5">{sideA.subtitle || t('exclusive_deal')}</span>
                      <h3 className="text-base md:text-xl font-black text-white mb-4 uppercase italic tracking-tighter line-clamp-2 leading-tight">{sideA.title}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); sideA.link && handleBannerClick(sideA.link); }} 
                        className="w-fit px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white hover:text-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                      >
                        {t('view_product')}
                      </button>
                    </div>
                    {/* Right Column Structured Studio Image Frame */}
                    <div className="flex-[2] flex justify-center items-center h-full relative z-10">
                      {sideA.image ? (
                        <div className="relative p-2 bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden aspect-square w-[80px] sm:w-[110px] flex items-center justify-center shadow-lg group-hover:border-white/20 transition-all">
                          <img src={sideA.image} className="max-h-[60px] sm:max-h-[90px] max-w-full object-contain group-hover:scale-105 transition-transform duration-500" alt="" />
                        </div>
                      ) : (
                        <ImageIcon className="text-slate-600" size={20}/>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <p className="text-slate-600 text-xs font-black uppercase tracking-widest">Side A — Not Set</p>
                  </div>
                )}
              </div>

              {/* Side B Banner */}
              <div 
                onClick={() => sideB && handleBannerClick(sideB.link)}
                className="flex-1 bg-[#0f111a] rounded-3xl relative overflow-hidden group shadow-2xl p-5 md:p-8 flex items-center gap-4 hover:shadow-blue-500/10 transition-shadow border border-white/5 hover:border-white/10 min-h-[140px] cursor-pointer"
              >
                {sideB ? (
                  <>
                    {/* Left Column Text */}
                    <div className="flex-[3] flex flex-col justify-center h-full relative z-10 text-left">
                      <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] mb-1.5">{sideB.subtitle || t('special_offer')}</span>
                      <h3 className="text-base md:text-xl font-black text-white mb-4 uppercase italic tracking-tighter line-clamp-2 leading-tight">{sideB.title}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); sideB.link && handleBannerClick(sideB.link); }} 
                        className="w-fit px-4 py-2 bg-white hover:bg-slate-900 hover:text-white text-eas-blue rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                      >
                        {t('claim_offer')}
                      </button>
                    </div>
                    {/* Right Column Structured Studio Image Frame */}
                    <div className="flex-[2] flex justify-center items-center h-full relative z-10">
                      {sideB.image ? (
                        <div className="relative p-2 bg-slate-900/80 border border-white/10 rounded-2xl overflow-hidden aspect-square w-[80px] sm:w-[110px] flex items-center justify-center shadow-lg group-hover:border-white/20 transition-all">
                          <img src={sideB.image} className="max-h-[60px] sm:max-h-[90px] max-w-full object-contain group-hover:scale-105 transition-transform duration-500" alt="" />
                        </div>
                      ) : (
                        <ImageIcon className="text-white/40" size={20}/>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <p className="text-white/40 text-xs font-black uppercase tracking-widest">Side B — Not Set</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>
      );
    }

    // Default: Full-Bleed Cover style (Immersive fullscreen)
    return (
      <section className="max-w-[1600px] mx-auto px-6 pt-3 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[600px]">
          
          {/* 1. Main Large Banner — Full-Bleed Studio Showcase */}
          <div 
            onClick={() => handleBannerClick(mainSlot.link)}
            className="lg:col-span-8 h-[350px] sm:h-[420px] lg:h-full relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0057ff] via-[#008cff] to-[#00c6ff] shadow-2xl border border-white/10 group cursor-pointer"
          >
            
            {/* Full Bleed Image (Vivid 100% Opacity) */}
            {mainSlot.image && (
              <AnimatePresence mode="sync">
                <motion.img
                  key={gridMainSlide}
                  src={mainSlot.image}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
                  alt=""
                />
              </AnimatePresence>
            )}

            {/* Left Dark Gradient Overlay for perfect text contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

            {/* Content Overlays */}
            <div className="absolute inset-0 p-10 md:p-16 flex flex-col justify-center max-w-xl z-20 text-left">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400 mb-3 block">
                {mainSlot.subtitle || t('featured_selection')}
              </span>
              
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`title-${gridMainSlide}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 tracking-tighter uppercase leading-none"
                >
                  {mainSlot.title}
                </motion.h2>
              </AnimatePresence>
              
              <p className="text-xs md:text-sm text-slate-200 mb-8 max-w-sm font-medium leading-relaxed line-clamp-2">
                {mainSlot.subtitle}
              </p>
              
              <div className="flex items-center gap-6">
                <button
                  onClick={(e) => { e.stopPropagation(); handleBannerClick(mainSlot.link); }}
                  className="px-8 py-3 bg-white text-black font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all rounded-md shadow-2xl active:scale-95"
                >
                  {t('explore_now')}
                </button>
                {mainSlot.price && (
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('starting_at')}</span>
                    <span className="text-lg font-black text-white italic tracking-tight">{settings?.currency || 'FCFA'} {Number(mainSlot.price).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Slide Navigation Pill Capsule (Bottom Center) */}
            {activeProducts.length > 1 && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center bg-black/30 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 z-20 shadow-2xl gap-4"
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); setGridMainSlide(prev => (prev - 1 + activeProducts.length) % activeProducts.length); }} 
                  className="text-white hover:text-blue-400 transition-colors p-1"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); setGridMainSlide(prev => (prev + 1) % activeProducts.length); }} 
                  className="text-white hover:text-blue-400 transition-colors p-1"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            )}
          </div>

          {/* 2. Right Column — Side A & Side B Bento Panels */}
          <div className="lg:col-span-4 flex flex-col gap-8 h-auto lg:h-full">
            
            {/* Side A Banner */}
            <div 
              onClick={() => sideA && handleBannerClick(sideA.link)}
              className="flex-1 bg-gradient-to-tr from-[#9600ff] via-[#ae00ff] to-[#00b7ff] rounded-3xl relative overflow-hidden group shadow-2xl border border-white/10 p-8 flex flex-col justify-center min-h-[190px] cursor-pointer"
            >
              
              {/* Full Bleed Image (Vivid 100% Opacity) */}
              {sideA && sideA.image && (
                <img 
                  src={sideA.image} 
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  alt="" 
                />
              )}

              {/* Left Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none" />

              {sideA ? (
                <div className="relative z-20 text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 block">
                    {sideA.subtitle || t('exclusive_deal')}
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 uppercase tracking-tighter line-clamp-1 leading-tight">
                    {sideA.title}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); sideA.link && handleBannerClick(sideA.link); }} 
                    className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:underline group-hover:translate-x-0.5 transition-all"
                  >
                    Shop Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">Side A — Not Set</p>
                </div>
              )}
            </div>

            {/* Side B Banner */}
            <div 
              onClick={() => sideB && handleBannerClick(sideB.link)}
              className="flex-1 bg-[#0f111a] rounded-3xl relative overflow-hidden group shadow-2xl p-8 flex flex-col justify-center min-h-[190px] border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              
              {/* Full Bleed Image (Vivid 100% Opacity) */}
              {sideB && sideB.image && (
                <img 
                  src={sideB.image} 
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  alt="" 
                />
              )}

              {/* Left Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none" />

              {sideB ? (
                <div className="relative z-20 text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 block">
                    {sideB.subtitle || t('special_offer')}
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 uppercase tracking-tighter line-clamp-1 leading-tight">
                    {sideB.title}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); sideB.link && handleBannerClick(sideB.link); }} 
                    className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2 hover:underline group-hover:translate-x-0.5 transition-all"
                  >
                    Shop Now <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest">Side B — Not Set</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    );
  }

  const sliderStyle = settings?.hero_slider_style || 'glass';

  if (sliderStyle === 'cover') {
    return (
      <section 
        onClick={() => handleBannerClick(displayBanners[currentSlide]?.link)}
        className="relative h-[480px] sm:h-[650px] w-full overflow-hidden bg-slate-950 transition-colors duration-1000 cursor-pointer"
      >
        
        {/* Full-Bleed Cover Image */}
        <AnimatePresence mode="sync">
          <motion.img 
            key={currentSlide}
            src={displayBanners[currentSlide]?.image} 
            alt=""
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1200ms] ease-out"
          />
        </AnimatePresence>

        {/* Left Dark Gradient Overlay for perfect text contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 h-full max-w-[1600px] mx-auto px-4 sm:px-12 md:px-24 flex items-center">
          <div className="max-w-2xl text-left space-y-4 sm:space-y-6">
            <AnimatePresence mode="wait">
              <motion.div 
                key={`sub-${currentSlide}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">
                  {displayBanners[currentSlide]?.subtitle || t('exclusive_showcase')}
                </span>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.h1 
                key={`title-${currentSlide}`}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-3xl sm:text-5xl md:text-8xl font-extrabold text-white tracking-tighter uppercase leading-none"
              >
                {displayBanners[currentSlide]?.title}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.p 
                key={`desc-${currentSlide}`}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-xs sm:text-sm md:text-lg text-slate-200 font-medium max-w-md leading-relaxed line-clamp-2"
              >
                {displayBanners[currentSlide]?.subtitle}
              </motion.p>
            </AnimatePresence>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 sm:gap-6 pt-2 sm:pt-4"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleBannerClick(displayBanners[currentSlide]?.link); }}
                className="px-6 py-3 sm:px-10 sm:py-3.5 bg-white text-black rounded-md font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all shadow-2xl active:scale-95"
              >
                {t('shop_now')}
              </button>
              {displayBanners[currentSlide]?.price && (
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('starting_at')}</span>
                  <span className="text-base sm:text-xl font-black text-white italic tracking-tighter">
                    {settings?.currency || 'FCFA'} {displayBanners[currentSlide]?.price?.toLocaleString()}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Modern Side Navigation Arrows */}
        <div 
          onClick={(e) => e.stopPropagation()}
          className={`hidden md:flex absolute ${isRTL ? 'left-12' : 'right-12'} bottom-12 items-center gap-4 z-40`}
        >
          <button 
            onClick={prevSlide}
            className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all group"
          >
            <ArrowRight className={`${isRTL ? '' : 'rotate-180'} group-hover:${isRTL ? 'translate-x-1' : '-translate-x-1'} transition-transform`} size={24} />
          </button>
          <button 
            onClick={nextSlide}
            className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white hover:text-black transition-all group"
          >
            <ArrowRight className={`${isRTL ? 'rotate-180' : ''} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} size={24} />
          </button>
        </div>
   
        {/* Progress Dots Removed */}
      </section>
    );
  }

  // Default: Classic 'glass' split style with side-by-side elements
  return (
    <section 
      onClick={() => handleBannerClick(displayBanners[currentSlide]?.link)}
      className="relative h-[520px] sm:h-[650px] w-full overflow-hidden bg-slate-50 dark:bg-[#020617] transition-colors duration-1000 cursor-pointer"
    >
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-30 dark:opacity-20 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 15 + i * 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute rounded-full bg-eas-blue/30 blur-[120px]"
            style={{
              width: `${400 + i * 100}px`,
              height: `${400 + i * 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 h-full max-w-[1600px] mx-auto px-4 sm:px-12 flex items-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 w-full items-center gap-6 md:gap-16">
            {/* Left Side: Content */}
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'} space-y-4 sm:space-y-8 z-20`}>
              <motion.div initial={{ x: isRTL ? 20 : -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`flex items-center gap-4 justify-center ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}>
                 <div className="h-[2px] w-12 bg-eas-blue rounded-full"></div>
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">{t('exclusive_showcase')}</span>
              </motion.div>
              <motion.h1 
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.2 }}
                className="text-3xl sm:text-7xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-[0.9]"
              >
                {displayBanners[currentSlide]?.title}
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed line-clamp-2 sm:line-clamp-none"
              >
                {displayBanners[currentSlide]?.subtitle}
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className={`flex items-center gap-4 sm:gap-6 justify-center ${isRTL ? 'md:justify-end' : 'md:justify-start'} pt-2 sm:pt-4`}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); handleBannerClick(displayBanners[currentSlide]?.link); }}
                  className="px-6 py-3.5 sm:px-12 sm:py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl sm:rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-eas-blue dark:hover:bg-eas-blue dark:hover:text-white transition-all shadow-2xl shadow-slate-900/20"
                >
                  {t('shop_now')}
                </button>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('starting_at')}</span>
                  <span className="text-base sm:text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                    {settings?.currency || 'FCFA'} {displayBanners[currentSlide]?.price?.toLocaleString()}
                  </span>
                </div>
              </motion.div>
            </div>

             {/* Right Side: Image */}
            <div className="relative flex justify-center items-center h-full perspective-1000">
              <motion.div
                initial={{ x: isRTL ? -100 : 100, opacity: 0, rotateY: isRTL ? -30 : 30, scale: 0.8 }}
                animate={{ x: 0, opacity: 1, rotateY: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 40, damping: 15, delay: 0.3 }}
                className="relative z-10"
              >
                <img 
                  src={displayBanners[currentSlide]?.image} 
                  alt={displayBanners[currentSlide]?.title}
                  className="max-h-[180px] sm:max-h-[500px] w-auto drop-shadow-[0_50_80_rgba(0,0,0,0.3)] filter contrast-[1.05] brightness-[1.05]"
                />
                
                {/* Floating Meta Details */}
                 <motion.div
                    animate={{ y: [0, -20, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute -top-10 ${isRTL ? '-left-10' : '-right-10'} bg-white/10 dark:bg-slate-800/10 backdrop-blur-2xl border border-white/20 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-2xl hidden lg:block`}
                 >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ff3b30] rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg shadow-red-500/20">
                      {displayBanners[currentSlide]?.discount || 15}%
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('discount')}</span>
                      <span className="text-xs font-black text-slate-900 dark:text-white">{t('active_now')}</span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

       {/* Modern Side Navigation Arrows */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`hidden md:flex absolute ${isRTL ? 'left-12' : 'right-12'} bottom-12 items-center gap-4 z-40`}
      >
        <button 
          onClick={prevSlide}
          className="w-16 h-16 bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center hover:bg-eas-blue hover:text-white dark:hover:bg-eas-blue dark:hover:text-white transition-all group"
        >
          <ArrowRight className={`${isRTL ? '' : 'rotate-180'} group-hover:${isRTL ? 'translate-x-1' : '-translate-x-1'} transition-transform`} size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="w-16 h-16 bg-white/5 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center hover:bg-eas-blue hover:text-white dark:hover:bg-eas-blue dark:hover:text-white transition-all group"
        >
          <ArrowRight className={`${isRTL ? 'rotate-180' : ''} group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'} transition-transform`} size={24} />
        </button>
      </div>
 
       {/* Progress Dots Removed */}
    </section>
  );
};

export default Hero;
