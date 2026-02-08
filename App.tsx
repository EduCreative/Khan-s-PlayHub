
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

      {/* Persistent App Installation Prompt */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3">
        <button 
          className="bg-indigo-600 hover:bg-indigo-500 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-500/50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white/20"
          onClick={() => alert("Install Khan's PlayHub for a full-screen standalone experience!")}
          title="Install App"
        >
          <i className="fas fa-download text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
