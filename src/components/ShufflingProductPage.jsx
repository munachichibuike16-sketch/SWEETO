import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RefreshCw, Sparkles, TrendingUp, HelpCircle, 
  Settings2, Activity, Info, ArrowLeft 
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ProductCard from './ProductCard';

const shuffleArray = (array) => {
  const arr = [...(array || [])];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const ShufflingProductPage = ({ viewMode = 'trending', onProductClick }) => {
  const navigate = useNavigate();
  const { products: liveProducts, settings } = useStore();
  const { t, lang } = useLanguage();
  
  // Filter active products
  const activeProducts = useMemo(() => {
    return Array.isArray(liveProducts) 
      ? liveProducts.filter(p => p.status === 'active') 
      : [];
  }, [liveProducts]);

  const [shuffledList, setShuffledList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(10); // Default 10 seconds
  const [countdown, setCountdown] = useState(10);
  const [isHovered, setIsHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  // Initialize list
  useEffect(() => {
    if (activeProducts.length > 0) {
      setShuffledList(shuffleArray(activeProducts));
    }
  }, [activeProducts]);

  // Handle countdown resetting when speed changes
  useEffect(() => {
    setCountdown(speed);
  }, [speed]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || isHovered || activeProducts.length === 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger shuffle
          setIsRotating(true);
          setShuffledList(shuffleArray(activeProducts));
          setTimeout(() => setIsRotating(false), 600);
          return speed;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isHovered, speed, activeProducts]);

  const handleManualShuffle = () => {
    if (activeProducts.length === 0) return;
    setIsRotating(true);
    setShuffledList(shuffleArray(activeProducts));
    setCountdown(speed);
    setTimeout(() => setIsRotating(false), 600);
  };

  const isFr = lang === 'fr';

  // Title & Subtitle translations
  const title = viewMode === 'trending' 
    ? (isFr ? 'Pour Vous' : 'For You') 
    : (isFr ? 'Recommandé' : 'Recommended');

  const subtitle = viewMode === 'trending'
    ? (isFr ? 'Un mélange dynamique mis à jour en direct' : 'A dynamic, live-updating mixture')
    : (isFr ? 'Sélectionné spécialement selon vos préférences' : 'Selected especially based on your preferences');

  return (
    <div className="px-3 md:px-12 py-2">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 md:mb-6 group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-[10px] uppercase tracking-widest font-black">{isFr ? 'Retour' : 'Back'}</span>
      </button>

      {/* Dynamic Header / Dashboard */}
      <div className="mb-6 md:mb-10 bg-white/75 dark:bg-slate-900/50 backdrop-blur-xl border border-slate-100 dark:border-slate-800/60 p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-300">
        
        {/* Progress Countdown Bar */}
        {isPlaying && !isHovered && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/40">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / speed) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            {/* Live Indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying && !isHovered ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPlaying && !isHovered ? 'bg-red-600' : 'bg-amber-600'}`}></span>
              </span>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                {isPlaying 
                  ? (isHovered ? (isFr ? 'MÉLANGE EN PAUSE (SURVOL)' : 'MIX PAUSED (HOVER)') : (isFr ? 'MÉLANGE EN DIRECT' : 'LIVE FEED ACTIVE'))
                  : (isFr ? 'MÉLANGE EN PAUSE' : 'MIX PAUSED')}
              </span>
            </div>

            {/* Title & Subtitle */}
            <h1 className="text-2xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-2.5">
              {viewMode === 'trending' ? (
                <Sparkles className="text-blue-600 dark:text-blue-400 w-6 h-6 md:w-10 md:h-10" />
              ) : (
                <TrendingUp className="text-blue-600 dark:text-blue-400 w-6 h-6 md:w-10 md:h-10" />
              )}
              {title}
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 md:mt-2">
              {subtitle}
            </p>
          </div>

          {/* Interactive Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                isPlaying
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent hover:bg-slate-800'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? (isFr ? 'Pause' : 'Pause') : (isFr ? 'Activer' : 'Play')}</span>
            </button>

            {/* Manual Shuffle */}
            <button
              onClick={handleManualShuffle}
              disabled={isRotating}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all active:scale-95 shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <RefreshCw size={14} className={isRotating ? 'animate-spin' : ''} />
              <span>{isFr ? 'Mélanger' : 'Shuffle'}</span>
            </button>

            {/* Speed Badges */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 px-2">
                {isFr ? 'VITESSE' : 'INTERVAL'}
              </span>
              {[
                { label: '5s', value: 5 },
                { label: '10s', value: 10 },
                { label: '20s', value: 20 }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setSpeed(item.value)}
                  className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all cursor-pointer ${
                    speed === item.value
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Tip (Only shown when playing) */}
        {isPlaying && (
          <div className="mt-4 flex items-center gap-1.5 text-[10px] md:text-xs text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-100/50 dark:border-slate-800/40">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span>
              {isFr 
                ? "Le mélange s'arrête automatiquement lorsque vous passez votre souris ou restez appuyé sur un produit pour vous permettre de naviguer sereinement." 
                : "Shuffling pauses automatically when hovering over any card so you can browse without the grid shifting."}
            </span>
          </div>
        )}
      </div>

      {/* Grid container with hover listeners to pause countdown */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full relative"
      >
        {shuffledList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">
              {isFr ? 'Génération de la sélection...' : 'Generating your feed...'}
            </p>
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-8 w-full"
          >
            <AnimatePresence mode="popLayout">
              {shuffledList.map((product, idx) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 100,
                    damping: 15,
                    mass: 0.8,
                    layout: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } 
                  }}
                  className="w-full"
                >
                  <ProductCard
                    product={product}
                    index={idx}
                    onProductClick={onProductClick}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ShufflingProductPage;
