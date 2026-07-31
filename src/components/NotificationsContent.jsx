import React, { useState, useEffect } from 'react';
import { Bell, Package, Tag, AlertCircle, CheckCircle2, Trash2, X, Sparkles } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function NotificationsContent({ onProductClick }) {
  const navigate = useNavigate();
  const { products, settings } = useStore();
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
      type: 'sale', // New arrival maps to sale/tag icon
      title: lang === 'fr' ? 'Nouveauté' : 'New Arrival',
      message: `${p.name} - ${lang === 'fr' ? 'Découvrez ce nouveau produit !' : 'Check out this new product!'}`,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'New',
      read: storedRead.includes(`new-product-${p.id}`),
      deleted: !!storedDeleted[`new-product-${p.id}`],
      originalProduct: p
    }));

    // Optionally add some mock "System" notifications if empty, just so it doesn't look completely empty on first load if no new arrivals
    const systemNotifs = [
      { id: 'sys-1', type: 'order', title: 'Welcome to SWEETO-HUB', message: 'Enjoy premium electronics delivered to your door.', time: 'Just now', read: storedRead.includes('sys-1'), deleted: !!storedDeleted['sys-1'] }
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

  const clearAll = () => {
    const allIds = notifications.map(n => n.id);
    const newDeleted = { ...deletedNotifs };
    allIds.forEach(id => { newDeleted[id] = true; });
    
    setNotifications([]);
    setDeletedNotifs(newDeleted);
    updateGlobalState(readNotifs, newDeleted);
  };

  const handleNotificationClick = (notif) => {
    if (!notif.read) toggleRead(notif.id);
    if (notif.originalProduct && onProductClick) {
      onProductClick(notif.originalProduct);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-blue-500" />;
      case 'sale': return <Sparkles className="text-purple-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      default: return <CheckCircle2 className="text-green-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] font-sans relative">
      <div className="max-w-2xl mx-auto px-4 md:px-8 pb-20 pt-[env(safe-area-inset-top,0px)] md:pt-6">
        
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] md:top-6 left-0 right-0 z-30 mx-auto w-full max-w-2xl px-4 md:px-8">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-[2rem] shadow-sm border border-gray-100/50 dark:border-gray-800/50 flex items-center justify-between px-6 md:px-8 py-4 md:py-5 transition-all duration-300">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-6 h-6 md:w-7 md:h-7 text-indigo-600 fill-indigo-600 dark:text-indigo-500 dark:fill-indigo-500" /> Notifications
            </h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-28 md:pt-32">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <p>No new notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-1 ${
                  notif.read ? 'bg-white dark:bg-gray-900/50 border-gray-200 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-900/50 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 flex-shrink-0">
                    {notif.originalProduct ? (
                      <img 
                        src={
                          notif.originalProduct.image || 
                          (notif.originalProduct.images ? 
                            (Array.isArray(notif.originalProduct.images) ? notif.originalProduct.images[0] : typeof notif.originalProduct.images === 'string' ? (notif.originalProduct.images.startsWith('[') ? JSON.parse(notif.originalProduct.images)[0] : notif.originalProduct.images.split(',')[0]) : '')
                          : '')
                        }
                        alt={notif.title}
                        className="w-14 h-14 object-cover rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm"
                      />
                    ) : (
                      getIcon(notif.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-semibold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notif.title}
                      </h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{notif.time}</span>
                      {!notif.read && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRead(notif.id);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline z-10"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
