
import React, { useState, useEffect, useCallback, useRef } from 'react';

const SumSurge: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<number[][]>(Array(4).fill(0).map(() => Array(4).fill(0)));
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isSpawning, setIsSpawning] = useState<[number, number] | null>(null);
  
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  const spawn = useCallback((currentGrid: number[][]) => {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return currentGrid;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newGrid = currentGrid.map(row => [...row]);
    newGrid[r][c] = Math.random() > 0.9 ? 4 : 2;
    setIsSpawning([r, c]);
    setTimeout(() => setIsSpawning(null), 300);
    return newGrid;
  }, []);

  const initGame = useCallback(() => {
    let g = Array(4).fill(0).map(() => Array(4).fill(0));
    g = spawn(g);
    g = spawn(g);
    setGrid(g);
    setScore(0);
    setIsGameOver(false);
  }, [spawn]);

  useEffect(() => {
    if (isPlaying) {
      initGame();
    }
  }, [isPlaying, initGame]);

  const checkGameOver = (currentGrid: number[][]) => {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === 0) return false;
      }
    }
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        if (currentGrid[r][c] === currentGrid[r][c + 1]) return false;
      }
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (currentGrid[r][c] === currentGrid[r + 1][c]) return false;
      }
    }
    return true;
  };

  const move = useCallback((direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (isGameOver) return;
    setGrid(prevGrid => {
      let currentGrid = prevGrid.map(row => [...row]);
      let moved = false;
      let newScore = score;
      const rotateGrid = (g: number[][]) => {
        const next = Array(4).fill(0).map(() => Array(4).fill(0));
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            next[c][3 - r] = g[r][c];
          }
        }
        return next;
      };
      let rotations = 0;
      if (direction === 'UP') rotations = 1;
      else if (direction === 'RIGHT') rotations = 2;
      else if (direction === 'DOWN') rotations = 3;
      for (let i = 0; i < rotations; i++) currentGrid = rotateGrid(currentGrid);
      for (let r = 0; r < 4; r++) {
        let row = currentGrid[r].filter(val => val !== 0);
        for (let i = 0; i < row.length - 1; i++) {
          if (row[i] === row[i + 1]) {
            row[i] *= 2;
            newScore += row[i];
            row.splice(i + 1, 1);
            moved = true;
          }
        }
        const newRow = row.concat(Array(4 - row.length).fill(0));
        if (JSON.stringify(currentGrid[r]) !== JSON.stringify(newRow)) moved = true;
        currentGrid[r] = newRow;
      }
      for (let i = 0; i < (4 - rotations) % 4; i++) currentGrid = rotateGrid(currentGrid);
      if (moved) {
        setTimeout(() => {
          setGrid(current => {
            const finalGrid = spawn(current);
            setScore(newScore);
            if (checkGameOver(finalGrid)) {
              setIsGameOver(true);
              setTimeout(() => onGameOver(newScore), 1500);
            }
            return finalGrid;
          });
        }, 100);
        return currentGrid;
      }
      return prevGrid;
    });
  }, [isGameOver, score, spawn, onGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) move('UP');
      else if (['ArrowDown', 's', 'S'].includes(e.key)) move('DOWN');
      else if (['ArrowLeft', 'a', 'A'].includes(e.key)) move('LEFT');
      else if (['ArrowRight', 'd', 'D'].includes(e.key)) move('RIGHT');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move, isPlaying]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) > 30) {
      if (absX > absY) move(dx > 0 ? 'RIGHT' : 'LEFT');
      else move(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStart.current = null;
  };

  const getTileColor = (val: number) => {
    switch (val) {
      case 2: return 'bg-indigo-500/30 text-indigo-400 border-indigo-500/40 shadow-indigo-500/20';
      case 4: return 'bg-cyan-500/30 text-cyan-400 border-cyan-500/40 shadow-cyan-500/20';
      case 8: return 'bg-emerald-500/30 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20';
      case 16: return 'bg-amber-500/30 text-amber-400 border-amber-500/40 shadow-amber-500/20';
      case 32: return 'bg-rose-500/30 text-rose-400 border-rose-500/40 shadow-rose-500/20';
      case 64: return 'bg-purple-500/30 text-purple-400 border-purple-500/40 shadow-purple-500/20';
      case 128: return 'bg-pink-500/40 text-pink-300 border-pink-400/60 shadow-pink-500/30';
      case 256: return 'bg-indigo-600/50 text-white border-indigo-400 shadow-indigo-500/40 scale-105';
      case 512: return 'bg-cyan-600/50 text-white border-cyan-400 shadow-cyan-500/40 scale-105';
      case 1024: return 'bg-emerald-600/60 text-white border-emerald-300 shadow-emerald-500/50 scale-110';
      case 2048: return 'bg-amber-500 text-white border-white shadow-amber-500/70 scale-110 animate-pulse';
      default: return 'bg-white/40 text-white border-white/50 shadow-2xl scale-115';
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-8 w-full max-w-md select-none px-4 py-12 overflow-hidden rounded-[3rem]">
      <div 
        className="absolute inset-0 z-0 opacity-20 dark:opacity-40"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-slate-50/70 dark:bg-[#0f172a]/70 backdrop-blur-md z-[1]" />

      <div className="relative z-10 w-full flex flex-col items-center gap-8">
        <div className="w-full flex justify-between items-center p-6 glass-card rounded-3xl border-indigo-500/20 shadow-xl border-2 backdrop-blur-xl bg-white/5 stagger-item">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none dark:text-white text-slate-900 transition-colors">SUM <br/><span className="text-indigo-600 dark:text-indigo-400">SURGE</span></h2>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Merge Score</p>
            <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400 italic tabular-nums transition-colors">{score.toLocaleString()}</p>
          </div>
        </div>

        <div 
          className="grid grid-cols-4 gap-3 p-4 bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border-4 border-slate-800/50 w-full aspect-square shadow-2xl relative overflow-hidden stagger-item"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
          {grid.map((row, r) => row.map((val, c) => (
            <div 
              key={`${r}-${c}`}
              className={`
                w-full h-full rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-[200ms] backdrop-blur-md
                ${val === 0 ? 'bg-white/5 border-transparent' : getTileColor(val)}
                ${isSpawning?.[0] === r && isSpawning?.[1] === c ? 'scale-125 brightness-150' : 'scale-100'}
              `}
              style={{
                transform: val === 0 ? 'scale(0.8)' : undefined
              }}
            >
              {val !== 0 && val}
            </div>
          )))}

          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl flex flex-col items-center justify-center z-50 rounded-[2rem] animate-in fade-in duration-[600ms]">
              <h3 className="text-5xl font-black text-white italic tracking-tighter mb-4 animate-bounce">BOARD FULL</h3>
              <p className="text-indigo-400 font-bold uppercase tracking-widest text-sm">System Overload</p>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-4 w-full stagger-item">
          <div className="flex gap-6">
            <div className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase flex items-center gap-2 tracking-widest transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              <i className="fas fa-arrows-alt text-indigo-500 animate-pulse"></i> Swipe or Arrows
            </div>
            <div className="text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase flex items-center gap-2 tracking-widest transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              <i className="fas fa-layer-group text-cyan-500 animate-pulse"></i> Merge Same
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SumSurge;
