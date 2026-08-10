import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  Tooltip as ChartTooltip,
} from "recharts";

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
};

const STATUS_META = {
  pending:    { label: "Pending",    badge: "bg-amber-100 text-amber-700 ring-amber-200",   dot: "bg-amber-500",  step: 0 },
  processing: { label: "Processing", badge: "bg-sky-100 text-sky-700 ring-sky-200",         dot: "bg-sky-500",    step: 1 },
  shipped:    { label: "Shipped",    badge: "bg-violet-100 text-violet-700 ring-violet-200",dot: "bg-violet-500", step: 2 },
  delivered:  { label: "Delivered",  badge: "bg-emerald-100 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500", step: 3 },
  cancelled:  { label: "Cancelled",  badge: "bg-rose-100 text-rose-700 ring-rose-200",     dot: "bg-rose-500",    step: -1 },
};
const FLOW = ["pending", "processing", "shipped", "delivered"];
const AVATAR_COLORS = ["bg-indigo-500", "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500", "bg-fuchsia-500", "bg-teal-500"];
const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const seedOrders = [
  { id: "ORD-7841", customer: "Sophia Turner", email: "sophia.t@gmail.com", date: "2026-08-09", status: "pending", payment: "Visa •••• 4242", address: "128 Maple Ave, Austin, TX 78701", notes: "Please leave package by the side door bell.", items: [{ name: "Wireless Headphones Pro", qty: 1, price: 189.0, emoji: "🎧" }, { name: "USB-C Cable 2m", qty: 2, price: 12.5, emoji: "🔌" }] },
  { id: "ORD-7840", customer: "Liam Chen", email: "liam.chen@outlook.com", date: "2026-08-09", status: "processing", payment: "PayPal", address: "45 Harbor St, Seattle, WA 98101", notes: "Gift wrapping requested.", items: [{ name: "Mechanical Keyboard K87", qty: 1, price: 129.99, emoji: "⌨️" }] },
  { id: "ORD-7839", customer: "Amelia Rodriguez", email: "amelia.r@yahoo.com", date: "2026-08-08", status: "pending", payment: "Mastercard •••• 8810", address: "902 Sunset Blvd, Los Angeles, CA 90028", notes: "", items: [{ name: "Smart Watch S9", qty: 1, price: 299.0, emoji: "⌚" }, { name: "Watch Strap - Ocean", qty: 2, price: 24.0, emoji: "⌚" }] },
  { id: "ORD-7838", customer: "Noah Patel", email: "noah.patel@gmail.com", date: "2026-08-08", status: "shipped", payment: "COD", address: "77 Birch Lane, Denver, CO 80202", notes: "Call upon arrival.", items: [{ name: "Portable Speaker Mini", qty: 3, price: 49.99, emoji: "🔊" }] },
  { id: "ORD-7837", customer: "Emma Wilson", email: "emma.w@gmail.com", date: "2026-08-07", status: "delivered", payment: "Visa •••• 1177", address: "310 Oak Court, Chicago, IL 60601", notes: "", items: [{ name: "Yoga Mat Premium", qty: 1, price: 59.0, emoji: "🧘" }, { name: "Resistance Bands Set", qty: 1, price: 29.5, emoji: "💪" }] },
  { id: "ORD-7836", customer: "Oliver Kim", email: "oliver.kim@naver.com", date: "2026-08-07", status: "cancelled", payment: "PayPal", address: "58 Grand Ave, New York, NY 10012", notes: "Customer requested cancellation due to wrong address.", items: [{ name: "Espresso Machine Barista", qty: 1, price: 449.0, emoji: "☕" }] },
  { id: "ORD-7835", customer: "Mia Johnson", email: "mia.j@icloud.com", date: "2026-08-06", status: "pending", payment: "Amex •••• 3003", address: "221 Elm Street, Boston, MA 02108", notes: "", items: [{ name: "Leather Tote Bag", qty: 1, price: 148.0, emoji: "👜" }, { name: "Silk Scarf - Bloom", qty: 1, price: 42.0, emoji: "🧣" }] },
  { id: "ORD-7834", customer: "Ethan Brown", email: "ethan.b@gmail.com", date: "2026-08-06", status: "processing", payment: "Visa •••• 9091", address: "670 Pine Rd, Portland, OR 97201", notes: "", items: [{ name: "Gaming Mouse X1", qty: 1, price: 79.99, emoji: "🖱️" }, { name: "Mousepad XL", qty: 1, price: 25.0, emoji: "🖱️" }] },
  { id: "ORD-7833", customer: "Ava Nguyen", email: "ava.ng@gmail.com", date: "2026-08-05", status: "delivered", payment: "Mastercard •••• 5566", address: "15 River Walk, San Antonio, TX 78205", notes: "", items: [{ name: "Scented Candle Trio", qty: 2, price: 34.0, emoji: "🕯️" }] },
  { id: "ORD-7832", customer: "Lucas Garcia", email: "lucas.g@hotmail.com", date: "2026-08-05", status: "shipped", payment: "PayPal", address: "400 Hill Dr, Nashville, TN 37201", notes: "", items: [{ name: "Bluetooth Earbuds Air", qty: 1, price: 99.0, emoji: "🎵" }, { name: "Phone Case Clear", qty: 3, price: 15.0, emoji: "📱" }] },
  { id: "ORD-7831", customer: "Isabella Lopez", email: "bella.l@gmail.com", date: "2026-08-04", status: "pending", payment: "COD", address: "88 Lakeview Ter, Minneapolis, MN 55401", notes: "", items: [{ name: "Standing Desk Mini", qty: 1, price: 219.0, emoji: "🪑" }] },
  { id: "ORD-7830", customer: "Mason Davis", email: "mason.d@gmail.com", date: "2026-08-03", status: "cancelled", payment: "Visa •••• 2244", address: "19 Cedar Ct, Phoenix, AZ 85004", notes: "", items: [{ name: "Action Cam 4K", qty: 1, price: 259.0, emoji: "📷" }, { name: "Tripod Flex", qty: 1, price: 39.0, emoji: "📷" }] },
];

const orderTotal = (o) => o.items.reduce((s, i) => s + i.qty * i.price, 0);
const initials = (name) => name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const weekRevenue = [
  { day: "Aug 3", value: 1240 }, { day: "Aug 4", value: 1890 }, { day: "Aug 5", value: 1560 },
  { day: "Aug 6", value: 2210 }, { day: "Aug 7", value: 1980 }, { day: "Aug 8", value: 2640 }, { day: "Aug 9", value: 2380 },
];

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
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

export default function OrdersManagement() {
  useFontsourceInter();
  const [orders, setOrders] = useState(seedOrders);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [activeOrderId, setActiveOrderId] = useState(null); // Full page management view ID
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuFor, setMenuFor] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState({ key: "date", dir: "desc" });
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const pushToast = (msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const counts = useMemo(() => {
    const c = { all: orders.length };
    Object.keys(STATUS_META).forEach((s) => (c[s] = orders.filter((o) => o.status === s).length));
    return c;
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

  const setStatus = (id, status) => {
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
    setMenuFor(null);
    pushToast(`${id} marked as ${STATUS_META[status]?.label || status}`);
  };

  const confirmOrder = (id, e) => {
    e?.stopPropagation();
    setStatus(id, "processing");
  };

  const confirmBulk = () => {
    const n = orders.filter((o) => selected.has(o.id) && o.status === "pending").length;
    if (n > 0) {
      setOrders((os) => os.map((o) => (selected.has(o.id) && o.status === "pending" ? { ...o, status: "processing" } : o)));
      pushToast(`${n} pending order${n > 1 ? "s" : ""} confirmed`);
    } else {
      pushToast("No pending orders in selection", "info");
    }
  };

  const doDelete = () => {
    if (deleteTarget === "bulk") {
      const n = selected.size;
      setOrders((os) => os.filter((o) => !selected.has(o.id)));
      pushToast(`${n} order${n > 1 ? "s" : ""} deleted`, "danger");
      setSelected(new Set());
    } else if (deleteTarget) {
      setOrders((os) => os.filter((o) => o.id !== deleteTarget.id));
      if (activeOrderId === deleteTarget.id) setActiveOrderId(null);
      setSelected((s) => { const n = new Set(s); n.delete(deleteTarget.id); return n; });
      pushToast(`${deleteTarget.id} deleted`, "danger");
    }
    setDeleteTarget(null);
  };

  const resetData = () => {
    setOrders(seedOrders); setSelected(new Set()); setActiveOrderId(null);
    pushToast("Demo data restored", "info");
  };

  const sortArrow = (key) => sortBy.key === key ? (sortBy.dir === "asc" ? " ↑" : " ↓") : "";

  const activeOrder = orders.find((o) => o.id === activeOrderId);

  return (
    <div className="w-full text-slate-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Top Header inside component */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Icon.Box className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">Order Management</h1>
            <p className="text-xs text-slate-500">Live Orders · Real-time Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={resetData} className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer">
            <Icon.Refresh className="h-4 w-4" /> Reset demo
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full">
        <AnimatePresence mode="wait">
          {activeOrder ? (
            /* --- INDIVIDUAL ORDER MANAGEMENT PAGE --- */
            <motion.div key="detail-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
              {/* Top back bar & quick status actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={() => setActiveOrderId(null)}
                  className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
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
                          ? "bg-slate-900 text-white shadow"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {STATUS_META[st].label}
                    </button>
                  ))}
                  <button
                    onClick={() => setDeleteTarget(activeOrder)}
                    className="ml-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Order Header Card */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-extrabold text-slate-900">{activeOrder.id}</h2>
                      <StatusBadge status={activeOrder.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Order placed on {fmtDate(activeOrder.date)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => pushToast(`Invoice ${activeOrder.id} sent to printer`)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer">
                      <Icon.Printer className="h-4 w-4 text-slate-500" /> Print invoice
                    </button>
                    {activeOrder.status === "pending" && (
                      <button onClick={() => setStatus(activeOrder.id, "processing")} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer border-none">
                        <Icon.Check className="h-4 w-4" /> Confirm & Process
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress flow bar */}
                {STATUS_META[activeOrder.status]?.step >= 0 ? (
                  <div className="mt-8 rounded-2xl bg-slate-50 border border-slate-200/80 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Fulfillment Progress</p>
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-6 right-6 top-1/2 h-1 -translate-y-1/2 bg-slate-200 z-0" />
                      {FLOW.map((st, i) => {
                        const currentStep = STATUS_META[activeOrder.status]?.step || 0;
                        const done = i <= currentStep;
                        return (
                          <div key={st} className="relative z-10 flex flex-col items-center">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition shadow-sm ${done ? "bg-indigo-600 text-white" : "bg-white border-2 border-slate-300 text-slate-400"}`}>
                              {i + 1}
                            </div>
                            <span className={`mt-2 text-xs font-semibold ${done ? "text-indigo-600" : "text-slate-400"}`}>{STATUS_META[st].label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-center gap-3">
                    <Icon.Ban className="h-6 w-6 text-rose-500 shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Order Cancelled</p>
                      <p className="text-xs text-rose-600">This order was cancelled and is no longer active for fulfillment.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Grid Layout for details */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left 2 cols: Items & Notes */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-base font-bold text-slate-900 mb-4">Ordered Items ({activeOrder.items.length})</h3>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                      {activeOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl">{item.emoji}</span>
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-400">Unit price: {money(item.price)} × {item.qty}</p>
                            </div>
                          </div>
                          <p className="font-bold text-slate-900">{money(item.qty * item.price)}</p>
                        </div>
                      ))}
                    </div>

                    {/* Cost summary box */}
                    <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2.5">
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Items Subtotal</span>
                        <span className="font-medium text-slate-900">{money(orderTotal(activeOrder))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>Estimated Shipping</span>
                        <span className="font-medium text-slate-900">{orderTotal(activeOrder) > 150 ? "Free" : money(9.99)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-bold text-slate-900">
                        <span>Total Amount</span>
                        <span>{money(orderTotal(activeOrder) + (orderTotal(activeOrder) > 150 ? 0 : 9.99))}</span>
                      </div>
                    </div>
                  </div>

                  {activeOrder.notes && (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-6 shadow-sm">
                      <h3 className="text-sm font-bold text-amber-900 mb-1">Customer Delivery Notes</h3>
                      <p className="text-sm text-amber-800">{activeOrder.notes}</p>
                    </div>
                  )}
                </div>

                {/* Right col: Customer & Payment info */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-900">Customer Details</h3>
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white ${AVATAR_COLORS[activeOrder.customer.length % AVATAR_COLORS.length]}`}>
                        {initials(activeOrder.customer)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{activeOrder.customer}</p>
                        <p className="text-xs text-slate-400">{activeOrder.email}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-3 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Shipping Address</p>
                        <p className="mt-1 text-slate-800 font-medium">{activeOrder.address}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Method</p>
                        <p className="mt-1 text-slate-800 font-medium">{activeOrder.payment}</p>
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
                <StatCard delay={0} label="Total Orders" value={counts.all} sub="All time in store" tint="bg-indigo-100 text-indigo-600" icon={<Icon.Box className="h-5 w-5" />} />
                <StatCard delay={0.06} label="Pending Approval" value={counts.pending} sub="Waiting for confirmation" tint="bg-amber-100 text-amber-600" icon={<Icon.Clock className="h-5 w-5" />} />
                <StatCard delay={0.12} label="Revenue" value={money(revenue)} sub="Excluding cancelled" tint="bg-emerald-100 text-emerald-600" icon={<Icon.Dollar className="h-5 w-5" />} />
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.35 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">Weekly Revenue</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-600">+18.4%</span>
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
                        <ChartTooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2e8f0" }} formatter={(v) => ["$" + v, "Revenue"]} labelStyle={{ color: "#64748b" }} />
                        <XAxis dataKey="day" hide />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>

              {/* Filters and Search Bar */}
              <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
                  {[["all", "All"], ...Object.keys(STATUS_META).map((s) => [s, STATUS_META[s].label])].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer ${tab === key ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}
                    >
                      {label} <span className={`ml-1 text-xs ${tab === key ? "text-slate-300" : "text-slate-400"}`}>{counts[key]}</span>
                    </button>
                  ))}
                </div>
                <div className="relative w-full lg:w-80">
                  <Icon.Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search order ID, customer, email…"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Bulk Action Bar */}
              <AnimatePresence>
                {selected.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3"
                  >
                    <span className="text-sm font-semibold text-indigo-800">{selected.size} selected</span>
                    <div className="ml-auto flex flex-wrap gap-2">
                      <button onClick={confirmBulk} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer border-none">
                        <Icon.Check className="h-4 w-4" /> Confirm pending
                      </button>
                      <button onClick={() => setDeleteTarget("bulk")} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 cursor-pointer border-none">
                        <Icon.Trash className="h-4 w-4" /> Delete selected
                      </button>
                      <button onClick={() => setSelected(new Set())} className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 cursor-pointer">
                        Clear
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Orders Table */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
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
                              className={`cursor-pointer border-b border-slate-100 transition last:border-0 ${isSel ? "bg-indigo-50/60" : "hover:bg-indigo-50/30"}`}
                            >
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" checked={isSel} onChange={(e) => toggleSelect(o.id, e)} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-indigo-600" />
                              </td>
                              <td className="px-3 py-3 font-semibold text-indigo-600">{o.id}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${AVATAR_COLORS[o.customer.length % AVATAR_COLORS.length]}`}>
                                    {initials(o.customer)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-800">{o.customer}</p>
                                    <p className="truncate text-xs text-slate-400">{o.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-3 text-slate-500">{fmtDate(o.date)}</td>
                              <td className="px-3 py-3">
                                <div className="flex items-center gap-1">
                                  <span className="mr-1 text-base">{o.items[0]?.emoji || "📦"}</span>
                                  <span className="text-slate-600">{itemCount} item{itemCount > 1 ? "s" : ""}</span>
                                </div>
                              </td>
                              <td className="px-3 py-3 font-bold text-slate-900">{money(total)}</td>
                              <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  {o.status === "pending" && (
                                    <button onClick={(e) => confirmOrder(o.id, e)} title="Confirm order" className="rounded-lg bg-emerald-50 p-2 text-emerald-600 ring-1 ring-emerald-200 transition hover:bg-emerald-100 cursor-pointer border-none">
                                      <Icon.Check className="h-4 w-4" />
                                    </button>
                                  )}
                                  <div className="relative">
                                    <button onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === o.id ? null : o.id); }} title="Change status" className="rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 cursor-pointer bg-white border-none">
                                      <Icon.Chevron className={`h-4 w-4 transition ${menuFor === o.id ? "rotate-180" : ""}`} />
                                    </button>
                                    <AnimatePresence>
                                      {menuFor === o.id && (
                                        <>
                                          <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuFor(null); }} />
                                          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 z-20 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                                            {Object.keys(STATUS_META).map((s) => (
                                              <button key={s} onClick={(e) => { e.stopPropagation(); setStatus(o.id, s); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 cursor-pointer border-none bg-transparent ${o.status === s ? "font-semibold text-indigo-600" : "text-slate-700"}`}>
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
                                  <button onClick={(e) => { e.stopPropagation(); setActiveOrderId(o.id); }} title="Manage details" className="rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 transition hover:bg-slate-100 cursor-pointer bg-white border-none">
                                    <Icon.Eye className="h-4 w-4" />
                                  </button>
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(o); }} title="Delete order" className="rounded-lg p-2 text-rose-500 ring-1 ring-rose-200 transition hover:bg-rose-50 cursor-pointer bg-white border-none">
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Icon.Box className="h-7 w-7" /></div>
                      <p className="font-semibold text-slate-700">No orders found</p>
                      <p className="text-sm text-slate-400">Try a different search or filter.</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-500">
                  <span>Showing {filtered.length === 0 ? 0 : (pageSafe - 1) * PER_PAGE + 1}–{Math.min(pageSafe * PER_PAGE, filtered.length)} of {filtered.length}</span>
                  <div className="flex items-center gap-1">
                    <button disabled={pageSafe <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium transition enabled:hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setPage(n)} className={`h-8 w-8 rounded-lg font-semibold transition cursor-pointer border-none ${n === pageSafe ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 bg-transparent"}`}>{n}</button>
                    ))}
                    <button disabled={pageSafe >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium transition enabled:hover:bg-slate-100 disabled:opacity-40 cursor-pointer">Next</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4"><Icon.Warn className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {deleteTarget === "bulk"
                    ? `Are you sure you want to delete ${selected.size} selected order(s)? This action cannot be undone.`
                    : `Are you sure you want to delete order ${deleteTarget.id}? This action cannot be undone.`}
                </p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 cursor-pointer">Cancel</button>
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
