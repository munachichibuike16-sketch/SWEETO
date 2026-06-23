import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Search, Share2, Package } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';

export default function DealsContent({ onProductClick }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { products = [], settings } = useStore();
  const { lang, t, t_smart } = useLanguage();

  const [scrolled, setScrolled] = useState(false);

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

  // Filter daily deals products (optionally by category)
  const dealProducts = useMemo(() => {
    let list = Array.isArray(products)
      ? products.filter(p => p.status === 'active' && (Number(p.is_daily_deal) === 1 || (p.original_price && p.original_price > p.price)))
      : [];
    if (categoryParam) {
      list = list.filter(p => p.category?.toLowerCase() === categoryParam.toLowerCase());
    }
    return list;
  }, [products, categoryParam]);

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
      
      {/* AliExpress-Style Floating Sticky Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 transition-all duration-300 ${
        scrolled 
          ? 'bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <button 
          onClick={() => navigate(-1)} 
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            scrolled 
              ? 'text-slate-850 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-900' 
              : 'bg-black/35 text-white hover:bg-black/50'
          }`}
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

      {/* AliExpress-Style Red Ticket Envelope Banner */}
      <div className="relative w-full aspect-[375/170] sm:aspect-[2.2/1] bg-[#e0f2fe] dark:bg-slate-900 flex items-center justify-center overflow-hidden pt-12">
        {/* Envelope back container */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200/40 via-sky-50/10 to-white dark:to-slate-950" />
        
        {/* Envelope flap visual */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white dark:bg-slate-950 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] border-t border-slate-100/50 dark:border-slate-850" 
             style={{ clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }} />
        
        {/* Sparkle details */}
        <div className="absolute top-16 right-[15%] text-sky-200 dark:text-sky-800 select-none animate-pulse text-2xl font-black">✦</div>
        <div className="absolute bottom-4 left-[10%] text-sky-200 dark:text-sky-800 select-none text-xl font-black">⚡</div>

        {/* Tilted Coupon Ticket */}
        <div className="relative w-[88%] max-w-md bg-gradient-to-r from-[#e63946] to-[#d90429] text-white py-4 px-6 rounded-2xl shadow-2xl border-2 border-dashed border-white/20 transform -rotate-2 hover:rotate-0 transition-transform duration-500 flex flex-col items-center justify-center z-10">
          
          {/* Circular punch hole details */}
          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#e0f2fe] dark:bg-slate-900 z-10" />
          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#e0f2fe] dark:bg-slate-900 z-10" />
          
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-white/90 mb-1">{categoryParam ? `${t_smart(categoryParam)} ${lang === 'fr' ? 'offres spéciales' : 'special offers'}` : (lang === 'fr' ? "Offres spéciales d'aujourd'hui" : "Today's special offers")}</p>
          
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-2xl font-black uppercase tracking-tight leading-none">UP TO</span>
            <span className="text-4xl sm:text-6xl font-black tracking-tighter leading-none font-mono">70%</span>
            <div className="flex flex-col justify-center items-start leading-none">
              <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none">%</span>
              <span className="text-[10px] sm:text-xs font-black tracking-tight leading-none">OFF</span>
            </div>
          </div>
          
          <div className="absolute bottom-1 right-4 text-[7px] font-black uppercase tracking-widest text-white/40">Limited Slots Only</div>
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

    </div>
  );
}
