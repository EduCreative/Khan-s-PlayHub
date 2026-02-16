
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface Node {
  id: number;
  x: number;
  y: number;
  life: number; // 1.0 to 0.0
}

const ReflexNode: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  
  const scoreRef = useRef(0);
  const nodesRef = useRef<Node[]>([]);
  const lastSpawnRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const spawnNode = useCallback(() => {
    const newNode = {
      id: Math.random(),
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      life: 1.0,
    };
    nodesRef.current.push(newNode);
    setNodes([...nodesRef.current]);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      setScore(0);
      scoreRef.current = 0;
      setGameOver(false);
      nodesRef.current = [];
      setNodes([]);
      lastSpawnRef.current = 0;
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const loop = (time: number) => {
      const spawnRate = Math.max(400, 1200 - Math.floor(scoreRef.current / 1000) * 100);
      if (time - lastSpawnRef.current > spawnRate) {
        spawnNode();
        lastSpawnRef.current = time;
      }

      const decayRate = 0.005 + (scoreRef.current / 50000);
      const nextNodes = nodesRef.current.map(n => ({ ...n, life: n.life - decayRate }));
      
      if (nextNodes.some(n => n.life <= 0)) {
        setGameOver(true);
        onGameOver(scoreRef.current);
        return;
      }

      nodesRef.current = nextNodes;
      setNodes([...nextNodes]);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, gameOver, spawnNode, onGameOver]);

  const handleTap = (id: number) => {
    if (gameOver) return;
    const node = nodesRef.current.find(n => n.id === id);
    if (node) {
      scoreRef.current += Math.floor(node.life * 500);
      setScore(scoreRef.current);
      nodesRef.current = nodesRef.current.filter(n => n.id !== id);
      setNodes([...nodesRef.current]);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg h-full animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-orange-500/20 border-2 shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase">Active Links</span>
          <span className="text-2xl font-black text-orange-500 italic">0{nodes.length}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase">Neural XP</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden cursor-crosshair">
        <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
        {nodes.map(node => (
          <button
            key={node.id}
            onPointerDown={() => handleTap(node.id)}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            {/* Outer Ring */}
            <div 
              className="absolute inset-0 border-2 border-orange-500 rounded-full scale-[4] opacity-40 transition-transform duration-75" 
              style={{ transform: `scale(${1 + node.life * 3})`, opacity: node.life }}
            />
            {/* Core */}
            <div 
              className="relative w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.6)] flex items-center justify-center border-2 border-white/40 group-active:scale-90 transition-transform"
            >
               <i className="fas fa-bolt text-white text-xs animate-pulse"></i>
            </div>
          </button>
        ))}

        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-500">
             <i className="fas fa-unlink text-rose-500 text-5xl mb-4"></i>
             <h3 className="text-4xl font-black italic text-white uppercase tracking-tighter">Connection Lost</h3>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Neural Desync Detected</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-6 py-2 rounded-full border border-white/5">
        <i className="fas fa-hand-pointer text-orange-400"></i>
        <span>Tap nodes before they expire!</span>
      </div>
    </div>
  );
};

export default ReflexNode;
