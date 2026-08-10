// src/services/backgroundNotificationService.js
import { supabase } from '../lib/supabase';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

class BackgroundNotificationService {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.setupBackgroundListeners();
  }

  setupBackgroundListeners() {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('📱 Background message:', remoteMessage);
      await this.handleBackgroundMessage(remoteMessage);
    });

    // Handle notification tap
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        console.log('🖱️ Notification pressed:', detail);
        await this.handleNotificationPress(detail);
      }
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('📱 Foreground message:', remoteMessage);
      await this.handleForegroundMessage(remoteMessage);
    });
  }

  async handleBackgroundMessage(remoteMessage) {
    const notification = remoteMessage.data || remoteMessage.notification;
    
    await this.saveNotificationToStorage(notification);
    await this.showSystemNotification({
      title: notification.title || 'New Notification',
      body: notification.body || 'You have a new notification',
      data: notification,
      channelId: notification.category || 'system',
      priority: notification.priority || 'high',
    });
    await this.updateBadgeCount();
    await this.storeNotificationInDatabase(notification);
  }

  async handleForegroundMessage(remoteMessage) {
    const notification = remoteMessage.data || remoteMessage.notification;
    
    // Show in-app notification
    this.showInAppNotification({
      title: notification.title,
      body: notification.body,
      data: notification,
    });

    // Also show in notification tray if high priority
    if (notification.priority === 'high') {
      await this.showSystemNotification({
        title: notification.title,
        body: notification.body,
        data: notification,
        channelId: notification.category || 'system',
        priority: 'high',
      });
    }
  }

  async showSystemNotification({ title, body, data, channelId = 'orders', priority = 'high' }) {
    // Create channel for Android
    if (Platform.OS === 'android') {
      await notifee.createChannel({
        id: channelId,
        name: this.getChannelName(channelId),
        importance: priority === 'high' ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
        vibration: true,
        sound: 'default',
        lights: true,
        bypassDnd: priority === 'high',
      });
    }

    const notificationId = await notifee.displayNotification({
      title: title,
      body: body,
      data: data,
      android: {
        channelId: channelId,
        priority: priority === 'high' ? 'high' : 'default',
        pressAction: { id: 'default', launchActivity: 'default' },
        actions: [
          { title: 'View', pressAction: { id: 'view' } },
          { title: 'Dismiss', pressAction: { id: 'dismiss' } },
        ],
        ongoing: false,
        autoCancel: true,
        badgeIconType: 'small',
        smallIcon: 'ic_notification',
        color: '#25D366',
        groupSummary: true,
      },
      ios: {
        sound: 'default',
        badge: true,
        foregroundPresentationOptions: {
          badge: true,
          sound: true,
          banner: true,
          list: true,
        },
      },
    });

    if (data) {
      data._notificationId = notificationId;
    }

    return notificationId;
  }

  showInAppNotification({ title, body, data }) {
    const event = new CustomEvent('inAppNotification', {
      detail: { title, body, data, timestamp: new Date().toISOString() },
    });
    window.dispatchEvent(event);
  }

  async saveNotificationToStorage(notification) {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      const notifications = stored ? JSON.parse(stored) : [];
      notifications.unshift({
        ...notification,
        received_at: new Date().toISOString(),
        is_read: false,
      });
      if (notifications.length > 100) notifications.pop();
      await AsyncStorage.setItem('@notifications', JSON.stringify(notifications));
      this.notifications = notifications;
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  async storeNotificationInDatabase(notification) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('notifications').insert({
        user_id: user.id,
        type: notification.type || 'system',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        category: notification.category || 'system',
        priority: notification.priority || 'normal',
      });
    } catch (error) {
      console.error('Error storing in database:', error);
    }
  }

  async updateBadgeCount() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      this.unreadCount = count || 0;

      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(this.unreadCount);
      }
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  }

  async handleNotificationPress(detail) {
    const { data } = detail.notification || {};
    
    if (data?.orderId) {
      this.navigateToOrder(data.orderId);
    } else if (data?.screen) {
      this.navigateToScreen(data.screen, data.params);
    }

    await this.markNotificationAsRead(detail.notification.id);
  }

  navigateToOrder(orderId) {
    const event = new CustomEvent('navigateToOrder', { detail: { orderId } });
    window.dispatchEvent(event);
  }

  navigateToScreen(screen, params) {
    const event = new CustomEvent('navigateToScreen', { detail: { screen, params } });
    window.dispatchEvent(event);
  }

  async markNotificationAsRead(notificationId) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      this.unreadCount = Math.max(0, this.unreadCount - 1);
      await this.updateBadgeCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  getChannelName(channelId) {
    const channels = {
      'orders': 'Order Notifications',
      'inventory': 'Inventory Alerts',
      'promotions': 'Promotions & Offers',
      'system': 'System Notifications',
      'delivery': 'Delivery Updates',
    };
    return channels[channelId] || 'General Notifications';
  }

  async getStoredNotifications() {
    try {
      const stored = await AsyncStorage.getItem('@notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting stored:', error);
      return [];
    }
  }

  async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem('@notifications');
      this.notifications = [];
      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

export default new BackgroundNotificationService();
