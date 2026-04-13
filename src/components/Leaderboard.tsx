
import React, { useState, useEffect } from 'react';
import { cloud } from '../services/cloud';
import { Game } from '../types';
import { audioService } from '../services/audioService';

interface LeaderboardProps {
  games: Game[];
  onUpdateGlobalRecord?: (gameId: string, score: number) => void;
}

const SCORING_GUIDE = [
  { game: "Labyrinth", action: "Level Clear", scoring: "200 / 500 / 1000", note: "Based on difficulty" },
  { game: "Word Builder", action: "Bounty / Word", scoring: "100 / 5x Length", note: "Combo & Length bonuses apply" },
  { game: "Grammar Guardian", action: "Correct Answer", scoring: "10 Juice", note: "8s time penalty on miss" },
  { game: "Sudoku", action: "Full Clear", scoring: "up to 2000", note: "Difficulty + Time bonus" },
  { game: "Reaction Test", action: "Fast Response", scoring: "(1000 - avg) / 5", note: "Lower is better" },
  { game: "Color Clash", action: "Correct Match", scoring: "20 / 40 / 60", note: "Difficulty multiplier" },
  { game: "Quick Math", action: "Correct Answer", scoring: "5 * Multiplier", note: "Time penalty on miss" },
  { game: "Bit Master", action: "Decryption", scoring: "5 + Time/2", note: "Time penalty on miss" },
  { game: "Pattern Finder", action: "Correct Pattern", scoring: "20 Juice", note: "Game over on miss" },
  { game: "Fruit Vortex", action: "Match", scoring: "2 per fruit", note: "Combo multipliers apply" },
  { game: "Tetris", action: "Line Clear", scoring: "40 / 100 / 300 / 1200", note: "Level multiplier" },
  { game: "Memory Matrix", action: "Match / Level", scoring: "10 / 100", note: "Mistake penalty applies" },
  { game: "Binary Dash", action: "Process", scoring: "2 + Streak/2", note: "Integrity penalty on miss" },
  { game: "Resonance Breathing", action: "Breath Cycle", scoring: "10 Juice", note: "6 breaths per minute" },
  { game: "Neon Racer", action: "Obstacle / Collectible", scoring: "1 / 5", note: "Speed increases over time" },
  { game: "Sky Strike", action: "Enemy Destroyed", scoring: "10 / 30", note: "Auto-fire on touch" }
];

const Leaderboard: React.FC<LeaderboardProps & { onBack?: () => void }> = ({ games, onBack, onUpdateGlobalRecord }) => {
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (selectedGameId) {
      setLoading(true);
      cloud.getGlobalHighScores(selectedGameId).then(data => {
        setScores(data);
        setLoading(false);
        if (selectedGameId !== 'all' && data && data.length > 0 && onUpdateGlobalRecord) {
          onUpdateGlobalRecord(selectedGameId, data[0].score);
        }
      });
    }
  }, [selectedGameId, onUpdateGlobalRecord]);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={() => {
              audioService.playNav();
              onBack();
            }} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-indigo-500 transition-all">
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black uppercase italic text-slate-900 dark:text-white">Global Leaderboard</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Player Rankings</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setShowGuide(true);
              audioService.playNav();
            }}
            className="flex items-center gap-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <i className="fas fa-info-circle"></i>
            Scoring Guide
          </button>
          <select 
            value={selectedGameId} 
            onChange={(e) => {
              setSelectedGameId(e.target.value);
              audioService.playClick();
            }}
            className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Total Score (All Games)</option>
            {games.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-[2.5rem] border-2 border-indigo-500/20 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase italic text-slate-900 dark:text-white">Scoring Protocol</h3>
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Neural Reward Calibration v2.3</p>
              </div>
              <button onClick={() => {
                setShowGuide(false);
                audioService.playNav();
              }} className="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center text-slate-500 transition-colors">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="glass-card rounded-2xl border border-indigo-500/10 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</th>
                      <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Juice Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCORING_GUIDE.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-black uppercase italic text-xs text-slate-700 dark:text-slate-200">{item.game}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{item.action}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-black text-indigo-500 text-xs">{item.scoring}</span>
                            <span className="text-[8px] text-slate-400 uppercase font-bold">{item.note}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                Difficulty Multipliers: Easy (1x) • Medium (1.5x) • Hard (2x-2.5x)
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-[2rem] border-2 border-slate-200 dark:border-indigo-500/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Player</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">
                  {selectedGameId === 'all' ? 'Total Juice' : 'Juice'}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Syncing with Cloud...</p>
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
                      <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                        {(s.score || 0).toLocaleString()}
                      </span>
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
