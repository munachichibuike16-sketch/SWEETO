import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, User, Phone, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';

export default function CustomerChatWidget() {
  const { lang } = useLanguage();
  const { settings, products } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  // User Session details
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  
  // Chatting details
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const messagesEndRef = useRef(null);

  const [speakingMsgId, setSpeakingMsgId] = useState(null);

  const handleSpeech = (msgText, msgId) => {
    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(msgText);
    const isFrench = /[éàèùœç]|(\b(le|la|les|est|vous|pour|dans|une|sur|avec|dans|pour|que)\b)/i.test(msgText);
    utterance.lang = isFrench ? 'fr-FR' : 'en-US';
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);
    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

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

  // 1. Initialize session and load credentials
  useEffect(() => {
    let savedSessionId = localStorage.getItem('sweeto_chat_session_id');
    let savedName = localStorage.getItem('sweeto_chat_name');
    let savedPhone = localStorage.getItem('sweeto_chat_phone');

    // Inherit logged-in store user credentials if available
    try {
      const storeSession = JSON.parse(localStorage.getItem('sweetohub_session'));
      if (storeSession) {
        savedName = storeSession.name || storeSession.email || 'Client';
        savedPhone = storeSession.phone || '';
        savedSessionId = `user_${storeSession.id || storeSession.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      }
    } catch (e) {}

    if (!savedSessionId) {
      savedSessionId = `session_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
      localStorage.setItem('sweeto_chat_session_id', savedSessionId);
    }

    setSessionId(savedSessionId);

    if (savedName) {
      setUsername(savedName);
      setPhone(savedPhone || '');
      setIsRegistered(true);
    }
  }, []);

  // 2. Fetch past messages once registered & connected
  useEffect(() => {
    if (!sessionId || !isRegistered || !supabase) return;

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
        console.error('Error fetching chat messages:', err);
      }
    };

    fetchMessages();

    // 3. Realtime subscription to new messages
    const channel = supabase
      .channel(`chat_${sessionId}`)
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

          // Show notifications if widget is closed and message is from admin
          if (!isOpen && payload.new.sender_role === 'admin') {
            setHasNewMessage(true);
            try {
              // Play subtle notification sound if browser allows
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
  }, [sessionId, isRegistered, isOpen]);

  // 4. Scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // 5. Clear notification badge on open
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!username.trim()) return;

    localStorage.setItem('sweeto_chat_name', username.trim());
    localStorage.setItem('sweeto_chat_phone', phone.trim());
    setIsRegistered(true);
  };

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
      customer_name: username || 'Guest',
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
          customer_name: username || 'Guest',
          customer_phone: phone || null,
          sender_role: 'customer',
          message_text: messageText
        }
      ]);

      if (error) throw error;
      
      // Trigger AI assistant response
      triggerAiResponse(messageText);
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message if send failed
      setMessages((prev) => prev.filter(m => m.id !== tempMsgId));
      setNewMessageText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 font-sans">
      <AnimatePresence>
        {/* Chat Widget Panel */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="mb-4 w-[340px] sm:w-[380px] h-[500px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-100 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide uppercase leading-none">
                    {lang === 'fr' ? 'Support Sweeto' : 'Sweeto Support'}
                  </h3>
                  <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-1">
                    {lang === 'fr' ? 'En ligne • Réponse rapide' : 'Online • Replies quickly'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            {/* Content Area */}
            <>
              {/* Chat Message Logs */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/55 dark:bg-slate-950/20 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <MessageSquare size={24} className="text-slate-400" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {lang === 'fr' ? 'Aucun message' : 'No messages yet'}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      {lang === 'fr' 
                        ? 'Envoyez un message pour démarrer la conversation avec notre équipe.' 
                        : 'Send a message to start conversing with our store team.'}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender_role === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-[1.5rem] px-5 py-3 text-xs font-bold leading-relaxed shadow-sm ${
                            isAdmin
                              ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none'
                              : 'bg-blue-600 text-white rounded-tr-none'
                          }`}
                        >
                          <div className="flex flex-col gap-1.5">
                            <span className="text-left select-text">{msg.message_text}</span>
                            {isAdmin && (
                              <button
                                onClick={() => handleSpeech(msg.message_text, msg.id)}
                                className="self-end mt-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 p-0.5 rounded transition-all bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0"
                                title={lang === 'fr' ? 'Écouter' : 'Listen'}
                              >
                                {speakingMsgId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1.5">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
                {isAiTyping && (
                  <div className="flex flex-col items-start mt-2">
                    <div className="bg-white dark:bg-slate-800 text-slate-400 rounded-[1.5rem] rounded-tl-none px-5 py-3 text-xs font-bold leading-relaxed border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex gap-2">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={lang === 'fr' ? 'Écrivez votre message...' : 'Write your message...'}
                  className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Bubble Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 relative cursor-pointer"
      >
        {isOpen ? <X size={22} /> : <MessageSquare size={22} />}
        
        {/* Unread Message Notification Badge */}
        {hasNewMessage && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#ff3b30] border-2 border-white dark:border-slate-900 flex items-center justify-center text-[9px] font-black text-white animate-bounce">
            !
          </span>
        )}
      </motion.button>
    </div>
  );
}
