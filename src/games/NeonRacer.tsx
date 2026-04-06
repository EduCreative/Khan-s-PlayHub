import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';

interface NeonRacerProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  sfxVolume: number;
  hapticFeedback: boolean;
}

const NeonRacer: React.FC<NeonRacerProps> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>(null);
  const gameState = useRef({
    player: { x: 150, y: 400, width: 40, height: 70, speed: 5 },
    obstacles: [] as any[],
    collectibles: [] as any[],
    particles: [] as any[],
    roadOffset: 0,
    speed: 5,
    laneWidth: 80,
    lanes: 3,
    lastObstacleTime: 0,
    lastCollectibleTime: 0,
    keys: {} as { [key: string]: boolean },
    gameOver: false,
    frame: 0
  });

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        gameState.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          size: Math.random() * 3 + 1,
          life: 1,
          color
        });
      }
    };

    const update = (time: number) => {
      if (gameState.current.gameOver) return;

      const state = gameState.current;
      
      state.frame++;
      
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

      // Spawning
      if (time - state.lastObstacleTime > 1500 / (state.speed / 5)) {
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
          scoreRef.current += 2;
          setScore(scoreRef.current);
        }

        // Collision
        if (
          state.player.x < obs.x + obs.width &&
          state.player.x + state.player.width > obs.x &&
          state.player.y < obs.y + obs.height &&
          state.player.y + state.player.height > obs.y
        ) {
          state.gameOver = true;
          createParticles(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2, '#06b6d4');
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
          scoreRef.current += 10;
          setScore(scoreRef.current);
          audioService.playClick();
          createParticles(col.x + col.width / 2, col.y + col.height / 2, '#fbbf24');
          if (hapticFeedback) audioService.vibrate(10);
        }
      });

      // Update particles
      state.particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) state.particles.splice(index, 1);
      });

      // Difficulty increase
      state.speed += 0.001;

      draw();
      requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameState.current;

      // Draw Road
      const roadGrad = ctx.createLinearGradient(0, 0, canvas.width, 0);
      roadGrad.addColorStop(0, '#0f172a');
      roadGrad.addColorStop(0.5, '#1e293b');
      roadGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Side glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#4f46e5';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(2, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(canvas.width - 2, 0);
      ctx.lineTo(canvas.width - 2, canvas.height);
      ctx.stroke();

      // Road markings
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
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
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Player
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#06b6d4';
      ctx.fillStyle = '#06b6d4';
      
      // Car body
      ctx.beginPath();
      ctx.roundRect(state.player.x, state.player.y, state.player.width, state.player.height, 8);
      ctx.fill();
      
      // Windshield
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(state.player.x + 8, state.player.y + 12, state.player.width - 16, 12);

      // Headlights
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.fillRect(state.player.x + 5, state.player.y + 2, 8, 4);
      ctx.fillRect(state.player.x + state.player.width - 13, state.player.y + 2, 8, 4);

      // Draw Obstacles
      state.obstacles.forEach(obs => {
        ctx.shadowColor = obs.glow;
        ctx.shadowBlur = 15;
        ctx.fillStyle = obs.color;
        ctx.beginPath();
        ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
        ctx.fill();
        
        // Detail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(obs.x + 5, obs.y + 10, obs.width - 10, 5);
      });

      // Draw Collectibles
      state.collectibles.forEach(col => {
        const pulse = Math.sin(state.frame * 0.1) * 5;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 20 + pulse;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 2 + pulse / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 4, 0, Math.PI * 2);
        ctx.fill();
      });

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
