
import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

interface Point {
  x: number;
  y: number;
}

const NeonSnake: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const dirRef = useRef<Point>({ x: 0, y: -1 });
  
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
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
    const initialSnake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    setSnake(initialSnake);
    dirRef.current = { x: 0, y: -1 };
    setScore(0);
    setGameOver(false);
    setFood(generateFood(initialSnake));
    lastUpdateRef.current = performance.now();
  }, [generateFood]);

  useEffect(() => {
    if (isPlaying) {
      resetGame();
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isPlaying, resetGame]);

  const moveSnake = useCallback(() => {
    if (gameOver) return;

    setSnake(prev => {
      const head = prev[0];
      const newHead = { x: head.x + dirRef.current.x, y: head.y + dirRef.current.y };

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        setGameOver(true);
        setTimeout(() => onGameOver(score), 500);
        return prev;
      }

      if (prev.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setGameOver(true);
        setTimeout(() => onGameOver(score), 500);
        return prev;
      }

      const newSnake = [newHead, ...prev];

      if (newHead.x === food.x && newHead.y === food.y) {
        const newScore = score + 100;
        setScore(newScore);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, onGameOver, score, gameOver]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (Math.max(absX, absY) < 30) return;
    if (absX > absY) {
      if (deltaX > 0 && dirRef.current.x === 0) dirRef.current = { x: 1, y: 0 };
      else if (deltaX < 0 && dirRef.current.x === 0) dirRef.current = { x: -1, y: 0 };
    } else {
      if (deltaY > 0 && dirRef.current.y === 0) dirRef.current = { x: 0, y: 1 };
      else if (deltaY < 0 && dirRef.current.y === 0) dirRef.current = { x: 0, y: -1 };
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if ((key === 'ArrowUp' || key === 'w') && dirRef.current.y === 0) dirRef.current = { x: 0, y: -1 };
      else if ((key === 'ArrowDown' || key === 's') && dirRef.current.y === 0) dirRef.current = { x: 0, y: 1 };
      else if ((key === 'ArrowLeft' || key === 'a') && dirRef.current.x === 0) dirRef.current = { x: -1, y: 0 };
      else if ((key === 'ArrowRight' || key === 'd') && dirRef.current.x === 0) dirRef.current = { x: 1, y: 0 };
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const loop = (time: number) => {
      const speed = Math.max(70, INITIAL_SPEED - Math.floor(score / 500) * 5);
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
    <div className="relative flex flex-col items-center gap-6 w-full max-w-md px-4 py-8 select-none overflow-hidden rounded-[3rem]">
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-30 dark:opacity-50"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="absolute inset-0 bg-slate-50/70 dark:bg-[#0f172a]/80 backdrop-blur-md z-[1]" />

      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-emerald-500/20 border-2 shadow-lg backdrop-blur-xl bg-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Growth</span>
            <span className="text-2xl font-black text-emerald-500 italic">x{snake.length}</span>
          </div>
          <div className="text-right flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Energy</span>
            <span className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</span>
          </div>
        </div>

        <div 
          className="relative aspect-square w-full bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] border-4 border-slate-800 shadow-2xl overflow-hidden p-1 touch-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 bg-grid-white/[0.03]" />
          <div 
            className="grid w-full h-full" 
            style={{ 
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
              const x = i % GRID_SIZE;
              const y = Math.floor(i / GRID_SIZE);
              const isSnake = snake.some(s => s.x === x && s.y === y);
              const isHead = snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  className={`w-full h-full transition-all duration-150 ${
                    isHead ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)] z-10 scale-110 rounded-sm' :
                    isSnake ? 'bg-emerald-600/60 rounded-sm scale-95' :
                    isFood ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)] rounded-full scale-75' :
                    ''
                  }`}
                />
              );
            })}
          </div>
          {gameOver && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center animate-in zoom-in duration-300">
                 <i className="fas fa-skull text-rose-500 text-5xl mb-4"></i>
                 <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">Connection Lost</h3>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 md:hidden">
          <div />
          <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20 active:bg-emerald-500/10 active:scale-95 transition-all shadow-lg backdrop-blur-md bg-white/5" onPointerDown={(e) => { e.preventDefault(); if (dirRef.current.y === 0) dirRef.current = { x: 0, y: -1 }; }}><i className="fas fa-chevron-up"></i></button>
          <div />
          <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20 active:bg-emerald-500/10 active:scale-95 transition-all shadow-lg backdrop-blur-md bg-white/5" onPointerDown={(e) => { e.preventDefault(); if (dirRef.current.x === 0) dirRef.current = { x: -1, y: 0 }; }}><i className="fas fa-chevron-left"></i></button>
          <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20 active:bg-emerald-500/10 active:scale-95 transition-all shadow-lg backdrop-blur-md bg-white/5" onPointerDown={(e) => { e.preventDefault(); if (dirRef.current.y === 0) dirRef.current = { x: 0, y: 1 }; }}><i className="fas fa-chevron-down"></i></button>
          <button className="w-14 h-14 glass-card rounded-2xl flex items-center justify-center text-emerald-500 text-xl border-2 border-emerald-500/20 active:bg-emerald-500/10 active:scale-95 transition-all shadow-lg backdrop-blur-md bg-white/5" onPointerDown={(e) => { e.preventDefault(); if (dirRef.current.x === 0) dirRef.current = { x: 1, y: 0 }; }}><i className="fas fa-chevron-right"></i></button>
        </div>
        
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-100 dark:bg-white/5 px-6 py-2 rounded-full border border-slate-200 dark:border-white/5 shadow-sm backdrop-blur-md">
          <i className="fas fa-worm text-emerald-500"></i>
          <span>Swipe Board or Use Arrows to Navigate</span>
        </div>
      </div>
    </div>
  );
};

export default NeonSnake;
