import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import OrdersHistoryContent from '../components/OrdersHistoryContent';
import { 
  User, 
  Package, 
  Settings as SettingsIcon, 
  LogOut, 
  Moon, 
  Sun, 
  Globe, 
  Save, 
  MapPin, 
  Phone, 
  Shield, 
  Heart, 
  ShoppingBag, 
  Lock, 
  Truck, 
  ArrowLeft,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import './AuthPage.css';

const AuthPage = ({ initialTab = 'login' }) => {
  const navigate = useNavigate();
  const { showToast, settings } = useStore();
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoaded, setGoogleLoaded] = useState(false);

  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    countryCode: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });

  const [shippingZones, setShippingZones] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: ''
  });

  // Chilling custom preferences
  const [preferences, setPreferences] = useState({
    smsAlerts: true,
    whatsappUpdates: true,
    promoEmails: false
  });

  const [stats, setStats] = useState({
    ordersCount: 0,
    wishlistCount: 0
  });

  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const africanCountries = [
    { name: "Algeria", code: "+213" }, { name: "Angola", code: "+244" }, { name: "Benin", code: "+229" },
    { name: "Botswana", code: "+267" }, { name: "Burkina Faso", code: "+226" }, { name: "Burundi", code: "+257" },
    { name: "Cameroon", code: "+237" }, { name: "Cape Verde", code: "+238" }, { name: "Central African Republic", code: "+236" },
    { name: "Chad", code: "+235" }, { name: "Comoros", code: "+269" }, { name: "Congo", code: "+242" },
    { name: "DR Congo", code: "+243" }, { name: "Djibouti", code: "+253" }, { name: "Egypt", code: "+20" },
    { name: "Equatorial Guinea", code: "+240" }, { name: "Eritrea", code: "+291" }, { name: "Eswatini", code: "+268" },
    { name: "Ethiopia", code: "+251" }, { name: "Gabon", code: "+241" }, { name: "Gambia", code: "+220" },
    { name: "Ghana", code: "+233" }, { name: "Guinea", code: "+224" }, { name: "Guinea-Bissau", code: "+245" },
    { name: "Ivory Coast", code: "+225" }, { name: "Kenya", code: "+254" }, { name: "Lesotho", code: "+266" },
    { name: "Liberia", code: "+231" }, { name: "Libya", code: "+218" }, { name: "Madagascar", code: "+261" },
    { name: "Malawi", code: "+265" }, { name: "Mali", code: "+223" }, { name: "Mauritania", code: "+222" },
    { name: "Mauritius", code: "+230" }, { name: "Morocco", code: "+212" }, { name: "Mozambique", code: "+258" },
    { name: "Namibia", code: "+264" }, { name: "Niger", code: "+227" }, { name: "Nigeria", code: "+234" },
    { name: "Rwanda", code: "+250" }, { name: "Senegal", code: "+221" }, { name: "Seychelles", code: "+248" },
    { name: "Sierra Leone", code: "+232" }, { name: "Somalia", code: "+252" }, { name: "South Africa", code: "+27" },
    { name: "South Sudan", code: "+211" }, { name: "Sudan", code: "+249" }, { name: "Tanzania", code: "+255" },
    { name: "Togo", code: "+228" }, { name: "Tunisia", code: "+216" }, { name: "Uganda", code: "+256" },
    { name: "Zambia", code: "+260" }, { name: "Zimbabwe", code: "+263" }
  ];

  // Fetch session & shipping zones on mount
  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('sweetohub_session'));
    if (session) {
      setSessionUser(session);
      setCurrentTab('overview');
      setSettingsForm({
        name: session.name || '',
        phone: session.phoneNumber || '',
        address: session.address || '',
        city: session.city || ''
      });
      if (session.preferences) {
        setPreferences(session.preferences);
      }
      fetchStats(session);
    }

    const fetchShipping = async () => {
      try {
        const { data, error } = await supabase
          .from('shipping_zones')
          .select('*')
          .order('name', { ascending: true });
        if (!error && data) {
          setShippingZones(data);
        }
      } catch (e) { console.error('Error loading shipping zones:', e); }
    };
    fetchShipping();
  }, []);

  const switchTab = (tab) => {
    setCurrentTab(tab);
    setErrors({});
  };

  const togglePassword = (id) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    const { email, password } = loginData;
    let newErrors = {};

    if (!email) newErrors.loginEmail = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.loginEmail = 'Invalid email address.';
    if (!password) newErrors.loginPassword = 'Please enter your password.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setErrors({ loginEmail: 'No account found with this email.' });
        showToast('Account not found. Please sign up first.', 'error');
        setLoading(false);
        return;
      }
      if (user.password !== password) {
        setErrors({ loginPassword: 'Incorrect password.' });
        showToast('Incorrect password.', 'error');
        setLoading(false);
        return;
      }

      const { password: _, ...safeUser } = user;
      localStorage.setItem('sweetohub_session', JSON.stringify(safeUser));
      setSessionUser(safeUser);
      if (loginData.rememberMe) localStorage.setItem('sweetohub_remembered_email', email);
      else localStorage.removeItem('sweetohub_remembered_email');

      showToast(`Welcome back, ${user.name}! ⚡`, 'success');
      setLoading(false);
      setCurrentTab('overview');
    }, 1000);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    const { name, email, countryCode, phone, password, confirmPassword } = signupData;
    let newErrors = {};

    if (!name || name.length < 2) newErrors.signupName = 'Name too short.';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.signupEmail = 'Invalid email.';
    if (!countryCode) newErrors.signupPhone = 'Select code.';
    if (!phone || !/^[0-9\s]+$/.test(phone) || phone.replace(/\s/g, '').length < 7) newErrors.signupPhone = 'Invalid phone.';
    if (!password || password.length < 8) newErrors.signupPassword = 'Min. 8 characters.';
    if (password !== confirmPassword) newErrors.signupConfirmPassword = 'Passwords do not match.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      setErrors({ signupEmail: 'Email already registered.' });
      showToast('Email already exists. Please log in.', 'error');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        phoneCountryCode: countryCode,
        phoneNumber: phone.replace(/\s/g, ''),
        password,
        createdAt: new Date().toISOString(),
        provider: 'email'
      };
      users.push(newUser);
      localStorage.setItem('sweetohub_users', JSON.stringify(users));
      
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem('sweetohub_session', JSON.stringify(safeUser));
      setSessionUser(safeUser);

      showToast(`Welcome to SWEETO-HUB, ${name}! ⚡`, 'success');
      setLoading(false);
      setCurrentTab('overview');
    }, 1000);
  };

  // Google Login callbacks
  const GOOGLE_CLIENT_ID = '869701747796-smfrr2fte1uv0t8dsebll4gvumkrjdv7.apps.googleusercontent.com';

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup'
        });

        const placeholder = document.getElementById('google-button-official');
        if (placeholder) {
          window.google.accounts.id.renderButton(
            placeholder,
            { 
              theme: 'outline', 
              size: 'large', 
              width: '320', 
              text: 'continue_with',
              shape: 'pill',
              logo_alignment: 'left'
            }
          );
          setGoogleLoaded(true);
        }
      }
    };

    if (!document.getElementById('google-jssdk')) {
      const script = document.createElement('script');
      script.id = 'google-jssdk';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      setTimeout(initGoogle, 150);
    }
  }, []);

  const handleGoogleCredentialResponse = (response) => {
    const parseJwt = (token) => {
      try {
        return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      } catch (e) { return null; }
    };

    const payload = parseJwt(response.credential);
    if (payload) {
      const googleUser = {
        id: payload.sub,
        name: payload.name || 'Google User',
        email: payload.email,
        picture: payload.picture,
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let existing = users.find(u => u.email.toLowerCase() === googleUser.email.toLowerCase());
      
      if (!existing) {
        users.push({ ...googleUser, password: null });
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
        existing = googleUser;
      }
      
      localStorage.setItem('sweetohub_session', JSON.stringify(existing));
      setSessionUser(existing);
      showToast(`Welcome, ${existing.name}!`, 'success');
      setCurrentTab('overview');
    }
  };

  const handleGoogleDemoFallback = () => {
    showToast('🔷 Demo Mode: Simulating Google Login...', 'info');
    setTimeout(() => {
      const demoUser = {
        id: 'google_demo_' + Date.now(),
        name: 'Sweeto User',
        email: 'sweeto.user@gmail.com',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let existing = users.find(u => u.email === demoUser.email);
      if (!existing) {
        users.push({ ...demoUser, password: null });
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
        existing = demoUser;
      }
      localStorage.setItem('sweetohub_session', JSON.stringify(existing));
      setSessionUser(existing);
      showToast(`Welcome, ${existing.name}! (Demo)`, 'success');
      setCurrentTab('overview');
    }, 1500);
  };

  const fetchStats = async (user) => {
    if (!user) return;
    const savedWishlist = JSON.parse(localStorage.getItem('sweeto_wishlist') || '[]');
    const wishlistCount = savedWishlist.length;

    let ordersCount = 0;
    if (user.phoneNumber) {
      try {
        const cleanPhone = user.phoneNumber.replace(/\D/g, '');
        const searchFilter = `%${cleanPhone}%`;
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .or(`customer_contact.ilike.${searchFilter},customer_phone.ilike.${searchFilter}`);
        if (!error) {
          ordersCount = count || 0;
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    }

    setStats({ ordersCount, wishlistCount });
  };

  useEffect(() => {
    if (sessionUser && currentTab === 'overview') {
      fetchStats(sessionUser);
    }
  }, [currentTab, sessionUser]);

  const handleLogout = () => {
    localStorage.removeItem('sweetohub_session');
    setSessionUser(null);
    showToast('Logged out successfully.', 'info');
    navigate('/');
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    if (!settingsForm.name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    const updatedUser = {
      ...sessionUser,
      name: settingsForm.name,
      phoneNumber: settingsForm.phone,
      address: settingsForm.address,
      city: settingsForm.city,
      preferences: preferences
    };

    localStorage.setItem('sweetohub_session', JSON.stringify(updatedUser));
    setSessionUser(updatedUser);

    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    const updatedUsers = users.map(u => u.email.toLowerCase() === sessionUser.email.toLowerCase() ? { ...u, ...updatedUser } : u);
    localStorage.setItem('sweetohub_users', JSON.stringify(updatedUsers));

    showToast('Profile settings saved! ✨', 'success');
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const { oldPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      showToast('Please fill in all password fields.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === sessionUser.email.toLowerCase());

    if (userIndex === -1) {
      showToast('User account not found.', 'error');
      return;
    }

    const user = users[userIndex];
    if (user.password && user.password !== oldPassword) {
      showToast('Incorrect current password.', 'error');
      return;
    }

    users[userIndex].password = newPassword;
    localStorage.setItem('sweetohub_users', JSON.stringify(users));

    const updatedSession = { ...sessionUser, password: newPassword };
    localStorage.setItem('sweetohub_session', JSON.stringify(updatedSession));
    setSessionUser(updatedSession);

    showToast('Password changed successfully! 🔒', 'success');
    setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    setShowPasswordChange(false);
  };

  const { lang, changeLanguage } = useLanguage();
  const isGoogleUser = sessionUser?.provider === 'google';

  if (sessionUser) {
    return (
      <div className="auth-body dark:bg-slate-950 transition-colors duration-500">
        <span className="candy-decoration">⚡</span>
        <span className="candy-decoration">💻</span>
        <span className="candy-decoration">✨</span>
        <span className="candy-decoration" style={{ top: '20%', left: '15%' }}>💖</span>
        <span className="candy-decoration" style={{ bottom: '20%', right: '15%' }}>🚀</span>
        
        <div className="main-container" style={{ maxWidth: currentTab === 'orders' ? '920px' : '560px', transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="auth-card dark:bg-slate-900/60 dark:border-slate-800 backdrop-blur-xl" style={{ width: '100%' }}>
            <div className="card-content">
              
              {/* Header Info */}
              <div className="brand-section">
                <div className="profile-avatar-wrapper">
                  <div className="profile-avatar-glow"></div>
                  <div className="brand-icon profile-main-avatar">
                    {sessionUser.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <h1 className="brand-name font-black italic tracking-tighter" style={{ fontSize: '2.2rem', marginTop: '1rem' }}>
                  {t('hello') || 'Hello'}, {sessionUser.name?.split(' ')[0]}! 👋
                </h1>
                <p className="brand-tagline text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.2em]">{sessionUser.email}</p>
              </div>

              {/* Tab Selector */}
              <div className="tab-switcher bg-slate-100/80 dark:bg-slate-950/50 p-1 border-slate-200/50 dark:border-slate-800 rounded-2xl mb-8">
                <button 
                  className={`tab-btn text-xs font-black uppercase tracking-widest gap-2 ${currentTab === 'overview' ? 'active' : ''}`}
                  onClick={() => switchTab('overview')}
                >
                  <User size={14} /> {t('profile') || 'Profile'}
                </button>
                <button 
                  className={`tab-btn text-xs font-black uppercase tracking-widest gap-2 ${currentTab === 'orders' ? 'active' : ''}`}
                  onClick={() => switchTab('orders')}
                >
                  <Package size={14} /> {t('my_orders') || 'Orders'}
                </button>
                <button 
                  className={`tab-btn text-xs font-black uppercase tracking-widest gap-2 ${currentTab === 'settings' ? 'active' : ''}`}
                  onClick={() => switchTab('settings')}
                >
                  <SettingsIcon size={14} /> {t('settings') || 'Settings'}
                </button>
              </div>

              {/* Content Panels */}
              <div className="profile-dashboard mt-0">
                {currentTab === 'overview' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Orders Count Card */}
                      <div 
                        onClick={() => switchTab('orders')}
                        className="profile-stat-box adorable-card dark:bg-slate-900/40 dark:border-slate-800/80 flex flex-col items-center cursor-pointer hover:border-eas-blue hover:scale-[1.03] transition-all group"
                      >
                        <div className="stat-icon-circle bg-blue-50 dark:bg-blue-950/30 text-blue-500 group-hover:bg-eas-blue group-hover:text-white transition-all">
                          <Package size={16} />
                        </div>
                        <span className="stat-label text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('my_orders') || 'Orders'}</span>
                        <span className="stat-value text-base font-black text-slate-900 dark:text-white mt-1">
                          {stats.ordersCount}
                        </span>
                      </div>

                      {/* Wishlist Count Card */}
                      <div 
                        onClick={() => navigate('/wishlist')}
                        className="profile-stat-box adorable-card dark:bg-slate-900/40 dark:border-slate-800/80 flex flex-col items-center cursor-pointer hover:border-pink-500 hover:scale-[1.03] transition-all group"
                      >
                        <div className="stat-icon-circle bg-pink-50 dark:bg-pink-950/30 text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all">
                          <Heart size={16} />
                        </div>
                        <span className="stat-label text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('wishlist') || 'Wishlist'}</span>
                        <span className="stat-value text-base font-black text-slate-900 dark:text-white mt-1">
                          {stats.wishlistCount}
                        </span>
                      </div>

                      {/* Member Since Card */}
                      <div className="profile-stat-box adorable-card dark:bg-slate-900/40 dark:border-slate-800/80 flex flex-col items-center">
                        <div className="stat-icon-circle bg-purple-50 dark:bg-purple-950/30 text-purple-500">
                          <Calendar size={16} />
                        </div>
                        <span className="stat-label text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('member_since') || 'Member Since'}</span>
                        <span className="stat-value text-[11px] font-black text-slate-700 dark:text-slate-300 mt-1.5 text-center leading-tight">
                          {new Date(sessionUser.createdAt || Date.now()).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Security Status Card */}
                      <div className="profile-stat-box adorable-card dark:bg-slate-900/40 dark:border-slate-800/80 flex flex-col items-center">
                        <div className="stat-icon-circle bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
                          <Shield size={16} />
                        </div>
                        <span className="stat-label text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('security') || 'Security'}</span>
                        <span className="stat-value text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase mt-1.5 text-center leading-tight">
                          {sessionUser.provider || 'Verified'}
                        </span>
                      </div>
                    </div>

                    <div className="quick-links">
                      <div className="quick-link-item dark:bg-slate-900/40 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/70" onClick={() => navigate('/')}>
                        <div className="ql-icon bg-blue-50 dark:bg-blue-950/30 text-blue-500"><ShoppingBag size={18} /></div>
                        <div className="ql-text">
                          <span className="ql-title text-slate-900 dark:text-white">{t('continue_shopping') || 'Continue Shopping'}</span>
                          <span className="ql-desc text-slate-400 dark:text-slate-500">{t('explore_premium_arrivals') || 'Explore our latest premium arrivals'}</span>
                        </div>
                        <ChevronRight className="ql-arrow" size={16} />
                      </div>
                      <div className="quick-link-item dark:bg-slate-900/40 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900/70" onClick={() => navigate('/wishlist')}>
                        <div className="ql-icon bg-pink-50 dark:bg-pink-950/30 text-pink-500"><Heart size={18} /></div>
                        <div className="ql-text">
                          <span className="ql-title text-slate-900 dark:text-white">{t('my_wishlist') || 'My Wishlist'}</span>
                          <span className="ql-desc text-slate-400 dark:text-slate-500">{t('check_saved_items') || 'Check the items you saved for later'}</span>
                        </div>
                        <ChevronRight className="ql-arrow" size={16} />
                      </div>
                    </div>

                    <div className="profile-actions pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button className="btn-google logout-btn-adorable w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest dark:bg-red-950/10 dark:border-red-900/20" onClick={handleLogout}>
                        <LogOut size={16} /> {t('secure_sign_out') || 'Secure Sign Out'}
                      </button>
                    </div>
                  </div>
                )}

                {currentTab === 'orders' && (
                  <div className="animate-fade-in w-full overflow-hidden">
                    <OrdersHistoryContent isProfileTab={true} />
                  </div>
                )}

                {currentTab === 'settings' && (
                  <div className="space-y-6 text-left animate-fade-in">
                    
                    {/* Profile Details Block */}
                    <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                        <User className="text-eas-blue" size={15} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Profile Details</span>
                      </div>
                      
                      <div className="input-group">
                        <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Full Name</label>
                        <div className="input-wrapper mt-1">
                          <User className="input-icon" size={18} />
                          <input 
                            type="text" 
                            placeholder="Name" 
                            value={settingsForm.name}
                            onChange={(e) => setSettingsForm({...settingsForm, name: e.target.value})}
                            className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Phone Number</label>
                        <div className="input-wrapper mt-1">
                          <Phone className="input-icon" size={18} />
                          <input 
                            type="tel" 
                            placeholder="Phone number" 
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                            className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="input-group">
                          <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Commune / City</label>
                          <select 
                            value={settingsForm.city}
                            onChange={(e) => setSettingsForm({...settingsForm, city: e.target.value})}
                            className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                          >
                            <option value="">Select Commune</option>
                            {shippingZones.map(zone => (
                              <option key={zone.id} value={zone.name}>{zone.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="input-group">
                          <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Language</label>
                          <select 
                            value={lang}
                            onChange={(e) => changeLanguage(e.target.value)}
                            className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 outline-none"
                          >
                            <option value="en">🇺🇸 English</option>
                            <option value="fr">🇫🇷 Français</option>
                            <option value="es">🇪🇸 Español</option>
                          </select>
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Default Shipping Address</label>
                        <textarea 
                          rows="2"
                          placeholder="Default Address" 
                          value={settingsForm.address}
                          onChange={(e) => setSettingsForm({...settingsForm, address: e.target.value})}
                          className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-755 dark:text-white outline-none focus:border-eas-blue focus:ring-2 focus:ring-eas-blue/10 transition-all resize-none"
                        />
                      </div>
                    </div>

                    {/* Preferences Block */}
                    <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                        <Bell className="text-amber-500" size={15} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white font-black">Notification Preferences</span>
                      </div>
                      <div className="space-y-2.5">
                        <label className="flex items-center justify-between cursor-pointer py-0.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Order Status SMS Alerts</span>
                          <input 
                            type="checkbox" 
                            checked={preferences.smsAlerts}
                            onChange={(e) => setPreferences({...preferences, smsAlerts: e.target.checked})}
                            className="w-4 h-4 rounded text-eas-blue border-slate-300 dark:border-slate-700 focus:ring-eas-blue/30"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer py-0.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp Delivery Updates</span>
                          <input 
                            type="checkbox" 
                            checked={preferences.whatsappUpdates}
                            onChange={(e) => setPreferences({...preferences, whatsappUpdates: e.target.checked})}
                            className="w-4 h-4 rounded text-eas-blue border-slate-300 dark:border-slate-700 focus:ring-eas-blue/30"
                          />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer py-0.5">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Promotional Emails & Offers</span>
                          <input 
                            type="checkbox" 
                            checked={preferences.promoEmails}
                            onChange={(e) => setPreferences({...preferences, promoEmails: e.target.checked})}
                            className="w-4 h-4 rounded text-eas-blue border-slate-300 dark:border-slate-700 focus:ring-eas-blue/30"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Appearance Block */}
                    <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                        <Sun className="text-purple-500" size={15} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white font-black">Theme Appearance</span>
                      </div>
                      <button 
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-955 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-300 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900"
                      >
                        <span className="flex items-center gap-2">
                          {isDarkMode ? <Moon size={16} className="text-purple-500" /> : <Sun size={16} className="text-amber-500" />}
                          {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                        </span>
                        <span className="text-eas-blue font-black uppercase tracking-wider text-[10px]">Toggle</span>
                      </button>
                    </div>

                    {/* Security Block (Change Password) */}
                    {!isGoogleUser && (
                      <div className="bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 space-y-3">
                        <button
                          type="button"
                          onClick={() => setShowPasswordChange(!showPasswordChange)}
                          className="w-full flex items-center justify-between text-left focus:outline-none"
                        >
                          <span className="flex items-center gap-2">
                            <Lock className="text-red-500" size={15} />
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Change Account Password</span>
                          </span>
                          <span className="text-eas-blue text-[10px] font-black uppercase tracking-widest">
                            {showPasswordChange ? 'Collapse' : 'Expand'}
                          </span>
                        </button>

                        <AnimatePresence>
                          {showPasswordChange && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pt-4 space-y-4 border-t border-slate-100 dark:border-slate-800/60"
                            >
                              <div className="input-group">
                                <label className="text-[10px] font-black text-slate-400 tracking-wider">Current Password</label>
                                <div className="input-wrapper mt-1">
                                  <Lock className="input-icon" size={18} />
                                  <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={passwordForm.oldPassword}
                                    onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                                    className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="input-group">
                                  <label className="text-[10px] font-black text-slate-400 tracking-wider">New Password</label>
                                  <div className="input-wrapper mt-1">
                                    <Lock className="input-icon" size={18} />
                                    <input 
                                      type="password" 
                                      placeholder="••••••••" 
                                      value={passwordForm.newPassword}
                                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                      className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                                <div className="input-group">
                                  <label className="text-[10px] font-black text-slate-400 tracking-wider">Confirm New Password</label>
                                  <div className="input-wrapper mt-1">
                                    <Lock className="input-icon" size={18} />
                                    <input 
                                      type="password" 
                                      placeholder="••••••••" 
                                      value={passwordForm.confirmNewPassword}
                                      onChange={(e) => setPasswordForm({...passwordForm, confirmNewPassword: e.target.value})}
                                      className="dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={handlePasswordChange}
                                className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow cursor-pointer w-full text-center"
                              >
                                Update Security Password
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {isGoogleUser && (
                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-4 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 size={16} />
                          Google Account Authentication Active
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Secure</span>
                      </div>
                    )}

                    <button 
                      onClick={handleSaveSettings}
                      className="w-full py-4 rounded-[2rem] bg-eas-blue hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Save size={16} /> Save Changes
                    </button>
                  </div>
                )}
              </div>
              
              <div className="auth-footer-text dark:text-slate-500" style={{ marginTop: '2rem', opacity: 0.7 }}>
                {t('premium_experience_by') || 'Premium Experience by'} <strong>SWEETO-HUB</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-body dark:bg-slate-950 transition-colors duration-500">
      <span className="candy-decoration">⚡</span>
      <span className="candy-decoration">💻</span>
      <span className="candy-decoration">✨</span>
      <span className="candy-decoration">🔋</span>
      <span className="candy-decoration">🎧</span>

      <div className="main-container" style={{ maxWidth: currentTab === 'track' ? '920px' : '500px', transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        <div className="auth-card dark:bg-slate-900/60 dark:border-slate-800 backdrop-blur-xl">
          <div className="card-content">
            <div className="brand-section">
              <div className="brand-icon">⚡</div>
              <h1 className="brand-name">SWEETO-HUB</h1>
              <p className="brand-tagline">{t('powering_digital_life') || 'Powering Your Digital Life'}</p>
            </div>

            <div className="tab-switcher bg-slate-100/80 dark:bg-slate-950/50 p-1 border-slate-200/50 dark:border-slate-800 rounded-2xl mb-8">
              <button 
                className={`tab-btn text-xs font-black uppercase tracking-widest ${currentTab === 'login' ? 'active' : ''}`} 
                onClick={() => switchTab('login')}
              >
                {t('login') || 'Login'}
              </button>
              <button 
                className={`tab-btn text-xs font-black uppercase tracking-widest ${currentTab === 'signup' ? 'active' : ''}`} 
                onClick={() => switchTab('signup')}
              >
                {t('sign_up') || 'Sign Up'}
              </button>
              <button 
                className={`tab-btn text-xs font-black uppercase tracking-widest flex items-center gap-1.5 ${currentTab === 'track' ? 'active' : ''}`} 
                onClick={() => switchTab('track')}
              >
                <Truck size={14} /> {t('track') || 'Track'}
              </button>
            </div>

            <div className="form-container">
              {currentTab === 'login' && (
                <div className="form-panel active">
                  <form onSubmit={handleLogin} noValidate>
                    <div className="input-group">
                      <label>{t('email_address') || 'Email Address'}</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input 
                          type="email" 
                          placeholder={t('email_placeholder') || "you@example.com"} 
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.loginEmail ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.loginEmail}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('password') || 'Password'}</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPassword.login ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.loginPassword ? 'input-error' : ''}`}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('login')}>
                          <i className={`fas ${showPassword.login ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.loginPassword}</div>
                    </div>
                    <div className="options-row">
                      <label className="remember-me dark:text-slate-400">
                        <input 
                          type="checkbox" 
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                        />
                        <span className="custom-checkbox dark:border-slate-700"><i className="fas fa-check"></i></span>
                        {t('remember_me') || 'Remember me'}
                      </label>
                      <a className="forgot-link" onClick={() => showToast('Reset link sent!', 'success')}>{t('forgot_password') || 'Forgot Password?'}</a>
                    </div>
                    <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                      <span className="btn-text">{t('login_account') || 'Login to Your Account'}</span>
                      <span className="spinner"></span>
                    </button>
                  </form>
                </div>
              )}

              {currentTab === 'signup' && (
                <div className="form-panel active">
                  <form onSubmit={handleSignup} noValidate>
                    <div className="input-group">
                      <label>{t('full_name') || 'Full Name'}</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input 
                          type="text" 
                          placeholder={t('name_placeholder') || "Jane Doe"} 
                          value={signupData.name}
                          onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupName ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.signupName}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('email_address') || 'Email Address'}</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input 
                          type="email" 
                          placeholder={t('email_placeholder') || "you@example.com"} 
                          value={signupData.email}
                          onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupEmail ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.signupEmail}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('phone_number') || 'Phone Number'}</label>
                      <div className="phone-row">
                        <select 
                          value={signupData.countryCode}
                          onChange={(e) => setSignupData({...signupData, countryCode: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupPhone ? 'input-error' : ''}`}
                        >
                          <option value="">{t('select_code') || 'Select code'}</option>
                          {africanCountries.map(c => (
                            <option key={c.name} value={c.code}>{c.code} {c.name}</option>
                          ))}
                        </select>
                        <input 
                          type="tel" 
                          placeholder="Phone number" 
                          value={signupData.phone}
                          onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupPhone ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.signupPhone}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('password') || 'Password'}</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPassword.signup ? 'text' : 'password'} 
                          placeholder={t('min_8_chars') || "Min. 8 characters"} 
                          value={signupData.password}
                          onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupPassword ? 'input-error' : ''}`}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('signup')}>
                          <i className={`fas ${showPassword.signup ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.signupPassword}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('confirm_password') || 'Confirm Password'}</label>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPassword.confirm ? 'text' : 'password'} 
                          placeholder={t('re_enter_password') || "Re-enter password"} 
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          className={`dark:bg-slate-950 dark:border-slate-800 dark:text-white ${errors.signupConfirmPassword ? 'input-error' : ''}`}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('confirm')}>
                          <i className={`fas ${showPassword.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.signupConfirmPassword}</div>
                    </div>
                    <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                      <span className="btn-text">{t('create_account') || 'Create Your Account'}</span>
                      <span className="spinner"></span>
                    </button>
                  </form>
                </div>
              )}

              {currentTab === 'track' && (
                <div className="form-panel active w-full">
                  <OrdersHistoryContent />
                </div>
              )}
            </div>

            {currentTab !== 'track' && (
              <>
                <div className="w-full flex justify-center items-center min-h-[46px] my-2">
                  <div id="google-button-official" className="w-full flex justify-center"></div>
                </div>

                {!googleLoaded && (
                  <button className="btn-google" onClick={handleGoogleDemoFallback}>
                    <svg className="google-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t('continue_google') || 'Continue with Google'}
                  </button>
                )}

                <p className="auth-footer-text">
                  {t('agree_terms') || "By continuing, you agree to SWEETO-HUB's"}
                  <a href="#">{t('terms') || 'Terms'}</a> &
                  <a href="#">{t('privacy_policy') || 'Privacy Policy'}</a>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
