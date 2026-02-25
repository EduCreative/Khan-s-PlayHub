
import React, { useState, useEffect } from 'react';
import { GAMES } from './constants';
import { Game, Category, UserProfile } from './types';
import Hub from './components/Hub';
import GameRunner from './components/GameRunner';
import ParticleBackground from './components/ParticleBackground';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import { cloud } from './services/cloud';

const DEFAULT_PROFILE: UserProfile = {
  username: 'Operative',
  email: '',
  avatar: 'fa-user-ninja',
  joinedAt: Date.now(),
  bio: 'Nexus Operative',
  favorites: []
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
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');

  // Initialize state from localStorage - ONLY ONCE
  useEffect(() => {
    try {
      const savedScores = localStorage.getItem('khans-playhub-scores');
      if (savedScores) setScores(JSON.parse(savedScores));
    } catch (e) { console.error('Failed to parse scores', e); }
    
    const savedTheme = localStorage.getItem('khans-playhub-theme');
    if (savedTheme) setIsDarkMode(savedTheme === 'dark');

    try {
      const savedProfile = localStorage.getItem('khans-playhub-profile');
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (e) { console.error('Failed to parse profile', e); }

    try {
      const savedSettings = localStorage.getItem('khans-playhub-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSfxVolume(parsed.sfxVolume ?? 0.5);
        setHapticFeedback(parsed.hapticFeedback ?? true);
      }
    } catch (e) { console.error('Failed to parse settings', e); }
  }, []);

  // Handle popstate and history - depends on active states
  useEffect(() => {
    window.history.pushState({ page: 'hub' }, '');
    const handlePopState = () => {
      if (activeGame) {
        setActiveGame(null);
        window.history.pushState({ page: 'hub' }, '');
      } else if (showAdmin) {
        setShowAdmin(false);
        window.history.pushState({ page: 'hub' }, '');
      } else if (showSettings) {
        setShowSettings(false);
        window.history.pushState({ page: 'hub' }, '');
      } else {
        setShowExitConfirm(true);
        window.history.pushState({ page: 'hub' }, '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeGame, showAdmin, showSettings]);

  useEffect(() => {
    localStorage.setItem('khans-playhub-settings', JSON.stringify({ sfxVolume, hapticFeedback }));
  }, [sfxVolume, hapticFeedback]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('khans-playhub-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    
    const tutorialComplete = localStorage.getItem('khans-playhub-tutorial-complete');
    if (!tutorialComplete) setShowTutorial(true);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const saveProfile = React.useCallback(async (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('khans-playhub-profile', JSON.stringify(updated));
    setSyncStatus('pending');
    const success = await cloud.syncProfile(updated);
    setSyncStatus(success ? 'synced' : 'offline');
  }, []);

  const toggleFavorite = React.useCallback((gameId: string) => {
    setUserProfile(prev => {
      const newFavorites = prev.favorites.includes(gameId)
        ? prev.favorites.filter((id: string) => id !== gameId)
        : [...prev.favorites, gameId];
      const updated = { ...prev, favorites: newFavorites };
      saveProfile(updated);
      return updated;
    });
  }, [saveProfile]);

  const saveScore = React.useCallback(async (gameId: string, score: number) => {
    setScores(prev => {
      const currentHigh = prev[gameId] || 0;
      if (score > currentHigh) {
        const next = { ...prev, [gameId]: score };
        localStorage.setItem('khans-playhub-scores', JSON.stringify(next));
        
        // Trigger sync in background
        (async () => {
          setSyncStatus('pending');
          const success = await cloud.syncScore(gameId, score);
          setSyncStatus(success ? 'synced' : 'offline');
        })();
        
        return next;
      }
      return prev;
    });
  }, []);

  const isAnonymous = userProfile.username === 'Operative';

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <ParticleBackground isDarkMode={isDarkMode} />
      
      <main className="relative z-10 w-full min-h-screen">
        {showAdmin ? (
          <AdminPanel onClose={() => setShowAdmin(false)} />
        ) : activeGame ? (
          <GameRunner 
            game={activeGame} 
            onClose={() => setActiveGame(null)} 
            onSaveScore={(s) => saveScore(activeGame.id, s)}
            highScore={scores[activeGame.id] || 0}
            isDarkMode={isDarkMode}
            isAnonymous={isAnonymous}
            onOpenProfile={() => setShowProfileSetup(true)}
            sfxVolume={sfxVolume}
            hapticFeedback={hapticFeedback}
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
            onOpenAdmin={() => setShowAdmin(true)}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
      </main>

      {showProfileSetup && (
        <ProfileModal 
          userProfile={userProfile} 
          onSave={saveProfile} 
          onClose={() => setShowProfileSetup(false)} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          sfxVolume={sfxVolume}
          hapticFeedback={hapticFeedback}
          isDarkMode={isDarkMode}
          onUpdateSfx={setSfxVolume}
          onUpdateHaptic={setHapticFeedback}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowExitConfirm(false)} />
          <div className="relative glass-card w-full max-sm p-8 text-center border-indigo-500/30 shadow-2xl scale-up-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 text-white"><i className="fas fa-power-off"></i></div>
            <h2 className="text-3xl font-black mb-2 italic tracking-tighter uppercase text-white">Exit Nexus?</h2>
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
