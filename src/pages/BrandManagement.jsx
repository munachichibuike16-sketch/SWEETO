import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle, Search, Image as ImageIcon, Award, FileText, ArrowLeft } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';

const EMPTY = { name: '', description: '', logo_url: '', website: '' };
const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

export default function BrandManagement() {
  const { brands = [], refreshData } = useStore();
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setError(''); setSuccess(''); setView('form'); };
  const openEdit = (b) => { setForm({ name: b.name||'', description: b.description||'', logo_url: b.logo_url||'', website: b.website||'' }); setEditingId(b.id); setError(''); setSuccess(''); setView('form'); };
  const backToList = () => { setView('list'); setEditingId(null); setForm(EMPTY); setError(''); setSuccess(''); };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { setIsUploading(true); const blob = await compressImage(file); const url = await uploadToStorage(blob, 'brands'); setForm(p => ({ ...p, logo_url: url })); }
    catch { setError('Logo upload failed.'); } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name.trim()) { setError('Brand name is required.'); return; }
    setIsSubmitting(true);
    try {
      const slugVal = form.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const supabasePayload = {
        name: form.name.trim(),
        slug: slugVal,
        logo: form.logo_url || null,
        description: form.description?.trim() || null
      };

      const isLocalhost = isLocalHost();

      if (editingId) {
        // Update in Supabase
        const { error: sbErr } = await supabase
          .from('brands')
          .update(supabasePayload)
          .eq('id', editingId);
        if (sbErr) throw sbErr;

        // Update in SQLite
        if (isLocalhost) {
          try {
            const res = await apiFetch(`brands/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...form, slug: slugVal })
            });
            if (!res.ok) console.warn('SQLite Brand update responded with error status:', res.status);
          } catch (e) {
            console.warn('SQLite Brand update failed:', e);
          }
        }
      } else {
        // Fetch all brands to determine max ID and avoid duplicate key / sequence errors
        const { data: existingBrands } = await supabase.from('brands').select('id');
        const maxId = existingBrands && existingBrands.length > 0 ? Math.max(...existingBrands.map(b => b.id)) : 0;
        const nextId = maxId + 1;

        // Insert in Supabase
        const { data: sbData, error: sbErr } = await supabase
          .from('brands')
          .insert([{ ...supabasePayload, id: nextId }])
          .select();
        if (sbErr) throw sbErr;

        // Insert in SQLite
        if (isLocalhost) {
          try {
            const res = await apiFetch('brands', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...form, id: nextId, slug: slugVal })
            });
            if (!res.ok) console.warn('SQLite Brand insert responded with error status:', res.status);
          } catch (e) {
            console.warn('SQLite Brand insert failed:', e);
          }
        }
      }

      setSuccess(editingId ? 'Brand updated!' : 'Brand added!');
      refreshData();
      setTimeout(() => backToList(), 1500);
    } catch (err) {
      console.error('Error saving brand:', err);
      setError(err.message || 'Failed to save brand.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const isLocalhost = isLocalHost();
    try {
      // Delete from Supabase
      const { error: sbErr } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
      if (sbErr) throw sbErr;

      // Delete from SQLite
      if (isLocalhost) {
        try {
          const res = await apiFetch(`brands/${id}`, { method: 'DELETE' });
          if (!res.ok) console.warn('SQLite Brand delete responded with error status:', res.status);
        } catch (e) {
          console.warn('SQLite Brand delete failed:', e);
        }
      }
      refreshData();
    } catch (err) {
      console.error('Error deleting brand:', err);
      setError('Failed to delete brand.');
    } finally {
      setDeletingId(null);
      setConfirmDel(null);
    }
  };

  const filtered = brands.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()));

  /* ── LIST VIEW ── */
  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500"><Award size={20}/></div>
            Brand Management
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">{brands.length} brands in your store</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-purple-500/20">
          <Plus size={16}/> New Brand
        </button>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {/* Search & Header Stats */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-purple-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors" size={18}/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands by name…"
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900 dark:text-white transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-slate-900"/>
          </div>
          <div className="flex gap-4">
            <div className="px-5 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30">
               <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 block mb-0.5">Total Brands</span>
               <span className="text-xl font-black text-slate-900 dark:text-white">{brands.length}</span>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-3xl flex items-center justify-center mb-6 rotate-3"><Award className="text-purple-400" size={40}/></div>
            <p className="text-slate-900 dark:text-white font-black text-xl mb-2">{search ? 'No matches found.' : 'Your Brand Portfolio is Empty'}</p>
            {!search && <><p className="text-slate-500 text-sm mb-10 max-w-xs">Start building your store's identity by adding your first luxury brand.</p>
            <button onClick={openAdd} className="flex items-center gap-3 px-8 py-4 bg-purple-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20"><Plus size={18}/>Initialize Brand</button></>}
          </div>
        ) : (
          <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-8 hover:bg-white dark:hover:bg-slate-900 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col items-center text-center">
                
                {/* Logo Showcase */}
                <div className="relative w-32 h-32 mb-6 group-hover:scale-110 transition-transform duration-700 ease-out">
                  {/* Outer Glow Overlay */}
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  {/* Logo Container */}
                  <div className="relative w-full h-full bg-white dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center p-6 overflow-hidden">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="w-full h-full object-contain filter group-hover:brightness-110 transition-all"/>
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                        <span className="text-4xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                          {b.name?.slice(0, 2) || '??'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Bubbles (Floating on hover) */}
                  <div className="absolute -right-2 -top-2 flex flex-col gap-2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    <button onClick={() => openEdit(b)} className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-purple-500 hover:text-white transition-colors"><Edit size={16}/></button>
                    <button onClick={() => setConfirmDel({ id: b.id, name: b.name })} disabled={deletingId === b.id}
                      className="w-10 h-10 bg-white dark:bg-slate-800 text-red-500 rounded-full flex items-center justify-center shadow-lg border border-slate-100 dark:border-slate-700 hover:bg-red-500 hover:text-white transition-colors">
                      {deletingId === b.id ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                    </button>
                  </div>
                </div>

                {/* Brand Info */}
                <div className="space-y-3 w-full">
                  <div className="flex flex-col items-center">
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] text-xl leading-tight">{b.name}</h3>
                    <div className="h-0.5 w-10 bg-gradient-to-r from-purple-500 to-transparent mt-2 group-hover:w-20 transition-all duration-500"></div>
                  </div>
                  
                  <div className="min-h-[3rem]">
                    {b.description ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {b.description}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic pt-2">Official Brand Partner</p>
                    )}
                  </div>

                  {b.website && (
                    <a href={b.website} target="_blank" rel="noopener noreferrer" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 hover:bg-purple-500/10 rounded-xl text-[10px] font-black text-slate-500 hover:text-purple-500 uppercase tracking-widest transition-all">
                      <Search size={12}/> Visit Website
                    </a>
                  )}
                </div>

                {/* Counter Badge */}
                <div className="absolute top-6 left-6 px-3 py-1 bg-slate-900/5 dark:bg-white/5 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ID: {b.id?.toString().slice(-4)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Trash2 className="text-red-500" size={24}/></div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white uppercase mb-2">Delete Brand?</h3>
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
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Brand' : 'Add New Brand'}</h2>
          <p className="text-slate-500 text-sm font-medium">{editingId ? 'Update brand details below' : 'Fill in the brand information'}</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>

        <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div>
              <label className={lbl}><Award size={12}/> Brand Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Samsung, Apple, Sony" className={inp}/>
            </div>
            <div>
              <label className={lbl}><FileText size={12}/> Description</label>
              <textarea rows="4" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Short brand description…" className={`${inp} resize-none`}/>
            </div>
            <div>
              <label className={lbl}>Website URL</label>
              <input type="url" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://www.brand.com" className={inp}/>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            <div>
              <label className={lbl}><ImageIcon size={12}/> Brand Logo</label>
              <div className="relative group">
                <div className="relative w-full h-48 rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center p-6">
                  {form.logo_url ? (
                    <>
                      <img src={form.logo_url} alt="Logo" className="max-h-full max-w-full object-contain"/>
                      <button type="button" onClick={() => setForm(p => ({ ...p, logo_url: '' }))} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><X size={14}/></button>
                    </>
                  ) : (
                    <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                      <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-4">
                        <span className="text-4xl font-black text-slate-400 dark:text-slate-600 uppercase tracking-tighter">
                          {form.name?.slice(0, 2) || '??'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isUploading ? 'Uploading...' : 'Click to upload logo'}
                      </span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploading}/>
                    </label>
                  )}
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-purple-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
              {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : editingId ? 'Update Brand' : 'Save Brand'}
            </button>

            <AnimatePresence>
              {error && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20"><AlertCircle size={15} className="mr-3 shrink-0"/>{error}</motion.div>}
              {success && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 size={15} className="mr-3 shrink-0"/>{success}</motion.div>}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
