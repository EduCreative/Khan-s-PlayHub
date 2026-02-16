
import React, { useState, useEffect, useCallback, useRef } from 'react';

const BitMaster: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [binary, setBinary] = useState('');
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const scoreRef = useRef(0);

  const generateProblem = useCallback(() => {
    const val = Math.floor(Math.random() * 16); // 4-bit range
    setBinary(val.toString(2).padStart(4, '0'));
    setAnswer(val);

    const opts = new Set<number>();
    opts.add(val);
    while (opts.size < 4) {
      const fake = Math.floor(Math.random() * 16);
      opts.add(fake);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      scoreRef.current = 0;
      setTimeLeft(15);
      generateProblem();
    }
  }, [isPlaying, generateProblem]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 0.1) { onGameOver(scoreRef.current); return 0; }
        return t - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, onGameOver]);

  const handleChoice = (val: number) => {
    if (feedback || !isPlaying) return;
    if (val === answer) {
      setFeedback('correct');
      const points = 100 + Math.floor(timeLeft * 10);
      scoreRef.current += points;
      setScore(scoreRef.current);
      setTimeLeft(t => Math.min(15, t + 3));
      setTimeout(generateProblem, 400);
    } else {
      setFeedback('wrong');
      setTimeLeft(t => Math.max(0, t - 4));
      setTimeout(() => setFeedback(null), 600);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-sm px-6 animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-cyan-500/20 border-2 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Buffer</span>
          <span className={`text-2xl font-black tabular-nums ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-cyan-500'}`}>{timeLeft.toFixed(1)}s</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Decryption Score</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className={`text-center py-8 transition-all duration-300 ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Decrypt Signal</p>
        <div className="flex gap-2 justify-center">
          {binary.split('').map((bit, i) => (
            <div key={i} className={`w-14 h-20 rounded-2xl flex items-center justify-center text-5xl font-black italic shadow-2xl transition-all duration-300 ${feedback === 'correct' ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-cyan-400 border-2 border-cyan-500/30'}`}>
              {bit}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={`
              h-20 glass-card rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-2
              ${feedback === 'correct' && opt === answer ? 'bg-emerald-500 border-emerald-400 text-white' : ''}
              ${feedback === 'wrong' && opt !== answer ? 'opacity-50' : 'hover:scale-105 active:scale-95 border-cyan-500/10'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
      
      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-6 py-2 rounded-full border border-white/5">
        <i className="fas fa-microchip text-cyan-400"></i>
        <span>Convert 4-bit Binary to Decimal</span>
      </div>
    </div>
  );
};

export default BitMaster;
