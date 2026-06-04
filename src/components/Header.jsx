import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Heart, Globe, Menu, Home, X, Sun, Moon, LogOut, Bell, MapPin, Package } from 'lucide-react';
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
  const { products, setSearchQuery, setSelectedCategory, setSelectedBrand, settings } = useStore();
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
    
    // Log search to Supabase (fire and forget)
    Promise.resolve(
      supabase.from('visitor_log').insert([{
        page_path: `/search?q=${encodeURIComponent(query)}`,
        event_type: 'product searched',
        country: window.localStorage.getItem('user_country') || 'Unknown'
      }])
    ).catch(() => {});
  };

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
      {/* --- Desktop & Tablet Header --- */}
      <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        isScrolled 
        ? 'py-3 px-4 md:px-12 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-3xl shadow-2xl border-b border-slate-100 dark:border-white/5' 
        : 'py-4 md:py-6 px-4 md:px-12 bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 md:gap-6">
          
          {/* Menu & Logo Section */}
          <div className="flex items-center gap-2 md:gap-4">
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
              className="flex items-center gap-2 md:gap-3 cursor-pointer group"
            >
              {settings?.shopLogo ? (
                <motion.div 
                  animate={{ 
                    y: [0, -3, 0],
                    filter: ["drop-shadow(0 0 0px #3B82F600)", "drop-shadow(0 0 8px #3B82F644)", "drop-shadow(0 0 0px #3B82F600)"]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="hidden md:block bg-eas-blue p-2 md:p-2.5 rounded-xl shadow-xl shadow-eas-blue/30 overflow-hidden"
                >
                  <img src={settings.shopLogo} alt="Logo" className="w-5 h-5 object-contain invert brightness-0" />
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:block relative shrink-0"
                >
                  <SweetoLogo size={42} className="drop-shadow-[0_0_8px_rgba(0,242,254,0.3)]" />
                </motion.div>
              )}
              <span className="inline-block text-lg sm:text-2xl font-black text-eas-blue tracking-tighter uppercase italic group-hover:tracking-normal transition-all duration-500">
                {settings?.shopName ? (
                  <>
                    {settings.shopName.split(' ')[0]}
                    <span className="text-slate-900 dark:text-white">{settings.shopName.split(' ').slice(1).join(' ') || 'HUB'}</span>
                  </>
                ) : (
                  <>SWEETO<span className="text-slate-900 dark:text-white">HUB</span></>
                )}
              </span>
            </motion.div>

            {/* Menu button */}
            <motion.button 
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              onClick={onMenuClick}
              className="p-2 md:p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors"
            >
              <Menu size={20} />
            </motion.button>

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
              className="hidden md:flex p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm text-slate-600 dark:text-slate-300 hover:text-eas-blue hover:border-eas-blue transition-colors"
            >
              <Home size={22} />
            </motion.button>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchTrigger} className="hidden md:flex flex-1 max-w-xl relative group">
            <input 
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t('search_placeholder')} 
              className={`w-full ${isRTL ? 'pr-14 pl-4' : 'pl-14 pr-4'} py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/10 rounded-[2rem] shadow-inner focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-bold text-sm outline-none dark:text-white`}
            />
            <button type="submit" className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors`}>
              <Search size={20} strokeWidth={3} />
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
                      <div className="flex flex-col">
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
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0">

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
                    ? 'bg-red-500 text-white' 
                    : 'text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Heart 
                  size={19} 
                  className={wishlistItems.length > 0 || isWishlistPage ? "text-red-500" : ""} 
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
                  onClick={() => navigate('/login')}
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
                  {products.filter(p => p.is_new_arrival).length > 0 && !isNotifOpen && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute top-full ${isRTL ? 'start-0' : 'end-0'} mt-3 w-80 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[110]`}
                    >
                      <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">{t('recent_arrivals')}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-eas-blue bg-eas-blue/10 px-2 py-1 rounded-lg">{t('new')}</span>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                        {products.filter(p => p.is_new_arrival).slice(0, 5).map(product => (
                          <div key={product.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center gap-4 transition-colors">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-1">{product.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('just_arrived')}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button 
                        onClick={() => { setIsNotifOpen(false); navigate('/notifications'); }}
                        className="w-full p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-eas-blue transition-colors border-t border-slate-50 dark:border-slate-800"
                      >
                        {t('view_all_new')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Cart Button */}
              <motion.div 
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onCartClick}
                className={`flex items-center gap-3 bg-slate-900 text-white ${isRTL ? 'pe-4 ps-5' : 'ps-4 pe-5'} py-3 rounded-2xl cursor-pointer shadow-xl shadow-slate-900/20 group hover:bg-eas-blue transition-all`}
              >
                <div className="relative">
                  <ShoppingCart size={18} className="group-hover:rotate-12 transition-transform" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-2.5 -end-2.5 bg-eas-blue group-hover:bg-white group-hover:text-eas-blue text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black shadow"
                      >
                        {cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest leading-none">{t('cart')}</span>
                  <span className="text-[11px] font-black whitespace-nowrap">{settings?.currency || 'FCFA'} {cartTotal.toLocaleString()}</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button 
              onClick={toggleTheme} 
              className="p-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl transition-all"
              title={t('theme')}
            >
              {isDarkMode ? <Sun size={20} className="text-amber-400 animate-[spin_8s_linear_infinite]" /> : <Moon size={20} className="text-slate-500" />}
            </button>
            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
              <Search size={20} />
            </button>
            <button 
              onClick={() => navigate('/notifications')} 
              className="p-3 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl relative"
              title={t('notifications')}
            >
              <Bell size={20} />
              {products.filter(p => p.is_new_arrival).length > 0 && (
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </button>
            <div 
              onClick={onCartClick}
              className="relative p-3 bg-slate-900 text-white rounded-xl shadow-xl shadow-slate-900/10 cursor-pointer"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && <span className="absolute -top-1 -end-1 bg-eas-blue text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">{cartCount}</span>}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden mt-4 pb-2 overflow-hidden"
            >
              <form onSubmit={handleSearchTrigger} className="relative">
                <input 
                  autoFocus
                  type="text" 
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder={t('search_placeholder')} 
                  className={`w-full ${isRTL ? 'pe-12 ps-12' : 'ps-12 pe-12'} py-4 bg-slate-100 border-none rounded-[1.5rem] focus:ring-2 focus:ring-eas-blue font-bold text-sm`}
                />
                <Search className={`absolute ${isRTL ? 'end-4' : 'start-4'} top-1/2 -translate-y-1/2 text-slate-400`} size={18} />
                <button type="button" onClick={() => setIsSearchOpen(false)} className={`absolute ${isRTL ? 'start-4' : 'end-4'} top-1/2 -translate-y-1/2 text-slate-400`}>
                  <X size={18} />
                </button>

                {/* Mobile Suggestions */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                    >
                      {suggestions.map((product) => (
                        <div 
                          key={product.id}
                          onClick={() => handleSuggestionClick(product)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                        >
                          <div className="w-8 h-8 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={product.image_url || product.image || '/hero-banner.png'} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900">{product.name}</span>
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{product.category}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* --- Mobile Bottom Navigation --- */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 z-[100] lg:hidden px-8 py-4 flex justify-between items-center shadow-[0_-15px_40px_rgba(0,0,0,0.08)]">
        <motion.button 
          onClick={() => {
            setSearchQuery('');
            setSelectedCategory(null);
            setSelectedBrand(null);
            navigate('/');
          }} 
          whileTap={{ scale: 0.8 }} 
          className="flex flex-col items-center gap-1.5 text-eas-blue"
        >
          <Home size={22} strokeWidth={3} />
          <span className="text-[9px] font-black uppercase tracking-widest">{t('home')}</span>
        </motion.button>
        <motion.button 
          onClick={() => navigate('/wishlist')} 
          whileTap={{ scale: 0.8 }} 
          className={`flex flex-col items-center gap-1.5 relative transition-colors duration-300 ${
            isWishlistPage ? 'text-red-500' : 'text-slate-300 dark:text-slate-500'
          }`}
        >
          <div className={`p-2 rounded-xl transition-all ${isWishlistPage ? 'bg-red-50 dark:bg-red-900/20 shadow-inner' : ''}`}>
            <Heart 
              size={22} 
              strokeWidth={3} 
              className={wishlistItems.length > 0 || isWishlistPage ? "text-red-500" : ""} 
              fill={wishlistItems.length > 0 || isWishlistPage ? "currentColor" : "none"} 
            />
          </div>
          {wishlistItems.length > 0 && !isWishlistPage && (
            <span className="absolute top-1 right-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black border-2 border-white dark:border-slate-950">
              {wishlistItems.length}
            </span>
          )}
          <span className={`text-[9px] font-black uppercase tracking-widest ${isWishlistPage ? 'text-red-600 dark:text-red-400' : ''}`}>
            {t('saved')}
          </span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.8 }} 
          onClick={() => navigate(user ? '/auth' : '/login')}
          className="flex flex-col items-center gap-1.5 text-slate-300 dark:text-slate-500"
        >
          {user ? (
            <div className="w-6 h-6 bg-eas-blue text-white rounded-lg flex items-center justify-center font-black text-[10px]">
              {user.name?.charAt(0).toUpperCase()}
            </div>
          ) : (
            <User size={22} strokeWidth={3} />
          )}
          <span className="text-[9px] font-black uppercase tracking-widest">{user ? t('me') : t('profile')}</span>
        </motion.button>
      </nav>
    </>
  );
};

export default Header;
