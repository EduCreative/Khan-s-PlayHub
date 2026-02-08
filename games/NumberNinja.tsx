
import React, { useState, useEffect, useCallback } from 'react';

interface NumberNinjaProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
}

const NumberNinja: React.FC<NumberNinjaProps> = ({ onGameOver, isPlaying }) => {
  const [equation, setEquation] = useState('');
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  const generateEquation = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1;
    const b = Math.floor(Math.random() * 12) + 1;
    const result = a + b;
    setEquation(`${a} + ${b}`);
    
    const others = new Set<number>();
    others.add(result);
    while (others.size < 3) {
      others.add(result + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1));
    }
    setOptions(Array.from(others).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      generateEquation();
      setScore(0);
      setTimeLeft(30);
    }
  }, [isPlaying, generateEquation]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, onGameOver]);

  const handleChoice = (val: number) => {
    const [a, b] = equation.split(' + ').map(Number);
    if (val === a + b) {
      setScore(s => s + 250);
      generateEquation();
    } else {
      setTimeLeft(t => Math.max(0, t - 3));
      // Subtle shake effect could be added here
    }
  };

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-lg px-4">
      <div className="flex justify-between w-full glass-card p-6 rounded-3xl">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase">Multiplier</p>
          <p className="text-2xl font-black text-cyan-400">x{Math.floor(score/1000) + 1}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase">Combo Score</p>
          <p className="text-4xl font-black text-indigo-400">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase">Limit</p>
          <p className="text-2xl font-black text-rose-500">{timeLeft}s</p>
        </div>
      </div>

      <div className="text-center py-20">
        <h2 className="text-8xl font-black neon-text italic game-font">{equation}</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className="group relative h-32 glass-card rounded-[2rem] flex items-center justify-center text-5xl font-black hover:scale-105 active:scale-95 transition-all overflow-hidden border-cyan-500/20"
          >
             <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors" />
             <span className="relative z-10">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NumberNinja;
