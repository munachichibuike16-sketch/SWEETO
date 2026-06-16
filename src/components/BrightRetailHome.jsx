import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  Heart, 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  Smartphone,
  Play
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const getImagesList = (prod) => {
  if (!prod) return [];
  const list = [];
  const mainImg = prod.image_url || prod.image;
  if (mainImg) list.push(mainImg);
  if (prod.images) {
    try {
      const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
      if (Array.isArray(imgs)) {
        imgs.forEach(img => {
          if (img && !list.includes(img)) list.push(img);
        });
      }
    } catch (e) {}
  }
  if (list.length === 0) list.push('/hero-banner.png');
  return list;
};

export default function BrightRetailHome({ onProductClick }) {
  const { products, categories, settings, sections, openGlobalLightbox, showToast } = useStore();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, lang, t_smart } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new'); // 'new' or 'bestseller'
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const activeProducts = products.filter(p => p.status === 'active' && p.stock > 0);

  // Split products for sections
  const dailyDeals = activeProducts.filter(p => p.is_daily_deal || (p.original_price && p.original_price > p.price));

  // Dynamic images and text from settings
  const promoImages = {
    mobiles: settings?.bright_promo1_image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
    headset: settings?.bright_promo2_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    speakers: settings?.bright_promo3_image || 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400',
    banner: settings?.bright_wide_banner_image || 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=1200',
  };

  const promo1Title = settings?.bright_promo1_title || 'Smart Mobiles';
  const promo1Subtitle = settings?.bright_promo1_subtitle || 'Discover Trends';

  const promo2Title = settings?.bright_promo2_title || 'Smart Headset';
  const promo2Subtitle = settings?.bright_promo2_subtitle || 'Hi-Fi Audio Experience';

  const promo3Title = settings?.bright_promo3_title || 'Portable Speaker';
  const promo3Subtitle = settings?.bright_promo3_subtitle || 'Bluetooth Waterproof';

  const handleToggleWishlist = (e, productId) => {
    e.stopPropagation();
    toggleWishlist(productId);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
  };

  // Filter sections belonging to Bright template
  const brightSections = React.useMemo(() => {
    const raw = sections || [];
    const filtered = raw.filter(s => s.role?.startsWith('bright_') || s.key?.startsWith('bright_'));
    if (filtered.length > 0) {
      return [...filtered].sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    // Default fallback order if database has no sections configured for Bright template
    return [
      { id: 'default-cats', role: 'bright_categories', isActive: true, position: 0 },
      { id: 'default-hero', role: 'bright_hero', isActive: true, position: 1 },
      { id: 'default-promos', role: 'bright_promos', isActive: true, position: 2 },
      { id: 'default-tabs', role: 'bright_tabs', isActive: true, position: 3 },
      { id: 'default-billboard', role: 'bright_billboard', isActive: true, position: 4 },
      { id: 'default-deal', role: 'bright_dealOfDay', isActive: true, position: 5 },
      { id: 'default-featured', role: 'bright_featured', isActive: true, position: 6 },
      { id: 'default-trending', role: 'bright_trending', isActive: true, position: 7 },
      { id: 'default-banners', role: 'bright_promo_banners', isActive: true, position: 8 },
      { id: 'default-badges', role: 'bright_trust_badges', isActive: true, position: 9 },
    ];
  }, [sections]);

  const renderBrightHeader = (title, subtitle, section, extraContent = null, isMini = false) => {
    const styleKey = section?.headerStyle || 'bright_minimal';
    const showViewAll = section?.showViewAll !== false;

    const handleViewAll = () => {
      const event = new CustomEvent('view-all-products');
      window.dispatchEvent(event);
    };

    // Style-specific containers
    const containers = isMini ? {
      bright_banner: "w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-[#4a8bf5] text-white shadow-sm flex items-center justify-between gap-3",
      bright_yellow: "w-full p-4 rounded-2xl bg-gradient-to-r from-[#ffc200] to-amber-500 text-slate-950 shadow-sm flex items-center justify-between gap-3",
      bright_minimal: "w-full py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-transparent",
      bright_outlined: "w-full p-4 rounded-2xl border-2 border-[#ffc200] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white flex items-center justify-between gap-3",
      bright_accent: "w-full pl-4 py-1 border-l-4 border-[#ffc200] flex items-center justify-between gap-3 bg-transparent",
      bright_glass: "w-full p-4 rounded-2xl bg-white/5 dark:bg-[#0b1329]/20 border border-slate-200/40 dark:border-slate-800/50 backdrop-blur-md text-slate-900 dark:text-white flex items-center justify-between gap-3"
    } : {
      bright_banner: "w-full px-6 py-6 sm:px-10 sm:py-8 rounded-2xl bg-gradient-to-r from-blue-600 to-[#4a8bf5] text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      bright_yellow: "w-full px-6 py-6 sm:px-10 sm:py-8 rounded-2xl bg-gradient-to-r from-[#ffc200] to-amber-500 text-slate-955 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      bright_minimal: "w-full py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent",
      bright_outlined: "w-full px-6 py-5 rounded-2xl border-2 border-[#ffc200] bg-white dark:bg-[#0b1329] text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4",
      bright_accent: "w-full pl-5 py-2 border-l-4 border-[#ffc200] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent",
      bright_glass: "w-full px-6 py-5 rounded-2xl bg-white/5 dark:bg-[#0b1329]/20 border border-slate-200/40 dark:border-slate-800/50 backdrop-blur-md text-slate-900 dark:text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    };

    const containerClass = containers[styleKey] || containers.bright_minimal;

    // Title styling depending on background brightness
    const isDarkBackground = styleKey === 'bright_banner';
    const isYellowBackground = styleKey === 'bright_yellow';

    const titleColorClass = isDarkBackground
      ? "text-white"
      : isYellowBackground
        ? "text-slate-950"
        : "text-slate-900 dark:text-white";

    const subtitleColorClass = isDarkBackground
      ? "text-white/80"
      : isYellowBackground
        ? "text-slate-950/80"
        : "text-slate-400 dark:text-slate-500";

    const dotColor = isYellowBackground ? "bg-slate-950" : "bg-[#ffc200]";

    const fontClass = isMini 
      ? "text-sm sm:text-base font-black uppercase tracking-tight flex items-center gap-1.5"
      : "text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2";

    const btnClass = isMini
      ? (isDarkBackground
          ? "px-3 py-1.5 bg-white text-blue-600 hover:bg-slate-100 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95 shrink-0"
          : isYellowBackground
            ? "px-3 py-1.5 bg-slate-950 text-white hover:bg-slate-900 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95 shrink-0"
            : "px-3 py-1.5 bg-slate-950 text-white dark:bg-slate-800 dark:text-white hover:bg-[#ffc200] dark:hover:bg-[#ffc200] hover:text-slate-955 dark:hover:text-slate-955 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full transition-all shadow-sm active:scale-95 shrink-0"
        )
      : (isDarkBackground
          ? "px-4 py-2 bg-white text-blue-600 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
          : isYellowBackground
            ? "px-4 py-2 bg-slate-950 text-white hover:bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95 shrink-0 self-start sm:self-auto"
            : "text-[10px] font-black text-slate-850 dark:text-slate-350 hover:text-[#ffc200] dark:hover:text-[#ffc200] transition-colors uppercase tracking-[0.2em] shrink-0 self-start sm:self-auto"
        );

    return (
      <div className={`${containerClass} mb-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="space-y-0.5">
            <h2 className={`${fontClass} ${titleColorClass}`}>
              {/* Show decorative dot or Zap icon */}
              {section?.role === 'bright_dealOfDay' ? (
                <Zap size={20} fill="#ffc200" className="text-[#ffc200] shrink-0" />
              ) : (
                ['bright_minimal', 'bright_outlined', 'bright_accent', 'bright_glass'].includes(styleKey) && (
                  <span className={`${isMini ? 'w-2 h-2' : 'w-3 h-3'} rounded-full ${dotColor} shrink-0`} />
                )
              )}
              {t_smart(title)}
            </h2>
            {subtitle && (
              <p className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest ${subtitleColorClass}`}>
                {t_smart(subtitle)}
              </p>
            )}
          </div>
          {extraContent && (
            <div className="flex items-center gap-2">
              {extraContent}
            </div>
          )}
        </div>

        {showViewAll && (
          <button onClick={handleViewAll} className={btnClass}>
            {isMini ? (t('view_all') || 'View All') : (isDarkBackground || isYellowBackground ? t('shop_now') || 'Shop Now' : 'Explore All Item')}
          </button>
        )}
      </div>
    );
  };

  const renderProductCard = (product) => {
    const discount = product.discount || (product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);
    const isWished = isInWishlist(product.id);
    return (
      <div 
        key={product.id}
        onClick={() => onProductClick(product)}
        className="bg-white dark:bg-[#0b1329] border border-slate-200/50 dark:border-slate-800/60 rounded-2xl overflow-hidden flex flex-col p-4 relative group cursor-pointer shadow-sm hover:shadow-md hover:border-[#ffc200]/50 dark:hover:border-[#ffc200]/50 transition-all duration-300"
      >
        {/* Absolute Badges */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-[#ec5b5b] text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm z-10 uppercase shadow-sm">
            -{discount}%
          </span>
        )}
        {product.stock <= 3 && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm z-10 uppercase shadow-sm">
            Stock Limité
          </span>
        )}

        <button 
          onClick={(e) => handleToggleWishlist(e, product.id)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10 ${
            isWished 
              ? 'bg-red-500 text-white' 
              : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200/40 text-slate-400 dark:text-slate-500 hover:text-red-500'
          }`}
        >
          <Heart size={14} fill={isWished ? 'currentColor' : 'none'} />
        </button>

        {/* Product Image */}
        <div className="w-full h-36 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#020617] rounded-xl p-3 mb-4">
          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Content */}
        <div className="flex flex-col flex-1 space-y-1.5">
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">
            {product.category}
          </span>
          <h4 className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight uppercase">
            {product.name}
          </h4>

          {/* Ratings */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={10} 
                className={i < Math.floor(product.rating || 4.2) ? 'text-[#ffc200] fill-[#ffc200]' : 'text-slate-200 dark:text-slate-700'} 
              />
            ))}
            <span className="text-[8px] font-extrabold text-slate-400">({product.reviews_count || 1})</span>
          </div>

          {/* Prices */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
              {product.price.toLocaleString()} <span className="text-[9px]">{settings.currency || 'FCFA'}</span>
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] font-bold text-slate-450 line-through font-mono">
                {product.original_price.toLocaleString()}
              </span>
            )}
          </div>

          {/* Action Button */}
          <button 
            onClick={(e) => handleAddToCart(e, product)}
            className="w-full mt-auto py-2.5 bg-[#ffc200] hover:bg-slate-950 dark:hover:bg-white text-slate-955 hover:text-white dark:hover:text-slate-955 font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors duration-200"
          >
            {t('add_to_cart') || 'Add To Cart'}
          </button>
        </div>
      </div>
    );
  };

  const renderCategories = () => {
    return (
      <div key="categories-row" className="bg-white dark:bg-[#0b1329] border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm py-4 px-6 md:px-12 scroll-smooth select-none overflow-x-auto no-scrollbar flex items-center justify-start md:justify-center gap-6 sm:gap-10">
        {categories.map((cat, idx) => {
          const catImg = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150';
          return (
            <div 
              key={cat.id || idx}
              onClick={() => {
                const event = new CustomEvent('select-category', { detail: cat.name });
                window.dispatchEvent(event);
              }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-slate-200 dark:border-slate-800 p-0.5 group-hover:border-[#ffc200] dark:group-hover:border-[#ffc200] transition-colors overflow-hidden bg-white dark:bg-[#020617] flex items-center justify-center">
                <img 
                  src={catImg} 
                  alt={cat.name} 
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-[#ffc200] transition-colors leading-none mt-0.5">
                {t_smart(cat.name)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHero = (section) => {
    const title = section.title || settings?.bright_hero_title || 'SUMMER 10% SALE';
    const subtitle = section.subtitle || settings?.bright_hero_subtitle || 'Under Favorable Smart Gadgets';
    const image = section.headerImage || settings?.bright_hero_image || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=500';
    const priceText = settings?.bright_hero_price || 'FROM $399.99';
    const promoCode = settings?.bright_hero_promo_code || 'SUMMER10';

    return (
      <div key="hero-slider" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="w-full bg-white dark:bg-[#0b1329] rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/60 overflow-hidden shadow-sm relative grid grid-cols-1 md:grid-cols-2 min-h-[340px] sm:min-h-[460px] p-6 sm:p-12 items-center">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="z-10 space-y-4 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-[#ffc200] text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">
              {t_smart(subtitle)}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none italic">
              {t_smart(title)}
            </h1>
            <p className="text-xs font-black tracking-widest uppercase text-slate-450 dark:text-slate-400">
              {t_smart(priceText)}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="px-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#020617]">
                PROMO CODE : <span className="text-[#ffc200] font-mono">{promoCode}</span>
              </span>
              <button 
                onClick={() => {
                  const event = new CustomEvent('view-all-products');
                  window.dispatchEvent(event);
                }}
                className="px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-955 hover:bg-[#ffc200] dark:hover:bg-[#ffc200] hover:text-slate-955 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                {t('start_shopping') || 'Start Shopping'}
              </button>
            </div>
          </div>

          <div className="relative h-64 sm:h-80 w-full flex items-center justify-center mt-6 md:mt-0">
            <div className="absolute w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-slate-100 dark:bg-[#020617] blur-3xl -z-10" />
            <img 
              src={image} 
              alt={title} 
              className="max-h-full max-w-[85%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPromos = () => {
    return (
      <div key="promo-cards" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Mobiles */}
          <div className="bg-[#4a8bf5] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-white min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[60%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Sale</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">{t_smart(promo1Title)}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{t_smart(promo1Subtitle)}</p>
              <button 
                onClick={() => {
                  const event = new CustomEvent('view-all-products');
                  window.dispatchEvent(event);
                }}
                className="mt-4 px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm"
              >
                {t('shop_now') || 'Shop Now'}
              </button>
            </div>
            <img 
              src={promoImages.mobiles} 
              alt={promo1Title} 
              className="absolute -right-10 -bottom-8 w-44 h-44 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>

          {/* Card 2: Headsets */}
          <div className="bg-[#f0c243] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-slate-950 min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[65%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-950/10 px-2 py-0.5 rounded-full">Flat 15% OFF</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">{t_smart(promo2Title)}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{t_smart(promo2Subtitle)}</p>
              <button 
                onClick={() => {
                  const event = new CustomEvent('view-all-products');
                  window.dispatchEvent(event);
                }}
                className="mt-4 px-4 py-2 bg-slate-955 text-white hover:bg-white hover:text-slate-955 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm"
              >
                {t('shop_now') || 'Shop Now'}
              </button>
            </div>
            <img 
              src={promoImages.headset} 
              alt={promo2Title} 
              className="absolute -right-8 -bottom-4 w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>

          {/* Card 3: Speakers */}
          <div className="bg-[#ec5b5b] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-white min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[65%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">PAGE 10% OFF</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">{t_smart(promo3Title)}</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{t_smart(promo3Subtitle)}</p>
              <button 
                onClick={() => {
                  const event = new CustomEvent('view-all-products');
                  window.dispatchEvent(event);
                }}
                className="mt-4 px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm"
              >
                {t('shop_now') || 'Shop Now'}
              </button>
            </div>
            <img 
              src={promoImages.speakers} 
              alt={promo3Title} 
              className="absolute -right-8 -bottom-4 w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderTabsSection = (section) => {
    const maxProducts = section.maxProducts || 6;
    const cat = section.category || 'All';
    
    // Filter products by category if specified
    const catProducts = cat !== 'All' 
      ? activeProducts.filter(p => p.category === cat) 
      : activeProducts;
      
    const sectionNewArrivals = catProducts.slice(0, maxProducts);
    const sectionBestSellers = catProducts.filter(p => p.rating >= 4.5).slice(0, maxProducts);
    
    const currentTabProducts = activeTab === 'new' ? sectionNewArrivals : sectionBestSellers;

    return (
      <div key="tabs-grid" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('new')}
              className={`text-lg sm:text-2xl font-black uppercase tracking-tight relative pb-4 transition-colors ${
                activeTab === 'new' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              New Arrival Item
              {activeTab === 'new' && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ffc200] rounded-full"
                />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('bestseller')}
              className={`text-lg sm:text-2xl font-black uppercase tracking-tight relative pb-4 transition-colors ${
                activeTab === 'bestseller' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              Best Selling Item
              {activeTab === 'bestseller' && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#ffc200] rounded-full"
                />
              )}
            </button>
          </div>
          
          <button 
            onClick={() => {
              const event = new CustomEvent('view-all-products');
              window.dispatchEvent(event);
            }}
            className="text-[10px] font-black text-slate-850 dark:text-slate-350 uppercase tracking-[0.2em] hover:text-[#ffc200] dark:hover:text-[#ffc200] transition-colors"
          >
            Explore All Item
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {currentTabProducts.map(product => renderProductCard(product))}
        </div>
      </div>
    );
  };

  const renderBillboard = (section) => {
    const title = section.title || settings?.bright_wide_banner_title || 'Get Up To 85% OFF on big billion day 2021';
    const subtitle = section.subtitle || settings?.bright_wide_banner_subtitle || 'Big Saving on Top selling Smartphone';
    const image = section.headerImage || settings?.bright_wide_banner_image || 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=1200';

    return (
      <div key="billboard" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="w-full bg-[#3c4da3] rounded-[1.5rem] p-6 sm:p-12 text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-30 pointer-events-none" />
          
          <div className="z-10 space-y-3 text-center md:text-left md:max-w-[55%]">
            <p className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full inline-block">{t_smart(subtitle)}</p>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none italic">
              {t_smart(title)}
            </h2>
            <button 
              onClick={() => {
                const event = new CustomEvent('view-all-products');
                window.dispatchEvent(event);
              }}
              className="mt-2 px-6 py-3 bg-[#ffc200] hover:bg-white text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              {t('shop_now') || 'Shop Now'}
            </button>
          </div>

          <div className="relative h-44 sm:h-52 w-full md:w-[35%] flex items-center justify-center mt-6 md:mt-0 z-10">
            <img 
              src={image} 
              alt={title} 
              className="max-h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500 rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };
  const renderDealOfDay = (section) => {
    const cat = section.category || 'All';
    const maxProducts = section.maxProducts || 4;
    const catDeals = cat !== 'All' 
      ? dailyDeals.filter(p => p.category === cat) 
      : dailyDeals;
      
    const displayDeals = catDeals.slice(0, maxProducts);

    return (
      <div key="deal-of-the-day" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-4">
        {/* AliExpress Style Super Deals Header Banner */}
        <div className="bg-gradient-to-r from-[#e61e25] via-[#ff2a3b] to-[#ff5238] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-red-500/10 border border-red-500/10">
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-white/10 shadow-sm animate-pulse">
              <Zap size={14} className="text-yellow-300 fill-yellow-300" />
              <span className="font-extrabold text-xs uppercase tracking-widest text-white italic">SuperDeals</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-black text-white/90 uppercase tracking-widest leading-none">Ends in:</span>
              <div className="flex items-center gap-1">
                <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-xs font-mono font-black px-2 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-white font-bold">:</span>
                <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-xs font-mono font-black px-2 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="text-white font-bold">:</span>
                <span className="bg-black/35 backdrop-blur-md text-yellow-300 text-xs font-mono font-black px-2 py-0.5 rounded border border-white/5 shadow-inner">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/deals')}
            className="text-white hover:opacity-85 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-0.5 cursor-pointer self-start sm:self-auto transition-opacity"
          >
            View more <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Swipeable List on Mobile, Grid on Desktop */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-3 pt-1 snap-x snap-mandatory scroll-smooth lg:grid lg:grid-cols-4 lg:gap-6">
          {displayDeals.map(product => {
            const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 25;
            
            const soldCount = product.sold_count || 0;
            const stock = product.stock || 5;
            const totalLimit = soldCount + stock;
            const progressPercent = totalLimit > 0 ? Math.min(100, Math.round((soldCount / totalLimit) * 100)) : 0;

            return (
              <div 
                key={product.id}
                onClick={() => onProductClick(product)}
                className="bg-white dark:bg-[#0b1329] border border-slate-100 dark:border-slate-800/80 rounded-[2rem] p-4 flex flex-col justify-between relative group cursor-pointer shadow-sm hover:shadow-md hover:border-[#e61e25]/30 dark:hover:border-[#e61e25]/30 transition-all duration-300 w-[180px] sm:w-[240px] shrink-0 lg:w-auto lg:shrink snap-start select-none"
              >
                {/* Image Area */}
                <div className="w-full aspect-square bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center p-3 mb-4 relative overflow-hidden border border-slate-100/50 dark:border-slate-800/20 group-hover:scale-[1.01] transition-transform">
                  <span className="absolute top-2.5 left-2.5 bg-[#e61e25] text-white text-[9px] font-black px-2 py-0.5 rounded-lg z-10 shadow-sm uppercase tracking-wider scale-90 sm:scale-100">
                    -{discount}%
                  </span>
                  
                  <img 
                    src={product.image_url || product.image || '/hero-banner.png'} 
                    alt={product.name} 
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info & Details */}
                <div className="space-y-3">
                  <h4 className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1 uppercase tracking-tight leading-tight">
                    {product.name}
                  </h4>

                  {/* Prices */}
                  <div className="flex items-baseline flex-wrap gap-1.5">
                    <span className="text-sm sm:text-base font-black text-[#e61e25] font-mono tracking-tight leading-none">
                      {product.price?.toLocaleString()} <span className="text-[8px] sm:text-[9.5px] uppercase font-black italic">{settings.currency || 'FCFA'}</span>
                    </span>
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 line-through font-mono leading-none">
                        {product.original_price.toLocaleString()}
                      </span>
                    )}
                  </div>

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

                  {/* AliExpress Style Buy now overlay button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product);
                      showToast("Added to cart! 🛒", "success");
                    }}
                    className="w-full py-2 bg-gradient-to-r from-[#e61e25] to-[#ff4f56] hover:brightness-110 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-red-500/10 active:scale-95 cursor-pointer mt-1"
                  >
                    Buy now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPromoBanners = () => {
    return (
      <div key="promo-banners" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
          {[
            { name: 'Handbags', disc: '30-60%', bg: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=250' },
            { name: 'Women\'s Wear', disc: '40-80%', bg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250' },
            { name: 'Men\'s Wear', disc: '40-80%', bg: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=250' },
            { name: 'Sportswear', disc: '30-60%', bg: 'https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=250' },
            { name: 'Beauty', disc: 'Up to 50%', bg: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=250' },
          ].map((item, idx) => (
            <div 
              key={idx}
              className="group h-36 rounded-2xl overflow-hidden relative shadow-sm border border-slate-200/40 dark:border-slate-800/40 cursor-pointer"
            >
              {/* Background Cover */}
              <img 
                src={item.bg} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              {/* Info content */}
              <div className="absolute bottom-4 left-4 text-white space-y-0.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider opacity-90">{item.name}</h4>
                <p className="text-xs font-black text-[#ffc200] font-mono">{item.disc} OFF</p>
              </div>

              {/* Float play indicator arrow */}
              <div className="absolute top-3 right-3 w-6 h-6 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={8} className="fill-white translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTrustBadges = () => {
    return (
      <div key="trust-badges" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white dark:bg-[#0b1329] border border-slate-200/50 dark:border-slate-800/60 rounded-[1.5rem] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffc200]/10 text-[#ffc200] flex items-center justify-center shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none mb-1">Easy buy & return</h5>
              <p className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Simple return policies</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffc200]/10 text-[#ffc200] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none mb-1">Secure Payments</h5>
              <p className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">100% payment security</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffc200]/10 text-[#ffc200] flex items-center justify-center shrink-0">
              <Headphones size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none mb-1">24/7 Support</h5>
              <p className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Help desk open all hours</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#ffc200]/10 text-[#ffc200] flex items-center justify-center shrink-0">
              <Smartphone size={20} />
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none mb-1">Shop with our App</h5>
              <p className="text-[8px] font-bold text-slate-450 uppercase tracking-wider">Download app & get offers</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBrightCustomSection = (section) => {
    const isDual = section.isDual === true || section.isDual === 1 || section.isDual === 'true';
    if (isDual) {
      const displayTitleA = section.subtitle || section.category || 'Side A';
      const displayTitleB = section.titleB || section.categoryB || 'Side B';
      
      const productsA = (section.category && section.category !== 'All' 
        ? activeProducts.filter(p => p.category === section.category) 
        : activeProducts).slice(0, 4);

      const productsB = (section.categoryB && section.categoryB !== 'All' 
        ? activeProducts.filter(p => p.category === section.categoryB) 
        : activeProducts).slice(0, 4);

      return (
        <div key={section.id || `custom-dual-${section.position}`} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Side A */}
          <div className="bg-white dark:bg-[#0b1329] border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
            {renderBrightHeader(displayTitleA, null, { headerStyle: section.headerStyle, showViewAll: section.showViewAll !== false }, null, true)}
            <div className="grid grid-cols-2 gap-4">
              {productsA.map(p => renderProductCard(p))}
            </div>
          </div>

          {/* Side B */}
          <div className="bg-white dark:bg-[#0b1329] border border-slate-200/50 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm space-y-4">
            {renderBrightHeader(displayTitleB, null, { headerStyle: section.headerStyleB || 'bright_outlined', showViewAll: section.showViewAll !== false }, null, true)}
            <div className="grid grid-cols-2 gap-4">
              {productsB.map(p => renderProductCard(p))}
            </div>
          </div>
        </div>
      );
    }

    // Single custom grid layout
    const cat = section.category || 'All';
    const maxProducts = section.maxProducts || 6;
    const title = section.title || (cat !== 'All' ? cat : 'Featured Products');
    const subtitle = section.subtitle || 'Recommended for you';

    const catProducts = cat !== 'All' 
      ? activeProducts.filter(p => p.category === cat) 
      : activeProducts;

    const displayProducts = catProducts.slice(0, maxProducts);

    return (
      <div key={section.id || `custom-grid-${section.position}`} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {renderBrightHeader(title, subtitle, section)}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {displayProducts.map(p => renderProductCard(p))}
        </div>
      </div>
    );
  };

  const renderBrightFeaturedSection = (section) => {
    const cat = section.category || 'All';
    const maxProducts = section.maxProducts || 6;
    const title = section.title || (cat !== 'All' ? `${t('featured')} ${cat}` : t('featured_items') || 'Featured Products');
    const subtitle = section.subtitle || t('curated_for_you') || 'Curated For You';

    const featuredProducts = activeProducts.filter(p => Number(p.is_featured) === 1 || p.is_featured === true);
    const catProducts = cat !== 'All' 
      ? featuredProducts.filter(p => p.category === cat) 
      : featuredProducts;

    const displayProducts = catProducts.slice(0, maxProducts);

    return (
      <div key={section.id || `featured-grid-${section.position}`} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {renderBrightHeader(title, subtitle, section)}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {displayProducts.map(p => renderProductCard(p))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-450 text-xs font-bold uppercase tracking-wider bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
            No Featured Products Found
          </div>
        )}
      </div>
    );
  };

  const renderBrightTrendingSection = (section) => {
    const cat = section.category || 'All';
    const maxProducts = section.maxProducts || 6;
    const title = section.title || (cat !== 'All' ? `${t('trending')} ${cat}` : t('trending') || 'Trending Products');
    const subtitle = section.subtitle || t('most_popular_on_our_network') || 'Popular Right Now';

    const trendingProducts = activeProducts.filter(p => Number(p.is_trending) === 1 || p.is_trending === true);
    const catProducts = cat !== 'All' 
      ? trendingProducts.filter(p => p.category === cat) 
      : trendingProducts;

    const displayProducts = catProducts.slice(0, maxProducts);

    return (
      <div key={section.id || `trending-grid-${section.position}`} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {renderBrightHeader(title, subtitle, section)}
        {displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {displayProducts.map(p => renderProductCard(p))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-450 text-xs font-bold uppercase tracking-wider bg-white dark:bg-[#0b1329] rounded-2xl border border-slate-200/50 dark:border-slate-800/60">
            No Trending Products Found
          </div>
        )}
      </div>
    );
  };

  const renderSection = (section, idx) => {
    switch (section.role) {
      case 'bright_categories':
        return renderCategories();
      case 'bright_hero':
        return renderHero(section);
      case 'bright_promos':
        return renderPromos();
      case 'bright_tabs':
        return renderTabsSection(section);
      case 'bright_billboard':
        return renderBillboard(section);
      case 'bright_dealOfDay':
        return renderDealOfDay(section);
      case 'bright_featured':
        return renderBrightFeaturedSection(section);
      case 'bright_trending':
        return renderBrightTrendingSection(section);
      case 'bright_promo_banners':
        return renderPromoBanners();
      case 'bright_trust_badges':
        return renderTrustBadges();
      case 'bright_custom':
      default:
        return renderBrightCustomSection(section);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#020617] transition-colors duration-500 pb-20">
      {brightSections.map((section, idx) => {
        const isEnabled = section.isActive !== false && section.enabled !== false && section.is_active !== false;
        if (!isEnabled) return null;
        return renderSection(section, idx);
      })}
    </div>
  );
}
