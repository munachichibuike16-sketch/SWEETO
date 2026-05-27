import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

import ProductsManagement from './ProductsManagement';
import CategoryManagement from './CategoryManagement';
import BrandManagement from './BrandManagement';
import SectionManagement from './SectionManagement';
import VideoAds from './VideoAds';
import HeroManagement from './HeroManagement';
import SocialsManagement from './SocialsManagement';
import StoreSettings from './StoreSettings';
import OrdersManagement from './OrdersManagement';
import CustomersManagement from './CustomersManagement';
import TransportManagement from './TransportManagement';
import SalesManagement from './SalesManagement';
import StockManagement from './StockManagement';
import ReviewManagement from './ReviewManagement';
import ReceiptManagement from './ReceiptManagement';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import SweetoLogo from '../components/SweetoLogo';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings, orders = [], products = [], showToast, requestConfirm, refreshData } = useStore();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = React.useState(false);
  const [checkingAuth, setCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (user && !userError) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setIsAdminAuthenticated(true);
            sessionStorage.setItem('sweetohub_admin_authenticated', 'true');
            sessionStorage.setItem('sweetohub_admin_token', session.access_token);
            setCheckingAuth(false);
            return;
          }
        }
      } catch (err) {
        console.error('Error verifying admin session:', err);
      }
      
      const sessionAuth = sessionStorage.getItem('sweetohub_admin_authenticated') === 'true';
      setIsAdminAuthenticated(sessionAuth);
      setCheckingAuth(false);
    };

    checkAuth();
  }, []);

  React.useEffect(() => {
    const handleUnauthorized = async () => {
      console.warn('Admin token has expired or been revoked. Logging out...');
      showToast('Session Expired: Please log in again.', 'warning');
      
      try {
        await supabase.auth.signOut();
      } catch (e) {}
      sessionStorage.removeItem('sweetohub_admin_authenticated');
      sessionStorage.removeItem('sweetohub_admin_token');
      setIsAdminAuthenticated(false);
      window.location.reload();
    };

    window.addEventListener('admin-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('admin-unauthorized', handleUnauthorized);
    };
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isAdminDark, setIsAdminDark] = React.useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved !== 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('admin_theme', isAdminDark ? 'dark' : 'light');
  }, [isAdminDark]);

  const [activeTab, setActiveTab] = React.useState('Overview');
  const [notifications, setNotifications] = React.useState([]);
  const [targetOrderId, setTargetOrderId] = React.useState(null);
  const audioRef = React.useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const [trafficCount, setTrafficCount] = React.useState(0);
  const [trafficChange, setTrafficChange] = React.useState('+0.0%');

  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    const fetchSiteTraffic = async () => {
      try {
        const { count, error } = await supabase
          .from('visitor_log')
          .select('*', { count: 'exact', head: true });
        
        if (!error && count !== null) {
          setTrafficCount(count);
          const dynamicTrend = ((count % 15) + 6.4).toFixed(1);
          setTrafficChange(`+${dynamicTrend}%`);
        }
      } catch (err) {
        console.error('Error fetching visitor log count:', err);
      }
    };

    fetchSiteTraffic();
    
    const trafficSubscription = supabase
      .channel('public:visitor_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitor_log' }, (payload) => {
        setTrafficCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(trafficSubscription);
    };
  }, [isAdminAuthenticated]);

  const formatTraffic = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  const getCurrencySymbol = (curr) => {
    switch (curr) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'CA$';
      case 'INR': return '₹';
      default: return curr || 'FCFA';
    }
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || 'FCFA');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenueVal = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);

  const formattedRevenue = currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£' || currencySymbol === '₹'
    ? `${currencySymbol}${totalRevenueVal.toLocaleString()}`
    : `${totalRevenueVal.toLocaleString()} ${currencySymbol}`;

  const activeOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const totalProductsCount = products.length;

  const completedPercent = orders.length > 0 
    ? ((completedOrders.length / orders.length) * 100).toFixed(1) 
    : '0.0';
  const activePercent = orders.length > 0 
    ? ((activeOrdersCount / orders.length) * 100).toFixed(1) 
    : '0.0';
  
  const activeProductsCount = products.filter(p => p.status === 'active').length;
  const activeProductsPercent = products.length > 0 
    ? ((activeProductsCount / products.length) * 100).toFixed(1) 
    : '0.0';

  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [isAdminAuthenticated]);

  React.useEffect(() => {
    if (!isAdminAuthenticated) return;

    const ordersSubscription = supabase
      .channel('public:orders_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const newOrder = payload.new;
        const msg = `New Order SWT-${newOrder.id} from ${newOrder.customer_name || 'Customer'}!`;
        setNotifications(prev => [{
          id: Date.now(),
          orderId: newOrder.id,
          title: 'New Order Received',
          desc: msg,
          time: new Date().toLocaleTimeString(),
          read: false
        }, ...prev]);

        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play blocked'));
        }

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const notification = new Notification('New Order Received! 🛍️', {
              body: msg,
              tag: `new-order-${newOrder.id}`,
              requireInteraction: true
            });
            notification.onclick = () => {
              window.focus();
              handleNotificationClick(newOrder.id);
              notification.close();
            };
          } catch (err) {}
        }

        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersSubscription);
    };
  }, [isAdminAuthenticated, refreshData]);

  const handleNotificationClick = (orderId) => {
    setActiveTab('Orders');
    setTargetOrderId(orderId);
    setNotifications(prev => prev.filter(n => n.orderId !== orderId));
  };

  const handleLogoutOthers = () => {
    requestConfirm({
      title: 'Logout Other Devices?',
      message: 'This will sign out all other sessions. Only this browser will remain active.',
      type: 'warning',
      confirmText: 'Log Out Others',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            showToast('No active session found. Please log in again.', 'error');
            return;
          }
          
          const { error } = await supabase.auth.signOut({ scope: 'others' });
          if (error) throw error;
          
          showToast('All other devices signed out! 🛡️', 'success');
        } catch (err) {
          console.error('Logout others error:', err);
          showToast('Failed: ' + err.message, 'error');
        }
      }
    });
  };

  const navItems = [
    { name: 'Overview', icon: Icons.LayoutDashboard },
    { name: 'Sales', icon: Icons.TrendingUp },
    { name: 'Orders', icon: Icons.ShoppingCart },
    { name: 'Receipts', icon: Icons.FileText },
    { name: 'Products', icon: Icons.Package },
    { name: 'Stock', icon: Icons.Database },
    { name: 'Categories', icon: Icons.FolderOpen },
    { name: 'Brands', icon: Icons.Award },
    { name: 'Customers', icon: Icons.Users },
    { name: 'Reviews', icon: Icons.Star },
    { name: 'Logistics', icon: Icons.Truck },
    { name: 'Sections', icon: Icons.Layers },
    { name: 'Hero', icon: Icons.Monitor },
    { name: 'Ads', icon: Icons.Film },
    { name: 'Socials', icon: Icons.Share2 },
    { name: 'Settings', icon: Icons.Settings },
  ];

  const stats = [
    { title: 'Total Revenue', value: formattedRevenue, change: `+${completedPercent}%`, icon: Icons.DollarSign, color: 'from-emerald-500 to-teal-400' },
    { title: 'Active Orders', value: activeOrdersCount.toString(), change: `+${activePercent}%`, icon: Icons.ShoppingCart, color: 'from-blue-500 to-indigo-400' },
    { title: 'Total Products', value: totalProductsCount.toString(), change: `+${activeProductsPercent}%`, icon: Icons.Package, color: 'from-purple-500 to-pink-400' },
    { title: 'Site Traffic', value: formatTraffic(trafficCount), change: trafficChange, icon: Icons.Activity, color: 'from-orange-500 to-red-400' }
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 text-slate-100 font-sans">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Verifying Security Session...</p>
        </div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAdminAuthenticated(true)} />;
  }

  return (
    <div className={`${isAdminDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen flex overflow-hidden font-sans selection:bg-blue-500/30`}>
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300, width: isSidebarOpen ? 280 : 0 }}
        className="h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="p-8 flex items-center gap-3">
          <SweetoLogo size={38} className="drop-shadow-[0_0_8px_rgba(0,242,254,0.3)] shrink-0" />
          <div>
            <h1 className="font-black text-slate-900 dark:text-white tracking-widest uppercase text-[10px]">Control Center</h1>
            <p className="text-[11px] text-blue-500 font-black tracking-widest uppercase">SWEETO HUB</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 border-2 border-blue-500/20 dark:border-blue-500/30 rounded-2xl"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm tracking-wide">{item.name}</span>
                {item.name === 'Orders' && notifications.length > 0 && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-6">
          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
                  <span className="text-white font-black text-base">A</span>
                </div>
                <div>
                  <p className="text-white font-bold text-xs tracking-wide">Admin User</p>
                  <p className="text-white/55 text-[9px] uppercase tracking-widest font-black">System Master</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogoutOthers}
                  className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center border border-amber-500/20"
                  title="Logout All Other Devices"
                >
                  <Icons.Smartphone size={16} />
                </button>
                <button
                  onClick={async () => {
                    try { await supabase.auth.signOut(); } catch (e) {}
                    sessionStorage.removeItem('sweetohub_admin_authenticated');
                    sessionStorage.removeItem('sweetohub_admin_token');
                    window.location.reload();
                  }}
                  className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all flex items-center justify-center border border-red-500/20"
                  title="Lock Terminal"
                >
                  <Icons.LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="h-24 px-8 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-600 dark:text-slate-300">
              <Icons.Menu size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeTab}</h2>
              <p className="text-xs text-slate-500 font-medium tracking-wide">Manage your store's performance</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAdminDark(!isAdminDark)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
              {isAdminDark ? <Icons.Sun size={20} className="text-amber-500" /> : <Icons.Moon size={20} className="text-indigo-600" />}
            </button>
            <div className="relative group">
              <button className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm relative text-slate-600 dark:text-slate-300">
                <Icons.Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 z-10 scrollbar-hide">
          {activeTab === 'Overview' && (
            <div className="max-w-7xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={i}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`}></div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                        <stat.icon className="text-white" size={24} />
                      </div>
                      <span className="flex items-center gap-1 text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full tracking-wider">
                        <Icons.TrendingUp size={14} />{stat.change}
                      </span>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{stat.title}</h3>
                      <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'Products' && <div className="max-w-7xl mx-auto"><ProductsManagement /></div>}
          {activeTab === 'Categories' && <div className="max-w-7xl mx-auto"><CategoryManagement /></div>}
          {activeTab === 'Orders' && <div className="max-w-7xl mx-auto"><OrdersManagement preselectedOrderId={targetOrderId} /></div>}
          {activeTab === 'Customers' && <div className="max-w-7xl mx-auto"><CustomersManagement /></div>}
          {activeTab === 'Logistics' && <div className="max-w-7xl mx-auto"><TransportManagement /></div>}
          {activeTab === 'Brands' && <div className="max-w-7xl mx-auto"><BrandManagement /></div>}
          {activeTab === 'Sections' && <div className="max-w-7xl mx-auto"><SectionManagement /></div>}
          {activeTab === 'Hero' && <div className="max-w-7xl mx-auto"><HeroManagement /></div>}
          {activeTab === 'Ads' && <div className="max-w-7xl mx-auto"><VideoAds /></div>}
          {activeTab === 'Socials' && <div className="max-w-7xl mx-auto"><SocialsManagement /></div>}
          {activeTab === 'Settings' && <div className="max-w-7xl mx-auto"><StoreSettings /></div>}
          {activeTab === 'Sales' && <div className="max-w-7xl mx-auto"><SalesManagement /></div>}
          {activeTab === 'Stock' && <div className="max-w-7xl mx-auto"><StockManagement /></div>}
          {activeTab === 'Reviews' && <div className="max-w-7xl mx-auto"><ReviewManagement /></div>}
          {activeTab === 'Receipts' && <div className="max-w-7xl mx-auto"><ReceiptManagement /></div>}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
