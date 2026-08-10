// src/components/NotificationDrawer.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const NotificationDrawer = ({ visible, onClose, navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (visible) {
      loadNotifications();
      fetchUnreadCount();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      // Load from local storage
      const stored = await AsyncStorage.getItem('@notifications');
      const localNotifications = stored ? JSON.parse(stored) : [];

      // Load from database
      const { data: dbNotifications } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      // Merge and deduplicate
      const allNotifications = [...localNotifications, ...(dbNotifications || [])];
      const uniqueNotifications = allNotifications.filter(
        (item, index, self) => 
          index === self.findIndex((t) => t.id === item.id)
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      // Update local state
      setNotifications(prev =>
        prev.map(n => 
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );

      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate based on notification type
      if (notification.type === 'order_placed' || notification.type?.includes('order')) {
        const orderId = notification.data?.orderId || notification.order_id;
        if (orderId) {
          navigation.navigate('OrderDetails', { orderId });
          onClose();
        }
      } else if (notification.type === 'low_stock') {
        navigation.navigate('Inventory');
        onClose();
      }
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadItem,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>
          {item.type?.includes('order') ? '📦' :
           item.type === 'low_stock' ? '⚠️' :
           item.type === 'payment_success' || item.type === 'payment_confirmed' ? '💰' :
           item.type === 'delivery_update' ? '🚚' : '🔔'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>
            {new Date(item.created_at || item.received_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>

        {item.type === 'order_placed' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleNotificationPress(item)}
            >
              <Text style={styles.actionText}>View Order</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => {
                navigation.navigate('TrackOrder', { orderId: item.data?.orderId });
                onClose();
              }}
            >
              <Text style={styles.actionTextSecondary}>Track</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔕</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyText}>
        You're all caught up! New notifications will appear here.
      </Text>
    </View>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={async () => {
              await AsyncStorage.removeItem('@notifications');
              await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('is_read', false);
              loadNotifications();
              setUnreadCount(0);
            }}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item, index) => item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await loadNotifications();
                await fetchUnreadCount();
                setRefreshing(false);
              }}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#25D366',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    ...Platform.select({
      ios: { paddingTop: 44 },
    }),
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  badgeContainer: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#25D366',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  time: {
    fontSize: 11,
    color: '#999',
    marginLeft: 8,
  },
  body: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#25D366',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextSecondary: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
    marginLeft: 8,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
export default NotificationDrawer;
