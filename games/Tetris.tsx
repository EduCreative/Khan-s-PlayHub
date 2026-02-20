
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

  const drop = useCallback(() => {
    if (!activePiece) return;
    if (!checkCollision(activePiece, 0, 1)) {
      setActivePiece(prev => prev ? { ...prev, pos: { ...prev.pos, y: prev.pos.y + 1 } } : null);
    } else {
      const newGrid = grid.map(row => [...row]);
      activePiece.shape.forEach((row, y) => row.forEach((v, x) => {
        if (v !== 0 && activePiece.pos.y + y >= 0) newGrid[activePiece.pos.y + y][activePiece.pos.x + x] = activePiece.color;
      }));
      setGrid(newGrid);
      setActivePiece({ ...nextPiece, pos: { x: 3, y: 0 } });
      setNextPiece({ ...TETROMINOS[Object.keys(TETROMINOS)[Math.floor(Math.random() * 7)]], type: '?' });
    }
  }, [activePiece, grid, nextPiece]);

  useEffect(() => {
    if (!isPlaying) return;
    setActivePiece({ ...TETROMINOS['I'], pos: { x: 3, y: 0 }, type: 'I' });
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
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full">
      <div className="glass-card p-6 rounded-2xl flex flex-col gap-6 min-w-[120px]">
        <div>
          <p className="text-[10px] font-black uppercase text-cyan-400">Score</p>
          <span className="text-3xl font-black text-white italic">{score.toLocaleString()}</span>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase text-cyan-400 mb-2">Next</p>
          <div className="grid grid-cols-4 grid-rows-4 gap-[1px] w-20 h-20 bg-slate-950/50 p-1 rounded-lg border border-white/5">
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
