
import React, { useState, useEffect, useCallback, useRef } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const QuickMath: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [equation, setEquation] = useState('');
  const [answer, setAnswer] = useState(0);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  
  const scoreRef = useRef(0);

  const generateProblem = useCallback(() => {
    if (!difficulty) return;
    
    let operators = ['+', '-'];
    if (difficulty === 'Medium') operators.push('*');
    if (difficulty === 'Hard') operators.push('*');
    
    const op = operators[Math.floor(Math.random() * operators.length)];
    let a, b, ans;

    const range = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 50 : 100;

    if (op === '+') { 
      a = Math.floor(Math.random() * range) + 1; 
      b = Math.floor(Math.random() * range) + 1; 
      ans = a + b; 
    }
    else if (op === '-') { 
      a = Math.floor(Math.random() * range) + (range / 2); 
      b = Math.floor(Math.random() * a); 
      ans = a - b; 
    }
    else { 
      const multRange = difficulty === 'Medium' ? 10 : 15;
      a = Math.floor(Math.random() * multRange) + 2; 
      b = Math.floor(Math.random() * multRange) + 2; 
      ans = a * b; 
    }

    setEquation(`${a} ${op} ${b}`);
    setAnswer(ans);

    const opts = new Set<number>();
    opts.add(ans);
    while (opts.size < 4) {
      const offset = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 10) + 1);
      if (ans + offset > 0) opts.add(ans + offset);
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, [difficulty]);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setScore(0);
      scoreRef.current = 0;
      setTime(60);
      setEquation('');
      setOptions([]);
    }
  }, [isPlaying]);

  // Handle first generation when difficulty is selected
  useEffect(() => {
    if (difficulty && equation === '') {
      generateProblem();
    }
  }, [difficulty, equation, generateProblem]);

  useEffect(() => {
    if (!isPlaying || !difficulty || time <= 0) return;
    const timer = setInterval(() => {
      setTime(t => {
        if (t <= 1) { onGameOver(scoreRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, difficulty, time, onGameOver]);

  const handleChoice = (val: number) => {
    if (feedback) return;
    if (val === answer) {
      setFeedback('correct');
      const difficultyMult = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2;
      scoreRef.current += Math.floor((100 + (time > 30 ? 50 : 0)) * difficultyMult);
      setScore(scoreRef.current);
      setTime(t => Math.min(60, t + (difficulty === 'Easy' ? 3 : 2)));
      setTimeout(() => { setFeedback(null); generateProblem(); }, 400);
    } else {
      setFeedback('wrong');
      setTime(t => Math.max(0, t - (difficulty === 'Hard' ? 8 : 5)));
      setTimeout(() => { setFeedback(null); }, 600);
    }
  };

  const selectDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setTime(diff === 'Hard' ? 45 : 60);
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-calculator text-5xl text-indigo-500 mb-4"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Math Tier</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Select your arithmetic depth.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button
              key={level}
              onClick={() => selectDifficulty(level)}
              className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-indigo-500/10 hover:border-indigo-500 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Basic Ops' : level === 'Medium' ? 'Multi-Logic' : 'Hyper Calculation'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-indigo-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-md px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-indigo-500/20 shadow-xl border-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Left</span>
          <span className={`text-3xl font-black tabular-nums ${time < 10 ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`}>{time}s</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{difficulty} Mode</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className={`text-center py-12 transition-all duration-300 ${feedback === 'wrong' ? 'animate-shake' : ''}`}>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Solve the Nexus Logic</p>
        <h2 className={`text-7xl font-black italic game-font transition-colors ${feedback === 'correct' ? 'text-emerald-500 scale-110' : feedback === 'wrong' ? 'text-rose-500' : 'dark:text-white text-slate-900'}`}>
          {equation || '...'}
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
