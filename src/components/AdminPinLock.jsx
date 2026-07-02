import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import SweetoLogo from './SweetoLogo';

export default function AdminPinLock({ onUnlock, onSignOut }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && isNaN(Number(value))) return;

    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1); // Only keep last digit
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear current and go back
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = '';
        setPin(newPin);
        inputRefs[index - 1].current?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = '';
        setPin(newPin);
      }
    }
  };

  // Check PIN when all 4 fields are filled
  useEffect(() => {
    const enteredPin = pin.join('');
    if (enteredPin.length === 4) {
      const pinNum = parseInt(enteredPin, 10);
      
      // Obfuscated check: (2005 + 7) * 43 = 2012 * 43 = 86516
      const isValid = (pinNum + 7) * 43 === 86516;

      if (isValid) {
        setTimeout(() => {
          onUnlock();
        }, 150);
      } else {
        // Shake error animation trigger
        setError(true);
        setAttempts(prev => prev + 1);
        
        // Vibrate on mobile if supported
        try { navigator.vibrate?.(200); } catch (e) {}

        // Reset pin fields after shake
        setTimeout(() => {
          setPin(['', '', '', '']);
          inputRefs[0].current?.focus();
        }, 600);
      }
    }
  }, [pin]);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#030712]/98 backdrop-blur-3xl flex items-center justify-center p-6 select-none font-sans text-slate-100">
      {/* Dynamic tech backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.04),transparent_60%)]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-[#090d16]/80 border border-slate-800/80 rounded-[2.5rem] p-8 text-center space-y-8 relative overflow-hidden shadow-2xl"
      >
        {/* Glowing top line indicator */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-28 h-[2.5px] rounded-full transition-colors duration-350 ${
          error ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
        }`} />

        {/* Sweeto Logo Icon */}
        <div className="relative w-18 h-18 mx-auto flex items-center justify-center">
          <div className={`absolute inset-0 rounded-2xl border transition-all duration-350 ${
            error ? 'border-red-500/20 animate-pulse' : 'border-blue-500/20'
          }`} />
          <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center">
            <SweetoLogo size={50} />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-white font-black text-[9px] uppercase tracking-[0.3em] text-blue-500 flex items-center justify-center gap-1.5">
            <Lock size={12} />
            Console Screen Locked
          </h2>
          <p className="text-xs font-bold text-slate-400">
            {error 
              ? 'Invalid Access Pin' 
              : 'Enter Master PIN to restore session'}
          </p>
        </div>

        {/* 4 Digit PIN Circles Container */}
        <motion.div
          animate={error ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="flex justify-center gap-4 py-4"
        >
          {pin.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-xl font-black rounded-2xl border bg-slate-950/60 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                error 
                  ? 'border-red-500 text-red-500 shadow-red-500/5' 
                  : digit 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-slate-800 text-slate-400'
              }`}
            />
          ))}
        </motion.div>

        {/* Secondary signout option */}
        <div className="pt-2">
          <button
            onClick={onSignOut}
            className="px-5 py-3 hover:bg-red-500/10 border border-slate-850 hover:border-red-500/20 text-slate-500 hover:text-red-400 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
          >
            <LogOut size={12} />
            <span>Switch User / Log Out</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
