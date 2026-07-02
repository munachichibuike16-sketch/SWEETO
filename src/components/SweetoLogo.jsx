import React from 'react';
import { motion } from 'framer-motion';

const SweetoLogo = ({ size = 120, className = '', animate = true }) => {
  const elements = [
    { char: 'S', x: 30, y: 35 },
    { char: 'W', x: 70, y: 35 },
    { char: 'E', x: 110, y: 35 },
    { char: 'E', x: 150, y: 35 },
    { char: 'T', x: 190, y: 35 },
    { char: 'O', x: 230, y: 35 },
    { char: 'H', x: 90, y: 70 },
    { char: 'U', x: 130, y: 70 },
    { char: 'B', x: 170, y: 70 }
  ];

  return (
    <motion.svg 
      viewBox="0 0 260 105" 
      className={`select-none cursor-pointer ${className}`} 
      style={{ width: size, aspectRatio: '260/105' }}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      whileHover="hover"
      initial="initial"
      animate="animate"
    >
      <defs>
        {/* Chilling ice-blue to deep royal blue gradient */}
        <linearGradient id="logoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* Overlapping Rings */}
      {elements.map((el, i) => (
        <motion.circle 
          key={`ring-${i}`}
          cx={el.x} 
          cy={el.y} 
          r="23" 
          fill="url(#logoRingGrad)"
          stroke="#ffffff" 
          strokeWidth="2.5"
          variants={{
            initial: { scale: 0.8, opacity: 0 },
            animate: { 
              scale: 1, 
              opacity: 1,
              transition: { type: 'spring', stiffness: 180, damping: 12, delay: i * 0.04 }
            },
            hover: {
              scale: 1.04,
              strokeWidth: 3,
              filter: `drop-shadow(0 0 8px rgba(59,130,246,0.6))`,
              transition: { duration: 0.3 }
            }
          }}
          style={{ transformOrigin: `${el.x}px ${el.y}px` }}
        />
      ))}
      
      {/* Letters */}
      {elements.map((el, i) => (
        <motion.text
          key={`text-anim-${i}`}
          x={el.x}
          y={el.y + 6.2} // offset down to align vertically inside the circle
          fill="#ffffff"
          fontSize="16.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          textAnchor="middle"
          style={{ transformOrigin: `${el.x}px ${el.y}px` }}
          variants={{
            initial: { scale: 0, opacity: 0 },
            animate: { 
              scale: 1, 
              opacity: 1,
              transition: { type: 'spring', stiffness: 220, damping: 12, delay: i * 0.05 + 0.15 }
            },
            hover: {
              y: [0, -3.5, 1.5, 0],
              transition: { duration: 0.45, ease: "easeInOut", delay: i * 0.02 }
            }
          }}
        >
          {el.char}
        </motion.text>
      ))}
    </motion.svg>
  );
};

export default SweetoLogo;
