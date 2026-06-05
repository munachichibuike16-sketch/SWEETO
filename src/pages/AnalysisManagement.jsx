import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Eye, ShoppingBag, Percent, 
  Smartphone, Monitor, Globe, Clock, ArrowRight,
  Shield, Compass, Layers, RefreshCw, Download, 
  Search, Calendar, ChevronDown, Check, X, Tag
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

const flagMap = {
  'PH': '🇵🇭',
  'CI': '🇨🇮',
  'Ivory Coast': '🇨🇮',
  'PK': '🇵🇰',
  'KE': '🇰🇪',
  'CR': '🇨🇷',
  'ZM': '🇿🇲',
  'GH': '🇬🇭',
  'US': '🇺🇸',
  'FR': '🇫🇷',
  'CA': '🇨🇦',
  'GB': '🇬🇧',
  'DE': '🇩🇪',
  'JP': '🇯🇵',
  'CN': '🇨🇳'
};

export default function AnalysisManagement() {
  const { settings } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [activeDatePreset, setActiveDatePreset] = useState('7days'); // 'today' | '7days' | '30days' | 'month'
  const [dateFrom, setDateFrom] = useState('2026-05-11');
  const [dateTo, setDateTo] = useState('2026-05-18');
  
  // Dynamic Clickable Filters (Region & Event clicking)
  const [clickedCountry, setClickedCountry] = useState(null);
  const [clickedEventType, setClickedEventType] = useState(null);
  
  // Activity Scope (Storefront Only vs All events). Default is Front-View only!
  const [scopeFilter, setScopeFilter] = useState('storefront'); // 'storefront' | 'all'

  const [activeMetricTab, setActiveMetricTab] = useState('traffic'); // 'traffic' | 'revenue'

  const currencySymbol = settings?.currency === 'USD' ? '$' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : (settings?.currency === 'INR' ? '₹' : (settings?.currency || 'FCFA'))));

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch visitor logs
      const { data: logs, error: logsErr } = await supabase
        .from('visitor_log')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (logsErr) throw logsErr;
      
      // 2. Fetch orders
      const { data: ordersList, error: ordersErr } = await supabase
        .from('orders')
        .select('*');
        
      if (ordersErr) throw ordersErr;
      
      // 3. Fetch products
      const { data: productsList, error: prodErr } = await supabase
        .from('products')
        .select('*');
        
      if (prodErr) throw prodErr;

      // --- AGGREGATION ENGINE ---
      const totalSales = ordersList.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const totalOrders = ordersList.length;
      
      // Unique visitors (by IP or country or unique count)
      const uniqueIPs = new Set(logs.map(l => l.ip || '127.0.0.1'));
      const uniqueVisitors = uniqueIPs.size || 1;
      const totalViews = logs.length || 1;
      
      const conversionRate = totalViews > 0 
        ? ((totalOrders / totalViews) * 100).toFixed(2)
        : '0.00';

      // Devices & Browsers breakdown
      const devices = { mobile: 0, desktop: 0 };
      const browsers = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };
      
      logs.forEach(l => {
        const ua = (l.user_agent || '').toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
          devices.mobile++;
        } else {
          devices.desktop++;
        }
        
        if (ua.includes('chrome')) browsers.Chrome++;
        else if (ua.includes('safari')) browsers.Safari++;
        else if (ua.includes('firefox')) browsers.Firefox++;
        else if (ua.includes('edge')) browsers.Edge++;
        else browsers.Other++;
      });
      
      if (devices.mobile === 0 && devices.desktop === 0) {
        devices.desktop = 1; // Fallback
      }

      // Trend: Group visitor logs by date (last 7 days)
      const trendMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trendMap[dateStr] = 0;
      }
      logs.forEach(l => {
        const dateStr = new Date(l.created_at).toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr]++;
        }
      });
      const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

      // Sales Trend: Group orders by date (last 7 days)
      const salesTrendMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        salesTrendMap[dateStr] = 0;
      }
      ordersList.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().split('T')[0];
        if (salesTrendMap[dateStr] !== undefined) {
          salesTrendMap[dateStr] += (o.total_amount || 0);
        }
      });
      const salesTrend = Object.entries(salesTrendMap).map(([date, total]) => ({ date, total }));

      // Countries breakdown
      const countryMap = {};
      logs.forEach(l => {
        const c = l.country || 'Unknown';
        if (!countryMap[c]) {
          countryMap[c] = { country: c, events: 0, unique_devices: new Set(), last_active: l.created_at, eventsList: [] };
        }
        countryMap[c].events++;
        countryMap[c].unique_devices.add(l.ip || '127.0.0.1');
        if (new Date(l.created_at) > new Date(countryMap[c].last_active)) {
          countryMap[c].last_active = l.created_at;
        }
        countryMap[c].eventsList.push(l.event_type);
      });
      
      const countriesBreakdown = Object.values(countryMap).map(c => {
        // Find most frequent event type
        const eventCounts = {};
        c.eventsList.forEach(e => { eventCounts[e] = (eventCounts[e] || 0) + 1; });
        const top_event = Object.entries(eventCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'visit storefront';
        
        return {
          country: c.country,
          events: c.events,
          unique_devices: c.unique_devices.size,
          last_active: c.last_active,
          top_event
        };
      });

      // Top viewed products: count views from logs for `/product/:id`
      const productViews = {};
      logs.forEach(l => {
        if (l.page_path && l.page_path.startsWith('/product/')) {
          const prodId = l.page_path.replace('/product/', '');
          productViews[prodId] = (productViews[prodId] || 0) + 1;
        }
      });
      
      const topViewedProducts = productsList.map(p => ({
        name: p.name,
        price: p.price,
        image: p.image_url || p.image || '',
        views: productViews[p.id] || 0
      })).sort((a,b) => b.views - a.views).slice(0, 5);

      setData({
        summary: { totalSales, totalOrders, conversionRate, uniqueVisitors, totalViews },
        pageViews: totalViews,
        devices,
        browsers,
        trend,
        salesTrend,
        recentLogs: logs.slice(0, 50),
        countriesBreakdown,
        topViewedProducts
      });
      setError('');
    } catch (err) {
      setError(err.message || 'An error occurred while fetching analysis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set date bounds automatically based on current date
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateFrom(sevenDaysAgo);
    setDateTo(formattedToday);
  }, []);

  const handleDatePresetClick = (preset) => {
    setActiveDatePreset(preset);
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    
    if (preset === 'today') {
      setDateFrom(formattedToday);
      setDateTo(formattedToday);
    } else if (preset === '7days') {
      const past = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateFrom(past);
      setDateTo(formattedToday);
    } else if (preset === '30days') {
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setDateFrom(past);
      setDateTo(formattedToday);
    } else if (preset === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      setDateFrom(startOfMonth);
      setDateTo(formattedToday);
    }
  };

  // Export CSV Utility
  const handleExportCSV = () => {
    if (!data || !data.countriesBreakdown) return;
    
    const headers = ['RANK', 'COUNTRY', 'EVENTS', 'UNIQUE DEVICES', 'LAST ACTIVE', 'TOP EVENT'];
    const rows = filteredCountries.map((c, idx) => [
      idx + 1,
      c.country,
      c.events,
      c.unique_devices,
      c.last_active ? new Date(c.last_active).toLocaleString() : 'N/A',
      c.top_event
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Countries_Breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] gap-4">
        <RefreshCw className="animate-spin text-blue-500 w-10 h-10" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Compiling Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 text-center max-w-lg mx-auto my-12">
        <Shield className="text-red-500 w-12 h-12 mx-auto mb-4" />
        <h3 className="text-sm font-black uppercase text-red-500 tracking-wider mb-2">Analysis Pipeline Interrupted</h3>
        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-6">{error || 'Could not fetch data.'}</p>
        <button onClick={fetchAnalytics} className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Retry Link</button>
      </div>
    );
  }

  const { summary, pageViews, devices, browsers, trend = [], salesTrend = [], recentLogs = [], countriesBreakdown = [], topViewedProducts = [] } = data;

  // Custom responsive SVG Chart values calculations
  const maxTrendVal = trend.length > 0 ? Math.max(...trend.map(t => t.count), 10) : 10;
  const trendPoints = trend.map((t, i) => {
    const x = (i / (trend.length - 1 || 1)) * 100;
    const y = 100 - (t.count / maxTrendVal) * 80;
    return `${x},${y}`;
  });

  const maxSalesVal = salesTrend.length > 0 ? Math.max(...salesTrend.map(t => t.total), 1000) : 1000;
  const salesPoints = salesTrend.map((t, i) => {
    const x = (i / (salesTrend.length - 1 || 1)) * 100;
    const y = 100 - (t.total / maxSalesVal) * 80;
    return `${x},${y}`;
  });

  const totalDevices = (devices.mobile || 0) + (devices.desktop || 0) || 1;
  const mobilePct = Math.round(((devices.mobile || 0) / totalDevices) * 100);
  const desktopPct = Math.round(((devices.desktop || 0) / totalDevices) * 100);

  // Filter countries list by search & dropdown
  const filteredCountries = countriesBreakdown.filter(c => {
    const countryName = (c.country || '').toLowerCase();
    const topEvent = (c.top_event || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = countryName.includes(query) || topEvent.includes(query);
    const matchesEventFilter = selectedEventFilter === 'all' || topEvent === selectedEventFilter.toLowerCase();
    
    return matchesSearch && matchesEventFilter;
  });

  // Filter activity feed dynamically based on interactive clicks!
  const filteredFeed = recentLogs.filter(log => {
    // 1. Filter by clicked Country
    if (clickedCountry && log.country !== clickedCountry) return false;
    
    // 2. Filter by clicked Event Type
    if (clickedEventType && log.event_type !== clickedEventType) return false;
    
    // 3. Storefront ONLY Activity filtration
    if (scopeFilter === 'storefront') {
      const storefrontEvents = ['visit storefront', 'product clicked', 'product searched', 'product viewed', 'sale recorded'];
      if (!storefrontEvents.includes(log.event_type)) return false;
    }
    
    return true;
  });

  const uniqueEventTypes = ['visit storefront', 'product clicked', 'product searched', 'product viewed', 'sale recorded'];

  return (
    <div className="space-y-8 animate-fadeIn text-slate-900 dark:text-slate-100">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center justify-between bg-slate-50 dark:bg-slate-950 p-6 rounded-[2rem] border border-slate-200/50 dark:border-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-inner">
            <Globe size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Countries & Customers
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Real-time storefront visit, search, click, and view breakdown</p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-500 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm active:scale-95 transition-all text-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={14} className="stroke-[2.5]" />
            Refresh
          </button>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
          >
            <Download size={14} className="stroke-[2.5]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* DYNAMIC FILTER ROW */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 p-6 rounded-[2rem] shadow-sm flex flex-col md:flex-row flex-wrap items-center justify-between gap-6">
        
        {/* Custom Datepicker and Apply Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
            <Calendar size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            />
            <span className="text-slate-400 font-bold text-xs">—</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
            />
          </div>
          <button 
            onClick={fetchAnalytics}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all active:scale-95"
          >
            Apply
          </button>
        </div>

        {/* Preset selectors */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/55 rounded-2xl">
          {[
            { label: 'Today', key: 'today' },
            { label: 'Last 7 days', key: '7days' },
            { label: 'Last 30 days', key: '30days' },
            { label: 'This month', key: 'month' }
          ].map(preset => (
            <button
              key={preset.key}
              onClick={() => handleDatePresetClick(preset.key)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeDatePreset === preset.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Event scope select & Search */}
        <div className="flex flex-wrap flex-1 max-w-xl items-center gap-3 justify-end w-full">
          <div className="relative">
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="appearance-none pl-5 pr-10 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Events</option>
              {uniqueEventTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:border-blue-500 text-xs font-bold text-slate-700 dark:text-white placeholder:text-slate-400"
            />
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* CLICKS / INTERACTIVE INSTRUCTION BANNER */}
      {(clickedCountry || clickedEventType) && (
        <div className="bg-blue-600 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3 text-xs font-bold">
            <Check size={18} className="stroke-[3]" />
            <div>
              <span className="uppercase font-black tracking-widest">Active Filters:</span>
              {clickedCountry && <span className="ml-2 bg-white/20 px-3 py-1.5 rounded-xl">Country: {flagMap[clickedCountry] || '🌐'} {clickedCountry}</span>}
              {clickedEventType && <span className="ml-2 bg-white/20 px-3 py-1.5 rounded-xl">Event: {clickedEventType}</span>}
            </div>
          </div>
          <button 
            onClick={() => { setClickedCountry(null); setClickedEventType(null); }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* COUNTRIES BREAKDOWN TABLE */}
      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 dark:border-slate-800/50 pb-5">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] flex items-center gap-2">
              🌏 Countries Breakdown (Click row to filter activity)
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Select a regional row to dynamically focus the live feed below</p>
          </div>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {filteredCountries.length} countries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="py-4 pl-4 w-12">#</th>
                <th className="py-4">Country</th>
                <th className="py-4">Events</th>
                <th className="py-4">Unique Devices</th>
                <th className="py-4">Last Active</th>
                <th className="py-4 pr-4">Top Event</th>
              </tr>
            </thead>
            <tbody>
              {filteredCountries.map((c, idx) => {
                const flag = flagMap[c.country] || flagMap[c.country.split(' ').join('')] || '🌐';
                const lastActiveFormatted = c.last_active 
                  ? new Date(c.last_active).toISOString().replace('T', ' ').substring(0, 19)
                  : 'N/A';
                  
                const getEventBadge = (evt) => {
                  const cleaned = evt.toLowerCase();
                  if (cleaned.includes('sale')) return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
                  if (cleaned.includes('dashboard')) return 'bg-violet-500/10 text-violet-500 border border-violet-500/20';
                  if (cleaned.includes('stock')) return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
                  return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
                };

                const isSelected = clickedCountry === c.country;

                return (
                  <tr 
                    key={idx} 
                    onClick={() => setClickedCountry(isSelected ? null : c.country)}
                    className={`border-b border-slate-50 dark:border-slate-850/30 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-950/40 cursor-pointer select-none transition-all ${
                      isSelected ? 'bg-blue-500/5 border-l-4 border-l-blue-500 pl-2' : ''
                    }`}
                  >
                    <td className="py-5 pl-4 text-slate-400">{idx + 1}</td>
                    <td className="py-5 flex items-center gap-2.5 font-black">
                      <span className="text-lg leading-none">{flag}</span>
                      <span className="tracking-wide text-slate-900 dark:text-slate-100">{c.country}</span>
                    </td>
                    <td className="py-5 text-slate-700 dark:text-slate-300 font-black">{c.events.toLocaleString()}</td>
                    <td className="py-5 text-slate-500 dark:text-slate-400">{c.unique_devices}</td>
                    <td className="py-5 font-mono text-[11px] text-slate-400">{lastActiveFormatted}</td>
                    <td className="py-5 pr-4">
                      <span className={`px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider ${getEventBadge(c.top_event)}`}>
                        {c.top_event}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOST VIEWED PRODUCTS & DEVICE DISTRIBUTION & LIVE FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Most Viewed Products & Performance SVG Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* MOST VIEWED PRODUCTS RANKING */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
              <Tag size={16} className="text-rose-500" />
              Most Viewed Products
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-850/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="py-4 w-12">#</th>
                    <th className="py-4">Product details</th>
                    <th className="py-4">Retail Price</th>
                    <th className="py-4 text-right pr-4">Total Views</th>
                  </tr>
                </thead>
                <tbody>
                  {topViewedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No products viewed yet.</td>
                    </tr>
                  ) : topViewedProducts.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-50 dark:border-slate-850/30 text-xs font-bold">
                      <td className="py-4 font-black text-slate-400">{idx + 1}</td>
                      <td className="py-4 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200 dark:border-slate-800 bg-white" />
                        <span className="font-black text-slate-900 dark:text-slate-100 line-clamp-1">{p.name}</span>
                      </td>
                      <td className="py-4 text-slate-500 dark:text-slate-400">{currencySymbol} {p.price.toLocaleString()}</td>
                      <td className="py-4 text-right pr-4 font-mono font-black text-blue-500">{p.views.toLocaleString()} views</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SVG Traffic Performance Metric Curve */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider mb-1 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-500" />
                  Performance Metrics Trend
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">Storefront trajectory logs for the last 7 days</p>
              </div>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950/60 rounded-2xl border border-slate-200/30 dark:border-slate-800/30">
                {['traffic', 'revenue'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveMetricTab(tab)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeMetricTab === tab
                        ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-800/50'
                        : 'text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Renderer */}
            <div className="relative h-48 w-full">
              {activeMetricTab === 'traffic' ? (
                trend.length > 0 ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <polygon points={`0,100 ${trendPoints.join(' ')} 100,100`} fill="url(#blueGlow)" />
                      <polyline fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={trendPoints.join(' ')} />
                    </svg>
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-200/30 dark:border-slate-800/30 pt-3">
                      {trend.map((t, i) => (
                        <span key={i}>{t.date.split('-').slice(1).join('/')}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">No Traffic Data Logged Yet</div>
                )
              ) : (
                salesTrend.length > 0 ? (
                  <div className="w-full h-full flex flex-col justify-between">
                    <svg className="w-full h-36 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <polygon points={`0,100 ${salesPoints.join(' ')} 100,100`} fill="url(#greenGlow)" />
                      <polyline fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={salesPoints.join(' ')} />
                    </svg>
                    <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-200/30 dark:border-slate-800/30 pt-3">
                      {salesTrend.map((t, i) => (
                        <span key={i}>{t.date.split('-').slice(1).join('/')}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">No Sales Completed in the Last 7 Days</div>
                )
              )}
            </div>
          </div>

        </div>

        {/* Devices breakdown & live feeds */}
        <div className="space-y-8">
          
          {/* Device Signature Distribution */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
              <Layers size={16} className="text-indigo-500" />
              Device Distribution
            </h3>

            <div className="flex items-center justify-between gap-6 mb-6">
              <div className="text-center flex-1 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/20 dark:border-slate-800/20">
                <Smartphone className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Mobile</p>
                <p className="text-lg font-black">{mobilePct}%</p>
              </div>
              <div className="text-center flex-1 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/20 dark:border-slate-800/20">
                <Monitor className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Desktop</p>
                <p className="text-lg font-black">{desktopPct}%</p>
              </div>
            </div>

            <div className="h-3 w-full bg-slate-100 dark:bg-slate-950/60 rounded-full overflow-hidden flex border border-slate-200/20 dark:border-slate-800/20 mb-6">
              <div className="h-full bg-blue-500" style={{ width: `${mobilePct}%` }}></div>
              <div className="h-full bg-indigo-500" style={{ width: `${desktopPct}%` }}></div>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Browser Distribution</h4>
              {Object.entries(browsers).map(([b, count], idx) => {
                const totalLogsCount = recentLogs.length || 1;
                const pct = Math.round((count / totalLogsCount) * 100);
                if (count === 0 && b !== 'Chrome' && b !== 'Safari') return null;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold py-1.5 border-b border-slate-100 dark:border-slate-850 last:border-b-0">
                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
                      <Globe size={14} className="text-slate-400" />
                      {b}
                    </span>
                    <span className="font-black text-slate-900 dark:text-slate-100">{count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REAL-TIME TRAFFIC EVENTS FEED (FRONT VIEW DEFAULT FOCUS) */}
          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-[2.5rem] p-8 shadow-sm flex flex-col max-h-[500px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                  Live Activity Feed
                </h3>
              </div>
              
              {/* Event Scope Switch */}
              <div className="flex bg-slate-100 dark:bg-slate-950/60 p-0.5 border border-slate-200/20 dark:border-slate-800/20 rounded-xl">
                <button 
                  onClick={() => setScopeFilter('storefront')}
                  className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    scopeFilter === 'storefront' 
                      ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-800/50' 
                      : 'text-slate-400'
                  }`}
                >
                  Customer Only
                </button>
                <button 
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    scopeFilter === 'all' 
                      ? 'bg-white dark:bg-slate-900 text-blue-500 shadow-sm border border-slate-200/50 dark:border-slate-800/50' 
                      : 'text-slate-400'
                  }`}
                >
                  All Logs
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {filteredFeed.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                  No active storefront events for this region match the scope.
                </div>
              ) : filteredFeed.map((l, idx) => {
                const time = new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const flag = flagMap[l.country] || '🌐';
                
                // Color badges for feed items
                const getFeedItemBadge = (type) => {
                  const cleaned = type.toLowerCase();
                  if (cleaned.includes('click')) return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
                  if (cleaned.includes('viewed')) return 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20';
                  if (cleaned.includes('searched')) return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                  if (cleaned.includes('sale')) return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
                  return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
                };

                return (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/20 dark:border-slate-800/20 space-y-2.5 relative overflow-hidden group">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="flex items-center gap-1.5 font-black text-slate-800 dark:text-slate-200">
                        <span>{flag}</span>
                        <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-md font-mono">{l.ip === '::1' || l.ip === '127.0.0.1' ? 'LOCAL_NODE' : l.ip}</span>
                      </span>
                      <span className="text-slate-400">{time}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{l.page_path}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${getFeedItemBadge(l.event_type)}`}>
                        {l.event_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
