
import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLS = 10;
const ROWS = 20;

interface Tetromino {
  shape: number[][];
  color: string;
  type: string;
}

interface ActivePiece extends Tetromino {
  pos: { x: number; y: number };
}

const TETROMINOS: Record<string, { shape: number[][]; color: string }> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#22d3ee' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#6366f1' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: '#facc15' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#4ade80' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#f43f5e' }
};

const RANDOM_TETROMINO = (): Tetromino => {
  const keys = Object.keys(TETROMINOS);
  const type = keys[Math.floor(Math.random() * keys.length)];
  return { ...TETROMINOS[type], type };
};

const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const Tetris: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [grid, setGrid] = useState<(string | number)[][]>(createEmptyGrid());
  const [activePiece, setActivePiece] = useState<ActivePiece | null>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino>(RANDOM_TETROMINO());
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [clearFlash, setClearFlash] = useState<number[]>([]);
  const [impactShake, setImpactShake] = useState(false);
  
  const scoreRef = useRef(0);
  const linesRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const resetGame = useCallback(() => {
    setGrid(createEmptyGrid());
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    scoreRef.current = 0;
    linesRef.current = 0;
    const initialPiece = RANDOM_TETROMINO();
    setActivePiece({ ...initialPiece, pos: { x: 3, y: 0 } });
    setNextPiece(RANDOM_TETROMINO());
  }, []);

  useEffect(() => {
    if (isPlaying) {
      resetGame();
    }
  }, [isPlaying, resetGame]);

  const checkCollision = (piece: ActivePiece, newGrid: (string | number)[][], moveX: number, moveY: number, customShape?: number[][]) => {
    const shape = customShape || piece.shape;
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x] !== 0) {
          const nextX = piece.pos.x + x + moveX;
          const nextY = piece.pos.y + y + moveY;
          if (
            nextX < 0 ||
            nextX >= COLS ||
            nextY >= ROWS ||
            (nextY >= 0 && newGrid[nextY] && newGrid[nextY][nextX] !== 0)
          ) {
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
    if (!activePiece || isGameOver) return;
    const rotatedShape = rotate(activePiece.shape);
    if (!checkCollision(activePiece, grid, 0, 0, rotatedShape)) {
      setActivePiece({ ...activePiece, shape: rotatedShape });
    }
  };

  const handleMove = (dir: number) => {
    if (!activePiece || isGameOver) return;
    if (!checkCollision(activePiece, grid, dir, 0)) {
      setActivePiece({ ...activePiece, pos: { ...activePiece.pos, x: activePiece.pos.x + dir } });
    }
  };

  const drop = useCallback(() => {
    if (!activePiece || isGameOver) return;
    if (!checkCollision(activePiece, grid, 0, 1)) {
      setActivePiece((prev: ActivePiece | null) => {
        if (!prev) return null;
        return { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } };
      });
    } else {
      setImpactShake(true);
      setTimeout(() => setImpactShake(false), 100);

      if (activePiece.pos.y <= 0) {
        setIsGameOver(true);
        onGameOver(scoreRef.current);
        return;
      }

      const newGrid = grid.map(row => [...row]);
      activePiece.shape.forEach((row: number[], y: number) => {
        row.forEach((value: number, x: number) => {
          if (value !== 0) {
            const gridY = activePiece.pos.y + y;
            const gridX = activePiece.pos.x + x;
            if (gridY >= 0 && gridY < ROWS && newGrid[gridY]) {
              newGrid[gridY][gridX] = activePiece.color;
            }
          }
        });
      });

      let clearedLines: number[] = [];
      newGrid.forEach((row, idx) => {
        if (row.every(cell => cell !== 0)) {
          clearedLines.push(idx);
        }
      });

      if (clearedLines.length > 0) {
        setClearFlash(clearedLines);
        setTimeout(() => {
          setClearFlash([]);
          const filteredGrid = newGrid.filter((_, idx) => !clearedLines.includes(idx));
          while (filteredGrid.length < ROWS) {
            filteredGrid.unshift(Array(COLS).fill(0));
          }
          linesRef.current += clearedLines.length;
          setLines(linesRef.current);
          const points = [0, 100, 300, 500, 800][clearedLines.length] * level;
          scoreRef.current += points;
          setScore(scoreRef.current);
          setLevel(Math.floor(linesRef.current / 10) + 1);
          setGrid(filteredGrid);
        }, 200);
      } else {
        setGrid(newGrid);
      }

      setActivePiece({ ...nextPiece, pos: { x: 3, y: 0 } });
      setNextPiece(RANDOM_TETROMINO());
    }
  }, [activePiece, grid, isGameOver, level, nextPiece, onGameOver]);

  useEffect(() => {
    if (!isPlaying || isGameOver || !activePiece) return;

    const gameLoop = (time: number) => {
      const dropSpeed = Math.max(100, 800 - (level - 1) * 100);
      if (time - lastUpdateRef.current > dropSpeed) {
        drop();
        lastUpdateRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, isGameOver, activePiece, level, drop]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handleMove(-1);
      if (e.key === 'ArrowRight') handleMove(1);
      if (e.key === 'ArrowDown') drop();
      if (e.key === 'ArrowUp') handleRotate();
      if (e.key === ' ') { e.preventDefault(); drop(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleMove, drop, handleRotate]);

  return (
    <div className={`flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12 w-full max-w-6xl px-4 select-none animate-in fade-in duration-700 h-full transition-transform ${impactShake ? 'animate-glitch' : ''}`}>
      
      {/* Left Panel: Holographic Stats */}
      <div className="flex flex-col gap-4 w-full md:w-48 stagger-item">
        <div className="glass-card p-5 rounded-[2rem] border-cyan-500/30 shadow-xl backdrop-blur-xl bg-slate-900/20 text-left border-l-4">
          <p className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-1">Synapse Link</p>
          <span className="text-3xl font-black text-white tabular-nums italic">{score.toLocaleString()}</span>
        </div>
        <div className="glass-card p-5 rounded-[2rem] border-indigo-500/30 shadow-xl backdrop-blur-xl bg-slate-900/20 text-left border-l-4">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Current Tier</p>
          <span className="text-3xl font-black text-white italic">{level}</span>
        </div>
        <div className="glass-card p-5 rounded-[2rem] border-purple-500/30 shadow-xl backdrop-blur-xl bg-slate-900/20 text-left border-l-4">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-[0.2em] mb-1">Lines Voided</p>
          <span className="text-3xl font-black text-white tabular-nums italic">{lines}</span>
        </div>
      </div>

      {/* Center: The Large Arena */}
      <div className="relative flex items-center justify-center h-[75vh] md:h-[80vh] aspect-[1/2] group">
        <div className="absolute -inset-4 bg-cyan-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div 
          className="relative h-full w-full bg-slate-950/40 backdrop-blur-2xl rounded-[2.5rem] border-[4px] border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(255,255,255,0.02)] overflow-hidden p-2 transition-all"
        >
          {/* Cyber Background Overlay */}
          <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-cyan-500/5 pointer-events-none" />
          <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/20 animate-pulse" />
          
          <div className="grid grid-cols-10 grid-rows-20 h-full w-full gap-0.5">
            {grid.map((row, y) => row.map((cell, x) => {
              const isFlashed = clearFlash.includes(y);
              let color = cell;
              if (activePiece) {
                const pieceY = y - activePiece.pos.y;
                const pieceX = x - activePiece.pos.x;
                if (
                  pieceY >= 0 && pieceY < activePiece.shape.length &&
                  pieceX >= 0 && pieceX < activePiece.shape[0].length &&
                  activePiece.shape[pieceY][pieceX] !== 0
                ) {
                  color = activePiece.color;
                }
              }
              return (
                <div 
                  key={`${x}-${y}`} 
                  className={`w-full h-full border-[0.5px] border-white/5 transition-all duration-150 rounded-[4px] ${isFlashed ? 'bg-white shadow-[0_0_20px_white] z-10' : ''}`}
                  style={{ 
                    backgroundColor: isFlashed ? '#fff' : (color !== 0 ? color as string : 'transparent'),
                    boxShadow: color !== 0 && !isFlashed ? `inset 0 0 10px rgba(255,255,255,0.4), 0 0 15px ${color}88` : undefined,
                  }}
                />
              );
            }))}
          </div>

          {isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center z-50 rounded-[2rem] animate-in zoom-in duration-500">
               <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mb-4 border border-rose-500/40">
                  <i className="fas fa-microchip text-rose-500 text-3xl animate-pulse"></i>
               </div>
               <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter text-center">CORE<br/>OVERFLOW</h3>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Next Piece and Mobile Controls */}
      <div className="flex flex-col gap-6 w-full md:w-48 stagger-item">
        <div className="glass-card p-6 rounded-[2rem] border-amber-500/30 shadow-xl backdrop-blur-xl bg-slate-900/20 text-center flex flex-col items-center border-r-4">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3">Incoming</p>
          <div className="w-20 h-20 bg-black/40 rounded-2xl flex items-center justify-center border border-white/10 p-2">
             <div className="grid grid-cols-4 grid-rows-4 gap-1">
               {nextPiece.shape.map((row: number[], y: number) => row.map((cell: number, x: number) => (
                 <div key={`${x}-${y}`} className={`w-3 h-3 rounded-sm transition-all duration-500 ${cell ? 'scale-100 opacity-100 shadow-[0_0_10px_white]' : 'scale-0 opacity-0'}`} style={{ backgroundColor: nextPiece.color }} />
               )))}
             </div>
          </div>
        </div>

        {/* Mobile Control Pad */}
        <div className="grid grid-cols-3 gap-3 md:hidden">
          <div />
          <button onPointerDown={(e) => { e.preventDefault(); handleRotate(); }} className="h-14 glass-card rounded-2xl flex items-center justify-center text-cyan-400 border-2 border-cyan-400/20 bg-cyan-400/5"><i className="fas fa-rotate"></i></button>
          <div />
          <button onPointerDown={(e) => { e.preventDefault(); handleMove(-1); }} className="h-14 glass-card rounded-2xl flex items-center justify-center text-cyan-400 border-2 border-cyan-400/20 bg-cyan-400/5"><i className="fas fa-arrow-left"></i></button>
          <button onPointerDown={(e) => { e.preventDefault(); drop(); }} className="h-14 glass-card rounded-2xl flex items-center justify-center text-cyan-400 border-2 border-cyan-400/20 bg-cyan-400/5"><i className="fas fa-arrow-down"></i></button>
          <button onPointerDown={(e) => { e.preventDefault(); handleMove(1); }} className="h-14 glass-card rounded-2xl flex items-center justify-center text-cyan-400 border-2 border-cyan-400/20 bg-cyan-400/5"><i className="fas fa-arrow-right"></i></button>
        </div>

        <div className="hidden md:flex flex-col gap-2 p-4 rounded-3xl bg-white/5 border border-white/10 opacity-40">
           <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Rotation</span>
              <kbd className="bg-slate-800 px-1.5 rounded">↑</kbd>
           </div>
           <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Movement</span>
              <kbd className="bg-slate-800 px-1.5 rounded">← →</kbd>
           </div>
           <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Drop</span>
              <kbd className="bg-slate-800 px-1.5 rounded">↓</kbd>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Tetris;
