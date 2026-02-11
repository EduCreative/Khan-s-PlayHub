
import React, { useState, useEffect, useCallback } from 'react';

const SudokuLite: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<number[][]>([]);
  const [initial, setInitial] = useState<boolean[][]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(0);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);

  const generatePuzzle = useCallback(() => {
    // Basic 4x4 Sudoku generation
    const puzzle = [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [2, 3, 4, 1],
      [4, 1, 2, 3]
    ].sort(() => Math.random() - 0.5);
    
    const solved = puzzle.map(row => row.sort(() => Math.random() - 0.5));
    const playable = solved.map(row => row.map(cell => Math.random() > 0.4 ? cell : 0));
    const initMask = playable.map(row => row.map(cell => cell !== 0));

    setGrid(playable);
    setInitial(initMask);
    setTime(0);
    setScore(0);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      generatePuzzle();
    }
  }, [isPlaying, generatePuzzle]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleCellClick = (r: number, c: number) => {
    if (initial[r][c]) return;
    setSelectedCell([r, c]);
  };

  const setNumber = (num: number) => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    const newGrid = grid.map(row => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);
    setSelectedCell(null);

    // Check win condition
    const isComplete = newGrid.every(row => row.every(cell => cell !== 0));
    if (isComplete) {
      const bonus = Math.max(0, 5000 - time * 10);
      onGameOver(bonus + 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-sm px-6 select-none animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-6 rounded-3xl border-slate-500/20 shadow-xl">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Chronos</span>
          <span className="text-3xl font-black text-indigo-500 tabular-nums">{time}s</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Static Score</span>
          <span className="text-3xl font-black text-slate-400 italic tabular-nums">1,000</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 w-full aspect-square p-4 glass-card rounded-[2.5rem] border-4 border-slate-500/10">
        {grid.map((row, r) => row.map((cell, c) => (
          <button
            key={`${r}-${c}`}
            onClick={() => handleCellClick(r, c)}
            className={`
              rounded-xl flex items-center justify-center text-3xl font-black transition-all border-2
              ${initial[r][c] ? 'bg-slate-800 text-slate-400 border-transparent cursor-not-allowed' : 'bg-white/5 border-indigo-500/10 hover:border-indigo-500/40'}
              ${selectedCell?.[0] === r && selectedCell?.[1] === c ? 'scale-110 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] z-10' : ''}
              ${!initial[r][c] && cell !== 0 ? 'text-indigo-400' : ''}
            `}
          >
            {cell !== 0 ? cell : ''}
          </button>
        )))}
      </div>

      <div className="flex gap-4 w-full">
        {[1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => setNumber(num)}
            className="flex-1 h-16 glass-card rounded-2xl flex items-center justify-center text-2xl font-black hover:scale-110 active:scale-95 border-2 border-indigo-500/20"
          >
            {num}
          </button>
        ))}
      </div>

      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Fill the 4x4 Grid Logic</p>
    </div>
  );
};

export default SudokuLite;
