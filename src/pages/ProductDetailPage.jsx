import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShoppingCart, Star, Minus, Plus, MessageCircle, 
  Share2, Heart, Shield, Award, MapPin, ChevronRight, Clock, Check, Search, ChevronLeft
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
  const { products: liveProducts, settings, showToast, addToRecent } = useStore();
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
  
  // Countdown timers for flash deal
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

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

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-10 h-10 border-4 border-eas-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  const getImagesList = () => {
    const list = [];
    const mainImg = product.image_url || product.image;
    if (mainImg) list.push(mainImg);
    if (product.images) {
      try {
        const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
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
  const imagesList = getImagesList();

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
      
      {/* Desktop Header */}
      <Header onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
      
      {/* Mobile Visual Gallery (Full-bleed AliExpress Style) */}
      <div 
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

            {/* Variant tag / Specification Details */}
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left space-y-4 shadow-sm">
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
            <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left shadow-sm">
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
        <div className="mt-12 space-y-6 text-left">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-t border-slate-150 dark:border-slate-800 flex justify-between items-center lg:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => showToast("Opening chat support... 💬", "success")}
            className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-eas-blue cursor-pointer"
          >
            <MessageCircle size={20} />
            <span className="text-[9px] font-bold uppercase mt-0.5">Chat</span>
          </button>
          <button 
            onClick={() => toggleWishlist(product)}
            className="flex flex-col items-center text-slate-500 dark:text-slate-400 hover:text-red-500 cursor-pointer"
          >
            <Heart size={20} fill={isInWishlist(product.id) ? "currentColor" : "none"} className={isInWishlist(product.id) ? "text-red-500" : ""} />
            <span className="text-[9px] font-bold uppercase mt-0.5">Wish</span>
          </button>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={() => {
              addToCart(product);
              showToast("Added to shopping cart! 🛒", "success");
            }}
            className="px-5 py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-97 cursor-pointer"
          >
            Add to Cart
          </button>
          <button 
            onClick={handleBuyNow}
            className="px-6 py-3.5 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-md active:scale-97 cursor-pointer"
          >
            Buy Now
          </button>
        </div>
      </div>

      {/* Global Sidebar & Cart overlay drawers */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <MobileDock onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
    </div>
  );
};

export default ProductDetailPage;
