
import React, { useState, useEffect, useCallback } from 'react';

const ICONS = [
  'fa-rocket', 'fa-ghost', 'fa-dragon', 'fa-microchip',
  'fa-vial', 'fa-biohazard', 'fa-atom', 'fa-brain'
];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
  color: string;
}

const COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#818cf8', '#2dd4bf'];

const MemoryMatrix: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);

  const initGame = useCallback(() => {
    const pairIcons = [...ICONS, ...ICONS];
    const newCards = pairIcons
      .sort(() => Math.random() - 0.5)
      .map((icon, index) => ({
        id: index,
        icon,
        isFlipped: false,
        isMatched: false,
        color: COLORS[ICONS.indexOf(icon)]
      }));
    setCards(newCards);
    setFlipped([]);
    setScore(0);
    setMoves(0);
  }, []);

  useEffect(() => {
    if (isPlaying) initGame();
  }, [isPlaying, initGame]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || cards[id].isFlipped || cards[id].isMatched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    
    setCards(prev => prev.map(c => c.id === id ? { ...c, isFlipped: true } : c));

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].icon === cards[second].icon) {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, isMatched: true } : c
          ));
          setFlipped([]);
          setScore(s => s + 500);
          
          if (cards.filter(c => !c.isMatched).length === 2) {
            onGameOver(score + 1000);
          }
        }, 600);
      } else {
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            (c.id === first || c.id === second) ? { ...c, isFlipped: false } : c
          ));
          setFlipped([]);
          setScore(s => Math.max(0, s - 50));
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md px-4">
      <div className="w-full flex justify-between items-center glass-card p-4 rounded-3xl border-teal-500/20">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-black">Memory Score</p>
          <p className="text-2xl font-black text-teal-400 tabular-nums">{score}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-500 uppercase font-black">Moves</p>
          <p className="text-2xl font-black text-indigo-400 tabular-nums">{moves}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 w-full aspect-square">
        {cards.map(card => (
          <div 
            key={card.id}
            onClick={() => handleFlip(card.id)}
            className={`
              relative w-full h-full rounded-2xl cursor-pointer transition-all duration-500 preserve-3d
              ${card.isFlipped || card.isMatched ? '[transform:rotateY(180deg)]' : ''}
              ${card.isMatched ? 'opacity-40 scale-95' : 'hover:scale-105'}
            `}
          >
            {/* Front of Card (Hidden) */}
            <div className="absolute inset-0 backface-hidden flex items-center justify-center bg-slate-800 rounded-2xl border-2 border-white/10 shadow-lg">
              <div className="w-6 h-6 rounded-full bg-white/5 animate-pulse" />
            </div>
            
            {/* Back of Card (Shown when flipped) */}
            <div 
              className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] flex items-center justify-center rounded-2xl border-2 shadow-2xl"
              style={{ 
                backgroundColor: `${card.color}22`, 
                borderColor: card.color,
                boxShadow: `0 0 20px ${card.color}44`
              }}
            >
              <i className={`fas ${card.icon} text-3xl`} style={{ color: card.color }}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="text-slate-500 text-xs text-center flex items-center gap-2">
        <i className="fas fa-th-large"></i> Find all matching pairs to win!
      </div>
    </div>
  );
};

export default MemoryMatrix;
