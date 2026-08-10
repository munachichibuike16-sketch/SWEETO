// src/services/customerNotificationService.js
import notificationService from './notificationService';
import backgroundNotificationService from './backgroundNotificationService';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

class CustomerNotificationService {
  constructor() {
    this.notificationSound = 'default';
  }

  // 🛒 ORDER PLACED
  async notifyOrderPlaced(order, customer) {
    // 1. Database Notification
    await this.createOrderNotification(order, customer);

    // 2. In-App Floating Notification
    this.showInAppOrderNotification(order, customer);

    // 3. Background/Push Notification
    await this.sendBackgroundNotification(order, customer);

    // 4. Update badge count
    await notificationService.fetchUnreadCount();

    // 5. Emit event
    this.emitEvent('order_notification_sent', { orderId: order.id, customerId: customer.id });
  }

  async createOrderNotification(order, customer) {
    const notificationData = {
      userId: customer.id,
      orderId: order.id,
      type: 'order_placed',
      title: '🛍️ Order Placed Successfully!',
      body: `Thank you for your order #${order.order_number}! We'll notify you when it's confirmed.`,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        itemCount: order.items?.length || 0,
        estimatedDelivery: this.getEstimatedDelivery(),
        status: 'pending',
      },
      priority: 'high',
      category: 'orders',
    };

    return await notificationService.createNotification(notificationData);
  }

  showInAppOrderNotification(order, customer) {
    const notification = {
      id: `order_${order.id}_${Date.now()}`,
      type: 'order_placed',
      title: '🎉 Order Confirmed!',
      subtitle: `Order #${order.order_number}`,
      body: `Thank you for your order! Total: $${order.total_amount.toFixed(2)}`,
      time: 'Just now',
      avatar: customer.avatar_url || this.getInitials(customer.full_name),
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
      },
      actions: [
        { id: 'view_order', title: 'View Order' },
        { id: 'track_order', title: 'Track' },
        { id: 'dismiss', title: 'Dismiss' },
      ],
      style: {
        backgroundColor: '#25D366',
        textColor: '#FFFFFF',
        icon: '🛍️',
        position: 'top',
        duration: 8000,
        priority: 'high',
      }
    };

    notificationService.emit('inAppNotification', notification);
    this.emitEvent('order_notification', notification);
  }

  async sendBackgroundNotification(order, customer) {
    const { data: user } = await supabase
      .from('users')
      .select('push_token, device_id')
      .eq('id', customer.id)
      .single();

    if (!user?.push_token) {
      console.log('No push token for customer');
      return;
    }

    await backgroundNotificationService.showSystemNotification({
      title: '🛍️ Order Confirmed!',
      body: `Your order #${order.order_number} has been placed. Total: $${order.total_amount.toFixed(2)}`,
      data: {
        type: 'order_placed',
        orderId: order.id,
        orderNumber: order.order_number,
        screen: 'OrderDetails',
      },
      channelId: 'orders',
      priority: 'high',
    });
  }

  // 🔄 ORDER STATUS UPDATE
  async notifyOrderStatusUpdate(order, customer, previousStatus) {
    const statusConfigs = {
      'confirmed': {
        title: '✅ Order Confirmed!',
        body: `Great news! Your order #${order.order_number} has been confirmed.`,
        icon: '✅',
        color: '#4CAF50',
      },
      'processing': {
        title: '🔄 Order Being Processed',
        body: `We're preparing your order #${order.order_number} for shipment.`,
        icon: '🔄',
        color: '#2196F3',
      },
      'shipped': {
        title: '🚚 Order Shipped!',
        body: `Your order #${order.order_number} is on its way! Track your delivery.`,
        icon: '🚚',
        color: '#FF9800',
        trackingAvailable: true,
      },
      'out_for_delivery': {
        title: '🚚 Out for Delivery!',
        body: `Your order #${order.order_number} is out for delivery today!`,
        icon: '🚚',
        color: '#9C27B0',
      },
      'delivered': {
        title: '📦 Order Delivered!',
        body: `Your order #${order.order_number} has been delivered. Enjoy!`,
        icon: '📦',
        color: '#4CAF50',
      },
      'cancelled': {
        title: '❌ Order Cancelled',
        body: `Your order #${order.order_number} has been cancelled.`,
        icon: '❌',
        color: '#F44336',
        priority: 'high',
      },
    };

    const config = statusConfigs[order.status] || {
      title: `📋 Order Updated`,
      body: `Your order #${order.order_number} has been updated to ${order.status}.`,
      icon: '📋',
      color: '#607D8B',
    };

    // Database notification
    await notificationService.createNotification({
      userId: customer.id,
      orderId: order.id,
      type: `order_${order.status}`,
      title: config.title,
      body: config.body,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        previousStatus: previousStatus,
        trackingNumber: order.tracking_number,
      },
      priority: config.priority || 'normal',
      category: 'orders',
    });

    // In-app notification
    notificationService.emit('inAppNotification', {
      title: config.title,
      body: config.body,
      data: { orderId: order.id, orderNumber: order.order_number, status: order.status },
    });

    // Background notification
    await backgroundNotificationService.showSystemNotification({
      title: config.title,
      body: config.body,
      data: {
        type: `order_${order.status}`,
        orderId: order.id,
        orderNumber: order.order_number,
        screen: 'OrderDetails',
      },
      channelId: 'orders',
      priority: config.priority || 'normal',
    });
  }

  // ⭐ DELIVERY UPDATE
  async notifyDeliveryUpdate(order, customer, location) {
    await notificationService.createNotification({
      userId: customer.id,
      orderId: order.id,
      type: 'delivery_update',
      title: '📍 Delivery Update',
      body: `Your package is currently at ${location.address}. ETA: ${location.eta || 'soon'}`,
      data: { orderId: order.id, orderNumber: order.order_number, location },
      priority: 'high',
      category: 'orders',
    });

    notificationService.emit('inAppNotification', {
      title: '📍 Delivery Update',
      body: `Package at ${location.address}`,
      data: { orderId: order.id, location },
    });
  }

  // 💳 PAYMENT SUCCESS
  async notifyPaymentSuccess(order, customer) {
    await notificationService.createNotification({
      userId: customer.id,
      orderId: order.id,
      type: 'payment_success',
      title: '💰 Payment Successful',
      body: `Payment of $${order.total_amount.toFixed(2)} for order #${order.order_number} was successful.`,
      data: { orderId: order.id, orderNumber: order.order_number, amount: order.total_amount },
      priority: 'high',
      category: 'orders',
    });
  }

  // 🏷️ SPECIAL OFFER
  async notifySpecialOffer(customer, offer) {
    await notificationService.createNotification({
      userId: customer.id,
      type: 'special_offer',
      title: `🎉 ${offer.title}`,
      body: offer.description,
      data: { offerId: offer.id, discountCode: offer.code, discount: offer.discount },
      priority: 'normal',
      category: 'promotions',
    });
  }

  // 🛒 ABANDONED CART
  async notifyAbandonedCart(customer, cartItems) {
    const itemCount = cartItems.length;
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);

    await notificationService.createNotification({
      userId: customer.id,
      type: 'abandoned_cart',
      title: '🛒 Did you forget something?',
      body: `You have ${itemCount} items in your cart totaling $${total.toFixed(2)}. Complete your order now!`,
      data: { cartItems, total, itemCount },
      priority: 'normal',
      category: 'promotions',
    });
  }

  // Helper methods
  getEstimatedDelivery() {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  emitEvent(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    window.dispatchEvent(customEvent);
  }
}

export default new CustomerNotificationService();
