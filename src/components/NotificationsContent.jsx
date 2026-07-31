import React, { useState, useEffect } from 'react';
import { Bell, Package, AlertCircle, CheckCircle2, Trash2, X, Sparkles, CheckCheck } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsContent({ onProductClick }) {
  const navigate = useNavigate();
  const { products } = useStore();
  const { lang } = useLanguage();
  
  const [notifications, setNotifications] = useState([]);
  const [readNotifs, setReadNotifs] = useState([]);
  const [deletedNotifs, setDeletedNotifs] = useState({});

  useEffect(() => {
    // Load state from localStorage
    const storedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const storedDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');
    
    setReadNotifs(storedRead);
    setDeletedNotifs(storedDeleted);

    // Build notifications from new arrival products
    const newArrivals = (products || []).filter(p => p.is_new_arrival).map(p => ({
      id: `new-product-${p.id}`,
      type: 'sale',
      title: lang === 'fr' ? 'Nouveauté Exclusive' : 'Exclusive New Arrival',
      message: `${p.name} - ${lang === 'fr' ? 'Découvrez ce nouveau produit premium dès maintenant !' : 'Discover this premium new product right now!'}`,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : 'New',
      read: storedRead.includes(`new-product-${p.id}`),
      deleted: !!storedDeleted[`new-product-${p.id}`],
      originalProduct: p
    }));

    const systemNotifs = [
      { id: 'sys-1', type: 'order', title: lang === 'fr' ? 'Bienvenue sur SWEETO' : 'Welcome to SWEETO', message: lang === 'fr' ? 'Profitez d\\'une expérience d\\'achat premium.' : 'Enjoy a premium shopping experience with us.', time: lang === 'fr' ? 'À l\\'instant' : 'Just now', read: storedRead.includes('sys-1'), deleted: !!storedDeleted['sys-1'] }
    ];

    const combined = [...newArrivals, ...systemNotifs].filter(n => !n.deleted);
    setNotifications(combined);
  }, [products, lang]);

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
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-blue-500 w-6 h-6" />;
      case 'sale': return <Sparkles className="text-purple-500 w-6 h-6" />;
      case 'alert': return <AlertCircle className="text-red-500 w-6 h-6" />;
      default: return <CheckCircle2 className="text-green-500 w-6 h-6" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: { opacity: 0, x: -50, scale: 0.9, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#090d16] font-sans relative overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Background ambient glowing elements */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-900/20 dark:via-purple-900/10 pointer-events-none -z-10" />
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 dark:bg-purple-600/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24 pt-[env(safe-area-inset-top,0px)] sm:pt-6">
        
        {/* Modern Floating Header */}
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] sm:top-6 left-0 right-0 z-30 mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="bg-white/70 dark:bg-[#0f1423]/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] border border-white/50 dark:border-white/5 flex items-center justify-between px-6 py-4 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30">
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-[#0f1423] rounded-full flex items-center justify-center text-[9px] font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                  {lang === 'fr' ? 'Notifications' : 'Notifications'}
                </h1>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {unreadCount === 0 
                    ? (lang === 'fr' ? 'Tout est à jour' : 'All caught up') 
                    : (lang === 'fr' ? \`\${unreadCount} nouvelle(s)\` : \`\${unreadCount} new\`)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-full transition-colors flex items-center justify-center tooltip-trigger"
                  title={lang === 'fr' ? 'Tout marquer comme lu' : 'Mark all as read'}
                >
                  <CheckCheck className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={() => navigate(-1)}
                className="p-2 text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="pt-28 sm:pt-32">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center border border-gray-200 dark:border-gray-700/50">
                <Bell className="w-10 h-10 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'fr' ? "Aucune notification" : "No notifications yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-[250px]">
                {lang === 'fr' 
                  ? "Nous vous tiendrons au courant des nouveautés et des offres." 
                  : "We'll let you know when there's something new."}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AnimatePresence mode="popLayout">
                {notifications.map((notif) => (
                  <motion.div 
                    layout
                    key={notif.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    onClick={() => handleNotificationClick(notif)}
                    className={\`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer \${
                      notif.read 
                        ? 'bg-white dark:bg-[#121827] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10' 
                        : 'bg-white dark:bg-[#151c2e] border-indigo-100 dark:border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(79,70,229,0.1)]'
                    }\`}
                  >
                    {/* Glowing dot for unread */}
                    {!notif.read && (
                      <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse" />
                    )}

                    <div className="flex gap-4 sm:gap-5">
                      <div className="flex-shrink-0 mt-1">
                        {notif.originalProduct ? (
                          <div className="relative">
                            <img 
                              src={
                                notif.originalProduct.image_url ||
                                notif.originalProduct.image || 
                                (notif.originalProduct.images ? 
                                  (Array.isArray(notif.originalProduct.images) ? notif.originalProduct.images[0] : typeof notif.originalProduct.images === 'string' ? (notif.originalProduct.images.startsWith('[') ? JSON.parse(notif.originalProduct.images)[0] : notif.originalProduct.images.split(',')[0]) : '')
                                : '')
                              }
                              alt={notif.title}
                              className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-[14px] shadow-sm border border-gray-100 dark:border-white/10"
                            />
                            {!notif.read && (
                              <div className="absolute -inset-0.5 rounded-[16px] border border-indigo-500/30 pointer-events-none" />
                            )}
                          </div>
                        ) : (
                          <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${!notif.read ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-gray-50 dark:bg-gray-800'}\`}>
                            {getIcon(notif.type)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className={\`text-base font-semibold truncate \${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}\`}>
                            {notif.title}
                          </h3>
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap pt-1">
                            {notif.time}
                          </span>
                        </div>
                        
                        <p className={\`text-sm mt-1 leading-relaxed \${!notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}\`}>
                          {notif.message}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notif.id);
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-2 py-1 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'Supprimer' : 'Delete'}
                          </button>
                          
                          {!notif.read && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRead(notif.id);
                              }}
                              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 px-2 py-1 transition-colors"
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
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
