
import React, { useState, useEffect, useRef } from 'react';

const Labyrinth: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 1, y: 1 });
  const mazeRef = useRef<number[][]>([]);
  const cellSize = 25;
  const cols = 15;
  const rows = 15;

  const generateMaze = (width: number, height: number) => {
    const maze = Array(height).fill(null).map(() => Array(width).fill(1));
    const stack: [number, number][] = [];

    const carve = (x: number, y: number) => {
      maze[y][x] = 0;
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);
      
      for (const [dx, dy] of dirs) {
        const nx = x + dx * 2, ny = y + dy * 2;
        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
          maze[y + dy][x + dx] = 0;
          carve(nx, ny);
        }
      }
    };

    carve(1, 1);
    maze[height - 2][width - 2] = 2; // Goal
    return maze;
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    mazeRef.current.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          ctx.strokeStyle = 'rgba(255,255,255,0.05)';
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        } else if (cell === 2) {
          ctx.fillStyle = '#10b981';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#10b981';
          ctx.fillRect(x * cellSize + 5, y * cellSize + 5, cellSize - 10, cellSize - 10);
          ctx.shadowBlur = 0;
        }
      });
    });

    // Player
    ctx.fillStyle = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      playerRef.current.x * cellSize + cellSize / 2,
      playerRef.current.y * cellSize + cellSize / 2,
      cellSize / 3,
      0, Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (isPlaying) {
      mazeRef.current = generateMaze(cols, rows);
      playerRef.current = { x: 1, y: 1 };
      draw();
    }
  }, [isPlaying, level]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      let { x, y } = playerRef.current;
      if (e.key === 'ArrowUp') y--;
      if (e.key === 'ArrowDown') y++;
      if (e.key === 'ArrowLeft') x--;
      if (e.key === 'ArrowRight') x++;

      if (mazeRef.current[y]?.[x] === 0 || mazeRef.current[y]?.[x] === 2) {
        playerRef.current = { x, y };
        if (mazeRef.current[y][x] === 2) {
          setScore(s => s + 1000);
          setLevel(l => l + 1);
        }
        draw();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying]);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-orange-500/20">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black">Maze Lvl</p>
          <p className="text-2xl font-black text-orange-400 tabular-nums">{level}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-black">XP Gained</p>
          <p className="text-2xl font-black text-indigo-400 tabular-nums">{score}</p>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={cols * cellSize} 
        height={rows * cellSize} 
        className="rounded-2xl border-4 border-white/10 shadow-2xl bg-slate-900"
      />
      <div className="grid grid-cols-3 gap-2 md:hidden">
         <div /> 
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-white" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowUp'}))}><i className="fas fa-chevron-up"></i></button>
         <div />
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-white" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowLeft'}))}><i className="fas fa-chevron-left"></i></button>
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-white" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowDown'}))}><i className="fas fa-chevron-down"></i></button>
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-white" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', {key:'ArrowRight'}))}><i className="fas fa-chevron-right"></i></button>
      </div>
      <p className="text-slate-500 text-xs">Reach the green portal to escape!</p>
    </div>
  );
};

export default Labyrinth;
