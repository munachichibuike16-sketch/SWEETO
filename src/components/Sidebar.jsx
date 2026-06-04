import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Box, Sparkles, ChevronRight, Globe,
  Smartphone, Laptop, Headphones, Watch, Gamepad2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { playSound } from '../utils/sound';

const Sidebar = ({ isOpen, onClose, onCategorySelect, activeCategory, embedded = false, products = [] }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('filter'); // Default to Categories tab like the screenshot
  const { categories, settings, brands = [], selectedBrand, setSelectedBrand, setSelectedCategory, setSearchQuery, products: storeProducts = [] } = useStore();
  const { lang, changeLanguage, t, t_smart, isRTL } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isLangExpanded, setIsLangExpanded] = useState(false);

  const handleBrandSelect = (brandName) => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSelectedBrand(brandName === selectedBrand ? null : brandName);
    navigate('/');
    onClose();
  };

  // Touch Swipe-to-Close Gestures
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchEnd.x - touchStart.x;
    const distanceY = touchEnd.y - touchStart.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);
    if (isHorizontalSwipe) {
      if (isRTL) {
        if (distanceX > minSwipeDistance) onClose();
      } else {
        if (distanceX < -minSwipeDistance) onClose();
      }
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ar', name: 'العربية' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ru', name: 'Русский' }
  ];

  useEffect(() => {
    if (isOpen && !embedded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, embedded]);

  const toggleExpand = (catId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const getCategoryIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('laptop')) return Laptop;
    if (lowerName.includes('phone') || lowerName.includes('mobile')) return Smartphone;
    if (lowerName.includes('audio') || lowerName.includes('headphone')) return Headphones;
    if (lowerName.includes('game') || lowerName.includes('console')) return Gamepad2;
    if (lowerName.includes('watch') || lowerName.includes('wear')) return Watch;
    return Box;
  };

  const getProductCountForCategory = (catName) => {
    const activeProds = products?.length > 0 ? products : storeProducts;
    let count = activeProds.filter(p => p.category === catName && p.status === 'active').length;
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      const subcats = categories.filter(c => c.parent_id === cat.id);
      subcats.forEach(sub => {
        count += activeProds.filter(p => p.category === sub.name && p.status === 'active').length;
      });
    }
    return count;
  };

  // Group categories into parent-child hierarchy
  const parentCategories = categories.filter(cat => !cat.parent_id && getProductCountForCategory(cat.name) > 0);
  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId && (products?.length > 0 ? products : storeProducts).filter(p => p.category === cat.name && p.status === 'active').length > 0);
  };

  // Embedded view for Homepage grid cards ("Shop by Department")
  if (embedded) {
    const displayCategories = categories
      .filter(cat => !cat.parent_id && getProductCountForCategory(cat.name) > 0) // Only show parent departments on storefront grid with active products
      .map(cat => ({
        ...cat,
        icon: getCategoryIcon(cat.name),
        count: getProductCountForCategory(cat.name)
      }));

    return (
      <section className="py-16">
        <div className="flex flex-col gap-12">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20"></div>
                <div className="relative w-14 h-14 bg-slate-900 dark:bg-white rounded-[1.8rem] flex items-center justify-center shadow-2xl">
                    <Box className="text-white dark:text-slate-900" size={28} />
                </div>
              </div>
              <div>
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                    {t('shop_by')} <span className="text-blue-600">{t('department_core')}</span>
                 </h2>
                 <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
                    <Sparkles size={12} className="text-blue-500" />
                    {t('discover_gear')}
                 </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {displayCategories.map((cat, i) => (
                <motion.div
                  key={cat.id || i}
                  whileHover={{ y: -12 }}
                  onClick={() => onCategorySelect(cat.name)}
                  className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-10 rounded-[3.5rem] border border-white dark:border-slate-800 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer group flex flex-col items-center text-center gap-6"
                >
                  <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6 group-hover:shadow-2xl group-hover:shadow-blue-500/30">
                     {cat.icon ? <cat.icon size={36} strokeWidth={1.5} /> : <Box size={36} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase italic tracking-tight text-base mb-1">{t_smart(cat.name)}</h3>
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                       <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{cat.count || 0} {t('products')}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed top-[var(--header-height,72px)] bottom-0 left-0 right-0 bg-slate-950/60 backdrop-blur-6 z-[200] cursor-zoom-out"
          />

          {/* Drawer Panel */}
          <motion.aside 
            initial={{ x: isRTL ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '100%' : '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className={`fixed top-[var(--header-height,72px)] ${isRTL ? 'right-0' : 'left-0'} h-[calc(100vh-var(--header-height,72px))] w-full max-w-[320px] sm:max-w-[360px] bg-white dark:bg-slate-900 shadow-[20px_0_50px_rgba(0,0,0,0.15)] z-[210] overflow-hidden flex flex-col border-r border-slate-100 dark:border-slate-800/60`}
          >
            {/* Faint Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
              <span className="text-[5rem] sm:text-[6rem] font-black tracking-[0.2em] text-slate-900/[0.02] dark:text-white/[0.01] uppercase italic -rotate-12">
                @sweeto
              </span>
            </div>

            {/* Custom Tab Header (Stretches full width) */}
            <div className="w-full h-14 shrink-0 bg-[#f5f5f5] dark:bg-slate-800 flex items-stretch border-b border-slate-200 dark:border-slate-700 relative z-10">
              <button 
                onClick={() => { playSound('click'); setActiveTab('filter'); }}
                className={`flex-1 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all cursor-pointer ${
                  activeTab === 'filter' 
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-red-600' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                {t('categories') || 'Categories'}
              </button>
              <button 
                onClick={() => { playSound('click'); setActiveTab('brands'); }}
                className={`flex-1 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all cursor-pointer ${
                  activeTab === 'brands' 
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-red-600' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                {t('partner_brands') || 'Brands'}
              </button>
              <button 
                onClick={() => { playSound('click'); setActiveTab('menu'); }}
                className={`flex-1 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all cursor-pointer ${
                  activeTab === 'menu' 
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-red-600' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                Menu
              </button>
            </div>

            {/* Scrollable Categories List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 pb-24">
              <AnimatePresence mode="wait">
                {activeTab === 'filter' && (
                  <motion.div
                    key="categories-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800"
                  >
                    {parentCategories.map((cat, i) => {
                      const subs = getSubcategories(cat.id);
                      const hasChildren = subs.length > 0;
                      const isExpanded = !!expandedCategories[cat.id];

                      return (
                        <div key={cat.id || i} className="flex flex-col">
                          {/* Parent Row */}
                          <div className="flex items-stretch justify-between bg-white dark:bg-slate-900 min-h-[52px]">
                            <button
                              onClick={() => {
                                onCategorySelect(cat.name);
                                onClose();
                              }}
                              className="flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-red-600 transition-colors cursor-pointer"
                            >
                              {t_smart(cat.name)}
                            </button>
                            
                            {hasChildren && (
                              <button
                                onClick={() => toggleExpand(cat.id)}
                                className={`w-12 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                                  isExpanded 
                                    ? 'bg-red-600 text-white border-l-red-600 shadow-inner' 
                                    : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                <ChevronRight className={`w-4 h-4 stroke-[3.5] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            )}
                          </div>

                          {/* Subcategories (Accordion Dropdown) */}
                          <AnimatePresence initial={false}>
                            {hasChildren && isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 divide-y divide-slate-100/50 dark:divide-slate-800/30"
                              >
                                {subs.map((sub, subIdx) => (
                                  <div key={sub.id || subIdx} className="flex items-stretch justify-between pl-12 pr-6 min-h-[48px]">
                                    <button
                                      onClick={() => {
                                        onCategorySelect(sub.name);
                                        onClose();
                                      }}
                                      className="flex-1 text-left py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                      {t_smart(sub.name)}
                                    </button>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {activeTab === 'brands' && (
                  <motion.div
                    key="brands-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800"
                  >
                    {brands.length > 0 ? (
                      brands.map((brand, i) => (
                        <div key={brand.id || i} className="flex items-stretch justify-between bg-white dark:bg-slate-900 min-h-[52px]">
                          <button
                            onClick={() => handleBrandSelect(brand.name)}
                            className={`flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-between ${
                              selectedBrand === brand.name 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-extrabold border-l-4 border-red-600 pl-5' 
                                : 'text-slate-800 dark:text-slate-200 hover:text-red-600'
                            }`}
                          >
                            <span>{brand.name}</span>
                            {brand.logo && (
                              <img src={brand.logo} alt={brand.name} className="w-8 h-8 object-contain rounded-lg border border-slate-50 dark:border-slate-800 p-0.5 bg-white shrink-0" />
                            )}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                        {t('no_premium_partners') || 'No Premium Partners'}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'menu' && (
                  <motion.div
                    key="menu-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800"
                  >
                    {[
                      { name: t('home_intelligence') || 'Home', onClick: () => { onCategorySelect(null); navigate('/'); onClose(); } },
                      { name: t('luxury_collection') || 'Shop', onClick: () => { onCategorySelect(null); navigate('/'); onClose(); } },
                      { name: t('corporate_location') || 'Our Store', onClick: () => { navigate('/visit'); onClose(); } },
                      { name: t('curated_wishlist') || 'Wishlist', onClick: () => { navigate('/wishlist'); onClose(); } },
                      { name: t('global_account') || 'Account', onClick: () => { navigate('/login'); onClose(); } }
                    ].map((item, i) => (
                      <div key={i} className="flex items-stretch justify-between bg-white dark:bg-slate-900 min-h-[52px]">
                        <button
                          onClick={item.onClick}
                          className="flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          {item.name}
                        </button>
                      </div>
                    ))}

                    {/* Regional Language Selector Item */}
                    <div className="flex flex-col bg-white dark:bg-slate-900">
                      <div className="flex items-stretch justify-between min-h-[52px] border-b border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => setIsLangExpanded(!isLangExpanded)}
                          className="flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-red-650 transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Globe size={14} className="text-eas-blue animate-pulse" />
                          {t('regional_language') || 'Language'} ({lang.toUpperCase()})
                        </button>
                        <button
                          onClick={() => setIsLangExpanded(!isLangExpanded)}
                          className={`w-12 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isLangExpanded 
                              ? 'bg-red-600 text-white border-l-red-600 shadow-inner' 
                              : 'text-slate-400 dark:text-slate-500 hover:text-slate-850 dark:hover:text-white'
                          }`}
                        >
                          <ChevronRight className={`w-4 h-4 stroke-[3.5] transition-transform duration-300 ${isLangExpanded ? 'rotate-90' : ''}`} />
                        </button>
                      </div>

                      {/* Language Options 2-Column Grid */}
                      <AnimatePresence initial={false}>
                        {isLangExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 grid grid-cols-2 gap-2 p-4 border-b border-slate-100 dark:border-slate-800"
                          >
                            {languages.map((language) => (
                              <button
                                key={language.code}
                                onClick={() => {
                                  changeLanguage(language.code);
                                  onClose();
                                }}
                                className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all cursor-pointer ${
                                  lang === language.code
                                    ? 'bg-eas-blue text-white shadow-lg shadow-eas-blue/20'
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80 hover:border-eas-blue hover:text-eas-blue'
                                }`}
                              >
                                {language.code} - {language.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating Close Button for Mobile Accessibility */}
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-50 cursor-pointer hover:bg-red-600 transition-colors"
              title="Close Menu"
            >
              <X size={20} />
            </motion.button>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default Sidebar;
