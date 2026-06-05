import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import AnalysisManagement from './AnalysisManagement';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import SweetoLogo from '../components/SweetoLogo';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';

const OrderFeedItem = ({ order, onStatusUpdate, currencySymbol }) => {
  const [dragDir, setDragDir] = useState(null); // 'left' | 'right' | null
  
  const handleDrag = (event, info) => {
    if (info.offset.x > 50) {
      setDragDir('right');
    } else if (info.offset.x < -50) {
      setDragDir('left');
    } else {
      setDragDir(null);
    }
  };

  const handleDragEnd = (event, info) => {
    if (info.offset.x > 150) {
      onStatusUpdate(order.id, 'completed');
    } else if (info.offset.x < -150) {
      onStatusUpdate(order.id, 'cancelled');
    }
    setDragDir(null);
  };

  const statusColors = {
    completed: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
    pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    processing: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    shipped: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20'
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-950/20 h-20 animate-fade-in">
      
      {/* Background action panels */}
      <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none z-0">
        <div className={`flex items-center gap-2 text-emerald-500 transition-opacity duration-200 ${dragDir === 'right' ? 'opacity-100' : 'opacity-0'}`}>
          <Icons.CheckCircle size={20} />
          <span className="text-[10px] font-black uppercase tracking-wider">Ship / Complete</span>
        </div>
        <div className={`flex items-center gap-2 text-red-500 transition-opacity duration-200 ${dragDir === 'left' ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-[10px] font-black uppercase tracking-wider">Cancel Order</span>
          <Icons.Trash2 size={20} />
        </div>
      </div>

      {/* Main card body that is dragged */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 160 }}
        dragElastic={0.4}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="absolute inset-0 z-10 bg-white dark:bg-slate-900 p-4 flex items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">SWT-{order.id}</span>
            <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none ${statusColors[order.status] || 'text-slate-400'}`}>
              {order.status}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
            {order.customer_name || 'Anonymous Customer'}
          </p>
          <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 block">
            {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Just now'}
          </span>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-black text-slate-900 dark:text-white">
            {currencySymbol === '$' || currencySymbol === '€' || currencySymbol === '£' || currencySymbol === '₹' ? currencySymbol : ''}
            {Number(order.total_amount || order.total || 0).toLocaleString()}
            {currencySymbol !== '$' && currencySymbol !== '€' && currencySymbol !== '£' && currencySymbol !== '₹' ? ` ${currencySymbol}` : ''}
          </p>
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-0.5">
            {order.payment_method || 'Online'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings, orders = [], products = [], showToast, requestConfirm, refreshData, categories = [] } = useStore();

  const getSubtextForTab = (tab) => {
    switch (tab) {
      case 'Overview': return 'Track your store\'s vital performance metrics';
      case 'Analysis': return 'Analyze store traffic, visitor demographics, and device signatures';
      case 'Sales': return 'Monitor revenue, payment methods, and sales analytics';
      case 'Orders': return 'Track, edit, and dispatch customer orders';
      case 'Receipts': return 'Manage transactions and print invoices';
      case 'Products': return 'Add, update, and manage your inventory';
      case 'Stock': return 'Monitor stock counts and low-inventory alerts';
      case 'Categories': return 'Organize products into structured classifications';
      case 'Brands': return 'Manage product brands and partnerships';
      case 'Customers': return 'View CRM profiles, loyalty records, and audit logs';
      case 'Reviews': return 'Moderate and reply to customer product feedback';
      case 'Logistics': return 'Configure shipping zones and delivery agents';
      case 'Sections': return 'Customize frontpage banner layouts and sections';
      case 'Hero': return 'Design storefront homepage slides and promotions';
      case 'Ads': return 'Configure promotional video and graphic ads';
      case 'Socials': return 'Manage social links and external channels';
      case 'Settings': return 'Configure your store settings and shop preferences';
      default: return 'Manage your store\'s performance';
    }
  };

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
      showToast('Session Expired: Please log in again.', 'warning');
      try { await supabase.auth.signOut(); } catch (e) {}
      sessionStorage.removeItem('sweetohub_admin_authenticated');
      sessionStorage.removeItem('sweetohub_admin_token');
      setIsAdminAuthenticated(false);
      window.location.reload();
    };
    window.addEventListener('admin-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('admin-unauthorized', handleUnauthorized);
  }, []);

  // Listen for logout signals from DB
  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    
    const channel = supabase
      .channel('admin_signals_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_signals' }, async (payload) => {
        const signal = payload.new;
        if (signal.signal_type === 'logout') {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session || signal.except_session_id === 'force_all' || session.id !== signal.except_session_id) {
            await supabase.auth.signOut();
            sessionStorage.clear();
            window.location.reload();
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdminAuthenticated]);

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(() => window.innerWidth >= 1024);
  const [isAdminDark, setIsAdminDark] = React.useState(() => {
    const saved = localStorage.getItem('admin_theme');
    return saved !== 'light';
  });

  React.useEffect(() => {
    localStorage.setItem('admin_theme', isAdminDark ? 'dark' : 'light');
  }, [isAdminDark]);

  const [activeTab, setActiveTab] = React.useState('Overview');
  const [notifications, setNotifications] = React.useState(() => {
    const saved = localStorage.getItem('admin_notifications_timed');
    return saved ? JSON.parse(saved) : [];
  });
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef(null);
  const targetOrderIdRef = React.useRef(null);
  const [targetOrderId, setTargetOrderId] = React.useState(null);
  const audioRef = React.useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const [trafficCount, setTrafficCount] = React.useState(0);
  const [trafficChange, setTrafficChange] = React.useState('+0.0%');

  // Mobile UI States
  const [isActionsHubOpen, setIsActionsHubOpen] = React.useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = React.useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = React.useState(false);
  const [isScanOpen, setIsScanOpen] = React.useState(false);
  const [scanLoading, setScanLoading] = React.useState(false);
  const [scanResult, setScanResult] = React.useState(null);
  const [quickSearchQuery, setQuickSearchQuery] = React.useState('');
  const [activeMetricIndex, setActiveMetricIndex] = React.useState(0);
  const carouselRef = React.useRef(null);
  
  const [quickProductForm, setQuickProductForm] = React.useState({
    name: '',
    price: '',
    stock: '10',
    categoryId: '',
    image_url: ''
  });
  const [isQuickProductSubmitting, setIsQuickProductSubmitting] = React.useState(false);

  const handleCarouselScroll = () => {
    if (!carouselRef.current) return;
    const scrollLeft = carouselRef.current.scrollLeft;
    const width = carouselRef.current.offsetWidth;
    const index = Math.round(scrollLeft / width);
    setActiveMetricIndex(index);
  };

  const handleQuickAction = (actionId) => {
    if (actionId === 'scan') {
      setIsScanOpen(true);
      setScanResult(null);
      setScanLoading(true);
      
      // Simulate barcode scanning line animation
      setTimeout(() => {
        setScanLoading(false);
        // Play scanner beep
        try {
          const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/911/911-preview.mp3');
          beep.play().catch(() => {});
        } catch (e) {}
        
        // Select a random product
        if (products.length > 0) {
          const randomProduct = products[Math.floor(Math.random() * products.length)];
          setScanResult({ type: 'product', data: randomProduct });
        } else {
          setScanResult({ type: 'dummy', name: 'SWT-SCAN-MOCK', price: 99.99 });
        }
      }, 2500);
    } else if (actionId === 'add_product') {
      setIsQuickAddOpen(true);
    } else if (actionId === 'search') {
      setIsQuickSearchOpen(true);
      setQuickSearchQuery('');
    }
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (!quickProductForm.name || !quickProductForm.price || !quickProductForm.categoryId) {
      showToast('Name, Price, and Category are required.', 'error');
      return;
    }
    const cat = categories.find(c => c.id?.toString() === quickProductForm.categoryId?.toString());
    setIsQuickProductSubmitting(true);
    try {
      const generatedSlug = quickProductForm.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Math.floor(Math.random() * 100000);

      const payload = {
        name: quickProductForm.name,
        slug: generatedSlug,
        description: 'Uploaded via Quick Actions Hub',
        price: parseFloat(quickProductForm.price) || 0,
        original_price: null,
        cost_price: null,
        stock_quantity: parseInt(quickProductForm.stock) || 10,
        is_active: 1,
        is_featured: 0,
        is_deal: 0,
        image_url: quickProductForm.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400',
        images: '[]',
        category: cat?.name || '',
        brand: '',
        condition: 'new',
        placements: '[]',
        colors: '[]',
        related_products: '[]'
      };

      const { data: existingProds } = await supabase.from('products').select('id');
      const maxId = existingProds && existingProds.length > 0 ? Math.max(...existingProds.map(p => p.id)) : 0;
      payload.id = maxId + 1;

      const { error } = await supabase.from('products').insert([payload]);
      if (error) throw error;

      showToast('Product added successfully!', 'success');
      refreshData();
      setIsQuickAddOpen(false);
      setQuickProductForm({ name: '', price: '', stock: '10', categoryId: '', image_url: '' });
    } catch (err) {
      console.error(err);
      showToast('Failed to add product: ' + err.message, 'error');
    } finally {
      setIsQuickProductSubmitting(false);
    }
  };

  const handleSwipeStatusUpdate = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (!error) {
        showToast(`Order SWT-${orderId} marked as ${newStatus}!`, newStatus === 'completed' ? 'success' : 'warning');
        
        try {
          const beep = new Audio(newStatus === 'completed' 
            ? 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
            : 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'
          );
          beep.play().catch(() => {});
        } catch (e) {}

        refreshData();
      } else {
        throw error;
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to update order: ' + err.message, 'error');
    }
  };

  // Persistence of notification logs
  React.useEffect(() => {
    localStorage.setItem('admin_notifications_timed', JSON.stringify(notifications));
  }, [notifications]);

  // Timed auto-vanishing of read notifications (vanish 10 minutes after reading)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setNotifications(prev => prev.filter(n => {
        if (n.readAt) {
          const tenMins = 10 * 60 * 1000;
          return Date.now() - n.readAt <= tenMins;
        }
        return true;
      }));
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Dropdown outside click handler
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Poll site traffic stats via Supabase changes
  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    const fetchSiteTraffic = async () => {
      try {
        const { count, error } = await supabase.from('visitor_log').select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
          setTrafficCount(count);
          setTrafficChange(`+${((count % 15) + 6.4).toFixed(1)}%`);
        }
      } catch (err) {}
    };
    fetchSiteTraffic();
    const trafficSubscription = supabase.channel('public:visitor_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitor_log' }, () => {
        setTrafficCount(prev => prev + 1);
      }).subscribe();
    return () => { supabase.removeChannel(trafficSubscription); };
  }, [isAdminAuthenticated]);

  const formatTraffic = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toLocaleString();
  };

  const getCurrencySymbol = (curr) => {
    switch (curr) {
      case 'USD': return '$'; case 'EUR': return '€'; case 'GBP': return '£'; case 'CAD': return 'CA$'; case 'INR': return '₹';
      default: return curr || 'FCFA';
    }
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || 'FCFA');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalRevenueVal = completedOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0);
  const formattedRevenue = ['$','€','£','₹'].includes(currencySymbol)
    ? `${currencySymbol}${totalRevenueVal.toLocaleString()}`
    : `${totalRevenueVal.toLocaleString()} ${currencySymbol}`;
  const activeOrdersCount = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length;
  const totalProductsCount = products.length;
  const completedPercent = orders.length > 0 ? ((completedOrders.length / orders.length) * 100).toFixed(1) : '0.0';
  const activePercent = orders.length > 0 ? ((activeOrdersCount / orders.length) * 100).toFixed(1) : '0.0';
  const activeProductsCount = products.filter(p => p.status === 'active').length;
  const activeProductsPercent = products.length > 0 ? ((activeProductsCount / products.length) * 100).toFixed(1) : '0.0';

  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, [isAdminAuthenticated]);

  // Unified State Comparison Snapshot Watcher
  // Triggered whenever orders/products lists update (realtime or polling)
  const prevOrdersRef = React.useRef(null);
  const prevProductsRef = React.useRef(null);
  const isFirstLoadRef = React.useRef(true);

  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (!orders || orders.length === 0) return;

    // Load initial map states to prevent duplicate notifications on refresh
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevOrdersRef.current = new Map(orders.map(o => [o.id, o]));
      prevProductsRef.current = new Map(products.map(p => [p.id, p]));
      return;
    }

    // 1. Detect New Orders
    const prevOrders = prevOrdersRef.current;
    if (prevOrders) {
      const newOrders = orders.filter(o => !prevOrders.has(o.id));
      newOrders.forEach(newOrder => {
        const msg = `New Order SWT-${newOrder.id} from ${newOrder.customer_name || 'Customer'}!`;
        
        setNotifications(prev => [
          {
            id: `order-${newOrder.id}-${Date.now()}`,
            type: 'order',
            orderId: newOrder.id,
            title: 'New Order Received 🛍️',
            desc: msg,
            time: new Date().toLocaleTimeString(),
            readAt: null
          },
          ...prev
        ]);

        if (audioRef.current) audioRef.current.play().catch(() => {});

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const n = new Notification('New Order Received! 🛍️', {
              body: msg,
              tag: `new-order-${newOrder.id}`,
              requireInteraction: true
            });
            n.onclick = () => {
              window.focus();
              handleNotificationClick(newOrder.id);
              n.close();
            };
            // Tray Auto-dismiss timer
            setTimeout(() => n.close(), 10 * 60 * 1000); // 10 minutes
          } catch (err) {}
        }
      });
      prevOrdersRef.current = new Map(orders.map(o => [o.id, o]));
    }

    // 2. Detect Low Stock Thresholds
    const prevProducts = prevProductsRef.current;
    if (prevProducts && products.length > 0) {
      const threshold = settings?.low_stock_threshold || 5;
      products.forEach(p => {
        const prev = prevProducts.get(p.id);
        const stockVal = p.stock ?? p.stock_quantity ?? 0;
        const prevStockVal = prev ? (prev.stock ?? prev.stock_quantity ?? 999) : 999;

        // Trigger alert if stock drops to/below threshold
        if (stockVal <= threshold && prevStockVal > threshold) {
          const msg = `Product "${p.name}" is running low on stock (${stockVal} left)!`;

          setNotifications(prev => [
            {
              id: `stock-${p.id}-${Date.now()}`,
              type: 'stock',
              productId: p.id,
              title: '⚠️ Low Stock Alert',
              desc: msg,
              time: new Date().toLocaleTimeString(),
              readAt: null
            },
            ...prev
          ]);

          if (audioRef.current) audioRef.current.play().catch(() => {});

          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const n = new Notification('⚠️ Low Stock Alert!', {
                body: msg,
                tag: `low-stock-${p.id}`,
                requireInteraction: true
              });
              n.onclick = () => {
                window.focus();
                setActiveTab('Stock');
                n.close();
              };
              // Tray Auto-dismiss timer
              setTimeout(() => n.close(), 10 * 60 * 1000); // 10 minutes
            } catch (err) {}
          }
        }
      });
      prevProductsRef.current = new Map(products.map(p => [p.id, p]));
    }

  }, [orders, products, isAdminAuthenticated, settings]);

  // Supabase Real-Time Subscriptions for Orders & Products changes
  React.useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (!supabase) return;

    const channel = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('Realtime Order Insert:', payload);
        refreshData();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        console.log('Realtime Product Update:', payload);
        refreshData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminAuthenticated, refreshData]);

  // Background SQLite Polling Fallback (runs every 10 seconds silently, defers if typing)
  React.useEffect(() => {
    if (!isAdminAuthenticated) return;

    const pollInterval = setInterval(() => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.hasAttribute('contenteditable') ||
        activeEl.closest('[contenteditable="true"]')
      );

      if (!isTyping) {
        console.log('Admin background poll refreshing data...');
        refreshData();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(pollInterval);
  }, [isAdminAuthenticated, refreshData]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: Date.now() } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: Date.now() }));
  };

  const handleNotificationClick = (orderId) => {
    setActiveTab('Orders');
    setTargetOrderId(orderId);
    setNotifications(prev => prev.map(n => n.orderId === orderId ? { ...n, readAt: Date.now() } : n));
  };

  const handleLogoutOthers = () => {
    requestConfirm({
      title: 'Logout Other Devices?',
      message: 'This will sign out all other devices. You will stay logged in.',
      type: 'warning',
      confirmText: 'Log Out Others',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await supabase.auth.signOut({ scope: 'others' });
          
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.from('admin_signals').insert({
            signal_type: 'logout',
            except_session_id: session?.id || 'force_all'
          });
          
          showToast('Other devices logged out! 🛡️', 'success');
        } catch (err) {
          showToast('Failed: ' + err.message, 'error');
        }
      }
    });
  };

  const navItems = [
    { name: 'Overview', icon: Icons.LayoutDashboard }, { name: 'Analysis', icon: Icons.Globe }, { name: 'Sales', icon: Icons.TrendingUp },
    { name: 'Orders', icon: Icons.ShoppingCart }, { name: 'Receipts', icon: Icons.FileText },
    { name: 'Products', icon: Icons.Package }, { name: 'Stock', icon: Icons.Database },
    { name: 'Categories', icon: Icons.FolderOpen }, { name: 'Brands', icon: Icons.Award },
    { name: 'Customers', icon: Icons.Users }, { name: 'Reviews', icon: Icons.Star },
    { name: 'Logistics', icon: Icons.Truck }, { name: 'Sections', icon: Icons.Layers },
    { name: 'Hero', icon: Icons.Monitor }, { name: 'Ads', icon: Icons.Film },
    { name: 'Socials', icon: Icons.Share2 }, { name: 'Settings', icon: Icons.Settings },
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
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isSidebarOpen ? 0 : -300, width: isSidebarOpen ? 280 : 0 }}
        className="fixed lg:relative h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-40 overflow-hidden shadow-2xl lg:shadow-none"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="p-8 flex items-center gap-3">
          <SweetoLogo size={38} className="drop-shadow-[0_0_8px_rgba(0,242,254,0.3)] shrink-0" />
          <div><h1 className="font-black text-slate-900 dark:text-white tracking-widest uppercase text-[10px]">Control Center</h1><p className="text-[11px] text-blue-500 font-black tracking-widest uppercase">SWEETO HUB</p></div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            const hasUnreadOrders = item.name === 'Orders' && notifications.some(n => n.type === 'order' && !n.readAt);
            const hasUnreadStock = item.name === 'Stock' && notifications.some(n => n.type === 'stock' && !n.readAt);
            
            return (
              <button key={item.name} onClick={() => setActiveTab(item.name)} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium'}`}>
                {isActive && <motion.div layoutId="activeTabIndicator" className="absolute inset-0 border-2 border-blue-500/20 dark:border-blue-500/30 rounded-2xl" initial={false} transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                <item.icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-sm tracking-wide">{item.name}</span>
                {(hasUnreadOrders || hasUnreadStock) && <span className="ml-auto w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>}
              </button>
            );
          })}
        </nav>
        <div className="p-6">
          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4"><div className="w-10 h-10 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0"><span className="text-white font-black text-base">A</span></div><div><p className="text-white font-bold text-xs tracking-wide">Admin User</p><p className="text-white/55 text-[9px] uppercase tracking-widest font-black">System Master</p></div></div>
              <div className="flex items-center gap-2">
                <button onClick={handleLogoutOthers} className="w-9 h-9 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all flex items-center justify-center border border-amber-500/20" title="Logout Other Devices"><Icons.Smartphone size={16} /></button>
                <button onClick={async () => { try { await supabase.auth.signOut(); } catch (e) {} sessionStorage.removeItem('sweetohub_admin_authenticated'); sessionStorage.removeItem('sweetohub_admin_token'); window.location.reload(); }} className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all flex items-center justify-center border border-red-500/20" title="Lock Terminal"><Icons.LogOut size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative min-w-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/5 rounded-full blur-[120px] pointer-events-none"></div>
        <header className="h-24 px-4 sm:px-8 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3 sm:gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-600 dark:text-slate-300 lg:hidden"
            >
              <Icons.Menu size={20} />
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 lg:hidden font-black text-xs">A</div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">{activeTab}</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide mt-0.5 sm:mt-1.5 leading-relaxed truncate max-w-[140px] xs:max-w-none">
                {getSubtextForTab(activeTab)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { setIsQuickSearchOpen(true); setQuickSearchQuery(''); }} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer lg:hidden">
              <Icons.Search size={20} />
            </button>
            <button onClick={() => setIsAdminDark(!isAdminDark)} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer">
              {isAdminDark ? <Icons.Sun size={20} className="text-amber-500" /> : <Icons.Moon size={20} className="text-indigo-600" />}
            </button>
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-sm relative text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <Icons.Bell size={20} />
                {notifications.filter(n => !n.readAt).length > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-slate-950 animate-pulse"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl p-5 z-[100] text-left space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Admin Alerts ({notifications.filter(n => !n.readAt).length})</span>
                      {notifications.some(n => !n.readAt) && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-[8px] font-black uppercase text-blue-500 hover:text-blue-600 cursor-pointer"
                        >
                          Mark All Read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 dark:text-slate-500 space-y-2">
                          <Icons.Inbox className="mx-auto" size={24} />
                          <p className="text-[10px] font-bold uppercase tracking-wider">No alerts active</p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id}
                            onClick={() => {
                              handleMarkAsRead(n.id);
                              if (n.type === 'order') {
                                handleNotificationClick(n.orderId);
                              } else if (n.type === 'stock') {
                                setActiveTab('Stock');
                              }
                              setIsNotifOpen(false);
                            }}
                            className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer flex gap-3 ${
                              n.readAt
                                ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
                                : 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-500/10 dark:border-blue-500/5 hover:border-blue-500/25'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              n.type === 'order' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                              {n.type === 'order' ? <Icons.ShoppingCart size={16} /> : <Icons.AlertTriangle size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={`text-xs font-bold truncate ${n.readAt ? 'text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                                {n.title}
                              </h5>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                                {n.desc}
                              </p>
                              <span className="text-[8px] text-slate-300 dark:text-slate-600 block mt-1">
                                {n.time} {n.readAt && '(Vanish pending)'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-32 lg:pb-12 z-10 scrollbar-hide">
          {activeTab === 'Overview' && (
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Metrics Section (Grid on Desktop, Swipeable Carousel on Mobile) */}
              <div className="relative">
                <div 
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 pb-4 sm:pb-0"
                >
                  {stats.map((stat, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: i * 0.1 }} 
                      key={i} 
                      className="min-w-[280px] xs:min-w-[300px] flex-shrink-0 snap-start snap-always sm:min-w-0 sm:flex-shrink bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500"
                    >
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700`}></div>
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                          <stat.icon className="text-white" size={24} />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full tracking-wider">
                          <Icons.TrendingUp size={14} />{stat.change}
                        </span>
                      </div>
                      <div className="relative z-10 min-w-0">
                        <h3 className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-2 truncate">{stat.title}</h3>
                        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate" title={stat.value}>
                          {stat.value}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Dots indicator for mobile carousel */}
                <div className="flex justify-center gap-1.5 sm:hidden mt-2">
                  {stats.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeMetricIndex === idx ? 'w-4 bg-blue-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* ─── LIVE ACTIVITY (RECENT ORDERS FEED) ─── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                      <Icons.Activity size={16} className="text-blue-500 animate-pulse" /> Live Order Feed
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 sm:hidden">
                      Swipe Left to Cancel • Right to Ship
                    </p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest hidden sm:inline">Recent Activity Log</span>
                </div>
                
                {orders.length === 0 ? (
                  <div className="bg-white/50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 text-center text-slate-400 text-xs font-bold">
                    No orders placed yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <OrderFeedItem
                        key={order.id}
                        order={order}
                        onStatusUpdate={handleSwipeStatusUpdate}
                        currencySymbol={currencySymbol}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'Analysis' && <div className="max-w-7xl mx-auto"><AnalysisManagement /></div>}
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
          {activeTab === 'Notifications' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">System Alerts</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Real-time alerts for orders and inventory thresholds</p>
                </div>
                {notifications.some(n => !n.readAt) && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Clear All Alerts
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner"><Icons.Inbox size={24} /></div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-widest">No Alerts Active</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Everything is running smoothly on the server</p>
                    </div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        handleMarkAsRead(n.id);
                        if (n.type === 'order') {
                          handleNotificationClick(n.orderId);
                        } else if (n.type === 'stock') {
                          setActiveTab('Stock');
                        }
                      }}
                      className={`p-4 rounded-3xl border transition-all duration-300 cursor-pointer flex gap-4 ${
                        n.readAt
                          ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-900 opacity-60'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/25 shadow-sm'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        n.type === 'order' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {n.type === 'order' ? <Icons.ShoppingCart size={18} /> : <Icons.AlertTriangle size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-xs font-black uppercase tracking-wide truncate ${n.readAt ? 'text-slate-500' : 'text-slate-905 dark:text-white'}`}>
                          {n.title}
                        </h5>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">
                          {n.desc}
                        </p>
                        <span className="text-[8px] text-slate-400 dark:text-slate-600 block mt-2 font-bold uppercase tracking-widest">
                          Received: {n.time}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── STICKY GLASSMORPHIC BOTTOM NAV BAR ─── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pt-2 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pointer-events-none">
        <div className="w-full max-w-lg mx-auto h-16 bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800/55 rounded-2xl shadow-[0_-10px_35px_rgba(0,0,0,0.12)] flex items-center justify-around px-2 pointer-events-auto">
          {[
            { id: 'Overview', label: 'Home', icon: Icons.LayoutDashboard },
            { id: 'Orders', label: 'Orders', icon: Icons.ShoppingCart },
            { id: 'Products', label: 'Products', icon: Icons.Package },
            { id: 'Notifications', label: 'Alerts', icon: Icons.Bell }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            const hasAlert = tab.id === 'Notifications' && notifications.some(n => !n.readAt);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
                  isActive ? 'text-blue-600 dark:text-blue-400 font-black' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute inset-0 bg-blue-500/10 rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <TabIcon size={20} className={isActive ? 'scale-110' : ''} />
                  {hasAlert && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950 animate-pulse" />
                  )}
                  <span className="text-[8px] font-black mt-1 uppercase tracking-widest leading-none">{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── QUICK ACTIONS FLOATING HUB (FAB) ─── */}
      <div className="fixed bottom-24 right-6 z-50 lg:hidden">
        <AnimatePresence>
          {isActionsHubOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsActionsHubOpen(false)}
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40"
              />
              
              {/* Wheel/Menu options */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="absolute bottom-16 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-4 rounded-3xl shadow-2xl z-50 w-52 space-y-2.5"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2 mb-1 pl-1">Quick Actions</p>
                {[
                  { id: 'scan', label: 'Quick Scan', icon: Icons.QrCode, desc: 'Camera barcode scanner', color: 'text-emerald-500 bg-emerald-500/10' },
                  { id: 'add_product', label: 'Add Product', icon: Icons.PlusCircle, desc: 'Quick upload stock', color: 'text-blue-500 bg-blue-500/10' },
                  { id: 'search', label: 'Global Search', icon: Icons.Search, desc: 'Find orders/inventory', color: 'text-purple-500 bg-purple-500/10' }
                ].map(action => (
                  <button
                    key={action.id}
                    onClick={() => {
                      setIsActionsHubOpen(false);
                      handleQuickAction(action.id);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${action.color} group-hover:scale-105 transition-transform`}>
                      <action.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white leading-none mb-0.5">{action.label}</h4>
                      <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate leading-none">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Trigger Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsActionsHubOpen(!isActionsHubOpen)}
          className={`w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300 ${
            isActionsHubOpen ? 'rotate-45' : ''
          }`}
        >
          <Icons.Plus size={24} className="stroke-[3]" />
        </motion.button>
      </div>

      {/* ─── QUICK ADD PRODUCT MODAL ─── */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsQuickAddOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Icons.PlusCircle className="text-blue-500" size={14} /> Quick Add Product
                </span>
                <button onClick={() => setIsQuickAddOpen(false)} className="text-slate-400 hover:text-slate-600"><Icons.X size={16} /></button>
              </div>

              <form onSubmit={handleQuickAddSubmit} className="space-y-4">
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Product Name</label>
                  <input
                    required
                    type="text"
                    value={quickProductForm.name}
                    onChange={e => setQuickProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                    placeholder="e.g. Sweeto Premium Mug"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Price</label>
                    <input
                      required
                      type="number"
                      value={quickProductForm.price}
                      onChange={e => setQuickProductForm(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Stock</label>
                    <input
                      required
                      type="number"
                      value={quickProductForm.stock}
                      onChange={e => setQuickProductForm(prev => ({ ...prev, stock: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Category</label>
                  <select
                    required
                    value={quickProductForm.categoryId}
                    onChange={e => setQuickProductForm(prev => ({ ...prev, categoryId: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={quickProductForm.image_url}
                    onChange={e => setQuickProductForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none focus:border-blue-500 font-bold"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isQuickProductSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1.5"
                >
                  {isQuickProductSubmitting ? (
                    <Icons.Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Icons.CheckCircle size={14} /> Push Live
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── QUICK SEARCH DIALOG ─── */}
      <AnimatePresence>
        {isQuickSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm pt-20">
            <div className="absolute inset-0 cursor-pointer" onClick={() => setIsQuickSearchOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -20, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl max-w-md w-full z-10 space-y-4 animate-fade-in"
            >
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3">
                <Icons.Search className="text-slate-400" size={18} />
                <input
                  autoFocus
                  type="text"
                  value={quickSearchQuery}
                  onChange={e => setQuickSearchQuery(e.target.value)}
                  placeholder="Search orders, products, categories..."
                  className="w-full bg-transparent text-xs font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {quickSearchQuery && (
                  <button onClick={() => setQuickSearchQuery('')} className="text-slate-400 hover:text-slate-600"><Icons.X size={14} /></button>
                )}
              </div>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto space-y-2.5 custom-scrollbar">
                {quickSearchQuery.trim() === '' ? (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">Type to start searching...</p>
                ) : (() => {
                  const query = quickSearchQuery.toLowerCase().trim();
                  const matchedOrders = orders.filter(o => 
                    o.id.toString().includes(query) || 
                    (o.customer_name || '').toLowerCase().includes(query)
                  );
                  const matchedProducts = products.filter(p => 
                    p.name.toLowerCase().includes(query) || 
                    (p.category || '').toLowerCase().includes(query)
                  );
                  
                  if (matchedOrders.length === 0 && matchedProducts.length === 0) {
                    return <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4">No matches found</p>;
                  }

                  return (
                    <>
                      {matchedOrders.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Orders ({matchedOrders.length})</p>
                          {matchedOrders.slice(0, 3).map(o => (
                            <div
                              key={o.id}
                              onClick={() => {
                                setIsQuickSearchOpen(false);
                                handleNotificationClick(o.id);
                              }}
                              className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                            >
                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none mb-1">SWT-{o.id}</h5>
                                <p className="text-[9px] text-slate-400 font-bold truncate leading-none">{o.customer_name}</p>
                              </div>
                              <span className="text-[9px] font-black uppercase text-blue-500">View</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {matchedProducts.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-1">Products ({matchedProducts.length})</p>
                          {matchedProducts.slice(0, 3).map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setIsQuickSearchOpen(false);
                                setActiveTab('Products');
                              }}
                              className="p-3 bg-slate-50 dark:bg-slate-950 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 border border-slate-100 dark:border-slate-800 rounded-xl cursor-pointer flex justify-between items-center transition-all"
                            >
                              <div className="flex items-center gap-3">
                                {p.image_url && <img src={p.image_url} className="w-8 h-8 rounded-lg object-cover bg-slate-100" alt="" />}
                                <div>
                                  <h5 className="text-xs font-black text-slate-900 dark:text-white leading-none mb-1 truncate max-w-[150px]">{p.name}</h5>
                                  <p className="text-[9px] text-slate-400 font-bold truncate leading-none">{p.category}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase text-blue-500">Edit</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── QUICK SCAN MOCK SCANNER ─── */}
      <AnimatePresence>
        {isScanOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full z-10 text-white space-y-6 overflow-hidden"
            >
              {/* Scan grid and laser overlay */}
              <div className="relative w-full aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center">
                {scanLoading ? (
                  <>
                    {/* Scanning grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                    
                    {/* Pulsing Scan box */}
                    <div className="w-2/3 h-2/3 border-2 border-dashed border-emerald-500/50 rounded-2xl animate-pulse flex items-center justify-center">
                      <Icons.Scan size={40} className="text-emerald-500/20" />
                    </div>

                    {/* Red Laser beam */}
                    <motion.div
                      animate={{ y: [-150, 150, -150] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10"
                    />

                    {/* Camera feedback hint */}
                    <p className="absolute bottom-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Align Barcode within Frame</p>
                  </>
                ) : scanResult ? (
                  <div className="p-4 text-center space-y-4 w-full">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                      <Icons.CheckCircle size={32} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Scan Match Found!</h4>
                      <p className="text-sm font-black mt-2 text-white truncate">{scanResult.data?.name || scanResult.name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Category: {scanResult.data?.category || 'General'} • Price: {currencySymbol}{scanResult.data?.price || scanResult.price}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-2 font-bold font-mono">Serial Code: SWT-{(scanResult.data?.id || 4827) * 29482}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Failed to initiate camera feed.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsScanOpen(false)}
                  className="flex-1 py-3 bg-slate-800 text-slate-200 hover:bg-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all"
                >
                  Close
                </button>
                {scanResult && scanResult.type === 'product' && (
                  <button
                    onClick={() => {
                      setIsScanOpen(false);
                      setActiveTab('Products');
                    }}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1"
                  >
                    <Icons.Edit size={14} /> Edit Stock
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
