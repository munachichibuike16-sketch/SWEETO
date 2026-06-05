import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SweetoLogo from '../components/SweetoLogo';

const AdminLogin = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const { settings, showToast } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Simulate high-tech decryption/authorizing process for added aesthetic flavor
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        setError('Decryption Failed: ' + authError.message);
        showToast('Access denied', 'error');
        return;
      }

      if (data?.session) {
        sessionStorage.setItem('sweetohub_admin_token', data.session.access_token);
        sessionStorage.setItem('sweetohub_admin_authenticated', 'true');
        showToast('Admin authenticated 🎉', 'success');
        if (onLoginSuccess) {
          onLoginSuccess();
        } else {
          navigate('/dashboard');
        }
      } else {
        setError('Decryption Failed: No session returned');
        showToast('Access denied', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Decryption Failed: Could not contact security terminal');
      showToast('Connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden font-sans select-none text-slate-100">
      {/* Animated matrix/cyber flows in the background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.03),transparent_60%)]"></div>
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#090d16]/80 backdrop-blur-2xl border border-slate-800/80 rounded-[2.5rem] p-10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] text-center space-y-8 overflow-hidden"
      >
        {/* Top glowing tech line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>

        {/* Brand Logo Pulsing in the Center */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-[1.8rem] border border-cyan-500/20 animate-ping scale-105 opacity-40"></div>
          <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-[1.8rem] border border-white/10 flex items-center justify-center shadow-inner">
            <SweetoLogo size={74} className="w-full h-full drop-shadow-[0_0_12px_rgba(0,242,254,0.4)] animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-white font-black text-[10px] uppercase tracking-[0.4em] text-cyan-500 flex items-center justify-center gap-2">
            <Shield size={14} className="animate-pulse text-cyan-400" />
            Security Terminal
          </h2>
          <h1 className="text-slate-100 font-extrabold text-2xl tracking-tight uppercase">
            Control Center Locked
          </h1>
          <p className="text-slate-400 font-bold text-[10px] max-w-xs mx-auto leading-relaxed uppercase tracking-wider">
            Enter administrative credentials to gain decryption key.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email field */}
          <div className="space-y-2 text-left group">
            <label className="text-[10px] font-black text-slate-500 group-focus-within:text-cyan-500 uppercase tracking-widest ml-1 transition-colors">
              Admin Username (Email)
            </label>
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 focus-within:border-cyan-500 bg-slate-950/60 shadow-inner transition-all duration-300">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors">
                <Shield size={16} />
              </div>
              <input
                type="email"
                required
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-transparent outline-none font-bold text-slate-100 text-xs tracking-wide placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-2 text-left group">
            <label className="text-[10px] font-black text-slate-500 group-focus-within:text-cyan-500 uppercase tracking-widest ml-1 transition-colors">
              Master Decrypt Key
            </label>
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 focus-within:border-cyan-500 bg-slate-950/60 shadow-inner transition-all duration-300">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors">
                <Lock size={16} />
              </div>
              <input
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-16 py-5 bg-transparent outline-none font-bold text-slate-100 text-xs tracking-widest placeholder:text-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-left font-black text-[9px] uppercase tracking-wider leading-relaxed"
              >
                <AlertTriangle size={16} className="shrink-0 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-5 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer text-center"
            >
              Exit to Store
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Decrypting...</span>
                </>
              ) : (
                <>
                  <Key size={14} />
                  <span>Authorize Access</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-900 flex justify-between items-center text-[8px] font-black text-slate-600 uppercase tracking-widest">
          <span>Terminal V2.0.1</span>
          <span className="flex items-center gap-1">
            <Lock size={8} /> Secure Socket Link
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
