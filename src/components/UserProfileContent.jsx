import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Package, 
  MapPin, 
  CreditCard, 
  Settings, 
  LogOut, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Plus, 
  Heart, 
  ShieldCheck, 
  Bell, 
  Truck, 
  Trash2, 
  Lock, 
  Gift, 
  Star, 
  Check, 
  X, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Download, 
  Camera, 
  ShoppingBag, 
  ArrowRight,
  Sliders,
  AlertCircle,
  Upload,
  Smartphone,
  Laptop,
  Globe,
  Key,
  Copy,
  Search,
  Filter,
  Shield,
  ExternalLink,
  CheckCircle,
  LayoutDashboard,
  ArrowUpRight,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import OrdersHistoryContent from './OrdersHistoryContent';
import { useNavigate } from 'react-router-dom';

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
];

const UserProfileContent = ({ 
  sessionUser, 
  handleSaveSettings, 
  handleLogout, 
  onBack,
  initialTab = 'account'
}) => {
  const navigate = useNavigate();
  // Safe user defaults
  const user = {
    firstName: sessionUser?.name ? sessionUser.name.split(' ')[0] : '',
    lastName: sessionUser?.name ? sessionUser.name.split(' ').slice(1).join(' ') : '',
    name: sessionUser?.name || 'Customer',
    email: sessionUser?.email || '',
    phone: sessionUser?.phoneNumber || sessionUser?.phone || '',
    avatarType: sessionUser?.avatarUrl ? 'photo' : 'initials',
    avatarUrl: sessionUser?.avatarUrl || '',
    avatarBg: "bg-gradient-to-tr from-violet-600 to-indigo-600",
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
    bio: sessionUser?.bio || "No bio set yet.",
    dob: "Not specified",
    gender: "Not specified",
    memberSince: "2023",
    tier: "Gold VIP Member",
    points: 2450,
  };

  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sessions, setSessions] = useState([
    { id: 1, device: "Current Device", browser: "Web App", location: "Unknown", ip: "127.0.0.1", lastActive: "Active Now", current: true, icon: Laptop }
  ]);
  const [toast, setToast] = useState(null);

  // Profile Edit Mode Toggle State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [formData, setFormData] = useState({ ...user });

  // Order Details & Filters State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilterStatus, setOrderFilterStatus] = useState('All');

  // Avatar Image Upload Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState('upload'); // 'upload', 'presets', 'initials'
  const fileInputRef = useRef(null);

  // Add Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    title: "", name: user.name, street: "", city: "", state: "", zip: "", country: "United States", type: "Home", isDefault: false
  });

  // Add Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({
    cardHolder: "", cardNumber: "", expiry: "", cvv: "", type: "Visa", isDefault: false
  });

  // Password Update Form State
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirmPass: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    orderUpdates: sessionUser?.preferences?.smsAlerts ?? true,
    promotions: sessionUser?.preferences?.promoEmails ?? false,
    stockAlerts: false,
    securityAlerts: true,
    smsAlerts: sessionUser?.preferences?.smsAlerts ?? true
  });

  const loadRealOrders = async () => {
    try {
      if (!sessionUser) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const userIdentifier = (sessionUser?.id || '').toString().toLowerCase();
        const userEmail = (sessionUser?.email || '').toLowerCase();
        const userPhone = (sessionUser?.phoneNumber || sessionUser?.phone || '').replace(/\D/g, '');

        const userOrders = data.filter(order => {
          const contact = (order.customer_contact || '').toLowerCase();
          const phone = (order.customer_phone || '').replace(/\D/g, '');
          const matchId = userIdentifier && contact.includes(userIdentifier);
          const matchEmail = userEmail && contact.includes(userEmail);
          const matchPhone = userPhone && (contact.includes(userPhone) || (phone && phone === userPhone));
          return matchId || matchEmail || matchPhone;
        });

        const formattedOrders = userOrders.map(o => {
          let items = [];
          try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch (e) {}
          return {
            id: o.id,
            date: new Date(o.created_at).toLocaleDateString(),
            total: o.total_amount || o.total || 0,
            status: o.status === 'completed' || o.status === 'delivered' ? 'Delivered' : (o.status === 'cancelled' ? 'Cancelled' : 'In Transit'),
            itemsCount: items.length,
            trackingCode: 'TRK-' + (o.id.toString().substring(0,8).toUpperCase()),
            carrier: 'Standard Delivery',
            estimatedDelivery: 'Processing',
            items: items.map(i => ({ name: i.name || 'Item', color: '', price: i.price || 0, qty: i.quantity || 1, image: i.image || i.imageUrl || '' })),
            timeline: [
              { stage: "Order Confirmed", date: new Date(o.created_at).toLocaleString(), completed: true },
              { stage: "Package Processing", date: "Pending", completed: o.status !== 'pending' },
              { stage: "In Transit with Carrier", date: "Pending", completed: o.status === 'completed' },
              { stage: "Delivered to Customer", date: "Pending", completed: o.status === 'completed' }
            ]
          };
        });
        setOrders(formattedOrders);
      }
    } catch(err) {
      console.log('err loading orders', err);
    }
  };

  const loadAddresses = () => {
    if (sessionUser?.address && sessionUser?.city) {
      setAddresses([
        {
          id: 1,
          title: "Primary Residence",
          name: sessionUser.name,
          street: sessionUser.address,
          city: sessionUser.city,
          state: "",
          zip: "",
          country: sessionUser.phoneCountryCode || "",
          isDefault: true,
          type: "Home"
        }
      ]);
    } else {
      setAddresses([
        {
          id: 1,
          title: "Primary Residence",
          name: sessionUser?.name || "Customer",
          street: "No address set",
          city: "",
          state: "",
          zip: "",
          country: "",
          isDefault: true,
          type: "Home"
        }
      ]);
    }
  };

  useEffect(() => {
    if (sessionUser?.email) {
      loadRealOrders();
      loadAddresses();
    }
  }, [sessionUser?.email]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfileForm = (e) => {
    e.preventDefault();
    const fullName = `${formData.firstName} ${formData.lastName}`.trim();
    
    // Simulate mapping to the AuthPage settingsForm
    const fakeEvent = { preventDefault: () => {} };
    // update parent
    handleSaveSettings(fakeEvent, {
      name: fullName,
      phone: formData.phone,
      bio: formData.bio
    });

    setIsEditingInfo(false);
    showToast("Profile details updated successfully!");
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image file size should be less than 5MB", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSaveSettings(null, { avatarUrl: reader.result });
        setIsAvatarModalOpen(false);
        showToast("Profile image updated!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPresetAvatar = (url) => {
    handleSaveSettings(null, { avatarUrl: url });
    setIsAvatarModalOpen(false);
    showToast("Avatar updated with preset image!");
  };

  const handleSwitchToInitials = () => {
    handleSaveSettings(null, { avatarUrl: '' });
    setIsAvatarModalOpen(false);
    showToast("Switched to Initial Avatar style!");
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.city) {
      showToast("Please fill in required address fields.", "error");
      return;
    }
    const updated = addresses.map(a => newAddress.isDefault ? { ...a, isDefault: false } : a);
    setAddresses([...updated, { ...newAddress, id: Date.now() }]);
    setIsAddressModalOpen(false);
    
    if (newAddress.isDefault) {
       handleSaveSettings(null, { address: newAddress.street, city: newAddress.city });
    }

    setNewAddress({ title: "", name: user.name, street: "", city: "", state: "", zip: "", country: "United States", type: "Home", isDefault: false });
    showToast("New delivery address added!");
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
    const def = addresses.find(a => a.id === id);
    if(def) handleSaveSettings(null, { address: def.street, city: def.city });
    showToast("Default address updated!");
  };

  const handleDeleteAddress = (id) => {
    if (addresses.length <= 1) {
      showToast("Keep at least one address on file.", "error");
      return;
    }
    setAddresses(addresses.filter(a => a.id !== id));
    showToast("Address removed.");
  };

  const handleAddPayment = (e) => {
    e.preventDefault();
    showToast("Payment methods are simulated in this demo.", "info");
    setIsPaymentModalOpen(false);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    showToast("Password updates should be done via security settings.", "info");
  };

  const handleRevokeSession = (id) => {
    showToast("Device session revoked.");
  };

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.name ? user.name[0].toUpperCase() : "O";
  };

  const filteredOrders = orders.filter(o => {
    const orderIdStr = String(o?.id || '').toLowerCase();
    const searchStr = (orderSearch || '').toLowerCase();
    const itemsList = Array.isArray(o?.items) ? o.items : [];
    const matchesSearch = !searchStr || 
                          orderIdStr.includes(searchStr) || 
                          itemsList.some(i => String(i?.name || i?.title || '').toLowerCase().includes(searchStr));
    const matchesStatus = orderFilterStatus === 'All' || o?.status === orderFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || {title: 'None', street: 'No Address'};
  const defaultPayment = payments.find(p => p.isDefault) || payments[0] || {type: 'Visa', last4: '0000', expiry: '00/00'};
  const activeOrder = orders.find(o => o.status === 'In Transit') || orders[0];

  const navTabs = [
    { id: 'account', label: 'Account Page', icon: LayoutDashboard, badge: 'Main' },
    { id: 'profile', label: 'Profile Information', icon: User, badge: null },
    { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
    { id: 'addresses', label: 'Addresses & Wallet', icon: MapPin, badge: addresses.length },
    { id: 'security', label: 'Security & Auth', icon: Shield, badge: '2FA On' },
    { id: 'preferences', label: 'Preferences', icon: Settings, badge: null },
    { id: 'rewards', label: 'VIP & Rewards', icon: Gift, badge: `${user.points} pts` },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 antialiased w-full">
      
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform animate-bounce ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur-md border-b border-[#D9E3F2] sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { if(onBack) onBack(); else navigate('/'); }}
              className="mr-2 p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-[#1F6FEB] flex items-center justify-center text-white font-bold text-sm shadow-md shadow-[#1F6FEB]/30">
              LC
            </div>
            <h1 className="text-xl font-black text-[#0A2540] tracking-tight hidden sm:block">
              My Account & Portal
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200/60 rounded-full text-xs font-semibold text-[#1F6FEB]">
              <span className="w-2 h-2 rounded-full bg-[#1F6FEB] animate-pulse" />
              <span>Signed in as <strong className="font-bold text-[#0A2540]">{user.name}</strong></span>
            </div>

            <button 
              onClick={() => { handleLogout(); navigate('/'); }}
              className="text-rose-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition flex items-center gap-2 font-bold text-xs"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:block">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Profile Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white border border-[#D9E3F2] rounded-3xl overflow-hidden shadow-sm">
          
          <div className="h-36 sm:h-44 w-full relative bg-gradient-to-r from-[#0A2540] via-[#1554C0] to-[#1F6FEB] overflow-hidden">
            <img src={user.coverImage} alt="Cover" className="w-full h-full object-cover opacity-30 filter blur-[1px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/80 via-transparent to-transparent" />
            
            <button 
              onClick={() => showToast("Cover photo updated!")}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border border-white/20 transition"
            >
              <Camera className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Change Cover</span>
            </button>
          </div>

          <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-start md:items-end justify-between gap-6 -mt-12 sm:-mt-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                  {user.avatarType === 'photo' ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1F6FEB] to-[#1554C0] flex items-center justify-center text-white font-extrabold text-4xl shadow-inner">
                      {getInitials()}
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-1 right-1 p-2 bg-[#1F6FEB] hover:bg-[#1554C0] text-white rounded-xl shadow-lg border-2 border-white transition flex items-center justify-center"
                  title="Change Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mb-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h2 className="text-2xl font-extrabold text-[#0A2540] tracking-tight">{user.name}</h2>
                  <span className="inline-flex items-center gap-1 bg-blue-50 text-[#1F6FEB] border border-blue-200/80 text-xs font-bold px-3 py-0.5 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 fill-[#1F6FEB] text-[#1F6FEB]" />
                    {user.tier}
                  </span>
                </div>
                
                <p className="text-[#5A6B84] text-xs mt-1">{user.email} • Member since {user.memberSince}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-center">
              <button 
                onClick={() => setActiveTab('profile')}
                className="bg-[#E8F0FB] hover:bg-[#D9E3F2] text-[#1F6FEB] border border-[#D9E3F2] px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2"
              >
                <User className="w-4 h-4 text-[#1F6FEB]" />
                <span>View Full Profile</span>
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50/50 px-4 sm:px-6 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max py-3">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-[#1F6FEB] text-white shadow-md shadow-[#1F6FEB]/25' 
                        : 'text-[#5A6B84] hover:bg-white hover:text-[#0A2540] border border-transparent hover:border-[#D9E3F2]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5A6B84]'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* ==================== TAB 0: MAIN ACCOUNT PAGE (OVERVIEW) ==================== */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-[#0A2540] via-[#1554C0] to-[#1F6FEB] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 text-blue-100 border border-white/30 text-xs font-bold rounded-full mb-3">
                    Account Dashboard & Central Hub
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black">Welcome back, {user.firstName}!</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
                    Here is an overview of your account status, active orders, saved wallet methods, and loyalty benefits.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="bg-white hover:bg-slate-100 text-[#0A2540] px-5 py-2.5 rounded-2xl text-xs font-extrabold transition shadow-lg flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-[#1F6FEB]" />
                    Edit Profile Details
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="bg-[#1F6FEB]/40 hover:bg-[#1F6FEB]/60 text-white border border-white/30 px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Track Shipments
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div 
                onClick={() => setActiveTab('orders')}
                className="bg-white border border-[#D9E3F2] p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:border-[#1F6FEB]/50 transition shadow-sm"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Total Orders</p>
                  <p className="text-xl font-black text-slate-900">{orders.length}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('rewards')}
                className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:border-violet-300 transition shadow-sm"
              >
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Loyalty Points</p>
                  <p className="text-xl font-black text-slate-900">{user.points} pts</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('addresses')}
                className="bg-white border border-slate-200 p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:border-violet-300 transition shadow-sm"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Saved Places</p>
                  <p className="text-xl font-black text-slate-900">{addresses.length}</p>
                </div>
              </div>

              <div 
                onClick={() => setActiveTab('security')}
                className="bg-white border border-[#D9E3F2] p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:border-[#1F6FEB]/50 transition shadow-sm"
              >
                <div className="p-3 bg-blue-50 text-[#1F6FEB] rounded-2xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Security Score</p>
                  <p className="text-xl font-black text-emerald-600">98%</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-violet-50 text-violet-600 rounded-xl">
                        <User className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg">Profile Summary</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('profile')}
                      className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Full Name</p>
                      <p className="text-slate-900 font-extrabold text-sm mt-0.5">{user.name}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Email Address</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-slate-800 font-bold text-xs">{user.email}</p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Verified</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Phone Number</p>
                      <p className="text-slate-800 font-semibold mt-0.5">{user.phone}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Bio Summary</p>
                      <p className="text-slate-600 font-medium line-clamp-2 mt-0.5">{user.bio}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-violet-600" /> Go to Full Profile Page
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Truck className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg">Active Shipment</h3>
                    </div>
                    {activeOrder && (
                      <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full text-[10px]">
                        {activeOrder.status}
                      </span>
                    )}
                  </div>

                  {activeOrder ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-sm">{activeOrder.id}</span>
                        <span className="text-xs text-slate-400">{activeOrder.carrier}</span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <img src={activeOrder.items[0]?.image} alt="Product" className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">{activeOrder.items[0]?.name}</p>
                          <p className="text-[11px] text-slate-500">Est. Delivery: <strong>{activeOrder.estimatedDelivery}</strong></p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                          <span>Transit Progress</span>
                          <span>75%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-violet-600 h-full rounded-full w-3/4 animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm font-medium">No active shipments found.</div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6 flex items-center gap-2">
                  <button 
                    onClick={() => activeOrder ? setSelectedOrder(activeOrder) : null}
                    disabled={!activeOrder}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-2xl text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    Live Tracking
                  </button>
                  <button 
                    onClick={() => setActiveTab('orders')}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
                  >
                    All Orders
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-lg">Default Wallet & Address</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('addresses')}
                      className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
                    >
                      Manage <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{defaultAddress.title}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">Primary</span>
                      </div>
                      <p className="text-slate-600">{defaultAddress.street}</p>
                      <p className="text-slate-600">{defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}</p>
                    </div>

                    <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{defaultPayment.type} Card</span>
                        <p className="font-mono font-bold text-sm">•••• •••• •••• {defaultPayment.last4}</p>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold">{defaultPayment.expiry}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button 
                    onClick={() => setActiveTab('addresses')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-violet-600" /> Manage Wallet & Saved Places
                  </button>
                </div>
              </div>

            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 text-lg mb-4">Account Quick Shortcuts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-200 border border-slate-100 text-left transition group"
                >
                  <User className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition" />
                  <p className="font-extrabold text-slate-900 text-xs">Edit Personal Bio</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Name, phone & details</p>
                </button>

                <button 
                  onClick={() => setActiveTab('security')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-200 border border-slate-100 text-left transition group"
                >
                  <Key className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition" />
                  <p className="font-extrabold text-slate-900 text-xs">Change Password</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Update account login key</p>
                </button>

                <button 
                  onClick={() => setActiveTab('preferences')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-200 border border-slate-100 text-left transition group"
                >
                  <Bell className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition" />
                  <p className="font-extrabold text-slate-900 text-xs">Notification Rules</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage SMS & emails</p>
                </button>

                <button 
                  onClick={() => setActiveTab('rewards')}
                  className="p-4 rounded-2xl bg-slate-50 hover:bg-violet-50 hover:border-violet-200 border border-slate-100 text-left transition group"
                >
                  <Gift className="w-6 h-6 text-violet-600 mb-2 group-hover:scale-110 transition" />
                  <p className="font-extrabold text-slate-900 text-xs">Redeem Vouchers</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">2 active discount coupons</p>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 1: PROFILE INFORMATION ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Profile Information</h3>
                    <p className="text-xs text-slate-500">Update your personal identity details and contact info</p>
                  </div>
                </div>

                {!isEditingInfo ? (
                  <button 
                    onClick={() => { setFormData({ ...user }); setIsEditingInfo(true); }}
                    className="inline-flex items-center gap-2 text-xs font-bold text-violet-700 bg-white border border-slate-300 hover:border-violet-600 hover:bg-violet-50 px-4 py-2.5 rounded-2xl transition shadow-sm"
                  >
                    <Edit3 className="w-4 h-4 text-violet-600" />
                    <span>Enable Editing</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsEditingInfo(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {isEditingInfo ? (
                <form onSubmit={handleSaveProfileForm} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">First Name</label>
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 text-sm font-medium cursor-not-allowed"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed directly for security reasons.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Phone Number</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Date of Birth</label>
                      <input 
                        type="date" 
                        value={formData.dob}
                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gender</label>
                      <select 
                        value={formData.gender}
                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium bg-white"
                      >
                        <option value="Not specified">Not specified</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-Binary">Non-Binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Personal Bio Summary</label>
                    <textarea 
                      rows={3}
                      value={formData.bio}
                      onChange={e => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingInfo(false)}
                      className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-2xl shadow-md transition"
                    >
                      Save Profile Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</p>
                      <p className="text-slate-900 font-bold text-base mt-1">{user.name}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-slate-900 font-bold text-base">{user.email}</p>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Verified</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Email cannot be changed directly</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                      <p className="text-slate-900 font-bold text-base mt-1">{user.phone}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date of Birth</p>
                      <p className="text-slate-900 font-bold text-base mt-1">{user.dob}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bio & Interests</p>
                    <p className="text-slate-700 text-sm mt-1">{user.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: MY ORDERS ==================== */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <OrdersHistoryContent onBack={() => setActiveTab('account')} />
          </div>
        )}

        {/* ==================== TAB 3: ADDRESSES & WALLET ==================== */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Delivery Addresses</h3>
                  <p className="text-xs text-slate-500">Manage saved shipping destinations</p>
                </div>
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {addresses.map((addr) => (
                  <div key={addr.id} className={`border rounded-3xl p-5 relative flex flex-col justify-between transition ${
                    addr.isDefault ? 'border-violet-600 bg-violet-50/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                          {addr.type}
                        </span>
                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 text-xs text-violet-700 font-bold bg-violet-100 px-3 py-1 rounded-full">
                            <Check className="w-3 h-3" /> Default Address
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-base">{addr.title}</h4>
                      <p className="text-xs text-slate-500 font-bold mt-1">{addr.name}</p>
                      <p className="text-sm text-slate-700 mt-2">{addr.street}</p>
                      <p className="text-sm text-slate-700">{addr.city}, {addr.state} {addr.zip}</p>
                      <p className="text-xs text-slate-400 mt-1">{addr.country}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 text-xs font-bold">
                      {!addr.isDefault ? (
                        <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-violet-600 hover:text-violet-800">
                          Set as Default
                        </button>
                      ) : <span />}
                      <button onClick={() => handleDeleteAddress(addr.id)} className="text-rose-600 hover:text-rose-800">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Payment Cards & Digital Wallets</h3>
                  <p className="text-xs text-slate-500">Saved credit cards for fast checkout</p>
                </div>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {payments.map((card) => (
                  <div key={card.id} className={`bg-gradient-to-br ${card.bgColor} text-white p-6 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between h-52 border border-white/10`}>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xl italic tracking-wider">{card.type}</span>
                      {card.isDefault && (
                        <span className="text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-bold uppercase">Primary Card</span>
                      )}
                    </div>

                    <div className="my-2">
                      <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">Card Number</p>
                      <p className="text-xl font-mono tracking-widest mt-1">•••• •••• •••• {card.last4}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Holder</p>
                        <p className="font-bold tracking-wide uppercase">{card.cardHolder}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Expires</p>
                        <p className="font-bold font-mono">{card.expiry}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 4: SECURITY & AUTH ==================== */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 pb-6 mb-6 border-b border-slate-100">
                <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Password & Security</h3>
                  <p className="text-xs text-slate-500">Update your account password and security preferences</p>
                </div>
              </div>

              <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Current Password</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">New Password</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={passwords.newPass}
                    onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirm New Password</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={passwords.confirmPass}
                    onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm font-medium"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={showPassword} 
                      onChange={e => setShowPassword(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500" 
                    />
                    Show passwords
                  </label>

                  <button 
                    type="submit" 
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md transition"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-900 mb-1">Active Login Sessions</h3>
              <p className="text-xs text-slate-500 mb-6">Devices currently authenticated with your account</p>

              <div className="space-y-4">
                {sessions.map((session) => {
                  const DeviceIcon = session.icon;
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700">
                          <DeviceIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900">{session.device}</p>
                            {session.current && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">This Device</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{session.browser} • {session.location} ({session.ip})</p>
                        </div>
                      </div>

                      {!session.current && (
                        <button 
                          onClick={() => handleRevokeSession(session.id)}
                          className="text-rose-600 hover:text-rose-800 text-xs font-bold px-3 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: PREFERENCES ==================== */}
        {activeTab === 'preferences' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Communication & Notifications</h3>
              <p className="text-xs text-slate-500">Manage how you receive updates and offer alerts</p>
            </div>

            <div className="space-y-4 max-w-xl">
              {[
                { key: 'orderUpdates', label: 'Order Shipment Updates', desc: 'Real-time alerts regarding package dispatch and delivery' },
                { key: 'promotions', label: 'Exclusive Sales & VIP Deals', desc: 'Early bird access for special seasonal promotions' },
                { key: 'stockAlerts', label: 'Wishlist Back-in-Stock Alerts', desc: 'Notify when saved item quantities are replenished' },
                { key: 'securityAlerts', label: 'Security Login Alerts', desc: 'Email alerts when sign-in from a new device is detected' },
                { key: 'smsAlerts', label: 'SMS Notifications', desc: 'Receive quick text alerts directly on your mobile device' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 transition">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notifications[item.key]} 
                    onChange={(e) => {
                      const updated = { ...notifications, [item.key]: e.target.checked };
                      setNotifications(updated);
                      // sync with parent preferences
                      handleSaveSettings(null, { preferences: updated });
                      showToast("Preference updated.");
                    }}
                    className="w-5 h-5 text-violet-600 rounded focus:ring-violet-500 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 6: REWARDS & VIP ==================== */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-lg">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold rounded-full">
                  Gold Loyalty Tier
                </span>
                <h3 className="text-3xl font-black mt-3">2,450 Rewards Points</h3>
                <p className="text-slate-300 text-xs mt-1">Earn 1.5x points on all store purchases as a Gold Member!</p>

                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span>Current: 2,450 pts</span>
                    <span>Target: 3,000 pts (Platinum)</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-400 to-amber-200 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(2450 / 3000) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Earn 550 more points to unlock Platinum Tier perks.</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h4 className="text-lg font-bold text-slate-900 mb-4">Available Member Vouchers</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { code: "VIPGOLD20", discount: "$20 OFF", min: "Spend $100+", expiry: "Expires Aug 15, 2026" },
                  { code: "FREESHIP50", discount: "Free Express Shipping", min: "Spend $50+", expiry: "Expires Aug 30, 2026" }
                ].map((v, i) => (
                  <div key={i} className="border border-dashed border-violet-300 bg-violet-50/50 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded">{v.code}</span>
                      <h5 className="font-extrabold text-slate-900 text-lg mt-1">{v.discount}</h5>
                      <p className="text-xs text-slate-500">{v.min} • {v.expiry}</p>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard?.writeText(v.code);
                        showToast(`Coupon ${v.code} copied!`);
                      }}
                      className="px-3.5 py-2 bg-white border border-slate-200 hover:border-violet-600 hover:text-violet-600 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ==================== MODALS ==================== */}
      
      {/* Modal 1: Avatar Customizer */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Customize Profile Picture</h3>
              <button onClick={() => setIsAvatarModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4 bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setAvatarTab('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  avatarTab === 'upload' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Upload Photo
              </button>
              <button 
                onClick={() => setAvatarTab('presets')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  avatarTab === 'presets' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Preset Avatars
              </button>
              <button 
                onClick={() => setAvatarTab('initials')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                  avatarTab === 'initials' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                Initial Badge
              </button>
            </div>

            <div className="py-6">
              {avatarTab === 'upload' && (
                <div className="text-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-violet-300 hover:border-violet-500 bg-violet-50/40 p-8 rounded-3xl cursor-pointer transition flex flex-col items-center justify-center"
                  >
                    <Upload className="w-10 h-10 text-violet-600 mb-2" />
                    <p className="text-sm font-bold text-slate-800">Click to upload photo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageFileUpload}
                    />
                  </div>
                </div>
              )}

              {avatarTab === 'presets' && (
                <div className="grid grid-cols-3 gap-4">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSelectPresetAvatar(url)}
                      className="relative rounded-2xl overflow-hidden aspect-square border-2 border-transparent hover:border-violet-600 transition group"
                    >
                      <img src={url} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {avatarTab === 'initials' && (
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-extrabold text-3xl shadow-lg">
                    {getInitials()}
                  </div>
                  <p className="text-xs text-slate-500">Displays the initial badge based on your full name.</p>
                  <button 
                    onClick={handleSwitchToInitials}
                    className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-2xl transition shadow-md"
                  >
                    Apply Initial Badge Style
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setIsAvatarModalOpen(false)}
                className="px-5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Shipment Tracking */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Shipment Timeline</h3>
                <p className="text-xs text-slate-500">Tracking Code: {selectedOrder.trackingCode}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-6 space-y-6 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {selectedOrder.timeline.map((step, idx) => (
                <div key={idx} className="relative flex items-center gap-4 pl-9">
                  <div className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.completed ? 'bg-violet-600 text-white shadow' : 'bg-slate-100 text-slate-400 border border-slate-300'
                  }`}>
                    {step.completed ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${step.completed ? 'text-slate-900' : 'text-slate-400'}`}>{step.stage}</p>
                    <p className="text-xs text-slate-500">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-2xl"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Add Address */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Add New Address</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. Vacation Villa, Secondary Office" 
                  value={newAddress.title}
                  onChange={e => setNewAddress({ ...newAddress, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address</label>
                <input 
                  type="text" 
                  placeholder="123 Ocean Boulevard, Apt 4B" 
                  value={newAddress.street}
                  onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City</label>
                  <input 
                    type="text" 
                    value={newAddress.city}
                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">State / Zip</label>
                  <input 
                    type="text" 
                    placeholder="CA 94107"
                    value={newAddress.zip}
                    onChange={e => setNewAddress({ ...newAddress, zip: e.target.value, state: "CA" })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-bold pt-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newAddress.isDefault}
                  onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="rounded text-violet-600 focus:ring-violet-500" 
                />
                Set as default primary shipping destination
              </label>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddressModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Add Payment Card */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Add Credit Card</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cardholder Name</label>
                <input 
                  type="text" 
                  placeholder="ODINAKA CHIBUIKE" 
                  value={newCard.cardHolder}
                  onChange={e => setNewCard({ ...newCard, cardHolder: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Card Number</label>
                <input 
                  type="text" 
                  placeholder="4532 •••• •••• 8842" 
                  maxLength={16}
                  value={newCard.cardNumber}
                  onChange={e => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    value={newCard.expiry}
                    onChange={e => setNewCard({ ...newCard, expiry: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CVV</label>
                  <input 
                    type="password" 
                    placeholder="•••" 
                    maxLength={4}
                    value={newCard.cvv}
                    onChange={e => setNewCard({ ...newCard, cvv: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPaymentModalOpen(false)} 
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserProfileContent;
