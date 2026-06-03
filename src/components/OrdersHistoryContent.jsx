import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Clock, MapPin, ChevronRight, Loader2, ArrowRight, ExternalLink, ShoppingBag, Truck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const OrdersHistoryContent = ({ isProfileTab = false }) => {
  const { settings, showToast } = useStore();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, pending, shipping, completed

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
      if (!user?.phoneNumber) {
        setOrders([]);
        setLoading(false);
        return;
      }
      
      const cleanPhone = user.phoneNumber.replace(/\D/g, '');
      const searchFilter = `%${cleanPhone}%`;

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`customer_contact.ilike.${searchFilter},customer_phone.ilike.${searchFilter}`)
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

  // Filter orders based on active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === 'pending' || order.status === 'confirmed';
    if (activeTab === 'shipping') return order.status === 'shipping';
    if (activeTab === 'completed') return order.status === 'completed';
    return true;
  });

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
        ) : filteredOrders.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => {
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
