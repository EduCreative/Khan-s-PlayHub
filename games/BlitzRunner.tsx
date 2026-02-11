
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

      // Synth Chord
      if (Math.random() > 0.7) {
        const chord = this.ctx.createOscillator();
        const chordGain = this.ctx.createGain();
        chord.type = 'sawtooth';
        chord.frequency.setValueAtTime(220, t + 0.2);
        chordGain.gain.setValueAtTime(0.03, t + 0.2);
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
  speedMult: number; // Unique speed multiplier for variance
}

const BlitzRunner: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [playerX, setPlayerX] = useState(50);
  const [playerTilt, setPlayerTilt] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [score, setScore] = useState(0);
  const [shieldActive, setShieldActive] = useState(0);
  const [nearMissMsg, setNearMissMsg] = useState(false);
  const [shake, setShake] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  
  const gameRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);
  const scoreRef = useRef(0);
  const playerXRef = useRef(50);
  const entitiesRef = useRef<Entity[]>([]);
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
    // Varied widths: some small slivers, some wide barriers
    let w = type === 'obstacle' ? (15 + Math.random() * 35) : 6;
    
    if (rand > 0.96) {
      type = 'shield';
      w = 6;
    } else if (rand > 0.88) {
      type = 'core';
      w = 5;
    }

    const x = Math.random() * (100 - w);
    // Speed variance: obstacles can be slightly faster or slower than base
    const speedMult = type === 'obstacle' ? (0.85 + Math.random() * 0.3) : 1.0;

    return { id, type, x, y: -15, w, h: type === 'obstacle' ? 4 : 6, speedMult };
  }, []);

  const endGame = useCallback(() => {
    if (isGameOverRef.current) return;
    isGameOverRef.current = true;
    audio.playEffect(80, 'sawtooth', 0.6);
    audio.stopMusic();
    if (gameRef.current !== null) cancelAnimationFrame(gameRef.current);
    onGameOver(Math.floor(scoreRef.current));
  }, [onGameOver]);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

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
    entitiesRef.current = [];
    lastUpdate.current = performance.now();
    audio.startMusic();

    const gameLoop = (time: number) => {
      let dt = (time - lastUpdate.current) / 1000;
      if (dt > 0.1) dt = 0.016; 
      lastUpdate.current = time;

      // Handle Keyboard Movement
      let moveDir = 0;
      if (keysPressed.current.has('arrowleft') || keysPressed.current.has('a')) moveDir -= 1;
      if (keysPressed.current.has('arrowright') || keysPressed.current.has('d')) moveDir += 1;

      if (moveDir !== 0) {
        const moveSpeed = 80; // Units per second
        const newX = playerXRef.current + moveDir * moveSpeed * dt;
        const clampedX = Math.max(10, Math.min(90, newX));
        playerXRef.current = clampedX;
        setPlayerX(clampedX);
        setPlayerTilt(moveDir * 15); // Lean when moving via keyboard
      } else {
        // Decay tilt when no keyboard input
        setPlayerTilt(prev => prev * 0.9);
      }

      const currentDifficulty = 1 + (scoreRef.current / 15000);
      const baseSpeed = 220 * currentDifficulty;
      
      scoreRef.current += dt * (baseSpeed / 5);
      setScore(Math.floor(scoreRef.current));
      
      const warp = Math.floor(scoreRef.current / 2500) % 2 === 1;
      setIsWarping(warp);

      if (shieldRef.current > 0) {
        shieldRef.current -= dt;
        setShieldActive(Math.max(0, shieldRef.current));
      }

      // Update Entities with individual speed multipliers
      const nextEntities = entitiesRef.current
        .map(e => ({ ...e, y: e.y + (baseSpeed * e.speedMult) * dt * 0.15 }))
        .filter(e => e.y < 110);

      const spawnThreshold = Math.max(18, 32 - (scoreRef.current / 600));
      if (nextEntities.length < 6 && (nextEntities.length === 0 || nextEntities[nextEntities.length - 1].y > spawnThreshold)) {
        nextEntities.push(spawnEntity());
      }

      const px = playerXRef.current;
      const pW = 4.5; // Tighter hitboxes
      const pH = 4;
      const pY = 82;

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
            } else {
              endGame();
            }
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
          // Robust Near Miss detection
          // Proximity score check
          const distToLeft = Math.abs((px - pW) - (e.x + e.w));
          const distToRight = Math.abs((px + pW) - e.x);
          const minHozDist = Math.min(distToLeft, distToRight);
          
          if (minHozDist < 3.5) {
             // Every frame the player stays close to an obstacle passing by, they gain bonus
             scoreRef.current += 15; 
             setNearMissMsg(true);
             // Subtle shake for visual feedback of near-miss tension
             if (Math.random() > 0.8) triggerShake(2);
          }
        }
      });

      // Clear near miss message if no obstacles are currently in the strike zone
      if (!nextEntities.some(e => e.type === 'obstacle' && pY + pH > e.y && pY < e.y + e.h && Math.min(Math.abs((px - pW) - (e.x + e.w)), Math.abs((px + pW) - e.x)) < 3.5)) {
        setNearMissMsg(false);
      }

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
    // Only process mouse/touch if no keyboard keys are held
    if (keysPressed.current.size > 0) return;
    
    const x = ((clientX - rectLeft) / rectWidth) * 100;
    const clampedX = Math.max(10, Math.min(90, x));
    const delta = clampedX - playerXRef.current;
    setPlayerTilt(delta * 2.5); 
    setPlayerX(clampedX);
    playerXRef.current = clampedX;
  };

  return (
    <div 
      className={`relative w-full max-w-lg h-[600px] rounded-[3rem] overflow-hidden cursor-none shadow-2xl mx-auto border-4 border-white/10 transition-all duration-700 ${isWarping ? 'brightness-125' : ''}`}
      style={{ 
        transform: `translate(${Math.random() * shake}px, ${Math.random() * shake}px)`,
        perspective: '1200px'
      }}
      onMouseMove={(e) => handleInput(e.clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
      onTouchMove={(e) => handleInput(e.touches[0].clientX, e.currentTarget.clientWidth, e.currentTarget.getBoundingClientRect().left)}
    >
      {/* Background Deep Space */}
      <div className={`absolute inset-0 transition-colors duration-1000 ${isWarping ? 'bg-[#0f172a]' : 'bg-[#020617]'}`} />
      
      {/* Perspective Grid */}
      <div className="absolute inset-0 origin-bottom" style={{ transform: 'rotateX(65deg)' }}>
        <div 
          className={`absolute inset-[-150%] transition-opacity duration-1000 ${isWarping ? 'bg-grid-indigo-500/10' : 'bg-grid-white/5'}`} 
          style={{ 
            backgroundSize: '40px 40px',
            animation: `grid-scroll ${isWarping ? 0.3 : 0.8}s linear infinite` 
          }} 
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-indigo-500/20 to-transparent transition-opacity duration-1000 ${isWarping ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Speed Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         {[...Array(8)].map((_, i) => (
           <div 
            key={i} 
            className="absolute bg-white/40 w-0.5"
            style={{ 
              height: '120px',
              left: `${10 + i * 12}%`,
              top: '-120px',
              animation: `speed-line ${0.3 + Math.random() * 0.4}s linear infinite`,
              animationDelay: `${Math.random()}s`
            }}
           />
         ))}
      </div>

      {/* HUD: Score & Alerts */}
      <div className="absolute top-8 left-8 right-8 z-40 flex justify-between items-start pointer-events-none">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mb-1">Blitz Distance</span>
          <p className={`text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl transition-colors duration-500 ${isWarping ? 'text-cyan-400' : 'text-white'}`}>
            {score.toLocaleString()}<span className="text-xl opacity-50 ml-1">m</span>
          </p>
          {nearMissMsg && (
            <span className="text-cyan-400 font-black text-[12px] uppercase tracking-[0.2em] mt-2 animate-pulse flex items-center gap-2">
              <i className="fas fa-bolt"></i> + FOCUS SCORE
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em] mb-1">Vector Integrity</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div 
                  key={i} 
                  className={`w-3 h-5 rounded-sm border border-white/20 transition-all duration-500 ${score > i * 1500 ? 'bg-cyan-500 shadow-[0_0_15px_cyan]' : 'bg-white/5'}`} 
                />
              ))}
            </div>
          </div>
          
          {shieldActive > 0 && (
            <div className="px-4 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-400/10 backdrop-blur-md animate-pulse flex items-center gap-2">
              <i className="fas fa-shield-halved text-cyan-400 text-xs"></i>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Phase: {shieldActive.toFixed(1)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Entities (Obstacles & Powerups) */}
      {entities.map((e) => (
        <div 
          key={e.id}
          className={`absolute rounded-xl transition-all duration-75 ${
            e.type === 'obstacle' ? 'bg-gradient-to-b from-rose-500 to-rose-900 border-t-2 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]' :
            e.type === 'core' ? 'bg-indigo-500 animate-spin rounded-lg shadow-[0_0_30px_indigo]' :
            'bg-cyan-400 animate-pulse rounded-full shadow-[0_0_40px_cyan]'
          }`}
          style={{ 
            left: `${e.x}%`, 
            top: `${e.y}%`, 
            width: `${e.w}%`,
            height: `${e.h}%`,
            transform: `perspective(400px) rotateX(${e.y / 2.5}deg)`
          }}
        >
          {e.type !== 'obstacle' && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
              <i className={`fas ${e.type === 'core' ? 'fa-bolt' : 'fa-shield'}`}></i>
            </div>
          )}
          {e.type === 'obstacle' && <div className="absolute inset-0 bg-grid-white/5 opacity-20 pointer-events-none" />}
        </div>
      ))}

      {/* Player Runner */}
      <div 
        className="absolute bottom-[12%] w-16 h-16 z-30 transition-all duration-75"
        style={{ 
          left: `${playerX}%`, 
          transform: `translateX(-50%) rotateY(${playerTilt}deg) rotateZ(${playerTilt / 3}deg)` 
        }}
      >
        <div className={`absolute inset-[-40%] rounded-full blur-3xl transition-all duration-300 ${shieldActive > 0 ? 'bg-cyan-400/40 opacity-100 scale-110' : 'bg-indigo-500/20 opacity-0'}`} />
        
        <div className="relative w-full h-full bg-gradient-to-b from-slate-200 to-slate-400 dark:from-indigo-400 dark:to-indigo-600 rounded-2xl shadow-2xl flex items-center justify-center border-2 border-white/30 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20" />
          <i className="fas fa-fighter-jet text-slate-800 dark:text-white text-3xl"></i>
          
          <div className="absolute -bottom-2 flex gap-4">
             <div className="w-2 h-8 bg-cyan-400 blur-sm rounded-full animate-pulse shadow-[0_0_10px_cyan]" />
             <div className="w-2 h-8 bg-cyan-400 blur-sm rounded-full animate-pulse shadow-[0_0_10px_cyan]" />
          </div>
        </div>

        <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-32 bg-gradient-to-t from-transparent via-cyan-500/20 to-cyan-500/60 blur-md rounded-full" />
      </div>

      {/* Warp Visual FX */}
      <div className={`absolute inset-0 pointer-events-none z-50 transition-opacity duration-1000 ${isWarping ? 'opacity-30' : 'opacity-0'}`}>
         <div className="absolute inset-0 border-[40px] border-cyan-500/10 blur-3xl" />
      </div>

      {/* Screen Effects */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]" />
        <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)]" />
      </div>

      {/* Footer Instructions */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full flex justify-center">
        <div className="glass-card px-8 py-2.5 rounded-full border-white/10 backdrop-blur-md flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
               <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded border border-white/30 text-[9px] font-bold">←</span>
               <span className="w-5 h-5 flex items-center justify-center bg-white/20 rounded border border-white/30 text-[9px] font-bold">→</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Move Vector</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <i className="fas fa-hand-pointer text-indigo-400 text-xs"></i>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Glide</span>
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
          40% { opacity: 1; }
          to { transform: translateY(800px); opacity: 0; }
        }
        .bg-grid-white\/5 {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
        }
        .bg-grid-indigo-500\/10 {
          background-image: 
            linear-gradient(to right, rgba(99,102,241,0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99,102,241,0.1) 1px, transparent 1px);
        }
      `}</style>
    </div>
  );
};

export default BlitzRunner;
