
import React, { useState, useEffect, useCallback } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const SudokuLite: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const getDifficultySettings = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 40; // Clues
      case 'Medium': return 32;
      case 'Hard': return 24;
      default: return 35;
    }
  };

  const generateSudoku = useCallback((diff: Difficulty) => {
    // Basic valid solved 9x9 Sudoku grid
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

    // Shuffle numbers
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let shuffled = base.map(row => row.map(cell => nums[cell - 1]));

    // Simple Shuffle: Swap rows within 3x3 blocks
    for (let i = 0; i < 9; i += 3) {
      const blockRows = [i, i + 1, i + 2].sort(() => Math.random() - 0.5);
      const temp = [...shuffled];
      shuffled[i] = temp[blockRows[0]];
      shuffled[i + 1] = temp[blockRows[1]];
      shuffled[i + 2] = temp[blockRows[2]];
    }

    // Remove cells for difficulty
    const clues = getDifficultySettings(diff);
    const cellsToRemove = 81 - clues;
    const playable = shuffled.map(row => [...row]);
    const initMask = Array(9).fill(null).map(() => Array(9).fill(true));

    let removed = 0;
    while (removed < cellsToRemove) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (playable[r][c] !== 0) {
        playable[r][c] = 0;
        initMask[r][c] = false;
        removed++;
      }
    }

    setGrid(playable);
    setInitial(initMask);
    setTime(0);
    setScore(0);
    setDifficulty(diff);
    setSelectedCell(null);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setGrid([]);
      setInitial([]);
      setTime(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty) return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying, difficulty]);

  const handleCellClick = (r: number, c: number) => {
    if (initial[r][c]) return;
    setSelectedCell([r, c]);
  };

  const setNumber = (num: number) => {
    if (!selectedCell || !grid.length) return;
    const [r, c] = selectedCell;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    // Simple validation would go here if needed
    // Check win condition
    const isComplete = newGrid.every(row => row.every(cell => cell !== 0));
    if (isComplete) {
      const bonus = Math.max(0, 10000 - time * 5);
      onGameOver(bonus + 2000);
    }
  };

  const isHighlighted = (r: number, c: number) => {
    if (!selectedCell) return false;
    const [sr, sc] = selectedCell;
    // Row, Column, or 3x3 Block
    const sameRow = r === sr;
    const sameCol = c === sc;
    const sameBlock = Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3);
    return sameRow || sameCol || sameBlock;
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-table-cells text-5xl text-indigo-500 mb-4"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Choose Your Level</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Test your logic with a 9x9 grid.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button
              key={level}
              onClick={() => generateSudoku(level)}
              className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-indigo-500/10 hover:border-indigo-500 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Relaxed Logic' : level === 'Medium' ? 'Serious Puzzler' : 'Neural Overload'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-indigo-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-slate-500/20 shadow-xl border-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Chronos</span>
          <span className="text-2xl font-black text-indigo-500 tabular-nums">{time}s</span>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{difficulty} Mode</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Target</span>
          <span className="text-2xl font-black text-slate-400 italic tabular-nums">2,000</span>
        </div>
      </div>

      <div className="relative w-full aspect-square bg-slate-900 rounded-[2rem] border-4 border-slate-800 p-1 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-9 h-full w-full">
          {grid.map((row, r) => row.map((cell, c) => {
            const isSel = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isHigh = isHighlighted(r, c);
            const isBlockEndR = (r + 1) % 3 === 0 && r !== 8;
            const isBlockEndC = (c + 1) % 3 === 0 && c !== 8;

            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`
                  relative flex items-center justify-center text-lg md:text-xl font-black transition-all border-[0.5px] border-white/5
                  ${initial[r][c] ? 'text-slate-400 bg-white/5 cursor-default' : 'text-indigo-400 hover:bg-indigo-500/10'}
                  ${isHigh ? 'bg-indigo-500/5' : ''}
                  ${isSel ? 'bg-indigo-500/30 ring-2 ring-indigo-500 z-10' : ''}
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => setNumber(num)}
            className="aspect-square glass-card rounded-xl flex items-center justify-center text-lg md:text-xl font-black hover:scale-110 active:scale-95 border-2 border-indigo-500/20 text-slate-800 dark:text-white transition-all shadow-lg"
          >
            {num}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 py-2 px-6 glass-card rounded-full border border-indigo-500/20 text-slate-500 dark:text-slate-400">
         <i className="fas fa-info-circle text-indigo-500"></i>
         <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select an empty cell then a number</p>
      </div>
    </div>
  );
};

export default SudokuLite;
