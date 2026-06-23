import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

export default function MobileDock({ setIsCartOpen, setIsSidebarOpen }) {
  const { cartCount } = useCart();
  const { lang } = useLanguage();
  const { products } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [bounce, setBounce] = useState(false);

  const currentPath = location.pathname;
  const isHome = currentPath === '/';
  const isShop = currentPath === '/products' || currentPath.startsWith('/category');
  const isNotif = currentPath === '/notifications';
  const isCart = currentPath === '/checkout';
  const isProfile = ['/auth', '/login', '/register', '/settings'].includes(currentPath);



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


  const handleShopClick = () => {
    if (setIsSidebarOpen && (currentPath === '/' || currentPath.startsWith('/category'))) {
      setIsSidebarOpen(true);
    } else {
      navigate('/products');
    }
  };

  const handleCartClick = () => {
    if (isCart) {
      return;
    }
    if (setIsCartOpen && (currentPath === '/' || currentPath.startsWith('/category') || currentPath === '/products' || isProfile || isNotif)) {
      setIsCartOpen(true);
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] md:hidden w-[95%] max-w-md h-16 bg-white/75 dark:bg-[#020617]/75 backdrop-blur-xl border border-slate-200/50 dark:border-eas-blue/15 rounded-3xl shadow-[0_20px_50px_rgba(0,82,255,0.05)] flex items-center justify-between px-5 overflow-hidden select-none">
      {/* Faint Watermark Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <span className="text-[2.2rem] font-black tracking-[0.2em] text-slate-900/5 dark:text-white/3 uppercase italic">
          @sweeto
        </span>
      </div>

      {/* Navigation Items */}
      {/* Home tab */}
      <button 
        onClick={() => navigate('/')}
        className={`flex flex-col items-center justify-center transition-all duration-300 z-10 ${
          isHome 
            ? 'text-eas-blue dark:text-blue-450 font-black scale-105 drop-shadow-[0_0_8px_rgba(0,82,255,0.15)]' 
            : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
        }`}
      >
        <Home size={17} strokeWidth={isHome ? 2.5 : 1.5} />
        <span className="text-[8px] uppercase tracking-widest mt-1">Home</span>
      </button>



      {/* Shop tab */}
      <button 
        onClick={handleShopClick}
        className={`flex flex-col items-center justify-center transition-all duration-300 z-10 ${
          isShop 
            ? 'text-eas-blue dark:text-blue-450 font-black scale-105 drop-shadow-[0_0_8px_rgba(0,82,255,0.15)]' 
            : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
        }`}
      >
        <Package size={17} strokeWidth={isShop ? 2.5 : 1.5} />
        <span className="text-[8px] uppercase tracking-widest mt-1">Shop</span>
      </button>

      {/* Cart tab */}
      <button 
        onClick={handleCartClick}
        className={`relative flex flex-col items-center justify-center transition-all duration-300 z-10 ${
          isCart 
            ? 'text-eas-blue dark:text-blue-450 font-black scale-105 drop-shadow-[0_0_8px_rgba(0,82,255,0.15)]' 
            : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
        }`}
      >
        <motion.div
          animate={bounce ? { y: [0, -10, 0], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <ShoppingCart size={17} strokeWidth={isCart ? 2.5 : 1.5} />
        </motion.div>
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-eas-blue text-white font-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-eas-blue/35 leading-none">
            {cartCount}
          </span>
        )}
        <span className="text-[8px] uppercase tracking-widest mt-1">Cart</span>
      </button>

      {/* Profile tab */}
      <button 
        onClick={handleProfileClick}
        className={`flex flex-col items-center justify-center transition-all duration-300 z-10 ${
          isProfile 
            ? 'text-eas-blue dark:text-blue-450 font-black scale-105 drop-shadow-[0_0_8px_rgba(0,82,255,0.15)]' 
            : 'text-slate-500 dark:text-slate-400 hover:text-eas-blue'
        }`}
      >
        <User size={17} strokeWidth={isProfile ? 2.5 : 1.5} />
        <span className="text-[8px] uppercase tracking-widest mt-1">Profile</span>
      </button>
    </div>
  );
}
