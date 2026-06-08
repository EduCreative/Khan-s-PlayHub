import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Game } from '../types';
import { audioService } from '../services/audioService';
import Logo from './Logo';

interface ChallengeInvitationScreenProps {
  challenge: {
    id: string;
    gameId: string;
    targetScore: number;
    creatorUsername: string;
    creatorAvatar: string;
    playsCount?: number;
    bestChallengerScore?: number;
    bestChallengerName?: string;
  };
  game: Game | undefined;
  defaultUsername: string;
  isDarkMode: boolean;
  onAccept: (challengerName: string) => void;
  onDecline: () => void;
}

const ChallengeInvitationScreen: React.FC<ChallengeInvitationScreenProps> = ({
  challenge,
  game,
  defaultUsername,
  isDarkMode,
  onAccept,
  onDecline
}) => {
  const [nickName, setNickName] = useState(defaultUsername || 'Challenger_HQ');
  const [errorInput, setErrorInput] = useState('');

  if (!game) {
    return (
      <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-[#020617] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="glass-card max-w-sm p-8 rounded-3xl border border-red-500/20 text-center">
          <i className="fas fa-exclamation-circle text-4xl text-rose-500 mb-4 animate-bounce"></i>
          <h2 className="text-xl font-black uppercase">Game Not Found</h2>
          <p className="text-sm opacity-70 mt-2">The Micro-game mentioned in the challenge link was not found on this platform.</p>
          <button onClick={onDecline} className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl">Go to Hub</button>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    if (!nickName.trim()) {
      setErrorInput('Please enter a display name for the scoreboard!');
      return;
    }
    if (nickName.length > 20) {
      setErrorInput('Name must be 20 characters or fewer.');
      return;
    }
    audioService.playClick();
    onAccept(nickName.trim());
  };

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 md:p-8 ${isDarkMode ? 'bg-[#020617] bg-grid-white/[0.02]' : 'bg-slate-50 bg-grid-slate-900/[0.02]'}`}>
      {/* Ambient glows */}
      <div className={`absolute top-1/4 left-1/4 w-[30vw] h-[30vw] bg-gradient-to-br ${game.color} rounded-full filter blur-[120px] opacity-20 pointer-events-none animate-pulse`} />
      <div className="absolute bottom-1/4 right-1/4 w-[25vw] h-[25vw] bg-violet-600 rounded-full filter blur-[120px] opacity-15 pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="relative w-full max-w-xl glass-card border-2 border-indigo-500/30 dark:bg-slate-900/90 bg-white p-6 md:p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center overflow-hidden z-10"
      >
        <div className="flex items-center gap-2 mb-6">
          <Logo size={28} showGlow={true} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Khan's Duel System</span>
        </div>

        {/* Visual Dual Indicator */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 relative">
          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-[1.6rem] bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-3xl text-indigo-500 shadow-lg`}>
              <i className={`fas ${challenge.creatorAvatar || 'fa-user-astronaut'}`}></i>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white mt-2 max-w-[100px] truncate">{challenge.creatorUsername}</span>
            <span className="text-[9px] text-indigo-500 uppercase font-bold tracking-wider">CREATOR</span>
          </div>

          <div className="flex flex-col items-center justify-center text-slate-400 font-black text-xl italic py-4 animate-pulse">
            <div>VS</div>
            <i className="fas fa-swords text-amber-500 text-lg mt-1"></i>
          </div>

          <div className="flex flex-col items-center">
            <div className={`w-16 h-16 rounded-[1.6rem] bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl text-emerald-500 shadow-lg animate-pulse`}>
              <i className="fas fa-user-shield"></i>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white mt-2 max-w-[100px] truncate">{nickName || 'You'}</span>
            <span className="text-[9px] text-emerald-500 uppercase font-bold tracking-wider">CHALLENGER</span>
          </div>
        </div>

        {/* Main invitation title */}
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic text-slate-900 dark:text-white leading-none mb-3">
          Duel Request Issued!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mb-6 max-w-md">
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">{challenge.creatorUsername}</span> bets that you cannot beat their score of <span className="text-amber-500 font-black">{challenge.targetScore.toLocaleString()}</span> in <span className="italic font-bold">{game.name}</span>.
        </p>

        {/* Dynamic Telemetry Details */}
        {(challenge.playsCount !== undefined && challenge.playsCount > 0) && (
          <div className="w-full bg-slate-50 dark:bg-white/5 rounded-2xl py-3 px-4 mb-6 border border-slate-100 dark:border-white/5 flex items-center justify-around text-left">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none block">Total Plays</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{challenge.playsCount} attempts</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 leading-none block">Best Challenger</span>
              <span className="text-xs font-bold text-emerald-500">{challenge.bestChallengerName || 'None yet'} {challenge.bestChallengerScore ? `(${challenge.bestChallengerScore.toLocaleString()})` : ''}</span>
            </div>
          </div>
        )}

        {/* Target Arena Panel */}
        <div className={`w-full bg-gradient-to-br ${game.color} rounded-[2rem] p-6 text-white text-left relative overflow-hidden mb-6 shadow-xl`}>
          <div className="absolute inset-0 bg-grid-white/5 opacity-20" />
          <div className="relative z-10 flex justify-between items-start gap-4">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest opacity-80 bg-white/20 px-2 py-0.5 rounded-full inline-block leading-none">{game.category} Arena</span>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter mt-1">{game.name}</h3>
              <p className="text-xs opacity-90 font-medium line-clamp-2 mt-0.5 leading-snug">{game.tagline}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-2xl border border-white/20 shadow-lg">
              <i className={`fas ${game.icon}`}></i>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 mt-4 pt-4 border-t border-white/10">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Target score to beat</span>
              <div className="text-2xl font-black italic tabular-nums leading-none tracking-tight mt-1">
                {challenge.targetScore.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-70">Rules Checklist</span>
              <div className="text-[10px] font-black tracking-widest uppercase italic mt-1.5 flex items-center justify-end gap-1 text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Simplified Session
              </div>
            </div>
          </div>
        </div>

        {/* Username Setup Input block */}
        <div className="w-full text-left mb-6">
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1.5 pl-1">Challenger Display Name</label>
          <div className="flex gap-2">
            <span className="flex items-center justify-center bg-slate-50 dark:bg-white/5 px-4 rounded-xl border border-slate-250 dark:border-white/5 text-slate-400">
              <i className="fas fa-signature text-sm"></i>
            </span>
            <input
              type="text"
              placeholder="Enter your gamertag..."
              value={nickName}
              onChange={(e) => {
                setNickName(e.target.value.substring(0, 20));
                setErrorInput('');
              }}
              className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-white/5 rounded-xl bg-slate-50 dark:bg-white/5 dark:text-white text-slate-800 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          {errorInput && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-bold mt-1.5 pl-1.5">
              <i className="fas fa-exclamation-triangle mr-1"></i> {errorInput}
            </motion.p>
          )}
        </div>

        {/* Final Actions block */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={handleStart}
            className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-103 active:scale-97 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/30 uppercase italic tracking-wider flex items-center justify-center gap-3 cursor-pointer"
          >
            <i className="fas fa-play"></i>
            ACCEPT & PLAY DUEL
          </button>
          
          <button
            onClick={onDecline}
            className="w-full py-3.5 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer"
          >
            Cancel & Go to home portal
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChallengeInvitationScreen;
