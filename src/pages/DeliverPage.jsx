import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, Package, CheckCheck, Clock, Navigation,
  Phone, MapPin, MessageCircle, ChevronDown,
  LogIn, LogOut, User, Zap, Star, Trophy,
  CheckCircle2, AlertCircle, RefreshCw, Eye,
  Camera, Mail, Calendar, Car, Hash, Home, ArrowLeft, UserPlus
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { apiFetch, isLocalHost } from '../utils/api';

/* ── Delivery stages ── */
const STAGES = [
  { key: 'assigned',    labelKey: 'assigned', defaultLabel: 'Assigned',         color: 'bg-slate-500',   text: 'text-slate-500'  },
  { key: 'picked_up',  labelKey: 'picked_up', defaultLabel: 'Picked Up',         color: 'bg-amber-500',   text: 'text-amber-500'  },
  { key: 'on_the_way', labelKey: 'on_the_way', defaultLabel: 'On the Way',        color: 'bg-eas-blue',    text: 'text-eas-blue'   },
  { key: 'nearby',     labelKey: 'almost_there', defaultLabel: 'Almost There',      color: 'bg-purple-500',  text: 'text-purple-500' },
  { key: 'delivered',  labelKey: 'delivered_status', defaultLabel: 'Delivered ✓',       color: 'bg-emerald-500', text: 'text-emerald-500'},
];

const stageIdx = (key) => STAGES.findIndex(s => s.key === key);

/* ── Leaflet Dynamic Component ── */
const LeafletMap = ({ destLat, destLng, agentLat, agentLng, isDriver = false }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const destMarkerRef = useRef(null);
  const agentMarkerRef = useRef(null);

  useEffect(() => {
    let leafletCss = document.getElementById('leaflet-css');
    if (!leafletCss) {
      leafletCss = document.createElement('link');
      leafletCss.id = 'leaflet-css';
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(leafletCss);
    }

    let leafletJs = document.getElementById('leaflet-js');
    if (!leafletJs) {
      leafletJs = document.createElement('script');
      leafletJs.id = 'leaflet-js';
      leafletJs.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      document.body.appendChild(leafletJs);
    }

    const initMap = () => {
      if (!window.L || !mapRef.current) return;
      if (mapInstanceRef.current) return;

      const defaultLat = destLat || 5.3484;
      const defaultLng = destLng || -3.9788;

      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: true
      }).setView([defaultLat, defaultLng], 14);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      }).addTo(mapInstanceRef.current);

      const homeIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #3b82f6; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const motoIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M3 17.5 8 10h5l4 7.5 M10 10l3-5h4l-3 5 M8 15h9"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      destMarkerRef.current = window.L.marker([defaultLat, defaultLng], { icon: homeIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("Destination");

      if (agentLat && agentLng) {
        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Your Location");

        const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    };

    const checkInterval = setInterval(() => {
      if (window.L && mapRef.current) {
        initMap();
        clearInterval(checkInterval);
      }
    }, 200);

    return () => {
      clearInterval(checkInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;

    if (destLat && destLng && destMarkerRef.current) {
      destMarkerRef.current.setLatLng([destLat, destLng]);
    }

    if (agentLat && agentLng) {
      const end = new window.L.LatLng(agentLat, agentLng);
      if (agentMarkerRef.current) {
        agentMarkerRef.current.setLatLng(end);
      } else {
        const motoIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M3 17.5 8 10h5l4 7.5 M10 10l3-5h4l-3 5 M8 15h9"/></svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Your Location");
      }

      if (destMarkerRef.current && agentMarkerRef.current) {
        const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.2));
      }
    }
  }, [destLat, destLng, agentLat, agentLng]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '1.5rem', zIndex: 1 }} />;
};

/* ═══════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════ */
export default function DeliverPage() {
  const { t } = useLanguage();
  const [agent, setAgent]   = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]     = useState('list');     // 'list' | 'detail'
  const [selected, setSel]  = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);

  useEffect(() => {
    if (agent) {
      fetchOrders();
    }
  }, [agent]);

  // Geolocation watch side-effect for background location tracking
  useEffect(() => {
    if (!agent || !orders.length) return;

    // Watch location only if an active order is in progress
    const activeOrder = orders.find(o => o.stage === 'picked_up' || o.stage === 'on_the_way' || o.stage === 'nearby');
    if (!activeOrder) return;

    console.log("📍 Geolocation watcher active for order ID:", activeOrder.db_id);

    let watchId = null;

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setCurrentCoords({ latitude, longitude });

          try {
            await apiFetch('/api/agents/ping-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: activeOrder.db_id,
                agent_id: agent.id,
                lat: latitude,
                lng: longitude,
                accuracy
              })
            });
            console.log(`📍 Location pinged successfully: ${latitude}, ${longitude}`);
          } catch (err) {
            console.error("Failed to send geolocation ping:", err);
          }
        },
        (err) => {
          console.error("Geolocation tracking error:", err);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [agent, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const agentOrders = data.map(o => ({
        id: `ORD-${o.id}`,
        db_id: o.id,
        customer_name: o.customer_name,
        address: o.delivery_address || o.address || 'Abidjan, CI',
        phone: o.customer_contact?.split('|')[0] || '',
        items: (() => { try { return JSON.parse(o.items || '[]').map(i => ({ name: i.name, qty: i.quantity, price: i.price })); } catch(e) { return []; } })(),
        total: o.total_amount || o.total || 0,
        stage: o.tracking_stage || 'assigned',
        tracking: o.tracking_number || `SWTO-${o.id}`,
        destination_lat: o.destination_lat,
        destination_lng: o.destination_lng,
        agent_lat: o.agent_lat,
        agent_lng: o.agent_lng
      }));

      // Filter orders assigned to this agent
      const filteredOrders = agentOrders.filter(o => o.delivery_agent_id === agent.id || o.stage !== 'placed');
      setOrders(agentOrders);
    } catch (err) {
      console.error("Failed to fetch agent orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const deliveredCount = orders.filter(o => o.stage === 'delivered').length;
  const pendingCount   = orders.filter(o => o.stage !== 'delivered').length;

  const openOrder = (o) => { setSel(o); setView('detail'); };
  const back      = ()  => { setView('list'); setSel(null); };

  const advanceStage = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const cur = stageIdx(order.stage);
    const nextKey = STAGES[Math.min(cur + 1, STAGES.length - 1)].key;

    try {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, stage: nextKey } : o));
      if (selected?.id === orderId) setSel({ ...selected, stage: nextKey });

      const { error } = await supabase.from('orders').update({ tracking_stage: nextKey }).eq('id', order.db_id);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update order stage:", err);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, stage: order.stage } : o));
      if (selected?.id === orderId) setSel(order);
    }
  };

  const notifyWA = (o) => {
    const stage = STAGES.find(s => s.key === o.stage);
    const stageLabel = t(stage?.labelKey) || stage?.defaultLabel || 'Update';
    const phone = o.phone.replace(/[^0-9]/g, '');
    const msg =
      `📦 *${t('delivery_update') || 'Delivery Update'} – SWEETO HUB*%0A` +
      `${t('hello') || 'Hi'} *${o.customer_name}*!%0A` +
      `${t('your_order_is_now') || 'Your order is now'}: *${stageLabel}*%0A` +
      `${t('tracking') || 'Tracking'}: ${o.tracking}%0A` +
      `📍 ${t('delivering_to') || 'Delivering to'}: ${o.address}%0A%0A` +
      `${t('thanks_shopping') || 'Thank you for shopping with us!'} 🛍️`;
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  if (!agent) return <LoginScreen onLogin={setAgent} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-eas-blue flex items-center justify-center">
            <Bike size={20} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">SWTO-DELIVER</p>
            <p className="font-black text-white text-sm leading-none">{agent.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-eas-blue uppercase tracking-widest bg-eas-blue/10 px-3 py-1.5 rounded-lg">{agent.zone}</span>
          <button onClick={() => setAgent(null)} className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div key="list" initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.25 }}>

            {/* Stats strip */}
            <div className="px-4 pt-6 pb-2 grid grid-cols-3 gap-3">
              {[
                { label: t('total_orders') || 'Total Orders',  value: orders.length,    icon: Package,    color: 'bg-slate-800'    },
                { label: t('delivered') || 'Delivered',     value: deliveredCount,   icon: CheckCheck, color: 'bg-emerald-900'  },
                { label: t('pending') || 'Pending',       value: pendingCount,     icon: Clock,      color: 'bg-amber-900/60' },
              ].map(s => (
                <div key={s.label} className={`${s.color} rounded-2xl p-4 flex flex-col gap-2`}>
                  <s.icon size={18} className="text-white/50" />
                  <p className="text-2xl font-black text-white">{s.value}</p>
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Rating badge */}
            <div className="px-4 py-3">
              <div className="bg-gradient-to-r from-eas-blue/20 to-purple-500/10 border border-eas-blue/20 rounded-2xl px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="font-black text-white">{agent.rating}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('your_rating') || 'Your Rating'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={16} className="text-amber-400" />
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{t('top_agent') || 'Top Agent'}</span>
                </div>
              </div>
            </div>

            {/* Orders list */}
            <div className="px-4 pb-8 space-y-3 mt-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">{t('your_deliveries') || 'Your Deliveries'}</p>
              {orders.map((o, i) => {
                const si    = stageIdx(o.stage);
                const stage = STAGES[si];
                return (
                  <motion.div key={o.id} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.06 }}>
                    <div className="bg-slate-800/60 rounded-[1.5rem] border border-white/5 overflow-hidden">
                      {/* Progress bar */}
                      <div className="h-1 bg-slate-700">
                        <div className={`h-full ${stage.color} transition-all duration-700`} style={{ width: `${((si + 1) / STAGES.length) * 100}%` }} />
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black text-white">{o.customer_name}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-wider">{o.id} · {o.tracking}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white ${stage.color}`}>
                            {t(stage.labelKey) || stage.defaultLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <MapPin size={12} className="text-slate-500 flex-shrink-0" />
                          <p className="text-xs font-bold text-slate-400 truncate">{o.address}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => openOrder(o)} className="flex-1 py-2.5 bg-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                            <Eye size={14} /> {t('view') || 'View'}
                          </button>
                          {o.stage !== 'delivered' && (
                            <button onClick={() => advanceStage(o.id)} className="flex-1 py-2.5 bg-eas-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                              <Navigation size={14} /> {t('update') || 'Update'}
                            </button>
                          )}
                          <button onClick={() => notifyWA(o)} className="w-11 h-10 bg-[#25D366]/20 text-[#25D366] rounded-xl flex items-center justify-center hover:bg-[#25D366]/30 transition-all">
                            <MessageCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        ) : (
          /* ── DETAIL VIEW ── */
          <motion.div key="detail" initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} transition={{ duration:0.25 }}
            className="pb-10"
          >
            <div className="px-4 pt-5 mb-5">
              <button onClick={back} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-black text-xs uppercase tracking-widest">
                ← {t('back_to_orders') || 'Back to Orders'}
              </button>
            </div>

            {selected && (() => {
              const si    = stageIdx(selected.stage);
              const stage = STAGES[si];
              return (
                <div className="px-4 space-y-5">

                  {/* Customer card */}
                  <div className="bg-slate-800/60 rounded-[1.5rem] border border-white/5 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('customer') || 'Customer'}</p>
                        <h2 className="font-black text-white text-xl mt-1">{selected.customer_name}</h2>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">SWT-{selected.id} · {selected.tracking}</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-white ${stage.color}`}>{t(stage.labelKey) || stage.defaultLabel}</span>
                    </div>
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
                        <MapPin size={16} className="text-eas-blue flex-shrink-0" />
                        <p className="text-sm font-bold text-white">{selected.address}</p>
                      </div>
                      <a href={`tel:${selected.phone}`} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-all">
                        <Phone size={16} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-sm font-bold text-white">{selected.phone}</p>
                        <span className="ml-auto text-[9px] font-black text-emerald-400 uppercase tracking-widest">{t('call') || 'Call'}</span>
                      </a>
                    </div>
                    <button onClick={() => notifyWA(selected)} className="w-full py-3 bg-[#25D366] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#25D366]/30">
                      <MessageCircle size={18} /> {t('notify_customer_wa') || 'Notify Customer on WhatsApp'}
                    </button>
                  </div>

                  {/* Dynamic Geolocation Live Map */}
                  {selected.stage !== 'delivered' && selected.destination_lat && (
                    <div className="bg-slate-800/60 rounded-[1.5rem] border border-white/5 p-4 space-y-3 h-[280px] relative">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Live Route Map</p>
                      <div className="h-[210px] w-full relative">
                        <LeafletMap 
                          destLat={parseFloat(selected.destination_lat)} 
                          destLng={parseFloat(selected.destination_lng)} 
                          agentLat={currentCoords?.latitude || (selected.agent_lat ? parseFloat(selected.agent_lat) : null)} 
                          agentLng={currentCoords?.longitude || (selected.agent_lng ? parseFloat(selected.agent_lng) : null)} 
                          isDriver={true} 
                        />
                        {/* Google Maps directions overlay */}
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${selected.destination_lat},${selected.destination_lng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="absolute bottom-3 right-3 bg-eas-blue hover:bg-blue-500 text-white px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-1.5 z-[99] border border-white/10"
                        >
                          <Navigation size={10} /> Google Maps
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-slate-800/60 rounded-[1.5rem] border border-white/5 p-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">{t('items_to_deliver') || 'Items to Deliver'}</p>
                    <div className="space-y-3">
                      {selected.items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-white text-sm">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-500">{t('qty') || 'Qty'}: {item.qty}</p>
                          </div>
                          <p className="font-black text-white text-sm">{(item.price * item.qty).toLocaleString()} FCFA</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-end">
                      <div>
                        <span className="font-black text-slate-400 text-[9px] uppercase tracking-widest block mb-1">Give this PIN to Customer</span>
                        <span className="font-black text-eas-blue text-2xl tracking-[0.2em] bg-eas-blue/10 px-3 py-1 rounded-lg">{((parseInt(selected.db_id) * 837 + 1492) % 9000 + 1000).toString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-400 text-[10px] uppercase tracking-widest block mb-1">{t('total_cod') || 'Total (COD)'}</span>
                        <span className="font-black text-emerald-400 text-xl">{selected.total.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Timeline */}
                  <div className="bg-slate-800/60 rounded-[1.5rem] border border-white/5 p-6">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">{t('delivery_stage') || 'Delivery Stage'}</p>
                    <div className="space-y-4">
                      {STAGES.map((s, i) => {
                        const done   = i < si;
                        const active = i === si;
                        return (
                          <div key={s.key} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                              done   ? `${s.color} border-transparent` :
                              active ? `bg-transparent border-white shadow-lg shadow-white/10 scale-110` :
                                       'bg-transparent border-white/10'
                            }`}>
                              {done ? <CheckCheck size={14} className="text-white" /> :
                               active ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> :
                               <div className="w-2 h-2 rounded-full bg-white/20" />}
                            </div>
                            <span className={`font-black text-sm uppercase tracking-wide ${
                              active ? 'text-white' : done ? 'text-slate-400' : 'text-white/20'
                            }`}>{t(s.labelKey) || s.defaultLabel}</span>
                            {active && <span className="ml-auto text-[9px] font-black text-white bg-white/10 px-2 py-1 rounded-lg uppercase tracking-widest">{t('current') || 'Current'}</span>}
                          </div>
                        );
                      })}
                    </div>

                    {si < STAGES.length - 1 ? (
                      <button
                        onClick={() => advanceStage(selected.id)}
                        className="mt-6 w-full py-4 bg-eas-blue text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-eas-blue/30"
                      >
                        <Navigation size={18} />
                        {t('mark_as') || 'Mark as:'} {t(STAGES[si + 1].labelKey) || STAGES[si + 1].defaultLabel}
                      </button>
                    ) : (
                      <div className="mt-6 w-full py-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <CheckCheck size={18} /> {t('delivery_complete') || 'Delivery Complete!'}
                      </div>
                    )}

                    {selected.stage !== 'delivered' && (
                      <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Update ETA to Arrival</span>
                          <span className="text-sm font-black text-eas-blue">{selected.estimated_minutes || 20}m</span>
                        </div>
                        <input 
                          type="range" min="1" max="60" 
                          value={selected.estimated_minutes || 20} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setSel({ ...selected, estimated_minutes: val });
                            const isLocalhost = isLocalHost();
                            if (isLocalhost) {
                              fetch(`/api/orders/${selected.db_id}/status`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ estimated_minutes: val })
                              }).catch(() => {});
                            }
                          }}
                          className="w-full accent-eas-blue"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════
   LOGIN SCREEN  (with Register tab)
═══════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const { t } = useLanguage();
  const [screen, setScreen]           = useState('login'); // 'login' | 'register' | 'submitted'
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [pin, setPin]                 = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [agents, setAgents]           = useState([]);

  useEffect(() => {
    async function loadAgents() {
      try {
        const res = await apiFetch('/api/public/agents');
        if (res.ok) {
          const data = await res.json();
          setAgents(data);
        }
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
    }
    loadAgents();
  }, []);

  /* ── Registration state ── */
  const [form, setForm] = useState({
    fullName: '', phone: '', dob: '', email: '',
    address: '', plateNumber: '', vehicleName: '',
  });
  const [photo, setPhoto]     = useState(null);   // base64 preview
  const [regError, setRegErr] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [generatedPin, setGeneratedPin] = useState('');
  const photoRef = useRef();

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRegister = async () => {
    const required = ['fullName','phone','dob','email','address','plateNumber','vehicleName'];
    for (const k of required) {
      if (!form[k].trim()) { setRegErr(t('fill_all_fields') || 'Please fill in all required fields'); return; }
    }
    if (!photo) { setRegErr(t('upload_photo_id') || 'Please upload your photo ID'); return; }
    setRegLoading(true);
    setRegErr('');
    try {
      const res = await apiFetch('/api/public/agents/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.fullName,
          phone: form.phone,
          dob: form.dob,
          email: form.email,
          address: form.address,
          plate_number: form.plateNumber,
          vehicle_name: form.vehicleName,
          photo_id: photo
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedPin(data.pin);
        setScreen('submitted');
      } else {
        const errData = await res.json().catch(() => ({}));
        setRegErr(errData.error || 'Failed to submit registration. Please try again.');
      }
    } catch (err) {
      setRegErr('Connection error. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedAgent) { setError(t('select_name_first') || 'Please select your name first'); return; }
    setLoading(true);
    try {
      const res = await apiFetch('/api/public/agents/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: selectedAgent.id, pin })
      });
      if (res.ok) {
        const data = await res.json();
        onLogin(data.agent);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || t('wrong_pin') || 'Wrong PIN. Please try again.');
        setPin('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  /* ─────────── SUBMITTED ─────────── */
  if (screen === 'submitted') return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} className="space-y-6 max-w-sm">
        <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tighter">{t('application_submitted') || 'Application Submitted!'}</h2>
          <p className="text-sm font-bold text-slate-400 mt-3 leading-relaxed">
            {t('registration_received1') || 'Your registration for'} <span className="text-white">{form.fullName}</span> {t('registration_received2') || 'has been received.'}<br/>
            {t('registration_review') || 'Our team will review and approve your account within'} <span className="text-eas-blue">24–48 {t('hours') || 'hours'}</span>.
          </p>
        </div>
        {photo && <img src={photo} alt="Agent" className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-white/10" />}
        <div className="bg-slate-900 rounded-2xl p-5 text-left space-y-2 border border-white/5">
          {[[t('name') || 'Name', form.fullName],[t('phone') || 'Phone', form.phone],[t('vehicle') || 'Vehicle', form.vehicleName],[t('plate') || 'Plate', form.plateNumber]].map(([l,v])=>(
            <div key={l} className="flex justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{l}</span>
              <span className="text-xs font-bold text-white">{v}</span>
            </div>
          ))}
          {generatedPin && (
            <div className="flex justify-between border-t border-white/5 pt-2 mt-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Temporary Pin</span>
              <span className="text-xs font-extrabold text-emerald-400">{generatedPin}</span>
            </div>
          )}
        </div>
        <button onClick={() => setScreen('login')}
          className="w-full py-4 bg-eas-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
          <LogIn size={18} /> {t('go_to_login') || 'Go to Login'}
        </button>
      </motion.div>
    </div>
  );

  /* ─────────── REGISTER FORM ─────────── */
  if (screen === 'register') return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} className="flex items-center gap-4 pt-2">
          <button onClick={() => setScreen('login')} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">{t('agent_registration') || 'Agent Registration'}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SWTO-DELIVER {t('network') || 'Network'}</p>
          </div>
        </motion.div>

        {/* Photo upload */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
          className="bg-slate-900 rounded-[1.5rem] border border-white/5 p-6 flex flex-col items-center gap-4">
          <div
            onClick={() => photoRef.current.click()}
            className="relative w-28 h-28 rounded-[1.5rem] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer hover:border-eas-blue transition-all overflow-hidden"
          >
            {photo
              ? <img src={photo} alt="preview" className="w-full h-full object-cover absolute inset-0" />
              : <><Camera size={28} className="text-slate-500" /><span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-2">{t('upload_photo') || 'Upload Photo'}</span></>
            }
            {photo && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white" />
              </div>
            )}
          </div>
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
            {t('tap_to_upload') || 'Tap to upload profile photo'}
          </p>
        </motion.div>

        {/* Personal Info */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          className="bg-slate-900 rounded-[1.5rem] border border-white/5 p-6 space-y-4">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('personal_info') || 'Personal Information'}</p>

          {[
            { key:'fullName',    label:t('full_name') || 'Full Name',       icon:User,     type:'text',     ph:t('eg_full_name') || 'e.g. Marcus Okafor'         },
            { key:'phone',       label:t('phone_number') || 'Phone Number',    icon:Phone,    type:'tel',      ph:t('eg_phone') || 'e.g. +225 07 00 000 000'    },
            { key:'dob',         label:t('date_of_birth') || 'Date of Birth',   icon:Calendar, type:'date',     ph:''                           },
            { key:'email',       label:t('email_address') || 'Email Address',   icon:Mail,     type:'email',    ph:t('eg_email') || 'agent@example.com'          },
            { key:'address',     label:t('home_address') || 'Home Address',    icon:Home,     type:'text',     ph:t('eg_address') || 'Street, City, Country'      },
          ].map(({ key, label, icon: Icon, type, ph }) => (
            <div key={key}>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={type} value={form[key]} placeholder={ph}
                  onChange={e => { setForm({...form,[key]:e.target.value}); setRegErr(''); }}
                  className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-eas-blue focus:ring-4 focus:ring-eas-blue/10 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Vehicle Info */}
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}
          className="bg-slate-900 rounded-[1.5rem] border border-white/5 p-6 space-y-4">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t('vehicle_info') || 'Vehicle Information'}</p>

          {[
            { key:'vehicleName', label:t('vehicle_name_model') || 'Vehicle Name / Model', icon:Car,  ph:t('eg_vehicle_name') || 'e.g. Honda PCX 150'  },
            { key:'plateNumber', label:t('license_plate_number') || 'Plate Number',         icon:Hash, ph:t('eg_plate_number') || 'e.g. AB 1234 CI'      },
          ].map(({ key, label, icon: Icon, ph }) => (
            <div key={key}>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text" value={form[key]} placeholder={ph}
                  onChange={e => { setForm({...form,[key]:e.target.value}); setRegErr(''); }}
                  className="w-full pl-10 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:border-eas-blue focus:ring-4 focus:ring-eas-blue/10 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {regError && (
            <motion.div initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-bold">
              <AlertCircle size={16} /> {regError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <motion.button
          initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
          onClick={handleRegister} disabled={regLoading}
          className="w-full py-4 bg-eas-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-eas-blue/30 flex items-center justify-center gap-3 disabled:opacity-60 mb-10"
        >
          {regLoading ? <RefreshCw size={20} className="animate-spin" /> : <><UserPlus size={20} /> {t('submit_registration') || 'Submit Registration'}</>}
        </motion.button>
      </div>
    </div>
  );

  /* ─────────── LOGIN ─────────── */
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
        <div className="w-20 h-20 bg-eas-blue rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-eas-blue/30">
          <Bike size={40} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tighter">SWTO<span className="text-eas-blue">-DELIVER</span></h1>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">{t('delivery_agent_portal') || 'Delivery Agent Portal'}</p>
      </motion.div>

      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
        className="w-full max-w-sm bg-slate-900 rounded-[2rem] border border-white/5 p-8 space-y-6 shadow-2xl"
      >
        {/* Agent selector */}
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Select Your Name</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {agents.map(a => (
              <button key={a.id} onClick={() => { setSelectedAgent(a); setError(''); }}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all ${
                  selectedAgent?.id === a.id ? 'border-eas-blue bg-eas-blue/10' : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                <div className="text-left">
                  <p className="font-black text-white text-sm">{a.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{a.zone}</p>
                </div>
                {selectedAgent?.id === a.id && <CheckCircle2 size={18} className="text-eas-blue ml-auto" />}
              </button>
            ))}
            {agents.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-4">No active agents found.</p>
            )}
          </div>
        </div>

        {/* PIN input */}
        <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{t('enter_your_pin') || 'Enter Your PIN'}</p>
          <input
            type="password" maxLength={6} value={pin}
            onChange={e => { setPin(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="••••"
            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-center text-xl tracking-[0.5em] outline-none focus:border-eas-blue focus:ring-4 focus:ring-eas-blue/10 transition-all"
          />
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0,y:-4 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-bold">
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login button */}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-4 bg-eas-blue text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-eas-blue/30 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {loading ? <RefreshCw size={20} className="animate-spin" /> : <><LogIn size={20} /> Sign In</>}
        </button>

        {/* Register link */}
        <div className="border-t border-white/5 pt-5 text-center space-y-3">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t('new_to_swto_deliver') || 'New to SWTO-DELIVER?'}</p>
          <button onClick={() => setScreen('register')}
            className="w-full py-3.5 bg-white/5 border border-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
            <UserPlus size={16} /> {t('register_as_agent') || 'Register as Agent'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

