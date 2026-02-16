
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface PulseNode {
  id: number;
  time: number; // Normalized time [0, 1] across the screen
  lane: number; // 0 or 1
  hit: boolean;
  missed: boolean;
}

const PulseWave: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [nodes, setNodes] = useState<PulseNode[]>([]);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [integrity, setIntegrity] = useState(100);
  const [wavePos, setWavePos] = useState(0); // [0, 1]

  const scoreRef = useRef(0);
  const integrityRef = useRef(100);
  const multiplierRef = useRef(1);
  const nodesRef = useRef<PulseNode[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const spawnNode = useCallback(() => {
    const newNode: PulseNode = {
      id: Math.random(),
      time: 0.8 + Math.random() * 0.2, // Spawn ahead of the wave
      lane: Math.floor(Math.random() * 2),
      hit: false,
      missed: false,
    };
    nodesRef.current.push(newNode);
    setNodes([...nodesRef.current]);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      scoreRef.current = 0;
      integrityRef.current = 100;
      multiplierRef.current = 1;
      nodesRef.current = [];
      setScore(0);
      setIntegrity(100);
      setMultiplier(1);
      setNodes([]);
      setWavePos(0);
      lastUpdateRef.current = performance.now();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || integrityRef.current <= 0) return;

    const loop = (time: number) => {
      const dt = (time - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = time;

      // Update wave position
      setWavePos(prev => {
        let next = prev + dt * 0.8;
        if (next >= 1) {
          next = 0;
          // Spawn new nodes at start of wave cycle if needed
          if (nodesRef.current.length < 5) spawnNode();
        }
        return next;
      });

      // Update nodes and check for misses
      nodesRef.current = nodesRef.current.map(n => {
        if (!n.hit && !n.missed && n.time < wavePos - 0.1) {
          integrityRef.current -= 10;
          multiplierRef.current = 1;
          setIntegrity(integrityRef.current);
          setMultiplier(1);
          return { ...n, missed: true };
        }
        return n;
      }).filter(n => n.time > wavePos - 0.5); // Cleanup old nodes

      setNodes([...nodesRef.current]);

      if (integrityRef.current <= 0) {
        onGameOver(scoreRef.current);
        return;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, [isPlaying, spawnNode, onGameOver, wavePos]);

  const handleTap = (lane: number) => {
    if (!isPlaying || integrityRef.current <= 0) return;

    // Find the node closest to the wave position in this lane
    const targetNode = nodesRef.current.find(n => n.lane === lane && !n.hit && !n.missed && Math.abs(n.time - wavePos) < 0.15);

    if (targetNode) {
      const accuracy = 1 - Math.abs(targetNode.time - wavePos) / 0.15;
      const points = Math.floor(100 * accuracy * multiplierRef.current);
      scoreRef.current += points;
      multiplierRef.current = Math.min(8, multiplierRef.current + 0.1);
      
      setScore(scoreRef.current);
      setMultiplier(multiplierRef.current);
      
      targetNode.hit = true;
      setNodes([...nodesRef.current]);
    } else {
      // Penalty for phantom tap
      integrityRef.current -= 2;
      multiplierRef.current = 1;
      setIntegrity(integrityRef.current);
      setMultiplier(1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg h-full animate-in fade-in zoom-in duration-500 select-none">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-pink-500/20 border-2 shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-pink-500 transition-all" style={{ width: `${integrity}%` }} />
          </div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multiplier</span>
          <p className="text-2xl font-black text-pink-500 italic">x{multiplier.toFixed(1)}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-900 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden px-10">
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        {/* Play Lanes */}
        <div className="absolute inset-y-0 left-0 right-0 flex flex-col justify-around py-20 pointer-events-none">
          <div className="h-px bg-white/10 w-full" />
          <div className="h-px bg-white/10 w-full" />
        </div>

        {/* The Pulse Wave */}
        <div 
          className="absolute inset-y-0 w-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent shadow-[0_0_20px_rgba(236,72,153,0.8)] z-10"
          style={{ left: `${wavePos * 100}%` }}
        />

        {/* Nodes */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-150 ${
              node.hit ? 'scale-150 opacity-0 bg-emerald-500 border-emerald-400' :
              node.missed ? 'scale-50 opacity-0 bg-rose-500 border-rose-400' :
              'bg-slate-800 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
            }`}
            style={{ 
              left: `${node.time * 100}%`, 
              top: node.lane === 0 ? '33%' : '66%' 
            }}
          >
            {!node.hit && !node.missed && (
               <div className="absolute inset-0 rounded-full border border-pink-500/20 animate-ping" />
            )}
          </div>
        ))}

        {/* Interaction Areas */}
        <div className="absolute inset-0 flex flex-col">
          <button 
            onPointerDown={() => handleTap(0)}
            className="flex-1 w-full active:bg-pink-500/10 transition-colors"
          />
          <button 
            onPointerDown={() => handleTap(1)}
            className="flex-1 w-full active:bg-pink-500/10 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-6 py-2 rounded-full border border-white/5">
        <i className="fas fa-hand-pointer text-pink-500"></i>
        <span>Tap lane when the wave hits the node!</span>
      </div>
    </div>
  );
};

export default PulseWave;
