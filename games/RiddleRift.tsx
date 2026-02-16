import React, { useState, useEffect } from 'react';
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
  { question: "What building has the most stories?", answer: "LIBRARY", hint: "Books are stored here." },
  { question: "What has one eye but cannot see?", answer: "NEEDLE", hint: "Used for sewing." },
  { question: "What has legs, but doesn’t walk?", answer: "TABLE", hint: "Furniture item." },
  { question: "What has a thumb and four fingers, but is not a hand?", answer: "GLOVE", hint: "Clothing for cold weather." },
  { question: "What goes up but never comes down?", answer: "AGE", hint: "Every birthday adds to it." },
  { question: "What has many teeth, but cannot bite?", answer: "COMB", hint: "Used for hair." },
  { question: "What begins with T, finishes with T, and has T in it?", answer: "TEAPOT", hint: "Beverage container." },
  { question: "What is easy to get into but hard to get out of?", answer: "TROUBLE", hint: "A difficult situation." },
  { question: "What can travel all around the world without leaving its corner?", answer: "STAMP", hint: "Goes on an envelope." },
  { question: "What is so fragile that saying its name breaks it?", answer: "SILENCE", hint: "The opposite of noise." },
  { question: "What has a face and two hands but no arms or legs?", answer: "CLOCK", hint: "Tells the time." },
  { question: "What can you catch, but not throw?", answer: "COLD", hint: "A common illness." },
  { question: "What belongs to you, but everyone else uses it more?", answer: "NAME", hint: "How people address you." },
  { question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "ECHO", hint: "Reflection of sound." },
  { question: "You see a boat filled with people. It has not sunk, but when you look again you don’t see a single person on the boat. Why?", answer: "MARRIED", hint: "Everyone was in a pair." },
  { question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", answer: "MAP", hint: "A visual representation of earth." },
  { question: "What has words, but never speaks?", answer: "BOOK", hint: "You read me." },
  { question: "What runs all around a backyard, yet never moves?", answer: "FENCE", hint: "A boundary marker." },
  { question: "What can you break, even if you never pick it up or touch it?", answer: "PROMISE", hint: "Your word to someone." },
  { question: "What has 88 keys, but can’t open a single door?", answer: "PIANO", hint: "A musical instrument." },
  { question: "What has a bottom at the top?", answer: "LEGS", hint: "Body parts below the torso." },
  { question: "The person who makes it, sells it. The person who buys it, never uses it. The person who uses it, never knows they are. What is it?", answer: "COFFIN", hint: "Final resting place." },
  { question: "I have no life, but I can die. What am I?", answer: "BATTERY", hint: "Powers your devices." },
  { question: "What has to be pulled to work?", answer: "TRIGGER", hint: "Part of a mechanism." },
  { question: "What kind of band never plays music?", answer: "RUBBER", hint: "Stretchy loop." },
  { question: "What can you keep after giving it to someone?", answer: "WORD", hint: "A promise." },
  { question: "If you have me, you want to share me. If you share me, you haven't got me. What am I?", answer: "SECRET", hint: "Private information." },
  { question: "What has a head and a tail but no body?", answer: "COIN", hint: "Currency." },
  { question: "What can fill a room but takes up no space?", answer: "LIGHT", hint: "The sun provides it." },
  { question: "What is black when it’s clean and white when it’s dirty?", answer: "CHALKBOARD", hint: "Used in old schools." },
  { question: "I’m tall when I’m young, and I’m short when I’m old. What am I?", answer: "CANDLE", hint: "Wick and wax." },
  { question: "What is full of holes but still holds water?", answer: "SPONGE", hint: "Kitchen tool." }
];

const RiddleRift: React.FC<{ onGameOver: (s: number) => void }> = ({ onGameOver }) => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle>(LOCAL_RIDDLES[0]);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);

  const nextRiddle = () => {
    setUserInput("");
    setFeedback(null);
    setShowHint(false);
    setHintUsed(false);
    
    // Pick a new riddle that isn't the current one to ensure freshness
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
      <div className="w-full flex justify-between items-center mb-12 glass-card p-6 rounded-3xl border-indigo-500/30">
        <div className="flex items-center gap-4">
          <Logo size={40} />
          <div>
            <h2 className="text-xl font-black italic dark:text-white text-slate-900 uppercase tracking-tighter">Riddle Rift</h2>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full ${i < streak ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-slate-300 dark:bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className={`w-full glass-card p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden ${feedback === 'correct' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : feedback === 'wrong' ? 'border-rose-500 animate-shake' : 'border-indigo-500/20'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fas fa-brain text-8xl dark:text-white text-slate-900"></i>
        </div>

        <h3 className="text-2xl md:text-3xl font-bold dark:text-white text-slate-800 mb-8 leading-relaxed text-center italic transition-colors">
          "{currentRiddle.question}"
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="TYPE YOUR ANSWER..."
            autoFocus
            className="w-full bg-slate-100 dark:bg-black/40 border-2 border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-center text-2xl font-black uppercase tracking-widest focus:border-indigo-500 focus:outline-none transition-all dark:placeholder:text-slate-700 placeholder:text-slate-400 dark:text-indigo-400 text-indigo-700"
          />

          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => { setShowHint(true); setHintUsed(true); }}
              disabled={showHint}
              className="py-4 glass-card border-indigo-500/20 text-slate-500 dark:text-slate-400 font-black uppercase text-xs tracking-[0.2em] hover:text-indigo-400 transition-all active:scale-95"
            >
              <i className="fas fa-lightbulb mr-2"></i> {showHint ? currentRiddle.hint : "Need a Hint?"}
            </button>
            <button 
              type="submit"
              className="py-4 bg-indigo-600 rounded-2xl text-white font-black italic uppercase tracking-tighter hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
            >
              ANALYZE <i className="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
        </form>
      </div>

      <button 
        onClick={() => onGameOver(score)}
        className="mt-12 text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-colors"
      >
        <i className="fas fa-power-off mr-2"></i> Terminate Connection
      </button>
    </div>
  );
};

export default RiddleRift;