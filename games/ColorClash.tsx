
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLORS = [
  { name: 'PINK', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'CYAN', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'LIME', hex: '#84cc16', bg: 'bg-lime-500' },
  { name: 'AMBER', hex: '#f59e0b', bg: 'bg-amber-500' }
];

const ColorClash: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [target, setTarget] = useState(0);
  const [textColor, setTextColor] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1.0);
  
  // Use refs for values that change frequently to keep the interval stable
  const difficultyRef = useRef(1.0);
  const scoreRef = useRef(0);
  const isGameOverTriggered = useRef(false);

  const nextRound = useCallback(() => {
    setTarget(Math.floor(Math.random() * COLORS.length));
    setTextColor(Math.floor(Math.random() * COLORS.length));
    setTimeLeft(1.0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      nextRound();
      setScore(0);
      scoreRef.current = 0;
      difficultyRef.current = 1.0;
      isGameOverTriggered.current = false;
    }
  }, [isPlaying, nextRound]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        // Reduced decay rate from 0.008 to 0.004 for more forgiving play
        const next = prev - (0.004 * difficultyRef.current);
        
        if (next <= 0 && !isGameOverTriggered.current) {
          isGameOverTriggered.current = true;
          setTimeout(() => onGameOver(scoreRef.current), 50);
          return 0;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, onGameOver]);

  const handleMatch = (index: number) => {
    if (!isPlaying || isGameOverTriggered.current) return;

    if (index === target) {
      const newScore = scoreRef.current + 100;
      scoreRef.current = newScore;
      setScore(newScore);
      
      difficultyRef.current = Math.min(4.0, difficultyRef.current + 0.06); // Slower difficulty ramp
      nextRound();
    } else {
      isGameOverTriggered.current = true;
      onGameOver(scoreRef.current);
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-sm px-4 select-none">
      <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden border-2 border-white/10 p-1 shadow-inner relative">
        <div 
          className={`h-full rounded-full transition-all duration-75 ease-linear shadow-[0_0_20px_rgba(236,72,153,0.5)] ${timeLeft < 0.3 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-pink-500 to-indigo-500'}`}
          style={{ width: `${Math.max(0, timeLeft * 100)}%` }}
        />
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      </div>

      <div className="text-center relative py-4">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">Read the Word, Ignore the Color</p>
        <div className="relative group">
           <h2 
            className="text-8xl font-black italic game-font transition-all duration-150 transform group-hover:scale-105"
            style={{ 
              color: COLORS[textColor].hex, 
              textShadow: `0 0 30px ${COLORS[textColor].hex}88, 0 4px 0 rgba(0,0,0,0.5)` 
            }}
          >
            {COLORS[target].name}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {COLORS.map((color, idx) => (
          <button
            key={color.name}
            onClick={() => handleMatch(idx)}
            className={`
              h-24 rounded-[2.5rem] border-4 border-white/10 transition-all 
              hover:scale-105 active:scale-90 shadow-2xl hover:brightness-110
              ${color.bg} flex items-center justify-center
            `}
          >
            <div className="w-full h-full rounded-[2rem] border-t-2 border-white/20" />
          </button>
        ))}
      </div>

      <div className="text-center bg-white/5 px-8 py-4 rounded-3xl border border-white/10 shadow-xl w-full">
        <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">Score Multiplier x{difficultyRef.current.toFixed(1)}</p>
        <p className="text-5xl font-black text-white italic tabular-nums drop-shadow-md tracking-tighter">
          {score.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ColorClash;
