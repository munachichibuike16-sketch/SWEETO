import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, User, Heart, Globe, Menu, Home, X, Sun, Moon, LogOut, Bell, MapPin, Package, ShoppingBag, Camera, Settings, ArrowLeft, MessageSquare, ChevronDown, QrCode } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { getCategoryDescendants } from '../utils/categoryHelpers';
import SweetoLogo from './SweetoLogo';
import { logVisitorEvent } from '../utils/analytics';

const Header = ({ onMenuClick, onCartClick }) => {
  const { cartCount, cartTotal } = useCart();
  const { wishlistItems } = useWishlist();
  const { products, categories = [], searchQuery, setSearchQuery, imageSearchResults, setImageSearchResults, selectedCategory, setSelectedCategory, setSelectedBrand, settings, showToast, sections } = useStore();
  const { isDarkMode, toggleTheme } = useTheme();

  const homepageNavLinks = React.useMemo(() => {
    let baseSections = [];
    if (Array.isArray(sections) && sections.length > 0) {
      baseSections = [...sections].sort((a, b) => (a.position || 0) - (b.position || 0));
    } else {
      const raw = settings?.homepageSections;
      if (typeof raw === 'object' && Array.isArray(raw)) baseSections = raw;
      else if (typeof raw === 'string' && raw.trim().startsWith('[')) {
        try { baseSections = JSON.parse(raw); } catch (e) {}
      }
    }

    const getSectionType = (sec) => {
      let t = (sec.role && sec.role !== 'custom') ? sec.role : (sec.key || sec.type);
      if (t && typeof t === 'string' && t.includes('_')) {
        return t.replace(/_\d+$/, '');
      }
      return t;
    };

    const contentSections = baseSections.length > 0
      ? baseSections.filter(s => getSectionType(s) !== 'hero' && s.isActive !== false && s.enabled !== false && s.is_active !== false)
      : [
          { type: 'featured_grid', title: 'Featured Gear' },
          { type: 'just_arrived', title: 'New Arrivals' },
          { type: 'trending', title: 'Trending Now' },
          { type: 'deal_of_the_day', title: 'Deal of the Day' }
        ];

    return contentSections.map(s => s.title || s.name || s.type?.replace(/_/g, ' '));
  }, [sections, settings]);
  const { lang, changeLanguage, t, t_smart, isRTL } = useLanguage();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBottomNavScroll, setShowBottomNavScroll] = useState(true);
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
                        !['/deals', '/notifications', '/settings', '/privacy', '/terms', '/security', '/refund', '/visit'].includes(location.pathname);

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
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  useEffect(() => {
    const calculateUnread = () => {
      try {
        const readNotifs = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const readTimed = JSON.parse(localStorage.getItem('read_notifications_timed') || '{}');
        const deletedNotifs = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');
        const count = products.filter(p => p.is_new_arrival).filter(p => {
          const id = `new-product-${p.id}`;
          return !readNotifs.includes(id) && !readTimed[id] && !deletedNotifs[id];
        }).length;
        setUnreadNotifCount(count);
      } catch (e) {
        setUnreadNotifCount(products.filter(p => p.is_new_arrival).length);
      }
    };

    calculateUnread();

    const handleUpdate = () => {
      calculateUnread();
    };

    window.addEventListener('notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [products]);

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
    logVisitorEvent(`/search?q=${encodeURIComponent(query)}`, 'product searched');

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

  const handleImageSearchUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset standard input value to not confuse the user
    const reader = new FileReader();
    
    // Read the file as base64 to pass to Gemini
    const base64Promise = new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

    reader.onload = (event) => {
      setImageSearchPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    setIsScanning(true);
    setScanningProgressText(lang === 'fr' ? 'Extraction des caractéristiques...' : 'Extracting features...');

    const progressTimeout1 = setTimeout(() => {
      setScanningProgressText(lang === 'fr' ? 'Analyse des catalogues...' : 'Scanning catalogs...');
    }, 700);

    const progressTimeout2 = setTimeout(() => {
      setScanningProgressText(lang === 'fr' ? 'Association des produits visuellement similaires...' : 'Matching visually similar products...');
    }, 1400);

    try {
      const base64Result = await base64Promise;
      const base64Data = base64Result.split(',')[1];
      const mimeType = file.type || 'image/jpeg';
      const apiKey = settings?.gemini_api_key || '';

      let keywords = [];
      let searchTitle = file.name;

      if (apiKey) {
        // Call Gemini API to identify the product
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "Analyse cette image de produit. Donne uniquement 2 ou 3 mots-clés simples et pertinents en français ou en anglais séparés par des espaces pour rechercher ce produit dans le catalogue (par exemple: 'chargeur itel', 'samsung galaxy', 'aspirateur portable'). Ne donne aucun autre texte. Si tu ne peux pas identifier le produit, réponds simplement par 'inconnu'."
                    },
                    {
                      inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                      }
                    }
                  ]
                }
              ]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleanedText = textResult.trim().toLowerCase();
            
            if (cleanedText && cleanedText !== 'inconnu' && cleanedText !== 'unknown') {
              // We successfully identified the product!
              keywords = cleanedText.split(/[^a-z0-9àâäéèêëîïôöùûüç]/i).filter(k => k.length > 1);
              searchTitle = textResult.trim();
            }
          }
        } catch (apiError) {
          console.error("Gemini image search failed, falling back to filename search:", apiError);
        }
      } else {
        // Let the user know they can set up a Gemini API Key for smart search
        if (showToast) {
          showToast(
            lang === 'fr' 
              ? 'Conseil : Ajoutez votre clé API Gemini dans les Paramètres pour activer la recherche intelligente !' 
              : 'Tip: Add your Gemini API Key in Store Settings to enable smart visual search!',
            'info'
          );
        }
      }

      // If we didn't get keywords from Gemini (either no API key, or it failed, or it returned unknown)
      // Fallback to filename keywords search
      if (keywords.length === 0) {
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        keywords = fileNameWithoutExt
          .toLowerCase()
          .split(/[^a-z0-9àâäéèêëîïôöùûüç]/i)
          .filter(k => k.length > 1);
      }

      // Perform local product filter based on keywords
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
      
      const visualSearchQueryText = lang === 'fr' ? `Recherche visuelle : ${searchTitle}` : `Visual Search: ${searchTitle}`;
      setSearchQuery(visualSearchQueryText);
      setInputValue(visualSearchQueryText);

    } catch (error) {
      console.error("Visual search error:", error);
    } finally {
      clearTimeout(progressTimeout1);
      clearTimeout(progressTimeout2);
      setIsScanning(false);
      setImageSearchPreview(null);
      setIsSearchOpen(false);
      setShowSuggestions(false);
      navigate('/');
    }
  };

  const handleSuggestionClick = (product) => {
    setInputValue('');
    setShowSuggestions(false);
    setIsSearchOpen(false);
    navigate(`/product/${product.id}`);
  };

  useEffect(() => {
    let scrollTimeout = null;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      
      // Hide bottom nav while scrolling
      setShowBottomNavScroll(false);
      
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      
      // Show bottom nav after scrolling stops (250ms inactivity)
      scrollTimeout = setTimeout(() => {
        setShowBottomNavScroll(true);
      }, 250);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, []);

  return (
    <>
      <header ref={headerRef} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 bg-white dark:bg-[#020617] shadow-md border-b border-slate-150 dark:border-slate-800 ${isHomeOrCategory ? '' : 'hidden md:block'}`}>

        {/* Desktop Main Header Layout */}
        <div className={`hidden md:flex max-w-[1240px] mx-auto items-center justify-between gap-8 w-full px-6 transition-all duration-300 ${isScrolled ? 'py-1.5' : 'py-3'}`}>
          {/* Logo Section */}
          <div className="flex items-center">
            <div 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
                navigate('/');
              }}
              className="flex items-center cursor-pointer"
            >
              <img 
                src="/sweeto_logo.png" 
                alt="Sweeto Hub" 
                className="h-9 max-h-9 w-auto object-contain select-none cursor-pointer" 
              />
            </div>
          </div>

          {/* Search Bar - AliExpress Style: Rounded pill with thin black border & black button inside */}
          <form onSubmit={handleSearchTrigger} className="flex-1 max-w-[480px] xl:max-w-[580px] flex items-center bg-white dark:bg-slate-950 border border-black dark:border-slate-700 rounded-full p-0.5 pl-4 pr-1 gap-2 relative group transition-all">
            <input 
              type="text" 
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholders[currentPlaceholderIndex]} 
              className="w-full bg-transparent border-none outline-none font-medium text-xs text-slate-850 dark:text-white placeholder-slate-400 focus:ring-0 px-0 py-1"
            />

            {inputValue && (
              <button 
                type="button" 
                onClick={() => setInputValue('')} 
                className="text-slate-450 hover:text-slate-650 dark:hover:text-slate-355 p-1 shrink-0 bg-transparent border-none cursor-pointer"
              >
                <X size={14} />
              </button>
            )}

            {/* Camera Icon inside search bar */}
            <button 
              type="button" 
              onClick={() => imageInputRef.current?.click()}
              className="text-slate-450 hover:text-slate-655 dark:hover:text-slate-400 p-1 shrink-0 bg-transparent border-none cursor-pointer"
              title="Search by image"
            >
              <Camera size={18} strokeWidth={2} />
            </button>

            {/* Black Pill-shaped search button inside search bar */}
            <button 
              type="submit" 
              className="bg-[#191919] hover:bg-black text-white rounded-full w-7 h-7 flex items-center justify-center transition-all active:scale-95 shrink-0 border-none cursor-pointer"
            >
              <Search size={14} strokeWidth={3} />
            </button>

            {/* Suggestions list */}
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
                      <div className="ml-auto">
                        <span className="text-xs font-black text-[#e61e25]">{settings?.currency || 'FCFA'} {product.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Desktop Right Side Actions */}
          <div className="flex items-center gap-5 flex-shrink-0 select-none">
            {/* Download App widget */}
            <div className="hidden xl:flex items-center gap-1.5 p-1 text-slate-700 dark:text-slate-350 hover:text-[#e61e25] cursor-pointer transition-colors" onClick={() => navigate('/visit')}>
              <QrCode size={18} className="text-slate-650" />
              <div className="flex flex-col items-start leading-none text-left text-[9px]">
                <span className="text-slate-450">Download the</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Sweeto app</span>
              </div>
            </div>

            {/* Language/Country Dropdown (French/USD or similar) */}
            <div className="relative" ref={langRef}>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-xl text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-all cursor-pointer bg-transparent border-none"
              >
                <span className="text-lg">🇨🇮</span>
                <div className="flex flex-col items-start leading-none text-left text-[9px]">
                  <span className="text-slate-405">FR/</span>
                  <span className="font-bold uppercase text-slate-850 dark:text-slate-200 mt-0.5 flex items-center gap-0.5">
                    {settings?.currency || 'USD'} <ChevronDown size={8} />
                  </span>
                </div>
              </motion.button>

              <AnimatePresence>
                {isLangOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-[110]"
                  >
                    <div className="max-h-[250px] overflow-y-auto py-2">
                      {languages.map(language => (
                        <button
                          key={language.code}
                          onClick={() => handleLanguageChange(language.code)}
                          className={`w-full text-start px-4 py-2 text-[11px] font-bold transition-colors border-none bg-transparent cursor-pointer ${
                            lang === language.code 
                              ? 'bg-[#e61e25]/10 text-[#e61e25] dark:bg-[#e61e25]/20' 
                              : 'text-slate-655 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className="uppercase tracking-widest mr-2 opacity-50">{language.code}</span>
                          {language.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Account dropdown (User icon outline, Welcome text, Log in / Register) */}
            <div className="relative group/account">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-55 dark:hover:bg-slate-855/50 transition-all cursor-pointer bg-transparent border-none"
              >
                <User size={18} strokeWidth={1.5} className="text-slate-800 dark:text-slate-200" />
                <div className="flex flex-col items-start leading-none text-left text-[9px]">
                  <span className="text-slate-400">Welcome</span>
                  <span className="font-bold text-slate-855 dark:text-slate-200 mt-0.5 truncate max-w-[100px]">
                    {user ? user.name.split(' ')[0] : 'Log in / Register'}
                  </span>
                </div>
              </motion.button>

              {/* Account hover card */}
              <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-5 hidden group-hover/account:block hover:block z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col items-center text-center pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-405 text-lg font-black overflow-hidden mb-3 border border-slate-200/50">
                    {user && (user.avatarUrl || user.picture) ? (
                      <img src={user.avatarUrl || user.picture} alt="" className="w-full h-full object-cover" />
                    ) : user ? (
                      user.name.charAt(0).toUpperCase()
                    ) : (
                      <User size={24} />
                    )}
                  </div>
                  {user ? (
                    <>
                      <h4 className="text-xs font-black text-slate-850 dark:text-white">{user.name}</h4>
                      <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-0.5">{user.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mb-3">Welcome to Sweeto Hub!</p>
                      <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => navigate('/login')}
                          className="flex-1 py-2 bg-[#e61e25] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[#c9181e] transition-colors border-none cursor-pointer"
                        >
                          Sign In
                        </button>
                        <button 
                          onClick={() => navigate('/register')}
                          className="flex-1 py-2 border border-slate-200 dark:border-slate-755 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors bg-transparent cursor-pointer"
                        >
                          Join
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="py-2.5 space-y-1">
                  <button onClick={() => navigate('/auth')} className="w-full text-left py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 rounded-xl transition-colors border-none bg-transparent cursor-pointer">
                    My Account
                  </button>
                  <button onClick={() => navigate('/auth')} className="w-full text-left py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 rounded-xl transition-colors border-none bg-transparent cursor-pointer">
                    My Orders
                  </button>
                  <button onClick={() => navigate('/wishlist')} className="w-full text-left py-2 px-3 text-xs font-bold text-slate-705 dark:text-slate-305 hover:bg-slate-55 rounded-xl transition-colors border-none bg-transparent cursor-pointer">
                    My Wish List
                  </button>
                  <button onClick={() => navigate('/notifications')} className="w-full text-left py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-55 rounded-xl transition-colors border-none bg-transparent cursor-pointer">
                    Message Center
                  </button>
                </div>

                {user && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-center py-2 bg-slate-50 dark:bg-slate-800/40 text-red-500 hover:bg-red-55 dark:hover:bg-red-955/20 text-xs font-black uppercase tracking-widest rounded-xl transition-colors border-none cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Basket Button (ShoppingCart icon with black count badge and Basket text) */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              onClick={onCartClick}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl text-slate-700 dark:text-slate-350 hover:bg-slate-55 transition-colors relative cursor-pointer bg-transparent border-none"
            >
              <div className="relative">
                <ShoppingCart size={18} className="text-slate-850 dark:text-slate-200" />
                <span className="absolute -top-1 -right-1.5 bg-black text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black border border-white dark:border-slate-900 shadow-sm leading-none">
                  {cartCount}
                </span>
              </div>
              <div className="flex flex-col items-start leading-none text-left text-[9px]">
                <span className="font-bold text-slate-800 dark:text-slate-200">Basket</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Sub-Header Categories Navigation Bar (AliExpress Style) */}
        <div className="hidden lg:block border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#020617] py-1.5 px-6 select-none">
          <div className="max-w-[1240px] mx-auto flex items-center gap-6 w-full text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {/* Categories dropdown trigger (Aliexpress Style hamburger inside pill) */}
            <div className="relative group/catmenu">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-full transition-colors cursor-pointer text-[10px] border-none font-bold">
                <Menu size={12} strokeWidth={2.5} />
                <span>All categories</span>
              </button>

              {/* Float Dropdown category list */}
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl py-3 hidden group-hover/catmenu:block hover:block z-[110] animate-in fade-in duration-200">
                {categories.filter(c => !c.parent_id).slice(0, 10).map(cat => (
                  <button 
                    key={cat.id} 
                    onClick={() => {
                      setSelectedCategory(null);
                      setSelectedBrand(null);
                      setSearchQuery('');
                      navigate(`/category/${encodeURIComponent(cat.name)}`);
                    }}
                    className="w-full text-left py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#e61e25] transition-colors border-none bg-transparent cursor-pointer"
                  >
                    {t_smart ? t_smart(cat.name) : cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div className="flex items-center gap-5">
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                  setSelectedBrand(null);
                  navigate('/');
                }} 
                className="hover:text-[#e61e25] transition-colors flex items-center gap-1 text-[#e61e25] bg-transparent border-none cursor-pointer font-black uppercase tracking-wider text-[11px]"
              >
                <span>For You</span>
              </button>

              {homepageNavLinks.slice(0, 5).map((sectionName, index) => (
                <button 
                  key={index} 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedBrand(null);
                    navigate('/');
                  }} 
                  className="hover:text-[#e61e25] transition-colors bg-transparent border-none cursor-pointer font-black uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300"
                >
                  <span>{sectionName}</span>
                </button>
              ))}

              {homepageNavLinks.length > 5 && (
                <button className="hover:text-[#e61e25] transition-colors bg-transparent border-none cursor-pointer font-black uppercase tracking-wider text-[11px] flex items-center gap-0.5 text-slate-700 dark:text-slate-300">
                  <span>More <ChevronDown size={11} /></span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header Layout */}
        <div className="flex flex-col md:hidden w-full">
          {/* Persistent Compact Single-Row Mobile Header */}
          <div className="flex items-center justify-between w-full h-11 gap-2.5 px-0.5">
            {/* Redesigned Icy Cool Mobile Branding without checkmark */}
            <div 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
                setSelectedBrand(null);
                navigate('/');
              }}
              className="flex items-center select-none cursor-pointer group shrink-0"
            >
              <SweetoLogo size={90} className="drop-shadow-[0_0_8px_rgba(96,165,250,0.15)]" />
            </div>

            {/* Compact Search Bar in the middle */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 flex items-center bg-slate-100 dark:bg-slate-900 border border-transparent dark:border-slate-800 rounded-full py-1.5 pl-3.5 pr-2.5 gap-2 relative shadow-sm cursor-pointer h-8.5 overflow-hidden"
            >
              <Search size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <div className="w-full bg-transparent border-none outline-none font-semibold text-xs text-slate-400 dark:text-slate-500 select-none truncate text-start">
                {inputValue || placeholders[currentPlaceholderIndex]}
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.stopPropagation();
                  imageInputRef.current?.click();
                }}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-655 shrink-0 ml-auto flex items-center justify-center p-0.5"
              >
                <Camera size={14} strokeWidth={2} />
              </button>
            </div>
 
            {/* Action Icons: Settings gear & Notification bell */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Settings gear */}
              {!isActualHomePage && (
                <button 
                  onClick={() => navigate('/settings')} 
                  className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors"
                  title={t('settings') || 'Settings'}
                >
                  <Settings size={20} strokeWidth={1.5} />
                </button>
              )}

              {/* Notifications bell */}
              <button 
                onClick={() => navigate('/notifications')} 
                className="p-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-500 transition-colors relative"
                title={t('notifications')}
              >
                <Bell size={20} strokeWidth={1.5} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-[#ff3b30] rounded-full flex items-center justify-center text-white text-[7.5px] font-black shadow-md leading-none">
                    {unreadNotifCount}
                  </span>
                )}
              </button>
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
        <nav className={`fixed bottom-0 left-0 right-0 w-full h-[4.1rem] pb-[env(safe-area-inset-bottom,10px)] pt-1.5 bg-white/90 dark:bg-[#020617]/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800/60 z-[100] lg:hidden px-4 flex justify-between items-center select-none shadow-[0_-8px_30px_rgba(0,0,0,0.04)] transition-all duration-500 transform ${
          showBottomNavScroll ? 'translate-y-0' : 'translate-y-full shadow-none border-t-transparent'
        }`}>
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

        {/* Chat */}
        <motion.button 
          onClick={() => {
            navigate('/support');
          }} 
          whileTap={{ scale: 0.92 }} 
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full relative transition-colors duration-300 ${
            location.pathname === '/support' ? 'text-eas-blue dark:text-blue-450' : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
          }`}
        >
          {location.pathname === '/support' && (
            <motion.div 
              layoutId="activeTabGlow"
              className="absolute inset-x-2 inset-y-1 bg-eas-blue/8 dark:bg-eas-blue/10 rounded-xl blur-sm -z-10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          {location.pathname === '/support' && (
            <motion.div 
              layoutId="activeTabLine"
              className="absolute top-[-6px] left-3 right-3 h-[3px] bg-gradient-to-r from-eas-blue to-blue-700 dark:from-blue-700 dark:to-blue-500 rounded-b-md shadow-[0_2px_8px_rgba(0,82,255,0.4)]"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <motion.div
            animate={{ scale: location.pathname === '/support' ? 1.12 : 1, y: location.pathname === '/support' ? -1 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <MessageSquare size={20} strokeWidth={2.5} className="transition-all" />
          </motion.div>
          <span className="text-[8.5px] font-black uppercase tracking-widest">{t('chat_tab')}</span>
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
