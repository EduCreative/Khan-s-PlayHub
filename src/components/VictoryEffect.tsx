
import React from 'react';

const VictoryEffect: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      <div className="w-full h-full bg-emerald-500/10 animate-pulse" />
      <div className="absolute text-emerald-500 text-9xl opacity-20 animate-bounce">
        <i className="fas fa-trophy"></i>
      </div>
    </div>
  );
};

export default VictoryEffect;
