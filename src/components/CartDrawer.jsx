import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, Check, ChevronDown, Hourglass, MapPin, Heart, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import cartEmptyMascot from '../assets/cart_empty_mascot.png';
import ProductCard from './ProductCard';

const CartDrawer = ({ isOpen, onClose }) => {
  const { settings, showToast, openGlobalLightbox, products } = useStore();
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const { t, isRTL } = useLanguage();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));

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
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="text-indigo-600 dark:text-indigo-400 animate-pulse" size={20} />
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Your Shopping Cart
                </h2>
              </div>
              
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border-none font-bold text-base"
              >
                ✕
              </button>
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
                  <div className="space-y-4 text-left">
                    {cartItems.map((item, i) => (
                      <motion.div 
                        key={item.id} 
                        layout
                        initial={{ x: isRTL ? -30 : 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? -30 : 30, opacity: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm items-center relative group"
                      >
                        {/* Product Image */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onClose();
                            navigate(`/product/${item.id}`);
                          }}
                          className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-xl flex items-center justify-center p-2 shrink-0 cursor-pointer overflow-hidden border border-slate-100 dark:border-slate-800/60"
                        >
                          <img 
                            src={item.image_url || item.image || '/hero-banner.png'} 
                            alt={item.name} 
                            className="w-full h-full object-contain" 
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate mb-1">
                            {item.name}
                          </h4>
                          <span className="font-extrabold text-indigo-655 dark:text-indigo-400 text-xs sm:text-sm block mb-2">
                            {currencySymbol} {item.price?.toLocaleString()}
                          </span>
                          
                          {/* Stepper */}
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer bg-transparent"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-slate-805 dark:text-white w-4 text-center">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer bg-transparent"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Delete Trash Button */}
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none shrink-0"
                          title="Remove from cart"
                        >
                          <Trash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>

              {/* More to Love Recommendations */}
              {(() => {
                const moreToLove = (products || [])
                  .filter(p => !cartItems.some(item => item.id === p.id))
                  .slice(0, 4);
                
                if (moreToLove.length === 0) return null;
                
                return (
                  <div className="mt-8 select-none">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1 h-3 bg-[#e61e25] rounded-full" />
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        More to Love
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {moreToLove.map((p, idx) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          index={idx}
                          onProductClick={(prod) => {
                            onClose();
                            navigate(`/product/${prod.id}`);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer / Checkout Area */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] flex flex-col gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-20 text-left">
                {/* Row 1: Subtotal */}
                <div className="flex justify-between items-center select-none">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {currencySymbol} {cartTotal.toLocaleString()}
                  </span>
                </div>

                {/* Row 2: Helper shipping tip */}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold select-none leading-none mt-[-4px]">
                  Taxes and shipping calculated at checkout stage.
                </p>

                {/* Row 3: Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <button 
                    onClick={handleClearCart}
                    className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 font-extrabold text-[11px] uppercase tracking-wider rounded-2xl transition-all cursor-pointer border-none shadow-sm active:scale-95"
                  >
                    Clear Cart
                  </button>
                  
                  <button 
                    onClick={handleGoToCheckout}
                    className="flex-[1.2] py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer border-none flex items-center justify-center gap-1.5"
                  >
                    <span>Checkout</span>
                    <span>➔</span>
                  </button>
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
