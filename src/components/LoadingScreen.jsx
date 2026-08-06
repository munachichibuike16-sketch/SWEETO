import React, { useEffect, useMemo, useState } from 'react';

const STATUS_LIST = [
  "Warming up the storefront…",
  "Stocking today's deals…",
  "Counting inventory…",
  "Polishing the shopping carts…",
  "Applying member prices…",
  "Unboxing fresh drops…",
  "Almost there…",
];

const FLOAT_EMOJI = ["🛍️", "🛒", "🏷️", "💳", "📦", "✨", "🎁", "💙", "🧾", "⭐"];

const CSS = `
@import url('https://cdn.jsdelivr.net/fontsource/css/montserrat@latest/800.css');
@import url('https://cdn.jsdelivr.net/fontsource/css/inter@latest/400.css');
@import url('https://cdn.jsdelivr.net/fontsource/css/inter@latest/500.css');
@import url('https://cdn.jsdelivr.net/fontsource/css/inter@latest/700.css');

:root{
  --blue:#2563eb; --blue-deep:#1656d6; --sky:#4fb2f4; --sky-soft:#8ed0fa;
  --ink:#232b36; --muted:#64748b;
}

/* ============ LOADING SCREEN — blue shining glass ============ */
.loader{
  position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;
  background:
    radial-gradient(1000px 620px at 82% -12%, rgba(255,255,255,.85) 0%, rgba(255,255,255,0) 60%),
    radial-gradient(900px 560px at 8% 112%, rgba(59,130,246,.35) 0%, rgba(59,130,246,0) 62%),
    radial-gradient(700px 460px at 50% 45%, rgba(147,197,253,.45) 0%, rgba(147,197,253,0) 70%),
    linear-gradient(160deg, #dbeafe 0%, #cddffc 45%, #b7d4fa 100%);
}
.loader::before{
  content:"";position:absolute;inset:0;
  background-image:radial-gradient(rgba(255,255,255,.75) 1px, transparent 1px);
  background-size:22px 22px;opacity:.5;pointer-events:none;
}

.shine-band{position:absolute;top:-25%;left:-35%;width:55%;height:150%;pointer-events:none;
  transform:rotate(18deg);
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.32),transparent);
  animation:bandMove 6.5s ease-in-out infinite}
.shine-band.band2{animation-delay:3.2s;opacity:.6;width:35%}
@keyframes bandMove{0%{transform:translateX(-70%) rotate(18deg)}60%,100%{transform:translateX(240%) rotate(18deg)}}

.orb{position:absolute;border-radius:50%;pointer-events:none;
  background:radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.28) 42%, rgba(147,197,253,.18) 100%);
  border:1px solid rgba(255,255,255,.65);
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
  box-shadow:0 14px 40px rgba(37,99,235,.18), inset 0 2px 10px rgba(255,255,255,.7), inset 0 -6px 14px rgba(59,130,246,.12);
  animation:orbFloat ease-in-out infinite}
@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-26px) scale(1.04)}}

.float-layer{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.float-layer span{position:absolute;opacity:.13;filter:saturate(.9);animation:floatY ease-in-out infinite}
@keyframes floatY{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-22px) rotate(5deg)}}

/* central glass card */
.loader-core{
  position:relative;display:flex;flex-direction:column;align-items:center;
  padding:42px 36px 34px;width:min(560px,92vw);
  border-radius:34px;overflow:hidden;
  background:linear-gradient(150deg, rgba(255,255,255,.68) 0%, rgba(255,255,255,.30) 55%, rgba(219,234,254,.35) 100%);
  border:1px solid rgba(255,255,255,.8);
  backdrop-filter:blur(22px) saturate(1.5);-webkit-backdrop-filter:blur(22px) saturate(1.5);
  box-shadow:0 30px 70px rgba(30,64,175,.22),
             inset 0 1px 0 rgba(255,255,255,.95),
             inset 0 -1px 0 rgba(255,255,255,.4);
  transition:opacity .45s ease, transform .45s ease;
}
.loader-core::after{content:"";position:absolute;top:-45%;left:-65%;width:46%;height:190%;
  transform:rotate(20deg);pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);
  animation:coreShine 3.8s ease-in-out infinite}
@keyframes coreShine{0%{left:-65%}55%,100%{left:135%}}
.loader.swap-out .loader-core{opacity:0;transform:scale(.94)}

/* logo stage */
.logo-stage{position:relative;width:180px;height:180px;display:grid;place-items:center;
  animation:popIn .8s .2s cubic-bezier(.2,1.4,.4,1) both}
.logo-stage::before{content:"";position:absolute;inset:-14%;border-radius:50%;
  background:radial-gradient(circle, rgba(79,178,244,.32) 0%, rgba(79,178,244,0) 65%);
  animation:glowPulse 2.6s ease-in-out infinite}
@keyframes glowPulse{0%,100%{transform:scale(.92);opacity:.7}50%{transform:scale(1.08);opacity:1}}
.orbit-ring{position:absolute;border-radius:50%;pointer-events:none}
.ring1{inset:0;border:2px dashed rgba(37,99,235,.30);animation:spinOrbit 12s linear infinite}
.ring2{inset:-16px;border:2px solid rgba(79,178,244,.20);border-top-color:rgba(37,99,235,.60);animation:spinOrbit 7s linear infinite reverse}
@keyframes spinOrbit{to{transform:rotate(360deg)}}
.logo-mark{width:142px;height:142px;object-fit:contain;
  filter:drop-shadow(0 14px 24px rgba(37,99,235,.28));
  animation:floatLogo 3.4s ease-in-out 1.1s infinite}
@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes popIn{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:scale(1)}}

.ready-badge{position:absolute;right:6px;top:8px;width:44px;height:44px;border-radius:50%;
  background:linear-gradient(135deg,#34d399,#0ea5e9);color:#fff;font-size:20px;font-weight:700;
  display:grid;place-items:center;box-shadow:0 8px 18px rgba(14,165,233,.45), inset 0 2px 6px rgba(255,255,255,.5);
  transform:scale(0)}
.loader.done .ready-badge{animation:badgePop .55s cubic-bezier(.2,1.6,.4,1) both}
@keyframes badgePop{from{transform:scale(0) rotate(-90deg)}to{transform:scale(1) rotate(0)}}
.loader.done .logo-mark{animation:happyBounce .7s ease both}
@keyframes happyBounce{0%{transform:scale(1)}30%{transform:scale(1.12) translateY(-8px)}60%{transform:scale(.97)}100%{transform:scale(1)}}

/* brand text */
.brand-lines{display:flex;flex-direction:column;align-items:center;margin-top:6px;user-select:none}
.brand-sweeto{font-family:'Montserrat',sans-serif;font-weight:800;font-size:clamp(28px,6vw,40px);
  letter-spacing:.14em;line-height:1.05;white-space:nowrap;
  background:linear-gradient(90deg,#222b36 20%,#5b6b80 80%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  animation:fadeUp .6s 1s both}
.brand-hub{font-family:'Montserrat',sans-serif;font-weight:800;font-size:clamp(22px,4.6vw,30px);
  letter-spacing:.3em;color:#2f7ff0;margin-top:2px;text-indent:.3em;white-space:nowrap;
  text-shadow:0 2px 12px rgba(47,127,240,.35);
  animation:fadeUp .6s 1.15s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* progress — glass track */
.progress-zone{width:min(420px,82vw);margin-top:30px;animation:fadeUp .6s 1.35s both}
.track{position:relative;height:12px;border-radius:999px;
  background:rgba(255,255,255,.55);
  border:1px solid rgba(255,255,255,.85);
  box-shadow:inset 0 2px 5px rgba(30,64,175,.15), 0 1px 0 rgba(255,255,255,.7)}
.fill{position:relative;height:100%;width:0%;border-radius:999px;overflow:hidden;
  background:linear-gradient(90deg,var(--sky),var(--blue));
  box-shadow:0 4px 16px rgba(37,99,235,.45), inset 0 2px 3px rgba(255,255,255,.55), inset 0 -2px 4px rgba(22,86,214,.4);
  transition:width .12s linear}
.fill .shine{position:absolute;inset:0;width:45%;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);
  animation:shineMove 1.15s linear infinite}
@keyframes shineMove{from{transform:translateX(-120%)}to{transform:translateX(320%)}}
.cart-pin{position:absolute;top:-30px;left:0%;transform:translateX(-50%);font-size:22px;
  filter:drop-shadow(0 4px 6px rgba(35,43,54,.3));transition:left .12s linear;
  animation:pinBob 1s ease-in-out infinite}
@keyframes pinBob{0%,100%{margin-top:0}50%{margin-top:-4px}}
.loader.done .cart-pin{opacity:0;transition:opacity .4s}
.meta{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;gap:12px}
.msg{font-size:14px;font-weight:500;color:var(--muted);animation:msgIn .3s ease}
@keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
.pct{font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:#1e3a8a;font-variant-numeric:tabular-nums}

/* "from SWEETO" credit — bottom of card */
.from-lockup{display:flex;flex-direction:column;align-items:center;gap:7px;margin-top:32px;
  animation:fadeUp .7s 1.6s cubic-bezier(.2,.9,.3,1) both}
.from-word{font-size:15px;font-weight:600;color:#5b6b80;letter-spacing:.04em}
.from-brand{font-family:'Montserrat',sans-serif;font-weight:800;font-size:clamp(20px,4.4vw,27px);
  letter-spacing:.22em;text-indent:.22em;
  background:linear-gradient(90deg,#38a2f8 0%,#2f6bf0 55%,#5b4bf0 100%);
  -webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 6px 14px rgba(47,107,240,.35))}

/* glass marquee bar */
.marquee{position:absolute;bottom:0;left:0;right:0;overflow:hidden;padding:14px 0;
  background:rgba(255,255,255,.42);
  backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);
  border-top:1px solid rgba(255,255,255,.75);
  box-shadow:0 -8px 30px rgba(30,64,175,.10)}
.marquee-track{display:inline-flex;gap:56px;white-space:nowrap;animation:marqueeScroll 22s linear infinite;
  font-size:13px;font-weight:500;color:#3b5285;letter-spacing:.04em}
.marquee-track b{color:var(--blue);font-weight:700}
@keyframes marqueeScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}

@media (max-width:600px){
  .loader-core{padding:32px 22px 26px;border-radius:26px}
  .logo-stage{width:150px;height:150px}
  .logo-mark{width:118px;height:118px}
  .from-lockup{margin-top:26px}
}
@media (prefers-reduced-motion:reduce){
  *{animation-duration:.01ms !important;animation-iteration-count:1 !important;transition-duration:.2s !important}
}
`;

export default function LoadingScreen({ isVisible }) {
  const [prog, setProg] = useState(0);
  const [status, setStatus] = useState(STATUS_LIST[0]);
  const [done, setDone] = useState(false);
  const [swapOut, setSwapOut] = useState(false);
  const [show, setShow] = useState(true);

  // Set body overflow hidden during loading
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  // Restart sequence when visible
  useEffect(() => {
    if (isVisible) {
      setProg(0);
      setDone(false);
      setSwapOut(false);
      setShow(true);
      setStatus(STATUS_LIST[0]);
    }
  }, [isVisible]);

  // Progress animation sequence
  useEffect(() => {
    if (!show) return;

    let target = 0;
    let value = 0;
    let msgIdx = 0;
    let finished = false;

    const msgTimer = setInterval(() => {
      if (finished) return;
      msgIdx = (msgIdx + 1) % STATUS_LIST.length;
      setStatus(STATUS_LIST[msgIdx]);
    }, 400);

    const progTimer = setInterval(() => {
      if (finished) return;
      
      clearInterval(progTimer);
      clearInterval(msgTimer);
      setProg(100);
      setDone(true);
      setStatus("Ready! Opening the doors…");
      finished = true;

      // Trigger exit sequence safely and instantly after 15ms
      setTimeout(() => {
        setSwapOut(true);
        setTimeout(() => {
          setShow(false);
        }, 80);
      }, 15);
    }, 15);

    return () => {
      clearInterval(progTimer);
      clearInterval(msgTimer);
    };
  }, [show]);

  /* floating background icons */
  const floatIcons = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        emoji: FLOAT_EMOJI[i % FLOAT_EMOJI.length],
        left: 4 + Math.random() * 90,
        top: 6 + Math.random() * 80,
        size: 16 + Math.random() * 18,
        dur: 5 + Math.random() * 4,
        delay: -Math.random() * 5,
      })),
    []
  );

  if (!show) return null;

  const barWidth = prog.toFixed(1) + "%";
  const perks = [
    "Free shipping over $50",
    "30-day easy returns",
    "New drops every Friday",
    "Members earn Sweeto Points",
    "Secure checkout",
  ];

  return (
    <>
      <style>{CSS}</style>

      <div className={`loader${done ? " done" : ""}${swapOut ? " swap-out" : ""}`}>
        <div className="shine-band"></div>
        <div className="shine-band band2"></div>

        {/* floating glass orbs */}
        <div className="orb" style={{ width: 120, height: 120, left: "8%", top: "16%", animationDuration: "7s" }}></div>
        <div className="orb" style={{ width: 64, height: 64, left: "18%", top: "64%", animationDuration: "5.5s", animationDelay: "-2s" }}></div>
        <div className="orb" style={{ width: 90, height: 90, right: "10%", top: "22%", animationDuration: "6.5s", animationDelay: "-1s" }}></div>
        <div className="orb" style={{ width: 46, height: 46, right: "20%", top: "70%", animationDuration: "5s", animationDelay: "-3s" }}></div>
        <div className="orb" style={{ width: 34, height: 34, left: "42%", top: "8%", animationDuration: "6s", animationDelay: "-4s" }}></div>

        <div className="float-layer">
          {floatIcons.map((ic) => (
            <span
              key={ic.id}
              style={{
                left: ic.left + "%",
                top: ic.top + "%",
                fontSize: ic.size + "px",
                animationDuration: ic.dur + "s",
                animationDelay: ic.delay + "s",
              }}
            >
              {ic.emoji}
            </span>
          ))}
        </div>

        <div className="loader-core">
          <div className="logo-stage">
            <div className="orbit-ring ring1"></div>
            <div className="orbit-ring ring2"></div>
            <img
              className="logo-mark"
              src="/sweeto_logo.png?v=2"
              alt="Sweeto Hub Logo"
            />
            <span className="ready-badge">✓</span>
          </div>

          <div className="brand-lines">
            <span className="brand-sweeto">SWEETO</span>
            <span className="brand-hub">HUB</span>
          </div>

          <div className="progress-zone">
            <div className="track">
              <div className="fill" style={{ width: barWidth }}>
                <i className="shine"></i>
              </div>
              <span className="cart-pin" style={{ left: barWidth }}>🛒</span>
            </div>
            <div className="meta">
              <span className="msg" key={status}>{status}</span>
              <span className="pct">{Math.round(prog)}%</span>
            </div>
          </div>

          {/* "from SWEETO" credit at the bottom */}
          <div className="from-lockup">
            <span className="from-word">from</span>
            <span className="from-brand">SWEETO</span>
          </div>
        </div>

        <div className="marquee">
          <div className="marquee-track">
            {[...perks, ...perks].map((perk, i) => (
              <span key={i}>
                <b>✦</b> {perk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
