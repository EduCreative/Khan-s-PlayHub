
import React, { useState } from 'react';
import { Game } from '../types';
import { audioService } from '../services/audioService';

interface GameCardProps {
  game: Game;
  index: number;
  onPlay: () => void;
  highScore: number;
  globalRecord?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onChallenge?: () => void;
}

const GameHudOverlay: React.FC<{ gameId: string; category: string }> = ({ gameId, category }) => {
  switch (gameId) {
    case 'neon-racer':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono font-black text-amber-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-gauge-high text-amber-400 animate-pulse"></i>
            <span>240 KM/H</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-amber-400/80 uppercase">NITRO</span>
            <div className="w-10 h-1.5 bg-black/60 rounded-full overflow-hidden border border-amber-400/40">
              <div className="w-4/5 h-full bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse"></div>
            </div>
          </div>
        </div>
      );
    case 'fruit-vortex':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-bold text-rose-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-rose-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5 text-rose-400">
            <i className="fas fa-fire-flame-curved animate-bounce"></i>
            <span>3x COMBO</span>
          </div>
          <span className="text-amber-300 font-extrabold">+500 PTS</span>
        </div>
      );
    case 'sky-strike':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono font-black text-cyan-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-crosshairs text-cyan-400 animate-spin"></i>
            <span>TARGET LOCK</span>
          </div>
          <span className="text-emerald-400 font-bold">ALT 12,000 FT</span>
        </div>
      );
    case 'tetris':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono font-black text-fuchsia-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-fuchsia-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-layer-group text-fuchsia-400"></i>
            <span>4 LINES</span>
          </div>
          <span className="text-purple-300 font-bold">NEXT: [T]</span>
        </div>
      );
    case 'snake-arena':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono font-black text-emerald-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-dragon text-emerald-400"></i>
            <span>LEN: 84</span>
          </div>
          <span className="text-emerald-400 font-bold">BOOST 100%</span>
        </div>
      );
    case 'sudoku-lite':
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-mono font-black text-blue-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-blue-500/40 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-table-cells text-blue-400"></i>
            <span>9x9 GRID</span>
          </div>
          <span className="text-indigo-300">LOGIC CHECK</span>
        </div>
      );
    default:
      return (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between text-[10px] font-medium text-slate-300 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 shadow-xl pointer-events-none z-20">
          <div className="flex items-center gap-1.5">
            <i className="fas fa-gamepad text-indigo-400"></i>
            <span className="font-bold text-white">{category}</span>
          </div>
          <span className="text-[9px] font-mono font-bold text-indigo-300 uppercase tracking-wider">GAMEPLAY HUD</span>
        </div>
      );
  }
};

const GameHero: React.FC<{ game: Game }> = ({ game }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={`w-full h-full bg-gradient-to-br ${game.color} relative overflow-hidden flex items-center justify-center group/hero`}>
      {/* Background grid texture */}
      <div className="absolute inset-0 bg-grid-white/5 opacity-30 z-0" />

      {/* Screenshot Image */}
      {game.screenshot && !imgError ? (
        <img
          src={game.screenshot}
          alt={`${game.name} gameplay screenshot`}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out z-0"
        />
      ) : (
        /* Fallback icon hero if image fails */
        <div className="relative z-10 w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-4xl text-white shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
          <i className={`fas ${game.icon} drop-shadow-2xl`}></i>
        </div>
      )}

      {/* Gradient Vignette Overlay for Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-black/30 opacity-70 group-hover:opacity-50 transition-opacity duration-500 z-10" />

      {/* Top Left "LIVE SCREENSHOT" Tag */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-wider text-white shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span>SCREENSHOT</span>
      </div>

      {/* Game HUD Overlay Element */}
      <GameHudOverlay gameId={game.id} category={game.category} />

      {/* Hover Center Play Icon Reel */}
      <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-indigo-950/30 backdrop-blur-[2px]">
        <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white border-2 border-indigo-400/50 flex items-center justify-center text-xl shadow-[0_0_25px_rgba(79,70,229,0.8)] scale-75 group-hover:scale-100 transition-transform duration-300">
          <i className="fas fa-play ml-1"></i>
        </div>
      </div>
    </div>
  );
};

const GameCard: React.FC<GameCardProps> = ({ game, onPlay, highScore, globalRecord, index, isFavorite, onToggleFavorite, onChallenge }) => {
  return (
    <div className="group relative glass-card rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-4 hover:shadow-3xl hover:shadow-indigo-500/30 active:scale-95 stagger-item" 
      style={{ animationDelay: `${index * 80}ms` }}
      onMouseEnter={() => audioService.playNav()}
    >
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
            <div className="flex flex-col mb-2">
              <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Personal Best</span>
              <span className="text-indigo-600 dark:text-indigo-300 font-black text-lg italic tabular-nums leading-none">{highScore.toLocaleString()}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-widest text-amber-500 font-bold">Global Record</span>
              <span className="text-amber-600 dark:text-amber-400 font-black text-xs italic tabular-nums leading-none">
                {globalRecord !== undefined ? globalRecord.toLocaleString() : '---'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {highScore > 0 && onChallenge && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onChallenge();
                }}
                className="w-11 h-11 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 flex items-center justify-center hover:bg-amber-500/20 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                title="Challenge a Friend to beat your score!"
              >
                <i className="fas fa-swords text-xs"></i>
              </button>
            )}
            <button className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-500/30 group-hover:scale-110 active:scale-90 border-2 border-indigo-400/20">
              <i className="fas fa-play"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
