import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Phone, Mail, ShoppingBag, TrendingUp, Award, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
        
      // Group orders by phone/email to identify unique customers
      const customerMap = {};
      (orders || []).forEach(order => {
        const contact = order.customer_contact || 'Unknown';
        if (!customerMap[contact]) {
          customerMap[contact] = {
            name: order.customer_name,
            contact: contact,
            orderCount: 0,
            totalSpent: 0,
            lastOrder: order.created_at,
            orders: []
          };
        }
        customerMap[contact].orderCount += 1;
        customerMap[contact].totalSpent += (order.total_amount || order.total || 0);
        if (new Date(order.created_at) > new Date(customerMap[contact].lastOrder)) {
          customerMap[contact].lastOrder = order.created_at;
        }
        customerMap[contact].orders.push(order);
      });

      setCustomers(Object.values(customerMap).sort((a, b) => b.orderCount - a.orderCount));
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.contact?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={20} />
            </div>
            Customer CRM
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">Track loyalty and reward your top customers</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Users size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Customers</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{customers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><UserCheck size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Returning Customers</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{customers.filter(c => c.orderCount > 1).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Award size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top Spenders (VIP)</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{customers.filter(c => c.totalSpent > 500000).length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or contact..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={14} />
            Auto-Loyalty Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Info</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spent</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.map((customer, i) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  key={i} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-black text-sm">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{customer.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Last: {new Date(customer.lastOrder).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Phone size={12} className="text-purple-500" />
                        <span className="text-xs font-medium">{customer.contact.split('|')[0]}</span>
                      </div>
                      {customer.contact.includes('|') && customer.contact.split('|')[1].trim() && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Mail size={12} className="text-blue-500" />
                          <span className="text-xs font-medium">{customer.contact.split('|')[1].trim()}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-900 dark:text-white">
                      <ShoppingBag size={12} />
                      {customer.orderCount}
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{customer.totalSpent.toLocaleString()} FCFA</p>
                  </td>
                  <td className="p-6">
                    {customer.orderCount > 2 ? (
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                        <Award size={10} /> VIP Member
                      </span>
                    ) : customer.orderCount > 1 ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                        <TrendingUp size={10} /> Loyal
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit">
                        New Customer
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="p-20 text-center text-slate-500 font-medium">
              No customers found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
