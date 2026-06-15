import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Bell,
  Camera,
  CreditCard,
  Truck,
  MessageSquare,
  RotateCcw,
  Clock,
  Tag,
  Store
} from 'lucide-react';
import './AuthPage.css';
import { compressImage } from '../utils/imageCompressor';
import { uploadToStorage } from '../utils/storageHelper';

const CoteDivoireFlag = () => (
  <svg width="20" height="20" viewBox="0 0 3 3" xmlns="http://www.w3.org/2000/svg" className="rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.15)] flex-shrink-0">
    <rect width="1" height="3" fill="#F77F00"/>
    <rect x="1" width="1" height="3" fill="#FFFFFF"/>
    <rect x="2" width="1" height="3" fill="#009E60"/>
  </svg>
);

const AuthPage = ({ initialTab }) => {
  const navigate = useNavigate();
  const { showToast, settings } = useStore();
  const { t } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  
  const [currentTab, setCurrentTab] = useState(initialTab || 'login');
  const [showAuthForm, setShowAuthForm] = useState(initialTab === 'login' || initialTab === 'signup');
  const [showPassword, setShowPassword] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);
  const signupAvatarInputRef = useRef(null);


  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: false });
  const [signupData, setSignupData] = useState({ 
    name: '', 
    email: '', 
    countryCode: '', 
    phone: '', 
    password: '', 
    confirmPassword: '',
    avatarUrl: ''
  });

  const [shippingZones, setShippingZones] = useState([]);
  const [sessionUser, setSessionUser] = useState(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    countryCode: '',
    phone: '',
    address: '',
    city: '',
    avatarUrl: ''
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
        countryCode: session.phoneCountryCode || session.countryCode || '',
        phone: session.phoneNumber || session.phone || '',
        address: session.address || '',
        city: session.city || '',
        avatarUrl: session.avatarUrl || ''
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
    try {
      // 1. Try to fetch from Supabase first
      let user = null;
      try {
        const { data, error } = await supabase
          .from('customer_accounts')
          .select('*')
          .eq('email', email.toLowerCase());
        
        if (!error && data && data.length > 0) {
          const dbUser = data[0];
          user = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            phoneCountryCode: dbUser.phone_country_code,
            phoneNumber: dbUser.phone_number,
            password: dbUser.password,
            avatarUrl: dbUser.avatar_url,
            picture: dbUser.avatar_url,
            provider: dbUser.provider,
            address: dbUser.address,
            city: dbUser.city,
            preferences: dbUser.preferences,
            createdAt: dbUser.created_at
          };
        } else if (error && error.code !== 'PGRST205') {
          console.warn("Supabase query warning during login:", error);
        }
      } catch (dbErr) {
        console.warn("Failed to contact Supabase for login, will use local storage:", dbErr);
      }

      // 2. Fall back to local storage if user not found in Supabase
      if (!user) {
        const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
        user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }

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

      // Sync user to local sweetohub_users storage if not already there, for backwards compatibility
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      if (!users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
        users.push(user);
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
      }

      showToast(`Welcome back, ${user.name}! ⚡`, 'success');
      setCurrentTab('overview');
    } catch (err) {
      console.error("Login failed:", err);
      showToast("Authentication service error.", "error");
    } finally {
      setLoading(false);
    }
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

    setLoading(true);
    try {
      // 1. Check if email already registered in Supabase
      let existsInSupabase = false;
      try {
        const { data, error } = await supabase
          .from('customer_accounts')
          .select('id')
          .eq('email', email.toLowerCase());
        
        if (!error && data && data.length > 0) {
          existsInSupabase = true;
        }
      } catch (dbErr) {
        console.warn("Could not check email existence in Supabase:", dbErr);
      }

      // 2. Check in local storage
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      const existsLocally = users.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (existsInSupabase || existsLocally) {
        setErrors({ signupEmail: 'Email already registered.' });
        showToast('Email already exists. Please log in.', 'error');
        setLoading(false);
        return;
      }

      const newUser = {
        id: 'user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        phoneCountryCode: countryCode,
        phoneNumber: phone.replace(/\s/g, ''),
        password,
        avatarUrl: signupData.avatarUrl || '',
        createdAt: new Date().toISOString(),
        provider: 'email'
      };

      // 3. Try to save to Supabase
      try {
        const { error } = await supabase
          .from('customer_accounts')
          .insert([{
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone_country_code: newUser.phoneCountryCode,
            phone_number: newUser.phoneNumber,
            password: newUser.password,
            avatar_url: newUser.avatarUrl,
            provider: newUser.provider,
            created_at: newUser.createdAt
          }]);
        
        if (error && error.code !== 'PGRST205') {
          console.error("Failed to insert account in Supabase:", error);
        }
      } catch (dbInsertErr) {
        console.warn("Could not write account to Supabase, continuing with local fallback:", dbInsertErr);
      }

      // 4. Always save to local storage for offline redundancy/fallback
      users.push(newUser);
      localStorage.setItem('sweetohub_users', JSON.stringify(users));

      // 5. Create local session
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem('sweetohub_session', JSON.stringify(safeUser));
      setSessionUser(safeUser);

      showToast(`Welcome to SWEETO-HUB, ${name}! ⚡`, 'success');
      setCurrentTab('overview');
    } catch (err) {
      console.error("Sign up failed:", err);
      showToast("Registration service error.", "error");
    } finally {
      setLoading(false);
    }
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
        setGoogleLoaded(true);
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

  useEffect(() => {
    if (googleLoaded && window.google?.accounts?.id) {
      const placeholder = document.getElementById('google-button-official');
      if (placeholder) {
        placeholder.innerHTML = '';
        window.google.accounts.id.renderButton(
          placeholder,
          { 
            theme: 'outline', 
            size: 'large', 
            width: '320', // Fit perfectly on mobile and web viewports
            text: 'continue_with',
            shape: 'pill',
            logo_alignment: 'left'
          }
        );
      }
    }
  }, [googleLoaded, showAuthForm, currentTab]);

  const handleGoogleCredentialResponse = async (response) => {
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
        email: payload.email.toLowerCase(),
        picture: payload.picture || '',
        provider: 'google',
        createdAt: new Date().toISOString()
      };

      // 1. Sync with Supabase
      let existing = null;
      try {
        const { data, error } = await supabase
          .from('customer_accounts')
          .select('*')
          .eq('email', googleUser.email);
        
        if (!error && data && data.length > 0) {
          existing = {
            id: data[0].id,
            name: data[0].name,
            email: data[0].email,
            phoneCountryCode: data[0].phone_country_code,
            phoneNumber: data[0].phone_number,
            avatarUrl: data[0].avatar_url,
            picture: data[0].avatar_url,
            provider: data[0].provider,
            address: data[0].address,
            city: data[0].city,
            preferences: data[0].preferences,
            createdAt: data[0].created_at
          };
          
          // Update details in case name/picture changed on Google
          await supabase
            .from('customer_accounts')
            .update({
              name: googleUser.name,
              avatar_url: googleUser.picture
            })
            .eq('email', googleUser.email);
        } else if (!error || error.code === 'PGRST205') {
          // Insert new Google user to Supabase
          const { error: insErr } = await supabase
            .from('customer_accounts')
            .insert([{
              id: googleUser.id,
              name: googleUser.name,
              email: googleUser.email,
              avatar_url: googleUser.picture,
              provider: 'google',
              created_at: googleUser.createdAt
            }]);
          if (insErr && insErr.code !== 'PGRST205') console.error("Google user Supabase save error:", insErr);
        }
      } catch (dbErr) {
        console.warn("Supabase Google Auth sync failed:", dbErr);
      }

      // 2. Also save to local sweetohub_users list for safety
      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let localUser = users.find(u => u.email.toLowerCase() === googleUser.email);
      if (!localUser) {
        localUser = { ...googleUser, avatarUrl: googleUser.picture, password: null };
        users.push(localUser);
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
      } else {
        localUser.name = googleUser.name;
        localUser.avatarUrl = googleUser.picture;
        localUser.picture = googleUser.picture;
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
      }

      const activeUser = existing || localUser;
      localStorage.setItem('sweetohub_session', JSON.stringify(activeUser));
      setSessionUser(activeUser);
      showToast(`Welcome, ${activeUser.name}! ⚡`, 'success');
      setCurrentTab('overview');
    }
  };

  const handleGoogleDemoFallback = () => {
    showToast('🔷 Demo Mode: Simulating Google Login...', 'info');
    setTimeout(async () => {
      const demoUser = {
        id: 'google_demo_' + Date.now(),
        name: 'Sweeto User',
        email: 'sweeto.user@gmail.com',
        provider: 'google',
        createdAt: new Date().toISOString()
      };
      
      // Try Supabase sync
      let existing = null;
      try {
        const { data, error } = await supabase
          .from('customer_accounts')
          .select('*')
          .eq('email', demoUser.email);
        if (!error && data && data.length > 0) {
          existing = {
            id: data[0].id,
            name: data[0].name,
            email: data[0].email,
            phoneCountryCode: data[0].phone_country_code,
            phoneNumber: data[0].phone_number,
            avatarUrl: data[0].avatar_url,
            picture: data[0].avatar_url,
            provider: data[0].provider,
            address: data[0].address,
            city: data[0].city,
            preferences: data[0].preferences,
            createdAt: data[0].created_at
          };
        } else if (!error || error.code === 'PGRST205') {
          await supabase.from('customer_accounts').insert([{
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            provider: 'google',
            created_at: demoUser.createdAt
          }]);
        }
      } catch (e) {}

      const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
      let localUser = users.find(u => u.email === demoUser.email);
      if (!localUser) {
        localUser = { ...demoUser, password: null };
        users.push(localUser);
        localStorage.setItem('sweetohub_users', JSON.stringify(users));
      }

      const activeUser = existing || localUser;
      localStorage.setItem('sweetohub_session', JSON.stringify(activeUser));
      setSessionUser(activeUser);
      showToast(`Welcome, ${activeUser.name}! (Demo) ⚡`, 'success');
      setCurrentTab('overview');
    }, 1000);
  };

  const fetchStats = async (user) => {
    if (!user) return;
    const savedWishlist = JSON.parse(localStorage.getItem('sweeto_wishlist') || '[]');
    const wishlistCount = savedWishlist.length;

    let ordersCount = 0;
    const queries = [];
    
    if (user.email) {
      queries.push(`customer_contact.ilike.%| ${user.email.toLowerCase()} |%`);
    }
    if (user.id) {
      queries.push(`customer_contact.ilike.%| ${user.id}%`);
    }

    const phoneVal = user.phoneNumber || user.phone;
    const cleanPhone = phoneVal ? phoneVal.replace(/\D/g, '') : '';
    if (cleanPhone && cleanPhone.length >= 8) {
      queries.push(`customer_contact.ilike.${cleanPhone} |%`);
      queries.push(`customer_contact.ilike.+${cleanPhone} |%`);
      queries.push(`customer_contact.ilike.${phoneVal} |%`);
      queries.push(`customer_phone.eq.${phoneVal}`);
      queries.push(`customer_phone.eq.${cleanPhone}`);
    }

    if (queries.length > 0) {
      try {
        const orQuery = queries.join(',');
        const { count, error } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .or(orQuery);
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please select a JPG, PNG, or WEBP image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image file is too large (max 5MB).', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    showToast('Uploading profile photo... ⏳', 'info');

    try {
      const compressedBlob = await compressImage(file, 400, 0.85);
      const url = await uploadToStorage(compressedBlob, 'profiles');
      
      if (url) {
        const updatedUser = {
          ...sessionUser,
          avatarUrl: url,
          picture: url
        };
        
        localStorage.setItem('sweetohub_session', JSON.stringify(updatedUser));
        setSessionUser(updatedUser);

        setSettingsForm(prev => ({
          ...prev,
          avatarUrl: url
        }));

        // 1. Sync with Supabase
        try {
          const { error } = await supabase
            .from('customer_accounts')
            .update({ avatar_url: url })
            .eq('email', sessionUser.email.toLowerCase());
          if (error && error.code !== 'PGRST205') console.error("Failed to update avatar in Supabase:", error);
        } catch (dbErr) {
          console.warn("Supabase avatar update failed:", dbErr);
        }

        // 2. Sync locally
        const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
        const updatedUsers = users.map(u => 
          u.email.toLowerCase() === sessionUser.email.toLowerCase() ? { ...u, avatarUrl: url, picture: url } : u
        );
        localStorage.setItem('sweetohub_users', JSON.stringify(updatedUsers));

        showToast('Profile photo updated successfully! 📸✨', 'success');
      }
    } catch (err) {
      console.error('Avatar upload failed:', err);
      showToast('Failed to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSignupAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Please select a JPG, PNG, or WEBP image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1025) {
      showToast('Image file is too large (max 5MB).', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    showToast('Uploading profile photo... ⏳', 'info');

    try {
      const compressedBlob = await compressImage(file, 400, 0.85);
      const url = await uploadToStorage(compressedBlob, 'profiles');
      
      if (url) {
        setSignupData(prev => ({
          ...prev,
          avatarUrl: url
        }));
        showToast('Profile photo uploaded successfully! 📸✨', 'success');
      }
    } catch (err) {
      console.error('Signup avatar upload failed:', err);
      showToast('Failed to upload profile photo.', 'error');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!settingsForm.name.trim()) {
      showToast('Name cannot be empty.', 'error');
      return;
    }

    const updatedUser = {
      ...sessionUser,
      name: settingsForm.name,
      phoneCountryCode: settingsForm.countryCode,
      phoneNumber: settingsForm.phone,
      address: settingsForm.address,
      city: settingsForm.city,
      preferences: preferences,
      avatarUrl: settingsForm.avatarUrl
    };

    localStorage.setItem('sweetohub_session', JSON.stringify(updatedUser));
    setSessionUser(updatedUser);

    // 1. Sync with Supabase
    try {
      const { error } = await supabase
        .from('customer_accounts')
        .update({
          name: settingsForm.name,
          phone_country_code: settingsForm.countryCode,
          phone_number: settingsForm.phone,
          address: settingsForm.address,
          city: settingsForm.city,
          preferences: preferences,
          avatar_url: settingsForm.avatarUrl
        })
        .eq('email', sessionUser.email.toLowerCase());
      if (error && error.code !== 'PGRST205') console.error("Failed to update settings in Supabase:", error);
    } catch (dbErr) {
      console.warn("Supabase settings update failed:", dbErr);
    }

    // 2. Sync locally
    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    const updatedUsers = users.map(u => u.email.toLowerCase() === sessionUser.email.toLowerCase() ? { ...u, ...updatedUser } : u);
    localStorage.setItem('sweetohub_users', JSON.stringify(updatedUsers));

    showToast('Profile settings saved! ✨', 'success');
  };

  const handlePasswordChange = async (e) => {
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

    // Check if user is in localStorage or Supabase
    const users = JSON.parse(localStorage.getItem('sweetohub_users') || '[]');
    const userIndex = users.findIndex(u => u.email.toLowerCase() === sessionUser.email.toLowerCase());
    let user = users[userIndex];
    
    // Try Supabase fetch if not found locally
    if (!user) {
      try {
        const { data, error } = await supabase
          .from('customer_accounts')
          .select('password')
          .eq('email', sessionUser.email.toLowerCase());
        if (!error && data && data.length > 0) {
          user = data[0];
        }
      } catch (e) {}
    }

    if (!user) {
      showToast('User account not found.', 'error');
      return;
    }

    if (user.password && user.password !== oldPassword) {
      showToast('Incorrect current password.', 'error');
      return;
    }

    // 1. Sync with Supabase
    try {
      const { error } = await supabase
        .from('customer_accounts')
        .update({ password: newPassword })
        .eq('email', sessionUser.email.toLowerCase());
      if (error && error.code !== 'PGRST205') console.error("Failed to update password in Supabase:", error);
    } catch (dbErr) {
      console.warn("Supabase password update failed:", dbErr);
    }

    // 2. Sync locally
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('sweetohub_users', JSON.stringify(users));
    }

    const updatedSession = { ...sessionUser, password: newPassword };
    localStorage.setItem('sweetohub_session', JSON.stringify(updatedSession));
    setSessionUser(updatedSession);

    showToast('Password changed successfully! 🔒', 'success');
    setPasswordForm({ oldPassword: '', newPassword: '', confirmNewPassword: '' });
    setShowPasswordChange(false);
  };

  const { lang, changeLanguage } = useLanguage();
  const isGoogleUser = sessionUser?.provider === 'google';

  if (sessionUser && currentTab === 'overview') {
    return (
      <div className="auth-body dark:bg-eas-dark transition-colors duration-500 pb-20">
        <button 
          onClick={() => navigate('/')} 
          className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white dark:bg-eas-dark/60 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-eas-light dark:hover:bg-white/5 transition-all z-20 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="main-container max-w-[480px] w-full">
          {/* Header Row (Signed In): Avatar, Name, and Icons */}
          <div className="flex justify-between items-center px-4 py-4 bg-white dark:bg-eas-dark/50 rounded-3xl mx-4 my-2 border border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300">
            <div className="flex items-center gap-3 pl-2">
              {/* Avatar with click upload handler */}
              <div 
                className="profile-avatar-wrapper group cursor-pointer relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-slate-50 flex-shrink-0 transition-all duration-300"
                onClick={() => avatarInputRef.current?.click()}
              >
                {sessionUser.avatarUrl || sessionUser.picture ? (
                  <img 
                    src={sessionUser.avatarUrl || sessionUser.picture} 
                    alt={sessionUser.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-sm bg-gradient-to-r from-eas-blue to-eas-blue/80">
                    {sessionUser.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Hover edit overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Camera size={14} className="text-white" />
                </div>
                
                <input 
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                />
              </div>

              <div className="text-left flex flex-col justify-center">
                <span className="font-bold text-slate-800 dark:text-white leading-tight transition-all duration-300 text-[17px]">
                  {sessionUser.name || 'SweeTo user'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[150px] mt-0.5">
                  {sessionUser.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 pr-2">
              <button onClick={() => showToast("Language selection coming soon!", "info")} className="flex items-center justify-center hover:scale-105 transition-transform">
                <CoteDivoireFlag />
              </button>
              <button 
                onClick={() => setCurrentTab('settings')} 
                className="text-slate-700 dark:text-slate-300 hover:text-eas-blue transition-colors"
              >
                <SettingsIcon size={20} />
              </button>
              <button 
                onClick={() => setCurrentTab('orders')} 
                className="text-slate-700 dark:text-slate-300 hover:text-eas-blue transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
              </button>
            </div>
          </div>

          {/* My Orders Section */}
          <div className="mx-4 my-4 p-4 rounded-3xl bg-white dark:bg-eas-dark/50 border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">My orders</h3>
              <button 
                onClick={() => setCurrentTab('orders')}
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-eas-blue transition-colors flex items-center gap-0.5"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-1 text-center">
              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <CreditCard size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To pay</span>
              </button>

              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Package size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To ship</span>
              </button>

              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Truck size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Shipped</span>
              </button>

              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <MessageSquare size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To review</span>
              </button>

              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <RotateCcw size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Returns</span>
              </button>
            </div>
          </div>

          {/* Options Section */}
          <div className="mx-4 my-4 p-4 rounded-3xl bg-white dark:bg-eas-dark/50 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="grid grid-cols-4 gap-1 text-center">
              <button 
                onClick={() => setCurrentTab('orders')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Clock size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">History</span>
              </button>

              <button 
                onClick={() => navigate('/wishlist')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Heart size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Wishlist</span>
              </button>

              <button 
                onClick={() => showToast("No coupons available right now.", "info")}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Tag size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Coupons</span>
              </button>

              <button 
                onClick={() => showToast("You are not following any stores yet.", "info")}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Store size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Followed stores</span>
              </button>
            </div>
          </div>



          {/* Secure Sign Out */}
          <div className="px-4 pt-4 pb-8">
            <button 
              className="btn-google logout-btn-adorable w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest dark:bg-red-950/10 dark:border-red-900/20" 
              onClick={handleLogout}
            >
              <LogOut size={16} /> {t('secure_sign_out') || 'Secure Sign Out'}
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-2">
            Premium Experience by SWEETO HUB
          </div>
        </div>
      </div>
    );
  }

  if (sessionUser && (currentTab === 'orders' || currentTab === 'settings')) {
    return (
      <div className="auth-body dark:bg-eas-dark transition-colors duration-500 pb-20">
        <button 
          onClick={() => setCurrentTab('overview')} 
          className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white dark:bg-eas-dark/60 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-eas-light dark:hover:bg-white/5 transition-all z-20 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="candy-decoration">⚡</span>
        <span className="candy-decoration">💻</span>
        <span className="candy-decoration">✨</span>
        <span className="candy-decoration" style={{ top: '20%', left: '15%' }}>💖</span>
        <span className="candy-decoration" style={{ bottom: '20%', right: '15%' }}>🚀</span>
        
        <div className="main-container" style={{ maxWidth: currentTab === 'orders' ? '920px' : '560px', transition: 'max-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="auth-card dark:bg-eas-dark/60 dark:border-white/5 backdrop-blur-xl" style={{ width: '100%' }}>
            <div className="card-content">
              {/* Back to overview Link */}
              <div 
                className="flex items-center gap-2 mb-6 cursor-pointer text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors" 
                onClick={() => setCurrentTab('overview')}
              >
                <ArrowLeft size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile Dashboard</span>
              </div>

              {/* Content Panels */}
              <div className="profile-dashboard mt-0">
                {currentTab === 'orders' && (
                  <div className="animate-fade-in w-full overflow-hidden">
                    <OrdersHistoryContent isProfileTab={true} />
                  </div>
                )}

                {currentTab === 'settings' && (
                  <div className="space-y-6 text-left animate-fade-in">
                    
                     {/* Profile Details Block */}
                    <div className="bg-white/40 dark:bg-eas-dark/30 border border-slate-100 dark:border-white/5 rounded-3xl p-5 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2">
                        <User className="text-eas-blue" size={15} />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white">Profile Details</span>
                      </div>
                      
                      <div className="input-group">
                        <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Profile Photo</label>
                        <div className="flex items-center gap-4 mt-2">
                          {isUploadingAvatar ? (
                            <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center justify-center bg-eas-light dark:bg-eas-dark">
                              <span className="w-5 h-5 border-2 border-eas-blue border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (settingsForm.avatarUrl || sessionUser?.picture) ? (
                            <img 
                              src={settingsForm.avatarUrl || sessionUser?.picture} 
                              alt="Avatar Preview" 
                              className="w-16 h-16 rounded-2xl object-cover border border-slate-200 dark:border-white/5"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-eas-blue to-eas-blue/80 flex items-center justify-center text-white font-black text-xl shadow-md">
                              {sessionUser?.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <input type="file" id="avatar-upload-settings" className="hidden" onChange={handleAvatarChange} />
                            <label 
                              htmlFor="avatar-upload-settings"
                              className="px-4 py-2.5 bg-eas-dark dark:bg-white/5 hover:bg-eas-dark/80 text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all text-center cursor-pointer shadow-sm"
                            >
                              Upload New Photo
                            </label>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">JPG, PNG or WEBP. Max 5MB.</span>
                          </div>
                        </div>
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
                            className="dark:bg-eas-dark dark:border-white/5 dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="input-group">
                        <label className="text-xs font-black text-slate-400 tracking-wider dark:text-slate-500">Phone Number</label>
                        <div className="phone-row mt-1 flex gap-2">
                          <select 
                            value={settingsForm.countryCode}
                            onChange={(e) => setSettingsForm({...settingsForm, countryCode: e.target.value})}
                            className="dark:bg-eas-dark dark:border-white/5 dark:text-white"
                            style={{ width: '130px', flexShrink: 0 }}
                          >
                            <option value="">Code</option>
                            {africanCountries.map(c => (
                              <option key={c.name} value={c.code}>{c.code} {c.name}</option>
                            ))}
                          </select>
                          <input 
                            type="tel" 
                            inputMode="numeric"
                            placeholder="Phone number" 
                            value={settingsForm.phone}
                            onChange={(e) => setSettingsForm({...settingsForm, phone: e.target.value})}
                            className="dark:bg-eas-dark dark:border-white/5 dark:text-white flex-1"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Security Block (Change Password) */}
                    {!isGoogleUser && (
                      <div className="bg-white/40 dark:bg-eas-dark/30 border border-slate-100 dark:border-white/5 rounded-3xl p-5 space-y-3">
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
                              className="overflow-hidden pt-4 space-y-4 border-t border-slate-100 dark:border-white/5"
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
                                    className="dark:bg-eas-dark dark:border-white/5 dark:text-white"
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
                                      className="dark:bg-eas-dark dark:border-white/5 dark:text-white"
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
                                      className="dark:bg-eas-dark dark:border-white/5 dark:text-white"
                                    />
                                  </div>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={handlePasswordChange}
                                className="bg-eas-dark hover:bg-eas-dark/80 dark:bg-white dark:hover:bg-eas-light text-white dark:text-eas-dark font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all shadow cursor-pointer w-full text-center"
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
                      className="w-full py-4 rounded-[2rem] bg-eas-blue hover:bg-[#0043d0] text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
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

  if (!showAuthForm) {
    return (
      <div className="auth-body dark:bg-eas-dark transition-colors duration-500 pb-20">
        <div className="main-container max-w-[480px]">
          {/* Header Row: Sign in/Register and icons */}
          <div className="flex justify-between items-center px-4 py-4 bg-white dark:bg-eas-dark/50 rounded-3xl mx-4 my-2 border border-slate-100 dark:border-white/5 shadow-sm transition-all duration-300">
            <span 
              onClick={() => { 
                switchTab('login');
                setShowAuthForm(true); 
              }}
              className="font-bold text-slate-800 dark:text-white cursor-pointer hover:text-eas-blue transition-all pl-2 text-[17px]"
            >
              Sign in/Register
            </span>
            <div className="flex items-center gap-4 pr-2">
              <button onClick={() => showToast("Language selection coming soon!", "info")} className="flex items-center justify-center hover:scale-105 transition-transform">
                <CoteDivoireFlag />
              </button>
              <button 
                onClick={() => { 
                  showToast("Settings are only available for signed-in users.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }} 
                className="text-slate-700 dark:text-slate-300 hover:text-eas-blue transition-colors"
              >
                <SettingsIcon size={20} />
              </button>
              <button 
                onClick={() => { 
                  showToast("Notifications are only available for signed-in users.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }} 
                className="text-slate-700 dark:text-slate-300 hover:text-eas-blue transition-colors relative"
              >
                <Bell size={20} />
              </button>
            </div>
          </div>

          {/* My Orders Section */}
          <div className="mx-4 my-4 p-4 rounded-3xl bg-white dark:bg-eas-dark/50 border border-slate-100 dark:border-white/5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 dark:text-white">My orders</h3>
              <button 
                onClick={() => { 
                  showToast("Please sign in to view your orders.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 hover:text-eas-blue transition-colors flex items-center gap-0.5"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-5 gap-1 text-center">
              <button 
                onClick={() => { 
                  showToast("Please sign in to view payments.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <CreditCard size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To pay</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to view shipments.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Package size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To ship</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to view tracking.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Truck size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Shipped</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to write reviews.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <MessageSquare size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">To review</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to request returns.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <RotateCcw size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Returns</span>
              </button>
            </div>
          </div>

          {/* Options Section */}
          <div className="mx-4 my-4 p-4 rounded-3xl bg-white dark:bg-eas-dark/50 border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="grid grid-cols-4 gap-1 text-center">
              <button 
                onClick={() => { 
                  showToast("Please sign in to view history.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Clock size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">History</span>
              </button>

              <button 
                onClick={() => navigate('/wishlist')}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Heart size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Wishlist</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to view coupons.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Tag size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Coupons</span>
              </button>

              <button 
                onClick={() => { 
                  showToast("Please sign in to view followed stores.", "info"); 
                  switchTab('login');
                  setShowAuthForm(true); 
                }}
                className="flex flex-col items-center gap-2 group py-1"
              >
                <Store size={22} className="text-slate-700 dark:text-slate-300 group-hover:text-eas-blue transition-colors" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">Followed stores</span>
              </button>
            </div>
          </div>



          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-8">
            Premium Experience by SWEETO HUB
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-split-wrapper dark:bg-eas-dark transition-colors duration-500">
      {/* Left side: Premium Branding Column (Hidden on mobile/tablet) */}
      <div className="auth-brand-column bg-gradient-to-br from-blue-950 via-eas-blue to-blue-500 border-r border-eas-blue/20 relative overflow-hidden hidden lg:flex flex-col justify-between p-16">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none" />

        {/* Top brand header logo */}
        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-eas-blue font-black text-lg shadow-[0_8px_20px_rgba(0,82,255,0.2)]">
            ⚡
          </div>
          <span className="font-black text-xl italic text-white tracking-tighter">SWEETO<span className="text-blue-200 font-bold not-italic">HUB</span></span>
        </div>

        {/* Center premium visual showcase */}
        <div className="relative z-10 my-auto text-left space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white">Premium Local Commerce</span>
          </div>

          <h1 className="text-5xl font-black text-white leading-tight tracking-tighter uppercase italic">
            Your Premium <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200">Digital Gateway</span>
          </h1>

          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            Gain access to high-end electronics, elite tech gadgets, and seamless local delivery diagnostics built for power users.
          </p>

          {/* Bullet features list */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm">✓</div>
              <span className="text-xs font-bold text-white">Verified Authentic Premium Products Only</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm">✓</div>
              <span className="text-xs font-bold text-white">High-Performance Custom Tech Diagnostics</span>
            </div>
            <div className="flex items-center gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-sm">✓</div>
              <span className="text-xs font-bold text-white">Express Regional Courier Handshake</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright/meta */}
        <div className="relative z-10 flex justify-between items-center text-[11px] text-blue-200 font-bold uppercase tracking-widest">
          <span>© {new Date().getFullYear()} SWEETO-HUB</span>
          <span>Security Guaranteed</span>
        </div>
      </div>

      {/* Right side: Auth Card Column */}
      <div className="auth-form-column flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-eas-light/50 via-white to-eas-light/30 dark:bg-eas-dark transition-colors duration-500">
        <button 
          onClick={() => setShowAuthForm(false)} 
          className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white dark:bg-eas-dark/60 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-eas-light dark:hover:bg-white/5 transition-all z-20 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        {/* Floating tech background decorations for mobile view */}
        <span className="candy-decoration lg:hidden">⚡</span>
        <span className="candy-decoration lg:hidden">💻</span>
        <span className="candy-decoration lg:hidden">✨</span>

        <div className="main-container max-w-[500px] w-full relative z-10">
          <div className="auth-card dark:bg-eas-dark/60 dark:border-white/5 backdrop-blur-xl">
            <div className="card-content">
              <div className="brand-section">
                <div className="brand-icon cursor-pointer mx-auto" onClick={() => navigate('/')}>⚡</div>
                <h1 className="brand-name">SWEETO-HUB</h1>
                <p className="brand-tagline">{t('powering_digital_life') || 'Powering Your Digital Life'}</p>
              </div>

              <div className="tab-switcher bg-eas-light/80 dark:bg-eas-dark/50 p-1 border-slate-200/50 dark:border-white/5 rounded-2xl mb-8">
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
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.loginEmail ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.loginEmail}</div>
                    </div>
                    <div className="input-group">
                      <div className="flex justify-between items-center">
                        <label>{t('password') || 'Password'}</label>
                        <button type="button" className="forgot-btn" onClick={() => switchTab('forgot')}>
                          {t('forgot_password') || 'Forgot Password?'}
                        </button>
                      </div>
                      <div className="input-wrapper">
                        <Lock className="input-icon" size={18} />
                        <input 
                          type={showPassword.login ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.loginPassword ? 'input-error' : ''}`}
                        />
                        <button type="button" className="toggle-password" onClick={() => togglePassword('login')}>
                          <i className={`fas ${showPassword.login ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                      <div className="error-message">{errors.loginPassword}</div>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <label className="remember-me">
                        <input 
                          type="checkbox" 
                          checked={loginData.rememberMe}
                          onChange={(e) => setLoginData({...loginData, rememberMe: e.target.checked})}
                        />
                        <span className="custom-checkbox">✓</span>
                        <span className="checkbox-label text-xs font-bold text-slate-600 dark:text-slate-400">{t('remember_me') || 'Remember Me'}</span>
                      </label>
                    </div>
                    <button type="submit" className={`btn-submit ${loading ? 'loading' : ''}`} disabled={loading}>
                      <span className="btn-text">{t('sign_in') || 'Sign In'}</span>
                      <span className="spinner"></span>
                    </button>
                  </form>
                </div>
              )}

              {currentTab === 'signup' && (
                <div className="form-panel active">
                  <form onSubmit={handleSignup} noValidate>
                    <div className="input-group flex flex-col items-center mb-6">
                      <label className="text-center w-full mb-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('profile_photo') || 'Profile Photo (Optional)'}</label>
                      <div 
                        onClick={() => signupAvatarInputRef.current?.click()}
                        className="relative group cursor-pointer w-24 h-24 rounded-3xl flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 hover:border-eas-blue transition-all overflow-hidden bg-eas-light dark:bg-eas-dark/40 shadow-sm"
                      >
                        {isUploadingAvatar ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <span className="w-5 h-5 border-2 border-eas-blue border-t-transparent rounded-full animate-spin" />
                            <span className="text-[8px] font-black uppercase text-slate-400">Uploading...</span>
                          </div>
                        ) : signupData.avatarUrl ? (
                          <>
                            <img 
                              src={signupData.avatarUrl} 
                              alt="Profile Preview" 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera size={16} className="text-white mb-0.5" />
                              <span className="text-[8px] text-white font-black uppercase tracking-wider">Change</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:text-eas-blue transition-colors">
                            <Camera size={22} className="mb-1" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Upload Photo</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file"
                        ref={signupAvatarInputRef}
                        onChange={handleSignupAvatarChange}
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp"
                      />
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 text-center">
                        JPG, PNG or WEBP. Max 5MB.
                      </span>
                    </div>

                    <div className="input-group">
                      <label>{t('full_name') || 'Full Name'}</label>
                      <div className="input-wrapper">
                        <User className="input-icon" size={18} />
                        <input 
                          type="text" 
                          placeholder={t('name_placeholder') || "e.g. Yao Kouassi"} 
                          value={signupData.name}
                          onChange={(e) => setSignupData({...signupData, name: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.signupName ? 'input-error' : ''}`}
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
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.signupEmail ? 'input-error' : ''}`}
                        />
                      </div>
                      <div className="error-message">{errors.signupEmail}</div>
                    </div>
                    <div className="input-group">
                      <label>{t('contact_phone') || 'Contact Phone (African country code)'}</label>
                      <div className="phone-row flex gap-2">
                        <select 
                          value={signupData.countryCode}
                          onChange={(e) => setSignupData({...signupData, countryCode: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.signupPhone ? 'input-error' : ''}`}
                        >
                          <option value="">Code</option>
                          {africanCountries.map(c => (
                            <option key={c.name} value={c.code}>{c.code} {c.name}</option>
                          ))}
                        </select>
                        <input 
                          type="tel" 
                          inputmode="numeric"
                          placeholder={t('phone_placeholder') || "e.g. 07070707"} 
                          value={signupData.phone}
                          onChange={(e) => setSignupData({...signupData, phone: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white flex-1 ${errors.signupPhone ? 'input-error' : ''}`}
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
                          placeholder="••••••••" 
                          value={signupData.password}
                          onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.signupPassword ? 'input-error' : ''}`}
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
                          placeholder="••••••••" 
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          className={`dark:bg-eas-dark dark:border-white/5 dark:text-white ${errors.signupConfirmPassword ? 'input-error' : ''}`}
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
            </div>

            <div className="w-full max-w-[320px] mx-auto min-h-[46px] my-3 flex justify-center items-center">
              {googleLoaded ? (
                <div 
                  id="google-button-official" 
                  className="w-full flex justify-center" 
                />
              ) : (
                <button 
                  type="button"
                  className="btn-google w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 dark:bg-white/5 rounded-full py-3 px-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleGoogleDemoFallback}
                >
                  <svg className="google-icon-svg w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-slate-800 dark:text-slate-200 font-black text-xs uppercase tracking-widest">{t('continue_google') || 'Continue with Google'}</span>
                </button>
              )}
            </div>

            <p className="auth-footer-text">
              {t('agree_terms') || "By continuing, you agree to SWEETO-HUB's"}
              <a href="#">{t('terms') || 'Terms'}</a> {' & '}
              <a href="#">{t('privacy_policy') || 'Privacy Policy'}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AuthPage;
