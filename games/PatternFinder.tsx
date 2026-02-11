
import React, { useState, useEffect, useCallback } from 'react';

const PatternFinder: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [sequence, setSequence] = useState<(string | number)[]>([]);
  const [options, setOptions] = useState<(string | number)[]>([]);
  const [correctAnswer, setCorrectAnswer] = useState<string | number>('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generatePattern = useCallback(() => {
    const types = ['arithmetic', 'geometric', 'rotation', 'symbols'];
    const type = types[Math.floor(Math.random() * types.length)];
    let seq: (string | number)[] = [];
    let next: string | number = '';

    if (type === 'arithmetic') {
      const start = Math.floor(Math.random() * 20);
      const step = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < 4; i++) seq.push(start + i * step);
      next = start + 4 * step;
    } else if (type === 'symbols') {
      const syms = ['▲', '■', '●', '◆', '★', '✖'];
      const a = syms[Math.floor(Math.random() * syms.length)];
      const b = syms[Math.floor(Math.random() * syms.length)];
      seq = [a, b, a, b];
      next = a;
    } else {
      const start = Math.floor(Math.random() * 5) + 1;
      const mult = 2;
      for (let i = 0; i < 4; i++) seq.push(start * Math.pow(mult, i));
      next = start * Math.pow(mult, 4);
    }

    setSequence(seq);
    setCorrectAnswer(next);

    const opts = new Set<string | number>();
    opts.add(next);
    while (opts.size < 4) {
      if (typeof next === 'number') {
        const fake = next + (Math.random() > 0.5 ? 2 : -2) * (Math.floor(Math.random() * 5) + 1);
        if (fake > 0) opts.add(fake);
      } else {
        const syms = ['▲', '■', '●', '◆', '★', '✖'];
        opts.add(syms[Math.floor(Math.random() * syms.length)]);
      }
    }
    setOptions(Array.from(opts).sort(() => Math.random() - 0.5));
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      setLevel(1);
      generatePattern();
    }
  }, [isPlaying, generatePattern]);

  const handleChoice = (val: string | number) => {
    if (feedback) return;
    if (val === correctAnswer) {
      setFeedback('correct');
      setScore(s => s + (level * 200));
      setLevel(l => l + 1);
      setTimeout(() => { setFeedback(null); generatePattern(); }, 500);
    } else {
      setFeedback('wrong');
      setTimeout(() => { onGameOver(score); }, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-lg px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-amber-500/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Tier</span>
          <span className="text-3xl font-black text-amber-500 italic">Lv.{level}</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Link</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full text-center space-y-8">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Predict the Next Vector</p>
        <div className="flex justify-center gap-4">
          {sequence.map((s, i) => (
            <div key={i} className="w-16 h-16 md:w-20 md:h-20 glass-card rounded-2xl flex items-center justify-center text-3xl font-black shadow-inner border border-white/5">
              {s}
            </div>
          ))}
          <div className="w-16 h-16 md:w-20 md:h-20 glass-card rounded-2xl flex items-center justify-center text-3xl font-black border-2 border-dashed border-indigo-500/30 text-indigo-500 animate-pulse">
            ?
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={`
              h-24 glass-card rounded-2xl flex items-center justify-center text-3xl font-black transition-all border-2
              ${feedback === 'correct' && opt === correctAnswer ? 'bg-amber-500 border-amber-400 text-white' : ''}
              ${feedback === 'wrong' && opt !== correctAnswer ? 'opacity-50' : 'hover:scale-105 active:scale-95 border-amber-500/10'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PatternFinder;
