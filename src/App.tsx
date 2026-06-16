
import React, { useState, useEffect, useRef } from 'react';
import { GAMES } from './constants';
import { Game, Category, UserProfile } from './types';
import Hub from './components/Hub';
import GameRunner from './components/GameRunner';
import ParticleBackground from './components/ParticleBackground';
import AdminPanel from './components/AdminPanel';
import ProfileModal from './components/ProfileModal';
import SettingsModal from './components/SettingsModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import AchievementToast from './components/AchievementToast';
import { cloud } from './services/cloud';
import { ACHIEVEMENTS } from './achievements';
import { Achievement } from './types';
import { audioService } from './services/audioService';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import ChallengeModal from './components/ChallengeModal';
import ChallengeInvitationScreen from './components/ChallengeInvitationScreen';

const DEFAULT_PROFILE: UserProfile = {
  username: 'New Player',
  email: '',
  avatar: 'fa-user-ninja',
  joinedAt: Date.now(),
  bio: 'Elite Player',
  favorites: [],
  achievements: [],
  playTime: 0
};

const App: React.FC = () => {
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const lastSyncRef = useRef<Record<string, any>>({});
  const gameStartTimeRef = useRef<number | null>(null);
  const activeGameIdRef = useRef<string | null>(null);

  const isLocalStorageAvailable = React.useMemo(() => {
    try {
      localStorage.setItem('ls_test', '1');
      localStorage.removeItem('ls_test');
      return true;
    } catch (e) {
      console.warn("LocalStorage not available", e);
      return false;
    }
  }, []);

  const [renderError, setRenderError] = useState<string | null>(null);

  // Catch render errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Global Error Caught:", event.error);
      // We don't necessarily want to show a crash screen for every error, 
      // but if it's a blank screen, this might help.
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const [activeGame, setActiveGame] = useState<Game | null>(null);
  
  // Challenge Features State
  const [challengeGame, setChallengeGame] = useState<Game | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeInvitation, setChallengeInvitation] = useState<any | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<any | null>(null);
  const [filter, setFilter] = useState<Category | 'All' | 'Favorites' | 'Leaderboard' | 'Visual Leaderboard' | 'Global Leaderboard'>('All');
  
  const [scores, setScores] = useState<Record<string, number>>(() => {
    try {
      const savedScores = localStorage.getItem('khans-playhub-scores');
      return savedScores ? JSON.parse(savedScores) : {};
    } catch {
      return {};
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem('khans-playhub-profile');
      if (savedProfile) {
        return JSON.parse(savedProfile);
      }
    } catch {}
    return DEFAULT_PROFILE;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('khans-playhub-theme');
      if (savedTheme) return savedTheme === 'dark';
    } catch {}
    return true;
  });

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const [showTutorial, setShowTutorial] = useState(() => {
    try {
      return !localStorage.getItem('khans-playhub-tutorial-complete');
    } catch {
      return true;
    }
  });

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [sfxVolume, setSfxVolume] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('khans-playhub-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.sfxVolume ?? 0.5;
      }
    } catch {}
    return 0.5;
  });

  const [hapticFeedback, setHapticFeedback] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('khans-playhub-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.hapticFeedback ?? true;
      }
    } catch {}
    return true;
  });

  const [dataProvider, setDataProvider] = useState<'firebase' | 'cloudflare' | 'hybrid'>(() => {
    try {
      const savedSettings = localStorage.getItem('khans-playhub-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.dataProvider ?? 'firebase';
      }
    } catch {}
    return 'firebase';
  });

  const [workerUrl, setWorkerUrl] = useState(() => {
    try {
      const savedSettings = localStorage.getItem('khans-playhub-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        return parsed.workerUrl || 'https://khans-playhub-worker.kmasroor50.workers.dev';
      }
    } catch {}
    return 'https://khans-playhub-worker.kmasroor50.workers.dev';
  });

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(() => {
    try {
      const saved = localStorage.getItem('khans-playhub-has-unsynced');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('khans-playhub-has-unsynced', hasUnsyncedChanges ? 'true' : 'false');
    } catch {}
  }, [hasUnsyncedChanges]);

  const [globalRecords, setGlobalRecords] = useState<Record<string, number>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [appUpdate, setAppUpdate] = useState<{ version: string; changelog: string[] } | null>(null);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'downloading' | 'ready'>('idle');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  const isAdminUser = (user?.email?.toLowerCase() === 'kmasroor50@gmail.com'.toLowerCase()) || 
                     (user?.uid === 'v2swNDzVnegsJNo5eNEiLYv6ZYi2') ||
                     (userProfile.role === 'admin');

  const CURRENT_VERSION = '3.5.2';

  // Listen for Firestore Quota Exceeded event
  useEffect(() => {
    if (localStorage.getItem('firestore_quota_exceeded_today') === 'true') {
      setQuotaExceeded(true);
    }

    const handleQuota = () => {
      setQuotaExceeded(true);
    };

    window.addEventListener('firestore-quota-exceeded', handleQuota);
    return () => {
      window.removeEventListener('firestore-quota-exceeded', handleQuota);
    };
  }, []);

  // PWA Install Prompt
  useEffect(() => {
    // Detect iframe
    setIsInIframe(window.self !== window.top);
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
    setDeferredPrompt(null);
  };

  // Fetch Global Records
  useEffect(() => {
    const fetchGlobalRecords = async () => {
      const records: Record<string, number> = {};
      // Fetch in parallel to be faster
      await Promise.all(GAMES.map(async (game) => {
        try {
          const scores = await cloud.getGlobalHighScores(game.id);
          if (scores && scores.length > 0) {
            records[game.id] = scores[0].score;
          }
        } catch (e) {
          console.warn(`Failed to fetch record for ${game.id}`, e);
        }
      }));
      setGlobalRecords(records);
    };
    fetchGlobalRecords();
  }, []);

  // Check for updates
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        setUpdateStatus('checking');
        const response = await fetch(`/version.json?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          if (data.version !== CURRENT_VERSION) {
            setAppUpdate(data);
            setUpdateStatus('downloading');
            
            // Simulate download progress since SW doesn't give real percentage
            let progress = 0;
            const interval = setInterval(() => {
              progress += Math.random() * 15;
              if (progress >= 95) {
                clearInterval(interval);
                setUpdateProgress(95);
              } else {
                setUpdateProgress(Math.floor(progress));
              }
            }, 800);

            // Trigger Service Worker Update
            if ('serviceWorker' in navigator) {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration) {
                registration.update();
                
                registration.onupdatefound = () => {
                  const newWorker = registration.installing;
                  if (newWorker) {
                    newWorker.onstatechange = () => {
                      if (newWorker.state === 'installed') {
                        clearInterval(interval);
                        setUpdateProgress(100);
                        setUpdateStatus('ready');
                      }
                    };
                  }
                };
              } else {
                // If no SW but version mismatch, fallback to ready
                clearInterval(interval);
                setUpdateProgress(100);
                setUpdateStatus('ready');
              }
            }
          } else {
            setUpdateStatus('idle');
          }
        }
      } catch (e) {
        console.warn('Update check failed', e);
        setUpdateStatus('idle');
      }
    };

    checkUpdates();
    const interval = setInterval(checkUpdates, 1000 * 60 * 15); // Every 15 minutes
    return () => clearInterval(interval);
  }, []);

  // Sync audioService volume
  useEffect(() => {
    audioService.setVolume(sfxVolume);
  }, [sfxVolume]);



  // Parse Challenge URL Parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeId = params.get('challengeId');
    const gameId = params.get('gameId');
    if (challengeId && gameId) {
      const targetScore = parseInt(params.get('targetScore') || '0', 10);
      const creatorUsername = params.get('by') || 'Anonymous Player';
      const creatorAvatar = params.get('avatar') || 'fa-user-astronaut';
      
      const parsedChallenge = {
        id: challengeId,
        gameId,
        targetScore,
        creatorUsername,
        creatorAvatar,
        loadedFromUrl: true
      };
      
      setChallengeInvitation(parsedChallenge);
      
      // Attempt to load from Cloud to enrich stats (playsCount, bestChallenger)
      cloud.getChallenge(challengeId).then(dbData => {
        if (dbData) {
          setChallengeInvitation({
            ...parsedChallenge,
            ...dbData,
            loadedFromUrl: false
          });
        }
      }).catch(err => {
        console.warn('Could not load challenge from Firestore:', err);
      });
    }
  }, []);

  const handleAcceptChallenge = (challengerName: string) => {
    if (!challengeInvitation) return;
    const targetGame = GAMES.find(g => g.id === challengeInvitation.gameId);
    if (!targetGame) return;

    // Use name
    const updatedProfile = {
      ...userProfile,
      username: challengerName
    };
    setUserProfile(updatedProfile);
    localStorage.setItem('khans-playhub-username', challengerName);

    setActiveChallenge({
      ...challengeInvitation,
      challengerName
    });
    setChallengeInvitation(null);
    setActiveGame(targetGame);
  };

  const handleDeclineChallenge = () => {
    setChallengeInvitation(null);
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const handleOpenChallengeDialog = (game: Game) => {
    setChallengeGame(game);
    setShowChallengeModal(true);
    audioService.playNav();
  };

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
      } else if (showPrivacy) {
        setShowPrivacy(false);
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
    localStorage.setItem('khans-playhub-settings', JSON.stringify({ 
      sfxVolume, 
      hapticFeedback,
      dataProvider,
      workerUrl
    }));
    cloud.configure(dataProvider, workerUrl);
  }, [sfxVolume, hapticFeedback, dataProvider, workerUrl]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('khans-playhub-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const syncAllScores = React.useCallback(async () => {
    if (!navigator.onLine || isSyncing || !auth.currentUser) return;
    
    setIsSyncing(true);
    setSyncStatus('pending');
    
    try {
      // Sync user profile to the cloud
      const profileSuccess = await cloud.syncProfile(userProfile);
      
      const gameIds = Object.keys(scores);
      let allSuccess = profileSuccess;
      
      for (const gameId of gameIds) {
        const success = await cloud.syncScore(gameId, scores[gameId], userProfile);
        if (!success) {
          allSuccess = false;
        } else {
          // Update global record if we beat it
          setGlobalRecords(prev => ({
            ...prev,
            [gameId]: Math.max(prev[gameId] || 0, scores[gameId])
          }));
        }
      }
      
      setSyncStatus(allSuccess ? 'synced' : 'offline');
      setHasUnsyncedChanges(!allSuccess);
      if (allSuccess) {
        audioService.playSuccess();
        setQuotaExceeded(false);
      }
    } catch (e: any) {
      console.error('Sync All Failed:', e);
      if (e.message?.includes('resource-exhausted') || e.message?.includes('Quota exceeded')) {
        setQuotaExceeded(true);
      }
      setSyncStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  }, [scores, isSyncing, userProfile]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      
      if (firebaseUser) {
        // Fetch profile from Firestore
        try {
          const cloudProfile = await cloud.getProfile();
          if (cloudProfile) {
            // Ensure arrays exist to prevent crashes in Hub
            const sanitizedProfile = {
              ...DEFAULT_PROFILE,
              ...cloudProfile,
              favorites: Array.isArray(cloudProfile.favorites) ? cloudProfile.favorites : [],
              achievements: Array.isArray(cloudProfile.achievements) ? cloudProfile.achievements : []
            };

            let updated = false;
            // Autofill display name if not set or if it is the default placeholder name
            if ((!sanitizedProfile.username || sanitizedProfile.username === 'New Player' || sanitizedProfile.username.trim() === '') && firebaseUser.displayName) {
              sanitizedProfile.username = firebaseUser.displayName;
              updated = true;
            }
            // Autofill email matches if empty or unregistered
            if ((!sanitizedProfile.email || sanitizedProfile.email.trim() === '') && firebaseUser.email) {
              sanitizedProfile.email = firebaseUser.email;
              updated = true;
            }

            setUserProfile(sanitizedProfile);
            localStorage.setItem('khans-playhub-profile', JSON.stringify(sanitizedProfile));

            if (updated) {
              // Automatically sync the autofilled fields back to the cloud database
              await cloud.syncProfile(sanitizedProfile);
            }
          } else {
            // Create initial profile in Firestore if it doesn't exist, utilizing Google payload details
            const initialProfile = {
              ...userProfile,
              username: firebaseUser.displayName || userProfile.username || 'New Player',
              email: firebaseUser.email || userProfile.email || ''
            };
            setUserProfile(initialProfile);
            localStorage.setItem('khans-playhub-profile', JSON.stringify(initialProfile));
            await cloud.syncProfile(initialProfile);
          }
          // Do not automatically write-sync scores to save Firestore write quota
          setSyncStatus('synced');
          setHasUnsyncedChanges(false);
        } catch (err) {
          console.error("Auth callback error:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    if (isLoggingIn || !isAuthReady) return;
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Add custom parameters to force account selection if needed
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await signInWithPopup(auth, provider);
      audioService.playSuccess();
    } catch (e: any) {
      console.error('Login Failed:', e);
      audioService.playError();
      
      if (e.code === 'auth/unauthorized-domain') {
        alert(`Authentication Error: This domain (${window.location.hostname}) is not authorized in your Firebase Console. \n\nPlease add it to: \nFirebase Console > Authentication > Settings > Authorized domains`);
      } else if (e.code === 'auth/popup-blocked') {
        alert('Login Popup Blocked: Please allow popups for this site, or click the link icon next to settings to open the app in a new tab.');
      } else if (e.code === 'auth/cancelled-popup-request') {
        console.warn('Authentication popup cancelled: Concurrent requests prevented.');
      } else if (e.code === 'auth/popup-closed-by-user') {
        console.info('Authentication popup was closed by user.');
      } else if (e.message?.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('Firebase internal promise resolution failure inside sandboxed frame. Please open the app in a new tab to bypass iframe sandbox restrictions.');
      } else {
        alert(`Login Failed: ${e.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(DEFAULT_PROFILE);
      setScores({});
      audioService.playNav();
    } catch (e) {
      console.error('Logout Failed:', e);
    }
  };

  useEffect(() => {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      setSyncStatus(isOnline ? 'synced' : 'offline');
      if (isOnline) {
        syncAllScores();
      }
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
  }, [syncAllScores]);

  const saveProfile = React.useCallback(async (updated: UserProfile) => {
    setUserProfile(updated);
    localStorage.setItem('khans-playhub-profile', JSON.stringify(updated));
    setHasUnsyncedChanges(true);
    setSyncStatus('offline');
  }, []);

  // Gameplay Time Tracking
  useEffect(() => {
    if (activeGame) {
      gameStartTimeRef.current = Date.now();
      activeGameIdRef.current = activeGame.id;
    } else if (gameStartTimeRef.current && activeGameIdRef.current) {
      const endTime = Date.now();
      const durationSeconds = Math.floor((endTime - gameStartTimeRef.current) / 1000);
      gameStartTimeRef.current = null;
      const gameId = activeGameIdRef.current;
      activeGameIdRef.current = null;

      if (durationSeconds > 1) {
        setUserProfile(prev => {
          const stats = prev.gameStats || {};
          const gameStat = stats[gameId] || { timeSpent: 0, sessions: 0, lastPlayed: 0, highScore: 0 };
          
          const updated = {
            ...prev,
            playTime: (prev.playTime || 0) + durationSeconds,
            gameStats: {
              ...stats,
              [gameId]: {
                ...gameStat,
                timeSpent: gameStat.timeSpent + durationSeconds,
                sessions: gameStat.sessions + 1,
                lastPlayed: endTime,
                highScore: Math.max(gameStat.highScore, scores[gameId] || 0)
              }
            }
          };
          saveProfile(updated);
          return updated;
        });
      }
    }
  }, [activeGame, saveProfile, scores]);

  const toggleFavorite = React.useCallback((gameId: string) => {
    setUserProfile(prev => {
      const favorites = prev.favorites || [];
      const isFav = favorites.includes(gameId);
      const newFavorites = isFav
        ? favorites.filter((id: string) => id !== gameId)
        : [...favorites, gameId];
      const updated = { ...prev, favorites: newFavorites };
      saveProfile(updated);
      audioService.playToggle(!isFav);
      if (hapticFeedback) audioService.vibrate(10);
      return updated;
    });
  }, [saveProfile, hapticFeedback]);

  const updateGlobalRecord = React.useCallback((gameId: string, score: number) => {
    setGlobalRecords(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, score)
    }));
  }, []);

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

      // Dispatch physical custom event for the local chat companion bots grid (free of auth restrictions)
      window.dispatchEvent(new CustomEvent('lobby-broadcast', {
        detail: {
          sender: '🏆 ACHIEVEMENT UNLOCKED',
          message: `${userProfile.username || 'Player'} unlocked the milestone: [${achievement.name}]!`,
          type: 'custom'
        }
      }));
    }
  }, [userProfile, saveProfile, hapticFeedback]);

  const saveScore = React.useCallback(async (gameId: string, score: number, metadata?: any) => {
    lastSyncRef.current['lastGameId'] = gameId;
    // Achievement Checks
    if (gameId === 'word-builder' && metadata?.level >= 10) unlockAchievement('tower_master');
    if (gameId === 'reaction-test' && metadata?.best > 0 && metadata?.best <= 200) unlockAchievement('speed_demon');
    if (gameId === 'quick-math' && score >= 1000) unlockAchievement('math_wizard');
    if (gameId === 'resonance-breathing' && metadata?.completed) unlockAchievement('zen_master');
    if (gameId === 'labyrinth' && metadata?.difficulty === 'hard' && metadata?.completed) unlockAchievement('labyrinth_conqueror');
    if (gameId === 'sudoku-lite' && metadata?.difficulty === 'Hard' && metadata?.completed) unlockAchievement('sudoku_master');

    const currentHigh = scores[gameId] || 0;
    
    // Update local state if it's a new high score
    if (score > currentHigh) {
      const nextScores = { ...scores, [gameId]: score };
      setScores(nextScores);
      localStorage.setItem('khans-playhub-scores', JSON.stringify(nextScores));

      const gameDisplayName = gameId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Dispatch physical custom event for new record! (fuels client-side companion chat interactions free)
      window.dispatchEvent(new CustomEvent('lobby-broadcast', {
        detail: {
          sender: '👑 NEW HIGH RECORD',
          message: `🔥 ${userProfile.username || 'Player'} reached a new high score of ${score.toLocaleString()} in ${gameDisplayName}!`,
          type: 'custom'
        }
      }));

      // Synchronize gameStats and profile immediately on scoring to avoid any visual lag/discrepancies
      setUserProfile(prev => {
        const stats = prev.gameStats || {};
        const gameStat = stats[gameId] || { timeSpent: 0, sessions: 0, lastPlayed: 0, highScore: 0 };
        const updated = {
          ...prev,
          gameStats: {
            ...stats,
            [gameId]: {
              ...gameStat,
              lastPlayed: Date.now(),
              highScore: score
            }
          }
        };
        saveProfile(updated);
        return updated;
      });
    }

    // Local-only score marking - flags changes as unsynced so players can manually push with the visual Sync button
    if (score >= currentHigh) {
      setHasUnsyncedChanges(true);
      setSyncStatus('offline');
    }

    // Challenge Play log update
    if (activeChallenge && activeChallenge.gameId === gameId && metadata?.final) {
      try {
        await cloud.updateChallengePlay(
          activeChallenge.id,
          score,
          activeChallenge.challengerName || 'Anonymous Challenger'
        );
      } catch (err) {
        console.error('Failed to log challenge updates in Firestore:', err);
      }
    }
  }, [scores, unlockAchievement, userProfile, quotaExceeded, activeChallenge]);

  const isAnonymous = userProfile.username === 'New Player' || userProfile.username === 'Player';

  useEffect(() => {
    if (isAnonymous && !showTutorial) {
      const timer = setTimeout(() => {
        setShowProfileSetup(true);
        audioService.playNav();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnonymous, showTutorial]);

  if (challengeInvitation) {
    const targetGame = GAMES.find(g => g.id === challengeInvitation.gameId);
    return (
      <ChallengeInvitationScreen
        challenge={challengeInvitation}
        game={targetGame}
        defaultUsername={userProfile.username || 'Challenger_HQ'}
        isDarkMode={isDarkMode}
        onAccept={handleAcceptChallenge}
        onDecline={handleDeclineChallenge}
      />
    );
  }

  if (userProfile && userProfile.isBanned) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-900 text-white selection:bg-rose-500 selection:text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="fixed inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
        <div className="relative z-10 glass-card max-w-lg p-10 rounded-[2.5rem] border border-rose-500/20 bg-rose-950/20 backdrop-blur-md flex flex-col items-center">
          <div className="w-20 h-20 rounded-[2rem] bg-rose-500 flex items-center justify-center text-white text-3xl mb-8 animate-pulse shadow-2xl shadow-rose-500/50">
            <i className="fas fa-user-slash" />
          </div>
          <h1 className="text-3xl font-black text-rose-500 italic uppercase tracking-tighter mb-2">Account Terminated</h1>
          <p className="text-xs font-black text-rose-400 uppercase tracking-[0.2em] mb-6">State Violation Enforced</p>
          <div className="w-full h-px bg-rose-500/15 mb-6" />
          <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium">
            This account associated with <span className="font-mono text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded">{userProfile.email || userProfile.username}</span> has been permanently suspended by Khan's PlayHub administrators due to activity violations. 
          </p>
          <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4 w-full mb-8">
            <p className="text-[10px] font-black uppercase text-rose-400 tracking-wider mb-1">Violation Status Code</p>
            <p className="text-xs font-mono text-rose-300">403_FORBIDDEN_PROFILE_BLACKLIST</p>
          </div>
          {auth.currentUser && (
            <button 
              onClick={async () => {
                await signOut(auth);
                setUserProfile(DEFAULT_PROFILE);
                setUser(null);
                window.location.reload();
              }}
              className="py-3 px-8 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold uppercase text-xs tracking-wider transition-all border border-slate-700 hover:border-slate-600 active:scale-95"
            >
              Sign Out Session
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      {/* <ParticleBackground isDarkMode={isDarkMode} /> */}
      
      <main className="relative z-10 w-full min-h-screen">
        {/* Quota Warning */}
        {quotaExceeded && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md animate-in slide-in-from-bottom-10">
            <div className="bg-slate-950/95 backdrop-blur-md text-white p-5 rounded-3xl shadow-[0_20px_50px_rgba(244,63,94,0.3)] border-2 border-rose-500 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <i className="fas fa-shield-alt text-lg"></i>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase italic tracking-wider text-rose-400">Firestore Quota Exceeded</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Daily limit reached</p>
                </div>
                <button 
                  onClick={() => {
                    setQuotaExceeded(false);
                    localStorage.removeItem('firestore_quota_exceeded_today');
                  }} 
                  className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                  The application's free database has hit its daily operations limit. Don't worry! Khan's PlayHub is seamlessly operating in <strong className="text-rose-400">Offline Local Fallback Mode</strong>. Your highscores and profile modifications are secured in your local browser storage and will sync automatically once the quota breaks reset tomorrow.
                </p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Developer Actions:</p>
                  <div className="flex flex-col gap-1 text-[9px] font-bold">
                    <a 
                      href="https://console.firebase.google.com/project/gen-lang-client-0357339368/firestore/databases/ai-studio-684201d8-55ba-4823-86b1-bbbd13881e82/data?openUpgradeDialog=true"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-rose-400 hover:text-rose-300 underline flex items-center gap-1 transition-all"
                    >
                      <i className="fas fa-external-link-alt"></i> Clean up or Upgrade Firestore Database
                    </a>
                    <a 
                      href="https://firebase.google.com/pricing#cloud-firestore"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 underline flex items-center gap-1 transition-all"
                    >
                      <i className="fas fa-external-link-alt"></i> View Spark Plan & Free Daily Limits Info
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showAdmin && isAuthReady && isAdminUser ? (
          <AdminPanel 
            onClose={() => {
              setShowAdmin(false);
              audioService.playNav();
            }} 
            dataProvider={dataProvider}
            onUpdateDataProvider={setDataProvider}
          />
        ) : activeGame ? (
          <GameRunner 
            game={activeGame} 
            onClose={() => {
              setActiveGame(null);
              setActiveChallenge(null);
              window.history.replaceState({}, document.title, window.location.pathname);
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
              setActiveChallenge(null);
              window.history.replaceState({}, document.title, window.location.pathname);
              setFilter('Leaderboard');
              audioService.playNav();
            }}
            sfxVolume={sfxVolume}
            hapticFeedback={hapticFeedback}
            globalRecord={globalRecords[activeGame.id]}
            activeChallenge={activeChallenge}
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
            globalRecords={globalRecords}
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
            onUpdateGlobalRecord={updateGlobalRecord}
            onOpenAdmin={() => {
              setShowAdmin(true);
              audioService.playNav();
            }}
            isAdmin={isAdminUser}
            onSyncAll={syncAllScores}
            onOpenSettings={() => {
              setShowSettings(true);
              audioService.playNav();
            }}
            onOpenPrivacy={() => {
              setShowPrivacy(true);
              audioService.playNav();
            }}
            canInstall={canInstall}
            isInstalled={isInstalled}
            onInstall={handleInstall}
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isAuthReady={isAuthReady}
            isLoggingIn={isLoggingIn}
            updateStatus={updateStatus}
            updateProgress={updateProgress}
            appUpdate={appUpdate}
            onChallenge={handleOpenChallengeDialog}
            hasUnsyncedChanges={hasUnsyncedChanges}
          />
        )}
      </main>

      {showChallengeModal && challengeGame && (
        <ChallengeModal
          game={challengeGame}
          highScore={scores[challengeGame.id] || 0}
          userProfile={userProfile}
          isOpen={showChallengeModal}
          onClose={() => {
            setShowChallengeModal(false);
            setChallengeGame(null);
          }}
        />
      )}

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
          dataProvider={dataProvider}
          workerUrl={workerUrl}
          isAdmin={isAdminUser}
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
          onUpdateDataProvider={(p) => {
            setDataProvider(p);
            audioService.playToggle(true);
          }}
          onUpdateWorkerUrl={(url) => {
            setWorkerUrl(url);
          }}
          onToggleTheme={() => {
            setIsDarkMode(!isDarkMode);
            audioService.playToggle(!isDarkMode);
          }}
          onClose={() => {
            setShowSettings(false);
            audioService.playNav();
          }}
          canInstall={canInstall}
          isInstalled={isInstalled}
          onInstall={handleInstall}
          isInIframe={isInIframe}
        />
      )}

      {showPrivacy && (
        <PrivacyPolicy 
          onClose={() => {
            setShowPrivacy(false);
            audioService.playNav();
          }} 
        />
      )}

      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowExitConfirm(false)} />
          <div className="relative glass-card w-full max-sm p-8 text-center border-indigo-500/30 shadow-2xl scale-up-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 text-white"><i className="fas fa-power-off"></i></div>
            <h2 className="text-3xl font-black mb-2 italic tracking-tighter uppercase text-white">Exit PlayHub?</h2>
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
              onClick={() => {
                const reload = () => window.location.reload();
                if ('caches' in window) {
                  caches.keys().then(names => {
                    Promise.all(names.map(name => caches.delete(name))).then(reload).catch(reload);
                  }).catch(reload);
                } else {
                  reload();
                }
              }}
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
