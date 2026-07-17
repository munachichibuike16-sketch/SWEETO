import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RefreshCw, ZoomIn, RotateCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProductVirtualTryOn({ product, onClose }) {
  const { lang } = useLanguage();
  const [stream, setStream] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  const videoRef = useRef(null);

  const startCamera = async () => {
    setErrorMsg('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg(
        lang === 'fr' 
          ? 'Impossible d\'accéder à la caméra. Veuillez autoriser l\'accès.' 
          : 'Could not access camera. Please check permissions.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="w-full h-full flex flex-col items-center bg-slate-950/20 dark:bg-slate-950/40 p-4 rounded-3xl relative overflow-hidden select-none">
      
      {/* Viewport Frame */}
      <div className="w-full h-64 sm:h-72 bg-black relative rounded-2xl overflow-hidden flex items-center justify-center border border-white/5 shadow-inner">
        {errorMsg ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-xs text-red-400 font-bold">{errorMsg}</p>
            <button
              onClick={startCamera}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mx-auto"
            >
              <RefreshCw size={12} />
              Recharger
            </button>
          </div>
        ) : (
          <>
            {/* Live Camera Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />

            {/* Draggable Wearable Overlay */}
            <motion.div
              drag
              dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
              style={{
                scale: scale,
                rotate: `${rotation}deg`
              }}
              className="absolute w-28 h-28 flex items-center justify-center cursor-move"
            >
              <img
                src={product.image_url || product.image || '/hero-banner.png'}
                alt={product.name}
                className="max-w-full max-h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.45)] pointer-events-none"
              />
            </motion.div>

            {/* Instructions Overlay */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider whitespace-nowrap z-10">
              {lang === 'fr' ? 'Glissez l\'objet pour essayer' : 'Drag the object to fit'}
            </div>
          </>
        )}
      </div>

      {/* Adjustment Sliders Control Panel */}
      <div className="w-full mt-4 space-y-3">
        {/* Scale Slider */}
        <div className="flex items-center gap-4 text-left">
          <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-400 shrink-0 min-w-16">
            <ZoomIn size={12} />
            <span className="text-[10px] font-black uppercase tracking-wider">Taille</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Rotation Slider */}
        <div className="flex items-center gap-4 text-left">
          <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-400 shrink-0 min-w-16">
            <RotateCw size={12} />
            <span className="text-[10px] font-black uppercase tracking-wider">Rotation</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
      
    </div>
  );
}
