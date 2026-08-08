import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const OFFER_MS = (((6 * 24 + 23) * 60 + 41) * 60 + 32) * 1000;
const padTwo = (n) => String(n).padStart(2, "0");

const CSS = `
.mb-banner-stage {
  font-family: "Nunito", sans-serif;
  width: 100%;
  display: block;
  padding: 16px 0;
}

/* ---------- banner ---------- */
.mb-banner {
  position: relative;
  width: 100%;
  background: #0b0f16;
  border-radius: 24px;
  overflow: hidden;
  padding: 38px 24px;
  box-shadow: 0 25px 60px -25px rgba(5, 10, 20, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.mb-banner-logo {
  position: absolute;
  top: 50%;
  right: -10%;
  width: 58%;
  transform: translateY(-50%);
  mix-blend-mode: screen;
  opacity: .5;
  pointer-events: none;
  user-select: none;
  animation: mbLogoDrift 9s ease-in-out infinite;
}
@keyframes mbLogoDrift {
  50% { transform: translateY(-52%) scale(1.03); }
}
.mb-banner-shade {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, #0b0f16 35%, rgba(11, 15, 22, 0.6) 65%, rgba(11, 15, 22, 0.1) 90%);
}
.mb-banner-shade::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(120% 90% at 0% 0%, rgba(11, 15, 22, 0.35), transparent 55%);
}

.mb-content {
  position: relative;
  z-index: 2;
  max-width: 100%;
  text-align: left;
}
.mb-content > * {
  animation: mbRiseIn .7s cubic-bezier(.22, 1, .36, 1) both;
}
.mb-content > *:nth-child(2) { animation-delay: .08s }
.mb-content > *:nth-child(3) { animation-delay: .16s }
.mb-content > *:nth-child(4) { animation-delay: .24s }
.mb-content > *:nth-child(5) { animation-delay: .32s }
@keyframes mbRiseIn {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

/* ---------- badge ---------- */
.mb-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1F6FEB;
  color: #fff;
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: 1.4px;
  padding: 8px 18px;
  border-radius: 999px;
  box-shadow: 0 6px 18px -6px rgba(31, 111, 235, 0.5);
  text-transform: uppercase;
}

.mb-title {
  color: #fff;
  font-weight: 800;
  letter-spacing: -.3px;
  font-size: 1.75rem;
  margin: 18px 0 10px;
  line-height: 1.25;
}
.mb-sub {
  color: #c3cad2;
  font-size: .88rem;
  font-weight: 600;
  margin-bottom: 24px;
  line-height: 1.4;
}

/* ---------- countdown ---------- */
.mb-timer {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
}
.mb-t-box {
  min-width: 70px;
  padding: 12px 8px 10px;
  text-align: center;
  background: rgba(52, 58, 66, 0.65);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.5);
}
.mb-t-num {
  display: block;
  color: #fff;
  font-weight: 800;
  font-size: 1.55rem;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.mb-t-num.pop {
  animation: mbPop .3s ease;
}
@keyframes mbPop {
  40% { transform: scale(1.16); }
}
.mb-t-lbl {
  display: block;
  margin-top: 5px;
  color: #aeb6bf;
  font-size: .58rem;
  font-weight: 700;
  letter-spacing: 1.4px;
}

/* ---------- buttons ---------- */
.mb-actions {
  display: flex;
  gap: 12px;
  width: 100%;
}
.mb-btn {
  font-family: "Nunito", sans-serif;
  cursor: pointer;
  border-radius: 999px;
  font-weight: 800;
  font-size: .88rem;
  padding: 14px 24px;
  transition: transform .25s, box-shadow .25s, background .25s, border-color .25s;
  flex: 1;
  text-align: center;
  border: none;
}
.mb-btn-primary {
  color: #fff;
  background: #1F6FEB;
  box-shadow: 0 0 0 1px rgba(255,255,255,.12) inset, 0 8px 25px -6px rgba(31, 111, 235, 0.6);
}
.mb-btn-primary:hover {
  transform: translateY(-2px);
  background: #1554C0;
  box-shadow: 0 0 0 1px rgba(255,255,255,.16) inset, 0 12px 30px -6px rgba(31, 111, 235, 0.7);
}
.mb-btn-primary .arr {
  display: inline-block;
  transition: transform .25s;
}
.mb-btn-primary:hover .arr {
  transform: translateX(4px);
}
.mb-btn-ghost {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
.mb-btn-ghost:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* ---------- toast ---------- */
.mb-toast {
  position: fixed;
  left: 50%;
  bottom: 90px;
  transform: translate(-50%, 90px);
  z-index: 2000;
  background: #161a22;
  color: #fff;
  font-weight: 700;
  font-size: .8rem;
  padding: 11px 22px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 16px 40px -12px rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: .4s cubic-bezier(.22, 1, .36, 1);
  pointer-events: none;
  white-space: nowrap;
}
.mb-toast.show {
  transform: translate(-50%, 0);
  opacity: 1;
}
.mb-toast b {
  color: #60a5fa;
}
`;

export default function MobileBottomBanner({ settings }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  
  const isEnabled = settings?.mobile_bottom_banner_enabled !== false && settings?.mobile_bottom_banner_enabled !== 'false';
  
  const [endTime] = useState(() => {
    let target = Number(settings?.mobile_bottom_banner_target_time);
    if (!target || target - Date.now() <= 0) {
      return Date.now() + OFFER_MS;
    }
    return target;
  });

  const [msLeft, setMsLeft] = useState(() => Math.max(0, endTime - Date.now()));
  const [toast, setToast] = useState({ node: null, show: false });
  const toastTimer = useRef(null);

  /* Live countdown loop */
  useEffect(() => {
    const tickId = setInterval(() => {
      setMsLeft(Math.max(0, endTime - Date.now()));
    }, 250);
    return () => clearInterval(tickId);
  }, [endTime]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (!isEnabled) return null;

  const days  = Math.floor(msLeft / 864e5);
  const hours = Math.floor(msLeft / 36e5) % 24;
  const mins  = Math.floor(msLeft / 6e4) % 60;
  const secs  = Math.floor(msLeft / 1e3) % 60;

  const timeUnits = [
    { value: days,  label: lang === 'fr' ? "JOURS" : "DAYS"  },
    { value: hours, label: lang === 'fr' ? "HEURES" : "HOURS" },
    { value: mins,  label: "MINS"  },
    { value: secs,  label: "SECS"  },
  ];

  const showToast = (node, path) => {
    setToast({ node, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }));
      if (path) navigate(path);
    }, 1500);
  };

  return (
    <div className="mb-banner-stage block lg:hidden">
      <style>{CSS}</style>

      <section className="mb-banner">
        <img
          className="mb-banner-logo"
          src="https://image.qwenlm.ai/public_source/8ca7834a-3f50-4eb5-b927-73a76f237ff4/100195490-db12-4502-abb0-045ee4804108.png"
          alt="Banner Brand"
        />
        <div className="mb-banner-shade" />

        <div className="mb-content">
          <span className="mb-badge">🔥 {lang === 'fr' ? 'OFFRE LIMITÉE' : 'LIMITED TIME OFFER'}</span>

          <h1 className="mb-title">{lang === 'fr' ? 'Catégories Pour Vous' : 'Categories For You'}</h1>
          <p className="mb-sub">
            {lang === 'fr' 
              ? 'Dépêchez-vous! Profitez de réductions allant jusqu’à 50% sur notre collection.' 
              : 'Hurry! Take advantage of discounts of up to 50% on our collection.'}
          </p>

          <div className="mb-timer" aria-label="Offer countdown">
            {timeUnits.map((unit) => (
              <div className="mb-t-box" key={unit.label}>
                <span className="mb-t-num pop" key={unit.value}>{padTwo(unit.value)}</span>
                <span className="mb-t-lbl">{unit.label}</span>
              </div>
            ))}
          </div>

          <div className="mb-actions">
            <button
              type="button"
              className="mb-btn mb-btn-primary"
              onClick={() => showToast(
                lang === 'fr' 
                  ? <>🛍️ Ouverture des offres avec <b>remise supplémentaire</b>…</> 
                  : <>🛍️ Opening deals with <b>extra discount</b>…</>,
                '/deals'
              )}
            >
              {lang === 'fr' ? 'Acheter' : 'Shop Now'} <span className="arr">→</span>
            </button>
            <button
              type="button"
              className="mb-btn mb-btn-ghost"
              onClick={() => showToast(
                lang === 'fr' 
                  ? <>🧭 Exploration de <b>toutes les catégories</b>…</> 
                  : <>🧭 Browsing <b>all categories</b> for you…</>,
                '/'
              )}
            >
              {lang === 'fr' ? 'Voir Tout' : 'View All'}
            </button>
          </div>
        </div>
      </section>

      <div className={`mb-toast${toast.show ? " show" : ""}`}>{toast.node}</div>
    </div>
  );
}
