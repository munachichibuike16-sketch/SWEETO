// src/services/orderNotificationService.js
import notificationService from './notificationService';
import customerNotificationService from './customerNotificationService';
import { supabase } from '../lib/supabase';

class OrderNotificationService {
  // New Order (Admin)
  async notifyNewOrder(order) {
    const { data: customer } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', order.customer_id)
      .single();

    // Notify customer
    await customerNotificationService.notifyOrderPlaced(order, customer);

    // Notify admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      await notificationService.createBulkNotifications(
        admins.map(a => a.id),
        {
          order_id: order.id,
          type: 'new_order_admin',
          title: '📦 New Order Received!',
          body: `New order #${order.order_number} from ${customer?.full_name || 'Customer'}`,
          data: {
            orderId: order.id,
            orderNumber: order.order_number,
            customerId: order.customer_id,
          },
          priority: 'high',
          category: 'orders',
        }
      );
    }
  }

  // Order Status Updated
  async notifyOrderStatusUpdate(order, previousStatus) {
    const { data: customer } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', order.customer_id)
      .single();

    // Notify customer
    await customerNotificationService.notifyOrderStatusUpdate(order, customer, previousStatus);

    // Notify admins
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      await notificationService.createBulkNotifications(
        admins.map(a => a.id),
        {
          order_id: order.id,
          type: 'order_status_updated',
          title: `Order #${order.order_number} Status Updated`,
          body: `Order status changed to ${order.status}`,
          data: { orderId: order.id, orderNumber: order.order_number, status: order.status },
          priority: 'normal',
          category: 'orders',
        }
      );
    }
  }

  // Low Stock Alert
  async notifyLowStock(product) {
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    if (admins && admins.length > 0) {
      await notificationService.createBulkNotifications(
        admins.map(a => a.id),
        {
          product_id: product.id,
          type: 'low_stock',
          title: '⚠️ Low Stock Alert',
          body: `${product.name} is running low! Only ${product.stock_quantity} left.`,
          data: {
            productId: product.id,
            productName: product.name,
            stockQuantity: product.stock_quantity,
          },
          priority: 'high',
          category: 'inventory',
        }
      );
    }
  }

  // Back in Stock
  async notifyBackInStock(product, customers) {
    await notificationService.createBulkNotifications(
      customers.map(c => c.user_id),
      {
        product_id: product.id,
        type: 'back_in_stock',
        title: '🔄 Back in Stock!',
        body: `${product.name} is now back in stock. Hurry up!`,
        data: { productId: product.id, productName: product.name, price: product.price },
        priority: 'high',
        category: 'inventory',
      }
    );
  }

  // Payment Confirmed
  async notifyPaymentConfirmed(order) {
    const { data: customer } = await supabase
      .from('users')
      .select('id')
      .eq('id', order.customer_id)
      .single();

    await notificationService.createNotification({
      userId: order.customer_id,
      orderId: order.id,
      type: 'payment_confirmed',
      title: '💰 Payment Confirmed',
      body: `Payment for order #${order.order_number} has been confirmed.`,
      data: { orderId: order.id, orderNumber: order.order_number, amount: order.total_amount },
      priority: 'high',
      category: 'orders',
    });

    await customerNotificationService.notifyPaymentSuccess(order, customer);
  }
}

export default new OrderNotificationService();
