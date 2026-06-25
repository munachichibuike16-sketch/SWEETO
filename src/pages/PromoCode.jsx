import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Loader2, CheckCircle2, AlertCircle, Search, Ticket, ArrowLeft, RefreshCw, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';
import { formatDbError } from '../utils/errorHelper';

const EMPTY = { code: '', discount_percent: 5, code_type: 'first_time' };
const inp = 'w-full px-5 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none text-slate-900 dark:text-white font-medium';
const lbl = 'flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1';

export default function PromoCode() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [form, setForm] = useState(EMPTY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCode, setDeletingCode] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    setError('');
    try {
      const isLocalhost = isLocalHost();
      if (isLocalhost) {
        try {
          const res = await apiFetch('promos');
          if (res.ok) {
            const data = await res.json();
            setPromos(data);
            return;
          }
        } catch (e) {
          console.warn('Local SQLite fetch failed, falling back to Supabase:', e);
        }
      }

      // Fallback/Direct call to Supabase
      const { data, error: sbErr } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (sbErr) throw sbErr;
      setPromos(data || []);
    } catch (err) {
      console.error('Error fetching promo codes:', err);
      setError('Failed to fetch promo codes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openAdd = () => {
    setForm(EMPTY);
    setError('');
    setSuccess('');
    setView('form');
  };

  const backToList = () => {
    setView('list');
    setForm(EMPTY);
    setError('');
    setSuccess('');
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randPart1 = '';
    let randPart2 = '';
    for (let i = 0; i < 4; i++) {
      randPart1 += chars.charAt(Math.floor(Math.random() * chars.length));
      randPart2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generatedCode = `SWT-${randPart1}-${randPart2}`;
    setForm(p => ({ ...p, code: generatedCode }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const codeVal = form.code.toUpperCase().trim();
    const pct = parseInt(form.discount_percent, 10);

    if (!codeVal) {
      setError('Promo code is required.');
      return;
    }
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setError('Discount percentage must be between 1 and 100.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Insert in Supabase
      const { error: sbErr } = await supabase
        .from('promo_codes')
        .insert([{ code: codeVal, discount_percent: pct, code_type: form.code_type }]);
      if (sbErr) throw sbErr;

      // 2. Insert in SQLite
      const isLocalhost = isLocalHost();
      if (isLocalhost) {
        try {
          const res = await apiFetch('promos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: codeVal, discount_percent: pct, code_type: form.code_type })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            console.warn('SQLite Promo insert failed with status:', res.status, errData);
          }
        } catch (e) {
          console.warn('SQLite Promo insert failed:', e);
        }
      }

      setSuccess('Promo code added!');
      fetchPromos();
      setTimeout(() => backToList(), 1500);
    } catch (err) {
      console.error('Error saving promo code:', err);
      setError(formatDbError(err, 'Failed to save promo code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (code) => {
    setDeletingCode(code);
    try {
      // 1. Delete from Supabase
      const { error: sbErr } = await supabase
        .from('promo_codes')
        .delete()
        .eq('code', code);
      if (sbErr) throw sbErr;

      // 2. Delete from SQLite
      const isLocalhost = isLocalHost();
      if (isLocalhost) {
        try {
          const res = await apiFetch(`promos/${encodeURIComponent(code)}`, { method: 'DELETE' });
          if (!res.ok) console.warn('SQLite Promo delete responded with error status:', res.status);
        } catch (e) {
          console.warn('SQLite Promo delete failed:', e);
        }
      }

      setSuccess(`Promo code ${code} deleted!`);
      fetchPromos();
    } catch (err) {
      console.error('Error deleting promo code:', err);
      setError('Failed to delete promo code.');
    } finally {
      setDeletingCode(null);
      setConfirmDel(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filtered = promos.filter(p => p.code?.toLowerCase().includes(search.toLowerCase()));

  const totalCount = promos.length;
  const redeemedCount = promos.filter(p => p.is_used === 1 || p.is_used === true).length;
  const activeCount = totalCount - redeemedCount;

  /* ── LIST VIEW ── */
  if (view === 'list') return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><Ticket size={20}/></div>
            Promo Code Management
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">{totalCount} promo codes total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPromos} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm" title="Refresh list">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''}/>
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-blue-500/20">
            <Plus size={16}/> New Promo Code
          </button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        {/* Search & Header Stats */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-0 bg-blue-500/10 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={18}/>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search promo codes..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-slate-900"/>
          </div>
          <div className="flex flex-wrap gap-4 w-full md:w-auto justify-start md:justify-end">
            <div className="px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-0.5">Total</span>
               <span className="text-xl font-black text-slate-900 dark:text-white">{totalCount}</span>
            </div>
            <div className="px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
               <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-0.5">Active</span>
               <span className="text-xl font-black text-slate-900 dark:text-white">{activeCount}</span>
            </div>
            <div className="px-5 py-3 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30">
               <span className="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400 block mb-0.5">Redeemed</span>
               <span className="text-xl font-black text-slate-900 dark:text-white">{redeemedCount}</span>
            </div>
          </div>
        </div>

        {loading && promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 size={40} className="animate-spin text-blue-500 mb-4"/>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading promo codes...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-6">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 rotate-3"><Ticket className="text-blue-400" size={40}/></div>
            <p className="text-slate-900 dark:text-white font-black text-xl mb-2">{search ? 'No matches found.' : 'No Promo Codes Available'}</p>
            {!search && (
              <>
                <p className="text-slate-500 text-sm mb-10 max-w-xs">Create your first single-use coupon to share with customers.</p>
                <button onClick={openAdd} className="flex items-center gap-3 px-8 py-4 bg-blue-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"><Plus size={18}/>Generate Promo</button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-6 px-8">Promo Code</th>
                  <th className="py-6 px-6">Discount</th>
                  <th className="py-6 px-6">Status</th>
                  <th className="py-6 px-6">Usage Information</th>
                  <th className="py-6 px-6">Created At</th>
                  <th className="py-6 px-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filtered.map((p) => {
                  const isRedeemed = p.is_used === 1 || p.is_used === true;
                  return (
                    <tr key={p.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                      <td className="py-5 px-8 font-black text-slate-900 dark:text-white tracking-wide uppercase text-sm">
                        <div className="flex flex-col gap-1 items-start">
                          <span>{p.code}</span>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md leading-none ${
                            p.code_type === 'first_time'
                              ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20'
                              : p.code_type === 'vip'
                              ? 'text-amber-500 bg-amber-500/10 border border-amber-500/20'
                              : 'text-slate-400 bg-slate-400/10 border border-slate-400/20'
                          }`}>
                            {p.code_type === 'first_time' ? 'First-Time' : p.code_type === 'vip' ? 'VIP' : 'Custom'}
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 font-bold text-slate-900 dark:text-white">
                        <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black">
                          {p.discount_percent}% OFF
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        {isRedeemed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl text-xs font-black uppercase tracking-wider border border-red-100 dark:border-red-900/20">
                            Redeemed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/20">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {isRedeemed ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 dark:text-slate-200">User: {p.used_by || 'Anonymous'}</p>
                            <p className="text-[10px] text-slate-400">Redeemed: {formatDate(p.used_at)}</p>
                          </div>
                        ) : (
                          <span className="italic text-slate-400">Pending redemption</span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-5 px-8 text-right">
                        <button onClick={() => setConfirmDel(p)} disabled={deletingCode === p.code}
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-500/10 text-slate-400 hover:text-red-500 dark:bg-slate-800/50 dark:hover:bg-red-500/20 transition-all inline-flex items-center justify-center border border-slate-200/20 hover:border-red-500/30">
                          {deletingCode === p.code ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-5 mx-auto"><Trash2 className="text-red-500" size={24}/></div>
              <h3 className="text-lg font-black text-center text-slate-900 dark:text-white uppercase mb-2">Delete Promo Code?</h3>
              <p className="text-sm text-slate-500 text-center mb-8">Delete the code <span className="font-black text-slate-900 dark:text-white">"{confirmDel.code}"</span> ({confirmDel.discount_percent}% OFF) permanently?</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDel(null)} className="flex-1 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(confirmDel.code)} disabled={!!deletingCode} className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-60">
                  {deletingCode ? <Loader2 size={16} className="animate-spin"/> : 'Yes, Delete'}
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
        <button onClick={backToList} className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 shadow-sm"><ArrowLeft size={18}/></button>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Add New Promo Code</h2>
          <p className="text-slate-500 text-sm font-medium">Create a single-use promo code with customizable discounts</p>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 md:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"/>

        <form onSubmit={handleSubmit} className="relative z-10 max-w-xl space-y-6">
          <div>
            <label className={lbl}><Key size={12}/> Promo Code Name *</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. WELCOME50, SWEETOVIP" className={`${inp} uppercase`}/>
              <button type="button" onClick={generateRandomCode} className="px-6 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-black uppercase tracking-wider text-[10px] rounded-2xl transition-all whitespace-nowrap active:scale-95 self-stretch sm:self-auto flex items-center justify-center gap-2">
                Generate Random
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">Promo codes are automatically converted to uppercase.</p>
          </div>

          <div>
            <label className={lbl}>Promo Code Type / Label *</label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'first_time', label: 'First-Time (5%)' },
                { id: 'vip', label: 'VIP (10%)' },
                { id: 'custom', label: 'Custom %' }
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    const defaultPct = type.id === 'first_time' ? 5 : type.id === 'vip' ? 10 : 15;
                    setForm(p => ({ ...p, code_type: type.id, discount_percent: defaultPct }));
                  }}
                  className={`py-4 px-2 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                    form.code_type === type.id
                      ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>Discount Percentage *</label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={form.discount_percent} 
              disabled={form.code_type !== 'custom'} 
              onChange={e => setForm(p => ({ ...p, discount_percent: e.target.value }))} 
              placeholder="e.g. 10, 20, 50" 
              className={`${inp} ${form.code_type !== 'custom' ? 'opacity-60 cursor-not-allowed bg-slate-100/50 dark:bg-slate-950/20' : ''}`}
            />
            <p className="text-[10px] text-slate-400 mt-2 ml-1">
              {form.code_type === 'custom' ? 'Provide an integer percentage value between 1 and 100.' : 'Discount percentage is locked for this type.'}
            </p>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center disabled:opacity-50">
              {isSubmitting ? <Loader2 size={20} className="animate-spin"/> : 'Create Promo Code'}
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
