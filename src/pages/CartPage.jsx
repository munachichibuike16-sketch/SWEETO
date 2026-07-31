import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { QuantityControl, ContinueShoppingButton } from '../components/CheckoutShared';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { settings } = useStore();
  const { t, lang } = useLanguage();

  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
  
  // Transport fee logic (just a default representation here, dynamic on checkout)
  const transportFee = 1500;
  
  // Example shipping logic (free over a certain amount, or base fee)
  const shipping = cartTotal > 50000 ? 0 : 0; // Usually calculated at checkout based on location
  const total = cartTotal + shipping + transportFee;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {lang === 'fr' ? 'Votre Panier' : 'Your Cart'}
          </h1>
          <p className="text-slate-500 mt-2">
            {lang === 'fr' ? 'Vérifiez vos articles avant de passer à la caisse' : 'Review your items before checkout'}
          </p>
        </div>
        <ContinueShoppingButton 
          onClick={() => navigate('/')} 
          text={lang === 'fr' ? 'Continuer vos achats' : 'Continue Shopping'}
        />
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900">
            {lang === 'fr' ? 'Votre panier est vide' : 'Your cart is empty'}
          </h2>
          <p className="text-slate-500 mt-2">
            {lang === 'fr' ? 'Ajoutez quelques articles pour commencer' : 'Add some items to get started'}
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div
                  key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="bg-white rounded-2xl border border-slate-200 p-4 md:p-6 flex gap-4 md:gap-6 shadow-sm"
                >
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-slate-50 overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                    <img src={item.image_url || item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {item.category && (
                          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">{item.category}</p>
                        )}
                        <h3 className="text-lg font-semibold text-slate-900 truncate">{item.name}</h3>
                        
                        <div className="flex gap-2 mt-1">
                          {item.selectedColor && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                              <span className="w-3 h-3 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: item.selectedColor.hex || item.selectedColor }} />
                              {item.selectedColor.name || item.selectedColor}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 text-xs text-slate-600 font-medium">
                              {lang === 'fr' ? 'Taille' : 'Size'}: {item.selectedSize}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <QuantityControl 
                        value={item.quantity} 
                        onChange={(q) => updateQuantity(item.id, q, item.selectedColor, item.selectedSize)} 
                      />
                      <p className="text-xl font-bold text-slate-900">
                        {currencySymbol} {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                {lang === 'fr' ? 'Résumé de la commande' : 'Order Summary'}
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{lang === 'fr' ? 'Sous-total' : 'Subtotal'}</span>
                  <span className="font-medium text-slate-900">{currencySymbol} {cartTotal.toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-slate-200 my-3" />
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-semibold text-slate-900">Total</span>
                  <span className="text-2xl font-bold text-slate-900">{currencySymbol} {cartTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5"
              >
                {lang === 'fr' ? 'Passer à la caisse' : 'Proceed to Checkout'}
              </button>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-3 text-center">
                  {lang === 'fr' ? 'Paiement Sécurisé' : 'Secure Payment'}
                </p>
                <div className="flex justify-center gap-3 opacity-60">
                  <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">WAVE</div>
                  <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">VISA</div>
                  <div className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-700">MC</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
