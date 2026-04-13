import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';

interface SkyStrikeProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  sfxVolume: number;
  hapticFeedback: boolean;
}

const SkyStrike: React.FC<SkyStrikeProps & { onScoreUpdate?: (score: number) => void }> = ({ onGameOver, isPlaying, sfxVolume, hapticFeedback, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const scoreRef = useRef(0);
  const difficultyLevelRef = useRef(1);
  const onGameOverRef = useRef(onGameOver);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const hapticFeedbackRef = useRef(hapticFeedback);
  const requestRef = useRef<number>(null);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onScoreUpdateRef.current = onScoreUpdate;
    hapticFeedbackRef.current = hapticFeedback;
  }, [onGameOver, onScoreUpdate, hapticFeedback]);

  const gameState = useRef({
    player: { x: 150, y: 400, width: 40, height: 40, speed: 5 },
    bullets: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    stars: [] as any[],
    lastEnemyTime: 0,
    lastFireTime: 0,
    keys: {} as { [key: string]: boolean },
    gameOver: false,
    frame: 0
  });

  useEffect(() => {
    if (!isPlaying) {
      setScore(0);
      scoreRef.current = 0;
      setDifficultyLevel(1);
      difficultyLevelRef.current = 1;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset game state
    gameState.current.enemies = [];
    gameState.current.bullets = [];
    gameState.current.particles = [];
    gameState.current.gameOver = false;
    gameState.current.lastEnemyTime = performance.now();
    gameState.current.lastFireTime = performance.now();
    scoreRef.current = 0;
    difficultyLevelRef.current = 1;
    setScore(0);
    setDifficultyLevel(1);

    // Initialize stars
    gameState.current.stars = Array.from({ length: 50 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2,
      speed: 0.5 + Math.random() * 2
    }));

    const handleKeyDown = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameState.current.keys[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const spawnEnemy = () => {
      const state = gameState.current;
      const score = scoreRef.current;
      const diff = difficultyLevelRef.current;
      
      // Difficulty scaling - heavy chance increases with score and difficultyLevel
      const heavyChance = Math.min(0.6, (score / 2000) + (diff - 1) * 0.1);
      const isHeavy = Math.random() < heavyChance;
      
      const x = Math.random() * (canvas.width - 40);
      
      if (isHeavy) {
        state.enemies.push({
          x,
          y: -60,
          width: 50,
          height: 50,
          // Speed increases slightly with difficultyLevel
          speed: 1.5 + Math.random() * 1 + (diff - 1) * 0.2,
          health: 3 + Math.floor((diff - 1) / 2), // Health also increases
          maxHealth: 3 + Math.floor((diff - 1) / 2),
          color: '#9333ea', // Purple for heavy
          type: 'heavy'
        });
      } else {
        state.enemies.push({
          x,
          y: -50,
          width: 40,
          height: 40,
          speed: 2 + Math.random() * 2 + (diff - 1) * 0.3,
          health: 1,
          maxHealth: 1,
          color: '#f43f5e', // Red for normal
          type: 'normal'
        });
      }
    };

    const fireBullet = () => {
      const state = gameState.current;
      state.bullets.push({
        x: state.player.x + state.player.width / 2 - 2,
        y: state.player.y,
        width: 4,
        height: 15,
        speed: 12 // Increased bullet speed
      });
      audioService.playClick();
      if (hapticFeedbackRef.current) audioService.vibrate(5);
    };

    const createParticles = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        gameState.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 5,
          vy: (Math.random() - 0.5) * 5,
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
      
      // Update stars
      state.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
      });

      // Movement
      if (state.keys['ArrowLeft'] || state.keys['a']) state.player.x -= state.player.speed;
      if (state.keys['ArrowRight'] || state.keys['d']) state.player.x += state.player.speed;
      if (state.keys['ArrowUp'] || state.keys['w']) state.player.y -= state.player.speed;
      if (state.keys['ArrowDown'] || state.keys['s']) state.player.y += state.player.speed;

      // Firing
      if (state.keys[' '] || state.keys['Enter']) {
        if (time - state.lastFireTime > 250) {
          fireBullet();
          state.lastFireTime = time;
        }
      }

      // Boundaries
      state.player.x = Math.max(0, Math.min(canvas.width - state.player.width, state.player.x));
      state.player.y = Math.max(0, Math.min(canvas.height - state.player.height, state.player.y));

      // Spawning - interval decreases with score and difficultyLevel
      const spawnInterval = Math.max(300, 1000 - Math.floor(scoreRef.current / 100) * 50 - (difficultyLevelRef.current - 1) * 50);
      if (time - state.lastEnemyTime > spawnInterval) {
        spawnEnemy();
        state.lastEnemyTime = time;
      }

      // Update Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        bullet.y -= bullet.speed;
        
        if (bullet.y < -50 || bullet.y > canvas.height + 50) {
          state.bullets.splice(i, 1);
          continue;
        }

        // Bullet-Enemy Collision
        let bulletHit = false;
        for (let j = state.enemies.length - 1; j >= 0; j--) {
          const enemy = state.enemies[j];
          if (
            bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y
          ) {
            bulletHit = true;
            enemy.health -= 1;
            
            if (enemy.health <= 0) {
              createParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color);
              state.enemies.splice(j, 1);
              scoreRef.current += enemy.type === 'heavy' ? 30 : 10;
              setScore(scoreRef.current);
              if (onScoreUpdateRef.current) onScoreUpdateRef.current(scoreRef.current);
              
              // Difficulty scaling check
              const newLevel = Math.floor(scoreRef.current / 1000) + 1;
              if (newLevel > difficultyLevelRef.current) {
                difficultyLevelRef.current = newLevel;
                setDifficultyLevel(newLevel);
                if (hapticFeedbackRef.current) audioService.vibrate([20, 50, 20]);
              }
              
              if (hapticFeedbackRef.current) audioService.vibrate(20);
            } else {
              // Hit effect
              createParticles(bullet.x, bullet.y, '#fff');
              if (hapticFeedbackRef.current) audioService.vibrate(5);
            }
            break;
          }
        }
        if (bulletHit) {
          state.bullets.splice(i, 1);
        }
      }

      // Update Enemies
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        enemy.y += enemy.speed;
        
        if (enemy.y > canvas.height + 50) {
          state.enemies.splice(i, 1);
          continue;
        }

        // Player-Enemy Collision
        if (
          state.player.x < enemy.x + enemy.width &&
          state.player.x + state.player.width > enemy.x &&
          state.player.y < enemy.y + enemy.height &&
          state.player.y + state.player.height > enemy.y
        ) {
          state.gameOver = true;
          if (hapticFeedbackRef.current) audioService.vibrate(100);
          onGameOverRef.current(scoreRef.current);
        }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      draw();
      requestRef.current = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const state = gameState.current;

      // Draw Background (Stars)
      ctx.fillStyle = 'white';
      state.stars.forEach(star => {
        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Draw Player (Jet)
      ctx.save();
      ctx.translate(state.player.x + state.player.width / 2, state.player.y + state.player.height / 2);
      
      // Glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#3b82f6';
      
      // Wings
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.moveTo(-20, 10);
      ctx.lineTo(20, 10);
      ctx.lineTo(0, -10);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(-10, 20);
      ctx.lineTo(10, 20);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = '#93c5fd';
      ctx.beginPath();
      ctx.ellipse(0, -5, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Engine Glow
      const enginePulse = Math.sin(state.frame * 0.5) * 5;
      ctx.shadowColor = '#f59e0b';
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 20, 8 + enginePulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 20, 4 + enginePulse / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();

      // Draw Bullets
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#60a5fa';
      ctx.fillStyle = '#60a5fa';
      state.bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, b.width, b.height);
      });

      // Draw Enemies
      state.enemies.forEach(e => {
        ctx.save();
        ctx.translate(e.x + e.width / 2, e.y + e.height / 2);
        ctx.rotate(Math.PI); // Face down
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        
        // Enemy Body
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(-15, 10);
        ctx.lineTo(15, 10);
        ctx.closePath();
        ctx.fill();
        
        // Enemy Core
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();

        // Health Bar for Heavy Enemies
        if (e.type === 'heavy' && e.health < e.maxHealth) {
          const barWidth = e.width;
          const barHeight = 4;
          const healthPercent = e.health / e.maxHealth;
          
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(e.x, e.y - 10, barWidth, barHeight);
          
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(e.x, e.y - 10, barWidth * healthPercent, barHeight);
        }
      });

      // Draw Particles
      state.particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const handleTouch = (e: React.TouchEvent) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    
    // Scale touch coordinates to internal canvas resolution (300x500)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    const targetX = x - gameState.current.player.width / 2;
    const targetY = y - gameState.current.player.height - 40;
    
    // Smooth follow with easing, but cap movement speed to prevent bullet-lag
    const dx = targetX - gameState.current.player.x;
    const dy = targetY - gameState.current.player.y;
    
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const maxMove = gameState.current.player.speed * 2.5; // Cap speed
      const moveX = (dx / dist) * Math.min(dist, maxMove);
      const moveY = (dy / dist) * Math.min(dist, maxMove);
      
      gameState.current.player.x += moveX;
      gameState.current.player.y += moveY;
    }
    
    // Auto-fire on touch handled in update loop for consistency
    gameState.current.keys[' '] = true;
  };

  const handleTouchEnd = () => {
    gameState.current.keys[' '] = false;
  };

  return (
    <div className="relative w-full max-w-[300px] aspect-[3/5] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={500}
        className="w-full h-full cursor-crosshair"
        onTouchMove={handleTouch}
        onTouchStart={handleTouch}
        onTouchEnd={handleTouchEnd}
      />
      
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        <span className="text-xs font-black text-blue-400 italic animate-pulse">SCORE: {score}</span>
      </div>
    </div>
  );
};

export default SkyStrike;
