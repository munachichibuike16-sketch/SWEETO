import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
  const { settings } = useStore();

  const currentYear = new Date().getFullYear();
  const shopName = settings?.shopName || 'SWEETO HUB';

  // Dynamic policy links configuration from settings
  const currentYear = new Date().getFullYear();
  const shopName = settings?.shopName || 'SWEETO HUB';

  return (
    <footer id="global-storefront-footer" className="relative mt-20 bg-white/70 dark:bg-[#030712]/70 backdrop-blur-3xl border-t border-slate-100 dark:border-white/5 transition-colors duration-500">
      {/* Upper Subtle Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-[1240px] mx-auto px-6 py-8 flex justify-center items-center">
        <p className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none text-center">
          © {currentYear} {shopName} . {settings?.footer_copyright || "E-COMMERCE D'ÉLITE"}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
