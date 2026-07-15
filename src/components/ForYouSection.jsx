import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

const ForYouSection = ({ products = [], categories = [], onProductClick }) => {
  const navigate = useNavigate();
  const { t_smart } = useLanguage();
  const { settings } = useStore();

  // Get only top-level categories (parent_id is null or empty)
  const topCategories = categories.filter(c => !c.parent_id);

  // For each top-level category, get 2 products
  const categoryGroups = topCategories.map(cat => {
    // Find subcategories if any
    const subcatIds = categories.filter(sub => sub.parent_id === cat.id || sub.id === cat.id).map(s => s.name);
    // Filter products belonging to this category or its subcategories
    const catProducts = products.filter(p => p.category === cat.name || subcatIds.includes(p.category));

    // Sort by id descending so newly added comes first
    const sortedProducts = [...catProducts].sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    return {
      category: cat,
      products: sortedProducts.slice(0, 2)
    };
  }).filter(group => group.products.length > 0); // Only show categories that have products

  if (categoryGroups.length === 0) return null;

  return (
    <div className="w-full select-none mt-2 mb-8 px-4 md:px-0">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1 h-5 bg-[#e61e25] rounded-full"></span>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-850 dark:text-white">
            For You
          </h2>
        </div>
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {categoryGroups.map(group => (
          <div 
            key={group.category.id}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow text-left"
          >
            {/* Category Header Link */}
            <div 
              onClick={() => navigate(`/category/${encodeURIComponent(group.category.name)}`)}
              className="flex items-center justify-between cursor-pointer group mb-2.5"
            >
              <h3 className="text-xs font-black text-slate-800 dark:text-white group-hover:text-[#e61e25] transition-colors truncate capitalize">
                {t_smart ? t_smart(group.category.name) : group.category.name}
              </h3>
              <ChevronRight size={12} className="text-slate-400 group-hover:text-[#e61e25] transition-colors shrink-0 ml-1" />
            </div>

            {/* Images Grid (2 products side-by-side) */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {group.products.map(product => (
                <div 
                  key={product.id}
                  onClick={() => onProductClick ? onProductClick(product) : navigate(`/product/${product.id}`)}
                  className="group/item flex flex-col justify-between items-center cursor-pointer bg-slate-50 dark:bg-slate-950 rounded-xl p-1.5 border border-slate-100 dark:border-slate-800/80 hover:border-[#e61e25]/30 transition-colors h-full"
                >
                  {/* Product Image */}
                  <div className="w-full aspect-square flex items-center justify-center overflow-hidden bg-white dark:bg-slate-900 rounded-lg p-1">
                    <img 
                      src={product.image_url || product.image || '/hero-banner.png'} 
                      alt="" 
                      className="max-w-full max-h-full object-contain group-hover/item:scale-105 transition-transform" 
                    />
                  </div>

                  {/* Price */}
                  <div className="mt-1.5 w-full text-center">
                    <span className="text-[10px] font-black text-[#e61e25] block truncate leading-none">
                      {settings?.currency || 'FCFA'} {product.price.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Fallback if only 1 product in category */}
              {group.products.length === 1 && (
                <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-955 rounded-xl border border-dashed border-slate-205 dark:border-slate-800 text-slate-400 text-[10px] italic">
                  Soon
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForYouSection;
