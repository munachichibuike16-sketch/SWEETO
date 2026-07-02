import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, Phone, MessageSquare, Search, Trash2, MapPin } from 'lucide-react';

const isImageUrl = (url) => {
  if (typeof url !== 'string') return false;
  return url.startsWith('http') && (
    url.match(/\.(jpeg|jpg|gif|png|webp|svg)/i) || 
    url.includes('/uploads/upload_')
  );
};

const isMapUrl = (url) => {
  if (typeof url !== 'string') return false;
  return url.startsWith('http') && url.includes('google.com/maps');
};

export default function LiveChatManagement() {
  const [messages, setMessages] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef(null);

  // 1. Fetch all messages on mount
  useEffect(() => {
    if (!supabase) return;

    const fetchAllMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching admin chat logs:', err);
      }
    };

    fetchAllMessages();

    // 2. Realtime subscription to ALL incoming messages
    const channel = supabase
      .channel('admin_global_chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });

          // Play message sound if it is from customer
          if (payload.new.sender_role === 'customer') {
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav');
              audio.volume = 0.5;
              audio.play().catch(() => {});
            } catch (e) {}
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Auto scroll selected chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedSessionId]);

  // 4. Group messages into rooms (sessions)
  const roomsMap = {};
  messages.forEach((msg) => {
    if (!roomsMap[msg.session_id]) {
      roomsMap[msg.session_id] = {
        session_id: msg.session_id,
        customer_name: msg.customer_name || 'Guest',
        customer_phone: msg.customer_phone || '',
        last_message: msg.message_text,
        last_message_time: msg.created_at,
        messagesList: []
      };
    }
    roomsMap[msg.session_id].last_message = msg.message_text;
    roomsMap[msg.session_id].last_message_time = msg.created_at;
    roomsMap[msg.session_id].messagesList.push(msg);
  });

  const roomsList = Object.values(roomsMap)
    .sort((a, b) => new Date(b.last_message_time) - new Date(a.last_message_time))
    .filter((room) => 
      room.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.last_message.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const selectedRoom = selectedSessionId ? roomsMap[selectedSessionId] : null;

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSending || !selectedSessionId || !supabase) return;

    const messageText = replyText.trim();
    setReplyText('');
    setIsSending(true);

    try {
      // Pick customer details from the current room to maintain consistency
      const customerName = selectedRoom?.customer_name || 'Guest';
      const customerPhone = selectedRoom?.customer_phone || null;

      const { error } = await supabase.from('chat_messages').insert([
        {
          session_id: selectedSessionId,
          customer_name: customerName,
          customer_phone: customerPhone,
          sender_role: 'admin',
          message_text: messageText
        }
      ]);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to send admin reply:', err);
      setReplyText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteRoom = async (sessionIdToDelete, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat room history?')) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('session_id', sessionIdToDelete);

      if (error) throw error;

      setMessages((prev) => prev.filter((m) => m.session_id !== sessionIdToDelete));
      if (selectedSessionId === sessionIdToDelete) {
        setSelectedSessionId(null);
      }
    } catch (err) {
      console.error('Error deleting chat room:', err);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex overflow-hidden shadow-sm">
      {/* Sidebar: Rooms List */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:border-blue-500 transition-colors outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {roomsList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs font-bold uppercase tracking-wider mt-10">
              No chats active
            </div>
          ) : (
            roomsList.map((room) => {
              const isActive = room.session_id === selectedSessionId;
              const hasUnread = room.messagesList[room.messagesList.length - 1].sender_role === 'customer';
              
              return (
                <div
                  key={room.session_id}
                  onClick={() => setSelectedSessionId(room.session_id)}
                  className={`p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors group relative ${
                    isActive ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className={`text-xs font-black truncate ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {room.customer_name}
                      </h4>
                      {hasUnread && !isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    
                    {room.customer_phone && (
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {room.customer_phone}
                      </p>
                    )}
                    
                    <p className={`text-[11px] truncate mt-2 ${hasUnread && !isActive ? 'font-black text-slate-900 dark:text-white' : 'font-medium text-slate-400'}`}>
                      {room.last_message}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                      {new Date(room.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    <button
                      onClick={(e) => handleDeleteRoom(room.session_id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                      title="Delete chat history"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Board: Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/5">
        {selectedRoom ? (
          <>
            {/* Active Room Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white leading-none">
                    {selectedRoom.customer_name}
                  </h3>
                  {selectedRoom.customer_phone && (
                    <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                      <Phone size={10} /> {selectedRoom.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Message logs */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin">
              {selectedRoom.messagesList.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-[1.5rem] px-5 py-3 text-xs font-bold leading-relaxed shadow-sm ${
                        isAdmin
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none'
                      }`}
                    >
                      {isImageUrl(msg.message_text) ? (
                        <img 
                          src={msg.message_text} 
                          alt="Asset shared" 
                          className="max-w-[240px] rounded-xl cursor-zoom-in hover:opacity-95"
                          onClick={() => window.open(msg.message_text, '_blank')}
                        />
                      ) : isMapUrl(msg.message_text) ? (
                        <div className="flex flex-col gap-1.5 leading-normal min-w-[200px]">
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-wide flex items-center gap-1">
                            <MapPin size={12} className="animate-bounce" /> Location Shared
                          </span>
                          <span className="text-[11px] font-bold">Delivery address pinned by client.</span>
                          <a 
                            href={msg.message_text} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-1 py-1.5 bg-blue-600 hover:bg-blue-750 text-white rounded-lg text-[10px] font-black text-center uppercase tracking-widest transition-all"
                          >
                            Open Map
                          </a>
                        </div>
                      ) : (
                        msg.message_text
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1.5">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center mb-4">
              <MessageSquare size={24} className="text-slate-400" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-widest">Select a Conversation</h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[280px] text-center">
              Choose a customer chat from the list on the left to start communicating in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
