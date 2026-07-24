import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Box, Sparkles, ChevronRight, Globe,
  Smartphone, Laptop, Headphones, Watch, Gamepad2,
  Heart, Zap, LayoutGrid, Star, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { playSound } from '../utils/sound';
import { getCategoryDescendants } from '../utils/categoryHelpers';

const Sidebar = ({ isOpen, onClose, onCategorySelect, activeCategory, embedded = false, products = [] }) => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [activeTab, setActiveTab] = useState('filter'); // Default to Categories tab like the screenshot
  const { categories, settings, brands = [], selectedBrand, setSelectedBrand, setSelectedCategory, setSearchQuery, products: storeProducts = [] } = useStore();
  const { lang, changeLanguage, t, t_smart, isRTL } = useLanguage();
  const [expandedCategories, setExpandedCategories] = useState({});
  const [isLangExpanded, setIsLangExpanded] = useState(false);

  const [selectedSidebarCategory, setSelectedSidebarCategory] = useState(activeCategory || 'All');
  const [selectedSidebarBrand, setSelectedSidebarBrand] = useState(selectedBrand || 'All');
  const [forYouProducts, setForYouProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [forYouBrandProducts, setForYouBrandProducts] = useState([]);
  const [recommendedBrandProducts, setRecommendedBrandProducts] = useState([]);

  useEffect(() => {
    setSelectedSidebarCategory(activeCategory || 'All');
  }, [activeCategory]);

  useEffect(() => {
    setSelectedSidebarBrand(selectedBrand || 'All');
  }, [selectedBrand]);

  useEffect(() => {
    if (isOpen) {
      const activeProds = products?.length > 0 ? products : storeProducts;
      const filteredActive = activeProds.filter(p => p.status === 'active');
      
      // 1. Group by category
      const byCat = {};
      filteredActive.forEach(p => {
        const cat = p.category || 'default';
        if (!byCat[cat]) byCat[cat] = [];
        byCat[cat].push(p);
      });
      
      // Shuffle products in each category bucket
      Object.keys(byCat).forEach(cat => {
        byCat[cat] = [...byCat[cat]].sort(() => Math.random() - 0.5);
      });
      
      const chosenForYou = [];
      const categoriesList = Object.keys(byCat);
      
      if (categoriesList.length > 0) {
        let addedAny = true;
        while (chosenForYou.length < 10 && chosenForYou.length < filteredActive.length && addedAny) {
          addedAny = false;
          for (let i = 0; i < categoriesList.length; i++) {
            const cat = categoriesList[i];
            if (byCat[cat] && byCat[cat].length > 0) {
              const prod = byCat[cat].shift();
              chosenForYou.push(prod);
              addedAny = true;
              if (chosenForYou.length === 10) break;
            }
          }
        }
      }
      
      // Shuffle the resulting 10 products
      const shuffledForYou = [...chosenForYou].sort(() => Math.random() - 0.5);
      
      // Select 10 different active products for Recommended
      const forYouIds = new Set(shuffledForYou.map(p => p.id));
      const remainingProds = filteredActive.filter(p => !forYouIds.has(p.id));
      const shuffledRemaining = [...remainingProds].sort(() => Math.random() - 0.5);
      const chosenRecommended = shuffledRemaining.slice(0, 10);
      
      setForYouProducts(shuffledForYou);
      setRecommendedProducts(chosenRecommended);

      // 2. Group by brand
      const byBrand = {};
      filteredActive.forEach(p => {
        const b = p.brand || 'default';
        if (!byBrand[b]) byBrand[b] = [];
        byBrand[b].push(p);
      });

      // Shuffle products in each brand bucket
      Object.keys(byBrand).forEach(b => {
        byBrand[b] = [...byBrand[b]].sort(() => Math.random() - 0.5);
      });

      const chosenForYouBrand = [];
      const brandsList = Object.keys(byBrand);

      if (brandsList.length > 0) {
        let addedAny = true;
        while (chosenForYouBrand.length < 10 && chosenForYouBrand.length < filteredActive.length && addedAny) {
          addedAny = false;
          for (let i = 0; i < brandsList.length; i++) {
            const b = brandsList[i];
            if (byBrand[b] && byBrand[b].length > 0) {
              const prod = byBrand[b].shift();
              chosenForYouBrand.push(prod);
              addedAny = true;
              if (chosenForYouBrand.length === 10) break;
            }
          }
        }
      }

      // Shuffle the resulting 10 products
      const shuffledForYouBrand = [...chosenForYouBrand].sort(() => Math.random() - 0.5);

      // Select 10 different active products for Brand Recommended
      const forYouBrandIds = new Set(shuffledForYouBrand.map(p => p.id));
      const remainingBrandProds = filteredActive.filter(p => !forYouBrandIds.has(p.id));
      const shuffledRemainingBrand = [...remainingBrandProds].sort(() => Math.random() - 0.5);
      const chosenRecommendedBrand = shuffledRemainingBrand.slice(0, 10);

      setForYouBrandProducts(shuffledForYouBrand);
      setRecommendedBrandProducts(chosenRecommendedBrand);
    }
  }, [isOpen, products, storeProducts]);

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
    if (!catName) return 0;
    const activeProds = products?.length > 0 ? products : storeProducts;
    const descendants = getCategoryDescendants(catName, categories);
    const matchNames = [catName.toLowerCase(), ...descendants];
    return activeProds.filter(p => p.category && matchNames.includes(p.category.toLowerCase()) && p.status === 'active').length;
  };

  const getProductCountForBrand = (brandName) => {
    if (!brandName) return 0;
    const activeProds = products?.length > 0 ? products : storeProducts;
    return activeProds.filter(p => p.brand && p.brand.toLowerCase() === brandName.toLowerCase() && p.status === 'active').length;
  };

  const rightColumnProducts = useMemo(() => {
    const activeProds = products?.length > 0 ? products : storeProducts;
    if (!selectedSidebarCategory || selectedSidebarCategory.toLowerCase() === 'all') {
      return activeProds.filter(p => p.status === 'active');
    }
    const descendants = getCategoryDescendants(selectedSidebarCategory, categories);
    const matchNames = [selectedSidebarCategory.toLowerCase(), ...descendants];
    return activeProds.filter(p => p.category && matchNames.includes(p.category.toLowerCase()) && p.status === 'active');
  }, [selectedSidebarCategory, products, storeProducts, categories]);

  const rightColumnBrandProducts = useMemo(() => {
    const activeProds = products?.length > 0 ? products : storeProducts;
    if (!selectedSidebarBrand || selectedSidebarBrand.toLowerCase() === 'all') {
      return activeProds.filter(p => p.status === 'active');
    }
    return activeProds.filter(p => p.brand && p.brand.toLowerCase() === selectedSidebarBrand.toLowerCase() && p.status === 'active');
  }, [selectedSidebarBrand, products, storeProducts]);

  // Group categories into parent-child hierarchy
  const parentCategories = categories.filter(cat => (!cat.parent_id || Number(cat.level) === 1) && getProductCountForCategory(cat.name) > 0);
  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id && Number(cat.parent_id) === Number(parentId) && getProductCountForCategory(cat.name) > 0);
  };

  const renderSidebarProductCard = (product) => {
    const isWish = isInWishlist(product.id);
    const salesCount = product.sold_count || ((product.id * 17) % 200 + 45);
    return (
      <div 
        key={product.id}
        className="group flex gap-2.5 p-2.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm hover:border-[#2563EB]/25 hover:shadow-md hover:shadow-slate-100/50 dark:hover:shadow-none relative items-center animate-fadeIn transition-all duration-300 ease-out"
      >
        {/* Left Image */}
        <div 
          onClick={() => {
            navigate(`/product/${product.id}`);
            onClose();
          }}
          className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-xl overflow-hidden shrink-0 cursor-pointer"
        >
          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300 ease-out" 
          />
        </div>
        
        {/* Center Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 
            onClick={() => {
              navigate(`/product/${product.id}`);
              onClose();
            }}
            className="font-bold text-[11px] text-slate-800 dark:text-white line-clamp-2 cursor-pointer hover:text-[#2563EB] transition-colors text-left leading-tight"
          >
            {product.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5 select-none">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              {product.brand || 'SWEETO'}
            </span>
          </div>
          <div className="font-black text-[11px] text-slate-900 dark:text-white mt-1 text-left">
            {settings?.currency || 'FCFA'} {Number(product.price).toFixed(2)}
          </div>
          <div className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 text-left">
            {salesCount} sold
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex flex-col items-end gap-2.5 justify-between self-stretch py-0.5 select-none shrink-0">
          <button 
            onClick={() => {
              playSound?.('click');
              addToCart(product);
            }}
            className="bg-slate-900 hover:bg-[#2563EB] dark:bg-slate-50 dark:hover:bg-[#2563EB] text-white dark:text-slate-900 dark:hover:text-white rounded-lg px-2 py-1 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-all duration-300 border-none shadow-sm hover:shadow-md hover:shadow-[#2563EB]/20 hover:-translate-y-0.5 active:translate-y-0 select-none"
          >
            <i className="fa-solid fa-bag-shopping text-[8px]" />
            <span>Add</span>
          </button>
          <button 
            onClick={() => {
              playSound?.('click');
              toggleWishlist(product);
            }}
            className="cursor-pointer active:scale-90 transition-all border-none bg-transparent"
          >
            <Heart 
              size={14} 
              className={isWish ? "text-[#2563EB] fill-[#2563EB]" : "text-slate-350 dark:text-slate-600 hover:text-[#2563EB]"} 
            />
          </button>
        </div>
      </div>
    );
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
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-6 z-[200] cursor-zoom-out"
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
            className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} h-full w-full bg-white dark:bg-slate-900 shadow-none z-[210] overflow-hidden flex flex-col`}
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
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-eas-blue' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                {t('categories') || 'Categories'}
              </button>
              <button 
                onClick={() => { playSound('click'); setActiveTab('brands'); }}
                className={`flex-1 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all cursor-pointer ${
                  activeTab === 'brands' 
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-eas-blue' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                {t('partner_brands') || 'Brands'}
              </button>
              <button 
                onClick={() => { playSound('click'); setActiveTab('menu'); }}
                className={`flex-1 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] transition-all cursor-pointer ${
                  activeTab === 'menu' 
                    ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-white border-b-[3px] border-eas-blue' 
                    : 'text-slate-400 dark:text-slate-500 bg-[#f5f5f5] dark:bg-slate-800'
                }`}
              >
                Menu
              </button>
            </div>

            {/* Scrollable Sidebar Content Area */}
            <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 flex flex-col">
              <AnimatePresence mode="wait">
                {activeTab === 'filter' && (
                  <motion.div
                    key="categories-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex overflow-hidden h-full"
                  >
                    {/* Left Categories List */}
                    <div className="w-[140px] md:w-[170px] shrink-0 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-r border-[#2563EB]/15 flex flex-col py-3 overflow-y-auto custom-scrollbar select-none z-30">
                      
                      {/* Header label: Recommended */}
                      <div className="flex items-center justify-between px-3.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <i className="fa-solid fa-tag text-[#2563EB] text-[10px]" />
                          <span className="text-[11.5px] font-bold">SWEETO-KINS</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">256</span>
                      </div>

                      {/* All Pill (Top of lists) */}
                      <div className="px-2 mb-1">
                        <button
                          onClick={() => {
                            playSound('click');
                            setSelectedSidebarCategory('All');
                          }}
                          className={`w-full text-left pl-3.5 pr-2 py-2 rounded-r-xl text-[12px] font-bold transition-all cursor-pointer border-l-3 ${
                            selectedSidebarCategory === 'All'
                              ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB] shadow-sm'
                              : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          All
                        </button>
                      </div>

                      {/* Categories List */}
                      <div className="flex flex-col gap-1.5">
                        {parentCategories.map((cat) => {
                          const subs = getSubcategories(cat.id);
                          const hasChildren = subs.length > 0;
                          const isExpanded = !!expandedCategories[cat.id];
                          const isActive = selectedSidebarCategory.toLowerCase() === cat.name.toLowerCase();
                          
                          return (
                            <div className="flex flex-col gap-0.5" key={cat.id}>
                              {/* Parent Category Row */}
                              <div className="px-2 flex items-center justify-between w-full gap-1">
                                <button
                                  onClick={() => {
                                    playSound('click');
                                    setSelectedSidebarCategory(cat.name);
                                  }}
                                  className={`flex-1 text-left pl-3.5 pr-2 py-2 rounded-r-xl text-[12px] font-bold transition-all cursor-pointer border-l-3 truncate ${
                                    isActive
                                      ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB] shadow-sm'
                                      : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                                  }`}
                                  title={t_smart(cat.name)}
                                >
                                  {cat.name}
                                </button>

                                {hasChildren && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      playSound('click');
                                      toggleExpand(cat.id);
                                    }}
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border-none bg-transparent ${
                                      isActive 
                                        ? 'text-[#2563EB] hover:bg-[#2563EB]/10' 
                                        : 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                                    }`}
                                  >
                                    <ChevronRight 
                                      size={12} 
                                      className={`transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-90' : ''}`} 
                                    />
                                  </button>
                                )}
                              </div>

                              {/* Expanded Subcategories Dropdown */}
                              <AnimatePresence initial={false}>
                                {hasChildren && isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="overflow-hidden flex flex-col pl-4 gap-0.5"
                                  >
                                    {subs.map((sub) => {
                                      const isSubActive = selectedSidebarCategory.toLowerCase() === sub.name.toLowerCase();
                                      return (
                                        <button
                                          key={sub.id}
                                          onClick={() => {
                                            playSound('click');
                                            setSelectedSidebarCategory(sub.name);
                                          }}
                                          className={`w-full text-left pl-3.5 pr-2 py-1.5 rounded-r-lg text-[11px] font-bold transition-all cursor-pointer border-l-3 truncate ${
                                            isSubActive
                                              ? 'text-[#2563EB] font-bold bg-[#2563EB]/5 border-[#2563EB]'
                                              : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-[#2563EB] hover:bg-slate-100/30 dark:hover:bg-slate-800/10'
                                          }`}
                                          title={t_smart(sub.name)}
                                        >
                                          {sub.name}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Products List */}
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 pb-24">
                      
                      {/* Sub-header section */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-[#2563EB]">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[11.5px] font-black text-slate-800 dark:text-white capitalize">
                            {selectedSidebarCategory.toLowerCase() === 'all' ? 'For You' : t_smart(selectedSidebarCategory)}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            onCategorySelect(selectedSidebarCategory.toLowerCase() === 'all' ? null : selectedSidebarCategory);
                            onClose();
                          }}
                          className="text-[#2563EB] text-[10px] font-bold flex items-center gap-0.5 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <span>See All</span>
                          <ArrowRight size={10} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Horizontal product cards */}
                      <div className="flex flex-col gap-2">
                        {selectedSidebarCategory.toLowerCase() === 'all' ? (
                          <>
                            {/* For You List */}
                            {forYouProducts.length > 0 ? (
                              forYouProducts.map(product => renderSidebarProductCard(product))
                            ) : (
                              <div className="w-full py-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                              </div>
                            )}

                            {/* Recommended Divider & Section */}
                            <div className="flex items-center gap-1.5 text-[#2563EB] mt-4 px-1">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[11px] font-bold text-slate-800 dark:text-white">Recommended</span>
                            </div>
                            <hr className="border-slate-200/40 dark:border-white/5 my-1" />

                            {/* Recommended List */}
                            {recommendedProducts.length > 0 ? (
                              recommendedProducts.map(product => renderSidebarProductCard(product))
                            ) : (
                              <div className="w-full py-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Specific Category List */
                          rightColumnProducts.length > 0 ? (
                            rightColumnProducts.map(product => renderSidebarProductCard(product))
                          ) : (
                            <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                              <i className="fa-solid fa-box-open text-2xl mb-2 opacity-60 animate-bounce" />
                              <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'brands' && (
                  <motion.div
                    key="brands-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex overflow-hidden h-full"
                  >
                    {/* Left Brands List */}
                    <div className="w-[140px] md:w-[170px] shrink-0 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-r border-[#2563EB]/15 flex flex-col py-3 overflow-y-auto custom-scrollbar select-none z-30">
                      
                      {/* Header label: Recommended */}
                      <div className="flex items-center justify-between px-3.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                          <i className="fa-solid fa-tag text-[#2563EB] text-[10px]" />
                          <span className="text-[11.5px] font-bold">SWEETO-KINS</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">256</span>
                      </div>

                      {/* All Pill (Top of lists) */}
                      <div className="px-2 mb-1">
                        <button
                          onClick={() => {
                            playSound('click');
                            setSelectedSidebarBrand('All');
                          }}
                          className={`w-full text-left pl-3.5 pr-2 py-2 rounded-r-xl text-[12px] font-bold transition-all cursor-pointer border-l-3 ${
                            selectedSidebarBrand === 'All'
                              ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB] shadow-sm'
                              : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                          }`}
                        >
                          All
                        </button>
                      </div>

                      {/* Brands List */}
                      <div className="flex flex-col gap-1">
                        {(() => {
                          const activeBrands = brands.filter(b => getProductCountForBrand(b.name) > 0);
                          if (activeBrands.length === 0) {
                            return (
                              <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {t('no_premium_partners') || 'No Premium Partners'}
                              </div>
                            );
                          }
                          return activeBrands.map((brand, i) => {
                            const count = getProductCountForBrand(brand.name);
                            const isActive = selectedSidebarBrand.toLowerCase() === brand.name.toLowerCase();
                            return (
                              <div className="px-2" key={brand.id || i}>
                                <button
                                  onClick={() => {
                                    playSound('click');
                                    setSelectedSidebarBrand(brand.name);
                                  }}
                                  className={`w-full text-left pl-3.5 pr-2 py-2 rounded-r-xl text-[12px] font-bold transition-all cursor-pointer border-l-3 truncate ${
                                    isActive
                                      ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB] shadow-sm'
                                      : 'bg-transparent text-slate-700 dark:text-slate-300 border-transparent hover:bg-slate-100/50 dark:hover:bg-slate-800/20'
                                  }`}
                                >
                                  {brand.name}
                                </button>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Right Products List */}
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 pb-24">
                      
                      {/* Sub-header section */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5 text-[#2563EB]">
                          <Star size={12} fill="currentColor" />
                          <span className="text-[11.5px] font-black text-slate-800 dark:text-white capitalize">
                            {selectedSidebarBrand.toLowerCase() === 'all' ? 'For You' : t_smart(selectedSidebarBrand)}
                          </span>
                        </div>
                        <button 
                          onClick={() => {
                            handleBrandSelect(selectedSidebarBrand.toLowerCase() === 'all' ? null : selectedSidebarBrand);
                            onClose();
                          }}
                          className="text-[#2563EB] text-[10px] font-bold flex items-center gap-0.5 hover:underline bg-transparent border-none cursor-pointer"
                        >
                          <span>See All</span>
                          <ArrowRight size={10} strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Horizontal product cards */}
                      <div className="flex flex-col gap-2">
                        {selectedSidebarBrand.toLowerCase() === 'all' ? (
                          <>
                            {/* For You List */}
                            {forYouBrandProducts.length > 0 ? (
                              forYouBrandProducts.map(product => renderSidebarProductCard(product))
                            ) : (
                              <div className="w-full py-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                              </div>
                            )}

                            {/* Recommended Divider & Section */}
                            <div className="flex items-center gap-1.5 text-[#2563EB] mt-4 px-1">
                              <Star size={12} fill="currentColor" />
                              <span className="text-[11px] font-bold text-slate-800 dark:text-white">Recommended</span>
                            </div>
                            <hr className="border-slate-200/40 dark:border-white/5 my-1" />

                            {/* Recommended List */}
                            {recommendedBrandProducts.length > 0 ? (
                              recommendedBrandProducts.map(product => renderSidebarProductCard(product))
                            ) : (
                              <div className="w-full py-8 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                                <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                              </div>
                            )}
                          </>
                        ) : (
                          /* Specific Brand List */
                          rightColumnBrandProducts.length > 0 ? (
                            rightColumnBrandProducts.map(product => renderSidebarProductCard(product))
                          ) : (
                            <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
                              <i className="fa-solid fa-box-open text-2xl mb-2 opacity-60 animate-bounce" />
                              <p className="text-[10px] font-bold uppercase tracking-wider">No items found</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'menu' && (
                  <motion.div
                    key="menu-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="divide-y divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 overflow-y-auto custom-scrollbar flex-1 pb-24"
                  >
                    {[
                      { name: t('home_intelligence') || 'Home', onClick: () => { onCategorySelect(null); navigate('/'); onClose(); } },
                      { name: t('luxury_collection') || 'Shop', onClick: () => { onCategorySelect(null); navigate('/'); onClose(); } },
                      { name: t('corporate_location') || 'Our Store', onClick: () => { navigate('/visit'); onClose(); } },
                      { name: t('curated_wishlist') || 'Wishlist', onClick: () => { navigate('/wishlist'); onClose(); } },
                      { name: t('global_account') || 'Account', onClick: () => { navigate('/login'); onClose(); } },
                      { name: t('settings') || 'Settings', onClick: () => { navigate('/settings'); onClose(); } }
                    ].map((item, i) => (
                      <div key={i} className="flex items-stretch justify-between bg-white dark:bg-slate-900 min-h-[52px]">
                        <button
                          onClick={item.onClick}
                          className="flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-eas-blue transition-colors cursor-pointer"
                        >
                          {item.name}
                        </button>
                      </div>
                    ))}

                    {/* Regional Language Selector Item */}
                    <div className="flex flex-col bg-white dark:bg-slate-900">
                      <div className="flex items-stretch justify-between min-h-[52px] border-b border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() => {
                            navigate('/settings');
                            onClose();
                          }}
                          className="flex-1 text-left px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200 hover:text-eas-blue transition-colors cursor-pointer flex items-center gap-3"
                        >
                          <Globe size={14} className="text-slate-400" />
                          <span>{t('language') || 'Language'} ({lang.toUpperCase()})</span>
                        </button>
                        <button
                          onClick={() => setIsLangExpanded(!isLangExpanded)}
                          className={`w-12 border-l border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isLangExpanded 
                              ? 'bg-eas-blue text-white border-l-eas-blue shadow-inner' 
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
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-350 border border-slate-100 dark:border-slate-800/80 hover:border-eas-blue hover:text-eas-blue'
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
              className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-2xl z-50 cursor-pointer hover:bg-eas-blue transition-colors"
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
