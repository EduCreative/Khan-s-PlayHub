
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileModalProps {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}

const AVATARS = ['fa-user-ninja', 'fa-ghost', 'fa-robot', 'fa-dragon', 'fa-mask', 'fa-user-astronaut', 'fa-microchip', 'fa-atom'];

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [username, setUsername] = useState(profile.username);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [bio, setBio] = useState(profile.bio);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md p-8 border-indigo-500/30 shadow-3xl rounded-[3rem] animate-in zoom-in duration-500">
        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-8 text-center text-indigo-400">Operative Identity</h2>
        
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4">
             <div className="w-24 h-24 rounded-[2rem] bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center text-4xl text-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                <i className={`fas ${avatar}`}></i>
             </div>
             <div className="grid grid-cols-4 gap-2">
                {AVATARS.map(a => (
                  <button key={a} onClick={() => setAvatar(a)} className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${avatar === a ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                    <i className={`fas ${a} text-xs`}></i>
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Neural Handle</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 px-6 text-xl font-black uppercase italic tracking-tighter text-indigo-400 focus:border-indigo-500 outline-none transition-all"
              placeholder="ENTER CALLSIGN..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">Mission Log Bio</label>
            <textarea 
              value={bio} 
              onChange={e => setBio(e.target.value)}
              className="w-full bg-white/5 border-2 border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-slate-400 focus:border-indigo-500 outline-none transition-all resize-none h-24"
              placeholder="Define your existence in the nexus..."
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
             <button onClick={() => onSave({ ...profile, username, avatar, bio })} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-tighter text-xl shadow-xl shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">Synchronize Profile</button>
             <button onClick={onClose} className="w-full py-3 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:text-slate-300 transition-colors">Abort Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
