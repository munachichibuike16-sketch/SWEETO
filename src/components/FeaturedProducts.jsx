import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const FeaturedProducts = () => {
  const { t } = useLanguage();
  const { products, loading } = useStore();

  return (
    <section className="py-12 px-4 md:px-8 max-w-7xl mx-auto" id="shop">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">{t('popular') || 'Popular'} <span className="text-eas-blue">{t('electronics') || 'Electronics'}</span></h2>
          <p className="text-slate-500 font-medium">{t('top_picks_desc') || 'Top picks for your digital lifestyle.'}</p>
        </div>
        <button className="hidden md:block font-bold text-eas-blue hover:underline">{t('view_all_collection') || 'View All Collection'}</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-eas-blue border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
