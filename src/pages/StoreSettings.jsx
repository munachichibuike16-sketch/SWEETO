import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Image as ImageIcon, 
  Save, 
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Info,
  Layout,
  Link as LinkIcon,
  FileText,
  Users,
  MessageCircle,
  Sparkles,
  Shield,
  Zap,
  MousePointer2,
  Coins,
  Tag,
  Type
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';

const SectionHeader = ({ icon: Icon, title, color, subtitle }) => {
  const accentClasses = {
    blue: 'dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25 dark:shadow-cyan-500/5',
    indigo: 'dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/25 dark:shadow-indigo-500/5',
    purple: 'dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25 dark:shadow-purple-500/5',
    rose: 'dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25 dark:shadow-rose-500/5',
    emerald: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25 dark:shadow-emerald-500/5',
    orange: 'dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/25 dark:shadow-orange-500/5',
  };
  
  const lineAccents = {
    blue: 'dark:from-cyan-500',
    indigo: 'dark:from-indigo-500',
    purple: 'dark:from-purple-500',
    rose: 'dark:from-rose-500',
    emerald: 'dark:from-emerald-500',
    orange: 'dark:from-orange-500',
  };

  const currentAccent = accentClasses[color] || 'dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20';
  const currentLine = lineAccents[color] || 'dark:from-cyan-500';

  return (
    <div className="flex flex-col mb-8">
      <div className="flex items-center gap-4 mb-2">
        <div className={`w-12 h-12 rounded-2xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center shadow-lg shadow-${color}-500/5 border border-${color}-500/20 ${currentAccent}`}>
          <Icon size={22} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.25em]">{title}</h3>
          {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
        </div>
      </div>
      <div className={`w-20 h-1 bg-gradient-to-r from-${color}-500 ${currentLine} to-transparent rounded-full ml-16 opacity-30`}></div>
    </div>
  );
};

const InputWrapper = ({ label, children, icon: Icon }) => (
  <div className="space-y-2 group/field">
    <div className="flex items-center justify-between px-1">
      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] group-focus-within/field:text-blue-500 dark:group-focus-within/field:text-cyan-400 transition-colors">
        {label}
      </label>
      {Icon && <Icon size={12} className="text-slate-300 dark:text-slate-650 group-focus-within/field:text-blue-400 dark:group-focus-within/field:text-cyan-300 transition-colors" />}
    </div>
    <div className="relative overflow-hidden rounded-[1.5rem] transition-all">
      {children}
    </div>
  </div>
);

/* ─── PUSH NOTIFICATION MANAGEMENT PANEL ─── */
const PushNotificationPanel = ({ showToast }) => {
  const [pushStats, setPushStats] = useState({ total: 0, admins: 0, customers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const permissionStatus = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';
  const permissionColor = {
    granted: 'bg-emerald-500',
    denied: 'bg-red-500',
    default: 'bg-amber-500',
    unsupported: 'bg-slate-500'
  };
  const permissionLabel = {
    granted: 'Enabled',
    denied: 'Blocked',
    default: 'Not Yet Asked',
    unsupported: 'Not Supported'
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: total, error: errTotal } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true });

        const { count: admins, error: errAdmins } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        const { count: customers, error: errCustomers } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer');

        if (errTotal || errAdmins || errCustomers) {
          throw errTotal || errAdmins || errCustomers;
        }

        setPushStats({
          total: total || 0,
          admins: admins || 0,
          customers: customers || 0
        });
      } catch (err) {
        console.warn('Could not fetch push stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleTestPush = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-web-push', {
        body: {
          title: '🔔 SWEETO HUB - Test Push Notification',
          body: 'Awesome! If you are seeing this, push notifications are working perfectly on your mobile device.',
          url: '/#/',
          targetRole: 'all' // Test send to all roles (both admins and customers)
        }
      });
      if (!error) {
        showToast('Test notification broadcast sent!');
      } else {
        showToast('Failed to trigger test notification: ' + (error.message || error), 'error');
      }
    } catch (err) {
      showToast('Network error: ' + err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestPermission = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        showToast('Notification permission granted! Reload to subscribe.');
        window.location.reload();
      } else {
        showToast('Permission was ' + result, 'warning');
      }
    } catch (err) {
      showToast('Error requesting permission: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${permissionColor[permissionStatus]} ${permissionStatus === 'granted' ? 'animate-pulse' : ''}`}></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Browser Permission</p>
            <p className="text-xs font-black text-slate-700 dark:text-white uppercase tracking-wide">{permissionLabel[permissionStatus]}</p>
          </div>
        </div>
        {permissionStatus === 'default' && (
          <button 
            onClick={handleRequestPermission}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all"
          >
            Enable
          </button>
        )}
      </div>

      {/* Subscriber Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl">
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{loadingStats ? '—' : pushStats.total}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Total</p>
        </div>
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl">
          <p className="text-xl sm:text-2xl font-black text-cyan-500">{loadingStats ? '—' : pushStats.admins}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Admins</p>
        </div>
        <div className="text-center p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl">
          <p className="text-xl sm:text-2xl font-black text-purple-500">{loadingStats ? '—' : pushStats.customers}</p>
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Customers</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-5 bg-orange-500/5 dark:bg-orange-500/5 rounded-2xl border border-orange-500/10 text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
        <p className="font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest text-[9px] mb-2 flex items-center gap-1.5">
          <Info size={12} /> How It Works
        </p>
        <ul className="space-y-1.5 text-[11px]">
          <li>• <strong>Admin notifications:</strong> New orders, low stock alerts — sent only to admin devices.</li>
          <li>• <strong>Customer notifications:</strong> New products, price drops, order status updates.</li>
          <li>• <strong>Mobile tip:</strong> "Add to Home Screen" on your phone for the best push experience.</li>
        </ul>
      </div>

      {/* Test Broadcast Button */}
      <button
        type="button"
        onClick={handleTestPush}
        disabled={isSending}
        className={`w-full py-3.5 sm:py-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl active:scale-95 transition-all shadow-xl shadow-orange-500/10 flex items-center justify-center gap-2 ${isSending ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <Zap size={16} className={isSending ? 'animate-spin' : ''} /> {isSending ? 'Sending...' : 'Broadcast Test Push'}
      </button>
    </div>
  );
};

const StoreSettings = () => {
  const { settings, refreshData, showToast } = useStore();
  const [formData, setFormData] = useState({
    shopName: '',
    shopLogo: '',
    shopBanner: '',
    experience_text: '',
    footer_copyright: '',
    footer_link_privacy: '',
    footer_link_terms: '',
    footer_link_security: '',
    footer_content_privacy: '',
    footer_content_terms: '',
    footer_content_security: '',
    subscriber_count: '',
    loc_address: '',
    loc_hours_weekday: '',
    loc_hours_sat: '',
    loc_hours_sun: '',
    loc_phone: '',
    loc_service_status: '',
    loc_city: '',
    loc_country: '',
    storeAbout: '',
    currency: 'FCFA',
    language: 'en',
    admin_key: '',
    active_template: 'chilling'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState('privacy');
 
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);
 
  useEffect(() => {
    if (settings && !isDirty) {
      setFormData({
        shopName: settings.shopName || '',
        shopLogo: settings.shopLogo || '',
        shopBanner: settings.shopBanner || '',
        experience_text: settings.experience_text || '',
        footer_copyright: settings.footer_copyright || 'ELITE LOCAL COMMERCE',
        footer_link_privacy: settings.footer_link_privacy || '/privacy',
        footer_link_terms: settings.footer_link_terms || '/terms',
        footer_link_security: settings.footer_link_security || '/security',
        footer_content_privacy: settings.footer_content_privacy || '',
        footer_content_terms: settings.footer_content_terms || '',
        footer_content_security: settings.footer_content_security || '',
        subscriber_count: settings.subscriber_count || '2,500',
        loc_address: settings.loc_address || '',
        loc_hours_weekday: settings.loc_hours_weekday || '',
        loc_hours_sat: settings.loc_hours_sat || '',
        loc_hours_sun: settings.loc_hours_sun || '',
        loc_phone: settings.loc_phone || '',
        loc_service_status: settings.loc_service_status || '',
        loc_city: settings.loc_city || '',
        loc_country: settings.loc_country || '',
        storeAbout: settings.storeAbout || '',
        currency: settings.currency || 'FCFA',
        language: settings.language || 'en',
        admin_key: settings.admin_key || '',
        active_template: settings.active_template || 'chilling'
      });
    }
  }, [settings, isDirty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resizeImage = (base64Str, maxWidth = 1200, maxHeight = 1200) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsDirty(true);
      const resized = await resizeImage(reader.result, field === 'shopLogo' ? 400 : 1200);
      setFormData(prev => ({ ...prev, [field]: resized }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Convert formData object to array of {key, value} pairs for Supabase upsert
      const settingsArray = Object.entries(formData).map(([key, value]) => ({
        key,
        value: (typeof value === 'object' && value !== null) ? JSON.stringify(value) : String(value ?? '')
      }));
      
      const { error } = await supabase.from('settings').upsert(settingsArray, { onConflict: 'key' });
      if (error) throw new Error(error.message);
      
      setIsDirty(false);
      if (refreshData) await refreshData();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      showToast('Error updating settings: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };



  const inputStyle = "w-full px-5 sm:px-7 py-3.5 sm:py-5 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10 rounded-2xl sm:rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-cyan-500/20 focus:border-blue-500 dark:focus:border-cyan-400/50 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-300 font-black text-slate-900 dark:text-white text-xs placeholder:text-slate-300 dark:placeholder:text-slate-600";
 
  return (
    <div className="min-h-screen relative overflow-hidden pb-32 selection:bg-cyan-500/30">
      {/* ─── SUCCESS WIPE & FLOATING CAPSULE ─── */}
      <AnimatePresence>
        {showSuccess && (
          <>
            {/* Top Screen Icy Blue Wipe Line */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 z-[9999] shadow-[0_4px_25px_rgba(6,182,212,0.6)]"
            />
            
            {/* Frozen Toast capsule */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-cyan-500/30 rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.15)] flex items-center gap-3 text-slate-900 dark:text-cyan-400 font-black text-[10px] uppercase tracking-widest"
            >
              <Sparkles size={14} className="text-blue-500 dark:text-cyan-400 animate-pulse" />
              <span>Settings Locked & Synchronized</span>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* ─── DYNAMIC BACKGROUND Blobs ─── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            x: [0, -40, 0],
            y: [0, 60, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[150px] rounded-full"
        />
      </div>
 
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-6 sm:space-y-10">
        
        {/* ─── PREMIUM HEADER BAR ─── */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border border-white/40 dark:border-slate-800/40 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)]"
        >
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 transform -rotate-3 shrink-0">
                <Store size={24} className="sm:hidden" />
                <Store size={32} className="hidden sm:block" />
              </div>
            </div>
            <div>
               <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Sparkles size={10} className="text-blue-500" />
                  <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] sm:tracking-[0.4em]">Engineered for Control</span>
               </div>
               <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">
                 Store <span className="text-blue-600">DNA</span>
               </h1>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <AnimatePresence>
              {isDirty && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
                >
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[8px] sm:text-[9px] font-black text-amber-600 uppercase tracking-widest">Unsaved Modifications</span>
                </motion.div>
              )}
            </AnimatePresence>
 
            <button
              onClick={handleSave}
              disabled={isLoading || !isDirty}
              className={`relative group overflow-hidden flex items-center gap-3 sm:gap-4 px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all shadow-2xl ${
                isDirty 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-slate-900/20 hover:scale-105 active:scale-95' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {isLoading ? (
                <div className="relative z-10 w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
              ) : showSuccess ? (
                <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 size={16} />
                  <span>Verified & Saved</span>
                </div>
              ) : (
                <div className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                  <Save size={16} className="group-hover:rotate-12 transition-transform" />
                  <span className="group-hover:translate-x-1 transition-transform">Deploy Updates</span>
                </div>
              )}
            </button>
          </div>
        </motion.div>
 
        {/* ─── MAIN SETTINGS GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
          
          {/* Left Column: Branding & Content */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10">
            
            {/* Store Identity Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group/card backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-cyan-500/5 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-cyan-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={Shield} 
                title="Identity Core" 
                color="blue" 
                subtitle="Primary Branding & Vision"
              />
              
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                <InputWrapper label="Master Shop Title" icon={Store}>
                  <input 
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleInputChange}
                    placeholder="e.g. SWEETO HUB"
                    className={inputStyle}
                  />
                </InputWrapper>

                <InputWrapper label="Brand Narrative (Footer About)" icon={Info}>
                  <textarea 
                    name="storeAbout"
                    value={formData.storeAbout}
                    onChange={handleInputChange}
                    rows="4"
                    className={`${inputStyle} resize-none py-6 leading-relaxed`}
                    placeholder="Describe your brand excellence..."
                  />
                </InputWrapper>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Signature Logo</label>
                    <div className="flex items-center gap-5">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700/50 group/logo relative shadow-inner"
                      >
                        {formData.shopLogo ? (
                          <>
                            <img src={formData.shopLogo} alt="Logo" className="w-full h-full object-contain p-4" />
                            <div className="absolute inset-0 bg-red-600/90 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                              <button onClick={() => { setIsDirty(true); setFormData(p => ({ ...p, shopLogo: '' })); }} className="text-white transform scale-150"><Trash2 size={16} /></button>
                            </div>
                          </>
                        ) : (
                          <div className="text-slate-300 dark:text-slate-700 flex flex-col items-center gap-1">
                             <ImageIcon size={28} />
                             <span className="text-[8px] font-black uppercase">PNG/SVG</span>
                          </div>
                        )}
                      </motion.div>
                      <button 
                        onClick={() => logoInputRef.current.click()} 
                        className="flex-1 h-24 border-2 border-dashed border-slate-100 dark:border-white/10 rounded-[2rem] text-slate-400 hover:text-blue-500 dark:hover:text-cyan-400 hover:border-blue-500/50 dark:hover:border-cyan-500/35 hover:bg-blue-500/5 dark:hover:bg-cyan-500/5 transition-all flex flex-col items-center justify-center gap-1 group/upload animate-[pulse_3s_infinite]"
                      >
                        <Plus size={20} className="group-hover/upload:rotate-90 transition-transform duration-300" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Update Logo</span>
                      </button>
                      <input type="file" ref={logoInputRef} onChange={(e) => handleImageUpload(e, 'shopLogo')} accept="image/*" className="hidden" />
                    </div>
                  </div>

                  <InputWrapper label="Global Subscriber Baseline" icon={Users}>
                    <input 
                      type="text"
                      name="subscriber_count"
                      value={formData.subscriber_count}
                      onChange={handleInputChange}
                      placeholder="e.g. 2,500"
                      className={`${inputStyle} text-center tracking-[0.2em]`}
                    />
                  </InputWrapper>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <InputWrapper label="Global Currency Setting" icon={Coins}>
                    <select 
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className={`${inputStyle} appearance-none cursor-pointer pr-10`}
                    >
                      <option value="FCFA">FCFA (CFA Franc)</option>
                      <option value="USD">USD (United States Dollar - $)</option>
                      <option value="EUR">EUR (Euro - €)</option>
                      <option value="GBP">GBP (British Pound - £)</option>
                      <option value="CAD">CAD (Canadian Dollar - CA$)</option>
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="SAR">SAR (Saudi Riyal)</option>
                      <option value="INR">INR (Indian Rupee - ₹)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </InputWrapper>

                  <InputWrapper label="Store Language" icon={Globe}>
                    <select 
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className={`${inputStyle} appearance-none cursor-pointer pr-10`}
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="fr">Français (French)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="de">Deutsch (German)</option>
                      <option value="it">Italiano (Italian)</option>
                      <option value="pt">Português (Portuguese)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ru">Русский (Russian)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </InputWrapper>
                </div>

                <div className="pt-4">
                  <InputWrapper label="Storefront Theme Template" icon={Layout}>
                    <select 
                      name="active_template"
                      value={formData.active_template}
                      onChange={handleInputChange}
                      className={`${inputStyle} appearance-none cursor-pointer pr-10`}
                    >
                      <option value="chilling">Arctic Tech Luxury (Chilling)</option>
                      <option value="bright">Bright Modern Retail (Shopify / Flipkart style)</option>
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </InputWrapper>
                </div>


              </div>
            </motion.div>

            {/* Legal Intelligence Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-indigo-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={FileText} 
                title="Legal Intelligence" 
                color="indigo" 
                subtitle="Policy Management & Enforcement"
              />
              
              <div className="flex gap-2 sm:gap-3 mb-8 p-1 sm:p-1.5 bg-slate-100/50 dark:bg-slate-950/40 rounded-2xl sm:rounded-[1.8rem] border border-slate-100/50 dark:border-white/5">
                {['privacy', 'terms', 'security'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveLegalTab(tab)}
                    className={`flex-1 py-2.5 sm:py-4 rounded-xl sm:rounded-[1.3rem] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.15em] sm:tracking-[0.25em] transition-all duration-500 ${
                      activeLegalTab === tab 
                      ? 'bg-white dark:bg-slate-900/80 text-blue-600 dark:text-cyan-400 shadow-xl shadow-blue-500/5 dark:shadow-cyan-500/10 border border-transparent dark:border-cyan-500/20' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="relative group/legal">
                <div className="absolute top-6 right-6 text-slate-100 dark:text-slate-800 pointer-events-none group-focus-within/legal:text-blue-500/10 transition-colors">
                  <FileText size={120} strokeWidth={4} />
                </div>
                <textarea 
                  name={`footer_content_${activeLegalTab}`}
                  value={formData[`footer_content_${activeLegalTab}`]}
                  onChange={handleInputChange}
                  rows="12"
                  className={`${inputStyle} relative z-10 py-8 leading-[2] font-medium text-sm`}
                  placeholder={`Write your ${activeLegalTab} policy here...`}
                ></textarea>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Visuals & Infrastructure */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-10">
            
            {/* Visual Infrastructure Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-purple-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={ImageIcon} 
                title="Visual Core" 
                color="purple" 
                subtitle="Immersive Media Assets"
              />
              
              <div className="space-y-8">
                <div className="relative w-full h-48 bg-slate-100/50 dark:bg-slate-950/60 rounded-[2.5rem] overflow-hidden group/banner border border-slate-200/50 dark:border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] shadow-inner">
                  {formData.shopBanner ? (
                    <img src={formData.shopBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-1000 group-hover/banner:scale-110" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-300">
                      <ImageIcon size={48} strokeWidth={1} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Master Hero Banner</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm opacity-0 group-hover/banner:opacity-100 transition-all duration-500 flex items-center justify-center gap-4">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => bannerInputRef.current.click()} className="w-14 h-14 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20"><Upload size={22} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setIsDirty(true); setFormData(p => ({ ...p, shopBanner: '' })); }} className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20"><Trash2 size={22} /></motion.button>
                  </div>
                  <input type="file" ref={bannerInputRef} onChange={(e) => handleImageUpload(e, 'shopBanner')} accept="image/*" className="hidden" />
                </div>

                <InputWrapper label="Hero Cinematic Hook" icon={Sparkles}>
                  <input 
                    type="text"
                    name="experience_text"
                    value={formData.experience_text}
                    onChange={handleInputChange}
                    className={inputStyle}
                    placeholder="Enter the main hero page slogan..."
                  />
                </InputWrapper>
              </div>
            </motion.div>
 
              {/* Strategic Footer Card */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="group/card backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-rose-500/5 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-rose-400/40 before:to-transparent"
              >
              <SectionHeader 
                icon={Layout} 
                title="Global Footer" 
                color="rose" 
                subtitle="Branding & Legal Anchors"
              />
              <div className="space-y-6">
                <InputWrapper label="Corporate Copyright Descriptor" icon={CheckCircle2}>
                  <input 
                    type="text"
                    name="footer_copyright"
                    value={formData.footer_copyright}
                    onChange={handleInputChange}
                    className={`${inputStyle} text-[11px]`}
                  />
                </InputWrapper>
                
                <div className="p-5 sm:p-8 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl sm:rounded-[2rem] border border-slate-100 dark:border-white/10 space-y-4 sm:space-y-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 dark:border-white/10 pb-4">Static Policy URL Routing</p>
                  {['privacy', 'terms', 'security'].map(field => (
                    <div key={field} className="flex items-center gap-4 group/path">
                      <div className="w-20 text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within/path:text-rose-500 transition-colors">{field}</div>
                      <div className="flex-1 relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"><LinkIcon size={12} /></div>
                         <input 
                          type="text"
                          name={`footer_link_${field}`}
                          value={formData[`footer_link_${field}`]}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-6 py-3 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-white/10 rounded-xl outline-none font-black text-[10px] focus:ring-4 focus:ring-rose-500/10 dark:focus:ring-rose-500/20 focus:border-rose-500 dark:focus:border-rose-400/50 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
 
            {/* Logistics & Contact Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="group/card backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-emerald-500/5 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={MapPin} 
                title="Operations Core" 
                color="emerald" 
                subtitle="Physical Logistics & Schedule"
              />
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <InputWrapper label="Street Address" icon={MapPin}>
                      <input type="text" name="loc_address" value={formData.loc_address} onChange={handleInputChange} className={`${inputStyle} py-3.5 sm:py-5 px-4 sm:px-6`} />
                    </InputWrapper>
                  </div>
                  <InputWrapper label="City">
                    <input type="text" name="loc_city" value={formData.loc_city} onChange={handleInputChange} className={`${inputStyle} py-3.5 sm:py-5 px-4 sm:px-6`} />
                  </InputWrapper>
                  <InputWrapper label="Country">
                    <input type="text" name="loc_country" value={formData.loc_country} onChange={handleInputChange} className={`${inputStyle} py-3.5 sm:py-5 px-4 sm:px-6`} />
                  </InputWrapper>
                </div>
 
                <div className="p-4 sm:p-6 bg-emerald-50/50 dark:bg-emerald-950/40 rounded-2xl sm:rounded-[2rem] border border-emerald-100/50 dark:border-white/10 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                    <InputWrapper label="Weekday" icon={Clock}>
                      <input type="text" name="loc_hours_weekday" value={formData.loc_hours_weekday} onChange={handleInputChange} className={`${inputStyle} bg-white dark:bg-slate-900 py-3 sm:py-4 px-4 sm:px-6`} />
                    </InputWrapper>
                    <InputWrapper label="Saturday">
                      <input type="text" name="loc_hours_sat" value={formData.loc_hours_sat} onChange={handleInputChange} className={`${inputStyle} bg-white dark:bg-slate-900 py-3 sm:py-4 px-4 sm:px-6`} />
                    </InputWrapper>
                  </div>
                  <InputWrapper label="Sunday / Holiday Status" icon={Clock}>
                    <input type="text" name="loc_hours_sun" value={formData.loc_hours_sun} onChange={handleInputChange} className={`${inputStyle} bg-white dark:bg-slate-900 py-3 sm:py-4 px-4 sm:px-6`} />
                  </InputWrapper>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputWrapper label="Operations Phone" icon={Phone}>
                    <input type="tel" name="loc_phone" value={formData.loc_phone} onChange={handleInputChange} className={`${inputStyle} py-3 sm:py-4 px-4 sm:px-6`} />
                  </InputWrapper>
                  <InputWrapper label="Support Descriptor" icon={Zap}>
                    <input type="text" name="loc_service_status" value={formData.loc_service_status} onChange={handleInputChange} className={`${inputStyle} py-3 sm:py-4 px-4 sm:px-6`} />
                  </InputWrapper>
                </div>
              </div>
            </motion.div>

            {/* Terminal Security Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="group/card backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-blue-500/5 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={Shield} 
                title="Terminal Security" 
                color="blue" 
                subtitle="Admin Access Controls"
              />
              <div className="space-y-6">
                <InputWrapper label="Master Decryption Key" icon={Shield}>
                  <input 
                    type="text" 
                    name="admin_key" 
                    value={formData.admin_key} 
                    onChange={handleInputChange} 
                    className={inputStyle} 
                    placeholder="Enter passcode (default: admin123)"
                  />
                </InputWrapper>
                <div className="p-6 bg-blue-500/5 dark:bg-cyan-500/5 rounded-2xl border border-blue-500/10 dark:border-cyan-500/10 text-slate-500 dark:text-slate-400 font-medium text-xs leading-relaxed">
                  <p className="font-bold text-blue-500 dark:text-cyan-400 uppercase tracking-widest text-[9px] mb-2 flex items-center gap-1.5">
                    <Info size={12} /> Security Notice
                  </p>
                  This key decrypts the admin dashboard. Changing this key will immediately require re-entry of the new key across active devices.
                </div>
              </div>
            </motion.div>

            {/* Push Notifications Management Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="group/card backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all hover:shadow-2xl hover:shadow-orange-500/5 before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-orange-400/40 before:to-transparent"
            >
              <SectionHeader 
                icon={Zap} 
                title="Push Notifications" 
                color="orange" 
                subtitle="Mobile Alerts & Broadcast"
              />
              <PushNotificationPanel showToast={showToast} />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreSettings;
