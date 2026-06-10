import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Zap, PlayCircle } from 'lucide-react';
import ProductCard from './ProductCard';
import SectionLayoutWrapper from './SectionLayoutWrapper';

const DealOfTheDay = ({ title, isFirst, showVideoPromo, videoAdId }) => {
  const { products, videoAds } = useStore();
  const { t } = useLanguage();
  const [page, setPage] = useState(0);

  // Get the most recent active video ad if no specific ID provided
  const activeVideoAd = videoAds && videoAds.length > 0
    ? [...videoAds].filter(ad => ad.isActive !== false && ad.type === 'video').reverse()[0]
    : null;

  // Final video ID to use: either from prop or the fallback active one
  const finalVideoId = videoAdId || activeVideoAd?.id;

  // Get all products with a discount, sorted by discount percentage
  const dealProducts = products
    .filter(p => p.status === 'active' && p.stock > 0 && (p.is_daily_deal || (p.original_price && p.original_price > p.price)))
    .sort((a, b) => {
      const discA = (a.original_price - a.price) / (a.original_price || 1);
      const discB = (b.original_price - b.price) / (b.original_price || 1);
      return discB - discA;
    });

  const [perPage, setPerPage] = useState(window.innerWidth < 768 ? 2 : 3);

  useEffect(() => {
    const handleResize = () => setPerPage(window.innerWidth < 768 ? 2 : 3);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.ceil(dealProducts.length / perPage);
  const visible = dealProducts.slice(page * perPage, page * perPage + perPage);

  if (dealProducts.length === 0) return null;

  return (
    <section className={`w-full overflow-hidden ${isFirst ? 'pt-2' : 'mt-24'}`}>
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Editorial Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-eas-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-eas-blue/20">
                <Zap size={20} fill="currentColor" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
                {title || t('deal_of_day') || 'Deal of the Day'}
              </h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-20 h-1.5 bg-eas-blue rounded-full"></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{t('deals_desc') || 'Limited time offers on premium gear'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/deals" className="text-[10px] font-black text-slate-900 border-2 border-slate-900 px-6 py-3 rounded-2xl uppercase tracking-[0.2em] hover:bg-slate-900 hover:text-white transition-all">
              {t('view_all') || 'View All'}
            </Link>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-eas-blue hover:border-eas-blue disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-eas-blue hover:border-eas-blue disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        <SectionLayoutWrapper showVideoPromo={true} videoAdId={finalVideoId}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {visible.map(product => (
              <div key={product.id} className="relative">
                <ProductCard product={product} isDailyDeal={true} />
              </div>
            ))}
          </div>
        </SectionLayoutWrapper>
      </div>
    </section>
  );
};

export default DealOfTheDay;
