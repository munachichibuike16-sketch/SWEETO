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
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0000ff" />
          <stop offset="100%" stopColor="#0000ff" />
        </linearGradient>
      </defs>
      
      {/* Cart Frame/Body */}
      <path 
        d="M 12 18 H 22 L 35 64 H 80" 
        stroke="url(#logoGrad)" 
        strokeWidth="7" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M 27 28 H 85 L 77 54 H 38 Z" 
        fill="url(#logoGrad)" 
        stroke="url(#logoGrad)" 
        strokeWidth="4" 
        strokeLinejoin="round" 
      />
      
      {/* Speed / Design Lines inside the basket for premium look */}
      <path 
        d="M 42 36 H 75" 
        stroke="#ffffff" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />
      <path 
        d="M 45 46 H 68" 
        stroke="#ffffff" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
      />

      {/* Wheels */}
      <circle 
        cx="38" 
        cy="80" 
        r="8" 
        fill="#0b0f19" 
        stroke="url(#logoGrad)" 
        strokeWidth="5" 
      />
      <circle 
        cx="38" 
        cy="80" 
        r="2" 
        fill="#ffffff" 
      />
      
      <circle 
        cx="72" 
        cy="80" 
        r="8" 
        fill="#0b0f19" 
        stroke="url(#logoGrad)" 
        strokeWidth="5" 
      />
      <circle 
        cx="72" 
        cy="80" 
        r="2" 
        fill="#ffffff" 
      />
    </svg>
  );
};

export default SweetoLogo;
