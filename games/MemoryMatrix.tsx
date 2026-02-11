
import React, { useState, useEffect, useCallback, useRef } from 'react';

const ALL_ICONS = [
  'fa-rocket', 'fa-ghost', 'fa-dragon', 'fa-microchip',
  'fa-vial', 'fa-biohazard', 'fa-atom', 'fa-brain',
  'fa-meteor', 'fa-satellite', 'fa-robot', 'fa-user-astronaut'
];

const COLORS = [
  '#f472b6', '#60a5fa', '#34d399', '#fbbf24', 
  '#a78bfa', '#f87171', '#818cf8', '#2dd4bf',
  '#fb923c', '#c084fc', '#4ade80', '#38bdf8'
];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
}

const MemoryMatrix: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isLevelClearing, setIsLevelClearing] = useState(false);

  const previewTimeoutRef = useRef<number | null>(null);

  const playFlip = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      g.gain.setValueAtTime(0.05, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  };

  const getPairsForLevel = (lvl: number) => {
    if (lvl === 1) return 3; // 6 cards
    if (lvl === 2) return 4; // 8 cards
    if (lvl === 3) return 6; // 12 cards
    if (lvl === 4) return 8; // 16 cards
    return 10; // 20 cards max
  };

  const initLevel = useCallback((lvl: number) => {
    if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    
    setIsLevelClearing(false);
    setIsPreviewing(true);
    const numPairs = getPairsForLevel(lvl);
    const selectedIcons = ALL_ICONS.slice(0, numPairs);
    const pairIcons = [...selectedIcons, ...selectedIcons];
    
    const newCards = pairIcons
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: true, 
        isMatched: false,
        color: COLORS[ALL_ICONS.indexOf(icon)]
      }));

    setCards(newCards);
    setFlipped([]);
    
    // Explicitly hide cards after 2.5s to give players enough time
    previewTimeoutRef.current = window.setTimeout(() => {
      setCards(prev => prev.map(c => ({ ...c, isFlipped: false })));
      setIsPreviewing(false);
    }, 2500);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setLevel(1);
      setScore(0);
      setMoves(0);
      initLevel(1);
    }
    return () => {
      if (previewTimeoutRef.current) window.clearTimeout(previewTimeoutRef.current);
    };
  }, [isPlaying, initLevel]);

  const handleFlip = (id: number) => {
    if (isPreviewing || isLevelClearing || flipped.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    playFlip();
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          setCards(prev => {
            const updated = prev.map(c => 
              (c.id === first || c.id === second) ? { ...c, isMatched: true, isFlipped: true } : c
            );
            if (updated.every(c => c.isMatched)) {
              handleLevelComplete();
            }
            return updated;
          });
          setFlipped([]);
          setScore(s => s + (500 * level));
        }, 500);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, isFlipped: false } : c
          ));
          setFlipped([]);
          setScore(s => Math.max(0, s - 25));
        }, 1000);
      }
    }
  };

  const handleLevelComplete = () => {
    setIsLevelClearing(true);
    setTimeout(() => {
      const nextLevel = level + 1;
      if (nextLevel > 5) {
        onGameOver(score + 5000);
      } else {
        setLevel(nextLevel);
        initLevel(nextLevel);
      }
    }, 1500);
  };

  const getGridCols = () => {
    const count = cards.length;
    if (count <= 6) return 'grid-cols-3';
    if (count <= 8) return 'grid-cols-4';
    if (count <= 12) return 'grid-cols-3 md:grid-cols-4';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-4 md:grid-cols-5';
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg px-4 select-none">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-teal-500/20 shadow-xl border-2 transition-colors">
        <div className="flex flex-col">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Matrix Level</p>
          <div className="flex items-center gap-2">
             <span className="text-3xl font-black text-teal-500 italic">0{level}</span>
             <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-500" style={{ width: `${(level/5)*100}%` }} />
             </div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Juice</p>
          <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums drop-shadow-sm transition-colors">{score.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Moves</p>
          <p className="text-2xl font-black text-slate-500 dark:text-slate-400 tabular-nums transition-colors">{moves}</p>
        </div>
      </div>

      <div className="relative w-full aspect-square md:aspect-auto" key={level}>
        {isPreviewing && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 animate-bounce">
            <span className="bg-teal-500 text-white text-[10px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full shadow-lg">
              Memorize the Matrix!
            </span>
          </div>
        )}

        {isLevelClearing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/60 backdrop-blur-md rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
             <div className="text-center">
                <i className="fas fa-check-circle text-6xl text-teal-400 mb-4 animate-bounce"></i>
                <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">Level {level} Clear!</h3>
                <p className="text-teal-400 font-bold tracking-widest text-xs uppercase mt-2">Uploading next matrix...</p>
             </div>
          </div>
        )}

        <div className={`grid ${getGridCols()} gap-3 w-full`}>
          {cards.map(card => (
            <div 
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`
                relative aspect-square rounded-2xl cursor-pointer transition-all duration-500 preserve-3d
                ${card.isFlipped ? '[transform:rotateY(180deg)]' : ''}
                ${card.isMatched ? 'opacity-40 scale-90' : isPreviewing ? '' : 'hover:scale-105 active:scale-95'}
              `}
            >
              <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-slate-800 rounded-2xl border-2 border-white/10 shadow-lg group overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.02]" />
                <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                <div className="absolute bottom-1 right-2 text-[8px] font-black text-white/5 italic">Nexus-9</div>
              </div>
              
              <div 
                className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] flex items-center justify-center rounded-2xl border-2 shadow-2xl overflow-hidden"
                style={{ 
                  backgroundColor: `${card.color}22`, 
                  borderColor: isPreviewing ? 'rgba(255,255,255,0.4)' : card.color,
                  boxShadow: `0 0 25px ${card.color}44`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <i className={`fas ${card.icon} text-3xl md:text-4xl drop-shadow-lg`} style={{ color: card.color }}></i>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 mt-4">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] bg-slate-100 dark:bg-white/5 px-6 py-2 rounded-full border border-slate-200 dark:border-white/5 transition-colors">
          <i className="fas fa-brain text-teal-500 dark:text-teal-400"></i>
          <span className="dark:text-slate-400 text-slate-500 font-bold">Memorize before the flip!</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryMatrix;
