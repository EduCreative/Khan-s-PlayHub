
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { COMMON_WORDS } from '../dictionary';

// Bounty riddles for Word Builder
const BOUNTIES = [
  { hint: "I have keys but no locks", word: "KEYBOARD" },
  { hint: "Always in front, never seen", word: "FUTURE" },
  { hint: "It belongs to you, but others use it more", word: "NAME" },
  { hint: "Found in your socks", word: "FEET" },
  { hint: "I follow you at noon", word: "SHADOW" }
];

interface WordBuilderProps {
  onGameOver: (score: number) => void;
  isPlaying: boolean;
  isDarkMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Block {
  y: number;
  targetY: number;
  color: string;
  w: number;
  shake: number;
  scaleY: number;
  hasLanded: boolean;
}

const WordBuilder: React.FC<WordBuilderProps> = ({ onGameOver, isPlaying, isDarkMode }) => {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [towerHeight, setTowerHeight] = useState(0);
  const [targetHeight, setTargetHeight] = useState(8);
  const [streak, setStreak] = useState(0);
  const [time, setTime] = useState(90);
  const [currentWord, setCurrentWord] = useState<{ char: string; index: number }[]>([]);
  const [pool, setPool] = useState<string[]>([]);
  const [themeIndex, setThemeIndex] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [bounty, setBounty] = useState(BOUNTIES[0]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const towerSwayRef = useRef(0);
  
  const themes = ['indigo', 'pink', 'emerald', 'cyan', 'amber', 'pixel'];

  const getThemeColors = (index: number) => {
    const theme = themes[index];
    switch (theme) {
      case 'indigo': return { primary: '#6366f1', secondary: '#818cf8' };
      case 'pink': return { primary: '#ec4899', secondary: '#f472b6' };
      case 'emerald': return { primary: '#10b981', secondary: '#34d399' };
      case 'cyan': return { primary: '#06b6d4', secondary: '#22d3ee' };
      case 'amber': return { primary: '#f59e0b', secondary: '#fbbf24' };
      case 'pixel': return { primary: '#ef4444', secondary: '#f97316' };
      default: return { primary: '#6366f1', secondary: '#818cf8' };
    }
  };

  const generatePool = useCallback(() => {
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const newPool: string[] = [];
    
    const shouldInject = Math.random() > 0.4;
    const bountyChars = bounty.word.split('');
    
    const vowelCount = 4;
    const consonantCount = 6;

    for (let i = 0; i < vowelCount; i++) {
      if (shouldInject && bountyChars.some(c => vowels.includes(c))) {
        const bountyVowels = bountyChars.filter(c => vowels.includes(c));
        newPool.push(bountyVowels[Math.floor(Math.random() * bountyVowels.length)]);
      } else {
        newPool.push(vowels[Math.floor(Math.random() * vowels.length)]);
      }
    }
    
    for (let i = 0; i < consonantCount; i++) {
      if (shouldInject && bountyChars.some(c => consonants.includes(c))) {
        const bountyConsonants = bountyChars.filter(c => consonants.includes(c));
        newPool.push(bountyConsonants[Math.floor(Math.random() * bountyConsonants.length)]);
      } else {
        newPool.push(consonants[Math.floor(Math.random() * consonants.length)]);
      }
    }
    
    setPool(newPool.sort(() => Math.random() - 0.5));
  }, [bounty]);

  const spawnParticles = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.8) * 12,
        life: 1,
        color,
        size: 2 + Math.random() * 4
      });
    }
  };

  const spawnBlock = (length: number, isMega: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let blockColor: string;
    if (isMega) {
      blockColor = '#fbbf24'; // Gold for bounty
    } else {
      const activeColors = getThemeColors(themeIndex);
      blockColor = activeColors.primary;
    }

    blocksRef.current.push({
      y: -100,
      targetY: canvas.height - (blocksRef.current.length * 40) - 40,
      color: blockColor,
      w: (isMega ? 200 : 120) + (length * 10),
      shake: 0,
      scaleY: 1,
      hasLanded: false
    });
  };

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      setLevel(1);
      setTowerHeight(0);
      setTargetHeight(8);
      setStreak(0);
      setTime(90);
      setThemeIndex(0);
      blocksRef.current = [];
      particlesRef.current = [];
      setBounty(BOUNTIES[Math.floor(Math.random() * BOUNTIES.length)]);
      generatePool();
    }
  }, [isPlaying, generatePool]);

  useEffect(() => {
    if (!isPlaying || time <= 0) return;
    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) { onGameOver(score); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, time, onGameOver, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animFrame: number;
    
    const render = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Global swaying of the tower
      towerSwayRef.current += 0.02;
      const swayMax = Math.min(20, blocksRef.current.length * 2);
      const currentSway = Math.sin(towerSwayRef.current) * swayMax;

      blocksRef.current.forEach((b, idx) => {
        // Smooth drop
        if (b.y < b.targetY) {
          b.y += (b.targetY - b.y) * 0.15;
          if (b.targetY - b.y < 1 && !b.hasLanded) {
            b.y = b.targetY;
            b.hasLanded = true;
            b.scaleY = 0.6; // Squash on impact
            b.shake = 15;
            spawnParticles(canvas.width / 2, b.y + 35, b.color, 15);
          }
        }

        // Recovery from squash/stretch
        if (b.scaleY < 1) {
          b.scaleY += (1 - b.scaleY) * 0.1;
        }

        if (b.shake > 0) b.shake -= 0.8;
        
        // Sway increases as we go up the tower
        const swayOffset = currentSway * (idx / Math.max(1, blocksRef.current.length));
        const sx = (Math.sin(Date.now() * 0.05) * b.shake) + swayOffset;

        ctx.save();
        // Translate to block position
        ctx.translate(canvas.width / 2 + sx, b.y + 17.5);
        ctx.scale(1 / b.scaleY, b.scaleY); // Stretch X to preserve volume
        ctx.translate(0, -17.5);

        ctx.fillStyle = b.color;
        ctx.shadowBlur = 20;
        ctx.shadowColor = b.color;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-b.w / 2, 0, b.w, 35, 12);
        } else {
            ctx.rect(-b.w / 2, 0, b.w, 35);
        }
        ctx.fill();

        // Decorative shine on block
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-b.w / 2, 2, b.w, 10, 10);
        }
        ctx.fill();

        // Animated eyes
        const blink = Math.sin(Date.now() * 0.005) > 0.98;
        ctx.fillStyle = isDarkMode ? 'white' : '#1e293b';
        ctx.beginPath();
        if (blink) {
          ctx.fillRect(-24, 15, 8, 2);
          ctx.fillRect(16, 15, 8, 2);
        } else {
          ctx.arc(-20, 15, 3.5, 0, Math.PI * 2);
          ctx.arc(20, 15, 3.5, 0, Math.PI * 2);
        }
        ctx.fill();
        
        ctx.restore();
      });

      // Particles Physics
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.45; // Gravity
        p.vx *= 0.98; // Friction
        p.life -= 0.015;
        
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      animFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrame);
  }, [isDarkMode]);

  const submitWord = () => {
    const word = currentWord.map(i => i.char).join('').toUpperCase();
    if (word.length < 3) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const isBounty = word === bounty.word.toUpperCase();
    const isValid = isBounty || COMMON_WORDS.has(word);

    if (isValid) {
      const blocksCount = isBounty ? 10 : Math.floor(word.length / 2);
      setTowerHeight(h => h + blocksCount);
      setStreak(s => s + 1);
      setScore(s => s + (isBounty ? 500 : word.length * 15) + (streak > 2 ? streak * 5 : 0));
      
      const { primary } = getThemeColors(themeIndex);
      spawnParticles(window.innerWidth / 2, 0, primary, 30);
      spawnBlock(word.length, isBounty);
      
      if (isBounty) {
        setBounty(BOUNTIES[Math.floor(Math.random() * BOUNTIES.length)]);
      }
      
      if (towerHeight + blocksCount >= targetHeight) {
        setLevel(l => l + 1);
        setTargetHeight(th => th + 5);
        setTime(t => t + 20);
        setThemeIndex(ti => (ti + 1) % themes.length);
      }
      
      setCurrentWord([]);
      generatePool();
    } else {
      setIsShaking(true);
      setStreak(0);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  const activeColors = getThemeColors(themeIndex);

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-lg h-full px-4 py-8 select-none relative">
      {/* Bounty Overlay */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90%] z-30">
        <div className="glass-card p-3 rounded-2xl border-amber-500/30 flex items-center gap-4 bg-amber-500/5 backdrop-blur-md">
           <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
              <i className="fas fa-scroll"></i>
           </div>
           <div>
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest leading-none mb-1">Mega Riddle Bounty</p>
              <p className="text-[11px] font-bold text-slate-300 leading-tight italic">"{bounty.hint}"</p>
           </div>
        </div>
      </div>

      <div className="w-full flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Global Score</span>
          <span className="text-3xl font-black italic transition-colors" style={{ color: activeColors.primary }}>{score.toLocaleString()}</span>
        </div>
        <div className="text-center">
          <div className="font-black text-xl tracking-tighter uppercase italic opacity-80" style={{ color: activeColors.secondary }}>Lvl {level}</div>
          {streak > 2 && <div className="text-[10px] font-black bg-white/10 px-2 py-0.5 rounded-full uppercase italic animate-pulse" style={{ color: activeColors.primary }}>Streak x{streak}</div>}
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Time</span>
          <div className={`text-2xl font-black ${time < 10 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
            {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative flex flex-col items-center justify-end overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full max-h-[50vh]" />
        
        <div className="absolute top-4 left-4 z-10">
           <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-colors bg-white/5 border border-white/10" style={{ color: activeColors.primary }}>
              <i className="fas fa-check-circle"></i>
              Nexus Lexicon Active
           </div>
        </div>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card px-6 py-2 border-white/5 flex items-center gap-4 z-10">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-slate-500">Tower Goal</span>
            <span className="font-black text-xl" style={{ color: activeColors.primary }}>{towerHeight}/{targetHeight}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 z-20">
        <div className={`glass-card h-20 flex items-center justify-center gap-2 p-2 border-2 transition-transform duration-75 relative ${isShaking ? 'animate-bounce border-rose-500/50' : 'border-white/5'}`}>
          <div className="flex items-center gap-2 min-h-[48px]">
            {currentWord.map((item, idx) => (
              <div key={idx} className="w-10 h-10 flex items-center justify-center font-black text-xl rounded-xl shadow-lg animate-in zoom-in duration-200 text-white" style={{ backgroundColor: activeColors.primary }}>
                {item.char}
              </div>
            ))}
          </div>
          {currentWord.length > 0 && (
            <button onClick={() => setCurrentWord([])} className="absolute right-4 text-slate-500 hover:text-rose-500 transition-colors">
              <i className="fas fa-times-circle text-lg"></i>
            </button>
          )}
        </div>

        <div className="grid grid-cols-5 gap-2">
          {pool.map((letter, idx) => {
            const isSelected = currentWord.some(item => item.index === idx);
            return (
              <button
                key={idx}
                disabled={isSelected}
                onClick={() => setCurrentWord([...currentWord, { char: letter, index: idx }])}
                className={`aspect-square glass-card rounded-2xl flex items-center justify-center text-2xl font-black uppercase transition-all ${isSelected ? 'opacity-20 scale-90' : 'hover:scale-105 active:scale-95'}`}
                style={{ borderColor: !isSelected ? `${activeColors.primary}22` : undefined }}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => { setCurrentWord([]); generatePool(); }} 
            className="glass-card h-14 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 uppercase font-black text-xs tracking-widest"
          >
            <i className="fas fa-sync-alt mr-2"></i> Scramble
          </button>
          <button 
            onClick={submitWord} 
            className="col-span-2 glass-card h-14 text-white font-black italic text-lg shadow-xl active:scale-95 transition-all uppercase flex items-center justify-center gap-2"
            style={{ backgroundColor: activeColors.primary, boxShadow: `0 10px 20px -5px ${activeColors.primary}55` }}
          >
            CONSTRUCT <i className="fas fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordBuilder;
