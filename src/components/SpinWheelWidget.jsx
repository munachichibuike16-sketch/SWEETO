import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Copy, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useStore } from '../contexts/StoreContext';
import { playSound } from '../utils/sound';

const segments = [
  { label: '5% OFF', code: 'SWEETO5', color: '#0052FF' },
  { label: 'TRY AGAIN', code: null, color: '#1e293b' },
  { label: '10% OFF', code: 'ELITE10', color: '#FF6600' },
  { label: 'FREE SHIP', code: 'FREESHIP', color: '#10b981' },
  { label: '15% OFF', code: 'SWEET15', color: '#8b5cf6' },
  { label: 'TRY AGAIN', code: null, color: '#1e293b' }
];

export default function SpinWheelWidget() {
  const { settings } = useStore();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const spun = localStorage.getItem('sweetohub_wheel_spun') === 'true';
    setHasSpun(spun);
    if (spun) {
      const wonCode = localStorage.getItem('sweetohub_win_code');
      if (wonCode) {
        const match = segments.find(s => s.code === wonCode);
        if (match) {
          setWinningSegment(match);
        } else {
          setWinningSegment({ label: 'FREE SHIP', code: wonCode, color: '#10b981' });
        }
      }
    }

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('open-spin-wheel', handleOpenEvent);
    return () => window.removeEventListener('open-spin-wheel', handleOpenEvent);
  }, [settings]);

  const handleSpin = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setWinningSegment(null);
    setCopied(false);

    // Pick a winning index (favoring discounts, index 0, 2, 3, or 4)
    const possibleWinners = [0, 2, 3, 4];
    const winningIndex = possibleWinners[Math.floor(Math.random() * possibleWinners.length)];
    
    const numSegments = segments.length;
    const angleStep = 360 / numSegments;
    
    // 5 full rotations (1800 deg) + angle for the segment
    const targetAngle = 1800 + (360 - (winningIndex * angleStep) - (angleStep / 2));
    
    setRotation(targetAngle);

    // Play spin sound effect if available
    try {
      playSound?.('click');
    } catch (e) {}

    setTimeout(() => {
      setIsSpinning(false);
      
      const wonSeg = { ...segments[winningIndex] };
      if (winningIndex === 3) {
        wonSeg.code = settings?.free_delivery_code || 'FREESHIP';
      }

      setWinningSegment(wonSeg);
      setHasSpun(true);
      localStorage.setItem('sweetohub_wheel_spun', 'true');
      
      // Save winning code in session to prefill coupon inputs
      if (wonSeg.code) {
        localStorage.setItem('sweetohub_win_code', wonSeg.code);
      }
      
      try {
        playSound?.('success');
      } catch (e) {}
    }, 4100);
  };

  const handleCopy = () => {
    if (!winningSegment?.code) return;
    navigator.clipboard.writeText(winningSegment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderWheelSegments = () => {
    const numSegments = segments.length;
    const angleStep = 360 / numSegments;
    return segments.map((seg, i) => {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;
      const radius = 120;
      const cx = 150;
      const cy = 150;

      // Polar to Cartesian
      const x1 = cx + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
      const y1 = cy + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
      const x2 = cx + radius * Math.cos((Math.PI * (endAngle - 90)) / 180);
      const y2 = cy + radius * Math.sin((Math.PI * (endAngle - 90)) / 180);
      
      const largeArcFlag = angleStep > 180 ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      const textAngle = startAngle + angleStep / 2;
      const textX = cx + (radius * 0.65) * Math.cos((Math.PI * (textAngle - 90)) / 180);
      const textY = cy + (radius * 0.65) * Math.sin((Math.PI * (textAngle - 90)) / 180);
      
      return (
        <g key={i} className="select-none">
          <path d={pathData} fill={seg.color} stroke="#0f172a" strokeWidth="2.5" />
          <text
            x={textX}
            y={textY}
            fill="#ffffff"
            fontSize="8.5"
            fontWeight="900"
            textAnchor="middle"
            transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
          >
            {seg.label}
          </text>
        </g>
      );
    });
  };

  return (
    <>
      {/* Spin Wheel Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="relative w-full max-w-sm bg-[#090d16]/95 border border-slate-800/80 rounded-[2.5rem] p-8 text-center space-y-6 overflow-hidden shadow-2xl"
            >
              {/* Glowing header bar */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
              
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <X size={15} />
              </button>

              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  {lang === 'fr' ? 'Roue de la Chance' : 'Lucky Spin'}
                </span>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tight mt-3">
                  {lang === 'fr' ? 'GAGNEZ UN CADEAU !' : 'SPIN TO WIN!'}
                </h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-relaxed uppercase tracking-wider">
                  {lang === 'fr' 
                    ? 'Tournez la roue pour débloquer votre réduction exclusive.' 
                    : 'Spin the wheel to unlock your exclusive discount code.'}
                </p>
              </div>

              {/* The SVG Wheel Dial */}
              <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
                {/* Pointer Arrow */}
                <div className="absolute top-0 z-20 w-5 h-6 bg-orange-500 rounded-t-full rounded-b-md shadow-lg shadow-orange-500/30 transform translate-y-[-10px]">
                  <div className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[14px] border-t-orange-500 absolute bottom-[-10px] left-0"></div>
                </div>

                {/* Outer Glow Ring */}
                <div className="absolute inset-2 rounded-full border-[8px] border-slate-800 shadow-[0_0_20px_rgba(249,115,22,0.15)] pointer-events-none"></div>

                <motion.svg
                  width="250"
                  height="250"
                  viewBox="0 0 300 300"
                  animate={{ rotate: rotation }}
                  transition={{ duration: 4, ease: [0.12, 0.8, 0.15, 1] }}
                  className="w-64 h-64 drop-shadow-[0_12px_24px_rgba(0,0,0,0.4)]"
                >
                  <circle cx="150" cy="150" r="140" fill="#090d16" />
                  {renderWheelSegments()}
                  <circle cx="150" cy="150" r="30" fill="#0f172a" stroke="#f97316" strokeWidth="4" />
                </motion.svg>

                {/* Center Spin Button overlay */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || hasSpun}
                  className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-[11px] uppercase tracking-wider shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all z-10 flex items-center justify-center cursor-pointer"
                >
                  {isSpinning ? '...' : (hasSpun ? 'Done' : 'SPIN')}
                </button>
              </div>

              {/* Winning Results */}
              <AnimatePresence>
                {winningSegment && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-white/5 border border-white/5 rounded-3xl space-y-3.5"
                  >
                    <div className="flex items-center justify-center gap-2 text-orange-500">
                      <Sparkles size={16} className="animate-spin" />
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {lang === 'fr' ? 'FÉLICITATIONS !' : 'CONGRATULATIONS!'}
                      </span>
                      <Sparkles size={16} className="animate-spin" />
                    </div>
                    <p className="text-sm font-bold text-slate-200">
                      {lang === 'fr' 
                        ? `Vous avez gagné : ${winningSegment.label}` 
                        : `You won: ${winningSegment.label}`}
                    </p>
                    
                    {winningSegment.code && (
                      <div className="flex items-center gap-2 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                        <code className="flex-1 text-xs font-black text-orange-400 select-all tracking-wider">{winningSegment.code}</code>
                        <button
                          onClick={handleCopy}
                          className="p-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-white"
                          title="Copy Coupon Code"
                        >
                          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
