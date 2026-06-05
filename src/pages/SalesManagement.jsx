import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Users, TrendingUp, Search, Calendar, Award, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';

export default function SalesManagement() {
  const { orders = [], products = [], settings } = useStore();
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // all, today, month

  const currency = settings?.currency || 'FCFA';

  // 1. Filter Orders
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const filteredOrders = completedOrders.filter(o => {
    const matchesSearch = (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                          String(o.id).includes(search);
    
    if (timeframe === 'today') {
      const orderDate = new Date(o.created_at).toDateString();
      const today = new Date().toDateString();
      return matchesSearch && orderDate === today;
    }
    
    if (timeframe === 'month') {
      const orderMonth = new Date(o.created_at).getMonth();
      const currentMonth = new Date().getMonth();
      return matchesSearch && orderMonth === currentMonth;
    }

    return matchesSearch;
  });

  // 2. Financial Metrics calculations
  const grossSales = filteredOrders.reduce((sum, o) => sum + (o.total || o.total_amount || 0), 0);
  const totalOrdersCount = filteredOrders.length;
  const aov = totalOrdersCount > 0 ? grossSales / totalOrdersCount : 0;
  
  // Calculate total units sold
  let totalUnitsSold = 0;
  let estimatedNetProfit = 0;
  const productSalesMap = {};

  filteredOrders.forEach(order => {
    let items = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
    } catch(e) { items = []; }

    items.forEach(item => {
      const qty = Number(item.quantity || item.qty || 1);
      totalUnitsSold += qty;

      // Group product sales for leaderboard
      const prodName = item.name || 'Unknown Product';
      productSalesMap[prodName] = (productSalesMap[prodName] || 0) + qty;

      // Profit math: item price - actual product cost price
      const matchingProduct = products.find(p => p.id === item.id || p.name === item.name);
      const costPrice = matchingProduct ? (matchingProduct.bought_price || 0) : 0;
      const itemPrice = item.price || 0;
      estimatedNetProfit += (itemPrice - costPrice) * qty;
    });
  });

  // Compile Leaderboard of Top Selling Products
  const topProducts = Object.entries(productSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxLeaderboardQty = topProducts.length > 0 ? Math.max(...topProducts.map(p => p.qty)) : 1;

  return (
    <div className="space-y-8 pb-12">
      {/* Timeframe Filter header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Sales Analytics Dashboard</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Track store turnover, net revenues and AOV metrics</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setTimeframe('all')}
            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              timeframe === 'all'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              timeframe === 'month'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeframe('today')}
            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
              timeframe === 'today'
                ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Today
          </button>
        </div>
      </div>

      {/* Primary Financial Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Sales */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +12.4%
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Sales</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {grossSales.toLocaleString()} <span className="text-xs font-bold">{currency}</span>
          </h3>
        </div>

        {/* Estimated Net Profit */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +15.1%
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Revenue Estimate</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {estimatedNetProfit.toLocaleString()} <span className="text-xs font-bold">{currency}</span>
          </h3>
        </div>

        {/* Completed Orders Count */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowDownRight size={10} /> -2.1%
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Orders Handled</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {totalOrdersCount}
          </h3>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users size={20} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +8.3%
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Average Order Value (AOV)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            {aov.toFixed(0).toLocaleString()} <span className="text-xs font-bold">{currency}</span>
          </h3>
        </div>
      </div>

      {/* Two Columns Grid: Leaderboard & Dynamic Mini Report */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Top Products Leaderboard */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-blue-500" size={22} />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Top Selling Products</h3>
          </div>

          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <ShoppingBag size={32} className="mx-auto mb-4 opacity-30" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Sales recorded yet</p>
              </div>
            ) : (
              topProducts.map((p, idx) => {
                const percent = (p.qty / maxLeaderboardQty) * 100;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 text-[10px] font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{p.qty} Sold</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Sales Volume Performance Report */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <BarChart2 className="text-purple-500" size={22} />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dynamic Sales Volume</h3>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6">
            <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center mb-6">
              <TrendingUp className="text-purple-500" size={36} />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Total Volume: {totalUnitsSold} Units</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center mt-2">
              Turnover rate and total product units dispatched in completed orders. Higher volume indicates fast stock circulation.
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Item Selling Price</span>
            <span className="text-sm font-black text-slate-800 dark:text-white">
              {(totalUnitsSold > 0 ? grossSales / totalUnitsSold : 0).toFixed(0).toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction / Sales Logs */}
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="text-blue-500" size={20} />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sales Logs</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Completed transactions and client lists</p>
            </div>
          </div>

          {/* Search Logs */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search sales log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold dark:text-white"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Receipt ID</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4 text-center">Items Count</th>
                <th className="py-4 px-4 text-right">Revenue ({currency})</th>
                <th className="py-4 px-4 text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No Sales logged matching search query</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-4 text-xs font-black text-blue-500 font-mono">
                      SWT-ORD-{String(o.id).padStart(4, '0')}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500 font-bold">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">{o.customer_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{o.customer_contact || 'No contact'}</p>
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-black text-slate-700 dark:text-slate-300">
                      {o.total_items || 1}
                    </td>
                    <td className="py-4 px-4 text-right text-xs font-black text-slate-800 dark:text-white">
                      {(o.total || o.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider rounded-full">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
