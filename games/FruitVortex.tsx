
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

const COLORS = ['#ef4444', '#facc15', '#a855f7', '#22c55e', '#f97316'];
const GRID_SIZE = 6;

type FruitType = 'normal' | 'row' | 'col' | 'bomb';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Fruit {
  color: string;
  type: FruitType;
  id: string;
  shapeIndex: number;
}

// Memoized Icon Component to prevent unnecessary re-draws during grid animations
const FruitIcon = memo(({ color, shapeIndex, type, isMatching }: { color: string, shapeIndex: number, type: FruitType, isMatching: boolean }) => {
  const paths = [
    "M50 25 C30 25 10 40 10 65 C10 90 30 95 50 95 C70 95 90 90 90 65 C90 40 70 25 50 25",
    "M20 30 C40 10 90 40 80 85 C60 95 20 60 20 30",
    "M40 30 A10 10 0 1 1 60 30 M30 50 A10 10 0 1 1 50 50 M50 50 A10 10 0 1 1 70 50 M40 70 A10 10 0 1 1 60 70 M50 90 A10 10 0 1 1 50 90",
    "M50 15 C30 15 20 50 20 70 C20 90 35 95 50 95 C65 95 80 90 80 70 C80 50 70 15 50 15",
    "M50 50 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0"
  ];

  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full p-2 transition-all duration-[800ms] ${isMatching ? 'scale-[4] rotate-[270deg] brightness-[400%] opacity-0' : 'scale-100'}`}>
      <defs>
        <linearGradient id={`fruit-grad-${shapeIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor="black" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M50 25 L50 10" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
      <path d={paths[shapeIndex]} fill={`url(#fruit-grad-${shapeIndex})`} stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {type !== 'normal' && <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="4" strokeDasharray="4 4" className="animate-spin-slow" />}
    </svg>
  );
});

const FruitVortex: React.FC<{ onGameOver: (score: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [grid, setGrid] = useState<Fruit[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchingCells, setMatchingCells] = useState<Set<string>>(new Set());
  const [swapping, setSwapping] = useState<[number, number, number, number] | null>(null);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('khans-playhub-fruit-vortex-muted') === 'true');
  const comboRef = useRef(0);

  useEffect(() => {
    localStorage.setItem('khans-playhub-fruit-vortex-muted', isMuted.toString());
  }, [isMuted]);

  const playSound = useCallback((freq: number = 440, type: OscillatorType = 'sine') => {
    if (isMuted) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors
    }
  }, [isMuted]);

  const getRandomFruit = useCallback((): Fruit => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const rand = Math.random();
    let type: FruitType = 'normal';
    if (rand > 0.96) type = 'bomb';
    else if (rand > 0.92) type = 'row';
    return { color: COLORS[colorIndex], type, id: crypto.randomUUID(), shapeIndex: colorIndex };
  }, []);

  const checkMatches = useCallback((currentGrid: Fruit[][]) => {
    const matches = new Set<string>();
    
    // Check horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const color = currentGrid[r][c].color;
        if (color === currentGrid[r][c+1].color && color === currentGrid[r][c+2].color) {
          matches.add(`${r}-${c}`);
          matches.add(`${r}-${c+1}`);
          matches.add(`${r}-${c+2}`);
          let k = c + 3;
          while (k < GRID_SIZE && currentGrid[r][k].color === color) {
            matches.add(`${r}-${k}`);
            k++;
          }
        }
      }
    }

    // Check vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const color = currentGrid[r][c].color;
        if (color === currentGrid[r+1][c].color && color === currentGrid[r+2][c].color) {
          matches.add(`${r}-${c}`);
          matches.add(`${r+1}-${c}`);
          matches.add(`${r+2}-${c}`);
          let k = r + 3;
          while (k < GRID_SIZE && currentGrid[k][c].color === color) {
            matches.add(`${k}-${c}`);
            k++;
          }
        }
      }
    }
    
    return matches;
  }, []);

  const processMatches = useCallback(async (currentGrid: Fruit[][]) => {
    let gridState = [...currentGrid.map(row => [...row])];
    let hasMatches = true;
    let currentCombo = 1;

    while (hasMatches) {
      const matches = checkMatches(gridState);
      if (matches.size === 0) {
        hasMatches = false;
        break;
      }

      setMatchingCells(matches);
      playSound(1000 + (currentCombo * 200), 'sine');
      
      setScore(s => s + (matches.size * 10 * currentCombo));
      currentCombo++;

      await new Promise(res => setTimeout(res, 400));

      const newGrid = gridState.map(row => [...row]);
      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpaces = 0;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (matches.has(`${r}-${c}`)) {
            emptySpaces++;
          } else if (emptySpaces > 0) {
            newGrid[r + emptySpaces][c] = newGrid[r][c];
          }
        }
        for (let r = 0; r < emptySpaces; r++) {
          newGrid[r][c] = getRandomFruit();
        }
      }

      gridState = newGrid;
      setGrid(gridState);
      setMatchingCells(new Set());
      
      await new Promise(res => setTimeout(res, 300));
    }
  }, [checkMatches, getRandomFruit, playSound]);

  const initGrid = useCallback((diff: Difficulty) => {
    const newGrid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => getRandomFruit()));
    setGrid(newGrid);
    setDifficulty(diff);
    setTimeLeft(diff === 'Easy' ? 90 : 60);
  }, [getRandomFruit]);

  useEffect(() => {
    if (isPlaying) { setDifficulty(null); setScore(0); setMatchingCells(new Set()); }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { onGameOver(score); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, difficulty, timeLeft, score, onGameOver]);

  const handleCellClick = async (r: number, c: number) => {
    if (matchingCells.size > 0 || swapping || !difficulty) return;
    playSound(600, 'triangle');
    if (!selected) { setSelected([r, c]); }
    else {
      const [sr, sc] = selected;
      if (Math.abs(r - sr) + Math.abs(c - sc) === 1) {
        playSound(800, 'sine');
        setSwapping([sr, sc, r, c]);
        
        const newGrid = grid.map(row => [...row]);
        [newGrid[r][c], newGrid[sr][sc]] = [newGrid[sr][sc], newGrid[r][c]];
        setGrid(newGrid);
        
        const matches = checkMatches(newGrid);
        if (matches.size === 0) {
          await new Promise(res => setTimeout(res, 300));
          playSound(400, 'triangle');
          const revertedGrid = newGrid.map(row => [...row]);
          [revertedGrid[r][c], revertedGrid[sr][sc]] = [revertedGrid[sr][sc], revertedGrid[r][c]];
          setGrid(revertedGrid);
          setSwapping(null);
        } else {
          setSwapping(null);
          await processMatches(newGrid);
        }
      }
      setSelected(null);
    }
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full max-w-md p-8">
        <h2 className="text-2xl font-black uppercase italic text-indigo-400">Select Difficulty</h2>
        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
          <button key={level} onClick={() => initGrid(level)} className="w-full py-4 glass-card rounded-2xl font-black uppercase hover:bg-indigo-500/10 transition-all">{level}</button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
      <div className="w-full flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-black uppercase">Juice</span>
          <p className="text-4xl font-black text-orange-500">{score.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMuted(!isMuted)} 
            className="w-10 h-10 flex items-center justify-center rounded-full glass-card text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
          </button>
          <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>{timeLeft}s</p>
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 p-3 glass-card rounded-[2rem] border-white/10">
        {grid.map((row, r) => row.map((fruit, c) => (
          <button
            key={fruit.id}
            onClick={() => handleCellClick(r, c)}
            className={`relative w-12 h-12 md:w-16 md:h-16 rounded-xl transition-all duration-300 ${selected && selected[0] === r && selected[1] === c ? 'scale-110 ring-4 ring-white' : ''}`}
            style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <FruitIcon color={fruit.color} shapeIndex={fruit.shapeIndex} type={fruit.type} isMatching={matchingCells.has(`${r}-${c}`)} />
          </button>
        )))}
      </div>
    </div>
  );
};

export default FruitVortex;
