import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';

interface NeonRacerProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  sfxVolume: number;
  hapticFeedback: boolean;
}

const NeonRacer: React.FC<NeonRacerProps & { onScoreUpdate?: (score: number) => void }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>(null);
  const gameState = useRef({
    player: { x: 150, y: 400, width: 40, height: 70, speed: 5 },
    obstacles: [] as any[],
    collectibles: [] as any[],
    particles: [] as any[],
    backgroundStars: [] as any[],
    cityBuildings: [] as any[],
    playerTrail: [] as { x: number, y: number, opacity: number }[],
    roadOffset: 0,
    speed: 5,
    laneWidth: 80,
    lanes: 3,
    lastObstacleTime: 0,
    lastCollectibleTime: 0,
    keys: {} as { [key: string]: boolean },
    gameOver: false,
    frame: 0,
    shake: 0
  });

  useEffect(() => {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > difficultyLevel) {
      setDifficultyLevel(newLevel);
      if (hapticFeedback) audioService.vibrate([10, 50, 10]);
    }
  }, [score, difficultyLevel, hapticFeedback]);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset game state on start
    gameState.current.speed = 5 + (difficultyLevel - 1) * 0.5;
    gameState.current.obstacles = [];
    gameState.current.collectibles = [];
    gameState.current.particles = [];
    gameState.current.gameOver = false;
    scoreRef.current = 0;
    setScore(0);

    // Initialize parallax background
    gameState.current.backgroundStars = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      opacity: Math.random() * 0.5 + 0.2
    }));

    gameState.current.cityBuildings = Array.from({ length: 8 }).map((_, i) => ({
      x: i * 50,
      width: 30 + Math.random() * 40,
      height: 50 + Math.random() * 100,
      speed: 0.5,
      color: `hsla(220, 40%, ${10 + Math.random() * 10}%, 0.8)`
    }));

    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * gameState.current.lanes);
      const x = (lane * gameState.current.laneWidth) + (gameState.current.laneWidth / 2) - 20;
      const hue = Math.random() * 360;
      gameState.current.obstacles.push({
        x,
        y: -100,
        width: 40,
        height: 70,
        speed: gameState.current.speed * 0.7,
        color: `hsl(${hue}, 70%, 50%)`,
        glow: `hsl(${hue}, 100%, 60%)`
      });
    };

    const spawnCollectible = () => {
      const lane = Math.floor(Math.random() * gameState.current.lanes);
      const x = (lane * gameState.current.laneWidth) + (gameState.current.laneWidth / 2) - 15;
      gameState.current.collectibles.push({
        x,
        y: -100,
        width: 30,
        height: 30,
        type: 'energy'
      });
    };

    const createParticles = (x: number, y: number, color: string, count = 20) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 2;
        gameState.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed + (gameState.current.speed * 0.5),
          size: Math.random() * 4 + 2,
          life: 1,
          decay: Math.random() * 0.02 + 0.015,
          color
        });
      }
    };

    const update = (time: number) => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      
      state.frame++;
      
      // Update background (parallax)
      state.backgroundStars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
      });

      state.cityBuildings.forEach(b => {
        b.y = (b.y || 0) + b.speed;
        if (b.y > canvas.height) b.y = -b.height;
      });

      // Player Trail
      if (state.frame % 2 === 0) {
        state.playerTrail.unshift({ x: state.player.x, y: state.player.y, opacity: 0.5 });
        if (state.playerTrail.length > 10) state.playerTrail.pop();
      }
      state.playerTrail.forEach(t => t.opacity -= 0.05);

      // Movement
      if (state.keys['ArrowLeft'] || state.keys['a']) {
        state.player.x -= state.player.speed;
      }
      if (state.keys['ArrowRight'] || state.keys['d']) {
        state.player.x += state.player.speed;
      }

      // Boundaries
      const minX = 0;
      const maxX = canvas.width - state.player.width;
      if (state.player.x < minX) state.player.x = minX;
      if (state.player.x > maxX) state.player.x = maxX;

      // Road animation
      state.roadOffset = (state.roadOffset + state.speed) % 100;

      // Spawning - interval decreases with difficultyLevel
      const spawnInterval = Math.max(400, 1500 / (state.speed / 5) - (difficultyLevel - 1) * 100);
      if (time - state.lastObstacleTime > spawnInterval) {
        spawnObstacle();
        state.lastObstacleTime = time;
      }
      if (time - state.lastCollectibleTime > 2000) {
        spawnCollectible();
        state.lastCollectibleTime = time;
      }

      // Update obstacles
      state.obstacles.forEach((obs, index) => {
        obs.y += state.speed + obs.speed;
        if (obs.y > canvas.height) {
          state.obstacles.splice(index, 1);
          scoreRef.current += 1;
          setScore(scoreRef.current);
          if (onScoreUpdate) onScoreUpdate(scoreRef.current);
        }

        // Collision
        if (
          state.player.x < obs.x + obs.width &&
          state.player.x + state.player.width > obs.x &&
          state.player.y < obs.y + obs.height &&
          state.player.y + state.player.height > obs.y
        ) {
          state.gameOver = true;
          state.shake = 20;
          createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, '#06b6d4', 40);
          if (hapticFeedback) audioService.vibrate(50);
          onGameOver(scoreRef.current);
        }
      });

      // Update collectibles
      state.collectibles.forEach((col, index) => {
        col.y += state.speed;
        if (col.y > canvas.height) {
          state.collectibles.splice(index, 1);
        }

        // Collection
        if (
          state.player.x < col.x + col.width &&
          state.player.x + state.player.width > col.x &&
          state.player.y < col.y + col.height &&
          state.player.y + state.player.height > col.y
        ) {
          state.collectibles.splice(index, 1);
          scoreRef.current += 5;
          state.shake = 5;
          setScore(scoreRef.current);
          if (onScoreUpdate) onScoreUpdate(scoreRef.current);
          audioService.playClick();
          createParticles(col.x + col.width / 2, col.y + col.height / 2, '#fbbf24', 25);
          if (hapticFeedback) audioService.vibrate(10);
        }
      });

      // Update particles
      state.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.life -= p.decay;
        if (p.life <= 0) state.particles.splice(index, 1);
      });

      // Update shake
      if (state.shake > 0.1) state.shake *= 0.9;
      else state.shake = 0;

      // Difficulty increase - baseline speed increases with difficultyLevel
      state.speed += 0.001 + (difficultyLevel - 1) * 0.0005;

      draw();
      requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameState.current;

      ctx.save();
      if (state.shake > 0) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
      }

      // Draw Background (Deep Space)
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Parallax Stars
      state.backgroundStars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Distant City Silhouettes (Parallax)
      state.cityBuildings.forEach(b => {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y || 0, b.width, b.height);
        // Windows
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for(let j=0; j<3; j++) {
          ctx.fillRect(b.x + 5, (b.y || 0) + 10 + j*20, b.width - 10, 5);
        }
      });

      // Draw Road with perspective grid
      const roadGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      roadGrad.addColorStop(0, '#0f172a');
      roadGrad.addColorStop(0.5, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Horizontal grid lines (perspective)
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = ((i * 50 + state.roadOffset) % canvas.height);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Side glow lines (Neon Rails)
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#4f46e5';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(4, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width - 4, 0);
      ctx.lineTo(canvas.width - 4, canvas.height);
      ctx.stroke();

      // Road markings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([40, 60]);
      ctx.lineDashOffset = -state.roadOffset;
      ctx.lineWidth = 2;
      
      for (let i = 1; i < state.lanes; i++) {
        ctx.beginPath();
        ctx.moveTo(i * state.laneWidth, 0);
        ctx.lineTo(i * state.laneWidth, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw Particles
      ctx.globalCompositeOperation = 'lighter';
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      // Draw Player Trail (Motion Blur)
      state.playerTrail.forEach((t, i) => {
        if (t.opacity <= 0) return;
        ctx.globalAlpha = t.opacity * 0.3;
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.roundRect(t.x, t.y, state.player.width, state.player.height, 8);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Player with Bloom
      const drawGlow = (x: number, y: number, w: number, h: number, color: string, blur: number) => {
        ctx.shadowBlur = blur;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
      };

      // Player Bloom layers
      drawGlow(state.player.x, state.player.y, state.player.width, state.player.height, 'rgba(6, 182, 212, 0.4)', 40);
      drawGlow(state.player.x, state.player.y, state.player.width, state.player.height, '#22d3ee', 15);
      
      // Car body details
      ctx.fillStyle = '#0891b2';
      ctx.beginPath();
      ctx.roundRect(state.player.x + 4, state.player.y + 4, state.player.width - 8, state.player.height - 8, 6);
      ctx.fill();
      
      // Windshield
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(state.player.x + 8, state.player.y + 12, state.player.width - 16, 12);

      // Headlights
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fff';
      ctx.fillStyle = '#fff';
      ctx.fillRect(state.player.x + 6, state.player.y + 2, 8, 5);
      ctx.fillRect(state.player.x + state.player.width - 14, state.player.y + 2, 8, 5);

      // Draw Obstacles with Bloom
      state.obstacles.forEach(obs => {
        drawGlow(obs.x, obs.y, obs.width, obs.height, obs.glow.replace(')', ', 0.5)').replace('hsl', 'hsla'), 30);
        drawGlow(obs.x, obs.y, obs.width, obs.height, obs.color, 15);
        
        // Detail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(obs.x + 6, obs.y + 12, obs.width - 12, 8);
        
        // Rear lights
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.shadowColor = 'red';
        ctx.shadowBlur = 10;
        ctx.fillRect(obs.x + 4, obs.y + obs.height - 8, 8, 4);
        ctx.fillRect(obs.x + obs.width - 12, obs.y + obs.height - 8, 8, 4);
      });

      // Draw Collectibles
      state.collectibles.forEach(col => {
        const pulse = Math.sin(state.frame * 0.2) * 6;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 30 + pulse * 2;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 2 + pulse / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Scanline Overlay
      ctx.fillStyle = 'rgba(18, 24, 38, 0.1)';
      for(let i=0; i<canvas.height; i+=4) {
        ctx.fillRect(0, i, canvas.width, 1);
      }

      ctx.restore();
      ctx.shadowBlur = 0;
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, onGameOver, hapticFeedback]);

  const handleTouch = (lane: number) => {
    if (!isPlaying) return;
    const targetX = (lane * gameState.current.laneWidth) + (gameState.current.laneWidth / 2) - 20;
    
    // Smooth transition to lane instead of instant snap
    const currentX = gameState.current.player.x;
    const diff = targetX - currentX;
    gameState.current.player.x += diff * 0.3; // Simple easing
    
    if (hapticFeedback) audioService.vibrate(5);
  };

  return (
    <div className="relative w-full max-w-[300px] aspect-[3/5] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={500}
        className="w-full h-full"
      />
      
      {/* Mobile Controls Overlay */}
      <div className="absolute inset-0 grid grid-cols-3 pointer-events-auto md:hidden">
        <div onTouchStart={() => handleTouch(0)} onTouchMove={() => handleTouch(0)} className="h-full active:bg-white/5 transition-colors" />
        <div onTouchStart={() => handleTouch(1)} onTouchMove={() => handleTouch(1)} className="h-full active:bg-white/5 transition-colors" />
        <div onTouchStart={() => handleTouch(2)} onTouchMove={() => handleTouch(2)} className="h-full active:bg-white/5 transition-colors" />
      </div>

      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
        <span className="text-xs font-black text-cyan-400 italic animate-pulse">SCORE: {score}</span>
      </div>
    </div>
  );
};

export default NeonRacer;
