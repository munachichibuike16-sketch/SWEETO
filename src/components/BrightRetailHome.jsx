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

export default function BrightRetailHome({ onProductClick }) {
  const { products, categories, settings } = useStore();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { t, lang, t_smart } = useLanguage();
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
  const featuredProducts = activeProducts.filter(p => p.is_featured);
  const dailyDeals = activeProducts.filter(p => p.is_daily_deal || (p.original_price && p.original_price > p.price));
  const newArrivals = activeProducts.slice(0, 6);
  const bestSellers = activeProducts.filter(p => p.rating >= 4.5).slice(0, 6);

  const displayList = activeTab === 'new' ? newArrivals : bestSellers;

  // Static mock images for promotions as shown in the template
  const promoImages = {
    mobiles: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
    headset: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    speakers: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400',
    banner: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=1200',
  };

  const handleToggleWishlist = (e, productId) => {
    e.stopPropagation();
    toggleWishlist(productId);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart(product);
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#020617] transition-colors duration-500 pb-20">
      {/* ─── 1. CIRCULAR OUTLINED CATEGORY ROW ─── */}
      <div className="bg-white dark:bg-[#0b1329] border-b border-slate-200/60 dark:border-slate-800/60 shadow-sm py-4 px-6 md:px-12 scroll-smooth select-none overflow-x-auto no-scrollbar flex items-center justify-start md:justify-center gap-6 sm:gap-10">
        {categories.map((cat, idx) => {
          const catImg = cat.image_url || cat.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150';
          return (
            <div 
              key={cat.id || idx}
              onClick={() => {
                // Trigger filter selection by navigating or calling hooks
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

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* ─── 2. HERO SLIDER (HEXAGONAL PATTERN ACCENTED) ─── */}
        <div className="w-full bg-white dark:bg-[#0b1329] rounded-[1.5rem] border border-slate-200/50 dark:border-slate-800/60 overflow-hidden shadow-sm relative grid grid-cols-1 md:grid-cols-2 min-h-[340px] sm:min-h-[460px] p-6 sm:p-12 items-center">
          {/* Hexagonal grid absolute overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          {/* Left Text */}
          <div className="z-10 space-y-4 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-[#ffc200] text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">
              Under Favorable Smart Gadgets
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none italic">
              SUMMER <span className="text-[#ffc200]">10%</span> SALE
            </h1>
            <p className="text-xs font-black tracking-widest uppercase text-slate-400">
              FROM <span className="text-xl font-mono text-slate-950 dark:text-white font-extrabold">$399.99</span>
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <span className="px-4 py-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#020617]">
                PROMO CODE : <span className="text-[#ffc200] font-mono">SUMMER10</span>
              </span>
              <button 
                onClick={() => {
                  const event = new CustomEvent('view-all-products');
                  window.dispatchEvent(event);
                }}
                className="px-6 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-[#ffc200] dark:hover:bg-[#ffc200] hover:text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
              >
                Start Shopping
              </button>
            </div>
          </div>

          {/* Right Product Graphic */}
          <div className="relative h-64 sm:h-80 w-full flex items-center justify-center mt-6 md:mt-0">
            <div className="absolute w-48 h-48 sm:w-72 sm:h-72 rounded-full bg-slate-100 dark:bg-[#020617] blur-3xl -z-10" />
            <img 
              src="https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=500" 
              alt="Summer Sale gadget" 
              className="max-h-full max-w-[85%] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>

        {/* ─── 3. THREE-COLUMN GRID PROMO CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Mobiles */}
          <div className="bg-[#4a8bf5] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-white min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[60%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">Sale</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">Smart Mobiles</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Discover Trends</p>
              <button className="mt-4 px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm">Shop Now</button>
            </div>
            <img 
              src={promoImages.mobiles} 
              alt="Smart Mobiles" 
              className="absolute -right-10 -bottom-8 w-44 h-44 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>

          {/* Card 2: Headsets */}
          <div className="bg-[#f0c243] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-slate-950 min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[65%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-950/10 px-2 py-0.5 rounded-full">Flat 15% OFF</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">Smart Headset</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Hi-Fi Audio Experience</p>
              <button className="mt-4 px-4 py-2 bg-slate-950 text-white hover:bg-white hover:text-slate-900 text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm">Shop Now</button>
            </div>
            <img 
              src={promoImages.headset} 
              alt="Smart Headset" 
              className="absolute -right-8 -bottom-4 w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>

          {/* Card 3: Speakers */}
          <div className="bg-[#ec5b5b] rounded-2xl p-6 sm:p-8 flex flex-col justify-between text-white min-h-[190px] relative overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="z-10 space-y-1.5 max-w-[65%]">
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">PAGE 10% OFF</span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight">Portable Speaker</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Bluetooth Waterproof</p>
              <button className="mt-4 px-4 py-2 bg-white text-slate-900 hover:bg-slate-900 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-colors shadow-sm">Shop Now</button>
            </div>
            <img 
              src={promoImages.speakers} 
              alt="Portable Speaker" 
              className="absolute -right-8 -bottom-4 w-40 h-40 object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-lg"
            />
          </div>
        </div>

        {/* ─── 4. TABS & NEW ARRIVALS GRID ─── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setActiveTab('new')}
                className={`text-lg sm:text-2xl font-black uppercase tracking-tight relative pb-4 transition-colors ${
                  activeTab === 'new' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-650'
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
                  activeTab === 'bestseller' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-650'
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
            {displayList.map(product => {
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
                        <span className="text-[10px] font-bold text-slate-400 line-through font-mono">
                          {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className="w-full mt-auto py-2.5 bg-[#ffc200] hover:bg-slate-950 dark:hover:bg-white text-slate-950 hover:text-white dark:hover:text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-lg transition-colors duration-200"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 5. WIDE DISCOUNT SAVINGS BILLBOARD BANNER ─── */}
        <div className="w-full bg-[#3c4da3] rounded-[1.5rem] p-6 sm:p-12 text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 opacity-30 pointer-events-none" />
          
          <div className="z-10 space-y-3 text-center md:text-left md:max-w-[55%]">
            <p className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-full inline-block">Big Saving on Top selling Smartphone</p>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight leading-none italic">
              Get Up To <span className="text-[#ffc200]">85% OFF</span> on big billion day 2021
            </h2>
            <button 
              onClick={() => {
                const event = new CustomEvent('view-all-products');
                window.dispatchEvent(event);
              }}
              className="mt-2 px-6 py-3 bg-[#ffc200] hover:bg-white text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
            >
              Shop Now
            </button>
          </div>

          <div className="relative h-44 sm:h-52 w-full md:w-[35%] flex items-center justify-center mt-6 md:mt-0 z-10">
            <img 
              src={promoImages.banner} 
              alt="Deal mobile devices" 
              className="max-h-full object-contain filter drop-shadow-2xl hover:scale-105 transition-transform duration-500 rounded-lg"
            />
          </div>
        </div>

        {/* ─── 6. DEAL OF THE DAY COUNTDOWN ROW ─── */}
        <div className="space-y-6">
          <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Zap size={20} fill="#ffc200" className="text-[#ffc200]" /> Deal Of The Day
              </h2>
              
              {/* Countdown Ticker */}
              <div className="flex items-center gap-1.5 text-xs font-black text-white bg-slate-950 dark:bg-slate-800 px-3 py-1 rounded-lg">
                <span className="text-[8px] text-slate-400 uppercase tracking-wider mr-1.5">Ends In :</span>
                <span className="font-mono text-[#ffc200]">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="opacity-50">:</span>
                <span className="font-mono text-[#ffc200]">{String(timeLeft.minutes).padStart(2, '0')}</span>
                <span className="opacity-50">:</span>
                <span className="font-mono text-[#ffc200]">{String(timeLeft.seconds).padStart(2, '0')}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dailyDeals.slice(0, 3).map(product => {
              const discount = product.original_price ? Math.round(((product.original_price - product.price) / product.original_price) * 100) : 25;
              
              // Mock progress bar parameters
              const hashId = String(product.id).charCodeAt(0) || 0;
              const totalLimit = 15 + (hashId % 10);
              const soldCount = Math.max(2, totalLimit - (product.stock || 8));
              const progressPercent = Math.min(100, Math.round((soldCount / totalLimit) * 100));

              return (
                <div 
                  key={product.id}
                  onClick={() => onProductClick(product)}
                  className="bg-white dark:bg-[#0b1329] border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 sm:p-5 flex items-center gap-4 group cursor-pointer shadow-sm hover:shadow-md hover:border-[#ffc200]/50 transition-all duration-300"
                >
                  {/* Left Column Image */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center bg-slate-50 dark:bg-[#020617] rounded-xl p-2 shrink-0 relative">
                    <span className="absolute top-1.5 left-1.5 bg-[#ec5b5b] text-white text-[7px] font-black px-1 py-0.5 rounded-sm z-10 uppercase">
                      -{discount}%
                    </span>
                    <img 
                      src={product.image_url || product.image || '/hero-banner.png'} 
                      alt={product.name} 
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Right Column Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 truncate uppercase">
                      {product.name}
                    </h4>

                    {/* Ratings */}
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={9} 
                          className={i < Math.floor(product.rating || 4.2) ? 'text-[#ffc200] fill-[#ffc200]' : 'text-slate-200 dark:text-slate-700'} 
                        />
                      ))}
                    </div>

                    {/* Prices */}
                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono">
                        {product.price.toLocaleString()} <span className="text-[9px]">{settings.currency || 'FCFA'}</span>
                      </span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-[9px] font-bold text-slate-400 line-through font-mono">
                          {product.original_price.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Sales Progress Indicator */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[8px] font-black text-slate-450 uppercase tracking-wider leading-none">
                        <span>Sold: {soldCount} / {totalLimit}</span>
                        <span className="text-slate-600 dark:text-slate-350">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#ffc200] rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={(e) => handleAddToCart(e, product)}
                      className="w-full py-1.5 bg-[#ffc200] hover:bg-slate-950 dark:hover:bg-white text-slate-950 hover:text-white dark:hover:text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-md transition-colors"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 7. BOTTOM CATEGORY PROMO BANNERS (5 items) ─── */}
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

        {/* ─── 8. BOTTOM TRUST BADGES ROW ─── */}
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
    </div>
  );
}
