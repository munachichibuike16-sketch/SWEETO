import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Phone, MapPin, Loader2, CheckCircle2, Clock, Truck, ShieldCheck, User } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
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

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
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
        .bindPopup("Customer Home");

      if (agentLat && agentLng) {
        agentMarkerRef.current = window.L.marker([agentLat, agentLng], { icon: motoIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup("Delivery Agent");

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
          .bindPopup("Delivery Agent");
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
          color: '#3b82f6',
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

  return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '1.5rem', zIndex: 1 }} />;
};

export default function OrdersManagement({ preselectedOrderId }) {
  const { settings } = useStore();
  const currency = settings?.currency || 'FCFA';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [eta, setEta] = useState(25);
  const [agents, setAgents] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await apiFetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0) {
      const target = orders.find(o => o.id === preselectedOrderId);
      if (target) setSelectedOrder(target);
    }
  }, [preselectedOrderId, orders]);

  // Dynamic coordinates tracking poller for admin dashboard overview
  useEffect(() => {
    if (!selectedOrder) return;
    setTrackingData(null);

    const loadTracking = async () => {
      try {
        const res = await apiFetch(`/api/orders/${selectedOrder.id}/tracking`);
        if (res.ok) {
          const data = await res.json();
          setTrackingData(data);
        }
      } catch (err) {
        console.error("Failed to load tracking data for admin:", err);
      }
    };

    loadTracking();

    let interval = null;
    if (selectedOrder.status === 'shipping') {
      interval = setInterval(loadTracking, 6000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedOrder?.id, selectedOrder?.status]);

  const handleAssignAgent = async (agentId) => {
    if (!agentId || !selectedOrder) return;
    try {
      setAssignLoading(true);
      const res = await apiFetch(`/api/orders/${selectedOrder.id}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: parseInt(agentId) })
      });
      if (res.ok) {
        fetchOrders();
        setSelectedOrder(prev => ({ 
          ...prev, 
          delivery_agent_id: parseInt(agentId),
          tracking_stage: 'assigned' 
        }));
      }
    } catch (err) {
      console.error("Failed to assign agent:", err);
    } finally {
      setAssignLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, estimatedMinutes = null) => {
    try {
      setIsUpdating(true);
      const payload = { status: newStatus };
      if (estimatedMinutes !== null) payload.estimated_minutes = estimatedMinutes;

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);

      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, estimated_minutes: estimatedMinutes || o.estimated_minutes } : o));
        if (selectedOrder?.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus, estimated_minutes: estimatedMinutes || selectedOrder.estimated_minutes });
        }
      } else {
        throw error;
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-500 text-amber-500';
      case 'confirmed': return 'bg-blue-500 text-blue-500';
      case 'shipping': return 'bg-purple-500 text-purple-500';
      case 'completed': return 'bg-emerald-500 text-emerald-500';
      default: return 'bg-slate-500 text-slate-500';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toString().includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
              <Package size={20} />
            </div>
            Orders Management
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">View and process customer orders</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', val: orders.length, color: 'blue', icon: Package },
          { label: 'Pending', val: orders.filter(o => o.status === 'pending').length, color: 'amber', icon: Clock },
          { label: 'Shipping', val: orders.filter(o => o.status === 'shipping').length, color: 'purple', icon: Truck },
          { label: 'Completed', val: orders.filter(o => o.status === 'completed').length, color: 'emerald', icon: CheckCircle2 },
        ].map((s, i) => (
          <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${s.color}-500/10 text-${s.color}-500`}><s.icon size={16}/></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Left Side: Order List */}
        <div className="w-full md:w-1/3 border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col h-[600px]">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search orders..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">No orders found.</p>
            ) : (
              filteredOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const statusColor = getStatusColor(order.status || 'pending');
                
                return (
                  <button 
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm' : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/50 hover:border-blue-300 dark:hover:border-blue-700'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-slate-900 dark:text-white">SWT-{order.id}</span>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-opacity-10 ${statusColor.split(' ')[0]} ${statusColor.split(' ')[1]}`}>
                        {order.status || 'pending'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{order.customer_name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{(order.total_amount || order.total)?.toLocaleString()} {currency}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Order Details */}
        <div className="w-full md:w-2/3 h-[600px] flex flex-col bg-slate-50 dark:bg-slate-950/20">
          {selectedOrder ? (
            <div className="flex-1 overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Order SWT-{selectedOrder.id}</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{new Date(selectedOrder.created_at || Date.now()).toLocaleString()}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col items-end">
                    <select 
                      value={selectedOrder.status || 'pending'}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      disabled={isUpdating}
                      className="bg-transparent text-sm font-black uppercase tracking-widest outline-none cursor-pointer text-slate-700 dark:text-slate-300 disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipping">Shipping</option>
                      <option value="completed">Completed</option>
                    </select>
                    {selectedOrder.status === 'shipping' && (
                      <div className="mt-3 w-full space-y-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Update Arrival Time (Mins)</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" min="1" max="60" value={eta} 
                            onChange={(e) => setEta(e.target.value)}
                            onMouseUp={() => updateOrderStatus(selectedOrder.id, 'shipping', eta)}
                            className="flex-1 accent-eas-blue"
                          />
                          <span className="text-xs font-black text-eas-blue w-12">{eta}m</span>
                        </div>
                      </div>
                    )}
                    {selectedOrder.status === 'completed' && (
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">
                        Delivered: {new Date(selectedOrder.updated_at || Date.now()).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Customer Details</h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center"><User size={14}/></div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.customer_name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center"><Phone size={14}/></div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{selectedOrder.customer_contact}</p>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Delivery Info</h4>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0"><MapPin size={14}/></div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{selectedOrder.delivery_address || 'Abidjan, CI'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logistics & Dynamic Agent Assignment */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Logistics & Live Route</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">Assign couriers and track delivery coordinates live</p>
                  </div>
                  
                  {/* Dynamic Agent Selector */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Agent:</span>
                    <select
                      value={selectedOrder.delivery_agent_id || ''}
                      onChange={(e) => handleAssignAgent(e.target.value)}
                      disabled={assignLoading}
                      className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 appearance-none cursor-pointer"
                    >
                      <option value="">-- Unassigned --</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.zone})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Leaflet Live Map for Admin */}
                {selectedOrder.status !== 'pending' && selectedOrder.status !== 'completed' ? (
                  <div className="h-[280px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-950">
                    <LeafletMap 
                      destLat={trackingData?.destination_lat ? parseFloat(trackingData.destination_lat) : 5.3484}
                      destLng={trackingData?.destination_lng ? parseFloat(trackingData.destination_lng) : -3.9788}
                      agentLat={trackingData?.agent_lat ? parseFloat(trackingData.agent_lat) : null}
                      agentLng={trackingData?.agent_lng ? parseFloat(trackingData.agent_lng) : null}
                      history={trackingData?.history || []}
                    />
                    
                    {/* Live indicator badge */}
                    <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5 z-[99]">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      Telemetry Live
                    </div>
                  </div>
                ) : selectedOrder.status === 'completed' ? (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 rounded-2xl p-6 text-center space-y-2">
                    <CheckCircle2 className="mx-auto text-emerald-500" size={32} />
                    <h5 className="font-black uppercase tracking-wider text-xs">Delivery Successfully Completed</h5>
                    <p className="text-[11px] text-slate-500 font-bold">The agent verified coordinates and delivered the package to destination.</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs italic">
                    Assign a delivery agent and update order to Confirmed/Shipping to see live route map.
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Package size={14}/> Items List
                </h4>
                <div className="space-y-4">
                  {selectedOrder.items && (() => {
                    try {
                      const items = typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items) : selectedOrder.items;
                      return items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-black text-slate-900 dark:text-white">{item.price?.toLocaleString()} {currency}</p>
                        </div>
                      ));
                    } catch(e) {
                      return <p className="text-slate-500 text-sm">Failed to parse items</p>;
                    }
                  })()}
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Delivery PIN</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-eas-blue" />
                      <span className="text-xl font-black text-slate-900 dark:text-white tracking-[0.2em]">{((parseInt(selectedOrder.id) * 837 + 1492) % 9000 + 1000).toString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Amount</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{(selectedOrder.total_amount || selectedOrder.total)?.toLocaleString()} {currency}</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <Package size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-medium">Select an order from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
