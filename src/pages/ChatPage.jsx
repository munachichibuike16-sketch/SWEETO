import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useStore } from '../contexts/StoreContext';
import LiveChatManagement from '../components/LiveChatManagement';
import { ArrowLeft, Bell, BellOff } from 'lucide-react';
import AdminLogin from './AdminLogin';
import AdminPinLock from '../components/AdminPinLock';

export default function ChatPage() {
  const { showToast } = useStore();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notifPermission, setNotifPermission] = useState('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      showToast('Notifications are not supported on this device.', 'warning');
      return;
    }

    if (Notification.permission === 'granted') {
      showToast('Browser notifications are already active! 🔔', 'success');
      return;
    }

    if (Notification.permission === 'denied') {
      showToast('Notifications are blocked. Please enable them in your browser settings.', 'warning');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === 'granted') {
        showToast('Notification permission granted! Subscribing... ⏳', 'info');
        
        // Register SW & Subscribe to push manager
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Fetch VAPID public key
        const { data: settingData, error: settingErr } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'vapid_public_key')
          .single();

        if (settingErr) throw settingErr;
        const publicKey = settingData?.value;
        if (!publicKey) throw new Error('VAPID key not configured in settings');

        // Convert base64 VAPID key to Uint8Array
        const padding = '='.repeat((4 - publicKey.length % 4) % 4);
        const base64 = (publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const applicationServerKey = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          applicationServerKey[i] = rawData.charCodeAt(i);
        }

        // Subscribe device
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        // Save subscription
        const rawSub = subscription.toJSON();
        const { error: subErr } = await supabase
          .from('push_subscriptions')
          .upsert({
            endpoint: subscription.endpoint,
            p256dh: rawSub.keys?.p256dh || '',
            auth: rawSub.keys?.auth || '',
            role: 'admin'
          }, { onConflict: 'endpoint' });

        if (subErr) throw subErr;

        showToast('Successfully subscribed to browser alerts! 🔔', 'success');
      } else {
        showToast('Notification access was denied.', 'warning');
      }
    } catch (err) {
      console.error('Push subscription failed:', err);
      showToast('Subscription failed: ' + err.message, 'error');
    }
  };

  // Verify Admin authentication status and listen for logout signals
  useEffect(() => {
    let clientId = sessionStorage.getItem('sweetohub_admin_client_id');
    if (!clientId) {
      clientId = `client_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      sessionStorage.setItem('sweetohub_admin_client_id', clientId);
    }

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

    // Subscribe to logout signals
    const channel = supabase
      .channel('chat_admin_signals_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_signals' }, async (payload) => {
        const signal = payload.new;
        if (signal.signal_type === 'logout') {
          const localId = sessionStorage.getItem('sweetohub_admin_client_id');
          if (signal.except_session_id !== localId) {
            await supabase.auth.signOut();
            sessionStorage.clear();
            window.location.reload();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        <div className="flex items-center gap-3">
          {/* Notification Toggle Button */}
          <button
            onClick={handleToggleNotifications}
            className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
              notifPermission === 'granted'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : notifPermission === 'denied'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {notifPermission === 'granted' ? (
              <>
                <Bell size={13} className="text-blue-500 animate-pulse" />
                <span>Notifications Active</span>
              </>
            ) : notifPermission === 'denied' ? (
              <>
                <BellOff size={13} />
                <span>Notifications Blocked</span>
              </>
            ) : (
              <>
                <Bell size={13} />
                <span>Enable Notifications</span>
              </>
            )}
          </button>

          <button
            onClick={handleAdminLogout}
            className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 cursor-pointer transition-all"
          >
            Sign Out Admin
          </button>
        </div>
      </div>

      {/* Live Chat Panel */}
      <div className="flex-1 p-6 flex items-stretch justify-center max-w-7xl w-full mx-auto">
        <LiveChatManagement />
      </div>
    </div>
  );
}
