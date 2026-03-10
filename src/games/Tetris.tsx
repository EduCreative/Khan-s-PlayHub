
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

const Tetris: React.FC<{ 
  onGameOver: (score: number) => void; 
  isPlaying: boolean; 
  sfxVolume: number; 
  hapticFeedback: boolean;
  onScoreUpdate?: (score: number) => void;
}> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback, onScoreUpdate }) => {
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

  const checkCollision = useCallback((p = piece, g = grid, moveX = 0, moveY = 0) => {
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
  }, [piece, grid]);

  const rotate = (matrix: number[][]) => {
    const rotated = matrix[0].map((_, index) => matrix.map(col => col[index]).reverse());
    return rotated;
  };

  const lockPiece = useCallback((p: typeof piece, g: typeof grid) => {
    const newGrid = g.map(row => [...row]);
    p.shape.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val !== 0) {
          const gridY = p.pos.y + y;
          const gridX = p.pos.x + x;
          if (gridY >= 0 && gridY < ROWS && gridX >= 0 && gridX < COLS) {
            newGrid[gridY][gridX] = p.color;
          }
        }
      });
    });

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
      const linePoints = [0, 40, 100, 300, 1200];
      const points = linePoints[cleared] * level;
      setScore(prev => {
        const next = prev + points;
        if (onScoreUpdate) onScoreUpdate(next);
        return next;
      });
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
    
    const next = nextPiece;
    if (checkCollision(next, filteredGrid)) {
      onGameOver(scoreRef.current);
      return;
    }
    setPiece(next);
    setNextPiece(randomTetromino());
  }, [grid, nextPiece, level, onGameOver, triggerHaptic, checkCollision]);

  const handleRotate = useCallback(() => {
    const rotatedShape = rotate(piece.shape);
    const rotatedPiece = { ...piece, shape: rotatedShape };
    if (!checkCollision(rotatedPiece)) {
      setPiece(rotatedPiece);
    }
  }, [piece, checkCollision]);

  const move = useCallback((dir: number) => {
    if (!checkCollision(piece, grid, dir, 0)) {
      setPiece(prev => ({ ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } }));
    }
  }, [piece, grid, checkCollision]);

  const getGhostPos = useCallback(() => {
    let ghostY = piece.pos.y;
    while (!checkCollision(piece, grid, 0, ghostY - piece.pos.y + 1)) {
      ghostY++;
    }
    return { ...piece.pos, y: ghostY };
  }, [piece, grid, checkCollision]);

  const drop = useCallback(() => {
    if (checkCollision(piece, grid, 0, 1)) {
      lockPiece(piece, grid);
    } else {
      setPiece(prev => ({ ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } }));
    }
  }, [piece, grid, checkCollision, lockPiece]);

  const hardDrop = useCallback(() => {
    let offset = 0;
    while (!checkCollision(piece, grid, 0, offset + 1)) {
      offset++;
    }
    const droppedPiece = { ...piece, pos: { ...piece.pos, y: piece.pos.y + offset } };
    lockPiece(droppedPiece, grid);
  }, [piece, grid, checkCollision, lockPiece]);

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
      
      const monitoredKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '];
      if (monitoredKeys.includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') handleRotate();
      if (e.key === ' ') hardDrop();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isPaused, move, drop, handleRotate, hardDrop]);

  const ghostPos = getGhostPos();

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-center justify-center gap-4 lg:gap-8 p-6 md:p-10 w-full max-w-4xl bg-white/5 backdrop-blur-md rounded-[3rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500 overflow-hidden">
      {/* Main Game Board */}
      <div className="relative bg-slate-950 border-2 lg:border-4 border-slate-800 rounded-xl lg:rounded-2xl p-0.5 lg:p-1 shadow-2xl overflow-hidden shrink-0">
        <div className="grid grid-cols-10 gap-px bg-slate-800/30">
          {grid.map((row, y) => row.map((cell, x) => {
            // Check if piece is here
            let pieceColor = null;
            let isGhost = false;
            
            if (piece) {
              const px = x - piece.pos.x;
              const py = y - piece.pos.y;
              if (py >= 0 && py < piece.shape.length && px >= 0 && px < piece.shape[py].length) {
                if (piece.shape[py][px] !== 0) pieceColor = piece.color;
              }
              
              // Check ghost piece
              if (!pieceColor) {
                const gpx = x - ghostPos.x;
                const gpy = y - ghostPos.y;
                if (gpy >= 0 && gpy < piece.shape.length && gpx >= 0 && gpx < piece.shape[gpy].length) {
                  if (piece.shape[gpy][gpx] !== 0) {
                    pieceColor = piece.color;
                    isGhost = true;
                  }
                }
              }
            }
            
            const color = pieceColor || cell;
            return (
              <div 
                key={`${x}-${y}`} 
                className="w-[min(7vw,3.2vh)] h-[min(7vw,3.2vh)] lg:w-8 lg:h-8 rounded-sm transition-colors duration-100"
                style={{ 
                  backgroundColor: color ? COLORS[color] : 'transparent',
                  opacity: isGhost ? 0.2 : 1,
                  boxShadow: color && !isGhost ? `inset 0 0 10px rgba(255,255,255,0.3), 0 0 15px ${COLORS[color]}44` : 'none',
                  border: color ? `1px solid ${isGhost ? COLORS[color] + '44' : 'rgba(255,255,255,0.2)'}` : 'none'
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
      <div className="flex flex-col gap-2 lg:gap-4 w-full lg:w-48 shrink-0">
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
          <div className="glass-card p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Level</span>
            <span className="text-sm lg:text-xl font-black text-white italic leading-none">{level}</span>
          </div>
          <div className="glass-card p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Lines</span>
            <span className="text-sm lg:text-xl font-black text-white italic leading-none">{lines}</span>
          </div>

          <div className="glass-card p-2 lg:p-4 rounded-xl lg:rounded-2xl border border-white/5 shadow-xl flex flex-col items-center justify-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Next</span>
            <div className="bg-slate-900/50 p-1 lg:p-2 rounded-lg flex items-center justify-center min-h-[40px] lg:min-h-[60px] w-full">
              <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${nextPiece.shape[0].length}, 1fr)` }}>
                {nextPiece.shape.map((row, y) => row.map((cell, x) => (
                  <div 
                    key={`${x}-${y}`} 
                    className="w-2 h-2 lg:w-4 lg:h-4 rounded-sm"
                    style={{ 
                      backgroundColor: cell ? COLORS[nextPiece.color] : 'transparent',
                      boxShadow: cell ? `inset 0 0 3px rgba(255,255,255,0.3), 0 0 5px ${COLORS[nextPiece.color]}44` : 'none'
                    }}
                  />
                )))}
              </div>
            </div>
          </div>
        </div>

        {/* Controls Hint (Desktop) */}
        <div className="hidden lg:block glass-card p-3 rounded-xl border border-white/5 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex justify-between mb-1"><span>Move</span><span>Arrows</span></div>
          <div className="flex justify-between mb-1"><span>Rotate</span><span>Up</span></div>
          <div className="flex justify-between mb-1"><span>Drop</span><span>Space</span></div>
        </div>

        {/* Mobile Controls */}
        <div className="grid grid-cols-5 gap-1 lg:hidden w-full">
          <button onPointerDown={() => move(-1)} className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-white text-sm active:bg-white/20 transition-colors"><i className="fas fa-arrow-left"></i></button>
          <button onPointerDown={handleRotate} className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-white text-sm active:bg-white/20 transition-colors"><i className="fas fa-redo"></i></button>
          <button onPointerDown={() => move(1)} className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-white text-sm active:bg-white/20 transition-colors"><i className="fas fa-arrow-right"></i></button>
          <button onPointerDown={drop} className="h-10 bg-white/5 rounded-lg flex items-center justify-center text-white text-sm active:bg-white/20 transition-colors"><i className="fas fa-arrow-down"></i></button>
          <button onPointerDown={hardDrop} className="h-10 bg-fuchsia-600/20 border border-fuchsia-500/30 rounded-lg flex items-center justify-center text-fuchsia-500 font-black uppercase italic tracking-tighter active:bg-fuchsia-600/40 transition-colors text-[10px]">DROP</button>
        </div>

        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="w-full py-2 lg:py-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-black uppercase text-[8px] lg:text-[10px] tracking-widest hover:bg-white/10 transition-all"
        >
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>
    </div>
  );
};

export default Tetris;
