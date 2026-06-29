import React from 'react';

const SweetoLogo = ({ size = 120, className = '' }) => {
  // Circles config: [char, x, y, color]
  const elements = [
    { char: 'S', x: 30, y: 35, color: '#ff7675' },
    { char: 'W', x: 70, y: 35, color: '#ffeaa7' },
    { char: 'E', x: 110, y: 35, color: '#55efc4' },
    { char: 'E', x: 150, y: 35, color: '#55efc4' },
    { char: 'T', x: 190, y: 35, color: '#00cec9' },
    { char: 'O', x: 230, y: 35, color: '#74b9ff' },
    { char: 'H', x: 90, y: 70, color: '#a29bfe' },
    { char: 'U', x: 130, y: 70, color: '#fd79a8' },
    { char: 'B', x: 170, y: 70, color: '#ff7675' }
  ];

  return (
    <svg 
      viewBox="0 0 260 105" 
      className={`select-none ${className}`} 
      style={{ width: size, aspectRatio: '260/105' }}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Overlapping Rings */}
      {elements.map((el, i) => (
        <circle 
          key={`ring-${i}`}
          cx={el.x} 
          cy={el.y} 
          r="23" 
          stroke={el.color} 
          strokeWidth="3.2"
        />
      ))}
      
      {/* Letters */}
      {elements.map((el, i) => (
        <text
          key={`text-${i}`}
          x={el.x}
          y={el.y + 6.2} // offset down to align vertically inside the circle
          fill={el.color}
          fontSize="16.5"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          fontWeight="900"
          textAnchor="middle"
        >
          {el.char}
        </text>
      ))}
    </svg>
  );
};

export default SweetoLogo;
