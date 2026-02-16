
import React, { useState, useEffect, useCallback, useRef } from 'react';

interface PulseNode {
  id: number;
  time: number; // Normalized position [0, 1] across the screen
  lane: number; // 0 or 1 (Top or Bottom)
  hit: boolean;
  missed: boolean;
}

const PulseWave: React.FC<{ onGameOver: (s: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [nodes, setNodes] = useState<PulseNode[]>([]);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [integrity, setIntegrity] = useState(100);
  const [wavePos, setWavePos] = useState(0); // Current position of the pulse line [0, 1]

  const scoreRef = useRef(0);
  const integrityRef = useRef(100);
  const multiplierRef = useRef(1);
  const nodesRef = useRef<PulseNode[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  const spawnNode = useCallback((initial: boolean = false) => {
    // If initial, distribute across screen. If not, spawn ahead.
    const time = initial ? Math.random() * 0.8 + 0.1 : 0.4 + Math.random() * 0.5;
    const newNode: PulseNode = {
      id: Math.random(),
      time,
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
      
      // Initial population so the screen isn't empty
      for(let i = 0; i < 4; i++) spawnNode(true);
    }
  }, [isPlaying, spawnNode]);

  useEffect(() => {
    if (!isPlaying || integrityRef.current <= 0) return;

    const loop = (time: number) => {
      const dt = (time - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = time;

      // Update wave position - cycle every 1.5 seconds
      setWavePos(prev => {
        let next = prev + dt * 0.65;
        if (next >= 1) {
          next = 0;
          // When wave resets, spawn new nodes if we are running low
          if (nodesRef.current.length < 6) {
            spawnNode();
            spawnNode();
          }
        }
        return next;
      });

      // Handle Misses and cleanup
      nodesRef.current = nodesRef.current.map(n => {
        // A node is missed if the wave has passed it by more than the hit window
        // and it hasn't been hit yet.
        if (!n.hit && !n.missed && wavePos > n.time + 0.08) {
          integrityRef.current -= 12;
          multiplierRef.current = 1;
          setIntegrity(Math.max(0, integrityRef.current));
          setMultiplier(1);
          return { ...n, missed: true };
        }
        return n;
      }).filter(n => {
        // Keep nodes that are either ahead of the wave, 
        // or just behind it but still in the "hit/miss animation" phase
        if (n.hit || n.missed) return wavePos < n.time + 0.2;
        return true;
      });

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

    // Hit window is quite generous for mobile: +/- 12% of screen width
    const HIT_THRESHOLD = 0.12;
    
    // Find valid candidate: right lane, not hit/missed, within wave window
    const targetIndex = nodesRef.current.findIndex(n => 
      n.lane === lane && 
      !n.hit && 
      !n.missed && 
      Math.abs(n.time - wavePos) < HIT_THRESHOLD
    );

    if (targetIndex !== -1) {
      const targetNode = nodesRef.current[targetIndex];
      const accuracy = 1 - Math.abs(targetNode.time - wavePos) / HIT_THRESHOLD;
      const points = Math.floor(150 * accuracy * multiplierRef.current);
      
      scoreRef.current += points;
      multiplierRef.current = Math.min(10, multiplierRef.current + 0.2);
      
      setScore(scoreRef.current);
      setMultiplier(multiplierRef.current);
      
      nodesRef.current[targetIndex].hit = true;
      setNodes([...nodesRef.current]);
    } else {
      // Penalty for phantom tap (prevents spamming)
      integrityRef.current = Math.max(0, integrityRef.current - 4);
      multiplierRef.current = 1;
      setIntegrity(integrityRef.current);
      setMultiplier(1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg h-full animate-in fade-in zoom-in duration-500 select-none px-4">
      <div className="w-full flex justify-between items-center glass-card p-5 rounded-3xl border-pink-500/20 border-2 shadow-xl z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity</span>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden mt-1 border border-white/5">
            <div 
              className={`h-full transition-all duration-300 ${integrity < 30 ? 'bg-rose-500 animate-pulse' : 'bg-pink-500'}`} 
              style={{ width: `${integrity}%` }} 
            />
          </div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Combo</span>
          <p className="text-2xl font-black text-pink-500 italic">x{multiplier.toFixed(1)}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sync Score</span>
          <p className="text-3xl font-black text-indigo-400 italic tabular-nums">{score.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex-1 w-full relative bg-slate-950 rounded-[3rem] border-4 border-slate-800 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.03] pointer-events-none" />
        
        {/* Play Lanes Dividers */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          <div className="flex-1 border-b border-white/5 flex items-center justify-center">
             <span className="text-[8px] font-black text-white/5 uppercase tracking-[1em] rotate-90">Upper Register</span>
          </div>
          <div className="flex-1 flex items-center justify-center">
             <span className="text-[8px] font-black text-white/5 uppercase tracking-[1em] rotate-90">Lower Register</span>
          </div>
        </div>

        {/* The Pulse Wave Line */}
        <div 
          className="absolute inset-y-0 w-1 bg-white pointer-events-none z-30 transition-shadow"
          style={{ 
            left: `${wavePos * 100}%`,
            boxShadow: `0 0 20px 4px rgba(236, 72, 153, 0.8), 0 0 40px 10px rgba(236, 72, 153, 0.3)`
          }}
        >
           <div className="absolute top-0 bottom-0 -left-8 -right-8 bg-pink-500/10 blur-xl" />
        </div>

        {/* Nodes Rendering */}
        {nodes.map(node => (
          <div
            key={node.id}
            className={`absolute w-14 h-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-200 ${
              node.hit ? 'scale-[2.5] opacity-0 bg-emerald-400 border-emerald-300' :
              node.missed ? 'scale-50 opacity-0 bg-rose-600 border-rose-500' :
              'bg-slate-900/80 border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.5)] z-20'
            }`}
            style={{ 
              left: `${node.time * 100}%`, 
              top: node.lane === 0 ? '25%' : '75%' 
            }}
          >
            {/* Center Core of Node */}
            <div className={`absolute inset-3 rounded-full ${node.hit ? 'bg-white' : 'bg-pink-500'} animate-pulse`} />
            
            {!node.hit && !node.missed && (
               <>
                 <div className="absolute inset-0 rounded-full border border-pink-400/30 animate-ping" />
                 {/* Visual indicator of hit window */}
                 <div className="absolute -inset-2 rounded-full border border-white/5 border-dashed" />
               </>
            )}
          </div>
        ))}

        {/* Lane Interaction Areas - 50/50 split */}
        <div className="absolute inset-0 flex flex-col z-40">
          <button 
            onPointerDown={(e) => { e.preventDefault(); handleTap(0); }}
            className="flex-1 w-full active:bg-pink-500/10 transition-colors outline-none touch-none"
            aria-label="Tap Upper Lane"
          />
          <button 
            onPointerDown={(e) => { e.preventDefault(); handleTap(1); }}
            className="flex-1 w-full active:bg-pink-500/10 transition-colors outline-none touch-none"
            aria-label="Tap Lower Lane"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-6 py-2 rounded-full border border-white/5 mb-2">
        <i className="fas fa-bolt text-pink-500 animate-pulse"></i>
        <span>Tap the lane when the line hits the center of a node!</span>
      </div>
    </div>
  );
};

export default PulseWave;
