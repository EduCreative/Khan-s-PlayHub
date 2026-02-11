
import React, { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const BUBBLE_RADIUS = 18;
const WIDTH = 400;
const HEIGHT = 500;
const ROW_HEIGHT = BUBBLE_RADIUS * 1.7;

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Bubble {
  x: number;
  y: number;
  row: number;
  col: number;
  color: string;
  id: string;
}

interface FallingBubble extends Bubble {
  vy: number;
  vx: number;
  opacity: number;
}

const BubbleFury: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [fallingBubbles, setFallingBubbles] = useState<FallingBubble[]>([]);
  const [nextColor, setNextColor] = useState(COLORS[0]);
  const [score, setScore] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [shotBubble, setShotBubble] = useState<{ x: number; y: number; color: string } | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const fallingLoopRef = useRef<number | null>(null);
  const rowIntervalRef = useRef<number | null>(null);

  const getBubbleCoords = (row: number, col: number) => {
    const isOdd = row % 2 !== 0;
    const x = col * (BUBBLE_RADIUS * 2) + BUBBLE_RADIUS + (isOdd ? BUBBLE_RADIUS : 0);
    const y = row * ROW_HEIGHT + BUBBLE_RADIUS + 20;
    return { x, y };
  };

  const initGrid = useCallback((diff: Difficulty) => {
    const initial: Bubble[] = [];
    const startingRows = diff === 'Easy' ? 4 : diff === 'Medium' ? 6 : 8;
    for (let r = 0; r < startingRows; r++) {
      const colsInRow = r % 2 === 0 ? 10 : 9;
      for (let c = 0; c < colsInRow; c++) {
        const { x, y } = getBubbleCoords(r, c);
        initial.push({
          x, y, row: r, col: c,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          id: `${r}-${c}-${Math.random()}`
        });
      }
    }
    setBubbles(initial);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setFallingBubbles([]);
    setDifficulty(diff);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setBubbles([]);
      setScore(0);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty) return;

    const rowSpeed = difficulty === 'Easy' ? 25000 : difficulty === 'Medium' ? 18000 : 12000;
    
    rowIntervalRef.current = window.setInterval(() => {
      setBubbles(prev => {
        const newGrid = prev.map(b => ({
          ...b,
          row: b.row + 1,
          y: b.y + ROW_HEIGHT
        }));

        const firstRow: Bubble[] = [];
        const colsInRow = 0 % 2 === 0 ? 10 : 9;
        for (let c = 0; c < colsInRow; c++) {
          const { x, y } = getBubbleCoords(0, c);
          firstRow.push({
            x, y, row: 0, col: c,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            id: `0-${c}-${Math.random()}`
          });
        }

        const updated = [...firstRow, ...newGrid];
        if (updated.some(b => b.row > 14)) {
           onGameOver(score);
        }
        return updated;
      });
    }, rowSpeed);

    return () => {
      if (rowIntervalRef.current) clearInterval(rowIntervalRef.current);
    };
  }, [isPlaying, difficulty, score, onGameOver]);

  const shoot = () => {
    if (isShooting || !isPlaying || !difficulty) return;
    setIsShooting(true);
    const startDistance = 40;
    setShotBubble({
      x: WIDTH / 2 + Math.sin(angle) * startDistance,
      y: HEIGHT - 30 - Math.cos(angle) * startDistance,
      color: nextColor,
    });
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = rect.height - (e.clientY - rect.top);
    const rawAngle = Math.atan2(x, y);
    setAngle(Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rawAngle)));
  };

  const findNeighbors = (row: number, col: number, allBubbles: Bubble[]) => {
    const neighbors = [];
    const isOdd = row % 2 !== 0;
    
    const directions = isOdd 
      ? [[0, 1], [0, -1], [-1, 0], [-1, 1], [1, 0], [1, 1]] 
      : [[0, 1], [0, -1], [-1, -1], [-1, 0], [1, -1], [1, 0]]; 

    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      const found = allBubbles.find(b => b.row === nr && b.col === nc);
      if (found) neighbors.push(found);
    }
    return neighbors;
  };

  const processHit = (nx: number, ny: number, color: string) => {
    let bestCell = { row: 0, col: 0, dist: Infinity };
    const centerRow = Math.round((ny - BUBBLE_RADIUS - 20) / ROW_HEIGHT);

    for (let r = Math.max(0, centerRow - 2); r <= centerRow + 2; r++) {
      const colsInRow = r % 2 === 0 ? 10 : 9;
      for (let c = 0; c < colsInRow; c++) {
        if (!bubbles.some(b => b.row === r && b.col === c)) {
          const coords = getBubbleCoords(r, c);
          const d = Math.sqrt((nx - coords.x) ** 2 + (ny - coords.y) ** 2);
          if (d < bestCell.dist) {
            bestCell = { row: r, col: c, dist: d };
          }
        }
      }
    }

    const { x, y } = getBubbleCoords(bestCell.row, bestCell.col);
    const newBubble: Bubble = { x, y, row: bestCell.row, col: bestCell.col, color, id: Math.random().toString() };

    setBubbles(prev => {
      const updated = [...prev, newBubble];
      const matches = new Set<string>();
      const queue = [newBubble];
      matches.add(newBubble.id);

      let head = 0;
      while(head < queue.length) {
        const current = queue[head++];
        const neighbors = findNeighbors(current.row, current.col, updated);
        for(const n of neighbors) {
          if(!matches.has(n.id) && n.color === color) {
            matches.add(n.id);
            queue.push(n);
          }
        }
      }

      if (matches.size >= 3) {
        const toBurst = updated.filter(b => matches.has(b.id));
        let remaining = updated.filter(b => !matches.has(b.id));
        const difficultyMult = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2;
        setScore(s => s + Math.floor(matches.size * 100 * difficultyMult));

        const connected = new Set<string>();
        const ceilingBubbles = remaining.filter(b => b.row === 0);
        ceilingBubbles.forEach(b => connected.add(b.id));

        let cQueue = [...ceilingBubbles];
        let cHead = 0;
        while(cHead < cQueue.length) {
          const current = cQueue[cHead++];
          const neighbors = findNeighbors(current.row, current.col, remaining);
          for(const n of neighbors) {
            if(!connected.has(n.id)) {
              connected.add(n.id);
              cQueue.push(n);
            }
          }
        }

        const toFall = remaining.filter(b => !connected.has(b.id));
        const finalSafe = remaining.filter(b => connected.has(b.id));

        const fallingPool = [...toBurst, ...toFall].map(b => ({
          ...b,
          vx: (Math.random() - 0.5) * 6,
          vy: Math.random() * -4 - 2,
          opacity: 1
        }));
        
        setFallingBubbles(prevFalling => [...prevFalling, ...fallingPool]);
        if (toFall.length > 0) setScore(s => s + Math.floor(toFall.length * 150 * difficultyMult));
        
        if (finalSafe.length === 0) {
            setTimeout(() => onGameOver(score + 10000), 1000);
        }
        return finalSafe;
      }

      if (bestCell.row > 14) {
          setTimeout(() => onGameOver(score), 500);
      }
      return updated;
    });
  };

  useEffect(() => {
    const updateFalling = () => {
      setFallingBubbles(prev => {
        if (prev.length === 0) return prev;
        return prev
          .map(b => ({
            ...b,
            x: b.x + b.vx,
            y: b.y + b.vy,
            vy: b.vy + 0.4,
            vx: b.vx * 0.98,
            opacity: b.opacity - 0.012
          }))
          .filter(b => b.y < HEIGHT + 50 && b.opacity > 0);
      });
      fallingLoopRef.current = requestAnimationFrame(updateFalling);
    };
    fallingLoopRef.current = requestAnimationFrame(updateFalling);
    return () => { if (fallingLoopRef.current) cancelAnimationFrame(fallingLoopRef.current); };
  }, []);

  useEffect(() => {
    if (!isShooting || !shotBubble) return;

    const speed = 20;
    let vx = Math.sin(angle) * speed;
    let vy = -Math.cos(angle) * speed;
    let curX = shotBubble.x;
    let curY = shotBubble.y;

    const update = () => {
      curX += vx;
      curY += vy;

      if (curX < BUBBLE_RADIUS) {
        curX = BUBBLE_RADIUS;
        vx = -vx;
      } else if (curX > WIDTH - BUBBLE_RADIUS) {
        curX = WIDTH - BUBBLE_RADIUS;
        vx = -vx;
      }

      let hit = false;
      if (curY < BUBBLE_RADIUS + 20) {
        hit = true;
      } else {
        for (const b of bubbles) {
          const dist = Math.sqrt((curX - b.x) ** 2 + (curY - b.y) ** 2);
          if (dist < BUBBLE_RADIUS * 2 - 4) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        setIsShooting(false);
        processHit(curX, curY, shotBubble.color);
        setShotBubble(null);
      } else if (curY > HEIGHT) {
        setIsShooting(false);
        setShotBubble(null);
      } else {
        setShotBubble({ x: curX, y: curY, color: shotBubble.color });
        gameLoopRef.current = requestAnimationFrame(update);
      }
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isShooting, angle, bubbles]);

  const getTrajectoryData = () => {
    if (isShooting) return { points: [], ghost: null };
    let curX = WIDTH / 2;
    let curY = HEIGHT - 30;
    let curVx = Math.sin(angle) * 18;
    let curVy = -Math.cos(angle) * 18;
    const points = [];
    let ghost = null;
    
    for (let i = 0; i < 60; i++) {
      curX += curVx;
      curY += curVy;
      if (curX < BUBBLE_RADIUS || curX > WIDTH - BUBBLE_RADIUS) curVx = -curVx;
      
      let hit = curY < BUBBLE_RADIUS + 20;
      if (!hit) {
        for (const b of bubbles) {
          const dist = Math.sqrt((curX - b.x)**2 + (curY - b.y)**2);
          if (dist < BUBBLE_RADIUS * 2 - 5) { hit = true; break; }
        }
      }
      if (i % 3 === 0) points.push({ x: curX, y: curY });
      if (hit) {
        ghost = { x: curX, y: curY };
        break;
      }
    }
    return { points, ghost };
  };

  const trajectory = getTrajectoryData();

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-soap text-5xl text-rose-500 mb-4"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Bubble Flux</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Select your clearing velocity.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button
              key={level}
              onClick={() => initGrid(level)}
              className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-rose-500/10 hover:border-rose-500 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {level === 'Easy' ? 'Gentle Drifts' : level === 'Medium' ? 'Rapid Burst' : 'Overload Stream'}
                  </p>
                </div>
                <i className="fas fa-chevron-right text-rose-500 group-hover:translate-x-2 transition-transform"></i>
              </div>
              <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md select-none p-4 animate-in fade-in zoom-in duration-500">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-red-500/20 shadow-xl border-2">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Fury Score</p>
          <p className="text-3xl font-black text-red-500 tabular-nums drop-shadow-sm">{score.toLocaleString()}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Loadout</span>
          <div className="w-10 h-10 rounded-full border-4 border-white/20 shadow-inner flex items-center justify-center relative" style={{ backgroundColor: nextColor }}>
             <div className="w-2 h-2 bg-white/40 rounded-full blur-[1px] absolute top-2 left-2" />
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/5] bg-slate-950 rounded-[3rem] border-4 border-white/5 shadow-2xl overflow-hidden cursor-crosshair group"
        onMouseMove={handleMouseMove}
        onClick={shoot}
      >
        <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
        
        {/* Background Bubbles for depth */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
           {[...Array(6)].map((_, i) => (
             <div 
              key={i} 
              className="absolute rounded-full bg-white/20 blur-md animate-pulse"
              style={{
                width: `${40 + i * 20}px`,
                height: `${40 + i * 20}px`,
                left: `${(i * 20) % 90}%`,
                top: `${(i * 30) % 90}%`,
                animationDelay: `${i * 0.5}s`
              }}
             />
           ))}
        </div>

        {/* Trajectory Dots */}
        {trajectory.points.map((p, i) => (
          <div 
            key={i} 
            className="absolute rounded-full w-1.5 h-1.5 opacity-60"
            style={{ 
              left: `${(p.x / WIDTH) * 100}%`, 
              top: `${(p.y / HEIGHT) * 100}%`, 
              backgroundColor: nextColor,
              boxShadow: `0 0 8px ${nextColor}`,
              transform: 'translate(-50%, -50%)'
            }} 
          />
        ))}

        {/* Target Ghost */}
        {trajectory.ghost && (
          <div 
            className="absolute rounded-full border-2 border-dashed opacity-30 animate-pulse z-0"
            style={{ 
              width: `${(BUBBLE_RADIUS * 2 / WIDTH) * 100}%`, 
              height: `${(BUBBLE_RADIUS * 2 / HEIGHT) * 100}%`, 
              left: `${(trajectory.ghost.x / WIDTH) * 100}%`, 
              top: `${(trajectory.ghost.y / HEIGHT) * 100}%`, 
              borderColor: nextColor,
              transform: 'translate(-50%, -50%)'
            }}
          />
        )}

        {/* Falling Bubbles */}
        {fallingBubbles.map(b => (
          <div 
            key={b.id} 
            className="absolute rounded-full border-t border-white/30 shadow-inner z-10"
            style={{ 
              width: `${(BUBBLE_RADIUS * 2 / WIDTH) * 100}%`, 
              height: `${(BUBBLE_RADIUS * 2 / HEIGHT) * 100}%`, 
              left: `${((b.x - BUBBLE_RADIUS) / WIDTH) * 100}%`, 
              top: `${((b.y - BUBBLE_RADIUS) / HEIGHT) * 100}%`, 
              backgroundColor: b.color,
              opacity: b.opacity,
              transform: `scale(${b.opacity}) rotate(${b.y}deg)`
            }}
          >
            <div className="w-3 h-2 bg-white/30 rounded-full blur-[1px] absolute top-1 left-2 rotate-[-20deg]" />
          </div>
        ))}

        {/* Active Grid Bubbles */}
        {bubbles.map(b => (
          <div 
            key={b.id} 
            className="absolute rounded-full border-t border-white/30 shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90"
            style={{ 
              width: `${(BUBBLE_RADIUS * 2 / WIDTH) * 100}%`, 
              height: `${(BUBBLE_RADIUS * 2 / HEIGHT) * 100}%`, 
              left: `${((b.x - BUBBLE_RADIUS) / WIDTH) * 100}%`, 
              top: `${((b.y - BUBBLE_RADIUS) / HEIGHT) * 100}%`, 
              backgroundColor: b.color,
              boxShadow: `inset 0 0 10px rgba(255,255,255,0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.4)`
            }}
          >
            <div className="w-3 h-2 bg-white/30 rounded-full blur-[1px] absolute top-1.5 left-2.5 rotate-[-20deg]" />
          </div>
        ))}

        {/* Bubbles in Flight */}
        {shotBubble && (
          <div 
            className="absolute rounded-full border-2 border-white z-20 shadow-[0_0_30px_white]"
            style={{ 
              width: `${(BUBBLE_RADIUS * 2 / WIDTH) * 100}%`, 
              height: `${(BUBBLE_RADIUS * 2 / HEIGHT) * 100}%`, 
              left: `${((shotBubble.x - BUBBLE_RADIUS) / WIDTH) * 100}%`, 
              top: `${((shotBubble.y - BUBBLE_RADIUS) / HEIGHT) * 100}%`, 
              backgroundColor: shotBubble.color,
              boxShadow: `0 0 25px ${shotBubble.color}` 
            }}
          >
            <div className="w-3 h-2 bg-white/40 rounded-full blur-[1px] absolute top-1 left-2 rotate-[-20deg]" />
          </div>
        )}

        {/* Launcher */}
        <div 
          className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-16 h-24 z-30 transition-transform duration-75"
          style={{ transform: `translateX(-50%) rotate(${angle}rad)`, transformOrigin: 'bottom center' }}
        >
          <div className="w-14 h-20 bg-gradient-to-t from-slate-900 via-slate-700 to-slate-500 rounded-t-3xl border-x-2 border-t-2 border-white/20 relative flex flex-col items-center pt-2 shadow-2xl">
             <div className="w-10 h-10 rounded-full shadow-inner border border-white/10 flex items-center justify-center" 
                  style={{ backgroundColor: isShooting ? 'rgba(255,255,255,0.05)' : nextColor, transition: 'background-color 0.2s' }}>
                {!isShooting && <div className="w-3 h-2 bg-white/30 rounded-full blur-[0.5px] absolute top-4 left-4 rotate-[-20deg]" />}
             </div>
             <div className="absolute top-0 left-0 right-0 h-4 bg-white/5 rounded-t-3xl" />
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Match 3+ Color Blast</p>
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-rose-500/5 border border-rose-500/10">
           <span className="text-[9px] font-bold uppercase text-rose-400 tracking-widest">{difficulty} Mode active</span>
        </div>
      </div>
    </div>
  );
};

export default BubbleFury;
