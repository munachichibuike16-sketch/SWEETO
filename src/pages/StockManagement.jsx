import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, AlertTriangle, CheckCircle, XCircle, DollarSign, Package, TrendingUp, RefreshCw, Eye } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

export default function StockManagement() {
  const { products = [], refreshData, settings, showToast } = useStore();
  const [localProducts, setLocalProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, out, normal
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ stock: 0, price: 0, bought_price: 0 });
  const [updatingId, setUpdatingId] = useState(null);

  const currency = settings?.currency || 'FCFA';

  // Sync store products with local state
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // 1. Calculate Stats
  const activeProducts = localProducts.filter(p => p.status !== 'draft');
  const totalStock = activeProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
  const lowStockProducts = activeProducts.filter(p => (p.stock || 0) <= 5 && (p.stock || 0) > 0);
  const outOfStockProducts = activeProducts.filter(p => (p.stock || 0) === 0);
  const totalValuation = activeProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.bought_price || 0)), 0);

  // 2. Filter Products
  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase()) ||
                          String(p.id).includes(search);
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = (p.stock || 0) <= 5 && (p.stock || 0) > 0;
    } else if (stockFilter === 'out') {
      matchesStock = (p.stock || 0) === 0;
    } else if (stockFilter === 'normal') {
      matchesStock = (p.stock || 0) > 5;
    }

    return matchesSearch && matchesStock;
  });

  // 3. Update stock levels on the server
  const handleQuickUpdate = async (productId, fields) => {
    setUpdatingId(productId);
    try {
      // Direct Supabase Update
      const { error } = await supabase
        .from('products')
        .update(fields)
        .eq('id', productId);
        
      if (!error) {
        showToast('Inventory updated successfully', 'success');
        refreshData();
      } else {
        throw error;
      }
    } catch (err) {
      console.error('Failed to update inventory:', err);
      showToast('Failed to update inventory', 'error');
      // Rollback on fail
      refreshData();
    } finally {
      setUpdatingId(null);
      setEditingId(null);
    }
  };

  const adjustStock = (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    // Optimistic UI Update - Instant feedback in less than 1ms!
    setLocalProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p));
    handleQuickUpdate(product.id, { stock: newStock });
  };

  const startInlineEdit = (product) => {
    setEditingId(product.id);
    setEditValues({
      stock: product.stock || 0,
      price: product.price || 0,
      bought_price: product.bought_price || 0
    });
  };

  const saveInlineEdit = (productId) => {
    const fields = {
      stock: Number(editValues.stock),
      price: Number(editValues.price),
      bought_price: Number(editValues.bought_price)
    };
    // Optimistic UI Update - Instant feedback in less than 1ms!
    setLocalProducts(prev => prev.map(p => p.id === productId ? { ...p, ...fields } : p));
    handleQuickUpdate(productId, fields);
  };

  const generateSKU = (prod) => {
    if (!prod) return '';
    const prefix = prod.brand ? prod.brand.substring(0, 3) : (prod.category ? prod.category.substring(0, 3) : 'PRD');
    return `SWT-${prefix.toUpperCase()}-${String(prod.id).padStart(4, '0')}`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Units</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totalStock.toLocaleString()}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Active items in stock</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">Low Stock</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{lowStockProducts.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Under 5 units remaining</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-500 to-red-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Out of Stock</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{outOfStockProducts.length}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Requires immediate reorder</p>
        </div>

        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">Valuation</span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {totalValuation.toLocaleString()} <span className="text-xs font-bold">{currency}</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Asset capital tied in stock</p>
        </div>
      </div>

      {/* Control Actions & Filtering bar */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by product name, category, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStockFilter('all')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              stockFilter === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setStockFilter('low')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              stockFilter === 'low'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
            }`}
          >
            Low Stock ({lowStockProducts.length})
          </button>
          <button
            onClick={() => setStockFilter('out')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              stockFilter === 'out'
                ? 'bg-rose-500 text-white'
                : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
            }`}
          >
            Out of Stock ({outOfStockProducts.length})
          </button>
          <button
            onClick={() => setStockFilter('normal')}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
              stockFilter === 'normal'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
            }`}
          >
            In Stock
          </button>
          
          <button
            onClick={() => { refreshData(); showToast('Inventory reloaded', 'success'); }}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl active:scale-95 transition-transform"
            title="Refresh Stock List"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-6 px-8">Product Name</th>
                <th className="py-6 px-4">Stock Status</th>
                <th className="py-6 px-4 text-center">In Stock Quantity</th>
                <th className="py-6 px-4 text-right">Cost Price ({currency})</th>
                <th className="py-6 px-4 text-right">Retail Price ({currency})</th>
                <th className="py-6 px-4 text-center">Margin / Profit Potential</th>
                <th className="py-6 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-16 text-center">
                      <Package size={40} className="mx-auto text-slate-300 dark:text-slate-700 mb-4 opacity-50" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Products Found matching this criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isEditing = editingId === p.id;
                    const isLow = (p.stock || 0) <= 5 && (p.stock || 0) > 0;
                    const isOut = (p.stock || 0) === 0;

                    // Margin math
                    const costPrice = p.bought_price || 0;
                    const retailPrice = p.price || 0;
                    const margin = retailPrice > 0 ? ((retailPrice - costPrice) / retailPrice) * 100 : 0;
                    const profitPotential = (p.stock || 0) * (retailPrice - costPrice);

                    return (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        {/* Info details */}
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden border border-slate-100 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                              <img
                                src={p.image_url || p.image || '/hero-banner.png'}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/hero-banner.png'; }}
                              />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{p.category}</span>
                                <span className="text-[8px] font-bold text-slate-300 dark:text-slate-700">|</span>
                                <span className="text-[9px] font-black uppercase text-blue-500 font-mono">SKU: {generateSKU(p)}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Stock status badge */}
                        <td className="py-5 px-4">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-500/10 text-rose-500">
                              <XCircle size={12} />
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-500">
                              <AlertTriangle size={12} />
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500">
                              <CheckCircle size={12} />
                              In Stock
                            </span>
                          )}
                        </td>

                        {/* Quantity Increment/Decrement Adjustments */}
                        <td className="py-5 px-4 text-center">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.stock}
                              onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })}
                              className="w-20 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-center font-bold text-xs outline-none dark:text-white"
                            />
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => adjustStock(p, -1)}
                                disabled={updatingId === p.id}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 cursor-pointer"
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span className="w-12 text-sm font-black text-slate-800 dark:text-white">{p.stock || 0}</span>
                              <button
                                onClick={() => adjustStock(p, 1)}
                                disabled={updatingId === p.id}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50 cursor-pointer"
                              >
                                <Plus size={13} strokeWidth={2.5} />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Cost Price */}
                        <td className="py-5 px-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.bought_price}
                              onChange={(e) => setEditValues({ ...editValues, bought_price: e.target.value })}
                              className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-bold text-xs outline-none dark:text-white"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {(p.bought_price || 0).toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Retail Price */}
                        <td className="py-5 px-4 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                              className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-right font-bold text-xs outline-none dark:text-white"
                            />
                          ) : (
                            <span className="text-xs font-black text-slate-800 dark:text-white">
                              {(p.price || 0).toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Margins details */}
                        <td className="py-5 px-4 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                              margin >= 30 
                                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500' 
                                : margin >= 15 
                                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' 
                                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'
                            }`}>
                              {margin.toFixed(0)}% Margin
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                              Profit: {profitPotential.toLocaleString()} {currency}
                            </span>
                          </div>
                        </td>

                        {/* Quick Action buttons */}
                        <td className="py-5 px-8 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg font-black text-[9px] uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveInlineEdit(p.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md shadow-blue-500/20"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => startInlineEdit(p)}
                                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-500 hover:border-blue-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
                              >
                                Quick Edit
                              </button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
