
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLORS = ['#ef4444', '#facc15', '#a855f7', '#22c55e', '#f97316'];
const GRID_SIZE = 6;

type FruitType = 'normal' | 'row' | 'col' | 'bomb';

interface Fruit {
  color: string;
  type: FruitType;
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

interface FruitVortexProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
}

const FruitIcon: React.FC<{ color: string; shapeIndex: number; type: FruitType; isMatching: boolean }> = ({ color, shapeIndex, type, isMatching }) => {
  const paths = [
    "M50 25 C30 25 10 40 10 65 C10 90 30 95 50 95 C70 95 90 90 90 65 C90 40 70 25 50 25",
    "M20 30 C40 10 90 40 80 85 C60 95 20 60 20 30",
    "M40 30 A10 10 0 1 1 60 30 M30 50 A10 10 0 1 1 50 50 M50 50 A10 10 0 1 1 70 50 M40 70 A10 10 0 1 1 60 70 M50 90 A10 10 0 1 1 50 90",
    "M50 15 C30 15 20 50 20 70 C20 90 35 95 50 95 C65 95 80 90 80 70 C80 50 70 15 50 15",
    "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0"
  ];

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full p-2 drop-shadow-md transition-all duration-300 ${isMatching ? 'scale-[2.5] rotate-45 brightness-150' : 'scale-100'}`}>
      <defs>
        <linearGradient id={`fruit-grad-${shapeIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M50 25 L50 10" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 15 C60 15 65 5 65 5" stroke="#166534" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d={paths[shapeIndex]} fill={`url(#fruit-grad-${shapeIndex})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      <ellipse cx="40" cy="40" rx="10" ry="5" fill="white" fillOpacity="0.4" transform="rotate(-30 40 40)" />
      {type === 'row' && <path d="M20 50 H80 M30 40 L20 50 L30 60 M70 40 L80 50 L70 60" stroke="white" strokeWidth="6" strokeLinecap="round" />}
      {type === 'col' && <path d="M50 20 V80 M40 30 L50 20 L60 30 M40 70 L50 80 L60 70" stroke="white" strokeWidth="6" strokeLinecap="round" />}
      {type === 'bomb' && <path d="M50 20 L60 45 L85 50 L60 55 L50 80 L40 55 L15 50 L40 45 Z" fill="white" className="animate-pulse" />}
    </svg>
  );
};

const FruitVortex: React.FC<FruitVortexProps> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<Fruit[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchingCells, setMatchingCells] = useState<Set<string>>(new Set());
  const [swapping, setSwapping] = useState<[number, number, number, number] | null>(null);
  const [isExploding, setIsExploding] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const comboRef = useRef(0);

  const getRandomFruit = useCallback((): Fruit => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const color = COLORS[colorIndex];
    const rand = Math.random();
    let type: FruitType = 'normal';
    if (rand > 0.96) type = 'bomb';
    else if (rand > 0.92) type = 'row';
    else if (rand > 0.88) type = 'col';
    return { color, type, id: Math.random().toString(36).substr(2, 9), shapeIndex: colorIndex };
  }, []);

  const initGrid = useCallback(() => {
    const newGrid: Fruit[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Fruit[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        row.push(getRandomFruit());
      }
      newGrid.push(row);
    }
    setGrid(newGrid);
  }, [getRandomFruit]);

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
        if (prev <= 10 && prev > 0) sounds.playTick();
        if (prev <= 1) { onGameOver(score); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, onGameOver]);

  const findMatchesAt = (currentGrid: Fruit[][], r: number, c: number): Set<string> => {
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

  const triggerShake = (intensity: number) => {
    setShakeIntensity(intensity);
    setTimeout(() => setShakeIntensity(0), 400);
  };

  const handleCellClick = async (r: number, c: number) => {
    if (matchingCells.size > 0 || swapping) return;
    sounds.init();

    if (!selected) {
      setSelected([r, c]);
      sounds.playTick();
    } else {
      const [sr, sc] = selected;
      const dist = Math.abs(r - sr) + Math.abs(c - sc);
      
      if (dist === 1) {
        // Visual Swap Initiation
        setSwapping([sr, sc, r, c]);
        sounds.playSwap();
        
        // Wait for visual swap animation
        await new Promise(res => setTimeout(res, 250));
        
        const newGrid = grid.map(row => [...row]);
        const temp = newGrid[r][c];
        newGrid[r][c] = newGrid[sr][sc];
        newGrid[sr][sc] = temp;

        const matchesA = findMatchesAt(newGrid, r, c);
        const matchesB = findMatchesAt(newGrid, sr, sc);
        
        const fruitA = newGrid[r][c];
        const fruitB = newGrid[sr][sc];

        const isSpecialA = fruitA.type !== 'normal';
        const isSpecialB = fruitB.type !== 'normal';
        const isVibeMatch = Math.random() > 0.85;

        if (matchesA.size > 0 || matchesB.size > 0 || isSpecialA || isSpecialB || isVibeMatch) {
          const toClear = new Set<string>();
          const addFruitToClear = (row: number, col: number, fruit: Fruit, matchSize: number) => {
            toClear.add(`${row}-${col}`);
            if (matchSize >= 4) {
              setIsExploding(true);
              triggerShake(matchSize * 3);
              for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                  const nr = row + i, nc = col + j;
                  if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) toClear.add(`${nr}-${nc}`);
                }
              }
            }
            if (fruit.type === 'row') for (let i = 0; i < GRID_SIZE; i++) toClear.add(`${row}-${i}`);
            else if (fruit.type === 'col') for (let i = 0; i < GRID_SIZE; i++) toClear.add(`${i}-${col}`);
            else if (fruit.type === 'bomb') {
              triggerShake(20);
              for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                  if (newGrid[i][j].color === fruit.color) toClear.add(`${i}-${j}`);
                }
              }
            }
          };

          matchesA.forEach(id => { const [mr, mc] = id.split('-').map(Number); addFruitToClear(mr, mc, newGrid[mr][mc], matchesA.size); });
          matchesB.forEach(id => { const [mr, mc] = id.split('-').map(Number); addFruitToClear(mr, mc, newGrid[mr][mc], matchesB.size); });

          if (matchesA.size === 0 && isSpecialA) addFruitToClear(r, c, fruitA, 0);
          if (matchesB.size === 0 && isSpecialB) addFruitToClear(sr, sc, fruitB, 0);
          if (toClear.size === 0 && isVibeMatch) { toClear.add(`${r}-${c}`); toClear.add(`${sr}-${sc}`); }

          setGrid(newGrid);
          setSwapping(null);
          setMatchingCells(toClear);
          const clearCount = toClear.size;
          comboRef.current++;
          
          if (clearCount > 5 || comboRef.current > 2 || matchesA.size >= 4 || matchesB.size >= 4) {
            sounds.playCombo();
            triggerShake(Math.min(25, clearCount * 2));
            setScore(s => s + (clearCount * 120));
          } else {
            sounds.playMatch();
            triggerShake(8);
            setScore(s => s + (clearCount * 60));
          }
          
          setTimeout(() => {
            setGrid(prev => {
              const updated = prev.map(row => [...row]);
              toClear.forEach(id => { const [tr, tc] = id.split('-').map(Number); updated[tr][tc] = getRandomFruit(); });
              return updated;
            });
            setMatchingCells(new Set());
            setIsExploding(false);
          }, 450);
        } else {
          // Revert visual swap if no match
          sounds.playTick();
          await new Promise(res => setTimeout(res, 50));
          setSwapping(null);
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
  const timerColor = timeLeft < 15 ? 'from-red-500 to-rose-600' : 'from-orange-500 to-red-600';

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4 select-none">
      <div className="w-full flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Juice Points</p>
            <p className="text-5xl font-black text-white tabular-nums tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
              {score.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black tabular-nums transition-colors ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-orange-500'}`}>
              {timeLeft}s
            </p>
          </div>
        </div>

        <div className="w-full h-3 bg-white/5 rounded-full p-1 border border-white/10 shadow-inner">
          <div className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-1000 ease-linear shadow-[0_0_15px_rgba(249,115,22,0.5)]`} style={{ width: `${timerPercentage}%` }} />
        </div>
      </div>

      <div 
        className={`relative p-4 bg-white/[0.03] rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-sm overflow-hidden group transition-all duration-75`}
        style={{ transform: shakeIntensity > 0 ? `translate(${Math.random() * shakeIntensity - shakeIntensity/2}px, ${Math.random() * shakeIntensity - shakeIntensity/2}px)` : 'none' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        
        <div className="grid grid-cols-6 gap-3 relative z-10">
          {grid.map((row, r) => row.map((fruit, c) => {
            const id = `${r}-${c}`;
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const isMatching = matchingCells.has(id);
            
            // Visual Swap Offsets
            let visualOffset = { x: 0, y: 0 };
            if (swapping) {
              const [sr, sc, tr, tc] = swapping;
              if (r === sr && c === sc) {
                visualOffset = { x: (tc - sc) * 110, y: (tr - sr) * 110 };
              } else if (r === tr && c === tc) {
                visualOffset = { x: (sc - tc) * 110, y: (sr - tr) * 110 };
              }
            }

            return (
              <button
                key={fruit.id}
                onClick={() => handleCellClick(r, c)}
                className={`
                  relative w-12 h-12 md:w-16 md:h-16 rounded-2xl transition-all transform 
                  ${isSelected ? 'scale-110 z-30 ring-4 ring-white shadow-[0_0_30px_white] brightness-125 rotate-3' : 'hover:scale-105 active:scale-90'}
                  ${isMatching ? 'scale-[3] brightness-[5] rotate-[90deg] z-50 opacity-0' : 'opacity-100'}
                  ${swapping ? 'duration-[250ms] ease-in-out' : 'duration-300'}
                `}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  boxShadow: isSelected ? `0 0 30px ${fruit.color}88` : `0 8px 15px -3px ${fruit.color}33`,
                  border: isSelected ? '3px solid white' : `1px solid rgba(255,255,255,0.1)`,
                  transform: `translate(${visualOffset.x}%, ${visualOffset.y}%) ${isSelected ? 'scale(1.15) rotate(5deg)' : ''}`
                }}
              >
                <FruitIcon color={fruit.color} shapeIndex={fruit.shapeIndex} type={fruit.type} isMatching={isMatching} />
                <div className={`absolute inset-0 w-full h-full bg-white transition-opacity duration-300 pointer-events-none rounded-2xl ${isMatching ? 'opacity-80 scale-150' : 'opacity-0'}`} />
              </button>
            );
          }))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className={`flex items-center gap-3 text-slate-400/60 bg-white/5 px-6 py-2 rounded-full border border-white/5 text-xs font-medium transition-all ${comboRef.current > 1 ? 'scale-125 text-orange-400 border-orange-500/40 bg-orange-500/10' : ''}`}>
          <i className={`fas fa-apple-whole transition-transform ${isExploding ? 'animate-spin' : ''} ${comboRef.current > 1 ? 'text-orange-400' : 'text-slate-500'}`}></i>
          <span>{comboRef.current > 1 ? `JUICE COMBO x${comboRef.current}!` : 'Match fruits for juicy combos!'}</span>
        </div>
        <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          <span className="flex items-center gap-1"><i className="fas fa-bomb text-red-500"></i> Fruit Blast</span>
          <span className="flex items-center gap-1"><i className="fas fa-bolt text-yellow-500"></i> Juice Pulse</span>
        </div>
      </div>
    </div>
  );
};

export default FruitVortex;
