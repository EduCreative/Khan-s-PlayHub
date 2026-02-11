
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

const Hub: React.FC<HubProps> = ({ 
  games, 
  onSelectGame, 
  filter, 
  setFilter, 
  highScores, 
  isDarkMode, 
  onToggleTheme 
}) => {
  const categories: (Category | 'All')[] = ['All', ...Object.values(Category)];
  const filteredGames = filter === 'All' 
    ? games 
    : games.filter(g => g.category === filter);

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="space-y-4">
          <div className="flex items-center gap-6 group">
            <Logo size={64} className="group-hover:rotate-[360deg] transition-transform duration-1000 ease-in-out" />
            <div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tight uppercase dark:text-white text-slate-900 leading-tight transition-colors duration-500 pr-2">
                Khan's <span className="text-gradient inline-block pr-1">PlayHub</span>
              </h1>
              <div className="h-1.5 w-32 bg-gradient-to-r from-indigo-600 to-transparent mt-2 rounded-full" />
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xl text-lg leading-relaxed transition-colors duration-500">
            Enter the nexus of elite <span className="text-indigo-500 font-bold">AI-enhanced</span> arcade challenges. Fast, fluid, and forever free.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex flex-col items-end border-r border-indigo-500/20 pr-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Active Portals</span>
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 italic leading-none transition-colors duration-500 animate-pulse">{games.length}</span>
          </div>

          <button 
            onClick={onToggleTheme}
            className={`
              w-16 h-16 glass-card rounded-3xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95 border-2 border-indigo-500/20 shadow-xl group overflow-hidden relative
              ${isDarkMode ? 'shadow-indigo-500/10' : 'shadow-amber-500/10'}
            `}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <div className={`theme-icon-transition absolute inset-0 flex items-center justify-center ${isDarkMode ? 'translate-y-0 rotate-0 scale-100' : 'translate-y-20 rotate-90 scale-50'}`}>
               <i className="fas fa-sun text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"></i>
            </div>
            <div className={`theme-icon-transition absolute inset-0 flex items-center justify-center ${isDarkMode ? '-translate-y-20 -rotate-90 scale-50' : 'translate-y-0 rotate-0 scale-100'}`}>
               <i className="fas fa-moon text-indigo-600 drop-shadow-[0_0_8px_rgba(79,70,229,0.5)]"></i>
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 mb-16">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`
              whitespace-nowrap px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all border-2 duration-500
              ${filter === cat 
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-2xl shadow-indigo-500/50 scale-105 z-10' 
                : 'glass-card border-indigo-500/10 dark:text-slate-400 text-slate-600 hover:border-indigo-500/40 hover:bg-white/5'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 mb-20">
        {filteredGames.map((game, idx) => (
          <div key={game.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
            <GameCard 
              game={game}
              index={idx}
              onPlay={() => onSelectGame(game)}
              highScore={highScores[game.id] || 0}
            />
          </div>
        ))}
      </div>

      {/* About Us Section */}
      <section className="mb-24 max-w-lg mx-auto">
        <div className="glass-card rounded-[2rem] p-6 border border-indigo-500/10 shadow-lg relative overflow-hidden group transition-all duration-700 hover:border-indigo-500/30">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <h2 className="text-xl font-black italic uppercase tracking-tighter dark:text-white text-slate-900 mb-2">
              The <span className="text-indigo-500">Nexus</span> Mission
            </h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium text-[12px] mb-5 max-w-sm">
              Curated high-fidelity mini-games crafted for the modern web. Instant entertainment—no downloads.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 w-full">
              <a 
                href="mailto:kmasroor50@gmail.com" 
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-indigo-500/30 rounded-lg transition-all group/link"
              >
                <i className="fas fa-envelope text-indigo-500 group-hover/link:scale-110 transition-transform text-[10px]"></i>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">kmasroor50@gmail.com</span>
              </a>
              
              <a 
                href="https://wa.me/923331306603" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 rounded-lg transition-all group/link"
              >
                <i className="fab fa-whatsapp text-emerald-500 group-hover/link:scale-110 transition-transform text-[12px]"></i>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">+92 333 1306603</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center gap-4">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
        <span className="px-6 py-2 glass-card border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-inner flex items-center gap-3 transition-colors duration-500">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
          App Version 2.0.0 Stable
        </span>
      </div>
    </div>
  );
};

export default Hub;
