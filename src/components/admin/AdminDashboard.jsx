// src/components/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Badge, Card, Avatar } from 'react-native-paper';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';
import notificationService from '../../services/notificationService';
import { supabase } from '../../lib/supabase';

export const AdminDashboard = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({
    pendingOrders: 0,
    lowStockProducts: 0,
    totalRevenue: 0,
    recentOrders: [],
  });

  const {
    unreadCount,
    latestNotifications,
    markNotificationAsRead,
    markAllAsRead,
    fetchNotifications,
  } = useRealtimeNotifications(user?.id, 'admin');

  useEffect(() => {
    getUser();
    fetchStatistics();
  }, []);

  const getUser = async () => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUser(user);
  };

  const fetchStatistics = async () => {
    if (!supabase) return;
    const { count: pendingOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: lowStock } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .lt('stock_quantity', 'low_stock_threshold');

    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`*, users:customer_id (id, full_name, email)`)
      .order('created_at', { ascending: false })
      .limit(10);

    setStatistics({
      pendingOrders: pendingOrders || 0,
      lowStockProducts: lowStock || 0,
      recentOrders: recentOrders || [],
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    await fetchNotifications({ limit: 20, offset: 0 });
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification) => {
    await markNotificationAsRead(notification.id);
    if (notification.type === 'new_order_admin' || notification.type === 'order_status_updated') {
      navigation.navigate('OrderDetails', { orderId: notification.data?.orderId });
    } else if (notification.type === 'low_stock') {
      navigation.navigate('InventoryManagement');
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.is_read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Avatar.Icon 
          size={40} 
          icon={getNotificationIcon(item.type)}
          style={{ backgroundColor: getNotificationColor(item.type) }}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleTimeString()}
        </Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const getNotificationIcon = (type) => {
    const icons = {
      'new_order_admin': 'shopping-bag',
      'order_status_updated': 'truck-fast',
      'low_stock': 'alert-circle',
      'payment_confirmed': 'cash',
      'product_created': 'plus-circle',
      'system': 'bell',
    };
    return icons[type] || 'bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'new_order_admin': '#4CAF50',
      'order_status_updated': '#2196F3',
      'low_stock': '#F44336',
      'payment_confirmed': '#FF9800',
      'product_created': '#9C27B0',
      'system': '#607D8B',
    };
    return colors[type] || '#607D8B';
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome Admin 👋</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBell}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Avatar.Icon size={45} icon="bell" style={{ backgroundColor: '#f0f0f0' }} color="#333" />
          {unreadCount > 0 && (
            <View style={styles.badgeContainer}>
              <Badge style={styles.badge}>{unreadCount}</Badge>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Pending Orders</Text>
            <Text style={styles.statNumber}>{statistics.pendingOrders}</Text>
          </Card.Content>
        </Card>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statLabel}>Low Stock Items</Text>
            <Text style={styles.statNumber}>{statistics.lowStockProducts}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.quickActions}>
        {[
          { icon: 'plus', label: 'New Order', screen: 'NewOrder' },
          { icon: 'package', label: 'Products', screen: 'Products' },
          { icon: 'account-group', label: 'Customers', screen: 'Customers' },
          { icon: 'chart-line', label: 'Analytics', screen: 'Analytics' },
        ].map((action, index) => (
          <TouchableOpacity
            key={index}
            style={styles.actionButton}
            onPress={() => navigation.navigate(action.screen)}
          >
            <Avatar.Icon size={40} icon={action.icon} style={styles.actionIcon} />
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {statistics.recentOrders.map((order) => (
          <Card key={order.id} style={styles.orderCard}>
            <Card.Content>
              <View style={styles.orderRow}>
                <View>
                  <Text style={styles.orderNumber}>#{order.order_number}</Text>
                  <Text style={styles.orderCustomer}>{order.users?.full_name || 'Customer'}</Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>${order.total_amount}</Text>
                  <View style={[styles.orderStatus, getStatusStyle(order.status)]}>
                    <Text style={styles.orderStatusText}>{order.status}</Text>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </View>

      {latestNotifications.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead}>
                <Text style={styles.markRead}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={latestNotifications.slice(0, 5)}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      )}
    </ScrollView>
  );
};

const getStatusStyle = (status) => {
  const styles = {
    pending: { backgroundColor: '#FFF3E0' },
    confirmed: { backgroundColor: '#E8F5E9' },
    processing: { backgroundColor: '#E3F2FD' },
    shipped: { backgroundColor: '#FFF3E0' },
    delivered: { backgroundColor: '#E8F5E9' },
    cancelled: { backgroundColor: '#FFEBEE' },
  };
  return styles[status] || {};
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  notificationBell: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  badge: {
    backgroundColor: '#F44336',
    fontSize: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    borderRadius: 10,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    backgroundColor: '#f0f0f0',
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#25D366',
    fontSize: 14,
  },
  markRead: {
    color: '#25D366',
    fontSize: 14,
  },
  orderCard: {
    marginBottom: 8,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  orderStatusText: {
    fontSize: 11,
    color: '#333',
    textTransform: 'capitalize',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  unreadNotification: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#25D366',
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notificationBody: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
    marginLeft: 8,
  },
});
export default AdminDashboard;
