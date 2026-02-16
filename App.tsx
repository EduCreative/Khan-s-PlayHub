
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
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    // Initial load from storage
    const savedScores = localStorage.getItem('khans-playhub-scores');
    if (savedScores) setScores(JSON.parse(savedScores));
    
    const savedTheme = localStorage.getItem('khans-playhub-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }

    // PWA Navigation Logic: Trap the back button
    // We push an initial state to the history stack
    window.history.pushState({ page: 'hub' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // When the user clicks "Back", the browser pops our state.
      // We check our app context to decide what to do.
      if (activeGame) {
        // Close the game and stay on Hub
        setActiveGame(null);
        // Reset the history state so the next "Back" click works again
        window.history.pushState({ page: 'hub' }, '');
      } else {
        // We are on the hub, show the Exit confirmation
        setShowExitConfirm(true);
        // Push state again to prevent the app from actually navigating away/minimizing
        window.history.pushState({ page: 'hub' }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);

    // PWA Install logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [activeGame]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('khans-playhub-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleSelectGame = (game: Game) => {
    setActiveGame(game);
    // Push a state for the game so 'popstate' can handle the back button correctly
    window.history.pushState({ page: 'game', id: game.id }, '');
  };

  const handleCloseGame = () => {
    setActiveGame(null);
    // Sync history state
    if (window.history.state?.page === 'game') {
      window.history.replaceState({ page: 'hub' }, '');
    }
  };

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
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white transition-colors duration-500">
      <div className="fixed inset-0 bg-grid-pattern opacity-100 pointer-events-none" />
      <ParticleBackground isDarkMode={isDarkMode} />
      
      <main className="relative z-10 w-full min-h-screen">
        {activeGame ? (
          <GameRunner 
            game={activeGame} 
            onClose={handleCloseGame} 
            onSaveScore={(s) => saveScore(activeGame.id, s)}
            highScore={scores[activeGame.id] || 0}
            isDarkMode={isDarkMode}
          />
        ) : (
          <Hub 
            games={GAMES} 
            onSelectGame={handleSelectGame} 
            filter={filter} 
            setFilter={setFilter}
            highScores={scores}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        )}
      </main>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowExitConfirm(false)} />
          <div className="relative glass-card w-full max-w-sm p-8 text-center border-indigo-500/30 scale-up-center shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 shadow-2xl animate-pulse text-white">
              <i className="fas fa-power-off"></i>
            </div>
            <h2 className="text-3xl font-black mb-2 italic tracking-tighter uppercase">Exit Protocol</h2>
            <p className="text-slate-400 mb-8 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
              Terminate your link to the gaming nexus?
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Stay in Nexus
              </button>
              <button 
                onClick={() => {
                   // Browsers don't allow window.close() unless opened by script, 
                   // so we provide a helpful message or minimize-like behavior
                   window.location.href = "about:blank"; 
                }}
                className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 transition-all"
              >
                Terminate Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent App Actions */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-4">
        {showInstallBtn && (
          <button 
            className="bg-emerald-600 hover:bg-emerald-500 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-emerald-500/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20"
            onClick={handleInstallClick}
          >
            <i className="fas fa-download"></i>
          </button>
        )}
      </div>

      <style>{`
        .scale-up-center {
          animation: scale-up-center 0.4s cubic-bezier(0.390, 0.575, 0.565, 1.000) both;
        }
        @keyframes scale-up-center {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
