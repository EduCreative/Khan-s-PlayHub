
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
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
  { question: "I have a neck but no head. What am I?", answer: "BOTTLE", hint: "Common for holding liquids." }
];

const RiddleRift: React.FC<{ onGameOver: (s: number) => void }> = ({ onGameOver }) => {
  const [currentRiddle, setCurrentRiddle] = useState<Riddle>(LOCAL_RIDDLES[0]);
  const [userInput, setUserInput] = useState("");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showHint, setShowHint] = useState(false);

  const fetchAIRiddle = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "undefined") return LOCAL_RIDDLES[Math.floor(Math.random() * LOCAL_RIDDLES.length)];

    try {
      setIsLoading(true);
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a clever one-word-answer riddle for a cyberpunk game. Return JSON with 'question', 'answer' (uppercase), and 'hint'.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
              hint: { type: Type.STRING }
            },
            required: ["question", "answer", "hint"]
          }
        }
      });
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return LOCAL_RIDDLES[Math.floor(Math.random() * LOCAL_RIDDLES.length)];
    } finally {
      setIsLoading(false);
    }
  };

  const nextRiddle = async () => {
    setUserInput("");
    setFeedback(null);
    setShowHint(false);
    setHintUsed(false);
    
    // Mix local and AI
    if (Math.random() > 0.4) {
      const air = await fetchAIRiddle();
      setCurrentRiddle(air);
    } else {
      setCurrentRiddle(LOCAL_RIDDLES[Math.floor(Math.random() * LOCAL_RIDDLES.length)]);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isLoading) return;

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
            <h2 className="text-xl font-black italic text-white uppercase tracking-tighter">Riddle Rift</h2>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full ${i < streak ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</span>
          <p className="text-3xl font-black text-indigo-400 italic">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className={`w-full glass-card p-10 rounded-[3rem] border-2 transition-all duration-500 relative overflow-hidden ${feedback === 'correct' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' : feedback === 'wrong' ? 'border-rose-500 animate-shake' : 'border-indigo-500/20'}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fas fa-brain text-8xl"></i>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <i className="fas fa-sync-alt fa-spin text-4xl text-indigo-500"></i>
            <p className="text-indigo-400 font-black uppercase tracking-widest text-xs">Opening Rift...</p>
          </div>
        ) : (
          <>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-relaxed text-center italic">
              "{currentRiddle.question}"
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="TYPE YOUR ANSWER..."
                autoFocus
                className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-4 px-6 text-center text-2xl font-black uppercase tracking-widest focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-700 text-indigo-400"
              />

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => { setShowHint(true); setHintUsed(true); }}
                  disabled={showHint}
                  className="py-4 glass-card border-indigo-500/20 text-slate-400 font-black uppercase text-xs tracking-[0.2em] hover:text-indigo-400 transition-all active:scale-95"
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
          </>
        )}
      </div>

      <button 
        onClick={() => onGameOver(score)}
        className="mt-12 text-slate-500 hover:text-white font-black uppercase tracking-[0.3em] text-[10px] transition-colors"
      >
        <i className="fas fa-power-off mr-2"></i> Terminate Connection
      </button>
    </div>
  );
};

export default RiddleRift;
