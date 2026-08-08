import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Check, Copy, User, Banknote, Clock, MessageCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

export default function OrderNotificationFlow({ order, onClose }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { settings } = useStore();

  const [showToast, setShowToast] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (order) {
      setShowToast(true);
    }
  }, [order]);

  if (!order) return null;

  const orderId = order.id ? (String(order.id).startsWith('ORD-') ? order.id : `ORD-${order.id}`) : 'ORD-00000';
  const customerName = order.customer_name || order.customerName || order.name || 'Customer';
  const customerPhone = order.customer_phone || order.phone || order.phoneNumber || '';
  const customerAddress = order.address || order.shipping_address || (order.city ? `${order.city}, ${order.address || ''}` : 'Address Provided');
  const currency = order.currency || settings?.currency || 'FCFA';
  const totalAmount = order.total_amount || order.total || 0;
  
  // Format items
  let rawItems = order.items || [];
  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch (e) {
      rawItems = [];
    }
  }
  const items = Array.isArray(rawItems) ? rawItems : [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const formattedDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToastClick = () => {
    setShowToast(false);
    setShowModal(true);
  };

  const handleWhatsAppContact = (e) => {
    e.stopPropagation();
    const phone = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || "2250500619923";
    const text = encodeURIComponent(
      `Hello SWEETO-HUB, I would like to inquire about my order ${orderId} placed on ${formattedDate}. Total: ${currency} ${Number(totalAmount).toLocaleString()}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <>
      {/* 1. FLOATING TOAST NOTIFICATION (IMAGE 1) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={handleToastClick}
            className="fixed top-5 right-4 md:right-8 z-[9999] max-w-md w-[calc(100vw-32px)] bg-white dark:bg-[#0B132B] rounded-2xl p-4 shadow-2xl border border-slate-150 dark:border-slate-800 flex items-start gap-3.5 cursor-pointer hover:shadow-blue-500/10 hover:border-[#1F6FEB]/40 transition-all group"
          >
            {/* Mint Green Shopping Bag Icon */}
            <div className="w-11 h-11 rounded-full bg-[#E6F8F0] dark:bg-[#064e3b]/30 flex items-center justify-center text-[#10B981] shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingBag size={20} className="fill-[#10B981]" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-sm leading-snug">
                <span>✅</span>
                <span className="truncate">Order {orderId} Placed</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {lang === 'fr' 
                  ? `Merci ${customerName} ! Votre commande ${orderId} d'un montant de ${currency} ${Number(totalAmount).toLocaleString()} a été enregistrée.` 
                  : `Thank you ${customerName}! Your order ${orderId} totaling ${currency} ${Number(totalAmount).toLocaleString()} has been placed.`}
              </p>
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5">
                {lang === 'fr' ? "À l'instant • Cliquez pour voir les détails" : 'Just now • Tap to view details'}
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowToast(false);
                if (onClose) onClose();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. ORDER CONFIRMATION / DETAILS MODAL (IMAGE 2) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="bg-white dark:bg-[#0E172A] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag Pill Handle */}
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

              {/* Header */}
              <div className="px-6 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {orderId}
                    </h2>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className="p-1 rounded-md text-[#1F6FEB] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      title="Copy Order ID"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                    📅 {formattedDate}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/60">
                      • ⏳ Pending
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (onClose) onClose();
                  }}
                  className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-5 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* 4-Step Progress Stepper */}
                <div className="pt-2">
                  <div className="flex items-center justify-between relative px-2">
                    {/* Connecting Background Line */}
                    <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
                    
                    {/* Step 1: Placed */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-8 h-8 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs shadow-md shadow-[#10B981]/25">
                        <Check size={16} />
                      </div>
                      <span className="text-[10px] font-extrabold text-[#10B981] mt-2 uppercase tracking-wider">
                        PLACED
                      </span>
                    </div>

                    {/* Step 2: Confirmed */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        2
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        CONFIRMED
                      </span>
                    </div>

                    {/* Step 3: Processing */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        3
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        PROCESSING
                      </span>
                    </div>

                    {/* Step 4: Done */}
                    <div className="flex flex-col items-center relative z-10">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                        4
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        DONE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Customer Details */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    <User size={14} className="text-slate-600 dark:text-slate-400" />
                    <span>CUSTOMER</span>
                  </div>
                  <div className="space-y-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    <p className="font-bold text-slate-900 dark:text-white">{customerName}</p>
                    {customerPhone && (
                      <p className="text-[#1F6FEB] font-bold">{customerPhone}</p>
                    )}
                    <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-tight">{customerAddress}</p>
                  </div>
                </div>

                {/* Section 2: Order Total */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    <Banknote size={14} className="text-slate-600 dark:text-slate-400" />
                    <span>ORDER TOTAL</span>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-[#1F6FEB] tracking-tight">
                    {currency} {Number(totalAmount).toFixed(2)}
                  </div>
                </div>

                {/* Section 3: Order Items */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    <ShoppingBag size={14} className="text-slate-600 dark:text-slate-400" />
                    <span>ORDER ITEMS ({itemCount})</span>
                  </div>
                  
                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between pt-2 first:pt-0">
                        <div className="pr-4">
                          <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                            {item.name || `Item #${idx + 1}`}
                          </p>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            {item.quantity || 1}x
                          </p>
                        </div>
                        <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                          {currency} {Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cobalt Royal Blue Continue Shopping Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    if (onClose) onClose();
                    navigate('/');
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1F6FEB] to-[#1554C0] hover:from-[#1554C0] hover:to-[#0D3C8A] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <ShoppingBag size={16} />
                  <span>{lang === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}</span>
                </button>

                {/* Emerald Green WhatsApp Contact Button */}
                <button
                  type="button"
                  onClick={handleWhatsAppContact}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageCircle size={16} />
                  <span>{lang === 'fr' ? 'Nous contacter' : 'Contact Us'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
