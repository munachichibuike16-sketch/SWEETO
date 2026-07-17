import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, PhoneCall, Image, MapPin, Loader2, Smile, Lock, LogIn, Download, MessageSquare, CheckCheck, Upload, ShoppingBag, Search, X, HelpCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { uploadToStorage } from '../utils/storageHelper';
import SweetoLogo from '../components/SweetoLogo';
import FAQPanel from '../components/FAQPanel';
import { apiFetch } from '../utils/api';

export default function CustomerSupportPage() {
  const { lang } = useLanguage();
  const { showToast, products, settings } = useStore();
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
  const [isAiTyping, setIsAiTyping] = useState(false);

  const triggerAiResponse = async (userMsgText) => {
    const apiKey = settings?.gemini_api_key;
    if (!apiKey) return;

    setIsAiTyping(true);

    try {
      const currency = settings?.currency || 'FCFA';
      const productsContext = products && products.length > 0
        ? products.slice(0, 25).map(p => `- ${p.name} (Catégorie: ${p.category || 'Général'}, Prix: ${p.price} ${currency}, Description: ${p.description || ''}, Stock: ${p.stock_count || 'Disponible'})`).join('\n')
        : 'Aucun produit disponible pour le moment.';

      const systemInstruction = `Tu es l'Assistant IA Shopping de SWEETO HUB, un magasin d'électronique et de luxe à Abidjan.
Ton rôle est d'aider les clients à trouver des produits, répondre à leurs questions (FAQ, livraison, retour) et les guider dans leur achat.
Sois extrêmement chaleureux, amical, concis (maximum 2-3 phrases) et réponds toujours dans la langue de l'utilisateur (français par défaut).
Voici la liste des produits disponibles en stock :
${productsContext}

Informations de livraison et paiement :
- Livraison : À Abidjan (Cocody, Marcory, Yopougon, Riviera, etc.) et à l'intérieur du pays.
- Paiement : Cash à la livraison, Wave (Automatique et Manuel), Orange Money, MTN Mobile Money.
- Les prix sont en ${currency}.`;

      const historyContext = messages.slice(-6).map(m => {
        return `${m.sender_role === 'customer' ? 'Utilisateur' : 'Assistant'}: ${m.message_text}`;
      }).join('\n');

      const prompt = `${systemInstruction}\n\nHistorique de la conversation :\n${historyContext}\n\nUtilisateur : ${userMsgText}\nAssistant (sois court, direct et en français) :`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        }
      );

      if (!res.ok) throw new Error('Gemini API call failed');
      const resData = await res.json();
      const aiReplyText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (aiReplyText) {
        setTimeout(async () => {
          const aiReplyClean = aiReplyText.trim();
          
          // Append AI response optimistically to local messages state
          const optimisticAiMsg = {
            id: 'temp_ai_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
            session_id: sessionId,
            customer_name: username || 'Guest',
            customer_phone: phone || null,
            sender_role: 'admin',
            message_text: aiReplyClean,
            created_at: new Date().toISOString()
          };
          setMessages((prev) => [...prev, optimisticAiMsg]);

          try {
            await supabase.from('chat_messages').insert([
              {
                session_id: sessionId,
                customer_name: username || 'Guest',
                customer_phone: phone || null,
                sender_role: 'admin',
                message_text: aiReplyClean
              }
            ]);
          } catch (e) {
            console.error('Failed to save AI message:', e);
          } finally {
            setIsAiTyping(false);
          }
        }, 1500);
      } else {
        setIsAiTyping(false);
      }
    } catch (err) {
      console.error('AI assistant error:', err);
      setIsAiTyping(false);
    }
  };

  // Custom dialogs & modals
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isFaqOpen, setIsFaqOpen] = useState(false);

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
        
        if (data) {
          setMessages(data);
          
          // Mark all admin messages as read in database
          const unreadAdminMsgIds = data
            .filter(m => m.sender_role === 'admin' && !m.is_read)
            .map(m => m.id);

          if (unreadAdminMsgIds.length > 0) {
            (async () => {
              try {
                await supabase
                  .from('chat_messages')
                  .update({ is_read: true })
                  .in('id', unreadAdminMsgIds);
              } catch (e) {
                console.warn('Failed to update message status:', e);
              }
            })();
          }
        }
      } catch (err) {
        console.error('Error fetching support messages:', err);
      }
    };

    fetchMessages();

    // Subscribe to new and updated messages for this account
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
            const filtered = prev.filter(m => 
              !(m.id.startsWith('temp_') && m.message_text === payload.new.message_text && m.sender_role === payload.new.sender_role)
            );
            if (filtered.some((m) => m.id === payload.new.id)) return filtered;
            return [...filtered, payload.new];
          });

          // Play message sound if it is from admin
          if (payload.new.sender_role === 'admin') {
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
              audio.volume = 0.4;
              audio.play().catch(() => {});
            } catch (e) {}

            // Automatically mark this incoming admin message as read
            (async () => {
              try {
                await supabase
                  .from('chat_messages')
                  .update({ is_read: true })
                  .eq('id', payload.new.id);
              } catch (e) {}
            })();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages((prev) => 
            prev.map(m => m.id === payload.new.id ? { ...m, is_read: payload.new.is_read } : m)
          );
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

    const tempMsgId = 'temp_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const optimisticMsg = {
      id: tempMsgId,
      session_id: sessionId,
      customer_name: username,
      customer_phone: phone || null,
      sender_role: 'customer',
      message_text: messageText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);

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
      
      // Trigger AI assistant response
      triggerAiResponse(messageText);

      // Trigger background push notification for admins
      apiFetch('/push/notify-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: username,
          messageText: messageText,
          sessionId: sessionId,
          targetRole: 'admin'
        })
      }).catch(err => console.warn('Could not trigger admin push notification:', err));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message if send failed
      setMessages((prev) => prev.filter(m => m.id !== tempMsgId));
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

      // Trigger background push notification for admins
      apiFetch('/push/notify-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: username,
          messageText: publicUrl,
          sessionId: sessionId,
          targetRole: 'admin'
        })
      }).catch(err => console.warn('Could not trigger admin push notification:', err));
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

          // Trigger background push notification for admins
          apiFetch('/push/notify-chat-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              senderName: username,
              messageText: mapsUrl,
              sessionId: sessionId,
              targetRole: 'admin'
            })
          }).catch(err => console.warn('Could not trigger admin push notification:', err));
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

  // Tag support for selected product
  const handleTagProduct = async (product) => {
    if (!product || !supabase || !sessionId) return;

    const productTagText = `[PRODUCT_TAG]:${JSON.stringify({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || product.image || '/hero-banner.png'
    })}`;

    setIsSending(true);
    try {
      const { error } = await supabase.from('chat_messages').insert([
        {
          session_id: sessionId,
          customer_name: username,
          customer_phone: phone || null,
          sender_role: 'customer',
          message_text: productTagText
        }
      ]);

      if (error) throw error;

      // Trigger background push notification for admins
      apiFetch('/push/notify-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: username,
          messageText: `Tagged Product: ${product.name}`,
          sessionId: sessionId,
          targetRole: 'admin'
        })
      }).catch(err => console.warn('Could not trigger admin push notification:', err));

      showToast(lang === 'fr' ? 'Produit lié ! 🏷' : 'Product tagged! 🏷', 'success');
      setIsProductSelectorOpen(false);
    } catch (err) {
      console.error('Failed to send tagged product:', err);
      showToast('Failed to tag product.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleAskFaqQuestion = (questionText) => {
    setNewMessageText(questionText);
    setIsFaqOpen(false);
    showToast(lang === 'fr' ? 'Question copiée dans le chat ! ✏️' : 'Question copied to chat input! ✏️', 'info');
  };

  // Custom message content formatting (Image, GPS Map, Text)
  const renderMessageText = (msg) => {
    const text = msg.message_text;

    if (text && text.startsWith('[PRODUCT_TAG]:')) {
      try {
        const productData = JSON.parse(text.replace('[PRODUCT_TAG]:', ''));
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl p-3 shadow-md flex flex-col gap-2.5 max-w-[260px] sm:max-w-xs leading-relaxed">
            <div className="flex items-center gap-1.5 text-[#0084FF] font-black text-[10px] uppercase tracking-wider select-none">
              <span className="text-base">🏷️</span>
              <span>{lang === 'fr' ? 'Produit marqué' : 'Tagged Product'}</span>
            </div>
            <div className="flex gap-2.5 items-center bg-slate-50 dark:bg-slate-850 p-2 rounded-xl border border-slate-100 dark:border-white/5">
              <img
                src={productData.image || '/hero-banner.png'}
                alt={productData.name}
                className="w-12 h-12 object-cover rounded-lg border border-slate-150 dark:border-slate-800 shrink-0 bg-white"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black truncate text-slate-900 dark:text-white leading-tight">{productData.name}</span>
                <span className="text-[11px] font-black text-rose-500 font-mono mt-1">
                  {productData.price ? `${productData.price.toLocaleString()} FCFA` : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                window.location.hash = `#/product/${productData.id}`;
              }}
              className="py-1.5 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-xl text-[10px] font-black text-center uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-98"
            >
              {lang === 'fr' ? 'Voir le produit' : 'View Product'}
            </button>
          </div>
        );
      } catch (err) {
        console.warn('Could not parse product tag:', err);
      }
    }

    if (isImageUrl(text)) {
      return (
        <div className="relative group overflow-hidden rounded-2xl max-w-[260px] sm:max-w-xs shadow-sm bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-white/5">
          <img
            src={text}
            alt="Shared asset"
            className="w-full h-auto object-cover max-h-60 cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
            onClick={() => window.open(text, '_blank')}
          />
          {/* Download save button overlay */}
          <a
            href={text}
            download={`sweeto_chat_${Date.now()}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2.5 right-2.5 p-2 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer shadow-md"
            title={lang === 'fr' ? 'Enregistrer l\'image' : 'Save Image'}
          >
            <Download size={14} />
          </a>
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
      <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans relative overflow-hidden">
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
          <button
            onClick={() => setIsFaqOpen(!isFaqOpen)}
            className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-full transition-all flex items-center justify-center shadow-sm cursor-pointer"
            title="Help / FAQ"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {/* Lock Gate Board */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
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

          {/* FAQ panel inside Sign-In lock screen */}
          {isFaqOpen && (
            <FAQPanel 
              lang={lang} 
              onClose={() => setIsFaqOpen(false)} 
              onAskQuestion={null}
            />
          )}
        </div>
      </div>
    );
  }

  // 2. Render Full-Screen Chat View for Logged-In User
  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans">
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
          <button
            onClick={() => setIsFaqOpen(!isFaqOpen)}
            className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-full transition-all flex items-center justify-center shadow-sm cursor-pointer animate-pulse"
            title="Help / FAQ"
          >
            <HelpCircle size={16} />
          </button>
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
        
        {/* FAQ panel inside active chat screen */}
        {isFaqOpen && (
          <FAQPanel 
            lang={lang} 
            onClose={() => setIsFaqOpen(false)} 
            onAskQuestion={handleAskFaqQuestion}
          />
        )}

        {/* Profile Card Header Status */}
        <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-955/20 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
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
                      
                      <span className="text-[8px] font-bold text-slate-400 mt-1 px-1.5 flex items-center gap-1.5">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {!isAdminMsg && (
                          msg.is_read ? (
                            <CheckCheck size={11} className="text-[#0084FF] font-black" title="Seen" />
                          ) : (
                            <CheckCheck size={11} className="text-slate-350 dark:text-slate-600" title="Sent & Received" />
                          )
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            {isAiTyping && (
              <div className="flex items-start gap-3 mt-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md font-black text-[10px]">AI</div>
                <div className="flex flex-col">
                  <div className="bg-white dark:bg-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-5 py-3 text-xs font-bold leading-relaxed border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
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
                onClick={() => setIsAttachmentMenuOpen(true)}
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

      {/* 1. ATTACHMENT MENU OPTIONS DIALOG */}
      {isAttachmentMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAttachmentMenuOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X size={18} />
            </button>

            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-5 mt-1 text-center">
              {lang === 'fr' ? 'Partager un média' : 'Share Media / Product'}
            </h3>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50 dark:bg-slate-850 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-[#0084FF] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {lang === 'fr' ? "Télécharger depuis l'appareil" : 'Upload from Device'}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Sélectionner une photo dans votre stockage.' : 'Choose an image from your device.'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsAttachmentMenuOpen(false);
                  setIsProductSelectorOpen(true);
                }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 bg-slate-50 dark:bg-slate-850 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 text-left transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShoppingBag size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {lang === 'fr' ? 'Associer un produit' : 'Tag a Product'}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-400 mt-0.5">
                    {lang === 'fr' ? 'Partager la fiche de lunette / montre.' : 'Link a product directly from our online shop.'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCT SELECTOR DIALOG */}
      {isProductSelectorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-150 dark:border-slate-850 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {lang === 'fr' ? 'Associer un produit' : 'Select Product to Tag'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {lang === 'fr' ? 'Cliquez sur un produit pour l\'envoyer' : 'Tap on a product to attach it in chat'}
                </p>
              </div>
              <button
                onClick={() => setIsProductSelectorOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-855 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder={lang === 'fr' ? 'Rechercher des produits...' : 'Search products by name...'}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {(() => {
                const filtered = (products || []).filter(p =>
                  p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                  (p.category && p.category.toLowerCase().includes(productSearchQuery.toLowerCase()))
                );

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                      {lang === 'fr' ? 'Aucun produit trouvé' : 'No products found'}
                    </div>
                  );
                }

                return filtered.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleTagProduct(prod)}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-855 transition-all text-left group"
                  >
                    <img
                      src={prod.image_url || prod.image || '/hero-banner.png'}
                      alt={prod.name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50 group-hover:scale-[1.02] transition-transform"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="block text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-[#0084FF] transition-colors leading-tight">
                        {prod.name}
                      </span>
                      <span className="block text-[10px] font-black text-rose-500 font-mono mt-1">
                        {prod.price?.toLocaleString()} FCFA
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest shrink-0 border border-dashed border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg group-hover:text-[#0084FF] group-hover:border-[#0084FF]/30 transition-all">
                      {lang === 'fr' ? 'Taguer' : 'Tag'}
                    </span>
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
