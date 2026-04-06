
import React, { useEffect, useState, useRef } from 'react';

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
  const [hasStarted, setHasStarted] = useState(false);
  const onCompleteRef = useRef<(() => void) | undefined>(onComplete);
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
    setHasStarted(true);

    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.05
      })).filter(p => p.life > 0));
    }, 30);

    return () => clearInterval(interval);
  }, [x, y, color]);

  // Handle completion in a separate effect to avoid side effects during state updates
  useEffect(() => {
    if (hasStarted && particles.length === 0 && onCompleteRef.current) {
      onCompleteRef.current();
      onCompleteRef.current = undefined; // Fire only once
    }
  }, [particles, hasStarted]);

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
