import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Share2, Package } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCategoryDescendants } from '../utils/categoryHelpers';
import ProductCard from './ProductCard';

export default function DealsContent({ onProductClick }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { products = [], categories = [], settings } = useStore();
  const { lang, t, t_smart } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // AliExpress-style 8-hour block ticking countdown timer
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const nextMark = new Date();
      const currentHour = now.getHours();
      const nextHour = Math.ceil((currentHour + 0.1) / 8) * 8;
      
      if (nextHour >= 24) {
        nextMark.setDate(now.getDate() + 1);
        nextMark.setHours(0, 0, 0, 0);
      } else {
        nextMark.setHours(nextHour, 0, 0, 0);
      }

      const diff = nextMark - now;
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // Scroll listener to toggle header background opacity
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter daily deals products (optionally by category and its subcategories)
  const dealProducts = useMemo(() => {
    let list = Array.isArray(products)
      ? products.filter(p => p.status === 'active' && (Number(p.is_daily_deal) === 1 || p.is_daily_deal === true || String(p.is_daily_deal) === '1' || String(p.is_daily_deal) === 'true'))
      : [];
    if (categoryParam) {
      const descendants = getCategoryDescendants(categoryParam, categories);
      const matchNames = [categoryParam.toLowerCase(), ...descendants];
      
      list = list.filter(p => {
        const pCat = p.category?.toLowerCase();
        return pCat && matchNames.includes(pCat);
      });
    }
    return list;
  }, [products, categoryParam, categories]);

  // Get recommendation products for "More to Love" section (active products not in deals, prioritized by features)
  const moreToLoveProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    const dealIds = new Set(dealProducts.map(p => p.id));
    const list = products.filter(p => p.status === 'active' && !dealIds.has(p.id));
    return [...list].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)).slice(0, 20);
  }, [products, dealProducts]);

  // Share handler
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Today\'s Special Offers - Super Deals',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(lang === 'fr' ? 'Lien copié dans le presse-papiers !' : 'Link copied to clipboard!');
    }
  };

  // Search handler
  const handleSearchClick = () => {
    const event = new CustomEvent('open-search-modal');
    window.dispatchEvent(event);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 relative overflow-x-hidden">
      
      <style>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      
      {/* AliExpress-Style Floating Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <button 
          onClick={() => navigate(-1)} 
          className="w-9 h-9 rounded-full bg-white/95 dark:bg-slate-950/95 border border-slate-100 dark:border-slate-800 shadow-md text-blue-600 dark:text-blue-400 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        
        <span className={`font-black text-sm uppercase tracking-widest transition-opacity duration-300 ${
          scrolled ? 'opacity-100 text-slate-900 dark:text-white' : 'opacity-0'
        }`}>
          {categoryParam ? `${t_smart(categoryParam)} ${lang === 'fr' ? 'Offres' : 'Deals'}` : (lang === 'fr' ? 'Super Offres' : 'Super Deals')}
        </span>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleSearchClick}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              scrolled 
                ? 'text-slate-850 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900' 
                : 'bg-black/35 text-white hover:bg-black/50'
            }`}
          >
            <Search size={18} />
          </button>
          <button 
            onClick={handleShare}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              scrolled 
                ? 'text-slate-850 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900' 
                : 'bg-black/35 text-white hover:bg-black/50'
            }`}
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Premium AliExpress-Style Ticket Envelope Banner */}
      <div className="relative w-full aspect-[375/170] sm:aspect-[2.2/1] bg-gradient-to-tr from-sky-100 via-sky-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center overflow-hidden pt-12">
        {/* Envelope back container */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/20 via-sky-50/5 to-white dark:to-slate-950" />
        
        {/* Envelope flap visual */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white dark:bg-slate-950 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-slate-100/50 dark:border-slate-850" 
             style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }} />
        
        {/* Sparkle details */}
        <div className="absolute top-16 right-[15%] text-sky-200 dark:text-sky-850 select-none animate-pulse text-2xl font-black">✦</div>
        <div className="absolute bottom-4 left-[10%] text-sky-200 dark:text-sky-850 select-none text-xl font-black">⚡</div>

        {/* Tilted Holographic Coupon Ticket */}
        <motion.div 
          initial={{ scale: 0.9, rotate: -6, opacity: 0 }}
          animate={{ scale: 1, rotate: -2, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          whileHover={{ scale: 1.03, rotate: 0 }}
          className="relative w-[88%] max-w-md bg-gradient-to-r from-[#d90429] via-[#ef233c] to-[#d90429] text-white py-5 px-7 rounded-3xl shadow-[0_20px_50px_rgba(217,4,41,0.3)] border border-white/20 transform z-10 overflow-hidden group cursor-pointer"
        >
          {/* Holographic Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          
          {/* Ticket punch hole details */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f1f5f9] dark:bg-[#020617] z-10 shadow-inner" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#f1f5f9] dark:bg-[#020617] z-10 shadow-inner" />

          {/* Dashed Golden Divider */}
          <div className="absolute left-[70%] top-0 bottom-0 border-l border-dashed border-white/25 z-0" />

          <div className="relative z-10 flex items-center justify-between w-full h-full pr-[30%]">
            <div className="flex flex-col items-start text-left">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-amber-300 mb-1">
                {categoryParam ? `${t_smart(categoryParam)} VIP DEAL` : "Today's special offers"}
              </p>
              
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black uppercase tracking-tight leading-none text-white/90">UP TO</span>
                <span className="text-4xl sm:text-6xl font-black tracking-tighter leading-none font-mono text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)]">70%</span>
                <div className="flex flex-col justify-center items-start leading-none">
                  <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-amber-300">%</span>
                  <span className="text-[10px] sm:text-xs font-black tracking-tight leading-none text-white/90">OFF</span>
                </div>
              </div>
            </div>
          </div>

          {/* Golden text on the right side of the divider */}
          <div className="absolute right-0 top-0 bottom-0 w-[30%] flex flex-col items-center justify-center text-center z-10 select-none px-1">
            <span className="text-[12px] sm:text-sm font-black uppercase tracking-wider text-amber-300 transform rotate-90 leading-none">
              VIP
            </span>
            <span className="text-[7px] font-black uppercase tracking-widest text-white/70 mt-4 leading-none">
              SUPER
            </span>
          </div>

          <div className="absolute bottom-1.5 left-7 text-[7px] font-black uppercase tracking-widest text-white/40">Limited Slots Only</div>
        </motion.div>
      </div>

      {/* AliExpress-Style Countdown Flash Deals Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 md:px-12 py-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 mx-3 md:mx-0 w-[calc(100%-24px)] md:w-full rounded-2xl md:rounded-none shadow-sm md:shadow-none mb-4 md:mb-0 mt-4 md:mt-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <h2 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>⚡</span>
            <span>{categoryParam ? `${t_smart(categoryParam)} Super Deals` : (lang === 'fr' ? 'Super Offres' : 'Super Deals')}</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2 select-none">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {lang === 'fr' ? 'SE TERMINE DANS' : 'ENDS IN'}
          </span>
          <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-black">
            <span className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-2 py-1 rounded-md shadow-sm min-w-[28px] text-center">
              {String(timeLeft.hours).padStart(2, '0')}
            </span>
            <span className="text-slate-900 dark:text-white">:</span>
            <span className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-2 py-1 rounded-md shadow-sm min-w-[28px] text-center">
              {String(timeLeft.minutes).padStart(2, '0')}
            </span>
            <span className="text-slate-900 dark:text-white">:</span>
            <span className="bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-100 px-2 py-1 rounded-md shadow-sm min-w-[28px] text-center text-red-500 dark:text-red-400">
              {String(timeLeft.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Grid container with full bleed mobile styling */}
      <div className="w-full relative px-0 md:px-12 py-3 bg-white dark:bg-slate-950">
        {dealProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-6">
            {dealProducts.map((prod, idx) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                index={idx}
                onProductClick={onProductClick}
                layout="aliexpress"
              />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 mx-3 md:mx-0 w-[calc(100%-24px)] md:w-full">
            <Package size={36} className="mb-2 opacity-60 animate-bounce" />
            <p className="text-sm font-bold uppercase tracking-wider">No deals found today</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Check back soon for new discounts</p>
          </div>
        )}
      </div>

      {/* AliExpress-Style "More To Love" Section */}
      {moreToLoveProducts.length > 0 && (
        <div className="mt-8 px-0 md:px-12 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 mx-3 md:mx-0 w-[calc(100%-24px)] md:w-full rounded-2xl md:rounded-none shadow-sm md:shadow-none mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">❤️</span>
              <h2 className="text-base sm:text-lg font-black uppercase italic tracking-tight text-slate-900 dark:text-white">
                {lang === 'fr' ? "Plus d'articles à adorer" : "More to Love"}
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {lang === 'fr' ? "RECOMMANDÉ POUR VOUS" : "RECOMMENDED FOR YOU"}
            </span>
          </div>

          <div className="w-full px-0 md:px-0 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-6">
              {moreToLoveProducts.map((prod, idx) => (
                <ProductCard 
                  key={prod.id}
                  product={prod}
                  index={idx}
                  onProductClick={onProductClick}
                  layout="aliexpress"
                />
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
