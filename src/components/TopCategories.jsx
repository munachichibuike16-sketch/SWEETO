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
      return 'from-eas-blue/15 to-eas-blue/25 border-eas-blue/30 text-eas-blue dark:text-blue-400';
    }
    if (lowerName.includes('laptop') || lowerName.includes('computer') || lowerName.includes('macbook') || lowerName.includes('pc')) {
      return 'from-purple-500/25 to-indigo-500/25 border-purple-500/30 text-purple-500 dark:text-purple-400';
    }
    if (lowerName.includes('tv') || lowerName.includes('screen') || lowerName.includes('monitor') || lowerName.includes('cinema')) {
      return 'from-eas-blue/15 to-eas-blue/25 border-eas-blue/30 text-eas-blue dark:text-blue-400';
    }
    if (lowerName.includes('watch') || lowerName.includes('wearable')) {
      return 'from-amber-500/25 to-orange-500/25 border-amber-500/30 text-amber-500 dark:text-amber-400';
    }
    if (lowerName.includes('speaker') || lowerName.includes('audio') || lowerName.includes('sonor')) {
      return 'from-emerald-500/25 to-teal-500/25 border-emerald-500/30 text-emerald-500 dark:text-emerald-400';
    }
    if (lowerName.includes('earbud') || lowerName.includes('headphone') || lowerName.includes('airpod') || lowerName.includes('pods')) {
      return 'from-eas-blue/15 to-eas-blue/25 border-eas-blue/30 text-eas-blue dark:text-blue-400';
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

  const getProductCountForCategory = (catName) => {
    let count = products?.filter(p => p.category === catName && p.status === 'active').length || 0;
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      const subcats = categories.filter(c => c.parent_id === cat.id);
      subcats.forEach(sub => {
        count += products?.filter(p => p.category === sub.name && p.status === 'active').length || 0;
      });
    }
    return count;
  };

  const list = (categories.length > 0 ? categories : defaultCategories).filter(cat => getProductCountForCategory(cat.name) > 0);

  if (list.length === 0) return null;

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
    <section className="max-w-[1600px] mx-auto px-4 md:px-8 pt-0 pb-0 relative overflow-hidden select-none">
      {/* Centered Premium Header */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        {/* Soft Background Neon Backglow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-eas-blue/10 dark:bg-eas-blue/5 blur-[100px] rounded-full pointer-events-none" />

        {/* Futuristic Bold Centered Title */}
        <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-center relative text-slate-900 dark:text-white">
          {t('our_top_categories') || 'Our Top Categories'}
        </h2>

        {/* Subtitle with centered decorative line */}
        <div className="flex items-center gap-4 mt-3 w-full max-w-2xl px-4">
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
          className="absolute -left-1.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-lg text-slate-700 dark:text-slate-300 hover:text-eas-blue dark:hover:text-eas-blue hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-black/5"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>

        {/* Categories Horizontal Scrolling Row */}
        <div 
          ref={scrollRef}
          className="flex flex-nowrap gap-3 md:gap-6 overflow-x-auto no-scrollbar py-6 px-4 md:px-2 snap-x snap-mandatory scroll-smooth w-full"
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
                className="flex flex-col justify-between shrink-0 snap-center p-4 bg-slate-50 dark:bg-[#020617] border border-slate-200/50 dark:border-slate-800/60 rounded-xl shadow-sm hover:shadow-md hover:border-eas-blue/40 dark:hover:border-eas-blue/40 transition-all duration-300 min-w-[130px] max-w-[130px] h-[160px] sm:min-w-[170px] sm:max-w-[170px] sm:h-[210px] overflow-hidden group select-none relative cursor-pointer"
              >
                {/* Top Title & Item Count Label */}
                <div className="text-left w-full z-10 flex flex-col">
                  <span className="text-[10px] sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider group-hover:text-eas-blue dark:group-hover:text-eas-blue transition-colors block truncate max-w-full leading-tight">
                    {t_smart(cat.name)}
                  </span>
                  <span className="text-[7.5px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                    {productCount} {productCount === 1 ? t('item') || 'item' : t('items') || 'items'}
                  </span>
                </div>

                {/* Bottom Image Frame with Ambient Glow */}
                <div className="relative w-full flex-1 mt-2 flex items-center justify-end overflow-hidden">
                  {/* Glowing Ambient Lightspot behind the image */}
                  <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-gradient-to-tr ${colorsArray[0]} ${colorsArray[1]} opacity-20 dark:opacity-35 blur-xl rounded-full z-0 group-hover:opacity-40 transition-opacity`} />
                  
                  {/* Category Cutout Image */}
                  <img 
                    src={imageUrl} 
                    alt={cat.name} 
                    className="w-[85%] h-[85%] sm:w-[90%] sm:h-[90%] object-contain group-hover:scale-110 transition-transform duration-700 ease-out z-10 filter drop-shadow-md dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)] self-end"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=300'; }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Floating Scroll Button - Translucent circle suitable for Android touch & desktop hover */}
        <button 
          onClick={() => scroll('right')}
          className="absolute -right-1.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 md:w-11 md:h-11 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 shadow-lg text-slate-700 dark:text-slate-300 hover:text-eas-blue dark:hover:text-eas-blue hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-black/5"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
        </button>
      </div>
    </section>
  );
}
