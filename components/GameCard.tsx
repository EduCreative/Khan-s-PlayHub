
import React from 'react';
import { Game, Category } from '../types';

interface GameCardProps {
  game: Game;
  index: number;
  onPlay: () => void;
  highScore: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const GameHero: React.FC<{ game: Game }> = ({ game }) => {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${game.color} relative overflow-hidden flex items-center justify-center`}>
      <div className="absolute inset-0 bg-grid-white/5 opacity-20" />
      <div className="relative z-10 w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl text-white shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
        <i className={`fas ${game.icon} drop-shadow-2xl`}></i>
      </div>
    </div>
  );
};

const GameCard: React.FC<GameCardProps> = ({ game, onPlay, highScore, index, isFavorite, onToggleFavorite }) => {
  return (
    <div className="group relative glass-card rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-4 hover:shadow-3xl hover:shadow-indigo-500/30 active:scale-95 stagger-item" style={{ animationDelay: `${index * 80}ms` }}>
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-xl backdrop-blur-md border-2 transition-all flex items-center justify-center active:scale-75 ${isFavorite ? 'bg-amber-400/20 border-amber-400/50 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-black/20 border-white/10 text-white/40 hover:text-white'}`}
      >
        <i className={`fas fa-star ${isFavorite ? 'animate-pulse' : ''}`}></i>
      </button>

      <div className="h-44 md:h-48 overflow-hidden relative" onClick={onPlay}>
        <GameHero game={game} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
      </div>

      <div className="p-7 relative z-10 flex flex-col h-[200px] dark:bg-transparent bg-white/30" onClick={onPlay}>
        <h3 className="text-2xl font-black mb-2 dark:text-white text-slate-900 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tighter">
          {game.name}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed line-clamp-2 font-medium">
          {game.tagline}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Elite Score</span>
            <span className="text-indigo-600 dark:text-indigo-300 font-black text-xl italic tabular-nums">{highScore.toLocaleString()}</span>
          </div>
          <button className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30 group-hover:scale-110 active:scale-90 border-2 border-indigo-400/20">
            <i className="fas fa-play"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
