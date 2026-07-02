import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import LiveChatManagement from '../components/LiveChatManagement';
import { MessageSquare, ArrowLeft, Send, User, Phone, Shield } from 'lucide-react';
import AdminLogin from './AdminLogin';

export default function ChatPage() {
  const { lang, t } = useLanguage();
  const { showToast } = useStore();
  const navigate = useNavigate();

  // Admin authentication state
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  // Customer chat state
  const [sessionId, setSessionId] = useState(null);
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = React.useRef(null);

  // 1. Check if the user is authenticated as admin
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

  // 2. Initialize customer session
  useEffect(() => {
    if (isAdmin) return;

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
  }, [isAdmin]);

  // 3. Load customer messages and subscribe to updates
  useEffect(() => {
    if (isAdmin || !sessionId || !isRegistered || !supabase) return;

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

    const channel = supabase
      .channel(`chat_page_${sessionId}`)
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isRegistered, isAdmin]);

  // 4. Scroll to bottom of chat
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Admin login overlay
  if (showAdminLogin && !isAdmin) {
    return (
      <AdminLogin 
        onLoginSuccess={() => {
          setIsAdmin(true);
          setShowAdminLogin(false);
        }} 
      />
    );
  }

  // Render Admin Chat Dashboard View
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-4 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-600 dark:text-slate-300"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase text-slate-800 dark:text-white tracking-widest leading-none">
                Admin Chat Portal
              </h1>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mt-1">
                Real-time active connection
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                await supabase.auth.signOut();
                sessionStorage.removeItem('sweetohub_admin_authenticated');
                sessionStorage.removeItem('sweetohub_admin_token');
                setIsAdmin(false);
                showToast("Logged out of Admin Portal", "info");
              } catch (e) {}
            }}
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

  // Render Customer Full-Screen Chat View
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:max-w-2xl h-screen sm:h-[680px] bg-white dark:bg-slate-900 border-0 sm:border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-5 px-6 sm:px-8 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all cursor-pointer text-white flex items-center justify-center"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h3 className="font-black text-sm tracking-wide uppercase leading-none">
                {lang === 'fr' ? 'Support Client' : 'Customer Support'}
              </h3>
              <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-1">
                {lang === 'fr' ? 'Dites-nous comment nous pouvons vous aider' : 'Tell us how we can help you'}
              </span>
            </div>
          </div>
          
          {/* Hidden Admin Login Access Button */}
          <button
            onClick={() => setShowAdminLogin(true)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white flex items-center justify-center"
            title="Admin Login"
          >
            <Shield size={16} />
          </button>
        </div>

        {/* Chat Body */}
        {!isRegistered ? (
          /* Form registration */
          <form onSubmit={handleRegister} className="flex-1 p-8 sm:p-12 flex flex-col justify-center space-y-6 max-w-md mx-auto w-full">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={28} />
              </div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                {lang === 'fr' ? 'Bienvenue au chat de Sweeto' : 'Welcome to Sweeto Chat'}
              </p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-1">
                {lang === 'fr' ? 'Veuillez saisir vos coordonnées pour démarrer :' : 'Please enter your details to begin:'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {lang === 'fr' ? 'Nom complet' : 'Full Name'} *
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

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                {lang === 'fr' ? 'Téléphone (Optionnel)' : 'Phone (Optional)'}
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
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
            >
              {lang === 'fr' ? 'Démarrer le Chat' : 'Start Chatting'}
            </button>
          </form>
        ) : (
          /* Chat logs & messaging */
          <>
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/20 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <MessageSquare size={26} className="text-slate-400" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {lang === 'fr' ? 'Prêt à vous aider' : 'Ready to help'}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[320px]">
                    {lang === 'fr' 
                      ? 'Dites-nous ce que vous cherchez, nous vous répondrons en temps réel.' 
                      : 'Ask us anything, we will get back to you in real-time.'}
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isAdminMsg = msg.sender_role === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdminMsg ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-[1.6rem] px-5 py-3.5 text-xs font-bold leading-relaxed shadow-sm ${
                          isAdminMsg
                            ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none'
                            : 'bg-blue-600 text-white rounded-tr-none'
                        }`}
                      >
                        {msg.message_text}
                      </div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1.5 px-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2.5 shrink-0">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={lang === 'fr' ? 'Posez votre question...' : 'Ask your question...'}
                className="flex-1 px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim() || isSending}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
