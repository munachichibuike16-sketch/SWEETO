import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, PhoneCall, Image, MapPin, Loader2, Smile, User, Edit2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { uploadToStorage } from '../utils/storageHelper';
import SweetoLogo from '../components/SweetoLogo';

export default function CustomerSupportPage() {
  const { lang } = useLanguage();
  const { showToast } = useStore();
  const navigate = useNavigate();

  // Customer session state
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  
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

  // 1. Initialize customer session on mount (Auto-Registration)
  useEffect(() => {
    let savedSessionId = localStorage.getItem('sweeto_chat_session_id');
    let savedName = localStorage.getItem('sweeto_chat_name');
    let savedPhone = localStorage.getItem('sweeto_chat_phone');

    if (!savedSessionId) {
      savedSessionId = `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem('sweeto_chat_session_id', savedSessionId);
    }
    setSessionId(savedSessionId);

    // Auto-generate name if not set to prevent blocking forms
    if (!savedName) {
      savedName = `Client #${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('sweeto_chat_name', savedName);
    }
    
    setUsername(savedName);
    setPhone(savedPhone || '');
    setTempName(savedName);
    setTempPhone(savedPhone || '');
  }, []);

  // 2. Fetch past messages and subscribe to real-time additions
  useEffect(() => {
    if (!sessionId || !supabase) return;

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

    // Subscribe to new messages
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
  }, [sessionId]);

  // 3. Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle Edit profile details
  const handleSaveProfile = () => {
    if (!tempName.trim()) return;
    localStorage.setItem('sweeto_chat_name', tempName.trim());
    localStorage.setItem('sweeto_chat_phone', tempPhone.trim());
    setUsername(tempName.trim());
    setPhone(tempPhone.trim());
    setIsEditingName(false);
    showToast("Profile details updated! 👤", "success");
  };

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
      
      // Insert image URL as message
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

  // Custom message renderer to show beautiful cards
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

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-slate-100 dark:border-white/5 select-none overflow-hidden shadow-inner">
              <SweetoLogo size={36} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <h1 className="text-[13px] font-black uppercase text-slate-800 dark:text-white tracking-wide leading-none flex items-center gap-2">
              SWEETO HUB Support
            </h1>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">
              {lang === 'fr' ? 'En ligne • Réponse instantanée' : 'Online • Instant Replies'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick Call Action */}
          <a
            href="tel:+2250500619923"
            className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-all flex items-center justify-center shadow-sm"
            title="Call Support"
          >
            <PhoneCall size={16} />
          </a>
        </div>
      </div>

      {/* Main Messenger Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white dark:bg-slate-900 shadow-sm border-x border-slate-200 dark:border-slate-800 relative overflow-hidden">
        
        {/* Profile Card / Quick Name Edit Row */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 truncate">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  placeholder="Your name"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  placeholder="Phone number"
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500 w-32"
                />
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <span className="truncate">
                {lang === 'fr' ? 'Discuter en tant que :' : 'Chatting as:'} <strong className="text-slate-700 dark:text-slate-200 font-black">{username}</strong> {phone && `(${phone})`}
              </span>
            )}
          </div>
          {!isEditingName && (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Edit2 size={11} /> {lang === 'fr' ? 'Modifier' : 'Edit'}
            </button>
          )}
        </div>

        {/* Message Logs Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/15 dark:bg-slate-950/10 scrollbar-thin flex flex-col">
          
          {/* Welcome Info Board */}
          <div className="text-center py-8 border-b border-slate-100 dark:border-white/5 mb-6">
            <div className="w-16 h-16 rounded-[1.6rem] bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/10 select-none">
              <MessageSquare size={28} />
            </div>
            <h4 className="text-sm font-black uppercase text-slate-800 dark:text-white leading-none">
              SWEETO HUB Support
            </h4>
            <p className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto px-4">
              {lang === 'fr' 
                ? 'Bienvenue ! Vous pouvez nous envoyer des questions, partager des images de produits ou nous envoyer votre position GPS de livraison.' 
                : 'Welcome! You can send us questions, share product images, or send your GPS delivery location.'}
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
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors"
              >
                <Smile size={18} />
              </button>
            </div>

            {/* Send Text Button */}
            <button
              type="submit"
              disabled={!newMessageText.trim() || isSending || isUploading || isLocating}
              className="w-10 h-10 rounded-full bg-transparent text-[#0084FF] disabled:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center transition-all cursor-pointer shrink-0"
            >
              <Send size={18} fill={newMessageText.trim() && !isSending ? 'currentColor' : 'none'} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
