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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300]"
          />

          {/* Drawer */}
          <motion.aside 
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-lg bg-white/95 backdrop-blur-3xl shadow-[-50px_0_100px_-20px_rgba(0,0,0,0.1)] z-[310] flex flex-col border-l border-white/20`}
          >
            {/* Header */}
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white/50">
              <div className="flex items-center gap-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-eas-blue p-3 rounded-2xl shadow-xl shadow-eas-blue/30"
                >
                  <ShoppingBag className="text-white" size={24} />
                </motion.div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-1">
                    {t('your_cart')}
                  </h2>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cartItems.length} {t('premium_items')}</span>
                </div>
              </div>
              <motion.button 
                whileHover={{ rotate: 90, backgroundColor: '#f8fafc' }}
                onClick={onClose} 
                className="p-3 rounded-2xl transition-all text-slate-400 border border-slate-100"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {cartItems.length === 0 && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-32 h-32 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-8 text-slate-200 border border-slate-100 shadow-inner">
                      <ShoppingBag size={64} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase italic mb-2 tracking-tighter">{t('empty_cart')}</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{t('select_gear')}</p>
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
                    className="flex gap-6 p-6 bg-white/50 rounded-[2rem] border border-slate-100 group hover:shadow-xl hover:shadow-slate-900/5 transition-all"
                  >
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center p-3 shadow-sm group-hover:scale-105 transition-transform">
                      <img src={item.image_url || item.image || '/hero-banner.png'} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div className="flex justify-between items-start gap-4">
                        <h4 className="font-black text-slate-900 text-sm uppercase italic tracking-tighter leading-tight group-hover:text-eas-blue transition-colors line-clamp-2">{item.name}</h4>
                        <motion.button 
                          whileHover={{ scale: 1.2, color: '#ef4444' }}
                          onClick={() => removeFromCart(item.id)} 
                          className="text-slate-200 transition-colors"
                        >
                          <Trash2 size={18} />
                        </motion.button>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="font-black text-eas-blue text-lg italic tracking-tighter leading-none">{settings?.currency || 'FCFA'} {item.price?.toLocaleString()}</span>
                        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-300 hover:text-eas-blue transition-colors">
                            <Minus size={14} strokeWidth={3} />
                          </motion.button>
                          <span className="text-xs font-black text-slate-900 min-w-[20px] text-center italic">{item.quantity}</span>
                          <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-300 hover:text-eas-blue transition-colors">
                            <Plus size={14} strokeWidth={3} />
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
              <div className="p-10 border-t border-slate-100 bg-slate-50/50 space-y-8 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.03)]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <span>{t('subtotal')}</span>
                    <span className="text-slate-900 italic">{settings?.currency || 'FCFA'} {cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                    <span>{t('local_handling')}</span>
                    <span className="text-green-500 font-black italic">{t('gratis')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                    <span className="text-slate-900 font-black text-xs uppercase tracking-[0.3em] italic">{t('total')}</span>
                    <span className="text-eas-blue font-black text-3xl italic tracking-tighter leading-none">{settings?.currency || 'FCFA'} {cartTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <motion.button 
                    whileHover={{ scale: 1.02, backgroundColor: '#3B82F6' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoToCheckout}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl shadow-slate-900/20 active:scale-95 transition-all group"
                  >
                    <CreditCard size={20} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
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
