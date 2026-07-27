import React, { useState, useRef, useEffect } from 'react';
import { Mic, Camera, X, ShoppingBag, Settings, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  <svg className={`w-5 h-5 ${filled ? 'fill-rose-500 stroke-rose-500' : 'fill-none stroke-currentColor'}`} viewBox="0 0 24 24">
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

export default function DesktopHeader({ activePage = 'home', setActivePage, onCartOpen, onSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, products: globalProducts, showToast } = useStore();
  const { cartItems: cart = [], cartTotal: cartSubtotal } = useCart();
  const { wishlistItems: wishlist = [] } = useWishlist();
  const { t_smart } = useLanguage();
  
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
      navigate(`/category/All?search=${encodeURIComponent(inputValue)}`);
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
      navigate(`/category/All?search=${encodeURIComponent(transcript)}`);
      setIsListening(false);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };
  
  const openProductDetail = (p) => {
    navigate(`/product/${p.id}`);
  };
  
  const handleSidebarOpen = () => {
    if (onSidebarOpen) onSidebarOpen();
    else navigate('/brands');
  };

  const currencySymbol = settings?.currency_symbol || 'FCFA';
  const formatPrice = (p) => p ? p.toLocaleString() : '0';

  return (
    <>
      {/* TOP ANNOUNCEMENT BAR */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-8 font-medium">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <IconZap /> Express Desktop Store: Free 2-Day Shipping on Orders Over $150
            </span>
            <span className="text-slate-500">|</span>
            <span>24/7 VIP Support: 1-800-LUX-DESK</span>
          </div>
          <div className="flex items-center space-x-6 text-slate-400">
            <button className="hover:text-white transition">Track Order</button>
            <button className="hover:text-white transition">USD ($)</button>
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-8 py-3.5 flex items-center justify-between gap-8">
          <div 
            onClick={() => { setActivePage('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="cursor-pointer flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#6D28D9] flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-[#8B5CF6]/30 group-hover:scale-105 transition-transform duration-300">
              X
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#6D28D9] via-[#8B5CF6] to-slate-900">
                {settings?.shopName || 'SWEETO'}
              </span>
              <span className="block text-[9px] tracking-[0.2em] font-extrabold uppercase text-[#8B5CF6] -mt-1">
                {t_smart('Desktop Commerce')}
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearchSubmit} className="flex items-center rounded-2xl border border-slate-200/80 bg-slate-50 hover:bg-white focus-within:bg-white focus-within:border-[#8B5CF6] focus-within:ring-4 focus-within:ring-[#8B5CF6]/10 transition-all shadow-inner">
              <input 
                type="text" 
                placeholder={placeholders[currentPlaceholderIndex]}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => inputValue.length > 1 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="w-full bg-transparent px-5 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none"
              />
              {inputValue && (
                <button type="button" onClick={() => { setInputValue(''); setSearchQuery(''); }} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={16} />
                </button>
              )}
              <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-slate-400 hover:text-[#8B5CF6] transition-colors" title="Search by image">
                <Camera size={18} />
              </button>
              <button type="button" onClick={startVoiceSearch} className={`p-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400 hover:text-[#8B5CF6]'}`} title="Voice Search">
                <Mic size={18} />
              </button>
              <button type="submit" className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-7 py-3.5 transition-colors flex items-center gap-2 font-bold text-sm shadow-md ml-1 rounded-r-xl">
                <IconSearch />
                <span>{t_smart('Search')}</span>
              </button>
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                {suggestions.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      openProductDetail(p);
                      setShowSuggestions(false);
                      setInputValue('');
                      setSearchQuery('');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
                  >
                    <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={p.image_url || p.image || '/hero-banner.png'} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col text-start">
                      <span className="text-sm font-bold text-slate-900">{p.name}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category_name || p.category_id || p.category || 'Electronics'}</span>
                    </div>
                    <div className="ml-auto">
                      <span className="text-xs font-black text-[#8B5CF6]">{currencySymbol} {formatPrice(p.price)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input 
              type="file" 
              ref={imageInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  showToast(t_smart('Visual search processing...'), 'info');
                  setTimeout(() => {
                    showToast(t_smart('Found matching products!'), 'success');
                  }, 1500);
                }
              }}
            />
          </div>

          <div className="flex items-center gap-5 flex-shrink-0">
            <button 
              onClick={() => navigate('/wishlist')}
              className="relative flex items-center gap-3 text-slate-700 hover:text-[#8B5CF6] transition-all group bg-slate-50 hover:bg-[#8B5CF6]/5 px-3 py-2 rounded-2xl border border-slate-200/60 hover:border-[#8B5CF6]/20"
            >
              <div className="p-2 rounded-xl bg-white shadow-sm text-rose-500 group-hover:scale-110 transition-transform duration-300">
                <IconHeart filled={wishlist.length > 0} />
              </div>
              <div className="text-left hidden lg:block pr-1">
                <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{t_smart('Saved')}</span>
                <span className="text-xs font-extrabold text-slate-800 group-hover:text-[#8B5CF6] transition-colors">{t_smart('Wishlist')} ({wishlist.length})</span>
              </div>
            </button>

      
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => {
                  if (currentUser) {
                    setShowProfileDropdown(!showProfileDropdown);
                  } else {
                    navigate('/auth');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="relative flex items-center gap-3 text-slate-700 hover:text-[#8B5CF6] transition-all group bg-slate-50 hover:bg-[#8B5CF6]/5 px-3 py-2 rounded-2xl border border-slate-200/60 hover:border-[#8B5CF6]/20"
              >
                {currentUser ? (
                  <div className="w-9 h-9 rounded-full bg-[#6D28D9] flex items-center justify-center text-white font-extrabold text-[15px] shadow-sm">
                    {(currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-white shadow-sm text-slate-600 group-hover:text-[#8B5CF6] group-hover:scale-110 transition-all duration-300">
                    <IconUser />
                  </div>
                )}
                <div className="text-left hidden lg:block pr-1">
                  <span className="block text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">{t_smart('Account')}</span>
                  <span className="text-xs font-extrabold text-slate-800 group-hover:text-[#8B5CF6] transition-colors">
                    {currentUser ? (currentUser.user_metadata?.full_name?.split(' ')[0] || 'My Account') : t_smart('Sign In')}
                  </span>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileDropdown && currentUser && (
                <div className="absolute right-0 top-full mt-3 w-[260px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="flex flex-col items-center justify-center py-5 px-4 border-b border-slate-100 text-center">
                    <div className="w-[64px] h-[64px] rounded-full bg-[#6D28D9] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#6D28D9]/20 mb-3">
                      {(currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{currentUser.user_metadata?.full_name || 'User'}</h3>
                    <p className="text-slate-400 text-xs mt-0.5 truncate w-full">{currentUser.email}</p>
                  </div>
                  
                  <div className="p-2 flex flex-col gap-1 mt-1">
                    <button onClick={() => { setShowProfileDropdown(false); navigate('/dashboard'); }} className="flex items-center gap-4 px-4 py-3.5 text-slate-800 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-2xl transition-colors font-bold text-[15px]">
                      <ShoppingBag size={20} className="text-[#8B5CF6]" />
                      <span>My Orders</span>
                    </button>
                    <button onClick={() => { setShowProfileDropdown(false); navigate('/settings'); }} className="flex items-center gap-4 px-4 py-3.5 text-slate-800 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-2xl transition-colors font-bold text-[15px]">
                      <Settings size={20} className="text-[#8B5CF6]" />
                      <span>Settings</span>
                    </button>
                    <button onClick={() => { setShowProfileDropdown(false); handleLogout(); }} className="flex items-center gap-4 px-4 py-3.5 text-slate-800 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 rounded-2xl transition-colors font-bold text-[15px]">
                      <LogOut size={20} className="text-[#8B5CF6]" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
<button 
              onClick={() => onCartOpen && onCartOpen()}
              className="relative flex items-center gap-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] hover:from-[#7C3AED] hover:to-[#6D28D9] text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-[#8B5CF6]/30 transition transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 border border-[#7C3AED]"
            >
              <div className="relative p-1">
                <IconCart />
                <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-[2.5px] border-[#8B5CF6] shadow-sm">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="text-left pl-1 pr-2">
                <span className="block text-[9px] uppercase font-black text-indigo-100 tracking-wider mb-0.5">{t_smart('Cart')}</span>
                <span className="text-xs font-black tracking-tight">{currencySymbol} {formatPrice(cartSubtotal)}</span>
              </div>
            </button>
          </div>
        </div>

        {/* CATEGORY NAVIGATION BAR */}
        <div className="bg-slate-50/80 backdrop-blur-xl border-y border-slate-200/60">
          <div className="max-w-[1440px] mx-auto px-8 flex items-center justify-between text-sm font-semibold text-slate-600">
            <div className="flex items-center space-x-8 py-2.5">
              <button 
                onClick={handleSidebarOpen}
                className="flex items-center gap-2.5 bg-slate-200/50 hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6] text-slate-700 px-4 py-2 rounded-xl border border-slate-200/80 transition-all font-extrabold text-[11px] group cursor-pointer shadow-sm"
              >
                <IconMenu />
                <span className="tracking-widest uppercase">Sidebar</span>
              </button>

              <button 
                onClick={() => { navigate('/'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`transition-all pb-1 border-b-2 ${activePage === 'home' ? 'text-[#8B5CF6] border-[#8B5CF6] font-bold' : 'border-transparent hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30'}`}
              >
                Home
              </button>

              <button 
                onClick={() => { navigate('/brands'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`transition-all pb-1 border-b-2 ${activePage === 'brands' ? 'text-[#8B5CF6] border-[#8B5CF6] font-bold' : 'border-transparent hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30'}`}
              >
                Brands
              </button>
              
              <button 
                onClick={() => { navigate('/deals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`flex items-center gap-1.5 transition-all pb-1 border-b-2 ${activePage === 'deals' ? 'text-amber-600 border-amber-600 font-bold' : 'border-transparent hover:text-amber-600 hover:border-amber-600/30'}`}
              >
                <span className={`w-2 h-2 rounded-full ${activePage === 'deals' ? 'bg-amber-500' : 'bg-amber-200'} animate-pulse`}></span>
                Deals of the Day
              </button>

              <button 
                onClick={() => { navigate('/new-arrivals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`flex items-center gap-1.5 transition-all pb-1 border-b-2 ${activePage === 'new-arrivals' ? 'text-[#8B5CF6] border-[#8B5CF6] font-bold' : 'border-transparent hover:text-[#8B5CF6] hover:border-[#8B5CF6]/30'}`}
              >
                Just Arrived
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-extrabold text-[#8B5CF6] uppercase tracking-wider bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="text-sm">🔥</span>
              <span>Up to 50% Off Flash Sales!</span>
            </div>
          </div>
        </div>
      </header>

      
    </>
  );
}
