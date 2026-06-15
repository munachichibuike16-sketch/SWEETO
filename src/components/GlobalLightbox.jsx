import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const GlobalLightbox = () => {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { 
    globalLightbox, 
    closeGlobalLightbox, 
    setGlobalLightboxIndex,
    setSearchQuery,
    setSelectedCategory,
    setSelectedBrand,
    showToast
  } = useStore();

  const [touchStartX, setTouchStartX] = useState(null);

  if (!globalLightbox || !globalLightbox.isOpen) return null;

  const { images, index: activeIndex, category, productId } = globalLightbox;

  if (!images || images.length === 0) return null;

  const handleNext = () => {
    setGlobalLightboxIndex((activeIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setGlobalLightboxIndex((activeIndex - 1 + images.length) % images.length);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = images[activeIndex];
    link.download = `product-${productId || 'image'}-${activeIndex}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Image saved successfully! 💾", "success");
  };

  return (
    <AnimatePresence>
      {globalLightbox.isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between select-none"
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchStartX - touchEndX;
            if (diff > 50) {
              handleNext();
            } else if (diff < -50) {
              handlePrev();
            }
            setTouchStartX(null);
          }}
        >
          {/* Top Bar Navigation Row */}
          <div className="p-4 flex items-center justify-between bg-black/40 backdrop-blur-sm z-20">
            {/* Close X button */}
            <button 
              onClick={closeGlobalLightbox}
              className="text-white hover:opacity-75 transition-opacity p-2 cursor-pointer"
            >
              <X size={24} strokeWidth={2.5} />
            </button>

            {/* Find Similar Action Badge */}
            {category && (
              <button 
                onClick={() => {
                  closeGlobalLightbox();
                  setSearchQuery(category);
                  setSelectedCategory(category);
                  setSelectedBrand(null);
                  navigate('/');
                  showToast("Searching for similar products... 🔍", "info");
                }}
                className="border border-white/40 hover:border-white text-white rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search size={14} strokeWidth={2.5} />
                <span>Find similar</span>
              </button>
            )}

            {/* Save Image Button */}
            <button 
              onClick={handleDownload}
              className="text-white hover:opacity-75 transition-opacity p-2 cursor-pointer"
            >
              <Save size={24} strokeWidth={2} />
            </button>
          </div>

          {/* Middle Image viewport with desktop chevrons */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <img 
              src={images[activeIndex]} 
              alt="Lightbox View" 
              className="max-w-full max-h-[80vh] object-contain"
            />

            {/* Desktop Left navigation chevron */}
            {images.length > 1 && (
              <button 
                onClick={handlePrev}
                className="hidden md:flex absolute left-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 items-center justify-center text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={28} strokeWidth={2.5} />
              </button>
            )}

            {/* Desktop Right navigation chevron */}
            {images.length > 1 && (
              <button 
                onClick={handleNext}
                className="hidden md:flex absolute right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 items-center justify-center text-white transition-colors cursor-pointer"
              >
                <ChevronRight size={28} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Bottom Row Slide Indicator Pill */}
          <div className="pb-8 pt-4 flex flex-col items-center gap-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
              {activeIndex + 1} / {images.length}
            </div>

            {/* Thumbnail Strip (desktop only) */}
            {images.length > 1 && (
              <div className="hidden md:flex gap-2 max-w-lg overflow-x-auto no-scrollbar py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGlobalLightboxIndex(idx)}
                    className={`w-12 h-12 rounded-lg bg-white/5 border p-1 transition-all cursor-pointer ${
                      activeIndex === idx 
                        ? 'border-white ring-2 ring-white/10 scale-105' 
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain rounded" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GlobalLightbox;
