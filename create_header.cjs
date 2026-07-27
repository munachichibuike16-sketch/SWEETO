const fs = require('fs');

const desktopAppContent = fs.readFileSync('src/DesktopApp.jsx', 'utf8');
const headerStart = desktopAppContent.indexOf('{/* TOP ANNOUNCEMENT BAR */}');
const headerEnd = desktopAppContent.indexOf('{/* PAGE VIEW: WISHLIST */}');

if (headerStart === -1 || headerEnd === -1) {
  console.error("Could not find header markers");
  process.exit(1);
}

const headerCode = desktopAppContent.substring(headerStart, headerEnd);

const template = `import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, X, ShoppingBag, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { supabase } from '../lib/supabase';

const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconCart = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IconHeart = ({ filled }) => (
  <svg className={\`w-5 h-5 \${filled ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-currentColor'}\`} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconZap = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default function DesktopHeader({ activePage = 'home', setActivePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, products: globalProducts, showToast, t_smart } = useStore();
  const { cart, cartSubtotal, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  
  const [currentUser, setCurrentUser] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const imageInputRef = useRef(null);
  
  const [placeholders] = useState([
    'Wireless Earbuds',
    'Gaming Keyboards',
    'Smart Watches',
    'Mechanical Keyboards',
    'USB-C Hubs'
  ]);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);

  // If no setActivePage prop is provided, we can fallback to location based
  if (!setActivePage) {
    if (location.pathname === '/') activePage = 'home';
    else if (location.pathname === '/brands') activePage = 'brands';
    else if (location.pathname === '/deals') activePage = 'deals';
    else if (location.pathname === '/new-arrivals') activePage = 'new-arrivals';
    else activePage = 'other';
    
    setActivePage = (page) => {
      if (page === 'home') navigate('/');
      if (page === 'brands') navigate('/brands');
      if (page === 'deals') navigate('/deals');
      if (page === 'new-arrivals') navigate('/new-arrivals');
    };
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileDropdown(false);
    showToast('Logged out successfully', 'success');
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (val.length > 1) {
      const sugs = (globalProducts || []).filter(p => p.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(sugs);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue);
      setShowSuggestions(false);
      navigate(\`/category/All?search=\${encodeURIComponent(inputValue)}\`);
    }
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast('Voice search is not supported in your browser', 'error');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setSearchQuery(transcript);
      navigate(\`/category/All?search=\${encodeURIComponent(transcript)}\`);
      setIsListening(false);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };
  
  const openProductDetail = (p) => {
    navigate(\`/product/\${p.id}\`);
  };
  
  const setIsSidebarOpen = () => {
    navigate('/brands');
  };

  const currencySymbol = settings?.currency_symbol || 'FCFA';
  const formatPrice = (p) => p ? p.toLocaleString() : '0';

  return (
    <>
      ${headerCode}
    </>
  );
}
`;

fs.writeFileSync('src/components/DesktopHeader.jsx', template);
console.log('Done');
