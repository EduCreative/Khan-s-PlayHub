
import React, { useState, useEffect } from 'react';
import { GAMES } from './constants';
import { Game, Category } from './types';
import Hub from './components/Hub';
import GameRunner from './components/GameRunner';
import ParticleBackground from './components/ParticleBackground';

const App: React.FC = () => {
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Initial load from storage
    const savedScores = localStorage.getItem('khans-playhub-scores');
    if (savedScores) setScores(JSON.parse(savedScores));
    
    const savedTheme = localStorage.getItem('khans-playhub-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      setIsDarkMode(!prefersLight);
    }

    // PWA Install logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check for service worker readiness with an extra layer of safety
    if ('serviceWorker' in navigator) {
      // Use a racing timeout to ensure we don't wait forever for 'ready'
      // if registration failed silently or was blocked by the environment.
      const readyCheck = Promise.race([
        navigator.serviceWorker.ready,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);

      readyCheck
        .then(() => {
          setIsOfflineReady(true);
          setTimeout(() => setIsOfflineReady(false), 5000);
        })
        .catch(() => {
          // SW registration failed or timed out, which is expected in some preview environments
          console.debug('Service Worker not ready or timed out - continuing in standard mode');
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('khans-playhub-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('khans-playhub-theme', 'light');
    }
  }, [isDarkMode]);

  const saveScore = (gameId: string, score: number) => {
    setScores(prev => {
      const currentHigh = prev[gameId] || 0;
      if (score > currentHigh) {
        const next = { ...prev, [gameId]: score };
        localStorage.setItem('khans-playhub-scores', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const handleShareClick = async () => {
    const shareData = {
      title: "Khan's PlayHub",
      text: "Check out these addictive mini-games on Khan's PlayHub!",
      url: window.location.origin,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
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
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        )}
      </main>

      {/* Offline Ready Toast */}
      {isOfflineReady && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="glass-card px-6 py-3 rounded-2xl border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3 shadow-2xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Offline Access Ready</span>
          </div>
        </div>
      )}

      {/* Persistent App Actions Bar */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-4">
        {showInstallBtn && (
          <button 
            className="bg-emerald-600 hover:bg-emerald-500 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-emerald-500/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20 group relative"
            onClick={handleInstallClick}
          >
            <i className="fas fa-download text-lg"></i>
            <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
              Install App
            </span>
          </button>
        )}
        
        <button 
          className="bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20 group relative"
          onClick={handleShareClick}
        >
          <i className="fas fa-share-nodes text-lg"></i>
          <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap border border-white/10">
            Share Hub
          </span>
        </button>
      </div>
    </div>
  );
};

export default App;
