import React, { useState, useEffect } from 'react';
import { Bell, Package, AlertCircle, CheckCircle2, Trash2, X, Sparkles, CheckCheck, Clock, Truck } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function NotificationsDrawer({ isOpen, onClose, onProductClick }) {
  const navigate = useNavigate();
  const { products } = useStore();
  const { lang, isRTL } = useLanguage();
  
  const [notifications, setNotifications] = useState([]);
  const [readNotifs, setReadNotifs] = useState([]);
  const [deletedNotifs, setDeletedNotifs] = useState({});
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load state from localStorage
    const storedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const storedDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');
    
    setReadNotifs(storedRead);
    setDeletedNotifs(storedDeleted);

    // Fetch user orders
    const fetchUserOrders = async () => {
      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      if (!session) return;
      
      try {
        const queries = [];
        if (session.email) queries.push(`customer_contact.ilike.%| ${session.email.toLowerCase()} |%`);
        if (session.id) queries.push(`customer_contact.ilike.%| ${session.id}%`);
        
        const phoneVal = session.phoneNumber || session.phone;
        const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
        if (cleanPhone && cleanPhone.length >= 8) {
          queries.push(`customer_contact.ilike.${cleanPhone} |%`);
          queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
          queries.push(`customer_contact.ilike.${phoneVal} |%`);
          queries.push(`customer_phone.eq.${phoneVal}`);
          queries.push(`customer_phone.eq.${cleanPhone}`);
        }

        if (queries.length > 0) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(queries.join(','))
            .order('created_at', { ascending: false });
            
          if (!error && data) {
            setOrders(data);
          }
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    
    fetchUserOrders();
  }, [isOpen]);

  useEffect(() => {
    const storedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const storedDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');

    // Build notifications from new arrival products
    const newArrivals = (products || []).filter(p => p.is_new_arrival).map(p => ({
      id: `new-product-${p.id}`,
      type: 'sale',
      title: lang === 'fr' ? 'Nouveauté Exclusive' : 'Exclusive New Arrival',
      message: `${p.name} - ${lang === 'fr' ? 'Découvrez ce nouveau produit premium dès maintenant !' : 'Discover this premium new product right now!'}`,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : 'New',
      read: storedRead.includes(`new-product-${p.id}`),
      deleted: !!storedDeleted[`new-product-${p.id}`],
      originalProduct: p,
      sortTime: p.created_at ? new Date(p.created_at).getTime() : 0
    }));

    // Build order notifications
    const orderNotifs = orders.map(order => {
      const status = (order.status || 'pending').toLowerCase();
      let title = lang === 'fr' ? 'Mise à jour de commande' : 'Order Update';
      let message = '';
      let type = 'order_status';
      
      if (status === 'pending' || status === 'processing') {
        title = lang === 'fr' ? 'Commande Reçue' : 'Order Received';
        message = lang === 'fr' ? `Votre commande pour ${order.total_amount || order.total} FCFA est en cours de traitement.` : `Your order for ${order.total_amount || order.total} FCFA is being processed.`;
        type = 'processing';
      } else if (status === 'shipped' || status === 'shipping') {
        title = lang === 'fr' ? 'Commande Expédiée' : 'Order Shipped';
        message = lang === 'fr' ? `Bonne nouvelle ! Votre commande est en route.` : `Good news! Your order is on the way.`;
        type = 'shipped';
      } else if (status === 'delivered' || status === 'completed') {
        title = lang === 'fr' ? 'Commande Livrée' : 'Order Delivered';
        message = lang === 'fr' ? `Votre commande a été livrée avec succès.` : `Your order has been delivered successfully.`;
        type = 'delivered';
      } else if (status === 'cancelled') {
        title = lang === 'fr' ? 'Commande Annulée' : 'Order Cancelled';
        message = lang === 'fr' ? `Votre commande a été annulée.` : `Your order has been cancelled.`;
        type = 'alert';
      }

      return {
        id: `order-${order.id}-${status}`,
        type,
        title,
        message,
        time: order.created_at ? new Date(order.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : 'Recent',
        read: storedRead.includes(`order-${order.id}-${status}`),
        deleted: !!storedDeleted[`order-${order.id}-${status}`],
        sortTime: order.created_at ? new Date(order.created_at).getTime() : 0
      };
    });

    const systemNotifs = [
      { id: 'sys-1', type: 'order', title: lang === 'fr' ? "Bienvenue sur SWEETO" : "Welcome to SWEETO", message: lang === 'fr' ? "Profitez d'une expérience d'achat premium." : "Enjoy a premium shopping experience with us.", time: lang === 'fr' ? "À l'instant" : "Just now", read: storedRead.includes('sys-1'), deleted: !!storedDeleted['sys-1'], sortTime: 9999999999999 }
    ];

    const combined = [...orderNotifs, ...newArrivals, ...systemNotifs].filter(n => !n.deleted).sort((a, b) => b.sortTime - a.sortTime);
    setNotifications(combined);
  }, [products, lang, orders]);

  const updateGlobalState = (newRead, newDeleted) => {
    localStorage.setItem('read_notifications', JSON.stringify(newRead));
    localStorage.setItem('deleted_notifications', JSON.stringify(newDeleted));
    window.dispatchEvent(new Event('notifications_updated'));
  };

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    const newRead = [...readNotifs, id];
    setReadNotifs(newRead);
    updateGlobalState(newRead, deletedNotifs);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const newDeleted = { ...deletedNotifs, [id]: true };
    setDeletedNotifs(newDeleted);
    updateGlobalState(readNotifs, newDeleted);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const newRead = [...new Set([...readNotifs, ...allIds])];
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setReadNotifs(newRead);
    updateGlobalState(newRead, deletedNotifs);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) toggleRead(notif.id);
    if (notif.originalProduct && onProductClick) {
      onProductClick(notif.originalProduct);
      onClose();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-indigo-500 w-5 h-5" />;
      case 'processing': return <Clock className="text-amber-500 w-5 h-5" />;
      case 'shipped': return <Truck className="text-blue-500 w-5 h-5" />;
      case 'delivered': return <CheckCircle2 className="text-emerald-500 w-5 h-5" />;
      case 'sale': return <Sparkles className="text-[#1F6FEB] w-5 h-5" />;
      case 'alert': return <AlertCircle className="text-red-500 w-5 h-5" />;
      default: return <CheckCircle2 className="text-green-500 w-5 h-5" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300]"
          />

          {/* Drawer Panel */}
          <motion.aside 
            initial={{ x: isRTL ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 ${isRTL ? 'left-0' : 'right-0'} h-full w-full max-w-md bg-white/95 dark:bg-[#0f1423]/95 backdrop-blur-3xl shadow-2xl z-[310] flex flex-col border-l border-slate-100 dark:border-slate-800/80 overflow-hidden font-sans`}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center bg-white dark:bg-[#0f1423] z-10">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-indigo-950/40 dark:to-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-5 h-5 animate-pulse" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center text-[7px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    {lang === 'fr' ? 'Notifications' : 'Notifications'}
                  </h2>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    {unreadCount === 0 
                      ? (lang === 'fr' ? 'Tout est à jour' : 'All caught up') 
                      : (lang === 'fr' ? `${unreadCount} nouvelle(s)` : `${unreadCount} new`)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="p-1.5 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors flex items-center justify-center border-none cursor-pointer"
                    title={lang === 'fr' ? 'Tout marquer comme lu' : 'Mark all as read'}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-450 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer border-none font-bold text-base"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0 min-h-0">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 dark:bg-slate-800/40 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                    <Bell className="w-6 h-6 text-slate-300 dark:text-slate-650" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                    {lang === 'fr' ? "Aucune notification" : "No notifications"}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
                    {lang === 'fr' 
                      ? "Nous vous tiendrons au courant des nouveautés." 
                      : "We'll let you know when there's something new."}
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif) => (
                    <motion.div 
                      layout
                      key={notif.id}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, transition: { duration: 0.15 } }}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                        notif.read 
                          ? 'bg-white dark:bg-[#121827]/40 border-slate-100 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-800' 
                          : 'bg-white dark:bg-[#151c2e] border-indigo-100 dark:border-indigo-500/20 shadow-md shadow-indigo-500/5'
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notif.read && (
                        <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2.5 h-2.5 bg-indigo-500 rounded-full shadow-lg" />
                      )}

                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {notif.originalProduct ? (
                            <img 
                              src={
                                notif.originalProduct.image_url ||
                                notif.originalProduct.image || 
                                (notif.originalProduct.images ? 
                                  (Array.isArray(notif.originalProduct.images) ? notif.originalProduct.images[0] : typeof notif.originalProduct.images === 'string' ? (notif.originalProduct.images.startsWith('[') ? JSON.parse(notif.originalProduct.images)[0] : notif.originalProduct.images.split(',')[0]) : '')
                                : '')
                              }
                              alt={notif.title}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-100 dark:border-slate-800"
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${!notif.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                              {getIcon(notif.type)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-1">
                            <h3 className={`text-xs font-bold truncate ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-650 dark:text-slate-400'}`}>
                              {notif.title}
                            </h3>
                            <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-550 whitespace-nowrap">
                              {notif.time}
                            </span>
                          </div>
                          
                          <p className={`text-xs mt-0.5 leading-relaxed ${!notif.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-455 dark:text-slate-500'}`}>
                            {notif.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notif.id);
                              }}
                              className="flex items-center gap-1 text-[9px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 px-1.5 py-0.5 rounded transition-colors border-none cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              {lang === 'fr' ? 'Supprimer' : 'Delete'}
                            </button>
                            
                            {!notif.read && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRead(notif.id);
                                }}
                                className="text-[9px] font-bold text-indigo-650 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-1 py-0.5 bg-transparent border-none cursor-pointer"
                              >
                                {lang === 'fr' ? 'Marquer comme lu' : 'Mark as read'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
