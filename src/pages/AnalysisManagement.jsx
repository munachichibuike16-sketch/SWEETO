import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Users, Eye, ShoppingBag, Percent, 
  Smartphone, Monitor, Globe, Clock, ArrowRight,
  Shield, Compass, Layers, RefreshCw, Download, 
  Search, Calendar, ChevronDown, Check, X, Tag, Plus, PlusCircle, AlertTriangle
} from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';
import { playSound } from '../utils/sound';

const flagMap = {
  'PH': '🇵🇭',
  'FI': '🇫🇮',
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

const countryNameMap = {
  'PH': 'Philippines',
  'FI': 'Finland',
  'PK': 'Pakistan',
  'CR': 'Costa Rica',
  'CI': 'Ivory Coast',
  'US': 'United States',
  'FR': 'France',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'JP': 'Japan',
  'CN': 'China',
  'KE': 'Kenya',
  'ZM': 'Zambia',
  'GH': 'Ghana'
};

/* ─── SWIPEABLE OPERATIONAL ORDER FEED CARD ─── */
const OperationalOrderCard = ({ order, onStatusUpdate, currencySymbol }) => {
  const [dragDir, setDragDir] = useState(null); // 'left' | 'right' | null
  
  const handleDrag = (event, info) => {
    if (info.offset.x > 30) {
      setDragDir('right');
    } else if (info.offset.x < -30) {
      setDragDir('left');
    } else {
      setDragDir(null);
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 100) {
      onStatusUpdate(order.id, 'completed');
    } else if (info.offset.x < -100) {
      onStatusUpdate(order.id, 'cancelled');
    }
    setDragDir(null);
  };

  const statusColors = {
    completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    shipped: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/40 h-20 shadow-lg">
      {/* Action Indicators */}
      <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none z-0">
        <div className={`flex items-center gap-2 text-emerald-400 transition-opacity duration-200 ${dragDir === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          <Check size={18} className="stroke-[3]" />
          <span className="text-[9px] font-black uppercase tracking-widest">Complete</span>
        </div>
        <div className={`flex items-center gap-2 text-red-400 transition-opacity duration-200 ${dragDir === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest">Cancel</span>
          <X size={18} className="stroke-[3]" />
        </div>
      </div>

      {/* Interactive Drag Layer */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        dragElastic={0.3}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 z-10 bg-slate-900/95 border border-white/10 p-4 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-cyan-400 tracking-tight">SWT-{order.id}</span>
            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border leading-none ${statusColors[order.status] || 'text-slate-400'}`}>
              {order.status}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold truncate">
            {order.customer_name || 'Anonymous Customer'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-black text-white">
            {currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£' || currencySymbol === '₹' ? currencySymbol : ''}
            {Number(order.total_amount || order.total || 0).toLocaleString()}
            {currencySymbol !== '$' && currencySymbol !== '€' && currencySymbol !== '£' && currencySymbol !== '₹' ? ` ${currencySymbol}` : ''}
          </p>
          <span className="text-[8px] text-slate-500 font-medium block mt-0.5">
            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Just now'}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default function AnalysisManagement() {
  const { settings } = useStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  // Interactive filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [activeDatePreset, setActiveDatePreset] = useState('7days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Clickable states
  const [clickedCountry, setClickedCountry] = useState(null);
  const [clickedEventType, setClickedEventType] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('storefront');
  const [activeMetricTab, setActiveMetricTab] = useState('traffic');

  const currencySymbol = settings?.currency === 'USD' ? '$' : (settings?.currency === 'EUR' ? '€' : (settings?.currency === 'GBP' ? '£' : (settings?.currency === 'INR' ? '₹' : (settings?.currency || 'FCFA'))));

  const fetchAnalytics = async (silent = false) => {
    try {
      if (silent) {
        // Silent update
      } else if (!data) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      let logs = [];
      let ordersList = [];
      let productsList = [];
      let successSearchesList = [];
      let failSearchesList = [];

      // 1. Fetch from Supabase
      const [logsRes, ordersRes, productsRes, successRes, failRes] = await Promise.all([
        supabase.from('visitor_log').select('*').order('created_at', { ascending: false }),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*'),
        supabase.from('successful_searches').select('*').order('search_count', { ascending: false }),
        supabase.from('failed_searches').select('*').order('search_count', { ascending: false })
      ]);

      if (logsRes.data) logs = logsRes.data;
      if (ordersRes.data) ordersList = ordersRes.data;
      if (productsRes.data) productsList = productsRes.data;
      if (successRes.data) successSearchesList = successRes.data;
      if (failRes.data) failSearchesList = failRes.data;

      // Local fallback if development and empty
      if (isLocalHost() && logs.length === 0) {
        try {
          const localFetch = async (path) => {
            const res = await apiFetch(path);
            if (!res.ok) throw new Error();
            return res.json();
          };
          const [l, o, p, s, f] = await Promise.all([
            localFetch('/api/analytics/visitor-logs').catch(() => []),
            localFetch('/api/orders').catch(() => []),
            localFetch('/api/products').catch(() => []),
            localFetch('/api/analytics/successful-searches').catch(() => []),
            localFetch('/api/analytics/failed-searches').catch(() => [])
          ]);
          if (l.length > 0) logs = l;
          if (o.length > 0) ordersList = o;
          if (p.length > 0) productsList = p;
          if (s.length > 0) successSearchesList = s;
          if (f.length > 0) failSearchesList = f;
        } catch (e) {
          console.warn('SQLite fallback failed or unconfigured.');
        }
      }

      // Filter out mock/seeded logs to keep analysis 100% real
      logs = logs.filter(log => {
        const isMock = !log.user_agent?.startsWith('METADATA:') && 
                       (log.ip?.startsWith('192.168.') || ['PH', 'CI', 'PK', 'KE', 'CR', 'ZM', 'GH', 'US', 'Ivory Coast'].includes(log.country));
        return !isMock;
      });

      // --- AGGREGATION ENGINE ---
      const totalSales = ordersList.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);
      const totalOrders = ordersList.length;
      
      const uniqueIPs = new Set(logs.map(l => l.ip || '127.0.0.1'));
      const uniqueVisitors = uniqueIPs.size || 1;
      const totalViews = logs.length || 1;
      
      const conversionRate = totalViews > 0 
        ? ((totalOrders / totalViews) * 100).toFixed(2)
        : '0.00';

      // Devices & Browsers
      const devices = { mobile: 0, desktop: 0 };
      const browsers = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, PWA: 0, Other: 0 };
      
      logs.forEach(l => {
        let browser = 'Other';
        let isMobile = false;

        if (l.user_agent && l.user_agent.startsWith('METADATA:')) {
          try {
            const meta = JSON.parse(l.user_agent.substring(9));
            browser = meta.browser || 'Other';
            const dev = (meta.device || '').toLowerCase();
            isMobile = dev.includes('iphone') || dev.includes('ipad') || dev.includes('android') || dev.includes('mobile');
          } catch (e) {}
        } else {
          const ua = (l.user_agent || '').toLowerCase();
          isMobile = ua.includes('mobile') || ua.includes('android') || ua.includes('iphone');
          if (ua.includes('chrome')) browser = 'Chrome';
          else if (ua.includes('safari')) browser = 'Safari';
          else if (ua.includes('firefox')) browser = 'Firefox';
          else if (ua.includes('edge')) browser = 'Edge';
        }

        if (isMobile) {
          devices.mobile++;
        } else {
          devices.desktop++;
        }
        
        if (browsers[browser] !== undefined) {
          browsers[browser]++;
        } else {
          browsers.Other++;
        }
      });

      // 7-day trend
      const trendMap = {};
      const salesTrendMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        trendMap[dateStr] = 0;
        salesTrendMap[dateStr] = 0;
      }

      logs.forEach(l => {
        const dateStr = new Date(l.created_at).toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) trendMap[dateStr]++;
      });

      ordersList.forEach(o => {
        const dateStr = new Date(o.created_at).toISOString().split('T')[0];
        if (salesTrendMap[dateStr] !== undefined) {
          salesTrendMap[dateStr] += (o.total_amount || o.total || 0);
        }
      });

      const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));
      const salesTrend = Object.entries(salesTrendMap).map(([date, total]) => ({ date, total }));

      // Countries
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

      // Top viewed products URL mapping
      const productViews = {};
      logs.forEach(l => {
        if (l.page_path && l.page_path.includes('/product/')) {
          // Extract ID from product hash route or path
          const match = l.page_path.match(/\/product\/(\d+)/);
          if (match && match[1]) {
            productViews[match[1]] = (productViews[match[1]] || 0) + 1;
          }
        }
      });
      
      const topViewedProducts = productsList.map(p => ({
        name: p.name,
        price: p.price,
        image: p.image_url || p.image || '',
        views: productViews[p.id] || 0
      })).sort((a,b) => b.views - a.views).slice(0, 5);

      // Page URLs viewed breakdown
      const pathViewsMap = {};
      logs.forEach(l => {
        if (l.page_path) {
          pathViewsMap[l.page_path] = (pathViewsMap[l.page_path] || 0) + 1;
        }
      });
      const topPagesList = Object.entries(pathViewsMap)
        .map(([url, count]) => ({ url, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        summary: { totalSales, totalOrders, conversionRate, uniqueVisitors, totalViews },
        pageViews: totalViews,
        devices,
        browsers,
        trend,
        salesTrend,
        recentLogs: logs.slice(0, 50),
        countriesBreakdown,
        topViewedProducts,
        topPagesList,
        successfulSearches: successSearchesList,
        failedSearches: failSearchesList,
        activeOrders: ordersList.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 10)
      });
      setError('');
    } catch (err) {
      setError(err.message || 'An error occurred while fetching analysis.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleClearAllLogs = async () => {
    if (window.confirm("Are you sure you want to clear all visitor activity logs? This will delete all mock and real logs.")) {
      try {
        setRefreshing(true);
        const { error } = await supabase.from('visitor_log').delete().neq('id', 0); // deletes all rows in Supabase
        if (error) throw error;
        
        // Also delete from local SQLite
        await apiFetch('/api/analytics/clear-logs', { method: 'DELETE' }).catch(() => {});
        
        playSound('success');
        fetchAnalytics(true);
      } catch (err) {
        alert("Failed to clear logs: " + err.message);
      } finally {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setDateFrom(sevenDaysAgo);
    setDateTo(formattedToday);

    // Realtime listeners
    const channel = supabase.channel('analysis-realtime-listener')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_log' }, () => fetchAnalytics(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchAnalytics(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'successful_searches' }, () => fetchAnalytics(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'failed_searches' }, () => fetchAnalytics(true))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);
      if (error) throw error;
      
      // Fallback/sync to local SQLite
      apiFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      }).catch(() => {});

      playSound('success');
      fetchAnalytics(true);
    } catch (err) {
      console.error('Failed to update order status:', err.message);
    }
  };

  const handleSourceKeyword = (keyword) => {
    playSound('click');
    // Dispatch custom event to let Dashboard wrapper catch it, populate form and open modal
    window.dispatchEvent(new CustomEvent('open-quick-add-product', { detail: { name: keyword } }));
  };

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <RefreshCw className="animate-spin text-cyan-400 w-10 h-10" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Compiling Intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-[2rem] p-8 text-center max-w-lg mx-auto my-12 shadow-2xl">
        <Shield className="text-red-500 w-12 h-12 mx-auto mb-4 animate-bounce" />
        <h3 className="text-sm font-black uppercase text-red-400 tracking-wider mb-2">Analysis Pipeline Interrupted</h3>
        <p className="text-xs font-bold text-slate-400 leading-relaxed mb-6">{error || 'Could not fetch data.'}</p>
        <button onClick={() => fetchAnalytics()} className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 transition-all">Retry Link</button>
      </div>
    );
  }

  const { summary, pageViews, devices, browsers, trend = [], salesTrend = [], recentLogs = [], countriesBreakdown = [], topViewedProducts = [], topPagesList = [], successfulSearches = [], failedSearches = [], activeOrders = [] } = data;

  // SVG Chart points
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

  const filteredCountries = countriesBreakdown.filter(c => {
    const countryName = (countryNameMap[c.country] || c.country || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return countryName.includes(query);
  });

  const filteredFeed = recentLogs.filter(log => {
    if (clickedCountry && log.country !== clickedCountry) return false;
    if (clickedEventType && log.event_type !== clickedEventType) return false;
    if (scopeFilter === 'storefront') {
      const storefrontEvents = ['visit storefront', 'product clicked', 'product searched', 'product viewed', 'sale recorded'];
      if (!storefrontEvents.includes(log.event_type)) return false;
    }
    return true;
  });

  const conversionRateNum = Number(summary.conversionRate);
  const isConversionLow = conversionRateNum < 2.0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b19] transition-colors duration-500 space-y-8 animate-fadeIn text-slate-900 dark:text-slate-100 p-4 sm:p-8 rounded-[2.5rem]">
      
      {/* ─── PREMIUM HEADER BANNER ─── */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-6 rounded-[2rem] shadow-2xl flex flex-col gap-6 md:flex-row md:items-center justify-between before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-cyan-400/40 before:to-transparent relative overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-500 dark:text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Globe size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 uppercase italic leading-none">
              Intelligence <span className="text-cyan-500">Center</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Real-time analytical and diagnostic logging stream</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => fetchAnalytics()}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 hover:border-cyan-500 hover:text-cyan-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all text-slate-700 dark:text-slate-300"
          >
            <RefreshCw size={12} className={`stroke-[2.5] ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ─── DATE SELECTOR / CONTROL ROW ─── */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5 rounded-[2rem] shadow-2xl flex flex-col lg:flex-row justify-between items-center gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200 dark:border-white/10 rounded-2xl">
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
            onClick={() => fetchAnalytics()}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-cyan-500/10 transition-all active:scale-95"
          >
            Apply Range
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/10 rounded-2xl">
          {[
            { label: 'Today', key: 'today' },
            { label: '7 Days', key: '7days' },
            { label: '30 Days', key: '30days' },
            { label: 'Month', key: 'month' }
          ].map(preset => (
            <button
              key={preset.key}
              onClick={() => handleDatePresetClick(preset.key)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeDatePreset === preset.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── FINANCIAL CORE (2x2 GRID ON MOBILE, 4 COLUMN ON DESKTOP) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Gross Revenue */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
            <h4 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white truncate mt-1">
              {currencySymbol}{summary.totalSales.toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Net Profit */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Profit (est)</p>
            <h4 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white truncate mt-1">
              {currencySymbol}{Math.round(summary.totalSales * 0.45).toLocaleString()}
            </h4>
          </div>
        </div>

        {/* Conversion Rate with Low Warning Indicator */}
        <div className={`backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border p-5 sm:p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden transition-all duration-500 ${
          isConversionLow 
            ? 'border-red-500/50 dark:shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
            : 'border-white/40 dark:border-white/10'
        }`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
            isConversionLow 
              ? 'bg-red-500/20 text-red-500 border-red-500/30 animate-pulse' 
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          }`}>
            <Percent size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              Conversion Rate
              {isConversionLow && <AlertTriangle size={10} className="text-red-500 animate-bounce" />}
            </p>
            <h4 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white truncate mt-1">
              {summary.conversionRate}%
            </h4>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 p-5 sm:p-6 rounded-3xl shadow-xl flex items-center gap-4 relative overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Order Value</p>
            <h4 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white truncate mt-1">
              {currencySymbol}{summary.totalOrders > 0 ? Math.round(summary.totalSales / summary.totalOrders).toLocaleString() : '0'}
            </h4>
          </div>
        </div>

      </div>

      {/* ─── DUAL TREND CHART (TRAFFIC + SALES SPARKLINES) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Traffic Trend */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Eye size={14} className="text-cyan-400" />
              <span className="text-slate-700 dark:text-white">7-Day Traffic</span>
            </h3>
            <span className="text-[10px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-xl">
              {summary.totalViews.toLocaleString()} total
            </span>
          </div>

          <div className="h-28 w-full relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="trafficFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {trendPoints.length > 1 && (
                <>
                  <polygon
                    points={`0,100 ${trendPoints.join(' ')} 100,100`}
                    fill="url(#trafficFill)"
                  />
                  <polyline
                    points={trendPoints.join(' ')}
                    fill="none"
                    stroke="rgb(6,182,212)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {trend.map((t, i) => {
                    const x = (i / (trend.length - 1 || 1)) * 100;
                    const y = 100 - (t.count / maxTrendVal) * 80;
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="rgb(6,182,212)" stroke="#070b19" strokeWidth="1" />;
                  })}
                </>
              )}
            </svg>
          </div>

          <div className="flex justify-between mt-3 px-1">
            {trend.map((t, i) => (
              <span key={i} className="text-[8px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString('en', { weekday: 'narrow' })}</span>
            ))}
          </div>
        </div>

        {/* Sales Trend */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"></div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-400" />
              <span className="text-slate-700 dark:text-white">7-Day Revenue</span>
            </h3>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl">
              {currencySymbol}{summary.totalSales.toLocaleString()}
            </span>
          </div>

          <div className="h-28 w-full relative">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="salesFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(16,185,129)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(16,185,129)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {salesPoints.length > 1 && (
                <>
                  <polygon
                    points={`0,100 ${salesPoints.join(' ')} 100,100`}
                    fill="url(#salesFill)"
                  />
                  <polyline
                    points={salesPoints.join(' ')}
                    fill="none"
                    stroke="rgb(16,185,129)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {salesTrend.map((t, i) => {
                    const x = (i / (salesTrend.length - 1 || 1)) * 100;
                    const y = 100 - (t.total / maxSalesVal) * 80;
                    return <circle key={i} cx={x} cy={y} r="2.5" fill="rgb(16,185,129)" stroke="#070b19" strokeWidth="1" />;
                  })}
                </>
              )}
            </svg>
          </div>

          <div className="flex justify-between mt-3 px-1">
            {salesTrend.map((t, i) => (
              <span key={i} className="text-[8px] font-bold text-slate-400">{new Date(t.date).toLocaleDateString('en', { weekday: 'narrow' })}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TOP VIEWED PRODUCTS ─── */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Eye size={16} className="text-purple-400" />
            <span className="text-slate-700 dark:text-white">Top Viewed Products</span>
          </h3>
          <span className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-xl uppercase tracking-widest">
            {topViewedProducts.length} products
          </span>
        </div>

        {topViewedProducts.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            No product view data recorded yet. Views will appear as customers browse your store.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topViewedProducts.map((product, idx) => (
              <div key={idx} className="snap-start shrink-0 w-40 sm:w-48 backdrop-blur-sm bg-slate-100/50 dark:bg-slate-950/50 border border-slate-200/50 dark:border-white/5 rounded-2xl overflow-hidden shadow-lg group hover:border-purple-500/30 transition-all duration-300">
                <div className="h-32 sm:h-36 bg-slate-200 dark:bg-slate-800/60 relative overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <ShoppingBag size={28} className="text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm rounded-lg text-[9px] font-black text-cyan-400 border border-white/10">
                    #{idx + 1}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate uppercase tracking-wide">{product.name}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{currencySymbol}{Number(product.price || 0).toLocaleString()}</span>
                    <span className="text-[9px] font-black text-purple-400 flex items-center gap-1">
                      <Eye size={10} /> {product.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── REAL-TIME VISITOR ACTIVITY FEED ─── */}
      <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent"></div>
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
          <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-teal-400" />
            <span className="text-slate-700 dark:text-white">Live Activity Feed</span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {clickedCountry && (
              <button
                onClick={() => setClickedCountry(null)}
                className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg uppercase tracking-widest hover:bg-red-500/20 transition-all"
              >
                ✕ {clickedCountry}
              </button>
            )}
            <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-white/10 rounded-xl">
              <button 
                onClick={() => setScopeFilter('storefront')} 
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${scopeFilter === 'storefront' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
              >
                Store
              </button>
              <button 
                onClick={() => setScopeFilter('all')} 
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${scopeFilter === 'all' ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
              >
                All
              </button>
            </div>
            <button
              onClick={handleClearAllLogs}
              className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          {filteredFeed.length === 0 ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              No activity recorded for the current filters.
            </div>
          ) : filteredFeed.slice(0, 50).map((log, idx) => {
            const flag = flagMap[log.country] || '🌐';
            const countryName = countryNameMap[log.country] || log.country || 'Unknown';
            const eventEmoji = {
              'visit storefront': '🏠',
              'product clicked': '👆',
              'product searched': '🔍',
              'product viewed': '👁️',
              'product liked': '💖',
              'product unliked': '💔',
              'sale recorded': '💰',
              'admin login': '🔐',
              'page view': '📄'
            };
            const timeDiff = new Date() - new Date(log.created_at);
            const minutes = Math.floor(timeDiff / 60000);
            const hours = Math.floor(timeDiff / 3600000);
            const timeAgo = hours > 0 ? `${hours}h ago` : minutes > 0 ? `${minutes}m ago` : 'Just now';

            // Parse metadata
            let meta = null;
            let browser = 'Other';
            let device = 'Desktop';
            let referrer = 'Direct';
            let city = '';
            let product = '';

            if (log.user_agent && log.user_agent.startsWith('METADATA:')) {
              try {
                meta = JSON.parse(log.user_agent.substring(9));
                browser = meta.browser || 'Other';
                device = meta.device || 'Desktop';
                referrer = meta.referrer || 'Direct';
                city = meta.city || '';
                product = meta.product || '';
              } catch (e) {}
            } else {
              const ua = (log.user_agent || '').toLowerCase();
              if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
                device = 'Mobile';
              } else {
                device = 'Desktop';
              }
              if (ua.includes('chrome')) browser = 'Chrome';
              else if (ua.includes('safari')) browser = 'Safari';
              else if (ua.includes('firefox')) browser = 'Firefox';
              else if (ua.includes('edge')) browser = 'Edge';
            }

            // Referrer colors
            const referrerColors = {
              'WhatsApp': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              'Facebook': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              'Instagram': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
              'Google': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
              'Direct': 'text-slate-400 bg-slate-500/10 border-slate-500/20'
            };
            const refBadgeClass = referrerColors[referrer] || 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';

            // Browser badges
            const browserBadges = {
              'PWA': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20 font-black',
              'Chrome': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
              'Safari': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
              'Firefox': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
              'Edge': 'text-teal-400 bg-teal-500/10 border-teal-500/20'
            };
            const browserClass = browserBadges[browser] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: idx * 0.02 }}
                className="p-4 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100/50 dark:border-white/5 rounded-2xl hover:border-teal-500/20 transition-all cursor-default flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                onClick={() => setClickedCountry(log.country)}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-2xl leading-none shrink-0 p-2 bg-slate-200/50 dark:bg-slate-900/50 rounded-xl">{flag}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {countryName} {city ? `(${city})` : ''}
                      </span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full border text-slate-400 border-slate-300 dark:border-slate-850 dark:bg-slate-900/50 leading-none">
                        {device}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs leading-none shrink-0">{eventEmoji[log.event_type] || '📌'}</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {log.event_type === 'product viewed' && product ? (
                          <>Viewed product <span className="text-cyan-400 font-extrabold">{product}</span></>
                        ) : log.event_type === 'product clicked' && product ? (
                          <>Clicked product <span className="text-cyan-400 font-extrabold">{product}</span></>
                        ) : log.event_type === 'product liked' && product ? (
                          <>Liked product <span className="text-pink-400 font-extrabold">{product}</span></>
                        ) : log.event_type === 'product unliked' && product ? (
                          <>Unliked product <span className="text-slate-500">{product}</span></>
                        ) : (
                          <span className="uppercase tracking-wide text-[10px] font-black">{log.event_type || 'visit'}</span>
                        )}
                      </span>
                    </div>
                    {log.page_path && !product && (
                      <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate max-w-md">{log.page_path}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 md:self-center ml-12 md:ml-0">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border leading-none ${browserClass}`}>
                    {browser === 'PWA' ? '📱 PWA' : `🌐 ${browser}`}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border leading-none ${refBadgeClass}`}>
                    {referrer === 'Direct' ? '🔗 Direct' : `📣 ${referrer}`}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-200/30 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                    {timeAgo}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN ANALYTICS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Left column (8 cols): Countries, Unmet Demand, Charts */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Unmet Demand Grid (Failed Searches) */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-orange-400/40 before:to-transparent">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-orange-500">
                  <AlertTriangle size={16} /> Unmet Demand Grid
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Queries with 0 products matching search index</p>
              </div>
              <span className="text-[10px] font-black text-slate-500 bg-slate-950/40 border border-white/10 px-2.5 py-1 rounded-xl uppercase tracking-widest">
                {failedSearches.length} missing keywords
              </span>
            </div>

            {failedSearches.length === 0 ? (
              <div className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                No failed searches recorded! Your inventory matches all queries.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {failedSearches.slice(0, 6).map((item) => (
                  <div key={item.id} className="p-4 bg-slate-900/30 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate uppercase tracking-tight">{item.keyword}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {item.search_count} searches • {item.bounce_count || 0} bounces
                      </p>
                    </div>
                    <button
                      onClick={() => handleSourceKeyword(item.keyword)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-orange-500/10 active:scale-95 transition-all"
                    >
                      <PlusCircle size={12} />
                      Source
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Traffic Intent & Popular Successful Searches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Most Visited Web Pages */}
            <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Eye size={14} className="text-indigo-400" />
                Most Visited Pages
              </h3>
              
              <div className="space-y-4">
                {topPagesList.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold text-center py-6">No page log data.</p>
                ) : topPagesList.map((page, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400 truncate max-w-[180px]">{page.url}</span>
                      <span className="font-black text-cyan-400">{page.count} views</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                        style={{ width: `${(page.count / Math.max(...topPagesList.map(p => p.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Successful Searches */}
            <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Search size={14} className="text-cyan-400" />
                Top Successful Searches
              </h3>
              
              <div className="space-y-4">
                {successfulSearches.length === 0 ? (
                  <p className="text-xs text-slate-500 font-bold text-center py-6">No searches recorded.</p>
                ) : successfulSearches.slice(0, 5).map((search, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wide">{search.keyword}</span>
                      <span className="font-black text-cyan-400">{search.search_count} queries</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                        style={{ width: `${(search.search_count / Math.max(...successfulSearches.map(s => s.search_count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Regional Geographic Origins */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-cyan-400/40 before:to-transparent">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 border-b border-slate-100 dark:border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                  <Globe size={16} className="text-cyan-400" />
                  Regional Origins Leaderboard
                </h3>
              </div>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48 pl-10 pr-4 py-2.5 bg-slate-950/60 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-400 text-xs font-bold text-white placeholder:text-slate-500"
                />
                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              {filteredCountries.map((c, idx) => {
                const flag = flagMap[c.country] || flagMap[c.country.split(' ').join('')] || '🌐';
                const maxEvents = Math.max(...countriesBreakdown.map(co => co.events), 1);
                const pct = ((c.events / maxEvents) * 100).toFixed(0);

                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-slate-500 font-mono text-[10px] w-4">{idx + 1}</span>
                    <span className="text-lg leading-none">{flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-bold text-slate-200 truncate">{countryNameMap[c.country] || c.country}</span>
                        <span className="font-black text-cyan-400">{c.events.toLocaleString()} logs</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950/60 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column (4 cols): Operational Stream, Device logs */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8">
          
          {/* Operational Stream (Active Orders Swipe updating) */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-400/40 before:to-transparent">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-2">
              <ShoppingBag size={14} />
              Operational Stream
            </h3>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-6">Swipe right to Complete, left to Cancel orders</p>
            
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {activeOrders.length === 0 ? (
                <div className="py-12 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                  No active orders to process!
                </div>
              ) : activeOrders.map((order) => (
                <OperationalOrderCard
                  key={order.id}
                  order={order}
                  currencySymbol={currencySymbol}
                  onStatusUpdate={handleUpdateOrderStatus}
                />
              ))}
            </div>
          </div>

          {/* Device Distribution */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-6 flex items-center gap-2">
              <Layers size={14} className="text-purple-400" />
              Device Distribution
            </h3>

            <div className="flex items-center justify-between gap-6 mb-6">
              <div className="text-center flex-1 p-3 bg-slate-950/40 rounded-xl border border-white/5">
                <Smartphone className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Mobile</p>
                <p className="text-base font-black">{mobilePct}%</p>
              </div>
              <div className="text-center flex-1 p-3 bg-slate-950/40 rounded-xl border border-white/5">
                <Monitor className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Desktop</p>
                <p className="text-base font-black">{desktopPct}%</p>
              </div>
            </div>

            <div className="h-2 w-full bg-slate-950/65 rounded-full overflow-hidden flex border border-white/5">
              <div className="h-full bg-cyan-400" style={{ width: `${mobilePct}%` }}></div>
              <div className="h-full bg-indigo-500" style={{ width: `${desktopPct}%` }}></div>
            </div>
          </div>

          {/* Browsers distribution list */}
          <div className="backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 border border-white/40 dark:border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Globe size={14} className="text-teal-400" />
              Browsers
            </h3>

            <div className="space-y-3">
              {Object.entries(browsers).map(([b, count], idx) => {
                const totalLogsCount = recentLogs.length || 1;
                const pct = Math.round((count / totalLogsCount) * 100);
                if (count === 0 && b !== 'Chrome' && b !== 'Safari') return null;
                return (
                  <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-white/5 last:border-b-0">
                    <span className="text-slate-400 font-medium">{b}</span>
                    <span className="font-black text-white">{count} ({pct}%)</span>
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
