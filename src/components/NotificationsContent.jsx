import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Tag, Star, Clock, CheckCheck, Filter, Sparkles, Zap, ShoppingBag } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

const NotificationsContent = ({ onProductClick }) => {
  const { products, settings } = useStore();
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [readNotifs, setReadNotifs] = useState(() => {
    const saved = localStorage.getItem('read_notifications_timed');
    return saved ? JSON.parse(saved) : {};
  });

  // Tick every 10 seconds to force-refresh the list for vanishing notifications
  const [, setTick] = useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isNotificationRead = (id) => {
    return !!readNotifs[id];
  };

  // Mock notifications based on products
  const newArrivals = products.filter(p => p.is_new_arrival).map(p => ({
    id: `new-${p.id}`,
    type: 'new_arrival',
    title: p.name,
    message: `A new ${p.category} just arrived! Don't miss out on the latest tech.`,
    time: '2 hours ago',
    product: p,
    isRead: isNotificationRead(`new-${p.id}`)
  }));

  const priceDrops = products.filter(p => p.original_price > p.price).map(p => ({
    id: `price-${p.id}`,
    type: 'price_drop',
    title: `Price Drop: ${p.name}`,
    message: `Huge savings! The price just dropped by ${Math.round((p.original_price - p.price) / p.original_price * 100)}%.`,
    time: '5 hours ago',
    product: p,
    isRead: isNotificationRead(`price-${p.id}`)
  }));

  const allNotifications = [...newArrivals, ...priceDrops]
    .filter(n => {
      const readAt = readNotifs[n.id];
      if (readAt) {
        // If read more than 10 minutes ago, hide it (vanish)
        const tenMinutes = 10 * 60 * 1000;
        if (Date.now() - readAt > tenMinutes) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => b.id.localeCompare(a.id));
  
  const filteredNotifs = allNotifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleMarkAsRead = (id) => {
    if (!readNotifs[id]) {
      const updated = { ...readNotifs, [id]: Date.now() };
      setReadNotifs(updated);
      localStorage.setItem('read_notifications_timed', JSON.stringify(updated));
      
      // Also sync legacy to keep other views happy if they check it
      const legacy = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      if (!legacy.includes(id)) {
        legacy.push(id);
        localStorage.setItem('read_notifications', JSON.stringify(legacy));
      }
    }
  };

  const handleMarkAllRead = () => {
    const updated = { ...readNotifs };
    const legacy = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const now = Date.now();
    allNotifications.forEach(n => {
      if (!updated[n.id]) {
        updated[n.id] = now;
      }
      if (!legacy.includes(n.id)) {
        legacy.push(n.id);
      }
    });
    setReadNotifs(updated);
    localStorage.setItem('read_notifications_timed', JSON.stringify(updated));
    localStorage.setItem('read_notifications', JSON.stringify(legacy));
  };

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 max-w-4xl mx-auto overflow-hidden pb-32">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-eas-blue/5 blur-3xl rounded-full" />

      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/30 px-6 py-2 rounded-full mb-6 shadow-sm"
          >
            <Bell size={18} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">NOTIFICATIONS_CENTER</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
            Your <span className="text-eas-blue underline decoration-amber-500/30">Activity</span>
          </h1>
        </div>

        {allNotifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 text-xs font-bold text-eas-blue hover:text-eas-blue/80 transition-colors bg-eas-blue/5 px-4 py-2 rounded-xl"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters (WhatsApp Style) */}
      <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 w-fit">
        {[
          { id: 'all', label: 'All', count: allNotifications.length },
          { id: 'unread', label: 'Unread', count: allNotifications.filter(n => !n.isRead).length },
          { id: 'read', label: 'Read', count: allNotifications.filter(n => n.isRead).length }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-2 ${
              filter === btn.id 
                ? 'bg-eas-blue text-white shadow-lg shadow-eas-blue/20' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {btn.label}
            {btn.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                filter === btn.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {btn.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((notif, index) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleMarkAsRead(notif.id)}
                className={`group relative flex items-center gap-4 p-5 rounded-3xl border transition-all duration-500 cursor-pointer ${
                  notif.isRead 
                    ? 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-700 opacity-80' 
                    : 'bg-white dark:bg-slate-800 border-eas-blue/20 shadow-xl shadow-eas-blue/5'
                }`}
              >
                {!notif.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-eas-blue rounded-full" />
                )}

                <div className="relative w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                  <img src={notif.product.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className={`absolute top-1 right-1 p-1 rounded-md ${
                    notif.type === 'new_arrival' ? 'bg-amber-500' : 'bg-eas-blue'
                  } text-white`}>
                    {notif.type === 'new_arrival' ? <Sparkles size={10} /> : <Zap size={10} />}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-bold truncate text-lg ${notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2 flex items-center gap-1">
                      <Clock size={10} />
                      {notif.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    {notif.message}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`text-sm font-black ${notif.type === 'new_arrival' ? 'text-eas-blue' : 'text-amber-500'}`}>
                    {settings?.currency || 'FCFA'} {notif.product.price.toLocaleString()}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notif.id);
                      onProductClick(notif.product);
                    }}
                    className={`p-2.5 rounded-xl transition-all ${
                      notif.isRead
                        ? 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                        : 'bg-eas-blue text-white shadow-lg shadow-eas-blue/20'
                    }`}
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700"
            >
              <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Filter className="text-slate-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter">No {filter} updates</h3>
              <p className="text-slate-500 text-xs font-bold">Everything is quiet here for now.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats/Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-12 p-8 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-800 dark:from-eas-blue dark:to-blue-700 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10"
      >
        <div className="text-center md:text-left">
          <p className="text-blue-400 dark:text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-2">Live Ecosystem</p>
          <h4 className="text-2xl font-black italic uppercase leading-none">Real-time alerts active</h4>
          <p className="text-slate-400 dark:text-blue-100/60 text-xs mt-2">We monitor stock and prices 24/7 for you.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex -space-x-3">
            {products.slice(0, 3).map((p, i) => (
              <img key={i} src={p.image_url} alt="" className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-900 object-cover shadow-lg" />
            ))}
            <div className="w-12 h-12 rounded-2xl border-2 border-white dark:border-slate-900 bg-white/10 backdrop-blur-md flex items-center justify-center text-[10px] font-black">
              +{products.length}
            </div>
          </div>
          <div className="h-12 w-[1px] bg-white/10 hidden md:block" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-emerald-400">● 100% Secure</span>
            <span className="text-[10px] text-white/50">Encrypted Updates</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotificationsContent;
