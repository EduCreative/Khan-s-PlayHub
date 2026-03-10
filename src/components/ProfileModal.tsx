
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ACHIEVEMENTS } from '../achievements';
import { audioService } from '../services/audioService';

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
  const isFirstTime = userProfile.username === 'New Player' || userProfile.username === 'Operative';
  const [username, setUsername] = useState(isFirstTime ? '' : userProfile.username);
  const [email, setEmail] = useState(userProfile.email || '');
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio);

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
