import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ShoppingCart, MoreVertical, Ticket, History, HelpCircle, X, Clipboard, Check } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useNavigate } from 'react-router-dom';
import couponEmptyMascot from '../assets/coupon_empty_mascot.png';

const CouponsContent = ({ onBack, onCartClick }) => {
  const { showToast } = useStore();
  const navigate = useNavigate();
  
  const [activeChip, setActiveChip] = useState('all'); // all, aliexpress, store
  const [activeFooterTab, setActiveFooterTab] = useState('coupons'); // coupons, history, help
  const [showGetCoupons, setShowGetCoupons] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Available redeemable coupons/promo codes list
  const promoCodes = [
    { code: 'SWEETO50', discount: '50% OFF', desc: 'On all custom electronics diagnostic tools', expiry: 'Exp. Dec 31, 2026' },
    { code: 'WELCOME10', discount: '10% OFF', desc: 'Sitewide discount on your first order', expiry: 'Exp. Dec 31, 2026' },
    { code: 'FREECHIP', discount: 'FREE GIFT', desc: 'Free waving chick mascot sticker with any order', expiry: 'Exp. Nov 15, 2026' },
    { code: 'IVORY225', discount: 'FREE SHIPPING', desc: 'Free express courier delivery inside Abidjan', expiry: 'Exp. Oct 31, 2026' },
  ];

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Code "${code}" copied to clipboard! 📋`, 'success');
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="w-full flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen text-slate-800 dark:text-white select-none pb-24">
      
      {/* Header Row: Black header with white icons as in reference */}
      <div className="sticky top-0 z-30 bg-black dark:bg-[#020617] text-white px-4 py-3.5 flex justify-between items-center w-full shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft size={22} />
          </button>
          <span className="text-[17px] font-black tracking-tight uppercase italic">My coupons</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onCartClick || (() => {
              showToast("Redirecting to storefront... 🛍️", "info");
              navigate('/');
            })}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ShoppingCart size={22} />
          </button>
          <button 
            onClick={() => showToast("Language Selection: French (CI) active", "info")}
            className="text-white p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <MoreVertical size={22} />
          </button>
        </div>
      </div>

      {/* Chips Row: Horizontal pills */}
      <div className="bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/5 py-3 px-4 flex gap-2.5 overflow-x-auto no-scrollbar select-none w-full">
        {[
          { id: 'all', label: 'All' },
          { id: 'aliexpress', label: 'AliExpress coupon codes' },
          { id: 'store', label: 'Store coupon codes' }
        ].map((chip) => {
          const isActive = activeChip === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setActiveChip(chip.id)}
              className={`px-5 py-2 rounded-full text-xs font-black tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer ${
                isActive 
                  ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col justify-center">
        {activeFooterTab === 'coupons' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full">
            {/* Mascot Wallet Illustration */}
            <div className="w-48 h-48 mb-6 flex items-center justify-center">
              <img 
                src={couponEmptyMascot} 
                alt="No coupons" 
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Empty message */}
            <p className="text-[14px] text-slate-400 dark:text-slate-500 font-bold mb-6">
              You haven't earned any coupons.
            </p>
            
            {/* Get coupons action button */}
            <button 
              onClick={() => setShowGetCoupons(true)}
              className="px-10 py-3 bg-[#e61e25] hover:bg-[#c9181e] text-white font-black text-sm rounded-full transition-all shadow-lg shadow-red-500/10 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
            >
              Get coupons
            </button>
          </div>
        )}

        {activeFooterTab === 'history' && (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 mb-4">
              <History size={32} />
            </div>
            <p className="text-[14px] text-slate-400 dark:text-slate-500 font-bold mb-2">
              No coupon history
            </p>
            <p className="text-[11px] text-slate-300 dark:text-slate-600 max-w-[240px]">
              You don't have any expired or used coupons in your archive.
            </p>
          </div>
        )}

        {activeFooterTab === 'help' && (
          <div className="px-6 py-8 space-y-5 text-left w-full max-w-md mx-auto">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-2">
              Coupon Help Center
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">How do I use a coupon?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Copy any active coupon code and paste it into the "Promo Code" input box during checkout to apply discount.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Can I stack coupons?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">No, you can only apply one promo/coupon code per transaction.</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">Where do I get new coupons?</h4>
                <p className="text-xs text-slate-400 leading-relaxed">Tap the "Get coupons" button to view sitewide and diagnostic promos currently active.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Bottom Sheet: Slide-up sheet to get/claim active coupons */}
      <AnimatePresence>
        {showGetCoupons && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#f8fafc] dark:bg-[#0f172a] w-full max-w-[440px] rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative text-left"
            >
              <button 
                onClick={() => setShowGetCoupons(false)}
                className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
                Claim Active Coupons
              </h3>
              
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {promoCodes.map((promo) => (
                  <div 
                    key={promo.code}
                    className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl p-4 flex justify-between items-center shadow-sm relative overflow-hidden group"
                  >
                    {/* Left border indicator */}
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#e61e25]" />
                    
                    <div className="space-y-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#e61e25] dark:text-red-400 uppercase tracking-wide bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">{promo.discount}</span>
                        <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{promo.code}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight pr-2">{promo.desc}</p>
                      <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-wider">{promo.expiry}</p>
                    </div>
                    
                    <button
                      onClick={() => handleCopyCode(promo.code)}
                      className={`h-9 w-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        copiedCode === promo.code
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                          : 'bg-[#e61e25] text-white hover:bg-[#c9181e] shadow-md shadow-red-500/10'
                      }`}
                    >
                      {copiedCode === promo.code ? <Check size={16} /> : <Clipboard size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Navigation Bar: aligned exactly with the screenshot icons */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[3.8rem] bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5 z-30 flex justify-around items-center px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
        {[
          { id: 'history', icon: History, label: 'History' },
          { id: 'coupons', icon: Ticket, label: 'Coupons' },
          { id: 'help', icon: HelpCircle, label: 'Q&A' }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFooterTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFooterTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-4 cursor-pointer relative ${
                isActive 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-500'
              }`}
            >
              <Icon size={24} className="transition-transform duration-300" />
              {isActive && (
                <motion.span 
                  layoutId="activeCouponFooterTabIndicator"
                  className="absolute bottom-[-2px] w-6 h-[3px] bg-slate-900 dark:bg-white rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default CouponsContent;
