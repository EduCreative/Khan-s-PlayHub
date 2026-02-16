
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface DefensiveEntity {
  id: number;
  angle: number; // In radians
  distance: number; // Normalized [0, 1] from center
  type: 'virus' | 'data';
  speed: number;
}

const CyberDefense: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [entities, setEntities] = useState<DefensiveEntity[]>([]);
  const [score, setScore] = useState(0);
  const [shieldAngle, setShieldAngle] = useState(0);
  const [integrity, setIntegrity] = useState(100);

  const scoreRef = useRef(0);
  const integrityRef = useRef(100);
  const shieldAngleRef = useRef(0);
  const entitiesRef = useRef<DefensiveEntity[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnEntity = useCallback(() => {
    const isData = Math.random() > 0.8;
    const newEntity: DefensiveEntity = {
      id: Math.random(),
      angle: Math.random() * Math.PI * 2,
      distance: 1.1,
      type: isData ? 'data' : 'virus',
      speed: 0.15 + (scoreRef.current / 100000),
    };
    entitiesRef.current.push(newEntity);
    setEntities([...entitiesRef.current]);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      scoreRef.current = 0;
      integrityRef.current = 100;
      entitiesRef.current = [];
      setScore(0);
      setIntegrity(100);
      setEntities([]);
      setShieldAngle(0);
      lastUpdateRef.current = performance.now();
      spawnTimerRef.current = 0;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || integrityRef.current <= 0) return;

    const loop = (time: number) => {
      const dt = (time - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = time;

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > Math.max(0.5, 1.5 - scoreRef.current / 15000)) {
        spawnEntity();
        spawnTimerRef.current = 0;
      }

      const SHIELD_SIZE = 0.6; // Shield arc width in radians
      const CORE_RADIUS = 0.15;

      entitiesRef.current = entitiesRef.current.map(e => ({
        ...e,
        distance: e.distance - e.speed * dt
      })).filter(e => {
        // Check for shield collision
        if (e.distance <= 0.35 && e.distance > 0.25) {
          const relativeAngle = (e.angle - shieldAngleRef.current + Math.PI * 2) % (Math.PI * 2);
          const inShieldRange = relativeAngle < SHIELD_SIZE || relativeAngle > (Math.PI * 2 - SHIELD_SIZE);

          if (inShieldRange) {
            if (e.type === 'virus') {
              scoreRef.current += 100;
              setScore(scoreRef.current);
            } else {
              integrityRef.current = Math.min(100, integrityRef.current + 5);
              setIntegrity(integrityRef.current);
            }
            return false;
          }
        }

        // Check for core collision
        if (e.distance <= CORE_RADIUS) {
          if (e.type === 'virus') {
            integrityRef.current -= 20;
            setIntegrity(integrityRef.current);
          }
          return false;
        }
        return true;
      });

      setEntities([...entitiesRef.current]);

      if (integrityRef.current <= 0) {
        onGameOver(scoreRef.current);
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, spawnEntity, onGameOver]);

  const handleInteraction = (e: React.PointerEvent) => {
    if (!containerRef.current || !isPlaying) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const angle = Math.atan2(dy, dx);
    shieldAngleRef.current = angle;
    setShieldAngle(angle);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg h-full animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-indigo-500/20 border-2 shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Integrity</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className={`h-full transition-all ${integrity < 30 ? 'bg-rose-500 animate-pulse' : 'bg-indigo-500'}`} style={{ width: `${integrity}%` }} />
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Defense XP</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div 
        ref={containerRef}
        onPointerMove={handleInteraction}
        onPointerDown={handleInteraction}
        className="flex-1 w-full relative bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden touch-none"
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        {/* The Core */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-indigo-500/20 border-2 border-indigo-500/40 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
           <i className="fas fa-atom text-indigo-400 text-2xl animate-spin-slow"></i>
        </div>

        {/* The Shield Arc */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <path 
            d={`M ${Math.cos(shieldAngle - 0.6) * 120 + 200} ${Math.sin(shieldAngle - 0.6) * 120 + 200} A 120 120 0 0 1 ${Math.cos(shieldAngle + 0.6) * 120 + 200} ${Math.sin(shieldAngle + 0.6) * 120 + 200}`}
            fill="none"
            stroke="rgba(99, 102, 241, 0.8)"
            strokeWidth="8"
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_rgba(99,102,241,0.8)]"
            style={{ transform: 'translate(50%, 50%)', transformOrigin: 'center' }}
          />
        </svg>

        {/* Entities */}
        {entities.map(e => (
          <div
            key={e.id}
            className={`absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 flex items-center justify-center ${
              e.type === 'virus' ? 'bg-rose-500/20 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-emerald-500/20 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
            style={{ 
              left: `${50 + Math.cos(e.angle) * e.distance * 40}%`, 
              top: `${50 + Math.sin(e.angle) * e.distance * 40}%`,
              transform: `translate(-50%, -50%) rotate(${e.angle}rad)`
            }}
          >
             <i className={`fas ${e.type === 'virus' ? 'fa-virus' : 'fa-plus'} text-[10px]`}></i>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-6 py-2 rounded-full border border-white/5">
        <i className="fas fa-arrows-spin text-indigo-500"></i>
        <span>Drag to rotate your orbital shield!</span>
      </div>
    </div>
  );
};

export default CyberDefense;
