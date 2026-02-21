
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

const COLS = 10;
const ROWS = 20;

interface Tetromino { shape: number[][]; color: string; type: string; }
interface ActivePiece extends Tetromino { pos: { x: number; y: number }; }

const TETROMINOS: Record<string, { shape: number[][]; color: string; type: string }> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#22d3ee', type: 'I' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#6366f1', type: 'J' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#f97316', type: 'L' },
  O: { shape: [[1, 1], [1, 1]], color: '#facc15', type: 'O' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#4ade80', type: 'S' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7', type: 'T' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#f43f5e', type: 'Z' }
};

const TetrisCell = memo(({ color, isFlashed }: { color: string | number, isFlashed: boolean }) => (
  <div 
    className={`w-full h-full border-[0.5px] border-white/5 transition-all duration-150 rounded-[2px] ${isFlashed ? 'bg-white' : ''}`}
    style={{ 
      backgroundColor: isFlashed ? '#fff' : (color !== 0 ? color as string : 'transparent'),
    }}
  />
));

const Tetris: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<(string | number)[][]>(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
  const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino>(TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [clearFlash, setClearFlash] = useState<number[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);
  const scoreRef = useRef(0);

  const checkCollision = (piece: ActivePiece, moveX: number, moveY: number, customShape?: number[][]) => {
    const shape = customShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const nx = piece.pos.x + x + moveX;
          const ny = piece.pos.y + y + moveY;
          if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && grid[ny][nx] !== 0)) return true;
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    const rotated = matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());
    return rotated;
  };

  const clearLines = useCallback((currentGrid: (string | number)[][]) => {
    let linesCleared = 0;
    const newGrid = currentGrid.filter(row => {
      const isFull = row.every(cell => cell !== 0);
      if (isFull) linesCleared++;
      return !isFull;
    });

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level;
      scoreRef.current += points;
      setScore(scoreRef.current);
      setLevel(Math.floor(scoreRef.current / 2000) + 1);
      
      while (newGrid.length < ROWS) {
        newGrid.unshift(Array(COLS).fill(0));
      }
      return newGrid;
    }
    return currentGrid;
  }, [level]);

  const drop = useCallback(() => {
    if (!activePiece) return;
    if (!checkCollision(activePiece, 0, 1)) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } } : null);
    } else {
      // Landed
      if (activePiece.pos.y <= 0) {
        onGameOver(scoreRef.current);
        return;
      }

      const newGrid = grid.map(row => [...row]);
      activePiece.shape.forEach((row, y) => row.forEach((v, x) => {
        if (v !== 0) {
          const ny = activePiece.pos.y + y;
          const nx = activePiece.pos.x + x;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            newGrid[ny][nx] = activePiece.color;
          }
        }
      }));

      const clearedGrid = clearLines(newGrid);
      setGrid(clearedGrid);
      
      const newActive = { ...nextPiece, pos: { x: 3, y: 0 } };
      if (checkCollision(newActive, 0, 0)) {
        onGameOver(scoreRef.current);
      } else {
        setActivePiece(newActive);
        setNextPiece(TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]]);
      }
    }
  }, [activePiece, grid, nextPiece, onGameOver, clearLines]);

  const move = useCallback((dir: number) => {
    if (!activePiece) return;
    if (!checkCollision(activePiece, dir, 0)) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } } : null);
    }
  }, [activePiece]);

  const rotatePiece = useCallback(() => {
    if (!activePiece) return;
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(activePiece, 0, 0, rotatedShape)) {
      setActivePiece(prev => prev ? { ...prev, shape: rotatedShape } : null);
    }
  }, [activePiece]);

  useEffect(() => {
    if (!isPlaying) return;
    setGrid(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setScore(0);
    scoreRef.current = 0;
    setLevel(1);
    const first = TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]];
    setActivePiece({ ...first, pos: { x: 3, y: 0 } });
    setNextPiece(TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]]);
  }, [isPlaying]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying || !activePiece) return;
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') rotatePiece();
      if (e.key === ' ') {
        let currentY = 0;
        while (!checkCollision(activePiece, 0, currentY + 1)) {
          currentY++;
        }
        setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + currentY } } : null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying, activePiece, move, drop, rotatePiece]);

  useEffect(() => {
    if (!isPlaying || !activePiece) return;
    const loop = (time: number) => {
      const speed = Math.max(100, 800 - (level * 50));
      if (time - lastUpdateRef.current > speed) { 
        drop(); 
        lastUpdateRef.current = time; 
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, level, activePiece, drop]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full">
      <div className="glass-card p-4 rounded-2xl">
        <p className="text-[10px] font-black uppercase text-cyan-400">Score</p>
        <span className="text-3xl font-black text-white italic">{score.toLocaleString()}</span>
      </div>
      <div className="relative aspect-[1/2] h-[75vh] bg-slate-950 rounded-2xl border-4 border-white/10 overflow-hidden p-1">
        <div className="grid grid-cols-10 grid-rows-20 h-full w-full gap-[1px]">
          {grid.map((row, y) => row.map((cell, x) => {
            let color = cell;
            if (activePiece) {
              const py = y - activePiece.pos.y, px = x - activePiece.pos.x;
              if (py >= 0 && py < activePiece.shape.length && px >= 0 && px < activePiece.shape[0].length && activePiece.shape[py][px]) color = activePiece.color;
            }
            return <TetrisCell key={`${x}-${y}`} color={color} isFlashed={clearFlash.includes(y)} />;
          }))}
        </div>
      </div>
    </div>
  );
};

export default Tetris;
