
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;

const TETROMINOS = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: 'cyan' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: 'blue' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: 'orange' },
  O: { shape: [[1, 1], [1, 1]], color: 'yellow' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: 'green' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: 'purple' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: 'red' },
};

const COLORS: Record<string, string> = {
  cyan: '#06b6d4',
  blue: '#3b82f6',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  purple: '#a855f7',
  red: '#ef4444',
};

const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS) as (keyof typeof TETROMINOS)[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[key], pos: { x: 3, y: 0 } };
};

const createGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const Tetris: React.FC<{ onGameOver: (score: number) => void; isPlaying: boolean; sfxVolume: number; hapticFeedback: boolean }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback }) => {
  const [grid, setGrid] = useState(createGrid());
  const [piece, setPiece] = useState(randomTetromino());
  const [nextPiece, setNextPiece] = useState(randomTetromino());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const scoreRef = useRef(0);

  const triggerHaptic = useCallback(() => {
    if (hapticFeedback && navigator.vibrate) navigator.vibrate(50);
  }, [hapticFeedback]);

  const checkCollision = (p = piece, g = grid, moveX = 0, moveY = 0) => {
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x] !== 0) {
          const newX = p.pos.x + x + moveX;
          const newY = p.pos.y + y + moveY;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && g[newY][newX] !== 0)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const rotate = (matrix: number[][]) => {
    const rotated = matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());
    return rotated;
  };

  const handleRotate = () => {
    const rotatedShape = rotate(piece.shape);
    const rotatedPiece = { ...piece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece)) {
      setPiece(rotatedPiece);
    }
  };

  const move = (dir: number) => {
    if (!checkCollision(piece, grid, dir, 0)) {
      setPiece(prev => ({ ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } }));
    }
  };

  const drop = useCallback(() => {
    if (checkCollision(piece, grid, 0, 1)) {
      // Lock piece
      const newGrid = grid.map(row => [...row]);
      piece.shape.forEach((row, y) => {
        row.forEach((val, x) => {
          if (val !== 0) {
            const gridY = piece.pos.y + y;
            const gridX = piece.pos.x + x;
            if (gridY >= 0) newGrid[gridY][gridX] = piece.color;
          }
        });
      });

      // Check lines
      let cleared = 0;
      const filteredGrid = newGrid.filter(row => {
        const isFull = row.every(cell => cell !== 0);
        if (isFull) cleared++;
        return !isFull;
      });

      while (filteredGrid.length < ROWS) {
        filteredGrid.unshift(Array(COLS).fill(0));
      }

      if (cleared > 0) {
        const linePoints = [0, 100, 300, 500, 800];
        const points = linePoints[cleared] * level;
        setScore(prev => prev + points);
        scoreRef.current += points;
        setLines(prev => {
          const newLines = prev + cleared;
          if (Math.floor(newLines / 10) > Math.floor(prev / 10)) {
            setLevel(l => l + 1);
          }
          return newLines;
        });
        triggerHaptic();
      }

      setGrid(filteredGrid);
      
      // New piece
      const next = nextPiece;
      if (checkCollision(next, filteredGrid)) {
        onGameOver(scoreRef.current);
        return;
      }
      setPiece(next);
      setNextPiece(randomTetromino());
    } else {
      setPiece(prev => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } }));
    }
  }, [piece, grid, nextPiece, level, onGameOver, triggerHaptic]);

  const hardDrop = () => {
    let offset = 0;
    while (!checkCollision(piece, grid, 0, offset + 1)) {
      offset++;
    }
    setPiece(prev => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + offset } }));
    // Immediately trigger drop logic to lock it
    setTimeout(drop, 0);
  };

  useEffect(() => {
    if (!isPlaying || isPaused) return;
    const speed = Math.max(100, 800 - (level - 1) * 100);
    gameLoopRef.current = setInterval(drop, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, isPaused, drop, level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') handleRotate();
      if (e.key === ' ') hardDrop();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, move, drop, handleRotate, hardDrop]);

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 p-4 max-w-4xl w-full animate-in fade-in zoom-in duration-500">
      {/* Main Game Board */}
      <div className="relative bg-slate-900 border-4 border-slate-800 rounded-2xl p-1 shadow-2xl overflow-hidden">
        <div className="grid grid-cols-10 gap-px bg-slate-800/50">
          {grid.map((row, y) => row.map((cell, x) => {
            // Check if piece is here
            let pieceColor = null;
            if (piece) {
              const px = x - piece.pos.x;
              const py = y - piece.pos.y;
              if (py >= 0 && py < piece.shape.length && px >= 0 && px < piece.shape[py].length) {
                if (piece.shape[py][px] !== 0) pieceColor = piece.color;
              }
            }
            
            const color = pieceColor || cell;
            return (
              <div 
                key={`${x}-${y}`} 
                className="w-6 h-6 md:w-8 md:h-8 rounded-sm transition-colors duration-100"
                style={{ 
                  backgroundColor: color ? COLORS[color] : 'transparent',
                  boxShadow: color ? `inset 0 0 10px rgba(255,255,255,0.3), 0 0 15px ${COLORS[color]}44` : 'none',
                  border: color ? `1px solid rgba(255,255,255,0.2)` : 'none'
                }}
              />
            );
          }))}
        </div>
        
        {isPaused && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-20">
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Paused</h2>
          </div>
        )}
      </div>

      {/* Sidebar Info */}
      <div className="flex flex-col gap-6 w-full md:w-64">
        <div className="glass-card p-6 rounded-3xl border-2 border-white/5 shadow-xl">
          <div className="mb-6">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Score</span>
            <span className="text-4xl font-black text-fuchsia-500 tabular-nums italic">{score.toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Level</span>
              <span className="text-2xl font-black text-white italic">{level}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Lines</span>
              <span className="text-2xl font-black text-white italic">{lines}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border-2 border-white/5 shadow-xl">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">Next Piece</span>
          <div className="bg-slate-900/50 p-4 rounded-2xl flex items-center justify-center min-h-[100px]">
            <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)` }}>
              {nextPiece.shape.map((row, y) => row.map((cell, x) => (
                <div 
                  key={`${x}-${y}`} 
                  className="w-5 h-5 rounded-sm"
                  style={{ 
                    backgroundColor: cell ? COLORS[nextPiece.color] : 'transparent',
                    boxShadow: cell ? `inset 0 0 5px rgba(255,255,255,0.3), 0 0 10px ${COLORS[nextPiece.color]}44` : 'none'
                  }}
                />
              )))}
            </div>
          </div>
        </div>

        {/* Controls Hint (Desktop) */}
        <div className="hidden md:block glass-card p-4 rounded-2xl border border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex justify-between mb-2"><span>Move</span><span>Arrows</span></div>
          <div className="flex justify-between mb-2"><span>Rotate</span><span>Up Arrow</span></div>
          <div className="flex justify-between mb-2"><span>Drop</span><span>Space</span></div>
        </div>

        {/* Mobile Controls */}
        <div className="grid grid-cols-3 gap-2 md:hidden w-full">
          <button onClick={() => move(-1)} className="h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xl"><i className="fas fa-arrow-left"></i></button>
          <button onClick={handleRotate} className="h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xl"><i className="fas fa-redo"></i></button>
          <button onClick={() => move(1)} className="h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xl"><i className="fas fa-arrow-right"></i></button>
          <button onClick={drop} className="h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xl"><i className="fas fa-arrow-down"></i></button>
          <button onClick={hardDrop} className="col-span-2 h-16 bg-fuchsia-600/20 border border-fuchsia-500/30 rounded-2xl flex items-center justify-center text-fuchsia-500 font-black uppercase italic tracking-tighter">HARD DROP</button>
        </div>

        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
        >
          {isPaused ? 'Resume Session' : 'Pause Session'}
        </button>
      </div>
    </div>
  );
};

export default Tetris;
