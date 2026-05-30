import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, X,
  Loader2, Tag, FileText, FolderOpen, Image as ImageIcon,
  Search, ChevronRight, Grid
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';

const EMPTY_FORM = { name: '', description: '', parent_id: '', image_url: '', slug: '', is_subcategory: false };

const inputClass =
  'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';

const labelClass =
  'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2 ml-1';

const CategoryManagement = () => {
  const { categories, refreshData } = useStore();

  const [formData, setFormData]       = useState(EMPTY_FORM);
  const [editingId, setEditingId]     = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [search, setSearch]           = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }

  /* ─── helpers ─── */
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (cat) => {
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      parent_id: cat.parent_id || '',
      is_subcategory: !!cat.parent_id,
      image_url: cat.image_url || '',
      slug: cat.slug || ''
    });
    setEditingId(cat.id);
    setShowForm(true);
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeForm = () => { setShowForm(false); resetForm(); };

  /* ─── image upload ─── */
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsUploading(true); setError('');
      const blob = await compressImage(file);
      const url  = await uploadToStorage(blob, 'categories');
      setFormData(prev => ({ ...prev, image_url: url }));
    } catch {
      setError('Failed to process image.');
    } finally {
      setIsUploading(false);
    }
  };

  /* ─── submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!formData.name.trim()) { setError('Category name is required.'); return; }
    if (formData.is_subcategory && !formData.parent_id) { setError('Please select a parent category for this subcategory.'); return; }

    setIsSubmitting(true);
    try {
      const slugVal = formData.slug?.trim() || formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const parentVal = formData.is_subcategory && formData.parent_id ? Number(formData.parent_id) : null;
      
      const supabasePayload = {
        name: formData.name.trim(),
        slug: slugVal,
        description: formData.description?.trim() || null,
        icon: formData.image_url || null,
        parent_id: parentVal,
        position: 0
      };

      const localPayload = {
        name: formData.name.trim(),
        slug: slugVal,
        description: formData.description?.trim() || null,
        image_url: formData.image_url || null,
        parent_id: parentVal
      };

      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

      if (editingId) {
        // Update in Supabase
        const { error: sbErr } = await supabase
          .from('categories')
          .update(supabasePayload)
          .eq('id', editingId);
        if (sbErr) throw sbErr;

        // Update in SQLite
        if (isLocalhost) {
          try {
            const res = await apiFetch(`categories/${editingId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localPayload)
            });
            if (!res.ok) console.warn('SQLite Category update responded with error status:', res.status);
          } catch (e) {
            console.warn('SQLite Category update failed:', e);
          }
        }
      } else {
        // Fetch all categories to determine max ID and avoid duplicate key / sequence errors
        const { data: existingCats } = await supabase.from('categories').select('id');
        const maxId = existingCats && existingCats.length > 0 ? Math.max(...existingCats.map(c => c.id)) : 0;
        const nextId = maxId + 1;

        // Insert in Supabase
        const { data: sbData, error: sbErr } = await supabase
          .from('categories')
          .insert([{ ...supabasePayload, id: nextId }])
          .select();
        if (sbErr) throw sbErr;

        // Insert in SQLite
        if (isLocalhost) {
          try {
            const res = await apiFetch('categories', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...localPayload, id: nextId })
            });
            if (!res.ok) console.warn('SQLite Category insert responded with error status:', res.status);
          } catch (e) {
            console.warn('SQLite Category insert failed:', e);
          }
        }
      }

      setSuccess(editingId ? 'Category updated!' : 'Category added!');
      refreshData();
      setTimeout(() => { closeForm(); setSuccess(''); }, 1500);
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── delete ─── */
  const handleDelete = async (id) => {
    setDeletingId(id);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    try {
      // Delete from Supabase
      const { error: sbErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (sbErr) throw sbErr;

      // Delete from SQLite
      if (isLocalhost) {
        try {
          const res = await apiFetch(`categories/${id}`, { method: 'DELETE' });
          if (!res.ok) console.warn('SQLite Category delete responded with error status:', res.status);
        } catch (e) {
          console.warn('SQLite Category delete failed:', e);
        }
      }
      refreshData();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  };

  /* ─── filtered list ─── */
  const filtered = (categories || []).filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── parent category options (only list top-level parent categories, exclude self) ─── */
  const parentOptions = (categories || []).filter(c => !c.parent_id && c.id !== editingId);

  return (
    <div className="space-y-8">

      {/* ── HEADER BAR ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
              <FolderOpen size={20} />
            </div>
            Category Management
          </h2>
          <p className="text-slate-500 font-medium tracking-wide mt-1 ml-14">
            {categories?.length || 0} categories in your store
          </p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
          >
            <Plus size={16} /> New Category
          </button>
        )}
      </div>

      {/* ── FORM PANEL ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Form Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                  {editingId ? <Edit size={16} /> : <Plus size={16} />}
                </div>
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button onClick={closeForm} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left */}
              <div className="space-y-6">

                {/* Name */}
                <div>
                  <label className={labelClass}><Tag size={12} /> Category Name *</label>
                  <input
                    type="text" value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Smartphones"
                    className={inputClass}
                  />
                </div>

                {/* Category Type Choice */}
                <div>
                  <label className={labelClass}><Grid size={12} /> Category Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, is_subcategory: false, parent_id: '' }))}
                      className={`p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                        !formData.is_subcategory
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-305'
                      }`}
                    >
                      <FolderOpen size={18} />
                      <span>Parent Category</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, is_subcategory: true }))}
                      className={`p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                        formData.is_subcategory
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-305'
                      }`}
                    >
                      <ChevronRight size={18} />
                      <span>Subcategory</span>
                    </button>
                  </div>
                </div>

                {/* Parent Category Selector */}
                <AnimatePresence>
                  {formData.is_subcategory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className={labelClass}><FolderOpen size={12} /> Select Parent Category *</label>
                      <select
                        value={formData.parent_id}
                        onChange={e => setFormData(p => ({ ...p, parent_id: e.target.value }))}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">-- Choose Parent --</option>
                        {parentOptions.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Description */}
                <div>
                  <label className={labelClass}><FileText size={12} /> Description</label>
                  <textarea
                    rows="4" value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Short description for this category..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              {/* Right — Image */}
              <div className="space-y-6">
                <div>
                  <label className={labelClass}><ImageIcon size={12} /> Category Image</label>
                  <div className="relative group">
                    {formData.image_url ? (
                      <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <label className={`w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                        isUploading
                          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300'
                          : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                      }`}>
                        {isUploading ? (
                          <div className="flex flex-col items-center text-emerald-500">
                            <Loader2 size={28} className="animate-spin mb-2" />
                            <span className="text-xs font-black uppercase tracking-widest">Uploading…</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <ImageIcon size={28} className="mb-2" />
                            <span className="text-xs font-black uppercase tracking-widest">Click to upload</span>
                            <span className="text-[10px] font-medium mt-1">JPEG · PNG · WEBP</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit" disabled={isSubmitting}
                    className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : editingId ? 'Update Category' : 'Save Category'}
                  </button>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                      <AlertCircle size={15} className="mr-3 shrink-0" />{error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                      <CheckCircle2 size={15} className="mr-3 shrink-0" />{success}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CATEGORY GRID ── */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">

        {/* Search bar & Stats */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={18}/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 dark:text-white transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-slate-900"/>
          </div>
          <div className="flex gap-4">
             <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-0.5">Active Categories</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{categories?.length || 0}</span>
             </div>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mb-6 -rotate-3"><FolderOpen className="text-emerald-400" size={40}/></div>
            <p className="text-slate-900 dark:text-white font-black text-xl mb-2">{search ? 'No categories found.' : 'Your Catalog is Empty'}</p>
            {!search && <><p className="text-slate-500 text-sm mb-10 max-w-xs">Organize your products by creating your first store category.</p>
            <button onClick={openAdd} className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"><Plus size={18}/>Initialize Catalog</button></>}
          </div>
        ) : (
          <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map((cat, i) => (
              <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] p-6 hover:bg-white dark:hover:bg-slate-900 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 overflow-hidden flex flex-col items-center text-center">
                
                {/* Image Showcase */}
                <div className="relative w-full aspect-[4/3] mb-6 group-hover:scale-105 transition-transform duration-700 ease-out">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  
                  <div className="relative w-full h-full bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex items-center justify-center">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"/>
                    ) : (
                      <div className="flex flex-col items-center text-slate-300">
                        <FolderOpen size={48}/>
                      </div>
                    )}
                    
                    {/* Action Bubbles (Floating on hover) */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(cat)} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl"><Edit size={18}/></button>
                      <button onClick={() => setConfirmDelete({ id: cat.id, name: cat.name })} disabled={deletingId === cat.id} 
                        className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-red-500/30">
                        {deletingId === cat.id ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18}/>}
                      </button>
                    </div>
                  </div>

                  {/* Parent Badge */}
                  {(() => {
                    const parent = categories.find(c => c.id === cat.parent_id);
                    if (!parent) return null;
                    return (
                      <div className="absolute -top-2 -left-2 px-4 py-1.5 bg-white dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-emerald-500 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                        Sub of {parent.name}
                      </div>
                    );
                  })()}
                </div>

                {/* Category Info */}
                <div className="space-y-2 w-full">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.1em] text-lg leading-tight truncate">{cat.name}</h3>
                  <div className="h-0.5 w-8 bg-gradient-to-r from-emerald-500 to-transparent mx-auto group-hover:w-16 transition-all duration-500"></div>
                  
                  <div className="min-h-[2.5rem] pt-1">
                    {cat.description ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 font-black uppercase tracking-widest italic">Product Category Asset</p>
                    )}
                  </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── DELETE CONFIRM MODAL ── */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Trash2 className="text-red-500" size={26} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white text-center mb-2 uppercase tracking-tight">Delete Category?</h3>
              <p className="text-sm text-slate-500 text-center font-medium mb-8">
                This will permanently remove <span className="font-black text-slate-900 dark:text-white">"{confirmDelete.name}"</span>. This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  disabled={deletingId === confirmDelete.id}
                  className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black uppercase tracking-widest text-xs hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60"
                >
                  {deletingId === confirmDelete.id ? <Loader2 size={16} className="animate-spin" /> : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CategoryManagement;
