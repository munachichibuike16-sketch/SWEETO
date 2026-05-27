import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, X, Loader2, CheckCircle2,
  ArrowLeft, Layout, Image as ImageIcon, Link, Type,
  Play, Monitor, Check, Layers, AlignLeft, Search, Package, Sparkles
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';

const EMPTY_BANNER = { title: '', subtitle: '', image: '', link: '', price: '', discount: '' };

const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

/* â”€â”€ Layout preview illustrations â”€â”€ */
const SliderPreview = () => (
  <div className="w-full aspect-[16/9] bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 relative shadow-inner">
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4">
      <div className="w-3/4 h-2 bg-slate-200 dark:bg-slate-600 rounded-full" />
      <div className="w-1/2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full" />
    </div>
    {/* Dot indicators */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
      <div className="w-5 h-1.5 bg-rose-400 rounded-full" />
      <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
      <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
    </div>
  </div>
);

const GridPreview = () => (
  <div className="w-full aspect-[16/9] bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex gap-1.5 p-1.5 shadow-inner">
    {/* Main large slot */}
    <div className="flex-[2] bg-slate-100 dark:bg-slate-700 rounded-lg" />
    {/* Two side slots */}
    <div className="flex-1 flex flex-col gap-1.5">
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg" />
      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg" />
    </div>
  </div>
);

const SplitPreview = () => (
  <div className="w-full aspect-[16/9] bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex gap-1.5 p-1.5 shadow-inner">
    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg flex flex-col justify-end p-1.5 gap-1">
      <div className="w-3/4 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
      <div className="w-1/2 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
    </div>
    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg flex flex-col justify-end p-1.5 gap-1">
      <div className="w-3/4 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full" />
      <div className="w-1/2 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
    </div>
  </div>
);

const LAYOUTS = [
  {
    key: 'slider',
    label: 'Single Slider',
    desc: 'Modern fullscreen slider for high-impact visual storytelling.',
    icon: Play,
    Preview: SliderPreview,
  },
  {
    key: 'grid',
    label: 'Featured Grid',
    desc: 'Bento-style grid featuring multiple products simultaneously.',
    icon: Layout,
    Preview: GridPreview,
  },
  {
    key: 'split',
    label: 'Split Banner',
    desc: 'Two equal-width panels side by side for dual promotions.',
    icon: Layers,
    Preview: SplitPreview,
  },
];

export default function HeroManagement() {
  const { settings = {}, refreshData, products = [] } = useStore();
  const [view, setView] = useState('overview');
  const [mode, setMode] = useState(settings?.hero_mode || 'slider');
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState(null); // 0=SideA, 1=SideB
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gridStyle, setGridStyle] = useState(settings?.hero_grid_style || 'cover');
  const [sliderStyle, setSliderStyle] = useState(settings?.hero_slider_style || 'glass');

  useEffect(() => {
    if (settings?.hero_banners) {
      try {
        const parsed = typeof settings.hero_banners === 'string' ? JSON.parse(settings.hero_banners) : settings.hero_banners;
        setBanners(Array.isArray(parsed) ? parsed : []);
      } catch (e) { setBanners([]); }
    }
    if (settings?.hero_mode) setMode(settings.hero_mode);
    if (settings?.hero_grid_style) setGridStyle(settings.hero_grid_style);
    if (settings?.hero_slider_style) setSliderStyle(settings.hero_slider_style);
  }, [settings]);

  const saveSettings = async (newMode, newBanners, isEnabled = settings?.hero_enabled !== false, newGridStyle = gridStyle, newSliderStyle = sliderStyle) => {
    setIsSubmitting(true); setError(''); setSuccess('');
    try {
      const updates = [
        { key: 'hero_mode', value: newMode },
        { key: 'hero_banners', value: typeof newBanners === 'string' ? newBanners : JSON.stringify(newBanners) },
        { key: 'hero_enabled', value: String(isEnabled) },
        { key: 'hero_grid_style', value: newGridStyle },
        { key: 'hero_slider_style', value: newSliderStyle }
      ];
      const { error: err } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (err) throw new Error(err.message);
      setSuccess('Hero settings updated!');
      refreshData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) { setError('Failed to update settings: ' + e.message); } finally { setIsSubmitting(false); }
  };

  const handleImg = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try {
      setIsUploading(true);
      const blob = await compressImage(file);
      const url = await uploadToStorage(blob, 'hero');
      setEditingBanner(p => ({ ...p, image: url }));
    } catch { setError('Upload failed.'); } finally { setIsUploading(false); }
  };

  const addBanner = () => {
    const newBanners = [...banners, { ...EMPTY_BANNER, id: Date.now().toString() }];
    setBanners(newBanners);
    saveSettings(mode, newBanners, settings?.hero_enabled !== false, gridStyle, sliderStyle);
  };

  const removeBanner = (id) => {
    const newBanners = banners.filter(b => b.id !== id);
    setBanners(newBanners);
    saveSettings(mode, newBanners, settings?.hero_enabled !== false, gridStyle, sliderStyle);
  };

  const openEdit = (banner) => { setEditingBanner({ ...banner }); setView('edit'); };

  // Grid mode: open slot picker for Side A (index 0) or Side B (index 1)
  const openGridSlotEdit = (slotIndex) => {
    setEditingSlotIndex(slotIndex);
    setEditingBanner(banners[slotIndex] || { ...EMPTY_BANNER, id: `side-${slotIndex}` });
    setProductSearch('');
    setView('edit');
  };

  // Grid mode: immediately save a product to a side slot
  const saveGridProduct = (product) => {
    const banner = {
      id: `side-${editingSlotIndex}`,
      title: product.name,
      subtitle: product.category || '',
      image: product.image_url || product.image || '',
      link: `/product/${product.id}`,
      price: product.price ? product.price.toLocaleString() : '',
      discount: product.discount ? `${product.discount}%` : '',
      product_id: product.id,
    };
    const newBanners = [...banners];
    newBanners[editingSlotIndex] = banner;
    setBanners(newBanners);
    saveSettings(mode, newBanners, settings?.hero_enabled !== false, gridStyle, sliderStyle);
    setView('overview');
  };

  const saveBannerEdit = () => {
    const newBanners = banners.map(b => b.id === editingBanner.id ? editingBanner : b);
    setBanners(newBanners);
    saveSettings(mode, newBanners, settings?.hero_enabled !== false, gridStyle, sliderStyle);
    setView('overview');
  };

  const toggleMode = (m) => { setMode(m); saveSettings(m, banners, settings?.hero_enabled !== false, gridStyle, sliderStyle); };

  /* â”€â”€ OVERVIEW â”€â”€ */
  if (view === 'overview') return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Monitor size={20}/></div>
            Hero Banner
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">Configure the main showcase at the top of your store</p>
        </div>

        {/* Enable toggle */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className={`text-xs font-black uppercase tracking-widest ${settings?.hero_enabled !== false ? 'text-emerald-500' : 'text-slate-400'}`}>
            {settings?.hero_enabled !== false ? 'Enabled' : 'Disabled'}
          </span>
          <button
            onClick={() => saveSettings(mode, banners, settings?.hero_enabled === false)}
            className={`w-12 h-6 rounded-full transition-all relative ${settings?.hero_enabled !== false ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${settings?.hero_enabled !== false ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {(success || error) && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold ${success ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {success ? <CheckCircle2 size={16}/> : <X size={16}/>}
            {success || error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€ CHOOSE LAYOUT â”€â”€ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-rose-500 rounded-[2px]" />
              ))}
            </div>
          </div>
          <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Choose Layout</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {LAYOUTS.map((layout) => {
            const isActive = mode === layout.key;
            return (
              <button
                key={layout.key}
                onClick={() => toggleMode(layout.key)}
                className={`group relative text-left rounded-2xl border-2 p-4 transition-all duration-300 ${
                  isActive
                    ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-500/5'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {/* Active checkmark */}
                {isActive && (
                  <div className="absolute top-4 right-4 w-5 h-5 bg-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-rose-400/30">
                    <Check size={11} className="text-white" strokeWidth={3}/>
                  </div>
                )}

                {/* Layout label */}
                <p className={`font-black uppercase tracking-widest text-xs mb-4 ${isActive ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  {layout.label}
                </p>

                {/* Preview illustration */}
                <layout.Preview />

                {/* Description */}
                <p className="mt-4 text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                  {layout.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CHOOSE STYLE ── */}
      {(mode === 'grid' || mode === 'slider') && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Sparkles size={16}/>
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-sm">Banner Display Style</h3>
              <p className="text-xs text-slate-400 font-medium">Choose how your product photos are displayed inside the banners</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Style 1: Full-Bleed Cover */}
            <button
              onClick={() => {
                if (mode === 'grid') {
                  setGridStyle('cover');
                  saveSettings(mode, banners, settings?.hero_enabled !== false, 'cover', sliderStyle);
                } else {
                  setSliderStyle('cover');
                  saveSettings(mode, banners, settings?.hero_enabled !== false, gridStyle, 'cover');
                }
              }}
              className={`group relative text-left rounded-2xl border-2 p-5 transition-all duration-300 ${
                (mode === 'grid' ? gridStyle === 'cover' : sliderStyle === 'cover')
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {/* Active checkmark */}
              {(mode === 'grid' ? gridStyle === 'cover' : sliderStyle === 'cover') && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Check size={11} className="text-white" strokeWidth={3}/>
                </div>
              )}

              <p className={`font-black uppercase tracking-widest text-xs mb-2 ${
                (mode === 'grid' ? gridStyle === 'cover' : sliderStyle === 'cover') ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'
              }`}>
                Full-Bleed Cover
              </p>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Product images cover the entire banner background with left dark-gradient overlays. Gives an immersive, modern lifestyle advertising look (Best for high-res studio photos).
              </p>
            </button>

            {/* Style 2: Studio Glass Frame */}
            <button
              onClick={() => {
                if (mode === 'grid') {
                  setGridStyle('glass');
                  saveSettings(mode, banners, settings?.hero_enabled !== false, 'glass', sliderStyle);
                } else {
                  setSliderStyle('glass');
                  saveSettings(mode, banners, settings?.hero_enabled !== false, gridStyle, 'glass');
                }
              }}
              className={`group relative text-left rounded-2xl border-2 p-5 transition-all duration-300 ${
                (mode === 'grid' ? gridStyle === 'glass' : sliderStyle === 'glass')
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/5'
                  : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {/* Active checkmark */}
              {(mode === 'grid' ? gridStyle === 'glass' : sliderStyle === 'glass') && (
                <div className="absolute top-4 right-4 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Check size={11} className="text-white" strokeWidth={3}/>
                </div>
              )}

              <p className={`font-black uppercase tracking-widest text-xs mb-2 ${
                (mode === 'grid' ? gridStyle === 'glass' : sliderStyle === 'glass') ? 'text-blue-500' : 'text-slate-700 dark:text-slate-300'
              }`}>
                Studio Glass Frame
              </p>
              <p className="text-[11px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                Product images float dynamically on the right side inside premium, rounded glassmorphic cards. Frames boxy, cardboard, or catalog pictures cleanly so they look highly polished.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ BANNERS / SLIDES (Slider & Split modes) â”€â”€ */}
      {mode !== 'grid' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-widest">Slides</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">{banners.length} slide{banners.length !== 1 ? 's' : ''} configured</p>
            </div>
            <button onClick={addBanner} className="flex items-center gap-2 px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-all shadow-sm">
              <Plus size={14}/> Add Slide
            </button>
          </div>
          {banners.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-700">
                <ImageIcon size={36} className="text-slate-300 dark:text-slate-600"/>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">No Slides Configured</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 font-medium">Add your first slide above</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {banners.map((b, i) => (
                <motion.div key={b.id || i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="group relative bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-900/70 text-white backdrop-blur-sm">Slide {i + 1}</div>
                  <div className="relative w-full aspect-video bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    {b.image ? <img src={b.image} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/> : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600"><ImageIcon size={28}/><span className="text-[9px] font-black uppercase mt-2 tracking-widest">No Image</span></div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(b)} className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg"><Edit size={16}/></button>
                      <button onClick={() => removeBanner(b.id)} className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg shadow-red-500/30"><Trash2 size={16}/></button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">{b.title || 'Untitled'}</h4>
                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{b.subtitle || 'No subtitle'}</p>
                    {b.link && <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800"><Link size={10} className="text-slate-300 dark:text-slate-600 shrink-0"/><span className="text-[9px] font-bold text-slate-400 truncate">{b.link.replace(/^https?:\/\//, '')}</span></div>}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ GRID MODE: Main (auto) + Side A + Side B â”€â”€ */}
      {mode === 'grid' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-widest">Grid Slots</h3>
            <p className="text-xs text-slate-400 font-medium mt-1">Main auto-cycles all products Â· Pick one product for each side panel</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Main â€” auto */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/30 overflow-hidden">
              <div className="aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <Play size={20} className="text-emerald-500"/>
                </div>
                <p className="font-black text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest">Main Panel</p>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Auto-cycles through all your active products. No setup needed.</p>
              </div>
              <div className="px-4 pb-4">
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Auto â€” {products.filter(p => p.status !== 'draft').length} products</span>
                </div>
              </div>
            </div>

            {/* Side A */}
            {[0, 1].map((slotIdx) => {
              const slotBanner = banners[slotIdx];
              const label = slotIdx === 0 ? 'Side A' : 'Side B';
              const accentColor = slotIdx === 0 ? 'blue' : 'indigo';
              return (
                <div key={slotIdx} className={`rounded-2xl border-2 overflow-hidden transition-all ${
                  slotBanner ? `border-${accentColor}-200 dark:border-${accentColor}-800` : 'border-dashed border-slate-200 dark:border-slate-700'
                }`}>
                  {slotBanner ? (
                    <>
                      <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                        {slotBanner.image ? (
                          <img src={slotBanner.image} alt={slotBanner.title} className="w-full h-full object-cover"/>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-slate-300"/></div>
                        )}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-slate-900/70 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{label}</div>
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => openGridSlotEdit(slotIdx)} className="w-9 h-9 bg-white text-slate-900 rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg"><Edit size={14}/></button>
                          <button onClick={() => { const nb = [...banners]; nb[slotIdx] = undefined; const clean = nb.filter(Boolean); setBanners(clean); saveSettings(mode, clean); }} className="w-9 h-9 bg-red-500 text-white rounded-xl flex items-center justify-center hover:scale-110 transition-all shadow-lg"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-black text-slate-900 dark:text-white text-xs truncate">{slotBanner.title}</p>
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{slotBanner.subtitle}</p>
                      </div>
                    </>
                  ) : (
                    <button onClick={() => openGridSlotEdit(slotIdx)} className="w-full aspect-video flex flex-col items-center justify-center gap-3 p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className={`w-10 h-10 rounded-2xl bg-${accentColor}-500/10 flex items-center justify-center`}>
                        <Plus size={18} className={`text-${accentColor}-500`}/>
                      </div>
                      <div>
                        <p className="font-black text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest">{label}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Click to pick a product</p>
                      </div>
                    </button>
                  )}
                </div>
              );
            })}

          </div>
        </div>
      )}

    </div>
  );

  /* â”€â”€ EDIT BANNER â”€â”€ */
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const pickProduct = (p) => {
    setEditingBanner(prev => ({
      ...prev,
      title: p.name || prev.title,
      subtitle: p.category || prev.subtitle,
      price: p.price ? p.price.toLocaleString() : prev.price,
      discount: p.discount ? `${p.discount}%` : prev.discount,
      image: p.image_url || prev.image,
      link: `/product/${p.id}`,
      product_id: p.id,
    }));
  };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 max-w-5xl mx-auto pb-20">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => setView('overview')} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm">
          <ArrowLeft size={18}/>
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {mode === 'grid' ? `Grid â€” ${editingSlotIndex === 0 ? 'Side A' : 'Side B'}` : 'Edit Banner'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {mode === 'grid' ? 'Click a product to assign it to this slot â€” saves instantly' : 'Pick a product or fill in the details manually'}
          </p>
        </div>
      </div>

      {/* â”€â”€ PRODUCT PICKER (always shown) â”€â”€ */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <Sparkles size={15}/>
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-widest">Select a Product</p>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              {mode === 'grid' ? 'Click to assign â€” auto-saved immediately' : 'Click any product to auto-fill the banner fields'}
            </p>
          </div>
          <div className="relative w-56">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            <input
              type="text"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="p-4 max-h-[420px] overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="py-10 flex flex-col items-center justify-center text-center">
              <Package size={32} className="text-slate-200 dark:text-slate-700 mb-2"/>
              <p className="text-xs font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                {productSearch ? 'No products match' : 'No products in store'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map(p => {
                const isSelected = mode === 'grid'
                  ? banners[editingSlotIndex]?.product_id === p.id
                  : editingBanner?.product_id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => mode === 'grid' ? saveGridProduct(p) : pickProduct(p)}
                    className={`group relative text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon size={20} className="text-slate-300 dark:text-slate-600"/>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check size={16} className="text-white" strokeWidth={3}/>
                          </div>
                        </div>
                      )}
                      {/* Grid mode: show "Tap to assign" hint on hover */}
                      {mode === 'grid' && !isSelected && (
                        <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[9px] font-black uppercase tracking-widest">Assign</span>
                        </div>
                      )}
                      {p.discount > 0 && (
                        <div className="absolute top-1.5 left-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md">
                          -{p.discount}%
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="font-black text-slate-900 dark:text-white text-[10px] leading-tight truncate">{p.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{p.category || 'Uncategorized'}</p>
                      <p className={`text-[10px] font-black mt-1 ${isSelected ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        {p.price?.toLocaleString()} {settings?.currency || 'FCFA'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* â”€â”€ MANUAL FORM (slider / split modes only) â”€â”€ */}
      {mode !== 'grid' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Fields */}
            <div className="space-y-5">
              <div>
                <label className={lbl}><Type size={12}/> Banner Title</label>
                <input type="text" value={editingBanner.title} onChange={e => setEditingBanner({ ...editingBanner, title: e.target.value })} placeholder="Main catchy title" className={inp}/>
              </div>
              <div>
                <label className={lbl}><AlignLeft size={12}/> Subtitle / Details</label>
                <input type="text" value={editingBanner.subtitle} onChange={e => setEditingBanner({ ...editingBanner, subtitle: e.target.value })} placeholder="Short descriptive text" className={inp}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Price Text</label>
                  <input type="text" value={editingBanner.price} onChange={e => setEditingBanner({ ...editingBanner, price: e.target.value })} placeholder="e.g. 500,000" className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Discount Label</label>
                  <input type="text" value={editingBanner.discount} onChange={e => setEditingBanner({ ...editingBanner, discount: e.target.value })} placeholder="e.g. 15%" className={inp}/>
                </div>
              </div>
              <div>
                <label className={lbl}><Link size={12}/> Destination Link</label>
                <input type="text" value={editingBanner.link} onChange={e => setEditingBanner({ ...editingBanner, link: e.target.value })} placeholder="/product/123 or https://..." className={inp}/>
              </div>
            </div>

            {/* Image uploader */}
            <div className="space-y-5">
              <label className={lbl}>Banner Image</label>
              <div className="relative aspect-video rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 overflow-hidden flex items-center justify-center group">
                {editingBanner.image ? (
                  <>
                    <img src={editingBanner.image} className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <label className="px-5 py-2.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:scale-105 transition-all shadow-lg">
                        Change<input type="file" className="hidden" onChange={handleImg}/>
                      </label>
                      <button onClick={() => setEditingBanner({ ...editingBanner, image: '' })} className="p-3 bg-red-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors gap-3">
                    {isUploading
                      ? <Loader2 size={32} className="animate-spin text-blue-500"/>
                      : <>
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <ImageIcon size={24} className="text-blue-400"/>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Click to upload image</span>
                          <span className="text-[9px] text-slate-300 dark:text-slate-600 font-medium">PNG, JPG, WEBP</span>
                        </>
                    }
                    <input type="file" className="hidden" onChange={handleImg} disabled={isUploading}/>
                  </label>
                )}
              </div>

              {(error || success) && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold ${success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {success ? <CheckCircle2 size={14}/> : <X size={14}/>}
                  {success || error}
                </div>
              )}

              <button
                onClick={saveBannerEdit}
                disabled={isSubmitting}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin"/> : <><Check size={16}/>Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saving indicator for grid mode */}
      {mode === 'grid' && isSubmitting && (
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 size={18} className="animate-spin text-blue-500"/>
          <span className="text-sm font-bold text-slate-500">Savingâ€¦</span>
        </div>
      )}

    </motion.div>
  );
}

