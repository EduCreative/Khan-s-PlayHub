
import React, { useState } from 'react';
import { Game, Category, UserProfile } from '../types';
import GameCard from './GameCard';
import Logo from './Logo';
import Leaderboard from './Leaderboard';

interface HubProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  filter: Category | 'All' | 'Favorites' | 'Leaderboard';
  setFilter: (filter: Category | 'All' | 'Favorites' | 'Leaderboard') => void;
  highScores: Record<string, number>;
  userProfile: UserProfile;
  isDarkMode: boolean;
  syncStatus: 'synced' | 'pending' | 'offline';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenAdmin: () => void;
  onOpenSettings: () => void;
}

const Hub: React.FC<HubProps> = ({ 
  games, onSelectGame, filter, setFilter, highScores, userProfile, isDarkMode, syncStatus, onToggleTheme, onOpenProfile, onToggleFavorite, onOpenAdmin, onOpenSettings
}) => {
  const [vClickCount, setVClickCount] = useState(0);

  const filteredGames = filter === 'All' 
    ? games 
    : filter === 'Favorites'
    ? games.filter(g => userProfile.favorites.includes(g.id))
    : filter === 'Leaderboard'
    ? []
    : games.filter(g => g.category === filter);

  const categories = ['All', 'Favorites', 'Leaderboard', ...Object.values(Category)];

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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 flex flex-col gap-6 md:gap-12 animate-in fade-in duration-700">
      <header id="hub-header" className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-indigo-500/20 backdrop-blur-xl shadow-2xl transition-all">
        <div className="flex items-center gap-4 md:gap-6">
          <Logo size={window.innerWidth < 768 ? 60 : 80} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase dark:text-white text-slate-900 leading-none">
                Khan's <span className="text-indigo-600 dark:text-indigo-400">PlayHub</span>
              </h1>
              <div className={`mt-1 flex items-center justify-center w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] animate-pulse ${
                syncStatus === 'synced' ? 'text-emerald-500 bg-emerald-500' : 
                syncStatus === 'pending' ? 'text-amber-500 bg-amber-500' : 
                'text-rose-500 bg-rose-500 shadow-rose-500/50'
              }`} title={`Nexus Cloud Status: ${syncStatus.toUpperCase()}`} />
            </div>
            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1">Micro-Gaming Nexus v2.5.0</p>
            <p className="text-[7px] md:text-[9px] font-bold text-indigo-500/80 uppercase tracking-widest ml-1 mt-1 hidden sm:block">
              Free Focus Games & Brain Training: Boost Your Memory & Attention
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button id="profile-btn" onClick={onOpenProfile} className="flex items-center gap-3 px-4 h-12 md:h-14 rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95 border-2 border-indigo-400/20">
             <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center"><i className={`fas ${userProfile.avatar} text-xs`}></i></div>
             <span className="hidden md:block font-black uppercase italic tracking-tighter text-sm">{userProfile.username}</span>
          </button>
          <button id="settings-btn" onClick={onOpenSettings} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all">
            <i className="fas fa-cog text-slate-500"></i>
          </button>
          <button id="theme-toggle" onClick={onToggleTheme} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700">
             <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'}`}></i>
          </button>
        </div>
      </header>

      <div id="category-filters" className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat as any)} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${filter === cat ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 text-slate-500 hover:border-indigo-500/30'}`}>
            {cat === 'Favorites' && <i className="fas fa-star mr-1.5 text-amber-400"></i>}{cat}
          </button>
        ))}
      </div>

      <div className="text-center">
        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 italic">
          "Boost your mind with fun, 5-minute daily challenges."
        </p>
      </div>

      {filter === 'All' && (
        <section id="daily-training" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 md:p-8 rounded-[2rem] border border-indigo-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic text-white">Daily Training Protocol</h2>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Recommended for optimal neural plasticity</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {['resonance-breathing', 'reaction-test', 'color-clash'].map(id => {
              const game = games.find(g => g.id === id);
              if (!game) return null;
              return (
                <button 
                  key={id}
                  onClick={() => onSelectGame(game)}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <i className={`fas ${game.icon} text-xs`}></i>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase italic">{game.name}</h3>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">5 Min Session</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {filter === 'Leaderboard' ? (
        <Leaderboard games={games} />
      ) : (
        <div id="games-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 min-h-[400px]">
          {filteredGames.map((game: Game, idx: number) => (
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
      )}

      <footer className="flex flex-col items-center gap-8 mt-8 pb-12">
        <div className="w-full max-w-2xl glass-card p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white">Contact Developer</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nexus Support & Feedback</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:kmasroor50@gmail.com" className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-500 transition-all group">
              <i className="fas fa-envelope text-indigo-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-xs font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300">kmasroor50@gmail.com</span>
            </a>
            <a href="https://wa.me/923331306603" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 transition-all group">
              <i className="fab fa-whatsapp text-emerald-500 group-hover:scale-110 transition-transform"></i>
              <span className="text-xs font-black uppercase tracking-tighter text-slate-600 dark:text-slate-300">+92 333 1306603</span>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span 
            onClick={handleVersionClick}
            className="px-6 py-2 glass-card border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 cursor-pointer hover:bg-indigo-500/5 transition-all select-none"
          >
            <span className={`w-1.5 h-1.5 rounded-full animate-ping ${syncStatus === 'synced' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            Nexus Cloud Protocol Enabled v2.5.0
          </span>
          <button onClick={onOpenAdmin} className="text-[9px] font-bold text-slate-500/30 hover:text-indigo-500/40 transition-colors uppercase tracking-widest mt-2">
             <i className="fas fa-terminal mr-2"></i> Access Admin Console
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Hub;
