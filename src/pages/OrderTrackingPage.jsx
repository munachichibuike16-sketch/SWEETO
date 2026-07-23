import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Phone, MessageSquare, Truck, ArrowLeft, Search, CheckCircle, RefreshCw, Navigation, Award, Calendar, Clock, Bike, Star, Loader2, PackageOpen, HelpCircle, ShieldCheck, User } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';
import { playSound } from '../utils/sound';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
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

  // Confirmation states
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isValidatingPin, setIsValidatingPin] = useState(false);
  const { showToast, settings } = useStore();
  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));

  // Extract orderId parameters
  useEffect(() => {
    const orderIdParam = searchParams.get('orderId') || orderId;
    if (orderIdParam) {
      const cleanId = String(orderIdParam).toLowerCase().trim();
      if (cleanId && cleanId !== 'null' && cleanId !== 'undefined') {
        setOrderIdInput(orderIdParam);
        setCurrentOrderId(orderIdParam);
      }
    }
  }, [searchParams, orderId]);

  // Query order and rider details
  useEffect(() => {
    const cleanId = String(currentOrderId).toLowerCase().trim();
    if (!currentOrderId || cleanId === 'null' || cleanId === 'undefined' || cleanId === '') {
      setOrder(null);
      setRider(null);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setErrorMsg('');
        const lookupId = currentOrderId.toUpperCase().replace('#', '').trim();

        if (lookupId === 'ORD-9824' || lookupId === '9824') {
          setOrder({
            id: 'ORD-9824',
            status: 'on_the_way',
            tracking_stage: 'on_the_way',
            created_at: '2026-07-22T09:15:00Z',
            total_amount: 349.49,
            address: '742 Evergreen Terrace, San Francisco, CA',
            city: 'San Francisco',
            items: JSON.stringify([
              { name: 'Sweeto Premium Wireless Headset', quantity: 1, price: 249.99 },
              { name: 'Dual Comfort Headband Cushion', quantity: 2, price: 49.75 }
            ])
          });
          setRider({
            name: 'Marcus Vance',
            phone: '+225 07 00 00 98 24',
            vehicle_name: 'Apex Express Van #402',
            plate_number: 'CI-9824-A',
            rating: 4.9
          });
          return;
        }

        if (lookupId === 'ORD-7210' || lookupId === '7210') {
          setOrder({
            id: 'ORD-7210',
            status: 'delivered',
            tracking_stage: 'delivered',
            created_at: '2026-07-20T14:30:00Z',
            total_amount: 129.00,
            address: '123 Innovation Way, Suite 400, San Francisco, CA',
            city: 'San Francisco',
            items: JSON.stringify([
              { name: 'Sweeto Ergonomic Mechanical Keyboard', quantity: 1, price: 129.00 }
            ])
          });
          setRider({
            name: 'Sarah Connor',
            phone: '+225 07 00 00 72 10',
            vehicle_name: 'CyberCycle E-Bike',
            plate_number: 'CI-7210-B',
            rating: 5.0
          });
          return;
        }

        if (lookupId === 'ORD-4102' || lookupId === '4102') {
          setOrder({
            id: 'ORD-4102',
            status: 'assigned',
            tracking_stage: 'assigned',
            created_at: '2026-07-23T11:00:00Z',
            total_amount: 89.95,
            address: 'Cocody Boulevard Latrille, Abidjan',
            city: 'Abidjan',
            items: JSON.stringify([
              { name: 'Sweeto Supercharge Charging Pad', quantity: 1, price: 49.95 },
              { name: 'Braided Type-C Premium Cable', quantity: 2, price: 20.00 }
            ])
          });
          setRider({
            name: 'Frank Martin',
            phone: '+225 07 00 00 41 02',
            vehicle_name: 'Transporter Sedan #007',
            plate_number: 'CI-4102-C',
            rating: 4.7
          });
          return;
        }

        let orderData = null;

        if (supabase) {
          const { data, error } = await Promise.resolve(supabase
            .from('orders')
            .select('*')
            .eq('id', currentOrderId)
            .single());

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
              const { data: dbRider, error: riderErr } = await Promise.resolve(supabase
                .from('delivery_agents')
                .select('*')
                .eq('id', orderData.delivery_agent_id)
                .single());
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

  const handleConfirmDelivery = async (e) => {
    e.preventDefault();
    if (!order) return;

    // Formula matching the delivery rider console
    const expectedPin = ((parseInt(order.id) * 837 + 1492) % 9000 + 1000).toString();

    if (enteredPin.trim() !== expectedPin) {
      setPinError(lang === 'fr' ? 'Code PIN incorrect. Veuillez vérifier avec le livreur.' : 'Incorrect PIN code. Please check with your delivery rider.');
      return;
    }

    setPinError('');
    setIsValidatingPin(true);

    try {
      if (supabase) {
        const { error } = await supabase
          .from('orders')
          .update({ 
            status: 'delivered', 
            tracking_stage: 'delivered' 
          })
          .eq('id', order.id);

        if (error) throw error;
      }

      // Local SQLite fallback API
      await apiFetch(`/api/orders/${order.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered', tracking_stage: 'delivered' })
      }).catch(() => {});

      // Update local state
      setOrder(prev => prev ? { ...prev, status: 'delivered', tracking_stage: 'delivered' } : null);
      if (typeof showToast === 'function') {
        showToast(lang === 'fr' ? 'Livraison confirmée avec succès ! ✓' : 'Delivery successfully confirmed! ✓', 'success');
      }
      playSound('success');
      setEnteredPin('');
    } catch (err) {
      console.error('Error confirming delivery with PIN:', err);
      setPinError(lang === 'fr' ? 'Erreur de communication. Réessayez.' : 'Connection error. Please try again.');
    } finally {
      setIsValidatingPin(false);
    }
  };

  const formatPlacedDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return lang === 'fr' ? '22 Juillet, 2026' : 'July 22, 2026';
    }
  };

   const getStepTime = (createdTime, offsetMinutes) => {
    try {
      const d = new Date(createdTime);
      d.setMinutes(d.getMinutes() + offsetMinutes);
      if (lang === 'fr') {
        const day = d.getDate().toString().padStart(2, '0');
        const months = ['juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.', 'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin'];
        const month = months[d.getMonth()] || 'juil.';
        const hrs = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        return `${day} ${month}, ${hrs}h${mins}`;
      } else {
        return d.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {
      return '';
    }
  };

  const isStepDone = (stepIdx) => {
    if (!order) return false;
    const status = (order.status || '').toLowerCase();
    const stage = (order.tracking_stage || '').toLowerCase();
    
    if (stepIdx === 1) return true;
    if (stepIdx === 2) {
      return ['processing', 'assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered'].includes(status) || 
             ['assigned', 'picked_up', 'on_the_way', 'nearby', 'delivered'].includes(stage);
    }
    if (stepIdx === 3) {
      return ['picked_up', 'on_the_way', 'nearby', 'delivered'].includes(status) || 
             ['picked_up', 'on_the_way', 'nearby', 'delivered'].includes(stage);
    }
    if (stepIdx === 4) {
      return ['on_the_way', 'nearby', 'delivered'].includes(status) || 
             ['on_the_way', 'nearby', 'delivered'].includes(stage);
    }
    if (stepIdx === 5) {
      return status === 'delivered' || stage === 'delivered';
    }
    return false;
  };

  const getStatusBadge = () => {
    if (!order) return null;
    const status = (order.status || '').toLowerCase();
    if (status === 'delivered') {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <CheckCircle size={12} />
          {lang === 'fr' ? 'LIVRÉ' : 'DELIVERED'}
        </span>
      );
    }
    if (status === 'on_the_way' || order.tracking_stage === 'on_the_way') {
      return (
        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-650 dark:text-indigo-400 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Truck size={12} />
          {lang === 'fr' ? 'EN TRANSIT' : 'IN TRANSIT'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
        <Clock size={12} />
        {lang === 'fr' ? 'TRAITEMENT' : 'PROCESSING'}
      </span>
    );
  };

  const getLiveStatusTitle = () => {
    if (!order) return '';
    if (order.status === 'delivered') {
      return lang === 'fr' ? 'COLIS LIVRÉ' : 'PACKAGE DELIVERED';
    }
    return lang === 'fr' ? 'COLIS EN COURS DE LIVRAISON' : 'Package on movement';
  };

  const getLiveStatusDesc = () => {
    if (!order) return '';
    if (order.status === 'delivered') {
      return lang === 'fr' ? 'Livré à destination' : 'Arrived at destination';
    }
    return lang === 'fr' ? 'à 1,3 km du lieu de livraison' : '0.8 miles away from delivery location';
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
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
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

        {errorMsg && (
          <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center uppercase tracking-wider mb-8">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Search Panel Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm text-center relative max-w-4xl mx-auto mb-8">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <MapPin size={22} className="fill-current" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {lang === 'fr' ? 'SUIVEZ VOTRE COLIS' : 'Track Your Package'}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold max-w-2xl mx-auto mt-2 leading-relaxed">
            {lang === 'fr' 
              ? "Saisissez votre numéro de suivi à 8 chiffres ci-dessous pour consulter les mises à jour d'expédition en temps réel, la localisation du chauffeur et l'heure d'arrivée estimée."
              : 'Enter your 8-digit tracking number below to view real-time shipping updates, driver location, and estimated time of arrival.'}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} className="max-w-md mx-auto flex items-center gap-3 mt-6">
            <div className="relative flex-1">
              <input 
                placeholder="E.G. ORD-9824"
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 pl-11 text-xs font-bold uppercase tracking-wider outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6h16.5M3.75 12h16.5M3.75 18h16.5" />
              </svg>
            </div>
            <button 
              type="submit"
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider cursor-pointer border-none shadow-sm flex items-center gap-2 active:scale-95 transition-all"
            >
              <Search size={14} />
              <span>{lang === 'fr' ? 'PISTE' : 'Track'}</span>
            </button>
          </form>

          {/* Samples */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              {lang === 'fr' ? "ESSAYEZ DES COMMANDES D'EXEMPLE :" : 'Try sample orders:'}
            </span>
            <button
              type="button"
              onClick={() => {
                setOrderIdInput('ORD-9824');
                setCurrentOrderId('ORD-9824');
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-indigo-500/5 hover:text-indigo-650 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-xl text-slate-500 cursor-pointer transition-all"
            >
              #ORD-9824 {lang === 'fr' ? '(En transit)' : '(In Transit)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderIdInput('ORD-7210');
                setCurrentOrderId('ORD-7210');
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-emerald-500/5 hover:text-emerald-500 dark:hover:text-emerald-450 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-xl text-slate-500 cursor-pointer transition-all"
            >
              #ORD-7210 {lang === 'fr' ? '(Livré)' : '(Delivered)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderIdInput('ORD-4102');
                setCurrentOrderId('ORD-4102');
              }}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-amber-500/5 hover:text-amber-550 dark:hover:text-amber-450 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded-xl text-slate-500 cursor-pointer transition-all"
            >
              #ORD-4102 {lang === 'fr' ? '(En cours de traitement)' : '(Processing)'}
            </button>
          </div>
        </div>

        {order ? (
          <div className="space-y-8">
            {/* Tracking Progress Wizard Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 border border-slate-100 dark:border-white/5 shadow-sm max-w-4xl mx-auto text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">#{order.id}</h3>
                    {getStatusBadge()}
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-semibold mt-1">
                    {lang === 'fr' ? 'Commandée le' : 'Placed on'} {formatPlacedDate(order.created_at)} • Total: <span className="font-extrabold text-slate-705 dark:text-slate-300">{currencySymbol} {(order.total_amount || order.total || 0).toLocaleString()}</span>
                  </p>
                </div>

                {/* Estimated Delivery Container */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl min-w-[200px] text-left sm:text-right">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                    {lang === 'fr' ? 'LIVRAISON ESTIMÉE' : 'ESTIMATED DELIVERY'}
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block mt-1 flex items-center sm:justify-end gap-1.5">
                    <Clock size={13} />
                    {order.status === 'delivered' 
                      ? (lang === 'fr' ? 'Livraison complétée' : 'Completed') 
                      : (lang === 'fr' ? "Aujourd'hui avant 17h00" : 'Today by 5:00 PM')}
                  </span>
                </div>
              </div>

              {/* Progress Stepper Wizard */}
              <div className="pt-8 overflow-x-auto scrollbar-none">
                <div className="flex items-center justify-between min-w-[650px] relative select-none pb-4">
                  {/* Stepper background line */}
                  <div className="absolute left-8 right-8 top-[18px] h-0.5 bg-slate-100 dark:bg-slate-805/80 z-0" />
                  
                  {/* Completed steps progress line overlay */}
                  <div 
                    className="absolute left-8 top-[18px] h-0.5 bg-emerald-500 transition-all duration-500 z-0" 
                    style={{ 
                      width: order.status === 'delivered' 
                        ? '100%' 
                        : order.status === 'on_the_way' || order.tracking_stage === 'on_the_way'
                        ? '75%'
                        : order.status === 'picked_up' || order.tracking_stage === 'picked_up'
                        ? '50%'
                        : '25%' 
                    }}
                  />

                  {[
                    { labelEn: 'Order Placed', labelFr: 'COMMANDE PASSÉE', offset: 0, index: 1 },
                    { labelEn: 'Processing & Packed', labelFr: 'TRAITEMENT ET EMBALLAGE', offset: 45, index: 2 },
                    { labelEn: 'In Transit', labelFr: 'EN TRANSIT', offset: 120, index: 3 },
                    { labelEn: 'Out for Delivery', labelFr: 'EN COURS DE LIVRAISON', offset: 285, index: 4 },
                    { labelEn: 'Delivered', labelFr: 'LIVRÉ', offset: 420, index: 5, last: true }
                  ].map((stepItem, idx) => {
                    const isDone = isStepDone(stepItem.index);
                    const stepTime = isDone 
                      ? getStepTime(order.created_at, stepItem.offset) 
                      : (stepItem.last ? (lang === 'fr' ? 'Estimation d\'aujourd\'hui' : 'Estimated Today') : '');
                    
                    return (
                      <div key={idx} className="flex flex-col items-center gap-3 relative z-10 flex-1 text-center">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-4 border-white dark:border-slate-900 transition-all ${
                          isDone 
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-405'
                        }`}>
                          {isDone ? '✓' : (stepItem.last ? '5' : stepItem.index)}
                        </div>
                        <div className="text-center">
                          <p className={`text-[10px] font-black uppercase tracking-wider ${
                            isDone ? 'text-slate-805 dark:text-slate-200' : 'text-slate-450 dark:text-slate-500'
                          }`}>{lang === 'fr' ? stepItem.labelFr : stepItem.labelEn}</p>
                          <p className="text-[9px] text-slate-400 dark:text-slate-505 mt-1 font-semibold">{stepTime}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid 3: Courier details & GPS simulation */}
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Courier Details Card */}
              <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2rem] p-6 shadow-sm text-left">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-4">
                  {lang === 'fr' ? 'DÉTAILS DU TRANSPORTEUR' : 'Courier Details'}
                </span>
                
                <div className="flex items-center gap-4 text-left">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-650 flex items-center justify-center shrink-0 shadow-inner">
                    <User size={24} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate uppercase">{rider?.name || 'Marcus Vance'}</h4>
                      <span className="text-[10px] font-black text-amber-500 flex items-center shrink-0">
                        <Star size={11} className="fill-current text-amber-500" />
                        <span className="ml-0.5">{rider?.rating || '4.9'}</span>
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-505 font-bold uppercase tracking-wider mt-1 truncate">
                      {lang === 'fr' && rider?.vehicle_name?.toLowerCase().includes('van')
                        ? `FOURGONNETTE ${rider?.plate_number || 'APEX EXP'}`
                        : rider?.vehicle_name || 'FOURGONNETTE APEX EXP'}
                    </p>
                  </div>
                </div>

                {/* Contact Courier button */}
                <a
                  href={`tel:${rider?.phone || '0700009824'}`}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border-none text-center block"
                >
                  <Phone size={13} className="text-indigo-600" />
                  <span>{lang === 'fr' ? 'CONTACTER LE COURSIER' : 'Contact Courier'}</span>
                </a>
              </div>

              {/* Live GPS Simulation Card */}
              <div className="md:col-span-8 bg-[#040814] rounded-[2rem] p-6 border border-slate-850 text-white relative min-h-[260px] overflow-hidden flex flex-col justify-between shadow-sm text-left select-none">
                {/* Simulated GPS grid path background */}
                <div className="absolute inset-0 z-0 opacity-15 pointer-events-none bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px]"></div>
                
                {/* SVG Animated Path representation */}
                <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-40" viewBox="0 0 400 200">
                  <path 
                    d="M 50 150 Q 150 50 250 150 T 380 50" 
                    fill="none" 
                    stroke="#1e3a8a" 
                    strokeWidth="3" 
                    strokeDasharray="6 6" 
                  />
                  <path 
                    d="M 50 150 Q 150 50 250 150 T 380 50" 
                    fill="none" 
                    stroke="#4338ca" 
                    strokeWidth="3.5" 
                    className="animate-[dash_10s_linear_infinite]" 
                    strokeDasharray="120"
                    strokeDashoffset="120"
                  />
                  <circle cx="380" cy="50" r="6" fill="#3b82f6" />
                </svg>

                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    {lang === 'fr' ? 'SUIVI GPS EN DIRECT' : 'LIVE GPS TRACKING'}
                  </span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    {lang === 'fr' ? 'SIGNAL GPS : ACTIF' : 'GPS Signal: Active'}
                  </span>
                </div>

                <div className="relative z-10 my-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Destination</span>
                  <h4 className="text-sm font-extrabold text-white mt-1 leading-normal">
                    {order.address}
                  </h4>
                </div>

                {/* Inset float indicator card */}
                <div className="relative z-10 p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex items-center gap-3 backdrop-blur-md max-w-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wide text-white">{getLiveStatusTitle()}</h5>
                    <p className="text-[10px] text-slate-400 font-bold leading-none mt-1">
                      {getLiveStatusDesc()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Awaiting search display placeholder */
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-white/5 rounded-[2rem] p-16 text-center shadow-sm max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150/40 dark:border-white/5 flex items-center justify-center mx-auto shadow-md relative">
              <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl blur-xl animate-pulse" />
              <Truck size={36} className="text-indigo-600 relative animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-wider italic">
                {lang === 'fr' ? 'Aucune commande suivie' : 'No Order Tracked'}
              </h3>
              <p className="text-xs text-slate-455 dark:text-slate-550 max-w-md mx-auto leading-relaxed font-bold">
                {lang === 'fr' 
                  ? 'Entrez le numéro de suivi de votre commande ci-dessus pour suivre votre colis.'
                  : 'Enter your order identifier in the search bar above to see the real-time map and track your driver.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-10 py-4.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all cursor-pointer border-none shadow-sm hover:scale-[1.02] active:scale-[0.98]"
            >
              {lang === 'fr' ? 'Retourner à la boutique' : 'Back to Store'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
