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
const IconShoppingBag = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>);
const IconInfo = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>);
const IconFileText = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>);
const IconMapPin = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>);

/* ---------------- Styles ---------------- */
const css = `
:root{--bg:#f4f5fb;--ink:#0A2540;--muted:#5A6B84;--line:#D9E3F2;--accent:#1F6FEB;--accent-dark:#1554C0;--accent-soft:#eef6ff;--danger:#e11d48;--purple:#1F6FEB;--blue:#1F6FEB}
.header-wrapper{position:relative;width:100%;height:65px;z-index:100}
.header{position:fixed;top:0;left:0;right:0;width:100%;height:65px;z-index:100;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid var(--line);box-shadow:0 4px 20px rgba(10,37,64,0.04);display:flex;align-items:center}
.header-inner{max-width:1440px;margin:0 auto;display:flex;align-items:center;gap:10px;padding:0 20px;width:100%;box-sizing:border-box}
.logo{display:flex;align-items:baseline;gap:3px;cursor:pointer;user-select:none;flex-shrink:0}
.logo-s{font-family:'Sora',sans-serif;font-weight:800;font-style:italic;font-size:26px;color:var(--blue);line-height:1;text-shadow:0 2px 5px rgba(31,111,235,.35)}
.logo-text{font-family:'Sora',sans-serif;font-weight:800;font-style:italic;font-size:19px;color:#0A2540;letter-spacing:-.01em;line-height:1;white-space:nowrap}
.nav-btn{display:flex;align-items:center;gap:7px;height:40px;padding:0 14px;border-radius:12px;border:1.5px solid var(--line);background:#fff;font:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;transition:.2s;flex-shrink:0;white-space:nowrap}
.nav-btn:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.nav-btn.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(31,111,235,.25)}
.nav-btn.deal:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.nav-btn.deal.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(31,111,235,.25)}
.nav-btn.new:hover{border-color:var(--accent);color:var(--accent);transform:translateY(-1px)}
.nav-btn.new.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 6px 16px rgba(31,111,235,.25)}
.search-wrap{flex:1;max-width:560px;display:flex;margin-left:auto;min-width:120px;position:relative}
.search-suggestions-dropdown{position:absolute;top:48px;left:0;right:0;background:#ffffff;border:1.5px solid var(--line);border-radius:14px;box-shadow:0 12px 35px rgba(10,37,64,0.1);z-index:1000;max-height:380px;overflow-y:auto;padding:8px;box-sizing:border-box}
.search-suggestion-item{display:flex;align-items:center;gap:12px;padding:8px 12px;border-radius:10px;cursor:pointer;transition:all 0.15s ease;text-decoration:none}
.search-suggestion-item:hover{background:var(--accent-soft)}
.suggestion-thumb{width:42px;height:42px;object-fit:cover;border-radius:8px;border:1px solid var(--line);background:#f8fafc;flex-shrink:0}
.suggestion-info{flex:1;min-width:0;text-align:left}
.suggestion-name{font-size:13px;font-weight:700;color:var(--ink);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.suggestion-price{font-size:11px;font-weight:700;color:var(--accent);margin:2px 0 0 0}
.search-bar{flex:1;display:flex;align-items:center;gap:2px;padding:0 6px 0 14px;background:#edf0f5;border-radius:12px 0 0 12px;height:42px;border:1.5px solid transparent;transition:.2s;min-width:0}
.search-bar:focus-within{background:#fff;border-color:var(--accent);box-shadow:0 0 0 4px rgba(31,111,235,.12)}
.search-input{flex:1;min-width:30px;border:none;background:transparent;outline:none;font:inherit;font-size:14px;color:var(--ink)}
.search-input::placeholder{color:#9aa0b5}
.sb-icon{border:none;background:none;color:#8a90a8;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;flex-shrink:0}
.sb-icon:hover{color:var(--accent);background:#eef6ff}
.sb-icon.listening{color:#fff;background:var(--danger);animation:pulse 1.1s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(225,29,72,.5)}70%{box-shadow:0 0 0 10px rgba(225,29,72,0)}100%{box-shadow:0 0 0 0 rgba(225,29,72,0)}}
.search-btn{display:flex;align-items:center;gap:7px;padding:0 20px;height:42px;border:none;background:var(--accent);color:#fff;font:inherit;font-size:14px;font-weight:700;border-radius:0 12px 12px 0;cursor:pointer;transition:.2s;flex-shrink:0;white-space:nowrap}
.search-btn:hover{background:var(--accent-dark)}
.search-btn:active{transform:scale(.97)}
.icon-btn{position:relative;width:40px;height:40px;border-radius:12px;border:1.5px solid var(--line);background:#fff;color:var(--ink);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.2s;flex-shrink:0}
.icon-btn:hover{border-color:var(--accent);color:var(--accent)}
.icon-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.badge{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:999px;background:var(--accent);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff}
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
.profile-btn{width:40px;height:40px;border-radius:50%;overflow:hidden;border:2px solid var(--line);padding:0;cursor:pointer;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent);transition:.2s;flex-shrink:0}
.profile-btn:hover{border-color:var(--accent)}
.profile-btn img{width:100%;height:100%;object-fit:cover}
.profile-head-premium {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px 18px;
  background: transparent;
}
.premium-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1F6FEB, #1554C0);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 26px;
  margin-bottom: 12px;
  box-shadow: 0 4px 12px rgba(31, 111, 235, 0.25);
  user-select: none;
}
.premium-name {
  font-weight: 800;
  font-size: 16px;
  color: #0f172a;
  font-family: 'Sora', sans-serif;
}
.dark .premium-name {
  color: #f8fafc;
}
.premium-mail {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
}
.dark .premium-mail {
  color: #94a3b8;
}
.premium-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 0 16px 8px;
}
.dark .premium-divider {
  background: rgba(255, 255, 255, 0.08);
}
.menu-list {
  padding: 8px;
}
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 16px;
  border: none;
  background: none;
  border-radius: 12px;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  transition: .15s;
  text-align: left;
}
.dark .menu-item {
  color: #cbd5e1;
}
.menu-item svg {
  color: #1F6FEB !important;
  flex-shrink: 0;
  width: 18px !important;
  height: 18px !important;
}
.dark .menu-item svg {
  color: #60a5fa !important;
}
.menu-item:hover {
  background: #eef6ff;
  color: #1F6FEB;
}
.dark .menu-item:hover {
  background: rgba(31, 111, 235, 0.12);
  color: #60a5fa;
}
.menu-sep {
  height: 1px;
  background: var(--line);
  margin: 6px 10px;
}
.vs-card{position:fixed;z-index:86;left:50%;top:50%;transform:translate(-50%,-50%);width:620px;max-width:calc(100vw - 32px);max-height:86vh;overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 80px rgba(15,18,40,.3)}
.vs-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
.vs-head b{font-family:'Sora',sans-serif;font-size:15px}
.vs-body{display:grid;grid-template-columns:210px 1fr;gap:18px;padding:20px}
.vs-img-wrap{position:relative;border-radius:14px;overflow:hidden;background:#eceef5;aspect-ratio:1}
.vs-img-wrap img{width:100%;height:100%;object-fit:cover}
.scan-line{position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,var(--accent),transparent);animation:scan 1.2s linear infinite;box-shadow:0 0 14px rgba(31,111,235,.8)}
@keyframes scan{0%{top:0}100%{top:100%}}
.vs-status{font-size:13px;color:var(--muted);margin-bottom:10px;display:flex;align-items:center;gap:8px}
.spinner{width:14px;height:14px;border:2px solid var(--accent-soft);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite;flex-shrink:0}
@keyframes spin{to{transform:rotate(360deg)}}
.vs-empty{padding:26px 12px;text-align:center;color:var(--muted);font-size:13px;background:#f7f8fc;border:1.5px dashed var(--line);border-radius:12px}
.vs-foot{padding:0 20px 18px;font-size:11px;color:#a0a6bd;text-align:center}
.overlay{position:fixed;inset:0;background:rgba(15,18,40,.45);z-index:60;backdrop-filter:blur(2px)}
.toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:90;background:var(--ink);color:#fff;padding:12px 22px;border-radius:999px;font-size:14px;font-weight:600;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);white-space:nowrap}
.toast .dot{width:8px;height:8px;border-radius:50%;background:#22c55e;flex-shrink:0}

/* Tablet and Large Tablet Breakpoints */
@media (max-width: 1200px) {
  .header-inner { gap: 8px; padding: 10px 16px; }
  .search-wrap { max-width: 400px; }
  .nav-btn { padding: 0 10px; font-size: 12px; }
  .search-btn { padding: 0 14px; }
}

@media (max-width: 1080px) {
  .nav-btn span { display: none; }
  .nav-btn { padding: 0 10px; width: 40px; justify-content: center; }
  .search-btn span { display: none; }
  .search-btn { padding: 0 14px; }
  .search-wrap { max-width: 320px; }
}

@media (max-width: 820px) {
  .header-inner { gap: 6px; padding: 8px 12px; }
  .logo-text { display: none; }
  .search-wrap { min-width: 100px; }
  .search-bar { padding: 0 4px 0 10px; }
  .search-input { font-size: 13px; }
}

@media (max-width: 640px) {
  .header-inner { flex-wrap: wrap; gap: 8px; }
  .search-wrap { order: 3; max-width: none; flex-basis: 100%; margin-left: 0; }
  .nav-btn span { display: none; }
  .nav-btn { padding: 0 10px; }
  .logo-s { font-size: 21px; }
  .logo-text { font-size: 15px; display: block; }
  .vs-body { grid-template-columns: 1fr; }
}

@media (max-width: 480px) {
  .search-btn span { display: none; }
  .search-btn { padding: 0 14px; }
}
`;

export default function DesktopHeader({ activePage = "home", setActivePage, onCartOpen, onSidebarOpen, onNotifOpen }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, products: globalProducts, showToast: globalShowToast } = useStore();
  const { cartItems: cart = [] } = useCart();
  const { wishlistItems: wishlist = [] } = useWishlist();
  const { t, t_smart, lang } = useLanguage();

  const [currentUser, setCurrentUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [toast, setToast] = useState(null);
  const [listening, setListening] = useState(false);
  const [imgSearch, setImgSearch] = useState(null);

  const profileRef = useRef(null);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const scanTimerRef = useRef(null);
  const suggestionsRef = useRef(null);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Live Search Suggestions filter
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const trimmed = query.trim().toLowerCase();
    const filtered = (globalProducts || [])
      .filter(p => p.status === 'active' && p.name && p.name.toLowerCase().includes(trimmed))
      .slice(0, 6);
    setSuggestions(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [query, globalProducts]);

  // Click outside suggestions listener
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const calculateUnread = () => {
      try {
        const rawRead = localStorage.getItem('read_notifications');
        
        // Mark all initial mock products as read for first-time visitors
        if (rawRead === null && globalProducts && globalProducts.length > 0) {
          const allInitialIds = globalProducts.map(p => `new-product-${p.id}`);
          localStorage.setItem('read_notifications', JSON.stringify(allInitialIds));
          setUnreadNotifCount(0);
          return;
        }

        const readNotifs = rawRead ? JSON.parse(rawRead) : [];
        const readTimed = JSON.parse(localStorage.getItem('read_notifications_timed') || '{}');
        const deletedNotifs = JSON.parse(localStorage.getItem('deleted_notifications') || '{}');
        const count = globalProducts.filter(p => p.is_new_arrival).filter(p => {
          const id = `new-product-${p.id}`;
          return !readNotifs.includes(id) && !readTimed[id] && !deletedNotifs[id];
        }).length;
        setUnreadNotifCount(count);
      } catch (e) {
        setUnreadNotifCount(0);
      }
    };

    calculateUnread();

    const handleUpdate = () => {
      calculateUnread();
    };

    window.addEventListener('notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [globalProducts]);

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

    const checkSession = () => {
      try {
        const session = JSON.parse(localStorage.getItem('sweetohub_session'));
        if (session) setCurrentUser(session);
        else setCurrentUser(null);
      } catch (e) {
        setCurrentUser(null);
      }
    };
    checkSession();
    window.addEventListener('storage', checkSession);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const mappedUser = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0],
          email: session.user.email,
          avatarUrl: session.user.user_metadata?.avatar_url,
          picture: session.user.user_metadata?.avatar_url
        };
        setCurrentUser(mappedUser);
        localStorage.setItem('sweetohub_session', JSON.stringify(mappedUser));
      } else {
        checkSession();
      }
    });

    return () => {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
      subscription.unsubscribe();
      window.removeEventListener('storage', checkSession);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = imgSearch ? "hidden" : "";
  }, [imgSearch]);

  useEffect(() => {
    const onDown = (e) => {
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
    localStorage.removeItem('sweetohub_session');
    setCurrentUser(null);
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



  return (
    <div className="w-full">
      <style>{css}</style>

      {/* Header */}
      <div className="header-wrapper">
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
            <div className="search-wrap" ref={suggestionsRef}>
              <div className="search-bar">
                <input
                  className="search-input"
                  placeholder={lang === "fr" ? "Écouteurs sans fil" : "Wireless Earbuds"}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { doSearch(); setShowSuggestions(false); } }}
                />
                <button type="button" className="sb-icon" title="Search with camera / image" onClick={() => fileRef.current && fileRef.current.click()}>
                  <IconCamera />
                </button>
                <button type="button" className={listening ? "sb-icon listening" : "sb-icon"} title="Voice search" onClick={toggleVoice}>
                  <IconMic />
                </button>
              </div>
              <button type="button" className="search-btn" onClick={() => { doSearch(); setShowSuggestions(false); }}>
                <IconSearch /><span>{t_smart("Search")}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageFile} />

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="search-suggestions-dropdown"
                  >
                    {suggestions.map((p) => {
                      const currency = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency === 'USD' ? '$' : (settings?.currency || 'FCFA'));
                      const formattedPrice = `${Number(p.price || 0).toLocaleString('fr-FR')} ${currency}`;
                      return (
                        <div
                          key={p.id}
                          className="search-suggestion-item"
                          onClick={() => {
                            setShowSuggestions(false);
                            setQuery("");
                            navigate(`/product/${p.id}`);
                          }}
                        >
                          <img
                            src={p.image_url || p.image || (p.images && p.images[0]) || '/hero-banner.png'}
                            alt={p.name}
                            className="suggestion-thumb"
                            onError={(e) => { e.target.onerror = null; e.target.src = '/hero-banner.png'; }}
                          />
                          <div className="suggestion-info">
                            <h4 className="suggestion-name">{p.name}</h4>
                            <p className="suggestion-price">{formattedPrice}</p>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
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
            <div className="dd-wrap">
              <button className="icon-btn" onClick={onNotifOpen} aria-label="Notifications">
                <IconBell />
                {unreadNotifCount > 0 && (
                  <motion.span key={unreadNotifCount} className="badge red" initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                    {unreadNotifCount}
                  </motion.span>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="dd-wrap" ref={profileRef}>
              <button className="profile-btn" onClick={() => setProfileOpen((v) => !v)} aria-label="Profile">
                {currentUser ? (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1F6FEB] to-[#1554C0] flex items-center justify-center text-white font-extrabold text-[15px] shadow-inner">
                    {(currentUser.name?.[0] || currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
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
                        <div className="profile-head-premium">
                          <div className="premium-avatar">
                            {(currentUser.name?.[0] || currentUser.user_metadata?.full_name?.[0] || currentUser.email?.[0] || "U").toUpperCase()}
                          </div>
                          <div className="premium-name">
                            {currentUser.name || currentUser.user_metadata?.full_name || "Account User"}
                          </div>
                          <div className="premium-mail">
                            {currentUser.email}
                          </div>
                        </div>
                        <div className="premium-divider" />
                        <div className="menu-list">
                          <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/orders"); }}>
                            <IconShoppingBag />
                            <span>{lang === "fr" ? "Mes commandes" : "My Orders"}</span>
                          </button>
                          <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/settings"); }}>
                            <IconGear />
                            <span>{lang === "fr" ? "Paramètres" : "Settings"}</span>
                          </button>
                          <button className="menu-item" onClick={handleLogout}>
                            <IconLogout />
                            <span>{lang === "fr" ? "Déconnexion" : "Log out"}</span>
                          </button>
                          <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/visit"); }}>
                            <IconInfo />
                            <span>{lang === "fr" ? "À propos de nous" : "About us"}</span>
                          </button>
                          <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/terms"); }}>
                            <IconFileText />
                            <span>{lang === "fr" ? "Conditions générales" : "Terms & Conditions"}</span>
                          </button>
                          <button className="menu-item" onClick={() => { setProfileOpen(false); navigate("/visit"); }}>
                            <IconMapPin />
                            <span>{lang === "fr" ? "Nous trouver" : "Find us"}</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="menu-list" style={{ padding: 20, textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, margin: "0 auto 10px", borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconUser />
                        </div>
                        <p style={{ fontWeight: 700, fontFamily: "'Sora',sans-serif" }}>Welcome to {settings?.shopName || "SWEETO-HUB"}</p>
                        <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 14px" }}>Sign in to see orders & wishlist</p>
                        <button className="menu-item" style={{ background: "linear-gradient(135deg,#1F6FEB,#1554C0)", color: "#fff", justifyContent: "center", fontWeight: 700, borderRadius: 12, padding: 12 }} onClick={() => { setProfileOpen(false); navigate("/auth"); }}>
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
      </div>

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
