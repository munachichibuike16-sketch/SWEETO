import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { Play, Volume2, VolumeX, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { isLocalHost } from '../utils/api';

const VideoAdSection = ({ isPermanent = false, adIndex = 0, section }) => {
  const { videoAds, products } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = React.useState(true);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  // Filter only active ads
  const activeAds = videoAds.filter(ad => ad.isActive);
  const [currentIdx, setCurrentIdx] = useState(adIndex % (activeAds.length || 1));

  // Determine if this section displays a specific chosen ad
  const specificAd = section?.category && section.category !== 'All'
    ? activeAds.find(ad => String(ad.id) === String(section.category))
    : null;

  // Rotate ads every 15 seconds if not showing a specific ad
  useEffect(() => {
    if (specificAd || activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % activeAds.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeAds.length, specificAd]);

  if (activeAds.length === 0) return null;

  const ad = specificAd || activeAds[currentIdx] || activeAds[0] || {};
  const linkedProduct = ad?.productId ? products.find(p => p.id === ad.productId) : null;

  useEffect(() => {
    const isLocalhost = isLocalHost();
    if (isLocalhost && isInView && ad?.id) {
      fetch(`/api/video-ads/${ad.id}/track-view`, { method: 'POST' })
        .catch(() => {});
    }
  }, [isInView, ad?.id]);

  const handleAction = () => {
    const isLocalhost = isLocalHost();
    if (isLocalhost && ad?.id) {
      fetch(`/api/video-ads/${ad.id}/track-click`, { method: 'POST' })
        .catch(() => {});
    }
    
    if (linkedProduct) {
      navigate('/deals');
    } else {
      navigate('/deals');
    }
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={isPermanent ? "h-[500px]" : "py-12 px-4 md:px-8 max-w-[1600px] mx-auto"}
    >
      <div className={`
        relative rounded-[2.5rem] overflow-hidden shadow-2xl group ${isPermanent ? 'bg-black' : 'bg-slate-900'} h-full
        ${!isPermanent && 'aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] w-full'}
      `}>
        {/* Background */}
        <AnimatePresence mode="wait">
          <motion.div
            key={ad.id}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {ad.type === 'video' ? (
              <video 
                src={ad.videoUrl ? `${ad.videoUrl}?v=1` : ''} 
                autoPlay 
                loop 
                muted={isMuted} 
                playsInline
                preload="metadata"
                className={`w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 ${isPermanent ? 'opacity-40' : 'opacity-60'}`}
              />
            ) : (
              <img 
                src={ad.imageUrl} 
                className={`w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110 ${isPermanent ? 'opacity-40' : 'opacity-60'}`}
                alt={ad.title}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Overlays */}
        <div className={`absolute inset-0 ${isPermanent ? 'bg-black/40' : 'bg-gradient-to-t from-slate-900 via-transparent to-slate-900/40'}`}></div>
        
        {/* Content */}
        <div className="absolute inset-0 p-5 sm:p-8 md:p-16 flex flex-col justify-end items-start z-10">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full space-y-3 sm:space-y-6 md:space-y-8"
          >
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="px-3 py-1.5 sm:px-6 sm:py-3 bg-pink-500 text-white text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-xl sm:rounded-2xl shadow-lg flex items-center gap-1.5 sm:gap-2">
                <Zap size={10} className="fill-white sm:w-[14px] sm:h-[14px]" /> {ad.type === 'video' ? t('video_commercial') : t('premium_banner')}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none max-w-2xl">
              {ad.title || t('exclusive_tech_deals')}
            </h2>

            {!isPermanent && ad.description && (
              <p className="text-white/60 text-xs sm:text-base md:text-xl font-medium leading-relaxed max-w-2xl line-clamp-2">
                {ad.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1.5 sm:pt-4 w-full sm:w-auto">
              <button 
                onClick={handleAction} 
                className="bg-white text-slate-900 px-5 py-3 sm:px-10 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-[10px] sm:text-[12px] uppercase tracking-[0.1em] sm:tracking-[0.2em] hover:bg-pink-500 hover:text-white transition-all shadow-2xl flex items-center gap-3 sm:gap-6 group flex-1 sm:flex-none justify-center"
              >
                {linkedProduct ? t('shop_now') : t('discover_deals')}
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-slate-900 flex items-center justify-center group-hover:border-white transition-colors shrink-0">
                  <Play size={12} className="fill-current translate-x-0.5 sm:w-[16px] sm:h-[16px]" />
                </div>
              </button>
              
              {ad.type === 'video' && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-11 h-11 sm:w-16 sm:h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shrink-0"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoAdSection;
