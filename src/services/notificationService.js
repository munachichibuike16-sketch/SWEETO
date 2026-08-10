// src/services/notificationService.js
import { supabase } from '../lib/supabase';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.appState = AppState.currentState;
    this.unreadCount = 0;
    this.notifications = [];
    this.setupAppStateListener();
  }

  setupAppStateListener() {
    AppState.addEventListener('change', async (nextAppState) => {
      if (this.appState.match(/inactive|background/) && nextAppState === 'active') {
        await this.clearBadges();
        await this.markNotificationsAsRead();
        await this.fetchUnreadCount();
      }
      this.appState = nextAppState;
    });
  }

  // Clear badge count
  async clearBadges() {
    try {
      if (Platform.OS === 'ios') {
        const notifee = await import('@notifee/react-native');
        await notifee.default.setBadgeCount(0);
      } else {
        const PushNotification = await import('react-native-push-notification');
        PushNotification.default.setApplicationIconBadgeNumber(0);
      }
    } catch (error) {
      console.log('Error clearing badges:', error);
    }
  }

  // Create notification in database
  async createNotification({
    userId,
    orderId,
    productId,
    type,
    title,
    body,
    data = {},
    priority = 'normal',
    category = 'system'
  }) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          order_id: orderId,
          product_id: productId,
          type: type,
          title: title,
          body: body,
          data: data,
          priority: priority,
          category: category,
        })
        .select()
        .single();

      if (error) throw error;

      this.unreadCount += 1;
      this.emit('unreadCount', this.unreadCount);

      // Store locally
      await this.saveNotificationLocally(notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Create bulk notifications
  async createBulkNotifications(users, notificationData) {
    try {
      const notifications = users.map(userId => ({
        user_id: userId,
        ...notificationData
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) throw error;

      // Store locally
      for (const notification of data) {
        await this.saveNotificationLocally(notification);
      }

      return data;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      return null;
    }
  }

  // Fetch notifications
  async fetchNotifications({ limit = 20, offset = 0, type = null }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.notifications = data;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Fetch unread count
  async fetchUnreadCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      this.unreadCount = count || 0;
      this.emit('unreadCount', this.unreadCount);
      return this.unreadCount;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark as read
  async markAsRead(notificationId) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;

      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.emit('unreadCount', this.unreadCount);
      
      // Update local storage
      await this.updateLocalNotification(notificationId, { is_read: true });

      return data;
    } catch (error) {
      console.error('Error marking as read:', error);
      return null;
    }
  }

  // Mark all as read
  async markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      this.unreadCount = 0;
      this.emit('unreadCount', 0);
      
      // Update local storage
      await this.markAllLocalAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      await this.removeLocalNotification(notificationId);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Local storage methods
  async saveNotificationLocally(notification) {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      notifications.unshift({
        ...notification,
        received_at: new Date().toISOString(),
      });
      if (notifications.length > 100) notifications.pop();
      await AsyncStorage.setItem('@notifications', JSON.stringify(notifications));
      this.notifications = notifications;
    } catch (error) {
      console.error('Error saving locally:', error);
    }
  }

  async updateLocalNotification(id, updates) {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      if (!stored) return;
      const notifications = JSON.parse(stored);
      const updated = notifications.map(n => 
        n.id === id ? { ...n, ...updates } : n
      );
      await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
      this.notifications = updated;
    } catch (error) {
      console.error('Error updating local:', error);
    }
  }

  async markAllLocalAsRead() {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      if (!stored) return;
      const notifications = JSON.parse(stored);
      const updated = notifications.map(n => ({ ...n, is_read: true }));
      await AsyncStorage.setItem('@notifications', JSON.stringify(updated));
      this.notifications = updated;
    } catch (error) {
      console.error('Error marking all local as read:', error);
    }
  }

  async removeLocalNotification(id) {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      if (!stored) return;
      const notifications = JSON.parse(stored);
      const filtered = notifications.filter(n => n.id !== id);
      await AsyncStorage.setItem('@notifications', JSON.stringify(filtered));
      this.notifications = filtered;
    } catch (error) {
      console.error('Error removing local:', error);
    }
  }

  async getLocalNotifications() {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting local:', error);
      return [];
    }
  }

  async clearLocalNotifications() {
    try {
      await AsyncStorage.removeItem('@notifications');
      this.notifications = [];
    } catch (error) {
      console.error('Error clearing local:', error);
    }
  }
}

export default new NotificationService();
