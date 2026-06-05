import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Phone, Mail, ShoppingBag, TrendingUp, Award, 
  UserCheck, Trash2, Eye, Calendar, X, Shield, Lock, MapPin,
  AlertCircle, Copy, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';

// SQL migration script for Supabase
const MIGRATION_SQL = `-- 1. Create customer_accounts table
CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_country_code VARCHAR(50),
  phone_number VARCHAR(100),
  password VARCHAR(255),
  avatar_url TEXT,
  provider VARCHAR(50) DEFAULT 'email',
  address TEXT,
  city TEXT,
  preferences JSONB DEFAULT '{"smsAlerts": true, "whatsappUpdates": true, "promoEmails": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.customer_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Create access policies
CREATE POLICY "Allow public select on customer_accounts" ON public.customer_accounts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on customer_accounts" ON public.customer_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on customer_accounts" ON public.customer_accounts
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow admin delete on customer_accounts" ON public.customer_accounts
  FOR DELETE TO authenticated USING (public.is_admin());`;

export default function CustomersManagement() {
  const { showToast } = useStore();
  const [activeSubTab, setActiveSubTab] = useState('crm'); // 'crm' | 'accounts'
  const [customers, setCustomers] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Supabase Sync States
  const [usingSupabase, setUsingSupabase] = useState(true);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  
  // Modals state
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState(null);

  useEffect(() => {
    fetchCustomersAndAccounts();
  }, []);

  const fetchCustomersAndAccounts = async () => {
    try {
      setLoading(true);
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const ordersData = orders || [];
      setOrdersList(ordersData);
        
      // 1. Group orders by contact to identify unique CRM customers
      const customerMap = {};
      ordersData.forEach(order => {
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

      // 2. Fetch registered accounts from Supabase first
      let registeredUsers = [];
      let activeUsingSupabase = true;
      try {
        const { data, error: dbErr } = await supabase
          .from('customer_accounts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!dbErr && data) {
          registeredUsers = data.map(dbUser => ({
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            phoneCountryCode: dbUser.phone_country_code,
            phoneNumber: dbUser.phone_number,
            avatarUrl: dbUser.avatar_url,
            picture: dbUser.avatar_url,
            provider: dbUser.provider,
            address: dbUser.address,
            city: dbUser.city,
            preferences: dbUser.preferences,
            createdAt: dbUser.created_at
          }));
          setUsingSupabase(true);
          activeUsingSupabase = true;
        } else {
          if (dbErr && dbErr.code !== 'PGRST205') {
            console.error("Supabase customer accounts query warning:", dbErr);
          }
          setUsingSupabase(false);
          activeUsingSupabase = false;
        }
      } catch (err) {
        console.warn("Supabase fetch failed, using local storage:", err);
        setUsingSupabase(false);
        activeUsingSupabase = false;
      }

      // Fallback if Supabase table is not present
      if (!activeUsingSupabase) {
        registeredUsers = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      }

      const accountsWithStats = registeredUsers.map(u => {
        // Find orders matching this user strictly (by user ID, email or phone)
        const cleanPhone = u.phoneNumber || u.phone ? (u.phoneNumber || u.phone).replace(/\D/g, '') : '';
        const userOrders = ordersData.filter(o => {
          const contact = o.customer_contact || '';
          const isEmailMatch = u.email && contact.toLowerCase().includes(u.email.toLowerCase());
          const isIdMatch = u.id && contact.includes(u.id);
          const isPhoneMatch = cleanPhone && cleanPhone.length >= 8 && contact.replace(/\D/g, '').includes(cleanPhone);
          return isEmailMatch || isIdMatch || isPhoneMatch;
        });

        return {
          ...u,
          orders: userOrders,
          orderCount: userOrders.length,
          totalSpent: userOrders.reduce((sum, o) => sum + (o.total_amount || o.total || 0), 0)
        };
      });

      setAccounts(accountsWithStats.sort((a, b) => b.orderCount - a.orderCount));

    } catch (err) {
      console.error("Failed to fetch customers & accounts:", err);
      showToast("Failed to retrieve database records.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirmDeleteEmail) return;
    try {
      // 1. Delete from Supabase
      try {
        const { error } = await supabase
          .from('customer_accounts')
          .delete()
          .eq('email', confirmDeleteEmail.toLowerCase());
        
        if (error && error.code !== 'PGRST205') console.error("Failed to delete from Supabase:", error);
      } catch (dbErr) {
        console.warn("Supabase delete failed:", dbErr);
      }

      // 2. Delete from local storage
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      const filteredUsers = users.filter(u => u.email.toLowerCase() !== confirmDeleteEmail.toLowerCase());
      localStorage.setItem('sweetohub_users', JSON.stringify(filteredUsers));
      
      // Also log them out if this is their active session
      const session = JSON.parse(localStorage.getItem('sweetohub_session'));
      if (session && session.email.toLowerCase() === confirmDeleteEmail.toLowerCase()) {
        localStorage.removeItem('sweetohub_session');
      }

      showToast("Registered account deleted successfully! 🗑️", "success");
      setConfirmDeleteEmail(null);
      fetchCustomersAndAccounts();
    } catch (err) {
      console.error("Failed to delete account:", err);
      showToast("Failed to delete account.", "error");
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL);
    setCopiedSql(true);
    showToast("SQL script copied to clipboard! 📋", "success");
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.contact?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAccounts = accounts.filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.email?.toLowerCase().includes(search.toLowerCase()) || 
    (a.phoneNumber || a.phone || '').includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500">
              <Users size={20} />
            </div>
            Customer CRM & Accounts
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 ml-14">Track loyalty, audit registered accounts, and review customer actions.</p>
        </div>
      </div>

      {/* CRM vs Accounts Tab Selector */}
      <div className="flex bg-slate-100/80 dark:bg-slate-950 p-1 border border-slate-200/50 dark:border-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => { setActiveSubTab('crm'); setSearch(''); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'crm' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          CRM Profiles (Loyalty)
        </button>
        <button
          onClick={() => { setActiveSubTab('accounts'); setSearch(''); }}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeSubTab === 'accounts' ? 'bg-purple-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Registered Accounts ({accounts.length})
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><Users size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Customers</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {activeSubTab === 'crm' ? customers.length : accounts.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><UserCheck size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Returning Customers</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {activeSubTab === 'crm' ? customers.filter(c => c.orderCount > 1).length : accounts.filter(a => a.orderCount > 1).length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center"><Award size={20}/></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">VIP Spenders (&gt;500k)</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
            {activeSubTab === 'crm' ? customers.filter(c => c.totalSpent > 500000).length : accounts.filter(a => a.totalSpent > 500000).length}
          </p>
        </div>
      </div>

      {/* Supabase connection alert */}
      {activeSubTab === 'accounts' && !usingSupabase && (
        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-6 rounded-[2rem] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <h5 className="font-black uppercase tracking-wider text-xs flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" /> Offline Mock Mode Active
            </h5>
            <p className="text-[11px] font-bold text-slate-500 mt-1 max-w-2xl leading-relaxed">
              The remote Supabase table <code className="bg-amber-500/10 dark:bg-amber-500/20 px-1.5 py-0.5 rounded font-bold font-mono text-amber-600 dark:text-amber-400">customer_accounts</code> was not found. 
              Accounts are currently stored locally in your browser's local storage. Other devices won't sync until you run the SQL migration.
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

      {/* Main content table card */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <input 
              type="text" 
              placeholder={activeSubTab === 'crm' ? "Search CRM by name or contact..." : "Search accounts by name, email, phone..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all font-medium text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-xl text-[10px] font-black uppercase tracking-widest">
            <TrendingUp size={14} />
            {activeSubTab === 'crm' ? 'Loyalty tracking active' : 'Account auditing active'}
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeSubTab === 'crm' ? (
            /* CRM VIEW */
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
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Last Order: {new Date(customer.lastOrder).toLocaleDateString()}</p>
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
          ) : (
            /* REGISTERED ACCOUNTS VIEW */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Holder</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email & Phone</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Auth Method</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Orders</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spent</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAccounts.map((account, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={account.id || i}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        {account.avatarUrl || account.picture ? (
                          <img 
                            src={account.avatarUrl || account.picture} 
                            alt={account.name} 
                            className="w-10 h-10 rounded-xl object-cover border border-slate-100 dark:border-slate-850"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-purple-500 text-white font-black text-sm flex items-center justify-center">
                            {account.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">{account.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1 uppercase tracking-wider">
                            <Calendar size={10}/> Joined: {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{account.email}</p>
                        {(account.phoneNumber || account.phone) && (
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                            {account.phoneCountryCode || ''} {account.phoneNumber || account.phone}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-6">
                      {account.provider === 'google' ? (
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                          <Shield size={10} /> Google OAuth
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                          <Lock size={10} /> Password Auth
                        </span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black text-slate-900 dark:text-white">
                        <ShoppingBag size={12} />
                        {account.orderCount}
                      </span>
                    </td>
                    <td className="p-6">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{account.totalSpent.toLocaleString()} FCFA</p>
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedAccount(account)}
                          title="View Account Activity & Details"
                          className="p-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteEmail(account.email)}
                          title="Delete Registered Account"
                          className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Fallback empty view */}
          {((activeSubTab === 'crm' && filteredCustomers.length === 0) || (activeSubTab === 'accounts' && filteredAccounts.length === 0)) && (
            <div className="p-20 text-center text-slate-500 font-medium">
              No results found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Activity & Details Drawer */}
      <AnimatePresence>
        {selectedAccount && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-4 bg-black/50"
          >
            <div 
              onClick={() => setSelectedAccount(null)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-900 max-w-xl w-full border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 shrink-0">
                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md flex items-center gap-2">
                  <UserCheck size={18} className="text-purple-500" /> Account Audit Log
                </h3>
                <button 
                  onClick={() => setSelectedAccount(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-655"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Account Bio Header */}
              <div className="flex flex-col items-center text-center space-y-3 mb-8 shrink-0">
                {selectedAccount.avatarUrl || selectedAccount.picture ? (
                  <img 
                    src={selectedAccount.avatarUrl || selectedAccount.picture} 
                    alt={selectedAccount.name} 
                    className="w-20 h-20 rounded-3xl object-cover border-2 border-purple-500 shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-500 text-white font-black text-2xl flex items-center justify-center shadow-lg">
                    {selectedAccount.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedAccount.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{selectedAccount.email}</p>
                </div>
                
                {/* Stats tags row */}
                <div className="flex gap-3 justify-center pt-2">
                  <span className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Orders: {selectedAccount.orderCount}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-[9px] font-black uppercase tracking-wider text-purple-500">
                    Spent: {selectedAccount.totalSpent.toLocaleString()} FCFA
                  </span>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="space-y-4 mb-8 text-left bg-slate-50 dark:bg-slate-950/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-850 shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-900 pb-2">
                  <Shield className="text-purple-500" size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Credentials & Auth Info</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Account ID</p>
                    <p className="font-mono text-[10px] font-black text-slate-700 dark:text-slate-300 mt-1 truncate">{selectedAccount.id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Auth Provider</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-1 capitalize">{selectedAccount.provider || 'Email'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Phone number</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-1">{selectedAccount.phoneCountryCode || ''} {selectedAccount.phoneNumber || selectedAccount.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Joined Date</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-1">{selectedAccount.createdAt ? new Date(selectedAccount.createdAt).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>
                {selectedAccount.address && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-900 text-xs">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><MapPin size={10}/> Default Address</p>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">{selectedAccount.address}{selectedAccount.city ? `, ${selectedAccount.city}` : ''}</p>
                  </div>
                )}
              </div>

              {/* Order History Log */}
              <div className="flex-1 overflow-y-auto min-h-[180px] custom-scrollbar text-left flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 shrink-0">
                  <ShoppingBag className="text-purple-500" size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Purchase Activity Trail ({selectedAccount.orders.length})</span>
                </div>
                
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {selectedAccount.orders.map((o) => (
                    <div key={o.id} className="p-4 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex justify-between items-center hover:border-purple-500/20 transition-all shadow-sm">
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-xs">Order #{o.id}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-white text-xs">{o.total_amount || o.total || 0} FCFA</p>
                        <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 ${
                          o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          o.status === 'shipping' || o.status === 'on_the_way' ? 'bg-blue-500/10 text-blue-500' :
                          o.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedAccount.orders.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                      No purchase activity logged.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Delete Confirmation Popup */}
      <AnimatePresence>
        {confirmDeleteEmail && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50"
          >
            <div 
              onClick={() => setConfirmDeleteEmail(null)}
              className="absolute inset-0 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-slate-900 max-w-sm w-full border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 text-center shadow-2xl z-10"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                <Trash2 size={28} />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2">Delete Account?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed mb-6">
                Are you sure you want to delete the registered account for <span className="text-slate-800 dark:text-slate-200 font-black">{confirmDeleteEmail}</span>? This action is permanent.
              </p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteEmail(null)}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-500/10"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
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
                  <Shield size={18} className="text-amber-500" /> Database Migration SQL
                </h3>
                <button 
                  onClick={() => setShowSqlModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider leading-relaxed mb-6 text-left">
                Log into your <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:underline">Supabase Dashboard</a>, select your project, open the <span className="text-slate-900 dark:text-white">SQL Editor</span>, paste the following SQL code, and click <span className="text-slate-900 dark:text-white">Run</span>.
              </p>

              <div className="relative bg-slate-950 p-6 rounded-2xl border border-slate-850 font-mono text-[10px] text-emerald-400 text-left overflow-x-auto select-all max-h-[300px] custom-scrollbar mb-6 shrink-0">
                <button 
                  onClick={handleCopySql}
                  className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl transition-all shadow-md cursor-pointer"
                  title="Copy SQL to Clipboard"
                >
                  {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <pre className="whitespace-pre">{MIGRATION_SQL}</pre>
              </div>

              <button 
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
