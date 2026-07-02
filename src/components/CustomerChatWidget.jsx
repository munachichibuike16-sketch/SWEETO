import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, X, User, Phone, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function CustomerChatWidget() {
  const { lang } = useLanguage();
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

  const messagesEndRef = useRef(null);

  // 1. Initialize session and load credentials
  useEffect(() => {
    let savedSessionId = localStorage.getItem('sweeto_chat_session_id');
    const savedName = localStorage.getItem('sweeto_chat_name');
    const savedPhone = localStorage.getItem('sweeto_chat_phone');

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
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
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
    } catch (err) {
      console.error('Failed to send message:', err);
      // Restore input text if send failed
      setNewMessageText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
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
            {!isRegistered ? (
              /* Registration Form */
              <form onSubmit={handleRegister} className="flex-1 p-8 flex flex-col justify-center space-y-5">
                <div className="text-center mb-4">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    {lang === 'fr' ? 'Bienvenue au support' : 'Welcome to Support'}
                  </p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">
                    {lang === 'fr' ? 'Dites-nous qui vous êtes pour démarrer :' : 'Tell us who you are to start chatting:'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === 'fr' ? 'Nom complet' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={lang === 'fr' ? 'ex. Yao Kouassi' : 'e.g. Yao Kouassi'}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {lang === 'fr' ? 'Téléphone (Optionnel)' : 'Phone (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={lang === 'fr' ? 'ex. 07070707' : 'e.g. 07070707'}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  {lang === 'fr' ? 'Démarrer le Chat' : 'Start Chatting'}
                </button>
              </form>
            ) : (
              /* Chat Message Logs */
              <>
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
                            {msg.message_text}
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1.5">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })
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
            )}
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
