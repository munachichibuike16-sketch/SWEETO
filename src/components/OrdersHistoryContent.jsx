import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Clock, MapPin, ChevronRight, Loader2, ArrowRight, ExternalLink, ShoppingBag, Truck, CheckCircle2, ShieldAlert, ArrowLeft, SlidersHorizontal, Headphones, Trash2, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';
import orderEmptyMascot from '../assets/order_empty_mascot.png';

const OrdersHistoryContent = ({ isProfileTab = false, onBack }) => {
  const { settings, showToast, products } = useStore();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, to_pay, processing, processed
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest
  const [showQA, setShowQA] = useState(false);
  const [randomProducts, setRandomProducts] = useState([]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showTrashConfirm, setShowTrashConfirm] = useState(false);
  const [timeframe, setTimeframe] = useState('all'); // all, 30_days, 6_months
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Get current logged-in user from localStorage on mount
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setCurrentUser(session);
      fetchUserOrders(session);
    }
  }, []);

  // Fetch orders linked to the logged-in user
  const fetchUserOrders = async (user) => {
    setLoading(true);
    try {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      const queries = [];
      
      // 1. Strict email match if user has email
      if (user.email) {
        queries.push(`customer_contact.ilike.%| ${user.email.toLowerCase()} |%`);
      }
      
      // 2. Strict user ID match if user has ID
      if (user.id) {
        queries.push(`customer_contact.ilike.%| ${user.id}%`);
      }

      // 3. Exact phone match to support legacy / other orders placed with the phone number
      const phoneVal = user.phoneNumber || user.phone;
      const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
      if (cleanPhone && cleanPhone.length >= 8) {
        // Match exact phone prefix before the first pipe character
        queries.push(`customer_contact.ilike.${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.${phoneVal} |%`);
        queries.push(`customer_phone.eq.${phoneVal}`);
        queries.push(`customer_phone.eq.${cleanPhone}`);
      }

      if (queries.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orQuery = queries.join(',');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(orQuery)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching user orders:', err);
      showToast('Failed to load your orders.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle guest lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      showToast('Please enter an Order ID or Phone Number.', 'info');
      return;
    }

    setLoading(true);
    try {
      const query = searchQuery.trim();
      let data = [];
      let error = null;

      // Check if the query is a number (Order ID)
      if (/^\d+$/.test(query)) {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', parseInt(query, 10));
        
        data = orderData;
        error = orderErr;
      } else {
        // Otherwise, treat as phone number lookup
        const cleanPhone = query.replace(/\D/g, '');
        const searchFilter = `%${cleanPhone}%`;
        const { data: phoneData, error: phoneErr } = await supabase
          .from('orders')
          .select('*')
          .or(`customer_contact.ilike.${searchFilter},customer_phone.ilike.${searchFilter}`)
          .order('created_at', { ascending: false });

        data = phoneData;
        error = phoneErr;
      }

      if (error) throw error;
      setOrders(data || []);

      if (!data || data.length === 0) {
        showToast('No orders found matching your search.', 'info');
      } else {
        showToast(`Found ${data.length} order(s).`, 'success');
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      showToast('Error looking up order details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get status details
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': 
        return { label: 'Pending Approval', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock };
      case 'confirmed': 
        return { label: 'Confirmed / Prepared', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Package };
      case 'shipping': 
        return { label: 'Dispatched / In Transit', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Truck };
      case 'completed': 
        return { label: 'Delivered', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle2 };
      default: 
        return { label: status || 'Pending', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20', icon: Clock };
    }
  };

  // Shuffling products for "More to love" recommendations feed
  useEffect(() => {
    if (products && products.length > 0) {
      const shuffled = [...products]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      setRandomProducts(shuffled);
    }
  }, [products, activeTab]);

  const handleFilterClick = () => {
    setShowFilterSheet(true);
  };

  const handleTrashClick = () => {
    if (!searchQuery.trim()) {
      showToast('No active search query to delete 🚫', 'info');
    } else {
      setShowTrashConfirm(true);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setActiveTab('all');
    setSortOrder('newest');
    setTimeframe('all');
    showToast('Search and filters cleared 🧹', 'info');
  };

  const handleSwitchAccount = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('sweetohub_session');
      showToast('Logged out to switch account 🔄', 'success');
      window.location.reload();
    } catch (e) {
      console.error(e);
      showToast('Failed to sign out', 'error');
    }
  };

  // Filter orders based on active tab, search query, and timeframe
  const filteredOrders = orders.filter(order => {
    // 1. Search query filter (Order ID or Product Name)
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesId = order.id.toString().includes(q);
      let matchesProducts = false;
      try {
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        matchesProducts = items.some(item => item.name?.toLowerCase().includes(q));
      } catch (e) {}
      matchesSearch = matchesId || matchesProducts;
    }

    if (!matchesSearch) return false;

    // 2. Tab filter
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'to_pay';
    if (activeTab === 'confirmed') return order.status === 'confirmed';
    if (activeTab === 'processing') return order.status === 'processing';
    if (activeTab === 'shipping') return order.status === 'shipping' || order.status === 'shipped';
    if (activeTab === 'delivered') return order.status === 'completed' || order.status === 'delivered';
    if (activeTab === 'cancelled') return order.status === 'cancelled';
    
    // 3. Timeframe filter
    if (timeframe !== 'all') {
      const orderDate = new Date(order.created_at);
      const now = new Date();
      const diffTime = Math.abs(now - orderDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (timeframe === '30_days' && diffDays > 30) return false;
      if (timeframe === '6_months' && diffDays > 180) return false;
    }

    return true;
  });

  // Sort orders based on sortOrder
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (isProfileTab) {
    return (
      <div className="w-full flex flex-col bg-[#f8fafc] dark:bg-[#0f172a] min-h-screen text-slate-800 dark:text-white select-none">
        
        {/* Sticky Header Group */}
        <div 
          className="sticky z-30 bg-white dark:bg-[#0f172a] shadow-sm w-full"
          style={{ top: 'var(--header-height, 0px)' }}
        >
          {/* Header Row: Back button, Title & Icon, Search input, sorting/help/trash icons */}
          <div className="border-b border-slate-100 dark:border-white/5 px-4 py-3.5 flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              {/* Back button */}
              <button 
                onClick={onBack}
                className="text-slate-800 dark:text-white p-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              
              {/* Icon & Title */}
              <div className="flex items-center gap-2 select-none">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                  <ShoppingBag size={18} />
                </div>
                <h1 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider hidden sm:inline-block">
                  My Orders
                </h1>
                <span className="px-2 py-0.5 bg-[#8b5cf6] text-white text-[10px] font-black rounded-full leading-none">
                  {orders.length}
                </span>
              </div>
            </div>
            
            {/* Search bar input container */}
            <div className="relative flex-1 max-w-[200px] sm:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Order ID, product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-full text-slate-900 dark:text-white text-[13px] font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition-all"
              />
            </div>
            
            {/* Right actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={handleFilterClick}
                title="Toggle Filter Options"
                className="text-slate-800 dark:text-slate-300 p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={18} />
              </button>
              <button 
                onClick={() => window.open(`https://wa.me/${settings?.whatsapp_number || '22507070707'}`, '_blank')}
                title="Chat with Support"
                className="text-slate-800 dark:text-slate-300 p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <Headphones size={18} />
              </button>
              <button 
                onClick={handleTrashClick}
                title="Clear Search & Filters"
                className="text-slate-800 dark:text-slate-300 p-1.5 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          {/* Tabs Row */}
          <div className="border-b border-slate-100 dark:border-white/5 w-full flex items-center gap-6 px-6 py-2.5 overflow-x-auto no-scrollbar scroll-smooth relative select-none">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'processing', label: 'Processing' },
              { id: 'shipping', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative py-2 text-[13px] font-bold transition-all duration-300 whitespace-nowrap cursor-pointer shrink-0"
                >
                  <span className={isActive ? "text-slate-900 dark:text-white font-extrabold" : "text-slate-405"}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeOrderTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-900 dark:bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders list / empty state container */}
        <div className="flex-1 w-full flex flex-col">
          {loading ? (
            <div className="text-center py-20 flex-1 flex flex-col justify-center">
              <Loader2 size={36} className="animate-spin text-eas-blue mx-auto mb-4" />
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Searching records...</p>
            </div>
          ) : sortedOrders.length > 0 ? (
            <div className="space-y-4 px-4 py-4">
              <AnimatePresence mode="popLayout">
                {sortedOrders.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  
                  let orderItems = [];
                  try {
                    orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                  } catch (e) {
                    console.error('Failed to parse items for order', order.id);
                  }

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:border-[#8b5cf6]/30 hover:shadow-md transition-all flex flex-col text-left group"
                    >
                      {/* Status indicator bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eas-blue to-[#8b5cf6]" />
                      
                      {/* Header row */}
                      <div className="flex justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-50 dark:border-slate-700/40">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white uppercase italic">Order #{order.id}</span>
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.color}`}>
                              <StatusIcon size={10} />
                              {statusConfig.label}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">
                            {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[14px] font-black text-eas-blue">{settings?.currency || 'FCFA'} {(order.total_amount || order.total || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-2 mb-4">
                        {orderItems.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            <span className="truncate max-w-[220px]">{item.name} <span className="text-slate-400 font-medium text-[9px] ml-1">x{item.quantity}</span></span>
                            <span>{settings?.currency || 'FCFA'} {((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery and action */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700/40">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold truncate max-w-[140px] sm:max-w-[200px]">
                          <MapPin size={12} className="text-eas-blue" />
                          <span className="truncate">{order.city || 'Abidjan'} - {order.address || 'Address unspecified'}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer border border-slate-100 dark:border-slate-600/40"
                          >
                            Details
                          </button>
                          {order.status !== 'completed' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/order-tracking/${order.id}`);
                              }}
                              className="bg-eas-blue hover:bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all shadow-md shadow-eas-blue/10 flex items-center gap-1 cursor-pointer"
                            >
                              Track Live <ArrowRight size={12} />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                              <CheckCircle2 size={12} /> Done
                            </div>
                          )}
                          <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* Empty State matching layout reference */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center w-full flex-1">
              <div className="w-48 h-48 mb-6 flex items-center justify-center">
                <img 
                  src={orderEmptyMascot} 
                  alt="No orders" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <h3 className="text-[17px] font-bold text-slate-800 dark:text-white mb-2">
                No orders in this account
              </h3>
              
              <p className="text-[12px] text-slate-400 dark:text-slate-500 max-w-[320px] leading-relaxed">
                If you remember ordering before,{' '}
                <button 
                  onClick={handleSwitchAccount} 
                  className="text-eas-blue hover:underline font-semibold inline cursor-pointer bg-transparent border-none p-0"
                >
                  switch account
                </button>{' '}
                or{' '}
                <button 
                  onClick={() => setShowQA(true)} 
                  className="text-eas-blue hover:underline font-semibold inline cursor-pointer bg-transparent border-none p-0"
                >
                  Q&A
                </button>
              </p>
            </div>
          )}

          {/* More to Love Section */}
          {randomProducts && randomProducts.length > 0 && (
            <div className="mt-8 border-t border-slate-100 dark:border-white/5 pt-6 bg-slate-50/50 dark:bg-slate-900/10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="h-px bg-slate-200 dark:bg-white/10 w-8" />
                <span className="text-[12px] font-extrabold uppercase tracking-[0.25em] text-slate-800 dark:text-slate-200">
                  More to love
                </span>
                <div className="h-px bg-slate-200 dark:bg-white/10 w-8" />
              </div>
              <div className="grid grid-cols-2 gap-3 px-4 pb-8">
                {randomProducts.map((product) => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onProductClick={(p) => navigate(`/product/${p.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Q&A Modal */}
        <AnimatePresence>
          {showQA && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-[#0f172a] w-full max-w-[440px] rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative"
              >
                <button 
                  onClick={() => setShowQA(false)}
                  className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
                  Support & Q&A
                </h3>
                
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  <div className="space-y-1.5 text-left">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">How do I track my order?</h4>
                    <p className="text-xs text-slate-400 font-medium">Use the Search bar at the top with your 4-digit Order ID or phone number to find details instantly.</p>
                  </div>
                  <div className="space-y-1.5 text-left border-t border-slate-50 dark:border-white/5 pt-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">Can I modify my address?</h4>
                    <p className="text-xs text-slate-400 font-medium">Yes. Please contact our express delivery team immediately via WhatsApp before the order is dispatched.</p>
                  </div>
                  <div className="space-y-1.5 text-left border-t border-slate-50 dark:border-white/5 pt-3">
                    <h4 className="text-xs font-black text-slate-700 dark:text-slate-300">How long does shipping take?</h4>
                    <p className="text-xs text-slate-400 font-medium">Standard regional courier transit takes 15-45 minutes. Contact support if you need live dispatch monitoring.</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setShowQA(false);
                    window.open(`https://wa.me/${settings?.whatsapp_number || '22507070707'}`, '_blank');
                  }}
                  className="w-full mt-6 py-3.5 bg-eas-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  Chat with Agent
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Filter Bottom Sheet Modal */}
        <AnimatePresence>
          {showFilterSheet && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-[#0f172a] w-full max-w-[440px] rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative text-left"
              >
                <button 
                  onClick={() => setShowFilterSheet(false)}
                  className="absolute top-5 right-5 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-6 uppercase tracking-wider">
                  Filter Orders
                </h3>
                
                <div className="space-y-6">
                  {/* Sort Order Option */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sort By</h4>
                    <div className="flex gap-2">
                      {[
                        { id: 'newest', label: 'Newest First' },
                        { id: 'oldest', label: 'Oldest First' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSortOrder(item.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            sortOrder === item.id 
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' 
                              : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Status Option */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Order Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'all', label: 'All Statuses' },
                        { id: 'to_pay', label: 'To Pay' },
                        { id: 'processing', label: 'Processing' },
                        { id: 'processed', label: 'Processed' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            activeTab === item.id 
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' 
                              : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeframe Option */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timeframe</h4>
                    <div className="flex gap-2">
                      {[
                        { id: 'all', label: 'All Time' },
                        { id: '30_days', label: 'Last 30 Days' },
                        { id: '6_months', label: 'Last 6 Months' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setTimeframe(item.id)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                            timeframe === item.id 
                              ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900' 
                              : 'bg-transparent border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button 
                    onClick={() => {
                      setSortOrder('newest');
                      setActiveTab('all');
                      setTimeframe('all');
                      setShowFilterSheet(false);
                      showToast('Filters reset 🧹', 'info');
                    }}
                    className="flex-1 py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer text-center"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => {
                      setShowFilterSheet(false);
                      showToast('Filters applied successfully! 🎯', 'success');
                    }}
                    className="flex-1 py-3.5 bg-eas-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all cursor-pointer text-center"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Trash Confirmation Modal */}
        <AnimatePresence>
          {showTrashConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end justify-center p-4">
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white dark:bg-[#0f172a] w-full max-w-[440px] rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative text-center"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-500">
                  <Trash2 size={24} />
                </div>
                
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">
                  Clear Search Query?
                </h3>
                
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto mb-6">
                  Are you sure you want to clear your active search query "{searchQuery}"?
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowTrashConfirm(false)}
                    className="flex-1 py-3.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setShowTrashConfirm(false);
                      showToast('Search query deleted 🗑️', 'success');
                    }}
                    className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={isProfileTab ? "w-full relative py-2" : "relative min-h-screen px-4 py-8 md:px-8 max-w-4xl mx-auto overflow-hidden pb-32"}>
      {/* Background Decorative Elements */}
      {!isProfileTab && (
        <>
          <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-eas-blue/5 blur-3xl rounded-full" />
          <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-purple-500/5 blur-3xl rounded-full" />
        </>
      )}

      {/* Header */}
      {!isProfileTab && (
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-3 bg-eas-blue/5 text-eas-blue border border-eas-blue/20 px-6 py-2 rounded-full mb-6 shadow-sm"
            >
              <Package size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">DELIVERY_TRACKING</span>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
              Track <span className="text-eas-blue underline decoration-purple-500/30">Your Orders</span>
            </h1>
          </div>
        </div>
      )}

      {/* Lookup Card for Guest Users / Quick Lookup */}
      {!isProfileTab && (
        <div className="bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/80 rounded-[2.5rem] p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:shadow-none mb-8">
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-2">
            {currentUser ? 'Quick Search' : 'Find Your Orders'}
          </h3>
          <p className="text-xs text-slate-400 font-bold mb-6">
            {currentUser 
              ? 'Search for another order by ID or phone number, or check your linked history below.' 
              : 'Enter the Phone Number used during checkout, or your specific 4-digit Order ID.'}
          </p>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="e.g. 1045 or 07070707"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white text-xs font-black placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:border-eas-blue focus:ring-2 focus:ring-eas-blue/10 transition-all"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="bg-eas-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest px-8 py-4 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-eas-blue/10 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Lookup'}
            </button>
          </form>
        </div>
      )}

      {/* Tabs */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All', count: orders.length },
            { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length },
            { id: 'shipping', label: 'In Transit', count: orders.filter(o => o.status === 'shipping').length },
            { id: 'completed', label: 'Delivered', count: orders.filter(o => o.status === 'completed').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-eas-blue text-white shadow-lg shadow-eas-blue/20' 
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 size={40} className="animate-spin text-eas-blue mx-auto mb-4" />
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">Searching records...</p>
          </div>
        ) : sortedOrders.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {sortedOrders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              
              // Safely parse items
              let orderItems = [];
              try {
                orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
              } catch (e) {
                console.error('Failed to parse items for order', order.id);
              }

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => { setSelectedOrder(order); setIsDetailsModalOpen(true); }}
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-300 relative overflow-hidden cursor-pointer hover:border-[#8b5cf6]/30 text-left group"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eas-blue to-[#8b5cf6]`} />

                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-50 dark:border-slate-700/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Order #{order.id}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">
                        Placed on {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right sm:text-right flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                      <span className="text-xl font-black text-eas-blue">{settings?.currency || 'FCFA'} {(order.total_amount || order.total || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Items List */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased Items</h4>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-2 border border-slate-100/50 dark:border-slate-800/30 max-h-[160px] overflow-y-auto scrollbar-hide">
                        {orderItems.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex justify-between items-center text-xs font-bold">
                            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                              {item.name} <span className="text-slate-400 text-[10px] ml-1">x{item.quantity}</span>
                            </span>
                            <span className="text-slate-900 dark:text-white shrink-0">
                              {settings?.currency || 'FCFA'} {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Address</h4>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-3 border border-slate-100/50 dark:border-slate-800/30 text-xs font-bold">
                        <div className="flex items-start gap-2.5">
                          <MapPin size={16} className="text-eas-blue shrink-0 mt-0.5" />
                          <div className="flex flex-col">
                            <span className="text-slate-900 dark:text-white uppercase italic tracking-tight">{order.city || 'Abidjan'}</span>
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight mt-1">{order.address || 'Address unspecified'}</span>
                          </div>
                        </div>
                        {order.estimated_minutes > 0 && order.status === 'shipping' && (
                          <div className="flex items-center gap-2 text-purple-500 text-[11px]">
                            <Clock size={14} />
                            <span>Estimated arrival: ~{order.estimated_minutes} minutes</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                        setIsDetailsModalOpen(true);
                      }}
                      className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-white font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border border-slate-100 dark:border-slate-600/40 cursor-pointer"
                    >
                      View Details
                    </button>
                    <div className="flex items-center gap-3">
                      {order.status !== 'completed' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/order-tracking/${order.id}`);
                          }}
                          className="bg-eas-blue hover:bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-eas-blue/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          Track Live Delivery
                          <ArrowRight size={14} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-500 text-[11px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={16} />
                          Order Completed
                        </div>
                      )}
                      <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-slate-800/30 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700">
            <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <ShoppingBag className="text-slate-300" size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">No orders found</h3>
            <p className="text-slate-500 text-xs font-bold">
              {currentUser 
                ? "You haven't placed any orders yet." 
                : "Enter a phone number or order ID in the search box to lookup order details."}
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      {!isProfileTab && (
        <div className="mt-12 p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-eas-blue dark:to-blue-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 shadow-xl">
          <div className="text-center md:text-left">
            <p className="text-blue-400 dark:text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Live Support Available</p>
            <h4 className="text-2xl font-black italic uppercase leading-none">Need delivery assistance?</h4>
            <p className="text-slate-400 dark:text-blue-100/60 text-xs mt-2">Contact our logistics team via WhatsApp for immediate support.</p>
          </div>
          <button 
            onClick={() => window.open(`https://wa.me/${settings?.whatsapp_number || '22507070707'}`, '_blank')}
            className="bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] uppercase tracking-widest px-8 py-4 rounded-2xl transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
          >
            Chat with Support
            <ExternalLink size={14} />
          </button>
        </div>
      )}

      {/* Order Details Drawer / Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[9999] cursor-pointer"
            />
            
            {/* Details Modal Container */}
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`fixed z-[10000] bg-white dark:bg-[#0b1324] border border-slate-100 dark:border-slate-800/80 p-6 flex flex-col justify-between overflow-hidden shadow-2xl ${
                isMobile 
                  ? 'inset-x-0 bottom-0 rounded-t-[2.5rem] max-h-[92vh] h-auto' 
                  : 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl rounded-[2.5rem]'
              }`}
            >
              {/* Top Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 select-none">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 text-[#8b5cf6] flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={16} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {lang === 'fr' ? 'Détails de la commande' : 'Order Details'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      Order #{selectedOrder.id} • {new Date(selectedOrder.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center cursor-pointer transition-colors border-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto py-5 space-y-6 max-h-[60vh] pr-1.5 custom-scrollbar text-left select-none">
                {/* 4-Stage Stepper Progress Timeline */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2.5xl border border-slate-100 dark:border-slate-850 p-4 sm:p-5">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">
                    {lang === 'fr' ? 'Statut de livraison' : 'Delivery Status'}
                  </span>
                  
                  {/* Stepper Visuals */}
                  <div className="relative flex items-center justify-between mt-6 mb-2">
                    {/* Background Progress Line */}
                    <div className="absolute left-[8%] right-[8%] top-1/2 -translate-y-1/2 h-1 bg-slate-250 dark:bg-slate-800 -z-10 rounded-full" />
                    
                    {/* Colored Active Line */}
                    <div 
                      className="absolute left-[8%] top-1/2 -translate-y-1/2 h-1 bg-[#8b5cf6] -z-10 rounded-full transition-all duration-500" 
                      style={{
                        width: (() => {
                          const status = selectedOrder.status;
                          if (status === 'completed' || status === 'delivered') return '84%';
                          if (status === 'shipping' || status === 'shipped') return '56%';
                          if (status === 'processing' || status === 'confirmed') return '28%';
                          return '0%';
                        })()
                      }}
                    />

                    {/* Steps */}
                    {[
                      { key: 'pending', label: lang === 'fr' ? 'Reçue' : 'Placed', icon: Clock, activeThreshold: ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'delivered'] },
                      { key: 'confirmed', label: lang === 'fr' ? 'Confirmée' : 'Confirmed', icon: Package, activeThreshold: ['confirmed', 'processing', 'shipping', 'completed', 'delivered'] },
                      { key: 'processing', label: lang === 'fr' ? 'En Cours' : 'Processing', icon: Truck, activeThreshold: ['processing', 'shipping', 'completed', 'delivered'] },
                      { key: 'completed', label: lang === 'fr' ? 'Livrée' : 'Delivered', icon: CheckCircle2, activeThreshold: ['completed', 'delivered'] }
                    ].map((step, idx) => {
                      const isActive = step.activeThreshold.includes(selectedOrder.status);
                      const StepIcon = step.icon;
                      return (
                        <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 relative">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                            isActive 
                              ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                              : 'bg-white border-slate-200 text-slate-350 dark:bg-slate-900 dark:border-slate-800'
                          }`}>
                            <StepIcon size={14} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-slate-850 dark:text-white' : 'text-slate-400 dark:text-slate-505'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Items details */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {lang === 'fr' ? 'Articles commandés' : 'Ordered Items'}
                  </span>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2.5xl border border-slate-100/60 dark:border-slate-850 p-4 space-y-3">
                    {(() => {
                      let items = [];
                      try {
                        items = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : (selectedOrder.items || []);
                      } catch (e) {}
                      return items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-bold">
                          <div className="flex flex-col min-w-0">
                            <span className="text-slate-800 dark:text-slate-200 truncate pr-4">
                              {item.name}
                            </span>
                            <span className="text-slate-400 text-[10px] font-semibold mt-0.5">
                              {Number(item.price).toLocaleString()} {settings?.currency || 'FCFA'} × {item.quantity}
                            </span>
                          </div>
                          <span className="text-slate-900 dark:text-white shrink-0 font-extrabold">
                            {Number(item.price * item.quantity).toLocaleString()} {settings?.currency || 'FCFA'}
                          </span>
                        </div>
                      ));
                    })()}
                    
                    {/* Financial summary */}
                    <div className="border-t border-slate-100 dark:border-white/5 pt-3 mt-2 space-y-1.5 text-xs font-bold text-slate-500">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {Number((selectedOrder.total_amount || selectedOrder.total || 0) - (selectedOrder.delivery_fee || 0)).toLocaleString()} {settings?.currency || 'FCFA'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>{lang === 'fr' ? 'Livraison' : 'Delivery'}</span>
                        <span className="text-emerald-500 font-extrabold uppercase">
                          {Number(selectedOrder.delivery_fee || 0) === 0 ? 'Free' : `${Number(selectedOrder.delivery_fee).toLocaleString()} ${settings?.currency || 'FCFA'}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-800 dark:text-white font-extrabold border-t border-slate-100 dark:border-white/5 pt-2 mt-2">
                        <span>Total</span>
                        <span className="text-[#8b5cf6] font-black">
                          {Number(selectedOrder.total_amount || selectedOrder.total || 0).toLocaleString()} {settings?.currency || 'FCFA'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recipient details */}
                <div className="space-y-3">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {lang === 'fr' ? 'Détails de livraison' : 'Delivery Details'}
                  </span>
                  <div className="bg-slate-50/50 dark:bg-slate-900/30 rounded-2.5xl border border-slate-100/60 dark:border-slate-850 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Recipient</span>
                      <span className="text-slate-800 dark:text-slate-200 block">{selectedOrder.customer_name || 'Guest Customer'}</span>
                      <span className="text-slate-550 dark:text-slate-400 font-medium block">{selectedOrder.customer_phone}</span>
                    </div>
                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-white/5 pt-3 sm:pt-0 sm:pl-4">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Address</span>
                      <span className="text-slate-800 dark:text-slate-200 block uppercase italic">{selectedOrder.city || 'Abidjan'}</span>
                      <span className="text-slate-550 dark:text-slate-400 font-medium leading-tight block">{selectedOrder.address || 'Address unspecified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsDetailsModalOpen(false);
                      navigate(`/order-tracking/${selectedOrder.id}`);
                    }}
                    className="flex-1 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-3.5 font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_15px_rgba(124,58,237,0.2)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer border-none flex items-center justify-center gap-2"
                  >
                    <Truck size={14} />
                    <span>{lang === 'fr' ? 'Suivre en Direct' : 'Track Live on Map'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`Bonjour Sweeto-Hub, je souhaite des informations sur ma commande #${selectedOrder.id}`);
                      window.open(`https://wa.me/${settings?.whatsapp_number || '22507070707'}?text=${msg}`, '_blank');
                    }}
                    className="flex-1 bg-[#25D366] hover:bg-[#1fbe57] text-white font-black py-3.5 rounded-2xl uppercase tracking-widest text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer border-none hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.859-4.42 9.863-9.864.002-2.637-1.023-5.116-2.887-6.98C15.782 1.896 13.313.864 10.68.864 5.244.864.827 5.285.823 10.724c0 1.687.445 3.328 1.29 4.767l-.992 3.62 3.71-.973zm11.365-6.86c-.302-.15-1.786-.882-2.057-.98-.27-.1-.468-.15-.665.15-.198.3-.765.98-.937 1.18-.173.2-.347.225-.65.075-.302-.15-1.276-.47-2.43-1.498-.897-.8-1.503-1.787-1.68-2.087-.177-.3-.02-.46.13-.61.137-.135.302-.35.453-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.665-1.6-.91-2.187-.24-.575-.48-.5-.665-.51-.173-.007-.37-.01-.568-.01-.198 0-.52.074-.79.37-.27.3-1.035 1.01-1.035 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.085 3.18 5.05 4.464.707.306 1.258.489 1.69.626.71.226 1.356.194 1.866.118.57-.085 1.786-.73 2.037-1.435.25-.705.25-1.31.175-1.435-.075-.125-.27-.2-.57-.35z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrdersHistoryContent;
