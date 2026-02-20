
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';

const COLS = 10;
const ROWS = 20;

interface Tetromino { shape: number[][]; color: string; type: string; }
interface ActivePiece extends Tetromino { pos: { x: number; y: number }; }

const TETROMINOS: Record<string, { shape: number[][]; color: string }> = {
  I: { shape: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], color: '#22d3ee' },
  J: { shape: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], color: '#6366f1' },
  L: { shape: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], color: '#f97316' },
  O: { shape: [[1, 1], [1, 1]], color: '#facc15' },
  S: { shape: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], color: '#4ade80' },
  T: { shape: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], color: '#a855f7' },
  Z: { shape: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], color: '#f43f5e' }
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
  const [nextPiece, setNextPiece] = useState<Tetromino>({ ...TETROMINOS['T'], type: 'T' });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [clearFlash, setClearFlash] = useState<number[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

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

  const lockPiece = useCallback((pieceToLock: ActivePiece) => {
    let newGrid = grid.map(row => [...row]);
    let isGameOver = false;

    pieceToLock.shape.forEach((row, y) => row.forEach((v, x) => {
      if (v !== 0) {
        if (pieceToLock.pos.y + y < 0) {
          isGameOver = true;
        } else {
          newGrid[pieceToLock.pos.y + y][pieceToLock.pos.x + x] = pieceToLock.color;
        }
      }
    }));

    if (isGameOver) {
      onGameOver(score);
      return;
    }

    let linesCleared = 0;
    const finalGrid = newGrid.filter(row => {
      const isLineFull = row.every(cell => cell !== 0);
      if (isLineFull) linesCleared++;
      return !isLineFull;
    });

    while (finalGrid.length < ROWS) {
      finalGrid.unshift(Array(COLS).fill(0));
    }

    if (linesCleared > 0) {
      const points = [0, 100, 300, 500, 800][linesCleared] * level;
      setScore(s => s + points);
      setLevel(Math.floor((score + points) / 1000) + 1);
    }

    setGrid(finalGrid);

    const newActivePiece = { ...nextPiece, pos: { x: 3, y: 0 } };
    let spawnCollision = false;
    for (let y = 0; y < newActivePiece.shape.length; y++) {
      for (let x = 0; x < newActivePiece.shape[y].length; x++) {
        if (newActivePiece.shape[y][x] !== 0) {
          const nx = newActivePiece.pos.x + x;
          const ny = newActivePiece.pos.y + y;
          if (ny >= 0 && finalGrid[ny][nx] !== 0) spawnCollision = true;
        }
      }
    }

    if (spawnCollision) {
      onGameOver(score);
      return;
    }

    setActivePiece(newActivePiece);
    setNextPiece({ ...TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]], type: '?' });
  }, [grid, nextPiece, score, level, onGameOver]);

  const drop = useCallback(() => {
    if (!activePiece) return;
    if (!checkCollision(activePiece, 0, 1)) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } } : null);
    } else {
      lockPiece(activePiece);
    }
  }, [activePiece, checkCollision, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!activePiece) return;
    let newY = activePiece.pos.y;
    while (!checkCollision(activePiece, 0, newY - activePiece.pos.y + 1)) {
      newY++;
    }
    lockPiece({ ...activePiece, pos: { ...activePiece.pos, y: newY } });
  }, [activePiece, checkCollision, lockPiece]);

  const move = useCallback((dir: number) => {
    if (!activePiece) return;
    if (!checkCollision(activePiece, dir, 0)) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, x: prev.pos.x + dir } } : null);
    }
  }, [activePiece, grid]);

  const rotate = useCallback(() => {
    if (!activePiece) return;
    const rotatedShape = activePiece.shape[0].map((_, index) =>
      activePiece.shape.map(row => row[index]).reverse()
    );
    if (!checkCollision(activePiece, 0, 0, rotatedShape)) {
      setActivePiece(prev => prev ? { ...prev, shape: rotatedShape } : null);
    }
  }, [activePiece, grid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (e.key) {
        case 'ArrowLeft': move(-1); break;
        case 'ArrowRight': move(1); break;
        case 'ArrowDown': drop(); break;
        case 'ArrowUp': rotate(); break;
        case ' ': hardDrop(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, move, drop, rotate, hardDrop]);

  useEffect(() => {
    if (!isPlaying) return;
    setActivePiece({ ...TETROMINOS['I'], pos: { x: 3, y: 0 }, type: 'I' });
    setNextPiece({ ...TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]], type: '?' });
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !activePiece) return;
    const loop = (time: number) => {
      if (time - lastUpdateRef.current > (800 - (level * 50))) { drop(); lastUpdateRef.current = time; }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isPlaying, level, activePiece, drop]);

  return (
    <div className="flex flex-col items-center justify-between h-full w-full max-w-lg mx-auto px-1 pb-2 pt-1">
      
      {/* Top Section: Score, Play Area, Next */}
      <div className="flex-1 flex flex-row items-stretch justify-center gap-2 md:gap-6 w-full min-h-0">
        
        {/* Left: Score */}
        <div className="flex flex-col items-end justify-start pt-4 w-16 md:w-24">
          <p className="text-[10px] font-black uppercase text-cyan-400">Score</p>
          <span className="text-xl md:text-2xl font-black text-white italic leading-none">{score.toLocaleString()}</span>
        </div>

        {/* Center: Play Area */}
        <div className="relative h-full aspect-[1/2] bg-slate-950 rounded-xl border-4 border-white/10 overflow-hidden p-1">
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

        {/* Right: Next */}
        <div className="flex flex-col items-start justify-start pt-4 w-16 md:w-24">
          <p className="text-[10px] font-black uppercase text-cyan-400 mb-1">Next</p>
          <div className="grid grid-cols-4 grid-rows-4 gap-[1px] w-12 h-12 bg-slate-950/50 p-1 rounded border border-white/5">
            {Array.from({ length: 4 }).map((_, y) => 
              Array.from({ length: 4 }).map((_, x) => {
                const shapeSize = nextPiece.shape.length;
                const offsetY = Math.floor((4 - shapeSize) / 2);
                const offsetX = Math.floor((4 - nextPiece.shape[0].length) / 2);
                const py = y - offsetY;
                const px = x - offsetX;
                const isFilled = py >= 0 && py < shapeSize && px >= 0 && px < nextPiece.shape[0].length && nextPiece.shape[py][px];
                
                return (
                  <div 
                    key={`${x}-${y}`} 
                    className="w-full h-full rounded-[2px]"
                    style={{ backgroundColor: isFilled ? nextPiece.color : 'transparent' }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-[260px] flex flex-col gap-1 mt-2 px-2">
        <div className="grid grid-cols-3 gap-1">
          <button onClick={() => move(-1)} className="glass-card py-3 rounded-lg flex items-center justify-center active:bg-white/20 text-lg"><i className="fas fa-arrow-left"></i></button>
          <button onClick={rotate} className="glass-card py-3 rounded-lg flex items-center justify-center active:bg-white/20 text-lg"><i className="fas fa-rotate-right"></i></button>
          <button onClick={() => move(1)} className="glass-card py-3 rounded-lg flex items-center justify-center active:bg-white/20 text-lg"><i className="fas fa-arrow-right"></i></button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <button onClick={drop} className="glass-card py-3 rounded-lg flex items-center justify-center active:bg-white/20 text-lg"><i className="fas fa-arrow-down"></i></button>
          <button onClick={hardDrop} className="glass-card py-3 rounded-lg flex items-center justify-center active:bg-white/20 text-xs font-black uppercase tracking-widest">Hard Drop</button>
        </div>
      </div>
    </div>
  );
};

export default Tetris;
