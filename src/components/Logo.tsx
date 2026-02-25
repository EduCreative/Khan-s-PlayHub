
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showGlow?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48, showGlow = true }) => {
  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {showGlow && (
        <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full animate-pulse" />
      )}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full drop-shadow-2xl"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background Hexagon Shell */}
        <path 
          d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 L50 5Z" 
          fill="rgba(255,255,255,0.05)" 
          stroke="url(#logo-gradient)" 
          strokeWidth="2"
        />

        {/* The Stylized "K" + Play Button */}
        <g filter="url(#neon-glow)">
          {/* Stem of K */}
          <rect x="28" y="30" width="10" height="40" rx="2" fill="url(#logo-gradient)" />
          
          {/* Top Arm of K */}
          <path 
            d="M38 50 L65 30 H75 L45 53 Z" 
            fill="url(#logo-gradient)" 
          />
          
          {/* Play Button Shape (Bottom Arm of K) */}
          <path 
            d="M38 50 L72 70 L38 70 Z" 
            fill="url(#logo-gradient)" 
            className="animate-pulse"
          />
        </g>
        
        {/* Inner Detail / Sparkle */}
        <circle cx="72" cy="70" r="3" fill="white" className="animate-ping" />
      </svg>
    </div>
  );
};

export default Logo;
