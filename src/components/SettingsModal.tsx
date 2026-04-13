
import React from 'react';

interface SettingsModalProps {
  sfxVolume: number;
  hapticFeedback: boolean;
  isDarkMode: boolean;
  dataProvider: 'firebase' | 'cloudflare' | 'hybrid';
  workerUrl: string;
  onUpdateSfx: (val: number) => void;
  onUpdateHaptic: (val: boolean) => void;
  onUpdateDataProvider: (val: 'firebase' | 'cloudflare' | 'hybrid') => void;
  onUpdateWorkerUrl: (val: string) => void;
  onToggleTheme: () => void;
  onClose: () => void;
  canInstall: boolean;
  isInstalled: boolean;
  onInstall: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  sfxVolume, hapticFeedback, isDarkMode, dataProvider, workerUrl,
  onUpdateSfx, onUpdateHaptic, onUpdateDataProvider, onUpdateWorkerUrl,
  onToggleTheme, onClose, canInstall, isInstalled, onInstall
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative glass-card w-full max-w-md p-8 rounded-[3rem] border-indigo-500/30 shadow-2xl scale-up-center overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <i className={`fas ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Dark Mode</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Theme Mode</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className={`w-14 h-8 rounded-full transition-all relative ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Audio Feedback */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <i className="fas fa-volume-up"></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Audio Feedback</p>
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

            {/* Haptic Pulse */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <i className="fas fa-hand-pointer"></i>
                </div>
                <div>
                  <p className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Haptic Pulse</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Vibration</p>
                </div>
              </div>
              <button 
                onClick={() => onUpdateHaptic(!hapticFeedback)}
                className={`w-14 h-8 rounded-full transition-all relative ${hapticFeedback ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${hapticFeedback ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>

          {/* Data Provider Section */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <i className="fas fa-database"></i>
              </div>
              <div>
                <p className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Data Provider</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Storage Engine</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['firebase', 'cloudflare', 'hybrid'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => onUpdateDataProvider(p)}
                  className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    dataProvider === p 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {(dataProvider === 'cloudflare' || dataProvider === 'hybrid') && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Worker URL</p>
                <input 
                  type="text" 
                  value={workerUrl}
                  onChange={(e) => onUpdateWorkerUrl(e.target.value)}
                  placeholder="https://your-worker.workers.dev"
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            )}
            
            <p className="text-[9px] text-slate-500 font-medium italic">
              {dataProvider === 'hybrid' 
                ? 'Hybrid mode writes to both Firestore and D1, and reads from Cloudflare if available.' 
                : dataProvider === 'cloudflare' 
                ? 'Cloudflare mode uses D1 for all operations. Requires a valid Worker URL.'
                : 'Firebase mode uses Firestore for all operations.'}
            </p>
          </div>

          {/* PWA Section */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <i className="fas fa-download"></i>
              </div>
              <div>
                <p className="font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">App Installation</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">PWA Status</p>
              </div>
            </div>
            
            {isInstalled ? (
              <div className="flex items-center gap-2 text-emerald-500 font-black uppercase italic text-sm">
                <i className="fas fa-check-circle"></i>
                <span>PlayHub App Mode Active</span>
              </div>
            ) : canInstall ? (
              <button 
                onClick={onInstall}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-black uppercase italic tracking-tighter hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                Install Now
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                  To install PlayHub, open this app in a <span className="text-indigo-500 font-bold">New Tab</span> outside the preview frame.
                </p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-2">Cloud Sync</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Your settings are automatically synchronized across all authorized devices.</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-[2rem] font-black text-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all uppercase italic tracking-tighter"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
