import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Lock, Headset } from 'lucide-react';

const DesktopHero = ({ onProductClick, onCartOpen }) => {
  const navigate = useNavigate();

  // Floating keyframe animations
  const floatTransition = (delay = 0) => ({
    y: {
      duration: 3,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
      delay
    }
  });

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100/80 to-cyan-50/50 dark:from-[#0b0f19] dark:via-[#0c1322] dark:to-[#0f202e] border-b border-slate-100 dark:border-slate-800/80 py-6 md:py-8 select-none flex items-center justify-center">
      {/* Mesh glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Main Grid Wrapper */}
      <div className="max-w-[1440px] w-full px-8 md:px-12 grid grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Side: Brand Text & Badges (col-span-6) */}
        <div className="col-span-6 text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-full font-black text-[10px] tracking-wider uppercase">
            <span>NEW TECH, BETTER LIFE.</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-black text-slate-900 dark:text-white leading-[1.1] uppercase italic tracking-tighter">
            Upgrade to <br/>
            Next Level <br/>
            <span className="text-blue-650 dark:text-blue-450 drop-shadow-sm font-black">Technology</span>
          </h1>

          <p className="text-sm md:text-base text-slate-550 dark:text-slate-400 max-w-lg font-medium leading-relaxed">
            Discover the latest electronics and smart devices designed to make life smarter, easier, and more exciting.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap gap-4 pt-2">
            <button 
              onClick={() => {
                const element = document.getElementById('main-store-feed');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="group px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 active:scale-97 cursor-pointer border-none flex items-center gap-2"
            >
              <span>Shop Now</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button 
              onClick={() => navigate('/categories')}
              className="px-7 py-3.5 bg-transparent hover:bg-blue-50/20 border-2 border-blue-600/80 hover:border-blue-600 text-blue-600 dark:text-blue-400 font-extrabold text-xs uppercase tracking-widest rounded-xl transition active:scale-97 cursor-pointer"
            >
              Explore Categories
            </button>
          </div>
        </div>

        {/* Right Side: Floating circular ring layered tech assets (col-span-6) */}
        <div className="col-span-6 relative flex items-center justify-center h-[420px] md:h-[480px]">
          
          {/* Glowing Circular Ring Base */}
          <div className="w-80 h-80 rounded-full border-4 border-cyan-500/10 dark:border-cyan-400/5 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex items-center justify-center relative animate-pulse pointer-events-none">
            <div className="w-72 h-72 rounded-full border border-dashed border-cyan-500/20 dark:border-cyan-400/10" />
          </div>

          {/* New Arrivals Circular Badge (Top-Right) */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={floatTransition(1.5)}
            onClick={() => navigate('/categories')}
            className="absolute top-8 right-16 w-20 h-20 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex flex-col items-center justify-center shadow-lg border border-blue-500/20 cursor-pointer z-30 group"
          >
            <span className="text-[8px] font-black tracking-widest uppercase text-blue-200">NEW</span>
            <span className="text-[9px] font-black tracking-tighter uppercase leading-none">ARRIVALS</span>
            <span className="text-[7px] font-bold text-white/80 uppercase tracking-widest mt-1 group-hover:underline">Shop Now</span>
          </motion.div>

          {/* LAYERED PRODUCT COMPOSITION (Floating spring states) */}
          
          {/* 1. Desktop Monitor (Center / Back) */}
          <motion.div 
            animate={{ y: [0, -8, 0] }}
            transition={floatTransition(0.2)}
            className="absolute z-10 w-64 md:w-72 -translate-y-4"
          >
            <img 
              src="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400" 
              alt="Monitor" 
              className="w-full h-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_15px_35px_rgba(0,0,0,0.4)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* 2. Laptop (Center / Left / Front) */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={floatTransition(0.7)}
            className="absolute z-20 w-52 md:w-56 -translate-x-16 translate-y-16"
          >
            <img 
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400" 
              alt="Laptop" 
              className="w-full h-auto object-contain rounded-lg drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* 3. iPhone (Right / Front) */}
          <motion.div 
            animate={{ y: [0, -12, 0] }}
            transition={floatTransition(1.1)}
            className="absolute z-35 w-16 md:w-18 translate-x-24 translate-y-12"
          >
            <img 
              src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=200" 
              alt="iPhone" 
              className="w-full h-auto object-contain rounded-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* 4. Headphones (Far Right / Back) */}
          <motion.div 
            animate={{ y: [0, -9, 0] }}
            transition={floatTransition(0.4)}
            className="absolute z-10 w-28 md:w-32 translate-x-32 -translate-y-12"
          >
            <img 
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=300" 
              alt="Headphones" 
              className="w-full h-auto object-contain rounded-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_10px_25px_rgba(0,0,0,0.4)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* 5. Smart Speaker (Center Right / Front) */}
          <motion.div 
            animate={{ y: [0, -11, 0] }}
            transition={floatTransition(0.9)}
            className="absolute z-30 w-16 md:w-18 translate-x-12 translate-y-24"
          >
            <img 
              src="https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&q=80&w=200" 
              alt="Smart Speaker" 
              className="w-full h-auto object-contain rounded-full drop-shadow-[0_8px_15px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

          {/* 6. Smartwatch (Bottom Right / Front) */}
          <motion.div 
            animate={{ y: [0, -7, 0] }}
            transition={floatTransition(1.3)}
            className="absolute z-40 w-14 md:w-16 translate-x-28 translate-y-28"
          >
            <img 
              src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=200" 
              alt="Smartwatch" 
              className="w-full h-auto object-contain rounded-xl drop-shadow-[0_8px_15px_rgba(0,0,0,0.18)] dark:drop-shadow-[0_8px_20px_rgba(0,0,0,0.4)]" 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </motion.div>

        </div>

      </div>
    </section>
  );
};

export default DesktopHero;
