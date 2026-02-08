
import React from 'react';

interface RiddleRiftProps {
  onGameOver: (score: number) => void;
}

const RiddleRift: React.FC<RiddleRiftProps> = () => {
  return (
    <div className="w-full max-w-md p-10 glass-card rounded-[3rem] border-slate-500/30 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-24 h-24 bg-slate-800 rounded-[2rem] mx-auto flex items-center justify-center text-4xl mb-8 shadow-2xl relative">
        <i className="fas fa-microchip text-slate-400"></i>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
            <i className="fas fa-tools text-[10px] text-white"></i>
        </div>
      </div>
      
      <h2 className="text-3xl font-black mb-4 italic tracking-tighter uppercase dark:text-white text-slate-900 transition-colors">
        System <span className="text-indigo-500">Calibration</span>
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
        Our AI Core is currently being upgraded to the latest neural model. Riddle Rift will return in the next update with even more challenging puzzles.
      </p>

      <div className="space-y-3">
        <div className="w-full bg-slate-800/50 h-2 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[65%] animate-pulse"></div>
        </div>
        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em]">Calibration: 65%</p>
      </div>

      <div className="mt-10 pt-8 border-t border-white/5">
        <p className="text-xs text-slate-500 italic">"Patience is the key to all secrets."</p>
      </div>
    </div>
  );
};

export default RiddleRift;
