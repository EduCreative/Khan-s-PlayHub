
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface NumberNinjaProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
}

const NumberNinja: React.FC<NumberNinjaProps> = ({ onGameOver, isPlaying }) => {
  const [equation, setEquation] = useState('');
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [feedback, setFeedback] = useState<{ index: number; type: 'correct' | 'wrong' } | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  
  const scoreRef = useRef(0);

  const generateEquation = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1;
    const b = Math.floor(Math.random() * 12) + 1;
    const result = a + b;
    setEquation(`${a} + ${b}`);
    
    const others = new Set<number>();
    others.add(result);
    while (others.size < 3) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 5) + 1);
      const fake = result + offset;
      if (fake > 0) others.add(fake);
    }
    setOptions(Array.from(others).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      generateEquation();
      setScore(0);
      scoreRef.current = 0;
      setTimeLeft(30);
      setIsTimeUp(false);
      setFeedback(null);
    }
  }, [isPlaying, generateEquation]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0 || isTimeUp) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, isTimeUp]);

  const handleChoice = (val: number, index: number) => {
    if (feedback || isTimeUp) return;

    const [a, b] = equation.split(' + ').map(Number);
    const correct = a + b;

    if (val === correct) {
      setFeedback({ index, type: 'correct' });
      const points = 250 * (Math.floor(scoreRef.current / 1000) + 1);
      scoreRef.current += points;
      setScore(scoreRef.current);
      
      setTimeout(() => {
        setFeedback(null);
        generateEquation();
      }, 200);
    } else {
      setFeedback({ index, type: 'wrong' });
      setIsShaking(true);
      setTimeLeft(t => Math.max(0, t - 3));
      
      setTimeout(() => {
        setFeedback(null);
        setIsShaking(false);
      }, 400);
    }
  };

  if (isTimeUp) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full max-w-md px-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-full glass-card p-10 rounded-[3rem] border-indigo-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
          
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-4xl text-rose-500 mx-auto mb-6 shadow-inner">
            <i className="fas fa-hourglass-end animate-bounce"></i>
          </div>

          <h2 className="text-5xl font-black italic tracking-tighter uppercase dark:text-white text-slate-900 mb-2 transition-colors">
            Time <span className="text-rose-500">Over</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-8">Session Completed</p>

          <div className="bg-slate-100 dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/5 mb-8">
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mb-2">Final Ninja Score</p>
            <p className="text-6xl font-black text-indigo-500 tabular-nums drop-shadow-sm italic">
              {score.toLocaleString()}
            </p>
          </div>

          <button 
            onClick={() => onGameOver(score)}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xl transition-all shadow-xl shadow-indigo-500/30 uppercase italic tracking-tighter active:scale-95"
          >
            CONTINUE TO HUB
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg px-4 select-none">
      <div className="flex justify-between w-full glass-card p-6 rounded-3xl border-indigo-500/20 transition-colors">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Power</p>
          <p className="text-2xl font-black text-cyan-500 dark:text-cyan-400 italic">x{Math.floor(score/1000) + 1}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Juice</p>
          <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 italic drop-shadow-sm transition-colors">{score.toLocaleString()}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Limit</p>
          <p className={`text-2xl font-black tabular-nums transition-colors ${timeLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-slate-400 dark:text-slate-500'}`}>
            {timeLeft}s
          </p>
        </div>
      </div>

      <div className={`text-center py-16 transition-transform duration-75 ${isShaking ? 'animate-bounce translate-x-2' : ''}`}>
        <h2 className={`text-8xl md:text-9xl font-black neon-text italic game-font transition-all duration-300 ${isShaking ? 'text-rose-500 scale-95' : 'dark:text-white text-slate-900'}`}>
          {equation}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full">
        {options.map((opt, i) => {
          const isCorrect = feedback?.index === i && feedback.type === 'correct';
          const isWrong = feedback?.index === i && feedback.type === 'wrong';
          
          return (
            <button
              key={i}
              onClick={() => handleChoice(opt, i)}
              className={`
                group relative h-32 glass-card rounded-[2rem] flex items-center justify-center text-5xl font-black transition-all overflow-hidden border-2
                ${isCorrect ? 'bg-emerald-500 border-emerald-400 scale-110 z-20 shadow-[0_0_40px_rgba(52,211,153,0.5)]' : ''}
                ${isWrong ? 'bg-rose-500 border-rose-400 scale-95 shadow-[0_0_40px_rgba(244,63,94,0.5)]' : 'border-slate-200 dark:border-indigo-500/10 hover:border-indigo-500/40'}
                ${!feedback ? 'hover:scale-105 active:scale-95' : ''}
              `}
              disabled={!!feedback}
            >
               <div className={`absolute inset-0 transition-colors ${!feedback ? 'bg-slate-100/50 dark:bg-white/5 group-hover:bg-indigo-500/10' : ''}`} />
               <span className={`relative z-10 transition-colors ${isCorrect || isWrong ? 'text-white' : 'dark:text-white text-slate-900'}`}>{opt}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] bg-slate-100 dark:bg-white/5 px-6 py-2 rounded-full border border-slate-200 dark:border-white/5">
        <i className="fas fa-bolt text-cyan-500 dark:text-cyan-400"></i>
        <span className="dark:text-slate-400 text-slate-500">Correct Slices build Multipliers</span>
      </div>
    </div>
  );
};

export default NumberNinja;
