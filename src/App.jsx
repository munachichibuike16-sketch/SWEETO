import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, Navigate, useParams, useLocation } from 'react-router-dom';
import { ChevronDown, Zap, Globe, ArrowLeft, Sparkles, Package, MessageCircle, MapPin, Send, Clock, Lock as LockIcon, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import Hero from './components/Hero';
import TopCategories from './components/TopCategories';
import Sidebar from './components/Sidebar';
import ProductSection, { SectionBanner, DualProductSection } from './components/ProductSection';
import ProductCard from './components/ProductCard';
import CartDrawer from './components/CartDrawer';
import ProductModal from './components/ProductModal';
import WishlistContent from './components/WishlistContent';
import NotificationsContent from './components/NotificationsContent';
import StoreContent from './components/StoreContent';
import DealsContent from './components/DealsContent';
import BrightRetailHome from './components/BrightRetailHome';
import CategoryLandingPage from './components/CategoryLandingPage';
import ShufflingProductPage from './components/ShufflingProductPage';
import AuthPage from './pages/AuthPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import DeliverPage from './pages/DeliverPage';
import Dashboard from './pages/Dashboard';
import VisitUs from './pages/VisitUs';
import LegalPage from './pages/LegalPage';
import { getCategoryDescendants } from './utils/categoryHelpers';
import ScrollToTop from './components/ScrollToTop';
import RealtimeNotification from './components/RealtimeNotification';
import ProductDetailPage from './pages/ProductDetailPage';
import GlobalLightbox from './components/GlobalLightbox';
import BackToTop from './components/BackToTop';
import SwipeGestures from './components/SwipeGestures';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import { useStore } from './contexts/StoreContext';
import { useLanguage } from './contexts/LanguageContext';
import { supabase } from './lib/supabase';

const shuffleArray = (array) => {
  const arr = [...(array || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

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
        className="bg-white/90 dark:bg-[#020617]/90 backdrop-blur-3xl border border-slate-100 dark:border-eas-blue/15 shadow-[0_20px_50px_rgba(0,82,255,0.05)] px-8 py-4 rounded-3xl flex items-center gap-4 pointer-events-auto"
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
  
  const { products: liveProducts, categories, searchQuery, setSearchQuery, imageSearchResults, setImageSearchResults, selectedCategory, setSelectedCategory, selectedBrand, setSelectedBrand, settings, recentlyViewed, sections } = useStore();
  const { t, t_smart, lang } = useLanguage();

  const getProductCountForCategory = (catName) => {
    if (!catName) return 0;
    const descendants = getCategoryDescendants(catName, categories);
    const matchNames = [catName.toLowerCase(), ...descendants];
    return liveProducts?.filter(p => p.category && matchNames.includes(p.category.toLowerCase()) && p.status === 'active').length || 0;
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

  // Listen for template-specific category & routing triggers
  useEffect(() => {
    const handleSelectCategory = (e) => {
      setSelectedCategory(e.detail);
      setSelectedBrand(null);
      setSearchQuery('');
      setViewMode('home');
    };
    const handleViewAllProducts = () => {
      setSelectedCategory(null);
      setSelectedBrand(null);
      setSearchQuery('');
      setViewMode('products');
    };

    window.addEventListener('select-category', handleSelectCategory);
    window.addEventListener('view-all-products', handleViewAllProducts);

    return () => {
      window.removeEventListener('select-category', handleSelectCategory);
      window.removeEventListener('view-all-products', handleViewAllProducts);
    };
  }, []);

  // 2. Scroll to top on navigation/filter change
  useEffect(() => {
    window.scrollTo(0, 0);
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

  useEffect(() => {
    if (!searchQuery) {
      setImageSearchResults(null);
    }
  }, [searchQuery, setImageSearchResults]);

  let allProducts = liveProducts;
  
  const searchFilteredProducts = (() => {
    if (imageSearchResults) {
      return imageSearchResults;
    }
    return (searchQuery && Array.isArray(allProducts))
      ? allProducts.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : (Array.isArray(allProducts) ? allProducts : []);
  })();

  const categoryFilteredProducts = (() => {
    if (!activeCategory || !Array.isArray(searchFilteredProducts)) {
      return searchFilteredProducts;
    }
    const descendants = getCategoryDescendants(activeCategory, categories);
    const matchNames = [activeCategory.toLowerCase(), ...descendants];
    return searchFilteredProducts.filter(p => {
      const pCat = p.category?.toLowerCase();
      return pCat && matchNames.includes(pCat);
    });
  })();

  const filteredProducts = (selectedBrand && Array.isArray(categoryFilteredProducts))
    ? categoryFilteredProducts.filter(p => p.brand === selectedBrand)
    : categoryFilteredProducts;
    
  const dealProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_daily_deal) === 1 || p.is_daily_deal === true || String(p.is_daily_deal) === 'true') : [];
  const newProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_new_arrival) === 1 || p.is_new_arrival === true || String(p.is_new_arrival) === '1' || String(p.is_new_arrival) === 'true').sort((a,b) => b.id - a.id) : [];
  const trendingProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_trending) === 1 || p.is_trending === true || String(p.is_trending) === '1' || String(p.is_trending) === 'true') : [];
  const featuredProducts = Array.isArray(filteredProducts) ? filteredProducts.filter(p => Number(p.is_featured) === 1 || p.is_featured === true || String(p.is_featured) === '1' || String(p.is_featured) === 'true') : [];

  const shuffledTrending = useMemo(() => {
    return shuffleArray(trendingProducts);
  }, [viewMode === 'trending', trendingProducts.length]);

  const shuffledFeatured = useMemo(() => {
    return shuffleArray(featuredProducts);
  }, [viewMode === 'featured', featuredProducts.length]);

  const currentProducts = viewMode === 'deals' ? dealProducts 
    : viewMode === 'trending' ? shuffledTrending 
    : viewMode === 'new-arrivals' ? newProducts 
    : viewMode === 'featured' ? shuffledFeatured
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
      // Check if dual section actually has explicitly placed products
      const sideAHasProducts = liveProducts.some(p => {
        const plist = p.placements || [];
        return plist.includes(`${section.id}-A`) || plist.includes(section.id) || plist.includes(String(section.id));
      });
      const sideBHasProducts = liveProducts.some(p => {
        const plist = p.placements || [];
        return plist.includes(`${section.id}-B`);
      });
      if (!sideAHasProducts && !sideBHasProducts) return null;

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

    // Check if product-based section has 0 products
    const isProductBased = ['dealOfDay', 'deal_of_the_day', 'newArrival', 'products', 'just_arrived', 'trending', 'featured', 'featured_grid', 'smartphonesPlacement', 'homeCinemaPlacement', 'speakersPlacement', 'refrigeratorsPlacement', 'flashSale', 'giftIdeas', 'custom'].includes(type);
    
    if (isProductBased) {
      let prods = [];
      if (type === 'dealOfDay' || type === 'deal_of_the_day') {
        prods = section.category && section.category !== 'All' ? dealProducts.filter(p => p.category === section.category) : dealProducts;
      } else if (type === 'newArrival' || type === 'products' || type === 'just_arrived') {
        prods = (section.category && section.category !== 'All' ? newProducts.filter(p => p.category === section.category) : newProducts).slice(0, maxProducts);
      } else if (type === 'trending') {
        prods = (section.category && section.category !== 'All' ? trendingProducts.filter(p => p.category === section.category) : trendingProducts).slice(0, maxProducts);
      } else if (type === 'featured' || type === 'featured_grid') {
        prods = (section.category && section.category !== 'All' 
          ? liveProducts.filter(p => p.is_featured && p.category === section.category) 
          : liveProducts.filter(p => p.is_featured)).slice(0, maxProducts);
      } else if (type === 'smartphonesPlacement') {
        prods = liveProducts.filter(p => p.category === 'Smartphones').slice(0, maxProducts);
      } else if (type === 'homeCinemaPlacement') {
        prods = liveProducts.filter(p => p.category === 'TV & Video').slice(0, maxProducts);
      } else if (type === 'speakersPlacement' || type === 'refrigeratorsPlacement') {
        const catName = type === 'speakersPlacement' ? 'Speakers' : 'Refrigerators';
        prods = liveProducts.filter(p => p.category === catName).slice(0, maxProducts);
      } else if (type === 'flashSale' || type === 'giftIdeas' || type === 'custom') {
        const assigned = liveProducts.filter(p => {
          const plist = p.placements || [];
          return plist.includes(section.id) || plist.includes(String(section.id)) || plist.includes(`${section.id}-A`);
        });
        prods = assigned.slice(0, maxProducts);
      }
      
      if (!prods || prods.length === 0) return null;
    }

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
            onCartClick={() => setIsCartOpen(true)}
            title={title}
            subtitle={subtitle}
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
              window.scrollTo(0, 0);
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
              window.scrollTo(0, 0);
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
            onProductClick={handleProductClick}
            onViewAllClick={() => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              navigate(`/category/${encodeURIComponent(catName)}`);
              window.scrollTo(0, 0);
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
            products={(() => {
              const assigned = liveProducts.filter(p => {
                const plist = p.placements || [];
                return plist.includes(section.id) || plist.includes(String(section.id)) || plist.includes(`${section.id}-A`);
              });
              return assigned.slice(0, maxProducts);
            })()} 
            type="category" 
            headerStyle={section.headerStyle}
            onProductClick={handleProductClick}
            onViewAllClick={() => {
              setSelectedCategory(null);
              setSelectedBrand(null);
              setSearchQuery('');
              if (section.category && section.category !== 'All') {
                navigate(`/category/${encodeURIComponent(section.category)}`);
              } else if (type === 'flashSale') {
                navigate('/deals');
              } else if (type === 'giftIdeas') {
                navigate('/featured');
              } else {
                navigate('/new-arrivals');
              }
              window.scrollTo(0, 0);
            }}
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
    if (['wishlist', 'visit', 'privacy', 'terms', 'security', 'deals', 'settings', 'auth', 'login', 'signup'].includes(viewMode)) return null;
    if (viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand) return null;
    if (activeCategory) return null; // CategoryLandingPage renders its own themed banner, deals, and pills.

    const getTitle = () => {
      if (searchQuery) return searchQuery;
      if (activeCategory) return t_smart(activeCategory);
      if (selectedBrand) return t_smart(selectedBrand);
      if (viewMode === 'deals') return lang === 'fr' ? 'Super Offres' : 'Super Deals';
      if (viewMode === 'trending') return t('trending');
      if (viewMode === 'new-arrivals') return t('new_arrivals');
      if (viewMode === 'featured') return t('featured_items');
      return t('discovery');
    };

    const bannerImage = viewMode === 'new-arrivals' 
      ? "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&q=80&w=1000"
      : "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000";

    return (
      <div className="w-full max-w-[1600px] mx-auto px-0 py-2 flex flex-col gap-4">
        {/* Back Button */}
        <div className="px-3 md:px-12">
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory(null);
              setSelectedBrand(null);
              navigate(-1);
            }}
            className="flex items-center gap-2 font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] uppercase tracking-widest font-black">{t('back') || 'Back'}</span>
          </button>
        </div>

        {/* Hero Banner (AliExpress Style) */}
        <div className="relative w-[calc(100%-24px)] mx-3 md:w-full md:mx-0 h-[140px] sm:h-[220px] md:h-[300px] lg:h-[380px] xl:h-[450px] rounded-[1.8rem] sm:rounded-[2.2rem] md:rounded-[2.8rem] overflow-hidden shadow-2xl flex items-center bg-slate-950">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src={bannerImage} 
              alt={getTitle()} 
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
              {getTitle()} finds
            </h1>
            <p className="text-[9px] sm:text-[11px] md:text-sm lg:text-base font-bold text-white/90 uppercase tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] font-sans mt-1">
              Discover {getTitle()} collection today
            </p>
          </div>
        </div>

        {/* Category Filter Pills (AliExpress style) */}
        {filterList.length > 1 && (
          <div className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-3 md:px-0 select-none">
            {filterList.map(item => {
              const isSelected = activeSubCategory === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveSubCategory(item)}
                  className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-slate-950 text-white border-slate-950 dark:bg-white dark:text-slate-950 dark:border-white shadow-md'
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-450 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item === 'All' ? (
                    <span className="flex items-center gap-1">
                      <Heart size={10} className="fill-[#ff3b30] text-[#ff3b30]" />
                      {lang === 'fr' ? 'Tout' : 'All'}
                    </span>
                  ) : t_smart(item)}
                </button>
              );
            })}
          </div>
        )}
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
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-eas-light dark:bg-eas-dark relative">
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
        className="min-h-screen w-full max-w-full overflow-x-hidden bg-eas-light dark:bg-eas-dark flex flex-col origin-center transition-colors duration-300"
        style={{ paddingTop: 'var(--header-height, 96px)' }}
      >
        
        <main className="flex-1 pb-20">
          {!['notifications', 'orders', 'wishlist', 'visit', 'privacy', 'terms', 'security', 'products', 'trending', 'featured', 'auth', 'login', 'signup', 'deals', 'settings'].includes(viewMode) && <DiscoveryBar />}
          
          <div className={`max-w-[1600px] mx-auto ${
            (viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand)
              ? 'mt-0'
              : (searchQuery || activeCategory || selectedBrand ? 'mt-4' : 'mt-12')
          }`}>
            {viewMode === 'wishlist' ? (
              <WishlistContent onProductClick={handleProductClick} />
            ) : viewMode === 'deals' ? (
              <DealsContent onProductClick={handleProductClick} />
            ) : viewMode === 'notifications' ? (
              <NotificationsContent onProductClick={handleProductClick} />
            ) : viewMode === 'visit' ? (
              <VisitUs />
            ) : viewMode === 'products' ? (
              <StoreContent />
            ) : ['privacy', 'terms', 'security'].includes(viewMode) ? (
              <LegalPage type={viewMode} />
            ) : ['trending', 'featured'].includes(viewMode) ? (
              <ShufflingProductPage viewMode={viewMode} onProductClick={handleProductClick} />
            ) : ['auth', 'login', 'signup', 'settings'].includes(viewMode) ? (
              <AuthPage 
                initialTab={viewMode === 'settings' ? 'settings' : (viewMode === 'signup' ? 'signup' : (viewMode === 'login' ? 'login' : undefined))} 
                onCartClick={() => setIsCartOpen(true)}
              />
            ) : (
              <div className="bg-eas-light dark:bg-eas-dark transition-colors duration-500 min-h-screen">
                {viewMode === 'home' && !searchQuery && !activeCategory && !selectedBrand ? (
                  settings?.active_template === 'bright' ? (
                    <BrightRetailHome onProductClick={handleProductClick} />
                  ) : (
                    <>
                      {/* Header Block: Hero */}
                      {(() => {
                        const heroSection = homepageSections.find(s => getSectionType(s) === 'hero');
                        if (homepageSections.length > 0) {
                          return heroSection && renderSection(heroSection, homepageSections.indexOf(heroSection));
                        } else {
                          return renderSection({ type: 'hero' }, 0);
                        }
                      })()}

                      {/* Interleaved Content Sections & Products */}
                      {(() => {
                        const activeProducts = liveProducts?.filter(p => p.status === 'active' && p.stock > 0) || [];
                        
                        // Filter out hero and inactive/disabled sections from content sections
                        const contentSections = homepageSections.length > 0
                          ? homepageSections.filter(s => getSectionType(s) !== 'hero' && s.isActive !== false && s.enabled !== false)
                          : [
                              { type: 'featured_grid', name: 'Featured Gear' },
                              { type: 'just_arrived', name: 'New Arrivals' },
                              { type: 'trending', name: 'Trending Now' },
                              { type: 'deal_of_the_day' }
                            ];

                        // Pre-render sections to filter out empty/disabled ones
                        const renderedSections = [];
                        contentSections.forEach((section, idx) => {
                          const originalIdx = homepageSections.length > 0 ? homepageSections.indexOf(section) : idx + 1;
                          const rendered = renderSection(section, originalIdx);
                          if (rendered) {
                            renderedSections.push({
                              id: section.id || idx,
                              element: rendered
                            });
                          }
                        });

                        const elements = [];
                        let productIndex = 0;

                        renderedSections.forEach((sec) => {
                          // First, show 2 products before this section (starts right under Top Categories)
                          if (productIndex < activeProducts.length) {
                            const pair = activeProducts.slice(productIndex, productIndex + 2);
                            elements.push(
                              <div key={`pair-before-${sec.id}`} className="my-0 px-4 md:px-0">
                                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                  {pair.map(product => (
                                    <div key={product.id} className="border-2 border-blue-600/40 dark:border-blue-500/40 rounded-[2rem] overflow-hidden p-1 bg-white dark:bg-slate-900 shadow-md">
                                      <ProductCard 
                                        product={product} 
                                        onProductClick={handleProductClick} 
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                            productIndex += 2;
                          }

                          // Then show the section itself
                          elements.push(<React.Fragment key={`section-frag-${sec.id}`}>{sec.element}</React.Fragment>);
                        });

                        // Finally, continue rendering remaining products in pairs of 2 until exhausted
                        while (productIndex < activeProducts.length) {
                          const pair = activeProducts.slice(productIndex, productIndex + 2);
                          elements.push(
                            <div key={`pair-after-sections-${productIndex}`} className="my-0 px-4 md:px-0">
                              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                {pair.map(product => (
                                  <div key={product.id} className="border-2 border-blue-600/40 dark:border-blue-500/40 rounded-[2rem] overflow-hidden p-1 bg-white dark:bg-slate-900 shadow-md">
                                    <ProductCard 
                                      product={product} 
                                      onProductClick={handleProductClick} 
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                          productIndex += 2;
                        }

                        return elements;
                      })()}
                      
                      {/* Permanent Recommended for You - Removed from home page per user request */}
                      {/*
                      {(() => {
                        const recommendedProducts = liveProducts
                          ?.filter(p => p.is_featured || p.is_trending)
                          .slice(0, 10);
                        if (!recommendedProducts || recommendedProducts.length === 0) return null;
                        return (
                          <div className="mt-12 border-t border-slate-100 dark:border-white/5 pt-12">
                            <ProductSection 
                              title={lang === 'fr' ? 'Recommandé pour vous' : 'Recommended for you'} 
                              subtitle={lang === 'fr' ? 'Sélectionné spécialement pour vous' : 'Selected especially for you'} 
                              products={recommendedProducts} 
                              type="trending" 
                              hideBanner={true}
                              settings={{ enabled: false }}
                              onProductClick={handleProductClick}
                            />
                          </div>
                        );
                      })()}
                      */}

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
                  )
                ) : (
                  <>
                    {searchQuery ? (
                      <div className="px-0 md:px-12">
                        {sortedProducts.length > 0 ? (
                          <ProductSection 
                            title={t('search_results')} 
                            subtitle={`${t('found_matches')} "${searchQuery}"`} 
                            products={sortedProducts} 
                            type="category" 
                            hideHeader={true}
                            settings={{ enabled: false }}
                            onProductClick={handleProductClick}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/80 shadow-sm max-w-lg mx-auto my-8 animate-fadeIn">
                            <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-6 border border-slate-100 dark:border-slate-700/60 shadow-inner">
                              <i className="fa-solid fa-magnifying-glass-minus text-3xl animate-pulse"></i>
                            </div>
                            <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-wider mb-2">
                              NOTHING TO SHOW
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold max-w-sm leading-relaxed mb-6">
                              We couldn't find any products matching "{searchQuery}". Try using different terms or another image!
                            </p>
                            <button
                              onClick={() => {
                                setSearchQuery('');
                                setImageSearchResults(null);
                              }}
                              className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              Clear Search
                            </button>
                          </div>
                        )}
                      </div>
                    ) : activeCategory ? (
                      <CategoryLandingPage 
                        categoryName={activeCategory} 
                        products={liveProducts}
                        categories={categories}
                        settings={settings}
                        onProductClick={handleProductClick}
                      />
                    ) : selectedBrand ? (
                      <ProductSection 
                        title={selectedBrand} 
                        subtitle={`${t('premium_selection')} ${selectedBrand}`} 
                        products={sortedProducts} 
                        type="category" 
                        hideHeader={true}
                        hideBanner={true}
                        settings={{ enabled: false }}
                        onProductClick={handleProductClick}
                      />
                    ) : (
                      <div className="px-0 md:px-12">
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

                    {/* AliExpress-Style "Recommended for You" section below the results */}
                    {(() => {
                      const displayedIds = new Set(sortedProducts.map(p => p.id));
                      const recommendedProducts = liveProducts
                        ?.filter(p => !displayedIds.has(p.id) && (p.is_featured || p.is_trending))
                        .slice(0, 10);

                      if (!recommendedProducts || recommendedProducts.length === 0) return null;

                      return (
                        <div className="px-0 md:px-12 mt-16 border-t border-slate-200/50 dark:border-white/5 pt-12 pb-8">
                          <div className="flex items-center gap-2 mb-8 px-4 md:px-0">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                            <h2 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                              {lang === 'fr' ? 'Recommandé pour vous' : 'Recommended for you'}
                            </h2>
                          </div>
                          <ProductSection 
                            products={recommendedProducts} 
                            type="category" 
                            hideHeader={true}
                            hideBanner={true}
                            settings={{ enabled: false }}
                            onProductClick={handleProductClick}
                          />
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>

        </main>


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


    </div>
  );
};

const RouteTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const pagePath = location.pathname + location.search;

    // Ignore dashboard / admin pages to keep logs focused on customers
    if (pagePath.includes('/dashboard') || pagePath.includes('/admin')) return;

    // Determine event type based on URL path
    let eventType = 'page_view';
    if (pagePath === '/' || pagePath === '') {
      eventType = 'visit storefront';
    } else if (pagePath.startsWith('/product/')) {
      eventType = 'product viewed';
    } else if (pagePath.startsWith('/search') || pagePath.includes('q=')) {
      eventType = 'product searched';
    }

    const country = window.localStorage.getItem('user_country') || 'Unknown';

    // Log view count to Supabase visitor_log
    if (supabase) {
      Promise.resolve(
        supabase.from('visitor_log').insert([{ 
          page_path: pagePath,
          event_type: eventType,
          country: country
        }])
      ).catch(() => {});
    }
  }, [location.pathname, location.search]);

  return null;
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
      let country = window.localStorage.getItem('user_country');
      if (country) return; // Already detected
      
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
      window.localStorage.setItem('user_country', country || 'PH');
    };

    detectCountry();
  }, []);

  return (
    <>
      <Toast />
      <ConfirmDialog />
      <RealtimeNotification />
      <BackToTop />
      <SwipeGestures />
      {!getCurrentPath().includes('/dashboard') && !getCurrentPath().includes('/product/') && !['/auth', '/login', '/register'].includes(getCurrentPath()) && <FloatingWhatsApp />}
      {!getCurrentPath().includes('/dashboard') && <LoadingScreen isVisible={loading} />}
      <Router>
        <ScrollToTop />
        <GlobalLightbox />
        <RouteTracker />
        <Routes>
          <Route path="/" element={<Storefront viewMode="home" />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/wishlist" element={<Storefront viewMode="wishlist" />} />
          <Route path="/notifications" element={<Storefront viewMode="notifications" />} />
          <Route path="/products" element={<Storefront viewMode="products" />} />
          <Route path="/login" element={<Storefront viewMode="login" />} />
          <Route path="/register" element={<Storefront viewMode="signup" />} />
          <Route path="/auth" element={<Storefront viewMode="auth" />} />
          <Route path="/settings" element={<Storefront viewMode="settings" />} />
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
