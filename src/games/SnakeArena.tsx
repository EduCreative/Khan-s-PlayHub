import React, { useEffect, useRef, useState } from 'react';
import { audioService } from '../services/audioService';

interface SnakeArenaProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  sfxVolume: number;
  hapticFeedback: boolean;
  onScoreUpdate?: (score: number) => void;
}

// Arena size
const ARENA_SIZE = 3000;
const SEGMENT_GAP = 5; // spacing in historical points list between physical drawn segments

interface Position {
  x: number;
  y: number;
}

interface Snake {
  id: string;
  name: string;
  isPlayer: boolean;
  x: number;
  y: number;
  color: string;
  headColor: string;
  segments: Position[];
  trailHistory: Position[];
  angle: number;
  targetAngle: number;
  speed: number;
  score: number;
  size: number; // thickness factor
  isBoosting: boolean;
  pulseTimer: number;
  isDead: boolean;
  isAttacker?: boolean;
}

interface Food {
  x: number;
  y: number;
  color: string;
  size: number;
  value: number;
  type: 'fruit' | 'carcass' | 'powerup_speed' | 'powerup_invincible';
  pulseTimer: number;
}

const BOT_NAMES = [
  'Blitz_Viper', 'Neon_Stalker', 'Cobra_Byte', 'Shadow_Tail', 
  'Electro_Fang', 'Giga_Scale', 'Crypto_Python', 'Turbo_Hiss',
  'Zenith_Scale', 'Omega_Venom', 'Matrix_Slider', 'Delta_Worm'
];

const BOT_COLORS = [
  { body: '#22c55e', head: '#4ade80' }, // emerald green
  { body: '#ef4444', head: '#f87171' }, // crimson red
  { body: '#eab308', head: '#fde047' }, // amber yellow
  { body: '#ec4899', head: '#f472b6' }, // bright pink
  { body: '#06b6d4', head: '#22d3ee' }, // electric cyan
  { body: '#a855f7', head: '#c084fc' }, // neon purple
  { body: '#f97316', head: '#fb923c' }, // molten orange
];

const FOOD_COLORS = [
  '#f43f5e', // rose
  '#22d3ee', // cyan
  '#a855f7', // purple
  '#fbbf24', // amber
  '#34d399', // emerald
  '#fb923c', // orange
  '#f472b6', // pink
  '#ff007f', // neon pinkish magenta
  '#39ff14', // neon fluorescent green
  '#00ffff', // neon electric cyan
  '#ff00ff', // fuchsia
  '#ffff00', // bright yellow
  '#7fff00', // chartreuse
  '#00fa9a', // medium spring green
  '#00bfff', // deep sky blue
  '#ff1493', // deep pink
  '#adff2f'  // green yellow
];

type Difficulty = 'easy' | 'medium' | 'hard';

export default function SnakeArena({ 
  onGameOver, 
  isPlaying, 
  sfxVolume, 
  hapticFeedback, 
  onScoreUpdate 
}: SnakeArenaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'gameover'>('lobby');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [topSnakes, setTopSnakes] = useState<{ name: string; score: number; isPlayer: boolean }[]>([]);

  // Powerup state variables for UI/HUD
  const [activePowerUpSpeed, setActivePowerUpSpeed] = useState<number>(0);
  const [activePowerUpInvincible, setActivePowerUpInvincible] = useState<number>(0);

  // Powerup timing references
  const powerUpSpeedTimerRef = useRef<number>(0);
  const powerUpInvincibleTimerRef = useRef<number>(0);

  // Refs for loop values (ensures continuous loop doesn't read stale state)
  const isPlayingRef = useRef(false);
  const difficultyRef = useRef<Difficulty>('medium');
  const scoreRef = useRef(0);
  const onGameOverRef = useRef(onGameOver);
  const onScoreUpdateRef = useRef(onScoreUpdate);
  const hapticFeedbackRef = useRef(hapticFeedback);
  const requestRef = useRef<number>(null);

  // Input States
  const mouseState = useRef({ x: 0, y: 0 });
  const touchState = useRef({ active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const isBoostingPressed = useRef(false);

  // Entities Ref
  const entities = useRef<{
    player: Snake | null;
    bots: Snake[];
    foods: Food[];
    particles: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[];
  }>({
    player: null,
    bots: [],
    foods: [],
    particles: []
  });

  // Keep callback refs fresh
  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onScoreUpdateRef.current = onScoreUpdate;
    hapticFeedbackRef.current = hapticFeedback;
    difficultyRef.current = difficulty;
  }, [onGameOver, onScoreUpdate, hapticFeedback, difficulty]);

  // Load highScore
  useEffect(() => {
    try {
      const stored = localStorage.getItem('khans-snake-arena-pb');
      if (stored) setHighScore(parseInt(stored, 10));
    } catch {}
  }, []);

  // Update lobby status
  useEffect(() => {
    isPlayingRef.current = isPlaying && gameState === 'playing';
  }, [isPlaying, gameState]);

  // Handle Resize beautifully using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      for (let entry of entries) {
        // Use exact bounds of the parent container to keep canvas aligned
        canvas.width = entry.contentRect.width || container.clientWidth;
        canvas.height = entry.contentRect.height || container.clientHeight;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Helper utility to wrap positions beautifully
  const wrapPosition = (val: number, max: number) => {
    return (val + max) % max;
  };

  // Helper to adjust relative segment coordinates for continuous wrapping rendering
  const getWrappedOffsetCoordinates = (segX: number, segY: number, refX: number, refY: number) => {
    let dx = segX - refX;
    let dy = segY - refY;
    if (dx > ARENA_SIZE / 2) segX -= ARENA_SIZE;
    else if (dx < -ARENA_SIZE / 2) segX += ARENA_SIZE;
    if (dy > ARENA_SIZE / 2) segY -= ARENA_SIZE;
    else if (dy < -ARENA_SIZE / 2) segY += ARENA_SIZE;
    return { x: segX, y: segY };
  };

  // High-performance wrapping coordinate helper relative to player's head for rendering
  const getPlayRelativeCoords = (x: number, y: number, px: number, py: number) => {
    let dx = x - px;
    let dy = y - py;
    if (dx > ARENA_SIZE / 2) dx -= ARENA_SIZE;
    else if (dx < -ARENA_SIZE / 2) dx += ARENA_SIZE;
    if (dy > ARENA_SIZE / 2) dy -= ARENA_SIZE;
    else if (dy < -ARENA_SIZE / 2) dy += ARENA_SIZE;
    return { x: px + dx, y: py + dy };
  };

  // Setup Entities
  const initializeGame = () => {
    const diff = difficultyRef.current;
    
    // Config values based on difficulty: number of bots and attackers increase with difficulty
    let botCount = 7;
    let attackerCount = 2;
    let playerStartLength = 6;
    if (diff === 'easy') {
      botCount = 4;
      attackerCount = 1;
      playerStartLength = 8;
    } else if (diff === 'hard') {
      botCount = 10;
      attackerCount = 4;
      playerStartLength = 5;
    }

    // Reset components
    scoreRef.current = 0;
    setScore(0);
    setActivePowerUpSpeed(0);
    setActivePowerUpInvincible(0);
    powerUpSpeedTimerRef.current = 0;
    powerUpInvincibleTimerRef.current = 0;
    entities.current.particles = [];

    // Create Player Snake
    const playerX = ARENA_SIZE / 2;
    const playerY = ARENA_SIZE / 2;
    const playerHist: Position[] = [];
    const playerSegs: Position[] = [];
    const playerSpeed = diff === 'easy' ? 2.5 : diff === 'medium' ? 3.5 : 4.5;
    const playerAngle = -Math.PI / 2;

    const playerStepDist = playerSpeed / SEGMENT_GAP;
    for (let i = 0; i < playerStartLength * SEGMENT_GAP; i++) {
      playerHist.push({
        x: playerX - Math.cos(playerAngle) * i * playerStepDist,
        y: playerY - Math.sin(playerAngle) * i * playerStepDist
      });
    }
    for (let i = 0; i < playerStartLength; i++) {
      playerSegs.push({ ...playerHist[i * SEGMENT_GAP] });
    }

    const playerSnake: Snake = {
      id: 'player',
      name: 'YOU',
      isPlayer: true,
      x: playerX,
      y: playerY,
      color: '#6366f1', // indigo
      headColor: '#818cf8',
      segments: playerSegs,
      trailHistory: playerHist,
      angle: playerAngle,
      targetAngle: playerAngle,
      speed: playerSpeed,
      score: 0,
      size: 12,
      isBoosting: false,
      pulseTimer: 0,
      isDead: false
    };

    // Create AI snakes
    const botsList: Snake[] = [];
    for (let i = 0; i < botCount; i++) {
      const isAttacker = i < attackerCount;
      let name = '';
      let color = '';
      let headColor = '';

      if (isAttacker) {
        const attackerNames = ['RED_STALKER', 'STEALTH_VIPER', 'TERROR_HISS', 'BLOOD_REAPER', 'NIGHTMARE_BOT', 'CRIMSON_FANG'];
        name = attackerNames[i % attackerNames.length];
        color = '#ef4444'; // dangerous neon red
        headColor = '#f87171'; // lighter red warning head
      } else {
        name = BOT_NAMES[i % BOT_NAMES.length];
        const botColor = BOT_COLORS[i % BOT_COLORS.length];
        color = botColor.body;
        headColor = botColor.head;
      }

      const rx = Math.random() * ARENA_SIZE;
      const ry = Math.random() * ARENA_SIZE;
      const rAngle = Math.random() * Math.PI * 2;

      // Random length as explicitly requested
      let minLen = 5;
      let maxLen = 12;
      if (diff === 'easy') { minLen = 4; maxLen = 8; }
      else if (diff === 'medium') { minLen = 6; maxLen = 13; }
      else { minLen = 8; maxLen = 18; }
      const botLength = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

      const botSpeed = diff === 'easy' ? 1.8 : diff === 'medium' ? 2.8 : 3.8;

      const botHist: Position[] = [];
      const botSegs: Position[] = [];

      const botStepDist = botSpeed / SEGMENT_GAP;
      for (let j = 0; j < botLength * SEGMENT_GAP; j++) {
        botHist.push({
          x: rx - Math.cos(rAngle) * j * botStepDist,
          y: ry - Math.sin(rAngle) * j * botStepDist
        });
      }
      for (let j = 0; j < botLength; j++) {
        botSegs.push({ ...botHist[j * SEGMENT_GAP] });
      }

      botsList.push({
        id: `bot_${i}`,
        name,
        isPlayer: false,
        x: rx,
        y: ry,
        color,
        headColor,
        segments: botSegs,
        trailHistory: botHist,
        angle: rAngle,
        targetAngle: rAngle,
        speed: botSpeed,
        score: Math.floor(botLength * 2),
        size: 12,
        isBoosting: false,
        pulseTimer: Math.random() * 100,
        isDead: false,
        isAttacker
      });
    }

    // Spawn more colorful foods across the arena
    const foodsList: Food[] = [];
    const startingFoodCount = diff === 'easy' ? 70 : diff === 'medium' ? 100 : 130;
    for (let f = 0; f < startingFoodCount; f++) {
      foodsList.push({
        x: Math.random() * ARENA_SIZE,
        y: Math.random() * ARENA_SIZE,
        color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
        size: 2.0 + Math.random() * 2.5, // keep food items small
        value: 1 + Math.floor(Math.random() * 2), // 1 to 3 score points
        type: 'fruit',
        pulseTimer: Math.random() * 100
      });
    }

    // Spawn initial power-ups
    const initialSpeedCount = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
    const initialInvCount = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;

    for (let i = 0; i < initialSpeedCount; i++) {
      foodsList.push({
        x: Math.random() * ARENA_SIZE,
        y: Math.random() * ARENA_SIZE,
        color: '#39ff14', // Neon fluorescent green
        size: 6.0,
        value: 5,
        type: 'powerup_speed',
        pulseTimer: Math.random() * 100
      });
    }

    for (let i = 0; i < initialInvCount; i++) {
      foodsList.push({
        x: Math.random() * ARENA_SIZE,
        y: Math.random() * ARENA_SIZE,
        color: '#fbbf24', // Golden metallic yellow
        size: 7.0,
        value: 10,
        type: 'powerup_invincible',
        pulseTimer: Math.random() * 100
      });
    }

    entities.current.player = playerSnake;
    entities.current.bots = botsList;
    entities.current.foods = foodsList;
  };

  // Main Loop logic
  useEffect(() => {
    if (gameState !== 'playing') {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions initially and reliably
    if (containerRef.current) {
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    }

    // Ensure keyboard tracking within canvas setup
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === ' ') {
        isBoostingPressed.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (e.key === ' ') {
        isBoostingPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Dynamic scale parameters based on canvas size (adjust sizes on small streams)
    const isMobileSize = canvas.width < 768;

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      // Meaningless and memory-intensive particle explosions are completely disabled for premium high performance
    };

    const updateAndDraw = () => {
      if (!isPlayingRef.current) return;

      const state = entities.current;
      const player = state.player;
      
      // Safety guard
      if (!player) return;

      // Decrement power-up timers
      if (powerUpSpeedTimerRef.current > 0) {
        powerUpSpeedTimerRef.current--;
      }
      if (powerUpInvincibleTimerRef.current > 0) {
        powerUpInvincibleTimerRef.current--;
      }

      // Smoothly update React UI states for powerups on change boundaries
      const currSecSpeed = Math.max(0, Math.ceil(powerUpSpeedTimerRef.current / 60));
      const currSecInvMs = Math.max(0, Math.ceil(powerUpInvincibleTimerRef.current / 60));
      setActivePowerUpSpeed(prev => prev !== currSecSpeed ? currSecSpeed : prev);
      setActivePowerUpInvincible(prev => prev !== currSecInvMs ? currSecInvMs : prev);

      const diff = difficultyRef.current;

      // ----------------------------------------
      // 1. UPDATE PLAYER DIRECTION & SPEED
      // ----------------------------------------
      let desiredAngle = player.angle;

      // Calculate direction from touch joystick if active
      if (touchState.current.active) {
        const { startX, startY, currentX, currentY } = touchState.current;
        const dx = currentX - startX;
        const dy = currentY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 8) {
          desiredAngle = Math.atan2(dy, dx);
        }
      } 
      // Else calculate from keyboard
      else {
        let steerX = 0;
        let steerY = 0;
        if (keysPressed.current['arrowleft'] || keysPressed.current['a']) steerX = -1;
        if (keysPressed.current['arrowright'] || keysPressed.current['d']) steerX = 1;
        if (keysPressed.current['arrowup'] || keysPressed.current['w']) steerY = -1;
        if (keysPressed.current['arrowdown'] || keysPressed.current['s']) steerY = 1;

        if (steerX !== 0 || steerY !== 0) {
          desiredAngle = Math.atan2(steerY, steerX);
        } else if (mouseState.current.x !== 0 || mouseState.current.y !== 0) {
          // Direct mouse angle steer
          const screenCenterX = canvas.width / 2;
          const screenCenterY = canvas.height / 2;
          const dx = mouseState.current.x - screenCenterX;
          const dy = mouseState.current.y - screenCenterY;
          
          // Only steer if mouse is decent distance away from snake center
          if (Math.sqrt(dx * dx + dy * dy) > 30) {
            desiredAngle = Math.atan2(dy, dx);
          }
        }
      }

      // Smooth angle interpolation to prevent instant jitter turning
      const angleDiff = Math.atan2(Math.sin(desiredAngle - player.angle), Math.cos(desiredAngle - player.angle));
      player.angle += angleDiff * 0.15; // smooth rotation factor

      // Determine boost state
      const wantsBoost = (isBoostingPressed.current || touchState.current.active && keysPressed.current['space']) && player.segments.length > 5;
      player.isBoosting = wantsBoost;

      const hasSpeedPowerUp = powerUpSpeedTimerRef.current > 0;
      const speedPowerUpMultiplier = hasSpeedPowerUp ? 1.5 : 1.0;
      const baseSpeed = (diff === 'easy' ? 2.5 : diff === 'medium' ? 3.5 : 4.5) * speedPowerUpMultiplier;
      const targetSpeed = wantsBoost ? baseSpeed * (hasSpeedPowerUp ? 2.1 : 1.8) : baseSpeed;
      player.speed += (targetSpeed - player.speed) * 0.1;

      // Make player consumption when boosting (creates booster food trail in arena)
      if (wantsBoost && Math.random() < 0.15 && !hasSpeedPowerUp) {
        // Lose segment if power-up is not active!
        if (player.segments.length > 6) {
          const tail = player.segments[player.segments.length - 1];
          // Spawn food at the tail segment position
          state.foods.push({
            x: tail.x,
            y: tail.y,
            color: player.color,
            size: 3,
            value: 1,
            type: 'fruit',
            pulseTimer: Math.random() * 100
          });

          // Trim trail slightly
          player.segments.pop();
          player.trailHistory.splice(-SEGMENT_GAP);
          
          if (audioService && sfxVolume > 0 && Math.random() < 0.2) {
            audioService.playClick(); // faint booster sound click
          }
        }
      }

      // ----------------------------------------
      // 2. MOVE LEADERS (PLAYER & BOTS)
      // ----------------------------------------
      const allSnakes = [player, ...state.bots];
      
      allSnakes.forEach(snake => {
        if (snake.isDead) return;

        // Move head position
        const testX = snake.segments[0].x + Math.cos(snake.angle) * snake.speed;
        const testY = snake.segments[0].y + Math.sin(snake.angle) * snake.speed;
        
        snake.x = wrapPosition(testX, ARENA_SIZE);
        snake.y = wrapPosition(testY, ARENA_SIZE);

        // Update trailHistory unshift
        snake.trailHistory.unshift({ x: snake.x, y: snake.y });

        // Maintain size bounds of trailHistory to dodge huge array leak
        const maxHistory = snake.segments.length * SEGMENT_GAP;
        if (snake.trailHistory.length > maxHistory) {
          snake.trailHistory.splice(maxHistory);
        }

        // Align segments to trail history gaps perfectly for smooth continuous curving movements
        for (let i = 0; i < snake.segments.length; i++) {
          const histIndex = Math.min(i * SEGMENT_GAP, snake.trailHistory.length - 1);
          snake.segments[i] = { ...snake.trailHistory[histIndex] };
        }
      });

      // ----------------------------------------
      // 3. BOT DECISIONS & DIRECTION STERING AI
      // ----------------------------------------
      state.bots.forEach(bot => {
        if (bot.isDead) return;

        bot.pulseTimer += 1;

        // Every 12-20 frames, evaluate surroundings for intelligence
        if (Math.round(bot.pulseTimer) % 15 === 0) {
          const head = bot.segments[0];
          let steerX = Math.cos(bot.angle);
          let steerY = Math.sin(bot.angle);

          // Priority A: Flee or evade closest snake bodies to avoid death (Very strategic!)
          let closestObstacleDistSq = 180 * 180;
          let escapeVectorX = 0;
          let escapeVectorY = 0;
          let evasiveAction = false;

          // Run evaluation check against all snake segments in the arena
          allSnakes.forEach(other => {
            if (other.isDead) return;
            
            // Loop segments
            other.segments.forEach((seg, idx) => {
              // Ignore own head/neck
              if (other.id === bot.id && idx < 5) return;

              const coords = getWrappedOffsetCoordinates(seg.x, seg.y, head.x, head.y);
              const dx = coords.x - head.x;
              const dy = coords.y - head.y;
              const distSq = dx * dx + dy * dy;

              if (distSq < closestObstacleDistSq) {
                closestObstacleDistSq = distSq;
                const dist = Math.sqrt(distSq) || 0.1;
                // Force escape vector pointing opposite of segment direction
                escapeVectorX -= dx / dist;
                escapeVectorY -= dy / dist;
                evasiveAction = true;
              }
            });
          });

          // Priority B: Attack player if bot is an attacker and player is alive and inside range
          let isAttackingPlayer = false;
          let playerTargetX = 0;
          let playerTargetY = 0;

          if (!evasiveAction && bot.isAttacker && player && !player.isDead) {
            const playerCoords = getWrappedOffsetCoordinates(player.segments[0].x, player.segments[0].y, head.x, head.y);
            const dx = playerCoords.x - head.x;
            const dy = playerCoords.y - head.y;
            const distSq = dx * dx + dy * dy;

            // Attackers can detect the player from a good distance (e.g. 1200 pixels)
            const attackRange = 1200;
            if (distSq < attackRange * attackRange) {
              const dist = Math.sqrt(distSq) || 0.1;
              // Target slightly ahead of player to intercept them
              const leadFactor = diff === 'easy' ? 0 : diff === 'medium' ? 10 : 20;
              const targetX = playerCoords.x + Math.cos(player.angle) * player.speed * leadFactor;
              const targetY = playerCoords.y + Math.sin(player.angle) * player.speed * leadFactor;

              playerTargetX = targetX - head.x;
              playerTargetY = targetY - head.y;

              const targetDist = Math.sqrt(playerTargetX * playerTargetX + playerTargetY * playerTargetY) || 0.1;
              playerTargetX /= targetDist;
              playerTargetY /= targetDist;

              isAttackingPlayer = true;
            }
          }

          // Priority C: Hunt closest foods
          let closestFoodDist = diff === 'easy' ? 150 : diff === 'medium' ? 250 : 400;
          let closestFoodDistSq = closestFoodDist * closestFoodDist;
          let foodTargetX = 0;
          let foodTargetY = 0;
          let foodFound = false;

          if (!evasiveAction && !isAttackingPlayer) {
            state.foods.forEach(food => {
              const coords = getWrappedOffsetCoordinates(food.x, food.y, head.x, head.y);
              const dx = coords.x - head.x;
              const dy = coords.y - head.y;
              const distSq = dx * dx + dy * dy;

              if (distSq < closestFoodDistSq) {
                closestFoodDistSq = distSq;
                foodTargetX = dx;
                foodTargetY = dy;
                foodFound = true;
              }
            });
            if (foodFound) {
              const finalDist = Math.sqrt(closestFoodDistSq) || 0.1;
              foodTargetX /= finalDist;
              foodTargetY /= finalDist;
            }
          }

          // Merge steering weights
          let combinedX = 0;
          let combinedY = 0;

          if (evasiveAction) {
            combinedX = escapeVectorX * 1.5;
            combinedY = escapeVectorY * 1.5;
            
            // Sometimes trigger bot speeds boosts to cut out a player or escape!
            if (diff !== 'easy' && Math.random() < 0.4 && bot.segments.length > 7) {
              bot.isBoosting = true;
            } else {
              bot.isBoosting = false;
            }
          } else if (isAttackingPlayer) {
            combinedX = playerTargetX;
            combinedY = playerTargetY;

            // Attackers boost aggressively when chasing the player!
            const boostChance = diff === 'easy' ? 0.1 : diff === 'medium' ? 0.35 : 0.65;
            if (bot.segments.length > 5 && Math.random() < boostChance) {
              bot.isBoosting = true;
            } else {
              bot.isBoosting = false;
            }
          } else if (foodFound) {
            combinedX = foodTargetX;
            combinedY = foodTargetY;
            bot.isBoosting = false;
          } else {
            // Wander around safely with standard noise angles
            const noise = (Math.random() - 0.5) * 0.8;
            combinedX = Math.cos(bot.angle + noise);
            combinedY = Math.sin(bot.angle + noise);
            bot.isBoosting = false;
          }

          if (combinedX !== 0 || combinedY !== 0) {
            bot.targetAngle = Math.atan2(combinedY, combinedX);
          }
        }

        // Apply bot turning speed limits
        const botAngleDiff = Math.atan2(Math.sin(bot.targetAngle - bot.angle), Math.cos(bot.targetAngle - bot.angle));
        bot.angle += botAngleDiff * (diff === 'easy' ? 0.08 : diff === 'medium' ? 0.12 : 0.16);

        // Adjust actual moves speed according to speed boost
        const bSpeedBase = diff === 'easy' ? 2.0 : diff === 'medium' ? 2.8 : 3.8;
        const bSpeedTarget = bot.isBoosting ? bSpeedBase * 1.7 : bSpeedBase;
        bot.speed += (bSpeedTarget - bot.speed) * 0.1;

        // Bot boosting drops food segments occasionally
        if (bot.isBoosting && bot.segments.length > 8 && Math.random() < 0.15) {
          const lastSeg = bot.segments[bot.segments.length - 1];
          state.foods.push({
            x: lastSeg.x,
            y: lastSeg.y,
            color: bot.color,
            size: 3,
            value: 1,
            type: 'fruit',
            pulseTimer: Math.random() * 100
          });
          bot.segments.pop();
          bot.trailHistory.splice(-SEGMENT_GAP);
        }
      });

      // ----------------------------------------
      // 4. DETECT COLLISIONS (EVALUATE DEATHS)
      // ----------------------------------------
      let playerDeadThisFrame = false;

      // Evaluate each snake
      allSnakes.forEach(target => {
        if (target.isDead) return;

        const head = target.segments[0];
        const headRadius = (target.size / 2) * 1.2;

        allSnakes.forEach(other => {
          if (other.isDead) return;

          // Fast broad-phase check: if heads are too far, skip all segment collision checks
          const headDistanceCoords = getWrappedOffsetCoordinates(other.segments[0].x, other.segments[0].y, head.x, head.y);
          const hdx = headDistanceCoords.x - head.x;
          const hdy = headDistanceCoords.y - head.y;
          const headDistSq = hdx * hdx + hdy * hdy;
          const maxSafetyDistance = 150 + (target.segments.length * 5) + (other.segments.length * 5);
          if (headDistSq > maxSafetyDistance * maxSafetyDistance) {
            return; // Skip segment loop for this other snake entirely!
          }

          other.segments.forEach((seg, idx) => {
            // Ignore head collision with itself or neck points
            if (other.id === target.id && idx < 6) return;

            // Compensate coordinate wrap differences
            const coords = getWrappedOffsetCoordinates(seg.x, seg.y, head.x, head.y);
            const dx = coords.x - head.x;
            const dy = coords.y - head.y;
            const distSq = dx * dx + dy * dy;

            const otherSegmentRadius = (other.size / 2) * 0.8;
            const triggerDist = headRadius + otherSegmentRadius;

            if (distSq < triggerDist * triggerDist) {
              // If target is the player and they are invincible, ignore the death!
              if (target.isPlayer && powerUpInvincibleTimerRef.current > 0) {
                return;
              }

              // Collided! Sunder / crash & Die!
              target.isDead = true;

              // Turn entire body of dead snake into small carcass food dots
              target.segments.forEach((bodySeg, i) => {
                // Drop a glowing food segment every 2 body circles
                if (i % 2 === 0) {
                  state.foods.push({
                    x: bodySeg.x,
                    y: bodySeg.y,
                    color: target.color,
                    size: 2.2 + Math.random() * 1.2,
                    value: 2 + Math.floor(target.segments.length / 15),
                    type: 'carcass',
                    pulseTimer: Math.random() * 100
                  });
                }
              });

              // Play animations & explosions (reduced from 25 to 8 particles to conserve memory)
              spawnParticles(head.x, head.y, target.color, 8);

              if (target.isPlayer) {
                playerDeadThisFrame = true;
              } else {
                // BOT Eliminate notifications & play quick sfx
                if (audioService && sfxVolume > 0) {
                  audioService.playClick(); // slight eliminate confirmation ring
                }
              }
            }
          });
        });
      });

      // Clean out dead bots and dynamically spawn replacements to maintain competitive density in the open arena
      const aliveBots = state.bots.filter(b => !b.isDead);
      
      let targetBotCount = 7;
      let attackerCount = 2;
      if (diff === 'easy') {
        targetBotCount = 4;
        attackerCount = 1;
      } else if (diff === 'hard') {
        targetBotCount = 10;
        attackerCount = 4;
      }

      const deadBotsCount = Math.max(0, targetBotCount - aliveBots.length);
      
      state.bots = aliveBots;

      for (let i = 0; i < deadBotsCount; i++) {
        const currentAttackersCount = state.bots.filter(b => b.isAttacker).length;
        const isAttacker = currentAttackersCount < attackerCount;
        
        let name = '';
        let color = '';
        let headColor = '';

        if (isAttacker) {
          const attackerNames = ['RED_STALKER', 'STEALTH_VIPER', 'TERROR_HISS', 'BLOOD_REAPER', 'NIGHTMARE_BOT', 'CRIMSON_FANG'];
          name = attackerNames[Math.floor(Math.random() * attackerNames.length)] + `_${Math.floor(Math.random() * 90 + 10)}`;
          color = '#ef4444'; // dangerous neon red
          headColor = '#f87171'; // lighter red warning head
        } else {
          name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + `_${Math.floor(Math.random() * 90 + 10)}`;
          const botColor = BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
          color = botColor.body;
          headColor = botColor.head;
        }

        const rx = Math.random() * ARENA_SIZE;
        const ry = Math.random() * ARENA_SIZE;
        const rAngle = Math.random() * Math.PI * 2;

        // Random length as explicitly requested
        let minLen = 5;
        let maxLen = 12;
        if (diff === 'easy') { minLen = 4; maxLen = 8; }
        else if (diff === 'medium') { minLen = 6; maxLen = 13; }
        else { minLen = 8; maxLen = 18; }
        const botLength = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;

        const botSpeed = diff === 'easy' ? 1.8 : diff === 'medium' ? 2.8 : 3.8;

        const botHist: Position[] = [];
        const botSegs: Position[] = [];

        const botStepDist = botSpeed / SEGMENT_GAP;
        for (let j = 0; j < botLength * SEGMENT_GAP; j++) {
          botHist.push({
            x: rx - Math.cos(rAngle) * j * botStepDist,
            y: ry - Math.sin(rAngle) * j * botStepDist
          });
        }
        for (let j = 0; j < botLength; j++) {
          botSegs.push({ ...botHist[j * SEGMENT_GAP] });
        }

        state.bots.push({
          id: `bot_spawned_${Math.random()}`,
          name,
          isPlayer: false,
          x: rx,
          y: ry,
          color,
          headColor,
          segments: botSegs,
          trailHistory: botHist,
          angle: rAngle,
          targetAngle: rAngle,
          speed: botSpeed,
          score: Math.floor(botLength * 2),
          size: 12,
          isBoosting: false,
          pulseTimer: Math.random() * 100,
          isDead: false,
          isAttacker
        });
      }

      // Check player death triggers
      if (playerDeadThisFrame) {
        if (hapticFeedbackRef.current && audioService) {
          audioService.vibrate([150, 80, 150]);
        }
        
        // Final score updates
        const finalScoreVal = scoreRef.current;
        if (finalScoreVal > highScore) {
          try {
            localStorage.setItem('khans-snake-arena-pb', finalScoreVal.toString());
            setHighScore(finalScoreVal);
          } catch {}
        }

        setGameState('gameover');
        onGameOverRef.current(finalScoreVal);
        return; // Halt logic
      }

      // ----------------------------------------
      // 5. COLLISION WITH FOOD (EATING & GROWING)
      // ----------------------------------------
      const eatenIdxs = new Set<number>();

      allSnakes.forEach(snake => {
        if (snake.isDead) return;

        const head = snake.segments[0];
        const headRadius = snake.size / 2;

        state.foods.forEach((food, idx) => {
          if (eatenIdxs.has(idx)) return;

          const coords = getWrappedOffsetCoordinates(food.x, food.y, head.x, head.y);
          const dx = coords.x - head.x;
          const dy = coords.y - head.y;
          const distSq = dx * dx + dy * dy;

          const totalEatRange = headRadius + food.size + 15; // slightly generous hover magnet pull
          
          if (distSq < totalEatRange * totalEatRange) {
            eatenIdxs.add(idx);

            // Feed snake, grow size and segments
            snake.score += food.value;
            
            // Snake grows exactly one segment/ball per eaten dot as requested
            const lastSegment = snake.segments[snake.segments.length - 1] || head;
            snake.segments.push({ ...lastSegment });
            
            // Pad historical path trail
            for (let t = 0; t < SEGMENT_GAP; t++) {
              snake.trailHistory.push({ ...lastSegment });
            }

            // Keep snake physical width/thickness completely constant at 12
            snake.size = 12;

            // Spawn eating spark particle effects (reduced scale to 2 to minimize memory usage)
            spawnParticles(food.x, food.y, food.color, 2);

            // Trigger score hooks and noises if it's the player
            if (snake.isPlayer) {
              const newS = scoreRef.current + food.value;
              scoreRef.current = newS;
              setScore(newS);

              // Activate power-ups if eaten!
              if (food.type === 'powerup_speed') {
                powerUpSpeedTimerRef.current = 480; // 8 seconds
                if (audioService && sfxVolume > 0) {
                  audioService.playSuccess(); // play success feedback sound
                }
              } else if (food.type === 'powerup_invincible') {
                powerUpInvincibleTimerRef.current = 480; // 8 seconds
                if (audioService && sfxVolume > 0) {
                  audioService.playSuccess(); // play success feedback sound
                }
              }

              if (onScoreUpdateRef.current) {
                onScoreUpdateRef.current(newS);
              }

              if (audioService && sfxVolume > 0 && Math.random() < 0.4) {
                audioService.playClick(); // sweet cute eating pitch
              }
            }
          }
        });
      });

      // Filter eaten foods, replenish randomized normal fruits
      state.foods = state.foods.filter((_, idx) => !eatenIdxs.has(idx));
      const targetNormalCount = diff === 'easy' ? 70 : diff === 'medium' ? 100 : 130;
      
      while (state.foods.filter(f => f.type === 'fruit').length < targetNormalCount) {
        state.foods.push({
          x: Math.random() * ARENA_SIZE,
          y: Math.random() * ARENA_SIZE,
          color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
          size: 2.0 + Math.random() * 2.5,
          value: 1 + Math.floor(Math.random() * 2),
          type: 'fruit',
          pulseTimer: Math.random() * 100
        });
      }

      // Replenish power-ups
      const targetSpeedCount = diff === 'easy' ? 3 : diff === 'medium' ? 4 : 5;
      const targetInvCount = diff === 'easy' ? 1 : diff === 'medium' ? 2 : 3;

      while (state.foods.filter(f => f.type === 'powerup_speed').length < targetSpeedCount) {
        state.foods.push({
          x: Math.random() * ARENA_SIZE,
          y: Math.random() * ARENA_SIZE,
          color: '#39ff14', // Neon fluorescent green for speed boost
          size: 6.0,
          value: 5,
          type: 'powerup_speed',
          pulseTimer: Math.random() * 100
        });
      }

      while (state.foods.filter(f => f.type === 'powerup_invincible').length < targetInvCount) {
        state.foods.push({
          x: Math.random() * ARENA_SIZE,
          y: Math.random() * ARENA_SIZE,
          color: '#fbbf24', // Golden metallic yellow
          size: 7.0,
          value: 10,
          type: 'powerup_invincible',
          pulseTimer: Math.random() * 100
        });
      }

      // ----------------------------------------
      // 6. UPDATE PARTICLES & ANIMATIONS (DISABLED)
      // ----------------------------------------
      // Particles updating disabled to avoid CPU loops and lag

      // Update Top snakes leaderboard
      const sortedSnakesList = allSnakes
        .filter(s => !s.isDead)
        .map(s => ({ name: s.name, score: s.score, isPlayer: s.isPlayer }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
      
      setTopSnakes(sortedSnakesList);

      // ----------------------------------------
      // 7. RENDER ARENA & GRAPHICS
      // ----------------------------------------
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Camera translations: lock on player snake's head
      ctx.save();
      ctx.translate(canvas.width / 2 - player.segments[0].x, canvas.height / 2 - player.segments[0].y);

      // A. DRAW CYBER GRID LINES (Scrolling relative to movement)
      const gridSpacing = 100;
      ctx.strokeStyle = '#334155'; // neat slate grid line
      ctx.lineWidth = 0.5;

      const viewportLeft = player.segments[0].x - canvas.width / 2 - 100;
      const viewportRight = player.segments[0].x + canvas.width / 2 + 100;
      const viewportTop = player.segments[0].y - canvas.height / 2 - 100;
      const viewportBottom = player.segments[0].y + canvas.height / 2 + 100;

      // Draw vertical lines
      const minCol = Math.floor(viewportLeft / gridSpacing);
      const maxCol = Math.ceil(viewportRight / gridSpacing);
      for (let c = minCol; c <= maxCol; c++) {
        const gx = wrapPosition(c * gridSpacing, ARENA_SIZE);
        // Draw segment by segment to make grid continuous or draw simple lines stretching with wrap adjustments
        ctx.beginPath();
        ctx.moveTo(c * gridSpacing, viewportTop);
        ctx.lineTo(c * gridSpacing, viewportBottom);
        ctx.stroke();
      }

      // Draw horizontal lines
      const minRow = Math.floor(viewportTop / gridSpacing);
      const maxRow = Math.ceil(viewportBottom / gridSpacing);
      for (let r = minRow; r <= maxRow; r++) {
        const gy = wrapPosition(r * gridSpacing, ARENA_SIZE);
        ctx.beginPath();
        ctx.moveTo(viewportLeft, r * gridSpacing);
        ctx.lineTo(viewportRight, r * gridSpacing);
        ctx.stroke();
      }

      // Boundary indicators: display neon red border lines at the physical extent of the arena (simulate cyber grid fence)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, ARENA_SIZE, ARENA_SIZE);
      ctx.shadowBlur = 0;

      // B. DRAW FOODS
      state.foods.forEach(food => {
        // Adjust food coords near wrap borders
        const coords = getWrappedOffsetCoordinates(food.x, food.y, player.segments[0].x, player.segments[0].y);
        
        ctx.save();
        
        // Pulsate neon size slightly
        food.pulseTimer += 0.08;
        const currentSize = food.size + Math.max(0.3, Math.sin(food.pulseTimer) * (food.type !== 'fruit' && food.type !== 'carcass' ? 1.2 : 0.4));
        const radius = Math.max(1.5, currentSize);
        
        // Add glowing shadow effect only for special power-ups
        const isPowerUp = food.type === 'powerup_speed' || food.type === 'powerup_invincible';
        if (isPowerUp) {
          ctx.shadowBlur = 16;
          ctx.shadowColor = food.color;
        }

        // Outer high-contrast black rim adds high visibility against grid
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, radius + 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        
        // Inner bright colored core
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = food.color;
        ctx.fill();

        if (isPowerUp) {
          ctx.shadowBlur = 0; // reset shadow immediately for performance

          // Draw an extra pulsing outer orbital halo
          ctx.beginPath();
          ctx.arc(coords.x, coords.y, radius * 1.8, 0, Math.PI * 2);
          ctx.strokeStyle = food.color;
          ctx.lineWidth = 1.5;
          ctx.globalAlpha = 0.4 + Math.sin(food.pulseTimer * 1.5) * 0.2;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Shimmer glint
        ctx.beginPath();
        ctx.arc(coords.x - radius * 0.25, coords.y - radius * 0.25, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.restore();
      });

      // C. DRAW ALL SNAKES (PLAYER & BOTS)
      allSnakes.forEach(snake => {
        if (snake.isDead) return;

        // Calculate screen-wrapped coordinates for each segment relative to player's head for absolute structural integrity
        const px = player.segments[0].x;
        const py = player.segments[0].y;
        const drawnCoords: Position[] = snake.segments.map(seg => getPlayRelativeCoords(seg.x, seg.y, px, py));

        // Draw boosting thermal visual emissions/tails
        if (snake.isBoosting && drawnCoords.length > 0) {
          ctx.save();
          const drawnTail = drawnCoords[drawnCoords.length - 1];
          ctx.fillStyle = '#fb923c'; // fiery orange boost base
          ctx.beginPath();
          ctx.arc(drawnTail.x, drawnTail.y, snake.size * 0.9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f97316'; // fiery orange boost inner
          ctx.beginPath();
          ctx.arc(drawnTail.x, drawnTail.y, snake.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw physical stylized connecting spine path (Aesthetic connection)
        if (drawnCoords.length > 1) {
          ctx.save();
          
          // Step 1: Thick structural black armor outline connecting path
          ctx.beginPath();
          ctx.moveTo(drawnCoords[0].x, drawnCoords[0].y);
          for (let i = 1; i < drawnCoords.length; i++) {
            ctx.lineTo(drawnCoords[i].x, drawnCoords[i].y);
          }
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = snake.size * 1.1;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Step 2: Bright responsive neon spinal core tube
          ctx.beginPath();
          ctx.moveTo(drawnCoords[0].x, drawnCoords[0].y);
          for (let i = 1; i < drawnCoords.length; i++) {
            ctx.lineTo(drawnCoords[i].x, drawnCoords[i].y);
          }
          ctx.strokeStyle = snake.color;
          ctx.lineWidth = snake.size * 0.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          ctx.restore();
        }

        // Draw body armored plate segment nodes in reverse order so head elements render on top
        for (let i = snake.segments.length - 1; i >= 0; i--) {
          const drawnSeg = drawnCoords[i];
          if (!drawnSeg) continue;

          ctx.save();
          
          // Every segment/ball has a uniform size with no tapering to keep width exactly the same
          const drawRadius = snake.size / 2;

          // Outer solid dark contrast rim
          ctx.beginPath();
          ctx.arc(drawnSeg.x, drawnSeg.y, Math.max(3, drawRadius + 1.5), 0, Math.PI * 2);
          ctx.fillStyle = '#1e293b'; // off-black plate outline
          ctx.fill();

          // Draw an extra golden forcefield orbit around head under invincibility
          if (snake.isPlayer && i === 0 && powerUpInvincibleTimerRef.current > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(drawnSeg.x, drawnSeg.y, drawRadius * 2.2, 0, Math.PI * 2);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#fbbf24';
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.015) * 0.3;
            ctx.stroke();
            ctx.restore();
          }

          // Inner colorful glowing node segment
          ctx.beginPath();
          ctx.arc(drawnSeg.x, drawnSeg.y, Math.max(2, drawRadius - 0.5), 0, Math.PI * 2);
          
          if (snake.isPlayer) {
            if (powerUpInvincibleTimerRef.current > 0) {
              const isEven = i % 2 === 0;
              ctx.fillStyle = i === 0 ? '#f59e0b' : (isEven ? '#fbbf24' : '#f59e0b'); // Amber-gold metallic duo
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#fbbf24';
            } else if (powerUpSpeedTimerRef.current > 0) {
              const isEven = i % 2 === 0;
              ctx.fillStyle = i === 0 ? '#10b981' : (isEven ? '#34d399' : '#10b981'); // Emerald cyber green
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#10b981';
            } else {
              ctx.fillStyle = i === 0 ? snake.headColor : (i % 2 === 0 ? snake.color : snake.headColor);
            }
          } else {
            ctx.fillStyle = i === 0 ? snake.headColor : (i % 2 === 0 ? snake.color : snake.headColor);
          }
          ctx.fill();
          ctx.shadowBlur = 0; // reset shadow for optimization

          // Tech light-glare specular dot for 3D metallic sphere look
          ctx.beginPath();
          ctx.arc(drawnSeg.x - drawRadius * 0.25, drawnSeg.y - drawRadius * 0.25, Math.max(1, drawRadius * 0.35), 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();

          // Head features (Eyes)
          if (i === 0) {
            ctx.fillStyle = '#ffffff';

            const eyeOffsetRad = 0.55; 
            const eyeDist = drawRadius * 0.6;

            const lx = drawnSeg.x + Math.cos(snake.angle - eyeOffsetRad) * eyeDist;
            const ly = drawnSeg.y + Math.sin(snake.angle - eyeOffsetRad) * eyeDist;
            
            const rx = drawnSeg.x + Math.cos(snake.angle + eyeOffsetRad) * eyeDist;
            const ry = drawnSeg.y + Math.sin(snake.angle + eyeOffsetRad) * eyeDist;
            
            ctx.beginPath();
            ctx.arc(lx, ly, drawRadius * 0.4, 0, Math.PI * 2);
            ctx.arc(rx, ry, drawRadius * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            const plx = lx + Math.cos(snake.angle) * (drawRadius * 0.15);
            const ply = ly + Math.sin(snake.angle) * (drawRadius * 0.15);
            const prx = rx + Math.cos(snake.angle) * (drawRadius * 0.15);
            const pry = ry + Math.sin(snake.angle) * (drawRadius * 0.15);

            ctx.beginPath();
            ctx.arc(plx, ply, drawRadius * 0.2, 0, Math.PI * 2);
            ctx.arc(prx, pry, drawRadius * 0.2, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      });

      // D. DRAW PARTICLE BURSTS (DISABLED)
      // Visual explosions removed to keep drawing loop ultra-fast and modern

      ctx.restore(); // Camera coordinate system reset

      // E. DRAW JOYSTICK OVERLAY IF TOUCH IN PROGRESS
      if (touchState.current.active) {
        const { startX, startY, currentX, currentY } = touchState.current;
        
        ctx.save();
        // Base outer ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(startX, startY, 50, 0, Math.PI * 2);
        ctx.stroke();

        // Core dragging dot
        ctx.fillStyle = 'rgba(99, 102, 241, 0.6)'; // indigo joystick core
        ctx.beginPath();
        
        const dx = currentX - startX;
        const dy = currentY - startY;
        const dLen = Math.sqrt(dx * dx + dy * dy);
        const maxLen = 45;
        const jx = startX + (dx / (dLen || 1)) * Math.min(dLen, maxLen);
        const jy = startY + (dy / (dLen || 1)) * Math.min(dLen, maxLen);

        ctx.arc(jx, jy, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Loop ticker
      requestRef.current = requestAnimationFrame(updateAndDraw);
    };

    requestRef.current = requestAnimationFrame(updateAndDraw);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, isPlaying, sfxVolume]);

  // Touch triggers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    // Set touch tracking data
    touchState.current = {
      active: true,
      startX: tx,
      startY: ty,
      currentX: tx,
      currentY: ty
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchState.current.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = touch.clientX - rect.left;
    const ty = touch.clientY - rect.top;

    touchState.current.currentX = tx;
    touchState.current.currentY = ty;
  };

  const handleTouchEnd = () => {
    touchState.current.active = false;
  };

  // Track Mouse movement relative to screen center
  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseState.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  // Launch Session action
  const handleStartGame = () => {
    audioService.playClick();
    initializeGame();
    setGameState('playing');
  };

  // Keyboard navigation instructions
  return (
    <div 
      className="relative w-full h-full min-h-[400px] bg-slate-950 flex flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
    >
      {gameState === 'lobby' ? (
        <div className="z-10 text-center max-w-md w-full p-5 sm:p-8 bg-slate-900/80 border border-indigo-500/20 rounded-[2rem] sm:rounded-[2.5rem] backdrop-blur-xl shadow-2xl mx-4 relative overflow-y-auto max-h-[85vh] scrollbar-thin animate-in fade-in zoom-in-95 duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-2xl sm:text-4xl mb-4 sm:mb-6 shadow-lg shadow-indigo-500/30">
            <i className="fas fa-snake text-white"></i>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-1 sm:mb-2 tracking-tighter italic uppercase">SNAKE ARENA</h1>
          <p className="text-[10px] sm:text-sm text-indigo-300 font-semibold uppercase tracking-widest mb-4 sm:mb-6">Open Arena Survival Duel</p>
          
          <p className="text-[11px] sm:text-xs text-slate-400 mb-4 sm:mb-8 leading-relaxed">
            Rule the endless grid! Collect colorful energy dots to grow massive. Hunt down other cyber snakes by baiting them into crashing head-first into your body segments. Boost to evade and conquer!
          </p>

          <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-8 text-left">
            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400 block mb-2">Select Arena Difficulty</span>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setDifficulty(mode);
                      audioService.playClick();
                    }}
                    className={`py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-wider border transition-all ${
                      difficulty === mode
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/40 text-slate-400 border-white/5 hover:border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/40 border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex items-start gap-2 sm:gap-3">
              <i className="fas fa-gamepad text-indigo-400 mt-0.5 text-xs sm:text-sm"></i>
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase leading-none mb-1">Controls</span>
                <span className="text-[10px] sm:text-xs text-slate-400 leading-normal">
                  <strong>Keyboard</strong>: Mouse cursor or <strong>W, A, S, D / Arrows</strong> to steer. Hold <strong>SPACE</strong> to boost. <br />
                  <strong>Mobile/Touch</strong>: Drag anywhere to steer. Boost widget is located on the right.
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg tracking-wide uppercase shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Enter Arena Duel
          </button>
        </div>
      ) : gameState === 'gameover' ? (
        <div className="z-10 text-center max-w-sm w-full p-5 sm:p-8 bg-slate-900/90 border border-rose-500/20 rounded-[2rem] sm:rounded-[2.5rem] backdrop-blur-xl shadow-2xl mx-4 relative overflow-y-auto max-h-[85vh] scrollbar-thin animate-in fade-in zoom-in-95 duration-500">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center text-xl sm:text-3xl mb-4 sm:mb-6 shadow-lg shadow-rose-500/30 animate-bounce">
            <i className="fas fa-skull-crossbones text-white animate-pulse"></i>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-rose-500 mb-1 sm:mb-2 tracking-tighter uppercase italic">SNAKE CRASHED!</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mb-4 sm:mb-6 font-medium">You smashed head-first into an opponent snake and splayed into cyber energy!</p>

          <div className="bg-slate-950/40 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Final Score Achieved</span>
            <p className="text-3xl sm:text-5xl font-black text-indigo-400 italic tabular-nums mb-2 sm:mb-4">{score.toLocaleString()}</p>
            
            <div className="flex items-center justify-between border-t border-white/5 pt-2.5 sm:pt-3">
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 tracking-wider">Your Personal Best</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-300 tabular-nums">{Math.max(score, highScore).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleStartGame}
              className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wide transition-all active:scale-[0.97]"
            >
              Re-spawn in Arena
            </button>
            <button
              onClick={() => {
                audioService.playClick();
                setGameState('lobby');
              }}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all"
            >
              View Setup Menu
            </button>
          </div>
        </div>
      ) : null}

      {/* Render Canvas exclusively during active playtime */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full cursor-crosshair transition-opacity duration-300 ${gameState === 'playing' ? 'opacity-100' : 'opacity-25 pointer-events-none'}`}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />

      {/* Live HUD statistics */}
      {gameState === 'playing' && (
        <>
          {/* Active Powerups Overlay Panel */}
          <div className="absolute top-4 left-4 flex flex-col gap-2.5 pointer-events-none select-none z-10">
            {activePowerUpSpeed > 0 && (
              <div className="flex items-center gap-3 bg-slate-950/85 border border-[#39ff14]/30 rounded-2xl px-4 py-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(57,255,20,0.15)] transition-all animate-pulse duration-1000">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#39ff14]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Power-up</span>
                  <span className="text-[11px] font-black text-[#39ff14] uppercase tracking-wider leading-none">Speed Boost</span>
                </div>
                <div className="ml-2 h-6 w-px bg-white/10" />
                <span className="ml-1 font-mono text-xs font-black text-slate-200 tabular-nums">{activePowerUpSpeed}s</span>
              </div>
            )}

            {activePowerUpInvincible > 0 && (
              <div className="flex items-center gap-3 bg-slate-950/85 border border-[#fbbf24]/30 rounded-2xl px-4 py-2.5 backdrop-blur-md shadow-[0_0_15px_rgba(251,191,36,0.15)] transition-all animate-pulse duration-1000">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fbbf24] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#fbbf24]"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5">Power-up</span>
                  <span className="text-[11px] font-black text-[#fbbf24] uppercase tracking-wider leading-none">Invincibility</span>
                </div>
                <div className="ml-2 h-6 w-px bg-white/10" />
                <span className="ml-1 font-mono text-xs font-black text-slate-200 tabular-nums">{activePowerUpInvincible}s</span>
              </div>
            )}
          </div>

          {/* Top scoreboard (Slither style multiplayer list mockup) */}
          <div className="absolute top-4 right-4 bg-slate-950/80 border border-white/5 rounded-2xl p-4 backdrop-blur-md shadow-2xl pointer-events-auto min-w-[170px] max-w-[220px] select-none text-left">
            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-2 border-b border-white/10 pb-1.5"><i className="fas fa-crown mr-1"></i> Leaderboard</span>
            <div className="flex flex-col gap-1.5 font-sans">
              {topSnakes.map((sn, id) => (
                <div 
                  key={id} 
                  className={`flex items-center justify-between text-[11px] gap-2 ${
                    sn.isPlayer 
                      ? 'text-indigo-400 font-extrabold' 
                      : 'text-slate-300'
                  }`}
                >
                  <span className="truncate flex items-center max-w-[110px]">
                    <span className="text-[8px] opacity-40 font-black tabular-nums mr-1">{id + 1}.</span>
                    <span className="truncate">{sn.name}</span>
                  </span>
                  <span className="font-mono tabular-nums text-right text-[10px] opacity-90">{sn.score.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Boosting instructions & Mobile Boost trigger btn */}
          <div className="absolute bottom-6 left-6 flex flex-col items-start gap-1">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none bg-slate-950/80 px-3 py-1.5 rounded-full border border-white/5"><i className="fas fa-meteor text-amber-500 animate-pulse mr-1"></i> Active Speed Boost: SPACEBAR</span>
          </div>

          {/* Action indicator on Mobile/Touch for Boost */}
          <div className="absolute bottom-6 right-6 pointer-events-auto md:hidden">
            <button
              onTouchStart={() => {
                isBoostingPressed.current = true;
                if (hapticFeedback && audioService) audioService.vibrate(30);
              }}
              onTouchEnd={() => {
                isBoostingPressed.current = false;
              }}
              className="w-16 h-16 rounded-full bg-indigo-600/60 hover:bg-indigo-600 border border-indigo-400/30 flex items-center justify-center text-white font-extrabold text-[10px] uppercase tracking-wider shadow-lg active:scale-90 select-none"
            >
              BOOST
            </button>
          </div>
        </>
      )}
    </div>
  );
}
