import React, { useState } from 'react';
import { Game, Category, UserProfile } from '../types';
import GameCard from './GameCard';
import Logo from './Logo';
import Leaderboard from './Leaderboard';

interface HubProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  filter: Category | 'All' | 'Favorites';
  setFilter: (filter: Category | 'All' | 'Favorites') => void;
  highScores: Record<string, number>;
  userProfile: UserProfile;
  isDarkMode: boolean;
  syncStatus: 'synced' | 'pending' | 'offline';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenAdmin: () => void;
}

const Hub: React.FC<HubProps> = ({ 
  games, onSelectGame, filter, setFilter, highScores, userProfile, isDarkMode, syncStatus, onToggleTheme, onOpenProfile, onToggleFavorite, onOpenAdmin
}) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [vClickCount, setVClickCount] = useState(0);

  const filteredGames = filter === 'All' 
    ? games 
    : filter === 'Favorites'
    ? games.filter(g => userProfile.favorites.includes(g.id))
    : games.filter(g => g.category === filter);

  const categories = ['All', 'Favorites', ...Object.values(Category)];

  const handleVersionClick = () => {
    const nextCount = vClickCount + 1;
    if (nextCount >= 5) {
      onOpenAdmin();
      setVClickCount(0);
    } else {
      setVClickCount(nextCount);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col gap-12 md:gap-20 animate-in fade-in duration-1000">
      {/* Hero Header */}
      <header id="hub-header" className="relative flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Logo size={window.innerWidth < 768 ? 70 : 90} />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] text-white font-black border-4 border-slate-50 dark:border-[#0f172a]">
                <i className="fas fa-bolt"></i>
              </div>
            </div>
            <div className="h-12 w-[1px] bg-slate-200 dark:bg-white/10 hidden md:block" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 dark:text-indigo-400 mb-1">Nexus Protocol v2.5</span>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] animate-pulse ${
                  syncStatus === 'synced' ? 'text-emerald-500 bg-emerald-500' : 
                  syncStatus === 'pending' ? 'text-amber-500 bg-amber-500' : 
                  'text-rose-500 bg-rose-500'
                }`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Cloud {syncStatus}</span>
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter uppercase dark:text-white text-slate-900 leading-[0.85] mb-6">
            Khan's <br />
            <span className="text-indigo-600 dark:text-indigo-400">PlayHub</span>
          </h1>
          
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-md leading-relaxed mb-8">
            Access the elite micro-gaming nexus. A curated collection of hyper-addictive challenges designed for the modern operative.
          </p>

          <div className="flex items-center gap-4">
            <button onClick={onOpenProfile} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-tighter text-sm shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3">
              <i className={`fas ${userProfile.avatar}`}></i>
              {userProfile.username}
            </button>
            <button onClick={() => setShowLeaderboard(true)} className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-amber-500 shadow-xl border border-slate-200 dark:border-white/5 hover:scale-110 transition-all">
              <i className="fas fa-trophy text-xl"></i>
            </button>
          </div>
        </div>

        {/* Decorative Stats Card */}
        <div className="hidden lg:flex flex-col gap-4 w-80">
          <div className="glass-card p-6 rounded-[2rem] border-indigo-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Global Rank</span>
              <i className="fas fa-chart-line text-indigo-500"></i>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white mb-1">#1,242</div>
            <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">+12% this week</div>
          </div>
          <div className="glass-card p-6 rounded-[2rem] border-white/5 bg-indigo-600/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Score</span>
              <i className="fas fa-star text-amber-400"></i>
            </div>
            <div className="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white mb-1">
              {Object.values(highScores).reduce((a, b) => a + b, 0).toLocaleString()}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nexus Credits</div>
          </div>
          <button onClick={onToggleTheme} className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
            <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'}`}></i>
            {isDarkMode ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </header>

      {/* Filter Section */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-200 dark:border-white/5 pb-8">
          <div className="flex flex-col items-center md:items-start">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">The Collection</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredGames.length} Missions Available</span>
          </div>
          
          <div id="category-filters" className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat as any)} 
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  filter === cat 
                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500 hover:border-indigo-500/30'
                }`}
              >
                {cat === 'Favorites' && <i className="fas fa-star mr-2 text-amber-400"></i>}
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div id="games-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredGames.map((game, idx) => (
            <GameCard 
              key={game.id} 
              game={game} 
              index={idx} 
              onPlay={() => onSelectGame(game)} 
              highScore={highScores[game.id] || 0}
              isFavorite={userProfile.favorites.includes(game.id)}
              onToggleFavorite={() => onToggleFavorite(game.id)}
            />
          ))}
        </div>
      </div>

      {showLeaderboard && (
        <Leaderboard 
          onClose={() => setShowLeaderboard(false)} 
          userScore={Object.values(highScores).reduce((a: number, b: number) => a + b, 0)} 
        />
      )}

      <footer className="flex flex-col items-center gap-8 mt-12 pb-20">
        <div className="w-24 h-[1px] bg-slate-200 dark:bg-white/10" />
        
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Contact the Developer</p>
          <div className="flex items-center gap-6">
            <a href="mailto:kmasroor50@gmail.com" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors">
              <i className="fas fa-envelope text-lg"></i>
              <span>Email</span>
            </a>
            <a href="https://wa.me/923000000000" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors">
              <i className="fab fa-whatsapp text-lg"></i>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <span 
            onClick={handleVersionClick}
            className="px-8 py-3 glass-card border-indigo-500/10 text-slate-400 dark:text-slate-500 rounded-full text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-4 cursor-pointer hover:text-indigo-500 transition-all select-none"
          >
            Nexus Cloud Protocol v2.7.0
          </span>
          <button onClick={onOpenAdmin} className="text-[10px] font-black text-slate-400/40 hover:text-indigo-500/60 transition-colors uppercase tracking-[0.2em]">
             <i className="fas fa-terminal mr-2"></i> System Administration
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Hub;