
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
  type?: 'exhaust' | 'spark' | 'speedline';
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
  const [dodgeFeedback, setDodgeFeedback] = useState<{ x: number, y: number, text: string } | null>(null);
  
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

  const spawnParticle = (x: number, y: number, color: string, speedFactor: number, xBias: number = 0, type: 'exhaust' | 'spark' | 'speedline' = 'exhaust') => {
    particlesRef.current.push({
      id: Math.random(),
      x,
      y,
      vx: type === 'speedline' ? 0 : ((Math.random() - 0.5) * 6) + (xBias * 2),
      vy: type === 'speedline' ? 40 : (12 + speedFactor * 12),
      life: type === 'speedline' ? 0.3 : 1,
      size: type === 'speedline' ? 1 : (2 + Math.random() * 4),
      color,
      type
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
        const moveSpeed = 85;
        const newX = playerXRef.current + moveDir * moveSpeed * dt;
        playerXRef.current = Math.max(10, Math.min(90, newX));
        setPlayerX(playerXRef.current);
        setPlayerTilt(moveDir * 20);
      } else {
        setPlayerTilt(prev => prev * 0.85);
      }

      const currentDifficulty = 1 + (scoreRef.current / 12000);
      const baseSpeed = 240 * currentDifficulty;
      scoreRef.current += dt * (baseSpeed / 5);
      setScore(Math.floor(scoreRef.current));
      
      const warp = Math.floor(scoreRef.current / 3000) % 2 === 1;
      setIsWarping(warp);
      setParallaxY(prev => (prev + baseSpeed * dt * 0.6) % 1000);

      if (shieldRef.current > 0) {
        shieldRef.current -= dt;
        setShieldActive(Math.max(0, shieldRef.current));
      }

      // Update Particles
      particlesRef.current = particlesRef.current
        .map(p => ({ 
          ...p, 
          x: p.type === 'speedline' ? p.x : p.x + p.vx * dt * 10, 
          y: p.y + p.vy * dt * 10, 
          life: p.life - dt * (p.type === 'speedline' ? 4 : 2.5) 
        }))
        .filter(p => p.life > 0);

      // Speed-reactive particles
      if (Math.random() > (warp ? 0.05 : 0.4)) {
        spawnParticle(
          playerXRef.current + (Math.random() - 0.5) * 6, 
          85, 
          shieldRef.current > 0 ? '#22d3ee' : (warp ? '#f472b6' : '#6366f1'), 
          currentDifficulty,
          -moveDir,
          'exhaust'
        );
      }

      // High-speed lines when warping
      if (warp && Math.random() > 0.7) {
        spawnParticle(
          Math.random() * 100,
          -10,
          '#ffffff',
          currentDifficulty,
          0,
          'speedline'
        );
      }

      // Update Entities
      const nextEntities = entitiesRef.current
        .map(e => ({ ...e, y: e.y + (baseSpeed * e.speedMult) * dt * 0.18 }))
        .filter(e => e.y < 120);

      const spawnThreshold = Math.max(15, 30 - (scoreRef.current / 500));
      if (nextEntities.length < 7 && (nextEntities.length === 0 || nextEntities[nextEntities.length - 1].y > spawnThreshold)) {
        nextEntities.push(spawnEntity());
      }

      const px = playerXRef.current;
      const pW = 4.8;
      const pH = 4.5;
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
              triggerShake(20);
            } else endGame();
          } else if (e.type === 'core') {
            scoreRef.current += 2000;
            e.y = 200;
            audio.playEffect(1200, 'triangle', 0.1);
          } else if (e.type === 'shield') {
            shieldRef.current = 6.0;
            setShieldActive(6.0);
            e.y = 200;
            audio.playEffect(550, 'sine', 0.4);
          }
        } else if (e.type === 'obstacle' && hitY) {
          const distToLeft = Math.abs((px - pW) - (e.x + e.w));
          const distToRight = Math.abs((px + pW) - e.x);
          const minHozDist = Math.min(distToLeft, distToRight);
          
          if (minHozDist < 4.2) {
             if (!nearMissMsg) {
                setDodgeFeedback({ x: px, y: pY - 10, text: 'PERFECT DODGE!' });
                setTimeout(() => setDodgeFeedback(null), 800);
             }
             scoreRef.current += 30; 
             foundNearMiss = true;
             if (Math.random() > 0.3) spawnParticle(px + (distToLeft < distToRight ? -pW : pW), pY, '#06b6d4', 3.0, 0, 'spark');
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
  }, [isPlaying, spawnEntity, endGame, nearMissMsg]);

  const handleInput = (clientX: number, rectWidth: number, rectLeft: number) => {
    if (keysPressed.current.size > 0) return;
    const x = ((clientX - rectLeft) / rectWidth) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    setPlayerTilt((clampedX - playerXRef.current) * 3);
    playerXRef.current = clampedX;
    setPlayerX(clampedX);
  };

  return (
    <div 
      className={`relative w-full max-w-lg h-[650px] rounded-[3.5rem] overflow-hidden cursor-none shadow-2xl mx-auto border-4 border-white/15 transition-all duration-700 ${isWarping ? 'brightness-125 saturate-150' : ''}`}
      style={{ transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)`, perspective: '1400px' }}
      onMouseMove={(e) => handleInput(e.clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
      onTouchMove={(e) => handleInput(e.touches[0].clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
    >
      {/* Background Multi-layered Parallax */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isWarping ? 'bg-indigo-950' : 'bg-[#020617]'}`} />
      
      {/* Layer 1: Stars */}
      <div className="absolute inset-[-50%] opacity-25 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 120px, #fff, rgba(0,0,0,0))',
             backgroundSize: '250px 250px',
             transform: `translateY(${parallaxY * 0.15}px)`
           }} 
      />

      {/* Layer 2: Distant Buildings/Structures */}
      <div className="absolute inset-x-0 bottom-0 top-0 opacity-15 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(to top, #4338ca 0%, transparent 60%)',
             backgroundSize: '400px 100%',
             transform: `translateY(${parallaxY * 0.4}px)`
           }}>
        <div className="absolute inset-0 bg-grid-white/5" style={{ backgroundSize: '100px 200px' }} />
      </div>

      {/* Nebula Gloom */}
      <div className={`absolute inset-0 transition-all duration-1000 ${isWarping ? 'opacity-40 mix-blend-screen' : 'opacity-15'}`} 
           style={{ 
             background: 'radial-gradient(circle at 50% 50%, #6366f1 0%, #a855f7 40%, transparent 80%)',
             filter: 'blur(100px)',
             transform: `translateY(${parallaxY * 0.3}px)`
           }} 
      />

      {/* Grid Floor with Perspective */}
      <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(75deg)' }}>
        <div 
          className={`absolute inset-[-200%] transition-opacity duration-1000 ${isWarping ? 'bg-grid-indigo-400/40' : 'bg-grid-indigo-500/10'}`} 
          style={{ 
            backgroundSize: '45px 45px',
            transform: `translateY(${parallaxY}px)`
          }} 
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-indigo-500/50 to-transparent transition-all duration-1000 ${isWarping ? 'opacity-100 scale-110' : 'opacity-0'}`} />
      </div>

      {/* Reactive Particles & Speed Lines */}
      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute pointer-events-none"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            width: p.type === 'speedline' ? '1px' : `${p.size}px`, 
            height: p.type === 'speedline' ? '60px' : `${p.size}px`, 
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: p.type === 'speedline' ? `0 0 10px white` : `0 0 ${p.size * 3}px ${p.color}`,
            transform: p.type === 'speedline' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
            zIndex: 5
          }}
        />
      ))}

      {/* UI Elements */}
      <div className="absolute top-10 left-8 right-8 z-50 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.5em] mb-1">Blitz Vector</span>
          <p className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300 ${nearMissMsg ? 'text-cyan-400 scale-110' : (isWarping ? 'text-indigo-400' : 'text-white')}`}>
            {score.toLocaleString()}<span className="text-xl opacity-40 ml-1">m</span>
          </p>
          {nearMissMsg && (
            <div className="flex items-center gap-2 mt-3 px-4 py-1.5 bg-cyan-500/20 border border-cyan-400/40 rounded-xl animate-pulse">
              <i className="fas fa-bolt text-cyan-400 text-xs"></i>
              <span className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">FOCUS ACCELERATED</span>
            </div>
          )}
        </div>

        {shieldActive > 0 && (
          <div className="px-6 py-2.5 rounded-2xl border-2 border-cyan-400/60 bg-cyan-400/25 backdrop-blur-2xl animate-bounce flex items-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
            <i className="fas fa-shield-halved text-cyan-300 text-sm"></i>
            <span className="text-[12px] font-black text-cyan-100 uppercase tracking-[0.2em]">{shieldActive.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {/* Dodge Text Pop-ups */}
      {dodgeFeedback && (
        <div 
          className="absolute z-[120] pointer-events-none animate-in fade-out slide-out-to-top-12 duration-700"
          style={{ left: `${dodgeFeedback.x}%`, top: `${dodgeFeedback.y}%` }}
        >
          <span className="text-2xl font-black italic text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] uppercase tracking-tighter whitespace-nowrap">
            {dodgeFeedback.text}
          </span>
        </div>
      )}

      {/* Game Entities */}
      {entities.map((e) => (
        <div 
          key={e.id}
          className={`absolute rounded-2xl transition-all duration-75 ${
            e.type === 'obstacle' ? 'bg-gradient-to-b from-rose-500 to-rose-950 border-t-2 border-rose-400/50 shadow-[0_0_25px_rgba(244,63,94,0.4)]' :
            e.type === 'core' ? 'bg-indigo-500 animate-spin rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.8)]' :
            'bg-cyan-400 animate-pulse rounded-full shadow-[0_0_50px_rgba(34,211,238,0.8)]'
          }`}
          style={{ 
            left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h}%`,
            transform: `perspective(500px) rotateX(${e.y / 2.5}deg) scale(${nearMissMsg && e.y > 75 ? 1.1 : 1})`,
            zIndex: Math.floor(e.y)
          }}
        >
          {e.type !== 'obstacle' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[12px]">
              <i className={`fas ${e.type === 'core' ? 'fa-bolt' : 'fa-shield'}`}></i>
            </div>
          )}
          {e.type === 'obstacle' && <div className="absolute inset-0 bg-grid-white/5 opacity-40 pointer-events-none rounded-2xl" />}
        </div>
      ))}

      {/* Player Ship */}
      <div 
        className="absolute bottom-[10%] w-20 h-20 z-[110] transition-all duration-100"
        style={{ 
          left: `${playerX}%`, 
          transform: `translateX(-50%) rotateY(${playerTilt}deg) rotateZ(${playerTilt / 5}deg) scale(${nearMissMsg ? 1.2 : 1})` 
        }}
      >
        {/* Glow Aura - Chrome Aberration during Dodge */}
        <div className={`absolute inset-[-80%] rounded-full blur-[40px] transition-all duration-500 ${shieldActive > 0 ? 'bg-cyan-400/70 scale-150' : (isWarping ? 'bg-indigo-500/50' : (nearMissMsg ? 'bg-cyan-500/40 animate-pulse' : 'bg-transparent'))}`} />
        
        <div className={`relative w-full h-full bg-gradient-to-b from-slate-100 to-slate-400 dark:from-indigo-300 dark:to-indigo-700 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-2 border-white/40 overflow-hidden ${nearMissMsg ? 'ring-4 ring-cyan-400 animate-pulse' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/35 skew-x-12" />
          <i className="fas fa-fighter-jet text-slate-900 dark:text-white text-4xl transform -rotate-45"></i>
          
          <div className="absolute -bottom-4 flex gap-6">
             <div className={`w-3 h-12 bg-cyan-400 blur-md rounded-full animate-pulse shadow-[0_0_20px_cyan] transition-all ${isWarping ? 'h-24 brightness-200' : ''}`} />
             <div className={`w-3 h-12 bg-cyan-400 blur-md rounded-full animate-pulse shadow-[0_0_20px_cyan] transition-all ${isWarping ? 'h-24 brightness-200' : ''}`} />
          </div>
        </div>
        
        {/* Motion Ghosting on high movement */}
        {Math.abs(playerTilt) > 15 && (
           <div className="absolute inset-0 bg-white/20 blur-xl scale-125 -z-10 animate-pulse rounded-3xl" />
        )}
      </div>

      {/* Screen Effects Layer */}
      <div className="absolute inset-0 pointer-events-none z-[130] overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-500 ${nearMissMsg ? 'bg-cyan-500/5' : 'bg-transparent'}`} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.08)_50%)] bg-[length:100%_3px]" />
        <div className={`absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.9)] transition-all duration-1000 ${isWarping ? 'opacity-50' : 'opacity-100'}`} />
        
        {/* Chromatic Aberration during Dodge */}
        {nearMissMsg && (
          <div className="absolute inset-0 border-[10px] border-cyan-400/20 blur-md animate-pulse" />
        )}
      </div>

      <style>{`
        .bg-grid-white\/5 {
          background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
        }
        .bg-grid-white\/10 {
          background-image: linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px);
        }
        .bg-grid-indigo-500\/10 {
          background-image: linear-gradient(to right, rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(99,102,241,0.1) 1px, transparent 1px);
        }
        .bg-grid-indigo-400\/40 {
          background-image: linear-gradient(to right, rgba(129,140,248,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(129,140,248,0.4) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default BlitzRunner;
