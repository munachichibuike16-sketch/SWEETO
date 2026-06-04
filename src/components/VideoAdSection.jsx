import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../contexts/StoreContext';
import { Play, Volume2, VolumeX, MessageCircle, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const VideoCard = ({ ad, linkedProduct, onClick }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const { t, t_smart } = useLanguage();
  const { settings } = useStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play()
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          } else {
            video.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(video);
    return () => {
      if (video) observer.unobserve(video);
    };
  }, [ad.videoUrl]);

  return (
    <div 
      onClick={() => onClick(ad)}
      className="relative shrink-0 w-[260px] sm:w-[320px] aspect-[9/16] rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-100/5 dark:border-white/5 shadow-2xl snap-center cursor-pointer group"
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={ad.videoUrl}
        poster={ad.imageUrl || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=300"}
        preload="none"
        playsInline
        muted={isMuted}
        loop
        className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-[8s] ease-out"
      />

      {/* Ambient shadow gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 pointer-events-none" />

      {/* Floating Watermark */}
      <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-eas-blue animate-pulse" />
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">@sweeto</span>
      </div>

      {/* Mute Overlay Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
        }}
        className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors cursor-pointer"
      >
        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      {/* Direct Product Link Tag Pill Overlay */}
      {linkedProduct && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex items-center justify-between hover:bg-white/25 transition-all duration-300">
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">🛒 {t_smart(linkedProduct.category)}</span>
              <span className="text-[10px] font-black text-white truncate uppercase tracking-tighter leading-none">{t_smart(linkedProduct.name)}</span>
            </div>
            <span className="text-[9px] font-black text-eas-blue bg-white px-2.5 py-1.5 rounded-xl whitespace-nowrap tracking-tight italic">
              {linkedProduct.price?.toLocaleString()} {settings?.currency || 'FCFA'}
            </span>
          </div>
        </div>
      )}

      {/* Ad Details Overlay (If no linked product) */}
      {!linkedProduct && (
        <div className="absolute bottom-4 left-4 right-4 z-10 text-left">
          <h3 className="text-xs font-black text-white uppercase italic tracking-tighter leading-tight line-clamp-1">{ad.title}</h3>
          <p className="text-[8px] text-slate-300 font-bold uppercase tracking-wider line-clamp-2 mt-1 leading-normal">{ad.description}</p>
        </div>
      )}

      {/* Play Overlay Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white scale-90 group-hover:scale-100 transition-transform">
            <Play size={16} fill="currentColor" className="translate-x-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};

const VideoAdSection = () => {
  const { videoAds, products, settings } = useStore();
  const { t, t_smart, lang } = useLanguage();
  const navigate = useNavigate();

  const [activeOverlayAd, setActiveOverlayAd] = useState(null);
  const [isOverlayMuted, setIsOverlayMuted] = useState(false);
  const overlayVideoRef = useRef(null);

  // Filter only active ads
  const activeAds = videoAds.filter(ad => ad.isActive || ad.is_active === 1 || ad.is_active === true);

  if (activeAds.length === 0) return null;

  const handleCardClick = (ad) => {
    setActiveOverlayAd(ad);
    // Unmute when clicking to watch fullscreen (immersive experience)
    setIsOverlayMuted(false);
  };

  const overlayLinkedProduct = activeOverlayAd?.product_id
    ? products.find(p => String(p.id) === String(activeOverlayAd.product_id))
    : (activeOverlayAd?.productId ? products.find(p => String(p.id) === String(activeOverlayAd.productId)) : null);

  const handleOverlayWhatsApp = () => {
    if (!activeOverlayAd) return;
    const phone = settings?.social_whatsapp ? settings.social_whatsapp.replace(/\D/g, '') : '2250500619923';
    let message = `Bonjour Sweeto-Hub, je m'intéresse à votre vidéo promotionnelle : "${activeOverlayAd.title}".`;
    if (overlayLinkedProduct) {
      message = `Bonjour Sweeto-Hub, je m'intéresse à votre produit vu dans votre promo vidéo : "${overlayLinkedProduct.name}" (${overlayLinkedProduct.price?.toLocaleString()} ${settings?.currency || 'FCFA'}). Est-il disponible ?`;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-16 px-4 md:px-8 max-w-[1600px] mx-auto overflow-hidden relative">
      {/* Background Soft Neon Backglow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-pink-500/5 dark:bg-pink-500/2 blur-[100px] rounded-full pointer-events-none" />

      {/* Centered Premium Header */}
      <div className="flex flex-col items-center justify-center mb-10 relative">
        <h2 className="text-xl md:text-3xl font-black uppercase tracking-[0.25em] text-center italic relative">
          <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-eas-blue dark:from-white dark:via-pink-400 dark:to-white bg-clip-text text-transparent drop-shadow-[0_2px_15px_rgba(236,72,153,0.2)]">
            {lang === 'fr' ? 'Sweeto Promos & Reviews' : 'Sweeto Promos & Reviews'}
          </span>
        </h2>
        <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
          <Sparkles size={12} className="text-pink-500" />
          {lang === 'fr' ? 'Découvrez nos nouveautés en vidéos courtes' : 'Discover our updates in short-form clips'}
        </p>
      </div>

      {/* Horizontal Swipe Swiper Container */}
      <div className="relative">
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory px-4 scroll-smooth">
          {activeAds.map((ad, idx) => {
            const linkedProduct = ad?.product_id 
              ? products.find(p => String(p.id) === String(ad.product_id)) 
              : (ad?.productId ? products.find(p => String(p.id) === String(ad.productId)) : null);
            return (
              <VideoCard 
                key={ad.id || idx} 
                ad={ad} 
                linkedProduct={linkedProduct} 
                onClick={handleCardClick} 
              />
            );
          })}
        </div>
      </div>

      {/* Full-Screen Vertical Theater Mode Overlay (TikTok / Reels Style) */}
      <AnimatePresence>
        {activeOverlayAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6"
          >
            <div className="relative w-full max-w-md h-full md:h-[90vh] md:max-h-[850px] bg-slate-950 rounded-none md:rounded-[2.5rem] overflow-hidden border border-white/5 flex flex-col justify-end">
              {/* Full-Screen Video Player */}
              <video
                ref={overlayVideoRef}
                src={activeOverlayAd.videoUrl}
                autoPlay
                loop
                playsInline
                muted={isOverlayMuted}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Ambient Shadow Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40 pointer-events-none" />

              {/* Top Watermark & Close Controller */}
              <div className="absolute top-6 left-6 right-6 z-10 flex items-center justify-between">
                <div className="bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none select-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-eas-blue animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white">@sweeto</span>
                </div>
                <button
                  onClick={() => setActiveOverlayAd(null)}
                  className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 transition-colors pointer-events-auto cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Floating Right Hand Controls */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-4">
                <button
                  onClick={() => setIsOverlayMuted(!isOverlayMuted)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {isOverlayMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>

              {/* Sticky Order Overlay Bottom Section */}
              <div className="relative z-10 p-6 space-y-5">
                <div className="text-left space-y-2 max-w-[85%]">
                  <h3 className="text-base sm:text-lg font-black text-white uppercase italic tracking-tighter leading-tight">{activeOverlayAd.title}</h3>
                  {activeOverlayAd.description && (
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider leading-relaxed line-clamp-2">{activeOverlayAd.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {overlayLinkedProduct && (
                    <div 
                      onClick={() => {
                        setActiveOverlayAd(null);
                        navigate(`/product/${overlayLinkedProduct.id}`);
                      }}
                      className="bg-white/10 backdrop-blur-xl border border-white/15 p-3 rounded-2xl flex items-center justify-between hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <img src={overlayLinkedProduct.image_url || overlayLinkedProduct.image} className="w-10 h-10 object-contain rounded-lg bg-slate-900/80 p-1" />
                        <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5 leading-none">{t_smart(overlayLinkedProduct.category)}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{t_smart(overlayLinkedProduct.name)}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-eas-blue italic bg-white px-2.5 py-1.5 rounded-xl">{overlayLinkedProduct.price?.toLocaleString()} {settings?.currency || 'FCFA'}</span>
                    </div>
                  )}

                  <button
                    onClick={handleOverlayWhatsApp}
                    className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white py-4.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl shadow-green-500/20 flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-95 hover:shadow-green-500/35"
                  >
                    <MessageCircle size={16} fill="currentColor" />
                    {lang === 'fr' ? 'Commander via WhatsApp' : 'Order via WhatsApp'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VideoAdSection;
