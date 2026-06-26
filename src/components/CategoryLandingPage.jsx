import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Package, ShoppingCart, Heart } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { getCategoryDescendants } from '../utils/categoryHelpers';
import ProductCard from './ProductCard';
import { SectionHeader } from './ProductSection';

const categoryBanners = {
  "smartphones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1000",
  "laptops": "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&q=80&w=1000",
  "headphones": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1000",
  "accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000",
  "gaming": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1000",
  "audio": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=1000",
  "wearables": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=1000",
  "appliances": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000",
  "desktops": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=1000",
  "components": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=1000",
  "default": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000"
};

export default function CategoryLandingPage({ categoryName, products = [], categories = [], settings, onProductClick }) {
  const { lang, t, t_smart } = useLanguage();
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState('All');

  const location = useLocation();
  const swipeDir = location.state?.swipeDir || 'next';

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sibling Category navigation mapping
  const parentCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    return categories
      .filter(c => !c.parent_id)
      .sort((a, b) => (a.position || 0) - (b.position || 0) || String(a.id).localeCompare(String(b.id)));
  }, [categories]);

  const currentCategoryIndex = useMemo(() => {
    return parentCategories.findIndex(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
  }, [parentCategories, categoryName]);

  const siblingSubcategories = useMemo(() => {
    if (currentCategoryIndex !== -1) return [];
    const currentCat = categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
    if (!currentCat || !currentCat.parent_id) return [];
    return categories
      .filter(c => c.parent_id === currentCat.parent_id)
      .sort((a, b) => (a.position || 0) - (b.position || 0) || String(a.id).localeCompare(String(b.id)));
  }, [categories, categoryName, currentCategoryIndex]);

  const currentSubcategoryIndex = useMemo(() => {
    if (siblingSubcategories.length === 0) return -1;
    return siblingSubcategories.findIndex(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
  }, [siblingSubcategories, categoryName]);

  const navigateToSiblingCategory = (direction) => {
    if (currentCategoryIndex !== -1 && parentCategories.length > 1) {
      let nextIndex = direction === 'next'
        ? (currentCategoryIndex + 1) % parentCategories.length
        : (currentCategoryIndex - 1 + parentCategories.length) % parentCategories.length;
      
      const nextCat = parentCategories[nextIndex];
      if (nextCat && nextCat.name) {
        if (navigator.vibrate) navigator.vibrate(15);
        navigate(`/category/${encodeURIComponent(nextCat.name)}`, { state: { swipeDir: direction } });
        window.scrollTo(0, 0);
      }
    } else if (currentSubcategoryIndex !== -1 && siblingSubcategories.length > 1) {
      let nextIndex = direction === 'next'
        ? (currentSubcategoryIndex + 1) % siblingSubcategories.length
        : (currentSubcategoryIndex - 1 + siblingSubcategories.length) % siblingSubcategories.length;
        
      const nextSubcat = siblingSubcategories[nextIndex];
      if (nextSubcat && nextSubcat.name) {
        if (navigator.vibrate) navigator.vibrate(15);
        navigate(`/category/${encodeURIComponent(nextSubcat.name)}`, { state: { swipeDir: direction } });
        window.scrollTo(0, 0);
      }
    }
  };

  // Pull-to-refresh & Swipe Category Navigation State (AliExpress Style)
  const { refreshData } = useStore();
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isSwipingHorizontal, setIsSwipingHorizontal] = useState(false);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setIsSwipingHorizontal(false);
    
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    } else {
      setTouchStart(0);
    }
  };

  const handleTouchMove = (e) => {
    if (refreshing) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (!isSwipingHorizontal && Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      setIsSwipingHorizontal(true);
    }

    if (isSwipingHorizontal || Math.abs(diffX) > Math.abs(diffY)) {
      if (e.cancelable) e.preventDefault();
    } else {
      if (touchStart === 0) return;
      const diff = currentY - touchStart;
      if (diff > 0) {
        const pull = Math.min(diff * 0.45, 80);
        setPullDistance(pull);
        if (diff > 10) {
          if (e.cancelable) e.preventDefault();
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (refreshing) return;
    const currentX = e.changedTouches[0].clientX;
    const currentY = e.changedTouches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (isSwipingHorizontal || Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > 120) {
        if (diffX < 0) {
          navigateToSiblingCategory('next');
        } else {
          if (touchStartX > 45) {
            navigateToSiblingCategory('prev');
          }
        }
      }
    } else if (pullDistance > 50) {
      setRefreshing(true);
      setPullDistance(55);
      refreshData().finally(() => {
        setTimeout(() => {
          setRefreshing(false);
          setPullDistance(0);
        }, 800);
      });
    } else {
      setPullDistance(0);
    }

    setTouchStart(0);
    setTouchStartX(0);
    setTouchStartY(0);
    setIsSwipingHorizontal(false);
  };

  // Find dynamic category info
  const categoryInfo = useMemo(() => {
    return categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
  }, [categories, categoryName]);

  // Filter products belonging to this category or its subcategories recursively
  const categoryProducts = useMemo(() => {
    if (!categoryName) return [];
    const descendants = getCategoryDescendants(categoryName, categories);
    const matchNames = [categoryName.toLowerCase(), ...descendants];
    
    return products.filter(p => {
      const pCat = p.category?.toLowerCase();
      return pCat && matchNames.includes(pCat) && p.status === 'active';
    });
  }, [products, categoryName, categories]);

  // Find deals for this category (original_price > price or is_daily_deal)
  const categoryDeals = useMemo(() => {
    return categoryProducts.filter(p => Number(p.is_daily_deal) === 1 || p.is_daily_deal === true || String(p.is_daily_deal) === 'true').slice(0, 6);
  }, [categoryProducts]);

  // Get filter pills: either child categories, or unique brands
  const filterPills = useMemo(() => {
    const parentCat = categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
    const subcats = parentCat ? categories.filter(c => c.parent_id === parentCat.id) : [];
    
    if (subcats.length > 0) {
      return ['All', ...subcats.map(s => s.name)];
    }
    
    // Fallback to brands if no sub-categories
    const brands = [...new Set(categoryProducts.map(p => p.brand).filter(Boolean))];
    return ['All', ...brands];
  }, [categories, categoryName, categoryProducts]);

  // Filter products based on selected pill
  const filteredProducts = useMemo(() => {
    if (activePill === 'All') return categoryProducts;
    
    // Check if activePill matches a sub-category or a brand
    const isBrand = !categories.some(c => c.name?.toLowerCase() === activePill?.toLowerCase());
    if (isBrand) {
      return categoryProducts.filter(p => p.brand?.toLowerCase() === activePill?.toLowerCase());
    } else {
      const descendants = getCategoryDescendants(activePill, categories);
      const matchNames = [activePill.toLowerCase(), ...descendants];
      return categoryProducts.filter(p => p.category && matchNames.includes(p.category.toLowerCase()));
    }
  }, [categoryProducts, activePill, categories]);

  // Get banner image url (prioritize custom uploaded category image)
  const bannerImage = categoryInfo?.image_url || categoryInfo?.icon || categoryBanners[categoryName.toLowerCase()] || categoryBanners.default;

  return (
    <AnimatePresence mode="popLayout">
      <motion.div 
        key={categoryName}
        initial={{ opacity: 0, x: swipeDir === 'next' ? 100 : -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: swipeDir === 'next' ? -100 : 100 }}
        transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="w-full flex flex-col gap-5 px-0 md:px-12 py-3 bg-slate-50 dark:bg-slate-950 min-h-screen relative overflow-x-hidden"
      >
      {/* Pull-To-Refresh Indicator (AliExpress Style) */}
      <div 
        style={{ height: `${pullDistance}px`, opacity: pullDistance > 0 ? 1 : 0 }}
        className="w-full overflow-hidden transition-all duration-150 flex items-center justify-center bg-transparent shrink-0"
      >
        <div className="flex items-center gap-2 text-eas-blue dark:text-blue-400 font-extrabold text-[10px] uppercase tracking-widest bg-slate-100/50 dark:bg-slate-900/30 px-4 py-2 rounded-full border border-slate-200/20 dark:border-white/5 shadow-sm">
          {refreshing ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-eas-blue dark:border-blue-450 border-t-transparent rounded-full animate-spin"></div>
              <span>{lang === 'fr' ? 'Mise à jour...' : 'Refreshing...'}</span>
            </>
          ) : (
            <>
              <i className={`fa-solid fa-arrow-down transition-transform duration-200 ${pullDistance > 50 ? 'rotate-180' : ''}`}></i>
              <span>{pullDistance > 50 ? (lang === 'fr' ? 'Relâchez pour actualiser' : 'Release to Refresh') : (lang === 'fr' ? 'Glissez pour actualiser' : 'Pull to Refresh')}</span>
            </>
          )}
        </div>
      </div>

      {/* Category Hero Banner (AliExpress Style) */}
      <div className="relative w-[calc(100%-24px)] mx-3 md:w-full md:mx-0 h-[140px] sm:h-[220px] md:h-[300px] lg:h-[380px] xl:h-[450px] rounded-[1.8rem] sm:rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden shadow-2xl flex items-center bg-slate-950">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            alt={categoryName} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/30 to-transparent z-10 pointer-events-none"></div>
        </div>

        {/* Banner Text Overlay */}
        <div className="relative z-10 pl-6 sm:pl-10 md:pl-16 lg:pl-20 flex flex-col items-start gap-0.5 sm:gap-1">
          {/* Angled "VIVA" Badge */}
          <div className="bg-[#00f2fe] text-slate-950 font-black text-[9px] sm:text-xs md:text-sm px-2.5 py-0.5 sm:px-3 sm:py-1 rounded uppercase tracking-wider transform -rotate-[6deg] select-none shadow-md mb-2 sm:mb-3 md:mb-4 w-fit">
            VIVA
          </div>
          {/* Main Title */}
          <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg leading-none">
            {t_smart(categoryName)} finds
          </h1>
          <p className="text-[9px] sm:text-[11px] md:text-sm lg:text-base font-bold text-white/90 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] font-sans mt-1">
            Discover {t_smart(categoryName)} collection today
          </p>
        </div>
      </div>

      {/* Daily Deals Section */}
      {categoryDeals.length > 0 && Number(categoryInfo?.show_daily_deals) !== 0 && (
        <div className="w-[calc(100%-24px)] mx-3 md:w-full md:mx-0 flex flex-col bg-transparent p-0 shadow-none border-0">
          <div className="px-1.5 md:px-0">
            <SectionHeader 
              title={lang === 'fr' ? 'Offres du Jour' : 'Daily Deals'} 
              style="simple" 
              viewAllLink={`/deals?category=${encodeURIComponent(categoryName)}`}
              onHeaderClick={isMobile ? () => setIsExpanded(!isExpanded) : () => navigate(`/deals?category=${encodeURIComponent(categoryName)}`)}
              onViewAllClick={() => navigate(`/deals?category=${encodeURIComponent(categoryName)}`)}
              isExpanded={isExpanded}
              isMobile={isMobile}
              isCarousel={true}
              productsCount={categoryDeals.length}
            />
          </div>

          {isMobile && isExpanded ? (
            <div className="grid grid-cols-2 gap-1.5 px-0.5 w-full pb-4 animate-fadeIn">
              {categoryDeals.slice(0, 4).map((prod) => (
                <ProductCard 
                  key={`deal-${prod.id}`}
                  product={prod}
                  onProductClick={onProductClick}
                />
              ))}
            </div>
          ) : (
            /* Horizontally scrollable deals list */
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1.5 snap-x snap-mandatory">
              {categoryDeals.map((prod) => (
                <div 
                  key={`deal-${prod.id}`}
                  className="w-32 min-w-32 sm:w-40 sm:min-w-40 snap-start"
                >
                  <ProductCard 
                    product={prod}
                    onProductClick={onProductClick}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subcategory / Brand Pills Filter Row */}
      {filterPills.length > 1 && (
        <div className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-3 md:px-0 select-none">
          {filterPills.map((pill) => {
            const isSelected = activePill === pill;
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setActivePill(pill)}
                className={`text-[12px] font-semibold px-4.5 py-1.5 rounded-full whitespace-nowrap transition-all shadow-sm cursor-pointer select-none flex items-center justify-center ${
                  isSelected 
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold scale-105' 
                    : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {pill === 'All' && (
                  <Heart 
                    size={12} 
                    className={`mr-1 shrink-0 ${isSelected ? 'text-[#ff3b30] fill-[#ff3b30]' : 'text-slate-400'}`} 
                  />
                )}
                {t_smart(pill)}
              </button>
            );
          })}
        </div>
      )}

      {/* Filtered Products Grid */}
      <div className="w-full flex flex-col gap-3 px-1 md:px-0">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400 mx-3 md:mx-0 w-[calc(100%-24px)] md:w-full">
            <Package size={36} className="mb-2 opacity-60 animate-bounce" />
            <p className="text-sm font-bold uppercase tracking-wider">No items found</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Try checking another sub-category or filter</p>
          </div>
        )}
      </div>

      </motion.div>
    </AnimatePresence>
  );
}
