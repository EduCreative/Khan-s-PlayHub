
import React, { useState, useEffect, useRef, useCallback } from 'react';
import VictoryEffect from '../components/VictoryEffect';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const BUBBLE_RADIUS = 18;
const WIDTH = 400;
const HEIGHT = 500;
const SPACING_X = BUBBLE_RADIUS * 2;
const SPACING_Y = BUBBLE_RADIUS * 1.732; // Hexagonal height spacing
const DEAD_LINE_Y = HEIGHT - 100;

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
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  const [nextColor, setNextColor] = useState(COLORS[1]);
  const [score, setScore] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isShooting, setIsShooting] = useState(false);
  const [shotBubble, setShotBubble] = useState<{ x: number; y: number; color: string; vx: number; vy: number } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const rowIntervalRef = useRef<number | null>(null);

  const getBubbleCoords = (row: number, col: number) => {
    const isOdd = row % 2 !== 0;
    const offset = isOdd ? BUBBLE_RADIUS : 0;
    const x = col * SPACING_X + BUBBLE_RADIUS + offset;
    const y = row * SPACING_Y + BUBBLE_RADIUS;
    return { x, y };
  };

  const getGridPosition = (x: number, y: number) => {
    const row = Math.round((y - BUBBLE_RADIUS) / SPACING_Y);
    const isOdd = row % 2 !== 0;
    const offset = isOdd ? BUBBLE_RADIUS : 0;
    const col = Math.round((x - BUBBLE_RADIUS - offset) / SPACING_X);
    return { row: Math.max(0, row), col: Math.max(0, col) };
  };

  const initGrid = useCallback((diff: Difficulty) => {
    const initial: Bubble[] = [];
    const startingRows = diff === 'Easy' ? 4 : diff === 'Medium' ? 6 : 8;
    for (let r = 0; r < startingRows; r++) {
      const colsInRow = r % 2 === 0 ? 11 : 10;
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
    setCurrentColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setFallingBubbles([]);
    setScore(0);
    setDifficulty(diff);
    setIsGameOver(false);
    setShowVictory(false);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setDifficulty(null);
      setIsGameOver(false);
      setShowVictory(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || !difficulty || isGameOver || showVictory) return;
    const rowSpeed = difficulty === 'Easy' ? 40000 : difficulty === 'Medium' ? 30000 : 20000;
    rowIntervalRef.current = window.setInterval(() => {
      setBubbles(prev => {
        const advanced = prev.map(b => {
          const newRow = b.row + 1;
          const { x, y } = getBubbleCoords(newRow, b.col);
          return { ...b, row: newRow, x, y };
        });
        const newTopRow: Bubble[] = [];
        const cols = 11;
        for (let c = 0; c < cols; c++) {
          const { x, y } = getBubbleCoords(0, c);
          newTopRow.push({
            x, y, row: 0, col: c,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            id: `0-${c}-${Math.random()}`
          });
        }
        const combined = [...newTopRow, ...advanced];
        if (combined.some(b => b.y + BUBBLE_RADIUS > DEAD_LINE_Y)) handleGameOver();
        return combined;
      });
    }, rowSpeed);
    return () => { if (rowIntervalRef.current) clearInterval(rowIntervalRef.current); };
  }, [isPlaying, difficulty, isGameOver, showVictory]);

  const handleGameOver = () => {
    setIsGameOver(true);
    if (rowIntervalRef.current) clearInterval(rowIntervalRef.current);
    onGameOver(score);
  };

  const fire = () => {
    if (isShooting || !isPlaying || !difficulty || isGameOver || showVictory) return;
    setIsShooting(true);
    const speed = 12;
    const rad = (angle - 90) * (Math.PI / 180);
    setShotBubble({
      x: WIDTH / 2,
      y: HEIGHT - 30,
      color: currentColor,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
    });
  };

  useEffect(() => {
    if (!isShooting || !shotBubble) return;
    const update = () => {
      setShotBubble(prev => {
        if (!prev) return null;
        let nx = prev.x + prev.vx;
        let ny = prev.y + prev.vy;
        let nvx = prev.vx;

        if (nx < BUBBLE_RADIUS || nx > WIDTH - BUBBLE_RADIUS) {
          nvx = -prev.vx;
          nx = nx < BUBBLE_RADIUS ? BUBBLE_RADIUS : WIDTH - BUBBLE_RADIUS;
        }

        const hitBubble = bubbles.find(b => {
          const dist = Math.sqrt((b.x - nx)**2 + (b.y - ny)**2);
          return dist < BUBBLE_RADIUS * 1.7;
        }) || ny < BUBBLE_RADIUS;

        if (hitBubble) {
          snapBubble(nx, ny, prev.color);
          setIsShooting(false);
          return null;
        }
        return { ...prev, x: nx, y: ny, vx: nvx };
      });
      gameLoopRef.current = requestAnimationFrame(update);
    };
    gameLoopRef.current = requestAnimationFrame(update);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [isShooting, bubbles]);

  useEffect(() => {
    const updateFalling = () => {
      setFallingBubbles(prev => {
        if (prev.length === 0) return [];
        return prev.map(b => ({
          ...b,
          y: b.y + b.vy,
          x: b.x + b.vx,
          vy: b.vy + 0.35,
          opacity: b.opacity - 0.02
        })).filter(b => b.y < HEIGHT + 50 && b.opacity > 0);
      });
      requestAnimationFrame(updateFalling);
    };
    const frame = requestAnimationFrame(updateFalling);
    return () => cancelAnimationFrame(frame);
  }, []);

  const snapBubble = (x: number, y: number, color: string) => {
    const { row, col } = getGridPosition(x, y);
    const coords = getBubbleCoords(row, col);
    
    // Safety check: ensure no overlap at the exact spot
    setBubbles(prev => {
      const existing = prev.find(b => b.row === row && b.col === col);
      if (existing) {
        // Find nearest empty neighbor instead of overlapping
        // Simplified fallback: just use current row/col if empty
        return prev; 
      }
      const newB = { ...coords, row, col, color, id: `${row}-${col}-${Math.random()}` };
      const updated = [...prev, newB];
      handleMatches(updated, newB);
      return updated;
    });

    setCurrentColor(nextColor);
    setNextColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const handleMatches = (allBubbles: Bubble[], startBubble: Bubble) => {
    const cluster = findCluster(allBubbles, startBubble);
    if (cluster.length >= 3) {
      const clusterIds = new Set(cluster.map(b => b.id));
      const remaining = allBubbles.filter(b => !clusterIds.has(b.id));
      
      const connectedToCeiling = findConnectedToCeiling(remaining);
      const connectedIds = new Set(connectedToCeiling.map(b => b.id));
      
      const detached = remaining.filter(b => !connectedIds.has(b.id));
      const finalRemaining = remaining.filter(b => connectedIds.has(b.id));

      const newFalling: FallingBubble[] = [...cluster, ...detached].map(b => ({
        ...b,
        vx: (Math.random() - 0.5) * 6,
        vy: -2 - Math.random() * 4,
        opacity: 1
      }));

      setFallingBubbles(prev => [...prev, ...newFalling]);
      setBubbles(finalRemaining);
      setScore(s => s + (cluster.length * 150) + (detached.length * 300));

      if (finalRemaining.length === 0) {
        setShowVictory(true);
        setTimeout(() => onGameOver(score + 10000), 4000);
      } else if (finalRemaining.some(b => b.y + BUBBLE_RADIUS > DEAD_LINE_Y)) {
        handleGameOver();
      }
    }
  };

  const findCluster = (all: Bubble[], start: Bubble) => {
    const cluster: Bubble[] = [];
    const queue: Bubble[] = [start];
    const visited = new Set([start.id]);
    while (queue.length > 0) {
      const current = queue.shift()!;
      cluster.push(current);
      const neighbors = getNeighbors(all, current);
      for (const n of neighbors) {
        if (!visited.has(n.id) && n.color === start.color) {
          visited.add(n.id);
          queue.push(n);
        }
      }
    }
    return cluster;
  };

  const findConnectedToCeiling = (all: Bubble[]) => {
    const connected: Bubble[] = [];
    const queue = all.filter(b => b.row === 0);
    const visited = new Set(queue.map(b => b.id));
    while (queue.length > 0) {
      const current = queue.shift()!;
      connected.push(current);
      const neighbors = getNeighbors(all, current);
      for (const n of neighbors) {
        if (!visited.has(n.id)) {
          visited.add(n.id);
          queue.push(n);
        }
      }
    }
    return connected;
  };

  const getNeighbors = (all: Bubble[], b: Bubble) => {
    const neighbors: Bubble[] = [];
    const odd = b.row % 2 !== 0;
    const offsets = odd 
      ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]]
      : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
    for (const [dr, dc] of offsets) {
      const nr = b.row + dr, nc = b.col + dc;
      const found = all.find(nb => nb.row === nr && nb.col === nc);
      if (found) neighbors.push(found);
    }
    return neighbors;
  };

  const handlePointer = (e: React.PointerEvent) => {
    if (!containerRef.current || isGameOver || showVictory) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const dx = x - WIDTH / 2, dy = y - (HEIGHT - 30);
    let newAngle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    setAngle(Math.max(-80, Math.min(80, newAngle)));
    if (e.type === 'pointerup') fire();
  };

  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md p-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center">
          <i className="fas fa-soap text-5xl text-rose-500 mb-4 animate-pulse"></i>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Bubble Phase</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Calibrate the structural density.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full">
          {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
            <button key={level} onClick={() => initGrid(level)} className="group relative overflow-hidden glass-card p-6 rounded-3xl border-2 border-rose-500/10 hover:border-rose-500 transition-all active:scale-95">
              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <h3 className="text-xl font-black uppercase italic text-slate-800 dark:text-white">{level}</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{level === 'Easy' ? 'Low Gravity' : level === 'Medium' ? 'Dense Void' : 'Event Horizon'}</p>
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
    <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4 select-none animate-in fade-in zoom-in duration-500">
      {showVictory && <VictoryEffect onComplete={() => onGameOver(score + 10000)} />}
      
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-rose-500/20 shadow-xl border-2 transition-colors">
        <div className="flex items-center gap-3">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Queue</span>
              <div className="w-7 h-7 rounded-full shadow-lg border-2 border-white/40 animate-pulse" style={{ backgroundColor: nextColor }} />
           </div>
           <div className="w-px h-8 bg-white/10 mx-1" />
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Score</span>
              <span className="text-2xl font-black text-rose-500 tabular-nums">{score.toLocaleString()}</span>
           </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Status</p>
          <p className="text-xl font-black text-slate-400 italic transition-colors">ACTIVE</p>
        </div>
      </div>

      <div ref={containerRef} className="relative bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl overflow-hidden touch-none" style={{ width: WIDTH, height: HEIGHT }} onPointerMove={handlePointer} onPointerDown={handlePointer} onPointerUp={handlePointer}>
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500/30 flex items-center justify-center" style={{ top: DEAD_LINE_Y }}>
          <span className="text-[8px] font-black text-rose-500 uppercase tracking-[0.5em] -translate-y-3 opacity-50">Logic Breach Line</span>
        </div>

        {bubbles.map(b => (
          <div key={b.id} className="absolute rounded-full border-2 border-white/20 shadow-inner transition-transform duration-300" style={{ width: BUBBLE_RADIUS * 2, height: BUBBLE_RADIUS * 2, left: b.x - BUBBLE_RADIUS, top: b.y - BUBBLE_RADIUS, backgroundColor: b.color, boxShadow: `inset -4px -4px 8px rgba(0,0,0,0.3), 0 4px 12px ${b.color}44` }} />
        ))}

        {fallingBubbles.map(b => (
          <div key={b.id} className="absolute rounded-full border-2 border-white/10 shadow-lg" style={{ width: BUBBLE_RADIUS * 2, height: BUBBLE_RADIUS * 2, left: b.x - BUBBLE_RADIUS, top: b.y - BUBBLE_RADIUS, backgroundColor: b.color, opacity: b.opacity, transform: `scale(${b.opacity})` }} />
        ))}

        {!isShooting && !isGameOver && !showVictory && (
           <div className="absolute left-1/2 bottom-[30px] border-l-2 border-dashed border-white/20 origin-bottom pointer-events-none" style={{ height: 400, transform: `translateX(-50%) rotate(${angle}deg)` }} />
        )}

        {shotBubble && (
          <div className="absolute rounded-full border-2 border-white/40 shadow-2xl z-20" style={{ width: BUBBLE_RADIUS * 2, height: BUBBLE_RADIUS * 2, left: shotBubble.x - BUBBLE_RADIUS, top: shotBubble.y - BUBBLE_RADIUS, backgroundColor: shotBubble.color, boxShadow: `0 0 20px ${shotBubble.color}` }} />
        )}

        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-16 h-20 origin-bottom transition-transform duration-75" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-14 bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-xl border-t-2 border-x-2 border-white/20 shadow-xl overflow-hidden flex flex-col items-center pt-2">
             <div className="w-7 h-7 rounded-full border-2 border-white/40 shadow-2xl" style={{ backgroundColor: currentColor }} />
          </div>
        </div>

        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-700">
             <i className="fas fa-skull-crossbones text-rose-500 text-5xl mb-4"></i>
             <h3 className="text-4xl font-black italic text-white tracking-tighter">BREACHED</h3>
             <button onClick={() => initGrid(difficulty!)} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-white font-black uppercase text-xs tracking-widest transition-all">Restart</button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 py-2 px-6 glass-card rounded-full border border-rose-500/20 text-slate-500 dark:text-slate-400">
         <i className="fas fa-hand-pointer text-rose-500"></i>
         <p className="text-[10px] font-black uppercase tracking-[0.2em]">Drag to Aim • Release to Fire</p>
      </div>
    </div>
  );
};

export default BubbleFury;
