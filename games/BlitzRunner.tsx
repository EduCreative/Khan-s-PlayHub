
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Procedural Audio Engine for Blitz Runner
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
      
      // Cyber-Kick
      const kick = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kick.frequency.setValueAtTime(120, t);
      kick.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
      kickGain.gain.setValueAtTime(0.2, t);
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
    g.gain.setValueAtTime(0.15, t);
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
}

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerX, setPlayerX] = useState(50);
  const [playerTilt, setPlayerTilt] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [shieldActive, setShieldActive] = useState(0);
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [shake, setShake] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const scoreRef = useRef(0);
  const playerXRef = useRef(50);
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isGameOverRef = useRef(false);
  const shieldRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());

  const triggerShake = (intensity: number) => {
    setShake(intensity);
    setTimeout(() => setShake(0), 150);
  };

  const spawnEntity = useCallback((): Entity => {
    const id = Math.random();
    const rand = Math.random();
    let type: EntityType = 'obstacle';
    let w = type === 'obstacle' ? (15 + Math.random() * 35) : 6;
    
    if (rand > 0.96) {
      type = 'shield';
      w = 6;
    } else if (rand > 0.88) {
      type = 'core';
      w = 5;
    }

    const x = Math.random() * (100 - w);
    const speedMult = type === 'obstacle' ? (0.85 + Math.random() * 0.3) : 1.0;
    return { id, type, x, y: -15, w, h: type === 'obstacle' ? 4 : 6, speedMult };
  }, []);

  const spawnParticle = (x: number, y: number, color: string, speedFactor: number, xBias: number = 0) => {
    particlesRef.current.push({
      id: Math.random(),
      x,
      y,
      vx: ((Math.random() - 0.5) * 6) + (xBias * 2),
      vy: 12 + speedFactor * 12,
      life: 1,
      size: 2 + Math.random() * 4,
      color
    });
  };

  const endGame = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    audio.playEffect(80, 'sawtooth', 0.6);
    audio.stopMusic();
    if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
    onGameOver(Math.floor(scoreRef.current));
  }, [onGameOver]);

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
    if (!isPlaying) {
      audio.stopMusic();
      return;
    }

    isGameOverRef.current = false;
    scoreRef.current = 0;
    shieldRef.current = 0;
    setScore(0);
    setEntities([]);
    setParticles([]);
    entitiesRef.current = [];
    particlesRef.current = [];
    lastUpdate.current = performance.now();
    audio.startMusic();

    const gameLoop = (time: number) => {
      let dt = (time - lastUpdate.current) / 1000;
      if (dt > 0.1) dt = 0.016; 
      lastUpdate.current = time;

      let moveDir = 0;
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) moveDir -= 1;
      if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) moveDir += 1;

      if (moveDir !== 0) {
        const moveSpeed = 80;
        const newX = playerXRef.current + moveDir * moveSpeed * dt;
        playerXRef.current = Math.max(10, Math.min(90, newX));
        setPlayerX(playerXRef.current);
        setPlayerTilt(moveDir * 15);
      } else {
        setPlayerTilt(prev => prev * 0.9);
      }

      const currentDifficulty = 1 + (scoreRef.current / 15000);
      const baseSpeed = 220 * currentDifficulty;
      scoreRef.current += dt * (baseSpeed / 5);
      setScore(Math.floor(scoreRef.current));
      
      const warp = Math.floor(scoreRef.current / 2500) % 2 === 1;
      setIsWarping(warp);
      setParallaxY(prev => (prev + baseSpeed * dt * 0.5) % 800);

      if (shieldRef.current > 0) {
        shieldRef.current -= dt;
        setShieldActive(Math.max(0, shieldRef.current));
      }

      // Update Particles with move drift
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx * dt * 10, y: p.y + p.vy * dt * 10, life: p.life - dt * 2.5 }))
        .filter(p => p.life > 0);

      // Spawn Exhaust Particles
      if (Math.random() > (warp ? 0.15 : 0.55)) {
        spawnParticle(
          playerXRef.current + (Math.random() - 0.5) * 6, 
          85, 
          shieldRef.current > 0 ? '#22d3ee' : (warp ? '#f472b6' : '#6366f1'), 
          currentDifficulty,
          -moveDir // Particles drift opposite to move
        );
      }

      // Update Entities
      const nextEntities = entitiesRef.current
        .map(e => ({ ...e, y: e.y + (baseSpeed * e.speedMult) * dt * 0.15 }))
        .filter(e => e.y < 110);

      const spawnThreshold = Math.max(18, 32 - (scoreRef.current / 600));
      if (nextEntities.length < 6 && (nextEntities.length === 0 || nextEntities[nextEntities.length - 1].y > spawnThreshold)) {
        nextEntities.push(spawnEntity());
      }

      const px = playerXRef.current;
      const pW = 4.5;
      const pH = 4;
      const pY = 82;

      let foundNearMiss = false;
      nextEntities.forEach(e => {
        const hitX = px + pW > e.x && px - pW < e.x + e.w;
        const hitY = pY + pH > e.y && pY < e.y + e.h;

        if (hitX && hitY) {
          if (e.type === 'obstacle') {
            if (shieldRef.current > 0) {
              shieldRef.current = 0;
              setShieldActive(0);
              e.y = 200; 
              audio.playEffect(600, 'sine', 0.2);
              triggerShake(15);
            } else endGame();
          } else if (e.type === 'core') {
            scoreRef.current += 1500;
            e.y = 200;
            audio.playEffect(1100, 'triangle', 0.1);
          } else if (e.type === 'shield') {
            shieldRef.current = 6.0;
            setShieldActive(6.0);
            e.y = 200;
            audio.playEffect(500, 'sine', 0.4);
          }
        } else if (e.type === 'obstacle' && hitY) {
          const distToLeft = Math.abs((px - pW) - (e.x + e.w));
          const distToRight = Math.abs((px + pW) - e.x);
          const minHozDist = Math.min(distToLeft, distToRight);
          
          if (minHozDist < 3.8) {
             scoreRef.current += 25; 
             foundNearMiss = true;
             // High density sparks on dodge
             if (Math.random() > 0.4) spawnParticle(px + (distToLeft < distToRight ? -pW : pW), pY, '#06b6d4', 2.5);
          }
        }
      });

      setNearMissMsg(foundNearMiss);
      entitiesRef.current = nextEntities;
      setEntities([...nextEntities]);
      setParticles([...particlesRef.current]);
      gameRef.current = requestAnimationFrame(gameLoop);
    };

    gameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
      audio.stopMusic();
    };
  }, [isPlaying, spawnEntity, endGame]);

  const handleInput = (clientX: number, rectWidth: number, rectLeft: number) => {
    if (keysPressed.current.size > 0) return;
    const x = ((clientX - rectLeft) / rectWidth) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    setPlayerTilt((clampedX - playerXRef.current) * 2.5);
    playerXRef.current = clampedX;
    setPlayerX(clampedX);
  };

  return (
    <div 
      className={`relative w-full max-w-lg h-[600px] rounded-[3rem] overflow-hidden cursor-none shadow-2xl mx-auto border-4 border-white/10 transition-all duration-700 ${isWarping ? 'brightness-125' : ''}`}
      style={{ transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)`, perspective: '1200px' }}
      onMouseMove={(e) => handleInput(e.clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
      onTouchMove={(e) => handleInput(e.touches[0].clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
    >
      {/* Dynamic Parallax Background */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isWarping ? 'bg-slate-900' : 'bg-black'}`} />
      
      {/* Distant Starfield */}
      <div className="absolute inset-[-50%] opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 120px, #fff, rgba(0,0,0,0))',
             backgroundSize: '200px 200px',
             transform: `translateY(${parallaxY * 0.1}px)`
           }} 
      />

      {/* Nebula Layer */}
      <div className={`absolute inset-0 transition-all duration-1000 ${isWarping ? 'opacity-30 mix-blend-screen' : 'opacity-10'}`} 
           style={{ 
             background: 'radial-gradient(circle at 50% 50%, #4338ca 0%, #7c3aed 40%, transparent 70%)',
             filter: 'blur(80px)',
             transform: `translateY(${parallaxY * 0.25}px)`
           }} 
      />

      {/* Grid Floor */}
      <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(65deg)' }}>
        <div 
          className={`absolute inset-[-150%] transition-opacity duration-1000 ${isWarping ? 'bg-grid-indigo-500/30' : 'bg-grid-white/10'}`} 
          style={{ 
            backgroundSize: '50px 50px',
            transform: `translateY(${parallaxY}px)`
          }} 
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-indigo-500/40 to-transparent transition-opacity duration-1000 ${isWarping ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Reactive Particles */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            width: `${p.size}px`, 
            height: `${p.size}px`, 
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}

      {/* UI Elements */}
      <div className="absolute top-8 left-8 right-8 z-40 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mb-1">Blitz Distance</span>
          <p className={`text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-500 ${nearMissMsg ? 'text-cyan-300 scale-105' : (isWarping ? 'text-cyan-400' : 'text-white')}`}>
            {score.toLocaleString()}<span className="text-xl opacity-50 ml-1">m</span>
          </p>
          {nearMissMsg && (
            <div className="flex items-center gap-2 mt-2 px-3 py-1 bg-cyan-500/20 border border-cyan-400/30 rounded-lg animate-pulse">
              <i className="fas fa-bolt text-cyan-400 text-xs"></i>
              <span className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">+ FOCUS MULTIPLIER</span>
            </div>
          )}
        </div>

        {shieldActive > 0 && (
          <div className="px-5 py-2 rounded-2xl border border-cyan-400/50 bg-cyan-400/20 backdrop-blur-xl animate-bounce flex items-center gap-2">
            <i className="fas fa-shield-halved text-cyan-400 text-sm"></i>
            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">{shieldActive.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Game Entities */}
      {entities.map((e) => (
        <div 
          key={e.id}
          className={`absolute rounded-xl transition-all duration-75 ${
            e.type === 'obstacle' ? 'bg-gradient-to-b from-rose-500 to-rose-900 border-t-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]' :
            e.type === 'core' ? 'bg-indigo-500 animate-spin rounded-lg shadow-[0_0_35px_indigo]' :
            'bg-cyan-400 animate-pulse rounded-full shadow-[0_0_45px_cyan]'
          }`}
          style={{ 
            left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h}%`,
            transform: `perspective(400px) rotateX(${e.y / 3}deg) scale(${nearMissMsg && e.y > 75 ? 1.08 : 1})`,
            zIndex: Math.floor(e.y)
          }}
        >
          {e.type !== 'obstacle' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
              <i className={`fas ${e.type === 'core' ? 'fa-bolt' : 'fa-shield'}`}></i>
            </div>
          )}
          {e.type === 'obstacle' && <div className="absolute inset-0 bg-grid-white/5 opacity-30 pointer-events-none" />}
        </div>
      ))}

      {/* Player Runner */}
      <div 
        className="absolute bottom-[12%] w-16 h-16 z-[100] transition-all duration-100"
        style={{ 
          left: `${playerX}%`, 
          transform: `translateX(-50%) rotateY(${playerTilt}deg) rotateZ(${playerTilt / 4}deg) scale(${nearMissMsg ? 1.15 : 1})` 
        }}
      >
        {/* Glow Aura */}
        <div className={`absolute inset-[-70%] rounded-full blur-3xl transition-all duration-500 ${shieldActive > 0 ? 'bg-cyan-400/60 opacity-100 scale-125' : (isWarping ? 'bg-indigo-500/40 opacity-80' : 'bg-indigo-500/20 opacity-0')}`} />
        
        <div className={`relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-400 dark:from-indigo-400 dark:to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/40 overflow-hidden ${nearMissMsg ? 'ring-4 ring-cyan-400 animate-pulse' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30" />
          <i className="fas fa-fighter-jet text-slate-800 dark:text-white text-3xl"></i>
          
          <div className="absolute -bottom-2 flex gap-4">
             <div className={`w-2 h-10 bg-cyan-400 blur-sm rounded-full animate-pulse shadow-[0_0_15px_cyan] transition-all ${isWarping ? 'h-16 brightness-150' : ''}`} />
             <div className={`w-2 h-10 bg-cyan-400 blur-sm rounded-full animate-pulse shadow-[0_0_15px_cyan] transition-all ${isWarping ? 'h-16 brightness-150' : ''}`} />
          </div>
        </div>
        
        {/* Trail Logic */}
        {nearMissMsg && (
          <div className="absolute inset-0 opacity-60 scale-110 blur-md bg-cyan-300 rounded-2xl -z-10 animate-ping" />
        )}
      </div>

      {/* Screen CRT and Shadow Effects */}
      <div className="absolute inset-0 pointer-events-none z-[110] overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
        <div className={`absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] transition-opacity duration-1000 ${isWarping ? 'opacity-40' : 'opacity-100'}`} />
      </div>

      <style>{`
        .bg-grid-white\/10 {
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
        }
        .bg-grid-indigo-500\/30 {
          background-image: linear-gradient(to right, rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.3) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default BlitzRunner;
