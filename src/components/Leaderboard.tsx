
import React, { useState, useEffect } from 'react';
import { cloud } from '../services/cloud';
import { Game } from '../types';

interface LeaderboardProps {
  games: Game[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ games }) => {
  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || '');
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedGameId) {
      setLoading(true);
      cloud.getGlobalHighScores(selectedGameId).then(data => {
        setScores(data);
        setLoading(false);
      });
    }
  }, [selectedGameId]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white">Global Leaderboard</h2>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nexus Neural Rankings</p>
        </div>
        
        <select 
          value={selectedGameId} 
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
        >
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <div className="glass-card rounded-[2rem] border-2 border-slate-200 dark:border-indigo-500/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Juice</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing with Nexus Cloud...</p>
                    </div>
                  </td>
                </tr>
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <p className="text-slate-500 font-medium italic">No neural data recorded for this sector yet.</p>
                  </td>
                </tr>
              ) : (
                scores.map((s, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black italic ${
                        idx === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' :
                        idx === 1 ? 'bg-slate-300 text-slate-700' :
                        idx === 2 ? 'bg-orange-400 text-white' :
                        'text-slate-400'
                      }`}>
                        {idx + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                          <i className={`fas ${s.avatar || 'fa-user-ninja'} text-xs`}></i>
                        </div>
                        <span className="font-black uppercase italic text-slate-700 dark:text-slate-200">{s.username || 'Anonymous'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{(s.score || 0).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
