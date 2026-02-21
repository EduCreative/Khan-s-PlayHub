
import React, { useState, useEffect, useRef, useCallback } from 'react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const BUBBLE_RADIUS = 16;
const WIDTH = 360;
const HEIGHT = 500;
const SPACING_X = BUBBLE_RADIUS * 2;
const SPACING_Y = BUBBLE_RADIUS * 1.732;
const SHOT_ORIGIN_Y = HEIGHT - 30;

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Bubble {
  x: number;
  y: number;
  row: number;
  col: number;
  color: string;
}

interface FallingBubble extends Bubble {
  vy: number;
  opacity: number;
}

const BubbleFury: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [score, setScore] = useState(0);
  const [currentColor, setCurrentColor] = useState(COLORS[0]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const fallingRef = useRef<FallingBubble[]>([]);
  const angleRef = useRef(0);
  const shotRef = useRef<{ x: number, y: number, color: string, vx: number, vy: number } | null>(null);
  const lastTimeRef = useRef(0);

  const getBubbleCoords = (row: number, col: number) => {
    const offset = (row % 2 !== 0) ? BUBBLE_RADIUS : 0;
    return { x: col * SPACING_X + BUBBLE_RADIUS + offset, y: row * SPACING_Y + BUBBLE_RADIUS };
  };

  const initGrid = useCallback((diff: Difficulty) => {
    const initial: Bubble[] = [];
    const rows = diff === 'Easy' ? 4 : diff === 'Medium' ? 6 : 8;
    for (let r = 0; r < rows; r++) {
      const cols = r % 2 === 0 ? 11 : 10;
      for (let c = 0; c < cols; c++) {
        const { x, y } = getBubbleCoords(r, c);
        initial.push({ x, y, row: r, col: c, color: COLORS[Math.floor(Math.random() * COLORS.length)] });
      }
    }
    bubblesRef.current = initial;
    fallingRef.current = [];
    setScore(0);
    setDifficulty(diff);
  }, []);

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    bubblesRef.current.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BUBBLE_RADIUS - 1, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    });

    fallingRef.current.forEach(b => {
      ctx.globalAlpha = b.opacity;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BUBBLE_RADIUS * b.opacity, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (shotRef.current) {
      const s = shotRef.current;
      ctx.beginPath();
      ctx.arc(s.x, s.y, BUBBLE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    }

    if (!shotRef.current && difficulty) {
      const rad = (angleRef.current - 90) * (Math.PI / 180);
      ctx.setLineDash([5, 10]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, SHOT_ORIGIN_Y);
      ctx.lineTo(WIDTH / 2 + Math.cos(rad) * 200, SHOT_ORIGIN_Y + Math.sin(rad) * 200);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    if (!isPlaying || !difficulty) return;
    const loop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      lastTimeRef.current = time;

      if (shotRef.current) {
        const s = shotRef.current;
        s.x += s.vx; s.y += s.vy;
        if (s.x < BUBBLE_RADIUS || s.x > WIDTH - BUBBLE_RADIUS) s.vx *= -1;
        const hit = bubblesRef.current.some(b => Math.hypot(b.x - s.x, b.y - s.y) < BUBBLE_RADIUS * 1.6) || s.y < BUBBLE_RADIUS;
        if (hit) {
          shotRef.current = null;
          
          // Add the new bubble to the grid
          const row = Math.floor(s.y / SPACING_Y);
          const offset = (row % 2 !== 0) ? BUBBLE_RADIUS : 0;
          const col = Math.round((s.x - BUBBLE_RADIUS - offset) / SPACING_X);
          const { x, y } = getBubbleCoords(row, col);
          
          bubblesRef.current.push({ x, y, row, col, color: s.color });
          
          // Simple matching logic (for demonstration, a real implementation would use flood fill)
          const matches = bubblesRef.current.filter(b => b.color === s.color && Math.hypot(b.x - x, b.y - y) < BUBBLE_RADIUS * 2.5);
          if (matches.length >= 3) {
            bubblesRef.current = bubblesRef.current.filter(b => !matches.includes(b));
            fallingRef.current.push(...matches.map(m => ({ ...m, vy: 10, opacity: 1 })));
            setScore(prev => prev + matches.length * 100);
          }

          setCurrentColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        }
      }

      fallingRef.current = fallingRef.current.map(b => ({
        ...b, y: b.y + 10, opacity: b.opacity - 0.02
      })).filter(b => b.opacity > 0);

      // Game Over conditions
      if (bubblesRef.current.some(b => b.y + BUBBLE_RADIUS >= SHOT_ORIGIN_Y)) {
        onGameOver(score);
        return;
      }
      
      if (bubblesRef.current.length === 0) {
        onGameOver(score + 5000); // Bonus for clearing
        return;
      }

      draw(ctx);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, [isPlaying, difficulty]);

  const handlePointer = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    angleRef.current = Math.max(-80, Math.min(80, Math.atan2(y - SHOT_ORIGIN_Y, x - WIDTH / 2) * 180 / Math.PI + 90));
    if (e.type === 'pointerup' && !shotRef.current) {
      const rad = (angleRef.current - 90) * (Math.PI / 180);
      shotRef.current = { x: WIDTH / 2, y: SHOT_ORIGIN_Y, color: currentColor, vx: Math.cos(rad) * 12, vy: Math.sin(rad) * 12 };
    }
  };

  if (!difficulty) return (
    <div className="flex flex-col items-center gap-8 p-8">
      <h2 className="text-3xl font-black italic text-indigo-400">Bubble Fury</h2>
      <button onClick={() => initGrid('Medium')} className="w-full py-4 glass-card rounded-2xl uppercase font-black">Begin Phase</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex justify-between glass-card p-4 rounded-2xl">
         <div className="w-8 h-8 rounded-full" style={{ backgroundColor: currentColor }} />
         <span className="text-2xl font-black text-rose-500">{score}</span>
      </div>
      <canvas 
        ref={canvasRef} width={WIDTH} height={HEIGHT} 
        className="bg-slate-950 rounded-[2rem] border-4 border-slate-800 touch-none shadow-2xl"
        onPointerMove={handlePointer} onPointerDown={handlePointer} onPointerUp={handlePointer}
      />
    </div>
  );
};

export default BubbleFury;
