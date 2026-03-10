
import React, { useState, useEffect } from 'react';
import { GAMES } from './constants';
import { Game, Category, UserProfile } from './types';
import Hub from './components/Hub';
import GameRunner from './components/GameRunner';
import ParticleBackground from './components/ParticleBackground';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import AchievementToast from './components/AchievementToast';
import { cloud } from './services/cloud';
import { ACHIEVEMENTS } from './achievements';
import { Achievement } from './types';
import { audioService } from './services/audioService';

const DEFAULT_PROFILE: UserProfile = {
  username: 'New Player',
  email: '',
  avatar: 'fa-user-ninja',
  joinedAt: Date.now(),
  bio: 'Elite Player',
  favorites: [],
  achievements: []
};

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [filter, setFilter] = useState<Category | 'All' | 'Favorites' | 'Leaderboard'>('All');
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
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [appUpdate, setAppUpdate] = useState<{ version: string; changelog: string[] } | null>(null);

  const CURRENT_VERSION = '3.0.0';

  // Check for updates
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const response = await fetch('/version.json');
        if (response.ok) {
          const data = await response.json();
          if (data.version !== CURRENT_VERSION) {
            setAppUpdate(data);
          }
        }
      } catch (e) {
        console.warn('Update check failed', e);
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 1000 * 60 * 5); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Sync audioService volume
  useEffect(() => {
    audioService.setVolume(sfxVolume);
  }, [sfxVolume]);

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
        audioService.playNav();
        window.history.pushState({ page: 'hub' }, '');
      } else if (showAdmin) {
        setShowAdmin(false);
        audioService.playNav();
        window.history.pushState({ page: 'hub' }, '');
      } else if (showSettings) {
        setShowSettings(false);
        audioService.playNav();
        window.history.pushState({ page: 'hub' }, '');
      } else {
        setShowExitConfirm(true);
        audioService.playError();
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
    if (success) {
      audioService.playSuccess();
      if (hapticFeedback) audioService.vibrate([10, 50, 10]);
    }
  }, [hapticFeedback]);

  const toggleFavorite = React.useCallback((gameId: string) => {
    setUserProfile(prev => {
      const isFav = prev.favorites.includes(gameId);
      const newFavorites = isFav
        ? prev.favorites.filter((id: string) => id !== gameId)
        : [...prev.favorites, gameId];
      const updated = { ...prev, favorites: newFavorites };
      saveProfile(updated);
      audioService.playToggle(!isFav);
      if (hapticFeedback) audioService.vibrate(10);
      return updated;
    });
  }, [saveProfile, hapticFeedback]);

  const unlockAchievement = React.useCallback((id: string) => {
    if (userProfile.achievements?.includes(id)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (achievement) {
      setRecentAchievement(achievement);
      audioService.playSuccess();
      if (hapticFeedback) audioService.vibrate([50, 100, 50]);
      const updatedProfile = {
        ...userProfile,
        achievements: [...(userProfile.achievements || []), id]
      };
      saveProfile(updatedProfile);
    }
  }, [userProfile, saveProfile, hapticFeedback]);

  const saveScore = React.useCallback(async (gameId: string, score: number, metadata?: any) => {
    // Achievement Checks
    if (gameId === 'word-builder' && metadata?.level >= 10) unlockAchievement('tower_master');
    if (gameId === 'reaction-test' && metadata?.best > 0 && metadata?.best <= 200) unlockAchievement('speed_demon');
    if (gameId === 'quick-math' && score >= 1000) unlockAchievement('math_wizard');
    if (gameId === 'resonance-breathing' && metadata?.completed) unlockAchievement('zen_master');
    if (gameId === 'labyrinth' && metadata?.difficulty === 'hard' && metadata?.completed) unlockAchievement('labyrinth_conqueror');
    if (gameId === 'sudoku-lite' && metadata?.difficulty === 'Hard' && metadata?.completed) unlockAchievement('sudoku_master');

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
          if (success) audioService.playSuccess();
        })();
        
        return next;
      }
      return prev;
    });
  }, [unlockAchievement]);

  const isAnonymous = userProfile.username === 'New Player' || userProfile.username === 'Operative';

  useEffect(() => {
    if (isAnonymous && !showTutorial) {
      const timer = setTimeout(() => {
        setShowProfileSetup(true);
        audioService.playNav();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnonymous, showTutorial]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <ParticleBackground isDarkMode={isDarkMode} />
      
      <main className="relative z-10 w-full min-h-screen">
        {showAdmin ? (
          <AdminPanel onClose={() => {
            setShowAdmin(false);
            audioService.playNav();
          }} />
        ) : activeGame ? (
          <GameRunner 
            game={activeGame} 
            onClose={() => {
              setActiveGame(null);
              audioService.playNav();
            }} 
            onSaveScore={(s, meta) => saveScore(activeGame.id, s, meta)}
            highScore={scores[activeGame.id] || 0}
            isDarkMode={isDarkMode}
            isAnonymous={isAnonymous}
            onOpenProfile={() => {
              setShowProfileSetup(true);
              audioService.playNav();
            }}
            onViewLeaderboard={() => {
              setActiveGame(null);
              setFilter('Leaderboard');
              audioService.playNav();
            }}
            sfxVolume={sfxVolume}
            hapticFeedback={hapticFeedback}
          />
        ) : (
          <Hub 
            games={GAMES} 
            onSelectGame={(game) => {
              setActiveGame(game);
              audioService.playClick();
            }} 
            filter={filter} 
            setFilter={(f) => {
              setFilter(f);
              audioService.playNav();
            }}
            highScores={scores}
            userProfile={userProfile}
            isDarkMode={isDarkMode}
            syncStatus={syncStatus}
            onToggleTheme={() => {
              setIsDarkMode(!isDarkMode);
              audioService.playToggle(!isDarkMode);
            }}
            onOpenProfile={() => {
              setShowProfileSetup(true);
              audioService.playNav();
            }}
            onToggleFavorite={toggleFavorite}
            onOpenAdmin={() => {
              setShowAdmin(true);
              audioService.playNav();
            }}
            onOpenSettings={() => {
              setShowSettings(true);
              audioService.playNav();
            }}
          />
        )}
      </main>

      {showProfileSetup && (
        <ProfileModal 
          userProfile={userProfile} 
          onSave={(profile) => {
            saveProfile(profile);
            setShowProfileSetup(false);
          }} 
          onClose={() => {
            setShowProfileSetup(false);
            audioService.playNav();
          }} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          sfxVolume={sfxVolume}
          hapticFeedback={hapticFeedback}
          isDarkMode={isDarkMode}
          onUpdateSfx={(vol) => {
            setSfxVolume(vol);
            // Volume change feedback
            audioService.setVolume(vol);
            audioService.playClick();
          }}
          onUpdateHaptic={(h) => {
            setHapticFeedback(h);
            audioService.playToggle(h);
          }}
          onToggleTheme={() => {
            setIsDarkMode(!isDarkMode);
            audioService.playToggle(!isDarkMode);
          }}
          onClose={() => {
            setShowSettings(false);
            audioService.playNav();
          }}
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

      <AchievementToast 
        achievement={recentAchievement} 
        onClose={() => setRecentAchievement(null)} 
      />

      {appUpdate && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-80 z-[150] animate-in slide-in-from-bottom-10 duration-500">
          <div className="glass-card p-6 border-indigo-500/30 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <i className="fas fa-cloud-arrow-down"></i>
              </div>
              <div>
                <h4 className="text-sm font-black uppercase italic dark:text-white">Update Available</h4>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">v{appUpdate.version} is ready</p>
              </div>
            </div>
            <ul className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 space-y-1">
              {appUpdate.changelog.slice(0, 3).map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-indigo-500">•</span>
                  {item}
                </li>
              ))}
            </ul>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
            >
              Update Now
            </button>
            <button 
              onClick={() => setAppUpdate(null)}
              className="w-full py-2 mt-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[9px] font-bold uppercase tracking-widest transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
