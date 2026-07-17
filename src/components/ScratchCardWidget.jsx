import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Sparkles, Copy, Check } from 'lucide-react';
import { useStore } from '../contexts/StoreContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function ScratchCardWidget() {
  const { settings, showToast } = useStore();
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isScratchFinished, setIsScratchFinished] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isScratchedToday, setIsScratchedToday] = useState(false);

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  const freeDeliveryCode = settings?.free_delivery_code || 'LIVRAISON_GRATUITE';

  // Check if scratched in this session/day
  useEffect(() => {
    const lastScratch = localStorage.getItem('sweeto_scratch_completed');
    if (lastScratch) {
      // Lock scratch to once a day
      const lastScratchDate = new Date(Number(lastScratch)).toDateString();
      const todayDate = new Date().toDateString();
      if (lastScratchDate === todayDate) {
        setIsScratchedToday(true);
      }
    }

    const handleOpenEvent = () => handleOpen();
    window.addEventListener('open-scratch-card', handleOpenEvent);
    return () => window.removeEventListener('open-scratch-card', handleOpenEvent);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setIsScratchFinished(false);
    setIsCopied(false);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Canvas initializer
  useEffect(() => {
    if (!isOpen || isScratchedToday || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set device pixel ratio scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Fill with modern metallic gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#c0c0c0');
    grad.addColorStop(0.2, '#e0e0e0');
    grad.addColorStop(0.4, '#a0a0a0');
    grad.addColorStop(0.6, '#f0f0f0');
    grad.addColorStop(0.8, '#d0d0d0');
    grad.addColorStop(1, '#909090');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add gold diagonal premium ribbons
    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = -100; i < canvas.width + 100; i += 80) {
      ctx.save();
      ctx.translate(i, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(lang === 'fr' ? 'GRATTEZ ICI' : 'SCRATCH HERE', 0, 0);
      ctx.restore();
    }

    // Glitter dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [isOpen, isScratchedToday, lang]);

  const draw = (clientX, clientY) => {
    if (!canvasRef.current || !isDrawingRef.current || isScratchFinished) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    checkScratchPercentage();
  };

  const checkScratchPercentage = () => {
    if (!canvasRef.current || isScratchFinished) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    let transparentCount = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        transparentCount++;
      }
    }

    const percentage = (transparentCount / (pixels.length / 4)) * 100;
    if (percentage > 20) {
      setIsScratchFinished(true);
      localStorage.setItem('sweeto_scratch_completed', String(Date.now()));
      setIsScratchedToday(true);
      showToast(
        lang === 'fr' 
          ? 'Félicitations ! Vous avez révélé le code !' 
          : 'Congratulations! You revealed the code!',
        'success'
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(freeDeliveryCode);
    setIsCopied(true);
    showToast(
      lang === 'fr' ? 'Code copié avec succès !' : 'Code copied successfully!',
      'success'
    );
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    isDrawingRef.current = true;
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    isDrawingRef.current = true;
    draw(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    draw(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isDrawingRef.current = false;
  };

  return (
    <>
      {/* Scratch Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              className="relative w-full max-w-sm bg-[#0a0f1d] border border-slate-800/80 rounded-[2.5rem] p-8 text-center space-y-6 overflow-hidden shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              {/* Gold Header details */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-[0.25em] flex items-center justify-center gap-1.5">
                  <Sparkles size={12} />
                  {lang === 'fr' ? 'ÉVÉNEMENT EXCLUSIF' : 'EXCLUSIVE EVENT'}
                </span>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  {lang === 'fr' ? 'Carte à Gratter' : 'Scratch & Win'}
                </h3>
                <p className="text-xs text-slate-450 dark:text-slate-400">
                  {lang === 'fr' 
                    ? 'Grattez la zone ci-dessous pour tenter de gagner la livraison gratuite !'
                    : 'Scratch the metallic layer to win free delivery!'}
                </p>
              </div>

              {isScratchedToday && !isScratchFinished ? (
                /* Session Lock screen */
                <div className="h-44 w-full bg-slate-900/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-wide">
                      {lang === 'fr' ? 'DÉJÀ JOUÉ AUJOURD\'HUI' : 'ALREADY PLAYED TODAY'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {lang === 'fr' 
                        ? 'Revenez demain pour gratter une nouvelle carte cadeau !' 
                        : 'Come back tomorrow to scratch a new gift card!'}
                    </p>
                  </div>
                </div>
              ) : (
                /* Canvas Area */
                <div className="relative w-full h-44 bg-slate-950 rounded-3xl border border-white/5 overflow-hidden select-none touch-none">
                  {/* Underlay revealed prize */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-950/40 to-indigo-950/40 p-6 space-y-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        {lang === 'fr' ? 'VOTRE RÉCOMPENSE' : 'YOUR REWARD'}
                      </span>
                      <h4 className="text-sm font-black text-white uppercase tracking-wide">
                        {lang === 'fr' ? 'Livraison Gratuite' : 'Free Delivery'}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-2xl">
                      <span className="text-xs font-black text-amber-400 font-mono tracking-widest">{freeDeliveryCode}</span>
                      <button
                        onClick={handleCopy}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span className="text-[9px] text-slate-500">
                      {lang === 'fr' ? 'Copiez et collez-le à la caisse' : 'Copy and paste it at checkout'}
                    </span>
                  </div>

                  {/* Canvas Silver scratch layer */}
                  {!isScratchFinished && (
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full cursor-crosshair"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleMouseUp}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    />
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
