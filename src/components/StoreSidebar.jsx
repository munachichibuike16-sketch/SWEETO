import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Heart, LayoutGrid, ChevronRight, Info, FileText, Shield, RefreshCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const StoreSidebar = ({ isOpen, onClose, onCategoryClick }) => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  // Prevent background scrolling when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = [
    {
      id: 'my-order',
      label: lang === 'fr' ? 'Mes Commandes' : 'MY ORDER',
      icon: <Package size={20} />,
      onClick: () => {
        navigate('/orders');
        onClose();
      }
    },
    {
      id: 'wishlist',
      label: lang === 'fr' ? 'Liste de Souhaits' : 'WISHLIST',
      icon: <Heart size={20} />,
      onClick: () => {
        navigate('/wishlist');
        onClose();
      }
    },
    {
      id: 'category',
      label: lang === 'fr' ? 'Catégories' : 'CATEGORY',
      icon: <LayoutGrid size={20} />,
      onClick: () => {
        onClose();
        if (onCategoryClick) onCategoryClick();
      }
    },
    {
      id: 'about',
      label: lang === 'fr' ? 'À Propos' : 'ABOUT US',
      icon: <Info size={20} />,
      onClick: () => {
        navigate('/visit');
        onClose();
      }
    },
    {
      id: 'terms',
      label: lang === 'fr' ? 'Conditions' : 'TERMS',
      icon: <FileText size={20} />,
      onClick: () => {
        navigate('/terms');
        onClose();
      }
    },
    {
      id: 'privacy',
      label: lang === 'fr' ? 'Confidentialité' : 'PRIVACY',
      icon: <Shield size={20} />,
      onClick: () => {
        navigate('/privacy');
        onClose();
      }
    },
    {
      id: 'refund',
      label: lang === 'fr' ? 'Remboursement' : 'REFUND',
      icon: <RefreshCcw size={20} />,
      onClick: () => {
        navigate('/refund');
        onClose();
      }
    }
  ];

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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200]"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white dark:bg-[#0B0F19] shadow-2xl z-[201] flex flex-col border-r border-slate-100 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#0a0d16]">
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">
                {lang === 'fr' ? 'Mon Magasin' : 'My Store'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="flex flex-col gap-1 mt-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-[#2563EB] dark:hover:text-blue-400 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 group-hover:border-blue-100 dark:group-hover:border-blue-800/50 transition-all">
                        {item.icon}
                      </div>
                      <span className="text-[13px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-[#2563EB] dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StoreSidebar;
