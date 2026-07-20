import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, MessageSquare, Truck, ArrowLeft, Search, CheckCircle, RefreshCw, Navigation, Award, Calendar, Clock, Bike, Star, Loader2, PackageOpen, HelpCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileDock from '../components/MobileDock';
import CartDrawer from '../components/CartDrawer';

// Coordinates lookup for major Ivorian cities
const cityCoords = {
  'Abidjan': [5.3484, -3.9788],
  'Yamoussoukro': [6.8276, -5.2755],
  'Bouaké': [7.6931, -5.0303],
  'San Pédro': [4.7485, -6.6363],
  'Daloa': [6.8774, -6.4502],
  'Korhogo': [9.4580, -5.6292],
  'Man': [7.4125, -7.5537],
  'Gagnoa': [6.1319, -5.9472],
  'Grand-Bassam': [5.2104, -3.7388],
  'Assinie': [5.1278, -3.2842],
  'Abengourou': [6.7272, -3.4964]
};

// Delivery stages
const STAGES = [
  { key: 'placed', labelFr: 'Commande reçue', labelEn: 'Order Placed', descFr: 'Votre commande a été enregistrée avec succès.', descEn: 'Your order was successfully registered.' },
  { key: 'assigned', labelFr: 'Livreur attribué', labelEn: 'Rider Assigned', descFr: 'Un livreur a été assigné à votre commande.', descEn: 'A delivery agent has been assigned to your order.' },
  { key: 'picked_up', labelFr: 'Colis récupéré', labelEn: 'Package Picked Up', descFr: 'Le livreur a récupéré votre colis au dépôt.', descEn: 'Le livreur a récupéré votre colis.' },
  { key: 'on_the_way', labelFr: 'En cours de livraison', labelEn: 'Out for Delivery', descFr: 'Votre colis est en route vers votre adresse.', descEn: 'Your package is on its way to your address.' },
  { key: 'nearby', labelFr: 'Livreur tout proche', labelEn: 'Almost There', descFr: 'Le livreur arrive bientôt dans votre secteur !', descEn: 'The rider will arrive in your neighborhood shortly!' },
  { key: 'delivered', labelFr: 'Commande livrée', labelEn: 'Delivered', descFr: 'Commande livrée avec succès ! Merci de votre confiance.', descEn: 'Order delivered successfully! Thank you.' }
];

/* ── Leaflet Interactive Map Component ── */
const LeafletMap = ({ destLat, destLng, agentLat, agentLng, city = 'Abidjan' }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const destMarkerRef = useRef(null);
  const agentMarkerRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    // Dynamic styles inject
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

      const centerCoords = cityCoords[city] || [5.3484, -3.9788];
      const defaultLat = destLat || centerCoords[0];
      const defaultLng = destLng || centerCoords[1];

      mapInstanceRef.current = window.L.map(mapRef.current, {
        zoomControl: false,
        scrollWheelZoom: true
      }).setView([defaultLat, defaultLng], 13);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(mapInstanceRef.current);

      const homeIcon = window.L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #0000ff; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,255,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      destMarkerRef.current = window.L.marker([defaultLat, defaultLng], { icon: homeIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup("Votre Adresse de Livraison / Delivery Address");

      // Draw rider if available
      if (agentLat && agentLng) {
        const motoIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M3 17.5 8 10h5l4 7.5 M10 10l3-5h4l-3 5 M8 15h9"/></svg></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Livreur en route / Rider Location");

        // Routing path line
        lineRef.current = window.L.polyline([[agentLat, agentLng], [defaultLat, defaultLng]], {
          color: '#0000ff',
          weight: 4,
          dashArray: '5, 8',
          opacity: 0.7
        }).addTo(mapInstanceRef.current);

        const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.3));
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

  // Update positions dynamically when props change
  useEffect(() => {
    if (!window.L || !mapInstanceRef.current) return;

    const centerCoords = cityCoords[city] || [5.3484, -3.9788];
    const defaultLat = destLat || centerCoords[0];
    const defaultLng = destLng || centerCoords[1];

    if (destMarkerRef.current) {
      destMarkerRef.current.setLatLng([defaultLat, defaultLng]);
    }

    if (agentLat && agentLng) {
      if (agentMarkerRef.current) {
        agentMarkerRef.current.setLatLng([agentLat, agentLng]);
      } else {
        const motoIcon = window.L.divIcon({
          className: 'custom-div-icon',
          html: `<div style="background-color: #10b981; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M3 17.5 8 10h5l4 7.5 M10 10l3-5h4l-3 5 M8 15h9"/></svg></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Livreur en route / Rider Location");
      }

      if (lineRef.current) {
        lineRef.current.setLatLngs([[agentLat, agentLng], [defaultLat, defaultLng]]);
      } else {
        lineRef.current = window.L.polyline([[agentLat, agentLng], [defaultLat, defaultLng]], {
          color: '#0000ff',
          weight: 4,
          dashArray: '5, 8',
          opacity: 0.7
        }).addTo(mapInstanceRef.current);
      }

      const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.3));
    } else {
      if (agentMarkerRef.current) {
        mapInstanceRef.current.removeLayer(agentMarkerRef.current);
        agentMarkerRef.current = null;
      }
      if (lineRef.current) {
        mapInstanceRef.current.removeLayer(lineRef.current);
        lineRef.current = null;
      }
      mapInstanceRef.current.setView([defaultLat, defaultLng], 13);
    }
  }, [destLat, destLng, agentLat, agentLng, city]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '1.5rem', zIndex: 1 }} />;
};

/* ── Main OrderTrackingPage Component ── */
export default function OrderTrackingPage() {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();

  const [orderIdInput, setOrderIdInput] = useState('');
  const [currentOrderId, setCurrentOrderId] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Dynamic order states
  const [order, setOrder] = useState(null);
  const [rider, setRider] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract orderId parameters
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId') || orderId;
    if (orderIdParam) {
      setOrderIdInput(orderIdParam);
      setCurrentOrderId(orderIdParam);
    }
  }, [searchParams, orderId]);

  // Query order and rider details
  useEffect(() => {
    if (!currentOrderId) {
      setOrder(null);
      setRider(null);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setErrorMsg('');
        let orderData = null;

        if (supabase) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('id', currentOrderId)
            .single();

          if (!error && data) {
            orderData = data;
          }
        }

        // Fallback local API
        if (!orderData) {
          const res = await apiFetch(`/api/orders/${currentOrderId}/tracking`);
          if (res.ok) {
            orderData = await res.json();
          }
        }

        if (orderData) {
          setOrder(orderData);
          
          // Fetch rider info if driver is assigned
          if (orderData.delivery_agent_id) {
            let riderData = null;
            if (supabase) {
              const { data: dbRider, error: riderErr } = await supabase
                .from('delivery_agents')
                .select('*')
                .eq('id', orderData.delivery_agent_id)
                .single();
              if (!riderErr && dbRider) {
                riderData = dbRider;
              }
            }
            setRider(riderData || {
              name: 'Koffi Kouadio',
              phone: '+225 07 88 44 21 09',
              vehicle_name: 'Scooter Yamaha S-Max',
              plate_number: 'CI-8892-A',
              rating: 4.8
            });
          } else {
            setRider(null);
          }
        } else {
          setErrorMsg(lang === 'fr' ? 'ID de commande introuvable.' : 'Order ID not found.');
          setOrder(null);
          setRider(null);
        }
      } catch (err) {
        console.error('Error loading order tracking:', err);
        setErrorMsg(lang === 'fr' ? 'Erreur de connexion aux serveurs.' : 'Server connection error.');
      }
    };

    fetchOrderDetails();

    // Poll every 6 seconds to update the courier location on the map in real-time
    const interval = setInterval(fetchOrderDetails, 6000);
    return () => clearInterval(interval);

  }, [currentOrderId, lang]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (orderIdInput.trim()) {
      setCurrentOrderId(orderIdInput.trim());
    }
  };

  const getActiveStageIndex = () => {
    if (!order) return 0;
    const stage = order.tracking_stage || 'placed';
    const index = STAGES.findIndex(s => s.key === stage);
    return index !== -1 ? index : 0;
  };

  const orderItems = order?.items ? (() => {
    try {
      return JSON.parse(order.items);
    } catch (e) {
      return [];
    }
  })() : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-500 pb-20">
      <Header onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <main className="max-w-6xl mx-auto px-4 py-8 relative">
        <div className="absolute top-10 right-4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Back navigation & Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer shadow-sm hover:scale-105"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
              {lang === 'fr' ? 'Suivi de Commande' : 'Order Tracking'}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 font-bold">
              {lang === 'fr' ? 'Consultez la livraison en temps réel' : 'Track your package in real-time'}
            </p>
          </div>
        </div>

        {/* Tracking Search Input */}
        <form onSubmit={handleSearch} className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2rem] p-5 mb-8 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input
              type="text"
              placeholder={lang === 'fr' ? 'Entrez l\'ID de votre commande (ex: 5, 12, ...)' : 'Enter your Order ID (e.g. 5, 12, ...)'}
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-eas-blue focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-10 py-4 bg-eas-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 shrink-0 border-none"
          >
            {lang === 'fr' ? 'Suivre Commande' : 'Track Package'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center uppercase tracking-wider mb-8">
            ⚠️ {errorMsg}
          </div>
        )}

        {order ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Interactive Leaflet Map Panel */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {lang === 'fr' ? '📍 Carte en direct' : '📍 Live Delivery Map'}
                </h3>
                <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {lang === 'fr' ? 'Mise à jour en direct' : 'Live Syncing'}
                </span>
              </div>
              
              <div className="w-full h-[450px] bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden shadow-inner">
                <LeafletMap 
                  destLat={order.destination_lat} 
                  destLng={order.destination_lng} 
                  agentLat={order.agent_lat} 
                  agentLng={order.agent_lng}
                  city={order.city}
                />
              </div>
            </div>

            {/* Side Panel: Order info & steps */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Rider / Driver Details (Dynamic) */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5 block">
                  {lang === 'fr' ? 'Courier assigné' : 'Your Courier'}
                </h3>

                {rider ? (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 text-left">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                        {rider.avatar ? (
                          <img src={rider.avatar} alt={rider.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-eas-blue/10 flex items-center justify-center text-eas-blue font-black text-lg">
                            {rider.name?.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase">{rider.name}</h4>
                          <span className="text-[10px] font-black text-amber-500 flex items-center shrink-0">
                            <Star size={11} className="fill-current text-amber-500" />
                            <span className="ml-0.5">{rider.rating || '5.0'}</span>
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 truncate">{rider.vehicle_name || 'Scooter'}</p>
                        {rider.plate_number && (
                          <span className="inline-block mt-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded text-[8px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                            {rider.plate_number}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <a
                        href={`tel:${rider.phone}`}
                        className="flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-350 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Phone size={13} className="text-eas-blue" />
                        <span>{lang === 'fr' ? 'Appeler' : 'Call rider'}</span>
                      </a>
                      
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('open-support-chat'))}
                        className="flex items-center justify-center gap-2 py-4 bg-eas-blue text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] border-none cursor-pointer"
                      >
                        <MessageSquare size={13} />
                        <span>{lang === 'fr' ? 'Assistance' : 'Get Help'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 flex items-center justify-center mx-auto mb-3 text-slate-400 animate-pulse">
                      <Bike size={20} className="text-eas-blue" />
                    </div>
                    <p className="text-[10px] text-slate-450 dark:text-slate-550 uppercase tracking-wider font-extrabold">
                      {lang === 'fr' ? 'Attribution du livreur en cours...' : 'Assigning rider shortly...'}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6 block">
                  {lang === 'fr' ? 'Statut de livraison' : 'Timeline'}
                </h3>

                <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800 text-left">
                  {STAGES.map((stg, idx) => {
                    const activeIdx = getActiveStageIndex();
                    const isCompleted = idx < activeIdx;
                    const isActive = idx === activeIdx;
                    
                    return (
                      <div key={stg.key} className="flex gap-4 items-start relative z-10 text-left">
                        <div className={`w-8 h-8 rounded-full border-4 border-white dark:border-[#020617] flex items-center justify-center shrink-0 transition-all ${
                          isCompleted ? 'bg-emerald-500' : isActive ? 'bg-eas-blue scale-110 shadow-lg shadow-blue-500/20' : 'bg-slate-200 dark:bg-slate-800'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle size={12} className="text-white" />
                          ) : isActive ? (
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-xs font-extrabold leading-none ${isActive ? 'text-eas-blue font-black' : isCompleted ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-550'}`}>
                            {lang === 'fr' ? stg.labelFr : stg.labelEn}
                          </p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium leading-relaxed mt-1">
                            {lang === 'fr' ? stg.descFr : stg.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Info Summary */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-5 block">
                  {lang === 'fr' ? 'Détails commande' : 'Order Info'}
                </h3>
                
                <div className="space-y-3.5 text-xs text-left">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider text-[10px]">ID Commande</span>
                    <span className="font-black text-slate-900 dark:text-white uppercase select-all"># {order.id}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-white/5">
                    <span className="font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider text-[10px]">Montant Total</span>
                    <span className="font-black text-eas-blue text-sm">{(order.total_amount || order.total || 0).toLocaleString()} {order.currency || 'FCFA'}</span>
                  </div>

                  <div className="pb-2 border-b border-slate-100 dark:border-white/5 space-y-1">
                    <span className="font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider text-[10px]">Adresse de livraison</span>
                    <p className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-normal">{order.address}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider text-[10px] block">{lang === 'fr' ? 'Articles commandés' : 'Items'}</span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {orderItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-[10px] font-bold text-slate-650 dark:text-slate-400 py-1 bg-slate-50 dark:bg-slate-950 px-3 rounded-lg border border-slate-100 dark:border-white/5">
                          <span className="truncate pr-4">{item.name}</span>
                          <span className="shrink-0 font-extrabold text-slate-900 dark:text-white">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Awaiting screen */
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2.5rem] p-16 text-center shadow-sm dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] space-y-6 max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-eas-blue/5 border border-eas-blue/15 flex items-center justify-center mx-auto shadow-md relative">
              <div className="absolute inset-0 bg-eas-blue/10 rounded-3xl blur-xl animate-pulse" />
              <Truck size={36} className="text-eas-blue relative animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider italic">
                {lang === 'fr' ? 'Aucune commande suivie' : 'No Order Tracked'}
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 max-w-md mx-auto leading-relaxed font-bold">
                {lang === 'fr' 
                  ? 'Entrez l\'ID de votre commande ci-dessus pour afficher la carte en temps réel et suivre votre livreur.' 
                  : 'Enter your order identifier in the search bar above to see the real-time map and track your driver.'}
              </p>
            </div>
          </div>
        )}
      </main>

      <MobileDock onCartOpen={() => setIsCartOpen(true)} />
    </div>
  );
}
