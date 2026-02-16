
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
  const [entities, setEntities] = useState<Entity[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [shieldActive, setShieldActive] = useState(0);
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [shake, setShake] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [dodgeFeedback, setDodgeFeedback] = useState<{ x: number, y: number, text: string } | null>(null);
  const [needsMotionPermission, setNeedsMotionPermission] = useState(false);
  
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const scoreRef = useRef(0);
  const playerXRef = useRef(50);
  const entitiesRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const isGameOverRef = useRef(false);
  const shieldRef = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  
  // Touch & Tilt Refs
  const touchLastX = useRef<number | null>(null);
  const deviceTiltRef = useRef(0);
  const smoothedTiltRef = useRef(0);

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

  const requestMotionPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setNeedsMotionPermission(false);
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } catch (e) {
        console.error('Motion permission failed:', e);
      }
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
      setNeedsMotionPermission(false);
    }
  };

  const handleOrientation = (e: DeviceOrientationEvent) => {
    if (e.gamma !== null) {
      // Gamma is left/right tilt [-90, 90]
      const tilt = Math.max(-45, Math.min(45, e.gamma));
      deviceTiltRef.current = tilt;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => keysPressed.current.add(e.key.toLowerCase());
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key.toLowerCase());
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Auto-check motion permission need
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setNeedsMotionPermission(true);
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('deviceorientation', handleOrientation);
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
        const moveSpeed = 100;
        const newX = playerXRef.current + moveDir * moveSpeed * dt;
        playerXRef.current = Math.max(10, Math.min(90, newX));
        setPlayerX(playerXRef.current);
      }

      // Smoothly interpolate tilt visual for ship
      const targetTilt = (moveDir * 25) + deviceTiltRef.current;
      smoothedTiltRef.current += (targetTilt - smoothedTiltRef.current) * 0.15;
      setPlayerTilt(smoothedTiltRef.current);

      const currentDifficulty = 1 + (scoreRef.current / 15000);
      const baseSpeed = 260 * currentDifficulty;
      scoreRef.current += dt * (baseSpeed / 6);
      setScore(Math.floor(scoreRef.current));
      
      const warp = Math.floor(scoreRef.current / 4000) % 2 === 1;
      setIsWarping(warp);
      setParallaxY(prev => (prev + baseSpeed * dt * 0.7) % 1000);

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
        spawnParticle(
          playerXRef.current + (Math.random() - 0.5) * 6, 
          85, 
          shieldRef.current > 0 ? '#22d3ee' : (warp ? '#f472b6' : '#6366f1'), 
          currentDifficulty,
          -moveDir,
          'exhaust'
        );
      }

      if (warp && Math.random() > 0.6) {
        spawnParticle(Math.random() * 100, -10, '#ffffff', currentDifficulty, 0, 'speedline');
      }

      const nextEntities = entitiesRef.current
        .map(e => ({ ...e, y: e.y + (baseSpeed * e.speedMult) * dt * 0.2 }))
        .filter(e => e.y < 120);

      const spawnThreshold = Math.max(12, 28 - (scoreRef.current / 600));
      if (nextEntities.length < 8 && (nextEntities.length === 0 || nextEntities[nextEntities.length - 1].y > spawnThreshold)) {
        nextEntities.push(spawnEntity());
      }

      const px = playerXRef.current;
      const pW = 5.0;
      const pH = 4.8;
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
            scoreRef.current += 1500;
            e.y = 200;
            audio.playEffect(1200, 'triangle', 0.1);
          } else if (e.type === 'shield') {
            shieldRef.current = 7.0;
            setShieldActive(7.0);
            e.y = 200;
            audio.playEffect(550, 'sine', 0.4);
          }
        } else if (e.type === 'obstacle' && hitY) {
          const distToLeft = Math.abs((px - pW) - (e.x + e.w));
          const distToRight = Math.abs((px + pW) - e.x);
          const minHozDist = Math.min(distToLeft, distToRight);
          
          if (minHozDist < 4.5) {
             if (!nearMissMsg) {
                setDodgeFeedback({ x: px, y: pY - 10, text: 'NEXUS DODGE!' });
                setTimeout(() => setDodgeFeedback(null), 800);
             }
             scoreRef.current += 50; 
             foundNearMiss = true;
             if (Math.random() > 0.4) spawnParticle(px + (distToLeft < distToRight ? -pW : pW), pY, '#06b6d4', 3.5, 0, 'spark');
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

  // Enhanced Mobile Relative Swipe Control
  const handleTouchStart = (e: React.TouchEvent) => {
    touchLastX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchLastX.current === null) return;
    const currentTouchX = e.touches[0].clientX;
    const deltaX = currentTouchX - touchLastX.current;
    
    // Scale delta to game width coordinate space
    const rect = e.currentTarget.getBoundingClientRect();
    const movementX = (deltaX / rect.width) * 110; // Slightly amplified for sensitivity
    
    const newX = Math.max(10, Math.min(90, playerXRef.current + movementX));
    playerXRef.current = newX;
    setPlayerX(newX);
    
    touchLastX.current = currentTouchX;
  };

  const handleTouchEnd = () => {
    touchLastX.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    playerXRef.current = clampedX;
    setPlayerX(clampedX);
  };

  return (
    <div 
      className={`relative w-full max-w-lg h-[650px] rounded-[3.5rem] overflow-hidden cursor-none shadow-2xl mx-auto border-4 border-white/10 transition-all duration-700 ${isWarping ? 'brightness-125 saturate-150' : ''}`}
      style={{ transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)`, perspective: '1400px' }}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`absolute inset-0 transition-colors duration-1000 ${isWarping ? 'bg-indigo-950' : 'bg-[#020617]'}`} />
      
      <div className="absolute inset-[-50%] opacity-20 pointer-events-none" 
           style={{ 
             backgroundImage: 'radial-gradient(1.5px 1.5px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 120px, #fff, rgba(0,0,0,0))',
             backgroundSize: '200px 200px',
             transform: `translateY(${parallaxY * 0.2}px)`
           }} 
      />

      <div className="absolute inset-x-0 bottom-0 top-0 opacity-10 pointer-events-none"
           style={{
             backgroundImage: 'linear-gradient(to top, #4338ca 0%, transparent 60%)',
             transform: `translateY(${parallaxY * 0.4}px)`
           }}>
        <div className="absolute inset-0 bg-grid-white/5" style={{ backgroundSize: '100px 200px' }} />
      </div>

      <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(75deg)' }}>
        <div 
          className={`absolute inset-[-200%] transition-opacity duration-1000 ${isWarping ? 'bg-grid-indigo-400/30' : 'bg-grid-indigo-500/5'}`} 
          style={{ 
            backgroundSize: '50px 50px',
            transform: `translateY(${parallaxY}px)`
          }} 
        />
      </div>

      {particles.map(p => (
        <div 
          key={p.id}
          className="absolute pointer-events-none"
          style={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            width: p.type === 'speedline' ? '1px' : `${p.size}px`, 
            height: p.type === 'speedline' ? '80px' : `${p.size}px`, 
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: p.type === 'speedline' ? `0 0 10px white` : `0 0 ${p.size * 2}px ${p.color}`,
            transform: p.type === 'speedline' ? 'translate(-50%, -100%)' : 'translate(-50%, -50%)',
            zIndex: 5
          }}
        />
      ))}

      <div className="absolute top-10 left-8 right-8 z-50 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mb-1">Blitz Sector</span>
          <p className={`text-6xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl transition-all duration-300 ${nearMissMsg ? 'text-cyan-400 scale-105' : (isWarping ? 'text-indigo-400' : 'text-white')}`}>
            {score.toLocaleString()}
          </p>
        </div>

        {shieldActive > 0 && (
          <div className="px-6 py-2.5 rounded-2xl border-2 border-cyan-400/60 bg-cyan-400/20 backdrop-blur-xl animate-bounce flex items-center gap-3 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
            <i className="fas fa-shield-halved text-cyan-300"></i>
            <span className="text-sm font-black text-cyan-100 uppercase tracking-widest">{shieldActive.toFixed(1)}s</span>
          </div>
        )}
      </div>

      {needsMotionPermission && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md p-8 text-center pointer-events-auto">
          <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 text-3xl mb-6 border border-indigo-400/30">
             <i className="fas fa-mobile-screen-button animate-bounce"></i>
          </div>
          <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tighter">Enable Cockpit Tilt</h3>
          <p className="text-slate-400 text-xs mb-8 max-w-xs leading-relaxed">Allow cockpit stabilization to use your device's physical orientation to bank and roll the ship.</p>
          <button 
            onClick={requestMotionPermission}
            className="px-10 py-4 bg-indigo-600 text-white font-black uppercase text-xs rounded-2xl shadow-xl shadow-indigo-500/30 active:scale-95 transition-all"
          >
            Authorize Motion
          </button>
        </div>
      )}

      {dodgeFeedback && (
        <div 
          className="absolute z-[120] pointer-events-none animate-in fade-out slide-out-to-top-12 duration-700"
          style={{ left: `${dodgeFeedback.x}%`, top: `${dodgeFeedback.y}%` }}
        >
          <span className="text-2xl font-black italic text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)] uppercase tracking-tighter whitespace-nowrap">
            {dodgeFeedback.text}
          </span>
        </div>
      )}

      {entities.map((e) => (
        <div 
          key={e.id}
          className={`absolute rounded-2xl transition-all duration-75 ${
            e.type === 'obstacle' ? 'bg-gradient-to-b from-rose-500 to-rose-950 border-t-2 border-rose-400/40 shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
            e.type === 'core' ? 'bg-indigo-500 animate-spin rounded-xl shadow-[0_0_30px_rgba(99,102,241,0.6)]' :
            'bg-cyan-400 animate-pulse rounded-full shadow-[0_0_40px_rgba(34,211,238,0.6)]'
          }`}
          style={{ 
            left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h}%`,
            transform: `perspective(500px) rotateX(${e.y / 2.5}deg)`,
            zIndex: Math.floor(e.y)
          }}
        >
          {e.type !== 'obstacle' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
              <i className={`fas ${e.type === 'core' ? 'fa-bolt' : 'fa-shield'}`}></i>
            </div>
          )}
        </div>
      ))}

      <div 
        className="absolute bottom-[10%] w-20 h-20 z-[110] transition-transform duration-100 ease-out"
        style={{ 
          left: `${playerX}%`, 
          transform: `translateX(-50%) rotateY(${playerTilt}deg) rotateZ(${playerTilt / 4}deg) scale(${nearMissMsg ? 1.15 : 1})` 
        }}
      >
        <div className={`absolute inset-[-60%] rounded-full blur-[30px] transition-all duration-500 ${shieldActive > 0 ? 'bg-cyan-400/60 scale-125' : (isWarping ? 'bg-indigo-500/40' : (nearMissMsg ? 'bg-cyan-500/30' : 'bg-transparent'))}`} />
        <div className={`relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-400 dark:from-indigo-300 dark:to-indigo-800 rounded-3xl shadow-2xl flex flex-col items-center justify-center border-2 border-white/30 overflow-hidden ${nearMissMsg ? 'ring-2 ring-cyan-400 animate-pulse' : ''}`}>
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 skew-x-12" />
          <i className="fas fa-fighter-jet text-slate-900 dark:text-white text-4xl transform -rotate-45"></i>
          <div className="absolute -bottom-4 flex gap-4">
             <div className={`w-2 h-10 bg-cyan-400 blur-md rounded-full animate-pulse transition-all ${isWarping ? 'h-20' : ''}`} />
             <div className={`w-2 h-10 bg-cyan-400 blur-md rounded-full animate-pulse transition-all ${isWarping ? 'h-20' : ''}`} />
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-[130] overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-500 ${nearMissMsg ? 'bg-cyan-500/5' : 'bg-transparent'}`} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_2px]" />
        <div className={`absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] transition-all duration-1000 ${isWarping ? 'opacity-40' : 'opacity-80'}`} />
      </div>
    </div>
  );
};

export default BlitzRunner;
