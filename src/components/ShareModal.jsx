import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Check, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

export default function ShareModal({ isOpen, onClose, product, showToast }) {
  const { lang } = useLanguage();
  const { settings } = useStore();
  const [copied, setCopied] = useState(false);

  // Auto reset copied status after 2 seconds
  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!isOpen || !product) return null;

  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
  const cleanOrigin = window.location.origin.includes('localhost') 
    ? 'https://swto.site' 
    : window.location.origin;
    
  // Standard product URL that WhatsApp scraper can read og:tags from
  const shareUrl = `${cleanOrigin}/product/${product.id}`;
  
  // Format price & description for WhatsApp
  const priceFormatted = product.price ? `\n🏷️ *Prix :* ${Number(product.price).toLocaleString()} ${currencySymbol}` : '';
  const categoryText = product.category ? `\n📂 *Catégorie :* ${product.category}` : '';
  
  // WhatsApp Share Message - Single clean URL at the very end to guarantee Status link preview
  const whatsappMessage = `🛍️ *${product.name.toUpperCase()}*${priceFormatted}${categoryText}\n\n👉 Découvrez cet article premium sur SWEETO :\n${shareUrl}`;

  const handleWhatsAppShare = () => {
    // Standard direct WhatsApp click trigger (Status and Chats)
    const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(targetUrl, '_blank');
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        if (showToast) {
          showToast(lang === 'fr' ? 'Lien copié dans le presse-papiers !' : 'Link copied to clipboard!', 'success');
        }
      })
      .catch(() => {
        if (showToast) {
          showToast(lang === 'fr' ? 'Échec de la copie' : 'Failed to copy link', 'error');
        }
      });
  };

  const handleSystemShare = () => {
    // Clean data payload for other platforms
    const shareData = {
      title: product.name,
      text: lang === 'fr' ? `Découvrez ${product.name} sur SWEETO !` : `Check out ${product.name} on SWEETO!`,
      url: shareUrl,
    };

    if (navigator.share) {
      navigator.share(shareData)
        .then(() => onClose())
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5, scale: 1 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0.5 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[2rem] sm:rounded-[2rem] border border-slate-150 dark:border-slate-800 shadow-2xl p-6 overflow-hidden z-10 flex flex-col gap-5 text-left"
        >
          {/* Top handle bar on mobile */}
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-2 mb-1" onClick={onClose} />

          {/* Modal Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider">
              {lang === 'fr' ? 'Partager ce produit' : 'Share this product'}
            </h3>
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-all cursor-pointer border-none"
            >
              <X size={16} />
            </button>
          </div>

          {/* Product Quick Details */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800">
            <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shrink-0">
              <img 
                src={product.image_url || product.image || '/hero-banner.png'} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-slate-800 dark:text-white text-sm truncate uppercase tracking-tight">{product.name}</h4>
              <span className="text-xs font-black text-[#1F6FEB] mt-0.5 block">
                {Number(product.price).toLocaleString()} {currencySymbol}
              </span>
            </div>
          </div>

          {/* Share Action Grid */}
          <div className="flex flex-col gap-3">
            {/* WhatsApp Status and Chat Share Button (Brand Green) */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="w-full py-4 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 border-none cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              <MessageSquare size={18} fill="currentColor" />
              <span>{lang === 'fr' ? 'Partager sur WhatsApp' : 'Share to WhatsApp'}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              {/* Copy link button (Brand Royal Blue) */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-4 bg-[#1F6FEB]/10 hover:bg-[#1F6FEB]/18 text-[#1F6FEB] dark:text-blue-400 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-98"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier le lien' : 'Copy Link')}</span>
              </button>

              {/* Standard browser share button (Slate color) */}
              <button
                type="button"
                onClick={handleSystemShare}
                className="py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-none cursor-pointer active:scale-98"
              >
                <Share2 size={16} />
                <span>{lang === 'fr' ? 'Autres options' : 'More Options'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Status compatibility note */}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-bold italic">
            {lang === 'fr' 
              ? '✨ Parfaitement optimisé pour afficher l’aperçu d’image sur votre statut WhatsApp.'
              : '✨ Formatted to show the rich image preview on your WhatsApp status.'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
