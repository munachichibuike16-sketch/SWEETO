import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export default function FloatingChatButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on admin page, live chat panel, and customer support page
  const isHiddenPage = 
    location.pathname.includes('/dashboard') || 
    location.pathname.includes('/chat') || 
    location.pathname.includes('/support');

  if (isHiddenPage) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate('/support')}
      className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 cursor-pointer"
      aria-label="Chat with support"
    >
      <MessageSquare size={22} />
    </motion.button>
  );
}
