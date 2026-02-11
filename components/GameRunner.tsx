
import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import FruitVortex from '../games/FruitVortex';
import NumberNinja from '../games/NumberNinja';
import SumSurge from '../games/SumSurge';
import RiddleRift from '../games/RiddleRift';
import BlitzRunner from '../games/BlitzRunner';
import BubbleFury from '../games/BubbleFury';
import MemoryMatrix from '../games/MemoryMatrix';
import Labyrinth from '../games/Labyrinth';
import ColorClash from '../games/ColorClash';
import WordBuilder from '../games/WordBuilder';
import Logo from './Logo';

interface GameRunnerProps {
  game: Game;
  onClose: () => void;
  onSaveScore: (score: number) => void;
  highScore: number;
  isDarkMode: boolean;
}

const GameRunner: React.FC<GameRunnerProps> = ({ game, onClose, onSaveScore, highScore, isDarkMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'exitToHub') {
        onClose();
      }
      if (typeof event.data === 'object' && event.data.type === 'gameScore') {
        onSaveScore(event.data.score);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, onSaveScore]);

  const handleGameOver = (finalScore: number) => {
    setCurrentScore(finalScore);
    onSaveScore(finalScore);
    setIsPlaying(false);
  };

  const renderGame = () => {
    switch (game.id) {
      case 'fruit-vortex': return <FruitVortex onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'number-ninja': return <NumberNinja onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'sum-surge': return <SumSurge onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'riddle-rift': return <RiddleRift onGameOver={handleGameOver} />;
      case 'blitz-runner': return <BlitzRunner onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'bubble-fury': return <BubbleFury onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'memory-matrix': return <MemoryMatrix onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'labyrinth': return <Labyrinth onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'color-clash': return <ColorClash onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'word-builder': return <WordBuilder onGameOver={handleGameOver} isPlaying={isPlaying} isDarkMode={isDarkMode} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <i className={`fas ${game.icon} text-8xl mb-6 opacity-20 dark:text-white text-slate-900`}></i>
            <h2 className="text-3xl font-bold mb-4 dark:text-white text-slate-900">{game.name} is coming soon!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">This portal is still being calibrated by our engineers.</p>
            <button onClick={onClose} className="px-8 py-3 bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all border border-white/10 dark:text-white text-slate-900">Back to Hub</button>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'} flex flex-col transition-colors duration-500`}>
      {/* Game Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all dark:text-white text-slate-900 shadow-lg">
            <i className="fas fa-arrow-left"></i>
          </button>
          
          <div className="flex items-center gap-3 bg-white/5 dark:bg-black/20 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md">
            <Logo size={24} showGlow={false} />
            <div className="flex flex-col drop-shadow-md">
              <h2 className="text-sm font-black italic dark:text-white text-slate-900 uppercase tracking-tighter transition-colors leading-none">{game.name}</h2>
              <span className="text-[8px] font-bold uppercase text-indigo-500 tracking-[0.2em]">Best: {highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: game.name, url: window.location.origin });
              } else {
                navigator.clipboard.writeText(window.location.origin);
                alert("Link copied!");
              }
            }} 
            className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all dark:text-white text-slate-900 shadow-lg"
          >
            <i className="fas fa-share-alt"></i>
          </button>
        </div>
      </div>

      {/* Game Viewport */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-grid-white/[0.02] overflow-y-auto pt-24 pb-12">
        {!isPlaying && game.id !== 'riddle-rift' ? (
          <div className="text-center p-8 glass-card rounded-[3rem] max-w-xl w-full border-indigo-500/30 shadow-2xl transition-all animate-in fade-in zoom-in duration-500 border-2 my-auto">
            <div className={`w-24 h-24 mx-auto rounded-[2.2rem] bg-gradient-to-br ${game.color} flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-indigo-500/40 transform -rotate-3 hover:rotate-0 transition-transform`}>
              <i className={`fas ${game.icon} text-white`}></i>
            </div>
            
            <h1 className="text-4xl font-black mb-3 tracking-tighter italic uppercase dark:text-white text-slate-900 transition-colors">{game.name}</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium transition-colors px-4">{game.description}</p>
            
            {/* How to Play Section */}
            <div className="mb-8 text-left bg-indigo-500/5 dark:bg-white/5 rounded-2xl p-6 border border-indigo-500/10 dark:border-white/10 mx-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-3 flex items-center gap-2">
                <i className="fas fa-info-circle"></i> How to Play
              </h3>
              <ul className="space-y-2">
                {game.instructions.map((inst, idx) => (
                  <li key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex gap-3 leading-snug">
                    <span className="text-indigo-500 font-bold">•</span>
                    {inst}
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => { setIsPlaying(true); setCurrentScore(0); }}
              className="w-[calc(100%-2rem)] mx-4 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/40 uppercase italic tracking-tighter mb-4"
            >
              START SESSION
            </button>
            
            {currentScore > 0 && (
              <div className="mt-4 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 shadow-inner mx-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Previous Run</p>
                <p className="text-3xl font-black text-indigo-500 drop-shadow-sm">{currentScore.toLocaleString()}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {renderGame()}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameRunner;
