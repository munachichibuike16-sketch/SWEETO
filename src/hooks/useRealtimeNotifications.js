// src/hooks/useRealtimeNotifications.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import notificationService from '../services/notificationService';
import orderNotificationService from '../services/orderNotificationService';

export const useRealtimeNotifications = (userId, userRole = 'customer') => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotifications, setLatestNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch
    notificationService.fetchUnreadCount().then(setUnreadCount);

    // Listen for unread count changes
    notificationService.on('unreadCount', setUnreadCount);

    // Subscribe to notification changes
    const notificationChannel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new;
          setLatestNotifications(prev => [newNotification, ...prev].slice(0, 50));
          
          notificationService.emit('inAppNotification', {
            title: newNotification.title,
            body: newNotification.body,
            data: newNotification.data,
          });
        }
      )
      .subscribe();

    // Customer-specific subscriptions
    if (userRole === 'customer') {
      const orderChannel = supabase
        .channel('orders-customer')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${userId}`,
          },
          async (payload) => {
            const { new: order, old: previousOrder } = payload;
            if (order.status !== previousOrder.status) {
              await orderNotificationService.notifyOrderStatusUpdate(order, previousOrder.status);
            }
          }
        )
        .subscribe();

      return () => {
        notificationChannel.unsubscribe();
        orderChannel.unsubscribe();
        notificationService.removeAllListeners('unreadCount');
      };
    }

    // Admin-specific subscriptions
    if (userRole === 'admin') {
      const ordersChannel = supabase
        .channel('orders-admin')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          async (payload) => {
            await orderNotificationService.notifyNewOrder(payload.new);
          }
        )
        .subscribe();

      const inventoryChannel = supabase
        .channel('inventory-admin')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'products' },
          async (payload) => {
            const product = payload.new;
            if (product.stock_quantity <= product.low_stock_threshold) {
              await orderNotificationService.notifyLowStock(product);
            }
          }
        )
        .subscribe();

      return () => {
        notificationChannel.unsubscribe();
        ordersChannel.unsubscribe();
        inventoryChannel.unsubscribe();
        notificationService.removeAllListeners('unreadCount');
      };
    }

    return () => {
      notificationChannel.unsubscribe();
      notificationService.removeAllListeners('unreadCount');
    };
  }, [userId, userRole]);

  // Update online status
  useEffect(() => {
    if (!userId) return;

    const updateStatus = async (isOnline) => {
      await supabase
        .from('users')
        .update({ 
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId);
    };

    updateStatus(true);

    const handleVisibilityChange = async () => {
      await updateStatus(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  const markNotificationAsRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setUnreadCount(0);
  };

  return {
    unreadCount,
    latestNotifications,
    onlineUsers,
    markNotificationAsRead,
    markAllAsRead,
    fetchNotifications: notificationService.fetchNotifications.bind(notificationService),
  };
};
