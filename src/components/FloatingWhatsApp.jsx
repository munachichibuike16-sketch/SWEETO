import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export default function FloatingWhatsApp() {
  const { settings } = useStore();
  const phone = settings?.social_whatsapp ? settings.social_whatsapp.replace(/\D/g, '') : '2250500619923';
  
  const handleClick = () => {
    const message = `Bonjour Sweeto-Hub, je souhaite passer une commande ou obtenir des informations sur vos produits.`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className="fixed bottom-24 right-6 sm:bottom-6 sm:right-6 z-[90] p-3.5 sm:p-4 bg-[#25D366] text-white shadow-[0_10px_35px_rgba(37,211,102,0.45)] rounded-full hover:bg-[#20ba5a] cursor-pointer flex items-center justify-center group"
      aria-label="Order on WhatsApp"
    >
      <div className="absolute inset-0 bg-[#25D366]/25 rounded-full blur-md animate-ping pointer-events-none" />
      <MessageCircle size={22} fill="currentColor" className="relative z-10" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-black text-[9px] sm:text-[10px] uppercase tracking-widest leading-none whitespace-nowrap relative z-10">
        WhatsApp
      </span>
    </motion.button>
  );
}
