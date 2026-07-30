import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Clock, 
  Store, 
  ArrowLeft,
  Mail,
  Navigation,
  Share2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const VisitUs = () => {
  const { settings } = useStore();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [copyFeedback, setCopyFeedback] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Address and contacts
  const shopName = settings?.shopName || 'Sucess Technology';
  const address = settings?.loc_address || 'Douala, Cameroon';
  const phone = settings?.loc_phone || '+237 6XX XXX XXX';
  const email = settings?.contact_email || 'info@sucesstechnology.com';
  const phoneClean = phone.replace(/\s/g, '');
  const phoneDigits = phone.replace(/\D/g, '');
  const description = settings?.shopDescription || 'Your trusted partner for premium technology products and exceptional service.';
  const shopPhoto = settings?.loc_shop_photo || '';

  // Hours
  const weekdayHours = settings?.loc_hours_weekday || '09:00 - 18:00';
  const satHours = settings?.loc_hours_sat || '09:00 - 17:00';
  const sunHours = settings?.loc_hours_sun || 'Closed';

  const checkIsOpen = () => {
    const now = new Date();
    const day = now.getDay();
    const currentMin = now.getHours() * 60 + now.getMinutes();

    const parseHours = (timeStr) => {
      if (!timeStr || timeStr.toLowerCase().includes('closed')) return null;
      const match = timeStr.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/);
      if (match) {
        return {
          start: parseInt(match[1]) * 60 + parseInt(match[2]),
          end: parseInt(match[3]) * 60 + parseInt(match[4])
        };
      }
      return null;
    };

    let todayHoursStr = weekdayHours;
    if (day === 0) todayHoursStr = sunHours;
    if (day === 6) todayHoursStr = satHours;

    const todayHours = parseHours(todayHoursStr);
    if (!todayHours) return false;

    return currentMin >= todayHours.start && currentMin <= todayHours.end;
  };

  useEffect(() => {
    setIsOpen(checkIsOpen());
    const interval = setInterval(() => {
      setIsOpen(checkIsOpen());
    }, 60000);
    return () => clearInterval(interval);
  }, [weekdayHours, satHours, sunHours]);

  const handleShareLocation = () => {
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    if (navigator.share) {
      navigator.share({
        title: `Visit ${shopName}`,
        text: `Find us at: ${address}`,
        url: mapsUrl
      }).catch(() => {
        navigator.clipboard.writeText(mapsUrl);
        showToast('📍 Location link copied!');
      });
    } else {
      navigator.clipboard.writeText(mapsUrl);
      showToast('📍 Location link copied!');
    }
  };

  const showToast = (message) => {
    setCopyFeedback(message);
    setTimeout(() => setCopyFeedback(''), 2500);
  };

  const socialLinks = [
    { icon: 'fa-facebook', key: 'social_facebook', url: settings?.social_facebook },
    { icon: 'fa-instagram', key: 'social_instagram', url: settings?.social_instagram },
    { icon: 'fa-twitter', key: 'social_twitter', url: settings?.social_twitter },
    { icon: 'fa-tiktok', key: 'social_tiktok', url: settings?.social_tiktok },
    { icon: 'fa-youtube', key: 'social_youtube', url: settings?.social_youtube },
  ].filter(s => s.url && s.url.trim() && s.url !== '#');

  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  const waUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : '#';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-20 sm:pt-28 pb-16 font-sans text-slate-900 dark:text-slate-100 transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-medium text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#0F172A] via-[#1a1a2e] to-[#16213e] rounded-[24px] mb-10 overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[350px] shadow-lg">
          <div className="absolute -top-1/2 -right-1/4 w-[500px] h-[500px] bg-indigo-500/15 blur-[70px] rounded-full pointer-events-none" />
          
          <div className="p-8 sm:p-12 lg:p-14 relative z-10 flex flex-col justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/20 backdrop-blur-md rounded-2xl mb-6 text-indigo-400">
              <MapPin size={32} />
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black text-white tracking-tight mb-3">
              Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-600">{shopName}</span>
            </h1>
            
            <p className="text-white/70 text-base sm:text-lg leading-relaxed max-w-md mb-4">
              We're here to help you with any questions or concerns. Reach out to us through any of the channels below.
            </p>
            
            <div className="flex items-center gap-2 text-white/60 text-sm mt-3">
              <MapPin size={16} className="text-indigo-500" />
              <span>{address}</span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/10 text-white/70 rounded-xl text-sm font-medium mt-4 w-fit">
              <Clock size={16} className="text-emerald-500" />
              <span>
                Mon-Fri: {weekdayHours} | Sat: {satHours}
              </span>
            </div>
          </div>
          
          <div className="relative overflow-hidden min-h-[200px] lg:min-h-full bg-white/5 flex items-center justify-center group">
            {shopPhoto ? (
              <img src={shopPhoto} alt={shopName} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            ) : (
              <div className="flex flex-col items-center justify-center text-white/30 gap-3">
                <Store size={64} strokeWidth={1} />
                <span className="text-sm font-medium">Shop Photo</span>
              </div>
            )}
          </div>
        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Info Cards Column */}
          <div className="flex flex-col gap-4">
            
            {/* Location */}
            <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location</div>
                <div className="text-[15px] font-semibold text-slate-900 dark:text-white mt-1">{address}</div>
              </div>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="shrink-0 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1">
                <Navigation size={12} /> Map
              </a>
            </div>

            {/* Phone */}
            <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Phone size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</div>
                <div className="text-[15px] font-semibold text-slate-900 dark:text-white mt-1">
                  <a href={`tel:${phoneClean}`} className="hover:text-indigo-600 transition-colors">{phone}</a>
                </div>
              </div>
              <a href={waUrl} target="_blank" rel="noreferrer" className="shrink-0 bg-[#25D366] text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-[#20bd5a] transition-colors flex items-center gap-1">
                 WhatsApp
              </a>
            </div>

            {/* Email */}
            <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                <div className="text-[15px] font-semibold text-slate-900 dark:text-white mt-1">
                  <a href={`mailto:${email}`} className="hover:text-indigo-600 transition-colors">{email}</a>
                </div>
              </div>
              <a href={`mailto:${email}`} className="shrink-0 bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1">
                 Send
              </a>
            </div>

            {/* Hours */}
            <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Business Hours</div>
                <div className="text-[14px] font-medium text-slate-900 dark:text-white mt-1 leading-relaxed">
                  Mon - Fri: {weekdayHours}<br/>
                  Sat: {satHours}<br/>
                  Sun: {sunHours}
                </div>
              </div>
              <div className="shrink-0">
                {isOpen ? (
                  <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Open Now
                  </span>
                ) : (
                  <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-full text-xs font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Closed
                  </span>
                )}
              </div>
            </div>

            {/* Store Name Card */}
            <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Store size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Store</div>
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{shopName}</div>
              </div>
            </div>
            
          </div>

          {/* Map Column */}
          <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-slate-100 dark:border-slate-800/60 overflow-hidden min-h-[400px] lg:h-full relative group shadow-sm hover:shadow-lg hover:border-indigo-500/50 transition-all flex flex-col">
            <div className="flex-1 relative min-h-[300px]">
              <iframe 
                title="Store Location"
                width="100%" 
                height="100%" 
                frameBorder="0" 
                scrolling="no" 
                marginHeight="0" 
                marginWidth="0" 
                className="absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              />
            </div>
            <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center bg-white dark:bg-[#0b0f19] z-10">
              <MapPin size={24} className="text-indigo-600 dark:text-indigo-400 mb-2" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Find Us Here</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{address}</p>
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:-translate-y-0.5"
              >
                <Navigation size={16} /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Description Card */}
        {description && description !== 'Your trusted partner for premium technology products and exceptional service.' && (
          <div className="bg-white dark:bg-[#0b0f19] rounded-2xl p-6 sm:p-7 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 hover:border-indigo-500/50 transition-all shadow-sm mb-6 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Info size={20} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed m-0 mt-2 sm:mt-1">
              {description}
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="bg-white dark:bg-[#0b0f19] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 text-center hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm flex flex-col items-center justify-center text-slate-900 dark:text-white no-underline">
            <span className="text-2xl mb-2">🧭</span>
            <span className="text-xs font-semibold">Get Directions</span>
          </a>
          <a href={`tel:${phoneClean}`} className="bg-white dark:bg-[#0b0f19] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 text-center hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm flex flex-col items-center justify-center text-slate-900 dark:text-white no-underline">
            <span className="text-2xl mb-2">📞</span>
            <span className="text-xs font-semibold">Call Store</span>
          </a>
          <button onClick={handleShareLocation} className="bg-white dark:bg-[#0b0f19] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 text-center hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm flex flex-col items-center justify-center text-slate-900 dark:text-white">
            <span className="text-2xl mb-2">📤</span>
            <span className="text-xs font-semibold">Share Location</span>
          </button>
          <button onClick={() => navigate('/product')} className="bg-white dark:bg-[#0b0f19] rounded-xl p-4 border border-slate-100 dark:border-slate-800/60 text-center hover:-translate-y-1 hover:shadow-lg hover:border-indigo-500/50 transition-all shadow-sm flex flex-col items-center justify-center text-slate-900 dark:text-white">
            <span className="text-2xl mb-2">🛍️</span>
            <span className="text-xs font-semibold">Browse Products</span>
          </button>
        </div>

        {/* Social Section */}
        <div className="bg-white dark:bg-[#0b0f19] rounded-[20px] p-6 sm:p-8 lg:px-10 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm mb-10 text-center sm:text-left">
          <div className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Share2 className="text-indigo-600 dark:text-indigo-400 hidden sm:block" size={20} /> 
            Connect with us on social media
          </div>
          <div className="flex gap-3">
            {socialLinks.length > 0 ? (
              socialLinks.map((social) => (
                <a 
                  key={social.key}
                  href={social.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg transition-all"
                >
                  <i className={`fab ${social.icon} text-lg`}></i>
                </a>
              ))
            ) : (
              <span className="text-sm text-slate-500">No social links available</span>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-[#0F172A] via-[#1a1a2e] to-[#16213e] rounded-[20px] p-8 sm:p-12 text-center relative overflow-hidden shadow-lg">
          <div className="absolute -top-1/2 -right-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[60px] rounded-full pointer-events-none" />
          
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 relative z-10">
            Ready to Visit Us?
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto text-sm sm:text-base relative z-10">
            Come experience our products in person. We're excited to serve you!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <a 
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Navigation size={16} /> Get Directions
            </a>
            <a 
              href={`tel:${phoneClean}`}
              className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Phone size={16} /> Call Us Now
            </a>
          </div>
        </div>

      </div>

      {/* Floating Toast */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            className="fixed bottom-20 left-1/2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-6 py-3.5 rounded-xl text-sm font-bold shadow-2xl z-50 border border-white/10 dark:border-slate-200/20 flex items-center gap-2"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{copyFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitUs;
