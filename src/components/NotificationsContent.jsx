import React, { useState, useEffect } from 'react';
import { Bell, Package, AlertCircle, CheckCircle2, Trash2, X, Sparkles, CheckCheck, Truck, Clock, XCircle, User, Banknote, ShoppingBag, MessageCircle, Check, Copy, Download } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

export default function NotificationsContent({ onProductClick }) {
  const navigate = useNavigate();
  const { products, settings } = useStore();
  const { lang } = useLanguage();
  
  const [notifications, setNotifications] = useState([]);
  const [readNotifs, setReadNotifs] = useState([]);
  const [deletedNotifs, setDeletedNotifs] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getOrderItems = (order) => {
    try {
      const raw = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  };

  function formatCurrency(amount, currency = 'FCFA') {
    try {
      let isoCurrency = currency;
      if (currency === 'FCFA' || currency === 'CFA') {
        isoCurrency = 'XOF'; 
      }
      const formatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: isoCurrency }).format(amount || 0);
      if (currency === 'FCFA' || currency === 'CFA') {
        return formatted.replace('XOF', 'FCFA');
      }
      return formatted;
    } catch (e) {
      return `${Number(amount || 0).toLocaleString('fr-FR')} ${currency}`;
    }
  }

  const handleDownloadInvoice = (order) => {
    if (!order) return;
    const items = getOrderItems(order);
    const currency = settings?.currency || 'FCFA';
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) return;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture Commande #${order.id} - SWEETO</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1f7cf6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: 900; color: #1f7cf6; }
          .title { font-size: 20px; font-weight: bold; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          th { background: #f1f5f9; font-weight: bold; }
          .total-box { text-align: right; font-size: 16px; margin-top: 20px; }
          .total-price { font-size: 22px; font-weight: 900; color: #1f7cf6; }
          .btn { background: #1f7cf6; color: white; padding: 10px 20px; border-radius: 8px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px; }
          @media print { .btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">SWEETO</div>
            <p style="color:#64748b; font-size:12px; margin:4px 0 0 0;">Facture d'achat client</p>
          </div>
          <div style="text-align:right;">
            <div class="title">COMMANDE #ORD-${order.id}</div>
            <p style="color:#64748b; font-size:12px; margin:4px 0 0 0;">Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}</p>
            <p style="color:#10b981; font-size:12px; font-weight:bold; text-transform:uppercase; margin:4px 0 0 0;">Statut: ${order.status || 'Confirmée'}</p>
          </div>
        </div>
        <div class="details-grid">
          <div class="box">
            <h4 style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#64748b;">Client & Livraison</h4>
            <p style="margin:0; font-weight:bold;">${order.customer_name || 'Client'}</p>
            <p style="margin:4px 0; font-size:13px; color:#475569;">${order.address || ''}, ${order.city || 'Abidjan'}</p>
            <p style="margin:4px 0; font-size:13px; color:#475569;">Tél: ${order.customer_phone || 'N/A'}</p>
          </div>
          <div class="box">
            <h4 style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#64748b;">Paiement</h4>
            <p style="margin:0; font-weight:bold;">Paiement à la livraison / Mobile Money</p>
            <p style="margin:4px 0; font-size:13px; color:#475569;">Devise: ${currency}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Qté</th>
              <th>Prix Unitaire</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td style="font-weight:bold;">${item.name}</td>
                <td>${item.quantity || 1}</td>
                <td>${currency} ${Number(item.price || 0).toLocaleString()}</td>
                <td style="text-align:right; font-weight:bold;">${currency} ${Number((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total-box">
          <p style="margin:4px 0; color:#64748b;">Total de la commande :</p>
          <div class="total-price">${currency} ${Number(order.total_amount || order.total || 0).toLocaleString()}</div>
        </div>
        <div style="text-align:center; margin-top:40px;">
          <button class="btn" onclick="window.print()">Imprimer la Facture</button>
        </div>
      </body>
      </html>
    `;
    invoiceWindow.document.write(html);
    invoiceWindow.document.close();
  };

  useEffect(() => {
    // Load state from localStorage
    const storedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const storedDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');
    
    setReadNotifs(storedRead);
    setDeletedNotifs(storedDeleted);

    // Fetch user orders
    const fetchUserOrders = async () => {
      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      if (!session) return;
      
      try {
        const queries = [];
        if (session.email) queries.push(`customer_contact.ilike.%| ${session.email.toLowerCase()} |%`);
        if (session.id) queries.push(`customer_contact.ilike.%| ${session.id}%`);
        
        const phoneVal = session.phoneNumber || session.phone;
        const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
        if (cleanPhone && cleanPhone.length >= 8) {
          queries.push(`customer_contact.ilike.${cleanPhone} |%`);
          queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
          queries.push(`customer_contact.ilike.${phoneVal} |%`);
          queries.push(`customer_phone.eq.${phoneVal}`);
          queries.push(`customer_phone.eq.${cleanPhone}`);
        }

        if (queries.length > 0) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .or(queries.join(','))
            .order('created_at', { ascending: false });
            
          if (!error && data) {
            setOrders(data);
          }
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };
    
    fetchUserOrders();
  }, []);

  useEffect(() => {
    const storedRead = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    const storedDeleted = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');

    // Build notifications from new arrival products
    const newArrivals = (products || []).filter(p => p.is_new_arrival).map(p => ({
      id: `new-product-${p.id}`,
      type: 'sale',
      title: lang === 'fr' ? 'Nouveauté Exclusive' : 'Exclusive New Arrival',
      message: `${p.name} - ${lang === 'fr' ? 'Découvrez ce nouveau produit premium dès maintenant !' : 'Discover this premium new product right now!'}`,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : 'New',
      read: storedRead.includes(`new-product-${p.id}`),
      deleted: !!storedDeleted[`new-product-${p.id}`],
      originalProduct: p,
      sortTime: p.created_at ? new Date(p.created_at).getTime() : 0
    }));

    // Build order notifications
    const orderNotifs = orders.map(order => {
      const status = (order.status || 'pending').toLowerCase();
      let title = lang === 'fr' ? 'Mise à jour de commande' : 'Order Update';
      let message = '';
      let type = 'order_status';
      
      if (status === 'pending' || status === 'processing') {
        title = lang === 'fr' ? 'Commande Reçue' : 'Order Received';
        message = lang === 'fr' ? `Votre commande pour ${order.total_amount || order.total} FCFA est en cours de traitement.` : `Your order for ${order.total_amount || order.total} FCFA is being processed.`;
        type = 'processing';
      } else if (status === 'shipped' || status === 'shipping') {
        title = lang === 'fr' ? 'Commande Expédiée' : 'Order Shipped';
        message = lang === 'fr' ? `Bonne nouvelle ! Votre commande est en route.` : `Good news! Your order is on the way.`;
        type = 'shipped';
      } else if (status === 'delivered' || status === 'completed') {
        title = lang === 'fr' ? 'Commande Livrée' : 'Order Delivered';
        message = lang === 'fr' ? `Votre commande a été livrée avec succès.` : `Your order has been delivered successfully.`;
        type = 'delivered';
      } else if (status === 'cancelled') {
        title = lang === 'fr' ? 'Commande Annulée' : 'Order Cancelled';
        message = lang === 'fr' ? `Votre commande a été annulée.` : `Your order has been cancelled.`;
        type = 'alert';
      }

      return {
        id: `order-${order.id}-${status}`,
        type,
        title,
        message,
        orderId: order.id,
        time: order.created_at ? new Date(order.created_at).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' }) : 'Recent',
        read: storedRead.includes(`order-${order.id}-${status}`),
        deleted: !!storedDeleted[`order-${order.id}-${status}`],
        sortTime: order.created_at ? new Date(order.created_at).getTime() : 0
      };
    });

    const systemNotifs = [
      { id: 'sys-1', type: 'order', title: lang === 'fr' ? "Bienvenue sur SWEETO" : "Welcome to SWEETO", message: lang === 'fr' ? "Profitez d'une expérience d'achat premium." : "Enjoy a premium shopping experience with us.", time: lang === 'fr' ? "À l'instant" : "Just now", read: storedRead.includes('sys-1'), deleted: !!storedDeleted['sys-1'], sortTime: 9999999999999 }
    ];

    const combined = [...orderNotifs, ...newArrivals, ...systemNotifs].filter(n => !n.deleted).sort((a, b) => b.sortTime - a.sortTime);
    setNotifications(combined);
  }, [products, lang, orders]);

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
    } else if (notif.orderId) {
      const matchedOrder = orders.find(o => o.id === notif.orderId);
      if (matchedOrder) {
        setSelectedOrder(matchedOrder);
        setShowDetailsModal(true);
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="text-indigo-500 w-6 h-6" />;
      case 'processing': return <Clock className="text-amber-500 w-6 h-6" />;
      case 'shipped': return <Truck className="text-blue-500 w-6 h-6" />;
      case 'delivered': return <CheckCircle2 className="text-emerald-500 w-6 h-6" />;
      case 'sale': return <Sparkles className="text-[#1F6FEB] w-6 h-6" />;
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
    <div className="min-h-screen bg-[#F6F9FE] dark:bg-[#090d16] font-sans relative overflow-x-hidden selection:bg-blue-500/30">
      
      {/* Background ambient glowing elements */}
      <div className="fixed top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-900/20 dark:via-blue-900/10 pointer-events-none -z-10" />
      <div className="fixed top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-blue-600/10 dark:bg-blue-600/10 blur-[100px] pointer-events-none -z-10" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-24 pt-[env(safe-area-inset-top,0px)] sm:pt-6">
        
        {/* Modern Floating Header */}
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+1rem)] sm:top-6 left-0 right-0 z-30 mx-auto w-full max-w-2xl px-4 sm:px-6">
          <div className="bg-white/90 dark:bg-[#0f1423]/70 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)] border border-[#D9E3F2] dark:border-white/5 flex items-center justify-between px-6 py-4 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-[#1F6FEB] to-[#1554C0] text-white shadow-lg shadow-blue-500/30">
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
                    : (lang === 'fr' ? `${unreadCount} nouvelle(s)` : `${unreadCount} new`)}
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
                    className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                      notif.read 
                        ? 'bg-white dark:bg-[#121827] border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10' 
                        : 'bg-white dark:bg-[#151c2e] border-indigo-100 dark:border-indigo-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(79,70,229,0.1)]'
                    }`}
                  >
                    {/* Glowing dot for unread */}
                    {!notif.read && (
                      <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
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
                          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${!notif.read ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'bg-gray-50 dark:bg-gray-800'}`}>
                            {getIcon(notif.type)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className={`text-base font-semibold truncate ${!notif.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notif.title}
                          </h3>
                          <span className="text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap pt-1">
                            {notif.time}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 leading-relaxed ${!notif.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
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

      {/* Premium Stepper Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedOrder && (() => {
          const orderId = selectedOrder.id ? (String(selectedOrder.id).startsWith('ORD-') ? selectedOrder.id : `ORD-${selectedOrder.id}`) : 'ORD-00000';
          const customerName = selectedOrder.customer_name || 'Customer';
          const customerPhone = selectedOrder.customer_phone || '';
          const customerAddress = selectedOrder.address || (selectedOrder.city ? `${selectedOrder.city}, ${selectedOrder.address || ''}` : 'Address Provided');
          const currency = settings?.currency || 'FCFA';
          const totalAmount = selectedOrder.total_amount || selectedOrder.total || 0;
          const items = getOrderItems(selectedOrder);
          const itemCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          const formattedDate = new Date(selectedOrder.created_at || Date.now()).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          const handleCopyId = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(orderId);
          };

          const handleWhatsAppContact = (e) => {
            e.stopPropagation();
            const phone = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || "2250500619923";
            const text = encodeURIComponent(
              `Hello SWEETO-HUB, I would like to inquire about my order ${orderId} placed on ${formattedDate}. Total: ${currency} ${Number(totalAmount).toLocaleString()}`
            );
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
          };

          const getStatusStage = (status) => {
            const s = (status || '').toLowerCase();
            if (s === 'delivered' || s === 'completed') return 4;
            if (s === 'shipped' || s === 'shipping') return 3;
            if (s === 'confirmed' || s === 'processing') return 2;
            return 1; // pending/placed
          };

          const currentStage = getStatusStage(selectedOrder.status);
          const stages = [
            { num: 1, label: lang === 'fr' ? 'SAISIE' : 'PLACED' },
            { num: 2, label: lang === 'fr' ? 'CONFIRMÉ' : 'CONFIRMED' },
            { num: 3, label: lang === 'fr' ? 'EN ROUTE' : 'PROCESSING' },
            { num: 4, label: lang === 'fr' ? 'LIVRÉ' : 'DONE' }
          ];

          return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="bg-white dark:bg-[#0E172A] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto text-left"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

                <div className="px-6 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {orderId}
                      </h2>
                      <button
                        type="button"
                        onClick={handleCopyId}
                        className="p-1 rounded-md text-[#1F6FEB] hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer border-none"
                        title="Copy Order ID"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(selectedOrder)}
                        className="p-1 rounded-md text-slate-500 hover:text-indigo-650 hover:bg-[#1F6FEB]/10 dark:hover:bg-blue-900/30 transition-colors cursor-pointer border-none"
                        title="Download Invoice"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-550 mt-1 flex items-center gap-1.5 font-medium">
                      📅 {formattedDate}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        selectedOrder.status === 'cancelled' 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200/60' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/60'
                      }`}>
                        • {selectedOrder.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                  <div className="pt-2">
                    <div className="flex items-center justify-between relative px-2">
                      <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0">
                        <div 
                          className="h-full bg-[#10B981] transition-all duration-500" 
                          style={{ width: `${((currentStage - 1) / 3) * 100}%` }}
                        />
                      </div>
                      
                      {stages.map((stage) => {
                        const isActive = currentStage >= stage.num;
                        return (
                          <div key={stage.num} className="flex flex-col items-center relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                              isActive 
                                ? 'bg-[#10B981] text-white shadow-[#10B981]/25' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 shadow-none'
                            }`}>
                              {isActive ? <Check size={16} /> : stage.num}
                            </div>
                            <span className={`text-[10px] font-extrabold mt-2 uppercase tracking-wider transition-colors ${
                              isActive ? 'text-[#10B981]' : 'text-slate-400'
                            }`}>
                              {stage.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                      <User size={14} className="text-slate-600 dark:text-slate-400" />
                      <span>CUSTOMER</span>
                    </div>
                    <div className="space-y-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                      <p className="font-bold text-slate-900 dark:text-white">{customerName}</p>
                      {customerPhone && (
                        <p className="text-[#1F6FEB] font-bold">{customerPhone}</p>
                      )}
                      <p className="text-xs text-slate-600 dark:text-slate-400 uppercase tracking-tight">{customerAddress}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      <Banknote size={14} className="text-slate-600 dark:text-slate-400" />
                      <span>ORDER TOTAL</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-[#1F6FEB] tracking-tight">
                      {currency} {Number(totalAmount).toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                      <ShoppingBag size={14} className="text-slate-600 dark:text-slate-400" />
                      <span>ORDER ITEMS ({itemCount})</span>
                    </div>
                    
                    <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800/60">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between pt-2 first:pt-0">
                          <div className="pr-4">
                            <p className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">
                              {item.name || `Item #${idx + 1}`}
                            </p>
                            <p className="text-xs text-slate-400 font-semibold mt-0.5">
                              {item.quantity || 1}x
                            </p>
                          </div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap">
                            {currency} {Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1F6FEB] to-[#1554C0] hover:from-[#1554C0] hover:to-[#0D3C8A] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
                  >
                    <ShoppingBag size={16} />
                    <span>{lang === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppContact}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1ebd5a] text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
                  >
                    <MessageCircle size={16} />
                    <span>{lang === 'fr' ? 'Nous contacter' : 'Contact Us'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
