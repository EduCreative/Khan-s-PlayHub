
import React from 'react';
import { Game, Category } from '../types';

interface GameCardProps {
  game: Game;
  index: number;
  onPlay: () => void;
  highScore: number;
}

const GameHero: React.FC<{ game: Game }> = ({ game }) => {
  // Select pattern based on category
  const renderPattern = () => {
    switch (game.category) {
      case Category.Puzzle:
        return (
          <pattern id={`pattern-${game.id}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="none" />
            <path d="M0 20 L40 20 M20 0 L20 40" stroke="white" strokeWidth="0.5" opacity="0.1" />
            <circle cx="20" cy="20" r="2" fill="white" opacity="0.1" />
          </pattern>
        );
      case Category.Math:
        return (
          <pattern id={`pattern-${game.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" />
            <circle cx="2" cy="2" r="1" fill="white" opacity="0.1" />
          </pattern>
        );
      case Category.Arcade:
        return (
          <pattern id={`pattern-${game.id}`} x="0" y="0" width="100" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="5" x2="100" y2="5" stroke="white" strokeWidth="1" opacity="0.05" />
          </pattern>
        );
      default:
        return (
          <pattern id={`pattern-${game.id}`} x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M0 0 L30 30 M30 0 L0 30" stroke="white" strokeWidth="0.5" opacity="0.05" />
          </pattern>
        );
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-br ${game.color} relative overflow-hidden flex items-center justify-center`}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>{renderPattern()}</defs>
        <rect width="100%" height="100%" fill={`url(#pattern-${game.id})`} />
        
        {/* Dynamic elements based on game type */}
        {game.id === 'binary-dash' && (
          <g opacity="0.2" className="animate-pulse">
            <text x="10%" y="30%" fill="white" className="font-mono text-xs">10110</text>
            <text x="70%" y="60%" fill="white" className="font-mono text-xs">00101</text>
            <text x="20%" y="80%" fill="white" className="font-mono text-xs">11010</text>
          </g>
        )}
        {game.id === 'cyber-defense' && (
          <g opacity="0.2" className="animate-spin-slow origin-center" style={{ transformOrigin: '50% 50%' }}>
            <circle cx="50%" cy="50%" r="35%" fill="none" stroke="white" strokeWidth="1" strokeDasharray="10 20" />
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5 5" />
          </g>
        )}
      </svg>

      {/* Large Glowing Center Icon */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl text-white shadow-[0_0_30px_rgba(255,255,255,0.2)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
          <i className={`fas ${game.icon} drop-shadow-2xl`}></i>
        </div>
      </div>

      {/* Decorative Light Rays */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
    </div>
  );
};

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

      {/* Custom SVG Game Hero */}
      <div className="h-44 md:h-52 overflow-hidden relative">
        <GameHero game={game} />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
        
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
    </div>
  );
};

export default GameCard;
