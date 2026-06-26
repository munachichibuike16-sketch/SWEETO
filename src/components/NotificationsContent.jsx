import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Clock, CheckCheck, Filter, Sparkles, Zap, ChevronLeft, CheckSquare, Settings, Shield, Truck, Gift, X } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import SweetoLogo from './SweetoLogo';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const NotificationsContent = ({ onProductClick }) => {
  const navigate = useNavigate();
  const { products = [], settings, showToast } = useStore();
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, orders, promos, security
  
  const [userOrders, setUserOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prefPromos, setPrefPromos] = useState(() => localStorage.getItem('pref_notif_promos') !== 'false');
  const [prefOrders, setPrefOrders] = useState(() => localStorage.getItem('pref_notif_orders') !== 'false');
  const [prefSystem, setPrefSystem] = useState(() => localStorage.getItem('pref_notif_system') !== 'false');
  const [prefSound, setPrefSound] = useState(() => localStorage.getItem('pref_notif_sound') !== 'false');
  const [prefVib, setPrefVib] = useState(() => localStorage.getItem('pref_notif_vib') !== 'false');

  const savePreferences = (key, val, setter) => {
    setter(val);
    localStorage.setItem(key, String(val));
    
    // Simulate haptic feedback if enabled
    if (prefVib && window.navigator.vibrate) {
      window.navigator.vibrate(40);
    }
    // Simulate tone if enabled
    if (prefSound) {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.08);
      } catch (e) {}
    }

    showToast(lang === 'fr' ? 'Préférences enregistrées ✓' : 'Preferences saved ✓', 'success');
  };



  // Fetch real-time orders linked to the logged-in user
  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      if (session) {
        setCurrentUser(session);
        fetchUserOrders(session);
      }
    } catch (e) {
      console.warn('Failed to parse session:', e);
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
    try {
      const saved = localStorage.getItem('read_notifications_timed');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [deletedNotifs, setDeletedNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem('deleted_notifications');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
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
    const foundProduct = firstItemName 
      ? (products || []).find(p => (p.name || '').toLowerCase().includes(firstItemName.toLowerCase())) 
      : null;
    const product = foundProduct || (products || [])[0] || null;

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
    const newArrivalProducts = (products || []).filter(p => p.is_new_arrival);
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
        const product = (products || []).find(p => p.id === n.productId) || null;
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
      // Filter out disabled notification categories based on user preferences
      if (n.category === 'orders' && !prefOrders) return false;
      if (n.category === 'promos' && !prefPromos) return false;
      if (n.category === 'security' && !prefSystem) return false;

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

  // Calculate unread counts per category
  const ordersUnread = allNotifications.filter(n => n.category === 'orders' && !n.isRead).length;
  const promosUnread = allNotifications.filter(n => n.category === 'promos' && !n.isRead).length;
  const securityUnread = allNotifications.filter(n => n.category === 'security' && !n.isRead).length;

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
      
      let legacy = [];
      try {
        legacy = JSON.parse(localStorage.getItem('read_notifications') || '[]');
      } catch (e) {}
      if (Array.isArray(legacy) && !legacy.includes(id)) {
        legacy.push(id);
        localStorage.setItem('read_notifications', JSON.stringify(legacy));
      }
    }
  };

  const handleMarkAllRead = () => {
    const updated = { ...readNotifs };
    let legacy = [];
    try {
      legacy = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch (e) {}
    if (!Array.isArray(legacy)) legacy = [];
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
              ? 'border-slate-100 dark:border-slate-800/40 opacity-75 hover:opacity-100 hover:border-slate-200 dark:hover:border-slate-700/60' 
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
            {notif.product && notif.product.price !== undefined && notif.product.price !== null && (
              <span className={`text-[13px] font-black sm:mb-2 ${notif.category === 'promos' ? 'text-amber-500 dark:text-amber-400' : 'text-eas-blue dark:text-blue-400'}`}>
                {(Number(notif.product.price) || 0).toLocaleString()} {settings?.currency || 'FCFA'}
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
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* 1. UP HEADER (Top Bar) - Sticky, fixed at top-0 */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/60 h-14 flex items-center px-4 justify-between shadow-sm">
        {/* Left: Back Button */}
        <button 
          onClick={goBack} 
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer animate-none"
          aria-label="Back"
        >
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>

        {/* Center: Title */}
        <h1 className="font-extrabold text-[15px] uppercase tracking-wide text-slate-800 dark:text-white">
          {lang === 'fr' ? 'Centre de messages' : 'Message Center'}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mark all as read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={lang === 'fr' ? 'Tout marquer comme lu' : 'Mark all as read'}
            >
              <CheckCheck size={18} />
            </button>
          )}
          
          {/* Settings gear */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={lang === 'fr' ? 'Paramètres' : 'Settings'}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area - padded to clear the sticky top-0 header (h-14) */}
      <div className="max-w-xl mx-auto px-4 pt-20 pb-32">

        {/* 2. CATEGORY FILTERS (Circular buttons) */}
        <div className="grid grid-cols-3 gap-3 mb-6 mt-2">
          {/* Logistics / Orders */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'orders' ? 'all' : 'orders')}
            className={`relative py-4 px-2 rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 bg-white dark:bg-slate-900 border cursor-pointer ${
              categoryFilter === 'orders'
                ? 'border-blue-500 shadow-md scale-[1.02] bg-blue-50/5 dark:bg-blue-950/10'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white mb-2 shadow-md shadow-blue-500/20">
              <Truck size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center truncate w-full select-none">
              {lang === 'fr' ? 'Logistique' : 'Logistics'}
            </span>
            {ordersUnread > 0 && (
              <span className="absolute top-2.5 right-2.5 bg-[#ff3b30] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 select-none">
                {ordersUnread}
              </span>
            )}
          </button>

          {/* Promotions / Offers */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'promos' ? 'all' : 'promos')}
            className={`relative py-4 px-2 rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 bg-white dark:bg-slate-900 border cursor-pointer ${
              categoryFilter === 'promos'
                ? 'border-amber-500 shadow-md scale-[1.02] bg-amber-50/5 dark:bg-amber-950/10'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center text-white mb-2 shadow-md shadow-amber-500/20">
              <Gift size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center truncate w-full select-none">
              {lang === 'fr' ? 'Promotions' : 'Promotions'}
            </span>
            {promosUnread > 0 && (
              <span className="absolute top-2.5 right-2.5 bg-[#ff3b30] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 select-none">
                {promosUnread}
              </span>
            )}
          </button>

          {/* Security / System */}
          <button
            onClick={() => setCategoryFilter(categoryFilter === 'security' ? 'all' : 'security')}
            className={`relative py-4 px-2 rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 bg-white dark:bg-slate-900 border cursor-pointer ${
              categoryFilter === 'security'
                ? 'border-[#ff3b30] shadow-md scale-[1.02] bg-red-50/5 dark:bg-red-950/10'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-[#ff3b30] flex items-center justify-center text-white mb-2 shadow-md shadow-red-500/20">
              <Shield size={18} />
            </div>
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 text-center truncate w-full select-none">
              {lang === 'fr' ? 'Système' : 'System'}
            </span>
            {securityUnread > 0 && (
              <span className="absolute top-2.5 right-2.5 bg-[#ff3b30] text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white dark:border-slate-900 select-none">
                {securityUnread}
              </span>
            )}
          </button>
        </div>

        {/* 3. INLINE SUB-TABS (All vs Unread selector & options) */}
        <div className="flex items-center justify-between gap-4 px-1 mb-5">
          <div className="flex items-center gap-1.5 bg-slate-200 dark:bg-slate-900/80 p-0.5 rounded-full">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all select-none cursor-pointer ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-450 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              {lang === 'fr' ? 'Tout' : 'All'}
            </button>

            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 select-none cursor-pointer ${
                filter === 'unread'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-450 dark:text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{lang === 'fr' ? 'Non lus' : 'Unread'}</span>
              {unreadCount > 0 && (
                <span className="bg-[#ff3b30] text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full leading-none select-none">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Inbox History Clean button */}
          {filteredNotifs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-[9px] font-black tracking-widest text-slate-400 hover:text-red-500 dark:text-slate-500 transition-colors uppercase select-none cursor-pointer"
            >
              {lang === 'fr' ? 'Effacer tout' : 'Clear all'}
            </button>
          )}
        </div>

        {/* 4. NOTIFICATIONS LIST */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifs.length > 0 ? (
              <div className="space-y-6">
                {/* Unread section */}
                {unreadNotifs.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 px-1">
                      {lang === 'fr' ? 'NOUVEAU' : 'NEW'}
                    </h4>
                    <div className="space-y-3.5">
                      {unreadNotifs.map(renderNotificationCard)}
                    </div>
                  </div>
                )}

                {/* Read section */}
                {readNotifsList.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-550 px-1 mt-4">
                      {lang === 'fr' ? 'PLUS ANCIENS' : 'OLDER'}
                    </h4>
                    <div className="space-y-3.5">
                      {readNotifsList.map(renderNotificationCard)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Watermarked Empty state */
              <motion.div 
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center p-6"
              >
                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 shadow-sm mb-5">
                  <Bell size={24} />
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-550 mt-1 max-w-[200px] leading-relaxed">
                  {lang === 'fr' 
                    ? 'Vous serez averti ici lorsqu\'il y aura des mises à jour.' 
                    : 'We will notify you here when updates are available.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 5. SETTINGS DRAWER */}
      <AnimatePresence>
        {isSettingsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="fixed inset-0 bg-black/60 z-[998] cursor-pointer"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 rounded-t-[32px] border-t border-slate-100 dark:border-slate-800 p-6 z-[999] shadow-2xl pb-10"
            >
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[15px] font-black uppercase tracking-wide text-slate-900 dark:text-white">
                  {lang === 'fr' ? 'Paramètres Notifications' : 'Notification Settings'}
                </h3>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Logistics */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {lang === 'fr' ? 'Suivi de commande' : 'Order Tracking'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      {lang === 'fr' ? 'Alertes de livraison et de préparation' : 'Shipment updates & preparation details'}
                    </p>
                  </div>
                  <button
                    onClick={() => savePreferences('pref_notif_orders', !prefOrders, setPrefOrders)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                      prefOrders ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Promotions */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {lang === 'fr' ? 'Offres & Promotions' : 'Promotions & Offers'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      {lang === 'fr' ? 'Nouveaux arrivages, coupons, baisses de prix' : 'New arrivals, price drops, and store offers'}
                    </p>
                  </div>
                  <button
                    onClick={() => savePreferences('pref_notif_promos', !prefPromos, setPrefPromos)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                      prefPromos ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* System */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {lang === 'fr' ? 'Alertes de sécurité' : 'Security Alerts'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      {lang === 'fr' ? 'Sécurité de compte, modifications importantes' : 'Account security & critical system changes'}
                    </p>
                  </div>
                  <button
                    onClick={() => savePreferences('pref_notif_system', !prefSystem, setPrefSystem)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                      prefSystem ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Sound */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {lang === 'fr' ? 'Effets sonores' : 'App Sounds'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      {lang === 'fr' ? 'Jouer un son lors des actions' : 'Play a subtle alert tone on operations'}
                    </p>
                  </div>
                  <button
                    onClick={() => savePreferences('pref_notif_sound', !prefSound, setPrefSound)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                      prefSound ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Vibration */}
                <div className="flex items-center justify-between">
                  <div className="pr-4">
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                      {lang === 'fr' ? 'Haptique (Vibration)' : 'Haptic Feedback'}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-normal">
                      {lang === 'fr' ? 'Simuler les retours haptiques' : 'Simulate physical device vibration on touch'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      savePreferences('pref_notif_vib', !prefVib, setPrefVib);
                    }}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 flex items-center shrink-0 cursor-pointer ${
                      prefVib ? 'bg-blue-600 justify-end' : 'bg-slate-200 dark:bg-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
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

export default NotificationsContent;
