
import React from 'react';

interface SettingsModalProps {
  sfxVolume: number;
  hapticFeedback: boolean;
  isDarkMode: boolean;
  onUpdateSfx: (val: number) => void;
  onUpdateHaptic: (val: boolean) => void;
  onToggleTheme: () => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  sfxVolume, hapticFeedback, isDarkMode, onUpdateSfx, onUpdateHaptic, onToggleTheme, onClose 
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-md p-8 rounded-[3rem] border-indigo-500/30 shadow-2xl scale-up-center bg-white/5 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Nexus Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-white">Dark Protocol</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Theme Mode</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <i className="fas fa-volume-up"></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-white">Audio Feedback</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SFX Volume</p>
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={sfxVolume} 
                onChange={(e) => onUpdateSfx(parseFloat(e.target.value))}
                className="w-24 accent-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <i className="fas fa-hand-pointer"></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-white">Haptic Pulse</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vibration</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdateHaptic(!hapticFeedback)}
                className={`w-14 h-8 rounded-full transition-all relative ${hapticFeedback ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${hapticFeedback ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Nexus Cloud Sync</p>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Your settings are automatically synchronized across all authorized devices in the Nexus network.</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-xl hover:bg-white/10 transition-all uppercase italic tracking-tighter"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
