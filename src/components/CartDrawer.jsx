import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Check, ChevronDown, Hourglass, MapPin, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import cartEmptyMascot from '../assets/cart_empty_mascot.png';

const CartDrawer = ({ isOpen, onClose }) => {
  const { settings } = useStore();
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const { showToast } = useStore();
  const navigate = useNavigate();

  const handleGoToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      showToast("Your cart is already empty!", "info");
      return;
    }
    if (window.confirm("Clear all items from your cart? 🗑️")) {
      clearCart();
      showToast("Cart cleared!", "info");
    }
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

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
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-white/50 dark:bg-slate-900/30 z-10">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-800 dark:text-white"
                >
                  <ArrowLeft size={22} />
                </button>
                <h2 className="text-[17px] font-black text-slate-900 dark:text-white uppercase italic tracking-tight">
                  Cart ({totalItemsCount})
                </h2>
              </div>
              
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-405 bg-slate-100 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-slate-200/30 dark:border-white/5 shadow-sm">
                  <MapPin size={12} className="text-[#e61e25]" />
                  <span>Cote D'Ivoire</span>
                </div>
                <button 
                  onClick={() => {
                    onClose();
                    navigate('/wishlist');
                  }}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Wishlist"
                >
                  <Heart size={20} />
                </button>
                <button 
                  onClick={handleClearCart}
                  className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Clear Cart"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-6 sm:space-y-8 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {cartItems.length === 0 && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center p-8 w-full"
                  >
                    {/* Mascot Illustration */}
                    <div className="w-48 h-48 mb-6 flex items-center justify-center">
                      <img 
                        src={cartEmptyMascot} 
                        alt="Empty Cart" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <h3 className="text-[17px] font-black text-slate-800 dark:text-white mb-2 uppercase italic tracking-tight">
                      {t('empty_cart') || 'Your cart is empty'}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mb-6 max-w-[240px]">
                      {t('select_gear') || 'Find premium products and fill your cart!'}
                    </p>
                    
                    {/* Go shopping action button */}
                    <button 
                      onClick={onClose}
                      className="px-10 py-3 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-sm rounded-full transition-all shadow-lg shadow-red-500/10 hover:scale-[1.03] active:scale-[0.97] cursor-pointer uppercase tracking-wider"
                    >
                      {t('go_shopping') || 'Go shopping'}
                    </button>
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
              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] flex justify-between items-center shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-20">
                {/* Left: Checked select all */}
                <div className="flex items-center gap-2 select-none">
                  <div className="w-5 h-5 rounded-full bg-[#e61e25] flex items-center justify-center text-white shadow-sm shadow-red-500/20">
                    <Check size={12} strokeWidth={3.5} />
                  </div>
                  <span className="text-[12px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">All</span>
                </div>

                {/* Middle: Pricing & Savings */}
                <div className="flex flex-col items-end pr-2">
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => showToast("Free delivery local handling active 🚀", "info")}>
                    <span className="font-extrabold text-[15px] text-slate-900 dark:text-white tracking-tight leading-none">
                      {settings?.currency || 'XOF'} {cartTotal.toLocaleString()}
                    </span>
                    <ChevronDown size={14} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  <span className="text-[9px] font-black text-[#e61e25] mt-1 tracking-tight">
                    Saved: {settings?.currency || 'XOF'} {Math.round(cartTotal * 0.15).toLocaleString()}
                  </span>
                </div>

                {/* Right: Checkout button & urgency indicator */}
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={handleGoToCheckout}
                    className="px-6 py-2.5 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-[13px] rounded-full transition-all shadow-md shadow-red-500/10 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                  >
                    Checkout ({totalItemsCount})
                  </button>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#e61e25] uppercase tracking-wide">
                    <Hourglass size={10} className="animate-pulse" />
                    <span>Almost sold out!</span>
                  </div>
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
