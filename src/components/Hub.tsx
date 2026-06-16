
import React, { useState } from 'react';
import { Game, Category, UserProfile } from '../types';
import GameCard from './GameCard';
import Logo from './Logo';
import Leaderboard from './Leaderboard';
import VisualLeaderboard from './VisualLeaderboard';
import GlobalLeaderboard from './GlobalLeaderboard';
import { TactileQuickChat } from './TactileQuickChat';
import { User } from 'firebase/auth';

import { audioService } from '../services/audioService';

interface HubProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
  filter: Category | 'All' | 'Favorites' | 'Leaderboard' | 'Visual Leaderboard' | 'Global Leaderboard';
  setFilter: (filter: Category | 'All' | 'Favorites' | 'Leaderboard' | 'Visual Leaderboard' | 'Global Leaderboard') => void;
  highScores: Record<string, number>;
  globalRecords: Record<string, number>;
  userProfile: UserProfile;
  isDarkMode: boolean;
  syncStatus: 'synced' | 'pending' | 'offline';
  onSyncAll: () => void;
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onToggleFavorite: (id: string) => void;
  onUpdateGlobalRecord: (gameId: string, score: number) => void;
  onOpenAdmin: () => void;
  isAdmin: boolean;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isAuthReady: boolean;
  isLoggingIn?: boolean;
  updateStatus: 'idle' | 'checking' | 'downloading' | 'ready';
  updateProgress: number;
  appUpdate: { version: string; changelog: string[] } | null;
  onChallenge: (game: Game) => void;
  hasUnsyncedChanges?: boolean;
}

const Hub: React.FC<HubProps> = ({ 
  games, onSelectGame, filter, setFilter, highScores, globalRecords, userProfile, isDarkMode, syncStatus, onSyncAll, onToggleTheme, onOpenProfile, onToggleFavorite, onUpdateGlobalRecord, onOpenAdmin, isAdmin, onOpenSettings, onOpenPrivacy, canInstall, isInstalled, onInstall,
  user, onLogin, onLogout, isAuthReady, isLoggingIn = false, updateStatus, updateProgress, appUpdate, onChallenge, hasUnsyncedChanges = false
}) => {
  const [vClickCount, setVClickCount] = useState(0);
  const [adminClickCount, setAdminClickCount] = useState(0);

  const [logoSize, setLogoSize] = useState(80);

  React.useEffect(() => {
    const handleResize = () => setLogoSize(window.innerWidth < 768 ? 60 : 80);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredGames = filter === 'All' 
    ? games 
    : filter === 'Favorites'
    ? games.filter(g => (userProfile.favorites || []).includes(g.id))
    : filter === 'Leaderboard' || filter === 'Visual Leaderboard' || filter === 'Global Leaderboard'
    ? []
    : games.filter(g => g.category === filter);

  const categories = ['All', 'Favorites', 'Leaderboard', ...Object.values(Category)];

  const totalScore = Object.values(highScores).reduce((sum, s) => sum + s, 0);

  const handleVersionClick = () => {
    const nextCount = vClickCount + 1;
    audioService.playClick();
    if (nextCount >= 5) {
      onOpenAdmin();
      setVClickCount(0);
    } else {
      setVClickCount(nextCount);
    }
  };

  const handleAdminClick = () => {
    const nextCount = adminClickCount + 1;
    audioService.playClick();
    if (nextCount >= 5) {
      onOpenAdmin();
      setAdminClickCount(0);
    } else {
      setAdminClickCount(nextCount);
    }
  };

  const handleShare = async () => {
    audioService.playNav();
    const shareData = {
      title: "Khan's PlayHub",
      text: "Check out these awesome brain training games!",
      url: window.location.href,
    };

    try {
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share not supported or desktop');
      }
    } catch (err) {
      await navigator.clipboard.writeText(window.location.href);
      // Show a temporary toast or alert
      const btn = document.getElementById('share-btn');
      if (btn) {
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check text-emerald-500"></i>';
        setTimeout(() => {
          btn.innerHTML = originalContent;
        }, 2000);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-12 flex flex-col gap-6 md:gap-12 animate-in fade-in duration-700">
      <header id="hub-header" className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-indigo-500/20 backdrop-blur-xl shadow-2xl transition-all relative overflow-hidden">
        {updateStatus !== 'idle' && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800 z-50">
            <div 
              className={`h-full transition-all duration-500 shadow-[0_0_10px_currentColor] ${updateStatus === 'ready' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${updateProgress}%` }}
            />
            <div 
              onClick={() => window.location.reload()}
              className="absolute top-1 left-4 px-3 py-0.5 bg-indigo-600 rounded-b-lg text-[7px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2 animate-in slide-in-from-top-4 cursor-pointer hover:bg-emerald-600 transition-colors"
            >
              <i className={`fas ${updateStatus === 'ready' ? 'fa-check' : 'fa-sync-alt animate-spin'}`}></i>
              {updateStatus === 'checking' ? 'Checking for updates...' : updateStatus === 'downloading' ? `Downloading Update: ${updateProgress}%` : `Update Ready: v${appUpdate?.version || ''} - Click to Reload`}
            </div>
          </div>
        )}
        <div className="flex items-center gap-4 md:gap-6">
          <Logo size={logoSize} />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase dark:text-white text-slate-900 leading-none">
                Khan's <span className="text-indigo-600 dark:text-indigo-400">PlayHub</span>
              </h1>
              {(isAdmin || user?.email?.toLowerCase() === 'kmasroor50@gmail.com'.toLowerCase()) && (
                <button 
                  onClick={onOpenAdmin}
                  className="ml-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-rose-500 transition-all flex items-center gap-2 animate-pulse"
                >
                  <i className="fas fa-terminal"></i>
                  Admin Console
                </button>
              )}
            </div>
            <p className="text-[8px] md:text-[11px] font-black bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-1.5 rounded-full uppercase tracking-widest ml-1 mt-2 hidden sm:inline-block border-2 border-indigo-400/30 shadow-[0_0_15px_rgba(79,70,229,0.4)] animate-pulse">
              Free Focus Games & Brain Training: Boost Your Memory & Attention
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-1.5 md:gap-3 w-full md:w-auto">
          <div className="hidden sm:flex flex-col items-end mr-2 group relative">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              Total Juice <i className="fas fa-circle-info text-[6px] opacity-50"></i>
            </span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums italic leading-none">{totalScore.toLocaleString()}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 w-32 p-2 bg-slate-900 text-[8px] text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 border border-white/10 text-center">
              Sum of your high scores across all games
            </div>
          </div>
          <button id="profile-btn" onClick={onOpenProfile} className="flex items-center gap-2 px-3 md:px-4 h-10 md:h-14 rounded-xl md:rounded-2xl bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all active:scale-95 border-2 border-indigo-400/20 shrink-0">
             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center"><i className={`fas ${userProfile.avatar} text-xs`}></i></div>
             <span className="hidden md:block font-black uppercase italic tracking-tighter text-sm">{userProfile.username}</span>
          </button>

          {isAuthReady && !user && (
            <button 
              id="google-signin-btn"
              onClick={onLogin}
              disabled={isLoggingIn}
              className={`flex items-center gap-2 px-3 md:px-4 h-10 md:h-14 rounded-xl md:rounded-2xl font-black uppercase italic tracking-tighter shadow-xl transition-all active:scale-95 border-2 shrink-0 ${
                isLoggingIn 
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 border-transparent cursor-not-allowed opacity-75' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/20 shadow-indigo-500/10'
              }`}
              title="Sign in with your Google Account"
            >
              {isLoggingIn ? (
                <>
                  <i className="fas fa-spinner animate-spin text-xs"></i>
                  <span className="hidden sm:inline text-xs">Signing In...</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                  </div>
                  <span className="text-xs tracking-tight">Sign In</span>
                </>
              )}
            </button>
          )}

          {user && (
            <button 
              id="header-sync-btn"
              onClick={onSyncAll}
              disabled={syncStatus === 'pending'}
              className={`flex items-center gap-2 px-2.5 md:px-4 h-10 md:h-14 rounded-xl md:rounded-2xl font-black uppercase italic tracking-tighter shadow-xl transition-all active:scale-95 border-2 shrink-0 ${
                syncStatus === 'synced' && !hasUnsyncedChanges
                  ? 'bg-emerald-600/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400 hover:bg-emerald-600/20 shadow-emerald-500/5' 
                  : syncStatus === 'pending'
                  ? 'bg-amber-100 dark:bg-amber-500/10 border-amber-500/30 text-amber-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white border-indigo-400/20 shadow-indigo-500/25 animate-pulse'
              }`}
              title="Click to sync your offline high scores and profile with Firestore cloud database"
            >
              <i className={`fas fa-sync-alt text-xs ${syncStatus === 'pending' ? 'animate-spin' : ''}`}></i>
              <span className="text-xs">
                {syncStatus === 'synced' && !hasUnsyncedChanges ? 'Synced' : syncStatus === 'pending' ? 'Syncing...' : 'Sync Cloud'}
              </span>
              {(syncStatus === 'offline' || hasUnsyncedChanges) && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0"></span>
              )}
            </button>
          )}

          <button id="leaderboard-header-btn" onClick={() => setFilter('Leaderboard')} className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-base md:text-lg shadow-xl border-2 transition-all shrink-0 ${filter === 'Leaderboard' ? 'bg-amber-500 border-amber-400 text-white' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'}`} title="Global Leaderboards">
            <i className="fas fa-trophy"></i>
          </button>
          <button id="theme-toggle" onClick={onToggleTheme} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 shrink-0" title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
             <i className={`fas ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-600'}`}></i>
          </button>
          <button id="share-btn" onClick={handleShare} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all shrink-0" title="Share this app">
            <i className="fas fa-share-alt text-emerald-500"></i>
          </button>
          
          {canInstall && (
            <button id="install-btn" onClick={onInstall} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all animate-bounce shrink-0" title="Install App">
              <i className="fas fa-download text-indigo-500"></i>
            </button>
          )}
          {window.self !== window.top && (
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all shrink-0"
              title="Open in New Tab to Install"
            >
              <i className="fas fa-external-link-alt text-indigo-500"></i>
            </button>
          )}
          <button id="settings-btn" onClick={onOpenSettings} className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all shrink-0" title="App Settings">
            <i className="fas fa-cog text-slate-500"></i>
          </button>

          {user && (
            <button 
              onClick={onLogout}
              className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-base md:text-lg shadow-xl border-2 border-slate-100 dark:border-slate-700 hover:scale-110 active:scale-95 transition-all shrink-0"
              title="Sign Out"
            >
              <i className="fas fa-sign-out-alt text-rose-500"></i>
            </button>
          )}
        </div>
      </header>

      {isAdmin && (
        <div className="fixed bottom-6 left-6 z-[100] pointer-events-none">
          <div className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl border-2 border-white/20 flex items-center gap-3 animate-in slide-in-from-left duration-700">
            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
            Admin Mode Active
          </div>
        </div>
      )}

      <div id="category-filters" className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
        {categories.map((cat) => (
          <button 
            key={cat} 
            onClick={() => {
              setFilter(cat as any);
              audioService.playNav();
            }} 
            className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
              filter === cat 
                ? cat === 'Leaderboard' ? 'bg-amber-500 border-amber-400 text-white shadow-lg scale-105' 
                : cat === 'Visual Leaderboard' ? 'bg-indigo-650 border-indigo-550 text-white shadow-lg scale-105'
                : cat === 'Global Leaderboard' ? 'bg-purple-600 border-purple-400 text-white shadow-lg scale-105'
                : 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-105' 
                : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-white/5 text-slate-500 hover:border-indigo-500/30'
            }`}
          >
            {cat === 'Favorites' && <i className="fas fa-star mr-1.5 text-amber-400"></i>}
            {cat === 'Leaderboard' && <i className="fas fa-trophy mr-1.5 text-amber-400"></i>}
            {cat === 'Visual Leaderboard' && <i className="fas fa-chart-line mr-1.5 text-indigo-400"></i>}
            {cat === 'Global Leaderboard' && <i className="fas fa-chart-pie mr-1.5 text-purple-400"></i>}
            {cat}
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
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">1 Min Session</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {filter === 'Leaderboard' ? (
        <Leaderboard 
          games={games} 
          onBack={() => setFilter('All')} 
          onUpdateGlobalRecord={onUpdateGlobalRecord} 
          currentUser={user}
          userProfile={userProfile}
          globalRecords={globalRecords}
          highScores={highScores}
          isDarkMode={isDarkMode}
        />
      ) : (
        <div id="games-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 min-h-[400px]">
          {filteredGames.map((game: Game, idx: number) => (
            <GameCard 
              key={game.id} 
              game={game} 
              index={idx} 
              onPlay={() => onSelectGame(game)} 
              highScore={highScores[game.id] || 0}
              globalRecord={globalRecords[game.id]}
              isFavorite={(userProfile.favorites || []).includes(game.id)}
              onToggleFavorite={() => onToggleFavorite(game.id)}
              onChallenge={() => onChallenge(game)}
            />
          ))}
        </div>
      )}

      <footer className="flex flex-col items-center gap-8 mt-8 pb-12">
        <div className="w-full max-w-2xl glass-card p-6 md:p-8 rounded-[2.5rem] border-2 border-slate-200 dark:border-indigo-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white">Contact Developer</h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Support & Feedback</p>
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
            PlayHub Cloud Protocol Enabled v3.5.5
          </span>
          <button onClick={handleAdminClick} className="text-[9px] font-bold text-slate-500/60 hover:text-indigo-500 transition-colors uppercase tracking-widest mt-2">
             <i className="fas fa-terminal mr-2"></i> Access Admin Console
          </button>
          <button onClick={onOpenPrivacy} className="text-[9px] font-bold text-slate-500/60 hover:text-indigo-500 transition-colors uppercase tracking-widest mt-1">
             <i className="fas fa-shield-halved mr-2"></i> Privacy Policy
          </button>
        </div>
      </footer>
      <TactileQuickChat userProfile={userProfile} isDarkMode={isDarkMode} />
    </div>
  );
};

export default Hub;
