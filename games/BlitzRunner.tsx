
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Procedural Audio Engine
class BlitzAudio {
  ctx: AudioContext | null = null;
  beatTimer: number | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  startMusic() {
    this.init();
    if (!this.ctx) return;
    const playBeat = () => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const t = this.ctx.currentTime;
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(120, t);
      kick.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
      kickGain.gain.setValueAtTime(0.15, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      kick.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kick.start(t);
      kick.stop(t + 0.15);
      this.beatTimer = window.setTimeout(playBeat, 500);
    };
    playBeat();
  }

  stopMusic() {
    if (this.beatTimer) clearTimeout(this.beatTimer);
    if (this.ctx) this.ctx.suspend();
  }

  playEffect(freq: number, type: OscillatorType = 'sine', duration: number = 0.2) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(10, t + duration);
    g.gain.setValueAtTime(0.1, t);
    g.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(t + duration);
  }
}

const audio = new BlitzAudio();

type EntityType = 'obstacle' | 'core' | 'shield';

interface Entity {
  id: number;
  type: EntityType;
  x: number;
  y: number;
  w: number;
  h: number;
  speedMult: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
  type?: 'exhaust' | 'spark' | 'speedline';
}

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerX, setPlayerX] = useState(50);
  const [playerTilt, setPlayerTilt] = useState(0);
  const [score, setScore] = useState(0);
  const [shieldActive, setShieldActive] = useState(0);
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const scoreRef = useRef(0);
  const playerXRef = useRef(50);
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isGameOverRef = useRef(false);
  const shieldRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const dodgeFeedbackRef = useRef<{ x: number, y: number, text: string, life: number } | null>(null);

  const spawnEntity = useCallback((): Entity => {
    const rand = Math.random();
    let type: EntityType = 'obstacle';
    let w = 15 + Math.random() * 35;
    if (rand > 0.96) { type = 'shield'; w = 6; }
    else if (rand > 0.88) { type = 'core'; w = 5; }
    const x = Math.random() * (100 - w);
    return { id: Math.random(), type, x, y: -15, w, h: type === 'obstacle' ? 4 : 6, speedMult: 0.85 + Math.random() * 0.3 };
  }, []);

  const spawnParticle = (x: number, y: number, color: string, speedFactor: number, xBias: number = 0, type: 'exhaust' | 'spark' | 'speedline' = 'exhaust') => {
    particlesRef.current.push({
      id: Math.random(),
      x, y,
      vx: type === 'speedline' ? 0 : ((Math.random() - 0.5) * 6) + (xBias * 2),
      vy: type === 'speedline' ? 40 : (12 + speedFactor * 12),
      life: type === 'speedline' ? 0.3 : 1,
      size: type === 'speedline' ? 1 : (2 + Math.random() * 4),
      color, type
    });
  };

  const drawToCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      const px = (p.x / 100) * width;
      const py = (p.y / 100) * height;
      if (p.type === 'speedline') {
        ctx.fillRect(px, py - 40, 1, 80);
      } else {
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    entitiesRef.current.forEach(e => {
      const ex = (e.x / 100) * width;
      const ey = (e.y / 100) * height;
      const ew = (e.w / 100) * width;
      const eh = (e.h / 100) * height;

      if (e.type === 'obstacle') {
        const grad = ctx.createLinearGradient(ex, ey, ex, ey + eh);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(1, '#4c0519');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(ex, ey, ew, eh, 8);
        ctx.fill();
      } else {
        ctx.fillStyle = e.type === 'core' ? '#6366f1' : '#22d3ee';
        ctx.beginPath();
        if (e.type === 'core') ctx.arc(ex + ew/2, ey + eh/2, ew/2, 0, Math.PI*2);
        else ctx.roundRect(ex, ey, ew, eh, ew/2);
        ctx.fill();
      }
    });

    if (dodgeFeedbackRef.current && dodgeFeedbackRef.current.life > 0) {
      const f = dodgeFeedbackRef.current;
      ctx.fillStyle = `rgba(34, 211, 238, ${f.life})`;
      ctx.font = '900 24px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, (f.x / 100) * width, (f.y / 100) * height);
      f.life -= 0.02;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) { audio.stopMusic(); return; }
    isGameOverRef.current = false;
    scoreRef.current = 0;
    shieldRef.current = 0;
    setScore(0);
    entitiesRef.current = [];
    particlesRef.current = [];
    lastUpdate.current = performance.now();
    audio.startMusic();

    const gameLoop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let dt = (time - lastUpdate.current) / 1000;
      if (dt > 0.1) dt = 0.016; 
      lastUpdate.current = time;

      let moveDir = 0;
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) moveDir -= 1;
      if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) moveDir += 1;

      if (moveDir !== 0) {
        playerXRef.current = Math.max(10, Math.min(90, playerXRef.current + moveDir * 100 * dt));
        setPlayerX(playerXRef.current);
        setPlayerTilt(moveDir * 25);
      } else {
        setPlayerTilt(0);
      }

      const currentDifficulty = 1 + (scoreRef.current / 15000);
      const baseSpeed = 260 * currentDifficulty;
      scoreRef.current += dt * (baseSpeed / 6);
      setScore(Math.floor(scoreRef.current));
      
      const warp = Math.floor(scoreRef.current / 4000) % 2 === 1;
      setIsWarping(warp);

      if (shieldRef.current > 0) {
        shieldRef.current -= dt;
        setShieldActive(Math.max(0, shieldRef.current));
      }

      particlesRef.current = particlesRef.current
        .map(p => ({ 
          ...p, 
          x: p.type === 'speedline' ? p.x : p.x + p.vx * dt * 10, 
          y: p.y + p.vy * dt * 10, 
          life: p.life - dt * (p.type === 'speedline' ? 5 : 3) 
        }))
        .filter(p => p.life > 0);

      if (Math.random() > (warp ? 0.05 : 0.4)) {
        spawnParticle(playerXRef.current + (Math.random() - 0.5) * 6, 85, shieldRef.current > 0 ? '#22d3ee' : (warp ? '#f472b6' : '#6366f1'), currentDifficulty, -moveDir);
      }
      if (warp && Math.random() > 0.6) spawnParticle(Math.random() * 100, -10, '#ffffff', currentDifficulty, 0, 'speedline');

      entitiesRef.current = entitiesRef.current
        .map(e => ({ ...e, y: e.y + (baseSpeed * e.speedMult) * dt * 0.2 }))
        .filter(e => e.y < 120);

      if (entitiesRef.current.length < 8 && (entitiesRef.current.length === 0 || entitiesRef.current[entitiesRef.current.length - 1].y > Math.max(12, 28 - (scoreRef.current / 600)))) {
        entitiesRef.current.push(spawnEntity());
      }

      let foundNearMiss = false;
      const px = playerXRef.current, pW = 5.0, pH = 4.8, pY = 82;
      entitiesRef.current.forEach(e => {
        const hitX = px + pW > e.x && px - pW < e.x + e.w;
        const hitY = pY + pH > e.y && pY < e.y + e.h;
        if (hitX && hitY) {
          if (e.type === 'obstacle') {
            if (shieldRef.current > 0) { shieldRef.current = 0; setShieldActive(0); e.y = 200; audio.playEffect(600); }
            else { isGameOverRef.current = true; onGameOver(Math.floor(scoreRef.current)); }
          } else if (e.type === 'core') { scoreRef.current += 1500; e.y = 200; audio.playEffect(1200, 'triangle'); }
          else if (e.type === 'shield') { shieldRef.current = 7.0; setShieldActive(7.0); e.y = 200; audio.playEffect(550); }
        } else if (e.type === 'obstacle' && hitY) {
          const dist = Math.min(Math.abs((px - pW) - (e.x + e.w)), Math.abs((px + pW) - e.x));
          if (dist < 4.5) {
            if (!nearMissMsg) dodgeFeedbackRef.current = { x: px, y: pY - 10, text: 'NEXUS DODGE!', life: 1 };
            scoreRef.current += 50; foundNearMiss = true;
          }
        }
      });

      setNearMissMsg(foundNearMiss);
      drawToCanvas(ctx, canvas.width, canvas.height);
      if (!isGameOverRef.current) gameRef.current = requestAnimationFrame(gameLoop);
    };

    gameRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameRef.current !== null) cancelAnimationFrame(gameRef.current); audio.stopMusic(); };
  }, [isPlaying, spawnEntity, onGameOver, nearMissMsg]);

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    playerXRef.current = Math.max(10, Math.min(90, x));
    setPlayerX(playerXRef.current);
  };

  return (
    <div 
      className={`relative w-full max-w-lg h-[650px] rounded-[3.5rem] overflow-hidden shadow-2xl mx-auto border-4 border-white/10 transition-all duration-700 ${isWarping ? 'brightness-125 saturate-150' : ''}`}
      onPointerMove={handlePointerMove}
    >
      <div className={`absolute inset-0 ${isWarping ? 'bg-indigo-950' : 'bg-[#020617]'}`} />
      <canvas ref={canvasRef} width={500} height={650} className="absolute inset-0 w-full h-full z-10 pointer-events-none" />
      
      <div className="absolute top-10 left-8 right-8 z-50 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mb-1">Blitz Sector</span>
          <p className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300 ${nearMissMsg ? 'text-cyan-400' : 'text-white'}`}>
            {score.toLocaleString()}
          </p>
        </div>
      </div>

      <div 
        className="absolute bottom-[10%] w-20 h-20 z-[100] transition-transform duration-100 ease-out"
        style={{ left: `${playerX}%`, transform: `translateX(-50%) rotateY(${playerTilt}deg)` }}
      >
        <div className={`absolute inset-[-60%] rounded-full blur-[30px] transition-all duration-500 ${shieldActive > 0 ? 'bg-cyan-400/60 scale-125' : (isWarping ? 'bg-indigo-500/40' : (nearMissMsg ? 'bg-cyan-500/30' : 'bg-transparent'))}`} />
        <div className="relative w-full h-full bg-gradient-to-b from-indigo-300 to-indigo-800 rounded-3xl shadow-2xl flex items-center justify-center border-2 border-white/30 overflow-hidden">
          <i className="fas fa-fighter-jet text-white text-4xl transform -rotate-45"></i>
        </div>
      </div>
    </div>
  );
};

export default BlitzRunner;
