
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

const FruitVortex: React.FC<{ onGameOver: (score: number) => void; isPlaying: boolean; sfxVolume: number; hapticFeedback: boolean }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [grid, setGrid] = useState<Fruit[][]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [matchingCells, setMatchingCells] = useState<Set<string>>(new Set());
  const [swapping, setSwapping] = useState<[number, number, number, number] | null>(null);
  const comboRef = useRef(0);

  const playSfx = useCallback((src: string, volume: number) => {
    if (volume > 0) {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play();
    }
  }, []);

  const triggerHapticFeedback = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [hapticFeedback]);

  const getRandomFruit = useCallback((): Fruit => {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    const rand = Math.random();
    let type: FruitType = 'normal';
    if (rand > 0.96) type = 'bomb';
    else if (rand > 0.92) type = 'row';
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
    return { color: COLORS[colorIndex], type, id, shapeIndex: colorIndex };
  }, []);

  const initGrid = useCallback((diff: Difficulty) => {
    let newGrid: Fruit[][] = [];
    let hasMatch = true;
    
    while (hasMatch) {
      newGrid = Array.from({ length: GRID_SIZE }, () => Array.from({ length: GRID_SIZE }, () => getRandomFruit()));
      hasMatch = false;
      
      // Check horizontal
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 2; c++) {
          if (newGrid[r][c].color === newGrid[r][c+1].color && newGrid[r][c+1].color === newGrid[r][c+2].color) hasMatch = true;
        }
      }
      // Check vertical
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 2; r++) {
          if (newGrid[r][c].color === newGrid[r+1][c].color && newGrid[r+1][c].color === newGrid[r+2][c].color) hasMatch = true;
        }
      }
    }

    setGrid(newGrid);
    setDifficulty(diff);
    setTimeLeft(diff === 'Easy' ? 90 : 60);
    comboRef.current = 0;
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

  const checkMatchesForGrid = (currentGrid: Fruit[][]) => {
    const matches = new Set<string>();
    if (currentGrid.length === 0) return matches;

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 2; c++) {
        const f1 = currentGrid[r][c];
        const f2 = currentGrid[r][c + 1];
        const f3 = currentGrid[r][c + 2];
        if (f1.color === f2.color && f2.color === f3.color) {
          matches.add(`${r}-${c}`);
          matches.add(`${r}-${c + 1}`);
          matches.add(`${r}-${c + 2}`);
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      for (let r = 0; r < GRID_SIZE - 2; r++) {
        const f1 = currentGrid[r][c];
        const f2 = currentGrid[r + 1][c];
        const f3 = currentGrid[r + 2][c];
        if (f1.color === f2.color && f2.color === f3.color) {
          matches.add(`${r}-${c}`);
          matches.add(`${r + 1}-${c}`);
          matches.add(`${r + 2}-${c}`);
        }
      }
    }

    return matches;
  };

  const processMatches = useCallback(async (currentGrid: Fruit[][] = grid) => {
    const matches = checkMatchesForGrid(currentGrid);
    if (matches.size === 0) {
      comboRef.current = 0;
      return;
    }

    setMatchingCells(matches);
    playSfx('/sfx/burst.mp3', sfxVolume);
    triggerHapticFeedback();
    
    await new Promise(res => setTimeout(res, 600));

    // Calculate score
    const points = matches.size * 100 * (comboRef.current + 1);
    setScore(prev => prev + points);
    comboRef.current += 1;

    // Refill grid
    const nextGrid = currentGrid.map(row => [...row]);
    for (let c = 0; c < GRID_SIZE; c++) {
      let emptySlots = 0;
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        if (matches.has(`${r}-${c}`)) {
          emptySlots++;
        } else if (emptySlots > 0) {
          nextGrid[r + emptySlots][c] = nextGrid[r][c];
        }
      }
      for (let r = 0; r < emptySlots; r++) {
        nextGrid[r][c] = getRandomFruit();
      }
    }

    setGrid(nextGrid);
    setMatchingCells(new Set());
    
    // Recursive check for cascades
    setTimeout(() => processMatches(nextGrid), 400);
  }, [getRandomFruit, grid, playSfx, sfxVolume, triggerHapticFeedback]);

  const handleCellClick = async (r: number, c: number) => {
    if (matchingCells.size > 0 || swapping || !difficulty) return;
    if (!selected) { setSelected([r, c]); triggerHapticFeedback(); }
    else {
      const [sr, sc] = selected;
      if (Math.abs(r - sr) + Math.abs(c - sc) === 1) {
        setSwapping([sr, sc, r, c]);
        await new Promise(res => setTimeout(res, 300));
        
        const newGrid = grid.map(row => [...row]);
        [newGrid[r][c], newGrid[sr][sc]] = [newGrid[sr][sc], newGrid[r][c]];
        setGrid(newGrid);
        setSwapping(null);
        playSfx('/sfx/swap.mp3', sfxVolume);
        triggerHapticFeedback();

        // Check if swap was valid
        const matches = checkMatchesForGrid(newGrid);
        if (matches.size === 0) {
          // Revert swap
          await new Promise(res => setTimeout(res, 200));
          const revertedGrid = newGrid.map(row => [...row]);
          [revertedGrid[r][c], revertedGrid[sr][sc]] = [revertedGrid[sr][sc], revertedGrid[r][c]];
          setGrid(revertedGrid);
        } else {
          processMatches(newGrid);
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
        <p className={`text-2xl font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>{timeLeft}s</p>
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
