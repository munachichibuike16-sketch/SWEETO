import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, MessageCircle, Link as LinkIcon, Search } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

/* ─── CUSTOM SOCIAL ICONS (Lucide Compatibility) ─── */
const InstagramIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
  </svg>
);
const FacebookIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const TwitterIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);
const YoutubeIcon = ({ size = 20, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
  </svg>
);

const SocialsManagement = () => {
  const { settings, refreshData, showToast } = useStore();
  const [socials, setSocials] = useState({
    social_instagram: '',
    social_facebook: '',
    social_twitter: '',
    social_whatsapp: '',
    social_youtube: '',
    social_tiktok: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (settings && !isDirty) {
      setSocials({
        social_instagram: settings.social_instagram || '',
        social_facebook: settings.social_facebook || '',
        social_twitter: settings.social_twitter || '',
        social_whatsapp: settings.social_whatsapp || '',
        social_youtube: settings.social_youtube || '',
        social_tiktok: settings.social_tiktok || ''
      });
    }
  }, [settings, isDirty]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settingsArray = Object.entries(socials).map(([key, value]) => ({ key, value: String(value ?? '') }));
      const { error } = await supabase.from('settings').upsert(settingsArray, { onConflict: 'key' });
      if (error) throw new Error(error.message);

      setIsDirty(false);
      if (refreshData) await refreshData();
      showToast('Social links updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error updating social links: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setIsDirty(true);
    setSocials({ ...socials, [key]: value });
  };

  const platforms = [
    { key: 'social_instagram', label: 'Instagram', icon: InstagramIcon, placeholder: 'https://instagram.com/yourbrand', color: 'from-pink-500 to-purple-500' },
    { key: 'social_facebook', label: 'Facebook', icon: FacebookIcon, placeholder: 'https://facebook.com/yourbrand', color: 'from-blue-600 to-blue-400' },
    { key: 'social_twitter', label: 'X (Twitter)', icon: TwitterIcon, placeholder: 'https://twitter.com/yourbrand', color: 'from-slate-900 to-slate-700' },
    { key: 'social_whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: 'https://wa.me/1234567890', color: 'from-emerald-500 to-teal-400' },
    { key: 'social_youtube', label: 'YouTube', icon: YoutubeIcon, placeholder: 'https://youtube.com/c/yourbrand', color: 'from-red-600 to-red-400' },
    { key: 'social_tiktok', label: 'TikTok', icon: LinkIcon, placeholder: 'https://tiktok.com/@yourbrand', color: 'from-slate-800 to-slate-900' },
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Social Media</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Manage your brand's digital presence and external links.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          <span>{isLoading ? 'Saving...' : 'Save Links'}</span>
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {platforms.map((platform) => (
          <motion.div
            key={platform.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${platform.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700 pointer-events-none`}></div>
            
            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${platform.color} flex items-center justify-center shadow-lg text-white`}>
                <platform.icon size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{platform.label}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Link Integration</p>
              </div>
            </div>

            <div className="relative z-10">
              <input
                type="url"
                placeholder={platform.placeholder}
                value={socials[platform.key]}
                onChange={(e) => handleChange(platform.key, e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium text-slate-900 dark:text-white"
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SocialsManagement;
