import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Clock, CheckCheck, Filter, Sparkles, Zap, ChevronLeft, CheckSquare } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import SweetoLogo from './SweetoLogo';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const NotificationsContent = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { products, settings, showToast } = useStore();
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, orders, promos, security
  
  const [userOrders, setUserOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);



  // Fetch real-time orders linked to the logged-in user
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setCurrentUser(session);
      fetchUserOrders(session);
    }
  }, []);

  const fetchUserOrders = async (user) => {
    try {
      if (!user) return;
      const queries = [];
      if (user.email) {
        queries.push(`customer_contact.ilike.%| ${user.email.toLowerCase()} |%`);
      }
      if (user.id) {
        queries.push(`customer_contact.ilike.%| ${user.id}%`);
      }
      const phoneVal = user.phoneNumber || user.phone;
      const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
      if (cleanPhone && cleanPhone.length >= 8) {
        queries.push(`customer_contact.ilike.${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.${phoneVal} |%`);
        queries.push(`customer_phone.eq.${phoneVal}`);
        queries.push(`customer_phone.eq.${cleanPhone}`);
      }
      if (queries.length === 0) return;
      const orQuery = queries.join(',');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(orQuery)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserOrders(data);
      }
    } catch (err) {
      console.error('Error fetching user orders for notifications:', err);
    }
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diff = Date.now() - new Date(timestamp).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === 'fr' ? "À l'instant" : 'Just now';
    if (mins < 60) return lang === 'fr' ? `Il y a ${mins} min` : `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === 'fr' ? `Il y a ${hours} heure${hours > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return lang === 'fr' ? `Il y a ${days} jour${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`;
  };
  
  const [readNotifs, setReadNotifs] = useState(() => {
    const saved = localStorage.getItem('read_notifications_timed');
    return saved ? JSON.parse(saved) : {};
  });

  const [deletedNotifs, setDeletedNotifs] = useState(() => {
    const saved = localStorage.getItem('deleted_notifications');
    return saved ? JSON.parse(saved) : {};
  });

  // Tick every 10 seconds to force-refresh the list for vanishing notifications
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isNotificationRead = (id) => {
    return !!readNotifs[id];
  };

  const isNotificationDeleted = (id) => {
    return !!deletedNotifs[id];
  };

  // Helper to dynamically get spec chips for products
  const getProductSpecs = (product) => {
    if (!product) return [];
    if (product.tags) {
      try {
        const parsed = typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 2);
      } catch (e) {}
    }
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    
    if (name.includes('tv') || cat.includes('tv')) {
      return ['Smart TV', '4K UHD'];
    }
    if (name.includes('tune') || name.includes('pro5') || name.includes('earbud') || name.includes('audio') || name.includes('jbl') || cat.includes('audio')) {
      return ['Bluetooth 5.3', 'ANC'];
    }
    if (name.includes('probook') || name.includes('laptop') || cat.includes('tech')) {
      return ['Intel i5/i7', 'SSD'];
    }
    return ['Authentique', 'Garantie'];
  };

  // Map actual user orders to tracker notifications
  const realOrderUpdates = userOrders.map(order => {
    let orderItems = [];
    try {
      orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    } catch (e) {}

    const firstItemName = orderItems[0]?.name || '';
    const product = products.find(p => p.name.toLowerCase().includes(firstItemName.toLowerCase())) || products[0];

    const stage = order.tracking_stage || 'assigned';
    const status = order.status || 'pending';

    let title = '';
    let message = '';
    let icon = '📦';

    if (status === 'completed' || stage === 'delivered') {
      title = lang === 'fr' ? 'Commande livrée ✓ 📦' : 'Order Delivered ✓ 📦';
      message = lang === 'fr' 
        ? `Votre commande #${order.id} a été livrée avec succès !`
        : `Your order #${order.id} has been successfully delivered!`;
      icon = '✅';
    } else if (status === 'shipping' || stage === 'on_the_way' || stage === 'nearby') {
      title = lang === 'fr' ? 'Livraison Express en cours 🚚' : 'Express Delivery on route 🚚';
      message = lang === 'fr'
        ? `Votre commande #${order.id} est en route pour la livraison.`
        : `Your order #${order.id} is on the way for delivery.`;
      icon = '🚚';
    } else if (status === 'confirmed' || stage === 'picked_up' || stage === 'assigned') {
      title = lang === 'fr' ? 'Commande préparée 🏪' : 'Order Prepared 🏪';
      message = lang === 'fr'
        ? `Votre commande #${order.id} est prête/confirmée.`
        : `Your order #${order.id} has been confirmed & prepared.`;
      icon = '📦';
    } else {
      title = lang === 'fr' ? 'Commande en attente 🕒' : 'Order Pending 🕒';
      message = lang === 'fr'
        ? `Votre commande #${order.id} est en attente de validation.`
        : `Your order #${order.id} is pending validation.`;
      icon = '🕒';
    }

    const id = `real-order-${order.id}`;

    return {
      id,
      type: 'order_tracker',
      category: 'orders',
      title,
      message,
      time: getRelativeTime(order.created_at),
      isRead: isNotificationRead(id),
      isDeleted: isNotificationDeleted(id),
      actionLabel: lang === 'fr' ? 'Suivre ma commande >' : 'Track Order >',
      accentColor: '#22c55e',
      icon,
      product,
      db_id: order.id
    };
  });

  // 🛍️ Order tracker notifications (only real orders)
  const orderUpdates = realOrderUpdates;

  // 🔥 Promos & Stock updates — merge database new arrivals + localStorage notifications
  const promosAndStock = (() => {
    const notifs = [];
    const seenIds = new Set();

    // Source 1: Products flagged as new arrivals in the database (same source as Header dropdown)
    const newArrivalProducts = products.filter(p => p.is_new_arrival);
    newArrivalProducts.forEach(p => {
      const id = `new-product-${p.id}`;
      if (seenIds.has(id)) return;
      seenIds.add(id);
      notifs.push({
        id,
        type: 'new_arrival',
        category: 'promos',
        title: `🆕 ${lang === 'fr' ? 'Nouveau' : 'New Arrival'}: ${p.name}`,
        message: lang === 'fr' 
          ? `Découvrez ${p.category || 'ce produit'} maintenant disponible en boutique !`
          : `Check out the new ${p.category || 'product'} now available in store!`,
        time: getRelativeTime(p.created_at),
        isRead: isNotificationRead(id),
        isDeleted: isNotificationDeleted(id),
        actionLabel: lang === 'fr' ? 'Voir le produit >' : 'View Product >',
        accentColor: '#f59e0b',
        icon: '🆕',
        product: p,
      });
    });

    // Source 2: localStorage persisted notifications (price drops + real-time detections)
    try {
      const stored = JSON.parse(localStorage.getItem('product_notifications') || '[]');
      stored.forEach(n => {
        if (seenIds.has(n.id)) return;
        seenIds.add(n.id);
        const product = products.find(p => p.id === n.productId) || null;
        notifs.push({
          id: n.id,
          type: n.type || 'promo',
          category: 'promos',
          title: n.title,
          message: n.message,
          time: getRelativeTime(n.timestamp),
          isRead: isNotificationRead(n.id),
          isDeleted: isNotificationDeleted(n.id),
          actionLabel: lang === 'fr' ? 'Voir le produit >' : 'View Product >',
          accentColor: n.accentColor || '#f59e0b',
          icon: n.type === 'price_drop' ? '🔥' : '🆕',
          product: product || (n.image_url ? { 
            id: n.productId, 
            name: n.productName || '', 
            image_url: n.image_url, 
            price: n.price || 0,
            category: n.productCategory || ''
          } : null),
        });
      });
    } catch (e) {
      console.warn('Failed to read product notifications:', e);
    }

    return notifs;
  })();

  // ⚙️ Account Security alerts (currently empty to avoid mock alerts)
  const securityUpdates = [];

  // Combine and filter notifications
  const allNotifications = [...orderUpdates, ...promosAndStock, ...securityUpdates]
    .filter(n => !n.isDeleted)
    .filter(n => {
      const readAt = readNotifs[n.id];
      if (readAt) {
        // Vanish read alerts after 10 minutes
        const tenMinutes = 10 * 60 * 1000;
        if (Date.now() - readAt > tenMinutes) {
          return false;
        }
      }
      return true;
    });

  // Category Filtering
  const categorizedNotifs = allNotifications.filter(n => {
    if (categoryFilter === 'all') return true;
    return n.category === categoryFilter;
  });

  // Read/Unread Filtering
  const filteredNotifs = categorizedNotifs.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const handleMarkAsRead = (id) => {
    if (!readNotifs[id]) {
      const updated = { ...readNotifs, [id]: Date.now() };
      setReadNotifs(updated);
      localStorage.setItem('read_notifications_timed', JSON.stringify(updated));
      
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
    filteredNotifs.forEach(n => {
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
    showToast(lang === 'fr' ? 'Toutes lues ✓' : 'All marked read ✓', 'success');
  };

  const handleDelete = (id) => {
    const updated = { ...deletedNotifs, [id]: true };
    setDeletedNotifs(updated);
    localStorage.setItem('deleted_notifications', JSON.stringify(updated));
    showToast(lang === 'fr' ? 'Notification supprimée 🗑️' : 'Notification dismissed 🗑️', 'info');
  };

  const handleClearHistory = () => {
    const updated = { ...deletedNotifs };
    filteredNotifs.forEach(n => {
      updated[n.id] = true;
    });
    setDeletedNotifs(updated);
    localStorage.setItem('deleted_notifications', JSON.stringify(updated));
    showToast(lang === 'fr' ? 'Historique effacé 🗑️' : 'Inbox history cleared 🗑️', 'success');
  };

  const handleWhatsAppOrderTrack = (notif) => {
    const phone = settings?.social_whatsapp ? settings.social_whatsapp.replace(/\D/g, '') : '2250500619923';
    const productName = notif.product ? notif.product.name : 'ma commande';
    const message = `Bonjour SWEETO-HUB, je souhaite suivre l'état de ma commande concernant "${productName}".`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const goBack = () => {
    navigate(-1);
  };

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const unreadNotifs = filteredNotifs.filter(n => !n.isRead);
  const readNotifsList = filteredNotifs.filter(n => n.isRead);

  const renderNotificationCard = (notif) => {
    return (
      <div key={notif.id} className="relative overflow-hidden rounded-[24px] group">
        {/* Swipe Action Background Indicator (for mobile swipe) */}
        <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/5 rounded-[24px] flex items-center justify-end px-6 text-red-500 font-extrabold text-[11px] uppercase tracking-widest pointer-events-none z-0">
          <div className="flex items-center gap-2">
            <span>{lang === 'fr' ? 'Supprimer' : 'Dismiss'}</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          layout
          drag="x"
          dragDirectionLock
          dragConstraints={{ left: -120, right: 0 }}
          dragElastic={{ left: 0.1, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x < -70) {
              handleDelete(notif.id);
            }
          }}
          className={`relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[24px] border transition-all duration-300 cursor-pointer bg-white/70 dark:bg-slate-900/60 backdrop-blur-md ${
            notif.isRead 
              ? 'border-slate-150 dark:border-slate-800/40 opacity-75 hover:opacity-100 hover:border-slate-200 dark:hover:border-slate-700/60' 
              : 'border-blue-500/20 dark:border-blue-400/20 shadow-[0_4px_25px_rgba(0,82,255,0.02)] dark:shadow-[0_4px_25px_rgba(0,0,0,0.2)] hover:border-blue-500/40 dark:hover:border-blue-400/40'
          }`}
          style={{
            borderLeftWidth: '5px',
            borderLeftColor: notif.isRead ? 'transparent' : notif.accentColor || '#0052ff'
          }}
          onClick={() => {
            handleMarkAsRead(notif.id);
            if (notif.product) {
              onProductClick(notif.product);
            } else if (notif.db_id) {
              navigate(`/order-tracking/${notif.db_id}`);
            }
          }}
        >
          {/* Unread Status Dot Indicator */}
          {!notif.isRead && (
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 z-20">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400 shadow-[0_0_8px_#0052ff]"></span>
            </div>
          )}

          {/* Product Thumbnail or Icon */}
          <div className="relative w-16 h-16 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow-sm">
            {notif.product ? (
              <img 
                src={notif.product.image_url || notif.product.image} 
                alt="" 
                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" 
              />
            ) : (
              <span className="text-2xl select-none">{notif.icon}</span>
            )}
            {notif.product && (
              <div className="absolute bottom-1 right-1 bg-slate-900/85 dark:bg-slate-950/85 w-5 h-5 rounded-lg flex items-center justify-center text-[10px] text-white select-none">
                {notif.icon}
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1.5">
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${notif.isRead ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                {notif.type === 'new_arrival' ? (lang === 'fr' ? 'Nouveau' : 'New') : (lang === 'fr' ? 'Alerte' : 'Alert')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Clock size={11} className="text-slate-300 dark:text-slate-600" />
                {notif.time}
              </span>
            </div>

            <h3 className={`font-extrabold text-sm uppercase tracking-tight mb-1 truncate ${notif.isRead ? 'text-slate-700 dark:text-slate-350' : 'text-slate-900 dark:text-white'}`}>
              {notif.title}
            </h3>
            
            <p className="text-xs font-bold text-slate-500 dark:text-slate-450 leading-relaxed pr-2">
              {notif.message}
            </p>

            {/* Specifications Badges */}
            {notif.category === 'promos' && notif.product && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {getProductSpecs(notif.product).map((spec, i) => (
                  <span key={i} className="text-[8px] font-extrabold uppercase tracking-wider bg-slate-100/80 dark:bg-slate-950/60 text-slate-550 dark:text-slate-400 px-2 py-0.5 rounded-[4px] border border-slate-200/20 dark:border-white/5">
                    {spec}
                  </span>
                ))}
              </div>
            )}

            {/* CTA action Label */}
            {notif.actionLabel && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(notif.id);
                  if (notif.product && notif.category === 'promos') {
                    onProductClick(notif.product);
                  } else if (notif.db_id) {
                    navigate(`/order-tracking/${notif.db_id}`);
                  } else {
                    handleWhatsAppOrderTrack(notif);
                  }
                }}
                className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400 mt-3.5 hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
              >
                {notif.actionLabel}
              </span>
            )}
          </div>

          {/* Right Price & Actions */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            {notif.product && (
              <span className={`text-[13px] font-black sm:mb-2 ${notif.category === 'promos' ? 'text-amber-500 dark:text-amber-400' : 'text-eas-blue dark:text-blue-400'}`}>
                {notif.product.price.toLocaleString()} {settings?.currency || 'FCFA'}
              </span>
            )}

            <div className="flex gap-2">
              {/* Mark Read button */}
              {!notif.isRead && (
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkAsRead(notif.id);
                  }}
                  className="w-8 h-8 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500 dark:hover:text-white border border-emerald-500/20 dark:border-emerald-500/30 transition-all cursor-pointer flex items-center justify-center"
                  title={lang === 'fr' ? 'Marquer comme lu' : 'Mark as read'}
                >
                  <CheckCheck size={15} />
                </button>
              )}

              {/* Action Button */}
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsRead(notif.id);
                  if (notif.product) {
                    onProductClick(notif.product);
                  } else if (notif.db_id) {
                    navigate(`/order-tracking/${notif.db_id}`);
                  } else if (notif.category === 'orders') {
                    handleWhatsAppOrderTrack(notif);
                  } else {
                    showToast(lang === 'fr' ? 'Alerte validée ✓' : 'Alert verified ✓', 'success');
                  }
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  notif.isRead
                    ? 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 border border-slate-100 dark:border-slate-800'
                    : 'bg-eas-blue text-white shadow-md shadow-eas-blue/15 hover:bg-blue-600 hover:shadow-lg'
                }`}
              >
                <ArrowRight size={15} />
              </button>

              {/* Quick Dismiss Button (Desktop convenience) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(notif.id);
                }}
                className="w-8 h-8 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-650 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white border border-red-500/20 dark:border-red-500/30 transition-all cursor-pointer flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100"
                title={lang === 'fr' ? 'Supprimer' : 'Dismiss'}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen px-4 pt-0 pb-32 md:px-8 max-w-5xl mx-auto">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-eas-blue/5 blur-3xl rounded-full" />

      {/* BRAND SUB-BAR: Fixed top, remains stationary below the global web header when scrolling */}
      <div className="fixed z-30 left-0 right-0 bg-eas-light/95 dark:bg-eas-dark/95 backdrop-blur-md border-b border-eas-blue/10 py-4 shadow-md dark:shadow-none" style={{ top: 'var(--header-height, 96px)' }}>
        <div className="max-w-5xl mx-auto flex flex-col gap-4 px-4 md:px-8">
          
          {/* Top Row: Back Button & Title */}
          <div className="flex items-center justify-between w-full">
            {/* Back Button: Cool & chilling rounded-xl custom back arrow with hover rotate/slide animation */}
            <button 
              onClick={goBack} 
              className="active-tap group w-10 h-10 rounded-xl border border-eas-blue/20 dark:border-eas-blue/15 bg-eas-blue/10 dark:bg-eas-blue/20 flex items-center justify-center text-eas-blue dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:border-eas-blue/40 hover:shadow-[0_0_15px_rgba(0,82,255,0.25)] hover:-rotate-12 transition-all duration-300 flex-shrink-0 cursor-pointer"
              aria-label="Retour"
            >
              <i className="fa-solid fa-arrow-left text-sm group-hover:-translate-x-0.5 transition-transform duration-300"></i>
            </button>

            {/* Center Pill Badge */}
            <div className="border border-eas-blue/20 bg-eas-blue/5 dark:bg-eas-blue/10 px-8 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(0,82,255,0.08)]">
              <Bell className="w-4 h-4 text-eas-blue dark:text-blue-400" />
              <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-eas-blue dark:text-blue-400">NOTIFICATIONS</span>
            </div>

            {/* Symmetric Spacer */}
            <div className="w-10 h-10 flex-shrink-0"></div>
          </div>

          {/* Bottom Row: Read Status Filters and Mark All Read */}
          <div className="flex items-center justify-between gap-4 px-1 w-full">
            {/* Left Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none ${
                  filter === 'all'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-150 dark:border-white/10'
                    : 'text-slate-450 dark:text-slate-450 bg-slate-100 dark:bg-slate-900/40 border border-transparent'
                }`}
              >
                {lang === 'fr' ? 'Tout' : 'All'}
              </button>

              <button
                onClick={() => setFilter('unread')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 select-none ${
                  filter === 'unread'
                    ? 'bg-white text-slate-950 shadow-sm border border-slate-150 dark:border-white/10'
                    : 'text-slate-450 dark:text-slate-450 bg-slate-100 dark:bg-slate-900/40 border border-transparent'
                }`}
              >
                <span>{lang === 'fr' ? 'Non lus' : 'Unread'}</span>
                {unreadCount > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    filter === 'unread'
                      ? 'bg-slate-950/10 text-slate-950 font-black'
                      : 'bg-eas-blue/20 text-eas-blue dark:text-blue-400 font-black'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Right Action Button */}
            {filteredNotifs.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-colors bg-transparent border-none select-none ${
                  unreadCount === 0
                    ? 'text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'
                    : 'text-eas-blue dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{lang === 'fr' ? 'TOUT MARQUER COMME LU' : 'MARK ALL AS READ'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer to push content down below the fixed sub-header */}
      <div className="h-[128px] md:h-[136px] mb-8"></div>

      {/* Swipeable Notifications Feed */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            <div className="space-y-8">
              {/* Unread section */}
              {unreadNotifs.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-450 dark:text-slate-500 px-1 mb-2">
                    {lang === 'fr' ? 'NOUVEAU' : 'NEW'}
                  </h4>
                  <div className="space-y-4">
                    {unreadNotifs.map(renderNotificationCard)}
                  </div>
                </div>
              )}

              {/* Read section */}
              {readNotifsList.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-450 dark:text-slate-550 px-1 mt-6 mb-2">
                    {lang === 'fr' ? 'PLUS ANCIENS' : 'OLDER'}
                  </h4>
                  <div className="space-y-4">
                    {readNotifsList.map(renderNotificationCard)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Watermarked Empty state */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-slate-50/50 dark:bg-slate-900/20 rounded-[2.5rem] border border-dashed border-slate-150 dark:border-slate-800 flex flex-col items-center justify-center p-8"
            >
              <div className="w-16 h-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-md mb-6 animate-bounce">
                <Bell size={28} />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase italic tracking-tighter mb-2">
                {lang === 'fr' ? 'Boîte de réception vide' : 'All caught up!'}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 italic max-w-xs leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                « Elite Local Commerce • Managed by @sweeto »
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default NotificationsContent;
