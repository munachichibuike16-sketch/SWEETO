import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ArrowRight, Clock, CheckCheck, Filter, Sparkles, Zap } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import SweetoLogo from './SweetoLogo';

const NotificationsContent = ({ onProductClick }) => {
  const { products, settings, showToast } = useStore();
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [categoryFilter, setCategoryFilter] = useState('all'); // all, orders, promos, security
  
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

  // 🛍️ Order tracker notifications
  const orderUpdates = [
    {
      id: 'order-hp-probook',
      type: 'order_tracker',
      category: 'orders',
      title: lang === 'fr' ? 'Commande prête pour retrait 🏪' : 'Order ready for pickup 🏪',
      message: lang === 'fr' 
        ? 'Votre ordinateur HP ProBook est prêt à Adjamé Mirador !' 
        : 'Your HP ProBook is ready for pickup at Adjamé Mirador!',
      time: 'Il y a 10 min',
      isRead: isNotificationRead('order-hp-probook'),
      isDeleted: isNotificationDeleted('order-hp-probook'),
      actionLabel: lang === 'fr' ? 'Suivre ma commande >' : 'Track Order >',
      accentColor: '#22c55e', // Green
      icon: '📦',
      product: products.find(p => p.name.toLowerCase().includes('probook')) || products[0]
    },
    {
      id: 'order-standing-fan',
      type: 'order_tracker',
      category: 'orders',
      title: lang === 'fr' ? 'Livraison Express en cours 🚚' : 'Express Delivery on route 🚚',
      message: lang === 'fr' 
        ? 'Le coursier est en route vers Yopougon avec votre Standing Fan.' 
        : 'The courier is on route to Yopougon with your Standing Fan.',
      time: 'Il y a 1 heure',
      isRead: isNotificationRead('order-standing-fan'),
      isDeleted: isNotificationDeleted('order-standing-fan'),
      actionLabel: lang === 'fr' ? 'Suivre ma commande >' : 'Track Order >',
      accentColor: '#22c55e',
      icon: '🚚',
      product: products.find(p => p.name.toLowerCase().includes('fan') || p.name.toLowerCase().includes('ventilateur')) || products[1]
    }
  ];

  // 🔥 Promos & Stock updates (based on active products)
  const promosAndStock = products.map(p => {
    const isNew = p.is_new_arrival;
    const isSale = p.original_price > p.price;
    if (!isNew && !isSale) return null;
    
    const id = `promo-${p.id}`;
    return {
      id,
      type: isNew ? 'new_arrival' : 'price_drop',
      category: 'promos',
      title: isNew 
        ? (lang === 'fr' ? `Nouveauté : ${p.name} ⚡` : `New Arrival: ${p.name} ⚡`)
        : (lang === 'fr' ? `Baisse de Prix : ${p.name} 🎉` : `Price Drop: ${p.name} 🎉`),
      message: isNew 
        ? (lang === 'fr' ? `Le tout nouveau ${p.category} vient d'arriver dans notre boutique.` : `The brand new ${p.category} has arrived in our boutique.`)
        : (lang === 'fr' ? `Grosse économie ! Le prix a baissé de ${Math.round((p.original_price - p.price) / p.original_price * 100)}% sur cet article.` : `Big savings! The price dropped by ${Math.round((p.original_price - p.price) / p.original_price * 100)}% on this item.`),
      time: isNew ? 'Il y a 3 heures' : 'Il y a 5 heures',
      isRead: isNotificationRead(id),
      isDeleted: isNotificationDeleted(id),
      accentColor: isNew ? '#3b82f6' : '#eab308', // Blue or Gold
      icon: isNew ? '⚡' : '🎉',
      product: p
    };
  }).filter(Boolean);

  // ⚙️ Account Security alerts
  const securityUpdates = [
    {
      id: 'sec-login',
      type: 'security',
      category: 'security',
      title: lang === 'fr' ? 'Connexion établie 🔐' : 'Secure Login Established 🔐',
      message: lang === 'fr' 
        ? 'Nouvelle connexion réussie détectée depuis Cocody (Abidjan).' 
        : 'Successful login detected from Cocody (Abidjan).',
      time: 'Il y a 6 heures',
      isRead: isNotificationRead('sec-login'),
      isDeleted: isNotificationDeleted('sec-login'),
      accentColor: '#64748b', // Gray
      icon: '👤',
      product: null
    },
    {
      id: 'sec-hub-updates',
      type: 'security',
      category: 'security',
      title: lang === 'fr' ? 'Hub de livraison mis à jour 🔐' : 'Delivery Hub Configured 🔐',
      message: lang === 'fr' 
        ? 'Les tarifs d\'expédition pour Adjamé Mirador ont été ajustés.' 
        : 'Shipping rates for Adjamé Mirador have been calibrated.',
      time: 'Il y a 1 jour',
      isRead: isNotificationRead('sec-hub-updates'),
      isDeleted: isNotificationDeleted('sec-hub-updates'),
      accentColor: '#64748b',
      icon: '🔐',
      product: null
    }
  ];

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

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-8 max-w-4xl mx-auto overflow-hidden pb-32">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-amber-500/5 blur-3xl rounded-full" />
      <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-eas-blue/5 blur-3xl rounded-full" />

      {/* Global Management Header */}
      <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 px-6 py-2 rounded-full mb-6 shadow-sm"
          >
            <Bell size={18} className="text-amber-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">NOTIFICATIONS_CENTER</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">
            Your <span className="text-eas-blue underline decoration-amber-500/30">Activity</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {filteredNotifs.some(n => !n.isRead) && (
            <button 
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-eas-blue hover:text-eas-blue/80 transition-colors bg-eas-blue/5 dark:bg-eas-blue/10 px-4 py-2.5 rounded-xl border border-eas-blue/20"
            >
              <CheckCheck size={14} />
              <span>{lang === 'fr' ? 'Tout lire' : 'Mark all read'}</span>
            </button>
          )}

          {filteredNotifs.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="flex items-center justify-center p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800/80 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border border-slate-100 dark:border-white/5"
              title={lang === 'fr' ? "Effacer l'historique" : "Clear history"}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category grouping tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-2xl border border-slate-100 dark:border-white/5 w-full md:w-auto">
        {[
          { id: 'all', label: lang === 'fr' ? '🌐 Tout' : '🌐 All', count: allNotifications.length },
          { id: 'orders', label: lang === 'fr' ? '🛍️ Commandes' : '🛍️ Orders', count: allNotifications.filter(n => n.category === 'orders').length },
          { id: 'promos', label: lang === 'fr' ? '🔥 Promos' : '🔥 Promos', count: allNotifications.filter(n => n.category === 'promos').length },
          { id: 'security', label: lang === 'fr' ? '⚙️ Sécurité' : '⚙️ Security', count: allNotifications.filter(n => n.category === 'security').length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 ${
              categoryFilter === tab.id 
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 bg-white/50 dark:bg-slate-800/30 border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                categoryFilter === tab.id 
                  ? 'bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Read Status Filters */}
      <div className="flex items-center gap-2 mb-8 bg-white dark:bg-slate-850 p-1.5 rounded-xl border border-slate-100 dark:border-white/5 w-fit">
        {[
          { id: 'all', label: lang === 'fr' ? 'Tous' : 'All' },
          { id: 'unread', label: lang === 'fr' ? 'Non lus' : 'Unread' },
          { id: 'read', label: lang === 'fr' ? 'Lus' : 'Read' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setFilter(btn.id)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              filter === btn.id 
                ? 'bg-eas-blue text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-650 dark:hover:text-slate-200'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Swipeable Notifications Feed */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((notif, index) => (
              <div key={notif.id} className="relative overflow-hidden rounded-3xl group">
                
                {/* Swipe Action Background Indicator */}
                <div className="absolute inset-0 bg-red-500 rounded-3xl flex items-center justify-end px-6 text-white font-black text-xs uppercase tracking-widest pointer-events-none z-0">
                  <div className="flex items-center gap-2">
                    <span>{lang === 'fr' ? 'Fermer' : 'Dismiss'}</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                </div>

                {/* Main Notification Card Item with horizontal swipe drag gesture */}
                <motion.div
                  layout
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: -140, right: 0 }}
                  dragElastic={{ left: 0.15, right: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.x < -80) {
                      handleDelete(notif.id);
                    }
                  }}
                  className={`relative z-10 flex items-center gap-4 p-5 rounded-3xl border transition-all duration-300 cursor-pointer select-none bg-white dark:bg-slate-800 ${
                    notif.isRead 
                      ? 'border-slate-100 dark:border-slate-700/50 opacity-80' 
                      : 'border-eas-blue/20 shadow-xl shadow-eas-blue/5'
                  } ${
                    !notif.isRead ? 'bg-blue-500/[0.04] dark:bg-blue-500/[0.02]' : ''
                  }`}
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: notif.isRead ? 'transparent' : notif.accentColor
                  }}
                  onClick={() => handleMarkAsRead(notif.id)}
                >
                  {/* Glowing unread dot indicator */}
                  {!notif.isRead && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-2 w-2 z-20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </div>
                  )}

                  {/* Thumbnail / Product image float */}
                  {notif.product ? (
                    <div className="relative w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner border border-slate-100 dark:border-slate-700/50 p-1 flex items-center justify-center">
                      <img src={notif.product.image_url} alt="" className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 rounded-md text-[10px] bg-slate-950/65 flex items-center justify-center text-white select-none">
                        {notif.icon}
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-inner border border-slate-100 dark:border-slate-700/50 select-none">
                      {notif.icon}
                    </div>
                  )}

                  {/* Content Stack */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`font-black truncate text-sm uppercase tracking-tight ${notif.isRead ? 'text-slate-650 dark:text-slate-350' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2 flex items-center gap-1">
                        <Clock size={10} />
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-normal pr-4">
                      {notif.message}
                    </p>

                    {/* Specifications Chips Tagging inside Promos */}
                    {notif.category === 'promos' && notif.product && (
                      <div className="flex gap-1 mt-2">
                        {getProductSpecs(notif.product).map((spec, i) => (
                          <span key={i} className="text-[8px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-900 text-slate-450 dark:text-slate-550 px-2 py-0.5 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Direct interactive order link inside Tracker card */}
                    {notif.actionLabel && (
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                          handleWhatsAppOrderTrack(notif);
                        }}
                        className="inline-block text-[10px] font-black uppercase tracking-wider text-green-600 dark:text-green-400 mt-2.5 hover:underline"
                      >
                        {notif.actionLabel}
                      </span>
                    )}
                  </div>

                  {/* Price Tagging / Jump button */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {notif.product && (
                      <span className={`text-xs font-black ${notif.category === 'promos' ? 'text-amber-500' : 'text-eas-blue'}`}>
                        {notif.product.price.toLocaleString()} {settings?.currency || 'FCFA'}
                      </span>
                    )}
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notif.id);
                        if (notif.product) {
                          onProductClick(notif.product);
                        } else if (notif.category === 'orders') {
                          handleWhatsAppOrderTrack(notif);
                        } else {
                          showToast(lang === 'fr' ? 'Alerte de sécurité validée ✓' : 'Security alert verified ✓', 'success');
                        }
                      }}
                      className={`p-2 rounded-xl transition-all ${
                        notif.isRead
                          ? 'bg-slate-50 dark:bg-slate-700/50 text-slate-400'
                          : 'bg-eas-blue text-white shadow-md shadow-eas-blue/15'
                      }`}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              </div>
            ))
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
