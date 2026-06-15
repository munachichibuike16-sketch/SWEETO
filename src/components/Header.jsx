import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Heart, Globe, Menu, Home, X, Sun, Moon, LogOut, Bell, MapPin, Package, ShoppingBag, Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import SweetoLogo from './SweetoLogo';

const Header = ({ onMenuClick, onCartClick }) => {
  const { cartCount, cartTotal } = useCart();
  const { wishlistItems } = useWishlist();
  const { products, searchQuery, setSearchQuery, setSelectedCategory, setSelectedBrand, settings } = useStore();
  const { isDarkMode, toggleTheme } = useTheme();
  const { lang, changeLanguage, t, isRTL } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isWishlistPage = location.pathname === '/wishlist';
  const isHomePage = location.pathname === '/' || location.pathname === '' || location.pathname.startsWith('/product/');
  const isProfilePage = location.pathname === '/auth' || location.pathname === '/login' || location.pathname === '/register';
  const notifRef = useRef(null);
  const langRef = useRef(null);
  const headerRef = useRef(null);

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

  const handleSuggestionClick = (product) => {
    setInputValue(product.name);
    setSearchQuery(product.name);
    logSearch(product.name);
    setShowSuggestions(false);
    setIsSearchOpen(false);
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white/75 dark:bg-[#020617]/75 backdrop-blur-xl shadow-md border-b border-slate-100 dark:border-slate-800 ${isScrolled ? 'py-2 px-4' : 'py-3.5 px-4 md:px-12'} ${isProfilePage || location.pathname.startsWith('/product/') ? 'hidden md:block' : ''}`}>
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
            <button type="button" className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 shrink-0">
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
              placeholder={t('search_placeholder')} 
              className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-850 dark:text-white placeholder-slate-400 focus:ring-0 px-0 py-2"
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

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <motion.button 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadNotifCount > 0 && !isNotifOpen && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-eas-blue rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-eas-blue/30 animate-pulse">
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
          {/* Row 1: Logo & Icons (collapses on scroll) */}
          <div className={`flex items-center justify-between w-full transition-all duration-300 origin-top overflow-hidden ${
            isScrolled 
              ? 'h-0 opacity-0 pointer-events-none mb-0 scale-y-95' 
              : 'h-10 opacity-100 mb-2 scale-y-100'
          }`}>
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

            {/* Action Icons: Only Notification bell */}
            <div className="flex items-center gap-1">
              {/* Notifications bell */}
              <button 
                onClick={() => navigate('/notifications')} 
                className="p-2 text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors relative"
                title={t('notifications')}
              >
                <Bell size={22} strokeWidth={1.5} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4.5 h-4.5 px-1 bg-[#ff3b30] rounded-full flex items-center justify-center text-white text-[8px] font-black shadow-md animate-pulse leading-none">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Pill-shaped Search Bar */}
          <form 
            onSubmit={handleSearchTrigger} 
            className={`w-full flex items-center bg-white dark:bg-slate-900 border border-slate-900 dark:border-slate-800 rounded-full p-1 pl-4 pr-1 gap-2.5 relative shadow-sm transition-all duration-300 ${
              isScrolled ? 'mt-0' : 'mt-2.5'
            }`}
          >
            {/* Camera Icon */}
            <button type="button" className="text-slate-450 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-400 shrink-0">
              <Camera size={19} strokeWidth={2} />
            </button>
            
            {/* Separator line */}
            <div className="h-4 w-[1px] bg-slate-250 dark:bg-slate-800 shrink-0"></div>
            
            {/* Input field */}
            <input 
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t('search_placeholder') || "Slip Sans Trace"} 
              className="w-full bg-transparent border-none outline-none font-bold text-sm text-slate-850 dark:text-white placeholder-slate-400 focus:ring-0 px-0 py-1.5"
            />
            
            {/* Clear button */}
            {inputValue && (
              <button 
                type="button" 
                onClick={() => setInputValue('')} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0"
              >
                <X size={15} />
              </button>
            )}

            {/* Black Search Button */}
            <button 
              type="submit" 
              className="bg-slate-950 dark:bg-slate-800 text-white rounded-full p-2 flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 shrink-0"
            >
              <Search size={16} strokeWidth={2.5} />
            </button>

            {/* Mobile Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50"
                >
                  {suggestions.map((product) => (
                    <div 
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
                      className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                    >
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={product.image_url || product.image || '/hero-banner.png'} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col text-start">
                        <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</span>
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.category}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </header>

      {/* --- Mobile Bottom Navigation --- */}
      {!location.pathname.startsWith('/product/') && (
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
            isHomePage ? 'text-eas-blue dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
            location.pathname === '/products' ? 'text-eas-blue dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
          className="flex-1 flex flex-col items-center justify-center gap-1 h-full relative text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-300"
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
            isProfilePage ? 'text-eas-blue dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
                className={`w-5.5 h-5.5 rounded-full object-cover border-2 ${isProfilePage ? 'border-eas-blue dark:border-blue-400' : 'border-transparent'}`} 
              />
            ) : (
              <User size={20} strokeWidth={2.5} />
            )}
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">{user ? t('me') : t('profile')}</span>
        </motion.button>
      </nav>
      )}
    </>
  );
};

export default Header;
