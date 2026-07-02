import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import LiveChatManagement from '../components/LiveChatManagement';
import { ArrowLeft } from 'lucide-react';
import AdminLogin from './AdminLogin';
import AdminPinLock from '../components/AdminPinLock';

export default function ChatPage() {
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Verify Admin authentication status
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        const sessionAuth = sessionStorage.getItem('sweetohub_admin_authenticated') === 'true';
        
        if (user && !userError && sessionAuth) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAdminAuth();
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleAdminLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('sweetohub_admin_authenticated');
      sessionStorage.removeItem('sweetohub_admin_token');
      setIsAdmin(false);
      setIsUnlocked(false);
      showToast("Logged out of Admin Portal", "info");
      window.location.reload();
    } catch (e) {}
  };

  // Force Admin Login if not authenticated
  if (!isAdmin) {
    return (
      <AdminLogin 
        onLoginSuccess={() => {
          setIsAdmin(true);
          setIsUnlocked(true);
        }} 
      />
    );
  }

  if (!isUnlocked) {
    return <AdminPinLock onUnlock={() => setIsUnlocked(true)} onSignOut={handleAdminLogout} />;
  }

  // Render Admin Chat Dashboard View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300 flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-widest leading-none">
              Admin Chat Portal
            </h1>
            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mt-1">
              Connected as SWEETO HUB (+2250500619923)
            </span>
          </div>
        </div>
        <button
          onClick={handleAdminLogout}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer transition-all"
        >
          Sign Out Admin
        </button>
      </div>

      {/* Live Chat Panel */}
      <div className="flex-1 p-6 flex items-stretch justify-center max-w-7xl w-full mx-auto">
        <LiveChatManagement />
      </div>
    </div>
  );
}
