import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  X, ShoppingCart, Zap, Star, Minus, Plus, MessageCircle, 
  Share2, Heart, Eye, ArrowRight, Sparkles, Award, MapPin
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';
import { supabase } from '../lib/supabase';

const ProductModal = ({ product, allProducts = [], isOpen, onClose, onProductClick }) => {
  const { settings, addToRecent, setSelectedCategory, showToast } = useStore();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { lang, t, t_smart } = useLanguage();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const scrollRef = React.useRef(null);
  const wrapperRef = React.useRef(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [swipeStartY, setSwipeStartY] = useState(null);
  const [activeTab, setActiveTab] = useState('specs');

  const handleTouchStart = (e) => {
    setSwipeStartY(e.touches[0].clientY);
  };
  
  const handleTouchMove = (e) => {
    if (swipeStartY === null) return;
    const currentY = e.touches[0].clientY;
    const diffY = currentY - swipeStartY;
    if (diffY > 80) { // Dismiss on swiping down 80px
      onClose();
      setSwipeStartY(null);
    }
  };

  const getImagesList = () => {
    if (!product) return ['/hero-banner.png'];
    const list = [];
    const mainImg = product.image_url || product.image;
    if (mainImg) list.push(mainImg);
    if (product.images) {
      try {
        const imgs = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(imgs)) {
          imgs.forEach(img => {
            if (img && !list.includes(img)) {
              list.push(img);
            }
          });
        }
      } catch (e) {}
    }
    if (list.length === 0) list.push('/hero-banner.png');
    return list;
  };
  const imagesList = getImagesList();

  const handleImageScroll = (e) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveImageIndex(index);
    }
  };

  const handleScroll = (e) => {
    if (e.currentTarget.scrollTop > 450) {
      setShowMobileStickyBar(true);
    } else {
      setShowMobileStickyBar(false);
    }
  };
  
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem('sweetohub_session');
    if (session) {
      try {
        setCurrentUser(JSON.parse(session));
      } catch (e) { console.error(e); }
    }
  }, [isOpen]);

  const isWishlisted = product ? isInWishlist(product.id) : false;

  // Load reviews on product change — only fetch APPROVED reviews for public display
  const fetchProductReviews = async () => {
    if (!product?.id) return;
    setIsReviewsLoading(true);
    try {
      // Fetch all reviews for this product then filter for approved ones
      // using both schema styles (status column OR is_approved column)
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter approved by either schema: status='approved' OR is_approved=1
      const approvedOnly = (data || []).filter(
        r => r.status === 'approved' || r.is_approved === 1
      );

      const formatted = approvedOnly.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleDateString(),
        user: r.customer_name || r.reviewer_name || "Guest User"
      }));

      setReviews(formatted);
    } catch (e) {
      console.error("Error fetching reviews:", e);
      // DO NOT fall back to localStorage — never show unmoderated reviews publicly
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (product?.id) {
      fetchProductReviews();
      
      if (isOpen) {
        addToRecent(product);
      }
    }
  }, [product?.id, isOpen]);

  const handleToggleWishlist = () => {
    toggleWishlist(product);
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this amazing ${product.name} on SWEETO-HUB!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      }
    } catch (err) {
      console.log("Error sharing:", err);
    }
  };

  const handleWhatsApp = () => {
    const phone = settings?.social_whatsapp ? settings.social_whatsapp.replace(/\D/g, '') : '2250500619923';
    const message = `Bonjour Sweeto-Hub, je m'intéresse à votre produit : "${product.name}" (${product.price?.toLocaleString()} ${settings?.currency || 'FCFA'}). Est-il disponible ?`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleReviewSubmit = async () => {
    if (userRating === 0) return showToast("Please select a rating", "error");
    if (!comment.trim()) return showToast("Please enter a comment", "error");

    const payload = {
      product_id: product.id,
      product_name: product.name,
      customer_name: currentUser?.name || "Guest User",
      reviewer_name: currentUser?.name || "Guest User",
      rating: userRating,
      comment: comment.trim(),
      status: 'pending',
      is_approved: 0,
      created_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('reviews').insert([payload]);
      if (error) throw error;
      
      showToast("Review submitted successfully!", "success");
      fetchProductReviews();
      setComment("");
      setUserRating(0);
    } catch (err) {
      console.error(err);
      showToast("Failed to submit review. Saving locally.", "warning");
      
      const newReview = {
        id: Date.now(),
        rating: userRating,
        comment: comment.trim(),
        date: new Date().toLocaleDateString(),
        user: currentUser?.name || "Guest User"
      };

      const updatedReviews = [newReview, ...reviews];
      setReviews(updatedReviews);
      localStorage.setItem(`reviews_${product.id}`, JSON.stringify(updatedReviews));
      setComment("");
      setUserRating(0);
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    setQuantity(1);
    setSelectedImage(product?.image_url || product?.image || '/hero-banner.png');
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (isOpen && product?.id) {
      // Logic for analytics can go here
    }
  }, [product, isOpen]);
  
  if (!product) return null;

  let relatedProductsList = [];
  try {
    if (product.related_products) {
      const parsedIds = typeof product.related_products === 'string' 
        ? JSON.parse(product.related_products) 
        : product.related_products;
      
      if (Array.isArray(parsedIds) && parsedIds.length > 0) {
        relatedProductsList = allProducts.filter(p => parsedIds.includes(String(p.id)) || parsedIds.includes(p.id));
      }
    }
    
    // Fallback to category if no manual related products found
    if (relatedProductsList.length === 0) {
      relatedProductsList = allProducts
        .filter(p => p.category === product.category && p.id !== product.id)
        .slice(0, 4);
    }
  } catch (e) {
    console.error("Error parsing related_products:", e);
    // Safe fallback on error
    relatedProductsList = allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }

  const handleAddToCart = () => {
    const productWithVariants = { ...product, quantity };
    for(let i = 0; i < quantity; i++) {
        addToCart(productWithVariants);
    }
  };



  const generateSKU = (prod) => {
    if (!prod) return '';
    const prefix = prod.brand ? prod.brand.substring(0, 3) : (prod.category ? prod.category.substring(0, 3) : 'PRD');
    return `SWT-${prefix.toUpperCase()}-${String(prod.id).padStart(4, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[500]"
          />
          
          <div 
            ref={wrapperRef}
            onScroll={handleScroll}
            onClick={onClose}
            className="fixed inset-0 z-[510] overflow-y-auto custom-scrollbar flex justify-center items-start py-8 px-4 sm:px-6 cursor-zoom-out"
          >
            <motion.div 
              ref={scrollRef}
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-950 border dark:border-white/5 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-full max-w-6xl relative overflow-hidden flex flex-col transition-colors duration-500 pb-28 md:pb-0"
            >
              {/* Drag Handle Pill for Mobile */}
              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                className="md:hidden w-16 h-1.5 bg-slate-200 dark:bg-slate-800/80 rounded-full mx-auto my-4 cursor-grab active:cursor-grabbing shrink-0 z-50 relative"
                title="Swipe down to close"
              />

              {/* Top Left Brand Accent */}
              <div className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 z-50 pointer-events-none select-none">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-eas-blue dark:text-cyan-400 italic drop-shadow-sm">
                  @sweeto
                </span>
              </div>
              {/* Dynamic Design Accents */}
              <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-eas-blue/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-eas-accent/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none"></div>

              {/* Header Actions */}
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-2 sm:gap-3 z-50">
                <motion.button 
                  onClick={handleToggleWishlist}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shadow-lg backdrop-blur-md border ${isWishlisted ? 'bg-red-500 border-red-500 text-white' : 'bg-white/80 border-slate-100 text-slate-400 hover:text-red-500'}`}
                >
                  <Heart className="w-[18px] h-[18px] sm:w-5 sm:h-5" fill={isWishlisted ? "currentColor" : "none"} />
                </motion.button>
                <motion.button 
                  onClick={handleShare}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 backdrop-blur-md border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-400 hover:text-eas-blue transition-colors shadow-lg"
                >
                  <Share2 className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </motion.button>
                <motion.button 
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl"
                >
                  <X className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                </motion.button>
              </div>

              {/* Main Container */}
              <div className="p-6 md:p-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
                                {/* Image Gallery Column */}
                  <div className="lg:col-span-7 flex flex-col md:flex-row gap-8">
                    {/* Vertical Thumbnails (hidden on mobile, visible on desktop) */}
                    <div className="hidden md:flex flex-col gap-3 sm:gap-4 overflow-y-auto py-1 max-w-full custom-scrollbar shrink-0">
                      {imagesList.map((img, idx) => (
                        <motion.div 
                          key={idx} 
                          whileHover={{ scale: 1.05 }}
                          onClick={() => setSelectedImage(img)}
                          className={`w-20 h-20 rounded-3xl p-3 cursor-pointer bg-slate-50 border-2 transition-all shrink-0 ${selectedImage === img ? 'border-eas-blue shadow-lg ring-4 ring-eas-blue/5' : 'border-transparent opacity-60'}`}
                        >
                          <img src={img} className="w-full h-full object-contain" />
                        </motion.div>
                      ))}
                    </div>

                    {/* Stage Image Container with Touch Snap Swiping */}
                    <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/35 rounded-3xl sm:rounded-[3rem] md:rounded-[4rem] border border-slate-100/50 dark:border-white/5 relative overflow-hidden flex items-center justify-center shadow-inner order-1 md:order-2">
                      
                      {/* Mobile Horizontal Snap Swiper */}
                      <div 
                        onScroll={handleImageScroll}
                        className="md:hidden absolute inset-0 overflow-x-auto flex snap-x snap-mandatory scroll-smooth no-scrollbar"
                      >
                        {imagesList.map((img, idx) => (
                          <div key={idx} className="w-full h-full shrink-0 snap-center modal-image-container bg-transparent dark:bg-transparent p-0 rounded-none">
                            <img src={img} className="mix-blend-multiply dark:mix-blend-normal" />
                          </div>
                        ))}
                      </div>

                      {/* Mobile Pagination Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden z-10">
                        {imagesList.map((_, idx) => (
                          <div 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                              activeImageIndex === idx ? 'bg-blue-600 w-3' : 'bg-slate-400/40'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Desktop Zoom Stage */}
                      <div 
                        onMouseMove={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = ((e.clientX - rect.left) / rect.width) * 100;
                          const y = ((e.clientY - rect.top) / rect.height) * 100;
                          setZoomPos({ x, y });
                        }}
                        onMouseEnter={() => setIsZooming(true)}
                        onMouseLeave={() => setIsZooming(false)}
                        className="hidden md:flex w-full h-full items-center justify-center cursor-zoom-in relative modal-image-container bg-transparent dark:bg-transparent p-0 rounded-none"
                      >
                        <AnimatePresence mode="wait">
                          <motion.img 
                            key={selectedImage}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ 
                              opacity: 1, 
                              scale: isZooming ? 2.5 : 1,
                              x: isZooming ? `${(50 - zoomPos.x) * 0.5}%` : 0,
                              y: isZooming ? `${(50 - zoomPos.y) * 0.5}%` : 0,
                            }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ type: 'spring', damping: 30 }}
                            src={selectedImage} 
                            className="w-full h-full object-contain p-8 md:p-12 mix-blend-multiply dark:mix-blend-normal"
                          />
                        </AnimatePresence>
                      </div>

                      {/* Brand Watermark */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl sm:text-[120px] font-black text-slate-900/[0.02] pointer-events-none select-none uppercase tracking-tighter">
                        {product.brand || 'SWEETO'}
                      </div>

                      {product.discount > 0 && (
                        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 bg-red-600 text-white text-[10px] sm:text-xs font-black px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl shadow-xl shadow-red-600/30 z-10">
                          -{product.discount}% EXCLUSIVE
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Column */}
                  <div className="lg:col-span-5 flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-4 py-1.5 bg-eas-blue/10 text-eas-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-eas-blue/20">
                          {product.category || 'Elite'}
                        </span>
                        <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-inner border border-slate-700 font-mono">
                          {generateSKU(product)}
                        </span>
                        <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs px-2.5 py-1 bg-amber-50 rounded-lg">
                          <Star size={12} fill="currentColor" />
                          <span>{averageRating}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        {t('in_stock')}
                      </div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-4 uppercase italic">
                      {product.name}
                    </h2>

                    <div className="flex flex-col gap-2 mb-6">
                      <div className="flex items-baseline gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-5 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                        <span className="text-4xl font-black text-eas-blue tracking-tighter italic">
                          {product.price?.toLocaleString()}
                          <span className="text-lg ml-2 not-italic opacity-40">{settings?.currency || 'FCFA'}</span>
                        </span>
                        {product.oldPrice && (
                          <span className="text-lg text-slate-300 dark:text-slate-500 line-through font-black">
                            {product.oldPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 ml-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {lang === 'fr' ? '« En stock à Adjamé Mirador »' : '« In Stock at Adjamé Mirador »'}
                      </span>
                    </div>

                    {/* Live Urgency Tickers */}
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20 rounded-2xl">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          {Math.floor(Math.random() * 4) + 2} {lang === 'fr' ? 'personnes regardent' : 'people viewing'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 rounded-2xl">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          {lang === 'fr' ? 'Demande Élevée' : 'High Demand'}
                        </span>
                      </div>
                    </div>

                    {/* Premium Condition & Quality Badge Row */}
                    {product.condition && (
                      <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/80">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          product.condition === 'used' 
                            ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                            : 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20 shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                        }`}>
                          {product.condition === 'used' ? (
                            <Sparkles size={18} />
                          ) : (
                            <Award size={18} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">Product Grade</span>
                          <span className={`text-xs font-black uppercase tracking-wider mt-1.5 ${
                            product.condition === 'used' ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'
                          }`}>
                            {product.condition === 'used' ? 'Pre-Owned • Excellent Condition' : 'Brand New • 100% Authentic'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Collapsible Accordions for Specs & Warranty */}
                    <div className="mb-8 border-y border-slate-100 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
                      {/* Specifications Accordion */}
                      <div className="py-4">
                        <button 
                          type="button"
                          onClick={() => setActiveTab(activeTab === 'specs' ? null : 'specs')}
                          className="w-full flex items-center justify-between font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200 text-left cursor-pointer outline-none"
                        >
                          <span>⚙️ {lang === 'fr' ? 'Spécifications / Caractéristiques' : 'Specifications / Features'}</span>
                          <span className="text-slate-400 text-lg font-bold">{activeTab === 'specs' ? '−' : '+'}</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {activeTab === 'specs' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-sm">
                                {t_smart(product.description) || t('premium_material_desc')}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Warranty & Support Accordion */}
                      <div className="py-4">
                        <button 
                          type="button"
                          onClick={() => setActiveTab(activeTab === 'warranty' ? null : 'warranty')}
                          className="w-full flex items-center justify-between font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200 text-left cursor-pointer outline-none"
                        >
                          <span>🛡️ {lang === 'fr' ? 'Garantie & Service Client' : 'Warranty & Customer Support'}</span>
                          <span className="text-slate-400 text-lg font-bold">{activeTab === 'warranty' ? '−' : '+'}</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {activeTab === 'warranty' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="text-slate-550 dark:text-slate-400 text-xs font-bold leading-relaxed space-y-2 uppercase tracking-wide pt-2">
                                <p>📍 {lang === 'fr' ? 'Boutique physique à Adjamé Mirador (Abidjan).' : 'Physical store located at Adjamé Mirador (Abidjan).'}</p>
                                <p>⚡ {lang === 'fr' ? 'Retrait sur place ou Livraison Express sous 24H.' : 'In-store pickup or 24H Express Delivery.'}</p>
                                <p>💳 {lang === 'fr' ? 'Paiement sécurisé en espèces, Orange Money ou Wave à la livraison.' : 'Pay on Delivery via Wave, Orange Money, or Cash.'}</p>
                                <p>🛡️ {lang === 'fr' ? 'Garantie de satisfaction de 7 jours (retour & échange).' : '7-day satisfaction warranty (return & exchange).'}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Local Logistics & Trust Banner */}
                    <div className="mb-8 p-5 bg-slate-50/50 dark:bg-slate-900/30 rounded-[1.8rem] border border-slate-100 dark:border-white/5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-7 bg-eas-blue rounded-full"></div>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest">
                          {lang === 'fr' ? 'LIVRAISON & SERVICE ABIDJAN' : 'SHIPPING & LOCAL SERVICE'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-eas-blue/10 text-eas-blue flex items-center justify-center shrink-0">
                            <MapPin size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              {lang === 'fr' ? 'Retrait & Livraison' : 'Pickup & Delivery'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                              {lang === 'fr' ? 'Retrait Adjamé Mirador ou Livraison Express 24H Abidjan.' : 'Pickup at Adjamé Mirador or 24H Express Delivery.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                            <Zap size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                              {lang === 'fr' ? 'Paiement Sécurisé' : 'Secure Payment'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                              {lang === 'fr' ? 'Paiement à la livraison, Wave, Orange Money ou Moov.' : 'Pay on Delivery, Wave, or Orange Money.'}
                            </p>
                          </div>
                        </div>
                      </div>
                                 {/* Desktop Purchase Actions (hidden on mobile, visible on desktop) */}
                    <div className="hidden md:block space-y-4 mt-auto">
                      <div className="flex gap-4">
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-white/5 rounded-2xl flex items-center p-1 px-2 gap-4 shadow-sm">
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Minus size={18} strokeWidth={3} />
                          </motion.button>
                          <span className="text-lg font-black text-slate-900 min-w-[2ch] text-center">{quantity}</span>
                          <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setQuantity(quantity + 1)}
                            className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </motion.button>
                        </div>
 
                        <motion.button 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleAddToCart}
                          className="flex-1 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-slate-900/40 flex items-center justify-center gap-4 group overflow-hidden relative h-[70px]"
                        >
                          <div className="absolute inset-0 bg-eas-blue translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                          <ShoppingCart size={20} className="relative z-10" />
                          <span className="relative z-10">{t('add_to_cart')}</span>
                        </motion.button>
                      </div>
 
                      <div className="grid grid-cols-2 gap-4">
                        <motion.button 
                          onClick={() => {
                            handleAddToCart();
                            onClose();
                            navigate('/checkout');
                          }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-eas-accent text-white font-black text-[10px] uppercase tracking-[0.3em] h-16 rounded-2xl shadow-xl shadow-eas-accent/30 flex items-center justify-center gap-3"
                        >
                          <Zap size={18} fill="currentColor" />
                          {t('buy_now')}
                        </motion.button>
                        
                        <motion.button 
                          onClick={handleWhatsApp}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-[#25D366] text-white font-black text-[10px] uppercase tracking-[0.2em] h-16 rounded-2xl shadow-xl shadow-green-500/30 flex items-center justify-center gap-3"
                        >
                          <MessageCircle size={18} fill="currentColor" />
                          WhatsApp
                        </motion.button>
                      </div>

                      {/* Continue Shopping secondary link for desktop */}
                      <button 
                        onClick={onClose}
                        className="w-full text-center py-3 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] transition-colors mt-4 cursor-pointer border border-dashed border-slate-100 dark:border-white/5 rounded-xl hover:border-slate-300 dark:hover:border-white/20"
                      >
                        {lang === 'fr' ? '← Continuer mes achats' : '← Continue Shopping'}
                      </button>
                    </div>           </div>
                  </div>
                </div>

                {/* Main Content Sections */}
                <div className="mt-16 space-y-20">
                  

                  {/* Reviews Section */}
                  <section className="border-t border-slate-100 pt-16">
                    <div className="text-center mb-12">
                      <h3 className="text-[10px] font-black text-eas-blue uppercase tracking-[0.5em] mb-6">{t('feedback')}</h3>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{t('global_intel')}</h2>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 px-4">
                      {/* Review Summary */}
                      <div className="lg:col-span-4">
                        <div className="sticky top-32 p-6 sm:p-10 bg-slate-50 rounded-[2.5rem] sm:rounded-[3.5rem] border border-slate-100 flex flex-col items-center">
                          <span className="text-8xl font-black text-slate-900 tracking-tighter mb-4 italic leading-none">{averageRating}</span>
                          <div className="flex text-amber-400 mb-6 gap-1">
                            {[...Array(5)].map((_, i) => <Star key={i} size={24} fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"} strokeWidth={3} />)}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">{t('community_rating')}</span>
                        </div>
                      </div>

                      {/* Review List & Form */}
                      <div className="lg:col-span-8 space-y-12">
                        {/* Write Review */}
                        <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-xl shadow-slate-100/50 relative overflow-hidden group">
                          {!currentUser && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                              <div className="w-20 h-20 bg-eas-blue/10 rounded-3xl flex items-center justify-center text-eas-blue mb-6">
                                <Zap size={32} />
                              </div>
                              <h4 className="text-xl font-black text-slate-900 uppercase italic mb-3 tracking-tighter">Authentication Required</h4>
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-8 max-w-[240px] leading-relaxed">
                                Join the SWEETO community to share your experience with this product.
                              </p>
                              <button 
                                onClick={() => navigate('/login')}
                                className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-eas-blue transition-all shadow-xl shadow-slate-900/20"
                              >
                                {t('login_now')}
                              </button>
                            </div>
                          )}

                          <h4 className="font-black text-slate-900 mb-6 uppercase text-xs tracking-[0.3em]">{t('leave_review')}</h4>
                          <div className="flex gap-2 sm:gap-3 mb-8 flex-wrap">
                            {[1, 2, 3, 4, 5].map(i => (
                              <button 
                                key={i}
                                type="button"
                                onMouseEnter={() => setHoverRating(i)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setUserRating(i)}
                                style={{ minWidth: '44px', minHeight: '44px' }}
                                className={`w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${ (hoverRating || userRating) >= i ? 'text-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-slate-200 dark:text-slate-800' }`}
                              >
                                <Star size={32} className="sm:w-[36px] sm:h-[36px]" fill={(hoverRating || userRating) >= i ? "currentColor" : "none"} strokeWidth={2} />
                              </button>
                            ))}
                          </div>
                          <textarea 
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            disabled={!currentUser}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] p-5 sm:p-8 text-sm font-medium focus:ring-4 focus:ring-eas-blue/5 focus:bg-white dark:focus:bg-slate-950 transition-all outline-none mb-8 min-h-[160px] resize-none dark:text-white"
                            placeholder={currentUser ? t('share_experience') : "Login to share your thoughts..."}
                          />
                          <motion.button 
                            whileHover={currentUser ? { scale: 1.02, y: -2 } : {}}
                            whileTap={currentUser ? { scale: 0.98 } : {}}
                            onClick={handleReviewSubmit}
                            disabled={!currentUser}
                            className={`bg-slate-900 text-white font-black text-xs uppercase tracking-[0.3em] px-8 py-4 sm:px-12 sm:py-6 rounded-2xl shadow-2xl shadow-slate-900/30 w-full md:w-auto ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {t('submit_experience')}
                          </motion.button>
                        </div>

                        {/* Feed */}
                        <div className="space-y-6">
                          {isReviewsLoading ? (
                            <div className="space-y-6">
                              {[...Array(2)].map((_, i) => (
                                <div key={i} className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-white/5 animate-pulse">
                                  <div className="flex justify-between items-start mb-8">
                                    <div className="flex items-center gap-5">
                                      <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
                                      <div className="space-y-2">
                                        <div className="h-4 bg-slate-200 dark:bg-slate-800 w-24 rounded-md"></div>
                                        <div className="h-3 bg-slate-200 dark:bg-slate-800 w-16 rounded-md"></div>
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      {[...Array(5)].map((_, j) => (
                                        <div key={j} className="w-4 h-4 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 w-3/4 rounded-md"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 w-1/2 rounded-md"></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : reviews.length === 0 ? (
                            <div className="py-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
                              {lang === 'fr' ? 'Aucun avis rédigé pour le moment.' : 'No reviews written yet.'}
                            </div>
                          ) : (
                            reviews.map(rev => (
                              <motion.div 
                                key={rev.id} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="p-6 sm:p-10 bg-slate-50 dark:bg-slate-900/40 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl transition-all duration-500"
                              >
                                <div className="flex justify-between items-start mb-8">
                                  <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center font-black text-eas-blue shadow-lg group-hover:scale-110 transition-transform">
                                      {rev.user.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white">{rev.user}</span>
                                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest">{rev.date}</span>
                                    </div>
                                  </div>
                                  <div className="flex text-amber-400 gap-1">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} strokeWidth={2.5} />)}
                                  </div>
                                </div>
                                <p className="text-slate-600 dark:text-slate-350 font-medium leading-relaxed italic text-lg pr-8">"{rev.comment}"</p>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Related Products Section */}
                  <section className="border-t border-slate-100 dark:border-slate-900 pt-24 pb-12">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 mb-16 px-4">
                      <div>
                        <h2 className="text-lg sm:text-xl md:text-2xl font-black text-eas-blue uppercase tracking-[0.4em] leading-none">
                          {t('related')}
                        </h2>
                      </div>


                      <button 
                        onClick={() => {
                          onClose();
                          if (product?.category) {
                            if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
                            setSelectedCategory(product.category);
                            navigate('/');
                          } else {
                            navigate('/');
                          }
                        }}
                        className="md:ml-auto px-8 py-4 rounded-[1.5rem] font-black text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-4 shadow-xl group/btn bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-eas-blue dark:hover:bg-eas-blue hover:text-white dark:hover:text-white shadow-slate-900/20 w-fit"
                      >
                        {t('view_all')}
                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8 md:gap-12 px-4 justify-items-center">
                      {relatedProductsList.map((prod, i) => (
                        <ProductCard 
                          key={prod.id || i} 
                          product={prod} 
                          onProductClick={onProductClick} 
                        />
                      ))}
                    </div>
                  </section>

                  {/* Continue Shopping link for mobile viewports */}
                  <div className="flex justify-center pt-4 pb-8 md:hidden">
                    <button 
                      onClick={onClose}
                      className="px-8 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl text-[10px] font-black text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                      <span>{lang === 'fr' ? '← Continuer mes achats' : '← Continue Shopping'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Indicator */}
              <div className="bg-slate-900 py-6 px-12 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-3 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  {t('verified_authentic')}
                </div>
                <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Secure local server connection • 192.168.1.100
                </div>
              </div>

              {/* Mobile Sticky bottom thumb-zone container (Always Docked on Mobile) */}
              <div className="fixed bottom-0 left-0 right-0 z-[600] md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-150 dark:border-white/5 p-4 pb-6 flex flex-col gap-3 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] rounded-t-3xl transition-colors duration-500">
                <div className="flex gap-3 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={selectedImage} className="w-10 h-10 object-contain rounded-lg bg-slate-50 dark:bg-slate-900 p-1 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-900 dark:text-white truncate max-w-[110px] uppercase tracking-tighter leading-none mb-1">{product.name}</span>
                      <span className="text-xs font-black text-eas-blue">{product.price?.toLocaleString()} {settings?.currency || 'FCFA'}</span>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-xl flex items-center p-0.5 px-2 gap-1.5 shadow-sm shrink-0">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                    >
                      <Minus size={12} strokeWidth={3} />
                    </button>
                    <span className="text-xs font-black text-slate-900 dark:text-white min-w-[1.5ch] text-center">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900"
                    >
                      <Plus size={12} strokeWidth={3} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-1.5 shadow-lg h-11"
                  >
                    <ShoppingCart size={14} />
                    <span>{t('add_to_cart')}</span>
                  </button>

                  <button 
                    onClick={() => {
                      handleAddToCart();
                      onClose();
                      navigate('/checkout');
                    }}
                    className="flex-1 bg-blue-600 text-white font-black text-[9px] uppercase tracking-[0.2em] h-11 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Zap size={14} fill="currentColor" />
                    <span>{t('buy_now')}</span>
                  </button>

                  <button 
                    onClick={handleWhatsApp}
                    className="flex-1 bg-[#25D366] text-white font-black text-[9px] uppercase tracking-[0.15em] h-11 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle size={14} fill="currentColor" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;

