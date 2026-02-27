
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Bit {
  id: number;
  value: number;
  y: number; // Normalized [0, 1]
  speed: number;
}

const BinaryDash: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [bits, setBits] = useState<Bit[]>([]);
  const [score, setScore] = useState(0);
  const [integrity, setIntegrity] = useState(100);
  const [streak, setStreak] = useState(0);

  const scoreRef = useRef(0);
  const integrityRef = useRef(100);
  const streakRef = useRef(0);
  const bitsRef = useRef<Bit[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const spawnTimerRef = useRef(0);

  const spawnBit = useCallback(() => {
    const newBit: Bit = {
      id: Math.random(),
      value: Math.floor(Math.random() * 100),
      y: -0.1,
      speed: 0.3 + (scoreRef.current / 50000),
    };
    bitsRef.current.push(newBit);
    setBits([...bitsRef.current]);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      scoreRef.current = 0;
      integrityRef.current = 100;
      streakRef.current = 0;
      bitsRef.current = [];
      setScore(0);
      setIntegrity(100);
      setStreak(0);
      setBits([]);
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
      if (spawnTimerRef.current > Math.max(0.4, 1.2 - scoreRef.current / 20000)) {
        spawnBit();
        spawnTimerRef.current = 0;
      }

      bitsRef.current = bitsRef.current.map(b => ({
        ...b,
        y: b.y + b.speed * dt
      })).filter(b => {
        if (b.y > 0.85) {
          integrityRef.current -= 5;
          streakRef.current = 0;
          setIntegrity(integrityRef.current);
          setStreak(0);
          return false;
        }
        return true;
      });

      setBits([...bitsRef.current]);

      if (integrityRef.current <= 0) {
        onGameOver(scoreRef.current);
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, spawnBit, onGameOver]);

  const sort = (direction: 'LEFT' | 'RIGHT') => {
    if (!isPlaying || integrityRef.current <= 0 || bitsRef.current.length === 0) return;

    // Sort the lowest bit
    const bitToSort = bitsRef.current.reduce((prev, curr) => prev.y > curr.y ? prev : curr);
    const isEven = bitToSort.value % 2 === 0;
    const correct = (direction === 'LEFT' && isEven) || (direction === 'RIGHT' && !isEven);

    if (correct) {
      streakRef.current += 1;
      const points = 10 + streakRef.current;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setStreak(streakRef.current);
      bitsRef.current = bitsRef.current.filter(b => b.id !== bitToSort.id);
    } else {
      integrityRef.current -= 10;
      streakRef.current = 0;
      setIntegrity(integrityRef.current);
      setStreak(0);
    }
    setBits([...bitsRef.current]);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg h-full animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-cyan-500/20 border-2 shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Health</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${integrity}%` }} />
          </div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streak</span>
          <p className="text-2xl font-black text-cyan-500 italic">x{streak}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processed</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        <div className="absolute inset-x-0 top-0 bottom-20 flex justify-center pointer-events-none">
          <div className="w-px bg-white/10 h-full" />
        </div>

        {bits.map(bit => (
          <div
            key={bit.id}
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-2xl font-black text-cyan-400 border-2 border-cyan-500/20 transition-transform duration-75"
            style={{ top: `${bit.y * 100}%` }}
          >
            {bit.value}
          </div>
        ))}

        <div className="absolute bottom-4 inset-x-0 flex justify-between px-10 pointer-events-none opacity-40">
           <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Even</span>
           <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Odd</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        <button 
          onPointerDown={() => sort('LEFT')}
          className="h-20 glass-card bg-emerald-500/10 border-emerald-500/30 rounded-3xl flex flex-col items-center justify-center text-emerald-400 font-black hover:scale-105 active:scale-95 transition-all"
        >
          <i className="fas fa-chevron-left text-2xl mb-1"></i>
          <span className="text-[10px] uppercase tracking-widest">EVEN</span>
        </button>
        <button 
          onPointerDown={() => sort('RIGHT')}
          className="h-20 glass-card bg-rose-500/10 border-rose-500/30 rounded-3xl flex flex-col items-center justify-center text-rose-400 font-black hover:scale-105 active:scale-95 transition-all"
        >
          <i className="fas fa-chevron-right text-2xl mb-1"></i>
          <span className="text-[10px] uppercase tracking-widest">ODD</span>
        </button>
      </div>
    </div>
  );
};

export default BinaryDash;
