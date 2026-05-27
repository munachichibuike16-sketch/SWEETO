import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function TopCategories() {
  const navigate = useNavigate();
  const { categories = [], products = [], setSelectedCategory, setSelectedBrand, setSearchQuery } = useStore();
  const { t, t_smart } = useLanguage();
  const scrollRef = useRef(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);

  // Fallback defaults if no categories exist in store yet
  const defaultCategories = [
    { id: '1', name: 'SmartTV' },
    { id: '2', name: 'Speaker' },
    { id: '3', name: 'Tablets' },
    { id: '4', name: 'Airpods' },
    { id: '5', name: 'Smartwatches' },
    { id: '6', name: 'Smart Phones' },
    { id: '7', name: 'Headphones' },
    { id: '8', name: 'Laptops' },
    { id: '9', name: 'Bluetooth' }
  ];

  // Resolve category colors for high-end luxury feel
  const getCategoryColor = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('smart')) {
      return 'from-blue-500/25 to-cyan-500/25 border-blue-500/30 text-blue-500 dark:text-cyan-400';
    }
    if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('macbook') || lowerName.includes('pc')) {
      return 'from-purple-500/25 to-indigo-500/25 border-purple-500/30 text-purple-500 dark:text-purple-400';
    }
    if (lowerName.includes('tv') || lowerName.includes('screen') || lowerName.includes('monitor') || lowerName.includes('cinema')) {
      return 'from-rose-500/25 to-red-500/25 border-rose-500/30 text-rose-500 dark:text-rose-400';
    }
    if (lowerName.includes('watch') || lowerName.includes('wearable')) {
      return 'from-amber-500/25 to-orange-500/25 border-amber-500/30 text-amber-500 dark:text-amber-400';
    }
    if (lowerName.includes('speaker') || lowerName.includes('audio') || lowerName.includes('sonor')) {
      return 'from-emerald-500/25 to-teal-500/25 border-emerald-500/30 text-emerald-500 dark:text-emerald-400';
    }
    if (lowerName.includes('earbud') || lowerName.includes('headphone') || lowerName.includes('airpod') || lowerName.includes('pods')) {
      return 'from-cyan-500/25 to-blue-500/25 border-cyan-500/30 text-cyan-500 dark:text-cyan-300';
    }
    return 'from-indigo-500/25 to-violet-500/25 border-indigo-500/30 text-indigo-500 dark:text-indigo-400';
  };

  // Resolve category images: always prioritize user custom images from database
  const getCategoryImage = (name, customUrl) => {
    if (customUrl) return customUrl;
    
    // final fallback only if no custom category image is available
    const lowerName = name.toLowerCase();
    if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('macbook') || lowerName.includes('pc')) {
      return 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('headphone') || lowerName.includes('headset')) {
      return 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('ram') || lowerName.includes('memory') || lowerName.includes('component') || lowerName.includes('ddr')) {
      return 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('earbud') || lowerName.includes('buds') || lowerName.includes('airpod') || lowerName.includes('pod') || lowerName.includes('earphone')) {
      return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('remote') || lowerName.includes('controller') || lowerName.includes('gamepad')) {
      return 'https://images.unsplash.com/photo-1552975084-6e027cd345c2?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('fan') || lowerName.includes('cooler') || lowerName.includes('cooling') || lowerName.includes('ventil')) {
      return 'https://images.unsplash.com/photo-1618944847828-82e943c3dba7?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('keyboard') || lowerName.includes('clavier')) {
      return 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('drive') || lowerName.includes('stockage') || lowerName.includes('ssd') || lowerName.includes('hdd') || lowerName.includes('disk') || lowerName.includes('usb') || lowerName.includes('stock')) {
      return 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('tv') || lowerName.includes('television') || lowerName.includes('screen') || lowerName.includes('monitor')) {
      return 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('speaker') || lowerName.includes('audio') || lowerName.includes('sonor') || lowerName.includes('enceinte')) {
      return 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('watch') || lowerName.includes('wearable') || lowerName.includes('smartwatch')) {
      return 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('phone') || lowerName.includes('mobile') || lowerName.includes('smartphone') || lowerName.includes('iphone')) {
      return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('tablet') || lowerName.includes('ipad') || lowerName.includes('tablette')) {
      return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=300';
    }
    if (lowerName.includes('accessory') || lowerName.includes('cable') || lowerName.includes('charger')) {
      return 'https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&q=80&w=300';
    }

    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300';
  };

  const list = categories.length > 0 ? categories : defaultCategories;

  const handleSelect = (categoryName) => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSearchQuery('');
    navigate(`/category/${encodeURIComponent(categoryName)}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - 240 : scrollLeft + 240;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 relative overflow-hidden">
      {/* Centered Premium Header */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        {/* Soft Background Neon Backglow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-eas-blue/10 dark:bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Futuristic Bold Centered Title */}
        <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.25em] text-center italic relative">
          <span className="bg-gradient-to-r from-eas-blue via-indigo-600 to-eas-blue dark:from-white dark:via-cyan-400 dark:to-white bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(59,130,246,0.25)]">
            {t('our_top_categories') || 'Our Top Categories'}
          </span>
        </h2>

        {/* Subtitle with centered decorative line */}
        <div className="flex items-center gap-4 mt-4 w-full max-w-2xl px-4">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200/80 dark:via-slate-800/80 to-transparent" />
          <p className="text-[8px] md:text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest text-center whitespace-normal md:whitespace-nowrap">
            {t('explore_curated') || 'Explore curated products by premium departments'}
          </p>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200/80 dark:via-slate-800/80 to-transparent" />
        </div>
      </div>

      {/* Carousel Container with Absolute Side Gutters Padding for Non-Overlapping Slide Buttons */}
      <div className="relative px-0 md:px-16 group/carousel">
        {/* Left Floating Scroll Button - Translucent circle suitable for Android touch & desktop hover */}
        <button 
          onClick={() => scroll('left')}
          className="absolute -left-1.5 sm:left-4 top-[38%] -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-lg text-slate-700 dark:text-slate-300 hover:text-eas-blue dark:hover:text-cyan-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-black/5"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>

        {/* Categories Horizontal Scrolling Row */}
        <div 
          ref={scrollRef}
          className="flex flex-nowrap gap-2 md:gap-8 overflow-x-auto no-scrollbar py-6 px-4 md:px-2 snap-x snap-mandatory scroll-smooth w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {list.map((cat, idx) => {
            const productCount = products.filter(p => p.category === cat.name && p.status !== 'draft').length;
            const imageUrl = getCategoryImage(cat.name, cat.image_url);
            const colorClass = getCategoryColor(cat.name);
            const colorsArray = colorClass.split(' ');

            return (
              <motion.div
                key={cat.id || idx}
                onClick={() => handleSelect(cat.name)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex flex-col items-center group cursor-pointer shrink-0 snap-center px-0.5 min-w-[calc((100%-16px)/3)] max-w-[calc((100%-16px)/3)] sm:min-w-[130px] sm:max-w-none"
              >
                {/* Premium Squircle Card Frame Container */}
                <div className="relative w-full aspect-square sm:w-[130px] sm:h-[130px] rounded-full sm:rounded-[2.2rem] p-1 bg-gradient-to-tr from-slate-100 to-white dark:from-slate-900 dark:to-[#0e172a] border border-slate-200/50 dark:border-white/5 shadow-lg transition-all duration-500 hover:scale-105 active:scale-95 group-hover:shadow-[0_15px_30px_rgba(0,0,0,0.15)] dark:group-hover:border-slate-700 flex items-center justify-center overflow-hidden">
                  
                  {/* Glowing Ambient Lightspot behind the image */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${colorsArray[0]} ${colorsArray[1]} opacity-20 dark:opacity-35 blur-md rounded-full transition-opacity group-hover:opacity-40`} />

                  {/* Inner Styled Circular Image Frame */}
                  <img 
                    src={imageUrl} 
                    alt={cat.name} 
                    className="w-[86%] h-[86%] object-cover rounded-full sm:rounded-[1.8rem] border border-white/40 dark:border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-700 ease-out z-10"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'; }}
                  />
                  
                  {/* Subtle Colored Outer Rotating Halo Ring */}
                  <div className={`absolute inset-0.5 rounded-full sm:rounded-[2.1rem] border-2 border-dashed ${colorsArray[2]} opacity-45 group-hover:rotate-45 transition-transform duration-1000 z-0`} />
                </div>

                {/* Title & Item Count Label */}
                <div className="text-center w-full mt-3">
                  <span className="text-[9px] sm:text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider group-hover:text-eas-blue dark:group-hover:text-cyan-400 transition-colors block truncate max-w-full px-1 italic">
                    {t_smart(cat.name)}
                  </span>
                  
                  {/* High-tech pill badge for item count */}
                  <div className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/30 dark:border-slate-800/80 transition-colors group-hover:bg-eas-blue/10 dark:group-hover:bg-cyan-950/30">
                    <span className={`text-[7px] sm:text-[8px] font-extrabold uppercase tracking-widest transition-colors ${colorsArray[3] || 'text-slate-400 dark:text-slate-500'}`}>
                      {productCount} {productCount === 1 ? t('item') || 'item' : t('items') || 'items'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Floating Scroll Button - Translucent circle suitable for Android touch & desktop hover */}
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-1.5 sm:right-4 top-[38%] -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-lg text-slate-700 dark:text-slate-300 hover:text-eas-blue dark:hover:text-cyan-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-black/5"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>
      </div>
    </section>
  );
}
