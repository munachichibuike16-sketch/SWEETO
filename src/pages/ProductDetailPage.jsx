import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShoppingCart, Star, Minus, Plus, MessageCircle, 
  Share2, Heart, Shield, Award, MapPin, ChevronRight, Clock, Check, Search, ChevronLeft, X, Camera, Save
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
  const { 
    products: liveProducts, settings, showToast, addToRecent, 
    setSearchQuery, setSelectedCategory, setSelectedBrand, 
    openGlobalLightbox 
  } = useStore();
  const { addToCart, cartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { lang, t, t_smart } = useLanguage();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('specs');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [activeScrollSection, setActiveScrollSection] = useState('overview');
  const [scrollY, setScrollY] = useState(0);
  



  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [sheetAction, setSheetAction] = useState('both'); // 'both', 'cart', 'buy'
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [sheetScrollY, setSheetScrollY] = useState(0);



  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');

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
      setScrollY(currentScrollY);
      if (currentScrollY > 120) {
        setShowStickyHeader(true);
      } else {
        setShowStickyHeader(false);
      }

      const overviewEl = document.getElementById('product-overview');
      const reviewsEl = document.getElementById('product-reviews');
      const descEl = document.getElementById('product-description');
      const recomEl = document.getElementById('product-recommendations');

      const getAbsoluteTop = (el) => el ? el.getBoundingClientRect().top + currentScrollY : 0;

      if (recomEl && currentScrollY >= getAbsoluteTop(recomEl) - 150) {
        setActiveScrollSection('recommendations');
      } else if (descEl && currentScrollY >= getAbsoluteTop(descEl) - 150) {
        setActiveScrollSection('description');
      } else if (reviewsEl && currentScrollY >= getAbsoluteTop(reviewsEl) - 150) {
        setActiveScrollSection('reviews');
      } else {
        setActiveScrollSection('overview');
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  useEffect(() => {
    if (productId && liveProducts.length > 0) {
      const foundProduct = liveProducts.find(p => p.id.toString() === productId.toString());
      if (foundProduct) {
        setProduct(foundProduct);
        addToRecent(foundProduct);
        setScrollY(0); // Reset scroll state!
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
      
      // Parse colors from product.colors
      let parsedColors = [];
      if (Array.isArray(product.colors)) {
        parsedColors = product.colors;
      } else if (typeof product.colors === 'string' && product.colors.trim() !== '') {
        try {
          const parsed = JSON.parse(product.colors);
          if (Array.isArray(parsed)) parsedColors = parsed;
        } catch (e) {
          parsedColors = product.colors.split(',').map(c => c.trim()).filter(Boolean);
        }
      }

      const mapped = list.map((img, idx) => {
        let name = '';
        if (parsedColors[idx]) {
          if (typeof parsedColors[idx] === 'object' && parsedColors[idx] !== null) {
            name = parsedColors[idx].name || parsedColors[idx].code || `Option ${idx + 1}`;
          } else {
            name = parsedColors[idx];
          }
        } else {
          const category = (product.category || '').toLowerCase();
          const pName = (product.name || '').toLowerCase();
          
          if (category.includes('laptop') || category.includes('computer') || category.includes('ordinateur')) {
            let ram = '8GB';
            let ssd = '256GB';
            try {
              if (product.description && product.description.trim().startsWith('{')) {
                const parsed = JSON.parse(product.description);
                if (parsed.specs) {
                  if (parsed.specs.ramCapacity) ram = parsed.specs.ramCapacity.replace(/\s+/g, '');
                  if (parsed.specs.storageCapacity) ssd = parsed.specs.storageCapacity.replace(/\s+/g, '');
                }
              }
            } catch (e) {}
            
            if (idx === 0) name = `${ram} + ${ssd}`;
            else if (idx === 1) name = '16GB + 512GB';
            else if (idx === 2) name = '16GB + 1TB';
            else name = `Option ${idx + 1}`;
          } else if (category.includes('knife') || pName.includes('knife')) {
            if (idx === 0) name = 'EDC Knife';
            else if (idx === 1) name = 'Silver Metal';
            else if (idx === 2) name = 'Shadow Black';
            else if (idx === 3) name = 'Carbon Steel';
            else name = `Option ${idx + 1}`;
          } else {
            if (idx === 0) name = 'Default Option';
            else if (idx === 1) name = 'Classic Edition';
            else if (idx === 2) name = 'Premium Edition';
            else if (idx === 3) name = 'Special Edition';
            else name = `Option ${idx + 1}`;
          }
        }
        return { id: idx, name, image: img };
      });
      setVariants(mapped);
      setSelectedVariant(mapped[0] || null);
    }
  }, [product]);

  // Load session
  useEffect(() => {
    try {
      const session = localStorage.getItem('sweetohub_session');
      if (session) {
        setCurrentUser(JSON.parse(session));
      }
    } catch (e) {}
  }, []);

  // Fetch reviews when product changes
  const fetchProductReviews = async () => {
    if (!product?.id) return;
    setIsReviewsLoading(true);
    try {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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
      try {
        const local = localStorage.getItem(`reviews_${product.id}`);
        if (local) {
          setReviews(JSON.parse(local));
          setIsReviewsLoading(false);
          return;
        }
      } catch (err) {}
      setReviews([]);
    }
    setIsReviewsLoading(false);
  };

  useEffect(() => {
    if (product) {
      fetchProductReviews();
    }
  }, [product]);

  const handleReviewSubmit = async () => {
    if (userRating === 0) return showToast("Please select a rating", "error");
    if (!comment.trim()) return showToast("Please enter a comment", "error");

    const payload = {
      product_id: product.id,
      reviewer_name: currentUser?.name || "Guest User",
      rating: userRating,
      comment: comment.trim(),
      is_approved: 1,
      created_at: new Date().toISOString()
    };

    try {
      if (!supabase) throw new Error("Supabase client not initialized");
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

  const mobileCarouselRef = useRef(null);

  const variantLabel = React.useMemo(() => {
    const category = (product?.category || '').toLowerCase();
    if (category.includes('laptop') || category.includes('ordinateur') || category.includes('computer')) {
      return 'Capacity';
    }
    if (category.includes('storage') || category.includes('drive') || category.includes('ssd') || category.includes('hdd') || category.includes('usb') || category.includes('ram') || category.includes('mémoire') || category.includes('card')) {
      return 'Capacity';
    }
    if (category.includes('cable') || category.includes('câble')) {
      return 'Length';
    }
    return 'Color';
  }, [product]);

  useEffect(() => {
    if (mobileCarouselRef.current) {
      const container = mobileCarouselRef.current;
      const width = container.offsetWidth;
      if (width === 0) return;
      const currentIdx = Math.round(container.scrollLeft / width);
      if (currentIdx !== activeImageIndex) {
        container.scrollTo({
          left: activeImageIndex * width,
          behavior: 'smooth'
        });
      }
    }
  }, [activeImageIndex]);

  const handleCarouselScroll = () => {
    if (!mobileCarouselRef.current) return;
    const container = mobileCarouselRef.current;
    const width = container.offsetWidth;
    if (width === 0) return;
    const scrollLeft = container.scrollLeft;
    const newIdx = Math.round(scrollLeft / width);
    if (newIdx !== activeImageIndex && newIdx < imagesList.length) {
      setActiveImageIndex(newIdx);
    }
  };

  const imagesList = getImagesList(product);

  const handleSheetScroll = (e) => {
    setSheetScrollY(e.currentTarget.scrollTop);
  };

  // Related Products (same category)
  const relatedProducts = React.useMemo(() => {
    if (!product || !Array.isArray(liveProducts)) return [];
    const currentCat = (product.category || '').toLowerCase();
    return liveProducts
      .filter(p => p.id.toString() !== product.id.toString() && p.status === 'active' && (p.category || '').toLowerCase() === currentCat)
      .slice(0, 6);
  }, [product, liveProducts]);

  // More to Love (shuffled other products)
  const moreToLoveProducts = React.useMemo(() => {
    if (!product || !Array.isArray(liveProducts)) return [];
    const relatedIds = new Set(relatedProducts.map(r => r.id.toString()));
    const list = liveProducts.filter(p => 
      p.id.toString() !== product.id.toString() && 
      p.status === 'active' && 
      !relatedIds.has(p.id.toString())
    );
    
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, 12);
  }, [product, liveProducts, relatedProducts]);

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

  // Early return if product is not loaded yet (all hooks must be declared above this point!)
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="w-10 h-10 border-4 border-eas-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getUnifiedReviews = () => {
    const localAndDb = reviews || [];
    const prodReviews = typeof product.reviews === 'string'
      ? JSON.parse(product.reviews || '[]')
      : (product.reviews || []);
    
    const uniqueReviews = new Map();
    prodReviews.forEach(r => {
      const id = r.id || `${r.user}-${r.rating}-${r.comment}`;
      uniqueReviews.set(id, {
        id: id,
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        date: r.date || r.created_at || new Date().toLocaleDateString(),
        user: r.user || r.customer_name || r.reviewer_name || "Guest User"
      });
    });
    localAndDb.forEach(r => {
      const id = r.id || `${r.user}-${r.rating}-${r.comment}`;
      uniqueReviews.set(id, {
        id: id,
        rating: Number(r.rating) || 5,
        comment: r.comment || '',
        date: r.date || r.created_at || new Date().toLocaleDateString(),
        user: r.user || r.customer_name || r.reviewer_name || "Guest User"
      });
    });

    return Array.from(uniqueReviews.values());
  };

  const activeReviews = getUnifiedReviews();
  const reviewCount = activeReviews.length;
  const averageRating = reviewCount > 0
    ? (activeReviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : "0.0";

  const starsBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  activeReviews.forEach(r => {
    const rating = Math.round(r.rating);
    if (starsBreakdown[rating] !== undefined) {
      starsBreakdown[rating] += 1;
    }
  });

  const getPercentage = (star) => {
    if (reviewCount === 0) {
      return 0;
    }
    return Math.round((starsBreakdown[star] / reviewCount) * 105) % 100 || Math.round((starsBreakdown[star] / reviewCount) * 100);
  };

  const getPercentageFixed = (star) => {
    if (reviewCount === 0) {
      return 0;
    }
    return Math.round((starsBreakdown[star] / reviewCount) * 100);
  };

  const getPositiveFeedbackPercentage = () => {
    if (reviewCount === 0) return 0;
    const positiveReviews = activeReviews.filter(r => r.rating >= 4).length;
    return Math.round((positiveReviews / reviewCount) * 100);
  };

  const filteredReviews = ratingFilter === 'all'
    ? activeReviews
    : activeReviews.filter(r => Math.round(r.rating) === Number(ratingFilter));

  const discountPercentage = product.old_price && product.old_price > product.price 
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : 0;

  const savingsAmount = product.old_price && product.old_price > product.price 
    ? product.old_price - product.price
    : 0;

  const getSoldCount = (prod) => {
    if (!prod) return 0;
    return prod.sold_count || 0;
  };

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
    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: lang === 'fr' 
          ? `Découvrez ${product.name} sur SWEETO ! ⚡` 
          : `Check out ${product.name} on SWEETO! ⚡`,
        url: shareUrl,
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn("Native share failed, showing custom share modal:", err);
          setIsShareModalOpen(true);
        }
      });
    } else {
      setIsShareModalOpen(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-white pb-24 transition-colors duration-300">
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
                  const event = new CustomEvent('open-search-modal', {
                    detail: { defaultValue: product.category || '' }
                  });
                  window.dispatchEvent(event);
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
      
      {/* Mobile Visual Gallery (Full-bleed AliExpress Style with Native Snapping) */}
      <div 
        id="product-overview"
        className="relative lg:hidden w-full h-[100vw] bg-white dark:bg-slate-950 overflow-hidden select-none z-10"
      >
        <div
          ref={mobileCarouselRef}
          onScroll={handleCarouselScroll}
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {imagesList.map((img, idx) => (
            <div 
              key={idx} 
              className="w-full h-full shrink-0 snap-center snap-always flex items-center justify-center p-3"
            >
              <img 
                src={img} 
                alt="" 
                onClick={() => openGlobalLightbox(imagesList, idx, product.category, product.id)}
                className="w-full h-full object-contain dark:mix-blend-normal cursor-zoom-in"
              />
            </div>
          ))}
        </div>

        {/* Top-left: Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors z-20"
        >
          <ChevronLeft size={20} strokeWidth={3} className="pointer-events-none" />
        </button>

        {/* Top-right: Zoom & Share Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
          <button 
            onClick={() => openGlobalLightbox(imagesList, activeImageIndex, product.category, product.id)} 
            className="w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors"
          >
            <Search size={18} className="pointer-events-none" />
          </button>
          <button 
            onClick={shareProduct} 
            className="w-9 h-9 rounded-full bg-slate-950/40 backdrop-blur-sm text-white flex items-center justify-center cursor-pointer hover:bg-slate-950/60 transition-colors"
          >
            <Share2 size={18} className="pointer-events-none" />
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

      <div className="relative z-20 max-w-6xl mx-auto px-4 lg:py-6 -mt-10 lg:mt-0 bg-slate-50 dark:bg-[#090d16] rounded-t-[2.5rem] lg:rounded-none pt-8 lg:pt-0 shadow-[0_-15px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_-15px_30px_rgba(0,0,0,0.35)] lg:shadow-none transition-colors duration-300">
        {/* Main Columns wrapper */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Column: Visual Gallery Carousel (Desktop only) */}
          <div className="hidden lg:block w-full lg:w-[45%] bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm space-y-4">
            
            {/* Main Image View */}
            <div 
              onClick={() => openGlobalLightbox(imagesList, activeImageIndex, product.category, product.id)}
              className="w-full aspect-square bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center p-6 relative overflow-hidden group cursor-zoom-in"
            >
              <img 
                src={imagesList[activeImageIndex]} 
                alt={product.name} 
                className="w-full h-full object-contain dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105"
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
                    onClick={() => {
                      setActiveImageIndex(idx);
                      openGlobalLightbox(imagesList, idx, product.category, product.id);
                    }}
                    className={`w-14 h-14 rounded-lg bg-slate-50 dark:bg-slate-950 p-1 border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-eas-blue ring-2 ring-eas-blue/15' 
                        : 'border-slate-100 dark:border-slate-800/60 hover:border-slate-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain dark:mix-blend-normal" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Key details */}
          <div className="w-full lg:w-[55%] space-y-6">
            


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
                {product.old_price && product.old_price > product.price && (
                  <span className="bg-[#e61e25]/10 text-[#e61e25] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                    {Math.round(((product.old_price - product.price) / product.old_price) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* Rating + Sold proof */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="font-extrabold text-slate-700 dark:text-slate-200">{averageRating}</span>
                </div>
                <span>•</span>
                <span>{reviewCount} {lang === 'fr' ? 'Avis' : 'Reviews'}</span>
                <span>•</span>
                <span className="text-[#e61e25] uppercase tracking-wide italic">
                  {getSoldCount(product) > 0 ? `+${getSoldCount(product)}` : `0`} {lang === 'fr' ? 'Vendus' : 'Sold'}
                </span>
              </div>
            </div>

            {/* Variant Selector (Mobile only) - AliExpress Style Row */}
            {variants.length > 0 && (
              <button 
                onClick={() => {
                  setSheetAction('both');
                  setIsVariantSheetOpen(true);
                }}
                className="w-full bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 px-5 py-4 flex justify-between items-center cursor-pointer shadow-sm active:scale-[0.99] transition-all text-left lg:hidden"
              >
                <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <span className="text-slate-400 dark:text-slate-500 font-bold capitalize">{variantLabel}:</span>
                  <span className="text-slate-800 dark:text-white font-black">{selectedVariant ? selectedVariant.name : 'Default'}</span>
                </div>
                <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />
              </button>
            )}

            {/* Variant tag / Specification Details */}
            <div id="product-details" className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-5 text-left space-y-4 shadow-sm">
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
                {(() => {
                  const parsedDesc = (() => {
                    const desc = product?.description ?? '';
                    try {
                      if (desc && desc.trim().startsWith('{')) {
                        const parsed = JSON.parse(desc);
                        return {
                          text: parsed.text || '',
                          specs: parsed.specs || null
                        };
                      }
                    } catch(e) {}
                    return {
                      text: desc,
                      specs: null
                    };
                  })();

                  if (activeTab === 'specs') {
                    if (parsedDesc.specs) {
                      const specLabels = {
                        productLine: 'Product Line',
                        laptopType: 'Laptop Type',
                        os: 'Operating System',
                        ramCapacity: 'RAM Capacity',
                        ramType: 'RAM Type',
                        storageCapacity: 'Storage Capacity',
                        storageType: 'Storage Type',
                        processorTier: 'Processor',
                        processorGeneration: 'Generation',
                        processorModel: 'Processor Model',
                        phoneRam: 'RAM Memory',
                        phoneStorage: 'Internal Storage',
                        screenSize: 'Screen Size',
                        battery: 'Battery Capacity',
                        camera: 'Camera Resolution',
                        chargerPort: 'Charger Port',
                        chargerPower: 'Power (Wattage)',
                        fastCharging: 'Fast Charging',
                        compatBrand: 'Compatible Brand',
                        connectorTip: 'Connector Tip',
                        wattage: 'Wattage Output',
                        voltage: 'Input Voltage',
                        cableType: 'Cable Type',
                        length: 'Cable Length',
                        cableVersion: 'Version / Speed',
                        usbCapacity: 'Storage Capacity',
                        usbVersion: 'USB Standard',
                        usbConnector: 'Connector Type',
                        ramSpeed: 'Memory Frequency',
                        ramFormFactor: 'Memory Form Factor',
                        driveType: 'Drive Type',
                        driveFormFactor: 'Drive Form Factor',
                        driveSpeed: 'Read/Write Speed',
                        runTime: 'Cordless Runtime',
                        chargeTime: 'Charging Time',
                        bladeMaterial: 'Blade Material',
                        cordless: 'Cordless Operation'
                      };

                      const specList = Object.entries(parsedDesc.specs)
                        .filter(([k, v]) => k !== 'customSpecs' && !!v)
                        .map(([k, v]) => {
                          const label = specLabels[k] || k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return <p key={k}>• {label}: {v}</p>;
                        });
                      
                      const customSpecList = (parsedDesc.specs.customSpecs || [])
                        .filter(s => s.key && s.value)
                        .map((s, idx) => (
                          <p key={`custom-${idx}`}>• {s.key}: {s.value}</p>
                        ));

                      return (
                        <>
                          {specList}
                          {customSpecList}
                          {parsedDesc.text && <p>• Description: {parsedDesc.text}</p>}
                          <p>• Warranty: Full replacement coverage active</p>
                        </>
                      );
                    }
                    return (
                      <>
                        <p>• Model: {product.brand || 'Sweeto'} {product.id}</p>
                        <p>• Description: {parsedDesc.text || 'Premium high-performance electronics gear engineered for ultimate diagnostics.'}</p>
                        <p>• Warranty: Full replacement coverage active</p>
                      </>
                    );
                  }
                  return (
                    <>
                      <p><strong>Q: How long does delivery take?</strong></p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2">A: Generally 24-48 hours depending on your city zone.</p>
                      <p><strong>Q: Is cash on delivery supported?</strong></p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500">A: Yes, Abidjan and major zones support cash on delivery.</p>
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* AliExpress Customer Reviews Section */}
        <div id="product-reviews" className="mt-8 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800/80 p-6 sm:p-8 text-left space-y-8 shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/40">
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white italic">
                {lang === 'fr' ? `Avis clients (${reviewCount})` : `Customer Reviews (${reviewCount})`}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                {lang === 'fr' ? 'Évaluations honnêtes de vrais acheteurs' : 'Honest feedback from verified buyers'}
              </p>
            </div>
            {reviewCount > 0 && (
              <span className="text-xs font-black text-[#e61e25] bg-[#e61e25]/10 px-3 py-1 rounded-full uppercase tracking-wider">
                {getPositiveFeedbackPercentage()}% Positive
              </span>
            )}
          </div>

          {/* AliExpress Rating breakdown & Submission grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Statistics column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50/50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100/80 dark:border-slate-800/60 flex items-center justify-between gap-6">
                <div className="text-center space-y-1">
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                    {averageRating}
                  </span>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    out of 5
                  </p>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex text-amber-500 gap-0.5 justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill={i < Math.round(Number(averageRating)) ? "currentColor" : "none"} strokeWidth={2.5} />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {lang === 'fr' ? `${reviewCount} avis au total` : `${reviewCount} global ratings`}
                  </p>
                  {reviewCount > 0 ? (
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-wider">
                      {getPositiveFeedbackPercentage()}% {lang === 'fr' ? 'recommandent ce produit' : 'recommend this product'}
                    </p>
                  ) : (
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      {lang === 'fr' ? 'Aucune évaluation pour le moment' : 'No ratings yet'}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress bars list */}
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const percent = getPercentage(star);
                  return (
                    <div key={star} className="flex items-center gap-3 text-xs font-bold">
                      <button 
                        onClick={() => setRatingFilter(ratingFilter === String(star) ? 'all' : String(star))}
                        className={`flex items-center gap-1 w-12 hover:text-[#e61e25] transition-colors text-left ${ratingFilter === String(star) ? 'text-[#e61e25] font-black' : 'text-slate-650 dark:text-slate-400'}`}
                      >
                        <span>{star}</span>
                        <Star size={10} fill="currentColor" className="text-amber-500 shrink-0" />
                      </button>
                      
                      {/* Bar container */}
                      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percent}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="absolute top-0 bottom-0 left-0 bg-amber-500 rounded-full"
                        />
                      </div>

                      {/* Percentage label */}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 w-8 text-right font-black">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submission form with guest auth overlay - 7 cols */}
            <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-950/20 p-6 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 relative overflow-hidden min-h-[200px]">
              {/* Guest Shield Overlay */}
              {!currentUser && (
                <div className="absolute inset-0 bg-white/70 dark:bg-[#0b1324]/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 select-none">
                  <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-[#e61e25] mb-3 shadow-sm border border-red-500/5">
                    <Shield size={20} />
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase italic mb-1 tracking-tighter">
                    {lang === 'fr' ? 'Authentification Requise' : 'Authentication Required'}
                  </h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-4 max-w-[280px] leading-relaxed">
                    {lang === 'fr' ? 'Connectez-vous pour laisser une note et un commentaire.' : 'Join the Sweeto community to share your feedback.'}
                  </p>
                  <button 
                    onClick={() => navigate('/login')}
                    className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {lang === 'fr' ? 'Se Connecter' : 'Login / Register'}
                  </button>
                </div>
              )}

              {/* Real form */}
              <h4 className="font-black text-slate-800 dark:text-slate-100 mb-3 uppercase text-[10px] tracking-wider">
                {lang === 'fr' ? 'Rédiger un avis' : 'Leave a comment'}
              </h4>

              {/* Stars rating selection */}
              <div className="flex gap-1.5 mb-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <button 
                    key={i}
                    type="button"
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(i)}
                    className="p-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <Star 
                      size={20} 
                      className={`transition-colors ${(hoverRating || userRating) >= i ? 'text-amber-500 fill-amber-500 scale-110' : 'text-slate-200 dark:text-slate-700'}`}
                      strokeWidth={2.5}
                    />
                  </button>
                ))}
              </div>

              {/* Comment text area */}
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!currentUser}
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-[#e61e25]/20 focus:border-[#e61e25] focus:bg-white dark:focus:bg-slate-950 transition-all outline-none mb-3 resize-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                placeholder={lang === 'fr' ? "Partagez votre expérience sur la qualité, la livraison..." : "Share your feedback about quality, logistics, packaging..."}
              />

              {/* Submit Button */}
              <button 
                onClick={handleReviewSubmit}
                disabled={!currentUser}
                className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-[#e61e25] dark:hover:bg-[#e61e25] hover:text-white transition-all shadow-md cursor-pointer"
              >
                {lang === 'fr' ? 'Soumettre l\'avis' : 'Submit Review'}
              </button>
            </div>
          </div>

          {/* Interactive filter tabs row */}
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/40 select-none">
            {[
              { id: 'all', label: lang === 'fr' ? 'Tous' : 'All' },
              { id: '5', label: '5 ★' },
              { id: '4', label: '4 ★' },
              { id: '3', label: '3 ★' },
              { id: '2', label: '2 ★' },
              { id: '1', label: '1 ★' }
            ].map(tab => {
              const count = tab.id === 'all' 
                ? reviewCount 
                : (starsBreakdown[tab.id] || 0);
              const isActive = ratingFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setRatingFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-[#e61e25] border-[#e61e25] text-white'
                      : 'bg-slate-50 dark:bg-slate-950/40 border-slate-205 dark:border-slate-800/60 text-slate-650 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>

          {/* Reviews list feed */}
          <div className="space-y-4 pt-2">
            {isReviewsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl border border-slate-100 dark:border-slate-800/40 animate-pulse space-y-3">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="py-8 text-center text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {lang === 'fr' ? 'Aucun avis ne correspond à ce filtre.' : 'No reviews match this filter.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReviews.map(rev => (
                  <div 
                    key={rev.id} 
                    className="p-4 bg-slate-50/30 dark:bg-slate-950/10 hover:bg-white dark:hover:bg-slate-950/30 rounded-2xl border border-slate-100/60 dark:border-slate-800/40 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start mb-2.5 gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#e61e25]/10 text-[#e61e25] rounded-full flex items-center justify-center font-black text-[11px] uppercase tracking-wider">
                          {rev.user ? String(rev.user).charAt(0).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <span className="block text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                            {rev.user}
                          </span>
                          <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                            {rev.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex text-amber-500 gap-0.5 shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "none"} strokeWidth={2.5} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-350 font-bold leading-relaxed italic pl-11">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div id="product-recommendations" className="mt-12 space-y-6 text-left border-t border-slate-100 dark:border-white/5 pt-12">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                {lang === 'fr' ? 'Produits Associés' : 'Related Products'}
              </h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                {lang === 'fr' ? 'Dans la même catégorie' : 'In the same category'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedProducts.map((p, idx) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  index={idx} 
                  onProductClick={(prod) => {
                    navigate(`/product/${prod.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* More to Love Grid */}
        {moreToLoveProducts.length > 0 && (
          <div className="mt-12 space-y-6 text-left border-t border-slate-100 dark:border-white/5 pt-12">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                {lang === 'fr' ? 'Plus à aimer' : 'More to love'}
              </h3>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                {lang === 'fr' ? 'Produits recommandés' : 'Recommended products'}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {moreToLoveProducts.map((p, idx) => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  index={idx} 
                  onProductClick={(prod) => {
                    navigate(`/product/${prod.id}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        )}
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

        {/* Add to Cart Outline Pill & Buy Now Red Pill (Opens bottom sheet if variants exist) */}
        <div className="flex-1 flex gap-2.5">
          <button 
            onClick={() => {
              if (variants.length > 0) {
                setSheetAction('cart');
                setIsVariantSheetOpen(true);
              } else {
                addToCart(product);
                showToast("Added to shopping cart! 🛒", "success");
              }
            }}
            className="flex-1 py-3 px-3 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-97 cursor-pointer text-center whitespace-nowrap bg-transparent"
          >
            Add to Cart
          </button>
          <button 
            onClick={() => {
              if (variants.length > 0) {
                setSheetAction('buy');
                setIsVariantSheetOpen(true);
              } else {
                addToCart(product);
                navigate('/checkout');
              }
            }}
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
              {/* AliExpress Style Fixed Header (Height: ~120px) */}
              <div className="relative p-4 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0b1324] flex items-end gap-4 shrink-0 pt-8">
                {/* Overlapping Product Image */}
                <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-1.5 shadow-md -mt-10 z-10 shrink-0 flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedVariant ? selectedVariant.image : product.image_url} 
                    alt="" 
                    className="w-full h-full object-contain" 
                  />
                </div>
                
                {/* Price and Specifications details */}
                <div className="flex-1 text-left space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#e61e25] italic tracking-tighter">
                      {settings?.currency || 'XOF'} {product.price?.toLocaleString()}
                    </span>
                    {discountPercentage > 0 && (
                      <span className="bg-[#e61e25]/10 text-[#e61e25] text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>
                  {product.old_price && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 line-through font-bold">
                      {settings?.currency || 'XOF'} {product.old_price.toLocaleString()}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    Stock: {product.stock_quantity || 10} available
                  </p>
                  <p className="text-[11px] font-black text-slate-850 dark:text-white uppercase tracking-tight truncate max-w-[180px]">
                    Selected: <span className="text-[#e61e25]">{selectedVariant ? selectedVariant.name : 'Default'}</span>
                  </p>
                </div>

                {/* Close button X */}
                <button 
                  onClick={() => setIsVariantSheetOpen(false)}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Scrollable Sheet Content */}
              <div 
                className="overflow-y-auto flex-1 pb-6 px-4 text-left no-scrollbar"
              >
                {/* Promo/Coins Banner */}
                <div className="mt-3.5 p-3 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100/60 dark:border-slate-800/40">
                  <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wide">
                    Tax excluded, add at checkout if applicable; Extra 1% off with coins
                  </p>
                </div>

                {/* Variant Color Section */}
                {variants.length > 0 && (
                  <div className="mt-5 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      {variantLabel}
                    </h4>
                    <div className="flex flex-wrap gap-2.5 pt-1">
                      {variants.map((v, idx) => {
                        const isSelected = selectedVariant && selectedVariant.id === v.id;
                        return (
                          <button
                            key={v.id}
                            onClick={() => {
                              setSelectedVariant(v);
                              setActiveImageIndex(v.id);
                            }}
                            className={`relative flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border transition-all duration-300 cursor-pointer ${
                              isSelected 
                                ? 'border-[#e61e25] bg-[#e61e25]/5 text-[#e61e25] font-black' 
                                : 'border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-slate-700 dark:text-slate-350 hover:border-slate-300'
                            }`}
                          >
                            <img 
                              src={v.image} 
                              alt="" 
                              className="w-7 h-7 object-contain rounded-lg shrink-0" 
                            />
                            <span className="text-[11px] font-black tracking-tight whitespace-nowrap uppercase leading-none">
                              {v.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                {sheetAction === 'cart' && (
                  <button 
                    onClick={() => {
                      addToCart(product);
                      showToast("Added to shopping cart! 🛒", "success");
                      setIsVariantSheetOpen(false);
                    }}
                    className="w-full py-3.5 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md active:scale-97 cursor-pointer text-center"
                  >
                    Confirm
                  </button>
                )}
                {sheetAction === 'buy' && (
                  <button 
                    onClick={() => {
                      addToCart(product);
                      setIsVariantSheetOpen(false);
                      navigate('/checkout');
                    }}
                    className="w-full py-3.5 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md active:scale-97 cursor-pointer text-center"
                  >
                    Confirm
                  </button>
                )}
                {sheetAction === 'both' && (
                  <>
                    <button 
                      onClick={() => {
                        addToCart(product);
                        showToast("Added to shopping cart! 🛒", "success");
                        setIsVariantSheetOpen(false);
                      }}
                      className="flex-1 py-3.5 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-black text-xs uppercase tracking-widest rounded-full transition-all active:scale-97 cursor-pointer text-center bg-transparent"
                    >
                      Add to Cart
                    </button>
                    <button 
                      onClick={() => {
                        addToCart(product);
                        setIsVariantSheetOpen(false);
                        navigate('/checkout');
                      }}
                      className="flex-1 py-3.5 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-xs uppercase tracking-widest rounded-full transition-all shadow-md active:scale-97 cursor-pointer text-center"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Global Sidebar & Cart overlay drawers */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Dynamic Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[999] cursor-pointer"
            />
            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 bottom-8 md:bottom-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md bg-white dark:bg-[#0b1324] border border-slate-100 dark:border-slate-800/80 rounded-3xl shadow-2xl p-6 z-[1000] overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                  {lang === 'fr' ? 'Partager le produit' : 'Share Product'}
                </h3>
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Product Info Preview */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 mb-6">
                <img
                  src={selectedVariant ? selectedVariant.image : (product.image_url || product.image || '/hero-banner.png')}
                  alt={product.name}
                  className="w-14 h-14 rounded-xl object-cover bg-white dark:bg-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">{product.name}</h4>
                  <p className="text-xs text-red-500 font-extrabold mt-0.5">
                    {settings?.currency || 'XOF'} {product.price?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Share Options Grid */}
              <div className={`grid gap-3 mb-6 ${navigator.share ? 'grid-cols-4' : 'grid-cols-3'}`}>
                {/* WhatsApp */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
                    const text = lang === 'fr'
                      ? `Découvrez ${product.name} sur SWEETO ! ⚡ ${shareUrl}`
                      : `Check out ${product.name} on SWEETO! ⚡ ${shareUrl}`;
                    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 transition-all cursor-pointer group"
                >
                  <i className="fa-brands fa-whatsapp text-xl mb-1.5 transition-transform group-hover:scale-110"></i>
                  <span className="text-[9px] font-black uppercase tracking-wider">WhatsApp</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30 transition-all cursor-pointer group"
                >
                  <i className="fa-brands fa-facebook text-xl mb-1.5 transition-transform group-hover:scale-110"></i>
                  <span className="text-[9px] font-black uppercase tracking-wider">Facebook</span>
                </button>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    showToast(lang === 'fr' ? "Lien copié ! 🔗" : "Link copied! 🔗", "success");
                    setIsShareModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800/30 transition-all cursor-pointer group"
                >
                  <i className="fa-solid fa-link text-xl mb-1.5 transition-transform group-hover:scale-110"></i>
                  <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'fr' ? 'Copier' : 'Copy'}</span>
                </button>

                {/* More / Device Share */}
                {navigator.share && (
                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/share/product/${product.id}`;
                      navigator.share({
                        title: product.name,
                        text: lang === 'fr' 
                          ? `Découvrez ${product.name} sur SWEETO ! ⚡` 
                          : `Check out ${product.name} on SWEETO! ⚡`,
                        url: shareUrl,
                      }).catch((err) => console.log("Native share failed in modal:", err));
                      setIsShareModalOpen(false);
                    }}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 transition-all cursor-pointer group"
                  >
                    <i className="fa-solid fa-share-nodes text-xl mb-1.5 transition-transform group-hover:scale-110"></i>
                    <span className="text-[9px] font-black uppercase tracking-wider">{lang === 'fr' ? 'Plus' : 'More'}</span>
                  </button>
                )}
              </div>

              {/* Direct Link Input Box */}
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/share/product/${product.id}`}
                  className="flex-1 bg-transparent border-none text-[11px] font-medium text-slate-500 dark:text-slate-400 px-2 outline-none select-all"
                />
                <button
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
                    navigator.clipboard.writeText(shareUrl);
                    showToast(lang === 'fr' ? "Lien copié ! 🔗" : "Link copied! 🔗", "success");
                  }}
                  className="px-3.5 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  {lang === 'fr' ? 'Copier' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global Sidebar & Cart overlay drawers */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />


    </div>
  );
};

export default ProductDetailPage;
