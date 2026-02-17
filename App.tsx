
import React, { useState, useEffect } from 'react';
import { GAMES } from './constants';
import { Game, Category, UserProfile, AppSettings } from './types';
import Hub from './components/Hub';
import GameRunner from './components/GameRunner';
import ParticleBackground from './components/ParticleBackground';
import TutorialOverlay from './components/TutorialOverlay';
import ProfileModal from './components/ProfileModal';
import { cloud } from './services/cloud';

const DEFAULT_PROFILE: UserProfile = {
  username: 'Operative',
  avatar: 'fa-user-ninja',
  bio: 'Nexus Gaming Cadet',
  favorites: [],
  joinedAt: Date.now()
};

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [filter, setFilter] = useState<Category | 'All' | 'Favorites'>('All');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');

  useEffect(() => {
    // Initial load from storage
    const savedScores = localStorage.getItem('khans-playhub-scores');
    if (savedScores) setScores(JSON.parse(savedScores));
    
    const savedTheme = localStorage.getItem('khans-playhub-theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');

    const savedProfile = localStorage.getItem('khans-playhub-profile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    } else {
      setShowProfileSetup(true);
    }

    const tutorialComplete = localStorage.getItem('khans-playhub-tutorial-complete');
    if (!tutorialComplete) setShowTutorial(true);

    window.history.pushState({ page: 'hub' }, '');
    const handlePopState = () => {
      if (activeGame) {
        setActiveGame(null);
        window.history.pushState({ page: 'hub' }, '');
      } else {
        setShowExitConfirm(true);
        window.history.pushState({ page: 'hub' }, '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGame]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('khans-playhub-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Network listener for sync status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const saveProfile = async (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('khans-playhub-profile', JSON.stringify(updated));
    setSyncStatus('pending');
    const success = await cloud.syncProfile(updated);
    if (success) setSyncStatus('synced');
  };

  const toggleFavorite = (gameId: string) => {
    const newFavorites = userProfile.favorites.includes(gameId)
      ? userProfile.favorites.filter(id => id !== gameId)
      : [...userProfile.favorites, gameId];
    saveProfile({ ...userProfile, favorites: newFavorites });
  };

  const saveScore = async (gameId: string, score: number) => {
    const currentHigh = scores[gameId] || 0;
    if (score > currentHigh) {
      const next = { ...scores, [gameId]: score };
      setScores(next);
      localStorage.setItem('khans-playhub-scores', JSON.stringify(next));
      
      setSyncStatus('pending');
      const success = await cloud.syncScore(gameId, score);
      if (success) setSyncStatus('synced');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <ParticleBackground isDarkMode={isDarkMode} />
      
      <main className="relative z-10 w-full min-h-screen">
        {activeGame ? (
          <GameRunner 
            game={activeGame} 
            onClose={() => setActiveGame(null)} 
            onSaveScore={(s) => saveScore(activeGame.id, s)}
            highScore={scores[activeGame.id] || 0}
            isDarkMode={isDarkMode}
          />
        ) : (
          <Hub 
            games={GAMES} 
            onSelectGame={setActiveGame} 
            filter={filter} 
            setFilter={setFilter}
            highScores={scores}
            userProfile={userProfile}
            isDarkMode={isDarkMode}
            syncStatus={syncStatus}
            onToggleTheme={() => setIsDarkMode(!isDarkMode)}
            onOpenProfile={() => setShowProfileSetup(true)}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      {showProfileSetup && (
        <ProfileModal 
          profile={userProfile} 
          syncStatus={syncStatus}
          onSave={(p) => { saveProfile(p); setShowProfileSetup(false); }}
          onClose={() => setShowProfileSetup(false)}
        />
      )}

      {showTutorial && !activeGame && (
        <TutorialOverlay onComplete={() => {
          setShowTutorial(false);
          localStorage.setItem('khans-playhub-tutorial-complete', 'true');
        }} isDarkMode={isDarkMode} />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowExitConfirm(false)} />
          <div className="relative glass-card w-full max-w-sm p-8 text-center border-indigo-500/30 shadow-2xl scale-up-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 text-white"><i className="fas fa-power-off"></i></div>
            <h2 className="text-3xl font-black mb-2 italic tracking-tighter uppercase">Exit Nexus?</h2>
            <div className="flex flex-col gap-3">
              <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest">Stay</button>
              <button onClick={() => window.location.href = "about:blank"} className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl font-black uppercase text-xs tracking-widest hover:text-rose-400 transition-all">Terminate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
