import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Package, ShoppingCart, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';

const categoryBanners = {
  "smartphones": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1000",
  "laptops": "https://images.unsplash.com/photo-1504707748692-419802cf939d?auto=format&fit=crop&q=80&w=1000",
  "headphones": "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1000",
  "accessories": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000",
  "gaming": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1000",
  "audio": "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&q=80&w=1000",
  "wearables": "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=1000",
  "appliances": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1000",
  "desktops": "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=1000",
  "components": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&q=80&w=1000",
  "default": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000"
};

export default function CategoryLandingPage({ categoryName, products = [], categories = [], settings, onProductClick }) {
  const { lang, t, t_smart } = useLanguage();
  const navigate = useNavigate();
  const [activePill, setActivePill] = useState('All');

  // Find dynamic category info
  const categoryInfo = useMemo(() => {
    return categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
  }, [categories, categoryName]);

  // Filter products belonging to this category or its subcategories
  const categoryProducts = useMemo(() => {
    const parentCat = categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
    const subcatNames = parentCat 
      ? categories.filter(c => c.parent_id === parentCat.id).map(c => c.name?.toLowerCase())
      : [];
    
    return products.filter(p => {
      const pCat = p.category?.toLowerCase();
      const matchesMain = pCat === categoryName?.toLowerCase();
      const matchesSub = subcatNames.includes(pCat);
      return (matchesMain || matchesSub) && p.status === 'active';
    });
  }, [products, categoryName, categories]);

  // Find deals for this category (original_price > price or is_daily_deal)
  const categoryDeals = useMemo(() => {
    return categoryProducts.filter(p => p.is_daily_deal || (p.original_price && p.original_price > p.price)).slice(0, 6);
  }, [categoryProducts]);

  // Get filter pills: either child categories, or unique brands
  const filterPills = useMemo(() => {
    const parentCat = categories.find(c => c.name?.toLowerCase() === categoryName?.toLowerCase());
    const subcats = parentCat ? categories.filter(c => c.parent_id === parentCat.id) : [];
    
    if (subcats.length > 0) {
      return ['All', ...subcats.map(s => s.name)];
    }
    
    // Fallback to brands if no sub-categories
    const brands = [...new Set(categoryProducts.map(p => p.brand).filter(Boolean))];
    return ['All', ...brands];
  }, [categories, categoryName, categoryProducts]);

  // Filter products based on selected pill
  const filteredProducts = useMemo(() => {
    if (activePill === 'All') return categoryProducts;
    
    // Check if activePill matches a sub-category or a brand
    const isBrand = !categories.some(c => c.name?.toLowerCase() === activePill?.toLowerCase());
    if (isBrand) {
      return categoryProducts.filter(p => p.brand?.toLowerCase() === activePill?.toLowerCase());
    } else {
      return categoryProducts.filter(p => p.category?.toLowerCase() === activePill?.toLowerCase());
    }
  }, [categoryProducts, activePill, categories]);

  // Get banner image url (prioritize custom uploaded category image)
  const bannerImage = categoryInfo?.image_url || categoryInfo?.icon || categoryBanners[categoryName.toLowerCase()] || categoryBanners.default;

  return (
    <div className="w-full flex flex-col gap-5 px-3 md:px-12 py-3 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* Category Hero Banner (AliExpress Style) */}
      <div className="relative w-full h-40 md:h-56 rounded-2xl overflow-hidden shadow-md flex items-center bg-black">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={bannerImage} 
            alt={categoryName} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>

        {/* Banner Text Overlay */}
        <div className="relative z-10 pl-6 md:pl-12 flex flex-col items-start gap-1">
          {/* Angled "Viva" Badge */}
          <div className="bg-[#00f2fe] text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded uppercase tracking-wider transform -rotate-12 select-none shadow-sm mb-1">
            Viva
          </div>
          {/* Main Title */}
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-md leading-none">
            {t_smart(categoryName)} finds
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-widest mt-1">
            Discover {t_smart(categoryName)} collection today
          </p>
        </div>
      </div>

      {/* Daily Deals Section */}
      {categoryDeals.length > 0 && Number(categoryInfo?.show_daily_deals) !== 0 && (
        <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
          <div 
            onClick={() => navigate('/deals')}
            className="flex items-center gap-1 text-slate-900 dark:text-white font-extrabold text-sm sm:text-base uppercase tracking-tight mb-3 cursor-pointer group hover:text-[#ff3b30]"
          >
            <span>Daily deals</span>
            <ChevronRight size={16} className="text-slate-400 group-hover:text-[#ff3b30] group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Horizontally scrollable deals list */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory">
            {categoryDeals.map((prod) => (
              <div 
                key={`deal-${prod.id}`}
                className="w-32 min-w-32 sm:w-40 sm:min-w-40 snap-start"
              >
                <ProductCard 
                  product={prod}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory / Brand Pills Filter Row */}
      {filterPills.length > 1 && (
        <div className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-1 select-none">
          {filterPills.map((pill) => {
            const isSelected = activePill === pill;
            return (
              <button
                key={pill}
                type="button"
                onClick={() => setActivePill(pill)}
                className={`text-[12px] font-semibold px-4.5 py-1.5 rounded-full whitespace-nowrap transition-all shadow-sm cursor-pointer select-none flex items-center justify-center ${
                  isSelected 
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 font-bold scale-105' 
                    : 'bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 border border-slate-100 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {pill === 'All' && (
                  <Heart 
                    size={12} 
                    className={`mr-1 shrink-0 ${isSelected ? 'text-[#ff3b30] fill-[#ff3b30]' : 'text-slate-400'}`} 
                  />
                )}
                {t_smart(pill)}
              </button>
            );
          })}
        </div>
      )}

      {/* Filtered Products Grid */}
      <div className="w-full flex flex-col gap-3">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard 
                key={prod.id}
                product={prod}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-400">
            <Package size={36} className="mb-2 opacity-60 animate-bounce" />
            <p className="text-sm font-bold uppercase tracking-wider">No items found</p>
            <p className="text-xs text-slate-400 mt-1 font-medium">Try checking another sub-category or filter</p>
          </div>
        )}
      </div>

    </div>
  );
}
