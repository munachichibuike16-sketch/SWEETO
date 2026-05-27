import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';

export default function TransportManagement() {
  const { settings, requestConfirm } = useStore();
  const currency = settings?.currency || 'FCFA';
  const [zones, setZones] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  
  // Form State
  const [newZone, setNewZone] = React.useState({ city: '', price: '' });

  React.useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setZones(data || []);
    } catch (err) {
      console.error("Failed to fetch shipping zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZone.city || !newZone.price) return;
    
    try {
      setIsSaving(true);
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
      setIsSaving(false);
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

  const filteredZones = zones.filter(z => 
    z.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
              <Icons.Truck size={24} />
            </div>
            Transport Logistics
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-2 ml-1">Manage delivery pricing for cities and villages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-12" 
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
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all pl-12" 
                  />
                  <Icons.DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? <Icons.Loader2 className="animate-spin" size={18} /> : <Icons.Plus size={18} />}
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
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter zones..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                <Icons.CheckCircle2 size={12} />
                {zones.length} Active Zones
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
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
      </div>
    </div>
  );
}
