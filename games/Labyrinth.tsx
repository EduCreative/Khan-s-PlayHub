
import React, { useState, useEffect, useRef, useCallback } from 'react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const Labyrinth: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef({ x: 1, y: 1 });
  const mazeRef = useRef<number[][]>([]);
  
  const getGridSize = (diff: Difficulty) => {
    switch (diff) {
      case 'Easy': return 11;
      case 'Medium': return 17;
      case 'Hard': return 25;
      default: return 15;
    }
  };

  const cellSize = difficulty === 'Hard' ? 14 : difficulty === 'Medium' ? 20 : 25;

  const generateMaze = useCallback((width: number, height: number) => {
    const maze = Array(height).fill(null).map(() => Array(width).fill(1));
    
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
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !difficulty) return;
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
  }, [cellSize, difficulty]);

  useEffect(() => {
    if (isPlaying) {
      if (!difficulty) {
        setDifficulty(null);
      } else {
        const size = getGridSize(difficulty);
        mazeRef.current = generateMaze(size, size);
        playerRef.current = { x: 1, y: 1 };
        draw();
      }
    }
  }, [isPlaying, level, difficulty, generateMaze, draw]);

  const movePlayer = (dx: number, dy: number) => {
    if (!isPlaying || !difficulty) return;
    const { x, y } = playerRef.current;
    const nx = x + dx;
    const ny = y + dy;

    if (mazeRef.current[ny]?.[nx] === 0 || mazeRef.current[ny]?.[nx] === 2) {
      playerRef.current = { x: nx, y: ny };
      if (mazeRef.current[ny][nx] === 2) {
        const diffMult = difficulty === 'Easy' ? 1000 : difficulty === 'Medium' ? 2500 : 5000;
        setScore(s => s + diffMult);
        setLevel(l => l + 1);
      }
      draw();
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') movePlayer(0, -1);
      if (e.key === 'ArrowDown') movePlayer(0, 1);
      if (e.key === 'ArrowLeft') movePlayer(-1, 0);
      if (e.key === 'ArrowRight') movePlayer(1, 0);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [difficulty]);

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-route text-5xl text-orange-500 mb-4"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Maze Sector</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Define your traversal density.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button
              key={level}
              onClick={() => setDifficulty(level)}
              className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-orange-500/10 hover:border-orange-500 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Open Corridors' : level === 'Medium' ? 'Complex Junctions' : 'Deep Labyrinth'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-orange-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
              <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const size = getGridSize(difficulty);

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-orange-500/20 shadow-xl border-2 transition-colors">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black">Lvl {level}</p>
          <p className="text-2xl font-black text-orange-500 tabular-nums transition-colors uppercase italic">{difficulty}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-black">XP Gained</p>
          <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums transition-colors">{score.toLocaleString()}</p>
        </div>
      </div>
      <canvas 
        ref={canvasRef} 
        width={size * cellSize} 
        height={size * cellSize} 
        className="rounded-2xl border-4 border-slate-200 dark:border-white/10 shadow-2xl bg-slate-900 transition-colors"
      />
      <div className="grid grid-cols-3 gap-2 md:hidden">
         <div /> 
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center dark:text-white text-slate-900 border-2 border-orange-500/20" onClick={() => movePlayer(0, -1)}><i className="fas fa-chevron-up"></i></button>
         <div />
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center dark:text-white text-slate-900 border-2 border-orange-500/20" onClick={() => movePlayer(-1, 0)}><i className="fas fa-chevron-left"></i></button>
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center dark:text-white text-slate-900 border-2 border-orange-500/20" onClick={() => movePlayer(0, 1)}><i className="fas fa-chevron-down"></i></button>
         <button className="w-12 h-12 glass-card rounded-xl flex items-center justify-center dark:text-white text-slate-900 border-2 border-orange-500/20" onClick={() => movePlayer(1, 0)}><i className="fas fa-chevron-right"></i></button>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest bg-orange-500/5 px-6 py-2 rounded-full border border-orange-500/10">Reach the green portal to escape!</p>
    </div>
  );
};

export default Labyrinth;
