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

  useEffect(() => {
    if (!isEnabled || tabsList.length <= 1) return;
    if (window.innerWidth >= 1024) return;

    const header = document.querySelector('header');
    const feedPills = document.getElementById('mobile-bottom-feed-pills');
    const sentinel = document.getElementById('mobile-bottom-feed-sentinel');
    const spacer = document.getElementById('mobile-bottom-feed-spacer');
    if (!header || !feedPills || !sentinel) return;

    const H = header.offsetHeight || 96;

    const handleScroll = () => {
      const rect = sentinel.getBoundingClientRect();
      const H_dynamic = header.offsetHeight || H;
      const translateY = Math.max(-H_dynamic, Math.min(0, rect.top - H_dynamic));
      
      header.style.transform = `translateY(${translateY}px)`;
      if (translateY === 0) {
        header.style.transition = '';
      } else {
        header.style.transition = 'none';
      }

      // If sentinel has scrolled past the header bottom threshold, stick it using position: fixed
      if (rect.top <= H_dynamic) {
        feedPills.style.position = 'fixed';
        feedPills.style.top = `${H_dynamic + translateY}px`;
        feedPills.style.left = '0';
        feedPills.style.right = '0';
        feedPills.style.paddingLeft = '16px';
        feedPills.style.paddingRight = '16px';
        
        feedPills.classList.add('border-slate-150', 'dark:border-slate-800/80', 'shadow-sm');
        feedPills.classList.remove('border-transparent');

        if (spacer) {
          spacer.style.display = 'block';
          spacer.style.height = `${feedPills.offsetHeight}px`;
        }
      } else {
        // Reset to default flow
        feedPills.style.position = '';
        feedPills.style.top = '';
        feedPills.style.left = '';
        feedPills.style.right = '';
        feedPills.style.paddingLeft = '';
        feedPills.style.paddingRight = '';

        feedPills.classList.remove('border-slate-150', 'dark:border-slate-800/80', 'shadow-sm');
        feedPills.classList.add('border-transparent');

        if (spacer) {
          spacer.style.display = 'none';
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (header) {
        header.style.transform = '';
        header.style.transition = '';
      }
      if (feedPills) {
        feedPills.style.position = '';
        feedPills.style.top = '';
        feedPills.style.left = '';
        feedPills.style.right = '';
        feedPills.style.paddingLeft = '';
        feedPills.style.paddingRight = '';
      }
      if (spacer) {
        spacer.style.display = 'none';
      }
    };
  }, [isEnabled, tabsList]);

  if (!isEnabled) return null;
  if (tabsList.length <= 1) return null;

  return (
    <div className="w-full px-4 pb-12 select-none block lg:hidden">
      {/* Sentinel to measure true scroll offset without being blocked by sticky positioning */}
      <div id="mobile-bottom-feed-sentinel" className="h-0 w-full bg-transparent" />
      
      {/* Horizontal Scrollable Tabs */}
      <div 
        id="mobile-bottom-feed-pills"
        className="w-full flex gap-2.5 overflow-x-auto no-scrollbar py-2.5 select-none bg-eas-light dark:bg-eas-dark transition-colors duration-300 border-b border-transparent z-[90]"
      >
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

      {/* Spacer to prevent layout jump when pills become fixed */}
      <div id="mobile-bottom-feed-spacer" style={{ display: 'none' }} className="w-full mb-4" />

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
