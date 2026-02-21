
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
import QuickMath from '../games/QuickMath';
import PatternFinder from '../games/PatternFinder';
import GrammarGuardian from '../games/GrammarGuardian';
import SudokuLite from '../games/SudokuLite';
import NeonSnake from '../games/NeonSnake';
import BitMaster from '../games/BitMaster';
import ReflexNode from '../games/ReflexNode';
import PulseWave from '../games/PulseWave';
import BinaryDash from '../games/BinaryDash';
import CyberDefense from '../games/CyberDefense';
import Tetris from '../games/Tetris';
import Logo from './Logo';
import VictoryEffect from './VictoryEffect';

interface GameRunnerProps {
  game: Game;
  onClose: () => void;
  onSaveScore: (score: number) => void;
  highScore: number;
  isDarkMode: boolean;
  isAnonymous: boolean;
  onOpenProfile: () => void;
}

const GameRunner: React.FC<GameRunnerProps> = ({ game, onClose, onSaveScore, highScore, isDarkMode, isAnonymous, onOpenProfile }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'exitToHub') {
        handleClose();
      }
      if (typeof event.data === 'object' && event.data.type === 'gameScore') {
        onSaveScore(event.data.score);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, onSaveScore]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 400); 
  };

  const handleGameOver = (finalScore: number, victory: boolean = false) => {
    setCurrentScore(finalScore);
    onSaveScore(finalScore);
    setIsVictory(victory);
    setIsPlaying(false);
    setShowGameOver(true);
  };

  const handleRetry = () => {
    setCurrentScore(0);
    setShowGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
  };

  const renderGame = () => {
    switch (game.id) {
      case 'fruit-vortex': return <FruitVortex onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'tetris': return <Tetris onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'number-ninja': return <NumberNinja onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'sum-surge': return <SumSurge onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'riddle-rift': return <RiddleRift onGameOver={(s) => handleGameOver(s, true)} />;
      case 'blitz-runner': return <BlitzRunner onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'bubble-fury': return <BubbleFury onGameOver={(s) => handleGameOver(s, true)} isPlaying={isPlaying} />;
      case 'memory-matrix': return <MemoryMatrix onGameOver={(s) => handleGameOver(s, true)} isPlaying={isPlaying} />;
      case 'labyrinth': return <Labyrinth onGameOver={(s) => handleGameOver(s, true)} isPlaying={isPlaying} />;
      case 'color-clash': return <ColorClash onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'word-builder': return <WordBuilder onGameOver={handleGameOver} isPlaying={isPlaying} isDarkMode={isDarkMode} />;
      case 'quick-math': return <QuickMath onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'pattern-finder': return <PatternFinder onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'grammar-guardian': return <GrammarGuardian onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'sudoku-lite': return <SudokuLite onGameOver={(s) => handleGameOver(s, true)} isPlaying={isPlaying} />;
      case 'neon-snake': return <NeonSnake onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'bit-master': return <BitMaster onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'reflex-node': return <ReflexNode onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'pulse-wave': return <PulseWave onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'binary-dash': return <BinaryDash onGameOver={handleGameOver} isPlaying={isPlaying} />;
      case 'cyber-defense': return <CyberDefense onGameOver={handleGameOver} isPlaying={isPlaying} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <i className={`fas ${game.icon} text-8xl mb-6 opacity-20 dark:text-white text-slate-900`}></i>
            <h2 className="text-3xl font-bold mb-4 dark:text-white text-slate-900">{game.name} is coming soon!</h2>
            <button onClick={handleClose} className="px-8 py-3 bg-white/10 rounded-xl">Back to Hub</button>
          </div>
        );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-[#020617]' : 'bg-slate-50'} flex flex-col transition-all duration-500 ${isClosing ? 'portal-exit' : 'portal-enter'}`}>
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-center justify-between z-20 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button onClick={handleClose} className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all shadow-lg group">
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
            <Logo size={24} showGlow={false} />
            <h2 className="text-sm font-black italic dark:text-white text-slate-900 uppercase tracking-tighter leading-none">{game.name}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative bg-grid-white/[0.02] overflow-y-auto pt-24 pb-12 transition-all duration-700">
        {!isPlaying && !showGameOver ? (
          <div className="text-center p-8 glass-card rounded-[3rem] max-w-xl w-full border-indigo-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-700 border-2 my-auto mx-4">
            <div className={`w-24 h-24 mx-auto rounded-[2.2rem] bg-gradient-to-br ${game.color} flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-indigo-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500`}>
              <i className={`fas ${game.icon} text-white`}></i>
            </div>
            <h1 className="text-4xl font-black mb-3 tracking-tighter italic uppercase dark:text-white text-slate-900 transition-colors">{game.name}</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed font-medium px-4">{game.description}</p>
            
            {game.instructions && game.instructions.length > 0 && (
              <div className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6 mb-8 text-left border border-slate-200 dark:border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
                  <i className="fas fa-book-open"></i> Mission Briefing
                </h3>
                <ul className="space-y-3">
                  {game.instructions.map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{idx + 1}</span>
                      <span>{inst}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button 
              onClick={() => { setIsPlaying(true); setCurrentScore(0); }}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[2rem] font-black text-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/40 uppercase italic tracking-tighter"
            >
              START SESSION
            </button>
          </div>
        ) : showGameOver ? (
          <div className="text-center p-8 glass-card rounded-[3rem] max-w-xl w-full border-rose-500/30 shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-700 border-2 my-auto mx-4 overflow-hidden relative">
            {isVictory && <div className="absolute inset-0 pointer-events-none"><VictoryEffect onComplete={() => {}} /></div>}
            <div className={`w-20 h-20 mx-auto rounded-[1.8rem] bg-gradient-to-br ${isVictory ? 'from-emerald-400 to-teal-600' : 'from-rose-500 to-rose-700'} flex items-center justify-center text-4xl mb-6 shadow-2xl animate-bounce`}>
              <i className={`fas ${isVictory ? 'fa-trophy' : 'fa-skull'} text-white`}></i>
            </div>
            <h1 className={`text-5xl font-black mb-2 tracking-tighter italic uppercase ${isVictory ? 'text-emerald-500' : 'text-rose-500'}`}>{isVictory ? 'SUCCESS!' : 'GAME OVER'}</h1>
            <div className="bg-slate-100 dark:bg-white/5 rounded-3xl p-8 border border-slate-200 dark:border-white/5 mb-8 shadow-inner">
              <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mb-2">Total Score Gained</p>
              <p className={`text-6xl font-black tabular-nums drop-shadow-sm italic ${isVictory ? 'text-emerald-500' : 'text-indigo-500'}`}>{currentScore.toLocaleString()}</p>
            </div>
            <div className="flex flex-col gap-3">
              {isAnonymous && currentScore > 0 && (
                <button onClick={onOpenProfile} className="w-full py-4 bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-500 rounded-2xl font-black text-sm mb-2 flex items-center justify-center gap-3 animate-pulse">
                  <i className="fas fa-cloud-arrow-up"></i> SECURE PROGRESS TO PROFILE
                </button>
              )}
              <button onClick={handleRetry} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl uppercase italic tracking-tighter">RETRY SESSION</button>
              <button onClick={handleClose} className="py-4 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500/10 transition-all">Close Session</button>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-700">{renderGame()}</div>
        )}
      </div>
    </div>
  );
};

export default GameRunner;
