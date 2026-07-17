import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, X, Check, Calendar, Gift, Lock, Copy } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

export default function LoyaltyPointsWidget() {
  const { lang } = useLanguage();
  const { showToast, settings } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [lastCheckIn, setLastCheckIn] = useState('');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  // Daily Streak Rewards Configuration
  const dailyRewards = [50, 50, 100, 50, 50, 50, 200];

  useEffect(() => {
    // Load points & check-in timestamps
    const savedPoints = Number(localStorage.getItem('sweeto_loyalty_points') || '100'); // start with 100 welcome coins!
    const savedCheckIn = localStorage.getItem('sweeto_last_checkin') || '';
    
    setPoints(savedPoints);
    setLastCheckIn(savedCheckIn);

    if (savedCheckIn) {
      const todayStr = new Date().toDateString();
      if (savedCheckIn === todayStr) {
        setIsCheckedInToday(true);
      }
    }
  }, []);

  const handleCheckIn = () => {
    if (isCheckedInToday) return;

    const todayStr = new Date().toDateString();
    const newPoints = points + 50; // Grant 50 coins today
    
    setPoints(newPoints);
    setIsCheckedInToday(true);
    setLastCheckIn(todayStr);

    localStorage.setItem('sweeto_loyalty_points', String(newPoints));
    localStorage.setItem('sweeto_last_checkin', todayStr);

    showToast(
      lang === 'fr' 
        ? 'Super ! +50 pièces Sweeto ajoutées ! 🪙' 
        : 'Awesome! +50 Sweeto Coins added! 🪙',
      'success'
    );
  };

  const handleRedeem = (cost, code) => {
    if (points < cost) {
      showToast(
        lang === 'fr' 
          ? 'Points insuffisants pour déverrouiller ce code !' 
          : 'Insufficient points to unlock this code!',
        'error'
      );
      return;
    }

    const newPoints = points - cost;
    setPoints(newPoints);
    localStorage.setItem('sweeto_loyalty_points', String(newPoints));

    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(
      lang === 'fr' 
        ? `Code ${code} déverrouillé et copié !` 
        : `Code ${code} unlocked and copied!`,
      'success'
    );

    setTimeout(() => setCopiedCode(''), 2500);
  };

  const freeShipCode = settings?.free_delivery_code || 'FREESHIP';

  const rewardStore = [
    { name: lang === 'fr' ? 'Livraison Gratuite' : 'Free Shipping', cost: 150, code: freeShipCode, desc: lang === 'fr' ? 'Annule les frais de transport' : 'Waives transport fees' },
    { name: 'Remise 5%', cost: 300, code: 'SWEETO5', desc: lang === 'fr' ? '5% de réduction sur tout le panier' : '5% discount on total cart' },
    { name: 'Remise 10%', cost: 500, code: 'ELITE10', desc: lang === 'fr' ? '10% de réduction sur votre achat' : '10% discount on your order' }
  ];

  return (
    <>
      {/* Floating Gold Coin Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-6 sm:bottom-6 sm:left-38 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 flex items-center justify-center shadow-xl shadow-amber-400/25 cursor-pointer border border-amber-300"
        title="Sweeto Club"
      >
        <Coins size={20} className="animate-bounce" />
        <span className="absolute -top-1 -right-1 bg-slate-900 dark:bg-slate-950 border border-amber-400 rounded-full px-1 py-0.5 text-[8px] font-black text-amber-400 leading-none">
          {points}
        </span>
      </motion.button>

      {/* Loyalty Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/50 backdrop-blur-sm font-sans">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-sm h-full bg-[#0a0f1d] dark:bg-slate-950 border-l border-slate-800/80 p-6 flex flex-col justify-between overflow-y-auto text-left shadow-2xl relative"
            >
              <div>
                {/* Header Close */}
                <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                  <div className="flex items-center gap-2">
                    <Coins size={20} className="text-amber-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">
                      Sweeto VIP Club
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1 bg-transparent border-none"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Balance Card */}
                <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-center space-y-2 mb-6">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Votre Solde</span>
                  <div className="flex items-center justify-center gap-2">
                    <Coins size={28} className="text-amber-400 animate-pulse" />
                    <span className="text-3xl font-black text-white">{points}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    {lang === 'fr' ? 'Collectez des pièces et débloquez des codes promo !' : 'Collect coins and unlock promo codes!'}
                  </p>
                </div>

                {/* Daily Check-In Section */}
                <div className="space-y-3.5 mb-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {lang === 'fr' ? 'Récompenses Quotidiennes' : 'Daily Check-In Rewards'}
                  </h4>
                  
                  <div className="grid grid-cols-7 gap-1.5">
                    {dailyRewards.map((reward, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-center border flex flex-col items-center justify-between min-h-16 ${
                          idx === 0 && isCheckedInToday
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-white/5 border-white/5 text-slate-400'
                        }`}
                      >
                        <span className="text-[7px] font-bold">Day {idx + 1}</span>
                        <Coins size={10} className="my-1" />
                        <span className="text-[8px] font-black">+{reward}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleCheckIn}
                    disabled={isCheckedInToday}
                    className={`w-full py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isCheckedInToday
                        ? 'bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isCheckedInToday ? (
                      <>
                        <Check size={12} />
                        {lang === 'fr' ? 'Déjà Réclamé Aujourd\'hui' : 'Claimed Today'}
                      </>
                    ) : (
                      <>
                        <Calendar size={12} />
                        {lang === 'fr' ? 'Réclamer +50 Pièces' : 'Claim +50 Coins'}
                      </>
                    )}
                  </button>
                </div>

                {/* Reward Store Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {lang === 'fr' ? 'Boutique de Récompenses' : 'Redeem Store'}
                  </h4>
                  
                  <div className="space-y-2.5">
                    {rewardStore.map((reward, idx) => {
                      const isUnlocked = points >= reward.cost;
                      const isCopied = copiedCode === reward.code;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3.5 bg-white/5 border border-white/5 rounded-2xl gap-3 text-left"
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-bold text-white uppercase tracking-wider">{reward.name}</h5>
                            <p className="text-[9px] text-slate-400 truncate mt-0.5">{reward.desc}</p>
                          </div>
                          
                          <button
                            onClick={() => handleRedeem(reward.cost, reward.code)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer ${
                              isCopied
                                ? 'bg-emerald-500 text-white'
                                : isUnlocked
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md'
                                : 'bg-slate-900 text-slate-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {isCopied ? (
                              <Check size={10} />
                            ) : !isUnlocked ? (
                              <Lock size={10} />
                            ) : (
                              <Copy size={10} />
                            )}
                            <span>{reward.cost} 🪙</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* VIP Notice Footer */}
              <div className="pt-4 border-t border-white/5 text-[9px] text-slate-500 text-center font-semibold">
                {lang === 'fr' ? 'Statut Sweeto VIP Membre Actif' : 'Sweeto VIP Active Member Status'}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
