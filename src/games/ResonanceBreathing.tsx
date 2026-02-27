
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const ResonanceBreathing: React.FC<{ onGameOver: (score: number) => void; isPlaying: boolean }> = ({ onGameOver, isPlaying }) => {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [cycleCount, setCycleCount] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes

  useEffect(() => {
    if (!isPlaying) {
      setIsActive(false);
      setTimer(300);
      setCycleCount(0);
      setPhase('inhale');
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isActive || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setIsActive(false);
          onGameOver(cycleCount * 10);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timer, cycleCount, onGameOver]);

  useEffect(() => {
    if (!isActive) return;

    const breathInterval = setInterval(() => {
      setPhase(prev => {
        if (prev === 'inhale') return 'exhale';
        setCycleCount(c => c + 1);
        return 'inhale';
      });
    }, 5000); // 5s inhale, 5s exhale = 10s cycle = 6 breaths/min

    return () => clearInterval(breathInterval);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isActive && timer === 300) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
        <div className="w-32 h-32 rounded-full bg-indigo-500/20 flex items-center justify-center mb-8 animate-pulse">
          <i className="fas fa-lotus text-6xl text-indigo-500"></i>
        </div>
        <h2 className="text-3xl font-black uppercase italic text-white mb-4">Resonance Breathing</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Coherent breathing at the scientifically optimal rate of 6 breaths per minute. 
          Follow the lotus to synchronize your nervous system.
        </p>
        <button 
          onClick={() => setIsActive(true)}
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/40 uppercase italic tracking-tighter"
        >
          Begin Session
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg px-4">
      <div className="w-full flex justify-between items-center mb-12 glass-card p-6 rounded-3xl border-white/10">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-slate-500 uppercase">Timer</span>
          <span className="text-2xl font-black text-indigo-500 tabular-nums">{formatTime(timer)}</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase">Cycles</span>
          <span className="text-2xl font-black text-white tabular-nums">{cycleCount}</span>
        </div>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Glow */}
        <motion.div 
          animate={{ 
            scale: phase === 'inhale' ? 1.5 : 1,
            opacity: phase === 'inhale' ? 0.5 : 0.2
          }}
          transition={{ duration: 5, ease: "easeInOut" }}
          className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl"
        />

        {/* Lotus Icon */}
        <motion.div
          animate={{ 
            scale: phase === 'inhale' ? 1.2 : 0.8,
            rotate: phase === 'inhale' ? 45 : 0
          }}
          transition={{ duration: 5, ease: "easeInOut" }}
          className="relative z-10 text-8xl text-indigo-400 drop-shadow-[0_0_30px_rgba(99,102,241,0.8)]"
        >
          <i className="fas fa-lotus"></i>
        </motion.div>

        {/* Breathing Text */}
        <div className="absolute -bottom-16 left-0 right-0 text-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-2xl font-black uppercase italic tracking-widest text-white"
            >
              {phase === 'inhale' ? 'Breathe In' : 'Breathe Out'}
            </motion.p>
          </AnimatePresence>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2">Coherence Protocol Active</p>
        </div>
      </div>

      <button 
        onClick={() => {
          setIsActive(false);
          onGameOver(cycleCount * 10);
        }}
        className="mt-32 px-8 py-3 bg-white/5 border border-white/10 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500/10 transition-all"
      >
        End Session Early
      </button>
    </div>
  );
};

export default ResonanceBreathing;
