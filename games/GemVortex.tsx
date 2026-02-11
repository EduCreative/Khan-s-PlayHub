
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];
const GRID_SIZE = 6;

type GemType = 'normal' | 'row' | 'col' | 'bomb';

interface Gem {
  color: string;
  type: GemType;
  id: string;
  shapeIndex: number;
}

// Audio Synthesis Utility
class SoundEngine {
  ctx: AudioContext | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSwap() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playMatch() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playCombo() {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start();
  }

  playTick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.02);
  }
}

const sounds = new SoundEngine();

interface GemVortexProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
}

const GemIcon: React.FC<{ color: string; shapeIndex: number; type: GemType }> = ({ color, shapeIndex, type }) => {
  // SVG Paths for different gem cuts
  const paths = [
    "M50 10 L90 50 L50 90 L10 50 Z", // Rhombus / Diamond
    "M30 15 L70 15 L90 50 L70 85 L30 85 L10 50 Z", // Hexagon / Emerald Cut
    "M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z", // Octagon
    "M50 10 L90 85 L10 85 Z", // Triangle / Trillion
    "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0" // Circle / Round
  ];

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full p-2 drop-shadow-md">
      <defs>
        <linearGradient id={`grad-${shapeIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="50%" stopColor={color} />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path 
        d={paths[shapeIndex]} 
        fill={`url(#grad-${shapeIndex})`} 
        stroke="rgba(255,255,255,0.4)" 
        strokeWidth="2"
      />
      {/* Facet lines for sparkle effect */}
      <path 
        d={paths[shapeIndex]} 
        fill="none" 
        stroke="rgba(255,255,255,0.2)" 
        strokeWidth="1" 
        transform="scale(0.8) translate(12, 12)" 
      />
      
      {type === 'row' && (
        <path d="M20 50 H80 M30 40 L20 50 L30 60 M70 40 L80 50 L70 60" stroke="white" strokeWidth="6" strokeLinecap="round" />
      )}
      {type === 'col' && (
        <path d="M50 20 V80 M40 30 L50 20 L60 30 M40 70 L50 80 L60 70" stroke="white" strokeWidth="6" strokeLinecap="round" />
      )}
      {type === 'bomb' && (
        <path d="M50 20 L60 45 L85 50 L60 55 L50 80 L40 55 L15 50 L40 45 Z" fill="white" className="animate-pulse" />
      )}
    </svg>
  );
};

const GemVortex: React.FC<GemVortexProps> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<Gem[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchingCells, setMatchingCells] = useState<Set<string>>(new Set());
  const [isExploding, setIsExploding] = useState(false);
  const comboRef = useRef(0);

  const getRandomGem = useCallback((): Gem => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIndex];
    const rand = Math.random();
    let type: GemType = 'normal';
    if (rand > 0.96) type = 'bomb';
    else if (rand > 0.92) type = 'row';
    else if (rand > 0.88) type = 'col';
    return { 
      color, 
      type, 
      id: Math.random().toString(36).substr(2, 9),
      shapeIndex: colorIndex
    };
  }, []);

  const initGrid = useCallback(() => {
    const newGrid: Gem[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Gem[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(getRandomGem());
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [getRandomGem]);

  useEffect(() => {
    if (isPlaying) {
      initGrid();
      setScore(0);
      setTimeLeft(60);
      setMatchingCells(new Set());
      comboRef.current = 0;
    }
  }, [isPlaying, initGrid]);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 10 && prev > 0) {
          sounds.playTick();
        }
        if (prev <= 1) {
          onGameOver(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, onGameOver]);

  const findMatchesAt = (currentGrid: Gem[][], r: number, c: number): Set<string> => {
    const color = currentGrid[r][c].color;
    const matches = new Set<string>();
    
    let hMatch = [`${r}-${c}`];
    for (let i = c - 1; i >= 0 && currentGrid[r][i].color === color; i--) hMatch.push(`${r}-${i}`);
    for (let i = c + 1; i < GRID_SIZE && currentGrid[r][i].color === color; i++) hMatch.push(`${r}-${i}`);
    if (hMatch.length >= 3) hMatch.forEach(id => matches.add(id));

    let vMatch = [`${r}-${c}`];
    for (let i = r - 1; i >= 0 && currentGrid[i][c].color === color; i--) vMatch.push(`${i}-${c}`);
    for (let i = r + 1; i < GRID_SIZE && currentGrid[i][c].color === color; i++) vMatch.push(`${i}-${c}`);
    if (vMatch.length >= 3) vMatch.forEach(id => matches.add(id));

    return matches;
  };

  const handleCellClick = (r: number, c: number) => {
    if (matchingCells.size > 0) return; // Prevent clicking during animation
    sounds.init();

    if (!selected) {
      setSelected([r, c]);
      sounds.playTick();
    } else {
      const [sr, sc] = selected;
      const dist = Math.abs(r - sr) + Math.abs(c - sc);
      
      if (dist === 1) {
        sounds.playSwap();
        const newGrid = grid.map(row => [...row]);
        const temp = newGrid[r][c];
        newGrid[r][c] = newGrid[sr][sc];
        newGrid[sr][sc] = temp;

        const matchesA = findMatchesAt(newGrid, r, c);
        const matchesB = findMatchesAt(newGrid, sr, sc);
        
        const gemA = newGrid[r][c];
        const gemB = newGrid[sr][sc];

        const isSpecialA = gemA.type !== 'normal';
        const isSpecialB = gemB.type !== 'normal';
        const isVibeMatch = Math.random() > 0.7;

        if (matchesA.size > 0 || matchesB.size > 0 || isSpecialA || isSpecialB || isVibeMatch) {
          const toClear = new Set<string>();
          
          const addGemsToClear = (row: number, col: number, gem: Gem, matchSize: number) => {
            toClear.add(`${row}-${col}`);
            
            if (matchSize >= 4) {
              setIsExploding(true);
              for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                  const nr = row + i;
                  const nc = col + j;
                  if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) toClear.add(`${nr}-${nc}`);
                }
              }
            }

            if (gem.type === 'row') {
              for (let i = 0; i < GRID_SIZE; i++) toClear.add(`${row}-${i}`);
            } else if (gem.type === 'col') {
              for (let i = 0; i < GRID_SIZE; i++) toClear.add(`${i}-${col}`);
            } else if (gem.type === 'bomb') {
              for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                  if (newGrid[i][j].color === gem.color) toClear.add(`${i}-${j}`);
                }
              }
            }
          };

          matchesA.forEach(id => {
            const [mr, mc] = id.split('-').map(Number);
            addGemsToClear(mr, mc, newGrid[mr][mc], matchesA.size);
          });
          matchesB.forEach(id => {
            const [mr, mc] = id.split('-').map(Number);
            addGemsToClear(mr, mc, newGrid[mr][mc], matchesB.size);
          });

          if (matchesA.size === 0 && isSpecialA) addGemsToClear(r, c, gemA, 0);
          if (matchesB.size === 0 && isSpecialB) addGemsToClear(sr, sc, gemB, 0);
          
          if (toClear.size === 0 && isVibeMatch) {
            toClear.add(`${r}-${c}`);
            toClear.add(`${sr}-${sc}`);
          }

          setMatchingCells(toClear);
          const clearCount = toClear.size;
          comboRef.current++;
          
          if (clearCount > 5 || comboRef.current > 2 || matchesA.size >= 4 || matchesB.size >= 4) {
            sounds.playCombo();
            setScore(s => s + (clearCount * 120));
          } else {
            sounds.playMatch();
            setScore(s => s + (clearCount * 60));
          }
          
          setTimeout(() => {
            setGrid(prev => {
              const updated = prev.map(row => [...row]);
              toClear.forEach(id => {
                const [tr, tc] = id.split('-').map(Number);
                updated[tr][tc] = getRandomGem();
              });
              return updated;
            });
            setMatchingCells(new Set());
            setIsExploding(false);
          }, 350);
        } else {
          setGrid(newGrid);
          comboRef.current = 0;
        }
      } else {
        setSelected([r, c]);
        sounds.playTick();
        return;
      }
      setSelected(null);
    }
  };

  const timerPercentage = (timeLeft / 60) * 100;
  const timerColor = timeLeft < 15 ? 'from-red-500 to-rose-600' : 'from-pink-500 to-purple-600';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 select-none">
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Score Bank</p>
            <p className="text-5xl font-black dark:text-white text-slate-900 tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] transition-colors">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black tabular-nums transition-colors ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-pink-500'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>

        <div className="w-full h-3 bg-white/5 rounded-full p-1 border border-white/10 shadow-inner">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(236,72,153,0.5)]`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      </div>

      <div className={`relative p-4 bg-white/[0.03] rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden group transition-transform duration-100 ${isExploding ? 'animate-bounce' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="grid grid-cols-6 gap-3 relative z-10">
          {grid.map((row, r) => row.map((gem, c) => {
            const id = `${r}-${c}`;
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const isMatching = matchingCells.has(id);
            
            return (
              <button
                key={gem.id}
                onClick={() => handleCellClick(r, c)}
                className={`
                  relative w-12 h-12 md:w-16 md:h-16 rounded-2xl transition-all duration-300 transform 
                  ${isSelected ? 'scale-110 z-20 ring-4 ring-white shadow-[0_0_30px_white] brightness-125' : 'hover:scale-105 active:scale-95'}
                  ${isMatching ? 'scale-150 brightness-200 rotate-45 z-30 opacity-0' : 'opacity-100'}
                `}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  boxShadow: isSelected ? `0 0 30px ${gem.color}88` : `0 8px 15px -3px ${gem.color}33`,
                  border: isSelected ? '3px solid white' : `1px solid rgba(255,255,255,0.1)`
                }}
              >
                <GemIcon color={gem.color} shapeIndex={gem.shapeIndex} type={gem.type} />

                <div className={`
                  absolute inset-0 w-full h-full bg-white transition-opacity duration-300 pointer-events-none rounded-2xl
                  ${isMatching ? 'opacity-100' : 'opacity-0'}
                `} />
              </button>
            );
          }))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3 text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 px-6 py-2 rounded-full border border-white/5">
          <i className={`fas fa-magic transition-transform ${isExploding ? 'animate-spin' : ''} text-purple-400`}></i>
          <span className="dark:text-slate-400 text-slate-500 font-bold">{comboRef.current > 1 ? `COMBO x${comboRef.current}!` : 'Chain matches for massive points!'}</span>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest transition-colors">
          <span className="flex items-center gap-1"><i className="fas fa-bomb"></i> 4+ Blast</span>
          <span className="flex items-center gap-1"><i className="fas fa-bolt"></i> Special</span>
        </div>
      </div>
    </div>
  );
};

export default GemVortex;
