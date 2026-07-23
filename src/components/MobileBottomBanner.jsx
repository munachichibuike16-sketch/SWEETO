import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, Truck } from 'lucide-react';

export default function MobileBottomBanner({ settings, lang, t_smart }) {
  const navigate = useNavigate();

  const isEnabled = settings?.mobile_bottom_banner_enabled === 'true' || settings?.mobile_bottom_banner_enabled === true;

  const [timeLeft, setTimeLeft] = useState(() => {
    const target = Number(settings?.mobile_bottom_banner_target_time) || 
      (Date.now() + ((Number(settings?.mobile_bottom_banner_hours) || 16) * 3600 + (Number(settings?.mobile_bottom_banner_minutes) || 22) * 60 + (Number(settings?.mobile_bottom_banner_seconds) || 0)) * 1000);
    const diff = target - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { hours: h, minutes: m, seconds: s, expired: false };
  });

  useEffect(() => {
    const target = Number(settings?.mobile_bottom_banner_target_time) || 
      (Date.now() + ((Number(settings?.mobile_bottom_banner_hours) || 16) * 3600 + (Number(settings?.mobile_bottom_banner_minutes) || 22) * 60 + (Number(settings?.mobile_bottom_banner_seconds) || 0)) * 1000);
    
    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, expired: true });
        return true;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s, expired: false });
      return false;
    };

    updateTimer();
    const timer = setInterval(() => {
      const expired = updateTimer();
      if (expired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.mobile_bottom_banner_target_time, settings?.mobile_bottom_banner_hours, settings?.mobile_bottom_banner_minutes, settings?.mobile_bottom_banner_seconds]);

  if (!isEnabled || timeLeft.expired) return null;

  return (
    <section className="-mx-4 px-4 pt-4 pb-6 select-none block lg:hidden w-[calc(100%+32px)]">
      <div 
        className="relative w-full rounded-2xl bg-[#13161c] text-white overflow-hidden shadow-2xl border border-white/5 flex flex-col items-center p-6 select-none text-center"
      >
        {/* Subtle Orange/Golden radial glow */}
        <div className="absolute right-0 top-0 bottom-0 w-[50%] bg-gradient-to-l from-[#ffc72c]/10 to-transparent blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[120px] h-[120px] bg-[#ff5722]/5 rounded-full blur-[60px] pointer-events-none" />

        {/* Badge */}
        <div className="flex items-center gap-1 bg-[#f5c71a] text-slate-950 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider select-none mb-3 shadow-[0_4px_12px_rgba(245,199,26,0.25)]">
          <span>⚡</span>
          <span>{lang === 'fr' ? 'Super Offres Choix' : 'Choice Super Deals'}</span>
        </div>

        {/* Heading */}
        <h3 className="text-base sm:text-lg font-black text-white leading-tight max-w-xs mb-1">
          {lang === 'fr' ? (
            <>Jusqu'à <span className="text-[#f5c71a]">-70%</span> sur les essentiels Tech</>
          ) : (
            <>Up to <span className="text-[#f5c71a]">70% OFF</span> Tech Essentials</>
          )}
        </h3>

        {/* Subheading */}
        <p className="text-[8px] sm:text-[9px] text-white/60 max-w-xs mb-4 font-medium leading-normal">
          {lang === 'fr' 
            ? "Livraison gratuite dès 10$ • Garantie en 5 jours" 
            : "Free shipping over $10 • Guaranteed 5-Day Delivery"
          }
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-4 w-full max-w-[280px]">
          <button 
            onClick={() => navigate('/deals')}
            className="flex-1 py-2 px-3 bg-gradient-to-r from-[#ff5722] to-[#ff2a5f] text-white rounded-full font-black text-[9px] uppercase tracking-wider border-none flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
          >
            <span>{lang === 'fr' ? 'Acheter' : 'Shop Now'}</span>
            <ArrowRight size={10} className="stroke-[3]" />
          </button>

          <button 
            onClick={() => navigate('/order-tracking')}
            className="flex-1 py-2 px-3 bg-white/5 border border-white/15 text-white rounded-full font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 active:scale-95 transition-transform cursor-pointer"
          >
            <Truck size={10} className="text-white/80" />
            <span>{lang === 'fr' ? 'Suivre' : 'Track'}</span>
          </button>
        </div>

        {/* Countdown Timer */}
        <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-2.5 w-full max-w-[240px] flex flex-col items-center gap-1.5 shadow-md">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#f5c71a]">
            {lang === 'fr' ? 'LA VENTE FLASH SE TERMINE DANS' : 'FLASH SALE ENDS IN'}
          </span>
          
          <div className="flex items-center gap-2 text-white select-none">
            <div className="flex flex-col items-center">
              <div className="bg-[#0b0f19] border border-white/5 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-mono font-black text-[#f5c71a] shadow-inner">
                {String(timeLeft.hours).padStart(2, '0')}
              </div>
              <span className="text-[6px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">HRS</span>
            </div>
            
            <span className="text-xs font-black text-[#f5c71a] -mt-2.5">:</span>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#0b0f19] border border-white/5 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-mono font-black text-[#f5c71a] shadow-inner">
                {String(timeLeft.minutes).padStart(2, '0')}
              </div>
              <span className="text-[6px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">MIN</span>
            </div>
            
            <span className="text-xs font-black text-[#f5c71a] -mt-2.5">:</span>
            
            <div className="flex flex-col items-center">
              <div className="bg-[#0b0f19] border border-white/5 rounded-lg w-8 h-8 flex items-center justify-center text-xs font-mono font-black text-red-500 shadow-inner animate-pulse">
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              <span className="text-[6px] font-black text-slate-400 mt-0.5 uppercase tracking-widest">SEC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
