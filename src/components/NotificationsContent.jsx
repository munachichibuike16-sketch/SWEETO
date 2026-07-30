import React, { useState } from 'react';
import { Bell, Package, Tag, AlertCircle, CheckCircle2, Trash2, X } from 'lucide-react';

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'order', title: 'Order #12345 Shipped!', message: 'Your package is on its way.', time: '2h ago', read: false },
  { id: 2, type: 'sale', title: 'Flash Sale Alert', message: 'Up to 50% off on electronics today!', time: '5h ago', read: false },
  { id: 3, type: 'update', title: 'Profile Updated', message: 'Your shipping address was successfully changed.', time: '1d ago', read: true },
  { id: 4, type: 'alert', title: 'Payment Failed', message: 'There was an issue with your last transaction.', time: '2d ago', read: false },
  { id: 5, type: 'order', title: 'Order #12340 Delivered', message: 'Thank you for shopping with us!', time: '3d ago', read: true },
];

export default function NotificationsContent({ onProductClick }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const toggleRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-blue-500" />;
      case 'sale': return <Tag className="text-purple-500" />;
      case 'alert': return <AlertCircle className="text-red-500" />;
      default: return <CheckCircle2 className="text-green-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-8 pt-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell className="w-6 h-6" /> Notifications
          </h1>
          <div className="flex items-center gap-3">
            <span className="bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
              {notifications.filter(n => !n.read).length} New
            </span>
            {notifications.length > 0 && (
              <button 
                onClick={clearAll}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors bg-white dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-red-200"
              >
                <X className="w-4 h-4" /> Clear All
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              <p>No new notifications.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  notif.read ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-900 shadow-sm'
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1">{getIcon(notif.type)}</div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-semibold ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notif.title}
                      </h3>
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notif.message}</p>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{notif.time}</span>
                      {!notif.read && (
                        <button 
                          onClick={() => toggleRead(notif.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
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
