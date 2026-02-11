
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
      kickGain.gain.setValueAtTime(0.3, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
      kick.connect(kickGain);
      kickGain.connect(this.ctx.destination);
      kick.start(t);
      kick.stop(t + 0.15);

      // Synth Chord
      if (Math.random() > 0.6) {
        const chord = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        chord.type = 'sawtooth';
        chord.frequency.setValueAtTime(220, t + 0.2);
        chordGain.gain.setValueAtTime(0.05, t + 0.2);
        chordGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        chord.connect(chordGain);
        chordGain.connect(this.ctx.destination);
        chord.start(t + 0.2);
        chord.stop(t + 0.5);
      }

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
    g.gain.setValueAtTime(0.2, t);
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
}

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerX, setPlayerX] = useState(50);
  const [playerTilt, setPlayerTilt] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [score, setScore] = useState(0);
  const [shieldActive, setShieldActive] = useState(0); // Time remaining
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [shake, setShake] = useState(0);
  
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(Date.now());
  const scoreRef = useRef(0);
  const playerXRef = useRef(50);
  const entitiesRef = useRef<Entity[]>([]);
  const isGameOverRef = useRef(false);
  const shieldRef = useRef(0);

  const spawnEntity = useCallback((): Entity => {
    const id = Math.random();
    const rand = Math.random();
    let type: EntityType = 'obstacle';
    let w = 25 + Math.random() * 30;
    
    if (rand > 0.95) {
      type = 'shield';
      w = 8;
    } else if (rand > 0.85) {
      type = 'core';
      w = 6;
    }

    const x = Math.random() * (100 - w);
    return { id, type, x, y: -20, w, h: type === 'obstacle' ? 5 : 8 };
  }, []);

  const triggerShake = (intensity: number) => {
    setShake(intensity);
    setTimeout(() => setShake(0), 150);
  };

  const endGame = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    audio.playEffect(100, 'sawtooth', 0.8);
    audio.stopMusic();
    if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
    onGameOver(Math.floor(scoreRef.current));
  }, [onGameOver]);

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
    entitiesRef.current = [];
    lastUpdate.current = Date.now();
    audio.startMusic();

    const gameLoop = () => {
      const now = Date.now();
      const dt = (now - lastUpdate.current) / 1000;
      lastUpdate.current = now;

      // Speed increases with score
      const baseSpeed = 300 + (scoreRef.current / 50);
      scoreRef.current += dt * (baseSpeed / 10);
      setScore(Math.floor(scoreRef.current));
      
      if (shieldRef.current > 0) {
        shieldRef.current -= dt;
        setShieldActive(Math.max(0, shieldRef.current));
      }

      const nextEntities = entitiesRef.current
        .map(e => ({ ...e, y: e.y + baseSpeed * dt * 0.2 }))
        .filter(e => e.y < 120);

      if (nextEntities.length < 5 && (nextEntities.length === 0 || nextEntities[nextEntities.length - 1].y > 30)) {
        nextEntities.push(spawnEntity());
      }

      // Collision & Near Miss
      const px = playerXRef.current;
      const pW = 8;
      const pH = 8;
      const pY = 85;

      nextEntities.forEach(e => {
        const hitX = px + pW > e.x && px - pW < e.x + e.w;
        const hitY = pY + pH > e.y && pY < e.y + e.h;

        if (hitX && hitY) {
          if (e.type === 'obstacle') {
            if (shieldRef.current > 0) {
              shieldRef.current = 0;
              setShieldActive(0);
              e.y = 200; // Remove obstacle
              audio.playEffect(800, 'sine', 0.2);
              triggerShake(15);
            } else {
              endGame();
            }
          } else if (e.type === 'core') {
            scoreRef.current += 1000;
            e.y = 200;
            audio.playEffect(1200, 'triangle', 0.1);
          } else if (e.type === 'shield') {
            shieldRef.current = 5.0;
            setShieldActive(5.0);
            e.y = 200;
            audio.playEffect(600, 'sine', 0.4);
          }
        } else if (e.type === 'obstacle' && hitY) {
          // Near miss detection
          const distance = Math.min(Math.abs(px - e.x), Math.abs(px - (e.x + e.w)));
          if (distance < 12) {
            scoreRef.current += 10;
            setNearMissMsg(true);
            setTimeout(() => setNearMissMsg(false), 500);
          }
        }
      });

      entitiesRef.current = nextEntities;
      setEntities([...nextEntities]);
      gameRef.current = requestAnimationFrame(gameLoop);
    };

    gameRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
      audio.stopMusic();
    };
  }, [isPlaying, spawnEntity, endGame]);

  const handleInput = (clientX: number, rectWidth: number, rectLeft: number) => {
    const x = ((clientX - rectLeft) / rectWidth) * 100;
    const clampedX = Math.max(8, Math.min(92, x));
    const delta = clampedX - playerXRef.current;
    setPlayerTilt(delta * 2);
    setPlayerX(clampedX);
    playerXRef.current = clampedX;
  };

  return (
    <div 
      className="relative w-full max-w-lg h-[600px] rounded-[2.5rem] overflow-hidden cursor-none shadow-2xl mx-auto border-4 border-white/5 group"
      style={{ 
        transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)`,
        perspective: '1000px'
      }}
      onMouseMove={(e) => handleInput(e.clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
      onTouchMove={(e) => handleInput(e.touches[0].clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
    >
      {/* Background Deep Space */}
      <div className="absolute inset-0 bg-[#020617]" />
      
      {/* Perspective Grid */}
      <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(60deg)' }}>
        <div 
          className="absolute inset-[-100%] bg-grid-white/[0.05]" 
          style={{ 
            backgroundSize: '40px 40px',
            animation: `grid-scroll ${2 / (1 + score/5000)}s linear infinite` 
          }} 
        />
      </div>

      {/* Speed Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         {[...Array(6)].map((_, i) => (
           <div 
            key={i} 
            className="absolute bg-white/40 w-0.5"
            style={{ 
              height: '100px',
              left: `${15 + i * 14}%`,
              top: '-100px',
              animation: `speed-line ${0.5 + Math.random()}s linear infinite`,
              animationDelay: `${Math.random()}s`
            }}
           />
         ))}
      </div>

      {/* HUD: Score & Alerts */}
      <div className="absolute top-8 left-8 right-8 z-40 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.3em] mb-1">Blitz Vector</span>
          <p className="text-5xl font-black dark:text-white text-slate-900 italic tracking-tighter tabular-nums drop-shadow-lg">
            {score.toLocaleString()}<span className="text-xl text-indigo-500 ml-1">m</span>
          </p>
          {nearMissMsg && (
            <span className="text-indigo-400 font-black text-xs uppercase tracking-widest mt-2 animate-bounce">
              + FOCUS BONUS
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.3em] mb-1">System Status</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={`w-3 h-5 rounded-sm border border-white/10 ${score > i * 1000 ? 'bg-cyan-500 shadow-[0_0_10px_cyan]' : 'bg-white/5'}`} 
                />
              ))}
            </div>
          </div>
          
          {shieldActive > 0 && (
            <div className="glass-card px-4 py-1.5 rounded-xl border-cyan-500/40 bg-cyan-500/10 animate-pulse flex items-center gap-2">
              <i className="fas fa-shield-halved text-cyan-400 text-xs"></i>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Shield: {shieldActive.toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Entities (Obstacles & Powerups) */}
      {entities.map((e) => (
        <div 
          key={e.id}
          className={`absolute rounded-xl transition-all duration-75 ${
            e.type === 'obstacle' ? 'bg-gradient-to-b from-rose-600 to-rose-900 border-t-2 border-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.4)]' :
            e.type === 'core' ? 'bg-indigo-500 animate-spin rounded-lg shadow-[0_0_25px_rgba(99,102,241,0.8)]' :
            'bg-cyan-400 animate-pulse rounded-full shadow-[0_0_40px_rgba(34,211,238,1)]'
          }`}
          style={{ 
            left: `${e.x}%`, 
            top: `${e.y}%`, 
            width: `${e.w}%`,
            height: `${e.h}%`,
            transform: `perspective(500px) rotateX(${e.y / 2}deg)`
          }}
        >
          {e.type === 'core' && <i className="fas fa-bolt text-white text-[10px] absolute inset-0 flex items-center justify-center"></i>}
          {e.type === 'shield' && <i className="fas fa-shield text-white text-[10px] absolute inset-0 flex items-center justify-center"></i>}
          {e.type === 'obstacle' && <div className="absolute inset-0 bg-grid-white/5 pointer-events-none" />}
        </div>
      ))}

      {/* Player Runner */}
      <div 
        className={`absolute bottom-[12%] w-16 h-16 z-30 transition-transform duration-75`}
        style={{ 
          left: `${playerX}%`, 
          transform: `translateX(-50%) rotateY(${playerTilt}deg) rotateZ(${playerTilt / 4}deg)` 
        }}
      >
        {/* Glow & Shield Orb */}
        <div className={`absolute inset-[-20%] rounded-full blur-2xl transition-all duration-300 ${shieldActive > 0 ? 'bg-cyan-400/40 opacity-100 scale-125' : 'bg-indigo-500/20 opacity-0'}`} />
        
        {/* The Ship */}
        <div className="relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-400 dark:from-indigo-400 dark:to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20" />
          <i className="fas fa-fighter-jet text-slate-800 dark:text-white text-3xl"></i>
          
          {/* Engines */}
          <div className="absolute -bottom-2 flex gap-4">
             <div className="w-2 h-6 bg-cyan-400 blur-sm rounded-full animate-pulse" />
             <div className="w-2 h-6 bg-cyan-400 blur-sm rounded-full animate-pulse" />
          </div>
        </div>

        {/* Trail Particles */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-24 bg-gradient-to-t from-transparent via-cyan-500/20 to-cyan-500/60 blur-md rounded-full" />
      </div>

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {/* Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
        {/* CRT Vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Footer Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="glass-card px-6 py-2 rounded-full border-white/10 backdrop-blur-md flex items-center gap-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-left-right text-indigo-400 text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Steer</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <i className="fas fa-bolt text-amber-400 text-[10px]"></i>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Dodge</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes grid-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(40px); }
        }
        @keyframes speed-line {
          from { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          to { transform: translateY(800px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BlitzRunner;
