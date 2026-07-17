import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const names = ['Yao', 'Aminata', 'Koffi', 'Adama', 'Fatou', 'Mamadou', 'Marie', 'Cheick', 'Awa', 'Gilles', 'Konan', 'Salimata'];
const locations = ['Cocody', 'Marcory', 'Yopougon', 'Plateau', 'Riviera', 'Angré', 'Treichville', 'Yamoussoukro', 'Bouaké', 'San Pédro', 'Grand-Bassam'];

export default function SalesPopupNotifier() {
  const { products, settings } = useStore();
  const { lang } = useLanguage();
  const [currentPopup, setCurrentPopup] = useState(null);

  useEffect(() => {
    // Wait 15 seconds before showing the first popup, then cycle every 45 seconds
    const initialDelay = setTimeout(triggerRandomPopup, 15000);
    const interval = setInterval(triggerRandomPopup, 45000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [products]);

  const triggerRandomPopup = () => {
    if (!products || products.length === 0) return;

    // Pick a random product
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    // Pick random name & location
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const timeAgoVal = Math.floor(Math.random() * 5) + 1; // 1 to 5 min ago

    setCurrentPopup({
      name: randomName,
      location: randomLocation,
      product: randomProduct,
      timeAgo: timeAgoVal
    });

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setCurrentPopup(null);
    }, 6000);
  };

  if (!currentPopup) return null;

  const currency = settings?.currency || 'FCFA';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="fixed bottom-24 left-6 z-[95] max-w-sm w-[280px] bg-slate-900/90 dark:bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center gap-3.5 shadow-xl select-none"
      >
        {/* Product Thumbnail */}
        <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-white/5">
          <img 
            src={currentPopup.product.image_url || currentPopup.product.image || '/hero-banner.png'} 
            alt={currentPopup.product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Text Details */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider truncate">
              {lang === 'fr' ? 'Achat récent 🔥' : 'Recent purchase 🔥'}
            </span>
            <span className="text-[8px] text-slate-500 whitespace-nowrap">
              {currentPopup.timeAgo}m ago
            </span>
          </div>
          <p className="text-[11px] font-bold text-white truncate mt-0.5">
            {currentPopup.name} ({currentPopup.location})
          </p>
          <p className="text-[10px] text-slate-400 truncate font-semibold">
            {lang === 'fr' ? 'a acheté' : 'bought'} {currentPopup.product.name}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setCurrentPopup(null)}
          className="text-slate-500 hover:text-slate-300 p-0.5 shrink-0 bg-transparent border-none cursor-pointer"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
