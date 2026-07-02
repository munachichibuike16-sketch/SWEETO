import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, PhoneCall, Image, MapPin, Loader2, Smile, Lock, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { uploadToStorage } from '../utils/storageHelper';
import SweetoLogo from '../components/SweetoLogo';

export default function CustomerSupportPage() {
  const { lang } = useLanguage();
  const { showToast } = useStore();
  const navigate = useNavigate();

  // Authentication & session state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');

  // Messages log state
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Helper to detect image URLs
  const isImageUrl = (url) => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http') && (
      url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || 
      url.includes('/uploads/upload_')
    );
  };

  // Helper to detect Google Map URLs
  const isMapUrl = (url) => {
    if (typeof url !== 'string') return false;
    return url.startsWith('http') && url.includes('google.com/maps');
  };

  // 1. Initialize user session checking on mount
  useEffect(() => {
    const checkUserSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem('sweetohub_session'));
        if (session) {
          setIsLoggedIn(true);
          setUsername(session.name || session.email || 'Client');
          setPhone(session.phone || '');
          
          // Use user ID or email as persistent session ID so their chat history spans across all devices
          const userSessionId = `user_${session.id || session.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
          setSessionId(userSessionId);
        } else {
          setIsLoggedIn(false);
        }
      } catch (e) {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkUserSession();
  }, []);

  // 2. Fetch past messages and subscribe to real-time additions once authenticated
  useEffect(() => {
    if (!isLoggedIn || !sessionId || !supabase) return;

    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching support messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to new messages for this account
    const channel = supabase
      .channel(`support_page_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });

          // Play message sound if it is from admin
          if (payload.new.sender_role === 'admin') {
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isLoggedIn]);

  // 3. Scroll to bottom of message list
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send Text Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || isSending || !supabase) return;

    const messageText = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    try {
      const { error } = await supabase.from('chat_messages').insert([
        {
          session_id: sessionId,
          customer_name: username,
          customer_phone: phone || null,
          sender_role: 'customer',
          message_text: messageText
        }
      ]);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessageText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  // Share Image Upload
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;

    setIsUploading(true);
    showToast(lang === 'fr' ? 'Téléchargement de l\'image...' : 'Uploading image...', 'info');

    try {
      const publicUrl = await uploadToStorage(file, 'chat_images');
      
      const { error } = await supabase.from('chat_messages').insert([
        {
          session_id: sessionId,
          customer_name: username,
          customer_phone: phone || null,
          sender_role: 'customer',
          message_text: publicUrl
        }
      ]);

      if (error) throw error;
      showToast(lang === 'fr' ? 'Image envoyée ! 📸' : 'Image sent! 📸', 'success');
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Share Location (GPS coordinates)
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      return;
    }

    setIsLocating(true);
    showToast(lang === 'fr' ? 'Accès GPS en cours...' : 'Requesting GPS lock...', 'info');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          const { error } = await supabase.from('chat_messages').insert([
            {
              session_id: sessionId,
              customer_name: username,
              customer_phone: phone || null,
              sender_role: 'customer',
              message_text: mapsUrl
            }
          ]);

          if (error) throw error;
          showToast(lang === 'fr' ? 'Localisation partagée ! 📍' : 'Location shared! 📍', 'success');
        } catch (err) {
          console.error('Failed to send location message:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Could not fetch location. Please ensure location services are enabled.', 'error');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Custom message content formatting (Image, GPS Map, Text)
  const renderMessageText = (msg) => {
    const text = msg.message_text;

    if (isImageUrl(text)) {
      return (
        <div className="relative group overflow-hidden rounded-2xl max-w-[260px] sm:max-w-xs shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5">
          <img
            src={text}
            alt="Shared asset"
            className="w-full h-auto object-cover max-h-60 cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
            onClick={() => window.open(text, '_blank')}
          />
        </div>
      );
    }

    if (isMapUrl(text)) {
      return (
        <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 text-slate-800 dark:text-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-2 max-w-[260px] sm:max-w-xs leading-relaxed">
          <div className="flex items-center gap-2 text-red-500 font-extrabold text-[10px] uppercase tracking-wider">
            <MapPin size={14} className="animate-bounce" />
            {lang === 'fr' ? 'Position partagée' : 'Location Shared'}
          </div>
          <span className="text-[11px] font-bold">
            {lang === 'fr' ? 'Localisation de livraison GPS partagée.' : 'GPS delivery coordinates shared.'}
          </span>
          <a
            href={text}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 py-2 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-xl text-[10px] font-black text-center uppercase tracking-widest transition-all"
          >
            {lang === 'fr' ? 'Ouvrir sur Maps' : 'Open in Google Maps'}
          </a>
        </div>
      );
    }

    return (
      <div
        className={`rounded-[1.4rem] px-4.5 py-3 text-xs font-bold leading-relaxed shadow-sm ${
          msg.sender_role === 'admin'
            ? 'bg-[#F0F2F5] dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
            : 'bg-[#0084FF] text-white rounded-tr-none'
        }`}
      >
        {text}
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Render SIGN IN Gate if user is NOT logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans">
        {/* Header Bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest leading-none">
              SWEETO HUB Support
            </h1>
          </div>
        </div>

        {/* Lock Gate Board */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-[2.5rem] p-10 text-center shadow-xl space-y-6">
            <div className="w-16 h-16 rounded-[1.6rem] bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={28} />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-850 dark:text-white">
                {lang === 'fr' ? 'Se connecter pour continuer' : 'Login to Continue'}
              </h2>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-xs mx-auto">
                {lang === 'fr' 
                  ? 'Veuillez vous connecter à votre compte SWEETO HUB pour démarrer une discussion avec le support.' 
                  : 'Please sign in to your SWEETO HUB account to begin communicating with our support team.'}
              </p>
            </div>

            <button
              onClick={() => navigate('/auth')}
              className="w-full py-4 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <LogIn size={14} />
              <span>{lang === 'fr' ? 'Se Connecter / S\'inscrire' : 'Sign In / Register'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Full-Screen Chat View for Logged-In User
  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0 z-30 sticky top-0 animate-fadeIn">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-slate-100 dark:border-white/5 overflow-hidden shadow-inner select-none">
              <SweetoLogo size={36} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <h1 className="text-[13px] font-black uppercase text-slate-800 dark:text-white tracking-wide leading-none">
              SWEETO HUB Support
            </h1>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">
              {lang === 'fr' ? 'En ligne • Réponse instantanée' : 'Online • Instant Replies'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="tel:+2250500619923"
            className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-all flex items-center justify-center shadow-sm"
            title="Call Support"
          >
            <PhoneCall size={16} />
          </a>
        </div>
      </div>

      {/* Main Chat Feed Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white dark:bg-slate-900 shadow-sm border-x border-slate-200 dark:border-slate-800 relative overflow-hidden">
        
        {/* Profile Card Header Status */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
            <span className="truncate">
              {lang === 'fr' ? 'Discuter en tant que :' : 'Chatting as:'} <strong className="text-slate-700 dark:text-slate-200 font-black">{username}</strong> {phone && `(${phone})`}
            </span>
          </div>
        </div>

        {/* Message Logs Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/15 dark:bg-slate-950/10 scrollbar-thin flex flex-col">
          
          {/* Welcome Info Board with User Greeting */}
          <div className="text-center py-8 border-b border-slate-100 dark:border-white/5 mb-6">
            <div className="w-16 h-16 rounded-[1.6rem] bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10 select-none">
              <MessageSquare size={28} />
            </div>
            
            {/* dynamic greeting based on user name */}
            <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white leading-none">
              {lang === 'fr' ? `Bienvenue, ${username} !` : `Welcome back, ${username}!`}
            </h4>
            
            <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto px-4">
              {lang === 'fr' 
                ? 'Que pouvons-nous faire pour vous aujourd\'hui ? Vous pouvez nous poser des questions, partager des images de produits ou nous envoyer votre position GPS de livraison.' 
                : 'What can we do for you today? You can send us questions, share product images, or send your GPS delivery location.'}
            </p>
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
              <PhoneCall size={10} /> +225 050 061 9923
            </p>
          </div>

          <div className="flex-1 flex flex-col space-y-4">
            {messages.length === 0 ? (
              <div className="my-auto text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                {lang === 'fr' ? 'Dites bonjour ci-dessous ! 👋' : 'Say Hello below! 👋'}
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isAdminMsg = msg.sender_role === 'admin';
                const prevMsg = idx > 0 ? messages[idx - 1] : null;
                const isFirstInGroup = !prevMsg || prevMsg.sender_role !== msg.sender_role;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 items-end ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
                  >
                    {/* Admin Avatar */}
                    {isAdminMsg && (
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-150 dark:border-white/5 select-none overflow-hidden">
                        {isFirstInGroup ? (
                          <SweetoLogo size={24} />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'} max-w-[75%] sm:max-w-[70%]`}>
                      {isAdminMsg && isFirstInGroup && (
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                          SWEETO HUB
                        </span>
                      )}

                      {/* Dynamic Message Content */}
                      {renderMessageText(msg)}
                      
                      <span className="text-[8px] font-bold text-slate-400 mt-1 px-1.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Messenger Style Input Footer Bar */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3 shrink-0">
          
          {/* File Input hidden */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isUploading}
          />

          <form onSubmit={handleSendMessage} className="flex items-center gap-3 w-full">
            {/* Quick Attachment Buttons */}
            <div className="flex items-center gap-1.5 text-blue-500 shrink-0">
              {/* Send Image Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isLocating}
                className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-full transition-colors flex items-center justify-center text-[#0084FF] disabled:opacity-40 cursor-pointer"
                title="Send Image"
              >
                {isUploading ? (
                  <Loader2 size={18} className="animate-spin text-blue-500" />
                ) : (
                  <Image size={18} />
                )}
              </button>

              {/* Send Location Trigger */}
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={isUploading || isLocating}
                className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-full transition-colors flex items-center justify-center text-red-500 disabled:opacity-40 cursor-pointer"
                title="Share Delivery GPS Location"
              >
                {isLocating ? (
                  <Loader2 size={18} className="animate-spin text-red-500" />
                ) : (
                  <MapPin size={18} />
                )}
              </button>
            </div>

            {/* Chat Input Field */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={lang === 'fr' ? 'Aa' : 'Type a message...'}
                className="w-full pl-4 pr-10 py-3 bg-[#F0F2F5] dark:bg-slate-800 border-0 rounded-full text-xs font-bold focus:bg-[#E4E6EB] dark:focus:bg-slate-750 transition-all outline-none"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 transition-colors"
              >
                <Smile size={18} />
              </button>
            </div>

            {/* Send Text Button */}
            <button
              type="submit"
              disabled={!newMessageText.trim() || isSending || isUploading || isLocating}
              className="w-10 h-10 rounded-full bg-transparent text-[#0084FF] disabled:text-slate-355 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Send size={18} fill={newMessageText.trim() && !isSending ? 'currentColor' : 'none'} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
