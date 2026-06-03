import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle,
  ArrowLeft, Layers, Type, Hash, Star, Zap, Clock, TrendingUp,
  Smartphone, Monitor, Speaker, Snowflake, Gift, Flame, Grip,
  Eye, EyeOff, ChevronUp, ChevronDown
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';
const ROLES = [
  { key: 'hero',                  label: 'Hero Banner',      icon: Layers,      color: 'indigo'  },
  { key: 'video_ad',              label: 'Video/Image Ad',   icon: Monitor,     color: 'rose'    },
  { key: 'featured',               label: 'Featured',        icon: Star,        color: 'amber'   },
  { key: 'trending',               label: 'Trending',        icon: TrendingUp,  color: 'rose'    },
  { key: 'dealOfDay',              label: 'Deal of Day',     icon: Zap,         color: 'blue'    },
  { key: 'newArrival',             label: 'New Arrival',     icon: Clock,       color: 'emerald' },
  { key: 'smartphonesPlacement',   label: 'Mobiles',         icon: Smartphone,  color: 'indigo'  },
  { key: 'homeCinemaPlacement',    label: 'Home Cinema',     icon: Monitor,     color: 'violet'  },
  { key: 'speakersPlacement',      label: 'Speakers',        icon: Speaker,     color: 'fuchsia' },
  { key: 'refrigeratorsPlacement', label: 'Refrigerators',   icon: Snowflake,   color: 'cyan'    },
  { key: 'flashSale',              label: 'Flash Sale',      icon: Flame,       color: 'orange'  },
  { key: 'giftIdeas',              label: 'Gift Ideas',      icon: Gift,        color: 'pink'    },
  { key: 'custom',                 label: 'Custom',          icon: Layers,      color: 'slate'   },
];

const HEADER_STYLES = [
  { key: 'gradient',  label: 'Banner',    preview: 'bg-gradient-to-r from-blue-600 to-indigo-600' },
  { key: 'bold',      label: 'Bold',      preview: 'bg-white border-l-4 border-slate-900' },
  { key: 'minimal',   label: 'Minimal',   preview: 'bg-transparent border-b-2 border-slate-200' },
  { key: 'outlined',  label: 'Outlined',  preview: 'border-2 border-slate-900' },
  { key: 'accent',    label: 'Accent',    preview: 'bg-gradient-to-r from-eas-blue to-purple-600' },
  { key: 'neon',      label: 'Neon',      preview: 'bg-black border border-emerald-500' },
  { key: 'glass',     label: 'Glass',     preview: 'bg-white/30 backdrop-blur-md border border-white/20' },
];

const ROLE_COLORS = {
  amber:   'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  rose:    'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  blue:    'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  emerald: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  indigo:  'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  violet:  'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400',
  fuchsia: 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400',
  cyan:    'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  orange:  'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  pink:    'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  slate:   'border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-600 dark:text-slate-400',
};

const EMPTY = {
  title: '', subtitle: '', role: '', headerStyle: 'gradient', headerImage: '',
  position: '', isActive: true, showViewAll: true, maxProducts: 8,
  category: 'All', isDual: false,
  titleB: '', subtitleB: '', roleB: 'trending', headerStyleB: 'bold',
  categoryB: 'All', headerImageB: ''
};

const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

export default function SectionManagement() {
  const { sections = [], refreshData, categories = [], videoAds = [] } = useStore();
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setError(''); setSuccess(''); setView('form'); };
  const openEdit = (s) => {
    setForm({
      title: s.title||'', subtitle: s.subtitle||'', role: s.role||'',
      headerStyle: s.headerStyle||'gradient', headerImage: s.headerImage||'', position: s.position||'',
      isActive: s.isActive !== false, showViewAll: s.showViewAll !== false,
      maxProducts: s.maxProducts||8,
      category: s.category||'All',
      isDual: s.isDual === true || s.isDual === 1 || false,
      titleB: s.titleB||'', subtitleB: s.subtitleB||'', roleB: s.roleB||'trending',
      headerStyleB: s.headerStyleB||'bold', categoryB: s.categoryB||'All',
      headerImageB: s.headerImageB||''
    });
    setEditingId(s.id); setError(''); setSuccess(''); setView('form');
  };
  const backToList = () => { setView('list'); setEditingId(null); setForm(EMPTY); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.title.trim()) { 
      setError(form.isDual ? 'Overall Section Title is required.' : 'Section Title is required.'); 
      return; 
    }
    
    if (!form.isDual) {
      if (!form.role) { setError('Please select a section role.'); return; }
    }

    setIsSubmitting(true);
    try {
      // 1. Payload tailored specifically for Supabase (uses lowercase/snake_case for columns)
      const supabasePayload = {
        title: form.title,
        subtitle: form.subtitle,
        position: parseInt(form.position) || 0,
        is_active: form.isActive ? 1 : 0,
        is_dual: form.isDual ? 1 : 0,
        show_view_all: form.showViewAll ? 1 : 0,
        max_products: parseInt(form.maxProducts) || 8,
        header_style: form.headerStyle || 'gradient',
        header_image: form.headerImage || '',
        category: form.category || 'All',
        role: form.isDual ? 'custom' : form.role,
        titleb: form.isDual ? (form.titleB || null) : null,
        subtitleb: form.isDual ? (form.subtitleB || null) : null,
        categoryb: form.isDual ? (form.categoryB || 'All') : (form.role === 'dealOfDay' ? (form.categoryB || 'All') : 'All'),
        roleb: form.isDual ? (form.roleB || 'custom') : 'custom',
        headerstyleb: form.isDual ? (form.headerStyleB || 'bold') : 'bold',
        headerimageb: form.isDual ? (form.headerImageB || null) : null
      };

      // 2. Payload tailored specifically for SQLite local backend (uses camelCase matching server.js destructuring)
      const sqlitePayload = {
        role: form.isDual ? 'custom' : form.role,
        title: form.title,
        subtitle: form.subtitle,
        category: form.category || 'All',
        maxProducts: parseInt(form.maxProducts) || 8,
        position: parseInt(form.position) || 0,
        isActive: form.isActive ? 1 : 0,
        headerStyle: form.headerStyle || 'gradient',
        headerImage: form.headerImage || '',
        isDual: form.isDual ? 1 : 0,
        titleB: form.isDual ? (form.titleB || null) : null,
        subtitleB: form.isDual ? (form.subtitleB || null) : null,
        categoryB: form.isDual ? (form.categoryB || 'All') : (form.role === 'dealOfDay' ? (form.categoryB || 'All') : 'All'),
        roleB: form.isDual ? (form.roleB || 'custom') : 'custom',
        headerStyleB: form.isDual ? (form.headerStyleB || 'bold') : 'bold',
        headerImageB: form.isDual ? (form.headerImageB || null) : null
      };

      const isLocalhost = isLocalHost();

      if (editingId) {
        // Update in Supabase
        const { error: err } = await supabase
          .from('sections')
          .update(supabasePayload)
          .eq('id', editingId);
        if (err) throw err;
        
        // Update in local SQLite if running
        if (isLocalhost) {
          try {
            const res = await apiFetch(`sections/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sqlitePayload)
            });
            if (!res.ok) console.warn('Local SQLite write responded with error status:', res.status);
          } catch (e) {
            console.warn('Local SQLite write failed:', e);
          }
        }
      } else {
        // Create in Supabase
        const uniqueKey = form.isDual ? `dual_${Date.now()}` : `${form.role || 'section'}_${Date.now()}`;
        const { error: err } = await supabase
          .from('sections')
          .insert([{ ...supabasePayload, key: uniqueKey }]);
        if (err) throw err;

        // Create in local SQLite if running
        if (isLocalhost) {
          try {
            const res = await apiFetch('sections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...sqlitePayload, key: uniqueKey })
            });
            if (!res.ok) console.warn('Local SQLite write responded with error status:', res.status);
          } catch (e) {
            console.warn('Local SQLite write failed:', e);
          }
        }
      }

      setSuccess(editingId ? 'Section updated!' : 'Section created!');
      refreshData();
      setTimeout(() => backToList(), 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to save section: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const isLocalhost = isLocalHost();
    try {
      // Delete in Supabase
      const { error: err } = await supabase.from('sections').delete().eq('id', id);
      if (err) throw err;

      // Delete in local SQLite
      if (isLocalhost) {
        try {
          const res = await apiFetch(`sections/${id}`, { method: 'DELETE' });
          if (!res.ok) console.warn('Local SQLite delete responded with error status:', res.status);
        } catch (e) {
          console.warn('Local SQLite delete failed:', e);
        }
      }

      refreshData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete section.');
    } finally {
      setDeletingId(null);
      setConfirmDel(null);
    }
  };

  const movePosition = async (s, direction) => {
    const currentIndex = sorted.findIndex(sec => sec.id === s.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const neighbor = sorted[targetIndex];
    const newPos = neighbor.position || 0;
    const oldPos = s.position || 0;

    const finalNewPos = direction === 'up' ? Math.max(0, newPos) : newPos;
    const finalOldPos = direction === 'up' ? newPos + 1 : Math.max(0, newPos - 1);

    const isLocalhost = isLocalHost();

    try {
      // Swap positions in Supabase
      await Promise.all([
        supabase.from('sections').update({ position: finalNewPos }).eq('id', s.id),
        supabase.from('sections').update({ position: finalOldPos }).eq('id', neighbor.id)
      ]);

      // Swap in local SQLite
      if (isLocalhost) {
        try {
          const results = await Promise.all([
            apiFetch(`sections/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, position: finalNewPos }) }),
            apiFetch(`sections/${neighbor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...neighbor, position: finalOldPos }) })
          ]);
          results.forEach((res, index) => {
            if (!res.ok) console.warn(`SQLite position swap endpoint ${index} responded with error status:`, res.status);
          });
        } catch (e) {
          console.warn('Local SQLite position swap failed:', e);
        }
      }

      refreshData();
    } catch (e) {
      console.error('Failed to swap positions', e);
    }
  };

  const toggleActive = async (s) => {
    const nextActive = !s.isActive;
    const isLocalhost = isLocalHost();
    try {
      // Toggle in Supabase
      await supabase.from('sections').update({ is_active: nextActive ? 1 : 0 }).eq('id', s.id);

      // Toggle in local SQLite
      if (isLocalhost) {
        try {
          const res = await apiFetch(`sections/${s.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...s, isActive: nextActive }) });
          if (!res.ok) console.warn('Local SQLite active toggle responded with error status:', res.status);
        } catch (e) {
          console.warn('Local SQLite active toggle failed:', e);
        }
      }

      refreshData();
    } catch (e) {
      console.error(e);
    }
  };

  const getRoleInfo = (key) => ROLES.find(r => r.key === key);
  const sorted = [...(sections || [])].sort((a, b) => (a.position || 0) - (b.position || 0));

  /* ── LIST VIEW ── */
  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500"><Layers size={20}/></div>
            Section Management
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">{sections.length} storefront sections configured</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-orange-500/20">
          <Plus size={16}/> New Section
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4"><Layers className="text-orange-400" size={28}/></div>
          <p className="font-black text-slate-900 dark:text-white text-lg mb-2">No Sections Yet</p>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Create your first storefront section to organize products into themed groups.</p>
          <button onClick={openAdd} className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 transition-all"><Plus size={14}/>Create First Section</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((s, i) => {
            const role = getRoleInfo(s.role);
            const style = HEADER_STYLES.find(h => h.key === s.headerStyle);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2rem] p-6 shadow-xl shadow-slate-200/20 dark:shadow-none hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/10 transition-all group flex flex-col ${!s.isActive ? 'opacity-50 grayscale hover:grayscale-0' : ''}`}>
                
                {/* Header: Position & Actions */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
                      <button onClick={() => movePosition(s, 'up')} disabled={i === 0} className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-10"><ChevronUp size={12}/></button>
                      <div className="h-px bg-slate-100 dark:bg-slate-700 w-full" />
                      <button onClick={() => movePosition(s, 'down')} disabled={i === sorted.length - 1} className="p-1 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-orange-500 transition-colors disabled:opacity-10"><ChevronDown size={12}/></button>
                    </div>
                    <span className="text-[10px] font-black text-slate-900 dark:text-white w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">#{i + 1}</span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => toggleActive(s)} title={s.isActive ? 'Hide section' : 'Show section'} className={`p-2 rounded-xl transition-all shadow-sm ${s.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 hover:scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:scale-110'}`}>{s.isActive ? <Eye size={14}/> : <EyeOff size={14}/>}</button>
                    <button onClick={() => openEdit(s)} className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl hover:scale-110 transition-all shadow-sm"><Edit size={14}/></button>
                    <button onClick={() => setConfirmDel({ id: s.id, name: s.title })} disabled={deletingId === s.id} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:scale-110 transition-all shadow-sm">{deletingId === s.id ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}</button>
                  </div>
                </div>

                {/* Content: Title & Details */}
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight mb-1">{s.title || (s.role === 'video_ad' ? 'Video/Image Ad' : 'Untitled Section')}</h3>
                  {s.role === 'video_ad' && (
                    <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mb-2">
                      {s.category && s.category !== 'All' 
                        ? `Ad: ${videoAds.find(ad => String(ad.id) === String(s.category))?.title || `Ad #${s.category}`}`
                        : 'Ad: Rotating Active Ads'}
                    </p>
                  )}
                  {s.role === 'dealOfDay' && (
                    <p className="text-[10px] text-pink-500 font-bold uppercase tracking-widest mb-2">
                      {s.categoryB && s.categoryB !== 'All' 
                        ? `Side Ad: ${videoAds.find(ad => String(ad.id) === String(s.categoryB))?.title || `Ad #${s.categoryB}`}`
                        : 'Side Ad: Rotating Active Ads'}
                    </p>
                  )}
                  {s.subtitle && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 truncate">{s.subtitle}</p>}
                </div>

                {/* Footer: Tags */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {s.isDual ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-[8px] font-black uppercase tracking-widest">
                      Split Dual Section
                    </span>
                  ) : role ? (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${ROLE_COLORS[role.color]}`}>
                      <role.icon size={10}/>{role.label}
                    </span>
                  ) : <span className="text-xs text-slate-400">—</span>}
                  
                  <span className="text-[8px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg uppercase tracking-widest ml-auto">{style?.label || s.headerStyle}</span>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Trash2 className="text-red-500" size={24}/></div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white uppercase mb-2">Delete Section?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Remove <span className="font-black text-slate-900 dark:text-white">"{confirmDel.name}"</span> permanently?</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDel.id)} disabled={!!deletingId} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60">
                  {deletingId ? <Loader2 size={16} className="animate-spin"/> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ── FORM VIEW ── */
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={backToList} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ArrowLeft size={18}/></button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Section' : 'Create New Section'}</h2>
          <p className="text-slate-500 text-sm font-medium">Configure how this section appears on your storefront</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">

          {/* Section Layout Mode */}
          <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6">
            <label className={lbl}>Section Layout Mode</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <button type="button" onClick={() => setForm(p => ({ ...p, isDual: false }))}
                className={`py-4 px-6 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${!form.isDual ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-300'}`}>
                Single Block Layout (Standard)
              </button>
              <button type="button" onClick={() => setForm(p => ({ ...p, isDual: true }))}
                className={`py-4 px-6 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${form.isDual ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-lg shadow-orange-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-300'}`}>
                Split Dual Layout (Side A & B Side-by-Side)
              </button>
            </div>
          </div>

          {!form.isDual ? (
            /* ── SINGLE SECTION FORM ── */
            <div className="space-y-8 animate-fadeIn">
              {/* Basic Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className={lbl}><Type size={12}/> Section Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Deal of the Day" className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Subtitle / Tagline</label>
                  <input type="text" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Limited time offers, don't miss out!" className={inp}/>
                </div>
                <div>
                  <label className={lbl}><Hash size={12}/> Position (display order)</label>
                  <input type="number" min="1" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. 1 = first on page" className={`${inp} font-mono font-bold`}/>
                </div>
                <div>
                  <label className={lbl}>Max Products to Show</label>
                  <input type="number" min="1" max="50" value={form.maxProducts} onChange={e => setForm(p => ({ ...p, maxProducts: e.target.value }))} className={`${inp} font-mono font-bold`}/>
                </div>
                {form.role === 'video_ad' ? (
                  <div>
                    <label className={lbl}>Choose Video/Image Ad to Display</label>
                    <select value={form.category || 'All'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                      <option value="All">Rotate Active Ads (Default)</option>
                      {videoAds.filter(ad => ad.isActive).map(ad => (
                        <option key={ad.id} value={String(ad.id)}>{ad.title} ({ad.type})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={lbl}>Filter by Product Category</label>
                      <select value={form.category || 'All'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                        <option value="All">All Categories (No filter)</option>
                        {categories.map(cat => (
                          <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    {form.role === 'dealOfDay' && (
                      <div>
                        <label className={lbl}>Choose Side Promo Video/Image Ad</label>
                        <select value={form.categoryB || 'All'} onChange={e => setForm(p => ({ ...p, categoryB: e.target.value }))} className={inp}>
                          <option value="All">Rotate Active Ads (Default)</option>
                          {videoAds.filter(ad => ad.isActive).map(ad => (
                            <option key={ad.id} value={String(ad.id)}>{ad.title} ({ad.type})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className={lbl}>Side Banner Image URL (Optional)</label>
                  <input type="text" value={form.headerImage || ''} onChange={e => setForm(p => ({ ...p, headerImage: e.target.value }))} placeholder="e.g. https://images.unsplash.com/... or /images/banner.jpg" className={inp}/>
                </div>
              </div>

              {/* Role Selection */}
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                <label className={`${lbl} mb-5`}>Section Role — what type of products does this section display?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ROLES.map(({ key, label, icon: Icon, color }) => (
                    <button key={key} type="button" onClick={() => setForm(p => ({ ...p, role: key }))}
                      className={`flex items-center gap-2 py-3.5 px-4 rounded-2xl border-2 transition-all font-black tracking-widest text-xs ${form.role === key ? ROLE_COLORS[color] : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-300'}`}>
                      <Icon size={13}/>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header Style */}
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
                <label className={`${lbl} mb-5`}>Header Style — choose the visual appearance of the section header</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {HEADER_STYLES.map(({ key, label, preview }) => (
                    <button key={key} type="button" onClick={() => setForm(p => ({ ...p, headerStyle: key }))}
                      className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.headerStyle === key ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
                      <div className={`w-full h-7 rounded-xl ${preview} flex items-center justify-center`}>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow">Aa</span>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${form.headerStyle === key ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── DUAL SECTION FORM (SIDE A vs SIDE B) ── */
            <div className="space-y-8 animate-fadeIn">
              {/* Common Details (Overall Title & Position) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/30 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6">
                <div className="md:col-span-2">
                  <label className={lbl}><Type size={12}/> Overall Section Title *</label>
                  <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Electronics & Bags Split" className={inp}/>
                  <span className="text-[9px] text-slate-400 font-medium mt-1 block">Specify the main overall title to identify this section in your admin list.</span>
                </div>
                <div>
                  <label className={lbl}><Hash size={12}/> Position (display order)</label>
                  <input type="number" min="1" value={form.position} onChange={e => setForm(p => ({ ...p, position: e.target.value }))} placeholder="e.g. 1 = first on page" className={`${inp} font-mono font-bold bg-white dark:bg-slate-900`}/>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* ── SIDE A CARD ── */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[2.5rem] border-2 border-orange-500/20 p-8 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-black">A</span>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Side A (Left Block)</h4>
                  </div>

                  <div>
                    <label className={lbl}>Filter by Side A Category</label>
                    <select value={form.category || 'All'} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inp}>
                      <option value="All">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Side A Header Custom Name (Optional)</label>
                    <input type="text" value={form.subtitle} onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="e.g. Premium Electronics (Defaults to category name if empty)" className={inp}/>
                  </div>



                  <div>
                    <label className={`${lbl} mb-3`}>Side A Header Style / Color</label>
                    <div className="grid grid-cols-3 gap-2">
                      {HEADER_STYLES.slice(0, 6).map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => setForm(p => ({ ...p, headerStyle: key }))}
                          className={`py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-widest text-center transition-all ${form.headerStyle === key ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── SIDE B CARD ── */}
                <div className="bg-slate-50 dark:bg-slate-950/30 rounded-[2.5rem] border-2 border-indigo-500/20 p-8 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
                    <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black">B</span>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider">Side B (Right Block)</h4>
                  </div>

                  <div>
                    <label className={lbl}>Filter by Side B Category</label>
                    <select value={form.categoryB || 'All'} onChange={e => setForm(p => ({ ...p, categoryB: e.target.value }))} className={inp}>
                      <option value="All">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Side B Header Custom Name (Optional)</label>
                    <input type="text" value={form.titleB} onChange={e => setForm(p => ({ ...p, titleB: e.target.value }))} placeholder="e.g. Elegant Handbags (Defaults to category name if empty)" className={inp}/>
                  </div>



                  <div>
                    <label className={`${lbl} mb-3`}>Side B Header Style / Color</label>
                    <div className="grid grid-cols-3 gap-2">
                      {HEADER_STYLES.slice(0, 6).map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => setForm(p => ({ ...p, headerStyleB: key }))}
                          className={`py-2 px-1 rounded-xl border text-[9px] font-black uppercase tracking-widest text-center transition-all ${form.headerStyleB === key ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'isActive', label: 'Section Active', desc: 'Show this section on the storefront' },
              { key: 'showViewAll', label: 'Show "View All" button', desc: 'Let customers browse all products in this section' },
            ].map(({ key, label, desc }) => (
              <button key={key} type="button" onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${form[key] ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
                <div className={`w-12 h-6 rounded-full transition-all relative ${form[key] ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? 'left-7' : 'left-1'}`}/>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${form[key] ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500'}`}>{label}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6">
            <label className={`${lbl} mb-4`}>Live Preview</label>
            {!form.isDual ? (
              (() => {
                const roleInfo = ROLES.find(r => r.key === form.role);
                const style = HEADER_STYLES.find(h => h.key === form.headerStyle) || HEADER_STYLES[0];
                return (
                  <div className={`w-full px-8 py-5 rounded-2xl flex items-center justify-between ${style.preview}`}>
                    <div>
                      <p className="text-white font-black text-lg tracking-tight drop-shadow">{form.title || 'Section Title'}</p>
                      {form.subtitle && <p className="text-white/70 text-sm font-medium mt-1">{form.subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      {roleInfo && <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl"><roleInfo.icon size={10}/>{roleInfo.label}</span>}
                      {form.showViewAll && <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl">View All →</span>}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Side A Preview */}
                {(() => {
                  const displayTitle = form.subtitle || form.category || 'All Categories';
                  return (
                    <div className={`px-6 py-4 rounded-xl flex items-center justify-between border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent`}>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-orange-500 mb-1">Side A</div>
                        <p className="text-slate-900 dark:text-white font-black text-md tracking-tight leading-tight">{displayTitle}</p>
                        <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Category: {form.category || 'All'}</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Side B Preview */}
                {(() => {
                  const displayTitleB = form.titleB || form.categoryB || 'All Categories';
                  return (
                    <div className={`px-6 py-4 rounded-xl flex items-center justify-between border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-transparent`}>
                      <div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-indigo-500 mb-1">Side B</div>
                        <p className="text-slate-900 dark:text-white font-black text-md tracking-tight leading-tight">{displayTitleB}</p>
                        <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-slate-400">Category: {form.categoryB || 'All'}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : editingId ? 'Update Section' : 'Create Section'}
          </button>

          <AnimatePresence>
            {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20"><AlertCircle size={15} className="mr-3 shrink-0"/>{error}</motion.div>}
            {success && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 size={15} className="mr-3 shrink-0"/>{success}</motion.div>}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
