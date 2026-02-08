
import React, { useState, useEffect, useRef } from 'react';

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerY, setPlayerY] = useState(50);
  const [obstacles, setObstacles] = useState<{ x: number, y: number, h: number }[]>([]);
  const [score, setScore] = useState(0);
  
  // Fix: Added null as initial argument to useRef to satisfy TypeScript requirements
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(Date.now());

  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = () => {
      const now = Date.now();
      const dt = (now - lastUpdate.current) / 1000;
      lastUpdate.current = now;

      setScore(s => s + Math.floor(dt * 100));
      
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, x: o.x - 300 * dt }));
        if (next.length < 3) {
          next.push({ x: 1000, y: Math.random() * 80, h: 20 });
        }
        return next.filter(o => o.x > -50);
      });

      gameRef.current = requestAnimationFrame(gameLoop);
    };

    gameRef.current = requestAnimationFrame(gameLoop);
    
    // Fix: Safer cleanup logic checking for null before calling cancelAnimationFrame
    return () => {
      if (gameRef.current !== null) {
        cancelAnimationFrame(gameRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-full max-w-4xl h-96 glass-card rounded-3xl overflow-hidden border-green-500/20 cursor-none" 
         onMouseMove={(e) => {
           const rect = e.currentTarget.getBoundingClientRect();
           const y = ((e.clientY - rect.top) / rect.height) * 100;
           setPlayerY(Math.max(10, Math.min(90, y)));
         }}
    >
      <div className="absolute top-6 left-6 z-10">
        <p className="text-xs text-slate-500 uppercase font-bold">Blitz Distance</p>
        <p className="text-4xl font-black text-green-400 italic">{score}m</p>
      </div>

      {/* Player */}
      <div 
        className="absolute left-20 w-12 h-12 bg-green-400 rounded-xl shadow-[0_0_20px_rgba(74,222,128,0.5)] flex items-center justify-center transition-all duration-75"
        style={{ top: `${playerY}%`, transform: 'translateY(-50%)' }}
      >
        <i className="fas fa-bolt text-black text-2xl animate-pulse"></i>
      </div>

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <div 
          key={i}
          className="absolute w-12 bg-red-500/30 border-l-4 border-red-500/80 rounded-r-lg"
          style={{ 
            left: `${o.x / 10}%`, 
            top: `${o.y}%`, 
            height: `${o.h}%`,
            transition: 'none'
          }}
        />
      ))}

      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-slate-500 text-xs animate-bounce">
        Move your mouse or finger to dodge!
      </div>
    </div>
  );
};

export default BlitzRunner;
