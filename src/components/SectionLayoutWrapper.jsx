import React from 'react';
import { useStore } from '../contexts/StoreContext';
import { PlayCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const SectionLayoutWrapper = ({ children, showVideoPromo, videoAdId }) => {
  const { videoAds, products } = useStore();
  const { t } = useLanguage();

  // Find the video ad
  const ad = videoAdId 
    ? videoAds.find(a => a.id === videoAdId)
    : videoAds.filter(a => a.isActive && a.type === 'video').reverse()[0];

  const linkedProduct = ad?.productId ? products.find(p => p.id === ad.productId) : null;

  if (!showVideoPromo || !ad) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Video Side */}
      <div className="w-full lg:w-[350px] xl:w-[400px] shrink-0">
        <div className="relative aspect-[9/16] lg:aspect-auto lg:h-full min-h-[450px] rounded-[2.5rem] overflow-hidden bg-black group shadow-2xl">
          {ad.type === 'video' ? (
            <video 
              src={ad.videoUrl ? `${ad.videoUrl}?v=1` : ''} 
              autoPlay loop muted playsInline 
              preload="metadata"
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[2s]"
            />
          ) : (
            <img 
              src={ad.imageUrl} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" 
            />
          )}

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-8 flex flex-col justify-end">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-full bg-eas-blue flex items-center justify-center text-white">
                    <PlayCircle size={16} fill="currentColor" />
                 </div>
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{t('live_spotlight') || 'Live Spotlight'}</span>
              </div>
              
              <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                {ad.title}
              </h3>
              
              {ad.description && (
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest leading-relaxed line-clamp-2">
                  {ad.description}
                </p>
              )}

              {linkedProduct && (
                <Link 
                  to={`/product/${linkedProduct.id}`}
                  className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-eas-blue hover:text-white transition-all group/btn"
                >
                  {t('shop_now') || 'Shop Now'}
                  <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Side */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export default SectionLayoutWrapper;
