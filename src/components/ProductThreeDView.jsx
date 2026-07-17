import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rotate3d, Camera, RefreshCw, ZoomIn, RotateCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function ProductThreeDView({ product }) {
  const { lang } = useLanguage();
  const [viewMode, setViewMode] = useState('3d'); // '3d' | 'ar' | 'tryon'
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  
  // Custom try-on adjustments
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  
  const cardRef = useRef(null);
  const videoRef = useRef(null);

  // Mouse move handler for holographic 3D parallax tilt
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Mouse coords relative to card center
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    // Convert to rotation angles (max 20 degrees)
    const rY = (x / (rect.width / 2)) * 20;
    const rX = -(y / (rect.height / 2)) * 20;

    setRotateX(rX);
    setRotateY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  // Start Camera for AR Simulation
  const startCamera = async (mode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode === 'tryon' ? 'user' : 'environment' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('AR Camera Error:', err);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (viewMode === 'ar' || viewMode === 'tryon') {
      startCamera(viewMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [viewMode]);

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-slate-950/20 dark:bg-slate-950/40 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 relative overflow-hidden">
      
      {/* View Switcher Controls */}
      <div className="flex flex-wrap gap-2 bg-slate-900/60 dark:bg-slate-900/80 p-1 border border-white/5 rounded-[1.5rem] sm:rounded-full z-10 justify-center">
        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            viewMode === '3d' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Rotate3d size={13} />
          {lang === 'fr' ? 'Vue 3D' : '3D View'}
        </button>
        <button
          onClick={() => setViewMode('ar')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            viewMode === 'ar' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera size={13} />
          {lang === 'fr' ? 'Placer (AR)' : 'AR Placer'}
        </button>
        <button
          onClick={() => setViewMode('tryon')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            viewMode === 'tryon' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera size={13} />
          {lang === 'fr' ? 'Essayer (Selfie)' : 'Try On (Selfie)'}
        </button>
      </div>

      {/* Main Display Container */}
      <div className="w-full h-72 flex items-center justify-center relative rounded-2xl overflow-hidden select-none bg-slate-100 dark:bg-slate-950">
        <AnimatePresence mode="wait">
          
          {/* 3D Rotational View */}
          {viewMode === '3d' && (
            <motion.div
              key="3d_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                perspective: 1000,
                transformStyle: 'preserve-3d',
                rotateX: rotateX,
                rotateY: rotateY,
                transition: isHovered ? 'none' : 'transform 0.5s ease-out'
              }}
              className="w-56 h-56 flex items-center justify-center bg-transparent relative cursor-grab active:cursor-grabbing"
            >
              {/* Holographic light reflect overlay */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-[2rem] transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at ${rotateY * 2 + 50}% ${-rotateX * 2 + 50}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                  opacity: isHovered ? 1 : 0
                }}
              />
              
              {/* Product Rotatable Image */}
              <img
                src={product.image_url || product.image || '/hero-banner.png'}
                alt={product.name}
                className="max-w-full max-h-full object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] pointer-events-none"
                style={{ transform: 'translateZ(40px)' }}
              />
            </motion.div>
          )}

          {/* AR Placer View */}
          {viewMode === 'ar' && (
            <motion.div
              key="ar_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-black relative flex items-center justify-center"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover opacity-70"
              />
              
              <motion.div
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                className="absolute w-40 h-40 flex items-center justify-center cursor-move"
              >
                <img
                  src={product.image_url || product.image || '/hero-banner.png'}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] animate-pulse pointer-events-none"
                />
              </motion.div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider whitespace-nowrap">
                {lang === 'fr' ? 'Glissez l\'objet pour le positionner' : 'Drag the object to position it'}
              </div>
            </motion.div>
          )}

          {/* Virtual Try-On Selfie View */}
          {viewMode === 'tryon' && (
            <motion.div
              key="tryon_view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full bg-black relative flex items-center justify-center"
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100 opacity-70"
              />
              
              <motion.div
                drag
                dragConstraints={{ left: -120, right: 120, top: -120, bottom: 120 }}
                style={{
                  scale: scale,
                  rotate: `${rotation}deg`
                }}
                className="absolute w-36 h-36 flex items-center justify-center cursor-move"
              >
                <img
                  src={product.image_url || product.image || '/hero-banner.png'}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] pointer-events-none"
                />
              </motion.div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider whitespace-nowrap">
                {lang === 'fr' ? 'Ajustez l\'objet sur vous' : 'Adjust the item on you'}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Try-on sliders shown only in tryon mode */}
      {viewMode === 'tryon' && (
        <div className="w-full space-y-3 px-2 pt-2">
          {/* Scale Slider */}
          <div className="flex items-center gap-4 text-left">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0 min-w-[70px]">
              <ZoomIn size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">Taille</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Rotation Slider */}
          <div className="flex items-center gap-4 text-left">
            <div className="flex items-center gap-1.5 text-slate-500 shrink-0 min-w-[70px]">
              <RotateCw size={12} />
              <span className="text-[9px] font-black uppercase tracking-wider">Rotation</span>
            </div>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotation}
              onChange={(e) => setRotation(parseInt(e.target.value))}
              className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
