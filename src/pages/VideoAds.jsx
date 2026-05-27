import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Play, Image as ImageIcon, Link, Type, Eye, EyeOff, Video, Film, Zap } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';
import { supabase } from '../lib/supabase';



const EMPTY = { title: '', description: '', type: 'image', mediaUrl: '', linkUrl: '', productId: '', isActive: true, ctaText: 'Shop Now' };
const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-pink-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

export default function VideoAds() {
  const { videoAds = [], products = [], refreshData } = useStore();
  const [view, setView] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const openAdd = () => { setForm(EMPTY); setEditingId(null); setError(''); setSuccess(''); setView('form'); };
  const openEdit = (a) => { setForm({ title: a.title||'', description: a.description||'', type: a.type||'image', mediaUrl: a.videoUrl||a.imageUrl||a.mediaUrl||'', linkUrl: a.linkUrl||'', productId: a.productId||'', isActive: a.isActive!==false, ctaText: a.ctaText||'Shop Now' }); setEditingId(a.id); setError(''); setSuccess(''); setView('form'); };
  const back = () => { setView('list'); setEditingId(null); setForm(EMPTY); setError(''); setSuccess(''); };

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const isVideo = file.type.startsWith('video/');
    try {
      setIsUploading(true); setError('');
      let url;
      if (isVideo) { url = await uploadToStorage(file, 'ads/videos'); }
      else { const blob = await compressImage(file); url = await uploadToStorage(blob, 'ads/images'); }
      setForm(p => ({ ...p, mediaUrl: url, type: isVideo ? 'video' : 'image' }));
    } catch { setError('Upload failed. Please try again.'); } finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.title.trim()) { setError('Ad title is required.'); return; }
    if (!form.mediaUrl) { setError('Please upload a media file.'); return; }
    setIsSubmitting(true);
    try {
      const encodedTitle = JSON.stringify({
        t: form.title,
        d: form.description || '',
        p: form.productId || null,
        c: form.ctaText || 'Shop Now'
      });

      const payload = {
        title: encodedTitle,
        video_url: form.mediaUrl,
        is_active: form.isActive ? 1 : 0
      };

      let errResult;
      if (editingId) {
        const { error: err } = await supabase.from('video_ads').update(payload).eq('id', editingId);
        errResult = err;
      } else {
        const { error: err } = await supabase.from('video_ads').insert([payload]);
        errResult = err;
      }

      if (errResult) throw errResult;
      setSuccess(editingId ? 'Ad updated!' : 'Ad published!');
      refreshData();
      setTimeout(() => back(), 1500);
    } catch { setError('Failed to save ad.'); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const { error: err } = await supabase.from('video_ads').delete().eq('id', id);
      if (err) throw err;
      refreshData();
    }
    catch { setError('Delete failed.'); } finally { setDeletingId(null); setConfirmDel(null); }
  };

  const toggleActive = async (a) => {
    try { 
      const encodedTitle = JSON.stringify({
        t: a.title,
        d: a.description || '',
        p: a.productId || null,
        c: a.ctaText || 'Shop Now'
      });
      await supabase.from('video_ads').update({
        title: encodedTitle,
        video_url: a.videoUrl || a.imageUrl,
        is_active: a.isActive ? 0 : 1
      }).eq('id', a.id);
      refreshData(); 
    } catch {}
  };

  /* ── LIST VIEW ── */
  if (view === 'list') return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Film size={20} className="text-white"/>
            </div>
            Ads & Media
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">{videoAds.length} active campaigns in your store</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-pink-500/20">
          <Plus size={16}/> New Ad
        </button>
      </div>

      {videoAds.length === 0 ? (
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-20 flex flex-col items-center justify-center text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-rose-500/5 pointer-events-none"/>
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-pink-500/30">
            <Play size={32} className="text-white"/>
          </div>
          <p className="font-black text-slate-900 dark:text-white text-xl mb-2">No Ads Yet</p>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Publish your first video or image advertisement to drive traffic and sales.</p>
          <button onClick={openAdd} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 shadow-xl shadow-pink-500/20 transition-all">
            <Plus size={14}/> Create First Ad
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {videoAds.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden group hover:shadow-2xl hover:shadow-pink-500/5 transition-all duration-500">
              {/* Media Preview */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {a.type === 'video' ? (
                  <video 
                    src={a.videoUrl || a.mediaUrl ? `${a.videoUrl || a.mediaUrl}?v=1` : ''} 
                    className="w-full h-full object-cover opacity-80" 
                    muted 
                    loop 
                    playsInline 
                    preload="metadata"
                  />
                ) : (a.imageUrl || a.mediaUrl) ? (
                  <img src={a.imageUrl || a.mediaUrl} alt={a.title} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-600" size={32}/></div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                {/* Type Badge */}
                <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${a.type === 'video' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {a.type === 'video' ? <Video size={10}/> : <ImageIcon size={10}/>}
                  {a.type}
                </div>

                {/* Action buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2 transition-all">
                  <button onClick={() => openEdit(a)} className="w-9 h-9 bg-white/90 backdrop-blur-md text-blue-600 rounded-xl flex items-center justify-center hover:bg-white shadow-lg"><Edit size={15}/></button>
                  <button onClick={() => setConfirmDel({ id: a.id, name: a.title })} className="w-9 h-9 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center hover:bg-white shadow-lg"><Trash2 size={15}/></button>
                </div>
                {/* Play icon for video */}
                {a.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                      <Play className="text-white ml-1" size={22}/>
                    </div>
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 dark:text-white text-sm truncate">{a.title}</p>
                    {a.description && <p className="text-xs text-slate-400 font-medium mt-0.5 truncate">{a.description}</p>}
                  </div>
                  <button onClick={() => toggleActive(a)} className={`shrink-0 p-2 rounded-xl transition-colors ${a.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {a.isActive ? <Eye size={15}/> : <EyeOff size={15}/>}
                  </button>
                </div>
                {a.linkUrl && (
                  <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-[10px] font-bold text-pink-500 uppercase tracking-widest hover:underline truncate">
                    <Link size={10}/>{a.linkUrl}
                  </a>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${a.isActive ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {a.isActive ? 'Live' : 'Paused'}
                  </span>
                  {a.ctaText && <span className="px-2 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 rounded-lg text-[10px] font-black uppercase tracking-widest">{a.ctaText}</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Trash2 className="text-red-500" size={24}/></div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white uppercase mb-2">Delete Ad?</h3>
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
        <button onClick={back} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ArrowLeft size={18}/></button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingId ? 'Edit Ad' : 'New Advertisement'}</h2>
          <p className="text-slate-500 text-sm font-medium">Upload media and configure your campaign</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"/>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">

          {/* Media Upload */}
          <div>
            <label className={`${lbl} mb-3`}><Film size={12}/> Media Upload — Image or Video</label>
            <div className="relative group">
              {form.mediaUrl ? (
                <div className="relative w-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-900">
                  {form.type === 'video' ? (
                    <video 
                      src={form.mediaUrl ? `${form.mediaUrl}?v=1` : ''} 
                      controls 
                      playsInline 
                      preload="metadata"
                      className="w-full max-h-72 object-contain"
                    />
                  ) : (
                    <img src={form.mediaUrl} alt="Preview" className="w-full max-h-72 object-cover"/>
                  )}
                  <button type="button" onClick={() => setForm(p => ({ ...p, mediaUrl: '' }))} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"><X size={14}/></button>
                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${form.type === 'video' ? 'bg-rose-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {form.type === 'video' ? <Video size={10}/> : <ImageIcon size={10}/>} {form.type}
                  </div>
                </div>
              ) : (
                <label className={`w-full min-h-[240px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl cursor-pointer transition-all ${isUploading ? 'bg-pink-50 dark:bg-pink-900/10 border-pink-300' : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10'}`}>
                  {isUploading ? (
                    <div className="flex flex-col items-center text-pink-500"><Loader2 size={36} className="animate-spin mb-3"/><span className="text-xs font-black uppercase tracking-widest">Uploading Media…</span></div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-400">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-pink-50 dark:bg-pink-900/20 rounded-2xl flex items-center justify-center"><Video className="text-pink-400" size={24}/></div>
                        <span className="text-2xl font-black text-slate-200 dark:text-slate-700">or</span>
                        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center"><ImageIcon className="text-blue-400" size={24}/></div>
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-slate-500">Drop video or image here</span>
                      <span className="text-[10px] font-medium mt-2 text-slate-400">MP4 · WEBM · JPG · PNG · WEBP</span>
                      <span className="mt-4 px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-black uppercase tracking-widest rounded-xl">Browse Files</span>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*,video/*" onChange={handleUpload} disabled={isUploading}/>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT: Content */}
            <div className="space-y-6">
              <div>
                <label className={lbl}><Type size={12}/> Ad Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Summer Sale — Up to 50% Off!" className={inp}/>
              </div>
              <div>
                <label className={lbl}>Description</label>
                <textarea rows="6" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Write a short compelling message to drive conversions..." className={`${inp} resize-none h-[152px]`}/>
              </div>
            </div>

            {/* RIGHT: Configuration */}
            <div className="space-y-6">
              {/* Active Toggle */}
              <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:shadow-lg ${form.isActive ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 shadow-pink-500/10' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                <div className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${form.isActive ? 'bg-pink-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-7' : 'left-1'}`}/>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest ${form.isActive ? 'text-pink-600 dark:text-pink-400' : 'text-slate-500'}`}>{form.isActive ? 'Ad is Live' : 'Ad is Paused'}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{form.isActive ? 'Visible to customers right now' : 'Hidden from storefront'}</p>
                </div>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 relative">
                  <label className={lbl}><Link size={12}/> Link to Product</label>
                  <select 
                    value={form.productId} 
                    onChange={e => setForm(p => ({ ...p, productId: e.target.value }))} 
                    className={`${inp} appearance-none cursor-pointer pr-10`}
                  >
                    <option value="">-- No Product (General Ad) --</option>
                    {products.map(prod => (
                      <option key={prod.id} value={prod.id}>{prod.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 bottom-5 pointer-events-none text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className={lbl}><Zap size={12}/> CTA Button Text</label>
                  <input type="text" value={form.ctaText} onChange={e => setForm(p => ({ ...p, ctaText: e.target.value }))} placeholder="Shop Now" className={inp}/>
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-pink-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
            {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : editingId ? 'Update Ad' : 'Publish Advertisement'}
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
