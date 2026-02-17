import React, { useState, useEffect, useRef } from 'react';
import Logo from '../components/Logo';

interface Riddle {
  question: string;
  answer: string;
  hint: string;
}

const LOCAL_RIDDLES: Riddle[] = [
  { question: "I have keys, but no locks. I have a space, but no room. You can enter, but never leave. What am I?", answer: "KEYBOARD", hint: "You're likely using one right now." },
  { question: "The more of me there is, the less you see. What am I?", answer: "DARKNESS", hint: "It disappears when you flip a switch." },
  { question: "I follow you all day long, but when the sun sets, I disappear. What am I?", answer: "SHADOW", hint: "Light creates me, but night kills me." },
  { question: "I have branches, but no fruit, trunk, or leaves. What am I?", answer: "BANK", hint: "Think of where money goes." },
  { question: "What has to be broken before you can use it?", answer: "EGG", hint: "Breakfast favorite." },
  { question: "I am full of holes but still hold water. What am I?", answer: "SPONGE", hint: "Found in the kitchen sink." },
  { question: "What is always in front of you but can’t be seen?", answer: "FUTURE", hint: "It hasn't happened yet." },
  { question: "I have a neck but no head. What am I?", answer: "BOTTLE", hint: "Common for holding liquids." },
  { question: "What gets wetter the more it dries?", answer: "TOWEL", hint: "Used after a shower." },
  { question: "What building has the most stories?", answer: "LIBRARY", hint: "Books are stored here." }
];

const RiddleRift: React.FC<{ onGameOver: (s: number) => void }> = ({ onGameOver }) => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle>(LOCAL_RIDDLES[0]);
  const [displayedQuestion, setDisplayedQuestion] = useState("");
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Fix: Use any to avoid NodeJS namespace error in browser environments.
  const typewriterRef = useRef<any>(null);

  useEffect(() => {
    let i = 0;
    setDisplayedQuestion("");
    if (typewriterRef.current) clearInterval(typewriterRef.current);
    
    typewriterRef.current = setInterval(() => {
      setDisplayedQuestion(currentRiddle.question.slice(0, i));
      i++;
      if (i > currentRiddle.question.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 25);
    
    return () => { if (typewriterRef.current) clearInterval(typewriterRef.current); };
  }, [currentRiddle]);

  const nextRiddle = () => {
    setUserInput("");
    setFeedback(null);
    setShowHint(false);
    setHintUsed(false);
    
    let next;
    do {
      next = LOCAL_RIDDLES[Math.floor(Math.random() * LOCAL_RIDDLES.length)];
    } while (next.question === currentRiddle.question);
    
    setCurrentRiddle(next);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim()) return;

    const isCorrect = userInput.trim().toUpperCase() === currentRiddle.answer.toUpperCase();
    
    if (isCorrect) {
      setFeedback('correct');
      const points = hintUsed ? 500 : 1000;
      setScore(s => s + points);
      setStreak(s => s + 1);
      setTimeout(() => nextRiddle(), 1500);
    } else {
      setFeedback('wrong');
      setStreak(0);
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl px-6 py-12 animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center mb-12 glass-card p-6 rounded-3xl border-indigo-500/30 shadow-xl">
        <div className="flex items-center gap-4">
          <Logo size={40} />
          <div>
            <h2 className="text-xl font-black italic dark:text-white text-slate-900 uppercase tracking-tighter">Riddle Rift</h2>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full transition-all duration-500 ${i < streak ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]' : 'bg-slate-300 dark:bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Score</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums drop-shadow-md">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className={`w-full glass-card p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden ${feedback === 'correct' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : feedback === 'wrong' ? 'border-rose-500 animate-shake' : 'border-indigo-500/20'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fas fa-terminal text-8xl dark:text-white text-slate-900"></i>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-800 mb-8 leading-relaxed min-h-[120px] text-center italic transition-colors font-mono">
          "{displayedQuestion}<span className="animate-pulse">_</span>"
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="SYSTEM INPUT REQUIRED..."
            autoFocus
            className="w-full bg-slate-100 dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-center text-2xl font-black uppercase tracking-widest focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 focus:outline-none transition-all dark:placeholder:text-slate-700 placeholder:text-slate-400 dark:text-indigo-400 text-indigo-700"
          />

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => { setShowHint(true); setHintUsed(true); }}
              disabled={showHint}
              className="py-4 glass-card border-indigo-500/20 text-slate-500 dark:text-slate-400 font-black uppercase text-xs tracking-[0.2em] hover:text-indigo-400 transition-all active:scale-95 disabled:opacity-50"
            >
              <i className="fas fa-lightbulb mr-2"></i> {showHint ? currentRiddle.hint : "Decryption Hint"}
            </button>
            <button 
              type="submit"
              className="py-4 bg-indigo-600 rounded-2xl text-white font-black italic uppercase tracking-tighter hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              VALIDATE <i className="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
        </form>
      </div>

      <button 
        onClick={() => onGameOver(score)}
        className="mt-12 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-colors flex items-center gap-2 group"
      >
        <i className="fas fa-power-off group-hover:rotate-90 transition-transform"></i> Terminate Neural Link
      </button>
    </div>
  );
};

export default RiddleRift;