import React, { useState, useEffect } from 'react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRightCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MobileBottomBanner({ settings, products = [], lang, t_smart }) {
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

  // Retrieve products for slots
  const getProductForSlot = (slotKey) => {
    const pId = settings?.[slotKey];
    if (!pId) return null;
    return products.find(p => String(p.id) === String(pId));
  };

  const prod1 = getProductForSlot('mobile_bottom_banner_slot1_product_id');
  const prod2 = getProductForSlot('mobile_bottom_banner_slot2_product_id');
  const prod3 = getProductForSlot('mobile_bottom_banner_slot3_product_id');

  const label1 = settings?.mobile_bottom_banner_slot1_label || 'Brand gallery';
  const label2 = settings?.mobile_bottom_banner_slot2_label || 'LILYGO';
  const label3 = settings?.mobile_bottom_banner_slot3_label || 'OnePlus';

  const bannerTitle = settings?.mobile_bottom_banner_title || 'Shop now';
  const bannerSubtitle = settings?.mobile_bottom_banner_subtitle || 'Sale Ends in:';
  const bannerImage = settings?.mobile_bottom_banner_image || '/hero_summer_oasis.png';

  const handleProductClick = (product) => {
    if (product?.id) {
      navigate(`/product/${product.id}`);
      window.scrollTo(0, 0);
    }
  };

  if (!isEnabled || timeLeft.expired) return null;

  return (
    <section className="-mx-4 px-0 pt-4 pb-6 select-none block lg:hidden w-[calc(100%+32px)]">
      <div 
        onClick={() => {
          navigate('/deals');
        }}
        className="relative w-full min-h-[170px] rounded-none overflow-hidden shadow-xl bg-[#007aff] flex flex-col justify-between p-4 pb-3 select-none text-white cursor-pointer"
      >
        {/* Top Section: Countdown & Shop Now */}
        <div className="flex justify-between items-start w-full z-10 text-left">
          {/* Countdown & Action */}
          <div className="flex flex-col gap-1 sm:gap-2">
            {/* Countdown Title */}
            <div className="flex items-center gap-1.5 text-white font-black text-[10px] sm:text-xs tracking-wide uppercase">
              <span>{t_smart(bannerSubtitle)}</span>
              <div className="flex items-center gap-0.5 sm:gap-1 font-sans">
                <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-white font-bold leading-none">:</span>
                <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-white font-bold leading-none">:</span>
                <span className="bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded leading-none">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
            
            {/* Shop Now Action */}
            <div className="flex items-center gap-1.5 text-white font-black text-lg sm:text-2xl italic tracking-tighter leading-tight mt-0.5">
              <span>{t_smart(bannerTitle)}</span>
              <ArrowRightCircle size={18} className="text-white fill-white/20 shrink-0" />
            </div>
          </div>
          
          {/* Right Side Brand Logo / Illustration */}
          <div className="absolute top-0 right-0 h-[65%] w-[45%] flex justify-end items-end pointer-events-none select-none z-0">
            <img 
              src={bannerImage} 
              alt="" 
              className="h-full w-auto object-contain object-bottom select-none pointer-events-none" 
            />
          </div>
        </div>

        {/* Bottom Section: 3 Product Cards Slots */}
        <div className="grid grid-cols-3 gap-2 mt-4 z-10">
          {/* Slot 1 */}
          <div 
            onClick={(e) => {
              if (prod1) {
                e.stopPropagation();
                handleProductClick(prod1);
              }
            }}
            className="flex items-center bg-blue-50/90 dark:bg-slate-900/90 border border-blue-100/10 rounded-lg p-1.5 text-[9px] text-slate-800 dark:text-white font-bold h-12 shadow-sm"
          >
            {prod1 ? (
              <>
                <img 
                  src={prod1.image_url || prod1.image} 
                  alt="" 
                  className="w-8 h-8 object-contain bg-white rounded flex-shrink-0"
                />
                <div className="flex flex-col text-left leading-none ml-1.5 overflow-hidden">
                  <span className="text-[7.5px] opacity-75 font-medium truncate text-blue-700 dark:text-blue-400">{t_smart(label1)}</span>
                  <span className="text-[9.5px] font-black mt-0.5 text-slate-900 dark:text-white">US ${prod1.price}</span>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-[7.5px] opacity-40 font-medium">Slot 1</div>
            )}
          </div>

          {/* Slot 2 */}
          <div 
            onClick={(e) => {
              if (prod2) {
                e.stopPropagation();
                handleProductClick(prod2);
              }
            }}
            className="flex items-center bg-amber-50/95 dark:bg-slate-900/90 border border-amber-100/10 rounded-lg p-1.5 text-[9px] text-slate-800 dark:text-white font-bold h-12 shadow-sm"
          >
            {prod2 ? (
              <>
                <img 
                  src={prod2.image_url || prod2.image} 
                  alt="" 
                  className="w-8 h-8 object-contain bg-white rounded flex-shrink-0"
                />
                <div className="flex flex-col text-left leading-none ml-1.5 overflow-hidden">
                  <span className="text-[7.5px] opacity-75 font-medium truncate text-amber-700 dark:text-amber-450">{t_smart(label2)}</span>
                  <span className="text-[9.5px] font-black mt-0.5 text-slate-900 dark:text-white">US ${prod2.price}</span>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-[7.5px] opacity-40 font-medium">Slot 2</div>
            )}
          </div>

          {/* Slot 3 */}
          <div 
            onClick={(e) => {
              if (prod3) {
                e.stopPropagation();
                handleProductClick(prod3);
              }
            }}
            className="flex items-center bg-rose-50/90 dark:bg-slate-900/90 border border-rose-100/10 rounded-lg p-1.5 text-[9px] text-slate-800 dark:text-white font-bold h-12 shadow-sm"
          >
            {prod3 ? (
              <>
                <img 
                  src={prod3.image_url || prod3.image} 
                  alt="" 
                  className="w-8 h-8 object-contain bg-white rounded flex-shrink-0"
                />
                <div className="flex flex-col text-left leading-none ml-1.5 overflow-hidden">
                  <span className="text-[7.5px] opacity-75 font-medium truncate text-rose-700 dark:text-rose-450">{t_smart(label3)}</span>
                  <span className="text-[9.5px] font-black mt-0.5 text-slate-900 dark:text-white">US ${prod3.price}</span>
                </div>
              </>
            ) : (
              <div className="w-full text-center text-[7.5px] opacity-40 font-medium">Slot 3</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
