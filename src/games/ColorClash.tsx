
import React, { useState, useEffect, useCallback, useRef } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const COLORS = [
  { name: 'PINK', hex: '#ec4899', bg: 'bg-pink-500' },
  { name: 'CYAN', hex: '#06b6d4', bg: 'bg-cyan-500' },
  { name: 'LIME', hex: '#84cc16', bg: 'bg-lime-500' },
  { name: 'AMBER', hex: '#f59e0b', bg: 'bg-amber-500' }
];

const ColorClash: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean; sfxVolume: number; hapticFeedback: boolean }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [target, setTarget] = useState(0);
  const [textColor, setTextColor] = useState(1);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1.0);
  const [isWrong, setIsWrong] = useState(false);
  
  const difficultyRef = useRef(1.0);
  const scoreRef = useRef(0);
  const isGameOverTriggered = useRef(false);

  const playSfx = useCallback((src: string, volume: number) => {
    if (volume > 0) {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play();
    }
  }, []);

  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const nextRound = useCallback(() => {
    setTarget(Math.floor(Math.random() * COLORS.length));
    setTextColor(Math.floor(Math.random() * COLORS.length));
    setTimeLeft(1.0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setScore(0);
      scoreRef.current = 0;
      difficultyRef.current = 1.0;
      isGameOverTriggered.current = false;
      setIsWrong(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty) return;

    const baseDecay = difficulty === 'Easy' ? 0.002 : difficulty === 'Medium' ? 0.004 : 0.007;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - (baseDecay * difficultyRef.current);
        
        if (next <= 0 && !isGameOverTriggered.current) {
          isGameOverTriggered.current = true;
          setTimeout(() => onGameOver(scoreRef.current), 50);
          return 0;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [isPlaying, difficulty, onGameOver]);

  const handleMatch = (index: number) => {
    if (!isPlaying || isGameOverTriggered.current || !difficulty) return;

    if (index === target) {
      playSfx('/sfx/correct.mp3', sfxVolume);
      triggerHapticFeedback();
      const difficultyBonus = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 2 : 3;
      const newScore = scoreRef.current + (10 * difficultyBonus);
      scoreRef.current = newScore;
      setScore(newScore);
      
      const rampSpeed = difficulty === 'Hard' ? 0.1 : 0.06;
      difficultyRef.current = Math.min(5.0, difficultyRef.current + rampSpeed);
      nextRound();
    } else {
      playSfx('/sfx/wrong.mp3', sfxVolume);
      triggerHapticFeedback();
      setIsWrong(true);
      isGameOverTriggered.current = true;
      setTimeout(() => onGameOver(scoreRef.current), 400);
    }
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-palette text-5xl text-rose-500 mb-4 animate-float"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Color Synapse</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Calibrate your response latency.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button
              key={level}
              onClick={() => { setDifficulty(level); nextRound(); }}
              className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-rose-500/10 hover:border-rose-500 transition-all active:scale-95 stagger-item"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Patient Spectrum' : level === 'Medium' ? 'Reflex Pulse' : 'Neural Overload'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-rose-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
              <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-12 w-full max-w-sm px-4 select-none animate-in fade-in zoom-in duration-500 transition-transform ${isWrong ? 'animate-glitch' : ''}`}>
      <div className="w-full h-5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border-2 border-slate-300 dark:border-white/10 p-1 shadow-inner relative transition-colors">
        <div 
          className={`h-full rounded-full transition-all duration-75 ease-linear shadow-[0_0_20px_rgba(236,72,153,0.5)] ${timeLeft < 0.3 ? 'bg-red-500 animate-pulse' : 'bg-gradient-to-r from-pink-500 to-indigo-500'}`}
          style={{ width: `${Math.max(0, timeLeft * 100)}%` }}
        />
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      </div>

      <div className="text-center relative py-4">
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-4">Read Word • Ignore Color</p>
        <div className="relative group">
           <h2 
            className={`text-8xl font-black italic game-font transition-all duration-300 transform drop-shadow-2xl ${timeLeft < 0.4 ? 'scale-110' : 'scale-100'}`}
            style={{ 
              color: COLORS[textColor].hex, 
              textShadow: `0 0 30px ${COLORS[textColor].hex}88, 0 4px 0 rgba(0,0,0,0.5)`,
              animation: timeLeft < 0.4 ? 'pulse 0.2s infinite' : 'pulse 1.5s infinite'
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
              h-24 rounded-[2.5rem] border-4 border-slate-200 dark:border-white/10 transition-all 
              hover:scale-105 active:scale-90 shadow-2xl hover:brightness-110
              ${color.bg} flex items-center justify-center group overflow-hidden
            `}
          >
            <div className="w-full h-full rounded-[2rem] border-t-2 border-white/30 group-active:scale-95 transition-transform" />
          </button>
        ))}
      </div>

      <div className="text-center bg-slate-100 dark:bg-white/5 px-8 py-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl w-full transition-colors stagger-item">
        <p className="text-slate-500 text-[10px] font-black uppercase mb-1 tracking-widest">{difficulty} Multiplier x{difficultyRef.current.toFixed(1)}</p>
        <p className="text-5xl font-black dark:text-white text-slate-900 italic tabular-nums drop-shadow-md tracking-tighter transition-colors">
          {score.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default ColorClash;
