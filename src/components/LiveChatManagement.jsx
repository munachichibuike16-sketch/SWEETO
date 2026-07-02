import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, Phone, MessageSquare, Search, Trash2, MapPin, Plus, Image, Loader2, Download, CheckCheck } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { uploadToStorage } from '../utils/storageHelper';
import { apiFetch } from '../utils/api';

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

const getAvatarColor = (name) => {
  const colors = [
    'from-blue-500 to-cyan-500 shadow-blue-500/10',
    'from-purple-500 to-indigo-500 shadow-purple-500/10',
    'from-emerald-500 to-teal-500 shadow-emerald-500/10',
    'from-amber-500 to-orange-500 shadow-amber-500/10',
    'from-rose-500 to-pink-500 shadow-rose-500/10'
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

const formatMessageTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const getUnreadCount = (messagesList) => {
  let count = 0;
  for (let i = messagesList.length - 1; i >= 0; i--) {
    if (messagesList[i].sender_role === 'customer') {
      count++;
    } else {
      break;
    }
  }
  return count;
};

export default function LiveChatManagement() {
  const { showToast } = useStore();
  const [messages, setMessages] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedSessionIdRef = useRef(selectedSessionId);
  useEffect(() => {
    selectedSessionIdRef.current = selectedSessionId;
  }, [selectedSessionId]);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !supabase || !selectedSessionId) return;

    setIsUploading(true);
    showToast('Uploading image...', 'info');

    try {
      const publicUrl = await uploadToStorage(file, 'chat_images');
      
      const customerName = selectedRoom?.customer_name || 'Guest';
      const customerPhone = selectedRoom?.customer_phone || null;

      const { error } = await supabase.from('chat_messages').insert([
        {
          session_id: selectedSessionId,
          customer_name: customerName,
          customer_phone: customerPhone,
          sender_role: 'admin',
          message_text: publicUrl
        }
      ]);

      if (error) throw error;
      showToast('Image sent successfully! 📸', 'success');

      // Trigger background push notification for customer
      apiFetch('/push/notify-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'SWEETO HUB',
          messageText: publicUrl,
          sessionId: selectedSessionId,
          targetRole: 'customer'
        })
      }).catch(err => console.warn('Could not trigger customer push notification:', err));
    } catch (err) {
      console.error('Admin image upload failed:', err);
      showToast('Image upload failed.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

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

            // If admin is actively viewing this customer's session, mark it as read immediately!
            if (payload.new.session_id === selectedSessionIdRef.current) {
              supabase
                .from('chat_messages')
                .update({ is_read: true })
                .eq('id', payload.new.id)
                .catch(() => {});
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
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
  }, []);

  // Mark selected session's customer messages as read in the database
  useEffect(() => {
    if (!selectedSessionId || !supabase) return;

    const markSessionMessagesAsRead = async () => {
      try {
        const unreadCustomerMsgIds = messages
          .filter(m => m.session_id === selectedSessionId && m.sender_role === 'customer' && !m.is_read)
          .map(m => m.id);

        if (unreadCustomerMsgIds.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', unreadCustomerMsgIds);
        }
      } catch (err) {
        console.warn('Could not update seen status:', err);
      }
    };

    markSessionMessagesAsRead();
  }, [selectedSessionId, messages, supabase]);

  // 3. Auto scroll selected chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedSessionId]);

  // 4. Group messages into rooms (sessions)
  const roomsMap = {};
  messages.forEach((msg) => {
    const isProductTag = msg.message_text && msg.message_text.startsWith('[PRODUCT_TAG]:');
    const isMaps = msg.message_text && msg.message_text.startsWith('http') && msg.message_text.includes('/maps');
    const cleanText = isProductTag ? 'Tagged a product 🏷️' : (isMaps ? 'Shared location 📍' : msg.message_text);

    if (!roomsMap[msg.session_id]) {
      roomsMap[msg.session_id] = {
        session_id: msg.session_id,
        customer_name: msg.customer_name || 'Guest',
        customer_phone: msg.customer_phone || '',
        last_message: cleanText,
        last_message_time: msg.created_at,
        messagesList: []
      };
    }
    roomsMap[msg.session_id].last_message = cleanText;
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

      // Trigger background push notification for customer
      apiFetch('/push/notify-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: 'SWEETO HUB',
          messageText: messageText,
          sessionId: selectedSessionId,
          targetRole: 'customer'
        })
      }).catch(err => console.warn('Could not trigger customer push notification:', err));
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
      showToast('Conversation deleted! 🗑️', 'info');
    } catch (err) {
      console.error('Error deleting chat room:', err);
    }
  };

  const copyInviteLink = () => {
    const inviteLink = `${window.location.origin}/#/support`;
    navigator.clipboard.writeText(inviteLink);
    showToast('Customer support chat link copied to clipboard! 📋✨', 'success');
  };

  return (
    <div className="w-full h-[calc(100vh-180px)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] flex overflow-hidden shadow-2xl relative">
      
      {/* Sidebar: Rooms List */}
      <div className="w-80 border-r border-slate-200/80 dark:border-slate-800 flex flex-col shrink-0 bg-white dark:bg-slate-900/50 relative">
        
        {/* Messages Mockup Header */}
        <div className="p-6 flex flex-col gap-3.5 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-850 dark:text-white tracking-tight">Messages</h2>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
              <Search size={16} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800/80 rounded-xl text-[10.5px] font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Rooms Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/30">
          {roomsList.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest mt-10">
              No active conversations
            </div>
          ) : (
            roomsList.map((room) => {
              const isActive = room.session_id === selectedSessionId;
              const unreadCount = getUnreadCount(room.messagesList);
              
              return (
                <div
                  key={room.session_id}
                  onClick={() => setSelectedSessionId(room.session_id)}
                  className={`p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-850/30 transition-colors group relative ${
                    isActive ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {/* Left Active border bar */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0084FF]" />
                  )}
                  
                  {/* Customer Block matching Mockup */}
                  <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${getAvatarColor(room.customer_name)} text-white flex items-center justify-center font-black text-xs uppercase shadow-md select-none`}>
                        {room.customer_name.substring(0, 2)}
                      </div>
                      {/* Active green status dot */}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <h4 className={`text-[11.5px] font-black truncate pr-2 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {room.customer_name}
                        </h4>
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wide shrink-0">
                          {formatMessageTime(room.last_message_time)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 gap-2">
                        <p className={`text-[10px] truncate flex-1 ${unreadCount > 0 && !isActive ? 'font-black text-slate-900 dark:text-white' : 'font-bold text-slate-400'}`}>
                          {isImageUrl(room.last_message) ? '📸 Photo' : isMapUrl(room.last_message) ? '📍 Location' : room.last_message}
                        </p>
                        
                        {unreadCount > 0 && !isActive ? (
                          <span className="w-4.5 h-4.5 rounded-full bg-[#0084FF] text-white text-[8px] font-black flex items-center justify-center shrink-0">
                            {unreadCount}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => handleDeleteRoom(room.session_id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all cursor-pointer shrink-0"
                            title="Delete Chat"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Floating Pink Action Button from the Mockup */}
        <button
          onClick={copyInviteLink}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer z-25"
          title="Copy Customer Support Invite Link"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Main Board: Chat Window */}
      <div className="flex-1 flex flex-col bg-slate-50/20 dark:bg-slate-950/5">
        {selectedRoom ? (
          <>
            {/* Active Room Header */}
            <div className="px-6 py-4.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarColor(selectedRoom.customer_name)} text-white flex items-center justify-center font-black text-xs uppercase shadow-md select-none`}>
                    {selectedRoom.customer_name.substring(0, 2)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-850 dark:text-white leading-none">
                    {selectedRoom.customer_name}
                  </h3>
                  {selectedRoom.customer_phone && (
                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                      <Phone size={10} /> {selectedRoom.customer_phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Message logs */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 scrollbar-thin bg-slate-50/10">
              {selectedRoom.messagesList.map((msg) => {
                const isAdmin = msg.sender_role === 'admin';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-[1.4rem] px-5 py-3 text-xs font-bold leading-relaxed shadow-sm ${
                        isAdmin
                          ? 'bg-[#0084FF] text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-white/5 rounded-tl-none'
                      }`}
                    >
                      {msg.message_text && msg.message_text.startsWith('[PRODUCT_TAG]:') ? (() => {
                        try {
                          const productData = JSON.parse(msg.message_text.replace('[PRODUCT_TAG]:', ''));
                          return (
                            <div className="flex flex-col gap-2 min-w-[200px] text-slate-800 dark:text-slate-100">
                              <span className="text-[10px] font-black text-[#0084FF] uppercase tracking-wide flex items-center gap-1 select-none">
                                <span>🏷️</span> Tagged Product
                              </span>
                              <div className="flex gap-2.5 items-center bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-white/5">
                                <img
                                  src={productData.image || '/hero-banner.png'}
                                  alt={productData.name}
                                  className="w-10 h-10 object-cover rounded bg-white shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black truncate leading-tight">{productData.name}</span>
                                  <span className="text-[10px] font-bold text-rose-500 font-mono mt-0.5">
                                    {productData.price ? `${productData.price.toLocaleString()} FCFA` : ''}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  window.open(`${window.location.origin}/#/product/${productData.id}`, '_blank');
                                }}
                                className="py-1.5 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-lg text-[9px] font-black text-center uppercase tracking-widest transition-all cursor-pointer shadow-sm active:scale-98"
                              >
                                View Product Page
                              </button>
                            </div>
                          );
                        } catch (e) {
                          return msg.message_text;
                        }
                      })() : isImageUrl(msg.message_text) ? (
                        <div className="relative group/img overflow-hidden rounded-xl">
                          <img 
                            src={msg.message_text} 
                            alt="Asset shared" 
                            className="max-w-[240px] rounded-xl cursor-zoom-in hover:opacity-95"
                            onClick={() => window.open(msg.message_text, '_blank')}
                          />
                          <a
                            href={msg.message_text}
                            download={`sweeto_chat_${Date.now()}.png`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-all flex items-center justify-center cursor-pointer shadow-md"
                            title="Save Image"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      ) : isMapUrl(msg.message_text) ? (
                        <div className="flex flex-col gap-1.5 leading-normal min-w-[200px] text-slate-800 dark:text-slate-100">
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-wide flex items-center gap-1">
                            <MapPin size={12} className="animate-bounce" /> Location Shared
                          </span>
                          <span className="text-[11px] font-bold">Delivery address pinned by client.</span>
                          <a 
                            href={msg.message_text} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="mt-1 py-1.5 bg-[#0084FF] hover:bg-[#0078eb] text-white rounded-lg text-[10px] font-black text-center uppercase tracking-widest transition-all"
                          >
                            Open Map
                          </a>
                        </div>
                      ) : (
                        msg.message_text
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1.5 flex items-center gap-1">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender_role === 'admin' && (
                        msg.is_read ? (
                          <CheckCheck size={11} className="text-[#0084FF] font-black" title="Seen" />
                        ) : (
                          <CheckCheck size={11} className="text-slate-350 dark:text-slate-550" title="Sent & Received" />
                        )
                      )}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isSending}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-[#0084FF] hover:bg-slate-100 dark:hover:bg-slate-750 rounded-2xl transition-all cursor-pointer shrink-0 disabled:opacity-40"
                title="Send Image"
              >
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                ) : (
                  <Image size={16} />
                )}
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs font-bold focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none"
                disabled={isUploading}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending || isUploading}
                className="w-11 h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all cursor-pointer shrink-0"
              >
                <Send size={15} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-850 flex items-center justify-center mb-4">
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
