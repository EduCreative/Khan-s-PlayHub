
import React from 'react';

interface LeaderboardProps {
  onClose: () => void;
  userScore: number;
}

const MOCK_LEADERS = [
  { name: 'X-PHANTOM', score: 125000, avatar: 'fa-user-secret', rank: 1 },
  { name: 'NEON_WOLF', score: 98400, avatar: 'fa-paw', rank: 2 },
  { name: 'CYBER_KNG', score: 87200, avatar: 'fa-crown', rank: 3 },
  { name: 'VOLT_GIRL', score: 65000, avatar: 'fa-bolt', rank: 4 },
  { name: 'VOID_WALKER', score: 42300, avatar: 'fa-skull', rank: 5 }
];

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, userScore }) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={onClose} />
      <div className="relative glass-card w-full max-w-md p-8 border-indigo-500/30 shadow-3xl rounded-[3rem] animate-in slide-in-from-bottom-12 duration-500 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <i className="fas fa-trophy text-9xl text-white"></i>
        </div>

        <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-center text-amber-500">Hall of Fame</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 text-center mb-8">Legendary Nexus Operatives</p>
        
        <div className="space-y-3 mb-8">
          {MOCK_LEADERS.map((leader) => (
            <div key={leader.rank} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${leader.rank === 1 ? 'bg-amber-400/10 border-amber-400/30' : 'bg-white/5 border-white/5'}`}>
              <div className="flex items-center gap-4">
                <span className={`text-xl font-black italic ${leader.rank === 1 ? 'text-amber-400' : leader.rank === 2 ? 'text-slate-300' : leader.rank === 3 ? 'text-orange-400' : 'text-slate-600'}`}>{leader.rank}</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${leader.rank === 1 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/60'}`}>
                  <i className={`fas ${leader.avatar}`}></i>
                </div>
                <span className="font-black uppercase italic tracking-tighter dark:text-white text-slate-900">{leader.name}</span>
              </div>
              <span className="font-black text-indigo-400 tabular-nums">{leader.score.toLocaleString()}</span>
            </div>
          ))}

          {/* User Rank Entry */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
          
          <div className="flex items-center justify-between p-5 rounded-3xl border-2 bg-indigo-600/20 border-indigo-500/40 shadow-[0_0_30px_rgba(79,70,229,0.2)] scale-105">
             <div className="flex items-center gap-4">
                <span className="text-xl font-black italic text-indigo-400">#99+</span>
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30">
                   <i className="fas fa-user-ninja"></i>
                </div>
                <div className="flex flex-col">
                   <span className="font-black uppercase italic tracking-tighter text-white">YOU</span>
                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Operative</span>
                </div>
             </div>
             <span className="font-black text-2xl text-white tabular-nums italic">{userScore.toLocaleString()}</span>
          </div>
        </div>

        <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:text-white transition-all">Close Terminal</button>
      </div>
    </div>
  );
};

export default Leaderboard;
