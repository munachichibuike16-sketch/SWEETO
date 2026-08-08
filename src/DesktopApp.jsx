import React, { useState, useEffect, useRef } from 'react';
import { Mic, Camera, X, ShoppingBag, Settings, LogOut, Smartphone, Laptop, Tv, Watch, Headphones, Home, Star, ShoppingCart, Heart, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useStore } from './contexts/StoreContext';
import { useCart } from './contexts/CartContext';
import { useWishlist } from './contexts/WishlistContext';
import { useLanguage } from './contexts/LanguageContext';
import DesktopHeader from './components/DesktopHeader';
import NotificationsDrawer from './components/NotificationsDrawer';
import AuthPage from './pages/AuthPage';
import WishlistContent from './components/WishlistContent';
import { getCategoryDescendants } from './utils/categoryHelpers';
import Sidebar from './components/Sidebar';
import DesktopHero from './components/DesktopHero';

import DealOfTheDaySection from './components/DealOfTheDaySection';
import { supabase } from './lib/supabase';

const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconCart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IconHeart = ({ filled }) => (
  <svg className={`w-5 h-5 ${filled ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-currentColor'}`} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconChevronLeft = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
  </svg>
);

const IconChevronRight = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
  </svg>
);

const IconStar = () => (
  <svg className="w-4 h-4 fill-amber-400 stroke-amber-400" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const IconZap = () => (
  <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconClock = () => (
  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSparkles = () => (
  <svg className="w-5 h-5 text-indigo-500 fill-indigo-500" viewBox="0 0 24 24">
    <path d="M12 2L14.5 8.5L21 11L14.5 13.5L12 20L9.5 13.5L3 11L9.5 8.5L12 2Z" />
  </svg>
);

const IconArrowRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconEye = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const IconThumbsUp = ({ filled }) => (
  <svg className={`w-3.5 h-3.5 ${filled ? 'fill-indigo-600 stroke-indigo-600' : 'fill-none stroke-current'}`} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
  </svg>
);

const IconLoader = () => (
  <svg className="w-6 h-6 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const IconInfinity = ({ className = "w-5 h-5 text-indigo-500" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.178 8c5.096 0 5.096 8 0 8-2.548 0-4.326-2.5-6.178-5.5C10.152 7.5 8.374 5 5.822 5 0.726 5 0.726 13 5.822 13 8.374 13 10.152 10.5 12 7.5c1.848-3 3.626-5.5 6.178-5.5z" />
  </svg>
);

const SectionHeroSlider = ({ products, 
  title, 
  subtitle, 
  badgeText = "FEATURED SELECTION", 
  badgeBg = "bg-indigo-600",
  onSelectProduct,
  onAddToCart,
  currencySymbol,
  formatPrice
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if ((!products) || products.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [products]);

  if ((!products) || products.length === 0) return null;

  const currentProduct = products[currentIndex] || products[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % products.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white min-h-[440px] shadow-2xl mb-10 flex items-center group">
      {/* Background Image with Blur Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={currentProduct.image} 
          alt={currentProduct.name} 
          className="w-full h-full object-cover opacity-30 blur-sm scale-110 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/70"></div>
      </div>

      {/* Slide Navigation Buttons */}
      {products.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition border border-white/20"
            title="Previous Slide"
          >
            <IconChevronLeft />
          </button>

          <button 
            onClick={handleNext}
            className="absolute right-6 z-20 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition border border-white/20"
            title="Next Slide"
          >
            <IconChevronRight />
          </button>
        </>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 max-w-[1440px] w-full mx-auto px-16 py-10 grid grid-cols-12 gap-8 items-center">
        <div className="col-span-7 space-y-5">
          <div className="flex items-center gap-2">
            <span className={`${badgeBg} text-white font-extrabold text-[11px] uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-md inline-flex items-center gap-1.5`}>
              <IconSparkles /> {badgeText}
            </span>
            <span className="text-xs text-slate-400 font-bold">
              Item {currentIndex + 1} of {products.length}
            </span>
          </div>

          <div>
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white mb-2 line-clamp-2">
              {currentProduct.name}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xl line-clamp-2">
              {subtitle || currentProduct.description}
            </p>
          </div>

          {/* Pricing Highlight */}
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl max-w-md backdrop-blur-md">
            <div>
              <span className="block text-[10px] text-slate-400 font-extrabold uppercase">Special Offer Price</span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-amber-400">{currencySymbol}{formatPrice(currentProduct.price)}</span>
                {currentProduct.originalPrice > currentProduct.price && (
                  <span className="text-sm font-bold text-slate-400 line-through">{currencySymbol}{formatPrice(currentProduct.originalPrice)}</span>
                )}
              </div>
            </div>
            {currentProduct.discount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-lg">
                SAVE {currentProduct.discount}%
              </span>
            )}
          </div>

          {/* Specs Preview Pill List */}
          {currentProduct.specs && (
            <div className="flex items-center gap-2 flex-wrap">
              {currentProduct.specs.slice(0, 3).map((spec, i) => (
                <span key={i} className="text-[11px] font-semibold bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-lg">
                  ✓ {spec}
                </span>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex items-center gap-4 pt-2">
            <button 
              onClick={() => onSelectProduct(currentProduct)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm px-6 py-3.5 rounded-2xl shadow-xl transition flex items-center gap-2"
            >
              <span>EXPLORE DETAILS</span>
              <IconArrowRight />
            </button>

            <button 
              onClick={(e) => onAddToCart(currentProduct, e)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-2xl border border-white/20 backdrop-blur-md transition flex items-center gap-2"
            >
              <IconCart />
              <span>ADD TO CART</span>
            </button>
          </div>
        </div>

        {/* Product Image Slide Showcase */}
        <div className="col-span-5 flex justify-center items-center">
          <div 
            onClick={() => onSelectProduct(currentProduct)}
            className="relative w-80 h-80 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-pointer group-hover:scale-105 transition-transform duration-500 bg-slate-800"
          >
            <img src={currentProduct.image} alt={currentProduct.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                <IconEye /> Click to inspect specs & views
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Dots Indicator */}
      {products.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-20">
          {products.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const getCategoryIcon = (name) => {
  const norm = name.toLowerCase();
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('téléphone')) return <Smartphone className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('ordinateur') || norm.includes('pc')) return <Laptop className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  if (norm.includes('tv') || norm.includes('audio') || norm.includes('sound') || norm.includes('télé') || norm.includes('music')) return <Tv className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  if (norm.includes('wear') || norm.includes('watch') || norm.includes('smartwatch') || norm.includes('montre')) return <Watch className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  if (norm.includes('access') || norm.includes('cable') || norm.includes('charge')) return <Headphones className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  if (norm.includes('home') || norm.includes('smart home') || norm.includes('domotique')) return <Home className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
  
  return <ShoppingBag className="text-slate-550 dark:text-slate-400 group-hover:text-blue-650 w-5 h-5 transition-colors" />;
};

const getCategoryEmoji = (name) => {
  const norm = name.toLowerCase();
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('téléphone')) return '📱';
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('ordinateur')) return '💻';
  if (norm.includes('tv') || norm.includes('audio') || norm.includes('sound') || norm.includes('télé') || norm.includes('music')) return '🎧';
  if (norm.includes('wear') || norm.includes('watch') || norm.includes('montre')) return '⌚';
  if (norm.includes('accessory') || norm.includes('accessoire') || norm.includes('cable') || norm.includes('charge')) return '🔌';
  if (norm.includes('home') || norm.includes('smart home') || norm.includes('domotique')) return '🏠';
  return '🏷️';
};

const getCategoryDesc = (name) => {
  const norm = name.toLowerCase();
  if (norm.includes('phone') || norm.includes('mobile') || norm.includes('téléphone')) return 'Latest Devices';
  if (norm.includes('laptop') || norm.includes('computer') || norm.includes('ordinateur') || norm.includes('pc')) return 'Powerful Performance';
  if (norm.includes('tv') || norm.includes('audio') || norm.includes('sound') || norm.includes('télé')) return 'Ultimate Entertainment';
  if (norm.includes('wear') || norm.includes('watch') || norm.includes('smartwatch') || norm.includes('montre')) return 'Smarter Every Day';
  if (norm.includes('access') || norm.includes('cable') || norm.includes('charge')) return 'Small Things, Big Impact';
  if (norm.includes('home') || norm.includes('smart home') || norm.includes('domotique')) return 'Make It Smarter';
  
  return 'Explore Collection';
};

export default function DesktopApp() {
  const { products: globalProducts = [], categories: globalCategories = [], settings, showToast } = useStore();
  const { cartItems: cart = [], addToCart: globalAddToCart, removeFromCart: globalRemoveFromCart, updateQuantity: globalUpdateQuantity, cartTotal: cartSubtotal } = useCart();
  const { wishlistItems: wishlist = [], toggleWishlist: globalToggleWishlist } = useWishlist();
  const { t, lang, t_smart } = useLanguage();
  const navigate = useNavigate();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryPill, setActiveCategoryPill] = useState('All');
  const [moreToLoveProducts, setMoreToLoveProducts] = useState([]);

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const imageInputRef = useRef(null);

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const placeholders = [
    "Slip Sans Trace",
    t_smart('Search premium electronics, luxury wear, smart tech...'),
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


  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim().length > 1) {
      const filtered = globalProducts.filter(p => 
        p.name.toLowerCase().includes(value.toLowerCase()) || 
        (p.category_name || p.category_id || p.category || '').toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(t_smart('Voice search is not supported in your browser.'), "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInputValue(speechToText);
      setSearchQuery(speechToText);
      showToast(t_smart('Voice search: ') + `"${speechToText}"`, "success");
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue);
      setShowSuggestions(false);
      setActivePage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
  
  const formatPrice = (price) => {
    return price ? price.toLocaleString() : '0';
  };

  const mappedProducts = globalProducts.length > 0 ? globalProducts.map((p, i) => {
    return {
      ...p,
      id: String(p.id),
      name: p.name,
      price: p.price,
      originalPrice: p.original_price || p.price,
      image: p.image_url || p.image || '/hero-banner.png',
      category: p.category || p.category_name || p.category_id || 'Electronics',
      brand: p.brand || 'SWEETO',
      discount: p.discount || (p.original_price && p.price < p.original_price ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0),
      tag: p.is_new_arrival ? 'NEW' : (p.is_deal ? 'DEAL' : ''),
      rating: p.rating || 4.5,
      reviews: p.reviews,
      reviewsCount: Array.isArray(p.reviews) ? p.reviews.length : (typeof p.reviews === 'string' ? (function(){ try { return JSON.parse(p.reviews).length; } catch(e){ return 0; }})() : (p.reviews || 0)),
      views: p.views || Math.floor((Number(p.id) * 13 % 1000)) + 100,
      likes: p.likes || Math.floor((Number(p.id) * 7 % 100)) + 10,
      specs: p.specs || [],
      isDeal: p.is_deal || false,
      isNew: (function() {
        if (p.created_at) {
          const createdDate = new Date(p.created_at);
          const ageInDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
          return ageInDays <= 5;
        }
        return Number(p.is_new_arrival) === 1 || p.is_new_arrival === true || String(p.is_new_arrival) === '1' || String(p.is_new_arrival) === 'true';
      })()
    };
  }) : [];

  const showBestSellers = settings?.best_sellers_enabled === 'true' || settings?.best_sellers_enabled === true || settings?.best_sellers_enabled === undefined;
  
  const bestSellerProductIds = Array.isArray(settings?.best_sellers_products) 
    ? settings.best_sellers_products 
    : (typeof settings?.best_sellers_products === 'string' 
        ? (function() { try { return JSON.parse(settings.best_sellers_products); } catch(e) { return []; } })() 
        : []);
  
  const bestSellersList = bestSellerProductIds.length > 0 
    ? mappedProducts.filter(p => bestSellerProductIds.includes(String(p.id))) 
    : mappedProducts.slice(0, 6);

  const first20Products = [...mappedProducts]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .slice(0, 20);

  const mappedCategories = globalCategories.length > 0 ? globalCategories.map((c, i) => {
    let catImage = c.image_url || c.image;
    if (!catImage && c.icon && (c.icon.includes('/') || c.icon.includes('.'))) {
      catImage = c.icon.startsWith('project/public/') ? c.icon.replace('project/public/', '/') : c.icon;
    }
    if (!catImage) {
      const catProducts = globalProducts.filter(p => p.category === c.name || Number(p.category_id) === Number(c.id));
      if (catProducts.length > 0) catImage = catProducts[0].image_url || catProducts[0].image;
    }
    
    return {
      ...c,
      id: String(c.id),
      name: c.name,
      itemsCount: c.itemsCount || 'Products',
      icon: c.icon || '🛍️',
      image: catImage || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80',
      bg: 'from-indigo-500/10 to-violet-500/10'
    };
  }) : [];

  const mappedBrands = Array.from(new Set(mappedProducts.map(p => p.brand))).filter(Boolean).map((brandName, index) => ({
    id: `brand-${index}`,
    name: brandName,
    logo: '✨',
    itemsCount: mappedProducts.filter(p => p.brand === brandName).length + ' Products'
  }));

  const location = useLocation();
  const { productId: rawProductId } = useParams();
  const productId = rawProductId ? rawProductId.toLowerCase().replace(/^swt-/, '') : '';



  const getInitialPage = () => {
    const hash = window.location.hash.replace(/^#/, '');
    const path = hash.startsWith('/') ? hash : location.pathname;
    if (path.includes('/wishlist')) return 'wishlist';
    if (path.includes('/deals')) return 'deals';
    if (path.includes('/new-arrivals')) return 'new-arrivals';
    if (path.includes('/auth') || path.includes('/login') || path.includes('/register') || path.includes('/settings') || path.includes('/orders')) return 'auth';
    return 'home';
  };

  const [activePage, setActivePage] = useState(getInitialPage());

  useEffect(() => {
    setActivePage(getInitialPage());
  }, [location]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  useEffect(() => {
    if (mappedProducts.length === 0) return;
    let list = [];
    if (activePage === 'category' && selectedCategory) {
      list = mappedProducts.filter(p => p.category !== selectedCategory);
    } else if (activePage === 'brands' && selectedBrand) {
      list = mappedProducts.filter(p => p.brand === selectedBrand);
    } else {
      list = [...mappedProducts];
    }
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setMoreToLoveProducts(shuffled.slice(0, 16));
  }, [activePage, selectedCategory, selectedBrand, mappedProducts.length]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileDropdown(false);
    navigate('/');
  };

  // Unending Feed state
  const [infiniteProducts, setInfiniteProducts] = useState(() => mappedProducts);
  const [isLoadingInfinite, setIsLoadingInfinite] = useState(false);
  const infiniteObserverRef = useRef(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [likedProducts, setLikedProducts] = useState(['prod-d1', 'prod-d2']);
  const [likesMap, setLikesMap] = useState(() => {
    const map = {};
    mappedProducts.forEach(p => { map[p.id] = p.likes || 100; });
    return map;
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  const categorySliderRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadMoreInfiniteProducts = () => {
    if (isLoadingInfinite) return;
    setIsLoadingInfinite(true);
    setTimeout(() => {
      setInfiniteProducts(prev => {
        const batchNum = Math.floor(prev.length / mappedProducts.length) + 1;
        const nextBatch = mappedProducts.map((p, idx) => ({
          ...p,
          id: `${p.id}-inf-${batchNum}-${idx}`,
          views: (p.views || 1000) + Math.floor(Math.random() * 400),
          likes: (likesMap[p.id] || p.likes || 100) + Math.floor(Math.random() * 15)
        }));
        return [...prev, ...nextBatch];
      });
      setIsLoadingInfinite(false);
    }, 1300); // Simulated delay for "load for small time"
  };

  useEffect(() => {
    if (activePage !== 'home') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingInfinite) {
          loadMoreInfiniteProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (infiniteObserverRef.current) {
      observer.observe(infiniteObserverRef.current);
    }

    return () => {
      if (infiniteObserverRef.current) {
        observer.unobserve(infiniteObserverRef.current);
      }
    };
  }, [activePage, isLoadingInfinite, infiniteProducts]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const scrollCategories = (direction) => {
    if (categorySliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      categorySliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const addToCart = (product, e) => {
    if (e) e.stopPropagation();
    globalAddToCart(product, 1);
  };

  const toggleWishlist = (productId, e) => {
    if (e) e.stopPropagation();
    globalToggleWishlist(productId);
  };

  const toggleLike = (productId, e) => {
    if (e) e.stopPropagation();
    const isLiked = likedProducts.includes(productId);
    if (isLiked) {
      setLikedProducts(prev => prev.filter(id => id !== productId));
      setLikesMap(prev => ({ ...prev, [productId]: Math.max(0, (prev[productId] || 1) - 1) }));
      triggerToast('Removed from liked items.');
    } else {
      setLikedProducts(prev => [...prev, productId]);
      setLikesMap(prev => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
      triggerToast('Liked product!');
    }
  };

  const updateCartQuantity = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (item) {
      globalUpdateQuantity(id, item.quantity + delta);
    }
  };

  const removeFromCart = (id) => {
    globalRemoveFromCart(id);
  };

  const handleSelectCategory = (catName) => {
    setSelectedCategory(catName);
    setActiveCategoryPill('All');
    setActivePage('category');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectBrand = (brandName) => {
    setSelectedBrand(brandName);
    setActivePage('brands');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProductDetail = (product) => {
    navigate(`/product/${product.id}`);
  };

  const handleViewAllDeals = () => {
    setActivePage('deals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllNewArrivals = () => {
    setActivePage('new-arrivals');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewAllBestSellers = () => {
    setActivePage('best-sellers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const freeShippingThreshold = 500;
  const freeShippingProgress = Math.min(100, (cartSubtotal / freeShippingThreshold) * 100);

  const getMoreToLoveProducts = () => {
    if (isProductModalOpen && selectedProduct) {
      return mappedProducts.filter(p => (p.category === selectedProduct.category || p.brand === selectedProduct.brand) && p.id !== selectedProduct.id);
    }
    if (activePage === 'category' && selectedCategory) {
      return mappedProducts.filter(p => p.category !== selectedCategory);
    }
    if (activePage === 'brands' && selectedBrand) {
      return mappedProducts.filter(p => p.brand === selectedBrand);
    }
    const shuffled = [...mappedProducts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  };

  const ProductCard = ({ product, badgeBg = 'bg-blue-600', layout }) => {
    const finalPrice = product.price || 0;
    const oldPrice = product.originalPrice || (product.price * 1.25);
    const discount = product.discount || Math.round(((oldPrice - finalPrice) / oldPrice) * 100);
    const isWished = wishlist.includes(product.id);

    return (
      <div 
        onClick={() => openProductDetail(product)}
        className="bg-white dark:bg-[#0b0f19]/45 border border-slate-100 dark:border-slate-800/80 rounded-[1.75rem] p-4 flex flex-col justify-between text-left relative shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 cursor-pointer h-full select-none"
      >
        {/* Discount badge top-left */}
        {discount > 0 && layout !== 'unending' && (
          <span className="absolute top-3 left-3 bg-red-500/10 text-red-500 font-extrabold text-[9px] px-2 py-0.5 rounded border border-red-500/15 z-10 select-none uppercase">
            -{discount}% OFF
          </span>
        )}

        {/* Wishlist Heart Overlay top-right */}
        <button 
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id, e); }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80 flex items-center justify-center shadow-xs text-slate-400 hover:text-rose-500 transition cursor-pointer z-10"
        >
          <Heart size={14} fill={isWished ? "currentColor" : "none"} className={isWished ? "text-rose-500" : ""} />
        </button>

        {/* Image */}
        <div 
          className="w-full aspect-square bg-slate-50/50 dark:bg-slate-950 rounded-xl flex items-center justify-center p-3 relative overflow-hidden"
        >
          <img 
            src={product.image_url || product.image || '/hero-banner.png'} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain dark:mix-blend-normal group-hover:scale-[1.02] transition duration-300"
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80'; }}
          />
        </div>

        {/* Details */}
        <div className="space-y-2 mt-4 flex-1 flex flex-col justify-between">
          <div className="space-y-1">
            <h4 className="text-[10px] text-slate-450 font-bold uppercase tracking-wider line-clamp-1">{product.brand || 'SWEETO'}</h4>
            <h3 
              className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight line-clamp-2 hover:text-blue-600 transition"
            >
              {product.name}
            </h3>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-450">
            <div className="flex text-amber-500 gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill={i < (product.rating || 4) ? "currentColor" : "none"} strokeWidth={3} />
              ))}
            </div>
            <span>({product.reviewsCount || 430})</span>
          </div>

          {/* Price & CTA */}
          <div className="flex flex-col gap-2.5 pt-1.5">
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {finalPrice.toLocaleString()} {currencySymbol}
            </span>

            <button 
              onClick={(e) => { e.stopPropagation(); addToCart(product, e); }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition border-none flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart size={12} strokeWidth={2.5} />
              <span>Add to Cart</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMoreToLoveSection = () => {
    if (moreToLoveProducts.length === 0) return null;
    return (
      <section className="max-w-[1440px] mx-auto px-8 py-10 border-t border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
               <span className="text-rose-500">❤️</span> MORE TO LOVE
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Explore related gear and trending hardware handpicked for you</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {moreToLoveProducts.map((p) => (
            <ProductCard key={`mtl-${p.id}`} product={p} layout="unending" />
          ))}
        </div>
      </section>
    );
  };

  const renderUnendingProductsSection = () => (
    <section className="max-w-[1440px] mx-auto px-8 py-8 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20 rounded-[2.5rem] my-4 relative overflow-hidden select-none">
      {/* Decorative background blur shapes */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
        <div className="flex items-start gap-4">
          <div className="p-4 bg-gradient-to-tr from-[#1F6FEB] to-[#1554C0] text-white rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
            <IconInfinity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0A2540] dark:text-white uppercase italic tracking-tighter">
                {t_smart('UNENDING PRODUCT STREAM')}
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-400 text-white text-[9px] font-black uppercase px-3.5 py-1 rounded-full shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                {t_smart('INFINITE CATALOG')}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#5A6B84] dark:text-slate-400 max-w-xl">
              {t_smart('Continuously loading infinite hardware catalog. Keeps fetching as you scroll down!')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-sm">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t_smart('Showing')}{' '}
              <strong className="text-[#1F6FEB] font-black text-sm">
                {infiniteProducts.length}
              </strong>{' '}
              {t_smart('Products')}
            </span>
          </div>
        </div>
      </div>

      {/* Infinite Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {infiniteProducts.map((product) => (
          <ProductCard key={`unending-${product.id}`} product={product} layout="unending" />
        ))}
      </div>

      {/* Loading Trigger Sentinel & Skeleton UI */}
      <div ref={infiniteObserverRef} className="py-8 text-center flex flex-col items-center justify-center">
        {isLoadingInfinite ? (
          <div className="space-y-4 w-full max-w-4xl">
            <div className="flex items-center justify-center gap-3 bg-white border border-indigo-100 px-6 py-3 rounded-2xl shadow-md inline-flex mx-auto">
              <IconLoader />
              <span className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider">
                Loading More Fresh Hardware...
              </span>
            </div>

            {/* Skeleton Loading Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 opacity-75 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={`skel-${i}`} className="bg-slate-200/80 rounded-2xl h-64 p-4 flex flex-col justify-between">
                  <div className="bg-slate-300 h-28 rounded-xl w-full"></div>
                  <div className="space-y-2 mt-3">
                    <div className="bg-slate-300 h-3 w-1/2 rounded"></div>
                    <div className="bg-slate-300 h-4 w-5/6 rounded"></div>
                    <div className="bg-slate-300 h-5 w-1/3 rounded"></div>
                  </div>
                  <div className="bg-slate-300 h-8 rounded-xl w-full mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={loadMoreInfiniteProducts}
            className="bg-slate-900 hover:bg-indigo-600 text-white font-extrabold text-xs px-8 py-3.5 rounded-2xl shadow-lg transition flex items-center gap-2"
          >
            <IconInfinity />
            <span>LOAD MORE PRODUCTS NOW</span>
          </button>
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 transition-all transform animate-bounce">
          <IconZap />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <DesktopHeader 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onCartOpen={() => setIsCartOpen(true)}
        onSidebarOpen={() => setIsSidebarOpen(true)}
        onNotifOpen={() => setIsNotifOpen(true)}
      />

      {/* PAGE VIEW: WISHLIST */}
      {activePage === 'wishlist' && (
        <div className="max-w-[1440px] mx-auto px-8 py-10 min-h-[70vh]">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-slate-900">Home</button>
            <span>/</span>
            <span className="font-bold text-slate-900">My Wishlist</span>
          </div>
          <WishlistContent onProductClick={(product) => {
            openProductDetail(product);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} />
        </div>
      )}

      {/* PAGE VIEW: AUTH / ACCOUNT */}
      {activePage === 'auth' && (
        <AuthPage initialTab={location.pathname.includes('/settings') ? 'settings' : (location.pathname.includes('/orders') ? 'orders' : 'login')} />
      )}

      {/* PAGE VIEW: HOME PAGE */}
      {activePage === 'home' && (
        <main className="bg-slate-50/50 dark:bg-[#070b13] min-h-screen">
          {/* HERO BANNER - Full Width, Edge-to-Edge */}
          <section className="w-full">
            <DesktopHero 
              onProductClick={openProductDetail} 
              onCartOpen={() => setIsCartOpen(true)}
            />
          </section>

          {/* Redesigned Category row (Matches Screenshot) */}
          <section className="w-full bg-white dark:bg-[#0b0f19] border-b border-slate-100 dark:border-slate-800/80 select-none py-3 flex justify-center">
            <div className="max-w-[1440px] w-full px-8 md:px-12 flex justify-between items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {mappedCategories.filter(cat => !cat.parent_id).map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.name)}
                  className="flex items-center gap-3.5 cursor-pointer group py-1.5 shrink-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/20 flex items-center justify-center shrink-0 transition-colors">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <div className="text-left space-y-0.5">
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white group-hover:text-blue-650 dark:group-hover:text-blue-450 uppercase tracking-wider leading-tight transition-colors">{cat.name}</h4>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-tight">{getCategoryDesc(cat.name)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Best Sellers Section */}
          {showBestSellers && (
            <DealOfTheDaySection 
              title="BEST SELLERS"
              products={bestSellersList} 
              onProductClick={() => {
                setActivePage('best-sellers');
                window.scrollTo(0, 0);
              }}
              sectionType="bestseller"
              scrollDirection="right"
            />
          )}

          {/* Promo Banners Grid */}
          <section className="max-w-[1440px] mx-auto px-8 md:px-12 pb-4 select-none">
            <div className="grid grid-cols-3 gap-6">
              
              {/* Promo 1 */}
              <div className="bg-gradient-to-br from-[#0f202e] to-[#0b0f19] border border-slate-800/80 rounded-[2rem] p-6 text-left relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm group">
                <div className="space-y-2 relative z-10 max-w-[60%]">
                  <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">MEGA DEALS</span>
                  <h3 className="text-xl font-black text-white leading-tight uppercase italic tracking-tighter">Up to 40% Off <br/>On Selected Items</h3>
                  <button 
                    onClick={() => handleSelectCategory('Accessories')}
                    className="mt-4 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-955 font-black text-[9px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer border-none outline-none"
                  >
                    Shop Deals
                  </button>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-center justify-center p-2 opacity-85 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
                  <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=250" alt="" className="max-h-full max-w-full object-contain rounded-xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]" />
                </div>
              </div>

              {/* Promo 2 */}
              <div className="bg-gradient-to-br from-slate-50 via-slate-100 to-cyan-50/20 border border-slate-150 rounded-[2rem] p-6 text-left relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm group">
                <div className="space-y-2 relative z-10 max-w-[60%]">
                  <span className="text-[9px] font-black tracking-widest text-blue-600 uppercase">Smart Living</span>
                  <h3 className="text-xl font-black text-slate-900 leading-tight uppercase italic tracking-tighter">Smarter Devices <br/>Better Tomorrow</h3>
                  <button 
                    onClick={() => handleSelectCategory('Smart Home')}
                    className="mt-4 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-950 font-black text-[9px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer border border-slate-200 shadow-sm outline-none"
                  >
                    Explore Now
                  </button>
                </div>
                <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-center justify-center p-2 opacity-85 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
                  <img src="https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=250" alt="" className="max-h-full max-w-full object-contain rounded-xl drop-shadow-[0_8px_15px_rgba(0,0,0,0.15)]" />
                </div>
              </div>

              {/* Promo 3 */}
              <div className="bg-gradient-to-br from-[#0c1322] to-[#0f202e] border border-slate-800/80 rounded-[2rem] p-6 text-left relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm group">
                <div className="space-y-2 relative z-10 max-w-[60%]">
                  <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">Limited Time Offer</span>
                  <h3 className="text-xl font-black text-white leading-tight uppercase italic tracking-tighter">Exclusive Offers <br/>On Top Brands</h3>
                  <button 
                    onClick={() => handleSelectCategory('Wearables')}
                    className="mt-4 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-955 font-black text-[9px] uppercase tracking-wider rounded-lg transition active:scale-95 cursor-pointer border-none outline-none"
                  >
                    Shop Now
                  </button>
                </div>
                <div className="absolute right-4 bottom-2 top-2 w-[40%] flex items-center justify-center p-2 opacity-85 group-hover:scale-105 transition-transform duration-500 pointer-events-none">
                  <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=250" alt="" className="max-h-full max-w-full object-contain rounded-xl drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]" />
                </div>
              </div>

            </div>
            </section>

          {/* DEAL OF THE DAY SECTION */}
          <DealOfTheDaySection 
            products={mappedProducts.filter(p => p.isDeal)} 
            onProductClick={() => {
              setActivePage('deals');
              window.scrollTo(0, 0);
            }} 
          />

          {/* JUST ARRIVED SECTION */}
          {mappedProducts.filter(p => p.isNew).length > 0 && (
            <DealOfTheDaySection 
              title="JUST ARRIVED"
              products={mappedProducts.filter(p => p.isNew)} 
              onProductClick={openProductDetail} 
            />
          )}

          {/* UNENDING INFINITE CATALOG STREAM SECTION */}
          {renderUnendingProductsSection()}
        </main>
      )}

      {/* PAGE VIEW: BRANDS CATALOG PAGE WITH HERO BANNER SLIDER */}
      {activePage === 'brands' && (
        <div className="max-w-[1440px] mx-auto px-8 py-10">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <button onClick={() => setActivePage('home')} className="hover:text-slate-900">Home</button>
            <span>/</span>
            <span className="font-bold text-slate-900">Official Brands</span>
            {selectedBrand && (
              <>
                <span>/</span>
                <span className="font-bold text-indigo-600">{selectedBrand}</span>
              </>
            )}
          </div>

          {/* SECTION DYNAMIC HERO BANNER SLIDER */}
          <SectionHeroSlider currencySymbol={currencySymbol} formatPrice={formatPrice} 
            products={mappedProducts.filter(p => !selectedBrand || p.brand === selectedBrand)}
            title={selectedBrand ? `${selectedBrand} Flagship Collection` : 'Official Brand Partners'}
            subtitle={`Explore high-performance desktop hardware and accessories engineered by ${selectedBrand || 'world-class tech leaders'}.`}
            badgeText={selectedBrand ? `${selectedBrand} HIGHLIGHT` : "BRAND SHOWCASE"}
            badgeBg="bg-amber-600"
            onSelectProduct={openProductDetail}
            onAddToCart={addToCart}
          />

          <h1 className="text-3xl font-black text-slate-900 mb-8">
            {selectedBrand ? `${selectedBrand} Hardware Catalog` : 'All Partner Brand Products'}
          </h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
            {mappedProducts.filter(p => !selectedBrand || p.brand === selectedBrand).map((product) => (
              <ProductCard key={product.id} product={product} badgeBg="bg-slate-900" />
            ))}
          </div>

          {renderMoreToLoveSection()}
        </div>
      )}

      {/* PAGE VIEW: DEAL OF THE DAY PAGE WITH HERO BANNER SLIDER */}
      {activePage === 'deals' && (
        <div className="max-w-[1440px] mx-auto px-8 py-10">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <button onClick={() => setActivePage('home')} className="hover:text-slate-900">Home</button>
            <span>/</span>
            <span className="font-bold text-slate-900">Deals of the Day</span>
          </div>

          {/* SECTION DYNAMIC HERO BANNER SLIDER */}
          <SectionHeroSlider currencySymbol={currencySymbol} formatPrice={formatPrice} 
            products={mappedProducts.filter(p => p.isDeal)}
            title="Flash Deals & Limited-Time Discounts"
            subtitle="Massive daily discounts on high-end headphones, ultra-wide gaming monitors, laptops, and spatial headsets."
            badgeText="LIMITED TIME DEAL"
            badgeBg="bg-rose-600"
            onSelectProduct={openProductDetail}
            onAddToCart={addToCart}
          />

          <h1 className="text-3xl font-black text-slate-900 mb-8">Deals of the Day Catalog</h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
            {mappedProducts.filter(p => p.isDeal).map((product) => (
              <ProductCard key={product.id} product={product} layout="deal" />
            ))}
          </div>

          {renderMoreToLoveSection()}
        </div>
      )}

      {/* PAGE VIEW: JUST ARRIVED PAGE WITH HERO BANNER SLIDER */}
      {activePage === 'new-arrivals' && (
        <div className="max-w-[1440px] mx-auto px-8 py-10">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <button onClick={() => setActivePage('home')} className="hover:text-slate-900">Home</button>
            <span>/</span>
            <span className="font-bold text-slate-900">Just Arrived</span>
          </div>

          {/* SECTION DYNAMIC HERO BANNER SLIDER */}
          <SectionHeroSlider currencySymbol={currencySymbol} formatPrice={formatPrice} 
            products={mappedProducts.filter(p => p.isNew)}
            title="Next-Gen Hardware & Fresh Releases"
            subtitle="Be the first to experience our newly arrived drones, spatial VR tech, and skeleton titanium timepieces."
            badgeText="NEW RELEASES 2026"
            badgeBg="bg-indigo-600"
            onSelectProduct={openProductDetail}
            onAddToCart={addToCart}
          />

          <h1 className="text-3xl font-black text-slate-900 mb-8">Just Arrived Catalog</h1>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
            {mappedProducts.filter(p => p.isNew).map((product) => (
              <ProductCard key={product.id} product={product} layout="new_arrivals" />
            ))}
          </div>

          {renderMoreToLoveSection()}
        </div>
      )}

      {/* PAGE VIEW: BEST SELLERS VIEW ALL PAGE */}
      {activePage === 'best-sellers' && (
        <div className="max-w-[1440px] mx-auto px-8 py-10 select-none text-left">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
            <button onClick={() => setActivePage('home')} className="hover:text-slate-900 bg-transparent border-none outline-none cursor-pointer p-0">Home</button>
            <span>/</span>
            <span className="font-bold text-slate-900 dark:text-white">Best Sellers</span>
          </div>

          {/* SECTION DYNAMIC HERO BANNER SLIDER */}
          {first20Products.length > 0 && (
            <SectionHeroSlider currencySymbol={currencySymbol} formatPrice={formatPrice} 
              products={first20Products}
              title="Bestselling Premium Products"
              subtitle="Explore our top-selling, highest-rated technology devices and premium hardware releases."
              badgeText="BEST SELLERS 2026"
              badgeBg="bg-blue-600"
              onSelectProduct={openProductDetail}
              onAddToCart={addToCart}
            />
          )}

          <div className="flex flex-col gap-6 mt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Best Sellers Collection</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
                Showing First 20 Added Products
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
              {first20Products.map((product) => (
                <ProductCard key={product.id} product={product} layout="bestseller" />
              ))}
            </div>
          </div>

          {renderMoreToLoveSection()}
        </div>
      )}

      {/* PAGE VIEW: CATEGORY FILTER PAGE WITH HERO BANNER SLIDER */}
      {/* PAGE VIEW: CATEGORY FILTER PAGE WITH HERO BANNER SLIDER */}
      {activePage === 'category' && (() => {
        const descendants = getCategoryDescendants(selectedCategory, globalCategories).map(d => d.toLowerCase());
        const categoryProducts = mappedProducts.filter(p => p.category && descendants.includes(p.category.toLowerCase()));

        const parentCat = globalCategories.find(c => c.name?.toLowerCase() === selectedCategory?.toLowerCase());
        const subcats = parentCat ? globalCategories.filter(c => c.parent_id === parentCat.id) : [];
        
        const filterPills = subcats.length > 0 
          ? ['All', ...subcats.map(s => s.name)] 
          : ['All', ...[...new Set(categoryProducts.map(p => p.brand).filter(Boolean))]];

        const filteredProducts = categoryProducts.filter(p => {
          if (activeCategoryPill === 'All') return true;
          const isBrand = !globalCategories.some(c => c.name?.toLowerCase() === activeCategoryPill?.toLowerCase());
          if (isBrand) {
            return p.brand?.toLowerCase() === activeCategoryPill?.toLowerCase();
          } else {
            const pillDescendants = getCategoryDescendants(activeCategoryPill, globalCategories).map(d => d.toLowerCase());
            const matchNames = [activeCategoryPill.toLowerCase(), ...pillDescendants];
            return p.category && matchNames.includes(p.category.toLowerCase());
          }
        });

        return (
          <div className="max-w-[1440px] mx-auto px-8 py-10 select-none text-left">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
              <button onClick={() => setActivePage('home')} className="hover:text-slate-900 bg-transparent border-none outline-none cursor-pointer p-0">Home</button>
              <span>/</span>
              <span className="font-bold text-slate-900 dark:text-white">{selectedCategory}</span>
              {activeCategoryPill !== 'All' && (
                <>
                  <span>/</span>
                  <span className="font-extrabold text-blue-650 dark:text-blue-400">{activeCategoryPill}</span>
                </>
              )}
            </div>

            {/* SECTION DYNAMIC HERO BANNER SLIDER */}
            {categoryProducts.length > 0 && (
              <SectionHeroSlider currencySymbol={currencySymbol} formatPrice={formatPrice} 
                products={categoryProducts}
                title={`${selectedCategory || 'Category'} Spotlight`}
                subtitle={`Browse premium items, active discounts, and high-performance hardware in ${selectedCategory}.`}
                badgeText="CATEGORY FEATURE"
                badgeBg="bg-violet-600"
                onSelectProduct={openProductDetail}
                onAddToCart={addToCart}
              />
            )}

            <div className="flex flex-col gap-6 mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Category: {selectedCategory}</h1>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200/50 dark:border-slate-800/50">
                  {filteredProducts.length} Items Found
                </span>
              </div>

              {/* Subcategory / Brand Pills Filter Row */}
              {filterPills.length > 1 && (
                <div className="w-full flex flex-wrap gap-2.5 py-1 select-none">
                  {filterPills.map((pill) => {
                    const isSelected = activeCategoryPill === pill;
                    return (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setActiveCategoryPill(pill)}
                        className={`text-[11px] font-extrabold px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 border flex items-center gap-1.5 active:scale-[0.93] cursor-pointer select-none ${
                          isSelected 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-md font-black scale-[1.02]' 
                            : 'bg-white dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 border-slate-200/50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
                        }`}
                      >
                        {pill === 'All' ? (
                          <Heart 
                            size={11} 
                            className={`shrink-0 ${isSelected ? 'text-white fill-white' : 'text-blue-650 dark:text-blue-400'}`} 
                          />
                        ) : (
                          <span>{getCategoryEmoji(pill)}</span>
                        )}
                        <span>{t_smart(pill)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Filtered Products Grid */}
              <div className="w-full pt-4">
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} badgeBg="bg-indigo-650" />
                    ))}
                  </div>
                ) : (
                  <div className="py-20 text-center text-slate-500 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-100 dark:border-slate-800/80 shadow-xs">
                    <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4 animate-bounce" />
                    <p className="font-bold text-sm uppercase tracking-wider">No items found</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Try checking another sub-category filter</p>
                  </div>
                )}
              </div>
            </div>

            {renderMoreToLoveSection()}
          </div>
        );
      })()}

      {/* PAGE VIEW: PRODUCT DETAIL PAGE REMOVED - REPLACED BY PRODUCT MODAL */}


      {/* QUICK VIEW MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            onClick={() => setQuickViewProduct(null)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          ></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-3xl max-w-2xl w-full p-6 overflow-hidden shadow-2xl border border-slate-200 z-10">
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <IconClose />
              </button>
              <div className="grid grid-cols-2 gap-6">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-64 object-cover rounded-2xl bg-slate-100" />
                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">{quickViewProduct.category}</span>
                    <h3 className="font-bold text-slate-900 text-lg mt-1 mb-2">{quickViewProduct.name}</h3>
                    <div className="text-2xl font-black text-slate-900 mb-3">{currencySymbol}{formatPrice(quickViewProduct.price)}</div>
                    <p className="text-xs text-slate-600 mb-4">{quickViewProduct.description}</p>
                  </div>
                  <button 
                    onClick={(e) => { addToCart(quickViewProduct, e); setQuickViewProduct(null); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition text-xs flex items-center justify-center gap-2"
                  >
                    <IconCart /> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION SIDEBAR DRAWER */}
      {isSidebarOpen && (
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          desktopMode={true} 
        />
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          ></div>

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCart />
                  <h3 className="font-black text-slate-900 text-lg">Your Desktop Cart</h3>
                  <span className="text-xs font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                    {cart.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                >
                  <IconClose />
                </button>
              </div>

              <div className="bg-indigo-50 p-4 border-b border-indigo-100">
                <div className="flex justify-between text-xs font-bold text-indigo-900 mb-1.5">
                  <span>
                    {cartSubtotal >= freeShippingThreshold 
                      ? '🎉 You unlocked FREE Express Shipping!' 
                      : `Add ${currencySymbol}${formatPrice(freeShippingThreshold - cartSubtotal)} more for FREE Express Shipping`}
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${freeShippingProgress}%` }}></div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <div className="text-5xl mb-3">🛒</div>
                    <p className="font-bold text-slate-600">Your shopping cart is empty.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-white" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold">{item.category}</span>
                          <div className="font-black text-slate-900 text-sm mt-1">{currencySymbol}{formatPrice(item.price)}</div>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
                            <button onClick={() => updateCartQuantity(item.id, -1)} className="font-bold text-slate-600 hover:text-slate-900">-</button>
                            <span className="font-bold px-1">{item.quantity}</span>
                            <button onClick={() => updateCartQuantity(item.id, 1)} className="font-bold text-slate-600 hover:text-slate-900">+</button>
                          </div>

                          <button onClick={() => removeFromCart(item.id)} className="text-xs text-rose-500 font-semibold hover:underline">
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">{currencySymbol}{formatPrice(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Express Shipping</span>
                  <span className="font-bold text-slate-900">
                    {cartSubtotal >= freeShippingThreshold ? 'FREE' : `${currencySymbol}15.00`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-lg pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span>{currencySymbol}{formatPrice(cartSubtotal + (cartSubtotal >= freeShippingThreshold || cartSubtotal === 0 ? 0 : 15))}</span>
                </div>

                <button 
                  onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                  disabled={cart.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black py-4 rounded-2xl shadow-xl transition text-center text-sm"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NotificationsDrawer 
        isOpen={isNotifOpen} 
        onClose={() => setIsNotifOpen(false)} 
        onProductClick={openProductDetail} 
      />

    </div>
  );
}


