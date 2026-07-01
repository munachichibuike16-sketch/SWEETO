import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const SweetoLogo = ({ size = 120, className = '', animate = true }) => {
  let isDarkMode = true;
  try {
    const themeCtx = useTheme();
    if (themeCtx) isDarkMode = themeCtx.isDarkMode;
  } catch (e) {}

  // High contrast color palettes for light vs dark modes
  const elements = [
    { char: 'S', x: 30, y: 35, darkColor: '#ff7675', lightColor: '#e53e3e' },
    { char: 'W', x: 70, y: 35, darkColor: '#ffeaa7', lightColor: '#d69e2e' },
    { char: 'E', x: 110, y: 35, darkColor: '#55efc4', lightColor: '#319795' },
    { char: 'E', x: 150, y: 35, darkColor: '#55efc4', lightColor: '#319795' },
    { char: 'T', x: 190, y: 35, darkColor: '#00cec9', lightColor: '#00a3c4' },
    { char: 'O', x: 230, y: 35, darkColor: '#74b9ff', lightColor: '#3182ce' },
    { char: 'H', x: 90, y: 70, darkColor: '#a29bfe', lightColor: '#553c9a' },
    { char: 'U', x: 130, y: 70, darkColor: '#fd79a8', lightColor: '#d53f8c' },
    { char: 'B', x: 170, y: 70, darkColor: '#ff7675', lightColor: '#dd6b20' }
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
      {/* Overlapping Rings */}
      {elements.map((el, i) => {
        const color = isDarkMode ? el.darkColor : el.lightColor;
        
        return (
          <motion.circle 
            key={`ring-${i}`}
            cx={el.x} 
            cy={el.y} 
            r="23" 
            stroke={color} 
            strokeWidth="3.2"
            variants={{
              initial: { scale: 0.8, opacity: 0 },
              animate: { 
                scale: 1, 
                opacity: 1,
                transition: { type: 'spring', stiffness: 180, damping: 12, delay: i * 0.04 }
              },
              hover: {
                scale: 1.04,
                strokeWidth: 3.8,
                filter: `drop-shadow(0 0 6px ${color}80)`,
                transition: { duration: 0.3 }
              }
            }}
            style={{ transformOrigin: `${el.x}px ${el.y}px` }}
          />
        );
      })}
      
      {/* Letters */}
      {elements.map((el, i) => {
        const color = isDarkMode ? el.darkColor : el.lightColor;

        return (
          <motion.text
            key={`text-anim-${i}`}
            x={el.x}
            y={el.y + 6.2} // offset down to align vertically inside the circle
            fill={color}
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
        );
      })}
    </motion.svg>
  );
};

export default SweetoLogo;
