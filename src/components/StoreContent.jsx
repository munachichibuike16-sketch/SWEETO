import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

const StoreContent = () => {
  const navigate = useNavigate();
  const { settings, products } = useStore();
  const { lang, t } = useLanguage();
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { isDarkMode } = useTheme();

  const [activeView, setActiveView] = useState('active-orders');
  const [userOrders, setUserOrders] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  


  // Fetch real-time orders linked to the logged-in user
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setCurrentUser(session);
      fetchUserOrders(session);
    }
  }, []);

  // Subscribe to real-time changes in Supabase orders table for live tracking updates
  useEffect(() => {
    if (!currentUser || !supabase) return;

    const channel = supabase
      .channel(`user-orders-realtime-${currentUser.id || 'guest'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Real-time order update received:', payload);
          fetchUserOrders(currentUser);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);


  const fetchUserOrders = async (user) => {
    try {
      if (!user) return;
      const queries = [];
      if (user.email) {
        queries.push(`customer_contact.ilike.%| ${user.email.toLowerCase()} |%`);
      }
      if (user.id) {
        queries.push(`customer_contact.ilike.%| ${user.id}%`);
      }
      const phoneVal = user.phoneNumber || user.phone;
      const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
      if (cleanPhone && cleanPhone.length >= 8) {
        queries.push(`customer_contact.ilike.${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
        queries.push(`customer_contact.ilike.${phoneVal} |%`);
        queries.push(`customer_phone.eq.${phoneVal}`);
        queries.push(`customer_phone.eq.${cleanPhone}`);
      }
      if (queries.length === 0) return;
      const orQuery = queries.join(',');
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(orQuery)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setUserOrders(data);
      }
    } catch (err) {
      console.error('Error fetching user orders for Store Hub:', err);
    }
  };

  // Compute stats
  const realActiveOrders = userOrders.filter(order => order.status !== 'completed' && order.status !== 'cancelled');
  const activeOrdersCount = realActiveOrders.length;

  const realCompletedOrders = userOrders.filter(order => order.status === 'completed');
  const totalBoughtCount = realCompletedOrders.length;

  const likedItemsCount = wishlistItems.length;

  const handleUnlike = (itemId) => {
    const item = wishlistItems.find(p => p.id === itemId);
    if (item) toggleWishlist(item);
  };

  const handleDismissOrder = (orderId) => {
    setUserOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const orderViaWhatsApp = (itemName, price) => {
    const phoneNumber = settings?.contactPhone?.replace(/\D/g, '') || "2250500619923";
    const formattedMessage = encodeURIComponent(
      `Bonjour SWEETO-HUB ! 👋\n\nJe souhaite commander cet article depuis mon espace client :\n` +
      `📦 Produit : ${itemName}\n` +
      `💰 Prix : ${parseInt(price).toLocaleString()} FCFA\n\n` +
      `Merci de me confirmer la disponibilité pour retrait à Adjamé Mirador ! ⚡`
    );
    window.open(`https://api.whatsapp.com/send?phone=${phoneNumber}&text=${formattedMessage}`, '_blank');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-[#f3f4f6] pb-24 selection:bg-sky-600 selection:text-white relative">
      <style>{`
        body {
            background-color: ${isDarkMode ? '#030712' : '#f8fafc'} !important;
        }

        .glass-pill {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(16px);
        }

        .stat-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            color: #475569;
        }

        .dark .stat-card {
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.04);
            color: #f3f4f6;
        }

        .stat-card:active {
            transform: scale(0.95);
        }

        .stat-card-active-orders:hover, .stat-card-active-orders.active {
            border-color: rgba(56, 189, 248, 0.3);
            background: rgba(56, 189, 248, 0.04);
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.12);
        }

        .stat-card-total-bought:hover, .stat-card-total-bought.active {
            border-color: rgba(45, 212, 191, 0.3);
            background: rgba(45, 212, 191, 0.04);
            box-shadow: 0 0 20px rgba(45, 212, 191, 0.12);
        }

        .stat-card-liked-items:hover, .stat-card-liked-items.active {
            border-color: rgba(251, 113, 133, 0.3);
            background: rgba(251, 113, 133, 0.04);
            box-shadow: 0 0 20px rgba(251, 113, 133, 0.12);
        }

        .active-order-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            position: relative;
            transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            color: #1e293b;
        }

        .dark .active-order-card {
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(8, 13, 28, 0.9) 100%);
            border: 1px solid rgba(255, 255, 255, 0.04);
            color: #f3f4f6;
        }

        .active-order-card::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(180deg, #2dd4bf 0%, #14b8a6 100%);
            border-top-left-radius: 18px;
            border-bottom-left-radius: 18px;
            box-shadow: 2px 0 12px rgba(45, 212, 191, 0.4);
        }

        .pulse-dot {
            width: 8px;
            height: 8px;
            background-color: #38bdf8;
            border-radius: 50%;
            box-shadow: 0 0 10px #38bdf8;
            animation: pulseGlow 2s infinite ease-in-out;
        }

        @keyframes pulseGlow {
            0%, 100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 6px #38bdf8; }
            50% { transform: scale(1.25); opacity: 0.6; box-shadow: 0 0 14px #38bdf8; }
        }
      `}</style>

      {/* BRAND SUB-BAR: Sticky top, pinned securely below the global web header */}
      <div className="sticky top-[var(--header-height,96px)] z-30 w-full bg-slate-50/90 dark:bg-[#030712]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/5 py-4 px-4 flex items-center justify-between">
        {/* Back Button: Premium frosted-ice styling with tactile feedback */}
        <button 
          onClick={goBack} 
          className="active-tap w-10 h-10 rounded-full border border-sky-500/20 dark:border-sky-500/15 bg-sky-500/10 dark:bg-sky-950/20 flex items-center justify-center text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:border-sky-400/40 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all duration-300 flex-shrink-0 cursor-pointer"
          aria-label="Retour"
        >
          <i className="fa-solid fa-chevron-left text-sm"></i>
        </button>

        {/* Store Hub Button with custom pill border (verbatim from image_3143c1.png) */}
        <button className="active-tap border border-sky-500/20 bg-sky-500/5 dark:bg-sky-950/10 px-8 py-3.5 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(56,189,248,0.08)] transition-all duration-300 hover:border-sky-400">
          <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
          </svg>
          <span className="text-xs uppercase tracking-[0.2em] font-extrabold text-sky-600 dark:text-sky-400">STORE HUB</span>
        </button>

        {/* Symmetric spacer to ensure the center "STORE HUB" logo is perfectly aligned */}
        <div className="w-10 h-10 flex-shrink-0"></div>
      </div>

      <header className="w-full pt-4 px-4 flex flex-col items-center">
        {/* Clickable Customer Stats Grid from image_3147e4.png */}
        <div className="w-full max-w-md grid grid-cols-3 gap-3 mt-4 px-1">
          {/* Card 1: Active Orders */}
          <div 
            id="btn-stat-orders" 
            onClick={() => setActiveView('active-orders')} 
            className={`stat-card stat-card-active-orders p-4 text-center ${activeView === 'active-orders' ? 'active' : ''}`}
          >
            <span className="block text-2xl font-extrabold text-sky-400">{activeOrdersCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mt-1">Active Orders</span>
          </div>

          {/* Card 2: Total Bought */}
          <div 
            id="btn-stat-bought" 
            onClick={() => setActiveView('total-bought')} 
            className={`stat-card stat-card-total-bought p-4 text-center ${activeView === 'total-bought' ? 'active' : ''}`}
          >
            <span className="block text-2xl font-extrabold text-teal-400">{totalBoughtCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mt-1">Total Bought</span>
          </div>

          {/* Card 3: Liked Items */}
          <div 
            id="btn-stat-likes" 
            onClick={() => setActiveView('liked-items')} 
            className={`stat-card stat-card-liked-items p-4 text-center ${activeView === 'liked-items' ? 'active' : ''}`}
          >
            <span className="block text-2xl font-extrabold text-rose-400">{likedItemsCount}</span>
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block mt-1">Liked Items</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">

        {/* ================= VIEW 1: ACTIVE ORDERS PAGE ================= */}
        {activeView === 'active-orders' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="text-xs uppercase tracking-[0.2em] font-extrabold text-sky-600 dark:text-sky-400 text-left">Active Order Trackers</h3>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold bg-slate-200/50 dark:bg-white/5 px-2.5 py-1 rounded-full">Live Tracker</span>
            </div>

            {/* Real active orders from database */}
            {realActiveOrders.map((order) => {
              let items = [];
              try {
                items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
              } catch (e) {}
              const mainItemName = items[0]?.name || 'Produit';

              return (
                <div key={order.id} className="active-order-card p-4 rounded-[20px] flex gap-3 items-center shadow-xl dark:shadow-2xl">
                  {/* Left Status Pulse */}
                  <div className="flex items-center justify-center pr-1">
                    <div className="pulse-dot"></div>
                  </div>

                  {/* Thumbnail / Package */}
                  <div className="relative w-16 h-16 bg-slate-100 dark:bg-[#0a1122] border border-slate-200 dark:border-white/5 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                    <div className="text-slate-800 dark:text-white text-2xl">📦</div>
                    <div className="absolute top-1 right-1 bg-amber-500/90 w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-100 dark:border-[#0a1122]">
                      <i className="fa-solid fa-box text-[8px] text-[#1a1105]"></i>
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className="flex-grow min-w-0 pr-1 text-left">
                    <h4 className="text-[13px] font-extrabold tracking-wide text-slate-800 dark:text-white uppercase truncate flex items-center gap-1.5">
                      {order.status === 'shipping' ? 'EN ROUTE...' : 'EN PRÉPARATION...'}
                      <span className="text-[10px] font-normal text-slate-400 dark:text-gray-500 normal-case flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[9px]"></i> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                      {mainItemName} est en cours de traitement pour <span className="text-teal-600 dark:text-teal-400 font-medium">{order.city}</span>!
                    </p>
                    <button 
                      onClick={() => navigate(`/order-tracking/${order.id}`)}
                      className="active-tap text-[10px] font-bold text-teal-600 dark:text-teal-400 mt-2 hover:text-teal-500 dark:hover:text-teal-300 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      TRACK ORDER <span className="font-normal">&gt;</span>
                    </button>
                  </div>

                  {/* Right Action layout */}
                  <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0 min-w-[85px] border-l border-slate-200 dark:border-white/5 pl-2">
                    <span className="text-[12px] font-black text-sky-600 dark:text-sky-400 tracking-wide">{order.total_amount?.toLocaleString() || order.total?.toLocaleString()} F</span>
                    
                    <div className="flex flex-col items-end gap-1 mt-auto w-full">
                      <button 
                        onClick={() => handleDismissOrder(order.id)}
                        className="active-tap text-[9px] font-bold tracking-wider text-slate-400 dark:text-gray-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors uppercase flex items-center gap-1 cursor-pointer"
                      >
                        DISMISS <i className="fa-solid fa-xmark text-[9px]"></i>
                      </button>
                      
                      <button 
                        onClick={() => navigate(`/order-tracking/${order.id}`)}
                        className="active-tap w-7 h-7 rounded-full bg-sky-500 hover:bg-sky-400 text-white flex items-center justify-center shadow-lg transition-all duration-300 shadow-sky-500/10 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-right text-[11px]"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty State for Active Orders */}
            {realActiveOrders.length === 0 && (
              <div id="orders-empty-state" className="text-center py-12 px-6 bg-slate-100/50 dark:bg-[#091122]/40 rounded-3xl border border-slate-200 dark:border-white/5">
                <div className="text-slate-300 dark:text-gray-600 text-4xl mb-3">
                  <i className="fa-solid fa-box-open"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">No active trackers</h4>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">No pending orders are in progress. Browse our Store Hub to order premium tech!</p>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: TOTAL BOUGHT PAGE ================= */}
        {activeView === 'total-bought' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="text-xs uppercase tracking-[0.2em] font-extrabold text-teal-600 dark:text-teal-400 text-left">Completed Purchases</h3>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold bg-slate-200/50 dark:bg-white/5 px-2.5 py-1 rounded-full">Archive Logs</span>
            </div>

            <div className="space-y-3">
              {/* Real completed orders from database */}
              {realCompletedOrders.map(order => {
                let items = [];
                try {
                  items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
                } catch (e) {}
                const mainItemName = items[0]?.name || 'Produit';

                return (
                  <div key={order.id} className="bg-white dark:bg-[#091122]/80 border border-slate-200 dark:border-white/5 p-4 rounded-2xl flex justify-between items-center shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600 dark:text-teal-400 text-lg flex-shrink-0">
                        <i className="fa-solid fa-circle-check"></i>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wide">{mainItemName}</h4>
                        <span className="text-[9px] text-slate-400 dark:text-gray-500 block mt-0.5">
                          {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })} • Reference #SWTO-{order.id}
                        </span>
                        <span className="text-[9px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider">Delivered & Verified ✓</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="block text-xs font-bold text-slate-700 dark:text-gray-300">{order.total_amount?.toLocaleString() || order.total?.toLocaleString()} F</span>
                      <button 
                        onClick={() => orderViaWhatsApp(mainItemName, order.total_amount || order.total)}
                        className="active-tap mt-1.5 text-[8px] uppercase tracking-wider font-extrabold bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-1 rounded cursor-pointer"
                      >
                        Buy Again
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty State for Completed Purchases */}
              {realCompletedOrders.length === 0 && (
                <div id="bought-empty-state" className="text-center py-12 px-6 bg-slate-100/50 dark:bg-[#091122]/40 rounded-3xl border border-slate-200 dark:border-white/5">
                  <div className="text-slate-300 dark:text-gray-600 text-4xl mb-3">
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">No completed purchases</h4>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Your order history is empty. Place an order to track it here!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW 3: LIKED ITEMS PAGE ================= */}
        {activeView === 'liked-items' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1 mb-2">
              <h3 className="text-xs uppercase tracking-[0.2em] font-extrabold text-rose-600 dark:text-rose-400 text-left">Liked & Saved Products</h3>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold bg-slate-200/50 dark:bg-white/5 px-2.5 py-1 rounded-full">Favorites</span>
            </div>

            {/* Liked / Saved Interactive Grid */}
            {likedItemsCount > 0 ? (
              <div id="liked-items-grid" className="grid grid-cols-2 gap-3">
                {/* Real items from WishlistContext */}
                {wishlistItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-[#091122]/95 border border-slate-200 dark:border-white/5 p-3 rounded-xl flex flex-col justify-between h-44 relative text-left shadow-sm dark:shadow-none">
                    {/* Floating Heart Unlike Trigger */}
                    <button 
                      onClick={() => handleUnlike(item.id)}
                      className="absolute top-2.5 right-2.5 text-rose-500 dark:text-rose-400 hover:text-slate-400 dark:hover:text-gray-400 transition-colors text-xs p-1 cursor-pointer"
                    >
                      <i className="fa-solid fa-heart"></i>
                    </button>

                    <div className="mt-2">
                      <span className="text-[8px] font-black bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded uppercase">{item.category || 'TECH'}</span>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-white mt-1 line-clamp-1">{item.name}</h5>
                      <p className="text-[9px] text-slate-400 dark:text-gray-500 leading-normal mt-1 line-clamp-2">Authentic local product from SWEETO-HUB.</p>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">{item.price?.toLocaleString()} F</span>
                      <button 
                        onClick={() => orderViaWhatsApp(item.name, item.price)}
                        className="active-tap w-7 h-7 rounded-full bg-teal-500 text-white flex items-center justify-center text-[11px] shadow-lg shadow-teal-500/20 cursor-pointer"
                      >
                        <i className="fa-brands fa-whatsapp"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty State for Liked Grid */
              <div id="liked-empty-state" className="text-center py-12 px-6 bg-slate-100/50 dark:bg-[#091122]/40 rounded-3xl border border-slate-200 dark:border-white/5">
                <div className="text-slate-350 dark:text-gray-600 text-4xl mb-3">
                  <i className="fa-regular fa-heart"></i>
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">No saved items found</h4>
                <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">Explore our product catalog and tap the heart icon to start saving tech!</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Global App Signature Watermark Footer */}
      <footer className="text-center mt-12 py-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-gray-700 font-extrabold">
          Elite Local Commerce • Managed by @sweeto
        </p>
      </footer>
    </div>
  );
};

export default StoreContent;
