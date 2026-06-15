import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShoppingCart, Star, Minus, Plus, MessageCircle, 
  Share2, Heart, Shield, Award, MapPin, ChevronRight, Clock, Check, Search, ChevronLeft, X, Camera
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from '../components/ProductCard';
import Header from '../components/Header';
import MobileDock from '../components/MobileDock';
import CartDrawer from '../components/CartDrawer';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products: liveProducts, settings, showToast, addToRecent, setSearchQuery, setSelectedCategory, setSelectedBrand } = useStore();
  const { addToCart, cartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { lang, t, t_smart } = useLanguage();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('specs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [activeScrollSection, setActiveScrollSection] = useState('overview');
  
  // Countdown timers for flash deal
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [sheetScrollY, setSheetScrollY] = useState(0);

  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getImagesList = (prod) => {
    if (!prod) return [];
    const list = [];
    const mainImg = prod.image_url || prod.image;
    if (mainImg) list.push(mainImg);
    if (prod.images) {
      try {
        const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
        if (Array.isArray(imgs)) {
          imgs.forEach(img => {
            if (img && !list.includes(img)) list.push(img);
          });
        }
      } catch (e) {}
    }
    if (list.length === 0) list.push('/hero-banner.png');
    return list;
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 120) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
      }

      const overviewEl = document.getElementById('product-overview');
      const reviewsEl = document.getElementById('product-reviews');
      const descEl = document.getElementById('product-description');
      const recomEl = document.getElementById('product-recommendations');

      if (recomEl && currentScrollY >= recomEl.offsetTop - 140) {
        setActiveScrollSection('recommendations');
      } else if (descEl && currentScrollY >= descEl.offsetTop - 140) {
        setActiveScrollSection('description');
      } else if (reviewsEl && currentScrollY >= reviewsEl.offsetTop - 140) {
        setActiveScrollSection('reviews');
      } else {
        setActiveScrollSection('overview');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 34, seconds: 12 }; // Loop
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (productId && liveProducts.length > 0) {
      const foundProduct = liveProducts.find(p => p.id.toString() === productId.toString());
      if (foundProduct) {
        setProduct(foundProduct);
        addToRecent(foundProduct);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        navigate('/');
      }
    }
  }, [productId, liveProducts, navigate]);

  useEffect(() => {
    if (product) {
      const list = getImagesList(product);
      const mapped = list.map((img, idx) => {
        let name = 'Default Color';
        if (idx === 0) name = 'EDC Knife';
        else if (idx === 1) name = 'Silver Metal';
        else if (idx === 2) name = 'Shadow Black';
        else if (idx === 3) name = 'Carbon Steel';
        else name = `Option ${idx + 1}`;
        return { id: idx, name, image: img };
      });
      setVariants(mapped);
      setSelectedVariant(mapped[0] || null);
    }
  }, [product]);

  // Early return if product is not loaded yet (all hooks must be declared above this point!)
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-10 h-10 border-4 border-eas-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      setActiveImageIndex(prev => (prev + 1) % imagesList.length);
    } else if (diff < -50) {
      setActiveImageIndex(prev => (prev - 1 + imagesList.length) % imagesList.length);
    }
    setTouchStartX(null);
  };

  const imagesList = getImagesList(product);

  const handleSheetScroll = (e) => {
    setSheetScrollY(e.currentTarget.scrollTop);
  };

  const handleSearchInputValueChange = (value) => {
    setSearchInputValue(value);
    if (value.trim().length > 1) {
      const filtered = liveProducts.filter(p => 
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

  const handleSuggestionClick = (prod) => {
    setSearchInputValue('');
    setShowSuggestions(false);
    setIsSearchOverlayOpen(false);
    navigate(`/product/${prod.id}`);
  };

  // Extract unique categories dynamically from products list
  const categories = Array.from(new Set(liveProducts.map(p => p.category).filter(Boolean))).slice(0, 12);

  const handleDiscoverClick = (categoryName) => {
    setSearchQuery('');
    setSelectedCategory(categoryName);
    setSelectedBrand(null);
    setIsSearchOverlayOpen(false);
    navigate('/');
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchInputValue.trim()) {
      setSearchQuery(searchInputValue);
      setSelectedCategory(null);
      setSelectedBrand(null);
      setIsSearchOverlayOpen(false);
      navigate('/');
    }
  };

  // Recommendations feed
  const recommendedProducts = liveProducts
    .filter(p => p.id.toString() !== product.id.toString())
    .slice(0, 6);

  const averageRating = product.average_rating || 4.8;
  const reviewCount = product.reviews_count || 12;

  const handleBuyNow = () => {
    addToCart(product);
    navigate('/checkout');
  };

  const handleWhatsAppClick = () => {
    const phone = settings?.social_whatsapp ? settings.social_whatsapp.replace(/\D/g, '') : '2250500619923';
    const text = lang === 'fr'
      ? `Bonjour! Est-ce que ce produit est disponible en stock? ${product.name} (${window.location.href})`
      : `Hello! Do you have this product in stock? ${product.name} (${window.location.href})`;
    const message = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Check out ${product.name} on SWEETO HUB!`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link copied to clipboard! 🔗", "success");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-white pb-24 transition-colors duration-300">
      {/* Mobile Sticky Scroll Header (revealed on scroll) */}
      <AnimatePresence>
        {showStickyHeader && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 md:hidden flex flex-col pt-3 pb-1"
          >
            {/* Header top row */}
            <div className="flex items-center justify-between px-4 gap-3">
              {/* Back chevron */}
              <button 
                onClick={() => navigate(-1)}
                className="text-slate-800 dark:text-white p-1 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>

              {/* Search Bar Input Container */}
              <div 
                onClick={() => {
                  setSearchInputValue(product.category || '');
                  setIsSearchOverlayOpen(true);
                }}
                className="flex-1 bg-slate-100 dark:bg-slate-800/80 rounded-full py-1 pl-4 pr-1 flex items-center justify-between cursor-pointer border border-slate-200/50 dark:border-slate-700/50"
              >
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                  {product.category || product.name}
                </span>
                <div className="px-3 py-1.5 bg-slate-900 dark:bg-slate-950 rounded-full flex items-center justify-center text-white scale-90">
                  <Search size={12} strokeWidth={3} />
                </div>
              </div>

              {/* Share button */}
              <button 
                onClick={shareProduct}
                className="text-slate-800 dark:text-white p-1 cursor-pointer hover:opacity-70 transition-opacity"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </button>
            </div>

            {/* Header tab items */}
            <div className="flex items-center justify-around mt-2.5 border-t border-slate-100/60 dark:border-slate-800/40 px-2 select-none">
              {[
                { id: 'overview', targetId: 'product-overview', label: lang === 'fr' ? 'Aperçu' : 'Overview' },
                { id: 'reviews', targetId: 'product-reviews', label: lang === 'fr' ? 'Avis' : 'Reviews' },
                { id: 'description', targetId: 'product-description', label: lang === 'fr' ? 'Description' : 'Description' },
                { id: 'recommendations', targetId: 'product-recommendations', label: lang === 'fr' ? 'Recommandations' : 'Recommendations' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.targetId)}
                  className={`py-2 text-[10px] font-black uppercase tracking-wider relative cursor-pointer transition-colors duration-300 ${
                    activeScrollSection === tab.id 
                      ? 'text-[#e61e25] font-black' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-650'
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeScrollSection === tab.id && (
                    <motion.div 
                      layoutId="activeStickyTabUnderline" 
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e61e25] rounded-full" 
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Header */}
      <Header onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
      
      {/* Mobile Visual Gallery (Full-bleed AliExpress Style) */}
      <div 
        id="product-overview"
        className="block lg:hidden w-full aspect-square bg-white dark:bg-slate-900 relative overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={imagesList[activeImageIndex]} 
          alt={product.name} 
          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
        />

        {/* Top-left: Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors z-20"
        >
          <ChevronLeft size={20} strokeWidth={3} />
        </button>

        {/* Top-right: Zoom & Share Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
          <button 
            onClick={() => showToast("Swipe left or right to change images! 📷", "info")} 
            className="w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors"
          >
            <Search size={18} />
          </button>
          <button 
            onClick={shareProduct} 
            className="w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Center: Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button 
            onClick={() => showToast("Playing product video presentation... 🎬", "success")}
            className="w-12 h-12 rounded-full bg-slate-950/40 border-2 border-white flex items-center justify-center text-white cursor-pointer hover:bg-slate-950/65 transition-all pointer-events-auto transform hover:scale-105 active:scale-95 shadow-md"
          >
            <svg className="w-5 h-5 fill-current ml-1 text-white" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        {/* Bottom-left: Slide Indicator Pill */}
        <div className="absolute bottom-4 left-4 bg-slate-950/40 backdrop-blur-sm px-3.5 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider select-none z-20">
          Item {activeImageIndex + 1}/{imagesList.length}
        </div>

        {/* Bottom-right: Wishlist Heart Button */}
        <button 
          onClick={() => toggleWishlist(product)} 
          className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 flex items-center justify-center shadow-lg cursor-pointer transition-all z-20"
        >
          <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-red-500" : ""} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:py-6">
        {/* Main Columns wrapper */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Visual Gallery Carousel (Desktop only) */}
          <div className="hidden lg:block w-full lg:w-[45%] bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm space-y-4">
            
            {/* Main Image View */}
            <div className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden group">
              <img 
                src={imagesList[activeImageIndex]} 
                alt={product.name} 
                className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Wishlist Floating Overlay */}
              <button 
                onClick={() => toggleWishlist(product)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-md text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-red-500" : ""} />
              </button>
            </div>

            {/* Thumbnails Row */}
            {imagesList.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto py-1 no-scrollbar select-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-950 p-1 border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-eas-blue ring-2 ring-eas-blue/15' 
                        : 'border-slate-100 dark:border-slate-800/60 hover:border-slate-200'
                    }`}
                  >
                    <img src={img} alt="" className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Key details */}
          <div className="w-full lg:w-[55%] space-y-6">
            
            {/* Flash Deal Urgency Countdown */}
            <div className="bg-gradient-to-r from-[#e61e25] to-[#f94e55] rounded-3xl p-4 flex justify-between items-center text-white shadow-md">
              <div className="flex items-center gap-2">
                <Clock size={18} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Flash Deal Discount</span>
              </div>
              <div className="flex items-center gap-1.5 font-black text-xs">
                <span className="bg-black/20 px-2 py-1 rounded-lg tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/20 px-2 py-1 rounded-lg tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/20 px-2 py-1 rounded-lg tracking-tight">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Header info */}
            <div className="space-y-3.5 text-left">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-snug">
                {product.name}
              </h1>

              {/* Pricing row */}
              <div className="flex items-baseline gap-3.5">
                <span className="text-2xl sm:text-3xl font-black text-[#e61e25] italic tracking-tighter">
                  {settings?.currency || 'XOF'} {product.price?.toLocaleString()}
                </span>
                {product.old_price && (
                  <span className="text-sm text-slate-400 dark:text-slate-500 line-through font-bold">
                    {settings?.currency || 'XOF'} {product.old_price.toLocaleString()}
                  </span>
                )}
                <span className="bg-[#e61e25]/10 text-[#e61e25] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  {product.old_price ? `${Math.round(((product.old_price - product.price) / product.old_price) * 100)}% OFF` : '50% OFF'}
                </span>
              </div>

              {/* Rating + Sold proof */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">{averageRating}</span>
                </div>
                <span>•</span>
                <span>{reviewCount} Reviews</span>
                <span>•</span>
                <span className="text-[#e61e25] uppercase tracking-wide italic">500+ Sold</span>
              </div>
            </div>

            {/* Variant Selector Button (Mobile only) */}
            <button 
              onClick={() => setIsVariantSheetOpen(true)}
              className="w-full bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 px-5 py-4 flex justify-between items-center cursor-pointer shadow-sm active:scale-[0.99] transition-all text-left lg:hidden"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                <span className="text-slate-400 dark:text-slate-500 font-bold capitalize">Color:</span>
                <span>{selectedVariant ? selectedVariant.name : 'Default'}</span>
              </div>
              <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
            </button>

            {/* Variant tag / Specification Details */}
            <div id="product-reviews" className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 dark:border-slate-800/40">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">Details & Warranty</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[9px]">Category</span>
                  <p className="text-slate-700 dark:text-slate-200">{product.category || 'Official Category'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[9px]">Status</span>
                  <p className="text-emerald-500 uppercase">In Stock</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[9px]">Warranty</span>
                  <p className="text-slate-700 dark:text-slate-200">Official Warranty Included</p>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 uppercase text-[9px]">Brand</span>
                  <p className="text-slate-700 dark:text-slate-200">{product.brand || 'Sweeto Official'}</p>
                </div>
              </div>
            </div>

            {/* Logistics shipping box */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                <MapPin size={16} className="text-[#e61e25]" />
                <span>Shipping Details</span>
              </div>
              <div className="text-xs font-bold space-y-1.5 text-slate-600 dark:text-slate-350">
                <p className="flex justify-between">
                  <span>Destination:</span>
                  <span className="text-slate-900 dark:text-white">Cote D'Ivoire</span>
                </p>
                <p className="flex justify-between text-[#e61e25]">
                  <span>Shipping Cost:</span>
                  <span className="font-extrabold">{settings?.currency || 'XOF'} 1,500</span>
                </p>
                <p className="flex justify-between text-[10px] text-slate-400 uppercase">
                  <span>Tracking:</span>
                  <span>Full tracking available</span>
                </p>
              </div>
            </div>

            {/* Store details banner */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 flex justify-between items-center text-left shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center justify-center font-black text-sm text-eas-blue border border-slate-200/50">
                  SW
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white">Sweeto Official Store</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">98.4% Positive Feedback</p>
                </div>
              </div>
              <button 
                onClick={() => showToast("WhatsApp Support active! 💬", "success")}
                className="px-4 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Chat
              </button>
            </div>

            {/* Tabbed view: specs/faqs */}
            <div id="product-description" className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left shadow-sm">
              <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800/40 pb-2">
                {[
                  { id: 'specs', label: 'Specs' },
                  { id: 'faq', label: 'FAQ' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-1 text-xs font-black uppercase tracking-wider relative cursor-pointer ${
                      activeTab === tab.id ? 'text-[#e61e25]' : 'text-slate-400'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e61e25]" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="pt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-bold space-y-2">
                {activeTab === 'specs' ? (
                  <>
                    <p>• Model: {product.brand || 'Sweeto'} {product.id}</p>
                    <p>• Description: {product.description || 'Premium high-performance electronics gear engineered for ultimate diagnostics.'}</p>
                    <p>• Warranty: Full replacement coverage active</p>
                  </>
                ) : (
                  <>
                    <p><strong>Q: How long does delivery take?</strong></p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">A: Generally 24-48 hours depending on your city zone.</p>
                    <p><strong>Q: Is cash on delivery supported?</strong></p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">A: Yes, Abidjan and major zones support cash on delivery.</p>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* More to love grid */}
        <div id="product-recommendations" className="mt-12 space-y-6 text-left">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">More to love</h3>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Recommended products</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendedProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} index={idx} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-3.5 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4 lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        {/* WhatsApp Button (Arranged like bottom nav buttons) */}
        <motion.button 
          whileTap={{ scale: 0.92 }}
          onClick={handleWhatsAppClick}
          className="flex flex-col items-center justify-center cursor-pointer shrink-0 min-w-[56px] text-[#25D366] hover:text-[#20ba5a] transition-colors gap-1 relative"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-5 h-5 fill-[#25D366]"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="text-[8.5px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">WhatsApp</span>
        </motion.button>

        {/* Add to Cart Outline Pill & Buy Now Red Pill */}
        <div className="flex-1 flex gap-2.5">
          <button 
            onClick={() => {
              addToCart(product);
              showToast("Added to shopping cart! 🛒", "success");
            }}
            className="flex-1 py-3 px-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-97 cursor-pointer text-center whitespace-nowrap bg-transparent"
          >
            Add to Cart
          </button>
          <button 
            onClick={handleBuyNow}
            className="flex-1 py-3 px-4 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md active:scale-97 cursor-pointer text-center whitespace-nowrap"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Variant Slide-up Sheet (Mobile Bottom Sheet) */}
      <AnimatePresence>
        {isVariantSheetOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVariantSheetOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
            />

            {/* Bottom Sheet Modal */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0b1324] rounded-t-[2rem] shadow-2xl md:hidden flex flex-col max-h-[85vh]"
            >
              {/* Sticky Top Header (Only visible when scrolled down) */}
              {sheetScrollY > 100 ? (
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur z-20 shrink-0">
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedVariant ? selectedVariant.image : product.image_url} 
                      alt="" 
                      className="w-11 h-11 rounded-lg object-contain bg-slate-50 border border-slate-100 dark:border-slate-800" 
                    />
                    <div className="text-left">
                      <h4 className="text-[11px] font-black uppercase text-slate-850 dark:text-white truncate max-w-[190px]">
                        {product.name}
                      </h4>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                        Color: {selectedVariant ? selectedVariant.name : 'Default'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsVariantSheetOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                /* Unscrolled Close button */
                <div className="absolute top-4 right-4 z-20">
                  <button 
                    onClick={() => setIsVariantSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-950/40 backdrop-blur-sm flex items-center justify-center text-white cursor-pointer hover:bg-slate-950/60 transition-colors"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              )}

              {/* Scrollable Sheet Content */}
              <div 
                onScroll={handleSheetScroll}
                className="overflow-y-auto flex-1 pb-6 px-4 text-left no-scrollbar"
              >
                {/* Large visual image (Only shown when unscrolled) */}
                {sheetScrollY <= 100 && (
                  <div className="w-full aspect-[4/3] bg-white dark:bg-slate-900 rounded-b-2xl relative overflow-hidden flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800/40">
                    <img 
                      src={selectedVariant ? selectedVariant.image : product.image_url} 
                      alt="" 
                      className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
                    />
                    {/* Floating cart icon */}
                    <button 
                      onClick={() => {
                        addToCart(product);
                        showToast("Added to shopping cart! 🛒", "success");
                        setIsVariantSheetOpen(false);
                      }}
                      className="absolute bottom-4 right-4 w-11 h-11 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                )}

                {/* MID-YEAR SALE Banner & Price block */}
                <div className="mt-4 space-y-3">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-3 flex justify-between items-center text-white shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Mid-Year Sale • SuperDeals</span>
                    </div>
                    <span className="text-[9px] font-bold opacity-90 uppercase">Ends: Jun 25</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/40">
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#e61e25] italic tracking-tighter">
                          {settings?.currency || 'XOF'} {product.price?.toLocaleString()}
                        </span>
                        <span className="bg-[#e61e25]/10 text-[#e61e25] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                          -50% now | Save {settings?.currency || 'XOF'} {product.price?.toLocaleString()}
                        </span>
                      </div>
                      {product.old_price && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-through font-bold">
                          {settings?.currency || 'XOF'} {product.old_price.toLocaleString()}
                        </p>
                      )}
                    </div>
                    {/* Secondary floating cart when scrolled */}
                    {sheetScrollY > 100 && (
                      <button 
                        onClick={() => {
                          addToCart(product);
                          showToast("Added to shopping cart! 🛒", "success");
                          setIsVariantSheetOpen(false);
                        }}
                        className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Tax excluded, add at checkout if applicable; Extra 1% off with coins
                  </p>
                </div>

                {/* Variant Color Section */}
                <div className="mt-5 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Color: {selectedVariant ? selectedVariant.name : 'Default'}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((v, idx) => {
                      const isSelected = selectedVariant && selectedVariant.id === v.id;
                      return (
                        <button
                          key={v.id}
                          onClick={() => {
                            setSelectedVariant(v);
                            setActiveImageIndex(v.id);
                          }}
                          className={`relative w-20 aspect-square rounded-2xl p-1 bg-slate-50 dark:bg-slate-900/50 border transition-all cursor-pointer flex flex-col items-center justify-center ${
                            isSelected 
                              ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/10 dark:ring-white/10' 
                              : 'border-slate-150 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                          }`}
                        >
                          <img 
                            src={v.image} 
                            alt="" 
                            className="w-12 h-12 object-contain mix-blend-multiply dark:mix-blend-normal rounded-lg" 
                          />
                          <span className="text-[8px] font-black uppercase tracking-wide truncate max-w-full mt-1.5 text-slate-500 dark:text-slate-400">
                            {v.name}
                          </span>
                          
                          {/* Selected Check overlay */}
                          {isSelected && (
                            <div className="absolute top-1 left-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md p-0.5 shadow-sm scale-75">
                              <Check size={8} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Qty</h4>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">In stock</p>
                  </div>
                  <div className="border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-between w-24 p-1">
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-slate-800 dark:text-white select-none">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(q => q + 1)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Sticky Action Buttons */}
              <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-white/95 dark:bg-[#0b1324]/95 backdrop-blur flex gap-3 pb-[calc(env(safe-area-inset-bottom,0px)+14px)]">
                <button 
                  onClick={() => {
                    addToCart(product);
                    showToast("Added to shopping cart! 🛒", "success");
                    setIsVariantSheetOpen(false);
                  }}
                  className="flex-1 py-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-97 cursor-pointer text-center bg-transparent"
                >
                  Add to Cart
                </button>
                <button 
                  onClick={() => {
                    addToCart(product);
                    setIsVariantSheetOpen(false);
                    navigate('/checkout');
                  }}
                  className="flex-1 py-3 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md active:scale-97 cursor-pointer text-center"
                >
                  Buy Now
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Search Overlay Modal */}
      <AnimatePresence>
        {isSearchOverlayOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 z-[1000] bg-slate-50 dark:bg-[#0b1324] md:hidden flex flex-col"
          >
            {/* Search Top Bar */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0c1527] gap-3">
              {/* Close/Back Chevron */}
              <button 
                onClick={() => setIsSearchOverlayOpen(false)}
                className="text-slate-800 dark:text-white p-1 cursor-pointer hover:opacity-75"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>

              {/* Form Input Container */}
              <form 
                onSubmit={handleSearchSubmit}
                className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full py-1 pl-3.5 pr-1 flex items-center gap-2 border border-slate-200/50 dark:border-slate-700/50 relative"
              >
                {/* Camera Icon */}
                <button 
                  type="button" 
                  onClick={() => showToast("Visual image search coming soon! 📸", "info")}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-650 cursor-pointer"
                >
                  <Camera size={16} strokeWidth={2.5} />
                </button>
                
                {/* Divider */}
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
 
                {/* Input Text */}
                <input 
                  type="text" 
                  value={searchInputValue}
                  onChange={(e) => handleSearchInputValueChange(e.target.value)}
                  onFocus={() => searchInputValue.length > 1 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={lang === 'fr' ? "Rechercher des produits..." : "Search products..."}
                  className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 py-1"
                  autoFocus
                />

                {/* Clear button */}
                {searchInputValue && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setSearchInputValue('');
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }} 
                    className="text-slate-405 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                )}
 
                {/* Rounded Black Search Button */}
                <button 
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 dark:bg-slate-950 rounded-full flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all scale-90"
                >
                  <Search size={12} strokeWidth={3} />
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
                      {suggestions.map((prod) => (
                        <div 
                          key={prod.id}
                          onClick={() => handleSuggestionClick(prod)}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                            <img src={prod.image_url || prod.image || '/hero-banner.png'} alt={prod.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col text-start">
                            <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{prod.name}</span>
                            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{prod.category}</span>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Discover More Content Area */}
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white text-left mb-4">
                {lang === 'fr' ? 'Découvrir plus' : 'Discover more'}
              </h3>

              {/* Grid Layout (2 columns) */}
              <div className="grid grid-cols-2 gap-3">
                {categories.map((catName, idx) => {
                  // Find a representative product for its image
                  const representativeProduct = liveProducts.find(p => p.category === catName);
                  const imgUrl = representativeProduct?.image_url || representativeProduct?.image || '/hero-banner.png';
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleDiscoverClick(catName)}
                      className="flex items-center gap-3 p-2.5 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm hover:border-slate-350 dark:hover:border-slate-700 transition-colors text-left cursor-pointer group"
                    >
                      {/* Image Thumbnail */}
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center p-1 border border-slate-100 dark:border-slate-850 shrink-0 overflow-hidden">
                        <img 
                          src={imgUrl} 
                          alt="" 
                          className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform" 
                        />
                      </div>

                      {/* Text details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200 truncate leading-snug">
                          {catName}
                        </h4>
                        
                        {/* Subtitle Badges */}
                        {idx % 3 === 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black text-[#e61e25] mt-1 uppercase">
                            {/* Small Coupon SVG badge */}
                            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-1 9h-2v-2h2v2zm-4 0H5v-2h10v2zm4-4h-2V7h2v2zm-4 0H5V7h10v2z" />
                            </svg>
                            Coupons
                          </span>
                        ) : idx % 3 === 1 ? (
                          <span className="text-[8.5px] font-bold text-slate-400 dark:text-slate-500 mt-1 block">
                            {(idx * 12 + 45)}+ items
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-black text-amber-500 mt-1 uppercase">
                            ★ Trending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Sidebar & Cart overlay drawers */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

export default ProductDetailPage;
