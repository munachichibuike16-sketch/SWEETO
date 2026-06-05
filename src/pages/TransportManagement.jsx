import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../utils/api';

const MIGRATION_SQL = `-- 1. Create delivery_agents table
CREATE TABLE IF NOT EXISTS public.delivery_agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  dob VARCHAR(50),
  address TEXT,
  vehicle_name VARCHAR(255),
  plate_number VARCHAR(100),
  photo_id TEXT,
  pin VARCHAR(50) DEFAULT '1234',
  avatar TEXT,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  approval_status VARCHAR(50) DEFAULT 'pending',
  zone VARCHAR(255) DEFAULT 'Global',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create agent_location_history table
CREATE TABLE IF NOT EXISTS public.agent_location_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lng NUMERIC(9, 6) NOT NULL,
  accuracy NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add logistics columns to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_agent_id INTEGER,
  ADD COLUMN IF NOT EXISTS tracking_stage VARCHAR(50) DEFAULT 'placed',
  ADD COLUMN IF NOT EXISTS destination_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS destination_lng NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS agent_lat NUMERIC(9, 6),
  ADD COLUMN IF NOT EXISTS agent_lng NUMERIC(9, 6);

-- 4. Enable RLS
ALTER TABLE public.delivery_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_location_history ENABLE ROW LEVEL SECURITY;

-- 5. Create access policies
CREATE POLICY "Allow public select on delivery_agents" ON public.delivery_agents FOR SELECT USING (true);
CREATE POLICY "Allow public insert on delivery_agents" ON public.delivery_agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on delivery_agents" ON public.delivery_agents FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete on delivery_agents" ON public.delivery_agents FOR DELETE USING (true);

CREATE POLICY "Allow public select on agent_location_history" ON public.agent_location_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert on agent_location_history" ON public.agent_location_history FOR INSERT WITH CHECK (true);`;

export default function TransportManagement() {
  const { settings, requestConfirm, showToast } = useStore();
  const currency = settings?.currency || 'FCFA';
  
  // Tabs State
  const [subTab, setSubTab] = React.useState('zones'); // 'zones' | 'applications' | 'agents'
  
  // Shipping Zones state
  const [zones, setZones] = React.useState([]);
  const [zonesLoading, setZonesLoading] = React.useState(true);
  const [isSavingZone, setIsSavingZone] = React.useState(false);
  const [zoneSearch, setZoneSearch] = React.useState('');
  const [newZone, setNewZone] = React.useState({ city: '', price: '' });

  // Agents state
  const [agents, setAgents] = React.useState([]);
  const [agentsLoading, setAgentsLoading] = React.useState(true);
  const [agentSearch, setAgentSearch] = React.useState('');
  
  // Supabase Sync States
  const [usingSupabase, setUsingSupabase] = React.useState(true);
  const [showSqlModal, setShowSqlModal] = React.useState(false);
  const [copiedSql, setCopiedSql] = React.useState(false);

  // Interactivity state
  const [showPinMap, setShowPinMap] = React.useState({});
  const [editingPinId, setEditingPinId] = React.useState(null);
  const [pinInputValue, setPinInputValue] = React.useState('');
  const [selectedPhoto, setSelectedPhoto] = React.useState(null); // Photo ID zoom modal

  React.useEffect(() => {
    fetchZones();
    fetchAgents();
  }, []);

  const fetchZones = async () => {
    try {
      setZonesLoading(true);
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error("Failed to fetch shipping zones:", err);
    } finally {
      setZonesLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      setAgentsLoading(true);
      
      let fetchedAgents = [];
      let activeUsingSupabase = true;
      
      try {
        const { data, error } = await supabase
          .from('delivery_agents')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!error && data) {
          fetchedAgents = data;
          setUsingSupabase(true);
          activeUsingSupabase = true;
        } else {
          if (error && error.code !== 'PGRST205') {
            console.error("Supabase delivery agents fetch warning:", error);
          }
          setUsingSupabase(false);
          activeUsingSupabase = false;
        }
      } catch (err) {
        console.warn("Supabase fetch failed for delivery agents, using local storage:", err);
        setUsingSupabase(false);
        activeUsingSupabase = false;
      }
      
      if (!activeUsingSupabase) {
        fetchedAgents = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]');
      }
      
      setAgents(fetchedAgents);
    } catch (err) {
      console.error("Failed to fetch agents:", err);
    } finally {
      setAgentsLoading(false);
    }
  };

  // SHIPPING ZONE ACTIONS
  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZone.city || !newZone.price) return;
    
    try {
      setIsSavingZone(true);
      const { data: added, error } = await supabase
        .from('shipping_zones')
        .insert([{ name: newZone.city, price: parseInt(newZone.price) }])
        .select()
        .single();
      
      if (error) throw error;
      setZones([...zones, added]);
      setNewZone({ city: '', price: '' });
    } catch (err) {
      console.error("Error adding zone:", err);
    } finally {
      setIsSavingZone(false);
    }
  };

  const handleDeleteZone = (id) => {
    requestConfirm({
      title: 'Delete Shipping Zone?',
      message: 'Are you sure you want to remove this delivery zone? Orders shipped to this city will revert to standard rates.',
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('shipping_zones')
            .delete()
            .eq('id', id);
          if (!error) {
            setZones(zones.filter(z => z.id !== id));
          } else {
            throw error;
          }
        } catch (err) {
          console.error("Error deleting zone:", err);
        }
      }
    });
  };

  // AGENT WORKFLOW ACTIONS
  const handleApproveAgent = async (agentId) => {
    try {
      if (usingSupabase) {
        const { error } = await supabase
          .from('delivery_agents')
          .update({ approval_status: 'approved' })
          .eq('id', agentId);
        if (error) throw error;
      } else {
        const localAgents = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]');
        const updated = localAgents.map(a => a.id === agentId ? { ...a, approval_status: 'approved' } : a);
        localStorage.setItem('sweetohub_agents', JSON.stringify(updated));
      }
      showToast("Courier approved successfully! 🏍️", "success");
      fetchAgents();
    } catch (err) {
      console.error("Failed to approve agent:", err);
      showToast("Failed to approve agent.", "error");
    }
  };

  const handleRejectAgent = async (agentId) => {
    requestConfirm({
      title: 'Reject Application?',
      message: 'Are you sure you want to reject this delivery agent application?',
      type: 'danger',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          if (usingSupabase) {
            const { error } = await supabase
              .from('delivery_agents')
              .update({ approval_status: 'rejected' })
              .eq('id', agentId);
            if (error) throw error;
          } else {
            const localAgents = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]');
            const updated = localAgents.map(a => a.id === agentId ? { ...a, approval_status: 'rejected' } : a);
            localStorage.setItem('sweetohub_agents', JSON.stringify(updated));
          }
          showToast("Application rejected.", "warning");
          fetchAgents();
        } catch (err) {
          console.error("Failed to reject agent:", err);
          showToast("Failed to reject agent.", "error");
        }
      }
    });
  };

  const handleUpdatePin = async (agentId) => {
    if (!pinInputValue.trim()) return;
    try {
      if (usingSupabase) {
        const { error } = await supabase
          .from('delivery_agents')
          .update({ pin: pinInputValue })
          .eq('id', agentId);
        if (error) throw error;
      } else {
        const localAgents = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]');
        const updated = localAgents.map(a => a.id === agentId ? { ...a, pin: pinInputValue } : a);
        localStorage.setItem('sweetohub_agents', JSON.stringify(updated));
      }
      showToast("Security PIN updated! 🔑", "success");
      setEditingPinId(null);
      setPinInputValue('');
      fetchAgents();
    } catch (err) {
      console.error("Failed to update PIN:", err);
      showToast("Failed to update PIN.", "error");
    }
  };

  const handleDeleteAgent = (agentId, agentName) => {
    requestConfirm({
      title: 'Remove Courier?',
      message: `Are you sure you want to delete courier "${agentName}"? This will permanently remove them from the tracking system.`,
      type: 'danger',
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          if (usingSupabase) {
            const { error } = await supabase
              .from('delivery_agents')
              .delete()
              .eq('id', agentId);
            if (error) throw error;
          } else {
            const localAgents = JSON.parse(localStorage.getItem('sweetohub_agents') || '[]');
            const updated = localAgents.filter(a => a.id !== agentId);
            localStorage.setItem('sweetohub_agents', JSON.stringify(updated));
          }
          showToast("Courier deleted permanently.", "success");
          fetchAgents();
        } catch (err) {
          console.error("Failed to delete agent:", err);
          showToast("Failed to delete agent.", "error");
        }
      }
    });
  };

  // Filters
  const filteredZones = zones.filter(z => 
    z.name?.toLowerCase().includes(zoneSearch.toLowerCase())
  );

  const pendingApplications = agents.filter(a => a.approval_status === 'pending');
  const activeCouriers = agents.filter(a => a.approval_status === 'approved' || !a.approval_status);

  const filteredCouriers = activeCouriers.filter(c => 
    c.name?.toLowerCase().includes(agentSearch.toLowerCase()) ||
    c.phone?.includes(agentSearch)
  );

  const filteredApplications = pendingApplications.filter(a => 
    a.name?.toLowerCase().includes(agentSearch.toLowerCase()) ||
    a.phone?.includes(agentSearch)
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 px-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
              <Icons.Truck size={24} />
            </div>
            Transport Logistics
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2 ml-1">Manage delivery pricing, agent logins, and applicant reviews</p>
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl w-fit border border-slate-200/50 dark:border-slate-800/50">
        {[
          { id: 'zones', label: 'Shipping Zones', icon: Icons.MapPin, count: zones.length },
          { id: 'applications', label: 'Pending Applications', icon: Icons.FileCheck, count: pendingApplications.length },
          { id: 'agents', label: 'Active Couriers', icon: Icons.Users, count: activeCouriers.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setSubTab(tab.id);
              setAgentSearch('');
              setZoneSearch('');
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
              subTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                subTab === tab.id 
                  ? 'bg-white text-blue-600' 
                  : tab.id === 'applications'
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Supabase connection alert */}
      {!usingSupabase && (
        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-6 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h5 className="font-black uppercase tracking-wider text-xs flex items-center gap-2">
              <Icons.AlertCircle size={16} className="text-amber-500" /> Offline Mock Mode Active
            </h5>
            <p className="text-[11px] font-bold text-slate-500 mt-1 max-w-2xl leading-relaxed">
              The remote Supabase table <code className="bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded font-bold font-mono text-amber-600 dark:text-amber-400">delivery_agents</code> was not found. 
              Agents are currently stored locally in your browser's local storage. Other devices won't sync until you run the SQL migration.
            </p>
          </div>
          <button 
            onClick={() => setShowSqlModal(true)}
            className="px-5 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-amber-500/10 shrink-0 cursor-pointer"
          >
            Show SQL Script
          </button>
        </div>
      )}

      {/* RENDER ACTIVE TAB VIEW */}
      <AnimatePresence mode="wait">
        {subTab === 'zones' && (
          <motion.div
            key="zones-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* ADD NEW ZONE FORM */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-xl sticky top-8">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8">Add New Zone</h3>
                
                <form onSubmit={handleAddZone} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">City or Village Name</label>
                    <div className="relative">
                      <input 
                        required
                        value={newZone.city}
                        onChange={(e) => setNewZone({...newZone, city: e.target.value})}
                        placeholder="e.g. Anyama" 
                        className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-12" 
                      />
                      <Icons.MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Delivery Fee ({currency})</label>
                    <div className="relative">
                      <input 
                        required
                        type="number"
                        value={newZone.price}
                        onChange={(e) => setNewZone({...newZone, price: e.target.value})}
                        placeholder="2500" 
                        className="w-full bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-12" 
                      />
                      <Icons.DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isSavingZone}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSavingZone ? <Icons.Loader2 className="animate-spin" size={18} /> : <Icons.Plus size={18} />}
                    Add Shipping Zone
                  </button>
                </form>
              </div>
            </div>

            {/* ZONE LIST */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-950/30">
                  <div className="relative flex-1 max-w-sm">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filter zones..." 
                      value={zoneSearch}
                      onChange={(e) => setZoneSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <Icons.CheckCircle2 size={12} />
                    {zones.length} Active Zones
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {zonesLoading ? (
                    <div className="p-20 text-center"><Icons.Loader2 className="animate-spin mx-auto text-blue-500" /></div>
                  ) : filteredZones.length === 0 ? (
                    <div className="p-20 text-center text-slate-500 font-medium italic text-sm">No shipping zones found.</div>
                  ) : (
                    filteredZones.map((zone, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={zone.id} 
                        className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Icons.MapPin size={18} />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{zone.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Delivery Fee: <span className="text-blue-500">{zone.price?.toLocaleString()} {currency}</span></p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteZone(zone.id)}
                          className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"
                        >
                          <Icons.Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {subTab === 'applications' && (
          <motion.div
            key="applications-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  type="text" 
                  placeholder="Search applications by name or phone..." 
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Reviewing Pending Applications
              </div>
            </div>

            {/* Applications List */}
            {agentsLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 p-20 text-center shadow-xl">
                <Icons.Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 p-16 text-center shadow-sm text-slate-500 font-semibold italic">
                No pending delivery applications found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredApplications.map((app, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={app.id}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-md relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                          {app.avatar ? (
                            <img src={app.avatar} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <Icons.User size={24} className="text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{app.name}</h4>
                          <span className="text-[9px] font-black tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded-full uppercase">
                            Pending Review
                          </span>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-850/50 text-xs mb-6">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Email</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 truncate block max-w-[150px]">{app.email || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Birth Date</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.dob || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Vehicle</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{app.vehicle_name} ({app.plate_number})</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Residential Address</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-300 leading-relaxed block">{app.address || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Photo ID Capture */}
                      {app.photo_id && (
                        <div className="mb-6">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Uploaded Document ID</span>
                          <div 
                            onClick={() => setSelectedPhoto(app.photo_id)}
                            className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-28 cursor-zoom-in bg-slate-950 flex items-center justify-center"
                          >
                            <img src={app.photo_id} alt="Photo ID" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest gap-2">
                              <Icons.Eye size={14} /> Click to zoom
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                      <button
                        onClick={() => handleRejectAgent(app.id)}
                        className="flex-1 py-3.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-black rounded-xl uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Icons.X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleApproveAgent(app.id)}
                        className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Icons.Check size={14} /> Approve & PIN
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {subTab === 'agents' && (
          <motion.div
            key="agents-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Filter */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-wrap gap-4 items-center justify-between shadow-sm">
              <div className="relative flex-1 max-w-sm">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                <input 
                  type="text" 
                  placeholder="Search couriers..." 
                  value={agentSearch}
                  onChange={(e) => setAgentSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Managing Active Logistics Team
              </div>
            </div>

            {/* Couriers List */}
            {agentsLoading ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 p-20 text-center shadow-xl">
                <Icons.Loader2 className="animate-spin mx-auto text-blue-500" size={32} />
              </div>
            ) : filteredCouriers.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/50 p-16 text-center shadow-sm text-slate-500 font-semibold italic">
                No active delivery couriers found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCouriers.map((courier, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={courier.id}
                    className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Avatar and rating */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/55 flex items-center justify-center">
                            {courier.avatar ? (
                              <img src={courier.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <Icons.User size={20} className="text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{courier.name}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold">{courier.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-lg text-[10px] font-black">
                          <Icons.Star size={12} fill="currentColor" /> {courier.rating?.toFixed(1) || '5.0'}
                        </div>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 mb-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Default Zone</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded-md">
                            {courier.zone || 'Global'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Vehicle</span>
                          <span className="font-semibold text-slate-650 dark:text-slate-300">
                            {courier.vehicle_name ? `${courier.vehicle_name} (${courier.plate_number})` : 'Standard Motorcycle'}
                          </span>
                        </div>

                        {/* PIN Security View & Edit */}
                        <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-800/50 pt-2.5 mt-2">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Security Pin</span>
                          <div className="flex items-center gap-2">
                            {editingPinId === courier.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  maxLength={6}
                                  value={pinInputValue}
                                  onChange={(e) => setPinInputValue(e.target.value.replace(/\D/g, ''))}
                                  placeholder="New PIN"
                                  className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded font-black text-center text-xs outline-none"
                                />
                                <button
                                  onClick={() => handleUpdatePin(courier.id)}
                                  className="p-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                                >
                                  <Icons.Check size={12} />
                                </button>
                                <button
                                  onClick={() => setEditingPinId(null)}
                                  className="p-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded"
                                >
                                  <Icons.X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-black font-mono text-slate-900 dark:text-white tracking-widest text-sm bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-850">
                                  {showPinMap[courier.id] ? courier.pin || '1234' : '••••'}
                                </span>
                                <button
                                  onClick={() => setShowPinMap({ ...showPinMap, [courier.id]: !showPinMap[courier.id] })}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                                >
                                  {showPinMap[courier.id] ? <Icons.EyeOff size={13} /> : <Icons.Eye size={13} />}
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingPinId(courier.id);
                                    setPinInputValue(courier.pin || '1234');
                                  }}
                                  className="text-slate-450 hover:text-blue-500 transition-colors"
                                >
                                  <Icons.Edit3 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delete Courier Card Button */}
                    <button
                      onClick={() => handleDeleteAgent(courier.id, courier.name)}
                      className="w-full py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 font-bold rounded-xl uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-1.5 active:scale-95 mt-2"
                    >
                      <Icons.Trash2 size={13} /> Remove Courier
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL PHOTO REVIEW OVERLAY MODAL */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-md"
          >
            <div className="relative max-w-3xl w-full max-h-[85vh] bg-slate-900 rounded-[2rem] border border-white/10 p-4 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              >
                <Icons.X size={20} />
              </button>
              
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img 
                  src={selectedPhoto} 
                  alt="High-Res Document ID" 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-white/5" 
                />
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-2">
                Document Photo ID verification view
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Supabase SQL Setup instructions */}
      <AnimatePresence>
        {showSqlModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/50"
          >
            <div 
              onClick={() => setShowSqlModal(false)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 max-w-2xl w-full border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 shrink-0">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md flex items-center gap-2">
                  <Icons.Shield size={18} className="text-amber-500" /> Database Migration SQL
                </h3>
                <button 
                  onClick={() => setShowSqlModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed mb-6 text-left">
                Log into your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Supabase Dashboard</a>, select your project, open the <span className="text-slate-900 dark:text-white">SQL Editor</span>, paste the following SQL code, and click <span className="text-slate-900 dark:text-white">Run</span>.
              </p>

              <div className="relative bg-slate-950 p-6 rounded-2xl border border-slate-850 font-mono text-[10px] text-emerald-400 text-left overflow-x-auto select-all max-h-[300px] custom-scrollbar mb-6 shrink-0">
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(MIGRATION_SQL);
                    setCopiedSql(true);
                    showToast("SQL script copied to clipboard! 📋", "success");
                    setTimeout(() => setCopiedSql(false), 2000);
                  }}
                  className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl transition-all shadow-md cursor-pointer"
                  title="Copy SQL to Clipboard"
                >
                  {copiedSql ? <Icons.Check size={14} className="text-emerald-400" /> : <Icons.Copy size={14} />}
                </button>
                <pre className="whitespace-pre">{MIGRATION_SQL}</pre>
              </div>

              <button 
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg"
              >
                Dismiss
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
