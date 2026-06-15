import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Check, ChevronDown, Hourglass, MapPin, Heart, AlertTriangle } from 'lucide-react';
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
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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
    setShowClearConfirm(true);
  };

  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const shippingFee = cartItems.length > 0 ? 1500 : 0;
  const grandTotal = cartTotal + shippingFee;

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

                {cartItems.length > 0 && (
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800/80 p-4 sm:p-5 shadow-sm space-y-4">
                    {/* Store Header */}
                    <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/40 select-none">
                      <div className="w-[18px] h-[18px] rounded-full bg-[#e61e25] flex items-center justify-center text-white shadow-sm shrink-0">
                        <Check size={11} strokeWidth={4} />
                      </div>
                      <span className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-tight italic">
                        Sweeto Official Store
                      </span>
                    </div>

                    {/* Products List */}
                    <div className="space-y-4">
                      {cartItems.map((item, i) => (
                        <motion.div 
                          key={item.id} 
                          layout
                          initial={{ x: isRTL ? -30 : 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: isRTL ? -30 : 30, opacity: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-white/70 dark:bg-slate-900/40 rounded-[1.2rem] sm:rounded-[1.5rem] border border-slate-100 dark:border-slate-850/60 group hover:shadow-md transition-all items-stretch"
                        >
                          {/* Checked selection icon on the far left */}
                          <div className="flex items-center justify-center pr-1 select-none">
                            <div className="w-[18px] h-[18px] rounded-full bg-[#e61e25] flex items-center justify-center text-white shadow-sm shrink-0">
                              <Check size={11} strokeWidth={4} />
                            </div>
                          </div>

                          {/* Product Image */}
                          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 rounded-xl sm:rounded-2xl flex items-center justify-center p-2 sm:p-3 shadow-sm group-hover:scale-102 transition-transform shrink-0">
                            <img src={item.image_url || item.image || '/hero-banner.png'} alt="" className="w-full h-full object-contain mix-blend-multiply" />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase italic tracking-tighter leading-tight group-hover:text-[#e61e25] transition-colors line-clamp-2 mb-1">{item.name}</h4>
                              
                              {/* Variant specification box */}
                              <div className="inline-block text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/20 dark:border-white/5 mb-1.5">
                                Category: {item.category || 'Official'} • Official Warranty
                              </div>
                              
                              {/* Paid shipping status */}
                              <div className="text-[10px] font-black text-[#e61e25] tracking-wide mb-2 uppercase italic">
                                Shipping: {settings?.currency || 'XOF'} 1,500
                              </div>
                            </div>

                            {/* Bottom row containing the price on the left and the stepper + trash delete button on the right */}
                            <div className="flex justify-between items-center gap-2 mt-auto">
                              <span className="font-black text-slate-950 dark:text-white text-sm sm:text-base italic tracking-tighter leading-none">{settings?.currency || 'XOF'} {item.price?.toLocaleString()}</span>
                              
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Stepper */}
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-2 py-1 rounded-lg border border-slate-150 dark:border-slate-800/80 shadow-sm">
                                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-slate-400 hover:text-[#e61e25] transition-colors cursor-pointer">
                                    <Minus className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px]" strokeWidth={3} />
                                  </motion.button>
                                  <span className="text-[10px] sm:text-xs font-black text-slate-900 dark:text-white min-w-[12px] text-center italic">{item.quantity}</span>
                                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-slate-400 hover:text-[#e61e25] transition-colors cursor-pointer">
                                    <Plus className="w-[10px] h-[10px] sm:w-[12px] sm:h-[12px]" strokeWidth={3} />
                                  </motion.button>
                                </div>

                                {/* Trash button */}
                                <motion.button 
                                  whileHover={{ scale: 1.1, color: '#ef4444' }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeFromCart(item.id)} 
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                  title="Remove from cart"
                                >
                                  <Trash2 className="w-[15px] h-[15px] sm:w-[16px] sm:h-[16px]" />
                                </motion.button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center gap-1 cursor-pointer" onClick={() => showToast(`Total includes ${settings?.currency || 'XOF'} 1,500 shipping fee 📦`, "info")}>
                    <span className="font-extrabold text-[15px] text-slate-900 dark:text-white tracking-tight leading-none">
                      {settings?.currency || 'XOF'} {grandTotal.toLocaleString()}
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

          {/* Custom Confirmation Modal */}
          <AnimatePresence>
            {showClearConfirm && (
              <>
                {/* Overlay Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowClearConfirm(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[320]"
                />

                {/* Modal Container */}
                <div className="fixed inset-0 z-[330] flex items-center justify-center p-4 pointer-events-none">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-[2rem] p-6 shadow-2xl text-center pointer-events-auto border border-slate-100 dark:border-slate-800"
                  >
                    {/* Warning Icon */}
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-[#e61e25]">
                      <Trash2 size={24} />
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase italic tracking-tight mb-2">
                      Clear your cart?
                    </h3>
                    
                    {/* Subtitle */}
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto mb-6 leading-relaxed">
                      Are you sure you want to clear all items from your cart? This action cannot be undone. 🗑️
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 font-black text-[11px] uppercase tracking-wider rounded-full transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          clearCart();
                          setShowClearConfirm(false);
                          showToast("Cart cleared! 🗑️", "success");
                        }}
                        className="flex-1 py-3 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-[11px] uppercase tracking-wider rounded-full shadow-lg shadow-red-500/10 transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
