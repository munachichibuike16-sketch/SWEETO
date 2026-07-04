import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Loader2, CheckCircle2, AlertCircle, Tag, DollarSign, ListOrdered, FileText, Award, Percent, Star, TrendingUp, Zap, Clock, Smartphone, Tv, Speaker, Snowflake, Palette, Image as ImageIcon, ArrowLeft, Package, MessageCircle } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';
import { apiFetch, API_BASE_URL } from '../utils/api';
import { formatDbError } from '../utils/errorHelper';

const FacebookIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const EMPTY = { 
  name:'', price:'', originalPrice:'', categoryId:'', brandId:'', description:'', image_url:'', additional_images:[], status:'active', 
  featured:false, trending:false, dealOfDay:false, newArrival:false, smartphonesPlacement:false, homeCinemaPlacement:false, 
  speakersPlacement:false, refrigeratorsPlacement:false, colors:[], placements:[], condition:'new', stock:10, costPrice:'',
  productLine:'', laptopType:'', os:'', ramCapacity:'', ramType:'', storageCapacity:'', storageType:'', processorTier:'', processorGeneration:'', processorModel:'',
  phoneRam:'', phoneStorage:'', screenSize:'', battery:'', camera:'',
  chargerPort:'', chargerPower:'', fastCharging:'',
  compatBrand:'', connectorTip:'', wattage:'', voltage:'',
  cableType:'', length:'', cableVersion:'',
  usbCapacity:'', usbVersion:'', usbConnector:'',
  ramSpeed:'', ramFormFactor:'',
  driveType:'', driveFormFactor:'', driveSpeed:'',
  runTime:'', chargeTime:'', bladeMaterial:'', cordless:'',
  customSpecs:[]
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
  const [isDescribing, setIsDescribing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [autoPostFacebook, setAutoPostFacebook] = useState(false);
  const [savedProductForShare, setSavedProductForShare] = useState(null);
  const [colorName, setColorName] = useState('');
  const [colorCode, setColorCode] = useState('#0000FF');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const filteredCategoriesList = React.useMemo(() => {
    if (showAllCategories || !form.name) return categories;
    
    const titleLower = form.name.toLowerCase();
    let keywords = [];
    if (/hp charger|dell charger|lenovo charger|laptop charger|chargeur/i.test(titleLower)) {
      if (/laptop/i.test(titleLower)) {
        keywords = ['laptop charger', 'chargeur laptop', 'chargeur pc', 'chargeur ordinateur'];
      } else {
        keywords = ['phone charger', 'chargeur téléphone', 'chargeur mobile', 'adaptateur', 'charger'];
      }
    } else if (/hp|dell|lenovo|macbook|asus|acer|toshiba|thinkpad|laptop|notebook|probook|elitebook|latitude/i.test(titleLower)) {
      keywords = ['laptop', 'laptops', 'computer', 'computers', 'ordinateur', 'ordinateurs', 'pc'];
    } else if (/iphone|samsung|pixel|xiaomi|redmi|huawei|infinix|tecno|phone|smartphone/i.test(titleLower)) {
      keywords = ['phone', 'phones', 'smartphone', 'smartphones', 'mobile', 'mobiles', 'téléphone', 'téléphones'];
    } else if (/cable|câble|hdmi|displayport|vga|rj45|coaxial|optical/i.test(titleLower)) {
      keywords = ['cable', 'cables', 'câble', 'câbles'];
    } else if (/usb|flash|cle|key/i.test(titleLower)) {
      keywords = ['usb', 'flash drive', 'cle usb', 'clé usb', 'stockage'];
    } else if (/ram|memory/i.test(titleLower)) {
      keywords = ['ram', 'memory', 'mémoire'];
    } else if (/ssd|hdd|hard drive|disque/i.test(titleLower)) {
      keywords = ['ssd', 'hdd', 'hard drive', 'disque dur', 'stockage'];
    } else if (/clipper|cutter|tondeuse|hair/i.test(titleLower)) {
      keywords = ['clipper', 'cutter', 'tondeuse', 'hair', 'cheveux'];
    }
    
    if (keywords.length === 0) return categories;
    
    const filtered = categories.filter(c => 
      keywords.some(kw => c.name?.toLowerCase().includes(kw))
    );
    
    return filtered.length > 0 ? filtered : categories;
  }, [categories, form.name, showAllCategories]);

  const handleNameChange = (val) => {
    setForm(p => {
      const nextForm = { ...p, name: val };
      const titleLower = val.toLowerCase();
      
      let suggestedCategoryName = null;
      if (/hp charger|dell charger|lenovo charger|laptop charger/i.test(titleLower)) {
        suggestedCategoryName = 'Laptop Charger';
      } else if (/phone charger|chargeur phone|chargeur telephone|lightning charger/i.test(titleLower)) {
        suggestedCategoryName = 'Phone Charger';
      } else if (/hp|dell|lenovo|macbook|asus|acer|toshiba|thinkpad|laptop|notebook|probook|elitebook|latitude/i.test(titleLower)) {
        suggestedCategoryName = 'Laptop';
      } else if (/iphone|samsung|pixel|xiaomi|redmi|huawei|infinix|tecno|phone|smartphone/i.test(titleLower)) {
        suggestedCategoryName = 'Phone';
      } else if (/cable|câble|hdmi|displayport|vga/i.test(titleLower)) {
        suggestedCategoryName = 'Cable';
      } else if (/usb|flash/i.test(titleLower)) {
        suggestedCategoryName = 'USB';
      } else if (/ram|memory ram/i.test(titleLower)) {
        suggestedCategoryName = 'RAM';
      } else if (/ssd|hdd|hard drive/i.test(titleLower)) {
        suggestedCategoryName = 'SSD';
      } else if (/clipper|cutter|tondeuse/i.test(titleLower)) {
        suggestedCategoryName = 'Tondeuse';
      }
      
      if (suggestedCategoryName) {
        const matchedCat = categories.find(c => c.name?.toLowerCase().includes(suggestedCategoryName.toLowerCase()));
        if (matchedCat) {
          nextForm.categoryId = matchedCat.id?.toString();
        }
      }
      
      return nextForm;
    });
  };

  const autoDescribeFromImage = async () => {
    if (!form.image_url) {
      setError('Please upload a product image first before using Auto-Describe!');
      return;
    }
    setError('');
    try {
      setIsDescribing(true);
      const res = await apiFetch('/products/describe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: form.image_url })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze product image');
      }
      if (data.description) {
        setForm(p => ({ ...p, description: data.description }));
        setSuccess('Product description generated successfully from image! 🤖✨');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('AI did not return a description.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to auto-describe from image.');
    } finally {
      setIsDescribing(false);
    }
  };

  const autoGenerateDescription = () => {
    const catObj = categories.find(c => c.id?.toString() === form.categoryId?.toString());
    const catName = catObj?.name?.toLowerCase() || '';
    const brandObj = brands.find(b => b.id?.toString() === form.brandId?.toString());
    const brandName = brandObj?.name || '';
    
    let text = '';

    if (catName.includes('laptop') && !catName.includes('charger')) {
      const line = form.productLine || '';
      const type = form.laptopType || '';
      const os = form.os || '';
      const ramCap = form.ramCapacity || '';
      const ramT = form.ramType || '';
      const storageCap = form.storageCapacity || '';
      const storageT = form.storageType || '';
      const cpuTier = form.processorTier || '';
      const cpuGen = form.processorGeneration || '';
      const cpuModel = form.processorModel || '';

      let titlePart = (brandName || line) ? `${brandName} ${line}`.trim() : (form.name || 'High performance');
      let typeStr = type ? `${type} laptop` : 'laptop';
      let cpuStr = (cpuTier || cpuGen || cpuModel) ? `Powered by an ${cpuTier} ${cpuGen} ${cpuModel ? `(${cpuModel})` : ''} processor`.replace(/\s+/g, ' ').trim() : '';
      let memoryStr = '';
      if (ramCap || storageCap) {
        const parts = [];
        if (ramCap) parts.push(`${ramCap} ${ramT}`.trim());
        if (storageCap) parts.push(`${storageCap} ${storageT}`.trim());
        memoryStr = `equipped with ${parts.join(' memory and ')} storage`.replace(/\s+/g, ' ').trim();
      }
      let osStr = os ? `Pre-installed with ${os}.` : '';
      text = `${titlePart} ${typeStr}. ${cpuStr} ${memoryStr}. ${osStr} Designed for reliability and exceptional efficiency.`;

    } else if (catName.includes('phone') && !catName.includes('charger') && !catName.includes('cable')) {
      const ram = form.phoneRam || '';
      const storage = form.phoneStorage || '';
      const screen = form.screenSize || '';
      const batt = form.battery || '';
      const cam = form.camera || '';
      text = `${brandName || 'Smartphone'} ${form.name || ''} featuring a gorgeous ${screen ? `${screen} display` : 'screen'}, ${cam ? `${cam} high-resolution camera` : 'camera'}, and a long-lasting ${batt ? `${batt} battery` : 'battery'}. Built with ${storage ? `${storage} storage` : 'ample storage'} and ${ram ? `${ram} RAM` : 'high performance'} for seamless multitasking.`;

    } else if (catName.includes('charger') && catName.includes('laptop')) {
      const tip = form.connectorTip || '';
      const watt = form.wattage || '';
      const volt = form.voltage || '';
      text = `Premium replacement AC power adapter / charger compatible with ${form.compatBrand || brandName || 'laptops'}. Delivers ${watt ? `${watt} of power` : 'high efficiency power'} via a durable ${tip ? `${tip} connector tip` : 'connector'}. Input range support: ${volt || '100-240V'}.`;

    } else if (catName.includes('charger')) {
      const port = form.chargerPort || '';
      const power = form.chargerPower || '';
      const fast = form.fastCharging || '';
      text = `High-speed wall adapter charger featuring a convenient ${port || 'charging'} port. Outputs up to ${power || 'standard fast charge'} power. ${fast ? `Supports ${fast} fast charging protocol.` : 'Engineered with smart safety protection against overheating.'}`;

    } else if (catName.includes('cable') || catName.includes('câble')) {
      const type = form.cableType || '';
      const len = form.length || '';
      const ver = form.cableVersion || '';
      text = `Heavy-duty ${ver ? `${ver} standard` : ''} ${type || 'connection'} cable. Measures ${len || 'standard'} length. Perfect for connecting computer displays, televisions, audio systems, or charging mobile accessories.`;

    } else if (catName.includes('usb') || catName.includes('flash') || catName.includes('stockage')) {
      const cap = form.usbCapacity || '';
      const ver = form.usbVersion || '';
      const conn = form.usbConnector || '';
      text = `High-capacity ${cap || ''} USB flash drive with ${ver || 'high-speed'} performance. Features a robust ${conn || 'standard USB'} connector. Lightweight, pocket-sized, and secure for carrying all your photos, documents, and system backups.`;

    } else if (catName.includes('ram') || catName.includes('mémoire')) {
      const speed = form.ramSpeed || '';
      const ff = form.ramFormFactor || '';
      const capacity = form.ramCapacity || '';
      const rType = form.ramType || '';
      text = `High-speed ${capacity ? `${capacity} module` : 'memory module'} of ${rType || 'DDR'} ${ff || 'RAM'}. Operates at an ultra-responsive ${speed || 'frequency'} speed. Perfect upgrade to boost computing performance and eliminate system bottlenecks.`;

    } else if (catName.includes('ssd') || catName.includes('hdd') || catName.includes('drive') || catName.includes('disque')) {
      const type = form.driveType || '';
      const ff = form.driveFormFactor || '';
      const speed = form.driveSpeed || '';
      const capacity = form.storageCapacity || '';
      text = `Ultra-reliable ${capacity || ''} ${type || 'internal'} storage drive in the compact ${ff || 'standard'} form factor. Offers lightning-fast ${speed ? `${speed} speeds` : 'read and write speeds'} to accelerate boot times and system responsiveness.`;

    } else if (catName.includes('clipper') || catName.includes('cutter') || catName.includes('tondeuse') || catName.includes('hair')) {
      const runtime = form.runTime || '';
      const charge = form.chargeTime || '';
      const blade = form.bladeMaterial || '';
      const cordless = form.cordless || '';
      text = `Professional hair clipper trimmer set featuring self-sharpening ${blade ? `${blade} blades` : 'precision blades'}. ${cordless === 'Yes' ? `Cordless design offering up to ${runtime} cordless running time on a single ${charge} charge.` : `Corded design for continuous power cutting.`} Designed with ergonomic grip for comfortable handling and styling.`;

    } else {
      text = `${brandName || ''} ${form.name || ''}. ${form.description || 'Premium high-performance electronics gear engineered for ultimate diagnostics.'}`;
    }

    if (form.customSpecs && form.customSpecs.length > 0) {
      const specPhrases = form.customSpecs
        .filter(s => s.key && s.value)
        .map(s => `${s.key}: ${s.value}`);
      if (specPhrases.length > 0) {
        text += ` Key specs - ${specPhrases.join(', ')}.`;
      }
    }

    setForm(p => ({ ...p, description: text.replace(/\s+/g, ' ').replace(/\s\./g, '.').replace(/\s,/g, ',').trim() }));
  };

  const openAdd = () => { setForm(EMPTY); setEditingProduct(null); setError(''); setSuccess(''); setView('form'); };
  const openEdit = (p) => {
    const cat = categories.find(c => c.name?.toLowerCase() === p.category?.toLowerCase());
    const br = brands.find(b => b.name?.toLowerCase() === p.brand?.toLowerCase());
    
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

    let descText = p.description ?? '';
    let specs = null;
    try {
      if (descText && descText.trim().startsWith('{')) {
        const parsed = JSON.parse(descText);
        descText = parsed.text || '';
        specs = parsed.specs || null;
      }
    } catch(e) {
      console.warn("Failed to parse product description JSON:", e);
    }

    setForm({ 
      name: p.name ?? '', 
      price: p.price ?? '', 
      originalPrice: p.original_price ?? p.originalPrice ?? '', 
      categoryId: cat?.id?.toString() || p.categoryId?.toString() || '', 
      brandId: br?.id?.toString() || p.brand_id?.toString() || '', 
      description: descText, 
      image_url: p.image_url ?? '', 
      additional_images: additionalImages,
      status: p.status || (p.is_active ? 'active' : 'inactive') || 'active', 
      featured: Boolean(p.is_featured) || false, 
      trending: Boolean(p.is_trending) || false, 
      dealOfDay: Boolean(p.is_deal || p.is_daily_deal) || false, 
      newArrival: Boolean(p.is_new_arrival) || false, 
      smartphonesPlacement: Boolean(p.smartphones_placement) || false, 
      homeCinemaPlacement: Boolean(p.home_cinema_placement) || false, 
      speakersPlacement: Boolean(p.speakers_placement) || false, 
      refrigeratorsPlacement: Boolean(p.refrigerators_placement) || false, 
      colors: typeof p.colors === 'string' ? JSON.parse(p.colors) : (p.colors || []),
      placements: placements,
      condition: p.condition || 'new',
      stock: p.stock || p.stock_quantity || 0,
      costPrice: p.cost_price || p.bought_price || p.costPrice || '',
      productLine: specs?.productLine || '',
      laptopType: specs?.laptopType || '',
      os: specs?.os || '',
      ramCapacity: specs?.ramCapacity || '',
      ramType: specs?.ramType || '',
      storageCapacity: specs?.storageCapacity || '',
      storageType: specs?.storageType || '',
      processorTier: specs?.processorTier || '',
      processorGeneration: specs?.processorGeneration || '',
      processorModel: specs?.processorModel || '',
      phoneRam: specs?.phoneRam || '',
      phoneStorage: specs?.phoneStorage || '',
      screenSize: specs?.screenSize || '',
      battery: specs?.battery || '',
      camera: specs?.camera || '',
      chargerPort: specs?.chargerPort || '',
      chargerPower: specs?.chargerPower || '',
      fastCharging: specs?.fastCharging || '',
      compatBrand: specs?.compatBrand || '',
      connectorTip: specs?.connectorTip || '',
      wattage: specs?.wattage || '',
      voltage: specs?.voltage || '',
      cableType: specs?.cableType || '',
      length: specs?.length || '',
      cableVersion: specs?.cableVersion || '',
      usbCapacity: specs?.usbCapacity || '',
      usbVersion: specs?.usbVersion || '',
      usbConnector: specs?.usbConnector || '',
      ramSpeed: specs?.ramSpeed || '',
      ramFormFactor: specs?.ramFormFactor || '',
      driveType: specs?.driveType || '',
      driveFormFactor: specs?.driveFormFactor || '',
      driveSpeed: specs?.driveSpeed || '',
      runTime: specs?.runTime || '',
      chargeTime: specs?.chargeTime || '',
      bladeMaterial: specs?.bladeMaterial || '',
      cordless: specs?.cordless || '',
      customSpecs: specs?.customSpecs || []
    });
    setEditingProduct(p);
    setError(''); setSuccess('');
    setView('form');
  };
  const backToList = () => { setView('list'); setEditingProduct(null); setForm(EMPTY); setError(''); setSuccess(''); setAutoPostFacebook(false); setSavedProductForShare(null); };

  const handleImg = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { setIsUploading(true); const blob = await compressImage(file); const url = await uploadToStorage(blob,'products'); setForm(p=>({...p,image_url:url})); }
    catch { setError('Image upload failed.'); } finally { setIsUploading(false); }
  };

  const addColor = () => { if (!colorName.trim()) return; setForm(p=>({...p,colors:[...(p.colors||[]),{name:colorName.trim(),code:colorCode}]})); setColorName(''); setColorCode('#0000FF'); };

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

      const specsObject = {
        productLine: form.productLine || '',
        laptopType: form.laptopType || '',
        os: form.os || '',
        ramCapacity: form.ramCapacity || '',
        ramType: form.ramType || '',
        storageCapacity: form.storageCapacity || '',
        storageType: form.storageType || '',
        processorTier: form.processorTier || '',
        processorGeneration: form.processorGeneration || '',
        processorModel: form.processorModel || '',
        phoneRam: form.phoneRam || '',
        phoneStorage: form.phoneStorage || '',
        screenSize: form.screenSize || '',
        battery: form.battery || '',
        camera: form.camera || '',
        chargerPort: form.chargerPort || '',
        chargerPower: form.chargerPower || '',
        fastCharging: form.fastCharging || '',
        compatBrand: form.compatBrand || '',
        connectorTip: form.connectorTip || '',
        wattage: form.wattage || '',
        voltage: form.voltage || '',
        cableType: form.cableType || '',
        length: form.length || '',
        cableVersion: form.cableVersion || '',
        usbCapacity: form.usbCapacity || '',
        usbVersion: form.usbVersion || '',
        usbConnector: form.usbConnector || '',
        ramSpeed: form.ramSpeed || '',
        ramFormFactor: form.ramFormFactor || '',
        driveType: form.driveType || '',
        driveFormFactor: form.driveFormFactor || '',
        driveSpeed: form.driveSpeed || '',
        runTime: form.runTime || '',
        chargeTime: form.chargeTime || '',
        bladeMaterial: form.bladeMaterial || '',
        cordless: form.cordless || '',
        customSpecs: form.customSpecs || []
      };

      const hasSpecs = Object.entries(specsObject).some(([k, val]) => {
        if (k === 'customSpecs') return Array.isArray(val) && val.length > 0;
        return !!val;
      });

      const descriptionPayload = hasSpecs ? JSON.stringify({
        text: form.description || '',
        specs: specsObject
      }) : form.description || '';

      const payload = { 
        name: form.name,
        slug: generatedSlug,
        description: descriptionPayload,
        price: parseFloat(form.price) || 0,
        original_price: form.originalPrice ? parseFloat(form.originalPrice) : null,
        cost_price: form.costPrice ? parseFloat(form.costPrice) : null,
        bought_price: form.costPrice ? parseFloat(form.costPrice) : 0,
        stock_quantity: parseInt(form.stock) || 0,
        stock: parseInt(form.stock) || 0,
        is_active: form.status === 'active' ? 1 : 0,
        status: form.status || 'active',
        is_featured: form.featured ? 1 : 0,
        is_deal: form.dealOfDay ? 1 : 0,
        is_trending: form.trending ? 1 : 0,
        is_new_arrival: form.newArrival ? 1 : 0,
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

      // Trigger push notification for new products (not updates)
      if (!editingProduct) {
        try {
          const { error: pushErr } = await supabase.functions.invoke('send-web-push', {
            body: {
              title: `🆕 New Arrival: ${form.name}`,
              body: `Check out the new ${categories.find(c => c.id?.toString() === form.categoryId?.toString())?.name || 'product'} now available!`,
              url: `/#/product/${payload.id || ''}`,
              image: form.image_url || null,
              targetRole: 'customer'
            }
          });
          if (pushErr) throw pushErr;
          console.log('✅ Push notification sent for new product:', form.name);
        } catch (pushErr) {
          console.warn('⚠️ Push notification failed (non-critical):', pushErr);
        }
      }

      if (autoPostFacebook) {
        try {
          const fbPayload = {
            id: payload.id,
            name: payload.name,
            description: form.description || '',
            price: payload.price,
            image_url: payload.image_url
          };
          apiFetch('/social/facebook-post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: fbPayload })
          }).then(res => {
            if (!res.ok) {
              res.json().then(d => console.warn('Facebook auto-post failed:', d.error));
            } else {
              console.log('✅ Facebook auto-post succeeded!');
            }
          }).catch(err => console.warn('Facebook auto-post network error:', err));
        } catch (e) {
          console.warn('Facebook auto-post trigger failed:', e);
        }
      }

      setSuccess(editingProduct?'Product updated!':'Product added!');
      refreshData();
      
      if (!editingProduct) {
        setSavedProductForShare({
          id: payload.id,
          name: payload.name,
          price: payload.price,
          description: form.description || '',
          image_url: payload.image_url
        });
      } else {
        setTimeout(()=>backToList(), 1500);
      }
    } catch (err) {
      console.error(err);
      setError(formatDbError(err, 'Failed to save product.'));
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

  const getShareUrl = (productId) => {
    if (!API_BASE_URL || API_BASE_URL.includes('your-backend-service.onrender.com')) {
      return `${window.location.origin}/#/product/${productId}`;
    }
    return `${API_BASE_URL}/share/product/${productId}?redirect=${encodeURIComponent(window.location.origin)}`;
  };

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
                <input type="text" value={form.name} onChange={e=>handleNameChange(e.target.value)} placeholder="e.g. MacBook Pro M3 Max" className={inp}/>
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
                  <div className="flex justify-between items-center mb-2 mr-1">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      <ListOrdered size={12}/> Category *
                    </label>
                    {form.name && filteredCategoriesList.length < categories.length && (
                      <button 
                        type="button" 
                        onClick={() => setShowAllCategories(!showAllCategories)} 
                        className="text-[9px] text-blue-600 dark:text-blue-400 font-bold hover:underline"
                      >
                        {showAllCategories ? 'Show Filtered' : 'Show All'}
                      </button>
                    )}
                  </div>
                  <select value={form.categoryId} onChange={e=>setForm(p=>({...p,categoryId:e.target.value}))} className={`${inp} appearance-none`}>
                    <option value="">Select Category</option>
                    {filteredCategoriesList.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
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
                <div className="flex justify-between items-center mb-2 mr-1">
                  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <FileText size={12}/> Description
                  </label>
                  <div className="flex gap-2">
                    {form.image_url && (
                      <button
                        type="button"
                        onClick={autoDescribeFromImage}
                        disabled={isDescribing}
                        className="text-[9px] bg-indigo-650 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                      >
                        {isDescribing ? (
                          <>
                            <Loader2 size={10} className="animate-spin" /> Analysing...
                          </>
                        ) : (
                          <>
                            ✨ Auto-Describe from Image
                          </>
                        )}
                      </button>
                    )}
                    {(() => {
                      const catObj = categories.find(c => c.id?.toString() === form.categoryId?.toString());
                      const isLaptop = catObj?.name?.toLowerCase().includes('laptop') || catObj?.name?.toLowerCase().includes('ordinateur') || catObj?.name?.toLowerCase().includes('computer');
                      return isLaptop && (
                        <button
                          type="button"
                          onClick={autoGenerateDescription}
                          className="text-[9px] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest px-2.5 py-1 rounded-xl flex items-center gap-1 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          🪄 Auto-Generate
                        </button>
                      );
                    })()}
                  </div>
                </div>
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

              {/* Laptop specifications accordion */}
              {(() => {
                const activeCategory = (() => {
                  const catObj = categories.find(c => c.id?.toString() === form.categoryId?.toString());
                  return catObj?.name?.toLowerCase() || '';
                })();

                const specFieldsType = (() => {
                  if (!activeCategory) return null;
                  if (activeCategory.includes('laptop') && !activeCategory.includes('charger')) return 'laptop';
                  if (activeCategory.includes('phone') && !activeCategory.includes('charger') && !activeCategory.includes('cable')) return 'phone';
                  if (activeCategory.includes('charger') && activeCategory.includes('laptop')) return 'laptop_charger';
                  if (activeCategory.includes('charger')) return 'phone_charger';
                  if (activeCategory.includes('cable') || activeCategory.includes('câble')) return 'cable';
                  if (activeCategory.includes('usb') || activeCategory.includes('flash') || activeCategory.includes('stockage')) return 'usb_storage';
                  if (activeCategory.includes('ram') || activeCategory.includes('mémoire')) return 'ram_memory';
                  if (activeCategory.includes('ssd') || activeCategory.includes('hdd') || activeCategory.includes('drive') || activeCategory.includes('disque')) return 'storage_drive';
                  if (activeCategory.includes('clipper') || activeCategory.includes('cutter') || activeCategory.includes('tondeuse') || activeCategory.includes('hair')) return 'hair_cutter';
                  return 'generic';
                })();

                if (!specFieldsType) return null;

                const accordionLabel = {
                  laptop: '💻 More Laptop Details',
                  phone: '📱 More Phone Details',
                  laptop_charger: '🔌 More Laptop Charger Details',
                  phone_charger: '🔌 More Phone Charger Details',
                  cable: '🔌 More Cable Details',
                  usb_storage: '💾 More USB/Flash Details',
                  ram_memory: '📟 More RAM Memory Details',
                  storage_drive: '💽 More Storage Drive Details',
                  hair_cutter: '✂️ More Clipper Details',
                  generic: '⚙️ Custom Specifications'
                }[specFieldsType] || '⚙️ More Product Details';

                return (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-950/20 space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowMoreDetails(!showMoreDetails)}
                      className="w-full flex items-center justify-between font-black text-xs uppercase tracking-widest text-slate-800 dark:text-slate-200 text-left outline-none cursor-pointer"
                    >
                      <span>{accordionLabel}</span>
                      <span className="text-slate-400 text-base font-bold">{showMoreDetails ? '−' : '+'}</span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {showMoreDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden space-y-4 pt-2"
                        >
                          {/* LAPTOP FIELDS */}
                          {specFieldsType === 'laptop' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Product Line</label>
                                  <input type="text" value={form.productLine || ''} onChange={e => setForm(p => ({ ...p, productLine: e.target.value }))} placeholder="e.g. ProBook, EliteBook" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Laptop Type</label>
                                  <select value={form.laptopType || ''} onChange={e => setForm(p => ({ ...p, laptopType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Type</option>
                                    <option value="Gaming">Gaming</option>
                                    <option value="Ultrabook">Ultrabook</option>
                                    <option value="Netbook">Netbook</option>
                                    <option value="Workstation">Workstation</option>
                                    <option value="Convertible (2-in-1)">Convertible (2-in-1)</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Operating System</label>
                                  <select value={form.os || ''} onChange={e => setForm(p => ({ ...p, os: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select OS</option>
                                    <option value="Windows 11">Windows 11</option>
                                    <option value="Windows 10">Windows 10</option>
                                    <option value="macOS">macOS</option>
                                    <option value="ChromeOS">ChromeOS</option>
                                    <option value="Linux">Linux</option>
                                    <option value="No OS">No OS</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Processor Tier</label>
                                  <select value={form.processorTier || ''} onChange={e => setForm(p => ({ ...p, processorTier: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Processor</option>
                                    <option value="Core i3">Core i3</option>
                                    <option value="Core i5">Core i5</option>
                                    <option value="Core i7">Core i7</option>
                                    <option value="Core i9">Core i9</option>
                                    <option value="Ryzen 3">Ryzen 3</option>
                                    <option value="Ryzen 5">Ryzen 5</option>
                                    <option value="Ryzen 7">Ryzen 7</option>
                                    <option value="Ryzen 9">Ryzen 9</option>
                                    <option value="Apple M1">Apple M1</option>
                                    <option value="Apple M2">Apple M2</option>
                                    <option value="Apple M3">Apple M3</option>
                                    <option value="Celeron">Celeron</option>
                                    <option value="Pentium">Pentium</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>RAM Capacity</label>
                                  <input type="text" value={form.ramCapacity || ''} onChange={e => setForm(p => ({ ...p, ramCapacity: e.target.value }))} placeholder="e.g. 8GB, 16GB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>RAM Type</label>
                                  <select value={form.ramType || ''} onChange={e => setForm(p => ({ ...p, ramType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select RAM Type</option>
                                    <option value="DDR3">DDR3</option>
                                    <option value="DDR4">DDR4</option>
                                    <option value="DDR5">DDR5</option>
                                    <option value="LPDDR4">LPDDR4</option>
                                    <option value="LPDDR5">LPDDR5</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Storage Capacity</label>
                                  <input type="text" value={form.storageCapacity || ''} onChange={e => setForm(p => ({ ...p, storageCapacity: e.target.value }))} placeholder="e.g. 256GB, 512GB, 1TB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Storage Type</label>
                                  <select value={form.storageType || ''} onChange={e => setForm(p => ({ ...p, storageType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Storage Type</option>
                                    <option value="SSD">SSD</option>
                                    <option value="HDD">HDD</option>
                                    <option value="NVMe SSD">NVMe SSD</option>
                                    <option value="eMMC">eMMC</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Processor Generation</label>
                                  <input type="text" value={form.processorGeneration || ''} onChange={e => setForm(p => ({ ...p, processorGeneration: e.target.value }))} placeholder="e.g. 10th Gen, 11th Gen" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Processor Model</label>
                                  <input type="text" value={form.processorModel || ''} onChange={e => setForm(p => ({ ...p, processorModel: e.target.value }))} placeholder="e.g. i5-1135G7, i7-12700H" className={inp}/>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* PHONE FIELDS */}
                          {specFieldsType === 'phone' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>RAM Memory</label>
                                  <input type="text" value={form.phoneRam || ''} onChange={e => setForm(p => ({ ...p, phoneRam: e.target.value }))} placeholder="e.g. 6GB, 8GB, 12GB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Internal Storage</label>
                                  <input type="text" value={form.phoneStorage || ''} onChange={e => setForm(p => ({ ...p, phoneStorage: e.target.value }))} placeholder="e.g. 128GB, 256GB" className={inp}/>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Screen Size</label>
                                  <input type="text" value={form.screenSize || ''} onChange={e => setForm(p => ({ ...p, screenSize: e.target.value }))} placeholder="e.g. 6.7 inches" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Battery Capacity</label>
                                  <input type="text" value={form.battery || ''} onChange={e => setForm(p => ({ ...p, battery: e.target.value }))} placeholder="e.g. 5000 mAh" className={inp}/>
                                </div>
                              </div>
                              <div>
                                <label className={lbl}>Camera Resolution</label>
                                <input type="text" value={form.camera || ''} onChange={e => setForm(p => ({ ...p, camera: e.target.value }))} placeholder="e.g. 50 MP + 12 MP" className={inp}/>
                              </div>
                            </div>
                          )}

                          {/* LAPTOP CHARGER FIELDS */}
                          {specFieldsType === 'laptop_charger' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Compatible Brand</label>
                                  <select value={form.compatBrand || ''} onChange={e => setForm(p => ({ ...p, compatBrand: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Brand</option>
                                    <option value="HP">HP</option>
                                    <option value="Dell">Dell</option>
                                    <option value="Lenovo">Lenovo</option>
                                    <option value="Apple">Apple</option>
                                    <option value="Asus">Asus</option>
                                    <option value="Acer">Acer</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Connector Tip Type</label>
                                  <select value={form.connectorTip || ''} onChange={e => setForm(p => ({ ...p, connectorTip: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Tip Type</option>
                                    <option value="USB Type-C">USB Type-C</option>
                                    <option value="HP Blue Tip (4.5mm)">HP Blue Tip (4.5mm)</option>
                                    <option value="Dell Octagonal/Round">Dell Octagonal/Round</option>
                                    <option value="Lenovo Square Slim Tip">Lenovo Square Slim Tip</option>
                                    <option value="Apple MagSafe 2">Apple MagSafe 2</option>
                                    <option value="Apple MagSafe 3">Apple MagSafe 3</option>
                                    <option value="Universal Round (5.5mm)">Universal Round (5.5mm)</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Power (Wattage)</label>
                                  <select value={form.wattage || ''} onChange={e => setForm(p => ({ ...p, wattage: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Wattage</option>
                                    <option value="45W">45W</option>
                                    <option value="65W">65W</option>
                                    <option value="90W">90W</option>
                                    <option value="130W">130W</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Input Voltage</label>
                                  <input type="text" value={form.voltage || ''} onChange={e => setForm(p => ({ ...p, voltage: e.target.value }))} placeholder="e.g. 100-240V" className={inp}/>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* PHONE CHARGER FIELDS */}
                          {specFieldsType === 'phone_charger' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Charger Port Type</label>
                                  <select value={form.chargerPort || ''} onChange={e => setForm(p => ({ ...p, chargerPort: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Port Type</option>
                                    <option value="USB Type-C">USB Type-C</option>
                                    <option value="Apple Lightning">Apple Lightning</option>
                                    <option value="Micro-USB">Micro-USB</option>
                                    <option value="USB-A Port">USB-A Port</option>
                                    <option value="Wireless (Qi)">Wireless (Qi)</option>
                                    <option value="Multi-port">Multi-port</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Power (Wattage)</label>
                                  <select value={form.chargerPower || ''} onChange={e => setForm(p => ({ ...p, chargerPower: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Wattage</option>
                                    <option value="5W">5W</option>
                                    <option value="10W">10W</option>
                                    <option value="18W">18W</option>
                                    <option value="20W">20W</option>
                                    <option value="25W">25W</option>
                                    <option value="30W">30W</option>
                                    <option value="45W">45W</option>
                                    <option value="65W">65W</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className={lbl}>Fast Charging Protocols</label>
                                <input type="text" value={form.fastCharging || ''} onChange={e => setForm(p => ({ ...p, fastCharging: e.target.value }))} placeholder="e.g. Power Delivery (PD), Quick Charge (QC)" className={inp}/>
                              </div>
                            </div>
                          )}

                          {/* CABLE FIELDS */}
                          {specFieldsType === 'cable' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Cable Type / Interface</label>
                                  <select value={form.cableType || ''} onChange={e => setForm(p => ({ ...p, cableType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Interface</option>
                                    <option value="HDMI">HDMI</option>
                                    <option value="DisplayPort">DisplayPort</option>
                                    <option value="VGA">VGA</option>
                                    <option value="DVI">DVI</option>
                                    <option value="Ethernet (RJ45)">Ethernet (RJ45)</option>
                                    <option value="USB-C to USB-C">USB-C to USB-C</option>
                                    <option value="USB-A to USB-C">USB-A to USB-C</option>
                                    <option value="Apple Lightning">Apple Lightning</option>
                                    <option value="Micro-USB">Micro-USB</option>
                                    <option value="Audio Aux (3.5mm)">Audio Aux (3.5mm)</option>
                                    <option value="RCA">RCA</option>
                                    <option value="Optical Audio">Optical Audio</option>
                                    <option value="Coaxial">Coaxial</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Length (Meters)</label>
                                  <select value={form.length || ''} onChange={e => setForm(p => ({ ...p, length: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Length</option>
                                    <option value="1 Meter">1 Meter</option>
                                    <option value="1.5 Meters">1.5 Meters</option>
                                    <option value="2 Meters">2 Meters</option>
                                    <option value="3 Meters">3 Meters</option>
                                    <option value="5 Meters">5 Meters</option>
                                    <option value="10 Meters">10 Meters</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className={lbl}>Cable Version / Speed</label>
                                <input type="text" value={form.cableVersion || ''} onChange={e => setForm(p => ({ ...p, cableVersion: e.target.value }))} placeholder="e.g. HDMI 2.1, Cat6, USB 3.2" className={inp}/>
                              </div>
                            </div>
                          )}

                          {/* USB STORAGE FIELDS */}
                          {specFieldsType === 'usb_storage' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>USB Capacity</label>
                                  <input type="text" value={form.usbCapacity || ''} onChange={e => setForm(p => ({ ...p, usbCapacity: e.target.value }))} placeholder="e.g. 32GB, 64GB, 128GB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>USB Version</label>
                                  <select value={form.usbVersion || ''} onChange={e => setForm(p => ({ ...p, usbVersion: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Version</option>
                                    <option value="USB 2.0">USB 2.0</option>
                                    <option value="USB 3.0">USB 3.0</option>
                                    <option value="USB 3.1">USB 3.1</option>
                                    <option value="USB 3.2">USB 3.2</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className={lbl}>Connector Type</label>
                                <select value={form.usbConnector || ''} onChange={e => setForm(p => ({ ...p, usbConnector: e.target.value }))} className={`${inp} appearance-none`}>
                                  <option value="">Select Connector</option>
                                  <option value="USB Type-A">USB Type-A</option>
                                  <option value="USB Type-C">USB Type-C</option>
                                  <option value="Dual (Type-A + Type-C)">Dual (Type-A + Type-C)</option>
                                  <option value="Micro-USB">Micro-USB</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          )}

                          {/* RAM MEMORY FIELDS */}
                          {specFieldsType === 'ram_memory' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>RAM Capacity</label>
                                  <input type="text" value={form.ramCapacity || ''} onChange={e => setForm(p => ({ ...p, ramCapacity: e.target.value }))} placeholder="e.g. 8GB, 16GB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>RAM Type</label>
                                  <select value={form.ramType || ''} onChange={e => setForm(p => ({ ...p, ramType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select RAM Type</option>
                                    <option value="DDR3">DDR3</option>
                                    <option value="DDR4">DDR4</option>
                                    <option value="DDR5">DDR5</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Memory Frequency (Speed)</label>
                                  <input type="text" value={form.ramSpeed || ''} onChange={e => setForm(p => ({ ...p, ramSpeed: e.target.value }))} placeholder="e.g. 3200MHz, 4800MHz" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>RAM Form Factor</label>
                                  <select value={form.ramFormFactor || ''} onChange={e => setForm(p => ({ ...p, ramFormFactor: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Form Factor</option>
                                    <option value="SO-DIMM (Laptop)">SO-DIMM (Laptop)</option>
                                    <option value="UDIMM (Desktop)">UDIMM (Desktop)</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STORAGE DRIVE FIELDS */}
                          {specFieldsType === 'storage_drive' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Drive Capacity</label>
                                  <input type="text" value={form.storageCapacity || ''} onChange={e => setForm(p => ({ ...p, storageCapacity: e.target.value }))} placeholder="e.g. 500GB, 1TB, 2TB" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Drive Type</label>
                                  <select value={form.driveType || ''} onChange={e => setForm(p => ({ ...p, driveType: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Type</option>
                                    <option value="SSD (SATA)">SSD (SATA)</option>
                                    <option value="SSD (NVMe M.2)">SSD (NVMe M.2)</option>
                                    <option value="HDD (Internal)">HDD (Internal)</option>
                                    <option value="External SSD">External SSD</option>
                                    <option value="External HDD">External HDD</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Drive Form Factor</label>
                                  <select value={form.driveFormFactor || ''} onChange={e => setForm(p => ({ ...p, driveFormFactor: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Form Factor</option>
                                    <option value="M.2 2280">M.2 2280</option>
                                    <option value="2.5 inch">2.5 inch</option>
                                    <option value="3.5 inch">3.5 inch</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Read / Write Speed</label>
                                  <input type="text" value={form.driveSpeed || ''} onChange={e => setForm(p => ({ ...p, driveSpeed: e.target.value }))} placeholder="e.g. 3500 MB/s, 7200 RPM" className={inp}/>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* HAIR CUTTER FIELDS */}
                          {specFieldsType === 'hair_cutter' && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Battery Run Time</label>
                                  <input type="text" value={form.runTime || ''} onChange={e => setForm(p => ({ ...p, runTime: e.target.value }))} placeholder="e.g. 90 minutes" className={inp}/>
                                </div>
                                <div>
                                  <label className={lbl}>Charging Time</label>
                                  <input type="text" value={form.chargeTime || ''} onChange={e => setForm(p => ({ ...p, chargeTime: e.target.value }))} placeholder="e.g. 2 hours" className={inp}/>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className={lbl}>Blade Material</label>
                                  <select value={form.bladeMaterial || ''} onChange={e => setForm(p => ({ ...p, bladeMaterial: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Blade Material</option>
                                    <option value="Stainless Steel">Stainless Steel</option>
                                    <option value="Ceramic">Ceramic</option>
                                    <option value="Titanium">Titanium</option>
                                    <option value="Carbon Steel">Carbon Steel</option>
                                    <option value="Other">Other</option>
                                  </select>
                                </div>
                                <div>
                                  <label className={lbl}>Cordless Operation</label>
                                  <select value={form.cordless || ''} onChange={e => setForm(p => ({ ...p, cordless: e.target.value }))} className={`${inp} appearance-none`}>
                                    <option value="">Select Option</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Extra Custom Specifications Section */}
                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/60 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-400">Custom / Extra Specifications</span>
                              <button
                                type="button"
                                onClick={() => setForm(p => ({ ...p, customSpecs: [...(p.customSpecs || []), { key: '', value: '' }] }))}
                                className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                              >
                                ➕ Add Custom Field
                              </button>
                            </div>
                            {form.customSpecs && form.customSpecs.length > 0 && (
                              <div className="space-y-3 pt-1">
                                {form.customSpecs.map((spec, index) => (
                                  <div key={index} className="flex gap-2.5 items-center">
                                    <input
                                      type="text"
                                      value={spec.key}
                                      onChange={e => {
                                        const updated = [...form.customSpecs];
                                        updated[index].key = e.target.value;
                                        setForm(p => ({ ...p, customSpecs: updated }));
                                      }}
                                      placeholder="Field Name (e.g. Screen Size)"
                                      className={`${inp} !py-2.5 text-xs flex-1`}
                                    />
                                    <input
                                      type="text"
                                      value={spec.value}
                                      onChange={e => {
                                        const updated = [...form.customSpecs];
                                        updated[index].value = e.target.value;
                                        setForm(p => ({ ...p, customSpecs: updated }));
                                      }}
                                      placeholder="Value (e.g. 6.7 inches)"
                                      className={`${inp} !py-2.5 text-xs flex-1`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = form.customSpecs.filter((_, i) => i !== index);
                                        setForm(p => ({ ...p, customSpecs: updated }));
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
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

          {/* Social Media Sharing Options */}
          {!editingProduct && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-sm text-left">
              <label className={lbl}>Social Media Integrations</label>
              
              <button 
                type="button" 
                onClick={() => setAutoPostFacebook(!autoPostFacebook)}
                className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[10px] text-left ${autoPostFacebook ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-400 hover:border-indigo-500/30'}`}
              >
                <div className={`w-5 h-5 rounded-xl flex items-center justify-center border transition-all shrink-0 ${autoPostFacebook ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                  {autoPostFacebook && <span className="text-[10px]">✓</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">Auto-post to Facebook Page</span>
                  <span className="block text-[8px] font-bold text-slate-400 normal-case mt-0.5">Automatically publish this new product on your Facebook Page feed.</span>
                </div>
              </button>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
            {isSubmitting?<Loader2 size={20} className="animate-spin"/>:editingProduct?'Update Product':'Confirm & Publish Listing'}
          </button>

          <AnimatePresence>
            {error&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-center text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20"><AlertCircle size={15} className="mr-3 shrink-0"/>{error}</motion.div>}
            {success&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20"><CheckCircle2 size={15} className="mr-3 shrink-0"/>{success}</motion.div>}
          </AnimatePresence>
        </form>
      </div>

      {/* SUCCESS SHARE MODAL FOR WHATSAPP/SOCIALS */}
      <AnimatePresence>
        {savedProductForShare && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={backToList}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 overflow-hidden text-center z-10"
            >
              {/* Top Accent icon */}
              <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg">
                <CheckCircle2 size={28} />
              </div>
              
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Product Published Successfully! 🎉
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-bold">
                  "{savedProductForShare.name}" is now live. Share it with your customers!
                </p>
              </div>

              {/* Share Options Grid */}
              <div className="space-y-3">
                {/* Share to WhatsApp Status */}
                <button
                  onClick={() => {
                    const shareUrl = getShareUrl(savedProductForShare.id);
                    const message = encodeURIComponent(`🔥 NOUVEAU PRODUIT DISPONIBLE ! 🔥\n\n✨ ${savedProductForShare.name}\n🏷️ Prix: ${savedProductForShare.price?.toLocaleString()} FCFA\n\nCliquez ici pour commander directement :\n${shareUrl}`);
                    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">Share to WhatsApp Status</span>
                    <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Post the new arrival link and price directly to your Status.</span>
                  </div>
                </button>

                {/* Share to WhatsApp Chat */}
                <button
                  onClick={() => {
                    const shareUrl = getShareUrl(savedProductForShare.id);
                    const message = encodeURIComponent(`Bonjour ! Regardez notre nouvel arrivage chez SWEETO HUB :\n\n🕶️ ${savedProductForShare.name}\n💵 Prix: ${savedProductForShare.price?.toLocaleString()} FCFA\n\nDécouvrez plus de détails ici :\n${shareUrl}`);
                    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-blue-50/20 dark:bg-blue-950/10 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <MessageCircle size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">Share to WhatsApp Chat</span>
                    <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Send a quick promotional card to your clients or groups.</span>
                  </div>
                </button>

                {/* Share to Facebook */}
                <button
                  onClick={() => {
                    const shareUrl = getShareUrl(savedProductForShare.id);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <FacebookIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">Share to Facebook</span>
                    <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Post the product link directly to your Facebook Feed, Groups, or Story.</span>
                  </div>
                </button>

                {/* Copy Promotional Link */}
                <button
                  onClick={() => {
                    const shareUrl = getShareUrl(savedProductForShare.id);
                    const promoText = `🕶️ ${savedProductForShare.name}\n💵 Prix: ${savedProductForShare.price?.toLocaleString()} FCFA\n🛒 Commandez ici: ${shareUrl}`;
                    navigator.clipboard.writeText(promoText);
                    alert('Copied promotional share text to clipboard! 📋✨');
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-850/50 text-left transition-all group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                    <Plus size={20} className="rotate-45" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">Copy Share Link & Info</span>
                    <span className="block text-[9px] font-bold text-slate-400 mt-0.5">Copy product details and storefront URL to paste anywhere.</span>
                  </div>
                </button>
              </div>

              {/* Close / Return to List */}
              <button
                onClick={backToList}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer"
              >
                Close & Return to List
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
