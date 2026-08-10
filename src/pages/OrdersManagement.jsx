import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip as ChartTooltip,
} from "recharts";
import { useStore } from "../contexts/StoreContext";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../utils/api";

function useFontsourceInter() {
  useEffect(() => {
    const weights = ["400", "500", "600", "700", "800"];
    const links = weights.map((w) => {
      const href = `https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/${w}.css`;
      if (document.querySelector(`link[href="${href}"]`)) return null;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => links.forEach((l) => l && l.remove());
  }, []);
}

const Icon = {
  Search: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  Trash: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M10 11v6M14 11v6" />
    </svg>
  ),
  Eye: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  X: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  Chevron: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  Box: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </svg>
  ),
  Clock: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  ),
  Dollar: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Ban: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <circle cx="12" cy="12" r="9" /><path d="m5.6 5.6 12.8 12.8" />
    </svg>
  ),
  Truck: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18h-5M14 8h4l4 4v5a1 1 0 0 1-1 1h-1" /><circle cx="7.5" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" />
    </svg>
  ),
  Warn: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  Refresh: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  ),
  ArrowLeft: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  ),
  Printer: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" />
    </svg>
  ),
  User: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  MapPin: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Phone: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
};

const STATUS_META = {
  pending:    { label: "Pending",    badge: "bg-amber-100 text-amber-700 ring-amber-200",   dot: "bg-amber-500",  step: 0 },
  confirmed:  { label: "Confirmed",  badge: "bg-blue-100 text-blue-700 ring-blue-200",     dot: "bg-blue-500",   step: 1 },
  shipping:   { label: "Shipping",   badge: "bg-violet-100 text-violet-700 ring-violet-200",dot: "bg-violet-500", step: 2 },
  completed:  { label: "Completed",  badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", step: 3 },
  cancelled:  { label: "Cancelled",  badge: "bg-rose-100 text-rose-700 ring-rose-200",     dot: "bg-rose-500",    step: -1 },
};
const FLOW = ["pending", "confirmed", "shipping", "completed"];
const AVATAR_COLORS = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-fuchsia-500", "bg-teal-500"];
const initials = (name) => {
  if (!name) return "??";
  try {
    return String(name).split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  } catch (e) {
    return "??";
  }
};
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return "N/A";
  }
};
const getProductEmoji = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes('headphone') || n.includes('ear') || n.includes('audio')) return '🎧';
  if (n.includes('cable') || n.includes('wire') || n.includes('usb')) return '🔌';
  if (n.includes('keyboard') || n.includes('key')) return '⌨️';
  if (n.includes('watch') || n.includes('strap')) return '⌚';
  if (n.includes('speaker') || n.includes('sound')) return '🔊';
  if (n.includes('yoga') || n.includes('gym') || n.includes('sport')) return '🧘';
  if (n.includes('band') || n.includes('fitness')) return '💪';
  if (n.includes('coffee') || n.includes('espresso') || n.includes('tea')) return '☕';
  if (n.includes('bag') || n.includes('tote') || n.includes('leather')) return '👜';
  if (n.includes('scarf') || n.includes('silk') || n.includes('wear')) return '🧣';
  if (n.includes('mouse') || n.includes('pad') || n.includes('game')) return '🖱️';
  if (n.includes('candle') || n.includes('scent')) return '🕯️';
  if (n.includes('phone') || n.includes('case') || n.includes('mobile')) return '📱';
  if (n.includes('desk') || n.includes('chair') || n.includes('table')) return '🪑';
  if (n.includes('camera') || n.includes('tripod') || n.includes('lens')) return '📷';
  return '📦';
};

const orderTotal = (o) => {
  if (!o || !o.items) return 0;
  return o.items.reduce((s, i) => s + (i.qty || i.quantity || 1) * (i.price || 0), 0);
};

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

function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function StatCard({ icon, label, value, sub, tint, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

export default function OrdersManagement({ preselectedOrderId }) {
  useFontsourceInter();
  const { settings, showToast } = useStore();
  const currencySymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
  const money = (n) => currencySymbol + " " + Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // Courier tracking/agents states
  const [agents, setAgents] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [eta, setEta] = useState(25);
  const [isUpdating, setIsUpdating] = useState(false);

  const pushToast = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_agents')
        .select('*')
        .eq('approval_status', 'approved')
        .order('name', { ascending: true });
        
      if (!error && data) {
        setAgents(data);
      } else {
        const localApproved = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]')
          .filter(a => a.approval_status === 'approved');
        setAgents(localApproved);
      }
    } catch (err) {
      console.error("Failed to fetch agents from Supabase:", err);
      const localApproved = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]')
        .filter(a => a.approval_status === 'approved');
      setAgents(localApproved);
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

      const mapped = (data || []).map(o => {
        let itemsArr = [];
        try {
          itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
          if (!Array.isArray(itemsArr)) itemsArr = [];
        } catch (e) {
          itemsArr = [];
        }
        
        const itemsWithEmoji = itemsArr.map(item => ({
          name: item.name || 'Product Item',
          qty: item.quantity || item.qty || 1,
          price: item.price || 0,
          emoji: getProductEmoji(item.name)
        }));

        return {
          id: String(o.id).startsWith('ORD-') ? o.id : `ORD-${o.id}`,
          dbId: o.id,
          customer: o.customer_name || 'Customer',
          email: o.customer_phone || o.customer_email || 'N/A',
          date: o.created_at || new Date().toISOString(),
          status: o.status || 'pending',
          payment: o.payment_method || 'COD',
          address: o.address || 'No Address',
          notes: o.delivery_notes || '',
          delivery_agent_id: o.delivery_agent_id || null,
          items: itemsWithEmoji
        };
      });
      setOrders(mapped);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      try {
        const res = await apiFetch('/api/orders');
        if (res.ok) {
          const localData = await res.json();
          const mapped = localData.map(o => {
            let itemsArr = [];
            try {
              itemsArr = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
            } catch (e) {
              itemsArr = [];
            }
            const itemsWithEmoji = itemsArr.map(item => ({
              name: item.name || 'Product Item',
              qty: item.quantity || item.qty || 1,
              price: item.price || 0,
              emoji: getProductEmoji(item.name)
            }));
            return {
              id: String(o.id).startsWith('ORD-') ? o.id : `ORD-${o.id}`,
              dbId: o.id,
              customer: o.customer_name || 'Customer',
              email: o.customer_phone || o.customer_email || 'N/A',
              date: o.created_at || new Date().toISOString(),
              status: o.status || 'pending',
              payment: o.payment_method || 'COD',
              address: o.address || 'No Address',
              notes: o.delivery_notes || '',
              delivery_agent_id: o.delivery_agent_id || null,
              items: itemsWithEmoji
            };
          });
          setOrders(mapped);
        }
      } catch (e) {
        console.error("Local fetch failed:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAgents();
  }, []);

  useEffect(() => {
    if (preselectedOrderId && orders.length > 0) {
      const target = orders.find(o => String(o.dbId) === String(preselectedOrderId) || String(o.id) === String(preselectedOrderId));
      if (target) setActiveOrderId(target.id);
    }
  }, [preselectedOrderId, orders]);

  // Telemetry Location history loading for active shipping order
  useEffect(() => {
    const activeOrder = orders.find(o => o.id === activeOrderId);
    if (!activeOrder || !activeOrder.dbId) return;
    setTrackingData(null);

    const loadTracking = async () => {
      try {
        const { data: orderData, error: orderErr } = await supabase
          .from('orders')
          .select('*')
          .eq('id', activeOrder.dbId)
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
        
        const { data: historyData } = await supabase
          .from('agent_location_history')
          .select('lat, lng, created_at')
          .eq('order_id', activeOrder.dbId)
          .order('created_at', { ascending: true });
          
        setTrackingData({
          order_id: orderData.id,
          customer_name: orderData.customer_name,
          customer_contact: orderData.customer_phone || orderData.customer_email || 'N/A',
          status: orderData.status,
          tracking_stage: orderData.tracking_stage || 'placed',
          estimated_minutes: orderData.estimated_minutes || 20,
          destination_lat: orderData.destination_lat || 5.3484,
          destination_lng: orderData.destination_lng || -3.9788,
          agent_lat: orderData.agent_lat || null,
          agent_lng: orderData.agent_lng || null,
          agent,
          history: historyData || []
        });
      } catch (err) {
        console.error("Failed to load telemetry tracking data:", err);
      }
    };

    loadTracking();

    let interval = null;
    if (activeOrder.status === 'shipping') {
      interval = setInterval(loadTracking, 6000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeOrderId, orders]);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.keys(STATUS_META).forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
  }, [orders]);

  const weekRevenue = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        day: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: 0
      });
    }

    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      const oDate = String(o.date).split('T')[0];
      const match = days.find(d => d.dateStr === oDate);
      if (match) {
        match.value += orderTotal(o);
      }
    });

    return days;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = orders.filter((o) => {
      const q = search.toLowerCase();
      const matchQ = !q || o.id.toLowerCase().includes(q) || o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
      const matchT = tab === "all" || o.status === tab;
      return matchQ && matchT;
    });
    list.sort((a, b) => {
      let va, vb;
      if (sortBy.key === "total") { va = orderTotal(a); vb = orderTotal(b); }
      else if (sortBy.key === "customer") { va = a.customer; vb = b.customer; }
      else if (sortBy.key === "id") { va = a.id; vb = b.id; }
      else { va = a.date; vb = b.date; }
      if (va < vb) return sortBy.dir === "asc" ? -1 : 1;
      if (va > vb) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [orders, search, tab, sortBy]);

  useEffect(() => setPage(1), [search, tab]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageSafe = Math.min(page, totalPages);
  const pageRows = filtered.slice((pageSafe - 1) * PER_PAGE, pageSafe * PER_PAGE);

  const revenue = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + orderTotal(o), 0);
  const allPageSelected = pageRows.length > 0 && pageRows.every((o) => selected.has(o.id));

  const toggleSort = (key) =>
    setSortBy((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  const toggleSelect = (id, e) => {
    e?.stopPropagation();
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allPageSelected) pageRows.forEach((o) => n.delete(o.id));
      else pageRows.forEach((o) => n.add(o.id));
      return n;
    });

  const setStatus = async (id, status, estimatedMinutes = null) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    try {
      setIsUpdating(true);
      const dbId = order.dbId || id.replace('ORD-', '');
      const payload = { status };
      if (estimatedMinutes !== null) payload.estimated_minutes = parseInt(estimatedMinutes);

      const { error } = await supabase
        .from('orders')
        .update(payload)
        .eq('id', dbId);
        
      if (error) throw error;
      
      // Sync local SQLite
      await apiFetch(`/api/orders/${dbId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, tracking_stage: status })
      }).catch(() => {});
      
      setOrders((os) => os.map((o) => (o.id === id ? { ...o, status, estimated_minutes: estimatedMinutes || o.estimated_minutes } : o)));
      setMenuFor(null);
      pushToast(`${id} marked as ${STATUS_META[status]?.label || status}`);
    } catch (err) {
      console.error("Failed to update status:", err);
      pushToast(`Failed to update status: ${err.message}`, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssignAgent = async (agentId) => {
    const activeOrder = orders.find(o => o.id === activeOrderId);
    if (!agentId || !activeOrder) return;
    try {
      setAssignLoading(true);
      const dbId = activeOrder.dbId || activeOrderId.replace('ORD-', '');
      
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_agent_id: parseInt(agentId),
          tracking_stage: 'assigned',
          destination_lat: 5.3484,
          destination_lng: -3.9788,
          agent_lat: 5.3161,
          agent_lng: -3.9937
        })
        .eq('id', dbId);
        
      if (error) throw error;
      
      await apiFetch(`/api/orders/${dbId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_stage: 'assigned' })
      }).catch(() => {});

      setOrders(os => os.map(o => o.id === activeOrderId ? { ...o, delivery_agent_id: parseInt(agentId) } : o));
      pushToast(`Courier assigned to order ${activeOrderId}`);
      fetchOrders();
    } catch (err) {
      console.error("Failed to assign agent:", err);
      pushToast("Failed to assign agent", "danger");
    } finally {
      setAssignLoading(false);
    }
  };

  const confirmBulk = async () => {
    const pendingList = orders.filter((o) => selected.has(o.id) && o.status === "pending");
    if (pendingList.length > 0) {
      for (const o of pendingList) {
        await setStatus(o.id, "confirmed");
      }
      pushToast(`${pendingList.length} pending order(s) confirmed`);
    } else {
      pushToast("No pending orders in selection", "info");
    }
  };

  const doDelete = async () => {
    try {
      setIsUpdating(true);
      if (deleteTarget === "bulk") {
        const n = selected.size;
        for (const id of selected) {
          const order = orders.find(o => o.id === id);
          if (order) {
            const dbId = order.dbId || id.replace('ORD-', '');
            await supabase.from('orders').delete().eq('id', dbId);
            await apiFetch(`/api/orders/${dbId}`, { method: 'DELETE' }).catch(() => {});
          }
        }
        setOrders((os) => os.filter((o) => !selected.has(o.id)));
        pushToast(`${n} order${n > 1 ? "s" : ""} deleted`, "danger");
        setSelected(new Set());
      } else if (deleteTarget) {
        const dbId = deleteTarget.dbId || deleteTarget.id.replace('ORD-', '');
        const { error } = await supabase.from('orders').delete().eq('id', dbId);
        if (error) throw error;
        await apiFetch(`/api/orders/${dbId}`, { method: 'DELETE' }).catch(() => {});
        
        setOrders((os) => os.filter((o) => o.id !== deleteTarget.id));
        if (activeOrderId === deleteTarget.id) setActiveOrderId(null);
        setSelected((s) => { const n = new Set(s); n.delete(deleteTarget.id); return n; });
        pushToast(`${deleteTarget.id} deleted`, "danger");
      }
    } catch (err) {
      console.error("Failed to delete order(s):", err);
      pushToast(`Failed to delete order: ${err.message}`, 'danger');
    } finally {
      setIsUpdating(false);
      setDeleteTarget(null);
    }
  };

  const resetData = () => {
    fetchOrders();
    setSelected(new Set());
    setActiveOrderId(null);
    pushToast("Dashboard database re-synced", "info");
  };

  const sortArrow = (key) => sortBy.key === key ? (sortBy.dir === "asc" ? " ↑" : " ↓") : "";

  const activeOrder = orders.find((o) => o.id === activeOrderId);
  const riderInfo = trackingData?.agent;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 text-slate-900 dark:text-slate-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AnimatePresence mode="wait">
        {activeOrder ? (
          /* --- INDIVIDUAL ORDER MANAGEMENT PAGE --- */
          <motion.div key="detail-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
            {/* Top back bar & quick status actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={() => setActiveOrderId(null)}
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
              >
                <Icon.ArrowLeft className="h-4 w-4" /> Back to orders list
              </button>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Change Status:</span>
                {Object.keys(STATUS_META).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatus(activeOrder.id, st)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
                      activeOrder.status === st
                        ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow"
                        : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    {STATUS_META[st].label}
                  </button>
                ))}
                <button
                  onClick={() => setDeleteTarget(activeOrder)}
                  className="ml-2 rounded-xl border border-rose-200 dark:border-rose-950 bg-rose-50 dark:bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-950/40 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Order Header Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{activeOrder.id}</h2>
                    <StatusBadge status={activeOrder.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">Order placed on {fmtDate(activeOrder.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-sm transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">
                    <Icon.Printer className="h-4 w-4 text-slate-500" /> Print invoice
                  </button>
                  {activeOrder.status === "pending" && (
                    <button onClick={() => setStatus(activeOrder.id, "confirmed")} className="flex items-center gap-1.5 rounded-xl bg-indigo-650 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer border-none">
                      <Icon.Check className="h-4 w-4" /> Confirm & Process
                    </button>
                  )}
                </div>
              </div>

              {/* Progress flow bar */}
              {STATUS_META[activeOrder.status]?.step >= 0 ? (
                <div className="mt-8 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-850 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Fulfillment Progress</p>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 bg-slate-200 dark:bg-slate-800 z-0" />
                    {FLOW.map((st, i) => {
                      const currentStep = STATUS_META[activeOrder.status]?.step || 0;
                      const done = i <= currentStep;
                      return (
                        <div key={st} className="relative z-10 flex flex-col items-center">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition shadow-sm ${done ? "bg-indigo-650 text-white" : "bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-400"}`}>
                            {i + 1}
                          </div>
                          <span className={`mt-2 text-xs font-semibold ${done ? "text-indigo-650 dark:text-indigo-400" : "text-slate-400"}`}>{STATUS_META[st].label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-8 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4 text-rose-800 dark:text-rose-455 flex items-center gap-3">
                  <Icon.Ban className="h-6 w-6 text-rose-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Order Cancelled</p>
                    <p className="text-xs text-rose-600 dark:text-rose-450">This order was cancelled and is no longer active for fulfillment.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Grid Layout for details */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left 2 cols: Items & Notes & Telemetry Logistics */}
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Ordered Items ({activeOrder.items?.length || 0})</h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                    {activeOrder.items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{item.emoji}</span>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="text-xs text-slate-450">Unit price: {money(item.price)} × {item.qty}</p>
                          </div>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">{money(item.qty * item.price)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Cost summary box */}
                  <div className="mt-6 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-5 space-y-2.5">
                    <div className="flex justify-between text-sm text-slate-650 dark:text-slate-400">
                      <span>Items Subtotal</span>
                      <span className="font-medium text-slate-900 dark:text-white">{money(orderTotal(activeOrder))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-655 dark:text-slate-400">
                      <span>Estimated Shipping</span>
                      <span className="font-medium text-slate-900 dark:text-white">{orderTotal(activeOrder) > 15000 ? "Free" : money(1000)}</span>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-850 pt-3 flex justify-between text-base font-bold text-slate-900 dark:text-white">
                      <span>Total Amount</span>
                      <span>{money(orderTotal(activeOrder) + (orderTotal(activeOrder) > 15000 ? 0 : 1000))}</span>
                    </div>
                  </div>
                </div>

                {/* Logistics & Dynamic Agent Assignment */}
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Logistics & Telemetry Route</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1">Assign couriers and track delivery coordinates live</p>
                    </div>
                    
                    {/* Dynamic Agent Selector */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Agent:</span>
                      <select
                        value={activeOrder.delivery_agent_id || ''}
                        onChange={(e) => handleAssignAgent(e.target.value)}
                        disabled={assignLoading}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-48 appearance-none cursor-pointer"
                      >
                        <option value="">-- Unassigned --</option>
                        {agents.map(a => (
                          <option key={a.id} value={a.id}>{a.name} ({a.zone || 'No Zone'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {activeOrder.status === 'shipping' && (
                    <div className="w-full space-y-2 border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-950/20 p-4 rounded-2xl">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Update Arrival Time (Mins)</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" min="1" max="60" value={eta} 
                          onChange={(e) => setEta(e.target.value)}
                          onMouseUp={() => setStatus(activeOrder.id, 'shipping', eta)}
                          className="flex-1 accent-indigo-600"
                        />
                        <span className="text-xs font-black text-indigo-650 dark:text-indigo-400 w-12">{eta}m</span>
                      </div>
                    </div>
                  )}

                  {/* Leaflet Live Map for Admin */}
                  {activeOrder.status !== 'pending' && activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled' ? (
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
                  ) : activeOrder.status === 'completed' ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl p-6 text-center space-y-2">
                      <svg className="mx-auto text-emerald-500 w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h5 className="font-black uppercase tracking-wider text-xs">Delivery Successfully Completed</h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">The agent verified coordinates and delivered the package to destination.</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 text-slate-450 text-xs italic">
                      Assign a delivery agent and update order status to shipping to see live route map.
                    </div>
                  )}
                </div>

                {activeOrder.notes && (
                  <div className="rounded-3xl border border-amber-200 dark:border-amber-950 bg-amber-50/60 dark:bg-amber-950/20 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-amber-905 dark:text-amber-400 mb-1">Customer Delivery Notes</h3>
                    <p className="text-sm text-amber-800 dark:text-amber-500">{activeOrder.notes}</p>
                  </div>
                )}
              </div>

              {/* Right col: Customer details & PIN info */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Customer Details</h3>
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white shrink-0 ${AVATAR_COLORS[activeOrder.customer.length % AVATAR_COLORS.length]}`}>
                      {initials(activeOrder.customer)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{activeOrder.customer}</p>
                      <p className="text-xs text-slate-400 truncate">{activeOrder.email}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-450 uppercase tracking-wide">Shipping Address</p>
                      <p className="mt-1 text-slate-805 dark:text-slate-300 font-semibold">{activeOrder.address}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-450 uppercase tracking-wide">Payment Method</p>
                      <p className="mt-1 text-slate-805 dark:text-slate-300 font-semibold uppercase tracking-wider">{activeOrder.payment}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-850">
                      <p className="text-xs font-semibold text-slate-450 uppercase tracking-wide mb-1">Delivery PIN Code</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-indigo-650 dark:text-indigo-400 tracking-[0.2em]">{((parseInt(activeOrder.dbId || '0') * 837 + 1492) % 9000 + 1000).toString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* --- ORDERS LIST VIEW --- */
          <motion.div key="list-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard delay={0} label="Total Orders" value={counts.all} sub="All time in store" tint="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" icon={<Icon.Box className="h-5 w-5" />} />
              <StatCard delay={0.06} label="Pending Approval" value={counts.pending} sub="Waiting for confirmation" tint="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" icon={<Icon.Clock className="h-5 w-5" />} />
              <StatCard delay={0.12} label="Revenue" value={money(revenue)} sub="Excluding cancelled" tint="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" icon={<Icon.Dollar className="h-5 w-5" />} />
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">Weekly Revenue</p>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-semibold text-emerald-650 dark:text-emerald-400">+18.4%</span>
                </div>
                <div className="mt-2 h-14">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekRevenue} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#rev)" />
                      <ChartTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} formatter={(v) => [money(v), "Revenue"]} labelStyle={{ color: "#64748b" }} />
                      <XAxis dataKey="day" hide />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Filters and Search Bar */}
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-sm">
                {[["all", "All"], ...Object.keys(STATUS_META).map((s) => [s, STATUS_META[s].label])].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer border-none ${tab === key ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow" : "text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent"}`}
                  >
                    {label} <span className={`ml-1 text-xs ${tab === key ? "text-slate-300 dark:text-slate-500" : "text-slate-400"}`}>{counts[key]}</span>
                  </button>
                ))}
              </div>
              <div className="relative w-full lg:w-80">
                <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order ID, customer..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-950 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3"
                >
                  <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-400">{selected.size} selected</span>
                  <div className="ml-auto flex flex-wrap gap-2">
                    <button onClick={confirmBulk} className="flex items-center gap-1.5 rounded-lg bg-indigo-650 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer border-none">
                      <Icon.Check className="h-4 w-4" /> Confirm pending
                    </button>
                    <button onClick={() => setDeleteTarget("bulk")} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer border-none">
                      <Icon.Trash className="h-4 w-4" /> Delete selected
                    </button>
                    <button onClick={() => setSelected(new Set())} className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-indigo-755 dark:text-indigo-400 transition hover:bg-indigo-100 dark:hover:bg-slate-800 cursor-pointer">
                      Clear
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orders Table */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" />
                      </th>
                      <th className="cursor-pointer px-3 py-3 font-semibold select-none" onClick={() => toggleSort("id")}>Order{sortArrow("id")}</th>
                      <th className="cursor-pointer px-3 py-3 font-semibold select-none" onClick={() => toggleSort("customer")}>Customer{sortArrow("customer")}</th>
                      <th className="cursor-pointer px-3 py-3 font-semibold select-none" onClick={() => toggleSort("date")}>Date{sortArrow("date")}</th>
                      <th className="px-3 py-3 font-semibold">Items</th>
                      <th className="cursor-pointer px-3 py-3 font-semibold select-none" onClick={() => toggleSort("total")}>Total{sortArrow("total")}</th>
                      <th className="px-3 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {pageRows.map((o) => {
                        const total = orderTotal(o);
                        const isSel = selected.has(o.id);
                        const itemCount = o.items.reduce((s, i) => s + i.qty, 0);
                        return (
                          <motion.tr
                            key={o.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -24 }}
                            onClick={() => setActiveOrderId(o.id)}
                            className={`cursor-pointer border-b border-slate-100 dark:border-slate-800/60 transition last:border-0 ${isSel ? "bg-indigo-50/60 dark:bg-indigo-950/20" : "hover:bg-indigo-50/30 dark:hover:bg-slate-850/50"}`}
                          >
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <input type="checkbox" checked={isSel} onChange={(e) => toggleSelect(o.id, e)} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" />
                            </td>
                            <td className="px-3 py-3 font-semibold text-indigo-600 dark:text-indigo-400">{o.id}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${AVATAR_COLORS[o.customer.length % AVATAR_COLORS.length]}`}>
                                  {initials(o.customer)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-slate-800 dark:text-slate-205">{o.customer}</p>
                                  <p className="truncate text-xs text-slate-400">{o.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fmtDate(o.date)}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1">
                                <span className="mr-1 text-base">{o.items[0]?.emoji || '📦'}</span>
                                <span className="text-slate-655 dark:text-slate-400">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">{money(total)}</td>
                            <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                {o.status === "pending" && (
                                  <button onClick={(e) => { e.stopPropagation(); setStatus(o.id, "confirmed"); }} title="Confirm order" className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-250 dark:ring-emerald-900 transition hover:bg-emerald-100 dark:hover:bg-emerald-950/60 cursor-pointer border-none">
                                    <Icon.Check className="h-4 w-4" />
                                  </button>
                                )}
                                <div className="relative">
                                  <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === o.id ? null : o.id); }} title="Change status" className="rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 dark:ring-slate-800 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-none">
                                    <Icon.Chevron className={`h-4 w-4 transition ${menuFor === o.id ? "rotate-180" : ""}`} />
                                  </button>
                                  <AnimatePresence>
                                    {menuFor === o.id && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuFor(null); }} />
                                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1 shadow-xl">
                                          {Object.keys(STATUS_META).map((s) => (
                                            <button key={s} onClick={(e) => { e.stopPropagation(); setStatus(o.id, s); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer border-none bg-transparent ${o.status === s ? "font-semibold text-indigo-650 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300"}`}>
                                              <span className={`h-2 w-2 rounded-full ${STATUS_META[s].dot}`} />
                                              {STATUS_META[s].label}
                                              {o.status === s && <Icon.Check className="ml-auto h-3.5 w-3.5" />}
                                            </button>
                                          ))}
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setActiveOrderId(o.id); }} title="Manage details" className="rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 dark:ring-slate-800 transition hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer bg-transparent border-none">
                                  <Icon.Eye className="h-4 w-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(o); }} title="Delete order" className="rounded-lg p-2 text-rose-500 ring-1 ring-rose-200 dark:ring-rose-900 transition hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer bg-transparent border-none">
                                  <Icon.Trash className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400"><Icon.Box className="h-7 w-7" /></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No orders found</p>
                    <p className="text-sm text-slate-400">Try a different search or filter.</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 px-4 py-3 text-sm text-slate-500">
                <span>Showing {filtered.length === 0 ? 0 : (pageSafe - 1) * PER_PAGE + 1}–{Math.min(pageSafe * PER_PAGE, filtered.length)} of {filtered.length}</span>
                <div className="flex items-center gap-1">
                  <button disabled={pageSafe <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-medium transition enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 disabled:opacity-40 cursor-pointer">Prev</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button key={n} onClick={() => setPage(n)} className={`h-8 w-8 rounded-lg font-semibold transition cursor-pointer border-none ${n === pageSafe ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 bg-transparent"}`}>{n}</button>
                  ))}
                  <button disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-medium transition enabled:hover:bg-slate-100 dark:enabled:hover:bg-slate-800 disabled:opacity-40 cursor-pointer">Next</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#0E172A] p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-4"><Icon.Warn className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Confirm Deletion</h3>
                <p className="mt-1 text-sm text-slate-550 dark:text-slate-400 leading-normal">
                  {deleteTarget === "bulk"
                    ? `Are you sure you want to delete ${selected.size} selected order(s)? This action cannot be undone.`
                    : `Are you sure you want to delete order ${deleteTarget.id}? This action cannot be undone.`}
                </p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 text-sm font-medium text-slate-655 dark:text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer">Cancel</button>
                  <button onClick={doDelete} className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 cursor-pointer border-none">Delete</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl ${
                t.type === "danger" ? "bg-rose-600" : t.type === "info" ? "bg-slate-800" : "bg-emerald-600"
              }`}
            >
              <Icon.Check className="h-4 w-4 shrink-0" />
              <span>{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
