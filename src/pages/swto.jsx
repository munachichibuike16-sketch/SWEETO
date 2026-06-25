import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Tag, 
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

const SectionHeader = ({ icon: Icon, title, color, subtitle }) => {
  const accentClasses = {
    blue: 'dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25 dark:shadow-cyan-500/5',
    indigo: 'dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/25 dark:shadow-indigo-500/5',
  };

  const bgClasses = {
    blue: 'bg-blue-500/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
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

export default function SWTO() {
  const { settings, categories = [], refreshData, showToast } = useStore();
  const [visibleIds, setVisibleIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (settings) {
      try {
        let ids = settings.visible_homepage_categories || [];
        if (typeof ids === 'string') {
          ids = JSON.parse(ids);
        }
        if (Array.isArray(ids)) {
          setVisibleIds(ids.map(id => Number(id)));
        }
      } catch (e) {
        const ids = String(settings.visible_homepage_categories || '').split(',').map(id => Number(id.trim())).filter(id => !isNaN(id));
        setVisibleIds(ids);
      }
    }
  }, [settings]);

  const handleToggle = (categoryId) => {
    setIsDirty(true);
    setVisibleIds(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { error: err } = await supabase.from('settings').upsert({
        key: 'visible_homepage_categories',
        value: JSON.stringify(visibleIds)
      }, { onConflict: 'key' });
      
      if (err) throw new Error(err.message);
      
      setIsDirty(false);
      if (refreshData) await refreshData();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      showToast('Header Category Settings Saved! 🚀', 'success');
    } catch (err) {
      console.error(err);
      setError('Failed to save settings: ' + err.message);
      showToast('Error saving settings ❌', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── DYNAMIC HEADER CONTROLLER ─── */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-blue-400/45 before:to-transparent">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-32 bg-blue-500/5 dark:bg-cyan-500/2 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-cyan-400 rounded-xl flex items-center justify-center"><Tag size={20}/></div>
            SWTO Categories Ribbon
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1 ml-14">Choose which categories appear in the website header ribbon (under search box)</p>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={isLoading || !isDirty}
          className={`relative group px-8 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2.5 overflow-hidden ${isLoading || !isDirty ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <span>Save Ribbon Settings</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-55 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
            <AlertCircle size={15} className="mr-3 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── CATEGORY VISIBILITY CONTROLLER GRID ─── */}
      <div className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/40 border border-white/50 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-indigo-400/45 before:to-transparent">
        <SectionHeader 
          icon={Tag} 
          title="Categories Ribbon Visibility" 
          color="indigo" 
          subtitle="Toggle visibility on or off (Default: All L1 categories if none enabled)"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 relative z-10">
          {categories.map((cat) => {
            const isVisible = visibleIds.includes(cat.id);
            return (
              <div 
                key={cat.id} 
                onClick={() => handleToggle(cat.id)}
                className={`p-5 rounded-2xl border cursor-pointer select-none transition-all duration-300 flex justify-between items-center ${
                  isVisible 
                    ? 'bg-blue-500/5 border-blue-500/40 hover:border-blue-500/60 dark:bg-cyan-500/5 dark:border-cyan-500/40 dark:hover:border-cyan-500/60 shadow-[0_0_15px_rgba(59,130,246,0.05)]' 
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-300 dark:bg-slate-950/20 dark:border-white/5 dark:hover:border-white/10 text-slate-500'
                }`}
              >
                <div className="flex flex-col">
                  <span className={`text-[12px] font-black capitalize tracking-tight ${isVisible ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                    {cat.name}
                  </span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {cat.parent_id ? 'Subcategory' : 'Parent Category'}
                  </span>
                </div>

                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  isVisible 
                    ? 'bg-blue-500/10 text-blue-600 dark:bg-cyan-500/10 dark:text-cyan-400' 
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600'
                }`}>
                  {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
