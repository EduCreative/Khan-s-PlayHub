
import React, { useState, useEffect, useRef } from 'react';

const ReactionTest: React.FC<{ onGameOver: (score: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [state, setState] = useState<'idle' | 'waiting' | 'click' | 'result' | 'early'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const [attempts, setAttempts] = useState<number[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      setState('idle');
      setAttempts([]);
      setReactionTime(0);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [isPlaying]);

  const startTest = () => {
    setState('waiting');
    const delay = 2000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setState('click');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === 'waiting') {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setState('early');
    } else if (state === 'click') {
      const endTime = Date.now();
      const diff = endTime - startTime;
      setReactionTime(diff);
      setAttempts(prev => [...prev, diff]);
      setState('result');
    }
  };

  const reset = () => {
    if (attempts.length >= 5) {
      const avg = attempts.reduce((a, b) => a + b, 0) / attempts.length;
      // Score calculation: higher score for lower reaction time
      // 1000ms = 0 points, 200ms = 80 points
      const score = Math.max(0, Math.round((1000 - avg) / 10));
      onGameOver(score);
    } else {
      setState('idle');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md h-full min-h-[400px]">
      <div 
        onClick={handleClick}
        className={`
          w-full h-64 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 border-4
          ${state === 'idle' ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-500/20' : ''}
          ${state === 'waiting' ? 'bg-rose-500 border-rose-400 animate-pulse' : ''}
          ${state === 'click' ? 'bg-emerald-500 border-emerald-400 scale-105 shadow-2xl shadow-emerald-500/40' : ''}
          ${state === 'result' ? 'bg-slate-800 border-slate-700' : ''}
          ${state === 'early' ? 'bg-amber-500 border-amber-400' : ''}
        `}
      >
        <div className="text-center p-8">
          {state === 'idle' && (
            <>
              <i className="fas fa-bolt text-5xl text-white mb-4"></i>
              <h2 className="text-2xl font-black uppercase italic text-white">Reaction Test</h2>
              <p className="text-indigo-200 text-sm mt-2">Click anywhere to start</p>
            </>
          )}
          {state === 'waiting' && (
            <>
              <h2 className="text-4xl font-black uppercase italic text-white">Wait for Green...</h2>
            </>
          )}
          {state === 'click' && (
            <>
              <h2 className="text-6xl font-black uppercase italic text-white">CLICK!</h2>
            </>
          )}
          {state === 'result' && (
            <>
              <h2 className="text-5xl font-black text-white mb-2 tabular-nums">{reactionTime}ms</h2>
              <p className="text-slate-400 uppercase font-black text-xs tracking-widest">Response Time</p>
            </>
          )}
          {state === 'early' && (
            <>
              <i className="fas fa-exclamation-triangle text-5xl text-white mb-4"></i>
              <h2 className="text-2xl font-black uppercase italic text-white">Too Early!</h2>
              <p className="text-amber-100 text-sm mt-2">Wait for the green signal</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 w-full">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress: {attempts.length}/5</span>
          {attempts.length > 0 && (
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
              Avg: {Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)}ms
            </span>
          )}
        </div>
        <div className="flex gap-2 mb-8">
          {[0, 1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`flex-1 h-2 rounded-full transition-all ${i < attempts.length ? 'bg-indigo-500' : 'bg-white/5'}`}
            />
          ))}
        </div>

        {state === 'idle' && attempts.length === 0 && (
          <button 
            onClick={startTest}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all"
          >
            Start Protocol
          </button>
        )}

        {(state === 'result' || state === 'early') && (
          <button 
            onClick={attempts.length >= 5 ? reset : startTest}
            className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:bg-white/20 transition-all"
          >
            {attempts.length >= 5 ? 'Complete Session' : 'Next Attempt'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReactionTest;
