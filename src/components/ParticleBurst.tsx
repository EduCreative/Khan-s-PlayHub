
import React, { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

const ParticleBurst: React.FC<{ x: number; y: number; color: string; onComplete?: () => void }> = ({ x, y, color, onComplete }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      color,
      size: Math.random() * 4 + 2,
      life: 1.0
    }));
    setParticles(newParticles);

    const interval = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          life: p.life - 0.05
        })).filter(p => p.life > 0);
        
        if (next.length === 0 && prev.length > 0 && onComplete) {
          onComplete();
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [x, y, color, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life,
            transform: `scale(${p.life})`
          }}
        />
      ))}
    </div>
  );
};

export default ParticleBurst;
