import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';

export default function MobileBottomFeed({ settings, products = [], categories = [], lang, t_smart, onProductClick }) {

  const isEnabled = settings?.mobile_bottom_banner_enabled === 'true' || settings?.mobile_bottom_banner_enabled === true;
  
  const forYouText = lang === 'fr' ? 'Pour vous' : 'For you';
  const [activeTab, setActiveTab] = useState(forYouText);

  // Sync tab language when it changes
  useEffect(() => {
    setActiveTab(forYouText);
  }, [forYouText]);

  // Determine which tabs to show (excluding 'All' or 'Tout')
  const tabsList = useMemo(() => {
    const activeProducts = products.filter(p => p.status !== 'draft');
    const categoriesWithProducts = new Set(activeProducts.map(p => p.category).filter(Boolean));
    
    const filteredStoreCategories = categories.filter(c => 
      c.name && 
      c.name.toLowerCase() !== 'all' && 
      c.name.toLowerCase() !== 'tout' && 
      categoriesWithProducts.has(c.name)
    );
    
    return [forYouText, ...filteredStoreCategories.map(c => c.name)];
  }, [categories, products, forYouText]);

  // Determine products to show for active tab
  const feedProducts = useMemo(() => {
    const activeProducts = products.filter(p => p.status !== 'draft');
    const sortedProducts = [...activeProducts].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    if (activeTab === forYouText) {
      return sortedProducts;
    }
    return sortedProducts.filter(p => p.category === activeTab);
  }, [products, activeTab, forYouText]);

  if (!isEnabled) return null;
  if (tabsList.length <= 1) return null;

  return (
    <div className="w-full px-4 pb-12 select-none block lg:hidden">
      {/* Horizontal Scrollable Tabs */}
      <div className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-2 mb-4 select-none">
        {tabsList.map(tab => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4.5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800'
              }`}
            >
              {tab === forYouText ? tab : t_smart(tab)}
            </button>
          );
        })}
      </div>

      {/* Two Column Product Grid */}
      {feedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {feedProducts.map(product => (
            <ProductCard key={product.id} product={product} onProductClick={onProductClick} />
          ))}
        </div>
      ) : (
        <div className="w-full py-12 text-center text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
          {lang === 'fr' ? 'Aucun produit trouvé' : 'No products found'}
        </div>
      )}
    </div>
  );
}
