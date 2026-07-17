import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Scale, Lock, RefreshCw, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import SweetoLogo from './SweetoLogo';

/* Social Icon Components */
const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const TiktokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const Footer = () => {
  const { settings } = useStore();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const handlePolicyClick = (link) => {
    // Check if the link starts with '/' or '#' for local routes, or if it is external
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
      window.scrollTo(0, 0);
    }
  };

  const currentYear = new Date().getFullYear();
  const shopName = settings?.shopName || 'SWEETO HUB';

  // Dynamic policy links configuration from settings
  const policies = [
    {
      id: 'footer-policy-privacy',
      name: t('privacy') || 'Privacy Policy',
      link: settings?.footer_link_privacy || '/privacy',
      icon: Shield,
      color: 'hover:text-blue-500 hover:border-blue-500/30 dark:hover:text-cyan-400'
    },
    {
      id: 'footer-policy-terms',
      name: t('terms') || 'Terms of Service',
      link: settings?.footer_link_terms || '/terms',
      icon: Scale,
      color: 'hover:text-emerald-500 hover:border-emerald-500/30 dark:hover:text-emerald-400'
    },
    {
      id: 'footer-policy-security',
      name: t('security') || 'Security Policy',
      link: settings?.footer_link_security || '/security',
      icon: Lock,
      color: 'hover:text-rose-500 hover:border-rose-500/30 dark:hover:text-rose-450'
    },
    {
      id: 'footer-policy-refund',
      name: t('refund') || 'Refund Policy',
      link: settings?.footer_link_refund || '/refund',
      icon: RefreshCw,
      color: 'hover:text-amber-500 hover:border-amber-500/30 dark:hover:text-amber-400'
    }
  ];

  return (
    <footer id="global-storefront-footer" className="relative mt-20 bg-white/70 dark:bg-[#030712]/70 backdrop-blur-3xl border-t border-slate-100 dark:border-white/5 transition-colors duration-500">
      {/* Upper Subtle Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-12">
        <div className="flex flex-col md:grid md:grid-cols-12 gap-10 md:gap-8 mb-16">
          
          {/* Brand & Description Column (Span 6) */}
          <div className="md:col-span-6 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <SweetoLogo size={36} />
              <span className="text-lg font-black uppercase tracking-widest text-slate-900 dark:text-white italic">
                {shopName}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
              {settings?.storeAbout || t('about_desc') || 'Your premium electronics store. Experience high-end technology drop-shipped directly to your doorstep with guaranteed security and speed.'}
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3.5 mt-3">
              {[
                { icon: InstagramIcon, url: settings?.social_instagram || 'https://instagram.com', name: 'Instagram', id: 'footer-social-instagram' },
                { icon: FacebookIcon, url: settings?.social_facebook || 'https://facebook.com', name: 'Facebook', id: 'footer-social-facebook' },
                { icon: TwitterIcon, url: settings?.social_twitter || 'https://twitter.com', name: 'Twitter', id: 'footer-social-twitter' },
                { icon: TiktokIcon, url: settings?.social_tiktok || 'https://tiktok.com', name: 'TikTok', id: 'footer-social-tiktok' }
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    id={social.id}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 hover:border-blue-500/20 dark:hover:border-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-sm"
                    title={social.name}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Store Address & Contact Column (Span 6) */}
          <div className="md:col-span-6 flex flex-col gap-5">
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.25em] leading-none mb-1">
              {lang === 'fr' ? 'Coordonnées' : 'Store Coordinates'}
            </h4>
            <div className="flex flex-col gap-3.5 text-xs text-slate-500 dark:text-slate-400">
              {settings?.loc_address && (
                <div className="flex gap-3 items-start">
                  <MapPin size={16} className="text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  <span className="font-medium">
                    {settings.loc_address}, {settings.loc_city || 'Abidjan'}, {settings.loc_country || 'Côte d’Ivoire'}
                  </span>
                </div>
              )}
              {settings?.loc_phone && (
                <div className="flex gap-3 items-center">
                  <Phone size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-semibold">{settings.loc_phone}</span>
                </div>
              )}
              <div className="flex gap-3 items-center">
                <Mail size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-semibold">support@{shopName.toLowerCase().replace(/\s+/g, '')}.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Policy Row & Copyright */}
        <div className="pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Policies list: only link names rendered here */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {policies.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  id={p.id}
                  onClick={() => handlePolicyClick(p.link)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-transparent text-[10px] font-extrabold uppercase tracking-widest text-slate-450 dark:text-slate-400 bg-transparent transition-all cursor-pointer ${p.color}`}
                >
                  <Icon size={12} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* Copyright description */}
          <div className="text-center md:text-right flex flex-col gap-1">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
              © {currentYear} {shopName}. {settings?.footer_copyright || 'ELITE LOCAL COMMERCE.'}
            </p>
            <p className="text-[8px] font-bold text-slate-350 dark:text-slate-600 uppercase tracking-widest">
              Managed with elite standards
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
