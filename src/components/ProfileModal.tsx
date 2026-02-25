
import React, { useState } from 'react';
import { UserProfile } from '../types';

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
  const [username, setUsername] = useState(userProfile.username);
  const [email, setEmail] = useState(userProfile.email || '');
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [bio, setBio] = useState(userProfile.bio);

  const handleSave = () => {
    onSave({
      ...userProfile,
      username: username || 'Operative',
      email: email || undefined,
      avatar,
      bio: bio || 'Nexus Operative'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-lg p-8 rounded-[3rem] border-indigo-500/30 shadow-2xl scale-up-center bg-white/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Nexus Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-4xl text-white shadow-2xl shadow-indigo-500/40 border-2 border-indigo-400/30">
              <i className={`fas ${avatar}`}></i>
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Select Operative Avatar</p>
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map(icon => (
                <button 
                  key={icon} 
                  onClick={() => setAvatar(icon)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${avatar === icon ? 'bg-indigo-600 border-indigo-400 text-white scale-110 shadow-lg' : 'bg-white/5 border-white/10 text-slate-500 hover:border-indigo-500/50'}`}
                >
                  <i className={`fas ${icon}`}></i>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Operative Name</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nexus Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nexus Bio</label>
              <textarea 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter bio..."
                className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-indigo-500 outline-none transition-all h-24 resize-none"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-500/40 uppercase italic tracking-tighter"
          >
            Update Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
