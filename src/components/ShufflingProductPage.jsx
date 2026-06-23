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
    <div className="px-0 md:px-12 py-2">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 md:mb-6 group mx-3 md:mx-0"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="text-[10px] uppercase tracking-widest font-black">{isFr ? 'Retour' : 'Back'}</span>
      </button>

      {/* AliExpress-Style Hero Banner */}
      <div className="relative w-[calc(100%-24px)] mx-3 md:w-full md:mx-0 h-40 md:h-56 rounded-2xl overflow-hidden shadow-md flex items-center bg-black mb-4">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1000" 
            alt={title} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        </div>

        {/* Banner Text Overlay */}
        <div className="relative z-10 pl-6 md:pl-12 flex flex-col items-start gap-1">
          {/* Angled "Viva" Badge */}
          <div className="bg-[#00f2fe] text-slate-950 font-black text-[10px] sm:text-xs px-2.5 py-0.5 rounded uppercase tracking-wider transform -rotate-12 select-none shadow-sm mb-1">
            Viva
          </div>
          {/* Main Title */}
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter drop-shadow-md leading-none">
            {title} finds
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-slate-300 uppercase tracking-widest mt-1">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Compact Live Mix Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm mb-6 mx-3 md:mx-0 w-[calc(100%-24px)] md:w-full">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying && !isHovered ? 'bg-red-500' : 'bg-amber-500'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying && !isHovered ? 'bg-red-600' : 'bg-amber-600'}`}></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {isPlaying 
              ? (isHovered ? (isFr ? 'MÉLANGE EN PAUSE (SURVOL)' : 'MIX PAUSED (HOVER)') : (isFr ? 'MÉLANGE EN DIRECT' : 'LIVE FEED ACTIVE'))
              : (isFr ? 'MÉLANGE EN PAUSE' : 'MIX PAUSED')}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent hover:bg-slate-850'
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? (isFr ? 'Pause' : 'Pause') : (isFr ? 'Activer' : 'Play')}</span>
          </button>

          {/* Shuffle Button */}
          <button
            onClick={handleManualShuffle}
            disabled={isRotating}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-1.5 text-[11px] font-extrabold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={12} className={isRotating ? 'animate-spin' : ''} />
            <span>{isFr ? 'Mélanger' : 'Shuffle'}</span>
          </button>

          {/* Speed badge selectors */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/40 dark:border-slate-800">
            {[
              { label: '5s', value: 5 },
              { label: '10s', value: 10 },
              { label: '20s', value: 20 }
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setSpeed(item.value)}
                className={`px-2 py-0.5 text-[10px] font-extrabold rounded transition-all cursor-pointer ${
                  speed === item.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid container with hover listeners to pause countdown */}
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full relative px-1 md:px-0"
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
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5 sm:gap-8 w-full"
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
