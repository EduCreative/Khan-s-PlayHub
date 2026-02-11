
import React, { useState, useEffect, useCallback, useRef } from 'react';

const QuickMath: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [equation, setEquation] = useState('');
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const scoreRef = useRef(0);

  const generateProblem = useCallback(() => {
    const operators = ['+', '-', '*'];
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a, b, ans;

    if (op === '+') { a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; ans = a + b; }
    else if (op === '-') { a = Math.floor(Math.random() * 50) + 20; b = Math.floor(Math.random() * a); ans = a - b; }
    else { a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 10) + 1; ans = a * b; }

    setEquation(`${a} ${op} ${b}`);
    setAnswer(ans);

    const opts = new Set<number>();
    opts.add(ans);
    while (opts.size < 4) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
      if (ans + offset > 0) opts.add(ans + offset);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      scoreRef.current = 0;
      setTime(60);
      generateProblem();
    }
  }, [isPlaying, generateProblem]);

  useEffect(() => {
    if (!isPlaying || time <= 0) return;
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) { onGameOver(scoreRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, time, onGameOver]);

  const handleChoice = (val: number) => {
    if (feedback) return;
    if (val === answer) {
      setFeedback('correct');
      scoreRef.current += 100 + (time > 30 ? 50 : 0);
      setScore(scoreRef.current);
      setTime(t => Math.min(60, t + 2));
      setTimeout(() => { setFeedback(null); generateProblem(); }, 400);
    } else {
      setFeedback('wrong');
      setTime(t => Math.max(0, t - 5));
      setTimeout(() => { setFeedback(null); }, 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-md px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-indigo-500/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Left</span>
          <span className={`text-3xl font-black tabular-nums ${time < 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`}>{time}s</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Calculated XP</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className={`text-center py-12 transition-all duration-300 ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Solve the Nexus Logic</p>
        <h2 className={`text-7xl font-black italic game-font transition-colors ${feedback === 'correct' ? 'text-emerald-500 scale-110' : feedback === 'wrong' ? 'text-rose-500' : 'dark:text-white text-slate-900'}`}>
          {equation}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={`
              h-24 glass-card rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-2
              ${feedback === 'correct' && opt === answer ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]' : ''}
              ${feedback === 'wrong' && opt !== answer ? 'opacity-50' : 'hover:scale-105 active:scale-95 border-indigo-500/10'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickMath;
