import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Sparkles, 
  Tag, 
  Type, 
  Percent, 
  Coins, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

const SectionHeader = ({ icon: Icon, title, color, subtitle }) => {
  const accentClasses = {
    blue: 'dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25 dark:shadow-cyan-500/5',
    indigo: 'dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/25 dark:shadow-indigo-500/5',
    purple: 'dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25 dark:shadow-purple-500/5',
    emerald: 'dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25 dark:shadow-emerald-500/5'
  };

  const bgClasses = {
    blue: 'bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450'
  };

  const currentAccent = accentClasses[color] || accentClasses.blue;
  const currentBg = bgClasses[color] || bgClasses.blue;

  return (
    <div className="flex items-center gap-6 mb-8 md:mb-10 relative z-10">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800 shadow-lg ${currentBg} ${currentAccent}`}>
        <Icon size={22} className="animate-pulse" />
      </div>
      <div>
        <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] leading-none mb-1.5">{title}</h3>
        <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );
};

const InputWrapper = ({ label, icon: Icon, children }) => {
  return (
    <div className="space-y-3 relative group/input">
      <label className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 transition-colors group-hover/input:text-blue-500 dark:group-hover/input:text-cyan-400 ml-1">
        {Icon && <Icon size={12} />}
        {label}
      </label>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};

export default function Sweeto() {
  const { settings, categories = [], refreshData, showToast } = useStore();
  const [formData, setFormData] = useState({
    bright_hero_title: 'SUMMER 10% SALE',
    bright_hero_subtitle: 'Under Favorable Smart Gadgets',
    bright_hero_price: 'FROM $399.99',
    bright_hero_promo_code: 'SUMMER10',
    bright_hero_image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=500',
    bright_promo1_title: 'Smart Mobiles',
    bright_promo1_subtitle: 'Discover Trends',
    bright_promo1_image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
    bright_promo2_title: 'Smart Headset',
    bright_promo2_subtitle: 'Hi-Fi Audio Experience',
    bright_promo2_image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
    bright_promo3_title: 'Portable Speaker',
    bright_promo3_subtitle: 'Bluetooth Waterproof',
    bright_promo3_image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400',
    bright_wide_banner_title: 'Get Up To 85% OFF on big billion day 2021',
    bright_wide_banner_subtitle: 'Big Saving on Top selling Smartphone',
    bright_wide_banner_image: 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=1200',
    visible_homepage_categories: '[]'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings && !isDirty) {
      setFormData({
        bright_hero_title: settings.bright_hero_title || 'SUMMER 10% SALE',
        bright_hero_subtitle: settings.bright_hero_subtitle || 'Under Favorable Smart Gadgets',
        bright_hero_price: settings.bright_hero_price || 'FROM $399.99',
        bright_hero_promo_code: settings.bright_hero_promo_code || 'SUMMER10',
        bright_hero_image: settings.bright_hero_image || 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=500',
        bright_promo1_title: settings.bright_promo1_title || 'Smart Mobiles',
        bright_promo1_subtitle: settings.bright_promo1_subtitle || 'Discover Trends',
        bright_promo1_image: settings.bright_promo1_image || 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=400',
        bright_promo2_title: settings.bright_promo2_title || 'Smart Headset',
        bright_promo2_subtitle: settings.bright_promo2_subtitle || 'Hi-Fi Audio Experience',
        bright_promo2_image: settings.bright_promo2_image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400',
        bright_promo3_title: settings.bright_promo3_title || 'Portable Speaker',
        bright_promo3_subtitle: settings.bright_promo3_subtitle || 'Bluetooth Waterproof',
        bright_promo3_image: settings.bright_promo3_image || 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=400',
        bright_wide_banner_title: settings.bright_wide_banner_title || 'Get Up To 85% OFF on big billion day 2021',
        bright_wide_banner_subtitle: settings.bright_wide_banner_subtitle || 'Big Saving on Top selling Smartphone',
        bright_wide_banner_image: settings.bright_wide_banner_image || 'https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=1200',
        visible_homepage_categories: settings.visible_homepage_categories || '[]'
      });
    }
  }, [settings, isDirty]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const settingsArray = Object.entries(formData).map(([key, value]) => ({
        key,
        value: String(value ?? '')
      }));
      
      const { error: err } = await supabase.from('settings').upsert(settingsArray, { onConflict: 'key' });
      if (err) throw new Error(err.message);
      
      setIsDirty(false);
      if (refreshData) await refreshData();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      showToast('Bright Theme Settings Saved! 🚀', 'success');
    } catch (err) {
      console.error(err);
      setError('Failed to save settings: ' + err.message);
      showToast('Error saving settings ❌', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = "w-full px-5 sm:px-7 py-3.5 sm:py-5 bg-slate-50/50 dark:bg-slate-950/60 border border-slate-100 dark:border-white/10 rounded-2xl sm:rounded-[1.5rem] outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-cyan-500/20 focus:border-blue-500 dark:focus:border-cyan-400/50 focus:bg-white dark:focus:bg-slate-950/80 transition-all duration-300 font-black text-slate-900 dark:text-white text-xs placeholder:text-slate-300 dark:placeholder:text-slate-600";

  return (
    <div className="space-y-6">
      {/* ─── DYNAMIC HEADER CONTROLLER ─── */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/45 before:to-transparent">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-32 bg-blue-500/5 dark:bg-cyan-500/2 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-cyan-400 rounded-xl flex items-center justify-center"><Sparkles size={20}/></div>
            Bright Customizer
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1 ml-14">Configure sections and promotional components for the Bright storefront template</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isLoading}
          className={`relative group px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2.5 overflow-hidden ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>Saved Successfully</span>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
                <Save size={16} />
                <span>Save Front Settings</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
            <AlertCircle size={15} className="mr-3 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SETTINGS FORMS GRID ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Hero & Wide Banner */}
        <div className="space-y-8">
          {/* Hero Section settings */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/40 before:to-transparent">
            <SectionHeader 
              icon={Sparkles} 
              title="Hero Banner Settings" 
              color="blue" 
              subtitle="Primary Top Showcase Configuration"
            />
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWrapper label="Hero Badge Text" icon={Tag}>
                  <input type="text" name="bright_hero_subtitle" value={formData.bright_hero_subtitle} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Hero Main Title" icon={Type}>
                  <input type="text" name="bright_hero_title" value={formData.bright_hero_title} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Hero Price Text" icon={Coins}>
                  <input type="text" name="bright_hero_price" value={formData.bright_hero_price} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Hero Promo Code" icon={Percent}>
                  <input type="text" name="bright_hero_promo_code" value={formData.bright_hero_promo_code} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
              </div>
              <InputWrapper label="Hero Image URL" icon={ImageIcon}>
                <input type="text" name="bright_hero_image" value={formData.bright_hero_image} onChange={handleInputChange} className={inputStyle} />
              </InputWrapper>
            </div>
          </div>

          {/* Wide Banner Settings */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-400/40 before:to-transparent">
            <SectionHeader 
              icon={Percent} 
              title="Wide Saving Billboard" 
              color="emerald" 
              subtitle="Middle Banner Discount Advertisement"
            />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWrapper label="Billboard Subtitle" icon={Tag}>
                  <input type="text" name="bright_wide_banner_subtitle" value={formData.bright_wide_banner_subtitle} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Billboard Title" icon={Type}>
                  <input type="text" name="bright_wide_banner_title" value={formData.bright_wide_banner_title} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
              </div>
              <InputWrapper label="Billboard Image URL" icon={ImageIcon}>
                <input type="text" name="bright_wide_banner_image" value={formData.bright_wide_banner_image} onChange={handleInputChange} className={inputStyle} />
              </InputWrapper>
            </div>
          </div>

          {/* Homepage Categories Ribbon Settings */}
          <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/45 before:to-transparent animate-fade-in">
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-40 h-16 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none" />
            <SectionHeader 
              icon={Tag} 
              title="Homepage Categories Ribbon" 
              color="blue" 
              subtitle="Choose which categories appear under the search box"
            />
            <div className="space-y-4 relative z-10">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Select Categories to Display (Default: Shows all parent categories if none selected)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto no-scrollbar p-1">
                {categories.map((cat) => {
                  let visibleIds = [];
                  try {
                    visibleIds = JSON.parse(formData.visible_homepage_categories || '[]');
                  } catch (e) {}
                  
                  const isChecked = visibleIds.includes(cat.id);

                  const handleCheckboxChange = (checked) => {
                    let nextIds = [...visibleIds];
                    if (checked) {
                      if (!nextIds.includes(cat.id)) nextIds.push(cat.id);
                    } else {
                      nextIds = nextIds.filter(id => id !== cat.id);
                    }
                    setIsDirty(true);
                    setFormData(prev => ({
                      ...prev,
                      visible_homepage_categories: JSON.stringify(nextIds)
                    }));
                  };

                  return (
                    <label 
                      key={cat.id} 
                      className="flex items-center gap-3 p-3.5 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5 rounded-2xl cursor-pointer hover:border-blue-500/30 dark:hover:border-cyan-500/30 transition-all select-none"
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={(e) => handleCheckboxChange(e.target.checked)}
                        className="rounded border-slate-200 dark:border-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-opacity-25 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-slate-850 dark:text-slate-250 capitalize">
                          {cat.name}
                        </span>
                        {cat.parent_id && (
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-0.5">
                            Subcategory
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 3-Column Promo Cards */}
        <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-indigo-400/40 before:to-transparent">
          <SectionHeader 
            icon={Tag} 
            title="3-Column Promo Cards" 
            color="indigo" 
            subtitle="Homepage Grid Category Promos"
          />

          <div className="space-y-8">
            {/* Card 1 */}
            <div className="space-y-4">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-cyan-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span> Card 1 (Left Column)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWrapper label="Title" icon={Type}>
                  <input type="text" name="bright_promo1_title" value={formData.bright_promo1_title} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Subtitle" icon={Tag}>
                  <input type="text" name="bright_promo1_subtitle" value={formData.bright_promo1_subtitle} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
              </div>
              <InputWrapper label="Image URL" icon={ImageIcon}>
                <input type="text" name="bright_promo1_image" value={formData.bright_promo1_image} onChange={handleInputChange} className={inputStyle} />
              </InputWrapper>
            </div>

            {/* Card 2 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-cyan-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span> Card 2 (Center Column)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWrapper label="Title" icon={Type}>
                  <input type="text" name="bright_promo2_title" value={formData.bright_promo2_title} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Subtitle" icon={Tag}>
                  <input type="text" name="bright_promo2_subtitle" value={formData.bright_promo2_subtitle} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
              </div>
              <InputWrapper label="Image URL" icon={ImageIcon}>
                <input type="text" name="bright_promo2_image" value={formData.bright_promo2_image} onChange={handleInputChange} className={inputStyle} />
              </InputWrapper>
            </div>

            {/* Card 3 */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 dark:text-cyan-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current"></span> Card 3 (Right Column)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputWrapper label="Title" icon={Type}>
                  <input type="text" name="bright_promo3_title" value={formData.bright_promo3_title} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
                <InputWrapper label="Subtitle" icon={Tag}>
                  <input type="text" name="bright_promo3_subtitle" value={formData.bright_promo3_subtitle} onChange={handleInputChange} className={inputStyle} />
                </InputWrapper>
              </div>
              <InputWrapper label="Image URL" icon={ImageIcon}>
                <input type="text" name="bright_promo3_image" value={formData.bright_promo3_image} onChange={handleInputChange} className={inputStyle} />
              </InputWrapper>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
