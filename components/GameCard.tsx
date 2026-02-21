
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
    <div className="w-full h-full relative overflow-hidden group-hover:scale-105 transition-transform duration-700">
      <img 
        src={`https://picsum.photos/seed/${game.id}/600/400`} 
        alt={game.name}
        className="w-full h-full object-cover filter brightness-75 group-hover:brightness-90 transition-all duration-700"
        referrerPolicy="no-referrer"
      />
      <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-40 mix-blend-overlay`} />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
      
      <div className="absolute top-4 left-4 z-20">
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl text-white shadow-2xl group-hover:rotate-12 transition-all duration-500">
          <i className={`fas ${game.icon}`}></i>
        </div>
      </div>

      <div className="absolute bottom-4 left-6 right-6 z-20">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-1 block">{game.category}</span>
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
          {game.name}
        </h3>
      </div>
    </div>
  );
};

const GameCard: React.FC<GameCardProps> = ({ game, onPlay, highScore, index, isFavorite, onToggleFavorite }) => {
  return (
    <div 
      className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_50px_rgba(79,70,229,0.2)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/5 stagger-item" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Favorite Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-xl backdrop-blur-md border transition-all flex items-center justify-center active:scale-75 ${
          isFavorite 
            ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.4)]' 
            : 'bg-black/20 border-white/10 text-white/60 hover:text-white hover:bg-black/40'
        }`}
      >
        <i className={`fas fa-star ${isFavorite ? 'scale-110' : ''}`}></i>
      </button>

      {/* Hero Section */}
      <div className="h-56 overflow-hidden relative" onClick={onPlay}>
        <GameHero game={game} />
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow" onClick={onPlay}>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mb-3 tracking-wide line-clamp-1">
          {game.tagline}
        </p>
        
        <p className="text-slate-600 dark:text-slate-400 text-[13px] leading-relaxed line-clamp-2 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {game.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-0.5">Personal Best</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-black text-lg italic tabular-nums">
              {highScore > 0 ? highScore.toLocaleString() : '---'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600/0 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
              Launch
            </span>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-indigo-500/40">
              <i className="fas fa-arrow-right text-xs"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
