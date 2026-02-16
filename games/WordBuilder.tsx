
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
  isDarkMode: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Block {
  y: number;
  targetY: number;
  color: string;
  w: number;
  shake: number;
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

  const spawnParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { primary } = getThemeColors(themeIndex);
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: canvas.width / 2, y: canvas.height - 100,
        vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8 - 8,
        life: 1, color: primary
      });
    }
  };

  const spawnBlock = (length: number, isMega: boolean = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let blockColor: string;
    if (isMega) {
      blockColor = '#fbbf24'; // Always gold for bounty
    } else {
      const nextThemeColors = getThemeColors((themeIndex + 1) % themes.length);
      blockColor = nextThemeColors.primary;
    }

    blocksRef.current.push({
      y: -50,
      targetY: canvas.height - (blocksRef.current.length * 40) - 40,
      color: blockColor,
      w: (isMega ? 200 : 120) + (length * 10),
      shake: isMega ? 30 : 10
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
      blocksRef.current.forEach((b) => {
        if (b.y < b.targetY) b.y += (b.targetY - b.y) * 0.1;
        if (b.shake > 0) b.shake -= 0.5;
        const sx = Math.sin(Date.now() * 0.05) * b.shake;
        ctx.save();
        ctx.translate(canvas.width / 2 + sx, b.y);
        ctx.fillStyle = b.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = b.color;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-b.w / 2, 0, b.w, 35, 12);
        } else {
            ctx.rect(-b.w / 2, 0, b.w, 35);
        }
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-20, 15, 3, 0, Math.PI * 2);
        ctx.arc(20, 15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life -= 0.02;
        ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrame);
  }, [themeIndex]);

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
      const blocks = isBounty ? 10 : Math.floor(word.length / 2);
      setTowerHeight(h => h + blocks);
      setStreak(s => s + 1);
      setScore(s => s + (isBounty ? 5000 : word.length * 150) + (streak > 2 ? streak * 50 : 0));
      spawnParticles();
      spawnBlock(word.length, isBounty);
      
      if (isBounty) {
        setBounty(BOUNTIES[Math.floor(Math.random() * BOUNTIES.length)]);
      }
      
      if (towerHeight + blocks >= targetHeight) {
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
