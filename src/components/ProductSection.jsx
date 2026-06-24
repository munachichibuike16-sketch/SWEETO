import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, Star, Heart, Eye, ShoppingCart,
  TrendingUp, ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Sparkles, Package
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import ProductCard from './ProductCard';

export const SectionBanner = ({ title, subtitle, viewAllLink, bannerImage = "/hero-banner.png", onViewAllClick }) => {
  const { t, isRTL } = useLanguage();
  const titleVariants = {
    hidden: { opacity: 0, x: isRTL ? 30 : -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative w-full h-auto py-4 md:py-0 md:h-56 flex items-center justify-center mb-3 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl group transition-all"
    >
      {/* Background with Parallax */}
      <div className="absolute inset-0 z-0">
        <img
          src={bannerImage}
          className="w-full h-full object-cover opacity-60 mix-blend-overlay"
          alt="banner"
        />
        {/* Dynamic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] via-[#020617]/80 to-blue-500/20"></div>
      </div>

      <div className="relative z-10 px-3 md:px-16 w-full flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">

        {/* Glassmorphism Title Card */}
        <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'} backdrop-blur-md bg-white/5 border border-white/10 p-3 md:p-8 rounded-xl md:rounded-[2rem] shadow-2xl relative overflow-hidden w-full md:w-auto`}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>

          <motion.h2
            variants={titleVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-lg sm:text-4xl md:text-6xl font-black tracking-tighter uppercase italic mb-1.5 md:mb-3 text-white drop-shadow-lg"
          >
            {title}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`flex items-center gap-2 md:gap-4 justify-center ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}
          >
            <div className="w-6 md:w-12 h-1 bg-gradient-to-r from-eas-blue to-blue-700 rounded-full shadow-[0_0_15px_rgba(0,82,255,0.8)]"></div>
            <p className="text-[8px] md:text-xs font-black text-white uppercase tracking-[0.2em] md:tracking-[0.5em]">{subtitle}</p>
          </motion.div>
        </div>

        {/* Action Button */}
        {(viewAllLink || onViewAllClick) && (
          onViewAllClick ? (
            <button
              onClick={onViewAllClick}
              className="bg-white/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-slate-100 dark:border-eas-blue/15 shadow-md px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-3xl flex items-center gap-2 pointer-events-auto cursor-pointer text-[10px] md:text-sm font-bold"
            >
              <span className="relative z-10">{t('view_all') || 'View All'}</span>
              <ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              to={viewAllLink}
              className="bg-white/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-slate-100 dark:border-eas-blue/15 shadow-md px-4 py-2 md:px-8 md:py-4 rounded-xl md:rounded-3xl flex items-center gap-2 pointer-events-auto text-[10px] md:text-sm font-bold"
            >
              <span className="relative z-10">{t('view_all') || 'View All'}</span>
              <ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          )
        )}
      </div>
    </motion.div>
  );
};

const ProductRow = ({ products, onProductClick }) => {
  const scrollRef = useRef(null);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth;
      scrollRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/row mb-8 px-1 md:px-0">
      {products.length > 2 && (
        <>
          <button 
            onClick={() => scroll('prev')}
            className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg rounded-full text-slate-800 dark:text-white hover:bg-slate-900 dark:hover:bg-eas-blue hover:text-white transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 sm:rounded-2xl shadow-black/10 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 p-2 sm:p-4"
          >
            <ChevronLeft size={16} className="sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={() => scroll('next')}
            className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg rounded-full text-slate-800 dark:text-white hover:bg-slate-900 dark:hover:bg-eas-blue hover:text-white transition-all border border-slate-100 dark:border-slate-700 flex items-center justify-center w-8 h-8 sm:w-12 sm:h-12 sm:rounded-2xl shadow-black/10 opacity-100 sm:opacity-0 sm:group-hover/row:opacity-100 p-2 sm:p-4"
          >
            <ChevronRight size={16} className="sm:w-5 sm:h-5" />
          </button>
        </>
      )}
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-1.5 sm:gap-8 no-scrollbar snap-x snap-mandatory scroll-smooth pb-4"
      >
        {products.map((product, idx) => (
          <div 
            key={`${product.id}-${idx}`} 
            className="w-[calc(50%-3px)] min-w-[calc(50%-3px)] sm:w-[calc(50%-16px)] sm:min-w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)] lg:min-w-[calc(33.333%-22px)] xl:w-[calc(20%-26px)] xl:min-w-[calc(20%-26px)] shrink-0 snap-start"
          >
            <ProductCard
              product={product}
              index={idx}
              onProductClick={onProductClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SectionHeader = ({ 
  title, 
  subtitle, 
  style = 'gradient', 
  viewAllLink, 
  bannerImage, 
  onViewAllClick, 
  onHeaderClick, 
  isExpanded, 
  isMobile, 
  isCarousel = true, 
  productsCount = 0 
}) => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  if (style === 'simple') {
    const showChevron = isCarousel && productsCount > 2;

    const handleHeaderClick = () => {
      if (onHeaderClick) {
        onHeaderClick();
      } else if (onViewAllClick) {
        onViewAllClick();
      } else if (viewAllLink) {
        navigate(viewAllLink);
      }
    };

    const handleViewAllClick = (e) => {
      e.stopPropagation();
      if (onViewAllClick) {
        onViewAllClick();
      } else if (viewAllLink) {
        navigate(viewAllLink);
      }
    };

    return (
      <div className="flex items-center justify-between w-full mb-4 select-none">
        <div 
          onClick={handleHeaderClick}
          className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-base sm:text-lg uppercase tracking-tight group cursor-pointer"
        >
          <span>{title}</span>
          {showChevron && (
            <ChevronRight 
              size={18} 
              className={`text-slate-400 dark:text-slate-500 group-hover:text-eas-blue transition-transform duration-300 ${
                isMobile && isExpanded ? 'rotate-90 text-eas-blue' : 'group-hover:translate-x-0.5'
              }`} 
            />
          )}
        </div>

        {(viewAllLink || onViewAllClick) && (
          <button 
            onClick={handleViewAllClick}
            className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-eas-blue transition-colors cursor-pointer flex items-center gap-0.5 uppercase tracking-wider"
          >
            <span>{t('view_all') || 'View All'}</span>
            <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    );
  }

  if (style === 'gradient') {
    return <SectionBanner title={title} subtitle={subtitle} viewAllLink={viewAllLink} bannerImage={bannerImage} onViewAllClick={onViewAllClick} />;
  }

  // Styles for the "simple bold and beautify" variants - optimized for mobile padding
  const styles = {
    bold: "bg-white dark:bg-[#020617] border-l-[8px] md:border-l-[12px] border-slate-900 dark:border-blue-500 py-3.5 px-3 md:py-12 md:px-14 rounded-r-xl md:rounded-r-[3rem] shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]",
    minimal: "bg-transparent border-b-2 border-slate-200 dark:border-eas-blue/15 py-2 md:py-10 px-1",
    accent: "bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-3.5 px-3 md:py-12 md:px-14 rounded-xl md:rounded-[3rem] shadow-2xl shadow-blue-500/20",
    neon: "bg-[#020617] border border-emerald-500/40 text-emerald-400 py-3.5 px-3 md:py-12 md:px-14 rounded-xl md:rounded-[3rem] shadow-[0_20px_50px_rgba(16,185,129,0.15)] relative overflow-hidden",
    outlined: "border-2 md:border-4 border-slate-900 dark:border-white py-3.5 px-3 md:py-12 md:px-14 rounded-xl md:rounded-[3rem]",
    glass: "backdrop-blur-3xl bg-white/40 dark:bg-[#020617]/40 border border-white/20 dark:border-eas-blue/15 py-3.5 px-3 md:py-12 md:px-14 rounded-xl md:rounded-[3rem] shadow-2xl shadow-black/5"
  };

  const currentClass = styles[style] || styles.bold;

  const btnClasses = `px-4 py-2 md:px-10 md:py-5 rounded-lg md:rounded-[1.5rem] font-black text-[9px] md:text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 md:gap-4 shadow-md group/btn relative z-10 opacity-100 ${
    style === 'minimal' 
      ? 'bg-slate-900 text-white hover:bg-eas-blue shadow-slate-900/20' 
      : style === 'bold' || style === 'glass' || style === 'outlined'
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-eas-blue dark:hover:bg-eas-blue dark:hover:text-white shadow-slate-900/30'
        : 'bg-white text-slate-900 hover:bg-eas-blue hover:text-white'
  }`;

  return (
    <div className={`mb-3 md:mb-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 relative group ${currentClass}`}>
      {style === 'neon' && (
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]"></div>
      )}
      
      <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'} relative z-10 w-full md:w-auto`}>
        <h2 className={`text-lg sm:text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-tight mb-2 md:mb-4 ${
          style === 'accent' || style === 'neon'
            ? '' 
            : 'text-slate-900 dark:text-white'
        }`}>
          {title}
        </h2>
        <div className={`flex items-center gap-2.5 md:gap-5 justify-center ${isRTL ? 'md:justify-end' : 'md:justify-start'}`}>
          <div className={`w-6 md:w-16 h-1 md:h-1.5 rounded-full ${
            style === 'minimal' || style === 'bold' || style === 'glass' || style === 'outlined'
              ? 'bg-eas-blue' 
              : 'bg-current opacity-40'
          }`}></div>
          <p className={`text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.5em] italic ${
            style === 'minimal' || style === 'bold' || style === 'glass' || style === 'outlined'
              ? 'text-slate-400 dark:text-slate-500' 
              : 'opacity-80'
          }`}>
            {subtitle}
          </p>
        </div>
      </div>

      {(viewAllLink || onViewAllClick) && (
        onViewAllClick ? (
          <button onClick={onViewAllClick} className={btnClasses}>
            {t('view_all') || 'View All'}
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </button>
        ) : (
          <Link
            to={viewAllLink}
            className={btnClasses}
          >
            {t('view_all') || 'View All'}
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        )
      )}
    </div>
  );
};

const ProductSection = ({ title, subtitle, products, type, settings, onProductClick, viewAllLink, bannerImage, hideBanner, headerStyle, hideHeader, cols, onViewAllClick }) => {
  const navigate = useNavigate();
  const [activeSubCategory, setActiveSubCategory] = useState('All');
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

  // Limit to 100 products for sections
  const displayProducts = (type === 'category') ? products : products.slice(0, 100);

  const filteredProducts = activeSubCategory === 'All' 
    ? displayProducts 
    : displayProducts.filter(p => p.category === activeSubCategory);

  const isCarousel = type !== 'category';

  const handleRightViewAllClick = () => {
    if (onViewAllClick) {
      onViewAllClick();
    } else if (viewAllLink) {
      navigate(viewAllLink);
    }
  };

  const handleHeaderClick = () => {
    if (isMobile) {
      setIsExpanded(prev => !prev);
    } else {
      handleRightViewAllClick();
    }
  };

  return (
    <section className="py-1 md:py-2 px-0 md:px-12">
      {!hideHeader && (
        <div className="px-3 md:px-0">
          <SectionHeader 
            title={title} 
            subtitle={subtitle} 
            style={headerStyle || (hideBanner ? 'bold' : 'gradient')} 
            viewAllLink={viewAllLink} 
            bannerImage={bannerImage} 
            onViewAllClick={handleRightViewAllClick}
            onHeaderClick={handleHeaderClick}
            isExpanded={isExpanded}
            isMobile={isMobile}
            isCarousel={isCarousel}
            productsCount={filteredProducts.length}
          />
        </div>
      )}

      {isCarousel ? (
        isMobile && isExpanded ? (
          <div className="grid grid-cols-2 gap-1.5 px-1 w-full pb-4 animate-fadeIn">
            {filteredProducts.slice(0, 4).map((product, idx) => (
              <ProductCard
                key={`${product.id}-${idx}`}
                product={product}
                index={idx}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        ) : (
          <ProductRow products={filteredProducts} onProductClick={onProductClick} />
        )
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-8 px-1 md:px-0 w-full">
          {filteredProducts.map((product, idx) => (
            <ProductCard
              key={`${product.id}-${idx}`}
              product={product}
              index={idx}
              onProductClick={onProductClick}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export const MiniSectionHeader = ({ title, subtitle, style = 'bold', sideLabel = 'A', onViewAll }) => {
  const { t } = useLanguage();

  if (style === 'simple') {
    return (
      <div className="flex items-center justify-between w-full mb-4 select-none">
        <div 
          onClick={onViewAll}
          className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-base sm:text-lg uppercase tracking-tight group cursor-pointer"
        >
          <span>{title}</span>
        </div>

        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-eas-blue transition-colors cursor-pointer flex items-center gap-0.5 uppercase tracking-wider"
          >
            <span>{t('view_all') || 'View All'}</span>
            <ChevronRight size={14} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    );
  }

  const styles = {
    gradient: "bg-gradient-to-tr from-[#020617] via-[#020617]/90 to-eas-blue/20 text-white border border-eas-blue/15",
    bold: "bg-white dark:bg-slate-900 border-l-[6px] md:border-l-8 border-slate-900 dark:border-blue-500 text-slate-900 dark:text-white",
    minimal: "bg-transparent border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white",
    accent: "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/10",
    neon: "bg-[#020617] border border-emerald-500/30 text-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.05)]",
    outlined: "border-2 border-slate-900 dark:border-slate-700 text-slate-900 dark:text-white",
    glass: "backdrop-blur-xl bg-white/20 dark:bg-slate-900/40 border border-white/20 dark:border-slate-800/50 text-slate-900 dark:text-white"
  };

  const currentClass = styles[style] || styles.bold;

  return (
    <div className={`p-3 sm:p-6 rounded-xl sm:rounded-[2rem] flex items-center justify-between gap-3 relative overflow-hidden group mb-2 sm:mb-3 transition-all ${currentClass}`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"/>
      
      <div className="flex flex-col justify-center relative z-10">
        {subtitle && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-[0.2em] ${
              style === 'gradient' || style === 'accent' || style === 'neon' ? 'text-white/70' : 'text-slate-400 dark:text-slate-500'
            }`}>
              {subtitle}
            </span>
          </div>
        )}

        <h3 className={`text-sm sm:text-2xl font-black uppercase italic tracking-tight ${
          style === 'gradient' || style === 'accent' || style === 'neon' ? 'text-white' : 'text-slate-900 dark:text-white'
        }`}>
          {title}
        </h3>
      </div>

      {onViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className={`relative z-20 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full font-black text-[8px] sm:text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5 border shadow-sm shrink-0 ${
            style === 'gradient' || style === 'accent'
              ? 'bg-white text-slate-900 border-white/10 hover:bg-slate-100 shadow-lg shadow-black/10'
              : 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <span>View All</span>
          <ArrowRight size={10} className="stroke-[3px]" />
        </button>
      )}
    </div>
  );
};

export const DualProductSection = ({ section, liveProducts = [], onProductClick }) => {
  const { t_smart } = useLanguage();
  const { setSelectedCategory, setSelectedBrand, setSearchQuery, categories = [] } = useStore();
  const navigate = useNavigate();

  const handleViewAll = (role, category) => {
    if (category && category !== 'All') {
      setSelectedCategory(null);
      setSelectedBrand(null);
      setSearchQuery('');
      navigate(`/category/${encodeURIComponent(category)}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const r = (role || '').toLowerCase();
    if (r.includes('trend')) {
      navigate('/trending');
      return;
    }
    if (r.includes('new') || r.includes('just')) {
      navigate('/new-arrivals');
      return;
    }
    if (r.includes('deal')) {
      navigate('/deals');
      return;
    }
    if (r.includes('feat')) {
      navigate('/featured');
      return;
    }

    navigate('/');
  };

  const getFilteredSideProducts = (role, category, isSideB) => {
    let list = [...liveProducts];
    
    // 1. Check for explicit placements first
    const assigned = list.filter(p => {
      let plist = [];
      try {
        plist = typeof p.placements === 'string' ? JSON.parse(p.placements || '[]') : (p.placements || []);
      } catch (e) {
        plist = Array.isArray(p.placements) ? p.placements : [];
      }
      
      if (isSideB) {
        return plist.includes(`${section.id}-B`);
      } else {
        return plist.includes(`${section.id}-A`) || plist.includes(section.id) || plist.includes(String(section.id));
      }
    });

    if (assigned.length > 0) {
      return assigned.slice(0, 4);
    }

    // 2. Fallback: Automatically populate based on Category & Role filter if no explicit placements are set!
    let filtered = [...list];
    
    // Category Filter
    if (category && category !== 'All') {
      const parentCat = categories.find(c => c.name?.toLowerCase() === category.toLowerCase());
      const subcatNames = parentCat 
        ? categories.filter(c => c.parent_id === parentCat.id).map(c => c.name?.toLowerCase())
        : [];
      filtered = filtered.filter(p => {
        const pCat = p.category?.toLowerCase();
        return pCat === category.toLowerCase() || subcatNames.includes(pCat);
      });
    }

    // Role Filter / Sorting
    const r = (role || '').toLowerCase();
    if (r.includes('deal')) {
      filtered = filtered.filter(p => p.deal_of_the_day || p.dealOfDay || p.on_sale);
    } else if (r.includes('new') || r.includes('just')) {
      // Sort by newest
      filtered = filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (r.includes('trend') || r.includes('popular')) {
      // Sort by views or rating
      filtered = filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (r.includes('feat') || r.includes('star')) {
      filtered = filtered.filter(p => p.featured);
    }

    return filtered.slice(0, 4);
  };

  const sideAProducts = getFilteredSideProducts(section.role, section.category, false);
  const sideBProducts = getFilteredSideProducts(section.roleB || 'trending', section.categoryB || 'All', true);

  return (
    <section className="py-1 md:py-2 px-3 md:px-12 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/5 dark:bg-orange-500/2 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/2 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          
          {/* Side A (Left Grid Column) */}
          <div className="bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm p-3 md:p-8 rounded-xl md:rounded-[3rem] border border-slate-100 dark:border-slate-800/40 shadow-sm flex flex-col">
            <MiniSectionHeader 
              title={t_smart(section.subtitle || section.category || 'All Categories')} 
              subtitle={t_smart(section.subtitle ? (section.category || 'Premium Collection') : 'Premium Selection')} 
              style={section.headerStyle || 'gradient'} 
              sideLabel="A"
              onViewAll={() => handleViewAll(section.role, section.category)}
            />
            {sideAProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full flex-1 content-start">
                {sideAProducts.map((product, idx) => (
                  <ProductCard
                    key={`sideA-${product.id}-${idx}`}
                    product={product}
                    index={idx}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-600 flex-1">
                <Package size={24} className="mb-2 opacity-60 animate-pulse"/>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider">No Products Found in Side A</p>
                <p className="text-[9px] mt-1 text-center font-medium">Configure category or role in section management.</p>
              </div>
            )}
          </div>

          {/* Side B (Right Grid Column) */}
          <div className="bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm p-3 md:p-8 rounded-xl md:rounded-[3rem] border border-slate-100 dark:border-slate-800/40 shadow-sm flex flex-col">
            <MiniSectionHeader 
              title={t_smart(section.titleB || section.categoryB || 'All Categories')} 
              subtitle={t_smart(section.titleB ? (section.categoryB || 'Handpicked Collection') : 'Selected Specialties')} 
              style={section.headerStyleB || 'bold'} 
              sideLabel="B"
              onViewAll={() => handleViewAll(section.roleB || 'trending', section.categoryB || 'All')}
            />
            {sideBProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-6 w-full flex-1 content-start">
                {sideBProducts.map((product, idx) => (
                  <ProductCard
                    key={`sideB-${product.id}-${idx}`}
                    product={product}
                    index={idx}
                    onProductClick={onProductClick}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-600 flex-1">
                <Package size={24} className="mb-2 opacity-60 animate-pulse"/>
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-wider">No Products Found in Side B</p>
                <p className="text-[9px] mt-1 text-center font-medium">Configure category or role in section management.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};

export default ProductSection;
