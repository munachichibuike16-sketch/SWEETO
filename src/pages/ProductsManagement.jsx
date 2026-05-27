import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle, Tag, DollarSign, ListOrdered, FileText, Award, Percent, Star, TrendingUp, Zap, Clock, Smartphone, Tv, Speaker, Snowflake, Palette, Image as ImageIcon, ArrowLeft, Package } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';

const EMPTY = { 
  name:'', price:'', originalPrice:'', categoryId:'', brandId:'', description:'', image_url:'', additional_images:[], status:'active', 
  featured:false, trending:false, dealOfDay:false, newArrival:false, smartphonesPlacement:false, homeCinemaPlacement:false, 
  speakersPlacement:false, refrigeratorsPlacement:false, colors:[], placements:[], condition:'new', stock:10, costPrice:'' 
};

const SECTIONS = [
  { key:'featured', label:'Featured', icon:Star, color:'amber' },
  { key:'trending', label:'Trending', icon:TrendingUp, color:'rose' },
  { key:'dealOfDay', label:'Deal of Day', icon:Zap, color:'blue' },
  { key:'newArrival', label:'New Arrival', icon:Clock, color:'emerald' },
  { key:'smartphonesPlacement', label:'Mobiles', icon:Smartphone, color:'indigo' },
  { key:'homeCinemaPlacement', label:'Cinema', icon:Tv, color:'violet' },
  { key:'speakersPlacement', label:'Speakers', icon:Speaker, color:'fuchsia' },
  { key:'refrigeratorsPlacement', label:'Fridge', icon:Snowflake, color:'cyan' },
];

const COLORS = { orange:'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600', amber:'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-600', rose:'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600', blue:'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600', emerald:'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', indigo:'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600', violet:'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-600', fuchsia:'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600', cyan:'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600' };

const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

export default function ProductsManagement() {
  const { products, categories, brands=[], refreshData, sections=[], settings } = useStore();
  const currencySymbol = settings?.currency === 'USD' ? '$' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : (settings?.currency === 'INR' ? '₹' : (settings?.currency || 'FCFA'))));
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('#0066FF');

  const openAdd = () => { setForm(EMPTY); setEditingProduct(null); setError(''); setSuccess(''); setView('form'); };
  const openEdit = (p) => {
    const cat = categories.find(c => c.name === p.category);
    let placements = [];
    try {
      placements = typeof p.placements === 'string' ? JSON.parse(p.placements) : (p.placements || []);
    } catch(e) {
      placements = [];
    }
    
    let additionalImages = [];
    try {
      additionalImages = typeof p.additional_images === 'string' ? JSON.parse(p.additional_images) : (p.additional_images || []);
    } catch(e) {
      additionalImages = [];
    }

    setForm({ 
      name:p.name||'', 
      price:p.price||'', 
      originalPrice:p.originalPrice||'', 
      categoryId:cat?.id?.toString()||'', 
      brandId:p.brand_id?.toString()||'', 
      description:p.description||'', 
      image_url:p.image_url||'', 
      additional_images: additionalImages,
      status:p.status||'active', 
      featured:Boolean(p.is_featured)||false, 
      trending:Boolean(p.is_trending)||false, 
      dealOfDay:Boolean(p.is_daily_deal)||false, 
      newArrival:Boolean(p.is_new_arrival)||false, 
      smartphonesPlacement:Boolean(p.smartphones_placement)||false, 
      homeCinemaPlacement:Boolean(p.home_cinema_placement)||false, 
      speakersPlacement:Boolean(p.speakers_placement)||false, 
      refrigeratorsPlacement:Boolean(p.refrigerators_placement)||false, 
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []),
      placements: placements,
      condition: p.condition || 'new',
      stock: p.stock_quantity !== undefined ? p.stock_quantity : (p.stock !== undefined ? p.stock : 10),
      costPrice: p.cost_price !== undefined ? p.cost_price : (p.bought_price !== undefined ? p.bought_price : '')
    });
    setEditingProduct(p);
    setError(''); setSuccess('');
    setView('form');
  };
  const backToList = () => { setView('list'); setEditingProduct(null); setForm(EMPTY); setError(''); setSuccess(''); };

  const handleImg = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { setIsUploading(true); const blob = await compressImage(file); const url = await uploadToStorage(blob,'products'); setForm(p=>({...p,image_url:url})); }
    catch { setError('Image upload failed.'); } finally { setIsUploading(false); }
  };

  const addColor = () => { if (!colorName.trim()) return; setForm(p=>({...p,colors:[...(p.colors||[]),{name:colorName.trim(),code:colorCode}]})); setColorName(''); setColorCode('#0066FF'); };

  const discount = () => { const o=parseFloat(form.originalPrice),s=parseFloat(form.price); if(!o||!s||o<=s) return null; return Math.round(((o-s)/o)*100); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name||!form.price||!form.categoryId) { setError('Name, Price, and Category are required.'); return; }
    const cat = categories.find(c=>c.id?.toString()===form.categoryId?.toString());
    const b = brands.find(br=>br.id?.toString()===form.brandId?.toString());
    
    setIsSubmitting(true);
    try {
      const generatedSlug = editingProduct?.slug || (form.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 100000));

      const payload = { 
        name: form.name,
        slug: generatedSlug,
        description: form.description || '',
        price: parseFloat(form.price) || 0,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        cost_price: form.costPrice ? parseFloat(form.costPrice) : null,
        stock_quantity: parseInt(form.stock) || 0,
        is_active: form.status === 'active' ? 1 : 0,
        is_featured: form.featured ? 1 : 0,
        is_deal: form.dealOfDay ? 1 : 0,
        image_url: form.image_url || '',
        images: JSON.stringify(form.additional_images || []),
        category: cat?.name || '',
        brand: b?.name || '',
        condition: form.condition || 'new',
        placements: JSON.stringify(form.placements || []),
        colors: JSON.stringify(form.colors || []),
        related_products: JSON.stringify(form.related_products || [])
      };

      const attemptSave = async (data) => {
        if (editingProduct) {
          return await supabase.from('products').update(data).eq('id', editingProduct.id);
        } else {
          const { data: existingProds } = await supabase.from('products').select('id');
          const maxId = existingProds && existingProds.length > 0 ? Math.max(...existingProds.map(p => p.id)) : 0;
          const nextId = maxId + 1;
          data.id = nextId;
          return await supabase.from('products').insert([data]);
        }
      };

      let result = await attemptSave(payload);

      // If we got a column missing error, retry without colors and related_products
      if (result.error && (
        result.error.message?.includes('column') || 
        result.error.code === '42703' || 
        result.error.message?.includes('does not exist')
      )) {
        console.warn('Retrying save without optional colors/related_products columns...');
        const safePayload = { ...payload };
        delete safePayload.colors;
        delete safePayload.related_products;
        result = await attemptSave(safePayload);
      }

      if (result.error) throw result.error;

      // Local SQLite fallback removed to prevent Vercel 404 errors. Supabase is the source of truth.

      setSuccess(editingProduct?'Product updated!':'Product added!');
      refreshData();
      setTimeout(()=>backToList(), 1500);
    } catch (err) {
      console.error(err);
      setError('Failed to save product: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      // Delete in Supabase
      const { error: err } = await supabase.from('products').delete().eq('id', id);
      if (err) throw err;

      // Local SQLite fallback removed to prevent Vercel 404 errors.

      refreshData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete product.');
    } finally {
      setDeletingId(null);
      setConfirmDel(null);
    }
  };



  const disc = discount();

  /* ─── LIST VIEW ─── */
  if (view === 'list') return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Tag size={20}/></div>
              Products Portfolio
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-1 ml-14">Manage your store's inventory and placements</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-blue-500/20">
            <Plus size={16}/> New Product
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', val: products?.length || 0, color: 'blue', icon: Tag },
            { label: 'Featured', val: products?.filter(p => p.featured).length || 0, color: 'amber', icon: Star },
            { label: 'Deals', val: products?.filter(p => p.dealOfDay).length || 0, color: 'rose', icon: Zap },
            { label: 'New Arrivals', val: products?.filter(p => p.newArrival).length || 0, color: 'emerald', icon: Clock },
          ].map((s, i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${s.color}-500/10 text-${s.color}-500`}><s.icon size={16}/></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {(!products || products.length === 0) ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none"/>
          <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10"><Tag className="text-blue-400" size={32}/></div>
          <p className="font-black text-slate-900 dark:text-white text-xl mb-2">No Products Yet</p>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Start building your catalog by adding your first premium product.</p>
          <button onClick={openAdd} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 shadow-xl shadow-blue-500/20 transition-all"><Plus size={18}/>Initialize Inventory</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
              className="group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[2.5rem] p-5 hover:bg-white dark:hover:bg-slate-900 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden flex flex-col">
              
              {/* Media Section */}
              <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm mb-5">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-slate-300" size={40}/></div>
                )}
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <button onClick={() => openEdit(p)} className="w-12 h-12 bg-white text-slate-900 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl"><Edit size={18}/></button>
                  <button onClick={() => setConfirmDel({ id: p.id, name: p.name })} className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-red-500/30">
                    {deletingId === p.id ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18}/>}
                  </button>
                </div>

                {/* Status Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                  {p.status === 'draft' && <span className="bg-black/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg shadow-lg border border-white/10">Draft</span>}
                  {p.originalPrice && p.originalPrice > p.price && (
                    <span className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-lg">-{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</span>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="px-1 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-3 mb-1">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base leading-tight truncate flex-1">{p.name}</h3>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">{p.category || 'Legacy'}</span>
                  {brands.find(b => b.id === p.brandId) && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/ {brands.find(b => b.id === p.brandId)?.name}</span>
                  )}
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                    p.condition === 'used' 
                      ? 'text-amber-500 bg-amber-500/5 border-amber-500/10' 
                      : 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10'
                  }`}>
                    {p.condition === 'used' ? 'Used' : 'New'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {[
                    { key: 'is_featured', label: 'Featured', icon: Star, color: 'amber' },
                    { key: 'is_trending', label: 'Trending', icon: TrendingUp, color: 'rose' },
                    { key: 'is_daily_deal', label: 'Elite Offer', icon: Zap, color: 'blue' },
                    { key: 'is_new_arrival', label: 'New Arrival', icon: Clock, color: 'emerald' },
                  ].filter(s => Number(p[s.key]) === 1).map(s => {
                    const SIcon = s.icon;
                    const bgColors = { amber: 'bg-amber-600', rose: 'bg-rose-600', blue: 'bg-blue-600', emerald: 'bg-emerald-600' };
                    return (
                      <span key={s.key} className={`flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white ${bgColors[s.color]} px-1.5 py-0.5 rounded-sm shadow-sm`}>
                        <SIcon size={10} className="stroke-[3]" />
                        {s.label.toUpperCase()}
                      </span>
                    );
                  })}
                  {/* Dynamic Custom Placements */}
                  {sections.filter(sec => {
                    const currentPlacements = typeof p.placements === 'string' ? JSON.parse(p.placements || '[]') : (p.placements || []);
                    return currentPlacements.includes(sec.id) || currentPlacements.includes(sec.id.toString()) || currentPlacements.includes(`${sec.id}-A`) || currentPlacements.includes(`${sec.id}-B`);
                  }).map(sec => {
                    const currentPlacements = typeof p.placements === 'string' ? JSON.parse(p.placements || '[]') : (p.placements || []);
                    const hasA = currentPlacements.includes(`${sec.id}-A`) || currentPlacements.includes(sec.id) || currentPlacements.includes(sec.id.toString());
                    const hasB = currentPlacements.includes(`${sec.id}-B`);
                    
                    return (
                      <span key={sec.id} className="flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-white bg-orange-600 px-1.5 py-0.5 rounded-sm shadow-sm">
                        <Package size={10} className="stroke-[3]"/>
                        {sec.isDual === 1 || sec.isDual === true ? (
                          <>
                            {(sec.title || 'SPLIT').toUpperCase()}
                            {hasA && <span className="text-[7px] bg-white/20 px-1 rounded-sm ml-1">A</span>}
                            {hasB && <span className="text-[7px] bg-white/20 px-1 rounded-sm ml-1">B</span>}
                          </>
                        ) : (
                          (sec.title || sec.category || `Sec #${sec.id}`).toUpperCase()
                        )}
                      </span>
                    );
                  })}
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£' || currencySymbol === '₹' ? currencySymbol : ''}
                      {Number(p.price).toLocaleString()}
                      {currencySymbol !== '$' && currencySymbol !== '€' && currencySymbol !== '£' && currencySymbol !== '₹' ? ` ${currencySymbol}` : ''}
                    </span>
                    {p.originalPrice && (
                      <span className="text-xs text-slate-400 line-through font-bold">
                        {currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£' || currencySymbol === '₹' ? currencySymbol : ''}
                        {Number(p.originalPrice).toLocaleString()}
                        {currencySymbol !== '$' && currencySymbol !== '€' && currencySymbol !== '£' && currencySymbol !== '₹' ? ` ${currencySymbol}` : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative Corner */}
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"/>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDel&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{scale:0.9}} animate={{scale:1}} exit={{scale:0.9}} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Trash2 className="text-red-500" size={24}/></div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white uppercase mb-2">Delete Product?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Remove <span className="font-black text-slate-900 dark:text-white">"{confirmDel.name}"</span> permanently?</p>
              <div className="flex gap-4">
                <button onClick={()=>setConfirmDel(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={()=>handleDelete(confirmDel.id)} disabled={!!deletingId} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60">
                  {deletingId?<Loader2 size={16} className="animate-spin"/>:'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  /* ─── FORM VIEW ─── */
  return (
    <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={backToList} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ArrowLeft size={18}/></button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingProduct?'Edit Product':'Add New Product'}</h2>
          <p className="text-slate-500 text-sm font-medium">{editingProduct?`Editing: ${editingProduct.name}`:'Fill in the details below'}</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT */}
            <div className="space-y-6">
              <div>
                <label className={lbl}><Tag size={12}/> Product Name *</label>
                <input type="text" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. MacBook Pro M3 Max" className={inp}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><DollarSign size={12}/> Sale Price *</label>
                  <input type="number" step="0.01" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} placeholder="0.00" className={`${inp} font-mono font-bold`}/>
                </div>
                <div>
                  <label className={lbl}><Percent size={12}/> Original Price</label>
                  <div className="relative">
                    <input type="number" step="0.01" value={form.originalPrice} onChange={e=>setForm(p=>({...p,originalPrice:e.target.value}))} placeholder="0.00" className={`${inp} font-mono pr-14`}/>
                    <AnimatePresence>{disc&&<motion.span initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}} className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg">-{disc}%</motion.span>}</AnimatePresence>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><ListOrdered size={12}/> Category *</label>
                  <select value={form.categoryId} onChange={e=>setForm(p=>({...p,categoryId:e.target.value}))} className={`${inp} appearance-none`}>
                    <option value="">Select Category</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}><Award size={12}/> Brand</label>
                  <select value={form.brandId} onChange={e=>setForm(p=>({...p,brandId:e.target.value}))} className={`${inp} appearance-none`}>
                    <option value="">Select Brand</option>
                    {brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}><ListOrdered size={12}/> Stock Quantity</label>
                  <input type="number" min="0" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))} placeholder="10" className={`${inp} font-mono font-bold`}/>
                </div>
                <div>
                  <label className={lbl}><DollarSign size={12}/> Cost Price (Bought Price)</label>
                  <input type="number" step="0.01" value={form.costPrice} onChange={e=>setForm(p=>({...p,costPrice:e.target.value}))} placeholder="0.00" className={`${inp} font-mono`}/>
                </div>
              </div>
              <div>
                <label className={lbl}><FileText size={12}/> Description</label>
                <textarea rows="4" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Tell customers about this product..." className={`${inp} resize-none`}/>
              </div>
              <div>
                <label className={lbl}>Status</label>
                <div className="flex gap-4">
                  {['active','draft'].map(s=>(
                    <button key={s} type="button" onClick={()=>setForm(p=>({...p,status:s}))} className={`flex-1 py-4 rounded-2xl border-2 transition-all capitalize font-black tracking-widest text-xs ${form.status===s?'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400':'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-300'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Product Condition</label>
                <div className="flex gap-4">
                  {[
                    { key: 'new', label: 'Brand New' },
                    { key: 'used', label: 'Used / Pre-Owned' }
                  ].map(c=>(
                    <button key={c.key} type="button" onClick={()=>setForm(p=>({...p,condition:c.key}))} className={`flex-1 py-4 rounded-2xl border-2 transition-all capitalize font-black tracking-widest text-xs ${form.condition===c.key?'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400':'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-400 hover:border-slate-300'}`}>{c.label}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* RIGHT */}
            <div className="space-y-6">
              <div>
                <label className={lbl}><ImageIcon size={12}/> Primary Product Image</label>
                <div className="relative group">
                  {form.image_url ? (
                    <div className="relative aspect-video w-full rounded-3xl overflow-hidden border-2 border-slate-200 dark:border-slate-800">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover"/>
                      <button type="button" onClick={()=>setForm(p=>({...p,image_url:''}))} className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                    </div>
                  ) : (
                    <label className={`w-full aspect-video flex flex-col items-center justify-center border-2 border-dashed rounded-3xl cursor-pointer transition-all ${isUploading?'bg-blue-50 dark:bg-blue-900/10 border-blue-300':'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50'}`}>
                      {isUploading?<div className="flex flex-col items-center text-blue-500"><Loader2 size={28} className="animate-spin mb-2"/><span className="text-xs font-black uppercase tracking-widest">Uploading…</span></div>:<div className="flex flex-col items-center text-slate-400"><ImageIcon size={28} className="mb-2"/><span className="text-xs font-black uppercase tracking-widest">Click to upload</span><span className="text-[10px] mt-1">JPEG · PNG · WEBP</span></div>}
                      <input type="file" className="hidden" accept="image/*" onChange={handleImg} disabled={isUploading}/>
                    </label>
                  )}
                </div>
              </div>

              {/* Additional Product Gallery Images */}
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
                <label className={`${lbl} mb-4`}><ImageIcon size={12}/> Product Gallery (3 - 5 Images)</label>
                <div className="grid grid-cols-5 gap-3">
                  {(form.additional_images || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group bg-white dark:bg-slate-900 shadow-sm">
                      <img src={url} className="w-full h-full object-cover" alt="gallery-preview" />
                      <button
                        type="button"
                        onClick={() => setForm(p => ({
                          ...p,
                          additional_images: p.additional_images.filter((_, i) => i !== idx)
                        }))}
                        className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-300 rounded-2xl"
                      >
                        <X size={14} className="stroke-[3]" />
                      </button>
                    </div>
                  ))}

                  {(form.additional_images || []).length < 5 && (
                    <label className={`relative aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 rounded-2xl cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      <Plus size={16} className="text-slate-400" />
                      <span className="text-[8px] font-black uppercase text-slate-400 mt-1">Add</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            setIsUploading(true);
                            const blob = await compressImage(file);
                            const url = await uploadToStorage(blob, 'products');
                            setForm(p => ({
                              ...p,
                              additional_images: [...(p.additional_images || []), url]
                            }));
                          } catch (err) {
                            setError('Gallery image upload failed.');
                          } finally {
                            setIsUploading(false);
                          }
                        }}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
                <div className="flex justify-between items-center mt-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  <span>Images Count</span>
                  <span>{(form.additional_images || []).length} / 5 limit</span>
                </div>
              </div>

              {/* Colors */}
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-5">
                <label className={`${lbl} mb-4`}><Palette size={12}/> Color Variants</label>
                <div className="flex gap-2 mb-4">
                  <input type="text" value={colorName} onChange={e=>setColorName(e.target.value)} placeholder="Color name" className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"/>
                  <input type="color" value={colorCode} onChange={e=>setColorCode(e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900"/>
                  <button type="button" onClick={addColor} className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase rounded-xl hover:opacity-80 active:scale-95 transition-all">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.colors||[]).length===0&&<p className="text-[11px] text-slate-400 italic">No colors added yet.</p>}
                  {(form.colors||[]).map((c,i)=>(
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{backgroundColor:c.code}}/>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                      <button type="button" onClick={()=>setForm(p=>({...p,colors:p.colors.filter((_,j)=>j!==i)}))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={12}/></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="bg-slate-50 dark:bg-slate-950/30 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div>
              <label className={`${lbl} mb-4`}>Core Promotional Flags</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'featured', label: 'Featured', icon: Star, color: 'amber' },
                  { key: 'trending', label: 'Trending', icon: TrendingUp, color: 'rose' },
                  { key: 'dealOfDay', label: 'Deal of Day', icon: Zap, color: 'blue' },
                  { key: 'newArrival', label: 'New Arrival', icon: Clock, color: 'emerald' },
                ].map(({ key, label, icon: Icon, color }) => (
                  <button key={key} type="button" onClick={() => setForm(p => ({ ...p, [key]: !p[key] }))} className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 transition-all font-black tracking-widest text-xs ${form[key] ? COLORS[color] : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-300'}`}>
                    <Icon size={13}/>{label}
                  </button>
                ))}
              </div>
            </div>

            {sections.length > 0 && (
              <div>
                <label className={`${lbl} mb-4`}>Active Custom Section Placements</label>
                <div className="space-y-4">
                  {sections.map((sec) => {
                    if (sec.isDual === 1 || sec.isDual === true) {
                      const isSelectedA = (form.placements || []).includes(`${sec.id}-A`);
                      const isSelectedB = (form.placements || []).includes(`${sec.id}-B`);

                      const toggleSelectionA = () => {
                        const current = form.placements || [];
                        const next = isSelectedA 
                          ? current.filter(id => id !== `${sec.id}-A`)
                          : [...current, `${sec.id}-A`];
                        setForm(p => ({ ...p, placements: next }));
                      };

                      const toggleSelectionB = () => {
                        const current = form.placements || [];
                        const next = isSelectedB 
                          ? current.filter(id => id !== `${sec.id}-B`)
                          : [...current, `${sec.id}-B`];
                        setForm(p => ({ ...p, placements: next }));
                      };

                      const titleA = sec.subtitle || sec.category || 'All Categories';
                      const titleB = sec.titleB || sec.categoryB || 'All Categories';

                      return (
                        <div key={sec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Split Row: {sec.title || 'Untitled Dual Section'}</span>
                            <span className="text-[8px] bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded font-black uppercase">Split Layout</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Side A Selector */}
                            <button type="button" onClick={toggleSelectionA} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] text-left ${isSelectedA ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-400 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isSelectedA ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                                {isSelectedA && <span className="text-[10px]">✓</span>}
                              </div>
                              <div className="truncate flex-1">
                                <span className="text-[8px] text-orange-500 block mb-0.5">Side A</span>
                                {titleA}
                              </div>
                            </button>

                            {/* Side B Selector */}
                            <button type="button" onClick={toggleSelectionB} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] text-left ${isSelectedB ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-400 hover:border-slate-300'}`}>
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isSelectedB ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>
                                {isSelectedB && <span className="text-[10px]">✓</span>}
                              </div>
                              <div className="truncate flex-1">
                                <span className="text-[8px] text-indigo-500 block mb-0.5">Side B</span>
                                {titleB}
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Single Section
                    const isSelected = (form.placements || []).includes(sec.id) || (form.placements || []).includes(sec.id.toString()) || (form.placements || []).includes(`${sec.id}-A`);
                    const toggleSelection = () => {
                      const current = form.placements || [];
                      const next = isSelected 
                        ? current.filter(id => id.toString() !== sec.id.toString() && id !== `${sec.id}-A`)
                        : [...current, `${sec.id}-A`];
                      setForm(p => ({ ...p, placements: next }));
                    };

                    return (
                      <div key={sec.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Single Row: {sec.title || 'Untitled Section'}</span>
                          <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-black uppercase">Standard Layout</span>
                        </div>
                        <button type="button" onClick={toggleSelection} className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] text-left ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-400 hover:border-slate-300'}`}>
                          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-300'}`}>
                            {isSelected && <span className="text-[10px]">✓</span>}
                          </div>
                          <span className="truncate flex-1">{sec.title || sec.category || `Section #${sec.id}`}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
            {isSubmitting?<Loader2 size={20} className="animate-spin"/>:editingProduct?'Update Product':'Confirm & Publish Listing'}
          </button>

          <AnimatePresence>
            {error&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20"><AlertCircle size={15} className="mr-3 shrink-0"/>{error}</motion.div>}
            {success&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 size={15} className="mr-3 shrink-0"/>{success}</motion.div>}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
