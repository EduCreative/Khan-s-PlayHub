
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Procedural Audio Engine for Blitz Runner
class BlitzAudio {
  ctx: AudioContext | null = null;
  osc: OscillatorNode | null = null;
  gain: GainNode | null = null;
  beatTimer: number | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  startMusic() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const playBeat = () => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      
      // Bass Kick
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(150, t);
      kick.frequency.exponentialRampToValueAtTime(0.01, t + 0.1);
      kickGain.gain.setValueAtTime(0.2, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      kick.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kick.start(t);
      kick.stop(t + 0.1);

      // Snare-ish noise
      if (Math.random() > 0.5) {
        const snare = this.ctx.createOscillator();
        const snareGain = this.ctx.createGain();
        snare.type = 'triangle';
        snare.frequency.setValueAtTime(400, t + 0.25);
        snareGain.gain.setValueAtTime(0.05, t + 0.25);
        snareGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        snare.connect(snareGain);
        snareGain.connect(this.ctx.destination);
        snare.start(t + 0.25);
        snare.stop(t + 0.35);
      }

      this.beatTimer = window.setTimeout(playBeat, 500);
    };

    playBeat();
  }

  stopMusic() {
    if (this.beatTimer) clearTimeout(this.beatTimer);
    if (this.ctx) this.ctx.suspend();
  }

  playCrash() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(10, t + 0.5);
    g.gain.setValueAtTime(0.3, t);
    g.gain.linearRampToValueAtTime(0, t + 0.5);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + 0.5);
  }
}

const audio = new BlitzAudio();

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerY, setPlayerY] = useState(50);
  const [obstacles, setObstacles] = useState<{ x: number, y: number, h: number, id: number }[]>([]);
  const [score, setScore] = useState(0);
  
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(Date.now());
  const scoreRef = useRef(0);
  const playerYRef = useRef(50);
  const obstaclesRef = useRef<{ x: number, y: number, h: number, id: number }[]>([]);
  const isGameOverRef = useRef(false);

  const spawnObstacle = useCallback(() => {
    const id = Math.random();
    const h = 15 + Math.random() * 25;
    const y = Math.random() * (100 - h);
    return { x: 1000, y, h, id };
  }, []);

  const endGame = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    audio.playCrash();
    audio.stopMusic();
    if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
    onGameOver(scoreRef.current);
  }, [onGameOver]);

  useEffect(() => {
    if (!isPlaying) {
      audio.stopMusic();
      return;
    }

    isGameOverRef.current = false;
    scoreRef.current = 0;
    setScore(0);
    setObstacles([]);
    obstaclesRef.current = [];
    lastUpdate.current = Date.now();
    audio.startMusic();

    const gameLoop = () => {
      const now = Date.now();
      const dt = (now - lastUpdate.current) / 1000;
      lastUpdate.current = now;

      // Update Score
      scoreRef.current += Math.floor(dt * 150);
      setScore(Math.floor(scoreRef.current));
      
      // Move Obstacles
      const speed = 400 + (scoreRef.current / 50); // Speed increases with score
      const nextObstacles = obstaclesRef.current
        .map(o => ({ ...o, x: o.x - speed * dt }))
        .filter(o => o.x > -100);

      if (nextObstacles.length < 4 && (nextObstacles.length === 0 || nextObstacles[nextObstacles.length - 1].x < 700)) {
        nextObstacles.push(spawnObstacle());
      }

      // Collision Detection
      // Player is at x: 80px. Obstacle x is 0-1000 scale.
      // Game container is usually around 800-1000px wide. 
      // Player rect: x approx 8% to 14%. y: playerY% +/- 6%.
      const playerXMin = 8;
      const playerXMax = 14;
      const py = playerYRef.current;
      const playerYMin = py - 6;
      const playerYMax = py + 6;

      for (const o of nextObstacles) {
        const oxMin = o.x / 10;
        const oxMax = (o.x + 50) / 10;
        const oyMin = o.y;
        const oyMax = o.y + o.h;

        const hitX = playerXMax > oxMin && playerXMin < oxMax;
        const hitY = playerYMax > oyMin && playerYMin < oyMax;

        if (hitX && hitY) {
          endGame();
          return;
        }
      }

      obstaclesRef.current = nextObstacles;
      setObstacles([...nextObstacles]);
      gameRef.current = requestAnimationFrame(gameLoop);
    };

    gameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
      audio.stopMusic();
    };
  }, [isPlaying, spawnObstacle, endGame]);

  // Arrow Keys Support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowUp') {
        setPlayerY(prev => {
          const next = Math.max(10, prev - 8);
          playerYRef.current = next;
          return next;
        });
      }
      if (e.key === 'ArrowDown') {
        setPlayerY(prev => {
          const next = Math.min(90, prev + 8);
          playerYRef.current = next;
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = ((clientY - rect.top) / rect.height) * 100;
    const clampedY = Math.max(10, Math.min(90, y));
    setPlayerY(clampedY);
    playerYRef.current = clampedY;
  };

  return (
    <div 
      className="relative w-full max-w-4xl h-96 glass-card rounded-[2.5rem] overflow-hidden border-green-500/20 cursor-none shadow-2xl" 
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      {/* Background Parallax Stars/Grid */}
      <div className="absolute inset-0 bg-[#020617]" />
      <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
      
      {/* Dynamic Score UI */}
      <div className="absolute top-8 left-8 z-20">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-1">Blitz Distance</span>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-8 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
             <p className="text-5xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-md">
                {score}<span className="text-xl text-green-500 ml-1">m</span>
             </p>
          </div>
        </div>
      </div>

      {/* Speed Multiplier HUD */}
      <div className="absolute top-8 right-8 z-20 flex flex-col items-end">
        <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.3em] mb-1">Engines</span>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <div key={i} className={`w-2 h-4 rounded-sm border border-white/10 ${score > i*500 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/5'}`} />
          ))}
        </div>
      </div>

      {/* Player Runner */}
      <div 
        className="absolute left-[8%] w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-[0_0_40px_rgba(74,222,128,0.6)] flex items-center justify-center transition-all duration-75 z-30 border-2 border-white/20"
        style={{ top: `${playerY}%`, transform: 'translateY(-50%) rotate(5deg)' }}
      >
        <i className="fas fa-bolt text-black text-2xl animate-pulse"></i>
        {/* Engine Flare */}
        <div className="absolute -left-4 w-6 h-4 bg-cyan-400/40 blur-md rounded-full animate-pulse" />
      </div>

      {/* Obstacles (Energy Walls) */}
      {obstacles.map((o) => (
        <div 
          key={o.id}
          className="absolute w-12 bg-gradient-to-r from-rose-600/60 to-rose-400/20 border-l-4 border-rose-500 rounded-r-2xl overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.3)]"
          style={{ 
            left: `${o.x / 10}%`, 
            top: `${o.y}%`, 
            height: `${o.h}%`,
            transition: 'none'
          }}
        >
          <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
        </div>
      ))}

      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] z-40" />

      {/* Control Tips */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] animate-bounce flex items-center gap-4 bg-black/40 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm z-20">
        <div className="flex items-center gap-1"><i className="fas fa-mouse text-green-500"></i> MOVE</div>
        <div className="w-1 h-1 bg-slate-700 rounded-full" />
        <div className="flex items-center gap-1"><i className="fas fa-keyboard text-green-500"></i> ARROWS</div>
      </div>
    </div>
  );
};

export default BlitzRunner;
