import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Heart, Globe, Menu, Home, X, Sun, Moon, LogOut, Bell, MapPin, Package, ShoppingBag, Camera, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getCategoryDescendants } from '../utils/categoryHelpers';
import SweetoLogo from './SweetoLogo';

const Header = ({ onMenuClick, onCartClick }) => {
  const { cartCount, cartTotal } = useCart();
  const { wishlistItems } = useWishlist();
  const { products, categories = [], searchQuery, setSearchQuery, imageSearchResults, setImageSearchResults, selectedCategory, setSelectedCategory, setSelectedBrand, settings } = useStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const { lang, changeLanguage, t, t_smart, isRTL } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryName } = useParams();
  const isWishlistPage = location.pathname === '/wishlist';
  const isHomePage = location.pathname === '/' || location.pathname === '' || location.pathname.startsWith('/product/');
  const isActualHomePage = location.pathname === '/' || location.pathname === '';
  const isProfilePage = location.pathname === '/auth' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/settings' || location.pathname === '/wishlist';
  const isHomeOrCategory = location.pathname === '/' || location.pathname === '' || location.pathname.startsWith('/category/');
  const showBottomNav = !location.pathname.startsWith('/product/') && 
                        !['/deals', '/notifications', '/settings', '/privacy', '/terms', '/security', '/visit'].includes(location.pathname);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleOpenSearch = (e) => {
      if (e.detail?.defaultValue) {
        setInputValue(e.detail.defaultValue);
      }
      setIsSearchOpen(true);
    };
    window.addEventListener('open-search-modal', handleOpenSearch);
    return () => window.removeEventListener('open-search-modal', handleOpenSearch);
  }, []);

  useEffect(() => {
    setInputValue(searchQuery || '');
  }, [searchQuery]);
  
  const activeCategoryName = categoryName ? decodeURIComponent(categoryName) : selectedCategory;
  const activeCat = categories.find(c => c.name?.toLowerCase() === activeCategoryName?.toLowerCase());
  const activeParentCat = (() => {
    if (!activeCat) return null;
    let current = activeCat;
    for (let i = 0; i < 5; i++) { // Max depth fallback to prevent loop lock
      if (!current.parent_id) break;
      const parent = categories.find(c => c.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return current;
  })();
  const activeParentName = activeParentCat ? activeParentCat.name : null;
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const headerRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgressText, setScanningProgressText] = useState('');
  const [imageSearchPreview, setImageSearchPreview] = useState(null);
  const imageInputRef = useRef(null);

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const placeholders = [
    "Slip Sans Trace",
    t('search_placeholder') || "Search premium store...",
    "Wireless Earbuds",
    "Smart Watch",
    "Gaming Mouse",
    "Mechanical Keyboard"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [placeholders.length]);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          '--header-height',
          `${headerRef.current.offsetHeight}px`
        );
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);
    let resizeObserver;
    if (headerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      resizeObserver.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [isScrolled, isSearchOpen]);

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
    const checkSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem('sweetohub_session'));
        if (session) setUser(session);
        else setUser(null);
      } catch (e) { setUser(null); }
    };
    
    checkSession();
    window.addEventListener('storage', checkSession);
    return () => window.removeEventListener('storage', checkSession);
  }, []);

  // Compute unread notification count (new arrivals not yet read)
  const unreadNotifCount = (() => {
    try {
      const readNotifs = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      const readTimed = JSON.parse(localStorage.getItem('read_notifications_timed') || '{}');
      return products.filter(p => p.is_new_arrival).filter(p => {
        const id = `new-product-${p.id}`;
        return !readNotifs.includes(id) && !readTimed[id];
      }).length;
    } catch (e) { return products.filter(p => p.is_new_arrival).length; }
  })();

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLangOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('sweetohub_session');
    setUser(null);
    navigate('/');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim().length > 1) {
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase()) || 
        p.category.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const logSearch = async (query) => {
    if (!query.trim()) return;
    const count = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) || 
      p.category?.toLowerCase().includes(query.toLowerCase())
    ).length;
    
    // Log search to Supabase visitor_log (general traffic tracking)
    if (supabase) {
      Promise.resolve(
        supabase.from('visitor_log').insert([{
          page_path: `/search?q=${encodeURIComponent(query)}`,
          event_type: 'product searched',
          country: window.localStorage.getItem('user_country') || 'Unknown'
        }])
      ).catch(() => {});
    }

    // Detailed Search Tracker logic (Missing vs Found)
    if (count > 0) {
      // Clear failed search bounce tracking
      sessionStorage.removeItem('last_failed_search');
      sessionStorage.removeItem('has_interacted_after_fail');

      // Log success
      if (supabase) {
        Promise.resolve(
          supabase.rpc('increment_search_popularity', { search_term: query })
        ).catch(() => {
          // SQLite fallback
          apiFetch('/api/analytics/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: query, success: true })
          }).catch(() => {});
        });
      } else {
        // SQLite fallback directly
        apiFetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: query, success: true })
        }).catch(() => {});
      }
    } else {
      // Track as failed search
      sessionStorage.setItem('last_failed_search', query);
      sessionStorage.setItem('has_interacted_after_fail', 'false');

      if (supabase) {
        Promise.resolve(
          supabase.rpc('increment_failed_search', { search_term: query })
        ).catch(() => {
          // SQLite fallback
          apiFetch('/api/analytics/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword: query, success: false })
          }).catch(() => {});
        });
      } else {
        // SQLite fallback directly
        apiFetch('/api/analytics/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: query, success: false })
        }).catch(() => {});
      }
    }
  };

  // Analytics bounce tracking effects
  useEffect(() => {
    const handleNavigationAway = () => {
      const failedSearch = sessionStorage.getItem('last_failed_search');
      if (failedSearch) {
        // If they navigate away from the home search page or search input changes, set interacted to true
        const isSearchPageActive = location.pathname === '/' && inputValue;
        if (!isSearchPageActive) {
          sessionStorage.setItem('has_interacted_after_fail', 'true');
        }
      }
    };

    handleNavigationAway();
  }, [location.pathname, searchQuery]);

  useEffect(() => {
    const logBounceEvent = () => {
      const failedSearch = sessionStorage.getItem('last_failed_search');
      const interacted = sessionStorage.getItem('has_interacted_after_fail') === 'true';
      if (failedSearch && !interacted) {
        sessionStorage.removeItem('last_failed_search');
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseAnonKey) {
          fetch(`${supabaseUrl}/rest/v1/rpc/increment_failed_search_bounce`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`
            },
            body: JSON.stringify({ search_term: failedSearch }),
            keepalive: true
          }).catch(() => {});
        }
        
        // Also fallback to local SQLite
        fetch(`${window.location.origin}/api/analytics/bounce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: failedSearch }),
          keepalive: true
        }).catch(() => {});
      }
    };

    // Also set interacted = true if they click anywhere on the page
    const handleDocumentClick = (e) => {
      const failedSearch = sessionStorage.getItem('last_failed_search');
      if (failedSearch) {
        const clickedInput = e.target.closest('input') || e.target.closest('form') || e.target.closest('button');
        if (!clickedInput) {
          sessionStorage.setItem('has_interacted_after_fail', 'true');
        }
      }
    };

    window.addEventListener('beforeunload', logBounceEvent);
    window.addEventListener('pagehide', logBounceEvent);
    document.addEventListener('click', handleDocumentClick);

    return () => {
      window.removeEventListener('beforeunload', logBounceEvent);
      window.removeEventListener('pagehide', logBounceEvent);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [inputValue]);

  const handleSearchTrigger = (e) => {
    if (e) e.preventDefault();
    setSearchQuery(inputValue);
    logSearch(inputValue);
    setShowSuggestions(false);
    setIsSearchOpen(false);
    navigate('/');
  };

  const handleImageSearchUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset standard input value to not confuse the user
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSearchPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanningProgressText(lang === 'fr' ? 'Extraction des caractéristiques...' : 'Extracting features...');

    setTimeout(() => {
      setScanningProgressText(lang === 'fr' ? 'Analyse des catalogues...' : 'Scanning catalogs...');
    }, 700);

    setTimeout(() => {
      setScanningProgressText(lang === 'fr' ? 'Association des produits visuellement similaires...' : 'Matching visually similar products...');
    }, 1400);

    setTimeout(() => {
      const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const keywords = fileNameWithoutExt
        .toLowerCase()
        .split(/[^a-z0-9]/)
        .filter(k => k.length > 1);

      let matches = [];
      if (Array.isArray(products) && products.length > 0) {
        matches = products.filter(p => {
          const name = p.name ? p.name.toLowerCase() : '';
          const cat = p.category ? p.category.toLowerCase() : '';
          const desc = p.description ? p.description.toLowerCase() : '';
          
          return keywords.some(keyword => 
            name.includes(keyword) || 
            cat.includes(keyword) || 
            desc.includes(keyword)
          );
        });
      }


      setImageSearchResults(matches);
      
      const visualSearchQueryText = lang === 'fr' ? `Recherche visuelle : ${file.name}` : `Visual Search: ${file.name}`;
      setSearchQuery(visualSearchQueryText);
      setInputValue(visualSearchQueryText);

      setIsScanning(false);
      setImageSearchPreview(null);
      setIsSearchOpen(false);
      setShowSuggestions(false);
      navigate('/');
    }, 2100);
  };

  const handleSuggestionClick = (product) => {
    setInputValue('');
    setShowSuggestions(false);
    setIsSearchOpen(false);
    navigate(`/product/${product.id}`);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white/75 dark:bg-[#020617]/75 backdrop-blur-xl shadow-md border-b border-slate-100 dark:border-slate-800 ${isScrolled ? 'py-2 px-4' : 'py-3.5 px-4 md:px-12'} ${isHomeOrCategory ? '' : 'hidden md:block'}`}>
        {/* Desktop Header Layout */}
        <div className="hidden md:flex max-w-[1600px] mx-auto items-center justify-between gap-6 w-full">
          
          {/* Menu & Logo Section */}
          <div className="flex items-center gap-4">
            {/* Logo — comes first */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
                navigate('/');
              }}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative shrink-0"
              >
                <SweetoLogo size={42} className="drop-shadow-[0_0_8px_rgba(0,255,0,0.3)]" />
              </motion.div>
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block text-lg sm:text-2xl font-black tracking-tighter uppercase italic group-hover:tracking-normal transition-all duration-500 leading-none">
                    <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                      {settings?.shopName ? settings.shopName.split(' ')[0] : 'SWEETO'}
                    </span>
                    <span className="text-slate-900 dark:text-white ml-1.5">
                      {settings?.shopName ? settings.shopName.split(' ').slice(1).join(' ') || 'HUB' : 'HUB'}
                    </span>
                  </span>
                  
                  {/* Glowing Active Online Dot */}
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none border border-emerald-500/20">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    Connected
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Menu button removed */}

            {/* Home button */}
            <motion.button 
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
                navigate('/');
              }}
              className="flex p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors"
            >
              <Home size={22} />
            </motion.button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchTrigger} className="flex-1 max-w-xl flex items-center bg-slate-50 dark:bg-slate-900/40 border border-slate-950 dark:border-slate-800 rounded-full p-1 pl-5 pr-1 gap-3 relative group transition-all focus-within:ring-4 focus-within:ring-blue-500/10">
            {/* Camera Icon */}
            <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 shrink-0"
            >
              <Camera size={19} strokeWidth={2} />
            </button>
            
            {/* Divider */}
            <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>

            <input 
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholders[currentPlaceholderIndex]} 
              className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0 px-0 py-2"
            />

            {inputValue && (
              <button 
                type="button" 
                onClick={() => setInputValue('')} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0"
              >
                <X size={15} />
              </button>
            )}

            {/* Solid Black Search Button */}
            <button 
              type="submit" 
              className="bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 text-white rounded-full px-5 py-2 font-bold flex items-center justify-center transition-all active:scale-95 shrink-0 text-sm gap-2"
            >
              <Search size={15} strokeWidth={2.5} />
              <span>{t('search') || 'Search'}</span>
            </button>

            {/* Desktop Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50"
                >
                  {suggestions.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={product.image_url || product.image || '/hero-banner.png'} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col text-start">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{product.name}</span>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.category}</span>
                      </div>
                      <div className={`${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                        <span className="text-xs font-black text-eas-blue">{settings?.currency || 'FCFA'} {product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Desktop Action Center */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Unified Icon Pill */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl shadow-inner px-1 py-1 gap-1">
              
              {/* Theme Toggle */}
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-slate-400 hover:text-eas-blue hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                title={t('theme')}
              >
                {isDarkMode ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-slate-600" />}
              </motion.button>

              {/* Wishlist */}
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/wishlist')}
                className={`p-2.5 rounded-xl transition-all relative ${
                  isWishlistPage 
                    ? 'bg-[#ff3b30] text-white shadow-lg shadow-red-500/20' 
                    : 'text-slate-400 hover:text-[#ff3b30] hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Heart 
                  size={19} 
                  className={wishlistItems.length > 0 || isWishlistPage ? "text-[#ff3b30]" : ""} 
                  fill={(wishlistItems.length > 0 || isWishlistPage) ? (isWishlistPage ? "white" : "currentColor") : "none"} 
                  style={{ color: isWishlistPage ? 'white' : undefined }}
                />
                <AnimatePresence>
                  {wishlistItems.length > 0 && !isWishlistPage && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black shadow border border-white dark:border-slate-800"
                    >
                      {wishlistItems.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Language */}
              <div className="relative" ref={langRef}>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-eas-blue hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <Globe size={17} className="text-eas-blue" />
                  <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                    {lang.toUpperCase()}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute top-full ${isRTL ? 'start-0' : 'end-0'} mt-3 w-40 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[110]`}
                    >
                      <div className="max-h-[300px] overflow-y-auto scrollbar-hide py-2">
                        {languages.map(language => (
                          <button
                            key={language.code}
                            onClick={() => handleLanguageChange(language.code)}
                            className={`w-full text-start px-4 py-2 text-[11px] font-bold transition-colors ${
                              lang === language.code 
                                ? 'bg-eas-blue/10 text-eas-blue dark:bg-eas-blue/20' 
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span className={`uppercase tracking-widest ${isRTL ? 'ms-2' : 'me-2'} opacity-50`}>{language.code}</span>
                            {language.name}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Visit Us */}
              <motion.button 
                whileHover={{ scale: 1.1 }} 
                onClick={() => navigate('/visit')}
                className="p-2.5 rounded-xl text-slate-400 hover:text-eas-blue hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                title={t('visit_us')}
              >
                <MapPin size={19} />
              </motion.button>
            </div>

            {/* User + Cart Group */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm px-3 py-2">
                  <div 
                    onClick={() => navigate('/auth')}
                    className="w-8 h-8 bg-eas-blue text-white rounded-xl flex items-center justify-center font-black text-xs shadow cursor-pointer hover:scale-110 transition-transform overflow-hidden"
                  >
                    {user.avatarUrl || user.picture ? (
                      <img 
                        src={user.avatarUrl || user.picture} 
                        alt={user.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col cursor-pointer" onClick={() => navigate('/auth')}>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('welcome')}</span>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase italic tracking-tight hover:text-eas-blue transition-colors">{user.name?.split(' ')[0]}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className={`${isRTL ? 'me-1' : 'ms-1'} p-1.5 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20`}
                    title={t('logout')}
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm px-3 py-2 cursor-pointer group"
                >
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-eas-blue group-hover:text-white transition-all">
                    <User size={17} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">{t('account')}</span>
                    <span className="text-[11px] font-black text-slate-900 dark:text-white">{t('sign_in')}</span>
                  </div>
                </motion.div>
              )}

              {/* Settings Icon */}
              {!isActualHomePage && (
                <motion.button 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/settings')}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors"
                  title={t('settings') || 'Settings'}
                >
                  <Settings size={20} />
                </motion.button>
              )}

              {/* Notifications */}
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate('/notifications')}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadNotifCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-eas-blue rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-eas-blue/30">
                      {unreadNotifCount}
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header Layout */}
        <div className="flex flex-col md:hidden w-full">
          {/* Row 1: Logo & Icons (fixed, persistent) */}
          <div className={`flex items-center justify-between w-full transition-all duration-300 origin-top overflow-hidden ${isScrolled ? 'h-0 opacity-0 pointer-events-none mb-0 scale-y-95' : 'h-10 opacity-100 mb-2 scale-y-100'}`}>
            {/* Redesigned Icy Cool Mobile Branding without checkmark */}
            <div 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
                navigate('/');
              }}
              className="flex items-center text-xl font-black tracking-tight select-none cursor-pointer group"
            >
              <span className="bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.25)] uppercase italic group-hover:tracking-normal transition-all duration-500 leading-none">
                {settings?.shopName ? settings.shopName.split(' ')[0] : 'SWEETO'}
              </span>
              <span className="font-black text-slate-900 dark:text-white uppercase italic ml-1.5 leading-none">
                {settings?.shopName ? settings.shopName.split(' ').slice(1).join(' ') : 'HUB'}
              </span>
            </div>
 
            {/* Action Icons: Notification bell & Settings */}
            <div className="flex items-center gap-1">
              {/* Settings gear */}
              {!isActualHomePage && (
                <button 
                  onClick={() => navigate('/settings')} 
                  className="p-2 text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors"
                  title={t('settings') || 'Settings'}
                >
                  <Settings size={22} strokeWidth={1.5} />
                </button>
              )}

              {/* Notifications bell */}
              <button 
                onClick={() => navigate('/notifications')} 
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors relative"
                title={t('notifications')}
              >
                <Bell size={22} strokeWidth={1.5} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 bg-[#ff3b30] rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-md leading-none">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Pill-shaped Search Bar (fixed, persistent click-trigger) */}
          <div 
            onClick={() => setIsSearchOpen(true)}
            className={`w-full flex items-center bg-white dark:bg-slate-900 border border-slate-950 dark:border-slate-800 rounded-full p-1 pl-4 pr-1 gap-2.5 relative shadow-sm transition-all duration-300 ${isScrolled ? 'mt-0' : 'mt-2.5'} cursor-pointer`}
          >
            {/* Camera Icon */}
            <button 
              type="button" 
              onClick={(e) => {
                e.stopPropagation();
                imageInputRef.current?.click();
              }}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-400 shrink-0 relative z-10"
            >
              <Camera size={19} strokeWidth={2} />
            </button>
            
            {/* Separator line */}
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            
            {/* Input field (readonly visual display) */}
            <div className="w-full bg-transparent border-none outline-none font-medium text-sm text-slate-400 dark:text-slate-500 px-0 py-1.5 select-none truncate text-start">
              {inputValue || placeholders[currentPlaceholderIndex]}
            </div>
            
            {/* Clear button */}
            {inputValue && (
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  setInputValue('');
                  setSearchQuery('');
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-1 shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
 
            {/* Black Search Button */}
            <div className="bg-slate-950 dark:bg-slate-800 text-white rounded-full h-8 px-5 flex items-center justify-center transition-all shrink-0">
              <Search size={16} strokeWidth={2.5} />
            </div>
          </div>
 
           <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 pt-1.5 snap-x snap-mandatory scroll-smooth select-none h-10 opacity-100 mt-2 scale-y-100 w-full items-center">
             <button
               type="button"
               onClick={() => {
                 setSelectedCategory(null);
                 setSelectedBrand(null);
                 setSearchQuery('');
                 navigate('/');
               }}
               className={`text-[12px] font-semibold px-4.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 snap-start cursor-pointer capitalize ${
                 !activeParentName 
                   ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold' 
                   : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
               }`}
             >
               {lang === 'fr' ? 'Tout' : 'All'}
             </button>
              {categories
                .filter((cat) => {
                  // If custom visible categories are set, render only those.
                  // Otherwise, default to showing Level 1 parent categories.
                  if (settings?.visible_homepage_categories) {
                    try {
                      let visibleIds = settings.visible_homepage_categories;
                      if (typeof visibleIds === 'string') {
                        visibleIds = JSON.parse(visibleIds);
                      }
                      if (Array.isArray(visibleIds) && visibleIds.length > 0) {
                        return visibleIds.includes(cat.id) || visibleIds.includes(String(cat.id)) || visibleIds.includes(Number(cat.id));
                      }
                    } catch (e) {}
                  }
                  return !cat.parent_id;
                })
                .map((cat) => {
                  const isSelected = activeParentName?.toLowerCase() === cat.name?.toLowerCase() || selectedCategory?.toLowerCase() === cat.name?.toLowerCase();
                  return (
                    <button
                      key={cat.id || cat.name}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSelectedBrand(null);
                        setSearchQuery('');
                        navigate(`/category/${encodeURIComponent(cat.name)}`);
                      }}
                      className={`text-[12px] font-semibold px-4.5 py-1.5 rounded-full whitespace-nowrap transition-all duration-300 snap-start cursor-pointer capitalize ${
                        isSelected 
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold' 
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {t_smart ? t_smart(cat.name) : cat.name}
                    </button>
                  );
                })
              }
           </div>
        </div>
      </header>

      {/* --- Mobile Bottom Navigation --- */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 w-full h-[4.1rem] pb-[env(safe-area-inset-bottom,10px)] pt-1.5 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800/60 z-[100] lg:hidden px-4 flex justify-between items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.04)] transition-all duration-500">
        {/* Accueil */}
        <motion.button 
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory(null);
            setSelectedBrand(null);
            navigate('/');
          }} 
          whileTap={{ scale: 0.92 }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 ${
            isHomePage ? 'text-eas-blue dark:text-blue-450' : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
          }`}
        >
          {isHomePage && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-x-2 inset-y-1 bg-eas-blue/8 dark:bg-eas-blue/10 rounded-xl blur-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {isHomePage && (
            <motion.div 
              layoutId="activeTabLine"
              className="absolute top-[-6px] left-3 right-3 h-[3px] bg-gradient-to-r from-eas-blue to-blue-700 dark:from-blue-700 dark:to-blue-500 rounded-b-md shadow-[0_2px_8px_rgba(0,82,255,0.4)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <motion.div
            animate={{ scale: isHomePage ? 1.12 : 1, y: isHomePage ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Home size={20} strokeWidth={2.5} />
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">{t('home')}</span>
        </motion.button>

        {/* Cart */}
        <motion.button 
          onClick={onCartClick} 
          whileTap={{ scale: 0.92 }} 
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 text-slate-500 dark:text-slate-400 hover:text-eas-blue"
        >
          <motion.div
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="relative"
          >
            <ShoppingCart 
              size={20} 
              strokeWidth={2.5} 
              className="transition-all"
            />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-eas-blue text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black shadow-md shadow-eas-blue/20">
                {cartCount}
              </span>
            )}
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">
            {t('cart')}
          </span>
        </motion.button>

        {/* Store */}
        <motion.button 
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory(null);
            setSelectedBrand(null);
            navigate('/products');
          }} 
          whileTap={{ scale: 0.92 }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 ${
            location.pathname === '/products' ? 'text-eas-blue dark:text-blue-450' : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
          }`}
        >
          {location.pathname === '/products' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-x-2 inset-y-1 bg-eas-blue/8 dark:bg-eas-blue/10 rounded-xl blur-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {location.pathname === '/products' && (
            <motion.div 
              layoutId="activeTabLine"
              className="absolute top-[-6px] left-3 right-3 h-[3px] bg-gradient-to-r from-eas-blue to-blue-700 dark:from-blue-700 dark:to-blue-500 rounded-b-md shadow-[0_2px_8px_rgba(0,82,255,0.4)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <motion.div
            animate={{ scale: location.pathname === '/products' ? 1.12 : 1, y: location.pathname === '/products' ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <ShoppingBag size={20} strokeWidth={2.5} className="transition-all" />
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">{t('store_tab')}</span>
        </motion.button>

        {/* Category (Sidebar) */}
        <motion.button 
          onClick={onMenuClick} 
          whileTap={{ scale: 0.92 }} 
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative text-slate-550 dark:text-slate-400 hover:text-eas-blue transition-colors duration-300"
        >
          <motion.div
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Menu size={20} strokeWidth={2.5} className="transition-all" />
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">
            {lang === 'fr' ? 'Catégorie' : 'Category'}
          </span>
        </motion.button>

        {/* Profil */}
        <motion.button 
          whileTap={{ scale: 0.92 }} 
          onClick={() => navigate('/auth')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 ${
            isProfilePage ? 'text-eas-blue dark:text-blue-450' : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
          }`}
        >
          {isProfilePage && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-x-2 inset-y-1 bg-eas-blue/8 dark:bg-eas-blue/10 rounded-xl blur-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {isProfilePage && (
            <motion.div 
              layoutId="activeTabLine"
              className="absolute top-[-6px] left-3 right-3 h-[3px] bg-gradient-to-r from-eas-blue to-blue-700 dark:from-blue-700 dark:to-blue-500 rounded-b-md shadow-[0_2px_8px_rgba(0,82,255,0.4)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <motion.div
            animate={{ scale: isProfilePage ? 1.12 : 1, y: isProfilePage ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {user && (user.avatarUrl || user.picture) ? (
              <img 
                src={user.avatarUrl || user.picture} 
                alt="" 
                className={`w-5.5 h-5.5 rounded-full object-cover border-2 ${isProfilePage ? 'border-eas-blue dark:border-blue-450' : 'border-transparent'}`} 
              />
            ) : (
              <User size={20} strokeWidth={2.5} />
            )}
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">{user ? t('me') : t('profile')}</span>
        </motion.button>
      </nav>
      )}

      {/* AliExpress Style Full-screen Search Overlay for Mobile */}
      <AnimatePresence>
        {isSearchOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 bg-white dark:bg-[#020617] z-[999] overflow-y-auto flex flex-col"
          >
            {/* Top Row: Back button, Search input, Search icon */}
            <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#020617] shrink-0">
              <button 
                type="button" 
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-700 dark:text-slate-300 p-1 cursor-pointer"
              >
                <ArrowLeft size={22} strokeWidth={2.5} />
              </button>

              <form 
                onSubmit={handleSearchTrigger}
                className="flex-1 flex items-center bg-[#f4f4f4] dark:bg-slate-900/60 border border-slate-950 dark:border-slate-800 rounded-full p-1 pl-4 pr-1 gap-2.5 relative"
              >
                {/* Camera Icon */}
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-400 shrink-0 cursor-pointer"
                >
                  <Camera size={19} strokeWidth={2} />
                </button>
                
                {/* Separator line */}
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-850 shrink-0"></div>

                <input 
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={placeholders[currentPlaceholderIndex]}
                  className="w-full bg-transparent border-none outline-none font-semibold text-sm text-slate-850 dark:text-white placeholder-slate-400 focus:ring-0 px-0 py-1"
                />

                {inputValue && (
                  <button 
                    type="button" 
                    onClick={() => setInputValue('')} 
                    className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 p-1 shrink-0 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}

                <button 
                  type="submit" 
                  className="bg-slate-950 dark:bg-slate-800 text-white rounded-full h-8 px-4 flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 shrink-0 cursor-pointer"
                >
                  <Search size={16} strokeWidth={2.5} />
                </button>
              </form>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col w-full">
              {/* Suggestions list (if user has typed something) */}
              {inputValue && suggestions.length > 0 ? (
                <div className="flex flex-col w-full divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#020617]">
                  {suggestions.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => {
                        handleSuggestionClick(product);
                        setIsSearchOpen(false);
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-900/50"
                    >
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        <img src={product.image_url || product.image || '/hero-banner.png'} alt={product.name} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="flex flex-col text-start">
                        <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</span>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Discover More grid (when input is empty or no suggestions) */
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Search size={14} className="text-slate-400" />
                      {t('discover_more') || 'Discover more'}
                    </h3>

                    {/* 2-Column Grid of Actual Categories */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      {(() => {
                        let displayCats = categories;
                        if (settings?.visible_homepage_categories) {
                          try {
                            let visibleIds = settings.visible_homepage_categories;
                            if (typeof visibleIds === 'string') {
                              visibleIds = JSON.parse(visibleIds);
                            }
                            if (Array.isArray(visibleIds) && visibleIds.length > 0) {
                              displayCats = categories.filter(cat => visibleIds.includes(cat.id) || visibleIds.includes(String(cat.id)) || visibleIds.includes(Number(cat.id)));
                            } else {
                              displayCats = categories.filter(c => !c.parent_id);
                            }
                          } catch (e) {
                            displayCats = categories.filter(c => !c.parent_id);
                          }
                        } else {
                          displayCats = categories.filter(c => !c.parent_id);
                        }
                        const parentCats = displayCats.slice(0, 8); // Limit to 8 categories

                        return parentCats.map((cat, idx) => {
                          const descendants = getCategoryDescendants(cat.name, categories);
                          const matchNames = [cat.name?.toLowerCase(), ...descendants];
                          const count = products.filter(p => {
                            const pCat = p.category?.toLowerCase();
                            return pCat && matchNames.includes(pCat) && p.status === 'active';
                          }).length;

                          const label = lang === 'fr' 
                            ? `Plus de ${count} articles` 
                            : `${count}+ items`;

                          const imageUrl = cat.image_url || cat.icon || "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=150";

                          return (
                            <div 
                              key={cat.id || idx}
                              onClick={() => {
                                setSelectedCategory(null);
                                setSelectedBrand(null);
                                setSearchQuery('');
                                navigate(`/category/${encodeURIComponent(cat.name)}`);
                                setIsSearchOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl cursor-pointer transition-all border border-slate-100/50 dark:border-slate-800/40 select-none group"
                            >
                              <div className="flex-1 flex flex-col items-start text-start">
                                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight group-hover:text-eas-blue line-clamp-1">
                                  {t_smart ? t_smart(cat.name) : cat.name}
                                </span>
                                <span className="text-[8px] font-bold text-[#ff3b30] mt-0.5 tracking-wider uppercase leading-none">
                                  {label}
                                </span>
                              </div>
                              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-sm border border-slate-100/50 dark:border-slate-800/20">
                                <img src={imageUrl} alt={cat.name} className="max-h-full max-w-full object-contain" />
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Floating camera / Search by image button at the bottom */}
                  <div className="w-full flex justify-center pb-8 pt-4">
                    <button 
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="px-5 py-2.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all active:scale-95 cursor-pointer"
                    >
                      <Camera size={14} className="text-slate-500" />
                      <span>{lang === 'fr' ? 'Recherche par image' : 'Search by image'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input 
        type="file" 
        ref={imageInputRef} 
        accept="image/*" 
        onChange={handleImageSearchUpload} 
        className="hidden" 
      />

      {/* Scanning Overlay Modal */}
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/60 backdrop-blur-md px-4"
          >
            <style>{`
              @keyframes laser-scan {
                0% { transform: translateY(0); }
                50% { transform: translateY(220px); }
                100% { transform: translateY(0); }
              }
              .animate-laser-scan {
                animation: laser-scan 2s ease-in-out infinite;
              }
            `}</style>
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[32px] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-6"
            >
              {/* Header */}
              <div>
                <h3 className="text-xl font-black text-slate-850 dark:text-white uppercase tracking-wider">
                  {lang === 'fr' ? 'Recherche Visuelle' : 'Visual Search'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {lang === 'fr' ? 'Recherche de produits similaires...' : 'Looking for similar products...'}
                </p>
              </div>

              {/* Image Preview with Laser Line */}
              <div className="w-56 h-56 rounded-2xl overflow-hidden relative border border-slate-200 dark:border-slate-850 shadow-lg bg-slate-100 dark:bg-slate-950/40">
                {imageSearchPreview ? (
                  <img
                    src={imageSearchPreview}
                    alt="Scanning preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Camera size={40} className="animate-pulse" />
                  </div>
                )}
                {/* Laser line */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_8px_rgba(74,222,128,1)] animate-laser-scan" />
              </div>

              {/* Status and Progress Message */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {scanningProgressText}
                </span>
                <div className="flex gap-1.5 justify-center items-center mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>

              {/* Cancel Button */}
              <button
                type="button"
                onClick={() => setIsScanning(false)}
                className="mt-2 px-6 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-95 transition-all cursor-pointer"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
