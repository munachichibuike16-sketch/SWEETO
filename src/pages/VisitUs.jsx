import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ArrowLeft, 
  Globe, 
  Navigation, 
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

/* ─── CUSTOM SOCIAL ICONS ─── */
const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);

const TwitterIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const YoutubeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const TiktokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const VisitUs = () => {
  const { settings } = useStore();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCopyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      const isFr = lang === 'fr' || settings?.loc_country === 'Côte d’Ivoire';
      setCopyFeedback(`${label} ${isFr ? 'copié !' : 'copied!'}`);
      setTimeout(() => setCopyFeedback(''), 1500);
    }).catch(() => {});
  };

  const socialLinks = [
    { icon: FacebookIcon, key: 'social_facebook', label: 'Facebook', bg: 'bg-[#1877F2]' },
    { icon: InstagramIcon, key: 'social_instagram', label: 'Instagram', bg: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' },
    { icon: TwitterIcon, key: 'social_twitter', label: 'Twitter', bg: 'bg-slate-900' },
    { icon: YoutubeIcon, key: 'social_youtube', label: 'YouTube', bg: 'bg-[#FF0000]' },
    { icon: TiktokIcon, key: 'social_tiktok', label: 'TikTok', bg: 'bg-black' },
  ];

  const schedule = [
    { day: 'Monday', hours: settings?.loc_hours_weekday || '09:00 - 18:00' },
    { day: 'Tuesday', hours: settings?.loc_hours_weekday || '09:00 - 18:00' },
    { day: 'Wednesday', hours: settings?.loc_hours_weekday || '09:00 - 18:00' },
    { day: 'Thursday', hours: settings?.loc_hours_weekday || '09:00 - 18:00' },
    { day: 'Friday', hours: settings?.loc_hours_weekday || '09:00 - 18:00' },
    { day: 'Saturday', hours: settings?.loc_hours_sat || '09:00 - 17:00', highlight: true },
    { day: 'Sunday', hours: settings?.loc_hours_sun || 'Closed', highlight: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-eas-light dark:bg-eas-dark pt-24 pb-20 selection:bg-eas-blue/30 selection:text-eas-blue">
      <div className="max-w-[1400px] mx-auto px-6 relative">
        
        {/* METICULOUS NAVIGATION */}
        <div className="flex items-center justify-between mb-12">
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileActive={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 rounded-2xl shadow-xl shadow-eas-blue/5 dark:shadow-black/40 group transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-eas-blue/10 flex items-center justify-center text-eas-blue group-hover:bg-eas-blue group-hover:text-white transition-all">
              <ArrowLeft size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white italic">Back</span>
          </motion.button>

          <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">
            <span className="w-8 h-[2px] bg-eas-blue/30"></span>
            {settings?.shopName || 'SWEETO HUB'} • OFFICIAL LOCATION
            <span className="w-8 h-[2px] bg-eas-blue/30"></span>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* HERO BANNER SECTION */}
          <motion.div variants={itemVariants} className="lg:col-span-12 group relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border-4 border-white dark:border-eas-dark">
            <img 
              src={settings?.shopBanner || "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=2000"} 
              alt="Store Front"
              className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-eas-dark via-eas-dark/20 to-transparent" />
            
            {/* Glassmorphism Title Card */}
            <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row items-end justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="px-4 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Store Live</span>
                  </div>
                </div>
                <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter italic leading-none">
                  Visit Our <br/> <span className="text-eas-blue">Flagship</span> Store
                </h1>
                <p className="text-slate-300 font-bold text-sm leading-relaxed max-w-lg">
                  {settings?.experience_text || "Step into the future of tech. Experience our full product range in person at our Douala headquarters."}
                </p>
              </div>

              {/* Action Pills */}
              <div className="flex flex-wrap gap-4">
                {socialLinks.map((social, idx) => {
                  const link = settings?.[social.key];
                  if (!link) return null;
                  const fullLink = link.startsWith('http') ? link : `https://${link}`;
                  return (
                    <motion.a 
                      key={idx}
                      href={fullLink} 
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileActive={{ scale: 0.9 }}
                      className={`w-14 h-14 rounded-2xl ${social.bg} flex items-center justify-center text-white shadow-2xl border border-white/20`}
                    >
                       <social.icon size={24} />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* INFORMATION GRID */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
            {/* Address Card */}
            <div className="p-10 rounded-[2.5rem] bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 shadow-xl group hover:border-eas-blue/30 transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-eas-blue text-white flex items-center justify-center shadow-lg shadow-eas-blue/30 group-hover:rotate-12 transition-transform">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Find Us</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Physical HQ</p>
                </div>
              </div>
              <p 
                onClick={() => handleCopyToClipboard(settings?.loc_address || 'Elite Tech District, Block 12, Douala, Cameroon', lang === 'fr' ? 'Adresse' : 'Address')}
                className="text-base font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-8 hover:text-eas-blue cursor-pointer transition-colors flex items-center justify-between group/addr"
              >
                <span>{settings?.loc_address || 'Elite Tech District, Block 12, Douala, Cameroon'}</span>
                <span className="text-[9px] opacity-0 group-hover/addr:opacity-100 bg-eas-light dark:bg-white/5 text-slate-400 px-2 py-1 rounded transition-all font-black uppercase shrink-0 ml-2">
                  {lang === 'fr' ? 'Copier' : 'Copy'}
                </span>
              </p>
              <div className="flex flex-col gap-3">
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(settings?.loc_address || "Douala, Cameroon")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-5 bg-eas-dark dark:bg-white text-white dark:text-eas-dark rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                >
                  <Navigation size={18} />
                  Get Precise Directions
                </a>
                <button 
                  onClick={() => handleCopyToClipboard(settings?.loc_phone || '+2250500619923', lang === 'fr' ? 'Téléphone' : 'Phone')}
                  className="w-full py-5 border-2 border-slate-100 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                >
                  <Phone size={18} />
                  {lang === 'fr' ? 'Copier le Numéro' : 'Copy Phone Number'}
                </button>
              </div>
            </div>

            {/* Quick Status */}
            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-eas-blue to-blue-800 text-white shadow-2xl shadow-eas-blue/30 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Service Status</h3>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 opacity-70 text-blue-100">Active Network</p>
                  <p className="text-sm font-black uppercase leading-tight italic">
                    {settings?.loc_service_status || 'NATIONWIDE DELIVERY ACTIVE • 24H DISPATCH'}
                  </p>
                </div>
                <button 
                   onClick={() => window.open(`https://wa.me/${settings?.social_whatsapp?.replace(/\D/g, '')}`, '_blank')}
                   className="w-full flex items-center justify-between p-4 bg-white text-eas-blue rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-eas-light transition-all"
                >
                  <span>Chat With Agent</span>
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* MAP & SCHEDULE SECTION */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 h-full">
              
              {/* INTERACTIVE SCHEDULE */}
              <div className="md:col-span-2 p-10 rounded-[2.5rem] bg-white dark:bg-eas-dark/60 border border-slate-100 dark:border-white/5 shadow-xl flex flex-col">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Schedule</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Opening Hours</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  {schedule.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex justify-between items-center p-4 rounded-2xl transition-all ${
                        item.highlight 
                          ? 'bg-red-500/5 text-red-500 border border-red-500/10' 
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-widest italic">{item.day}</span>
                      <span className="text-xs font-black tracking-tight">{item.hours}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-eas-blue rounded-full animate-pulse shadow-lg shadow-eas-blue/50"></div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Open Now</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </div>
              </div>

              {/* HD MAP INTEGRATION */}
              <div className="md:col-span-3 rounded-[3rem] overflow-hidden bg-white dark:bg-eas-dark border-4 border-white dark:border-white/5 shadow-2xl relative group h-[600px] md:h-auto">
                <iframe 
                  title="Store Location"
                  width="100%" 
                  height="100%" 
                  frameBorder="0" 
                  scrolling="no" 
                  marginHeight="0" 
                  marginWidth="0" 
                  className="grayscale hover:grayscale-0 transition-all duration-1000"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(settings?.loc_address || "Douala, Cameroon")}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                />
                <div className="absolute top-6 right-6">
                   <button 
                     onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(settings?.loc_address || "Douala, Cameroon")}`, '_blank')}
                     className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-105 transition-all"
                   >
                     <Globe size={16} />
                     Expand Map
                   </button>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating Clipboard Feedback */}
      <AnimatePresence>
        {copyFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
            className="fixed bottom-24 left-1/2 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-2xl z-[999] border border-white/10 dark:border-slate-200/20 flex items-center gap-2"
          >
            <span>{copyFeedback}</span>
            <span className="text-emerald-400">✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisitUs;
