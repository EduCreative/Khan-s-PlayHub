
import React, { useEffect, useState } from 'react';

const VictoryEffect: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const colors = ['#4f46e5', '#c026d3', '#10b981', '#fbbf24', '#f43f5e', '#3b82f6'];
    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: 50,
      y: 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      velocity: 2 + Math.random() * 5,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * 360,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[2px] animate-in fade-in duration-700" />
      
      <div className="relative text-center z-10 animate-in zoom-in-50 fade-in duration-1000">
        <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(255,255,255,0.5)] transform -rotate-3">
          Victory
        </h1>
        <p className="text-xl font-black text-indigo-400 uppercase tracking-[0.5em] mt-4 animate-pulse">
          Nexus Achievement Unlocked
        </p>
      </div>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            '--tx': `${Math.cos(p.angle) * 100 * p.velocity}px`,
            '--ty': `${Math.sin(p.angle) * 100 * p.velocity + 500}px`,
            '--tr': `${p.rotation + 720}deg`,
          } as any}
        />
      ))}

      <style>{`
        @keyframes confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          10% { opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--tr)); opacity: 0; }
        }
        .animate-confetti-fall {
          animation: confetti-fall 3.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default VictoryEffect;
