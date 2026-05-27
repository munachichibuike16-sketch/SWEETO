import React from 'react';

const SweetoLogo = ({ size = 48, className = '' }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={`select-none ${className}`} 
      style={{ width: size, height: size }}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background gradient: dark obsidian luxury blue */}
        <linearGradient id="logoBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="40%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>

        {/* Chilling Neon Cyan-Blue gradient for the glowing 'S' */}
        <linearGradient id="logoSGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="50%" stopColor="#4FACFE" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Glossy highlight linear gradient */}
        <linearGradient id="logoGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
          <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        {/* Tech-glow drop shadow filter */}
        <filter id="logoCyberGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Subtle background ambient filter */}
        <filter id="bgShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#00F2FE" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main squircle container with drop shadow glow */}
      <rect 
        x="6" 
        y="6" 
        width="88" 
        height="88" 
        rx="26" 
        fill="url(#logoBgGrad)" 
        stroke="#4FACFE" 
        strokeWidth="1.5" 
        strokeOpacity="0.45"
        filter="url(#bgShadow)"
      />

      {/* Chilling inner frost border */}
      <rect 
        x="9" 
        y="9" 
        width="82" 
        height="82" 
        rx="23" 
        fill="none" 
        stroke="#FFFFFF" 
        strokeWidth="0.5" 
        strokeOpacity="0.15" 
      />

      {/* Semi-circular glassmorphism gloss overlay */}
      <path 
        d="M6 32C6 17.6406 17.6406 6 32 6H68C82.3594 6 94 17.6406 94 32V50C94 50 72 40 50 40C28 40 6 50 6 50V32Z" 
        fill="url(#logoGlassGrad)" 
      />

      {/* Futuristic Sleek 'S' Geometry */}
      <g filter="url(#logoCyberGlow)">
        {/* Outer glowing thick track */}
        <path 
          d="M66 31C66 23.8203 60.1797 18 53 18C44.5 18 34 23.5 34 33.5C34 45.5 66 43 66 54.5C66 64.5 55.5 70 47 70C39.8203 70 34 64.1797 34 57" 
          fill="none" 
          stroke="url(#logoSGrad)" 
          strokeWidth="10.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        
        {/* Bright ice-white inner core line for high-contrast visibility */}
        <path 
          d="M66 31C66 23.8203 60.1797 18 53 18C44.5 18 34 23.5 34 33.5C34 45.5 66 43 66 54.5C66 64.5 55.5 70 47 70C39.8203 70 34 64.1797 34 57" 
          fill="none" 
          stroke="#E0F7FA" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeOpacity="0.85"
        />
      </g>

      {/* Micro-tech accent dots in corners */}
      <circle cx="16" cy="16" r="1.5" fill="#00F2FE" opacity="0.6" />
      <circle cx="84" cy="84" r="1.5" fill="#00F2FE" opacity="0.6" />
    </svg>
  );
};

export default SweetoLogo;
