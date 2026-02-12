
import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  index: number;
  onPlay: () => void;
  highScore: number;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPlay, highScore }) => {
  return (
    <div 
      className="group relative glass-card rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-4 hover:shadow-3xl hover:shadow-indigo-500/30 active:scale-95 border-2 border-transparent hover:border-indigo-500/50 dark:hover:border-indigo-400/50"
      onClick={onPlay}
    >
      {/* Shine Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-[2.5rem]">
        <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine transition-opacity" />
      </div>

      {/* Game Image Preview */}
      <div className="h-44 md:h-52 overflow-hidden relative">
        <img 
          src={game.imageUrl || `https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400`} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
        <div className={`absolute top-4 left-4 w-12 h-12 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-xl text-white shadow-xl transform transition-transform group-hover:rotate-12 group-hover:scale-110 z-20`}>
          <i className={`fas ${game.icon}`}></i>
        </div>
        <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-all opacity-80 group-hover:opacity-100 z-20">
           <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase text-white tracking-widest border border-white/30 shadow-sm">
             {game.category}
           </span>
        </div>
      </div>

      <div className="p-7 relative z-10 flex flex-col h-[210px] dark:bg-transparent bg-white/30 transition-colors">
        <h3 className="text-2xl font-black mb-2 dark:text-white text-slate-900 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase italic tracking-tighter">
          {game.name}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed line-clamp-2 font-medium transition-colors">
          {game.tagline}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold mb-1">Elite Score</span>
            <span className="text-indigo-600 dark:text-indigo-300 font-black text-xl italic drop-shadow-sm">{highScore.toLocaleString()}</span>
          </div>
          
          <button className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30 group-hover:scale-110 active:scale-90 border-2 border-indigo-400/20">
            <i className="fas fa-play text-lg"></i>
          </button>
        </div>
      </div>

      {/* Background Subtle Gradient Accent */}
      <div className={`absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-br ${game.color} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity pointer-events-none`} />
      
      {/* Decorative Sparkles on Hover */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <i className="fas fa-sparkles text-indigo-400 animate-spin-slow"></i>
      </div>
    </div>
  );
};

export default GameCard;
