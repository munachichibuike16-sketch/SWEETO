import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { Play, Volume2, VolumeX, ExternalLink, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const VideoAdSection = ({ isPermanent = false, adIndex = 0 }) => {
  const { videoAds, products } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = React.useState(true);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.5 });

  // Filter only active ads
  const activeAds = videoAds.filter(ad => ad.isActive);
  const [currentIdx, setCurrentIdx] = useState(adIndex % (activeAds.length || 1));

  // Rotate ads every 15 seconds
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % activeAds.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [activeAds.length]);

  if (activeAds.length === 0) return null;

  const ad = activeAds[currentIdx] || activeAds[0] || {};
  const linkedProduct = ad?.productId ? products.find(p => p.id === ad.productId) : null;

  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost && isInView && ad?.id) {
      fetch(`/api/video-ads/${ad.id}/track-view`, { method: 'POST' })
        .catch(() => {});
    }
  }, [isInView, ad?.id]);

  const handleAction = () => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
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
        relative rounded-[3rem] overflow-hidden shadow-2xl group ${isPermanent ? 'bg-black' : 'bg-slate-900'} h-full
        ${!isPermanent && 'aspect-[16/9] md:aspect-[21/9] w-full'}
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
        <div className={`absolute inset-0 p-8 md:p-16 flex flex-col justify-end items-start`}>
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="px-6 py-3 bg-pink-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg flex items-center gap-2">
                <Zap size={14} className="fill-white" /> {ad.type === 'video' ? t('video_commercial') : t('premium_banner')}
              </span>
            </div>

            <h2 className={`text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic leading-none max-w-2xl`}>
              {ad.title || t('exclusive_tech_deals')}
            </h2>

            {!isPermanent && ad.description && (
              <p className="text-white/60 text-sm md:text-xl font-medium leading-relaxed max-w-2xl line-clamp-2">
                {ad.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 pt-4">
              <button 
                onClick={handleAction} 
                className="bg-white text-slate-900 px-10 py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] hover:bg-pink-500 hover:text-white transition-all shadow-2xl flex items-center gap-6 group"
              >
                {linkedProduct ? t('shop_now') : t('discover_deals')}
                <div className="w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center group-hover:border-white transition-colors">
                  <Play size={16} className="fill-current translate-x-0.5" />
                </div>
              </button>
              
              {ad.type === 'video' && (
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
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
