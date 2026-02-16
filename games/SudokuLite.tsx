
import React, { useState, useEffect, useCallback, useRef } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const SudokuLite: React.FC<{ onGameOver: (s: number, v: boolean) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [solution, setSolution] = useState<number[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [time, setTime] = useState(0);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [numberCounts, setNumberCounts] = useState<Record<number, number>>({});

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 40; 
      case 'Medium': return 32;
      case 'Hard': return 24;
      default: return 35;
    }
  };

  const generateSudoku = useCallback((diff: Difficulty) => {
    const base = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 1, 5, 6, 4, 8, 9, 7],
      [5, 6, 4, 8, 9, 7, 2, 3, 1],
      [8, 9, 7, 2, 3, 1, 5, 6, 4],
      [3, 1, 2, 6, 4, 5, 9, 7, 8],
      [6, 4, 5, 9, 7, 8, 3, 1, 2],
      [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ];
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let shuffled = base.map(row => row.map(cell => nums[cell - 1]));
    
    for (let i = 0; i < 9; i += 3) {
      const blockRows = [i, i + 1, i + 2].sort(() => Math.random() - 0.5);
      const temp = [...shuffled];
      shuffled[i] = temp[blockRows[0]];
      shuffled[i + 1] = temp[blockRows[1]];
      shuffled[i + 2] = temp[blockRows[2]];
    }

    setSolution(shuffled);

    const clues = getDifficultySettings(diff);
    const playable = shuffled.map(row => [...row]);
    const initMask = Array(9).fill(null).map(() => Array(9).fill(true));
    let removed = 0;
    while (removed < 81 - clues) {
      const r = Math.floor(Math.random() * 9), c = Math.floor(Math.random() * 9);
      if (playable[r][c] !== 0) { 
        playable[r][c] = 0; 
        initMask[r][c] = false; 
        removed++; 
      }
    }

    setGrid(playable);
    setInitial(initMask);
    setTime(0);
    setDifficulty(diff);
    setSelectedCell(null);
  }, []);

  useEffect(() => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= 9; i++) counts[i] = 0;
    grid.forEach(row => row.forEach(cell => {
      if (cell !== 0) counts[cell] = (counts[cell] || 0) + 1;
    }));
    setNumberCounts(counts);
  }, [grid]);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setGrid([]);
      setInitial([]);
      setSolution([]);
      setTime(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty) return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, difficulty]);

  const setNumber = (num: number) => {
    if (!selectedCell || !grid.length) return;
    const [r, c] = selectedCell;
    const newGrid = grid.map(row => [...row]);
    
    newGrid[r][c] = newGrid[r][c] === num ? 0 : num;
    setGrid(newGrid);

    const isComplete = newGrid.every((row, ri) => 
      row.every((cell, ci) => cell === solution[ri][ci])
    );

    if (isComplete) {
      const bonus = Math.max(0, 10000 - time * 5);
      onGameOver(bonus + 2000, true);
    }
  };

  const isConflict = (r: number, c: number) => {
    if (difficulty !== 'Easy') return false;
    const val = grid[r][c];
    if (val === 0) return false;
    for (let i = 0; i < 9; i++) {
      if (i !== c && grid[r][i] === val) return true;
      if (i !== r && grid[i][c] === val) return true;
    }
    const startR = Math.floor(r / 3) * 3;
    const startC = Math.floor(c / 3) * 3;
    for (let i = startR; i < startR + 3; i++) {
      for (let j = startC; j < startC + 3; j++) {
        if ((i !== r || j !== c) && grid[i][j] === val) return true;
      }
    }
    return false;
  };

  const isNeighborhood = (r: number, c: number) => {
    if (!selectedCell || (difficulty !== 'Easy' && difficulty !== 'Medium')) return false;
    const [selR, selC] = selectedCell;
    const blockR = Math.floor(selR / 3);
    const blockC = Math.floor(selC / 3);
    return r === selR || c === selC || (Math.floor(r / 3) === blockR && Math.floor(c / 3) === blockC);
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-table-cells text-5xl text-indigo-500 mb-4"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white transition-colors">Sudoku Master</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button key={level} onClick={() => generateSudoku(level)} className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-indigo-500/10 hover:border-indigo-500 transition-all active:scale-95">
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Full Visual Assistance' : level === 'Medium' ? 'Neighborhood Tracking' : 'Pure Logic Challenge'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-indigo-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-6 w-full max-w-lg px-4 py-8 select-none overflow-hidden rounded-[3rem]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-15 dark:opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&q=80&w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-slate-50/80 dark:bg-[#0f172a]/80 backdrop-blur-md z-[1]" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-slate-500/20 shadow-xl border-2 backdrop-blur-xl bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Timer</span>
            <span className="text-2xl font-black text-indigo-500 tabular-nums">{time}s</span>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{difficulty} Mode</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase">Target</span>
            <span className="text-2xl font-black text-slate-400 italic">Nexus Clear</span>
          </div>
        </div>

        <div className="relative w-full aspect-square bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border-4 border-slate-800 p-1 shadow-2xl overflow-hidden transition-all duration-500">
          <div className="grid grid-cols-9 h-full w-full">
            {grid.map((row, r) => row.map((cell, c) => {
              const isSel = selectedCell?.[0] === r && selectedCell?.[1] === c;
              const inNeighborhood = isNeighborhood(r, c);
              const hasConflict = isConflict(r, c);
              const isBlockEndR = (r + 1) % 3 === 0 && r !== 8;
              const isBlockEndC = (c + 1) % 3 === 0 && c !== 8;
              
              return (
                <button 
                  key={`${r}-${c}`} 
                  onClick={() => !initial[r][c] && setSelectedCell([r, c])} 
                  className={`
                    relative flex items-center justify-center text-lg md:text-xl font-black transition-all border-[0.5px] border-white/5
                    ${initial[r][c] ? 'text-slate-500 bg-white/5' : 'text-indigo-400 hover:bg-indigo-500/10'}
                    ${inNeighborhood && !isSel ? 'bg-indigo-500/5' : ''}
                    ${isSel ? 'bg-indigo-500/30 ring-2 ring-indigo-500 z-10' : ''}
                    ${hasConflict ? 'text-rose-500 bg-rose-500/10 animate-pulse' : ''}
                    ${isBlockEndR ? 'border-b-2 border-b-white/20' : ''} 
                    ${isBlockEndC ? 'border-r-2 border-r-white/20' : ''}
                  `}
                >
                  {cell !== 0 ? cell : ''}
                </button>
              );
            }))}
          </div>
        </div>

        <div className="grid grid-cols-9 gap-2 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
            const isComplete = (numberCounts[num] || 0) >= 9;
            return (
              <button 
                key={num} 
                onClick={() => setNumber(num)} 
                className={`
                  aspect-square glass-card rounded-xl flex flex-col items-center justify-center transition-all shadow-lg border-2 backdrop-blur-md
                  ${isComplete 
                    ? 'opacity-30 border-slate-500 grayscale bg-white/5' 
                    : 'hover:scale-110 active:scale-95 border-indigo-500/20 text-slate-800 dark:text-white bg-white/10'
                  }
                `}
              >
                <span className="text-lg md:text-xl font-black leading-none">{num}</span>
                <span className="text-[8px] font-black opacity-40 mt-0.5">{numberCounts[num] || 0}/9</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] bg-slate-100 dark:bg-white/5 px-6 py-2 rounded-full border border-slate-200 dark:border-white/5 backdrop-blur-md">
           <i className="fas fa-lightbulb text-indigo-500"></i>
           <span>{difficulty === 'Easy' ? 'Conflicts & Neighborhoods Visible' : difficulty === 'Medium' ? 'Neighborhoods Visible' : 'Pure Logic Mode'}</span>
        </div>
      </div>
    </div>
  );
};

export default SudokuLite;
