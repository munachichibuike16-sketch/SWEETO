import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';

const getTabEmoji = (tabName) => {
  const name = tabName.toLowerCase();
  if (name.includes('pour vous') || name.includes('for you')) return '✨';
  if (name.includes('smartphones') || name.includes('téléphones')) return '📱';
  if (name.includes('laptop') || name.includes('ordinateur')) return '💻';
  if (name.includes('audio') || name.includes('écouteur') || name.includes('casques') || name.includes('earphones') || name.includes('headphones')) return '🎧';
  if (name.includes('tv') || name.includes('vidéo') || name.includes('cinema')) return '📺';
  if (name.includes('speakers') || name.includes('haut-parleurs')) return '🔊';
  if (name.includes('refrigerator') || name.includes('frigo') || name.includes('réfrigérateur')) return '❄️';
  if (name.includes('watch') || name.includes('montre')) return '⌚';
  if (name.includes('accessory') || name.includes('accessoire')) return '🔌';
  if (name.includes('camera') || name.includes('appareil')) return '📷';
  return '🏷️';
};

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
      <div className="pt-4" />

      {/* Two Column Product Grid */}
      {feedProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {feedProducts.map(product => (
            <ProductCard key={product.id} product={product} onProductClick={onProductClick} hideDiscountAndOriginalPrice={true} />
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
