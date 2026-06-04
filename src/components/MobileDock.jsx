import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function MobileDock({ setIsCartOpen, setIsSidebarOpen }) {
  const { cartCount } = useCart();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [bounce, setBounce] = useState(false);

  // Trigger bounce animation whenever cartCount changes
  useEffect(() => {
    if (cartCount > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const handleProfileClick = () => {
    const session = localStorage.getItem('sweetohub_session');
    if (session) {
      navigate('/auth');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] md:hidden w-[90%] max-w-sm h-16 bg-white/85 dark:bg-slate-950/80 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between px-6 overflow-hidden select-none">
      {/* Faint Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[2.2rem] font-black tracking-[0.2em] text-slate-900/5 dark:text-white/3 uppercase italic">
          @sweeto
        </span>
      </div>

      {/* Navigation Items */}
      <button 
        onClick={() => navigate('/')}
        className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-eas-blue dark:hover:text-cyan-400 transition-colors z-10"
      >
        <Home size={18} />
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Home</span>
      </button>

      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-eas-blue dark:hover:text-cyan-400 transition-colors z-10"
      >
        <Package size={18} />
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Shop</span>
      </button>

      <button 
        onClick={() => setIsCartOpen(true)}
        className="relative flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-eas-blue dark:hover:text-cyan-400 transition-colors z-10"
      >
        <motion.div
          animate={bounce ? { y: [0, -10, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <ShoppingCart size={18} />
        </motion.div>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white font-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-red-500/35 animate-pulse">
            {cartCount}
          </span>
        )}
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Cart</span>
      </button>

      <button 
        onClick={handleProfileClick}
        className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 hover:text-eas-blue dark:hover:text-cyan-400 transition-colors z-10"
      >
        <User size={18} />
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Profile</span>
      </button>
    </div>
  );
}
