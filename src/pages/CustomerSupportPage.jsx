import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowLeft, Send, User, Phone, PhoneCall, Info, Smile, Plus, Image, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import SweetoLogo from '../components/SweetoLogo';

export default function CustomerSupportPage() {
  const { lang } = useLanguage();
  const { showToast } = useStore();
  const navigate = useNavigate();

  // Customer session state
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);

  // 1. Initialize customer session
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

  // 2. Fetch past messages and subscribe to real-time additions
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
  }, [sessionId, isRegistered]);

  // 3. Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRegistered]);

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
      setNewMessageText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Messenger Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-6 flex items-center justify-between shadow-sm shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center border border-slate-100 dark:border-white/5 select-none">
              <SweetoLogo size={36} />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
          </div>

          <div>
            <h1 className="text-[13px] font-black uppercase text-slate-800 dark:text-white tracking-wide leading-none">
              SWEETO HUB Support
            </h1>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mt-1">
              {lang === 'fr' ? 'En ligne • Répond rapidement' : 'Online • Replies quickly'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Call Action Button */}
          <a
            href="tel:+2250500619923"
            className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-full transition-all flex items-center justify-center"
            title="Call Support"
          >
            <PhoneCall size={18} />
          </a>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto bg-white dark:bg-slate-900 shadow-sm border-x border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {!isRegistered ? (
          /* Welcome/Registration Layout */
          <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 max-w-md mx-auto w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
                <MessageSquare size={36} />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase">
                  {lang === 'fr' ? 'Démarrer une discussion' : 'Start a Conversation'}
                </h2>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {lang === 'fr' 
                    ? 'Connectez-vous instantanément avec SWEETO HUB pour obtenir de l\'aide en temps réel.' 
                    : 'Connect instantly with SWEETO HUB support for real-time help.'}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4 text-left pt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {lang === 'fr' ? 'Votre nom complet' : 'Your Full Name'} *
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={lang === 'fr' ? 'ex. Yao Kouassi' : 'e.g. Yao Kouassi'}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    {lang === 'fr' ? 'Numéro de téléphone' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={lang === 'fr' ? 'ex. 07070707' : 'e.g. 07070707'}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  {lang === 'fr' ? 'Démarrer la Discussion' : 'Start Chatting'}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* Messenger-style Live Chat Feed */
          <>
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/25 scrollbar-thin">
              
              {/* Top Welcome Disclaimer inside history */}
              <div className="text-center py-6 border-b border-slate-100 dark:border-white/5 mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center mx-auto mb-2 select-none">
                  <SweetoLogo size={46} />
                </div>
                <h4 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-none">
                  SWEETO HUB Support
                </h4>
                <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  {lang === 'fr' 
                    ? 'Discutez directement avec notre équipe. Contactez-nous à tout moment pour des questions ou des commandes.' 
                    : 'Chat directly with our store team. Contact us anytime for questions or orders.'}
                </p>
                {/* Admin general details display */}
                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-2 flex items-center justify-center gap-1.5">
                  <Phone size={10} /> +225 050 061 9923
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="h-[200px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {lang === 'fr' ? 'Aucun message pour l\'instant' : 'No messages yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {lang === 'fr' ? 'Écrivez votre premier message ci-dessous.' : 'Type your first message below.'}
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdminMsg = msg.sender_role === 'admin';
                  
                  // Clean grouping visualization
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const isFirstInGroup = !prevMsg || prevMsg.sender_role !== msg.sender_role;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 items-end ${isAdminMsg ? 'justify-start' : 'justify-end'}`}
                    >
                      {/* Admin avatar displayed on admin message */}
                      {isAdminMsg && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm border border-slate-100 dark:border-white/5 select-none overflow-hidden">
                          {isFirstInGroup ? (
                            <SweetoLogo size={22} />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'} max-w-[70%]`}>
                        {/* Sender Display Name */}
                        {isAdminMsg && isFirstInGroup && (
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                            SWEETO HUB
                          </span>
                        )}

                        <div
                          className={`rounded-[1.4rem] px-4.5 py-3 text-xs font-bold leading-relaxed shadow-sm ${
                            isAdminMsg
                              ? 'bg-[#F0F2F5] dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                              : 'bg-[#0084FF] text-white rounded-tr-none'
                          }`}
                        >
                          {msg.message_text}
                        </div>
                        
                        <span className="text-[8px] font-bold text-slate-400 mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Messenger Style Input Footer Bar */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shrink-0">
              {/* Media Icons */}
              <div className="flex items-center gap-1.5 text-blue-500 shrink-0">
                <button type="button" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-all">
                  <Plus size={18} />
                </button>
                <button type="button" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-all">
                  <Image size={18} />
                </button>
                <button type="button" className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full cursor-pointer transition-all">
                  <Mic size={18} />
                </button>
              </div>

              {/* Chat Input */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder={lang === 'fr' ? 'Écrivez un message...' : 'Aa'}
                  className="w-full pl-4 pr-10 py-3 bg-[#F0F2F5] dark:bg-slate-800 border-0 rounded-full text-xs font-bold focus:bg-[#E4E6EB] dark:focus:bg-slate-750 transition-all outline-none"
                />
                <button
                  type="button"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <Smile size={18} />
                </button>
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!newMessageText.trim() || isSending}
                className="w-10 h-10 rounded-full bg-transparent hover:bg-slate-55/10 text-[#0084FF] disabled:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <Send size={18} fill={newMessageText.trim() && !isSending ? 'currentColor' : 'none'} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
