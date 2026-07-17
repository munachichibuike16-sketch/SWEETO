import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, CheckCircle2, AlertCircle, X,
  Loader2, Tag, FileText, FolderOpen, Image as ImageIcon,
  Search, ChevronRight, ChevronDown, Grid, Flame, Sparkles, Bot, Send
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';
import { getCategoryLevel } from '../utils/categoryHelpers';
import { formatDbError } from '../utils/errorHelper';

const EMPTY_FORM = { name: '', description: '', parent_id: '', image_url: '', slug: '', level: 1, parent_level1_id: '', show_daily_deals: 1 };

const inputClass =
  'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';

const labelClass =
  'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-2 ml-1';

const CategoryManagement = () => {
  const { categories, refreshData, settings } = useStore();

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
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);
  const [expandedIds, setExpandedIds] = useState({});

  // AI Assistant States
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [chatInput, setChatInput]             = useState('');
  const [isGenerating, setIsGenerating]       = useState(false);
  const [messages, setMessages]               = useState([
    {
      sender: 'ai',
      text: "Hello! I am your Category AI Assistant. Tell me what products you sell, or ask me for suggestions on sub-categories. I can even generate recommendations that you can add with one click!"
    }
  ]);
  const chatEndRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isGenerating, showAiAssistant]);

  const parseSuggestions = (text) => {
    try {
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
      const matches = [...text.matchAll(jsonRegex)];
      let jsonStr = '';
      if (matches.length > 0) {
        jsonStr = matches[0][1];
      } else {
        const bracketRegex = /(\[[\s\S]*\])/;
        const bracketMatches = text.match(bracketRegex);
        if (bracketMatches) {
          jsonStr = bracketMatches[1];
        }
      }
      
      if (jsonStr) {
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            name: item.name || '',
            description: item.description || '',
            level: Number(item.level) || 1,
            parent_id: item.parent_id ? Number(item.parent_id) : null
          })).filter(item => item.name);
        }
      }
    } catch (e) {
      console.warn("Failed to parse AI suggestions:", e);
    }
    return null;
  };

  const handleSendAiMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isGenerating) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsGenerating(true);

    try {
      const apiKey = settings?.gemini_api_key || '';
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      const prompt = `You are an e-commerce category taxonomy expert assistant.
The store's current categories are:
${JSON.stringify(categories.map(c => ({ id: c.id, name: c.name, parent_id: c.parent_id, level: c.level })))}

The user asks: "${userMsg}"

Please provide a helpful, friendly response suggesting how to structure their categories, where to put their items, or what subcategories to add.
If you recommend adding any new categories or subcategories, please include a JSON block at the end of your response inside \`\`\`json ... \`\`\` with the suggested categories to add.
Each suggested category in the JSON array must follow this structure:
{
  "name": "Category Name",
  "description": "Short description of the category",
  "level": 1 | 2 | 3,
  "parent_id": <id_of_parent_if_level_is_2_or_3_else_null>
}
Use the exact integer ID from the existing categories list for the "parent_id" if it is a subcategory.
Ensure the JSON is valid and stands alone in the block. Keep descriptions short.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        throw new Error('No content returned from AI');
      }

      const suggestions = parseSuggestions(text);
      const cleanText = text.replace(/```json[\s\S]*?```/g, '').trim();

      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: cleanText || "Here are some category recommendations:",
          suggestions
        }
      ]);

    } catch (err) {
      console.error('Gemini API Error in Category Assistant:', err);
      let errorMsg = 'Failed to generate response. Please try again.';
      if (err.message === 'API_KEY_MISSING') {
        errorMsg = 'Gemini API Key is not configured. Please add your free Gemini API Key in Store Settings to use this feature.';
      }
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: errorMsg,
          isError: true
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSuggestion = async (suggestion) => {
    setError(''); setSuccess('');
    try {
      const slugVal = suggestion.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      const { data: existingCats } = await supabase.from('categories').select('id');
      const maxId = existingCats && existingCats.length > 0 ? Math.max(...existingCats.map(c => c.id)) : 0;
      const nextId = maxId + 1;

      const supabasePayload = {
        id: nextId,
        name: suggestion.name,
        slug: slugVal,
        description: suggestion.description || null,
        icon: null,
        parent_id: suggestion.parent_id,
        position: 0,
        show_daily_deals: 1
      };

      let { error: sbErr } = await supabase
        .from('categories')
        .insert([supabasePayload]);

      if (sbErr && (sbErr.message?.includes('column "show_daily_deals"') || sbErr.code === 'P0002')) {
        const fallbackPayload = { ...supabasePayload };
        delete fallbackPayload.show_daily_deals;
        const { error: fallbackErr } = await supabase
          .from('categories')
          .insert([fallbackPayload]);
        sbErr = fallbackErr;
      }

      if (sbErr) throw sbErr;

      const isLocalhost = isLocalHost();
      if (isLocalhost) {
        try {
          const localPayload = {
            id: nextId,
            name: suggestion.name,
            slug: slugVal,
            description: suggestion.description || null,
            image_url: null,
            parent_id: suggestion.parent_id,
            show_daily_deals: 1
          };
          const res = await apiFetch('categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localPayload)
          });
          if (!res.ok) console.warn('SQLite Category insert responded with error status:', res.status);
        } catch (e) {
          console.warn('SQLite Category insert failed:', e);
        }
      }

      setSuccess(`Added category "${suggestion.name}"!`);
      refreshData();
      
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Success! Added category "${suggestion.name}" to your store.`
        }
      ]);

      setTimeout(() => { setSuccess(''); }, 2050);
    } catch (err) {
      console.error('Error adding suggested category:', err);
      setError('Failed to add category: ' + err.message);
      setTimeout(() => { setError(''); }, 3000);
    }
  };

  const handleFillForm = (suggestion) => {
    let parent1Id = '';
    let parentId = suggestion.parent_id || '';
    
    if (parentId && suggestion.level === 3) {
      const parent = categories.find(c => Number(c.id) === Number(parentId));
      if (parent) {
        parent1Id = parent.parent_id || '';
      }
    }

    setFormData({
      name: suggestion.name,
      description: suggestion.description || '',
      level: suggestion.level || 1,
      parent_id: parentId,
      parent_level1_id: parent1Id,
      image_url: '',
      slug: '',
      show_daily_deals: 1
    });
    setEditingId(null);
    setShowForm(true);
    setShowAiAssistant(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allDealsOff = categories.length > 0 && categories.every(c => Number(c.show_daily_deals) === 0);

  const handleGlobalDealsToggle = async () => {
    const nextValue = allDealsOff ? 1 : 0;
    setIsBatchUpdating(true);
    setError('');
    setSuccess('');
    try {
      // 1. Update in Supabase (all rows)
      const { data: allCats } = await supabase.from('categories').select('id');
      if (allCats && allCats.length > 0) {
        const ids = allCats.map(c => c.id);
        const { error: sbErr } = await supabase
          .from('categories')
          .update({ show_daily_deals: nextValue })
          .in('id', ids);
        
        // Gracefully ignore if Supabase doesn't have the column yet
        if (sbErr && !sbErr.message?.includes('show_daily_deals')) {
          throw sbErr;
        }
      }

      // 2. Update in SQLite
      const isLocalhost = isLocalHost();
      if (isLocalhost) {
        const res = await apiFetch('categories/toggle-deals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ show_daily_deals: nextValue })
        });
        if (!res.ok) {
          throw new Error('Local SQLite batch update failed');
        }
      }

      setSuccess(`All category daily deals turned ${nextValue === 1 ? 'ON' : 'OFF'}!`);
      refreshData();
    } catch (err) {
      console.error('Failed to toggle global category deals:', err);
      setError(err.message || 'Failed to update global settings.');
    } finally {
      setIsBatchUpdating(false);
      setTimeout(() => { setError(''); setSuccess(''); }, 2050);
    }
  };

  /* ─── helpers ─── */
  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const openAdd = () => { resetForm(); setShowForm(true); };

  const openEdit = (cat) => {
    let lvl = 1;
    let parent1Id = '';
    let parentId = cat.parent_id || '';

    if (parentId) {
      const parent = categories.find(c => Number(c.id) === Number(parentId));
      if (parent && parent.parent_id) {
        // Parent has a parent, so cat is Level 3!
        lvl = 3;
        parent1Id = parent.parent_id;
      } else {
        // Parent has no parent, so cat is Level 2!
        lvl = 2;
        parent1Id = parentId;
      }
    }

    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      level: lvl,
      parent_id: parentId,
      parent_level1_id: parent1Id,
      image_url: cat.image_url || '',
      slug: cat.slug || '',
      show_daily_deals: cat.show_daily_deals !== undefined ? Number(cat.show_daily_deals) : 1
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
    if (formData.level === 2 && !formData.parent_id) { setError('Please select a parent category for this subcategory.'); return; }
    if (formData.level === 3 && !formData.parent_id) { setError('Please select a subcategory for this mid-subcategory.'); return; }

    setIsSubmitting(true);
    try {
      const slugVal = formData.slug?.trim() || formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const parentVal = formData.level > 1 && formData.parent_id ? Number(formData.parent_id) : null;
      
      const supabasePayload = {
        name: formData.name.trim(),
        slug: slugVal,
        description: formData.description?.trim() || null,
        icon: formData.image_url || null,
        parent_id: parentVal,
        position: 0,
        show_daily_deals: formData.show_daily_deals !== undefined ? Number(formData.show_daily_deals) : 1
      };

      const localPayload = {
        name: formData.name.trim(),
        slug: slugVal,
        description: formData.description?.trim() || null,
        image_url: formData.image_url || null,
        parent_id: parentVal,
        show_daily_deals: formData.show_daily_deals !== undefined ? Number(formData.show_daily_deals) : 1
      };

      const isLocalhost = isLocalHost();

      if (editingId) {
        // Update in Supabase
        let { error: sbErr } = await supabase
          .from('categories')
          .update(supabasePayload)
          .eq('id', editingId);

        // Fallback if column show_daily_deals doesn't exist on Supabase
        if (sbErr && (sbErr.message?.includes('column "show_daily_deals" of relation "categories" does not exist') || sbErr.code === 'P0002' || sbErr.message?.includes('show_daily_deals'))) {
          const fallbackPayload = { ...supabasePayload };
          delete fallbackPayload.show_daily_deals;
          const { error: fallbackErr } = await supabase
            .from('categories')
            .update(fallbackPayload)
            .eq('id', editingId);
          sbErr = fallbackErr;
        }

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
        let { error: sbErr } = await supabase
          .from('categories')
          .insert([{ ...supabasePayload, id: nextId }]);

        // Fallback if column show_daily_deals doesn't exist on Supabase
        if (sbErr && (sbErr.message?.includes('column "show_daily_deals" of relation "categories" does not exist') || sbErr.code === 'P0002' || sbErr.message?.includes('show_daily_deals'))) {
          const fallbackPayload = { ...supabasePayload };
          delete fallbackPayload.show_daily_deals;
          const { error: fallbackErr } = await supabase
            .from('categories')
            .insert([{ ...fallbackPayload, id: nextId }]);
          sbErr = fallbackErr;
        }

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
      setError(formatDbError(err, 'Failed to save. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── delete ─── */
  const handleDelete = async (id) => {
    setDeletingId(id);
    const isLocalhost = isLocalHost();
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

  /* ─── recursive category tree renderer ─── */
  const renderCategoryRow = (cat, level) => {
    const children = (categories || []).filter(c => Number(c.parent_id) === Number(cat.id));
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedIds[cat.id];

    // Indentation and styling based on level
    const indentClass = level === 1 ? '' : level === 2 ? 'ml-6 md:ml-10' : 'ml-12 md:ml-20';
    const borderColors = level === 1 
      ? 'border-l-4 border-l-emerald-500' 
      : level === 2 
        ? 'border-l-4 border-l-blue-500' 
        : 'border-l-4 border-l-purple-500';
    
    const levelBadge = level === 1 
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
      : level === 2 
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
    
    const levelLabel = level === 1 ? 'Parent' : level === 2 ? 'Subcategory' : 'Midsub';

    return (
      <div key={cat.id} className="space-y-2">
        <div className={`group relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-white/5 rounded-3xl p-4 md:p-6 transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 ${indentClass} ${borderColors}`}>
          
          {/* Left side: Icon, Name, Desc */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Thumbnail / Icon */}
            <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
              {cat.image_url ? (
                <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <FolderOpen className="text-slate-400" size={20} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm md:text-base truncate">
                   {cat.name}
                </h4>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${levelBadge}`}>
                  {levelLabel}
                </span>
              </div>
              {cat.description && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                  {cat.description}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Actions / Chevron */}
          <div className="flex items-center gap-3 self-end md:self-center shrink-0">
            {/* Show Daily Deals Badge */}
            {Number(cat.show_daily_deals) === 1 && (
              <div className="flex items-center gap-1 text-amber-550 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-3 py-1 rounded-xl border border-amber-100 dark:border-amber-900/10">
                <Flame size={12} className="fill-current animate-pulse text-amber-500" />
                <span className="text-[9px] font-black uppercase tracking-widest">Deals</span>
              </div>
            )}

            {/* Edit / Delete Buttons */}
            <div className="flex items-center gap-1.5">
              <button 
                type="button"
                onClick={() => openEdit(cat)} 
                className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
                title="Edit"
              >
                <Edit size={14} />
              </button>
              <button 
                type="button"
                onClick={() => setConfirmDelete({ id: cat.id, name: cat.name })} 
                disabled={deletingId === cat.id} 
                className="p-2 bg-red-55 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Chevron Expand/Collapse (Only for levels 1 & 2 if they have children) */}
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleExpand(cat.id)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isExpanded 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-400 dark:bg-slate-800 dark:hover:bg-slate-700'
                }`}
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Render children recursively if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {children.map(child => renderCategoryRow(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
          <div className="flex flex-wrap items-center gap-4">
            {/* Global Categories Deals Toggle Button */}
            <button
              type="button"
              onClick={handleGlobalDealsToggle}
              disabled={isBatchUpdating}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl disabled:opacity-50 ${
                allDealsOff
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 shadow-slate-200/20 dark:shadow-none border border-slate-200 dark:border-slate-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-orange-500/20'
              }`}
            >
              {isBatchUpdating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : allDealsOff ? (
                <AlertCircle size={16} className="text-slate-400 dark:text-slate-500" />
              ) : (
                <Flame size={16} className="text-amber-100 fill-amber-100 animate-pulse" />
              )}
              <span>
                {isBatchUpdating ? 'Updating...' : allDealsOff ? 'All Deals: OFF' : 'All Deals: ON'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAiAssistant(true)}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-purple-500/20"
            >
              <Sparkles size={16} /> Ask Category AI
            </button>

            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
            >
              <Plus size={16} /> New Category
            </button>
          </div>
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, level: 1, parent_id: '', parent_level1_id: '' }))}
                      className={`p-3 rounded-2xl border-2 font-black uppercase tracking-widest text-[8px] sm:text-[9px] transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formData.level === 1
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <FolderOpen size={16} />
                      <span>Parent (L1)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, level: 2, parent_id: '', parent_level1_id: '' }))}
                      className={`p-3 rounded-2xl border-2 font-black uppercase tracking-widest text-[8px] sm:text-[9px] transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formData.level === 2
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <ChevronRight size={16} />
                      <span>Subcat (L2)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, level: 3, parent_id: '', parent_level1_id: '' }))}
                      className={`p-3 rounded-2xl border-2 font-black uppercase tracking-widest text-[8px] sm:text-[9px] transition-all text-center flex flex-col items-center gap-1.5 cursor-pointer ${
                        formData.level === 3
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Grid size={16} />
                      <span>Midsub (L3)</span>
                    </button>
                  </div>
                </div>

                {/* Parent / Subcategory Selectors */}
                <AnimatePresence>
                  {formData.level === 2 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className={labelClass}><FolderOpen size={12} /> Select Parent Category (L1) *</label>
                      <select
                        value={formData.parent_id}
                        onChange={e => setFormData(p => ({ ...p, parent_id: e.target.value }))}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">-- Choose Parent --</option>
                        {categories.filter(c => !c.parent_id && c.id !== editingId).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.level === 3 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className={labelClass}><FolderOpen size={12} /> Select Parent Category (L1) *</label>
                        <select
                          value={formData.parent_level1_id}
                          onChange={e => setFormData(p => ({ ...p, parent_level1_id: e.target.value, parent_id: '' }))}
                          className={`${inputClass} appearance-none`}
                        >
                          <option value="">-- Choose Parent --</option>
                          {categories.filter(c => !c.parent_id && c.id !== editingId).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {formData.parent_level1_id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="overflow-hidden"
                        >
                          <label className={labelClass}><ChevronRight size={12} /> Select Subcategory (L2) *</label>
                          <select
                            value={formData.parent_id}
                            onChange={e => setFormData(p => ({ ...p, parent_id: e.target.value }))}
                            className={`${inputClass} appearance-none`}
                          >
                            <option value="">-- Choose Subcategory --</option>
                            {categories
                              .filter(c => Number(c.parent_id) === Number(formData.parent_level1_id) && c.id !== editingId)
                              .map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show Daily Deals Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Show Daily Deals Section</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500">Enable or disable the daily deals list on this category landing page</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, show_daily_deals: p.show_daily_deals === 1 ? 0 : 1 }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formData.show_daily_deals === 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formData.show_daily_deals === 1 ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

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
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" size={18}/>
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

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mb-6 -rotate-3"><FolderOpen className="text-emerald-400" size={40}/></div>
            <p className="text-slate-900 dark:text-white font-black text-xl mb-2">{search ? 'No categories found.' : 'Your Catalog is Empty'}</p>
            {!search && <><p className="text-slate-500 text-sm mb-10 max-w-xs">Organize your products by creating your first store category.</p>
            <button onClick={openAdd} className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20"><Plus size={18}/>Initialize Catalog</button></>}
          </div>
        ) : search ? (
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
        ) : (
          <div className="p-6 md:p-10 space-y-4">
            {categories
              .filter(c => !c.parent_id || !categories.some(parent => parent.id === Number(c.parent_id)))
              .map(rootCat => renderCategoryRow(rootCat, 1))}
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

      {/* ── AI ASSISTANT DRAWER ── */}
      <AnimatePresence>
        {showAiAssistant && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAiAssistant(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[140] lg:bg-black/20"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-slate-200/50 dark:border-slate-800/50 shadow-2xl z-[150] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <Bot size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">Category AI Assistant</h3>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5">Powered by Gemini 2.5 Flash</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiAssistant(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                {messages.map((msg, idx) => {
                  const isAi = msg.sender === 'ai';
                  return (
                    <div
                      key={idx}
                      className={`flex ${isAi ? 'justify-start' : 'justify-end'} w-full animate-fadeIn`}
                    >
                      <div className={`flex gap-3 max-w-[85%] ${isAi ? 'flex-row' : 'flex-row-reverse'}`}>
                        {isAi && (
                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-655 dark:text-slate-300 shrink-0">
                            <Bot size={15} />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div
                            className={`px-4.5 py-3 rounded-2xl text-xs font-medium leading-relaxed text-left ${
                              isAi
                                ? msg.isError
                                  ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/20'
                                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-250'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-indigo-650/15'
                            }`}
                            style={{ whiteSpace: 'pre-line' }}
                          >
                            {msg.text}
                          </div>

                          {/* Suggestions Cards */}
                          {isAi && msg.suggestions && msg.suggestions.length > 0 && (
                            <div className="mt-4 space-y-2.5 w-full">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 ml-1 text-left">AI Suggestions</p>
                              {msg.suggestions.map((suggestion, sIdx) => {
                                const parentName = categories.find(c => Number(c.id) === Number(suggestion.parent_id))?.name || 'Root';
                                return (
                                  <div key={sIdx} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-left">
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                          Level {suggestion.level}
                                        </span>
                                        <h5 className="font-bold text-slate-900 dark:text-white text-xs mt-1.5">{suggestion.name}</h5>
                                        {suggestion.parent_id && (
                                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                                            Parent: {parentName}
                                          </p>
                                        )}
                                        {suggestion.description && (
                                          <p className="text-[10px] text-slate-450 dark:text-slate-550 mt-1 line-clamp-2">
                                            {suggestion.description}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-2.5 mt-3.5 pt-2.5 border-t border-slate-100/50 dark:border-slate-800/30">
                                      <button
                                        type="button"
                                        onClick={() => handleFillForm(suggestion)}
                                        className="flex-1 py-2 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[9.5px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                                      >
                                        Fill Form
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddSuggestion(suggestion)}
                                        className="flex-1 py-2 text-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9.5px] font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                                      >
                                        Add Instantly
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {isGenerating && (
                  <div className="flex justify-start w-full animate-pulse">
                    <div className="flex gap-3 max-w-[85%] items-center">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <Bot size={15} className="animate-bounce" />
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-4.5 py-3 rounded-2xl text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
                        AI is thinking...
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={handleSendAiMessage}
                className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2.5 bg-slate-50/50 dark:bg-slate-950/20"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask AI category ideas..."
                  disabled={isGenerating}
                  className="flex-1 px-4.5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500 font-medium text-slate-900 dark:text-white disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isGenerating || !chatInput.trim()}
                  className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl flex items-center justify-center hover:opacity-95 transition-opacity disabled:opacity-50 active:scale-95 shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default CategoryManagement;
