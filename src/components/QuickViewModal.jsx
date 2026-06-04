import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import ReactDOM from 'react-dom';

const QuickViewModal = ({ product, isOpen, onClose, onViewDetails }) => {
  const { settings } = useStore();
  const { addToCart } = useCart();
  const { t, t_smart, isRTL } = useLanguage();
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    if (product) {
      setActiveImage(product.image_url || product.image || '/hero-banner.png');
    }
  }, [product]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!product) return null;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    onClose();
  };

  const generateSKU = (prod) => {
    if (!prod) return '';
    const prefix = prod.brand ? prod.brand.substring(0, 3) : (prod.category ? prod.category.substring(0, 3) : 'PRD');
    return `SWT-${prefix.toUpperCase()}-${String(prod.id).padStart(4, '0')}`;
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop with extreme blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-6"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, rotateX: 10 }}
            animate={{ scale: 1, opacity: 1, rotateX: 0 }}
            exit={{ scale: 0.9, opacity: 0, rotateX: isRTL ? 10 : -10 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row border border-white/20 dark:border-slate-800/50 pointer-events-auto"
          >
            {/* Left Side: Cinematic Image Gallery */}
            <div className="relative w-full md:w-1/2 h-[400px] md:h-auto bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-12 overflow-hidden group">
              {/* Dynamic Scanning Line */}
              <motion.div 
                initial={{ top: '-10%' }}
                animate={{ top: '110%' }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-eas-blue to-transparent z-10 shadow-[0_0_15px_rgba(59,130,246,0.8)] opacity-50 pointer-events-none"
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-eas-blue/5 via-transparent to-transparent"></div>
              
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-transform duration-700 group-hover:scale-105"
              />

              {/* View Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20 bg-black/10 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                {[product.image_url, ...(product.gallery || [])].filter(Boolean).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${activeImage === img ? 'border-eas-blue scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="gallery" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Side: Sophisticated Specs & Actions */}
            <div className="flex-1 p-8 md:p-14 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-slate-900">
              <div className="space-y-8">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className={`absolute top-8 ${isRTL ? 'left-8' : 'right-8'} p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all hover:rotate-90 border border-slate-200 dark:border-slate-700`}
                >
                  <X size={20} />
                </button>

                <div className="space-y-4">
                  <motion.div 
                    initial={{ x: isRTL ? -20 : 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={`flex items-center gap-3 ${isRTL ? 'justify-end' : 'justify-start'} flex-wrap`}
                  >
                    <span className="px-4 py-1.5 bg-eas-blue/10 text-eas-blue text-[10px] font-black uppercase tracking-widest rounded-full border border-eas-blue/20">
                      {product.category || t('premium_gear') || "Premium Gear"}
                    </span>
                    <span className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-inner font-mono">
                      {generateSKU(product)}
                    </span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-black italic">4.9</span>
                    </div>
                  </motion.div>

                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
                    {t_smart(product.name)}
                  </h2>
                  
                  <div className={`flex items-baseline gap-4 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-3xl font-black text-eas-blue italic">
                      {product.price?.toLocaleString()} {settings?.currency || 'FCFA'}
                    </span>
                    {product.original_price && (
                      <span className="text-xl font-bold text-slate-400 line-through opacity-50">
                        {product.original_price?.toLocaleString()} {settings?.currency || 'FCFA'}
                      </span>
                    )}
                  </div>
                </div>

                <p className={`text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md ${isRTL ? 'text-right mr-auto' : 'text-left'}`}>
                  {t_smart(product.description) || t('default_product_desc')}
                </p>


              </div>

              {/* Footer Actions */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
                <motion.button
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddToCart}
                  className="flex-1 bg-slate-900 dark:bg-eas-blue text-white py-5 rounded-[1.5rem] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 dark:shadow-eas-blue/30 group"
                >
                  <ShoppingCart size={20} className="group-hover:rotate-12 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{t('add_to_cart') || 'Add to Cart'}</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -5, backgroundColor: '#3b82f6', color: '#fff' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onViewDetails(product)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white py-5 rounded-[1.5rem] flex items-center justify-center gap-4 transition-all border border-slate-200 dark:border-slate-700 group"
                >
                  <Eye size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">{t('full_details') || 'Full Details'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default QuickViewModal;
