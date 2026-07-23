import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Share2, Package, Truck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCategoryDescendants } from '../utils/categoryHelpers';
import ProductCard from './ProductCard';

export default function DealsContent({ onProductClick }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { products = [], categories = [], settings, showToast } = useStore();
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
      if (showToast) {
        showToast(lang === 'fr' ? 'Lien copié dans le presse-papiers ! 🔗' : 'Link copied to clipboard! 🔗', 'success');
      } else {
        alert(lang === 'fr' ? 'Lien copié dans le presse-papiers !' : 'Link copied to clipboard!');
      }
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

      {/* Premium Choice Super Deals Hero Banner */}
      <div className="w-full px-0 pt-3 pb-6 bg-slate-50 dark:bg-slate-950">
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full rounded-none bg-[#13161c] text-white overflow-hidden shadow-2xl border-y border-white/5 flex flex-col items-center p-6 sm:p-8 md:p-10 select-none -mx-4 sm:mx-auto"
        >
          {/* Subtle Orange/Golden radial glow on the right side */}
          <div className="absolute right-0 top-0 bottom-0 w-[50%] bg-gradient-to-l from-[#ffc72c]/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[200px] h-[200px] bg-[#ff5722]/5 rounded-full blur-[100px] pointer-events-none" />

          {/* Badge */}
          <div className="flex items-center gap-1.5 bg-[#f5c71a] text-slate-950 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider select-none mb-4 shadow-[0_4px_15px_rgba(245,199,26,0.3)]">
            <span className="text-slate-950">⚡</span>
            <span>{lang === 'fr' ? 'Super Offres Choix' : 'Choice Super Deals'}</span>
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white text-center tracking-tight leading-tight max-w-3xl mb-3">
            {lang === 'fr' ? (
              <>Jusqu'à <span className="text-[#f5c71a]">-70%</span> sur les essentiels Tech</>
            ) : (
              <>Up to <span className="text-[#f5c71a]">70% OFF</span> Tech Essentials</>
            )}
          </h1>

          {/* Subheading */}
          <p className="text-[10px] sm:text-xs md:text-sm text-white/70 text-center max-w-2xl mb-6 font-medium leading-relaxed">
            {lang === 'fr' 
              ? "Livraison gratuite dès 10$ • Livraison garantie en 5 jours • Protection acheteur 75 jours" 
              : "Free shipping on orders over $10 • Guaranteed 5-Day Delivery • 75-Day Buyer Protection"
            }
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
            {/* Button 1: Shop Deals Now */}
            <button 
              onClick={() => {
                const element = document.getElementById('deals-product-grid');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#ff5722] to-[#ff2a5f] hover:from-[#ff6b3d] hover:to-[#ff4575] text-white rounded-full font-black text-xs sm:text-sm uppercase tracking-wider transition-all shadow-[0_6px_20px_rgba(255,87,34,0.4)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer border-none flex items-center gap-2"
            >
              <span>{lang === 'fr' ? 'Acheter maintenant' : 'Shop Deals Now'}</span>
              <ArrowRight size={14} className="stroke-[3]" />
            </button>

          </div>

          {/* Countdown timer card inside the banner */}
          <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-3xl p-4 sm:p-5 w-full max-w-[340px] sm:max-w-[400px] flex flex-col items-center gap-3 shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-[#f5c71a]">
              {lang === 'fr' ? 'LA VENTE FLASH SE TERMINE DANS' : 'FLASH SALE ENDS IN'}
            </span>
            
            <div className="flex items-center gap-2.5 sm:gap-3 text-white select-none">
              <div className="flex flex-col items-center">
                <div className="bg-[#0b0f19] border border-white/5 rounded-2xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-black text-[#f5c71a] shadow-inner">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">HRS</span>
              </div>
              
              <span className="text-lg sm:text-2xl font-black text-[#f5c71a] -mt-4">:</span>
              
              <div className="flex flex-col items-center">
                <div className="bg-[#0b0f19] border border-white/5 rounded-2xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-black text-[#f5c71a] shadow-inner">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">MIN</span>
              </div>
              
              <span className="text-lg sm:text-2xl font-black text-[#f5c71a] -mt-4">:</span>
              
              <div className="flex flex-col items-center">
                <div className="bg-[#0b0f19] border border-white/5 rounded-2xl w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-lg sm:text-2xl font-black text-red-500 shadow-inner animate-[pulse_1s_infinite]">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <span className="text-[7px] sm:text-[8px] font-black text-slate-400 mt-1 uppercase tracking-widest">SEC</span>
              </div>
            </div>
          </div>
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
      <div id="deals-product-grid" className="w-full relative px-0 md:px-12 py-3 bg-white dark:bg-slate-950">
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
