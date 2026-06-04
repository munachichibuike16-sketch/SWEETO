import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const CartDrawer = ({ isOpen, onClose }) => {
  const { settings } = useStore();
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();

  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-6 z-[300]"
          />

          {/* Drawer */}
          <motion.aside 
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.1)] dark:shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.6)] z-[310] flex flex-col border-l border-slate-100 dark:border-slate-800/80 overflow-hidden`}
          >
            {/* Faint Watermark Background */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden z-0">
              <span className="text-[5rem] sm:text-[7rem] font-black tracking-[0.2em] text-slate-900/[0.02] dark:text-white/[0.01] uppercase italic -rotate-12">
                @sweeto
              </span>
            </div>

            {/* Header */}
            <div className="p-6 sm:p-10 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-white/50 dark:bg-slate-900/30 z-10">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-eas-blue p-3 rounded-2xl shadow-xl shadow-eas-blue/30"
                >
                  <ShoppingBag className="text-white" size={24} />
                </motion.div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mb-1">
                    {t('your_cart')}
                  </h2>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cartItems.length} {t('premium_items')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ rotate: 90, backgroundColor: '#f8fafc' }}
                onClick={onClose} 
                className="p-3 rounded-2xl transition-all text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {cartItems.length === 0 && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8"
                  >
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-slate-800 shadow-inner">
                      <ShoppingBag size={36} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase italic mb-2 tracking-tighter">{t('empty_cart')}</h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-600 mb-6">{t('select_gear')}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 italic max-w-xs leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 w-full">
                      « Elite Local Commerce • Managed by @sweeto »
                    </p>
                  </motion.div>
                )}

                {cartItems.map((item, i) => (
                  <motion.div 
                    key={item.id} 
                    layout
                    initial={{ x: isRTL ? -50 : 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: isRTL ? -50 : 50, opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-4 sm:gap-6 p-4 sm:p-6 bg-white/50 dark:bg-slate-900/50 rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-850 group hover:shadow-xl hover:shadow-slate-900/5 transition-all"
                  >
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-3 shadow-sm group-hover:scale-105 transition-transform shrink-0">
                      <img src={item.image_url || item.image || '/hero-banner.png'} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div className="flex justify-between items-start gap-2 sm:gap-4">
                        <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase italic tracking-tighter leading-tight group-hover:text-eas-blue transition-colors line-clamp-2">{item.name}</h4>
                        <motion.button 
                          whileHover={{ scale: 1.2, color: '#ef4444' }}
                          onClick={() => removeFromCart(item.id)} 
                          className="text-slate-350 dark:text-slate-500 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]" />
                        </motion.button>
                      </div>
                      <div className="flex justify-between items-center mt-3 sm:mt-4 gap-2">
                        <span className="font-black text-eas-blue dark:text-blue-400 text-sm sm:text-lg italic tracking-tighter leading-none">{settings?.currency || 'FCFA'} {item.price?.toLocaleString()}</span>
                        <div className="flex items-center gap-3 sm:gap-4 bg-white dark:bg-slate-950 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-sm shrink-0">
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-300 hover:text-eas-blue transition-colors">
                            <Minus className="w-[10px] h-[10px] sm:w-[14px] sm:h-[14px]" strokeWidth={3} />
                          </motion.button>
                          <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white min-w-[15px] sm:min-w-[20px] text-center italic">{item.quantity}</span>
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-300 hover:text-eas-blue transition-colors">
                            <Plus className="w-[10px] h-[10px] sm:w-[14px] sm:h-[14px]" strokeWidth={3} />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Footer / Checkout Area */}
            {cartItems.length > 0 && (
              <div className="p-6 sm:p-10 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-6 sm:space-y-8 rounded-t-[2.5rem] sm:rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_-20px_50px_rgba(0,0,0,0.3)]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <span>{t('subtotal')}</span>
                    <span className="text-slate-900 dark:text-white italic">{settings?.currency || 'FCFA'} {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <span>{t('local_handling')}</span>
                    <span className="text-green-500 font-black italic">{t('gratis')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-[0.3em] italic">{t('total')}</span>
                    <span className="text-eas-blue dark:text-blue-400 font-black text-3xl italic tracking-tighter leading-none">{settings?.currency || 'FCFA'} {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#3B82F6' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToCheckout}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.3em] flex items-center justify-center gap-3 sm:gap-4 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all group"
                  >
                    <CreditCard className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px]" strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                    {t('checkout')}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
