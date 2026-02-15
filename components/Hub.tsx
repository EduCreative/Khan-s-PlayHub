
import React from 'react';
import { Game, Category } from '../types';
import GameCard from './GameCard';
import Logo from './Logo';

interface HubProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  filter: Category | 'All';
  setFilter: (filter: Category | 'All') => void;
  highScores: Record<string, number>;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

/**
 * Main application hub featuring a responsive game grid and category filtering.
 * Designed with mobile-first responsiveness and immersive visual feedback.
 */
const Hub: React.FC<HubProps> = ({ 
  games, 
  onSelectGame, 
  filter, 
  setFilter, 
  highScores, 
  isDarkMode, 
  onToggleTheme 
}) => {
  // Filter games based on current selection
  const filteredGames = filter === 'All' 
    ? games 
    : games.filter(g => g.category === filter);

  const categories = ['All', ...Object.values(Category)];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 flex flex-col gap-6 md:gap-12 animate-in fade-in duration-700">
      {/* Responsive Header Section */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 bg-white/40 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 border-slate-200 dark:border-indigo-500/20 backdrop-blur-xl shadow-2xl transition-all duration-500">
        <div className="flex items-center gap-4 md:gap-6">
          <Logo size={window.innerWidth < 768 ? 60 : 80} />
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase dark:text-white text-slate-900 leading-none mb-1 md:mb-2">
              Khan's <span className="text-indigo-600 dark:text-indigo-400">PlayHub</span>
            </h1>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-indigo-300/60 ml-1">
              The Ultimate Micro-Gaming Nexus
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleTheme}
            className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg md:text-xl shadow-xl hover:scale-110 active:scale-95 transition-all border-2 border-slate-100 dark:border-slate-700"
            aria-label="Toggle Theme"
          >
            <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'}`}></i>
          </button>
        </div>
      </header>

      {/* Responsive Filter Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat as any)}
            className={`
              px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2
              ${filter === cat 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40 scale-105' 
                : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-indigo-500/30 hover:scale-105 active:scale-95'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Adaptive Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 min-h-[400px]">
        {filteredGames.map((game, idx) => (
          <GameCard 
            key={game.id} 
            game={game} 
            index={idx} 
            onPlay={() => onSelectGame(game)} 
            highScore={highScores[game.id] || 0}
          />
        ))}
        
        {filteredGames.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center animate-in zoom-in duration-500">
             <i className="fas fa-search text-6xl text-slate-300 dark:text-slate-700 mb-4"></i>
             <h3 className="text-xl font-bold text-slate-400">No games found in this sector</h3>
             <button 
               onClick={() => setFilter('All')} 
               className="mt-4 text-indigo-500 font-black uppercase tracking-widest text-xs underline decoration-2 underline-offset-4"
             >
               Return to All Sectors
             </button>
          </div>
        )}
      </div>

      {/* Footer Branding Section */}
      <footer className="flex flex-col items-center gap-4 mt-8 md:mt-12 pb-12">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <span className="px-6 py-2 glass-card border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-inner flex items-center gap-3 transition-colors duration-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          App Version 2.3.5 Stable
        </span>
      </footer>
    </div>
  );
};

export default Hub;
