import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowRightCircle, ChevronLeft, ChevronRight, Image as ImageIcon, Eye } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const Hero = ({ banners, layout = 'slider' }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [gridMainSlide, setGridMainSlide] = useState(0);
  const { products, settings } = useStore();
  const { lang, t, t_smart, isRTL } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const [timeLeft, setTimeLeft] = useState(() => {
    const target = Number(settings?.mobile_bottom_banner_target_time) || 
      (Date.now() + ((Number(settings?.mobile_bottom_banner_hours) || 16) * 3600 + (Number(settings?.mobile_bottom_banner_minutes) || 22) * 60 + (Number(settings?.mobile_bottom_banner_seconds) || 0)) * 1000);
    const diff = target - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { hours: h, minutes: m, seconds: s, expired: false };
  });

  useEffect(() => {
    const target = Number(settings?.mobile_bottom_banner_target_time) || 
      (Date.now() + ((Number(settings?.mobile_bottom_banner_hours) || 16) * 3600 + (Number(settings?.mobile_bottom_banner_minutes) || 22) * 60 + (Number(settings?.mobile_bottom_banner_seconds) || 0)) * 1000);
    
    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return true;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s, expired: false });
      return false;
    };

    updateTimer();
    const timer = setInterval(() => {
      const expired = updateTimer();
      if (expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.mobile_bottom_banner_target_time, settings?.mobile_bottom_banner_hours, settings?.mobile_bottom_banner_minutes, settings?.mobile_bottom_banner_seconds]);

  const activeProducts = React.useMemo(() => {
    return products?.filter(p => p.status === 'active' && p.stock > 0) || [];
  }, [products]);

  // 1. Parse Settings Banners
  const parsedSettingsBanners = typeof banners === 'string' ? JSON.parse(banners) : (banners || []);
  
  // 2. Filter out empty slots if it's a slider
  const validSettingsBanners = parsedSettingsBanners.filter(b => b.image || b.title);

  // 3. Auto Showcase fallback (if no manual banners are set)
  const featuredProducts = products.filter(p => Number(p.is_featured) === 1).sort((a, b) => b.id - a.id).slice(0, 5);
  const productBanners = featuredProducts.map(p => ({
    id: p.id,
    title: p.name,
    subtitle: p.description || t('big_performance_sleek_design'),
    image: p.image_url || p.image || '/hero-banner.png',
    link: `/product/${p.id}`,
    price: p.price,
    brand: p.brand || 'SWEETO',
    product_id: p.id
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

  // Grid Layout logic
  if (layout === 'grid') {
    const activeProducts = products.filter(p => p.status !== 'draft');
    const mainProduct = activeProducts.length > 0
      ? activeProducts[gridMainSlide % activeProducts.length]
      : null;
    const mainSlot = mainProduct
      ? {
          title: mainProduct.name,
          subtitle: mainProduct.description || mainProduct.category || '',
          image: mainProduct.image_url || mainProduct.image || '',
          link: `/product/${mainProduct.id}`,
          price: mainProduct.price,
          discount: mainProduct.discount
        }
      : (displayBanners[0] || {});

    const sideA = parsedSettingsBanners[0] || null;
    const sideB = parsedSettingsBanners[1] || null;
    const gridStyle = settings?.hero_grid_style || 'cover';

    if (gridStyle === 'glass') {
      return (
        <section className="max-w-[1600px] mx-auto -mx-4 md:mx-auto md:px-6 pt-1.5 pb-0 md:pt-3 md:pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 lg:h-[600px]">
            <div 
              onClick={() => handleBannerClick(mainSlot.link)}
              className="lg:col-span-8 h-[360px] sm:h-[220px] md:h-[300px] lg:h-full relative rounded-none sm:rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden bg-gradient-to-br from-[#0c162b] via-[#020617] to-[#080f20] shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/5 flex flex-row items-center p-5 sm:p-10 md:p-16 gap-6 md:gap-10 group cursor-pointer"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[350px] sm:h-[350px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="flex-1 flex flex-col justify-center relative z-10 w-full text-left">
                <div className="bg-[#00f2fe] text-slate-950 font-black text-[9px] sm:text-xs md:text-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded uppercase tracking-wider transform -rotate-[6deg] select-none shadow-md mb-2 sm:mb-3 md:mb-4 w-fit">
                  VIVA
                </div>
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={`title-${gridMainSlide}`}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-2 tracking-tighter uppercase leading-none italic"
                  >
                    {t_smart(mainSlot.title)}
                  </motion.h2>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`desc-${gridMainSlide}`}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[9px] sm:text-[11px] md:text-sm lg:text-base font-bold text-white/90 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] font-sans mt-1 line-clamp-1"
                  >
                    {t_smart(mainSlot.subtitle)}
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="hidden sm:flex flex-1 justify-center items-center relative h-full w-full z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={gridMainSlide}
                    initial={{ scale: 0.94, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.94, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative w-full h-full flex justify-center items-center"
                  >
                    <div className="absolute w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] bg-eas-blue/20 rounded-full blur-3xl opacity-60 group-hover:scale-110 transition-transform duration-700" />
                    {mainSlot.image ? (
                      <div className="relative p-3 md:p-6 bg-slate-900/60 backdrop-blur-md rounded-[1.8rem] sm:rounded-[2.5rem] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.4)] group-hover:border-white/20 transition-all duration-500 overflow-hidden flex items-center justify-center max-w-[220px] sm:max-w-[280px] md:max-w-[340px] aspect-square w-full">
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
            <div className="hidden lg:flex lg:col-span-4 flex-col gap-4 sm:gap-8 h-auto lg:h-full">
              <div 
                onClick={() => sideA && handleBannerClick(sideA.link)}
                className="flex-1 bg-gradient-to-br from-[#0b1424] to-[#020617] rounded-3xl relative overflow-hidden group shadow-2xl border border-white/5 p-5 md:p-8 flex items-center gap-4 hover:border-white/10 transition-all duration-300 min-h-[140px] cursor-pointer"
              >
                {sideA ? (
                  <>
                    <div className="flex-[3] flex flex-col justify-center h-full relative z-10 text-left">
                      <span className="text-[8px] font-black text-eas-blue uppercase tracking-[0.2em] mb-1.5">{t_smart(sideA.subtitle) || t('exclusive_deal')}</span>
                      <h3 className="text-base md:text-xl font-black text-white mb-4 uppercase italic tracking-tighter line-clamp-2 leading-tight">{t_smart(sideA.title)}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); sideA.link && handleBannerClick(sideA.link); }} 
                        className="w-fit px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white hover:text-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                      >
                        {t('view_product')}
                      </button>
                    </div>
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
              <div 
                onClick={() => sideB && handleBannerClick(sideB.link)}
                className="flex-1 bg-[#0f111a] rounded-3xl relative overflow-hidden group shadow-2xl p-5 md:p-8 flex items-center gap-4 hover:shadow-blue-500/10 transition-shadow border border-white/5 hover:border-white/10 min-h-[140px] cursor-pointer"
              >
                {sideB ? (
                  <>
                    <div className="flex-[3] flex flex-col justify-center h-full relative z-10 text-left">
                      <span className="text-[8px] font-black text-white/70 uppercase tracking-[0.2em] mb-1.5">{t_smart(sideB.subtitle) || t('special_offer')}</span>
                      <h3 className="text-base md:text-xl font-black text-white mb-4 uppercase italic tracking-tighter line-clamp-2 leading-tight">{t_smart(sideB.title)}</h3>
                      <button 
                        onClick={(e) => { e.stopPropagation(); sideB.link && handleBannerClick(sideB.link); }} 
                        className="w-fit px-4 py-2 bg-white hover:bg-slate-900 hover:text-white text-eas-blue rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 shadow-xl"
                      >
                        {t('claim_offer')}
                      </button>
                    </div>
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

    // Default Full-Bleed Cover style (Immersive fullscreen)
    return (
      <section className="max-w-[1600px] mx-auto -mx-4 md:mx-auto md:px-6 pt-1.5 pb-0 md:pt-3 md:pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[600px]">
          <div 
            onClick={() => handleBannerClick(mainSlot.link)}
            className="lg:col-span-8 h-[360px] sm:h-[220px] md:h-[300px] lg:h-full relative rounded-none sm:rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden bg-slate-950 shadow-2xl border border-white/5 group cursor-pointer"
          >
            {mainSlot.image && (
              <AnimatePresence mode="sync">
                <motion.img
                  key={gridMainSlide}
                  src={mainSlot.image}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 0.8, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-102 transition-transform duration-[1200ms] ease-out"
                  alt=""
                />
              </AnimatePresence>
            )}
            <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 pl-6 sm:pl-10 md:pl-16 lg:pl-20 flex flex-col justify-center items-start gap-0.5 sm:gap-1 max-w-lg md:max-w-2xl z-20 text-left">
              <div className="bg-[#00f2fe] text-slate-950 font-black text-[9px] sm:text-xs md:text-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded uppercase tracking-wider transform -rotate-[6deg] select-none shadow-md mb-2 sm:mb-3 md:mb-4 w-fit">
                VIVA
              </div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={`title-${gridMainSlide}`}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg leading-none"
                >
                  {t_smart(mainSlot.title)}
                </motion.h2>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p
                  key={`desc-${gridMainSlide}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-[9px] sm:text-[11px] md:text-sm lg:text-base font-bold text-white/90 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] font-sans mt-1 line-clamp-1"
                >
                  {t_smart(mainSlot.subtitle)}
                </motion.p>
              </AnimatePresence>
            </div>
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
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-8 h-auto lg:h-full">
            <div 
              onClick={() => sideA && handleBannerClick(sideA.link)}
              className="flex-1 bg-gradient-to-tr from-[#9600ff] via-[#ae00ff] to-[#00b7ff] rounded-3xl relative overflow-hidden group shadow-2xl border border-white/10 p-8 flex flex-col justify-center min-h-[190px] cursor-pointer"
            >
              {sideA && sideA.image && (
                <img 
                  src={sideA.image} 
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  alt="" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none" />
              {sideA ? (
                <div className="relative z-20 text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 block">
                    {t_smart(sideA.subtitle) || t('exclusive_deal')}
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 uppercase tracking-tighter line-clamp-1 leading-tight">
                    {t_smart(sideA.title)}
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
            <div 
              onClick={() => sideB && handleBannerClick(sideB.link)}
              className="flex-1 bg-[#0f111a] rounded-3xl relative overflow-hidden group shadow-2xl p-8 flex flex-col justify-center min-h-[190px] border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
            >
              {sideB && sideB.image && (
                <img 
                  src={sideB.image} 
                  className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-[1000ms] ease-out" 
                  alt="" 
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent z-10 pointer-events-none" />
              {sideB ? (
                <div className="relative z-20 text-left">
                  <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1.5 block">
                    {t_smart(sideB.subtitle) || t('special_offer')}
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-4 uppercase tracking-tighter line-clamp-1 leading-tight">
                    {t_smart(sideB.title)}
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

  // Overhauled Card-Based Hero Slider Layout
  const activeSlide = displayBanners[currentSlide];

  // Try to find matching product details dynamically
  const associatedProduct = React.useMemo(() => {
    if (!activeSlide) return null;
    if (activeSlide.product_id) {
      return products.find(p => String(p.id) === String(activeSlide.product_id));
    }
    if (activeSlide.link && activeSlide.link.includes('/product/')) {
      const parts = activeSlide.link.split('/product/');
      const id = parts[parts.length - 1];
      return products.find(p => String(p.id) === String(id));
    }
    return null;
  }, [activeSlide, products]);

  const slideTitle = activeSlide?.title || associatedProduct?.name || 'SWEETO PREMIUM GADGET';
  const slideBrand = activeSlide?.brand || associatedProduct?.brand || 'SWEETO';
  const slidePrice = activeSlide?.price || associatedProduct?.price || '';
  const slideDesc = activeSlide?.subtitle || associatedProduct?.description || '';
  const slideImg = activeSlide?.image || associatedProduct?.image_url || associatedProduct?.image || '/hero-banner.png';
  const slideLink = activeSlide?.link || (associatedProduct ? `/product/${associatedProduct.id}` : '#');

  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-6 pt-3 pb-0 sm:pb-6 select-none bg-transparent">
      <div 
        onClick={() => handleBannerClick(slideLink)}
        className="relative w-full h-[360px] sm:h-[240px] md:h-[280px] lg:h-[320px] rounded-[1.8rem] sm:rounded-[2.5rem] bg-gradient-to-br from-[#006f4c] via-[#054354] to-[#1c296f] sm:bg-[#1e2530] sm:from-transparent sm:to-transparent text-white overflow-hidden shadow-2xl flex flex-row items-center border border-white/5 cursor-pointer group"
      >
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[250px] h-[250px] sm:w-[350px] sm:h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none hidden sm:block" />

        <div className="w-full sm:w-[60%] lg:w-[55%] px-6 sm:px-0 sm:pl-10 md:pl-14 flex flex-col justify-center py-6 sm:py-8 h-full z-10 text-left font-sans gap-3 sm:gap-2">
          <div className="flex flex-col gap-2 sm:gap-2">
            {/* Mobile Tag / Badge */}
            <div className="flex sm:hidden items-center gap-1.5 bg-[#20c997]/15 border border-[#20c997]/30 text-[#3dfebc] px-3.5 py-1.5 rounded-full w-fit text-[9px] font-bold tracking-widest uppercase mb-1 select-none">
              <span>✨</span>
              <span>{slideBrand || 'WEARABLE ECOSYSTEM'}</span>
            </div>

            {/* Desktop Brand Text */}
            <span className="hidden sm:inline-block text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">
              {slideBrand}
            </span>
            
            <AnimatePresence mode="wait">
              <motion.h1 
                key={`title-${currentSlide}`}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-2xl sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight max-w-[95%] line-clamp-2 font-sans normal-case sm:uppercase sm:italic"
              >
                {t_smart(slideTitle)}
              </motion.h1>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={`price-${currentSlide}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden sm:block text-[10px] sm:text-base md:text-xl lg:text-2xl font-black text-[#8b5cf6] tracking-tight leading-none"
              >
                {slidePrice ? `${settings?.currency || 'FCFA'} ${Number(slidePrice).toLocaleString()}` : ''}
              </motion.div>
            </AnimatePresence>
            
            <AnimatePresence mode="wait">
              <motion.p 
                key={`desc-${currentSlide}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[11px] sm:text-xs md:text-sm font-normal sm:font-medium text-white/80 sm:text-slate-300 leading-relaxed max-w-[95%] sm:max-w-[90%] line-clamp-3 sm:line-clamp-2"
              >
                {t_smart(slideDesc)}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-2 sm:mt-4 flex">
            <button 
              onClick={(e) => { e.stopPropagation(); handleBannerClick(slideLink); }}
              className="px-4 py-2.5 sm:px-6 sm:py-3 bg-[#20c997] sm:bg-[#7c3aed] hover:bg-[#1ab288] sm:hover:bg-[#6d28d9] text-black sm:text-white rounded-xl sm:rounded-2xl font-bold sm:font-black text-xs sm:text-[10px] normal-case sm:uppercase tracking-wider sm:tracking-widest transition-all shadow-[0_4px_15px_rgba(32,201,151,0.2)] sm:shadow-[0_4px_15px_rgba(124,58,237,0.3)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer border-none flex items-center gap-2"
            >
              <span>
                {slideBrand?.toLowerCase().includes('wearable') 
                  ? 'View Wearables' 
                  : slideBrand?.toLowerCase().includes('watch')
                  ? 'View Watches'
                  : (t('view_details') || 'View Details')}
              </span>
              <span className="w-5 h-5 rounded-full bg-black flex items-center justify-center sm:hidden shrink-0">
                <ChevronRight size={10} className="text-white" strokeWidth={3} />
              </span>
              <Eye size={12} className="hidden sm:block sm:size-14" />
            </button>
          </div>
        </div>

        <div className="hidden sm:flex w-[35%] sm:w-[40%] lg:w-[45%] h-full items-center justify-center pr-6 sm:pr-10 relative overflow-hidden z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ scale: 0.94, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.94, opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-4/5 flex items-center justify-center"
            >
              <div className="absolute w-[120px] h-[120px] sm:w-[200px] sm:h-[200px] bg-[#8b5cf6]/15 rounded-full blur-[40px] pointer-events-none" />
              <img 
                src={slideImg} 
                alt="" 
                className="max-h-[80%] max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform duration-[1200ms] ease-out select-none pointer-events-none"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Navigation Dots (Mockup Style, inside card) */}
        {displayBanners.length > 1 && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex sm:hidden items-center justify-center gap-1.5 z-20 select-none"
          >
            {displayBanners.map((_, idx) => {
              const isActive = idx === currentSlide;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer border-none p-0 ${
                    isActive 
                      ? 'w-5 h-1.5 bg-white' 
                      : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/70'
                  }`}
                  title={`Go to slide ${idx + 1}`}
                />
              );
            })}
          </div>
        )}

        {/* Mobile Faint Navigation Arrows (Mockup Style) */}
        {displayBanners.length > 1 && (
          <>
            <button 
              onClick={(e) => { e.stopPropagation(); prevSlide(); }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex sm:hidden items-center justify-center bg-black/5 hover:bg-black/10 text-white/20 hover:text-white/40 transition-all border-none cursor-pointer z-20"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); nextSlide(); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex sm:hidden items-center justify-center bg-black/5 hover:bg-black/10 text-white/20 hover:text-white/40 transition-all border-none cursor-pointer z-20"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* Desktop Navigation Dots */}
      {displayBanners.length > 1 && (
        <div className="hidden sm:flex items-center justify-center gap-2 mt-4 select-none">
          {displayBanners.map((_, idx) => {
            const isActive = idx === currentSlide;
            return (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`transition-all duration-300 rounded-full cursor-pointer border-none p-0 ${
                  isActive 
                    ? 'w-6 h-1.5 bg-[#8b5cf6]' 
                    : 'w-1.5 h-1.5 bg-slate-600/40 dark:bg-slate-700/60 hover:bg-slate-400'
                }`}
                title={`Go to slide ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default Hero;
