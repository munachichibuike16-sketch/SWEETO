import React from 'react';

const SweetoLogo = ({ size = 120, className = '', animate = true }) => {
  return (
    <img 
      src="/sweeto_logo.png"
      alt="Sweeto Hub"
      style={{ width: size }}
      className={`select-none cursor-pointer object-contain max-h-full ${className}`}
    />
  );
};

export default SweetoLogo;
