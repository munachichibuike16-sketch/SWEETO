import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useLanguage } from "../contexts/LanguageContext";
import { supabase } from "../lib/supabase";

/* ---------------- Data ---------------- */
const AVATAR = "https://image.qwenlm.ai/public_source/53c97a24-015d-4ba2-b782-f01bb74c12d8/125531636-2200-4a29-a67c-8ce25383150f.png";

const INITIAL_NOTIFS = [
  { id: 1, ico: "📦", title: "Order #4829 shipped", text: "Your Aurora X1 Headphones are on the way.", time: "2h ago", read: false },
  { id: 2, ico: "🏷️", title: "Flash Sale live now", text: "20% off all Electronics ends tonight!", time: "5h ago", read: false },
  { id: 3, ico: "⭐", title: "Rate your purchase", text: "Review your last order and earn 50 reward points.", time: "1d ago", read: false },
  { id: 4, ico: "🚚", title: "Delivery update", text: "Package arriving Thursday before 9 PM.", time: "2d ago", read: true },
];

/* ---------------- Icons ---------------- */
const IconSearch = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
const IconCamera = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>);
const IconMic = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>);
const IconCart = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1.6" /><circle cx="19" cy="21" r="1.6" /><path d="M2.5 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L23 7H6.2" /></svg>);
const IconHeart = ({ filled }) => (<svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>);
const IconX = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>);
const IconHome = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 2l9 7.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>);
const IconBell = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const IconUser = () => (<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const IconLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></svg>);
const IconBox = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>);
const IconGear = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
const IconFlame = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>);
const IconSparkles = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2.4 5.4L20 11l-5.6 2.6L12 19l-2.4-5.4L4 11l5.6-2.6L12 3z" /><path d="M19 3v4M21 5h-4M5 17v4M7 19H3" /></svg>);

/* ---------------- Styles ---------------- */
const css = `
:root{--bg:#f4f5fb;--ink:#151735;--muted:#69708c;--line:#e6e8f4;--accent:#5046e5;--accent-soft:#eeeaff;--danger:#e11d48;--purple:#7c5cf5;--blue:#1f7cf6}
.header{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.86);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.header-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:14px 24px}
.logo{display:flex;align-items:baseline;gap:3px;cursor:pointer;user-select:none;flex-shrink:0}
.logo-s{font-family:'Sora',sans-serif;font-weight:800;font-style:italic;font-size:27px;color:var(--blue);line-height:1;text-shadow:0 2px 5px rgba(31,124,246,.35)}
.logo-text{font-family:'Sora',sans-serif;font-weight:800;font-style:italic;font-size:20px;color:#0b0d12;letter-spacing:-.01em;line-height:1;white-space:nowrap;text-shadow:0 2px 4px rgba(0,0,0,.16)}
.nav-btn{display:flex;align-items:center;gap:8px;height:42px;padding:0 16px;border-radius:12px;border:1.5px solid var(--line);background:#fff;font:inherit;font-size:14px;font-weight:600;color:var(--ink);cursor:pointer;transition:.2s;flex-shrink:0}
.nav-btn:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.nav-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(80,70,229,.3)}
.nav-btn.deal:hover{border-color:#f97316;color:#f97316}
.nav-btn.deal.active{background:linear-gradient(135deg,#f97316,#e11d48);border-color:transparent;box-shadow:0 6px 16px rgba(225,29,72,.3)}
.nav-btn.new:hover{border-color:#0ea5e9;color:#0ea5e9}
.nav-btn.new.active{background:linear-gradient(135deg,#0ea5e9,#6366f1);border-color:transparent;box-shadow:0 6px 16px rgba(14,165,233,.3)}
.search-wrap{flex:1;max-width:640px;display:flex;margin-left:auto;min-width:180px}
.search-bar{flex:1;display:flex;align-items:center;gap:2px;padding:0 8px 0 18px;background:#edf0f5;border-radius:12px 0 0 12px;height:48px;border:1.5px solid transparent;transition:.2s}
.search-bar:focus-within{background:#fff;border-color:var(--purple);box-shadow:0 0 0 4px rgba(124,92,245,.14)}
.search-input{flex:1;min-width:40px;border:none;background:transparent;outline:none;font:inherit;font-size:15px;color:var(--ink)}
.search-input::placeholder{color:#9aa0b5}
.sb-icon{border:none;background:none;color:#8a90a8;width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;flex-shrink:0}
.sb-icon:hover{color:var(--purple);background:#e4defc}
.sb-icon.listening{color:#fff;background:var(--danger);animation:pulse 1.1s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(225,29,72,.5)}70%{box-shadow:0 0 0 10px rgba(225,29,72,0)}100%{box-shadow:0 0 0 0 rgba(225,29,72,0)}}
.search-btn{display:flex;align-items:center;gap:9px;padding:0 26px;height:48px;border:none;background:var(--purple);color:#fff;font:inherit;font-size:15px;font-weight:700;border-radius:0 12px 12px 0;cursor:pointer;transition:.2s;flex-shrink:0}
.search-btn:hover{background:#6a48e8}
.search-btn:active{transform:scale(.97)}
.icon-btn{position:relative;width:42px;height:42px;border-radius:12px;border:1.5px solid var(--line);background:#fff;color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;flex-shrink:0}
.icon-btn:hover{border-color:var(--accent);color:var(--accent)}
.icon-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.badge{position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
.badge.red{background:var(--danger)}
.dd-wrap{position:relative}
.dropdown{position:absolute;right:0;top:calc(100% + 12px);width:330px;max-width:calc(100vw - 24px);background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 20px 50px rgba(15,18,40,.16);z-index:80;overflow:hidden}
.dd-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--line)}
.dd-head b{font-size:14px;font-family:'Sora',sans-serif}
.link-btn{border:none;background:none;color:var(--accent);font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.link-btn:hover{text-decoration:underline}
.notif-list{max-height:340px;overflow-y:auto}
.notif-item{display:flex;gap:12px;padding:12px 34px 12px 18px;border-bottom:1px solid #f0f1f8;cursor:pointer;transition:.15s;position:relative}
.notif-item:last-child{border-bottom:none}
.notif-item:hover{background:#f7f7fd}
.notif-item.unread{background:var(--accent-soft)}
.notif-item.unread::before{content:"";position:absolute;left:7px;top:24px;width:6px;height:6px;border-radius:50%;background:var(--accent)}
.notif-ico{width:36px;height:36px;border-radius:10px;background:#eef0f8;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.notif-item.unread .notif-ico{background:#fff}
.notif-title{font-size:13px;font-weight:600}
.notif-text{font-size:12px;color:var(--muted);margin-top:2px;line-height:1.4}
.notif-time{font-size:11px;color:#a0a6bd;margin-top:4px}
.notif-x{border:none;background:none;color:#b3b8ca;cursor:pointer;position:absolute;top:10px;right:8px;display:flex;padding:3px;border-radius:6px}
.notif-x:hover{color:var(--danger);background:#fdecef}
.notif-empty{padding:40px 16px;text-align:center;color:var(--muted);font-size:13px}
.profile-btn{width:42px;height:42px;border-radius:50%;overflow:hidden;border:2px solid var(--line);padding:0;cursor:pointer;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);transition:.2s;flex-shrink:0}
.profile-btn:hover{border-color:var(--accent)}
.profile-btn img{width:100%;height:100%;object-fit:cover}
.profile-head{display:flex;gap:12px;align-items:center;padding:16px;background:linear-gradient(135deg,#6d5ef0,#8b5cf6);color:#fff}
.avatar{width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.75);background:#fff;flex-shrink:0}
.p-name{font-weight:700;font-size:14px;font-family:'Sora',sans-serif}
.p-mail{font-size:12px;opacity:.85;margin-top:2px}
.menu-list{padding:8px}
.menu-item{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;background:none;border-radius:10px;font:inherit;font-size:14px;font-weight:500;color:var(--ink);cursor:pointer;transition:.15s;text-align:left}
.menu-item:hover{background:#f2f1fd;color:var(--accent)}
.menu-item.danger{color:var(--danger)}
.menu-item.danger:hover{background:#fdecef;color:var(--danger)}
.menu-sep{height:1px;background:var(--line);margin:6px 10px}
.vs-card{position:fixed;z-index:86;left:50%;top:50%;transform:translate(-50%,-50%);width:620px;max-width:calc(100vw - 32px);max-height:86vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 80px rgba(15,18,40,.3)}
.vs-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
.vs-head b{font-family:'Sora',sans-serif;font-size:15px}
.vs-body{display:grid;grid-template-columns:210px 1fr;gap:18px;padding:20px}
.vs-img-wrap{position:relative;border-radius:14px;overflow:hidden;background:#eceef5;aspect-ratio:1}
.vs-img-wrap img{width:100%;height:100%;object-fit:cover}
.scan-line{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--purple),transparent);animation:scan 1.2s linear infinite;box-shadow:0 0 14px rgba(124,92,245,.8)}
@keyframes scan{0%{top:0}100%{top:100%}}
.vs-status{font-size:13px;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.spinner{width:14px;height:14px;border:2px solid var(--accent-soft);border-top-color:var(--purple);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.vs-empty{padding:26px 12px;text-align:center;color:var(--muted);font-size:13px;background:#f7f8fc;border:1.5px dashed var(--line);border-radius:12px}
.vs-foot{padding:0 20px 18px;font-size:11px;color:#a0a6bd;text-align:center}
.overlay{position:fixed;inset:0;background:rgba(15,18,40,.45);z-index:60;backdrop-filter:blur(2px)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:90;background:var(--ink);color:#fff;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);white-space:nowrap}
.toast .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0}
@media (max-width:640px){
  .header-inner{flex-wrap:wrap;gap:8px}
  .search-wrap{order:3;max-width:none;flex-basis:100%;margin-left:0}
  .nav-btn span{display:none}
  .nav-btn{padding:0 13px}
  .logo-s{font-size:21px}
  .logo-text{font-size:15px}
  .vs-body{grid-template-columns:1fr}
}
@media (max-width:480px){
  .search-btn span{display:none}
  .search-btn{padding:0 16px}
}
`;

export default function DesktopHeader({ activePage = "home", setActivePage, onCartOpen, onSidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, products: globalProducts, showToast: globalShowToast } = useStore();
  const { cartItems: cart = [] } = useCart();
  const { wishlistItems: wishlist = [] } = useWishlist();
  const { t, t_smart, lang } = useLanguage();

  const [currentUser, setCurrentUser] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFS);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [listening, setListening] = useState(false);
  const [imgSearch, setImgSearch] = useState(null);

  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const scanTimerRef = useRef(null);

  // If no setActivePage prop is provided, we can fallback to location based
  if (!setActivePage) {
    const hash = window.location.hash.replace(/^#/, "");
    const path = hash.startsWith("/") ? hash : location.pathname;
    if (path === "/" || path === "") activePage = "home";
    else if (path === "/deals") activePage = "deals";
    else if (path === "/new-arrivals") activePage = "new-arrivals";
    else activePage = "other";
    
    setActivePage = (page) => {
      if (page === "home") navigate("/");
      if (page === "deals") navigate("/deals");
      if (page === "new-arrivals") navigate("/new-arrivals");
    };
  }

  useEffect(() => {
    const fonts = [
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/400.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/500.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/600.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/700.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/inter/800.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/sora/700.css",
      "https://cdn.jsdelivr.net/npm/@fontsource/sora/800.css",
    ];
    fonts.forEach((href) => {
      if (!document.querySelector('link[href="' + href + '"]')) {
        const linkEl = document.createElement("link");
        linkEl.rel = "stylesheet";
        linkEl.href = href;
        document.head.appendChild(linkEl);
      }
    });

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUser(session?.user || null);
    };
    fetchUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = imgSearch ? "hidden" : "";
  }, [imgSearch]);

  useEffect(() => {
    const onDown = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const showLocalToast = (msg) => {
    setToast({ msg, key: Date.now() });
    if (globalShowToast) {
      globalShowToast(msg, "info");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfileOpen(false);
    showLocalToast(lang === "fr" ? "Déconnexion réussie 👋" : "Logged out successfully 👋");
  };

  const goHome = () => {
    setActivePage("home");
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goDeals = () => {
    setActivePage("deals");
    navigate("/deals");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goNew = () => {
    setActivePage("new-arrivals");
    navigate("/new-arrivals");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const doSearch = () => {
    if (query.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/category/All?search=${encodeURIComponent(query.trim())}`);
      showLocalToast(lang === "fr" ? `Recherche de "${query.trim()}"` : `Searching for "${query.trim()}"`);
    } else {
      showLocalToast(lang === "fr" ? "Veuillez entrer un terme" : "Type something to search");
    }
  };

  /* Voice search */
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showLocalToast(lang === "fr" ? "Recherche vocale non supportée" : "Voice search not supported in this browser");
      return;
    }
    if (listening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }
    const rec = new SR();
    rec.lang = lang === "fr" ? "fr-FR" : "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      showLocalToast(lang === "fr" ? `Entendu: "${text}"` : `Heard: "${text}"`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      showLocalToast(lang === "fr" ? "Impossible de vous entendre" : "Couldn't hear you — try again");
    };
    recognitionRef.current = rec;
    setListening(true);
    showLocalToast(lang === "fr" ? "Écoute en cours..." : "Listening... say a product name");
    rec.start();
  };

  /* Image search */
  const handleImageFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImgSearch({ url: reader.result, status: "scanning" });
      scanTimerRef.current = setTimeout(() => {
        setImgSearch({ url: reader.result, status: "done" });
      }, 1800);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const closeImgSearch = () => {
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
    setImgSearch(null);
  };

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));
  const markRead = (id) => setNotifications((n) => n.map((x) => (x.id === id ? { ...x, read: true } : x)));
  const dismissNotif = (id) => setNotifications((n) => n.filter((x) => x.id !== id));
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-full">
      <style>{css}</style>

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo" onClick={goHome} title="Go to home">
            <span className="logo-s">S</span>
            <span className="logo-text">{settings?.shopName || "SWEETO-HUB"}</span>
          </div>

          <button className={activePage === "home" ? "nav-btn active" : "nav-btn"} onClick={goHome} title="Home">
            <IconHome /><span>{t("Home") || "Home"}</span>
          </button>
          <button className={activePage === "deals" ? "nav-btn deal active" : "nav-btn deal"} onClick={goDeals} title="Hot deals">
            <IconFlame /><span>{t("Deals") || "Deals"}</span>
          </button>
          <button className={activePage === "new-arrivals" ? "nav-btn new active" : "nav-btn new"} onClick={goNew} title="New arrivals">
            <IconSparkles /><span>{t("New Arrivals") || "New Arrivals"}</span>
          </button>

          {/* Search bar with camera + voice + search button */}
          <div className="search-wrap">
            <div className="search-bar">
              <input
                className="search-input"
                placeholder={lang === "fr" ? "Écouteurs sans fil" : "Wireless Earbuds"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doSearch(); }}
              />
              <button className="sb-icon" title="Search with camera / image" onClick={() => fileRef.current && fileRef.current.click()}>
                <IconCamera />
              </button>
              <button className={listening ? "sb-icon listening" : "sb-icon"} title="Voice search" onClick={toggleVoice}>
                <IconMic />
              </button>
            </div>
            <button className="search-btn" onClick={doSearch}>
              <IconSearch /><span>{t_smart("Search")}</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />
          </div>

          <button 
            className={activePage === "wishlist" ? "icon-btn active" : "icon-btn"} 
            onClick={() => { setActivePage("wishlist"); navigate("/wishlist"); }} 
            title="Show wishlist"
          >
            <IconHeart filled={activePage === "wishlist" || wishlist.length > 0} />
            {wishlist.length > 0 && <span className="badge">{wishlist.length}</span>}
          </button>

          {/* Notifications */}
          <div className="dd-wrap" ref={notifRef}>
            <button className={notifOpen ? "icon-btn active" : "icon-btn"} onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
              <IconBell />
              {unreadCount > 0 && (
                <motion.span key={unreadCount} className="badge red" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                  {unreadCount}
                </motion.span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div className="dropdown" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}>
                  <div className="dd-head">
                    <b>{t("Notifications") || "Notifications"}</b>
                    {unreadCount > 0 && <button className="link-btn" onClick={markAllRead}>{lang === "fr" ? "Tout marquer" : "Mark all as read"}</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="notif-empty">🔔<br />{lang === "fr" ? "Vous êtes à jour !" : "You're all caught up!"}</div>
                  ) : (
                    <div className="notif-list">
                      {notifications.map((n) => (
                        <div key={n.id} className={n.read ? "notif-item" : "notif-item unread"} onClick={() => markRead(n.id)}>
                          <span className="notif-ico">{n.ico}</span>
                          <div>
                            <div className="notif-title">{n.title}</div>
                            <div className="notif-text">{n.text}</div>
                            <div className="notif-time">{n.time}</div>
                          </div>
                          <button className="notif-x" aria-label="Dismiss notification" onClick={(e) => { e.stopPropagation(); dismissNotif(n.id); }}>
                            <IconX />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Profile */}
          <div className="dd-wrap" ref={profileRef}>
            <button className="profile-btn" onClick={() => setProfileOpen((v) => !v)} aria-label="Profile">
              {currentUser ? (
                <div className="w-full h-full rounded-full bg-[#6d5ef0] flex items-center justify-center text-white font-extrabold text-[15px] shadow-inner">
                  {(currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                </div>
              ) : (
                <IconUser />
              )}
            </button>
            <AnimatePresence>
              {profileOpen && (
                <motion.div className="dropdown" initial={{ opacity: 0, y: -8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18 }}>
                  {currentUser ? (
                    <>
                      <div className="profile-head">
                        <div className="w-11 h-11 rounded-full bg-white text-[#6d5ef0] flex items-center justify-center font-black text-lg border-2 border-white/50 flex-shrink-0">
                          {(currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <div className="p-name">{currentUser.user_metadata?.full_name || "Account User"}</div>
                          <div className="p-mail">{currentUser.email}</div>
                        </div>
                      </div>
                      <div className="menu-list">
                        <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/dashboard"); }}><IconUser /> {lang === "fr" ? "Mon profil" : "My Profile"}</button>
                        <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/orders"); }}><IconBox /> {lang === "fr" ? "Mes commandes" : "My Orders"}</button>
                        <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/wishlist"); }}><IconHeart filled /> {lang === "fr" ? "Liste d'envies" : "Wishlist"}</button>
                        <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/settings"); }}><IconGear /> {lang === "fr" ? "Paramètres" : "Settings"}</button>
                        <div className="menu-sep" />
                        <button className="menu-item danger" onClick={handleLogout}><IconLogout /> {lang === "fr" ? "Se déconnecter" : "Log out"}</button>
                      </div>
                    </>
                  ) : (
                    <div className="menu-list" style={{ padding: 20, textAlign: "center" }}>
                      <div style={{ width: 52, height: 52, margin: "0 auto 10px", borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyItems: "center" }}>
                        <IconUser />
                      </div>
                      <p style={{ fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>Welcome to {settings?.shopName || "SWEETO-HUB"}</p>
                      <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 14px" }}>Sign in to see orders & wishlist</p>
                      <button className="menu-item" style={{ background: "linear-gradient(135deg,#6d5ef0,#4338ca)", color: "#fff", justifyContent: "center", fontWeight: 700, borderRadius: 12, padding: 12 }} onClick={() => { setProfileOpen(false); navigate("/auth"); }}>
                        {lang === "fr" ? "Se connecter" : "Sign In"}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button className="icon-btn" onClick={() => onCartOpen && onCartOpen()} aria-label="Open cart">
            <IconCart />
            {cart.length > 0 && (
              <span className="badge">
                {cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Visual search modal */}
      <AnimatePresence>
        {imgSearch && (
          <>
            <motion.div className="overlay" style={{ zIndex: 85 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeImgSearch} />
            <motion.div className="vs-card" initial={{ opacity: 0, scale: 0.92, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.22 }}>
              <div className="vs-head">
                <b>📷 {lang === "fr" ? "Recherche par image" : "Search by Image"}</b>
                <button className="icon-btn" onClick={closeImgSearch} aria-label="Close visual search"><IconX /></button>
              </div>
              <div className="vs-body">
                <div className="vs-img-wrap">
                  <img src={imgSearch.url} alt="Uploaded search" />
                  {imgSearch.status === "scanning" && <div className="scan-line" />}
                </div>
                <div>
                  {imgSearch.status === "scanning" ? (
                    <div className="vs-status"><span className="spinner" /> {lang === "fr" ? "Analyse de l'image — détection des formes..." : "Analyzing image — detecting shapes, colors & style..."}</div>
                  ) : (
                    <div className="vs-status" style={{ color: "var(--ink)", fontWeight: 700 }}>✅ {lang === "fr" ? "Analyse terminée" : "Analysis complete"}</div>
                  )}
                  {imgSearch.status === "done" && (
                    <div className="vs-empty">😕 {lang === "fr" ? "Aucun produit correspondant trouvé." : "No matching products in the catalog yet."}<br />{lang === "fr" ? "Revenez plus tard !" : "Stock is coming soon — check back later!"}</div>
                  )}
                  {imgSearch.status === "scanning" && [1, 2, 3].map((k) => (
                    <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--line)", borderRadius: 12, padding: 8, opacity: 0.45, marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 9, background: "#e3e6ef" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 10, borderRadius: 5, background: "#e3e6ef", marginBottom: 6 }} />
                        <div style={{ height: 8, width: "60%", borderRadius: 5, background: "#e3e6ef" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="vs-foot">Powered by {settings?.shopName || "SWEETO-HUB"} Vision · results ranked by visual similarity</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Local Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.key} className="toast" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.95 }}>
            <span className="dot" />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
