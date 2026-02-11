
import React, { useState, useEffect, useCallback } from 'react';

const QUESTIONS = [
  { sentence: "They ____ going to the park yesterday.", options: ["were", "was", "are", "be"], answer: "were" },
  { sentence: "She ____ her keys in the car.", options: ["left", "leaved", "leaf", "laved"], answer: "left" },
  { sentence: "Neither of the boys ____ here.", options: ["is", "are", "am", "be"], answer: "is" },
  { sentence: "Whose/Who's bag is this?", options: ["Whose", "Who's"], answer: "Whose" },
  { sentence: "Your/You're doing a great job!", options: ["You're", "Your"], answer: "You're" },
  { sentence: "I should have ____ better.", options: ["known", "knew", "knowed", "know"], answer: "known" }
];

const GrammarGuardian: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [current, setCurrent] = useState(QUESTIONS[0]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const nextQuestion = useCallback(() => {
    setCurrent(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      setTimeLeft(60);
      nextQuestion();
    }
  }, [isPlaying, nextQuestion]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { onGameOver(score); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, onGameOver, score]);

  const handleChoice = (opt: string) => {
    if (feedback) return;
    if (opt === current.answer) {
      setFeedback('correct');
      setScore(s => s + 500);
      setTimeout(nextQuestion, 500);
    } else {
      setFeedback('wrong');
      setTimeLeft(t => Math.max(0, t - 10));
      setTimeout(() => setFeedback(null), 800);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-lg px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-emerald-500/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</span>
          <span className={`text-3xl font-black tabular-nums ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>{timeLeft}s</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lexicon Rank</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full text-center space-y-8">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Repair the Syntax Rift</p>
        <div className="glass-card p-8 rounded-[2.5rem] border-2 border-emerald-500/10 min-h-[160px] flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-bold italic dark:text-white text-slate-800 leading-relaxed">
            "{current.sentence}"
          </h2>
        </div>
      </div>

      <div className={`grid ${current.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-4 w-full`}>
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleChoice(opt)}
            className={`
              h-20 glass-card rounded-2xl flex items-center justify-center text-xl font-black transition-all border-2
              ${feedback === 'correct' && opt === current.answer ? 'bg-emerald-500 border-emerald-400 text-white' : ''}
              ${feedback === 'wrong' && opt !== current.answer ? 'opacity-50' : 'hover:scale-105 active:scale-95 border-emerald-500/10'}
            `}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GrammarGuardian;
