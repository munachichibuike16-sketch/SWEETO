import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  Award
} from 'lucide-react';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';

/* ── Leaflet Dynamic Component with Polyline route trail ── */
const LeafletMap = ({ destLat, destLng, agentLat, agentLng, history }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const destMarkerRef = useRef(null);
  const agentMarkerRef = useRef(null);
  const polylineRef = useRef(null);

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
        .bindPopup("Your Home");

      if (agentLat && agentLng) {
        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Delivery Courier");

        const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.25));
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
          .bindPopup("Delivery Courier");
      }

      const points = [];
      if (history && history.length > 0) {
        history.forEach(p => points.push([parseFloat(p.lat), parseFloat(p.lng)]));
      }
      points.push([agentLat, agentLng]);

      if (polylineRef.current) {
        polylineRef.current.setLatLngs(points);
      } else {
        polylineRef.current = window.L.polyline(points, {
          color: '#10b981',
          weight: 4,
          opacity: 0.8,
          dashArray: '5, 10'
        }).addTo(mapInstanceRef.current);
      }

      if (destMarkerRef.current && agentMarkerRef.current) {
        const group = new window.L.featureGroup([destMarkerRef.current, agentMarkerRef.current]);
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.25));
      }
    }
  }, [destLat, destLng, agentLat, agentLng, history]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '2rem', zIndex: 1 }} />;
};

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [trackingData, setTrackingData] = useState(null);

  const expectedPin = ((parseInt(orderId) * 837 + 1492) % 9000 + 1000).toString();

  const handlePinSubmit = async () => {
    if (pinInput === expectedPin) {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('orders')
          .update({ status: 'completed' })
          .eq('id', orderId);
        if (!error) {
          setOrder({ ...order, status: 'completed' });
          setPinError('');
        } else {
          throw error;
        }
      } catch (err) {
        setPinError('Failed to verify delivery. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setPinError('Incorrect code. Please ask the delivery agent.');
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) throw error;
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll for status changes every 30 seconds
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Fast coordinate and tracking history polling (every 6 seconds)
  useEffect(() => {
    let activePoll = null;

    const fetchTracking = async () => {
      try {
        // 1. Fetch current order coordinates and agent details from Supabase
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
          
        if (orderErr) throw orderErr;
        
        let agent = null;
        if (orderData.delivery_agent_id) {
          const { data: agentData } = await supabase
            .from('delivery_agents')
            .select('id, name, phone, zone, avatar, rating')
            .eq('id', orderData.delivery_agent_id)
            .single();
          agent = agentData;
        }
        
        // 2. Fetch location history trail
        const { data: historyData } = await supabase
          .from('agent_location_history')
          .select('lat, lng, created_at')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
          
        const formattedData = {
          order_id: orderData.id,
          customer_name: orderData.customer_name,
          customer_contact: orderData.customer_contact,
          status: orderData.status,
          tracking_stage: orderData.tracking_stage || 'placed',
          estimated_minutes: orderData.estimated_minutes || 20,
          destination_lat: orderData.destination_lat || 5.3484,
          destination_lng: orderData.destination_lng || -3.9788,
          agent_lat: orderData.agent_lat || null,
          agent_lng: orderData.agent_lng || null,
          agent,
          history: historyData || []
        };
        
        setTrackingData(formattedData);
        
        // If status changes on the backend, update standard state too
        if (orderData.status && order && orderData.status !== order.status) {
          setOrder(orderData);
        }
      } catch (err) {
        console.error("Failed to load tracking data from Supabase:", err);
      }
    };

    fetchTracking();
    activePoll = setInterval(fetchTracking, 6000);

    return () => {
      if (activePoll) clearInterval(activePoll);
    };
  }, [orderId, order?.status]);

  const steps = [
    { id: 'pending', label: t('order_placed') || 'Order Placed', desc: t('waiting_admin_confirmation') || 'Waiting for admin confirmation', icon: Clock },
    { id: 'confirmed', label: t('confirmed') || 'Confirmed', desc: t('order_verified') || 'Order verified by our team', icon: ShieldCheck },
    { id: 'shipping', label: t('on_the_way') || 'On the Way', desc: t('courier_picked_up') || 'Courier has picked up your package', icon: Truck },
    { id: 'completed', label: t('delivered') || 'Delivered', desc: t('order_successfully_received') || 'Order successfully received', icon: CheckCircle2 },
  ];

  const currentStatus = order?.status || 'pending';
  const currentIndex = steps.findIndex(s => s.id === currentStatus);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-eas-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Header />
      
      <div className="max-w-[1000px] mx-auto px-6 pt-32">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors mb-12 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center group-hover:shadow-lg transition-all">
            <ArrowLeft size={18} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">{t('return_to_store') || 'Return to Store'}</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Status Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-eas-blue/5 rounded-full -mr-32 -mt-32"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 relative z-10">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{t('track_order') || 'Track Order'}</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: SWT-{orderId}</p>
                </div>
                <button 
                  onClick={fetchOrder}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  {t('live_update') || 'Live Update'}
                </button>
              </div>

              {/* Progress Steps */}
              <div className="space-y-12 relative z-10">
                {steps.map((step, index) => {
                  const isCompleted = index <= currentIndex;
                  const isCurrent = index === currentIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.id} className="relative flex gap-8 group">
                      {/* Connector Line */}
                      {index < steps.length - 1 && (
                        <div className={`absolute left-7 top-14 w-[2px] h-12 ${index < currentIndex ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                      )}

                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${isCompleted ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-slate-50 text-slate-300'}`}>
                        <Icon size={24} />
                      </div>

                      <div>
                        <h4 className={`text-lg font-black tracking-tight uppercase italic ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                          {step.label}
                        </h4>
                        <p className={`text-xs font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                          {step.desc}
                        </p>
                        {isCurrent && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest"
                          >
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            {t('current_status') || 'Current Status'}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LIVE MAP UI */}
              {currentStatus === 'shipping' && (
                <div className="mt-12 relative z-10">
                  <div className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative h-[380px]">
                    
                    {/* Dynamic Leaflet Map Component */}
                    <div className="absolute inset-0 w-full h-full">
                      <LeafletMap 
                        destLat={trackingData?.destination_lat ? parseFloat(trackingData.destination_lat) : 5.3484}
                        destLng={trackingData?.destination_lng ? parseFloat(trackingData.destination_lng) : -3.9788}
                        agentLat={trackingData?.agent_lat ? parseFloat(trackingData.agent_lat) : null}
                        agentLng={trackingData?.agent_lng ? parseFloat(trackingData.agent_lng) : null}
                        history={trackingData?.history || []}
                      />
                    </div>

                    {/* Map Overlay Info */}
                    <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-[99]">
                      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Arrival</p>
                        <h4 className="text-2xl font-black text-emerald-400 tracking-tighter">{order?.estimated_minutes || '20'} <span className="text-sm">MINS</span></h4>
                      </div>
                      <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 flex items-center gap-2 pointer-events-auto">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        Live Tracking
                      </div>
                    </div>

                    {/* Quick navigation links */}
                    {trackingData?.agent && (
                      <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center pointer-events-none z-[99]">
                        <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl flex items-center gap-3 shadow-2xl pointer-events-auto">
                          <img src={trackingData.agent.avatar} alt={trackingData.agent.name} className="w-9 h-9 rounded-xl object-cover" />
                          <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Your Courier</p>
                            <p className="text-xs font-black text-white mt-1">{trackingData.agent.name}</p>
                          </div>
                        </div>
                        <a 
                          href={`tel:${trackingData.agent.phone}`}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 border border-white/10 pointer-events-auto transition-transform active:scale-95"
                          title="Call Courier"
                        >
                          <Phone size={18} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery PIN Input */}
              {currentStatus === 'shipping' && (
                <div className="mt-12 relative z-10 bg-slate-50 rounded-3xl p-8 border border-slate-200 shadow-inner">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic mb-2">Confirm Delivery</h3>
                  <p className="text-xs text-slate-500 font-medium mb-6 max-w-sm">
                    When the delivery agent arrives with your package, they will provide a 4-digit code. Enter it here to complete the delivery.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input 
                      type="text" 
                      maxLength={4}
                      value={pinInput}
                      onChange={(e) => { setPinInput(e.target.value); setPinError(''); }}
                      placeholder="Enter 4-Digit Code"
                      className="flex-1 px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xl font-black tracking-[0.5em] placeholder:tracking-normal text-center outline-none focus:border-eas-blue focus:ring-4 focus:ring-eas-blue/10 transition-all"
                    />
                    <button 
                      onClick={handlePinSubmit}
                      disabled={pinInput.length !== 4 || loading}
                      className="px-8 py-4 bg-eas-blue text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-eas-blue/30"
                    >
                      Confirm
                    </button>
                  </div>
                  {pinError && <p className="text-red-500 text-xs font-bold mt-3">{pinError}</p>}
                </div>
              )}

              {currentStatus === 'completed' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-12 relative z-10 bg-emerald-50 rounded-3xl p-10 border border-emerald-200 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                    <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic mb-2">Mission Complete!</h3>
                  <p className="text-sm text-slate-600 font-medium mb-4">
                    Your premium gear has been successfully delivered and verified.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <Clock size={14} />
                    Verified At: {new Date(order?.updated_at || Date.now()).toLocaleTimeString()}
                  </div>

                  {/* PROMO GIFT CARD */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[50px] -mr-16 -mt-16"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="text-blue-400" size={24} />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Exclusive Reward</h4>
                      </div>
                      <h5 className="text-2xl font-black tracking-tighter italic mb-2">THANK YOU FOR YOUR TRUST!</h5>
                      <p className="text-xs text-slate-400 font-medium mb-6">Use this code on your next purchase to get 10% OFF everything.</p>
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center group cursor-pointer hover:bg-white/10 transition-all">
                        <div>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Your Promo Code</p>
                          <p className="text-2xl font-black tracking-[0.2em] text-white">SWEETO10</p>
                        </div>
                        <div className="w-10 h-10 bg-white text-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={20} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-eas-blue/20 rounded-full blur-[40px] -mr-16 -mt-16"></div>
              
              <h3 className="text-[10px] font-black text-eas-blue uppercase tracking-[0.5em] mb-8">{t('delivery_for') || 'Delivery For'}</h3>
              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t('customer') || 'Customer'}</p>
                    <p className="font-black text-sm uppercase italic">{order?.customer_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t('location') || 'Location'}</p>
                    <p className="font-black text-sm uppercase italic">Abidjan, Ivory Coast</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white/40">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{t('contact') || 'Contact'}</p>
                    <p className="font-black text-sm uppercase italic">{order?.customer_contact?.split('|')[0].trim() || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl">
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] mb-8 flex items-center gap-3">
                <Package size={16} className="text-eas-blue" />
                {t('package_summary') || 'Package Summary'}
              </h3>
              
              <div className="space-y-4 mb-8">
                {order?.items && JSON.parse(order.items).map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{item.name} x{item.quantity}</span>
                    <span className="text-xs font-black text-slate-900">{item.price?.toLocaleString()} FCFA</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">{t('total_paid') || 'Total Paid'}</p>
                  <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{order?.total?.toLocaleString()} FCFA</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper for icon since I missed user in imports
const User = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

export default OrderTrackingPage;
