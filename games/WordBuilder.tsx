
import React, { useState, useEffect, useRef, useCallback } from 'react';

const DICTIONARY = new Set([
  'AND','BAD','CAT','DOG','END','FUN','GET','HAT','ITS','JOY','KEY','LOG','MAP','NOT','OUT','PUT','RUN','SAY','TOP','USE','VAN','WAR','YES','ZOO',
  'BACK','CITY','DARK','EACH','FAST','GAME','HAND','IDEA','JUST','KEEP','LIFE','MAKE','NEXT','OPEN','PART','QUIT','REAL','STAY','TIME','UNIT','VERY','WANT','YEAR','ZONE',
  'ABOUT','BRING','CLEAR','DRIVE','EVERY','FIRST','GREAT','HAPPY','INNER','JUDGE','KNOWS','LIGHT','MUSIC','NIGHT','ORDER','PIXEL','QUICK','RIGHT','SPACE','TOUCH','UNDER','VOICE','WORLD','YOUTH',
  'ALWAYS','BECOME','CHANGE','DURING','ENERGY','FINISH','GROUND','HEALTH','INSTANT','JUNGLE','KINDLY','LAYOUT','MARKET','NOTICE','OUTPUT','PLAYER','RANDOM','STRONG','TOWERS','URGENT','VISUAL','WINDOW','YELLOW',
  'BETWEEN','CONTROL','DYNAMIC','EXAMPLE','FOCUSED','GENERAL','HISTORY','IMPROVE','JUSTICE','KITCHEN','LIBRARY','MESSAGE','NETWORK','OPINION','PROCESS','QUALITY','RECORDS','STRETCH','THROUGH','UNKNOWN','VILLAGE','WEATHER','ZENITH'
]);

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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const themes = ['indigo', 'pink', 'emerald', 'cyan', 'amber'];

  const generatePool = useCallback(() => {
    const vowels = 'AEIOU';
    const consonants = 'BCDFGHJKLMNPQRSTVWXYZ';
    const newPool = [];
    for (let i = 0; i < 3; i++) newPool.push(vowels[Math.floor(Math.random() * vowels.length)]);
    for (let i = 0; i < 7; i++) newPool.push(consonants[Math.floor(Math.random() * consonants.length)]);
    setPool(newPool.sort(() => Math.random() - 0.5));
  }, []);

  const spawnParticles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const color = themes[themeIndex] === 'indigo' ? '#6366f1' : themes[themeIndex] === 'pink' ? '#ec4899' : '#10b981';
    for (let i = 0; i < 20; i++) {
      particlesRef.current.push({
        x: canvas.width / 2,
        y: canvas.height - 100,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 8,
        life: 1,
        color
      });
    }
  };

  const spawnBlock = (length: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const color = themes[(themeIndex + 1) % themes.length];
    const hexColor = color === 'indigo' ? '#6366f1' : color === 'pink' ? '#ec4899' : '#10b981';
    blocksRef.current.push({
      y: -50,
      targetY: canvas.height - (blocksRef.current.length * 40) - 40,
      color: hexColor,
      w: 120 + (length * 10),
      shake: 10
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
      blocksRef.current = [];
      particlesRef.current = [];
      generatePool();
    }
  }, [isPlaying, generatePool]);

  useEffect(() => {
    if (!isPlaying || time <= 0) return;
    const timer = setInterval(() => {
      setTime(prev => {
        if (prev <= 1) {
          onGameOver(score);
          return 0;
        }
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

      // Render Blocks
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
        ctx.roundRect(-b.w / 2, 0, b.w, 35, 12);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-20, 15, 3, 0, Math.PI * 2);
        ctx.arc(20, 15, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.2;
        p.life -= 0.02;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1;

      animFrame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animFrame);
  }, [themeIndex]);

  const selectLetter = (char: string, index: number) => {
    if (currentWord.some(item => item.index === index)) return;
    setCurrentWord([...currentWord, { char, index }]);
  };

  const submitWord = () => {
    const word = currentWord.map(i => i.char).join('');
    if (word.length < 3) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (DICTIONARY.has(word)) {
      const blocks = Math.floor(word.length / 2);
      setTowerHeight(h => h + blocks);
      setStreak(s => s + 1);
      setScore(s => s + (word.length * 150) + (streak > 2 ? streak * 50 : 0));
      spawnParticles();
      spawnBlock(word.length);
      
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

  return (
    <div className="flex flex-col items-center justify-between w-full max-w-lg h-full px-4 py-8 select-none">
      <div className="w-full flex justify-between items-center z-20">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Global Score</span>
          <span className="text-3xl font-black italic text-indigo-500">{score.toLocaleString()}</span>
        </div>
        <div className="text-center">
          <div className="text-indigo-400 font-black text-xl tracking-tighter uppercase italic">Lvl {level}</div>
          {streak > 2 && <div className="text-[10px] font-black bg-indigo-600 px-2 py-0.5 rounded-full uppercase italic animate-pulse">Streak x{streak}</div>}
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
        <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card px-6 py-2 border-indigo-500/30 flex items-center gap-4 z-10">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-black text-slate-500">Tower Goal</span>
            <span className="font-black text-xl text-indigo-500">{towerHeight}/{targetHeight}</span>
          </div>
        </div>
      </div>

      <div className="w-full space-y-4 z-20">
        <div className={`glass-card h-20 flex items-center justify-center gap-2 p-2 border-2 transition-transform duration-75 ${isShaking ? 'animate-bounce border-rose-500/50' : 'border-white/5'}`}>
          <div className="flex items-center gap-2 min-h-[48px]">
            {currentWord.map((item, idx) => (
              <div key={idx} className="w-10 h-10 flex items-center justify-center font-black text-xl bg-indigo-600 rounded-xl shadow-lg animate-in zoom-in duration-200">
                {item.char}
              </div>
            ))}
          </div>
          {currentWord.length > 0 && (
            <button onClick={() => setCurrentWord([])} className="absolute right-4 text-slate-500 hover:text-rose-500 transition-colors">
              <i className="fas fa-times-circle"></i>
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
                onClick={() => selectLetter(letter, idx)}
                className={`
                  aspect-square glass-card rounded-2xl flex items-center justify-center text-2xl font-black uppercase transition-all
                  ${isSelected ? 'opacity-20 scale-90' : 'hover:scale-105 active:scale-95 hover:border-indigo-500/50'}
                `}
              >
                {letter}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button onClick={generatePool} className="glass-card h-14 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95 uppercase font-black text-xs tracking-widest">
            <i className="fas fa-sync-alt mr-2"></i> Scramble
          </button>
          <button onClick={submitWord} className="col-span-2 glass-card h-14 bg-indigo-600 border-indigo-400 text-white font-black italic text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all uppercase">
            Construct <i className="fas fa-arrow-up ml-2"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordBuilder;
