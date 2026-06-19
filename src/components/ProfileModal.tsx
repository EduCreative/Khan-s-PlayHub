
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ACHIEVEMENTS } from '../achievements';
import { audioService } from '../services/audioService';
import { GAMES } from '../constants';

interface ProfileModalProps {
  userProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

const AVATARS = [
  'fa-user-ninja', 'fa-user-astronaut', 'fa-user-secret', 'fa-user-tie',
  'fa-robot', 'fa-ghost', 'fa-dragon', 'fa-mask'
];

const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, onSave, onClose }) => {
  const isFirstTime = userProfile.username === 'New Player' || userProfile.username === 'Player';
  const [username, setUsername] = useState(isFirstTime ? '' : userProfile.username);
  const [email, setEmail] = useState(userProfile.email || '');
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio);

  // Parse game stats
  const gameStats = userProfile.gameStats || {};
  const statsList = Object.entries(gameStats).map(([gameId, data]) => {
    const game = GAMES.find(g => g.id === gameId);
    return {
      gameId,
      game,
      highScore: data.highScore || 0,
      sessions: data.sessions || 0,
      timeSpent: data.timeSpent || 0,
      lastPlayed: data.lastPlayed || 0
    };
  }).filter(entry => entry.game);

  // Best Score calculation
  let bestHighScore = 0;
  let bestScoreGameName = 'No Games';
  let bestScoreGameColor = 'from-slate-400 to-slate-500';
  let bestScoreGameIcon = 'fa-trophy';

  // Total Time Played calculation
  let totalTimeSeconds = userProfile.playTime || 0;
  let aggregatedTime = 0;
  statsList.forEach(s => {
    aggregatedTime += s.timeSpent;
  });
  if (totalTimeSeconds < aggregatedTime) {
    totalTimeSeconds = aggregatedTime;
  }

  // Most Played Game calculation
  let mostPlayedGameName = 'No Games';
  let mostPlayedGameIcon = 'fa-gamepad';
  let mostPlayedGameColor = 'from-slate-400 to-slate-500';
  let mostPlayedGameSessions = 0;

  statsList.forEach(s => {
    if (s.highScore > bestHighScore) {
      bestHighScore = s.highScore;
      bestScoreGameName = s.game?.name || s.gameId;
      bestScoreGameColor = s.game?.color || 'from-slate-400 to-slate-500';
      bestScoreGameIcon = s.game?.icon || 'fa-trophy';
    }

    if (s.sessions > mostPlayedGameSessions) {
      mostPlayedGameSessions = s.sessions;
      mostPlayedGameName = s.game?.name || s.gameId;
      mostPlayedGameIcon = s.game?.icon || 'fa-gamepad';
      mostPlayedGameColor = s.game?.color || 'from-slate-400 to-slate-500';
    }
  });

  const formatTimePlayed = (totalSecs: number) => {
    if (totalSecs <= 0) return '0s';
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleSave = () => {
    if (!username.trim()) {
      alert('Please enter a player name to continue.');
      return;
    }
    onSave({
      ...userProfile,
      username: username.trim(),
      email: email.trim() || undefined,
      avatar,
      bio: bio.trim() || 'Elite Player'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-lg rounded-[2.5rem] border-indigo-500/30 shadow-2xl scale-up-center overflow-hidden flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-10" />
        
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 md:p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">
              {isFirstTime ? 'Welcome Player' : 'Player Profile'}
            </h2>
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              {isFirstTime ? 'Initialize your identity' : 'Manage your digital presence'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-all"
            title="Close Profile"
          >
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-4xl text-white shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/30 relative group">
              <i className={`fas ${avatar}`}></i>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-xs shadow-lg border-2 border-slate-900">
                <i className="fas fa-check"></i>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Player Avatar</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(icon => (
                <button 
                  key={icon} 
                  onClick={() => {
                    setAvatar(icon);
                    audioService.playClick();
                  }}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 relative group ${avatar === icon ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-lg' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-indigo-500/50'}`}
                  title={`Select ${icon.replace('fa-', '')} avatar`}
                >
                  <i className={`fas ${icon}`}></i>
                  {/* Mini Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-[8px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {icon.replace('fa-user-', '').replace('fa-', '')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Player Name</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Player Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email to save progress..."
                className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Player Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your gaming style..."
                className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:border-indigo-500 outline-none transition-all h-24 resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Personal Records Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Personal Records</label>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Real-Time Telemetry
              </span>
            </div>

            {/* Stats Summary Bento Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Best Score */}
              <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col justify-between group hover:border-amber-500/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Best Score</span>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${bestHighScore > 0 ? bestScoreGameColor : 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-[8px]`}>
                    <i className={`fas ${bestScoreGameIcon}`}></i>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {bestHighScore > 0 ? bestHighScore.toLocaleString() : '0'}
                  </p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    {bestScoreGameName}
                  </p>
                </div>
              </div>

              {/* Total Time */}
              <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Time Spent</span>
                  <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[8px]">
                    <i className="fas fa-hourglass-half"></i>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {formatTimePlayed(totalTimeSeconds)}
                  </p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    Total Logged
                  </p>
                </div>
              </div>

              {/* Most Played */}
              <div className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex flex-col justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Most Played</span>
                  <div className={`w-5 h-5 rounded bg-gradient-to-br ${mostPlayedGameSessions > 0 ? mostPlayedGameColor : 'from-slate-500 to-slate-600'} flex items-center justify-center text-white text-[8px]`}>
                    <i className={`fas ${mostPlayedGameIcon}`}></i>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {mostPlayedGameSessions > 0 ? `${mostPlayedGameSessions} plays` : '0 plays'}
                  </p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest truncate">
                    {mostPlayedGameName}
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Game Stats List */}
            {statsList.length > 0 ? (
              <div className="p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl space-y-3">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Neural Performance Logs</p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
                  {statsList.map((stat, idx) => {
                    const game = stat.game!;
                    // Max session percentage tracker for the indicator bar
                    const maxSessions = Math.max(...statsList.map(s => s.sessions), 1);
                    const progressPercent = Math.min(100, Math.round((stat.sessions / maxSessions) * 100));

                    return (
                      <div key={idx} className="flex flex-col p-2.5 rounded-xl bg-slate-200/50 dark:bg-white/5 border border-slate-350 dark:border-white/5 hover:border-indigo-500/25 transition-all text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${game.color} flex items-center justify-center text-white text-[8px]`}>
                              <i className={`fas ${game.icon}`}></i>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white text-[11px]">{game.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold">
                            High: {stat.highScore.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1 font-bold uppercase">
                          <span>{stat.sessions} Sessions</span>
                          <span>{formatTimePlayed(stat.timeSpent)} played</span>
                        </div>

                        {/* Progress Bar visual indicator */}
                        <div className="w-full h-1 bg-slate-300 dark:bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${game.color}`} 
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-100 dark:bg-white/3 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-center">
                <i className="fas fa-chart-line text-slate-400 dark:text-slate-600 text-2xl mb-2 animate-pulse"></i>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-normal">
                  Neural Records Uncompiled
                </p>
                <p className="text-[9px] text-slate-400 font-medium max-w-xs mx-auto mt-1 leading-normal">
                  Engage in micro-games to calibrate your digital footprint and load cognitive metrics.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Achievements</label>
              <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                {userProfile.achievements?.length || 0} / {ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = userProfile.achievements?.includes(ach.id);
                return (
                  <div 
                    key={ach.id} 
                    className={`aspect-square rounded-xl flex items-center justify-center text-xl transition-all relative group ${isUnlocked ? `bg-${ach.color}-500/20 text-${ach.color}-500 border-2 border-${ach.color}-500/50 shadow-lg shadow-${ach.color}-500/20` : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-700 border-2 border-slate-200 dark:border-white/5'}`}
                  >
                    <i className={`fas ${ach.icon}`}></i>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 p-3 bg-slate-900 border border-white/10 rounded-xl text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center shadow-2xl">
                      <p className="text-indigo-400 uppercase mb-1">{ach.name}</p>
                      <p className="text-slate-400 font-medium leading-tight">{ach.description}</p>
                      {!isUnlocked && <p className="text-rose-500 mt-2 uppercase italic text-[8px] tracking-widest">[LOCKED]</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 md:p-8 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 shrink-0">
          <button 
            onClick={handleSave}
            title="Save your player profile and sync to cloud"
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-500/40 uppercase italic tracking-tighter flex items-center justify-center gap-3"
          >
            <i className="fas fa-save text-sm"></i>
            {isFirstTime ? 'Create Player Identity' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
