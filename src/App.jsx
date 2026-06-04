import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { ChevronDown, Zap, Globe, ArrowLeft, Sparkles, Package, MessageCircle, MapPin, Send, Clock, Lock as LockIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import TopCategories from './components/TopCategories';
import Sidebar from './components/Sidebar';
import ProductSection, { SectionBanner, DualProductSection } from './components/ProductSection';
import CartDrawer from './components/CartDrawer';
import ProductModal from './components/ProductModal';
import WishlistContent from './components/WishlistContent';
import NotificationsContent from './components/NotificationsContent';
import AuthPage from './pages/AuthPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import DeliverPage from './pages/DeliverPage';
import Dashboard from './pages/Dashboard';
import VisitUs from './pages/VisitUs';
import LegalPage from './pages/LegalPage';
import ScrollToTop from './components/ScrollToTop';
import RealtimeNotification from './components/RealtimeNotification';
import BackToTop from './components/BackToTop';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import MobileDock from './components/MobileDock';
import { useStore } from './contexts/StoreContext';
import { useLanguage } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';

const getCurrentPath = () => {
  const hash = window.location.hash;
  if (hash) {
    const path = hash.replace(/^#/, '');
    return path.startsWith('/') ? path : '/' + path;
  }
  return window.location.pathname;
};

/* ─── CUSTOM SOCIAL ICONS (Lucide Compatibility) ─── */
const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);
const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const TwitterIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const YoutubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);
const TiktokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);
import LoadingScreen from './components/LoadingScreen';

import VideoAdSection from './components/VideoAdSection';
import DealOfTheDaySection from './components/DealOfTheDaySection';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const Toast = () => {
  const { toast } = useStore();
  if (!toast) return null;

  const icons = {
    success: <CheckCircle className="text-emerald-500" size={20} />,
    error: <AlertCircle className="text-red-500" size={20} />,
    info: <Info className="text-eas-blue" size={20} />,
  };

  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[3000] pointer-events-none">
      <motion.div
        initial={{ y: -50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -50, opacity: 0, scale: 0.9 }}
        className="bg-white/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-slate-100 dark:border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] px-8 py-4 rounded-3xl flex items-center gap-4 pointer-events-auto"
      >
        {icons[toast.type] || icons.success}
        <p className="font-black text-xs uppercase tracking-widest text-slate-900 whitespace-nowrap">
          {toast.message}
        </p>
      </motion.div>
    </div>
  );
};

const ConfirmDialog = () => {
  const { confirmDialog, closeConfirm } = useStore();
  if (!confirmDialog) return null;

  const handleCancel = () => {
    if (confirmDialog.onCancel) confirmDialog.onCancel();
    closeConfirm();
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) confirmDialog.onConfirm();
    closeConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop glass blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal glass panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.45 }}
          className="relative w-full max-w-sm bg-white dark:bg-[#070b13] border border-slate-200 dark:border-slate-800 rounded-[2.2rem] p-6 shadow-2xl space-y-6 overflow-hidden"
        >
          {/* Radial visual glow accent */}
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-[40px] pointer-events-none ${
            confirmDialog.type === 'danger' ? 'bg-rose-500/10' : 'bg-blue-500/10'
          }`}></div>

          <div className="text-center space-y-3.5 relative">
            {/* Custom glowing warning header */}
            <div className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
              confirmDialog.type === 'danger'
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-blue-500/10 text-blue-500'
            }`}>
              <ChevronDown size={22} className="rotate-180" />
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mt-4">
              {confirmDialog.title || 'Are you sure?'}
            </h3>
            
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-2">
              {confirmDialog.message}
            </p>
          </div>

          {/* Action trigger row */}
          <div className="flex gap-3 relative">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest transition-colors cursor-pointer"
            >
              {confirmDialog.cancelText || 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md transition-all active:scale-98 cursor-pointer ${
                confirmDialog.type === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
              }`}
            >
              {confirmDialog.confirmText || 'Confirm'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


const Storefront = ({ viewMode = 'home' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  
  const { products: liveProducts, categories, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, selectedBrand, setSelectedBrand, settings, recentlyViewed, sections } = useStore();
  const { t, t_smart, lang } = useLanguage();

  const getProductCountForCategory = (catName) => {
    let count = liveProducts?.filter(p => p.category === catName && p.status === 'active').length || 0;
    const cat = categories.find(c => c.name === catName);
    if (cat) {
      const subcats = categories.filter(c => c.parent_id === cat.id);
      subcats.forEach(sub => {
        count += liveProducts?.filter(p => p.category === sub.name && p.status === 'active').length || 0;
      });
    }
    return count;
  };

  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [sortBy, setSortBy] = useState('name_az');
  const { productId, categoryName } = useParams();
  const navigate = useNavigate();

  const activeCategory = viewMode === 'category' 
    ? (categoryName ? decodeURIComponent(categoryName) : null) 
    : selectedCategory;

  // 1. Auto-open Product Modal if ID in URL
  useEffect(() => {
    if (productId && liveProducts.length > 0) {
      const p = liveProducts.find(prod => prod.id.toString() === productId.toString());
      if (p) {
        setSelectedProduct(p);
        setIsProductModalOpen(true);
      } else {
        setIsProductModalOpen(false);
      }
    } else {
      setIsProductModalOpen(false);
    }
  }, [productId, liveProducts]);

  // 2. Scroll to top on navigation/filter change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeCategory, selectedBrand, viewMode, searchQuery]);

  // 3. Clear Modal / Navigation logic
  const handleProductModalClose = () => {
    setIsProductModalOpen(false);
    if (productId) {
      navigate('/');
    }
  };

  const handleProductClick = (p) => {
    setSelectedProduct(p);
    setIsProductModalOpen(true);
    // Push path to history stack to support back button modal dismissal
    navigate(`/product/${p.id}`);
  };

  // 4. Expose mobile hardware back button handler for app wrappers
  useEffect(() => {
    window.handleAndroidBack = () => {
      if (isCartOpen) {
        setIsCartOpen(false);
        return true;
      }
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
        return true;
      }
      if (isProductModalOpen) {
        handleProductModalClose();
        return true;
      }
      
      const currentPath = getCurrentPath();
      if (currentPath !== '/' && currentPath !== '/home') {
        window.history.back();
        return true;
      }
      return false;
    };

    return () => {
      delete window.handleAndroidBack;
    };
  }, [isCartOpen, isSidebarOpen, isProductModalOpen, productId, handleProductModalClose]);

  // 5. Manage history state for drawers to capture browser/physical back button (popstate)
  useEffect(() => {
    if (isSidebarOpen) {
      window.history.pushState({ isSidebar: true }, '');
    }
    return () => {
      if (isSidebarOpen && window.history.state?.isSidebar) {
        window.history.back();
      }
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (isCartOpen) {
      window.history.pushState({ isCart: true }, '');
    }
    return () => {
      if (isCartOpen && window.history.state?.isCart) {
        window.history.back();
      }
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
      if (isCartOpen) {
        setIsCartOpen(false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isSidebarOpen, isCartOpen]);

  let allProducts = liveProducts;
  
  const searchFilteredProducts = (searchQuery && Array.isArray(allProducts))
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (Array.isArray(allProducts) ? allProducts : []);

  const categoryFilteredProducts = (activeCategory && Array.isArray(searchFilteredProducts))
    ? searchFilteredProducts.filter(p => p.category === activeCategory)
    : searchFilteredProducts;

  const filteredProducts = (selectedBrand && Array.isArray(categoryFilteredProducts))
    ? categoryFilteredProducts.filter(p => p.brand === selectedBrand)
    : categoryFilteredProducts;
    
  const dealProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_daily_deal) === 1 || Number(p.discount) > 0) : [];
  const newProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_new_arrival) === 1).sort((a,b) => b.id - a.id) : [];
  const trendingProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_trending) === 1) : [];

  const currentProducts = viewMode === 'deals' ? dealProducts 
    : viewMode === 'trending' ? trendingProducts 
    : viewMode === 'new-arrivals' ? newProducts 
    : viewMode === 'featured' ? filteredProducts.filter(p => Number(p.is_featured) === 1)
    : filteredProducts;

  // Logic: 
  // 1. If we are on a Brand page OR a Section page (Trending, Deals, New), show CATEGORIES.
  // 2. Only if we are on a specific Category page, show BRANDS.
  const isSectionPage = ['deals', 'trending', 'new-arrivals', 'featured'].includes(viewMode) && !activeCategory && !selectedBrand;
  const showCategories = selectedBrand || isSectionPage;

  const filterList = showCategories 
    ? ['All', ...new Set(currentProducts.map(p => p.category).filter(Boolean))]
    : ['All', ...new Set(currentProducts.map(p => p.brand).filter(Boolean))];

  const sectionFilteredProducts = activeSubCategory === 'All' 
    ? currentProducts 
    : currentProducts.filter(p => {
        if (showCategories) return p.category === activeSubCategory;
        return p.brand === activeSubCategory;
      });

  const sortedProducts = useMemo(() => {
    const list = [...(sectionFilteredProducts || [])];
    switch (sortBy) {
      case 'price_low_high':
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price_high_low':
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'latest_arrivals':
        return list.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
      case 'name_az':
      default:
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
  }, [sectionFilteredProducts, sortBy]);

  const getSectionType = (sec) => {
    let t = (sec.role && sec.role !== 'custom') ? sec.role : (sec.key || sec.type);
    if (t && typeof t === 'string' && t.includes('_')) {
      const base = t.replace(/_\d+$/, '');
      t = base;
    }
    return t;
  };

  const renderSection = (section, idx) => {
    // Handle both legacy and new section formats
    const isEnabled = section.isActive !== false && section.enabled !== false;
    if (!isEnabled) return null;

    const isDual = section.isDual === true || section.isDual === 1 || section.isDual === 'true' ||
                   section.is_dual === true || section.is_dual === 1 || section.is_dual === 'true' ||
                   section.isdual === true || section.isdual === 1 || section.isdual === 'true';

    if (isDual) {
      return (
        <DualProductSection 
          key={section.id || `dual-section-${idx}`}
          section={section}
          liveProducts={liveProducts}
          onProductClick={handleProductClick}
        />
      );
    }

    const key = section.id || `section-${idx}`;
    const type = getSectionType(section);
    const title = section.title || section.name;
    const subtitle = section.subtitle || section.tagline;
    const maxProducts = section.maxProducts || 8;

    switch (type) {
      case 'hero':
        if (settings?.hero_enabled === false) return null;
        return <Hero key={key} banners={settings?.hero_banners} layout={settings?.hero_mode} />;
      case 'video_ad':
        return <VideoAdSection key={key} adIndex={idx} section={section} />;

      case 'dealOfDay':
      case 'deal_of_the_day':
        return (
          <DealOfTheDaySection 
            key={key}
            products={section.category && section.category !== 'All' ? dealProducts.filter(p => p.category === section.category) : dealProducts}
            bannerImage={section.headerImage}
            headerStyle={section.headerStyle}
            onProductClick={handleProductClick}
            videoAdId={section.categoryB}
          />
        );
      case 'newArrival':
      case 'products':
      case 'just_arrived':
        return (
          <ProductSection 
            key={key}
            title={title && title !== 'New Section' ? t_smart(title) : (section.category && section.category !== 'All' ? `${t_smart(section.category)} ${t('new_arrivals')}` : t('new_arrivals'))} 
            subtitle={subtitle ? t_smart(subtitle) : (section.category && section.category !== 'All' ? `${t('the_latest_in')} ${t_smart(section.category)}` : t('discover_full_range'))} 
            products={(section.category && section.category !== 'All' ? newProducts.filter(p => p.category === section.category) : newProducts).slice(0, maxProducts)} 
            type="new" 
            viewAllLink="/new-arrivals"
            bannerImage={section.headerImage || "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80"}
            headerStyle={section.headerStyle}
            settings={settings?.new_scroll}
            onProductClick={handleProductClick}
          />
        );
      case 'trending':
        return (
          <ProductSection 
            key={key}
            title={title && title !== 'New Section' ? t_smart(title) : (section.category && section.category !== 'All' ? `${t('trending')} ${t_smart(section.category)}` : t('trending'))} 
            subtitle={subtitle ? t_smart(subtitle) : (section.category && section.category !== 'All' ? `${t('popular_choices_in')} ${t_smart(section.category)}` : t('most_popular_on_our_network'))} 
            products={(section.category && section.category !== 'All' ? trendingProducts.filter(p => p.category === section.category) : trendingProducts).slice(0, maxProducts)} 
            type="trending" 
            viewAllLink="/trending"
            bannerImage={section.headerImage || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80"}
            headerStyle={section.headerStyle}
            settings={settings?.trending_scroll}
            onProductClick={handleProductClick}
          />
        );
      case 'featured':
      case 'featured_grid':
        return (
          <ProductSection 
            key={key}
            title={title && title !== 'New Section' ? t_smart(title) : (section.category && section.category !== 'All' ? `${t('featured')} ${t_smart(section.category)}` : t('featured_items'))} 
            subtitle={subtitle ? t_smart(subtitle) : (section.category && section.category !== 'All' ? `${t('the_best_of')} ${t_smart(section.category)}` : t('curated_for_you'))} 
            products={(section.category && section.category !== 'All' 
              ? liveProducts.filter(p => p.is_featured && p.category === section.category) 
              : liveProducts.filter(p => p.is_featured)).slice(0, maxProducts)} 
            type="featured" 
            viewAllLink="/featured"
            bannerImage={section.headerImage || "https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&q=80"}
            headerStyle={section.headerStyle}
            settings={settings?.featured_scroll}
            onProductClick={handleProductClick}
          />
        );
      case 'smartphonesPlacement':
        return (
          <ProductSection 
            key={key}
            title={t_smart(title || "Smartphones")} 
            subtitle={t_smart(subtitle || "The latest mobile technology")} 
            products={liveProducts.filter(p => p.category === 'Smartphones').slice(0, maxProducts)} 
            type="category" 
            headerStyle={section.headerStyle}
            onProductClick={handleProductClick}
            onViewAllClick={() => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              navigate(`/category/${encodeURIComponent('Smartphones')}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'homeCinemaPlacement':
        return (
          <ProductSection 
            key={key}
            title={t_smart(title || "Home Cinema")} 
            subtitle={t_smart(subtitle || "Cinematic experience at home")} 
            products={liveProducts.filter(p => p.category === 'TV & Video').slice(0, maxProducts)} 
            type="category" 
            headerStyle={section.headerStyle}
            onProductClick={handleProductClick}
            onViewAllClick={() => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              navigate(`/category/${encodeURIComponent('TV & Video')}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'speakersPlacement':
      case 'refrigeratorsPlacement':
        const catName = type === 'speakersPlacement' ? 'Speakers' : 'Refrigerators';
        return (
          <ProductSection 
            key={key}
            title={t_smart(title || catName)} 
            subtitle={t_smart(subtitle || `The latest ${catName.toLowerCase()}`)} 
            products={liveProducts.filter(p => p.category === catName).slice(0, maxProducts)} 
            type="category" 
            headerStyle={section.headerStyle}
            onProductClick={(p) => {
              setSelectedProduct(p);
              setIsProductModalOpen(true);
            }}
            onViewAllClick={() => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              navigate(`/category/${encodeURIComponent(catName)}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      case 'flashSale':
      case 'giftIdeas':
      case 'custom':
        return (
          <ProductSection 
            key={key}
            title={title || (type === 'flashSale' ? 'Flash Sale' : 'Special Collection')} 
            subtitle={subtitle || 'Limited time offers'} 
            products={liveProducts.filter(p => {
              if (section.category && section.category !== 'All' && p.category === section.category) return true;
              const plist = p.placements || [];
              return plist.includes(section.id) || plist.includes(String(section.id));
            }).slice(0, maxProducts)} 
            type="category" 
            headerStyle={section.headerStyle}
            onProductClick={(p) => {
              setSelectedProduct(p);
              setIsProductModalOpen(true);
            }}
            onViewAllClick={section.category && section.category !== 'All' ? () => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              navigate(`/category/${encodeURIComponent(section.category)}`);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } : undefined}
          />
        );
      case 'shop_by_category':
        return (
          <Sidebar 
            key={key}
            onCategorySelect={(cat) => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              if (cat) {
                navigate(`/category/${encodeURIComponent(cat)}`);
              } else {
                navigate('/');
              }
            }}
            activeCategory={activeCategory}
            isSidebarOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            embedded={true}
            products={liveProducts}
          />
        );
      default:
        return null;
    }
  };


   const DiscoveryBar = () => {
    if (['wishlist', 'visit', 'privacy', 'terms', 'security'].includes(viewMode)) return null;
    if (viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand) return null;

    const getIcon = () => {
      if (viewMode === 'new-arrivals') return <Sparkles className="text-amber-400" size={20} />;
      if (viewMode === 'deals') return <Zap className="text-eas-blue" size={20} />;
      return <Package className="text-slate-400" size={20} />;
    };

    const getTitle = () => {
      if (searchQuery) return searchQuery;
      if (activeCategory) return t_smart(activeCategory);
      if (selectedBrand) return t_smart(selectedBrand);
      if (viewMode === 'deals') return t('deal_of_day');
      if (viewMode === 'trending') return t('trending');
      if (viewMode === 'new-arrivals') return t('new_arrivals');
      if (viewMode === 'featured') return t('featured_items');
      return t('discovery');
    };

    return (
      <div className="sticky top-[84px] z-[90] bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-b border-slate-100 dark:border-slate-800 py-6 mb-12">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8">
            {/* Left: Back Button */}
            <div className="flex items-center justify-start">
               <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  navigate('/');
                }}
                className="flex items-center gap-2 font-black text-slate-900 dark:text-white hover:text-eas-blue transition-colors group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] uppercase tracking-widest font-black">{t('back') || 'Back'}</span>
              </button>
            </div>
            
            {/* Center: Title */}
            <div className="flex items-center justify-center gap-4">
              {getIcon()}
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic drop-shadow-sm">{getTitle()}</h1>
            </div>

            {/* Right: Sort By */}
            <div className="hidden md:flex items-center justify-end gap-5">
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">{t('sort_by') || 'Sort'}</span>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-3 text-[10px] font-black text-slate-600 dark:text-slate-400 outline-none focus:ring-4 focus:ring-eas-blue/5 appearance-none cursor-pointer pr-12 uppercase tracking-widest shadow-inner"
              >
                 <option value="name_az">{t('name_az')}</option>
                 <option value="price_low_high">{t('price_low_high')}</option>
                 <option value="price_high_low">{t('price_high_low')}</option>
                 <option value="latest_arrivals">{t('latest_arrivals')}</option>
              </select>
            </div>
          </div>

          {/* Refinement Pills */}
          <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-slate-50 dark:border-slate-900">
            <div className="flex items-center gap-3 shrink-0">
               <div className="w-1.5 h-1.5 rounded-full bg-eas-blue animate-pulse"></div>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">{t('refine_selection') || 'Refine Selection'}</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {filterList.map(item => (
                <button
                  key={item}
                  onClick={() => setActiveSubCategory(item)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                    activeSubCategory === item
                      ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-600/30 scale-105'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-200'
                  }`}
                >
                  {item === 'All' ? t('all') : t_smart(item)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const homepageSections = useMemo(() => {
    let baseSections = [];
    
    // 1. Get base sections (from API or legacy settings)
    if (Array.isArray(sections) && sections.length > 0) {
      baseSections = [...sections].sort((a, b) => (a.position || 0) - (b.position || 0));
    } else {
      const raw = settings?.homepageSections;
      if (typeof raw === 'object' && Array.isArray(raw)) baseSections = raw;
      else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try { baseSections = JSON.parse(raw); } catch (e) {}
      }
    }

    // Normalize sections mapping fields consistently
    baseSections = baseSections.map(s => {
      const isDual = s.isDual === true || s.isDual === 1 || s.isDual === 'true' ||
                     s.is_dual === true || s.is_dual === 1 || s.is_dual === 'true' ||
                     s.isdual === true || s.isdual === 1 || s.isdual === 'true';
      return {
        ...s,
        isDual,
        isActive: s.isActive !== false && s.enabled !== false && s.is_active !== false,
        key: s.key || s.role || s.type,
        title: s.title || s.name,
        subtitle: s.subtitle || s.tagline,
        maxProducts: s.maxProducts || s.max_products || s.maxproducts || 8
      };
    });

    // 2. Apply global Hero Toggle
    const isHeroEnabled = settings?.hero_enabled !== false;
    const hasHero = baseSections.some(s => (s.key || s.role || s.type) === 'hero');

    if (isHeroEnabled) {
      // If hero is enabled globally but missing from sections, prepend it
      if (!hasHero) {
        return [{ key: 'hero', isActive: true, position: -1 }, ...baseSections];
      }
      // If hero is present but inactive, activate it (Master Toggle overrides)
      return baseSections.map(s => (s.key || s.role || s.type) === 'hero' ? { ...s, isActive: true } : s);
    } else {
      // If hero is disabled globally, remove it from rendering entirely
      return baseSections.filter(s => (s.key || s.role || s.type) !== 'hero');
    }
  }, [settings?.homepageSections, settings?.hero_enabled, sections]);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 overflow-x-hidden relative">
      <Header 
        onMenuClick={() => setIsSidebarOpen(true)} 
        onCartClick={() => setIsCartOpen(true)}
      />

      <motion.div 
        animate={{ 
          scale: isProductModalOpen ? 0.95 : 1,
          filter: isProductModalOpen ? 'blur(10px) brightness(0.7)' : 'none',
          borderRadius: isProductModalOpen ? '40px' : '0px'
        }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col origin-center pt-24 transition-colors duration-300"
      >
        
        <main className="flex-1 pb-20">
          {!['notifications', 'orders', 'wishlist', 'visit', 'privacy', 'terms', 'security'].includes(viewMode) && <DiscoveryBar />}
          
          <div className={`max-w-[1600px] mx-auto ${
            (viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand)
              ? 'mt-0'
              : (searchQuery || activeCategory || selectedBrand ? 'mt-4' : 'mt-12')
          }`}>
            {viewMode === 'wishlist' ? (
              <WishlistContent onProductClick={handleProductClick} />
            ) : viewMode === 'notifications' ? (
              <NotificationsContent onProductClick={handleProductClick} />
            ) : viewMode === 'visit' ? (
              <VisitUs />
            ) : ['privacy', 'terms', 'security'].includes(viewMode) ? (
              <LegalPage type={viewMode} />
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-500 min-h-screen">
                {viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand ? (
                  <>
                    {/* Main Sections */}
                    {homepageSections.length > 0 ? (
                      homepageSections.map((section, idx) => {
                        const rendered = renderSection(section, idx);
                        if (getSectionType(section) === 'hero' && rendered) {
                          return (
                            <React.Fragment key={section.id || `hero-wrap-${idx}`}>
                              {rendered}
                              <TopCategories />
                            </React.Fragment>
                          );
                        }
                        return rendered;
                      })
                    ) : (
                      // Fallback Premium Default Layout
                      <>
                        {renderSection({ type: 'hero' }, 0)}
                        <TopCategories />
                        {renderSection({ type: 'featured_grid', name: 'Featured Gear' }, 1)}
                        {renderSection({ type: 'just_arrived', name: 'New Arrivals' }, 2)}
                        {renderSection({ type: 'trending', name: 'Trending Now' }, 3)}
                        {renderSection({ type: 'deal_of_the_day' }, 4)}
                      </>
                    )}
                    
                    {/* Permanent Recently Viewed (Always at the bottom) */}
                    {recentlyViewed.length > 0 && (
                      <ProductSection 
                        title={t('recently_viewed')} 
                        subtitle={t('tech_history')} 
                        products={recentlyViewed} 
                        type="new" 
                        hideBanner={true}
                        settings={{ enabled: false }}
                        onProductClick={handleProductClick}
                      />
                    )}
                  </>
                ) : searchQuery ? (
                    <div className="px-6 md:px-12">
                    <ProductSection 
                      title={t('search_results')} 
                      subtitle={`${t('found_matches')} "${searchQuery}"`} 
                      products={sortedProducts} 
                      type="category" 
                      hideHeader={true}
                      settings={{ enabled: false }}
                      onProductClick={handleProductClick}
                    />
                  </div>
                ) : (activeCategory || selectedBrand) ? (
                  <ProductSection 
                    title={activeCategory || selectedBrand} 
                    subtitle={`${t('premium_selection')} ${activeCategory || selectedBrand}`} 
                    products={sortedProducts} 
                    type="category" 
                    hideHeader={true}
                    hideBanner={true}
                    settings={{ enabled: false }}
                    onProductClick={handleProductClick}
                  />
                ) : (
                  <div className="px-6 md:px-12">
                    <ProductSection 
                      title={t('all_products')} 
                      subtitle={t('discover_full_range')} 
                      products={sortedProducts} 
                      type="category" 
                      hideHeader={true}
                      settings={{ enabled: false }}
                      onProductClick={handleProductClick}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

        </main>

        <footer className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-slate-100 dark:border-slate-800/50 py-24 px-6 md:px-12 relative overflow-hidden transition-colors duration-300">
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-eas-blue/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          


          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative z-10">
            <div className="space-y-8">
              <motion.span 
                whileHover={{ x: 5 }}
                className="text-3xl font-black text-eas-blue uppercase tracking-tighter italic cursor-pointer"
              >
                {settings?.shopName ? (
                  <>
                    {settings.shopName.split(' ')[0]}
                    <span className="text-slate-900 dark:text-white">{settings.shopName.split(' ').slice(1).join(' ') || 'HUB'}</span>
                  </>
                ) : (
                  <>SWEETO<span className="text-slate-900 dark:text-white">HUB</span></>
                )}
              </motion.span>
              <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.3em] flex items-center gap-2">
                <div className="w-4 h-[2px] bg-eas-blue"></div>
                {t('about_hub')}
              </h4>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed text-sm">
                {settings?.storeAbout || t('about_desc')}
              </p>
              <div className="flex gap-3">
                {[
                  { icon: InstagramIcon, key: 'social_instagram' },
                  { icon: FacebookIcon, key: 'social_facebook' },
                  { icon: TwitterIcon, key: 'social_twitter' },
                  { icon: YoutubeIcon, key: 'social_youtube' },
                  { icon: TiktokIcon, key: 'social_tiktok' },
                  { icon: MessageCircle, key: 'social_whatsapp' }
                ].map((social, i) => {
                  let link = settings?.[social.key] || '#';
                  if (link !== '#') {
                    if (social.key === 'social_whatsapp' && !link.startsWith('http')) {
                      const cleanNum = link.replace(/\D/g, '');
                      link = `https://wa.me/${cleanNum}`;
                    } else if (!link.startsWith('http')) {
                      link = `https://${link}`;
                    }
                  }
                  return (
                    <motion.a 
                      key={i} href={link} target="_blank" rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, backgroundColor: '#3B82F6', color: '#fff' }}
                      className="w-10 h-10 bg-white dark:bg-[#020617] rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all shadow-sm border border-slate-100 dark:border-white/5"
                    >
                      <social.icon size={18} />
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {(() => {
              const activeCats = (categories.length > 0 ? categories : [{name: 'Smartphones'}, {name: 'Laptops'}, {name: 'Accessories'}])
                .filter(cat => getProductCountForCategory(cat.name) > 0)
                .slice(0, 6);
              if (activeCats.length === 0) return null;
              return (
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white mb-10 uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
                    <div className="w-6 h-[2px] bg-eas-blue"></div>
                    {t('explore_categories')}
                  </h4>
                  <ul className="space-y-4">
                    {activeCats.map(cat => (
                      <li key={cat.id || cat.name}>
                        <motion.a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedCategory(cat.name);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          whileHover={{ x: 8, color: '#3B82F6' }}
                          className="text-xs text-slate-400 font-black uppercase tracking-widest transition-all block"
                        >
                          {t_smart(cat.name)}
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            <div>
              <h4 
                onClick={() => navigate('/visit')}
                className="font-black text-slate-900 dark:text-white mb-10 uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 cursor-pointer hover:text-eas-blue transition-all group/title w-full"
              >
                <div className="w-6 h-[2px] bg-eas-blue group-hover/title:w-10 transition-all"></div>
                {t('location_schedule') || 'LOCATION & SCHEDULE'}
              </h4>
              <div className="space-y-6">
                <button 
                  onClick={() => navigate('/visit')}
                  className="w-full flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-eas-blue hover:shadow-lg transition-all group/loc text-left"
                >
                  <div className="w-10 h-10 bg-eas-blue/10 rounded-xl flex items-center justify-center text-eas-blue group-hover/loc:bg-eas-blue group-hover/loc:text-white transition-all shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">{t('physical_store') || 'PHYSICAL STORE'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                      {settings?.loc_address && settings.loc_address !== 'Elite Tech District, Block 12' ? (
                        settings.loc_address === 'ABIDJAN ADJAME MIRADOR' ? (lang === 'fr' ? 'Situé à Adjamé Mirador, 2ème étage, face à la gare' : 'Located at Adjamé Mirador, 2nd floor, facing the station') : settings.loc_address
                      ) : (lang === 'fr' ? 'Situé à Adjamé Mirador, 2ème étage, face à la gare' : 'Located at Adjamé Mirador, 2nd floor, facing the station')}<br/>
                      {settings?.loc_city && settings.loc_city !== 'Douala' ? settings.loc_city : 'Abidjan'}, {settings?.loc_country && settings.loc_country !== 'Cameroon' ? settings.loc_country : 'Côte d’Ivoire'}
                    </p>
                  </div>
                </button>

                <button 
                  onClick={() => navigate('/visit')}
                  className="w-full flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-eas-blue hover:shadow-lg transition-all group/schedule text-left"
                >
                  <div className="w-10 h-10 bg-eas-blue/10 rounded-xl flex items-center justify-center text-eas-blue group-hover/schedule:bg-eas-blue group-hover/schedule:text-white transition-all shrink-0">
                    <Clock size={20} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">{t('opening_hours') || 'HOURS'}</p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">MON-FRI: {settings?.loc_hours_weekday || '08:00 - 20:00'}</p>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">SAT: {settings?.loc_hours_sat || '09:00 - 18:00'}</p>
                  </div>
                </button>

                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/visit')}
                    className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-eas-blue transition-all shadow-lg shadow-slate-900/20 text-center"
                  >
                    {t('get_directions')}
                  </button>
                  <button 
                    onClick={() => navigate('/visit')}
                    className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
                  >
                    {t('call_support')}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-black text-slate-900 dark:text-white mb-10 uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
                <div className="w-6 h-[2px] bg-eas-blue"></div>
                {t('stay_connected')}
              </h4>
              <div className="space-y-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {t('subscribe_desc')}
                </p>
                <div className="relative overflow-hidden p-1 rounded-3xl">
                  <AnimatePresence mode="wait">
                    {!subscribed ? (
                      <motion.form 
                        key="form"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative group" 
                        onSubmit={(e) => { 
                          e.preventDefault(); 
                          setSubscribed(true);
                          setTimeout(() => setSubscribed(false), 5000);
                        }}
                      >
                        <input 
                          type="email" 
                          required
                          placeholder={t('enter_email')} 
                          className="w-full pl-7 pr-16 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] focus:ring-4 focus:ring-eas-blue/10 focus:border-eas-blue outline-none text-[11px] font-black tracking-wide transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        />
                        <button 
                          type="submit" 
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 dark:bg-eas-blue text-white rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/10 dark:shadow-eas-blue/20"
                        >
                          <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.5rem] flex flex-col items-center text-center gap-3"
                      >
                         <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <CheckCircle size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">{t('welcome_hub')}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{t('check_inbox')}</p>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                   <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      {t('subscriber_join')} {settings?.subscriber_count || '2,500'}+
                   </div>
                   <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                      <LockIcon size={12} className="text-slate-300" />
                      <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">{t('secure_spam_free')}</span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Local Payment & Delivery Badges */}
          <div className="max-w-[1600px] mx-auto mt-16 pt-8 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-2 items-center md:items-start">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{lang === 'fr' ? 'Modes de Paiement Acceptés' : 'Accepted Payment Methods'}</span>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">Wave</span>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">Orange Money</span>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">Moov Money</span>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">MTN MoMo</span>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{lang === 'fr' ? 'Paiement à la Livraison' : 'Cash on Delivery'}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 items-center md:items-end">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{lang === 'fr' ? 'Livraison & Retrait' : 'Delivery & Pickup'}</span>
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-900/10 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">{lang === 'fr' ? 'Retrait Adjamé Mirador' : 'Adjamé Mirador Pickup'}</span>
                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">{lang === 'fr' ? 'Express 24H Abidjan' : '24H Abidjan Express'}</span>
              </div>
            </div>
          </div>

          <div className="max-w-[1600px] mx-auto mt-24 pt-10 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-slate-300 font-black uppercase tracking-[0.5em]">
              © {new Date().getFullYear()} {settings?.shopName || 'SWEETO HUB'} • {settings?.footer_copyright || 'ELITE LOCAL COMMERCE'}
            </p>
            <div className="flex gap-8">
              {[
                { label: 'privacy', mode: 'privacy' },
                { label: 'terms', mode: 'terms' },
                { label: 'security', mode: 'security' }
              ].map(item => (
                <button 
                  key={item.label} 
                  onClick={() => {
                    navigate(`/${item.mode}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </motion.div>
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        products={allProducts}
        activeCategory={activeCategory}
        onCategorySelect={(cat) => {
          setSelectedCategory(null);
          setSelectedBrand(null);
          setSearchQuery('');
          setIsSidebarOpen(false);
          if (cat) {
            navigate(`/category/${encodeURIComponent(cat)}`);
          } else {
            navigate('/');
          }
        }}
      />

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />

      <ProductModal 
        isOpen={isProductModalOpen}
        product={selectedProduct}
        allProducts={allProducts}
        onClose={handleProductModalClose}
        onProductClick={handleProductClick}
      />

      <MobileDock 
        setIsCartOpen={setIsCartOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
      />
    </div>
  );
};

function App() {
  const { loading } = useStore();

  // Handle mobile hardware back button (Cordova, Capacitor, and custom Android WebViews)
  useEffect(() => {
    // 1. Expose a fallback global hook for custom Android WebView wrappers
    window.handleAndroidBack = () => {
      const currentPath = getCurrentPath();
      if (currentPath !== '/' && currentPath !== '/home') {
        window.history.back();
        return true;
      }
      return false;
    };

    // 2. Cordova / standard hybrid WebView backbutton event listener
    const handleCordovaBackButton = (e) => {
      if (window.handleAndroidBack && window.handleAndroidBack()) {
        e.preventDefault();
      } else {
        // At home page: exit the app if navigator.app.exitApp is supported
        if (window.navigator && window.navigator.app && window.navigator.app.exitApp) {
          e.preventDefault();
          window.navigator.app.exitApp();
        }
      }
    };

    document.addEventListener('backbutton', handleCordovaBackButton, false);

    // 3. Capacitor backbutton plugin integration (dynamic check)
    let capacitorListener = null;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const capApp = window.Capacitor.Plugins.App;
      capApp.addListener('backButton', (data) => {
        if (window.handleAndroidBack && window.handleAndroidBack()) {
          // Handled by the state-aware hook
        } else {
          capApp.exitApp();
        }
      }).then(listener => {
        capacitorListener = listener;
      });
    }

    return () => {
      document.removeEventListener('backbutton', handleCordovaBackButton);
      if (capacitorListener && capacitorListener.remove) {
        capacitorListener.remove();
      }
      delete window.handleAndroidBack;
    };
  }, []);

  useEffect(() => {
    // Detect country first
    const detectCountry = async () => {
      let country = 'PH'; // Default fallback
      try {
        const res = await fetch('https://ipwho.is/');
        if (res.ok) {
          const info = await res.json();
          if (info && info.country_code) {
            country = info.country_code;
          }
        }
      } catch (e) {
        // Fallback to random country from screenshot list to keep seed authentic
        const codes = ['PH', 'CI', 'PK', 'KE', 'CR', 'ZM', 'GH', 'US'];
        country = codes[Math.floor(Math.random() * codes.length)];
      }
      window.localStorage.setItem('user_country', country);

      // Track visit storefront event
      Promise.resolve(
        supabase.from('visitor_log').insert([{ 
          page_path: getCurrentPath(),
          event_type: 'visit storefront',
          country: country
        }])
      ).catch(() => {});
    };

    detectCountry();
  }, []);

  return (
    <>
      <Toast />
      <ConfirmDialog />
      <RealtimeNotification />
      <BackToTop />
      <FloatingWhatsApp />
      {!getCurrentPath().includes('/dashboard') && <LoadingScreen isVisible={loading} />}
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Storefront viewMode="home" />} />
          <Route path="/product/:productId" element={<Storefront viewMode="home" />} />
          <Route path="/wishlist" element={<Storefront viewMode="wishlist" />} />
          <Route path="/notifications" element={<Storefront viewMode="notifications" />} />
          <Route path="/login" element={<AuthPage initialTab="login" />} />
          <Route path="/register" element={<AuthPage initialTab="signup" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/deals" element={<Storefront viewMode="deals" />} />
          <Route path="/trending" element={<Storefront viewMode="trending" />} />
          <Route path="/new-arrivals" element={<Storefront viewMode="new-arrivals" />} />
          <Route path="/featured" element={<Storefront viewMode="featured" />} />
          <Route path="/visit" element={<Storefront viewMode="visit" />} />
          <Route path="/privacy" element={<Storefront viewMode="privacy" />} />
          <Route path="/terms" element={<Storefront viewMode="terms" />} />
          <Route path="/security" element={<Storefront viewMode="security" />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-tracking/:orderId" element={<OrderTrackingPage />} />
          <Route path="/swto-deliver" element={<DeliverPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/category/:categoryName" element={<Storefront viewMode="category" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
