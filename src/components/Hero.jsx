import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { ArrowRight, Sparkles } from 'lucide-react';

// Subtle floating particle effect
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 dark:bg-white/10 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
            opacity: Math.random() * 0.5 + 0.1,
            scale: Math.random() * 2 + 0.5
          }}
          animate={{
            y: [null, Math.random() * -100 - 50],
            opacity: [null, 0.8, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

const Hero = ({ banners = [], onProductClick }) => {
  const { lang, t, t_smart } = useLanguage();
  const { products, settings } = useStore();
  const { scrollY } = useScroll();
  const [randomProduct, setRandomProduct] = useState(null);
  const [activeProducts, setActiveProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const live = products.filter(p => p.status === 'live' || p.status === 'active' || p.is_active !== false);
      if (live.length > 0) {
        setActiveProducts(live);
        setRandomProduct(live[Math.floor(Math.random() * live.length)]);
      }
    }
  }, [products]);

  // Slide through products automatically
  useEffect(() => {
    if (activeProducts.length < 2) return;
    const interval = setInterval(() => {
      setRandomProduct(prev => {
        let newIndex = Math.floor(Math.random() * activeProducts.length);
        while (activeProducts[newIndex]?.id === prev?.id && activeProducts.length > 1) {
          newIndex = Math.floor(Math.random() * activeProducts.length);
        }
        return activeProducts[newIndex];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [activeProducts]);
  
  // Parallax effects
  const y = useTransform(scrollY, [0, 1000], [0, 250]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const scale = useTransform(scrollY, [0, 1000], [1, 1.05]);

  // Use random product image for the background, fallback to banner or default
  const productImg = randomProduct?.image_url || randomProduct?.image || (randomProduct?.images ? (typeof randomProduct.images === 'string' ? (() => { try { return JSON.parse(randomProduct.images)[0]; } catch(e) { return null; } })() : randomProduct.images[0]) : null);
  const activeBanners = banners?.filter(b => b.is_active !== false) || [];
  
  const bgImage = productImg || (activeBanners.length > 0 && activeBanners[0].image_url 
    ? activeBanners[0].image_url 
    : 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] // Custom bezier for cinematic feel
      }
    }
  };

  return (
    <section className="relative h-[60vh] min-h-[450px] md:h-[65vh] w-full max-w-[1600px] mx-auto overflow-hidden mt-0 md:mt-4 md:rounded-3xl shadow-2xl flex items-center justify-center isolate">
      
      {/* Background Image with Parallax & Slow Scale */}
      <motion.div 
        className="absolute inset-0 z-0 bg-slate-900"
        style={{ y, opacity }}
      >
        <AnimatePresence mode="wait">
          {bgImage && (
            <motion.div
              key={randomProduct?.id || 'banner'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
          )}
        </AnimatePresence>
        <motion.div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ scale }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Dynamic Lighting / Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)] z-10" />
      </motion.div>

      <FloatingParticles />

      {/* Transparent Content Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 w-11/12 md:w-3/4 max-w-4xl p-8 md:p-16 text-center flex flex-col items-center justify-center overflow-hidden"
      >
        <AnimatePresence mode="wait">
          <motion.div 
            key={randomProduct?.id || 'content'}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { 
                opacity: 1, y: 0, 
                transition: { duration: 0.6, staggerChildren: 0.15 } 
              },
              exit: { opacity: 0, y: -10, transition: { duration: 0.6 } }
            }}
            className="flex flex-col items-center"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 border border-white/10 text-white text-xs font-semibold tracking-widest uppercase mb-8 backdrop-blur-md">
              <Sparkles size={14} className="text-amber-200" />
              <span>{randomProduct?.category || (lang === 'fr' ? 'La nouvelle collection' : 'The New Collection')}</span>
            </motion.div>

            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            >
              {randomProduct ? randomProduct.name : (lang === 'fr' ? 'L\'Élégance Redéfinie.' : 'Elevate Your Experience.')}
            </motion.h1>

            <motion.p 
              variants={itemVariants}
              className="mt-6 text-base md:text-lg text-white/90 max-w-2xl font-medium leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            >
              {randomProduct?.description 
                ? (randomProduct.description.length > 150 ? randomProduct.description.substring(0, 150) + '...' : randomProduct.description)
                : (lang === 'fr' 
                  ? 'Découvrez une sélection de technologies haut de gamme conçues pour inspirer et transformer votre quotidien.'
                  : 'Discover a curated selection of premium technology designed to inspire and transform your everyday life.')}
            </motion.p>

            {randomProduct?.price && (
              <motion.div variants={itemVariants} className="mt-4 text-3xl md:text-4xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {parseFloat(randomProduct.price).toLocaleString()} {settings?.currency || 'FCFA'}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row gap-4 items-center">
              <button 
                className="group relative px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-sm tracking-widest uppercase overflow-hidden shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_30px_rgba(255,255,255,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => {
                  if (randomProduct && onProductClick) {
                    onProductClick(randomProduct);
                  } else {
                    const element = document.getElementById('main-store-feed');
                    if(element) element.scrollIntoView({behavior: 'smooth', block: 'start'});
                  }
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {lang === 'fr' ? 'EXPLORER MAINTENANT' : 'EXPLORE NOW'}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white via-slate-100 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default Hero;
