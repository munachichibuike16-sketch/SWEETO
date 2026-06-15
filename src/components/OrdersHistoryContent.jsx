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
  const { t } = useLanguage();
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
    if (activeTab === 'to_pay') return order.status === 'pending';
    if (activeTab === 'processing') return order.status === 'confirmed' || order.status === 'processing';
    if (activeTab === 'processed') return order.status === 'shipping' || order.status === 'completed';
    
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
        
        {/* Header Row: Back button, Search input, sorting/help/trash icons */}
        <div className="sticky top-0 z-30 bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/5 shadow-sm px-4 py-3 flex items-center gap-3 w-full">
          {/* Back button */}
          <button 
            onClick={onBack}
            className="text-slate-800 dark:text-white p-1 hover:bg-slate-50 dark:hover:bg-white/5 rounded-full transition-colors flex-shrink-0 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Search bar input container */}
          <div className="relative flex-1">
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
        <div className="bg-white dark:bg-[#0f172a] border-b border-slate-100 dark:border-white/5 w-full flex items-center justify-between px-6 py-2.5 relative">
          {[
            { id: 'all', label: 'View all' },
            { id: 'to_pay', label: 'To pay' },
            { id: 'processing', label: 'Processing' },
            { id: 'processed', label: 'Processed' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative py-2 text-[13px] font-bold transition-all duration-300 flex-1 text-center cursor-pointer"
              >
                <span className={isActive ? "text-slate-900 dark:text-white font-extrabold" : "text-slate-400 dark:text-slate-500"}>
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div 
                    layoutId="activeOrderTabIndicator"
                    className="absolute bottom-0 left-[20%] right-[20%] h-[3px] bg-slate-900 dark:bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
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
                      className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-3xl p-5 shadow-sm relative overflow-hidden"
                    >
                      {/* Status indicator bar */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eas-blue to-purple-500" />
                      
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
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold truncate max-w-[200px]">
                          <MapPin size={12} className="text-eas-blue" />
                          <span className="truncate">{order.city || 'Abidjan'} - {order.address || 'Address unspecified'}</span>
                        </div>
                        {order.status !== 'completed' ? (
                          <button
                            onClick={() => navigate(`/order-tracking/${order.id}`)}
                            className="bg-eas-blue hover:bg-blue-600 text-white font-black text-[9px] uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-md shadow-eas-blue/10 flex items-center gap-1 cursor-pointer"
                          >
                            Track Live <ArrowRight size={12} />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                            <CheckCircle2 size={12} /> Done
                          </div>
                        )}
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
                  className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-slate-900/5 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Status Indicator Bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-eas-blue to-purple-500`} />

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
                  <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-700/50">
                    {order.status !== 'completed' ? (
                      <button
                        onClick={() => navigate(`/order-tracking/${order.id}`)}
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
    </div>
  );
};

export default OrdersHistoryContent;
