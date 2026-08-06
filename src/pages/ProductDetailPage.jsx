import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ShoppingCart, Star, Minus, Plus, MessageCircle, 
  Share2, Heart, Shield, Award, MapPin, ChevronRight, Clock, Check, Search, ChevronLeft, X, Camera, Save, ChevronDown
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import DesktopHeader from '../components/DesktopHeader';
import CartDrawer from '../components/CartDrawer';
import Sidebar from '../components/Sidebar';
import { supabase } from '../lib/supabase';

/* ─────────────────────── helpers ─────────────────────── */
const getHexColor = (colorName) => {
  if (!colorName) return 'var(--accent)';
  const name = colorName.toLowerCase().trim();
  const m = {
    sandstone: '#C9A87C', sand: '#C9A87C',
    midnight: '#1C1B1A', noir: '#1C1B1A', black: '#1C1B1A',
    moss: '#7A8471', vert: '#7A8471', green: '#7A8471',
    blue: '#1F6FEB', bleu: '#1F6FEB',
    red: '#ff3b30', rouge: '#ff3b30',
    yellow: '#ffcc00', jaune: '#ffcc00',
    white: '#ffffff', blanc: '#ffffff',
    grey: '#8e8e93', gris: '#8e8e93',
    gold: '#C5A059'
  };
  for (const [k, v] of Object.entries(m)) {
    if (name.includes(k)) return v;
  }
  if (name.startsWith('#')) return colorName;
  // Fallback hash color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const getFeatureDetails = (prod) => {
  const cat = (prod?.category || '').toLowerCase();
  if (cat.includes('phone') || cat.includes('ecouteur') || cat.includes('headphone') || cat.includes('audio') || cat.includes('sound')) {
    return {
      feat1: {
        eyebrow: "Materials & Comfort",
        title: "Premium Build, Zero fatigue.",
        desc: "Ergonomically tuned shape designed for prolonged daily usage. Memory cushions seal in the acoustics without applying excess pressure to your head.",
        bullets: ["Replaceable high-comfort padding", "Brushed metal hinges for extended durability", "Lightweight framework"]
      },
      feat2: {
        eyebrow: "Acoustic Engineering",
        title: "Sound that reads the room.",
        desc: "High-definition custom speakers tuned for rich bass response, transparent mids, and crystal-clear vocals. Immerse yourself in studio-quality music anywhere.",
        bullets: ["Adaptive frequency response", "Deep passive isolation seal", "Enhanced call clarity hardware"]
      }
    };
  }
  return {
    feat1: {
      eyebrow: "DESIGN PHILOSOPHY",
      title: "Crafted for Everyday Excellence.",
      desc: "Carefully engineered using robust, premium materials. Form and function aligned to deliver the most reliable user experience under heavy daily operation.",
      bullets: ["Durable lightweight chassis", "Scratch-resistant sleek surfaces", "Strict quality control tested"]
    },
    feat2: {
      eyebrow: "INTELLIGENT TECHNOLOGY",
      title: "Powering your lifestyle.",
      desc: "Packs next-generation internal hardware to maximize efficiency and speed. Designed to connect instantly and keep operating without interruptions.",
      bullets: ["High efficiency power management", "Seamless multi-device connectivity", "Official manufacturer certification"]
    }
  };
};

function Stars({ value }) {
  const r = Math.round(value);
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" style={{ fill: i <= r ? "#1F6FEB" : "#D9E3F2" }}>
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
        </svg>
      ))}
    </span>
  );
}

const getImagesList = (prod) => {
  if (!prod) return [];
  const list = [];
  const mainImg = prod.image_url || prod.image;
  if (mainImg) list.push(mainImg);
  if (prod.images) {
    try {
      const imgs = typeof prod.images === 'string' ? JSON.parse(prod.images) : prod.images;
      if (Array.isArray(imgs)) {
        imgs.forEach(img => {
          if (img && !list.includes(img)) list.push(img);
        });
      }
    } catch (e) {}
  }
  if (list.length === 0) list.push('/hero-banner.png');
  return list;
};

const HINTS = ["Tap a star", "Poor", "Fair", "Good", "Great", "Legendary"];

/* ───────────────────────── CSS ───────────────────────── */
const css = `
@import url("https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-normal.css");
@import url("https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-700-normal.css");
@import url("https://cdn.jsdelivr.net/fontsource/fonts/fraunces@latest/latin-600-italic.css");
@import url("https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-400-normal.css");
@import url("https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-500-normal.css");
@import url("https://cdn.jsdelivr.net/fontsource/fonts/space-grotesk@latest/latin-700-normal.css");

.pdp-premium-container {
  --paper:#F6F9FE; --card:#FFFFFF; --stage:#E8F0FB;
  --ink:#0A2540; --ink-soft:#5A6B84; --line:#D9E3F2;
  --accent:#1F6FEB; --accent-dark:#1554C0; --gold:#1F6FEB; --moss:#2F80ED;
  --r:16px; --shadow:0 18px 44px -18px rgba(10,37,64,.25);
  --disp:"Fraunces",serif; --body:"Space Grotesk",sans-serif;
  
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  position: relative;
  width: 100%;
}

.pdp-premium-container .noise{position:absolute;inset:0;z-index:120;pointer-events:none;opacity:.04;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")}
.pdp-premium-container .crumb{display:flex;gap:8px;align-items:center;font-size:12px;letter-spacing:.08em;color:var(--ink-soft);padding:26px 0 4px;text-transform:uppercase}
.pdp-premium-container .crumb b{color:var(--ink)} .pdp-premium-container .crumb i{font-style:normal;color:var(--line)}
.pdp-premium-container .pdp{display:grid;grid-template-columns:minmax(0,1.04fr) minmax(0,.96fr);gap:52px;padding:18px 0 70px;align-items:start}
.pdp-premium-container .gallery{position:sticky;top:20px}
.pdp-premium-container .stage{position:relative;aspect-ratio:1/1;background:var(--stage);border-radius:20px;overflow:hidden;box-shadow:var(--shadow)}
.pdp-premium-container .stage .breathe{position:absolute;inset:0;animation:breathe 9s ease-in-out infinite alternate}
@keyframes breathe{from{transform:scale(1)}to{transform:scale(1.045)}}
.pdp-premium-container .stage img{width:100%;height:100%;object-fit:cover;transition:opacity .28s ease,transform .5s cubic-bezier(.2,.7,.2,1);transform-origin:center}
.pdp-premium-container .stage.zoomed img{transform:scale(1.8)}
.pdp-premium-container .stage.switching img{opacity:0}
.pdp-premium-container .badges{position:absolute;top:16px;left:16px;display:flex;flex-direction:column;gap:8px;z-index:2}
.pdp-premium-container .badge{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;padding:7px 12px;border-radius:999px}
.pdp-premium-container .badge.sale{background:var(--accent);color:#fff}
.pdp-premium-container .badge.new{background:var(--ink);color:#fff}
.pdp-premium-container .zoom-hint{position:absolute;right:14px;bottom:12px;z-index:2;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);background:rgba(255,255,255,.85);padding:6px 10px;border-radius:999px}
.pdp-premium-container .thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:14px}
.pdp-premium-container .thumb{aspect-ratio:1/1;border-radius:12px;overflow:hidden;border:2px solid transparent;background:var(--stage);padding:0;transition:border-color .25s,transform .25s}
.pdp-premium-container .thumb img{width:100%;height:100%;object-fit:cover}
.pdp-premium-container .thumb:hover{transform:translateY(-3px)}
.pdp-premium-container .thumb.active{border-color:var(--accent)}
.pdp-premium-container .eyebrow{font-size:11px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);display:flex;align-items:center;gap:10px}
.pdp-premium-container .eyebrow::before{content:"";width:26px;height:2px;background:var(--accent)}
.pdp-premium-container h1.pname{font-family:var(--disp);font-weight:700;font-size:clamp(2.4rem,4.4vw,3.6rem);line-height:1.02;margin:12px 0 10px;letter-spacing:-.01em}
.pdp-premium-container .rate-row{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--ink-soft)}
.pdp-premium-container .stars{display:inline-flex;gap:2px}
.pdp-premium-container .stars svg{width:15px;height:15px}
.pdp-premium-container .rate-row a{font-weight:500;text-decoration:underline;text-underline-offset:3px}
.pdp-premium-container .price-row{display:flex;align-items:baseline;gap:14px;margin:20px 0 6px}
.pdp-premium-container .price{font-family:var(--disp);font-weight:700;font-size:2.1rem}
.pdp-premium-container .compare{color:var(--ink-soft);text-decoration:line-through;font-size:1.05rem}
.pdp-premium-container .save{background:rgba(31,111,235,.12);color:var(--accent-dark);font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:6px 10px;border-radius:999px}
.pdp-premium-container .pdesc{color:var(--ink-soft);margin:10px 0 22px;max-width:52ch}
.pdp-premium-container .opt-label{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-bottom:10px}
.pdp-premium-container .opt-label span{color:var(--ink-soft);font-weight:500;text-transform:none;letter-spacing:.02em}
.pdp-premium-container .swatches{display:flex;gap:12px;margin-bottom:26px}
.pdp-premium-container .swatch{width:38px;height:38px;border-radius:50%;border:1px solid rgba(10,37,64,.18);position:relative;transition:transform .25s;cursor:pointer}
.pdp-premium-container .swatch:hover{transform:scale(1.1)}
.pdp-premium-container .swatch.active::after{content:"";position:absolute;inset:-6px;border:2px solid var(--accent);border-radius:50%}
.pdp-premium-container .buy-row{display:flex;gap:12px;align-items:stretch;flex-wrap:wrap}
.pdp-premium-container .qty{display:flex;align-items:center;border:1.5px solid var(--ink);border-radius:999px;overflow:hidden}
.pdp-premium-container .qty button{width:42px;height:100%;min-height:52px;font-size:18px;font-weight:500;transition:background .2s;cursor:pointer}
.pdp-premium-container .qty button:hover{background:rgba(31,111,235,.1)}
.pdp-premium-container .qty output{width:34px;text-align:center;font-weight:700}
.pdp-premium-container .btn-add{flex:1;min-width:200px;background:var(--accent);color:#fff;border-radius:999px;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:17px 26px;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .25s,transform .15s;cursor:pointer}
.pdp-premium-container .btn-add:hover{background:var(--accent-dark)}
.pdp-premium-container .btn-add:active{transform:scale(.97)}
.pdp-premium-container .btn-add.done{background:var(--ink)}
.pdp-premium-container .btn-wish,.pdp-premium-container .btn-share{width:54px;border:1.5px solid var(--ink);border-radius:50%;display:grid;place-items:center;transition:background .25s,border-color .25s;flex-shrink:0;cursor:pointer}
.pdp-premium-container .btn-wish svg,.pdp-premium-container .btn-share svg{width:20px;height:20px;fill:none;stroke:var(--ink);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pdp-premium-container .btn-wish:hover,.pdp-premium-container .btn-share:hover{background:rgba(31,111,235,.08)}
.pdp-premium-container .btn-wish.on{background:rgba(31,111,235,.1);border-color:var(--accent)}
.pdp-premium-container .btn-wish.on svg{fill:var(--accent);stroke:var(--accent);animation:pop .4s}
.pdp-premium-container .btn-share.pulse svg{animation:pop .4s}
.pdp-premium-container .btn-now{width:100%;margin-top:12px;border:1.5px solid var(--accent);color:var(--accent);border-radius:999px;padding:15px;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;transition:background .25s,color .25s;cursor:pointer}
.pdp-premium-container .btn-now:hover{background:var(--accent);color:#fff}
.pdp-premium-container .trust{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:26px 0 8px}
.pdp-premium-container .trust div{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px 12px;text-align:center;font-size:11.5px;font-weight:500;color:var(--ink-soft)}
.pdp-premium-container .trust svg{width:22px;height:22px;stroke:var(--accent);fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;margin:0 auto 8px;display:block}
.pdp-premium-container .acc{margin-top:26px;border-top:1px solid var(--line)}
.pdp-premium-container .acc-item{border-bottom:1px solid var(--line)}
.pdp-premium-container .acc-head{width:100%;display:flex;justify-content:space-between;align-items:center;padding:18px 2px;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
.pdp-premium-container .acc-head .pl{font-size:20px;font-weight:400;transition:transform .35s}
.pdp-premium-container .acc-item.open .pl{transform:rotate(45deg);color:var(--accent)}
.pdp-premium-container .acc-panel{display:grid;grid-template-rows:0fr;transition:grid-template-rows .45s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .acc-item.open .acc-panel{grid-template-rows:1fr}
.pdp-premium-container .acc-panel>div{min-height:0;overflow:hidden}
.pdp-premium-container .acc-body{padding:0 2px 22px;color:var(--ink-soft);font-size:14.5px}
.pdp-premium-container .spec{display:grid;grid-template-columns:1fr 1.3fr;row-gap:10px;font-size:14px}
.pdp-premium-container .spec dt{font-weight:700;color:var(--ink)} .pdp-premium-container .spec dd{color:var(--ink-soft)}
.pdp-premium-container .boxlist{list-style:none;margin-top:8px}
.pdp-premium-container .boxlist li{padding:6px 0 6px 26px;position:relative}
.pdp-premium-container .boxlist li::before{content:"✓";position:absolute;left:2px;color:var(--accent);font-weight:700}
.pdp-premium-container .fab{position:fixed;right:22px;bottom:22px;z-index:95;width:58px;height:58px;border-radius:50%;background:var(--accent);color:#fff;display:grid;place-items:center;box-shadow:var(--shadow);transition:bottom .45s cubic-bezier(.2,.7,.2,1),transform .2s,background .25s;cursor:pointer}
.pdp-premium-container .fab:hover{background:var(--accent-dark);transform:scale(1.06)}
.pdp-premium-container .fab svg{width:22px;height:22px;stroke:#fff;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pdp-premium-container .fab.lift{bottom:96px}
.pdp-premium-container #cartCount{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:var(--ink);color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;transform:scale(0);transition:transform .25s cubic-bezier(.34,1.6,.5,1)}
.pdp-premium-container #cartCount.on{transform:scale(1)}
.pdp-premium-container #cartCount.pop{animation:pop .35s cubic-bezier(.34,1.8,.5,1)}
@keyframes pop{50%{transform:scale(1.45)}}
.pdp-premium-container .features{padding:40px 0 20px}
.pdp-premium-container .feat{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-bottom:44px}
.pdp-premium-container .feat:nth-child(even) .feat-img{order:2}
.pdp-premium-container .feat-img{border-radius:16px;overflow:hidden;box-shadow:var(--shadow);max-height:300px;display:flex;align-items:center;justify-content:center;background:var(--stage)}
.pdp-premium-container .feat-img img{width:100%;height:100%;object-fit:cover;max-height:300px;transition:transform 1.2s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .feat-img:hover img{transform:scale(1.06)}
.pdp-premium-container h2.big{font-family:var(--disp);font-weight:700;font-size:clamp(1.5rem,2.4vw,2.1rem);line-height:1.1;margin:8px 0 10px;letter-spacing:-.01em}
.pdp-premium-container h2.big em{font-style:italic;color:var(--accent)}
.pdp-premium-container .feat p{color:var(--ink-soft);max-width:48ch;font-size:14.5px}
.pdp-premium-container .feat ul{list-style:none;margin-top:12px;display:grid;gap:8px;font-size:13.5px;font-weight:500}
.pdp-premium-container .feat ul li{padding-left:26px;position:relative}
.pdp-premium-container .feat ul li::before{content:"→";position:absolute;left:0;color:var(--accent)}
.pdp-premium-container .lm{overflow:hidden}
.pdp-premium-container .lm .lm-in{display:block;transform:translateY(115%);transition:transform .9s cubic-bezier(.2,.75,.2,1)}
.pdp-premium-container .lm.in .lm-in{transform:translateY(0)}
.pdp-premium-container .reviews{padding:20px 0 110px}
.pdp-premium-container .rev-head{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap;margin-bottom:34px}
.pdp-premium-container .rev-grid{display:grid;grid-template-columns:340px 1fr;gap:36px;align-items:start}
.pdp-premium-container .rev-sum{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:28px;position:sticky;top:24px}
.pdp-premium-container .rev-score{display:flex;align-items:baseline;gap:12px}
.pdp-premium-container .rev-score b{font-family:var(--disp);font-size:3.4rem;font-weight:700;line-height:1}
.pdp-premium-container .rev-score span{color:var(--ink-soft);font-size:13px}
.pdp-premium-container .bars{margin-top:18px;display:grid;gap:8px}
.pdp-premium-container .bar-row{display:grid;grid-template-columns:34px 1fr 40px;align-items:center;gap:10px;font-size:12px;color:var(--ink-soft)}
.pdp-premium-container .bar{height:7px;background:var(--line);border-radius:99px;overflow:hidden}
.pdp-premium-container .bar-fill{height:100%;background:var(--accent);border-radius:999px;transition:width 1.1s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.pdp-premium-container .pill{border:1.5px solid var(--line);border-radius:999px;padding:8px 16px;font-size:12px;font-weight:700;letter-spacing:.08em;transition:all .25s;cursor:pointer}
.pdp-premium-container .pill:hover{border-color:var(--accent)}
.pdp-premium-container .pill.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.pdp-premium-container .rev-cards{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.pdp-premium-container .rev-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);padding:22px;transition:transform .3s,box-shadow .3s}
.pdp-premium-container .rev-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}
.pdp-premium-container .rev-card.fresh{animation:slideIn .5s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .rev-top{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.pdp-premium-container .ava{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:14px;color:#fff;flex-shrink:0}
.pdp-premium-container .rev-who b{display:block;font-size:14px}
.pdp-premium-container .rev-who span{font-size:11.5px;color:var(--ink-soft)}
.pdp-premium-container .verif{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--moss);display:flex;gap:4px;align-items:center}
.pdp-premium-container .verif.fresh-tag{color:var(--accent)}
.pdp-premium-container .rev-card h4{font-size:15px;margin:6px 0 6px}
.pdp-premium-container .rev-card p{font-size:13.5px;color:var(--ink-soft)}
.pdp-premium-container .rev-card .stars svg{width:13px;height:13px}
.pdp-premium-container .modal{position:fixed;inset:0;z-index:150;display:grid;place-items:center;padding:20px;pointer-events:none}
.pdp-premium-container .modal-back{position:absolute;inset:0;background:rgba(10,37,64,.5);opacity:0;transition:opacity .35s;cursor:pointer}
.pdp-premium-container .modal-card{position:relative;background:var(--paper);border-radius:20px;max-width:540px;width:100%;padding:32px;box-shadow:var(--shadow);transform:translateY(28px) scale(.97);opacity:0;transition:transform .45s cubic-bezier(.2,.75,.2,1),opacity .45s;max-height:92vh;overflow-y:auto}
.pdp-premium-container .modal.on{pointer-events:auto}
.pdp-premium-container .modal.on .modal-back{opacity:1}
.pdp-premium-container .modal.on .modal-card{transform:none;opacity:1}
.pdp-premium-container .modal-x{position:absolute;top:16px;right:16px;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:16px;transition:background .2s;cursor:pointer}
.pdp-premium-container .modal-x:hover{background:rgba(31,111,235,.1)}
.pdp-premium-container .modal-title{font-family:var(--disp);font-weight:700;font-size:2rem;margin:10px 0 20px}
.pdp-premium-container .modal-card form label{display:grid;gap:6px;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px}
.pdp-premium-container .modal-card input,.pdp-premium-container .modal-card textarea{width:100%;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--card);font-family:var(--body);font-size:14px;font-weight:400;letter-spacing:0;text-transform:none;color:var(--ink);outline:none;transition:border-color .25s;resize:vertical}
.pdp-premium-container .modal-card input:focus,.pdp-premium-container .modal-card textarea:focus{border-color:var(--accent)}
.pdp-premium-container .f-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pdp-premium-container .f-rate{margin-bottom:16px}
.pdp-premium-container .f-label{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;display:block;margin-bottom:8px}
.pdp-premium-container .star-pick{display:inline-flex;gap:4px}
.pdp-premium-container .star-pick button{padding:2px;transition:transform .15s;cursor:pointer}
.pdp-premium-container .star-pick button:hover{transform:scale(1.2)}
.pdp-premium-container .star-pick button svg{width:26px;height:26px;fill:var(--line);transition:fill .15s}
.pdp-premium-container .star-pick button.lit svg{fill:var(--accent)}
.pdp-premium-container .f-hint{font-size:12px;color:var(--ink-soft);margin-left:10px}
.pdp-premium-container .modal-submit{width:100%;background:var(--accent);color:#fff;border-radius:999px;padding:16px;font-size:13px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;transition:background .25s;margin-top:6px;cursor:pointer}
.pdp-premium-container .modal-submit:hover{background:var(--accent-dark)}
.pdp-premium-container .related{padding:0 0 130px}
.pdp-premium-container .rel-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;margin-top:30px}
.pdp-premium-container .rel-card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);overflow:hidden;transition:transform .3s,box-shadow .3s;position:relative}
.pdp-premium-container .rel-card:hover{transform:translateY(-6px);box-shadow:var(--shadow)}
.pdp-premium-container .rel-img{aspect-ratio:1/1;background:var(--stage);overflow:hidden}
.pdp-premium-container .rel-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .rel-card:hover .rel-img img{transform:scale(1.07)}
.pdp-premium-container .rel-body{padding:16px 18px 18px}
.pdp-premium-container .rel-body b{font-size:15px;display:block}
.pdp-premium-container .rel-body span{font-size:13px;color:var(--ink-soft)}
.pdp-premium-container .rel-add{position:absolute;right:14px;bottom:14px;width:42px;height:42px;border-radius:50%;background:var(--accent);color:#fff;font-size:20px;display:grid;place-items:center;transition:background .25s,transform .25s;opacity:0;transform:translateY(8px);cursor:pointer}
.pdp-premium-container .rel-card:hover .rel-add{opacity:1;transform:translateY(0)}
.pdp-premium-container .rel-add:hover{background:var(--accent-dark)}
@media(hover:none){.pdp-premium-container .rel-add{opacity:1;transform:none}}
.pdp-premium-container .stickybar{position:fixed;left:0;right:0;bottom:0;z-index:80;background:var(--card);border-top:1px solid var(--line);box-shadow:0 -12px 34px rgba(10,37,64,.12);transform:translateY(110%);transition:transform .45s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .stickybar.show{transform:translateY(0)}
.pdp-premium-container .sb-in{display:flex;align-items:center;gap:16px;padding:12px 0}
.pdp-premium-container .sb-in img{width:52px;height:52px;object-fit:cover;border-radius:10px;background:var(--stage)}
.pdp-premium-container .sb-in .sb-name{font-weight:700;font-size:14px}
.pdp-premium-container .sb-in .sb-name span{display:block;font-weight:400;color:var(--ink-soft);font-size:12px}
.pdp-premium-container .sb-in .price{font-size:1.3rem;margin-left:auto}
.pdp-premium-container .sb-in .btn-add{flex:0;min-width:0;padding:14px 26px}
.pdp-premium-container .overlay{position:fixed;inset:0;background:rgba(10,37,64,.45);z-index:100;opacity:0;pointer-events:none;transition:opacity .35s}
.pdp-premium-container .overlay.on{opacity:1;pointer-events:auto}
.pdp-premium-container .fly{position:fixed;z-index:140;width:18px;height:18px;border-radius:50%;background:var(--accent);pointer-events:none;transition:transform .75s cubic-bezier(.25,.7,.3,1),opacity .75s;box-shadow:0 4px 12px rgba(31,111,235,.5)}
.pdp-premium-container .reveal{opacity:0;transform:translateY(26px);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1)}
.pdp-premium-container .reveal.in{opacity:1;transform:none}

@media(max-width:1020px){
  .pdp-premium-container .pdp{grid-template-columns:1fr;gap:34px}
  .pdp-premium-container .gallery{position:static}
  .pdp-premium-container .rev-grid{grid-template-columns:1fr}
  .pdp-premium-container .rev-sum{position:static}
  .pdp-premium-container .rel-grid{grid-template-columns:repeat(2,1fr)}
  .pdp-premium-container .feat{grid-template-columns:1fr;gap:26px}
  .pdp-premium-container .feat:nth-child(even) .feat-img{order:0}
}
@media(max-width:720px){
  .pdp-premium-container .rev-cards{grid-template-columns:1fr}
  .pdp-premium-container .rel-grid{grid-template-columns:1fr 1fr;gap:12px}
  .pdp-premium-container .trust{grid-template-columns:1fr}
  .pdp-premium-container .sb-in .price{display:none}
  .pdp-premium-container .f-row{grid-template-columns:1fr}
}
@media(prefers-reduced-motion:reduce){
  .pdp-premium-container *,.pdp-premium-container *::before,.pdp-premium-container *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  .pdp-premium-container .reveal{opacity:1;transform:none}
  .pdp-premium-container .lm .lm-in{transform:none}
}
`;

export default function ProductDetailPage() {
  const { productId: rawProductId } = useParams();
  const productId = rawProductId ? rawProductId.toLowerCase().replace(/^swt-/, '') : '';
  const navigate = useNavigate();
  
  const { 
    products: liveProducts, settings, showToast, addToRecent, 
    setSearchQuery, setSelectedCategory, setSelectedBrand, 
    openGlobalLightbox 
  } = useStore();
  
  const { addToCart: originalAddToCart, cartCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { lang, t, t_smart } = useLanguage();
  
  const [product, setProduct] = useState(null);
  const [view, setView] = useState(0);
  const [switching, setSwitching] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [qty, setQty] = useState(1);
  const [wish, setWish] = useState(false);
  const [sharePulse, setSharePulse] = useState(false);
  const [added, setAdded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [openAcc, setOpenAcc] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [filter, setFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", title: "", body: "" });
  const [pick, setPick] = useState(0);
  const [hoverPick, setHoverPick] = useState(0);
  const [badgePop, setBadgePop] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const fabRef = useRef(null);
  const buyboxRef = useRef(null);
  const titleRef = useRef(null);
  const mainImgRef = useRef(null);

  // Fetch product data on load
  useEffect(() => {
    if (productId && liveProducts.length > 0) {
      const foundProduct = liveProducts.find(p => p.id.toString() === productId.toString());
      if (foundProduct) {
        setProduct(foundProduct);
        addToRecent(foundProduct);
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        navigate('/');
      }
    }
  }, [productId, liveProducts, navigate]);

  // Fetch reviews from Supabase
  const fetchProductReviews = async () => {
    if (!product) return;
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', product.id)
          .eq('is_approved', 1)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map(r => ({
            name: r.reviewer_name || "Guest User",
            date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            rating: r.rating || 5,
            title: r.rating >= 4 ? "Excellent Quality" : "Satisfactory",
            body: r.comment || "",
            ava: AVA_COLORS[(r.reviewer_name?.length || 5) % AVA_COLORS.length],
            verified: true
          }));
          setReviews(mapped);
          return;
        }
      }
    } catch (err) {}
    setReviews([]);
  };

  useEffect(() => {
    if (product) {
      fetchProductReviews();
    }
  }, [product]);

  // Check if product has variants
  const hasVariants = useMemo(() => {
    let enabled = false;
    if (product?.description && product.description.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(product.description);
        if (parsed.variantsConfig) {
          enabled = parsed.variantsConfig.enabled || false;
        }
      } catch (e) {}
    }
    return enabled;
  }, [product]);

  // Map variants config colors
  useEffect(() => {
    if (product) {
      const list = getImagesList(product);
      if (!hasVariants) {
        setVariants([]);
        setSelectedVariant(null);
        return;
      }

      let parsedColors = [];
      if (Array.isArray(product.colors)) {
        parsedColors = product.colors;
      } else if (typeof product.colors === 'string' && product.colors.trim() !== '') {
        try {
          const parsed = JSON.parse(product.colors);
          if (Array.isArray(parsed)) parsedColors = parsed;
        } catch (e) {
          parsedColors = product.colors.split(',').map(c => c.trim()).filter(Boolean);
        }
      }

      const mapped = parsedColors.map((c, idx) => {
        let name = '';
        let priceAdjust = 0;
        if (typeof c === 'object' && c !== null) {
          name = c.name || c.code || `Option ${idx + 1}`;
          priceAdjust = Number(c.priceAdjust) || 0;
        } else {
          name = c;
        }
        const img = list[idx] || list[0];
        return { id: idx, name, image: img, priceAdjust };
      });
      
      setVariants(mapped);
      setSelectedVariant(mapped[0] || null);
    }
  }, [product, hasVariants]);

  // Scroll handler for sticky header and sticky bar
  useEffect(() => {
    const onScroll = () => {
      if (buyboxRef.current) {
        setShowBar(buyboxRef.current.getBoundingClientRect().bottom < 60);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection observer for animation fadeUp entries
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        io.unobserve(en.target);
      });
    }, { threshold: 0.1 });
    
    // Tiny delay to ensure DOM nodes are fully rendered
    const t = setTimeout(() => {
      document.querySelectorAll(".reveal, .lm").forEach((el) => io.observe(el));
    }, 400);

    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [product]);

  // Preload Images
  useEffect(() => {
    if (product) {
      getImagesList(product).forEach((src) => {
        const im = new Image();
        im.src = src;
      });
    }
  }, [product]);

  // Badge animation pop trigger
  useEffect(() => {
    if (cartCount > 0) {
      setBadgePop(true);
      const t = setTimeout(() => setBadgePop(false), 350);
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  if (!product) return null;

  // Pricing calculations
  const finalPrice = (product.price || 0) + (selectedVariant?.priceAdjust || 0);
  const oldPrice = product.original_price || product.old_price || (finalPrice * 1.25);
  const savings = oldPrice - finalPrice;
  const discountPercent = Math.round((savings / oldPrice) * 100);
  const currSymbol = settings?.currency === 'XOF' ? 'FCFA' : (settings?.currency || 'FCFA');

  // Breadcrumbs category selection
  const handleCategoryBreadcrumb = () => {
    setSelectedCategory(product.category);
    navigate('/');
  };

  // Image list configuration
  const imagesList = getImagesList(product);
  const viewsArr = selectedVariant?.image 
    ? [{ src: selectedVariant.image, label: selectedVariant.name }, ...imagesList.filter(img => img !== selectedVariant.image).map((img, i) => ({ src: img, label: `Angle ${i+1}` }))]
    : imagesList.map((img, i) => ({ src: img, label: `Angle ${i+1}` }));

  // Related products & More to Love lists
  const currentCat = (product.category || '').toLowerCase();
  const relatedProducts = liveProducts
    .filter(p => p.id.toString() !== product.id.toString() && p.status === 'active' && (p.category || '').toLowerCase() === currentCat)
    .slice(0, 4);

  const relatedIds = new Set(relatedProducts.map(r => r.id.toString()));
  const moreToLoveProducts = liveProducts
    .filter(p => p.id.toString() !== product.id.toString() && p.status === 'active' && !relatedIds.has(p.id.toString()))
    .slice(0, 8);

  // Review statistics calculation
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 
    ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1))
    : (product.rating || 4.8);

  const reviewRatings = reviews.map(r => r.rating);
  const buckets = [5, 4, 3, 2, 1].map(stars => {
    const count = reviewRatings.filter(r => r === stars).length;
    return reviewCount > 0 ? Math.round((count / reviewCount) * 100) : (stars === 5 ? 88 : stars === 4 ? 8 : 4);
  });

  const visibleReviews = filter === "all" ? reviews : reviews.filter((r) => String(r.rating) === filter);

  // Specifications Accordion contents
  let cleanDescription = product.description || '';
  let boxListItems = [];
  let productSpecs = [];
  if (cleanDescription.startsWith('{')) {
    try {
      const parsed = JSON.parse(cleanDescription);
      cleanDescription = parsed.description || '';
      boxListItems = parsed.whatsInBox || parsed.boxList || [];
      if (parsed.specs) {
        productSpecs = Object.entries(parsed.specs).map(([k, v]) => ({ label: k, value: v }));
      }
    } catch (e) {}
  }
  if (productSpecs.length === 0) {
    productSpecs = [
      { label: 'Brand', value: product.brand || 'SWEETO' },
      { label: 'Category', value: product.category || 'Electronics' },
      { label: 'Status', value: product.stock > 0 ? 'In Stock' : 'Out of Stock' },
      { label: 'Warranty', value: '2-Year Official Warranty' },
      { label: 'Delivery', value: 'Express Available' }
    ];
  }

  // Alternating highlight feature values
  const featureContent = getFeatureDetails(product);
  const feat1Img = viewsArr[1]?.src || viewsArr[0]?.src || '/hero-banner.png';
  const feat2Img = viewsArr[2]?.src || viewsArr[0]?.src || '/hero-banner.png';

  /* Actions */
  const addToCartHandler = (item, q) => {
    const finalProduct = {
      ...item,
      name: selectedVariant ? `${item.name} (${selectedVariant.name})` : item.name,
      price: finalPrice
    };
    originalAddToCart(finalProduct, q);
    showToast(`Added ${item.name} to cart!`, 'success');
  };

  const fly = (fromEl) => {
    if (REDUCED || !fabRef.current) return;
    const a = fromEl.getBoundingClientRect(), b = fabRef.current.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "fly";
    dot.style.left = a.left + a.width / 2 - 9 + "px";
    dot.style.top = a.top + a.height / 2 - 9 + "px";
    document.body.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.transform = "translate(" + (b.left + b.width / 2 - (a.left + a.width / 2)) + "px," + (b.top + b.height / 2 - (a.top + a.height / 2)) + "px) scale(.25)";
      dot.style.opacity = ".2";
    });
    setTimeout(() => dot.remove(), 800);
  };

  const mainAdd = (e) => {
    fly(e.currentTarget);
    addToCartHandler(product, qty);
    setAdded(true);
    setTimeout(() => { 
      setAdded(false); 
      setIsCartOpen(true); 
    }, 650);
  };

  const shareProduct = () => {
    setSharePulse(true);
    setTimeout(() => setSharePulse(false), 400);
    const shareUrl = `${window.location.origin}/share/product/${product.id}`;
    const shareText = product.description || `Check out ${product.name} on SWEETO!`;
    const shareData = {
      title: product.name,
      text: shareText,
      url: shareUrl,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('Share link copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy share link', 'error'));
    }
  };

  const setGalleryView = (i) => {
    if (i === view) return;
    if (REDUCED) { setView(i); return; }
    setSwitching(true);
    setTimeout(() => { setView(i); setSwitching(false); }, 200);
  };

  const pickColor = (c) => {
    setSelectedVariant(c);
    setView(0);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast("Please enter your name", "error");
    if (pick === 0) return showToast("Please select a star rating", "error");
    if (!form.body.trim()) return showToast("Please write a review comment", "error");

    const payload = {
      product_id: product.id,
      reviewer_name: form.name.trim(),
      rating: pick,
      comment: form.body.trim(),
      is_approved: 1,
      created_at: new Date().toISOString()
    };

    try {
      if (!supabase) throw new Error("Supabase client not initialized");
      const { error } = await supabase.from('reviews').insert([payload]);
      if (error) throw error;
      
      showToast("Review submitted successfully!", "success");
      fetchProductReviews();
      setForm({ name: "", email: "", title: "", body: "" });
      setPick(0);
      setModalOpen(false);
    } catch (err) {
      showToast("Failed to submit review", "error");
    }
  };

  const litCount = hoverPick || pick;
  const isWished = isInWishlist(product.id);

  return (
    <>
      <style>{css}</style>
      
      {/* Desktop Header */}
      <div className="hidden md:block w-full z-40 relative">
        <DesktopHeader 
          activePage="other" 
          onCartOpen={() => setIsCartOpen(true)}
          onSidebarOpen={() => setIsSidebarOpen(true)}
        />
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden w-full z-45 relative">
        <Header onSidebarOpen={() => setIsSidebarOpen(true)} onCartOpen={() => setIsCartOpen(true)} />
      </div>

      <div className="pdp-premium-container">
        <div className="noise" aria-hidden="true"></div>

        <div className="wrap select-none">
          {/* Breadcrumbs */}
          <div className="crumb">
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
            <i>/</i>
            <a href="#" onClick={(e) => { e.preventDefault(); handleCategoryBreadcrumb(); }}>
              {product.category || 'Electronics'}
            </a>
            <i>/</i>
            <b>{product.name}</b>
          </div>

          <section className="pdp">
            {/* Gallery Section */}
            <div className="gallery">
              <div
                className={"stage" + (zoomed ? " zoomed" : "") + (switching ? " switching" : "")}
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={(e) => {
                  if (!mainImgRef.current) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  mainImgRef.current.style.transformOrigin =
                    ((e.clientX - r.left) / r.width * 100).toFixed(1) + "% " + ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%";
                }}
              >
                <div className="breathe">
                  <img 
                    ref={mainImgRef} 
                    src={viewsArr[view]?.src || '/hero-banner.png'} 
                    alt={product.name} 
                  />
                </div>
                <div className="badges">
                  {discountPercent > 0 && <span className="badge sale">Save {discountPercent}%</span>}
                  <span className="badge new">Best Seller</span>
                </div>
                <span className="zoom-hint">Hover to zoom</span>
              </div>
              
              <div className="thumbs">
                {viewsArr.map((v, i) => (
                  <button 
                    key={v.label} 
                    className={"thumb" + (i === view ? " active" : "")} 
                    aria-label={v.label} 
                    onClick={() => setGalleryView(i)}
                  >
                    <img src={v.src} alt="" />
                  </button>
                ))}
              </div>
            </div>

            {/* Buy Box Info Section */}
            <div className="buybox" ref={buyboxRef}>
              <div className="eyebrow">{product.brand || 'SWEETO'} · {product.category || 'Electronics'}</div>
              <h1 className="pname">{product.name}</h1>
              
              <div className="rate-row">
                <Stars value={averageRating} />
                <b>{averageRating.toFixed(1)}</b>
                <a href="#reviews">{reviewCount} reviews</a>
              </div>
              
              <div className="price-row">
                <span className="price">{finalPrice.toLocaleString()} {currSymbol}</span>
                {oldPrice > finalPrice && <span className="compare">{oldPrice.toLocaleString()} {currSymbol}</span>}
                {savings > 0 && <span className="save">You save {savings.toLocaleString()} {currSymbol}</span>}
              </div>
              
              <p className="pdesc">{cleanDescription}</p>

              {/* Swatch Selector */}
              {variants.length > 0 && (
                <>
                  <div className="opt-label">Colour — <span>{selectedVariant?.name || 'Select Option'}</span></div>
                  <div className="swatches">
                    {variants.map((c) => (
                      <button 
                        key={c.id} 
                        className={"swatch" + (selectedVariant?.id === c.id ? " active" : "")} 
                        style={{ background: getHexColor(c.name) }} 
                        aria-label={c.name} 
                        onClick={() => pickColor(c)} 
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Purchase Actions */}
              <div className="buy-row">
                <div className="qty" aria-label="Quantity">
                  <button aria-label="Decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <output>{qty}</output>
                  <button aria-label="Increase" onClick={() => setQty((q) => Math.min(9, q + 1))}>+</button>
                </div>
                <button className={"btn-add" + (added ? " done" : "")} onClick={mainAdd}>
                  {added ? "Added ✓" : "Add to cart →"}
                </button>
                <button 
                  className={"btn-wish" + (isWished ? " on" : "")} 
                  aria-label="Add to wishlist"
                  onClick={() => {
                    toggleWishlist(product);
                    showToast(!isWished ? "Saved to your wishlist ♥" : "Removed from wishlist", "info");
                  }}
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M12 20s-7.5-4.7-9.5-9C1 7.5 3 4.5 6.5 4.5c2.2 0 3.9 1.3 5.5 3.4 1.6-2.1 3.3-3.4 5.5-3.4C21 4.5 23 7.5 21.5 11c-2 4.3-9.5 9-9.5 9z" />
                  </svg>
                </button>
                <button 
                  className={"btn-share" + (sharePulse ? " pulse" : "")} 
                  aria-label="Share this product" 
                  title="Share" 
                  onClick={shareProduct}
                >
                  <svg viewBox="0 0 24 24">
                    <circle cx="6" cy="12" r="2.6" />
                    <circle cx="17.5" cy="5.5" r="2.6" />
                    <circle cx="17.5" cy="18.5" r="2.6" />
                    <path d="M8.4 10.8l6.8-4M8.4 13.2l6.8 4" />
                  </svg>
                </button>
              </div>
              
              <button 
                className="btn-now" 
                onClick={() => {
                  addToCartHandler(product, qty);
                  setIsCartOpen(true);
                }}
              >
                Buy it now
              </button>

              {/* Trust Badges */}
              <div className="trust">
                <div>
                  <svg viewBox="0 0 24 24">
                    <path d="M1 8h13v9H1zM14 11h5l3 3v3h-8" />
                    <circle cx="6" cy="19" r="2" />
                    <circle cx="18" cy="19" r="2" />
                  </svg>
                  Free express shipping over $150
                </div>
                <div>
                  <svg viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 3-6.7" />
                    <path d="M3 4v5h5" />
                  </svg>
                  30-day no-fuss returns
                </div>
                <div>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                  2-year warranty included
                </div>
              </div>

              {/* Accordion Specs */}
              <div className="acc">
                {[
                  { t: "Description", body: (
                    <div className="acc-body">
                      The {product.name} delivers spatial acoustics paired with intelligent hardware. Built with high durability structural yokes and slow-rebound cushion pads to maximize focus and ensure fatigue-free operation.
                      {boxListItems.length > 0 && (
                        <ul className="boxlist">
                          {boxListItems.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div> ) },
                  { t: "Specifications", body: (
                    <div className="acc-body">
                      <dl className="spec">
                        {productSpecs.map((s, idx) => (
                          <React.Fragment key={idx}>
                            <dt>{s.label}</dt>
                            <dd>{s.value}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                    </div> ) },
                  { t: "Shipping & returns", body: (
                    <div className="acc-body">
                      Orders placed before 4 pm ship the same day. Express delivery (1–3 business days) is free over $150. Try the {product.name} at home for 30 days — if it isn't the one, returns are free and refunded in full within 48 hours of arrival.
                    </div> ) }
                ].map((item, i) => (
                  <div className={"acc-item" + (openAcc === i ? " open" : "")} key={item.t}>
                    <button className="acc-head" onClick={() => setOpenAcc((o) => (o === i ? -1 : i))}>
                      {item.t} 
                      <span className="pl">+</span>
                    </button>
                    <div className="acc-panel">
                      <div>{item.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Alternating Highlights Banners */}
        <section className="features wrap select-none">
          <div className="feat">
            <div className="feat-img reveal">
              <img src={feat1Img} alt="" loading="lazy" />
            </div>
            <div>
              <div className="eyebrow">{featureContent.feat1.eyebrow}</div>
              <h2 className="big lm"><span className="lm-in">{featureContent.feat1.title}</span></h2>
              <p className="reveal">{featureContent.feat1.desc}</p>
              <ul className="reveal">
                {featureContent.feat1.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="feat">
            <div className="feat-img reveal">
              <img src={feat2Img} alt="" loading="lazy" />
            </div>
            <div>
              <div className="eyebrow">{featureContent.feat2.eyebrow}</div>
              <h2 className="big lm"><span className="lm-in">{featureContent.feat2.title}</span></h2>
              <p className="reveal">{featureContent.feat2.desc}</p>
              <ul className="reveal">
                {featureContent.feat2.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews wrap select-none" id="reviews">
          <div className="rev-head">
            <div>
              <div className="eyebrow">From the listening room</div>
              <h2 className="big lm">
                <span className="lm-in">
                  {reviewCount} honest <em>ears.</em>
                </span>
              </h2>
            </div>
            <button className="pill" onClick={() => setModalOpen(true)}>✎ &nbsp;Write a review</button>
          </div>
          
          <div className="rev-grid">
            {/* Score Card Panel */}
            <aside className="rev-sum reveal">
              <div className="rev-score">
                <b>{averageRating.toFixed(1)}</b>
                <div>
                  <Stars value={averageRating} />
                  <br />
                  <span>Based on {reviewCount} reviews</span>
                </div>
              </div>
              <div className="bars" id="bars">
                {buckets.map((b, i) => (
                  <div className="bar-row" key={i}>
                    <span>{5 - i} ★</span>
                    <div className="bar">
                      <div className="bar-fill" style={{ width: b + "%" }}></div>
                    </div>
                    <span>{b}%</span>
                  </div>
                ))}
              </div>
            </aside>
            
            {/* Reviews Cards List */}
            <div>
              <div className="filters">
                {["all", "5", "4", "3"].map((f) => (
                  <button 
                    key={f} 
                    className={"pill" + (filter === f ? " active" : "")} 
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f + " ★"}
                  </button>
                ))}
              </div>
              
              <div className="rev-cards">
                {visibleReviews.length === 0 ? (
                  <div className="text-slate-400 py-10 font-bold col-span-2 text-center select-none">
                    No reviews in this category yet. Be the first to share your thoughts!
                  </div>
                ) : (
                  visibleReviews.map((r, idx) => (
                    <article className={"rev-card" + (r.fresh ? " fresh" : "")} key={r.name + idx}>
                      <div className="rev-top">
                        <span className="ava" style={{ background: r.ava }}>{initialsOf(r.name)}</span>
                        <div className="rev-who">
                          <b>{r.name}</b>
                          <span>{r.date}</span>
                        </div>
                        {r.verified ? <span className="verif">✓ Verified</span> : <span className="verif fresh-tag">★ New</span>}
                      </div>
                      <Stars value={r.rating} />
                      <h4>{r.title}</h4>
                      <p>{r.body}</p>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Complete the Ritual (Related Products) */}
        {relatedProducts.length > 0 && (
          <section className="related wrap select-none">
            <div className="eyebrow">Complete the ritual</div>
            <h2 className="big lm"><span className="lm-in">Pairs well <em>with.</em></span></h2>
            <div className="rel-grid">
              {relatedProducts.map((p) => (
                <div className="rel-card reveal" key={p.id}>
                  <div className="rel-img">
                    <img 
                      src={p.image_url || p.image || '/hero-banner.png'} 
                      alt={p.name} 
                      loading="lazy" 
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="rel-body">
                    <b>{p.name}</b>
                    <span>{p.price?.toLocaleString()} {currSymbol}</span>
                  </div>
                  <button 
                    className="rel-add" 
                    aria-label={"Add " + p.name + " to cart"}
                    onClick={(e) => { 
                      fly(e.currentTarget); 
                      addToCartHandler(p, 1); 
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* More to Love Section */}
        {moreToLoveProducts.length > 0 && (
          <section className="related wrap select-none" style={{ paddingTop: '20px', paddingBottom: '80px' }}>
            <div className="eyebrow">Discover new drops</div>
            <h2 className="big lm"><span className="lm-in">More to <em>love.</em></span></h2>
            <div className="rel-grid">
              {moreToLoveProducts.map((p) => (
                <div className="rel-card reveal" key={p.id}>
                  <div className="rel-img">
                    <img 
                      src={p.image_url || p.image || '/hero-banner.png'} 
                      alt={p.name} 
                      loading="lazy" 
                      onClick={() => {
                        navigate(`/product/${p.id}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="rel-body">
                    <b>{p.name}</b>
                    <span>{p.price?.toLocaleString()} {currSymbol}</span>
                  </div>
                  <button 
                    className="rel-add" 
                    aria-label={"Add " + p.name + " to cart"}
                    onClick={(e) => { 
                      fly(e.currentTarget); 
                      addToCartHandler(p, 1); 
                    }}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

      {/* Floating Cart FAB */}
      <button 
        className="fab" 
        ref={fabRef} 
        aria-label="Open cart" 
        onClick={() => setIsCartOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 fill-[#1F6FEB] stroke-[#1F6FEB]">
          <path d="M6 8h12l-1.2 12H7.2L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>
        <span id="cartCount" className={(cartCount > 0 ? "on " : "") + (badgePop ? "pop" : "")}>
          {cartCount}
        </span>
      </button>


      {/* Write a Review Modal */}
      <div className={"modal" + (modalOpen ? " on" : "")} aria-hidden={!modalOpen}>
        <div className="modal-back" onClick={() => setModalOpen(false)}></div>
        <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="revModalTitle">
          <button className="modal-x" aria-label="Close" onClick={() => setModalOpen(false)}>✕</button>
          <div className="eyebrow">Your ears, your verdict</div>
          <h3 className="modal-title" id="revModalTitle">Write a review</h3>
          <form onSubmit={submitReview} noValidate>
            <div className="f-row">
              <label>Name
                <input 
                  value={form.name} 
                  maxLength="40" 
                  placeholder="Maya R." 
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} 
                />
              </label>
              <label>Email — not published
                <input 
                  type="email" 
                  value={form.email} 
                  placeholder="you@email.com" 
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} 
                />
              </label>
            </div>
            
            <div className="f-rate">
              <span className="f-label">Your rating</span>
              <div className="star-pick" onMouseLeave={() => setHoverPick(0)}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <button 
                    key={v} 
                    type="button" 
                    className={v <= litCount ? "lit" : ""} 
                    aria-label={v + " star" + (v > 1 ? "s" : "")}
                    onClick={() => setPick(v)} 
                    onMouseEnter={() => setHoverPick(v)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6z" />
                    </svg>
                  </button>
                ))}
              </div>
              <span className="f-hint">{HINTS[pick]}</span>
            </div>
            
            <label>Title
              <input 
                value={form.title} 
                maxLength="70" 
                placeholder="Sum it up in one line" 
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} 
              />
            </label>
            
            <label>Review
              <textarea 
                rows="4" 
                maxLength="600" 
                value={form.body} 
                placeholder="What did you hear? Comfort, battery, silence — tell it like it is." 
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              ></textarea>
            </label>
            
            <button className="modal-submit" type="submit">Post review →</button>
          </form>
        </div>
      </div>
      </div>

      {/* Global Sidebar Drawer */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Global Checkout Cart Drawer */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
}
