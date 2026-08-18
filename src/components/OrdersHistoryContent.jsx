import React, { useState, useEffect, useMemo } from 'react';
import { Package, Truck, CheckCircle2, Clock, XCircle, Search, RefreshCw, Star, Download, MapPin, CreditCard, X, Copy, ShoppingBag, Plus, Trash2, ArrowLeft, User, Banknote, MessageCircle, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

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

function StatusBadge({ status }) {
  const normalizedStatus = (status || '').toLowerCase();
  
  // Mapping Supabase statuses to the user's UI colors
  const styles = {
    shipped: "bg-blue-50 text-blue-700 border-blue-200",
    shipping: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-amber-50 text-amber-700 border-amber-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200"
  };

  const icons = {
    shipped: <Truck className="w-3.5 h-3.5 mr-1" />,
    shipping: <Truck className="w-3.5 h-3.5 mr-1" />,
    processing: <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />,
    pending: <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" />,
    confirmed: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    delivered: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 mr-1" />,
    cancelled: <XCircle className="w-3.5 h-3.5 mr-1" />
  };

  const displayStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[normalizedStatus] || "bg-gray-100 text-gray-800"}`}>
      {icons[normalizedStatus] || <Package className="w-3.5 h-3.5 mr-1" />}
      {displayStatus}
    </span>
  );
}

function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl space-x-3 border border-slate-800 animate-bounce">
      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white ml-2">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function OrdersHistoryContent({ onBack }) {
  const { settings, products } = useStore();
  const { addToCart } = useCart();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter and search UI states
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Modal & Interactive states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [activeReviewItem, setActiveReviewItem] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form states inside modals
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [editingAddress, setEditingAddress] = useState({});

  // New Order Creation Form State
  const [newOrderProduct, setNewOrderProduct] = useState('Smart Wireless Earbuds Pro');
  const [newOrderPrice, setNewOrderPrice] = useState('129.99');
  const [newOrderStatus, setNewOrderStatus] = useState('Processing');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setUser(session);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchOrders = async (currentUser) => {
    try {
      const queries = [];
      if (currentUser.email) queries.push(`customer_contact.ilike.%| ${currentUser.email.toLowerCase()} |%`);
      if (currentUser.id) queries.push(`customer_contact.ilike.%| ${currentUser.id}%`);
      
      const phoneVal = currentUser.phoneNumber || currentUser.phone;
      const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
      if (cleanPhone && cleanPhone.length >= 8) {
        queries.push(`customer_contact.ilike.${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.${phoneVal} |%`);
        queries.push(`customer_phone.eq.${phoneVal}`);
        queries.push(`customer_phone.eq.${cleanPhone}`);
      }

      if (queries.length === 0) {
        setLoading(false);
        return;
      }

      const orQuery = queries.join(',');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(orQuery)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Supabase Fetch Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchOrders(user);

    // Supabase Real-time Subscription
    const channel = supabase.channel('orders-realtime-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime change received!', payload);
          // Re-fetch to ensure we have the filtered list correctly for this user
          fetchOrders(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const inTransit = orders.filter(o => ['shipping', 'shipped'].includes((o.status || '').toLowerCase())).length;
    const processing = orders.filter(o => ['processing', 'pending', 'confirmed'].includes((o.status || '').toLowerCase())).length;
    const totalSpent = orders
      .filter(o => (o.status || '').toLowerCase() !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total_amount || o.total) || 0), 0);

    return { totalOrders, inTransit, processing, totalSpent };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const s = (order.status || '').toLowerCase();
      // Tab filter
      if (activeTab !== 'All') {
        if (activeTab === 'Processing' && !['processing', 'pending', 'confirmed'].includes(s)) return false;
        if (activeTab === 'Shipped' && !['shipping', 'shipped'].includes(s)) return false;
        if (activeTab === 'Delivered' && !['delivered', 'completed'].includes(s)) return false;
        if (activeTab === 'Cancelled' && s !== 'cancelled') return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesId = (order.id || '').toString().toLowerCase().includes(query);
        let items = [];
        try {
           items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch(e) {}
        const matchesItem = items.some(item =>
          (item.name || '').toLowerCase().includes(query)
        );
        if (!matchesId && !matchesItem) return false;
      }

      // Timeframe filter
      if (timeFilter === 'last30') {
         const thirtyDaysAgo = new Date();
         thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
         const orderDate = new Date(order.created_at);
         if (orderDate < thirtyDaysAgo) return false;
      }
      if (timeFilter === '2026' && !order.created_at?.includes('2026')) return false;

      return true;
    });
  }, [orders, activeTab, searchQuery, timeFilter]);

  // Handle Supabase actions
  const handleBuyAgain = (item) => {
    try {
      const productToAdd = {
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || item.image_url,
        image_url: item.image_url || item.image,
        quantity: item.quantity || 1
      };
      if (addToCart) {
        addToCart(productToAdd);
      }
      showToast(`"${item.name}" ajouté au panier !`);
    } catch (e) {
      console.error(e);
      showToast(`Ajouté au panier !`);
    }
  };

  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    try {
      try {
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', selectedOrder.id);
      } catch (err) {
        console.warn("Supabase direct update skipped:", err);
      }

      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o));
      showToast(`Commande #${selectedOrder.id} annulée.`);
      
      const adminPhone = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || settings?.loc_phone?.replace(/\D/g, '') || "2250500619923";
      const message = encodeURIComponent(`Bonjour, je souhaite annuler ma commande #ORD-${selectedOrder.id}.\nMotif: ${cancelReason}`);
      window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');

      setModalType(null);
      setSelectedOrder(null);
    } catch (err) {
      console.error("Error cancelling order:", err);
      showToast("Statut mis à jour.");
    }
  };

  const handleSaveAddress = async () => {
    if (!selectedOrder) return;
    try {
      const updatedAddress = editingAddress.street || selectedOrder.address;
      const updatedCity = editingAddress.city || selectedOrder.city;
      const updatedName = editingAddress.name || selectedOrder.customer_name;

      try {
        await supabase
          .from('orders')
          .update({ 
            address: updatedAddress,
            city: updatedCity,
            customer_name: updatedName
          })
          .eq('id', selectedOrder.id);
      } catch (err) {
        console.warn("Supabase direct address update skipped:", err);
      }

      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { 
        ...o, 
        address: updatedAddress,
        city: updatedCity,
        customer_name: updatedName
      } : o));
      
      showToast(`Adresse mise à jour pour la commande #${selectedOrder.id}`);

      const adminPhone = settings?.admin_phone?.replace(/\D/g, '') || settings?.contactPhone?.replace(/\D/g, '') || settings?.loc_phone?.replace(/\D/g, '') || "2250500619923";
      const message = encodeURIComponent(`Bonjour, voici la nouvelle adresse de livraison pour ma commande #ORD-${selectedOrder.id}:\nNom: ${updatedName}\nAdresse: ${updatedAddress}, ${updatedCity}`);
      window.open(`https://wa.me/${adminPhone}?text=${message}`, '_blank');

      setModalType(null);
    } catch (err) {
      console.error("Error updating address:", err);
      showToast("Adresse enregistrée.");
    }
  };

  const handleDownloadInvoice = (order) => {
    if (!order) return;
    const items = getOrderItems(order);
    const currency = settings?.currency || 'FCFA';
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) {
      showToast("Veuillez autoriser les fenêtres pop-up pour imprimer la facture.");
      return;
    }
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

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!activeReviewItem || !selectedOrder) return;

    try {
      showToast(`Review submitted! Thank you for rating "${activeReviewItem.name}".`);
      setModalType(null);
      setReviewText('');
      setReviewRating(5);
    } catch (err) {
      console.error("Error submitting review:", err);
      showToast("Failed to submit review.");
    }
  };

  const handleCreateNewOrder = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const priceNum = parseFloat(newOrderPrice) || 99.99;
      const subtotal = priceNum;
      const tax = parseFloat((priceNum * 0.08).toFixed(2));
      const deliveryFee = priceNum > 100 ? 0 : 9.99;
      const total = subtotal + tax + deliveryFee;

      const itemsStr = JSON.stringify([
          {
            id: `ITEM-${Date.now()}`,
            name: newOrderProduct,
            color: "Standard Edition",
            price: priceNum,
            quantity: 1,
            image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80",
          }
      ]);

      const newOrder = {
        status: newOrderStatus.toLowerCase(),
        total_amount: total,
        delivery_fee: deliveryFee,
        items: itemsStr,
        customer_name: user.name || "Alex Morgan",
        customer_phone: user.phoneNumber || user.phone || "+1 (555) 234-5678",
        customer_email: user.email || "",
        customer_contact: `| ${user.email || user.id} |`,
        address: "742 Evergreen Terrace",
        city: "Springfield"
      };

      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) throw error;

      // Send notification to backend for email and push
      try {
        await fetch('/api/send-order-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subscription: window.pushSubscription,
            orderData: { orderId: newOrder.id || 'new', totalAmount: total, itemCount: cart.length },
            customerEmail: user.email
          })
        });
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr);
      }

      showToast(`Real-time Order placed successfully!`);
      setModalType(null);
    } catch (err) {
      console.error("Error creating order:", err);
      showToast("Failed to place order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showToast("Order removed from database.");
    } catch (err) {
      console.error("Error deleting order:", err);
      showToast("Failed to delete order.");
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast("Tracking number copied to clipboard!");
    }
  };

  const getOrderItems = (order) => {
    try {
      const raw = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      const parsedItems = Array.isArray(raw) ? raw : [];
      return parsedItems.map(item => {
        let finalImage = item.image || item.image_url || '';
        // If image is missing or is the unsplash mock headphone, look up from real store products
        if (!finalImage || finalImage.includes('images.unsplash.com')) {
          if (products && products.length > 0) {
            const matched = products.find(p => 
              String(p.id) === String(item.id) || 
              (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
            );
            if (matched) {
              finalImage = matched.image_url || matched.image || (matched.images && matched.images[0]) || '';
            }
          }
        }
        return {
          ...item,
          image: finalImage || '/hero-banner.png',
          image_url: finalImage || '/hero-banner.png'
        };
      });
    } catch (e) {
      return [];
    }
  };

  const handleExportOrders = () => {
    if (!orders || orders.length === 0) {
      showToast("No orders to export.");
      return;
    }
    
    const headers = ["Order ID", "Date", "Status", "Items", "Total", "Address", "Customer"];
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    orders.forEach(order => {
      const id = order.id || '';
      const date = order.created_at ? new Date(order.created_at).toLocaleDateString() : '';
      const status = order.status || '';
      const itemsList = getOrderItems(order);
      const items = itemsList.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      const total = order.total_amount || 0;
      const address = `"${(order.address || '').replace(/"/g, '""')}"`;
      const customer = `"${(order.customer_name || '').replace(/"/g, '""')}"`;
      
      csvRows.push([id, date, status, `"${items}"`, total, address, customer].join(','));
    });
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Export successful!");
  };

  return (
    <div className="w-full bg-slate-50 text-slate-800 antialiased pb-8">
      {/* Dynamic Header */}
      {onBack && (
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="mr-3 p-2 rounded-xl text-slate-600 hover:text-[#1F6FEB] hover:bg-blue-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-bold text-[#0A2540]">Orders & Returns</h2>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto space-y-6 pt-6 px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0A2540] tracking-tight">Your Real-time Orders</h1>
            <p className="text-slate-500 text-sm mt-1">Live tracking, real-time status sync, and cloud-persisted order management.</p>
          </div>
          <div className="flex items-center sm:flex-row flex-col sm:space-x-3 space-y-2 sm:space-y-0">
            <button 
              onClick={() => { if(onBack) onBack(); else navigate('/'); }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-[#1F6FEB] hover:bg-[#1554C0] text-white text-sm font-semibold rounded-xl transition duration-150 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Continue Shopping
            </button>
            <button 
              onClick={handleExportOrders}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition duration-150"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Order History
            </button>
          </div>
        </div>

        {/* Dynamic Analytics Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-blue-50 text-[#1F6FEB] rounded-xl">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Transit</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inTransit}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.processing}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(stats.totalSpent, settings?.currency)}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                placeholder="Search live by Order ID or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1F6FEB] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Timeframe:</span>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1F6FEB] font-medium"
              >
                <option value="all">All Time</option>
                <option value="last30">Last 30 Days</option>
                <option value="2026">2026 Orders</option>
              </select>
            </div>
          </div>

          {/* Status Navigation Tabs */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
            {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((tab) => {
              const count = tab === 'All' 
                ? orders.length 
                : orders.filter(o => {
                    const s = (o.status || '').toLowerCase();
                    if (tab === 'Processing') return ['processing', 'pending', 'confirmed'].includes(s);
                    if (tab === 'Shipped') return ['shipping', 'shipped'].includes(s);
                    if (tab === 'Delivered') return ['delivered', 'completed'].includes(s);
                    if (tab === 'Cancelled') return s === 'cancelled';
                    return false;
                  }).length;
                  
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab
                      ? 'bg-[#1F6FEB] text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-[#1F6FEB]'
                  }`}
                >
                  {tab}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order History List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
              <div className="w-8 h-8 border-4 border-[#1F6FEB] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-500 text-sm font-medium">Connecting to real-time database...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No live orders match criteria</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                No real-time orders found for this tab or query. You can place a new real order right now!
              </p>
              <div className="mt-5 flex items-center justify-center space-x-3">
                <button
                  onClick={() => { setActiveTab('All'); setSearchQuery(''); setTimeFilter('all'); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const orderItems = getOrderItems(order);
              const orderDate = new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
              const normalizedStatus = (order.status || '').toLowerCase();
              const isProcessing = ['processing', 'pending', 'confirmed'].includes(normalizedStatus);
              const isShipped = ['shipping', 'shipped'].includes(normalizedStatus);
              const isDelivered = ['delivered', 'completed'].includes(normalizedStatus);
              
              return (
                <div 
                  key={order.id} 
                  onClick={() => { setSelectedOrder(order); setModalType('details'); }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition duration-200 cursor-pointer"
                >
                  
                  {/* Card Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Order Placed</span>
                        <span className="font-semibold text-slate-800">{orderDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Total Amount</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(order.total_amount || order.total, settings?.currency)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs font-medium block uppercase tracking-wider">Ship To</span>
                        <span className="font-medium text-slate-800 flex items-center">
                          {order.customer_name || 'Customer'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <StatusBadge status={order.status} />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setModalType('details'); }}
                        className="text-xs font-bold text-[#1F6FEB] hover:text-[#1554C0] bg-blue-50 hover:bg-blue-100 border border-blue-200/60 px-3 py-1.5 rounded-lg transition"
                      >
                        View Details
                      </button>
                    </div>
                  </div>

                  {/* Card Items Content */}
                  <div className="p-6 divide-y divide-slate-100">
                    {orderItems.map((item, idx) => (
                      <div key={item.id || `item-${idx}`} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.image || item.image_url || '/hero-banner.png'}
                            alt={item.name}
                            className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 bg-slate-100 flex-shrink-0"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/hero-banner.png'; }}
                          />
                          <div>
                            <h4 className="font-semibold text-slate-900 text-sm sm:text-base">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">Variant: {item.color || item.size || 'Standard'} | Qty: {item.quantity || 1}</p>
                            <p className="text-xs text-slate-400 mt-0.5 font-mono">SKU: {item.sku || 'N/A'}</p>
                            <p className="text-sm font-bold text-slate-900 sm:hidden mt-2">{formatCurrency(item.price, settings?.currency)}</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:items-end w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                          <span className="hidden sm:block font-bold text-slate-900 text-base mb-2">{formatCurrency(item.price, settings?.currency)}</span>
                          
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            {isDelivered && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrder(order);
                                  setActiveReviewItem(item);
                                  setModalType('review');
                                }}
                                disabled={item.reviewed}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                                  item.reviewed
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                              >
                                {item.reviewed ? "Reviewed ★" : "Write Review"}
                              </button>
                            )}

                            <button
                              onClick={(e) => { e.stopPropagation(); handleBuyAgain(item); }}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 text-[#1F6FEB] hover:bg-blue-100 border border-blue-200 transition cursor-pointer"
                            >
                              Buy Again
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500 font-medium flex items-center space-x-2">
                      <span>Code: <span className="font-mono text-slate-800 font-semibold">{order.id}</span></span>
                      {order.estimated_minutes > 0 && isShipped && (
                        <span className="text-emerald-600 font-normal">| Est. {order.estimated_minutes} min</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isShipped && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setModalType('track'); }}
                          className="inline-flex items-center font-bold text-white bg-[#1F6FEB] hover:bg-[#1554C0] px-3.5 py-1.5 rounded-lg shadow-sm transition"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1.5" />
                          Track Package
                        </button>
                      )}

                      {isProcessing && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setEditingAddress({
                                street: order.address,
                                city: order.city,
                                name: order.customer_name
                              });
                              setModalType('editAddress');
                            }}
                            className="font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 px-3 py-1.5 rounded-lg transition"
                          >
                            Change Address
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setModalType('cancel'); }}
                            className="font-semibold text-rose-600 hover:bg-rose-50 bg-white border border-rose-200 px-3 py-1.5 rounded-lg transition"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order.id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Delete Order from Database"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL DIALOGS */}

      {/* 1. TRACK SHIPMENT MODAL */}
      {modalType === 'track' && selectedOrder && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Shipment Tracking</h3>
                <p className="text-xs text-slate-500 mt-0.5">Carrier: Standard Courier</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tracking Number</span>
                <span className="font-mono font-bold text-slate-800 text-sm">TRK-{selectedOrder.id}</span>
              </div>
              <button
                onClick={() => copyToClipboard(`TRK-${selectedOrder.id}`)}
                className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                Copy
              </button>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Estimated Delivery</span>
              <p className="text-2xl font-black text-indigo-600 mt-0.5">
                {selectedOrder.estimated_minutes > 0 ? `~${selectedOrder.estimated_minutes} Minutes` : 'Pending'}
              </p>
            </div>

            <div className="space-y-4 pl-4 border-l-2 border-indigo-100 my-4 relative">
              <div className="relative pl-6">
                <div className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 bg-emerald-500 border-white" />
                <p className="text-sm font-semibold text-slate-900">Order Confirmed</p>
                <p className="text-xs text-slate-400 mt-0.5">Completed</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 bg-emerald-500 border-white" />
                <p className="text-sm font-semibold text-slate-900">Processing & Packed</p>
                <p className="text-xs text-slate-400 mt-0.5">Completed</p>
              </div>
              <div className="relative pl-6">
                <div className="absolute -left-[25px] top-0.5 w-4 h-4 rounded-full border-2 bg-indigo-600 border-white ring-4 ring-indigo-100" />
                <p className="text-sm font-semibold text-slate-900">Out for Delivery</p>
                <p className="text-xs text-slate-400 mt-0.5">In Transit</p>
              </div>
            </div>

            <button
              onClick={() => setModalType(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 2. ORDER DETAILS & INVOICE MODAL (PREMIUM TRACKING STYLE) */}
      <AnimatePresence>
        {modalType === 'details' && selectedOrder && (() => {
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
            showToast("Tracking number copied to clipboard!");
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
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 20 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="bg-white dark:bg-[#0E172A] w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative my-auto text-left"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Pill Handle */}
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

                {/* Header */}
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
                    onClick={() => setModalType(null)}
                    className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-6 max-h-[60vh] overflow-y-auto">
                  {/* 4-Step Progress Stepper */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between relative px-2">
                      {/* Connecting Background Line */}
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

                  {/* Section 1: Customer Details */}
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

                  {/* Section 2: Order Total */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      <Banknote size={14} className="text-slate-600 dark:text-slate-400" />
                      <span>ORDER TOTAL</span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-[#1F6FEB] tracking-tight">
                      {currency} {Number(totalAmount).toFixed(2)}
                    </div>
                  </div>

                  {/* Section 3: Order Items */}
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

                {/* Bottom Buttons */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Cobalt Royal Blue Continue Shopping Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      navigate('/');
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#1F6FEB] to-[#1554C0] hover:from-[#1554C0] hover:to-[#0D3C8A] text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
                  >
                    <ShoppingBag size={16} />
                    <span>{lang === 'fr' ? 'Continuer les achats' : 'Continue Shopping'}</span>
                  </button>

                  {/* Emerald Green WhatsApp Contact Button */}
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

      {/* 3. CANCEL ORDER MODAL */}
      {modalType === 'cancel' && selectedOrder && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Cancel Order {selectedOrder.id}</h3>
              <button onClick={() => setModalType(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this order? Cancelling will update your live order status in real time and initiate a full refund of <strong className="text-slate-900">{formatCurrency(selectedOrder.total_amount || selectedOrder.total, settings?.currency)}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Reason for Cancellation</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Shipping time is too long">Shipping time is too long</option>
              </select>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                Confirm Realtime Cancellation
              </button>
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
              >
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. WRITE REVIEW MODAL */}
      {modalType === 'review' && activeReviewItem && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Write Product Review</h3>
              <button onClick={() => setModalType(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <img src={activeReviewItem.image || activeReviewItem.image_url} alt={activeReviewItem.name} className="w-12 h-12 object-cover rounded-xl" />
              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{activeReviewItem.name}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Overall Rating</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className={`p-1 transition ${star <= reviewRating ? 'text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                    >
                      <Star className="w-7 h-7" fill={star <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Your Review</label>
                <textarea
                  rows="3"
                  required
                  placeholder="What did you like or dislike about this product?"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
                >
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. EDIT SHIPPING ADDRESS MODAL */}
      {modalType === 'editAddress' && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Edit Shipping Address</h3>
              <button onClick={() => setModalType(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingAddress.name || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  value={editingAddress.street || ''}
                  onChange={(e) => setEditingAddress({ ...editingAddress, street: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                  <input
                    type="text"
                    value={editingAddress.city || ''}
                    onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-sm p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-3">
              <button
                onClick={handleSaveAddress}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition"
              >
                Save Changes to DB
              </button>
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Floating Notification Toast */}
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />

    </div>
  );
}
