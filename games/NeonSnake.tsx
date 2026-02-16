
import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

const NeonSnake: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [dir, setDir] = useState({ x: 0, y: -1 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const dirRef = useRef({ x: 0, y: -1 });

  const generateFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const hit = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!hit) break;
    }
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setDir({ x: 0, y: -1 });
    dirRef.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setFood(generateFood([{ x: 10, y: 10 }]));
  }, [generateFood]);

  useEffect(() => {
    if (isPlaying) resetGame();
  }, [isPlaying, resetGame]);

  const moveSnake = useCallback(() => {
    setSnake(prev => {
      const head = prev[0];
      const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        onGameOver(score);
        return prev;
      }

      // Self collision
      if (prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true);
        onGameOver(score);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      // Food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 100);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, onGameOver, score]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' && dirRef.current.y === 0) dirRef.current = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && dirRef.current.y === 0) dirRef.current = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && dirRef.current.x === 0) dirRef.current = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && dirRef.current.x === 0) dirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const loop = (time: number) => {
      const speed = Math.max(80, INITIAL_SPEED - Math.floor(score / 500) * 5);
      if (time - lastUpdateRef.current > speed) {
        moveSnake();
        lastUpdateRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, gameOver, moveSnake, score]);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-emerald-500/20 border-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase">Growth</span>
          <span className="text-2xl font-black text-emerald-500 italic">x{snake.length}</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase">Energy</span>
          <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
        </div>
      </div>

      <div className="relative aspect-square w-full bg-slate-900 rounded-[2rem] border-4 border-slate-800 shadow-2xl overflow-hidden p-1">
        <div className="absolute inset-0 bg-grid-white/[0.03]" />
        <div className="grid grid-cols-20 grid-rows-20 w-full h-full">
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            const isSnake = snake.some(s => s.x === x && s.y === y);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isFood = food.x === x && food.y === y;

            return (
              <div
                key={i}
                className={`w-full h-full rounded-sm transition-all duration-150 ${
                  isHead ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10 scale-110' :
                  isSnake ? 'bg-emerald-600/60' :
                  isFood ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)] rounded-full scale-75' :
                  ''
                }`}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20" onClick={() => dirRef.current.y === 0 && (dirRef.current = { x: 0, y: -1 })}><i className="fas fa-chevron-up"></i></button>
        <div />
        <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20" onClick={() => dirRef.current.x === 0 && (dirRef.current = { x: -1, y: 0 })}><i className="fas fa-chevron-left"></i></button>
        <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20" onClick={() => dirRef.current.y === 0 && (dirRef.current = { x: 0, y: 1 })}><i className="fas fa-chevron-down"></i></button>
        <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20" onClick={() => dirRef.current.x === 0 && (dirRef.current = { x: 1, y: 0 })}><i className="fas fa-chevron-right"></i></button>
      </div>
    </div>
  );
};

export default NeonSnake;
